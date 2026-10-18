// --- Bastion Siege: your own fort, entered through the Bastion house in town. The land around The Keep starts small and
// grows with your level (up to 500 x 500 m). You build anywhere on a grid of 2 m cells: archers, cannons, ballistas,
// mage towers, barracks, mines, builder huts, and walls and gates you lay yourself. Endless waves come from one to four
// sides; monsters walk around your walls, and break through the cheapest one when every way is closed. Like the Rift it
// stays in G.mode 'hub' (G.siege set). The fort is permanent and never loses its wave: a fallen Keep restarts the wave it
// fell on. A fort can be a shared world others join with its code (74-siege-mp.js); then one player runs the waves.
const SC = { x: 0, z: -2200 }; // siege fort centre (arena −1000, rift −1400, dungeon −1800)
CFG.siege = {
  // gate: the door of the Bastion house on the west side of the town plaza (house: where the building stands)
  unlock: 20, gate: { x: -21.4, z: -56 }, house: { x: -25.2, z: -56 }, interactR: 3.2, bossBlock: 30,
  // land: half-size in m, 30 at level 20 growing to 250 (500 x 500 m) at level 200; cell: the build grid in m
  cell: 2, land: [30, 250, 20, 200], zoom: 1.3, march: 1.8,
  firstBuild: 25, build: 30, clear: 2.5, spawnGap: 0.55, bossEvery: 10, miniFrom: 3, miniChance: 0.35, lvlBase: 18, lvlPer: 1.5, maxLvl: 15,
  // objectives: HP = reference hero HP at the wave level × mult (kept as a fraction between waves); the Keep ends the run.
  // Named as the camera sees them: +x is the left of the screen
  objs: [
    { id: 'keep', name: 'The Keep', x: 0, z: 2, r: 4.1, h: 7.2, mult: 30, main: true },
    { id: 'wagonW', name: 'East Wagon', x: -12, z: -13, r: 1.8, h: 3.6, mult: 12 },
    { id: 'wagonE', name: 'West Wagon', x: 12, z: -13, r: 1.8, h: 3.6, mult: 12 },
  ],
  heal: 0.25, wagonBonus: 0.25, // objectives mend a quarter between waves; every wagon still standing adds 25% gold
  spawn: { x: 0, z: -17 }, exit: { x: 0, z: -21 },
  // sides monsters come from, as the camera sees them (+z is up on screen, +x is left)
  sides: [{ name: 'North', x: 0, z: 1 }, { name: 'East', x: -1, z: 0 }, { name: 'South', x: 0, z: -1 }, { name: 'West', x: 1, z: 0 }],
  // seconds an upgrade to level l takes (one builder each): 6 s for level 2, about 70 minutes for level 15
  buildTime: (l) => (l <= 1 ? 0 : Math.round(6 * Math.pow(l - 1, 2.5))),
  // dmg × the reference hero's hit at your level, +30% per level; hp × reference hero HP at the wave level; path: how many
  // cells a monster walks around rather than break it. cost: gold in wave payouts at your level, stones for level 1.
  towers: {
    archer: { name: 'Archer Tower', short: 'Archer', icon: 'b_arrow', range: 16, cd: 0.8, dmg: 0.55, speed: 30, color: 0xffe08a, cost: 2, stones: 4, hp: 8,
      blurb: 'Fast arrows at one target. Cheap and steady.' },
    cannon: { name: 'Cannon', short: 'Cannon', icon: 'a_bigshot', range: 13, cd: 2.4, dmg: 1.2, aoe: 2.8, fly: 0.9, color: 0x3a3a44, cost: 3, stones: 6, hp: 10,
      blurb: 'Slow shells that blast a whole group.' },
    ballista: { name: 'Ballista', short: 'Ballista', icon: 'n_pierce', range: 22, cd: 2.8, dmg: 2.4, pierce: 3, speed: 40, color: 0xbfe9ff, cost: 3, stones: 6, hp: 8,
      blurb: 'Huge bolts from far away that pierce through a line of monsters.' },
    mage: { name: 'Mage Tower', short: 'Mage', icon: 'b_orb', range: 18, cd: 1.7, dmg: 0.9, aoe: 1.8, speed: 20, color: 0xb98cff, cost: 3.5, stones: 8, hp: 7,
      blurb: 'Arcane orbs that burst on a small group.' },
    warrior: { name: 'Barracks', short: 'Warriors', icon: 'b_wave', range: 6, cd: 1.0, dmg: 0.7, hp: 0.9, men: 2, respawn: 8, cost: 2.5, stones: 5, bhp: 10,
      blurb: 'Warriors that block the path and fight monsters near their post.' },
    mine: { name: 'Stone Mine', short: 'Mine', icon: 'n_gems', rate: 2, cap: 8, max: 3, cost: 2, stones: 4, hp: 8,
      blurb: 'Digs up Bastion Stones, even while you are away. Walk up and empty it.' },
    hut: { name: "Builder's Hut", short: 'Builder', icon: 'm_smith', max: 5, maxLvl: 1, each: true, cost: 3, stones: 8, hp: 8,
      blurb: 'One builder each. More huts, more upgrades at the same time.' },
    wall: { name: 'Wall', short: 'Wall', icon: 'n_armor', cost: 0.1, stones: 0.4, hp: 5, path: 6, wall: true,
      blurb: 'Draw walls as you walk. Wood, stone from level 6, iron from level 11.' },
    gate: { name: 'Gate', short: 'Gate', icon: 'm_portal', cost: 0.3, stones: 1, hp: 5, path: 6, wall: true,
      blurb: 'A wall heroes walk through and monsters have to break.' },
  },
};
const SIEGE_TYPES = ['archer', 'cannon', 'ballista', 'mage', 'warrior', 'mine', 'hut', 'wall', 'gate'];
const SIEGE_SHOOTERS = { archer: 1, cannon: 1, ballista: 1, mage: 1 };
// where shots leave each defender (f: metres ahead of its centre toward the target, y: height) and how long it winds up first
const SIEGE_MUZZLE = { archer: { f: 0.9, y: 4.4, wind: 0.25 }, cannon: { f: 1.9, y: 1.3, wind: 0.5 }, ballista: { f: 1.5, y: 1.9, wind: 0.6 }, mage: { f: 0.4, y: 6.2, wind: 0.7 } };
const siegeLvlMul = (l) => 1 + 0.3 * (l - 1);
const siegeMen = (l) => Math.min(4, CFG.siege.towers.warrior.men + Math.floor(l / 5));
// one wave's gold at hero level L: the price unit for building
const siegeGoldUnit = (L) => Math.round((20 + 6 * L) * Math.pow(CFG.enemies.goldGrowth, L - 1));
const fortNow = () => Date.now();
// the fort on screen: a shared world while you are in one, else your own (stones are always your own)
function myFort() { const p = G.profile; if (!p.fort || !Array.isArray(p.fort.b)) p.fort = sanitizeFort(p.fort, true); return p.fort; }
function fortState() { return G.siegeWorld ? G.siegeWorld.fort : myFort(); }
const fortLvl = (b) => (b.d > fortNow() ? b.l - 1 : b.l); // an upgrade under way works at the old level
const fortMaxLvl = (t) => CFG.siege.towers[t].maxLvl || CFG.siege.maxLvl;
const landFor = (L) => { const [a, b, l0, l1] = CFG.siege.land; return Math.round(lerp(a, b, clamp((L - l0) / (l1 - l0), 0, 1))); };
// price of level l of type t; huts get dearer with every hut you have
function fortCost(t, l, F = fortState()) {
  const T = CFG.siege.towers[t], k = T.each ? 1 + F.b.filter((b) => b.t === t).length : 1;
  return { lvl: l, gold: Math.round(siegeGoldUnit(G.profile.level) * T.cost * (1 + (l - 1) * 0.8) * k), stones: Math.round(T.stones * Math.pow(l, 1.35) * k), time: CFG.siege.buildTime(l) };
}
function fortStonesSpent(b) { let n = 0; for (let k = 1; k <= b.l; k++) n += Math.round(CFG.siege.towers[b.t].stones * Math.pow(k, 1.35)); return n; }
const fortBuilders = (F = fortState()) => F.b.filter((b) => b.t === 'hut').length;
const fortJobs = (F = fortState()) => { const now = fortNow(); return F.b.filter((b) => b.d > now).length; };
function fortMineStones(b) { const T = CFG.siege.towers.mine; return Math.min(T.cap * b.l, Math.floor((fortNow() - (b.c || fortNow())) / 3600e3 * T.rate * b.l)); }
const siegeLevel = (n) => Math.max(G.profile.level - 2, CFG.siege.lvlBase + Math.round(CFG.siege.lvlPer * n)) + tierAdd();
const siegeDefDmg = (T, l) => refDmg(G.profile.level) * T.dmg * siegeLvlMul(l);
function siegeClamp(f, r) { if (!G.siege) return; const h = G.siege.half - 0.8 - r; f.x = clamp(f.x, SC.x - h, SC.x + h); f.z = clamp(f.z, SC.z - h, SC.z + h); }

// --- the grid: cells of CFG.siege.cell m around the Keep. occ: 0 free, -1 objective, -2 kept clear (spawn, portal), k + 1 = unit k
const cellAt = (v) => Math.floor(v / CFG.siege.cell);
function siegeIdx(i, j) { const S = G.siege, h = S.h; return i < -h || j < -h || i >= h || j >= h ? -1 : (i + h) + (j + h) * S.n; }
function siegeUnit(b) {
  const T = CFG.siege.towers[b.t], s = FORT_TYPES[b.t], cs = CFG.siege.cell;
  return { b, id: nextId++, kind: 'fortB', size: s, x: SC.x + (b.x + s / 2) * cs, z: SC.z + (b.z + s / 2) * cs, r: s === 1 ? 1.05 : 1.6, cd: rand(0, 1), alive: true, hp: 1, maxHp: 0, flashT: 0, hurtT: 0, name: T.name };
}
function siegeUnitHp(u) { const T = CFG.siege.towers[u.b.t], k = u.maxHp ? u.hp / u.maxHp : 1; u.maxHp = Math.round(refHp(G.siege.lvl) * (T.bhp || T.hp) * siegeLvlMul(Math.max(1, fortLvl(u.b)))); u.hp = u.alive ? Math.max(1, Math.round(k * u.maxHp)) : 0; }
// rebuilt whenever the fort changes or a building falls: cells, units (their state kept), solid circles and the monsters' paths
function siegeLayout() {
  const S = G.siege, F = fortState(), cs = CFG.siege.cell, h = S.h = Math.ceil(S.half / cs), n = S.n = h * 2;
  const occ = S.occ = new Int32Array(n * n), old = new Map(S.units.map((u) => [u.b, u]));
  const disc = (x, z, r, v) => { for (let i = cellAt(x - r); i <= cellAt(x + r); i++) for (let j = cellAt(z - r); j <= cellAt(z + r); j++) { const k = siegeIdx(i, j); if (k >= 0 && Math.hypot((i + 0.5) * cs - x, (j + 0.5) * cs - z) < r + cs * 0.35) occ[k] = v; } };
  for (const q of [CFG.siege.spawn, CFG.siege.exit]) disc(q.x, q.z, 1.6, -2);
  for (const d of CFG.siege.objs) disc(d.x, d.z, d.r, -1);
  S.units = [];
  for (const b of F.b) {
    const s = FORT_TYPES[b.t], ks = [];
    for (let i = 0; i < s; i++) for (let j = 0; j < s; j++) ks.push(siegeIdx(b.x + i, b.z + j));
    if (ks.some((k) => k < 0 || occ[k] !== 0)) continue; // outside the land or on the Keep (a shrunk or edited world): not built here
    const u = old.get(b) || siegeUnit(b); u.k = S.units.length; S.units.push(u); ks.forEach((k) => { occ[k] = u.k + 1; });
    if (!u.maxHp) siegeUnitHp(u);
  }
  // the monster gate on each side (a gatehouse, 47c-siege-view.js): kept clear of new buildings
  for (const d of CFG.siege.sides) { const gx = d.x * (S.half - 3), gz = d.z * (S.half - 3); for (let i = cellAt(gx - 4.5); i <= cellAt(gx + 4.5); i++) for (let j = cellAt(gz - 4.5); j <= cellAt(gz + 4.5); j++) { const k = siegeIdx(i, j); if (k >= 0 && occ[k] === 0) occ[k] = -2; } }
  S.soldiers = S.soldiers.filter((s) => old.get(s.u.b) === s.u && S.units.includes(s.u));
  for (const u of S.units) if (u.b.t === 'warrior' && !S.soldiers.some((s) => s.u === u)) siegeMuster(u);
  siegeGrid(); S.flowDirty = true;
}
// keep, wagons and living buildings are solid; gates only for monsters (rebuilt as a whole: the Grid has no remove)
function siegeGrid() {
  const S = G.siege, a = new Grid(6), m = new Grid(6);
  for (const o of S.objs) if (o.alive) { const c = { x: o.x, z: o.z, r: o.r }; a.add(c); m.add(c); }
  for (const u of S.units) if (u.alive) { const c = { x: u.x, z: u.z, r: u.r }; m.add(c); if (u.b.t !== 'gate') a.add(c); }
  S.mobGrid = m; G.siegeObstacles = a; G.obstacles = a; return a;
}
// the monsters' map: walking cost from every cell to the nearest living objective. A building costs its path value to
// cross (monsters break it), so they walk around walls while that is cheaper and break the cheapest one when it is not.
function siegeCellCost(k) { const S = G.siege, o = S.occ[k]; if (o === -1) return Infinity; if (o <= 0) return 1; const u = S.units[o - 1]; if (!u.alive) return 1; const T = CFG.siege.towers[u.b.t]; return T.path ? T.path + fortLvl(u.b) : 30; }
// recomputed only when a monster needs it after a change (drawing a long wall costs one pass, not one per piece)
function siegeFlow() {
  G.siege.flowDirty = false;
  const S = G.siege, n = S.n, N = n * n, cs = CFG.siege.cell, dist = S.dist = new Float64Array(N).fill(Infinity), cost = new Float32Array(N);
  for (let k = 0; k < N; k++) cost[k] = siegeCellCost(k);
  // a binary heap in typed arrays (a cell can sit in it more than once; stale entries are skipped)
  let hk = new Float64Array(N * 2), hv = new Int32Array(N * 2), hn = 0;
  const push = (d, k) => {
    if (hn === hk.length) { const a = new Float64Array(hn * 2), b = new Int32Array(hn * 2); a.set(hk); b.set(hv); hk = a; hv = b; }
    let i = hn++; while (i > 0) { const p = (i - 1) >> 1; if (hk[p] <= d) break; hk[i] = hk[p]; hv[i] = hv[p]; i = p; } hk[i] = d; hv[i] = k;
  };
  const pop = () => {
    const k = hv[0], d = hk[--hn], v = hv[hn]; let i = 0;
    for (;;) { let c = 2 * i + 1; if (c >= hn) break; if (c + 1 < hn && hk[c + 1] < hk[c]) c++; if (hk[c] >= d) break; hk[i] = hk[c]; hv[i] = hv[c]; i = c; }
    hk[i] = d; hv[i] = v; return k;
  };
  for (const o of S.objs) if (o.alive) for (let i = cellAt(o.x - SC.x - o.r - cs); i <= cellAt(o.x - SC.x + o.r + cs); i++) for (let j = cellAt(o.z - SC.z - o.r - cs); j <= cellAt(o.z - SC.z + o.r + cs); j++) {
    const k = siegeIdx(i, j); if (k >= 0 && cost[k] < Infinity && dist[k] > cost[k]) { dist[k] = cost[k]; push(cost[k], k); }
  }
  while (hn) {
    const d0 = hk[0], k = pop(); if (d0 > dist[k]) continue;
    const i = k % n, j = (k - i) / n;
    for (let q = 0; q < 8; q++) {
      const di = SIEGE_DI[q], dj = SIEGE_DJ[q], i2 = i + di, j2 = j + dj; if (i2 < 0 || j2 < 0 || i2 >= n || j2 >= n) continue;
      const k2 = i2 + j2 * n, c = cost[k2]; if (c === Infinity) continue;
      if (q > 3 && (cost[i2 + j * n] !== 1 || cost[i + j2 * n] !== 1)) continue; // no cutting a corner past a building
      const nd = d0 + (q > 3 ? c * 1.414 : c); if (nd < dist[k2]) { dist[k2] = nd; push(nd, k2); }
    }
  }
}
const SIEGE_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], SIEGE_DI = SIEGE_DIRS.map((d) => d[0]), SIEGE_DJ = SIEGE_DIRS.map((d) => d[1]);
// where a monster walks next: the neighbouring cell closest to the fort, or the building standing in that cell
function siegeFlowStep(e) {
  const S = G.siege; if (S.flowDirty) siegeFlow();
  const cs = CFG.siege.cell, n = S.n, i = cellAt(e.x - SC.x), j = cellAt(e.z - SC.z), k = siegeIdx(i, j);
  if (k < 0) return { x: SC.x, z: SC.z, far: true };
  let best = S.dist[k], bk = -1;
  for (const [di, dj] of SIEGE_DIRS) {
    const k2 = siegeIdx(i + di, j + dj); if (k2 < 0 || S.dist[k2] >= best) continue;
    if (di && dj && (siegeCellCost(siegeIdx(i + di, j)) !== 1 || siegeCellCost(siegeIdx(i, j + dj)) !== 1)) continue;
    best = S.dist[k2]; bk = k2;
  }
  if (bk < 0) return null; // next to an objective
  const o = S.occ[bk]; if (o > 0 && S.units[o - 1].alive) return S.units[o - 1];
  const bi = bk % n - S.h, bj = (bk - bk % n) / n - S.h;
  return { x: SC.x + (bi + 0.5) * cs, z: SC.z + (bj + 0.5) * cs, far: S.dist[k] > 30 };
}

// --- building: the same checks and changes for your own fort and for a shared world's host (op from fortDo or a guest)
// op: { o: 'add', t, x, z } | { o: 'up', k } | { o: 'del', k } | { o: 'col', k } (k = index in the fort's building list)
function fortCheck(op, F = fortState()) {
  const S = G.siege; if (!S || !S.occ) return 'Only inside the fort';
  const C = CFG.siege, now = fortNow();
  if (op.o === 'add') {
    const T = C.towers[op.t]; if (!T) return 'Unknown building';
    if (T.max && F.b.filter((b) => b.t === op.t).length >= T.max) return `${T.max} ${T.short}s at most`;
    const s = FORT_TYPES[op.t];
    for (let i = 0; i < s; i++) for (let j = 0; j < s; j++) { const k = siegeIdx(op.x + i, op.z + j); if (k < 0) return 'Outside your land'; if (S.occ[k] !== 0) return 'Something is in the way'; }
    for (const e of S.mobs) if (e.alive && Math.abs(e.x - SC.x - (op.x + s / 2) * C.cell) < s + 0.5 && Math.abs(e.z - SC.z - (op.z + s / 2) * C.cell) < s + 0.5) return 'A monster is in the way';
    return '';
  }
  const b = F.b[op.k]; if (!b) return 'Gone';
  if (op.o === 'up') { if (b.l >= fortMaxLvl(b.t)) return 'Max level'; if (b.d > now) return 'Already upgrading'; if (C.buildTime(b.l + 1) > 0 && fortJobs(F) >= fortBuilders(F)) return 'All builders are busy'; }
  if (op.o === 'del' && b.t === 'hut' && fortBuilders(F) <= 1) return 'Your last builder stays';
  if (op.o === 'col' && b.t !== 'mine') return 'Not a mine';
  return '';
}
// what op costs or pays this player (gold, stones; negative = paid back)
function fortPrice(op, F = fortState()) {
  if (op.o === 'add') { const c = fortCost(op.t, 1, F); return { gold: c.gold, stones: c.stones }; }
  const b = F.b[op.k];
  if (op.o === 'up') { const c = fortCost(b.t, b.l + 1, F); return { gold: c.gold, stones: c.stones }; }
  if (op.o === 'del') return { gold: 0, stones: -Math.floor(fortStonesSpent(b) / 2) };
  return { gold: 0, stones: -fortMineStones(b) };
}
function fortPay(pr, sign = 1) { const p = G.profile, M = myFort(); p.gold -= sign * pr.gold; M.stones = Math.max(0, M.stones - sign * pr.stones); G.dirty = true; }
// change the fort (no payment here); returns '' or why not
function fortApply(op, F = fortState()) {
  const why = fortCheck(op, F); if (why) return why;
  const C = CFG.siege, now = fortNow();
  let b;
  if (op.o === 'add') { b = { t: op.t, x: op.x, z: op.z, l: 1 }; if (op.t === 'mine') b.c = now; F.b.push(b); }
  else if (op.o === 'up') { b = F.b[op.k]; b.l++; const t = C.buildTime(b.l); if (t > 0) b.d = now + t * 1000; }
  else if (op.o === 'del') { b = F.b.splice(op.k, 1)[0]; }
  else { b = F.b[op.k]; b.c = now; }
  if (op.o !== 'col') {
    siegeLayout(); const u = G.siege.units.find((q) => q.b === b); if (u) siegeUnitHp(u);
    const s = FORT_TYPES[b.t]; ev({ t: op.o === 'del' ? 'fortGone' : 'fortBuilt', type: b.t, l: b.l, x: SC.x + (b.x + s / 2) * C.cell, z: SC.z + (b.z + s / 2) * C.cell });
  }
  fortChanged(F); return '';
}
// the fort was changed: your own is in your profile; a shared world is saved by its host (74-siege-mp.js)
function fortChanged(F) { if (F === myFort()) G.dirty = true; if (typeof siegeMpChanged === 'function') siegeMpChanged(); }
// a player's own action: check, pay, then apply here or ask the host of a shared world
function fortDo(op) {
  const F = fortState(), why = fortCheck(op, F); if (why) return why;
  const pr = fortPrice(op, F), p = G.profile;
  if (pr.gold > p.gold) return 'Not enough gold'; if (pr.stones > myFort().stones) return 'Not enough Bastion Stones';
  if (typeof siegeFollowing === 'function' && siegeFollowing()) { fortPay(pr); siegeMpAsk(op, pr); return ''; }
  const r = fortApply(op, F); if (!r) fortPay(pr); return r;
}
// placing: a ghost one cell ahead of the hero (or, while drawing walls, on the cell just walked off)
function fortGhost() {
  const P = G.fortPlace, pl = G.player, S = G.siege; if (!P || !S) return null;
  const s = FORT_TYPES[P.t], cs = CFG.siege.cell;
  if (P.draw) return P.trail != null ? { t: P.t, x: P.trail[0], z: P.trail[1], ok: !fortCheck({ o: 'add', t: P.t, x: P.trail[0], z: P.trail[1] }) } : null;
  const a = pl.facing || 0, d = s === 1 ? 2.2 : 3.6, x = cellAt(pl.x - SC.x + Math.sin(a) * d - (s - 1) * cs / 2), z = cellAt(pl.z - SC.z + Math.cos(a) * d - (s - 1) * cs / 2);
  return { t: P.t, x, z, ok: !fortCheck({ o: 'add', t: P.t, x, z }) && !siegeOnHero(P.t, x, z) };
}
function siegeOnHero(t, x, z) { const pl = G.player, s = FORT_TYPES[t], cs = CFG.siege.cell; return Math.abs(pl.x - SC.x - (x + s / 2) * cs) < s + 0.6 && Math.abs(pl.z - SC.z - (z + s / 2) * cs) < s + 0.6; }
function fortPlaceNow() {
  const P = G.fortPlace; if (!P) return;
  if (CFG.siege.towers[P.t].wall) { P.draw = !P.draw; P.trail = null; P.cell = null; return; }
  const g = fortGhost(); if (!g) return;
  const why = g.ok ? fortDo({ o: 'add', t: g.t, x: g.x, z: g.z }) : siegeOnHero(g.t, g.x, g.z) ? 'Step back to place it' : fortCheck({ o: 'add', t: g.t, x: g.x, z: g.z });
  if (why) toast(why, 'bad'); else { Sfx.play('unlock'); G.fortPlace = null; }
}
// drawing walls: each cell the hero walks off (and is clear of) gets a segment
function stepFortDraw() {
  const P = G.fortPlace, pl = G.player; if (!P || !P.draw || !pl.alive) return;
  const cs = CFG.siege.cell, c = [cellAt(pl.x - SC.x), cellAt(pl.z - SC.z)];
  if (!P.cell) { P.cell = c; return; }
  if (c[0] !== P.cell[0] || c[1] !== P.cell[1]) { P.trail = P.cell; P.cell = c; }
  const q = P.trail; if (!q || Math.hypot(pl.x - SC.x - (q[0] + 0.5) * cs, pl.z - SC.z - (q[1] + 0.5) * cs) < 1.75) return;
  P.trail = null;
  if (fortCheck({ o: 'add', t: P.t, x: q[0], z: q[1] })) return; // something there already: draw on past it
  const why = fortDo({ o: 'add', t: P.t, x: q[0], z: q[1] });
  if (why) { toast(why, 'bad'); P.draw = false; }
}

// --- runtime
// warriors of a barracks: spawned around their post, back after a while when they fall
function siegeMuster(u) {
  const S = G.siege, T = CFG.siege.towers.warrior, l = Math.max(1, fortLvl(u.b));
  S.soldiers = S.soldiers.filter((s) => s.u !== u);
  for (let k = 0, n = siegeMen(l); k < n; k++) {
    const a = (k / n) * Math.PI * 2, hx = u.x + Math.sin(a) * 2.6, hz = u.z + Math.cos(a) * 2.6;
    const s = { id: nextId++, kind: 'soldier', u, team: 'ally', x: hx, z: hz, hx, hz, r: 0.55, facing: 0, moveAmt: 0, attackAnim: 0, flashT: 0, alive: true, atkCd: rand(0, T.cd), respawnT: 0 };
    s.maxHp = s.hp = Math.round(refHp(G.profile.level) * T.hp * siegeLvlMul(l));
    S.soldiers.push(s);
  }
}
function siegeScaleObjs(lvl) {
  for (const o of G.siege.objs) { const k = o.maxHp ? o.hp / o.maxHp : 1; o.maxHp = Math.round(refHp(lvl) * o.def.mult); o.hp = o.alive ? Math.max(1, Math.round(k * o.maxHp)) : 0; }
  for (const u of G.siege.units) siegeUnitHp(u);
}
// world: a shared world { code, fort } (74-siege-mp.js) or null for your own fort on this device
function startSiege(world) {
  const p = G.profile, pl = G.player, C = CFG.siege;
  if (inInstance() || G.mode !== 'hub' || p.level < C.unlock || activeShrine() || !pl.alive) return false;
  if (G.boss && Math.hypot(G.boss.x - pl.x, G.boss.z - pl.z) < C.bossBlock) return false;
  G.siegeWorld = world || null;
  const F = fortState(), own = !world || world.fort === myFort();
  if (own) F.land = Math.max(F.land || 0, landFor(p.level)); // your land grows with you; guests walk the owner's land
  const S = G.siege = { wave: F.wave || 1, phase: 'build', t: C.firstBuild, tMax: C.firstBuild, queue: [], spawnT: 0, mobs: [], soldiers: [], units: [], lvl: 0, code: world ? world.code : null,
    half: Math.max(C.land[0], F.land || 0), sides: [], gold: 0, stones: 0, items: 0, cleared: 0, startWave: F.wave || 1, kills: 0, enterPos: { x: pl.x, z: pl.z },
    objs: C.objs.map((d) => ({ def: d, kind: 'objective', name: d.name, x: SC.x + d.x, z: SC.z + d.z, r: d.r, alive: true, hp: 1, maxHp: 0, flashT: 0, hurtT: 0 })) };
  S.lvl = siegeLevel(S.wave); siegeLayout(); siegeScaleObjs(S.lvl); S.sides = siegeSides(S.wave);
  if (S.code && typeof siegeMpStart === 'function') siegeMpStart();
  clearProjectiles(); G.fortPlace = null;
  pl.x = SC.x + C.spawn.x; pl.z = SC.z + C.spawn.z; pl.facing = 0; pl.hp = pl.maxHp; pl.invulnT = 1.5; pl.ammo = pl.ammoMax;
  ev({ t: 'siegeStart', x: pl.x, z: pl.z, best: p.records.bestSiege || 0, wave: S.wave }); return true;
}
function siegeComposition(n) {
  const boss = n % CFG.siege.bossEvery === 0, count = Math.min(40, 5 + Math.round(n * 1.6)), elites = Math.min(8, Math.floor(n / 3));
  return { boss, count: boss ? Math.ceil(count * 0.6) : count, elites };
}
// which sides the next wave comes from: one at first, up to all four later
function siegeSides(n) {
  let k = 1; for (const [cap, per] of [[0.7, 15], [0.5, 30], [0.3, 60]]) if (Math.random() < Math.min(cap, (n - 2) / per)) k++; // waves 1 and 2: one side
  return [0, 1, 2, 3].sort(() => Math.random() - 0.5).slice(0, k).sort();
}
const siegeSideNames = (sides) => sides.map((i) => CFG.siege.sides[i].name).join(', ');
// fill the spawn queue; monsters walk in from the edge of the land on this wave's sides
function startSiegeWave() {
  const S = G.siege; if (!S || S.phase !== 'build') return false;
  if (typeof siegeFollowing === 'function' && siegeFollowing()) { siegeMpGo(); return true; }
  const n = S.wave, Zs = CFG.world.zones, zi = 1 + (n - 1) % (Zs.length - 1), Z = Zs[zi], C = siegeComposition(n);
  S.lvl = siegeLevel(n); siegeScaleObjs(S.lvl);
  S.queue = [];
  for (let k = 0; k < C.count; k++) S.queue.push({ type: Math.random() < 0.5 ? Z.enemy : (Z.alt || Z.enemy), zi, elite: k < C.elites });
  S.queue.sort(() => Math.random() - 0.5);
  S.mini = !C.boss && n >= CFG.siege.miniFrom && Math.random() < CFG.siege.miniChance;
  if (S.mini) S.queue.splice(Math.floor(S.queue.length / 2), 0, { type: Z.alt || Z.enemy, zi, mini: true });
  if (C.boss) S.queue.push({ type: Z.enemy, zi, boss: true });
  S.phase = 'fight'; S.spawnT = 0.4; S.sideI = 0; G.fortPlace = G.fortPlace && G.fortPlace.draw ? G.fortPlace : null;
  ev({ t: 'siegeWave', wave: n, lvl: S.lvl, boss: C.boss, mini: S.mini, count: S.queue.length, theme: Z.name, sides: siegeSideNames(S.sides) });
  return true;
}
function siegeSpawnPoint() {
  const S = G.siege, sd = CFG.siege.sides[S.sides[S.sideI++ % S.sides.length]], edge = S.half - 4;
  for (let tries = 0; ; tries++) {
    // through that side's gate
    const along = rand(-1, 1) * (3 + S.half * 0.06), x = SC.x + sd.x * edge + sd.z * along, z = SC.z + sd.z * edge + sd.x * along, k = siegeIdx(cellAt(x - SC.x), cellAt(z - SC.z));
    if (tries > 8 || (k >= 0 && S.occ[k] <= 0)) return { x, z, a: Math.atan2(-sd.x, -sd.z) };
  }
}
function spawnSiegeMob(q) {
  const S = G.siege, at = siegeSpawnPoint(), x = at.x, z = at.z;
  let e;
  if (q.boss) { e = makeChampion(q.type, q.zi, S.lvl + 2, Math.min(3, 1 + Math.floor(S.wave / 15)), true); e.bossName = 'Siege Lord'; }
  else if (q.mini) { e = makeChampion(q.type, q.zi, S.lvl + 1, 1, false); e.bossName = 'Siege Captain'; e.miniBoss = true; }
  else e = makeEnemy(q.type, q.zi, { elite: q.elite });
  delete e.rift; delete e.riftLvl;
  e.siege = true; e.temp = true; e.state = 'chase'; e.tgt = null; e.tgtT = 0;
  setEnemyLevel(e, q.boss ? S.lvl + 2 : q.mini ? S.lvl + 1 : S.lvl);
  e.x = e.hx = e.wx = x; e.z = e.hz = e.wz = z; e.facing = at.a;
  G.enemies.push(e); S.mobs.push(e);
  ev({ t: 'spawn', x, z, elite: e.elite });
  return e;
}
function clearSiegeMobs() {
  const S = G.siege; if (!S) return;
  const ids = new Set(S.mobs.map((e) => e.id));
  G.enemies = G.enemies.filter((e) => !ids.has(e.id)); for (const id of ids) G.ents.delete(id);
  S.mobs = [];
}
// a wave's pay for this player (the host and every guest each get their own)
function siegeReward(n, lvl, wagons, mini) {
  const p = G.profile, C = CFG.siege, S = G.siege, boss = n % C.bossEvery === 0;
  const gold = Math.round((20 + 6 * lvl) * Math.pow(CFG.enemies.goldGrowth, lvl - 1) * tierMul(curTier()).gold * (1 + C.wagonBonus * wagons)); addGold(gold, true); S.gold += gold;
  const stones = 3 + Math.floor(n / 2) + (boss ? 8 : 0) + (mini ? 4 : 0); myFort().stones += stones; S.stones += stones;
  if (p.level < P.cap) addXp(Math.round(xpToNext(p.level) * Math.min(0.2, 0.05 * (1 + n / 10))), 'dungeon');
  let item = null;
  if (boss) { item = makeItem(pick(CFG.gear.slots), riftRarity(n), lvl); grantItem(item, 'shrine'); S.items++; addEssence(2 + Math.floor(n / 5)); }
  if (n > (p.records.bestSiege || 0)) p.records.bestSiege = n;
  S.cleared = Math.max(S.cleared, n); S.held = (S.held || 0) + 1; addMastery('w:' + G.player.attackId, 15 + n * 3);
  checkAchievements(); G.dirty = true;
  ev({ t: 'siegeClear', wave: n, gold, stones, item: !!item, wagons });
}
function siegeWaveClear() {
  const S = G.siege, n = S.wave, C = CFG.siege, F = fortState(), wagons = S.objs.filter((o) => !o.def.main && o.alive).length;
  siegeReward(n, S.lvl, wagons, S.mini);
  if (typeof siegeMpCleared === 'function') siegeMpCleared(n, S.lvl, wagons, S.mini);
  for (const o of S.objs) if (o.alive) o.hp = Math.min(o.maxHp, Math.round(o.hp + o.maxHp * C.heal));
  // fallen buildings stand again for the next wave; the fort never goes back below a wave it held
  let fell = false; for (const u of S.units) { if (!u.alive) fell = true; u.alive = true; u.hp = u.maxHp; }
  if (fell) { siegeGrid(); S.flowDirty = true; }
  F.wave = Math.max(F.wave || 1, n + 1); fortChanged(F);
}
function stepSiege(dt) {
  const S = G.siege, pl = G.player, C = CFG.siege;
  // carried out of the fort by anything else (waypoint travel): close it where you stand
  if (Math.hypot(pl.x - SC.x, pl.z - SC.z) > S.half * 1.5 + 60) { endSiege('away'); return; }
  if (!pl.alive) G.respawnAt = { x: SC.x + C.spawn.x, z: SC.z + C.spawn.z }; // a fall costs a few seconds, not the run
  stepFortDraw();
  // upgrades finishing: the building's stats and the monsters' paths follow
  const now = fortNow(); let done = false;
  for (const u of S.units) if (u.b.d && u.b.d <= now) { delete u.b.d; siegeUnitHp(u); if (u.b.t === 'warrior') siegeMuster(u); done = true; ev({ t: 'fortBuilt', type: u.b.t, l: u.b.l, x: u.x, z: u.z, done: true }); }
  if (done) { S.flowDirty = true; fortChanged(fortState()); }
  if (typeof siegeMpStep === 'function' && siegeMpStep(dt)) return; // a guest mirrors the host's fort
  if (G.modal && !S.code) return; // your own fort holds still while you are in a menu (a shared one runs on)
  for (const o of S.objs) { o.flashT -= dt; o.hurtT -= dt; }
  stepSiegeDefenders(dt);
  if (S.phase === 'build') { S.t -= dt; if (S.t <= 0) startSiegeWave(); }
  else if (S.phase === 'fight') {
    if (S.queue.length && (S.spawnT -= dt) <= 0) { S.spawnT = C.spawnGap; spawnSiegeMob(S.queue.shift()); }
    if (!S.queue.length && !S.mobs.some((e) => e.alive)) { siegeWaveClear(); S.phase = 'clear'; S.t = S.tMax = C.clear; }
  } else if (S.phase === 'clear' && (S.t -= dt) <= 0) { clearSiegeMobs(); S.wave++; S.phase = 'build'; S.t = S.tMax = C.build; S.sides = siegeSides(S.wave); }
}
// --- defenders: towers pick the nearest monster in range; warriors hold a ring around their post
// ghost: a guest's towers only draw their shots (the host's game deals the damage)
function siegeNearestMob(x, z, range) {
  let best = null, bd = range;
  for (const e of G.siege.mobs) if (e.alive && !e.hidden) { const d = Math.hypot(e.x - x, e.z - z); if (d < bd) { bd = d; best = e; } }
  return best;
}
function stepSiegeDefenders(dt, ghost) {
  const S = G.siege;
  for (const u of S.units) {
    u.flashT -= dt; u.hurtT -= dt;
    const t = u.b.t, l = fortLvl(u.b); if (!u.alive || !SIEGE_SHOOTERS[t] || l < 1) continue;
    const T = CFG.siege.towers[t]; if ((u.cd -= dt) > 0) continue;
    const e = siegeNearestMob(u.x, u.z, T.range); if (!e) { u.cd = 0.15; continue; }
    u.cd = T.cd; u.aim = Math.atan2(e.x - u.x, e.z - u.z); u.fireT = G.time;
    // shots leave from the model: the archers' platform, the cannon's muzzle, the ballista's rail, the mage tower's orb
    const M = SIEGE_MUZZLE[t], dmg = ghost ? 0 : siegeDefDmg(T, l), sx = Math.sin(u.aim), sz = Math.cos(u.aim), ox = u.x + sx * M.f, oz = u.z + sz * M.f, team = ghost ? 'ghost' : 'ally';
    if (t === 'cannon') {
      // a lobbed shell lands where the target will be
      const tx = e.x + (e.vx || 0) * T.fly, tz = e.z + (e.vz || 0) * T.fly;
      spawnProjectile({ x: ox, z: oz, vx: (tx - ox) / T.fly, vz: (tz - oz) / T.fly, life: T.fly, r: 0.45, dmg, team, owner: u.id, kind: 'shell', color: T.color, y: M.y, lob: true, lobH: 2.4, aoe: T.aoe, aoeMult: 1, knock: 4, ghost });
    } else {
      const tt = Math.hypot(e.x - ox, e.z - oz) / T.speed, a = Math.atan2(e.x + (e.vx || 0) * tt - ox, e.z + (e.vz || 0) * tt - oz);
      spawnProjectile({ x: ox, z: oz, vx: Math.sin(a) * T.speed, vz: Math.cos(a) * T.speed, life: (T.range + 3) / T.speed, r: t === 'archer' ? 0.3 : 0.5, dmg, team, owner: u.id,
        kind: t === 'ballista' ? 'rail' : t === 'mage' ? 'orb' : 'arrow', color: T.color, y: M.y, pierce: T.pierce || 0, aoe: T.aoe || 0, aoeMult: T.aoe ? 0.6 : 0, knock: t === 'ballista' ? 5 : 1.5, ghost });
    }
    ev({ t: 'fortShot', type: t, x: ox, z: oz, y: M.y, a: u.aim });
  }
  const W = CFG.siege.towers.warrior;
  for (const s of S.soldiers) {
    s.flashT -= dt; s.attackAnim = Math.max(0, s.attackAnim - dt * 3);
    if (!s.alive) { if ((s.respawnT -= dt) <= 0 && s.u.alive) { s.alive = true; s.hp = s.maxHp; s.x = s.hx; s.z = s.hz; } continue; }
    const e = siegeNearestMob(s.hx, s.hz, W.range);
    let tx = s.hx, tz = s.hz, sp = 0;
    if (e) { tx = e.x; tz = e.z; s.atkCd -= dt; }
    const dx = tx - s.x, dz = tz - s.z, d = Math.hypot(dx, dz), reach = e ? s.r + e.r + 0.3 : 0.3;
    if (d > reach) { sp = 6; s.x += dx / d * sp * dt; s.z += dz / d * sp * dt; s.facing = Math.atan2(dx, dz); }
    else if (e) {
      s.facing = Math.atan2(dx, dz);
      if (s.atkCd <= 0) { s.atkCd = W.cd; s.attackAnim = 1; if (!ghost) dealDamage(e, siegeDefDmg(W, Math.max(1, fortLvl(s.u.b))), s.id, { knockX: dx, knockZ: dz, knock: 2 }); }
    }
    s.moveAmt = lerp(s.moveAmt, sp > 0 ? 1 : 0, 1 - Math.exp(-dt * 10));
    collideObstacles(s); siegeClamp(s, s.r);
  }
}
function siegeHitSoldier(s, amt) {
  s.hp -= amt; s.flashT = CFG.combat.hitFlash;
  ev({ t: 'hit', x: s.x, z: s.z, y: 2.1, amt: Math.round(amt), crit: false, toPlayer: false, byPlayer: false });
  if (s.hp <= 0) { s.alive = false; s.hp = 0; s.respawnT = CFG.siege.towers.warrior.respawn; ev({ t: 'die', x: s.x, z: s.z, kind: 'soldier' }); }
}
// a building falls for the rest of the wave; the monsters' paths open up behind it
function siegeHitBuilding(u, amt) {
  if (!u.alive) return;
  u.hp -= amt; u.flashT = 0.12; u.hurtT = 1.2;
  if (u.hp > 0) return;
  u.hp = 0; u.alive = false; siegeGrid(); G.siege.flowDirty = true;
  for (const s of G.siege.soldiers) if (s.u === u) s.alive = false;
  ev({ t: 'fortBroken', type: u.b.t, x: u.x, z: u.z });
}
function siegeHitObjective(o, amt) {
  if (!o.alive) return;
  o.hp -= amt; o.flashT = 0.12;
  if (o.hurtT <= 0) ev({ t: 'objectiveHit', name: o.name, x: o.x, z: o.z, main: !!o.def.main });
  o.hurtT = 1.2;
  if (o.hp > 0) return;
  o.hp = 0; o.alive = false; siegeGrid(); G.siege.flowDirty = true;
  ev({ t: 'objectiveDown', name: o.name, main: !!o.def.main, x: o.x, z: o.z });
  if (o.def.main) endSiege('keep');
}
// --- siege monsters: follow the map to the fort; warriors in the way, a hero close by and a nearby objective draw them off
function siegeTarget(e) {
  const S = G.siege, pl = G.player;
  let best = null, bd = 5;
  for (const s of S.soldiers) if (s.alive) { const d = Math.hypot(s.x - e.x, s.z - e.z); if (d < bd) { bd = d; best = s; } }
  if (best) return best;
  const near = e.lastHurt > G.time - 2 ? 9 : 6;
  if (pl.alive && G.menuSafe <= 0 && Math.hypot(pl.x - e.x, pl.z - e.z) < near) return pl;
  if (typeof siegeMpPeerNear === 'function') { const q = siegeMpPeerNear(e, near); if (q) return q; }
  bd = 3;
  for (const o of S.objs) if (o.alive) { const d = Math.hypot(o.x - e.x, o.z - e.z) - o.r; if (d < bd) { bd = d; best = o; } }
  return best;
}
function siegeCollide(e) { if (!G.siege) return; const ob = G.obstacles; G.obstacles = G.siege.mobGrid; collideObstacles(e); G.obstacles = ob; }
function stepSiegeEnemy(e, dt) {
  const S = G.siege;
  if (!e.alive || !S) return;
  if (e.mirror) { mobRemoteStep(e, dt); return; } // a shared world's monster, run by the host
  if ((G.modal && !S.code) || G.menuSafe > 0) { e.moveAmt = Math.max(0, (e.moveAmt || 0) - dt * 3); return; }
  if (HeroSupers.tickStatus(e, dt)) { e.flashT -= dt; e.slowT -= dt; tickBurn(e, dt); e.moveAmt = 0; return; }
  const d = CFG.enemies[e.type], pl = G.player;
  e.atkCd -= dt; e.flashT -= dt; e.slowT -= dt; e.lungeT -= dt; e.lungeCd -= dt;
  tickBurn(e, dt); if (!e.alive) return;
  if ((e.tgtT -= dt) <= 0 || !e.tgt || !e.tgt.alive) { e.tgt = siegeTarget(e); e.tgtT = 0.5; }
  let t = e.tgt, way = null;
  if (!t) {
    const f = siegeFlowStep(e);
    if (f && f.kind === 'fortB') t = f; else if (f) way = f;
    else { let bd = Infinity; for (const o of S.objs) if (o.alive) { const q = Math.hypot(o.x - e.x, o.z - e.z) - o.r; if (q < bd) { bd = q; t = o; } } }
  }
  if (!t && !way) { e.moveAmt = 0; return; }
  let mx = 0, mz = 0, sp = 0;
  const slow = e.slowT > 0 ? 0.5 : 1;
  if (way) {
    const dx = way.x - e.x, dz = way.z - e.z, dd = Math.hypot(dx, dz) || 1;
    mx = dx / dd; mz = dz / dd; sp = d.speed * (way.far ? CFG.siege.march : 1); e.facing = Math.atan2(dx, dz);
  } else {
    const dx = t.x - e.x, dz = t.z - e.z, dd = Math.hypot(dx, dz) || 1, edge = dd - (t.r || 0.5) - e.r;
    // against the hero, monsters fight as they do everywhere else: telegraphed moves and champion affixes
    if (t === pl && ((e.champ && champTick(e, dt, pl, dd)) || (d.moves && !e.champ && enemyMove(e, dt, pl, dd)))) { trackVel(e, dt); siegeCollide(e); siegeClamp(e, e.r); return; }
    markCombat();
    const hit = (mult) => {
      const amt = mobDmg(e, mult);
      if (t === pl) dealDamage(pl, amt, e.id, { knockX: dx, knockZ: dz, knock: d.heavy ? 12 : 4 });
      else if (t.isPeer) siegeMpHitPeer(t, amt);
      else if (t.kind === 'soldier') siegeHitSoldier(t, amt);
      else if (t.kind === 'fortB') siegeHitBuilding(t, amt);
      else siegeHitObjective(t, amt);
    };
    if (d.attack === 'touch') {
      mx = dx / dd; mz = dz / dd; sp = edge > 0.15 ? d.speed : 0;
      if (edge < 0.45 && e.atkCd <= 0) { e.atkCd = d.cd; e.attackAnim = 1; hit(d.heavy ? CFG.enemies.heavyMult : 1); if (d.heavy) ev({ t: 'boom', x: t.x, z: t.z, r: 1.6, color: 0xdfeaf4 }); }
    } else {
      sp = d.speed;
      if (edge > d.keep + 1.5) { mx = dx / dd; mz = dz / dd; } else if (edge < d.keep - 3) { mx = -dx / dd; mz = -dz / dd; } else sp = 0;
      if (e.atkCd <= 0 && edge < d.keep + 3) {
        e.atkCd = d.cd * rand(0.85, 1.2); e.attackAnim = 1;
        const a0 = Math.atan2(dx, dz), n = (d.shots || 1) + (e.elite ? 2 : 0), spr = d.spread || 0.35;
        for (let k = 0; k < n; k++) {
          const a = n > 1 ? a0 + (k / (n - 1) - 0.5) * spr : a0;
          // shots at the hero can be dodged; shots at the fort land (the bolt is drawn, the damage applied once below)
          spawnProjectile({ x: e.x, z: e.z, vx: Math.sin(a) * d.shotSpeed, vz: Math.cos(a) * d.shotSpeed, life: t === pl ? (d.keep + 8) / d.shotSpeed : Math.max(0.1, edge / d.shotSpeed), r: 0.4,
            dmg: mobDmg(e, 1), team: 'mob', owner: e.id, kind: 'orb', color: d.shotColor || 0x7fe3ff, y: 1.4, ghost: t !== pl });
        }
        if (t !== pl) hit(n > 1 ? 0.6 * n : 1);
        ev({ t: 'shoot', kind: 'enemy', x: e.x, z: e.z });
      }
    }
    e.facing = Math.atan2(dx, dz);
  }
  e.x += mx * sp * slow * (e.spd || 1) * dt; e.z += mz * sp * slow * (e.spd || 1) * dt;
  e.moveAmt = lerp(e.moveAmt || 0, sp > 0 ? 1 : 0, 1 - Math.exp(-dt * 10));
  e.attackAnim = Math.max(0, (e.attackAnim || 0) - dt * 3);
  trackVel(e, dt);
  if (pl.alive) separate(e, pl);
  for (const o of S.mobs) if (o !== e && o.alive) separate(e, o);
  siegeCollide(e); siegeClamp(e, e.r);
}
function siegeInteract(pl) {
  const S = G.siege, C = CFG.siege, near = (q, r) => Math.hypot(pl.x - SC.x - q.x, pl.z - SC.z - q.z) < r;
  if (G.fortPlace) { const P = G.fortPlace, T = C.towers[P.t]; return { kind: 'fortPlace', label: T.wall ? (P.draw ? `Stop drawing` : `Draw ${T.short.toLowerCase()}s`) : `Place ${T.short}` }; }
  if (near(C.exit, C.interactR)) return { kind: 'siegeLeave', label: 'Leave Fort' };
  let best = 1.4, hit = null;
  for (const u of S.units) { const d = Math.hypot(pl.x - u.x, pl.z - u.z) - u.r; if (d < best) { best = d; hit = u; } }
  if (hit) { const b = hit.b, T = C.towers[b.t], m = b.t === 'mine' ? fortMineStones(b) : 0;
    return { kind: 'fortB', k: S.units.indexOf(hit), label: m > 0 ? `Mine · take ${m}` : `${T.short}${T.maxLvl === 1 ? '' : ' Lv ' + b.l}${b.d > fortNow() ? ' · building' : ''}` }; }
  return { kind: 'fortBuild', label: S.phase === 'build' ? `Build · Wave ${S.wave}` : 'Build' };
}
function siegeLeft() { const S = G.siege; return S ? S.queue.length + S.mobs.filter((e) => e.alive).length : 0; }
function endSiege(why) {
  const S = G.siege; if (!S) return;
  if (typeof siegeMpEnd === 'function') siegeMpEnd(why);
  clearSiegeMobs(); clearProjectiles();
  G.siege = null; G.siegeObstacles = null; G.obstacles = G.hubObstacles; G.fortPlace = null;
  const F = fortState(); G.siegeWorld = null;
  const pl = G.player, p = G.profile, C = CFG.siege, out = { x: C.gate.x + 2, z: C.gate.z };
  if (why !== 'away') { pl.x = out.x; pl.z = out.z; }
  if (pl.alive) { pl.invulnT = 1; pl.hp = pl.maxHp; } else G.respawnAt = { x: pl.x, z: pl.z };
  G.zoneIdx = zoneAt(pl.z);
  const res = { why, wave: S.wave, next: F.wave || S.wave, cleared: S.cleared, held: S.held || 0, gold: S.gold, stones: S.stones, items: S.items, best: p.records.bestSiege || 0, x: pl.x, z: pl.z, code: S.code };
  G.siegeResult = res; G.dirty = true;
  ev(Object.assign({ t: 'siegeEnd' }, res));
}
// --- end siege
