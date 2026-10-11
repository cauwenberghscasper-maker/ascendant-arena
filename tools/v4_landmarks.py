"""Measure a 13-joint humanoid skeleton on an A-pose character mesh (TRELLIS.2 output).

Usage: python tools/v4_landmarks.py MODEL.glb OUT.json [PREVIEW.png] [--override key=x,y,z ...]
The mesh is normalised in the output frame: feet on y=0, height 1, centred on x/z, facing +Z.
Character left ('l') is +X. Joints follow the KayKit names used by the game's animation clips.
"""
import json, sys
import numpy as np
import trimesh


def load(path):
    scene = trimesh.load(path, force='scene')
    mesh = scene.to_geometry() if hasattr(scene, 'to_geometry') else scene
    v = np.asarray(mesh.vertices, dtype=np.float64)
    lo, hi = v.min(0), v.max(0)
    s = 1.0 / (hi[1] - lo[1])
    lower = v[v[:, 1] < lo[1] + 0.35 * (hi[1] - lo[1])]
    off = np.array([-(lower[:, 0].min() + lower[:, 0].max()) / 2, -lo[1], 0.0])
    mid = v[((v[:, 1] - lo[1]) * s > 0.45) & ((v[:, 1] - lo[1]) * s < 0.75)]
    off[2] = -(mid[:, 2].min() + mid[:, 2].max()) / 2
    pts, _ = trimesh.sample.sample_surface_even(mesh, 200000, seed=3) if hasattr(trimesh.sample, 'sample_surface_even') else trimesh.sample.sample_surface(mesh, 200000)
    pts = np.vstack([pts, v])
    return mesh, s, off, (pts + off) * s


def clusters_1d(vals, gap):
    order = np.sort(vals)
    if len(order) == 0:
        return []
    cuts = np.where(np.diff(order) > gap)[0]
    starts = np.r_[0, cuts + 1]
    ends = np.r_[cuts, len(order) - 1]
    return [(order[a], order[b]) for a, b in zip(starts, ends)]


def measure(P, overrides=None):
    y, x, z = P[:, 1], P[:, 0], P[:, 2]
    J, info = {}, {}
    band = lambda y0, h=0.012: P[np.abs(y - y0) < h]
    # hands: the farthest points of the outstretched A-pose arms
    for s, sign in (('l', 1), ('r', -1)):
        side = P[(sign * x > 0.05) & (y > 0.2)]
        tip = side[np.argmax(sign * side[:, 0])]
        hand = side[np.linalg.norm(side - tip, axis=1) < 0.075]
        J['hand_tip' + s] = tip
        J['hand' + s] = hand.mean(0)
    # armpits: follow each arm from the hand upward until it merges with the torso (ears and hats never qualify)
    torso_half = {}
    for s, sign in (('l', 1), ('r', -1)):
        hy = J['hand' + s][1]
        prev = (sign * J['hand' + s][0] - 0.06, sign * J['hand_tip' + s][0])
        best, last_inner = None, None
        for yy in np.arange(hy, 0.95, 0.005):
            b = band(yy, 0.005)
            cl = clusters_1d(sign * b[:, 0], 0.018) if len(b) >= 10 else []
            arm = [c for c in cl if c[1] >= prev[0] - 0.03 and c[0] <= prev[1] + 0.01]
            if not arm:
                continue
            lo, hi = min(c[0] for c in arm), max(c[1] for c in arm)
            if lo <= 0.03:
                best = yy
                break
            inner = [c for c in cl if c[1] < lo and c[0] <= 0.03]
            if inner:
                last_inner = inner[-1][1]
            prev = (lo, hi)
        if best is None or last_inner is None:
            raise RuntimeError('no armpit for ' + s)
        info['armpit' + s] = (best, last_inner)
        torso_half[s] = last_inner
    ay = (info['armpitl'][0] + info['armpitr'][0]) / 2
    sy = ay + 0.035
    chest_band = band(sy, 0.01)
    zc = np.median(chest_band[np.abs(chest_band[:, 0]) < 0.08][:, 2])
    for s, sign in (('l', 1), ('r', -1)):
        sb = band(ay + 0.08, 0.01)
        sb = sb[sign * sb[:, 0] > 0]
        shoulder_w = (sign * sb[:, 0]).max() if len(sb) else torso_half[s]
        J['upperarm' + s] = np.array([sign * max(torso_half[s] - 0.005, 0.72 * shoulder_w), sy + 0.015, zc])
    # wrists sit a hand-length in from the fingertips; elbows on the arm centreline halfway
    for s in 'lr':
        sh, tip = J['upperarm' + s], J['hand_tip' + s]
        d = (tip - sh) / np.linalg.norm(tip - sh)
        wrist_guess = tip - d * 0.085
        near = P[np.linalg.norm(P - wrist_guess, axis=1) < 0.035]
        J['hand' + s] = near.mean(0) if len(near) > 5 else wrist_guess
        mid = sh + (J['hand' + s] - sh) * 0.5
        rel = P - sh
        t = rel @ d
        perp = np.linalg.norm(rel - np.outer(t, d), axis=1)
        L = np.linalg.norm(J['hand' + s] - sh)
        ring = P[(np.abs(t - L * 0.5) < 0.02) & (perp < 0.07)]
        J['lowerarm' + s] = ring.mean(0) if len(ring) > 5 else mid
    # neck: narrowest torso slice between the shoulders and the head
    widths = []
    for yy in np.arange(sy + 0.01, min(sy + 0.16, 0.97), 0.004):
        b = band(yy, 0.004)
        b = b[np.abs(b[:, 0]) < 0.12]
        if len(b) > 10:
            widths.append((b[:, 0].max() - b[:, 0].min(), yy))
    neck_y = min(widths)[1] if widths else sy + 0.06
    J['head'] = np.array([0.0, neck_y, zc])
    # crotch: lowest surface point near the symmetry plane above the knees
    centre = P[(np.abs(x) < 0.012) & (y > 0.12) & (y < sy - 0.12)]
    crotch = centre[:, 1].min() if len(centre) else sy * 0.45
    hip_y = float(np.clip(crotch + 0.05, sy * 0.38, sy * 0.72))
    info['crotch'] = float(crotch)
    J['chest'] = np.array([0.0, hip_y + 0.07, zc])
    ankle_y = 0.075
    for s, sign in (('l', 1), ('r', -1)):
        def ring(yy, h=0.012):
            b = band(yy, h)
            b = b[(sign * b[:, 0] > 0.0) & (sign * b[:, 0] < 0.25)]
            return b
        hb = ring(hip_y - 0.04, 0.02)
        hx = np.median(hb[:, 0]) if len(hb) else sign * 0.07
        ab = ring(ankle_y, 0.015)
        ab = ab[ab[:, 2] < np.percentile(ab[:, 2], 70)] if len(ab) > 20 else ab
        ank = np.array([np.median(ab[:, 0]), ankle_y, np.median(ab[:, 2])]) if len(ab) else np.array([hx, ankle_y, 0])
        J['upperleg' + s] = np.array([hx, hip_y, zc])
        ky = (hip_y + ankle_y) / 2 + 0.01
        kb = ring(ky, 0.012)
        kb = kb[np.abs(kb[:, 0] - (hx + ank[0]) / 2) < 0.08]
        J['lowerleg' + s] = np.array([np.median(kb[:, 0]), ky, np.median(kb[:, 2])]) if len(kb) else (J['upperleg' + s] + ank) / 2
        J['foot' + s] = ank
        toe = P[(np.abs(x - ank[0]) < 0.07) & (y < 0.04)]
        J['toe' + s] = np.array([ank[0], 0.02, np.percentile(toe[:, 2], 95) if len(toe) else ank[2] + 0.08])
    J['head_top'] = np.array([0.0, float(y.max()), zc])
    for k, v in (overrides or {}).items():
        J[k] = np.array(v, dtype=float)
    return J, info


def preview(P, J, path):
    from PIL import Image, ImageDraw
    W, H = 900, 640
    img = Image.new('RGB', (W, H), (24, 26, 30))
    d = ImageDraw.Draw(img)
    S, ox, oy = 560, 300, 600
    sel = P[np.random.default_rng(1).choice(len(P), min(len(P), 40000), replace=False)]
    for X, Y, Z in sel:
        d.point((ox + X * S, oy - Y * S), fill=(110, 120, 130))
        d.point((750 + Z * S, oy - Y * S), fill=(110, 120, 130))
    bones = [('chest', 'head'), ('head', 'head_top')] + [(a + s, b + s) for s in 'lr' for a, b in (
        ('upperarm', 'lowerarm'), ('lowerarm', 'hand'), ('hand', 'hand_tip'), ('upperleg', 'lowerleg'), ('lowerleg', 'foot'), ('foot', 'toe'))] + [('chest', 'upperarml'), ('chest', 'upperarmr'), ('chest', 'upperlegl'), ('chest', 'upperlegr')]
    for a, b in bones:
        A, B = J[a], J[b]
        d.line((ox + A[0] * S, oy - A[1] * S, ox + B[0] * S, oy - B[1] * S), fill=(255, 200, 60), width=3)
        d.line((750 + A[2] * S, oy - A[1] * S, 750 + B[2] * S, oy - B[1] * S), fill=(255, 200, 60), width=3)
    for k, v in J.items():
        d.ellipse((ox + v[0] * S - 5, oy - v[1] * S - 5, ox + v[0] * S + 5, oy - v[1] * S + 5), fill=(80, 220, 255))
    img.save(path)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    ov = {}
    if '--override' in sys.argv:
        for kv in sys.argv[sys.argv.index('--override') + 1:]:
            k, v = kv.split('=')
            ov[k] = [float(t) for t in v.split(',')]
    mesh, s, off, P = load(args[0])
    J, info = measure(P, ov)
    out = {'normalize': {'scale': s, 'offset': off.tolist()}, 'joints': {k: [round(float(t), 4) for t in v] for k, v in J.items()},
           'info': {k: (v if isinstance(v, float) else [float(t) for t in v]) for k, v in info.items()}}
    json.dump(out, open(args[1], 'w'), indent=1)
    if len(args) > 2:
        preview(P, J, args[2])
    print(json.dumps(out['joints']))
