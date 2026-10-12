// ---------------------------------------------------------------------
// 9. UI — HUD, panels, nametags, damage numbers, coach marks
// ---------------------------------------------------------------------
const ICON = {
  coin: '<svg viewBox="0 0 20 20" class="ic"><circle cx="10" cy="10" r="8" fill="#ffc94a" stroke="#b07a12" stroke-width="2"/><rect x="8.5" y="5.5" width="3" height="9" rx="1" fill="#b07a12"/></svg>',
  trophy: '<svg viewBox="0 0 20 20" class="ic"><path d="M5 3h10v4a5 5 0 0 1-10 0z" fill="#ffd34a" stroke="#a8781a" stroke-width="1.5"/><path d="M5 5H2.5a2.5 2.5 0 0 0 3 3.5M15 5h2.5a2.5 2.5 0 0 1-3 3.5" fill="none" stroke="#a8781a" stroke-width="1.5"/><rect x="8.5" y="11" width="3" height="4" fill="#a8781a"/><rect x="6" y="15" width="8" height="2.5" rx="1" fill="#a8781a"/></svg>',
};
ICON.ess = '<svg viewBox="0 0 20 20" class="ic"><path d="M10 1.5l6 7-6 10-6-10z" fill="#c77dff" stroke="#6b2fa8" stroke-width="1.5"/><path d="M10 1.5v17M4 8.5h12" stroke="#f0d9ff" stroke-width="1" opacity=".7"/></svg>';
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
    for (const e of mpVisible()) if (near(e, 40) && e.alive) put(e.x, 2.5 * growthScale(e), e.z, `${e.nick} · ${e.level}`, e.hp, 'peer');
    for (const nn of shownNpcs()) if (near(nn, 28)) put(nn.x, 3.35, nn.z, nn.def.name, null, 'npc');
    for (const e of G.enemies) if (e.alive && !e.hidden && near(e, 26) && (e.state !== 'idle' || e.hp < e.maxHp || near(e, 14) || e.elite)) {
      const h = ({ imp: 2.6, fireimp: 2.6, wolf: 2.1, wraith: 3.0, beetle: 1.7, boar: 1.9, spider: 1.5, yeti: 3.0, sentinel: 3.2, crawler: 1.7, drowned: 3.0, seraph: 3.0, warden: 3.4 })[e.type] * (e.elite ? 1.45 : 1) || 1.8;
      const diff = e.lvl - G.profile.level, lvlCls = diff >= 5 ? ' red' : diff >= 2 ? ' orange' : diff <= -6 ? ' grey' : '';
      put(e.x, h, e.z, e.affixed ? `Elite ${CFG.enemies[e.type].name} ${e.lvl} · ${e.champName}` : e.champ ? `${e.guardian ? 'Rift Lord' : 'Champion'} ${e.lvl} · ${e.champName}` : `${e.guardian ? 'Rift Guardian ' : e.elite ? 'Elite ' : ''}${CFG.enemies[e.type].name} ${e.lvl}`, e.hp / e.maxHp, 'mob' + (e.elite ? ' elite' : '') + lvlCls);
    }
    for (const dl of hubParts.denLabels) { const D = CFG.world.dens[dl.den]; if (Math.hypot(dl.x - cx, dl.z - cz) < 55) put(dl.x, dl.y, dl.z, `${D.name} · Lv ${areaLevel(D.zone, D.z) + CFG.world.denLevelBonus + tierAdd()}`, null, 'den'); }
    { const RG = CFG.rift.gate; if (Math.hypot(RG.x - cx, RG.z - cz) < 30) put(RG.x, 4.4, RG.z, G.profile.level >= CFG.rift.unlock ? `The Rift · best floor ${G.profile.records.bestRift || 0}` : `The Rift · Level ${CFG.rift.unlock}`, null, 'wp'); }
    CFG.world.waypoints.forEach((w, i) => { if (Math.hypot(w.x - cx, w.z - cz) < 30) put(w.x, 4.4, w.z, G.profile.waypoints.includes(i) ? 'Waypoint' : 'Waypoint · touch to unlock', null, 'wp'); });
    for (const gl of hubParts.gateLabels) { const zn = CFG.world.zones[gl.zone]; if (G.profile.level < zn.minLevel && Math.hypot(gl.x - cx, gl.z - cz) < 60) put(gl.x, gl.y, gl.z, `${zn.name} · Level ${zn.minLevel}`, null, 'gate'); }
  }
  for (let i = n; i < TAG_MAX; i++) if (!tagPool[i].el.hidden) tagPool[i].el.hidden = true;
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
    else setText('zoneChip', town || zn.safe ? `Willowcross Base Camp · safe${ts}` : `${zn.name} · Lv ${al}${ts}`);
    setStyle('zoneChip', '--zc', al > p.level + 4 ? '#ff5d6c' : al > p.level + 1 ? '#ffb347' : '#8fe3a0');
  }
  setHidden('zoneChip', inArena || !G.started);
  if (G.started && !inArena) {
    const nc = G.profile.cases.length; setHidden('caseChip', !nc); if (nc) setText('caseChip', String(nc));
    UI.caseFlash = Math.max(0, (UI.caseFlash || 0) - dt); $('caseChip').classList.toggle('flash', UI.caseFlash > 0);
    setHidden('autoChip', G.mode !== 'hub' || !!G.rift); setText('autoChip', 'AUTO'); $('autoChip').classList.toggle('on', !!G.profile.settings.autoHunt);
  } else { setHidden('caseChip', true); setHidden('autoChip', true); }
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
    else if (G.bossWarned) Feed.add(`${gi('k_titan')} <b>${bossDef(G.bossNext).name}</b> rises in ${Math.ceil(G.bossTimer)}s · ${currentLair().name}`, 'boss', 'boss', 1.2);
  }
  // boss call: before it rises (and while it is up and you are far away), one tap to the waypoint nearest its lair
  if ((hudCache.bossCallT = (hudCache.bossCallT || 0) - dt) <= 0) {
    hudCache.bossCallT = 0.25;
    const up = G.mode === 'hub' && G.started && !G.modal && !inInstance() && (G.bossWarned || G.boss), wp = up ? bossWaypoint() : -1;
    UI.bossWp = wp; setHidden('bossCall', wp < 0);
    if (wp >= 0) setText('bossCallT', G.boss ? `${G.boss.name} is up · ${currentLair().name}` : `${bossDef(G.bossNext).name} in ${Math.ceil(G.bossTimer)}s · ${currentLair().name}`);
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
  setText('bSuperLbl', CFG.supers[CFG.classes[f.cls].super].short); setBtnIcon('bSuper', BTN_ICON[CFG.classes[f.cls].super]); setBtnIcon('bDash', 'k_phase'); setBtnIcon('bMelee', 'a_blast');
  const sk = CFG.classes[f.cls].skill;
  const spc = f.perks && f.perks.special;
  setHidden('bSpecial', !spc);
  if (spc) { const E = CFG.elements[spc]; setText('bSpecialLbl', E.short); setBtnIcon('bSpecial', BTN_ICON[spc]); setStyle('bSpecial', '--cd', clamp(f.specialCd / E.cd, 0, 1).toFixed(2)); setStyle('bSpecial', '--el', '#' + E.color.toString(16).padStart(6, '0')); }
  setHidden('bSkill', !sk);
  if (sk) { setStyle('bSkill', '--cd', clamp(f.skillCd / (CFG.skills[sk].cd * (1 - f.mods.skillCd) * (1 - (f.cdr || 0))), 0, 1).toFixed(2)); setText('bSkillLbl', CFG.skills[sk].short); setBtnIcon('bSkill', BTN_ICON[sk]); }
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
  if (p.settings.fps) setText('fps', `${Math.round(Q.fps)} fps · ${renderer.info.render.calls} calls · ${Q.dpr.toFixed(2)}x`);
  // banner fade
  if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) $('banner').className = ''; }
  // vignette
  const vg = $('vignette'); const vo = Math.max(0, parseFloat(vg.dataset.o || '0') - dt * 1.8); vg.dataset.o = vo; setStyle('vignette', 'opacity', vo.toFixed(2));
  setHidden('respawn', !(G.mode === 'hub' && !G.player.alive));
  if (G.mode === 'hub' && !G.player.alive) setText('respawn', `Knocked out · back in ${Math.ceil(G.respawnT)}`);
}
function updateObjective() {
  const p = G.profile, pl = G.player;
  let text = '', tx = null, tz = null;
  if (G.mode === 'arena') { setHidden('objective', true); return; }
  const shr = activeShrine();
  if (G.rift) { const r = G.rift; text = r.phase === 'intro' ? `Rift floor ${r.floor} · get ready` : r.phase === 'clear' ? `Floor ${r.floor} cleared! Next floor…` : `Rift floor ${r.floor} · ${riftLeft()} left · ${Math.ceil(r.t)}s`; }
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

