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
  ev: e => events.push(Object.assign({ at: c.G.time }, e)), tickBurn() {}, boundFighter() {}, markCombat() {}, trackVel() {}, losBlocked: () => false, riftClamp() {}, champDmgFrac: () => 0.2,
  spawnProjectile: o => { const p = Object.assign({ hits: [], total: o.life }, o); projs.push(p); return p; },
  dealDamage: (p, amt, src) => { if (!p.alive || p.invulnT > 0) return 0; hits.push({ amt, at: c.G.time, src }); p.hp -= amt; return amt; } };
vm.createContext(c);
for (const f of ['test-mode', 'loot-collection', 'prestige', 'companions']) vm.runInContext(fs.readFileSync(path.join(root, 'assets/data', f + '.js'), 'utf8').replace(/export /g, ''), c);
vm.runInContext(section('const CFG = {', '// 2. UTIL') + section('const clamp =', '// 3. DATA') +
  section('class Grid {', '// --- entities') + section('function patrolCountFor(', 'function rewardEnemyKill(') +
  section('const CHAMP_MODS = {', 'function riftWaveLevel(') + section('function separate(', '// --- world boss') +
  '\nthis.config = CFG; this.Grid = Grid; this.MOVES = MON_MOVES; this.AOE_SHOWN = AOE_SHOWN; this.CONE_SHOWN = CONE_SHOWN;', c);
const W = c.config.world, G = c.G, DT = 1 / 60;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
// the bits of the sim step that resolve monster attacks (pendingAoE, clouds, projectiles) against the hero only
function hurt(x, z, r, dmg, team, src) { const p = G.player; if (team !== p.team && Math.hypot(p.x - x, p.z - z) <= r + p.r) c.dealDamage(p, dmg, src); }
// pendingAoE shapes (cones, donuts, one-hit volleys) and the vortex pull use the real aoeHits / cloudPull
function world(dt) {
  G.time += dt; const pl = G.player;
  for (let i = G.pendingAoE.length - 1; i >= 0; i--) { const a = G.pendingAoE[i]; if ((a.t -= dt) <= 0) { if (a.team !== pl.team && c.aoeHits(a, pl)) c.dealDamage(pl, a.dmg, 'aoe'); G.pendingAoE.splice(i, 1); } }
  for (let i = G.clouds.length - 1; i >= 0; i--) { const k = G.clouds[i]; k.t -= dt; if (k.pull) c.cloudPull(k, dt); if ((k.tick -= dt) <= 0) { k.tick = c.config.elements.poison.tick; if (k.dmg > 0) hurt(k.x, k.z, k.r, k.dmg, k.team, 'cloud'); } if (k.t <= 0) G.clouds.splice(i, 1); }
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
// dodge(e, pl) → the 3 m sidestep direction once the windup ends ([dx, dz, metres] to step another distance);
// o.walk(e, pl, dt) keeps moving the hero every frame after the windup; run → {teleAt, windEnd, hits during windup, hits after}
const stepBy = (pl, [dx, dz, m = 3]) => { pl.x += dx * m; pl.z += dz * m; };
function run(type, move, dist, dodge, o = {}) {
  const e = rig(type, move, dist, move === 'trample'), pl = G.player, M = e.mv; let teleAt = null, windEnd = null, moved = false, aoeAt = 0;
  for (let i = 0; i < 300 && windEnd == null; i++) {
    const winding = move === 'trample' ? e.windT > 0 : M.k === move, left = move === 'trample' ? e.windT : M.t;
    if (dodge && !moved && winding && left <= DT * 2.5 && move !== 'nova') { stepBy(pl, dodge(e, pl)); moved = true; }
    const before = G.pendingAoE.length; c.stepEnemy(e, DT); if (G.pendingAoE.length > before && teleAt == null) aoeAt = teleAt = G.time;
    if (teleAt == null && teleSeen(G.time)) teleAt = G.time;
    if (teleAt != null && (move === 'trample' ? e.windT <= 0 : M.k == null)) windEnd = G.time;
    if (hits.length && windEnd == null) break; // a hit before the move finished is a failure below
    world(DT);
  }
  const during = hits.filter(h => windEnd == null || h.at < windEnd).length;
  // the move is out: park the monster and let its markers, clouds and shots resolve
  if (move === 'trample') for (let i = 0; i < 60 && e.lungeT > 0; i++) { c.stepEnemy(e, DT); world(DT); } // the committed charge itself
  for (let i = 0; i < 300 && M.spinT > 0; i++) { c.stepEnemy(e, DT); if (o.walk) o.walk(e, pl, DT); world(DT); } // a spiral keeps spraying
  G.enemies.length = 0;
  if (dodge && move === 'nova') stepBy(pl, dodge(e, pl));
  for (let i = 0; i < 240; i++) { if (o.walk) o.walk(e, pl, DT); world(DT); }
  return { teleAt, windEnd, during, after: hits.length - during, aoeAt, e };
}
const away = (e, pl) => { const d = Math.hypot(pl.x - e.x, pl.z - e.z) || 1; return [(pl.x - e.x) / d, (pl.z - e.z) / d]; };
const side = (e, pl) => { const [x, z] = away(e, pl); return [z, -x]; };
// nova: step toward the side of the ring that has no orb next to you
const intoGap = (e, pl) => {
  const aim = Math.atan2(pl.x - e.x, pl.z - e.z), rel = projs.map(p => Math.atan2(Math.sin(Math.atan2(p.vx, p.vz) - aim), Math.cos(Math.atan2(p.vx, p.vz) - aim)));
  const s = rel.some(r => r > 0.2 && r < 0.8) ? -1 : 1; return [Math.cos(aim) * s, -Math.sin(aim) * s];
};
// quake: step in next to the monster, inside the donut's hole
const hug = (e, pl) => { const [x, z] = away(e, pl), d = Math.hypot(pl.x - e.x, pl.z - e.z); return [-x, -z, d - (e.r + pl.r + 0.05)]; };
const flee = (m) => (e, pl) => [...away(e, pl), m];
const walkAway = (e, pl, dt) => { const [x, z] = away(e, pl); pl.x += x * pl.speed * dt; pl.z += z * pl.speed * dt; };
const cases = [
  ['cleave', 'bramble', 2, away], ['slam', 'glacialtroll', 2.5, away], ['pounce', 'hornet', 6, side], ['trample', 'scoriascorpion', 6, side],
  ['snipe', 'myconid', 10, side], ['mortar', 'thistlehare', 8, away], ['nova', 'iceshard', 6, intoGap], ['pool', 'sulfurslime', 6, side],
  ['breath', 'emberwraith', 3, side, 'stepping out of the cone'], ['spikes', 'truffleboar', 6, side], ['quake', 'starsentry', 3.5, hug, 'stepping into the donut hole'],
  ['vortex', 'kelpie', 6, null, 'walking out against the pull', { walk: walkAway }], ['spiral', 'geodrone', 4, flee(4.4), 'backing out of its reach'],
  ['boomerang', 'dustharpy', 8, side], ['burrow', 'trenchcrawler', 6, side], ['zap', 'voidray', 8, side], ['trap', 'chillbanshee', 7, side],
];
for (const [move, type, dist, dodge, how = 'a 3 m sidestep', o = {}] of cases) check(`${move} (${type}): red warning first, silent windup, ${how} dodges, standing still is hit`, () => {
  assert(c.config.enemies[type].moves.includes(move), type + ' has ' + move);
  const S = c.MOVES[move]; if (S.wind) assert(S.wind >= 0.45, 'windup at least 0.45 s');
  const still = run(type, move, dist, null);
  assert(still.teleAt != null, 'telegraph emitted'); assert(still.windEnd != null, 'move resolved');
  assert.equal(still.during, 0, 'no hit during the windup'); assert(still.after > 0, 'standing still gets hit');
  assert(hits[0].at > still.teleAt, 'warning shows before the damage');
  if (move === 'trample') assert(events.some(x => x.t === 'telegraph' && x.len), 'charge lane shown');
  const dodged = run(type, move, dist, dodge, o);
  assert.equal(dodged.during, 0); assert.equal(dodged.after, 0, how + ' avoids it');
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
check('shapes: cone, donut and one-hit volleys; burrow hides and erupts on its marker; the vortex pull is capped and stops at the eye', () => {
  const cone = { x: 0, z: 0, r: 6, cone: { a: 0, half: 0.52 } }, donut = { x: 0, z: 0, r: 5, inner: 2 };
  assert(c.aoeCovers(cone, 0, 5, 0.5) && !c.aoeCovers(cone, 4, 3, 0.5) && !c.aoeCovers(cone, 0, -2, 0.5), 'cone: in front only');
  assert(!c.aoeCovers(donut, 1.5, 0, 0.55) && c.aoeCovers(donut, 3, 0, 0.55) && !c.aoeCovers(donut, 6, 0, 0.55), 'donut: the hole is safe');
  const grp = [], t = { id: 9, x: 0, z: 0, r: 0.5 }; assert(c.aoeHits({ x: 0, z: 0, r: 2, grp }, t) && !c.aoeHits({ x: 0.5, z: 0, r: 2, grp }, t), 'one hit per volley');
  const e = rig('trenchcrawler', 'burrow', 6); c.stepEnemy(e, DT); assert(e.hidden && e.invulnT > 0 && G.pendingAoE.length === 1, 'sinks with a marker');
  G.player.x += 2; for (let i = 0; i < 10; i++) c.stepEnemy(e, DT); assert(Math.abs(G.pendingAoE[0].x - G.player.x) < 1e-9, 'the marker stalks the hero');
  for (let i = 0; i < 50; i++) c.stepEnemy(e, DT); const mk = G.pendingAoE[0], lockX = mk.x; G.player.x += 2; for (let i = 0; i < 30 && e.mv.k; i++) c.stepEnemy(e, DT);
  assert.equal(mk.x, lockX, 'locked for the last beat'); assert(!e.hidden && !e.invulnT && Math.hypot(e.x - mk.x, e.z - mk.z) < e.r + 1.5, 'erupts on the marker');
  const e2 = rig('trenchcrawler', 'burrow', 6); c.stepEnemy(e2, DT); G.time += 1; c.stepEnemy(e2, DT); assert(!e2.hidden && !e2.invulnT, 'a dropped burrow resurfaces');
  reset(); const vc = { x: 0, z: 0, r: 5, t: 9, pull: 2.2, team: 'mob' }; Object.assign(G.player, { x: 3, z: 0 }); G.obstacles.add({ x: 1.5, z: 0.2, r: 0.4 });
  let lastX = 3; for (let i = 0; i < 600; i++) { c.cloudPull(vc, DT); const p = G.player; assert(Math.hypot(p.x - lastX, 0) <= 2.2 * DT + 0.05, 'pull speed capped'); assert(Math.hypot(p.x - 1.5, p.z - 0.2) >= 0.4 + p.r - 1e-6, 'never inside an obstacle'); lastX = p.x; }
  reset(); Object.assign(G.player, { x: 3, z: 0 }); for (let i = 0; i < 120; i++) { const x0 = G.player.x; c.cloudPull(vc, DT); assert(x0 - G.player.x <= 2.2 * DT + 1e-9 && G.player.x >= 0); }
  assert(G.player.x < 1e-9 && Math.abs(G.player.z) < 1e-9, 'stops exactly at the eye'); G.player.x = 2; G.player.invulnT = 1; c.cloudPull(vc, DT); assert.equal(G.player.x, 2, 'a dash breaks free');
});
check('mirror: only elites split; copies are frail, loot-free and vanish with the elite, on death or after ~12 s', () => {
  const mk = (alive) => { const e = rig('miragestalker', 'mirror', 6); Object.assign(e, { elite: true, champ: { mods: [], cd: {}, shieldT: 0, chargeT: 0, spinT: 0, cast: null } });
    for (let i = 0; i < 60 && G.enemies.length === 1; i++) { c.stepEnemy(e, DT); world(DT); } return e; };
  const plain = rig('miragestalker', 'mirror', 6); for (let i = 0; i < 90; i++) c.stepEnemy(plain, DT); assert.equal(G.enemies.length, 1, 'no copies from a non-elite');
  let e = mk(); const cp = G.enemies.filter(o => o.mirror); assert.equal(cp.length, 2); assert(teleSeen(0), 'spawn spots shown first');
  assert(cp.every(o => o.temp && !o.elite && o.maxHp < e.maxHp / c.config.enemies.elite.hp && G.ents.has(o.id))); cp[0].tagged = true; assert.equal(cp[0].tagged, false, 'never rewarded');
  cp[0].alive = false; cp[0].respawnT = 1e9; c.stepEnemy(cp[0], DT); assert(!G.enemies.includes(cp[0]) && !G.ents.has(cp[0].id), 'a killed copy is removed, never respawned');
  e.alive = false; c.stepEnemy(cp[1], DT); assert(!G.enemies.includes(cp[1]) && !G.ents.has(cp[1].id), 'gone with its elite');
  e = mk(); for (let i = 0; i < 13 / DT; i++) for (const o of G.enemies.slice()) if (o.mirror) c.stepEnemy(o, DT);
  assert.equal(G.enemies.filter(o => o.mirror).length, 0, 'expired');
});
check('marker cap: a move only starts when all of its markers can be drawn', () => {
  const fill = (n, cone) => { for (let i = 0; i < n; i++) G.pendingAoE.push({ x: 999, z: 999, r: 1, t: 99, max: 99, dmg: 0, team: 'mob', cone: cone ? { a: 0, half: 0.5 } : undefined }); };
  let e = rig('truffleboar', 'spikes', 6); fill(c.AOE_SHOWN - 5); c.stepEnemy(e, DT); assert(!e.mv.k && G.pendingAoE.length === c.AOE_SHOWN - 5, 'six spikes do not fit');
  e = rig('truffleboar', 'spikes', 6); fill(c.AOE_SHOWN - 6); c.stepEnemy(e, DT); assert(e.mv.k === 'spikes' && G.pendingAoE.length === c.AOE_SHOWN, 'exactly fills the cap');
  e = rig('emberwraith', 'breath', 3); fill(c.CONE_SHOWN, true); c.stepEnemy(e, DT); assert(!e.mv.k, 'cone pool full');
  e = rig('emberwraith', 'breath', 3); fill(c.AOE_SHOWN); c.stepEnemy(e, DT); assert.equal(e.mv.k, 'breath', 'cones have their own pool');
});
console.log(passed + ' moves checks passed.');
