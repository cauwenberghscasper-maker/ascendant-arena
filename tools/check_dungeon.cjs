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
  makeItem: (slot, rarity, ilvl) => ({ slot, rarity, ilvl, name: 'Fine ' + slot }), grantItem: (it) => grants.items.push(it), addEssence: (n) => { grants.gems += n; }, dropShards: (n) => { grants.shards += n; }, addCase: () => { grants.cases++; } };
c.HeroSupers = { tickStatus: () => false, modDamage: (s, t, a) => a, step() {}, clear() {}, onBulletHit() {}, onBulletEnd() {}, decorateBullet() {}, lunge() {}, cast() {}, marked: [] }; // Codex hero supers are drawn and scripted in the browser
vm.createContext(c);
for (const f of ['test-mode', 'loot-collection', 'prestige', 'companions', 'heroes-v6']) vm.runInContext(fs.readFileSync(path.join(root, 'assets/data', f + '.js'), 'utf8').replace(/export /g, ''), c);
vm.runInContext(section('const CFG = {', '// 2. UTIL') + section('const clamp =', '// 3. DATA') + 'const P = CFG.progression;' + section('const AC =', 'const G = {') +
  section('class Grid {', '// --- entities') + section('function patrolCountFor(', 'function rewardEnemyKill(') + section('const PELLET_COLORS', '// --- hub step') +
  section('function separate(', '// --- world boss') + section('// --- world boss', 'function spawnBoss(') + section('function boundFighter(', '// --- progression') +
  section('// --- Dungeons:', '// --- end dungeons') + '\nthis.CFG = CFG; this.Grid = Grid; this.DC = DC; this.RC = RC; this.runesLit = runesLit; this.trialOpen = trialOpen; this.radiantOdds = radiantOdds;', c);
const W = c.CFG.world, D0 = c.CFG.dungeon;
// the real POI list from 11-world-data (Agent C): one cave per area from index 3
assert(W.pois.some((p) => p.kind !== 'dungeon'));
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function reset(level = 60) {
  const hub = new c.Grid(6); hub.add({ x: 500, z: 500, r: 1 });
  Object.assign(c.G, { mode: 'hub', started: true, profile: { level, worldTier: 0, dungeons: {}, records: {}, runes: {}, trials: {} }, chain: { type: null, zone: -1, n: 0 }, enemies: [], ents: new Map(), time: 0, menuSafe: 0, rift: null, dungeon: null, boss: null,
    shrines: [], hubObstacles: hub, obstacles: hub, riftObstacles: new c.Grid(6), bossTimer: 100, bossWarned: false, respawnAt: null, pendingAoE: [] });
  c.G.player = { alive: true, x: 0, z: 0, r: 0.55, hp: 10, maxHp: 100, ammo: 0, ammoMax: 3, speed: 6.4, intent: {}, isPlayer: true, facing: 0, invulnT: 0 };
  events.length = 0; for (const k in grants) grants[k] = k === 'items' ? [] : 0;
}
const dun = W.pois.filter((p) => p.kind === 'dungeon');
assert.equal(dun.length, (W.zones.length - 1) * 3); assert(dun.every((p) => /^a\d\d:dungeon:[012]$/.test(p.id) && p.lvl === W.zones[p.zone].lvl[1]));
const VR = (p) => D0.variants[+p.id.slice(-1)];
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
    const n = VR(p).counts.length; assert.equal(a.rooms.length, n + 1); assert.equal(a.cors.length, n); assert.equal(a.doors.length, n);
    assert(a.rooms.slice(0, n).every((m) => m.x1 - m.x0 === D0.room)); assert.equal(a.rooms[n].h, D0.bossR); assert(a.rooms[n].boss);
    for (const cr of a.cors) assert.equal(cr.ax === 'z' ? cr.z1 - cr.z0 : cr.x1 - cr.x0, D0.corridor);
    for (let i = 0; i < a.rooms.length; i++) for (let j = i + 1; j < a.rooms.length; j++) { const m = a.rooms[i], o = a.rooms[j]; assert(!(m.x0 < o.x1 && m.x1 > o.x0 && m.z0 < o.z1 && m.z1 > o.z0), 'rooms never overlap'); }
    shapes.add(a.rooms.map((m) => [m.x - c.DC.x, m.z - c.DC.z].join()).join('|'));
  }
  assert(shapes.size > 1, 'different ids give different layouts');
});
check('every room is reachable with doors open, and a locked door seals the next hall', () => {
  for (const p of dun) {
    const D = enter(p, 210);
    const shut = reach(D); assert(shut(D.rooms[0]), 'first hall is open'); assert(!shut(D.rooms[1]), 'door 1 blocks hall 2'); assert(!shut(D.rooms.at(-1)));
    for (const d of D.doors) d.open = true; c.dungeonGrid(D);
    const ok = reach(D); for (const m of D.rooms) assert(ok(m), `room ${m.i} of ${p.id} reachable`); assert(ok(D.chest)); assert(ok(D.exit)); assert(ok(D.exit2));
    c.endDungeon('leave');
  }
});
check('entry: full heal, own obstacle grid, halls hold the variant counts plus its mini-boss; Caves ~25% elites, Sanctum mostly elites', () => {
  let elites = 0, mobs = 0, sElites = 0, sMobs = 0;
  for (const p of dun) {
    const D = enter(p, 210), pl = c.G.player;
    assert.equal(pl.hp, pl.maxHp); assert.equal(c.G.obstacles, c.G.dungeonObstacles); assert.notEqual(c.G.obstacles, c.G.hubObstacles); assert(c.inInstance());
    const V = VR(p), n = V.counts.length; assert.deepEqual([...D.rooms.slice(0, n).map((m) => m.mobs.length)], [...V.counts]); assert.equal(D.boss.champ.mods.length, V.mods); assert(!D.boss.rift && D.boss.dungeon);
    assert(D.mobs.every((e) => c.G.enemies.includes(e) && c.G.ents.get(e.id) === e && e.dungeon && !e.rift));
    for (const m of D.rooms) for (const e of m.mobs) assert(c.inRoom(m, e.x, e.z), 'monsters spawn inside their hall');
    assert(D.rooms[0].mobs.every((e) => Math.hypot(e.x - pl.x, e.z - pl.z) > 5), 'no monster on the arrival point');
    for (const m of D.rooms.slice(0, n)) for (const e of m.mobs) if (V === D0.variants[0]) { mobs++; if (e.elite) elites++; } else if (V === D0.variants[2]) { sMobs++; if (e.elite) sElites++; }
    assert.deepEqual({ ...D.enterPos }, { x: p.x + 1, z: p.z + 1 }); c.endDungeon('leave');
  }
  assert(elites / mobs > 0.12 && elites / mobs < 0.4, 'elite share ' + elites / mobs); assert(sElites / sMobs > 0.45, 'sanctum elite share ' + sElites / sMobs);
});
check('difficulty: level area max+4+tier (never the hero level), hp x1.5, damage x1.25; Caves boss hp x12 and damage x1.5 through mobDmg', () => {
  const p = dun.filter((x) => x.id.endsWith(':0'))[5];
  for (const [level, tier] of [[1, 0], [p.lvl + 30, 0], [80, 2]]) {
    reset(level); c.G.profile.worldTier = tier; Object.assign(c.G.player, { x: p.x, z: p.z });
    if (level < c.dungeonReq(p)) { assert(!c.startDungeon(p), 'level requirement = area unlock'); c.G.profile.level = c.dungeonReq(p); }
    assert(c.startDungeon(p)); const E = c.G.dungeon, want = p.lvl + 4 + c.tierAdd();
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
  const D = enter(dun.find((p) => p.id.endsWith(':0')), 100), cnt = () => c.G.dungeonObstacles.list.length, n0 = cnt();
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
check('chest: first clear rare+ items at ilvl +4 (epic+ from area 15), gems, shards and a Tier 1 key; a plain repeat pays XP, gold and a key', () => {
  for (const p of [dun[0], dun.find((x) => x.zone >= 15)]) {
    let D = enter(p, 90); clear(D); const r = c.claimDungeonChest();
    assert(r.full); assert.equal(r.items.length, D0.chest.items); assert(r.items.every((it) => c.rarIdx(it.rarity) >= (p.zone >= 15 ? 3 : 2) && it.ilvl === Math.max(p.lvl, 90) + 4));
    assert(grants.gems > 0 && grants.shards > 0 && grants.xp > 0 && grants.gold > 0); assert.equal(c.claimDungeonChest(), null, 'one chest per run');
    assert.equal(r.key.t, 1); assert.equal(c.G.profile.keys.length, 1);
    const rec = c.G.profile.dungeons[p.id]; assert.equal(rec.clears, 1);
    const prof = c.G.profile; c.endDungeon('leave'); assert.equal(prof.keys.length, 1, 'a cleared plain run gives nothing back on leaving');
    reset(90); c.G.profile = prof; Object.assign(c.G.player, { x: p.x, z: p.z }); assert(c.startDungeon(p)); D = c.G.dungeon; clear(D);
    const r2 = c.claimDungeonChest();
    assert(!r2.full && !r2.items.length && !r2.gems && grants.items.length === 0 && grants.shards === 0 && grants.xp > 0 && grants.gold > 0); assert.equal(prof.dungeons[p.id].clears, 2);
    assert.equal(prof.keys.length, 2); c.endDungeon('leave');
  }
  // the 10% case roll lands about one run in ten
  let cases = 0; for (let i = 0; i < 200; i++) { const D = enter(dun[1], 60); clear(D); cases += c.claimDungeonChest().case ? 1 : 0; c.endDungeon('leave'); }
  assert(cases > 6 && cases < 40, 'case rolls ' + cases);
});
check('keys: used up on entry, +1 monster level per tier, affixes apply; par time sets the upgrade; failing hands it back one tier lower', () => {
  const p = dun.find((x) => x.id.endsWith(':2')), par = VR(p).par;
  const run = (key, secs) => { reset(90); c.G.profile.keys = [key]; Object.assign(c.G.player, { x: p.x, z: p.z }); const base = c.dungeonLevel(p);
    assert(c.startDungeon(p, 0)); const D = c.G.dungeon; assert.equal(c.G.profile.keys.length, 0, 'key consumed'); assert.equal(D.lvl, base + key.t);
    if (secs == null) return D; c.G.time = secs; clear(D); return D; };
  for (const [secs, up] of [[par * 0.4, 3], [par * 0.7, 2], [par * 0.95, 1], [par * 2, 0]]) {
    const D = run({ t: 6, a: [] }, secs); assert.equal(D.newKey.t, 6 + up, `clear in ${secs}s`); assert.equal(c.G.profile.keys[0].t, 6 + up);
    assert(events.some((x) => x.t === 'dungeonBoss' && x.up === up)); c.endDungeon('leave'); assert.equal(c.G.profile.keys.length, 1);
  }
  let D = run({ t: 6, a: [] }); c.endDungeon('leave'); assert.equal(c.G.profile.keys[0].t, 5, 'leaving early: one tier lower');
  D = run({ t: 1, a: [] }); c.G.player.alive = false; c.stepDungeon(1 / 60); assert.equal(c.G.profile.keys[0].t, 1, 'never below tier 1');
  // keyed chest: always full, ilvl and gems grow with tier, tier 15+ floors at legendary, Bountiful adds an item
  D = run({ t: 15, a: ['bountiful', 'gilded'] }, 1); const r = c.claimDungeonChest();
  assert(r.full); assert.equal(r.items.length, Math.min(6, D0.chest.items + 3) + 1); assert(r.items.every((it) => c.rarIdx(it.rarity) >= 4 && it.ilvl === 90 + 4 + 15));
  assert.equal(c.G.profile.records.bestKey, 18); assert.equal(c.G.profile.dungeons[p.id].best, 15); c.endDungeon('leave');
  // Bulwark / Brutal / Swift reach every monster
  D = run({ t: 3, a: ['bulwark', 'brutal', 'swift'] }); const plain = (() => { c.endDungeon('leave'); return run({ t: 3, a: [] }); })();
  c.endDungeon('leave'); D = run({ t: 3, a: ['bulwark', 'brutal', 'swift'] });
  const e = D.rooms[0].mobs[0], ref = { type: e.type, elite: e.elite }; c.setEnemyLevel(ref, D.lvl);
  assert(Math.abs(e.maxHp / Math.round(ref.maxHp * 1.5) - 1.4) < 0.01); assert(Math.abs(e.atk / ref.atk - 1.25 * 1.3) < 1e-9); assert.equal(e.spd, 1.2); assert(plain.rooms[0].mobs.every((m) => !m.spd));
  c.endDungeon('leave');
  // the key list stays sorted best-first and capped
  reset(90); for (let t = 1; t <= 20; t++) c.addKey(c.makeKey(t)); const ks = c.G.profile.keys;
  assert.equal(ks.length, D0.keys.max); assert.equal(ks[0].t, 20); assert(ks.every((k, i) => !i || ks[i - 1].t >= k.t)); assert(ks.every((k) => k.a.length === Math.min(3, 1 + Math.floor(k.t / 8)) && new Set(k.a).size === k.a.length));
  assert(!c.startDungeon(p, 99), 'missing key index refuses entry');
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
check('Legendary Trial: sealed until all four runestones of the area are lit; one arena, a 4-affix champion at +6 levels, no keys', () => {
  reset(90); const zi = 7, tp = c.trialPoi(zi), runes = W.runes.filter((q) => q.zone === zi);
  assert.equal(runes.length, 4); assert.equal(c.trialPoi(zi), tp, 'one stable object per area'); assert.equal(c.trialPoi(0), null, 'no trial in Base Camp');
  assert.equal(tp.name, W.pois.find((q) => q.zone === zi && q.major).name + ' Trial');
  Object.assign(c.G.player, { x: tp.x, z: tp.z });
  runes.slice(0, 3).forEach((q) => { c.G.profile.runes[q.id] = 1; }); assert.equal(c.runesLit(zi), 3); assert(!c.startDungeon(tp), 'three runes are not enough');
  c.G.profile.runes[runes[3].id] = 1; assert(c.trialOpen(zi)); c.G.profile.keys = [{ t: 5, a: [] }]; assert(!c.startDungeon(tp, 0), 'keys do not fit a trial');
  assert(c.startDungeon(tp)); const D = c.G.dungeon;
  assert.equal(D.rooms.length, 1); assert(D.rooms[0].boss); assert.equal(D.doors.length, 0); assert.equal(D.boss.champ.mods.length, 4);
  assert.equal(D.lvl, tp.lvl + 4 + 6); assert.equal(D.mobs.length, 1);
  assert(reach(D)(D.boss), 'the champion is reachable from the arrival point');
  clear(D); assert.equal(D.newKey, null); assert.equal(c.G.profile.keys.length, 1);
  const r = c.claimDungeonChest(); assert(!r.full && !r.items.length); assert.equal(r.sigils, 1); assert.equal(c.trialState(zi).n, 1);
  c.endDungeon('leave'); assert.equal(c.G.profile.keys.length, 1, 'a cleared trial hands back nothing extra');
});
check('Radiant: 1 in 500 base, kill chain raises it to at most x4; the drop is an Ancient, counted, announced; sigils forge the Mythic relic', () => {
  reset(90); const T = D0.trial;
  assert.equal(c.radiantOdds(), 500); c.G.chain.n = 25; assert.equal(c.radiantOdds(), 250); c.G.chain.n = 75; assert.equal(c.radiantOdds(), 125); c.G.chain.n = 5000; assert.equal(c.radiantOdds(), 125);
  const zi = 9, tp = c.trialPoi(zi); W.runes.filter((q) => q.zone === zi).forEach((q) => { c.G.profile.runes[q.id] = 1; });
  // over many trials the base rate lands near 1/500
  c.G.chain.n = 0; let rad = 0; const N = 6000;
  for (let i = 0; i < N; i++) { Object.assign(c.G.player, { x: tp.x, z: tp.z }); assert(c.startDungeon(tp)); clear(c.G.dungeon); if (c.claimDungeonChest().radiant) rad++; c.endDungeon('leave'); }
  assert(rad >= 4 && rad <= 25, 'radiants ' + rad); const S = c.trialState(zi); assert.equal(S.n, N); assert.equal(S.rad, rad);
  T.radiant = 1; events.length = 0; Object.assign(c.G.player, { x: tp.x, z: tp.z }); c.startDungeon(tp); clear(c.G.dungeon); const r = c.claimDungeonChest(); T.radiant = 500; c.endDungeon('leave');
  assert(r.radiant && r.radiant.radiant && r.radiant.rarity === 'ancient' && /^Radiant /.test(r.radiant.name)); assert(events.some((x) => x.t === 'radiant' && x.n === N + 1));
  S.sig = T.sigilCost - 1; assert.equal(c.forgeTrialRelic(zi), null);
  S.sig = T.sigilCost + 3; const it = c.forgeTrialRelic(zi); assert.equal(it.rarity, 'mythic'); assert.equal(S.sig, 3); assert(it.name.startsWith(tp.landmark));
});
console.log(`${passed} dungeon checks passed.`);
