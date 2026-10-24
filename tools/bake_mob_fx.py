"""Monster attack art for every species (assets/fx/mob/), from the MOB_FX table in src/game/45b-mob-fx.js.

python3 tools/bake_mob_fx.py                      bits.png atlas, index.json
python3 tools/bake_mob_fx.py --drawn-hits         code-drawn hit_<species>.png (replaced by painted ones: bake_fx_gen.py --mobs)
python3 tools/bake_mob_fx.py --ammo DIR [id ...]  also cut out ammo_<species>.png from DIR/<species>.* (picks below)

bits.png  the pixel particles monsters shed (thistle fluff, leaves, feathers, spores, embers, frost, bubbles, sparks,
          ink, webs, runes...): 16 px cells in an 8-wide atlas, drawn in grey levels with an ink outline. The game
          paints each one in its species' colour (a gradient map in the shader), so one atlas serves every monster.
hit_<id>  the burst a species' moves, shots and death make: the hero hit styles of tools/bake_hero_hits.py (splash,
          petals, chips, claw, jaws, mist...) in a 6-step ramp from the species' own colour. 16 frames, 48 px, 4x4.
ammo_<id> the projectile of a species that shoots: a generated pixel picture (Z-Image Turbo, batch mob-ammo-a on
          asset-drop) cut out of its flat background (magenta, or lime for purple and pink shots), pixel-snapped to its
          own palette with an ink outline, 4 quarter turns so it tumbles. 64 px frames in a row.
"""
import importlib.util, json, math, re, sys
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = ROOT / 'assets/fx/mob'
def load(name, file):
    sp = importlib.util.spec_from_file_location(name, HERE / file); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m
FX = load('bake_fx', 'bake_fx.py')
HITS = load('bake_hero_hits', 'bake_hero_hits.py')
HFX = load('bake_hero_fx', 'bake_hero_fx.py')

def table():
    src = (ROOT / 'src/game/45b-mob-fx.js').read_text()
    m = re.search(r'/\* <mob-fx> \*/(.*?)/\* </mob-fx> \*/', src, re.S)
    return json.loads(m.group(1))

# ------------------------------------------------------------------ particle glyphs (16 px, grey levels)
G = 16
YY, XX = np.mgrid[0:G, 0:G] + 0.5

class Glyph:
    def __init__(self): self.H = np.zeros((G, G))
    def put(self, m, v): self.H[m] = np.maximum(self.H[m], v if np.isscalar(v) else v[m])
    def disc(self, x, y, r, v, soft=0.0):
        d = np.hypot(XX - x, YY - y); self.put(d <= r, v * (1 - soft * np.clip(d / max(r, 1e-3), 0, 1) ** 1.5) if soft else v)
    def ellipse(self, x, y, rx, ry, v, rot=0.0):
        c, s = math.cos(rot), math.sin(rot); dx, dy = XX - x, YY - y; u, w = c * dx + s * dy, -s * dx + c * dy
        self.put((u / rx) ** 2 + (w / ry) ** 2 <= 1, v)
    def line(self, x0, y0, x1, y1, v0, v1=None, w=1.0):
        v1 = v0 if v1 is None else v1; n = int(max(abs(x1 - x0), abs(y1 - y0)) * 3) + 2
        for i in range(n + 1):
            a = i / n; x, y = x0 + (x1 - x0) * a, y0 + (y1 - y0) * a; v = v0 + (v1 - v0) * a
            if w <= 1.05: self.px(x, y, v)
            else: self.disc(x, y, w / 2, v)
    def px(self, x, y, v):
        x, y = int(math.floor(x)), int(math.floor(y))
        if 0 <= x < G and 0 <= y < G: self.H[y, x] = max(self.H[y, x], v)
    def ring(self, x, y, r, th, v, a0=None, a1=None):
        d = np.hypot(XX - x, YY - y); m = np.abs(d - r) <= th / 2
        if a0 is not None: a = np.arctan2(YY - y, XX - x); m &= (a >= a0) & (a <= a1)
        self.put(m, v)
    def star(self, x, y, r, v, pts=5, rot=0.0, inner=0.45):
        a = np.arctan2(YY - y, XX - x) - rot; d = np.hypot(XX - x, YY - y)
        k = np.abs(((a * pts / (2 * math.pi)) % 1) - 0.5) * 2          # 1 at a point, 0 between
        self.put(d <= r * (inner + (1 - inner) * k), v * (1 - 0.3 * np.clip(d / r, 0, 1)))
    def clear(self, m): self.H[m] = 0

def g_fluff(g, f):
    for k in range(9):
        a = k / 9 * 6.283 + 0.3; g.line(8, 8, 8 + math.cos(a) * 6.5, 8 + math.sin(a) * 6.5, 0.55, 0.95)
    g.disc(8, 8, 1.8, 0.75)
def g_leaf(g, f):
    for i in range(13):
        t = i / 12; x, y = 3 + 10 * t, 13 - 10 * t; g.disc(x, y, 0.4 + 3.0 * math.sin(t * math.pi), 0.72 - 0.15 * t)
    g.line(3, 13, 12.5, 3.5, 0.45); g.disc(5.5, 8.5, 1.3, 0.95)
def g_petal(g, f):
    g.ellipse(8, 8, 5.5, 3.2, 0.78, rot=-0.6); g.ellipse(7, 7, 2.5, 1.4, 1.0, rot=-0.6); g.px(12, 5, 0)
def g_feather(g, f):
    for i in range(10):
        t = i / 9; x, y = 3 + 10 * t, 13 - 10 * t; L = 3.6 * math.sin(min(1, t * 1.1) * math.pi) + 0.6
        g.line(x, y, x - L * 0.7, y - L * 0.7 - 1, 0.8 + 0.2 * (i % 2)); g.line(x, y, x + L * 0.7 + 1, y + L * 0.7, 0.62)
    g.line(2, 14, 13, 3, 0.4)
def g_spore(g, f):
    g.disc(8, 8, 5, 0.68, 0.3); g.disc(6.2, 6.4, 1.3, 1.0); g.disc(10, 9.5, 1.0, 0.95); g.disc(7, 10.5, 0.8, 0.9)
def g_pollen(g, f):
    g.disc(8, 8, 2.4, 1.0); g.px(4, 6, 0.8); g.px(12, 5, 0.75); g.px(11, 12, 0.8); g.px(5, 11, 0.7)
def g_needle(g, f):
    for i in range(12):
        t = i / 11; g.disc(3 + 10 * t, 13 - 10 * t, 1.5 - 1.2 * t, 0.6 + 0.4 * t)
def g_clod(g, f):
    for x, y, r in ((7, 9, 3.6), (10, 8, 2.8), (6, 6.5, 2.2), (9.5, 11, 2.2)): g.disc(x, y, r, 0.5)
    g.disc(6.5, 7, 1.6, 0.75); g.px(10, 7, 0.85)
def g_pebble(g, f):
    g.ellipse(8, 8.5, 5.2, 4.0, 0.55, rot=0.3); g.ellipse(6.6, 6.8, 2.6, 1.6, 0.85, rot=0.3); g.clear((XX - YY) > 8.5)
def g_shard(g, f):
    c, s = math.cos(0.6), math.sin(0.6); dx, dy = XX - 8, YY - 8; u, w = c * dx + s * dy, -s * dx + c * dy
    m = np.abs(u) / 2.6 + np.abs(w) / 7.2 <= 1; g.put(m & (u < 0), 1.0); g.put(m & (u >= 0), 0.62)
def g_flake(g, f):
    for k in range(6):
        a = k / 6 * 6.283; x1, y1 = 8 + math.cos(a) * 6.5, 8 + math.sin(a) * 6.5; g.line(8, 8, x1, y1, 0.9)
        mx, my = 8 + math.cos(a) * 4, 8 + math.sin(a) * 4
        for s in (-1, 1): g.line(mx, my, mx + math.cos(a + s * 0.9) * 1.8, my + math.sin(a + s * 0.9) * 1.8, 0.75)
    g.disc(8, 8, 1.4, 1.0)
def g_ember(g, f):
    if f == 0: g.disc(8, 8, 3.4, 0.75, 0.2); g.disc(8, 7.5, 1.8, 1.0)
    else: g.disc(8, 8.5, 2.7, 0.7); g.disc(8.5, 8, 1.3, 1.0); g.px(5, 5, 0.8); g.px(11, 6, 0.7)
def g_spark(g, f):
    if f == 0: g.star(8, 8, 7, 1.0, pts=4, inner=0.18)
    else: g.star(8, 8, 4.5, 1.0, pts=4, rot=0.785, inner=0.25)
def g_drop(g, f):
    g.disc(8, 10, 3.6, 0.7)
    for i in range(6): t = i / 5; g.disc(8, 10 - 6.5 * t, 3.3 * (1 - t) + 0.3, 0.7)
    g.disc(6.8, 9.2, 1.0, 1.0)
def g_bubble(g, f):
    g.ring(8, 8, 5, 1.4, 0.82); g.disc(6, 5.8, 1.2, 1.0); g.px(10, 11, 0.6)
def g_glob(g, f):
    g.disc(7.5, 8.5, 4.2, 0.62); g.disc(11, 6, 2.2, 0.62); g.disc(4.5, 12, 1.4, 0.62); g.disc(6.5, 7, 1.4, 1.0)
def g_ink(g, f):
    g.disc(8, 8, 4, 0.42)
    for a, d, r in ((0.3, 5.5, 1.6), (2.0, 5, 1.3), (3.6, 5.8, 1.5), (5.0, 5.2, 1.1)): g.disc(8 + math.cos(a) * d, 8 + math.sin(a) * d, r, 0.42)
    g.disc(6.5, 6.5, 1.1, 0.7)
def g_sand(g, f):
    for x, y, r, v in ((5, 6, 1.6, 0.8), (10.5, 5.5, 1.3, 0.65), (8, 11, 1.9, 0.75), (12, 11.5, 1.0, 0.95)): g.disc(x, y, r, v)
def g_web(g, f):
    pts = [(2 + i, 8 + math.sin(i * 0.7) * 3.5) for i in range(13)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]): g.line(x0, y0, x1, y1, 0.9)
    g.line(6, 3, 9, 13, 0.6); g.px(6, 3, 1.0); g.px(14, 8 + math.sin(12 * 0.7) * 3.5, 1.0)
def g_bone(g, f):
    g.line(4.5, 11.5, 11.5, 4.5, 0.85, w=2.6)
    for x, y in ((3.2, 11), (5, 12.8), (11, 3.2), (12.8, 5)): g.disc(x, y, 1.7, 0.9)
def g_scale(g, f):
    g.ellipse(8, 8, 5.2, 4.4, 0.55); g.ring(8, 9.5, 4.2, 1.2, 0.9, -3.0, -0.14); g.disc(6.5, 6.8, 1.0, 0.95); g.clear(YY > 12.8)
def g_coral(g, f):
    g.line(8, 14, 8, 6, 0.75, 0.9, w=2.2); g.line(8, 10, 4, 5, 0.8, 0.95, w=1.8); g.line(8, 8, 12, 3.5, 0.8, 1.0, w=1.8)
    for x, y in ((8, 5.5), (4, 4.5), (12, 3)): g.disc(x, y, 1.2, 1.0)
def g_bolt(g, f):
    P = [(10, 1), (6, 7), (10, 8), (5, 15)] if f == 0 else [(6, 1), (10, 6), (6, 9), (11, 15)]
    for (x0, y0), (x1, y1) in zip(P, P[1:]): g.line(x0, y0, x1, y1, 1.0, w=1.7)
def g_smoke(g, f):
    r = 2.8 + f * 1.1
    for a, d in ((0.0, 0), (2.2, r * 0.6), (4.2, r * 0.55), (5.6, r * 0.5)): g.disc(8 + math.cos(a) * d, 8.5 + math.sin(a) * d, r * (0.85 if d else 1), 0.55 - f * 0.08, 0.35)
    g.disc(6.8, 7, r * 0.45, 0.72 - f * 0.1)
def g_wisp(g, f):
    s = 1 if f == 0 else -1
    for i in range(7): t = i / 6; g.disc(8 + s * math.sin(t * 3.2) * 2.6, 5 + t * 9, 3.2 * (1 - t) + 0.5, 0.95 - 0.35 * t)
    g.disc(7.5, 4.5, 1.1, 1.0)
def g_rune(g, f):
    g.ring(8, 8, 5.5, 1.3, 0.85); g.line(8, 4, 8, 12, 1.0); g.line(5, 7, 11, 9, 1.0); g.px(5, 11, 0.8)
def g_mote(g, f):
    g.disc(8, 8, 3.6, 1.0, 0.75); g.disc(8, 8, 1.6, 1.0)
def g_star(g, f):
    g.star(8, 8.3, 6.5 if f == 0 else 5.2, 1.0, pts=5, rot=-math.pi / 2 + (0 if f == 0 else 0.3))
def g_chip(g, f):
    g.ellipse(8, 8, 4.4, 2.4, 0.5, rot=0.5); g.px(5, 6, 0.75); g.px(10, 8, 0.7); g.px(11, 9, 0)
def g_arc(g, f):
    g.ring(6, 8, 6, 1.6, 1.0, -1.05, 1.05); g.ring(6, 8, 3.2, 1.2, 0.8, -0.9, 0.9)

DRAW = dict(fluff=g_fluff, leaf=g_leaf, petal=g_petal, feather=g_feather, spore=g_spore, pollen=g_pollen, needle=g_needle,
            clod=g_clod, pebble=g_pebble, shard=g_shard, flake=g_flake, ember=g_ember, spark=g_spark, drop=g_drop,
            bubble=g_bubble, glob=g_glob, ink=g_ink, sand=g_sand, web=g_web, bone=g_bone, scale=g_scale, coral=g_coral,
            bolt=g_bolt, smoke=g_smoke, wisp=g_wisp, rune=g_rune, mote=g_mote, star=g_star, chip=g_chip, arc=g_arc)
LEVELS = np.array([0.38, 0.58, 0.8, 1.0])
INK = 10                                     # grey 10/255 = the ink outline (the shader keeps it dark)

def render_glyph(g):
    H = np.clip(g.H, 0, 1); on = H > 0.08
    dith = FX.BAYER[(np.arange(G)[:, None] % 4), (np.arange(G)[None, :] % 4)]
    idx = np.clip(np.floor(H * (len(LEVELS) - 0.01) + (dith - 0.5) * 0.6), 0, len(LEVELS) - 1).astype(int)
    lum = (LEVELS[idx] * 255).astype(np.uint8)
    img = np.zeros((G, G, 4), np.uint8); img[on, :3] = lum[on, None]; img[on, 3] = 255
    edge = np.zeros_like(on); edge[1:] |= on[:-1]; edge[:-1] |= on[1:]; edge[:, 1:] |= on[:, :-1]; edge[:, :-1] |= on[:, 1:]; edge &= ~on
    img[edge] = (INK, INK, INK, 255)
    return img

CELL = 32                                   # atlas cell (px): a drawn 16 px glyph is doubled, a painted one fills it

def gen_glyph(src, f):
    """a generated particle picture (grey shades on a flat background): cut out, grey levels with dither, ink outline;
    later frames of an animated glyph turn and shrink a little"""
    A, alpha = cut_out(src); ys, xs = np.nonzero(alpha > 0)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1; side = max(y1 - y0, x1 - x0); cy, cx = (y0 + y1) // 2, (x0 + x1) // 2; h = side // 2 + 4
    L = A.max(-1) * 0.55 + A.min(-1) * 0.45
    im = Image.fromarray((np.dstack([L, L, L, alpha]) * 255).astype(np.uint8), 'RGBA').crop((cx - h, cy - h, cx + h, cy + h))
    if f: im = im.rotate(-25 * f, resample=Image.BICUBIC).resize((int(im.width * (1 - 0.12 * f)),) * 2, Image.BOX)
    g = CELL - 2; small = np.asarray(im.resize((g, g), Image.BOX)).astype(np.float32) / 255
    al = keep_big(small[..., 3] > 0.5, 6); lum = small[..., 0] / np.maximum(small[..., 3], 1e-3)
    dith = FX.BAYER[(np.arange(g)[:, None] % 4), (np.arange(g)[None, :] % 4)]
    lv = np.array([0.1] + list(LEVELS)); q = lv[np.clip(np.round(lum * (len(lv) - 1) + (dith - 0.5) * 0.5).astype(int), 0, len(lv) - 1)]
    q = np.maximum(q, 0.38)                                                   # the darkest line art becomes the ink below
    out = np.zeros((CELL, CELL, 4), np.uint8); A2 = np.pad(al, 1)
    ink = np.zeros_like(A2); ink[1:] |= A2[:-1]; ink[:-1] |= A2[1:]; ink[:, 1:] |= A2[:, :-1]; ink[:, :-1] |= A2[:, 1:]; ink &= ~A2
    dark = np.pad(al & (lum < 0.22), 1)                                       # the picture's own black outline stays ink
    out[1:-1, 1:-1][al] = np.dstack([(q * 255).astype(np.uint8)] * 3 + [np.full((g, g), 255, np.uint8)])[al]
    out[ink | dark] = (INK, INK, INK, 255)
    return out

def bake_bits(T, gen=None):
    cells = {}
    for name, gl in T['glyphs'].items():
        for f in range(gl['n']): cells[gl['cell'] + f] = (name, f)
    n = max(cells) + 1; cols = 8; rows = (n + cols - 1) // cols
    atlas = np.zeros((rows * CELL, cols * CELL, 4), np.uint8)
    for i, (name, f) in cells.items():
        r, c = divmod(i, cols); src = gen and next((p for p in (gen / (name + e) for e in ('.webp', '.png')) if p.exists()), None)
        if src: tile = gen_glyph(src, f)
        else: g = Glyph(); DRAW[name](g, f); tile = np.asarray(Image.fromarray(render_glyph(g), 'RGBA').resize((CELL, CELL), Image.NEAREST))
        atlas[r * CELL:(r + 1) * CELL, c * CELL:(c + 1) * CELL] = tile
    Image.fromarray(atlas, 'RGBA').save(OUT / 'bits.png', optimize=True)
    print('bits.png', len(cells), 'cells', atlas.shape[1], 'x', atlas.shape[0])

# ------------------------------------------------------------------ impact bursts
def bake_hits(T):
    W, F, COLS = HITS.W, HITS.F, HITS.COLS
    for i, (sid, s) in enumerate(sorted(T['species'].items())):
        HITS.FX.RAMPS['m_' + sid] = HITS.ramp_of(s['c'])
        R = np.random.RandomState(311 + i * 17).rand(40)
        sheet = np.zeros((W * (F // COLS), W * COLS, 4), np.uint8)
        for f in range(F):
            c = HITS.FX.Canvas(W, W); HITS.STYLES[s['hit']](c, f, F, R); r, k = divmod(f, COLS)
            sheet[r * W:(r + 1) * W, k * W:(k + 1) * W] = c.render('m_' + sid, outline='#120c0a', smoke_ramp=HITS.FX.smoke_of('m_' + sid))
        Image.fromarray(sheet).save(OUT / f'hit_{sid}.png', optimize=True)
    print('hit sheets', len(T['species']))

# ------------------------------------------------------------------ projectiles
def cut_out(src):
    """alpha mask of the projectile: everything not connected to the border through background-coloured pixels"""
    A = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
    border = np.concatenate([A[0], A[-1], A[:, 0], A[:, -1]]); bg = np.median(border, 0)
    near = np.sqrt(((A - bg) ** 2).sum(-1)) < 0.28
    # flood the background from the border (4-neighbour, iterative dilation inside 'near')
    reach = np.zeros_like(near); reach[0] |= near[0]; reach[-1] |= near[-1]; reach[:, 0] |= near[:, 0]; reach[:, -1] |= near[:, -1]
    for _ in range(2000):
        g = reach.copy(); g[1:] |= reach[:-1]; g[:-1] |= reach[1:]; g[:, 1:] |= reach[:, :-1]; g[:, :-1] |= reach[:, 1:]; g &= near
        if (g == reach).all(): break
        reach = g
    alpha = ~reach
    # soften the fringe: pixels still close to the key colour inside the shape go too
    alpha &= np.sqrt(((A - bg) ** 2).sum(-1)) > 0.16
    return A, alpha.astype(np.float32)

def keep_big(m, min_px=16):
    """drop loose specks of background fringe: keep the biggest blob and any other blob of at least min_px pixels"""
    lab = np.zeros(m.shape, int); n = 0; sizes = {}
    for y, x in zip(*np.nonzero(m)):
        if lab[y, x]: continue
        n += 1; st = [(y, x)]; lab[y, x] = n; c = 0
        while st:
            a, b = st.pop(); c += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = a + dy, b + dx
                if 0 <= yy < m.shape[0] and 0 <= xx < m.shape[1] and m[yy, xx] and not lab[yy, xx]: lab[yy, xx] = n; st.append((yy, xx))
        sizes[n] = c
    if not sizes: return m
    big = max(sizes, key=sizes.get)
    return np.isin(lab, [k for k, v in sizes.items() if k == big or v >= min_px])

def bake_ammo(src):
    A, alpha = cut_out(src)
    ys, xs = np.nonzero(alpha > 0); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    side = max(y1 - y0, x1 - x0); cy, cx = (y0 + y1) // 2, (x0 + x1) // 2; h = side // 2 + 8
    rgba = np.dstack([A * alpha[..., None], alpha]); img = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA').crop((cx - h, cy - h, cx + h, cy + h))
    pal = HFX.palette_of(Image.fromarray((A * alpha[..., None] * 255).astype(np.uint8)), 12)[:-1]
    GR, CELL = 28, 64
    small = np.asarray(img.resize((GR, GR), Image.BOX)).astype(np.float32) / 255
    rgb, al = small[..., :3] / np.maximum(small[..., 3:], 1e-3), small[..., 3] > 0.5
    d = ((rgb[:, :, None, :] + np.tile(HFX.BAYER, (8, 8))[:GR, :GR, None, None] * 0.07 - pal[None, None]) ** 2).sum(-1)
    px = pal[d.argmin(-1)]
    al = keep_big(al)
    A2 = np.pad(al, 1); ink = np.zeros_like(A2)                                   # 1-pixel ink outline (no wrap-around)
    ink[1:] |= A2[:-1]; ink[:-1] |= A2[1:]; ink[:, 1:] |= A2[:, :-1]; ink[:, :-1] |= A2[:, 1:]; ink &= ~A2
    out = np.zeros((GR + 2, GR + 2, 4), np.float32); out[1:-1, 1:-1, :3] = px * al[..., None]; out[1:-1, 1:-1, 3] = al
    out[ink] = [0.07, 0.04, 0.02, 1]
    base = Image.fromarray((out * 255).astype(np.uint8), 'RGBA').resize((CELL, CELL), Image.NEAREST)
    frames = [np.asarray(base.rotate(-90 * k)).astype(np.float32) / 255 for k in range(4)]
    return Image.fromarray((HFX.sheet_of(frames, CELL, 4) * 255).astype(np.uint8), 'RGBA')

def write_index():
    idx = {}
    for p in sorted(OUT.glob('*_*.png')): kind, sid = p.stem.split('_', 1); idx.setdefault(kind, []).append(sid)
    (OUT / 'index.json').write_text(json.dumps(idx) + '\n')

def main():
    OUT.mkdir(parents=True, exist_ok=True); T = table(); args = sys.argv[1:]
    if args[:1] == ['--ammo']:
        src = Path(args[1]); want = args[2:] or sorted(T['species'])
        for sid in want:
            f = next((p for p in (src / (sid + e) for e in ('.webp', '.png', '.jpg')) if p.exists()), None)
            if f: bake_ammo(f).save(OUT / f'ammo_{sid}.png', optimize=True); print('ammo', sid)
    elif args[:1] == ['--bits']:
        bake_bits(T, Path(args[1]) if len(args) > 1 else None)  # DIR: generated particle pictures <glyph>.(webp|png)
    elif args[:1] == ['--drawn-hits']:
        bake_hits(T)                     # the old code-drawn bursts (painted ones: tools/bake_fx_gen.py --mobs)
    else:
        bake_bits(T)
    write_index()

if __name__ == '__main__':
    main()
