"""Secret weapon pictures: cut each generated painting (plain light-grey background, Hugging Face batch hf-art-c1) out of
its background, fit it diagonally on a 160 px square like the set art (assets/ui/sets/), and lay a soft glow in the
biome's colour behind it. Writes assets/ui/secret/<biome>.webp.
python3 tools/secret_art.py SRC_DIR   (SRC_DIR holds secret_<biome>.webp, biomes 0..5 by name below)"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

NAMES = ['woodlands', 'peaks', 'volcanic', 'arcane', 'ocean', 'celestial']
GLOW = [(127, 198, 90), (159, 216, 255), (255, 122, 58), (192, 138, 255), (63, 224, 208), (255, 240, 122)]  # CFG.craft.biomes colors
src, out, S = Path(sys.argv[1]), Path('assets/ui/secret'), 160
out.mkdir(parents=True, exist_ok=True)
for bi, name in enumerate(NAMES):
    im = Image.open(src / f'secret_{name}.webp').convert('RGB'); a = np.asarray(im).astype(np.int32)
    # background: the grey of the border, flood-filled from the edges through pixels close to it
    edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]); bg = np.median(edge, 0)
    near = np.abs(a - bg).sum(-1) < 46
    from scipy import ndimage
    lab, _ = ndimage.label(near); border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    mask = ~np.isin(lab, list(border))
    mask = ndimage.binary_opening(mask, iterations=1); mask = ndimage.binary_fill_holes(mask)
    rgba = np.dstack([a.astype(np.uint8), (mask * 255).astype(np.uint8)])
    obj = Image.fromarray(rgba, 'RGBA'); obj = obj.crop(obj.getchannel('A').getbbox())
    obj.putalpha(obj.getchannel('A').filter(ImageFilter.GaussianBlur(0.6)))   # soften the cut edge a touch
    k = (S * 0.86) / max(obj.size); obj = obj.resize((round(obj.width * k), round(obj.height * k)), Image.LANCZOS)
    can = Image.new('RGBA', (S, S))
    glow = Image.new('RGBA', (S, S)); sil = Image.new('L', (S, S)); pos = ((S - obj.width) // 2, (S - obj.height) // 2)
    sil.paste(obj.getchannel('A'), pos)
    g = sil.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(9))
    glow = Image.merge('RGBA', [Image.new('L', (S, S), c) for c in GLOW[bi]] + [g.point(lambda v: int(v * 0.85))])
    can.alpha_composite(glow); can.alpha_composite(obj, pos)
    can.save(out / f'{bi}.webp', quality=92, method=6)
    print(bi, name, obj.size)
