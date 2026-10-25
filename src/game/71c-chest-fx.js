// ---------------------------------------------------------------------
// Chest reel particles (Casper, 25 Oct: "fancy, a gambling feeling, a lot of unique particles").
// A pixel canvas over the reel page: every chest kind has its own particles (CFG.cases[k].fx) that drift while the reel
// spins and thicken as it slows down; the winning card then explodes in its rarity's colours. Gold and better shake the
// screen and flash; a hero pull adds rainbow rays. All pixels: a low-res canvas scaled up with no smoothing.
// ---------------------------------------------------------------------
const CHEST_PX = 3; // one particle pixel = 3 CSS px
const CHEST_THEME = {
  sparks: { cols: ['#58b4ff', '#bfe6ff', '#ffffff'], from: 'bottom', shape: 'dot', g: -14, rate: 26 },
  coins: { cols: ['#ffc94a', '#ffe08a', '#b07a12'], from: 'top', shape: 'coin', g: 26, rate: 18 },
  embers: { cols: ['#ff7a45', '#ffb347', '#ffe08a', '#c23b1a'], from: 'bottom', shape: 'dot', g: -20, rate: 30, wob: 14 },
  void: { cols: ['#ff5d8f', '#c77dff', '#7a3fd0', '#ffd0f0'], from: 'ring', shape: 'dot', g: 0, rate: 30 },
  stars: { cols: ['#fff0aa', '#c77dff', '#ffffff'], from: 'any', shape: 'star', g: -4, rate: 16 },
  snow: { cols: ['#ffffff', '#c8f2ff', '#8cecff'], from: 'top', shape: 'flake', g: 10, rate: 22, wob: 10 },
  crystals: { cols: ['#7fe3c4', '#2fffd0', '#d4fff4', '#4aa88a'], from: 'bottom', shape: 'shard', g: -18, rate: 26 },
};
const RAR_COLS = { common: ['#cfd6e0', '#ffffff'], uncommon: ['#8ee06a', '#d4ffb0'], rare: ['#58b4ff', '#bfe6ff'], epic: ['#c77dff', '#efcfff'], legendary: ['#ffb347', '#ffe08a', '#fff6d8'],
  mythic: ['#ff4d6d', '#ffb0bd', '#ffe08a'], ancient: ['#2fffd0', '#d4fff4', '#ffffff'], divine: ['#fff3a0', '#ffffff', '#ffd34a'] };
const ChestFX = {
  cv: null, g: null, ps: [], theme: null, raf: 0, t: 0, k: 0, flash: 0, rays: 0, last: 0, w: 0, h: 0,
  start(caseKind) {
    this.stop(); const panel = $('panel'); if (!panel) return;
    const cv = document.createElement('canvas'); cv.className = 'chestFx'; panel.appendChild(cv);
    this.cv = cv; this.g = cv.getContext('2d'); this.resize();
    this.theme = CHEST_THEME[(CFG.cases[caseKind] || {}).fx] || CHEST_THEME.sparks; this.ps.length = 0; this.k = 0; this.flash = 0; this.rays = 0;
    this.last = performance.now(); const loop = (now) => { if (!this.cv || !this.cv.isConnected || UI.current !== 'reel') { this.stop(); return; } this.step(Math.min(0.05, (now - this.last) / 1000)); this.last = now; this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  },
  stop() { cancelAnimationFrame(this.raf); if (this.cv) this.cv.remove(); this.cv = null; this.ps.length = 0; },
  resize() { const P = $('panel'); if (!this.cv || !P) return; this.w = Math.max(40, Math.round(P.clientWidth / CHEST_PX)); this.h = Math.max(40, Math.round(P.scrollHeight / CHEST_PX)); this.cv.width = this.w; this.cv.height = this.h; this.cv.style.height = this.h * CHEST_PX + 'px'; },
  tension(k) { this.k = k; }, // 0 at the start of a spin, 1 when the reel stops
  add(x, y, vx, vy, life, col, shape, g, sz) { if (this.ps.length < 700) this.ps.push({ x, y, vx, vy, life, max: life, col, shape, g: g || 0, sz: sz || 1, ph: Math.random() * 6.28 }); },
  // where a card sits on the canvas
  at(el) { const P = $('panel'); if (!el || !P) return [this.w / 2, this.h / 2]; const a = el.getBoundingClientRect(), b = P.getBoundingClientRect(), z = b.width / (P.clientWidth || b.width) || 1;
    return [((a.left + a.width / 2 - b.left) / z) / CHEST_PX, ((a.top + a.height / 2 - b.top) / z + P.scrollTop) / CHEST_PX]; },
  ambient(dt) {
    const T = this.theme, n = T.rate * (0.4 + 2.2 * this.k * this.k) * dt; let c = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0);
    while (c-- > 0) {
      const col = pick(T.cols), W = this.w, H = this.h;
      if (T.from === 'top') this.add(Math.random() * W, -2, (Math.random() - 0.5) * 6, 8 + Math.random() * 10, 3 + Math.random() * 2, col, T.shape, T.g, 1);
      else if (T.from === 'bottom') this.add(Math.random() * W, H * (0.55 + Math.random() * 0.45), (Math.random() - 0.5) * 6, -6 - Math.random() * 10, 1.6 + Math.random() * 1.6, col, T.shape, T.g, 1);
      else if (T.from === 'ring') { const a = Math.random() * 6.28, R = Math.max(W, H) * 0.45, cx = W / 2, cy = H * 0.32; this.add(cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.6, -Math.cos(a) * R * 0.5, -Math.sin(a) * R * 0.3, 1.8, col, T.shape, 0, 1); }
      else this.add(Math.random() * W, Math.random() * H, 0, -2, 0.8 + Math.random(), col, T.shape, T.g, 1);
    }
  },
  tick(markerEl) { if (!this.cv || Math.random() > 0.35 + this.k * 0.6) return; const [x, y] = this.at(markerEl); for (let i = 0; i < 2 + this.k * 4; i++) this.add(x + (Math.random() - 0.5) * 4, y - 14, (Math.random() - 0.5) * 30, -10 - Math.random() * 25, 0.35, pick(this.theme.cols), 'dot', 60, 1); },
  // the win: a burst in the rarity's colours, sized by rarity; legendary+ flashes and shakes, a hero adds rainbow rays
  land(rarity, prize, cardEl, small) {
    if (!this.cv) return; const ri = rarIdx(rarity), cols = RAR_COLS[rarity] || RAR_COLS.common, [x, y] = this.at(cardEl), T = this.theme;
    const n = (small ? 14 : 30) + ri * (small ? 10 : 26);
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = 20 + Math.random() * (40 + ri * 14); this.add(x, y, Math.cos(a) * s, Math.sin(a) * s - 10, 0.7 + Math.random() * (0.6 + ri * 0.15), pick(cols), Math.random() < 0.3 ? T.shape : i % 5 ? 'dot' : 'star', 50, Math.random() < 0.25 ? 2 : 1); }
    if (prize === 'gold' || (ri >= 4 && !small)) for (let i = 0; i < 20 + ri * 10; i++) this.add(Math.random() * this.w, -4 - Math.random() * 30, (Math.random() - 0.5) * 10, 10 + Math.random() * 20, 3, pick(['#ffc94a', '#ffe08a', '#b07a12']), 'coin', 40, 1);
    if (prize === 'res') for (let i = 0; i < 24; i++) { const a = Math.random() * 6.28; this.add(x, y, Math.cos(a) * 34, Math.sin(a) * 34 - 20, 1.4, pick(CHEST_THEME.crystals.cols), 'shard', 50, 1); }
    if (ri >= 3 || prize === 'hero') { this.flash = Math.max(this.flash, prize === 'hero' ? 1 : 0.35 + ri * 0.1); this.fx = x; this.fy = y; }
    if (prize === 'hero' || ri >= 5) this.rays = small ? 1.2 : 2.6;
    if ((ri >= 4 || prize === 'hero') && !G.profile.settings.calm) Cam.shake = Math.max(Cam.shake, small ? 0.3 : 0.5 + 0.1 * ri);
    if ($('panel')) { $('panel').classList.remove('chestPop'); void $('panel').offsetWidth; if (ri >= 3 || prize === 'hero') $('panel').classList.add('chestPop'); }
  },
  step(dt) {
    const g = this.g; if (!g) return; this.t += dt;
    if (this.cv.height !== Math.round(($('panel').scrollHeight || 0) / CHEST_PX)) this.resize();
    if (!Reel.done) this.ambient(dt); else this.ambient(dt * 0.25);
    g.clearRect(0, 0, this.w, this.h);
    // god rays behind a hero / mythic+ win
    if (this.rays > 0) { this.rays -= dt; const a0 = this.t * 0.8, cx = this.fx, cy = this.fy; g.globalAlpha = Math.min(1, this.rays) * 0.35;
      for (let i = 0; i < 12; i++) { const a = a0 + i * 0.5236; g.fillStyle = `hsl(${(i * 30 + this.t * 120) % 360} 100% 70%)`; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 400, cy + Math.sin(a) * 400); g.lineTo(cx + Math.cos(a + 0.12) * 400, cy + Math.sin(a + 0.12) * 400); g.fill(); }
      g.globalAlpha = 1; }
    const T = this.theme;
    for (let i = this.ps.length - 1; i >= 0; i--) {
      const p = this.ps[i]; p.life -= dt; if (p.life <= 0 || p.y > this.h + 6) { this.ps.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += (p.vx + (T.wob ? Math.sin(p.ph + this.t * 3) * T.wob : 0)) * dt; p.y += p.vy * dt; p.vx *= 1 - 0.6 * dt;
      const a = Math.min(1, p.life / p.max * 2.2), tw = p.shape === 'star' ? 0.5 + 0.5 * Math.sin(p.ph + this.t * 14) : 1, X = Math.round(p.x), Y = Math.round(p.y), s = p.sz;
      g.globalAlpha = a * tw; g.fillStyle = p.col;
      if (p.shape === 'coin') { const w = Math.max(1, Math.round(Math.abs(Math.cos(p.ph + this.t * 6)) * 3)); g.fillStyle = '#7a4e08'; g.fillRect(X - w / 2 - 0.5, Y - 2, w + 1, 4); g.fillStyle = p.col; g.fillRect(X - w / 2, Y - 1.5, w, 3); }
      else if (p.shape === 'star') { g.fillRect(X - s, Y, 2 * s + 1, 1); g.fillRect(X, Y - s, 1, 2 * s + 1); if (tw > 0.8) { g.fillStyle = '#fff'; g.fillRect(X, Y, 1, 1); } }
      else if (p.shape === 'flake') { g.fillRect(X - 1, Y, 3, 1); g.fillRect(X, Y - 1, 1, 3); }
      else if (p.shape === 'shard') { g.fillRect(X, Y - 1, 1, 3); g.fillRect(X - 1, Y, 3, 1); g.fillStyle = '#ffffff'; g.fillRect(X, Y - 1, 1, 1); }
      else g.fillRect(X, Y, s, s);
    }
    g.globalAlpha = 1;
    if (this.flash > 0) { this.flash -= dt * 1.6; g.globalAlpha = Math.max(0, this.flash) * 0.5; g.fillStyle = '#fff6d8'; g.fillRect(0, 0, this.w, this.h); g.globalAlpha = 1; }
  },
};
