// --- Mining: four ore veins per combat area (POIs kind 'node'; n 3 is the rare glowing vein). Tap a ready vein to
// mine it: Ore (spent on pickaxe levels), a Geode roll per ore (a case opened on the reel that also fills the Museum)
// and a 1 in 10,000 pet. Veins regrow on a timer; 1% regrow as rich veins that pay triple. Expeditions mine too.
CFG.mining = {
  ore: [3, 5], rareMul: 2, richMul: 3, rich: 0.01, respawn: 60, rareRespawn: 300, interactR: 4,
  geode: 0.02, geodeMax: 0.05, pickGeode: 0.0015, pickYield: 0.2, pickMax: 20, pickCost: [40, 1.8], pet: 10000, petId: 'sprout', petGems: 500,
  biomeOre: ['Copper', 'Iron', 'Obsidian', 'Mithril', 'Abyssal', 'Starsteel'],
  // Museum: every geode holds one mineral; each kind you own adds +1% XP for good
  minerals: [['quartz', 'Quartz', 30], ['amethyst', 'Amethyst', 22], ['citrine', 'Citrine', 16], ['jade', 'Jade', 10], ['ruby', 'Ruby', 7], ['sapphire', 'Sapphire', 5],
    ['emerald', 'Emerald', 4], ['opal', 'Fire Opal', 2.5], ['moonstone', 'Moonstone', 1.5], ['obsidian', 'Obsidian Heart', 1], ['stardiamond', 'Star Diamond', 0.5], ['prism', 'Prismatic Core', 0.1]],
};
const mineState = () => G.profile.mine || (G.profile.mine = { ore: 0, pick: 0, mined: 0, museum: {} });
const isRareVein = (q) => q.id.endsWith(':3');
const oreName = (q) => CFG.mining.biomeOre[CFG.world.zones[q.zone].biome] || 'Ore';
const veinName = (q, st) => `${st && st.rich ? 'Rich ' : ''}${oreName(q)} ${isRareVein(q) ? 'Crystal Vein' : 'Vein'}`;
// runtime vein state, one per node POI: t = seconds until it regrows (0 = ready)
function nodeStates() { const W = CFG.world; if (G.nodes.length !== W.nodes.length) G.nodes = W.nodes.map((q) => ({ q, t: 0, rich: Math.random() < CFG.mining.rich })); return G.nodes; }
function stepNodes(dt) { for (const st of nodeStates()) if (st.t > 0 && (st.t -= dt) <= 0) { st.t = 0; st.rich = Math.random() < CFG.mining.rich; G.nodesDirty = true; } }
function nodeNear(pl) { let best = null, bd = CFG.mining.interactR; for (const st of nodeStates()) { if (st.t > 0) continue; const d = Math.hypot(pl.x - st.q.x, pl.z - st.q.z); if (d < bd) { bd = d; best = st; } } return best; }
const pickCost = (lv) => Math.round(CFG.mining.pickCost[0] * Math.pow(CFG.mining.pickCost[1], lv));
const geodeChance = (m, rare) => Math.min(CFG.mining.geodeMax, CFG.mining.geode + CFG.mining.pickGeode * m.pick) * (rare ? 2 : 1);
function mineNode(st) {
  if (!st || st.t > 0 || G.profile.level < CFG.world.zones[st.q.zone].minLevel) return null;
  const M = CFG.mining, p = G.profile, m = mineState(), q = st.q, rare = isRareVein(q);
  const res = { name: veinName(q, st), rich: st.rich, ore: Math.round(randInt(M.ore[0], M.ore[1]) * (rare ? M.rareMul : 1) * (st.rich ? M.richMul : 1) * (1 + M.pickYield * m.pick)), geodes: 0, pet: false };
  m.ore += res.ore; m.mined++; if (typeof craftMineDrop === 'function') { craftMineDrop(q, res.ore); res.oreName = (CFG.craft.biomes[zoneBiome(q.zone)] || {}).oreN || 'ore'; }
  const gc = geodeChance(m, rare); for (let i = 0; i < res.ore; i++) if (Math.random() < gc) res.geodes++;
  for (let i = 0; i < res.geodes; i++) addCase('geode', { l: Math.max(q.lvl, p.level), src: 'mine' });
  if (Math.random() < 1 / M.pet) res.pet = findMiningPet();
  st.t = rare ? M.rareRespawn : M.respawn; st.rich = false; G.nodesDirty = true; G.dirty = true;
  ev(Object.assign({ t: 'mined', x: q.x, z: q.z }, res)); return res;
}
// the pet unlocks Stone Sprout before its prestige; if you have it already the find pays gems
function findMiningPet() {
  const p = G.profile, id = CFG.mining.petId, had = !!(p.pets || {})[id];
  p.petFinds = p.petFinds || {}; p.petFinds[id] = (p.petFinds[id] || 0) + 1;
  if (had) addEssence(CFG.mining.petGems); else migratePets(p);
  ev({ t: 'minePet', id, had }); return true;
}
function upgradePick() {
  const m = mineState(), c = pickCost(m.pick); if (m.pick >= CFG.mining.pickMax || m.ore < c) return false;
  m.ore -= c; m.pick++; G.dirty = true; return true;
}
function rollMineral() { const L = CFG.mining.minerals; let tot = 0; for (const x of L) tot += x[2]; let r = Math.random() * tot; for (const x of L) { if ((r -= x[2]) < 0) return x; } return L[0]; }
// called by openCase for a geode, after its item is granted
function crackGeode() {
  const m = mineState(), [id, name] = rollMineral(), first = !m.museum[id];
  m.museum[id] = (m.museum[id] || 0) + 1; addEssence(randInt(1, 3)); G.dirty = true;
  ev({ t: 'mineral', id, name, first, n: Object.keys(m.museum).length }); return { id, name, first };
}
const museumBonus = (p) => 0.01 * Object.keys((p.mine && p.mine.museum) || {}).length;
// --- end mining
