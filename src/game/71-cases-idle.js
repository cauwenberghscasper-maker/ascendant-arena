// ---------------------------------------------------------------------
// 12. CASES + IDLE — earned cases with a spinning reel, the Vault, Expeditions and Auto Hunt.
// Cases are only ever EARNED in play (drops, bosses, Rift, Level Road, Vault, Expeditions).
// They are never sold for money or for any currency, and every case shows its odds.
// ---------------------------------------------------------------------
CFG.cases = {
  hunter: { name: 'Hunter’s Chest', sub: 'Dropped by monsters, elites, dens and shrines', col: '#58b4ff', w: { common: 14, uncommon: 24, rare: 30, epic: 21, legendary: 9 }, hi: 5 },
  treasure: { name: 'Treasure Chest', sub: 'From the Vault, expeditions and level-ups', col: '#ffc94a', w: { uncommon: 20, rare: 36, epic: 28, legendary: 14 }, hi: 6 },
  boss: { name: 'Colossus Chest', sub: 'World boss loot', col: '#ff7a45', w: { rare: 26, epic: 42, legendary: 28 }, hi: 10 },
  rift: { name: 'Rift Chest', sub: 'Rift Lord loot · deeper floors roll higher', col: '#ff5d8f', w: { epic: 46, legendary: 40 }, hi: 14 },
  milestone: { name: 'Milestone Chest', sub: 'Level Road chest · guaranteed minimum rarity', col: '#c77dff', w: null, hi: 0 },
  frost: { name: 'Frostbound Chest', sub: 'Frost Colossus · Mountain Peaks · level 30+', col: '#8cecff', w: { rare: 26, epic: 42, legendary: 28 }, hi: 10 },
  ember: { name: 'Cinderforge Chest', sub: 'Magma Titan · Volcanic Underworld · level 60+', col: '#ff913b', w: { rare: 26, epic: 42, legendary: 28 }, hi: 10 },
  celestial: { name: 'Seraphic Chest', sub: 'Celestial Colossus · Celestial Ascension · level 160+', col: '#fff0aa', w: { rare: 26, epic: 42, legendary: 28 }, hi: 10 },
  geode: { name: 'Geode', sub: 'Cracked from ore veins (Mining) · also holds a Museum mineral', col: '#7fe3c4', w: { uncommon: 30, rare: 40, epic: 22, legendary: 8 }, hi: 4 },
};
CFG.caseOrder = ['milestone', 'rift', 'boss', 'treasure', 'hunter', 'frost', 'ember', 'celestial', 'geode'];
const CASE_LUCK = { legendary: 30, mythic: 120 };
// these drop sources hand out a case instead of the item itself (Epic and up, or always for big loot)
const CASE_SRC = { monster: 'hunter', elite: 'hunter', level: 'hunter', shrine: 'hunter', idle: 'treasure', boss: 'boss', rift: 'rift', milestone: 'milestone' };
function caseTable(c) {
  const K = CFG.cases[c.k] || CFG.cases.hunter; let w;
  if (c.k === 'milestone') {
    const f = rarIdx(c.f || 'rare'), steps = [60, 25, 10, 4, 1]; w = {};
    for (let i = 0; i < steps.length; i++) {
      const r = RARITIES[f + i]; if (!r) break;
      if ((r === 'mythic' && c.l < 80) || (r === 'ancient' && c.l < 150) || (r === 'divine' && c.l < 300)) break;
      w[r] = steps[i];
    }
    return w;
  }
  w = Object.assign({}, K.w);
  if (c.k === 'rift') { const n = c.n || 0; if (n >= 25) w.mythic = 6 + Math.min(20, (n - 25) * 0.4); if (n >= 50) w.ancient = 2 + Math.min(10, (n - 50) * 0.15); if (n >= 100) w.divine = 0.6 + Math.min(4, (n - 100) * 0.05); }
  else { const H = highWeights(c.t || 0, c.z || 0); for (const h of HIGH_RAR) if (H[h] > 0) w[h] = H[h] * K.hi; }
  if (c.f) for (const r in w) if (rarIdx(r) < rarIdx(c.f)) delete w[r];
  return w;
}
function caseOdds(c) { const w = caseTable(c); let tot = 0; for (const k in w) tot += w[k]; return RARITIES.filter((r) => w[r]).map((r) => [r, w[r] / tot]); }
function addCase(k, o) {
  const p = G.profile; o = o || {};
  const c = { id: 'c' + Date.now().toString(36) + (itemSeq++), k, l: o.l || p.level, t: o.t != null ? o.t : curTier(), z: o.z != null ? o.z : lootTier(highestZone(p.level)), n: o.n || 0, f: o.f || null };
  p.cases.push(c); G.dirty = true;
  saveNow(true); // Save newly earned chests before announcing them, including interrupted sessions.
  ev({ t: 'caseGot', k, src: o.src }); return c;
}
function rollCase(c) {
  const p = G.profile, w = caseTable(c); let r = rollRarity(w), lucky = false;
  const L = p.caseLuck || (p.caseLuck = { legendary: 0, mythic: 0 });
  if (w.mythic && rarIdx(r) < 5 && L.mythic + 1 >= CASE_LUCK.mythic) { r = 'mythic'; lucky = true; }
  else if (w.legendary && rarIdx(r) < 4 && L.legendary + 1 >= CASE_LUCK.legendary) { r = 'legendary'; lucky = true; }
  L.legendary = rarIdx(r) >= 4 ? 0 : L.legendary + 1;
  if (w.mythic) L.mythic = rarIdx(r) >= 5 ? 0 : L.mythic + 1;
  return { r, lucky };
}
// bonus on top of the item: a very rare hero, a gold or gem jackpot, or crafting materials (shown with the odds)
const CASE_BONUS = { hero: 0.002, gold: 0.04, gems: 0.03, mats: 0.25 };
function caseBonus() {
  const p = G.profile, x = Math.random(); let acc = 0;
  const locked = CFG.brawlerOrder.filter((id) => id !== STARTER_HERO && !p.unlocked.attacks.includes(id) && !(CFG.attacks[id].unlock && CFG.attacks[id].unlock.sigils != null));
  if (locked.length && x < (acc += CASE_BONUS.hero)) {
    const id = pick(locked); p.unlocked.attacks.push(id); p.newUnlocks.push('a:' + id);
    ev({ t: 'unlock', what: 'brawler', id, name: CFG.brawlers[id].name, role: CFG.attacks[id].name }); return { k: 'hero', id, name: CFG.brawlers[id].name };
  }
  if (x < (acc += CASE_BONUS.gold)) { const n = Math.round(6 * Math.pow(CFG.enemies.goldGrowth, p.level - 1) * 360); addGold(n, true); return { k: 'gold', n }; } // about six hours of Bank income
  if (x < (acc += CASE_BONUS.gems)) { const n = 20 + Math.round(p.level / 3); addEssence(n); return { k: 'gems', n }; }
  // CB (crafting) is absent in the node-only checks
  if (typeof CB !== 'undefined' && x < (acc += CASE_BONUS.mats)) { const B = CB[zoneBiome(highestZone(p.level))]; return { k: 'mats', got: addMats([[B.ore, 8 + p.level / 10], [B.part, 3 + p.level / 25]], true) }; }
  return null;
}
function bonusHTML(b) {
  if (!b) return '';
  if (b.k === 'hero') return `<div class="cbonus hero"><b>HERO!</b> ${escapeHTML(b.name)} joins you</div>`;
  if (b.k === 'gold') return `<div class="cbonus gold"><b>JACKPOT</b> ${ICON.coin}${fmtK(b.n)}</div>`;
  if (b.k === 'gems') return `<div class="cbonus gems"><b>GEMS</b> ${ICON.ess}${fmtK(b.n)}</div>`;
  return `<div class="cbonus mats">${b.got.map(([id, n]) => matChip(id, null, G.profile).replace(/<b>.*?<\/b>/, `<b>+${n}</b>`)).join('')}</div>`;
}
// opening grants the item at once (so closing mid-spin never loses it); the reel only shows it
function openCase(id) {
  const p = G.profile, i = p.cases.findIndex((c) => c.id === id); if (i < 0) return null;
  // Case rewards are always kept: when the bag is full they overflow it instead of blocking the case.
  const c = p.cases.splice(i, 1)[0], { r, lucky } = rollCase(c);
  const it = makeItem(pick(CFG.gear.slots), r, c.l);
  p.stats.cases = (p.stats.cases || 0) + 1;
  p.records.bestCase = Math.max(p.records.bestCase || 0, rarIdx(r));
  grantItem(it, 'case');
  const mineral = c.k === 'geode' ? crackGeode() : null, bonus = caseBonus();
  G.dirty = true; checkAchievements();
  saveNow(true); // Persist the case removal and exact reward together, before the reel.
  return { item: it, lucky, c, mineral, bonus, kept: p.bag.some((b) => b.id === it.id) };
}

// --- Vault: fills while you play or are away; collect any time ---------------------------------
const vaultLv = (p) => (p.vault && p.vault.lv) || 0;
const vaultCapH = (p) => Math.min(24, 8 + vaultLv(p));
const VAULT_MAX_LV = 16;
function vaultRates(p) {
  const t = Math.min(p.worldTier || 0, maxTier(p.level)), zi = highestZone(p.level), Z = CFG.world.zones[zi], L = Math.max(1, Math.min(p.level, Z.lvl[1] + tierDef(t).add));
  const m = 1 + 0.12 * vaultLv(p), TM = tierMul(t);
  return { gold: 6 * Math.pow(CFG.enemies.goldGrowth, L - 1) * m * TM.gold, xp: killXpAt(L) * 1.6 * m, gems: (0.1 + L / 600) * m * TM.gems, shards: 0.04 * m, casesPerH: 0.5 + vaultLv(p) * 0.03 };
}
function vaultState(now) {
  const p = G.profile, cap = vaultCapH(p) * 60, mins = Math.min(cap, Math.max(0, (now - (p.vault.t || now)) / 60000)), R = vaultRates(p);
  return { mins, cap, full: mins >= cap - 0.5, gold: Math.round(R.gold * mins), xp: Math.round(Math.min(R.xp * mins, xpToNext(p.level) * 2)), gems: Math.floor(R.gems * mins),
    shards: Math.floor(R.shards * mins), cases: Math.floor((mins / 60) * R.casesPerH) };
}
function collectVault() {
  const p = G.profile, v = vaultState(Date.now()); if (v.mins < 1) return null;
  p.vault.t = Date.now();
  addGold(v.gold, true); if (v.gems) addEssence(v.gems); if (v.shards) dropShards(v.shards, true);
  for (let i = 0; i < v.cases; i++) addCase('treasure', { src: 'vault' });
  if (v.xp) { const keep = p.settings.fastXp; p.settings.fastXp = false; addXp(v.xp, 'vault'); p.settings.fastXp = keep; }
  p.stats.vaults = (p.stats.vaults || 0) + 1; G.dirty = true; ev({ t: 'vault', v }); return v;
}
const vaultUpCost = (p) => Math.round(400 * Math.pow(2.1, vaultLv(p)) * Math.pow(CFG.enemies.goldGrowth, Math.max(0, p.level - 1) * 0.5));
function upgradeVault() {
  const p = G.profile, c = vaultUpCost(p); if (vaultLv(p) >= VAULT_MAX_LV || p.gold < c) return false;
  p.gold -= c; p.vault.lv = vaultLv(p) + 1; G.dirty = true; ev({ t: 'vaultUp', lv: p.vault.lv }); return true;
}

// --- Expeditions: the brawlers you are not playing go out and come back with loot --------------
CFG.exped = { durs: [15, 60, 240, 480], slotsAt: [1, 20, 50, 100] };
const expSlots = (p) => CFG.exped.slotsAt.filter((L) => p.level >= L).length;
function expReward(p, e) {
  const mins = e.d, B = masteryLevel(p.mastery['w:' + e.b] || 0), R = vaultRates(p), long = 1 + mins / 480;
  return { gold: Math.round(R.gold * mins * 0.6 * long), mxp: Math.round(mins * 2 * (1 + B / 30)), gems: Math.floor(mins / 12 * long), shards: Math.floor(mins / 30), cases: Math.floor(mins / 120) + (mins >= 480 ? 1 : 0),
    ore: Math.round(mins * 0.5 * (1 + CFG.mining.pickYield * ((p.mine && p.mine.pick) || 0))), geodes: Math.floor(mins / 90) };
}
const expDone = (e, now) => now - e.s >= e.d * 60000;
function startExped(b, d) {
  const p = G.profile; if (!CFG.exped.durs.includes(d) || !ownedBrawlers(p).includes(b) || b === p.cls || p.exp.some((e) => e.b === b) || p.exp.length >= expSlots(p)) return false;
  p.exp.push({ b, s: Date.now(), d }); G.dirty = true; ev({ t: 'expStart', b, d }); return true;
}
function claimExped(i) {
  const p = G.profile, e = p.exp[i]; if (!e || !expDone(e, Date.now())) return null;
  const r = expReward(p, e); p.exp.splice(i, 1);
  addGold(r.gold, true); addEssence(r.gems); if (r.shards) dropShards(r.shards, true); addMastery('w:' + e.b, r.mxp);
  for (let k = 0; k < r.cases; k++) addCase('treasure', { src: 'exped' });
  mineState().ore += r.ore; for (let k = 0; k < r.geodes; k++) addCase('geode', { src: 'exped' });
  p.stats.expeds = (p.stats.expeds || 0) + 1; G.dirty = true; checkAchievements(); ev({ t: 'expDone', b: e.b, r }); return r;
}
const onExpedition = (p, b) => (p.exp || []).some((e) => e.b === b);

// --- Auto Hunt: your hero fights on its own (walks to monsters at your level, shoots, dashes, supers) ---
const AH = { tgt: null, node: null, mineT: 0, t: 0, manualT: 0, dashT: 0, lx: 0, lz: 0, stuckT: 0, side: 1, lastDen: null, curDen: null, detA: 0, detT: 0, escA: 0, escT: 0, stuckN: 0, detS: 0 };
// steer around props: when the way ahead is blocked, take a detour heading and hold it for a moment so the hero does not jitter in front of a big model
function ahSteer(f, tx, tz, dt) {
  const len = Math.hypot(tx, tz); if (len < 1e-3) return [tx, tz];
  const bx = tx / len, bz = tz / len, rot = (a) => { const c = Math.cos(a), sn = Math.sin(a); return [bx * c - bz * sn, bx * sn + bz * c]; };
  const clear = (d) => [f.r + 1, f.r + 3, f.r + 5.5].every((k) => !pointBlocked(f.x + d[0] * k, f.z + d[1] * k, f.r * 0.5));
  if (AH.escT > 0) { AH.escT -= dt; return rot(AH.escA); } // stuck for a while: walk sideways out of the pocket first
  if (AH.detT > 0) { AH.detT -= dt; const d = rot(AH.detA); if (clear(d)) return d; AH.detT = 0; }
  if (clear([bx, bz])) { AH.detS = 0; return [tx, tz]; }
  // keep going round the same side until the way ahead opens up (no zig-zag along a long wall)
  const first = AH.detS || AH.side;
  for (const sg of [first, -first]) for (const a of [0.6, 1.1, 1.6, 2.2, 2.8]) { const d = rot(a * sg); if (clear(d)) { AH.detA = a * sg; AH.detS = sg; AH.detT = 1.2; return d; } }
  return [tx, tz];
}
// the best open den for your level; the den you just emptied scores as if it were 300 m further away
function autoHuntDen(f, level) {
  let D = null, bd = 1e9;
  CFG.world.dens.forEach((dn) => { if (level < CFG.world.zones[dn.zone].minLevel) return; const L = CFG.world.zones[dn.zone].lvl[1] + tierAdd(); const score = Math.abs(L - level) * 8 + Math.hypot(dn.x - f.x, dn.z - f.z) * 0.2 + (dn === AH.lastDen ? 60 : 0); if (score < bd) { bd = score; D = dn; } });
  return D;
}
// the nearest ready ore vein you are allowed to mine (veins that blocked the hero recently are skipped for a while)
function autoHuntNode(f, level, maxD) {
  let best = null, bd = maxD;
  for (const st of nodeStates()) {
    if (st.t > 0 || (st.ahSkip || 0) > G.time || level < CFG.world.zones[st.q.zone].minLevel) continue;
    const d = Math.hypot(st.q.x - f.x, st.q.z - f.z); if (d < bd) { bd = d; best = st; }
  }
  return best;
}
function autoHuntOn() { const p = G.profile; return !!(p && p.settings.autoHunt && G.mode === 'hub' && !G.rift && G.started); }
function autoHuntIntent(f, it, manual, dt) {
  if (manual) { AH.manualT = 1.5; return; }
  if ((AH.manualT -= dt) > 0 || !f.alive) return;
  const p = G.profile, w = weaponOf(f), range = w.range || 12;
  AH.t -= dt; AH.dashT -= dt;
  const okZone = (zi) => p.level >= CFG.world.zones[zi].minLevel;
  if (AH.t <= 0 || !AH.tgt || !AH.tgt.alive) {
    AH.t = 0.4; let best = null, bd = 30;
    for (const e of G.enemies) { if (!e.alive || e.rift || e.lvl > p.level + 3 || !okZone(e.zone) || (e.ahSkip || 0) > G.time) continue; const d = Math.hypot(e.x - f.x, e.z - f.z); if (d < bd) { bd = d; best = e; } }
    AH.tgt = best;
  }
  let tx, tz;
  const e = AH.tgt;
  // ore: when a vein is ready close by (and nothing closer is attacking), walk over and mine it; fights come first when hurt
  AH.mineT -= dt; AH.node = null;
  if (f.hp >= f.maxHp * 0.5) {
    const nd = autoHuntNode(f, p.level, 45);
    if (nd) { const ed = e ? Math.hypot(e.x - f.x, e.z - f.z) : 1e9; if (!e || Math.hypot(nd.q.x - f.x, nd.q.z - f.z) < Math.min(ed, 14)) AH.node = nd; }
  }
  if (AH.node) {
    const nd = AH.node, dx = nd.q.x - f.x, dz = nd.q.z - f.z, d = Math.hypot(dx, dz) || 1;
    if (d <= CFG.mining.interactR - 0.8) { tx = tz = 0; if (AH.mineT <= 0) { mineNode(nd); AH.mineT = 0.5; AH.node = null; } }
    else { tx = dx / d; tz = dz / d; }
  } else if (e) {
    const dx = e.x - f.x, dz = e.z - f.z, d = Math.hypot(dx, dz) || 1, want = range * 0.7, los = !losBlocked(f.x, f.z, e.x, e.z);
    if (!los) { tx = dx / d; tz = dz / d; } // a prop is in the way: walk round it instead of firing into it
    else if (d > want) { tx = dx / d; tz = dz / d; } else if (d < want * 0.45) { tx = -dx / d; tz = -dz / d; } else { tx = -dz / d * 0.7 * AH.side; tz = dx / d * 0.7 * AH.side; }
    if (d < range + 1 && los) { it.autoFire = true; it.ax = dx / d; it.az = dz / d; }
    if (f.superCharge >= 1 && d < range && los) it.super = true;
    if (f.hp < f.maxHp * 0.35 && d < 5 && AH.dashT <= 0) { it.dash = true; AH.dashT = 3; it.mx = -dx / d; it.mz = -dz / d; return; }
    if (f.hp < f.maxHp * 0.2) { tx = -dx / d; tz = -dz / d; }
  } else {
    // nothing near: walk to the best open den for your level
    let D = null, bd = 1e9;
    D = autoHuntDen(f, p.level);
    if (!D) return;
    AH.curDen = D; if (Math.hypot(D.x - f.x, D.z - f.z) < D.r) AH.lastDen = D; // emptied this den: head for the other one next
    const dx = D.x - f.x, dz = D.z - f.z, d = Math.hypot(dx, dz) || 1; tx = dx / d; tz = dz / d;
  }
  // unstick: if we barely moved for a while, switch sides, give up on whatever we are walking to, and sidestep out of the pocket
  AH.stuckT += dt;
  if (AH.stuckT > 1.4) {
    if (Math.hypot(f.x - AH.lx, f.z - AH.lz) < 0.8 && (tx || tz)) {
      AH.side = -AH.side; AH.stuckN++; AH.escA = AH.side * 1.5; AH.escT = 0.9;
      if (AH.node) AH.node.ahSkip = G.time + 25;
      else if (e) { e.ahSkip = G.time + 15; AH.tgt = null; }
      else if (AH.curDen && AH.stuckN >= 2) AH.lastDen = AH.curDen;
    } else AH.stuckN = 0;
    AH.stuckT = 0; AH.lx = f.x; AH.lz = f.z;
  }
  const st = ahSteer(f, tx || 0, tz || 0, dt); tx = st[0]; tz = st[1];
  it.mx = tx; it.mz = tz;
}
const powerOf = (f) => Math.round(Math.sqrt(Math.max(1, f.dmg) * Math.max(1, f.maxHp)));

// --- UI -------------------------------------------------------------------------------------------
function caseArt(k, cls) { const K = CFG.cases[k]; return `<span class="caseArt ${cls || ''}" style="--cc:${K.col}"><img src="${caseIcon(k) || PremiumPortraits.case(k)}" width="256" height="256" alt=""></span>`; }
function openCases(sel) {
  UI.current = 'cases';
  const p = G.profile, groups = {}; let bar = ''; for (const c of p.cases) (groups[c.k] = groups[c.k] || []).push(c);
  const kinds = CFG.caseOrder.filter((k) => groups[k]);
  sel = sel && groups[sel] ? sel : kinds[0];
  const tiles = CFG.caseOrder.map((k) => { const n = (groups[k] || []).length; return `<button class="ctile ${k === sel ? 'sel' : ''} ${n ? '' : 'none'}" data-act="caseSel" data-k="${k}" style="--cc:${CFG.cases[k].col}">${caseArt(k)}<b>${CFG.cases[k].name}</b><small>${n ? '×' + n : 'none yet'}</small></button>`; }).join('');
  let body = '';
  if (!sel) body = `<p class="say">Win treasure chests from monsters, bosses, the Rift, the Level Road, the Bank and expeditions. Hunt the Frost Colossus, Magma Titan and Celestial Colossus for their regional chests.</p>`;
  else {
    const c = groups[sel][0], odds = caseOdds(c), L = p.caseLuck || { legendary: 0, mythic: 0 };
    body = `<div class="caseHero" style="--cc:${CFG.cases[sel].col}">${caseArt(sel, 'big')}<div><b>${CFG.cases[sel].name}</b><small>${CFG.cases[sel].sub} · item level ${c.l}${c.f ? ` · at least ${CFG.gear.rarity[c.f].name}` : ''}</small></div></div>
      <div class="odds">${odds.map(([r, x]) => `<div class="od ${r}"><span>${CFG.gear.rarity[r].name}</span><b>${x >= 0.01 ? (x * 100).toFixed(1) : (x * 100).toFixed(2)}%</b></div>`).join('')}</div>
      <div class="odds bonusOdds"><div class="od"><span>Hero</span><b>0.2%</b></div><div class="od"><span>Gold jackpot</span><b>4%</b></div><div class="od"><span>Gems</span><b>3%</b></div><div class="od"><span>Materials</span><b>25%</b></div></div>
      <p class="fine">Legendary guaranteed within ${Math.max(1, CASE_LUCK.legendary - L.legendary)} chests${caseTable(c).mythic ? ` · Mythic within ${Math.max(1, CASE_LUCK.mythic - L.mythic)}` : ''}. Chests are won in play only and can never be bought.</p>`;
    bar = selBar('', `${p.cases.length > 1 ? `<button class="ghost boost big5" data-act="caseFast" data-k="${sel}"><b>×${Math.min(5, p.cases.length)}</b><small>Open all</small></button>` : ''}<button class="primary big" data-act="caseOpen" data-id="${c.id}">Open ${CFG.cases[sel].name}${groups[sel].length > 1 ? ` (${groups[sel].length})` : ''}</button>`);
  }
  openModal(dock(`<div class="npcHead">${gi('m_case', 'hd')}<h3>Treasure Chests</h3><span class="cnt">${p.cases.length} stored</span></div>`, `${body}<div class="ctiles">${tiles}</div><div class="row end"><button class="ghost" data-act="mGear">Back to Inventory</button><button class="ghost" data-act="mCollection">Collection Log</button></div>`, bar));
  $('panel').classList.add('wide');
}
// the CS:GO-style reel: a long strip of items slides past a golden marker and slows down on your item
const Reel = { raf: 0, done: true, res: null };
function reelCard(it) { return `<div class="rcard ${it.rarity}"><img src="${thumbFor(it)}" alt=""><i></i></div>`; }
function spinCase(id) {
  const res = openCase(id); if (!res) return;
  const p = G.profile, w = caseTable(res.c), N = 52, WIN = 44, cards = [];
  for (let i = 0; i < N; i++) {
    let r = i === WIN ? res.item.rarity : rollRarity(w);
    if (i === WIN + 1 && Math.random() < 0.45) { const hi = RARITIES.filter((x) => w[x] && rarIdx(x) > rarIdx(res.item.rarity)); if (hi.length) r = hi[0]; } // the classic near miss
    cards.push(i === WIN ? res.item : makeItem(pick(CFG.gear.slots), r, res.c.l));
  }
  UI.current = 'reel'; Reel.res = res; Reel.done = false;
  openModal(`<div class="reelHead" style="--cc:${CFG.cases[res.c.k].col}">${caseArt(res.c.k, 'shake')}<b>${CFG.cases[res.c.k].name}</b></div>
    <div class="reel"><div class="strip" id="reelStrip">${cards.map(reelCard).join('')}</div><div class="marker"></div></div>
    <div id="reelOut" class="reelOut"><button class="ghost sm" data-act="reelSkip">Skip</button></div>`, false);
  $('panel').classList.add('wide');
  // measured in the reel's own layout pixels: menus are drawn zoomed (Menu size), and getBoundingClientRect would
  // return zoomed sizes while translateX moves in unzoomed ones, so the reel used to stop several cards early
  const strip = $('reelStrip'), box = strip.parentNode, win = strip.children[WIN], cw = strip.children[1].offsetLeft - strip.firstChild.offsetLeft, vw = box.clientWidth;
  const end = win.offsetLeft - strip.firstChild.offsetLeft + win.offsetWidth / 2 - vw / 2 + (Math.random() - 0.5) * (win.offsetWidth - 26), dur = 5600, t0 = performance.now();
  let lastIdx = -1;
  Sfx.play('ui.spin');
  const step = (now) => {
    if (UI.current !== 'reel') return;
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4), x = end * (Reel.skip ? 1 : e);
    strip.style.transform = `translateX(${-x}px)`;
    const idx = Math.floor((x + vw / 2) / cw); if (idx !== lastIdx) { lastIdx = idx; Sfx.play('tick', { gap: 0.025 }); }
    if (k >= 1 || Reel.skip) { Reel.skip = false; reelFinish(strip.children[WIN]); return; }
    Reel.raf = requestAnimationFrame(step);
  };
  cancelAnimationFrame(Reel.raf); Reel.raf = requestAnimationFrame(step);
}
function reelFinish(card) {
  const res = Reel.res; Reel.done = true; UI.closable = true;
  if (card) card.classList.add('win');
  const it = res.item, ri = rarIdx(it.rarity), p = G.profile, better = res.kept && isBetter(it, p.gear[it.slot]);
  Sfx.play('ui.reveal', { r: ri });
  if (ri >= 4) { burst(G.player.x, 1.4, G.player.z, 40 + ri * 6, RAR_HEX[it.rarity], 7, 1.1, 0.32, 3, 1.6); }
  const left = p.cases.filter((c) => c.k === res.c.k), over = p.bag.length > CFG.gear.bagMax;
  $('reelOut').innerHTML = `${bonusHTML(res.bonus)}${over ? `<p class="fine">Bag ${p.bag.length}/${CFG.gear.bagMax}: this reward was kept anyway. Reforge with older gear so normal drops are kept too.</p>` : ''}<div class="reelWin ${it.rarity}"><span class="rname">${res.lucky ? 'Luck guarantee · ' : ''}${CFG.gear.rarity[it.rarity].name}</span>${itemRow(it, '', `${SLOT_LABEL[it.slot]} · item level ${it.ilvl}`, { better })}</div>
    <div class="row end">${res.kept ? `${better ? `<button class="primary" data-act="equip2" data-id="${it.id}">${wearWord(it.slot)}</button>` : ''}` : '<span class="tagged">Salvaged (bag full)</span>'}
    ${left.length ? `<button class="primary gold" data-act="caseOpen" data-id="${left[0].id}">Open next (${left.length})</button>` : ''}<button class="ghost" data-act="cases">Back</button></div>`;
}
// up to five chests at once: five reels stacked, each stopping a little later than the one above;
// the last one takes longest. Every reward is granted before the reels start, so closing never loses one.
function openCasesFast(k) {
  const p = G.profile, out = [];
  // the chosen kind first, then any other chests, so Open 5 also works with mixed chests
  for (const id of p.cases.filter((c) => c.k === k).concat(p.cases.filter((c) => c.k !== k)).slice(0, 5).map((c) => c.id)) { const r = openCase(id); if (r) out.push(r); }
  if (!out.length) return;
  const N = 40, WIN = 32;
  const strips = out.map((res) => { const w = caseTable(res.c), cards = [];
    for (let i = 0; i < N; i++) {
      let r = i === WIN ? res.item.rarity : rollRarity(w);
      if ((i === WIN + 1 || i === WIN - 1) && Math.random() < 0.4) { const hi = RARITIES.filter((x) => w[x] && rarIdx(x) > rarIdx(res.item.rarity)); if (hi.length) r = hi[hi.length - 1]; } // near misses on both sides
      cards.push(i === WIN ? res.item : makeItem(pick(CFG.gear.slots), r, res.c.l));
    } return cards; });
  UI.current = 'reel'; Reel.done = false; Reel.skip = false;
  openModal(`<div class="reelHead" style="--cc:${CFG.cases[k].col}">${caseArt(k, 'shake')}<b>${out.length}× ${CFG.cases[k].name}</b></div>
    <div class="reels">${strips.map((cards, j) => `<div class="reel mini" id="reel${j}"><div class="strip">${cards.map(reelCard).join('')}</div><div class="marker"></div></div>`).join('')}</div>
    <div id="reelOut" class="reelOut"><button class="ghost sm" data-act="reelSkip">Skip</button></div>`, false);
  $('panel').classList.add('wide');
  const R = strips.map((_, j) => { const box = $('reel' + j), strip = box.firstChild, win = strip.children[WIN], cw = strip.children[1].offsetLeft - strip.firstChild.offsetLeft, vw = box.clientWidth;
    return { box, strip, cw, vw, end: win.offsetLeft - strip.firstChild.offsetLeft + win.offsetWidth / 2 - vw / 2 + (Math.random() - 0.5) * (win.offsetWidth - 18),
      dur: 2600 + j * 700 + (j === strips.length - 1 ? 1400 : 0), last: -1, done: false }; });
  const t0 = performance.now(); Sfx.play('ui.spin');
  const step = (now) => {
    if (UI.current !== 'reel') return;
    let left = 0;
    R.forEach((r, j) => { if (r.done) return;
      const k2 = Math.min(1, (now - t0) / r.dur), x = r.end * (Reel.skip ? 1 : 1 - Math.pow(1 - k2, 4));
      r.strip.style.transform = `translateX(${-x}px)`;
      const idx = Math.floor((x + r.vw / 2) / r.cw); if (idx !== r.last) { r.last = idx; Sfx.play('tick', { gap: 0.03 }); }
      if (k2 >= 1 || Reel.skip) { r.done = true; reelLand(r, out[j], WIN); } else left++; });
    if (!left) { Reel.skip = false; reelManyFinish(out, k); return; }
    Reel.raf = requestAnimationFrame(step);
  };
  cancelAnimationFrame(Reel.raf); Reel.raf = requestAnimationFrame(step);
}
// one reel stops: its card lights up, rarer pulls flash the reel and shake the screen
function reelLand(r, res, WIN) {
  const ri = rarIdx(res.item.rarity); r.strip.children[WIN].classList.add('win'); r.box.classList.add('landed', res.item.rarity);
  if (ri >= 3 || (res.bonus && res.bonus.k !== 'mats')) { r.box.classList.add('jackpot'); if (!G.profile.settings.calm) Cam.shake = Math.max(Cam.shake, 0.25 + 0.1 * ri); }
  if (res.bonus && res.bonus.k === 'hero') Sfx.play('radiant'); else Sfx.play('ui.reveal', { r: ri });
}
function reelManyFinish(out, k) {
  Reel.done = true; UI.closable = true;
  const p = G.profile, left = p.cases.length, best = out.reduce((a, r) => Math.max(a, rarIdx(r.item.rarity)), 0);
  if (best >= 4) burst(G.player.x, 1.4, G.player.z, 50 + best * 6, RAR_HEX[RARITIES[best]], 7, 1.1, 0.32, 3, 1.6);
  $('reelOut').innerHTML = `<div class="reelSum">${out.map((r) => `<div class="rcard ${r.item.rarity}"><img src="${thumbFor(r.item)}" alt=""><i></i></div>`).join('')}</div>
    ${out.map((r) => bonusHTML(r.bonus)).join('')}
    <div class="row end">${left ? `<button class="primary" data-act="caseFast" data-k="${k}">Open ${Math.min(5, left)} more</button>` : ''}<button class="ghost" data-act="cases">Back</button></div>`;
}
function openIdle(tab) {
  tab = tab || UI.idleTab || 'Vault'; UI.idleTab = tab; UI.current = 'idle';
  const p = G.profile, now = Date.now();
  const tabs = ['Vault', 'Expeditions', 'Mining', 'Auto Hunt'].map((t) => `<button class="tab ${t === tab ? 'on' : ''}" data-act="idleTab" data-tab="${t}">${tabName(t)}</button>`).join('');
  let body = '', bar = '';
  if (tab === 'Vault') {
    const v = vaultState(now), R = vaultRates(p), lv = vaultLv(p), cost = vaultUpCost(p), pct = Math.round(v.mins / v.cap * 100);
    const hm = (m) => `${Math.floor(m / 60)}h ${Math.floor(m % 60)}m`;
    body = `<div class="vaultBox"><div class="vbar"><i style="width:${pct}%"></i><span>${pct}% · ${hm(v.mins)} of ${vaultCapH(p)}h${v.full ? ' · FULL' : ''}</span></div>
      <div class="stats3"><div><b>${ICON.coin}${fmtK(v.gold)}</b><span>Gold</span></div><div><b>+${fmtK(v.xp)}</b><span>XP (max 2 levels)</span></div><div><b>${ICON.ess}${v.gems}</b><span>Gems</span></div></div>
      <div class="stats3"><div><b>${v.shards}</b><span>Artifact shards</span></div><div><b>${v.cases}</b><span>Treasure Cases</span></div><div><b>${fmtK(R.gold * 60)}/h</b><span>Gold rate</span></div></div>
</div>
      <h4 class="sub">Bank level ${lv}/${VAULT_MAX_LV}</h4><p class="fine">Your bank coffers fill while you play and while you are away, up to ${vaultCapH(p)} hours. Each level adds +12% to everything and +1 hour of storage. Rates follow your level, your best open zone and your World Tier.</p>
`;
    bar = selBar('', `<button class="${lv < VAULT_MAX_LV && p.gold >= cost ? 'ghost' : 'disabled'}" data-act="vaultUp" ${lv < VAULT_MAX_LV && p.gold >= cost ? '' : 'aria-disabled="true"'}>${lv >= VAULT_MAX_LV ? 'Max level' : `Upgrade ${ICON.coin}${fmtK(cost)}`}</button><button class="${v.mins >= 1 ? 'primary big' : 'disabled'}" data-act="vaultCollect" ${v.mins >= 1 ? '' : 'aria-disabled="true"'}>Collect</button>`);
  } else if (tab === 'Expeditions') {
    const slots = expSlots(p), rows = p.exp.map((e, i) => {
      const done = expDone(e, now), left = Math.max(0, e.s + e.d * 60000 - now), r = expReward(p, e), k = Math.min(1, (now - e.s) / (e.d * 60000));
      return `<div class="item exp">${brawlerPortrait(e.b, true)}<div class="meta"><div class="slot">${CFG.brawlers[e.b].name} · ${e.d >= 60 ? e.d / 60 + 'h' : e.d + 'm'} expedition</div><div class="nm">${done ? 'Back with loot!' : `${Math.ceil(left / 60000)} min left`}</div>
        <div class="st">${ICON.coin}${fmtK(r.gold)} · ${ICON.ess}${r.gems} · ${r.shards} shards · +${fmtK(r.mxp)} mastery${r.cases ? ` · ${r.cases} case${r.cases > 1 ? 's' : ''}` : ''} · ${r.ore} ore${r.geodes ? ` · ${r.geodes} geode${r.geodes > 1 ? 's' : ''}` : ''}</div><div class="vbar sm"><i style="width:${Math.round(k * 100)}%"></i></div></div>
        ${done ? `<button class="primary" data-act="expClaim" data-i="${i}">Claim</button>` : ''}</div>`;
    }).join('');
    const free = ownedBrawlers(p).filter((b) => b !== p.cls && !onExpedition(p, b));
    const pick2 = slots > p.exp.length && free.length ? `<h4 class="sub">Send a brawler</h4><div class="expPick"><select id="expB">${free.map((b) => `<option value="${b}">${CFG.brawlers[b].name} · mastery ${masteryLevel(p.mastery['w:' + b] || 0)}</option>`).join('')}</select>
      ${CFG.exped.durs.map((d) => `<button class="ghost sm" data-act="expGo" data-d="${d}">${d >= 60 ? d / 60 + ' h' : d + ' min'}</button>`).join('')}</div>` : '';
    body = `<p class="fine">Brawlers you are not playing go out on their own and come back with gold, gems, shards, mastery XP, ore, geodes and Treasure Cases, even while the game is closed. Slots: ${p.exp.length}/${slots} (more at levels ${CFG.exped.slotsAt.filter((L) => L > p.level).join(', ') || 'all open'}).</p>
      <div class="list">${rows || '<p class="fine">No brawlers out right now.</p>'}</div>${pick2}${!free.length && slots > p.exp.length ? '<p class="fine">Unlock more brawlers on the Level Road to send them out.</p>' : ''}`;
  } else if (tab === 'Mining') {
    const m = mineState(), M = CFG.mining, c = pickCost(m.pick), can = m.pick < M.pickMax && m.ore >= c, own = M.minerals.filter(([id]) => m.museum[id]).length;
    body = `<div class="stats3"><div><b>${fmt(m.ore)}</b><span>Ore</span></div><div><b>${m.pick}/${M.pickMax}</b><span>Pickaxe</span></div><div><b>${fmt(m.mined)}</b><span>Veins mined</span></div></div>
      <p class="fine">Every area has four ore veins off the road (one glows: the rare crystal vein). Tap a vein to mine it; it regrows in ${M.respawn / 60} min (${M.rareRespawn / 60} min for crystal), and 1 in ${Math.round(1 / M.rich)} regrows rich for triple ore. Each ore has a ${(geodeChance(m, false) * 100).toFixed(2)}% chance to hold a Geode. A vein hides a pet: 1 in ${fmt(M.pet)}.</p>
      <p class="fine">Pickaxe level ${m.pick}: +${Math.round(m.pick * M.pickYield * 100)}% ore and +${(m.pick * M.pickGeode * 100).toFixed(2)}% geode chance.</p>
      <h4 class="sub">Museum ${own}/${M.minerals.length} · +${own}% XP for good</h4><div class="list">${M.minerals.map(([id, name, w]) => `<div class="row"><b>${m.museum[id] ? name : '???'}</b><small>${m.museum[id] ? `×${m.museum[id]}` : 'not found'} · ${(w / M.minerals.reduce((s, x) => s + x[2], 0) * 100).toFixed(w < 1 ? 2 : 1)}% per geode</small></div>`).join('')}</div>`;
    bar = selBar('', `<button class="${can ? 'primary' : 'disabled'}" data-act="pickUp" ${can ? '' : 'aria-disabled="true"'}>${m.pick >= M.pickMax ? 'Max pickaxe' : `Upgrade pickaxe · ${fmt(c)} ore`}</button>`);
  } else {
    body = `<label class="tgl"><input type="checkbox" data-set="autoHunt" ${p.settings.autoHunt ? 'checked' : ''}><span class="sw"></span><span><b>Auto Hunt</b><small>Your hero walks to monsters at your level, fights, dashes away when hurt and uses supers. Touch the move stick to take over; it resumes after a moment.</small></span></label>
      <p class="fine">Auto Hunt works in the open world (not in the Rift or Showdown). Monsters more than 3 levels above you are skipped, so it stays safe. Turn it on, put the phone down, and check back.</p>`;
  }
  openModal(dock(`<div class="npcHead">${gi('m_idle', 'hd')}<h3>Bank &amp; Camp</h3><span class="cnt">${vaultState(now).full ? 'Bank full' : ''}</span></div><div class="tabs">${tabs}</div>`, `<div class="tabBody">${body}</div>`, bar));
}
function idleAlert() { const p = G.profile, now = Date.now(); return vaultState(now).mins >= 60 || p.exp.some((e) => expDone(e, now)); }


