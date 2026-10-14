"""Remove a pale backdrop sheet by texture colour: triangles whose texels are light, grey and low-saturation
(the plain studio background TRELLIS sometimes turns into a wall) are dropped, then small leftover islands.
python tools/v10_unbackdrop_color.py IN.glb OUT.glb [min_luma=0.62] [max_sat=0.16]"""
import sys, numpy as np, trimesh
src, out = sys.argv[1], sys.argv[2]
L = float(sys.argv[3]) if len(sys.argv) > 3 else 0.62; S = float(sys.argv[4]) if len(sys.argv) > 4 else 0.16
m = trimesh.load(src, force='mesh')
tex = np.asarray(m.visual.material.baseColorTexture.convert('RGB')) / 255.0; h, w = tex.shape[:2]
uv = m.visual.uv
keep = np.ones(len(m.faces), bool)
for bary in ([1/3, 1/3, 1/3], [.7, .15, .15], [.15, .7, .15], [.15, .15, .7]):
    fuv = (uv[m.faces] * np.array(bary)[None, :, None]).sum(1)
    px = np.clip((fuv[:, 0] % 1) * (w - 1), 0, w - 1).astype(int); py = np.clip((1 - fuv[:, 1] % 1) * (h - 1), 0, h - 1).astype(int)
    c = tex[py, px]; mx, mn = c.max(1), c.min(1); sat = (mx - mn) / np.maximum(mx, 1e-3); luma = c @ [.299, .587, .114]
    keep &= ~((luma > L) & (sat < S))
m.update_faces(keep); m.remove_unreferenced_vertices()
m.export(out)
print({'dropped': int((~keep).sum()), 'left': len(m.faces)})
