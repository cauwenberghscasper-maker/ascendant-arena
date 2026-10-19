"""Bake each hero's effect art into pixel-art flipbooks for the game (assets/fx/hero/).

python3 tools/bake_hero_fx.py assets/concepts/hero_fx [hero ...]
The folder holds three generated pictures per hero (Z-Image Turbo, Apache-2.0):
  super_<hero>.*  the super, on black   -> assets/fx/hero/super_<hero>.webp  4x4 frames of 128 px, played additively
  hit_<hero>.*    the hit burst, on black -> assets/fx/hero/hit_<hero>.png   4x4 frames of 64 px with alpha
                  (without a picture, tools/bake_hero_hits.py draws one in pixel art)
  ammo_<hero>.*   the projectile, on magenta -> assets/fx/hero/ammo_<hero>.png  4 frames of 64 px with alpha (it tumbles)
Pixel look: every frame is stepped down to a coarse grid, snapped to a limited palette taken from the hero's own picture
with a 4x4 ordered dither (the same family as tools/bake_fx.py), and scaled back up with hard pixel edges.

Each source is one painted key frame of the super (Z-Image Turbo, Apache-2.0, on a black background). The baker turns
it into a 4x4 sheet of 16 frames (256 px each) that plays once: the painting enters with its own motion (burst,
rise, swirl, fall, wave, spread), its brush strokes keep flowing while it holds, and it burns away along a painted
noise edge that glows hot, shedding embers. Every frame is made from the same painting, so the art stays the same
from frame to frame. Black stays black: the game draws the sheets additively, so black means no light.
"""
import math, sys
from pathlib import Path
import numpy as np
from PIL import Image

N, F, COLS = 256, 16, 4
# how each hero's super moves; 'ground' sheets lie flat on the floor in the game, the others stand up
MODES = {
    'wrenna': 'wave', 'hob': 'burst', 'corrin': 'rise', 'mott': 'swirl', 'nyssa': 'wave', 'pyrrhos': 'burst', 'moss': 'spread',
    'ione': 'swirl', 'fenwick': 'burst', 'thimble': 'rise', 'unwritten': 'spread', 'lysandra': 'spread', 'kallix': 'burst',
    'oko': 'burst', 'ysolt': 'burst', 'halven': 'rise', 'sena': 'fall', 'jory': 'swirl', 'sleeper': 'swirl', 'camedown': 'rise',
    'vell': 'swirl', 'hespera': 'fall', 'kerberon': 'burst', 'ophira': 'rise', 'tychon': 'fall', 'aurvan': 'fall', 'ourax': 'fall',
}

def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def ease_out(x): x = min(1.0, max(0.0, x)); return 1 - (1 - x) ** 3

def fbm(seed, n=N, octaves=5):
    rng = np.random.default_rng(seed); out = np.zeros((n, n)); amp, tot = 1.0, 0.0
    for o in range(octaves):
        k = 4 * 2 ** o; g = rng.random((k + 1, k + 1))
        y, x = np.mgrid[0:n, 0:n] / n * k; x0, y0 = x.astype(int), y.astype(int); fx, fy = x - x0, y - y0
        fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
        v = (g[y0, x0] * (1 - fx) + g[y0, x0 + 1] * fx) * (1 - fy) + (g[y0 + 1, x0] * (1 - fx) + g[y0 + 1, x0 + 1] * fx) * fy
        out += v * amp; tot += amp; amp *= 0.5
    return out / tot

def sample(img, sx, sy):
    """bilinear sample img (H,W,C) at float pixel coords; outside is black"""
    h, w = img.shape[:2]; x0 = np.floor(sx).astype(int); y0 = np.floor(sy).astype(int); fx = (sx - x0)[..., None]; fy = (sy - y0)[..., None]
    def at(yy, xx):
        ok = (xx >= 0) & (xx < w) & (yy >= 0) & (yy < h)
        v = img[np.clip(yy, 0, h - 1), np.clip(xx, 0, w - 1)]; return v * ok[..., None]
    return (at(y0, x0) * (1 - fx) + at(y0, x0 + 1) * fx) * (1 - fy) + (at(y0 + 1, x0) * (1 - fx) + at(y0 + 1, x0 + 1) * fx) * fy

def bake(src, mode, seed, raw=False):
    im = Image.open(src).convert('RGB').resize((N, N), Image.LANCZOS)
    A = np.asarray(im).astype(np.float32) / 255
    A = np.clip((A - 0.035) / 0.965, 0, 1)                       # the painted black is never quite 0: crush it
    lum = A.max(axis=2)
    w = lum ** 2; glow = (A * w[..., None]).sum((0, 1)) / max(1e-6, w.sum()); glow = 0.45 * glow / max(1e-6, glow.max()) + 0.55  # the painting's own light colour
    sparks = np.random.default_rng(seed + 3).random((N, N)) > 0.992
    burn = fbm(seed); burn = np.argsort(np.argsort(burn.ravel())).reshape(N, N) / (N * N - 1.0)  # where it burns first, spread evenly over 0-1
    flow_x, flow_y = fbm(seed + 1, octaves=3) - 0.5, fbm(seed + 2, octaves=3) - 0.5
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float32); cx = cy = (N - 1) / 2
    dx, dy = xx - cx, yy - cy; rad = np.hypot(dx, dy) / (N / 2); ang = np.arctan2(dy, dx)
    frames = []
    for i in range(F):
        t = i / (F - 1)
        enter = ease_out(t / 0.32)                               # 0 → 1 over the first third
        live = 3.0 * math.sin(t * math.pi * 2.2)                 # brush strokes keep moving while it holds
        sx = xx + flow_x * live * 6; sy = yy + flow_y * live * 6
        reveal = np.ones((N, N), np.float32); gain = 1.0
        if mode == 'burst':
            s = 0.3 + 0.78 * enter + 0.06 * math.sin(enter * math.pi) + 0.1 * t   # overshoot, settle, keep swelling
            ra = 0.18 * (t - 0.3); ca, sa = math.cos(ra), math.sin(ra); ux, uy = sx - cx, sy - cy
            sx = cx + (ux * ca - uy * sa) / s; sy = cy + (ux * sa + uy * ca) / s; gain = 1 + 0.9 * math.exp(-((t - 0.24) / 0.08) ** 2)
        elif mode == 'rise':
            front = 1.08 - 1.25 * enter                          # reveal from the floor up, a ragged painted edge
            reveal = smooth(front - 0.05, front + 0.05, yy / N + (burn - 0.5) * 0.18)
            sy = cy + (sy - cy) / (0.85 + 0.15 * enter) + (1 - enter) * 26
        elif mode == 'swirl':
            turn = (1 - enter) * 2.2 + t * 0.7; r2 = rad * (0.55 + 0.45 * enter) + 1e-4
            a2 = ang - turn * (1.2 - np.clip(rad, 0, 1))         # the middle turns faster
            sx = cx + np.cos(a2) * r2 * (N / 2) / (0.55 + 0.45 * enter) + flow_x * live * 6
            sy = cy + np.sin(a2) * r2 * (N / 2) / (0.55 + 0.45 * enter) + flow_y * live * 6
        elif mode == 'fall':
            drop = 1 - ease_out(t / 0.3); hit = math.exp(-((t - 0.3) / 0.05) ** 2)
            s = 0.55 + 0.45 * ease_out(t / 0.3)
            sx = cx + (sx - cx) / s; sy = cy + (sy - cy - (-N * 0.55 * drop)) / (s * (1 - 0.12 * hit))
            gain = 1 + 1.1 * hit
        elif mode == 'wave':
            front = -0.15 + 1.3 * ease_out(t / 0.45)             # sweeps in from the left, leaning forward
            reveal = smooth(front + 0.06, front - 0.06, xx / N + (burn - 0.5) * 0.2)
            sx = sx - (1 - ease_out(t / 0.45)) * 40 + math.sin(t * 9) * 2
        elif mode == 'spread':
            front = 1.25 * ease_out(t / 0.4)                     # grows out from the middle along the floor
            reveal = smooth(front + 0.05, front - 0.05, rad + (burn - 0.5) * 0.22)
        C = sample(A, sx, sy) * reveal[..., None]
        # burn away from t = 0.55: noise threshold rises, the edge glows hot and sheds embers
        b = smooth(0.5, 0.94, t) * 1.08
        if b > 0:
            edge = burn - b
            keep = smooth(-0.02, 0.04, edge)
            rim = np.exp(-(edge / 0.035) ** 2) * (C.max(axis=2) > 0.04)
            C = C * keep[..., None] + rim[..., None] * glow * 0.95 * (1 - b * 0.6)
            # embers: the brightest pixels drift up and out, getting smaller
            k = b * 34; ex = xx - dx / (rad * N / 2 + 1) * k * 0.4; ey = yy + k
            E = sample(A, ex, ey).max(axis=2); ember = (E > 0.35) & sparks
            C = np.maximum(C, ember[..., None] * glow * max(0.0, 1 - b) ** 1.5)
        C = np.clip(C * gain, 0, 1)
        C = C * smooth(0.0, 0.08, t + 0.02)                      # the first frame is not a pop
        frames.append(C)
    if raw: return frames
    return Image.fromarray((sheet_of(frames, N) * 255 + 0.5).astype(np.uint8))

BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32) / 16 - 0.47

def palette_of(img, n):
    """the picture's own colours (median cut), plus black so dark stays empty"""
    q = img.convert('RGB').resize((128, 128), Image.BOX).quantize(colors=n, method=Image.Quantize.MEDIANCUT)
    pal = np.array(q.getpalette()[:n * 3], np.float32).reshape(-1, 3) / 255
    return np.vstack([pal, [[0, 0, 0]]])

def pixelize(C, grid, cell, pal, dither=0.09):
    """C: float RGB (N,N,3) -> coarse pixels snapped to pal with ordered dither, scaled to cell px"""
    im = Image.fromarray((np.clip(C, 0, 1) * 255).astype(np.uint8)).resize((grid, grid), Image.BOX)
    a = np.asarray(im).astype(np.float32) / 255
    b = np.tile(BAYER, (grid // 4 + 1, grid // 4 + 1))[:grid, :grid, None] * dither
    d = ((a + b)[:, :, None, :] - pal[None, None]) ** 2
    out = pal[d.sum(-1).argmin(-1)]
    out[a.max(-1) < 0.05] = 0
    return np.asarray(Image.fromarray((out * 255).astype(np.uint8)).resize((cell, cell), Image.NEAREST)).astype(np.float32) / 255

def sheet_of(frames, cell, cols=COLS):
    rows = (len(frames) + cols - 1) // cols; S = np.zeros((rows * cell, cols * cell, frames[0].shape[2]), np.float32)
    for i, C in enumerate(frames): r, c = divmod(i, cols); S[r * cell:(r + 1) * cell, c * cell:(c + 1) * cell] = C
    return S

def bake_ammo(src):
    """cut the projectile out of its magenta background, ink outline, 4 quarter-turns so it tumbles in flight"""
    im = Image.open(src).convert('RGB'); A = np.asarray(im).astype(np.float32) / 255
    r, g, b = A[..., 0], A[..., 1], A[..., 2]
    key = (r > 0.55) & (b > 0.55) & (g < 0.45) & (np.minimum(r, b) - g > 0.25)    # magenta and its fringe
    alpha = (~key).astype(np.float32)
    ys, xs = np.nonzero(alpha > 0); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    side = max(y1 - y0, x1 - x0); cy, cx = (y0 + y1) // 2, (x0 + x1) // 2; h = side // 2 + 8
    box = (cx - h, cy - h, cx + h, cy + h)
    rgba = np.dstack([A * alpha[..., None], alpha]); img = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA').crop(box)
    pal = palette_of(Image.fromarray((A * alpha[..., None] * 255).astype(np.uint8)), 14)[:-1]
    G, CELL = 30, 64
    small = np.asarray(img.resize((G, G), Image.BOX)).astype(np.float32) / 255
    rgb, al = small[..., :3] / np.maximum(small[..., 3:], 1e-3), small[..., 3] > 0.5
    d = ((rgb[:, :, None, :] + np.tile(BAYER, (8, 8))[:G, :G, None, None] * 0.07 - pal[None, None]) ** 2).sum(-1)
    px = pal[d.argmin(-1)]
    ink = np.zeros((G, G), bool)                                                   # 1-pixel ink outline round the shape
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)): ink |= np.roll(al, (dy, dx), (0, 1))
    ink &= ~al
    out = np.zeros((G + 2, G + 2, 4), np.float32); out[1:-1, 1:-1, :3] = px * al[..., None]; out[1:-1, 1:-1, 3] = al
    out[1:-1, 1:-1][ink] = [0.07, 0.04, 0.02, 1]
    base = Image.fromarray((out * 255).astype(np.uint8), 'RGBA').resize((CELL, CELL), Image.NEAREST)
    frames = [np.asarray(base.rotate(-90 * k)).astype(np.float32) / 255 for k in range(4)]
    return Image.fromarray((sheet_of(frames, CELL, 4) * 255).astype(np.uint8), 'RGBA')

def bake_fx(src, mode, seed, grid, cell, colors):
    frames = bake(src, mode, seed, raw=True); pal = palette_of(Image.open(src), colors)
    return Image.fromarray((sheet_of([pixelize(C, grid, cell, pal) for C in frames], cell) * 255 + 0.5).astype(np.uint8))

def main():
    src = Path(sys.argv[1]); want = sys.argv[2:] or sorted(MODES)
    out = Path('assets/fx/hero'); out.mkdir(parents=True, exist_ok=True)
    find = lambda stem: next((p for p in (src / (stem + e) for e in ('.webp', '.png', '.jpg')) if p.exists()), None)
    for k, hero in enumerate(want):
        f = find('super_' + hero)
        if f: bake_fx(f, MODES.get(hero, 'burst'), 1000 + k, 96, 128, 22).save(out / f'super_{hero}.webp', quality=90, method=6)
        f = find('hit_' + hero)
        if f: im = bake_fx(f, 'burst', 2000 + k, 40, 64, 12).convert('RGBA'); a = np.asarray(im).copy(); a[..., 3] = np.where(a[..., :3].max(-1) > 12, 255, 0); Image.fromarray(a).save(out / f'hit_{hero}.png', optimize=True)
        f = find('ammo_' + hero)
        if f: bake_ammo(f).save(out / f'ammo_{hero}.png', optimize=True)
        print(hero, ' '.join(p.name for p in sorted(out.glob(f'*_{hero}.*'))))
    # the game loads only what is listed here (no 404s for heroes still waiting for their pictures)
    import importlib.util; sp = importlib.util.spec_from_file_location('hits', Path(__file__).with_name('bake_hero_hits.py'))
    m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); m.write_index(out)

if __name__ == '__main__':
    main()
