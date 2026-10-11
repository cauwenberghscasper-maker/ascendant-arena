"""Measure the hero skeleton with a pose network instead of mesh heuristics.

Renders the cleaned mesh front-on (orthographic, textured point splats), runs the MediaPipe
BlazePose GHUM heavy landmark model on it, maps the 2D joints back onto the mesh and takes each
joint's depth from the middle of the mesh cross-section at that spot.

python tools/v4_pose.py CLEAN.glb OUT.json [PREVIEW.png] [--override key=x,y,z ...]
Needs pose_landmark_heavy.tflite (npm @mediapipe/pose, Apache-2.0); path in $POSE_MODEL or
tools/.gen/pose_landmark_heavy.tflite. Output format matches tools/v4_landmarks.py.
"""
import json, os, sys
import numpy as np
import trimesh
from PIL import Image, ImageDraw

MODEL = os.environ.get('POSE_MODEL', os.path.join(os.path.dirname(__file__), '.gen/pose_landmark_heavy.tflite'))
RES = 768


def load(path):
    scene = trimesh.load(path, force='scene')
    mesh = scene.to_geometry() if hasattr(scene, 'to_geometry') else scene
    return mesh


def textured_points(mesh, n=600000):
    pts, fi = trimesh.sample.sample_surface(mesh, n, seed=5)
    col = np.full((len(pts), 3), 180, np.uint8)
    vis = mesh.visual
    try:
        uv = vis.uv
        tex = vis.material.baseColorTexture
        if uv is not None and tex is not None:
            tri = mesh.triangles[fi]
            bary = trimesh.triangles.points_to_barycentric(tri, pts)
            fuv = uv[mesh.faces[fi]]
            puv = np.einsum('ij,ijk->ik', bary, fuv)
            img = np.asarray(tex.convert('RGB'))
            h, w = img.shape[:2]
            px = np.clip((puv[:, 0] % 1) * (w - 1), 0, w - 1).astype(int)
            py = np.clip((1 - puv[:, 1] % 1) * (h - 1), 0, h - 1).astype(int)
            col = img[py, px]
    except Exception as e:  # untextured meshes still render as grey clay
        print('texture lookup failed:', e, file=sys.stderr)
    return pts, col


def render_front(pts, col, box):
    """Orthographic front view (camera on +Z looking at -Z), nearest point wins."""
    (x0, y0, size) = box
    img = np.full((RES, RES, 3), 200, np.uint8)
    depth = np.full((RES, RES), -np.inf)
    u = ((pts[:, 0] - x0) / size * RES).astype(int)
    v = ((y0 + size - pts[:, 1]) / size * RES).astype(int)
    for du in (0, 1):
        for dv in (0, 1):
            uu, vv = u + du, v + dv
            ok = (uu >= 0) & (uu < RES) & (vv >= 0) & (vv < RES)
            order = np.argsort(pts[ok, 2])  # far first, near overwrites
            uu, vv, z, c = uu[ok][order], vv[ok][order], pts[ok, 2][order], col[ok][order]
            img[vv, uu] = c
            depth[vv, uu] = np.maximum(depth[vv, uu], z)
    return img


def run_pose(img):
    from ai_edge_litert.interpreter import Interpreter
    it = Interpreter(MODEL)
    it.allocate_tensors()
    x = np.asarray(Image.fromarray(img).resize((256, 256), Image.BILINEAR), np.float32)[None] / 255.0
    it.set_tensor(it.get_input_details()[0]['index'], x)
    it.invoke()
    out = {d['name']: it.get_tensor(d['index']) for d in it.get_output_details()}
    lm = out['Identity'].reshape(39, 5)
    score = float(out['Identity_1'].ravel()[0])
    return lm, score


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    ov = {}
    if '--override' in sys.argv:
        for kv in sys.argv[sys.argv.index('--override') + 1:]:
            k, v = kv.split('=')
            ov[k] = [float(t) for t in v.split(',')]
    mesh = load(args[0])
    V = np.asarray(mesh.vertices)
    pts, col = textured_points(mesh)
    lo, hi = V.min(0), V.max(0)
    cx, cy = (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2
    key = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
    best = None
    frames = [(pad, dy) for pad in (1.05, 1.15, 1.3, 1.45) for dy in (0.0, 0.06)]
    boxes = []
    for pad, dy in frames:
        size = max(hi[0] - lo[0], hi[1] - lo[1]) * pad
        boxes.append((cx - size / 2, cy - size / 2 + dy, size))
    # shaded mesh renders read far better to the network than point splats; splats are the fallback
    import subprocess, tempfile
    tmp = tempfile.mkdtemp()
    rendered = subprocess.run(['node', os.path.join(os.path.dirname(__file__), 'v4_front.mjs'), args[0], tmp + '/f',
                               ';'.join(','.join(str(v) for v in b) for b in boxes)], capture_output=True, text=True)
    for i, box in enumerate(boxes):
        size = box[2]
        f = f'{tmp}/f{i}.png'
        imgs = [render_front(pts, col, box)]
        if os.path.exists(f):
            imgs.insert(0, np.asarray(Image.open(f).convert('RGB')))
        for img in imgs:
            lm, score = run_pose(img)
            conf = float(np.mean(1 / (1 + np.exp(-lm[key, 3])))) * score
            # a sane A-pose has the wrists above the knees and the shoulders above the hips
            if lm[15, 1] > lm[25, 1] or lm[16, 1] > lm[26, 1] or lm[11, 1] > lm[23, 1]:
                conf *= 0.3
            if best is None or conf > best[0]:
                best = (conf, size, box, img, lm, score)
    conf, size, box, img, lm, score = best
    to_mesh = lambda p: np.array([box[0] + p[0] / 256 * size, box[1] + size - p[1] / 256 * size])
    L = {i: to_mesh(lm[i]) for i in range(33)}

    def depth_at(xy, r=0.025):
        d = np.linalg.norm(pts[:, :2] - xy, axis=1)
        near = pts[d < r]
        if len(near) < 8:
            near = pts[np.argsort(d)[:40]]
        return (near[:, 2].min() + near[:, 2].max()) / 2

    def J3(xy):
        return np.array([xy[0], xy[1], depth_at(xy)])
    J = {}
    # MediaPipe left = the character's own left = +X here (camera looks at the face)
    for s, (sh, el, wr, pk, ix, hp, kn, an, ft) in (('l', (11, 13, 15, 17, 19, 23, 25, 27, 31)), ('r', (12, 14, 16, 18, 20, 24, 26, 28, 32))):
        J['upperarm' + s] = J3(L[sh])
        J['lowerarm' + s] = J3(L[el])
        J['hand' + s] = J3(L[wr])
        tip = (L[pk] + L[ix]) / 2
        tip = L[wr] + (tip - L[wr]) * 1.6
        J['hand_tip' + s] = J3(tip)
        J['upperleg' + s] = J3(L[hp])
        J['lowerleg' + s] = J3(L[kn])
        J['foot' + s] = J3(L[an])
        foot = pts[(np.abs(pts[:, 0] - L[an][0]) < 0.05) & (pts[:, 1] < L[an][1])]
        J['toe' + s] = np.array([L[an][0], min(0.02, L[an][1] * 0.4), np.percentile(foot[:, 2], 97) if len(foot) else J['foot' + s][2] + 0.06])
    # armoured gauntlets can hide the wrists from the network: fall back to the outstretched arm tips
    sig = lambda i: 1 / (1 + np.exp(-lm[i, 3]))
    hip_y = (L[23][1] + L[24][1]) / 2
    for s, sign, el, wr in (('l', 1, 13, 15), ('r', -1, 14, 16)):
        if sig(wr) > 0.5 and sig(el) > 0.5 and L[wr][1] > L[25 if s == "l" else 26][1]:
            continue
        side = pts[(sign * pts[:, 0] > 0.08) & (pts[:, 1] > hip_y)]
        tip = side[np.argmax(sign * side[:, 0])]
        sh = J['upperarm' + s]
        d = (tip - sh) / np.linalg.norm(tip - sh)
        wrist = tip - d * 0.085
        J['hand_tip' + s] = tip
        J['hand' + s] = J3(wrist[:2])
        J['lowerarm' + s] = J3(((sh + J['hand' + s]) / 2)[:2])
        print('arm fallback', s, file=sys.stderr)
    # the arm root sits a little inside the network's shoulder point, which hugs the deltoid surface
    zc = depth_at(np.array([0.0, (L[11][1] + L[23][1]) / 2]), 0.04)
    for s in 'lr':
        J['upperarm' + s][2] = zc
    hip_mid = (J['upperlegl'] + J['upperlegr']) / 2
    sh_mid = (J['upperarml'] + J['upperarmr']) / 2
    for s in 'lr':
        J['upperleg' + s][2] = zc
    J['chest'] = np.array([0.0, hip_mid[1] + (sh_mid[1] - hip_mid[1]) * 0.28, zc])
    nose = L[0]
    J['head'] = np.array([0.0, sh_mid[1] + (nose[1] - sh_mid[1]) * 0.45, zc])
    J['head_top'] = np.array([0.0, float(V[:, 1].max()), zc])
    for k, v in ov.items():
        J[k] = np.array(v, float)
    vis = {n: round(float(1 / (1 + np.exp(-lm[i, 3]))), 3) for n, i in (('shoulders', 11), ('elbowL', 13), ('wristL', 15), ('hipL', 23), ('kneeL', 25), ('ankleL', 27))}
    out = {'normalize': {'scale': 1.0, 'offset': [0, 0, 0]}, 'joints': {k: [round(float(t), 4) for t in v] for k, v in J.items()},
           'info': {'poseScore': score, 'confidence': conf, 'visibility': vis, 'box': list(map(float, box))}}
    json.dump(out, open(args[1], 'w'), indent=1)
    if len(args) > 2:
        pv = Image.fromarray(img)
        d = ImageDraw.Draw(pv)
        P = lambda p: ((p[0] - box[0]) / size * RES, (box[1] + size - p[1]) / size * RES)
        bones = [('chest', 'head'), ('head', 'head_top'), ('chest', 'upperarml'), ('chest', 'upperarmr'), ('chest', 'upperlegl'), ('chest', 'upperlegr')] + [
            (a + s, b + s) for s in 'lr' for a, b in (('upperarm', 'lowerarm'), ('lowerarm', 'hand'), ('hand', 'hand_tip'), ('upperleg', 'lowerleg'), ('lowerleg', 'foot'), ('foot', 'toe'))]
        for a, b in bones:
            d.line((*P(J[a]), *P(J[b])), fill=(255, 200, 40), width=3)
        for v in J.values():
            x, y = P(v)
            d.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(40, 220, 255))
        # side view strip: z vs y
        side = Image.new('RGB', (RES // 2, RES), (30, 32, 36))
        ds = ImageDraw.Draw(side)
        S = lambda p: (RES / 4 + p[2] / size * RES, (box[1] + size - p[1]) / size * RES)
        for p in pts[::15]:
            ds.point(S(p), fill=(120, 125, 135))
        for a, b in bones:
            ds.line((*S(J[a]), *S(J[b])), fill=(255, 200, 40), width=3)
        sheet = Image.new('RGB', (RES + RES // 2, RES))
        sheet.paste(pv, (0, 0))
        sheet.paste(side, (RES, 0))
        sheet.save(args[2])
    print(json.dumps(out['info']))


if __name__ == '__main__':
    main()
