// ---------------------------------------------------------------------
// Ascendant Lanes online, lobby and results (34b-lanes.js runs the match, 47e-lanes-view.js draws it).
// Party: a 5-letter code, its own Realtime channel 'lanes-<code>' (mpRoomKey). Presence carries each player's Lanes
// card (code, join time, team, rating bracket, Power, mode size). The leader (earliest in) picks 1v1/2v2/3v3 and
// "together" (friends against bots) or "versus" (friends split into two teams, balanced by Power) and sends 'lgo';
// every named player starts the same match. Quick match waits in 'lq-<size>-<bracket>' (only players of the same
// level bracket meet: the level-matching hook); the earliest there forms a match when it is full, or after
// LANES_WAIT seconds with two or more, and sends 'lmm'. Empty places are bots.
// In a match the host (the first listed player still present) runs minions, towers, Cores, camps and bots and sends
// them 6 times a second ('lst'). Everyone runs their own hero. Hits: on host-run bodies they go to the host as a share
// of max HP ('lhit'); on a human hero they go to that hero's own game, which applies them ('lph', victim decides, like
// 72-pvp.js). The host ends the match ('lend'), and each game pays its own rewards.
// Test mode and local previews play alone with bots (no Realtime there).
// ---------------------------------------------------------------------
const LN = { code: '', jt: 0, ready: false, size: 1, sides: 'together', q: '', qT: 0, joinT: 0, uiT: 0, sendT: 0, hits: new Map(), hitT: 0, m: null, uiHtml: '' };
const LANES_WAIT = 30;
GI.m_lanes = GI.m_shard; PX_KEY_FAM.m_lanes = 'ice'; // the Core's crystal, in frost blue (Showdown keeps the red swords)
const lanesOnline = () => !TEST_MODE && typeof RT !== 'undefined' && (RT.state === 'on' || RT.state === 'joining' || RT.state === 'connecting');
function lanesRoomKey() { if (G.lanes && G.lanes.code) return 'lanes-' + G.lanes.code; return LN.q ? 'lq-' + LN.q : LN.code ? 'lanes-' + LN.code : ''; }
function lanesCard() {
  const r = lanesRating(G.profile, typeof playerPower === 'function' ? playerPower() : 0);
  return { lc: G.lanes ? G.lanes.code : LN.code, lj: LN.jt, lt: G.lanes ? G.player.team : '', lr: r.br, lw: r.pw, lm: r.mmr, ls: LN.size, lq: LN.q, lrd: LN.ready ? 1 : 0 };
}
// presence → peer (70-multiplayer.js mpApply)
function lanesApplyPeer(e, s) {
  e.lc = typeof s.lc === 'string' ? s.lc.slice(0, 8) : ''; e.lj = mpNum(s.lj, 0); e.lt = s.lt === 'red' ? 'red' : s.lt === 'blue' ? 'blue' : '';
  e.lr = clamp(mpNum(s.lr, 0) | 0, 0, 20); e.lw = Math.max(0, mpNum(s.lw, 0)); e.lm = mpNum(s.lm, 1000); e.ls = clamp(mpNum(s.ls, 1) | 0, 1, 3); e.lq = typeof s.lq === 'string' ? s.lq.slice(0, 16) : ''; e.lrd = s.lrd === 1;
  if (e.md === 'lanes') e.team = e.lt || 'peer';
}
function lanesSend(event, payload) { return typeof RT !== 'undefined' && RT.state === 'on' && rtSend(RT.topic, 'broadcast', { type: 'broadcast', event, payload: Object.assign({ sid: MP.sid }, payload) }); }
// human players in my match (other games)
function lanesMpPeers() { const S = G.lanes; if (!S || !S.code || typeof MP === 'undefined') return []; return MP.list.filter((e) => e.via === 'rt' && e.md === 'lanes' && e.lc === S.code && (e.lt === 'blue' || e.lt === 'red')); }
function lanesMembers() {
  const r = lanesRating(G.profile, playerPower()), me = { key: MP.sid, me: true, nick: mpNick(G.profile), cls: G.profile.cls, level: G.profile.level, pw: r.pw, br: r.br, lj: LN.jt, rd: LN.ready };
  if (!LN.code) return [me];
  return [me, ...MP.list.filter((e) => e.via === 'rt' && e.lc === LN.code && e.md === 'hub').map((e) => ({ key: e.key, nick: e.nick, cls: e.cls, level: e.level, pw: e.lw, br: e.lr, lj: e.lj, rd: e.lrd }))]
    .sort((a, b) => a.lj - b.lj || (a.key < b.key ? -1 : 1)).slice(0, LN.size * 2);
}
const lanesLeads = () => !LN.code || lanesMembers()[0].me;
// teams: together = every human on blue; versus = snake by Power (strongest blue, next two red, ...) for even sides
function lanesTeams(members, sides) {
  if (sides !== 'versus') return members.map((m) => ['blue', m]);
  const s = members.slice().sort((a, b) => b.pw - a.pw || (a.key < b.key ? -1 : 1));
  return s.map((m, i) => [(i % 4 === 0 || i % 4 === 3) ? 'blue' : 'red', m]);
}
function lanesGoMsg(members, sides, size, code) {
  const levels = members.map((m) => m.level || 1), T = lanesTeams(members, sides);
  return { code, size, seed: (Math.random() * 4294967295) >>> 0, norm: lanesShouldNormalize(levels) ? 1 : 0, m: T.map(([team, m]) => [m.key, team, m.level | 0, String(m.nick || 'Hero').slice(0, 14), m.cls]) };
}
function lanesStartFrom(msg) {
  const mine = msg.m.find((r) => r[0] === MP.sid); if (!mine) return false;
  const humans = msg.m.filter((r) => r[0] !== MP.sid).map((r) => ({ key: r[0], team: r[1] === 'red' ? 'red' : 'blue', level: r[2] | 0 || 1, nick: cleanNick(r[3]) || 'Hero', cls: r[4] }));
  if (G.modal) UI.close();
  LN.m = msg.m.map((r) => r[0]); LN.ready = false;
  const ok = startLanes({ size: clamp(msg.size | 0, 1, 3), team: mine[1], seed: msg.seed >>> 0, humans, host: msg.m[0][0] === MP.sid, code: String(msg.code || '').slice(0, 8), normalize: !!msg.norm });
  if (!ok) toast('Your Lanes match started, but finish what you are doing first', 'bad');
  return ok;
}
// --- lobby actions
function lanesPlay(solo) {
  if (G.mode !== 'hub' || G.rift || G.dungeon || G.siege) return toast('Finish what you are doing first', 'bad');
  if (solo || !LN.code) { UI.close(); LN.m = null; if (!startLanes({ size: LN.size, team: 'blue', seed: (Math.random() * 4294967295) >>> 0 })) toast('Finish what you are doing first', 'bad'); return; }
  const M = lanesMembers();
  if (M.some((m) => !m.me && !m.rd)) return toast('Waiting for everyone to be ready', 'bad');
  if (LN.sides === 'versus' && M.length < 2) return toast('Versus needs a friend in the party', 'bad');
  const msg = lanesGoMsg(M, LN.sides, LN.size, LN.code); lanesSend('lgo', msg); lanesStartFrom(msg);
}
function lanesCreate() { if (!lanesOnline()) return toast('Parties need the online game (the public site or the app)', 'bad'); LN.code = newCode(); LN.jt = Date.now(); LN.ready = true; LN.q = ''; LN.joinT = 0; Sfx.play('unlock'); }
function lanesJoin(code) {
  code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  if (code.length !== 5) return toast('Party codes have 5 letters and numbers', 'bad');
  if (!lanesOnline()) return toast('Parties need the online game (the public site or the app)', 'bad');
  LN.code = code; LN.jt = Date.now(); LN.ready = false; LN.q = ''; LN.joinT = G.time;
}
function lanesQueue() {
  if (!lanesOnline()) return toast('Quick match needs the online game (the public site or the app)', 'bad');
  LN.code = ''; LN.q = `${LN.size}-${lanesBracket(G.profile.level)}`; LN.qT = 0; LN.jt = Date.now();
}
// --- every frame (from mpUpdate): party upkeep and the quick-match queue
function lanesUpdate(dt) {
  if (!G.started || typeof RT === 'undefined') return;
  if (LN.code && !G.lanes && RT.state === 'on' && RT.key === mpRoomKey()) {
    const M = lanesMembers();
    if (!M.some((m) => m.me)) { LN.code = ''; toast('That Lanes party is full', 'bad'); }
    else if (LN.joinT && G.time - LN.joinT > 8 && M.length < 2) { LN.code = ''; LN.joinT = 0; toast('No Lanes party with that code', 'bad'); }
    else if (M.length > 1) { LN.joinT = 0; if (!M[0].me) { const P = MP.peers.get(M[0].key); if (P) LN.size = P.ls; } }
  }
  if (LN.q && !G.lanes && RT.state === 'on' && RT.key === mpRoomKey()) {
    LN.qT += dt; const need = LN.size * 2;
    const Q = [lanesMembers()[0], ...MP.list.filter((e) => e.via === 'rt' && e.lq === LN.q && e.md === 'hub' && e.alive).map((e) => ({ key: e.key, nick: e.nick, cls: e.cls, level: e.level, pw: e.lw, lj: e.lj }))].sort((a, b) => a.lj - b.lj || (a.key < b.key ? -1 : 1));
    if (Q[0].me && (Q.length >= need || (LN.qT >= LANES_WAIT && Q.length >= 2))) { const msg = Object.assign(lanesGoMsg(Q.slice(0, need), 'versus', LN.size, newCode()), { q: LN.q }); lanesSend('lmm', msg); lanesRecv('lmm', MP.sid, msg); }
  }
  if (UI.current === 'lanes' && G.modal && (LN.uiT -= dt) <= 0) { LN.uiT = 1; const a = document.activeElement; if (!a || a.id !== 'lnCode') openLanesPanel(); }
}
// --- in a match: who runs it, sending, mirroring
function lanesHostKey() {
  const S = G.lanes; if (!S || !S.code || !LN.m) return MP.sid;
  const here = new Set(lanesMpPeers().map((e) => e.key)); here.add(MP.sid);
  return LN.m.find((k) => here.has(k)) || MP.sid;
}
// a body this game runs for the match (host only): minions, buildings, camps, bots
function lanesMpRuns(srcId) { const S = G.lanes; if (!S || !S.host) return false; const s = G.ents.get(srcId); return !!s && (s.kind === 'minion' || s.kind === 'structure' || s.lanesCamp || s.lanesBot); }
// a hit on another human hero: their own game applies it
function lanesMpHeroHit(t, amount, srcId) {
  if (!G.lanes || !(amount > 0) || t.team === G.player.team && srcId === G.player.id) return 0;
  lanesSend('lph', { to: t.key, a: Math.round(amount) });
  if (srcId === G.player.id) ev({ t: 'hit', x: t.x, z: t.z, y: 2.1, amt: Math.round(amount), crit: false, byPlayer: true });
  return amount;
}
const lanesNid = (o) => o.nid || (o.kind === 'minion' ? 'm' + (o.hid || o.id) : o.lanesBot ? 'b' + o.key : o.kind === 'structure' ? 's' + G.lanes.structs.indexOf(o) : o.lanesCamp ? 'c' + G.lanes.camps.indexOf(o) : '');
// called every match step; true = this game is a guest (it mirrors instead of simulating)
function lanesMpStep(dt) {
  const S = G.lanes; if (!S.code || typeof RT === 'undefined') return false;
  const host = lanesHostKey() === MP.sid;
  if (host !== S.host) { S.host = host; if (host) { for (const m of S.minions) m.tgt = null; toast('You run the match now', 'good'); } }
  if (host) {
    // a human hero going down counts for the other team (their own game ran the fall)
    for (const e of lanesMpPeers()) { if (e._lnAlive && !e.alive) { S.kills[lanesEnemy(e.lt)]++; ev({ t: 'lanesKill', team: lanesEnemy(e.lt), name: e.nick, mine: e.lt === S.myTeam }); } e._lnAlive = e.alive; }
    if ((LN.sendT -= dt) <= 0) { LN.sendT = 0.16; lanesMpSendState(); }
    return false;
  }
  // guest: hits on host bodies go out 5 times a second, minions glide to where the host says
  if ((LN.hitT -= dt) <= 0) { LN.hitT = 0.2; if (LN.hits.size) { lanesSend('lhit', { to: lanesHostKey(), h: [...LN.hits].map(([k, f]) => [k, Math.round(Math.min(1, f) * 10000) / 10000]) }); LN.hits.clear(); } }
  const k = 1 - Math.exp(-dt * 10);
  for (const m of S.minions) if (m.alive && m.sx != null) { m.x += (m.sx - m.x) * k; m.z += (m.sz - m.z) * k; m.facing += angDiff(m.facing, m.sf || 0) * k; m.attackAnim = Math.max(0, m.attackAnim - dt * 3); m.flashT -= dt; }
  for (const c of S.camps) if (c.alive && c.sx != null) { c.x += (c.sx - c.x) * k; c.z += (c.sz - c.z) * k; c.flashT -= dt; }
  return true;
}
// a guest's own hit on a host body (from lanesDmgMod via dealDamage): the share goes to the host
function lanesMpGuestHit(t, amount, srcId) { const S = G.lanes; if (!S || S.host || !S.code || srcId !== G.player.id || !t.maxHp) return; const k = lanesNid(t); if (k) LN.hits.set(k, (LN.hits.get(k) || 0) + amount / t.maxHp); }
function lanesMpSendState() {
  const S = G.lanes, f1 = (v) => Math.round(v * 10), h = (o) => (o.alive ? Math.max(1, Math.round(o.hp / o.maxHp * 1000)) : 0);
  lanesSend('lst', { t: Math.round(S.t * 10) / 10, ph: S.phase === 'countdown' ? 0 : S.phase === 'fight' ? 1 : 2, k: [S.kills.blue, S.kills.red], bf: [Math.round(S.buff.blue), Math.round(S.buff.red)],
    s: S.structs.map(h), c: S.camps.map((c) => [f1(c.x), f1(c.z), h(c)]),
    m: S.minions.filter((m) => m.alive).slice(0, 60).map((m) => [m.id, m.mk === 'ranged' ? 1 : 0, m.team === 'red' ? 1 : 0, f1(m.x), f1(m.z), h(m), Math.round(m.facing * 100), m.attackAnim > 0.5 ? 1 : 0]),
    b: S.bots.map((b) => [b.key, b.team === 'red' ? 1 : 0, b.cls, b.nick, f1(b.x), f1(b.z), Math.round(b.facing * 100), b.alive ? h(b) : 0, b.slot]) });
}
function lanesMirror(P) {
  const S = G.lanes, ph = ['countdown', 'fight', 'over'][mpNum(P.ph, 1) | 0] || 'fight';
  if (S.phase === 'countdown' && ph === 'fight') { S.phase = 'fight'; ev({ t: 'lanesFight' }); }
  S.t = mpNum(P.t, S.t);
  if (Array.isArray(P.k)) { S.kills.blue = mpNum(P.k[0], 0) | 0; S.kills.red = mpNum(P.k[1], 0) | 0; }
  if (Array.isArray(P.bf)) { S.buff.blue = mpNum(P.bf[0], 0); S.buff.red = mpNum(P.bf[1], 0); }
  if (Array.isArray(P.s)) S.structs.forEach((o, i) => { const f = mpNum(P.s[i], 1000) / 1000; if (f <= 0 && o.alive) { o.hp = 0; killEntity(o, null); } else if (f > 0) { if (f * o.maxHp < o.hp - 1) { o.flashT = 0.12; o.hurtT = 1.2; } o.hp = f * o.maxHp; } });
  if (Array.isArray(P.c)) S.camps.forEach((c, i) => { const r = P.c[i]; if (!Array.isArray(r)) return; const f = mpNum(r[2], 0) / 1000; c.sx = mpNum(r[0], 0) / 10; c.sz = mpNum(r[1], 0) / 10; if (f <= 0) { if (c.alive) { c.alive = false; ev({ t: 'die', x: c.x, z: c.z, kind: c.type, elite: true }); } } else { if (!c.alive) { c.alive = true; c.x = c.sx; c.z = c.sz; } c.hp = f * c.maxHp; } });
  const seen = new Set();
  for (const r of Array.isArray(P.m) ? P.m : []) {
    if (!Array.isArray(r) || r.length < 8) continue; const id = r[0]; seen.add(id);
    let m = S.minions.find((q) => q.hid === id);
    const x = mpNum(r[3], 0) / 10, z = mpNum(r[4], 0) / 10, f = mpNum(r[5], 0) / 1000;
    if (!m) { if (f <= 0) continue; m = lanesMinion(r[2] ? 'red' : 'blue', r[1] ? 'ranged' : 'melee', x, z); m.hid = id; S.minions.push(m); }
    m.sx = x; m.sz = z; m.sf = mpNum(r[6], 0) / 100; if (r[7]) m.attackAnim = 1;
    if (f * m.maxHp < m.hp - 1) m.flashT = 0.1; m.hp = Math.max(1, f * m.maxHp);
  }
  for (const m of S.minions) if (m.alive && m.hid != null && !seen.has(m.hid)) { m.alive = false; m.deadAt = G.time; ev({ t: 'die', x: m.x, z: m.z, kind: 'minion' }); G.ents.delete(m.id); }
  S.minions = S.minions.filter((m) => m.alive || G.time - m.deadAt < 2);
  for (const r of Array.isArray(P.b) ? P.b : []) {
    if (!Array.isArray(r) || r.length < 9 || typeof r[0] !== 'string') continue;
    let b = S.bots.find((q) => q.key === r[0]);
    if (!b) { const cls = CFG.brawlerOrder.includes(r[2]) ? r[2] : STARTER_HERO; b = lanesBot(r[1] ? 'red' : 'blue', r[8] | 0, cls, cleanNick(r[3]) || 'Bot'); b.key = r[0]; S.bots.push(b); S.fighters.push(b); }
    b.sx = mpNum(r[4], 0) / 10; b.sz = mpNum(r[5], 0) / 10; b.sf = mpNum(r[6], 0) / 100;
    const f = mpNum(r[7], 0) / 1000; if (f <= 0) { if (b.alive) { b.alive = false; b.respawnT = 99; ev({ t: 'die', x: b.x, z: b.z, kind: 'fighter' }); } } else { if (!b.alive) { b.alive = true; b.x = b.sx; b.z = b.sz; } b.hp = f * b.maxHp; }
  }
}
function lanesMpEnd(winner, why) { if (G.lanes && G.lanes.code && G.lanes.host) lanesSend('lend', { w: winner, why }); }
function lanesMpLeave() { LN.m = null; LN.hits.clear(); }
// broadcast events l* (70-multiplayer.js rtMessage)
function lanesRecv(event, sid, P) {
  if (!G.started) return;
  if (event === 'lgo') { const L = lanesMembers()[0]; if (!LN.code || !L || L.key !== sid || !Array.isArray(P.m) || G.lanes) return; lanesStartFrom(P); return; }
  if (event === 'lmm') { if (!LN.q || P.q !== LN.q || !Array.isArray(P.m) || !P.m.some((r) => r[0] === MP.sid) || G.lanes) return; LN.q = ''; LN.code = String(P.code || '').slice(0, 5); toast(`Matched with ${P.m.length - 1} hero${P.m.length > 2 ? 'es' : ''}!`, 'good'); lanesStartFrom(P); return; }
  const S = G.lanes; if (!S || !S.code) return;
  if (event === 'lph') { // a hit on my hero: only from a player in this match on the other team (or the host's bodies), within reach
    if (P.to !== MP.sid || !G.player.alive) return; const a = MP.peers.get(sid); if (!a || a.md !== 'lanes' || a.lc !== S.code) return;
    if (a.lt === G.player.team && sid !== lanesHostKey()) return;
    const dmg = Math.min(Math.max(0, mpNum(P.a, 0)), G.player.maxHp * 0.5); if (dmg > 0) dealDamage(G.player, dmg, -1, {}); return;
  }
  if (event === 'lhit') { if (!S.host || P.to !== MP.sid || !Array.isArray(P.h)) return;
    for (const [k, f] of P.h) { const o = typeof k === 'string' ? lanesFindNid(k) : null; if (!o || !o.alive) continue; const amt = clamp(mpNum(f, 0), 0, 1) * o.maxHp; if (o.kind === 'structure' && lanesShielded(o)) continue; o.hp -= amt; o.flashT = CFG.combat.hitFlash; if (o.hp <= 0) { o.hp = 0; killEntity(o, null); } }
    return; }
  if (sid !== lanesHostKey()) return; // the rest only from the game that runs the match
  if (event === 'lst') lanesMirror(P);
  else if (event === 'lend') lanesFinish(P.w === 'red' ? 'red' : 'blue', P.why === 'time' ? 'time' : 'core');
}
function lanesFindNid(k) { const S = G.lanes, i = parseInt(k.slice(1), 10); if (k[0] === 's') return S.structs[i]; if (k[0] === 'c') return S.camps[i]; if (k[0] === 'b') return S.bots.find((b) => b.key === k.slice(1)); if (k[0] === 'm') return S.minions.find((m) => m.id === i); return null; }
// --- the Lanes page: pick 1v1/2v2/3v3, solo with bots or a party, quick match per bracket
function openLanesPanel() {
  const live = UI.current === 'lanes' && G.modal && !$('modal').hidden; UI.current = 'lanes';
  const p = G.profile, rec = lanesRec(), r = lanesRating(p, playerPower()), online = lanesOnline(), lead = lanesLeads(), M = lanesMembers();
  let body;
  if (G.lanes) body = `<div class="riftCard"><p>A match is on: ${G.lanes.size}v${G.lanes.size}.</p></div><div class="row end"><button class="ghost" data-act="close">Back to the match</button><button class="primary" data-act="lnForfeit">Leave match</button></div>`;
  else {
    const sizes = CFG.lanes.sizes.map((n) => `<button class="dlvCard lnSize${LN.size === n ? ' on' : ''}" style="--art:url(assets/ui/lanes/${n}v${n}.webp);--bc:#7fd8ff" data-act="lnSize" data-n="${n}" ${lead ? '' : 'aria-disabled="true"'}><b>${n}v${n}</b><small>${n === 1 ? 'One lane, no camps' : n === 2 ? 'Lane + 2 camps' : 'Wide lane + 2 camps'}</small></button>`).join('');
    const T = lanesTeams(M, LN.sides), slot = (m) => m ? `<div class="dlvSlot rd"><i>${gi(m.me ? 'm_hero' : 'm_players')}</i><b>${escapeHTML(m.nick)}${m.me ? ' (you)' : ''}</b><small>Lv ${fmt(m.level)} · ${fmtK(m.pw)} Power</small></div>` : `<div class="dlvSlot empty"><small>Bot</small></div>`;
    const team = (name) => { const ms = T.filter(([t]) => t === name).map(([, m]) => m); return Array.from({ length: LN.size }, (_, i) => slot(ms[i])).join(''); };
    let buttons;
    if (LN.q) buttons = `<div class="dlvQueue"><div class="spin"></div><b>Looking for heroes · ${lanesBracketName(r.br)}</b><small>${Math.floor(LN.qT)}s · bots fill the rest</small></div><div class="row end"><button class="ghost" data-act="lnCancelQ">Cancel</button><button class="primary" data-act="lnSolo">Play with bots</button></div>`;
    else if (LN.code) buttons = `<div class="dlvCode">Party code <b>${LN.code}</b><small>Friends type it in Lanes › Join</small></div>
      <div class="row lnSides"><button class="${LN.sides === 'together' ? 'primary' : 'ghost'}" data-act="lnSides" data-s="together" ${lead ? '' : 'aria-disabled="true"'}>Together</button><button class="${LN.sides === 'versus' ? 'primary' : 'ghost'}" data-act="lnSides" data-s="versus" ${lead ? '' : 'aria-disabled="true"'}>Versus</button></div>
      <div class="row end"><button class="ghost" data-act="lnLeave">Leave party</button>${lead ? `<button class="primary big" data-act="lnStart">Start ${LN.size}v${LN.size}</button>` : `<button class="${LN.ready ? 'ghost' : 'primary'} big" data-act="lnReady">${LN.ready ? 'Not ready' : 'Ready'}</button>`}</div>`;
    else buttons = `<div class="row dlvJoin"><input id="lnCode" maxlength="5" placeholder="CODE" autocomplete="off" autocapitalize="characters" spellcheck="false" ${online ? '' : 'disabled'}><button class="ghost" data-act="lnJoin" ${online ? '' : 'aria-disabled="true"'}>Join</button><button class="ghost" data-act="lnCreate" ${online ? '' : 'aria-disabled="true"'}>Party</button></div>
      <div class="row end"><button class="ghost" data-act="lnQueue" ${online ? '' : 'aria-disabled="true"'}>Quick match</button><button class="primary big" data-act="lnSolo">Play with bots</button></div>
      ${online ? '' : `<p class="fine">${TEST_MODE ? 'Test mode plays with bots.' : 'Parties and quick match work on the public site and in the app.'}</p>`}`;
    body = `<div class="dlvCards lnSizes">${sizes}</div>
      <p class="fine">Your own hero, gear and talents. Minions march, towers guard, destroy the enemy Core to win.</p>
      <div class="lnTeams"><div class="lnTeam blue"><b>Blue</b>${team('blue')}</div><div class="lnTeam red"><b>Red</b>${team('red')}</div></div>
      <div class="dlvGate ok">Bracket <b>${lanesBracketName(r.br)}</b> · ${fmtK(r.pw)} Power · rating ${fmt(r.mmr)}</div>
      ${buttons}`;
  }
  const html = `<div class="npcHead">${gi('m_lanes', 'hd')}<h3>Ascendant Lanes</h3><span class="cnt">${lanesRank(rec.rp)} · ${fmt(rec.rp)} RP · ${rec.w}W ${rec.l}L</span></div>${body}`;
  if (live && html === LN.uiHtml) return;
  LN.uiHtml = html; openModal(html); $('panel').classList.add('menuPanel');
}
function lanesAction(act, b) {
  switch (act) {
    case 'lnSize': if (lanesLeads()) LN.size = clamp(+b.dataset.n | 0, 1, 3); break;
    case 'lnSides': if (lanesLeads()) LN.sides = b.dataset.s === 'versus' ? 'versus' : 'together'; break;
    case 'lnCreate': lanesCreate(); break;
    case 'lnJoin': lanesJoin(($('lnCode') || {}).value); break;
    case 'lnLeave': LN.code = ''; LN.ready = false; LN.jt = 0; break;
    case 'lnReady': LN.ready = !LN.ready; break;
    case 'lnQueue': lanesQueue(); break;
    case 'lnCancelQ': LN.q = ''; LN.jt = 0; break;
    case 'lnSolo': LN.q = ''; lanesPlay(true); return;
    case 'lnStart': lanesPlay(false); return;
    case 'lnForfeit': UI.close(); if (G.lanes && !G.lanes.result) { const S = G.lanes; S.peers = S.peers || []; lanesFinish(lanesEnemy(S.myTeam), 'left'); } leaveLanes(); return;
    case 'lnHub': UI.close(); leaveLanes(); return;
    case 'lnAgain': UI.close(); leaveLanes(); setTimeout(() => { if (!G.modal && G.mode === 'hub') openLanesPanel(); }, 300); return;
  }
  if (UI.current === 'lanes') openLanesPanel();
}
function openLanesResult() {
  const r = G.lanes && G.lanes.result; if (!r) return;
  UI.current = 'lanesResult';
  openModal(`<div class="results ${r.win ? 'win' : ''}"><div class="place">${r.win ? 'WIN' : 'LOSS'}</div><h2>${r.win ? 'Victory!' : 'Defeat'}</h2>
    <div class="stats3"><div><b class="${r.rp >= 0 ? 'up' : 'down'}">${r.rp >= 0 ? '+' : ''}${r.rp}</b><span>${escapeHTML(r.rank)} · ${fmt(r.rpTotal)} RP</span></div><div><b>${ICON.coin}+${fmtK(r.gold)}</b><span>Gold</span></div><div><b>${r.kills}/${r.deaths}</b><span>Takedowns / falls</span></div></div>
    <div class="stats3"><div><b>${r.structs}</b><span>Buildings</span></div><div><b>${r.minions}</b><span>Minions</span></div><div><b>${Math.floor(r.t / 60)}:${String(Math.floor(r.t % 60)).padStart(2, '0')}</b><span>Match</span></div></div>
    ${r.chest ? `<div class="list"><div class="item">${caseArt(r.chest)}<div class="meta"><div class="slot">Earned</div><div class="nm">${CFG.cases[r.chest].name}</div><div class="st">Open it in your Inventory</div></div></div></div>` : ''}</div>
    <div class="row end"><button class="ghost" data-act="lnHub">Back to the world</button><button class="primary" data-act="lnAgain">Play again</button></div>`, false);
}
if (LOCAL_PREVIEW) window.__lanes = { LN, startLanes, leaveLanes, openLanesPanel, lanesRating, lanesBracket, lanesShouldNormalize, lanesGoMsg, lanesTeams, lanesRecv, lanesMirror, get S() { return G.lanes; } };
// --- end Lanes online
