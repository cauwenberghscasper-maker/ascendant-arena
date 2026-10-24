// ---------------------------------------------------------------------
// WORLD BOSS KITS: every biome boss has its own attacks, three phases and two or three TEAM mechanics.
//  - phase 1 (above 66% HP): its signature attacks; phase 2 (66-33%): more attacks plus its first mechanic every ~26 s;
//    phase 3 (below 33%): everything, faster, the mechanics cycle every ~21 s.
//  - mechanics: WARDS (the boss is armoured until every ward plate is held at once), SOAK (a burst that must be shared:
//    stand in the gold ring together), SPREAD (everyone carries a ring: stay apart). They scale with the party in the
//    area: alone you hold one ward, soak one burst and get no spread, in a group the same mechanics need every player.
// The lobby leader picks each attack and sends it ('batk'); every game runs it against its own hero with the same numbers.
// Mechanics read the positions of the other players (presence, ~4 Hz) to decide who stands where.
// ---------------------------------------------------------------------
const BOSS_KITS = [
  { id: 'golem', title: 'Elder of the Old Road', pal: 'venom', col: 0x7bd35a,
    atk: [{ m: 'lanes', nm: 'Strangling Roots', offs: [-0.6, 0, 0.6], n: 6, gap: 2.2, r: 1.25, dm: 1.1, ph: 1 }, { m: 'rocks', nm: 'Boulder Burst', ph: 1 }, { m: 'rain', nm: 'Seedfall', n: 7, spread: 8, r: 2.1, dm: 0.9, ph: 1 },
      { m: 'sweep', nm: 'Verdant Scythe', n: 5, rot: 0.6, half: 0.42, r: 11, dm: 1.2, ph: 2 }, { m: 'ripple', nm: 'Rootquake', n: 3, gap: 3.4, w: 2, dm: 1.2, ph: 3 }],
    mech: [{ m: 'plates', nm: 'Heartwood Wards', say: 'HOLD THE MOSS WARDS' }, { m: 'soak', nm: 'Bloom Burst', say: 'STACK IN THE BLOOM' }] },
  { id: 'frost', title: 'Glacial Sovereign', pal: 'frost', col: 0x9fe8ff,
    atk: [{ m: 'fan', nm: 'Icicle Volley', n: 9, spread: 1.5, speed: 14, dm: 0.7, ph: 1 }, { m: 'sweep', nm: 'Blizzard Scythe', n: 5, rot: 0.65, half: 0.45, r: 12, dm: 1.2, ph: 1 }, { m: 'slam', nm: 'Glacier Fall', ph: 1 },
      { m: 'ripple', nm: 'Rime Rings', n: 4, gap: 3, w: 1.8, dm: 1.2, ph: 2 }, { m: 'rain', nm: 'Avalanche', n: 8, spread: 9, r: 2.3, dm: 1, ph: 3 }],
    mech: [{ m: 'spread', nm: 'Rime Marks', say: 'SPREAD OUT: FROST MARKS' }, { m: 'soak', nm: 'Deep Freeze', say: 'STACK IN THE COLD LIGHT' }] },
  { id: 'magma', title: 'Cinder Tyrant', pal: 'fire', col: 0xff7a2e,
    atk: [{ m: 'lanes', nm: 'Lava Cross', offs: [0, Math.PI / 2, Math.PI, -Math.PI / 2], n: 5, gap: 2.4, r: 1.3, dm: 1.2, ph: 1 }, { m: 'ripple', nm: 'Magma Waves', n: 4, gap: 2.8, w: 1.6, dm: 1.2, ph: 1 },
      { m: 'rain', nm: 'Eruption', n: 9, spread: 10, r: 2.4, dm: 1, ph: 2 }, { m: 'slam', nm: 'Molten Slam', ph: 1 }, { m: 'rocks', nm: 'Slag Spray', ph: 3 }],
    mech: [{ m: 'plates', nm: 'Quench the Core', say: 'STAND ON THE COOLING WARDS' }, { m: 'soak', nm: 'Meteor Impact', say: 'STACK TO SOAK THE METEOR' }] },
  { id: 'void', title: 'Hollow of the Ruins', pal: 'arcane', col: 0xc77dff,
    atk: [{ m: 'wells', nm: 'Gravity Wells', n: 2, dm: 1.4, ph: 1 }, { m: 'beams', nm: 'Rift Beams', arms: 3, steps: 4, spin: 0.5, dm: 1.4, ph: 1 }, { m: 'fan', nm: 'Void Shards', n: 7, spread: 1.2, speed: 13, dm: 0.7, ph: 2 },
      { m: 'rain', nm: 'Collapse', n: 8, spread: 9, r: 2.2, dm: 1, ph: 2 }, { m: 'sweep', nm: 'Event Horizon', n: 6, rot: 0.55, half: 0.4, r: 12, dm: 1.2, ph: 3 }],
    mech: [{ m: 'spread', nm: 'Echo Marks', say: 'SPREAD OUT: ECHO MARKS' }, { m: 'plates', nm: 'Anchor the Rift', say: 'HOLD THE RIFT ANCHORS' }] },
  { id: 'abyss', title: 'Drowned King', pal: 'storm', col: 0x3fc8ff,
    atk: [{ m: 'ripple', nm: 'Tidal Surge', n: 4, gap: 3.2, w: 2.2, dm: 1.2, ph: 1 }, { m: 'wells', nm: 'Maelstrom', n: 1, dm: 1.5, ph: 1 }, { m: 'fan', nm: 'Jet Stream', n: 7, spread: 1.3, speed: 15, dm: 0.7, ph: 1 },
      { m: 'sweep', nm: 'Tail Sweep', n: 5, rot: 0.6, half: 0.42, r: 13, dm: 1.2, ph: 2 }, { m: 'rain', nm: 'Depth Charge', n: 8, spread: 10, r: 2.3, dm: 1, ph: 3 }],
    mech: [{ m: 'soak', nm: 'Pressure Dome', say: 'STACK UNDER THE DOME' }, { m: 'plates', nm: 'Pearl Shields', say: 'HOLD THE PEARL WARDS' }] },
  { id: 'celestial', title: 'Arbiter of the Spire', pal: 'gold', col: 0xffe27a,
    atk: [{ m: 'beams', nm: 'Radiant Beams', arms: 4, steps: 4, spin: 0.4, dm: 1.4, ph: 1 }, { m: 'ripple', nm: 'Halo Rings', n: 3, gap: 2.6, w: 1.6, dm: 1.2, ph: 1 }, { m: 'rain', nm: 'Starfall', n: 10, spread: 11, r: 2.3, dm: 1, ph: 2 },
      { m: 'lanes', nm: 'Judgement', offs: [0, Math.PI / 2, Math.PI, -Math.PI / 2], n: 6, gap: 2.4, r: 1.3, dm: 1.2, ph: 2 }, { m: 'fan', nm: 'Sunburst', n: 11, spread: 2.2, speed: 14, dm: 0.7, ph: 3 }],
    mech: [{ m: 'plates', nm: 'Trial of Three', say: 'HOLD ALL THREE WARDS' }, { m: 'spread', nm: 'Searing Marks', say: 'SPREAD OUT: SEARING MARKS' }, { m: 'soak', nm: 'Dawnfall', say: 'STACK TO SHARE THE DAWN' }] },
];
const BOSS_TEAM = { ward: { dr: 0.04, vuln: 1.4, vulnT: 8, r: 3, dur: 22, radius: 9.5, backlash: 1.8 }, soak: { t: 3.4, out: 0.8, dist: 11 }, spread: { t: 3.2, r: 5.5, dm: 1.6 }, phases: [0.66, 0.33], mechEvery: [26, 21], atkSpeed: [1, 0.9, 0.75] };
const bossKit = (b) => BOSS_KITS[areaBiome(b.zone)] || BOSS_KITS[0];
const bossBase = () => CFG.boss.slamDelay + 0.1;
// everyone fighting here: you and the lobby players near (x, z)
function bossPartyPts(x, z, range) {
  const pts = [], pl = G.player;
  if (pl && pl.alive) pts.push({ x: pl.x, z: pl.z, me: true });
  if (typeof MP !== 'undefined' && MP.list) for (const e of MP.list) if (e.via === 'rt' && e.md === 'hub' && e.alive && Math.hypot(e.x - x, e.z - z) < (range || 60)) pts.push({ x: e.x, z: e.z });
  return pts;
}
const bossPartySize = (b) => Math.max(1, bossPartyPts(b.x, b.z, 60).length);
// damage the boss takes: armoured while its wards stand, exposed after you break them
function bossDamageMod(b) { const W = BOSS_TEAM.ward; return b.ward ? W.dr : b.vuln > 0 ? W.vuln : 1; }
function bossLater(t, fn) { (G.bossLater || (G.bossLater = [])).push({ t, fn }); }
function bossKitClear() { G.bossLater = []; G.bossMech = null; }
const bossMarkersOk = (n, cone) => markersFree(n, cone);
// ---- executors: run on every game with the same payload ------------------------------------------------------------
const BOSS_EXEC = {
  lane(b, o) { // spike lines erupting outward, rippling one after another
    const grp = [], base = bossBase();
    for (const A of o.A) for (let i = 0; i < o.n; i++) { const d = b.r + 1.4 + i * o.gap, t = base + i * 0.1; G.pendingAoE.push({ x: o.bx + Math.sin(A) * d, z: o.bz + Math.cos(A) * d, r: o.r, t, max: t, dmg: b.atk * o.dm, team: 'mob', owner: b.id, kind: 'spike', grp, pal: o.pal, col: o.col }); }
  },
  sweep(b, o) { // a scythe of cones swinging round the boss
    const grp = [], base = bossBase();
    for (let i = 0; i < o.n; i++) { const a = o.A0 + o.dir * (i - (o.n - 1) / 2) * o.rot, t = base + i * 0.22; G.pendingAoE.push({ x: o.bx, z: o.bz, r: o.r, t, max: t, dmg: b.atk * o.dm, team: 'mob', owner: b.id, kind: 'sweep', cone: { a, half: o.half }, grp, pal: o.pal, col: o.col }); }
  },
  beams(b, o) { // thin lanes from the boss that rotate step by step, like the hands of a clock
    const base = bossBase() + 0.3;
    for (let s = 0; s < o.steps; s++) { const grp = []; for (let j = 0; j < o.arms; j++) { const a = o.A0 + o.spin * s + j * Math.PI * 2 / o.arms, t = base + s * 0.55; G.pendingAoE.push({ x: o.bx, z: o.bz, r: o.r, t, max: t, dmg: b.atk * o.dm, team: 'mob', owner: b.id, kind: 'beam', cone: { a, half: o.half }, grp, pal: o.pal, col: o.col }); } }
  },
  ripple(b, o) { // shock rings travelling outward: the gaps between them are safe
    const base = bossBase();
    for (let i = 0; i < o.n; i++) { const inner = b.r + 1.5 + i * o.gap; G.pendingAoE.push({ x: o.bx, z: o.bz, r: inner + o.w, t: base + i * 0.5, max: base + i * 0.5, dmg: b.atk * o.dm, team: 'mob', owner: b.id, kind: 'ripple', inner, pal: o.pal, col: o.col }); }
  },
  rain(b, o) { // shells falling around the hero, first one on them
    const base = bossBase() * 0.8;
    o.pts.forEach(([x, z], i) => { const t = base + i * 0.14; G.pendingAoE.push({ x, z, r: o.r, t, max: t, dmg: b.atk * o.dm, team: 'mob', owner: b.id, kind: 'meteor', pal: o.pal, col: o.col }); });
  },
  fan(b, o) { // a wide volley of bolts, drawn first as a cone
    G.pendingAoE.push({ x: o.bx, z: o.bz, r: o.len, t: bossBase(), max: bossBase(), dmg: 0, team: 'mob', owner: b.id, kind: 'fan', cone: { a: o.A, half: o.spread / 2 }, quiet: true, pal: o.pal, col: o.col });
    bossLater(bossBase(), () => { for (let i = 0; i < o.n; i++) { const a = o.A + (i / (o.n - 1) - 0.5) * o.spread; spawnProjectile({ x: o.bx, z: o.bz, vx: Math.sin(a) * o.speed, vz: Math.cos(a) * o.speed, life: o.len / o.speed, r: 0.55, dmg: b.atk * o.dm, team: 'mob', owner: b.id, kind: 'orb', color: o.col, y: 1.6 }); } ev({ t: 'shoot', kind: 'enemy', x: o.bx, z: o.bz }); });
  },
  wells(b, o) { // gravity wells that drag you to the eye, then erupt
    for (const [x, z] of o.pts) { G.clouds.push({ x, z, r: 6, t: 1.6, max: 1.6, tick: 0, dmg: 0, pull: 2.4, color: o.col, team: 'mob', owner: b.id }); G.pendingAoE.push({ x, z, r: 2.6, t: 2.2, max: 2.2, dmg: b.atk * o.dm, team: 'mob', owner: b.id, kind: 'vortex', pal: o.pal, col: o.col }); }
  },
  // ---- team mechanics ----
  soak(b, o) { // a burst that must be shared: damage is split between everyone standing in the ring
    G.pendingAoE.push({ x: o.x, z: o.z, r: o.r, t: o.t, max: o.t, dmg: 0, team: 'mob', owner: b.id, kind: 'soak', soak: { total: b.atk * o.dm * o.n, n: o.n, out: BOSS_TEAM.soak.out }, col: 0xffd34a, pal: o.pal });
    b.mechBusy = o.t + 0.6;
  },
  spread(b, o) { // every hero carries a ring that follows them; anyone inside another's ring is hit when it lands
    const pl = G.player; if (!pl || !pl.alive) return;
    G.pendingAoE.push({ x: pl.x, z: pl.z, r: o.r, t: o.t, max: o.t, dmg: 0, team: 'mob', owner: b.id, kind: 'spread', follow: true, spread: { dm: b.atk * o.dm }, col: o.col, pal: o.pal });
    G.bossMech = { kind: 'spread', t: o.t, r: o.r, col: o.col }; b.mechBusy = o.t + 0.6;
  },
  plates(b, o) { // the boss is armoured until every ward is held at once
    b.ward = { pl: o.pl, r: o.r, hold: o.hold, t: o.dur, dur: o.dur, prog: 0, need: o.pl.length, col: o.col, pal: o.pal, nm: o.nm };
  },
  wardEnd(b, o) {
    const w = b.ward; b.ward = null; if (!w) return;
    if (o.ok) { b.vuln = BOSS_TEAM.ward.vulnT; b.atkT = Math.max(b.atkT, 3); ev({ t: 'wardBreak', x: b.x, z: b.z, pal: o.pal, col: o.col }); }
    else { ev({ t: 'wardFail', x: b.x, z: b.z, pal: o.pal, col: o.col }); BOSS_EXEC.ripple(b, { bx: b.x, bz: b.z, n: 4, gap: 3.4, w: 2.2, dm: BOSS_TEAM.ward.backlash, pal: o.pal, col: o.col }); }
  },
};
// ---- planning (leader only) ----------------------------------------------------------------------------------------
function bossPlan(b, K, a, tgt) {
  const A = b.facing, base = { nm: a.nm, pal: K.pal, col: K.col, bx: b.x, bz: b.z };
  const rnd = (n, spread, cx, cz) => { const pts = []; for (let i = 0; i < n; i++) { const t = Math.random() * Math.PI * 2, d = i === 0 ? 0 : spread * Math.sqrt(Math.random()); pts.push([Math.round((cx + Math.sin(t) * d) * 10) / 10, Math.round((cz + Math.cos(t) * d) * 10) / 10]); } return pts; };
  switch (a.m) {
    case 'lanes': return Object.assign(base, { k: 'lane', A: a.offs.map((d) => Math.round((A + d) * 100) / 100), n: a.n, gap: a.gap, r: a.r, dm: a.dm });
    case 'sweep': return Object.assign(base, { k: 'sweep', A0: Math.round(A * 100) / 100, dir: Math.random() < 0.5 ? -1 : 1, n: a.n, rot: a.rot, half: a.half, r: a.r, dm: a.dm });
    case 'beams': return Object.assign(base, { k: 'beams', A0: Math.round((A + (Math.random() - 0.5) * 1.2) * 100) / 100, arms: a.arms, steps: a.steps, spin: a.spin * (Math.random() < 0.5 ? -1 : 1), half: 0.09, r: 24, dm: a.dm });
    case 'ripple': return Object.assign(base, { k: 'ripple', n: a.n, gap: a.gap, w: a.w, dm: a.dm });
    case 'rain': return Object.assign(base, { k: 'rain', pts: rnd(a.n, a.spread, tgt.x, tgt.z), r: a.r, dm: a.dm });
    case 'fan': return Object.assign(base, { k: 'fan', A: Math.round(A * 100) / 100, n: a.n, spread: a.spread, speed: a.speed, len: 22, dm: a.dm });
    case 'wells': return Object.assign(base, { k: 'wells', pts: rnd(a.n, 9, tgt.x, tgt.z), dm: a.dm });
    case 'rocks': return { k: 'rocks', off: Math.random() * Math.PI, bx: b.x, bz: b.z, nm: a.nm, pal: K.pal, col: K.col };
    case 'slam': return { k: 'slam', x: tgt.x, z: tgt.z, nm: a.nm, pal: K.pal, col: K.col };
  }
  return null;
}
const bossPlanCost = (o) => o.k === 'lane' ? o.A.length * o.n : o.k === 'sweep' ? o.n : o.k === 'beams' ? o.arms * o.steps : o.k === 'ripple' ? o.n : o.k === 'rain' ? o.pts.length : o.k === 'wells' ? o.pts.length * 1 : 1;
function bossPlanMech(b, K, m, tgt) {
  const n = bossPartySize(b), base = { nm: m.nm, pal: K.pal, col: K.col, say: m.say };
  if (m.m === 'plates') {
    const N = Math.min(3, n), a0 = Math.random() * Math.PI * 2, R = BOSS_TEAM.ward.radius, pl = [];
    for (let i = 0; i < N; i++) { const a = a0 + i * Math.PI * 2 / N; pl.push([Math.round((b.x + Math.sin(a) * R) * 10) / 10, Math.round((b.z + Math.cos(a) * R) * 10) / 10]); }
    return Object.assign(base, { k: 'plates', pl, r: BOSS_TEAM.ward.r, hold: N > 1 ? 2.4 : 3.2, dur: BOSS_TEAM.ward.dur });
  }
  if (m.m === 'soak') { const a = Math.atan2(tgt.x - b.x, tgt.z - b.z), d = BOSS_TEAM.soak.dist; return Object.assign(base, { k: 'soak', x: Math.round((b.x + Math.sin(a) * d) * 10) / 10, z: Math.round((b.z + Math.cos(a) * d) * 10) / 10, r: 4 + 0.5 * Math.min(n, 4), t: BOSS_TEAM.soak.t, n, dm: 1.5 }); }
  if (m.m === 'spread') { if (n < 2) return null; return Object.assign(base, { k: 'spread', r: BOSS_TEAM.spread.r, t: BOSS_TEAM.spread.t, dm: BOSS_TEAM.spread.dm }); } // alone there is nobody to spread from
  return null;
}
// the leader's attack pick: a due mechanic first, otherwise one of the phase's signature attacks (never the same twice running)
function bossKitThink(b, tgt) {
  const K = bossKit(b), ph = b.phase || 1;
  let o = null;
  if (ph >= 2 && b.mechT <= 0 && !b.ward && !(b.mechBusy > 0)) {
    const m = K.mech[ph === 2 ? 0 : (b.mechN = ((b.mechN || 0) + 1)) % K.mech.length], mo = bossPlanMech(b, K, m, tgt);
    b.mechT = BOSS_TEAM.mechEvery[ph === 2 ? 0 : 1];
    if (mo) { bossAttack(b, mo); return true; }
  }
  const pool = K.atk.filter((a) => a.ph <= ph && a.nm !== b.lastAtk);
  for (let tries = 0; tries < 4 && !o; tries++) { const a = pool[Math.floor(Math.random() * pool.length)]; if (!a) break; const p = bossPlan(b, K, a, tgt); if (p && bossMarkersOk(bossPlanCost(p), p.k === 'sweep' || p.k === 'beams' || p.k === 'fan')) { o = p; b.lastAtk = a.nm; } }
  if (!o) o = { k: 'slam', x: tgt.x, z: tgt.z, nm: 'Crush', pal: K.pal, col: K.col };
  bossAttack(b, o);
  return true;
}
// every game, every frame: phase changes, wards (the leader decides when they break), the delayed bolts
function bossKitTick(b, dt, leader) {
  if (b.animAge != null) b.animAge += dt;
  const K = bossKit(b), hp = b.maxHp > 0 ? b.hp / b.maxHp : 1, ph = hp > BOSS_TEAM.phases[0] ? 1 : hp > BOSS_TEAM.phases[1] ? 2 : 3;
  if (b.phase == null) { b.phase = 1; b.mechT = 16; }
  if (ph > b.phase) { b.phase = ph; b.mechT = Math.max(b.mechT || 0, 6); if (leader) b.atkT = Math.max(b.atkT, 2.6); ev({ t: 'bossPhase', x: b.x, z: b.z, n: ph, pal: K.pal, col: K.col, name: b.name }); }
  if (b.castT > 0) b.castT -= dt;
  if (b.mechBusy > 0) b.mechBusy -= dt; if (b.mechT > 0) b.mechT -= dt; if (b.vuln > 0) b.vuln -= dt;
  const L = G.bossLater; if (L && L.length) for (let i = L.length - 1; i >= 0; i--) { L[i].t -= dt; if (L[i].t <= 0) { const f = L[i].fn; L.splice(i, 1); f(); } }
  if (G.bossMech && (G.bossMech.t -= dt) <= 0) G.bossMech = null;
  const w = b.ward;
  if (w) {
    w.t -= dt; const pts = bossPartyPts(b.x, b.z, 80); let held = 0;
    for (const [px, pz] of w.pl) if (pts.some((p) => Math.hypot(p.x - px, p.z - pz) <= w.r + 0.6)) held++;
    w.held = held; w.prog = held >= w.pl.length ? Math.min(w.hold, w.prog + dt) : Math.max(0, w.prog - dt * 0.6);
    if (leader) { if (w.prog >= w.hold) bossAttack(b, { k: 'wardEnd', ok: 1, pal: K.pal, col: K.col, nm: 'Wards broken' }); else if (w.t <= 0) bossAttack(b, { k: 'wardEnd', ok: 0, pal: K.pal, col: K.col, nm: 'Wards failed' }); }
  }
}
// one cast on every game: the caption, the boss's pose, then the attack itself
function bossMotionCue(b, o) {
  const k = o.k;
  b.animAge = 0; b.animKind = k;
  b.animWindMax = k === 'rocks' || k === 'wardEnd' ? 0 : k === 'slam' || k === 'spike' ? CFG.boss.slamDelay : k === 'wells' || k === 'vortex' ? 2.2 : k === 'rain' ? bossBase() * .8 : k === 'beams' ? bossBase() + .3 : k === 'soak' || k === 'spread' ? o.t : k === 'plates' ? .8 : bossBase();
  b.animHits = k === 'sweep' || k === 'rain' || k === 'lane' || k === 'ripple' ? o.n || o.pts?.length || 1 : k === 'beams' ? o.steps : 1;
  b.animInterval = k === 'sweep' ? .22 : k === 'rain' ? .14 : k === 'lane' ? .1 : k === 'ripple' ? .5 : k === 'beams' ? .55 : 0;
}
function bossKitCast(b, o) {
  bossMotionCue(b, o);
  const dur = o.k === 'plates' || o.k === 'wardEnd' ? 1.2 : 1.6;
  b.castK = o.k; b.castT = b.castMax = dur; b.attackAnim = 1;
  if (o.k !== 'wardEnd') ev({ t: 'bossCall', nm: o.nm, say: o.say, mech: o.k === 'plates' || o.k === 'soak' || o.k === 'spread', pal: o.pal, col: o.col, x: b.x, z: b.z });
  BOSS_EXEC[o.k](b, o);
}
// soak / spread resolve when their marker lands, against your own hero (every game does the same maths from the same positions)
function bossTeamHit(a) {
  const pl = G.player; if (!pl || !pl.alive || pl.invulnT > 0) return;
  const pts = bossPartyPts(a.x, a.z, 80), mine = { knockX: pl.x - a.x, knockZ: pl.z - a.z, knock: 5, charge: 0, canCrit: false };
  if (a.soak) {
    const S = a.soak, inside = pts.filter((p) => Math.hypot(p.x - a.x, p.z - a.z) <= a.r).length, me = Math.hypot(pl.x - a.x, pl.z - a.z) <= a.r;
    dealDamage(pl, me ? S.total / Math.max(1, inside) : S.total / Math.max(1, S.n) * S.out, a.owner, mine);
    if (me && inside >= S.n) ev({ t: 'soakOk', x: a.x, z: a.z, pal: a.pal, col: a.col });
  } else if (a.spread) {
    if (pts.some((p) => !p.me && Math.hypot(p.x - a.x, p.z - a.z) <= a.r)) dealDamage(pl, a.spread.dm, a.owner, mine);
  }
}
