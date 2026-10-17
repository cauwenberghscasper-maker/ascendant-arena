// ---- World v10 (Espaahhh's map, widened): Base Camp + 29 areas in 6 biomes, levels 1-210 ----------------------
// Every area is one band of the long road north. theme = floor/decoration style (0 meadow, 1 forest,
// 2 frost, 3 ember, 4 arcane, 5 deep water, 6 celestial); colours and props are tuned per area below.
const BIOMES = [
  { name: 'Starting Woodlands', boss: 'Ancient Golem', bossTint: 0x8d8a83, coreColor: 0xff8a2a, bossAcc: 0x6fae4f, region: -1 },
  { name: 'Mountain Peaks', boss: 'Frost Colossus', bossTint: 0xa9c4dc, coreColor: 0x7fe3ff, bossAcc: 0xe9f2fa, region: 2 },
  { name: 'Volcanic Underworld', boss: 'Magma Titan', bossTint: 0x4a3b36, coreColor: 0xff5a1f, bossAcc: 0x24160f, region: 3 },
  { name: 'Arcane Ruins', boss: 'Void Colossus', bossTint: 0x3b3566, coreColor: 0xc77dff, bossAcc: 0x8d7bff, region: -1 },
  { name: 'Ocean Depths', boss: 'Abyssal Leviathan', bossTint: 0x1d5560, coreColor: 0x2fffd0, bossAcc: 0x2fffd0, region: -1 },
  { name: 'Celestial Ascension', boss: 'Celestial Colossus', bossTint: 0xe9dcb8, coreColor: 0xfff07a, bossAcc: 0xfff07a, region: 6 },
];
// [name, biome, levels, theme, main monster, second monster, den, lair, look]
const AREA_ROWS = [
  ['Base Camp', 0, [1, 1], 0, null, null, null, null, { ground: [0x7a9a55, 0x6f8f4d, 0x86a65e, 0x6a8a4a], fog: 0x5b7a5e, sky: [0x2a3d55, 0x7d9a86], mm: '#b9d98a', deco: { trees: 110, tufts: 900, flowers: 160, bushes: 120, ponds: 2, fungi: 30 } }],
  ['Sunny Meadow', 0, [1, 10], 0, 'thistlehare', 'hornet', 'Hornet Hives', 'Standing Stones', { ground: 'meadow', fog: 0x5b7a5e, sky: [0x2a3d55, 0x7d9a86], mm: '#86c96a', deco: { tufts: 2000, flowers: 300 } }],
  ['Funky Forest', 0, [10, 20], 1, 'truffleboar', 'myconid', 'Glowcap Ring', 'Mushroom Throne', { ground: [0x2f4a3a, 0x2a4434, 0x36503f, 0x263e30], fog: 0x2f3f4a, sky: [0x1a1f3a, 0x4a5a7a], mm: '#3f7a5c', glow: [0.9, 0.3, 1.0],
    deco: { tree: 'round', treeC: [0x3f6a3a, 0x355f36, 0x4a7a40], fungi: 300, fungiC: [0xff4fd8, 0x4fffe0, 0xb6ff4f, 0xffb14f], fungiS: 2.2, glowCaps: true, flies: 170 } }],
  ['Gnarly Grove', 0, [20, 25], 1, 'bramble', 'barkviper', 'Root Maze', 'Hollow Oak', { ground: [0x3e3a2a, 0x47402e, 0x38331f, 0x4f4632], fog: 0x3a3a2e, sky: [0x1f2420, 0x5a5a48], mm: '#6a6a3e',
    deco: { tree: 'dead', treeC: [0x4a3a2c, 0x3b2e24], trees: 260, logs: 45, fungi: 30, ponds: 0, bushes: 200, leafC: [0x4a4a2a, 0x3a3a22] } }],
  ['Shady Shrubland', 0, [25, 30], 1, 'thornbeetle', 'gloompanther', 'Gloom Thicket', 'Shadow Circle', { ground: [0x24342c, 0x1f2e26, 0x2a3a30, 0x1b2922], fog: 0x1c2430, sky: [0x0f1426, 0x3a3f5a], mm: '#2c4a3e',
    deco: { tree: 'round', treeC: [0x23362e, 0x1e2f28, 0x2a4034], bushes: 560, leafC: [0x1e2f28, 0x23362e, 0x2a4034], flies: 130, ponds: 0 } }],
  ['Feisty Foothills', 1, [30, 35], 0, 'craggoat', 'dustharpy', 'Goat Ledges', 'Windy Cairn', { ground: [0x8a8a72, 0x7f7f68, 0x96957c, 0x75735f], fog: 0x8a96a0, sky: [0x4a6a8a, 0xb8c4c8], mm: '#a8a68a', amp: 0.8,
    deco: { tree: 'pine', trees: 50, rocks: 170, tufts: 700, tuftC: [0x8a9a5a, 0x9aa66a], flowers: 0, bushes: 60, ponds: 0, fungi: 0, flies: 20 } }],
  ['Heinous Hilltop', 1, [35, 40], 0, 'bouldermimic', 'galeweaver', 'Boulder Field', 'Crag Crown', { ground: [0x6f6a60, 0x655f56, 0x7a756a, 0x5c564e], fog: 0x7a8088, sky: [0x3a4a6a, 0xa0a8b0], mm: '#8a857a', amp: 1.0,
    deco: { tree: 'pine', trees: 30, rocks: 330, spikes: 0.3, spikeC: 0x8a8478, tufts: 400, tuftC: [0x7a7a5a, 0x8a8a66], flowers: 0, bushes: 40, ponds: 0, fungi: 0, flies: 10 } }],
  ['Pretending Plateau', 1, [40, 45], 0, 'miragestalker', 'pitfallwurm', 'Shimmer Flats', 'Mirage Stones', { ground: [0xc2b07a, 0xb8a670, 0xccbb86, 0xae9c68], fog: 0xc8b48a, sky: [0x6a8ab0, 0xe8d8b0], mm: '#d8c88a', amp: 0.15,
    deco: { tree: 'round', trees: 20, treeC: [0x8a9a4a, 0x7a8a40], rocks: 40, tufts: 900, tuftC: [0xc8b878, 0xd8c890], flowers: 30, flowerC: [0xffe08a, 0xffffff], bushes: 40, leafC: [0x9aa055, 0x8a9048], ponds: 0, fungi: 0, ruins: 2, flies: 10 } }],
  ['Malicious Mountain', 1, [45, 50], 2, 'frostgargoyle', 'chillbanshee', 'Black Crags', 'Avalanche Altar', { ground: [0x3a3a44, 0x33333c, 0x42424e, 0x2c2c34], fog: 0x5a6478, sky: [0x1a2236, 0x7a8aa0], mm: '#4a4a58', amp: 0.9,
    deco: { tree: 'snowPine', trees: 40, spikes: 0.55, spikeC: 0x2a2a32, rocks: 140, rockC: [0x3a3a44, 0x4a4a56], tufts: 300, tuftC: [0xd7e6f2, 0x9aa8b4] } }],
  ['Frost Peaks', 1, [50, 60], 2, 'glacialtroll', 'iceshard', 'Whiteout Summit', 'Glacier Throne', { ground: 'frost', fog: 0x9fb3c4, sky: [0x3a5274, 0xb8c9d6], mm: '#dbe7f2' }],
  ['Grumbling Descent', 2, [60, 65], 5, 'screecrawler', 'echobat', 'Echo Cavern', 'Fissure Mouth', { ground: [0x4a4440, 0x423c38, 0x54504a, 0x3a3430], fog: 0x2a2622, sky: [0x0e0c0a, 0x3a342e], mm: '#5a524a', glow: [1.0, 0.75, 0.4],
    deco: { tree: 'none', spikes: 1.0, spikeC: 0x5a524a, rocks: 170, rockC: [0x5a524a, 0x4a443e], tufts: 250, tuftC: [0x5a524a, 0x4a443e], fungi: 40, fungiC: [0xffb14f, 0xffd88a], glowCaps: true, flies: 0, bushes: 0, ponds: 0 } }],
  ['Brimstone Bogs', 2, [65, 70], 3, 'sulfurslime', 'fumetoad', 'Sulfur Pits', 'Bubbling Cauldron', { ground: [0x5a5a2a, 0x4f4f24, 0x666630, 0x45451f], fog: 0x6a6a3a, sky: [0x2a2a14, 0x8a8a4a], mm: '#7a7a3a', glow: [1.0, 0.85, 0.2],
    deco: { tree: 'dead', trees: 60, treeC: [0x3a3a24, 0x2e2e1c], ponds: 10, lava: 16, lavaC: 0xd8d040, tufts: 400, tuftC: [0x6a6a30, 0x7a7a3a], bushes: 60, leafC: [0x5a5a28, 0x4a4a20] } }],
  ['Slaggy Terraces', 2, [70, 75], 3, 'magmahound', 'cinderelemental', 'Slag Stairs', 'Molten Caldera', { ground: [0x2a2226, 0x241c20, 0x32282c, 0x1e171a], fog: 0x5a2a1e, sky: [0x2a0f0e, 0x9a4a2a], mm: '#5a2a2a',
    deco: { tree: 'none', lava: 32, ruins: 5, ruinC: 0x1e1a22, rocks: 110, rockC: [0x241c20, 0x32282c] } }],
  ['Charred Threshold', 2, [75, 80], 3, 'ashstalker', 'emberwraith', 'Ashfall Hollow', 'Cinder Gate', { ground: [0x5a5654, 0x4f4b49, 0x66625f, 0x45413f], fog: 0x6a6664, sky: [0x2a2828, 0x8a8480], mm: '#6a6664', glow: [0.9, 0.35, 0.1],
    deco: { tree: 'dead', trees: 90, treeC: [0x1e1a18, 0x2a2422], lava: 6, tufts: 500, tuftC: [0x6a6664, 0x7a7674], rockC: [0x4f4b49, 0x5a5654] } }],
  ['Ember Wastes', 2, [80, 85], 3, 'scoriascorpion', 'flamewyrm', 'Fire Dunes', 'Ember Throne', { ground: 'ember', fog: 0x7a4a3a, sky: [0x3a1f24, 0xa8644a], mm: '#7a5444', deco: { lava: 34 } }],
  ['Sapphire Coals', 3, [85, 90], 3, 'manaleech', 'azuregolem', 'Azure Kiln', 'Cold Fire Altar', { ground: [0x1e2a44, 0x1a243c, 0x24324e, 0x161f34], fog: 0x1e2a5a, sky: [0x0a0f2a, 0x3a5aaa], mm: '#2a4a8a', glow: [0.25, 0.55, 1.0],
    deco: { tree: 'crystal', trees: 70, treeC: [0x3a7aff, 0x5a9aff, 0x2a5adf], lava: 24, lavaC: 0x3a8aff, spikes: 0.4, spikeC: 0x2a5aaa, rockC: [0x1e2a44, 0x2a3a5a] } }],
  ['Fractural Ley', 3, [90, 95], 4, 'riftspider', 'geodrone', 'Shear Lines', 'Ley Nexus', { ground: [0x3a2a5a, 0x34264f, 0x44326a, 0x2e2246], fog: 0x3a2a6a, sky: [0x140a2a, 0x6a4aaa], mm: '#5a3a8a',
    deco: { tree: 'crystal', trees: 130, treeC: [0x9a5aff, 0xc77dff, 0x7a3aef], ruins: 6, ruinC: 0x5b3a90 } }],
  ['Inverted Abyss', 3, [95, 100], 4, 'voidray', 'asteroidhermit', 'Floating Rocks', 'Gravity Well', { ground: [0x14142a, 0x101024, 0x1a1a34, 0x0c0c1e], fog: 0x0a0a1e, sky: [0x02020a, 0x1a1a4a], mm: '#1a1a3a', glow: [0.4, 0.8, 1.0],
    deco: { tree: 'crystal', trees: 50, treeC: [0x6ac8ff, 0x9ae8ff], rocks: 170, rockC: [0x4a4466, 0x3a3456], flies: 260, tufts: 300, tuftC: [0x2a2a4a, 0x343456] } }],
  ['Glassfall Labyrinth', 3, [100, 105], 4, 'prismmimic', 'glassminotaur', 'Mirror Halls', 'Prism Heart', { ground: [0xc8d8e8, 0xb8c8da, 0xd8e6f2, 0xa8b8ca], fog: 0x9ab8d0, sky: [0x4a6a9a, 0xd8e8f8], mm: '#c8d8e8', glow: [0.7, 0.95, 1.0],
    deco: { tree: 'crystal', trees: 170, treeC: [0xbff0ff, 0xffd0f8, 0xd0ffe8], ruins: 11, ruinC: 0xa8d8f0, rockC: [0xb8c8da, 0xd8e6f2], tufts: 300, tuftC: [0xd8e6f2, 0xbfd8ea] } }],
  ['Starfall Ruins', 3, [105, 110], 4, 'starsentry', 'astronomer', 'Fallen Observatory', 'Void Gate', { ground: 'starfall', fog: 0x4a4170, sky: [0x1a1636, 0x6a5f9c], mm: '#544c86', deco: { ruins: 9 } }],
  ['Drowned Constellations', 4, [110, 120], 5, 'nebulajelly', 'kelpie', 'Starlit Lake', 'Sunken Star', { ground: [0x2a2a5a, 0x24244f, 0x32326a, 0x1e1e46], fog: 0x2a2a5a, sky: [0x0a0a2a, 0x4a4a9a], mm: '#4a4a8a', glow: [0.75, 0.5, 1.0],
    deco: { tree: 'coral', trees: 70, treeC: [0x8a6aff, 0xc77dff, 0x6a8aff], ponds: 14, flies: 170 } }],
  ['Twilight Aquifers', 4, [120, 130], 5, 'rapidsiren', 'thrasher', 'White Rapids', 'River Fork', { ground: [0x1e3a5a, 0x1a344f, 0x24446a, 0x162e46], fog: 0x1e3a5a, sky: [0x0a1a2e, 0x3a6a9a], mm: '#2a5a8a', glow: [0.4, 0.8, 1.0],
    deco: { tree: 'coral', trees: 50, treeC: [0x2a6a9a, 0x3a8aba], ponds: 18, rocks: 130, rockC: [0x2a3a4a, 0x34465a] } }],
  ['Luminous Grottos', 4, [130, 140], 5, 'sporeurchin', 'angler', 'Glowing Grotto', 'Lantern Pool', { ground: [0x0e2a2a, 0x0b2424, 0x123232, 0x081e1e], fog: 0x0e2a2a, sky: [0x020a0a, 0x1e4a4a], mm: '#1e4a4a', glow: [0.4, 1.0, 0.6],
    deco: { tree: 'coral', trees: 90, treeC: [0x1f8a7a, 0x2fbfa0], fungi: 230, fungiC: [0x4fffb0, 0x4fd8ff, 0xb0ff4f], fungiS: 1.8, glowCaps: true, flies: 220 } }],
  ['Midnight Shelf', 4, [140, 150], 5, 'trenchcrawler', 'pressuresquid', 'Basalt Ledge', 'Cliff Edge', { ground: [0x101418, 0x0c1014, 0x14181e, 0x080c10], fog: 0x080a10, sky: [0x000000, 0x10141e], mm: '#14181e', glow: [0.3, 0.5, 1.0],
    deco: { tree: 'none', spikes: 0.6, spikeC: 0x1a1e24, rocks: 170, rockC: [0x1a1e24, 0x22262e], flies: 60, fungi: 20, tuftC: [0x1a1e24, 0x22262e] } }],
  ['Abyssal Depths', 4, [150, 160], 5, 'leviathan', 'abyssphantom', 'Heartbeat Trench', 'Leviathan Trench', { ground: 'abyss', fog: 0x2f5f66, sky: [0x0b2230, 0x4f8a8c], mm: '#2a7078' }],
  ['Abyssal Upwelling', 5, [160, 170], 5, 'boilcrab', 'steamelemental', 'Thermal Vents', 'Steam Geyser', { ground: [0x3a3a3e, 0x343438, 0x424248, 0x2c2c30], fog: 0x8a8a90, sky: [0x2a2a30, 0xb0b0b8], mm: '#5a5a62', glow: [1.0, 0.5, 0.15],
    deco: { tree: 'none', ponds: 12, lava: 14, lavaC: 0xff8a3a, spikes: 0.4, spikeC: 0x4a4a50, rockC: [0x3a3a3e, 0x4a4a50], tuftC: [0x5a5a62, 0x4a4a50] } }],
  ['Obsidian Chimney', 5, [170, 180], 3, 'shaftvulture', 'obsidiangargoyle', 'Glass Shaft', 'Updraft Ring', { ground: [0x14101a, 0x100c16, 0x1a1422, 0x0c0812], fog: 0x1a1428, sky: [0x06040a, 0x3a2a5a], mm: '#241c2e', glow: [0.7, 0.3, 1.0],
    deco: { tree: 'crystal', trees: 40, treeC: [0x8a3aff, 0x6a2adf], spikes: 0.8, spikeC: 0x1a1422, rocks: 130, rockC: [0x1a1422, 0x241c2e], lava: 0, tuftC: [0x241c2e, 0x1a1422] } }],
  ['Zenith Supercell', 5, [180, 190], 6, 'lightningwyvern', 'cyclone', 'Eye of the Storm', 'Thunder Spire', { ground: [0x8a94a8, 0x7f8a9e, 0x96a0b4, 0x748094], fog: 0x5a6478, sky: [0x1a2030, 0x7a8aa0], mm: '#8a94a8',
    deco: { tree: 'none', rocks: 130, rockC: [0x6a7488, 0x7a8498], flowers: 0, fungi: 0, flies: 140, tuftC: [0x9aa4b8, 0x8a94a8], bushes: 40, leafC: [0x6a7488, 0x7a8498] } }],
  ['Aetherial Threshold', 5, [190, 200], 6, 'aetherray', 'halosentinel', 'Starlight Bridge', 'Twilight Arch', { ground: [0xb8a8d8, 0xae9ece, 0xc4b4e4, 0xa494c4], fog: 0x8a7ab0, sky: [0x2a1a4a, 0xc8a8d8], mm: '#b8a8d8',
    deco: { tree: 'blossom', trees: 70, treeC: [0xd8c8ff, 0xffd8f0, 0xc8e8ff], flowers: 140, flowerC: [0xffffff, 0xd8c8ff, 0xffd8f0], tuftC: [0xc4b4e4, 0xd4c4f0], leafC: [0xc8b8e8, 0xd8c8f8] } }],
  ['Celestial Spire', 5, [200, 210], 6, 'archon', 'cosmicweaver', 'Spire Gates', 'Throne of Dawn', { ground: 'celestial', fog: 0xc9a77a, sky: [0x7a5a3a, 0xf0d8b0], mm: '#efe0bb', deco: { ruins: 8 } }],
];
const AREA_PATH = { 0: 'path', 1: 'path', 2: 'snowPath', 3: 'emberPath', 4: 'starPath', 5: 'abyssPath', 6: 'celestialPath' };
// One hero landmark per area (art id in POI_ART, world-art.js) so every band of the road has its own silhouette.
const AREA_LANDMARKS = [['windmill', 'Old Windmill'], ['bell', 'Sunken Bell'], ['fairyRing', 'Fairy Ring'], ['elderStump', 'Elder Stump'], ['ribcage', "Giant's Ribcage"],
  ['windArch', 'Wind Arch'], ['colossus', 'Broken Colossus'], ['sundial', 'Mirage Sundial'], ['blackSpire', 'Black Spire'], ['frozenFall', 'Frozen Waterfall'],
  ['mineHead', 'Old Mine Lift'], ['cauldron', "Witch's Cauldron"], ['forge', 'Lava Forge'], ['chapel', 'Burnt Chapel'], ['dragonSkull', 'Dragon Skull'],
  ['brazier', 'Sapphire Brazier'], ['crystalArch', 'Crystal Arch'], ['invertedTower', 'Upturned Tower'], ['mirrors', 'Mirror Maze'], ['crashedStar', 'Crashed Star'],
  ['ghostShip', 'Ghost Ship'], ['waterwheel', 'Old Waterwheel'], ['clam', 'Pearl Clam'], ['lighthouse', 'Dark Lighthouse'], ['spine', 'Leviathan Spine'],
  ['geyser', 'Great Geyser'], ['chimney', 'Glass Chimney'], ['stormRod', 'Storm Rod'], ['moonGate', 'Moon Gate'], ['skyAltar', 'Sky Altar']];
// the ore each biome's quarries yield (mirrors CFG.mining.biomeOre, defined later in 37-mining.js)
const MINE_ORE = ['Copper', 'Iron', 'Obsidian', 'Mithril', 'Abyssal', 'Starsteel'];
const MINOR_POIS = [['camp', "Hunter's Camp"], ['tower', 'Ruined Tower'], ['statue', 'Old Statue'], ['well', 'Wishing Well'], ['cart', 'Broken Cart'], ['graves', 'Graveyard'], ['obelisk', 'Rune Obelisk'], ['shack', 'Hermit Shack']];
function buildWorldAreas() {
  let z = -90; const out = [];
  AREA_ROWS.forEach(([name, biome, lvl, theme, enemy, alt, den, lair, look], i) => {
    // v10: wider and longer bands (70 / 110 / 135 m) so there is room to explore between camps
    const B = BIOMES[biome], len = i === 0 ? 70 : (lvl[1] - lvl[0] >= 10 ? 135 : 110);
    out.push(Object.assign({ name, biome, biomeName: B.name, theme, minLevel: lvl[0], lvl: lvl.slice(), z0: z, z1: z + len, len,
      enemy: enemy || 'thistlehare', alt: alt || null, count: i === 0 ? 0 : (len >= 135 ? 24 : 20), safe: i === 0, denName: den, lairName: lair,
      boss: B.boss, bossTint: B.bossTint, coreColor: B.coreColor, bossAcc: B.bossAcc, region: B.region, loot: Math.min(6, Math.floor(lvl[1] / 30)),
      path: AREA_PATH[theme], glow: null, amp: null, deco: {} }, look));
    z += len;
  });
  return out;
}
const WORLD_AREAS = buildWorldAreas();
// <area-art-palette> generated by tools/area_palette.py from assets/ui/areas/: each area takes the colours of its own art
const AREA_ART_PALETTE = [
  { ground: [0x448729, 0x2f3817, 0x709733, 0x456922], fog: 0x385620, sky: [0x193813, 0x24371a], mm: '#4a7026' },
  { ground: [0x63b431, 0x549b2f, 0x406033, 0x7dc243], fog: 0x5b9832, sky: [0x2c641e, 0x558831], mm: '#5d9c35' },
  { ground: [0x28193b, 0xa46682, 0x721749, 0x733661], fog: 0x663d60, sky: [0x2a2b40, 0x5a4560], mm: '#6c335a' },
  { ground: [0x7d9461, 0x3a4420, 0x88a26d, 0x647d39], fog: 0x607341, sky: [0x4c6129, 0x536237], mm: '#697e4a' },
  { ground: [0x36986c, 0x39956c, 0x356258, 0x3b986e], fog: 0x2b7062, sky: [0x21338c, 0x204f55], mm: '#378a68' },
  { ground: [0x35564d, 0x4e755d, 0x1e3639, 0x7fad83], fog: 0x4a7165, sky: [0x3b5e7f, 0x4c6f6a], mm: '#486b59' },
  { ground: [0x474b5a, 0x2e2e49, 0x5b7086, 0x88a4a9], fog: 0x768198, sky: [0x3b56bb, 0x8f97af], mm: '#566375' },
  { ground: [0xd3b06e, 0xc29155, 0xddcb85, 0x8b5138], fog: 0xcb9b66, sky: [0xbc8c71, 0xc7966b], mm: '#bf9760' },
  { ground: [0x354174, 0x86b3d4, 0x596c98, 0x1e3068], fog: 0x4b63a1, sky: [0x5269b2, 0x4a5fa2], mm: '#4c6492' },
  { ground: [0x7dbfda, 0xa6cadd, 0x5595cd, 0x2761b0], fog: 0x78b1de, sky: [0x3e66bb, 0x87b9de], mm: '#68a0cd' },
  { ground: [0x3a1617, 0x8d4b22, 0xbd833f, 0x5e2818], fog: 0x6f391f, sky: [0x522517, 0x5c2d1c], mm: '#794324' },
  { ground: [0x9eaf29, 0x332c1f, 0xc2d73c, 0x666e1f], fog: 0x737924, sky: [0x535619, 0x606323], mm: '#7f8829' },
  { ground: [0x2c1723, 0x4f262d, 0x965730, 0x5c1d21], fog: 0x622522, sky: [0x5f0e11, 0x5f1e1d], mm: '#5b2c28' },
  { ground: [0x3f3e3d, 0x5a5957, 0x282728, 0xa98964], fog: 0x6a5c50, sky: [0x525251, 0x716256], mm: '#5b5248' },
  { ground: [0x9f4230, 0x5b1819, 0xba6944, 0x852821], fog: 0x9a422c, sky: [0x7f3023, 0x97472f], mm: '#8e3b2b' },
  { ground: [0x2656b8, 0x1b3999, 0x132479, 0x4292d2], fog: 0x1c3d97, sky: [0x0f1752, 0x162a7a], mm: '#2651a7' },
  { ground: [0x311555, 0x51247e, 0x8756b6, 0x401669], fog: 0x4e2377, sky: [0x281042, 0x461f69], mm: '#52297c' },
  { ground: [0x31478a, 0x131f55, 0x6280b8, 0x20326e], fog: 0x203069, sky: [0x0d1338, 0x101a49], mm: '#324681' },
  { ground: [0x7bbbc9, 0x55559f, 0xb4ccd4, 0x707db6], fog: 0x7f9acb, sky: [0x6672a2, 0x7e97ca], mm: '#7d96bc' },
  { ground: [0x5a2090, 0x8472a8, 0xb6aec5, 0x5f428f], fog: 0x7955a5, sky: [0x310d5c, 0x704a9a], mm: '#7d61a3' },
  { ground: [0x263882, 0x222d75, 0x2d2e7a, 0x405296], fog: 0x342a82, sky: [0x160c3d, 0x3a1f76], mm: '#2d3982' },
  { ground: [0x509393, 0x89c4bb, 0x6a5546, 0x225565], fog: 0x45756a, sky: [0x363090, 0x326352], mm: '#59807e' },
  { ground: [0x58c46d, 0x27756b, 0x213b4c, 0x33a283], fog: 0x266d62, sky: [0x102537, 0x1b4f53], mm: '#35856a' },
  { ground: [0x142459, 0x1b3167, 0x2c528c, 0x121b67], fog: 0x173074, sky: [0x1a609b, 0x162e6f], mm: '#1b306d' },
  { ground: [0x153a51, 0x0d253d, 0x152b47, 0x337179], fog: 0x164559, sky: [0x175558, 0x154656], mm: '#1b3f53' },
  { ground: [0xb3be84, 0x934c2e, 0x4e3036, 0xad8f5c], fog: 0x898162, sky: [0x568477, 0x7b876e], mm: '#907251' },
  { ground: [0x3b2763, 0x2b164e, 0x461c7a, 0x6f5894], fog: 0x412866, sky: [0x442c62, 0x382555], mm: '#472c70' },
  { ground: [0xa8b1d1, 0x393379, 0x7376bc, 0x5654a2], fog: 0x5858a3, sky: [0x342f6e, 0x45438f], mm: '#6b6baa' },
  { ground: [0xd7a688, 0xdec493, 0xa85067, 0xd28d89], fog: 0xdfa28b, sky: [0xc08290, 0xe1a990], mm: '#cc9283' },
  { ground: [0xd3ccb7, 0xb0adad, 0x6a5b60, 0x938e95], fog: 0xbfaba5, sky: [0x5670a5, 0xd0b5ad], mm: '#a09896' },
];
AREA_ART_PALETTE.forEach((c, i) => { if (WORLD_AREAS[i]) Object.assign(WORLD_AREAS[i], c); });
// </area-art-palette>
CFG.world.zones = WORLD_AREAS; CFG.world.maxZ = WORLD_AREAS[WORLD_AREAS.length - 1].z1 - 3;
{
  const W = CFG.world, Z = W.zones, M = W.maxX;
  const jit = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v) - 0.5; }; // stable −0.5..0.5
  // one boss lair per area (not in Base Camp), waypoint at every area gate
  W.lairs = Z.map((zn, i) => zn.safe ? null : { x: 0, z: Math.round(zn.z0 + zn.len * 0.5), name: zn.lairName, zone: i });
  W.lairList = W.lairs.filter(Boolean);
  W.waypoints = [{ name: 'Base Camp Lodestone', x: 9, z: -46, zone: 0 }].concat(Z.slice(1).map((zn, i) => ({ name: zn.name + ' Lodestone', x: 9, z: zn.z0 + 9, zone: i + 1 })));
  // two dens per area on opposite flanks: A near the gate, B deep in the area (sides alternate per area)
  W.dens = [];
  Z.forEach((zn, i) => { if (zn.safe) return; const s = i % 2 ? -1 : 1, n = zn.len >= 135 ? 12 : 10;
    W.dens.push({ name: zn.denName, zone: i, x: s * M * 0.5, z: Math.round(zn.z0 + zn.len * 0.3), r: 13, n });
    W.dens.push({ name: zn.denName + ' Deep', zone: i, x: -s * M * 0.5, z: Math.round(zn.z0 + zn.len * 0.72), r: 13, n }); });
  // points of interest: { id: 'a07:dungeon:0', zone, x, z, r, kind: landmark|secret|dungeon|rune|node, name, art, lvl, hidden }
  // ids are stable save keys (profile.secrets / pois / dungeons / runes): never renumber. Ore veins are a${zi}:node:${n} (G.nodes).
  W.pois = []; W.mines = [];
  Z.forEach((zn, i) => {
    const s = i % 2 ? -1 : 1, L = zn.len, z0 = zn.z0, id = (k, n) => `a${String(i).padStart(2, '0')}:${k}:${n}`;
    const add = (kind, n, x, z, r, name, art, o) => W.pois.push(Object.assign({ id: id(kind, n), zone: i, x: Math.round(x), z: Math.round(z), r, kind, name, art, lvl: zn.lvl[1], hidden: kind === 'secret' }, o));
    const [art, name] = AREA_LANDMARKS[i], m1 = MINOR_POIS[(i * 3) % MINOR_POIS.length], m2 = MINOR_POIS[(i * 3 + 5) % MINOR_POIS.length];
    add('landmark', 0, -s * M * (0.4 + jit(i, 1) * 0.1), z0 + L * (0.42 + jit(i, 2) * 0.08), 10, name, art, { major: true });
    add('landmark', 1, s * M * (0.25 + jit(i, 3) * 0.08), z0 + L * (0.84 + jit(i, 4) * 0.04), 6, m1[1], m1[0]);
    add('landmark', 2, -s * M * (0.78 + jit(i, 5) * 0.06), z0 + L * (0.17 + jit(i, 6) * 0.04), 6, m2[1], m2[0]);
    // secrets: a walled pocket against the border forest, entered through one narrow gap (gap = +1 north / −1 south)
    add('secret', 0, -s * (M - 9), z0 + L * 0.5, 9, 'Hidden Cache', 'cache', { gap: jit(i, 7) < 0 ? -1 : 1 });
    if (L >= 135) add('secret', 1, s * (M - 9), z0 + L * 0.38, 9, 'Forgotten Hoard', 'cache', { gap: jit(i, 8) < 0 ? -1 : 1 });
    // four runestones per combat area (hidden from the map); lighting all four opens the landmark's Legendary Trial
    if (!zn.safe) [[0.62, 0.12], [-0.62, 0.88], [0.35, 0.55], [-0.2, 0.75]].forEach(([fx, fz], n) => add('rune', n, s * M * fx, z0 + L * fz, 3, 'Runestone', 'obelisk', { hidden: true }));
    // four ore veins per combat area (Mining, G.nodes), gathered in one quarry (the area's Mine) on the flank; n 3 is the rare crystal vein
    if (!zn.safe) { const mx = s * M * 0.6, mz = z0 + L * 0.5; W.mines.push({ x: mx, z: mz, zone: i, side: s, name: MINE_ORE[zn.biome] + ' Mine' });
      [[-4, -4], [4, -4], [-4, 4], [4.5, 4.5]].forEach(([dx, dz], n) => add('node', n, mx + dx, mz + dz, 3.5, 'Ore Vein', 'ore')); }
    // three cave entrances per combat area (n = variant in CFG.dungeon.variants); mouths face the road, rock mounds sit outward
    if (!zn.safe) {
      add('dungeon', 0, s * M * 0.8, z0 + L * 0.72, 9, zn.denName + ' Caves', 'cave', { face: -s });
      add('dungeon', 1, -s * M * 0.8, z0 + L * 0.45, 9, zn.name + ' Warrens', 'cave', { face: s });
      add('dungeon', 2, s * M * 0.8, z0 + L * 0.2, 9, zn.lairName + ' Sanctum', 'cave', { face: -s });
    }
  });
  W.secrets = W.pois.filter((q) => q.kind === 'secret'); W.runes = W.pois.filter((q) => q.kind === 'rune'); W.nodes = W.pois.filter((q) => q.kind === 'node');
  W.mmScale = Math.min(1, 1600 / (W.maxZ - W.minZ)); // minimap base canvas px per metre
  // two challenge shrines per biome (second and fourth area)
  CFG.shrines.list = [];
  BIOMES.forEach((B, bi) => { const ids = Z.map((zn, i) => (zn.biome === bi && !zn.safe ? i : -1)).filter((i) => i >= 0); [ids[1], ids[3]].forEach((i, k) => { if (i == null) return; const zn = Z[i]; CFG.shrines.list.push({ x: Math.round((k ? 1 : -1) * M * 0.2), z: Math.round(zn.z0 + zn.len * 0.3) }); }); });
  CFG.pellets.perZone = Z.map((zn) => (zn.safe ? 20 : Math.round(zn.len * 0.36)));
  CFG.pellets.zoneMult = Z.map((zn, i) => 1 + 1.6 * i / (Z.length - 1));
}
const lootTier = (zi) => ((CFG.world.zones[zi] || CFG.world.zones[0]).loot | 0);
const zoneIndex = (name) => CFG.world.zones.findIndex((zn) => zn.name === name);
