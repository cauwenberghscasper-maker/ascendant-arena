// Static checks on the world-boss kits (src/game/33b-boss-kits.js): every biome has a full kit, phases unlock attacks,
// every attack has a builder and an executor, and the three team mechanics exist across the roster.
const assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../src/game/33b-boss-kits.js'), 'utf8');
const body = src.slice(src.indexOf('const BOSS_KITS'), src.indexOf('const bossKit ='));
const { BOSS_KITS, BOSS_TEAM } = new Function(body + '; return { BOSS_KITS, BOSS_TEAM };')();
assert.equal(BOSS_KITS.length, 6, 'one kit per biome');
const planners = ['lanes', 'sweep', 'beams', 'ripple', 'rain', 'fan', 'wells', 'rocks', 'slam'], mechs = ['plates', 'soak', 'spread'];
const names = new Set(); let n = 0;
for (const K of BOSS_KITS) {
  assert(K.atk.length >= 5 && K.mech.length >= 2, K.id + ' needs 5 attacks and 2 mechanics');
  assert(K.atk.some((a) => a.ph === 1) && K.atk.some((a) => a.ph === 2) && K.atk.some((a) => a.ph === 3), K.id + ' unlocks something in every phase');
  for (const a of K.atk) { assert(planners.includes(a.m), K.id + ' ' + a.nm + ' has no builder'); assert(!names.has(a.nm), 'duplicate attack name ' + a.nm); names.add(a.nm); n++; }
  for (const m of K.mech) { assert(mechs.includes(m.m) && m.say, K.id + ' mechanic ' + m.nm); assert(!names.has(m.nm), 'duplicate ' + m.nm); names.add(m.nm); n++; }
  assert(K.mech.some((m) => m.m === 'plates' || m.m === 'soak'), K.id + ' needs a team-gated mechanic');
}
// no two bosses share a kit: the set of moves differs for every pair
const sig = BOSS_KITS.map((K) => K.atk.map((a) => a.m).sort().join() + '|' + K.mech.map((m) => m.m).sort().join());
assert.equal(new Set(sig).size, 6, 'boss kits must differ');
assert(BOSS_TEAM.ward.dr < 0.1 && BOSS_TEAM.ward.vuln > 1 && BOSS_TEAM.phases.length === 2, 'wards armour the boss, breaking them exposes it');
for (const k of ['lane', 'sweep', 'beams', 'ripple', 'rain', 'fan', 'wells', 'soak', 'spread', 'plates', 'wardEnd']) assert(new RegExp('\\n  ' + k + '\\(b, o\\)').test(src), 'executor ' + k);
console.log(`PASS boss kits: 6 biomes, ${n} named attacks and mechanics, all distinct, three phases each`);
