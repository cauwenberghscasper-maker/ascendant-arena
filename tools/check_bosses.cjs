// World bosses: every boss uses real patterns and a real body; every pattern warns before it can hurt (markers at least
// 0.6 s ahead, shots only after a lane or cast ring), hits a hero who stands still, never draws past the marker caps,
// and big hits stay a fair share of the reference hero's HP. Real source slices with a tiny world stepper (like check_moves).
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let seed = +process.env.SEED || 4242, passed = 0; // SEED=n to try other rolls
const math = Object.create(Math); math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const events = [], hits = [], projs = [];
const c = { Math: math, console, LOCAL_PREVIEW: true, TEST_MODE: false, nextId: 1,
  G: { profile: { level: 30, worldTier: 0, waypoints: [0], settings: { bots: true } }, player: {}, enemies: [], ents: new Map(), time: 0, menuSafe: 0, pendingAoE: [], clouds: [], hubFighters: [], started: true },
  ev: e => events.push(Object.assign({ at: c.G.time }, e)), tickBurn() {}, boundFighter() {}, markCombat() {}, trackVel() {}, losBlocked: () => false, riftClamp() {}, champDmgFrac: () => 0.2,
  highestZone: (L) => { let zi = 0; c.config.world.zones.forEach((z, i) => { if (L >= z.minLevel) zi = i; }); return zi; },
  spawnProjectile: o => { const p = Object.assign({ hits: [], total: o.life, at: c.G.time }, o); projs.push(p); return p; },
  dealDamage: (p, amt, src) => { if (!p.alive || p.invulnT > 0) return 0; hits.push({ amt, at: c.G.time, src }); p.hp -= amt; return amt; } };
vm.createContext(c);
for (const f of ['test-mode', 'loot-collection', 'prestige', 'companions']) vm.runInContext(fs.readFileSync(path.join(root, 'assets/data', f + '.js'), 'utf8').replace(/export /g, ''), c);
vm.runInContext(section('const CFG = {', '// 2. UTIL') + section('const clamp =', '// 3. DATA') +
  section('class Grid {', '// --- entities') + section('function patrolCountFor(', 'function rewardEnemyKill(') +
  section('const CHAMP_MODS = {', 'function riftWaveLevel(') + section('function separate(', 'function endBoss(') +
  '\nthis.config = CFG; this.Grid = Grid; this.BOSSES = WORLD_BOSSES; this.PATTERNS = BOSS_PATTERNS; this.AOE_SHOWN = AOE_SHOWN; this.CONE_SHOWN = CONE_SHOWN;', c);
const W = c.config.world, G = c.G, DT = 1 / 60;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function hurt(x, z, r, dmg, team, src) { const p = G.player; if (team !== p.team && Math.hypot(p.x - x, p.z - z) <= r + p.r) c.dealDamage(p, dmg, src); }
// markers, clouds and shots resolved against the hero only (bots take no damage in the hub)
function world(dt) {
  G.time += dt; const pl = G.player;
  for (let i = G.pendingAoE.length - 1; i >= 0; i--) { const a = G.pendingAoE[i]; if ((a.t -= dt) <= 0) { if (a.team !== pl.team && c.aoeHits(a, pl)) c.dealDamage(pl, a.dmg, 'aoe'); G.pendingAoE.splice(i, 1); } }
  for (let i = G.clouds.length - 1; i >= 0; i--) { const k = G.clouds[i]; k.t -= dt; if (k.pull) c.cloudPull(k, dt); if ((k.tick -= dt) <= 0) { k.tick = c.config.elements.poison.tick; if (k.dmg > 0) hurt(k.x, k.z, k.r, k.dmg, k.team, 'cloud'); } if (k.t <= 0) G.clouds.splice(i, 1); }
  for (const p of projs) {
    if (p.dead) continue; p.life -= dt; p.x += p.vx * dt; p.z += p.vz * dt;
    if (p.lob) { if (p.life <= 0) p.dead = true; continue; }
    if (p.team !== pl.team && !p.hits.includes(1) && Math.hypot(pl.x - p.x, pl.z - p.z) < p.r + pl.r) { c.dealDamage(pl, p.dmg, 'shot'); if (p.pierce > 0) { p.pierce--; p.hits.push(1); } else p.dead = true; }
    if (p.life <= 0) p.dead = true;
  }
}
// every marker the boss places is logged with its windup and the marker counts at that moment
const placed = [];
function reset() {
  G.enemies = []; G.ents.clear(); G.pendingAoE = []; G.clouds.length = projs.length = events.length = hits.length = placed.length = 0;
  G.pendingAoE.push = function (...a) { for (const m of a) { Array.prototype.push.call(this, m); placed.push({ at: G.time, t: m.t, rings: this.filter(x => !x.cone).length, cones: this.filter(x => x.cone).length }); } return this.length; };
  G.obstacles = new c.Grid(8); G.time = 10; G.boss = null;
  G.player = { id: 1, alive: true, team: 'ally', x: 0, z: 0, r: 0.55, speed: 6.4, intent: {}, hp: 1e12, maxHp: 1000, vx: 0, vz: 0, invulnT: 0 }; G.hubFighters = [G.player];
}
// a boss in area 6 whose only pattern is `k`, the hero `dist` metres south of it and standing still
function rig(id, k, dist) {
  reset(); G.bossLair = 6; G.bossNext = id; G.bossTimer = 0; c.spawnBoss(); const b = G.boss;
  c.BOSSES.__test = Object.assign({}, c.BOSSES[id], { moves: [k], rage: [] }); b.def = '__test'; b.atkT = 0;
  Object.assign(G.player, { x: b.x, z: b.z - dist }); return b;
}
function run(id, k, dist, secs = 8) {
  const b = rig(id, k, dist); let startAt = null;
  for (let i = 0; i < secs / DT; i++) {
    if (G.boss) c.stepBoss(b, DT);
    if (startAt == null && b.last === k) startAt = G.time;
    if (b.last === k) b.atkT = 99; // one use only
    world(DT);
  }
  return { b, startAt };
}
const bodies = ['golem', 'slime', 'wolf', 'imp', 'beetle', 'wraith', 'boar', 'spider', 'yeti', 'fireimp', 'sentinel', 'crawler', 'drowned', 'seraph', 'warden'];
check('roster: two bosses per biome, real bodies, known patterns, and every pattern is used', () => {
  const B = c.BOSSES, used = new Set();
  for (let bi = 0; bi < 6; bi++) assert(Object.values(B).filter(d => d.biome === bi).length >= 2, 'biome ' + bi);
  for (const id in B) { const d = B[id]; if (id === '__test') continue;
    assert(bodies.includes(d.body), id + ' body'); assert(d.name && d.title && d.r > 0 && d.speed > 0, id);
    for (const k of d.moves.concat(d.rage)) { assert(c.PATTERNS[k], id + ' uses unknown ' + k); used.add(k); }
    assert(d.moves.length >= 4 && d.rage.length >= 2, id + ' variety'); }
  for (const k in c.PATTERNS) assert(used.has(k), k + ' unused');
});
check('the warning picks a lair in an open area and a boss of that biome, not the same one twice', () => {
  reset(); G.profile.level = 120; let prev = null;
  for (let i = 0; i < 40; i++) {
    G.player.z = W.zones[1 + (i % 10)].z0 + 5; c.pickNextBoss(); const zi = G.bossLair, Z = W.zones[zi];
    assert(zi >= 1 && zi <= c.highestZone(120), 'open area'); assert.equal(c.BOSSES[G.bossNext].biome, Z.biome);
    if (prev && c.BOSSES[prev].biome === Z.biome) assert.notEqual(G.bossNext, prev); prev = G.bossLast = G.bossNext;
  }
});
check('travel offer: the attuned waypoint nearest the lair, only when it saves a real walk', () => {
  reset(); G.bossLair = 8; const L = c.currentLair();
  G.profile.waypoints = [0]; Object.assign(G.player, { x: L.x, z: L.z - 10 }); assert.equal(c.bossWaypoint(), -1, 'standing at the lair');
  G.player.z = W.town.z; const near = W.waypoints.findIndex(w => w.zone === 8); G.profile.waypoints = [0, 3, near]; assert.equal(c.bossWaypoint(), near, 'the lair area waypoint');
  G.profile.waypoints = [0]; assert.equal(c.bossWaypoint(), -1, 'base camp waypoint saves nothing from town');
});
const dist = (P) => Math.max(P.min || 0, Math.min(P.max || 99, 6)) + ((P.min || 0) > 6 ? 0.5 : 0);
const mayMiss = ['rockRing', 'novaRings', 'brood']; // gaps you can stand in / adds instead of hits
for (const k of Object.keys(c.PATTERNS)) {
  const id = Object.keys(c.BOSSES).find(b => c.BOSSES[b].moves.concat(c.BOSSES[b].rage).includes(k));
  check(`${k} (${c.BOSSES[id].name}): drawn at least 0.6 s ahead, shots only after a warning, a hero standing still is hit`, () => {
    const P = c.PATTERNS[k], { startAt } = run(id, k, dist(P));
    assert(startAt != null, 'pattern started');
    assert(placed.every(m => m.t >= 0.6), 'marker windups ≥ 0.6 s');
    const warnAt = Math.min(...placed.map(m => m.at), ...events.filter(e => e.t === 'moveTele').map(e => e.at));
    for (const p of projs) if (p.dmg > 0) assert(p.at - warnAt >= 0.55, `shot ${(p.at - warnAt).toFixed(2)} s after the warning`);
    if (hits.length) assert(hits[0].at - warnAt >= 0.55, 'first hit comes after the warning');
    if (!mayMiss.includes(k)) assert(hits.length > 0, 'standing still gets hit');
    if (k === 'brood') assert(G.enemies.length > 0 && G.enemies.every(e => e.mirror && !e.tagged), 'loot-free adds');
  });
}
check('marker caps: with the board nearly full, patterns wait or skip beats instead of drawing too many', () => {
  for (const k of Object.keys(c.PATTERNS)) {
    const id = Object.keys(c.BOSSES).find(b => c.BOSSES[b].moves.concat(c.BOSSES[b].rage).includes(k)), b = rig(id, k, dist(c.PATTERNS[k]));
    for (let i = 0; i < c.AOE_SHOWN - 2; i++) G.pendingAoE.push({ x: 999, z: 999, r: 1, t: 100, max: 100, dmg: 0, team: 'mob', owner: -1 });
    for (let i = 0; i < c.CONE_SHOWN - 1; i++) G.pendingAoE.push({ x: 999, z: 999, r: 1, t: 100, max: 100, dmg: 0, team: 'mob', owner: -1, cone: { a: 0, half: 0.3 } });
    for (let i = 0; i < 6 / DT; i++) { c.stepBoss(b, DT); world(DT); }
    assert(placed.every(m => m.rings <= c.AOE_SHOWN && m.cones <= c.CONE_SHOWN), k + ' over the cap');
  }
});
check('big hits: every marker is at most 55% of the reference hero (×1.3 once enraged); rage below half HP speeds it up', () => {
  for (const k of Object.keys(c.PATTERNS)) {
    const id = Object.keys(c.BOSSES).find(b => c.BOSSES[b].moves.concat(c.BOSSES[b].rage).includes(k)); run(id, k, dist(c.PATTERNS[k]), 4);
    const ref = c.refHp(G.boss.lvl); for (const a of G.pendingAoE.concat(projs)) assert(a.dmg <= ref * 0.55 + 1e-6, k);
  }
  const b = rig('golem', 'slam', 6); b.hp = b.maxHp * 0.49; c.stepBoss(b, DT); assert(b.rage && events.some(e => e.t === 'bossRage'));
  assert(b.atkT < c.config.boss.attackEvery * 0.8 + c.PATTERNS.slam.busy, 'faster in a rage');
});
check('burrow stalks then erupts on its marker; leap and blink land on theirs; spiral roots the boss', () => {
  let b = rig('leviathan', 'burrowStalk', 6); c.stepBoss(b, DT); assert(b.hidden && b.invulnT > 0 && b.burrow);
  const mk = b.burrow.aoe; G.player.x += 2; for (let i = 0; i < 20; i++) c.stepBoss(b, DT); assert(Math.abs(mk.x - G.player.x) < 1e-9, 'stalks');
  for (let i = 0; i < 400 && b.burrow; i++) { c.stepBoss(b, DT); world(DT); } assert(!b.hidden && !b.invulnT, 'resurfaces');
  for (const k of ['leap', 'blink']) { b = rig(k === 'leap' ? 'golem' : 'voidcolossus', k, 9); c.stepBoss(b, DT); const m = G.pendingAoE[0]; for (let i = 0; i < 120; i++) c.stepBoss(b, DT); assert(Math.hypot(b.x - m.x, b.z - m.z) < 0.5, k + ' lands on its marker'); }
  b = rig('voidcolossus', 'spiral', 6); for (let i = 0; i < 70; i++) c.stepBoss(b, DT); assert(b.spin, 'spinning'); const x = b.x, z = b.z; G.player.z -= 3; for (let i = 0; i < 60; i++) c.stepBoss(b, DT); assert(b.x === x && b.z === z, 'rooted');
});
console.log(`${passed} boss checks passed.`);
