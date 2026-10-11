// Dungeon instances: real layout, spawn, door, reward and guard code from index.html on the real POI list (no browser).
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let seed = 4242, passed = 0;
const math = Object.create(Math); math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const events = [], grants = { items: [], gems: 0, shards: 0, cases: 0, xp: 0, gold: 0 };
const c = { Math: math, console, LOCAL_PREVIEW: true, TEST_MODE: false, nextId: 1, G: {},
  ev: (e) => events.push(e), tickBurn() {}, markCombat() {}, trackVel() {}, spawnProjectile() {}, clearProjectiles() {}, toast() {}, checkAchievements() {}, addMastery() {},
  dealDamage: (p, amt) => { p.hp -= amt; if (p.hp <= 0) p.alive = false; return amt; },
  xpToNext: () => 1000, addXp: (n) => { grants.xp += n; }, addGold: (n) => { grants.gold += n; }, rollLoot: () => 'common', rarIdx: (r) => ['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(r),
  makeItem: (slot, rarity, ilvl) => ({ slot, rarity, ilvl }), grantItem: (it) => grants.items.push(it), addEssence: (n) => { grants.gems += n; }, dropShards: (n) => { grants.shards += n; }, addCase: () => { grants.cases++; } };
vm.createContext(c);
for (const f of ['test-mode', 'loot-collection', 'prestige', 'companions']) vm.runInContext(fs.readFileSync(path.join(root, 'assets/data', f + '.js'), 'utf8').replace(/export /g, ''), c);
vm.runInContext(section('const CFG = {', '// 2. UTIL') + section('const clamp =', '// 3. DATA') + 'const P = CFG.progression;' + section('const AC =', 'const G = {') +
  section('class Grid {', '// --- entities') + section('function patrolCountFor(', 'function rewardEnemyKill(') + section('const PELLET_COLORS', '// --- hub step') +
  section('function separate(', '// --- world boss') + section('// --- world boss', 'function spawnBoss(') + section('function boundFighter(', '// --- progression') +
  section('// --- Dungeons:', '// --- end dungeons') + '\nthis.CFG = CFG; this.Grid = Grid; this.DC = DC; this.RC = RC;', c);
const W = c.CFG.world, D0 = c.CFG.dungeon;
// the real POI list from 11-world-data (Agent C): one cave per area from index 3
assert(W.pois.some((p) => p.kind !== 'dungeon'));
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function reset(level = 60) {
  const hub = new c.Grid(6); hub.add({ x: 500, z: 500, r: 1 });
  Object.assign(c.G, { mode: 'hub', started: true, profile: { level, worldTier: 0, dungeons: {}, records: {} }, enemies: [], ents: new Map(), time: 0, menuSafe: 0, rift: null, dungeon: null, boss: null,
    shrines: [], hubObstacles: hub, obstacles: hub, riftObstacles: new c.Grid(6), bossTimer: 100, bossWarned: false, respawnAt: null, pendingAoE: [] });
  c.G.player = { alive: true, x: 0, z: 0, r: 0.55, hp: 10, maxHp: 100, ammo: 0, ammoMax: 3, speed: 6.4, intent: {}, isPlayer: true, facing: 0, invulnT: 0 };
  events.length = 0; for (const k in grants) grants[k] = k === 'items' ? [] : 0;
}
const dun = W.pois.filter((p) => p.kind === 'dungeon');
assert.equal(dun.length, W.zones.length - 3); assert(dun.every((p) => /^a\d\d:dungeon:0$/.test(p.id) && p.lvl === W.zones[p.zone].lvl[1]));
function enter(poi, level) { reset(level); Object.assign(c.G.player, { x: poi.x + 1, z: poi.z + 1 }); assert(c.startDungeon(poi)); return c.G.dungeon; }
function walkable(D, x, z) { const f = { x, z }; c.dungeonClamp(f, 0.55); return f.x === x && f.z === z && !c.pointBlocked(x, z, 0.55); }
function reach(D) {
  // BFS over a 0.5 m lattice from the arrival point
  const s = 0.5, k = (x, z) => Math.round(x / s) + ',' + Math.round(z / s), seen = new Set([k(D.start.x, D.start.z)]), q = [[D.start.x, D.start.z]];
  while (q.length) { const [x, z] = q.pop(); for (const [dx, dz] of [[s, 0], [-s, 0], [0, s], [0, -s]]) { const nx = x + dx, nz = z + dz, key = k(nx, nz); if (seen.has(key) || !walkable(D, nx, nz)) continue; seen.add(key); q.push([nx, nz]); } }
  return (p) => seen.has(k(Math.round(p.x / s) * s, Math.round(p.z / s) * s));
}

check('only dungeon POIs are listed and layouts are deterministic per id', () => {
  reset(); assert.equal(c.dungeonPois().length, dun.length); assert(c.dungeonPois().every((p) => p.kind === 'dungeon'));
  const shapes = new Set();
  for (const p of dun) {
    const a = c.dungeonLayout(p.id), b = c.dungeonLayout(p.id); assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
    assert.equal(a.rooms.length, 4); assert.equal(a.cors.length, 3); assert.equal(a.doors.length, 3);
    assert(a.rooms.slice(0, 3).every((m) => m.x1 - m.x0 === D0.room)); assert.equal(a.rooms[3].h, D0.bossR);
    for (const cr of a.cors) assert.equal(cr.ax === 'z' ? cr.z1 - cr.z0 : cr.x1 - cr.x0, D0.corridor);
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const m = a.rooms[i], o = a.rooms[j]; assert(!(m.x0 < o.x1 && m.x1 > o.x0 && m.z0 < o.z1 && m.z1 > o.z0), 'rooms never overlap'); }
    shapes.add(a.rooms.map((m) => [m.x - c.DC.x, m.z - c.DC.z].join()).join('|'));
  }
  assert(shapes.size > 1, 'different ids give different layouts');
});
check('every room is reachable with doors open, and a locked door seals the next hall', () => {
  for (const p of dun) {
    const D = enter(p, 210);
    const shut = reach(D); assert(shut(D.rooms[0]), 'first hall is open'); assert(!shut(D.rooms[1]), 'door 1 blocks hall 2'); assert(!shut(D.rooms[3]));
    for (const d of D.doors) d.open = true; c.dungeonGrid(D);
    const ok = reach(D); for (const m of D.rooms) assert(ok(m), `room ${m.i} of ${p.id} reachable`); assert(ok(D.chest)); assert(ok(D.exit)); assert(ok(D.exit2));
    c.endDungeon('leave');
  }
});
check('entry: full heal, own obstacle grid, rooms hold 6/7/8 monsters plus a 2-mod mini-boss, ~25% elites', () => {
  let elites = 0, mobs = 0;
  for (const p of dun) {
    const D = enter(p, 210), pl = c.G.player;
    assert.equal(pl.hp, pl.maxHp); assert.equal(c.G.obstacles, c.G.dungeonObstacles); assert.notEqual(c.G.obstacles, c.G.hubObstacles); assert(c.inInstance());
    assert.deepEqual([...D.rooms.slice(0, 3).map((m) => m.mobs.length)], [...D0.counts]); assert.equal(D.boss.champ.mods.length, D0.boss.mods); assert(!D.boss.rift && D.boss.dungeon);
    assert(D.mobs.every((e) => c.G.enemies.includes(e) && c.G.ents.get(e.id) === e && e.dungeon && !e.rift));
    for (const m of D.rooms) for (const e of m.mobs) assert(c.inRoom(m, e.x, e.z), 'monsters spawn inside their hall');
    assert(D.rooms[0].mobs.every((e) => Math.hypot(e.x - pl.x, e.z - pl.z) > 5), 'no monster on the arrival point');
    for (const m of D.rooms.slice(0, 3)) for (const e of m.mobs) { mobs++; if (e.elite) elites++; }
    assert.deepEqual({ ...D.enterPos }, { x: p.x + 1, z: p.z + 1 }); c.endDungeon('leave');
  }
  assert(elites / mobs > 0.12 && elites / mobs < 0.4, 'elite share ' + elites / mobs);
});
check('difficulty: level max(area max, hero)+4+tier, hp x1.5, damage x1.25; boss hp x12 and damage x1.5 through mobDmg', () => {
  const p = dun[5];
  for (const [level, tier] of [[1, 0], [p.lvl + 30, 0], [80, 2]]) {
    reset(level); c.G.profile.worldTier = tier; Object.assign(c.G.player, { x: p.x, z: p.z });
    if (level < c.dungeonReq(p)) { assert(!c.startDungeon(p), 'level requirement = area unlock'); c.G.profile.level = c.dungeonReq(p); }
    assert(c.startDungeon(p)); const E = c.G.dungeon, want = Math.max(p.lvl, c.G.profile.level) + 4 + c.tierAdd();
    assert.equal(E.lvl, want); assert.equal(c.dungeonLevel(p), want);
    for (const e of E.rooms[1].mobs) {
      assert.equal(e.lvl, want);
      const ref = { type: e.type, elite: e.elite }; c.setEnemyLevel(ref, want);
      assert(Math.abs(e.maxHp - Math.round(ref.maxHp * 1.5)) <= 1); assert(Math.abs(e.atk / ref.atk - 1.25) < 1e-9); assert(Math.abs(c.mobDmg(e, 1, c.G.player) / c.mobDmg(ref, 1, c.G.player) - 1.25) < 1e-9);
    }
    const b = E.boss, ref = { type: b.type, elite: false }; c.setEnemyLevel(ref, want + 2);
    assert(Math.abs(b.maxHp / (ref.maxHp * 1.5 * 12) - 1) < 1e-3); const eref = { type: b.type, elite: true }; c.setEnemyLevel(eref, want + 2); assert(Math.abs(b.atk / eref.atk - 1.5) < 1e-9);
    // champion attacks resolve through mobDmg, not the Rift's share-of-max-HP
    const pl = c.G.player; Object.assign(pl, { x: b.x + 1, z: b.z, hp: 1e12, maxHp: 1e12 }); b.champ.chargeT = 0.5; b.champ.hitDone = false; b.champ.cx = 1; b.champ.cz = 0; b.x = pl.x - 0.5;
    const want2 = c.mobDmg(b, 1, pl); c.champTick(b, 1 / 60, pl, 0.5); assert(Math.abs(1e12 - pl.hp - want2) < 1, 'charge hit = full mobDmg');
    c.endDungeon('leave');
  }
});
check('dungeon monsters never respawn and stay inside the halls', () => {
  const D = enter(dun[2], 60), e = D.rooms[0].mobs[0];
  e.alive = false; e.respawnT = 0; for (let i = 0; i < 600; i++) c.stepEnemy(e, 1 / 60); assert.equal(e.alive, false);
  const m = D.rooms[1].mobs[0]; m.x = c.DC.x + 500; m.z = c.DC.z + 500; c.G.player.x = m.x + 3; c.G.player.z = m.z; m.state = 'chase';
  c.stepEnemy(m, 1 / 60); assert(Math.hypot(m.x - c.DC.x, m.z - c.DC.z) < 120, 'no zone clamp pulls it back to the hub');
  c.endDungeon('leave');
});
check('doors unlock as halls clear; boss summons adds at half health; chest after the boss', () => {
  const D = enter(dun[4], 100), cnt = () => c.G.dungeonObstacles.list.length, n0 = cnt();
  c.stepDungeon(1 / 60); assert(D.doors.every((d) => !d.open));
  D.rooms[0].mobs.forEach((e) => { e.alive = false; }); c.stepDungeon(1 / 60);
  assert(D.doors[0].open && !D.doors[1].open && D.rooms[0].cleared); assert(cnt() < n0); assert.equal(c.G.obstacles, c.G.dungeonObstacles);
  assert(events.some((x) => x.t === 'dungeonRoom' && x.i === 1 && x.n === 3));
  D.rooms[1].mobs.forEach((e) => { e.alive = false; }); D.rooms[2].mobs.forEach((e) => { e.alive = false; }); c.stepDungeon(1 / 60);
  assert(D.doors.every((d) => d.open)); assert(events.some((x) => x.t === 'dungeonRoom' && x.boss));
  assert.equal(c.claimDungeonChest(), null, 'no chest before the boss');
  const before = c.G.enemies.length; D.boss.hp = D.boss.maxHp * 0.4; c.stepDungeon(1 / 60); c.stepDungeon(1 / 60);
  assert.equal(c.G.enemies.length, before + D0.boss.adds); assert(D.addsDone);
  D.boss.alive = false; c.stepDungeon(1 / 60); assert(D.bossDead); assert(events.some((x) => x.t === 'dungeonBoss'));
  Object.assign(c.G.player, D.chest); assert.equal(c.dungeonInteract(c.G.player).kind, 'dungeonChest');
  Object.assign(c.G.player, D.exit); assert.equal(c.dungeonInteract(c.G.player).kind, 'dungeonLeave');
  Object.assign(c.G.player, D.exit2); assert.equal(c.dungeonInteract(c.G.player).kind, 'dungeonLeave');
  Object.assign(c.G.player, { x: D.rooms[1].x, z: D.rooms[1].z }); assert.equal(c.dungeonInteract(c.G.player), null);
  c.endDungeon('leave'); assert(!c.G.enemies.some((e) => e.dungeon)); assert(![...c.G.ents.values()].some((e) => e.dungeon));
});
function clear(D) { for (const e of D.mobs) e.alive = false; c.stepDungeon(1 / 60); assert(D.bossDead); }
check('chest: rare+ items at ilvl +4 (epic+ from area 15), gems, shards; 20 min cooldown per id leaves only XP and gold', () => {
  for (const p of [dun[0], dun.find((x) => x.zone >= 15)]) {
    let D = enter(p, 90); clear(D); const r = c.claimDungeonChest();
    assert(r.full); assert.equal(r.items.length, D0.chest.items); assert(r.items.every((it) => c.rarIdx(it.rarity) >= (p.zone >= 15 ? 3 : 2) && it.ilvl === Math.max(p.lvl, 90) + 4));
    assert(grants.gems > 0 && grants.shards > 0 && grants.xp > 0 && grants.gold > 0); assert.equal(c.claimDungeonChest(), null, 'one chest per run');
    const rec = c.G.profile.dungeons[p.id]; assert.equal(rec.clears, 1); assert(Date.now() - rec.t < 5000);
    const prof = c.G.profile; c.endDungeon('leave');
    // a second clear inside the cooldown: XP and gold only
    reset(90); c.G.profile = prof; Object.assign(c.G.player, { x: p.x, z: p.z }); assert(c.startDungeon(p)); D = c.G.dungeon; clear(D);
    assert(c.dungeonCdLeft(p.id) > D0.cooldown - 10); const r2 = c.claimDungeonChest();
    assert(!r2.full && !r2.items.length && !r2.gems && grants.items.length === 0 && grants.shards === 0 && grants.xp > 0 && grants.gold > 0); assert.equal(prof.dungeons[p.id].clears, 2);
    c.endDungeon('leave');
    // the cooldown is per dungeon id and expires
    prof.dungeons[p.id].t = Date.now() - (D0.cooldown + 1) * 1000; assert.equal(c.dungeonCdLeft(p.id), 0);
    reset(90); c.G.profile = prof; Object.assign(c.G.player, { x: p.x, z: p.z }); assert(c.startDungeon(p)); clear(c.G.dungeon); assert(c.claimDungeonChest().full); c.endDungeon('leave');
  }
  // the 10% case roll lands about one run in ten
  let cases = 0; for (let i = 0; i < 200; i++) { const D = enter(dun[1], 60); clear(D); cases += c.claimDungeonChest().case ? 1 : 0; c.endDungeon('leave'); }
  assert(cases > 6 && cases < 40, 'case rolls ' + cases);
});
check('instances exclude each other, shrines and world tier changes; boss timer pauses inside', () => {
  reset(60); const p = dun[3]; Object.assign(c.G.player, { x: p.x, z: p.z });
  c.G.rift = { floor: 1 }; assert(!c.startDungeon(p), 'no dungeon from the Rift'); c.G.rift = null;
  c.G.boss = { x: p.x + 5, z: p.z }; assert(!c.startDungeon(p), 'not mid world-boss fight'); c.G.boss = null;
  c.G.player.alive = false; assert(!c.startDungeon(p)); c.G.player.alive = true;
  assert(!c.startDungeon(W.pois.find((x) => x.kind !== 'dungeon')));
  assert(c.startDungeon(p)); assert(!c.startDungeon(p), 'already inside');
  assert.equal(c.startRift(1), false, 'no Rift from a dungeon'); assert.equal(c.G.rift, null);
  assert.equal(c.setWorldTier(0), false);
  c.G.bossTimer = 5; c.stepBossTimer(10); assert.equal(c.G.bossTimer, 5); assert.equal(c.G.bossWarned, false);
  const sh = { i: 0, x: c.G.player.x, z: c.G.player.z, zone: 3, state: 'ready', t: 0, cd: 0, wave: [] }; c.G.shrines = [sh]; c.stepShrines(1 / 60); assert.equal(sh.state, 'ready', 'shrines stay asleep');
  c.endDungeon('leave'); c.G.shrines = [];
  c.G.bossTimer = 500; c.stepBossTimer(1); assert.equal(c.G.bossTimer, 499, 'timer resumes in the hub');
});
check('leaving, falling or being carried away ends the instance and restores the hub', () => {
  const p = dun[6];
  let D = enter(p, 120), pl = c.G.player; pl.hp = 3;
  pl.x = D.rooms[0].x + 40; pl.z = D.rooms[0].z - 60; c.boundFighter(pl, 'hub'); assert(walkable(D, pl.x, pl.z) || D.rooms.some((m) => c.inRoom(m, pl.x, pl.z)) || D.cors.some((m) => c.inRoom(m, pl.x, pl.z)), 'box clamp keeps the hero inside');
  c.endDungeon('leave');
  assert.equal(c.G.dungeon, null); assert.equal(c.G.obstacles, c.G.hubObstacles); assert.deepEqual({ x: pl.x, z: pl.z }, { ...D.enterPos }); assert.equal(pl.hp, pl.maxHp); assert(!c.inInstance());
  assert(events.some((x) => x.t === 'dungeonEnd' && x.why === 'leave'));
  D = enter(p, 120); pl = c.G.player; pl.alive = false; c.stepDungeon(1 / 60);
  assert.equal(c.G.dungeon, null); assert.deepEqual({ ...c.G.respawnAt }, { ...D.enterPos }); assert.equal(c.G.obstacles, c.G.hubObstacles); assert(!c.G.enemies.length);
  D = enter(p, 120); pl = c.G.player; pl.x = 50; pl.z = 900; c.stepDungeon(1 / 60);
  assert.equal(c.G.dungeon, null); assert.deepEqual({ x: pl.x, z: pl.z }, { x: 50, z: 900 }, 'travel keeps where you went'); assert.equal(c.G.zoneIdx, c.zoneAt(900));
});
console.log(`${passed} dungeon checks passed.`);
