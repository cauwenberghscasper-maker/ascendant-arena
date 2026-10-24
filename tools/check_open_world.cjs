// Open world (World v11): Warden Gates, routes through passes, the danger warning and the Main Path quest,
// from the real code in index.html (no browser).
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let passed = 0;
const events = [], got = { gold: 0, gems: 0, xp: 0, cases: [] };
const c = { Math, console, LOCAL_PREVIEW: false, TEST_MODE: false, nextId: 1, G: {}, ev: (e) => events.push(e),
  addGold: (n) => { got.gold += n; }, addEssence: (n) => { got.gems += n; }, addXp: (n) => { got.xp += n; }, addCase: (k, o) => got.cases.push({ k, o }),
  P: { cap: 100000 }, xpToNext: () => 100, toast() {}, showBanner() {}, markCombat() {}, tierAdd: () => 0, curTier: () => 0, tierMul: () => ({ gold: 1 }), inInstance: () => false, AREA_UNIQUE: [null, ['Vespa, Hornet Queen']].concat(Array(28).fill(['Boss'])) };
vm.createContext(c);
for (const f of ['test-mode', 'loot-collection', 'prestige', 'companions', 'heroes-v6']) vm.runInContext(fs.readFileSync(path.join(root, 'assets/data', f + '.js'), 'utf8').replace(/export /g, ''), c);
vm.runInContext(section('const CFG = {', '// 2. UTIL') + section('const clamp =', '// 3. DATA') + section('CFG.openWorld = {', '// (the save migration for profile.gates') +
  section('// a new save, or a save from the old road (World v10)', 'const Store =') +
  '\nthis.CFG = CFG; this.OW = OW; this.gateOpen = gateOpen; this.gateClamp = gateClamp; this.routeNext = routeNext; this.areaRoute = areaRoute; this.edgeBetween = edgeBetween;' +
  'this.questSteps = questSteps; this.questStep = questStep; this.questTarget = questTarget; this.questOnKill = questOnKill; this.questCheck = questCheck; this.openWorldEnter = openWorldEnter;' +
  'this.wardenKilled = wardenKilled; this.wardenInteract = wardenInteract; this.areaDanger = areaDanger; this.openWorldMigrate = openWorldMigrate; this.zoneAt = zoneAt;', c);
const W = c.CFG.world, Z = W.zones;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function reset(level = 1) {
  const p = { level, xp: 0, gates: {}, visited: [0], quest: { ch: 1, step: 0, n: 0 } };
  Object.assign(c.G, { profile: p, time: 0, dirty: false, mode: 'hub', enemies: [], player: { x: 0, z: -49, r: 0.55, alive: true } });
  c.OW.routes.clear(); c.OW.routeT = -1; c.OW.warden = null; c.OW.dangerT = {}; events.length = 0; got.gold = got.gems = got.xp = 0; got.cases = []; return p;
}

check('a shut Warden Gate holds you on your side of its pass; once beaten you walk through', () => {
  reset(40); const e = c.edgeBetween(0, 5); assert(e && e.warden && e.vert);
  const f = { x: e.x - 3, z: e.z, r: 0.55 }; c.gateClamp(f);
  for (let i = 0; i < 20; i++) { f.x += 0.5; c.gateClamp(f); }
  assert(f.x < e.x, 'stopped at the shut gate'); assert.equal(c.zoneAt(f.x, f.z), 0);
  c.G.profile.gates[e.id] = 1; for (let i = 0; i < 20; i++) { f.x += 0.5; c.gateClamp(f); }
  assert(f.x > e.x + 3, 'walked through the open gate'); assert.equal(c.zoneAt(f.x, f.z), 5);
  const g = c.edgeBetween(0, 1); assert(!g.warden && c.gateOpen(g), 'a pass inside a biome is always open');
});
check('routes walk through open passes only; the warden challenge is offered at a shut gate', () => {
  reset(1); const s1 = Z[1];
  const r = c.routeNext(0, -49, s1.cx, s1.cz), e01 = c.edgeBetween(0, 1); assert.deepEqual({ ...r }, { ...W.passSide(e01, 0) }, 'first to the mouth of the pass');
  const far = W.passSide(e01, 0), r2 = c.routeNext(far.x, far.z, s1.cx, s1.cz); assert.deepEqual({ ...r2 }, { ...W.passSide(e01, 1) }, 'then through it');
  assert.equal(c.routeNext(0, -49, Z[29].cx, Z[29].cz), null, 'Celestial Spire is behind shut Warden Gates');
  for (const e of W.edges) c.G.profile.gates[e.id] = 1; c.OW.routes.clear();
  assert(c.areaRoute(0, 29).length >= 5, 'with every gate open the far corner is reachable');
  reset(1); const e = c.edgeBetween(0, 5), m = W.passSide(e, 0); c.G.player.x = m.x; c.G.player.z = m.z;
  const it = c.wardenInteract(c.G.player); assert(it && it.kind === 'warden' && it.edge === e && /Lv 32/.test(it.label));
});
check('beating a warden opens its gate for good and pays out', () => {
  const p = reset(35), e = c.edgeBetween(0, 5);
  c.wardenKilled({ warden: e.id }); assert(p.gates[e.id] > 0); assert(c.gateOpen(e)); assert(got.gold > 0 && got.gems > 0 && got.cases.length === 1);
  assert(events.some((x) => x.t === 'gateOpen' && x.id === e.id));
});
check('walking into an area far above you warns (once a minute), never stops you', () => {
  reset(5); c.openWorldEnter(5); assert(events.some((x) => x.t === 'danger' && x.zone === 5)); events.length = 0;
  c.openWorldEnter(5); assert(!events.some((x) => x.t === 'danger'), 'not twice in a minute');
  c.G.time = 61; c.openWorldEnter(5); assert(events.some((x) => x.t === 'danger'));
  reset(28); events.length = 0; c.openWorldEnter(5); assert(!events.some((x) => x.t === 'danger'), 'level 28 is close enough for 30-35');
  assert(c.areaDanger(29, 1) && !c.areaDanger(0, 1) && !c.areaDanger(1, 1));
});
check('the Main Path walks the areas in level order: reach, hunt, a den (or the lair boss), then the Warden Gate into a new biome', () => {
  const p = reset(1), Q = c.CFG.openWorld.quest;
  assert.equal(c.questSteps(1).map((s) => s.k).join(), 'reach,kill,den');
  assert.equal(c.questSteps(4).map((s) => s.k).join(), 'reach,kill,lair,gate', 'the last woodland area ends at the Warden Gate to the mountains');
  c.openWorldEnter(1); assert.equal(c.questStep().k, 'kill');
  for (let i = 0; i < Q.kills - 1; i++) c.questOnKill({ zone: 1 }); assert.equal(p.quest.n, Q.kills - 1);
  c.questOnKill({ zone: 2 }); assert.equal(p.quest.n, Q.kills - 1, 'kills elsewhere do not count');
  c.questOnKill({ zone: 1 }); assert.equal(c.questStep().k, 'den'); const t = c.questTarget(), d = W.dens[c.questStep().den]; assert.deepEqual([t.x, t.z], [d.x, d.z]);
  for (let i = 0; i < Q.denKills; i++) c.questOnKill({ zone: 1, den: c.questStep().den }); assert.equal(p.quest.ch, 2); assert.equal(got.cases.length, 1, 'a chest per chapter');
  assert(got.gold > 0 && got.xp > 0);
  p.visited.push(2); c.questCheck(); assert.equal(c.questStep().k, 'kill', 'areas you already walked through count at once');
  // gate steps finish as soon as the gate is open (also when it was opened before)
  p.quest = { ch: 4, step: 3, n: 0 }; const g = c.edgeBetween(4, 5); assert.equal(c.questTarget().edge, g.id);
  p.gates[g.id] = 1; c.questCheck(); assert.equal(p.quest.ch, 5);
});
check('old saves: gates your level could already pass stay open and the Main Path starts at your highest area', () => {
  const p = { level: 62, stats: { zone: 9 } }; c.openWorldMigrate(p);
  assert.equal(Z[p.quest.ch].name, 'Grumbling Descent'); assert.equal(p.quest.step, 0);
  for (const e of W.edges) if (e.warden) assert.equal(!!p.gates[e.id], e.lvl <= 62, e.id);
  for (let i = 0; i <= 9; i++) assert(p.visited.includes(i));
  const n = { level: 1 }; c.openWorldMigrate(n); assert.equal(n.quest.ch, 1); assert.equal(Object.keys(n.gates).length, 0); assert.equal(n.visited.join(), '0');
  const again = JSON.parse(JSON.stringify(p)); c.openWorldMigrate(again); assert.deepEqual({ ...again.quest }, { ...p.quest }, 'running it twice changes nothing');
});
console.log(passed + ' open world checks passed.');
