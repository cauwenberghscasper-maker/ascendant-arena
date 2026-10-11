// =====================================================================
// ASCENDANT ARENA — Phase 1 prototype
// Sections: 1 CONFIG · 2 UTIL · 3 DATA · 4 PROFILE · 5 SIM (pure logic,
// no rendering, written so a server can own it later) · 6 RENDER ·
// 7 AUDIO · 8 INPUT · 9 UI · 10 MAIN LOOP
// =====================================================================

// ---------------------------------------------------------------------
// 1. CONFIG — every tunable number lives here
// ---------------------------------------------------------------------
// the store apps also run on localhost, so a native build never counts as a local preview
const LOCAL_PREVIEW = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) && !window.Capacitor?.isNativePlatform?.();
const TEST_MODE = isTestMode(location.search);
const CFG = {
  sim: { step: 1 / 60, maxSteps: 5 },
  quality: { maxDpr: 2, minDpr: 0.6, downFps: 50, upFps: 58, sampleSec: 1.5, cullFar: 72, cullNear: 46 },
  world: {
    minX: -130, maxX: 130, minZ: -90, maxZ: 1062, // set from the areas below
    town: { x: 0, z: -58, r: 20 },
    spawn: { x: 0, z: -49 },
    // Base Camp plus 29 areas in 6 biomes, each a band of the road north (see WORLD_AREAS above).
    // Monster level rises the deeper you go inside an area (RuneScape-style wilderness).
    zones: [], // WORLD_AREAS, filled in below
    // Monster dens: packed camps that respawn fast (one per area, built below). Best XP per minute, but they hit back hard.
    dens: [],
    denRespawn: 7, denLevelBonus: 2, denXp: 1.15, elitesPerZone: 1, eliteRespawn: 50,
    enemyRespawn: 11, spawnGap: 0.2, spawnSafeRadius: 12, patrolDensity: 1.25, catchupGap: 4, berryCount: 14, berryRespawn: 18,
  },
  progression: {
    cap: 100000, xpBase: 55, xpExp: 1.45, xpGrowth: 1.025, classAt: 5,
    hpBase: 100, hpGrowth: 1.095, atkBase: 10, atkGrowth: 1.095,
    // v9: about 1.6x more kills per level than v8 (slower, longer climb to 210)
    killsPerLevel: 32, killsPerLevelGrowth: 5.1, killsPerLevelSq: 0.04, streakWindow: 4, streakStep: 0.01, streakMax: 0.3,
    // Level Road: every level drops an item; every 5th level is a milestone chest with a guaranteed minimum rarity.
    milestones: { 5: 'rare', 10: 'rare', 15: 'epic', 20: 'epic', 25: 'epic', 30: 'legendary', 35: 'epic', 40: 'legendary', 45: 'epic', 50: 'legendary', 55: 'legendary', 60: 'legendary', 65: 'legendary' },
    keystoneLevels: [10, 20, 30, 40, 50, 60], artifactSlotAt: { 30: 3, 100: 4, 150: 5 }, ascendAt: [100, 150, 200],
    offline: { minMinutes: 3, capHours: 8, killsPerMin: 1.5, itemEveryMin: 45, maxItems: 8 },
    fastXpMult: 5, testGoldMult: 3, testBossFirst: 20, testBossInterval: 60, testShrineCd: 0.25, regenHub: 0.06, regenDelay: 3.5,
  },
  jobs: { xpFrac: 0.55, goldBase: 24, goldPerLevel: 9 },
  player: { speed: 6.4, radius: 0.55, respawn: 3 },
  combat: {
    dash: { dist: 6.5, time: 0.17, invuln: 0.32, cd: 2.6 },
    melee: { range: 2.5, arc: 1.15, cd: 0.6, mult: 1.35, knock: 6 },
    superPerHit: 0.12, critChance: 0.08, critMult: 1.6, variance: 0.1,
    combatLinger: 3.5, hitFlash: 0.12,
  },
  classes: {
    novice: { name: 'Novice', role: 'Balanced starter', hpMult: 1, atkMult: 1, speedMult: 1, arenaHp: 2800, arenaDmg: 450,
      body: 0xe9e3cf, accent: 0x7b6a58,
      weapon: { kind: 'bolt', count: 1, spread: 0, speed: 22, range: 13, radius: 0.35, mult: 1, ammo: 3, reload: 1.05, cd: 0.28, aoe: 0, aoeMult: 0 },
      super: 'nova', skill: null },
    warrior: { name: 'Warrior', role: 'Melee · tanky', hpMult: 1.4, atkMult: 1.0, speedMult: 0.97, arenaHp: 4300, arenaDmg: 330,
      body: 0xd9573b, accent: 0x8a8f9c,
      weapon: { kind: 'wave', count: 3, spread: 0.55, speed: 19, range: 8.5, radius: 0.5, mult: 0.55, ammo: 3, reload: 1.15, cd: 0.3, aoe: 0, aoeMult: 0 },
      super: 'slam', skill: 'ironskin' },
    ranger: { name: 'Ranger', role: 'Ranged · mobile', hpMult: 1.0, atkMult: 1.1, speedMult: 1.12, arenaHp: 2600, arenaDmg: 580,
      body: 0x3f9b5a, accent: 0x2f6a3c,
      weapon: { kind: 'arrow', count: 1, spread: 0, speed: 34, range: 18, radius: 0.3, mult: 1.1, ammo: 3, reload: 0.85, cd: 0.22, aoe: 0, aoeMult: 0 },
      super: 'volley', skill: 'swift' },
    mage: { name: 'Mage', role: 'Area damage · fragile', hpMult: 0.85, atkMult: 1.25, speedMult: 1.0, arenaHp: 2300, arenaDmg: 520,
      body: 0x6b4fd1, accent: 0x3b2a86,
      weapon: { kind: 'orb', count: 1, spread: 0, speed: 15, range: 12.5, radius: 0.45, mult: 0.8, ammo: 2, reload: 1.25, cd: 0.35, aoe: 2.6, aoeMult: 0.6 },
      super: 'meteor', skill: 'frostnova' },
  },
  supers: {
    nova: { name: 'Nova Burst', short: 'NOVA', count: 10, mult: 0.9 },
    slam: { name: 'Ground Slam', short: 'SLAM', r: 4.6, mult: 3.0, knock: 9 },
    volley: { name: 'Arrow Volley', short: 'VOLLEY', count: 7, spread: 0.7, mult: 1.0 },
    meteor: { name: 'Meteor', short: 'METEOR', dist: 9, r: 4.2, mult: 3.2, delay: 0.6 },
  },
  skills: {
    ironskin: { name: 'Iron Skin', short: 'IRON', desc: 'Take 50% less damage for 3.5s', cd: 10, dur: 3.5, reduce: 0.5 },
    swift: { name: 'Swift Step', short: 'SWIFT', desc: '+45% speed and full ammo for 3s', cd: 9, dur: 3, speed: 1.45 },
    frostnova: { name: 'Frost Nova', short: 'FROST', desc: 'Freezing blast that slows nearby foes', cd: 9, r: 5, mult: 1.2, slow: 2.5 },
  },
  trees: {
    warrior: [
      { id: 'w_hp', name: 'Iron Body', desc: '+10% max HP', max: 3, eff: { hp: 0.10 } },
      { id: 'w_dmg', name: 'Heavy Hands', desc: '+7% damage', max: 3, eff: { dmg: 0.07 } },
      { id: 'w_rel', name: 'Battle Rhythm', desc: '+10% reload speed', max: 3, eff: { reload: 0.10 } },
      { id: 'w_sup', name: 'Earthshaker', desc: '+15% super power, +10% super charge', max: 2, eff: { superPow: 0.15, superGain: 0.10 } },
    ],
    ranger: [
      { id: 'r_hp', name: 'Tough Hide', desc: '+8% max HP', max: 3, eff: { hp: 0.08 } },
      { id: 'r_dmg', name: 'Keen Eye', desc: '+8% damage', max: 3, eff: { dmg: 0.08 } },
      { id: 'r_spd', name: 'Fleet Foot', desc: '+4% move speed', max: 3, eff: { speed: 0.04 } },
      { id: 'r_cd', name: 'Hunter Focus', desc: '-12% skill cooldown, +10% super charge', max: 2, eff: { skillCd: 0.12, superGain: 0.10 } },
    ],
    mage: [
      { id: 'm_hp', name: 'Arcane Ward', desc: '+8% max HP', max: 3, eff: { hp: 0.08 } },
      { id: 'm_dmg', name: 'Overcharge', desc: '+9% damage', max: 3, eff: { dmg: 0.09 } },
      { id: 'm_aoe', name: 'Wide Sigils', desc: '+10% blast radius', max: 3, eff: { aoe: 0.10 } },
      { id: 'm_sup', name: 'Starfall', desc: '+15% super power, +10% super charge', max: 2, eff: { superPow: 0.15, superGain: 0.10 } },
    ],
  },
  enemies: {
    slime: { name: 'Slime', hp: 54, atk: 8, speed: 3.3, r: 0.7, aggro: 8, leash: 22, attack: 'touch', cd: 1.0, gold: [2, 5] },
    wolf: { name: 'Wolf', hp: 60, atk: 10, speed: 5.6, r: 0.8, aggro: 11, leash: 26, attack: 'touch', cd: 0.9, gold: [3, 6], lunge: true },
    imp: { name: 'Frost Imp', hp: 54, atk: 10, speed: 3.9, r: 0.65, aggro: 13, leash: 26, attack: 'shoot', cd: 1.35, gold: [3, 7], shotSpeed: 13, keep: 8, shots: 1, shotColor: 0x7fe3ff },
    beetle: { name: 'Ember Beetle', hp: 78, atk: 13, speed: 4.2, r: 0.9, aggro: 11, leash: 26, attack: 'touch', cd: 1.1, gold: [4, 8], charge: true, burn: 0.25 },
    wraith: { name: 'Void Wraith', hp: 64, atk: 8, speed: 4.4, r: 0.75, aggro: 12, leash: 28, attack: 'shoot', cd: 1.9, gold: [4, 9], shotSpeed: 11, keep: 9, shots: 2, spread: 0.36, shotColor: 0xc77dff },
    // second monster of each zone, for variety
    boar: { name: 'Tusk Boar', hp: 70, atk: 10, speed: 4.4, r: 0.85, aggro: 9, leash: 24, attack: 'touch', cd: 1.1, gold: [3, 6], charge: true },
    spider: { name: 'Thorn Spider', hp: 38, atk: 9, speed: 6.6, r: 0.7, aggro: 12, leash: 26, attack: 'touch', cd: 0.7, gold: [3, 6], lunge: true },
    yeti: { name: 'Yeti', hp: 120, atk: 16, speed: 3.4, r: 1.05, aggro: 10, leash: 24, attack: 'touch', cd: 1.5, gold: [5, 9], heavy: true },
    fireimp: { name: 'Cinder Imp', hp: 50, atk: 10, speed: 4.0, r: 0.65, aggro: 13, leash: 26, attack: 'shoot', cd: 1.5, gold: [4, 8], shotSpeed: 12, keep: 8, shots: 1, shotColor: 0xff7a2b, burn: 0.3 },
    crawler: { name: 'Abyss Crawler', hp: 66, atk: 11, speed: 5.4, r: 0.85, aggro: 11, leash: 26, attack: 'touch', cd: 0.85, gold: [5, 10], lunge: true, burn: 0.15 },
    drowned: { name: 'Drowned Siren', hp: 60, atk: 9, speed: 4.2, r: 0.75, aggro: 13, leash: 28, attack: 'shoot', cd: 1.7, gold: [5, 10], shotSpeed: 12, keep: 9, shots: 3, spread: 0.5, shotColor: 0x2fffd0 },
    seraph: { name: 'Seraph', hp: 58, atk: 10, speed: 4.6, r: 0.75, aggro: 14, leash: 28, attack: 'shoot', cd: 1.4, gold: [6, 11], shotSpeed: 14, keep: 10, shots: 2, spread: 0.3, shotColor: 0xfff07a },
    warden: { name: 'Gilded Warden', hp: 135, atk: 17, speed: 3.6, r: 1.05, aggro: 10, leash: 24, attack: 'touch', cd: 1.4, gold: [7, 12], heavy: true, charge: true },
    sentinel: { name: 'Star Sentinel', hp: 90, atk: 9, speed: 1.8, r: 0.9, aggro: 15, leash: 20, attack: 'shoot', cd: 2.2, gold: [5, 10], shotSpeed: 10, keep: 11, shots: 5, spread: 0.9, shotColor: 0x9fe8ff },
    hpGrowth: 1.105, atkGrowth: 1.105, goldGrowth: 1.06,
    elite: { hp: 7, atk: 1.6, r: 1.35, xp: 6, gold: 5, drop: 0.5, essence: [3, 8], shards: [2, 4] },
  },
  boss: {
    name: 'Ancient Golem', firstSpawn: 45, interval: 150, warn: 25, duration: 120,
    hp: 3600, hpGrowth: 1.105, atk: 22, r: 2.4, speed: 2.2, leash: 8, attackEvery: 3.2,
    slamR: 5.5, slamDelay: 1.1, rocks: 12, rockSpeed: 11, joinRange: 34, botFireEvery: 1.2,
    loot: { minContrib: 0.02, goldBase: 60, goldPerLevel: 12, rareBase: 0.25, rareScale: 1.6, rareMax: 0.95,
      epicScale: 1.2, epicMax: 0.6, tomeBase: 0.45, tomeScale: 1.0, tomeXpFrac: 0.6, essence: [10, 18], shards: [8, 14] },
  },
  arena: {
    half: 30, fighters: 10, spawnR: 26, countdown: 3,
    gasStart: 44, gasEnd: 4, gasDelay: 15, gasTime: 100, gasDps: 0.10, gasRamp: 0.012,
    maxTime: 180, regen: 0.13, regenDelay: 3, cube: 0.1,
    trophies: [10, 8, 6, 4, 2, 0, -2, -4, -6, -8], gold: [40, 25, 18, 12, 10, 8, 6, 5, 4, 3],
    maxDiffTrophies: 500, powerPerLevel: 0.02, powerPerGear: 0.003, powerCap: 1.45,
    botPowerBase: 0.95, botPowerScale: 0.4, treeScale: 0.5,
  },
  bots: {
    hubCount: 12,
    reactMin: 0.15, reactMax: 0.6, seeMin: 13, seeMax: 22, fireSlowMax: 1.5, aimErrMin: 0.04, aimErrMax: 0.38, dodgeMin: 0.04, dodgeMax: 0.55,
  },
  gear: {
    slots: ['weapon', 'helmet', 'chest', 'boots', 'accessory'],
    rarity: {
      common: { name: 'Common', mult: 1, affixes: 0 }, uncommon: { name: 'Uncommon', mult: 1.15, affixes: 1 },
      rare: { name: 'Rare', mult: 1.35, affixes: 1 }, epic: { name: 'Epic', mult: 1.6, affixes: 2 },
      legendary: { name: 'Legendary', mult: 1.95, affixes: 3 },
      // endgame rarities: only from World Tiers, deep Rift floors, high-tier bosses and late Level Road chests
      mythic: { name: 'Mythic', mult: 2.4, affixes: 4 }, ancient: { name: 'Ancient', mult: 2.95, affixes: 4 }, divine: { name: 'Divine', mult: 3.6, affixes: 5 },
    },
    maxUp: Infinity, upStep: 0.12, starEvery: 10, starBonus: 0.3, upCostBase: 30, upCostExp: 1.5, upCostGrowth: 1.06, bagMax: 50,
    essenceFrom: 6, // upgrades from +6 to +15 also cost essence (salvage Rare+ items to get it)
    salvageEssence: { common: 0, uncommon: 1, rare: 6, epic: 15, legendary: 36, mythic: 80, ancient: 160, divine: 320 },
    // share of a same-level hero's base attack / HP that one item of this slot adds (x rarity x upgrades)
    statShare: { weapon: { atk: 0.30 }, helmet: { hp: 0.10 }, chest: { hp: 0.16 }, boots: { hp: 0.07 }, accessory: { atk: 0.12 } },
  },
  // Hook for a future premium currency. Kept at zero and never sold in Phase 1.
  // Gear perks: every Rare, Epic or Legendary piece unlocks one attack option for its slot.
  // The accessory slot carries an element and gives a SPECIAL attack.
  perks: {
    weapon: { id: 'twin', name: 'Twin Shot', rare: 0.5, epic: 0.75, legendary: 1.0, mythic: 1.2, ancient: 1.4, divine: 1.7 },
    helmet: { id: 'focus', name: 'Focus Crest', rare: 1, epic: 1, legendary: 1, mythic: 1, ancient: 1, divine: 1, epicReload: 0.15 },
    chest: { id: 'retaliate', name: 'Shock Plate', rare: 5, epic: 3.5, legendary: 2.5, mythic: 2, ancient: 1.6, divine: 1.2, r: 3.4, mult: 0.9 },
    boots: { id: 'dashStrike', name: 'Comet Dash', rare: 1.0, epic: 1.6, legendary: 2.2, mythic: 2.8, ancient: 3.4, divine: 4.2 },
    accessory: { id: 'element', name: 'Element', rare: 1, epic: 1.35, legendary: 1.8, mythic: 2.2, ancient: 2.6, divine: 3.2 },
  },
  elements: {
    fire: { name: 'Fireball', word: 'Ember', short: 'FIRE', color: 0xff6a2b, cd: 7, desc: 'hurls a fireball that explodes and burns', mult: 2.2, r: 3, burn: 0.35, burnT: 3, speed: 17, range: 15 },
    ice: { name: 'Ice Shards', word: 'Frost', short: 'ICE', color: 0x9ae8ff, cd: 6, desc: 'fires 5 frost shards that slow enemies', mult: 0.9, count: 5, spread: 0.7, slow: 2.2, speed: 24, range: 13 },
    storm: { name: 'Thunderstrike', word: 'Storm', short: 'STORM', color: 0xc9b8ff, cd: 8, desc: 'calls lightning on up to 3 nearby enemies', mult: 1.8, targets: 3, range: 12 },
    poison: { name: 'Toxic Cloud', word: 'Venom', short: 'TOXIC', color: 0x8dff6a, cd: 9, desc: 'drops a poison cloud that hurts for 4s', mult: 0.32, r: 3.6, dur: 4, tick: 0.5, dist: 7 },
  },
  affixes: {
    atkSpeed: { name: 'attack speed', min: 0.04, max: 0.10 },
    dmg: { name: 'damage', min: 0.04, max: 0.10 },
    hp: { name: 'max HP', min: 0.05, max: 0.12 },
    move: { name: 'move speed', min: 0.02, max: 0.06 },
    crit: { name: 'crit chance', min: 0.03, max: 0.08 },
    superGain: { name: 'super charge', min: 0.05, max: 0.12 },
    critDmg: { name: 'crit damage', min: 0.10, max: 0.25 },
    lifesteal: { name: 'lifesteal', min: 0.02, max: 0.05 },
    armor: { name: 'damage reduction', min: 0.03, max: 0.07 },
    cdr: { name: 'cooldown reduction', min: 0.04, max: 0.10 },
  },
  loot: {
    // Gear odds per zone (deeper zones roll better). Elites roll one table up. All earned in play, never bought.
    zones: [
      { common: 60, uncommon: 28, rare: 10, epic: 1.8, legendary: 0.2 },
      { common: 45, uncommon: 33, rare: 17, epic: 4.3, legendary: 0.7 },
      { common: 32, uncommon: 36, rare: 23, epic: 7.5, legendary: 1.5 },
      { common: 20, uncommon: 36, rare: 30, epic: 11, legendary: 3 },
      { common: 10, uncommon: 32, rare: 36, epic: 17, legendary: 5 },
      { common: 5, uncommon: 26, rare: 40, epic: 22, legendary: 7 },
      { common: 2, uncommon: 20, rare: 42, epic: 27, legendary: 9 },
    ],
    dropChance: 0.035, denDrop: 0.045,
    // luck guarantee: after this many drops without that rarity (or better), the next drop is at least that rarity
    pity: { rare: 10, epic: 35, legendary: 120, mythic: 400, ancient: 1200, divine: 3000 },
    levelUp: { common: 25, uncommon: 40, rare: 24, epic: 9, legendary: 2 }, levelUpShift: { common: -0.6, legendary: 0.12, epic: 0.3 },
    shrine: { rare: 50, epic: 35, legendary: 15 },
  },
  pellets: { perZone: [150, 130, 120, 120, 120, 110, 110], xpFrac: 0.006, zoneMult: [1, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2], respawn: 25, pickR: 0.75 },
  growth: { scalePerLevel: 0.006, scaleCap: 1.6, zoomPerLevel: 0.004, zoomCap: 1.22, arenaScaleCap: 1.2 },
  shrines: {
    list: [{ x: -48, z: -22 }, { x: 52, z: 22 }, { x: -40, z: 210 }, { x: 46, z: 128 }, { x: -42, z: 290 }, { x: 40, z: 388 },
      { x: 34, z: 450 }, { x: -36, z: 548 }, { x: -30, z: 600 }, { x: 34, z: 715 },
      { x: -40, z: 770 }, { x: 42, z: 880 }, { x: -36, z: 935 }, { x: 40, z: 1040 }],
    r: 3.5, wave: 6, time: 45, cooldownWin: 120, cooldownFail: 30, leash: 26, xpFrac: 0.5, goldBase: 40, goldPerLevel: 10,
  },
  forge: { base: 120, perLevel: 30, growth: 1.045, weaponMult: 1.2 },
  // Main attacks (the Attack slot). Damage = hero damage x mult per bullet. Brawl Stars style variety.
  attacks: {
    smg: { name: 'Rapid Fire', role: 'SMG', desc: 'Each shot sprays 6 fast bullets', kind: 'tracer', count: 1, burst: 6, burstGap: 0.05, jitter: 0.11, speed: 30, range: 11, radius: 0.2, mult: 0.2, ammo: 3, reload: 1.0, cd: 0.42, color: 0xffe066, unlock: { level: 2 } },
    scatter: { name: 'Scattergun', role: 'Shotgun', desc: '5 pellets in a wide cone, brutal up close', kind: 'pellet', count: 5, spread: 0.6, speed: 24, range: 8, radius: 0.28, mult: 0.36, ammo: 3, reload: 1.2, cd: 0.35, color: 0xffa94d, unlock: { level: 3 } },
    rail: { name: 'Railshot', role: 'Sniper', desc: 'One heavy shot that pierces 2 enemies. Slow reload', kind: 'rail', count: 1, speed: 60, range: 22, radius: 0.28, mult: 2.6, ammo: 2, reload: 2.5, cd: 0.6, pierce: 2, color: 0x9fe8ff, unlock: { level: 4 } },
    seeker: { name: 'Seeker Missiles', role: 'Homing', desc: 'Two missiles that steer toward enemies and blow up', kind: 'missile', count: 2, spread: 0.55, speed: 13, range: 15, radius: 0.32, mult: 0.42, ammo: 3, reload: 1.35, cd: 0.45, homing: 6.0, aoe: 1.3, aoeMult: 0.35, color: 0xff6b6b, unlock: { level: 6 } },
    cluster: { name: 'Cluster Shell', role: 'Splitter', desc: 'A shell that bursts into 8 shards when it hits', kind: 'shell', count: 1, speed: 16, range: 11, radius: 0.45, mult: 0.6, ammo: 3, reload: 1.4, cd: 0.45, split: { n: 8, mult: 0.17, speed: 17, range: 5, r: 0.2, ring: true }, color: 0xc77dff, unlock: { level: 8 } },
    mortar: { name: 'Mortar', role: 'Lobber', desc: 'Lobs a grenade over walls that explodes where it lands', kind: 'lob', count: 1, speed: 11, range: 12, radius: 0.4, mult: 1.35, ammo: 3, reload: 1.5, cd: 0.5, lob: true, aoe: 2.4, aoeMult: 1.0, color: 0x8dff6a, unlock: { level: 10 } },
    disc: { name: 'Ricochet Disc', role: 'Bouncer', desc: 'Discs bounce off walls and trees 3 times', kind: 'disc', count: 1, speed: 22, range: 18, radius: 0.36, mult: 0.7, ammo: 3, reload: 0.95, cd: 0.3, bounce: 3, color: 0x5dd6ff, unlock: { shrines: 2 } },
    flamer: { name: 'Flamethrower', role: 'Close stream', desc: 'A short stream of fire that passes through enemies and burns', kind: 'flame', count: 1, burst: 7, burstGap: 0.04, jitter: 0.16, speed: 15, range: 6.5, radius: 0.42, mult: 0.16, ammo: 3, reload: 1.1, cd: 0.4, pierce: 99, burnMult: 0.3, color: 0xff7a2b, unlock: { level: 18 } },
    chain: { name: 'Chain Lightning', role: 'Chainer', desc: 'A bolt that jumps to 3 more enemies when it hits', kind: 'spark', count: 1, speed: 28, range: 14, radius: 0.32, mult: 0.75, ammo: 3, reload: 1.15, cd: 0.36, chain: 3, color: 0xa8c8ff, unlock: { level: 26 } },
    gatling: { name: 'Gatling', role: 'Heavy SMG', desc: 'Long bursts of 12 bullets with a wide spray', kind: 'tracer', count: 1, burst: 12, burstGap: 0.045, jitter: 0.14, speed: 32, range: 13, radius: 0.2, mult: 0.13, ammo: 3, reload: 1.3, cd: 0.6, color: 0xffd34a, unlock: { level: 38 } },
    starfall: { name: 'Starfall', role: 'Artillery', desc: 'Lobs 3 stars that land in a line and explode', kind: 'lob', count: 3, spread: 0, lobLine: 1.6, speed: 12, range: 13, radius: 0.38, mult: 0.62, ammo: 2, reload: 1.6, cd: 0.6, lob: true, aoe: 2.0, aoeMult: 1.0, color: 0xc9a6ff, unlock: { level: 52 } },
    chakram: { name: 'Chakram', role: 'Boomerang', desc: 'Flies out through everything and comes back', kind: 'chakram', count: 1, speed: 21, range: 18, radius: 0.48, mult: 0.85, ammo: 2, reload: 1.1, cd: 0.4, boomerang: true, pierce: 99, color: 0xffd34a, unlock: { bosses: 1 } },
  },
  signatures: { novice: { id: 'bolt', name: 'Arcane Bolt', role: 'Balanced' }, warrior: { id: 'wave', name: 'Blade Wave', role: 'Close range' }, ranger: { id: 'arrow', name: 'Longbow', role: 'Long range' }, mage: { id: 'orb', name: 'Arcane Orb', role: 'Area' } },
  // Artifacts add effects to your main attack (2 slots, like star powers / gadgets)
  artifactSlots: 2, // +1 at level 30
  artifacts: {
    mag: { name: 'Extended Mag', desc: '+1 ammo bar', unlock: { level: 2 } },
    splitter: { name: 'Splitter Core', desc: 'Bullets split into 3 shards when they hit', unlock: { level: 3 } },
    frost: { name: 'Frost Rounds', desc: 'Bullets slow enemies for 1.2s', unlock: { level: 4 } },
    seekerChip: { name: 'Seeker Chip', desc: 'Bullets steer toward enemies', unlock: { level: 5 } },
    trigger: { name: 'Hair Trigger', desc: '+20% fire rate and reload speed', unlock: { level: 6 } },
    pierce: { name: 'Piercing Tip', desc: 'Bullets pass through 1 extra enemy', unlock: { level: 7 } },
    ember: { name: 'Ember Rounds', desc: 'Bullets set enemies on fire', unlock: { level: 9 } },
    blast: { name: 'Blast Caps', desc: 'Bullets explode in a small blast', unlock: { level: 11 } },
    vamp: { name: 'Vampire Fang', desc: 'Heal 12% of the damage your bullets deal', unlock: { level: 13 } },
    rubber: { name: 'Rubber Coat', desc: 'Bullets bounce off walls 1 extra time', unlock: { shrines: 1 } },
    bigshot: { name: 'Big Shot', desc: '+35% bullet size and +12% damage', unlock: { bosses: 1 } },
    lens: { name: 'Crit Lens', desc: '+12% crit chance', unlock: { level: 15 } },
    coil: { name: 'Arc Coil', desc: 'Hits jump to 1 nearby enemy for 40% damage', unlock: { level: 24 } },
    giant: { name: 'Giant Slayer', desc: '+30% damage to elites and bosses', unlock: { level: 34 } },
    twin: { name: 'Twin Barrel', desc: 'Every shot fires one extra bullet at 50% damage', unlock: { level: 44 } },
    reaper: { name: 'Soul Reaper', desc: 'Kills refill 1 ammo and heal 4% HP', unlock: { level: 56 } },
  },
  // League-style keystones: every 10 levels pick 1 of 3. Free to change in town.
  keystones: [
    [{ id: 'tempo', name: 'Lethal Tempo', desc: 'Each hit gives +5% attack speed for 4s (stacks 6x)' },
     { id: 'conqueror', name: 'Conqueror', desc: 'Each hit gives +2% damage for 5s (stacks 10x). At full stacks you heal 8% of damage dealt' },
     { id: 'grasp', name: 'Grasp of the Undying', desc: 'Every 4s your next hit deals +4% of your max HP as damage and heals you 3%' }],
    [{ id: 'phase', name: 'Phase Rush', desc: '3 hits within 3s give +40% move speed for 2s' },
     { id: 'secondWind', name: 'Second Wind', desc: 'Start healing after 1.5s out of combat, and heal twice as fast' },
     { id: 'execute', name: 'Executioner', desc: '+25% damage to enemies below 35% HP' }],
    [{ id: 'electrocute', name: 'Electrocute', desc: '3 hits on the same enemy within 3s strike it with lightning for 150% damage (4s cooldown)' },
     { id: 'comet', name: 'Arcane Comet', desc: 'Every 5s your next hit calls down a comet: 120% damage in an area' },
     { id: 'aftershock', name: 'Aftershock', desc: 'Dashing gives 40% damage reduction for 2s, then a shockwave hits nearby enemies' }],
    [{ id: 'bloodthirst', name: 'Bloodthirst', desc: '+8% lifesteal on everything' },
     { id: 'titan', name: 'Titan', desc: '+20% max HP and +8% damage reduction' },
     { id: 'glass', name: 'Glass Cannon', desc: '+22% damage, -12% max HP' }],
    [{ id: 'kraken', name: 'Kraken Slayer', desc: 'Every 3rd hit deals +70% bonus damage' },
     { id: 'sunfire', name: 'Sunfire Aura', desc: 'Burn enemies within 4m for 35% of your damage every second' },
     { id: 'storm', name: 'Storm Surge', desc: 'Enemies you kill explode for 60% damage around them' }],
    [{ id: 'infinity', name: 'Infinity Core', desc: '+10% crit chance and crits deal +60% more' },
     { id: 'undying', name: 'Undying Rage', desc: 'Once per 60s, survive a lethal hit and become untouchable for 1.5s' },
     { id: 'ascend', name: 'Ascendant Echo', desc: '+40% super charge and -30% special and skill cooldowns' }],
  ],
  // RuneScape-style masteries, levels 1-99 on the classic XP curve (scaled). Earned by doing the thing.
  mastery: {
    max: 99, xpScale: 20, killXp: 10, perLevel: { weapon: 0.004, slayer: 0.003, slayerDrop: 0.005, smith: 0.003, scav: 0.005 },
    skills: { smith: { name: 'Smithing', desc: 'Upgrade and salvage gear. Each level: -0.3% upgrade cost' }, scav: { name: 'Scavenging', desc: 'Collect orbs, berries and loot. Each level: +0.5% gold' } },
  },
  economy: { premiumCurrency: null },
};

