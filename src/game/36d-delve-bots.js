// ---------------------------------------------------------------------
// Dungeon bots: a run with fewer than four heroes is filled up with computer heroes, so the Dungeon mode can be played
// alone or with one or two friends (Casper, 18 Oct). The game that starts the run (the leader, or you alone) runs the
// bots; in a party it sends them to the others ('dbot', ~7 times a second), where they show up like players
// (`e.bot`, never owners of shared monsters). Bots roam the room the party is in and pick their own fights, stand on
// pressure plates, and pull fallen teammates back up; monsters fight them back. They take no loot. Their level and
// stats follow the average level of the real heroes in the run (`delveBotScale`).
// ---------------------------------------------------------------------
CFG.delve.bots = { on: true, hp: 0.9, dmg: 0.75, aggro: 18, keep: 0.7, roam: [2, 4.5], near: 12, lost: 48, stuck: 3, rescale: 3, send: 0.15 };
const delveBots = () => (delveOn() && G.dungeon.delve.bots) || [];
// the real heroes' average level (you plus friends in the run; bots don't count)
function delveHumanLevel() {
  const ls = delveParty().filter((f) => !f.delveBot && !f.bot).map((f) => (f === G.player ? G.profile.level : f.level || G.profile.level));
  return Math.max(1, Math.round(ls.reduce((a, l) => a + l, 0) / ls.length));
}
// a bot keeps up with the heroes it fills in for: most of your health and damage, moved along the level curve to the
// party's average level, never below what its own level gives; the HP it has lost stays lost
function delveBotScale(b) {
  const pl = G.player, K = DV.bots, L = delveHumanLevel(), myL = G.profile.level, frac = b.maxHp > 0 ? clamp(b.hp / b.maxHp, 0, 1) : 1;
  if (b.level !== L || !b.scaled) { b.level = L; applyStats(b, 'hub', { level: L, gear: null }); }
  b.maxHp = Math.max(b.maxHp, pl.maxHp * K.hp * hpAt(L) / hpAt(myL)); b.dmg = Math.max(b.dmg, pl.dmg * K.dmg * atkAt(L) / atkAt(myL));
  b.hp = b.scaled ? b.maxHp * frac : b.maxHp; b.scaled = true;
}
// called by startDelve: fill the party up to four
function delveBotsMake(D, humans) {
  const X = D.delve, pl = G.player, names = BOT_NAMES.slice().sort(() => Math.random() - 0.5);
  const classes = CFG.brawlerOrder.filter((c) => c !== pl.cls).sort(() => Math.random() - 0.5);
  X.bots = []; X.botSendT = 0; X.botScaleT = DV.bots.rescale;
  for (let i = 0; i < DV.maxParty - humans; i++) {
    const a = (i + 1) / DV.maxParty * Math.PI * 2, cls = classes[i % classes.length], name = names[i % names.length];
    const b = makeFighter({ name, team: 'ally', isBot: true, cls, x: pl.x + Math.sin(a) * 2, z: pl.z + Math.cos(a) * 2, level: G.profile.level,
      color: BOT_COLORS[i % BOT_COLORS.length], ai: { side: a, roamT: 0, rx: pl.x, rz: pl.z, stuckT: 0, lx: pl.x, lz: pl.z, rev: null, revT: 0 } });
    applyLoadout(b, cls, []);
    b.delveBot = true; b.nick = name; b.key = 'bot:' + MP.sid + ':' + i; b.shots = 0; b.lastShot = b.lastAttack;
    X.bots.push(b); delveBotScale(b);
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
const roomOf = (D, x, z) => D.rooms.find((r) => inRoom(r, x, z));
function delveBotThink(b, dt) {
  const ai = b.ai, it = b.intent, D = G.dungeon, X = D.delve, K = DV.bots;
  it.mx = it.mz = 0; it.aiming = false;
  const party = delveParty(), humans = party.filter((f) => !f.delveBot && !f.bot);
  const lead = (G.player.alive ? G.player : humans.find((f) => f.alive !== false)) || party.find((f) => f !== b && f.alive !== false) || G.player;
  const myRoom = roomOf(D, b.x, b.z), leadRoom = roomOf(D, lead.x, lead.z) || myRoom;
  let tx = null, tz = null, stop = 1;
  // the nearest monster it can see
  // only monsters it can reach: none behind a gate that is still shut (it would shoot the bars all day)
  let foe = null, fd = K.aggro; const shut = D.doors.findIndex((d) => !d.open);
  for (const e of G.enemies) { if (!e.delve || !e.alive || e.hidden || (shut >= 0 && e.room > shut)) continue; const d = Math.hypot(e.x - b.x, e.z - b.z); if (d < fd && botSees(b, e)) { fd = d; foe = e; } }
  // 1. a fallen teammate with no monster right on them: go and pull them up
  const down = party.find((f) => f !== b && f.alive === false && !G.enemies.some((e) => e.delve && e.alive && Math.hypot(e.x - f.x, e.z - f.z) < 5));
  // 2. pressure plates in a quiet room: each bot takes the plate after the humans' ones
  const s = myRoom && myRoom.event === 'plates' ? X.ev[myRoom.i] || {} : null;
  const plate = s && !s.done && myRoom.seen && !myRoom.mobs.some((e) => e.alive) ? myRoom.plates[humans.length + X.bots.indexOf(b)] : null;
  // 3. a puzzle hall: in an ordered one (mural, echo) the first bot walks to the next seal after a short think, once the
  // first seal is right; in a race every bot runs for its own dark seal once the clock runs; the balance is yours alone
  let seal = null; const pz = myRoom && myRoom.pz, pzS = pz && !myRoom.mobs.some((e) => e.alive) ? delvePz(D, myRoom) : null;
  if (pzS && !pzS.done && pzS.cd <= 0) {
    if (pzOrdered(pz) && pzS.step >= 1 && X.bots.indexOf(b) === 0) {
      if (ai.pzStep !== pzS.step) { ai.pzStep = pzS.step; ai.pzT = 0; }
      if ((ai.pzT += dt) >= DV.puzzle.botWait) seal = pz.sw[pz.order[pzS.step]];
    } else if (pz.kind === 'timed' && pzS.bits) {
      const dark = pz.sw.filter((_, j) => !((pzS.bits >> j) & 1)); seal = dark.length ? dark[X.bots.indexOf(b) % dark.length] : null;
    }
  }
  if (down) { tx = down.x; tz = down.z; stop = DV.reviveR * 0.5; }
  else if (plate) { tx = plate.x; tz = plate.z; stop = 0.3; }
  else if (seal) { tx = seal.x; tz = seal.z; stop = 0.3; }
  if (foe) {
    const w = weaponOf(b), range = w.range || 10, keep = range * K.keep;
    it.ax = (foe.x - b.x) / fd; it.az = (foe.z - b.z) / fd; it.aiming = true; it.fire = fd <= range;
    if (b.superCharge >= 1 && fd < range) it.super = true;
    if (tx == null) {
      // its own spot on a ring round the monster, at its weapon's range; the spot drifts so the bots spread and circle
      ai.side += dt * 0.5 * (b.id % 2 ? 1 : -1);
      tx = foe.x + Math.sin(ai.side) * keep; tz = foe.z + Math.cos(ai.side) * keep; stop = 0.8;
    }
  }
  if (tx == null) {
    // no fight here: wander the room the leader is in (its own picks), or walk over when the leader went on ahead
    const R = leadRoom || myRoom;
    if ((ai.roamT -= dt) <= 0 || Math.hypot(ai.rx - b.x, ai.rz - b.z) < 1 || (R && !inRoom(R, ai.rx, ai.rz))) {
      ai.roamT = rand(K.roam[0], K.roam[1]);
      if (R && myRoom === R) { ai.rx = clamp(lead.x + rand(-K.near, K.near), R.x0 + 2, R.x1 - 2); ai.rz = clamp(lead.z + rand(-K.near, K.near), R.z0 + 2, R.z1 - 2); } // stay near the leader in the big halls
      else { ai.rx = lead.x + rand(-2.5, 2.5); ai.rz = lead.z + rand(-2.5, 2.5); }
    }
    tx = ai.rx; tz = ai.rz; stop = 0.8;
  }
  const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz);
  if (d > stop) { it.mx = dx / d; it.mz = dz / d; }
  // walking into a wall or a pillar: pick a new spot; still stuck, or lost far from the party: step in beside the leader
  ai.stuckT += dt;
  if (ai.stuckT > 1) {
    const moved = Math.hypot(b.x - ai.lx, b.z - ai.lz); ai.lx = b.x; ai.lz = b.z;
    ai.stuck = moved < 0.5 && d > stop + 1 ? (ai.stuck || 0) + 1 : 0; ai.stuckT = 0;
    if (ai.stuck) { ai.roamT = 0; ai.side += 1.9; }
  }
  const far = lead.alive !== false && Math.hypot(lead.x - b.x, lead.z - b.z) > K.lost;
  if ((ai.stuck >= K.stuck || far) && !foe) { b.x = lead.x + Math.sin(ai.side) * 1.5; b.z = lead.z + Math.cos(ai.side) * 1.5; dungeonClamp(b, b.r); ai.stuck = 0; }
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
  const party = delveParty(), X = G.dungeon.delve;
  if ((X.botScaleT -= dt) <= 0) { X.botScaleT = DV.bots.rescale; for (const b of bots) delveBotScale(b); } // a friend joined late or someone levelled
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
    if (!Array.isArray(r) || r.length < 11 || typeof r[0] !== 'string' || !r[0].startsWith('bot:' + sid) || r[0].length > 40) continue; // only the sender's own bots
    if (!MP.peers.has(r[0])) added = true;
    const e = mpApply(r[0], { v: 8, n: r[1], c: r[2], l: r[3], x: r[4], z: r[5], f: r[6], m: r[7], s: r[8], a: r[6], h: r[9], al: r[10], md: 'delve', dr: G.dungeon.delve.seed, pv: 0, t: Date.now() }, 'rt');
    if (e) e.bot = true;
  }
  if (added) mpRebuild();
}
// --- end dungeon bots
