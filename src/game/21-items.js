// ---------------------------------------------------------------------
// 3. DATA helpers (progression, gear)
// ---------------------------------------------------------------------
const P = CFG.progression;
const xpToNext = (L) => Math.round(P.xpBase * Math.pow(L, P.xpExp) * Math.pow(P.xpGrowth, L));
// XP for one monster kill at that monster's level: a level needs ~18 kills early, ~76 near the cap
const killXpAt = (L) => xpToNext(L) / (P.killsPerLevel + P.killsPerLevelGrowth * L + P.killsPerLevelSq * L * L);
// milestone chests every 5 levels, forever (legendary every 10 after 65)
const milestoneAt = (L) => P.milestones[L] || (L > 65 && L % 5 === 0 ? (L >= 300 && L % 100 === 0 ? 'divine' : L >= 150 && L % 50 === 0 ? 'ancient' : L >= 100 && L % 10 === 0 ? 'mythic' : L % 10 === 0 ? 'legendary' : 'epic') : null);
const ascTier = (L) => P.ascendAt.filter((x) => L >= x).length;
// visual overlays on the hero (ascended crown/wings/aura/trail, gear glow ring and particles, worn gear pieces); off = clean character
const HERO_OVERLAYS = false;
// RuneScape skill curve (level 99 at 13M), divided by mastery.xpScale
const MXP = (() => { const t = [0, 0]; let pts = 0; for (let l = 1; l < 100; l++) { pts += Math.floor(l + 300 * Math.pow(2, l / 7)); t.push(Math.floor(pts / 4)); } return t; })();
const mxpFor = (L) => MXP[clamp(L, 1, 99)] / CFG.mastery.xpScale;
function masteryLevel(xp) { let L = 1; while (L < 99 && xp >= mxpFor(L + 1)) L++; return L; }
const hpAt = (L) => P.hpBase * Math.pow(P.hpGrowth, L - 1);
const atkAt = (L) => P.atkBase * Math.pow(P.atkGrowth, L - 1);

const ITEM_NAMES = {
  weapon: ['Edge', 'Fang', 'Focus'], helmet: ['Cap', 'Helm', 'Hood'], chest: ['Vest', 'Plate', 'Robe'],
  boots: ['Boots', 'Treads', 'Striders'], accessory: ['Charm', 'Ring', 'Amulet'],
};
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'ancient', 'divine'];
const HIGH_RAR = ['mythic', 'ancient', 'divine'];
// endgame drop weights (out of ~100): need World Tiers or the deepest zones
function highWeights(t, zi) { return { mythic: (zi >= 5 ? 0.25 : 0) + (t >= 1 ? 0.35 * t : 0), ancient: t >= 2 ? 0.08 * (t - 1) : 0, divine: t >= 3 ? 0.012 * (t - 2) : 0 }; }
const rarIdx = (r) => Math.max(0, RARITIES.indexOf(r));
const ELEMENTS = ['fire', 'ice', 'storm', 'poison'];
const RARITY_ADJ = { common: ['Worn', 'Plain'], uncommon: ['Sturdy', 'Honed', 'Trusty'], rare: ['Fine', 'Tempered', 'Keen'], epic: ['Starforged', 'Radiant', 'Runed'], legendary: ['Dragonsoul', 'Sunforged', 'Kingslayer'],
  mythic: ['Bloodmoon', 'Worldbreaker', 'Mythbound'], ancient: ['Primordial', 'Elder', 'Titanforged'], divine: ['Seraphic', 'Godforged', 'Eternal'] };
let itemSeq = 1;
function rollAffixes(rarity) {
  const n = CFG.gear.rarity[rarity].affixes, keys = Object.keys(CFG.affixes).sort(() => Math.random() - 0.5), out = {};
  for (let i = 0; i < n; i++) { const A = CFG.affixes[keys[i]]; out[keys[i]] = Math.round(rand(A.min, A.max) * (1 + 0.1 * rarIdx(rarity)) * 100) / 100; }
  return out;
}
function makeItem(slot, rarity, ilvl, forceName, opts) {
  opts = opts || {};
  const it = { id: 'i' + Date.now().toString(36) + (itemSeq++), slot, rarity, ilvl, up: 0, aff: opts.aff || rollAffixes(rarity) };
  const noun = opts.noun || pick(ITEM_NAMES[slot]);
  if (slot === 'accessory' && rarIdx(rarity) >= 2) {
    it.elem = opts.elem || pick(ELEMENTS);
    it.name = forceName || `${rarIdx(rarity) >= 4 ? pick(RARITY_ADJ[rarity]) + ' ' : ''}${CFG.elements[it.elem].word} ${noun}`;
  } else it.name = forceName || pick(RARITY_ADJ[rarity] || RARITY_ADJ.common) + ' ' + noun;
  return it;
}
function rollRarity(table, level) {
  const w = Object.assign({}, typeof table === 'object' ? table : CFG.loot[table]);
  if (table === 'levelUp') { for (const k in CFG.loot.levelUpShift) w[k] = Math.max(0, (w[k] || 0) + CFG.loot.levelUpShift[k] * (level - 1)); if (level >= 80) w.mythic = (level - 79) * 0.04; if (level >= 150) w.ancient = (level - 149) * 0.01; if (level >= 250) w.divine = (level - 249) * 0.002; }
  let tot = 0; for (const k in w) tot += w[k];
  let r = Math.random() * tot;
  for (const k of RARITIES) { if (!w[k]) continue; r -= w[k]; if (r <= 0) return k; }
  return 'uncommon';
}
function itemStats(it) {
  const out = { atk: 0, hp: 0, speed: 0, superGain: 0 };
  if (!it) return out;
  const rm = (CFG.gear.rarity[it.rarity] || CFG.gear.rarity.common).mult;
  const m = rm * (1 + CFG.gear.upStep * it.up) * Math.pow(1 + CFG.gear.starBonus, Math.floor(it.up / CFG.gear.starEvery)), sh = CFG.gear.statShare[it.slot] || {}, L = Math.max(1, it.ilvl);
  if (sh.atk) out.atk = atkAt(L) * sh.atk * m;
  if (sh.hp) out.hp = hpAt(L) * sh.hp * m;
  if (it.slot === 'boots') out.speed = 0.02 * rm;
  if (it.slot === 'accessory') out.superGain = 0.04 * rm;
  return out;
}
function gearTotals(gear) {
  const t = { atk: 0, hp: 0, speed: 0, superGain: 0, score: 0, aff: { atkSpeed: 0, dmg: 0, hp: 0, move: 0, crit: 0, superGain: 0, critDmg: 0, lifesteal: 0, armor: 0, cdr: 0 } };
  if (!gear) return t;
  for (const s of CFG.gear.slots) {
    const it = gear[s]; if (!it) continue;
    const st = itemStats(it);
    t.atk += st.atk; t.hp += st.hp; t.speed += st.speed; t.superGain += st.superGain;
    t.score += (it.ilvl + it.up * 1.2) * (CFG.gear.rarity[it.rarity] || CFG.gear.rarity.common).mult;
    if (it.aff) for (const k in it.aff) t.aff[k] = (t.aff[k] || 0) + it.aff[k];
  }
  if (CFG.delve) t.sets = delveSetBonus(gear, t.aff); // party-dungeon set bonuses (36b-delve.js)
  return t;
}
const rarMult = (it) => (CFG.gear.rarity[it.rarity] || CFG.gear.rarity.common).mult;
const upgradeCost = (it) => Math.round(CFG.gear.upCostBase * Math.pow(it.up + 1, CFG.gear.upCostExp) * rarMult(it) * Math.pow(CFG.gear.upCostGrowth, it.ilvl - 1) * (1 - masteryBonus('smith')));
const upgradeEssence = (it) => it.up + 1 >= CFG.gear.essenceFrom ? (it.up + 2 - CFG.gear.essenceFrom) * (1 + rarIdx(it.rarity)) : 0;
// how many upgrades in a row you can afford right now (for the Max button)
function maxUpgradePlan(it, cap) {
  const p = G.profile; let g = p.gold, e = p.essence, n = 0, gold = 0, ess = 0; const t = Object.assign({}, it), materials = [], states = [];
  const pool = mergeCandidates(it, p);
  while (n < (cap || 500) && t.up < CFG.gear.maxUp) {
    const c = upgradeCost(t), x = upgradeEssence(t), count = mergeRequired(t);
    if (g < c || e < x || pool.length < count) break;
    const chosen = pool.splice(0, count); materials.push(...chosen.map(m => m.id)); states.push(...chosen.map(mergeFingerprint)); g -= c; e -= x; gold += c; ess += x; t.up++; n++;
  }
  return { n, gold, ess, materials, targetId: it.id, targetUp: it.up, targetState: mergeFingerprint(it), materialsState: JSON.stringify(states) };
}
function upgradeItemMax(slot, expected) {
  const p = G.profile, it = p.gear[slot]; if (!it) return 0;
  const plan = maxUpgradePlan(it, expected && expected.n);
  if (!expected || plan.targetId !== expected.targetId || plan.targetUp !== expected.targetUp || plan.targetState !== expected.targetState || plan.materialsState !== expected.materialsState || plan.n !== expected.n || plan.gold !== expected.gold || plan.ess !== expected.ess || !plan.n) return 0;
  const ids = new Set(plan.materials); p.bag = p.bag.filter(m => !ids.has(m.id)); G.gearPrompts = G.gearPrompts.filter(id => !ids.has(id));
  p.gold -= plan.gold; p.essence -= plan.ess;
  for (let i = 0; i < plan.n; i++) { it.up++; p.stats.upgrades++; addMastery('smith', 12 + it.up * 6 + rarIdx(it.rarity) * 8); }
  refreshPlayerStats(false); checkAchievements(); G.dirty = true; ev({ t: 'upgrade', name: it.name, up: it.up, n: plan.n });
  return plan.n;
}
// Deterministic, conservative fodder selection. Favorite gear and all equipped IDs
// are excluded, even if a malformed/imported bag contains an equipped duplicate.
function mergeRequired(it) { return 1 + Math.min(3, Math.floor(it.up / 10)); }
function mergeFingerprint(it) { return JSON.stringify([it.id, it.slot, it.rarity, it.ilvl, it.up, it.aff || {}, it.elem || '', it.name, !!it.locked]); }
function mergeCandidates(it, p = G.profile) {
  const equipped = new Set(Object.values(p.gear).filter(Boolean).map(m => m.id)), seen = new Set();
  return p.bag.filter(m => {
    if (!m || !m.id || seen.has(m.id) || equipped.has(m.id) || m.locked || m.slot !== it.slot || !isBetter(it, m)) return false;
    seen.add(m.id); return true;
  }).sort((a, b) => rarIdx(a.rarity) - rarIdx(b.rarity) || itemPower(a) - itemPower(b) || a.id.localeCompare(b.id));
}
function mergeCostHTML(it) { const have = mergeCandidates(it).length, need = mergeRequired(it); return `<span class="mergeCost ${have >= need ? '' : 'missing'}">${have}/${need} ${SLOT_LABEL[it.slot].toLowerCase()} materials</span>`; }
const salvageValue = (it) => Math.round((10 * rarMult(it) + it.up * 6) * Math.pow(CFG.enemies.goldGrowth, it.ilvl - 1));
const salvageEssence = (it) => (CFG.gear.salvageEssence[it.rarity] || 0) + (rarIdx(it.rarity) >= 2 ? Math.floor(it.ilvl / 20) + Math.floor(it.up / 3) : 0);
function itemStyle(it) { const noun = it.name.split(' ').pop(); return Math.max(0, ITEM_NAMES[it.slot].indexOf(noun)); }
function itemElement(it) {
  if (!it || it.slot !== 'accessory' || rarIdx(it.rarity) < 2) return null;
  if (it.elem) return it.elem;
  let h = 0; for (const ch of it.id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ELEMENTS[Math.abs(h) % ELEMENTS.length];
}
function itemPerk(it) {
  if (!it || rarIdx(it.rarity) < 2) return null;
  const d = CFG.perks[it.slot]; return { id: d.id, name: d.name, tier: it.rarity, val: d[it.rarity], elem: itemElement(it) };
}
function perkText(it) {
  const k = itemPerk(it); if (!k) return '';
  const d = CFG.perks[it.slot], hi = rarIdx(it.rarity) >= 3;
  switch (k.id) {
    case 'twin': return `${k.name}: every attack fires one extra projectile at ${Math.round(k.val * 100)}% damage`;
    case 'focus': return `${k.name}: +1 ammo bar${hi ? ` and ${Math.round(d.epicReload * 100)}% faster reload` : ''}`;
    case 'retaliate': return `${k.name}: getting hit releases a shockwave (every ${k.val}s)`;
    case 'dashStrike': return `${k.name}: dashing through enemies hits them for ${Math.round(k.val * 100)}% damage`;
    case 'element': { const E = CFG.elements[k.elem]; return `Special · ${E.name}: ${E.desc}${k.val > 1 ? ` (+${Math.round((k.val - 1) * 100)}% power)` : ''}`; }
  }
  return '';
}
function affixText(it) {
  if (!it || !it.aff) return '';
  return Object.keys(it.aff).map((k) => `+${Math.round(it.aff[k] * 100)}% ${CFG.affixes[k].name}`).join(' · ');
}
function gearPerks(gear) {
  const out = { twin: 0, ammo: 0, reload: 0, retaliate: 0, dashStrike: 0, chain: 0, special: null, specialPow: 1 };
  if (!gear) return out;
  for (const s of CFG.gear.slots) {
    const k = itemPerk(gear[s]); if (!k) continue;
    if (k.id === 'twin') out.twin = k.val;
    else if (k.id === 'focus') { out.ammo = 1; if (rarIdx(k.tier) >= 3) out.reload = CFG.perks.helmet.epicReload; }
    else if (k.id === 'retaliate') out.retaliate = k.val;
    else if (k.id === 'dashStrike') out.dashStrike = k.val;
    else if (k.id === 'element') { out.special = k.elem; out.specialPow = k.val; }
  }
  return out;
}
const FORGE_AFF = { weapon: { dmg: 0.06 }, helmet: { hp: 0.07 }, chest: { hp: 0.07 }, boots: { move: 0.04 }, accessory: { atkSpeed: 0.06 } };
const forgeRarity = (level) => (CFG.forge.rarityAt.find(([L]) => level >= L) || [1, 'rare'])[1];
function forgeOffer(slot) {
  const p = G.profile, cur = p.gear[slot];
  const style = (itemStyle(cur) + 1) % 3;
  const price = Math.round(CFG.forge.base * Math.pow(CFG.forge.growth, p.level - 1) * (slot === 'weapon' ? CFG.forge.weaponMult : 1) * (CFG.gear.rarity[forgeRarity(p.level)].mult / CFG.gear.rarity.rare.mult));
  const item = { slot, rarity: forgeRarity(p.level), ilvl: p.level, up: 0, aff: FORGE_AFF[slot], noun: ITEM_NAMES[slot][style] };
  if (slot === 'accessory') {
    const ce = itemElement(cur);
    item.elem = ELEMENTS[(ce ? ELEMENTS.indexOf(ce) + 1 : 0) % ELEMENTS.length];
    item.name = `${CFG.elements[item.elem].word} ${item.noun}`;
  } else item.name = 'Forged ' + item.noun;
  return { slot, style, price, item };
}
function emptyMods() { return { hp: 0, dmg: 0, reload: 0, superPow: 0, superGain: 0, speed: 0, skillCd: 0, aoe: 0 }; }

const NPC_DEFS = [
  { id: 'ida', name: 'Farmer Ida', role: 'job', x: -7, z: -50, body: 0xe0a64a, accent: 0x6d4b2a, minLevel: 1,
    jobs: [
      { title: 'Hare Trouble', type: 'kill', target: 'thistlehare', count: 8, text: 'Thistle-hares are shredding my turnips with their quills! Clear out eight of them in the meadow.' },
      { title: 'Glowberry Harvest', type: 'collect', target: 'berry', count: 5, text: 'Pick five glowberries for me. They shine pink in the grass.' },
      { title: 'Hornet Hives', type: 'kill', target: 'hornet', count: 20, text: 'The sun-drunk hornets by the Hornet Hives are waking up. Swat twenty of them.' },
    ] },
  { id: 'bo', name: 'Scout Bo', role: 'job', x: 7, z: -50, body: 0x4f8f6a, accent: 0x2b4d39, minLevel: 10,
    jobs: [
      { title: 'Truffle Thieves', type: 'kill', target: 'truffleboar', count: 12, text: 'Armored boars are tearing up the Funky Forest for truffles. Drive off twelve of them.' },
      { title: 'Spore Patrol', type: 'kill', target: 'myconid', count: 25, text: 'Myconids keep bursting into dizzy spores around the Glowcap Ring. Pop twenty-five.' },
    ] },
  { id: 'mira', name: 'Sage Mira', role: 'job', x: -10, z: -61, body: 0x7fb6e8, accent: 0x2d4f7a, minLevel: 30,
    jobs: [
      { title: 'Goat Problems', type: 'kill', target: 'craggoat', count: 15, text: 'Crag-goats keep knocking climbers off the Feisty Foothills. Stop fifteen of them.' },
      { title: 'Harpy Roost', type: 'kill', target: 'dustharpy', count: 30, text: 'Dust-harpies drop stones on anyone on the gravel. Thirty of them, and the climb is safe.' },
    ] },
  { id: 'vex', name: 'Ranger Vex', role: 'job', x: -13, z: -53, body: 0xb5512e, accent: 0x3a1f16, minLevel: 65,
    jobs: [
      { title: 'Bog Cleanup', type: 'kill', target: 'sulfurslime', count: 18, text: 'Sulfur-slimes eat armor in the Brimstone Bogs. Melt eighteen of them before they melt you.' },
      { title: 'Hound Hunt', type: 'kill', target: 'magmahound', count: 35, text: 'Magma-hounds track every traveller on the Slaggy Terraces. Watch the red line, then strike. Thirty-five of them.' },
    ] },
  { id: 'lumi', name: 'Oracle Lumi', role: 'job', x: 13, z: -53, body: 0x6b4fd1, accent: 0x2a1f5a, minLevel: 85,
    jobs: [
      { title: 'Leech Plague', type: 'kill', target: 'manaleech', count: 20, text: 'Mana-leeches are draining every mage in the Sapphire Coals. Squash twenty.' },
      { title: 'Drone Purge', type: 'kill', target: 'geodrone', count: 40, text: 'Geometry-drones slice anything alive on the Fractural Ley. Forty of them should restore some chaos.' },
    ] },
  { id: 'garo', name: 'Smith Garo', role: 'smith', x: 10, z: -61, body: 0x8a5a3c, accent: 0x3a2a20, minLevel: 1, jobs: [] },
  { id: 'rho', name: 'Arena Master Rho', role: 'arena', x: 0, z: -68, body: 0xc0392b, accent: 0xf1c40f, minLevel: 1, jobs: [] },
];
const PORTAL = { x: 0, z: -73 };

const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'First Blood', desc: 'Defeat your first monster', xp: 0.5, check: (p) => p.stats.kills >= 1 },
  { id: 'first_job', name: 'Helping Hand', desc: 'Finish a job', xp: 0.5, check: (p) => p.stats.jobs >= 1 },
  { id: 'slime_25', name: 'Hare Hunter', desc: 'Defeat 25 thistle-hares', xp: 0.8, check: (p) => p.stats.slimes >= 25 || ((p.stats.killsBy || {}).thistlehare || 0) >= 25 },
  { id: 'jobs_10', name: 'Town Hero', desc: 'Finish 10 jobs', xp: 1, check: (p) => p.stats.jobs >= 10 },
  { id: 'class', name: 'Recruiter', desc: 'Unlock a second brawler', xp: 0.6, check: (p) => p.unlocked.attacks.length >= 1 },
  { id: 'squad', name: 'Full Squad', desc: 'Unlock 8 brawlers', xp: 1, check: (p) => p.unlocked.attacks.length >= 7 },
  { id: 'badgeGold', name: 'Gold Standard', desc: 'Earn a Gold badge with any brawler', xp: 1, check: (p) => Object.keys(p.mastery).some((k) => k.startsWith('w:') && masteryLevel(p.mastery[k]) >= 50) },
  { id: 'upgrade', name: 'Sharpened', desc: 'Upgrade an item', xp: 0.4, check: (p) => p.stats.upgrades >= 1 },
  { id: 'boss', name: 'Giant Slayer', desc: 'Help defeat a world boss', xp: 1, check: (p) => p.stats.bosses >= 1 },
  { id: 'arena', name: 'Arena Debut', desc: 'Play a Showdown match', xp: 0.5, check: (p) => p.stats.matches >= 1 },
  { id: 'arena_win', name: 'Last One Standing', desc: 'Win a Showdown match', xp: 1, check: (p) => p.stats.wins >= 1 },
  { id: 'zone2', name: 'Into the Woods', desc: 'Enter the Funky Forest', xp: 0.5, check: (p) => p.stats.zone >= zoneIndex('Funky Forest') },
  { id: 'zone3', name: 'Peak Climber', desc: 'Enter Frost Peaks', xp: 0.7, check: (p) => p.stats.zone >= zoneIndex('Frost Peaks') },
  { id: 'shrine', name: 'Shrine Breaker', desc: 'Complete a challenge shrine', xp: 0.6, check: (p) => (p.stats.shrines || 0) >= 1 },
  { id: 'shrine6', name: 'Champion of Shrines', desc: 'Complete 6 challenge shrines', xp: 1, check: (p) => (p.stats.shrines || 0) >= 6 },
  { id: 'legend', name: 'Living Legend', desc: 'Wear a Legendary item', xp: 0.8, check: (p) => CFG.gear.slots.some((s) => p.gear[s] && rarIdx(p.gear[s].rarity) >= 4) },
  { id: 'mythic', name: 'Myth Made Real', desc: 'Wear a Mythic item', xp: 0.8, check: (p) => CFG.gear.slots.some((s) => p.gear[s] && rarIdx(p.gear[s].rarity) >= 5) },
  { id: 'ancient', name: 'Relic Hunter', desc: 'Wear an Ancient item', xp: 1, check: (p) => CFG.gear.slots.some((s) => p.gear[s] && rarIdx(p.gear[s].rarity) >= 6) },
  { id: 'divine', name: 'Touched by Gods', desc: 'Wear a Divine item', xp: 1, check: (p) => CFG.gear.slots.some((s) => p.gear[s] && rarIdx(p.gear[s].rarity) >= 7) },
  { id: 'element', name: 'Elemental', desc: 'Equip an accessory with a special attack', xp: 0.5, check: (p) => !!itemElement(p.gear.accessory) },
  { id: 'lvl15', name: 'Seasoned', desc: 'Reach level 15', xp: 0.5, check: (p) => p.level >= 15 },
  { id: 'zone4', name: 'Into the Fire', desc: 'Enter the Ember Wastes', xp: 0.7, check: (p) => p.stats.zone >= zoneIndex('Ember Wastes') },
  { id: 'zone5', name: 'Starwalker', desc: 'Enter the Starfall Ruins', xp: 0.8, check: (p) => p.stats.zone >= zoneIndex('Starfall Ruins') },
  { id: 'elite10', name: 'Elite Hunter', desc: 'Defeat 10 elite monsters', xp: 1, check: (p) => (p.stats.elites || 0) >= 10 },
  { id: 'kills1k', name: 'Thousand Cuts', desc: 'Defeat 1,000 monsters', xp: 1, check: (p) => p.stats.kills >= 1000 },
  { id: 'streak50', name: 'Unstoppable', desc: 'Reach a 50 kill streak', xp: 0.8, check: (p) => (p.stats.bestStreak || 0) >= 50 },
  { id: 'up15', name: 'Masterwork', desc: 'Upgrade an item to +15', xp: 1, check: (p) => CFG.gear.slots.some((s) => p.gear[s] && p.gear[s].up >= 15) },
  { id: 'keystone', name: 'Pathfinder', desc: 'Choose your first keystone', xp: 0.5, check: (p) => (p.keys || []).some((k) => k) },
  { id: 'm50', name: 'Dedicated', desc: 'Reach level 50 in any mastery', xp: 1, check: (p) => Object.values(p.mastery || {}).some((x) => masteryLevel(x) >= 50) },
  { id: 'm99', name: 'Skillcape', desc: 'Reach level 99 in any mastery', xp: 0, check: (p) => Object.values(p.mastery || {}).some((x) => masteryLevel(x) >= 99) },
  { id: 'lvl65', name: 'Ascendant', desc: 'Reach level 65', xp: 0.5, check: (p) => p.level >= 65 },
  { id: 'zone6', name: 'Abyss Diver', desc: 'Enter the Abyssal Depths', xp: 0.8, check: (p) => p.stats.zone >= zoneIndex('Abyssal Depths') },
  { id: 'zone7', name: 'Skyward', desc: 'Enter the Celestial Spire', xp: 0.8, check: (p) => p.stats.zone >= zoneIndex('Celestial Spire') },
  { id: 'lvl100', name: 'Ascended', desc: 'Reach level 100 and awaken your aura', xp: 0.5, check: (p) => p.level >= 100 },
  { id: 'lvl150', name: 'Winged', desc: 'Reach level 150 and grow wings', xp: 0.5, check: (p) => p.level >= 150 },
  { id: 'lvl200', name: 'Crowned', desc: 'Reach level 200 and claim the crown', xp: 0.5, check: (p) => p.level >= 200 },
  { id: 'tierHard', name: 'Hard Mode', desc: 'Play on World Tier Hard', xp: 0.5, check: (p) => (p.records.bestTier || 0) >= 1 },
  { id: 'tierNm', name: 'Nightmare', desc: 'Play on World Tier Nightmare', xp: 0.6, check: (p) => (p.records.bestTier || 0) >= 2 },
  { id: 'tierT1', name: 'Tormented', desc: 'Play on Torment I', xp: 0.8, check: (p) => (p.records.bestTier || 0) >= 3 },
  { id: 'rift10', name: 'Rift Walker', desc: 'Clear Rift floor 10', xp: 0.6, check: (p) => (p.records.bestRift || 0) >= 10 },
  { id: 'rift25', name: 'Rift Breaker', desc: 'Clear Rift floor 25', xp: 0.8, check: (p) => (p.records.bestRift || 0) >= 25 },
  { id: 'rift50', name: 'Rift Lord', desc: 'Clear Rift floor 50', xp: 1, check: (p) => (p.records.bestRift || 0) >= 50 },
  { id: 'case10', name: 'Looter', desc: 'Open 10 treasure chests', xp: 0.5, check: (p) => (p.stats.cases || 0) >= 10 },
  { id: 'case100', name: 'Treasure Hunter', desc: 'Open 100 treasure chests', xp: 1, check: (p) => (p.stats.cases || 0) >= 100 },
  { id: 'exped10', name: 'Expedition Leader', desc: 'Bring back 10 expeditions', xp: 0.8, check: (p) => (p.stats.expeds || 0) >= 10 },
  { id: 'kills10k', name: 'Ten Thousand', desc: 'Defeat 10,000 monsters', xp: 1, check: (p) => p.stats.kills >= 10000 },
  { id: 'secret', name: 'Secret Seeker', desc: 'Find a hidden secret location', xp: 0.6, check: (p) => Object.keys(p.secrets || {}).length >= 1 },
];
const BOT_NAMES = ['Kaito', 'Mira', 'Ren', 'Sora', 'Yuki', 'Haru', 'Nova', 'Leo', 'Aiko', 'Taro', 'Rin', 'Zed', 'Kiko', 'Juno', 'Hiro', 'Mei', 'Dax', 'Lumi', 'Riku', 'Ayla', 'Toma', 'Suki', 'Vex', 'Nori'];
const BOT_COLORS = [0xe76f51, 0x2a9d8f, 0xe9c46a, 0x8ab17d, 0xf4a261, 0x6d597a, 0x4d908e, 0xb56576, 0x277da1, 0xf94144, 0x90be6d, 0x577590];

