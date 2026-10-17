// ---------------------------------------------------------------------
// PvP in the open world (opt-in). Only players who switched PvP on (Settings) can hit each other, outside town.
// Every client is untrusted, so the VICTIM decides: it checks the attacker is a PvP player nearby within 10 levels,
// scales and caps the damage, and on death drops 10% of its gold to the killer (zero-sum, so alts can't create gold),
// once per killer per 10 minutes. Shots from the attacker's own client only send 'phit'; nothing is applied locally.
// ---------------------------------------------------------------------
CFG.pvp = { range: 24, flush: 0.2, dmgMul: 0.35, hitCap: 0.15, secCap: 0.4, goldDrop: 0.1, goldFloor: 100, cooldown: 600, lastHitWindow: 5 };
const PVP = { win: 0, winT: 0, last: null, killedBy: {}, tT: -1, tList: [], out: new Map(), outT: 0 };
const pvpOn = () => !!(G.profile && G.profile.settings.pvp) && typeof MP !== 'undefined' && MP.state === 'on';
const pvpZoneOk = (x, z) => G.mode === 'hub' && !G.rift && !G.dungeon && distToTown(x, z) > CFG.world.town.r + 4;
// peers you may hit right now (used by forEachTarget)
// cached once per sim step: forEachTarget runs for every bullet every frame, so no new arrays per call
function pvpTargets() {
  if (PVP.tT === G.time) return PVP.tList;
  PVP.tT = G.time; PVP.tList = pvpOn() && pvpZoneOk(G.player.x, G.player.z) ? mpVisible().filter((e) => e.pvp && e.alive && pvpZoneOk(e.x, e.z)) : [];
  return PVP.tList;
}
// attacker side: report the hit to the victim, change nothing here
// hits are summed per victim and sent 5x a second, so a shotgun or minigun doesn't flood the lobby
function pvpHit(t, amount) {
  if (!pvpOn() || !(amount > 0)) return 0;
  PVP.out.set(t.key, (PVP.out.get(t.key) || 0) + amount);
  ev({ t: 'hit', x: t.x, z: t.z, y: 2.1, amt: Math.round(amount * CFG.pvp.dmgMul), crit: false, byPlayer: true });
  return amount;
}
function pvpFlush(dt) {
  if (!PVP.out.size || (PVP.outT -= dt) > 0) return; PVP.outT = CFG.pvp.flush;
  for (const [to, a] of PVP.out) rtSend(RT.topic, 'broadcast', { type: 'broadcast', event: 'phit', payload: { sid: MP.sid, to, a: Math.round(a), l: G.profile.level } });
  PVP.out.clear();
}
// victim side: all checks happen here
function pvpRecv(d) {
  const pl = G.player, P = CFG.pvp; if (!pvpOn() || !pl.alive || !pvpZoneOk(pl.x, pl.z) || G.menuSafe > 0) return;
  const sid = String(d.sid || '').slice(0, 16), a = MP.peers.get(sid); if (!a || !a.pvp || !a.alive || a.md !== 'hub') return;
  if (Math.hypot(a.x - pl.x, a.z - pl.z) > P.range) return; // no level gap: the per-hit and per-second caps keep low levels from being one-shot
  if (G.time - PVP.winT > 1) { PVP.winT = G.time; PVP.win = 0; }
  const room = Math.max(0, pl.maxHp * P.secCap - PVP.win), dmg = Math.min(Math.max(0, +d.a || 0) * P.dmgMul, pl.maxHp * P.hitCap, room);
  if (!(dmg > 0)) return;
  PVP.win += dmg; PVP.last = { sid, nick: a.nick, t: G.time };
  dealDamage(pl, dmg, null);
}
// victim died: was it a recent PvP hit? then drop gold to the killer (at most once per killer per 10 minutes)
function pvpOnDeath() {
  const L = PVP.last, P = CFG.pvp; PVP.last = null;
  if (!L || G.time - L.t > P.lastHitWindow) return;
  const p = G.profile, now = Date.now(); if (now - (PVP.killedBy[L.sid] || 0) < P.cooldown * 1000) return;
  PVP.killedBy[L.sid] = now;
  const g = p.gold >= P.goldFloor ? Math.floor(p.gold * P.goldDrop) : 0;
  if (g > 0) { p.gold -= g; G.dirty = true; }
  rtSend(RT.topic, 'broadcast', { type: 'broadcast', event: 'pdie', payload: { sid: MP.sid, to: L.sid, g } });
  toast(`${L.nick} defeated you${g ? ` and took ${fmtK(g)} gold` : ''}`, 'bad');
}
// killer side: the gold the victim dropped
function pvpDieRecv(d) {
  const a = MP.peers.get(String(d.sid || '').slice(0, 16)), g = Math.max(0, Math.floor(+d.g || 0)); if (!a) return;
  if (g) addGold(g, true);
  toast(`You defeated ${a.nick}${g ? ` · +${fmtK(g)} gold` : ''}`, 'good');
}
