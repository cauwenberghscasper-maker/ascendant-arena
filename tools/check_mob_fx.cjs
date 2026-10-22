// Every monster species has its own attack art (src/game/45b-mob-fx.js, assets/fx/mob/, tools/bake_mob_fx.py):
// a row in MOB_FX, real particle glyphs and burst style, its burst sheet, and a projectile sprite if it shoots.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'src/game/45b-mob-fx.js'), 'utf8');
const T = JSON.parse(src.match(/\/\* <mob-fx> \*\/([\s\S]*?)\/\* <\/mob-fx> \*\//)[1]);
// the species and their attacks, straight from the game's monster table
const CFG = { enemies: {}, signatures: {}, attacks: {}, classes: {} };
const mon = fs.readFileSync(path.join(ROOT, 'src/game/12-monsters.js'), 'utf8').replace(/const enemyBase[\s\S]*$/, '');
const { MON_ROWS } = new Function('CFG', mon + '; return { MON_ROWS };')(CFG);
const SHOOTS = new Set(['snipe', 'nova', 'boomerang', 'fan', 'mortar', 'trap', 'spiral', 'rain']);
const STYLES = new Set(['splash', 'ring', 'petals', 'spatter', 'glint', 'sparks', 'fibres', 'mist', 'claw', 'chips', 'jaws', 'pips']);
const dir = path.join(ROOT, 'assets/fx/mob'), index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
let pass = 0; const ok = (m) => { pass++; console.log('PASS ' + m); };

const species = Object.keys(MON_ROWS), rows = Object.keys(T.species);
assert.deepEqual(species.filter((s) => !T.species[s]), [], 'species without a MOB_FX row');
assert.deepEqual(rows.filter((s) => !MON_ROWS[s]), [], 'MOB_FX rows for unknown species');
ok(`all ${species.length} species have their own attack art row`);

const cells = new Set();
for (const [g, d] of Object.entries(T.glyphs)) for (let f = 0; f < d.n; f++) { assert(!cells.has(d.cell + f), 'atlas cell used twice: ' + g); cells.add(d.cell + f); }
assert(Math.max(...cells) < 40, 'glyph cells fit the 8x5 atlas');
for (const [s, r] of Object.entries(T.species)) {
  assert(/^#[0-9a-f]{6}$/i.test(r.c), s + ' colour');
  assert(T.glyphs[r.bit] && (!r.bit2 || T.glyphs[r.bit2]), s + ' particle glyphs');
  assert(STYLES.has(r.hit), s + ' burst style ' + r.hit);
}
ok('colours, particle glyphs and burst styles are all real');

const png = (f) => { const b = fs.readFileSync(path.join(dir, f)); assert.equal(b.toString('ascii', 1, 4), 'PNG', f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
assert.deepEqual(png('bits.png'), [128, 80], 'particle atlas 8x5 cells of 16 px');
for (const s of species) { assert.deepEqual(png(`hit_${s}.png`), [192, 192], s + ' burst sheet'); assert(index.hit.includes(s), s + ' burst listed in index.json'); }
ok('particle atlas and a burst sheet for every species');

const shooters = species.filter((s) => { const [, kit, , , , x] = MON_ROWS[s]; const moves = x.moves || []; return ['shooter', 'spray', 'turret'].includes(kit) || moves.some((m) => SHOOTS.has(m)); });
const missing = shooters.filter((s) => !(index.ammo || []).includes(s) || !fs.existsSync(path.join(dir, `ammo_${s}.png`)));
assert.deepEqual(missing, [], 'species that shoot without their own projectile');
for (const s of index.ammo) assert.deepEqual(png(`ammo_${s}.png`), [256, 64], s + ' projectile: 4 frames of 64 px');
ok(`all ${shooters.length} species that shoot fly their own projectile`);
console.log(`${pass} monster art checks passed.`);
