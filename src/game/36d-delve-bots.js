// ---------------------------------------------------------------------
// Dungeon bots: a run with fewer than four heroes is filled up with computer heroes, so the Dungeon mode can be played
// alone or with one or two friends (Casper, 18 Oct). The game that starts the run (the leader, or you alone) runs the
// bots; in a party it sends them to the others ('dbot', ~7 times a second), where they show up like players
// (`e.bot`, never owners of shared monsters). Bots follow the leader, fight what they can see, stand on pressure
// plates, and pull fallen teammates back up; monsters fight them back. They take no loot.
// ---------------------------------------------------------------------
CFG.delve.bots = { on: true, hp: 0.9, dmg: 0.75, follow: 3.2, leash: 24, aggro: 14, keep: 0.7, send: 0.15 };
const delveBots = () => (delveOn() && G.dungeon.delve.bots) || [];
// called by startDelve: fill the party up to four
function delveBotsMake(D, humans) {
  const X = D.delve, pl = G.player, K = DV.bots, names = BOT_NAMES.slice().sort(() => Math.random() - 0.5);
  const classes = CFG.brawlerOrder.filter((c) => c !== pl.cls).sort(() => Math.random() - 0.5);
  X.bots = []; X.botSendT = 0;
  for (let i = 0; i < DV.maxParty - humans; i++) {
    const a = (i + 1) / DV.maxParty * Math.PI * 2, cls = classes[i % classes.length], name = names[i % names.length];
    const b = makeFighter({ name, team: 'ally', isBot: true, cls, x: pl.x + Math.sin(a) * 2, z: pl.z + Math.cos(a) * 2, level: G.profile.level,
      color: BOT_COLORS[i % BOT_COLORS.length], ai: { slot: a, shootT: 0, stuckT: 0, lx: pl.x, lz: pl.z, rev: null, revT: 0, tgt: null, tgtT: 0 } });
    applyLoadout(b, cls, []); applyStats(b, 'hub', { level: G.profile.level, gear: null });
    // a bot keeps up with the hero it fills in for: most of your health and damage, so the run's monster HP still fits
    b.maxHp = Math.max(b.maxHp, pl.maxHp * K.hp); b.dmg = Math.max(b.dmg, pl.dmg * K.dmg); b.hp = b.maxHp;
    b.delveBot = true; b.nick = name; b.key = 'bot:' + MP.sid + ':' + i; b.shots = 0; b.lastShot = b.lastAttack;
    X.bots.push(b);
  }
}
// a monster in a party dungeon goes for the nearest hero this game runs (you or a bot), and sticks with it for a moment
function delveTarget(e) {
  const pl = G.player, bots = delveBots(); if (!bots.length) return pl;
  if (e.tgt && e.tgt.alive && (e.tgtT -= CFG.sim.step) > 0) return e.tgt;
  let best = pl.alive ? pl : null, bd = pl.alive ? Math.hypot(pl.x - e.x, pl.z - e.z) - 1.5 : 1e9; // the player is a little more interesting
  for (const b of bots) { if (!b.alive) continue; const d = Math.hypot(b.x - e.x, b.z - e.z); if (d < bd) { bd = d; best = b; } }
  e.tgt = best || pl; e.tgtT = 1; return e.tgt;
}
const botSees = (b, t) => { const d = Math.hypot(t.x - b.x, t.z - b.z); return rayLen(b.x, b.z, Math.atan2(t.x - b.x, t.z - b.z), d).d >= d - (t.r || 0.4); };
function delveBotThink(b, dt) {
  const ai = b.ai, it = b.intent, D = G.dungeon, X = D.delve, K = DV.bots;
  it.mx = it.mz = 0; it.aiming = false; ai.shootT -= dt;
  const party = delveParty(), humans = party.filter((f) => !f.delveBot && !f.bot);
  const lead = (G.player.alive ? G.player : humans.find((f) => f.alive !== false)) || party.find((f) => f !== b && f.alive !== false) || G.player;
  let tx = null, tz = null, stop = 1.2;
  // the nearest monster it can see
  let foe = null, fd = K.aggro;
  for (const e of G.enemies) { if (!e.delve || !e.alive || e.hidden) continue; const d = Math.hypot(e.x - b.x, e.z - b.z); if (d < fd && botSees(b, e)) { fd = d; foe = e; } }
  // 1. a fallen teammate with no monster right on them: go and pull them up
  const down = party.find((f) => f !== b && f.alive === false && !G.enemies.some((e) => e.delve && e.alive && Math.hypot(e.x - f.x, e.z - f.z) < 5));
  // 2. pressure plates in a quiet room: each bot takes the plate after the humans' ones
  const m = D.rooms.find((r) => inRoom(r, b.x, b.z)), s = m && m.event === 'plates' ? X.ev[m.i] || {} : null;
  const plate = s && !s.done && m.seen && !m.mobs.some((e) => e.alive) ? m.plates[humans.length + X.bots.indexOf(b)] : null;
  if (down) { tx = down.x; tz = down.z; stop = DV.reviveR * 0.5; }
  else if (plate) { tx = plate.x; tz = plate.z; stop = 0.3; }
  if (foe) {
    const w = weaponOf(b), range = (w.range || 10) * K.keep;
    it.ax = (foe.x - b.x) / fd; it.az = (foe.z - b.z) / fd; it.aiming = true; it.fire = fd <= (w.range || 10);
    if (tx == null) { // hold at range: close in, back off when crowded, otherwise strafe round the leader's side
      if (fd > range) { tx = foe.x; tz = foe.z; stop = range; }
      else if (fd < range * 0.45) { tx = b.x - it.ax * 3; tz = b.z - it.az * 3; stop = 0.5; }
    }
    if (b.superCharge >= 1 && fd < (w.range || 10)) it.super = true;
  }
  if (tx == null) { tx = lead.x + Math.sin(ai.slot) * K.follow; tz = lead.z + Math.cos(ai.slot) * K.follow; }
  const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz);
  if (d > stop) { it.mx = dx / d; it.mz = dz / d; }
  // stuck on a wall or left far behind (a corridor, a door that opened behind the leader): step back in beside the leader
  ai.stuckT += dt;
  if (ai.stuckT > 1.5) { const moved = Math.hypot(b.x - ai.lx, b.z - ai.lz); if (moved < 0.6 && d > stop + 1) ai.slot += 1.7; ai.stuckT = 0; ai.lx = b.x; ai.lz = b.z; }
  if (lead.alive !== false && Math.hypot(lead.x - b.x, lead.z - b.z) > K.leash && !foe) { b.x = lead.x + Math.sin(ai.slot) * 1.5; b.z = lead.z + Math.cos(ai.slot) * 1.5; dungeonClamp(b, b.r); }
}
function delveBotRevive(b, by) {
  if (!b || b.alive) return;
  b.alive = true; b.hp = b.maxHp * 0.5; b.invulnT = 2;
  ev({ t: 'delveRevived', who: b.nick, x: b.x, z: b.z, by });
}
// a fallen hero is pulled up by whoever stood by them long enough: you, your bot, or (through 'drev') a friend's game
function delveRevive(f, by) {
  if (f === G.player) delveReviveMe(by);
  else if (f.delveBot) delveBotRevive(f, by);
  else if (typeof partySend === 'function') partySend('drev', { to: f.key, by });
}
function stepDelveBots(dt) {
  const bots = delveBots(); if (!bots.length) return;
  const party = delveParty();
  for (const b of bots) {
    if (!b.alive) continue;
    delveBotThink(b, dt); stepFighter(b, dt, 'hub');
    if (b.lastAttack !== b.lastShot) { b.lastShot = b.lastAttack; b.shots++; }
    const down = party.find((f) => f !== b && f.alive === false && Math.hypot(f.x - b.x, f.z - b.z) < DV.reviveR), ai = b.ai;
    if (!down) { ai.rev = null; continue; }
    if (ai.rev !== down) { ai.rev = down; ai.revT = 0; }
    if ((ai.revT += dt) >= DV.reviveT) { ai.rev = null; delveRevive(down, b.nick); }
  }
  delveBotsSend(dt);
}
// --- bots in a party: the leader's game sends them, the others show them like players
function delveBotsSend(dt) {
  const X = G.dungeon.delve; if ((X.botSendT -= dt) > 0) return; X.botSendT = DV.bots.send;
  if (typeof partySend !== 'function' || !mobPeers().length) return;
  const r1 = (v) => Math.round(v * 10) / 10;
  partySend('dbot', { dr: X.seed, b: X.bots.map((b) => [b.key, b.nick, b.cls, b.level, r1(b.x), r1(b.z), Math.round(b.facing * 100) / 100, r1(b.moveAmt || 0), b.shots,
    Math.round(clamp(b.hp / b.maxHp, 0, 1) * 100) / 100, b.alive ? 1 : 0]) });
}
function delveBotsRecv(sid, P) {
  if (!delveOn() || mpNum(P.dr, -1) >>> 0 !== G.dungeon.delve.seed || !Array.isArray(P.b)) return;
  let added = false;
  for (const r of P.b.slice(0, DV.maxParty)) {
    if (!Array.isArray(r) || r.length < 11 || typeof r[0] !== 'string' || !r[0].startsWith('bot:' + sid + ':')) continue;
    if (!MP.peers.has(r[0])) added = true;
    const e = mpApply(r[0], { v: 8, n: r[1], c: r[2], l: r[3], x: r[4], z: r[5], f: r[6], m: r[7], s: r[8], a: r[6], h: r[9], al: r[10], md: 'delve', dr: G.dungeon.delve.seed, pv: 0, t: Date.now() }, 'rt');
    if (e) e.bot = true;
  }
  if (added) mpRebuild();
}
// --- end dungeon bots
