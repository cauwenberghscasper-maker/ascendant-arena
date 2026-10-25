"""Particle fire effects: every frame simulated from hundreds of embers, sparks and flame wisps (no painted blob),
32 frames per effect, so fire reads as light and motion instead of a thick solid shape.

python3 tools/bake_fx_particles.py            -> assets/fx/pfx/<kind>_fire.png (8x4 frames of 64 px) + assets/fx/pfx/index.json
The game (src/game/45-fx.js, SpriteFX) prefers these sheets over the painted (gen/) and code-drawn ones and draws them
with additive blending, so overlapping particles glow hotter (orange -> yellow -> white) like real flame.
Each particle carries "heat"; the frame's summed heat goes through the fire ramp. Seeded, so rebakes are identical.
"""
import json, math
from pathlib import Path
import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / 'assets/fx/pfx'
S, COLS, ROWS = 128, 8, 4
N = COLS * ROWS
RAMP = np.array([[0, 0, 0], [70, 10, 4], [150, 34, 8], [222, 86, 20], [255, 150, 48], [255, 206, 110], [255, 244, 214]], np.float32) / 255
STOPS = np.array([0, 0.12, 0.28, 0.48, 0.68, 0.86, 1.0], np.float32)

PX = S // 2
BAYER = np.tile(np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32) / 16, (PX // 4, PX // 4))
_stamps = {}
def stamp(r):  # soft round dot, radius in px (quantised to 0.25)
    k = round(max(0.5, r) * 4) / 4
    if k not in _stamps:
        n = int(math.ceil(k * 2.2)); y, x = np.mgrid[-n:n + 1, -n:n + 1]
        _stamps[k] = np.exp(-(x * x + y * y) / (2 * (k * 0.6) ** 2)).astype(np.float32)
    return _stamps[k]

class Frame:
    def __init__(self): self.h = np.zeros((S, S), np.float32)
    def dot(self, x, y, r, heat):
        if heat <= 0.003: return
        st = stamp(r); n = st.shape[0] // 2; xi, yi = int(round(x)), int(round(y))
        x0, y0, x1, y1 = xi - n, yi - n, xi + n + 1, yi + n + 1
        if x1 <= 0 or y1 <= 0 or x0 >= S or y0 >= S: return
        sx0, sy0 = max(0, -x0), max(0, -y0); sx1, sy1 = st.shape[1] - max(0, x1 - S), st.shape[0] - max(0, y1 - S)
        self.h[max(0, y0):min(S, y1), max(0, x0):min(S, x1)] += st[sy0:sy1, sx0:sx1] * heat
    def streak(self, x, y, vx, vy, length, r, heat):  # a spark: a line of dots along its motion, hot at the head
        sp = math.hypot(vx, vy) or 1; ux, uy = vx / sp, vy / sp; steps = max(2, int(length / max(0.6, r * 0.7)))
        for i in range(steps):
            f = i / steps; self.dot(x - ux * length * f, y - uy * length * f, r * (1 - 0.5 * f), heat * (1 - f) ** 1.3)
    def rgba(self):  # pixel art like every other effect: 2x2 average onto a 64 px grid, 4x4 ordered dither, palette steps
        h = self.h.reshape(PX, 2, PX, 2).mean((1, 3))
        h = np.clip(h, 0, 1.4) / 1.4 + (BAYER - 0.5) * 0.09
        lv = np.clip(np.round(h * 6), 0, 6).astype(int)
        rgb = RAMP[lv]; a = np.where(lv >= 1, np.clip(0.55 + lv * 0.09, 0, 1), 0)
        return np.dstack([(rgb * 255).astype(np.uint8), (a * 255).astype(np.uint8)])

def ease_out(t): return 1 - (1 - t) ** 3
rng = None

# ---- particle systems. t = 0..1 over the effect. (cx, cy) is the frame point the effect grows from.
def embers(fr, t, ps, g=0.0, drag=1.6, wobble=6.0):
    """ps: list of dicts with x,y,vx,vy,t0,life,r,heat,ph. Integrated analytically-ish per frame."""
    for p in ps:
        a = (t - p['t0']) / p['life']
        if a < 0 or a > 1: continue
        tt = (t - p['t0']); k = (1 - math.exp(-drag * tt)) / drag
        x = p['x'] + p['vx'] * k + math.sin(p['ph'] + tt * 9) * wobble * a
        y = p['y'] + p['vy'] * k + 0.5 * g * tt * tt
        fl = 0.75 + 0.25 * math.sin(p['ph'] * 3 + tt * 40)  # flicker
        fr.dot(x, y, p['r'] * (1 - 0.55 * a), p['heat'] * (1 - a) ** 1.4 * fl)

def sparks(fr, t, ps, g=60.0, drag=2.2):
    for p in ps:
        a = (t - p['t0']) / p['life']
        if a < 0 or a > 1: continue
        tt = t - p['t0']; k = (1 - math.exp(-drag * tt)) / drag
        x = p['x'] + p['vx'] * k; y = p['y'] + p['vy'] * k + 0.5 * g * tt * tt
        vx = p['vx'] * math.exp(-drag * tt); vy = p['vy'] * math.exp(-drag * tt) + g * tt
        fr.streak(x, y, vx, vy, min(22, 0.06 * math.hypot(vx, vy) + 2), p['r'], p['heat'] * (1 - a) ** 1.2)

def radial(n, cx, cy, sp, t0=(0, 0.05), life=(0.4, 0.8), r=(1.5, 4), heat=(0.5, 1), up=0.0, spread=2 * math.pi, dir0=0.0):
    out = []
    for _ in range(n):
        ang = dir0 + rng.uniform(-spread / 2, spread / 2); s = rng.uniform(*sp)
        out.append(dict(x=cx, y=cy, vx=math.cos(ang) * s, vy=math.sin(ang) * s - up, t0=rng.uniform(*t0), life=rng.uniform(*life),
                        r=rng.uniform(*r), heat=rng.uniform(*heat), ph=rng.uniform(0, 6.28)))
    return out

def flash(fr, t, cx, cy, t1, r0, heat=1.6):  # bright core that pops and shrinks
    if t < t1: a = t / t1; fr.dot(cx, cy, r0 * (0.6 + 0.6 * ease_out(min(1, a * 2))) * (1 - 0.6 * a), heat * (1 - a) ** 0.7)

def bake(kind, fn, seed):
    global rng; rng = np.random.default_rng(seed)
    state = fn(None, None)  # build particles once
    sheet = Image.new('RGBA', (PX * COLS, PX * ROWS))
    for i in range(N):
        t = i / (N - 1); fr = Frame(); fn(fr, t, state)
        sheet.paste(Image.fromarray(fr.rgba(), 'RGBA'), ((i % COLS) * PX, (i // COLS) * PX))
    sheet.save(OUT / f'{kind}_fire.png', optimize=True)
    return kind

# ---- the nine fire effects -------------------------------------------------------------------------------------
def k_explosion(fr, t, st=None):  # anchored at the ground: a hot burst, flying sparks, embers drifting up and cooling
    cx, cy = S / 2, S * 0.62
    if fr is None:
        return dict(core=radial(200, cx, cy, (60, 210), life=(0.3, 0.65), r=(3.5, 8), heat=(0.5, 0.9), up=20),
                    rise=radial(150, cx, cy, (20, 90), t0=(0.05, 0.3), life=(0.45, 0.8), r=(2, 4.5), heat=(0.4, 0.75), up=150, spread=2.2, dir0=-math.pi / 2),
                    spk=radial(50, cx, cy, (260, 420), life=(0.3, 0.6), r=(1.2, 2), heat=(1, 1.4), up=90))
    flash(fr, t, cx, cy, 0.2, 30); embers(fr, t, st['core'], g=-60, drag=3.2); embers(fr, t, st['rise'], g=-50, drag=1.2, wobble=8); sparks(fr, t, st['spk'], g=180)

def k_hit(fr, t, st=None):
    c = S / 2
    if fr is None: return dict(spk=radial(36, c, c, (220, 380), life=(0.35, 0.8), r=(1.2, 2), heat=(1, 1.4)), em=radial(70, c, c, (50, 140), life=(0.4, 0.9), r=(2, 4), heat=(0.45, 0.8)))
    flash(fr, t, c, c, 0.25, 22); sparks(fr, t, st['spk'], g=120, drag=3); embers(fr, t, st['em'], g=-30, drag=3)

def k_impact(fr, t, st=None):
    c = S / 2
    if fr is None: return dict(spk=radial(24, c, c, (180, 320), life=(0.3, 0.7), r=(1.2, 2), heat=(1, 1.3)), em=radial(40, c, c, (40, 110), life=(0.4, 0.9), r=(2, 4), heat=(0.45, 0.8)))
    flash(fr, t, c, c, 0.3, 18, 1.5); sparks(fr, t, st['spk'], g=90, drag=3); embers(fr, t, st['em'], g=-30, drag=3)

def k_crit(fr, t, st=None):  # a star glint of four long rays plus a sparking ring
    c = S / 2
    if fr is None: return dict(spk=radial(40, c, c, (240, 380), life=(0.4, 0.8), r=(1.2, 2), heat=(1, 1.4)), em=radial(70, c, c, (60, 160), life=(0.4, 0.9), r=(2, 4), heat=(0.45, 0.8)))
    if t < 0.45:
        a = t / 0.45; L = 60 * ease_out(min(1, a * 2.5)) * (1 - a * 0.5)
        for ang in (0, math.pi / 2, math.pi, -math.pi / 2, math.pi / 4, 3 * math.pi / 4, -math.pi / 4, -3 * math.pi / 4):
            l = L if int(round(ang / (math.pi / 4))) % 2 == 0 else L * 0.45
            fr.streak(c + math.cos(ang) * l, c + math.sin(ang) * l, math.cos(ang), math.sin(ang), l, 2.2, 1.3 * (1 - a) ** 0.8)
    flash(fr, t, c, c, 0.3, 22); sparks(fr, t, st['spk'], g=60, drag=3); embers(fr, t, st['em'], g=-25, drag=2.5)

def k_nova(fr, t, st=None):  # a shell of fire racing outward, leaving cooling embers behind
    c = S / 2
    if fr is None:
        sh = []
        for i in range(260):
            ang = rng.uniform(0, 2 * math.pi); sh.append(dict(ang=ang, sp=rng.uniform(0.92, 1.05), r=rng.uniform(2.5, 5), heat=rng.uniform(0.5, 0.85), ph=rng.uniform(0, 6.28), drop=rng.uniform(0.25, 0.85)))
        return dict(sh=sh, spk=radial(40, c, c, (200, 320), life=(0.4, 0.7), r=(0.8, 1.3), heat=(0.8, 1.1)))
    R = 58 * ease_out(min(1, t * 1.25))
    for p in st['sh']:
        rr = R * p['sp']; ang = p['ang'] + 0.04 * math.sin(p['ph'] + t * 10)
        if t < p['drop']: fr.dot(c + math.cos(ang) * rr, c + math.sin(ang) * rr, p['r'] * (1 - 0.4 * t), p['heat'] * (1 - t) ** 0.8)
        else:  # left behind as a cooling ember
            a = (t - p['drop']) / (1 - p['drop'] + 1e-6); r0 = 58 * ease_out(min(1, p['drop'] * 1.25)) * p['sp']
            fr.dot(c + math.cos(ang) * r0, c + math.sin(ang) * r0 - a * 10, p['r'] * 0.6 * (1 - a), p['heat'] * 0.6 * (1 - a) ** 2)
    flash(fr, t, c, c, 0.14, 12, 1.2); sparks(fr, t, st['spk'], g=0, drag=2.5)

def k_ring(fr, t, st=None):  # flat on the ground (seen from above): a ring of licking flames spreading out
    c = S / 2
    if fr is None:
        return dict(fl=[dict(ang=rng.uniform(0, 2 * math.pi), off=rng.uniform(-4, 4), r=rng.uniform(2.5, 5), heat=rng.uniform(0.45, 0.8), ph=rng.uniform(0, 6.28), sp=rng.uniform(0.9, 1.06)) for _ in range(300)])
    R = 56 * ease_out(min(1, t * 1.15)); fade = (1 - t) ** 0.9
    for p in st['fl']:
        lick = 0.5 + 0.5 * math.sin(p['ph'] + t * 30)
        rr = R * p['sp'] + p['off'] + lick * 3
        fr.dot(c + math.cos(p['ang']) * rr, c + math.sin(p['ang']) * rr, p['r'] * (0.6 + 0.4 * lick), p['heat'] * fade * (0.6 + 0.4 * lick))

def k_flame(fr, t, st=None):  # a burning tongue: grows from the floor, flickers, dies down; embers break off the tip
    cx, by = S / 2, S * 0.94
    if fr is None:
        return dict(ps=[dict(t0=rng.uniform(-0.3, 0.92), life=rng.uniform(0.18, 0.32), x=rng.normal(0, 12), r=rng.uniform(4, 9), heat=rng.uniform(0.4, 0.7), ph=rng.uniform(0, 6.28), sp=rng.uniform(330, 460)) for _ in range(480)],
                    em=[dict(t0=rng.uniform(0.1, 0.85), life=rng.uniform(0.25, 0.45), x=rng.normal(0, 8), vx=rng.normal(0, 25), ph=rng.uniform(0, 6.28)) for _ in range(26)])
    env = min(1, t / 0.15) * min(1, (1 - t) / 0.3)
    for p in st['ps']:
        a = (t - p['t0']) / p['life']
        if a < 0 or a > 1: continue
        y = by - p['sp'] * (t - p['t0']) * (0.5 + 0.5 * env)
        x = cx + p['x'] * (1 - a) ** 1.5 + math.sin(p['ph'] + t * 22 + a * 5) * 8 * a
        fr.dot(x, y, p['r'] * (1 - a) ** 0.8, p['heat'] * env * (1 - a) ** 1.1)
    for p in st['em']:
        a = (t - p['t0']) / p['life']
        if 0 <= a <= 1: fr.dot(cx + p['x'] + p['vx'] * a * p['life'] + math.sin(p['ph'] + a * 8) * 4, by - 90 - 160 * a * p['life'], 1.8, 1.1 * (1 - a))

def k_poof(fr, t, st=None):  # a puff of fire that swirls upward and scatters into embers
    cx, by = S / 2, S * 0.85
    if fr is None:
        ps = []
        for _ in range(220):
            ang = rng.uniform(math.pi * 1.05, math.pi * 1.95); s = rng.uniform(60, 190)
            ps.append(dict(x=cx + rng.normal(0, 5), y=by, vx=math.cos(ang) * s, vy=math.sin(ang) * s - 90, t0=rng.uniform(0, 0.25), life=rng.uniform(0.35, 0.75), r=rng.uniform(2, 5), heat=rng.uniform(0.3, 0.55), ph=rng.uniform(0, 6.28)))
        return dict(ps=ps, spk=radial(22, cx, by - 10, (160, 300), life=(0.3, 0.6), r=(1.2, 2), heat=(1, 1.3), up=90, spread=2.4, dir0=-math.pi / 2))
    flash(fr, t, cx, by - 8, 0.16, 14, 1.1); embers(fr, t, st['ps'], g=-80, drag=2.2, wobble=10); sparks(fr, t, st['spk'], g=140)

def k_slash(fr, t, st=None):  # a fiery arc swept left to right; the trail sheds embers that drift and cool
    c = S / 2
    if fr is None:
        return dict(sh=[dict(u=rng.uniform(0, 1), off=rng.normal(0, 3), r=rng.uniform(2.5, 5), heat=rng.uniform(0.5, 0.9), ph=rng.uniform(0, 6.28), vx=rng.normal(0, 20), vy=rng.normal(-15, 15)) for _ in range(320)])
    R, a0, a1 = 50, math.radians(200), math.radians(340)
    head = ease_out(min(1, t / 0.4))
    for p in st['sh']:
        if p['u'] > head: continue
        born = 0.4 * (1 - (1 - p['u']) ** (1 / 3)); age = max(0, t - born); a = min(1, age / 0.55)
        ang = a0 + (a1 - a0) * p['u']; thick = math.sin(math.pi * p['u'])  # thickest mid-arc
        x = c + math.cos(ang) * (R + p['off'] * (1 + thick * 2)) + p['vx'] * age
        y = c + 18 + math.sin(ang) * (R + p['off'] * (1 + thick * 2)) * 0.8 + p['vy'] * age - 20 * age * age
        fr.dot(x, y, p['r'] * (0.5 + 0.7 * thick) * (1 - 0.6 * a), p['heat'] * (1 - a) ** 1.5 * (0.4 + 0.6 * thick))

KINDS = {'explosion': k_explosion, 'hit': k_hit, 'impact': k_impact, 'crit': k_crit, 'nova': k_nova, 'ring': k_ring, 'flame': k_flame, 'poof': k_poof, 'slash': k_slash}

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True); ix = {}
    for i, (k, fn) in enumerate(KINDS.items()): bake(k, fn, 1000 + i); ix.setdefault(k, {})['fire'] = {'cols': COLS, 'rows': ROWS, 'n': N}; print('baked', k)
    (OUT / 'index.json').write_text(json.dumps(ix, indent=1))
