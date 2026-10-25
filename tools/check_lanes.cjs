// Ascendant Lanes: trophy matchmaking, in-match XP, the capped bonus, teams and the save, from the real code in index.html (no browser).
// The match itself (minions, towers, bots, the view) is played in the browser smoke test.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let passed = 0; const check = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };
const c = { Math, CFG: { enemies: {} }, clamp: (v, a, b) => Math.max(a, Math.min(b, v)) };
vm.createContext(c);
vm.runInContext(section('CFG.lanes = {', 'const LN_TEAMS') + section('// --- Lanes rating', '// --- end Lanes rating') + section('function lanesTeams(', 'function lanesGoMsg(') +
  '\nthis.lanesTrophyWindow = lanesTrophyWindow; this.lanesPickByTrophies = lanesPickByTrophies; this.lanesBotBonus = lanesBotBonus; this.lanesGearBonus = lanesGearBonus; this.lanesXpNeed = lanesXpNeed; this.lanesTeams = lanesTeams;', c);
const L = c.CFG.lanes;
check('1v1, 2v2 and 3v3, Play-from level, levels to 18, a capped bonus and play-earned chests only', () => {
  assert.deepEqual([...L.sizes], [1, 2, 3]); assert(L.unlock >= 1 && L.unlock <= 20); assert(L.maxLvl === 18);
  assert(['treasure', 'hunter'].includes(L.chest.win) && ['treasure', 'hunter'].includes(L.chest.loss), 'chests from the existing case system');
  assert(L.trophies.loss < 0 && L.trophies.win > 0 && L.trophies.botLoss < 0 && L.trophies.botWin > 0);
  assert(L.unlocks.dash <= L.unlocks.skill && L.unlocks.skill < L.unlocks.special && L.unlocks.special < L.unlocks.super && L.unlocks.super <= 6, 'LoL ladder: skill, special, then the super at 6');
});
check('every field position the match needs is a real number (a setting hidden in a comment made the spawn NaN and the match black)', () => {
  for (const k of ['core', 'fountain', 'fountainR', 'campX', 'campZ', 'wave', 'firstWave']) assert(Number.isFinite(L[k]), 'CFG.lanes.' + k + ' = ' + L[k]);
  assert(L.towers.every(Number.isFinite) && Number.isFinite(L.half.x) && Number.isFinite(L.half.z));
  assert(L.core < L.fountain && L.fountain < L.half.z, 'the fountain sits behind the Core, inside the field');
});
check('XP: each level needs more, and 18 takes most of a match', () => {
  let tot = 0; for (let l = 1; l < 18; l++) { assert(c.lanesXpNeed(l + 1) > c.lanesXpNeed(l)); tot += c.lanesXpNeed(l); }
  assert(tot > 10000 && tot < 30000, 'total XP to 18: ' + tot);
});
check('the gear bonus never passes the cap, whatever the build, level or loadout', () => {
  for (const b of [0, 0.5, 1, 3, 100]) for (const l of [1, 50, 210, 100000]) for (const g of [0, 0.02, 0.06, 1]) { const x = c.lanesGearBonus(b, l, g); assert(x >= 0 && x <= L.gearCap + 1e-9); }
  assert(c.lanesGearBonus(1.6, 150, 0) > c.lanesGearBonus(0.8, 20, 0), 'a stronger, higher farm hero gets a little more');
});
check('trophy matchmaking: closest first, inside a window that widens while waiting; bots follow trophies', () => {
  const me = { tr: 500 }, Q = [{ key: 'a', tr: 520 }, { key: 'b', tr: 900 }, { key: 'c', tr: 470 }, { key: 'd', tr: 640 }];
  assert.deepEqual(c.lanesPickByTrophies(me, Q, 3, 0).map((q) => q.key), ['a', 'c']);
  assert.deepEqual(c.lanesPickByTrophies(me, Q, 3, 10).map((q) => q.key), ['a', 'c', 'd']);
  assert.equal(c.lanesPickByTrophies(me, Q, 1, 99).length, 1);
  assert(c.lanesTrophyWindow(30) > c.lanesTrophyWindow(0));
  assert(c.lanesBotBonus(0) < 0 && c.lanesBotBonus(5000) <= L.gearCap + 1e-9 && c.lanesBotBonus(1000) > c.lanesBotBonus(100));
});
check('teams: together puts every human on blue; versus splits by trophies, the best two on opposite sides', () => {
  const M = [{ key: 'a', tr: 900 }, { key: 'b', tr: 100 }, { key: 'c', tr: 500 }, { key: 'd', tr: 400 }];
  assert(c.lanesTeams(M, 'together').every(([t]) => t === 'blue'));
  const T = c.lanesTeams(M, 'versus'), side = Object.fromEntries(T.map(([t, m]) => [m.key, t]));
  assert.notEqual(side.a, side.c, 'the two strongest play against each other');
  const sum = (t) => T.filter(([x]) => x === t).reduce((s, [, m]) => s + m.tr, 0); assert(Math.abs(sum('blue') - sum('red')) <= 200, 'even sides');
});
check('old saves: sanitizeProfile gives every profile a clean Lanes record and loadout', () => {
  const s = section('// Ascendant Lanes: trophies', '  // Dungeon Keys');
  const out = { lanes: { rp: '35', w: -2, junk: 1, gear: { oakseed: 9, 'bad id!': 2, x: 0 }, eq: { relic: 'oakseed', charm: 'nope' }, fx: 'nope' } }; vm.runInNewContext(s, { out, Math });
  assert.equal(JSON.stringify(out.lanes), JSON.stringify({ trophies: 35, best: 0, w: 0, l: 0, n: 0, gear: { oakseed: 5 }, eq: { relic: 'oakseed' }, fx: '' }), 'early rank points become trophies, ranks capped at 5, unknown pieces dropped');
  const o2 = {}; vm.runInNewContext(s, { out: o2, Math }); assert.equal(o2.lanes.trophies, 0); assert.equal(JSON.stringify(o2.lanes.gear), '{}');
});
console.log(passed + ' lanes checks passed.');
