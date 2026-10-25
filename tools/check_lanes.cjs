// Ascendant Lanes: the level-matching pieces and the save, from the real code in index.html (no browser).
// The match itself (minions, towers, bots, the view) is played in the browser smoke test.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let passed = 0; const check = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };
const c = { Math, CFG: { enemies: {} }, clamp: (v, a, b) => Math.max(a, Math.min(b, v)) };
vm.createContext(c);
vm.runInContext(section('CFG.lanes = {', 'const LN_TEAMS') + section('// --- Lanes rating', '// --- end Lanes rating') + section('function lanesTeams(', 'function lanesGoMsg(') +
  '\nthis.lanesBracket = lanesBracket; this.lanesBracketName = lanesBracketName; this.lanesRating = lanesRating; this.lanesShouldNormalize = lanesShouldNormalize; this.lanesTeams = lanesTeams;', c);
const L = c.CFG.lanes;
check('1v1, 2v2 and 3v3, a fair unlock level and play-earned chests only', () => {
  assert.deepEqual([...L.sizes], [1, 2, 3]); assert(L.unlock >= 5 && L.unlock <= 20);
  assert(['treasure', 'hunter'].includes(L.chest.win) && ['treasure', 'hunter'].includes(L.chest.loss), 'chests from the existing case system');
  assert(L.rp.loss < 0 && L.rp.win > 0);
});
check('brackets: every level lands in exactly one, in order, and the names read well', () => {
  assert.equal(c.lanesBracket(1), 0); assert.equal(c.lanesBracket(19), 0); assert.equal(c.lanesBracket(20), 1); assert.equal(c.lanesBracket(150), 5); assert.equal(c.lanesBracket(99999), L.brackets.length - 1);
  let last = 0; for (let l = 1; l < 400; l++) { const b = c.lanesBracket(l); assert(b >= last); last = b; }
  assert.equal(c.lanesBracketName(0), 'Lv 1-19'); assert.equal(c.lanesBracketName(L.brackets.length - 1), 'Lv 210+');
});
check('the rating card carries level, Power, bracket and a rating that grows with rank points', () => {
  const a = c.lanesRating({ level: 30, lanes: { rp: 0 } }, 1234.4), b = c.lanesRating({ level: 30, lanes: { rp: 200 } }, 0);
  assert.equal(a.lvl, 30); assert.equal(a.pw, 1234); assert.equal(a.br, c.lanesBracket(30)); assert(b.mmr > a.mmr);
  assert.equal(c.lanesRating({}, 0).lvl, 1, 'a profile without Lanes data still has a card');
});
check('normalisation: auto only when the humans are far apart; true/false force it', () => {
  assert.equal(c.lanesShouldNormalize([40]), false); assert.equal(c.lanesShouldNormalize([40, 45]), false); assert.equal(c.lanesShouldNormalize([20, 150]), true);
  L.normalize = true; assert.equal(c.lanesShouldNormalize([40]), true); L.normalize = false; assert.equal(c.lanesShouldNormalize([20, 150]), false); L.normalize = 'auto';
});
check('teams: together puts every human on blue; versus splits by Power, strongest pair split', () => {
  const M = [{ key: 'a', pw: 900 }, { key: 'b', pw: 100 }, { key: 'c', pw: 500 }, { key: 'd', pw: 400 }];
  assert(c.lanesTeams(M, 'together').every(([t]) => t === 'blue'));
  const T = c.lanesTeams(M, 'versus'), side = Object.fromEntries(T.map(([t, m]) => [m.key, t]));
  assert.notEqual(side.a, side.c, 'the two strongest play against each other');
  const sum = (t) => T.filter(([x]) => x === t).reduce((s, [, m]) => s + m.pw, 0); assert(Math.abs(sum('blue') - sum('red')) <= 200, 'even sides');
});
check('old saves: sanitizeProfile gives every profile a clean Lanes record', () => {
  const s = section('// Ascendant Lanes: rank points', '  // Dungeon Keys');
  const out = { lanes: { rp: '35', w: -2, junk: 1 } }; vm.runInNewContext(s, { out, Math });
  assert.equal(JSON.stringify(out.lanes), JSON.stringify({ rp: 35, best: 0, w: 0, l: 0, n: 0 }));
  const o2 = {}; vm.runInNewContext(s, { out: o2, Math }); assert.equal(o2.lanes.rp, 0);
});
console.log(passed + ' lanes checks passed.');
