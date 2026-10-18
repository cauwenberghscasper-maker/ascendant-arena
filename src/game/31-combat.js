// --- projectiles (pooled) -----------------------------------------------
const PROJ_MAX = 520;
const projectiles = [];
function blankProj() { return { active: false, x: 0, z: 0, vx: 0, vz: 0, life: 0, total: 0, r: 0, dmg: 0, team: '', owner: 0, pet: false, kind: 'bolt', aoe: 0, aoeMult: 0, slow: 0, charge: 0, color: 0xffffff, y: 1,
  burn: 0, burnT: 0, homing: 0, pierce: 0, hits: [], bounce: 0, split: null, lob: false, lobH: 0, boomerang: false, returning: false, vamp: 0, speed: 0, chain: 0 }; }
for (let i = 0; i < PROJ_MAX; i++) projectiles.push(blankProj());
let projCursor = 0;
function spawnProjectile(o) {
  for (let n = 0; n < PROJ_MAX; n++) {
    const p = projectiles[projCursor]; projCursor = (projCursor + 1) % PROJ_MAX;
    if (!p.active) {
      p.active = true; p.x = o.x; p.z = o.z; p.vx = o.vx; p.vz = o.vz; p.life = o.life; p.total = o.life; p.r = o.r; p.dmg = o.dmg;
      p.team = o.team; p.owner = o.owner; p.pet = !!o.pet; p.kind = o.kind; p.aoe = o.aoe || 0; p.aoeMult = o.aoeMult || 0;
      p.slow = o.slow || 0; p.charge = o.charge || 0; p.color = o.color; p.y = o.y || 1.0; p.burn = o.burn || 0; p.burnT = o.burnT || 0;
      p.homing = o.homing || 0; p.pierce = o.pierce || 0; p.hits.length = 0; p.bounce = o.bounce || 0; p.split = o.split || null;
      p.hx = o.hx || null; p.hv = o.hv || 0; p.hf = null; p.shape = o.shape || null; p.stun = o.stun || 0; p.knock = o.knock || 1.5; p.ghost = !!o.ghost; p.lob = !!o.lob && !o.ghost; p.lobH = o.lobH || 0; p.boomerang = !!o.boomerang; p.returning = false; p.vamp = o.vamp || 0; p.speed = Math.hypot(o.vx, o.vz); p.chain = o.chain || 0;
      return p;
    }
  }
  return null;
}
function obstacleAt(x, z, pad) {
  if (!G.obstacles) return null;
  let hit = null;
  G.obstacles.query(x, z, (o) => { if (!hit && Math.hypot(x - o.x, z - o.z) < o.r + pad) hit = o; });
  return hit;
}
function clearProjectiles() { for (const p of projectiles) p.active = false; G.pendingAoE.length = 0; G.clouds.length = 0; HeroSupers.clear(); if (HeroFXRef) HeroFXRef.clear(); }
// Codex heroes' supers and statuses run on the sim clock; their art (HeroFX) is created with the renderer below
const heroApi = { G, forEachTarget, dealDamage, spawnProjectile, ev, nearestFoe: (f, d) => nearestFoe(f, d),
  collide: (e) => { collideObstacles(e); if (e.kind === 'fighter') boundFighter(e, G.mode === 'arena' ? 'arena' : 'hub'); }, fx: null };
const HeroSupers = createHeroSupers(heroApi);
let HeroFXRef = null;

function forEachTarget(fn) {
  if (G.mode === 'arena') { const a = G.arena.fighters; for (let i = 0; i < a.length; i++) fn(a[i]); return; }
  fn(G.player);
  for (let i = 0; i < G.enemies.length; i++) if (!G.enemies[i].hidden) fn(G.enemies[i]); // burrowed monsters can't be hit or aimed at
  if (G.boss) fn(G.boss);
  if (G.mode === 'hub' && typeof pvpTargets === 'function') for (const e of pvpTargets()) fn(e); // opted-in PvP players
}

function projColor(f) {
  const w = weaponOf(f);
  if (!w.signature) return w.color;
  if (G.mode === 'arena' && !f.isPlayer) return 0xff7a59;
  if (f.isPlayer) return 0xffd34a;
  return w.kind === 'orb' ? 0xb79cff : 0x9fd7ff;
}

function stepProjectiles(dt) {
  for (let i = 0; i < PROJ_MAX; i++) {
    const p = projectiles[i]; if (!p.active) continue;
    if(p.pet && !petMayFight()){p.active=false;continue;}
    p.life -= dt;
    // homing: turn toward the nearest enemy
    if (p.homing > 0 && !p.returning) {
      let best = null, bd = 11;
      forEachTarget((t) => { if (!t.alive || t.team === p.team) return; const d = Math.hypot(t.x - p.x, t.z - p.z); if (d < bd) { bd = d; best = t; } });
      if (best) {
        const cur = Math.atan2(p.vx, p.vz), want = Math.atan2(best.x - p.x, best.z - p.z);
        const a = cur + clamp(angDiff(cur, want), -p.homing * dt, p.homing * dt);
        p.vx = Math.sin(a) * p.speed; p.vz = Math.cos(a) * p.speed;
      }
    }
    // boomerang: fly out, then home back to the thrower
    if (p.boomerang) {
      if (!p.returning && p.life <= p.total * 0.5) { p.returning = true; p.hits.length = 0; }
      if (p.returning) {
        const o = G.ents.get(p.owner);
        if (!o || !o.alive) { p.active = false; continue; }
        const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz) || 1;
        p.vx = dx / d * p.speed * 1.1; p.vz = dz / d * p.speed * 1.1;
        if (d < 0.9 || p.life < -p.total) { p.active = false; continue; }
      }
    }
    p.x += p.vx * dt; p.z += p.vz * dt;
    // another player's shot: looks the same, hits nothing here
    if (p.ghost) { if (p.life <= 0 || obstacleAt(p.x, p.z, p.r * 0.5)) p.active = false; continue; }
    // lobbed shells arc over everything and only explode on landing
    if (p.lob) {
      const k = 1 - Math.max(0, p.life) / p.total; p.y = 0.6 + 4 * p.lobH * k * (1 - k);
      if (p.life <= 0) { p.y = 0.3; expireProjectile(p, true, null); }
      continue;
    }
    // walls (arena) and obstacles: bounce if we can, else stop
    let wall = null;
    if (G.mode === 'arena') {
      const h = CFG.arena.half;
      if (Math.abs(p.x - AC.x) > h) wall = 'x'; else if (Math.abs(p.z - AC.z) > h) wall = 'z';
    }
    const ob = wall ? null : obstacleAt(p.x, p.z, p.r * 0.5);
    if (wall || ob) {
      if (p.bounce > 0) {
        p.bounce--; p.hits.length = 0;
        if (wall === 'x') { p.vx = -p.vx; p.x = clamp(p.x, AC.x - CFG.arena.half, AC.x + CFG.arena.half); }
        else if (wall === 'z') { p.vz = -p.vz; p.z = clamp(p.z, AC.z - CFG.arena.half, AC.z + CFG.arena.half); }
        else { let nx = p.x - ob.x, nz = p.z - ob.z; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl; const dot = p.vx * nx + p.vz * nz; p.vx -= 2 * dot * nx; p.vz -= 2 * dot * nz; p.x = ob.x + nx * (ob.r + p.r * 0.6); p.z = ob.z + nz * (ob.r + p.r * 0.6); }
        p.life = Math.max(p.life, p.total * 0.45);
        ev({ t: 'bounce', x: p.x, z: p.z, color: p.color });
      } else if (!p.boomerang) { expireProjectile(p, true, null); continue; }
    }
    let hitT = null;
    forEachTarget((t) => {
      if (hitT || !t.alive || t.team === p.team || p.hits.includes(t.id)) return;
      if(p.pet && t.kind!=='enemy' && t.kind!=='boss')return;
      if (t.kind === 'fighter' && t.invulnT > 0) return; // dodged!
      const dx = t.x - p.x, dz = t.z - p.z, rr = t.r + p.r;
      if (dx * dx + dz * dz < rr * rr) hitT = t;
    });
    if (hitT) {
      const amt = dealDamage(hitT, p.dmg, p.owner, { pet:p.pet, proc:p.pet, vamp: p.vamp, charge: p.charge, canCrit: !p.pet, slow: p.slow, knockX: p.vx, knockZ: p.vz, knock: p.knock || 1.5, stun: p.stun, primary: p.charge > 0, burn: p.burn, burnT: p.burnT, pk: p.kind, pc: p.color });
      if (p.hx) { HeroSupers.onBulletHit(p, hitT, amt || 0); if (!p.aoe) ev({ t: 'heroImpact', hid: p.hx, x: hitT.x, z: hitT.z, r: 0.9, hv: p.hv }); }
      if (p.chain > 0) chainFrom(hitT, p.chain, p.dmg * 0.6, p.owner, p.team);
      if (p.pierce > 0) {
        p.pierce--; p.hits.push(hitT.id);
        if (p.split) spawnSplit(p, hitT);
        if (p.aoe > 0) { aoeDamage(p.x, p.z, p.aoe, p.dmg * p.aoeMult, p.team, p.owner, { exclude: hitT, knock: 2 }); ev({ t: 'boom', x: p.x, z: p.z, r: p.aoe, color: p.color }); }
        continue;
      }
      expireProjectile(p, true, hitT);
      continue;
    }
    if (p.life <= 0 && !p.boomerang) expireProjectile(p, true, null);
  }
}
// lightning jumps from one target to the next nearest ones
function chainFrom(t, n, dmg, owner, team) {
  let cur = t; const done = [t.id];
  for (let k = 0; k < n; k++) {
    let best = null, bd = 7;
    forEachTarget((x) => { if (!x.alive || x.team === team || done.includes(x.id)) return; const d = Math.hypot(x.x - cur.x, x.z - cur.z); if (d < bd) { bd = d; best = x; } });
    if (!best) break;
    ev({ t: 'zap', x0: cur.x, z0: cur.z, x1: best.x, z1: best.z });
    done.push(best.id); dealDamage(best, dmg, owner, { canCrit: false, proc: true, charge: 0.05 }); cur = best;
  }
}
// child bullets: cluster shells burst in a ring, Splitter Core shards fan forward
function spawnSplit(p, direct) {
  const S = p.split, base = Math.atan2(p.vx, p.vz);
  for (let i = 0; i < S.n; i++) {
    const a = S.ring ? base + (i / S.n) * Math.PI * 2 : base + (i / Math.max(1, S.n - 1) - 0.5) * 1.2;
    const sx = Math.sin(a), sz = Math.cos(a);
    const c = spawnProjectile({ x: p.x + sx * 0.4, z: p.z + sz * 0.4, vx: sx * S.speed, vz: sz * S.speed, life: S.range / S.speed, r: S.r, dmg: S.dmg,
      team: p.team, owner: p.owner, kind: 'shard', color: p.color, charge: 0.05, burn: p.burn, burnT: p.burnT, slow: p.slow, vamp: p.vamp, y: Math.max(0.6, Math.min(1.2, p.y)) });
    if (c && direct) c.hits.push(direct.id);
  }
  ev({ t: 'split', x: p.x, z: p.z, color: p.color });
}
function expireProjectile(p, explode, direct) {
  if (!p.active) return;
  p.active = false;
  if (p.hx) HeroSupers.onBulletEnd(p, explode, direct);
  if (explode && p.split) spawnSplit(p, direct);
  if (explode && p.aoe > 0) {
    aoeDamage(p.x, p.z, p.aoe, p.dmg * (direct ? p.aoeMult : p.aoeMult * 1.25), p.team, p.owner, { exclude: direct, charge: p.charge * 0.5, knock: 3, burn: p.burn, burnT: p.burnT, slow: p.slow });
    ev({ t: 'boom', x: p.x, z: p.z, r: p.aoe, color: p.color, lob: p.lob, hid: p.hx, hv: p.hv });
  } else if (explode) {
    ev({ t: 'puff', x: p.x, z: p.z, color: p.color, hid: direct ? null : p.hx, hv: p.hv });
  }
}
function aoeDamage(x, z, r, dmg, team, owner, o) {
  o = o || {};
  forEachTarget((t) => {
    if (!t.alive || t.team === team || t === o.exclude) return;
    if (t.kind === 'fighter' && t.invulnT > 0) return;
    const dx = t.x - x, dz = t.z - z;
    if (dx * dx + dz * dz <= (r + t.r) * (r + t.r)) {
      dealDamage(t, dmg, owner, { charge: o.charge || 0, canCrit: false, slow: o.slow || 0, knockX: dx, knockZ: dz, knock: o.knock || 0, burn: o.burn || 0, burnT: o.burnT || 0, proc: !!o.proc });
    }
  });
}

function dealDamage(t, amount, srcId, o) {
  if (!t || !t.alive) return 0;
  if (t.isPeer) return srcId === G.player.id ? pvpHit(t, amount) : 0; // only your own shots, the victim decides
  if (t.invulnT > 0) return 0;
  if (t.isPlayer && G.mode === 'hub' && G.menuSafe > 0) return 0; // safe while a menu is open
  if (t.isPlayer && G.rift && amount > t.maxHp * 0.1) t.riftIframe = true; // big rift hits give a short safety window (set after the hit lands)
  if (G.mode === 'hub' && t.kind === 'fighter' && t.isBot) return 0; // hub bots are bystanders
  const src = G.ents.get(srcId);
  let amt = amount * (1 + (Math.random() * 2 - 1) * CFG.combat.variance);
  let crit = false;
  const sf = src && src.kind === 'fighter' && !o.pet ? src : null, K = sf ? sf.keys : null;
  if (sf) {
    if (t.kind === 'enemy' && sf.isPlayer) amt *= 1 + slayerBonus(t.type);
    if (sf.arts && sf.arts.giant && (t.elite || t.kind === 'boss')) amt *= 1 + artVal('giant', sf.arts.giant);
    if (K.execute && t.hp < t.maxHp * 0.35) amt *= 1.25;
    if (K.conqueror) amt *= 1 + 0.02 * sf.ks.conq;
  }
  if (o.canCrit && Math.random() < CFG.combat.critChance + (src && src.critBonus ? src.critBonus : 0)) { amt *= CFG.combat.critMult + (sf ? sf.critDmg : 0); crit = true; }
  if (t.armorT > 0) amt *= 1 - CFG.skills.ironskin.reduce;
  if (t.armor) amt *= 1 - Math.min(0.6, t.armor);
  if (t.ks && t.ks.afterT > 0) amt *= CFG.combat.afterReduce ?? 0.75;
  amt = HeroSupers.modDamage(src && src.kind === 'fighter' && !o.pet ? src : null, t, amt, o); // hero statuses: shields, guard, vulnerability, buffs
  amt = Math.max(t.guardT > 0 || t.shieldHp > 0 ? 0 : 1, Math.round(amt));
  // Undying Rage: survive one lethal hit per minute
  if (t.kind === 'fighter' && t.keys && t.keys.undying && t.ks.undyCd <= 0 && t.hp - amt <= 0) {
    amt = Math.max(0, Math.round(t.hp - 1)); t.ks.undyCd = 60; t.invulnT = 1.5; ev({ t: 'undying', x: t.x, z: t.z, isPlayer: t.isPlayer });
  }
  if (t.kind === 'boss' && typeof bossDamageMod === 'function') amt *= bossDamageMod(t); // warded: nearly immune until the team holds every ward; exposed after
  const hpBefore = Math.max(0, t.hp);
  t.hp -= amt; t.flashT = CFG.combat.hitFlash; t.lastHurt = G.time;
  // lobby: send our hit to whoever runs this monster or the world boss (70-multiplayer.js; absent in the node checks)
  if (t.own && t.kind === 'enemy' && src && src.isPlayer) mpMobHit(t, amt);
  if (t.kind === 'boss' && src && src.isPlayer && typeof bossFollowing === 'function' && bossFollowing()) mpBossHit(t, amt);
  if (o.slow) t.slowT = Math.max(t.slowT || 0, o.slow);
  if (o.burn) { t.burnT = o.burnT || 3; t.burnDmg = o.burn; t.burnSrc = srcId; if (!(t.burnTick > 0)) t.burnTick = 0.5; }
  // monster poise: knockback is scaled down and lands at most once per knockGap, so bullets cannot stunlock melee
  if (o.knock && t.kind !== 'boss' && (t.kind !== 'enemy' || G.time - (t.knockAt ?? -99) >= (CFG.enemies?.knockGap ?? 0.4))) {
    const d = Math.hypot(o.knockX, o.knockZ) || 1, KR = CFG.enemies?.knockRes, res = t.kind === 'enemy' && KR ? (t.elite ? KR.elite : KR[(CFG.enemies[t.type] || {}).kit] ?? KR.other) : 0;
    if (t.kind === 'enemy') t.knockAt = G.time;
    t.x += (o.knockX / d) * o.knock * 0.12 * (1 - res); t.z += (o.knockZ / d) * o.knock * 0.12 * (1 - res);
  }
  if (src && src.kind === 'fighter' && o.charge) {
    src.superCharge = Math.min(1, src.superCharge + CFG.combat.superPerHit * o.charge * (1 + src.mods.superGain + src.gearSuper));
  }
  if (t.kind === 'boss') { t.dmgBy[srcId] = (t.dmgBy[srcId] || 0) + amt; t.total += amt; }
  if (t.kind === 'enemy' && src && src.isPlayer) t.tagged = true;
  ev({ t: 'hit', x: t.x, z: t.z, y: t.kind === 'boss' ? 5.5 : 2.1, amt, crit, pet:!!o.pet, toPlayer: !!t.isPlayer, byPlayer: !!(src && src.isPlayer), pk: o.pk, pc: o.pc, slow: !!o.slow, burnFx: !!o.burnFx, proc: !!o.proc }); // pk/pc/burnFx/proc: cosmetic only
  if (t.isPlayer || (src && src.isPlayer)) markCombat();
  if (sf && sf.isPlayer && amt > (G.profile.records.maxHit || 0)) G.profile.records.maxHit = amt;
  if (sf && sf !== t && amt > 0) {
    // heal only from damage that landed (no overkill), through the shared per-second budget
    const eff = Math.min(amt, hpBefore); sf.lastDealt = G.time;
    if (sf.lifesteal > 0 && sf.alive) healCapped(sf, eff * sf.lifesteal * (o.proc ? 0.5 : 1));
    if (o.vamp && sf.alive) healCapped(sf, eff * o.vamp);
    if (o.canCrit && !o.proc) onHitProcs(sf, t, eff);
  }
  if (t.hp <= 0) { if (t.alive) { t.hp = 0; killEntity(t, src, !!o.pet); } }
  else if (t.kind === 'fighter' && t.perks && t.perks.retaliate && t.retalCd <= 0 && src && src !== t) {
    const R = CFG.perks.chest; t.retalCd = Math.max(R.minCd ?? 2.5, t.perks.retaliate);
    ev({ t: 'boom', x: t.x, z: t.z, r: R.r, color: 0x7fd8ff });
    aoeDamage(t.x, t.z, R.r, t.dmg * R.mult, t.team, t.id, { knock: 7 });
  }
  if (o.primary && src && src.kind === 'fighter' && src.perks && src.perks.chain) {
    const C = CFG.perks.accessory;
    src.hitCount++;
    if (src.hitCount % C.every === 0) {
      const near = [];
      forEachTarget((x) => { if (x.alive && x !== t && x.team !== src.team && Math.hypot(x.x - t.x, x.z - t.z) < C.range) near.push(x); });
      near.sort((a, b) => Math.hypot(a.x - t.x, a.z - t.z) - Math.hypot(b.x - t.x, b.z - t.z));
      for (const x of near.slice(0, src.perks.chain)) {
        ev({ t: 'zap', x0: t.x, z0: t.z, x1: x.x, z1: x.z });
        dealDamage(x, src.dmg * C.mult, src.id, { canCrit: false });
      }
      if (!near.length) ev({ t: 'zap', x0: t.x, z0: t.z, x1: t.x, z1: t.z });
    }
  }
  return amt;
}
// every on-hit heal draws from f.lsBudget (refilled by regenTick at lsCap x max HP per second, holding at most 1s worth)
function healCapped(f, x) {
  const cap = f.maxHp * (CFG.combat.lsCap ?? 0.04); if (f.lsBudget == null) f.lsBudget = cap;
  const h = Math.max(0, Math.min(x, f.lsBudget, f.maxHp - f.hp)); f.lsBudget -= h; f.hp += h; return h;
}

// keystone and artifact effects on a direct hit
function onHitProcs(f, t, amt) {
  const K = f.keys, ks = f.ks;
  if (K.tempo) { ks.tempo = Math.min(6, ks.tempo + 1); ks.tempoT = 4; }
  if (K.conqueror) { ks.conq = Math.min(10, ks.conq + 1); ks.conqT = 5; if (ks.conq >= 10) healCapped(f, amt * 0.08); }
  if (K.grasp && ks.graspCd <= 0 && t.alive) {
    ks.graspCd = 4; healCapped(f, f.maxHp * 0.03);
    ev({ t: 'proc', kind: 'grasp', x: t.x, z: t.z }); dealDamage(t, f.maxHp * 0.04, f.id, { proc: true });
  }
  if (K.phase) { ks.hits.push(G.time); while (ks.hits.length && G.time - ks.hits[0] > 3) ks.hits.shift(); if (ks.hits.length >= 3 && ks.phaseT <= 0) { ks.phaseT = 2; ks.hits.length = 0; ev({ t: 'proc', kind: 'phase', x: f.x, z: f.z, isPlayer: f.isPlayer }); } }
  if (K.electrocute && ks.eCd <= 0) {
    if (ks.eTarget === t.id && G.time - ks.eT < 3) ks.eCount++; else { ks.eTarget = t.id; ks.eCount = 1; }
    ks.eT = G.time;
    if (ks.eCount >= 3 && t.alive) { ks.eCd = 4; ks.eCount = 0; ev({ t: 'bolt', x: t.x, z: t.z }); dealDamage(t, f.dmg * 1.5, f.id, { proc: true }); }
  }
  if (K.comet && ks.cometCd <= 0) { ks.cometCd = 5; G.pendingAoE.push({ x: t.x, z: t.z, r: 2.6, t: 0.55, max: 0.55, dmg: f.dmg * 1.2, team: f.team, owner: f.id, kind: 'comet' }); }
  if (K.kraken) { ks.kraken++; if (ks.kraken % 3 === 0 && t.alive) { ev({ t: 'proc', kind: 'kraken', x: t.x, z: t.z }); dealDamage(t, f.dmg * 0.7, f.id, { proc: true }); } }
  if (f.arts && f.arts.coil) { const c = artVal('coil', f.arts.coil); chainFrom(t, c.n, f.dmg * c.mult, f.id, f.team); }
}
function stepKeystones(f, dt) {
  const ks = f.ks, K = f.keys;
  ks.tempoT -= dt; if (ks.tempoT <= 0) ks.tempo = 0;
  ks.conqT -= dt; if (ks.conqT <= 0) ks.conq = 0;
  ks.graspCd -= dt; ks.phaseT -= dt; ks.eCd -= dt; ks.cometCd -= dt; ks.undyCd -= dt;
  if (ks.afterT > 0) { ks.afterT -= dt; if (ks.afterT <= 0) { aoeDamage(f.x, f.z, 3.6, f.dmg * 0.9, f.team, f.id, { knock: 6, proc: true }); ev({ t: 'boom', x: f.x, z: f.z, r: 3.6, color: 0xffc94a }); } }
  if (K.sunfire) { ks.sunT -= dt; if (ks.sunT <= 0) { ks.sunT = 1; aoeDamage(f.x, f.z, 4, f.dmg * 0.35, f.team, f.id, { proc: true }); if (f.isPlayer) ev({ t: 'sunfire', x: f.x, z: f.z }); } }
}
function killEntity(t, src, pet = false) {
  t.alive = false;
  if (t.kind === 'fighter') {
    ev({ t: 'die', x: t.x, z: t.z, kind: 'fighter', isPlayer: t.isPlayer });
    if (G.mode === 'arena') onArenaDeath(t, src);
    else if (t.isPlayer) { if (typeof pvpOnDeath === 'function') pvpOnDeath(); G.respawnT = CFG.player.respawn; toast('You were knocked out. Respawning in town…', 'bad'); }
  } else if (t.kind === 'enemy') {
    t.respawnT = t.temp ? 1e9 : t.elite ? CFG.world.eliteRespawn : t.den != null ? CFG.world.denRespawn : CFG.world.enemyRespawn;
    ev({ t: 'die', x: t.x, z: t.z, kind: t.type, elite: !!t.elite });
    if (t.tagged) rewardEnemyKill(t);
    if (src && src.kind === 'fighter' && !pet) {
      if (src.keys.storm) { aoeDamage(t.x, t.z, 3, src.dmg * 0.6, src.team, src.id, { proc: true, knock: 3 }); ev({ t: 'boom', x: t.x, z: t.z, r: 3, color: 0x9fd7ff }); }
      if (src.arts && src.arts.reaper) { src.ammo = Math.min(src.ammoMax, src.ammo + 1); healCapped(src, src.maxHp * artVal('reaper', src.arts.reaper)); }
    }
  } else if (t.kind === 'boss') {
    ev({ t: 'die', x: t.x, z: t.z, kind: 'boss' });
    endBoss(true);
  }
}

// --- fighter step (shared by player, hub bots, arena bots) --------------
function nearestFoe(f, maxD) {
  let best = null, bd = maxD;
  forEachTarget((t) => {
    if (!t.alive || t.team === f.team || t === f) return;
    const d = Math.hypot(t.x - f.x, t.z - f.z);
    if (d < bd) { bd = d; best = t; }
  });
  return best;
}
// --- auto-aim: sticky, leads moving targets, prefers what is in front and in sight ---------
function trackVel(e, dt) {
  if (e._lx == null || dt <= 0) { e._lx = e.x; e._lz = e.z; e.vx = 0; e.vz = 0; return; }
  let vx = (e.x - e._lx) / dt, vz = (e.z - e._lz) / dt; const v = Math.hypot(vx, vz); if (v > 16) { vx = vz = 0; }
  const k = 1 - Math.exp(-dt * 10); e.vx += (vx - e.vx) * k; e.vz += (vz - e.vz) * k; e._lx = e.x; e._lz = e.z;
}
function losBlocked(x0, z0, x1, z1) {
  if (G.mode !== 'hub') return false;
  const d = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(d / 1.2);
  for (let i = 1; i < n; i++) { const k = i / n; if (obstacleAt(x0 + (x1 - x0) * k, z0 + (z1 - z0) * k, 0.05)) return true; }
  return false;
}
function autoTarget(f, range, strong) {
  let best = null, bs = Infinity;
  const fx = Math.sin(f.facing), fz = Math.cos(f.facing);
  forEachTarget((t) => {
    if (!t.alive || t.team === f.team || t === f) return;
    const dx = t.x - f.x, dz = t.z - f.z, d = Math.hypot(dx, dz);
    if (d > range + t.r) return;
    let sc = d - ((dx * fx + dz * fz) / (d || 1)) * (strong ? 0.8 : 2); // strong (tap / auto fire): closest first, facing matters less
    if (t.id === f.lockId && G.time - f.lockT < (strong ? 4 : 2.5)) sc -= strong ? 9 : 4; // and it sticks to its target
    if (t.hp < t.maxHp * 0.3) sc -= 1.5;
    if (t.kind === 'boss' || t.elite) sc -= 1;
    if (t.isPeer) sc -= 4; // PvP: an enemy player nearby comes before monsters
    if (losBlocked(f.x, f.z, t.x, t.z)) sc += strong ? 5 : 7;
    if (sc < bs) { bs = sc; best = t; }
  });
  return best;
}
function leadPoint(f, t, speed, k) {
  const d = Math.hypot(t.x - f.x, t.z - f.z), tt = Math.min(1.2, d / Math.max(4, speed)), m = k || 0.85;
  return [t.x + (t.vx || 0) * tt * m, t.z + (t.vz || 0) * tt * m];
}
// returns [dirX, dirZ, distanceFraction] — the fraction is used by lobbed shots
function aimDir(f, it) {
  const w = weaponOf(f);
  if (it.autoFire) {
    const strong = !!f.isPlayer; // your own taps and held fire get the strong aimbot: wider reach, sticky lock, full lead on movers
    const t = autoTarget(f, w.range * (strong ? 1.25 : 1.1), strong);
    if (t) {
      f.lockId = t.id; f.lockT = G.time;
      const [lx, lz] = leadPoint(f, t, w.speed, strong ? 1 : 0.85), dx = lx - f.x, dz = lz - f.z, d = Math.hypot(dx, dz) || 1;
      return [dx / d, dz / d, clamp(d / w.range, 0.2, 1)];
    }
    return [Math.sin(f.facing), Math.cos(f.facing), 0];
  }
  const d = Math.hypot(it.ax, it.az);
  if (d < 1e-3) return [Math.sin(f.facing), Math.cos(f.facing), 0];
  let dx = it.ax / d, dz = it.az / d;
  // gentle aim assist for thumbs: bend a hand-aimed shot up to ~8 degrees toward a target on that line
  if (f.isPlayer && !w.lob) {
    const a0 = Math.atan2(dx, dz); let best = null, ba = 0.2;
    forEachTarget((t) => {
      if (!t.alive || t.team === f.team || t === f) return;
      const tdx = t.x - f.x, tdz = t.z - f.z, td = Math.hypot(tdx, tdz); if (td > w.range * 1.05) return;
      const da = Math.abs(angDiff(a0, Math.atan2(tdx, tdz))); if (da < ba) { ba = da; best = t; }
    });
    if (best) { const [lx, lz] = leadPoint(f, best, w.speed), a1 = Math.atan2(lx - f.x, lz - f.z), a = a0 + clamp(angDiff(a0, a1), -0.2, 0.2); dx = Math.sin(a); dz = Math.cos(a); f.lockId = best.id; f.lockT = G.time; }
  }
  return [dx, dz, it.aimDist || 0];
}
// one bullet of the equipped attack, with artifact effects layered on
function spawnBullet(f, w, a, lobDist, scale) {
  const A = f.arts || NO_ARTS;
  let r = w.radius, mult = w.mult * (scale || 1), speed = w.speed;
  const bsd = A.bigshot ? artVal('bigshot', A.bigshot) : 0;
  if (A.bigshot) { r *= 1.35; mult *= 1 + bsd; speed *= 0.92; }
  const dbase = f.dmgAlt;
  const base = dbase * mult;
  const sx = Math.sin(a), sz = Math.cos(a);
  let life = w.range / speed, lobH = 0;
  if (w.lob) { const d = clamp(lobDist || w.range * 0.8, 3, w.range); life = d / speed; lobH = 1.6 + d * 0.22; }
  const per = 1 / (w.count * (w.burst || 1));
  let split = null;
  const spv = A.splitter ? artVal('splitter', A.splitter) : null;
  if (w.split) split = Object.assign({}, w.split, { n: w.split.n + (spv ? spv.n : 0), dmg: dbase * w.split.mult * (1 + bsd) });
  else if (spv) split = { n: spv.n, speed: Math.min(22, speed), range: 4.5, r: Math.max(0.16, r * 0.6), dmg: base * spv.mult, ring: false };
  let aoe = (w.aoe || 0) * (1 + f.mods.aoe), aoeMult = w.aoeMult || 0;
  if (A.blast) { const bv = artVal('blast', A.blast); if (aoe) aoe += bv.r / 3; else { aoe = bv.r; aoeMult = bv.mult; } }
  const burn = (A.ember ? base * artVal('ember', A.ember) : 0) + (w.burnMult ? base * w.burnMult : 0);
  const shot = spawnProjectile({ x: f.x + sx * 0.7, z: f.z + sz * 0.7, vx: sx * speed, vz: sz * speed, life, r, dmg: base, team: f.team, owner: f.id, kind: w.kind,
    aoe, aoeMult, charge: per, color: projColor(f), homing: (w.homing || 0) + (A.seekerChip ? artVal('seekerChip', A.seekerChip) : 0), pierce: (w.pierce || 0) + (A.pierce ? artVal('pierce', A.pierce) : 0),
    bounce: (w.bounce || 0) + (A.rubber ? artVal('rubber', A.rubber) : 0), split, lob: !!w.lob, lobH, boomerang: !!w.boomerang, chain: w.chain || 0,
    burn, burnT: burn ? 2.5 : 0, slow: (A.frost ? artVal('frost', A.frost) : 0) + (w.slow || 0), vamp: A.vamp ? artVal('vamp', A.vamp) : 0 });
  if (w.hero && shot) HeroSupers.decorateBullet(shot, w, f);
  return shot;
}
// where a lobbed shot lands: the aim stick's length when aimed by hand (Brawl Stars), else the target
function lobDistFor(f, w, base, aimDist) {
  if (aimDist > 0) return clamp(aimDist * w.range, 3, w.range);
  const t = nearestFoe(f, w.range + 2);
  if (t) { const ta = Math.atan2(t.x - f.x, t.z - f.z); if (Math.abs(angDiff(base, ta)) < 0.6) return Math.hypot(t.x - f.x, t.z - f.z); }
  return w.range * 0.8;
}
function emitVolley(f, w, dx, dz, first, aimDist) {
  let base = Math.atan2(dx, dz);
  if (w.jitter) base += (Math.random() * 2 - 1) * w.jitter;
  const lobDist = w.lob ? lobDistFor(f, w, base, aimDist || 0) : 0;
  for (let i = 0; i < w.count; i++) {
    if (w.lobLine) { spawnBullet(f, w, base, clamp(lobDist + (i - (w.count - 1) / 2) * w.lobLine * 1.4, 2.5, w.range + 2)); continue; }
    const a = w.count > 1 ? base + (i / (w.count - 1) - 0.5) * w.spread : base;
    spawnBullet(f, w, a, lobDist);
  }
  if (first && f.perks && f.perks.twin) spawnBullet(f, w, base + (w.count > 1 ? w.spread * 0.75 : 0.14), lobDist, f.perks.twin);
  if (f.arts && f.arts.twin) spawnBullet(f, w, base - (w.count > 1 ? w.spread * 0.75 : 0.1), lobDist, artVal('twin', f.arts.twin));
}
function fireWeapon(f, dx, dz, aimDist) {
  const w = weaponOf(f);
  emitVolley(f, w, dx, dz, true, aimDist);
  f.motionClip = null; if (w.lunge) HeroSupers.lunge(f, w, dx, dz);
  if (w.burst > 1) { f.burstLeft = w.burst - 1; f.burstT = w.burstGap; f.burstDX = dx; f.burstDZ = dz; }
  f.facing = Math.atan2(dx, dz); f.attackAnim = 1; f.lastAttack = G.time; f.motionAction = "attack";
  ev({ t: 'shoot', kind: w.kind, isPlayer: f.isPlayer, x: f.x, z: f.z });
  mpOnShot(f, dx, dz);
}
function doMelee(f) {
  const M = CFG.combat.melee, c = CFG.classes[f.cls];
  const tanky = c && c.role === 'Tank', mult = M.mult * (tanky ? 1.4 : 1);
  const fx = Math.sin(f.facing), fz = Math.cos(f.facing);
  forEachTarget((t) => {
    if (!t.alive || t.team === f.team || t === f) return;
    const dx = t.x - f.x, dz = t.z - f.z, d = Math.hypot(dx, dz);
    if (d > M.range + t.r) return;
    const dot = (dx * fx + dz * fz) / (d || 1);
    if (d > 1.0 && Math.acos(clamp(dot, -1, 1)) > M.arc) return;
    dealDamage(t, f.dmg * mult * (tanky ? 1.1 : 1), f.id, { charge: 0.8, canCrit: true, knockX: dx, knockZ: dz, knock: M.knock, pk: 'melee' });
  });
  f.attackAnim = 1; f.lastAttack = G.time; f.motionAction = 'melee'; f.motionClip = null;
  ev({ t: 'melee', x: f.x + fx * 1.3, z: f.z + fz * 1.3, isPlayer: f.isPlayer });
}
function doSuper(f, dx, dz, aimDist) {
  const s = CFG.classes[f.cls].super, S = CFG.supers[s];
  // mastery makes supers bigger and wider; ascended heroes hit even harder
  const ML = f.superML || 1, big = (ML - 1) / 98;
  const pow = (1 + f.mods.superPow) * (1 + big) * (f.isPlayer && G.mode === 'hub' && ascTier(G.profile.level) >= 2 ? 1.5 : 1);
  if (S && S.hero) { // Codex heroes: a scripted super of their own (assets/data/hero-supers-v6.js)
    HeroSupers.cast(f, dx, dz, aimDist, { pow });
    f.superCharge = 0; f.attackAnim = 1; f.lastAttack = G.time; f.motionAction = 'spell';
    ev({ t: 'super', kind: s, hero: S.hero, isPlayer: f.isPlayer, x: f.x, z: f.z }); return;
  }
  const base = Math.atan2(dx, dz);
  const color = f.isPlayer ? 0xffb02e : 0xff6a3d;
  if (s === 'nova') {
    const nn = S.count + Math.floor(ML / 15) * 2;
    for (let i = 0; i < nn; i++) {
      const a = base + (i / nn) * Math.PI * 2, sx = Math.sin(a), sz = Math.cos(a);
      spawnProjectile({ x: f.x, z: f.z, vx: sx * 20, vz: sz * 20, life: 0.6 + big * 0.5, r: 0.45 + big * 0.3, dmg: f.dmg * S.mult * pow, team: f.team, owner: f.id, kind: 'bolt', charge: 0, color });
    }
  } else if (s === 'slam') {
    const sr = S.r * (1 + big * 0.8);
    aoeDamage(f.x, f.z, sr, f.dmg * S.mult * pow, f.team, f.id, { knock: S.knock });
    f.invulnT = Math.max(f.invulnT, 0.3);
    ev({ t: 'boom', x: f.x, z: f.z, r: sr, color: 0xffa94d, big: true });
  } else if (s === 'volley') {
    const nv = S.count + Math.floor(ML / 20) * 2, spv = S.spread * (1 + big * 0.8);
    for (let i = 0; i < nv; i++) {
      const a = base + (i / (nv - 1) - 0.5) * spv, sx = Math.sin(a), sz = Math.cos(a);
      spawnProjectile({ x: f.x + sx * 0.7, z: f.z + sz * 0.7, vx: sx * 32, vz: sz * 32, life: 20 / 32, r: 0.32, dmg: f.dmg * S.mult * pow, team: f.team, owner: f.id, kind: 'arrow', charge: 0, color });
    }
  } else if (s === 'meteor') {
    let tx = f.x + dx * S.dist, tz = f.z + dz * S.dist;
    if (aimDist > 0) { tx = f.x + dx * S.dist * clamp(aimDist, 0.3, 1); tz = f.z + dz * S.dist * clamp(aimDist, 0.3, 1); }
    else { const t = nearestFoe(f, S.dist + 3); if (t) { tx = t.x; tz = t.z; } }
    const mr = S.r * (1 + big * 0.6);
    G.pendingAoE.push({ x: tx, z: tz, r: mr, t: S.delay, max: S.delay, dmg: f.dmg * S.mult * pow, team: f.team, owner: f.id, kind: 'meteor' });
    // high mastery: a meteor shower around the main strike
    for (let k = 0; k < Math.floor(ML / 25); k++) { const a = base + k * 2.1, d2 = mr * 1.3; G.pendingAoE.push({ x: tx + Math.sin(a) * d2, z: tz + Math.cos(a) * d2, r: mr * 0.7, t: S.delay + 0.18 * (k + 1), max: S.delay + 0.18 * (k + 1), dmg: f.dmg * S.mult * pow * 0.6, team: f.team, owner: f.id, kind: 'meteor' }); }
  }
  f.superCharge = 0; f.facing = base; f.attackAnim = 1; f.lastAttack = G.time; f.motionAction = "spell";
  ev({ t: 'super', kind: s, isPlayer: f.isPlayer, x: f.x, z: f.z });
}
function doSkill(f) {
  const sk = CFG.classes[f.cls].skill; if (!sk) return;
  const S = CFG.skills[sk];
  if (sk === 'ironskin') f.armorT = S.dur;
  else if (sk === 'swift') { f.swiftT = S.dur; f.ammo = f.ammoMax; }
  else if (sk === 'frostnova') {
    aoeDamage(f.x, f.z, S.r, f.dmg * S.mult, f.team, f.id, { slow: S.slow, charge: 0.5, knock: 2 });
    ev({ t: 'boom', x: f.x, z: f.z, r: S.r, color: 0x9ae8ff });
  }
  f.skillCd = S.cd * (1 - f.mods.skillCd) * (1 - f.cdr);
  ev({ t: 'skill', kind: sk, isPlayer: f.isPlayer, x: f.x, z: f.z });
}

function tickBurn(t, dt) {
  if (!(t.burnT > 0) || !t.alive) return;
  t.burnT -= dt; t.burnTick -= dt;
  if (t.burnTick <= 0) { t.burnTick = 0.5; dealDamage(t, t.burnDmg * 0.5, t.burnSrc, { burnFx: true }); }
}
function doSpecial(f, dx, dz, aimDist) {
  const el = f.perks.special, E = CFG.elements[el], pow = f.perks.specialPow;
  const base = Math.atan2(dx, dz);
  if (el === 'fire') {
    spawnProjectile({ x: f.x + dx * 0.8, z: f.z + dz * 0.8, vx: dx * E.speed, vz: dz * E.speed, life: E.range / E.speed, r: 0.65, dmg: f.dmg * E.mult * pow,
      team: f.team, owner: f.id, kind: 'fire', aoe: E.r, aoeMult: 0.7, charge: 0.6, color: E.color, burn: f.dmg * E.burn * pow, burnT: E.burnT });
  } else if (el === 'ice') {
    for (let i = 0; i < E.count; i++) {
      const a = base + (i / (E.count - 1) - 0.5) * E.spread, sx = Math.sin(a), sz = Math.cos(a);
      spawnProjectile({ x: f.x + sx * 0.7, z: f.z + sz * 0.7, vx: sx * E.speed, vz: sz * E.speed, life: E.range / E.speed, r: 0.38, dmg: f.dmg * E.mult * pow,
        team: f.team, owner: f.id, kind: 'ice', charge: 0.2, color: E.color, slow: E.slow });
    }
  } else if (el === 'storm') {
    const list = [];
    forEachTarget((t) => { if (t.alive && t.team !== f.team && t !== f && Math.hypot(t.x - f.x, t.z - f.z) < E.range) list.push(t); });
    list.sort((a, b) => Math.hypot(a.x - f.x, a.z - f.z) - Math.hypot(b.x - f.x, b.z - f.z));
    const hits = list.slice(0, E.targets);
    for (const t of hits) { ev({ t: 'bolt', x: t.x, z: t.z }); dealDamage(t, f.dmg * E.mult * pow, f.id, { charge: 0.4, canCrit: true, knock: 0, knockX: 0, knockZ: 0 }); }
    if (!hits.length) ev({ t: 'bolt', x: f.x + dx * 6, z: f.z + dz * 6 });
  } else if (el === 'poison') {
    const dd = E.dist * (aimDist > 0 ? clamp(aimDist, 0.3, 1.3) : 1);
    let tx = f.x + dx * dd, tz = f.z + dz * dd;
    G.clouds.push({ x: tx, z: tz, r: E.r, t: E.dur, max: E.dur, tick: 0, dmg: f.dmg * E.mult * pow, team: f.team, owner: f.id });
  }
  f.specialCd = E.cd * (1 - f.cdr); f.attackAnim = 1; f.facing = base; f.lastAttack = G.time; f.motionAction = "spell";
  ev({ t: 'special', el, x: f.x, z: f.z, isPlayer: f.isPlayer });
}
function stepClouds(dt) {
  for (let i = G.clouds.length - 1; i >= 0; i--) {
    const c = G.clouds[i]; c.t -= dt; c.tick -= dt;
    if (c.pull) cloudPull(c, dt); // monster vortex (33-world-sim)
    if (c.tick <= 0) { c.tick = CFG.elements.poison.tick; if (c.dmg > 0) aoeDamage(c.x, c.z, c.r, c.dmg, c.team, c.owner, { charge: 0.1, slow: 0.6 }); }
    if (c.t <= 0) G.clouds.splice(i, 1);
  }
}
// regen waits after being hit and (in the world) after dealing damage; the heal budget refills here too
function regenTick(f, dt, ctx) {
  const cap = f.maxHp * (CFG.combat.lsCap ?? 0.04); f.lsBudget = Math.min(cap, (f.lsBudget ?? cap) + cap * dt);
  const regen = (ctx === 'arena' ? CFG.arena.regen : P.regenHub) * (f.keys.secondWind ? 2 : 1) * (f.regenMult || 1);
  const delay = f.keys.secondWind ? 1.5 : ctx === 'arena' ? CFG.arena.regenDelay : P.regenDelay;
  if (f.hp < f.maxHp && G.time - f.lastHurt > delay && G.time - f.lastAttack > (ctx === 'arena' ? 1.5 : 0) && (ctx === 'arena' || G.time - (f.lastDealt ?? -99) > P.regenAfterHit)) {
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * regen * dt);
  }
}
function stepFighter(f, dt, ctx) {
  if (!f.alive) return;
  const it = f.intent, w = weaponOf(f), C = CFG.combat;
  f.fireCd -= dt; f.meleeCd -= dt; f.dashCd -= dt; f.skillCd -= dt;
  f.invulnT -= dt; f.flashT -= dt; f.slowT -= dt; f.armorT -= dt; f.swiftT -= dt; f.retalCd -= dt; f.specialCd -= dt;
  tickBurn(f, dt); if (!f.alive) return;
  stepKeystones(f, dt); if (!f.alive) return;
  if (HeroSupers.tickStatus(f, dt)) { f.moveAmt = Math.max(0, (f.moveAmt || 0) - dt * 6); trackVel(f, dt); clearOneShots(f.intent); return; } // stunned, banished or mid-super
  const tempo = f.ks.tempo * 0.05;
  f.attackAnim = Math.max(0, f.attackAnim - dt * 4);
  if (f.burstLeft > 0) {
    f.burstT -= dt;
    if (f.burstT <= 0) { f.burstT = w.burstGap; f.burstLeft--; emitVolley(f, w, f.burstDX, f.burstDZ, false); if (f.isPlayer || f.burstLeft % 2 === 0) ev({ t: 'shoot', kind: w.kind, isPlayer: f.isPlayer, x: f.x, z: f.z, quiet: true }); }
  }
  if (f.ammo < f.ammoMax) {
    f.reloadT += dt * (1 + f.mods.reload + (f.perks ? f.perks.reload : 0) + (f.atkSpeed || 0) + tempo) * (f.swiftT > 0 ? 1.5 : 1);
    if (f.reloadT >= w.reload) { f.ammo++; f.reloadT = 0; }
  } else f.reloadT = 0;

  // movement
  let mx = it.mx, mz = it.mz;
  const ml = Math.hypot(mx, mz);
  if (ml > 1) { mx /= ml; mz /= ml; }
  if (f.dashT > 0) {
    f.dashT -= dt;
    const v = C.dash.dist / C.dash.time;
    f.x += f.dashX * v * dt; f.z += f.dashZ * v * dt;
    f.moveAmt = 1;
    if (f.perks && f.perks.dashStrike) {
      forEachTarget((t) => {
        if (!t.alive || t.team === f.team || f.dashHit.includes(t.id)) return;
        if (Math.hypot(t.x - f.x, t.z - f.z) < t.r + f.r + 0.7) {
          f.dashHit.push(t.id);
          dealDamage(t, f.dmg * f.perks.dashStrike, f.id, { charge: 0.5, canCrit: true, knockX: f.dashX, knockZ: f.dashZ, knock: 6 });
          ev({ t: 'puff', x: t.x, z: t.z, color: 0xffd34a });
        }
      });
    }
  } else {
    const sp = f.speed * (f.slowT > 0 ? 0.55 : 1) * (f.swiftT > 0 ? CFG.skills.swift.speed : 1) * (f.ks.phaseT > 0 ? 1.4 : 1);
    f.x += mx * sp * dt; f.z += mz * sp * dt;
    f.moveAmt = lerp(f.moveAmt, Math.min(1, ml), 1 - Math.exp(-dt * 12));
  }
  collideObstacles(f);
  boundFighter(f, ctx);

  // facing
  if (it.aiming && (it.ax || it.az)) f.facing = Math.atan2(it.ax, it.az);
  else if (ml > 0.15 && f.attackAnim <= 0.2) f.facing = Math.atan2(mx, mz);

  // actions
  if (it.dash && f.dashCd <= 0) {
    let dx = mx, dz = mz;
    if (Math.hypot(dx, dz) < 0.2) { dx = Math.sin(f.facing); dz = Math.cos(f.facing); }
    const d = Math.hypot(dx, dz) || 1;
    f.dashX = dx / d; f.dashZ = dz / d; f.dashT = C.dash.time; f.dashHit.length = 0; f.invulnT = Math.max(f.invulnT, C.dash.invuln); f.dashCd = C.dash.cd;
    if (f.keys.aftershock) f.ks.afterT = 2;
    ev({ t: 'dash', x: f.x, z: f.z, isPlayer: f.isPlayer });
  }
  if ((it.fire || it.autoFire) && f.ammo >= 1 && f.fireCd <= 0 && f.burstLeft <= 0) {
    const [dx, dz, ad] = aimDir(f, it);
    fireWeapon(f, dx, dz, ad); f.ammo--; f.fireCd = w.cd * Math.max(0.3, 1 - (f.atkSpeed || 0) - tempo);
  }
  if (it.melee && f.meleeCd <= 0) { doMelee(f); f.meleeCd = C.melee.cd; }
  if (it.super && f.superCharge >= 1) {
    const [dx, dz] = it.superDir ? it.superDir : aimDir(f, { autoFire: true, ax: 0, az: 0 });
    doSuper(f, dx, dz, it.superDir ? it.superDist : 0);
  }
  if (it.skill && f.skillCd <= 0 && CFG.classes[f.cls].skill) doSkill(f);
  if (it.special && f.specialCd <= 0 && f.perks && f.perks.special) {
    const [dx, dz] = it.specialDir ? it.specialDir : aimDir(f, { autoFire: true, ax: 0, az: 0 });
    doSpecial(f, dx, dz, it.specialDir ? it.specialDist : 0);
  }

  regenTick(f, dt, ctx);
  trackVel(f, dt);
  clearOneShots(it);
}

function boundFighter(f, ctx) {
  if (G.rift && f.isPlayer) { riftClamp(f, f.r); return; }
  if (G.dungeon && f.isPlayer) { dungeonClamp(f, f.r); return; }
  if (ctx === 'arena') {
    const h = CFG.arena.half - f.r;
    f.x = clamp(f.x, AC.x - h, AC.x + h); f.z = clamp(f.z, AC.z - h, AC.z + h);
    return;
  }
  const W = CFG.world;
  f.x = clamp(f.x, W.minX, W.maxX); f.z = clamp(f.z, W.minZ, W.maxZ);
  if (f.isPlayer) {
    const L = G.profile.level;
    for (let i = 1; i < W.zones.length; i++) {
      const zn = W.zones[i];
      if (L < zn.minLevel && f.z > zn.z0 - f.r) {
        f.z = zn.z0 - f.r;
        if (G.time - G.gateToastT > 3) { G.gateToastT = G.time; toast(`The ${zn.name} gate needs level ${zn.minLevel}`, 'bad'); }
        break;
      }
    }
  } else if (f.isBot && G.mode === 'hub') {
    for (let i = 1; i < W.zones.length; i++) {
      const zn = W.zones[i];
      if (f.level < zn.minLevel && f.z > zn.z0 - f.r) { f.z = zn.z0 - f.r; break; }
    }
  }
}

