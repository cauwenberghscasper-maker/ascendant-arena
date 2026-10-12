// Data-driven supers for the 27 Codex heroes (assets/data/heroes-v6.js) plus the statuses they use.
// Pure simulation: it moves, damages and buffs entities through the game's own functions (passed in `api`)
// and asks the FX layer (assets/data/hero-fx-v6.js, via api.fx) to draw props. Each super is a list of ops
// that run `at` seconds after the cast; long-running ops (zones, waves, dashes, beams...) live in `live`.
import { HERO_V6, heroTierPow } from './heroes-v6.js';

export function createHeroSupers(api) {
  const { G, forEachTarget, dealDamage, spawnProjectile, ev } = api;
  const acts = [], live = [], marked = new Set();
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const isBoss = (t) => t.kind === 'boss';
  const foes = (c, x, z, r) => { const out = []; forEachTarget((t) => { if (t.alive && t.team !== c.f.team && !(t.lostT > 0) && Math.hypot(t.x - x, t.z - z) <= r + (t.r || 0.5)) out.push(t); }); return out; };
  const allies = (c, x, z, r) => { const out = []; forEachTarget((t) => { if (t.alive && t.team === c.f.team && t.kind === 'fighter' && Math.hypot(t.x - x, t.z - z) <= r + (t.r || 0.5)) out.push(t); }); if (!out.includes(c.f) && c.f.alive && Math.hypot(c.f.x - x, c.f.z - z) <= r) out.push(c.f); return out; };
  const heal = (t, amt) => { if (!t.alive || amt <= 0) return; const h = Math.min(t.maxHp - t.hp, amt); if (h > 0) { t.hp += h; ev({ t: 'heroHeal', x: t.x, z: t.z, amt: Math.round(h), isPlayer: !!t.isPlayer }); } };
  const move = (t, x, z) => { if (isBoss(t)) return; t.x = x; t.z = z; if (api.collide) api.collide(t); };

  function status(t, s, color) {
    const boss = isBoss(t), k = boss ? 0.3 : 1;
    if (s.stun) { t.stunT = Math.max(t.stunT || 0, s.stun * k); t.stunKind = s.sleep ? 'sleep' : s.stone ? 'stone' : s.kind || 'stun'; t.stunCol = color; }
    if (s.vuln) { t.vulnT = Math.max(t.vulnT || 0, s.vulnDur || s.stun || 3); t.vuln = Math.max(t.vulnT > 0 ? (t.vuln || 0) : 0, s.vuln); }
    if (s.weak) { t.weakT = Math.max(t.weakT || 0, s.dur || 4); t.weak = s.weak; }
    if (s.slow) t.slowT = Math.max(t.slowT || 0, s.slow);
    marked.add(t);
  }
  function hurt(c, t, mult, o = {}) {
    if (!t.alive || mult <= 0) return 0;
    const dx = t.x - (o.fromX ?? c.f.x), dz = t.z - (o.fromZ ?? c.f.z);
    const amt = dealDamage(t, c.BA * mult, c.f.id, { charge: 0, canCrit: false, proc: true, slow: o.slow || 0, knockX: dx, knockZ: dz, knock: o.knock || 0, burn: o.burn ? c.BA * o.burn : 0, burnT: o.burn ? 3 : 0, pk: 'hero', pc: c.H.ammo.glow });
    if (o.stun || o.vuln || o.weak) status(t, o, c.H.ammo.glow);
    return amt || 0;
  }

  // ---------------------------------------------------------------- casting
  function where(c, w, op) {
    if (w === 'target') return { x: c.tx, z: c.tz };
    if (w === 'lane') return { x: c.f.x, z: c.f.z };
    return { x: c.f.x, z: c.f.z };
  }
  function pickTarget(c, range) {
    let best = null, bs = 1e9;
    forEachTarget((t) => {
      if (!t.alive || t.team === c.f.team || t.lostT > 0) return;
      const d = dist(t, c.f); if (d > range) return;
      const da = Math.abs(angDiff(c.a, Math.atan2(t.x - c.f.x, t.z - c.f.z)));
      const s = d + da * 4; if (s < bs) { bs = s; best = t; }
    });
    return best;
  }
  function cast(f, dx, dz, aimDist, opts = {}) {
    const H = HERO_V6[f.cls]; if (!H) return false;
    const S = H.super, A = S.aim || { type: 'self' };
    const pow = (opts.pow || 1) * (G.mode === 'hub' ? heroTierPow(H.id) : 1);
    let a = Math.atan2(dx, dz);
    const c = { f, H, a, pow, BA: f.dmg * pow, t: 0, ops: S.ops.slice().sort((p, q) => (p.at || 0) - (q.at || 0)), i: 0, tx: f.x, tz: f.z, target: null };
    if (A.type === 'circle') {
      let d = A.dist * 0.7;
      if (aimDist > 0) d = A.dist * clamp(aimDist, 0.25, 1);
      else { const t = api.nearestFoe(f, A.dist + 2); if (t) { d = Math.min(A.dist, dist(t, f)); c.a = a = Math.atan2(t.x - f.x, t.z - f.z); } }
      c.tx = f.x + Math.sin(a) * d; c.tz = f.z + Math.cos(a) * d;
    } else if (A.type === 'lane' && !(aimDist > 0)) {
      const t = api.nearestFoe(f, (A.len || 12) + 2); if (t) c.a = a = Math.atan2(t.x - f.x, t.z - f.z);
    } else if (A.type === 'target') {
      c.target = pickTarget(c, A.range + 1.5) || api.nearestFoe(f, A.range + 1.5);
      if (c.target) { c.tx = c.target.x; c.tz = c.target.z; c.a = a = Math.atan2(c.tx - f.x, c.tz - f.z); }
    }
    f.facing = a; f.motionClip = S.clip || 'Spellcast_Raise';
    acts.push(c); api.fx && api.fx.superCast(H, f, c);
    run(c, 0);
    return true;
  }
  function run(c, dt) {
    c.t += dt;
    while (c.i < c.ops.length && (c.ops[c.i].at || 0) <= c.t + 1e-6) { const op = c.ops[c.i++]; try { exec(c, op); } catch (e) { console.warn('hero super op failed', op.op, e); } }
    return c.i < c.ops.length;
  }

  // ---------------------------------------------------------------- ops
  const OPS = {
    fx(c, o) { const p = where(c, o.where, o); api.fx && api.fx.spawn(o.fx, Object.assign({ x: p.x, z: p.z, a: c.a, H: c.H, f: c.f, tx: c.tx, tz: c.tz }, o)); },
    self(c, o) {
      const f = c.f, d = o.dur || o.lock || 1;
      if (o.lock) f.heroLockT = Math.max(f.heroLockT || 0, o.lock);
      if (o.armor) { f.heroArmorT = Math.max(f.heroArmorT || 0, d); f.heroArmor = o.armor; }
      if (o.dmgBuff) { f.dmgBuffT = Math.max(f.dmgBuffT || 0, d); f.dmgBuff = o.dmgBuff; }
      if (o.vuln) { f.vulnT = Math.max(f.vulnT || 0, d); f.vuln = o.vuln; }
      marked.add(f);
    },
    blast(c, o) {
      const p = where(c, o.where);
      const hit = foes(c, p.x, p.z, o.r);
      for (const t of hit) {
        const inner = o.inner && Math.hypot(t.x - p.x, t.z - p.z) <= o.inner.r;
        hurt(c, t, o.dmg + (inner ? o.inner.dmg : 0), { fromX: p.x, fromZ: p.z, knock: o.knock || 3, stun: (inner && o.inner.stun) || o.stun, sleep: o.sleep, stone: o.stone, vuln: o.vuln, vulnDur: o.vulnDur, slow: o.slow });
      }
      if (o.selfDmg) { c.f.hp = Math.max(1, c.f.hp - c.f.maxHp * o.selfDmg); ev({ t: 'heroHurtSelf', x: c.f.x, z: c.f.z }); }
      if (o.allyCharge) for (const a of allies(c, p.x, p.z, 14)) a.superCharge = Math.min(1, (a.superCharge || 0) + o.allyCharge);
      ev({ t: 'heroBlast', hid: c.H.id, x: p.x, z: p.z, r: o.r, fx: o.fx || null, n: hit.length, stun: !!o.stun });
    },
    buff(c, o) {
      const p = where(c, o.where);
      if (o.allies) {
        const A = o.allies, d = A.dur || 4;
        for (const t of allies(c, p.x, p.z, o.r)) {
          if (A.heal) heal(t, c.BA * A.heal);
          if (A.shield) { t.shieldHp = Math.max(t.shieldHp || 0, c.BA * A.shield); t.shieldT = d; t.shieldRetal = A.retal ? c.BA * A.retal : 0; t.shieldCol = c.H.ammo.glow; }
          if (A.armor) { t.heroArmorT = Math.max(t.heroArmorT || 0, d); t.heroArmor = A.armor; }
          if (A.dmgBuff) { t.dmgBuffT = Math.max(t.dmgBuffT || 0, d); t.dmgBuff = A.dmgBuff; }
          if (A.cleanse) { t.slowT = 0; t.burnT = 0; t.stunT = 0; t.weakT = 0; t.vulnT = 0; }
          if (A.reset) { t.skillCd = 0; t.ammo = t.ammoMax; t.specialCd = 0; }
          t.buffCol = c.H.ammo.glow; marked.add(t);
        }
      }
      if (o.enemies) {
        const E = o.enemies;
        for (const t of foes(c, p.x, p.z, o.r)) {
          if (E.dmg) hurt(c, t, E.dmg, { fromX: p.x, fromZ: p.z, burn: E.burn });
          if (E.drainCharge && t.superCharge) t.superCharge = Math.max(0, t.superCharge - E.drainCharge);
          status(t, { slow: E.slow, weak: E.weak, dur: E.dur, stun: E.stun }, c.H.ammo.glow);
        }
      }
      ev({ t: 'heroBuff', hid: c.H.id, x: p.x, z: p.z, r: o.r, fx: o.fx || null });
    },
    zone(c, o) { addZone(c, o, where(c, o.where)); },
    wave(c, o) {
      const dir = { x: Math.sin(c.a), z: Math.cos(c.a) }, perp = { x: dir.z, z: -dir.x };
      const z = { c, o, dir, perp, x0: c.f.x, z0: c.f.z, s: 0.5, hit: new Set(), carried: [], lastTrail: 0, done: false };
      api.fx && api.fx.spawn(o.fx || 'tide', { H: c.H, x: c.f.x, z: c.f.z, a: c.a, len: o.len, width: o.width, speed: o.speed, follow: z });
      z.update = (dt) => {
        z.s += o.speed * dt;
        const fx = z.x0 + dir.x * z.s, fz = z.z0 + dir.z * z.s;
        z.x = fx; z.z = fz;
        forEachTarget((t) => {
          if (!t.alive || t.team === c.f.team || z.hit.has(t)) return;
          const rx = t.x - z.x0, rz = t.z - z.z0, along = rx * dir.x + rz * dir.z, side = rx * perp.x + rz * perp.z;
          if (Math.abs(side) <= o.width / 2 && along <= z.s + 0.6 && along >= z.s - 1.6) { z.hit.add(t); hurt(c, t, o.dmg, { slow: o.slow }); if (o.carry && !isBoss(t)) z.carried.push(t); }
        });
        for (const t of z.carried) if (t.alive) move(t, t.x + dir.x * o.speed * dt, t.z + dir.z * o.speed * dt);
        if (o.trailZone && z.s - z.lastTrail > 3) { z.lastTrail = z.s; addZone(c, Object.assign({ tick: 0.5, dur: o.trailZone.dur, r: o.trailZone.r, slow: o.trailZone.slow, quiet: true }, {}), { x: fx, z: fz }); }
        if (z.s >= o.len) {
          for (const t of z.carried) if (t.alive) status(t, { stun: o.stunEnd || 0 }, c.H.ammo.glow);
          ev({ t: 'heroBlast', hid: c.H.id, x: fx, z: fz, r: o.width / 2, fx: 'waveBreak', n: z.carried.length });
          return false;
        }
        return true;
      };
      live.push(z);
    },
    dash(c, o) {
      const f = c.f, dir = { x: Math.sin(c.a), z: Math.cos(c.a) }, passes = o.passes || 1;
      const x0 = f.x, z0 = f.z, x1 = f.x + dir.x * o.len, z1 = f.z + dir.z * o.len;
      const d = { c, o, pass: 0, s: 0, hit: new Set() };
      f.heroLockT = Math.max(f.heroLockT || 0, (o.len / o.speed) * passes + 0.3); f.invulnT = Math.max(f.invulnT, (o.len / o.speed) * passes + 0.2);
      f.dashT = Math.max(f.dashT || 0, 0.01);
      d.update = (dt) => {
        d.s += o.speed * dt; const k = Math.min(1, d.s / o.len), fwd = d.pass % 2 === 0;
        const px = fwd ? x0 + (x1 - x0) * k : x1 + (x0 - x1) * k, pz = fwd ? z0 + (z1 - z0) * k : z1 + (z0 - z1) * k;
        const prevX = f.x, prevZ = f.z; f.x = px; f.z = pz; f.facing = Math.atan2(fwd ? dir.x : -dir.x, fwd ? dir.z : -dir.z); f.moveAmt = 1;
        if (api.collide) api.collide(f);
        forEachTarget((t) => {
          if (!t.alive || t.team === f.team || d.hit.has(t)) return;
          if (Math.hypot(t.x - f.x, t.z - f.z) <= o.width / 2 + (t.r || 0.5)) {
            d.hit.add(t); hurt(c, t, o.dmg, { slow: o.slow, knock: 0 });
            if (o.knockSide && !isBoss(t)) { const side = (t.x - f.x) * dir.z - (t.z - f.z) * dir.x >= 0 ? 1 : -1; move(t, t.x + dir.z * side * o.knockSide, t.z - dir.x * side * o.knockSide); }
          }
        });
        ev({ t: 'heroTrail', hid: c.H.id, x: f.x, z: f.z, x0: prevX, z0: prevZ });
        if (k >= 1) {
          d.pass++; d.s = 0; d.hit.clear();
          if (d.pass >= passes) {
            const e = o.end;
            if (e) {
              for (const t of foes(c, f.x, f.z, e.r)) {
                if (e.execute && !isBoss(t) && t.hp < t.maxHp * e.execute) { dealDamage(t, t.hp + 1, f.id, { proc: true, pk: 'hero' }); ev({ t: 'heroExecute', hid: c.H.id, x: t.x, z: t.z }); if (e.refund) f.superCharge = Math.min(1, (f.superCharge || 0) + e.refund); continue; }
                hurt(c, t, e.dmg, { knock: 5, stun: e.stun });
              }
              ev({ t: 'heroBlast', hid: c.H.id, x: f.x, z: f.z, r: e.r, fx: e.fx || null, stun: !!e.stun });
            }
            f.heroLockT = 0; return false;
          }
        }
        return true;
      };
      live.push(d);
    },
    leaps(c, o) {
      const f = c.f, L = { c, o, n: 0, t: 0, hits: new Map(), from: null, to: null };
      f.heroLockT = Math.max(f.heroLockT || 0, o.n * o.gap + 0.4);
      const next = () => {
        let best = null, bd = o.range;
        forEachTarget((t) => { if (!t.alive || t.team === f.team || t.lostT > 0 || (L.hits.get(t) || 0) >= 2) return; const d = dist(t, f) + (L.hits.get(t) || 0) * 3; if (d < bd) { bd = d; best = t; } });
        return best;
      };
      L.target = next();
      if (!L.target) { f.heroLockT = 0; return; }
      L.from = { x: f.x, z: f.z };
      L.update = (dt) => {
        L.t += dt; const k = Math.min(1, L.t / o.gap), t = L.target;
        f.invulnT = Math.max(f.invulnT, 0.12); f.heroAirY = Math.sin(k * Math.PI) * 1.4;
        if (t && t.alive) { const ex = t.x - Math.sin(Math.atan2(t.x - L.from.x, t.z - L.from.z)) * 0.9, ez = t.z - Math.cos(Math.atan2(t.x - L.from.x, t.z - L.from.z)) * 0.9; f.x = L.from.x + (ex - L.from.x) * k; f.z = L.from.z + (ez - L.from.z) * k; f.facing = Math.atan2(t.x - f.x, t.z - f.z); }
        if (k >= 1) {
          L.n++; f.heroAirY = 0;
          if (t && t.alive) { L.hits.set(t, (L.hits.get(t) || 0) + 1); hurt(c, t, o.dmg, { knock: 2, stun: L.n >= o.n ? o.stunLast : 0 }); ev({ t: 'heroBlast', hid: c.H.id, x: t.x, z: t.z, r: 1.2, fx: 'claw' }); f.lastAttack = G.time; f.attackAnim = 1; f.motionAction = 'melee'; }
          if (L.n >= o.n) { f.heroLockT = 0; return false; }
          L.target = next(); if (!L.target) { f.heroLockT = 0; return false; }
          L.t = 0; L.from = { x: f.x, z: f.z };
        }
        return true;
      };
      live.push(L);
    },
    leap(c, o) {
      const f = c.f, from = { x: f.x, z: f.z }, to = { x: c.tx, z: c.tz };
      const crew = o.allies ? allies(c, f.x, f.z, o.allies.r).filter((a) => a !== f).slice(0, o.allies.max) : [];
      const L = { t: 0 };
      f.heroLockT = Math.max(f.heroLockT || 0, o.air + 0.2);
      for (const a of [f, ...crew]) { a.invulnT = Math.max(a.invulnT, o.air + 0.1); a.heroLockT = Math.max(a.heroLockT || 0, o.air + 0.1); }
      L.update = (dt) => {
        L.t += dt; const k = Math.min(1, L.t / o.air);
        const h = Math.sin(Math.min(1, k * 1.05) * Math.PI) * 7;
        crew.forEach((a, i) => { const ang = c.a + (i + 1) * TAU / (crew.length + 1); a.heroAirY = h; if (k >= 1) { a.x = to.x + Math.sin(ang) * 1.8; a.z = to.z + Math.cos(ang) * 1.8; a.heroAirY = 0; } });
        f.heroAirY = h; f.x = from.x + (to.x - from.x) * smooth(k); f.z = from.z + (to.z - from.z) * smooth(k);
        if (k >= 1) {
          f.heroAirY = 0; if (api.collide) { api.collide(f); crew.forEach(api.collide); }
          const e = o.end;
          for (const t of foes(c, to.x, to.z, e.r)) hurt(c, t, e.dmg, { fromX: to.x, fromZ: to.z, knock: 6, stun: e.stun });
          if (e.shield) for (const a of [f, ...crew]) { a.shieldHp = Math.max(a.shieldHp || 0, c.BA * e.shield); a.shieldT = e.shieldDur || 4; a.shieldCol = c.H.ammo.glow; marked.add(a); }
          ev({ t: 'heroBlast', hid: c.H.id, x: to.x, z: to.z, r: e.r, fx: e.fx || null, stun: true, big: true });
          return false;
        }
        return true;
      };
      live.push(L);
    },
    beam(c, o) {
      const f = c.f, B = { t: 0, turnHits: new Map(), a0: c.a };
      B.update = (dt) => {
        B.t += dt; const k = Math.min(1, B.t / o.dur), ang = B.a0 + k * o.turns * TAU, turn = Math.floor(k * o.turns - 1e-6);
        f.facing = ang; c.beamA = ang;
        forEachTarget((t) => {
          if (!t.alive || t.lostT > 0) return;
          const d = dist(t, f); if (d > o.range || d < 0.3) return;
          const da = Math.abs(angDiff(ang, Math.atan2(t.x - f.x, t.z - f.z)));
          if (da * d > o.width / 2 + (t.r || 0.5)) return;
          const key = t.id + ':' + turn; if (B.turnHits.has(key)) return; B.turnHits.set(key, 1);
          if (t.team === f.team) { if (o.allyHeal && t.kind === 'fighter') heal(t, c.BA * o.allyHeal); }
          else hurt(c, t, o.dmg, { slow: o.slow, knock: 1 });
        });
        return k < 1;
      };
      api.fx && api.fx.spawn('beamSweep', { H: c.H, f, follow: B, c, range: o.range, width: o.width, dur: o.dur });
      live.push(B);
    },
    hook(c, o) {
      const f = c.f;
      const list = foes(c, f.x, f.z, o.range).sort((a, b) => dist(a, f) - dist(b, f)).slice(0, o.max || 6);
      let total = 0;
      for (const t of list) total += hurt(c, t, o.dmg, { knock: 0 });
      if (o.drain) heal(f, total * o.drain);
      const P = { t: 0, list, starts: list.map((t) => ({ x: t.x, z: t.z })) };
      P.update = (dt) => {
        P.t += dt; const k = Math.min(1, P.t / 0.35);
        list.forEach((t, i) => {
          if (!t.alive || isBoss(t)) return; const s = P.starts[i], d = Math.hypot(f.x - s.x, f.z - s.z) || 1, pull = Math.min(o.pull, d - 1.4);
          move(t, s.x + (f.x - s.x) / d * pull * smooth(k), s.z + (f.z - s.z) / d * pull * smooth(k));
        });
        return k < 1;
      };
      api.fx && api.fx.spawn(o.fx || 'chains', { H: c.H, f, targets: list.slice(), dur: 0.9 });
      live.push(P);
    },
    rain(c, o) {
      const p = where(c, o.where); let k = 0;
      const R = { t: 0 };
      R.update = (dt) => {
        R.t += dt;
        while (k < o.n && R.t >= k * (o.interval || 0.15)) {
          const a = Math.random() * TAU, rr = Math.sqrt(Math.random()) * o.area, x = p.x + Math.sin(a) * rr, z = p.z + Math.cos(a) * rr;
          for (const t of foes(c, x, z, o.r)) hurt(c, t, o.dmg, { fromX: x, fromZ: z, knock: 3 });
          ev({ t: 'heroBlast', hid: c.H.id, x, z, r: o.r, fx: 'rainHit' }); k++;
        }
        return k < o.n;
      };
      live.push(R);
    },
    stance(c, o) {
      const f = c.f, S = { t: 0, next: 0, bite: 0.5, slam: o.every || 1 };
      if (o.armor) { f.heroArmorT = Math.max(f.heroArmorT || 0, o.dur); f.heroArmor = o.armor; marked.add(f); }
      S.update = (dt) => {
        if (!f.alive) return false;
        S.t += dt; S.next -= dt; S.bite -= dt;
        const tgt = api.nearestFoe(f, 9);
        if (o.cone && S.next <= 0) {
          S.next = o.every;
          const base = tgt ? Math.atan2(tgt.x - f.x, tgt.z - f.z) : f.facing, C = o.cone;
          for (let i = 0; i < C.count; i++) {
            const a = base + (C.count > 1 ? (i / (C.count - 1) - 0.5) * C.spread : 0), sx = Math.sin(a), sz = Math.cos(a);
            spawnProjectile({ x: f.x + sx * 0.8, z: f.z + sz * 0.8, vx: sx * C.speed, vz: sz * C.speed, life: C.range / C.speed, r: 0.5, dmg: c.BA * C.dmg, team: f.team, owner: f.id, kind: 'flame', pierce: 99, charge: 0, color: c.H.ammo.glow, burn: C.burn ? c.BA * C.burn : 0, burnT: C.burn ? 2 : 0, hx: c.H.id, shape: 'ghostfire' });
          }
        }
        if (o.bite && S.bite <= 0 && tgt && dist(tgt, f) <= o.bite.range) {
          S.bite = o.bite.every; hurt(c, tgt, o.bite.dmg, { knock: 0 });
          if (o.bite.pull && !isBoss(tgt)) { const d = dist(tgt, f) || 1; move(tgt, tgt.x + (f.x - tgt.x) / d * Math.min(o.bite.pull, d - 1.2), tgt.z + (f.z - tgt.z) / d * Math.min(o.bite.pull, d - 1.2)); }
          ev({ t: 'heroBlast', hid: c.H.id, x: tgt.x, z: tgt.z, r: 1, fx: 'bite' });
        }
        if (o.slam) {
          S.slam -= dt;
          if (S.slam <= 0) { S.slam = o.every; for (const t of foes(c, f.x, f.z, o.slam.r)) hurt(c, t, o.slam.dmg, { knock: 5 }); f.lastAttack = G.time; f.attackAnim = 1; f.motionAction = 'melee'; f.motionClip = '2H_Melee_Attack_Chop'; ev({ t: 'heroBlast', hid: c.H.id, x: f.x, z: f.z, r: o.slam.r, fx: 'slam' }); }
        }
        return S.t < o.dur;
      };
      live.push(S);
    },
    swap(c, o) {
      const f = c.f, t = c.target;
      if (!t) return;
      const W = { t: 0 };
      api.fx && api.fx.spawn('swapThread', { H: c.H, f, target: t, dur: o.delay + 0.2 });
      f.heroLockT = Math.max(f.heroLockT || 0, o.delay);
      W.update = (dt) => {
        W.t += dt; if (W.t < o.delay) return true;
        if (t.alive && f.alive) {
          const fx = f.x, fz = f.z;
          if (!isBoss(t)) { f.x = t.x; f.z = t.z; move(t, fx, fz); }
          hurt(c, t, 0.6, { knock: 0, stun: o.stun, vuln: o.vuln, vulnDur: o.stun, kind: 'toad' });
          ev({ t: 'heroBlast', hid: c.H.id, x: t.x, z: t.z, r: 1.5, fx: o.fx || 'toad' }); ev({ t: 'heroBlast', hid: c.H.id, x: f.x, z: f.z, r: 1.2, fx: 'poof' });
        }
        return false;
      };
      live.push(W);
    },
    mark(c, o) {
      const f = c.f, t = c.target || pickTarget(c, o.range);
      if (!t) return;
      const M = { t: 0, tick: 0 };
      t.markT = o.dur; t.markCol = c.H.ammo.glow; marked.add(t);
      api.fx && api.fx.spawn(o.fx || 'shears', { H: c.H, f, target: t, dur: o.dur + 0.4 });
      M.update = (dt) => {
        M.t += dt; M.tick -= dt;
        if (!t.alive) return false;
        if (M.tick <= 0) { M.tick = 0.5; hurt(c, t, o.dps * 0.5, { slow: o.slow }); }
        if (M.t < o.dur) return true;
        t.markT = 0;
        if (!isBoss(t) && t.hp < t.maxHp * o.execute) { dealDamage(t, t.hp + 1, f.id, { proc: true, pk: 'hero' }); ev({ t: 'heroExecute', hid: c.H.id, x: t.x, z: t.z }); }
        else hurt(c, t, o.cut, { knock: 2 });
        ev({ t: 'heroBlast', hid: c.H.id, x: t.x, z: t.z, r: 1.6, fx: 'snip', big: true });
        return false;
      };
      live.push(M);
    },
    pin(c, o) {
      const t = c.target || pickTarget(c, o.range);
      if (!t) return;
      status(t, { stun: o.dur, kind: 'pinned' }, c.H.ammo.glow);
      api.fx && api.fx.spawn(o.fx || 'skySlab', { H: c.H, f: c.f, target: t, dur: o.dur });
      const P = { t: 0, tick: 0 };
      P.update = (dt) => {
        P.t += dt; P.tick -= dt; if (!t.alive) return false;
        if (P.tick <= 0) { P.tick = 0.5; hurt(c, t, o.dps * 0.5, { knock: 0 }); }
        return P.t < o.dur;
      };
      live.push(P);
    },
    banish(c, o) {
      const p = where(c, o.where), list = foes(c, p.x, p.z, o.r);
      for (const t of list) {
        if (isBoss(t)) { status(t, { stun: 1 }, c.H.ammo.glow); continue; }
        t.lostT = o.dur; t.stunT = Math.max(t.stunT || 0, o.dur); t.stunKind = 'lost'; t.invulnT = Math.max(t.invulnT || 0, o.dur); t.lostX = t.x; t.lostZ = t.z; marked.add(t);
        ev({ t: 'heroBlast', hid: c.H.id, x: t.x, z: t.z, r: 1, fx: 'vanish' });
      }
      const B = { t: 0 };
      B.update = (dt) => {
        B.t += dt; if (B.t < o.dur) return true;
        for (const t of list) if (t.lostT !== undefined && !isBoss(t)) { t.lostT = 0; t.invulnT = 0; if (t.alive) { hurt(c, t, o.dmgReturn, { knock: 0, stun: 0.5 }); ev({ t: 'heroBlast', hid: c.H.id, x: t.x, z: t.z, r: 1.2, fx: 'return' }); } }
        return false;
      };
      live.push(B);
    },
    random(c, o) {
      const i = Math.floor(Math.random() * o.choices.length), ch = o.choices[i];
      ev({ t: 'heroRoll', hid: c.H.id, x: c.tx, z: c.tz, label: ch.label, face: i + 1, show: o.show || 'word', isPlayer: !!c.f.isPlayer });
      for (const sub of ch.ops) exec(c, sub);
    },
  };
  function exec(c, op) { const fn = OPS[op.op]; if (fn) fn(c, op); }

  function addZone(c, o, p) {
    const Z = { c, o, x: p.x, z: p.z, t: 0, tick: 0, whirl: o.whirl ? o.whirl.every : 0, guardFrom: o.guardAfter || 0 };
    if (o.where === 'lane') { Z.lane = { x: c.f.x, z: c.f.z, a: c.a, len: o.len, w: o.width }; }
    const inside = (t) => {
      if (Z.lane) { const dx = t.x - Z.lane.x, dz = t.z - Z.lane.z, s = Math.sin(Z.lane.a), co = Math.cos(Z.lane.a), al = dx * s + dz * co, si = dx * co - dz * s; return al >= 0 && al <= Z.lane.len && Math.abs(si) <= Z.lane.w / 2; }
      return Math.hypot(t.x - Z.x, t.z - Z.z) <= o.r + (t.r || 0.5) * 0.5;
    };
    Z.inside = inside;
    if (!o.quiet || o.fx) api.fx && api.fx.spawn(o.fx || 'zone', { H: c.H, x: Z.x, z: Z.z, r: o.r, lane: Z.lane, dur: o.dur, color: o.color || c.H.ammo.glow, follow: Z });
    Z.update = (dt) => {
      Z.t += dt; Z.tick -= dt;
      if (o.pull) forEachTarget((t) => { if (t.alive && t.team !== c.f.team && !isBoss(t) && !(t.lostT > 0) && inside(t)) { const d = Math.hypot(Z.x - t.x, Z.z - t.z); if (d > 0.6) move(t, t.x + (Z.x - t.x) / d * o.pull * dt, t.z + (Z.z - t.z) / d * o.pull * dt); } });
      if (Z.tick <= 0) {
        const k = o.tick || 0.5; Z.tick = k;
        let drained = 0;
        forEachTarget((t) => {
          if (!t.alive || !inside(t)) return;
          if (t.team !== c.f.team) {
            if (t.lostT > 0) return;
            if (o.dmg) drained += hurt(c, t, o.dmg * k, { fromX: Z.x, fromZ: Z.z, burn: o.burn });
            if (o.slow) t.slowT = Math.max(t.slowT || 0, k + 0.25 + (o.slow > 0.9 ? 0.4 : 0));
          } else if (t.kind === 'fighter') {
            if (o.heal) heal(t, c.BA * o.heal * k);
            if (o.allyArmor) { t.heroArmorT = Math.max(t.heroArmorT || 0, k + 0.3); t.heroArmor = o.allyArmor; marked.add(t); }
            if (o.allySpeed) t.swiftT = Math.max(t.swiftT || 0, k + 0.3);
            if (o.guard || (Z.guardFrom && Z.t >= Z.guardFrom)) { t.guardT = Math.max(t.guardT || 0, k + 0.3); marked.add(t); }
          }
        });
        if (o.selfRegen && c.f.alive) heal(c.f, c.f.maxHp * o.selfRegen * k);
        if (o.drain && drained) heal(c.f, drained * o.drain);
        if (o.pulse) ev({ t: 'heroBlast', hid: c.H.id, x: Z.x, z: Z.z, r: o.r, fx: 'pulse' });
      }
      if (o.whirl) {
        Z.whirl -= dt;
        if (Z.whirl <= 0) {
          Z.whirl = o.whirl.every; let low = null;
          forEachTarget((t) => { if (t.alive && t.team !== c.f.team && !(t.lostT > 0) && inside(t) && (!low || t.hp / t.maxHp < low.hp / low.maxHp)) low = t; });
          if (low) {
            const W = o.whirl;
            for (const t of foes(c, low.x, low.z, W.r)) { hurt(c, t, W.dmg, { knock: 0 }); if (!isBoss(t) && t !== low) { const d = Math.hypot(low.x - t.x, low.z - t.z) || 1; move(t, t.x + (low.x - t.x) / d * Math.min(W.pull, d), t.z + (low.z - t.z) / d * Math.min(W.pull, d)); } }
            ev({ t: 'heroBlast', hid: c.H.id, x: low.x, z: low.z, r: W.r, fx: 'whirl' });
          }
        }
      }
      return Z.t < o.dur;
    };
    live.push(Z);
    return Z;
  }

  // ---------------------------------------------------------------- basic-attack extras
  const FACES = [0.2, 0.6, 0.8, 1.0, 1.2, 2.0];
  function decorateBullet(p, w, f) {
    if (!p) return;
    p.hx = w.hero; p.hf = w; p.knock = w.knock || 1.5; p.stun = w.stun || 0;
    if (w.dice) { const face = 1 + Math.floor(Math.random() * 6); p.hv = face; p.dmg *= FACES[face - 1]; }
    else if (HERO_V6[w.hero] && HERO_V6[w.hero].ammo.shape === 'lost') p.hv = Math.floor(Math.random() * 4);
    if (w.vamp) p.vamp = (p.vamp || 0) + w.vamp;
  }
  function onBulletHit(p, t, amt) {
    const w = p.hf; if (!w) return;
    const o = G.ents.get(p.owner);
    if (w.allyHeal && o) {
      let best = null; forEachTarget((a) => { if (a.alive && a.team === p.team && a.kind === 'fighter' && a.hp < a.maxHp && Math.hypot(a.x - t.x, a.z - t.z) < 9 && (!best || a.hp / a.maxHp < best.hp / best.maxHp)) best = a; });
      if (best) { heal(best, amt * w.allyHeal); best.swiftT = Math.max(best.swiftT || 0, 1.5); ev({ t: 'heroLink', hid: p.hx, x0: t.x, z0: t.z, x1: best.x, z1: best.z }); }
    }
  }
  function onBulletEnd(p, explode) {
    const w = p.hf; if (!w || !explode) return;
    if (w.healSplash && p.aoe) { const c = { f: { team: p.team, x: p.x, z: p.z, alive: false } }; for (const a of allies(c, p.x, p.z, p.aoe)) heal(a, p.dmg * w.healSplash); }
    if (w.puddle) { const owner = G.ents.get(p.owner); if (owner) addZone({ c: null, f: owner, H: HERO_V6[p.hx], BA: 0, a: 0 }, { r: w.puddle.r, dur: w.puddle.dur, slow: w.puddle.slow, tick: 0.5, fx: 'puddle', color: HERO_V6[p.hx].ammo.glow }, { x: p.x, z: p.z }); }
  }
  function lunge(f, w, dx, dz) {
    if (!w.lunge || f.heroLockT > 0) return;
    const L = { t: 0, d: 0 };
    L.update = (dt) => { const s = Math.min(w.lunge - L.d, 18 * dt); L.d += s; f.x += dx * s; f.z += dz * s; if (api.collide) api.collide(f); return L.d < w.lunge - 1e-3; };
    live.push(L);
  }

  // ---------------------------------------------------------------- damage hook + statuses
  // called from dealDamage after armour: returns the final amount (shield, vulnerability, buffs, guard)
  function modDamage(src, t, amt, o) {
    if (src && src.dmgBuffT > 0) amt *= 1 + (src.dmgBuff || 0);
    if (src && src.weakT > 0) amt *= 1 - (src.weak || 0);
    if (t.vulnT > 0) amt *= 1 + (t.vuln || 0);
    if (t.heroArmorT > 0) amt *= 1 - Math.min(0.6, t.heroArmor || 0);
    if (t.stunKind === 'sleep' && t.stunT > 0 && !o.proc) { t.stunT = Math.min(t.stunT, 0.05); }
    if (t.shieldHp > 0 && t.shieldT > 0) {
      const a = Math.min(t.shieldHp, amt); t.shieldHp -= a; amt -= a;
      if (t.shieldHp <= 0.5) { t.shieldHp = 0; ev({ t: 'heroShieldBreak', x: t.x, z: t.z, col: t.shieldCol || 0xffffff }); if (t.shieldRetal && src && src.alive && src.team !== t.team) { const r = t.shieldRetal; t.shieldRetal = 0; dealDamage(src, r, t.id, { proc: true, slow: 1, pk: 'hero' }); ev({ t: 'heroLink', x0: t.x, z0: t.z, x1: src.x, z1: src.z, col: t.shieldCol }); } }
    }
    if (o.stun) status(t, { stun: o.stun }, o.pc);
    amt = Math.max(0, amt);
    if (t.guardT > 0 && t.hp - amt < 1) { amt = Math.max(0, t.hp - 1); if (!(t.guardFxT > 0)) { t.guardFxT = 0.6; ev({ t: 'heroGuard', x: t.x, z: t.z }); } }
    return amt;
  }
  // ticks an entity's hero statuses; returns true while it may not act (stunned, banished, locked in a cast)
  function tickStatus(e, dt) {
    if (e.stunT > 0) e.stunT -= dt;
    if (e.heroLockT > 0) e.heroLockT -= dt;
    if (e.vulnT > 0) e.vulnT -= dt;
    if (e.weakT > 0) e.weakT -= dt;
    if (e.heroArmorT > 0) e.heroArmorT -= dt;
    if (e.dmgBuffT > 0) e.dmgBuffT -= dt;
    if (e.guardT > 0) e.guardT -= dt;
    if (e.guardFxT > 0) e.guardFxT -= dt;
    if (e.markT > 0) e.markT -= dt;
    if (e.shieldT > 0) { e.shieldT -= dt; if (e.shieldT <= 0) e.shieldHp = 0; }
    if (e.lostT > 0) { e.lostT -= dt; if (e.lostT <= 0) e.lostT = 0; }
    return e.stunT > 0 || e.heroLockT > 0 || e.lostT > 0;
  }

  function step(dt) {
    for (let i = acts.length - 1; i >= 0; i--) if (!run(acts[i], dt)) acts.splice(i, 1);
    for (let i = live.length - 1; i >= 0; i--) { let keep = false; try { keep = live[i].update(dt); } catch (e) { console.warn('hero super step failed', e); } if (!keep) live.splice(i, 1); }
    for (const e of marked) if (!e.alive || !(e.stunT > 0 || e.vulnT > 0 || e.weakT > 0 || e.heroArmorT > 0 || e.dmgBuffT > 0 || e.guardT > 0 || e.shieldHp > 0 || e.markT > 0 || e.lostT > 0)) marked.delete(e);
  }
  function clear() { acts.length = 0; live.length = 0; for (const e of marked) { e.stunT = e.lostT = e.heroLockT = e.markT = 0; e.heroAirY = 0; } marked.clear(); }
  return { cast, step, clear, modDamage, tickStatus, decorateBullet, onBulletHit, onBulletEnd, lunge, marked, live, acts, addZone };
}
function smooth(k) { return k * k * (3 - 2 * k); }
