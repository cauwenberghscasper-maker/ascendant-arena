"""Painted combat effects: generated pictures (Z-Image Turbo, batches fx-gen-a/b on asset-drop) baked into animated pixel
flipbooks that replace the code-drawn sheets of tools/bake_fx.py (assets/fx/<kind>_<pal>.png) wherever a picture exists.

python3 tools/bake_fx_gen.py DIR            DIR holds fx_<kind>_<pal>.(webp|png) (any flat background)
-> assets/fx/gen/<kind>_<pal>.png: 16 frames in a 4x4 sheet with alpha, plus assets/fx/gen/index.json (what exists).
   A colour theme the game uses (FX_PALS) without its own picture is repainted from the kind's donor picture
   (DONOR) through that theme's ramp, so every theme of a kind is painted.
python3 tools/bake_fx_gen.py --mobs DIR     every monster species' burst (assets/fx/mob/hit_<id>.png) repainted from a
   painted effect (MOB_KIND: the species' burst style -> effect kind) in a ramp from its own colour (MOB_FX table).
The picture is cut out of its background, laid on black, animated by tools/bake_hero_fx.py (burst: overshoot, hold with
flowing strokes, burn away with embers; rise: grows from the floor), then every frame is stepped down to a coarse
pixel grid in the picture's own palette with a 4x4 ordered dither and a hard alpha (black = empty).
"""
import importlib.util, json, sys, tempfile
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sp = importlib.util.spec_from_file_location('hfx', HERE / 'bake_hero_fx.py'); HFX = importlib.util.module_from_spec(sp); sp.loader.exec_module(HFX)
OUT = HERE.parent / 'assets/fx/gen'
# animation and pixel grid per kind (big blasts get a finer grid)
KIND = {'explosion': ('burst', 64), 'hit': ('burst', 48), 'impact': ('burst', 40), 'crit': ('burst', 56), 'nova': ('burst', 64),
        'ring': ('burst', 64), 'slash': ('burst', 56), 'poof': ('rise', 56), 'shatter': ('burst', 56), 'zap': ('burst', 48), 'flame': ('rise', 48)}

FX_PALS = {'explosion': ['fire', 'frost', 'arcane', 'venom', 'blood'], 'hit': ['fire', 'frost', 'arcane', 'venom', 'blood'],
           'impact': ['fire', 'frost', 'arcane', 'venom', 'blood', 'gold', 'white', 'storm'], 'crit': ['gold', 'fire', 'arcane'],
           'nova': ['gold', 'arcane', 'frost', 'fire', 'venom', 'blood'], 'ring': ['fire', 'frost', 'arcane', 'venom', 'blood'],
           'slash': ['white', 'fire', 'frost', 'arcane', 'venom', 'blood', 'gold'], 'poof': ['fire', 'frost', 'arcane', 'venom', 'blood', 'gold', 'white'],
           'shatter': ['frost', 'arcane', 'white'], 'zap': ['storm', 'arcane'], 'flame': ['fire', 'venom', 'arcane', 'frost']}
DONOR = {'impact': 'white', 'poof': 'white', 'slash': 'white', 'crit': 'gold', 'hit': 'frost', 'explosion': 'fire', 'nova': 'gold',
         'ring': 'frost', 'shatter': 'white', 'zap': 'storm', 'flame': 'fire'}
# a monster's burst style (tools/bake_hero_hits.py names, MOB_FX "hit") -> the painted effect it is repainted from
MOB_KIND = {'splash': 'poof', 'ring': 'ring', 'petals': 'shatter', 'spatter': 'explosion', 'glint': 'crit', 'sparks': 'hit', 'fibres': 'hit',
            'mist': 'poof', 'claw': 'slash', 'chips': 'shatter', 'jaws': 'slash', 'pips': 'impact'}
RAMP = {'fire': ['#3a1208', '#8a2a10', '#d8521e', '#ff9a3a', '#ffd27a', '#fff6d8'], 'frost': ['#0c2140', '#1d4f8a', '#3a8ee0', '#7fd0ff', '#c8f2ff', '#ffffff'],
        'arcane': ['#1e0b3a', '#4a1f8a', '#8a4ae0', '#c58aff', '#efcfff', '#ffffff'], 'venom': ['#0e2a10', '#1f6a22', '#3fb43a', '#8ef06a', '#d4ffb0', '#fbfff0'],
        'blood': ['#2a0508', '#6a0c16', '#b3122e', '#ff4d6d', '#ffb0bd', '#fff0f2'], 'gold': ['#3a2204', '#8a5a0e', '#d89a1e', '#ffd34a', '#fff0a8', '#ffffff'],
        'storm': ['#0a1d3a', '#1a5aa8', '#3ab8ff', '#9fe8ff', '#e8fbff', '#ffffff'], 'white': ['#2a2a38', '#5a5a70', '#9a9ab0', '#d8d8e8', '#f4f4ff', '#ffffff']}
hexf = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255
def ramp_of(hex_base):
    b = hexf(hex_base); return [b * 0.18, b * 0.42, b * 0.72, b, b + (1 - b) * 0.5, b + (1 - b) * 0.88]

def repaint(img, ramp):
    """the painting's light (brightest channel) mapped through a 6-step colour ramp: same shapes, new colours"""
    A = np.asarray(img.convert('RGB')).astype(np.float32) / 255; L0 = A.max(-1)
    # spread the painting's light evenly over the whole ramp (rank of each lit pixel), so a near-white donor (a white
    # star, a cloud) still uses the dark, middle and bright colours of the new theme instead of only its near-white top
    # Only the effect itself is spread: the faint haze painted round it (below 0.3) stays dark, so the baker drops it;
    # spreading the haze too turned it into solid mid colours (a filled disc under rings, clouds and bursts).
    lit = L0 > 0.3; L = np.zeros_like(L0)
    if lit.any(): r = np.argsort(np.argsort(L0[lit])) / max(1, lit.sum() - 1); L[lit] = 0.3 + 0.7 * r
    R = np.array([hexf(c) if isinstance(c, str) else c for c in ramp]); x = np.clip(L, 0, 1) * (len(R) - 1)
    i = np.clip(np.floor(x).astype(int), 0, len(R) - 2); f = (x - i)[..., None]
    out = R[i] * (1 - f) + R[i + 1] * f; out *= lit[..., None]  # haze and black stay black (empty)
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))

def on_black(src):
    """the effect on pure black: a black background stays; any other flat background is cut away from the border in"""
    A = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
    border = np.concatenate([A[0], A[-1], A[:, 0], A[:, -1]]); bg = np.median(border, 0)
    if bg.max() < 0.12: return Image.fromarray((A * 255).astype(np.uint8))
    near = np.sqrt(((A - bg) ** 2).sum(-1)) < 0.22
    reach = np.zeros_like(near); reach[0] |= near[0]; reach[-1] |= near[-1]; reach[:, 0] |= near[:, 0]; reach[:, -1] |= near[:, -1]
    for _ in range(3000):
        g = reach.copy(); g[1:] |= reach[:-1]; g[:-1] |= reach[1:]; g[:, 1:] |= reach[:, :-1]; g[:, :-1] |= reach[:, 1:]; g &= near
        if (g == reach).all(): break
        reach = g
    return Image.fromarray((A * (~reach)[..., None] * 255).astype(np.uint8))

def palette(img, n=14):
    """the effect's own colours (median cut over its lit pixels only: the black around it would muddy every colour)"""
    A = np.asarray(img.convert('RGB').resize((256, 256), Image.BOX)).reshape(-1, 3); A = A[A.max(-1) > 40]
    side = int(np.ceil(np.sqrt(len(A)))); pad = np.zeros((side * side, 3), np.uint8); pad[:len(A)] = A; pad[len(A):] = A[:side * side - len(A)] if len(A) else 0
    q = Image.fromarray(pad.reshape(side, side, 3)).quantize(colors=n, method=Image.Quantize.MEDIANCUT)
    return np.array(q.getpalette()[:n * 3], np.float32).reshape(-1, 3) / 255

def pixel_frame(C, grid, pal, cell):
    im = Image.fromarray((np.clip(C, 0, 1) * 255).astype(np.uint8)).resize((grid, grid), Image.BOX)
    a = np.asarray(im).astype(np.float32) / 255
    b = np.tile(HFX.BAYER, (grid // 4 + 1, grid // 4 + 1))[:grid, :grid, None] * 0.09
    on = (a.max(-1) + b[..., 0] * 0.6) > 0.3                      # dithered edge; the faint dark haze painted round an effect stays empty (it read as a solid dark disc)
    d = ((a + b)[:, :, None, :] - pal[None, None]) ** 2
    rgb = pal[d.sum(-1).argmin(-1)]
    out = np.zeros((grid, grid, 4), np.float32); out[..., :3] = rgb; out[..., 3] = on & (rgb.max(-1) > 0.02)
    return np.asarray(Image.fromarray((out * 255).astype(np.uint8), 'RGBA').resize((cell, cell), Image.NEAREST))

def bake(src, kind, seed, ramp=None):
    mode, grid = KIND[kind]
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / 'src.png'; im = on_black(src); (repaint(im, ramp) if ramp is not None else im).save(p)
        frames = HFX.bake(p, mode, seed, raw=True)
        pal = palette(Image.open(p))
    cell = grid
    sheet = np.zeros((cell * 4, cell * 4, 4), np.uint8)
    for i, C in enumerate(frames):
        r, c = divmod(i, 4); sheet[r * cell:(r + 1) * cell, c * cell:(c + 1) * cell] = pixel_frame(C, grid, pal, cell)
    return Image.fromarray(sheet, 'RGBA')

def mob_table():
    import re
    src = (HERE.parent / 'src/game/45b-mob-fx.js').read_text()
    return json.loads(re.search(r'/\* <mob-fx> \*/(.*?)/\* </mob-fx> \*/', src, re.S).group(1))

def main():
    args = sys.argv[1:]; mobs = args[:1] == ['--mobs']; src = Path(args[-1]); OUT.mkdir(parents=True, exist_ok=True)
    pics = {tuple(f.stem.split('_')[1:3]): f for f in sorted(src.glob('fx_*.*'))}
    if mobs:
        out = HERE.parent / 'assets/fx/mob'
        for i, (sid, sp) in enumerate(sorted(mob_table()['species'].items())):
            kind = MOB_KIND[sp['hit']]; donor = pics.get((kind, DONOR[kind])) or next(f for (k, _), f in pics.items() if k == kind)
            bake(donor, kind, 900 + i, ramp_of(sp['c'])).save(out / f'hit_{sid}.png', optimize=True)
        print('monster bursts', i + 1); return
    for i, kind in enumerate(KIND):
        for j, pal in enumerate(FX_PALS[kind]):
            f = pics.get((kind, pal)); donor = pics.get((kind, DONOR[kind]))
            if f: bake(f, kind, 500 + i * 10 + j).save(OUT / f'{kind}_{pal}.png', optimize=True)
            elif donor: bake(donor, kind, 500 + i * 10 + j, RAMP[pal]).save(OUT / f'{kind}_{pal}.png', optimize=True); print('repainted', kind, pal)
    idx = {}
    for p in sorted(OUT.glob('*_*.png')): k, pal = p.stem.split('_', 1); idx.setdefault(k, []).append(pal)
    (OUT / 'index.json').write_text(json.dumps(idx) + '\n'); print(sum(len(v) for v in idx.values()), 'painted sheets')

if __name__ == '__main__':
    main()
