"""Craft material icons: crop the renders of tools/mat_icons.mjs to their content, fit them on a 64 px pixel grid (4x the
detail of the old 16 px icons), push colour and contrast a little, cut a hard alpha, add a 1-pixel ink outline and a
2-pixel bottom-right drop of ink, and save a 128 px webp (each art pixel 2x2) to assets/ui/mats/<id>.webp.
python3 tools/mat_icons.py RENDER_DIR"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageEnhance

src, out = Path(sys.argv[1]), Path('assets/ui/mats')
out.mkdir(parents=True, exist_ok=True)
INK = np.array((27, 23, 34, 255), np.uint8)  # the old icons' ink, #1b1722
N = 64
def area(f):
    a = np.asarray(Image.open(f).getchannel('A')) > 8
    return a.sum() / max(1, a.any(0).sum() * a.any(1).sum()) * a.sum() ** 0.5   # big and filling its box, not a sliver
best = {}
for f in sorted(src.glob('*@*.png')):
    i = f.stem.split('@')[0]
    if i not in best or area(f) > area(best[i]): best[i] = f
for i, f in sorted(best.items()):
    im = Image.open(f).convert('RGBA')
    im = im.crop(im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox())
    px = np.asarray(im).astype(float); m = px[..., 3] > 100
    lum = (px[..., :3][m] @ [0.2126, 0.7152, 0.0722]).mean() / 255 if m.any() else 0.5
    if lum < 0.4: im = ImageEnhance.Brightness(im).enhance(min(1.8, 0.4 / max(lum, 0.05)))   # lift dark stones so they read on the dark tile
    im = ImageEnhance.Contrast(ImageEnhance.Color(ImageEnhance.Brightness(im).enhance(1.12)).enhance(1.25)).enhance(1.15)
    k = (N - 6) / max(im.size)                                    # margin for the outline and the drop
    small = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    can = Image.new('RGBA', (N, N)); can.paste(small, ((N - small.width) // 2, (N - small.height) // 2), small)
    a = np.asarray(can).copy()
    solid = a[..., 3] > 100
    # quantize each channel to 24 levels: flat pixel-art bands instead of smooth render gradients
    a[..., :3] = (np.round(a[..., :3] / 255 * 23) / 23 * 255).astype(np.uint8)
    a[..., 3] = np.where(solid, 255, 0)
    ring = np.zeros_like(solid)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)): ring |= np.roll(solid, (dy, dx), (0, 1))
    drop = np.roll(solid, (2, 1), (0, 1)) & ~solid & ~ring
    a[ring & ~solid] = INK
    a[drop] = (0, 0, 0, 90)
    Image.fromarray(a).resize((N * 2, N * 2), Image.NEAREST).save(out / (i + '.webp'), lossless=True)
    print(i, f.stem.split('@')[1])
