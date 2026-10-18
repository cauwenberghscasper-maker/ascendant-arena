// ---------------------------------------------------------------------
// Dungeon bosses fight with a kit that grows each phase (Casper, 18 Oct: intense, three phases, every phase more
// attacks and patterns). Phase 1: Volley and Ground Slam. Phase 2 adds Nova Ring and Charge. Phase 3 adds Death Spiral
// and Falling Stones, and every attack comes faster. Mini-bosses use the phase 1 kit.
// The game that runs the boss (its shared-monster owner) picks each attack and sends it ('dbs'); every game in the
// run plays the same cast from the same numbers, and each one deals the damage to its own heroes (you and your bots).
// ---------------------------------------------------------------------
CFG.delve.bossKit = {
  unlock: [['volley', 'slam'], ['ring', 'charge'], ['spiral', 'meteors']],
  cd: [2.8, 2.1, 1.4], miniCd: 3.4, first: 1.6,
  names: { volley: 'Volley', slam: 'Ground Slam', ring: 'Nova Ring', charge: 'Charge', spiral: 'Death Spiral', meteors: 'Falling Stones' },
  // damage per hit, times the boss's own hit
  dmg: { volley: 0.7, slam: 1.5, ring: 0.6, charge: 1.8, spiral: 0.4, meteors: 1.3 },
  shot: 13, slamR: 3.4, slamT: 1.1, charge: { len: 15, warn: 0.9, speed: 22, r: 2.3 }, spiral: { time: 3, every: 0.12, arms: 3, turn: 2.4 },
  meteors: { n: 9, r: 3, warn: 1.3, spread: 20 }, ring: { n: 18, gap: 0.5 },
};
const BK = CFG.delve.bossKit, BOSS_KINDS = Object.keys(BK.dmg);
const delveBossPhase = (e) => (e.mini ? 0 : clamp(G.dungeon.phase | 0, 0, 2));
// the attacks open to this boss right now, in the order it cycles through them
function delveBossPool(e) { const out = []; for (let p = 0; p <= delveBossPhase(e); p++) out.push(...BK.unlock[p]); return out; }
// called from stepEnemy for a party-dungeon boss this game runs; true while it is busy casting (it stands or charges)
function delveBossTick(e, dt, tgt) {
  const k = e.bk || (e.bk = { cd: BK.first, i: 0, busy: 0, dash: null });
  k.cd -= dt; // the next attack's timer runs during a cast too, so phase 3 chains them
  if (k.dash) { // charging along its warned line
    const d = k.dash, dx = d.x - e.x, dz = d.z - e.z, dd = Math.hypot(dx, dz), step = BK.charge.speed * dt;
    if ((d.wait -= dt) > 0) return true;
    if (dd <= step) { e.x = d.x; e.z = d.z; k.dash = null; } else { e.x += dx / dd * step; e.z += dz / dd * step; }
    e.facing = Math.atan2(dx, dz); e.moveAmt = 1; return true;
  }
  if (k.busy > 0) { k.busy -= dt; e.moveAmt = Math.max(0, (e.moveAmt || 0) - dt * 4); return true; }
  if (k.cd > 0 || !tgt || tgt.alive === false) return false;
  const pool = delveBossPool(e), kind = pool[k.i++ % pool.length], ph = delveBossPhase(e);
  k.cd = e.mini ? BK.miniCd : BK.cd[ph];
  const heroes = delveParty().filter((f) => f.alive !== false && Math.hypot(f.x - e.x, f.z - e.z) < 40).slice(0, 4);
  const c = { k: kind, x: Math.round(e.x * 10) / 10, z: Math.round(e.z * 10) / 10, tx: Math.round(tgt.x * 10) / 10, tz: Math.round(tgt.z * 10) / 10,
    p: heroes.map((f) => [Math.round(f.x * 10) / 10, Math.round(f.z * 10) / 10]), s: (Math.random() * 1e9) >>> 0, mini: e.mini ? 1 : 0 };
  delveBossCast(c);
  if (typeof partySend === 'function') partySend('dbs', Object.assign({ dr: G.dungeon.delve.seed }, c));
  return true;
}
// play one cast in this game: warnings, bolts and the damage to the heroes this game runs
function delveBossCast(c) {
  const D = G.dungeon, X = D && D.delve; if (!X) return;
  const e = c.mini ? D.rooms.flatMap((m) => m.mobs).find((o) => o.mini && o.alive) : D.boss; if (!e || !e.alive) return;
  const pal = areaFx(D.zone), col = BIOMES[X.def.biome].coreColor, dmg = (k) => mobDmg(e, BK.dmg[k]);
  const shot = (x, z, a, k, sp = BK.shot) => spawnProjectile({ x, z, vx: Math.sin(a) * sp, vz: Math.cos(a) * sp, life: 34 / sp, r: 0.55, dmg: dmg(k), team: 'mob', owner: e.id, kind: 'orb', color: col, y: 1.4 });
  const ring = (x, z, r, t, k) => G.pendingAoE.push({ x, z, r, t, max: t, dmg: dmg(k), team: 'mob', owner: e.id, kind: 'slam', pal });
  const later = (t, fn) => X.emit.push({ t, fn });
  const a0 = Math.atan2(c.tx - c.x, c.tz - c.z);
  e.facing = a0; e.attackAnim = 1;
  if (e.bk) e.bk.busy = 0.5;
  switch (c.k) {
    case 'volley': for (let i = 0; i < 5; i++) shot(c.x, c.z, a0 + (i / 4 - 0.5) * 0.6, 'volley'); break;
    case 'slam': for (const [x, z] of c.p) ring(x, z, BK.slamR, BK.slamT, 'slam'); if (e.bk) e.bk.busy = BK.slamT; break;
    case 'ring': for (let w = 0; w < 2; w++) later(w * BK.ring.gap, () => { for (let i = 0; i < BK.ring.n; i++) shot(e.x, e.z, (i + w * 0.5) / BK.ring.n * Math.PI * 2, 'ring', 10); }); break;
    case 'charge': {
      const C = BK.charge, ex = c.x + Math.sin(a0) * C.len, ez = c.z + Math.cos(a0) * C.len;
      for (let d = 0; d <= C.len; d += 2.5) ring(c.x + Math.sin(a0) * d, c.z + Math.cos(a0) * d, C.r, C.warn + d / C.speed, 'charge');
      ev({ t: 'telegraph', x: c.x, z: c.z, a: a0, len: C.len, w: C.r * 2 });
      if (e.bk && !e.own) { const f = { x: ex, z: ez }; dungeonClamp(f, e.r); e.bk.dash = { x: f.x, z: f.z, wait: C.warn }; }
      break;
    }
    case 'spiral': { const S = BK.spiral; for (let t = 0; t < S.time; t += S.every) later(t, () => { for (let i = 0; i < S.arms; i++) shot(e.x, e.z, a0 + t * S.turn + i / S.arms * Math.PI * 2, 'spiral', 9); }); if (e.bk) e.bk.busy = S.time; break; }
    case 'meteors': {
      const M = BK.meteors, rng = mulberry32(c.s), bm = D.rooms.find((m) => inRoom(m, c.x, c.z)) || D.rooms.at(-1);
      for (let i = 0; i < M.n; i++) {
        const x = clamp(c.x + (rng() * 2 - 1) * M.spread, bm.x0 + 2, bm.x1 - 2), z = clamp(c.z + (rng() * 2 - 1) * M.spread, bm.z0 + 2, bm.z1 - 2);
        later(rng() * 0.8, () => ring(x, z, M.r, M.warn, 'meteors'));
      }
      // one always lands on the target, so standing still is never safe
      later(0.4, () => ring(c.tx, c.tz, M.r, M.warn, 'meteors'));
      break;
    }
  }
  ev({ t: 'delveBossCast', k: c.k, x: c.x, z: c.z });
}
// a cast from the game that runs the boss
function delveBossRecv(P) {
  if (!delveOn() || mpNum(P.dr, -1) >>> 0 !== G.dungeon.delve.seed || !BOSS_KINDS.includes(P.k)) return;
  const n = (v) => clamp(mpNum(v, 0), -1e5, 1e5);
  delveBossCast({ k: P.k, x: n(P.x), z: n(P.z), tx: n(P.tx), tz: n(P.tz), p: (Array.isArray(P.p) ? P.p : []).slice(0, 4).map((q) => [n(q && q[0]), n(q && q[1])]), s: mpNum(P.s, 1) >>> 0, mini: P.mini ? 1 : 0 });
}
// delayed parts of casts (ring waves, the spiral, staggered stones)
function stepDelveEmit(dt) {
  const X = G.dungeon.delve; if (!X.emit) X.emit = [];
  for (let i = X.emit.length - 1; i >= 0; i--) { const q = X.emit[i]; if ((q.t -= dt) <= 0) { X.emit.splice(i, 1); q.fn(); } }
}
// --- end delve boss
