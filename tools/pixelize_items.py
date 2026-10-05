"""Turn generated item paintings into crisp game pixel icons and register them in index.html.

Usage: python3 tools/pixelize_items.py index.html key=image.png [key=image.png ...] [--size 48]
       key = <slot>-<noun>-<rarity>, e.g. weapon-edge-legendary (see tools/item_prompts.py)

Per image: the flat background is flood-filled away from the borders (so white highlights inside the
item stay), stray specks are dropped, the item is cropped to a square, box-downsampled to SIZE art
pixels with a hard alpha, colour-reduced to a small palette with a little extra contrast, and given
a 1px dark ink outline. Output: assets/ui/items/<key>.png. The ITEM_ICONS list between the
// <items-icons> markers in index.html is rewritten from the folder.
"""
import os, re, sys
import numpy as np
from PIL import Image, ImageEnhance
from scipy import ndimage

INK = (20, 15, 28)


def pixelize(src, dst, N=48, colors=26):
    im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(np.float32)
    h, w = a.shape[:2]; b = 6
    border = np.concatenate([a[:b].reshape(-1, 3), a[-b:].reshape(-1, 3), a[:, :b].reshape(-1, 3), a[:, -b:].reshape(-1, 3)])
    bg = np.median(border, 0)
    near = np.abs(a - bg).sum(-1) < 70
    lab, n = ndimage.label(near)
    edge_ids = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgmask = np.isin(lab, list(edge_ids))
    fg = ~bgmask
    fg = ndimage.binary_opening(fg, iterations=2)
    lab2, n2 = ndimage.label(fg)
    if n2:
        sizes = ndimage.sum(fg, lab2, range(1, n2 + 1)); big = sizes.max()
        fg = np.isin(lab2, [i + 1 for i, s in enumerate(sizes) if s >= 0.02 * big])
    ys, xs = np.where(fg)
    if not len(xs): raise SystemExit(f'{src}: nothing found on the background')
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    cx, cy, half = (x0 + x1) / 2, (y0 + y1) / 2, max(x1 - x0, y1 - y0) / 2 / 0.9  # item fills 90% of the tile
    box = (int(cx - half), int(cy - half), int(cx + half), int(cy + half))
    rgb = Image.fromarray(a.astype(np.uint8)).crop(box); m = Image.fromarray((fg * 255).astype(np.uint8)).crop(box)
    # premultiplied box downsample so background colour never bleeds into edge pixels
    A = np.asarray(m.resize((N, N), Image.BOX)).astype(np.float32) / 255
    P = np.asarray(Image.fromarray((np.asarray(rgb).astype(np.float32) * (np.asarray(m)[..., None] / 255)).astype(np.uint8)).resize((N, N), Image.BOX)).astype(np.float32)
    C = P / np.maximum(A[..., None], 1e-3)
    alpha = A > 0.45
    small = Image.fromarray(np.clip(C, 0, 255).astype(np.uint8))
    small = ImageEnhance.Contrast(small).enhance(1.12); small = ImageEnhance.Color(small).enhance(1.12)
    q = small.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    out = np.zeros((N, N, 4), np.uint8); out[..., :3] = np.asarray(q); out[..., 3] = alpha * 255
    # ink outline around the silhouette
    pad = np.pad(alpha, 1)
    ring = (pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:]) & ~alpha
    out[ring] = (*INK, 255)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    Image.fromarray(out, 'RGBA').save(dst, optimize=True)


if __name__ == '__main__':
    args = sys.argv[1:]; html = args.pop(0); N = 48
    if '--size' in args: i = args.index('--size'); N = int(args[i + 1]); del args[i:i + 2]
    game = os.path.dirname(os.path.abspath(html)); folder = os.path.join(game, 'assets', 'ui', 'items')
    for kv in args:
        key, src = kv.split('=', 1); pixelize(src, os.path.join(folder, key + '.png'), N); print('ok', key)
    have = sorted(f[:-4] for f in os.listdir(folder) if f.endswith('.png')) if os.path.isdir(folder) else []
    s = open(html).read()
    s = re.sub(r"// <items-icons>\n.*?\n// </items-icons>", "// <items-icons>\nconst ITEM_ICONS = " + str(have).replace("'", '"') + ";\n// </items-icons>", s, flags=re.S)
    open(html, 'w').write(s); print(len(have), 'item icons registered')
