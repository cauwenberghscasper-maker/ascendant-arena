// ---------------------------------------------------------------------
// 9b. MENUS (v8) — Menu tiles, Brawlers, Skill trees, Artifacts, Progress
// Icons: game-icons.net (CC BY 3.0), inlined as SVG paths in GI (icons_gen.js)
// ---------------------------------------------------------------------
const METAL = ['bronze', 'silver', 'gold', 'diamond', 'mythic', 'legend'];
// icons get a dark sticker outline so they read as game art, not UI glyphs
// ability buttons show the game's own icons with a small caption underneath
const BTN_ICON = { nova: 'n_burst', slam: 'k_aftershock', volley: 'b_arrow', meteor: 'k_comet', ironskin: 'n_armor', swift: 'n_speed', frostnova: 'a_frost', fire: 'a_ember', ice: 'a_frost', storm: 'k_storm', poison: 'a_rubber' };
function setBtnIcon(id, key) { const el = $(id) && $(id).querySelector('.cic'); if (el && key && el.dataset.k !== key) { el.dataset.k = key; el.innerHTML = gi(key); } }
function gi(key, cls) {
  if (!GI[key]) return '';
  const fam = key === 'm_lock' ? 'steel' : null;
  return `<i class="gi pxi ${cls || ''}" aria-hidden="true" style="--pf:url(${PixelIcons.url(key, fam)});--pb:url(${PixelIcons.url(key, fam, true)})"></i>`;
}
// --- pixel-art icons ------------------------------------------------------------------
// Every icon is drawn as a 32x32 pixel tile: dark rim, bevelled edge, a shaded background in its
// element's colour (fire, frost, venom, arcane, blood, steel, gold…) and the symbol on top, lit from
// the top-left with a highlight edge, a shadow edge, an ink outline and a drop shadow.
// Built once per icon on a tiny canvas and shown scaled up with hard pixel edges.
const PX_FAM = {
  fire: { bg: [0x220b07, 0x4a160b, 0x7a2a10, 0xa84616], ink: [0x8a2a08, 0xff8a1f, 0xffd36b, 0xfff3c4], glow: 0xff9b3d },
  ice: { bg: [0x08162a, 0x10304f, 0x1c5276, 0x2c7aa0], ink: [0x2f6fae, 0x8fd6ff, 0xd8f4ff, 0xffffff], glow: 0x7fe3ff },
  venom: { bg: [0x0b1a0a, 0x16340f, 0x255216, 0x3a741c], ink: [0x3f7a12, 0x9be33a, 0xd6ff8a, 0xf4ffd0], glow: 0xa7ff4a },
  arcane: { bg: [0x150a2a, 0x2a1450, 0x45227a, 0x6638a8], ink: [0x6a2fc0, 0xc58cff, 0xeed6ff, 0xffffff], glow: 0xc77dff },
  blood: { bg: [0x1c0608, 0x3c0c12, 0x63141c, 0x8c1f26], ink: [0x7a0f18, 0xff4d5a, 0xffa3a3, 0xffe2dc], glow: 0xff4d6d },
  steel: { bg: [0x111522, 0x222a3a, 0x343f55, 0x4c5a72], ink: [0x5a6478, 0xb9c3d4, 0xe6ecf5, 0xffffff], glow: 0xdfe6f0 },
  gold: { bg: [0x1e1406, 0x3e2a0a, 0x664410, 0x8c5e14], ink: [0x9a5a08, 0xffc94a, 0xffe9a0, 0xfffbe6], glow: 0xffd34a },
  electric: { bg: [0x07182a, 0x0c2f4a, 0x124a6c, 0x1a6890], ink: [0x1f7fb0, 0x6fe8ff, 0xd8fbff, 0xffffff], glow: 0x6fe8ff },
  tech: { bg: [0x0a1a1c, 0x13343a, 0x1d4e56, 0x2a6a72], ink: [0x2a7a80, 0x6fe0d0, 0xc8fff6, 0xffffff], glow: 0x5fe3c9 },
  mythic: { bg: [0x1c0618, 0x3a0c32, 0x5c164e, 0x80226a], ink: [0x8a1a6a, 0xff6ad5, 0xffc2ee, 0xffffff], glow: 0xff7ab8 },
  nature: { bg: [0x0c1a0c, 0x18341a, 0x274f27, 0x386a34], ink: [0x3f7a35, 0x8fd66a, 0xd2f5b0, 0xf6ffe8], glow: 0x9cff7a },
  parch: { bg: [0x120e0b, 0x221a14, 0x302519, 0x3e3020], ink: [0x8a7a5a, 0xd9c8a0, 0xf1e6c8, 0xfff8e6], glow: 0xf1e6c8 },
};
const PX_KEY_FAM = {
  b_bolt: 'arcane', b_smg: 'gold', b_scatter: 'fire', b_rail: 'ice', b_wave: 'steel', b_seeker: 'mythic', b_arrow: 'nature', b_cluster: 'fire', b_mortar: 'venom', b_disc: 'ice', b_orb: 'arcane', b_flamer: 'fire', b_chakram: 'gold', b_chain: 'electric', b_gatling: 'steel', b_starfall: 'arcane',
  n_hp: 'blood', n_armor: 'steel', n_speed: 'nature', n_crit: 'gold', n_critDmg: 'blood', n_atkSpeed: 'gold', n_cdr: 'ice', n_lifesteal: 'blood', n_gold: 'gold', n_gems: 'arcane', n_dmg: 'fire', n_regen: 'nature', n_super: 'fire', n_xp: 'ice', n_range: 'nature', n_ammo: 'steel', n_aoe: 'fire', n_pierce: 'steel', n_burst: 'electric', n_core: 'arcane', n_start: 'gold', n_superPow: 'fire',
  k_tempo: 'electric', k_conqueror: 'blood', k_grasp: 'venom', k_phase: 'arcane', k_secondWind: 'nature', k_execute: 'blood', k_electrocute: 'electric', k_comet: 'arcane', k_aftershock: 'steel', k_bloodthirst: 'blood', k_titan: 'steel', k_glass: 'ice', k_kraken: 'ice', k_sunfire: 'fire', k_storm: 'electric', k_infinity: 'arcane', k_undying: 'venom', k_ascend: 'gold',
  m_gem: 'arcane', m_coin: 'gold', m_shard: 'arcane', m_rift: 'mythic', m_portal: 'arcane', m_asc: 'gold', m_arena: 'blood', m_lock: 'steel',
  m_hero: 'gold', m_brawlers: 'fire', m_skills: 'arcane', m_artifacts: 'mythic', m_progress: 'nature', m_records: 'gold', m_feats: 'gold', m_case: 'gold', m_caseOpen: 'gold', m_vault: 'steel', m_exped: 'nature', m_auto: 'electric', m_idle: 'gold', m_menu: 'steel', m_players: 'ice', m_smith: 'fire', m_floor: 'arcane', m_tier: 'blood',
};
const PX_ART_FAM = { tech: 'tech', mythic: 'mythic', ice: 'ice', gold: 'gold', steel: 'steel', fire: 'fire', blood: 'blood', venom: 'venom', electric: 'electric' };
function pxFamOf(key) {
  if (PX_KEY_FAM[key]) return PX_KEY_FAM[key];
  if (key.startsWith('a_')) return PX_ART_FAM[ART_FAM[key.slice(2)]] || 'tech';
  if (key.startsWith('u_')) return 'gold';
  return 'parch';
}
const PixelIcons = {
  N: 32, cache: new Map(), cv: null,
  rgb(c) { return [(c >> 16) & 255, (c >> 8) & 255, c & 255]; },
  url(key, famOverride, bare) {
    const fam = famOverride || pxFamOf(key), ck = key + '|' + fam + (bare ? '|b' : '');
    if (this.cache.has(ck)) return this.cache.get(ck);
    let out = '';
    try { out = this.draw(GI[key], PX_FAM[fam] || PX_FAM.parch, bare); } catch (e) { out = ''; }
    this.cache.set(ck, out); return out;
  },
  draw(d, F, bare) {
    const N = this.N, S = 24, off = 4;
    if (!this.cv) { this.cv = document.createElement('canvas'); this.cv.width = this.cv.height = N; }
    const x = this.cv.getContext('2d', { willReadFrequently: true });
    x.clearRect(0, 0, N, N);
    // symbol mask: the 512x512 path rasterised into a 22x22 area, alpha thresholded to hard pixels
    if (d) { x.save(); x.translate(off, off - 0.5); x.scale(S / 512, S / 512); x.fillStyle = '#fff'; x.fill(new Path2D(d)); x.restore(); }
    const a = x.getImageData(0, 0, N, N).data, M = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) M[i] = a[i * 4 + 3] > 64 ? 1 : 0; // a low threshold keeps thin strokes
    const m = (i, j) => (i < 0 || j < 0 || i >= N || j >= N) ? 0 : M[j * N + i];
    const img = x.createImageData(N, N), o = img.data, bg = F.bg.map((c) => this.rgb(c)), ink = F.ink.map((c) => this.rgb(c)), dark = [11, 10, 22], gl = this.rgb(F.glow);
    const hash = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      let c;
      const rim = i === 0 || j === 0 || i === N - 1 || j === N - 1;
      const corner = (i <= 1 || i >= N - 2) && (j <= 1 || j >= N - 2);
      if (corner && (i === 0 || i === N - 1) && (j === 0 || j === N - 1)) { o[(j * N + i) * 4 + 3] = 0; continue; }
      if (bare) {
        // symbol only, on transparency: same shading, ink outline and drop shadow
        const k = (j * N + i) * 4; let cc = null;
        if (m(i, j)) { const lit = !m(i - 1, j) || !m(i, j - 1), shade = !m(i + 1, j) || !m(i, j + 1); cc = lit && !shade ? ink[2] : shade ? ink[0] : ink[1]; }
        else if (m(i + 1, j) || m(i - 1, j) || m(i, j + 1) || m(i, j - 1)) cc = dark;
        else if (m(i - 1, j - 1) || m(i - 2, j - 1) || m(i - 1, j - 2)) { o[k] = 0; o[k + 1] = 0; o[k + 2] = 0; o[k + 3] = 110; continue; }
        if (cc) { o[k] = cc[0]; o[k + 1] = cc[1]; o[k + 2] = cc[2]; o[k + 3] = 255; } else o[k + 3] = 0;
        continue;
      }
      if (rim) c = dark;
      else if (i === 1 || j === 1) c = bg[3];
      else if (i === N - 2 || j === N - 2) c = bg[0];
      else {
        // background: light from the top-left, a soft vignette, a little painted texture, banded with an ordered dither
        const dx = (i - 11) / N, dy = (j - 10) / N;
        let v = 0.78 - Math.sqrt(dx * dx + dy * dy) * 1.25 + (hash(i >> 1, j >> 1) - 0.5) * 0.12;
        v = Math.max(0, Math.min(0.999, v)) * 3 + (bayer[(j & 3) * 4 + (i & 3)] / 16 - 0.5) * 0.7;
        c = bg[Math.max(0, Math.min(3, Math.floor(v)))];
        // a soft glow of the element colour behind the symbol
        let near = 0; for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) near += m(i + q, j + r);
        if (near && !m(i, j)) c = c.map((ch, k) => Math.round(ch + (gl[k] - ch) * Math.min(0.28, near * 0.02)));
      }
      if (!rim && !m(i, j) && m(i - 1, j - 1) && !(m(i + 1, j) || m(i - 1, j) || m(i, j + 1) || m(i, j - 1))) c = c.map((ch) => Math.round(ch * 0.55)); // drop shadow
      if (m(i, j)) {
        // symbol: highlight on edges facing the light, shadow on the far edges, mid tone inside
        const lit = !m(i - 1, j) || !m(i, j - 1), shade = !m(i + 1, j) || !m(i, j + 1);
        const deep = !m(i + 1, j + 1) && !lit;
        c = lit && !shade ? ink[2] : shade ? (deep ? ink[0] : ink[0]) : ink[1];
        if (lit && !m(i - 1, j - 1) && hash(i, j) > 0.55) c = ink[3];
      } else if (!rim && (m(i + 1, j) || m(i - 1, j) || m(i, j + 1) || m(i, j - 1))) c = dark; // ink outline
      const k = (j * N + i) * 4; o[k] = c[0]; o[k + 1] = c[1]; o[k + 2] = c[2]; o[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return this.cv.toDataURL('image/png');
  },
};
// each artifact has its own material family (fire, ice, blood, tech…)
const ART_FAM = { mag: 'tech', splitter: 'mythic', frost: 'ice', seekerChip: 'tech', trigger: 'gold', pierce: 'steel', ember: 'fire', blast: 'fire', vamp: 'blood', rubber: 'venom', bigshot: 'gold', lens: 'ice', coil: 'electric', giant: 'blood', twin: 'steel', reaper: 'mythic' };
const hex = (c) => '#' + (c >>> 0).toString(16).padStart(6, '0');
// layered badge: metal shield, inner plate, laurel from Gold up, icon in the middle
function badgeSVG(tier, iconKey, opts) {
  opts = opts || {};
  const m = tier >= 0 ? METAL[tier] : 'none', d = GI[iconKey] || '';
  const laurel = tier >= 2 ? `<path d="M14 60 C8 44 10 26 22 14 M86 60 C92 44 90 26 78 14" stroke="url(#m-${m})" stroke-width="5" fill="none" stroke-linecap="round"/>` : '';
  const stars = tier >= 4 ? `<circle cx="50" cy="8" r="4" fill="url(#m-${m})"/>` : '';
  return `<svg class="badge ${m} ${opts.cls || ''}" viewBox="0 0 100 100" aria-hidden="true">${laurel}${stars}
    <path d="M50 6 L84 18 L80 58 C76 76 64 88 50 94 C36 88 24 76 20 58 L16 18 Z" fill="${tier >= 0 ? `url(#m-${m})` : '#2a2e5e'}" stroke="rgba(0,0,0,.45)" stroke-width="2"/>
    <path d="M50 16 L74 25 L71 56 C68 70 60 79 50 84 C40 79 32 70 29 56 L26 25 Z" fill="${tier >= 0 ? 'rgba(20,22,49,.55)' : '#1e2147'}"/>
    <g transform="translate(31 29) scale(0.074)"><path d="${d}" fill="${tier >= 0 ? `url(#m-${m})` : '#6f75a8'}"/></g>
    ${tier >= 0 && !opts.static ? '<rect class="shine" x="-60" y="0" width="30" height="100" fill="rgba(255,255,255,.35)" transform="skewX(-20)"/>' : ''}</svg>`;
}
function masteryOf(p, id) { return masteryLevel((p.mastery || {})['w:' + id] || 0); }
function tierOf(L) { let t = -1; CFG.badges.forEach((b, i) => { if (L >= b.lvl) t = i; }); return t; }
// brawler portrait: body-colored disc, weapon icon, rim in the earned badge metal
function brawlerPortrait(id, owned, size) {
  const B = CFG.brawlers[id], p = G.profile, t = owned ? tierOf(masteryOf(p, id)) : -1;
  const img = brawlerThumb(id);
  return `<span class="bport ${owned ? '' : 'locked'} ${t >= 0 ? METAL[t] : ''}" style="--bc:${hex(B.body)};--ba:${hex(B.accent)};${size ? `--sz:${size}px` : ''}">${img ? `<img src="${img}" alt="">` : gi('b_' + id)}<span class="wchip">${gi('b_' + id)}</span>${owned ? '' : gi('m_lock', 'lk')}</span>`;
}

// --- Menu tiles ---------------------------------------------------------------------------------
function menuAlerts() {
  const p = G.profile, al = Object.values(slotAlerts()).some((a) => a.better || a.canUpgrade);
  const freeB = ownedBrawlers(p).some((id) => treeFree(p, id) > 0);
  return {
    hero: al, brawlers: p.newUnlocks.some((u) => u.startsWith('a:')), skills: freeB,
    artifacts: p.newUnlocks.some((u) => u.startsWith('r:')), progress: false,
  };
}
function hubShortcutsAvailable() {
  return G.started && !G.modal && G.mode === 'hub' && !G.rift && G.player.alive && inTown();
}
function openQuickUpgrade(action) {
  if (!hubShortcutsAvailable()) return;
  Sfx.play('click');
  if (action === 'gear') heroTab('Gear');
  else if (action === 'skills') openSkills(G.profile.cls);
  else if (action === 'artifacts') openArtifacts('Equip');
  else if (action === 'cases') openCases();
}
function openMenu(section) {
  UI.current = 'menu';
  if (section === 'upgrades' || section === 'adventure') UI.menuSection = section;
  const p = G.profile, A = menuAlerts(), own = ownedBrawlers(p).length;
  const hp = 0, bp = Math.max(0, treeFree(p, p.cls));
  const tile = (act, icon, title, sub, dot) => `<button class="mtile" data-act="${act}">${gi(icon)}<span class="menuTileText"><b>${title}</b><small>${sub}</small></span>${dot ? '<i class="rdot"></i>' : ''}</button>`;
  const upgrades = [
    tile('mGear', 'm_hero', 'Equipment', `Gear score ${fmt(Math.round(gearTotals(p.gear).score))}`, A.hero),
    tile('mSkills', 'm_skills', 'Talents', hp + bp > 0 ? `${fmt(hp + bp)} talent points` : 'All points spent', A.skills),
    tile('mArtifacts', 'm_artifacts', 'Relics', `${p.artifacts.length}/${artifactSlotsFor(p)} socketed`, A.artifacts),
    tile('mCases', 'm_case', 'Treasure Chests', p.cases.length ? `${p.cases.length} to open` : 'Won from monsters', p.cases.length > 0),
    tile('mBrawlers', 'm_brawlers', 'Heroes', `${own}/${CFG.brawlerOrder.length} recruited`, A.brawlers),
    tile('mSmith', 'm_smith', 'Smithy', 'Reforge & forge', UI.anyAlert),
  ];
  const adventure = [
    tile('mProgress', 'm_progress', 'Adventure Log', 'Level Road & hiscores', A.progress),
    tile('mCollection', 'm_hero', 'Collection Log', `${Object.keys(p.collection || {}).length}/${COLLECTION_ITEMS.length} logged`, false),
    tile('mPrestige', 'm_asc', 'Pets & prestige', `Prestige ${prestigeCount(p)}`, !prestigeBlocked()),
    tile('mIdle', 'm_idle', 'Bank & Camp', 'Coffers & expeditions', idleAlert()),
    tile('mPlayers', 'm_players', 'Fellow Adventurers', mpSummary()),
    tile('mArena', 'm_arena', 'Showdown', 'Duel 9 rival champions', false),
  ];
  openModal(`<div class="menuHead"><div><h3>Adventurer’s Journal</h3><small>${CFG.brawlers[p.cls].name} · Combat level ${fmt(p.level)}</small></div></div>
    <div class="menuSections" role="group" aria-label="Menu sections">
      <button data-act="menuSection" data-section="upgrades" aria-pressed="${UI.menuSection === 'upgrades'}">Hero${Object.values(A).some(Boolean) || p.cases.length ? '<i class="rdot"></i>' : ''}</button>
      <button data-act="menuSection" data-section="adventure" aria-pressed="${UI.menuSection === 'adventure'}">World</button>
    </div><div class="mtiles">${(UI.menuSection === 'adventure' ? adventure : upgrades).join('')}</div>`);
  $('panel').classList.add('menuPanel');
}

// --- Prestige: reviewed reset, permanent companion and bounded world bonuses ---------------------------
function prestigeBlocked() {
  return prestigeBlock(G.profile,{mode:G.mode,rift:!!G.rift,shrine:!!activeShrine(),alive:G.player.alive,inCombat:G.time-G.lastCombat<8,inTown:inTown()});
}
const petPercent = n => (n*100).toFixed(2).replace(/\.00$/,'')+'%';
function prestigeBadge(p) { return `<span class="prestigeBadge">Prestige ${prestigeCount(p)}</span>`; }
function openPrestige() {
  UI.current='prestige';
  const p=G.profile, pet=petProgress(p), bonus=petBonuses(p), attack=petAttackSpec(p), blocked=prestigeBlocked();
  const cards=Object.entries(PET_DEFS).map(([id,d])=>{const owned=!!p.pets[id], selected=id===pet.id;
    return `<button class="ghost ${selected?'equipped':''}" data-act="petEquip" data-pet="${id}" ${owned?'':'disabled'} aria-pressed="${selected}"><b>${d.name}</b><small>${owned?`Level ${p.pets[id].level} / ${PET_MAX_LEVEL}`:`Unlocks at prestige ${d.unlock}`}<br>${d.attack} · ${d.kind==='slam'?'close range, up to 3 enemies':d.slow?'ranged + slow':'ranged'}<br>${selected?'Equipped':owned?'Tap to equip':'Locked'}</small></button>`;}).join('');
  openModal(`<h3>Pets & prestige</h3><div class="pBody"><div class="prestigeHero"><div><b>Prestige ${prestigeCount(p)}</b><small>${pet.id ? `${pet.name} · Level ${pet.level} / ${PET_MAX_LEVEL} · Evolution ${pet.stage} / 5` : 'Your first dragon awaits'}<br>${pet.id ? `World damage +${petPercent(bonus.damage)} · HP +${petPercent(bonus.hp)}` : `Reach hero level ${PRESTIGE_LEVEL} to earn your first companion`}</small></div></div>
    ${pet.id?`<div class="petXP"><b>${pet.nextXp?`${fmt(pet.xp)} / ${fmt(pet.nextXp)} pet XP`:'Max pet level'}</b><div class="vbar sm"><i style="width:${pet.nextXp?Math.round(pet.xp/pet.nextXp*100):100}%"></i></div></div><div class="mergeNotice"><b>${attack.attack}</b> · ${petPercent(attack.mult)} of hero damage · every ${attack.cooldown.toFixed(2)}s · range ${attack.range}m<br>${attack.slow?'Slows targets briefly. ':''}${attack.targets>1?'Hits up to 3 nearby enemies. ':''}Assists your fights automatically.</div>`:''}
    <h4 class="sub">Your companions</h4><div class="petCards">${cards}</div>
    <p class="fine">One pet fights at a time. Each pet trains independently to level 99. Nearby monster kills award 10 + 2 × monster level XP (level contribution capped at 100); elites give triple. Eligible world bosses award 150 + 4 × boss level XP, capped at level 100. Pet kills earn normal hero loot and XP. Idle rewards and XP orbs do not train pets.</p>
    <p class="fine">Training improves pet damage and attack speed. Prestige unlocks pets and upgrades their visual evolution through five forms. All pet levels and XP survive prestige. Pet attacks and bonuses apply only in world play, including Rifts, and never in Showdown. Pets rest in town and menus.</p>
    <p class="fine">World stat bonuses grow gradually toward +10% damage and +20% HP. Your equipped pet appears beside your hero in the studio.</p>
    <p class="say">Prestige is optional. At level ${PRESTIGE_LEVEL}, return to Willowcross Town to review a restart at level 1. Your gear, mastery and collections carry forward.</p></div>
    <div class="pBar">${selBar('', `<button class="ghost" data-act="mMenu">Menu</button><button class="primary" data-act="prestigeReview" ${blocked?'disabled':''}>${blocked || `Review prestige ${prestigeCount(p)+1}`}</button>`)}</div>`,true,true);
}
function equipCompanion(id) {
  if(!choosePet(G.profile,id))return;
  refreshPlayerStats(false);G.dirty=true;saveNow(true);Sfx.play('click');openPrestige();
}
function openPrestigeReview() {
  const blocked=prestigeBlocked();if(blocked){showToast(blocked,'bad');return openPrestige();}
  UI.current='prestigeReview';UI.prestigePlan=prestigePlan(G.profile);
  openModal(dock(`<h3>Review prestige ${UI.prestigePlan.prestige+1}</h3>`, `<p class="say">Restart at level 1, unlock new companions and evolve your pets.</p>
    <div class="mergeNotice"><b>Restarts</b><br>Hero level and XP, Level Road, waypoints, World Tier, current job and job cycle. Every hero's skill tree is refunded: level points restart at level 1, mastery points stay to spend again.<br><br>
    <b>Kept</b><br>All gear and inventory, protected items, gold and gems, cases, brawlers, mastery, artifact unlocks and slots, pets and their training XP, collections, records, trophies, feats and settings.</div>`,
    selBar('', `<button class="ghost sm" data-act="saveCode">Backup code</button><button class="ghost" data-act="mPrestige">Cancel</button><button class="primary" data-act="prestigeConfirm">Restart · prestige ${UI.prestigePlan.prestige+1}</button>`, '', 'This restart cannot be undone in-game. Save a backup code first if you want a recovery copy.')));
}
function confirmPrestige() {
  const blocked=prestigeBlocked();
  if(blocked || !applyPrestige(G.profile,UI.prestigePlan)){UI.prestigePlan=null;showToast(blocked || 'Progress changed. Review prestige again.','bad');return openPrestige();}
  UI.prestigePlan=null;const p=G.profile;migratePets(p);setShowcase(false);clearProjectiles();
  if(G.boss)endBoss(false);
  setWorldTier(0);G.streak=0;G.streakT=0;G.gearPrompts=[];
  for(const enemy of G.enemies){enemy.tagged=false;enemy.burnT=0;enemy.slowT=0;enemy.lastHurt=-99;}
  G.player.x=CFG.world.spawn.x;G.player.z=CFG.world.spawn.z;G.zoneIdx=0;G.menuSafe=3;G.lastCombat=-99;
  refreshPlayerStats(true);Doll.alertAt=0;G.dirty=true;saveNow(true);
  showBanner(`Prestige ${p.prestige}`,`${petProgress(p).name} · evolution ${petProgress(p).stage}`,'good');
  Sfx.play('unlock');openPrestige();
}

// --- Earned equipment collection ----------------------------------------------------------------------
const COLLECTION_HUNTS = {
  common: 'Monster loot and Hunter’s Chests', uncommon: 'Monster loot and Hunter’s Chests',
  rare: 'Rare monster loot, boss chests and the Level Road',
  epic: 'Boss chests, Rift Lords and the Level Road',
  legendary: 'Boss chests, Rift Lords and the Level Road',
  mythic: 'World Tiers, deep zones or Rift floor 25+',
  ancient: 'World Tier 2+ or Rift floor 50+',
  divine: 'World Tier 3+ or Rift floor 100+',
};
// Legendary Trials in the Collection Log: runestones, trials taken, sigils, Radiants and today's odds
function trialLog() {
  const T = CFG.dungeon.trial, rows = CFG.world.zones.map((zn, zi) => ({ zn, zi, lit: zn.safe ? 0 : runesLit(zi), S: (G.profile.trials || {})[zi] })).filter((r) => r.lit || r.S);
  return `<h3>Legendary Trials</h3><p class="fine">Radiant chance per trial: 1 in ${fmt(radiantOdds())} with your current kill chain (base 1 in ${T.radiant}). Every area hides ${T.runes} runestones.</p>` +
    (rows.length ? `<div class="list">${rows.map((r) => `<div class="row"><b>${escapeHTML(r.zn.name)}</b><small>${r.lit < T.runes ? `${r.lit}/${T.runes} runestones` : `${r.S ? r.S.n : 0} trials · ${r.S ? r.S.sig : 0}/${T.sigilCost} sigils · ${r.S ? r.S.rad : 0} Radiant`}</small></div>`).join('')}</div>` : '<p class="fine">No runestones lit yet. Look for lone obelisks off the road.</p>');
}
function openCollection(slot) {
  UI.current = 'collection'; UI.collectionSlot = slot === 'all' || CFG.gear.slots.includes(slot) ? slot : 'all';
  const p = G.profile, found = p.collection || {}, all = COLLECTION_ITEMS;
  const items = UI.collectionSlot === 'all' ? all : all.filter(d => d.slot === UI.collectionSlot);
  const count = all.filter(d => found[d.id]).length;
  const filters = ['all', ...CFG.gear.slots].map(s => `<button class="ghost sm ${s === UI.collectionSlot ? 'on' : ''}" data-act="collectionSlot" data-slot="${s}" aria-pressed="${s === UI.collectionSlot}">${s === 'all' ? 'All' : SLOT_LABEL[s]}</button>`).join('');
  const cards = items.map(d => `<button class="collectionCard ${d.rarity} ${found[d.id] ? 'found' : ''}" data-act="collectionItem" data-id="${d.id}" aria-label="${d.name}, ${d.rarity}, ${found[d.id] ? 'found' : 'not found'}">
    <img src="${collectionIcon({ ...d, collectionId: d.id })}" width="256" height="256" loading="lazy" decoding="async" alt="">
    <b>${d.name}</b>${rarityChip(d.rarity)}<small>${found[d.id] ? 'Found · ' + found[d.id].count + ' earned' : 'Item level ' + d.minLevel + '+'}</small></button>`).join('');
  openModal(`<div class="npcHead">${gi('m_hero', 'hd')}<h3>Collection Log</h3><span class="cnt">${count}/${all.length}</span></div>
    <p class="fine">Tap an item to plan your hunt. Found records stay after merging or salvaging gear.</p>
    <div class="collectionFilters">${filters}</div><div class="collectionGrid">${cards}</div>${trialLog()}
    <div class="row end"><button class="ghost" data-act="mMenu">Menu</button><button class="ghost" data-act="cases">Cases</button></div>`);
  $('panel').classList.add('wide');
}
function openCollectionItem(id) {
  const d = COLLECTION_ITEMS.find(d => d.id === id); if (!d) return;
  UI.current = 'collectionItem';
  const p = G.profile, record = p.collection?.[id], misses = p.collectionLuck?.[d.slot + '|' + d.rarity] || 0;
  openModal(`<div class="npcHead"><h3>${d.name}</h3></div>
    <div class="collectionFocus ${d.rarity}"><img src="${collectionIcon({ ...d, collectionId: d.id })}" width="256" height="256" alt="${d.name}">${rarityChip(d.rarity)}<b>${record ? 'Found · ' + record.count + ' earned' : 'Not attuned yet'}</b></div>
    <p class="fine">${d.theme || 'Explorer'} collection · ${SLOT_LABEL[d.slot]} · item level ${d.minLevel}+</p>
    <h4>Where to hunt</h4><p class="say">${COLLECTION_HUNTS[d.rarity]}</p>
    <p class="mergeNotice collectionOdds">Each eligible ${d.rarity} ${SLOT_LABEL[d.slot].toLowerCase()} drop has a ${COLLECTION_CHANCE * 100}% named-item chance. Drop ${COLLECTION_GUARANTEE} guarantees one.<br><b>${misses}/${COLLECTION_GUARANTEE - 1} misses toward the guarantee</b></p>
    <p class="fine">The drop must meet this item's level. Stats, bonuses and perks follow the existing rarity rules. Earned loot only.</p>
    <div class="row end"><button class="ghost" data-act="collectionSlot" data-slot="${UI.collectionSlot || 'all'}">Back to collection</button></div>`);
}


// --- Brawlers -----------------------------------------------------------------------------------------
function openBrawlers(sel) {
  UI.current = 'brawlers';
  const p = G.profile, owned = ownedBrawlers(p), fresh = new Set(p.newUnlocks);
  sel = sel || UI.brawlerSel || p.cls; UI.brawlerSel = sel;
  const onlyOwned = !!UI.ownedOnly;
  const cards = CFG.brawlerOrder.filter((id) => !onlyOwned || owned.includes(id)).map((id) => {
    const B = CFG.brawlers[id], have = owned.includes(id), L = masteryOf(p, id);
    return `<button class="bcard ${have ? 'own' : 'locked'} ${id === sel ? 'sel' : ''} ${id === p.cls ? 'cur' : ''}" data-act="bSel" data-id="${id}">
      ${fresh.has('a:' + id) ? '<i class="rdot"></i>' : ''}${brawlerPortrait(id, have, 52)}
      <b>${B.name}</b><small>${have ? `Mastery ${L}` : 'Locked'}</small>${id === p.cls ? '<span class="eqd">Playing</span>' : ''}</button>`;
  }).join('');
  const B = CFG.brawlers[sel], A = CFG.attacks[sel], C = CFG.classes[sel], have = owned.includes(sel);
  const first = p.starterBrawler || 'bolt', firstLevel = masteryOf(p, first), switchReady = canSwitchBrawler(p, sel);
  const xp = (p.mastery || {})['w:' + sel] || 0, L = masteryLevel(xp), a0 = mxpFor(L), a1 = mxpFor(Math.min(99, L + 1)), f = L >= 99 ? 1 : (xp - a0) / Math.max(1, a1 - a0);
  const t = tierOf(L), next = CFG.badges.find((b) => L < b.lvl);
  const badges = CFG.badges.map((b, i) => `<div class="bdg ${L >= b.lvl ? 'got' : ''}">${badgeSVG(L >= b.lvl ? i : -1, 'b_' + sel, { static: L < b.lvl })}<small>${b.name}<br>${b.lvl}</small></div>`).join('');
  const sup = CFG.supers[C.super], sk = CFG.skills[C.skill];
  const free = have ? treeFree(p, sel) : 0, tp = have ? treeOf(p, sel).total : 0;
  const summary = `${brawlerPortrait(sel, have, 46)}<div class="sx"><b>${B.name}${sel === p.cls ? ' · playing' : ''}</b><small>${C.role} · ${A.name}</small><small>${have ? `Mastery ${L}${t >= 0 ? ' · ' + CFG.badges[t].title : ''} · ${free > 0 ? `<span style="color:#ffc94a">${free} tree points free</span>` : `${tp} tree points`}` : `${gi('m_lock')} ${unlockText(A.unlock)}`}</small></div>`;
  const more = `<p class="bdesc">${A.desc}.</p>
    <div class="kit"><div><span>Super</span><b>${sup.name}</b><small>Tap to auto-aim, drag to aim</small></div><div><span>Skill</span><b>${sk ? sk.name : '—'}</b><small>${sk ? sk.desc : ''}</small></div></div>
    ${have ? `<div class="mast"><div class="mrowh"><b>Mastery ${L}</b><span>${L >= 99 ? 'Maxed' : next ? `${next.name} badge at ${next.lvl}` : ''}</span></div><span class="mbar"><i style="--v:${(f * 100).toFixed(1)}%"></i></span>
      <small>${fmtK(xp)} xp · badges give +3% damage and +2% HP each</small></div>` : ''}
    <div class="bdgs">${badges}</div>`;
  const btns = have ? `<button class="ghost" data-act="bTree" data-id="${sel}">${gi('m_skills')} Skill tree${free > 0 ? '<i class="rdot in"></i>' : ''}</button>${sel === p.cls ? '<button class="disabled" aria-disabled="true">Playing</button>' : switchReady ? `<button class="primary" data-act="bPlay" data-id="${sel}">Play as ${B.name}</button>` : `<button class="disabled" disabled>Mastery ${BRAWLER_SWITCH_MASTERY} required</button>`}` : '<button class="disabled" disabled>Locked</button>';
  const note = firstLevel < BRAWLER_SWITCH_MASTERY ? `Master ${CFG.brawlers[first].name} to ${BRAWLER_SWITCH_MASTERY} to switch heroes (${firstLevel}/${BRAWLER_SWITCH_MASTERY}).` : '';
  openModal(dock(`<div class="npcHead">${gi('m_brawlers', 'hd')}<h3>Heroes</h3><span class="cnt">${owned.length}/${CFG.brawlerOrder.length}</span>
    <label class="own"><input type="checkbox" data-act="ownedOnly" ${onlyOwned ? 'checked' : ''}> Recruited only</label></div>`,
    `<div class="bgrid">${cards}</div>`, selBar(summary, btns, more, note)));
  $('panel').classList.add('wide');
  setTimeout(() => { p.newUnlocks = p.newUnlocks.filter((u) => !u.startsWith('a:')); G.dirty = true; }, 0);
}

// --- Artifacts ------------------------------------------------------------------------------------------
function starRow(s) { return '★'.repeat(Math.min(s, 10)) + `<i>${'★'.repeat(Math.max(0, 10 - s))}</i>`; }
function openArtifacts(tab) {
  tab = tab || 'Equip'; UI.current = 'artifacts'; UI.artTab = tab;
  const p = G.profile, fresh = new Set(p.newUnlocks), n = artifactSlotsFor(p), onlyOwned = !!UI.ownedOnly;
  const slots = Array.from({ length: n }, (_, i) => { const id = p.artifacts[i];
    return id ? `<button class="aslot2 full fam-${ART_FAM[id] || 'tech'}" data-act="toggleArt" data-id="${id}">${gi('a_' + id)}<b>${CFG.artifacts[id].name}</b><small>Tap to remove</small></button>`
      : `<div class="aslot2"><span class="plus">+</span><small>Empty slot</small></div>`; }).join('') + (n < 3 ? '<div class="aslot2 lockd">' + gi('m_lock') + '<small>3rd slot at level 30</small></div>' : '');
  const ids = Object.keys(CFG.artifacts).filter((id) => !onlyOwned || p.unlocked.artifacts.includes(id));
  const cards = ids.map((id) => {
    const a = CFG.artifacts[id], have = p.unlocked.artifacts.includes(id), on = p.artifacts.includes(id);
    const st = p.artStars[id] || 1;
    return `<button class="acard ${have ? 'own' : 'locked'} ${on ? 'on' : ''}" ${have ? `data-act="toggleArt" data-id="${id}"` : 'aria-disabled="true"'}>${fresh.has('r:' + id) ? '<i class="rdot"></i>' : ''}
      <span class="aic fam-${ART_FAM[id] || 'tech'}">${gi('a_' + id)}${have ? '' : gi('m_lock', 'lk')}</span><b>${a.name}</b>${have ? `<span class="stars">${starRow(st)}</span>` : ''}<small>${have ? artDesc(id, st) : unlockText(a.unlock)}</small>${on ? '<span class="eqd">On</span>' : ''}</button>`;
  }).join('');
  const tabs = ['Equip', 'Upgrade'].map((t) => `<button class="tab ${tab === t ? 'on' : ''}" data-act="artTab" data-tab="${t}">${t === 'Upgrade' ? 'Empower' : tabName(t)}</button>`).join('');
  const body = tab === 'Equip'
    ? `<p class="fine">Socketed relics change how ${CFG.brawlers[p.cls].name}’s ${CFG.attacks[p.cls].name} behaves. Each hero keeps their own relics.</p><div class="aslots2">${slots}</div><div class="agrid">${cards}</div>`
    : `<p class="fine">Each star makes an artifact stronger. Shards drop from elites, dens, shrines and world bosses (only for artifacts you own).</p><div class="aup">${p.unlocked.artifacts.filter((id) => !onlyOwned || true).map((id) => {
        const a = CFG.artifacts[id], st = p.artStars[id] || 1, max = st >= ART_MAX, sh = p.shards[id] || 0, need = artShardCost(st), gm = artGemCost(st), can = !max && sh >= need && p.essence >= gm;
        return `<div class="aurow"><span class="aic own fam-${ART_FAM[id] || 'tech'}">${gi('a_' + id)}</span><div class="aum"><b>${a.name} <span class="stars">${starRow(st)}</span></b><small>${artDesc(id, st)}</small>${max ? '' : `<small class="nx">★${st + 1}: ${artDesc(id, st + 1)}</small>`}
          ${max ? '' : `<span class="sbar"><i style="--v:${Math.min(100, sh / need * 100).toFixed(0)}%"></i><em>${sh}/${need} shards</em></span>`}</div>
          <button class="${can ? 'primary' : 'disabled'}" data-act="artUp" data-id="${id}" ${can ? '' : 'aria-disabled="true"'}>${max ? 'Max' : `★ ${ICON.ess}${gm}`}</button></div>`; }).join('') || '<p class="fine">Unlock artifacts first.</p>'}</div>`;
  openModal(`<div class="npcHead">${gi('m_artifacts', 'hd')}<h3>Relics</h3><span class="cnt">${p.unlocked.artifacts.length}/${Object.keys(CFG.artifacts).length}</span>
    <label class="own"><input type="checkbox" data-act="ownedOnly" ${onlyOwned ? 'checked' : ''}> Owned only</label></div>
    <div class="tabs">${tabs}</div><div class="tabBody">${body}</div>`);
  $('panel').classList.add('wide');
  setTimeout(() => { p.newUnlocks = p.newUnlocks.filter((u) => !u.startsWith('r:')); G.dirty = true; }, 0);
}

// --- Progress: Level Road, Records, Feats -------------------------------------------------------------------
function openProgress(tab) {
  tab = tab || 'Road'; UI.current = 'progress';
  const p = G.profile;
  const tabs = ['Road', 'Records', 'Feats'].map((t) => `<button class="tab ${tab === t ? 'on' : ''}" data-act="progTab" data-tab="${t}">${tabName(t)}</button>`).join('');
  let body = '';
  if (tab === 'Road') {
    const rows = [];
    const ORD = ['', '', '', '3rd', '4th', '5th'];
    for (let L = 2; L <= Math.max(100, Math.ceil((p.level + 30) / 10) * 10); L++) {
      const r = [], ms = milestoneAt(L);
      r.push(ms ? `<span class="rw chest ${ms}">${CFG.gear.rarity[ms].name} chest + ${Math.ceil(L / 5) * 3} gems</span>` : '<span class="rw">Gear drop</span>');
      CFG.world.zones.forEach((zn) => { if (zn.minLevel === L && !zn.safe) r.push(`<span class="rw zone">${zn.name} opens</span>`); });
      if (P.artifactSlotAt[L]) r.push(`<span class="rw art">${ORD[P.artifactSlotAt[L]]} artifact slot</span>`);
      const ai = P.ascendAt.indexOf(L); if (ai >= 0) r.push(`<span class="rw asc">${gi('m_asc')} Ascended: ${['golden aura', 'wings + super power', 'crown + trail'][ai]}</span>`);
      for (let t = 1; t <= maxTier(L) + 1; t++) if (tierDef(t).req === L) r.push(`<span class="rw tier">${gi('m_tier')} World Tier ${tierDef(t).name}</span>`);
      if (L === CFG.rift.unlock) r.push(`<span class="rw zone">${gi('m_rift')} The Rift opens</span>`);
      for (const id of CFG.brawlerOrder) { const a = CFG.attacks[id]; if (a.unlock && a.unlock.level === L) r.push(`<span class="rw atk">${gi('b_' + id)} ${CFG.brawlers[id].name}</span>`); }
      for (const id in CFG.artifacts) { const a = CFG.artifacts[id]; if (a.unlock && a.unlock.level === L) r.push(`<span class="rw art">${gi('a_' + id)} ${a.name}</span>`); }
      r.push(`<span class="rw key">+${2 + (L % 10 === 0 ? 5 : 0)} talent points</span>`);
      rows.push(`<div class="road ${L <= p.level ? 'done' : L === p.level + 1 ? 'next' : ''} ${ms ? 'ms' : ''}" ${L === p.level + 1 ? 'id="roadNext"' : ''}><span class="rl">${L}</span><div class="rr">${r.join('')}</div></div>`);
    }
    body = `<p class="fine">Every level drops an item and gives talent points to every hero. Every 5th level is a milestone chest.</p><div class="roadlist">${rows.join('')}</div>`;
    setTimeout(() => { const n = document.getElementById('roadNext'); if (n) n.scrollIntoView({ block: 'center' }); }, 30);
  } else if (tab === 'Records') {
    const s = p.stats, rec = (k, v) => `<div><span>${k}</span><b>${v}</b></div>`;
    const kills = Object.keys(CFG.enemies).filter((k) => CFG.enemies[k].hp && (!CFG.enemies[k].legacy || ((s.killsBy || {})[k] || (k === 'slime' ? s.slimes : 0)) > 0)).map((k) => rec(CFG.enemies[k].name + ' kills', fmtK((s.killsBy || {})[k] || (k === 'slime' ? s.slimes : 0)))).join('');
    const R = p.records, hm = (t) => `${Math.floor(t / 3600)}h ${Math.floor(t / 60) % 60}m`;
    body = `<div class="statgrid">${rec('Biggest hit', fmtK(R.maxHit || 0))}${rec('Fastest boss kill', R.fastBoss ? R.fastBoss + 's' : '—')}${rec('Best Showdown place', R.bestPlace ? '#' + R.bestPlace : '—')}${rec('Best Rift floor', R.bestRift || 0)}${rec('Highest World Tier', tierDef(R.bestTier || 0).name)}${rec('Play time', hm(R.time || 0))}</div><h4 class="sub">Totals</h4><div class="statgrid">${rec('Highest level', p.level)}${rec('Monsters defeated', fmtK(s.kills))}${rec('Elites defeated', fmtK(s.elites || 0))}${rec('Best kill streak', fmt(s.bestStreak || 0))}
      ${rec('World bosses', fmt(s.bosses || 0))}${rec('Shrines cleared', fmt(s.shrines || 0))}${rec('Jobs done', fmt(s.jobs || 0))}${rec('Total mastery', fmt(totalMastery(p)))}
      ${rec('Best trophies', fmt(p.bestTrophies || 0))}${rec('Showdown wins', fmt(s.wins || 0))}${rec('Feats done', `${Object.keys(p.ach).length}/${ACHIEVEMENTS.length}`)}${rec('Brawlers', `${ownedBrawlers(p).length}/${CFG.brawlerOrder.length}`)}</div>
      <h4 class="sub">Slayer</h4><div class="statgrid">${kills}</div>`;
  } else {
    body = `<div class="feats">${ACHIEVEMENTS.map((a) => `<div class="feat ${p.ach[a.id] ? 'got' : ''}">${gi(p.ach[a.id] ? 'm_feats' : 'm_lock')}<b>${a.name}</b><small>${a.desc}</small></div>`).join('')}</div>`;
  }
  openModal(`<div class="npcHead">${gi('m_progress', 'hd')}<h3>Adventure Log</h3><span class="cnt">Level ${p.level}</span></div><div class="tabs">${tabs}</div><div class="tabBody">${body}</div>`);
}

// --- Skill trees (canvas): pinch to zoom, drag to pan, tap a node ---------------------------------------------------
const TreeView = { which: null, cv: null, s: 40, ox: 0, oy: 0, sel: null, ptrs: new Map(), pinch: null, moved: 0, raf: 0, paths: new Map() };
function nodeInfo(n) {
  if (n.key) { const k = CFG.keystones.flat().find((x) => x.id === n.key); return { name: k.name, icon: 'k_' + n.key, desc: k.desc }; }
  if (n.tag) { const t = BTAGS[n.tag]; return { name: t.name, icon: t.icon, desc: t.desc }; }
  const K2 = NODE_KINDS[n.kind]; return { name: K2.name, icon: K2.icon, desc: K2.fmt(K2.eff) + ' per rank', kind: K2 };
}
function openSkills(which) {
  const p = G.profile;
  which = which || TreeView.which || p.cls;
  if (!ownedBrawlers(p).includes(which)) which = p.cls;
  if (which !== TreeView.which) TreeView.sel = null;
  TreeView.which = which; UI.current = 'skills';
  const T = treeOf(p, which), free = treeFree(p, which), title = `${CFG.brawlers[which].name}’s tree`;
  const src = `${T.total} points · ${T.level} from level ${p.level} + ${T.mastery} from mastery ${masteryOf(p, which)} · only for ${CFG.brawlers[which].name}`;
  const presets = T.st.sets.map((_, i) => `<button class="pre ${T.st.active === i ? 'on' : ''}" data-act="tPreset" data-i="${i}">${i + 1}</button>`).join('');
  const bopts = ownedBrawlers(p).map((id) => `<option value="${id}" ${id === which ? 'selected' : ''}>${CFG.brawlers[id].name}${treeFree(p, id) > 0 ? ' •' : ''}</option>`).join('');
  openModal(`<div class="treeTop">
      <div class="tsw"><span class="tab on">${gi('m_brawlers')} Hero${ownedBrawlers(p).some((id) => id !== which && treeFree(p, id) > 0) ? '<i class="rdot tabdot"></i>' : ''}</span>
        <select data-sel2="tBrawler" aria-label="Choose a hero">${bopts}</select></div>
      <div class="tinfo"><b>${title}</b><span class="tpts ${free > 0 ? 'hot' : ''}">${free} point${free === 1 ? '' : 's'} to spend</span><small>${src}</small></div>
      <div class="tact"><span class="pres">Build ${presets}</span><button class="ghost sm" data-act="tReset">Reset ${ICON.coin}${fmtK(treeResetCost(p))}</button></div>
    </div>
    <div class="treeWrap"><canvas id="treeCv"></canvas><div class="tzoom"><button data-act="tZoom" data-z="in" aria-label="Zoom in">+</button><button data-act="tZoom" data-z="out" aria-label="Zoom out">−</button><button data-act="tZoom" data-z="fit" aria-label="Show the whole tree">Fit</button></div><div id="nodeCard" hidden></div><div class="thint">Drag to move · pinch or +/− to zoom · tap a node</div></div>`, true);
  $('panel').classList.add('treePanel'); $('panel').classList.remove('scroll');
  setupTreeCanvas();
  renderNodeCard();
}
const TZ_MIN = 6, TZ_MAX = 150;
// the whole tree fits the canvas (with room for the labels around it)
function treeFit(w, h) { return Math.min(w, h * 1.1) / 2 / 18.2; }
function treeZoom(how) {
  const cx = TreeView.w / 2, cy = TreeView.h / 2, wx = (cx - TreeView.ox) / TreeView.s, wy = (cy - TreeView.oy) / TreeView.s;
  if (how === 'fit') { TreeView.s = treeFit(TreeView.w, TreeView.h); TreeView.ox = TreeView.w / 2; TreeView.oy = TreeView.h / 2; return; }
  TreeView.s = clamp(TreeView.s * (how === 'in' ? 1.3 : 1 / 1.3), TZ_MIN, TZ_MAX); TreeView.ox = cx - wx * TreeView.s; TreeView.oy = cy - wy * TreeView.s;
}
function setupTreeCanvas() {
  const cv = $('treeCv'); TreeView.cv = cv;
  const r = cv.parentNode.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
  const fit = treeFit(r.width, r.height);
  if (!TreeView.keep) { TreeView.s = Math.max(fit, Math.min(fit * 1.6, 26)); TreeView.ox = r.width / 2; TreeView.oy = r.height / 2; }
  TreeView.keep = false; TreeView.w = r.width; TreeView.h = r.height; TreeView.dpr = dpr;
  const toWorld = (x, y) => [(x - TreeView.ox) / TreeView.s, (y - TreeView.oy) / TreeView.s];
  cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); TreeView.ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY }); TreeView.moved = 0; if (TreeView.ptrs.size === 2) { const [a, b] = [...TreeView.ptrs.values()]; TreeView.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: TreeView.s }; } };
  cv.onpointermove = (e) => {
    const pt = TreeView.ptrs.get(e.pointerId); if (!pt) return;
    const dx = e.offsetX - pt.x, dy = e.offsetY - pt.y; pt.x = e.offsetX; pt.y = e.offsetY; TreeView.moved += Math.abs(dx) + Math.abs(dy);
    if (TreeView.ptrs.size === 2 && TreeView.pinch) {
      const [a, b] = [...TreeView.ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      const [wx, wy] = toWorld(cx, cy); TreeView.s = clamp(TreeView.pinch.s * d / TreeView.pinch.d, TZ_MIN, TZ_MAX); TreeView.ox = cx - wx * TreeView.s; TreeView.oy = cy - wy * TreeView.s;
    } else { TreeView.ox += dx; TreeView.oy += dy; }
  };
  const up = (e) => {
    const pt = TreeView.ptrs.get(e.pointerId); TreeView.ptrs.delete(e.pointerId); if (TreeView.ptrs.size < 2) TreeView.pinch = null;
    if (pt && TreeView.moved < 8 && e.type === 'pointerup') {
      const [wx, wy] = toWorld(e.offsetX, e.offsetY), T = treeOf(G.profile, TreeView.which);
      let best = null, bd = 0.9; for (const id in T.nodes) { const n = T.nodes[id], d = Math.hypot(n.x - wx, n.y - wy); if (d < bd) { bd = d; best = id; } }
      TreeView.sel = best; renderNodeCard(); if (best) Sfx.play('click');
    }
  };
  cv.onpointerup = up; cv.onpointercancel = up;
  cv.onwheel = (e) => { e.preventDefault(); const [wx, wy] = toWorld(e.offsetX, e.offsetY); TreeView.s = clamp(TreeView.s * (e.deltaY < 0 ? 1.12 : 0.89), TZ_MIN, TZ_MAX); TreeView.ox = e.offsetX - wx * TreeView.s; TreeView.oy = e.offsetY - wy * TreeView.s; };
  cancelAnimationFrame(TreeView.raf);
  const loop = () => { if (UI.current !== 'skills' || !$('treeCv')) return; drawTree(); TreeView.raf = requestAnimationFrame(loop); };
  TreeView.raf = requestAnimationFrame(loop);
}
// pixel tree: nodes are the game's pixel icon tiles (coloured by branch when learned, stone when not),
// links are flat pixel bars, no glows; drawn with nearest-neighbour scaling so every tile stays crisp
const BRANCH_FAM = { might: 'fire', fort: 'nature', swift: 'ice', sorc: 'arcane', carn: 'blood', storm: 'electric', pow: 'fire', rhy: 'gold', uti: 'ice', core: 'gold', r0: 'gold', r1: 'arcane', r2: 'ice', r3: 'gold', r4: 'arcane', r5: 'ice', r6: 'gold', r7: 'arcane', r8: 'ice' };
const branchFam = (id) => BRANCH_FAM[id.split('_')[0]] || 'gold';
const treeImgs = new Map();
function treeImg(url) { let im = treeImgs.get(url); if (!im) { im = new Image(); im.src = url; treeImgs.set(url, im); } return im; }
function drawTree() {
  const cv = TreeView.cv, g = cv.getContext('2d'), dpr = TreeView.dpr, p = G.profile, which = TreeView.which;
  const T = treeOf(p, which), set = T.st.sets[T.st.active], free = treeFree(p, which), t = performance.now() / 1000;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingEnabled = false;
  g.fillStyle = '#100e16'; g.fillRect(0, 0, TreeView.w, TreeView.h);
  const S = TreeView.s, X = (x) => Math.round(TreeView.ox + x * S), Y = (y) => Math.round(TreeView.oy + y * S);
  // backdrop: a sparse field of pixel stars that moves with the tree
  g.fillStyle = 'rgba(160,150,190,.18)';
  for (let i = 0; i < 140; i++) { const hx = Math.sin(i * 12.9898) * 43758.5453, hy = Math.sin(i * 78.233) * 43758.5453; const wx = (hx - Math.floor(hx) - 0.5) * 36, wy = (hy - Math.floor(hy) - 0.5) * 36; g.fillRect(X(wx), Y(wy), 2, 2); }
  // links: flat bars, bright when both ends are learned
  const owned = (id) => (set[id] || 0) > 0 || T.nodes[id].start;
  const px = Math.max(2, Math.round(S * 0.09));
  for (const id in T.nodes) {
    const n = T.nodes[id];
    for (const l of n.links) {
      if (l < id) continue; const m = T.nodes[l];
      const both = owned(id) && owned(l), one = owned(id) || owned(l);
      const col = both ? PX_FAM[branchFam(n.start ? l : id)].ink[1] : null;
      g.lineCap = 'butt'; g.lineWidth = both ? px + 2 : px;
      g.strokeStyle = '#0a0910'; g.beginPath(); g.moveTo(X(n.x), Y(n.y)); g.lineTo(X(m.x), Y(m.y)); g.lineWidth += 2; g.stroke();
      g.lineWidth -= 2; g.strokeStyle = both ? '#' + col.toString(16).padStart(6, '0') : one ? '#6e6878' : '#2c2834';
      g.beginPath(); g.moveTo(X(n.x), Y(n.y)); g.lineTo(X(m.x), Y(m.y)); g.stroke();
    }
  }
  // nodes
  const label = (txt, x, y, size, col) => { const numeric = /^[\d/×+−.%∞]+$/.test(txt); g.font = `700 ${size}px ${numeric ? 'Rubik, sans-serif' : "'Arena Numerals', 'Pixelify Sans', monospace"}`; g.textAlign = 'center'; g.fillStyle = '#000'; g.fillText(txt, x, y + 2); g.fillStyle = col; g.fillText(txt, x, y); };
  for (const id in T.nodes) {
    const n = T.nodes[id], info = nodeInfo(n), cx = X(n.x), cy = Y(n.y);
    if (cx < -80 || cy < -80 || cx > TreeView.w + 80 || cy > TreeView.h + 80) continue;
    const rank = set[id] || 0, open = nodeOpen(T.nodes, set, id), can = open && rank < nodeMax(n) && free >= n.cost, lit = rank > 0 || n.start;
    const size = Math.max(16, Math.round((n.start ? 1.35 : n.big ? 1.2 : 0.86) * S / 8) * 8), h = size / 2;
    const fam = lit ? (n.start ? 'gold' : branchFam(id)) : open ? 'steel' : 'parch';
    const im = treeImg(PixelIcons.url(info.icon, fam));
    g.save(); g.globalAlpha = lit || open ? 1 : 0.55;
    if (im.complete) g.drawImage(im, cx - h, cy - h, size, size);
    g.restore();
    // keystones: a second bone frame; buyable nodes blink a white frame; the selected node gets a cyan one
    const frame = (col, pad, w) => { g.fillStyle = col; g.fillRect(cx - h - pad, cy - h - pad, size + pad * 2, w); g.fillRect(cx - h - pad, cy + h + pad - w, size + pad * 2, w); g.fillRect(cx - h - pad, cy - h - pad, w, size + pad * 2); g.fillRect(cx + h + pad - w, cy - h - pad, w, size + pad * 2); };
    if (n.big) frame(lit ? '#efe6cf' : '#5a5466', 3, 3);
    if (can && Math.sin(t * 6) > -0.2) frame('#ffffff', n.big ? 7 : 3, 2);
    if (TreeView.sel === id) frame('#7fe3ff', n.big ? 10 : 6, 3);
    const fs = clamp(Math.round(S * 0.26), 10, 16);
    if (!n.big && !n.start && S > 18) label(n.max === Infinity ? `${rank}` : `${rank}/${n.max}`, cx, cy + h + fs + 3, fs, rank > 0 ? '#efe6cf' : '#8a8496');
    if (S > 44 && !n.start) label(info.name, cx, cy - h - (n.big ? 9 : 6), clamp(Math.round(S * 0.22), 10, 15), lit ? '#ffffff' : '#a9a3b6');
    if (n.start && S > 16) label(rank ? `×${rank}` : '∞', cx, cy + h + fs + 4, fs, '#efe6cf');
  }
  // branch names
  if (S > 7) {
    const own = { pow: 1, rhy: 1, uti: 1 };
    CFG.treeBranches.forEach((b) => { const r = 15.6; label(b.name.toUpperCase(), X(Math.cos(b.angle) * r), Y(Math.sin(b.angle) * r) + 5, clamp(Math.round(S * 0.5), 12, 20), own[b.id] ? '#a8925a' : '#6e6878'); });
  }
}
function renderNodeCard() {
  const el = $('nodeCard'); if (!el) return;
  const id = TreeView.sel, p = G.profile, which = TreeView.which;
  if (!id) { el.hidden = true; return; }
  const T = treeOf(p, which), n = T.nodes[id], info = nodeInfo(n), set = T.st.sets[T.st.active], rank = set[id] || 0, mx = nodeMax(n);
  const open = nodeOpen(T.nodes, set, id), free = treeFree(p, which), can = canSpend(p, which, id);
  let cur = '';
  if (info.kind && rank) { const tot = {}; for (const k in info.kind.eff) tot[k] = info.kind.eff[k] * rank; cur = `Now: ${info.kind.fmt(tot)}`; }
  const why = rank >= mx ? 'Maxed' : !open ? 'Unlock a connected node first' : free < n.cost ? `Needs ${n.cost} point${n.cost > 1 ? 's' : ''}` : '';
  el.innerHTML = `<div class="nc">${gi(info.icon, n.big ? 'key' : '')}<div><b>${info.name}</b><small>${n.big ? 'Keystone · 3 points' : mx === Infinity ? `Rank ${rank} · no limit` : `Rank ${rank}/${mx}`}</small><p>${info.desc}</p>${cur ? `<p class="cur">${cur}</p>` : ''}</div></div>
    <div class="ncb">${why ? `<span class="why">${why}</span>` : ''}<button class="${can ? 'primary' : 'disabled'}" data-act="tSpend" data-n="1" ${can ? '' : 'aria-disabled="true"'}>+1</button>${!n.big ? `<button class="${can ? 'ghost' : 'disabled'}" data-act="tSpend" data-n="${mx === Infinity ? 10 : 5}" ${can ? '' : 'aria-disabled="true"'}>+${mx === Infinity ? 10 : 'max'}</button>` : ''}</div>`;
  el.hidden = false;
}

// --- world feed: small, bottom-left, out of the way ---------------------------------------------------------
const Feed = {
  lines: new Map(), seq: 0,
  add(text, kind, key, life) {
    const box = $('feed'); if (!box) return;
    key = key || 'f' + (this.seq++);
    let L = this.lines.get(key);
    if (!L) { const el = document.createElement('div'); el.className = 'fl ' + (kind || ''); box.appendChild(el); L = { el }; this.lines.set(key, L); }
    L.el.innerHTML = text; L.t = life || 6; L.el.classList.remove('out');
    const keys = [...this.lines.keys()]; while (keys.length > 3) { const k = keys.shift(); const o = this.lines.get(k); o.el.remove(); this.lines.delete(k); }
  },
  remove(key) { const L = this.lines.get(key); if (L) { L.el.remove(); this.lines.delete(key); } },
  update(dt) {
    for (const [k, L] of this.lines) { L.t -= dt; if (L.t < 0.6) L.el.classList.add('out'); if (L.t <= 0) { L.el.remove(); this.lines.delete(k); } }
  },
};

function creditsPanel() {
  UI.current = 'credits';
  const by = {}; for (const k in GI_SRC) { const [n, a] = GI_SRC[k]; (by[a] = by[a] || []).push(n); }
  const rows = Object.keys(by).sort().map((a) => `<div class="cr"><b>${a}</b><small>${by[a].join(', ')}</small></div>`).join('');
  openModal(`<h3>Credits</h3><p class="fine">Skeletal animations adapted from KayKit by Kay Lousberg (CC0 1.0). Original character meshes retained, with fitted fantasy equipment. See assets/animation/LICENSE.txt.</p><p class="fine">Icons from <b>game-icons.net</b>, licensed under Creative Commons BY 3.0 (creativecommons.org/licenses/by/3.0). Made by:</p><div class="credits">${rows}</div>
    <p class="fine">Most 3D models, effects and sounds are made in code for this game. Engine: three.js (MIT). Fonts: Cinzel, Lilita One, Pixelify Sans and Rubik (SIL Open Font License 1.1, see assets/fonts).</p>
    <p class="fine">Generated 3D models: Microsoft TRELLIS.2 (MIT) from concept images made with Z-Image-Turbo by Tongyi-MAI (Apache 2.0).</p><div class="row end"><button class="primary" data-act="openSettings">Back</button></div>`);
}
function openV8Intro() {
  UI.current = 'v8';
  const p = G.profile, B = CFG.brawlers[p.cls];
  openModal(`<div class="center"><div class="eyebrow">Update · Endless Ascension</div><h2>Meet the brawlers</h2></div>
    <div class="v8">${brawlerPortrait(p.cls, true, 84)}<div><p>Your hero is now <b>${B.name}</b>, the ${CFG.classes[p.cls].role.toLowerCase()} with ${CFG.attacks[p.cls].name}. Every attack is now its own brawler with a mastery and badges.</p>
    <p>All skill points were refunded: ${B.name} has <b>${treeFree(p, p.cls)} points</b> waiting in their skill tree. Every hero has their own tree.</p></div></div>
    <div class="row end"><button class="ghost" data-act="close">Later</button><button class="primary" data-act="mSkills">Open skill tree</button></div>`);
}

