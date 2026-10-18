// --- Material art: one hand-built pixel icon (16x16, shaded, ink outline) for every craft material --------------------
// 6 ores, 6 monster parts, 6 dungeon cores and the Titan Soul, each its own shape and palette (not a tinted square).
// matIcon(id) returns an SVG data URI, drawn once and cached. Shapes are rasterised from polygons/ellipses, lit from the
// top left, outlined, then detail pixels are added on top (cracks, frost, runes, sparkles).
const MAT_ART = (() => {
  const N = 16, INK = '#1b1722';
  const mk = () => Array.from({ length: N }, () => Array(N).fill(''));
  const inPoly = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const poly = (g, pts, ch = 'b') => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (inPoly(pts, x + 0.5, y + 0.5)) g[y][x] = ch; };
  const ell = (g, cx, cy, rx, ry, ch = 'b') => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) g[y][x] = ch; };
  // detail pixels: on() only paints over the body, free() paints anywhere (sparkles outside the outline)
  const put = (g, x, y, ch, bodyOnly) => { if (x < 0 || y < 0 || x >= N || y >= N) return; if (bodyOnly && (!g[y][x] || g[y][x] === 'k')) return; g[y][x] = ch; };
  const on = (g, pts, ch) => pts.forEach(([x, y]) => put(g, x, y, ch, true));
  const free = (g, pts, ch) => pts.forEach(([x, y]) => put(g, x, y, ch, false));
  const line = (g, x0, y0, x1, y1, ch, bodyOnly = true) => { const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, x = x0, y = y0;
    for (;;) { put(g, x, y, ch, bodyOnly); if (x === x1 && y === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x += sx; } if (e2 <= dx) { e += dx; y += sy; } } };
  const star = (g, x, y, ch) => free(g, [[x, y], [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]], ch);
  // light from the top left: body pixels with an empty neighbour above/left become light, below/right dark
  const shade = (g) => { const e = (x, y) => x < 0 || y < 0 || x >= N || y >= N || !g[y][x];
    const out = g.map((r) => r.slice());
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (g[y][x] === 'b') { if (e(x, y - 1) || e(x - 1, y)) out[y][x] = 'l'; else if (e(x, y + 1) || e(x + 1, y)) out[y][x] = 'd'; }
    for (let y = 0; y < N; y++) g[y] = out[y]; };
  const outline = (g) => { const f = (x, y) => x >= 0 && y >= 0 && x < N && y < N && g[y][x] && g[y][x] !== 'k'; const add = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!g[y][x] && (f(x - 1, y) || f(x + 1, y) || f(x, y - 1) || f(x, y + 1))) add.push([x, y]);
    add.forEach(([x, y]) => { g[y][x] = 'k'; }); };
  const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const mix = (s, t, a) => { const A = hex(s), B = hex(t); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * a).toString(16).padStart(2, '0')).join(''); };
  // one gloss for every core: a small white highlight on the orb
  const gloss = (g) => free(g, [[5, 3], [6, 3], [5, 4]], 'w');
  const orb = (g) => { poly(g, [[3, 14], [5, 11], [11, 11], [13, 14]], 'p'); ell(g, 8, 7, 5.3, 5.3); };
  const D = {
    // ---- ores ----
    copper: { b: '#c8793a', a: '#6fc08a', c: '#ffd9a0',
      body: (g) => { ell(g, 5.5, 10.5, 4, 3.2); ell(g, 10.5, 9.5, 4, 4); ell(g, 8, 5.5, 3.2, 3); },
      detail: (g) => { on(g, [[4, 11], [5, 12], [11, 10], [10, 12], [8, 6], [9, 5], [12, 8]], 'a'); on(g, [[7, 4], [9, 8], [4, 9], [11, 7]], 'c'); } },
    iron: { b: '#8f98a8', a: '#bfe6ff', c: '#ffffff',
      body: (g) => poly(g, [[2, 13], [3, 7], [7, 3], [12, 4], [14, 9], [13, 13]]),
      detail: (g) => { line(g, 4, 8, 8, 5, 'a'); line(g, 9, 12, 12, 9, 'a'); on(g, [[7, 4], [5, 8], [11, 6], [6, 11]], 'c'); } },
    obsidian: { b: '#3a3148', a: '#ff7a3a', c: '#ffd27a',
      body: (g) => poly(g, [[8, 1], [12, 6], [11, 13], [6, 14], [3, 9], [5, 4]]),
      detail: (g) => { line(g, 8, 3, 7, 8, 'a'); line(g, 7, 8, 9, 12, 'a'); line(g, 7, 8, 5, 9, 'a'); on(g, [[7, 8]], 'c'); } },
    mithril: { b: '#a9a3d9', a: '#ece8ff', c: '#7b5cd6',
      body: (g) => { poly(g, [[2, 13], [2, 9], [4, 6], [6, 9], [6, 13]]); poly(g, [[5, 13], [6, 5], [8, 1], [10, 5], [11, 13]]); poly(g, [[9, 13], [10, 8], [12, 5], [14, 8], [14, 13]]); },
      detail: (g) => { line(g, 7, 4, 7, 11, 'a'); on(g, [[9, 8], [4, 10], [12, 9]], 'c'); on(g, [[11, 7], [3, 9]], 'a'); } },
    abyssal: { b: '#1f6f78', a: '#7ff7ea', c: '#ffffff',
      body: (g) => { ell(g, 8, 9, 6, 4.6); ell(g, 6, 6, 3.4, 2.6); ell(g, 11, 6.5, 3, 2.4); },
      detail: (g) => { on(g, [[5, 6], [10, 5], [8, 10], [11, 9], [4, 10], [7, 8]], 'a'); on(g, [[5, 5], [10, 4]], 'c'); } },
    starsteel: { b: '#e6c24a', a: '#fff6c0', c: '#ffffff',
      body: (g) => poly(g, [[2, 14], [4, 7], [11, 7], [14, 14]]),
      detail: (g) => { line(g, 5, 8, 10, 8, 'a'); line(g, 4, 12, 12, 12, 'd'); star(g, 8, 3, 'c'); free(g, [[13, 4], [3, 3]], 'a'); } },
    // ---- monster parts ----
    thornhide: { b: '#7a5a35', a: '#7fc65a', p: '#e8dcb0',
      body: (g) => { poly(g, [[2, 6], [7, 5], [13, 6], [14, 10], [11, 13], [5, 13], [2, 10]]); poly(g, [[3, 6], [4, 2], [5, 6]], 'p'); poly(g, [[7, 5], [8, 1], [9, 5]], 'p'); poly(g, [[11, 6], [12, 2], [13, 6]], 'p'); },
      detail: (g) => on(g, [[4, 9], [9, 10], [6, 11], [11, 8], [7, 8]], 'a') },
    frostfang: { b: '#e9f6ff', a: '#7ec8ff', c: '#ffffff',
      body: (g) => poly(g, [[4, 2], [12, 2], [11, 6], [9, 13], [8, 14], [7, 12], [5, 6]]),
      detail: (g) => { line(g, 5, 3, 11, 3, 'a'); line(g, 6, 5, 7, 9, 'c'); on(g, [[9, 6]], 'a'); } },
    emberscale: { b: '#d4442a', a: '#ffb347', c: '#ffe9a0',
      body: (g) => poly(g, [[3, 3], [13, 3], [14, 8], [8, 14], [2, 8]]),
      detail: (g) => { line(g, 4, 6, 8, 10, 'a'); line(g, 12, 6, 8, 10, 'a'); line(g, 8, 4, 8, 7, 'a'); on(g, [[8, 4], [8, 5]], 'c'); } },
    arcdust: { b: '#6e4bb8', a: '#e0c0ff', c: '#ffffff', p: '#ffd27a',
      body: (g) => { ell(g, 8, 10.5, 5, 4); poly(g, [[6, 6], [10, 6], [9, 8], [7, 8]]); },
      detail: (g) => { line(g, 6, 6, 10, 6, 'p'); on(g, [[8, 10], [7, 11], [9, 11], [8, 12]], 'a'); star(g, 4, 3, 'c'); star(g, 11, 2, 'a'); free(g, [[8, 3], [13, 5]], 'c'); } },
    pearl: { b: '#e8fff9', a: '#3fe0d0', c: '#ffffff', p: '#2f8f93',
      body: (g) => { poly(g, [[2, 11], [8, 9], [14, 11], [12, 14], [4, 14]], 'p'); ell(g, 8, 6.5, 4.6, 4.6); },
      detail: (g) => { line(g, 6, 12, 6, 13, 'a'); line(g, 8, 12, 8, 13, 'a'); line(g, 10, 12, 10, 13, 'a'); on(g, [[6, 4], [6, 5], [7, 4]], 'c'); on(g, [[10, 8]], 'a'); } },
    starfeather: { b: '#ffe27a', a: '#fff7c8', c: '#ff9a3a',
      body: (g) => poly(g, [[2, 14], [4, 10], [5, 6], [9, 2], [13, 2], [13, 6], [10, 10], [6, 13]]),
      detail: (g) => { line(g, 3, 13, 12, 3, 'a'); on(g, [[6, 9], [8, 8], [10, 6], [8, 11], [11, 8]], 'c'); free(g, [[14, 1]], 'a'); } },
    // ---- dungeon cores (an orb on a socket, each with its own symbol) ----
    verdant: { b: '#3fa84a', a: '#d8ffb0', c: '#ffffff', p: '#6d6a78', body: orb,
      detail: (g) => { gloss(g); line(g, 6, 10, 8, 8, 'a'); on(g, [[8, 5], [9, 5], [10, 5], [9, 6], [8, 6], [8, 7], [10, 6], [9, 7]], 'a'); } },
    glacial: { b: '#5bb4e6', a: '#ffffff', c: '#ffffff', p: '#6d6a78', body: orb,
      detail: (g) => { gloss(g); line(g, 8, 4, 8, 10, 'a'); line(g, 5, 7, 11, 7, 'a'); line(g, 6, 5, 10, 9, 'a'); line(g, 10, 5, 6, 9, 'a'); } },
    magma: { b: '#c8321a', a: '#ffd23a', c: '#ffffff', p: '#6d6a78', body: orb,
      detail: (g) => { gloss(g); line(g, 5, 6, 8, 8, 'a'); line(g, 8, 8, 7, 11, 'a'); line(g, 8, 8, 11, 6, 'a'); line(g, 8, 8, 10, 10, 'a'); } },
    void: { b: '#2a1650', a: '#c08aff', c: '#ffffff', p: '#6d6a78', body: orb,
      detail: (g) => { gloss(g); on(g, [[8, 4], [10, 5], [11, 7], [10, 9], [8, 10], [6, 9], [5, 7], [6, 5]], 'a'); on(g, [[8, 7], [7, 7], [8, 6]], 'c'); } },
    tidal: { b: '#1f8fb5', a: '#b8fff5', c: '#ffffff', p: '#6d6a78', body: orb,
      detail: (g) => { gloss(g); for (let x = 4; x <= 11; x++) { put(g, x, 6 + (x % 4 < 2 ? 0 : 1), 'a', true); put(g, x, 9 + (x % 4 < 2 ? 1 : 0), 'a', true); } } },
    solar: { b: '#ffb93a', a: '#ffffff', c: '#fffbe0', p: '#6d6a78', body: orb,
      detail: (g) => { gloss(g); ell(g, 8, 7, 1.9, 1.9, 'c'); on(g, [[8, 3], [8, 11], [4, 7], [12, 7], [5, 4], [11, 4], [5, 10], [11, 10]], 'a'); } },
    // ---- Titan Soul: a pink wisp with a hollow face ----
    titansoul: { b: '#ff5d8f', a: '#ffffff', c: '#ffd1e0', p: '#ffd1e0',
      body: (g) => { poly(g, [[8, 1], [11, 5], [13, 9], [11, 13], [8, 14], [5, 13], [3, 9], [5, 5]]); ell(g, 8, 10, 2.8, 3.2, 'p'); },
      detail: (g) => { put(g, 7, 9, 'k', true); put(g, 9, 9, 'k', true); put(g, 8, 12, 'k', true); free(g, [[2, 3], [14, 4]], 'c'); } },
  };
  const cache = {};
  function svg(id) {
    const d = D[id]; if (!d) return null;
    const g = mk(); d.body(g); shade(g); outline(g); d.detail(g);
    const col = { b: d.b, l: mix(d.b, '#ffffff', 0.38), d: mix(d.b, '#000000', 0.4), a: d.a, c: d.c, p: d.p, k: INK, w: '#ffffff' };
    let r = '';
    for (let y = 0; y < N; y++) { let x = 0; while (x < N) { const ch = g[y][x]; if (!ch || !col[ch]) { x++; continue; } let w = 1; while (x + w < N && g[y][x + w] === ch) w++; r += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${col[ch]}"/>`; x += w; } }
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges">${r}</svg>`)}`;
  }
  return { ids: Object.keys(D), url: (id) => cache[id] || (cache[id] = svg(id)) };
})();
const matIcon = (id) => MAT_ART.url(id) || '';
