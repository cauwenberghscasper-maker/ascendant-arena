// Bastion Siege: the real fort, wave, defender and objective code from index.html (no browser).
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let seed = 2610, passed = 0;
const math = Object.create(Math); math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const events = [], shots = [], grants = { items: [], gems: 0, xp: 0, gold: 0 };
const c = { Math: math, console, Sfx: { play() {} }, mobRemoteStep() {}, LOCAL_PREVIEW: true, TEST_MODE: false, nextId: 1, G: {},
  ev: (e) => events.push(e), tickBurn() {}, markCombat() {}, trackVel() {}, clearProjectiles() {}, toast() {}, checkAchievements() {}, addMastery() {}, spawnProjectile: (o) => { shots.push(o); if (o.team === 'ally') allyHit(o); return o; },
  dealDamage: (t, amt) => { t.hp -= amt; if (t.hp <= 0) t.alive = false; return amt; },
  xpToNext: () => 1000, addXp: (n) => { grants.xp += n; }, addGold: (n) => { grants.gold += n; c.G.profile.gold += n; }, rollLoot: () => 'common', rarIdx: () => 0,
  makeItem: (slot, rarity, ilvl) => ({ slot, rarity, ilvl }), grantItem: (it) => grants.items.push(it), addEssence: (n) => { grants.gems += n; }, dropShards() {}, addCase() {} };
c.HeroSupers = { tickStatus: () => false, modDamage: (s, t, a) => a, step() {}, clear() {}, marked: [] };
// tower shots land at once on the monster nearest their flight path end (projectile flight is browser-side)
function allyHit(o) {
  const tx = o.x + o.vx * o.life, tz = o.z + o.vz * o.life, mobs = c.G.siege ? c.G.siege.mobs.filter((e) => e.alive) : [];
  let best = null, bd = Infinity; for (const e of mobs) { const d = Math.hypot(e.x - (o.lob ? tx : o.x), e.z - (o.lob ? tz : o.z)) - (o.lob ? 0 : 0); if (d < bd) { bd = d; best = e; } }
  if (!best) return; const hit = (e, k) => { e.hp -= o.dmg * k; if (e.hp <= 0) { e.hp = 0; e.alive = false; } };
  hit(best, 1); if (o.aoe) for (const e of mobs) if (e !== best && Math.hypot(e.x - best.x, e.z - best.z) < o.aoe) hit(e, o.aoeMult);
}
vm.createContext(c);
for (const f of ['test-mode', 'loot-collection', 'prestige', 'companions', 'heroes-v6']) vm.runInContext(fs.readFileSync(path.join(root, 'assets/data', f + '.js'), 'utf8').replace(/export /g, ''), c);
vm.runInContext(section('const CFG = {', '// 2. UTIL') + section('const clamp =', '// 3. DATA') + 'const P = CFG.progression;' + section('const AC =', 'const G = {') +
  section('class Grid {', '// --- entities') + section('function patrolCountFor(', 'function rewardEnemyKill(') + section('const PELLET_COLORS', '// --- hub step') +
  section('function separate(', '// --- world boss') + section('function boundFighter(', '// --- progression') +
  section('// Bastion fort: { wave, land', '// --- end Bastion fort save') + section('// --- Bastion Siege:', '// --- end siege') + '\nthis.CFG = CFG; this.Grid = Grid; this.SC = SC; this.SIEGE_TYPES = SIEGE_TYPES; this.siegeLevel = siegeLevel; this.siegeMen = siegeMen; this.siegeDefDmg = siegeDefDmg; this.FORT_TYPES = FORT_TYPES; this.landFor = landFor; this.siegeSides = siegeSides; this.fortLvl = fortLvl; this.stepSiegeTraps = stepSiegeTraps; this.fortKeep = fortKeep; this.fortCount = fortCount; this.fortArea = fortArea; this.fortAreaFor = fortAreaFor; this.fortInArea = fortInArea;', c);
const S0 = c.CFG.siege, T0 = S0.towers;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function reset(level = 40, gold = 1e12, stones = 0, keep = 10, area = 8) {
  const hub = new c.Grid(6); hub.add({ x: 500, z: 500, r: 1 });
  Object.assign(c.G, { mode: 'hub', started: true, modal: false, profile: { level, gold, worldTier: 0, records: {}, fort: c.sanitizeFort({ pads: [], stones, wood: stones, iron: stones, deeds: stones, keep, area }, true) }, chain: { type: null, zone: -1, n: 0 }, enemies: [], ents: new Map(), time: 0, menuSafe: 0,
    rift: null, dungeon: null, siege: null, shrines: [], hubObstacles: hub, obstacles: hub, bossTimer: 100, respawnAt: null, pendingAoE: [], siegeResult: null });
  c.G.player = { id: 0, alive: true, x: S0.gate.x, z: S0.gate.z, r: 0.55, hp: 100, maxHp: 100, ammo: 0, ammoMax: 3, speed: 6.4, intent: {}, isPlayer: true, facing: 0, invulnT: 0, attackId: 'bolt' };
  events.length = 0; shots.length = 0; grants.items = []; grants.gems = grants.xp = grants.gold = 0;
}
// run the fort for a while with the hero parked out of reach by the south wall
function run(secs, dt = 1 / 30) { for (let t = 0; t < secs && c.G.siege; t += dt) { c.G.time += dt; c.stepSiege(dt); for (const e of c.G.enemies.slice()) c.stepEnemy(e, dt); } }

check('the Bastion house opens at level 20 and only from the hub with no other challenge running', () => {
  reset(S0.unlock - 1); assert(!c.startSiege(), 'level gate'); assert.equal(S0.unlock, 20);
  reset(S0.unlock); c.G.rift = {}; assert(!c.startSiege(), 'not from the Rift'); c.G.rift = null;
  c.G.player.alive = false; assert(!c.startSiege()); c.G.player.alive = true;
  assert(c.startSiege()); assert(c.inInstance()); assert.equal(c.G.obstacles, c.G.siegeObstacles); assert(!c.startSiege(), 'one siege at a time');
  const pl = c.G.player; assert.equal(pl.hp, pl.maxHp); assert.equal(pl.x, c.SC.x + S0.spawn.x); assert.equal(pl.z, c.SC.z + S0.spawn.z);
  assert.equal(c.G.siege.objs.length, 3); assert(c.G.siege.objs[0].def.main); assert(c.G.siege.objs.every((o) => o.alive && o.hp === o.maxHp && o.maxHp > 0));
  assert.equal(c.G.siege.phase, 'build'); assert.equal(c.siegeInteract(pl).kind, 'fortBuild');
});
check('old saves: the eight pads move onto the grid, a builder hut is added, the wave restarts one past the best', () => {
  const f = c.sanitizeFort({ stones: 9, pads: [{ t: 'archer', l: 4 }, null, { t: 'warrior', l: 2 }, null, null, null, null, { t: 'cannon', l: 15 }] }, true);
  assert.equal(f.stones, 9); assert.equal(f.b.map((b) => b.t).join(), 'archer,warrior,cannon,hut'); assert.equal(f.b[0].l, 4); assert.equal(f.b[2].l, 15);
  assert.equal(f.keep, 10, 'the lowest Keep level that holds a level-15 cannon'); assert.equal(f.wood, 60 + (4 + 2 + 15 + 1) * 4, 'a stock of wood for the camp'); assert.equal(f.iron, 0);
  assert.equal(c.sanitizeFort({ b: [], keep: 3, wood: 5 }, true).keep, 3, 'a known Keep level stays'); assert.equal(c.sanitizeFort({ b: [], wave: 4 }, true).go, 1, 'a fort that held waves runs them by itself');
  assert.equal(c.sanitizeFort(f, true).b.length, 4, 'a second pass keeps them');
  const g = c.sanitizeFort({ b: [{ t: 'wall', x: 3, z: 3, l: 1 }, { t: 'wall', x: 3, z: 3, l: 2 }, { t: 'laser', x: 0, z: 0 }, { t: 'archer', x: 9e9, z: 1, l: 99 }] }, false);
  assert.equal(g.b.length, 2, 'one building per cell, real types only'); assert.equal(g.b[1].x, 124); assert.equal(g.b[1].l, 15); assert.equal(g.stones, undefined, 'a shared world carries no stones');
  reset(40, 1e12, 0); assert(c.startSiege()); const S = c.G.siege; assert(S.units.length >= 1 && S.units.some((u) => u.b.t === 'hut'));
  for (const u of S.units) assert(!c.FORT_TYPES[u.b.t] || u.x > c.SC.x - S.half && u.x < c.SC.x + S.half);
  c.endSiege('leave');
});
check('building anywhere on the grid: no overlaps, not on the Keep or outside the land, paid in wood and stone (no gold), half back', () => {
  reset(40, 1e12, 1e6); assert(c.startSiege()); const S = c.G.siege, F = c.fortState(), M = c.myFort(), g0 = c.G.profile.gold, s0 = M.stones, w0 = M.wood;
  const pr = c.fortCost('archer', 1); assert(pr.wood > 0 && pr.stones > 0 && !pr.iron && pr.gold === undefined); assert.equal(c.fortDo({ o: 'add', t: 'archer', x: -10, z: 3 }), '');
  assert.equal(c.G.profile.gold, g0, 'hero gold is not spent'); assert.equal(M.stones, s0 - pr.stones); assert.equal(M.wood, w0 - pr.wood);
  assert.equal(c.fortDo({ o: 'add', t: 'cannon', x: -9, z: 4 }), 'Something is in the way', 'no overlap');
  assert.equal(c.fortDo({ o: 'add', t: 'wall', x: 0, z: 1 }), 'Something is in the way', 'not on the Keep');
  assert.equal(c.fortDo({ o: 'add', t: 'wall', x: 200, z: 0 }), 'Outside your land');
  const k = F.b.findIndex((b) => b.t === 'archer' && b.x === -10 && b.z === 3), u = S.units.find((q) => q.b === F.b[k]);
  assert(u && u.alive && c.G.obstacles.list.some((o) => o.x === u.x && o.z === u.z), 'solid for heroes');
  // upgrades: level 2+ takes a builder and time; one hut = one upgrade at a time
  assert.equal(c.fortDo({ o: 'up', k }), ''); assert.equal(F.b[k].l, 2); assert(F.b[k].d > Date.now()); assert.equal(c.fortLvl(F.b[k]), 1, 'works at the old level meanwhile');
  const k2 = F.b.length; assert.equal(c.fortDo({ o: 'add', t: 'mage', x: 10, z: 10 }), ''); assert.equal(c.fortDo({ o: 'up', k: k2 }), 'All builders are busy');
  assert.equal(c.fortDo({ o: 'add', t: 'hut', x: -10, z: 8 }), ''); assert.equal(c.fortDo({ o: 'up', k: k2 }), '', 'a second hut, a second builder');
  F.b[k].d = Date.now() - 1; run(0.1); assert(!F.b[k].d && c.fortLvl(F.b[k]) === 2, 'the upgrade finishes');
  const spent = c.fortSpent(F.b[k]), before = M.stones, wb = M.wood; assert.equal(c.fortDo({ o: 'del', k }), ''); assert.equal(M.stones, before + Math.floor(spent.stones / 2)); assert.equal(M.wood, wb + Math.floor(spent.wood / 2));
  assert(!S.units.some((q) => q.b.t === 'archer' && q.b.x === -10));
  assert.equal(c.fortDo({ o: 'del', k: F.b.findIndex((b) => b.t === 'hut') }), '', 'one of two huts may go'); assert.equal(c.fortDo({ o: 'del', k: F.b.findIndex((b) => b.t === 'hut') }), 'Your last builder stays');
  // moving (builder mode): free, onto free cells only, and the old cells open up
  const km = F.b.findIndex((b) => b.t === 'mage'), mb = F.b[km], gm = c.G.profile.gold;
  assert.equal(c.fortDo({ o: 'move', k: km, x: 0, z: 1 }), 'Something is in the way', 'not onto the Keep');
  assert.equal(c.fortDo({ o: 'move', k: km, x: 11, z: 10 }), '', 'one cell over, partly on its own cells'); assert.equal(mb.x, 11); assert.equal(c.G.profile.gold, gm, 'moving is free');
  assert.equal(c.fortDo({ o: 'add', t: 'wall', x: 10, z: 10 }), '', 'its old cell is free again');
  // the builder's ghost: the picked cell, checked as it would be built
  c.G.builder = { sel: 'archer', cell: [0, 1] }; assert.equal(c.fortGhosts()[0].ok, false, 'red on the Keep');
  c.G.builder.cell = [-14, 4]; assert.equal(c.fortGhosts()[0].ok, true, 'green on free ground');
  c.G.builder = { sel: 'mage', move: mb, cell: [11, 10] }; assert.equal(c.fortGhosts()[0].ok, true, 'a moved building may stay where it is');
  c.G.builder = { sel: 'wall', line: { plan: [{ t: 'wall', x: 1, z: 1, ok: true }, { t: 'wall', x: 2, z: 1, ok: false }] } }; assert.equal(c.fortGhosts().length, 2, 'a wall line shows every piece'); c.G.builder = null;
  c.endSiege('leave');
});
check('waves: level never far below the hero and climbs, more monsters each wave, a Siege Lord every 10th wave', () => {
  reset(20); const lv = [1, 5, 10, 30].map(c.siegeLevel); assert(lv.every((l, i) => !i || l >= lv[i - 1])); assert(lv[0] >= 18);
  reset(150); assert.equal(c.siegeLevel(1), 148, 'a strong hero meets level-2 monsters');
  const n = [1, 4, 9, 14].map((w) => c.siegeComposition(w).count); assert(n.every((x, i) => !i || x > n[i - 1]));
  assert(c.siegeComposition(10).boss && c.siegeComposition(20).boss && !c.siegeComposition(5).boss);
  reset(30); assert(c.startSiege()); const S = c.G.siege; S.wave = 10; S.sides = [0, 2]; assert(c.startSiegeWave()); assert.equal(S.phase, 'fight');
  run(30); assert(S.mobs.length >= c.siegeComposition(10).count, 'everything spawns at the edge');
  const lord = S.mobs.find((e) => e.bossName === 'Siege Lord'); assert(lord && lord.guardian && lord.champ && !lord.rift && lord.siege);
  assert(S.mobs.every((e) => e.siege && e.temp && c.G.ents.get(e.id) === e));
  for (const e of S.mobs) { const dx = Math.abs(e.x - c.SC.x), dz = Math.abs(e.z - c.SC.z); assert(dx <= S.half && dz <= S.half, 'monsters stay on the land'); }
  c.endSiege('leave');
});
check('undefended, the monsters march on the objectives, wreck them and the fallen Keep ends the run on the same wave', () => {
  reset(30); c.myFort().wave = 7; assert(c.startSiege()); const S = c.G.siege, pl = c.G.player; pl.alive = false; // nobody to distract them
  c.startSiegeWave(); run(400);
  assert(!c.G.siege, 'the run ended'); assert(events.some((e) => e.t === 'objectiveHit')); assert(events.some((e) => e.t === 'objectiveDown' && e.main));
  const end = events.find((e) => e.t === 'siegeEnd'); assert.equal(end.why, 'keep'); assert.equal(c.G.siegeResult.why, 'keep');
  assert(!c.G.enemies.length, 'siege monsters are cleaned up'); assert.equal(c.G.obstacles, c.G.hubObstacles);
  assert.equal(c.myFort().wave, 7, 'a fallen Keep never sets the fort back'); c.G.player.alive = true; assert(c.startSiege()); assert.equal(c.G.siege.wave, 7); c.endSiege('leave');
});
check('sides: one at first, up to four later, never twice the same', () => {
  const a = Array.from({ length: 200 }, () => c.siegeSides(1)), b = Array.from({ length: 400 }, () => c.siegeSides(120));
  assert(a.every((x) => x.length === 1)); assert(b.some((x) => x.length === 4) && b.some((x) => x.length === 1)); assert(b.every((x) => new Set(x).size === x.length && x.every((i) => i >= 0 && i < 4)));
  assert.equal(c.landFor(20), 30); assert.equal(c.landFor(200), 250); assert.equal(c.landFor(500), 250);
});
check('walls: monsters walk around an open wall, and break the cheapest piece of a closed ring', () => {
  reset(40, 1e12, 1e6); assert(c.startSiege()); const S = c.G.siege, F = c.fortState();
  const at = (x, z) => { if (S.flowDirty) c.siegeFlow(); return S.dist[c.siegeIdx(x, z)]; };
  const free = at(0, 12); assert(free < Infinity);
  // a ring of walls around the Keep (cells -6..5), left open on the north side
  for (let i = -6; i <= 5; i++) for (const j of [-6, 5]) if (!(j === 5 && i >= -1 && i <= 0)) c.fortDo({ o: 'add', t: 'wall', x: i, z: j });
  for (let j = -5; j <= 4; j++) for (const i of [-6, 5]) c.fortDo({ o: 'add', t: 'wall', x: i, z: j });
  assert(at(0, 12) < 30, 'the gap: a short walk'); const e = { x: c.SC.x + 9, z: c.SC.z - 30, r: 0.5 };
  // close the gap: now the cheapest way is through a wall
  c.fortDo({ o: 'add', t: 'wall', x: -1, z: 5 }); c.fortDo({ o: 'add', t: 'wall', x: 0, z: 5 });
  // with the wagons still open outside the ring, the fastest way is to them, round the walls
  { const g = { x: c.SC.x + 1, z: c.SC.z + 13, r: 0.5 }; let s3 = null; for (let n = 0; n < 60; n++) { s3 = c.siegeFlowStep(g); if (!s3 || s3.kind === 'fortB') break; g.x = s3.x; g.z = s3.z; } assert(!s3, 'walks round the ring to a wagon instead of breaking a wall'); }
  S.objs[1].alive = S.objs[2].alive = false; S.flowDirty = true;
  const step = c.siegeFlowStep({ x: c.SC.x + 1, z: c.SC.z + 12.9, r: 0.5 }); assert(step); void e;
  let f = { x: c.SC.x + 1, z: c.SC.z + 13, r: 0.5 }, hit = null;
  for (let n = 0; n < 40 && !hit; n++) { const s2 = c.siegeFlowStep(f); if (s2 && s2.kind === 'fortB') hit = s2; else if (s2) { f.x = s2.x; f.z = s2.z; } else break; }
  assert(hit && c.CFG.siege.towers[hit.b.t].wall, 'a closed ring: break a wall');
  c.siegeHitBuilding(hit, hit.hp + 1); assert(!hit.alive); assert(at(hit.b.x, hit.b.z) < 30, 'the broken piece opens the way');
  void F; c.endSiege('leave');
});
check('traps: monsters walk over them; spikes hit and reset, a keg blows once per wave and comes back, tar slows and burns', () => {
  reset(40, 1e12, 1e6); assert(c.startSiege()); const S = c.G.siege, F = c.fortState();
  const free = (() => { if (S.flowDirty) c.siegeFlow(); return S.dist[c.siegeIdx(0, 12)]; })();
  for (const [t, x] of [['spike', -1], ['bomb', 0], ['tar', 1]]) assert.equal(c.fortDo({ o: 'add', t, x, z: 12 }), '', t);
  if (S.flowDirty) c.siegeFlow(); assert.equal(S.dist[c.siegeIdx(0, 12)], free, 'a trap costs no detour');
  assert(!c.G.obstacles.list.some((o) => S.units.some((u) => c.CFG.siege.towers[u.b.t].trap && o.x === u.x && o.z === u.z)), 'traps are not solid');
  const at = (t) => S.units.find((u) => u.b.t === t), mob = (u) => { const e = c.spawnSiegeMob({ type: c.CFG.world.zones[1].enemy, zi: 1 }); e.x = u.x; e.z = u.z; e.hp = e.maxHp = 1e15; return e; };
  const sp = at('spike'), e1 = mob(sp); sp.cd = 0; c.stepSiegeTraps(0.05); assert(e1.hp < 1e15, 'spikes hit'); assert(sp.cd > 1, 'and reset');
  const kg = at('bomb'), e2 = mob(kg); kg.cd = 0; c.stepSiegeTraps(0.05); assert(kg.spent, 'the keg is used up'); assert(events.some((e) => e.t === 'fortTrap' && e.type === 'bomb'));
  const tr = at('tar'), e3 = mob(tr); e3.slowT = 0; tr.cd = 0; c.stepSiegeTraps(0.05); assert(e3.slowT > 0, 'tar slows'); assert(e3.hp < 1e15, 'tar burns');
  c.siegeWaveClear(); assert(!kg.spent, 'a new keg for the next wave');
  assert.equal(c.fortDo({ o: 'up', k: F.b.indexOf(sp.b) }), '', 'traps upgrade'); void F;
  c.endSiege('leave');
});
check('a full fort holds wave 1: towers shoot, warriors man their posts, the wave pays gold and stones, the next start never goes lower', () => {
  reset(40, 1e12, 1e6); assert(c.startSiege());
  const spots = [[-8, 6], [5, 6], [-8, -3], [5, -4], [-7, 1], [3, -10], [-3, 9], [1, 9]], types = ['archer', 'cannon', 'ballista', 'warrior', 'mage', 'archer', 'cannon', 'warrior'];
  spots.forEach(([x, z], i) => assert.equal(c.fortDo({ o: 'add', t: types[i], x, z }), '', types[i] + ' at ' + x + ',' + z));
  c.endSiege('leave'); c.G.siegeResult = null;
  const gold0 = c.G.profile.gold, stones0 = c.myFort().stones;
  assert(c.startSiege()); const S = c.G.siege; c.G.player.alive = false;
  assert.equal(S.soldiers.length, 2 * c.siegeMen(1)); assert(S.soldiers.every((s) => s.kind === 'soldier' && s.hp > 0));
  S.sides = [0, 1, 2, 3]; c.startSiegeWave(); for (let t = 0; t < 160 && c.G.siege && !S.cleared; t += 0.5) run(0.5);
  assert(c.G.siege, 'the Keep stands'); assert.equal(S.cleared, 1); assert.equal(S.phase, 'clear');
  assert(shots.some((o) => o.kind === 'arrow') && shots.some((o) => o.kind === 'shell' && o.lob && o.aoe > 0) && shots.some((o) => o.kind === 'rail' && o.pierce === 3));
  { const m = S.units.find((u) => u.b.t === 'mage'), e = c.spawnSiegeMob({ type: c.CFG.world.zones[1].enemy, zi: 1 }); e.x = m.x + 5; e.z = m.z; m.cd = 0; c.stepSiegeDefenders(0.05);
    assert(shots.some((o) => o.kind === 'orb' && o.team === 'ally' && o.aoe > 0), 'the mage tower fires'); e.alive = false; }
  assert(shots.every((o) => o.team === 'ally' || o.team === 'mob'));
  const clr = events.find((e) => e.t === 'siegeClear'); assert(clr && clr.gold > 0 && clr.stones >= 3);
  assert.equal(c.myFort().stones, stones0 + clr.stones); assert.equal(c.G.profile.gold, gold0 + clr.gold); assert.equal(c.G.profile.records.bestSiege, 1);
  assert.equal(c.fortState().wave, 2, 'the fort now starts at wave 2');
  run(S0.clear + 0.5); assert.equal(S.wave, 2); assert.equal(S.phase, 'build'); assert(!S.mobs.length);
  c.endSiege('leave'); assert.equal(c.G.siegeResult.held, 1); assert.equal(c.G.player.x, S0.gate.x + 2);
  c.G.player.alive = true; assert(c.startSiege()); assert.equal(c.G.siege.wave, 2, 'a new run starts at the wave reached'); c.endSiege('leave');
});
check('the fort waits while a menu is open, and walking off (waypoint travel) closes it', () => {
  reset(30); c.myFort().go = 1; assert(c.startSiege()); const S = c.G.siege, t0 = S.t; c.G.modal = true; run(3); assert.equal(S.t, t0); c.G.modal = false; run(1); assert(S.t < t0);
  c.G.player.x += 900; run(0.1); assert(!c.G.siege); assert.equal(events.find((e) => e.t === 'siegeEnd').why, 'away');
});
check('a fallen hero respawns at the Keep instead of in town', () => {
  reset(30); assert(c.startSiege()); c.G.player.alive = false; run(0.1);
  assert.deepEqual({ ...c.G.respawnAt }, { x: c.SC.x + S0.spawn.x, z: c.SC.z + S0.spawn.z }); c.endSiege('leave');
});
check('the Keep level sets how many of each building you may have and how high they go; upgrading it takes a builder', () => {
  reset(40, 1e12, 1e6, 1); assert(c.startSiege()); const F = c.fortState(), M = c.myFort(), C = c.CFG.siege; assert.equal(F.keep, 1);
  assert.equal(c.fortDo({ o: 'add', t: 'archer', x: -10, z: 3 }), ''); assert.equal(c.fortDo({ o: 'add', t: 'archer', x: -10, z: 6 }), '');
  assert.equal(c.fortDo({ o: 'add', t: 'archer', x: -10, z: 9 }), 'Keep level 2 allows more', 'two archers at Keep 1');
  assert.equal(c.fortDo({ o: 'add', t: 'ballista', x: 10, z: 8 }), 'Keep level 2 allows this'); assert.equal(c.fortDo({ o: 'add', t: 'iron', x: 10, z: 8 }), 'Keep level 4 allows this');
  const k = F.b.findIndex((b) => b.t === 'archer'); for (let l = 1; l < C.keep.lvl[0]; l++) { assert.equal(c.fortDo({ o: 'up', k }), ''); F.b[k].d = 0; }
  assert(c.fortDo({ o: 'up', k }).startsWith('Upgrade the Keep first'), 'level 3 is the most at Keep 1');
  const w0 = M.wood, kc = C.keep.cost(2); assert.equal(c.fortDo({ o: 'keep' }), ''); assert.equal(F.keep, 2); assert(F.kd > Date.now()); assert.equal(M.wood, w0 - kc.wood);
  assert.equal(c.fortKeep(F), 1, 'the new limits count once it is done'); assert.equal(c.fortDo({ o: 'add', t: 'archer', x: -10, z: 9 }), 'Keep level 2 allows more');
  assert.equal(c.fortDo({ o: 'up', k }), 'Upgrade the Keep first (level 4 needs Keep 2)'); assert.equal(c.fortDo({ o: 'keep' }), 'Already upgrading');
  const hp0 = c.G.siege.objs[0].maxHp; F.kd = Date.now() - 1; run(0.1); assert(!F.kd); assert.equal(c.fortKeep(F), 2); assert(c.G.siege.objs[0].maxHp > hp0, 'a higher Keep is sturdier');
  assert(events.some((e) => e.t === 'fortBuilt' && e.type === 'keep' && e.done));
  assert.equal(c.fortDo({ o: 'add', t: 'archer', x: -10, z: 9 }), '', 'Keep 2: a third archer'); assert.equal(c.fortDo({ o: 'up', k }), '');
  c.endSiege('leave');
});
check('the camp pays for itself: mills, stone and iron mines fill while away and are collected; iron from level 6; waves pay all three', () => {
  reset(40, 1e12, 1e6); assert(c.startSiege()); const F = c.fortState(), M = c.myFort(), C = c.CFG.siege;
  for (const [t, x] of [['mill', -12], ['mine', -8], ['iron', 8]]) assert.equal(c.fortDo({ o: 'add', t, x, z: 10 }), '', t);
  for (const t of ['mill', 'mine', 'iron']) { const b = F.b.find((q) => q.t === t); b.c = Date.now() - 2 * 3600e3; const n = c.fortMade(b), q = C.towers[t].make, before = M[q];
    assert.equal(n, Math.min(C.towers[t].cap, 2 * C.towers[t].rate), t + ' fills by the hour'); assert.equal(c.fortDo({ o: 'col', k: F.b.indexOf(b) }), ''); assert.equal(M[q], before + n); assert.equal(c.fortMade(b), 0, 'emptied'); }
  const bm = F.b.find((q) => q.t === 'mine'); bm.c = Date.now() - 1e9; assert.equal(c.fortMade(bm), C.towers.mine.cap, 'it holds only so much');
  assert.equal(c.fortCost('archer', 5).iron, 0); assert(c.fortCost('archer', 6).iron > 0, 'iron from level 6');
  M.wood = 0; assert.equal(c.fortDo({ o: 'add', t: 'archer', x: -12, z: -6 }), 'Not enough wood');
  const p1 = C.pay(1), p12 = C.pay(12, false, false), p20 = C.pay(20, true); assert(p1.wood > 0 && p1.stones > 0 && !p1.iron); assert(p12.iron > 0 && p20.wood > p12.wood && p20.iron > p12.iron);
  c.endSiege('leave');
});
check('waves: the first one waits for Start, then each next one comes after a 20 s break unless paused', () => {
  reset(30); assert(c.startSiege()); const S = c.G.siege, F = c.fortState(); assert(!F.go); run(25); assert.equal(S.phase, 'build', 'a new fort waits');
  c.startSiegeWave(); assert.equal(F.go, 1); for (const e of S.mobs) e.alive = false; S.queue = []; run(0.2); assert.equal(S.phase, 'clear'); run(c.CFG.siege.clear + 0.2);
  assert.equal(S.phase, 'build'); assert(S.t > 19 && S.t <= 20, 'a 20 s break'); assert.equal(c.CFG.siege.build, 20);
  c.G.builder = { sel: null }; run(5); assert(S.t < 16, 'building does not stop the clock'); c.G.builder = null;
  assert.equal(c.fortDo({ o: 'hold', v: 1 }), ''); const t1 = S.t; run(30); assert.equal(S.t, t1, 'paused'); assert.equal(S.phase, 'build');
  assert.equal(c.fortDo({ o: 'hold', v: 0 }), ''); run(t1 + 0.2); assert.equal(S.phase, 'fight', 'resumed: the wave comes');
  c.endSiege('leave'); c.G.siegeResult = null; assert(c.startSiege()); assert(c.fortState().go, 'the next visit runs by itself'); c.endSiege('leave');
});
check('paths: a tower picks one of two at level 5 and it changes how it fights', () => {
  reset(40, 1e12, 1e6); assert(c.startSiege()); const F = c.fortState(), S = c.G.siege, C = c.CFG.siege;
  for (let i = 0; i < 4; i++) c.fortDo({ o: 'add', t: 'hut', x: -20 + i * 3, z: -10 });
  assert.equal(c.fortDo({ o: 'add', t: 'archer', x: -10, z: 3 }), ''); assert.equal(c.fortDo({ o: 'add', t: 'mage', x: 10, z: 3 }), '');
  const ka = F.b.findIndex((q) => q.t === 'archer'), km = F.b.findIndex((q) => q.t === 'mage');
  for (const k of [ka, km]) for (let l = 1; l < 4; l++) { assert.equal(c.fortDo({ o: 'up', k }), ''); F.b[k].d = 0; }
  assert.equal(c.fortDo({ o: 'up', k: ka }), 'Pick a path'); assert.equal(c.fortDo({ o: 'up', k: ka, p: 1 }), ''); assert.equal(F.b[ka].p, 1);
  assert.equal(c.fortDo({ o: 'up', k: km, p: 2 }), ''); F.b[ka].d = F.b[km].d = Date.now() - 1; run(0.1);
  const ua = S.units.find((u) => u.b === F.b[ka]), um = S.units.find((u) => u.b === F.b[km]);
  assert.equal(ua.st.multi, 3, 'a volley tower'); assert.equal(um.st.chain, 3); assert.equal(um.st.light, false, 'storm cuts armour');
  for (let i = 0; i < 3; i++) { const e = c.spawnSiegeMob({ type: c.CFG.world.zones[1].enemy, zi: 1 }); e.x = ua.x + 4 + i; e.z = ua.z; e.hp = e.maxHp = 1e15; }
  shots.length = 0; ua.cd = 0; c.stepSiegeDefenders(0.05); assert.equal(shots.filter((o) => o.owner === ua.id).length, 3, 'three arrows at once');
  um.cd = 0; const e = S.mobs[0]; e.x = um.x + 4; e.z = um.z; c.stepSiegeDefenders(0.05); assert(shots.some((o) => o.owner === um.id && o.chain === 3));
  assert.equal(c.sanitizeFort(F, false).b.find((q) => q.t === 'archer').p, 1, 'the path is saved');
  c.endSiege('leave');
});
check('armour and flyers: light shots barely scratch armour, flyers cross walls and only towers with air reach them', () => {
  reset(40, 1e12, 1e6); assert(c.startSiege()); const S = c.G.siege, C = c.CFG.siege;
  const comp = c.siegeComposition(20); assert(comp.armored > 0 && comp.flyers > 0); assert(!c.siegeComposition(3).armored && !c.siegeComposition(5).flyers);
  for (const [t, x] of [['archer', -10], ['cannon', 10]]) assert.equal(c.fortDo({ o: 'add', t, x, z: 3 }), '');
  const ar = S.units.find((u) => u.b.t === 'archer'), ca = S.units.find((u) => u.b.t === 'cannon');
  const tank = c.spawnSiegeMob({ type: c.CFG.world.zones[1].enemy, zi: 1, armor: true }), bird = c.spawnSiegeMob({ type: C.flyers[0], zi: 1, fly: true });
  assert(tank.siegeArmor && bird.flying);
  assert.equal(c.siegeDmgMul(tank, ar.id), C.armor); assert.equal(c.siegeDmgMul(tank, ca.id), 1); assert.equal(c.siegeDmgMul(bird, ca.id), 0, 'cannons cannot hit flyers'); assert.equal(c.siegeDmgMul(bird, ar.id), 1);
  assert.equal(c.siegeDmgMul(tank, c.G.player.id), 1, 'heroes hit everything');
  bird.x = ca.x + 3; bird.z = ca.z; tank.x = c.SC.x + 400; ca.cd = 0; shots.length = 0; c.stepSiegeDefenders(0.05); assert(!shots.some((o) => o.owner === ca.id), 'the cannon does not aim at a flyer');
  // a closed ring of walls: walkers must break through, a flyer flies straight over
  for (let i = -6; i <= 5; i++) for (const j of [-6, 5]) c.fortDo({ o: 'add', t: 'wall', x: i, z: j });
  for (let j = -5; j <= 4; j++) for (const i of [-6, 5]) c.fortDo({ o: 'add', t: 'wall', x: i, z: j });
  bird.x = c.SC.x; bird.z = c.SC.z + 30; c.G.player.alive = false; for (let n = 0; n < 300 && bird.alive && Math.hypot(bird.x - S.objs[0].x, bird.z - S.objs[0].z) > S.objs[0].r + 2; n++) { c.G.time += 1 / 30; c.stepEnemy(bird, 1 / 30); }
  assert(Math.hypot(bird.x - S.objs[0].x, bird.z - S.objs[0].z) <= S.objs[0].r + 2, 'the flyer reached the Keep over the walls');
  c.endSiege('leave');
});
check('the build area starts small and grows with plots bought with Land Deeds, which only waves pay', () => {
  reset(120, 1e12, 1e6, 1, 0); assert(c.startSiege()); const F = c.fortState(), M = c.myFort(), C = c.CFG.siege, A = C.area;
  assert.equal(F.area, 0); assert.equal(c.fortArea(F), A.base);
  assert.equal(c.fortDo({ o: 'add', t: 'archer', x: A.base - 2, z: 0 }), '', 'inside the area');
  assert.equal(c.fortDo({ o: 'add', t: 'cannon', x: A.base, z: 0 }), 'Buy more land to build there');
  M.deeds = 0; assert.equal(c.fortDo({ o: 'land' }), 'Not enough land deeds'); M.deeds = 100;
  assert.equal(c.fortDo({ o: 'land' }), ''); assert.equal(F.area, 1); assert.equal(M.deeds, 100 - A.deeds[0]); assert.equal(c.fortArea(F), A.base + A.step);
  assert.equal(c.fortDo({ o: 'add', t: 'cannon', x: A.base, z: 0 }), '', 'the new plot is buildable');
  assert.equal(c.fortDo({ o: 'land' }), 'Needs Keep level 2'); F.keep = 2; assert.equal(c.fortDo({ o: 'land' }), '');
  assert(C.pay(3).deeds >= 1 && C.pay(10, true).deeds > C.pay(3).deeds, 'waves pay deeds, a Siege Lord more');
  assert(!Object.values(C.towers).some((T) => T.make === 'deeds'), 'nothing mines deeds');
  c.endSiege('leave');
  reset(20, 1e12, 1e6, 10, 0); M.deeds = 1e6; assert(c.startSiege()); for (let i = 0; i < 8; i++) c.fortDo({ o: 'land' });
  assert(c.fortArea() * C.cell <= c.G.siege.half - 6, 'never past a small land'); assert.equal(c.fortDo({ o: 'land' }), 'Your land grows with your hero level'); c.endSiege('leave');
  const old = c.sanitizeFort({ b: [{ t: 'archer', x: 14, z: 0, l: 1 }] }, true); assert(c.fortAreaFor(old.area) >= 16, 'an old fort keeps room for what it built');
  assert.equal(c.CFG.siege.towers.wall.lim[9], 150, 'walls: 150 at most');
});
check('monsters take the fastest open way through a gap and never stand inside a wall', () => {
  reset(40, 1e12, 1e6); assert(c.startSiege()); const S = c.G.siege; c.G.player.alive = false;
  // a ring round the Keep and both wagons (cells -10..9), open at one spot on the north side
  for (let i = -10; i <= 9; i++) for (const j of [-10, 9]) if (!(j === 9 && i === 4)) c.fortDo({ o: 'add', t: 'wall', x: i, z: j });
  for (let j = -9; j <= 8; j++) for (const i of [-10, 9]) c.fortDo({ o: 'add', t: 'wall', x: i, z: j });
  S.sides = [0]; c.startSiegeWave(); let inside = 0, through = 0;
  for (let t = 0; t < 40 && c.G.siege; t += 1 / 30) { c.G.time += 1 / 30; c.stepSiege(1 / 30); for (const e of c.G.enemies.slice()) { c.stepEnemy(e, 1 / 30);
    if (e.alive && !e.flying && c.siegeSolidAt(e.x, e.z)) inside++; if (e.alive && Math.abs(e.x - c.SC.x) < 18 && Math.abs(e.z - c.SC.z) < 18) through++; } }
  assert.equal(inside, 0, 'no monster ever inside a wall cell');
  assert(through > 0, 'they came in through the gap'); assert(!events.some((e) => e.t === 'fortBroken'), 'with a way open, no wall was broken');
  c.endSiege('leave');
});
check('castle roads stay free (gates and traps only), defence spots beside them boost a tower, walls block heroes only where they stand', () => {
  reset(80, 1e12, 1e6); assert(c.startSiege()); const S = c.G.siege, F = c.fortState(), C = c.CFG.siege;
  const t = C.road.from + 2; assert(S.road[c.siegeIdx(0, t)] && S.road[c.siegeIdx(-1, t)] && !S.road[c.siegeIdx(1, t)], 'a 2-cell road north');
  assert.equal(c.fortDo({ o: 'add', t: 'archer', x: -1, z: t }), 'Keep the castle road free (gates and traps only)');
  assert.equal(c.fortDo({ o: 'add', t: 'wall', x: 0, z: t }), 'Keep the castle road free (gates and traps only)');
  assert.equal(c.fortDo({ o: 'add', t: 'gate', x: 0, z: t }), '', 'a gate across the road'); assert.equal(c.fortDo({ o: 'add', t: 'spike', x: -1, z: t }), '', 'a trap on it');
  assert(S.spots.length >= 4 && S.spots.every((q) => !c.siegeIdx || !S.road[c.siegeIdx(q.x, q.z)]), 'spots beside the roads');
  const q = S.spots.find((p) => c.fortInArea(p.x, p.z, 2, F)); assert(q, 'a spot inside the build area');
  assert.equal(c.fortDo({ o: 'add', t: 'archer', x: q.x, z: q.z }), ''); const u = S.units.find((v) => v.b.x === q.x && v.b.z === q.z);
  assert(u.spot && u.st.spot); assert.equal(u.st.range, C.towers.archer.range * C.spots.range); assert(u.st.dmg > C.towers.archer.dmg);
  // walls: the hero's colliders sit on the wall line (small circles), not over the whole cell
  assert.equal(c.fortDo({ o: 'add', t: 'wall', x: 8, z: -8 }), ''); assert.equal(c.fortDo({ o: 'add', t: 'wall', x: 9, z: -8 }), '');
  const w = c.G.obstacles.list.filter((o) => Math.abs(o.z - (c.SC.z - 15)) < 0.01 && o.x > c.SC.x + 16 && o.x < c.SC.x + 20);
  assert(w.length >= 3 && w.every((o) => o.r <= 0.5), 'thin colliders along the wall');
  c.endSiege('leave');
});
console.log(`${passed} siege checks passed.`);
