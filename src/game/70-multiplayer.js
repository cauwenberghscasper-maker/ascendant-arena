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
function cleanNick(s) { return String(s || '').replace(/[^\p{L}\p{N} _.\-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14); }
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
// broadcast 'st' carries movement about 4 times a second while something changes, plus a beat every 3 s.
const MP_ROOM_CAP = 60;
function mpRoomKey() { return LOCAL_PREVIEW ? 'dev-lobby' : 'lobby'; }
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
if (LOCAL_PREVIEW) window.__mp = { MP, RT, roomKey: () => mpRoomKey() };
function rtLeave() { if (RT.topic) rtSend(RT.topic, 'phx_leave', {}); RT.state = 'off'; if (RT.ws) RT.ws.close(); }
function rtCount() { mpRebuild(); RT.present = MP.list.filter((e) => e.via === 'rt').length; }
function rtDropPeers() { for (const [k, e] of MP.peers) if (e.via === 'rt') MP.peers.delete(k); RT.present = 0; mpRebuild(); }
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
    case 'broadcast': if (P.event === 'st' && P.payload && typeof P.payload.sid === 'string') { mpApply(P.payload.sid.slice(0, 16), P.payload, 'rt', false); if (!MP.list.includes(MP.peers.get(P.payload.sid.slice(0, 16)))) mpRebuild(); } break;
    case 'phx_error': case 'phx_close': if (RT.state !== 'off') { RT.topic = ''; rtDropPeers(); RT.state = 'connecting'; RT.retry = RT.backoff; RT.backoff = Math.min(30, RT.backoff * 2); } break;
  }
}
// presence holds the slow-changing card (nick, hero, level, mode); it is re-sent only when one of those changes
function rtTrack() {
  const s = mpState(), card = [s.n, s.c, s.l, s.md, s.al].join('|'); if (card === RT.tracked) return;
  RT.tracked = card; s.t = Date.now(); rtSend(RT.topic, 'presence', { type: 'presence', event: 'track', payload: s });
}
function rtUpdate(dt) {
  if (RT.state === 'off' || RT.state === 'none') return;
  if (!RT.ws) { if ((RT.retry -= dt) <= 0) rtConnect(); return; }
  if ((RT.hbT -= dt) <= 0) { RT.hbT = 25; rtSend('phoenix', 'heartbeat', {}, null); }
  if (RT.ws.readyState === 1 && !RT.topic && (RT.retry -= dt) <= 0) rtJoin(mpRoomKey());
  if (RT.state !== 'on' || !G.started) return;
  if (mpRoomKey() !== RT.key) { rtJoin(mpRoomKey()); return; } // partition change: move to the new room
  RT.sendT -= dt; RT.beatT -= dt;
  if (RT.sendT > 0) return;
  RT.sendT = 0.25; rtTrack();
  const s = mpState(), key = JSON.stringify(Object.assign({}, s, { t: 0 }));
  if (key !== RT.last || RT.beatT <= 0) { RT.last = key; RT.beatT = 3; s.t = Date.now(); if (rtSend(RT.topic, 'broadcast', { type: 'broadcast', event: 'st', payload: s })) RT.sent++; }
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
    if (G.started && s.n) Feed.add(`${gi('m_players')} <b>${escHtml(cleanNick(s.n) || 'A hero')}</b> is in the world`, 'mp', null, 5);
  }
  e.t = t; e.seenAt = Date.now(); e.via = via;
  e.cls = cls; e.tx = x; e.tz = z; e.tf = mpNum(s.f, 0); e.moveAmt = clamp(mpNum(s.m, 0), 0, 1);
  e.level = clamp(Math.floor(mpNum(s.l, 1)), 1, 100000); e.nick = cleanNick(s.n) || 'Hero'; e.md = s.md === 'hub' ? 'hub' : s.md === 'rift' ? 'rift' : 'away';
  e.alive = s.al !== 0; e.hp = clamp(mpNum(s.h, 1), 0, 1); e.maxHp = 1; e.aim = mpNum(s.a, 0);
  const sq = mpNum(s.s, 0);
  if (sq !== e.seq) { if (sq > e.seq && sq - e.seq < 6 && e.md === 'hub') mpGhostShot(e); e.seq = sq; }
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
function mpVisible() { return G.mode === 'hub' && !G.rift ? MP.list.filter((e) => e.md === 'hub') : []; }
function mpOnShot(f, dx, dz) { if (f.isPlayer && G.mode === 'hub') { MP.seq++; MP.aim = Math.atan2(dx, dz); } }
function mpState() {
  const p = G.profile, pl = G.player, r1 = (v) => Math.round(v * 10) / 10;
  return { v: 8, sid: MP.sid, n: mpNick(p), c: p.cls, l: p.level, x: r1(pl.x), z: r1(pl.z), f: Math.round(pl.facing * 100) / 100, m: r1(pl.moveAmt || 0), s: MP.seq, a: Math.round(MP.aim * 100) / 100,
    h: Math.round(clamp(pl.hp / pl.maxHp, 0, 1) * 100) / 100, al: pl.alive ? 1 : 0, md: G.rift ? 'rift' : G.dungeon ? 'dungeon' : G.mode };
}
function mpUpdate(dt) {
  // smooth other players toward where they said they are
  const k = 1 - Math.exp(-dt * (MP.roomState === 'on' || RT.state === 'on' ? 8 : 4));
  for (const e of MP.list) {
    if (Math.hypot(e.tx - e.x, e.tz - e.z) > 25) { e.x = e.tx; e.z = e.tz; }
    else { e.x += (e.tx - e.x) * k; e.z += (e.tz - e.z) * k; }
    e.facing += angDiff(e.facing, e.tf) * k; e.attackAnim = Math.max(0, (e.attackAnim || 0) - dt * 3);
  }
  rtUpdate(dt);
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
  const zn = CFG.world.zones[zoneAt(e.z)]; if (p.level < zn.minLevel) { toast(`${zn.name} needs level ${zn.minLevel}`, 'bad'); return; }
  pl.x = e.x + 2; pl.z = e.z - 1.5; pl.invulnT = 1; G.zoneIdx = zoneAt(pl.z);
  ev({ t: 'teleport', name: `Joined ${e.nick}`, x: pl.x, z: pl.z }); UI.close();
}
function openPlayers() {
  UI.current = 'players';
  const pl = G.player, rows = MP.list.map((e) => {
    const zn = e.md === 'hub' ? CFG.world.zones[zoneAt(e.z)].name : e.md === 'rift' ? 'In the Rift' : 'In a match';
    const d = Math.round(Math.hypot(e.x - pl.x, e.z - pl.z)), B = CFG.brawlers[e.cls];
    return `<div class="item"><div class="meta"><div class="slot">${escHtml(zn)}${e.md === 'hub' ? ` · ${d} m` : ''}</div><div class="nm">${escHtml(e.nick)} <em>Lv ${e.level}</em></div><div class="st">${B.name} · ${CFG.attacks[e.cls].name}</div></div>${e.md === 'hub' ? `<button class="primary" data-act="mpGo" data-k="${escHtml(e.key)}">Go to</button>` : ''}</div>`;
  }).join('');
  const st = (x) => ({ on: 'connected', connecting: 'connecting…', off: 'not available here', none: 'starting…', readonly: 'read only' })[x] || x;
  openModal(`<div class="npcHead">${gi('m_players', 'hd')}<h3>Fellow Adventurers</h3><span class="cnt">${mpSummary()}</span></div>
    ${rows ? `<div class="list">${rows}</div>` : `<p class="say">No one else is in the lobby right now. Open the game on a second device or send a friend the link, and they show up here and on your minimap.</p>`}
    <div class="mpdiag"><b>Connection</b><small>${RT.state !== 'off' ? `Lobby: ${st(RT.state === 'joining' ? 'connecting' : RT.state)}${RT.state === 'on' ? ` · ${RT.present + 1} of ${MP_ROOM_CAP} here · sent ${RT.sent}` : ''}${MP.err ? ` · last error: ${escHtml(MP.err)}` : ''}</small>` : `Live room: ${st(MP.roomState)}${MP.roomState === 'on' ? ` · ${MP.roomPeers} here` : ''} · Shared world: ${st(MP.dbState)}${MP.dbState !== 'off' ? ` · ${MP.dbPeers} seen` : ''} · sent ${MP.sent + MP.dbSent}${MP.err ? ` · last error: ${escHtml(MP.err)}` : ''}</small>`}
    ${RT.state !== 'off' ? `<small>Everyone playing the game online meets in this lobby. Your nickname, hero and level are shared, nothing else.</small>` : `<small>Same account on two devices works. Friends join when you invite them by email from the Share menu; people who open a public link can watch others but may not appear themselves.</small>`}</div>`);
}

