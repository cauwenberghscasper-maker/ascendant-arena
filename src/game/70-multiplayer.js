// ---------------------------------------------------------------------
// 11. MULTIPLAYER — real players share the open world.
// Public site and store apps: one Supabase Realtime lobby (presence for who is here, broadcast for movement).
// Inside the Claude artifact, two transports instead, merged per play session:
//   1. the artifact's live room (presence, ~8 updates a second) when this view can join it;
//   2. a small shared database doc per player (mp/<your id>, one entry per open session), about once
//      a second while you move — works wherever the database works, including your own second device.
// Each player keeps their own monsters, loot and save; other players' shots are cosmetic.
// Nothing personal travels: players pick a nickname, ids are never shown.
// ---------------------------------------------------------------------
const MP = {
  room: null, roomState: 'none', roomPeers: 0, db: null, dbState: 'none', dbPeers: 0, uid: null, sid: Math.random().toString(36).slice(2, 10),
  peers: new Map(), list: [], seq: 0, aim: 0, sendT: 0, last: '', dbT: 0, dbLast: '', dbBeat: 0, dbBusy: false, dbBackoff: 0, dbDoc: null, sent: 0, dbSent: 0, err: '',
  get state() { return RT.state === 'on' || this.roomState === 'on' || this.dbState === 'on' || this.dbState === 'readonly' ? 'on' : RT.state === 'connecting' || RT.state === 'joining' || this.roomState === 'connecting' || this.dbState === 'connecting' ? 'connecting' : 'off'; },
};
function mpNick(p) { if (!p.nick) { p.nick = 'Hero' + (1000 + Math.floor(Math.random() * 9000)); G.dirty = true; } return p.nick; }
const NICK_BAN = /(fuck|shit|bitch|cunt|nigg|fag|kanker|hoer|slet|nazi|hitler|porn|sex)/i;
function cleanNick(s) { const n = String(s || '').replace(/[^\p{L}\p{N} _.\-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14); return n.length < 3 || NICK_BAN.test(n.replace(/[^\p{L}]/gu, '')) ? '' : n; }
const escHtml = (t) => String(t).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const mpNum = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
const MP_STALE = 45000;

async function mpInit() {
  // test sessions never join; a local preview joins only a separate dev lobby, and only with ?mp=1
  const localMp = LOCAL_PREVIEW && new URLSearchParams(location.search).get('mp') === '1';
  if (TEST_MODE || (LOCAL_PREVIEW && !localMp)) { MP.roomState = MP.dbState = RT.state = 'off'; return; }
  const c = window.claude;
  if (!c || typeof c.use !== 'function') { MP.roomState = MP.dbState = 'off'; rtConnect(); window.addEventListener('pagehide', rtLeave); return; }
  RT.state = 'off';
  // live room
  (async () => {
    try {
      const room = await c.use('room'); if (!room) { MP.roomState = 'off'; return; }
      MP.room = room; MP.roomState = room.connected() ? 'on' : 'connecting';
      room.onConnection((ok) => { MP.roomState = ok ? 'on' : 'connecting'; if (ok) MP.last = ''; }, (e) => { MP.roomState = 'off'; MP.err = 'room ' + (e && e.code); });
      room.onPeers((ch) => mpRoomPeers(ch), (e) => { MP.roomState = 'off'; MP.err = 'room ' + (e && e.code); });
    } catch (e) { MP.roomState = 'off'; MP.err = 'room ' + (e && e.code || e); }
  })();
  // shared database beacon
  (async () => {
    try {
      const [db, user] = await Promise.all([c.use('db'), c.use('user')]);
      if (!db) { MP.dbState = 'off'; return; }
      MP.db = db; MP.dbState = 'connecting';
      MP.uid = user ? await user.id() : null;
      if (MP.uid) MP.dbDoc = db.doc('mp/' + MP.uid); else MP.dbState = 'readonly';
      db.collection('mp').onSnapshot((snap) => { if (MP.dbState === 'connecting') MP.dbState = MP.dbDoc ? 'on' : 'readonly'; mpDbPeers(snap); },
        (e) => { MP.dbState = 'off'; MP.err = 'db ' + (e && e.code); });
      window.addEventListener('pagehide', () => { if (MP.dbDoc) MP.dbDoc.update({ s: { [MP.sid]: null } }).catch(() => {}); });
    } catch (e) { MP.dbState = 'off'; MP.err = 'db ' + (e && e.code || e); }
  })();
}
// --- Lobby: Supabase Realtime (public site, store apps) ---------------------------------------------------------
// Everyone in the open world joins one channel today: the lobby. mpRoomKey() is the only place that decides which
// channel a player belongs to. Partitioning later = return another key (per area band, World Tier, or a numbered
// shard once a room passes MP_ROOM_CAP); mpUpdate then leaves the old channel and joins the new one on the same
// socket, and the peers of the old room disappear. Presence says who is in the room (nick, hero, level, mode);
// broadcast 'st' carries movement about 8 times a second while something changes, plus a beat every 3 s; 'mob' and
// 'hit' share the monsters (see the shared monsters section below).
const MP_ROOM_CAP = 60;
// a party (or a matchmaking queue) has its own channel instead of the lobby (73-party.js)
function mpRoomKey() { const fk = G.siege && G.siege.code ? 'fort-' + G.siege.code : '', pk = typeof partyRoomKey === 'function' ? partyRoomKey() : ''; return (LOCAL_PREVIEW ? 'dev-' : '') + (fk || pk || 'lobby-w11') // World v11 moved every monster slot: old clients stay in their own lobby; }
const RT = { ws: null, state: 'none', topic: '', key: '', joinRef: '', ref: 0, retry: 0, backoff: 1, hbT: 25, sendT: 0, beatT: 0, last: '', tracked: '', present: 0, sent: 0 };
function rtSend(topic, event, payload, joinRef) {
  if (!RT.ws || RT.ws.readyState !== 1) return false;
  RT.ws.send(JSON.stringify({ topic, event, payload, ref: String(++RT.ref), join_ref: joinRef === undefined ? RT.joinRef : joinRef })); return true;
}
function rtConnect() {
  if (RT.ws) return;
  RT.state = 'connecting';
  let ws;
  try { ws = new WebSocket(SUPA.url.replace(/^http/, 'ws') + '/realtime/v1/websocket?apikey=' + encodeURIComponent(SUPA.key) + '&vsn=1.0.0'); }
  catch (e) { RT.state = 'off'; MP.err = 'lobby ' + (e && e.message || e); return; }
  RT.ws = ws;
  ws.onopen = () => { RT.backoff = 1; RT.hbT = 25; rtJoin(mpRoomKey()); };
  ws.onmessage = (m) => { let d; try { d = JSON.parse(m.data); } catch (e) { return; } rtMessage(d); };
  ws.onclose = () => { if (RT.ws !== ws) return; RT.ws = null; RT.topic = ''; rtDropPeers(); if (RT.state !== 'off') { RT.state = 'connecting'; RT.retry = RT.backoff; RT.backoff = Math.min(30, RT.backoff * 2); } };
  ws.onerror = () => { MP.err = 'lobby connection'; };
}
function rtJoin(key) {
  if (RT.topic) { rtSend(RT.topic, 'phx_leave', {}); rtDropPeers(); }
  RT.key = key; RT.topic = 'realtime:aa-' + key; RT.joinRef = String(++RT.ref); RT.state = 'joining'; RT.last = RT.tracked = '';
  // the join's own ref is its join_ref, so the server's phx_reply can be matched to it
  if (RT.ws && RT.ws.readyState === 1) RT.ws.send(JSON.stringify({ topic: RT.topic, event: 'phx_join', ref: RT.joinRef, join_ref: RT.joinRef,
    payload: { config: { broadcast: { ack: false, self: false }, presence: { enabled: true, key: MP.sid }, private: false } } }));
}
if (LOCAL_PREVIEW) window.__mp = { MP, RT, get MOB() { return MOB; }, get BOSS() { return BOSS; }, bossLeader: () => bossLeader(), roomKey: () => mpRoomKey(), rtMessage: (d) => rtMessage(d), get FW() { return FW; } };
function rtLeave() { if (RT.topic) rtSend(RT.topic, 'phx_leave', {}); RT.state = 'off'; if (RT.ws) RT.ws.close(); }
function rtCount() { mpRebuild(); RT.present = MP.list.filter((e) => e.via === 'rt').length; }
function rtDropPeers() { for (const [k, e] of MP.peers) if (e.via === 'rt') MP.peers.delete(k); RT.present = 0; mpRebuild(); mobOwnership(); }
function rtMetas(byKey, add) {
  for (const key in byKey) {
    const metas = byKey[key] && byKey[key].metas; if (!metas || !metas.length || key === MP.sid) continue;
    if (add) mpApply(key.slice(0, 16), metas[metas.length - 1], 'rt', false);
    else { const e = MP.peers.get(key.slice(0, 16)); if (e && e.via === 'rt') MP.peers.delete(key.slice(0, 16)); }
  }
}
function rtMessage(d) {
  if (!d || d.topic !== RT.topic) return;
  const P = d.payload || {};
  switch (d.event) {
    case 'phx_reply':
      if (d.ref === RT.joinRef && RT.state === 'joining') {
        if (P.status === 'ok') { RT.state = 'on'; RT.sendT = 0; rtTrack(); }
        else { RT.state = 'off'; MP.err = 'lobby join ' + JSON.stringify(P.response || P).slice(0, 80); }
      }
      break;
    case 'presence_state': rtMetas(P, true); rtCount(); break;
    case 'presence_diff': rtMetas(P.joins || {}, true); rtMetas(P.leaves || {}, false); rtCount(); break;
    case 'broadcast': if (P.event === 'mob' && P.payload && typeof P.payload.sid === 'string') { mobRecv(P.payload.sid.slice(0, 16), P.payload.m); break; }
      if (P.event === 'hit' && P.payload && P.payload.to === MP.sid) { mobHitRecv(P.payload); break; }
      if (P.event === 'phit' && P.payload && P.payload.to === MP.sid) { pvpRecv(P.payload); break; }
      if (P.event === 'pdie' && P.payload && P.payload.to === MP.sid) { pvpDieRecv(P.payload); break; }
      if (P.payload && typeof P.payload.sid === 'string' && /^(dgo|drev|mmgo|pfull|dbot|dask|dans|ddoor|dpz|dbs|dsec)$/.test(P.event)) { partyRecv(P.event, P.payload.sid.slice(0, 16), P.payload); break; }
      if (P.payload && typeof P.payload.sid === 'string' && /^f[a-z]+$/.test(P.event) && typeof siegeMpRecv === 'function') { siegeMpRecv(P.event, P.payload.sid.slice(0, 16), P.payload); break; }
      if (P.payload && typeof P.payload.sid === 'string' && /^b/.test(P.event)) { bossRecv(P.event, P.payload.sid.slice(0, 16), P.payload); break; }
      if (P.event === 'st' && P.payload && typeof P.payload.sid === 'string') { mpApply(P.payload.sid.slice(0, 16), P.payload, 'rt', false); if (!MP.list.includes(MP.peers.get(P.payload.sid.slice(0, 16)))) mpRebuild(); } break;
    case 'phx_error': case 'phx_close': if (RT.state !== 'off') { RT.topic = ''; rtDropPeers(); RT.state = 'connecting'; RT.retry = RT.backoff; RT.backoff = Math.min(30, RT.backoff * 2); } break;
  }
}
// presence holds the slow-changing card (nick, hero, level, mode); it is re-sent only when one of those changes
function rtTrack() {
  const s = mpState(), card = [s.n, s.c, s.l, s.md, s.al, s.pv, s.pc, s.rd, s.dg, s.df, s.dr, s.pw, s.qk, s.fc, s.ft].join('|'); if (card === RT.tracked) return;
  const now = performance.now(); if (now - (RT.trackAt || 0) < 1000) return; // the server limits presence updates per client
  RT.trackAt = now; RT.tracked = card; s.t = Date.now(); rtSend(RT.topic, 'presence', { type: 'presence', event: 'track', payload: s });
}
function rtUpdate(dt) {
  if (RT.state === 'off' || RT.state === 'none') return;
  if (!RT.ws) { if ((RT.retry -= dt) <= 0) rtConnect(); return; }
  if ((RT.hbT -= dt) <= 0) { RT.hbT = 25; rtSend('phoenix', 'heartbeat', {}, null); }
  if (RT.ws.readyState === 1 && !RT.topic && (RT.retry -= dt) <= 0) rtJoin(mpRoomKey());
  if (RT.state !== 'on' || !G.started) return;
  if (mpRoomKey() !== RT.key) { rtJoin(mpRoomKey()); return; } // partition change: move to the new room
  if ((MOB.t -= dt) <= 0) { MOB.t = 0.25; mobOwnership(); mobSend(); bossSend(); }
  if ((HITQ.t -= dt) <= 0) hitFlush();
  RT.sendT -= dt; RT.beatT -= dt;
  if (RT.sendT > 0) return;
  RT.sendT = 0.12; rtTrack();
  const s = mpState(), key = JSON.stringify(Object.assign({}, s, { t: 0 }));
  if (key !== RT.last || RT.beatT <= 0) { RT.last = key; RT.beatT = 3; s.t = Date.now(); if (rtSend(RT.topic, 'broadcast', { type: 'broadcast', event: 'st', payload: s })) RT.sent++; }
}
// --- shared monsters (lobby) -------------------------------------------------------------------------------------
// Every world builds the same monster in the same slot (seeded initHubWorld, e.slot). Each monster is run by the lobby
// player nearest to it: e.own = that player's sid, null = this game runs it. A 3 m margin stops it flipping back and
// forth, and when two games both claim one the lower sid wins. The owner sends its monsters that are near other
// players 4 times a second; the others draw them (mobRemoteStep) and send their hits to the owner as a share of max HP,
// because every player has their own level scaling. Anyone who damaged a monster gets their own kill reward.
// Monsters still attack only the player who runs them, which is the nearest one.
const MOB_MARGIN = 3, MOB_NEAR = 75;
const MOB = { t: 0, on: false, sent: 0, got: 0, hits: 0 };
// inside a party dungeon only its monsters are shared (slot = room × 100 + k), with party members in the same run
const mobSyncable = (e) => e && e.slot != null && !e.rift && (delveOn() ? !!e.delve : !(e.dungeon || e.temp));
const mobAt = (i) => (delveOn() ? G.dungeon.delve.slots.get(i) : G.enemies[i]);
function mobPeers() {
  if (RT.state !== 'on' || !G.started || G.mode !== 'hub') return [];
  if (delveOn()) { const seed = G.dungeon.delve.seed; return MP.list.filter((e) => e.via === 'rt' && e.md === 'delve' && e.dr === seed && e.alive && !e.bot); }
  return inInstance() ? [] : MP.list.filter((e) => e.via === 'rt' && e.md === 'hub' && e.alive);
}
function mobOwnership() {
  const peers = mobPeers(), pl = G.player;
  if (!peers.length) { if (MOB.on) { for (const e of G.enemies) if (e.own) mobHandover(e, null); MOB.on = false; } return; }
  MOB.on = true; const byKey = new Map(peers.map((p) => [p.key, p])), now = G.time;
  for (const e of G.enemies) {
    if (!mobSyncable(e)) continue;
    const cur = e.own ? byKey.get(e.own) : null;
    if (e.own && !cur) { mobHandover(e, null); continue; } // its owner left the lobby or the open world
    if (e.ownLock > now) continue;
    const dMe = pl.alive ? Math.hypot(pl.x - e.x, pl.z - e.z) : 1e9;
    let best = null, bd = 1e9; for (const p of peers) { const d = Math.hypot(p.x - e.x, p.z - e.z); if (d < bd) { bd = d; best = p; } }
    let own = e.own, od = cur ? Math.hypot(cur.x - e.x, cur.z - e.z) : dMe;
    if (best && best.key !== own && bd < od - MOB_MARGIN) { own = best.key; od = bd; }
    if (own && dMe < od - MOB_MARGIN) own = null;
    if (own !== e.own) mobHandover(e, own);
  }
}
function mobHandover(e, own) {
  if (own) { e.sx = e.x; e.sz = e.z; e.sf = e.facing; if (e.mv && (e.mv.k || e.hidden || e.windT > 0)) moveEnd(e); e.hidden = false; }
  else if (!e.alive) e.respawnT = Math.min(e.respawnT || 0, CFG.world.enemyRespawn);
  e.own = own;
}
function mobSend() {
  const peers = mobPeers(); if (!peers.length) return;
  const out = [];
  for (const e of G.enemies) {
    if (e.own || !mobSyncable(e) || out.length >= 80) continue;
    if (!peers.some((p) => Math.hypot(p.x - e.x, p.z - e.z) < MOB_NEAR)) continue;
    out.push([e.slot, Math.round(e.x * 10), Math.round(e.z * 10), e.alive ? Math.max(1, Math.round(e.hp / e.maxHp * 1000)) : 0,
      Math.round((e.facing || 0) * 100), Math.round((e.moveAmt || 0) * 10), (e.attackAnim || 0) > 0.3 || e.windT > 0 || e.lungeT > 0 ? 1 : 0, e.type]);
  }
  if (out.length && rtSend(RT.topic, 'broadcast', { type: 'broadcast', event: 'mob', payload: { sid: MP.sid, m: out } })) MOB.sent++;
}
function mobRecv(sid, list) {
  if (!Array.isArray(list) || !G.started || G.mode !== 'hub') return;
  for (const r of list) {
    if (!Array.isArray(r) || r.length < 8) continue;
    const e = mobAt(r[0]); if (!mobSyncable(e) || e.escaped) continue;
    if (e.own !== sid) {
      // both games think they run it: the lower sid keeps it
      if ((e.own === null ? MP.sid : e.own) < sid) continue;
      e.own = sid; e.ownLock = G.time + 1.5;
    }
    MOB.got++;
    if (r[7] !== e.type && CFG.enemies[r[7]] && !e.delve) { // a different monster in this slot (should not happen with the seeded world)
      e.type = r[7]; e.r = CFG.enemies[r[7]].r * (e.elite ? CFG.enemies.elite.r : 1); setEnemyLevel(e, enemyLevelFor(e));
      const v = views.get(e); if (v) { dynGroup.remove(v.root); v.dispose(); views.delete(e); }
    }
    const x = mpNum(r[1], 0) / 10, z = mpNum(r[2], 0) / 10, hp = mpNum(r[3], 0) / 1000;
    e.sx = x; e.sz = z; e.sf = mpNum(r[4], 0) / 100; e.moveAmt = clamp(mpNum(r[5], 0) / 10, 0, 1); if (r[6]) e.attackAnim = 1;
    if (hp <= 0) {
      if (e.alive) { e.x = x; e.z = z; e.hp = 0; if (e.tagged) killEntity(e, null); else { e.alive = false; e.respawnT = 1e9; ev({ t: 'die', x, z, kind: e.type, elite: !!e.elite }); } }
    } else {
      if (!e.alive) {
        if (G.time - (e.myKillT ?? -9) < 2) continue; // we just killed it here; the owner has not heard yet
        if (e.delve) continue; // party-dungeon monsters never come back
        e.alive = true; e.x = x; e.z = z; e.tagged = false; e.burnT = 0; e.slowT = 0; setEnemyLevel(e, enemyLevelFor(e)); ev({ t: 'spawn', x, z, elite: e.elite });
      }
      const want = Math.max(1, hp * e.maxHp); if (want < e.hp || G.time - (e.myHitT ?? -9) > 0.8) e.hp = want;
    }
  }
}
// a monster another player runs: glide to where they say it is
function mobRemoteStep(e, dt) {
  e.flashT -= dt; e.attackAnim = Math.max(0, (e.attackAnim || 0) - dt * 3);
  if (!e.alive || e.sx == null) return;
  const k = 1 - Math.exp(-dt * 10), dx = e.sx - e.x, dz = e.sz - e.z;
  if (dx * dx + dz * dz > 400) { e.x = e.sx; e.z = e.sz; } else { e.x += dx * k; e.z += dz * k; }
  if (e.sf != null) e.facing += angDiff(e.facing, e.sf) * k;
}
// our hit on a monster another player runs (called from dealDamage after the hit landed here)
const HITQ = { mob: new Map(), boss: 0, bossTo: null, t: 0 };
function mpMobHit(t, amt) {
  if (!mobSyncable(t) || !t.own) return;
  t.myHitT = G.time; if (t.hp <= 0) t.myKillT = G.time;
  const k = t.own + '|' + t.slot; HITQ.mob.set(k, (HITQ.mob.get(k) || 0) + amt / t.maxHp);
  if (t.hp <= 0) hitFlush(); // a kill goes out at once
}
// sends what was hit since the last flush (same 'hit' / 'bhit' messages as before, so older games still read them)
function hitFlush() {
  for (const [k, f] of HITQ.mob) { const j = k.lastIndexOf('|'); if (rtSend(RT.topic, 'broadcast', { type: 'broadcast', event: 'hit', payload: { sid: MP.sid, to: k.slice(0, j), i: +k.slice(j + 1), f: Math.round(Math.min(1, f) * 10000) / 10000 } })) MOB.hits++; }
  HITQ.mob.clear();
  if (HITQ.boss > 0 && HITQ.bossTo) bossMsg('bhit', { to: HITQ.bossTo, f: Math.round(Math.min(1, HITQ.boss) * 10000) / 10000 });
  HITQ.boss = 0; HITQ.t = 0.2;
}
// another player's hit on a monster we run
function mobHitRecv(P) {
  const e = mobAt(mpNum(P.i, -1)); if (!mobSyncable(e) || e.own || !e.alive) return;
  e.hp -= clamp(mpNum(P.f, 0), 0, 1) * e.maxHp; e.flashT = CFG.combat.hitFlash; e.lastHurt = G.time;
  if (e.state === 'idle') e.state = 'chase';
  if (e.hp <= 0) { e.hp = 0; killEntity(e, null); }
}
// --- shared world boss (lobby) -----------------------------------------------------------------------------------
// One lobby player in the open world runs the boss for everyone: the leader, the lowest sid among the players in the
// open world (stable, so it never flips while players walk around). The leader runs the timer, picks the lair, spawns
// the boss, moves it, picks targets among all players and sends each attack ('batk'), which every game runs against
// its own hero. The others mirror the timer and the boss ('bst' 4 times a second, their own level scaling, HP as a
// share) and send their hits ('bhit'). When the boss dies ('bend'), each game pays its own loot: share = your damage
// over the boss's max HP. If the leader leaves, the next lowest sid takes over with the boss as it is.
// every boss has a uid (leader sid + its id); a uid that ended here never comes back as a mirror, so one boss pays once
const BOSS = { killedAt: -99, sent: 0, got: 0, ended: new Set() };
function bossLeader() {
  const peers = RT.state === 'on' ? MP.list.filter((e) => e.via === 'rt' && e.md === 'hub') : [];
  let L = G.mode === 'hub' && !inInstance() ? MP.sid : null;
  for (const p of peers) if (L === null || p.key < L) L = p.key;
  return L;
}
function bossFollowing() { if (RT.state !== 'on' || !G.started || G.mode !== 'hub' || inInstance()) return false; const L = bossLeader(); return !!L && L !== MP.sid; }
function bossLeading() { return RT.state === 'on' && G.mode === 'hub' && !inInstance() && bossLeader() === MP.sid && MP.list.some((e) => e.via === 'rt' && e.md === 'hub'); }
function bossPeerTargets() { return bossLeading() ? MP.list.filter((e) => e.via === 'rt' && e.md === 'hub' && e.alive) : []; }
function bossMsg(event, payload) { return rtSend(RT.topic, 'broadcast', { type: 'broadcast', event, payload: Object.assign({ sid: MP.sid }, payload) }); }
function bossSend() {
  if (!bossLeading()) return;
  const b = G.boss;
  const s = { s: b ? 2 : G.bossWarned ? 1 : 0, l: G.bossLair, tm: Math.round(G.bossTimer * 10) / 10 };
  if (b) { if (!b.uid) b.uid = MP.sid + '-' + b.id; s.u = b.uid; }
  if (b) Object.assign(s, { x: Math.round(b.x * 10) / 10, z: Math.round(b.z * 10) / 10, h: Math.max(b.hp > 0 ? 1 : 0, Math.round(b.hp / b.maxHp * 1000)), f: Math.round(b.facing * 100) / 100, m: b.moveAmt > 0.5 ? 1 : 0, life: Math.round(b.life), r: b.retreat ? 1 : 0 });
  if (bossMsg('bst', s)) BOSS.sent++;
}
function mpBossAttack(o) { if (bossLeading()) bossMsg('batk', o); }
function mpBossEnd(killed) { const b = G.boss; if (b && b.uid) BOSS.ended.add(b.uid); if (bossLeading()) { if (b && !b.uid) b.uid = MP.sid + '-' + b.id; bossMsg('bend', { k: killed ? 1 : 0, u: b ? b.uid : '' }); } }
// our hit on the boss the leader runs; a kill here shares loot by your damage over max HP
function mpBossHit(b, amt) { b.myHitT = G.time; const to = bossLeader(); if (HITQ.bossTo !== to) { hitFlush(); HITQ.bossTo = to; } HITQ.boss += amt / b.maxHp; if (b.hp <= 0) { BOSS.killedAt = G.time; b.total = Math.max(b.total, b.maxHp); if (b.uid) BOSS.ended.add(b.uid); hitFlush(); } }
function bossRecv(event, sid, P) {
  if (!G.started || G.mode !== 'hub' || inInstance()) return;
  if (event === 'bhit') { // another player's hit on the boss we run
    const b = G.boss; if (P.to !== MP.sid || !b || !b.alive || !bossLeading()) return;
    const dmg = clamp(mpNum(P.f, 0), 0, 1) * b.maxHp; b.hp -= dmg; b.total += dmg; b.flashT = CFG.combat.hitFlash; b.lastHurt = G.time;
    if (b.hp <= 0) { b.hp = 0; killEntity(b, null); }
    return;
  }
  if (sid !== bossLeader()) return; // only the leader speaks for the boss
  BOSS.got++;
  if (event === 'batk') { if (G.boss && G.boss.alive) bossAttack(G.boss, P, true); return; }
  if (event === 'bend') {
    if (P.u) BOSS.ended.add(P.u);
    if (G.boss && (!P.u || !G.boss.uid || G.boss.uid === P.u)) { const b = G.boss; if (P.k) b.total = Math.max(b.total, b.maxHp); endBoss(!!P.k && b.total > 0 && (b.dmgBy[G.player.id] || 0) > 0); } // your loot: your damage over max HP
    else { G.bossTimer = CFG.boss.interval; G.bossWarned = false; }
    BOSS.killedAt = G.time; return;
  }
  if (event !== 'bst') return;
  if (P.l >= 1 && P.l < CFG.world.lairs.length) G.bossLair = P.l;
  G.bossTimer = mpNum(P.tm, G.bossTimer);
  if (P.s === 0) { G.bossWarned = false; return; }
  if (P.s === 1) { if (!G.bossWarned && !G.boss) { G.bossWarned = true; ev({ t: 'bossWarn', lair: currentLair().name, secs: Math.ceil(G.bossTimer) }); } return; }
  if (P.s !== 2) return;
  if (typeof P.u !== 'string' || BOSS.ended.has(P.u)) return; // this boss already ended here (we killed our copy of it)
  if (G.boss && G.boss.uid && G.boss.uid !== P.u) { BOSS.ended.add(G.boss.uid); endBoss(false); } // a stale copy of an older boss
  if (!G.boss) { if (G.time - BOSS.killedAt < 3) return; G.bossWarned = true; spawnBoss(); G.boss.uid = P.u; }
  const b = G.boss; b.sx = mpNum(P.x, b.x); b.sz = mpNum(P.z, b.z); b.sf = mpNum(P.f, b.facing); b.moveAmt = P.m ? 1 : 0; b.life = mpNum(P.life, b.life);
  if (P.r && !b.retreat) { b.retreat = 1; b.invulnT = 99; ev({ t: 'bossGone', name: b.name }); }
  const want = Math.max(1, clamp(mpNum(P.h, 1000), 0, 1000) / 1000 * b.maxHp); if (want < b.hp || G.time - (b.myHitT ?? -9) > 0.8) b.hp = want;
}
// the boss as the leader sees it: glide there, no own timer or attacks
function bossRemoteStep(dt) {
  const b = G.boss; if (!b) return;
  b.flashT -= dt; b.slowT -= dt; b.attackAnim = Math.max(0, b.attackAnim - dt * 1.5); trackVel(b, dt);
  bossKitTick(b, dt, false);
  if (HeroSupers.tickStatus(b, dt)) b.moveAmt = 0;
  if (b.sx == null) return;
  const k = 1 - Math.exp(-dt * 8), dx = b.sx - b.x, dz = b.sz - b.z;
  if (dx * dx + dz * dz > 900) { b.x = b.sx; b.z = b.sz; } else { b.x += dx * k; b.z += dz * k; }
  if (b.sf != null) b.facing += angDiff(b.facing, b.sf) * k;
}
function mpClear() { MP.peers.clear(); MP.list = []; }
// one remote session: update (or create) its hero from a presence object
function mpApply(key, s, via, guest) {
  if (!s || s.v !== 8 || key === MP.sid) return null;
  const t = mpNum(s.t, Date.now());
  let e = MP.peers.get(key);
  if (e && t < e.t - 50) return e; // older than what we already have
  const cls = CFG.brawlerOrder.includes(s.c) ? s.c : STARTER_HERO, x = clamp(mpNum(s.x, 0), -2000, 2000), z = clamp(mpNum(s.z, 0), -2000, 2000);
  if (!e) {
    e = { id: 'peer:' + key, key, kind: 'fighter', isPeer: true, team: 'peer', cls, x, z, tx: x, tz: z, facing: 0, tf: 0, moveAmt: 0, alive: true, level: 1, r: 0.55,
      hp: 1, maxHp: 1, nick: 'Hero', md: 'hub', seq: mpNum(s.s, 0), guest: !!guest, attackAnim: 0, t: 0 };
    MP.peers.set(key, e);
    if (G.started && s.n && !key.startsWith('bot:')) Feed.add(`${gi('m_players')} <b>${escHtml(cleanNick(s.n) || 'A hero')}</b> is in the world`, 'mp', null, 5);
  }
  { const pdt = (t - (e.t || t)) / 1000; if (pdt > 0.02 && pdt < 1) { e.vx = clamp((x - e.tx) / pdt, -20, 20); e.vz = clamp((z - e.tz) / pdt, -20, 20); } if (!(mpNum(s.m, 0) > 0)) e.vx = e.vz = 0; }
  e.t = t; e.seenAt = Date.now(); e.via = via; e.rcv = performance.now();
  e.cls = cls; e.tx = x; e.tz = z; e.tf = mpNum(s.f, 0); e.moveAmt = clamp(mpNum(s.m, 0), 0, 1);
  e.level = clamp(Math.floor(mpNum(s.l, 1)), 1, 100000); e.nick = cleanNick(s.n) || 'Hero'; e.md = s.md === 'hub' ? 'hub' : s.md === 'rift' ? 'rift' : s.md === 'delve' ? 'delve' : s.md === 'siege' ? 'siege' : 'away';
  e.fc = typeof s.fc === 'string' ? s.fc.slice(0, 12) : ''; e.ft = mpNum(s.ft, 0); // Bastion world code and when they came in
  // party card: code, join time, Power, ready, the leader's dungeon and difficulty, the run seed, the queue
  e.pc = typeof s.pc === 'string' ? s.pc.slice(0, 8) : ''; e.jt = mpNum(s.jt, 0); e.pw = Math.max(0, mpNum(s.pw, 0)); e.rd = s.rd === 1; e.dg = typeof s.dg === 'string' ? s.dg.slice(0, 12) : '';
  e.df = clamp(Math.floor(mpNum(s.df, 0)), 0, 999); e.dr = mpNum(s.dr, 0) >>> 0; e.qk = typeof s.qk === 'string' ? s.qk.slice(0, 32) : '';
  e.pvp = s.pv === 1; e.alive = s.al !== 0; e.hp = clamp(mpNum(s.h, 1), 0, 1); e.maxHp = 1; e.aim = mpNum(s.a, 0);
  const sq = mpNum(s.s, 0);
  if (sq !== e.seq) { if (sq > e.seq && sq - e.seq < 6 && (e.md === 'hub' || e.md === 'delve' || e.md === 'siege')) mpGhostShot(e); e.seq = sq; }
  return e;
}
function mpRebuild() {
  const now = Date.now();
  for (const [k, e] of MP.peers) if (now - (e.seenAt || 0) > MP_STALE && (e.via === 'db' || e.via === 'rt')) MP.peers.delete(k);
  MP.list = [...MP.peers.values()];
}
function mpRoomPeers(ch) {
  let n = 0; const live = new Set();
  for (const pr of ch.peers) {
    if (pr.sameTab || pr.kind !== 'viewer') continue;
    const s = pr.presence || {}; if (s.v !== 8) continue;
    const key = typeof s.sid === 'string' ? s.sid.slice(0, 16) : 'r' + pr.peer;
    live.add(key); n++;
    mpApply(key, s, 'room', pr.guest);
  }
  MP.roomPeers = n;
  // people who left the room and are not seen in the database either
  for (const [k, e] of MP.peers) if (e.via === 'room' && !live.has(k)) MP.peers.delete(k);
  mpRebuild();
}
function mpDbPeers(snap) {
  let n = 0; const now = Date.now();
  for (const d of snap.docs) {
    const body = d.data() || {}, S = body.s && typeof body.s === 'object' ? body.s : {};
    for (const sid in S) {
      const s = S[sid]; if (!s || typeof s !== 'object' || sid === MP.sid) continue;
      if (now - mpNum(s.t, 0) > MP_STALE) continue;
      n++;
      const cur = MP.peers.get(sid);
      if (cur && cur.via === 'room' && now - cur.seenAt < 3000) continue; // the room is fresher
      mpApply(sid, s, 'db', false);
    }
  }
  MP.dbPeers = n;
  mpRebuild();
}
// another player's shot: same look as theirs, but it never hits anything here
function mpGhostShot(e) {
  const pl = G.player; if (!pl || Math.hypot(e.x - pl.x, e.z - pl.z) > 45 || G.rift || G.mode !== 'hub') return;
  const w = CFG.attacks[e.cls] || CFG.attacks.bolt, n = Math.min(5, w.count || 1), base = e.aim;
  for (let i = 0; i < n; i++) {
    const a = n > 1 ? base + (i / (n - 1) - 0.5) * (w.spread || 0.3) : base, sp = Math.min(w.speed, 30);
    spawnProjectile({ x: e.x + Math.sin(a) * 0.6, z: e.z + Math.cos(a) * 0.6, vx: Math.sin(a) * sp, vz: Math.cos(a) * sp, life: w.range / sp, r: w.radius || 0.3, dmg: 0, team: 'ghost', owner: -1, kind: w.lob ? 'orb' : w.kind, color: w.color || 0x9fd7ff, ghost: true });
  }
  e.facing = base; e.attackAnim = 1;
}
// visible peers: in the open world, while you are too
// in a party dungeon: the party members in this run
function mpVisible() { if (G.siege) return G.siege.code ? MP.list.filter((e) => e.md === 'siege' && e.fc === G.siege.code) : []; if (G.mode !== 'hub' || G.rift) return []; if (delveOn()) { const seed = G.dungeon.delve.seed; return MP.list.filter((e) => e.md === 'delve' && e.dr === seed); } return MP.list.filter((e) => e.md === 'hub'); }
function mpOnShot(f, dx, dz) { if (f.isPlayer && G.mode === 'hub') { MP.seq++; MP.aim = Math.atan2(dx, dz); } }
function mpState() {
  const p = G.profile, pl = G.player, r1 = (v) => Math.round(v * 10) / 10;
  return { v: 8, sid: MP.sid, n: mpNick(p), c: p.cls, l: p.level, x: r1(pl.x), z: r1(pl.z), f: Math.round(pl.facing * 100) / 100, m: r1(pl.moveAmt || 0), s: MP.seq, a: Math.round(MP.aim * 100) / 100,
    h: Math.round(clamp(pl.hp / pl.maxHp, 0, 1) * 100) / 100, al: pl.alive ? 1 : 0, md: G.rift ? 'rift' : delveOn() ? 'delve' : G.dungeon ? 'dungeon' : G.siege ? 'siege' : G.mode, pv: typeof pvpOn === 'function' && pvpOn() ? 1 : 0,
    ...(typeof partyCard === 'function' ? partyCard() : {}), ...(G.siege && G.siege.code ? { fc: G.siege.code, ft: FW.ft } : {}) };
}
function mpUpdate(dt) {
  // smooth other players toward where they said they are
  // dead reckoning: run each player ahead along their last speed (up to 0.3 s) so they glide instead of stepping
  const k = 1 - Math.exp(-dt * (MP.roomState === 'on' || RT.state === 'on' ? 12 : 4)), now = performance.now();
  for (const e of MP.list) {
    const age = e.rcv ? Math.min(0.3, (now - e.rcv) / 1000) : 0, gx = e.tx + (e.vx || 0) * age, gz = e.tz + (e.vz || 0) * age;
    if (Math.hypot(gx - e.x, gz - e.z) > 25) { e.x = gx; e.z = gz; }
    else { e.x += (gx - e.x) * k; e.z += (gz - e.z) * k; }
    e.facing += angDiff(e.facing, e.tf) * k; e.attackAnim = Math.max(0, (e.attackAnim || 0) - dt * 3);
  }
  rtUpdate(dt);
  if (typeof pvpFlush === 'function') pvpFlush(dt);
  if (typeof partyUpdate === 'function') partyUpdate(dt);
  if (!G.started) return;
  MP.sendT -= dt; MP.dbT -= dt; MP.dbBeat -= dt;
  // room: ~8 times a second, only when something changed
  if (MP.room && MP.roomState === 'on' && MP.sendT <= 0) {
    MP.sendT = 0.12;
    const s = mpState(), key = JSON.stringify(Object.assign({}, s, { t: 0 }));
    if (key !== MP.last) { MP.last = key; s.t = Date.now(); MP.sent++; MP.room.presence(s).catch((e) => { MP.err = 'presence ' + (e && e.code); }); }
  }
  // database: about once a second while you move, plus a beacon every 20 s so standing players stay visible
  if (MP.dbDoc && MP.dbState !== 'off' && !MP.dbBusy && MP.dbT <= 0) {
    MP.dbT = 1.1 + MP.dbBackoff;
    const s = mpState(), key = JSON.stringify(Object.assign({}, s, { s: 0, t: 0 }));
    if (key !== MP.dbLast || MP.dbBeat <= 0) {
      MP.dbLast = key; MP.dbBeat = 20; s.t = Date.now(); MP.dbBusy = true;
      const body = { s: { [MP.sid]: s } };
      MP.dbDoc.update(body).catch((e) => (e && e.code === 'invalid_argument' ? MP.dbDoc.set(body) : Promise.reject(e)))
        .then(() => { MP.dbSent++; MP.dbBackoff = 0; if (MP.dbState === 'connecting') MP.dbState = 'on'; })
        .catch((e) => { MP.err = 'db write ' + (e && e.code); if (e && e.code === 'resource_exhausted') MP.dbBackoff = Math.min(8, MP.dbBackoff + 2); else if (e && e.code === 'invalid_argument') { MP.dbState = 'readonly'; MP.dbDoc = null; } })
        .finally(() => { MP.dbBusy = false; });
    }
  }
  if ((MP.gcT = (MP.gcT || 0) - dt) <= 0) { MP.gcT = 5; mpRebuild(); }
}
function mpCount() { return MP.list.length; }
function mpSummary() { const n = mpCount(); return MP.state === 'off' ? 'Offline in this view' : n ? `${n} other player${n > 1 ? 's' : ''} online` : 'Only you right now'; }
function mpGoTo(key) {
  const e = MP.peers.get(key), pl = G.player, p = G.profile; if (!e || G.mode !== 'hub' || G.rift) return;
  if (e.md !== 'hub') { toast(`${e.nick} is in the Rift or a match right now`, 'bad'); return; }
  const zn = CFG.world.zones[zoneAt(e.x, e.z)]; if (p.level < zn.minLevel) { toast(`${zn.name} needs level ${zn.minLevel}`, 'bad'); return; }
  pl.x = e.x + 2; pl.z = e.z - 1.5; pl.invulnT = 1; G.zoneIdx = zoneAt(pl.x, pl.z);
  ev({ t: 'teleport', name: `Joined ${e.nick}`, x: pl.x, z: pl.z }); UI.close();
}
function openPlayers() {
  UI.current = 'players';
  const pl = G.player, rows = MP.list.map((e) => {
    const zn = e.md === 'hub' ? CFG.world.zones[zoneAt(e.x, e.z)].name : e.md === 'rift' ? 'In the Rift' : 'In a match';
    const d = Math.round(Math.hypot(e.x - pl.x, e.z - pl.z)), B = CFG.brawlers[e.cls];
    return `<div class="item"><div class="meta"><div class="slot">${escHtml(zn)}${e.md === 'hub' ? ` · ${d} m` : ''}</div><div class="nm">${escHtml(e.nick)} <em>Lv ${e.level}</em></div><div class="st">${B.name} · ${CFG.attacks[e.cls].name}</div></div>${e.md === 'hub' ? `<button class="primary" data-act="mpGo" data-k="${escHtml(e.key)}">Go to</button>` : ''}</div>`;
  }).join('');
  const st = (x) => ({ on: 'connected', connecting: 'connecting…', off: 'not available here', none: 'starting…', readonly: 'read only' })[x] || x;
  openModal(`<div class="npcHead">${gi('m_players', 'hd')}<h3>Fellow Adventurers</h3><span class="cnt">${mpSummary()}</span></div>
    ${rows ? `<div class="list">${rows}</div>` : `<p class="say">No one else is in the lobby right now. Open the game on a second device or send a friend the link, and they show up here and on your minimap.</p>`}
    <div class="mpdiag"><b>Connection</b><small>${RT.state !== 'off' ? `Lobby: ${st(RT.state === 'joining' ? 'connecting' : RT.state)}${RT.state === 'on' ? ` · ${RT.present + 1} of ${MP_ROOM_CAP} here · sent ${RT.sent}${MOB.on ? ` · shared monsters: sent ${MOB.sent}, got ${MOB.got}, hits ${MOB.hits} · boss: ${bossLeading() ? 'you run it' : 'mirrored'} (${BOSS.sent}/${BOSS.got})` : ''}` : ''}${MP.err ? ` · last error: ${escHtml(MP.err)}` : ''}</small>` : `Live room: ${st(MP.roomState)}${MP.roomState === 'on' ? ` · ${MP.roomPeers} here` : ''} · Shared world: ${st(MP.dbState)}${MP.dbState !== 'off' ? ` · ${MP.dbPeers} seen` : ''} · sent ${MP.sent + MP.dbSent}${MP.err ? ` · last error: ${escHtml(MP.err)}` : ''}</small>`}
    ${RT.state !== 'off' ? `<small>Everyone playing the game online meets in this lobby. Your nickname, hero and level are shared, nothing else.</small>` : `<small>Same account on two devices works. Friends join when you invite them by email from the Share menu; people who open a public link can watch others but may not appear themselves.</small>`}</div>`);
}

