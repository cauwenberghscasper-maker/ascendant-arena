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
  // build: the break between waves once the fort has been started (go); hold pauses it. Waves run on while you build
  firstBuild: 20, build: 20, clear: 2.5, spawnGap: 0.55, bossEvery: 10, miniFrom: 3, miniChance: 0.35, lvlBase: 18, lvlPer: 1.5, maxLvl: 15,
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
  // the camp pays for itself (Clash of Clans): wood from lumber mills, stone from stone mines, iron from iron mines (Keep 4).
  // Waves pay hero gold and items as before, plus some of each resource. Iron is asked from building level 6 on.
  res: ['wood', 'stones', 'iron'], resName: { wood: 'Wood', stones: 'Stone', iron: 'Iron' }, ironFrom: 6,
  pay: (n, boss, mini) => ({ wood: 6 + n + (boss ? 16 : 0) + (mini ? 6 : 0), stones: 3 + Math.floor(n / 2) + (boss ? 8 : 0) + (mini ? 4 : 0), iron: n >= 8 ? Math.floor((n - 5) / 3) + (boss ? 4 : 0) : 0 }),
  // The Keep has levels like a Town Hall: each one allows more buildings (towers[t].lim) and higher building levels (lvl)
  keep: { max: 10, lvl: [3, 4, 5, 7, 8, 9, 11, 12, 13, 15], hp: 0.15,
    cost: (k) => ({ wood: Math.round(30 * Math.pow(k, 1.9)), stones: Math.round(24 * Math.pow(k, 1.9)), iron: k >= 5 ? Math.round(8 * Math.pow(k - 3, 1.8)) : 0 }),
    time: (k) => Math.round(45 * Math.pow(k - 1, 2.2)) }, // Keep 2 in 45 s, Keep 10 in about 2 hours
  // Balloons TD side: from level 5 a tower picks one of two paths (b.p 1 or 2). Monsters with armour barely feel light shots
  // (archers, mage orbs, warriors); flyers cross walls and only towers with air can hit them
  pathAt: 5, armor: 0.2, armorFrom: 6, flyFrom: 8,
  flyers: ['hornet', 'echobat', 'dustharpy', 'flamewyrm'],
  // dmg × the reference hero's hit at your level, +30% per level; hp × reference hero HP at the wave level; path: how many
  // cells a monster walks around rather than break it. c: [wood, stone, iron] for level 1; lim: how many at Keep level 1..10.
  // make/rate/cap: what a producer digs per hour per level and holds per level
  towers: {
    archer: { name: 'Archer Tower', short: 'Archer', icon: 'b_arrow', range: 16, cd: 0.8, dmg: 0.55, speed: 30, color: 0xffe08a, c: [8, 4], hp: 8, light: true, air: true,
      lim: [2, 3, 3, 4, 4, 5, 5, 6, 6, 7], blurb: 'Fast arrows at one target, even flyers. Light: armour shrugs them off.' },
    cannon: { name: 'Cannon', short: 'Cannon', icon: 'a_bigshot', range: 13, cd: 2.4, dmg: 1.2, aoe: 2.8, fly: 0.9, color: 0x3a3a44, c: [6, 9], hp: 10,
      lim: [1, 2, 2, 3, 3, 4, 4, 5, 5, 6], blurb: 'Slow shells that blast a whole group and crack armour. Cannot hit flyers.' },
    ballista: { name: 'Ballista', short: 'Ballista', icon: 'n_pierce', range: 22, cd: 2.8, dmg: 2.4, pierce: 3, speed: 40, color: 0xbfe9ff, c: [11, 6], hp: 8, air: true,
      lim: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5], blurb: 'Huge bolts from far away that pierce a line of monsters, armour and flyers too.' },
    mage: { name: 'Mage Tower', short: 'Mage', icon: 'b_orb', range: 18, cd: 1.7, dmg: 0.9, aoe: 1.8, speed: 20, color: 0xb98cff, c: [8, 11], hp: 7, light: true, air: true,
      lim: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4], blurb: 'Arcane orbs that burst on a small group, flyers too. Light: weak on armour.' },
    warrior: { name: 'Barracks', short: 'Warriors', icon: 'b_wave', range: 6, cd: 1.0, dmg: 0.7, hp: 0.9, men: 2, respawn: 8, c: [10, 5], bhp: 10, light: true,
      lim: [1, 1, 2, 2, 2, 3, 3, 3, 4, 4], blurb: 'Warriors that block the path and fight monsters near their post. They cannot reach flyers.' },
    mill: { name: 'Lumber Mill', short: 'Mill', icon: 'm_smith', make: 'wood', rate: 14, cap: 56, c: [3, 6], hp: 8,
      lim: [1, 1, 2, 2, 2, 3, 3, 3, 3, 3], blurb: 'Saws wood, even while you are away. Tap it to collect.' },
    mine: { name: 'Stone Mine', short: 'Stone', icon: 'n_gems', make: 'stones', rate: 8, cap: 32, c: [8, 2], hp: 8,
      lim: [1, 1, 2, 2, 2, 3, 3, 3, 3, 3], blurb: 'Digs up stone, even while you are away. Tap it to collect.' },
    iron: { name: 'Iron Mine', short: 'Iron', icon: 'n_armor', make: 'iron', rate: 3, cap: 12, c: [12, 12], hp: 9,
      lim: [0, 0, 0, 1, 1, 2, 2, 2, 3, 3], blurb: 'Digs iron for level 6 and higher, even while you are away. Tap it to collect.' },
    hut: { name: "Builder's Hut", short: 'Builder', icon: 'm_smith', maxLvl: 1, each: true, c: [12, 8], hp: 8,
      lim: [2, 2, 3, 3, 3, 4, 4, 5, 5, 5], blurb: 'One builder each. More huts, more upgrades at the same time.' },
    wall: { name: 'Wall', short: 'Wall', icon: 'n_armor', c: [1, 0], hp: 5, path: 6, wall: true,
      lim: [30, 50, 75, 100, 130, 160, 200, 250, 300, 400], blurb: 'Drag a straight line of walls. Monsters must go round or break them; your heroes step over. Wood, stone from level 6, iron from level 11.' },
    gate: { name: 'Gate', short: 'Gate', icon: 'm_portal', c: [3, 1], hp: 5, path: 6, wall: true,
      lim: [2, 3, 4, 5, 6, 7, 8, 9, 10, 12], blurb: 'A sturdy door in your wall line that monsters have to break.' },
    // traps: monsters walk over them (they never block a path, flyers pass over); r: reach from the trap's centre
    spike: { name: 'Spike Trap', short: 'Spikes', icon: 'a_reaper', trap: true, r: 1.5, cd: 2.2, dmg: 1.4, c: [2, 2], hp: 1,
      lim: [2, 3, 4, 5, 6, 7, 8, 9, 10, 12], blurb: 'Spikes shoot up under every monster on it, then reset after a moment.' },
    bomb: { name: 'Powder Keg', short: 'Keg', icon: 'b_cluster', trap: true, r: 1.2, aoe: 3.6, dmg: 5, c: [3, 2], hp: 1,
      lim: [0, 1, 2, 2, 3, 3, 4, 4, 5, 6], blurb: 'Blows up a whole group once per wave. A new keg is in place for the next wave.' },
    tar: { name: 'Tar Pit', short: 'Tar', icon: 'k_grasp', trap: true, r: 1.7, slow: 0.4, dps: 0.25, c: [3, 1], hp: 1,
      lim: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5], blurb: 'Sticky tar: monsters crossing it move at half speed and slowly burn. Combine it with towers.' },
  },
  // the two paths per tower (from level pathAt): multipliers on range, cd, dmg, aoe; multi: targets per shot; plus extras
  paths: {
    archer: [{ name: 'Volley Tower', blurb: 'Three arrows at three monsters at once.', multi: 3, dmg: 0.75 },
      { name: 'Longbow Nest', blurb: 'Far, heavy arrows that punch through armour.', range: 1.45, dmg: 1.9, cd: 1.35, heavy: true }],
    cannon: [{ name: 'Mortar', blurb: 'Lobs shells much further, with a wider blast.', range: 1.7, aoe: 1.35, cd: 1.2, dmg: 1.1 },
      { name: 'Fire Cannon', blurb: 'Shells set the whole group on fire.', burn: 0.35, dmg: 0.9 }],
    ballista: [{ name: 'Repeater', blurb: 'Fires light bolts very fast.', cd: 0.4, dmg: 0.55, pierce: 1 },
      { name: 'Sky Piercer', blurb: 'Huge bolts through eight monsters; double damage to flyers.', dmg: 1.5, pierce: 8, range: 1.2, airMul: 2 }],
    mage: [{ name: 'Frost Spire', blurb: 'Orbs freeze a group to half speed.', slow: 1.6, dmg: 0.9 },
      { name: 'Storm Spire', blurb: 'Lightning jumps to three more monsters, armour or not.', chain: 3, dmg: 1.05, heavy: true }],
    warrior: [{ name: 'Shield Wall', blurb: 'One more warrior, all much tougher.', men: 1, hp: 1.9 },
      { name: 'Berserkers', blurb: 'Warriors hit far harder and faster, and cut through armour.', dmg: 1.8, cd: 0.7, heavy: true }],
  },
};
const SIEGE_TYPES = ['archer', 'cannon', 'ballista', 'mage', 'warrior', 'mill', 'mine', 'iron', 'hut', 'wall', 'gate', 'spike', 'bomb', 'tar'];
const SIEGE_SHOOTERS = { archer: 1, cannon: 1, ballista: 1, mage: 1 };
// where shots leave each defender (f: metres ahead of its centre toward the target, y: height) and how long it winds up first
const SIEGE_MUZZLE = { archer: { f: 0.7, y: 3.3, wind: 0.25 }, cannon: { f: 1.4, y: 1.0, wind: 0.5 }, ballista: { f: 1.1, y: 1.45, wind: 0.6 }, mage: { f: 0.3, y: 4.65, wind: 0.7 } }; // the buildings stand at 0.75 (SIEGE_SCALE)
const siegeLvlMul = (l) => 1 + 0.3 * (l - 1);
const siegeMen = (l, b) => Math.min(5, CFG.siege.towers.warrior.men + Math.floor(l / 5) + (b && fortPath(b) ? fortPath(b).men || 0 : 0));
const fortNow = () => Date.now();
// the fort on screen: a shared world while you are in one, else your own (wood, stone and iron are always your own)
function myFort() { const p = G.profile; if (!p.fort || !Array.isArray(p.fort.b)) p.fort = sanitizeFort(p.fort, true); return p.fort; }
function fortState() { return G.siegeWorld ? G.siegeWorld.fort : myFort(); }
const fortLvl = (b) => (b.d > fortNow() ? b.l - 1 : b.l); // an upgrade under way works at the old level
// the Keep's level (an upgrade under way counts from when it is done)
const fortKeep = (F = fortState()) => Math.max(1, (F.keep || 1) - (F.kd > fortNow() ? 1 : 0));
const fortMaxLvl = (t, F = fortState()) => Math.min(CFG.siege.towers[t].maxLvl || CFG.siege.maxLvl, CFG.siege.keep.lvl[fortKeep(F) - 1]);
// how many of type t the Keep allows, and the first Keep level that allows one more than have
const fortLimit = (t, F = fortState()) => { const L = CFG.siege.towers[t].lim; return L ? L[fortKeep(F) - 1] : Infinity; };
const fortLimitAt = (t, have) => { const L = CFG.siege.towers[t].lim; const k = L ? L.findIndex((n) => n > have) : 0; return k < 0 ? 0 : k + 1; };
const fortCount = (t, F = fortState()) => F.b.reduce((n, b) => n + (b.t === t), 0);
// the path a tower took (from level pathAt, once that upgrade is done), or null
const fortPath = (b) => (b.p && CFG.siege.paths[b.t] && fortLvl(b) >= CFG.siege.pathAt ? CFG.siege.paths[b.t][b.p - 1] : null);
const fortNeedsPath = (b) => !!CFG.siege.paths[b.t] && !b.p && b.l + 1 >= CFG.siege.pathAt;
const landFor = (L) => { const [a, b, l0, l1] = CFG.siege.land; return Math.round(lerp(a, b, clamp((L - l0) / (l1 - l0), 0, 1))); };
// price of level l of type t in wood, stone and iron; huts get dearer with every hut you have
function fortCost(t, l, F = fortState()) {
  const T = CFG.siege.towers[t], k = T.each ? 1 + fortCount(t, F) : 1, m = Math.pow(l, 1.35) * k, c = T.c;
  const iron = Math.round((c[2] || 0) * m + (l >= CFG.siege.ironFrom ? (c[0] + c[1]) * 0.25 * Math.pow(l - CFG.siege.ironFrom + 1, 1.35) * k : 0));
  return { lvl: l, wood: Math.round(c[0] * m), stones: Math.round(c[1] * m), iron, time: CFG.siege.buildTime(l) };
}
// everything a building cost to get where it is (half comes back when it is torn down)
function fortSpent(b) { const r = { wood: 0, stones: 0, iron: 0 }; for (let k = 1; k <= b.l; k++) { const c = fortCost(b.t, k, { b: [] }); for (const q of CFG.siege.res) r[q] += c[q]; } return r; }
const fortBuilders = (F = fortState()) => fortCount('hut', F);
const fortJobs = (F = fortState()) => { const now = fortNow(); return F.b.filter((b) => b.d > now).length + (F.kd > now ? 1 : 0); };
// what a mill or mine holds now (it fills from b.c, the last time it was emptied)
function fortMade(b) { const T = CFG.siege.towers[b.t]; if (!T.make) return 0; return Math.min(T.cap * b.l, Math.floor((fortNow() - (b.c || fortNow())) / 3600e3 * T.rate * b.l)); }
const fortHas = (pr, M = myFort()) => CFG.siege.res.every((q) => (pr[q] || 0) <= (M[q] || 0));
const fortShort = (pr, M = myFort()) => CFG.siege.res.find((q) => (pr[q] || 0) > (M[q] || 0));
// armour and flyers (Balloons TD): what a defender's hit does to this monster (1 = all of it, 0 = it cannot reach it)
function siegeDmgMul(t, srcId) {
  const S = G.siege; if (!S || !S.src || !(t.siegeArmor || t.flying)) return 1;
  const q = S.src.get(srcId); if (!q) return 1;
  if (t.flying && !q.air) return 0;
  return (t.flying && q.airMul ? q.airMul : 1) * (t.siegeArmor && q.light ? CFG.siege.armor : 1);
}
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
function siegeUnitHp(u) { const T = CFG.siege.towers[u.b.t], k = u.maxHp ? u.hp / u.maxHp : 1; u.maxHp = Math.round(refHp(G.siege.lvl) * (T.bhp || T.hp) * siegeLvlMul(Math.max(1, fortLvl(u.b)))); u.hp = u.alive ? Math.max(1, Math.round(k * u.maxHp)) : 0; u.st = siegeStats(u.b); if (G.siege.src) G.siege.src.set(u.id, u.st); }
// a defender's numbers with its path on top (range, cd, dmg and aoe multiply; the rest adds or replaces)
function siegeStats(b) {
  const T = CFG.siege.towers[b.t], P = fortPath(b); if (!P) return T;
  const o = Object.assign({}, T, { path: P });
  for (const k of ['range', 'cd', 'dmg', 'aoe']) if (P[k] && T[k]) o[k] = T[k] * P[k];
  if (P.heavy) o.light = false; if (P.pierce) o.pierce = P.pierce; if (P.hp) o.hp = T.hp * P.hp;
  for (const k of ['multi', 'burn', 'slow', 'chain', 'airMul']) if (P[k]) o[k] = P[k];
  return o;
}
// rebuilt whenever the fort changes or a building falls: cells, units (their state kept), solid circles and the monsters' paths
function siegeLayout() {
  const S = G.siege, F = fortState(), cs = CFG.siege.cell, h = S.h = Math.ceil(S.half / cs), n = S.n = h * 2;
  const occ = S.occ = new Int32Array(n * n), old = new Map(S.units.map((u) => [u.b, u]));
  S.src = new Map(); // who hit a monster: a defender's stats by its id (siegeDmgMul)
  const disc = (x, z, r, v) => { for (let i = cellAt(x - r); i <= cellAt(x + r); i++) for (let j = cellAt(z - r); j <= cellAt(z + r); j++) { const k = siegeIdx(i, j); if (k >= 0 && Math.hypot((i + 0.5) * cs - x, (j + 0.5) * cs - z) < r + cs * 0.35) occ[k] = v; } };
  for (const q of [CFG.siege.spawn, CFG.siege.exit]) disc(q.x, q.z, 1.6, -2);
  for (const d of CFG.siege.objs) disc(d.x, d.z, d.r, -1);
  S.units = [];
  for (const b of F.b) {
    const s = FORT_TYPES[b.t], ks = [];
    for (let i = 0; i < s; i++) for (let j = 0; j < s; j++) ks.push(siegeIdx(b.x + i, b.z + j));
    if (ks.some((k) => k < 0 || occ[k] !== 0)) continue; // outside the land or on the Keep (a shrunk or edited world): not built here
    let u = old.get(b); if (u && (u.bx !== b.x || u.bz !== b.z)) u = null; // moved: a new unit where it stands now
    if (!u) { u = siegeUnit(b); u.bx = b.x; u.bz = b.z; } u.k = S.units.length; S.units.push(u); ks.forEach((k) => { occ[k] = u.k + 1; });
    if (!u.maxHp) siegeUnitHp(u); else S.src.set(u.id, u.st);
  }
  // the monster gate on each side (a gatehouse, 47c-siege-view.js): kept clear of new buildings
  for (const d of CFG.siege.sides) { const gx = d.x * (S.half - 3), gz = d.z * (S.half - 3); for (let i = cellAt(gx - 4.5); i <= cellAt(gx + 4.5); i++) for (let j = cellAt(gz - 4.5); j <= cellAt(gz + 4.5); j++) { const k = siegeIdx(i, j); if (k >= 0 && occ[k] === 0) occ[k] = -2; } }
  S.soldiers = S.soldiers.filter((s) => old.get(s.u.b) === s.u && S.units.includes(s.u));
  for (const u of S.units) if (u.b.t === 'warrior' && !S.soldiers.some((s) => s.u === u)) siegeMuster(u);
  for (const q of S.soldiers) S.src.set(q.id, q.u.st);
  siegeGrid(); S.flowDirty = true;
}
// keep, wagons and living buildings are solid; walls and gates only for monsters, so heroes never get boxed in by their
// own walls and shoot over them (rebuilt as a whole: the Grid has no remove)
function siegeGrid() {
  const S = G.siege, a = new Grid(6), m = new Grid(6);
  for (const o of S.objs) if (o.alive) { const c = { x: o.x, z: o.z, r: o.r }; a.add(c); m.add(c); }
  for (const u of S.units) if (u.alive && !CFG.siege.towers[u.b.t].trap) { const c = { x: u.x, z: u.z, r: u.r }; m.add(c); if (!CFG.siege.towers[u.b.t].wall) a.add(c); }
  S.mobGrid = m; G.siegeObstacles = a; G.obstacles = a; return a;
}
// the monsters' map: walking cost from every cell to the nearest living objective. A building costs its path value to
// cross (monsters break it), so they walk around walls while that is cheaper and break the cheapest one when it is not.
function siegeCellCost(k) { const S = G.siege, o = S.occ[k]; if (o === -1) return Infinity; if (o <= 0) return 1; const u = S.units[o - 1]; if (!u.alive) return 1; const T = CFG.siege.towers[u.b.t]; return T.trap ? 1 : T.path ? T.path + fortLvl(u.b) : 30; }
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
  const o = S.occ[bk]; if (o > 0 && S.units[o - 1].alive && !CFG.siege.towers[S.units[o - 1].b.t].trap) return S.units[o - 1];
  const bi = bk % n - S.h, bj = (bk - bk % n) / n - S.h;
  return { x: SC.x + (bi + 0.5) * cs, z: SC.z + (bj + 0.5) * cs, far: S.dist[k] > 30 };
}

// --- building: the same checks and changes for your own fort and for a shared world's host (op from fortDo or a guest)
// op: { o: 'add', t, x, z } | { o: 'up', k, p } | { o: 'del', k } | { o: 'col', k } | { o: 'move', k, x, z } | { o: 'keep' } | { o: 'hold', v }
// (k = index in the fort's building list; p = the path picked on the upgrade to level pathAt)
function fortCheck(op, F = fortState()) {
  const S = G.siege; if (!S || !S.occ) return 'Only inside the fort';
  const C = CFG.siege, now = fortNow();
  if (op.o === 'hold') return '';
  if (op.o === 'keep') {
    if ((F.keep || 1) >= C.keep.max) return 'Max level'; if (F.kd > now) return 'Already upgrading';
    if (fortJobs(F) >= fortBuilders(F)) return 'All builders are busy'; return '';
  }
  if (op.o === 'add') {
    const T = C.towers[op.t]; if (!T) return 'Unknown building';
    const have = fortCount(op.t, F), lim = fortLimit(op.t, F);
    if (have >= lim) { const k = fortLimitAt(op.t, have); return k ? `Keep level ${k} allows ${lim ? 'more' : 'this'}` : `${lim} ${T.short}s at most`; }
    const s = FORT_TYPES[op.t];
    for (let i = 0; i < s; i++) for (let j = 0; j < s; j++) { const k = siegeIdx(op.x + i, op.z + j); if (k < 0) return 'Outside your land'; if (S.occ[k] !== 0) return 'Something is in the way'; }
    for (const e of S.mobs) if (e.alive && !e.flying && Math.abs(e.x - SC.x - (op.x + s / 2) * C.cell) < s + 0.5 && Math.abs(e.z - SC.z - (op.z + s / 2) * C.cell) < s + 0.5) return 'A monster is in the way';
    return '';
  }
  const b = F.b[op.k]; if (!b) return 'Gone';
  if (op.o === 'move') { // its own cells count as free
    const s = FORT_TYPES[b.t], u = S.units.find((q) => q.b === b), own = u ? u.k + 1 : -9;
    for (let i = 0; i < s; i++) for (let j = 0; j < s; j++) { const k = siegeIdx(op.x + i, op.z + j); if (k < 0) return 'Outside your land'; if (S.occ[k] !== 0 && S.occ[k] !== own) return 'Something is in the way'; }
    return '';
  }
  if (op.o === 'up') {
    if (b.l >= (C.towers[b.t].maxLvl || C.maxLvl)) return 'Max level';
    if (b.l >= fortMaxLvl(b.t, F)) return `Upgrade the Keep first (level ${b.l + 1} needs Keep ${C.keep.lvl.findIndex((m) => m > b.l) + 1})`;
    if (b.d > now) return 'Already upgrading';
    if (fortNeedsPath(b) && op.p !== 1 && op.p !== 2) return 'Pick a path';
    if (C.buildTime(b.l + 1) > 0 && fortJobs(F) >= fortBuilders(F)) return 'All builders are busy';
  }
  if (op.o === 'del' && b.t === 'hut' && fortBuilders(F) <= 1) return 'Your last builder stays';
  if (op.o === 'col' && !C.towers[b.t].make) return 'Nothing to collect';
  return '';
}
// what op costs this player in wood, stone and iron (negative = paid back or collected)
function fortPrice(op, F = fortState()) {
  const none = { wood: 0, stones: 0, iron: 0 }, neg = (r) => ({ wood: -r.wood, stones: -r.stones, iron: -r.iron });
  if (op.o === 'add') return fortCost(op.t, 1, F);
  if (op.o === 'keep') return CFG.siege.keep.cost((F.keep || 1) + 1);
  if (op.o === 'hold') return none;
  const b = F.b[op.k];
  if (op.o === 'up') return fortCost(b.t, b.l + 1, F);
  if (op.o === 'del') { const r = fortSpent(b); for (const q in r) r[q] = Math.floor(r[q] / 2); return neg(r); }
  if (op.o === 'move') return none;
  const r = Object.assign({}, none); r[CFG.siege.towers[b.t].make] = fortMade(b); return neg(r);
}
function fortPay(pr, sign = 1) { const M = myFort(); for (const q of CFG.siege.res) M[q] = Math.max(0, (M[q] || 0) - sign * (pr[q] || 0)); G.dirty = true; }
// change the fort (no payment here); returns '' or why not
function fortApply(op, F = fortState()) {
  const why = fortCheck(op, F); if (why) return why;
  const C = CFG.siege, now = fortNow();
  if (op.o === 'hold') { F.hold = op.v ? 1 : 0; fortChanged(F); return ''; }
  if (op.o === 'keep') {
    F.keep = (F.keep || 1) + 1; F.kd = now + C.keep.time(F.keep) * 1000;
    const o = G.siege.objs[0]; ev({ t: 'fortBuilt', type: 'keep', l: F.keep, x: o.x, z: o.z }); fortChanged(F); return '';
  }
  let b;
  if (op.o === 'add') { b = { t: op.t, x: op.x, z: op.z, l: 1 }; if (C.towers[op.t].make) b.c = now; F.b.push(b); }
  else if (op.o === 'up') { b = F.b[op.k]; b.l++; if (op.p && !b.p && C.paths[b.t]) b.p = op.p; const t = C.buildTime(b.l); if (t > 0) b.d = now + t * 1000; }
  else if (op.o === 'del') { b = F.b.splice(op.k, 1)[0]; }
  else if (op.o === 'move') { b = F.b[op.k]; b.x = op.x; b.z = op.z; }
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
  const pr = fortPrice(op, F), short = fortShort(pr);
  if (short) return `Not enough ${CFG.siege.resName[short].toLowerCase()}`;
  if (typeof siegeFollowing === 'function' && siegeFollowing()) { fortPay(pr); siegeMpAsk(op, pr); return ''; }
  const r = fortApply(op, F); if (!r) fortPay(pr); return r;
}
// the ghosts while building (75-siege-builder.js): the picked cell, or every piece of a wall line being dragged, each
// checked as it would be placed or moved
function fortGhosts() {
  const B = G.builder, S = G.siege; if (!B || !S || !B.sel) return null;
  if (B.line) return B.line.plan;
  if (!B.cell) return null;
  const F = fortState(), op = B.move ? { o: 'move', k: F.b.indexOf(B.move), x: B.cell[0], z: B.cell[1] } : { o: 'add', t: B.sel, x: B.cell[0], z: B.cell[1] };
  return [{ t: B.sel, x: op.x, z: op.z, ok: !fortCheck(op, F) && fortHas(fortPrice(op, F)), op }];
}
// --- runtime
// warriors of a barracks: spawned around their post, back after a while when they fall
function siegeMuster(u) {
  const S = G.siege, T = u.st || CFG.siege.towers.warrior, l = Math.max(1, fortLvl(u.b));
  S.soldiers = S.soldiers.filter((s) => s.u !== u);
  for (let k = 0, n = siegeMen(l, u.b); k < n; k++) {
    const a = (k / n) * Math.PI * 2, hx = u.x + Math.sin(a) * 2.6, hz = u.z + Math.cos(a) * 2.6;
    const s = { id: nextId++, kind: 'soldier', u, team: 'ally', x: hx, z: hz, hx, hz, r: 0.55, facing: 0, moveAmt: 0, attackAnim: 0, flashT: 0, alive: true, atkCd: rand(0, T.cd), respawnT: 0 };
    s.maxHp = s.hp = Math.round(refHp(G.profile.level) * T.hp * siegeLvlMul(l));
    S.soldiers.push(s); if (S.src) S.src.set(s.id, T);
  }
}
function siegeScaleObjs(lvl) {
  const kp = 1 + CFG.siege.keep.hp * (fortKeep() - 1); // every Keep level makes the Keep and the wagons sturdier
  for (const o of G.siege.objs) { const k = o.maxHp ? o.hp / o.maxHp : 1; o.maxHp = Math.round(refHp(lvl) * o.def.mult * kp); o.hp = o.alive ? Math.max(1, Math.round(k * o.maxHp)) : 0; }
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
  const S = G.siege = { wave: F.wave || 1, phase: 'build', t: C.firstBuild, tMax: C.firstBuild, queue: [], wood: 0, iron: 0, spawnT: 0, mobs: [], soldiers: [], units: [], lvl: 0, code: world ? world.code : null,
    half: Math.max(C.land[0], F.land || 0), sides: [], sideI: 0, gold: 0, stones: 0, items: 0, cleared: 0, startWave: F.wave || 1, kills: 0, enterPos: { x: pl.x, z: pl.z },
    objs: C.objs.map((d) => ({ def: d, kind: 'objective', name: d.name, x: SC.x + d.x, z: SC.z + d.z, r: d.r, alive: true, hp: 1, maxHp: 0, flashT: 0, hurtT: 0 })) };
  S.lvl = siegeLevel(S.wave); siegeLayout(); siegeScaleObjs(S.lvl); S.sides = siegeSides(S.wave);
  if (S.code && typeof siegeMpStart === 'function') siegeMpStart();
  clearProjectiles();
  pl.x = SC.x + C.spawn.x; pl.z = SC.z + C.spawn.z; pl.facing = 0; pl.hp = pl.maxHp; pl.invulnT = 1.5; pl.ammo = pl.ammoMax;
  ev({ t: 'siegeStart', x: pl.x, z: pl.z, best: p.records.bestSiege || 0, wave: S.wave }); return true;
}
function siegeComposition(n) {
  const C = CFG.siege, boss = n % C.bossEvery === 0, count = Math.min(40, 5 + Math.round(n * 1.6)), elites = Math.min(8, Math.floor(n / 3));
  // armoured monsters from wave armorFrom, flyers from flyFrom: a share that grows to 30% each
  const armored = n >= C.armorFrom ? Math.round(count * Math.min(0.3, 0.1 + (n - C.armorFrom) * 0.01)) : 0, flyers = n >= C.flyFrom ? Math.round(count * Math.min(0.3, 0.1 + (n - C.flyFrom) * 0.01)) : 0;
  const k = boss ? 0.6 : 1;
  return { boss, count: Math.ceil(count * k), elites, armored: Math.round(armored * k), flyers: Math.round(flyers * k) };
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
  const FL = CFG.siege.flyers, fly = FL[Math.floor((n - 1) / 10) % FL.length];
  for (let k = 0; k < C.count; k++) {
    const f = k >= C.count - C.flyers, a = !f && k >= C.count - C.flyers - C.armored;
    S.queue.push({ type: f ? fly : Math.random() < 0.5 ? Z.enemy : (Z.alt || Z.enemy), zi, elite: k < C.elites, armor: a, fly: f });
  }
  S.queue.sort(() => Math.random() - 0.5);
  S.mini = !C.boss && n >= CFG.siege.miniFrom && Math.random() < CFG.siege.miniChance;
  if (S.mini) S.queue.splice(Math.floor(S.queue.length / 2), 0, { type: Z.alt || Z.enemy, zi, mini: true });
  if (C.boss) S.queue.push({ type: Z.enemy, zi, boss: true });
  S.phase = 'fight'; S.spawnT = 0.4; S.sideI = 0;
  const F = fortState(); if (!F.go) { F.go = 1; fortChanged(F); } // from now on the next waves come by themselves
  ev({ t: 'siegeWave', wave: n, lvl: S.lvl, boss: C.boss, mini: S.mini, count: S.queue.length, theme: Z.name, sides: siegeSideNames(S.sides), armored: C.armored, flyers: C.flyers });
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
  if (q.armor) { e.siegeArmor = true; e.maxHp = e.hp = Math.round(e.maxHp * 1.3); }
  if (q.fly) e.flying = true;
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
  const pay = C.pay(n, boss, mini), M = myFort(); for (const q of C.res) { M[q] = (M[q] || 0) + pay[q]; S[q] = (S[q] || 0) + pay[q]; }
  if (p.level < P.cap) addXp(Math.round(xpToNext(p.level) * Math.min(0.2, 0.05 * (1 + n / 10))), 'dungeon');
  let item = null;
  if (boss) { item = makeItem(pick(CFG.gear.slots), riftRarity(n), lvl); grantItem(item, 'shrine'); S.items++; addEssence(2 + Math.floor(n / 5)); }
  if (n > (p.records.bestSiege || 0)) p.records.bestSiege = n;
  S.cleared = Math.max(S.cleared, n); S.held = (S.held || 0) + 1; addMastery('w:' + G.player.attackId, 15 + n * 3);
  checkAchievements(); G.dirty = true;
  ev({ t: 'siegeClear', wave: n, gold, wood: pay.wood, stones: pay.stones, iron: pay.iron, item: !!item, wagons });
}
function siegeWaveClear() {
  const S = G.siege, n = S.wave, C = CFG.siege, F = fortState(), wagons = S.objs.filter((o) => !o.def.main && o.alive).length;
  siegeReward(n, S.lvl, wagons, S.mini);
  if (typeof siegeMpCleared === 'function') siegeMpCleared(n, S.lvl, wagons, S.mini);
  for (const o of S.objs) if (o.alive) o.hp = Math.min(o.maxHp, Math.round(o.hp + o.maxHp * C.heal));
  // fallen buildings stand again for the next wave; the fort never goes back below a wave it held
  let fell = false; for (const u of S.units) { if (!u.alive) fell = true; u.alive = true; u.hp = u.maxHp; u.spent = false; } // fallen buildings stand again, kegs are refilled
  if (fell) { siegeGrid(); S.flowDirty = true; }
  F.wave = Math.max(F.wave || 1, n + 1); fortChanged(F);
}
const siegeAlone = () => !G.siege.code || typeof siegeMpPeers !== 'function' || !siegeMpPeers().length;
function stepSiege(dt) {
  const S = G.siege, pl = G.player, C = CFG.siege;
  // carried out of the fort by anything else (waypoint travel): close it where you stand
  if (Math.hypot(pl.x - SC.x, pl.z - SC.z) > S.half * 1.5 + 60) { endSiege('away'); return; }
  if (!pl.alive) G.respawnAt = { x: SC.x + C.spawn.x, z: SC.z + C.spawn.z }; // a fall costs a few seconds, not the run
  // upgrades finishing: the building's stats and the monsters' paths follow
  const now = fortNow(); let done = false;
  for (const u of S.units) if (u.b.d && u.b.d <= now) { delete u.b.d; siegeUnitHp(u); if (u.b.t === 'warrior') siegeMuster(u); done = true; ev({ t: 'fortBuilt', type: u.b.t, l: u.b.l, x: u.x, z: u.z, done: true }); }
  const F = fortState();
  if (F.kd && F.kd <= now) { delete F.kd; done = true; siegeScaleObjs(S.lvl); ev({ t: 'fortBuilt', type: 'keep', l: F.keep, x: S.objs[0].x, z: S.objs[0].z, done: true }); }
  if (done) { S.flowDirty = true; fortChanged(F); }
  if (typeof siegeMpStep === 'function' && siegeMpStep(dt)) return; // a guest mirrors the host's fort
  if (G.modal && siegeAlone()) return; // the fort holds still in a menu while nobody else is in it (builder mode runs on)
  for (const o of S.objs) { o.flashT -= dt; o.hurtT -= dt; }
  stepSiegeDefenders(dt);
  // the break: counts down once the fort has been started (until then, and while on hold, it waits for Start)
  if (S.phase === 'build') { if (F.go && !F.hold) { S.t -= dt; if (S.t <= 0) startSiegeWave(); } }
  else if (S.phase === 'fight') {
    if (S.queue.length && (S.spawnT -= dt) <= 0) { S.spawnT = C.spawnGap; spawnSiegeMob(S.queue.shift()); }
    if (!S.queue.length && !S.mobs.some((e) => e.alive)) { siegeWaveClear(); S.phase = 'clear'; S.t = S.tMax = C.clear; }
  } else if (S.phase === 'clear' && (S.t -= dt) <= 0) { clearSiegeMobs(); S.wave++; S.phase = 'build'; S.t = S.tMax = C.build; S.sides = siegeSides(S.wave); }
}
// --- defenders: towers pick the nearest monster in range (flyers only for towers with air); warriors hold a ring around their post
// ghost: a guest's towers only draw their shots (the host's game deals the damage)
function siegeNearestMob(x, z, range, air, skip) {
  let best = null, bd = range;
  for (const e of G.siege.mobs) if (e.alive && !e.hidden && (air || !e.flying) && (!skip || !skip.includes(e))) { const d = Math.hypot(e.x - x, e.z - z); if (d < bd) { bd = d; best = e; } }
  return best;
}
function stepSiegeDefenders(dt, ghost) {
  const S = G.siege;
  for (const u of S.units) {
    u.flashT -= dt; u.hurtT -= dt;
    const t = u.b.t, l = fortLvl(u.b); if (!u.alive || !SIEGE_SHOOTERS[t] || l < 1) continue;
    const T = u.st || CFG.siege.towers[t]; if ((u.cd -= dt) > 0) continue;
    const e = siegeNearestMob(u.x, u.z, T.range, T.air); if (!e) { u.cd = 0.15; continue; }
    u.cd = T.cd; u.aim = Math.atan2(e.x - u.x, e.z - u.z); u.fireT = G.time;
    // shots leave from the model: the archers' platform, the cannon's muzzle, the ballista's rail, the mage tower's orb
    const M = SIEGE_MUZZLE[t], dmg = ghost ? 0 : siegeDefDmg(T, l), sx = Math.sin(u.aim), sz = Math.cos(u.aim), ox = u.x + sx * M.f, oz = u.z + sz * M.f, team = ghost ? 'ghost' : 'ally';
    if (t === 'cannon') {
      // a lobbed shell lands where the target will be (a fire cannon's shell sets the group burning)
      const tx = e.x + (e.vx || 0) * T.fly, tz = e.z + (e.vz || 0) * T.fly, fly = T.fly * (T.range > 14 ? 1.3 : 1);
      spawnProjectile({ x: ox, z: oz, vx: (tx - ox) / fly, vz: (tz - oz) / fly, life: fly, r: 0.45, dmg, team, owner: u.id, kind: 'shell', color: T.burn ? 0xff7a2a : T.color, y: M.y, lob: true, lobH: T.range > 14 ? 4 : 2.4, aoe: T.aoe, aoeMult: 1, knock: 4, ghost,
        burn: T.burn ? dmg * T.burn : 0, burnT: T.burn ? 3 : 0 });
    } else {
      // a volley tower shoots at several monsters at once
      const tg = [e]; for (let n = 1; n < (T.multi || 1); n++) { const q = siegeNearestMob(u.x, u.z, T.range, T.air, tg); if (q) tg.push(q); else break; }
      for (const q of tg) {
        const tt = Math.hypot(q.x - ox, q.z - oz) / T.speed, a = Math.atan2(q.x + (q.vx || 0) * tt - ox, q.z + (q.vz || 0) * tt - oz);
        spawnProjectile({ x: ox, z: oz, vx: Math.sin(a) * T.speed, vz: Math.cos(a) * T.speed, life: (T.range + 3) / T.speed, r: t === 'archer' ? 0.3 : 0.5, dmg, team, owner: u.id,
          kind: t === 'ballista' ? 'rail' : t === 'mage' ? 'orb' : 'arrow', color: T.slow ? 0x9fe8ff : T.chain ? 0xfff27a : T.color, y: q.flying ? 2.6 : M.y, pierce: T.pierce || 0, aoe: T.aoe || 0, aoeMult: T.aoe ? 0.6 : 0,
          knock: t === 'ballista' ? 5 : 1.5, ghost, slow: T.slow || 0, chain: T.chain || 0 });
      }
    }
    ev({ t: 'fortShot', type: t, x: ox, z: oz, y: M.y, a: u.aim, path: u.b.p && T.path ? u.b.p : 0 });
  }
  stepSiegeTraps(dt, ghost);
  for (const s of S.soldiers) {
    const W = s.u.st || CFG.siege.towers.warrior;
    s.flashT -= dt; s.attackAnim = Math.max(0, s.attackAnim - dt * 3);
    if (!s.alive) { if ((s.respawnT -= dt) <= 0 && s.u.alive) { s.alive = true; s.hp = s.maxHp; s.x = s.hx; s.z = s.hz; } continue; }
    const e = siegeNearestMob(s.hx, s.hz, W.range, false);
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
// traps: spikes hit everything on them and reset; a keg blows once per wave (u.spent until the wave is held); tar slows
function stepSiegeTraps(dt, ghost) {
  const S = G.siege;
  for (const u of S.units) {
    const T = CFG.siege.towers[u.b.t]; if (!T.trap || !u.alive || u.spent) continue;
    if (u.b.t === 'tar') { // slows everything in it; burns a little every half second, more with each level
      const tick = (u.cd -= dt) <= 0; if (tick) u.cd = 0.5;
      for (const e of S.mobs) if (e.alive && !e.flying && Math.hypot(e.x - u.x, e.z - u.z) < T.r + e.r * 0.5) { e.slowT = Math.max(e.slowT || 0, T.slow); u.busy = G.time; if (tick && !ghost) dealDamage(e, refDmg(G.profile.level) * T.dps * 0.5 * siegeLvlMul(Math.max(1, fortLvl(u.b))), u.id, { knock: 0 }); }
      continue; }
    if ((u.cd -= dt) > 0) continue;
    const on = S.mobs.filter((e) => e.alive && !e.flying && Math.hypot(e.x - u.x, e.z - u.z) < T.r + e.r * 0.5); if (!on.length) { u.cd = 0.1; continue; }
    const l = Math.max(1, fortLvl(u.b)), dmg = ghost ? 0 : refDmg(G.profile.level) * T.dmg * siegeLvlMul(l);
    u.fireT = G.time;
    if (u.b.t === 'bomb') {
      u.spent = true;
      if (!ghost) for (const e of S.mobs) if (e.alive && !e.flying && Math.hypot(e.x - u.x, e.z - u.z) < T.aoe) dealDamage(e, dmg * (1 - 0.4 * Math.hypot(e.x - u.x, e.z - u.z) / T.aoe), u.id, { knockX: e.x - u.x, knockZ: e.z - u.z, knock: 7 });
      ev({ t: 'fortTrap', type: 'bomb', x: u.x, z: u.z, r: T.aoe });
    } else {
      u.cd = T.cd;
      if (!ghost) for (const e of on) dealDamage(e, dmg, u.id, { knock: 0 });
      ev({ t: 'fortTrap', type: 'spike', x: u.x, z: u.z });
    }
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
  let best = null, bd = e.flying ? 0 : 5; // flyers pass over the warriors
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
  if ((G.modal && siegeAlone()) || G.menuSafe > 0) { e.moveAmt = Math.max(0, (e.moveAmt || 0) - dt * 3); return; }
  if (HeroSupers.tickStatus(e, dt)) { e.flashT -= dt; e.slowT -= dt; tickBurn(e, dt); e.moveAmt = 0; return; }
  const d = CFG.enemies[e.type], pl = G.player;
  e.atkCd -= dt; e.flashT -= dt; e.slowT -= dt; e.lungeT -= dt; e.lungeCd -= dt;
  tickBurn(e, dt); if (!e.alive) return;
  if ((e.tgtT -= dt) <= 0 || !e.tgt || !e.tgt.alive) { e.tgt = siegeTarget(e); e.tgtT = 0.5; }
  let t = e.tgt, way = null;
  if (!t && e.flying) { let bd = Infinity; for (const o of S.objs) if (o.alive) { const q = Math.hypot(o.x - e.x, o.z - e.z) - o.r; if (q < bd) { bd = q; t = o; } } } // flyers cross walls straight to the fort
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
  for (const o of S.mobs) if (o !== e && o.alive && !!o.flying === !!e.flying) separate(e, o);
  if (!e.flying) siegeCollide(e); siegeClamp(e, e.r);
}
function siegeInteract(pl) {
  const S = G.siege, C = CFG.siege, near = (q, r) => Math.hypot(pl.x - SC.x - q.x, pl.z - SC.z - q.z) < r;
  if (near(C.exit, C.interactR)) return { kind: 'siegeLeave', label: 'Leave Fort' };
  const kp = C.objs[0]; if (near(kp, kp.r + 1.6)) return { kind: 'fortKeep', label: `The Keep · Lv ${fortState().keep || 1}` };
  let best = 1.4, hit = null;
  for (const u of S.units) { const T = C.towers[u.b.t]; if ((T.wall || T.trap) && !fortMade(u.b)) continue; // walls and traps you tweak in builder mode; walking past them keeps Build on the button
    const d = Math.hypot(pl.x - u.x, pl.z - u.z) - u.r; if (d < best) { best = d; hit = u; } }
  if (hit) { const b = hit.b, T = C.towers[b.t], m = fortMade(b);
    return { kind: 'fortB', k: S.units.indexOf(hit), label: m > 0 ? `${T.short} · take ${m} ${C.resName[T.make].toLowerCase()}` : `${T.short}${T.maxLvl === 1 ? '' : ' Lv ' + b.l}${b.d > fortNow() ? ' · building' : ''}` }; }
  return { kind: 'fortBuild', label: 'Build' };
}
function siegeLeft() { const S = G.siege; return S ? S.queue.length + S.mobs.filter((e) => e.alive).length : 0; }
function endSiege(why) {
  const S = G.siege; if (!S) return;
  if (typeof siegeMpEnd === 'function') siegeMpEnd(why);
  clearSiegeMobs(); clearProjectiles();
  G.siege = null; G.siegeObstacles = null; G.obstacles = G.hubObstacles;
  if (G.builder && typeof closeBuilder === 'function') closeBuilder();
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
