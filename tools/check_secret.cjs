// Secret weapons (Garo's Craft tab, src/game/39-crafting.js): one per biome, each with valid affixes and rarity, its own
// picture, a recipe of the biome's ore + core + Titan Souls, and crafting that pays, gives the weapon and refuses when
// the biome is not reached or the cost can't be paid. Runs the real section of index.html with small stand-ins.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let passed = 0; const check = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };
const cfgSrc = fs.readFileSync(path.join(root, 'src/game/10-config.js'), 'utf8');
const AFFIX = [...cfgSrc.slice(cfgSrc.indexOf('  affixes: {'), cfgSrc.indexOf('  loot: {', cfgSrc.indexOf('  affixes: {'))).matchAll(/^\s+(\w+): \{ name/gm)].map((m) => m[1]);
const RARITY = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'ancient', 'divine'];
const events = [], bag = [], mats = {};
const c = { console, Math, Object, Array, JSON, events,
  CFG: { craft: { titan: { id: 'titansoul' } }, forge: { base: 100, growth: 1.05 } },
  CB: ['copper', 'iron', 'obsidian', 'mithril', 'abyssal', 'starsteel'].map((ore, i) => ({ ore, core: 'core' + i })),
  G: { profile: { level: 120, gold: 0 } }, reached: 6,
  biomeTop: (bi) => 20 + bi * 35, biomeReached: (bi) => bi < c.reached,
  makeItem: (slot, rarity, ilvl, name, o) => ({ id: 'it' + bag.length, slot, rarity, ilvl, name, aff: o.aff }),
  canPay: (cost) => c.G.profile.gold >= cost.gold && cost.mats.every(([id, n]) => (mats[id] || 0) >= n),
  pay: (cost) => { c.G.profile.gold -= cost.gold; for (const [id, n] of cost.mats) mats[id] -= n; },
  giveItem: (it) => bag.push(it), ev: (e) => events.push(e) };
vm.createContext(c);
vm.runInContext(section('// --- secret weapons', '// straight into the bag') + '\nObject.assign(this, { secretCost, makeSecretWeapon, craftSecret });', c);
const S = c.CFG.craft.secret;
const rich = () => { c.G.profile.gold = 1e15; for (let bi = 0; bi < 6; bi++) for (const [id] of c.secretCost(bi).mats) mats[id] = 1e6; };

check('one secret weapon per biome, valid rarity and affixes, and a picture for each', () => {
  assert.equal(S.weapons.length, 6); assert.equal(S.rarity.length, 6);
  S.weapons.forEach((W, bi) => {
    assert(W.name && W.say, 'name and line for biome ' + bi); assert(RARITY.includes(S.rarity[bi]), S.rarity[bi]);
    for (const k in W.aff) { assert(AFFIX.includes(k), 'unknown affix ' + k); assert(W.aff[k] > 0 && W.aff[k] < 0.6, k + ' ' + W.aff[k]); }
    assert(fs.existsSync(path.join(root, 'assets/ui/secret', bi + '.webp')), 'picture for biome ' + bi);
  });
});
check('the recipe is the biome ore, core and Titan Souls plus gold; later biomes cost more', () => {
  for (let bi = 0; bi < 6; bi++) {
    const k = c.secretCost(bi), ids = k.mats.map(([id]) => id);
    assert.equal(JSON.stringify(ids), JSON.stringify([c.CB[bi].ore, c.CB[bi].core, "titansoul"])); assert(k.mats.every(([, n]) => n >= 1) && k.gold > 0);
    if (bi) { const p = c.secretCost(bi - 1); assert(k.mats[0][1] > p.mats[0][1] && k.gold >= p.gold, 'biome ' + bi + ' costs more'); }
  }
});
check('crafting pays, gives the named weapon with its biome tag and fixed affixes', () => {
  rich(); const g0 = c.G.profile.gold, n0 = mats.titansoul;
  const it = c.craftSecret(2); assert(it && it.sw === 2 && it.slot === 'weapon' && it.name === S.weapons[2].name);
  assert.equal(JSON.stringify(it.aff), JSON.stringify(S.weapons[2].aff)); assert.notEqual(it.aff, S.weapons[2].aff, 'a copy, not the shared object');
  assert(c.G.profile.gold < g0 && mats.titansoul === n0 - c.secretCost(2).mats[2][1]); assert(bag.includes(it));
  assert(events.some((e) => e.t === 'crafted' && e.name === it.name));
});
check('no weapon from a biome you have not reached, or without the cost', () => {
  rich(); c.reached = 3; assert.equal(c.craftSecret(4), null, 'biome 4 not reached'); c.reached = 6;
  c.G.profile.gold = 0; const n = bag.length; assert.equal(c.craftSecret(0), null, 'no gold'); assert.equal(bag.length, n);
  rich(); mats.titansoul = 0; assert.equal(c.craftSecret(0), null, 'no Titan Soul');
});
console.log(`PASS secret weapons (${passed} checks)`);
