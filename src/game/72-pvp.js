// ---------------------------------------------------------------------
// PvP in the open world (opt-in). Only players who switched PvP on (Settings) can hit each other, outside town.
// Every client is untrusted, so the VICTIM decides: it checks the attacker is a PvP player nearby within 10 levels,
// scales and caps the damage, and on death drops 10% of its gold to the killer (zero-sum, so alts can't create gold),
// once per killer per 10 minutes. Shots from the attacker's own client only send 'phit'; nothing is applied locally.
// ---------------------------------------------------------------------
CFG.pvp = { range: 18, levelGap: 10, dmgMul: 0.35, hitCap: 0.15, secCap: 0.4, goldDrop: 0.1, goldFloor: 100, cooldown: 600, lastHitWindow: 5 };
const PVP = { win: 0, winT: 0, last: null, killedBy: {} };
const pvpOn = () => !!(G.profile && G.profile.settings.pvp) && typeof MP !== 'undefined' && MP.state === 'on';
const pvpZoneOk = (x, z) => G.mode === 'hub' && !G.rift && !G.dungeon && distToTown(x, z) > CFG.world.town.r + 4;
// peers you may hit right now (used by forEachTarget)
function pvpTargets() { return pvpOn() && pvpZoneOk(G.player.x, G.player.z) ? mpVisible().filter((e) => e.pvp && e.alive && pvpZoneOk(e.x, e.z)) : []; }
// attacker side: report the hit to the victim, change nothing here
function pvpHit(t, amount) {
  if (!pvpOn() || !(amount > 0)) return 0;
  rtSend(RT.topic, 'broadcast', { type: 'broadcast', event: 'phit', payload: { sid: MP.sid, to: t.key, a: Math.round(amount), l: G.profile.level } });
  return amount;
}
// victim side: all checks happen here
function pvpRecv(d) {
  const pl = G.player, P = CFG.pvp; if (!pvpOn() || !pl.alive || !pvpZoneOk(pl.x, pl.z) || G.menuSafe > 0) return;
  const sid = String(d.sid || '').slice(0, 16), a = MP.peers.get(sid); if (!a || !a.pvp || !a.alive || a.md !== 'hub') return;
  if (Math.hypot(a.x - pl.x, a.z - pl.z) > P.range || Math.abs((a.level || 1) - G.profile.level) > P.levelGap) return;
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
