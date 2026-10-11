// --- arena -------------------------------------------------------------------------
function arenaDifficulty(trophies) { return clamp(0.15 + 0.85 * trophies / CFG.arena.maxDiffTrophies, 0.15, 1); }
function startArena() {
  const A = CFG.arena, p = G.profile;
  clearProjectiles();
  G.mode = 'arena'; G.obstacles = G.arenaObstacles;
  const d = arenaDifficulty(p.trophies);
  const ar = G.arena = { t: 0, phase: 'countdown', cd: A.countdown, gasR: A.gasStart, fighters: [], cubes: [], over: false, d, overT: 0, result: null, gasTick: 0 };
  const n = A.fighters;
  const startAng = Math.random() * Math.PI * 2;
  const names = BOT_NAMES.slice().sort(() => Math.random() - 0.5);
  for (let i = 0; i < n; i++) {
    const a = i === 0 ? Math.PI : startAng + (i / n) * Math.PI * 2; // player spawns at south edge
    let ang = a;
    if (i > 0) { ang = Math.PI + (i / n) * Math.PI * 2; }
    const x = AC.x + Math.sin(ang) * A.spawnR, z = AC.z + Math.cos(ang) * A.spawnR;
    const facing = Math.atan2(AC.x - x, AC.z - z);
    let f;
    if (i === 0) {
      f = makeFighter({ name: 'You', team: 't0', isPlayer: true, cls: resolvedAttack(p), x, z, facing });
      applyLoadout(f, resolvedAttack(p), p.artifacts, p.artStars);
      f.power = playerArenaPower(p);
      applyStats(f, 'arena', p);
    } else {
      const arche = pick(['aggressive', 'cautious', 'sniper']);
      let cls = arche === 'sniper' ? pick(['rail', 'arrow', 'seeker', 'mortar', 'orb']) : arche === 'aggressive' ? pick(['scatter', 'smg', 'flamer', 'wave', 'chakram', 'gatling']) : pick(CFG.brawlerOrder);
      if (p.trophies < 30 && Math.random() < 0.4) cls = 'bolt';
      f = makeFighter({ name: names[i - 1], team: 't' + i, isBot: true, cls, x, z, facing,
        ai: { arche, react: rand(0, 0.5), target: null, strafe: Math.random() < 0.5 ? 1 : -1, strafeT: rand(1, 2.5), fireT: rand(0.3, 1), dodgeT: 0, wx: AC.x, wz: AC.z, lx: x, lz: z, stuckT: 0 } });
      f.power = CFG.arena.botPowerBase + CFG.arena.botPowerScale * d * rand(0.85, 1.1);
      // each bot is its own "brawler": a main attack + artifacts that grow with trophies
      const artN = d > 0.7 ? 2 : d > 0.35 ? 1 : 0;
      const bs = {}; for (const id in CFG.artifacts) bs[id] = 1 + Math.floor(d * 6 * Math.random());
      applyLoadout(f, cls, Object.keys(CFG.artifacts).sort(() => Math.random() - 0.5).slice(0, artN), bs);
      applyStats(f, 'arena', { level: 1, gear: null });
    }
    f.hp = f.maxHp;
    ar.fighters.push(f);
  }
  G.player.intent = newIntent();
  ev({ t: 'arenaStart' });
}
function onArenaDeath(t, src) {
  const ar = G.arena;
  const aliveOthers = ar.fighters.filter((f) => f.alive && f !== t).length;
  t.placement = aliveOthers + 1;
  ar.cubes.push({ x: t.x, z: t.z, active: true, bob: Math.random() * 6 });
  if (src && src.isPlayer) ev({ t: 'ko', name: t.name });
  if (t.isPlayer) { ar.phase = 'over'; ar.overT = 1.6; finishArena(t.placement); }
}
function stepArena(dt) {
  const ar = G.arena, A = CFG.arena;
  if (ar.phase === 'countdown') {
    ar.cd -= dt;
    for (const f of ar.fighters) clearOneShots(f.intent);
    if (ar.cd <= 0) { ar.phase = 'fight'; ev({ t: 'fightStart' }); }
    return;
  }
  if (ar.phase === 'over') {
    ar.overT -= dt;
    // keep simulating the remaining bots for spectacle
  }
  ar.t += dt;
  const gk = clamp((ar.t - A.gasDelay) / A.gasTime, 0, 1);
  ar.gasR = lerp(A.gasStart, A.gasEnd, gk);
  for (const f of ar.fighters) {
    if (!f.alive) continue;
    if (f.isBot) arenaBotThink(f, dt);
    else if (ar.phase === 'over') clearOneShots(f.intent);
    stepFighter(f, dt, 'arena');
  }
  for (let i = 0; i < ar.fighters.length; i++) for (let j = i + 1; j < ar.fighters.length; j++) {
    const a = ar.fighters[i], b = ar.fighters[j]; if (a.alive && b.alive) separate(a, b, true);
  }
  // gas damage ticks every 0.5s
  ar.gasTick -= dt;
  if (ar.gasTick <= 0) {
    ar.gasTick = 0.5;
    for (const f of ar.fighters) {
      if (!f.alive) continue;
      if (Math.hypot(f.x - AC.x, f.z - AC.z) > ar.gasR) {
        const dps = A.gasDps * (1 + A.gasRamp * Math.max(0, ar.t - A.gasDelay));
        const amt = Math.round(f.maxHp * dps * 0.5);
        f.hp -= amt; f.flashT = 0.1; f.lastHurt = G.time;
        ev({ t: 'hit', x: f.x, z: f.z, y: 2.1, amt, crit: false, toPlayer: f.isPlayer, gas: true });
        if (f.isPlayer) markCombat();
        if (f.hp <= 0) { f.hp = 0; killEntity(f, null); }
      }
    }
  }
  // power cubes
  for (const c of ar.cubes) {
    if (!c.active) continue;
    for (const f of ar.fighters) {
      if (f.alive && Math.hypot(f.x - c.x, f.z - c.z) < 1.3) {
        c.active = false; f.cubes++;
        const keep = f.hp / f.maxHp;
        f.maxHp = Math.round(f.maxHp * (1 + A.cube)); f.dmg *= 1 + A.cube; f.hp = Math.min(f.maxHp, f.maxHp * keep + f.maxHp * 0.1);
        ev({ t: 'cube', x: c.x, z: c.z, isPlayer: f.isPlayer });
        break;
      }
    }
  }
  if (ar.phase === 'fight') {
    const alive = ar.fighters.filter((f) => f.alive);
    if (G.player.alive && alive.length === 1) { G.player.placement = 1; ar.phase = 'over'; ar.overT = 1.6; finishArena(1); }
    else if (ar.t > A.maxTime && G.player.alive) {
      const ratio = G.player.hp / G.player.maxHp;
      const place = 1 + alive.filter((f) => !f.isPlayer && f.hp / f.maxHp > ratio).length;
      ar.phase = 'over'; ar.overT = 1.6; finishArena(place);
    }
  }
}
function finishArena(place) {
  const ar = G.arena, A = CFG.arena, p = G.profile;
  if (ar.result) return;
  const delta = A.trophies[clamp(place - 1, 0, A.trophies.length - 1)];
  const before = p.trophies;
  p.trophies = Math.max(0, p.trophies + delta);
  p.bestTrophies = Math.max(p.bestTrophies, p.trophies);
  if (!p.records.bestPlace || place < p.records.bestPlace) p.records.bestPlace = place;
  const gold = A.gold[clamp(place - 1, 0, A.gold.length - 1)];
  p.gold += gold;
  p.stats.matches++; if (place === 1) p.stats.wins++;
  ar.result = { place, delta: p.trophies - before, trophies: p.trophies, gold, kills: 0 };
  checkAchievements(); G.dirty = true;
  ev({ t: place === 1 ? 'victory' : 'defeat', place });
}
function leaveArena() {
  if (!G.arena) return;
  for (const f of G.arena.fighters) G.ents.delete(f.id);
  G.arena = null; clearProjectiles();
  G.mode = 'hub'; G.obstacles = G.hubObstacles;
  const pl = G.player; pl.x = PORTAL.x + 3; pl.z = PORTAL.z + 7; pl.facing = 0; pl.hp = pl.maxHp; pl.alive = true; pl.intent = newIntent();
  G.lastCombat = -99;
  ev({ t: 'arenaEnd' });
}

function arenaBotThink(b, dt) {
  const ai = b.ai, it = b.intent, ar = G.arena, B = CFG.bots, d = ar.d;
  const w = weaponOf(b);
  it.mx = it.mz = 0; it.aiming = false;
  ai.react -= dt; ai.fireT -= dt; ai.strafeT -= dt; ai.dodgeT -= dt;
  if (ai.strafeT <= 0) { ai.strafe = -ai.strafe; ai.strafeT = rand(0.9, 2.4); }
  if (ai.react <= 0) {
    ai.react = lerp(B.reactMax, B.reactMin, d) * rand(0.7, 1.3);
    let best = null, bs = 1e9;
    for (const f of ar.fighters) {
      if (!f.alive || f === b) continue;
      const dist = Math.hypot(f.x - b.x, f.z - b.z);
      if (dist > lerp(B.seeMin, B.seeMax, d)) continue;
      let score = dist;
      if (ai.arche === 'aggressive') score -= (1 - f.hp / f.maxHp) * 8;
      if (score < bs) { bs = score; best = f; }
    }
    ai.target = best;
    if (!best) {
      let cube = null, cd = 18;
      for (const c of ar.cubes) if (c.active) { const dd = Math.hypot(c.x - b.x, c.z - b.z); if (dd < cd) { cd = dd; cube = c; } }
      if (cube) { ai.wx = cube.x; ai.wz = cube.z; }
      else if (Math.random() < 0.3) { ai.wx = AC.x + rand(-1, 1) * ar.gasR * 0.5; ai.wz = AC.z + rand(-1, 1) * ar.gasR * 0.5; }
    }
  }
  let mx = 0, mz = 0;
  const t = ai.target && ai.target.alive ? ai.target : null;
  if (t) {
    const dx = t.x - b.x, dz = t.z - b.z, dist = Math.hypot(dx, dz) || 1, ux = dx / dist, uz = dz / dist;
    let want = w.range * (ai.arche === 'aggressive' ? 0.5 : ai.arche === 'cautious' ? 0.8 : 0.92);
    if (ai.arche === 'cautious' && b.hp / b.maxHp < 0.4) want = w.range * 1.3;
    const radial = dist > want + 1 ? 1 : dist < want - 1.5 ? -1 : 0;
    mx = ux * radial + -uz * ai.strafe * 0.75; mz = uz * radial + ux * ai.strafe * 0.75;
    if (dist < w.range * 1.02 && b.ammo >= 1 && ai.fireT <= 0) {
      let lead = 0;
      if (d > 0.4) lead = (dist / w.speed) * d;
      const tvx = (t.intent.mx || 0) * t.speed, tvz = (t.intent.mz || 0) * t.speed;
      let ax = t.x + tvx * lead - b.x, az = t.z + tvz * lead - b.z;
      const err = lerp(B.aimErrMax, B.aimErrMin, d) * (Math.random() * 2 - 1);
      const ang = Math.atan2(ax, az) + err;
      it.ax = Math.sin(ang); it.az = Math.cos(ang); it.aiming = true; it.fire = true;
      ai.fireT = ((ai.arche === 'aggressive' ? 0.25 : ai.arche === 'sniper' ? 0.55 : 0.4) + rand(0, 0.45)) * lerp(B.fireSlowMax, 1, d);
    }
    if (dist < 2.4 && Math.random() < dt * 3) it.melee = true;
    if (b.superCharge >= 1 && dist < w.range * 0.8) it.super = true;
    const sk = CFG.classes[b.cls].skill;
    if (sk && b.skillCd <= 0) {
      if (sk === 'ironskin' && b.hp / b.maxHp < 0.65) it.skill = true;
      if (sk === 'swift' && (dist < 5 || b.ammo === 0)) it.skill = true;
      if (sk === 'frostnova' && dist < 4.5) it.skill = true;
    }
  } else {
    const dx = ai.wx - b.x, dz = ai.wz - b.z, dist = Math.hypot(dx, dz);
    if (dist > 1.5) { mx = dx / dist * 0.8; mz = dz / dist * 0.8; }
  }
  // gas avoidance overrides everything
  const cx = AC.x - b.x, cz = AC.z - b.z, dc = Math.hypot(cx, cz) || 1;
  if (dc > ar.gasR - 4) { const k = dc > ar.gasR ? 1.2 : 0.8; mx = mx * 0.3 + cx / dc * k; mz = mz * 0.3 + cz / dc * k; }
  // dodge incoming projectiles
  if (ai.dodgeT <= 0) {
    ai.dodgeT = 0.1;
    if (b.dashCd <= 0) {
      for (let i = 0; i < PROJ_MAX; i++) {
        const p = projectiles[i]; if (!p.active || p.team === b.team) continue;
        const rx = b.x - p.x, rz = b.z - p.z, dd = Math.hypot(rx, rz); if (dd > 5) continue;
        const sp = Math.hypot(p.vx, p.vz) || 1;
        if ((rx * p.vx + rz * p.vz) / (dd * sp) > 0.9 && Math.random() < lerp(B.dodgeMin, B.dodgeMax, d) * 0.35) {
          it.dash = true; const side = Math.random() < 0.5 ? 1 : -1;
          mx = -p.vz / sp * side; mz = p.vx / sp * side; break;
        }
      }
    }
  }
  // stuck on crates: flip strafe
  ai.stuckT += dt;
  if (ai.stuckT > 0.8) { if (Math.hypot(b.x - ai.lx, b.z - ai.lz) < 0.6 && Math.hypot(mx, mz) > 0.3) ai.strafe = -ai.strafe; ai.stuckT = 0; ai.lx = b.x; ai.lz = b.z; }
  it.mx = mx; it.mz = mz;
}

