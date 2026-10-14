"""Make a recoloured copy of a Quaternius glTF folder: every leaf texture shifted to a biome look.
python3 tools/v11_recolor.py SRC_GLTF_DIR DST_DIR MODE   (MODE: green | frost | violet | teal | gold | ember)"""
import shutil, sys, colorsys
from pathlib import Path
from PIL import Image
import numpy as np

LEAVES = ('Leaves.png', 'Leaves_TwistedTree_C.png', 'Leaves_NormalTree_C.png', 'Leaf_Pine_C.png')

def shift(img, mode):
    a = np.asarray(img.convert('RGBA')).astype(np.float32) / 255
    rgb, al = a[..., :3], a[..., 3:]
    hsv = np.asarray(Image.fromarray((rgb * 255).astype(np.uint8)).convert('HSV')).astype(np.float32) / 255
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    target = {'green': 0.29, 'violet': 0.76, 'teal': 0.49, 'gold': 0.12, 'ember': 0.03, 'frost': 0.33}[mode]
    h2 = (target + (h - np.median(h[al[..., 0] > .5] if (al > .5).any() else h)) * 0.25) % 1
    if mode == 'gold': s, v = s * 0.85, np.clip(v * 1.35 + 0.08, 0, 1)
    if mode == 'violet': s, v = np.clip(s * 1.15, 0, 1), np.clip(v * 1.15, 0, 1)
    if mode == 'teal': v = np.clip(v * 1.1, 0, 1)
    out = np.asarray(Image.fromarray((np.stack([h2, s, v], -1) * 255).astype(np.uint8), 'HSV').convert('RGB')).astype(np.float32) / 255
    if mode == 'frost':  # snow-laden needles: lighter toward the tips (bright texels), cool blue-white
        m = al[..., 0] > .5; vn = v / max(1e-3, np.percentile(v[m], 95) if m.any() else 1)
        k = np.clip((vn[..., None] - 0.72) * 3.2, 0, 0.62)  # bright needle tips carry snow, the dark undersides stay deep green
        out = out * (1 - k) * 0.8 + np.array([0.93, 0.97, 1.0]) * k
    return Image.fromarray((np.concatenate([out, al], -1) * 255).astype(np.uint8), 'RGBA')

src, dst, mode = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
if dst.exists(): shutil.rmtree(dst)
shutil.copytree(src, dst)
for n in LEAVES:
    f = dst / n
    if f.exists(): shift(Image.open(f), mode).save(f)
print('recoloured', mode, dst)
