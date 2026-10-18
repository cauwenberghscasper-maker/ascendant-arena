"""Bastion menu pictures: crop the renders of tools/fort_icons.mjs to their content, fit them on a 128 px square, step them
down to 64 px pixels (the menu's pixel-art look), add a 1-pixel ink outline and save webp to assets/ui/fort/.
python3 tools/fort_icons.py RENDER_DIR"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageEnhance

src, out = Path(sys.argv[1]), Path('assets/ui/fort')
out.mkdir(parents=True, exist_ok=True)
INK = (18, 10, 3, 255)
for f in sorted(src.glob('*.png')):
    im = Image.open(f).convert('RGBA')
    im = im.crop(im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox())
    im = ImageEnhance.Contrast(ImageEnhance.Color(ImageEnhance.Brightness(im).enhance(1.25)).enhance(1.2)).enhance(1.12)
    k = 60 / max(im.size)                                   # 64 px canvas, 2 px margin for the outline
    small = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    can = Image.new('RGBA', (64, 64)); can.paste(small, ((64 - small.width) // 2, 64 - 2 - small.height), small)
    a = np.asarray(can).copy(); solid = a[..., 3] > 110
    a[..., 3] = np.where(solid, 255, 0)
    ring = np.zeros_like(solid)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)): ring |= np.roll(solid, (dy, dx), (0, 1))
    a[ring & ~solid] = INK
    Image.fromarray(a).resize((128, 128), Image.NEAREST).save(out / (f.stem + '.webp'), lossless=True)
    print(f.stem)
