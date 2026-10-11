// Monster moves: every move warns before it can hurt, never hits during its windup, misses a 3 m sidestep and
// hits a hero who stands still. Real source slices (same regions as check_gameplay) with a tiny world stepper.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let seed = +process.env.SEED || 7331, passed = 0; // SEED=n to try other rolls
const math = Object.create(Math); math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const events = [], hits = [], projs = [];
const c = { Math: math, console, LOCAL_PREVIEW: true, TEST_MODE: false, nextId: 1,
  G: { profile: { level: 1, worldTier: 0 }, player: {}, enemies: [], ents: new Map(), time: 0, menuSafe: 0, pendingAoE: [], clouds: [] },
  ev: e => events.push(Object.assign({ at: c.G.time }, e)), tickBurn() {}, markCombat() {}, trackVel() {}, losBlocked: () => false, riftClamp() {}, champDmgFrac: () => 0.2,
  spawnProjectile: o => { const p = Object.assign({ hits: [], total: o.life }, o); projs.push(p); return p; },
  dealDamage: (p, amt, src) => { if (!p.alive || p.invulnT > 0) return 0; hits.push({ amt, at: c.G.time, src }); p.hp -= amt; return amt; } };
vm.createContext(c);
for (const f of ['test-mode', 'loot-collection', 'prestige', 'companions']) vm.runInContext(fs.readFileSync(path.join(root, 'assets/data', f + '.js'), 'utf8').replace(/export /g, ''), c);
vm.runInContext(section('const CFG = {', '// 2. UTIL') + section('const clamp =', '// 3. DATA') +
  section('class Grid {', '// --- entities') + section('function patrolCountFor(', 'function rewardEnemyKill(') +
  section('const CHAMP_MODS = {', 'function riftWaveLevel(') + section('function separate(', '// --- world boss') +
  '\nthis.config = CFG; this.Grid = Grid; this.MOVES = MON_MOVES;', c);
const W = c.config.world, G = c.G, DT = 1 / 60;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
// the bits of the sim step that resolve monster attacks (pendingAoE, clouds, projectiles) against the hero only
function hurt(x, z, r, dmg, team, src) { const p = G.player; if (team !== p.team && Math.hypot(p.x - x, p.z - z) <= r + p.r) c.dealDamage(p, dmg, src); }
function world(dt) {
  G.time += dt;
  for (let i = G.pendingAoE.length - 1; i >= 0; i--) { const a = G.pendingAoE[i]; if ((a.t -= dt) <= 0) { hurt(a.x, a.z, a.r, a.dmg, a.team, 'aoe'); G.pendingAoE.splice(i, 1); } }
  for (let i = G.clouds.length - 1; i >= 0; i--) { const k = G.clouds[i]; k.t -= dt; if ((k.tick -= dt) <= 0) { k.tick = c.config.elements.poison.tick; hurt(k.x, k.z, k.r, k.dmg, k.team, 'cloud'); } if (k.t <= 0) G.clouds.splice(i, 1); }
  for (const p of projs) {
    if (p.dead) continue; p.life -= dt; p.x += p.vx * dt; p.z += p.vz * dt;
    if (p.lob) { if (p.life <= 0) { p.dead = true; if (p.aoe) hurt(p.x, p.z, p.aoe, p.dmg, p.team, 'lob'); } continue; }
    const pl = G.player; if (p.team !== pl.team && !p.hits.includes(1) && Math.hypot(pl.x - p.x, pl.z - p.z) < p.r + pl.r) { c.dealDamage(pl, p.dmg, 'shot'); if (p.pierce > 0) { p.pierce--; p.hits.push(1); } else p.dead = true; }
    if (p.life <= 0) p.dead = true;
  }
}
function reset() { G.enemies = []; G.ents.clear(); G.pendingAoE.length = G.clouds.length = projs.length = events.length = hits.length = 0; G.obstacles = new c.Grid(8); G.time = 10; G.profile.level = 30; G.player = { alive: true, team: 'ally', x: 0, z: 0, r: 0.55, speed: 6.4, intent: {}, hp: 1e9, maxHp: 1000, vx: 0, vz: 0 }; }
// a monster in area 2's middle, chasing, with only `move` ready (lunges and normal attacks parked unless asked)
function rig(type, move, dist, keepAttack) {
  reset(); const Z = W.zones[2], zm = (Z.z0 + Z.z1) / 2, e = c.makeEnemy(type, 2, { patrol: 3 });
  Object.assign(e, { x: 50, z: zm, hx: 50, hz: zm, state: 'chase', atkCd: keepAttack ? 0 : 99, lungeCd: move === 'trample' ? 0 : 99 }); G.enemies.push(e);
  e.mv = c.moveState(e); for (const k in e.mv.cd) e.mv.cd[k] = k === move ? 0 : 99; e.mv.gap = 0;
  Object.assign(G.player, { x: 50, z: zm + dist }); return e;
}
const teleSeen = (since) => events.some(x => x.at >= since && (x.t === 'moveTele' || (x.t === 'telegraph' && x.len)));
// dodge(e, pl) → the 3 m sidestep direction once the windup ends; run → {teleAt, windEnd, hits during windup, hits after}
function run(type, move, dist, dodge) {
  const e = rig(type, move, dist, move === 'trample'), pl = G.player, M = e.mv; let teleAt = null, windEnd = null, moved = false, aoeAt = 0;
  for (let i = 0; i < 300 && windEnd == null; i++) {
    const winding = move === 'trample' ? e.windT > 0 : M.k === move, left = move === 'trample' ? e.windT : M.t;
    if (dodge && !moved && winding && left <= DT * 2.5 && move !== 'nova') { const [dx, dz] = dodge(e, pl); pl.x += dx * 3; pl.z += dz * 3; moved = true; }
    const before = G.pendingAoE.length; c.stepEnemy(e, DT); if (G.pendingAoE.length > before && teleAt == null) aoeAt = teleAt = G.time;
    if (teleAt == null && teleSeen(G.time)) teleAt = G.time;
    if (teleAt != null && (move === 'trample' ? e.windT <= 0 : M.k == null)) windEnd = G.time;
    if (hits.length && windEnd == null) break; // a hit before the move finished is a failure below
    world(DT);
  }
  const during = hits.filter(h => windEnd == null || h.at < windEnd).length;
  // the move is out: park the monster and let its markers, clouds and shots resolve
  if (move === 'trample') for (let i = 0; i < 60 && e.lungeT > 0; i++) { c.stepEnemy(e, DT); world(DT); } // the committed charge itself
  G.enemies.length = 0;
  if (dodge && move === 'nova') { const [dx, dz] = dodge(e, pl); pl.x += dx * 3; pl.z += dz * 3; }
  for (let i = 0; i < 240; i++) world(DT);
  return { teleAt, windEnd, during, after: hits.length - during, aoeAt, e };
}
const away = (e, pl) => { const d = Math.hypot(pl.x - e.x, pl.z - e.z) || 1; return [(pl.x - e.x) / d, (pl.z - e.z) / d]; };
const side = (e, pl) => { const [x, z] = away(e, pl); return [z, -x]; };
// nova: step toward the side of the ring that has no orb next to you
const intoGap = (e, pl) => {
  const aim = Math.atan2(pl.x - e.x, pl.z - e.z), rel = projs.map(p => Math.atan2(Math.sin(Math.atan2(p.vx, p.vz) - aim), Math.cos(Math.atan2(p.vx, p.vz) - aim)));
  const s = rel.some(r => r > 0.2 && r < 0.8) ? -1 : 1; return [Math.cos(aim) * s, -Math.sin(aim) * s];
};
const cases = [
  ['cleave', 'bramble', 2, away], ['slam', 'glacialtroll', 2.5, away], ['pounce', 'hornet', 6, side], ['trample', 'scoriascorpion', 6, side],
  ['snipe', 'myconid', 10, side], ['mortar', 'thistlehare', 8, away], ['nova', 'iceshard', 6, intoGap], ['pool', 'sulfurslime', 6, side],
];
for (const [move, type, dist, dodge] of cases) check(`${move} (${type}): red warning first, silent windup, a 3 m sidestep dodges, standing still is hit`, () => {
  assert(c.config.enemies[type].moves.includes(move), type + ' has ' + move);
  const S = c.MOVES[move]; if (S.wind) assert(S.wind >= 0.45, 'windup at least 0.45 s');
  const still = run(type, move, dist, null);
  assert(still.teleAt != null, 'telegraph emitted'); assert(still.windEnd != null, 'move resolved');
  assert.equal(still.during, 0, 'no hit during the windup'); assert(still.after > 0, 'standing still gets hit');
  assert(hits[0].at > still.teleAt, 'warning shows before the damage');
  if (move === 'trample') assert(events.some(x => x.t === 'telegraph' && x.len), 'charge lane shown');
  const dodged = run(type, move, dist, dodge);
  assert.equal(dodged.during, 0); assert.equal(dodged.after, 0, 'sidestep avoids it');
});
check('trample lays poison along the charge; mortar shells are markers first; pounce lands on its marker', () => {
  rig('scoriascorpion', 'trample', 6, true); for (let i = 0; i < 70; i++) { c.stepEnemy(G.enemies[0], DT); world(DT); } assert(G.clouds.length >= 2 && G.clouds.every(k => k.team === 'mob'));
  rig('thistlehare', 'mortar', 8); c.stepEnemy(G.enemies[0], DT); assert.equal(G.pendingAoE.length, c.MOVES.mortar.n); assert(projs.length === 3 && projs.every(p => p.lob && p.dmg === 0));
  const e = rig('hornet', 'pounce', 6); c.stepEnemy(e, DT); const a = G.pendingAoE[0]; for (let i = 0; i < 60 && e.mv.k; i++) c.stepEnemy(e, DT); assert(Math.hypot(e.x - a.x, e.z - a.z) < 1.5);
});
check('howl: a fallen pack-mate within 8 m frenzies the swarm (+40% speed)', () => {
  const pace = (frenzy) => { const e = rig('hornet', 'none', 12), o = c.makeEnemy('hornet', 2, { patrol: 4 }); Object.assign(o, { x: e.x + 3, z: e.z - 3, state: 'idle' }); G.enemies.push(o);
    c.stepEnemy(e, DT); if (frenzy) { o.alive = false; o.respawnT = 99; for (let i = 0; i < 20; i++) c.stepEnemy(e, DT); assert(e.mv.frenzyT > 0); assert(events.some(x => x.t === 'moveTele' && x.color)); }
    const z0 = e.z; for (let i = 0; i < 12; i++) c.stepEnemy(e, DT); return e.z - z0; };
  const base = pace(false), fast = pace(true); assert(fast / base > 1.3 && fast / base < 1.5, 'ratio ' + fast / base);
});
check('elites roll champion affixes (two from area 10) at mobDmg x0.6; Rift champions keep their HP-share damage', () => {
  for (const zi of [1, 4, 10, 14]) { reset(); const e = c.makeEnemy(W.zones[zi].enemy, zi, { elite: true }); Object.assign(e, { state: 'chase' }); Object.assign(G.player, { x: e.x, z: e.z + 5 }); G.enemies.push(e);
    c.stepEnemy(e, DT); assert(e.champ && e.champ.mods.length === (zi >= 10 ? 2 : 1), 'mods in area ' + zi); assert(e.champName); }
  const e = rig('bramble', 'none', 4); e.elite = true;
  c.stepEnemy(e, DT); Object.assign(e.champ, { mods: ['slam'], cd: { slam: 0 } }); e.mv.cd.cleave = e.mv.cd.slam = 99; c.stepEnemy(e, DT);
  assert(G.pendingAoE.length >= 3 && G.pendingAoE.every(a => Math.abs(a.dmg - c.mobDmg(e, 0.6, G.player)) < 1e-9));
  G.pendingAoE.length = 0; e.rift = true; e.champ.cd.slam = 0; c.stepEnemy(e, DT); assert(G.pendingAoE.length >= 3 && G.pendingAoE.every(a => a.dmg === G.player.maxHp * 0.2));
});
check('no moves toward a hero in town, in a menu or dead', () => {
  for (const f of [p => { p.alive = false; }, () => { G.menuSafe = 1; }, (p, e) => { p.x = e.x = W.town.x; p.z = W.town.z + W.town.r + 1; e.z = p.z + 2.5; e.zone = c.zoneAt(e.z); }]) {
    const e = rig('glacialtroll', 'slam', 2.5); f(G.player, e); assert(Math.hypot(G.player.x - e.x, G.player.z - e.z) < 3); for (let i = 0; i < 30; i++) c.stepEnemy(e, DT); G.menuSafe = 0;
    assert.equal(G.pendingAoE.length, 0); assert(!teleSeen(0));
  }
});
console.log(passed + ' moves checks passed.');
