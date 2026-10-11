// Hardcore balance: a "reference hero" built with the real applyStats fights real stepEnemy/dealDamage monsters.
// Guards: the CFG.enemies.refHpMult/refDmgMult tables match that hero, single hits stay meaningful, and a small
// equal-level pack kills a stationary hero in a few seconds at every level 1-210 (so dodging always matters).
//   node tools/check_hardcore.cjs          run the checks
//   node tools/check_hardcore.cjs --fit    print fresh tables to paste into src/game/10-config.js
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let seed = 7, passed = 0;
const math = Object.create(Math); math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const c = { Math: math, console, LOCAL_PREVIEW: false, TEST_MODE: false, nextId: 1,
  G: { mode: 'hub', time: 0, menuSafe: 0, profile: { level: 1, worldTier: 0, records: {} }, player: null, enemies: [], ents: new Map(), pendingAoE: [], clouds: [], boss: null, rift: null },
  ev() {}, toast() {}, markCombat() {}, trackVel() {}, champTick: () => false, slayerBonus: () => 0, petBonuses: () => ({ damage: 0, hp: 0 }), petMayFight: () => false,
  onHitProcs() {}, killEntity: (t) => { t.alive = false; }, mpOnShot() {} };
vm.createContext(c);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/data/test-mode.js'), 'utf8').replace(/export /g, ''), c);
vm.runInContext(section('const CFG = {', '// 2. UTIL') + section('const clamp =', '// 3. DATA') +
  section('const P = CFG.progression;', 'const salvageValue =') + section('function itemElement(it) {', 'function perkText(it) {') +
  section('function gearPerks(gear) {', 'const FORGE_AFF') + section('function emptyMods() {', 'const NPC_DEFS') +
  section('const levelPointsTotal =', '// 5. SIM') + section('class Grid {', '// --- entities') +
  section('function newIntent()', 'function playerArenaPower(') + section('function artsOf(', 'function artDesc(') +
  section('function applyLoadout(', 'function checkUnlocks(') +
  section('const PROJ_MAX =', 'function projColor(') + section('function stepProjectiles(dt) {', '// keystone and artifact') +
  section('function tickBurn(', 'function doSpecial(') + section('function regenTick(', 'function stepFighter(') +
  section('function patrolCountFor(', 'function rewardEnemyKill(') + section('function separate(', '// --- Rift champions:') +
  '\nthis.config = CFG; this.kit = MON_KIT; this.mxpFor = mxpFor;', c);
const CFG = c.config, E = CFG.enemies, W = CFG.world, LEVELS = [1, 10, 20, 50, 100, 150, 200], DT = 1 / 60;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
// kit-pure monster types (the area rows tweak hp/atk; the balance targets are per kit)
for (const k of ['swarm', 'charger', 'brute', 'shooter', 'spray', 'turret']) E['ref_' + k] = Object.assign({}, c.kit[k], { name: k, kit: k });
// rare gear at the level with +L/4 upgrades, every point in the Ascension Core, weapon mastery L/10, no affixes (so no lifesteal)
function hero(L, o = {}) {
  const ML = Math.max(1, Math.round(L / 10)), up = Math.round(L / 4), gear = {};
  for (const slot of CFG.gear.slots) gear[slot] = { id: slot, slot, rarity: 'rare', ilvl: L, up, aff: {}, name: 'Ref ' + slot, elem: slot === 'accessory' ? 'fire' : undefined };
  const pts = 2 * L + 5 * Math.floor(L / 10) + 2 * ML;
  const src = o.naked ? { level: L } : { level: L, gear, brawlers: { bolt: { tree: { active: 0, sets: [{ core: pts }] }, artifacts: [] } }, mastery: { 'w:bolt': c.mxpFor(ML) } };
  const f = c.makeFighter({ name: 'Ref', team: 'ally', isPlayer: true, cls: 'bolt', x: 0, z: 0 }); c.applyLoadout(f, 'bolt', []);
  c.applyStats(f, 'hub', src); f.maxHp = Math.round(f.maxHp * (o.hpMult || 1)); f.hp = f.maxHp; f.armor = o.armor ?? 0.3; f.lastAttack = -99;
  return f;
}
const bare = (L) => [CFG.progression.hpBase * Math.pow(CFG.progression.hpGrowth, L - 1), CFG.progression.atkBase * Math.pow(CFG.progression.atkGrowth, L - 1)];
const fit = LEVELS.map((L) => { const f = hero(L), [h, d] = bare(L); return { L, hp: f.maxHp / h, dmg: f.dmgAlt / d, f }; });
if (process.argv.includes('--fit')) {
  const T = (k) => '[' + fit.map((r) => `[${r.L}, ${r[k].toFixed(2)}]`).join(', ') + ']';
  console.log(`refHpMult: ${T('hp')}, refDmgMult: ${T('dmg')},`); process.exit(0);
}
check('reference curves match the measured reference hero within 15% at every level', () => {
  for (const r of fit) {
    assert(Math.abs(r.f.maxHp / c.refHp(r.L) - 1) < 0.15, `hp L${r.L}: ${r.f.maxHp} vs ${c.refHp(r.L).toFixed(0)}`);
    assert(Math.abs(r.f.dmgAlt / c.refDmg(r.L) - 1) < 0.15, `dmg L${r.L}: ${r.f.dmgAlt.toFixed(1)} vs ${c.refDmg(r.L).toFixed(1)}`);
  }
});
function mob(type, L, x, z, o = {}) {
  const e = c.makeEnemy(type, 2, { patrol: 0, elite: !!o.elite }); c.setEnemyLevel(e, L);
  Object.assign(e, { x, z, hx: x, hz: z, state: 'chase', atkCd: o.cd ?? 0.3, lungeCd: 1 }); return e;
}
const arenaZ = () => (W.zones[2].z0 + W.zones[2].z1) / 2;
// one stationary hero vs a list of monsters; returns seconds until it drops (or `limit`)
function fight(f, list, limit = 60) {
  const G = c.G; G.time = 0; G.player = f; f.x = 70; f.z = arenaZ(); G.enemies = list; c.clearProjectiles();
  G.ents = new Map([[f.id, f], ...list.map((e) => [e.id, e])]);
  while (f.alive && G.time < limit) { G.time += DT; for (const e of list) c.stepEnemy(e, DT); c.stepProjectiles(DT); f.invulnT -= DT; f.retalCd -= DT; c.tickBurn(f, DT); if (f.alive) c.regenTick(f, DT, 'hub'); }
  return G.time;
}
const pack = (L) => { const z = arenaZ(); return [mob('ref_swarm', L, 66, z + 2), mob('ref_swarm', L, 74, z - 2), mob('ref_charger', L, 70, z + 6), mob('ref_shooter', L, 70, z - 8)]; };
// sustained auto-attack: ammo, reload, fire cooldown and the rare Twin Shot perk
function killTime(f, e) {
  const w = c.weaponOf(f); let hp = e.maxHp, t = 0, ammo = f.ammoMax, rl = 0, cd = 0;
  const shot = f.dmgAlt * w.mult * w.count * (w.burst || 1) * (1 + (f.perks.twin || 0)) * (1 - Math.min(0.6, e.armor || 0));
  while (hp > 0 && t < 120) { t += DT; cd -= DT; if (ammo < f.ammoMax) { rl += DT; if (rl >= w.reload) { ammo++; rl = 0; } } if (ammo >= 1 && cd <= 0) { ammo--; cd = w.cd; hp -= shot; } }
  return t;
}
const table = [];
check('single hits stay meaningful (6-22% of reference HP) for every kit, kills stay quick, and a pack of 4 kills a stationary hero in 3.5-7s', () => {
  for (const L of [1, 5, 10, 20, 35, 50, 75, 100, 125, 150, 175, 200, 210]) {
    c.G.profile.level = L; const ref = c.refHp(L), f0 = hero(L), row = { level: L, hp: f0.maxHp, dmg: +f0.dmgAlt.toFixed(1) };
    for (const k of ['swarm', 'charger', 'brute', 'shooter', 'spray', 'turret']) {
      const e = mob('ref_' + k, L, 0, arenaZ()), d = E['ref_' + k], hit = c.mobDmg(e, d.heavy ? E.heavyMult : 1, f0) / f0.maxHp;
      assert(hit >= 0.06 && hit <= 0.22, `${k} L${L} hit ${(hit * 100).toFixed(1)}%`); row[k + '%'] = +(hit * 100).toFixed(1);
    }
    const e0 = mob('ref_charger', L, 0, 0); row['charge%'] = +(c.mobDmg(e0, 1.5, f0) / f0.maxHp * 100).toFixed(1);
    row.killSwarm = +killTime(f0, mob('ref_swarm', L, 0, arenaZ())).toFixed(2); row.killBrute = +killTime(f0, mob('ref_brute', L, 0, arenaZ())).toFixed(2);
    row.killElite = +killTime(f0, mob('ref_charger', L, 0, arenaZ(), { elite: true })).toFixed(2);
    assert(row.killSwarm < 1.5 && row.killBrute < 4 && row.killElite >= 6 && row.killElite <= 20, `kill times L${L}`);
    const t = fight(hero(L), pack(L)); assert(t >= 3.5 && t <= 7, `pack L${L} took ${t.toFixed(2)}s`); row.packTTD = +t.toFixed(2);
    const naked = fight(hero(L, { naked: true }), pack(L)); assert(naked < t, `naked L${L} ${naked.toFixed(2)} vs ${t.toFixed(2)}`); row.nakedTTD = +naked.toFixed(2);
    const tank = fight(hero(L, { hpMult: 4 }), pack(L)); assert(tank > t && tank <= 2.2 * t, `4x HP L${L} ${tank.toFixed(2)} vs ${t.toFixed(2)}`); row.hp4xTTD = +tank.toFixed(2);
    table.push(row);
  }
});
check('lifesteal from a full attack rotation never outheals the cap; regen waits after dealing damage', () => {
  const f = hero(100); f.lifesteal = 1; f.hp = f.maxHp * 0.5; c.G.player = f; c.G.time = 0; const start = f.hp, cap = f.maxHp * CFG.combat.lsCap;
  const e = mob('ref_brute', 100, 1, 0); e.hp = e.maxHp = 1e12; c.G.ents = new Map([[f.id, f], [e.id, e]]);
  for (let i = 0; i < 120; i++) { c.G.time += DT; if (i % 6 === 0) c.dealDamage(e, f.dmg, f.id, { canCrit: false }); c.regenTick(f, DT, 'hub'); }
  assert(f.hp - start <= cap * 3 + 1, `healed ${(f.hp - start).toFixed(0)} with cap ${cap.toFixed(0)}/s`); assert(f.hp > start, 'lifesteal still heals');
  const hp = f.hp; for (let i = 0; i < 60 * 2; i++) { c.G.time += DT; c.regenTick(f, DT, 'hub'); } assert.equal(f.hp, hp, 'no regen right after attacking');
  for (let i = 0; i < 60 * 9; i++) { c.G.time += DT; c.regenTick(f, DT, 'hub'); } assert(f.hp > hp, 'regen resumes out of combat');
});
check('heavy monsters shove the hero, light ones barely; poise limits knockback', () => {
  const f = hero(50), z = arenaZ(); c.G.player = f; c.G.time = 10;
  for (const [k, lo, hi] of [['ref_brute', 0.6, 0.8], ['ref_swarm', 0.3, 0.45]]) {
    const e = mob(k, 50, 70, z); f.x = 70 + e.r + f.r - 1; f.z = z; const fx = f.x; c.separate(e, f); assert(Math.abs(f.x - fx) >= lo && Math.abs(f.x - fx) <= hi, k);
  }
  const e = mob('ref_brute', 50, 0, 0), s = mob('ref_swarm', 50, 0, 0); c.G.ents.set(f.id, f);
  for (let i = 0; i < 10; i++) { c.dealDamage(e, 1, f.id, { knockX: 1, knockZ: 0, knock: 6 }); c.dealDamage(s, 1, f.id, { knockX: 1, knockZ: 0, knock: 6 }); }
  assert(Math.abs(e.x - 0.144) < 1e-6, 'brute: one knock at 20%'); assert(Math.abs(s.x - 0.432) < 1e-6, 'swarm: one knock at 60%');
});
console.log(JSON.stringify({ passed, table }, null, 1).replace(/\n  +/g, ' '));
console.log(`${passed} hardcore checks passed.`);
