// ---- v8: brawlers replace classes. Each brawler fires exactly one attack type (id = attack id). ----
CFG.roles = {
  balanced: { name: 'Balanced', hpMult: 1.0, atkMult: 1.0, speedMult: 1.0, arenaHp: 2800, arenaDmg: 450, super: 'nova', skill: 'swift' },
  tank: { name: 'Tank', hpMult: 1.4, atkMult: 1.0, speedMult: 0.96, arenaHp: 4200, arenaDmg: 450, super: 'slam', skill: 'ironskin' },
  marksman: { name: 'Marksman', hpMult: 0.95, atkMult: 1.0, speedMult: 1.06, arenaHp: 2500, arenaDmg: 450, super: 'volley', skill: 'swift' },
  mage: { name: 'Mage', hpMult: 0.85, atkMult: 1.0, speedMult: 1.0, arenaHp: 2300, arenaDmg: 450, super: 'meteor', skill: 'frostnova' },
  skirmisher: { name: 'Skirmisher', hpMult: 1.05, atkMult: 1.0, speedMult: 1.1, arenaHp: 3000, arenaDmg: 450, super: 'nova', skill: 'swift' },
  artillery: { name: 'Artillery', hpMult: 0.9, atkMult: 1.0, speedMult: 0.98, arenaHp: 2400, arenaDmg: 450, super: 'meteor', skill: 'frostnova' },
};
// look: head piece on the model · specials: 6 big nodes in the brawler's own tree (see BTAGS)
CFG.brawlers = {
  bolt: { name: 'Pip', role: 'balanced', body: 0xe9e3cf, accent: 0x7b6a58, hair: 0x5b3a29, look: 'cap', specials: ['dmgBig', 'burst', 'crit', 'pierce', 'ammo', 'superPow'] },
  smg: { name: 'Rico', role: 'skirmisher', body: 0xf2b134, accent: 0x2d3142, hair: 0x1d1d2b, look: 'bandana', specials: ['burst', 'ammo', 'crit', 'chain', 'lifesteal', 'speed'] },
  scatter: { name: 'Bruno', role: 'tank', body: 0xb5512e, accent: 0x3a1f16, hair: 0x2b1c17, look: 'mohawk', specials: ['count', 'pierce', 'hpArmor', 'lifesteal', 'range', 'superPow'] },
  rail: { name: 'Vex', role: 'marksman', body: 0x3d5a80, accent: 0x98c1d9, hair: 0xe0fbfc, look: 'visor', specials: ['pierce', 'crit', 'range', 'split', 'ammo', 'superPow'] },
  wave: { name: 'Brick', role: 'tank', body: 0xd9573b, accent: 0x8a8f9c, hair: 0x3b2a20, look: 'helm', specials: ['count', 'aoe', 'hpArmor', 'lifesteal', 'range', 'superPow'] },
  seeker: { name: 'Nova', role: 'artillery', body: 0xef476f, accent: 0x2b2d42, hair: 0xffd166, look: 'goggles', specials: ['count', 'homing', 'aoe', 'burn', 'ammo', 'superPow'] },
  arrow: { name: 'Ayla', role: 'marksman', body: 0x3f9b5a, accent: 0x2f6a3c, hair: 0xc8553d, look: 'hood', specials: ['pierce', 'crit', 'range', 'split', 'speed', 'ammo'] },
  cluster: { name: 'Dax', role: 'artillery', body: 0x9b5de5, accent: 0x3c1874, hair: 0x1d1d2b, look: 'beanie', specials: ['split', 'aoe', 'burn', 'range', 'ammo', 'superPow'] },
  mortar: { name: 'Boomer', role: 'artillery', body: 0x6a994e, accent: 0x386641, hair: 0xa7c957, look: 'helm', specials: ['aoe', 'count', 'burn', 'slow', 'ammo', 'superPow'] },
  disc: { name: 'Kiko', role: 'skirmisher', body: 0x00b4d8, accent: 0x03045e, hair: 0xffffff, look: 'ponytail', specials: ['bounce', 'pierce', 'count', 'speed', 'crit', 'ammo'] },
  orb: { name: 'Lumi', role: 'mage', body: 0x6b4fd1, accent: 0x3b2a86, hair: 0xe9d4ff, look: 'wizard', specials: ['aoe', 'slow', 'chain', 'crit', 'ammo', 'superPow'] },
  flamer: { name: 'Ember', role: 'tank', body: 0xe85d04, accent: 0x370617, hair: 0xffba08, look: 'horns', specials: ['burn', 'range', 'lifesteal', 'hpArmor', 'aoe', 'speed'] },
  chakram: { name: 'Ren', role: 'skirmisher', body: 0xffc94a, accent: 0x6d4b2a, hair: 0x1d1d2b, look: 'bandana', specials: ['count', 'crit', 'range', 'lifesteal', 'speed', 'superPow'] },
  chain: { name: 'Volt', role: 'mage', body: 0x4cc9f0, accent: 0x3a0ca3, hair: 0xf1f1f1, look: 'mohawk', specials: ['chain', 'crit', 'slow', 'aoe', 'ammo', 'superPow'] },
  gatling: { name: 'Gus', role: 'tank', body: 0x7f8590, accent: 0xffc94a, hair: 0x2b1c17, look: 'visor', specials: ['burst', 'ammo', 'lifesteal', 'hpArmor', 'crit', 'range'] },
  starfall: { name: 'Stella', role: 'mage', body: 0xc9a6ff, accent: 0x2a1f5a, hair: 0xfff3b0, look: 'crown', specials: ['count', 'aoe', 'burn', 'slow', 'crit', 'superPow'] },
};
CFG.brawlerOrder = ['bolt', 'smg', 'scatter', 'rail', 'wave', 'seeker', 'arrow', 'cluster', 'mortar', 'disc', 'orb', 'flamer', 'chakram', 'chain', 'gatling', 'starfall'];
// unlocks: mostly the Level Road, some through bosses, shrines and feats (never money)
Object.assign(CFG.attacks.wave, { unlock: { level: 5 } }); Object.assign(CFG.attacks.arrow, { unlock: { level: 8 }, mult: 1.2 }); Object.assign(CFG.attacks.orb, { unlock: { level: 15 }, mult: 1.0 });
CFG.attacks.cluster.unlock = { level: 10 }; CFG.attacks.mortar.unlock = { level: 12 }; CFG.attacks.chain.unlock = { streak: 30 }; CFG.attacks.gatling.unlock = { level: 40 };
// the 27 painted Codex heroes are the roster (assets/data/heroes-v6.js); the original 16 adventurers above are retired:
// their data stays only for old saves and internal fallbacks, they can no longer be recruited, played or met in the arena
CFG.brawlerOrder = [];
installHeroesV6(CFG);
const STARTER_HERO = 'wrenna'; // every new adventure starts with Wrenna
CFG.attacks[STARTER_HERO].unlock = { level: 1 };
for (const id in CFG.brawlers) {
  const B = CFG.brawlers[id], R = CFG.roles[B.role];
  CFG.classes[id] = { name: B.name, role: R.name, hpMult: R.hpMult, atkMult: R.atkMult, speedMult: R.speedMult, arenaHp: R.arenaHp, arenaDmg: R.arenaDmg,
    body: B.body, accent: B.accent, weapon: CFG.attacks[id], super: R.super, skill: R.skill, brawler: true };
}
finishHeroesV6(CFG);
// mastery badges per brawler (RuneScape-style mastery levels)
CFG.badges = [
  { lvl: 10, name: 'Bronze', title: 'Adept', color: 0xcd7f32, dmg: 0.03, hp: 0.02 },
  { lvl: 25, name: 'Silver', title: 'Veteran', color: 0xc0c8d8, dmg: 0.03, hp: 0.02 },
  { lvl: 50, name: 'Gold', title: 'Master', color: 0xffc94a, dmg: 0.03, hp: 0.02 },
  { lvl: 75, name: 'Diamond', title: 'Grandmaster', color: 0x7fe3ff, dmg: 0.03, hp: 0.02 },
  { lvl: 90, name: 'Mythic', title: 'Mythic', color: 0xc77dff, dmg: 0.03, hp: 0.02 },
  { lvl: 99, name: 'Legend', title: 'Legend', color: 0xff5d6c, dmg: 0.03, hp: 0.02 },
];
// ---- skill trees: one shared Hero tree (player-level points), one tree per brawler (mastery points) ----
// small node effects are per rank; ◆ nodes are keystones (3 points, 1 rank)
const NODE_KINDS = {
  dmg: { name: 'Damage', eff: { dmg: 0.02 }, icon: 'n_dmg', fmt: (v) => `+${pct(v.dmg)} damage` },
  crit: { name: 'Precision', eff: { crit: 0.01 }, icon: 'n_crit', fmt: (v) => `+${pct(v.crit)} crit chance` },
  critDmg: { name: 'Brutality', eff: { critDmg: 0.05 }, icon: 'n_critDmg', fmt: (v) => `+${pct(v.critDmg)} crit damage` },
  hp: { name: 'Vitality', eff: { hp: 0.03 }, icon: 'n_hp', fmt: (v) => `+${pct(v.hp)} max HP` },
  armor: { name: 'Plating', eff: { armor: 0.01 }, icon: 'n_armor', fmt: (v) => `+${pct(v.armor)} damage reduction` },
  regen: { name: 'Recovery', eff: { regen: 0.1 }, icon: 'n_regen', fmt: (v) => `+${pct(v.regen)} health regen` },
  speed: { name: 'Agility', eff: { speed: 0.012 }, icon: 'n_speed', fmt: (v) => `+${pct(v.speed)} move speed` },
  reload: { name: 'Rhythm', eff: { reload: 0.03 }, icon: 'n_atkSpeed', fmt: (v) => `+${pct(v.reload)} reload speed` },
  cdr: { name: 'Haste', eff: { cdr: 0.02 }, icon: 'n_cdr', fmt: (v) => `-${pct(v.cdr)} skill & special cooldown` },
  superGain: { name: 'Charge', eff: { superGain: 0.04 }, icon: 'n_super', fmt: (v) => `+${pct(v.superGain)} super charge` },
  superPow: { name: 'Overload', eff: { superPow: 0.04 }, icon: 'n_superPow', fmt: (v) => `+${pct(v.superPow)} super damage` },
  aoe: { name: 'Blast Radius', eff: { aoe: 0.03 }, icon: 'n_aoe', fmt: (v) => `+${pct(v.aoe)} blast radius` },
  lifesteal: { name: 'Leech', eff: { lifesteal: 0.006 }, icon: 'n_lifesteal', fmt: (v) => `+${pct(v.lifesteal)} lifesteal` },
  range: { name: 'Reach', eff: { range: 0.02 }, icon: 'n_range', fmt: (v) => `+${pct(v.range)} range` },
  gold: { name: 'Fortune', eff: { goldFind: 0.05 }, icon: 'n_gold', fmt: (v) => `+${pct(v.goldFind)} gold` },
  gems: { name: 'Prospector', eff: { gemFind: 0.05 }, icon: 'n_gems', fmt: (v) => `+${pct(v.gemFind)} gems` },
  xp: { name: 'Wisdom', eff: { xpFind: 0.03 }, icon: 'n_xp', fmt: (v) => `+${pct(v.xpFind)} XP` },
  core: { name: 'Ascension Core', eff: { dmg: 0.0075, hp: 0.005 }, icon: 'n_core', fmt: (v) => `+${pct(v.dmg)} damage, +${pct(v.hp)} HP`, inf: true },
  mcore: { name: 'Mastery Core', eff: { dmg: 0.01 }, icon: 'n_core', fmt: (v) => `+${pct(v.dmg)} damage with this brawler`, inf: true },
};
const pct = (v) => (Math.round(v * 1000) / 10) + '%';
// brawler ◆ specials
const BTAGS = {
  dmgBig: { name: 'Overcharge', eff: { dmg: 0.25 }, icon: 'n_dmg', desc: '+25% damage' },
  burst: { name: 'Extended Burst', eff: { burst: 2 }, icon: 'n_burst', desc: '+2 bullets in every burst' },
  count: { name: 'Extra Volley', eff: { count: 2 }, icon: 'b_scatter', desc: '+2 projectiles per shot' },
  pierce: { name: 'Piercing Rounds', eff: { pierce: 1 }, icon: 'n_pierce', desc: 'Shots pass through 1 more enemy' },
  crit: { name: 'Deadeye', eff: { crit: 0.1, critDmg: 0.3 }, icon: 'n_crit', desc: '+10% crit chance, +30% crit damage' },
  range: { name: 'Long Barrel', eff: { range: 0.25 }, icon: 'n_range', desc: '+25% range' },
  split: { name: 'Shatter', eff: { split: 3 }, icon: 'a_splitter', desc: 'Shots burst into 3 more shards' },
  bounce: { name: 'Ricochet', eff: { bounce: 2 }, icon: 'a_rubber', desc: 'Shots bounce 2 more times' },
  homing: { name: 'Smart Rounds', eff: { homing: 3 }, icon: 'a_seekerChip', desc: 'Shots steer toward enemies' },
  aoe: { name: 'Big Boom', eff: { aoe: 0.35, blast: 1 }, icon: 'n_aoe', desc: '+35% blast radius (shots explode)' },
  burn: { name: 'Incendiary', eff: { burn: 0.3 }, icon: 'a_ember', desc: 'Shots set enemies on fire' },
  chain: { name: 'Arc Link', eff: { chain: 2 }, icon: 'a_coil', desc: 'Hits jump to 2 more enemies' },
  ammo: { name: 'Deep Mag', eff: { ammo: 1 }, icon: 'a_mag', desc: '+1 ammo bar' },
  superPow: { name: 'Ultimate Focus', eff: { superPow: 0.35, superGain: 0.15 }, icon: 'n_super', desc: '+35% super damage, +15% super charge' },
  hpArmor: { name: 'Bulwark', eff: { hp: 0.15, armor: 0.06 }, icon: 'n_armor', desc: '+15% max HP, +6% damage reduction' },
  lifesteal: { name: 'Leech', eff: { lifesteal: 0.05 }, icon: 'n_lifesteal', desc: '+5% lifesteal' },
  speed: { name: 'Fleet', eff: { speed: 0.1 }, icon: 'n_speed', desc: '+10% move speed' },
  slow: { name: 'Chill', eff: { slow: 1.2 }, icon: 'a_frost', desc: 'Shots slow enemies' },
};
// radial tree layout: branches fan out from a center core; each branch ends in big ◆ nodes
function buildTree(spec) {
  const nodes = {}, add = (n) => { nodes[n.id] = Object.assign({ links: [], max: 5, cost: 1 }, n); return nodes[n.id]; }, r0 = spec.r0 || 2.7, ringR = spec.ringR || 1.7;
  const link = (a, b) => { nodes[a].links.push(b); nodes[b].links.push(a); };
  add({ id: 'core', kind: spec.core, x: 0, y: 0, max: Infinity, start: true });
  const nb = spec.branches.length;
  spec.branches.forEach((br, bi) => {
    const a = br.angle != null ? br.angle : (bi / nb) * Math.PI * 2 - Math.PI / 2;
    const P2 = (r, da) => ({ x: Math.cos(a + (da || 0)) * r, y: Math.sin(a + (da || 0)) * r });
    let prev = 'core';
    br.chain.forEach((kind, i) => {
      const rc = r0 + i * 2.2, id = `${br.id}_c${i}`; add(Object.assign({ id, kind, max: br.max || 5 }, P2(rc, 0))); link(prev, id); prev = id;
      // side nodes sit one step out and a fixed 1.25 units to the side (always the same side, so neighbours never meet)
      if (br.sides && br.sides[i]) { const sid = `${br.id}_s${i}`, rs = rc + 0.9; add(Object.assign({ id: sid, kind: br.sides[i], max: br.max || 5 }, P2(rs, Math.atan2(1.25, rs)))); link(id, sid); }
    });
    const rEnd = r0 + br.chain.length * 2.2 + 0.4, k = br.keys.length;
    br.keys.forEach((key, j) => {
      const id = `${br.id}_k${j}`, da = k > 1 ? (j / (k - 1) - 0.5) * (nb > 3 ? 0.42 : 0.5) : 0;
      add(Object.assign({ id, key: key.key, tag: key.tag, max: 1, cost: 3, big: true }, P2(rEnd + (j === (k - 1) / 2 ? 1.3 : 0), da))); link(prev, id);
    });
  });
  if (spec.ring) spec.ring.forEach((kind, i) => {
    const a = ((i + 0.5) / nb) * Math.PI * 2 - Math.PI / 2, id = 'r' + i;
    add({ id, kind, x: Math.cos(a) * ringR, y: Math.sin(a) * ringR, max: 10 });
    link(id, `${spec.branches[i].id}_c0`); link(id, `${spec.branches[(i + 1) % nb].id}_c0`);
  });
  // layer = steps from the core; layer N+1 opens once every layer-N node has its required ranks (see treeLayer)
  nodes.core.depth = 0; const q = ['core'];
  while (q.length) { const c = nodes[q.shift()]; for (const l of c.links) if (nodes[l].depth == null) { nodes[l].depth = c.depth + 1; q.push(l); } }
  return nodes;
}
const K = (key) => ({ key });
// One skill tree per hero (brawler). Nine branches around one core: the hero's own three
// (Power, Rhythm, Utility, ending in its special shots) each flanked by two general branches.
// Node ids match the old Hero and Brawler trees, so v8 saves merge without losing a point.
CFG.treeBranches = [
  { id: 'pow', name: 'Power' }, { id: 'might', name: 'Might' }, { id: 'carn', name: 'Carnage' },
  { id: 'rhy', name: 'Rhythm' }, { id: 'swift', name: 'Swiftness' }, { id: 'storm', name: 'Tempest' },
  { id: 'uti', name: 'Utility' }, { id: 'fort', name: 'Fortitude' }, { id: 'sorc', name: 'Sorcery' },
].map((b, i) => Object.assign(b, { angle: (i / 9) * Math.PI * 2 - Math.PI / 2 }));
const GENERAL_BRANCHES = {
  might: { chain: ['dmg', 'dmg', 'critDmg', 'dmg'], sides: ['crit', null, 'crit'], keys: [K('execute'), K('kraken'), K('infinity')] },
  fort: { chain: ['hp', 'armor', 'hp', 'regen'], sides: ['hp', null, 'armor'], keys: [K('titan'), K('grasp'), K('undying')] },
  swift: { chain: ['speed', 'reload', 'speed', 'reload'], sides: ['reload', null, 'cdr'], keys: [K('tempo'), K('phase'), K('aftershock')] },
  sorc: { chain: ['superGain', 'superPow', 'aoe', 'superGain'], sides: ['cdr', null, 'superPow'], keys: [K('comet'), K('sunfire'), K('ascend')] },
  carn: { chain: ['lifesteal', 'critDmg', 'lifesteal', 'dmg'], sides: ['crit', null, 'lifesteal'], keys: [K('bloodthirst'), K('conqueror'), K('glass')] },
  storm: { chain: ['cdr', 'reload', 'crit', 'cdr'], sides: ['superGain', null, 'speed'], keys: [K('electrocute'), K('storm'), K('secondWind')] },
};
CFG.brawlerTrees = {};
for (const id in CFG.brawlers) {
  const sp = CFG.brawlers[id].specials.map((tag) => ({ tag }));
  const own = {
    pow: { max: 6, chain: ['dmg', 'crit', 'dmg', 'critDmg'], sides: ['dmg', null, 'crit'], keys: [sp[0], sp[1]] },
    rhy: { max: 6, chain: ['reload', 'superGain', 'reload', 'reload'], sides: ['superGain', null, 'reload'], keys: [sp[2], sp[3]] },
    uti: { max: 6, chain: ['hp', 'range', 'speed', 'superPow'], sides: ['hp', null, 'range'], keys: [sp[4], sp[5]] },
  };
  CFG.brawlerTrees[id] = buildTree({ core: 'core', r0: 3.3, ringR: 2.0, ring: ['gold', 'gems', 'xp', 'gold', 'gems', 'xp', 'gold', 'gems', 'xp'],
    branches: CFG.treeBranches.map((b) => Object.assign({ id: b.id, name: b.name, angle: b.angle }, own[b.id] || GENERAL_BRANCHES[b.id])) });
}
CFG.trees2 = { resetBase: 200, presets: 3 };
const NO_ARTS = {};
function unlockText(u) { if (!u) return ''; if (u.level) return `Reach level ${u.level}`; if (u.streak) return `Reach a ${u.streak} kill streak`; if (u.shrines) return `Complete ${u.shrines} challenge shrine${u.shrines > 1 ? 's' : ''}`; if (u.bosses) return 'Help defeat a world boss'; if (u.sigils != null) return `Only in ${BIOMES[u.sigils].name} dungeons · ${sigilHave(CFG.craft.biomes[u.sigils].hero)}/${CFG.craft.sigil.need} oaths`; return ''; }
function unlockMet(u, p) { if (!u) return true; if (u.level && p.level < u.level) return false; if (u.shrines && (p.stats.shrines || 0) < u.shrines) return false; if (u.bosses && (p.stats.bosses || 0) < u.bosses) return false; if (u.streak && (p.stats.bestStreak || 0) < u.streak) return false; if (u.sigils != null && sigilHave(CFG.craft.biomes[u.sigils].hero, p) < CFG.craft.sigil.need) return false; return true; }

