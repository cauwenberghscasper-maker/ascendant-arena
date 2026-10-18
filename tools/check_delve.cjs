// Dungeon mode (party dungeons): real layout, gate, spawn, event, loot and shared-slot code from index.html (no browser).
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let seed = 777, passed = 0;
const math = Object.create(Math); math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const events = [], grants = { items: [], given: [], gems: 0, shards: 0, cases: 0, xp: 0, gold: 0 };
const c = { Math: math, console, LOCAL_PREVIEW: true, TEST_MODE: false, nextId: 1, G: {},
  ev: (e) => events.push(e), tickBurn() {}, markCombat() {}, trackVel() {}, spawnProjectile() {}, clearProjectiles() {}, toast() {}, checkAchievements() {}, addMastery() {},
  dealDamage: (p, amt) => { p.hp -= amt; if (p.hp <= 0) p.alive = false; return amt; },
  xpToNext: () => 1000, addXp: (n) => { grants.xp += n; }, addGold: (n) => { grants.gold += n; }, rollLoot: () => 'common', rarIdx: (r) => ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'ancient', 'divine'].indexOf(r),
  makeItem: (slot, rarity, ilvl, name) => ({ slot, rarity, ilvl, name: name || 'Fine ' + slot }), grantItem: (it) => grants.items.push(it), giveItem: (it) => grants.given.push(it), addEssence: (n) => { grants.gems += n; },
  dropShards: (n) => { grants.shards += n; }, addCase: () => { grants.cases++; }, weekNum: () => 42, powerOf: (f) => Math.round(Math.sqrt(Math.max(1, f.dmg) * Math.max(1, f.maxHp))) };
c.HeroSupers = { tickStatus: () => false, modDamage: (s, t, a) => a, step() {}, clear() {}, onBulletHit() {}, onBulletEnd() {}, decorateBullet() {}, lunge() {}, cast() {}, marked: [] };
vm.createContext(c);
for (const f of ['test-mode', 'loot-collection', 'prestige', 'companions', 'heroes-v6']) vm.runInContext(fs.readFileSync(path.join(root, 'assets/data', f + '.js'), 'utf8').replace(/export /g, ''), c);
vm.runInContext(section('const CFG = {', '// 2. UTIL') + section('const clamp =', '// 3. DATA') + 'const P = CFG.progression;' + section('const hpAt =', 'const ITEM_NAMES') + section('function itemStats(', 'function gearTotals(') + section('const AC =', 'const G = {') +
  section('class Grid {', '// --- entities') + section('function patrolCountFor(', 'function rewardEnemyKill(') + section('const PELLET_COLORS', '// --- hub step') +
  section('function separate(', '// --- world boss') + section('// --- world boss', 'function spawnBoss(') + section('function boundFighter(', '// --- progression') +
  section('// --- Dungeons:', '// --- end dungeons') + section('// --- Dungeon mode', '// --- end dungeon mode') + section('// Dungeon bots:', '// --- end dungeon bots') +
  '\nthis.CFG = CFG; this.Grid = Grid; this.DC = DC; this.DV = DV; this.SET_SLOTS = SET_SLOTS; Object.assign(this, { delveOpen, delveTop, delveOn, delveDef, inInstance });', c);
const DV = c.DV, defs = DV.dungeons;
DV.bots.on = false; // these checks run real-player parties; the bots (36d-delve-bots.js) need the full fighter code and are checked in the browser
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function reset(level = 200) {
  const hub = new c.Grid(6); hub.add({ x: 500, z: 500, r: 1 });
  Object.assign(c.G, { mode: 'hub', started: true, profile: { level, worldTier: 0, dungeons: {}, records: {}, runes: {}, trials: {}, nick: 'Tester' }, chain: { type: null, zone: -1, n: 0 }, enemies: [], ents: new Map(), time: 0, menuSafe: 0, rift: null, dungeon: null, boss: null,
    shrines: [], hubObstacles: hub, obstacles: hub, riftObstacles: new c.Grid(6), bossTimer: 100, bossWarned: false, respawnAt: null, pendingAoE: [] });
  c.G.profile.delve = { clears: {}, best: Object.fromEntries(defs.map((d) => [d.id, 20])), wk: { w: 0, done: {} }, pieces: {} }; // every difficulty open
  c.G.player = { id: 0, alive: true, x: 0, z: 0, r: 0.55, hp: 100, maxHp: 100, dmg: 10, ammo: 0, ammoMax: 3, speed: 6.4, intent: {}, isPlayer: true, facing: 0, invulnT: 0 };
  events.length = 0; for (const k in grants) grants[k] = Array.isArray(grants[k]) ? [] : 0;
}
function walkable(D, x, z) { const f = { x, z }; c.dungeonClamp(f, 0.55); return f.x === x && f.z === z && !c.pointBlocked(x, z, 0.55); }
function reach(D) {
  const s = 0.5, k = (x, z) => Math.round(x / s) + ',' + Math.round(z / s), seen = new Set([k(D.start.x, D.start.z)]), q = [[D.start.x, D.start.z]];
  while (q.length) { const [x, z] = q.pop(); for (const [dx, dz] of [[s, 0], [-s, 0], [0, s], [0, -s]]) { const nx = x + dx, nz = z + dz, key = k(nx, nz); if (seen.has(key) || !walkable(D, nx, nz)) continue; seen.add(key); q.push([nx, nz]); } }
  return (p) => seen.has(k(Math.round(p.x / s) * s, Math.round(p.z / s) * s));
}
const killAll = (D) => { for (const e of D.mobs) e.alive = false; };

check('layouts: same seed same dungeon, mixed hall shapes, no overlaps, events only in middle rooms and never twice', () => {
  const shapes = new Set(), evs = new Set();
  for (let s = 1; s <= 120; s++) for (const di of [0, 3, 6]) {
    const def = defs[s % defs.length], a = c.delveLayout(s * 7919, def, di), b = c.delveLayout(s * 7919, def, di);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
    const n = a.rooms.length - 1, D = c.diffDef(di); assert(n >= D.rooms[0] && n <= D.rooms[1]); assert(a.rooms[n].boss); assert.equal(a.doors.length, n);
    for (let i = 0; i <= n; i++) for (let j = i + 1; j <= n; j++) { const m = a.rooms[i], o = a.rooms[j]; assert(!(m.x0 < o.x1 && m.x1 > o.x0 && m.z0 < o.z1 && m.z1 > o.z0), 'rooms never overlap'); }
    const ev = a.rooms.filter((m) => m.event); assert(!a.rooms[0].event && !a.rooms[n].event); assert.equal(new Set(ev.map((m) => m.event)).size, ev.length);
    assert(ev.length <= D.events); ev.forEach((m) => evs.add(m.event)); a.rooms.forEach((m) => shapes.add(m.shape));
    for (const m of a.rooms) if (!m.boss) assert(m.spots.every((q) => c.inRoom(m, q.x, q.z)));
  }
  assert(shapes.size >= 5, 'hall shapes ' + [...shapes]); assert.equal(evs.size, Object.keys(DV.events).length, 'every event type shows up');
});
check('every room is reachable with doors open (pillars never wall a hall off); a shut door seals the next room', () => {
  for (let s = 1; s <= 40; s++) {
    reset(); const def = defs[s % defs.length]; assert(c.startDelve(def.id, 0, s * 104729, 1)); const D = c.G.dungeon;
    const shut = reach(D); assert(shut(D.rooms[0]) && !shut(D.rooms[1]));
    for (const d of D.doors) d.open = true; c.dungeonGrid(D);
    const ok = reach(D); for (const m of D.rooms) assert(ok(m), `room ${m.i} reachable`); for (const m of D.rooms) if (m.plates) for (const q of m.plates) assert(ok(q), 'plates reachable');
    assert(ok(D.chest) && ok(D.exit) && ok(D.exit2)); c.endDungeon('leave');
  }
});
check('power gate: team average vs requirement, a per-hero floor, harder = higher; Ascendant ranks never end', () => {
  const def = defs[2]; let last = 0;
  for (let i = 0; i < 12; i++) { const r = c.delveReq(def, i); assert(r > last, 'requirement grows'); last = r; assert(c.diffDef(i).name); }
  assert.equal(c.diffDef(4).name, 'Ascendant 1'); assert.equal(c.diffDef(9).name, 'Ascendant 6'); assert.equal(c.diffDef(10).floor, 'ancient');
  const req = c.delveReq(def, 1), g = (p) => c.delveGate(def, 1, p);
  assert(g([req]).ok && !g([req - 1]).ok); assert(g([req * 2, req * 0.8, req * 1.2]).ok, 'a strong friend lifts the average');
  if (DV.floor > 0) assert(!g([req * 3, req * DV.floor * 0.5]).ok && g([req * 3, req * DV.floor * 0.5]).weak === 1, 'nobody below the floor');
  assert(g([req, 0]).ok, 'a teammate with no Power yet does not block the team');
});
check('unlocks: a dungeon opens at its biome, the next difficulty after a clear; entry is refused above it', () => {
  reset(1); assert(!c.delveOpen(defs[0]), 'not before level 12'); assert(!c.startDelve(defs[0].id, 0, 1, 1));
  reset(200); c.G.profile.delve = undefined; assert(defs.every((d) => c.delveOpen(d))); assert.equal(c.delveTop(defs[0]), 0); assert(!c.startDelve(defs[0].id, 1, 1, 1), 'Hard is shut before a Normal clear');
  assert(defs.every((d, i) => i === 0 || c.delveMinLevel(d) >= c.delveMinLevel(defs[i - 1])), 'later biomes open later');
});
check('shared monsters: same seed → same slots, types, spots and HP in every party member\'s game; party size scales HP', () => {
  const runs = [1, 1, 3].map((n) => { reset(); assert(c.startDelve(defs[1].id, 1, 99991, n)); const D = c.G.dungeon; const out = [...D.delve.slots.entries()].map(([k, e]) => [k, e.type, Math.round(e.x * 10), Math.round(e.z * 10), e.maxHp]); c.endDungeon('leave'); return out; });
  assert.deepEqual(runs[0], runs[1]); assert.equal(runs[0].length, runs[2].length);
  runs[0].forEach((r, i) => { assert.equal(r[0], runs[2][i][0]); assert(Math.abs(runs[2][i][4] / r[4] - DV.hpParty[2]) < 0.01, 'party of 3 → HP x' + DV.hpParty[2]); });
  reset(); c.startDelve(defs[1].id, 1, 99991, 1); const D = c.G.dungeon;
  assert(D.mobs.every((e) => e.delve && e.dungeon && e.slot != null && D.delve.slots.get(e.slot) === e)); assert(D.boss.champName === defs[1].boss);
  assert(c.inInstance() && c.delveOn()); c.endDungeon('leave'); assert(!c.G.enemies.some((e) => e.delve));
});
check('rooms: doors open as rooms clear, swarm rooms send waves, the boss calls adds, then the chest and the exit', () => {
  for (let s = 1; s <= 30; s++) {
    reset(); c.startDelve(defs[s % 6].id, 2, s * 31337, 2); const D = c.G.dungeon, X = D.delve, pl = c.G.player;
    for (let k = 0; k < 5; k++) c.stepDungeon(1 / 60); assert(D.doors.every((d) => !d.open), 'no door opens while the first room still fights');
    for (let i = 0; i < D.rooms.length - 1; i++) {
      const m = D.rooms[i]; Object.assign(pl, { x: m.x, z: m.z }); c.stepDungeon(1 / 60);
      for (let k = 0; k < 6 && !D.doors[i].open; k++) {
        for (const e of m.mobs) e.alive = false;
        if (m.event === 'mimic') Object.assign(pl, { x: m.x, z: m.z });
        if (m.event === 'vault' && X.ev[m.i] && X.ev[m.i].mob) X.ev[m.i].mob.alive = false;
        c.stepDungeon(1 / 60); c.stepDungeon(1 / 60);
      }
      assert(D.doors[i].open, `door ${i} (${m.event || m.fight}) opens`);
      if (m.waves > 1) assert.equal(m.wave, m.waves - 1, 'all waves came');
    }
    assert.equal(c.claimDelveChest(), null);
    const b = D.boss; b.hp = b.maxHp * 0.4; c.stepDungeon(1 / 60); assert(D.addsDone);
    killAll(D); c.stepDungeon(1 / 60); assert(D.bossDead);
    Object.assign(pl, D.chest); assert.equal(c.dungeonInteract(pl).kind, 'dungeonChest'); Object.assign(pl, D.exit2); assert.equal(c.dungeonInteract(pl).kind, 'dungeonLeave');
    c.endDungeon('leave');
  }
});
check('events: goblin escapes on time, plates need every hero, altar curse caps health, moonwell heals once, caches pay once', () => {
  const find = (k) => { for (let s = 1; s < 500; s++) { const def = defs[s % 6], L = c.delveLayout(s * 7, def, 4); const m = L.rooms.find((r) => r.event === k); if (m) return { def, s: s * 7, i: m.i }; } };
  // vault
  { const f = find('vault'); reset(); c.startDelve(f.def.id, 4, f.s, 1); const D = c.G.dungeon, m = D.rooms[f.i], pl = c.G.player; Object.assign(pl, { x: m.x, z: m.z });
    c.stepDungeon(1 / 60); const g = D.delve.ev[m.i].mob; assert(g.goblin && g.flee && g.alive);
    for (let t = 0; t < DV.events.vault.time + 1; t += 0.5) c.stepDungeon(0.5); assert(g.escaped && !g.alive && D.delve.ev[m.i].done === 'lost' && !D.delve.bonus[m.i]); c.endDungeon('leave');
    reset(); c.startDelve(f.def.id, 4, f.s, 1); const D2 = c.G.dungeon; Object.assign(c.G.player, { x: D2.rooms[f.i].x, z: D2.rooms[f.i].z }); c.stepDungeon(1 / 60);
    D2.delve.ev[f.i].mob.alive = false; c.stepDungeon(1 / 60); assert.equal(D2.delve.bonus[f.i], 1);
    Object.assign(c.G.player, { x: D2.rooms[f.i].x, z: D2.rooms[f.i].z }); const n = c.delveInteract(c.G.player); assert.equal(n.kind, 'delveBonus');
    const r = c.delveUse('delveBonus', f.i); assert(r && !r.full && r.items.length === DV.bonus.items); assert.equal(c.delveUse('delveBonus', f.i), null, 'a cache pays once'); c.endDungeon('leave'); }
  // plates: two heroes in the run need two plates held at once
  { const f = find('plates'); reset(); c.startDelve(f.def.id, 4, f.s, 2); const D = c.G.dungeon, m = D.rooms[f.i], pl = c.G.player;
    Object.assign(pl, m.plates[0]); for (let k = 0; k < 120; k++) c.stepDungeon(1 / 60); assert(!D.delve.bonus[m.i], 'one hero cannot hold two plates');
    c.MP = { list: [{ md: 'delve', dr: D.delve.seed, alive: true, x: m.plates[1].x, z: m.plates[1].z, key: 'p2', nick: 'Friend' }] };
    for (let k = 0; k < 120; k++) c.stepDungeon(1 / 60); assert.equal(D.delve.bonus[m.i], 1); delete c.MP; c.endDungeon('leave'); }
  // altar and moonwell
  { const f = find('altar'); reset(); c.startDelve(f.def.id, 4, f.s, 1); const D = c.G.dungeon, m = D.rooms[f.i], pl = c.G.player; Object.assign(pl, { x: m.x, z: m.z });
    assert.equal(c.delveInteract(pl).kind, 'delveAltar'); assert(c.delveUse('delveAltar')); assert(D.delve.cursed && pl.hp <= pl.maxHp * DV.events.altar.hpCap);
    pl.hp = pl.maxHp; c.stepDungeon(1 / 60); assert(pl.hp <= pl.maxHp * DV.events.altar.hpCap); assert.notEqual((c.delveInteract(pl) || {}).kind, 'delveAltar'); c.endDungeon('leave'); }
  { const f = find('fountain'); reset(); c.startDelve(f.def.id, 4, f.s, 1); const D = c.G.dungeon, m = D.rooms[f.i], pl = c.G.player; Object.assign(pl, { x: m.x, z: m.z, hp: 5 });
    assert(c.delveUse('delveFountain')); assert.equal(pl.hp, pl.maxHp); assert(!c.delveUse('delveFountain'), 'once per hero'); c.endDungeon('leave'); }
  // spike hall warns red tiles near a hero inside
  { const f = find('traps'); reset(); c.startDelve(f.def.id, 4, f.s, 1); const D = c.G.dungeon, m = D.rooms[f.i]; Object.assign(c.G.player, { x: m.x, z: m.z }); c.stepDungeon(1 / 60);
    assert(c.G.pendingAoE.length > 0 && c.G.pendingAoE.every((a) => a.team === 'mob' && c.inRoom(m, a.x, a.z))); c.endDungeon('leave'); }
});
check('loot: the chest scales with difficulty, the weekly first clear is a sure set piece, best difficulty unlocks the next', () => {
  reset(); c.G.profile.delve = undefined; const def = defs[0], prof = c.G.profile;
  c.startDelve(def.id, 0, 5, 1); let D = c.G.dungeon; killAll(D); c.stepDungeon(1 / 60); let r = c.claimDelveChest();
  assert(r.full && r.weekly && r.set.length === 1 && r.set[0].dset === def.id && c.SET_SLOTS.includes(r.set[0].slot)); assert.equal(r.items.length, c.diffDef(0).items);
  assert(r.items.every((it) => c.rarIdx(it.rarity) >= c.rarIdx('rare'))); assert.equal(c.claimDelveChest(), null);
  assert.equal(prof.delve.best[def.id], 0); assert.equal(c.delveTop(def), 1); assert.equal(prof.delve.clears[def.id][0], 1); c.endDungeon('leave');
  // same week again: no sure piece; Hard is open now and pays more items at a higher floor
  reset(); c.G.profile = prof; c.startDelve(def.id, 0, 6, 1); D = c.G.dungeon; killAll(D); c.stepDungeon(1 / 60); r = c.claimDelveChest(); assert(!r.weekly); c.endDungeon('leave');
  reset(); c.G.profile = prof; assert(c.startDelve(def.id, 1, 7, 1)); D = c.G.dungeon; killAll(D); c.stepDungeon(1 / 60); r = c.claimDelveChest();
  assert(r.weekly && r.items.length === c.diffDef(1).items && r.items.every((it) => c.rarIdx(it.rarity) >= c.rarIdx('epic'))); assert.equal(c.delveTop(def), 2); c.endDungeon('leave');
  // set bonuses: 2 and 4 pieces of one set add its affixes
  const gear = {}; c.SET_SLOTS.slice(0, 4).forEach((s) => { gear[s] = { slot: s, dset: def.id }; }); const aff = {}; const cnt = c.delveSetBonus(gear, aff);
  assert.equal(cnt[def.id], 4); for (const [k, v] of Object.entries(def.set.b2)) assert(aff[k] >= v); for (const [k, v] of Object.entries(def.set.b4)) assert(aff[k] >= v);
});
check('a fall: waits for the party while a teammate stands; alone or all down the run fails and the hero respawns outside', () => {
  reset(); c.startDelve(defs[0].id, 0, 11, 2); const D = c.G.dungeon, pl = c.G.player;
  c.MP = { list: [{ md: 'delve', dr: D.delve.seed, alive: true, x: pl.x + 1, z: pl.z, key: 'p2', nick: 'Friend' }] };
  pl.alive = false; for (let k = 0; k < 300; k++) c.stepDungeon(1 / 60); assert(c.G.dungeon, 'still in while a teammate stands');
  c.delveReviveMe('Friend'); assert(pl.alive && pl.hp === pl.maxHp * 0.5);
  pl.alive = false; c.MP.list[0].alive = false; for (let k = 0; k < 200 && c.G.dungeon; k++) c.stepDungeon(1 / 60); assert.equal(c.G.dungeon, null, 'party wipe ends the run');
  assert(events.some((e) => e.t === 'dungeonEnd' && e.why === 'down' && e.delve)); assert(c.G.respawnT < 100, 'normal respawn after leaving'); delete c.MP;
});
console.log(`${passed} delve checks passed.`);
