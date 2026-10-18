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
  section('// Bastion fort: { wave, land', '// --- end Bastion fort save') + section('// --- Bastion Siege:', '// --- end siege') + '\nthis.CFG = CFG; this.Grid = Grid; this.SC = SC; this.SIEGE_TYPES = SIEGE_TYPES; this.siegeLevel = siegeLevel; this.siegeMen = siegeMen; this.siegeDefDmg = siegeDefDmg; this.FORT_TYPES = FORT_TYPES; this.landFor = landFor; this.siegeSides = siegeSides; this.fortLvl = fortLvl;', c);
const S0 = c.CFG.siege, T0 = S0.towers;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function reset(level = 40, gold = 1e12, stones = 0) {
  const hub = new c.Grid(6); hub.add({ x: 500, z: 500, r: 1 });
  Object.assign(c.G, { mode: 'hub', started: true, modal: false, profile: { level, gold, worldTier: 0, records: {}, fort: c.sanitizeFort({ pads: [], stones }, true) }, chain: { type: null, zone: -1, n: 0 }, enemies: [], ents: new Map(), time: 0, menuSafe: 0,
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
  assert.equal(c.sanitizeFort(f, true).b.length, 4, 'a second pass keeps them');
  const g = c.sanitizeFort({ b: [{ t: 'wall', x: 3, z: 3, l: 1 }, { t: 'wall', x: 3, z: 3, l: 2 }, { t: 'laser', x: 0, z: 0 }, { t: 'archer', x: 9e9, z: 1, l: 99 }] }, false);
  assert.equal(g.b.length, 2, 'one building per cell, real types only'); assert.equal(g.b[1].x, 124); assert.equal(g.b[1].l, 15); assert.equal(g.stones, undefined, 'a shared world carries no stones');
  reset(40, 1e12, 0); assert(c.startSiege()); const S = c.G.siege; assert(S.units.length >= 1 && S.units.some((u) => u.b.t === 'hut'));
  for (const u of S.units) assert(!c.FORT_TYPES[u.b.t] || u.x > c.SC.x - S.half && u.x < c.SC.x + S.half);
  c.endSiege('leave');
});
check('building anywhere on the grid: no overlaps, not on the Keep or outside the land, gold and stones paid, half the stones back', () => {
  reset(40, 1e12, 1e6); assert(c.startSiege()); const S = c.G.siege, F = c.fortState(), M = c.myFort(), g0 = c.G.profile.gold, s0 = M.stones;
  const pr = c.fortCost('archer', 1); assert.equal(c.fortDo({ o: 'add', t: 'archer', x: -10, z: 0 }), '');
  assert.equal(c.G.profile.gold, g0 - pr.gold); assert.equal(M.stones, s0 - pr.stones);
  assert.equal(c.fortDo({ o: 'add', t: 'cannon', x: -9, z: 1 }), 'Something is in the way', 'no overlap');
  assert.equal(c.fortDo({ o: 'add', t: 'wall', x: 0, z: 1 }), 'Something is in the way', 'not on the Keep');
  assert.equal(c.fortDo({ o: 'add', t: 'wall', x: 200, z: 0 }), 'Outside your land');
  const k = F.b.findIndex((b) => b.t === 'archer' && b.x === -10), u = S.units.find((q) => q.b === F.b[k]);
  assert(u && u.alive && c.G.obstacles.list.some((o) => o.x === u.x && o.z === u.z), 'solid for heroes');
  // upgrades: level 2+ takes a builder and time; one hut = one upgrade at a time
  assert.equal(c.fortDo({ o: 'up', k }), ''); assert.equal(F.b[k].l, 2); assert(F.b[k].d > Date.now()); assert.equal(c.fortLvl(F.b[k]), 1, 'works at the old level meanwhile');
  const k2 = F.b.length; assert.equal(c.fortDo({ o: 'add', t: 'mage', x: 10, z: 10 }), ''); assert.equal(c.fortDo({ o: 'up', k: k2 }), 'All builders are busy');
  assert.equal(c.fortDo({ o: 'add', t: 'hut', x: -10, z: 8 }), ''); assert.equal(c.fortDo({ o: 'up', k: k2 }), '', 'a second hut, a second builder');
  F.b[k].d = Date.now() - 1; run(0.1); assert(!F.b[k].d && c.fortLvl(F.b[k]) === 2, 'the upgrade finishes');
  const spent = c.fortStonesSpent(F.b[k]), before = M.stones; assert.equal(c.fortDo({ o: 'del', k }), ''); assert.equal(M.stones, before + Math.floor(spent / 2));
  assert(!S.units.some((q) => q.b.t === 'archer' && q.b.x === -10));
  assert.equal(c.fortDo({ o: 'del', k: F.b.findIndex((b) => b.t === 'hut') }), '', 'one of two huts may go'); assert.equal(c.fortDo({ o: 'del', k: F.b.findIndex((b) => b.t === 'hut') }), 'Your last builder stays');
  // drawing walls: every cell the hero walks off gets a segment
  c.G.fortPlace = { t: 'wall', draw: false }; c.fortPlaceNow(); assert(c.G.fortPlace.draw);
  const pl = c.G.player, w0 = F.b.filter((b) => b.t === 'wall').length; pl.x = c.SC.x - 20.5; pl.z = c.SC.z + 20.5;
  for (let i = 0; i < 40; i++) { pl.x += 0.25; c.stepFortDraw(); }
  const walls = F.b.filter((b) => b.t === 'wall'); assert(walls.length - w0 >= 3, 'a line of walls'); assert(walls.every((b) => b.z === walls[0].z));
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
  const step = c.siegeFlowStep({ x: c.SC.x + 1, z: c.SC.z + 12.9, r: 0.5 }); assert(step); void e;
  let f = { x: c.SC.x + 1, z: c.SC.z + 13, r: 0.5 }, hit = null;
  for (let n = 0; n < 40 && !hit; n++) { const s2 = c.siegeFlowStep(f); if (s2 && s2.kind === 'fortB') hit = s2; else if (s2) { f.x = s2.x; f.z = s2.z; } else break; }
  assert(hit && c.CFG.siege.towers[hit.b.t].wall, 'a closed ring: break a wall');
  c.siegeHitBuilding(hit, hit.hp + 1); assert(!hit.alive); assert(at(hit.b.x, hit.b.z) < 30, 'the broken piece opens the way');
  void F; c.endSiege('leave');
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
  reset(30); assert(c.startSiege()); const S = c.G.siege, t0 = S.t; c.G.modal = true; run(3); assert.equal(S.t, t0); c.G.modal = false; run(1); assert(S.t < t0);
  c.G.player.x += 900; run(0.1); assert(!c.G.siege); assert.equal(events.find((e) => e.t === 'siegeEnd').why, 'away');
});
check('a fallen hero respawns at the Keep instead of in town', () => {
  reset(30); assert(c.startSiege()); c.G.player.alive = false; run(0.1);
  assert.deepEqual({ ...c.G.respawnAt }, { x: c.SC.x + S0.spawn.x, z: c.SC.z + S0.spawn.z }); c.endSiege('leave');
});
console.log(`${passed} siege checks passed.`);
