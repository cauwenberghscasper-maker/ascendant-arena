// ---------------------------------------------------------------------
// 9. UI — HUD, panels, nametags, damage numbers, coach marks
// ---------------------------------------------------------------------
const ICON = {
  coin: '<svg viewBox="0 0 20 20" class="ic"><circle cx="10" cy="10" r="8" fill="#ffc94a" stroke="#b07a12" stroke-width="2"/><rect x="8.5" y="5.5" width="3" height="9" rx="1" fill="#b07a12"/></svg>',
  trophy: '<svg viewBox="0 0 20 20" class="ic"><path d="M5 3h10v4a5 5 0 0 1-10 0z" fill="#ffd34a" stroke="#a8781a" stroke-width="1.5"/><path d="M5 5H2.5a2.5 2.5 0 0 0 3 3.5M15 5h2.5a2.5 2.5 0 0 1-3 3.5" fill="none" stroke="#a8781a" stroke-width="1.5"/><rect x="8.5" y="11" width="3" height="4" fill="#a8781a"/><rect x="6" y="15" width="8" height="2.5" rx="1" fill="#a8781a"/></svg>',
};
ICON.ess = '<svg viewBox="0 0 20 20" class="ic"><path d="M10 1.5l6 7-6 10-6-10z" fill="#c77dff" stroke="#6b2fa8" stroke-width="1.5"/><path d="M10 1.5v17M4 8.5h12" stroke="#f0d9ff" stroke-width="1" opacity=".7"/></svg>';
// Bastion camp resources: pixel icons (crisp squares, ink outline) for wood, stone and iron
ICON.wood = '<svg viewBox="0 0 20 20" class="ic" shape-rendering="crispEdges"><rect x="2" y="6" width="16" height="9" fill="#2a1608"/><rect x="3" y="7" width="14" height="7" fill="#9a6232"/><rect x="3" y="7" width="14" height="2" fill="#c8884a"/><rect x="13" y="7" width="4" height="7" fill="#e8c08a"/><rect x="14" y="9" width="2" height="3" fill="#b07a42"/></svg>';
ICON.stone = '<svg viewBox="0 0 20 20" class="ic" shape-rendering="crispEdges"><rect x="3" y="5" width="14" height="11" fill="#1e1a16"/><rect x="4" y="6" width="12" height="9" fill="#9a958c"/><rect x="4" y="6" width="12" height="3" fill="#cfcac0"/><rect x="5" y="12" width="5" height="2" fill="#6e6a62"/><rect x="11" y="10" width="4" height="2" fill="#6e6a62"/></svg>';
ICON.iron = '<svg viewBox="0 0 20 20" class="ic" shape-rendering="crispEdges"><rect x="2" y="7" width="16" height="8" fill="#12161c"/><rect x="3" y="8" width="14" height="6" fill="#5e6e80"/><rect x="5" y="8" width="10" height="2" fill="#b8c8da"/><rect x="3" y="12" width="14" height="2" fill="#3a4654"/></svg>';
const UI = { closable: true, current: null, menuSection: 'upgrades', hud: {} };
function costHTML(gold, ess) { return `${ICON.coin}${fmtK(gold)}${ess ? ` <span class="essc">${ICON.ess}${fmtK(ess)}</span>` : ''}`; }

// --- pooled world-anchored DOM (nametags, damage numbers) ---
const TAG_MAX = 56, tagPool = [], DMG_MAX = 44, dmgPool = [];
const _proj = new THREE.Vector3();
function project(x, y, z) {
  _proj.set(x, y, z).project(camera);
  if (_proj.z > 1) return null;
  return [(_proj.x * 0.5 + 0.5) * window.innerWidth, (-_proj.y * 0.5 + 0.5) * window.innerHeight];
}
function setupPools() {
  const layer = $('tags');
  for (let i = 0; i < TAG_MAX; i++) {
    const el = document.createElement('div'); el.className = 'tag'; el.innerHTML = '<span class="tn"></span><span class="tb"><i></i></span>'; el.hidden = true; layer.appendChild(el);
    tagPool.push({ el, name: el.firstChild, bar: el.lastChild.firstChild, lastName: '', lastW: -2, lastCls: '' });
  }
  for (let i = 0; i < DMG_MAX; i++) {
    const el = document.createElement('div'); el.className = 'dmg'; el.hidden = true; layer.appendChild(el);
    dmgPool.push({ el, life: 0, x: 0, y: 0, z: 0, vy: 0 });
  }
}
function dmgNumber(x, y, z, text, cls) {
  const priority = cls === 'crit' || cls === 'hurt' ? 2 : cls === 'mine' ? 1 : 0;
  let d = dmgPool.find(n => n.life <= 0);
  if (!d) {
    const candidates = dmgPool.filter(n => (n.priority || 0) <= priority);
    if (!candidates.length) return; // minor ticks never overwrite an active critical hit
    d = candidates.reduce((a,b)=>a.life < b.life ? a : b);
  }
  d.priority = priority; d.critical = cls === 'crit'; d.ttl = d.critical ? 1.05 : .85; d.life = d.ttl;
  d.x = x + (Math.random() - .5) * .6; d.y = y; d.z = z + (Math.random() - .5) * .6;
  d.el.textContent = typeof text === 'number' ? fmtK(Math.max(0,Math.round(text))) : text;
  d.el.className = 'dmg ' + (cls || ''); d.el.hidden = false;
}
function updateDmgNumbers(dt) {
  for (const d of dmgPool) {
    if (d.life <= 0) continue;
    d.life -= dt;
    if (d.life <= 0) { d.el.hidden = true; continue; }
    const s = project(d.x, d.y, d.z); if (!s) { d.el.hidden = true; continue; }
    d.el.hidden=false;
    const motion = damageMotion(d.ttl - d.life, d.ttl, G.profile.settings.calm, d.critical);
    d.el.style.transform = `translate(${s[0]}px, ${s[1]-motion.rise}px) translate(-50%,-50%) scale(${motion.scale.toFixed(3)})`;
    d.el.style.opacity = motion.opacity;
  }
}
function updateTags() {
  let n = 0;
  const cx = camera.position.x, cz = camera.position.z;
  const put = (x, y, z, name, hpFrac, cls) => {
    if (n >= TAG_MAX) return;
    const s = project(x, y, z); if (!s) return;
    if (s[0] < -60 || s[0] > window.innerWidth + 60 || s[1] < -30 || s[1] > window.innerHeight + 30) return;
    const t = tagPool[n++];
    t.el.hidden = false;
    t.el.style.transform = `translate(${s[0]}px, ${s[1]}px) translate(-50%,-100%)`;
    if (t.lastName !== name) { t.name.textContent = name; t.lastName = name; }
    const w = hpFrac == null ? -1 : Math.round(hpFrac * 100);
    if (w !== t.lastW) { t.bar.parentNode.style.display = w < 0 ? 'none' : ''; if (w >= 0) t.bar.style.width = w + '%'; t.lastW = w; }
    if (t.lastCls !== cls) { t.el.className = 'tag ' + cls; t.lastCls = cls; }
  };
  const near = (e, r) => Math.hypot(e.x - cx, e.z - cz) < r;
  if (Showcase.on) { /* dressing room: no tags */ }
  else if (G.mode === 'arena' && G.arena) {
    for (const f of G.arena.fighters) if (f.alive) put(f.x, 2.5 * growthScale(f), f.z, f.isPlayer ? '' : `${f.name} · ${weaponOf(f).role}`, f.hp / f.maxHp, f.isPlayer ? 'me arena' : 'foe arena');
  } else if (G.started) {
    const pl = G.player;
    if (pl.alive) put(pl.x, 2.5 * growthScale(pl), pl.z, '', pl.hp / pl.maxHp, 'me');
    for (let i = 1; i < G.hubFighters.length; i++) { const b = G.hubFighters[i]; if (near(b, 30)) put(b.x, 2.45 * growthScale(b), b.z, `${b.name} · ${b.level}`, null, 'bot'); }
    for (const b of delveBots()) put(b.x, b.alive ? 2.5 * growthScale(b) : 1.6, b.z, b.alive ? `${b.nick} · bot` : `${b.nick} is down · stand close to revive`, b.alive ? b.hp / b.maxHp : null, b.alive ? 'peer' : 'peer down');
    if (delveOn()) for (const e of mpVisible()) if (e.alive === false) put(e.x, 1.6, e.z, `${e.nick} is down · stand close to revive`, null, 'peer down');
    for (const e of mpVisible()) if (near(e, 40) && e.alive) put(e.x, 2.5 * growthScale(e), e.z, `${e.pvp ? 'PvP · ' : ''}${e.nick} · ${e.level}`, e.hp, e.pvp ? 'peer pvp' : 'peer');
    for (const nn of shownNpcs()) if (near(nn, 28)) put(nn.x, 3.35, nn.z, nn.def.name, null, 'npc');
    if (G.siege) {
      // fort objectives: always shown, big bars that flash while under attack
      for (const o of G.siege.objs) put(o.x, o.def.h, o.z, o.alive ? `${o.name} · ${Math.ceil(clamp(o.hp / o.maxHp, 0, 1) * 100)}%` : `${o.name} · destroyed`, o.alive ? o.hp / o.maxHp : 0, `obj${o.def.main ? ' main' : ''}${o.hurtT > 0 ? ' hurt' : ''}${o.alive ? '' : ' down'}`);
      for (const s of G.siege.soldiers) if (s.alive && s.hp < s.maxHp && near(s, 26)) put(s.x, 2.4, s.z, '', s.hp / s.maxHp, 'ally');
      for (const u of G.siege.units) if (u.alive && u.hp < u.maxHp && near(u, 26)) put(u.x, u.size === 1 ? 2.2 : 3.6, u.z, '', u.hp / u.maxHp, 'ally');
    }
    for (const e of G.enemies) if (e.alive && !e.hidden && near(e, 26) && (e.state !== 'idle' || e.hp < e.maxHp || near(e, 14) || e.elite)) {
      const h = ({ imp: 2.6, fireimp: 2.6, wolf: 2.1, wraith: 3.0, beetle: 1.7, boar: 1.9, spider: 1.5, yeti: 3.0, sentinel: 3.2, crawler: 1.7, drowned: 3.0, seraph: 3.0, warden: 3.4 })[e.type] * (e.elite ? 1.45 : 1) || 1.8;
      const diff = e.lvl - G.profile.level, lvlCls = diff >= 5 ? ' red' : diff >= 2 ? ' orange' : diff <= -6 ? ' grey' : '';
      put(e.x, h, e.z, e.bossName ? `${e.enraged ? 'Enraged ' : ''}${e.bossName} ${e.lvl}` : e.affixed ? `Elite ${CFG.enemies[e.type].name} ${e.lvl} · ${e.champName}` : e.champ ? `${e.guardian ? 'Rift Lord' : 'Champion'} ${e.lvl} · ${e.champName}` : `${e.guardian ? 'Rift Guardian ' : e.elite ? 'Elite ' : ''}${CFG.enemies[e.type].name} ${e.lvl}`, e.hp / e.maxHp, 'mob' + (e.elite ? ' elite' : '') + lvlCls);
    }
    for (const ml of hubParts.mineLabels || []) if (Math.hypot(ml.x - cx, ml.z - cz) < 45) put(ml.x, ml.y, ml.z, `${ml.name} · Lv ${CFG.world.zones[ml.zone].minLevel}`, null, 'den');
    for (const dl of hubParts.denLabels) { const D = CFG.world.dens[dl.den]; if (Math.hypot(dl.x - cx, dl.z - cz) < 55) put(dl.x, dl.y, dl.z, `${D.name} · Lv ${areaLevel(D.zone, D.z) + CFG.world.denLevelBonus + tierAdd()}`, null, 'den'); }
    for (const q of CFG.world.pois) if (q.major && !CFG.world.zones[q.zone].safe && Math.hypot(q.x - cx, q.z - cz) < 40) put(q.x, 6.5, q.z, trialOpen(q.zone) ? `${q.name} · Legendary Trial` : `${q.name} · ${runesLit(q.zone)}/${CFG.dungeon.trial.runes} runestones`, null, 'wp');
    for (const q of dungeonPois()) if (Math.hypot(q.x - cx, q.z - cz) < 90) put(q.x, 7.2, q.z, G.profile.level >= dungeonReq(q) ? `${q.name} · Dungeon` : `${q.name} · Level ${dungeonReq(q)}`, null, 'den');
    { const SG = CFG.siege.gate; if (!G.siege && Math.hypot(SG.x - cx, SG.z - cz) < 30) put(CFG.siege.house.x + 1, 7.4, SG.z, G.profile.level >= CFG.siege.unlock ? `Bastion Siege · wave ${(G.profile.fort && G.profile.fort.wave) || 1}` : `Bastion Siege · Level ${CFG.siege.unlock}`, null, 'wp'); }
    { const RG = CFG.rift.gate; if (Math.hypot(RG.x - cx, RG.z - cz) < 30) put(RG.x, 4.4, RG.z, G.profile.level >= CFG.rift.unlock ? `The Rift · best floor ${G.profile.records.bestRift || 0}` : `The Rift · Level ${CFG.rift.unlock}`, null, 'wp'); }
    CFG.world.waypoints.forEach((w, i) => { if (Math.hypot(w.x - cx, w.z - cz) < 30) put(w.x, 4.4, w.z, G.profile.waypoints.includes(i) ? 'Waypoint' : 'Waypoint · touch to unlock', null, 'wp'); });
    for (const gl of hubParts.gateLabels) { const zn = CFG.world.zones[gl.zone]; if (G.profile.level < zn.minLevel && Math.hypot(gl.x - cx, gl.z - cz) < 60) put(gl.x, gl.y, gl.z, `${zn.name} · Level ${zn.minLevel}`, null, 'gate'); }
  }
  for (let i = n; i < TAG_MAX; i++) if (!tagPool[i].el.hidden) tagPool[i].el.hidden = true;
  updateFortBubbles();
}

// --- Bastion: Clash of Clans collect bubbles ---
// A mill or mine with a good amount in it (a quarter of what it holds) shows a bobbing bubble with its resource over the
// building; one tap collects it, while walking around or in builder mode. Full ones glow.
const FORT_BUB_MAX = 16, fortBubs = [];
function fortCollectUnit(u) {
  const T = CFG.siege.towers[u.b.t], n = fortMade(u.b); if (!T.make || n < 1) return false;
  const why = fortDo({ o: 'col', k: fortState().b.indexOf(u.b) });
  if (why) { toast(why, 'bad'); return false; }
  Sfx.play('coin'); toast(`+${fmtK(n)} ${CFG.siege.resName[T.make].toLowerCase()}`, 'good');
  burst(u.x, 2, u.z, 14, T.make === 'wood' ? 0xc8884a : T.make === 'iron' ? 0xb8c8da : 0xcfcac0, 4, 0.6, 0.25, 4, 1);
  if (G.builder) { builderHud(); builderShop(); }
  return true;
}
function fortBubbleAt(u) { const T = CFG.siege.towers[u.b.t]; if (!T.make || !u.alive) return 0; const n = fortMade(u.b); return n >= Math.max(1, T.rate * u.b.l * 0.25) ? n : 0; }
function updateFortBubbles() {
  const layer = $('fortBubs'); if (!layer) return;
  let n = 0;
  if (G.siege && G.started && !G.modal && !Showcase.on) for (const u of G.siege.units) {
    if (n >= FORT_BUB_MAX) break;
    const amt = fortBubbleAt(u); if (!amt) continue;
    const s = project(u.x, u.size === 1 ? 3 : 4.6, u.z); if (!s || s[0] < -40 || s[0] > window.innerWidth + 40 || s[1] < -40 || s[1] > window.innerHeight + 40) continue;
    let b = fortBubs[n];
    if (!b) {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'fbub'; el.hidden = true;
      el.innerHTML = '<span class="fbIc"></span><b></b>'; layer.appendChild(el);
      b = fortBubs[n] = { el, ic: el.firstChild, txt: el.lastChild, u: null, res: '', amt: -1, full: null };
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (b.u && fortCollectUnit(b.u)) { el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 260); } });
    }
    n++;
    const T = CFG.siege.towers[u.b.t], full = amt >= T.cap * u.b.l;
    b.u = u; b.el.hidden = false;
    b.el.style.transform = `translate(${Math.round(s[0])}px, ${Math.round(s[1])}px) translate(-50%, -100%)`;
    if (b.res !== T.make) { b.res = T.make; b.ic.innerHTML = ICON[T.make === 'stones' ? 'stone' : T.make]; b.el.className = 'fbub ' + T.make; b.full = null; }
    if (b.full !== full) { b.full = full; b.el.classList.toggle('full', full); }
    if (b.amt !== amt) { b.amt = amt; b.txt.textContent = fmtK(amt); b.el.setAttribute('aria-label', `Collect ${amt} ${CFG.siege.resName[T.make].toLowerCase()}`); }
  }
  for (let i = n; i < fortBubs.length; i++) if (!fortBubs[i].el.hidden) { fortBubs[i].el.hidden = true; fortBubs[i].u = null; }
}

// --- toasts / banners ---
function showToast(text, kind) {
  const box = $('toasts'), el = document.createElement('div');
  el.className = 'toast ' + (kind || ''); el.textContent = text; box.appendChild(el);
  while (box.children.length > 3) box.removeChild(box.firstChild);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 2600);
}
let bannerT = 0;
function showBanner(big, small, cls) {
  const b = $('banner'); b.innerHTML = `<b>${big}</b>${small ? `<span>${small}</span>` : ''}`; b.className = 'show ' + (cls || ''); bannerT = 2.6;
}

// --- coach marks (tutorial prompts) ---
const Coach = {
  steps: [
    { text: 'Drag on the left side to move', done: 'moved' },
    { text: 'Walk to Farmer Ida (yellow !) and tap Talk', done: 'jobAccepted', npc: true },
    { text: 'Drag the attack stick to aim, release to shoot. Tap it to auto-aim', done: 'aimed' },
    { text: 'Tap DASH to dodge. You can’t be hit while dashing', done: 'dashed' },
    { text: 'Finish the job, then return to Ida for XP and gold', done: 'jobTurnedIn', npc: true },
    { text: 'Visit Arena Master Rho by the purple portal to play Showdown', done: 'arenaStart', npc: true },
  ],
  note(flag) {
    const p = G.profile; if (!p || p.tut >= this.steps.length) return;
    if (this.steps[p.tut].done === flag) { p.tut++; G.dirty = true; this.render(); }
  },
  render() {
    const p = G.profile, el = $('coach');
    while (p && p.tut < this.steps.length && this.steps[p.tut].npc && !p.settings.npcs) p.tut++;
    if (!G.started || !p || p.tut >= this.steps.length || G.mode === 'arena') { el.hidden = true; return; }
    $('coachText').textContent = this.steps[p.tut].text; el.hidden = false;
  },
};

// --- HUD ---
const hudCache = {};
function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
function setStyle(id, prop, v) { const k = id + prop; if (hudCache[k] !== v) { hudCache[k] = v; $(id).style.setProperty(prop, v); } }
// Normal (friendly) mode can only be switched on after 60 s without taking damage
const pvpOffWait = () => Math.ceil(Math.max(0, 60 - (G.time - (G.player.lastHurt ?? -99))));
function setHidden(id, h) { const k = id + 'hid'; if (hudCache[k] !== h) { hudCache[k] = h; $(id).hidden = h; } }
function updateHUD(dt) {
  const p = G.profile, inArena = G.mode === 'arena' && G.arena;
  const f = inArena ? G.arena.fighters[0] : G.player;
  setText('hLvl', String(p.level));
  const petHud=petProgress(p);setHidden('prestigeHud',!prestigeCount(p));setText('prestigeHud',`P${prestigeCount(p)} · ${petHud.name} Lv ${petHud.level}`);
  setHidden('testBadge', !TEST_MODE && !p.settings.fastXp);
  setText('testBadge', TEST_MODE ? 'TEST · ×100 XP' : 'TEST · ×5 XP');
  setText('hClass', CFG.classes[p.cls || 'novice'].name);
  const hpF = clamp(f.hp / f.maxHp, 0, 1);
  setStyle('hHp', 'width', (hpF * 100).toFixed(1) + '%');
  setStyle('hHp', 'background', hpF < 0.3 ? 'var(--hpLow)' : 'var(--hp)');
  setText('hHpTxt', `${fmtK(f.hp)} / ${fmtK(f.maxHp)}`);
  const xpF = p.level >= P.cap ? 1 : p.xp / xpToNext(p.level);
  setStyle('hXp', 'width', (xpF * 100).toFixed(1) + '%');
  setText('hXpTxt', `${fmtK(p.xp)} / ${fmtK(xpToNext(p.level))} XP`);
  setText('hGold', fmtK(p.gold)); setText('hTroph', fmt(p.trophies)); setText('hEss', fmtK(p.essence));
  // area level + kill streak
  if (!inArena && G.started) {
    const zi = zoneAt(G.player.z), zn = CFG.world.zones[zi], town = distToTown(G.player.x, G.player.z) < CFG.world.town.r + 2;
    const ct = curTier(), al = areaLevel(zi, G.player.z) + tierAdd(), ts = ct ? ` · ${tierDef(ct).short}` : '';
    if (G.rift) setText('zoneChip', `Rift · Floor ${G.rift.floor} · Lv ${riftWaveLevel(G.rift.floor)}`);
    else if (G.siege) setText('zoneChip', `Bastion Siege · Wave ${G.siege.wave} · Lv ${G.siege.lvl}`);
    else setText('zoneChip', town || zn.safe ? `Willowcross Base Camp · safe${ts}` : `${zn.name} · Lv ${al}${ts}`);
    setStyle('zoneChip', '--zc', al > p.level + 4 ? '#ff5d6c' : al > p.level + 1 ? '#ffb347' : '#8fe3a0');
  }
  setHidden('zoneChip', inArena || !G.started);
  if (G.started && !inArena) {
    const nc = G.profile.cases.length; setHidden('caseChip', !nc); if (nc) setText('caseChip', String(nc));
    UI.caseFlash = Math.max(0, (UI.caseFlash || 0) - dt); $('caseChip').classList.toggle('flash', UI.caseFlash > 0);
    setHidden('autoChip', G.mode !== 'hub' || !!G.rift || !!G.siege); setText('autoChip', 'AUTO'); $('autoChip').classList.toggle('on', !!G.profile.settings.autoHunt);
    setHidden('fortBuildBtn', !G.siege || !!G.builder);
    { const F = G.siege && fortState(); setHidden('fortChip', !F || !F.go); if (F && F.go) { setText('fortChip', F.hold ? 'WAVES PAUSED' : 'AUTO WAVES'); $('fortChip').classList.toggle('on', !F.hold); } }
    setHidden('pvpChip', G.mode !== 'hub' || inInstance()); setText('pvpChip', G.profile.settings.pvp ? (pvpOffWait() > 0 ? 'FIGHT · ' + pvpOffWait() + 's' : 'FIGHT') : 'NORMAL'); $('pvpChip').classList.toggle('on', !!G.profile.settings.pvp);
  } else { setHidden('caseChip', true); setHidden('autoChip', true); setHidden('pvpChip', true); setHidden('fortChip', true); setHidden('fortBuildBtn', true); }
  $('bMenu').classList.toggle('newU', G.started && Object.keys(UNLOCK_AT).some(unlockNew)); // the menu button glows while something new is unopened
  { const n = mpCount(), on = G.started && !inArena; setHidden('mpChip', !on || !n); if (on && n) setText('mpChip', String(n + 1)); }
  const stk = G.streak >= 3 && !inArena;
  setHidden('streak', !stk);
  if (stk) { setText('streakN', '×' + G.streak); setText('streakB', `+${Math.round(Math.min(P.streakMax, (G.streak - 1) * P.streakStep) * 100)}% XP`); setStyle('streak', '--k', clamp(G.streakT / P.streakWindow, 0, 1).toFixed(2)); }
  XPDrops.update(dt);
  const sp = skillPointsFree(p);
  UI.alertT = (UI.alertT || 0) - dt;
  if (UI.alertT <= 0) { UI.alertT = 0.3; UI.anyAlert = Object.values(slotAlerts()).some((a) => a.better || a.canUpgrade); updateGearPrompt(); $('feed').classList.toggle('up', !$('gearPrompt').hidden); }
  { const dock = hubShortcutsAvailable(), bannerOn = bannerT > 0;
    // the shortcut dock pushes toasts below it, and steps aside while the zone banner shows
    if (hudCache.dock !== dock) { hudCache.dock = dock; $('hud').classList.toggle('dock', dock); }
    if (hudCache.bannerOn !== bannerOn) { hudCache.bannerOn = bannerOn; $('hud').classList.toggle('bannerOn', bannerOn); }
    setHidden('hubShortcuts', !dock); }
  setHidden('navGearDot', !UI.anyAlert); setHidden('navSkillsDot', sp <= 0);
  setHidden('navArtifactsDot', !p.newUnlocks.some(u => u.startsWith('r:')));
  setHidden('navCasesCount', !p.cases.length); setText('navCasesCount', String(p.cases.length));
  setHidden('heroDot', !UI.anyAlert);
  setHidden('menuDot', !(sp > 0 || UI.anyAlert || p.newUnlocks.length > 0 || p.cases.length > 0));
  Feed.update(dt);
  // world boss: a live line in the small feed instead of a big banner
  if (G.mode === 'hub' && G.started) {
    if (G.boss) { const d = Math.round(Math.hypot(G.boss.x - G.player.x, G.boss.z - G.player.z)); Feed.add(`${gi('k_titan')} <b>${G.boss.name}</b> · ${G.boss.life > 0 ? Math.ceil(G.boss.life) + 's' : 'enraged'} · ${d}m`, 'boss', 'boss', 1.2); }
    else if (G.bossWarned) Feed.add(`${gi('k_titan')} <b>${CFG.world.zones[G.bossLair].boss}</b> rises in ${Math.ceil(G.bossTimer)}s · ${currentLair().name}`, 'boss', 'boss', 1.2);
  }
  // buttons
  const w = weaponOf(f);
  const pips = $('ammo').children;
  for (let i = 0; i < 5; i++) {
    const on = i < f.ammoMax;
    const fill = i < Math.floor(f.ammo) ? 1 : i === Math.floor(f.ammo) ? f.reloadT / w.reload : 0;
    const v = on ? (fill * 100).toFixed(0) : '-1';
    if (hudCache['pip' + i] !== v) { hudCache['pip' + i] = v; pips[i].style.display = on ? '' : 'none'; pips[i].style.setProperty('--f', fill); }
  }
  setStyle('bDash', '--cd', clamp(f.dashCd / CFG.combat.dash.cd, 0, 1).toFixed(2));
  setStyle('bMelee', '--cd', clamp(f.meleeCd / CFG.combat.melee.cd, 0, 1).toFixed(2));
  setStyle('bSuper', '--sc', f.superCharge.toFixed(2));
  const sReady = f.superCharge >= 1; if (hudCache.sReady !== sReady) { hudCache.sReady = sReady; $('bSuper').classList.toggle('ready', sReady); }
  setText('bSuperLbl', CFG.supers[CFG.classes[f.cls].super].short); setBtnIcon('bSuper', BTN_ICON[CFG.classes[f.cls].super] || 'k_ascend'); setBtnIcon('bDash', 'k_phase'); setBtnIcon('bMelee', 'a_blast');
  const sk = CFG.classes[f.cls].skill;
  const spc = f.perks && f.perks.special;
  setHidden('bSpecial', !spc);
  if (spc) { const E = CFG.elements[spc]; setText('bSpecialLbl', E.short); setBtnIcon('bSpecial', BTN_ICON[spc] || 'k_storm'); setStyle('bSpecial', '--cd', clamp(f.specialCd / E.cd, 0, 1).toFixed(2)); setStyle('bSpecial', '--el', '#' + E.color.toString(16).padStart(6, '0')); }
  setHidden('bSkill', !sk);
  if (sk) { setStyle('bSkill', '--cd', clamp(f.skillCd / (CFG.skills[sk].cd * (1 - f.mods.skillCd) * (1 - (f.cdr || 0))), 0, 1).toFixed(2)); setText('bSkillLbl', CFG.skills[sk].short); setBtnIcon('bSkill', BTN_ICON[sk] || 'k_tempo'); }
  // interact
  const act = !inArena && G.interact && G.started;
  setHidden('bAct', !act);
  if (act) setText('bAct', G.interact.label ? G.interact.label : G.interact.kind === 'waypoint' ? 'Travel' : G.interact.kind === 'rift' ? 'Enter Rift' : G.interact.kind === 'riftLeave' ? 'Leave Rift' : G.interact.def.role === 'arena' ? 'Play Arena' : G.interact.def.role === 'smith' ? 'Blacksmith' : 'Talk to ' + G.interact.def.name.split(' ').pop());
  // arena hud
  setHidden('arenaHud', !inArena);
  if (inArena) {
    const ar = G.arena, alive = ar.fighters.filter((x) => x.alive).length;
    setText('aLeft', `${alive} left`);
    const gasIn = Math.max(0, CFG.arena.gasDelay - ar.t);
    setText('aGas', ar.phase === 'countdown' ? 'Showdown' : gasIn > 0 ? `Gas in ${Math.ceil(gasIn)}s` : 'Gas closing in');
    const cd = ar.phase === 'countdown' ? String(Math.ceil(ar.cd)) : '';
    setHidden('countdown', !cd); if (cd) setText('countdown', cd);
  } else setHidden('countdown', true);
  // objective tracker
  updateObjective();
  updateBossTracker();
  MM.t -= dt; if (MM.t <= 0) { MM.t = 0.15; drawMinimap(); }
  // fps
  setHidden('fps', !p.settings.fps);
  if (p.settings.fps) setText('fps', `${Math.round(Q.fps)} fps · screen ${Math.round(Q.hz)} Hz · ${renderer.info.render.calls} calls · ${Q.dpr.toFixed(2)}x`);
  // banner fade
  if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) $('banner').className = ''; }
  // vignette
  const vg = $('vignette'); const vo = Math.max(0, parseFloat(vg.dataset.o || '0') - dt * 1.8); vg.dataset.o = vo; setStyle('vignette', 'opacity', vo.toFixed(2));
  setHidden('respawn', !(G.mode === 'hub' && !G.player.alive));
  if (G.mode === 'hub' && !G.player.alive) setText('respawn', !delveOn() ? `Knocked out · back in ${Math.ceil(G.respawnT)}`
    : delveParty().some((f) => f !== G.player && f.alive !== false) ? 'You are down · wait for a teammate to revive you' : 'Your party has fallen…');
}
function updateObjective() {
  const p = G.profile, pl = G.player;
  let text = '', tx = null, tz = null;
  if (G.mode === 'arena') { setHidden('objective', true); return; }
  const shr = activeShrine();
  if (G.rift) { const r = G.rift; text = r.phase === 'intro' ? `Rift floor ${r.floor} · get ready` : r.phase === 'clear' ? `Floor ${r.floor} cleared! Next floor…` : `Rift floor ${r.floor} · ${riftLeft()} left · ${Math.ceil(r.t)}s`; }
  else if (G.siege) { const S = G.siege, k = S.objs[0];
    const F = fortState();
    text = S.phase === 'build' ? (!F.go ? `Wave ${S.wave} · press Start when ready` : F.hold ? `Paused · wave ${S.wave} from ${siegeSideNames(S.sides)}` : `Wave ${S.wave} in ${Math.ceil(S.t)}s · from ${siegeSideNames(S.sides)}`) : S.phase === 'clear' ? `Wave ${S.wave} held!` : `Wave ${S.wave} · ${siegeLeft()} left · Keep ${Math.ceil(clamp(k.hp / k.maxHp, 0, 1) * 100)}%`; }
  else if (shr) { text = `Shrine challenge: ${shr.wave.filter((e) => e.alive).length} left · ${Math.ceil(shr.t)}s`; tx = shr.x; tz = shr.z; }
  else if (p.job) {
    const j = p.job, npc = NPC_DEFS.find((n) => n.id === j.npc);
    if (j.progress >= j.count) { text = `Return to ${npc.name}`; tx = npc.x; tz = npc.z; }
    else {
      text = `${j.title}: ${j.progress}/${j.count}`;
      const zi = Math.max(1, CFG.world.zones.findIndex((zn) => zn.enemy === j.target || zn.alt === j.target));
      if (zoneAt(pl.z) !== zi || distToTown(pl.x, pl.z) < CFG.world.town.r + 4) { let D = null, bd = 1e9; for (const d of CFG.world.dens) { const k = d.zone === zi ? Math.hypot(d.x - pl.x, d.z - pl.z) : 1e9; if (k < bd) { bd = k; D = d; } } tx = D ? D.x : 0; tz = D ? D.z : CFG.world.zones[zi].z0 + 25; }
    }
  } else if (G.started) {
    const avail = NPC_DEFS.find((n) => n.role === 'job' && p.level >= n.minLevel && n.id === 'ida') || null;
    if (p.tut < 3 && avail && p.settings.npcs) { text = `Talk to ${avail.name}`; tx = avail.x; tz = avail.z; }
  }
  setHidden('objective', !text);
  if (!text) return;
  let dist = '';
  if (tx != null) {
    const d = Math.hypot(tx - pl.x, tz - pl.z);
    const ang = Math.atan2(tx - pl.x, tz - pl.z) - Cam.yaw;
    setStyle('objArrow', 'transform', `rotate(${(-ang * 180 / Math.PI).toFixed(0)}deg)`);
    dist = d > 6 ? ` · ${Math.round(d)}m` : '';
    setHidden('objArrow', d <= 6);
  } else setHidden('objArrow', true);
  setText('objText', text + dist);
}

