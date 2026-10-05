"""Bake pixel-art effect sprite sheets for Ascendant Arena (assets/fx/).

Usage: python3 tools/bake_fx.py [out_dir]   (default: assets/fx)

Every effect is a tiny deterministic particle sim drawn frame by frame on a low-res "heat" buffer,
then mapped to a 6-step colour ramp with a 4x4 ordered dither, so it reads like hand-drawn pixel FX.
Combat sheets: one row of frames, alpha-tested in the game (SpriteFX).
Aura sheets (aura_<rarity>.png): looping overlays for item tiles, drawn with screen blending in the UI.
Existing sheets (explosion_*, hit_*, ring_*) were baked earlier and are left alone.
"""
import math, os, sys
import numpy as np
from PIL import Image

RAMPS = {
    'fire':   ['#3a1208', '#8a2a10', '#d8521e', '#ff9a3a', '#ffd27a', '#fff6d8'],
    'frost':  ['#0c2140', '#1d4f8a', '#3a8ee0', '#7fd0ff', '#c8f2ff', '#ffffff'],
    'arcane': ['#1e0b3a', '#4a1f8a', '#8a4ae0', '#c58aff', '#efcfff', '#ffffff'],
    'venom':  ['#0e2a10', '#1f6a22', '#3fb43a', '#8ef06a', '#d4ffb0', '#fbfff0'],
    'blood':  ['#2a0508', '#6a0c16', '#b3122e', '#ff4d6d', '#ffb0bd', '#fff0f2'],
    'gold':   ['#3a2204', '#8a5a0e', '#d89a1e', '#ffd34a', '#fff0a8', '#ffffff'],
    'storm':  ['#0a1d3a', '#1a5aa8', '#3ab8ff', '#9fe8ff', '#e8fbff', '#ffffff'],
    'white':  ['#2a2a38', '#5a5a70', '#9a9ab0', '#d8d8e8', '#f4f4ff', '#ffffff'],
    'dust':   ['#3a2c1e', '#6a523a', '#9a7c5a', '#c8ac84', '#e8d6b4', '#f8eedc'],
    # aura ramps (UI overlays): dark steps stay dim so the screen blend only adds light
    'a_rare':      ['#06121e', '#0d2a48', '#1f5fae', '#58b4ff', '#bfe4ff', '#ffffff'],
    'a_epic':      ['#120624', '#2a0f50', '#6a2bb0', '#c77dff', '#ecc4ff', '#ffffff'],
    'a_legendary': ['#1e1004', '#4a2a06', '#c4741a', '#ffb347', '#ffe9a3', '#fffbe8'],
    'a_mythic':    ['#1e0206', '#4a0812', '#a3122e', '#ff4d6d', '#ffb3bf', '#fff4f6'],
    'a_ancient':   ['#021c18', '#05403a', '#0d7d6a', '#2fffd0', '#b5fff0', '#ffffff'],
    'a_divine':    ['#1e1a08', '#4a3a10', '#e0a53a', '#fff3a0', '#fffbe6', '#ffffff'],
}
BAYER = (np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) + 0.5) / 16


def hexrgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.H = np.zeros((h, w)); self.S = np.zeros((h, w))
        self.yy, self.xx = np.mgrid[0:h, 0:w] + 0.5

    def disc(self, cx, cy, r, v, soft=0.0, buf='H'):
        if r <= 0 or v <= 0: return
        d = np.hypot(self.xx - cx, self.yy - cy)
        m = d <= r
        val = v * (1 - soft * (d / r) ** 1.5) if soft else np.full(d.shape, v)
        B = getattr(self, buf); B[m] = np.maximum(B[m], val[m])

    def ellipse(self, cx, cy, rx, ry, v, soft=0.0, buf='H'):
        if rx <= 0 or ry <= 0: return
        d = np.hypot((self.xx - cx) / rx, (self.yy - cy) / ry)
        m = d <= 1
        val = v * (1 - soft * d ** 1.5) if soft else np.full(d.shape, v)
        B = getattr(self, buf); B[m] = np.maximum(B[m], val[m])

    def ring(self, cx, cy, r, th, v):
        if r <= 0: return
        d = np.hypot(self.xx - cx, self.yy - cy)
        m = np.abs(d - r) <= th / 2
        self.H[m] = np.maximum(self.H[m], v)

    def px(self, x, y, v, buf='H'):
        x, y = int(math.floor(x)), int(math.floor(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            B = getattr(self, buf); B[y, x] = max(B[y, x], v)

    def line(self, x0, y0, x1, y1, v0, v1=None, w=1.0):
        v1 = v0 if v1 is None else v1
        n = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 2
        for i in range(n + 1):
            a = i / n; x, y, v = x0 + (x1 - x0) * a, y0 + (y1 - y0) * a, v0 + (v1 - v0) * a
            if w <= 1.2: self.px(x, y, v)
            else: self.disc(x, y, w / 2, v)

    def star(self, cx, cy, r, v, w=1.6, diag=0.0):
        """4-point sparkle: tapered cross (+ optional shorter diagonal cross)."""
        if r <= 0: return
        dx, dy = self.xx - cx, self.yy - cy
        ax, ay = np.abs(dx), np.abs(dy)
        arm = ((ax <= w * np.maximum(0, 1 - ay / r) + 0.5) & (ay <= r)) | ((ay <= w * np.maximum(0, 1 - ax / r) + 0.5) & (ax <= r))
        if diag:
            u, t = np.abs(dx + dy) / 1.414, np.abs(dx - dy) / 1.414; rd = r * diag
            arm |= ((u <= 0.9 * np.maximum(0, 1 - t / rd) + 0.3) & (t <= rd)) | ((t <= 0.9 * np.maximum(0, 1 - u / rd) + 0.3) & (u <= rd))
        val = v * (1 - 0.45 * np.minimum(1, np.hypot(dx, dy) / r))
        self.H[arm] = np.maximum(self.H[arm], val[arm])

    def render(self, ramp, outline=False, smoke_ramp=None, levels=6, cut=0.07):
        cols = np.array([hexrgb(c) for c in RAMPS[ramp]], np.float32)
        H = np.clip(self.H, 0, 1)
        dith = BAYER[(np.arange(self.h)[:, None] % 4), (np.arange(self.w)[None, :] % 4)]
        idx = np.clip(np.floor(H * (levels - 1) + dith), 0, levels - 1).astype(int)
        img = np.zeros((self.h, self.w, 4), np.uint8)
        on = H > cut
        img[on, :3] = cols[idx[on]]; img[on, 3] = 255
        if smoke_ramp is not None:
            sc = np.array([hexrgb(c) for c in smoke_ramp], np.float32)
            S = np.clip(self.S, 0, 1)
            sidx = np.clip(np.floor(S * (len(sc) - 1) + dith), 0, len(sc) - 1).astype(int)
            son = (S > 0.12) & ~on
            img[son, :3] = sc[sidx[son]]; img[son, 3] = 255
        if outline:
            a = img[..., 3] > 0
            edge = np.zeros_like(a)
            edge[1:] |= a[:-1]; edge[:-1] |= a[1:]; edge[:, 1:] |= a[:, :-1]; edge[:, :-1] |= a[:, 1:]
            edge &= ~a
            img[edge] = (*hexrgb(outline), 255)
        return img


def smoke_of(ramp):
    """Dark smoke tinted with the effect's darkest ramp steps."""
    c0, c1 = np.array(hexrgb(RAMPS[ramp][0])), np.array(hexrgb(RAMPS[ramp][1]))
    grey = np.array([46, 40, 56])
    mix = lambda a, b, t: '#%02x%02x%02x' % tuple(int(x) for x in a * (1 - t) + b * t)
    return [mix(grey * 0.7, c0, 0.35), mix(grey, c0, 0.4), mix(grey * 1.35, c1, 0.35)]


# ---------------- combat effects ----------------
def fx_impact(c, f, n, R):
    cx, cy = c.w / 2, c.h / 2; t = f / (n - 1)
    if f < 2: c.disc(cx, cy, 4 + f * 2.5, 1.0, 0.35); c.star(cx, cy, 10 + f * 4, 0.95)
    elif f < 4: c.disc(cx, cy, 6 - (f - 2) * 2, 0.75, 0.6)
    for k in range(6):
        a = R[k] * 6.283; s = 5 + t * 14 + R[k + 6] * 3; ln = max(0, 4 * (1 - t))
        if f >= 1 and t < 0.95:
            x0, y0 = cx + math.cos(a) * s, cy + math.sin(a) * s
            c.line(x0, y0, x0 + math.cos(a) * ln, y0 + math.sin(a) * ln, 0.95 - t * 0.6, 0.5 - t * 0.3)


def fx_crit(c, f, n, R):
    cx, cy = c.w / 2, c.h / 2; t = f / (n - 1)
    big = [16, 26, 24, 18, 13, 9, 6, 4, 2, 0][f]
    c.disc(cx, cy, max(0, 8 - f * 1.6), 1.0, 0.3)
    c.star(cx, cy, big, 1.0 - t * 0.5, w=2.4, diag=0.55 if f % 2 == 0 else 0.0)
    if 1 <= f <= 6: c.ring(cx, cy, 6 + f * 4.2, 1.2, 0.55 - f * 0.05)
    for k in range(8):
        a = k / 8 * 6.283 + 0.2; s = 8 + t * 22
        if f >= 1 and t < 0.9:
            c.line(cx + math.cos(a) * s, cy + math.sin(a) * s, cx + math.cos(a) * (s + 5 * (1 - t)), cy + math.sin(a) * (s + 5 * (1 - t)), 0.9, 0.45)
    for k in range(6):
        if f >= 2 and (f + k) % 3:
            a = R[k] * 6.283; s = 10 + R[k + 6] * 18 * t + 6
            c.star(cx + math.cos(a) * s, cy + math.sin(a) * s, 2.5, 0.85, w=0.8)


def fx_flame(c, f, n, R):
    cx, base = c.w / 2, c.h - 3; t = f / (n - 1)
    life = math.sin(min(1, t * 1.6) * math.pi * 0.5) * (1 - max(0, t - 0.55) / 0.45)
    for k in range(9):
        ph = (t * 2.2 + R[k]) % 1
        x = cx + (R[k + 9] - 0.5) * 16 + math.sin(ph * 9 + k) * 2
        y = base - ph * c.h * 0.8
        r = (7 - ph * 6) * life
        c.disc(x, y, r, (1 - ph * 0.85) * (0.6 + 0.4 * life), 0.5)
    c.ellipse(cx, base - 2, 10 * life, 4 * life, 0.9 * life, 0.4)
    for k in range(4):
        ph = (t * 1.6 + R[k + 20]) % 1
        if life > 0.15: c.px(cx + (R[k + 24] - 0.5) * 20, base - ph * c.h, 0.9 - ph * 0.4)


def fx_shatter(c, f, n, R):
    cx, cy = c.w / 2, c.h / 2 - 4; t = f / (n - 1)
    if f < 3: c.disc(cx, cy, 9 - f * 2, 1.0, 0.4); c.star(cx, cy, 14 - f * 3, 0.95, w=2)
    for k in range(8):
        a = k / 8 * 6.283 + R[k] * 0.6; sp = 14 + R[k + 8] * 10
        x = cx + math.cos(a) * sp * t * 1.3; y = cy + math.sin(a) * sp * t * 1.0 + 26 * t * t
        if t > 0.92: continue
        ln = 4 + R[k + 16] * 3; rot = a + t * (4 + k)
        x1, y1 = x + math.cos(rot) * ln, y + math.sin(rot) * ln
        c.line(x - math.cos(rot) * 1.5, y - math.sin(rot) * 1.5, x1, y1, 0.55, 1.0, w=2.1)
        c.px(x1, y1, 1.0)
    for k in range(10):
        if (f + k) % 2 and t < 0.95:
            c.px(cx + (R[k + 30] - 0.5) * 40 * t, cy + (R[k + 40] - 0.5) * 30 * t + 10 * t, 0.85)


def fx_slash(c, f, n, R):
    cx, cy = c.w / 2, c.h / 2; rad = c.w * 0.36
    a0 = -2.5; sweep = 3.4
    head = min(1.0, (f + 1) / 4); tail = max(0.0, (f - 2) / (n - 3))
    for i in range(60):
        u = i / 59
        if u > head or u < tail: continue
        a = a0 + sweep * u; mid = 1 - abs(u - (head + tail) / 2) / max(0.01, (head - tail) / 2)
        th = 1 + 4.2 * max(0, mid) * (1 - tail * 0.7)
        x, y = cx + math.cos(a) * rad, cy + math.sin(a) * rad * 0.75
        nx, ny = math.cos(a), math.sin(a) * 0.75
        c.line(x - nx * th * 0.4, y - ny * th * 0.4, x + nx * th, y + ny * th, 0.6 + 0.4 * max(0, mid), 1.0, w=1.6)
    if 1 <= f <= 5:
        a = a0 + sweep * head
        c.star(cx + math.cos(a) * rad, cy + math.sin(a) * rad * 0.75, 6 - abs(f - 3), 1.0)


def fx_poof(c, f, n, R):
    cx, base = c.w / 2, c.h - 6; t = f / (n - 1)
    grow = min(1, t * 2.6); fade = max(0, 1 - max(0, t - 0.35) / 0.65)
    for k in range(7):
        a = k / 7 * 6.283 + R[k]; d = 4 + 9 * grow * (0.7 + R[k + 7] * 0.5)
        x, y = cx + math.cos(a) * d, base - 9 - math.sin(a) * d * 0.55 - 10 * t
        r = (4 + 5 * grow) * fade * (0.8 + R[k + 14] * 0.4)
        c.disc(x, y, r, 0.9, 0.0, 'S')
        if r > 1.5: c.disc(x - r * 0.3, y - r * 0.35, r * 0.45, 0.32 * fade)
    if f < 3: c.disc(cx, base - 9, 7 + f * 3, 1.0, 0.45)
    # soul wisp rising
    if f >= 2:
        wy = base - 12 - (t ** 0.8) * (c.h - 26); wx = cx + math.sin(t * 9) * 3
        wv = 1.0 if t < 0.8 else (1 - t) * 5
        c.disc(wx, wy, 3.2, wv, 0.3)
        for j in range(1, 6): c.disc(wx - math.sin(t * 9 - j * 0.6) * 2, wy + j * 2.2, 2.6 - j * 0.4, wv * (0.85 - j * 0.12))
    for k in range(6):
        if f >= 1 and (f + k) % 3 != 0 and t < 0.9:
            a = R[k + 20] * 6.283; s = 8 + 18 * t
            c.star(cx + math.cos(a) * s, base - 10 - math.sin(a) * s * 0.7 - 6 * t, 2, 0.9, w=0.7)


def fx_dust(c, f, n, R):
    base = c.h - 3; t = f / (n - 1); fade = 1 - t
    for k in range(6):
        side = -1 if k % 2 else 1; d = 4 + (12 + R[k] * 10) * (t ** 0.6)
        x = c.w / 2 + side * d; y = base - 3 - t * (4 + R[k + 6] * 6) - (k // 2) * 1.5
        r = (3 + 5 * min(1, t * 2.5)) * fade * (0.8 + R[k + 12] * 0.4)
        c.disc(x, y, r, 0.35 + 0.35 * fade, 0.55)
        c.disc(x - 1, y - r * 0.4, r * 0.5, 0.75 * fade)


def zig(c, x0, y0, x1, y1, R, k0, jag, v, w=1.0, seg=7):
    pts = [(x0, y0)]
    for i in range(1, seg):
        a = i / seg; nx, ny = -(y1 - y0), (x1 - x0); L = math.hypot(nx, ny) or 1
        off = (R[(k0 + i) % len(R)] - 0.5) * 2 * jag
        pts.append((x0 + (x1 - x0) * a + nx / L * off, y0 + (y1 - y0) * a + ny / L * off))
    pts.append((x1, y1))
    for (a, b), (c2, d) in zip(pts, pts[1:]): c.line(a, b, c2, d, v, v, w)
    return pts


def fx_zap(c, f, n, R):
    cx, cy = c.w / 2, c.h / 2; t = f / (n - 1)
    rr = np.random.RandomState(100 + f).rand(80)
    if f < 6:
        c.disc(cx, cy, 5 - f * 0.6, 1.0, 0.4)
        for k in range(4 if f < 3 else 2):
            a = rr[k] * 6.283; L = 12 + rr[k + 4] * 10
            zig(c, cx, cy, cx + math.cos(a) * L, cy + math.sin(a) * L, rr, k * 9, 3, 1.0 - t * 0.4, 1.0 if f > 1 else 1.8, 5)
    for k in range(6):
        if t > 0.2 and (f + k) % 2: c.px(cx + (rr[k + 40] - 0.5) * 34 * t, cy + (rr[k + 50] - 0.5) * 34 * t, 0.9)


def fx_bolt(c, f, n, R):
    cx, base = c.w / 2, c.h - 6; t = f / (n - 1)
    rr = np.random.RandomState(7 + (f // 2)).rand(80)
    if f < 5:
        w = [2.4, 3.2, 2.6, 1.8, 1.2][f]
        pts = zig(c, cx + (rr[0] - 0.5) * 8, 0, cx, base, rr, 3, 5, 1.0, w, 12)
        for b in range(2):
            p = pts[3 + b * 4]; a = (1.2 if b else -1.2) + (rr[b + 20] - 0.5)
            zig(c, p[0], p[1], p[0] + math.sin(a) * 12, p[1] + 14, rr, 30 + b * 9, 3, 0.85, 1.0, 4)
        c.ellipse(cx, base, 12 - f, 5 - f * 0.6, 1.0, 0.3)
        c.star(cx, base - 2, 14 - f * 2, 1.0, w=2)
    else:
        c.ellipse(cx, base, 9 * (1 - t), 3.5 * (1 - t), 0.8, 0.4)
    for k in range(8):
        if f >= 2:
            a = 3.14 + (k / 7) * 3.14; s = 4 + 20 * t
            c.px(cx + math.cos(a) * s, base + math.sin(a) * s * 0.8 + 12 * t * t, 0.9 - t * 0.3)


def fx_nova(c, f, n, R):
    cx, cy = c.w / 2, c.h / 2; t = f / (n - 1); e = 1 - (1 - t) ** 2
    c.disc(cx, cy, max(0, 12 - f * 1.4), 1.0, 0.4)
    if f < 7: c.star(cx, cy, 22 - f * 2, 1.0, w=2.6, diag=0.6)
    rr = 8 + e * 36
    c.ring(cx, cy, rr, max(1, 4 - t * 3), 0.85 - t * 0.5)
    if t > 0.1: c.ring(cx, cy, rr * 0.72, 1, 0.5 - t * 0.35)
    for k in range(12):
        a = k / 12 * 6.283 + t * 1.2
        if t < 0.93: c.star(cx + math.cos(a) * rr, cy + math.sin(a) * rr, 3.5 - t * 2, 1.0, w=1.1)
    for k in range(8):
        a = R[k] * 6.283; s = rr * (0.4 + R[k + 8] * 0.5)
        if (f + k) % 2: c.px(cx + math.cos(a) * s, cy + math.sin(a) * s, 0.9)


def fx_pillar(c, f, n, R):
    cx, base = c.w / 2, c.h - 8; t = f / (n - 1)
    wdt = 11 * math.sin(min(1, t / 0.75) * math.pi) if t < 0.75 else 0
    top = base - (c.h - 14) * min(1, t * 4)
    if wdt > 0.3:
        for y in range(int(top), int(base)):
            u = (base - y) / max(1, base - top); fall = 1 - u * 0.55
            for x in range(c.w):
                d = abs(x + 0.5 - cx) / max(0.5, wdt * (0.85 + 0.15 * math.sin(y * 0.45 + f)))
                if d < 1: c.H[y, x] = max(c.H[y, x], (1 - d * 0.75) * fall)
    c.ellipse(cx, base, 16 * min(1, t * 4) * (1 - t * 0.6), 5 * min(1, t * 4) * (1 - t * 0.6), 0.85, 0.35)
    for k in range(14):
        ph = (t * 1.5 + R[k]) % 1
        if t < 0.08: continue
        x = cx + (R[k + 14] - 0.5) * 30 * (0.6 + ph * 0.4); y = base - 4 - ph * (c.h - 20)
        if ph < 0.95 and (k + f) % 4: c.star(x, y, 2.5 if k % 3 == 0 else 1.2, 1.0 - ph * 0.3, w=0.8)
    if f < 3: c.star(cx, base - 4, 14, 1.0, w=2)


def fx_bubble(c, f, n, R):
    cx, base = c.w / 2, c.h - 4; t = f / (n - 1)
    c.ellipse(cx, base - 2, 14 * (1 - t * 0.5), 4 * (1 - t * 0.5), 0.5 * (1 - t), 0.3)
    for k in range(9):
        st = R[k] * 0.45; ph = (t - st) / 0.55
        if ph < 0 or ph > 1: continue
        x = cx + (R[k + 9] - 0.5) * 26 + math.sin(ph * 8 + k) * 1.5; y = base - 4 - ph * (c.h - 14)
        r = 1.5 + R[k + 18] * 3.5
        if ph < 0.85:
            c.ring(x, y, r, 1.1, 0.85); c.px(x - r * 0.4, y - r * 0.4, 1.0); c.disc(x, y, r - 0.8, 0.3)
        else:
            for a in range(6): c.px(x + math.cos(a) * (r + 1.5), y + math.sin(a) * (r + 1.5), 0.9)


COMBAT = {  # kind: (w, h, frames, fps, effect, palettes, outline)
    'impact':  (40, 40, 8, 30, fx_impact, ['fire', 'frost', 'arcane', 'venom', 'blood', 'gold', 'white', 'storm'], False),
    'crit':    (64, 64, 10, 28, fx_crit, ['gold', 'fire', 'arcane'], False),
    'flame':   (40, 56, 14, 24, fx_flame, ['fire', 'venom', 'arcane', 'frost'], '#1a0c08'),
    'shatter': (56, 56, 12, 26, fx_shatter, ['frost', 'arcane', 'white'], False),
    'slash':   (64, 64, 8, 30, fx_slash, ['white', 'fire', 'frost', 'arcane', 'venom', 'blood', 'gold'], False),
    'poof':    (56, 72, 16, 22, fx_poof, ['fire', 'frost', 'arcane', 'venom', 'blood', 'gold', 'white'], '#141018'),
    'dust':    (64, 32, 12, 24, fx_dust, ['dust'], '#2a2018'),
    'zap':     (48, 48, 8, 30, fx_zap, ['storm', 'arcane'], False),
    'bolt':    (40, 128, 10, 26, fx_bolt, ['storm', 'gold', 'arcane'], False),
    'nova':    (96, 96, 14, 26, fx_nova, ['gold', 'arcane', 'frost', 'fire', 'venom', 'blood'], False),
    'pillar':  (48, 144, 20, 24, fx_pillar, ['gold', 'frost', 'arcane', 'blood', 'venom'], False),
    'bubble':  (48, 56, 14, 20, fx_bubble, ['venom', 'arcane'], False),
}


# ---------------- item auras (looping, 48x48, 24 frames) ----------------
def loop(t, p): return (t + p) % 1.0


def au_rare(c, t, R):
    for k, (x, y) in enumerate([(10, 9), (39, 37)]):
        b = max(0, math.sin((loop(t, k * 0.5)) * 6.283))
        if b > 0.2: c.star(x, y, 2 + 3 * b, 0.6 + 0.4 * b, w=0.9)


def au_epic(c, t, R):
    for k, (x, y) in enumerate([(8, 10), (40, 8), (41, 38), (9, 39)]):
        b = max(0, math.sin(loop(t, k * 0.27) * 6.283))
        if b > 0.25: c.star(x, y, 2 + 3.5 * b, 0.65 + 0.35 * b, w=1)
    for k in range(6):
        ph = loop(t, R[k]); x = 6 + R[k + 6] * 36 + math.sin(ph * 6.283) * 1.5; y = 44 - ph * 40
        if 0.05 < ph < 0.9: c.px(x, y, 0.9 - ph * 0.4)


def au_legendary(c, t, R):
    for k in range(18):
        ph = loop(t, R[k] + k * 0.13); x = 4 + R[(k * 7) % 60] * 40 + math.sin(ph * 6.283 * 2 + k) * 2; y = 47 - ph * 46
        if ph < 0.93:
            v = 1.0 - ph * 0.5
            if k % 4 == 0: c.disc(x, y, 1.3, v)
            else: c.px(x, y, v)
            c.px(x, y + 1, v * 0.6)
            if k % 2 == 0: c.px(x, y + 2, v * 0.4)
    for k, (x, y) in enumerate([(9, 8), (40, 12), (38, 39)]):
        b = max(0, math.sin(loop(t, k * 0.33) * 6.283))
        if b > 0.2: c.star(x, y, 2.5 + 4 * b, 0.7 + 0.3 * b, w=1.1, diag=0.4 if b > 0.8 else 0)


def au_mythic(c, t, R):
    # flame tongues licking up from the bottom edge
    for k in range(10):
        ph = loop(t * 2, R[k]); x = 2 + k * 4.9 + math.sin(ph * 6.283 + k) * 1.5; y = 48 - ph * 16
        r = 4.6 * (1 - ph)
        c.ellipse(x, y, r * 0.75, r * 1.25, 0.95 - ph * 0.5, 0.55)
        c.disc(x, y + r * 0.3, r * 0.35, 1.0)
    for k in range(14):
        ph = loop(t * 1.5, R[k + 10]); x = 3 + R[k + 24] * 42 + math.sin(ph * 12 + k) * 2.5; y = 44 - ph * 44
        if ph < 0.92:
            c.px(x, y, 1.0 - ph * 0.35)
            if k % 2: c.px(x, y + 1, 0.6)
    pulse = 0.5 + 0.5 * math.sin(t * 6.283 * 2)
    for (x, y) in [(3, 3), (44, 3)]:
        c.star(x + 0.5, y + 0.5, 2 + 2 * pulse, 0.75 + 0.25 * pulse, w=0.8)


def au_ancient(c, t, R):
    cx, cy, rx, ry, tilt = 24, 26, 21, 8, -0.25
    for k in range(6):
        for j in range(5):
            a = (loop(t, k / 6) - j * 0.018) * 6.283
            x0, y0 = math.cos(a) * rx, math.sin(a) * ry
            x, y = cx + x0 * math.cos(tilt) - y0 * math.sin(tilt), cy + x0 * math.sin(tilt) + y0 * math.cos(tilt)
            front = math.sin(a) > -0.2
            v = (1.0 - j * 0.17) * (1 if front else 0.55)
            if j == 0: c.disc(x, y, 2.0 if front else 1.2, v); c.star(x, y, 3.5 if front else 0, v, w=0.7)
            else: c.px(x, y, v)
    for k, (x, y) in enumerate([(6, 6), (42, 10), (8, 42), (41, 41)]):
        b = loop(t * 2, k * 0.25)
        if b < 0.35:  # rune glint: a small square glyph
            v = 1 - b / 0.35
            for dx, dy in [(0, 0), (2, 0), (0, 2), (2, 2), (1, 1)]: c.px(x + dx, y + dy, 0.6 + 0.4 * v)
    for k in range(5):
        ph = loop(t, R[k + 30]); x = 8 + R[k + 36] * 32; y = 40 - ph * 30
        if ph < 0.85: c.px(x, y, 0.8)


def au_divine(c, t, R):
    cx, cy = 24, 24
    rot = t * 6.283 / 8  # one eighth turn per loop: 8 rays look identical every loop
    d = np.hypot(c.xx - cx, c.yy - cy); ang = np.arctan2(c.yy - cy, c.xx - cx)
    ray = np.cos((ang - rot) * 8) > 0.93
    m = ray & (d > 17) & (d < 34)
    c.H[m] = np.maximum(c.H[m], (0.62 - (d[m] - 17) / 34 * 0.45))
    c.ring(cx, cy, 22.5 + math.sin(t * 6.283) * 0.8, 1.0, 0.4)  # soft halo ring around the item
    for k in range(10):
        b = max(0, math.sin(loop(t, R[k]) * 6.283 * (1 if k % 2 else 2)))
        a = R[k + 10] * 6.283; s = 15 + R[k + 20] * 8
        if b > 0.3: c.star(cx + math.cos(a) * s, cy + math.sin(a) * s, 1.5 + 3.5 * b, 0.7 + 0.3 * b, w=0.9, diag=0.5 if b > 0.85 else 0)
    for k in range(8):
        ph = loop(t, R[k + 30]); x = 6 + R[k + 40] * 36 + math.sin(ph * 9) * 1.5; y = 46 - ph * 44
        if ph < 0.9: c.px(x, y, 1.0 - ph * 0.3)


AURAS = {'rare': au_rare, 'epic': au_epic, 'legendary': au_legendary, 'mythic': au_mythic, 'ancient': au_ancient, 'divine': au_divine}
AURA_N = 24


def bake(out):
    os.makedirs(out, exist_ok=True)
    for kind, (w, h, n, fps, fn, pals, outline) in COMBAT.items():
        R = np.random.RandomState(sum(map(ord, kind)) * 7 + 11).rand(80)
        for pal in pals:
            sheet = np.zeros((h, w * n, 4), np.uint8)
            for f in range(n):
                c = Canvas(w, h); fn(c, f, n, R)
                sheet[:, f * w:(f + 1) * w] = c.render(pal, outline=outline, smoke_ramp=smoke_of(pal))
            Image.fromarray(sheet).save(os.path.join(out, f'{kind}_{pal}.png'), optimize=True)
        print(kind, w, h, n, fps, pals)
    for rar, fn in AURAS.items():
        R = np.random.RandomState(len(rar) * 31 + 5).rand(60)
        sheet = np.zeros((48, 48 * AURA_N, 4), np.uint8)
        for f in range(AURA_N):
            c = Canvas(48, 48); fn(c, f / AURA_N, R)
            sheet[:, f * 48:(f + 1) * 48] = c.render('a_' + rar, cut=0.12)
        Image.fromarray(sheet).save(os.path.join(out, f'aura_{rar}.png'), optimize=True)
        print('aura', rar)


if __name__ == '__main__':
    bake(sys.argv[1] if len(sys.argv) > 1 else 'assets/fx')
