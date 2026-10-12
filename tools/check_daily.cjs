// Daily login calendar, weekly Colossus bonus and the coming-up list, from the real code in index.html (no browser).
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let passed = 0;
const events = [], got = { cases: [], gems: 0, keys: [] };
const c = { Math, console, LOCAL_PREVIEW: false, TEST_MODE: false, nextId: 1, G: {}, ev: (e) => events.push(e),
  addCase: (k, o) => got.cases.push({ k, f: o && o.f }), addEssence: (n) => { got.gems += n; }, makeKey: (t) => ({ t, a: [] }), addKey: (k) => { got.keys.push(k); return k; },
  vaultState: () => ({ mins: 60, cap: 480 }) };
vm.createContext(c);
for (const f of ['test-mode', 'loot-collection', 'prestige', 'companions', 'heroes-v6']) vm.runInContext(fs.readFileSync(path.join(root, 'assets/data', f + '.js'), 'utf8').replace(/export /g, ''), c);
vm.runInContext(section('const CFG = {', '// 2. UTIL') + section('const clamp =', '// 3. DATA') + section('// --- Mining:', '// --- end mining') + section('// --- Daily:', '// --- end daily') +
  '\nCFG.dungeon = { trial: { sigilCost: 50 } }; CFG.brawlers = { bolt: { name: "Bolt" } }; this.CFG = CFG; this.dayNum = dayNum; this.weekNum = weekNum; this.loginReady = loginReady;', c);
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function reset() { c.G.profile = { cases: [], exp: [], keys: [], trials: {}, mine: { ore: 0, pick: 0, mined: 0, museum: {} } }; events.length = 0; got.cases = []; got.gems = 0; got.keys = []; }
const day = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();

check('calendar days and Monday-based weeks follow the local date', () => {
  assert.equal(c.dayNum(day(2026, 10, 12, 0)), c.dayNum(day(2026, 10, 12, 23))); assert.equal(c.dayNum(day(2026, 10, 13, 0)) - c.dayNum(day(2026, 10, 12, 23)), 1);
  // 2026-10-12 is a Monday: Sunday the 11th is the week before, Sunday the 18th the same week
  assert.equal(c.weekNum(day(2026, 10, 12)), c.weekNum(day(2026, 10, 18))); assert.equal(c.weekNum(day(2026, 10, 12)) - c.weekNum(day(2026, 10, 11)), 1);
});
check('one claim per day; missed days never reset the calendar; day 7 is a Legendary-floor Colossus chest; rewards grow per week', () => {
  reset(); assert(c.loginReady(day(2026, 10, 12)));
  const r1 = c.claimLogin(day(2026, 10, 12, 8)); assert.equal(r1.i, 0); assert.equal(c.claimLogin(day(2026, 10, 12, 22)), null, 'once per day');
  const r2 = c.claimLogin(day(2026, 10, 20)); assert.equal(r2.i, 1, 'a week away continues at day 2'); assert.equal(r2.gems, 30);
  for (let d = 21, i = 2; i < 7; d++, i++) assert.equal(c.claimLogin(day(2026, 10, d)).i, i);
  assert.equal(JSON.stringify(got.cases.slice(-1)[0]), JSON.stringify({ k: "boss", f: "legendary" })); assert.equal(got.cases.filter((x) => x.k === 'geode').length, 3); assert.equal(got.keys[0].t, 3);
  assert.equal(c.G.profile.mine.ore, 150); assert.equal(c.G.profile.login.n, 7);
  c.claimLogin(day(2026, 10, 27)); const w2 = c.claimLogin(day(2026, 10, 28)); assert.equal(w2.i, 1); assert.equal(w2.gems, 40, 'week 2 pays more');
  assert.equal(events.filter((e) => e.t === 'daily').length, 9);
});
check('weekly Colossus bonus: once per Monday-based week, Legendary floor', () => {
  reset(); assert(c.weeklyBossBonus(day(2026, 10, 12))); assert(!c.weeklyBossBonus(day(2026, 10, 18)), 'same week');
  assert(c.weeklyBossBonus(day(2026, 10, 19)), 'next Monday'); assert.equal(got.cases.length, 2); assert(got.cases.every((x) => x.k === 'boss' && x.f === 'legendary'));
});
check('coming up: ready items first, then the soonest timers', () => {
  reset(); const now = day(2026, 10, 12, 20);
  let L = c.comingUp(now); assert.equal(L[0].label, 'Daily reward ready to claim'); assert(L.some((x) => /Weekly Colossus bonus: slay/.test(x.label)));
  c.claimLogin(now); c.weeklyBossBonus(now); c.G.profile.exp = [{ b: 'bolt', s: now - 10 * 60000, d: 15 }]; c.G.profile.keys = [{ t: 7, a: [] }];
  L = c.comingUp(now); assert.equal(L[0].label, 'Tier 7 Dungeon Key ready');
  const t = L.filter((x) => x.t > 0).map((x) => x.t); assert.equal(JSON.stringify(t), JSON.stringify([...t].sort((a, b) => a - b)));
  assert.equal(L.find((x) => /Bolt returns/.test(x.label)).t, 300); assert(Math.abs(L.find((x) => /Day 2 reward/.test(x.label)).t - 4 * 3600) < 2);
  assert(Math.abs(L.find((x) => /Weekly Colossus/.test(x.label)).t - (6 * 86400 + 4 * 3600)) < 2, 'resets next Monday 00:00');
});
console.log(`${passed} daily checks passed.`);
