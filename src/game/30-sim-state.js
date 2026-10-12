// ---------------------------------------------------------------------
// 5. SIM — game state and pure game logic
// ---------------------------------------------------------------------
const AC = { x: 0, z: -1000 }; // arena centre (far from the hub)
const RC = { x: 0, z: -1400 }; // rift sanctum centre
CFG.rift = { gate: { x: -9, z: -44 }, unlock: 15, r: 22, time: 70, intro: 2.4, clear: 2.8, lvlBase: 4, lvlPer: 2.5, bossEvery: 5 };
const G = {
  mode: 'hub', started: false, time: 0, paused: false, modal: false,
  profile: null, player: null, hubFighters: [], enemies: [], npcs: [], berries: [], dungeon: null, nodes: [], nodesDirty: true, chain: { type: null, zone: -1, n: 0 }, slowT: 0,
  boss: null, bossTimer: CFG.boss.firstSpawn, bossWarned: false, bossLair: 1,
  arena: null, pendingAoE: [], clouds: [], events: [], ents: new Map(), pellets: [], pelletsDirty: true, shrines: [],
  lastCombat: -99, zoneIdx: 0, interact: null, respawnT: 0, gateToastT: 0, dirty: false,
  obstacles: null, hubObstacles: null, arenaObstacles: null,
  pendingClassChoice: false, lootQueue: [], levelRewards: [], gearPrompts: [],
  streak: 0, streakT: 0, offline: null, salvageAcc: null,
};
if (LOCAL_PREVIEW) window.__game = G;

// --- obstacle grid (circles) -----------------------------------------
class Grid {
  constructor(cell) { this.cell = cell; this.map = new Map(); this.list = []; }
  key(cx, cz) { return cx * 73856093 ^ cz * 19349663; }
  add(o) { this.list.push(o); const c = this.cell; const x0 = Math.floor((o.x - o.r) / c), x1 = Math.floor((o.x + o.r) / c), z0 = Math.floor((o.z - o.r) / c), z1 = Math.floor((o.z + o.r) / c);
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const k = this.key(x, z); let a = this.map.get(k); if (!a) { a = []; this.map.set(k, a); } a.push(o); } }
  query(x, z, fn) { const k = this.key(Math.floor(x / this.cell), Math.floor(z / this.cell)); const a = this.map.get(k); if (a) for (let i = 0; i < a.length; i++) fn(a[i]); }
}
function collideObstacles(e) {
  if (!G.obstacles) return;
  // query own cell and neighbours via 4 sample points
  const r = e.r;
  for (let sx = -1; sx <= 1; sx += 2) for (let sz = -1; sz <= 1; sz += 2) {
    G.obstacles.query(e.x + sx * r, e.z + sz * r, (o) => {
      const dx = e.x - o.x, dz = e.z - o.z, d = Math.hypot(dx, dz), min = o.r + r;
      if (d < min && d > 1e-4) { e.x = o.x + (dx / d) * min; e.z = o.z + (dz / d) * min; }
    });
  }
}
function pointBlocked(x, z, pad) {
  if (!G.obstacles) return false;
  let hit = false;
  G.obstacles.query(x, z, (o) => { if (!hit && Math.hypot(x - o.x, z - o.z) < o.r + pad) hit = true; });
  return hit;
}

// --- entities ---------------------------------------------------------
let nextId = 1;
function newIntent() { return { mx: 0, mz: 0, ax: 0, az: 1, aimDist: 0, aiming: false, fire: false, autoFire: false, melee: false, dash: false, super: false, skill: false, special: false, superDir: null, specialDir: null }; }
function clearOneShots(it) { it.fire = it.autoFire = it.melee = it.dash = it.super = it.skill = it.special = false; it.superDir = it.specialDir = null; }
function makeFighter(o) {
  const f = {
    id: nextId++, kind: 'fighter', name: o.name, team: o.team, isPlayer: !!o.isPlayer, isBot: !!o.isBot,
    cls: o.cls || 'novice', x: o.x, z: o.z, r: CFG.player.radius, facing: o.facing || 0, moveAmt: 0,
    hp: 1, maxHp: 1, dmg: 1, speed: CFG.player.speed, mods: emptyMods(), gearSpeed: 0, gearSuper: 0,
    ammo: 3, ammoMax: 3, reloadT: 0, fireCd: 0, meleeCd: 0, dashCd: 0, dashT: 0, dashX: 0, dashZ: 0,
    invulnT: 0, flashT: 0, slowT: 0, armorT: 0, swiftT: 0, superCharge: 0, skillCd: 0, perks: gearPerks(null), attackId: null, arts: {}, dmgAlt: 1, burstLeft: 0, burstT: 0, burstDX: 0, burstDZ: 1, retalCd: 0, hitCount: 0, dashHit: [], specialCd: 0, atkSpeed: 0, critBonus: 0, burnT: 0, burnTick: 0, burnDmg: 0, burnSrc: 0,
    lastHurt: -99, lastAttack: -99, alive: true, attackAnim: 0, power: 1, cubes: 0,
    critDmg: 0, lifesteal: 0, armor: 0, cdr: 0, keys: {}, masteryDmg: 0,
    ks: { tempo: 0, tempoT: 0, conq: 0, conqT: 0, graspCd: 0, hits: [], phaseT: 0, eTarget: 0, eCount: 0, eT: 0, eCd: 0, cometCd: 0, kraken: 0, undyCd: 0, afterT: 0, sunT: 0 },
    level: o.level || 1, color: o.color || null, ai: o.ai || null, intent: newIntent(), placement: 0,
  };
  G.ents.set(f.id, f);
  return f;
}
function applyStats(f, ctx, src) {
  // src: { level, cls, tree, gear }
  const c = CFG.classes[f.cls] || CFG.classes.bolt;
  const BM = buildMods(src, f.cls), m = BM.m;
  const g = gearTotals(src.gear);
  // the brawler's attack, reshaped by its tree (more bullets, pierce, splits...)
  const base = CFG.attacks[f.attackId] || CFG.attacks.bolt, W2 = Object.assign({}, base);
  W2.range = base.range * (1 + m.range); W2.speed = base.speed * (1 + m.range * 0.4);
  if (m.burst) { W2.burst = (base.burst || 1) + m.burst; if (!W2.burstGap) W2.burstGap = 0.06; }
  if (m.count) { W2.count = base.count + m.count; W2.spread = Math.max(base.spread || 0, 0.18 * (base.count + m.count - 1)); }
  if (m.pierce) W2.pierce = (base.pierce || 0) + m.pierce;
  if (m.bounce) W2.bounce = (base.bounce || 0) + m.bounce;
  if (m.homing) W2.homing = (base.homing || 0) + m.homing;
  if (m.chain) W2.chain = (base.chain || 0) + m.chain;
  if (m.burn) W2.burnMult = (base.burnMult || 0) + m.burn;
  if (m.split) W2.split = base.split ? Object.assign({}, base.split, { n: base.split.n + m.split }) : { n: m.split, mult: 0.25, speed: 18, range: 5, r: 0.2, ring: false };
  if (m.blast && !base.aoe) { W2.aoe = 1.6; W2.aoeMult = 0.45; }
  if (m.slow) W2.slow = m.slow;
  W2.ammo = base.ammo + m.ammo;
  f.weapon = W2;
  const ratio = f.maxHp > 1 ? f.hp / f.maxHp : 1;
  f.mods = m; f.gearSpeed = g.speed; f.gearSuper = g.superGain; f.level = src.level;
  f.perks = gearPerks(src.gear);
  const W = f.weapon, arts = f.arts || NO_ARTS;
  f.ammoMax = W.ammo + f.perks.ammo + (arts.mag ? artVal('mag', arts.mag) : 0);
  if (ctx === 'hub') {
    f.maxHp = Math.round((hpAt(src.level) + g.hp) * c.hpMult * (1 + m.hp));
    f.dmg = (atkAt(src.level) + g.atk) * c.atkMult * (1 + m.dmg);
  } else {
    const ts = CFG.arena.treeScale;
    f.maxHp = Math.round(c.arenaHp * f.power * (1 + m.hp * ts));
    f.dmg = c.arenaDmg * f.power * (1 + m.dmg * ts);
  }
  const A = g.aff;
  f.maxHp = Math.round(f.maxHp * (1 + A.hp)); f.dmg *= 1 + A.dmg;
  const pet = petBonuses(src, ctx);
  f.maxHp = Math.round(f.maxHp * (1 + pet.hp)); f.dmg *= 1 + pet.damage;
  f.atkSpeed = A.atkSpeed + (arts.trigger ? artVal('trigger', arts.trigger) : 0); f.critBonus = A.crit + (arts.lens ? artVal('lens', arts.lens) : 0); f.gearSuper += A.superGain;
  f.critBonus += m.crit; f.critDmg = A.critDmg + m.critDmg; f.lifesteal = A.lifesteal + m.lifesteal; f.armor = A.armor + m.armor; f.cdr = A.cdr + m.cdr; f.regenMult = 1 + m.regen;
  // keystones now live as ◆ nodes in the Hero tree
  const K = f.keys = BM.keys;
  if (K.titan) { f.maxHp = Math.round(f.maxHp * 1.2); f.armor += 0.08; }
  if (K.glass) { f.dmg *= 1.22; f.maxHp = Math.round(f.maxHp * 0.88); }
  if (K.bloodthirst) f.lifesteal += 0.08;
  if (K.infinity) { f.critBonus += 0.1; f.critDmg += 0.6; }
  if (K.ascend) { f.gearSuper += 0.4; f.cdr += 0.3; }
  f.masteryDmg = src.mastery ? (masteryLevel(src.mastery['w:' + f.cls] || 0) - 1) * CFG.mastery.perLevel.weapon * (ctx === 'arena' ? 0.5 : 1) : 0;
  f.dmg *= 1 + f.masteryDmg;
  f.superML = src.mastery ? masteryLevel(src.mastery['w:' + f.cls] || 0) : 1;
  // non-signature attacks use a class-neutral damage baseline so every class can run every attack
  f.dmgAlt = ctx === 'arena' ? f.dmg * (CFG.classes.novice.arenaDmg / c.arenaDmg) : f.dmg / c.atkMult;
  f.cdr = Math.min(0.5, f.cdr);
  f.speed = CFG.player.speed * c.speedMult * (1 + m.speed + g.speed + A.move);
  f.hp = Math.max(1, Math.round(f.maxHp * ratio));
  f.ammo = Math.min(f.ammo, f.ammoMax);
}
function playerArenaPower(p) {
  const A = CFG.arena, g = gearTotals(p.gear);
  return Math.min(A.powerCap, 1 + A.powerPerLevel * (p.level - 1) + A.powerPerGear * g.score);
}
// owned brawlers (ids = attack ids); Pip (bolt) is the starter
function ownedBrawlers(p) { return CFG.brawlerOrder.filter((id) => id === 'bolt' || p.unlocked.attacks.includes(id)); }
const availableAttacks = ownedBrawlers;
function resolvedAttack(p) { return CFG.brawlers[p.cls] ? p.cls : 'bolt'; }
// artifacts carry their star level (1–10) as the value: effects grow with stars
function artsOf(list, stars) { const o = {}; for (const a of list || []) if (CFG.artifacts[a]) o[a] = (stars && stars[a]) || 1; return o; }
const AK = (s) => (s || 1) - 1; // extra stars beyond the first
function artVal(id, s) {
  const k = AK(s);
  switch (id) {
    case 'mag': return 1 + Math.floor(s / 5);
    case 'splitter': return { n: 3 + Math.floor(s / 3), mult: 0.3 * (1 + 0.08 * k) };
    case 'frost': return 1.2 + 0.15 * k;
    case 'seekerChip': return 2.4 * (1 + 0.12 * k);
    case 'trigger': return 0.2 + 0.02 * k;
    case 'pierce': return 1 + Math.floor(s / 4);
    case 'ember': return 0.35 * (1 + 0.12 * k);
    case 'blast': return { r: 1.5 * (1 + 0.06 * k), mult: 0.4 * (1 + 0.1 * k) };
    case 'vamp': return 0.12 + 0.012 * k;
    case 'rubber': return 1 + Math.floor(s / 4);
    case 'bigshot': return 0.12 + 0.025 * k;
    case 'lens': return 0.12 + 0.015 * k;
    case 'coil': return { mult: 0.4 * (1 + 0.1 * k), n: 1 + Math.floor(s / 5) };
    case 'giant': return 0.3 + 0.04 * k;
    case 'twin': return 0.5 + 0.05 * k;
    case 'reaper': return 0.04 + 0.004 * k;
  }
  return 0;
}
function artDesc(id, s) {
  const v = artVal(id, s), P1 = (x) => Math.round(x * 100) + '%';
  switch (id) {
    case 'mag': return `+${v} ammo bar${v > 1 ? 's' : ''}`;
    case 'splitter': return `Bullets split into ${v.n} shards (${P1(v.mult)} damage)`;
    case 'frost': return `Bullets slow enemies for ${v.toFixed(1)}s`;
    case 'seekerChip': return `Bullets steer toward enemies (turn ${v.toFixed(1)})`;
    case 'trigger': return `+${P1(v)} fire rate and reload speed`;
    case 'pierce': return `Bullets pass through ${v} extra enem${v > 1 ? 'ies' : 'y'}`;
    case 'ember': return `Bullets burn for ${P1(v)} damage`;
    case 'blast': return `Bullets explode (${v.r.toFixed(1)}m, ${P1(v.mult)} damage)`;
    case 'vamp': return `Heal ${P1(v)} of bullet damage`;
    case 'rubber': return `Bullets bounce ${v} extra time${v > 1 ? 's' : ''}`;
    case 'bigshot': return `+35% bullet size and +${P1(v)} damage`;
    case 'lens': return `+${P1(v)} crit chance`;
    case 'coil': return `Hits jump to ${v.n} nearby enem${v.n > 1 ? 'ies' : 'y'} for ${P1(v.mult)}`;
    case 'giant': return `+${P1(v)} damage to elites and bosses`;
    case 'twin': return `Every shot fires one extra bullet at ${P1(v)} damage`;
    case 'reaper': return `Kills refill 1 ammo and heal ${P1(v)} HP`;
  }
  return CFG.artifacts[id].desc;
}
const ART_MAX = 10;
const artShardCost = (s) => 4 * s;              // shards to go from ★s to ★s+1
const artGemCost = (s) => Math.round(10 * Math.pow(s, 1.5));
const gemPrice = (p) => Math.round(30 * Math.pow(CFG.enemies.goldGrowth, p.level - 1) * Math.pow(1.03, p.gemBuys || 0));
function buyGems(n) {
  const p = G.profile; let cost = 0; const b0 = p.gemBuys || 0;
  for (let i = 0; i < n; i++) cost += Math.round(30 * Math.pow(CFG.enemies.goldGrowth, p.level - 1) * Math.pow(1.03, b0 + i));
  if (p.gold < cost) return false;
  p.gold -= cost; p.gemBuys = b0 + n; p.essence += n; G.dirty = true; ev({ t: 'essence', amt: n }); return true;
}
function upgradeArtifact(id) {
  const p = G.profile, s = p.artStars[id] || 1;
  if (!p.unlocked.artifacts.includes(id) || s >= ART_MAX) return false;
  const sh = artShardCost(s), gm = artGemCost(s);
  if ((p.shards[id] || 0) < sh || p.essence < gm) return false;
  p.shards[id] -= sh; p.essence -= gm; p.artStars[id] = s + 1;
  refreshPlayerStats(false); G.dirty = true; ev({ t: 'artUp', id, star: s + 1 }); return true;
}
// shards drop for artifacts you own (elites, dens, bosses, shrines)
function dropShards(n, quiet) {
  const p = G.profile, own = p.unlocked.artifacts; if (!own.length || n <= 0) return;
  const got = {};
  for (let i = 0; i < n; i++) { const id = pick(own); p.shards[id] = (p.shards[id] || 0) + 1; got[id] = (got[id] || 0) + 1; }
  G.dirty = true; if (!quiet) ev({ t: 'shards', got });
}
function applyLoadout(f, attackId, artList, stars) { f.attackId = attackId; f.arts = artsOf(artList, stars); f.weapon = null; }
function weaponOf(f) { return f.weapon || CFG.attacks[f.attackId] || CFG.attacks.bolt; }
function checkUnlocks() {
  const p = G.profile; if (!p) return;
  for (const id of CFG.brawlerOrder) {
    const a = CFG.attacks[id]; if (id === 'bolt' || p.unlocked.attacks.includes(id) || !canSwitchBrawler(p, id)) continue;
    if (unlockMet(a.unlock, p)) { p.unlocked.attacks.push(id); p.newUnlocks.push('a:' + id); ev({ t: 'unlock', what: 'brawler', id, name: CFG.brawlers[id].name, role: a.name }); G.dirty = true; }
  }
  for (const id in CFG.artifacts) {
    const a = CFG.artifacts[id]; if (p.unlocked.artifacts.includes(id)) continue;
    if (unlockMet(a.unlock, p)) { p.unlocked.artifacts.push(id); p.newUnlocks.push('r:' + id); ev({ t: 'unlock', what: 'artifact', id, name: a.name }); G.dirty = true; }
  }
}
// switch the active brawler (in town or anywhere outside a fight); artifacts and trees are per brawler
function setBrawler(id) {
  const p = G.profile; if (!ownedBrawlers(p).includes(id) || G.mode !== 'hub') return false;
  if (!canSwitchBrawler(p, id)) { toast(`Reach mastery ${BRAWLER_SWITCH_MASTERY} with ${CFG.brawlers[p.starterBrawler || 'bolt'].name} to change brawlers`, 'bad'); return false; }
  if (onExpedition(p, id)) { toast(`${CFG.brawlers[id].name} is on an expedition`, 'bad'); return false; }
  if (!p.brawlers[id]) p.brawlers[id] = newBrawlerState();
  p.cls = id; p.artifacts = p.brawlers[id].artifacts;
  refreshPlayerStats(false); G.dirty = true; ev({ t: 'attackEquipped', id }); checkAchievements(); return true;
}
const equipAttack = setBrawler;
const BRAWLER_SWITCH_MASTERY = 80;
function canSwitchBrawler(p, id) { const first = p.starterBrawler || 'bolt'; return id === p.cls || id === first || masteryLevel((p.mastery || {})['w:' + first] || 0) >= BRAWLER_SWITCH_MASTERY; }
function artifactSlotsFor(p) { const earnedLevel = prestigeCount(p) ? Math.max(PRESTIGE_LEVEL,p.level) : p.level; let n = CFG.artifactSlots; for (const L in P.artifactSlotAt) if (earnedLevel >= +L) n = Math.max(n, P.artifactSlotAt[L]); return n; }
function toggleArtifact(id) {
  const p = G.profile; if (!p.unlocked.artifacts.includes(id)) return false;
  const i = p.artifacts.indexOf(id);
  if (i >= 0) p.artifacts.splice(i, 1);
  else { if (p.artifacts.length >= artifactSlotsFor(p)) p.artifacts.shift(); p.artifacts.push(id); }
  refreshPlayerStats(false); G.dirty = true; return true;
}
function refreshPlayerStats(fullHeal) {
  const f = G.player, p = G.profile; if (!f) return;
  f.cls = resolvedAttack(p);
  if (!p.brawlers[f.cls]) p.brawlers[f.cls] = newBrawlerState();
  p.artifacts = p.brawlers[f.cls].artifacts;
  applyLoadout(f, f.cls, p.artifacts, p.artStars);
  applyStats(f, 'hub', p);
  if (fullHeal) f.hp = f.maxHp;
}

// --- events (consumed by render/audio/ui) ------------------------------
function ev(o) { G.events.push(o); }
function toast(text, kind) { ev({ t: 'toast', text, kind: kind || '' }); }
function markCombat() { G.lastCombat = G.time; }

