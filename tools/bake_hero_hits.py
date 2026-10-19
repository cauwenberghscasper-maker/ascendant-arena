"""Pixel-art hit bursts for every Codex hero (assets/fx/hero/hit_<hero>.png): what a basic attack does when it lands.

python3 tools/bake_hero_hits.py [hero ...]

Same pixel language as tools/bake_fx.py (its Canvas, 4x4 ordered dither, ink outline), but each hero gets its own
burst drawn from its story (combat_kits.json: Wrenna's seawater crown, Corrin's petals, Ysolt's ink, Jory's soul sparks,
Tychon's pips...) in a 6-step ramp from its own colour (BASE). 16 frames of 48 px in a 4x4 sheet, with alpha.
A painted hit_<hero> picture in assets/concepts/hero_fx/ (tools/bake_hero_fx.py) replaces it when one is made.
"""
import importlib.util, json, math, sys
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('bake_fx', HERE / 'bake_fx.py'); FX = importlib.util.module_from_spec(spec); spec.loader.exec_module(FX)
W, F, COLS = 48, 16, 4

# which burst each hero's hit is, and the palette key to build its ramp from (combat_kits.json palette names)
STYLE = {
    'wrenna': 'splash', 'hob': 'ring', 'corrin': 'petals', 'mott': 'spatter', 'nyssa': 'glint', 'pyrrhos': 'sparks',
    'moss': 'fibres', 'ione': 'mist', 'fenwick': 'claw', 'thimble': 'fibres', 'unwritten': 'chips', 'lysandra': 'chips',
    'kallix': 'sparks', 'oko': 'glint', 'ysolt': 'spatter', 'halven': 'sparks', 'sena': 'fibres', 'jory': 'sparks',
    'sleeper': 'splash', 'camedown': 'chips', 'vell': 'glint', 'hespera': 'sparks', 'kerberon': 'jaws', 'ophira': 'glint',
    'tychon': 'pips', 'aurvan': 'mist', 'ourax': 'chips',
}

# the burst's own colour, taken from what the hit is made of (seawater, blossom, wax, ink, soul sparks...)
BASE = {
    'wrenna': '#3fd0c0', 'hob': '#d8963a', 'corrin': '#ff8fb8', 'mott': '#e8503a', 'nyssa': '#bcd8ec', 'pyrrhos': '#d8963a',
    'moss': '#d8343a', 'ione': '#94d0ff', 'fenwick': '#d4e0f4', 'thimble': '#e8bc3c', 'unwritten': '#f0e2b8', 'lysandra': '#e4e0d6',
    'kallix': '#ff7428', 'oko': '#fff0a8', 'ysolt': '#c42038', 'halven': '#ffd040', 'sena': '#ff3446', 'jory': '#56b4ff',
    'sleeper': '#2ea49c', 'camedown': '#ffd474', 'vell': '#c49cff', 'hespera': '#ff8424', 'kerberon': '#ff7434', 'ophira': '#dce6f0',
    'tychon': '#a666ff', 'aurvan': '#cce4ff', 'ourax': '#8c6c3c',
}

def hexrgb(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32)

def ramp_of(hex_base):
    """6 steps from a deep shade to a near-white tint of the burst's colour"""
    base = hexrgb(hex_base)
    steps = [base * 0.22, base * 0.45, base * 0.75, base, base + (255 - base) * 0.45, base + (255 - base) * 0.85]
    return ['#%02x%02x%02x' % tuple(int(min(255, v)) for v in c) for c in steps]

def splash(c, f, n, R):
    cx, cy, t = W / 2, W * 0.62, f / (n - 1)
    if f < 3: c.ellipse(cx, cy, 5 + f * 4, 2 + f * 1.5, 1.0, 0.4)
    c.ring(cx, cy + 1, 4 + t * 16, 1.4, max(0, 0.8 - t))
    for k in range(9):
        a = math.pi * (0.15 + 0.7 * R[k]); sp = 9 + R[k + 9] * 9; tt = t * 1.3
        x = cx + math.cos(a) * sp * tt * (1 if k % 2 else -1); y = cy - math.sin(a) * sp * tt * 1.6 + 22 * tt * tt
        if tt < 1.05 and y < W - 2: c.disc(x, y, 2.2 * (1 - t * 0.6), 0.95 - t * 0.4)

def ring(c, f, n, R):
    cx, cy, t = W / 2, W / 2, f / (n - 1)
    c.ring(cx, cy, 3 + t * 18, 2.6 * (1 - t) + 0.8, 1 - t * 0.7)
    if f < 4: c.ring(cx, cy, 2 + t * 30, 1.2, 0.8)
    for k in range(10):
        a = R[k] * 6.283; s = 6 + t * 16 + R[k + 10] * 4
        if t < 0.9: c.px(cx + math.cos(a) * s, cy + math.sin(a) * s, 0.7, 'S')

def petals(c, f, n, R):
    cx, cy, t = W / 2, W / 2, f / (n - 1)
    if f < 3: c.disc(cx, cy, 4 + f * 3, 1.0, 0.5)
    for k in range(12):
        a = R[k] * 6.283; s = (4 + R[k + 12] * 14) * min(1, t * 2.2); y = cy + math.sin(a) * s + 10 * t * t
        x = cx + math.cos(a) * s + math.sin(t * 9 + k) * 2
        if t < 0.95: c.ellipse(x, y, 2.4, 1.3, 0.85 - t * 0.45)

def spatter(c, f, n, R):
    cx, cy, t = W / 2, W / 2, f / (n - 1)
    if f < 2: c.disc(cx, cy, 5 + f * 3, 1.0, 0.3)
    for k in range(8):
        a = R[k] * 6.283; s = (5 + R[k + 8] * 13) * min(1, t * 3)
        x, y = cx + math.cos(a) * s, cy + math.sin(a) * s + 8 * t * t
        if t < 0.92: c.disc(x, y, 2.6 - t * 1.4 + R[k + 16], 0.9 - t * 0.35)
        if t > 0.3 and t < 0.92: c.line(x, y, x, y + 4 * t, 0.7, 0.4)   # drips

def glint(c, f, n, R):
    cx, cy, t = W / 2, W / 2, f / (n - 1)
    c.star(cx, cy, max(0, 14 * (1 - abs(t - 0.2) / 0.5)), 1.0, w=1.4, diag=0.6)
    for k in range(7):
        b = max(0, math.sin((t * 2.2 + R[k]) * math.pi)); a = R[k + 7] * 6.283; s = 6 + R[k + 14] * 14
        if b > 0.3 and t < 0.95: c.star(cx + math.cos(a) * s, cy + math.sin(a) * s, 1.5 + 3 * b, 0.6 + 0.4 * b, w=0.8)
    if f < 5: c.disc(cx, cy, 6 - f, 0.4, 0.5, 'S')

def sparks(c, f, n, R):
    cx, cy, t = W / 2, W / 2, f / (n - 1)
    if f < 3: c.disc(cx, cy, 3 + f * 3, 1.0, 0.4); c.star(cx, cy, 8 + f * 3, 0.9)
    for k in range(12):
        a = R[k] * 6.283; sp = 10 + R[k + 12] * 12; x = cx + math.cos(a) * sp * t; y = cy + math.sin(a) * sp * t + 14 * t * t
        ln = 3 * (1 - t)
        if t < 0.95: c.line(x, y, x - math.cos(a) * ln, y - math.sin(a) * ln + 2 * t, 1.0 - t * 0.5, 0.6 - t * 0.4)
    if 0.2 < t < 0.7: c.disc(cx, cy - 6 * t, 3 + 4 * t, 0.25, 0.6, 'S')

def fibres(c, f, n, R):
    cx, cy, t = W / 2, W / 2, f / (n - 1)
    for k in range(6):
        a0 = R[k] * 6.283; L = 6 + R[k + 6] * 12
        pts = [(cx + math.cos(a0 + j * 0.35) * L * min(1, t * 2.5) * j / 6 + math.sin(j + k) * 2, cy + math.sin(a0 + j * 0.35) * L * min(1, t * 2.5) * j / 6 + 6 * t * t) for j in range(7)]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            if t < 0.94: c.line(x0, y0, x1, y1, 0.95 - t * 0.5)
    if f < 3: c.disc(cx, cy, 3 + f * 2, 0.9, 0.4)

def mist(c, f, n, R):
    cx, cy, t = W / 2, W / 2, f / (n - 1)
    for k in range(6):
        a = R[k] * 6.283; s = 3 + t * 12; c.disc(cx + math.cos(a) * s, cy + math.sin(a) * s * 0.7 - 4 * t, 3 + t * 3, 0.42 * (1 - t), 0.8)
    for k in range(5):
        a = R[k + 6] * 6.283; s = 5 + t * 14; x, y = cx + math.cos(a) * s, cy + math.sin(a) * s
        if t < 0.9:   # small crescents / note shards
            c.ring(x, y, 2.4, 1.0, 0.9 - t * 0.5); c.disc(x + 1.2, y - 1.2, 1.9, 0, 0)
    if f < 3: c.star(cx, cy, 6 + f * 3, 0.9, w=1.0)

def claw(c, f, n, R):
    cx, cy, t = W / 2, W / 2, f / (n - 1)
    grow = min(1, t * 3); fade = 1 - max(0, (t - 0.45) / 0.55)
    for k in (-1, 0, 1):
        x0, y0 = cx - 14 + k * 6, cy - 14; x1, y1 = x0 + 26 * grow, y0 + 26 * grow
        c.line(x0, y0, x1, y1, fade, fade * 0.6, w=2.6 - abs(k) * 0.6)
    if 0.1 < t < 0.6:
        for k in range(6): a = R[k] * 6.283; s = 8 + t * 10; c.px(cx + math.cos(a) * s, cy + math.sin(a) * s, 0.7)

def chips(c, f, n, R):
    cx, cy, t = W / 2, W * 0.58, f / (n - 1)
    if f < 3: c.disc(cx, cy, 4 + f * 3, 0.95, 0.4)
    c.disc(cx, cy - 2 * t, 3 + t * 8, 0.28 * (1 - t), 0.6, 'S')
    for k in range(9):
        a = math.pi * (1.05 + 0.9 * R[k]); sp = 10 + R[k + 9] * 10
        x = cx + math.cos(a) * sp * t; y = cy + math.sin(a) * sp * t * 1.4 + 20 * t * t
        if t < 0.95 and y < W - 1:
            s = 1.6 + R[k + 18] * 1.4
            for dx in range(int(s) + 1):
                for dy in range(int(s)): c.px(x + dx, y + dy, 0.9 - t * 0.3)

def jaws(c, f, n, R):
    cx, cy, t = W / 2, W / 2, f / (n - 1)
    shut = min(1, t / 0.35); gap = 12 * (1 - shut); fade = 1 - max(0, (t - 0.5) / 0.5)
    for side in (-1, 1):
        y = cy + side * (3 + gap)
        c.ellipse(cx, y, 14, 3, fade * 0.85, 0.5)
        for k in range(5): x = cx - 10 + k * 5; c.line(x, y, x + 1, y - side * 4, fade, fade * 0.7)
    if 0.3 < t < 0.9: c.disc(cx, cy, 5 + t * 10, 0.5 * fade, 0.6, 'S')

def pips(c, f, n, R):
    cx, cy, t = W / 2, W / 2, f / (n - 1)
    if f < 3: c.disc(cx, cy, 4 + f * 3, 1.0, 0.4)
    for k in range(10):
        a = k / 10 * 6.283 + R[k] * 0.3; s = 4 + t * 17
        if t < 0.92: c.disc(cx + math.cos(a) * s, cy + math.sin(a) * s, 2.2 - t, 0.95 - t * 0.4)
    c.ring(cx, cy, 2 + t * 20, 1.0, 0.5 * (1 - t))

STYLES = dict(splash=splash, ring=ring, petals=petals, spatter=spatter, glint=glint, sparks=sparks, fibres=fibres,
              mist=mist, claw=claw, chips=chips, jaws=jaws, pips=pips)

def main():
    kits = {h['id']: h for h in json.load(open(HERE.parent / 'assets/heroes/combat_kits.json'))}
    out = HERE.parent / 'assets/fx/hero'; out.mkdir(parents=True, exist_ok=True)
    for i, hero in enumerate(sys.argv[1:] or sorted(STYLE)):
        if hero not in kits: print('unknown', hero); continue
        FX.RAMPS['h_' + hero] = ramp_of(BASE[hero])
        R = np.random.RandomState(97 + i * 13).rand(40)
        sheet = np.zeros((W * (F // COLS), W * COLS, 4), np.uint8)
        for f in range(F):
            c = FX.Canvas(W, W); STYLES[STYLE[hero]](c, f, F, R)
            r, k = divmod(f, COLS)
            sheet[r * W:(r + 1) * W, k * W:(k + 1) * W] = c.render('h_' + hero, outline='#120c0a', smoke_ramp=FX.smoke_of('h_' + hero))
        Image.fromarray(sheet).save(out / f'hit_{hero}.png', optimize=True)
        print(hero, STYLE[hero], (out / f'hit_{hero}.png').stat().st_size // 1024, 'KB')
    write_index(out)

def write_index(out):
    """assets/fx/hero/index.json: which sheets exist, so the game loads only those (no 404s)"""
    idx = {}
    for p in sorted(out.glob('*_*.*')):
        if p.suffix in ('.png', '.webp'): kind, hero = p.stem.split('_', 1); idx.setdefault(kind, []).append(hero)
    (out / 'index.json').write_text(json.dumps(idx) + '\n')

if __name__ == '__main__':
    main()
