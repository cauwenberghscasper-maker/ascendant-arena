# Bastion castle roads and defence spots: painted ground art built from our own Z-Image ground tiles
# (assets/world/_ground/cobble.webp and flagstone.webp) with hand-drawn kerbs, ruts, a bevel, bronze corner plates and a
# gold rune ring. Writes assets/world/_ground/fort_road.webp (repeats along its length) and fort_spot.webp.
# Run: python3 tools/fort_road_art.py
import math, random
from PIL import Image, ImageDraw, ImageFilter

G = 'assets/world/_ground/'
rnd = random.Random(7)


def road():
    W, H = 256, 512
    cob = Image.open(G + 'cobble.webp').convert('RGB').resize((W, W))
    base = Image.new('RGB', (W, H))
    base.paste(cob, (0, 0)); base.paste(cob, (0, W))  # the tile is seamless, so the road repeats along its length
    px = base.load()
    # two worn wheel ruts: a little lighter and smoother
    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            k = 0
            for c in (W * 0.33, W * 0.67):
                k = max(k, math.exp(-((x - c) / 14) ** 2))
            px[x, y] = (int(r + (175 - r) * 0.22 * k), int(g + (160 - g) * 0.22 * k), int(b + (135 - b) * 0.22 * k))
    # kerbs: dressed flagstone blocks along both sides with an ink seam, every block its own shade
    flag = Image.open(G + 'flagstone.webp').convert('RGB').resize((256, 256))
    kw = 26
    d = ImageDraw.Draw(base)
    for side in (0, W - kw):
        y = 0
        while y < H:
            h = rnd.choice((36, 44, 52))
            if y + h > H: h = H - y
            ox, oy = rnd.randrange(0, 256 - kw), rnd.randrange(0, 256 - h)
            blk = flag.crop((ox, oy, ox + kw, oy + h))
            shade = rnd.uniform(0.92, 1.12)
            blk = blk.point(lambda v: max(0, min(255, int(v * shade))))
            base.paste(blk, (side, y))
            d.line([(side, y), (side + kw - 1, y)], fill=(34, 26, 18), width=2)
            y += h
        x0 = kw if side == 0 else side - 1
        d.line([(x0, 0), (x0, H)], fill=(28, 20, 14), width=3)  # the seam between kerb and cobbles
        hl = side + 3 if side == 0 else side + kw - 4
        d.line([(hl, 0), (hl, H)], fill=(196, 186, 168), width=1)  # a bone-white highlight on the kerb's top edge
    # alpha: solid, with a soft 4 px fade at the outer edges so it sits on the meadow
    a = Image.new('L', (W, H), 255); ad = a.load()
    for y in range(H):
        for x in range(W):
            e = min(x, W - 1 - x)
            if e < 4: ad[x, y] = int(255 * (e + 1) / 5)
    out = base.convert('RGBA'); out.putalpha(a)
    out.save(G + 'fort_road.webp', 'WEBP', quality=88)


def spot():
    S = 256
    flag = Image.open(G + 'flagstone.webp').convert('RGB').resize((S, S))
    im = flag.point(lambda v: int(v * 0.95))
    d = ImageDraw.Draw(im, 'RGBA')
    # bevelled slab: light top-left edge, dark bottom-right, ink outline
    for i in range(10):
        d.line([(i, i), (S - 1 - i, i)], fill=(230, 220, 200, 70 - i * 6)); d.line([(i, i), (i, S - 1 - i)], fill=(230, 220, 200, 70 - i * 6))
        d.line([(i, S - 1 - i), (S - 1 - i, S - 1 - i)], fill=(20, 14, 8, 110 - i * 9)); d.line([(S - 1 - i, i), (S - 1 - i, S - 1 - i)], fill=(20, 14, 8, 110 - i * 9))
    d.rectangle([0, 0, S - 1, S - 1], outline=(18, 10, 3, 255), width=4)
    # bronze corner plates with rivets
    for cx, cy in ((0, 0), (S, 0), (0, S), (S, S)):
        sx, sy = (1 if cx == 0 else -1), (1 if cy == 0 else -1)
        poly = [(cx, cy), (cx + sx * 54, cy), (cx, cy + sy * 54)]
        d.polygon(poly, fill=(150, 98, 44, 255), outline=(40, 24, 8, 255))
        d.line([(cx + sx * 8, cy + sy * 40), (cx + sx * 40, cy + sy * 8)], fill=(220, 168, 92, 255), width=3)
        for k in (14, 30):
            d.ellipse([cx + sx * k - 3, cy + sy * 10 - 3, cx + sx * k + 3, cy + sy * 10 + 3], fill=(240, 200, 120, 255))
    # the rune ring: a gold circle, an inner ring, and twelve rune ticks between them, with a soft glow under it
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    c, R = S / 2, S * 0.33
    gd.ellipse([c - R - 10, c - R - 10, c + R + 10, c + R + 10], outline=(255, 210, 110, 150), width=18)
    glow = glow.filter(ImageFilter.GaussianBlur(9))
    im = Image.alpha_composite(im.convert('RGBA'), glow); d = ImageDraw.Draw(im, 'RGBA')
    d.ellipse([c - R, c - R, c + R, c + R], outline=(30, 18, 6, 255), width=9)
    d.ellipse([c - R, c - R, c + R, c + R], outline=(255, 214, 110, 255), width=5)
    r2 = R * 0.72
    d.ellipse([c - r2, c - r2, c + r2, c + r2], outline=(30, 18, 6, 255), width=6)
    d.ellipse([c - r2, c - r2, c + r2, c + r2], outline=(240, 190, 90, 255), width=3)
    for i in range(12):
        a = i / 12 * math.tau; m = (R + r2) / 2
        x, y = c + math.cos(a) * m, c + math.sin(a) * m
        if i % 3 == 0: d.polygon([(x, y - 9), (x + 6, y), (x, y + 9), (x - 6, y)], fill=(255, 236, 160, 255), outline=(30, 18, 6, 255))
        else: d.line([(x - math.sin(a) * 6, y + math.cos(a) * 6), (x + math.sin(a) * 6, y - math.cos(a) * 6)], fill=(255, 226, 140, 255), width=3)
    # a tower sigil in the middle: a crenellated tower in gold
    t = [(c - 20, c + 26), (c - 20, c - 14), (c - 26, c - 14), (c - 26, c - 30), (c - 15, c - 30), (c - 15, c - 22), (c - 5, c - 22), (c - 5, c - 30), (c + 5, c - 30), (c + 5, c - 22),
         (c + 15, c - 22), (c + 15, c - 30), (c + 26, c - 30), (c + 26, c - 14), (c + 20, c - 14), (c + 20, c + 26)]
    d.polygon(t, fill=(250, 210, 110, 255), outline=(30, 18, 6, 255))
    d.rectangle([c - 6, c + 6, c + 6, c + 26], fill=(60, 36, 12, 255))
    im.save(G + 'fort_spot.webp', 'WEBP', quality=90)


road(); spot(); print('wrote fort_road.webp, fort_spot.webp')
