function startGame() {
  if (G.started) return;
  G.started = true;
  if (G.profile.settings.fastXp) G.bossTimer = Math.min(G.bossTimer, P.testBossFirst);
  if (!G.offlineChecked) { G.offlineChecked = true; G.offline = computeOffline(Date.now()); }
  if (G.offline) setTimeout(() => { if (G.offline && !G.modal) openOffline(G.offline); }, 900);
  else setTimeout(() => { if (!G.modal && vaultState(Date.now()).mins >= 10) openIdle('Vault'); }, 1100);
  if (G.profile.migratedV8) setTimeout(() => { if (!G.modal) { delete G.profile.migratedV8; G.dirty = true; openV8Intro(); } else setTimeout(() => { delete G.profile.migratedV8; }, 0); }, G.offline ? 4000 : 1000);
  Sfx.init();
  $('title').classList.add('gone'); $('hud').classList.remove('pre'); setTimeout(() => { $('title').hidden = true; }, 600);
  Cam.yaw = 0; Cam.pos.set(G.player.x, 4, G.player.z - 7);
  showBanner('Willowcross Town', 'Your journey starts weak. Grow strong.', 'gold');
  Coach.render();
  try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); } catch (e) { /* optional */ }
}

function boot(hotData) {
  const saved = (hotData && hotData.profile) ? sanitizeProfile(hotData.profile) : Store.load();
  G.profile = saved || defaultProfile();
  buildHub(); buildArena(); buildRift();
  G.obstacles = G.hubObstacles;
  initHub();
  G.zoneIdx = zoneAt(G.player.z);
  setupPools(); setupInput();
  $('panel').addEventListener('click', handlePanelClick);
  $('panel').addEventListener('change', handleSettingChange);
  setupSheetGrip();
  // backdrop: tap to close normal menus; in the dressing room, drag to spin the hero
  let spinDrag = null;
  $('modal').addEventListener('pointerdown', (e) => {
    if (e.target.id !== 'modal') return;
    if (Showcase.on) { spinDrag = { id: e.pointerId, x: e.clientX, spin: Showcase.spin }; try { $('modal').setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } return; }
    if (UI.closable) UI.close();
  });
  $('modal').addEventListener('pointermove', (e) => { if (spinDrag && e.pointerId === spinDrag.id) Showcase.spin = spinDrag.spin + (e.clientX - spinDrag.x) * 0.012; });
  const endSpin = (e) => { if (spinDrag && e.pointerId === spinDrag.id) spinDrag = null; };
  $('modal').addEventListener('pointerup', endSpin); $('modal').addEventListener('pointercancel', endSpin);
  $('bHero').addEventListener('click', () => { if (G.started && !G.modal) { Sfx.play('click'); heroTab('Stats'); } });
  $('bMenu').addEventListener('click', () => { if (G.started && !G.modal) { Sfx.play('click'); openMenu(); } });
  for (const icon of $('hubShortcuts').querySelectorAll('[data-icon]')) icon.innerHTML = gi(icon.dataset.icon);
  $('hubShortcuts').addEventListener('click', e => { const button = e.target.closest('[data-quick]'); if (button) openQuickUpgrade(button.dataset.quick); });
  for (const [id, key] of [['bHero', 'm_hero']]) $(id).querySelector('svg').outerHTML = gi(key); // the game's own icon set
  $('bSet').addEventListener('click', () => { if (G.started && !G.modal) { Sfx.play('click'); openSettings(); } });
  $('coachX').addEventListener('click', () => { G.profile.tut = Coach.steps.length; G.dirty = true; Coach.render(); });
  $('playBtn').addEventListener('click', startGame);
  $('gearPrompt').addEventListener('click', onGearPrompt);
  $('gearPrompt').addEventListener('pointerdown', (e) => e.stopPropagation());
  $('caseChip').addEventListener('click', () => { if (G.started && !G.modal) { Sfx.play('click'); openCases(); } });
  $('autoChip').addEventListener('click', () => { if (G.started && !G.modal) { const s = G.profile.settings; s.autoHunt = !s.autoHunt; G.dirty = true; Sfx.play('click'); showToast(s.autoHunt ? 'Auto hunt on: your hero fights by itself' : 'Auto hunt off'); } });
  // Fight / Normal: the same switch as Settings > PvP, one tap from the HUD
  $('pvpChip').addEventListener('click', () => {
    if (!G.started || G.modal) return;
    const s = G.profile.settings;
    if (s.pvp && pvpOffWait() > 0) { Sfx.play('click'); showToast(`Normal mode needs ${pvpOffWait()}s without taking damage`); return; }
    s.pvp = !s.pvp; G.dirty = true; Sfx.play('click');
    const live = typeof MP !== 'undefined' && MP.state === 'on';
    showToast(s.pvp ? (live ? 'Fight mode: other fighters can hit you outside town. You glow red' : 'Fight mode on. It starts once you are online with other players') : 'Normal mode: no PvP');
  });
  $('mpChip').addEventListener('click', () => { if (G.started && !G.modal) { Sfx.play('click'); openPlayers(); } });
  $('bMap').addEventListener('click', () => { if (!G.started) return; Sfx.play('click'); setMap($('mapBox').hidden); });
  // the enlarged minimap carries a Travel button that opens the world map with every area
  $('mapTravel').addEventListener('click', (ev) => { ev.stopPropagation(); if (!G.started || G.modal) return; Sfx.play('click'); openWorldMap(); });
  $('mapBox').addEventListener('click', () => { MM.big = !MM.big; $('mapBox').classList.toggle('big', MM.big); MM.t = 0; });
  setMap(G.profile.settings.map !== false);
  $('ammo').innerHTML = '<i></i><i></i><i></i><i></i><i></i>';
  $('hGoldIc').innerHTML = ICON.coin; $('hTrophIc').innerHTML = ICON.trophy; $('hEssIc').innerHTML = ICON.ess;
  const returning = !!saved && (saved.level > 1 || saved.stats.jobs > 0);
  $('playBtn').textContent = returning ? `Continue · Level ${G.profile.level}` : 'PLAY';
  // phones: start at 2x at most and let quality only step down
  setDpr(Math.min(window.devicePixelRatio || 1, CFG.quality.maxDpr));
  if (G.profile.settings.calm) Q.locked = true;
  applyUiSize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { G.paused = true; if (Sfx.ctx) Sfx.ctx.suspend(); G.dirty = false; saveNow(true); }
    else { G.paused = false; lastFrame = nextFrameAt = performance.now(); simAcc = 0; if (Sfx.ctx && !G.profile.settings.mute) Sfx.ctx.resume(); }
  });
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) {
    try { window.claude.hot.snapshot(() => ({ profile: G.profile })); } catch (e) { /* optional */ }
  }
  window.addEventListener('pagehide', () => saveNow(true));
  if (LOCAL_PREVIEW) window.__sim = { CFG, P, makeItem, refreshPlayerStats, weaponOf, simStep, masteryLevel, xpToNext, killXpAt, areaLevel, rollLoot, grantItem, spawnBoss, endBoss, startRift, endRift, stepRift, riftLevel, tierDef, maxTier, curTier, tierAdd, ascTier, milestoneAt, addXp, RC, addCase, caseOdds, openCase, vaultState, collectVault, startExped, claimExped, autoHuntOn, initHubWorld, enemySpawnClear, stepEnemy, setEnemyLevel, dealDamage, startDungeon, endDungeon, claimDungeonChest, openDungeonPanel, addKey, makeKey, trialPoi, mineNode, nodeStates, openIdle, openDaily, openMenu };
  window.__gameBooted = true;
  // public site: keep models and textures on the phone between visits (sw.js); never inside the Claude artifact
  if ('serviceWorker' in navigator && /github\.io$/.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (LOCAL_PREVIEW) window.__ui = { UI, heroTab, openMerge, openBrawlers, openCases, openSmith, openArtifacts, openPrestige, openPrestigeReview, openIdle, openSettings, openWaypoints, openCollection, openMenu, openProgress, openSkills };
  if (LOCAL_PREVIEW) window.__dbg = { bossAttack, bossPlan, bossPlanMech, bossKit, bossDamageMod, BOSS_KITS, BOSS_TEAM, bossPartySize, MP, RT, mpApply, mpRebuild, pvpTargets, pvpOn, pvpRecv, forEachTarget, THREE, CFG, WorldModels, craft: { addMats, craftSetPiece, buyUpgrade, craftDungeonLoot, craftState, makeRelic, setBonuses, craftBonuses }, Post, renderer, scene, openMenu, openBrawlers, openSkills, openArtifacts, openProgress, TreeView, Feed, setBrawler, spendNode, views, dynGroup, camera, openWaypoints, openOffline, openSettings, Cloud, saveNow, TestTools, travelTo, chooseKeystone, computeOffline, claimOffline, autoTarget, AimFX, masteryLevel, rollLoot, updateAim, checkAchievements, availableAttacks, refresh: () => refreshPlayerStats(false), Showcase, setShowcase, buyForge, forgeOffer, arenaBotThink, simStep, startArena, leaveArena, chooseClass, acceptJob, turnInJob, addXp, spawnBoss, endBoss, openResults, heroTab, openSmith, upgradeItem, interact, UI, Input, Cam, Q, openRiftPanel, openRiftResult, tierPicker, riftGroup, hubGroup, enterRiftView, openCases, openCasesFast, spinCase, openIdle, openPlayers, buildPlayerIntent };
  $('loading').hidden = true; $('playBtn').hidden = false;
  // wait briefly for the cloud save before letting the player start, so progress is never overwritten
  const btn = $('playBtn'), label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Loading your save…';
  const done = () => { if (btn.disabled) { btn.disabled = false; if (btn.textContent === 'Loading your save…') btn.textContent = label; } };
  mpInit();
  cloudInit().finally(() => { if (!G.offlineChecked) { G.offlineChecked = true; G.offline = computeOffline(Date.now()); } const p = G.profile; btn.textContent = p.level > 1 || p.stats.jobs > 0 ? `Continue · Level ${p.level}` : label; done(); });
  setTimeout(done, 3500);
  requestAnimationFrame((t) => { lastFrame = t; frame(t); });
}

const hot = window.claude && window.claude.hot;
if (hot && hot.ready) hot.ready(boot); else boot(hot && hot.data ? hot.data : {});

