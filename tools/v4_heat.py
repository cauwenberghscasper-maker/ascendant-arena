"""Bone-heat skin weights (Baran & Popovic 2007) for a measured A-pose character.

Visibility uses a filled voxel copy of the body: a vertex only binds to bones it can reach through
the inside of the mesh, so arms never grab the torso and legs never grab each other.
python tools/v4_heat.py CLEAN.glb JOINTS.json OUT_WEIGHTS.json
"""
import json, struct, sys
import numpy as np
import scipy.sparse as sp
from scipy.sparse.linalg import splu
import trimesh

JOINTS = ['heroRoot', 'chest', 'head', 'upperarml', 'lowerarml', 'handl', 'upperarmr', 'lowerarmr', 'handr',
          'upperlegl', 'lowerlegl', 'footl', 'upperlegr', 'lowerlegr', 'footr']
CHILD = {'heroRoot': 'chest', 'chest': 'head', 'head': 'head_top'}
for s in 'lr':
    CHILD.update({'upperarm' + s: 'lowerarm' + s, 'lowerarm' + s: 'hand' + s, 'hand' + s: 'hand_tip' + s,
                  'upperleg' + s: 'lowerleg' + s, 'lowerleg' + s: 'foot' + s, 'foot' + s: 'toe' + s})


def read_glb(path):
    blob = open(path, 'rb').read()
    jlen = struct.unpack_from('<I', blob, 12)[0]
    doc = json.loads(blob[20:20 + jlen])
    bin_ = blob[20 + jlen + 8:]
    def acc(i):
        a = doc['accessors'][i]; bv = doc['bufferViews'][a['bufferView']]
        dt = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}[a['componentType']]
        n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
        off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        stride = bv.get('byteStride', 0)
        if stride and stride != n * np.dtype(dt).itemsize:
            raw = np.frombuffer(bin_, np.uint8, count=stride * a['count'], offset=off).reshape(a['count'], stride)
            return raw[:, :n * np.dtype(dt).itemsize].copy().view(dt).reshape(a['count'], n)
        return np.frombuffer(bin_, dt, count=a['count'] * n, offset=off).reshape(a['count'], n) if n > 1 else np.frombuffer(bin_, dt, count=a['count'], offset=off)
    prim = doc['meshes'][0]['primitives'][0]
    return acc(prim['attributes']['POSITION']).astype(np.float64), acc(prim['indices']).astype(np.int64).reshape(-1, 3)


def cotan_laplacian(V, F):
    n = len(V)
    L = sp.lil_matrix((n, n))
    I, J, W = [], [], []
    area = np.zeros(n)
    for k in range(3):
        i, j, o = F[:, k], F[:, (k + 1) % 3], F[:, (k + 2) % 3]
        u, v = V[i] - V[o], V[j] - V[o]
        cr = np.linalg.norm(np.cross(u, v), axis=1)
        cot = np.einsum('ij,ij->i', u, v) / np.maximum(cr, 1e-12)
        cot = np.clip(cot, -10, 10)
        I += [i, j]; J += [j, i]; W += [cot * 0.5, cot * 0.5]
        np.add.at(area, o, cr / 6)
    I, J, W = np.concatenate(I), np.concatenate(J), np.concatenate(W)
    A = sp.coo_matrix((W, (I, J)), shape=(n, n)).tocsr()
    A = A.maximum(0) + 1e-4 * (A != 0)  # keep it an M-matrix on sliver triangles
    L = sp.diags(np.asarray(A.sum(1)).ravel()) - A
    return L.tocsc(), np.maximum(area, 1e-10)


def seg_closest(P, a, b):
    ab = b - a
    t = np.clip(((P - a) @ ab) / max(ab @ ab, 1e-12), 0, 1)
    C = a + t[:, None] * ab
    return C, np.linalg.norm(P - C, axis=1)


def main(glb, joints_path, out_path):
    J = {k: np.array(v) for k, v in json.load(open(joints_path))['joints'].items()}
    V0, F0 = read_glb(glb)
    # weld seams so heat flows across UV islands
    key = np.round(V0 * 1e5).astype(np.int64)
    _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    inv = inv.ravel()
    V, F = V0[first], inv[F0]
    F = F[(F[:, 0] != F[:, 1]) & (F[:, 1] != F[:, 2]) & (F[:, 0] != F[:, 2])]
    # filled voxel body for visibility
    mesh = trimesh.Trimesh(V, F, process=False)
    pitch = 0.006
    from scipy import ndimage
    vg = mesh.voxelized(pitch)
    shell = ndimage.binary_dilation(vg.matrix, iterations=2)
    ys = shell.shape[1]
    # cap the open boot bottoms: close every column that has shell in its lowest layers
    low = shell[:, :6, :].any(1)
    shell[:, 0, :] |= ndimage.binary_closing(low, iterations=3)
    occ = ndimage.binary_fill_holes(shell)
    # TRELLIS shells leak (open soles, neck seams), so also fill every horizontal slice on its own
    for j in range(ys):
        occ[:, j, :] |= ndimage.binary_fill_holes(shell[:, j, :])
    occ = ndimage.binary_erosion(occ, iterations=1)
    origin = vg.transform[:3, 3]
    def inside(pts):
        ijk = np.floor((pts - origin) / pitch + 0.5).astype(int)
        ok = np.all((ijk >= 0) & (ijk < np.array(occ.shape)), axis=1)
        res = np.zeros(len(pts), bool)
        res[ok] = occ[ijk[ok, 0], ijk[ok, 1], ijk[ok, 2]]
        return res
    segs = []
    for b in JOINTS:
        a = np.array([0.0, J['upperlegl'][1] - 0.05, J['chest'][2]]) if b == 'heroRoot' else J[b]
        segs.append((a, J[CHILD[b]]))
    n, nb = len(V), len(JOINTS)
    D = np.full((n, nb), np.inf)
    for j, (a, b) in enumerate(segs):
        C, d = seg_closest(V, a, b)
        vis = np.ones(n, bool)
        for t in np.linspace(0.15, 0.92, 14):  # skip the surface end and the bone end
            vis &= inside(V + (C - V) * t)
        D[vis, j] = d[vis]
    nearest = np.argmin(D, 1)
    dmin = D[np.arange(n), nearest]
    has = np.isfinite(dmin)
    # vertices that see no bone (thin cloth, feathers): use plain nearest distance, weaker heat
    if (~has).any():
        Dall = np.stack([seg_closest(V[~has], a, b)[1] for a, b in segs], 1)
        nearest[~has] = np.argmin(Dall, 1)
        dmin[~has] = Dall.min(1) * 3
    # ties within 1% share the heat (Baran & Popovic)
    H = 1.0 / np.maximum(dmin, 0.004) ** 2
    L, area = cotan_laplacian(V, F)
    M = sp.diags(area)
    A = (L + M @ sp.diags(H)).tocsc()
    lu = splu(A)
    Wt = np.zeros((n, nb))
    for j in range(nb):
        p = np.zeros(n)
        close = np.isfinite(D[:, j]) & (D[:, j] <= dmin * 1.01)
        p[close | (nearest == j)] = 1.0
        Wt[:, j] = lu.solve(area * H * p)
    Wt = np.clip(Wt, 0, None)
    Wt /= np.maximum(Wt.sum(1, keepdims=True), 1e-9)
    W0 = Wt[inv]  # back to the GLB vertex order
    out = {'joints': JOINTS, 'vertexWeights': [[[int(j), round(float(w), 4)] for j, w in sorted(enumerate(row), key=lambda x: -x[1])[:4] if w > 0.005] for row in W0],
           'stats': {'vertices': int(len(V0)), 'welded': int(n), 'noVisibleBone': int((~has).sum()), 'voxels': [int(x) for x in occ.shape]}}
    json.dump(out, open(out_path, 'w'), separators=(',', ':'))
    print(json.dumps(out['stats']))


if __name__ == '__main__':
    main(*sys.argv[1:4])
