// --- Bastion worlds: a fort other players join with its code, even while its owner is away. The world (wave, land,
// buildings) lives on the server (Supabase RPCs create_world / load_world / save_world, supabase/bastion_worlds.sql);
// gold and Bastion Stones stay each player's own. Inside, everyone shares one Realtime channel 'fort-<code>'
// (mpRoomKey). The host, the player who has been in the fort longest, runs the waves, monsters and defenders, sends
// the state 4 times a second ('fst') and the buildings when they change ('fw'), and saves the world. Guests mirror it:
// their hits on monsters go to the host ('fhit'), the host's monsters hit them ('fpd'), and what they build is asked of
// the host ('fbq', answered by 'fbr'; a refusal pays back). Each wave pays every player ('fclr'). When the host leaves,
// the next in line takes over with the fort as it is. Local previews, ×100 test mode and the Claude cloud keep worlds
// in this browser only.
const FW = { ft: 0, host: null, wasHost: true, dirty: false, wT: 0, sendT: 0, saveT: -1, saving: false, ask: new Map(), rid: 0, hits: new Map(), hitT: 0, mm: new Map(), sig: '' };
const fortOnline = () => !LOCAL_PREVIEW && !TEST_MODE && Cloud.kind === 'supa' && Cloud.state === 'on';
const fortCodeOk = (c) => typeof c === 'string' && /^[A-Z0-9-]{4,12}$/.test(c);
const worldPart = (F) => ({ wave: F.wave, land: F.land, b: F.b });
const FortApi = {
  all() { try { return JSON.parse(localStorage.getItem('aa-fort-worlds') || '{}') || {}; } catch (e) { return {}; } },
  put(all) { try { localStorage.setItem('aa-fort-worlds', JSON.stringify(all)); } catch (e) { /* private mode: the world lives this session */ } },
  async create(F) {
    if (!fortOnline()) { const all = this.all(), code = 'D' + newCode(); all[code] = { fort: worldPart(F), wave: F.wave }; this.put(all); return code; }
    const d = supaDevice(), r = await supaRpc('create_world', { p_id: d.id, p_secret: d.secret, p_fort: worldPart(F) });
    return fortCodeOk(r) ? r : null;
  },
  async load(code) {
    if (!fortOnline()) return this.all()[code] || null;
    return supaRpc('load_world', { p_code: code });
  },
  async save(code, F) {
    if (!fortOnline()) { const all = this.all(), w = all[code]; all[code] = { fort: worldPart(F), wave: Math.max(F.wave, (w && w.wave) || 1) }; this.put(all); return; }
    return supaRpc('save_world', { p_code: code, p_fort: worldPart(F), p_wave: F.wave });
  },
};
// enter your own world: made on the server the first time, then whatever friends built while you were away comes back
async function siegeEnterOwn() {
  const M = myFort();
  try {
    if (!M.code) { const code = await FortApi.create(M); if (code) { M.code = code; G.dirty = true; } }
    else {
      const w = await FortApi.load(M.code);
      if (w && w.fort) { const s = sanitizeFort(w.fort, false); M.b = s.b; M.land = Math.max(M.land || 0, s.land); M.wave = Math.max(M.wave || 1, (w.wave | 0) || s.wave); } // the server's wave, not the one inside the fort data
    }
  } catch (e) { toast('Your fort is offline this time: friends can not join', 'bad'); }
  return startSiege(M.code ? { code: M.code, fort: M } : null);
}
async function siegeJoin(code) {
  code = String(code || '').trim().toUpperCase();
  if (!fortCodeOk(code)) { toast('That is not a fort code', 'bad'); return false; }
  if (code === myFort().code) return siegeEnterOwn();
  let w = null; try { w = await FortApi.load(code); } catch (e) { w = null; }
  if (!w || !w.fort) { toast('No fort with that code', 'bad'); return false; }
  const fort = sanitizeFort(w.fort, false); fort.wave = (w.wave | 0) || fort.wave;
  const M = myFort(); M.recent = [code].concat((M.recent || []).filter((c) => c !== code)).slice(0, 5); G.dirty = true;
  return startSiege({ code, fort });
}
// --- who runs the fort
function siegeMpPeers() { const S = G.siege; return S && S.code && RT.state === 'on' ? MP.list.filter((e) => e.via === 'rt' && e.md === 'siege' && e.fc === S.code) : []; }
function siegeHostSid() {
  let best = MP.sid, bt = FW.ft;
  for (const e of siegeMpPeers()) if (e.ft && (e.ft < bt || (e.ft === bt && e.key < best))) { best = e.key; bt = e.ft; }
  return best;
}
// a guest mirrors the host (the earliest in); the host is whoever entered first
function siegeFollowing() { const S = G.siege; return !!S && !!S.code && RT.state === 'on' && siegeHostSid() !== MP.sid; }
// just after entering a shared fort, hold it still a moment to hear whether someone is already running it
const siegeMpWaiting = () => RT.state === 'on' && Date.now() - FW.ft < 2500 && !siegeMpPeers().length;
function fortSend(event, payload) { return RT.state === 'on' && rtSend(RT.topic, 'broadcast', { type: 'broadcast', event, payload: Object.assign({ sid: MP.sid }, payload) }); }
// the fort was changed here: the host tells the guests and saves the world a moment later
function siegeMpChanged() { const S = G.siege; if (!S || !S.code || siegeFollowing()) return; FW.dirty = true; if (FW.saveT < 0) FW.saveT = 3; }
function siegeMpCleared(n, lvl, wagons, mini) { if (G.siege && G.siege.code) fortSend('fclr', { w: n, lvl, wg: wagons, mn: mini ? 1 : 0 }); }
function siegeMpGo() { fortSend('fgo', { to: siegeHostSid() }); }
function siegeMpAsk(op, pr) {
  const b = op.k != null ? fortState().b[op.k] : null, rid = ++FW.rid;
  FW.ask.set(rid, { pr, at: G.time });
  fortSend('fbq', { to: siegeHostSid(), rid, op: b ? { o: op.o, t: b.t, x: b.x, z: b.z } : op });
}
// a shared fort was entered: the clock decides who runs it (the earliest in)
function siegeMpStart() { Object.assign(FW, { ft: Date.now(), host: null, wasHost: true, dirty: false, wT: 0, sendT: 0, saveT: -1, sig: '' }); FW.ask.clear(); FW.hits.clear(); FW.mm.clear(); }
function siegeMpEnd(why) { const S = G.siege; if (S && S.code && why === 'keep' && !siegeFollowing()) fortSend('fend', {}); if (S && S.code && !siegeFollowing()) siegeMpSave(); FW.mm.clear(); FW.ask.clear(); FW.host = null; FW.ft = 0; }
function siegeMpSave() {
  const S = G.siege; if (!S || !S.code || FW.saving) return;
  FW.saving = true; FW.saveT = -1;
  Promise.resolve(FortApi.save(S.code, fortState())).catch(() => { FW.saveT = 10; }).finally(() => { FW.saving = false; });
}
// guests' monsters: a hit on the host's monster goes to the host as a share of its HP
function siegeMpMobHit(t, amt) { FW.hits.set(t.hid, (FW.hits.get(t.hid) || 0) + amt / t.maxHp); if (t.hp <= 0) FW.hitT = 0; }
function siegeMpPeerNear(e, near) { if (siegeFollowing()) return null; let best = null, bd = near; for (const q of siegeMpPeers()) if (q.alive) { const d = Math.hypot(q.x - e.x, q.z - e.z); if (d < bd) { bd = d; best = q; } } return best; }
function siegeMpHitPeer(q, amt) { fortSend('fpd', { to: q.key, f: Math.round(amt / refHp(G.siege.lvl) * 10000) / 10000 }); }
const FW_TYPES = Object.keys(FORT_TYPES);
const fwPack = (F) => F.b.map((b) => [FW_TYPES.indexOf(b.t), b.x, b.z, b.l, b.d || 0, b.c || 0]);
// called every step of the fort; true = this game is a guest and the host's state was mirrored instead of simulated
function siegeMpStep(dt) {
  const S = G.siege; if (!S.code) return false;
  if (siegeMpWaiting()) return true;
  const following = siegeFollowing(), host = !following;
  if (host !== FW.wasHost) { FW.wasHost = host; if (host) siegeMpPromote(); else siegeMpDemote(); }
  if (host) {
    if ((FW.sendT -= dt) <= 0) { FW.sendT = 0.25; siegeMpSendState(); }
    if (FW.dirty || (FW.wT -= dt) <= 0) { FW.dirty = false; FW.wT = 8; const F = fortState(); fortSend('fw', { b: fwPack(F), w: F.wave, ld: F.land }); }
    if (FW.saveT >= 0 && (FW.saveT -= dt) <= 0) siegeMpSave();
    return false;
  }
  // guest: timers run on between the host's messages, towers draw their shots, hits go out 5 times a second
  if (S.phase !== 'fight') S.t = Math.max(0, S.t - dt);
  for (const o of S.objs) { o.flashT -= dt; o.hurtT -= dt; }
  stepSiegeDefenders(dt, true);
  if ((FW.hitT -= dt) <= 0) { FW.hitT = 0.2; if (FW.hits.size) { fortSend('fhit', { to: siegeHostSid(), h: [...FW.hits].map(([i, f]) => [i, Math.round(Math.min(1, f) * 10000) / 10000]) }); FW.hits.clear(); } }
  for (const [rid, a] of FW.ask) if (G.time - a.at > 8) { FW.ask.delete(rid); fortPay(a.pr, -1); toast('The host did not answer: paid back', 'bad'); }
  return true;
}
function siegeMpSendState() {
  const S = G.siege, ph = S.phase === 'build' ? 0 : S.phase === 'fight' ? 1 : 2;
  const m = S.mobs.slice(0, 90).map((e) => [e.id, e.type, e.zi | 0, Math.round(e.x * 10), Math.round(e.z * 10), e.alive ? Math.max(1, Math.round(e.hp / e.maxHp * 1000)) : 0,
    Math.round((e.facing || 0) * 100), Math.round((e.moveAmt || 0) * 10), (e.attackAnim || 0) > 0.3 ? 1 : 0, (e.elite ? 1 : 0) | (e.bossName === 'Siege Lord' ? 2 : 0) | (e.miniBoss ? 4 : 0)]);
  fortSend('fst', { w: S.wave, ph, t: Math.round(S.t * 10) / 10, tm: S.tMax, lvl: S.lvl, sd: S.sides, mn: S.mini ? 1 : 0,
    o: S.objs.map((o) => (o.alive ? Math.max(1, Math.round(o.hp / o.maxHp * 1000)) : 0)), dn: S.units.map((u, i) => (u.alive ? -1 : i)).filter((i) => i >= 0), m });
}
// this game takes over as host: the mirrored monsters become real ones where they stand
function siegeMpPromote() {
  const S = G.siege; FW.mm.clear(); FW.host = MP.sid;
  for (const e of S.mobs) { e.mirror = false; e.own = null; e.state = 'chase'; e.tgt = null; e.tgtT = 0; }
  S.queue = S.queue || [];
}
// someone else runs the fort now: our own monsters go, the host's come in through 'fst'
function siegeMpDemote() { clearSiegeMobs(); FW.mm.clear(); clearProjectiles(); }
function siegeMpRecv(event, sid, P) {
  const S = G.siege; if (!S || !S.code) return;
  const isHost = !siegeFollowing();
  if (event === 'fpd') { if (P.to === MP.sid && G.player.alive) dealDamage(G.player, clamp(mpNum(P.f, 0), 0, 1) * G.player.maxHp, -1, {}); return; }
  if (event === 'fbr') { if (P.to !== MP.sid) return; const a = FW.ask.get(P.rid); if (!a) return; FW.ask.delete(P.rid); if (!P.ok) { fortPay(a.pr, -1); toast((typeof P.why === 'string' ? P.why.slice(0, 60) : 'Could not build') + ': paid back', 'bad'); } else Sfx.play('unlock'); return; }
  if (isHost) {
    if (P.to !== MP.sid) return;
    if (event === 'fgo') startSiegeWave();
    else if (event === 'fhit' && Array.isArray(P.h)) for (const [i, f] of P.h) { const e = S.mobs.find((q) => q.id === i); if (e && e.alive) { e.hp -= clamp(mpNum(f, 0), 0, 1) * e.maxHp; e.flashT = CFG.combat.hitFlash; e.lastHurt = G.time; if (e.hp <= 0) { e.hp = 0; killEntity(e, null); } } }
    else if (event === 'fbq' && P.op && typeof P.op === 'object') {
      const op = { o: String(P.op.o), t: String(P.op.t), x: P.op.x | 0, z: P.op.z | 0 };
      if (op.o !== 'add') op.k = fortState().b.findIndex((b) => b.t === op.t && b.x === op.x && b.z === op.z);
      const why = op.o === 'add' && !FORT_TYPES[op.t] ? 'Unknown building' : op.k < 0 ? 'Gone' : fortApply(op);
      fortSend('fbr', { to: sid, rid: P.rid, ok: !why, why });
    }
    return;
  }
  // a guest listens to the host only
  FW.host = siegeHostSid(); if (sid !== FW.host) return;
  if (event === 'fw' && Array.isArray(P.b)) {
    const F = fortState(), sig = JSON.stringify(P.b); F.wave = Math.max(F.wave || 1, mpNum(P.w, 1) | 0);
    if (sig === FW.sig) return; FW.sig = sig;
    const list = sanitizeFort({ b: P.b.map((r) => ({ t: FW_TYPES[r[0]], x: r[1], z: r[2], l: r[3], d: r[4], c: r[5] })) }, false).b;
    F.b = list; siegeLayout(); siegeScaleObjs(S.lvl);
  } else if (event === 'fst') siegeMpMirror(P);
  else if (event === 'fclr') { const n = mpNum(P.w, 0) | 0; if (n > S.cleared) { siegeReward(n, mpNum(P.lvl, S.lvl) | 0, clamp(mpNum(P.wg, 0) | 0, 0, 2), !!P.mn); const F = fortState(); F.wave = Math.max(F.wave || 1, n + 1); } }
  else if (event === 'fend') endSiege('keep');
}
function siegeMpMirror(P) {
  const S = G.siege, lvl = clamp(mpNum(P.lvl, S.lvl) | 0, 1, 100000), ph = ['build', 'fight', 'clear'][mpNum(P.ph, 0) | 0] || 'build';
  if (lvl !== S.lvl) { S.lvl = lvl; siegeScaleObjs(lvl); }
  if (ph === 'build' && S.phase !== 'build') { clearSiegeMobs(); FW.mm.clear(); }
  if (ph === 'fight' && S.phase === 'build') ev({ t: 'siegeWave', wave: mpNum(P.w, S.wave) | 0, lvl, boss: (mpNum(P.w, 0) | 0) % CFG.siege.bossEvery === 0, mini: !!P.mn, count: (P.m || []).length, theme: '', sides: siegeSideNames(Array.isArray(P.sd) ? P.sd.filter((i) => i >= 0 && i < 4) : []) });
  S.wave = Math.max(1, mpNum(P.w, S.wave) | 0); S.phase = ph; S.t = mpNum(P.t, S.t); S.tMax = mpNum(P.tm, S.tMax) || 1; S.mini = !!P.mn;
  if (Array.isArray(P.sd)) S.sides = P.sd.filter((i) => i >= 0 && i < 4);
  let grid = false;
  if (Array.isArray(P.o)) S.objs.forEach((o, i) => { const f = mpNum(P.o[i], 1000) / 1000, alive = f > 0; if (alive !== o.alive) { grid = true; o.alive = alive; if (!alive) ev({ t: 'objectiveDown', name: o.name, main: !!o.def.main, x: o.x, z: o.z }); } if (alive && f * o.maxHp < o.hp - 1) { o.flashT = 0.12; o.hurtT = 1.2; } o.hp = f * o.maxHp; });
  const dn = new Set(Array.isArray(P.dn) ? P.dn : []);
  S.units.forEach((u, i) => { const alive = !dn.has(i); if (alive !== u.alive) { grid = true; u.alive = alive; u.hp = alive ? u.maxHp : 0; if (!alive) ev({ t: 'fortBroken', type: u.b.t, x: u.x, z: u.z }); } });
  if (grid) siegeGrid();
  // the host's monsters: new ones appear where it says, gone ones leave, the rest glide (mobRemoteStep)
  const seen = new Set();
  for (const r of Array.isArray(P.m) ? P.m : []) {
    if (!Array.isArray(r) || r.length < 10 || !CFG.enemies[r[1]]) continue;
    const id = r[0], x = mpNum(r[3], 0) / 10, z = mpNum(r[4], 0) / 10, hp = mpNum(r[5], 0) / 1000; seen.add(id);
    let e = FW.mm.get(id);
    if (!e) {
      if (hp <= 0) continue;
      const zi = clamp(r[2] | 0, 0, CFG.world.zones.length - 1);
      e = r[9] & 6 ? makeChampion(r[1], zi, lvl + 1, r[9] & 2 ? 2 : 1, !!(r[9] & 2)) : makeEnemy(r[1], zi, { elite: !!(r[9] & 1) });
      delete e.rift; delete e.riftLvl; if (r[9] & 2) e.bossName = 'Siege Lord'; else if (r[9] & 4) { e.bossName = 'Siege Captain'; e.miniBoss = true; }
      e.siege = true; e.temp = true; e.mirror = true; e.hid = id; setEnemyLevel(e, r[9] & 2 ? lvl + 2 : r[9] & 4 ? lvl + 1 : lvl);
      e.x = e.sx = x; e.z = e.sz = z; G.enemies.push(e); S.mobs.push(e); FW.mm.set(id, e);
    }
    e.sx = x; e.sz = z; e.sf = mpNum(r[6], 0) / 100; e.moveAmt = clamp(mpNum(r[7], 0) / 10, 0, 1); if (r[8]) e.attackAnim = 1;
    if (hp <= 0) { if (e.alive) { e.alive = false; e.hp = 0; ev({ t: 'die', x: e.x, z: e.z, kind: e.type, elite: !!e.elite }); } }
    else if (e.alive) { const want = Math.max(1, hp * e.maxHp); if (want < e.hp || G.time - (e.lastHurt || -9) > 0.8) e.hp = want; }
  }
  for (const [id, e] of FW.mm) if (!seen.has(id)) { FW.mm.delete(id); G.enemies = G.enemies.filter((q) => q !== e); S.mobs = S.mobs.filter((q) => q !== e); G.ents.delete(e.id); }
}
