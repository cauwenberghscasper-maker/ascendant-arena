// ---------------------------------------------------------------------
// Parties and matchmaking for the Dungeon mode (36b-delve.js). Up to 4 real players: a party can always go in
// short-handed (even alone) when the team power is met; computer heroes fill the empty places (36d-delve-bots.js). A party is its own Realtime channel (mpRoomKey →
// 'party-<code>'): presence carries each member's card (join time, Power, ready, the leader's pick), and the leader's
// 'dgo' starts the same seeded run in every member's game. Random match waits in 'dq-<dungeon>-<difficulty>'; the
// earliest player there forms a party of 4, or of whoever came after 40 s, and sends 'mmgo'. While in a party the open
// world shows only your party. Test mode and the Claude artifact play alone (no Realtime there).
// ---------------------------------------------------------------------
const PARTY = { code: '', jt: 0, ready: false, dg: CFG.delve.dungeons[0].id, df: 0, q: '', qT: 0, joinT: 0, uiT: 0, lastErr: '' };
const PARTY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', PARTY_WAIT = 40;
const partyOnline = () => !TEST_MODE && (RT.state === 'on' || RT.state === 'joining' || RT.state === 'connecting');
function partyRoomKey() { return PARTY.q ? 'dq-' + PARTY.q : PARTY.code ? 'party-' + PARTY.code : ''; }
function partyCard() { return { pc: PARTY.code, jt: PARTY.jt, pw: Math.round(playerPower()), rd: PARTY.ready ? 1 : 0, dg: PARTY.dg, df: PARTY.df, dr: delveOn() ? G.dungeon.delve.seed : 0, qk: PARTY.q }; }
function partySend(event, payload) { return RT.state === 'on' && rtSend(RT.topic, 'broadcast', { type: 'broadcast', event, payload: Object.assign({ sid: MP.sid }, payload) }); }
const newCode = () => Array.from({ length: 5 }, () => PARTY_CHARS[Math.floor(Math.random() * PARTY_CHARS.length)]).join('');
function meCard() { const p = G.profile; return { key: MP.sid, me: true, nick: mpNick(p), cls: p.cls, level: p.level, pw: Math.round(playerPower()), rd: PARTY.ready, jt: PARTY.jt, md: delveOn() ? 'delve' : 'hub', alive: G.player.alive }; }
// members: you plus the peers with your code, earliest join first, at most four
function partyMembers() {
  const me = meCard(); if (!PARTY.code) return [me];
  return [me, ...MP.list.filter((e) => e.via === 'rt' && e.pc === PARTY.code)].sort((a, b) => a.jt - b.jt || (a.key < b.key ? -1 : 1)).slice(0, CFG.delve.maxParty);
}
const partyLeader = () => partyMembers()[0];
const iLead = () => !PARTY.code || partyLeader().me;
function partyGateNow() { const def = delveDef(PARTY.dg); return delveGate(def, PARTY.df, partyMembers().map((m) => m.pw)); }
function createParty() { if (!partyOnline()) return toast('Parties need the online game (the public site or the app)', 'bad'); PARTY.code = newCode(); PARTY.jt = Date.now(); PARTY.ready = true; PARTY.q = ''; PARTY.joinT = 0; Sfx.play('unlock'); }
function joinParty(code) {
  code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  if (code.length !== 5) return toast('Party codes have 5 letters and numbers', 'bad');
  if (!partyOnline()) return toast('Parties need the online game (the public site or the app)', 'bad');
  PARTY.code = code; PARTY.jt = Date.now(); PARTY.ready = false; PARTY.q = ''; PARTY.joinT = G.time;
}
function leaveParty(msg) { if (delveOn()) return; PARTY.code = ''; PARTY.ready = false; PARTY.q = ''; PARTY.jt = 0; if (msg) toast(msg, 'bad'); }
function startQueue() {
  const def = delveDef(PARTY.dg), g = delveGate(def, PARTY.df, [Math.round(playerPower())]);
  if (!partyOnline()) return toast('Random match needs the online game (the public site or the app)', 'bad');
  if (!g.ok) return toast(`Random match needs your own Power at ${fmt(g.req)}`, 'bad');
  PARTY.code = ''; PARTY.q = `${def.id}-${PARTY.df}`; PARTY.qT = 0; PARTY.jt = Date.now();
}
const cancelQueue = () => { PARTY.q = ''; PARTY.jt = 0; };
// the leader starts: everyone in the party who is in the open world comes along
function partyStart(solo) {
  const def = delveDef(PARTY.dg), members = solo ? [meCard()] : partyMembers(), g = delveGate(def, PARTY.df, members.map((m) => m.pw));
  if (!delveOpen(def)) return toast(`${def.name} opens at level ${delveMinLevel(def)}`, 'bad');
  if (!g.ok) return toast(g.weak ? `Every hero needs at least ${fmt(g.min)} Power for ${diffDef(PARTY.df).name}` : `Team power ${fmt(g.avg)} of ${fmt(g.req)} needed`, 'bad');
  if (!solo && members.some((m) => !m.me && (!m.rd || m.md !== 'hub' || !m.alive))) return toast('Waiting for everyone to be ready in the open world', 'bad');
  const seed = (Math.random() * 4294967295) >>> 0, keys = members.map((m) => m.key);
  if (!solo && PARTY.code && keys.length > 1) partySend('dgo', { seed, dg: def.id, df: PARTY.df, m: keys });
  UI.close(); if (!startDelve(def.id, PARTY.df, seed, keys.length)) toast('Finish what you are doing first', 'bad');
}
function partyRecv(event, sid, P) {
  if (!G.started) return;
  if (event === 'drev') { const by = cleanNick(P.by) || 'A teammate'; if (P.to === MP.sid) delveReviveMe(by); else delveBotRevive(delveBots().find((b) => b.key === P.to), by); return; }
  if (event === 'dbot') { delveBotsRecv(sid, P); return; }
  if (event === 'dgo') {
    // only the leader of my party starts runs, and only for the members it names
    const L = partyLeader(); if (!PARTY.code || !L || L.key !== sid || !Array.isArray(P.m) || !P.m.includes(MP.sid)) return;
    const def = delveDef(P.dg); PARTY.dg = def.id; PARTY.df = clamp(mpNum(P.df, 0) | 0, 0, 999);
    if (G.modal) UI.close();
    if (!startDelve(def.id, PARTY.df, mpNum(P.seed, 1) >>> 0, Math.min(P.m.length, CFG.delve.maxParty), false)) toast('Your party went in, but you could not follow (finish what you are doing)', 'bad');
    return;
  }
  if (event === 'mmgo') {
    if (!PARTY.q || P.q !== PARTY.q || !Array.isArray(P.m) || !P.m.includes(MP.sid) || typeof P.code !== 'string') return;
    const i = P.m.indexOf(MP.sid), def = delveDef(P.dg);
    PARTY.q = ''; PARTY.code = P.code.slice(0, 5); PARTY.jt = mpNum(P.jt, Date.now()) + i; PARTY.ready = true; PARTY.dg = def.id; PARTY.df = clamp(mpNum(P.df, 0) | 0, 0, 999);
    if (G.modal) UI.close();
    toast(`Matched with ${P.m.length - 1} hero${P.m.length > 2 ? 'es' : ''}!`, 'good');
    startDelve(def.id, PARTY.df, mpNum(P.seed, 1) >>> 0, Math.min(P.m.length, CFG.delve.maxParty), P.m[0] === MP.sid); // the one who formed the match runs the bots
  }
}
function partyUpdate(dt) {
  if (!G.started) return;
  if (PARTY.code && RT.state === 'on' && RT.key === mpRoomKey()) {
    const M = partyMembers(), L = M[0];
    if (!M.some((m) => m.me)) { leaveParty('That party is full (4 heroes)'); return; }
    if (PARTY.joinT && G.time - PARTY.joinT > 8 && M.length < 2) { PARTY.joinT = 0; leaveParty('No party found with that code'); return; }
    if (M.length > 1) PARTY.joinT = 0;
    if (!L.me) { const P = MP.peers.get(L.key); if (P && P.dg) { PARTY.dg = delveDef(P.dg).id; PARTY.df = P.df; } }
  }
  // the matchmaking queue: the earliest player forms the party
  if (PARTY.q && RT.state === 'on' && RT.key === mpRoomKey()) {
    PARTY.qT += dt;
    const Q = [meCard(), ...MP.list.filter((e) => e.via === 'rt' && e.qk === PARTY.q && e.md === 'hub' && e.alive)].sort((a, b) => a.jt - b.jt || (a.key < b.key ? -1 : 1));
    if (Q[0].me && (Q.length >= CFG.delve.maxParty || (PARTY.qT >= PARTY_WAIT && Q.length >= 2))) {
      const m = Q.slice(0, CFG.delve.maxParty).map((x) => x.key), [dg, df] = [PARTY.dg, PARTY.df];
      const msg = { q: PARTY.q, code: newCode(), m, seed: (Math.random() * 4294967295) >>> 0, dg, df, jt: Date.now() };
      partySend('mmgo', msg); partyRecv('mmgo', MP.sid, msg);
    }
  }
  // keep the panel live (not while typing a code)
  if (UI.current === 'delve' && G.modal && (PARTY.uiT -= dt) <= 0) { PARTY.uiT = 1; const a = document.activeElement; if (!a || a.id !== 'dlvCode') openDelvePanel(); }
}
// --- the Dungeons panel ------------------------------------------------------------------------------------------
function openDelvePanel() {
  UI.current = 'delve';
  const p = G.profile, R = delveRec(), def = delveDef(PARTY.dg), top = delveTop(def), di = Math.min(PARTY.df, top), lead = iLead();
  if (di !== PARTY.df) PARTY.df = di;
  const M = partyMembers(), g = delveGate(def, di, M.map((m) => m.pw)), diff = diffDef(di), myPw = Math.round(playerPower());
  const cards = CFG.delve.dungeons.map((d) => {
    const open = delveOpen(d), on = d.id === def.id, best = R.best[d.id];
    return `<button class="dlvCard${on ? ' on' : ''}${open ? '' : ' locked'}" data-act="dlvPick" data-id="${d.id}" ${open && lead ? '' : 'aria-disabled="true"'} style="--bc:${hex6(BIOMES[d.biome].coreColor)};--art:url(assets/ui/delve/${d.id}.webp)">
      <b>${escapeHTML(d.name)}</b><small>${open ? `${escapeHTML(BIOMES[d.biome].name)}${best != null ? ` · best ${diffDef(best).name}` : ''}` : `Opens at level ${delveMinLevel(d)}`}</small></button>`;
  }).join('');
  const nDiffs = Math.max(top + 1, CFG.delve.diffs.length);
  const diffs = Array.from({ length: nDiffs + 1 }, (_, i) => i).filter((i) => i <= top + 1 && i < nDiffs + 1).map((i) => {
    const D = diffDef(i), lock = i > top;
    return `<button class="dlvDiff${i === di ? ' on' : ''}${lock ? ' locked' : ''}" data-act="dlvDiff" data-d="${i}" ${!lock && lead ? '' : 'aria-disabled="true"'} style="--dc:${D.col}"><b>${D.name}</b><small>${lock ? 'Clear the one before' : `${gi('n_dmg')}${fmtK(delveReq(def, i))}`}</small></button>`;
  }).join('');
  const pieces = R.pieces[def.id] || {}, have = SET_SLOTS.filter((s) => pieces[s]).length, wk = delveWeekly(def, di);
  const slot = (m) => m ? `<div class="dlvSlot${m.rd || (m.me && !PARTY.code) ? ' rd' : ''}"><i>${gi(m.me ? 'm_hero' : 'm_players')}</i><b>${escapeHTML(m.nick)}${m.me ? ' (you)' : ''}</b><small>${escapeHTML((CFG.brawlers[m.cls] || {}).name || 'Hero')} · Lv ${fmt(m.level)} · ${fmtK(m.pw)} Power${m.pw < g.min ? ' · too weak' : ''}</small><em>${M[0] === m && PARTY.code ? 'Leader' : m.rd ? 'Ready' : PARTY.code ? 'Not ready' : ''}</em></div>`
    : `<div class="dlvSlot empty"><small>Open slot · a bot fills in</small></div>`;
  const slots = Array.from({ length: CFG.delve.maxParty }, (_, i) => slot(M[i])).join('');
  const q = PARTY.q, online = partyOnline(), qn = q ? 1 + MP.list.filter((e) => e.qk === q).length : 0;
  let buttons;
  if (q) buttons = `<div class="dlvQueue"><div class="spin"></div><b>Looking for heroes · ${qn}/${CFG.delve.maxParty}</b><small>${Math.floor(PARTY.qT)}s · a party forms at 4, or after ${PARTY_WAIT}s with 2 or more</small></div>
    <div class="row end"><button class="ghost" data-act="dlvCancelQ">Cancel</button><button class="primary" data-act="dlvSolo">Go alone now</button></div>`;
  else if (PARTY.code) buttons = `<div class="dlvCode">Party code <b>${PARTY.code}</b><small>Friends type it in Dungeons › Join</small></div>
    <div class="row end"><button class="ghost" data-act="dlvLeave">Leave party</button>${lead ? `<button class="${g.ok ? 'primary' : 'disabled'} big" data-act="dlvStart">Enter ${escapeHTML(def.name)}</button>` : `<button class="${PARTY.ready ? 'ghost' : 'primary'} big" data-act="dlvReady">${PARTY.ready ? 'Not ready' : 'Ready'}</button>`}</div>`;
  else buttons = `<div class="row dlvJoin"><input id="dlvCode" maxlength="5" placeholder="CODE" autocomplete="off" autocapitalize="characters" spellcheck="false" ${online ? '' : 'disabled'}><button class="ghost" data-act="dlvJoin" ${online ? '' : 'aria-disabled="true"'}>Join</button><button class="ghost" data-act="dlvCreate" ${online ? '' : 'aria-disabled="true"'}>Create party</button></div>
    <div class="row end"><button class="ghost" data-act="dlvQueue" ${online ? '' : 'aria-disabled="true"'}>Random match</button><button class="${g.ok ? 'primary' : 'disabled'} big" data-act="dlvSolo">Enter alone</button></div>
    ${online ? '' : `<p class="fine">${TEST_MODE ? 'Test mode plays alone.' : 'Parties and random match work on the public site and in the app.'}</p>`}`;
  openModal(`<div class="npcHead">${gi('m_portal', 'hd')}<h3>Dungeons</h3><span class="cnt">Your Power ${fmtK(myPw)}</span></div>
    <div class="dlvCards">${cards}</div>
    <div class="riftCard dlvInfo"><div class="dlvArt" style="--art:url(assets/ui/delve/${def.id}.webp);--bc:${hex6(BIOMES[def.biome].coreColor)}"><b>${escapeHTML(def.name)}</b><small>Lv ${fmt(delveLevel(def, di))} · ${escapeHTML(diff.name)} · Boss: ${escapeHTML(def.boss)}</small></div><p>${escapeHTML(def.blurb)}</p>
      <p>Each run builds new halls, and some rooms hold an <b>event</b>: a gold goblin, a cursed altar, pressure plates, a spike hall, an echo shrine, a lonely chest or a moonwell. No PvP inside.</p>
      <p class="fine"><b>${escapeHTML(def.set.name)} set</b> (only drops here) · ${have}/5 found · ${delveSetText(def)} · chance per chest ${Math.round(diff.unique * 100)}%${wk ? ' · <b>this week’s first clear: a sure piece</b>' : ''}</p></div>
    <div class="dlvDiffs">${diffs}</div>
    <div class="dlvGate ${g.ok ? 'ok' : 'bad'}">Team power <b>${fmtK(g.avg)}</b> / ${fmtK(g.req)} needed${g.weak ? ` · ${g.weak} hero${g.weak > 1 ? 'es' : ''} below ${fmtK(g.min)}` : ''} · ${diff.items} items, ${escapeHTML(CFG.gear.rarity[diff.floor].name)} or better</div>
    <div class="dlvParty">${slots}</div>
    ${buttons}`);
  $('panel').classList.add('menuPanel');
}
function partyAction(act, b) {
  switch (act) {
    case 'dlvPick': if (iLead()) { PARTY.dg = delveDef(b.dataset.id).id; PARTY.df = Math.min(PARTY.df, delveTop(delveDef(PARTY.dg))); } break;
    case 'dlvDiff': if (iLead()) PARTY.df = Math.max(0, +b.dataset.d | 0); break;
    case 'dlvCreate': createParty(); break;
    case 'dlvJoin': joinParty(($('dlvCode') || {}).value); break;
    case 'dlvLeave': leaveParty(); break;
    case 'dlvReady': PARTY.ready = !PARTY.ready; break;
    case 'dlvQueue': startQueue(); break;
    case 'dlvCancelQ': cancelQueue(); break;
    case 'dlvStart': partyStart(false); return;
    case 'dlvSolo': cancelQueue(); partyStart(true); return;
  }
  if (UI.current === 'delve') openDelvePanel();
}
// the boss chest of a party dungeon (each player's own roll)
function openDelveChest(r) {
  if (!r) return; UI.current = 'dungeonChest'; Sfx.play('win');
  const rows = r.items.map((it) => itemRow(it, '', `${CFG.gear.rarity[it.rarity].name} · item level ${it.ilvl}`)).join('');
  const set = r.set.map((it) => itemRow(it, '', `${escapeHTML(delveDef(it.dset).set.name)} set · only from ${escapeHTML(r.name)}`)).join('');
  openModal(`<div class="center"><div class="eyebrow">${escapeHTML(r.name)} · ${escapeHTML(r.diff)}</div><h2>${r.full ? 'Dungeon chest' : 'Hidden cache'}</h2></div>
    <div class="stats3"><div><b>${r.xp ? '+' + fmtK(r.xp) : '—'}</b><span>XP</span></div><div><b>${ICON.coin}+${fmtK(r.gold)}</b><span>Gold</span></div><div><b>${ICON.ess}${r.gems || 0}</b><span>Gems</span></div></div>
    ${set ? `<h2 class="center">Set piece!</h2><div class="list">${set}</div>` : ''}${r.weekly ? '<p class="say">Weekly first clear: a sure set piece.</p>' : ''}
    ${rows ? `<div class="list">${rows}</div>` : ''}${r.case ? '<p class="fine">A treasure chest was found too: open it in your Inventory.</p>' : ''}
    <div class="row end"><button class="primary big" data-act="close">Nice</button></div>`);
}
// a cache or an event: the interact button inside a party dungeon
function delveAct(n) {
  if (n.kind === 'delveBonus') { const r = delveUse('delveBonus', n.room); if (r) openDelveChest(r); return; }
  delveUse(n.kind);
}
// HUD inside a party dungeon: the room line, the event line and a revive ring
function delveHud() {
  const D = G.dungeon, X = D.delve, b = D.boss, n = D.rooms.length - 1, m = D.rooms[Math.min(D.room, n)], E = CFG.delve.events, s = X.ev[m.i] || {};
  if (!D.bossDead && (D.room === n || D.doors.every((d) => d.open))) Feed.add(`${gi('k_titan')} <b>${escapeHTML(b.champName || X.def.boss)}</b> · ${Math.ceil(clamp(b.hp / b.maxHp, 0, 1) * 100)}%`, 'boss', 'dungeon', 1.2);
  else if (!D.bossDead) Feed.add(`${gi('m_portal')} ${escapeHTML(X.def.name)} · ${escapeHTML(X.diff.name)} · room ${Math.min(D.room + 1, n)}/${n}${m.waves > 1 ? ` · wave ${m.wave + 1}/${m.waves}` : ''} · ${m.mobs.filter((e) => e.alive).length} left`, 'rift', 'dungeon', 1.2);
  if (m.event && !s.done && m.seen) {
    const e = E[m.event], extra = m.event === 'vault' && s.t != null ? ` · ${Math.max(0, Math.ceil(E.vault.time - s.t))}s` : m.event === 'plates' ? ` · ${(X.plates[m.i] || []).filter(Boolean).length}/${clamp(X.n, 1, 4)}` : '';
    if (!((m.event === 'altar' && X.used.altar) || (m.event === 'fountain' && X.used.fountain))) Feed.add(`${gi('m_caseOpen')} <b>${e.name}</b> · ${e.d}${extra}`, 'rift', 'dlvEvent', 1.2);
  }
  if (X.revive) Feed.add(`${gi('m_players')} Reviving <b>${escapeHTML(X.revive.nick || 'ally')}</b> · ${Math.round(X.revive.t / CFG.delve.reviveT * 100)}%`, 'mp', 'dlvRevive', 0.5);
  const bar = $('partyBar'); if (!bar) return;
  const party = delveParty(); bar.hidden = party.length < 2;
  if (party.length > 1 && (X.barT = (X.barT || 0) - 1) <= 0) {
    X.barT = 10;
    bar.innerHTML = party.map((f) => { const hp = f === G.player || f.delveBot ? clamp(f.hp / f.maxHp, 0, 1) : clamp(f.hp, 0, 1), dn = f.alive === false;
      return `<div class="pb${dn ? ' down' : ''}"><b>${escapeHTML(f === G.player ? mpNick(G.profile) : f.nick)}</b><i style="width:${Math.round((dn ? 0 : hp) * 100)}%"></i>${dn ? '<small>down</small>' : ''}</div>`; }).join('');
  }
}
// --- end parties
