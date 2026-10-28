// --- Crafting: materials, Garo's crafted sets, Masterwork upgrades and dungeon-only heroes and relics -------------
// Every biome has three materials: ore (Mining), a monster part (kills; elites and bosses drop more) and a core
// (dungeon chests only). Titan Souls come from world bosses. Garo crafts a five-piece set per biome from them
// (3 and 5 piece bonuses) and sells permanent Masterwork upgrades whose later ranks need every biome's materials.
// Each biome's dungeons also hide one hero you cannot recruit any other way (collect their oaths) and one relic.
CFG.craft = {
  biomes: [
    { ore: 'copper', oreN: 'Copper Ore', part: 'thornhide', partN: 'Thornhide', core: 'verdant', coreN: 'Verdant Core', set: 'Thornwarden', color: 0x7fc65a,
      hero: 'fenwick', relic: { name: 'Heart of the Hollow Oak', slot: 'accessory', rarity: 'legendary', aff: { hp: 0.18, lifesteal: 0.07, armor: 0.1 } } },
    { ore: 'iron', oreN: 'Iron Ore', part: 'frostfang', partN: 'Frost Fang', core: 'glacial', coreN: 'Glacial Core', set: 'Frostbound', color: 0x9fd8ff,
      hero: 'lysandra', relic: { name: 'Avalanche Crown', slot: 'helmet', rarity: 'legendary', aff: { armor: 0.11, hp: 0.18, critDmg: 0.35 } } },
    { ore: 'obsidian', oreN: 'Obsidian Shard', part: 'emberscale', partN: 'Ember Scale', core: 'magma', coreN: 'Magma Core', set: 'Cinderforged', color: 0xff7a3a,
      hero: 'kallix', relic: { name: 'Brand of the First Fire', slot: 'weapon', rarity: 'mythic', aff: { dmg: 0.16, critDmg: 0.4, atkSpeed: 0.14 } } },
    { ore: 'mithril', oreN: 'Mithril Ore', part: 'arcdust', partN: 'Arcane Dust', core: 'void', coreN: 'Void Core', set: 'Runebound', color: 0xc08aff,
      hero: 'vell', relic: { name: 'Ley-Woven Mantle', slot: 'chest', rarity: 'mythic', aff: { cdr: 0.15, superGain: 0.18, dmg: 0.14 } } },
    { ore: 'abyssal', oreN: 'Abyssal Ore', part: 'pearl', partN: 'Abyssal Pearl', core: 'tidal', coreN: 'Tidal Core', set: 'Deepcaller', color: 0x3fe0d0,
      hero: 'ione', relic: { name: 'Tidewalker Striders', slot: 'boots', rarity: 'ancient', aff: { move: 0.09, atkSpeed: 0.15, lifesteal: 0.07 } } },
    { ore: 'starsteel', oreN: 'Starsteel Ore', part: 'starfeather', partN: 'Star Feather', core: 'solar', coreN: 'Solar Core', set: 'Starward', color: 0xfff07a,
      hero: 'aurvan', relic: { name: 'Halo of the First Dawn', slot: 'accessory', rarity: 'ancient', aff: { crit: 0.12, critDmg: 0.45, dmg: 0.16 } } },
  ],
  titan: { id: 'titansoul', name: 'Titan Soul', color: 0xff5d8f },
  // Rune Shards: the semi-rare resource every Enchant reroll and boost costs. Chance per normal kill / den kill / elite kill, per world boss, plus dungeon chests by variant.
  rune: { id: 'runeshard', name: 'Rune Shard', color: 0xb06bff, kill: 0.025, den: 0.05, elite: 0.4, boss: [3, 5], chest: [1, 1, 2, 3] },
  // monster parts: chance per normal kill, guaranteed range for elites (guardians double), per world-boss kill
  part: { chance: 0.07, den: 0.1, elite: [1, 3], boss: [6, 10] },
  // dungeon chests: cores by variant (Caves, Warrens, Sanctum, Trial) + 1 per 4 key tiers; first clear +2
  core: { variant: [1, 1, 2, 3], perTiers: 4, first: 2, parts: [2, 5] },
  // dungeon-only heroes: oaths (code: sigil) per chest (variant chances, + per key tier); relics: chance per chest with a pity count
  sigil: { need: 6, chance: [0.14, 0.14, 0.3, 0.45], perTier: 0.02 },
  relic: { chance: 0.03, sanctum: 2, perTier: 0.005, pity: 50 },
  // crafted sets: rarity per biome, item level = the biome's top level (or yours, if higher) + 2
  setRarity: ['epic', 'epic', 'legendary', 'legendary', 'mythic', 'ancient'],
  setCost: { ore: [50, 1.35], part: [18, 1.35], core: [2, 1], gold: 6 },
  setBonus: { 3: { dmg: 0.05, hp: 0.05 }, 5: { dmg: 0.08, hp: 0.1 }, perBiome: 0.25 },
  // Masterwork: permanent hero upgrades. Rank r uses biome floor(r * 6 / max); the last two ranks also need Titan Souls.
  upgrades: {
    whetstone: { name: 'Whetstone', d: (v) => `+${pct(v)} damage`, max: 12, per: 0.03, k: 'dmg' },
    plating: { name: 'Reinforced Plating', d: (v) => `+${pct(v)} max HP`, max: 12, per: 0.04, k: 'hp' },
    bracers: { name: 'Swift Bracers', d: (v) => `+${pct(v)} attack speed`, max: 8, per: 0.02, k: 'atkSpeed' },
    treads: { name: 'Trail Treads', d: (v) => `+${pct(v)} move speed`, max: 6, per: 0.015, k: 'move' },
    satchel: { name: 'Prospector’s Satchel', d: (v) => `+${pct(v)} ore and monster parts`, max: 10, per: 0.1, k: 'find' },
    purse: { name: 'Merchant’s Purse', d: (v) => `+${pct(v)} gold`, max: 10, per: 0.05, k: 'gold' },
  },
};
const CB = CFG.craft.biomes;
// every material by id -> { name, biome, kind, color }
const MATS = (() => { const o = {}; CB.forEach((b, i) => { o[b.ore] = { name: b.oreN, biome: i, kind: 'ore', color: b.color }; o[b.part] = { name: b.partN, biome: i, kind: 'part', color: b.color }; o[b.core] = { name: b.coreN, biome: i, kind: 'core', color: b.color }; });
  o[CFG.craft.titan.id] = { name: CFG.craft.titan.name, biome: -1, kind: 'soul', color: CFG.craft.titan.color };
  o[CFG.craft.rune.id] = { name: CFG.craft.rune.name, biome: -1, kind: 'rune', color: CFG.craft.rune.color };
  for (const d of CFG.delve.dungeons) if (d.gem) o[d.gem.id] = { name: d.gem.name, biome: d.biome, kind: 'gem', color: d.gem.color, dungeon: d.id }; // rare veins in Dungeon mode
  return o; })();
// dungeon-only heroes: their Level Road unlock is replaced by sigils from that biome's dungeons
CB.forEach((b, i) => { if (CFG.attacks[b.hero]) CFG.attacks[b.hero].unlock = { sigils: i }; });
function craftState(p) {
  p = p || G.profile; const c = p.craft && typeof p.craft === 'object' ? p.craft : (p.craft = {});
  for (const k of ['mats', 'upg', 'sig', 'pity', 'relics']) if (!c[k] || typeof c[k] !== 'object' || Array.isArray(c[k])) c[k] = {};
  return c;
}
const matCount = (id, p) => craftState(p).mats[id] | 0;
const upgRank = (id, p) => Math.min(CFG.craft.upgrades[id].max, craftState(p).upg[id] | 0);
// summed Masterwork effects: { dmg, hp, atkSpeed, move, find, gold }
function craftBonuses(p) { const o = { dmg: 0, hp: 0, atkSpeed: 0, move: 0, find: 0, gold: 0 }; if (!p) return o;
  for (const id in CFG.craft.upgrades) { const U = CFG.craft.upgrades[id]; o[U.k] += U.per * upgRank(id, p); } return o; }
const zoneBiome = (zi) => ((CFG.world.zones[zi] || {}).biome) | 0;
// add materials; `quiet` skips the pickup line (batched callers report themselves)
function addMats(list, quiet) {
  const c = craftState(), got = [];
  for (const [id, n0] of list) { const n = Math.round(n0); if (!MATS[id] || n <= 0) continue; c.mats[id] = (c.mats[id] | 0) + n; got.push([id, n]); }
  if (got.length) { G.dirty = true; if (!quiet) ev({ t: 'mats', got }); }
  return got;
}
const findMul = () => 1 + craftBonuses(G.profile).find;
// kills: the area's monster part (normal kills sometimes, elites always)
function craftKillDrop(e) {
  if (!e || e.zone == null || e.rift) return;
  { const R = CFG.craft.rune; if (Math.random() < (e.elite ? R.elite : e.den != null ? R.den : R.kill) * findMul()) addMats([[R.id, 1]]); }
  const P2 = CFG.craft.part, b = CB[zoneBiome(e.zone)]; if (!b) return;
  let n = 0;
  if (e.elite) n = randInt(P2.elite[0], P2.elite[1]) * (e.guardian ? 2 : 1);
  else if (Math.random() < (e.den != null ? P2.den : P2.chance) * findMul()) n = 1;
  if (n) addMats([[b.part, n * (e.elite ? findMul() : 1)]]);
}
// world boss: parts and a core of its biome, ore, and a Titan Soul
function craftBossDrop(zone) {
  const b = CB[zoneBiome(zone)], P2 = CFG.craft.part; if (!b) return [];
  return addMats([[b.part, randInt(P2.boss[0], P2.boss[1]) * findMul()], [b.core, 1], [b.ore, 10 * findMul()], [CFG.craft.titan.id, 1], [CFG.craft.rune.id, randInt(CFG.craft.rune.boss[0], CFG.craft.rune.boss[1])]]);
}
// mining: the vein's ore as a crafting material (alongside the pickaxe ore counter)
function craftMineDrop(q, ore) { const b = CB[zoneBiome(q.zone)]; if (b) addMats([[b.ore, ore * findMul()]], true); }
// dungeon chest: cores and parts, then the biome's hero sigil and relic rolls
function craftDungeonLoot(D, first) {
  const C = CFG.craft, b = CB[zoneBiome(D.zone)], c = craftState(), p = G.profile; if (!b) return {};
  const vi = Math.max(0, CFG.dungeon.variants.indexOf(D.variant)), t = D.key ? D.key.t : 0;
  const cores = (C.core.variant[vi] || 1) + Math.floor(t / C.core.perTiers) + (first ? C.core.first : 0);
  const out = { biome: zoneBiome(D.zone), mats: addMats([[b.core, cores], [b.part, randInt(C.core.parts[0], C.core.parts[1]) * findMul()], [C.rune.id, (C.rune.chest[vi] || 1) + (first ? 1 : 0)]], true) };
  // hero sigil (until the hero is yours)
  const hid = b.hero, owned = p.unlocked.attacks.includes(hid) || hid === STARTER_HERO;
  if (CFG.brawlers[hid] && !owned && (c.sig[hid] | 0) < C.sigil.need && Math.random() < (C.sigil.chance[vi] || 0.14) + C.sigil.perTier * t) {
    c.sig[hid] = (c.sig[hid] | 0) + 1; out.sigil = { id: hid, n: c.sig[hid], need: C.sigil.need };
    if (c.sig[hid] >= C.sigil.need) checkUnlocks();
  }
  // relic: rare, doubled in the Sanctum, guaranteed after `pity` chests without one in this biome
  const key = 'b' + out.biome; c.pity[key] = (c.pity[key] | 0) + 1;
  const chance = (C.relic.chance + C.relic.perTier * t) * (vi === 2 ? C.relic.sanctum : 1);
  if (Math.random() < chance || c.pity[key] >= C.relic.pity) { c.pity[key] = 0; out.relic = makeRelic(out.biome, Math.max(D.poi.lvl, p.level) + CFG.dungeon.chest.ilvlAdd + t); }
  G.dirty = true; return out;
}
function makeRelic(bi, ilvl) {
  const R = CB[bi].relic, it = makeItem(R.slot, R.rarity, ilvl, R.name, { aff: Object.assign({}, R.aff) });
  it.relic = bi; const c = craftState(); c.relics[bi] = (c.relics[bi] | 0) + 1;
  giveItem(it); ev({ t: 'relic', name: it.name, n: c.relics[bi] }); return it;
}
// --- secret weapons (Casper, 27 Oct: more items): one per biome, forged at Garo's from chest ore, the biome's core and
// Titan Souls. Each is the weapon of that biome's world boss story; fixed affixes a little above its relic, a picture of
// its own (assets/ui/secret/<biome>.webp, Hugging Face batch hf-art-c1). Not sold, not dropped: forged only.
CFG.craft.secret = {
  rarity: ['mythic', 'mythic', 'mythic', 'ancient', 'ancient', 'divine'],
  cost: { ore: [60, 1.35], core: [6, 2], soul: [1, 0.5], gold: 4 }, // ore n × growth^biome · core a + b·biome · souls 1 + biome/2
  weapons: [
    { name: 'Thornheart Blade', say: "Grown from the Ancient Golem's heartwood; the vines still drink.", aff: { dmg: 0.14, lifesteal: 0.08, hp: 0.14, atkSpeed: 0.1 } },
    { name: 'Rimecleaver', say: "Cut from the Frost Colossus's tusk; it never thaws.", aff: { dmg: 0.15, critDmg: 0.38, armor: 0.08, crit: 0.07 } },
    { name: 'Magmaheart Maul', say: "The Magma Titan's cooling heart, bound to an iron haft.", aff: { dmg: 0.17, critDmg: 0.42, atkSpeed: 0.12, crit: 0.08 } },
    { name: 'Voidwhisper Sceptre', say: 'A shard of the Void Colossus that hums the names of lost things.', aff: { dmg: 0.16, cdr: 0.15, superGain: 0.18, crit: 0.08 } },
    { name: "Leviathan's Trident", say: 'The Abyssal Leviathan wore it as a crown of spines.', aff: { dmg: 0.17, atkSpeed: 0.15, lifesteal: 0.08, move: 0.07 } },
    { name: 'Dawnbringer', say: "Forged in the Celestial Colossus's first light; it burns brighter on every crit.", aff: { dmg: 0.19, crit: 0.12, critDmg: 0.48, superGain: 0.15 } },
  ],
};
function secretCost(bi) {
  const S = CFG.craft.secret.cost, b = CB[bi];
  return { mats: [[b.ore, Math.round(S.ore[0] * Math.pow(S.ore[1], bi))], [b.core, S.core[0] + S.core[1] * bi], [CFG.craft.titan.id, Math.floor(S.soul[0] + S.soul[1] * bi)]],
    gold: Math.round(CFG.forge.base * Math.pow(CFG.forge.growth, Math.max(biomeTop(bi), G.profile.level) - 1) * S.gold) };
}
function makeSecretWeapon(bi, ilvl) {
  const W = CFG.craft.secret.weapons[bi], it = makeItem('weapon', CFG.craft.secret.rarity[bi], ilvl, W.name, { aff: Object.assign({}, W.aff) });
  it.sw = bi; return it;
}
function craftSecret(bi) {
  bi = bi | 0; if (!CB[bi] || !biomeReached(bi, G.profile)) return null;
  const cost = secretCost(bi); if (!canPay(cost)) return null; pay(cost);
  const it = makeSecretWeapon(bi, Math.max(biomeTop(bi), G.profile.level) + 3);
  giveItem(it); ev({ t: 'crafted', name: it.name }); return it;
}
// straight into the bag (crafted and relic items never become cases or get auto-salvaged)
function giveItem(it) {
  const p = G.profile; p.bag.push(it); G.dirty = true;
  const better = isBetter(it, p.gear[it.slot]); if (better) G.gearPrompts.push(it.id);
  ev({ t: 'drop', item: it, better, source: 'craft' }); checkAchievements(); return it;
}
// --- crafted sets
const biomeTop = (bi) => { let L = 1; for (const z of CFG.world.zones) if (z.biome === bi) L = Math.max(L, z.lvl ? z.lvl[1] : z.minLevel || 1); return L; };
const biomeReached = (bi, p) => CFG.world.zones.some((z) => z.biome === bi && (p || G.profile).level >= (z.minLevel || 1));
function setPieceCost(bi, slot) {
  const S = CFG.craft.setCost, b = CB[bi], w = slot === 'weapon' ? 1.4 : 1;
  return { mats: [[b.ore, Math.round(S.ore[0] * Math.pow(S.ore[1], bi) * w)], [b.part, Math.round(S.part[0] * Math.pow(S.part[1], bi) * w)], [b.core, S.core[0] + S.core[1] * bi]],
    gold: Math.round(CFG.forge.base * Math.pow(CFG.forge.growth, Math.max(biomeTop(bi), G.profile.level) - 1) * S.gold * w) };
}
const canPay = (cost, p) => (p || G.profile).gold >= (cost.gold || 0) && cost.mats.every(([id, n]) => matCount(id, p) >= n);
function pay(cost) { const p = G.profile, c = craftState(); p.gold -= cost.gold || 0; for (const [id, n] of cost.mats) c.mats[id] -= n; G.dirty = true; }
function craftSetPiece(bi, slot) {
  const cost = setPieceCost(bi, slot), b = CB[bi]; if (!b || !canPay(cost) || !biomeReached(bi)) return null;
  pay(cost);
  const r = CFG.craft.setRarity[bi], it = makeItem(slot, r, Math.max(biomeTop(bi), G.profile.level) + 2, null, {});
  it.name = `${b.set} ${it.name.split(' ').pop()}`; it.set = bi;
  // crafted pieces carry one extra affix at the top of its range
  const extra = Object.keys(CFG.affixes).filter((k) => !(k in it.aff)); if (extra.length) { const k = pick(extra); it.aff[k] = Math.round(CFG.affixes[k].max * (1 + 0.1 * rarIdx(r)) * 100) / 100; }
  giveItem(it); ev({ t: 'crafted', name: it.name }); return it;
}
// equipped pieces per set -> { dmg, hp }
function setBonuses(gear) {
  const o = { dmg: 0, hp: 0, sets: {} }, SB = CFG.craft.setBonus; if (!gear) return o;
  for (const s of CFG.gear.slots) { const it = gear[s]; if (it && it.set != null) o.sets[it.set] = (o.sets[it.set] || 0) + 1; }
  for (const bi in o.sets) { const n = o.sets[bi], k = 1 + SB.perBiome * bi; for (const t of [3, 5]) if (n >= t) { o.dmg += SB[t].dmg * k; o.hp += SB[t].hp * k; } }
  return o;
}
// --- Masterwork upgrades
function upgCost(id, rank) {
  const U = CFG.craft.upgrades[id], bi = Math.min(5, Math.floor(rank * 6 / U.max)), b = CB[bi];
  const mats = [[b.ore, Math.round((30 + 12 * rank) * Math.pow(1.2, bi))], [b.part, Math.round((10 + 5 * rank) * Math.pow(1.2, bi))]];
  if (rank >= 2) mats.push([b.core, 1 + Math.floor(rank / 3)]);
  if (rank >= U.max - 2) mats.push([CFG.craft.titan.id, rank - U.max + 3]);
  return { mats, gold: Math.round(CFG.forge.base * Math.pow(CFG.forge.growth, Math.max(1, biomeTop(bi) - 10)) * (3 + rank)), biome: bi };
}
function buyUpgrade(id) {
  const U = CFG.craft.upgrades[id], r = upgRank(id); if (!U || r >= U.max) return false;
  const cost = upgCost(id, r); if (!canPay(cost)) return false;
  pay(cost); craftState().upg[id] = r + 1; refreshPlayerStats(false);
  ev({ t: 'masterwork', name: U.name, rank: r + 1 }); return true;
}
// sigil hero progress, for the roster and unlock checks
const sigilHave = (hid, p) => craftState(p).sig[hid] | 0;
// --- end crafting
