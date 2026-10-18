// --- effect choice per event: each weapon and monster type gets its own look ---
const DIE_COL = { slime: 0x6fdc5a, imp: 0x9fe3ff, wolf: 0x6d6a73, beetle: 0xff6a2b, wraith: 0xc77dff, boss: 0x8d8a83, boar: 0x8a5a3c, spider: 0x3f8a4c, yeti: 0xe8f0f8, fireimp: 0xff7a2b, sentinel: 0x9fe8ff, crawler: 0x2fbfae, drowned: 0x2fffd0, seraph: 0xfff07a, warden: 0xffc94a };
const RAR_FX = { common: 'white', uncommon: 'venom', rare: 'frost', epic: 'arcane', legendary: 'gold', mythic: 'blood', ancient: 'storm', divine: 'gold' };
let hitFxN = 0, hitFxT = 0;
function hitFx(e) {
  const y = Math.max(0.6, e.y * 0.6);
  if (e.toPlayer) { SpriteFX.play('hit', 'blood', e.x, y, e.z, 1.35); return; }
  // cap the sprite rate so gatlings and flamers don't flood the pool (crits always show)
  if (G.time - hitFxT > 0.1) { hitFxT = G.time; hitFxN = 0; }
  if (++hitFxN > 6 && !e.crit) return;
  const pal = e.pc != null ? fxPal(e.pc) : 'white', k = e.pk;
  if (e.gas) SpriteFX.play('bubble', 'venom', e.x, 0.1, e.z, 1.7);
  else if (e.burnFx) SpriteFX.play('flame', 'fire', e.x, 0.1, e.z, 1.4);
  else if (k === 'flame' || k === 'fire') SpriteFX.play('flame', pal === 'venom' || pal === 'arcane' || pal === 'frost' ? pal : 'fire', e.x, 0.1, e.z, 1.7);
  else if (k === 'ice' || e.slow) SpriteFX.play('shatter', pal === 'arcane' ? 'arcane' : 'frost', e.x, y, e.z, 1.7);
  else if (k === 'disc' || k === 'chakram' || k === 'melee' || k === 'wave') SpriteFX.play('slash', k === 'melee' ? 'white' : pal, e.x, y, e.z, 2.1, { rot: Math.random() * 6.28 });
  else if (k === 'rail' || k === 'spark') SpriteFX.play('zap', 'storm', e.x, y, e.z, 1.8, { rot: Math.random() * 6.28 });
  else if (k === 'orb' || k === 'star') SpriteFX.play('crit', pal === 'gold' ? 'gold' : 'arcane', e.x, y, e.z, 1.6);
  else if (e.proc) SpriteFX.play('impact', 'gold', e.x, y, e.z, 1.3);
  else SpriteFX.play(Math.random() < 0.35 ? 'hit' : 'impact', pal, e.x, y, e.z, 1.35);
  if (e.crit) {
    SpriteFX.play('crit', pal === 'arcane' ? 'arcane' : pal === 'fire' ? 'fire' : 'gold', e.x, y + 0.3, e.z, 2.7);
    if(e.byPlayer && !G.profile.settings.calm && !Q.lowTier && hqOn()) SpriteFX.play('ring','gold',e.x,.07,e.z,1.8,{speed:1.7});
  }
}
function boomFx(e) {
  const pal = fxPal(e.color), R = Math.max(0.7, e.r || 1), sz = R * (e.big ? 4.2 : 3.2);
  if (pal === 'frost' || pal === 'white') { SpriteFX.play('shatter', 'frost', e.x, 1, e.z, sz * 0.8); SpriteFX.play('ring', 'frost', e.x, 0, e.z, R * 2.6, { speed: 1.2 }); }
  else if (pal === 'arcane') { SpriteFX.play('nova', 'arcane', e.x, 1, e.z, sz * 0.9); SpriteFX.play('ring', 'arcane', e.x, 0, e.z, R * 2.4, { speed: 1.2 }); }
  else if (pal === 'storm') { SpriteFX.play('bolt', 'storm', e.x, 0, e.z, sz * 1.3); SpriteFX.play('ring', 'frost', e.x, 0, e.z, R * 2.6, { speed: 1.2 }); }
  else if (pal === 'venom') { SpriteFX.play('explosion', 'venom', e.x, 0, e.z, sz); SpriteFX.play('bubble', 'venom', e.x, 0, e.z, sz * 0.6, { delay: 0.2 }); SpriteFX.play('ring', 'venom', e.x, 0, e.z, R * 2.6, { speed: 1.2 }); }
  else { SpriteFX.play('explosion', pal, e.x, 0, e.z, sz); SpriteFX.play('ring', pal, e.x, 0, e.z, R * 2.6, { speed: 1.2 }); if (e.big) SpriteFX.play('dust', 'dust', e.x, 0, e.z, sz * 0.9, { delay: 0.1 }); }
  burst(e.x, 0.6, e.z, e.big ? 8 : 4, e.color, e.big ? 8 : 5, 0.5, 0.25, 14, 0.8);
}
function dieFx(e) {
  const dc = e.kind === 'fighter' ? 0xff4d6d : e.elite ? 0xffc94a : DIE_COL[e.kind] || 0xffd34a, pal = fxPal(dc);
  burst(e.x, 1, e.z, e.kind === 'boss' ? 60 : e.elite ? 30 : 16, dc, e.kind === 'boss' ? 14 : 7, 0.8, 0.35, 16, 1);
  const big = e.kind === 'boss' ? 2.6 : e.elite ? 1.6 : 1;
  SpriteFX.play('poof', e.kind === 'fighter' ? 'blood' : pal, e.x, 0, e.z, 3 * big);
  SpriteFX.play('impact', pal, e.x, 1, e.z, 2 * big);
  if (big > 1) { SpriteFX.play('explosion', pal, e.x, 0, e.z, 3 * big, { delay: 0.05 }); SpriteFX.play('crit', 'gold', e.x, 1.4 * big, e.z, 3 * big, { delay: 0.1 }); }
  if (e.kind === 'boss') { SpriteFX.play('nova', 'gold', e.x, 2, e.z, 12, { delay: 0.15 }); SpriteFX.play('pillar', 'gold', e.x, 0, e.z, 14, { delay: 0.3 }); SpriteFX.play('ring', 'fire', e.x, 0, e.z, 14); }
}

// --- event consumer: sim events -> sound, particles, UI ---
let fxBudget = 6;
function processEvents() {
  fxBudget = 6;
  const evs = G.events;
  for (let i = 0; i < evs.length; i++) {
    const e = evs[i];
    if (e.t.length > 4 && e.t.startsWith('hero')) { HeroFX.event(e); continue; }
    switch (e.t) {
      case 'toast': showToast(e.text, e.kind); break;
      case 'hit':
        if (e.gas) dmgNumber(e.x, e.y, e.z, e.amt, 'gas');
        else dmgNumber(e.x, e.y, e.z, e.amt, e.toPlayer ? 'hurt' : e.pet ? 'pet mine' : e.crit ? 'crit' : e.byPlayer ? 'mine' : 'other');
        hitFx(e);
        if (e.crit) burst(e.x, e.y * 0.6, e.z, 6, 0xffc94a, 6, 0.35, 0.18, 14);
        if (e.toPlayer) { Sfx.play('hurt', { gap: 0.08 }); if (!G.profile.settings.calm) { Cam.shake = Math.max(Cam.shake, 0.4); const vg = $('vignette'); vg.dataset.o = '0.32'; } }
        else if (e.byPlayer) { Sfx.play('hit', { gap: 0.03 }); if (!e.pet && !G.profile.settings.calm) Cam.shake = Math.max(Cam.shake, e.crit ? 0.3 : 0.15); }
        break;
      case 'shoot':
        if (e.kind === 'enemy') { if (near(e)) Sfx.play('enemyShot', { gap: 0.1 }); }
        else if (e.isPlayer || near(e, 18)) Sfx.play(e.kind, { gap: e.isPlayer ? (e.kind === 'tracer' ? 0.045 : 0.02) : 0.09 });
        break;
      case 'melee': SpriteFX.play('slash', 'white', e.x, 1.1, e.z, 2.8, { rot: Math.random() * 6.28 }); burst(e.x, 1, e.z, 6, 0xffffff, 6, 0.25, 0.2, 10); if (e.isPlayer || near(e, 15)) Sfx.play('melee'); break;
      case 'dash': SpriteFX.play('dust', 'dust', e.x, 0, e.z, 1.6); burst(e.x, 0.4, e.z, 10, 0xe8f4ff, 4, 0.35, 0.25, 2, 0.2); if (e.isPlayer || near(e, 15)) Sfx.play('dash', { gap: 0.05 }); break;
      case 'boom': if (e.lob) Cam.shake = Math.max(Cam.shake, near(e, 10) ? 0.3 : 0); if (e.hid) HeroFX.impact(e); else boomFx(e); if (near(e, 25)) Sfx.play('boom', { gap: 0.06 }); if (e.big && near(e, 14)) Cam.shake = Math.max(Cam.shake, 0.8); break;
      case 'puff': if (e.hid) HeroFX.impact(e); else burst(e.x, 1, e.z, 3, e.color, 3, 0.25, 0.15, 6); break;
      case 'bounce': SpriteFX.play('impact', 'white', e.x, 1, e.z, 1.1); burst(e.x, 1, e.z, 4, 0xffffff, 3, 0.2, 0.14, 4); if (near(e, 16)) Sfx.play('bounce', { gap: 0.05 }); break;
      case 'split': SpriteFX.play('impact', fxPal(e.color), e.x, 1, e.z, 1.5); burst(e.x, 1, e.z, 8, e.color, 5, 0.3, 0.18, 6); if (near(e, 18)) Sfx.play('split', { gap: 0.05 }); break;
      case 'petAttack':
        if(!G.profile.settings.calm)SpriteFX.play(e.kind==='slam'?'ring':'impact',e.id==='bull'?'fire':'frost',e.x,e.kind==='slam'?.08:.75,e.z,e.kind==='slam'?2.2:.7,{speed:1.6});
        break;
      case 'petLevel':
        showBanner(`${PET_DEFS[e.id].name} · level ${e.level}`,'Pet attack and world bonuses improved','good');Sfx.play('unlock');
        break;
      case 'unlock': {
        if (e.what === 'brawler') showBanner('A hero joins you!', `${e.name} · ${e.role} · Journal › Heroes`, 'gold');
        else showBanner('Relic discovered!', `${e.name} · Journal › Relics`, 'gold');
        Sfx.play('unlock'); UI.alertT = 0; break;
      }
      case 'attackEquipped': Sfx.play('job'); break;
      case 'zap': {
        const n = 7;
        for (let k = 0; k <= n; k++) { const a = k / n; burst(lerp(e.x0, e.x1, a) + (Math.random() - 0.5) * 0.4, 1.2 + Math.random() * 0.4, lerp(e.z0, e.z1, a) + (Math.random() - 0.5) * 0.4, 2, 0x9fe8ff, 1.5, 0.25, 0.22, 0); }
        SpriteFX.play('zap', 'storm', e.x1, 1.2, e.z1, 2.0, { rot: Math.random() * 6.28 });
        Sfx.play('zap', { gap: 0.05 }); break;
      }
      case 'forged': showToast(`Forged ${e.name}. ${e.perk}`, 'rare'); break;
      case 'die':
        dieFx(e);
        if (near(e, 22)) Sfx.play('die', { gap: 0.05 });
        if (e.kind === 'boss') Cam.shake = 1;
        break;
      case 'super': if (e.hero) { if (e.isPlayer) { Sfx.play('super'); Cam.shake = Math.max(Cam.shake, 0.4); } break; } if (e.isPlayer) { Sfx.play('super'); Cam.shake = Math.max(Cam.shake, 0.4); } burst(e.x, 1, e.z, 14, 0xffb02e, 7, 0.5, 0.25, 6); if (e.isPlayer || near(e, 20)) { SpriteFX.play('nova', 'gold', e.x, 1.2, e.z, 5.5); SpriteFX.play('ring', 'fire', e.x, 0, e.z, 6, { speed: 1.1 }); } break;
      case 'skill': { const pal = e.kind === 'ironskin' ? 'gold' : e.kind === 'swift' ? 'venom' : 'frost'; burst(e.x, 1, e.z, 12, e.kind === 'ironskin' ? 0xffd34a : e.kind === 'swift' ? 0x9cff9c : 0x9ae8ff, 5, 0.5, 0.22, 4); SpriteFX.play('pillar', pal, e.x, 0, e.z, 4.2); if (e.isPlayer) Sfx.play('super'); break; }
      case 'gold': if (e.amt > 0) Sfx.play('coin', { gap: 0.08 }); break;
      case 'xp': if (e.reason && e.reason !== 'kill') dmgNumberPlayer(`+${fmtK(e.amt)} XP`, 'xp'); XPDrops.add('xp', e.amt); break;
      case 'killXp': dmgNumber(e.x, 1.6, e.z, `+${fmtK(e.amt)} XP`, 'kxp'); break;
      case 'mxp': XPDrops.add(e.key, e.amt); break;
      case 'mastery':
        if (e.key.startsWith('w:') || e.key.startsWith('s:') || e.level % 5 === 0) { Sfx.play('level', { gap: 0.3 }); Feed.add(`${gi('m_skills')} ${e.name} mastery <b>${e.level}</b>`, 'mast', 'm' + e.key); }
        { const bd = CFG.badges.find((b) => b.lvl === e.level); if (bd && e.key.startsWith('w:')) { showBanner(`${bd.name} badge!`, `${e.name} · +3% damage, +2% HP · title “${bd.title}”`, 'gold'); Sfx.play('win'); } }
        if (e.level === 99) showBanner(`${e.name} 99`, 'Skillcape unlocked! Look behind you.', 'gold');
        break;
      case 'milestone': showBanner(`Milestone chest · Level ${e.level}`, `Guaranteed ${CFG.gear.rarity[e.rarity].name} item + ${e.essence} gems`, 'gold'); Sfx.play('win'); break;
      case 'keystoneReady': showToast(`New keystone tier open! Hero › Build`, 'good'); UI.alertT = 0; break;
      case 'keystone': showToast(`Keystone: ${e.name}`, 'good'); Sfx.play('unlock'); break;
      case 'luck': Feed.add(`${gi('m_gem')} Luck guarantee: <b>${CFG.gear.rarity[e.rarity].name}</b> drop`, 'luck'); break;
      case 'essence': if (e.amt >= 3) Feed.add(`${gi('m_gem')} +${e.amt} gems`, 'gem'); break;
      case 'node': break;
      case 'treeReset': showToast('Tree reset. Points refunded.', 'good'); break;
      case 'autoSalvage': break;
      case 'salvaged': Feed.add(`${gi('m_coin')} Salvaged ${e.n} · +${fmtK(e.gold)} gold${e.ess ? ` · +${e.ess} gems` : ''}`); break;
      case 'waypoint': Feed.add(`${gi('m_portal')} Lodestone attuned: <b>${e.name}</b>`, 'wp'); Sfx.play('unlock'); break;
      case 'tier': showBanner(`World Tier: ${e.name}`, e.tier ? `Monsters +${tierDef(e.tier).add} levels · richer drops` : 'Base difficulty', e.tier >= 2 ? 'red' : 'gold'); Sfx.play('horn'); break;
      case 'riftStart': enterRiftView(true); Cam.yaw = 0; Cam.pos.set(e.x, 30, e.z - 14); Cam.look.set(e.x, 0, e.z + 1.5); Cam.fx = e.x; Cam.fz = e.z + 1.5; burst(e.x, 1, e.z, 40, 0xff5d8f, 7, 0.9, 0.3, 2, 1.6); SpriteFX.play('pillar', 'arcane', e.x, 0, e.z, 6); Sfx.play('super'); showBanner(`The Rift · Floor ${e.floor}`, 'Clear every monster before time runs out', 'red'); break;
      case 'champShield': ringFx(e.x, e.z, e.r, 0x5dd6ff, 2.2); break;
      case 'champCast': ringFx(e.x, e.z, e.r, e.color, 0.7); break;
      case 'champBlink': ringFx(e.x, e.z, 2.4, e.out ? 0xa36bff : 0xff3b3b, e.out ? 0.5 : 0.8); if (e.out) { burst(e.x, 1, e.z, 16, 0xa36bff, 5, 0.6, 0.25, 2, 1.2); SpriteFX.play('poof', 'arcane', e.x, 0, e.z, 3); } break;
      case 'riftWave': if (e.guard) { showBanner(`Floor ${e.floor} · Rift Lord!`, `Read the red warnings · dash through attacks`, 'red'); Sfx.play('horn'); } else if (e.champs) { Feed.add(`${gi('m_floor')} Floor <b>${e.floor}</b> · ${e.champs} champion${e.champs > 1 ? 's' : ''} · Lv ${e.lvl}`, 'rift'); } else Feed.add(`${gi('m_floor')} Floor <b>${e.floor}</b> · ${e.theme} · Lv ${e.lvl}`, 'rift'); break;
      case 'riftClear': Feed.add(`${gi('m_rift')} <b class="grade g${e.grade}">${e.grade}</b> Floor ${e.floor}${e.grade === 'S' ? ' · flawless ×2' : e.grade === 'A' ? ' · ×1.5' : ''} · +${e.gems} gems · +${fmtK(e.gold)} gold${e.item ? ' · guardian item!' : ''}`, 'rift'); Sfx.play('job'); burst(G.player.x, 1, G.player.z, 24, 0xff7ab8, 6, 0.8, 0.25, 3, 1.3); SpriteFX.play('nova', e.grade === 'S' ? 'gold' : 'arcane', G.player.x, 1.2, G.player.z, 5); break;
      case 'dungeonStart': enterDungeonView(true); Cam.yaw = 0; Cam.pos.set(e.x, 30, e.z - 14); Cam.look.set(e.x, 0, e.z + 1.5); Cam.fx = e.x; Cam.fz = e.z + 1.5; SpriteFX.play('pillar', 'frost', e.x, 0, e.z, 6); Sfx.play('super'); showBanner(e.name, e.delve ? `${e.diff} · Monsters Lv ${e.lvl}${e.n > 1 ? ` · party of ${e.n}` : ''} · no PvP inside` : `${e.key ? `Tier ${e.key} key · ` : ''}Monsters Lv ${e.lvl} · clear each hall to open its door`, 'red'); break;
      case 'dungeonRoom': Feed.add(`${gi('m_portal')} Hall ${e.i}/${e.n} cleared · ${e.boss ? 'the boss awaits' : 'the next door opens'}`, 'rift'); Sfx.play('unlock'); break;
      case 'rune': SpriteFX.play('pillar', 'arcane', e.x, 0, e.z, 8); Sfx.play('unlock');
        if (e.n >= e.of) { const tp = trialPoi(e.zone); showBanner('Legendary Trial unlocked', `${tp.landmark} hums with power · go there to begin`, 'gold'); }
        else showToast(`A runestone awakens (${e.n}/${e.of}) · more sleep in this area`, 'good'); break;
      case 'radiant': G.slowT = 1.4; SpriteFX.play('pillar', 'gold', e.x, 0, e.z, 22); SpriteFX.play('nova', 'gold', e.x, 1, e.z, 14, { delay: 0.2 }); burst(e.x, 1, e.z, 60, 0xfff07a, 9, 1.2, 0.3, 4, 2); Sfx.play('radiant');
        showBanner('RADIANT', `${escapeHTML(e.name)} · trial ${e.n} · 1 in ${fmt(e.odds)}`, 'gold'); Feed.add(`<b>${escapeHTML(G.profile.name || 'You')}</b> found <b>${escapeHTML(e.name)}</b> after ${e.n} trials!`, 'boss'); break;
      case 'mined': burst(e.x, 1.6, e.z, 14, e.rich ? 0xffd34a : 0xb8c4d0, 4, 0.6, 0.2, 3, 1); Sfx.play('hit');
        showToast(`${e.name}: +${e.ore} ${e.oreName || 'ore'}${e.geodes ? ` · ${e.geodes} Geode${e.geodes > 1 ? 's' : ''}!` : ''}`, e.geodes || e.rich ? 'good' : ''); break;
      case 'mats': { const A = UI.matAcc || (UI.matAcc = {}), now = performance.now(); // pickups of one material stack on one feed line
        for (const [id, n] of e.got) { const a = A[id] && now - A[id].t < 5500 ? A[id] : (A[id] = { n: 0 }); a.n += n; a.t = now;
          Feed.add(`<i class="matdot" style="--mc:#${MATS[id].color.toString(16).padStart(6, '0')}"></i> +${a.n} <b>${MATS[id].name}</b> <small>(${fmtK(matCount(id))})</small>`, 'mat', 'mat' + id); } break; }
      case 'crafted': showToast(`Garo crafted ${escapeHTML(e.name)}`, 'rare'); Sfx.play('unlock'); break;
      case 'masterwork': showToast(`${e.name} · rank ${e.rank}`, 'good'); break;
      case 'relic': G.slowT = 1; Sfx.play('radiant'); showBanner('Relic found!', `${escapeHTML(e.name)} · only these dungeons hold it`, 'gold'); Feed.add(`<b>${escapeHTML(G.profile.name || 'You')}</b> found the relic <b>${escapeHTML(e.name)}</b>!`, 'boss'); break;
      case 'mineral': if (e.first) showToast(`New for the Museum: ${e.name} (${e.n} kinds · +${e.n}% XP)`, 'good'); break;
      case 'minePet': G.slowT = 1.4; Sfx.play('radiant'); SpriteFX.play('pillar', 'venom', G.player.x, 0, G.player.z, 18);
        showBanner(e.had ? 'Pet found again!' : 'A pet in the rock!', e.had ? `+${CFG.mining.petGems} gems` : `${PET_DEFS[e.id].name} joins you · 1 in ${fmt(CFG.mining.pet)}`, 'gold');
        Feed.add(`<b>${escapeHTML(G.profile.name || 'You')}</b> dug up <b>${PET_DEFS[e.id].name}</b>!`, 'boss'); break;
      // party dungeons (36b-delve.js)
      case 'delveEvent': { const E = CFG.delve.events[e.k]; showBanner(E.name, E.d, 'gold'); ringFx(e.x, e.z, 5, 0xffd34a, 1.1); Sfx.play('horn'); break; }
      case 'delveMini': showBanner(escapeHTML(e.name), 'A champion of the dungeon guards this hall', 'red'); ringFx(e.x, e.z, 7, 0xff5d8f, 1.1); Sfx.play('horn'); break;
      case 'delvePhase': showBanner(`Phase ${e.n} of ${e.of}`, `${escapeHTML(e.name)}${e.rage ? ' is enraged' : ' calls for help'}${e.adds && e.adds.length ? ' · new: ' + e.adds.map(escapeHTML).join(', ') : ''}`, 'red'); ringFx(e.x, e.z, 6, e.rage ? 0xff3030 : 0xff5d8f, 1); Sfx.play('horn'); if (e.rage) burst(e.x, 1.5, e.z, 34, 0xff3030, 6, 0.9, 0.4, 3, 2); break;
      case 'delvePuzzle': { const K = CFG.delve.puzzle.kinds[e.kind] || {}; showBanner(`${escapeHTML(e.name)} · ${K.name || ''}`, e.pips ? CFG.delve.puzzle.pipsHint : K.hint || CFG.delve.puzzle.hint, 'gold'); ringFx(e.x, e.z, 6, 0xffd34a, 1.1); Sfx.play('horn'); break; }
      case 'delvePzClock': showToast(`The race is on: ${e.secs} seconds!`, 'bad'); ringFx(e.x, e.z, 7, 0xffd34a, 0.8); Sfx.play('horn'); break;
      case 'delvePzStep': showToast(e.flip ? `${e.n} of ${e.of} seals lit` : `Seal ${e.n} of ${e.of} awake`, 'good'); ringFx(e.x, e.z, 2, 0xffd34a, 0.6); Sfx.play('tick'); break;
      case 'delvePzFail': showToast(`${e.timed ? 'Too slow!' : 'Wrong seal!'} ${e.spikes ? 'The floor bites back' : 'Something crawls out'}`, 'bad'); ringFx(e.x, e.z, 7, 0xff3344, 0.8); Sfx.play('lose'); break;
      case 'delvePzDone': showBanner(`${escapeHTML(e.name)} solved`, 'The gate opens', 'gold'); burst(e.x, 1, e.z, 30, 0xffd34a, 6, 0.9, 0.4, 3, 2); Sfx.play('unlock'); break;
      case 'delveBossCast': if (e.k === 'charge' || e.k === 'spiral' || e.k === 'meteors') Sfx.play('horn', { gap: 1 }); ringFx(e.x, e.z, 3, 0xff5d8f, 0.5); break;
      case 'delveVein': if (e.lode) showBanner('Motherlode!', `+${e.n} ${escapeHTML(e.name)}`, 'gold'); else showToast(`+${e.n} ${escapeHTML(e.name)} · a rare dungeon treasure`, 'good'); burst(e.x, 1.2, e.z, e.lode ? 40 : 24, 0xffe27a, 5, 0.9, 0.4, 4, 2); Sfx.play(e.lode ? 'radiant' : 'unlock'); break;
      case 'delveWave': showToast(`Wave ${e.n + 1} of ${e.of}!`, 'bad'); ringFx(e.x, e.z, 6, 0xff5d8f, 0.9); break;
      case 'delveBonus': Feed.remove('dlvEvent'); showToast(e.why + ' · open the cache', 'good'); burst(e.x, 1, e.z, 26, 0xffd34a, 5, 0.9, 0.4, 4, 2); Sfx.play('unlock'); break;
      case 'delveEscape': Feed.remove('dlvEvent'); showToast('The goblin got away with its gold…', 'bad'); burst(e.x, 1, e.z, 18, 0xffd34a, 4, 0.6, 0.3, -2, 3); break;
      case 'delveMimic': showBanner('MIMIC!', 'The chest has teeth', 'red'); ringFx(e.x, e.z, 3, 0xff3344, 0.8); Sfx.play('horn'); break;
      case 'delveCurse': showToast('Cursed: your health is capped, the final chest is richer', 'bad'); burst(e.x, 1, e.z, 30, 0x9b3dff, 4, 0.9, 0.4, -1, 2); Sfx.play('lose'); break;
      case 'delveHeal': showToast('The moonwell restores you', 'good'); burst(e.x, 1, e.z, 30, 0x9fe8ff, 4, 0.9, 0.4, -1, 2); Sfx.play('level'); break;
      case 'delveRevived': showToast(`You pulled ${e.who || 'your ally'} back up!`, 'good'); ringFx(e.x, e.z, 2.5, 0x6cff8a, 0.8); break;
      case 'delveSet': G.slowT = 1; Sfx.play('radiant'); showBanner('Set piece!', `${escapeHTML(e.name)} · ${escapeHTML(e.set)} set`, 'gold'); break;
      case 'dungeonAdds': ringFx(e.x, e.z, 4, 0xff5d8f, 0.8); showToast('The boss calls for help!', 'bad'); break;
      case 'dungeonBoss': Feed.remove('dungeon'); Feed.remove('dlvEvent'); showBanner(`${e.name} cleared!`, `${Math.floor(e.secs / 60)}:${String(e.secs % 60).padStart(2, '0')} · ${!e.key ? '' : e.up ? `beat par: key +${e.up} → Tier ${e.key} · ` : `Tier ${e.key} key · `}open the chest`, 'gold'); Sfx.play('win'); burst(e.x, 1, e.z, 30, 0xffc94a, 6, 0.9, 0.3, 3, 1.5); break;
      case 'dungeonEnd': enterDungeonView(false); Cam.yaw = 0; Cam.pos.set(e.x, 30, e.z - 14); Cam.look.set(e.x, 0, e.z + 1.5); Cam.fx = e.x; Cam.fz = e.z + 1.5; Feed.remove('dungeon'); Feed.remove('dlvEvent'); if (e.why === 'down') showToast(e.delve ? `Your party fell in ${e.name}` : `${e.name} resets · you fell`, 'bad'); if (e.delve && typeof openDelvePanel === 'function' && e.why !== 'away') setTimeout(() => { if (!G.modal && G.mode === 'hub' && !inInstance()) openDelvePanel(); }, 900); break;
      case 'siegeStart': enterSiegeView(true); Cam.yaw = 0; Cam.pos.set(e.x, 30, e.z - 14); Cam.look.set(e.x, 0, e.z + 1.5); Cam.fx = e.x; Cam.fz = e.z + 1.5; SpriteFX.play('pillar', 'gold', e.x, 0, e.z, 6); Sfx.play('super'); showBanner(`Bastion Siege · Wave ${e.wave}`, 'Protect the Keep and the wagons · tap Build to place defenders', 'gold'); break;
      case 'siegeWave': if (e.boss) { showBanner(`Wave ${e.wave} · Siege Lord!`, `${e.count} monsters from ${e.sides} · Lv ${e.lvl}`, 'red'); Sfx.play('horn'); } else { showBanner(`Wave ${e.wave}${e.mini ? ' · Siege Captain' : ''}`, `${e.count} monsters from ${e.sides} · Lv ${e.lvl}`, 'red'); Sfx.play(e.mini ? 'horn' : 'tick'); } break;
      case 'siegeClear': Feed.add(`${gi('m_hero')} Wave <b>${e.wave}</b> held · +${fmtK(e.gold)} gold · +${e.stones} Bastion Stones${e.item ? ' · Siege Lord item!' : ''}`, 'rift'); Sfx.play('job'); burst(G.player.x, 1, G.player.z, 24, 0xffc94a, 6, 0.8, 0.25, 3, 1.3); break;
      case 'objectiveHit': if (e.main) { showToast(`${e.name} is under attack!`, 'bad'); Sfx.play('hurt', { gap: 0.5 }); } ringFx(e.x, e.z, 3, 0xff3b3b, 0.5); break;
      case 'objectiveDown': burst(e.x, 2, e.z, 50, 0xff7a3d, 9, 1.2, 0.4, 4, 2); SpriteFX.play('explosion', 'fire', e.x, 0, e.z, 8); Cam.shake = Math.max(Cam.shake, 0.8); Sfx.play('boom');
        if (!e.main) showBanner(`${e.name} destroyed`, 'Less gold per wave · keep the Keep standing', 'red'); break;
      case 'siegeEnd': enterSiegeView(false); Cam.yaw = 0; Cam.pos.set(e.x, 30, e.z - 14); Cam.look.set(e.x, 0, e.z + 1.5); Cam.fx = e.x; Cam.fz = e.z + 1.5; Feed.remove('rift'); if (e.why === 'keep') { Sfx.play('lose'); showToast('The Keep has fallen', 'bad'); } break;
      case 'fortBuilt': if (e.type === 'wall' || e.type === 'gate') burst(e.x, 0.6, e.z, 8, 0xd8b07a, 3, 0.5, 0.25, 2, 0.8); else { SpriteFX.play('pillar', 'gold', e.x, 0, e.z, 4); burst(e.x, 1, e.z, 20, 0xffd34a, 5, 0.7, 0.3, 3, 1.2); } if (e.done) showToast(`${CFG.siege.towers[e.type].name} reached level ${e.l}`, 'good'); break;
      case 'fortTrap': if (e.type === 'bomb') { SpriteFX.play('explosion', 'fire', e.x, 0, e.z, e.r * 1.4); SpriteFX.play('ring', 'fire', e.x, 0, e.z, e.r * 2.4, { speed: 1.2 }); SpriteFX.play('dust', 'dust', e.x, 0, e.z, e.r, { delay: 0.1 }); if (near(e, 30)) { Sfx.play('boom'); Cam.shake = Math.max(Cam.shake, 0.5); } }
        else { SpriteFX.play('slash', 'white', e.x, 0.6, e.z, 2.2); burst(e.x, 0.3, e.z, 10, 0xc8ccd4, 4, 0.4, 0.2, 3, 1.4); if (near(e, 22)) Sfx.play('melee', { gap: 0.1 }); }
        break;
      case 'fortGone': burst(e.x, 0.8, e.z, 16, 0x8a7a6a, 4, 0.8, 0.4, 3, 1.2); break;
      case 'fortBroken': burst(e.x, 1, e.z, 26, 0x6a5a4a, 6, 1, 0.4, 3, 1.4); Sfx.play('boom', { gap: 0.3 }); break;
      case 'fortShot': { const y = e.y || 1.6, hear = near(e, 26);
        if (e.type === 'cannon') { SpriteFX.play('explosion', 'fire', e.x, y, e.z, 1.5); burst(e.x, y, e.z, 12, 0xcfcac2, 3, 0.7, 0.35, -0.6, 0.8); if (hear) { Sfx.play('boom', { gap: 0.2 }); if (near(e, 12)) Cam.shake = Math.max(Cam.shake, 0.15); } }
        else if (e.type === 'ballista') { burst(e.x, y, e.z, 8, 0xd8b07a, 4, 0.35, 0.22, 2, 0.4); if (hear) Sfx.play('bounce', { gap: 0.15 }); }
        else if (e.type === 'mage') { SpriteFX.play('nova', 'arcane', e.x, y, e.z, 1.4); burst(e.x, y, e.z, 10, 0xc58cff, 4, 0.45, 0.25, 0, 0.5); if (hear) Sfx.play('zap', { gap: 0.15 }); }
        else { burst(e.x, y, e.z, 5, 0xffe08a, 3, 0.3, 0.18, 1, 0.3); if (hear) Sfx.play('pellet', { gap: 0.1 }); }
        break; }
      case 'riftEnd': enterRiftView(false); Cam.yaw = 0; Cam.pos.set(e.x, 30, e.z - 14); Cam.fx = e.x; Cam.fz = e.z + 1.5; Feed.remove('rift'); break;
      case 'teleport': burst(e.x, 1, e.z, 30, 0x9fe8ff, 6, 0.8, 0.3, 2, 1.5); SpriteFX.play('pillar', 'frost', e.x, 0, e.z, 5.5); Sfx.play('super'); Cam.pos.set(e.x, 30, e.z - 14); Cam.fx = e.x; Cam.fz = e.z + 1.5; showToast(e.name); break;
      case 'proc': burst(e.x, 1.2, e.z, 8, e.kind === 'grasp' ? 0x8dff6a : e.kind === 'kraken' ? 0x5dd6ff : 0xffe066, 4, 0.4, 0.22, 4); SpriteFX.play(e.kind === 'kraken' ? 'zap' : 'impact', e.kind === 'grasp' ? 'venom' : e.kind === 'kraken' ? 'storm' : 'gold', e.x, 1.3, e.z, 1.9); break;
      case 'undying': burst(e.x, 1.2, e.z, 24, 0xff3b4a, 6, 0.8, 0.3, 2, 1.5); SpriteFX.play('pillar', 'blood', e.x, 0, e.z, 5); SpriteFX.play('nova', 'blood', e.x, 1.2, e.z, 4.5); if (e.isPlayer) { showToast('Undying Rage!', 'bad'); Sfx.play('super'); } break;
      case 'sunfire': ringFx(e.x, e.z, 4, 0xff7a2b, 0.4); SpriteFX.play('ring', 'fire', e.x, 0, e.z, 8, { speed: 1.3 }); break;
      case 'streakEnd': if (e.n >= 10) showToast(`Streak ended at ${e.n} kills`); break;
      case 'levelup':
        Sfx.play('level'); burst(G.player.x, 1, G.player.z, 30, 0xffd34a, 6, 1, 0.3, 4, 1.5); ringFx(G.player.x, G.player.z, 4, 0xffd34a, 0.9);
        SpriteFX.play('pillar', 'gold', G.player.x, 0, G.player.z, 7); SpriteFX.play('nova', 'gold', G.player.x, 1.4, G.player.z, 5, { delay: 0.12 });
        break;
      case 'levelPower': {
        const n = e.level - e.from, pts = (() => { let s = 0; for (let L = e.from + 1; L <= e.level; L++) s += 2 + (L % 10 === 0 ? 5 : 0); return s; })();
        { const opened = Object.keys(UNLOCK_AT).filter((k) => UNLOCK_AT[k] > e.from && UNLOCK_AT[k] <= e.level); if (opened.length) showToast(`New: ${opened.map((k) => UNLOCK_NAME[k]).join(', ')} · open the menu`, 'good'); }
        showBanner(`Level ${e.level}!`, `Power ${fmtK(e.p0)} → ${fmtK(e.p1)} · +${pts} talent points${n > 1 ? ` · ${n} levels` : ''}${e.level % 10 === 0 ? ' · Treasure Chest' : ''}`, 'gold');
        break;
      }
      case 'caseGot': { const K = CFG.cases[e.k]; Feed.add(`${gi('m_case')} <b style="color:${K.col}">${K.name}</b> found · open it in your Journal › Treasure Chests`, 'case'); Sfx.play('unlock'); UI.caseFlash = 1.2; break; }
      case 'vault': showToast(`Bank collected: +${fmtK(e.v.gold)} coins, +${e.v.gems} gems${e.v.cases ? `, ${e.v.cases} chest${e.v.cases > 1 ? 's' : ''}` : ''}`, 'good'); Sfx.play('coin'); break;
      case 'vaultUp': showToast(`Vault level ${e.lv}`, 'good'); Sfx.play('unlock'); break;
      case 'expStart': showToast(`${CFG.brawlers[e.b].name} left on a ${e.d >= 60 ? e.d / 60 + 'h' : e.d + 'm'} expedition`); break;
      case 'expDone': showToast(`${CFG.brawlers[e.b].name} is back: +${fmtK(e.r.gold)} coins, +${e.r.gems} gems${e.r.cases ? `, ${e.r.cases} chest${e.r.cases > 1 ? 's' : ''}` : ''}`, 'good'); Sfx.play('win'); break;
      case 'achievement': Feed.add(`${gi('m_feats')} Feat: <b>${e.name}</b>`, 'feat'); Sfx.play('job'); break;
      case 'jobAccepted': showToast(`Job accepted: ${e.title}`); break;
      case 'jobDone': Sfx.play('job'); break;
      case 'jobTurnedIn': Sfx.play('job'); break;
      case 'drop': {
        if (e.source === 'case') { UI.alertT = 0; break; } // the reel shows it
        const src = e.source === 'level' ? 'Level reward' : e.source === 'milestone' ? 'Milestone chest' : e.source === 'shrine' ? 'Shrine reward' : e.source === 'boss' ? 'Boss loot' : e.source === 'elite' ? 'Elite drop' : e.source === 'idle' ? 'While away' : 'Drop';
        if (!e.better) showToast(`${src}: ${CFG.gear.rarity[e.item.rarity].name} ${e.item.name} · in your bag`, e.item.rarity);
        Sfx.play('pickup'); UI.alertT = 0;
        if (rarIdx(e.item.rarity) >= 4) { showBanner(CFG.gear.rarity[e.item.rarity].name + '!', e.item.name, rarIdx(e.item.rarity) >= 5 ? 'red' : 'gold'); Sfx.play('win'); const rp = RAR_FX[e.item.rarity]; SpriteFX.play('pillar', rp, G.player.x, 0, G.player.z, 6.5); if (rarIdx(e.item.rarity) >= 5) { burst(G.player.x, 1.2, G.player.z, 50, RAR_HEX[e.item.rarity], 8, 1.2, 0.35, 3, 1.8); ringFx(G.player.x, G.player.z, 5, RAR_HEX[e.item.rarity], 0.8); SpriteFX.play('nova', rp, G.player.x, 1.4, G.player.z, 6, { delay: 0.1 }); } }
        break;
      }
      case 'equipped': burst(G.player.x, 1.2, G.player.z, 18, 0xffd34a, 4, 0.6, 0.22, 3, 1.2); SpriteFX.play('crit', 'gold', G.player.x, 1.4, G.player.z, 2.6); Sfx.play('job'); UI.alertT = 0; break;
      case 'pellet': burst(e.x, 0.5, e.z, 3, e.color, 2.5, 0.3, 0.14, 6); SpriteFX.play('impact', fxPal(e.color), e.x, 0.6, e.z, 1.0); Sfx.play('pellet', { gap: 0.03 }); break;
      case 'bolt':
        for (let k = 0; k < 9; k++) burst(e.x + (Math.random() - 0.5) * 0.3, k * 0.8, e.z + (Math.random() - 0.5) * 0.3, 1, 0xe6dcff, 0.6, 0.3, 0.32, 0, 0.1);
        SpriteFX.play('bolt', 'arcane', e.x, 0, e.z, 7);
        ringFx(e.x, e.z, 1.8, 0xc9b8ff, 0.35); if (near(e, 25)) { Sfx.play('storm', { gap: 0.05 }); Cam.shake = Math.max(Cam.shake, 0.3); }
        break;
      case 'special': { const E = CFG.elements[e.el]; burst(e.x, 1.2, e.z, 14, E.color, 5, 0.5, 0.25, 4); SpriteFX.play(e.el === 'storm' ? 'zap' : e.el === 'ice' ? 'shatter' : e.el === 'poison' ? 'bubble' : 'flame', fxPal(E.color), e.x, e.el === 'storm' || e.el === 'ice' ? 1.2 : 0, e.z, 3.2); if (e.isPlayer || near(e, 18)) Sfx.play(e.el); break; }
      case 'shrineStart': showBanner('Shrine challenge!', `Defeat ${e.n} enemies in ${e.secs}s. Stay near the shrine`, 'red'); Sfx.play('horn'); break;
      case 'shrineWin': showBanner('Challenge complete!', `+${e.gold} gold, XP and an item`, 'gold'); Sfx.play('win'); break;
      case 'shrineFail': showToast(`Challenge failed. The shrine recharges in ${CFG.shrines.cooldownFail}s`, 'bad'); Sfx.play('lose'); break;
      case 'upgrade': showToast(e.n > 1 ? `${e.name} +${e.n} upgrades → +${e.up}` : `${e.name} is now +${e.up}`, 'good'); break;
      case 'pickup': burst(e.x, 0.6, e.z, 10, 0xff5fa2, 4, 0.5, 0.2, 8); SpriteFX.play('crit', 'arcane', e.x, 0.9, e.z, 1.8); Sfx.play('pickup'); break;
      case 'zone': { const zn = CFG.world.zones[zoneAt(G.player.z)]; const prevB = Feed.lastBiome; Feed.lastBiome = zn.biome;
        Feed.add(zn.safe ? `${gi('m_progress')} Back at <b>${e.name}</b> · safe` : prevB != null && prevB !== zn.biome ? `${gi('m_progress')} <b>${zn.biomeName}</b> › ${e.name} · Lv ${zn.lvl[0]}–${zn.lvl[1]}` : `${gi('m_progress')} Entered <b>${e.name}</b> · Lv ${zn.lvl[0]}–${zn.lvl[1]}`, 'zone'); break; }
      case 'bossWarn': { Sfx.play('horn'); const Zb = CFG.world.zones[G.bossLair], locked = G.bossLair > highestZone(G.profile.level);
        showBanner('BOSS INCOMING', `${Zb ? Zb.boss : 'A world boss'} rises in ${e.lair} in ${e.secs}s${locked ? ' · area not unlocked for you yet' : ' · unlocked area'}`, 'red'); break; }
      case 'bossSpawn': Sfx.play('horn'); burst(e.x, 0.5, e.z, 50, 0x8d8a83, 10, 1.2, 0.5, 14, 1.2); SpriteFX.play('dust', 'dust', e.x, 0, e.z, 6); SpriteFX.play('ring', 'fire', e.x, 0, e.z, 10); break;
      case 'bossDown': Feed.remove('boss'); Feed.add(`${gi('m_feats')} World boss defeated!`, 'boss'); Sfx.play('win'); break;
      case 'bossGone': Feed.remove('boss'); Feed.add(`${gi('k_titan')} ${e.name} sank back into the ground`, 'boss'); break;
      case 'telegraph': if (e.len) laneFx(e.x, e.z, e.a, e.len, e.w || 1.4, 0xff4d4d, 0.6); break;
      case 'moveTele': if (e.len) laneFx(e.x, e.z, e.a, e.len, e.w, TELE_MOB, e.life); else ringFx(e.x, e.z, e.r, e.color || TELE_MOB, e.life, !e.color); break; // monster moves: red lane or filling ring
      case 'windFx': if (near(e, 28)) windupFx(e); break;
      case 'aoeFx': if (near(e, 32) && fxBudget-- > 0) aoeImpactFx(e); break; // at most a few big impacts a frame: a 16-spike cross no longer spawns 16 sprites
      case 'bossCall': bossCallFx(e); break;
      case 'bossPhase': bossPhaseFx(e); break;
      case 'wardBreak': wardBreakFx(e, true); break;
      case 'wardFail': wardBreakFx(e, false); break;
      case 'soakOk': Sfx.play('win'); burst(e.x, 0.5, e.z, 26, 0xffd34a, 7, 0.8, 0.35, 2, 3); SpriteFX.play('ring', e.pal || 'gold', e.x, 0, e.z, 9); break;
      case 'bossRocks': if (near(e, 25)) Sfx.play('boom', { gap: 0.1 }); break;
      case 'respawn': showToast('Back in town. Watch your health!'); break;
      case 'spawn': break;
      case 'classChosen': showBanner(`You are a ${CFG.classes[e.cls].name}`, 'New super, skill and skill tree unlocked', 'gold'); Sfx.play('level'); break;
      case 'arenaStart': Cam.yaw = 0; { const f0 = G.arena.fighters[0]; Cam.pos.set(f0.x, 30, f0.z - 14); Cam.look.set(f0.x, 0, f0.z + 1.5); Cam.fx = f0.x; Cam.fz = f0.z + 1.5; } hubGroup.visible = false; arenaGroup.visible = true; scene.fog.near = 60; scene.fog.far = 160; scene.fog.color.set(PALETTE.fog); paintSky(new THREE.Color(PALETTE.skyTop), new THREE.Color(PALETTE.skyHorizon)); Coach.render(); break;
      case 'arenaEnd': Cam.yaw = 0; Cam.pos.set(G.player.x, 30, G.player.z - 14); Cam.fx = G.player.x; Cam.fz = G.player.z + 1.5; hubGroup.visible = true; arenaGroup.visible = false; scene.fog.near = 50; scene.fog.far = Q.lowTier ? 95 : 140; Coach.render(); break;
      case 'fightStart': Sfx.play('tick'); showBanner('Fight!', 'Last one standing wins', 'gold'); break;
      case 'ko': showToast(`You knocked out ${e.name}!`, 'good'); break;
      case 'cube': burst(e.x, 0.8, e.z, 12, 0x6cff8a, 5, 0.6, 0.25, 6); if (e.isPlayer) { Sfx.play('pickup'); showToast('Power cube: +10% HP and damage', 'good'); } break;
      case 'victory': Sfx.play('win'); showBanner('Victory!', 'Last one standing', 'gold'); break;
      case 'defeat': Sfx.play('lose'); showBanner(`#${e.place}`, 'Knocked out', 'red'); break;
    }
  }
  evs.length = 0;
  if (G.dungeon) { if (G.dungeon.delve) delveHud(); else dungeonHud(); }
  else if ($('partyBar') && !$('partyBar').hidden) $('partyBar').hidden = true;
}
// dungeon HUD: a live feed line with hall x/3 or the boss's health
function dungeonHud() {
  const D = G.dungeon, b = D.boss, n = D.rooms.length - 1;
  if (!D.bossDead && (D.room === n || D.doors.every((d) => d.open))) Feed.add(`${gi('k_titan')} <b>${b.champName || 'Boss'}</b> · ${Math.ceil(clamp(b.hp / b.maxHp, 0, 1) * 100)}%`, 'boss', 'dungeon', 1.2);
  else if (!D.bossDead) Feed.add(`${gi('m_portal')} ${escapeHTML(D.poi.name)} · hall ${Math.min(D.room + 1, n)}/${n} · ${D.rooms[Math.min(D.room, n - 1)].mobs.filter((e) => e.alive).length} left`, 'rift', 'dungeon', 1.2);
}
const FMT_U = ['', 'k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
const fmtK = (n) => {
  n = Math.round(n); const a = Math.abs(n); if (a < 1e4) return fmt(n);
  if (a >= 1e36) { const x = Math.floor(Math.log10(a)); return (n / Math.pow(10, x)).toFixed(2).replace(/\.?0+$/, '') + 'e' + x; } // past Dc: scientific
  const e = Math.min(FMT_U.length - 1, Math.floor(Math.log10(a) / 3)), v = n / Math.pow(1000, e), av = Math.abs(v);
  return (av >= 100 ? v.toFixed(0) : av >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(/\.0+$/, '') + FMT_U[e];
};
// RuneScape-style XP drops: small numbers that float up by the minimap, merged per skill
const XPDrops = {
  acc: new Map(), t: 0,
  add(key, amt) { if (!(amt > 0)) return; this.acc.set(key, (this.acc.get(key) || 0) + amt); },
  update(dt) {
    this.t -= dt; if (this.t > 0 || !this.acc.size) return; this.t = 0.45;
    const box = $('xpDrops'); if (!box) return;
    for (const [k, v] of this.acc) {
      const el = document.createElement('div'); el.className = 'xd ' + (k === 'xp' ? 'main' : k.startsWith('s:') ? 'slay' : k.startsWith('w:') ? 'wpn' : 'skill');
      el.innerHTML = `<b>+${fmtK(v)}</b> ${k === 'xp' ? 'XP' : masteryName(k)}`;
      box.appendChild(el); setTimeout(() => el.remove(), 1600);
    }
    while (box.children.length > 6) box.removeChild(box.firstChild);
    this.acc.clear();
  },
};
// a monster charging a move: motes drawn into it in its area's colour, a pulse ring on the ground, smoke for the vanishing moves
function windupFx(e) {
  const col = BIOME_TINT.includes(e.color) ? e.color : (e.color != null ? e.color : 0xffffff), pal = e.pal || 'dust', R = Math.max(1.6, e.r * 2.6), life = Math.max(0.4, e.life), n = Math.min(14, 5 + Math.round(e.r * 4));
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, d = R * (0.8 + Math.random() * 0.7); mote(e.x + Math.sin(a) * d, 0.3 + Math.random() * 1.6, e.z + Math.cos(a) * d, -Math.sin(a) * d / life, 0.4 + Math.random() * 0.6, -Math.cos(a) * d / life, life * 0.9, 0.22, -0.3, col); }
  SpriteFX.play('ring', pal, e.x, 0, e.z, R * 2.2, { speed: 0.46 / Math.max(0.35, life) });
  if (e.k === 'ambush' || e.k === 'burrow') SpriteFX.play('poof', pal, e.x, 0.5, e.z, Math.max(2, e.r * 2.6));
}
// a monster move landing, in the look of its area: shock rings, shards, falling shells, beams along the lane, scythe arcs
function aoeImpactFx(e) {
  const pal = e.pal || 'dust', col = e.col != null ? e.col : BIOME_TINT[BIOME_FX.indexOf(pal)] || 0xc9a16b;
  switch (e.kind) {
    case 'ripple': SpriteFX.play('ring', pal, e.x, 0, e.z, e.r * 2.1, { speed: 1.4 }); burst(e.x, 0.3, e.z, 8, col, 5, 0.45, 0.22, 8, 0.2); break;
    case 'spike': SpriteFX.play('impact', pal, e.x, 0.6, e.z, 1.7); burst(e.x, 0.3, e.z, 5, col, 4, 0.35, 0.2, 10, 0.8); break;
    case 'meteor': SpriteFX.play('explosion', pal, e.x, 0, e.z, Math.max(2.6, e.r * 1.9), { speed: 1.3 }); burst(e.x, 0.4, e.z, 9, col, 6, 0.5, 0.22, 8, 0.6); if (near(e, 12)) Cam.shake = Math.max(Cam.shake, 0.22); break;
    case 'beam': for (let i = 0; i < 16; i++) { const d = Math.random() * e.r, a = e.ca + (Math.random() - 0.5) * 0.1; burst(e.x + Math.sin(a) * d, 0.4 + Math.random() * 1.2, e.z + Math.cos(a) * d, 1, col, 1.5, 0.45, 0.28, 0, 0.1); } SpriteFX.play('pillar', pal, e.x + Math.sin(e.ca) * e.r * 0.5, 0, e.z + Math.cos(e.ca) * e.r * 0.5, 4.5); if (near(e, 16)) Cam.shake = Math.max(Cam.shake, 0.35); break;
    case 'sweep': { const a = e.ca; for (let i = 0; i < 8; i++) { const d = e.r * (0.25 + Math.random() * 0.75), aa = a + (Math.random() - 0.5) * 0.6; burst(e.x + Math.sin(aa) * d, 0.7, e.z + Math.cos(aa) * d, 1, col, 3, 0.3, 0.22, 4, 0.3); } SpriteFX.play('slash', 'white', e.x + Math.sin(a) * e.r * 0.55, 1.1, e.z + Math.cos(a) * e.r * 0.55, 3.2, { rot: -a }); break; }
    case 'flurry': SpriteFX.play('slash', 'white', e.x, 1.1, e.z, 2.6, { rot: Math.random() * 6.28 }); burst(e.x, 0.8, e.z, 6, col, 5, 0.3, 0.2, 6, 0.4); break;
    case 'fan': break;
    default: SpriteFX.play('impact', pal, e.x, 0.8, e.z, Math.max(1.6, e.r * 0.9)); burst(e.x, 0.4, e.z, 7, col, 5, 0.4, 0.22, 7, 0.5); if (e.r >= 3.5 && near(e, 14)) Cam.shake = Math.max(Cam.shake, 0.3);
  }
}
function near(e, r) { const f = G.mode === 'arena' && G.arena ? G.arena.fighters[0] : G.player; return Math.hypot(e.x - f.x, e.z - f.z) < (r || 20); }
function dmgNumberPlayer(text, cls) { const f = G.player; dmgNumber(f.x, 2.8, f.z, text, cls); }

// --- render-side updates for hub props ---
let sparkleT = 0;
function updateHubProps(t) {
  const p = G.profile;
  if (hubParts.flies) { hubParts.flies.uniforms.t.value = t; hubParts.flies.uniforms.px.value = Pixel.active ? 2 : 3 * Math.min(2, Q.dpr); }
  // XP orbs: rebuild matrices only when one is eaten or respawns, plus a gentle shared bob via group offset
  const pim = hubParts.pelletIM;
  if (G.pelletsDirty) {
    G.pelletsDirty = false; let n = 0;
    for (const pe of G.pellets) {
      if (!pe.active) continue;
      _m4.makeTranslation(pe.x, 0.4, pe.z); pim.setMatrixAt(n, _m4); pim.setColorAt(n, _col.set(pe.color)); n++;
    }
    pim.count = n; pim.instanceMatrix.needsUpdate = true; if (pim.instanceColor) pim.instanceColor.needsUpdate = true;
  }
  pim.position.y = Math.sin(t * 2.4) * 0.08;
  // ore veins: crystals vanish while a vein regrows; rich veins are big and gold, crystal veins purple
  if (G.nodesDirty && hubParts.oreItems) {
    G.nodesDirty = false; const ORE = [0xe0a070, 0xc8d0dc, 0xb59aff, 0x9ff0ff, 0x7fffe0, 0xfff0a0];
    nodeStates().forEach((st, i) => { const it = hubParts.oreItems[i]; if (!it) return; const rare = isRareVein(st.q);
      it.s = it.base * (st.t > 0 ? 0.62 : st.rich ? 1.35 : 1); it.y = st.t > 0 ? -0.35 : 0;
      it.color = st.t > 0 ? 0x5a5a62 : st.rich ? 0xffe27a : rare ? 0xffffff : ORE[CFG.world.zones[st.q.zone].biome] || 0xffffff; });
    for (const h of hubParts.oreSets) if (h) h.dirty = true;
  }
  WorldModels.update();
  // shrines
  const cim = hubParts.shrineIM, rim = hubParts.shrineRingIM;
  G.shrines.forEach((sh, i) => {
    const locked = p.level < CFG.world.zones[sh.zone].minLevel;
    const col = sh.state === 'active' ? 0xff5d6c : sh.state === 'cooldown' || locked ? 0x7d7a96 : 0xffc94a;
    _e.set(0, t * 1.2 + i, 0); _q.setFromEuler(_e);
    const sc = sh.state === 'active' ? 1.25 + Math.sin(t * 8) * 0.12 : 1;
    _m4.compose(_v3.set(sh.x, 2.3 + Math.sin(t * 2 + i) * 0.25, sh.z), _q, _s3.set(sc, sc * 1.4, sc));
    cim.setMatrixAt(i, _m4); cim.setColorAt(i, _col.set(col)); rim.setColorAt(i, _col.set(col));
  });
  cim.instanceMatrix.needsUpdate = true; if (cim.instanceColor) cim.instanceColor.needsUpdate = true; if (rim.instanceColor) rim.instanceColor.needsUpdate = true;
  // legendary sparkle on the hero
  sparkleT -= 1 / 60;
  const topR = CFG.gear.slots.reduce((m, s) => Math.max(m, p.gear[s] ? rarIdx(p.gear[s].rarity) : 0), 0);
  if (HERO_OVERLAYS && sparkleT <= 0 && G.player.alive && topR >= 4) { sparkleT = topR >= 6 ? 0.08 : topR >= 5 ? 0.12 : 0.18; burst(G.player.x + (Math.random() - 0.5), 1 + Math.random() * 1.2, G.player.z + (Math.random() - 0.5), 1, RAR_HEX[RARITIES[topR]], 0.8, 0.7, 0.16, -1, 1); }
  for (const b of hubParts.barriers) { const locked = p.level < CFG.world.zones[b.zone].minLevel; b.mesh.visible = locked; b.mesh.material.opacity = 0.16 + Math.sin(t * 2) * 0.06; }
  if (hubParts.siegeDisc) { hubParts.siegeDisc.rotation.y = t * 0.9; hubParts.siegeRing.material.opacity = 0.55 + Math.sin(t * 3) * 0.2; }
  if (hubParts.riftDisc) { hubParts.riftDisc.rotation.z = -t * 1.1; hubParts.riftRing.rotation.z = t * 0.5; hubParts.riftRing.scale.setScalar(1 + Math.sin(t * 3) * 0.04); }
  // ascended (level 200): a golden trail while you move
  if (HERO_OVERLAYS && ascTier(p.level) >= 3 && G.player.alive && (G.player.moveAmt || 0) > 0.3 && Math.random() < 0.5 * fxK) burst(G.player.x, 0.5 + Math.random(), G.player.z, 1, Math.random() < 0.5 ? 0xffd36b : 0xfff3c4, 0.6, 0.9, 0.2, -0.5, 1);
  hubParts.portalDisc.rotation.z = t * 0.6; hubParts.portalDisc.material.opacity = 0.6 + Math.sin(t * 3) * 0.15; hubParts.portalRing.rotation.z = -t * 0.4;
  const bim = hubParts.berryIM;
  G.berries.forEach((b, i) => {
    const s = b.active ? 1 : 0;
    _e.set(0, t + b.seed, 0); _q.setFromEuler(_e);
    _m4.compose(_v3.set(b.x, 0.5 + Math.sin(t * 2.5 + b.seed) * 0.12, b.z), _q, _s3.set(s, s, s));
    bim.setMatrixAt(i, _m4);
  });
  bim.instanceMatrix.needsUpdate = true;
  // resource glow: one soft sprite per ready vein and active berry, facing the camera and breathing slowly
  { const gim = hubParts.resGlowIM; if (gim) { let n = 0; const pl = G.player, k = 1 + Math.sin(t * 2.2) * 0.12;
    const put = (x, y, z, sz) => { _m4.compose(_v3.set(x, y, z), camera.quaternion, _s3.set(sz * k, sz * k, 1)); gim.setMatrixAt(n++, _m4); };
    for (const st of nodeStates()) if (!st.t && Math.abs(st.q.z - pl.z) < 90) put(st.q.x, 1.1, st.q.z, st.rich ? 5.2 : 4.2);
    for (const b of G.berries) if (b.active && Math.abs(b.z - pl.z) < 90) put(b.x, 0.55, b.z, 2.4);
    gim.count = n; gim.instanceMatrix.needsUpdate = true; } }
  const wim = hubParts.wpIM;
  CFG.world.waypoints.forEach((w, i) => {
    const have = p.waypoints.includes(i);
    _e.set(0, t * 1.5 + i, 0); _q.setFromEuler(_e);
    _m4.compose(_v3.set(w.x, 4.6 + Math.sin(t * 2 + i) * 0.2, w.z), _q, _s3.set(0.6, 0.9, 0.6)); // attunement gem over the lodestone
    wim.setMatrixAt(i, _m4); wim.setColorAt(i, _col.set(have ? 0x9fe8ff : 0x7d7a96));
  });
  wim.instanceMatrix.needsUpdate = true; if (wim.instanceColor) wim.instanceColor.needsUpdate = true;
  if (hubParts.lavaIM) hubParts.lavaIM.material.color.setRGB(1, 0.38 + Math.sin(t * 1.7) * 0.06, 0.1);
}
function updateArenaProps(t) {
  WorldModels.update();
  const ar = G.arena; if (!ar) return;
  arenaParts.gas.scale.set(ar.gasR, 1, ar.gasR);
  arenaParts.gas.material.opacity = 0.22 + Math.sin(t * 2) * 0.06;
  arenaParts.gasFloor.scale.set(ar.gasR, 1, ar.gasR);
  arenaParts.gasFloor.material.opacity = ar.t > CFG.arena.gasDelay - 5 ? 0.3 : 0.1;
  const im = arenaParts.cubeIM; let n = 0;
  for (const c of ar.cubes) {
    if (!c.active || n >= 16) continue;
    _e.set(t, t * 1.3 + c.bob, 0); _q.setFromEuler(_e);
    _m4.compose(_v3.set(c.x, 0.7 + Math.sin(t * 3 + c.bob) * 0.15, c.z), _q, _s3.set(1, 1, 1));
    im.setMatrixAt(n++, _m4);
  }
  im.count = n; im.instanceMatrix.needsUpdate = true;
}
// --- minimap: a window that follows you over the big world (tap to enlarge) ---
const MM = { base: null, t: 0, big: false };
// Map units are metres; the static base canvas is stored at MS px/m (≈190×1600 for the 3.5 km road) and stretched on draw.
const MS = CFG.world.mmScale || 1, MW = CFG.world.maxX - CFG.world.minX, MH = CFG.world.maxZ - CFG.world.minZ;
const mmX = (x) => (CFG.world.maxX - x); // screen-right is world -x in our top view
const mmY = (z) => (CFG.world.maxZ - z);
function mmBuildBase() {
  const c = document.createElement('canvas'); c.width = Math.ceil(MW * MS); c.height = Math.ceil(MH * MS);
  const g = c.getContext('2d'), W = CFG.world; g.scale(MS, MS);
  W.zones.forEach((zn, i) => { const y0 = mmY(Math.min(zn.z1, W.maxZ)), y1 = mmY(Math.max(zn.z0, W.minZ)); g.fillStyle = zn.mm; g.fillRect(0, y0, MW, y1 - y0); });
  g.strokeStyle = 'rgba(210,176,123,.9)'; g.lineWidth = 4; g.beginPath(); g.moveTo(mmX(0), mmY(W.town.z)); g.lineTo(mmX(0), mmY(W.maxZ - 6)); g.stroke();
  g.fillStyle = '#e8d5a6'; g.beginPath(); g.arc(mmX(W.town.x), mmY(W.town.z), W.town.r, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#8f8aa8'; g.beginPath(); g.arc(mmX(PORTAL.x), mmY(PORTAL.z), 3, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ff5d8f'; g.beginPath(); g.arc(mmX(CFG.rift.gate.x), mmY(CFG.rift.gate.z), 3, 0, Math.PI * 2); g.fill();
  for (const l of W.lairList) { g.fillStyle = 'rgba(40,35,50,.4)'; g.beginPath(); g.arc(mmX(l.x), mmY(l.z), 10, 0, Math.PI * 2); g.fill(); }
  for (const D of W.dens) { g.fillStyle = 'rgba(160,30,40,.35)'; g.beginPath(); g.arc(mmX(D.x), mmY(D.z), D.r, 0, Math.PI * 2); g.fill(); }
  for (const q of W.pois) if (!q.hidden) { g.fillStyle = q.kind === 'dungeon' ? 'rgba(20,14,10,.7)' : 'rgba(60,50,40,.35)'; g.beginPath(); g.arc(mmX(q.x), mmY(q.z), q.kind === 'dungeon' ? 6 : q.major ? 7 : 4, 0, Math.PI * 2); g.fill(); }
  MM.base = c;
}
function mmStar(g, x, y, r, fill) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fillStyle = fill; g.fill(); g.lineWidth = r * 0.16; g.strokeStyle = 'rgba(0,0,0,.55)'; g.stroke();
}
function drawMinimap() {
  const box = $('mapBox'); if (!G.started || box.hidden || Showcase.on) return;
  const cv = $('mini'), r = cv.getBoundingClientRect(); if (!r.width) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1), W2 = Math.round(r.width * dpr), H2 = Math.round(r.height * dpr);
  if (cv.width !== W2 || cv.height !== H2) { cv.width = W2; cv.height = H2; }
  const g = cv.getContext('2d'), t = performance.now() / 1000, p = G.profile;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W2, H2);
  if (G.mode === 'arena' && G.arena) {
    const A = CFG.arena, ar = G.arena, s = W2 / (A.half * 2), cx = W2 / 2, cy = H2 / 2;
    const ax = (x) => cx - (x - AC.x) * s, ay = (z) => cy - (z - AC.z) * s;
    g.fillStyle = '#e1c18a'; g.fillRect(cx - A.half * s, cy - A.half * s, A.half * 2 * s, A.half * 2 * s);
    g.save(); g.beginPath(); g.rect(0, 0, W2, H2); g.arc(cx, cy, ar.gasR * s, 0, Math.PI * 2, true); g.fillStyle = 'rgba(86,227,107,.45)'; g.fill('evenodd'); g.restore();
    g.fillStyle = '#6cff8a'; for (const c of ar.cubes) if (c.active) g.fillRect(ax(c.x) - 2 * dpr, ay(c.z) - 2 * dpr, 4 * dpr, 4 * dpr);
    const f = ar.fighters[0]; if (f.alive) { g.fillStyle = '#3fa9ff'; g.beginPath(); g.arc(ax(f.x), ay(f.z), 4 * dpr, 0, Math.PI * 2); g.fill(); }
    return;
  }
  if (G.siege) {
    // the land from above: buildings (walls grey), objectives with their health, monsters, friends and you
    // a big land shows the 120 m around you
    const S = G.siege, cs = CFG.siege.cell, H = S.half, V = Math.min(H, 60), s = W2 / (V * 2.15), fx = clamp(G.player.x, SC.x - H + V, SC.x + H - V), fz = clamp(G.player.z, SC.z - H + V, SC.z + H - V),
      cx = W2 / 2 - (SC.x - fx) * s, cy = H2 / 2 + (SC.z - fz) * s, ax = (x) => cx - (x - SC.x) * s, ay = (z) => cy - (z - SC.z) * s, dot = (x, z, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(ax(x), ay(z), r * dpr, 0, Math.PI * 2); g.fill(); };
    g.fillStyle = '#3d5a2a'; g.fillRect(cx - H * s, cy - H * s, H * 2 * s, H * 2 * s);
    g.strokeStyle = '#ffd36b'; g.lineWidth = 2 * dpr; g.strokeRect(cx - H * s, cy - H * s, H * 2 * s, H * 2 * s);
    // the sides the next wave comes from
    g.fillStyle = 'rgba(255,93,108,.55)'; for (const i of S.sides) { const d = CFG.siege.sides[i]; g.fillRect(d.x ? ax(SC.x + d.x * H) - 2 * dpr : cx - H * s, d.z ? ay(SC.z + d.z * H) - 2 * dpr : cy - H * s, d.x ? 4 * dpr : H * 2 * s, d.z ? 4 * dpr : H * 2 * s); }
    for (const u of S.units) { if (!u.alive) continue; const w = Math.max(1.5 * dpr, u.size * cs * s); g.fillStyle = CFG.siege.towers[u.b.t].wall ? '#cfc6b8' : '#' + SIEGE_PAD_COL[u.b.t].toString(16).padStart(6, '0'); g.fillRect(ax(u.x) - w / 2, ay(u.z) - w / 2, w, w); }
    for (const o of S.objs) if (o.alive) { const k = clamp(o.hp / o.maxHp, 0, 1); dot(o.x, o.z, o.def.main ? 6 : 4, k > 0.5 ? '#58e08a' : k > 0.25 ? '#ffb347' : '#ff5d6c'); }
    for (const e of S.mobs) if (e.alive) dot(e.x, e.z, e.guardian ? 4 : 2.5, e.guardian ? '#ffc94a' : '#ff5d6c');
    for (const q of mpVisible()) dot(q.x, q.z, 3.5, '#9fe8ff');
    dot(G.player.x, G.player.z, 4, '#3fa9ff');
    return;
  }
  if (G.rift) {
    const R = CFG.rift, s = W2 / (R.r * 2.3), cx = W2 / 2, cy = H2 / 2, ax = (x) => cx - (x - RC.x) * s, ay = (z) => cy - (z - RC.z) * s;
    g.fillStyle = '#231b37'; g.beginPath(); g.arc(cx, cy, R.r * s, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#ff5d8f'; g.lineWidth = 2 * dpr; g.stroke();
    for (const e of G.rift.wave) if (e.alive) { g.fillStyle = e.guardian ? '#ffc94a' : '#ff5d6c'; g.beginPath(); g.arc(ax(e.x), ay(e.z), (e.guardian ? 4 : 2.5) * dpr, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#3fa9ff'; g.beginPath(); g.arc(ax(G.player.x), ay(G.player.z), 4 * dpr, 0, Math.PI * 2); g.fill();
    return;
  }
  if (!MM.base) mmBuildBase();
  const W = CFG.world, pl = G.player;
  const winW = MM.big ? 300 : 120, winH = winW * H2 / W2, sc = W2 / winW, u = winW / 172;
  const ox = clamp(mmX(pl.x) - winW / 2, 0, MW - winW), oy = clamp(mmY(pl.z) - winH * 0.62, 0, Math.max(0, MH - winH));
  g.setTransform(sc, 0, 0, sc, -ox * sc, -oy * sc);
  g.drawImage(MM.base, 0, 0, MW, MH);
  for (let i = 1; i < W.zones.length; i++) {
    const zn = W.zones[i], y = mmY(zn.z0), locked = p.level < zn.minLevel;
    g.strokeStyle = locked ? '#ff4d5a' : '#58e08a'; g.lineWidth = 2 * u; g.setLineDash(locked ? [5 * u, 3 * u] : []);
    g.beginPath(); g.moveTo(0, y); g.lineTo(MW, y); g.stroke(); g.setLineDash([]);
  }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const q of W.pois) {
    if (q.hidden && !p.secrets[q.id]) continue; // undiscovered secrets never show
    if (Math.abs(q.z - pl.z) > winH) continue;
    g.font = `bold ${(q.major || q.kind === 'dungeon' ? 9 : 7) * u}px Rubik, sans-serif`; g.fillStyle = q.kind === 'dungeon' ? '#ffb347' : q.kind === 'secret' ? '#fff07a' : '#e8d5a6';
    { const s = (q.major || q.kind === 'dungeon' ? 3 : 1.8) * u; g.fillRect(mmX(q.x) - s, mmY(q.z) - s, 2 * s, 2 * s); } // pixel squares, no emoji glyphs
  }
  for (const D of W.dens) { g.fillStyle = '#ff5d6c'; g.font = `bold ${9 * u}px Rubik, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillRect(mmX(D.x) - 3 * u, mmY(D.z) - 3 * u, 6 * u, 6 * u); }
  for (const st of nodeStates()) if (!st.t && Math.abs(st.q.z - pl.z) < winH) { g.fillStyle = st.rich ? '#ffd34a' : isRareVein(st.q) ? '#c77dff' : '#7fe3c4'; g.fillRect(mmX(st.q.x) - 1.6 * u, mmY(st.q.z) - 1.6 * u, 3.2 * u, 3.2 * u); }
  // off-window dens and caves of this area: a pinned icon on the window edge so the flanks are never forgotten
  { const zi = zoneAt(pl.z), m = 6 * u, ex = (x) => clamp(x, ox + m, ox + winW - m), ey = (y) => clamp(y, oy + m, oy + winH - m);
    const pin = (x, z, ch, col) => { const X = mmX(x), Y = mmY(z); if (X > ox && X < ox + winW && Y > oy && Y < oy + winH) return;
      g.fillStyle = 'rgba(20,22,43,.8)'; g.beginPath(); g.arc(ex(X), ey(Y), 5.5 * u, 0, Math.PI * 2); g.fill(); g.fillStyle = col; g.fillRect(ex(X) - 2.5 * u, ey(Y) - 2.5 * u, 5 * u, 5 * u); };
    for (const D of W.dens) if (D.zone === zi) pin(D.x, D.z, '☠', '#ff5d6c');
    for (const q of W.pois) if (q.kind === 'dungeon' && q.zone === zi) pin(q.x, q.z, '⛫', '#ffb347'); }
  for (const e of mpVisible()) { g.fillStyle = e.pvp ? '#ff3344' : '#5dd6ff'; g.strokeStyle = '#0b0c1f'; g.lineWidth = 1.5 * u; g.beginPath(); g.arc(mmX(e.x), mmY(e.z), 3.4 * u, 0, Math.PI * 2); g.fill(); g.stroke(); }
  W.waypoints.forEach((w, i) => { const x = mmX(w.x), y = mmY(w.z), k = 4 * u, have = p.waypoints.includes(i); g.fillStyle = have ? '#9fe8ff' : '#6f6a8a'; g.beginPath(); g.moveTo(x, y - k); g.lineTo(x + k * 0.7, y); g.lineTo(x, y + k); g.lineTo(x - k * 0.7, y); g.closePath(); g.fill(); });
  for (const sh of G.shrines) {
    const locked = p.level < W.zones[sh.zone].minLevel;
    const col = sh.state === 'active' ? '#ff5d6c' : sh.state === 'cooldown' || locked ? '#8d8aa6' : '#ffc94a';
    mmStar(g, mmX(sh.x), mmY(sh.z), (sh.state === 'active' ? 7 + Math.sin(t * 8) : 6) * u, col);
  }
  g.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 1; i < G.hubFighters.length; i++) { const b = G.hubFighters[i]; g.fillRect(mmX(b.x) - 1.2 * u, mmY(b.z) - 1.2 * u, 2.4 * u, 2.4 * u); }
  g.fillStyle = '#ffd34a'; for (const n of shownNpcs()) g.fillRect(mmX(n.x) - 1.3 * u, mmY(n.z) - 1.3 * u, 2.6 * u, 2.6 * u);
  g.fillStyle = '#ffc94a'; for (const e of G.enemies) if (e.elite && e.alive && Math.abs(e.z - pl.z) < winH) { g.beginPath(); g.arc(mmX(e.x), mmY(e.z), 2.2 * u, 0, Math.PI * 2); g.fill(); }
  if (G.boss) {
    const x = mmX(G.boss.x), y = mmY(G.boss.z), pr = (7 + Math.sin(t * 6) * 2) * u;
    g.fillStyle = 'rgba(255,60,70,.35)'; g.beginPath(); g.arc(x, y, pr + 4 * u, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ff3b4a'; g.beginPath(); g.arc(x, y, 5.5 * u, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.font = `bold ${8 * u}px Rubik, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('B', x, y + 0.5 * u);
  } else if (G.bossWarned) {
    const L = currentLair(); g.strokeStyle = '#ff9b3d'; g.lineWidth = 2 * u; g.beginPath(); g.arc(mmX(L.x), mmY(L.z), (7 + Math.sin(t * 4) * 1.5) * u, 0, Math.PI * 2); g.stroke();
  }
  const j = p.job;
  if (j && j.progress >= j.count) { const npc = NPC_DEFS.find((n) => n.id === j.npc); g.strokeStyle = '#58e08a'; g.lineWidth = 1.5 * u; g.beginPath(); g.arc(mmX(npc.x), mmY(npc.z), 4 * u, 0, Math.PI * 2); g.stroke(); }
  const px = mmX(pl.x), py = mmY(pl.z), fx = -Math.sin(pl.facing) * u, fy = -Math.cos(pl.facing) * u;
  g.beginPath(); g.moveTo(px + fx * 7, py + fy * 7); g.lineTo(px - fx * 4 - fy * 4.5, py - fy * 4 + fx * 4.5); g.lineTo(px - fx * 4 + fy * 4.5, py - fy * 4 - fx * 4.5); g.closePath();
  g.fillStyle = '#ffc94a'; g.fill(); g.lineWidth = 1.5 * u; g.strokeStyle = '#3a2400'; g.stroke();
  if (MM.big) {
    g.font = `bold ${10 * u}px Rubik, sans-serif`; g.textAlign = 'center'; g.fillStyle = 'rgba(20,22,43,.85)';
    W.zones.forEach((zn) => { const y = mmY(Math.min(zn.z1, W.maxZ)) + 14 * u; g.fillText(zn.safe ? zn.name : `${zn.name} · ${zn.lvl[0]}–${zn.lvl[1]}`, MW / 2, y); });
  }
}
function setMap(open) { G.profile.settings.map = open; G.dirty = true; $('mapBox').hidden = !open; $('bMap').classList.toggle('on', open); MM.t = 0; }

// --- boss tracker: screen-edge pointer + top health bar while a world boss is up ---
function updateBossTracker() {
  const inHub = G.mode === 'hub' && G.started && !Showcase.on;
  const b = inHub ? G.boss : null;
  const fighting = !!b && (b.dmgBy[G.player.id] || 0) > 0 && zoneAt(G.player.z) === b.zone; // only people who attack it, in its zone, get the health bar
  setHidden('bossBar', !fighting);
  if (b) {
    setText('bossName', `${b.name} · Lv ${b.lvl}`);
    setText('bossTime', b.life > 0 ? `${Math.ceil(b.life)}s left` : 'Enraged');
    setStyle('bossHp', 'width', (clamp(b.hp / b.maxHp, 0, 1) * 100).toFixed(1) + '%');
    const w = b.ward; setHidden('bossWard', !w);
    if (w) setText('bossWard', `${w.nm}: ${w.held || 0}/${w.pl.length} held${w.prog > 0 ? ' · ' + Math.round(w.prog / w.hold * 100) + '%' : ''} · ${Math.ceil(w.t)}s`);
    $('bossBar').classList.toggle('warded', !!w); $('bossBar').classList.toggle('exposed', b.vuln > 0);
  }
  let tx = null, tz = null, warn = false;
  if (b) { tx = b.x; tz = b.z; }
  if (tx == null) { setHidden('bossPtr', true); return; }
  const pl = G.player, W = window.innerWidth, H = window.innerHeight, m = 44;
  const s = project(tx, 2, tz), d = Math.hypot(tx - pl.x, tz - pl.z);
  // keep the pointer clear of the top HUD stack and the bottom controls
  // Match the two-row town dock (with the toasts and boss bar moved below it in portrait) and its wide, short-screen variant.
  const quickDock = hubShortcutsAvailable() && (H > 590 || W >= 760);
  const yMin = quickDock ? (H > 590 ? 336 : 176) : (Cam.portrait ? 240 : 132), yMax = H - (Cam.portrait ? 310 : 60), xMin = m + 20, xMax = W - m - 20;
  if (s && s[0] > 0 && s[0] < W && s[1] > 30 && s[1] < H - 20) { setHidden('bossPtr', true); return; }
  let dx = -(tx - pl.x), dy = -(tz - pl.z); const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
  const cx = W / 2, cy = (yMin + yMax) / 2;
  const k = Math.min((xMax - cx) / Math.max(1e-4, Math.abs(dx)), (dy < 0 ? cy - yMin : yMax - cy) / Math.max(1e-4, Math.abs(dy)));
  const x = cx + dx * k, y = cy + dy * k;
  setHidden('bossPtr', false);
  $('bossPtr').style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px) translate(-50%, -50%)`;
  setStyle('bossArrow', 'transform', `rotate(${(Math.atan2(dy, dx) * 180 / Math.PI).toFixed(0)}deg)`);
  setText('bossPtrD', `${warn ? 'Soon' : 'Boss'} · ${Math.round(d)}m`);
  if (hudCache.bossWarnCls !== warn) { hudCache.bossWarnCls = warn; $('bossPtr').classList.toggle('warn', warn); }
}

// --- "better gear found" prompt: always asks before swapping ---
function updateGearPrompt() {
  const p = G.profile, box = $('gearPrompt');
  let it = null;
  while (G.gearPrompts.length) {
    const id = G.gearPrompts[0], cand = p.bag.find((b) => b.id === id);
    if (cand && isBetter(cand, p.gear[cand.slot])) { it = cand; break; }
    G.gearPrompts.shift();
  }
  const show = !!it && G.mode === 'hub' && G.started && !G.modal;
  if (!show) { if (!box.hidden) box.hidden = true; $('coach').classList.remove('away'); return; }
  $('coach').classList.add('away');
  if (box.dataset.id === it.id && !box.hidden) return;
  const cur = p.gear[it.slot];
  box.dataset.id = it.id;
  box.innerHTML = `<span class="thw ${it.rarity}"><img class="thumb ${it.rarity}" src="${thumbFor(it)}" alt=""></span><div class="gp"><div class="gt">Better ${SLOT_LABEL[it.slot].toLowerCase()} found${G.gearPrompts.length > 1 ? ` · +${G.gearPrompts.length - 1} more` : ''}</div>
    <div class="gn">${it.name} ${rarityChip(it.rarity)}</div><div class="gc">${statLine(it)}${it.aff && Object.keys(it.aff).length ? ' · ' + affixText(it) : ''}</div><div class="gc was">Now: ${cur ? `${cur.name} (${CFG.gear.rarity[cur.rarity].name}) · ${statLine(cur)}` : 'Empty slot'}</div>${cur && rarIdx(it.rarity) > rarIdx(cur.rarity) && itemPower(it) < itemPower(cur) ? '<div class="gc note">Higher rarity. Some stats are lower until you level it up at the Smith</div>' : ''}</div>
    <div class="gb"><button class="primary" data-gp="equip">${wearWord(it.slot)}</button><button class="ghost" data-gp="later">Later</button></div>`;
  box.hidden = false;
}
function onGearPrompt(e) {
  const b = e.target.closest('[data-gp]'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const id = $('gearPrompt').dataset.id;
  if (b.dataset.gp === 'equip') equipItem(id); else { G.gearPrompts = G.gearPrompts.filter((x) => x !== id); Sfx.play('click'); }
  $('gearPrompt').hidden = true; $('gearPrompt').dataset.id = ''; updateGearPrompt();
}

// --- paper doll: slot callouts pinned to the hero in the dressing room ---
const DOLL_ORDER = ['helmet', 'weapon', 'chest', 'accessory', 'boots'], DOLL_SLOT = 58;
const Doll = { built: false, chips: {}, alerts: null, alertAt: 0 };
function buildDoll() {
  const root = $('doll');
  for (const s of DOLL_ORDER) {
    const c = document.createElement('button'); c.className = 'dchip'; c.dataset.slot = s;
    c.innerHTML = '<img alt=""><span><b></b><small></small></span><em class="du"></em><i class="rdot" hidden></i>';
    c.addEventListener('click', (e) => { e.stopPropagation(); Sfx.play('click'); UI.gearSlot = s; heroTab('Gear'); });
    root.appendChild(c); Doll.chips[s] = c;
  }
  Doll.built = true;
  Doll.sat = parseFloat(getComputedStyle(root).paddingTop) || 0; // #doll's padding is the notch inset
}
function updateDoll() {
  const root = $('doll');
  // hidden while the sheet is pulled up over the hero
  const show = Showcase.on && Showcase.b > 0.85 && !UI.sheetFull && (UI.current === 'hero' || UI.current === 'smith');
  if (!show) { if (!root.hidden) root.hidden = true; return; }
  if (!Doll.built) buildDoll();
  root.hidden = false;
  const p = G.profile, pl = G.player, gs = growthScale(pl);
  const now = performance.now();
  if (!Doll.alerts || now >= Doll.alertAt) { Doll.alerts = slotAlerts(); Doll.alertAt = now + 250; }
  const al = Doll.alerts;
  const head = project(pl.x, (2.2 * gs) + Showcase.podium, pl.z), feet = project(pl.x, Showcase.podium, pl.z);
  if (!head || !feet) { root.hidden = true; return; }
  const W = window.innerWidth, H = window.innerHeight, panel = UI.sheet;
  // item sockets around the hero: portrait puts helmet, armor and boots on the left and weapon and accessory on
  // the right (a classic paper doll); landscape keeps one column left of the hero
  const sz = DOLL_SLOT, gap = 8, bottom = Cam.portrait ? panel.top - 12 : H - 16;
  const top = Cam.portrait ? 12 + Doll.sat : Math.max(12, Math.min(head[1] - 10, bottom - 5 * (sz + gap)));
  const avail = bottom - top, need = Cam.portrait ? 3 * sz + 2 * gap : 5 * sz + 4 * gap;
  if (avail < need) { root.hidden = true; return; }
  const step = Cam.portrait ? Math.min(sz + 40, (avail - sz) / 2) : sz + gap;
  const colL = Cam.portrait ? 10 : Math.max(8, Math.min(head[0] - sz - 64, panel.left - sz - 110)), colR = W - 10 - sz;
  const at = Cam.portrait ? { helmet: [colL, 0], chest: [colL, 1], boots: [colL, 2], weapon: [colR, 0.5], accessory: [colR, 1.5] } : null;
  DOLL_ORDER.forEach((s, i) => {
    const it = p.gear[s], c = Doll.chips[s], xy = at ? at[s] : [colL, i];
    c.style.transform = `translate(${Math.round(xy[0])}px,${Math.round(top + xy[1] * step)}px)`;
    const sig = it ? it.id + it.up : 'empty';
    if (c.dataset.sig !== sig) {
      c.dataset.sig = sig; c.className = 'dchip ' + (it ? it.rarity : 'empty');
      const img = c.querySelector('img'); img.hidden = !it; if (it) img.src = thumbFor(it); else img.removeAttribute('src');
      c.querySelector('b').textContent = SLOT_LABEL[s];
      c.querySelector('small').textContent = it ? CFG.gear.rarity[it.rarity].name : 'Empty';
      c.querySelector('.du').textContent = it && it.up ? '+' + it.up : '';
      c.setAttribute('aria-label', `${SLOT_LABEL[s]} · ${it ? it.name + ' · inspect and upgrade' : 'empty'}`);
    }
    c.querySelector('.rdot').hidden = !(al[s].better || al[s].canUpgrade);
    c.classList.toggle('sel', UI.current === 'hero' && UI.heroTab === 'Gear' && UI.gearSlot === s);
    c.setAttribute('aria-pressed', String(UI.current === 'hero' && UI.heroTab === 'Gear' && UI.gearSlot === s));
  });
}

// small diagram of each attack's bullet pattern
function attackGlyph(a) {
  const c = '#' + (a.color || 0xffd34a).toString(16).padStart(6, '0'), dot = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
  let g = '';
  switch (a.kind) {
    case 'tracer': for (let i = 0; i < 6; i++) g += dot(8 + i * 7, 20 + (i % 2 ? 2 : -2), 2.2); break;
    case 'pellet': for (let i = 0; i < 5; i++) { const an = (i / 4 - 0.5) * 1.1; g += dot(10 + Math.cos(an) * 30, 20 + Math.sin(an) * 30, 3); } break;
    case 'rail': g = `<rect x="4" y="18" width="42" height="4" rx="2" fill="${c}"/>${dot(48, 20, 4)}`; break;
    case 'missile': g = `<path d="M6 26 Q24 4 46 14" stroke="${c}" stroke-width="3" fill="none"/><path d="M6 14 Q24 36 46 26" stroke="${c}" stroke-width="3" fill="none"/>`; break;
    case 'shell': g = dot(26, 20, 6); for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2; g += dot(26 + Math.cos(an) * 14, 20 + Math.sin(an) * 14, 2); } break;
    case 'lob': g = `<path d="M4 34 Q26 -8 48 34" stroke="${c}" stroke-width="2.5" stroke-dasharray="4 3" fill="none"/>${dot(48, 32, 5)}`; break;
    case 'disc': g = `<path d="M4 30 L18 10 L32 30 L46 10" stroke="${c}" stroke-width="3" fill="none"/>`; break;
    case 'chakram': g = `<path d="M8 20 C 20 0, 44 0, 44 20 C 44 40, 20 40, 8 20" stroke="${c}" stroke-width="3" fill="none"/>${dot(44, 20, 4)}`; break;
    case 'wave': g = `<path d="M20 6 Q40 20 20 34" stroke="${c}" stroke-width="5" fill="none"/>`; break;
    case 'arrow': g = `<path d="M4 20 H44 M36 13 L46 20 L36 27" stroke="${c}" stroke-width="3" fill="none"/>`; break;
    case 'orb': g = dot(30, 20, 8) + `<circle cx="30" cy="20" r="14" stroke="${c}" stroke-width="1.5" fill="none" opacity=".6"/>`; break;
    default: g = dot(14, 20, 4) + dot(30, 20, 4) + dot(46, 20, 4);
  }
  return `<svg class="glyph" viewBox="0 0 52 40" aria-hidden="true">${g}</svg>`;
}



// ---- boss callouts and set-pieces: every cast is named, every phase and ward break gets its own moment ----
let bossCallTimer = 0;
function bossCallFx(e) {
  const hex = '#' + (e.col || 0xffffff).toString(16).padStart(6, '0');
  setText('bossCallNm', e.nm || ''); setText('bossCallSay', e.say || ''); const el = $('bossCall');
  el.style.setProperty('--bc', hex); el.classList.toggle('mech', !!e.mech); setHidden('bossCall', false);
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  clearTimeout(bossCallTimer); bossCallTimer = setTimeout(() => setHidden('bossCall', true), e.mech ? 3600 : 1700);
  if (near(e, 40)) { Sfx.play(e.mech ? 'horn' : 'boom', { gap: 0.2 }); Cam.shake = Math.max(Cam.shake, e.mech ? 0.5 : 0.25); }
  SpriteFX.play('ring', e.pal || 'fire', e.x, 0, e.z, e.mech ? 14 : 9);
  for (let i = 0; i < (e.mech ? 28 : 12); i++) { const a = Math.random() * 6.283; burst(e.x + Math.sin(a) * 2.5, 0.4, e.z + Math.cos(a) * 2.5, 1, e.col || 0xffffff, 3, 0.7, 0.3, -1, 2.5); }
}
function bossPhaseFx(e) {
  Sfx.play('horn'); Cam.shake = Math.max(Cam.shake, 0.9);
  showBanner(e.n === 3 ? 'ENRAGED' : 'PHASE ' + e.n, (e.name || 'The boss') + (e.n === 3 ? ' fights with everything' : ' calls on its power'), e.n === 3 ? 'red' : 'gold');
  SpriteFX.play('ring', e.pal || 'fire', e.x, 0, e.z, 22); SpriteFX.play('dust', e.pal || 'fire', e.x, 0, e.z, 12);
  for (let i = 0; i < 60; i++) { const a = Math.random() * 6.283; burst(e.x, 1 + Math.random() * 2, e.z, 1, e.col || 0xffffff, 9, 1.1, 0.5, 1, 2); }
}
function wardBreakFx(e, ok) {
  Sfx.play(ok ? 'win' : 'boom'); Cam.shake = Math.max(Cam.shake, ok ? 0.8 : 1);
  showBanner(ok ? 'WARDS BROKEN' : 'WARDS HELD', ok ? 'The boss is exposed: hit it hard!' : 'The boss lashes out', ok ? 'gold' : 'red');
  SpriteFX.play('ring', e.pal || 'gold', e.x, 0, e.z, ok ? 20 : 16);
  for (let i = 0; i < 50; i++) burst(e.x, 1.5, e.z, 1, ok ? 0xfff2b0 : (e.col || 0xff4d4d), 10, 1, 0.4, 1.5, 2);
}
