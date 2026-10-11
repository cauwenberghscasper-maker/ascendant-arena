// --- hub world population ---------------------------------------------------
function patrolCountFor(zi) { const Z = CFG.world.zones[zi]; return Z.safe ? 0 : Math.ceil(Z.count * CFG.world.patrolDensity); }
function zoneAt(z) { const Z = CFG.world.zones; for (let i = Z.length - 1; i >= 0; i--) if (z >= Z[i].z0) return i; return 0; }
function distToTown(x, z) { const T = CFG.world.town; return Math.hypot(x - T.x, z - T.z); }
function randomPointInZone(zi, avoidTown) {
  const W = CFG.world, Z = W.zones[zi];
  for (let tries = 0; tries < 40; tries++) {
    const x = rand(W.minX + 4, W.maxX - 4), z = rand(Math.max(Z.z0, W.minZ) + 4, Math.min(Z.z1, W.maxZ) - 4);
    if (avoidTown && distToTown(x, z) < W.town.r + 8) continue;
    if (pointBlocked(x, z, 1.2)) continue;
    let nearLair = false; for (const l of W.lairList) if (Math.hypot(x - l.x, z - l.z) < 9) nearLair = true;
    if (nearLair) continue;
    return { x, z };
  }
  return { x: 0, z: Z.z0 + 10 };
}
// monster level rises with depth inside a zone
function areaLevel(zi, z) {
  const Z = CFG.world.zones[zi], z0 = Math.max(Z.z0, CFG.world.town.z + CFG.world.town.r), k = clamp((z - z0) / (Z.z1 - z0), 0, 1);
  return Math.round(lerp(Z.lvl[0], Z.lvl[1], k));
}
function enemySpawnClear(e, x, z, respawning) {
  const W = CFG.world, Z = W.zones[e.zone], pad = e.r + 0.45;
  if (x < W.minX + pad || x > W.maxX - pad || z < Math.max(Z.z0, W.minZ) + pad || z > Math.min(Z.z1, W.maxZ) - pad) return false;
  if (distToTown(x, z) < W.town.r + 12) return false;
  if (W.waypoints.some(w => Math.hypot(x - w.x, z - w.z) < 10)) return false;
  if (W.lairList.some(l => Math.hypot(x - l.x, z - l.z) < 10)) return false;
  if (W.pois.some(q => q.zone === e.zone && Math.hypot(x - q.x, z - q.z) < q.r)) return false; // landmarks, caves and secret pockets stay monster-free
  // Test the padded body, including obstacles whose centres occupy another grid cell.
  if (G.obstacles && G.obstacles.list.some(o => Math.hypot(x - o.x, z - o.z) < o.r + pad)) return false;
  if (respawning && G.player.alive && Math.hypot(x - G.player.x, z - G.player.z) < W.spawnSafeRadius) return false;
  return true;
}
const PATROL_LANES = [-0.8, -0.5, -0.17, 0.17, 0.5, 0.8]; // × maxX
function enemySpot(e, respawning = false) {
  const W = CFG.world;
  if (e.rift) {
    const pl = G.player;
    for (let i = 0; i < 30; i++) { const a = rand(0, Math.PI * 2), r = rand(7, CFG.rift.r - 2.5), x = RC.x + Math.sin(a) * r, z = RC.z + Math.cos(a) * r; if (!pointBlocked(x, z, 1.2) && Math.hypot(x - pl.x, z - pl.z) > 8) return { x, z }; }
    return { x: RC.x, z: RC.z + 10 };
  }
  if (e.den != null) {
    const D = W.dens[e.den];
    for (let i = 0; i < 40; i++) { const a = rand(0, Math.PI * 2), r = D.r * Math.sqrt(Math.random()) * 0.92, x = D.x + Math.sin(a) * r, z = D.z + Math.cos(a) * r; if (enemySpawnClear(e, x, z, respawning)) return { x, z }; }
    // A camp occupied by the hero stays cleared until there is room to reappear safely.
    if (respawning) return null;
  }
  const Z = W.zones[e.zone], z0 = e.zone === 0 ? W.town.z + W.town.r + 12 : Z.z0 + 5, z1 = Math.min(Z.z1, W.maxZ) - 5;
  if (e.patrol != null) {
    // Six lanes cover the road and flanks; depth bands scale with each area’s population.
    const lanes = PATROL_LANES.map((k) => k * W.maxX), row = Math.floor(e.patrol / lanes.length), dz = (z1 - z0) / Math.ceil(patrolCountFor(e.zone) / lanes.length);
    for (let i = 0; i < 48; i++) {
      const x = lanes[e.patrol % lanes.length] + rand(-10, 10), z = z0 + (row + 0.5) * dz + rand(-dz * 0.4, dz * 0.4);
      if (enemySpawnClear(e, x, z, respawning)) return { x, z };
    }
    if (respawning) return null;
  }
  for (let i = 0; i < 80; i++) {
    const pt = randomPointInZone(e.zone, true);
    if (enemySpawnClear(e, pt.x, pt.z, respawning)) return pt;
  }
  // The main road is kept clear of scenery; scan it instead of returning an unchecked point.
  for (let z = z0 + 2; z < z1; z += 3) if (enemySpawnClear(e, 0, z, respawning)) return { x: 0, z };
  return null;
}
function enemyLevelFor(e) {
  if (e.rift) return e.riftLvl + (e.elite ? 2 : 0);
  const Z = CFG.world.zones[e.zone];
  let L = clamp(areaLevel(e.zone, e.z) + randInt(-1, 1), Z.lvl[0], Z.lvl[1]);
  // Keep a beginner practice area outside town. Elsewhere unlocked regions trail
  // the hero by at most four levels; gear still helps and difficulty never changes mid-fight.
  const practice = Z.minLevel <= 1 && e.den == null && distToTown(e.x, e.z) < 48;
  if (!practice && G.profile.level >= Z.minLevel) L = Math.max(L, G.profile.level - CFG.world.catchupGap - tierAdd());
  if (e.den != null) L += CFG.world.denLevelBonus;
  if (e.elite) L += 3;
  return L + tierAdd();
}
// --- World Tiers: the whole map levels up and drops get richer. Torment tiers never end.
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
function tierDef(t) {
  t = Math.max(0, t | 0);
  if (t === 0) return { t, name: 'Normal', short: 'N', req: 1, add: 0 };
  if (t === 1) return { t, name: 'Hard', short: 'H', req: 50, add: 20 };
  if (t === 2) return { t, name: 'Nightmare', short: 'NM', req: 80, add: 50 };
  const k = t - 2; return { t, name: 'Torment ' + (ROMAN[k] || k), short: 'T' + k, req: 80 + 40 * k, add: 50 + 40 * k };
}
const tierMul = (t) => ({ gold: 1 + 0.25 * t, gems: 1 + 0.3 * t, drop: 1 + 0.08 * t, xp: 1 + 0.05 * t });
function maxTier(level) { let t = 0; while (tierDef(t + 1).req <= level) t++; return t; }
function curTier() { const p = G.profile; return p ? Math.min(p.worldTier || 0, maxTier(p.level)) : 0; }
function tierAdd() { return tierDef(curTier()).add; }
function setWorldTier(t) {
  const p = G.profile; t = clamp(t | 0, 0, maxTier(p.level));
  if (inInstance() || activeShrine()) { toast('Finish your challenge first', 'bad'); return false; }
  p.worldTier = t; p.records.bestTier = Math.max(p.records.bestTier || 0, t);
  for (const e of G.enemies) if (!e.rift) { const keep = e.alive; setEnemyLevel(e, enemyLevelFor(e)); if (!keep) e.hp = 0; else { e.state = 'idle'; } }
  checkAchievements(); G.dirty = true; ev({ t: 'tier', name: tierDef(t).name, tier: t }); return true;
}
// enemies grow a bit faster than heroes up to level 100, then at the same pace
const egrow = (g, L) => Math.pow(g, Math.min(L, 100) - 1) * Math.pow(1.095, Math.max(0, L - 100));
// each zone mixes its main monster with a second kind (about 1 in 3)
function zoneType(zi, den) { const Z = CFG.world.zones[zi]; return Z.alt && Math.random() < (den ? 0.25 : 0.35) ? Z.alt : Z.enemy; }
function makeEnemy(type, zi, o) {
  o = o || {};
  const e = { id: nextId++, kind: 'enemy', type, zone: zi, team: 'mob', x: 0, z: 0, hx: 0, hz: 0, r: CFG.enemies[type].r, den: o.den != null ? o.den : null, patrol: o.patrol, elite: !!o.elite,
    lvl: 1, hp: 1, maxHp: 1, atk: 1, alive: true, state: 'idle', wanderT: rand(0, 3), wx: 0, wz: 0,
    atkCd: 0, flashT: 0, slowT: 0, invulnT: 0, armorT: 0, respawnT: 0, tagged: false, facing: rand(0, 6.28), moveAmt: 0, lungeT: 0, lungeCd: 0, windT: 0, lastHurt: -99 };
  if (o.rift) { e.rift = true; e.riftLvl = o.lvl; e.guardian = !!o.guardian; e.state = 'chase'; if (e.guardian) e.r *= 1.2; }
  if (e.elite) e.r *= CFG.enemies.elite.r;
  const pt = enemySpot(e);
  if (!pt) throw new Error('No clear enemy spawn in zone ' + zi);
  e.x = e.hx = e.wx = pt.x; e.z = e.hz = e.wz = pt.z;
  setEnemyLevel(e, enemyLevelFor(e));
  G.ents.set(e.id, e);
  return e;
}
// shared combat contract: a reference hero's HP/damage at a level, and the one place enemy damage is resolved
// log-linear lookup in a [[level, value], ...] table (flat below the first row, extends the last segment above)
function lerpTable(T, L) { let i = 1; while (i < T.length - 1 && L > T[i][0]) i++; const [a, x] = T[i - 1], [b, y] = T[i], k = Math.max(0, (L - a) / (b - a)); return x * Math.pow(y / x, k); }
function refHp(L) { const P = CFG.progression; return P.hpBase * Math.pow(P.hpGrowth, L - 1) * lerpTable(CFG.enemies.refHpMult, L); }
function refDmg(L) { const P = CFG.progression; return P.atkBase * Math.pow(P.atkGrowth, L - 1) * lerpTable(CFG.enemies.refDmgMult, L); }
// tankier heroes take bigger hits (sqrt), so stacking HP helps but never makes you unkillable
function mobDmg(e, mult, t) { const b = t && t.maxHp > 0 ? clamp(Math.sqrt(t.maxHp / refHp(e.lvl)), 0.6, 3) : 1; return e.atk * (mult == null ? 1 : mult) * b; }
function inInstance() { return !!(G.rift || G.dungeon); }
// hits scale with the reference hero's HP, health with its damage: equal-level fights feel the same at 1 and 210
function setEnemyLevel(e, lvl) {
  const d = CFG.enemies[e.type], E = CFG.enemies;
  e.lvl = lvl; e.maxHp = Math.round(d.hp * E.hpPerDmg * refDmg(lvl) * (e.elite ? E.elite.hp : 1) * (e.guardian ? 2.5 : 1)); e.hp = e.maxHp;
  e.atk = d.atk * E.atkFrac * refHp(lvl) * (e.elite ? E.elite.atk : 1);
}
function respawnEnemy(e) {
  if (G.time < (G.enemySpawnAt || 0)) return;
  const pt = enemySpot(e, true);
  if (!pt) { e.respawnT = 1; return; }
  G.enemySpawnAt = G.time + CFG.world.spawnGap;
  e.x = e.hx = e.wx = pt.x; e.z = e.hz = e.wz = pt.z; e.alive = true; e.state = 'idle'; e.tagged = false; e.slowT = 0; e.burnT = 0; e.windT = 0;
  e.lungeT = 0; e.lungeCd = rand(1, 2); e.atkCd = rand(0.7, 1.3); e.attackAnim = 0; e.lastHurt = -99; e.cx = e.cz = null;
  setEnemyLevel(e, enemyLevelFor(e));
  ev({ t: 'spawn', x: e.x, z: e.z, elite: e.elite });
}
function rewardEnemyKill(e) {
  const p = G.profile, d = CFG.enemies[e.type], E = CFG.enemies.elite;
  if(G.player.alive && Math.hypot(e.x-G.player.x,e.z-G.player.z)<=24) awardPetCombatXp((10+Math.min(100,e.lvl)*2)*(e.elite?3:1));
  p.stats.kills++; if (e.type === 'slime') p.stats.slimes++; if (e.elite) p.stats.elites = (p.stats.elites || 0) + 1;
  const kb = p.stats.killsBy || (p.stats.killsBy = {}); kb[e.type] = (kb[e.type] || 0) + 1;
  // kill streak: keep killing within a few seconds for bonus XP
  G.streak++; G.streakT = P.streakWindow; if (G.streak > (p.stats.bestStreak || 0)) p.stats.bestStreak = G.streak;
  const bonus = Math.min(P.streakMax, (G.streak - 1) * P.streakStep);
  const diff = e.lvl - p.level;
  let mult = diff < -6 ? Math.max(0.15, 1 + (diff + 6) * 0.12) : 1 + Math.min(0.25, Math.max(0, diff) * 0.04);
  if (e.elite) mult *= E.xp; if (e.den != null) mult *= CFG.world.denXp;
  const TM = tierMul(e.rift ? 0 : curTier());
  const xp = killXpAt(e.lvl) * mult * (1 + bonus) * TM.xp;
  if (p.level < P.cap) addXp(xp, 'kill'); else addGold(xp * 0.05);
  ev({ t: 'killXp', x: e.x, z: e.z, amt: Math.round(xp * progressionXpMultiplier(p)), streak: G.streak });
  addGold((randInt(d.gold[0], d.gold[1]) * Math.pow(CFG.enemies.goldGrowth, e.lvl - 1)) * (e.elite ? E.gold : 1) * TM.gold);
  progressJob('kill', e.type);
  // masteries: the attack you used and the monster you slayed
  const mx = CFG.mastery.killXp * (1 + e.lvl / 10) * (e.elite ? 4 : 1);
  addMastery('w:' + G.player.attackId, mx); addMastery('s:' + e.type, mx);
  // gear drops
  const dropC = e.elite ? E.drop : (e.den != null ? CFG.loot.denDrop : CFG.loot.dropChance) * (1 + (masteryLvl('s:' + e.type) - 1) * CFG.mastery.perLevel.slayerDrop);
  if (Math.random() < dropC * TM.drop) grantItem(makeItem(pick(CFG.gear.slots), rollLoot(e.zone, e.elite), e.lvl), e.elite ? 'elite' : 'monster');
  if (e.elite) { addEssence(Math.round(randInt(E.essence[0], E.essence[1]) * TM.gems * (e.guardian ? 2 : 1))); dropShards(randInt(E.shards[0], E.shards[1])); }
  else if (e.den != null && Math.random() < 0.06 * TM.gems) addEssence(1);
  if (e.den != null && Math.random() < 0.02) dropShards(1);
  checkAchievements();
}

const PELLET_COLORS = [0xff5d8f, 0x5dd6ff, 0xffd34a, 0x8dff6a, 0xc77dff, 0xff9b3d, 0x6cf0c2];
function pelletValue(zi) { const p = G.profile; return xpToNext(p.level) * CFG.pellets.xpFrac * CFG.pellets.zoneMult[zi]; }
function stepPellets(dt) {
  const pl = G.player, rr = CFG.pellets.pickR;
  for (const pe of G.pellets) {
    if (!pe.active) {
      pe.respawnT -= dt;
      if (pe.respawnT <= 0) { const pt = randomPointInZone(pe.zone, false); pe.x = pt.x; pe.z = pt.z; pe.active = true; G.pelletsDirty = true; }
      continue;
    }
    for (let i = 0; i < G.hubFighters.length; i++) {
      const f = G.hubFighters[i]; if (!f.alive) continue;
      const dx = f.x - pe.x, dz = f.z - pe.z, r = f.r + rr;
      if (dx * dx + dz * dz < r * r) {
        pe.active = false; pe.respawnT = CFG.pellets.respawn; G.pelletsDirty = true;
        if (f.isPlayer) {
          G.profile.stats.pellets++;
          if (G.profile.level < P.cap) addXp(pelletValue(pe.zone)); else addGold(1);
          addMastery('scav', 2 + pe.zone);
          ev({ t: 'pellet', x: pe.x, z: pe.z, color: pe.color });
        }
        break;
      }
    }
  }
}
function stepShrines(dt) {
  const S = CFG.shrines, pl = G.player, p = G.profile;
  for (const sh of G.shrines) {
    const d = Math.hypot(pl.x - sh.x, pl.z - sh.z);
    if (sh.state === 'cooldown') { sh.cd -= dt; if (sh.cd <= 0) sh.state = 'ready'; continue; }
    if (sh.state === 'ready') {
      if (pl.alive && d < S.r && p.level >= CFG.world.zones[sh.zone].minLevel && !inInstance()) {
        sh.state = 'active'; sh.t = S.time; sh.wave = [];
        const Z = CFG.world.zones[sh.zone];
        for (let i = 0; i < S.wave; i++) {
          const e = makeEnemy(Z.enemy, sh.zone), a = (i / S.wave) * Math.PI * 2;
          e.x = e.hx = sh.x + Math.sin(a) * 8; e.z = e.hz = sh.z + Math.cos(a) * 8; e.temp = true; e.state = 'chase';
          setEnemyLevel(e, clamp(p.level, Z.lvl[0] + tierAdd(), Z.lvl[1] + 1 + tierAdd()));
          G.enemies.push(e); sh.wave.push(e);
        }
        ev({ t: 'shrineStart', i: sh.i, n: S.wave, secs: S.time });
      }
      continue;
    }
    // active challenge
    if (!G.modal) sh.t -= dt;
    const left = sh.wave.filter((e) => e.alive).length;
    if (left === 0) {
      sh.state = 'cooldown'; sh.cd = S.cooldownWin * (p.settings.fastXp ? P.testShrineCd : 1); p.stats.shrines = (p.stats.shrines || 0) + 1;
      const gold = Math.round((S.goldBase + S.goldPerLevel * p.level) * Math.pow(CFG.enemies.goldGrowth, p.level - 1)); addGold(gold);
      const item = makeItem(pick(CFG.gear.slots), rollRarity('shrine'), p.level + 1);
      grantItem(item, 'shrine'); dropShards(randInt(2, 4)); addEssence(randInt(3, 6));
      addXp(xpToNext(p.level) * S.xpFrac, 'shrine');
      ev({ t: 'shrineWin', i: sh.i, gold }); checkAchievements(); cleanupWave(sh);
    } else if (sh.t <= 0 || !pl.alive || d > S.leash) {
      sh.state = 'cooldown'; sh.cd = S.cooldownFail * (p.settings.fastXp ? P.testShrineCd : 1);
      for (const e of sh.wave) e.alive = false;
      cleanupWave(sh);
      ev({ t: 'shrineFail', i: sh.i });
    }
  }
}
function cleanupWave(sh) {
  const ids = new Set(sh.wave.map((e) => e.id));
  G.enemies = G.enemies.filter((e) => !ids.has(e.id));
  for (const id of ids) G.ents.delete(id);
  sh.wave = [];
}
// --- Rift: endless floors in a sealed sanctum. Clear each wave before time runs out; every 5th floor has guardians.
function riftRarity(n) {
  const x = Math.random();
  if (n >= 100 && x < Math.min(0.3, 0.05 + (n - 100) * 0.002)) return 'divine';
  if (n >= 50 && x < Math.min(0.5, 0.15 + (n - 50) * 0.004)) return 'ancient';
  if (n >= 25 && x < Math.min(0.7, 0.3 + (n - 25) * 0.008)) return 'mythic';
  return Math.random() < Math.min(0.75, 0.1 + n * 0.012) ? 'legendary' : 'epic';
}
const riftLevel = (n) => Math.round(CFG.rift.lvlBase + CFG.rift.lvlPer * n);
const riftCheckpoint = (p) => Math.floor((p.records.bestRift || 0) / 5) * 5 + 1;
function riftClamp(f, r) { const R = CFG.rift.r - r, dx = f.x - RC.x, dz = f.z - RC.z, d = Math.hypot(dx, dz); if (d > R) { f.x = RC.x + dx / d * R; f.z = RC.z + dz / d * R; } }
function startRift(floor) {
  const p = G.profile, R = CFG.rift;
  if (inInstance() || G.mode !== 'hub' || p.level < R.unlock || activeShrine() || !G.player.alive) return false;
  floor = clamp(floor | 0, 1, riftCheckpoint(p));
  G.rift = { floor, start: floor, phase: 'intro', t: R.intro, tMax: R.intro, wave: [], gems: 0, gold: 0, items: 0, cleared: 0, kills: 0 };
  G.obstacles = G.riftObstacles || G.obstacles; clearProjectiles();
  const pl = G.player; pl.x = RC.x; pl.z = RC.z - R.r + 5; pl.facing = 0; pl.hp = pl.maxHp; pl.invulnT = 1.5; pl.ammo = pl.ammoMax;
  ev({ t: 'riftStart', floor, x: pl.x, z: pl.z }); return true;
}
function riftTime(n) { return CFG.rift.time + Math.min(30, n * 0.5); }
// Deeper floors bring fewer monsters, but Champions with telegraphed attacks you have to read and dodge.
// Monster level never drops far below yours, so the Rift stays a real fight at any hero level.
const CHAMP_MODS = {
  nova: { name: 'Nova', cd: [4.5, 6.5] }, slam: { name: 'Quake', cd: [4, 6] }, charge: { name: 'Charger', cd: [4, 6] }, spiral: { name: 'Spiral', cd: [6, 8] },
  mortar: { name: 'Bombard', cd: [5, 7] }, shield: { name: 'Shielded', cd: [7, 9] }, frenzy: { name: 'Frenzied', cd: [99, 99] }, blink: { name: 'Blinker', cd: [5.5, 7.5] },
};
function riftWaveLevel(n) { return Math.max(riftLevel(n), G.profile.level - 6 + Math.floor(n / 5)); }
function riftComposition(n) {
  const lord = n % CFG.rift.bossEvery === 0;
  let champs = n < 4 ? 0 : n < 10 ? 1 : Math.min(5, 2 + Math.floor((n - 10) / 12));
  let minions = n < 10 ? 6 + Math.floor(n * 0.5) : Math.max(2, 9 - Math.floor((n - 10) / 4));
  if (lord) { champs = Math.max(0, champs - 1); minions = Math.ceil(minions / 2); }
  return { lord, champs, minions, mods: Math.min(3, 1 + (n >= 15 ? 1 : 0) + (n >= 40 ? 1 : 0)) };
}
function champDmgFrac(n) { return 0.16 + Math.min(0.34, n * 0.004); }
function makeChampion(type, zi, lvl, nMods, lord) {
  const e = makeEnemy(type, zi, { rift: true, lvl, elite: true, guardian: lord });
  const keys = Object.keys(CHAMP_MODS).sort(() => Math.random() - 0.5).slice(0, Math.min(4, nMods + (lord ? 1 : 0)));
  e.champ = { mods: keys, cd: {}, cast: null, castT: 0, spin: 0, spinT: 0, chargeT: 0, hitDone: false, shieldT: 0 };
  for (const k of keys) e.champ.cd[k] = rand(1.5, 3.5);
  e.champName = keys.map((k) => CHAMP_MODS[k].name).join(' · ');
  return e;
}
function spawnRiftWave() {
  const r = G.rift, n = r.floor, lvl = riftWaveLevel(n), Zs = CFG.world.zones, zi = 1 + (n - 1) % (Zs.length - 1), Z = Zs[zi];
  const C = riftComposition(n);
  r.wave = []; r.lastHp = G.player.hp; r.hits = 0;
  const add = (e) => { G.enemies.push(e); r.wave.push(e); ev({ t: 'spawn', x: e.x, z: e.z, elite: e.elite }); };
  if (C.lord) add(makeChampion(Z.enemy, zi, lvl + 2, C.mods + 1, true));
  for (let i = 0; i < C.champs; i++) add(makeChampion(i % 2 ? (Z.alt || Z.enemy) : Z.enemy, zi, lvl, C.mods, false));
  for (let i = 0; i < C.minions; i++) add(makeEnemy(Math.random() < 0.5 ? Z.enemy : (Z.alt || Z.enemy), zi, { rift: true, lvl }));
  r.phase = 'fight'; r.t = r.tMax = riftTime(n);
  ev({ t: 'riftWave', floor: n, guard: C.lord, champs: C.champs + (C.lord ? 1 : 0), lvl, theme: Z.name });
}
function clearRiftWave() {
  const r = G.rift; if (!r) return;
  const ids = new Set(r.wave.map((e) => e.id));
  G.enemies = G.enemies.filter((e) => !ids.has(e.id)); for (const id of ids) G.ents.delete(id);
  r.wave = [];
}
function riftFloorClear() {
  const r = G.rift, p = G.profile, R = CFG.rift, n = r.floor, lvl = riftWaveLevel(n);
  // grade: S = no hits taken, A = fast with few hits, B = cleared
  const fast = r.t > r.tMax * 0.5, grade = r.hits === 0 ? 'S' : r.hits <= 2 && fast ? 'A' : 'B', gm = grade === 'S' ? 2 : grade === 'A' ? 1.5 : 1;
  const gems = Math.round((2 + Math.floor(n / 3)) * gm); addEssence(gems); r.gems += gems;
  dropShards(Math.round((1 + Math.floor(n / 10)) * gm), true);
  r.grades = r.grades || { S: 0, A: 0, B: 0 }; r.grades[grade]++;
  if (grade === 'S') { p.records.riftFlawless = (p.records.riftFlawless || 0) + 1; }
  const gold = Math.round((20 + 6 * lvl) * Math.pow(CFG.enemies.goldGrowth, lvl - 1)); addGold(gold, true); r.gold += gold;
  let item = null;
  if (n % R.bossEvery === 0) { item = makeItem(pick(CFG.gear.slots), riftRarity(n), lvl); grantItem(item, 'rift'); r.items++; }
  if (n > (p.records.bestRift || 0)) p.records.bestRift = n;
  r.cleared++; addMastery('w:' + G.player.attackId, 20 + n * 4);
  checkAchievements(); G.dirty = true;
  ev({ t: 'riftClear', floor: n, gems, gold, item: !!item, grade });
}
function stepRift(dt) {
  const r = G.rift, R = CFG.rift, pl = G.player;
  if (!pl.alive) { endRift('down'); return; }
  if (!G.modal) r.t -= dt;
  if (pl.riftIframe) { pl.riftIframe = false; pl.invulnT = Math.max(pl.invulnT, 0.55); }
  if (pl.hp < (r.lastHp || pl.hp) - pl.maxHp * 0.01) r.hits = (r.hits || 0) + 1;
  r.lastHp = pl.hp;
  if (r.phase === 'intro') { if (r.t <= 0) spawnRiftWave(); }
  else if (r.phase === 'fight') {
    if (!r.wave.some((e) => e.alive)) { riftFloorClear(); r.phase = 'clear'; r.t = r.tMax = R.clear; }
    else if (r.t <= 0) endRift('time');
  } else if (r.phase === 'clear' && r.t <= 0) { clearRiftWave(); r.floor++; spawnRiftWave(); }
}
function riftLeft() { return G.rift ? G.rift.wave.filter((e) => e.alive).length : 0; }
function endRift(why) {
  const r = G.rift; if (!r) return;
  clearRiftWave(); clearProjectiles();
  G.rift = null; G.obstacles = G.hubObstacles;
  const pl = G.player, p = G.profile;
  if (pl.alive) { pl.x = CFG.rift.gate.x + 2.5; pl.z = CFG.rift.gate.z + 3; pl.invulnT = 1; pl.hp = pl.maxHp; }
  else { pl.x = CFG.world.spawn.x; pl.z = CFG.world.spawn.z; }
  G.zoneIdx = zoneAt(pl.z);
  const res = { why, floor: r.floor, start: r.start, cleared: r.cleared, grades: r.grades || { S: 0, A: 0, B: 0 }, gems: r.gems, gold: r.gold, items: r.items, best: p.records.bestRift || 0, x: pl.x, z: pl.z };
  G.riftResult = res; G.dirty = true;
  ev(Object.assign({ t: 'riftEnd' }, res));
}
function activeShrine() { return G.shrines.find((s) => s.state === 'active') || null; }
// town NPCs can be hidden (Settings) so the town only shows real players; the code stays, they just don't appear
const NO_NPCS = [];
function shownNpcs() { return G.profile && G.profile.settings.npcs ? (G.npcs || NO_NPCS) : NO_NPCS; }
function initHub() {
  const W = CFG.world, p = G.profile;
  G.player = makeFighter({ name: 'You', team: 'ally', isPlayer: true, cls: resolvedAttack(p), x: W.spawn.x, z: W.spawn.z, facing: 0 });
  refreshPlayerStats(true);
  G.hubFighters = [G.player];
  if (p.settings.bots) addHubBots();
  initHubWorld();
}
// optional bot players (off by default: the open world is for real players)
function addHubBots() {
  const W = CFG.world, p = G.profile;
  G.hubFighters = [G.player];
  const names = BOT_NAMES.slice().sort(() => Math.random() - 0.5);
  for (let i = 0; i < CFG.bots.hubCount; i++) {
    const lvl = i % 2 ? Math.max(1, p.level + randInt(-4, 5)) : randInt(1, Math.max(65, p.level));
    const cls = pick(CFG.brawlerOrder);
    const pt = Math.random() < 0.35 ? { x: rand(-14, 14), z: W.town.z + rand(-10, 12) } : randomPointInZone(randInt(0, highestZone(lvl)), true);
    const b = makeFighter({ name: names[i % names.length], team: 'ally', isBot: true, cls, x: pt.x, z: pt.z, level: lvl,
      color: BOT_COLORS[i % BOT_COLORS.length], ai: { state: 'idle', t: rand(0, 3), dx: pt.x, dz: pt.z, shootT: rand(0, 1), joinBoss: Math.random() < 0.65, slot: Math.random() * Math.PI * 2, stuckT: 0, lx: pt.x, lz: pt.z, hunter: Math.random() < 0.6 } });
    applyLoadout(b, cls, []);
    applyStats(b, 'hub', { level: lvl, gear: null }); b.hp = b.maxHp;
    G.hubFighters.push(b);
  }
}
function removeHubBots() { G.hubFighters = [G.player]; }
function initHubWorld() {
  const W = CFG.world;
  // enemies
  G.enemies = [];
  W.zones.forEach((zn, zi) => {
    for (let i = 0; i < patrolCountFor(zi); i++) G.enemies.push(makeEnemy(zoneType(zi), zi, { patrol: i }));
    if (!zn.safe) for (let i = 0; i < W.elitesPerZone; i++) G.enemies.push(makeEnemy(zoneType(zi), zi, { elite: true }));
  });
  W.dens.forEach((D, di) => {
    for (let i = 0; i < D.n; i++) G.enemies.push(makeEnemy(zoneType(D.zone, true), D.zone, { den: di }));
    G.enemies.push(makeEnemy(W.zones[D.zone].enemy, D.zone, { den: di, elite: true }));
  });
  // per-zone buckets: body separation only scans the monsters of the same area (zones never change on respawn)
  G.enemiesByZone = W.zones.map(() => []);
  for (const e of G.enemies) { e.zb = true; G.enemiesByZone[e.zone].push(e); }
  // NPCs
  G.npcsAll = G.npcs = NPC_DEFS.map((d) => ({ id: d.id, def: d, x: d.x, z: d.z, facing: Math.atan2(W.town.x - d.x, W.town.z - d.z), kind: 'npc', moveAmt: 0, alive: true }));
  // XP orbs (agar.io style)
  G.pellets = [];
  CFG.pellets.perZone.forEach((n, zi) => { for (let i = 0; i < n; i++) { const pt = randomPointInZone(zi, false); G.pellets.push({ x: pt.x, z: pt.z, zone: zi, active: true, respawnT: 0, color: pick(PELLET_COLORS) }); } });
  G.pelletsDirty = true;
  // challenge shrines
  G.shrines = CFG.shrines.list.map((sp, i) => ({ i, x: sp.x, z: sp.z, zone: zoneAt(sp.z), state: 'ready', t: 0, cd: 0, wave: [] }));
  // berries
  G.berries = [];
  for (let i = 0; i < W.berryCount; i++) { const pt = randomPointInZone(1, true); G.berries.push({ x: pt.x, z: pt.z, active: true, respawnT: 0, seed: Math.random() * 10 }); }
}

// --- hub step -----------------------------------------------------------------
function stepHub(dt) {
  const pl = G.player, W = CFG.world;
  // menus: you cannot be hit or targeted while one is open, plus a short grace after closing
  G.menuSafe = G.modal ? 1.2 : Math.max(0, (G.menuSafe || 0) - dt);
  // player
  if (pl.alive) stepFighter(pl, dt, 'hub');
  else {
    G.respawnT -= dt;
    if (G.respawnT <= 0) { const sp = G.respawnAt || W.spawn; G.respawnAt = null; pl.alive = true; pl.x = sp.x; pl.z = sp.z; pl.hp = pl.maxHp; pl.invulnT = 1.5; ev({ t: 'respawn' }); }
  }
  // zone change
  if (G.rift) stepRift(dt);
  if (G.dungeon) stepDungeon(dt);
  const zi = inInstance() ? G.zoneIdx : zoneAt(pl.z);
  if (zi !== G.zoneIdx) { G.zoneIdx = zi; ev({ t: 'zone', name: W.zones[zi].name, town: false }); if (zi > G.profile.stats.zone) { G.profile.stats.zone = zi; checkAchievements(); } }
  // bots
  for (let i = 1; i < G.hubFighters.length; i++) { const b = G.hubFighters[i]; hubBotThink(b, dt); stepFighter(b, dt, 'hub'); }
  // enemies
  for (const e of G.enemies) stepEnemy(e, dt);
  // kill streak decay, auto-salvage summary, waypoint discovery
  if (G.streak > 0) { G.streakT -= dt; if (G.streakT <= 0) { if (G.streak >= 5) ev({ t: 'streakEnd', n: G.streak }); G.streak = 0; } }
  if (G.salvageAcc) { G.salvageAcc.t -= dt; if (G.salvageAcc.t <= 0) { const a = G.salvageAcc; G.salvageAcc = null; ev({ t: 'salvaged', n: a.n, gold: a.gold, ess: a.ess }); } }
  if (pl.alive) CFG.world.waypoints.forEach((w, i) => {
    if (!G.profile.waypoints.includes(i) && Math.hypot(pl.x - w.x, pl.z - w.z) < 7) { G.profile.waypoints.push(i); G.dirty = true; ev({ t: 'waypoint', name: w.name }); }
  });
  if (pl.alive) for (const sc of W.secrets) if (!G.profile.secrets[sc.id] && Math.abs(pl.z - sc.z) < 4 && Math.hypot(pl.x - sc.x, pl.z - sc.z) < 4) findSecret(sc);
  // XP orbs and challenge shrines
  stepPellets(dt);
  stepShrines(dt);
  // boss
  if (!G.rift) stepBossTimer(dt);
  if (G.boss) stepBoss(G.boss, dt);
  // berries
  for (const b of G.berries) {
    if (!b.active) { b.respawnT -= dt; if (b.respawnT <= 0) { const pt = randomPointInZone(0, true); b.x = pt.x; b.z = pt.z; b.active = true; } continue; }
    if (pl.alive && Math.hypot(pl.x - b.x, pl.z - b.z) < 1.4) {
      b.active = false; b.respawnT = W.berryRespawn;
      const j = G.profile.job;
      if (j && j.type === 'collect' && j.target === 'berry' && j.progress < j.count) progressJob('collect', 'berry'); else addGold(2);
      ev({ t: 'pickup', x: b.x, z: b.z });
    }
  }
  // interaction target: NPCs and waypoint stones
  G.interact = null;
  if (G.rift) { if (pl.alive) G.interact = { kind: 'riftLeave' }; }
  else if (G.dungeon) { if (pl.alive) G.interact = dungeonInteract(pl); }
  else if (pl.alive) {
    let best = 3.6;
    { const RG = CFG.rift.gate, d = Math.hypot(pl.x - RG.x, pl.z - RG.z); if (d < best) { best = d; G.interact = { kind: 'rift' }; } }
    for (const po of dungeonPois()) { const d = Math.hypot(pl.x - po.x, pl.z - po.z); if (d < best) { best = d; G.interact = { kind: 'dungeon', poi: po, label: 'Enter ' + po.name }; } }
    for (const n of shownNpcs()) { const d = Math.hypot(pl.x - n.x, pl.z - n.z); if (d < best) { best = d; G.interact = n; } }
    CFG.world.waypoints.forEach((w, i) => { const d = Math.hypot(pl.x - w.x, pl.z - w.z); if (d < best) { best = d; G.interact = { kind: 'waypoint', i, def: w }; } });
  }
  // boss proximity counts as combat
  if (G.boss && Math.hypot(pl.x - G.boss.x, pl.z - G.boss.z) < 22) markCombat();
}

// secrets: first visit pays an epic+ item, gems, shards and a permanent +0.5% XP (progressionXpMultiplier)
function findSecret(sc) {
  const p = G.profile, gems = 15 + sc.zone;
  p.secrets[sc.id] = Date.now(); G.dirty = true;
  grantItem(makeItem(pick(CFG.gear.slots), Math.random() < 0.2 ? 'legendary' : 'epic', sc.lvl + 2 + tierAdd()), 'shrine', { zone: sc.zone });
  addEssence(gems); dropShards(2);
  toast(`Secret found: ${sc.name}! +${gems} gems · +0.5% XP for good`, 'good');
  ev({ t: 'secret', id: sc.id, x: sc.x, z: sc.z }); checkAchievements();
}
function hubBotThink(b, dt) {
  const ai = b.ai, it = b.intent, W = CFG.world;
  it.mx = it.mz = 0; it.aiming = false;
  ai.t -= dt; ai.shootT -= dt;
  let tx = ai.dx, tz = ai.dz, moving = ai.state === 'walk';
  const boss = G.boss;
  if (boss && ai.joinBoss && (b.level >= W.zones[zoneAt(boss.z)].minLevel)) {
    const rr = 8 + (ai.slot % 1) * 3;
    tx = boss.x + Math.sin(ai.slot + G.time * 0.15) * rr; tz = boss.z + Math.cos(ai.slot + G.time * 0.15) * rr;
    moving = Math.hypot(tx - b.x, tz - b.z) > 1.2;
    if (Math.hypot(boss.x - b.x, boss.z - b.z) < 16 && ai.shootT <= 0) {
      ai.shootT = CFG.boss.botFireEvery * rand(0.8, 1.3);
      const dx = boss.x - b.x, dz = boss.z - b.z, d = Math.hypot(dx, dz);
      it.ax = dx / d; it.az = dz / d; it.aiming = true; it.fire = true;
    }
  } else {
    if (ai.state === 'idle' && ai.t <= 0) {
      ai.state = 'walk';
      if (Math.random() < 0.3) { const n = pick(NPC_DEFS); ai.dx = n.x + rand(-2, 2); ai.dz = n.z + rand(-2, 2); }
      else {
        const maxZone = highestZone(b.level);
        const pt = randomPointInZone(Math.random() < 0.6 ? maxZone : randInt(0, maxZone), false); ai.dx = pt.x; ai.dz = pt.z;
      }
      tx = ai.dx; tz = ai.dz; moving = true;
    }
    if (ai.state === 'walk' && Math.hypot(ai.dx - b.x, ai.dz - b.z) < 1.5) { ai.state = 'idle'; ai.t = rand(2, 6); moving = false; }
    if (ai.hunter && ai.shootT <= 0) {
      ai.shootT = 1.2;
      let best = null, bd = 10;
      for (const e of G.enemies) { if (!e.alive) continue; const d = Math.hypot(e.x - b.x, e.z - b.z); if (d < bd) { bd = d; best = e; } }
      if (best) { const dx = best.x - b.x, dz = best.z - b.z; it.ax = dx / bd; it.az = dz / bd; it.aiming = true; it.fire = true; }
    }
  }
  if (moving) {
    const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz) || 1;
    const sp = boss && ai.joinBoss ? 1 : 0.7;
    it.mx = (dx / d) * sp; it.mz = (dz / d) * sp;
    // stuck detection
    ai.stuckT += dt;
    if (ai.stuckT > 1.5) { if (Math.hypot(b.x - ai.lx, b.z - ai.lz) < 1) { ai.state = 'idle'; ai.t = 0.2; ai.slot += 1.3; } ai.stuckT = 0; ai.lx = b.x; ai.lz = b.z; }
  }
}

// mass-based push: a moves by mB/(mA+mB) of the overlap, b by the rest (heavy monsters shove the hero)
function separate(a, b) {
  const dx = a.x - b.x, dz = a.z - b.z, min = a.r + b.r;
  if (Math.abs(dx) > min || Math.abs(dz) > min) return;
  const d = Math.hypot(dx, dz);
  if (d >= min) return;
  const nx = d > 1e-4 ? dx / d : 1, nz = d > 1e-4 ? dz / d : 0, push = min - d;
  const ma = bodyMass(a), mb = bodyMass(b), k = mb / (ma + mb);
  a.x += nx * push * k; a.z += nz * push * k; b.x -= nx * push * (1 - k); b.z -= nz * push * (1 - k);
}
const bodyMass = (e) => { const M = CFG.enemies.mass; return e.kind === 'enemy' ? (M[(CFG.enemies[e.type] || {}).kit || 'legacy'] || 1) * (e.elite ? M.elite : 1) : M.player; };
function stepEnemy(e, dt) {
  if (!e.alive) { if (e.rift || e.dungeon) return; e.respawnT -= dt; if (e.respawnT <= 0) respawnEnemy(e); return; }
  const d = CFG.enemies[e.type], pl = G.player, Z = CFG.world.zones[e.zone];
  if (e.rift && e.state !== 'chase') e.state = 'chase';
  const dp = Math.hypot(pl.x - e.x, pl.z - e.z);
  // far-away monsters sleep (keeps big maps cheap on phones)
  if (e.state === 'idle' && dp > 64 && !(e.burnT > 0)) return;
  e.atkCd -= dt; e.flashT -= dt; e.slowT -= dt; e.wanderT -= dt; e.lungeT -= dt; e.lungeCd -= dt;
  tickBurn(e, dt); if (!e.alive) return;
  const slow = e.slowT > 0 ? 0.5 : 1;
  const plSafe = !pl.alive || G.menuSafe > 0 || distToTown(pl.x, pl.z) < CFG.world.town.r + 2;
  if (e.rift && G.menuSafe > 0) { e.moveAmt = Math.max(0, (e.moveAmt || 0) - dt * 3); return; }
  if (e.champ && e.rift && pl.alive && champTick(e, dt, pl, dp)) { trackVel(e, dt); collideObstacles(e); riftClamp(e, e.r); return; }
  const homeD = Math.hypot(e.x - e.hx, e.z - e.hz);
  let mx = 0, mz = 0, sp = 0;
  if (e.state === 'idle') {
    if (e.wanderT <= 0) { const wr = e.den != null ? 3 : 6; e.wx = e.hx + rand(-wr, wr); e.wz = e.hz + rand(-wr, wr); e.wanderT = rand(2, 5); }
    const dx = e.wx - e.x, dz = e.wz - e.z, dd = Math.hypot(dx, dz);
    if (dd > 0.5) { mx = dx / dd; mz = dz / dd; sp = d.speed * 0.35; }
    if (!plSafe && (dp < d.aggro || (e.lastHurt > G.time - 1 && dp < d.aggro * 2))) e.state = 'chase';
  } else if (e.state === 'chase') {
    if (!e.rift && (plSafe || homeD > d.leash)) { e.state = 'return'; }
    else {
      markCombat();
      const dx = pl.x - e.x, dz = pl.z - e.z, dd = dp || 1;
      if (d.moves && enemyMove(e, dt, pl, dp)) sp = 0; // a telegraphed move (or a hub elite's affix) owns this frame
      else if (d.attack === 'touch') {
        mx = dx / dd; mz = dz / dd; sp = dd < e.r + pl.r + 0.15 ? 0 : d.speed; // hold at arm's length instead of grinding into the hero
        // All burst movement warns first, then follows the displayed lane. Moving
        // sideways or dashing during the windup must not cause the attack to track you.
        if (d.charge || d.lunge) {
          if (e.windT > 0) { e.windT -= dt; sp = 0; if (e.windT <= 0) e.lungeT = d.charge ? 0.55 : 0.35; }
          else if (dd < (d.charge ? 9 : 5) && e.lungeCd <= 0) {
            e.windT = d.charge ? 0.6 : 0.45; e.lungeCd = d.charge ? 3.2 : 2.4; e.cx = dx / dd; e.cz = dz / dd; sp = 0;
            ev({ t: 'telegraph', x: e.x, z: e.z, a: Math.atan2(dx, dz), len: d.charge ? 8 : 5, w: e.r * 2 });
          }
          if (e.lungeT > 0 && e.cx != null) { mx = e.cx; mz = e.cz; }
        }
        if (e.lungeT > 0) sp *= d.charge ? 3 : 2.3;
        if (dd < e.r + pl.r + 0.35 && e.atkCd <= 0 && e.windT <= 0) {
          e.atkCd = d.cd; e.attackAnim = 1;
          dealDamage(pl, mobDmg(e, (e.lungeT > 0 && d.charge ? 1.5 : 1) * (d.heavy ? CFG.enemies.heavyMult : 1), pl), e.id, { knockX: dx, knockZ: dz, knock: d.heavy ? 12 : 4, burn: d.burn ? mobDmg(e, d.burn, pl) : 0, burnT: 2 });
          if (d.heavy) ev({ t: 'boom', x: pl.x, z: pl.z, r: 1.6, color: 0xdfeaf4 });
        }
      } else {
        sp = d.speed;
        if (dd > d.keep + 1.5) { mx = dx / dd; mz = dz / dd; }
        else if (dd < d.keep - 1.5) { mx = -dx / dd; mz = -dz / dd; }
        else { mx = -dz / dd * 0.6; mz = dx / dd * 0.6; }
        if (e.atkCd <= 0 && dd < d.aggro + 3) {
          e.atkCd = d.cd * rand(0.85, 1.2); e.attackAnim = 1;
          const t = dd / d.shotSpeed, lx = pl.x + (pl.intent.mx || 0) * pl.speed * t * 0.5, lz = pl.z + (pl.intent.mz || 0) * pl.speed * t * 0.5;
          const a0 = Math.atan2(lx - e.x, lz - e.z), n = (d.shots || 1) + (e.elite ? 2 : 0), spr = d.spread || 0.35;
          for (let k = 0; k < n; k++) {
            const a = n > 1 ? a0 + (k / (n - 1) - 0.5) * spr * (e.elite ? 1.4 : 1) : a0;
            spawnProjectile({ x: e.x, z: e.z, vx: Math.sin(a) * d.shotSpeed, vz: Math.cos(a) * d.shotSpeed, life: (d.aggro + 6) / d.shotSpeed, r: e.elite ? 0.5 : 0.4, dmg: mobDmg(e, 1, pl), team: 'mob', owner: e.id, kind: 'orb', color: d.shotColor || 0x7fe3ff, y: 1.4, burn: d.burn ? mobDmg(e, d.burn, pl) : 0, burnT: d.burn ? 2 : 0 });
          }
          ev({ t: 'shoot', kind: 'enemy', x: e.x, z: e.z });
        }
      }
      e.facing = Math.atan2(dx, dz);
    }
  } else if (e.state === 'return') {
    const dx = e.hx - e.x, dz = e.hz - e.z, dd = Math.hypot(dx, dz);
    if (dd < 1) { e.state = 'idle'; e.hp = e.maxHp; e.tagged = false; }
    else { mx = dx / dd; mz = dz / dd; sp = d.speed * 1.1; }
    e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.3 * dt);
    if (!plSafe && dp < d.aggro * 0.6) e.state = 'chase';
  }
  const spm = e.rift ? 1 : CFG.enemies.speedMult || 1; e.x += mx * sp * slow * spm * dt; e.z += mz * sp * slow * spm * dt;
  e.moveAmt = lerp(e.moveAmt || 0, sp > 0 ? Math.min(1, sp / d.speed) : 0, 1 - Math.exp(-dt * 10));
  if (sp > 0 && e.state !== 'chase') e.facing = Math.atan2(mx, mz);
  e.attackAnim = Math.max(0, (e.attackAnim || 0) - dt * 3);
  trackVel(e, dt);
  // keep bodies apart: enemy vs player and vs other enemies
  if (pl.alive) separate(e, pl);
  const near = e.zb && G.enemiesByZone ? G.enemiesByZone[e.zone] : G.enemies;
  for (let i = 0; i < near.length; i++) { const o = near[i]; if (o !== e && o.alive && o.zone === e.zone) separate(e, o); }
  collideObstacles(e);
  if (e.rift) { riftClamp(e, e.r); return; }
  if (e.dungeon) { dungeonClamp(e, e.r); return; }
  // stay in own zone and out of town
  e.z = clamp(e.z, Z.z0 + 1, Z.z1 - 1); e.x = clamp(e.x, CFG.world.minX, CFG.world.maxX);
  const T = CFG.world.town, td = distToTown(e.x, e.z), minT = T.r + 1.5;
  if (td < minT) { e.x = T.x + (e.x - T.x) / (td || 1) * minT; e.z = T.z + (e.z - T.z) / (td || 1) * minT; }
}

// --- monster moves
// Each move warns in red the moment its windup starts (a pendingAoE ring, a lane or a cast ring) and then commits to
// what it showed: leaving the marker during the windup always avoids it. Damage always goes through mobDmg.
function moveState(e) { const M = { k: null, t: 0, seen: 0, gap: 1, cd: {}, x: 0, z: 0, sx: 0, sz: 0, a: 0, lx: 1e9, lz: 1e9, frenzyT: 0, pack: [], packT: 0 }; for (const k of CFG.enemies[e.type].moves) M.cd[k] = rand(1, 3); return M; }
// hub elites roll Rift champion affixes (two from area 10 on); champTick runs them at reduced damage
function eliteMods(e) {
  const keys = Object.keys(CHAMP_MODS).sort(() => Math.random() - 0.5).slice(0, e.zone >= 10 ? 2 : 1);
  e.champ = { mods: keys, cd: {}, cast: null, castT: 0, spin: 0, spinT: 0, chargeT: 0, hitDone: false, shieldT: 0 };
  for (const k of keys) e.champ.cd[k] = rand(1.5, 3.5);
  e.champName = keys.map((k) => CHAMP_MODS[k].name).join(' · ');
}
const moveAoE = (e, x, z, r, t, dmg) => G.pendingAoE.push({ x, z, r, t, max: t, dmg, team: 'mob', owner: e.id, kind: 'slam' });
const outOfTown = (e, x, z) => e.rift || inInstance() || distToTown(x, z) > CFG.world.town.r + 2;
function enemyMove(e, dt, pl, dp) {
  const d = CFG.enemies[e.type], M = e.mv || (e.mv = moveState(e)), slow = e.slowT > 0 ? 0.5 : 1;
  // died, lost the hero or walked home mid-move: drop it (markers already placed still land)
  if (M.k && M.seen < G.time - 0.5) { M.k = null; e.windT = 0; }
  M.seen = G.time; M.gap -= dt;
  for (const k in M.cd) M.cd[k] -= dt;
  if (e.elite && !e.champ) eliteMods(e);
  if (e.champ && !e.rift && champTick(e, dt, pl, dp)) return true;
  // howl: remember nearby pack-mates; if one has fallen since the last look, frenzy
  if (d.moves.includes('howl') && (M.packT -= dt) <= 0) {
    const H = MON_MOVES.howl; M.packT = 0.25;
    for (const o of M.pack) if (!o.alive && Math.hypot(o.x - e.x, o.z - e.z) < H.r) { M.frenzyT = H.dur; ev({ t: 'moveTele', x: e.x, z: e.z, r: e.r * 2.4, life: 0.6, color: 0xff9b3d }); break; }
    M.pack.length = 0;
    for (const o of G.enemies) if (o !== e && o.alive && CFG.enemies[o.type].kit === d.kit && Math.abs(o.x - e.x) < H.r && Math.abs(o.z - e.z) < H.r) M.pack.push(o);
  }
  if (M.frenzyT > 0) { M.frenzyT -= dt; if (!M.k && !(e.windT > 0) && dp > 1) { const f = d.speed * MON_MOVES.howl.speed * slow * dt / dp; e.x += (pl.x - e.x) * f; e.z += (pl.z - e.z) * f; } }
  // trample: a burning charger's committed charge leaves poison behind it
  if (d.burn && d.charge && e.lungeT > 0 && d.moves.includes('trample')) {
    const T = MON_MOVES.trample;
    if (Math.hypot(e.x - M.lx, e.z - M.lz) > T.every) { M.lx = e.x; M.lz = e.z; G.clouds.push({ x: e.x, z: e.z, r: T.r, t: T.dur, max: T.dur, tick: 0, dmg: mobDmg(e, T.mult, pl), team: 'mob', owner: e.id }); }
  } else M.lx = 1e9;
  if (M.k) {
    const k = M.k, S = MON_MOVES[k]; M.t -= dt; e.windT = Math.max(M.t, 0.05); e.moveAmt = 0;
    // pounce: crouch, then leap so the body lands as the marker goes off
    if (k === 'pounce' && M.t < S.leap) { const q = clamp(1 - M.t / S.leap, 0, 1); e.x = lerp(M.sx, M.x, q); e.z = lerp(M.sz, M.z, q); e.moveAmt = 1; }
    if (M.t <= 0) { M.k = null; e.windT = 0; e.attackAnim = 1; M.gap = 0.8; fireMove(e, k, S, pl); }
    return true;
  }
  if (e.windT > 0 || e.lungeT > 0 || M.gap > 0) return false;
  for (const k of d.moves) {
    const S = MON_MOVES[k]; if (!S.wind || M.cd[k] > 0 || dp > S.max || dp < (S.min || 0)) continue;
    if (startMove(e, k, S, pl, slow)) { M.cd[k] = rand(S.cd[0], S.cd[1]); M.k = k; M.t = e.windT = S.wind; return true; }
  }
  return false;
}
function startMove(e, k, S, pl, slow) {
  const M = e.mv, a = Math.atan2(pl.x - e.x, pl.z - e.z); e.facing = a; M.a = a;
  if (k === 'cleave') { moveAoE(e, e.x + Math.sin(a) * S.ahead, e.z + Math.cos(a) * S.ahead, S.r, S.wind, mobDmg(e, S.mult, pl)); return true; }
  if (k === 'slam') { moveAoE(e, e.x, e.z, S.r, S.wind, mobDmg(e, S.mult, pl)); return true; }
  if (k === 'pounce') {
    if (slow < 1) return false; // slowed monsters cannot leap
    const x = pl.x + (pl.vx || 0) * S.lead, z = pl.z + (pl.vz || 0) * S.lead; if (!outOfTown(e, x, z)) return false;
    M.sx = e.x; M.sz = e.z; M.x = x; M.z = z; moveAoE(e, x, z, S.r, S.wind, mobDmg(e, S.mult, pl)); return true;
  }
  if (k === 'snipe') { if (losBlocked(e.x, e.z, pl.x, pl.z)) return false; ev({ t: 'moveTele', x: e.x, z: e.z, a, len: S.len, w: 1, life: S.wind }); return true; }
  if (k === 'mortar') {
    // three shells across the hero's predicted spot; each lands exactly when its marker goes off
    const cx = pl.x + (pl.vx || 0) * S.lead, cz = pl.z + (pl.vz || 0) * S.lead, px = Math.cos(a), pz = -Math.sin(a), d = CFG.enemies[e.type];
    for (let i = 0; i < S.n; i++) {
      const o = (i - (S.n - 1) / 2) * S.gap, x = cx + px * o, z = cz + pz * o, t = S.fly + i * 0.15, dd = Math.hypot(x - e.x, z - e.z);
      moveAoE(e, x, z, S.r, t, mobDmg(e, S.mult, pl));
      spawnProjectile({ x: e.x, z: e.z, vx: (x - e.x) / t, vz: (z - e.z) / t, life: t, r: 0.4, dmg: 0, team: 'mob', owner: e.id, kind: 'lob', lob: true, lobH: 1.6 + dd * 0.22, color: d.shotColor || 0xff7b2e, y: 1.2 });
    }
    ev({ t: 'shoot', kind: 'enemy', x: e.x, z: e.z }); return true;
  }
  if (k === 'nova') { ev({ t: 'moveTele', x: e.x, z: e.z, r: e.r * 2.2, life: S.wind }); return true; }
  if (k === 'pool') { if (!outOfTown(e, pl.x, pl.z)) return false; M.x = pl.x; M.z = pl.z; ev({ t: 'moveTele', x: M.x, z: M.z, r: S.r, life: S.wind }); return true; }
  return false;
}
function fireMove(e, k, S, pl) {
  const M = e.mv, d = CFG.enemies[e.type];
  if (k === 'snipe') { spawnProjectile({ x: e.x, z: e.z, vx: Math.sin(M.a) * S.speed, vz: Math.cos(M.a) * S.speed, life: S.len / S.speed, r: 0.45, dmg: mobDmg(e, S.mult, pl), pierce: 9, team: 'mob', owner: e.id, kind: 'orb', color: d.shotColor || 0xff3b3b, y: 1.4 }); ev({ t: 'shoot', kind: 'enemy', x: e.x, z: e.z }); }
  // nova: one orb always flies at the hero; the three-orb gap sits right beside them
  else if (k === 'nova') orbRing(e, S.n, 2, M.a + (Math.random() < 0.5 ? -2 : 2) * Math.PI * 2 / S.n, S.speed, mobDmg(e, S.mult, pl), d.shotColor || 0xff7b2e);
  else if (k === 'pool') G.clouds.push({ x: M.x, z: M.z, r: S.r, t: S.dur, max: S.dur, tick: 0, dmg: mobDmg(e, S.mult, pl), team: 'mob', owner: e.id });
}
// a ring of N slow orbs with a gap of 2g-1 slots centred on angle gapA
function orbRing(e, N, g, gapA, sp, dmg, color) {
  for (let i = 0; i < N; i++) {
    const a = gapA + (i / N) * Math.PI * 2; if (i < g || i > N - g) continue;
    spawnProjectile({ x: e.x, z: e.z, vx: Math.sin(a) * sp, vz: Math.cos(a) * sp, life: 3, r: 0.48, dmg, team: 'mob', owner: e.id, kind: 'orb', color, y: 1.2 });
  }
  ev({ t: 'boom', x: e.x, z: e.z, r: 2, color });
}
// --- end monster moves

// --- Rift champions: every big attack is shown first (red circles, lanes, glow) and can be dodged or dashed through
function champTick(e, dt, pl, dp) {
  // Rift champions hit for a share of your HP; hub elites with affixes use normal monster damage at 0.6x,
  // dungeon champions full mobDmg (their ×1.25 / ×1.5 already sits on e.atk)
  const C = e.champ, n = G.rift ? G.rift.floor : 1, frac = champDmgFrac(n), hit = e.rift ? () => pl.maxHp * frac : () => mobDmg(e, e.dungeon ? 1 : 0.6, pl);
  if (C.shieldT > 0) { C.shieldT -= dt; e.invulnT = C.shieldT > 0 ? 1 : 0; }
  if (C.mods.includes('frenzy')) { e.atkCd -= dt * 0.7; e.slowT = Math.min(e.slowT, 0); }
  // a charge in progress
  if (C.chargeT > 0) {
    C.chargeT -= dt; e.x += C.cx * 21 * dt; e.z += C.cz * 21 * dt; e.moveAmt = 1; e.facing = Math.atan2(C.cx, C.cz);
    if (!C.hitDone && Math.hypot(pl.x - e.x, pl.z - e.z) < e.r + pl.r + 0.4) { C.hitDone = true; dealDamage(pl, hit(), e.id, { knockX: C.cx, knockZ: C.cz, knock: 14 }); }
    return true;
  }
  // a spiral in progress: the monster spins and sprays slow bullets
  if (C.spinT > 0) {
    C.spinT -= dt; C.spinAcc = (C.spinAcc || 0) - dt; e.moveAmt = 0;
    if (C.spinAcc <= 0) { C.spinAcc = 0.11; C.spin += 0.38; for (let k = 0; k < 3; k++) { const a = C.spin + k * Math.PI * 2 / 3; spawnProjectile({ x: e.x, z: e.z, vx: Math.sin(a) * 7.5, vz: Math.cos(a) * 7.5, life: 2.6, r: 0.42, dmg: hit() * 0.2, team: 'mob', owner: e.id, kind: 'orb', color: 0xff5d8f, y: 1.2 }); } }
    return true;
  }
  // winding up a telegraphed attack
  if (C.cast) {
    C.castT -= dt; e.windT = Math.max(e.windT || 0, 0.05); e.moveAmt = 0;
    if (C.castT <= 0) { const k = C.cast; C.cast = null; e.windT = 0; champFire(e, k, pl, hit); }
    return true;
  }
  if (dp > 20) return false;
  for (const k of C.mods) {
    if (k === 'frenzy') continue;
    C.cd[k] -= dt; if (C.cd[k] > 0) continue;
    C.cd[k] = rand(CHAMP_MODS[k].cd[0], CHAMP_MODS[k].cd[1]) * (C.mods.includes('frenzy') ? 0.75 : 1);
    if (k === 'shield') { C.shieldT = 2.2; e.invulnT = 1; ev({ t: 'champShield', x: e.x, z: e.z, r: e.r * 2.2 }); return false; }
    if (k === 'slam') { for (let i = 0; i < 3; i++) { const lead = i * 0.35; G.pendingAoE.push({ x: pl.x + (pl.vx || 0) * lead + rand(-1, 1), z: pl.z + (pl.vz || 0) * lead + rand(-1, 1), r: 2.6, t: 1.05 + i * 0.25, max: 1.05 + i * 0.25, dmg: hit(), team: 'mob', owner: e.id, kind: 'slam' }); } ev({ t: 'telegraph' }); continue; }
    if (k === 'mortar') { for (let i = 0; i < 5; i++) { const a = rand(0, Math.PI * 2), d = i === 0 ? 0 : rand(2.5, 6.5); G.pendingAoE.push({ x: pl.x + Math.sin(a) * d, z: pl.z + Math.cos(a) * d, r: 2.1, t: 1.3 + i * 0.12, max: 1.3 + i * 0.12, dmg: hit() * 0.7, team: 'mob', owner: e.id, kind: 'slam' }); } ev({ t: 'telegraph' }); continue; }
    if (k === 'blink') { const a = rand(0, Math.PI * 2), x = pl.x + Math.sin(a) * 5, z = pl.z + Math.cos(a) * 5; C.blink = { x, z }; ev({ t: 'champBlink', x, z }); C.cast = 'blink'; C.castT = 0.75; return true; }
    if (k === 'charge') { const dx = pl.x - e.x, dz = pl.z - e.z, d = Math.hypot(dx, dz) || 1; C.cx = dx / d; C.cz = dz / d; ev({ t: 'telegraph', x: e.x, z: e.z, a: Math.atan2(dx, dz), len: 15, w: e.r * 2.2 }); C.cast = 'charge'; C.castT = 0.8; e.facing = Math.atan2(dx, dz); return true; }
    if (k === 'nova' || k === 'spiral') { C.cast = k; C.castT = k === 'nova' ? 0.7 : 0.6; ev({ t: 'champCast', x: e.x, z: e.z, r: e.r * 2, color: k === 'nova' ? 0xffb347 : 0xff5d8f }); return true; }
  }
  return false;
}
function champFire(e, k, pl, hit) {
  const C = e.champ;
  if (k === 'charge') { C.chargeT = 0.7; C.hitDone = false; return; }
  if (k === 'spiral') { C.spinT = 2.4; C.spin = Math.atan2(pl.x - e.x, pl.z - e.z); return; }
  if (k === 'blink' && C.blink) { ev({ t: 'champBlink', x: e.x, z: e.z, out: true }); e.x = C.blink.x; e.z = C.blink.z; G.pendingAoE.push({ x: e.x, z: e.z, r: 2.4, t: 0.45, max: 0.45, dmg: hit() * 0.6, team: 'mob', owner: e.id, kind: 'slam' }); return; }
  // a ring of slow orbs with a gap: walk or dash through the gap
  if (k === 'nova') orbRing(e, 22, 3, Math.atan2(pl.x - e.x, pl.z - e.z) + rand(-1.4, 1.4), 6.5, hit() * 0.45, 0xffb347);
}
// --- world boss -----------------------------------------------------------------
function currentLair() { return CFG.world.lairs[G.bossLair]; }
function stepBossTimer(dt) {
  if (G.boss || !G.started || inInstance()) return; // paused inside the Rift and dungeons
  G.bossTimer -= dt;
  if (!G.bossWarned && G.bossTimer <= CFG.boss.warn) {
    G.bossWarned = true;
    // the boss rises in the zone you are in (or your highest open zone)
    G.bossLair = Math.max(1, Math.min(zoneAt(G.player.z), highestZone(G.profile.level)));
    ev({ t: 'bossWarn', lair: currentLair().name, secs: Math.ceil(G.bossTimer) });
  }
  if (G.bossTimer <= 0) spawnBoss();
}
function spawnBoss() {
  const B = CFG.boss, L = currentLair(), zi = G.bossLair, Z = CFG.world.zones[zi];
  const ta = tierAdd(), lvl = clamp(G.profile.level + 1, Z.lvl[0] + 2 + ta, Z.lvl[1] + 3 + ta);
  const b = { id: nextId++, kind: 'boss', team: 'mob', x: L.x, z: L.z, hx: L.x, hz: L.z, r: B.r, lvl, zone: zi, name: Z.boss,
    maxHp: Math.round(B.hp * egrow(B.hpGrowth, lvl)), hp: 0, atk: B.atk * egrow(CFG.enemies.atkGrowth, lvl),
    alive: true, atkT: 2.5, life: B.duration, dmgBy: {}, total: 0, facing: 0, moveAmt: 0, flashT: 0, slowT: 0, invulnT: 0, armorT: 0, attackAnim: 0, lastHurt: -99 };
  if (!G.profile.settings.bots) { b.maxHp = Math.round(b.maxHp * 0.6); } // no bot helpers: a solo-sized boss
  b.hp = b.maxHp; b.spawnT = G.time;
  G.boss = b; G.ents.set(b.id, b);
  ev({ t: 'bossSpawn', name: Z.boss, lair: L.name, x: b.x, z: b.z });
}
function stepBoss(b, dt) {
  const B = CFG.boss, pl = G.player;
  trackVel(b, dt);
  b.flashT -= dt; b.slowT -= dt; b.life -= dt; b.atkT -= dt; tickBurn(b, dt); if (!G.boss) return; b.attackAnim = Math.max(0, b.attackAnim - dt * 1.5);
  if (b.life <= 0 && G.time - b.lastHurt < 8 && b.life > -180) { /* still being fought: stay */ }
  else if (b.life <= 0) {
    if (!b.retreat) { b.retreat = 2.5; b.invulnT = 99; ev({ t: 'bossGone', name: b.name }); }
    b.retreat -= dt; b.moveAmt = 0; if (b.retreat <= 0) endBoss(false); return;
  }
  // choose a target: player if close, otherwise the nearest bot
  let target = null, td = 18;
  if (pl.alive && !(G.menuSafe > 0)) { const d = Math.hypot(pl.x - b.x, pl.z - b.z); if (d < td) { td = d; target = pl; } }
  if (!target) for (let i = 1; i < G.hubFighters.length; i++) { const f = G.hubFighters[i]; const d = Math.hypot(f.x - b.x, f.z - b.z); if (d < td) { td = d; target = f; } }
  if (target) {
    const dx = target.x - b.x, dz = target.z - b.z, d = Math.hypot(dx, dz) || 1;
    b.facing = Math.atan2(dx, dz);
    if (d > 5 && Math.hypot(b.x - b.hx, b.z - b.hz) < B.leash) { b.x += dx / d * B.speed * dt * (b.slowT > 0 ? 0.5 : 1); b.z += dz / d * B.speed * dt; b.moveAmt = 1; }
    else b.moveAmt = Math.max(0, b.moveAmt - dt * 3);
    if (b.atkT <= 0) {
      b.atkT = B.attackEvery * rand(0.85, 1.15); b.attackAnim = 1;
      if (Math.random() < 0.55) {
        G.pendingAoE.push({ x: target.x, z: target.z, r: B.slamR, t: B.slamDelay, max: B.slamDelay, dmg: b.atk * 1.4, team: 'mob', owner: b.id, kind: 'slam' });
        ev({ t: 'telegraph' });
      } else {
        const off = Math.random() * Math.PI;
        for (let i = 0; i < B.rocks; i++) {
          const a = off + (i / B.rocks) * Math.PI * 2;
          spawnProjectile({ x: b.x, z: b.z, vx: Math.sin(a) * B.rockSpeed, vz: Math.cos(a) * B.rockSpeed, life: 2.2, r: 0.6, dmg: b.atk * 0.6, team: 'mob', owner: b.id, kind: 'rock', color: 0xa38b6d, y: 1.6 });
        }
        ev({ t: 'bossRocks', x: b.x, z: b.z });
      }
    }
  } else b.moveAmt = Math.max(0, b.moveAmt - dt * 3);
}
function endBoss(killed) {
  const b = G.boss; if (!b) return;
  G.boss = null; G.ents.delete(b.id);
  G.bossTimer = G.profile.settings.fastXp ? P.testBossInterval : CFG.boss.interval; G.bossWarned = false;
  G.pendingAoE = G.pendingAoE.filter((a) => a.owner !== b.id);
  if (!killed) return;
  const L = CFG.boss.loot, p = G.profile;
  const contrib = b.total > 0 ? (b.dmgBy[G.player.id] || 0) / b.total : 0;
  const loot = { name: b.name || CFG.boss.name, essence: 0, contrib, eligible: contrib >= L.minContrib, gold: 0, item: null, tomeXp: 0,
    rareChance: Math.min(L.rareMax, L.rareBase + contrib * L.rareScale),
    epicChance: Math.min(L.epicMax, contrib * L.epicScale),
    tomeChance: Math.min(0.95, L.tomeBase + contrib * L.tomeScale) };
  if (loot.eligible) {
    if(G.player.alive && Math.hypot(b.x-G.player.x,b.z-G.player.z)<=24) awardPetCombatXp(150+Math.min(100,b.lvl)*4);
    p.stats.bosses++;
    loot.gold = Math.round((L.goldBase + L.goldPerLevel * b.lvl + contrib * 200) * Math.pow(CFG.enemies.goldGrowth, b.lvl - 1) * tierMul(curTier()).gold);
    addGold(loot.gold);
    if (Math.random() < loot.rareChance) {
      const r = Math.random(), legChance = Math.min(0.3, 0.03 + contrib * 0.25);
      const ct = curTier(), myth = ct >= 1 ? Math.min(0.35, 0.06 * ct) * (0.5 + contrib) : 0;
      let rarity = r < legChance ? 'legendary' : r < legChance + loot.epicChance ? 'epic' : 'rare';
      if (Math.random() < myth) rarity = ct >= 3 && Math.random() < 0.06 * (ct - 2) ? (ct >= 4 && Math.random() < 0.15 ? 'divine' : 'ancient') : 'mythic';
      loot.caseKind = regionBossCase('boss', (CFG.world.zones[b.zone] || {}).region);
      loot.item = makeItem(pick(CFG.gear.slots), rarity, b.lvl); grantItem(loot.item, 'boss', { zone: b.zone });
    }
    loot.essence = Math.round((randInt(L.essence[0], L.essence[1]) + Math.floor(b.lvl / 5)) * tierMul(curTier()).gems); addEssence(loot.essence);
    loot.shards = randInt(L.shards[0], L.shards[1]); dropShards(loot.shards);
    const ft = Math.round(G.time - (b.spawnT || G.time)); if (ft > 0 && (!p.records.fastBoss || ft < p.records.fastBoss)) p.records.fastBoss = ft;
    addMastery('w:' + G.player.attackId, 300 * contrib + 40);
    if (Math.random() < loot.tomeChance && p.level < P.cap) { loot.tomeXp = Math.round(xpToNext(p.level) * L.tomeXpFrac); addXp(loot.tomeXp, 'tome'); }
    checkAchievements();
  }
  G.lootQueue.push(loot);
  ev({ t: 'bossDown' });
}

function stepPendingAoE(dt) {
  for (let i = G.pendingAoE.length - 1; i >= 0; i--) {
    const a = G.pendingAoE[i]; a.t -= dt;
    if (a.t <= 0) {
      aoeDamage(a.x, a.z, a.r, a.dmg, a.team, a.owner, { knock: 6, charge: 0 });
      ev({ t: 'boom', x: a.x, z: a.z, r: a.r, color: a.kind === 'meteor' ? 0xff7b2e : a.kind === 'comet' ? 0x9fb8ff : 0xc9a16b, big: a.kind !== 'comet' });
      G.pendingAoE.splice(i, 1);
    }
  }
}

