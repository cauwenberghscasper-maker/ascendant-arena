// Mining: ore veins, geodes, the Museum and the mining pet, from the real code in index.html (no browser).
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let seed = 99, passed = 0;
const math = Object.create(Math); math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const events = [], got = { cases: [], gems: 0 };
const c = { Math: math, console, LOCAL_PREVIEW: false, TEST_MODE: false, nextId: 1, G: {}, ev: (e) => events.push(e),
  addCase: (k, o) => got.cases.push({ k, o }), addEssence: (n) => { got.gems += n; }, migratePets: (p) => { p.pets.sprout = { level: 1 }; } };
vm.createContext(c);
for (const f of ['test-mode', 'loot-collection', 'prestige', 'companions', 'heroes-v6']) vm.runInContext(fs.readFileSync(path.join(root, 'assets/data', f + '.js'), 'utf8').replace(/export /g, ''), c);
vm.runInContext(section('const CFG = {', '// 2. UTIL') + section('const clamp =', '// 3. DATA') + section('// --- Mining:', '// --- end mining') +
  '\nthis.CFG = CFG; this.mineState = mineState; this.pickCost = pickCost; this.geodeChance = geodeChance; this.museumBonus = museumBonus; this.isRareVein = isRareVein;', c);
const W = c.CFG.world, M = c.CFG.mining;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function reset(level = 200) { Object.assign(c.G, { profile: { level, pets: {}, mine: { ore: 0, pick: 0, mined: 0, museum: {} } }, nodes: [], dirty: false }); events.length = 0; got.cases = []; got.gems = 0; }

check('four veins per combat area, n 3 is the rare crystal vein; one runtime state per vein', () => {
  reset(); const st = c.nodeStates(); assert.equal(st.length, W.nodes.length); assert.equal(W.nodes.length, (W.zones.length - 1) * 4);
  assert(st.every((s, i) => s.q === W.nodes[i] && s.t === 0)); assert.equal(W.nodes.filter(c.isRareVein).length, W.zones.length - 1);
});
check('mining pays ore (x2 crystal, x3 rich, +20% per pickaxe level), then the vein regrows on its timer', () => {
  reset(); const st = c.nodeStates(), a = st.find((s) => !c.isRareVein(s.q)), b = st.find((s) => c.isRareVein(s.q));
  a.rich = false; const r = c.mineNode(a); assert(r.ore >= M.ore[0] && r.ore <= M.ore[1]); assert.equal(a.t, M.respawn); assert.equal(c.mineNode(a), null, 'empty vein');
  c.stepNodes(M.respawn - 1); assert(a.t > 0); c.stepNodes(1.01); assert.equal(a.t, 0); assert(c.mineNode(a));
  b.rich = true; const rb = c.mineNode(b); assert(rb.ore >= M.ore[0] * 6 && rb.ore <= M.ore[1] * 6 && rb.rich); assert.equal(b.t, M.rareRespawn); assert.equal(b.rich, false);
  c.G.profile.mine.pick = 5; a.t = 0; a.rich = false; const rp = c.mineNode(a); assert(rp.ore >= Math.round(M.ore[0] * 2) && rp.ore <= Math.round(M.ore[1] * 2));
  const m = c.G.profile.mine; assert.equal(m.mined, 4); assert.equal(m.ore, r.ore + events.filter((e) => e.t === 'mined').slice(1).reduce((s, e) => s + e.ore, 0));
  reset(1); const hi = c.nodeStates().find((s) => W.zones[s.q.zone].minLevel > 1); assert.equal(c.mineNode(hi), null, 'locked areas cannot be mined');
});
check('geodes: 2% per ore at pickaxe 0, capped at 5%, doubled in crystal veins; each geode is a case at the area level', () => {
  reset(); const m = c.mineState(); assert.equal(c.geodeChance(m, false), 0.02); m.pick = 20; assert.equal(c.geodeChance(m, false), 0.05); assert.equal(c.geodeChance(m, true), 0.1); m.pick = 0;
  let ore = 0; const st = c.nodeStates(), v = st.find((s) => !c.isRareVein(s.q) && s.q.zone === 10);
  for (let i = 0; i < 4000; i++) { v.t = 0; v.rich = false; ore += c.mineNode(v).ore; }
  const rate = got.cases.length / ore; assert(rate > 0.015 && rate < 0.025, 'geode rate ' + rate);
  assert(got.cases.every((x) => x.k === 'geode' && x.o.l === Math.max(v.q.lvl, 200)));
  assert(events.filter((e) => e.t === 'mined').reduce((s, e) => s + e.geodes, 0) === got.cases.length);
});
check('rich veins regrow about 1 time in 100', () => {
  reset(); const v = c.nodeStates()[0]; let rich = 0; for (let i = 0; i < 20000; i++) { v.t = 1; c.stepNodes(2); if (v.rich) rich++; } assert(rich > 140 && rich < 260, 'rich ' + rich);
});
check('pickaxe: costs 40 x 1.8^level ore, caps at 20, refuses without ore', () => {
  reset(); const m = c.mineState(); assert.equal(c.pickCost(0), 40); assert.equal(c.pickCost(3), Math.round(40 * 1.8 ** 3));
  assert.equal(c.upgradePick(), false); m.ore = 40; assert(c.upgradePick()); assert.equal(m.pick, 1); assert.equal(m.ore, 0);
  m.pick = 20; m.ore = 1e12; assert.equal(c.upgradePick(), false);
});
check('Museum: every geode holds a weighted mineral; each new kind adds +1% XP; rarest is 1 in 1,000', () => {
  reset(); const tot = M.minerals.reduce((s, x) => s + x[2], 0); assert(Math.abs(tot - 99.6) < 1e-9); assert(M.minerals.at(-1)[2] / tot < 0.0011);
  const seen = {}; for (let i = 0; i < 30000; i++) { const r = c.crackGeode(); seen[r.id] = (seen[r.id] || 0) + 1; }
  assert(Math.abs(seen.quartz / 30000 - 30 / tot) < 0.02); const m = c.G.profile.mine; assert.equal(Object.keys(m.museum).length, Object.keys(seen).length);
  assert.equal(c.museumBonus(c.G.profile), 0.01 * Object.keys(seen).length); assert.equal(events.filter((e) => e.t === 'mineral' && e.first).length, Object.keys(seen).length);
  assert(got.gems >= 30000 && got.gems <= 90000);
});
check('the 1 in 10,000 pet unlocks Stone Sprout early, or pays gems when you have it', () => {
  reset(); assert(c.findMiningPet()); assert(c.G.profile.pets.sprout); assert.equal(c.G.profile.petFinds.sprout, 1); assert(events.some((e) => e.t === 'minePet' && !e.had));
  const g = got.gems; assert(c.findMiningPet()); assert.equal(got.gems - g, M.petGems); assert.equal(c.G.profile.petFinds.sprout, 2);
  reset(); let pets = 0; const v = c.nodeStates()[0]; for (let i = 0; i < 60000; i++) { v.t = 0; if (c.mineNode(v).pet) pets++; } assert(pets >= 1 && pets <= 16, 'pets ' + pets);
});
console.log(`${passed} mining checks passed.`);
