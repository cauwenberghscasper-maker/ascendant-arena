// --- progression ---------------------------------------------------------
function progressionXpMultiplier(p) { return (TEST_MODE ? 100 : (p.settings.fastXp ? P.fastXpMult : 1)) * (1 + 0.005 * Object.keys(p.secrets || {}).length + museumBonus(p)); } // +0.5% per secret found, +1% per Museum mineral
function addXp(amount, reason) {
  const p = G.profile;
  if (p.level >= P.cap) return;
  const gain = Math.round(amount * progressionXpMultiplier(p) * (1 + ((G.player && G.player.mods && G.player.mods.xpFind) || 0)));
  if (gain <= 0) return;
  p.xp += gain;
  ev({ t: 'xp', amt: gain, reason });
  let leveled = false; const pow0 = G.player ? powerOf(G.player) : 0, L0 = p.level;
  while (p.level < P.cap && p.xp >= xpToNext(p.level)) {
    p.xp -= xpToNext(p.level); p.level++; leveled = true;
    ev({ t: 'levelup', level: p.level, sp: true });
    G.levelRewards.push(p.level);
  }
  if (p.level >= P.cap) p.xp = 0;
  if (leveled) {
    // hardcore: a level-up mid-fight is a partial heal, not a free reset
    const fight = G.player && G.time - G.lastCombat < CFG.combat.combatLinger;
    refreshPlayerStats(!fight);
    if (fight && G.player.alive) G.player.hp = Math.min(G.player.maxHp, G.player.hp + G.player.maxHp * P.levelUpHeal);
    while (G.levelRewards.length) {
      const L = G.levelRewards.shift(), ms = milestoneAt(L);
      let r = rollRarity('levelUp', L); if (ms && rarIdx(r) < rarIdx(ms)) r = ms;
      if (ms) { p.essence += Math.ceil(L / 5) * 3; dropShards(3 + Math.floor(L / 10), true); ev({ t: 'milestone', level: L, rarity: ms, essence: Math.ceil(L / 5) * 3 }); }
      grantItem(makeItem(pick(CFG.gear.slots), r, L), ms ? 'milestone' : 'level');
      if (P.keystoneLevels.includes(L)) ev({ t: 'keystoneReady', level: L });
      addEssence(1 + Math.floor(L / 20));
      if (L % 10 === 0) addCase('treasure', { l: L, src: 'level' });
    }
    ev({ t: 'levelPower', level: p.level, from: L0, p0: pow0, p1: powerOf(G.player) });

    checkAchievements();
  }
  G.dirty = true;
}
function addGold(n, quiet) {
  if (n > 0) n *= 1 + masteryBonus('scav') + ((G.player && G.player.mods && G.player.mods.goldFind) || 0);
  if (n > 0 && G.profile.settings.fastXp) n *= P.testGoldMult;
  G.profile.gold += Math.round(n); G.dirty = true; if (!quiet) ev({ t: 'gold', amt: Math.round(n) });
}
// --- masteries (RuneScape-style skills, 1-99) ------------------------------------------
function masteryName(key) {
  if (key.startsWith('w:')) { const b = CFG.brawlers[key.slice(2)]; const a = CFG.attacks[key.slice(2)]; return b ? b.name : a ? a.name : key; }
  if (key.startsWith('s:')) { const e = CFG.enemies[key.slice(2)]; return e ? e.name + ' Slayer' : key; }
  return (CFG.mastery.skills[key] || { name: key }).name;
}
function masteryLvl(key) { const m = G.profile && G.profile.mastery; return m ? masteryLevel(m[key] || 0) : 1; }
function masteryBonus(key) { return (masteryLvl(key) - 1) * (key === 'smith' ? CFG.mastery.perLevel.smith : CFG.mastery.perLevel.scav); }
function slayerBonus(type) { return (masteryLvl('s:' + type) - 1) * CFG.mastery.perLevel.slayer; }
function addMastery(key, xp) {
  const p = G.profile; if (!p || xp <= 0) return;
  const gain = Math.round(xp * progressionXpMultiplier(p));
  const before = masteryLevel(p.mastery[key] || 0);
  p.mastery[key] = Math.min(mxpFor(99) * 15, (p.mastery[key] || 0) + gain);
  const after = masteryLevel(p.mastery[key]);
  ev({ t: 'mxp', key, amt: gain });
  if (after > before) {
    ev({ t: 'mastery', key, name: masteryName(key), level: after });
    if (key.startsWith('w:')) refreshPlayerStats(false);
    checkAchievements();
  }
  G.dirty = true;
}
function totalMastery(p) { let n = 0; for (const k in p.mastery) n += masteryLevel(p.mastery[k]); return n; }
// --- loot ------------------------------------------------------------------------------
function highestZone(level) { let zi = 0; CFG.world.zones.forEach((zn, i) => { if (level >= zn.minLevel) zi = i; }); return zi; }
// zone odds + a luck guarantee so long dry streaks always end
function rollLoot(zi, bump) {
  const L = G.profile.luck, Pi = CFG.loot.pity;
  const lt = lootTier(zi), Zs = CFG.loot.zones, idx = lt + (bump ? 1 : 0) + curTier(), over = Math.max(0, idx - (Zs.length - 1));
  const tbl = Object.assign({}, Zs[clamp(idx, 0, Zs.length - 1)]);
  if (over) { tbl.legendary *= 1 + 0.35 * over; tbl.epic *= 1 + 0.15 * over; tbl.common *= Math.pow(0.5, over); tbl.uncommon *= Math.pow(0.8, over); }
  const HW = highWeights(curTier(), lt + (bump ? 1 : 0)); Object.assign(tbl, HW);
  let r = rollRarity(tbl);
  // luck guarantee, also for the endgame rarities once this hunting ground can drop them
  const open = (T) => !HIGH_RAR.includes(T) || HW[T] > 0;
  for (const T of ['divine', 'ancient', 'mythic', 'legendary', 'epic', 'rare']) if (open(T) && (L[T] || 0) + 1 >= Pi[T] && rarIdx(r) < rarIdx(T)) { r = T; ev({ t: 'luck', rarity: T }); break; }
  for (const T of ['rare', 'epic', 'legendary', 'mythic', 'ancient', 'divine']) if (open(T)) L[T] = rarIdx(r) >= rarIdx(T) ? 0 : (L[T] || 0) + 1;
  return r;
}
function addEssence(n) { if (n <= 0) return; n = Math.round(n * (1 + ((G.player && G.player.mods && G.player.mods.gemFind) || 0))); G.profile.essence += n; G.dirty = true; ev({ t: 'essence', amt: n }); }
// --- keystones ---------------------------------------------------------------------------
function inTown() { return G.player && distToTown(G.player.x, G.player.z) < CFG.world.town.r + 4; }
function chooseKeystone(tier, id) {
  const p = G.profile, row = CFG.keystones[tier]; if (!row || !row.find((k) => k.id === id)) return false;
  if (p.level < P.keystoneLevels[tier]) return false;
  if (p.keys[tier] && p.keys[tier] !== id && !inTown()) { toast('Change keystones in town (free)', 'bad'); return false; }
  p.keys[tier] = id; refreshPlayerStats(false); checkAchievements(); G.dirty = true;
  ev({ t: 'keystone', id, name: row.find((k) => k.id === id).name }); return true;
}
// --- waypoints (fast travel) ------------------------------------------------------------------
function travelTo(i) {
  const p = G.profile, w = CFG.world.waypoints[i]; if (!w || !p.waypoints.includes(i) || G.mode !== 'hub') return false;
  const pl = G.player; pl.x = w.x - 3; pl.z = w.z + 2; pl.invulnT = 1; G.zoneIdx = zoneAt(pl.z);
  ev({ t: 'teleport', name: w.name, x: pl.x, z: pl.z }); return true;
}
// --- idle rewards: what you earned while away --------------------------------------------------
function computeOffline(now) {
  if (G.profile && G.profile.vault) return null; // the Vault replaces the old away screen
  const p = G.profile, O = P.offline; if (!p || !p.savedAt) return null;
  const mins = Math.min(O.capHours * 60, (now - p.savedAt) / 60000); if (!(mins >= O.minMinutes)) return null;
  const zi = highestZone(p.level), Z = CFG.world.zones[zi], L = Math.min(p.level, Z.lvl[1] + tierDef(Math.min(p.worldTier || 0, maxTier(p.level))).add);
  const kills = Math.floor(mins * O.killsPerMin);
  const xp = p.level < P.cap ? Math.round(Math.min(kills * killXpAt(L) * 0.6, xpToNext(p.level) * 1.5)) : 0;
  const gold = Math.round(kills * 4.5 * Math.pow(CFG.enemies.goldGrowth, L - 1));
  return { mins, kills, xp, gold, items: Math.min(O.maxItems, Math.floor(mins / O.itemEveryMin)), essence: Math.floor(mins / 12), zone: zi };
}
function claimOffline(o) {
  const p = G.profile; if (!o) return;
  p.gold += o.gold; addEssence(o.essence);
  for (let i = 0; i < o.items; i++) grantItem(makeItem(pick(CFG.gear.slots), rollLoot(o.zone, false), p.level), 'idle');
  if (o.xp > 0) { const keep = p.settings.fastXp; p.settings.fastXp = false; addXp(o.xp, 'idle'); p.settings.fastXp = keep; }
  G.offline = null; G.dirty = true; ev({ t: 'gold', amt: o.gold });
}
function checkAchievements() {
  const p = G.profile;
  checkUnlocks();
  for (const a of ACHIEVEMENTS) {
    if (p.ach[a.id]) continue;
    if (a.check(p)) {
      p.ach[a.id] = Date.now();
      ev({ t: 'achievement', name: a.name });
      if (a.xp > 0) addXp(xpToNext(p.level) * a.xp * 0.5, 'achievement');
      G.dirty = true;
    }
  }
}
function chooseClass(cls) {
  const p = G.profile; if (p.cls || !CFG.classes[cls]) return;
  p.cls = cls; G.pendingClassChoice = false;
  refreshPlayerStats(true);
  ev({ t: 'classChosen', cls });
  checkAchievements(); G.dirty = true;
}
function spendSkillPoint(nodeId) {
  const p = G.profile; if (skillPointsFree(p) <= 0) return false;
  const n = (CFG.trees[p.cls] || []).find((x) => x.id === nodeId); if (!n) return false;
  const r = p.tree[nodeId] || 0; if (r >= n.max) return false;
  p.tree[nodeId] = r + 1; refreshPlayerStats(false); G.dirty = true; return true;
}
function upgradeItem(slot, expected) { return upgradeItemMax(slot, expected && Object.assign({}, expected, { n: 1 })) === 1; }
function equipItem(id) {
  const p = G.profile, i = p.bag.findIndex((x) => x.id === id); if (i < 0) return false;
  const it = p.bag[i], old = p.gear[it.slot];
  if (!CFG.gear.slots.includes(it.slot) || Object.values(p.gear).some(x => x && x.id === id)) return false;
  p.bag = p.bag.filter(x => x.id !== id && (!old || x.id !== old.id)); p.gear[it.slot] = it; if (old) p.bag.push(old);
  G.gearPrompts = G.gearPrompts.filter((x) => x !== id);
  ev({ t: 'equipped', item: it });
  refreshPlayerStats(false); checkAchievements(); G.dirty = true; return true;
}
function unequipItem(slot) {
  const p = G.profile, it = p.gear[slot];
  if (!CFG.gear.slots.includes(slot) || !it) return false;
  if (p.bag.length >= CFG.gear.bagMax) { toast('Make room in your bag before unequipping.', 'bad'); return false; }
  p.bag = p.bag.filter(x => x.id !== it.id); p.bag.push(it); p.gear[slot] = null;
  refreshPlayerStats(false); G.dirty = true; return true;
}
function salvageItem(id) {
  const p = G.profile, i = p.bag.findIndex((x) => x.id === id); if (i < 0) return false;
  if (Object.values(p.gear).some(x => x && x.id === id)) return false;
  const it = p.bag[i]; if (it.locked) { toast('Protected gear cannot be salvaged', 'bad'); return false; } const v = salvageValue(it); p.bag.splice(i, 1); addGold(v); addEssence(salvageEssence(it));
  addMastery('smith', 4 + rarIdx(it.rarity) * 5);
  G.gearPrompts = G.gearPrompts.filter((x) => x !== id); return true;
}
const rerollCost = (it) => Math.round(400 * rarMult(it) * Math.pow(CFG.enemies.goldGrowth, it.ilvl - 1));
function rerollItem(slot) {
  const p = G.profile, it = p.gear[slot]; if (!it || rarIdx(it.rarity) < 1) return false;
  const c = rerollCost(it); if (p.gold < c) return false;
  p.gold -= c; it.aff = rollAffixes(it.rarity); refreshPlayerStats(false); G.dirty = true; ev({ t: 'reroll', name: it.name }); return true;
}
function salvageAllWorse() {
  const p = G.profile; let n = 0;
  for (const it of p.bag.slice()) if (!it.locked && !isBetter(it, p.gear[it.slot]) && rarIdx(it.rarity) < 4) { if (salvageItem(it.id) !== false) n++; }
  if (n) toast(`Salvaged ${n} item${n > 1 ? 's' : ''}`, 'good'); return n;
}
function buyForge(slot) {
  const p = G.profile, o = forgeOffer(slot);
  if (p.gold < o.price) return false;
  if (p.gear[slot] && p.bag.length >= CFG.gear.bagMax) { toast('Make room in your bag before forging. Your equipped gear will be kept.', 'bad'); return false; }
  p.gold -= o.price;
  const it = makeItem(slot, 'rare', o.item.ilvl, o.item.name, { aff: Object.assign({}, o.item.aff), elem: o.item.elem, noun: o.item.noun });
  const old = p.gear[slot]; p.gear[slot] = it;
  if (old) { if (p.bag.length < CFG.gear.bagMax) p.bag.push(old); else { addGold(salvageValue(old)); addEssence(salvageEssence(old)); } }
  refreshPlayerStats(false); checkAchievements(); G.dirty = true;
  ev({ t: 'forged', name: it.name, perk: perkText(it) }); return true;
}
// How good an item is overall: rarity, item level, upgrades, bonuses and perk.
function itemPower(it) {
  if (!it) return 0;
  return rarMult(it) * (it.ilvl + it.up * 1.2) + rarIdx(it.rarity) * 1.5 + (it.aff ? Object.keys(it.aff).length * 1.2 : 0);
}
// Higher rarity always wins, even when an item level is lower; same rarity compares overall power.
function isBetter(a, b) {
  if (!a) return false; if (!b) return true;
  const ra = rarIdx(a.rarity), rb = rarIdx(b.rarity);
  if (ra !== rb) return ra > rb;
  return itemPower(a) > itemPower(b) + 0.01;
}
function bestBagItem(slot) {
  const p = G.profile;
  let best = null;
  for (const it of p.bag) if (it.slot === slot && isBetter(it, p.gear[slot]) && (!best || isBetter(it, best))) best = it;
  return best;
}
// What the player can do per slot right now: swap to a better bag item, or afford an upgrade.
function slotAlerts() {
  const p = G.profile, out = {};
  for (const s of CFG.gear.slots) {
    const it = p.gear[s];
    out[s] = { better: bestBagItem(s), canUpgrade: !!it && maxUpgradePlan(it, 1).n === 1 };
  }
  return out;
}
function grantItem(it, source, context) {
  const p = G.profile;
  // Epic and better loot (and all boss, Rift and Level Road loot) arrives as a case you open with the reel
  const zone = context && context.zone != null ? context.zone : G.zoneIdx || 0;
  const ck = regionBossCase(CASE_SRC[source], (CFG.world.zones[zone] || {}).region);
  if (ck && (rarIdx(it.rarity) >= 3 || CASE_SRC[source] === 'boss' || ck === 'rift' || ck === 'milestone')) {
    addCase(ck, { l: it.ilvl, z: CASE_SRC[source] === 'boss' ? lootTier(zone) : undefined, src: source, f: ck === 'milestone' ? it.rarity : CASE_SRC[source] === 'boss' ? 'rare' : ck === 'rift' ? 'epic' : null, n: ck === 'rift' && G.rift ? G.rift.floor : 0 });
    return;
  }
  if (['monster', 'elite', 'shrine', 'level', 'idle', 'case', 'rift', 'boss', 'milestone'].includes(source)) {
    rollCollectionItem(p, it); recordCollectionItem(p, it);
    G.dirty = true;
  }
  addMastery('scav', 6 + rarIdx(it.rarity) * 10);
  // auto-salvage: quietly turn low-rarity drops that are not upgrades into gold and essence
  const as = p.settings.autoSalvage | 0;
  if (as > 0 && rarIdx(it.rarity) < as && !isBetter(it, p.gear[it.slot]) && source !== 'milestone' && source !== 'case') {
    const g = salvageValue(it), e = salvageEssence(it); addGold(g, true); if (e) p.essence += e;
    const acc = G.salvageAcc || (G.salvageAcc = { n: 0, gold: 0, ess: 0, t: 0 }); acc.n++; acc.gold += g; acc.ess += e; acc.t = 1.2;
    ev({ t: 'autoSalvage', item: it }); return;
  }
  if (p.bag.length >= CFG.gear.bagMax && source !== 'case') {
    // Existing gear is never silently replaced by a later drop.
    // Case rewards may overflow the bag (see openCase), so a case never fails to open.
    addGold(salvageValue(it)); addEssence(salvageEssence(it));
    toast(`Bag full: new drop ${it.name} salvaged`); return;
  }
  p.bag.push(it); G.dirty = true;
  const better = isBetter(it, p.gear[it.slot]);
  if (better) G.gearPrompts.push(it.id);
  ev({ t: 'drop', item: it, better, source }); checkAchievements();
}
// --- jobs -------------------------------------------------------------------
function jobFor(npcId) {
  const def = NPC_DEFS.find((n) => n.id === npcId); if (!def || !def.jobs.length) return null;
  const idx = (G.profile.jobCycle[npcId] || 0) % def.jobs.length;
  return Object.assign({ idx }, def.jobs[idx]);
}
function acceptJob(npcId) {
  const p = G.profile; if (p.job) return false;
  const j = jobFor(npcId); if (!j) return false;
  const atCap = p.level >= P.cap;
  p.job = { npc: npcId, idx: j.idx, title: j.title, type: j.type, target: j.target, count: j.count, progress: 0,
    xp: atCap ? 0 : Math.round(xpToNext(p.level) * CFG.jobs.xpFrac),
    gold: Math.round((CFG.jobs.goldBase + CFG.jobs.goldPerLevel * p.level) * Math.pow(CFG.enemies.goldGrowth, p.level - 1) * (atCap ? 2 : 1)) };
  G.dirty = true; ev({ t: 'jobAccepted', title: j.title }); return true;
}
function progressJob(type, target) {
  const j = G.profile.job; if (!j || j.type !== type || j.target !== target || j.progress >= j.count) return;
  j.progress++; G.dirty = true;
  if (j.progress >= j.count) { if (!G.profile.settings.npcs) { turnInJob(); return; } const npc = NPC_DEFS.find((n) => n.id === j.npc); toast(`Job done! Return to ${npc.name}`, 'good'); ev({ t: 'jobDone' }); }
}
function turnInJob() {
  const p = G.profile, j = p.job; if (!j || j.progress < j.count) return false;
  p.job = null; p.jobCycle[j.npc] = (p.jobCycle[j.npc] || 0) + 1; p.stats.jobs++;
  addGold(j.gold); addXp(j.xp, 'job'); checkAchievements(); G.dirty = true;
  ev({ t: 'jobTurnedIn', title: j.title, xp: j.xp, gold: j.gold }); return true;
}
function abandonJob() { G.profile.job = null; G.dirty = true; }

