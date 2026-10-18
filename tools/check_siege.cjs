// Bastion Siege: the real fort, wave, defender and objective code from index.html (no browser).
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let seed = 2610, passed = 0;
const math = Object.create(Math); math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const events = [], shots = [], grants = { items: [], gems: 0, xp: 0, gold: 0 };
const c = { Math: math, console, LOCAL_PREVIEW: true, TEST_MODE: false, nextId: 1, G: {},
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
  section('// --- Bastion Siege:', '// --- end siege') + '\nthis.CFG = CFG; this.Grid = Grid; this.SC = SC; this.SIEGE_TYPES = SIEGE_TYPES; this.siegeLevel = siegeLevel; this.siegeMen = siegeMen; this.siegeDefDmg = siegeDefDmg;', c);
const S0 = c.CFG.siege, T0 = S0.towers;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function reset(level = 40, gold = 1e12, stones = 0) {
  const hub = new c.Grid(6); hub.add({ x: 500, z: 500, r: 1 });
  Object.assign(c.G, { mode: 'hub', started: true, modal: false, profile: { level, gold, worldTier: 0, records: {}, fort: { pads: [], stones } }, chain: { type: null, zone: -1, n: 0 }, enemies: [], ents: new Map(), time: 0, menuSafe: 0,
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
  assert.equal(c.G.siege.phase, 'build'); assert.equal(c.siegeInteract(pl).kind, 'siegeWave');
});
check('pads cost gold and Bastion Stones, upgrade to 15, swap types for half the stones back, and stay in the profile', () => {
  reset(40, 1e12, 0); const F = c.fortState();
  assert.equal(F.pads.length, 8); assert(!c.buyPad(0, 'archer'), 'no stones, no tower');
  F.stones = 1e6; const g0 = c.G.profile.gold, c1 = c.padCost(0, 'archer'); assert.equal(c1.lvl, 1);
  assert(c.buyPad(0, 'archer')); assert.deepEqual({ ...F.pads[0] }, { t: 'archer', l: 1 }); assert.equal(c.G.profile.gold, g0 - c1.gold); assert.equal(F.stones, 1e6 - c1.stones);
  const c2 = c.padCost(0, 'archer'); assert.equal(c2.lvl, 2); assert(c2.gold > c1.gold && c2.stones > c1.stones, 'each level costs more');
  for (let l = 2; l <= S0.maxLvl; l++) assert(c.buyPad(0, 'archer'));
  assert.equal(F.pads[0].l, 15); assert(!c.buyPad(0, 'archer'), 'max level');
  const spent = c.padStonesSpent(F.pads[0]), before = F.stones, cc = c.padCost(0, 'cannon');
  assert(c.buyPad(0, 'cannon')); assert.deepEqual({ ...F.pads[0] }, { t: 'cannon', l: 1 }); assert.equal(F.stones, before - cc.stones + Math.floor(spent / 2));
  assert(!c.buyPad(8, 'archer') && !c.buyPad(1, 'laser'), 'only real pads and types');
  assert(c.SIEGE_TYPES.every((t) => T0[t] && T0[t].name));
});
check('waves: level never far below the hero and climbs, more monsters each wave, a Siege Lord every 5th wave', () => {
  reset(20); const lv = [1, 5, 10, 30].map(c.siegeLevel); assert(lv.every((l, i) => !i || l >= lv[i - 1])); assert(lv[0] >= 18);
  reset(150); assert.equal(c.siegeLevel(1), 148, 'a strong hero meets level-2 monsters');
  const n = [1, 4, 9, 14].map((w) => c.siegeComposition(w).count); assert(n.every((x, i) => !i || x > n[i - 1]));
  assert(c.siegeComposition(5).boss && c.siegeComposition(10).boss && !c.siegeComposition(4).boss);
  reset(30); assert(c.startSiege()); const S = c.G.siege; S.wave = 5; assert(c.startSiegeWave()); assert.equal(S.phase, 'fight');
  run(30); assert(S.mobs.length >= c.siegeComposition(5).count, 'everything spawns through the gates');
  const lord = S.mobs.find((e) => e.bossName === 'Siege Lord'); assert(lord && lord.guardian && lord.champ && !lord.rift && lord.siege);
  assert(S.mobs.every((e) => e.siege && e.temp && c.G.ents.get(e.id) === e));
  for (const e of S.mobs) { const dx = Math.abs(e.x - c.SC.x), dz = Math.abs(e.z - c.SC.z); assert(dx <= S0.half && dz <= S0.half, 'monsters stay inside the walls'); }
  c.endSiege('leave');
});
check('undefended, the monsters march on the objectives, wreck them and the fallen Keep ends the run', () => {
  reset(30); assert(c.startSiege()); const S = c.G.siege, pl = c.G.player; pl.alive = false; // nobody to distract them
  c.startSiegeWave(); run(400);
  assert(!c.G.siege, 'the run ended'); assert(events.some((e) => e.t === 'objectiveHit')); assert(events.some((e) => e.t === 'objectiveDown' && e.main));
  const end = events.find((e) => e.t === 'siegeEnd'); assert.equal(end.why, 'keep'); assert.equal(c.G.siegeResult.why, 'keep');
  assert(!c.G.enemies.length, 'siege monsters are cleaned up'); assert.equal(c.G.obstacles, c.G.hubObstacles);
});
check('a full fort holds wave 1: towers shoot, warriors man their posts, the wave pays gold and stones, objectives mend', () => {
  reset(40, 1e12, 1e6);
  for (let i = 0; i < 8; i++) { const t = c.SIEGE_TYPES[i % 4]; c.buyPad(i, t); for (let k = 0; k < 9; k++) c.buyPad(i, t); }
  const gold0 = c.G.profile.gold, stones0 = c.fortState().stones;
  assert(c.startSiege()); const S = c.G.siege; c.G.player.alive = false;
  assert.equal(S.soldiers.length, 2 * c.siegeMen(10)); assert(S.soldiers.every((s) => s.kind === 'soldier' && s.hp > 0));
  c.startSiegeWave(); for (let t = 0; t < 120 && c.G.siege && !S.cleared; t += 0.5) run(0.5);
  assert(c.G.siege, 'the Keep stands'); assert.equal(S.cleared, 1); assert.equal(S.phase, 'clear');
  assert(shots.some((o) => o.kind === 'arrow') && shots.some((o) => o.kind === 'shell' && o.lob && o.aoe > 0) && shots.some((o) => o.kind === 'rail' && o.pierce === 3));
  assert(shots.every((o) => o.team === 'ally' || o.team === 'mob'));
  const clr = events.find((e) => e.t === 'siegeClear'); assert(clr && clr.gold > 0 && clr.stones >= 3);
  assert.equal(c.fortState().stones, stones0 + clr.stones); assert.equal(c.G.profile.gold, gold0 + clr.gold); assert.equal(c.G.profile.records.bestSiege, 1);
  run(S0.clear + 0.5); assert.equal(S.wave, 2); assert.equal(S.phase, 'build'); assert(!S.mobs.length);
  c.endSiege('leave'); assert.equal(c.G.siegeResult.cleared, 1); assert.equal(c.G.player.x, S0.gate.x + 2);
});
check('the fort waits while a menu is open, and walking off (waypoint travel) closes it', () => {
  reset(30); assert(c.startSiege()); const S = c.G.siege, t0 = S.t; c.G.modal = true; run(3); assert.equal(S.t, t0); c.G.modal = false; run(1); assert(S.t < t0);
  c.G.player.x += 500; run(0.1); assert(!c.G.siege); assert.equal(events.find((e) => e.t === 'siegeEnd').why, 'away');
});
check('a fallen hero respawns at the Keep instead of in town', () => {
  reset(30); assert(c.startSiege()); c.G.player.alive = false; run(0.1);
  assert.deepEqual({ ...c.G.respawnAt }, { x: c.SC.x + S0.spawn.x, z: c.SC.z + S0.spawn.z }); c.endSiege('leave');
});
console.log(`${passed} siege checks passed.`);
