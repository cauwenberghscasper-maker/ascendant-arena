"""Item pictures from generated paintings on a plain light background (Hugging Face Z-Image batches): cut the object out
(flood fill from the edges through pixels close to the border colour), fit it on a square and lay a soft glow in the
item's colour behind it, like the set art in assets/ui/sets/.
python3 tools/cutout_art.py SRC_DIR OUT_DIR SIZE name:rrggbb ...   (reads SRC_DIR/<name>.webp, writes OUT_DIR/<name>.webp)"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

src, out, S = Path(sys.argv[1]), Path(sys.argv[2]), int(sys.argv[3])
out.mkdir(parents=True, exist_ok=True)
for job in sys.argv[4:]:
    name, col = job.split(':'); col = tuple(int(col[i:i + 2], 16) for i in (0, 2, 4))
    a = np.asarray(Image.open(src / f'{name}.webp').convert('RGB')).astype(np.int32)
    bg = np.median(np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]), 0)
    lab, _ = ndimage.label(np.abs(a - bg).sum(-1) < 46)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    mask = ndimage.binary_fill_holes(ndimage.binary_opening(~np.isin(lab, list(border)), iterations=1))
    obj = Image.fromarray(np.dstack([a.astype(np.uint8), (mask * 255).astype(np.uint8)]), 'RGBA')
    obj = obj.crop(obj.getchannel('A').getbbox()); obj.putalpha(obj.getchannel('A').filter(ImageFilter.GaussianBlur(0.6)))
    k = (S * 0.84) / max(obj.size); obj = obj.resize((round(obj.width * k), round(obj.height * k)), Image.LANCZOS)
    pos = ((S - obj.width) // 2, (S - obj.height) // 2); sil = Image.new('L', (S, S)); sil.paste(obj.getchannel('A'), pos)
    g = sil.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(S / 18)).point(lambda v: int(v * 0.85))
    can = Image.merge('RGBA', [Image.new('L', (S, S), c) for c in col] + [g]); can.alpha_composite(obj, pos)
    can.save(out / f'{name}.webp', quality=92, method=6)
    print(name, obj.size)
