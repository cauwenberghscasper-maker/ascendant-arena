// --- Bastion Siege: a walled fort entered through the Bastion house in town. Endless waves pour in through three gates and
// go for the Keep and two supply wagons (each with its own health bar); you fight with your hero while the archers,
// cannons, ballistas and warriors you build on eight stone pads hold the line. Like the Rift it stays in G.mode 'hub'
// (G.siege set). The fort is permanent: what you build and upgrade lives in profile.fort and returns every run.
const SC = { x: 0, z: -2200 }; // siege fort centre (arena −1000, rift −1400, dungeon −1800)
CFG.siege = {
  // gate: the door of the Bastion house on the west side of the town plaza (house: where the building stands)
  unlock: 20, gate: { x: -21.4, z: -56 }, house: { x: -25.2, z: -56 }, half: 24, interactR: 3.2, padR: 2.8, bossBlock: 30,
  firstBuild: 25, build: 30, clear: 2.5, spawnGap: 0.55, bossEvery: 5, lvlBase: 18, lvlPer: 1.5, maxLvl: 15,
  // objectives: HP = reference hero HP at the wave level × mult (kept as a fraction between waves); the Keep ends the run
  objs: [
    { id: 'keep', name: 'The Keep', x: 0, z: 2, r: 4.1, h: 7.2, mult: 30, main: true },
    { id: 'wagonW', name: 'West Wagon', x: -12, z: -13, r: 1.8, h: 3.6, mult: 12 },
    { id: 'wagonE', name: 'East Wagon', x: 12, z: -13, r: 1.8, h: 3.6, mult: 12 },
  ],
  heal: 0.25, wagonBonus: 0.25, // objectives mend a quarter between waves; every wagon still standing adds 25% gold
  gates: [{ x: 0, z: 22, a: Math.PI }, { x: 22, z: 0, a: -Math.PI / 2 }, { x: -22, z: 0, a: Math.PI / 2 }],
  pads: [{ x: -5, z: 13 }, { x: 5, z: 13 }, { x: -13, z: 6 }, { x: 13, z: 6 }, { x: -13, z: -5 }, { x: 13, z: -5 }, { x: -5, z: -8 }, { x: 5, z: -8 }],
  spawn: { x: 0, z: -17 }, exit: { x: 0, z: -21 },
  // defenders: dmg × the reference hero's hit at your level, +30% per level. cost: gold in wave payouts at your level, stones for the first level
  towers: {
    archer: { name: 'Archer Tower', short: 'Archer', icon: 'b_arrow', range: 16, cd: 0.8, dmg: 0.55, speed: 30, color: 0xffe08a, cost: 2, stones: 4,
      blurb: 'Fast arrows at one target. Cheap and steady.' },
    cannon: { name: 'Cannon', short: 'Cannon', icon: 'a_bigshot', range: 13, cd: 2.4, dmg: 1.2, aoe: 2.8, fly: 0.9, color: 0x3a3a44, cost: 3, stones: 6,
      blurb: 'Slow shells that blast a whole group.' },
    ballista: { name: 'Ballista', short: 'Ballista', icon: 'n_pierce', range: 22, cd: 2.8, dmg: 2.4, pierce: 3, speed: 40, color: 0xbfe9ff, cost: 3, stones: 6,
      blurb: 'Huge bolts from far away that pierce through a line of monsters.' },
    warrior: { name: 'Barracks', short: 'Warriors', icon: 'b_wave', range: 6, cd: 1.0, dmg: 0.7, hp: 0.9, men: 2, respawn: 8, cost: 2.5, stones: 5,
      blurb: 'Warriors that block the path and fight monsters near their post.' },
  },
};
const SIEGE_TYPES = ['archer', 'cannon', 'ballista', 'warrior'];
const siegeLvlMul = (l) => 1 + 0.3 * (l - 1);
const siegeMen = (l) => Math.min(4, CFG.siege.towers.warrior.men + Math.floor(l / 5));
// one wave's gold at hero level L: the price unit for building
const siegeGoldUnit = (L) => Math.round((20 + 6 * L) * Math.pow(CFG.enemies.goldGrowth, L - 1));
function fortState() { const p = G.profile, F = p.fort || (p.fort = { pads: [], stones: 0 }); while (F.pads.length < CFG.siege.pads.length) F.pads.push(null); return F; }
// the price of the next step on a pad for type t: build at level 1, or the next upgrade if the pad already holds t
function padCost(i, t) {
  const pad = fortState().pads[i], T = CFG.siege.towers[t], l = pad && pad.t === t ? pad.l : 0;
  return { lvl: l + 1, gold: Math.round(siegeGoldUnit(G.profile.level) * T.cost * (1 + l * 0.8)), stones: Math.round(T.stones * Math.pow(l + 1, 1.35)) };
}
// stones spent on a pad so far: half comes back when you swap it for another type
function padStonesSpent(pad) { if (!pad) return 0; let n = 0; for (let k = 1; k <= pad.l; k++) n += Math.round(CFG.siege.towers[pad.t].stones * Math.pow(k, 1.35)); return n; }
function buyPad(i, t) {
  const F = fortState(), p = G.profile, pad = F.pads[i], T = CFG.siege.towers[t];
  if (!T || i < 0 || i >= CFG.siege.pads.length) return false;
  if (pad && pad.t === t && pad.l >= CFG.siege.maxLvl) return false;
  const c = padCost(i, t); if (p.gold < c.gold || F.stones < c.stones) return false;
  p.gold -= c.gold; F.stones -= c.stones;
  if (pad && pad.t !== t) F.stones += Math.floor(padStonesSpent(pad) / 2);
  F.pads[i] = { t, l: c.lvl }; G.dirty = true;
  if (G.siege) siegeRefreshPad(i);
  ev({ t: 'fortBuilt', i, type: t, l: c.lvl, x: SC.x + CFG.siege.pads[i].x, z: SC.z + CFG.siege.pads[i].z });
  return true;
}
const siegeLevel = (n) => Math.max(G.profile.level - 2, CFG.siege.lvlBase + Math.round(CFG.siege.lvlPer * n)) + tierAdd();
const siegeDefDmg = (T, l) => refDmg(G.profile.level) * T.dmg * siegeLvlMul(l);
function siegeClamp(f, r) { const h = CFG.siege.half - 0.8 - r; f.x = clamp(f.x, SC.x - h, SC.x + h); f.z = clamp(f.z, SC.z - h, SC.z + h); }
// keep, wagons and the eight pads are solid; rebuilt as a whole (the Grid has no remove)
function siegeGrid() {
  const g = new Grid(6), S = CFG.siege;
  for (const o of G.siege.objs) if (o.alive) g.add({ x: o.x, z: o.z, r: o.r });
  for (const q of S.pads) g.add({ x: SC.x + q.x, z: SC.z + q.z, r: 1.1 });
  G.siegeObstacles = g; G.obstacles = g; return g;
}
function siegeScaleObjs(lvl) {
  for (const o of G.siege.objs) { const k = o.maxHp ? o.hp / o.maxHp : 1; o.maxHp = Math.round(refHp(lvl) * o.def.mult); o.hp = o.alive ? Math.max(1, Math.round(k * o.maxHp)) : 0; }
}
// pad runtime: fire cooldown, and the warriors of a barracks (spawned at their post, back after a while when they fall)
function siegeRefreshPad(i) {
  const S = G.siege, pad = fortState().pads[i], q = CFG.siege.pads[i], P = S.pads[i] || (S.pads[i] = { i, id: nextId++, cd: rand(0, 1), x: SC.x + q.x, z: SC.z + q.z });
  S.soldiers = S.soldiers.filter((s) => s.pad !== i);
  if (!pad || pad.t !== 'warrior') return;
  const T = CFG.siege.towers.warrior;
  for (let k = 0, n = siegeMen(pad.l); k < n; k++) {
    const a = (k / n) * Math.PI * 2, hx = P.x + Math.sin(a) * 2.2, hz = P.z + Math.cos(a) * 2.2;
    const s = { id: nextId++, kind: 'soldier', pad: i, team: 'ally', x: hx, z: hz, hx, hz, r: 0.55, facing: 0, moveAmt: 0, attackAnim: 0, flashT: 0, alive: true, atkCd: rand(0, T.cd), respawnT: 0 };
    s.maxHp = s.hp = Math.round(refHp(G.profile.level) * T.hp * siegeLvlMul(pad.l));
    S.soldiers.push(s);
  }
}
function startSiege() {
  const p = G.profile, pl = G.player, C = CFG.siege;
  if (inInstance() || G.mode !== 'hub' || p.level < C.unlock || activeShrine() || !pl.alive) return false;
  if (G.boss && Math.hypot(G.boss.x - pl.x, G.boss.z - pl.z) < C.bossBlock) return false;
  const S = G.siege = { wave: 1, phase: 'build', t: C.firstBuild, tMax: C.firstBuild, queue: [], spawnT: 0, mobs: [], soldiers: [], pads: [], lvl: 0,
    gold: 0, stones: 0, items: 0, cleared: 0, kills: 0, enterPos: { x: pl.x, z: pl.z },
    objs: C.objs.map((d) => ({ def: d, kind: 'objective', name: d.name, x: SC.x + d.x, z: SC.z + d.z, r: d.r, alive: true, hp: 1, maxHp: 0, flashT: 0, hurtT: 0 })) };
  S.lvl = siegeLevel(1); siegeScaleObjs(S.lvl);
  for (let i = 0; i < C.pads.length; i++) siegeRefreshPad(i);
  siegeGrid(); clearProjectiles();
  pl.x = SC.x + C.spawn.x; pl.z = SC.z + C.spawn.z; pl.facing = 0; pl.hp = pl.maxHp; pl.invulnT = 1.5; pl.ammo = pl.ammoMax;
  ev({ t: 'siegeStart', x: pl.x, z: pl.z, best: p.records.bestSiege || 0 }); return true;
}
function siegeComposition(n) {
  const boss = n % CFG.siege.bossEvery === 0, count = Math.min(28, 5 + Math.round(n * 1.6)), elites = Math.min(6, Math.floor(n / 3));
  return { boss, count: boss ? Math.ceil(count * 0.6) : count, elites };
}
// fill the spawn queue; monsters walk in one by one through the three gates
function startSiegeWave() {
  const S = G.siege; if (!S || S.phase !== 'build') return false;
  const n = S.wave, Zs = CFG.world.zones, zi = 1 + (n - 1) % (Zs.length - 1), Z = Zs[zi], C = siegeComposition(n);
  S.lvl = siegeLevel(n); siegeScaleObjs(S.lvl);
  S.queue = [];
  for (let k = 0; k < C.count; k++) S.queue.push({ type: Math.random() < 0.5 ? Z.enemy : (Z.alt || Z.enemy), zi, elite: k < C.elites });
  S.queue.sort(() => Math.random() - 0.5);
  if (C.boss) S.queue.push({ type: Z.enemy, zi, boss: true });
  S.phase = 'fight'; S.spawnT = 0.4; S.gateI = randInt(0, 2);
  ev({ t: 'siegeWave', wave: n, lvl: S.lvl, boss: C.boss, count: S.queue.length, theme: Z.name });
  return true;
}
function spawnSiegeMob(q) {
  const S = G.siege, gt = CFG.siege.gates[S.gateI = (S.gateI + 1) % 3], side = rand(-3, 3);
  const x = SC.x + gt.x + Math.cos(gt.a) * side, z = SC.z + gt.z - Math.sin(gt.a) * side;
  let e;
  if (q.boss) { e = makeChampion(q.type, q.zi, S.lvl + 2, Math.min(3, 1 + Math.floor(S.wave / 15)), true); delete e.rift; delete e.riftLvl; e.bossName = 'Siege Lord'; }
  else e = makeEnemy(q.type, q.zi, { elite: q.elite });
  e.siege = true; e.temp = true; e.state = 'chase'; e.tgt = null; e.tgtT = 0;
  setEnemyLevel(e, q.boss ? S.lvl + 2 : S.lvl);
  e.x = e.hx = e.wx = x; e.z = e.hz = e.wz = z; e.facing = gt.a;
  G.enemies.push(e); S.mobs.push(e);
  ev({ t: 'spawn', x, z, elite: e.elite });
}
function clearSiegeMobs() {
  const S = G.siege; if (!S) return;
  const ids = new Set(S.mobs.map((e) => e.id));
  G.enemies = G.enemies.filter((e) => !ids.has(e.id)); for (const id of ids) G.ents.delete(id);
  S.mobs = [];
}
function siegeWaveClear() {
  const S = G.siege, p = G.profile, n = S.wave, lvl = S.lvl, C = CFG.siege;
  const wagons = S.objs.filter((o) => !o.def.main && o.alive).length, boss = n % C.bossEvery === 0;
  const gold = Math.round((20 + 6 * lvl) * Math.pow(CFG.enemies.goldGrowth, lvl - 1) * tierMul(curTier()).gold * (1 + C.wagonBonus * wagons)); addGold(gold, true); S.gold += gold;
  const stones = 3 + Math.floor(n / 2) + (boss ? 5 : 0); fortState().stones += stones; S.stones += stones;
  if (p.level < P.cap) addXp(Math.round(xpToNext(p.level) * Math.min(0.2, 0.05 * (1 + n / 10))), 'dungeon');
  let item = null;
  if (boss) { item = makeItem(pick(CFG.gear.slots), riftRarity(n), lvl); grantItem(item, 'shrine'); S.items++; addEssence(2 + Math.floor(n / 5)); }
  for (const o of S.objs) if (o.alive) o.hp = Math.min(o.maxHp, Math.round(o.hp + o.maxHp * C.heal));
  if (n > (p.records.bestSiege || 0)) p.records.bestSiege = n;
  S.cleared = n; addMastery('w:' + G.player.attackId, 15 + n * 3);
  checkAchievements(); G.dirty = true;
  ev({ t: 'siegeClear', wave: n, gold, stones, item: !!item, wagons });
}
function stepSiege(dt) {
  const S = G.siege, pl = G.player, C = CFG.siege;
  // carried out of the fort by anything else (waypoint travel): close it where you stand
  if (Math.hypot(pl.x - SC.x, pl.z - SC.z) > 200) { endSiege('away'); return; }
  if (!pl.alive) G.respawnAt = { x: SC.x + C.spawn.x, z: SC.z + C.spawn.z }; // a fall costs a few seconds, not the run
  if (G.modal) return; // the fort holds still while you are in a menu
  for (const o of S.objs) { o.flashT -= dt; o.hurtT -= dt; }
  stepSiegeDefenders(dt);
  if (S.phase === 'build') { S.t -= dt; if (S.t <= 0) startSiegeWave(); }
  else if (S.phase === 'fight') {
    if (S.queue.length && (S.spawnT -= dt) <= 0) { S.spawnT = C.spawnGap; spawnSiegeMob(S.queue.shift()); }
    if (!S.queue.length && !S.mobs.some((e) => e.alive)) { siegeWaveClear(); S.phase = 'clear'; S.t = S.tMax = C.clear; }
  } else if (S.phase === 'clear' && (S.t -= dt) <= 0) { clearSiegeMobs(); S.wave++; S.phase = 'build'; S.t = S.tMax = C.build; }
}
// --- defenders: towers pick the nearest monster in range; warriors hold a ring around their post
function siegeNearestMob(x, z, range) {
  let best = null, bd = range;
  for (const e of G.siege.mobs) if (e.alive && !e.hidden) { const d = Math.hypot(e.x - x, e.z - z); if (d < bd) { bd = d; best = e; } }
  return best;
}
function stepSiegeDefenders(dt) {
  const S = G.siege, F = fortState();
  S.pads.forEach((P, i) => {
    const pad = F.pads[i]; if (!pad || pad.t === 'warrior') return;
    const T = CFG.siege.towers[pad.t]; if ((P.cd -= dt) > 0) return;
    const e = siegeNearestMob(P.x, P.z, T.range); if (!e) { P.cd = 0.15; return; }
    P.cd = T.cd; P.aim = Math.atan2(e.x - P.x, e.z - P.z); P.fireT = G.time;
    const dmg = siegeDefDmg(T, pad.l), sx = Math.sin(P.aim), sz = Math.cos(P.aim), ox = P.x + sx * 1.6, oz = P.z + sz * 1.6;
    if (pad.t === 'cannon') {
      // a lobbed shell lands where the target will be
      const tx = e.x + (e.vx || 0) * T.fly, tz = e.z + (e.vz || 0) * T.fly;
      spawnProjectile({ x: ox, z: oz, vx: (tx - ox) / T.fly, vz: (tz - oz) / T.fly, life: T.fly, r: 0.45, dmg, team: 'ally', owner: P.id, kind: 'shell', color: T.color, y: 1.4, lob: true, lobH: 2.4, aoe: T.aoe, aoeMult: 1, knock: 4 });
    } else {
      const t = Math.hypot(e.x - ox, e.z - oz) / T.speed, a = Math.atan2(e.x + (e.vx || 0) * t - ox, e.z + (e.vz || 0) * t - oz);
      spawnProjectile({ x: ox, z: oz, vx: Math.sin(a) * T.speed, vz: Math.cos(a) * T.speed, life: (T.range + 3) / T.speed, r: pad.t === 'ballista' ? 0.5 : 0.3, dmg, team: 'ally', owner: P.id,
        kind: pad.t === 'ballista' ? 'rail' : 'arrow', color: T.color, y: pad.t === 'ballista' ? 1.5 : 3.2, pierce: T.pierce || 0, knock: pad.t === 'ballista' ? 5 : 1.5 });
    }
    ev({ t: 'fortShot', type: pad.t, x: ox, z: oz });
  });
  const W = CFG.siege.towers.warrior;
  for (const s of S.soldiers) {
    s.flashT -= dt; s.attackAnim = Math.max(0, s.attackAnim - dt * 3);
    if (!s.alive) { if ((s.respawnT -= dt) <= 0) { s.alive = true; s.hp = s.maxHp; s.x = s.hx; s.z = s.hz; } continue; }
    const pad = F.pads[s.pad], e = siegeNearestMob(s.hx, s.hz, W.range);
    let tx = s.hx, tz = s.hz, sp = 0;
    if (e) { tx = e.x; tz = e.z; s.atkCd -= dt; }
    const dx = tx - s.x, dz = tz - s.z, d = Math.hypot(dx, dz), reach = e ? s.r + e.r + 0.3 : 0.3;
    if (d > reach) { sp = 6; s.x += dx / d * sp * dt; s.z += dz / d * sp * dt; s.facing = Math.atan2(dx, dz); }
    else if (e) {
      s.facing = Math.atan2(dx, dz);
      if (s.atkCd <= 0) { s.atkCd = W.cd; s.attackAnim = 1; dealDamage(e, siegeDefDmg(W, pad.l), s.id, { knockX: dx, knockZ: dz, knock: 2 }); }
    }
    s.moveAmt = lerp(s.moveAmt, sp > 0 ? 1 : 0, 1 - Math.exp(-dt * 10));
    collideObstacles(s); siegeClamp(s, s.r);
  }
}
function siegeHitSoldier(s, amt) {
  s.hp -= amt; s.flashT = CFG.combat.hitFlash;
  ev({ t: 'hit', x: s.x, z: s.z, y: 2.1, amt: Math.round(amt), crit: false, toPlayer: false, byPlayer: false });
  if (s.hp <= 0) { s.alive = false; s.hp = 0; s.respawnT = CFG.siege.towers.warrior.respawn; ev({ t: 'die', x: s.x, z: s.z, kind: 'soldier' }); }
}
function siegeHitObjective(o, amt) {
  if (!o.alive) return;
  o.hp -= amt; o.flashT = 0.12;
  if (o.hurtT <= 0) ev({ t: 'objectiveHit', name: o.name, x: o.x, z: o.z, main: !!o.def.main });
  o.hurtT = 1.2;
  if (o.hp > 0) return;
  o.hp = 0; o.alive = false; siegeGrid();
  ev({ t: 'objectiveDown', name: o.name, main: !!o.def.main, x: o.x, z: o.z });
  if (o.def.main) endSiege('keep');
}
// --- siege monsters: march on the nearest objective; warriors in the way and a hero close by draw them off
function siegeTarget(e) {
  const S = G.siege, pl = G.player;
  let best = null, bd = 5;
  for (const s of S.soldiers) if (s.alive) { const d = Math.hypot(s.x - e.x, s.z - e.z); if (d < bd) { bd = d; best = s; } }
  if (best) return best;
  if (pl.alive && G.menuSafe <= 0 && Math.hypot(pl.x - e.x, pl.z - e.z) < (e.lastHurt > G.time - 2 ? 9 : 6)) return pl;
  bd = Infinity;
  for (const o of S.objs) if (o.alive) { const d = Math.hypot(o.x - e.x, o.z - e.z) - o.r; if (d < bd) { bd = d; best = o; } }
  return best;
}
function stepSiegeEnemy(e, dt) {
  const S = G.siege;
  if (!e.alive || !S) return;
  if (G.modal || G.menuSafe > 0) { e.moveAmt = Math.max(0, (e.moveAmt || 0) - dt * 3); return; }
  if (HeroSupers.tickStatus(e, dt)) { e.flashT -= dt; e.slowT -= dt; tickBurn(e, dt); e.moveAmt = 0; return; }
  const d = CFG.enemies[e.type], pl = G.player;
  e.atkCd -= dt; e.flashT -= dt; e.slowT -= dt; e.lungeT -= dt; e.lungeCd -= dt;
  tickBurn(e, dt); if (!e.alive) return;
  if ((e.tgtT -= dt) <= 0 || !e.tgt || !e.tgt.alive) { e.tgt = siegeTarget(e); e.tgtT = 0.5; }
  const t = e.tgt; if (!t) { e.moveAmt = 0; return; }
  const dx = t.x - e.x, dz = t.z - e.z, dd = Math.hypot(dx, dz) || 1, edge = dd - (t.r || 0.5) - e.r, slow = e.slowT > 0 ? 0.5 : 1;
  let mx = 0, mz = 0, sp = 0;
  // against the hero, monsters fight as they do everywhere else: telegraphed moves and champion affixes
  if (t === pl && ((e.champ && champTick(e, dt, pl, dd)) || (d.moves && !e.champ && enemyMove(e, dt, pl, dd)))) { trackVel(e, dt); collideObstacles(e); siegeClamp(e, e.r); return; }
  markCombat();
  const hit = (mult) => {
    const amt = mobDmg(e, mult);
    if (t === pl) dealDamage(pl, amt, e.id, { knockX: dx, knockZ: dz, knock: d.heavy ? 12 : 4 });
    else if (t.kind === 'soldier') siegeHitSoldier(t, amt);
    else siegeHitObjective(t, amt);
  };
  if (d.attack === 'touch') {
    mx = dx / dd; mz = dz / dd; sp = edge > 0.15 ? d.speed : 0;
    if (edge < 0.45 && e.atkCd <= 0) { e.atkCd = d.cd; e.attackAnim = 1; hit(d.heavy ? CFG.enemies.heavyMult : 1); if (d.heavy) ev({ t: 'boom', x: t.x, z: t.z, r: 1.6, color: 0xdfeaf4 }); }
  } else {
    sp = d.speed;
    if (edge > d.keep + 1.5) { mx = dx / dd; mz = dz / dd; } else if (edge < d.keep - 3) { mx = -dx / dd; mz = -dz / dd; } else sp = 0;
    if (e.atkCd <= 0 && edge < d.keep + 3) {
      e.atkCd = d.cd * rand(0.85, 1.2); e.attackAnim = 1;
      const a0 = Math.atan2(dx, dz), n = (d.shots || 1) + (e.elite ? 2 : 0), spr = d.spread || 0.35;
      for (let k = 0; k < n; k++) {
        const a = n > 1 ? a0 + (k / (n - 1) - 0.5) * spr : a0;
        // shots at the hero can be dodged; shots at the fort land (the bolt is drawn, the damage applied once below)
        spawnProjectile({ x: e.x, z: e.z, vx: Math.sin(a) * d.shotSpeed, vz: Math.cos(a) * d.shotSpeed, life: t === pl ? (d.keep + 8) / d.shotSpeed : Math.max(0.1, edge / d.shotSpeed), r: 0.4,
          dmg: mobDmg(e, 1), team: 'mob', owner: e.id, kind: 'orb', color: d.shotColor || 0x7fe3ff, y: 1.4, ghost: t !== pl });
      }
      if (t !== pl) hit(n > 1 ? 0.6 * n : 1);
      ev({ t: 'shoot', kind: 'enemy', x: e.x, z: e.z });
    }
  }
  e.facing = Math.atan2(dx, dz);
  e.x += mx * sp * slow * (e.spd || 1) * dt; e.z += mz * sp * slow * (e.spd || 1) * dt;
  e.moveAmt = lerp(e.moveAmt || 0, sp > 0 ? 1 : 0, 1 - Math.exp(-dt * 10));
  e.attackAnim = Math.max(0, (e.attackAnim || 0) - dt * 3);
  trackVel(e, dt);
  if (pl.alive) separate(e, pl);
  for (const o of S.mobs) if (o !== e && o.alive) separate(e, o);
  collideObstacles(e); siegeClamp(e, e.r);
}
function siegeInteract(pl) {
  const S = G.siege, C = CFG.siege, near = (q, r) => Math.hypot(pl.x - SC.x - q.x, pl.z - SC.z - q.z) < r;
  if (near(C.exit, C.interactR)) return { kind: 'siegeLeave', label: 'Leave Fort' };
  let best = C.padR, hit = null;
  C.pads.forEach((q, i) => { const d = Math.hypot(pl.x - SC.x - q.x, pl.z - SC.z - q.z); if (d < best) { best = d; hit = i; } });
  if (hit != null) { const pad = fortState().pads[hit]; return { kind: 'fortPad', i: hit, label: pad ? `${C.towers[pad.t].short} Lv ${pad.l}` : 'Build' }; }
  if (S.phase === 'build') return { kind: 'siegeWave', label: `Start Wave ${S.wave}` };
  return null;
}
function siegeLeft() { const S = G.siege; return S ? S.queue.length + S.mobs.filter((e) => e.alive).length : 0; }
function endSiege(why) {
  const S = G.siege; if (!S) return;
  clearSiegeMobs(); clearProjectiles();
  G.siege = null; G.siegeObstacles = null; G.obstacles = G.hubObstacles;
  const pl = G.player, p = G.profile, C = CFG.siege, out = { x: C.gate.x + 2, z: C.gate.z };
  if (why !== 'away') { pl.x = out.x; pl.z = out.z; }
  if (pl.alive) { pl.invulnT = 1; pl.hp = pl.maxHp; } else G.respawnAt = { x: pl.x, z: pl.z };
  G.zoneIdx = zoneAt(pl.z);
  const res = { why, wave: S.wave, cleared: S.cleared, gold: S.gold, stones: S.stones, items: S.items, best: p.records.bestSiege || 0, x: pl.x, z: pl.z };
  G.siegeResult = res; G.dirty = true;
  ev(Object.assign({ t: 'siegeEnd' }, res));
}
// --- end siege
