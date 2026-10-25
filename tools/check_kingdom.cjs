// Kingdom (Bank & Camp › Kingdom, src/game/71b-kingdom.js): costs, milestones, villagers, the storage window, collect
// and the economy staying bounded. Runs the real section of index.html with small stand-ins for the Bank.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let passed = 0; const check = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };
const events = [], got = { gold: 0, gems: 0, mats: {} };
const H = 3600000, UNIT = 100; // the Bank's base gold per minute in these checks
const c = { console, Math, Date, JSON, Object, Number, String, Array, Infinity,
  CFG: { craft: { rune: { id: 'runeshard' } } }, G: { profile: null, dirty: false }, UI: {}, document: { getElementById: () => null }, setInterval() {},
  GI: { m_gem: 'M0 0' }, GI_SRC: { m_gem: ['cut-diamond', 'lorc'] }, PX_KEY_FAM: {},
  CB: [{ ore: 'copper', part: 'thornhide' }, { ore: 'iron', part: 'frostfang' }],
  vaultLv: (p) => (p.vault && p.vault.lv) || 0, vaultCapH: (p) => Math.min(24, 8 + ((p.vault && p.vault.lv) || 0)),
  vaultRates: (p) => ({ gold: UNIT * (1 + 0.12 * ((p.vault && p.vault.lv) || 0)) }), highestZone: () => 0, zoneBiome: () => 0,
  ev: (e) => events.push(e), addGold: (n) => { got.gold += n; c.G.profile.gold += n; }, addEssence: (n) => { got.gems += n; },
  addMats: (list) => { for (const [id, n] of list) got.mats[id] = (got.mats[id] || 0) + n; return list; } };
vm.createContext(c);
vm.runInContext(section('// --- Kingdom (Bart', '// --- the Kingdom tab') + '\nObject.assign(this, { KB, kDef, kingdomState, kOwned, kWorkers, kCap, kVillagers, kMult, kingdomRates, kingdomSettle, kingdomPending, kingdomCollect, kCost, kAffordable, buyBuilding, assignVillager, autoAssign, K_ICONS });', c);
const KB = c.KB;
function reset(level = 100, gold = 1e15) { c.G.profile = { level, gold, vault: { t: Date.now(), lv: 0 } }; events.length = 0; got.gold = got.gems = 0; got.mats = {}; }

check('buildings open by level; every copy costs `grow` more; ×10 is the sum of the next ten; Max buys what you can pay', () => {
  reset(10); assert(!c.buyBuilding('tavern', 1), 'the Tavern is shut at level 10'); assert.equal(c.buyBuilding('market', 1), 1);
  const one = c.kCost('market', 1), ten = c.kCost('market', 10);
  assert(Math.abs(one - UNIT * 60 * c.kDef('market').cost * KB.grow) <= 1, 'second copy costs grow × the first');
  let sum = 0; for (let k = 0; k < 10; k++) sum += UNIT * 60 * c.kDef('market').cost * Math.pow(KB.grow, 1 + k); assert(Math.abs(ten - sum) <= 1, ten + ' vs ' + sum);
  const g0 = c.G.profile.gold = c.kCost('market', 3) + 1; assert.equal(c.buyBuilding('market', 'max'), 3); assert(c.G.profile.gold >= 0 && c.G.profile.gold < g0);
  c.G.profile.gold = 0; assert.equal(c.buyBuilding('market', 1), 0, 'no gold, no building');
});
check('milestones double output; villagers add 5% each, one per copy and ten per building at most; cottages house them', () => {
  reset(); const k = c.kingdomState(); k.b.market = 24; const m24 = c.kMult('market'); k.b.market = 25; assert(Math.abs(c.kMult('market') / m24 - 25 / 24 * 2) < 1e-9, '×2 at 25');
  k.b.market = 3; assert.equal(c.kVillagers().total, KB.founders); assert(c.assignVillager('market', 1) && c.assignVillager('market', 1)); assert(!c.assignVillager('market', 1), 'no free villagers');
  k.b.cottage = 10; assert.equal(c.kVillagers().total, KB.founders + 20); assert(c.assignVillager('market', 1)); assert(!c.assignVillager('market', 1), 'one per copy');
  k.b.market = 40; c.autoAssign(); assert.equal(c.kWorkers('market'), KB.maxWorkers, 'ten at most'); assert(Math.abs(c.kMult('market') - 40 * 2 * (1 + KB.villager * 10)) < 1e-9);
  assert(c.assignVillager('market', -1) && c.kWorkers('market') === 9); assert(!c.assignVillager('cottage', 1), 'cottages hold villagers, they do not employ them');
});
check('the pile grows only inside the Treasury window, counts old rates before a purchase, and Collect pays it once', () => {
  reset(); const p = c.G.profile, k = c.kingdomState(), now = Date.now(); k.b.market = 10; p.vault.t = k.at = now - 2 * H;
  const R = c.kingdomRates().gold; assert(Math.abs(c.kingdomPending(now).gold - Math.floor(R * 120)) <= 1, 'two hours of gold'); assert.equal(k.at, now - 2 * H, 'pending changes nothing');
  p.vault.t = k.at = now - 100 * H; assert(Math.abs(c.kingdomPending(now).gold - Math.floor(R * 60 * c.vaultCapH(p))) <= 1, 'never past the storage hours');
  p.vault.t = k.at = now - 1 * H; c.buyBuilding('market', 5); assert(Math.abs(k.acc.gold - R * 60) < R, 'the hour before the purchase counted at the old rate');
  const out = c.kingdomCollect(now + 1); assert(out.gold > 0 && got.gold === out.gold); assert(k.acc.gold < 1, 'paid once'); assert.equal(c.kingdomCollect(now + 1).gold, 0);
  // the Treasury level lifts everything by 12% a level
  p.vault.lv = 5; assert(Math.abs(c.kingdomRates().gold / (15 * 0.2 * UNIT) - 1.6) < 1e-9);
});
check('material buildings fill the newest biome\'s ore and parts; gem cutters gems; the rune workshop rune shards', () => {
  reset(100); const k = c.kingdomState(), now = Date.now(); Object.assign(k.b, { mine: 10, lodge: 5, gems: 4, runes: 3 }); c.G.profile.vault.t = k.at = now - 5 * H;
  const out = c.kingdomCollect(now); assert(got.mats.copper > 0 && got.mats.thornhide > 0 && got.gems > 0 && got.mats.runeshard > 0, JSON.stringify(got));
  assert(Math.abs(got.mats.copper - 10 * c.kDef('mine').out * 5) <= 1, 'mines: ore per hour per copy');
  c.zoneBiome = () => 1; assert(c.kingdomRates().mats.iron > 0 && !c.kingdomRates().mats.copper, 'a new biome switches the ore');
});
check('bounded: buying with everything for 150 hours keeps the kingdom within ~10× the gold you earn by playing', () => {
  reset(100, 0); const play = 12 * UNIT; let rate = 0; const gold = KB.buildings.filter((d) => d.kind === 'gold');
  for (let t = 0; t < 150 * 60; t++) {
    c.G.profile.gold += play + rate;
    for (let r = 0; r < 3; r++) { let best = null, bp = Infinity; for (const d of gold) { const k = c.kingdomState().b, n = k[d.id] | 0, before = c.kMult(d.id); k[d.id] = n + 1; const gain = (c.kMult(d.id) - before) * d.out; k[d.id] = n; const pb = c.kCost(d.id, 1) / gain; if (pb < bp) { bp = pb; best = d; } }
      if (!best || !c.buyBuilding(best.id, 1)) break; c.autoAssign(); rate = c.kingdomRates().gold; }
  }
  assert(rate > play, 'it is worth building: more than your play income after 150 h'); assert(rate < play * 12, `kingdom ${Math.round(rate / play * 10) / 10}× play income`);
});
check('every building has its own pixel icon with an author for the Credits screen', () => {
  for (const d of KB.buildings) { assert(c.GI[d.icon], d.icon); assert(c.GI_SRC[d.icon] && c.GI_SRC[d.icon].length === 2, d.icon); assert(c.PX_KEY_FAM[d.icon], d.icon); }
});
console.log(`${passed} kingdom checks passed.`);
