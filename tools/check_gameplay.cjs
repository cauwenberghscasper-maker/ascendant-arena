// Real source functions; seeded placements and controlled combat targets, no browser/network.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let seed = 1949, passed = 0;
const math = Object.create(Math); math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const events = [], hits = [];
const c = { Math: math, console, LOCAL_PREVIEW: true, TEST_MODE: false, nextId: 1,
  G: { profile: { level: 1, worldTier: 0 }, player: { alive: true, x: 0, z: -49, r: .55, speed: 6.4, intent: {} }, enemies: [], ents: new Map(), time: 0, menuSafe: 0 },
  ev: e => events.push(e), tickBurn() {}, markCombat() {}, trackVel() {}, champTick: () => false, spawnProjectile() {},
  dealDamage: (p, amt) => { if (p.invulnT > 0) return 0; hits.push(amt); p.hp -= amt * (1 - Math.min(.6, p.armor || 0)); if (p.hp <= 0) p.alive = false; return amt; } };
vm.createContext(c);
for (const f of ['test-mode', 'loot-collection', 'prestige', 'companions']) vm.runInContext(fs.readFileSync(path.join(root, 'assets/data', f + '.js'), 'utf8').replace(/export /g, ''), c);
vm.runInContext(section('const CFG = {', '// 2. UTIL') + section('const clamp =', '// 3. DATA') +
  section('class Grid {', '// --- entities') + section('function zoneAt(', 'function rewardEnemyKill(') +
  section('function separate(', '// --- Rift champions:') + '\nthis.config = CFG; this.Grid = Grid;', c);
const W = c.config.world;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function reset(level = 1) { c.G.profile.level = level; c.G.profile.worldTier = 0; c.G.obstacles = new c.Grid(8); c.G.enemies = []; c.G.time = 0; c.G.enemySpawnAt = 0; c.G.player = { alive: true, x: 0, z: -49, r: .55, speed: 6.4, intent: {}, hp: 100 }; events.length = hits.length = 0; }
check('all seven zones have 48 valid patrol slots with road and flank coverage across seeded layouts', () => {
  for (let run = 0; run < 12; run++) {
    reset();
    // Padded edge crosses a spatial-grid boundary; validate against complete obstacle circles.
    for (let zi = 0; zi < 7; zi++) { const Z = W.zones[zi]; for (let n = 0; n < 60; n++) c.G.obstacles.add({ x: -120 + math.random() * 240, z: Z.z0 + 10 + math.random() * (Z.z1 - Z.z0 - 20), r: 1 + math.random() * 2 }); }
    for (let zi = 0; zi < 7; zi++) {
      const row = [];
      for (let n = 0; n < W.patrolCount; n++) { const e = c.makeEnemy(W.zones[zi].enemy, zi, { patrol: n }); c.G.enemies.push(e); row.push(e); assert(c.enemySpawnClear(e, e.x, e.z, false)); }
      assert(row.filter(e => Math.abs(e.x) < 30).length >= 12); assert(row.some(e => e.x < -90)); assert(row.some(e => e.x > 90));
      const zMin = zi === 0 ? -26 : W.zones[zi].z0 + 5, zMax = Math.min(W.zones[zi].z1, W.maxZ) - 5;
      for (let band = 0; band < 4; band++) assert(row.some(e => e.z >= zMin + (zMax - zMin) * band / 4 && e.z < zMin + (zMax - zMin) * (band + 1) / 4));
    }
  }
});
check('dens and elites use body-safe locations; no unchecked elite centre spawn', () => {
  reset(); W.dens.forEach((d, den) => { c.G.obstacles.add({ x: d.x, z: d.z, r: 3 }); for (const elite of [false, true]) { const e = c.makeEnemy(W.zones[d.zone].enemy, d.zone, { den, elite }); assert(c.enemySpawnClear(e, e.x, e.z, false)); } });
});
check('respawn cannot appear next to a hero, burst a wave, or reuse lunges and burns', () => {
  reset(); const e = c.makeEnemy('slime', 0, { patrol: 15 }); e.alive = false; c.G.player.x = e.x; c.G.player.z = e.z;
  c.respawnEnemy(e); if (e.alive) assert(Math.hypot(e.x - c.G.player.x, e.z - c.G.player.z) >= W.spawnSafeRadius);
  c.G.player.x = 0; c.G.player.z = -49; c.G.time = 10;
  const dead = Array.from({ length: 30 }, (_, patrol) => c.makeEnemy('slime', 0, { patrol }));
  for (const x of dead) { x.alive = false; x.lungeT = x.windT = x.burnT = 4; c.respawnEnemy(x); }
  assert.equal(dead.filter(x => x.alive).length, 1);
  const live = dead.find(x => x.alive); assert.equal(live.lungeT, 0); assert.equal(live.windT, 0); assert.equal(live.burnT, 0); assert(live.atkCd >= .7);
  c.G.time += .21; for (const x of dead) if (!x.alive) c.respawnEnemy(x); assert.equal(dead.filter(x => x.alive).length, 2);
});
check('occupied dens defer respawn instead of putting a monster inside the safety radius', () => {
  reset(); const e = c.makeEnemy('slime', 0, { den: 0 }); e.alive = false; c.G.player.x = W.dens[0].x; c.G.player.z = W.dens[0].z; c.respawnEnemy(e); assert.equal(e.alive, false); assert.equal(e.respawnT, 1);
});
check('field strength follows progression, practice stays gentle, locked zones and Rift levels stay authored', () => {
  for (const level of [1, 5, 10, 25, 50, 100, 200]) {
    reset(level); const e = c.makeEnemy('slime', 0, { patrol: 26 }); assert(e.lvl >= Math.max(1, level - W.catchupGap));
    const practice = { zone: 0, x: 0, z: -20, den: null, elite: false }; assert(c.enemyLevelFor(practice) <= 4);
    const rift = { rift: true, riftLvl: 12, elite: true }; assert.equal(c.enemyLevelFor(rift), 14);
    const stored = e.lvl; c.G.profile.level += 10; assert.equal(e.lvl, stored, 'no surprise mid-fight stat changes');
  }
  reset(1); const locked = c.makeEnemy('seraph', 6, { patrol: 0 }); assert(locked.lvl >= 85 && locked.lvl <= 100);
  reset(50); c.G.profile.worldTier = 1; const e = c.makeEnemy('slime', 0, { patrol: 26 }); assert(e.lvl >= 46);
});
const balance = [];
check('stationary unprotected targets can die at early and late levels; armor remains useful', () => {
  for (const level of [1, 5, 10, 25, 50, 100, 200]) {
    reset(level); const e = c.makeEnemy('slime', 0, { patrol: 26 }); c.setEnemyLevel(e, Math.max(1, level - 4));
    const hp = 100 * Math.pow(1.095, level - 1), fraction = e.atk / hp;
    assert(fraction > .05 && fraction < .15, 'unarmored single hit remains meaningful without oneshots');
    const results = [];
    for (const armor of [0, .3]) {
      const p = c.G.player; Object.assign(p, { alive: true, hp, armor, x: 80, z: 50 }); Object.assign(e, { x: 78.7, z: 50, hx: 78.7, hz: 50, state: 'chase', atkCd: 0 }); c.G.enemies = [e];
      let seconds = 0; while (p.alive && seconds < 60) { c.stepEnemy(e, 1 / 60); seconds += 1 / 60; }
      assert(!p.alive); results.push(Number(seconds.toFixed(2)));
    }
    assert(results[1] > results[0]); balance.push({ level, enemyLevel: e.lvl, hitPercent: +(fraction * 100).toFixed(2), stationarySeconds: results[0], armor30Seconds: results[1] });
  }
});
check('wolf and boar bursts show a warning, stop winding up, and preserve the dodge lane', () => {
  for (const type of ['wolf', 'boar']) {
    reset(12); const e = c.makeEnemy(type, 1, { patrol: 2 }); Object.assign(e, { x: 50, z: 150, hx: 50, hz: 150, state: 'chase', lungeCd: 0 }); Object.assign(c.G.player, { x: 50, z: 154 }); c.G.enemies = [e];
    c.stepEnemy(e, 1 / 60); assert(events.some(x => x.t === 'telegraph')); assert.equal(e.x, 50); assert.equal(e.z, 150); assert(e.windT >= .4); assert.equal(hits.length, 0);
    c.G.player.x = 54; c.G.player.z = 150; for (let i = 0; i < 40; i++) c.stepEnemy(e, 1 / 60);
    assert.equal(e.cx, 0); assert.equal(e.cz, 1); assert(e.z > 150); assert.equal(hits.length, 0, 'sidestep evades the committed burst');
  }
});
check('safe town/menu/dead-player state drops pursuit and distant idle enemies remain asleep', () => {
  reset(); const e = c.makeEnemy('slime', 0, { patrol: 30 }); e.state = 'chase'; c.stepEnemy(e, 1 / 60); assert.equal(e.state, 'return'); assert.equal(hits.length, 0);
  e.state = 'idle'; e.x = 100; e.z = 80; const before = [e.x, e.z, e.wanderT]; c.stepEnemy(e, 1); assert.deepEqual([e.x, e.z, e.wanderT], before);
});
console.log(JSON.stringify({ passed, population: W.patrolCount * 7 + W.elitesPerZone * 7 + W.dens.reduce((n, d) => n + d.n + 1, 0), balance }, null, 2));
