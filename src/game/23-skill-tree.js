// --- skill trees -----------------------------------------------------------------------
const levelPointsTotal = (p) => 2 * p.level + 5 * Math.floor(p.level / 10);
const brawlerPointsTotal = (p, id) => 2 * masteryLevel((p.mastery || {})['w:' + id] || 0);
// every hero has exactly one tree: points from your level plus points from that hero's mastery
function treeOf(p, which) { if (!CFG.brawlerTrees[which]) which = p.cls; return { id: which, nodes: CFG.brawlerTrees[which], st: (p.brawlers[which] || newBrawlerState()).tree, total: levelPointsTotal(p) + brawlerPointsTotal(p, which), level: levelPointsTotal(p), mastery: brawlerPointsTotal(p, which) }; }
function treeSpent(nodes, set) { let n = 0; for (const id in set) { const nd = nodes[id]; if (nd) n += set[id] * nd.cost; } return n; }
function treeFree(p, which) { const T = treeOf(p, which); return T.total - treeSpent(T.nodes, T.st.sets[T.st.active]); }
const skillPointsFree = (p) => Math.max(0, treeFree(p, p.cls));
function nodeMax(n) { return n.kind && NODE_KINDS[n.kind] && NODE_KINDS[n.kind].inf ? Infinity : n.max; }
// The tree opens one layer at a time: the next layer appears once every node in the current one has
// at least TREE_GATE ranks (or is maxed, for nodes with fewer ranks than that).
const TREE_GATE = 3;
const layerNeed = (n) => Math.min(TREE_GATE, nodeMax(n));
function treeDepthMax(nodes) { let d = 0; for (const id in nodes) d = Math.max(d, nodes[id].depth || 0); return d; }
function treeLayer(nodes, set) {
  const top = treeDepthMax(nodes); let d = 1;
  while (d < top && Object.keys(nodes).every((id) => nodes[id].depth !== d || (set[id] || 0) >= layerNeed(nodes[id]))) d++;
  return d;
}
// how far the current layer is: { layer, of, done, total }
function treeLayerProgress(nodes, set) {
  const layer = treeLayer(nodes, set); let done = 0, total = 0;
  for (const id in nodes) if (nodes[id].depth === layer) { total++; if ((set[id] || 0) >= layerNeed(nodes[id])) done++; }
  return { layer, of: treeDepthMax(nodes), done, total };
}
// shown on the tree screen: unlocked layers, plus anything already learned (older saves)
function nodeShown(nodes, set, id, layer) { const n = nodes[id]; return !!n && (n.start || (set[id] || 0) > 0 || (n.depth || 0) <= (layer != null ? layer : treeLayer(nodes, set))); }
function nodeOpen(nodes, set, id, layer) {
  const n = nodes[id]; if (!n) return false; if (n.start) return true;
  if ((n.depth || 0) > (layer != null ? layer : treeLayer(nodes, set))) return false;
  return n.links.some((l) => (set[l] || 0) > 0 || (nodes[l] && nodes[l].start));
}
function canSpend(p, which, id) {
  const T = treeOf(p, which), set = T.st.sets[T.st.active], n = T.nodes[id]; if (!n) return false;
  return (set[id] || 0) < nodeMax(n) && nodeOpen(T.nodes, set, id) && treeFree(p, which) >= n.cost;
}
function spendNode(p, which, id, times) {
  if (!CFG.brawlerTrees[which]) return 0;
  if (!p.brawlers[which]) p.brawlers[which] = newBrawlerState();
  const T = treeOf(p, which), set = T.st.sets[T.st.active]; let n = 0;
  for (let i = 0; i < (times || 1); i++) { if (!canSpend(p, which, id)) break; set[id] = (set[id] || 0) + 1; n++; }
  if (n) { refreshPlayerStats(false); checkAchievements(); G.dirty = true; ev({ t: 'node', which, id }); }
  return n;
}
// Auto: spend every free point on random open nodes, nodes that open the next ring first, so a new hero is set up in one tap
function autoSpend(p, which) {
  if (!CFG.brawlerTrees[which]) return 0;
  if (!p.brawlers[which]) p.brawlers[which] = newBrawlerState();
  const T = treeOf(p, which), set = T.st.sets[T.st.active]; let n = 0;
  for (let guard = 0; guard < 5000; guard++) {
    const L = treeLayer(T.nodes, set), open = Object.keys(T.nodes).filter((id) => canSpend(p, which, id)); if (!open.length) break;
    const gate = open.filter((id) => T.nodes[id].depth === L && (set[id] || 0) < layerNeed(T.nodes[id]));
    const fin = open.filter((id) => nodeMax(T.nodes[id]) !== Infinity);
    const id = pick(gate.length ? gate : fin.length ? fin : open); set[id] = (set[id] || 0) + 1; n++;
  }
  if (n) { refreshPlayerStats(false); checkAchievements(); G.dirty = true; ev({ t: 'node', which }); }
  return n;
}
const treeResetCost = (p) => Math.round(CFG.trees2.resetBase * Math.pow(CFG.enemies.goldGrowth, p.level - 1));
function resetTree(p, which) {
  const T = treeOf(p, which), set = T.st.sets[T.st.active]; if (!Object.keys(set).length) return false;
  const c = treeResetCost(p); if (p.gold < c) return false;
  p.gold -= c; T.st.sets[T.st.active] = {}; refreshPlayerStats(false); G.dirty = true; ev({ t: 'treeReset', which }); return true;
}
function setPreset(p, which, i) { const T = treeOf(p, which); if (i < 0 || i >= T.st.sets.length) return; T.st.active = i; refreshPlayerStats(false); G.dirty = true; }
// all stat bonuses from the hero's tree and badges
function emptyMods2() { return { hp: 0, dmg: 0, reload: 0, superPow: 0, superGain: 0, speed: 0, skillCd: 0, aoe: 0, crit: 0, critDmg: 0, lifesteal: 0, armor: 0, cdr: 0, regen: 0, range: 0,
  goldFind: 0, gemFind: 0, xpFind: 0, burst: 0, count: 0, pierce: 0, split: 0, bounce: 0, homing: 0, blast: 0, burn: 0, chain: 0, ammo: 0, slow: 0 }; }
function addTreeMods(m, nodes, set, keys) {
  for (const id in set) {
    const n = nodes[id], r = set[id]; if (!n || !r) continue;
    if (n.key) { keys[n.key] = true; continue; }
    const eff = n.tag ? BTAGS[n.tag].eff : NODE_KINDS[n.kind].eff, mult = n.tag ? 1 : r;
    for (const k in eff) m[k] = (m[k] || 0) + eff[k] * mult;
  }
}
function badgeCount(p, id) { const L = masteryLevel((p.mastery || {})['w:' + id] || 0); return CFG.badges.filter((b) => L >= b.lvl).length; }
function buildMods(src, bid) {
  const m = emptyMods2(), keys = {};
  if (src && src.brawlers && src.brawlers[bid]) { const T = src.brawlers[bid].tree; addTreeMods(m, CFG.brawlerTrees[bid] || {}, T.sets[T.active] || {}, keys); }
  if (src && src.mastery && CFG.brawlers[bid]) { const n = badgeCount(src, bid); for (let i = 0; i < n; i++) { m.dmg += CFG.badges[i].dmg; m.hp += CFG.badges[i].hp; } }
  return { m, keys };
}

