// ---- v9 monsters: two per area (see the area guide). Each reuses a body ("base") from the 14 sculpted
// monsters with its own tint, size and fighting style until it gets bespoke art. ------------------------
const MON_KIT = {
  swarm: { hp: 44, atk: 9, speed: 6.0, r: 0.7, aggro: 12, leash: 26, attack: 'touch', cd: 0.75, gold: [3, 6], lunge: true, moves: ['pounce', 'howl'] },
  charger: { hp: 74, atk: 12, speed: 4.4, r: 0.85, aggro: 10, leash: 24, attack: 'touch', cd: 1.1, gold: [3, 7], charge: true, moves: ['trample'] },
  brute: { hp: 125, atk: 16, speed: 3.3, r: 1.0, aggro: 9, leash: 24, attack: 'touch', cd: 1.45, gold: [5, 9], heavy: true, moves: ['cleave', 'slam'] },
  ambusher: { hp: 92, atk: 15, speed: 4.2, r: 0.9, aggro: 6, leash: 22, attack: 'touch', cd: 1.2, gold: [4, 8], lunge: true, heavy: true, moves: ['cleave', 'pounce'] },
  shooter: { hp: 56, atk: 9, speed: 4.0, r: 0.72, aggro: 13, leash: 26, attack: 'shoot', cd: 1.5, gold: [3, 7], shotSpeed: 12, keep: 8, shots: 1, moves: ['snipe'] },
  spray: { hp: 62, atk: 8, speed: 4.2, r: 0.75, aggro: 13, leash: 28, attack: 'shoot', cd: 1.8, gold: [4, 8], shotSpeed: 11, keep: 9, shots: 3, spread: 0.5, moves: ['mortar'] },
  turret: { hp: 90, atk: 9, speed: 1.8, r: 0.9, aggro: 15, leash: 20, attack: 'shoot', cd: 2.2, gold: [4, 9], shotSpeed: 10, keep: 11, shots: 5, spread: 0.9, moves: ['nova'] },
};
// Telegraphed monster moves (run by "monster moves" in 33-world-sim). wind = red warning before it lands, cd = seconds
// between uses, min/max = hero distance that starts it, mult = mobDmg multiplier, r = hit radius, marks = pendingAoE
// markers it places (a move only starts if every one of them can be drawn).
// Kits keep their default lists; species swap in variants through extra.moves so each biome fights differently:
//   biome      spray            swarm          charger          brute            turret        shooter / ambusher
//   Woodlands  mortar           pounce·howl    spikes           cleave·spikes    -             snipe / cleave·pounce
//   Mountain   trap (ice/web)   +mirror        burrow·spikes    cleave·slam      nova          boomerang / burrow
//   Volcanic   breath (cone)    pounce·pool    trample          spikes·pool      -             - / cleave·pounce
//   Arcane     zap (chain)      +trap          spikes·slam      vortex·quake     spiral        - / +mirror
//   Ocean      vortex·zap       burrow         vortex·spikes    spikes·pool      nova·zap      trap / burrow
//   Celestial  breath·zap       pounce·howl    spikes·slam      quake·vortex     spiral        zap·boomerang
const MON_MOVES = {
  cleave: { wind: 0.5, cd: [2.6, 3.6], max: 2.6, r: 2.2, ahead: 1.3, mult: 1.2, marks: 1 }, // hugging a brute is no longer safe
  slam: { wind: 0.8, cd: [5.5, 6.5], max: 3.4, r: 3.2, mult: 1.6, marks: 1 },
  pounce: { wind: 0.7, cd: [4.5, 6], min: 4, max: 9, r: 1.8, leap: 0.3, lead: 0.35, mult: 1.3, marks: 1 },
  trample: { r: 1.3, every: 1.4, dur: 3, mult: 0.3 }, // rides the charge lane; burning chargers leave clouds behind
  snipe: { wind: 0.7, cd: [4.5, 6], min: 4, max: 14, len: 14, speed: 26, mult: 2.2 },
  mortar: { wind: 0.5, fly: 1.1, cd: [5, 7], min: 4, max: 13, r: 1.8, n: 3, gap: 2.6, lead: 0.5, mult: 1.1, marks: 3 },
  nova: { wind: 0.6, cd: [5, 7], max: 12, n: 14, speed: 7, mult: 0.8 },
  pool: { wind: 0.9, cd: [6, 8], max: 10, r: 2.2, dur: 3, mult: 0.35 },
  howl: { r: 8, dur: 3, speed: 0.4 }, // a pack-mate falls nearby: the rest frenzy
  breath: { wind: 0.8, cd: [5, 7], max: 6, r: 7, half: 0.52, mult: 1.3, marks: 1 }, // 60° cone from the mouth: step out sideways or back off (breathers hover closer, keep 5.5)
  spikes: { wind: 0.6, cd: [5, 7], min: 2, max: 9, n: 6, gap: 1.6, r: 1, step: 0.12, mult: 1.2, marks: 6 }, // erupt outward along the aim, one hit per line
  quake: { wind: 0.9, cd: [6, 8], min: 2, max: 4.5, gap: 1.2, w: 3, mult: 1.4, marks: 1 }, // donut: hug the monster or get clear
  vortex: { wind: 0.8, cd: [7, 9], min: 3, max: 10, r: 2, pullR: 5.5, pull: 2.2, dur: 1.5, mult: 1.6, marks: 1 }, // drags you in, then slams the eye
  spiral: { wind: 0.7, cd: [8, 10], max: 6, arms: 3, every: 0.13, step: 0.38, speed: 7, life: 0.95, dur: 2.2, mult: 0.3 }, // short-range sprinkler: back off
  boomerang: { wind: 0.6, cd: [4.5, 6], min: 3, max: 12, len: 12, speed: 14, mult: 0.9 }, // out along the lane, then home to the thrower
  burrow: { wind: 1.1, lock: 0.45, cd: [6, 8], min: 3, max: 10, r: 2, mult: 1.4, marks: 1 }, // sinks, the marker stalks you, locks, erupts
  zap: { wind: 0.6, cd: [5, 7], min: 3, max: 12, n: 3, hop: 0.25, r: 1.6, mult: 1, marks: 3 }, // three hops toward you, one hit per chain
  trap: { wind: 0.8, cd: [6, 8], min: 3, max: 11, r: 2.2, slow: 1.5, dur: 4, mult: 0.5, tick: 0.15, marks: 1 }, // slowing patch that lingers
  mirror: { wind: 0.8, cd: [14, 18], max: 12, n: 2, hp: 0.3, life: 12, elite: true }, // elites only: two frail copies
};
// id: [name, kit, base body, tint, size, extra]
const MON_ROWS = {
  thistlehare: ['Thistle-Hare', 'spray', 'boar', 0xe8cf98, 0.72, { hp: 40, atk: 7, aggro: 8, keep: 7, cd: 2.0, shots: 2, shotSpeed: 12, shotColor: 0xe8e0a0, spread: 0.36 }],
  hornet: ['Sun-Drunk Hornet', 'swarm', 'imp', 0xffd23a, 0.78, { hp: 38, atk: 7, aggro: 7, speed: 6.2 }],
  truffleboar: ['Truffle-Grubbing Boar', 'charger', 'boar', 0xa07858, 1.05, { hp: 86, moves: ['spikes'] }],
  myconid: ['Myconid Spore-Tosser', 'shooter', 'slime', 0xd77cff, 1.2, { aggro: 9, burn: 0.25, shotColor: 0xd77cff, shots: 2, spread: 0.4 }],
  bramble: ['Bramble-Lasher', 'brute', 'spider', 0x6a7a3a, 1.25, { speed: 1.6, aggro: 6, cd: 1.1, moves: ['cleave', 'spikes'] }],
  barkviper: ['Bark-Scale Viper', 'ambusher', 'crawler', 0x8a6a48, 0.95, { speed: 5.2 }],
  thornbeetle: ['Thorn-Carapace Beetle', 'charger', 'beetle', 0x7f9a5a, 1.1, { hp: 110, heavy: true }],
  gloompanther: ['Gloom-Panther', 'swarm', 'wolf', 0x3a3456, 1.05, { hp: 58, atk: 12, speed: 6.6, aggro: 10 }],
  craggoat: ['Crag-Goat', 'charger', 'boar', 0xc8c0b0, 0.95, { heavy: true }],
  dustharpy: ['Dust-Harpy', 'shooter', 'fireimp', 0xd8b080, 1.0, { atk: 12, shotSpeed: 10, cd: 1.7, shotColor: 0xa08a70, moves: ['boomerang', 'snipe'] }],
  bouldermimic: ['Boulder-Mimic', 'ambusher', 'crawler', 0x9a9a92, 1.25, { hp: 150, speed: 3.2, aggro: 5, moves: ['cleave', 'burrow'] }],
  galeweaver: ['Gale-Weaver', 'spray', 'spider', 0xdfe6ee, 1.0, { shotColor: 0xe6f2ff, shots: 2, spread: 0.6, moves: ['trap', 'mortar'] }],
  miragestalker: ['Mirage-Stalker', 'swarm', 'wolf', 0xe8c890, 1.0, { hp: 52, atk: 11, moves: ['mirror', 'pounce', 'howl'] }],
  pitfallwurm: ['Pitfall-Wurm', 'charger', 'crawler', 0xc89a7a, 1.15, { hp: 96, moves: ['burrow', 'spikes'] }],
  frostgargoyle: ['Frost-Gargoyle', 'ambusher', 'imp', 0x5a6a80, 1.2, {}],
  chillbanshee: ['Chill-Banshee', 'spray', 'wraith', 0xbfe6ff, 1.0, { shotColor: 0x9fe8ff, moves: ['trap', 'mortar'] }],
  glacialtroll: ['Glacial-Troll', 'brute', 'yeti', 0xd8f0ff, 1.08, { hp: 140 }],
  iceshard: ['Ice-Shard Elemental', 'turret', 'sentinel', 0x9fe8ff, 0.95, { shotColor: 0xbff4ff }],
  screecrawler: ['Scree-Crawler', 'swarm', 'crawler', 0x9a8a7a, 1.0, { hp: 54 }],
  echobat: ['Echo-Bat', 'spray', 'fireimp', 0x6a5a88, 0.85, { shotColor: 0xc8a8ff, shotSpeed: 14, keep: 5.5, moves: ['breath', 'mortar'] }],
  sulfurslime: ['Sulfur-Slime', 'brute', 'slime', 0xe0d84a, 1.25, { speed: 3.0, burn: 0.35 }],
  fumetoad: ['Fume-Toad', 'spray', 'slime', 0x8a9a3a, 1.5, { burn: 0.3, shotColor: 0xb8d040, shotSpeed: 9, keep: 5.5, moves: ['breath', 'pool'] }],
  magmahound: ['Magma-Hound', 'swarm', 'wolf', 0xff7a3a, 1.05, { burn: 0.3 }],
  cinderelemental: ['Cinder-Elemental', 'brute', 'fireimp', 0xe8e0d8, 1.2, { burn: 0.35, moves: ['cleave', 'spikes', 'pool'] }],
  ashstalker: ['Ash-Stalker', 'ambusher', 'wolf', 0x8a8480, 1.1, {}],
  emberwraith: ['Ember-Wraith', 'spray', 'wraith', 0xff8a3a, 1.0, { burn: 0.25, shotColor: 0xff8a3a, keep: 5.5, moves: ['breath', 'pool'] }],
  scoriascorpion: ['Scoria-Scorpion', 'charger', 'beetle', 0xff9a6a, 1.35, { hp: 120, burn: 0.3, heavy: true }],
  flamewyrm: ['Flame-Wyrm', 'spray', 'fireimp', 0xff5a2a, 1.3, { burn: 0.3, shotColor: 0xff6a1f, keep: 5.5, moves: ['breath', 'mortar', 'pool'] }],
  manaleech: ['Mana-Leech', 'swarm', 'crawler', 0x4a8aff, 0.85, { hp: 48 }],
  azuregolem: ['Azure-Golem', 'brute', 'warden', 0x6a9aff, 1.05, { charge: true, hp: 150, moves: ['cleave', 'vortex'] }],
  riftspider: ['Rift-Spider', 'swarm', 'spider', 0xa06aff, 1.1, { speed: 7.0, moves: ['pounce', 'howl', 'trap'] }],
  geodrone: ['Geometry-Drone', 'turret', 'sentinel', 0xb08aff, 1.0, { shotColor: 0xc77dff, moves: ['spiral', 'nova'] }],
  voidray: ['Void-Ray', 'spray', 'wraith', 0x2a5a7a, 1.15, { shotColor: 0x4fd8ff, moves: ['zap', 'mortar'] }],
  asteroidhermit: ['Asteroid-Hermit', 'brute', 'crawler', 0x7a7088, 1.4, { hp: 175, speed: 2.6, moves: ['slam', 'vortex'] }],
  prismmimic: ['Prism-Mimic', 'ambusher', 'slime', 0xd0f4ff, 1.0, { speed: 5.6, moves: ['mirror', 'cleave', 'pounce'] }],
  glassminotaur: ['Glass-Minotaur', 'charger', 'yeti', 0xbfe8ff, 1.1, { hp: 140, heavy: true, moves: ['spikes', 'slam'] }],
  starsentry: ['Starlight-Sentry', 'brute', 'warden', 0xfff0c0, 1.0, { charge: true, moves: ['cleave', 'quake'] }],
  astronomer: ['Fallen-Astronomer', 'spray', 'wraith', 0x6a5fc9, 1.05, { shots: 2, spread: 0.36, shotColor: 0xc77dff, moves: ['zap', 'mortar'] }],
  nebulajelly: ['Nebula-Jellyfish', 'turret', 'sentinel', 0xff9bf2, 0.95, { speed: 2.4, shotColor: 0xff9bf2, moves: ['nova', 'zap'] }],
  kelpie: ['Ruins-Kelpie', 'charger', 'boar', 0x2fbfa0, 1.1, { moves: ['vortex', 'spikes'] }],
  rapidsiren: ['Rapids-Siren', 'spray', 'drowned', 0x7fd0ff, 1.0, { shotColor: 0x7fd0ff, moves: ['vortex', 'mortar'] }],
  thrasher: ['Current-Thrasher', 'charger', 'crawler', 0x5a7a9a, 1.15, { speed: 5.0, moves: ['spikes', 'burrow'] }],
  sporeurchin: ['Spore-Urchin', 'brute', 'slime', 0x4fffb0, 1.1, { burn: 0.3, speed: 2.4, moves: ['spikes', 'slam', 'pool'] }],
  angler: ['Grotto-Angler', 'ambusher', 'beetle', 0x2a4a8a, 1.2, { moves: ['cleave', 'burrow'] }],
  trenchcrawler: ['Trench-Crawler', 'swarm', 'crawler', 0x2a3a4a, 1.0, { hp: 60, burn: 0.15, moves: ['burrow', 'howl', 'pool'] }],
  pressuresquid: ['Pressure-Squid', 'shooter', 'drowned', 0x7a3a9a, 1.05, { shotSpeed: 17, atk: 13, shotColor: 0x3a1a5a, moves: ['snipe', 'trap'] }],
  leviathan: ['Eldritch-Leviathan', 'charger', 'crawler', 0x1a3a40, 1.6, { hp: 160, heavy: true, moves: ['vortex', 'slam'] }],
  abyssphantom: ['Abyssal-Phantom', 'spray', 'wraith', 0x2fffd0, 1.0, { shotColor: 0x2fffd0, moves: ['zap', 'mortar'] }],
  boilcrab: ['Boil-Crab', 'brute', 'crawler', 0xff6a4a, 1.3, { burn: 0.3, moves: ['cleave', 'quake', 'pool'] }],
  steamelemental: ['Steam-Elemental', 'spray', 'wraith', 0xf0f0f4, 1.1, { burn: 0.3, shotColor: 0xffffff, keep: 5.5, moves: ['breath', 'pool'] }],
  shaftvulture: ['Shaft-Vulture', 'swarm', 'imp', 0x4a3a30, 1.1, { speed: 7.0 }],
  obsidiangargoyle: ['Obsidian-Gargoyle', 'charger', 'fireimp', 0x2a2236, 1.2, { heavy: true, hp: 120, moves: ['spikes', 'slam'] }],
  lightningwyvern: ['Lightning-Wyvern', 'shooter', 'imp', 0xfff04a, 1.25, { shotSpeed: 18, shots: 2, spread: 0.3, shotColor: 0xfff04a, moves: ['snipe', 'zap'] }],
  cyclone: ['Cyclone-Elemental', 'turret', 'sentinel', 0xd8e0ea, 1.1, { speed: 3.2, shots: 6, spread: 1.4, shotColor: 0xe6f2ff, moves: ['spiral', 'vortex'] }],
  aetherray: ['Aether-Ray', 'spray', 'seraph', 0xc8b8ff, 1.0, { shotColor: 0xc8b8ff, keep: 5.5, moves: ['zap', 'breath'] }],
  halosentinel: ['Halo-Sentinel', 'turret', 'sentinel', 0xffd86a, 1.05, { shotColor: 0xffd86a, moves: ['spiral', 'nova'] }],
  archon: ['Spire-Archon', 'shooter', 'seraph', 0xffffff, 1.2, { shots: 3, spread: 0.3, atk: 11, shotColor: 0xfff07a, moves: ['snipe', 'boomerang'] }],
  cosmicweaver: ['Cosmic-Weaver', 'brute', 'warden', 0x9a7aff, 1.1, { charge: true, hp: 160, moves: ['quake', 'vortex'] }],
};
for (const k in CFG.enemies) if (CFG.enemies[k] && CFG.enemies[k].hp) CFG.enemies[k].legacy = true; // the old monsters stay for saves, Rift themes and records
for (const id in MON_ROWS) {
  const [name, kit, base, tint, scale, extra] = MON_ROWS[id];
  // heavy species also slam, burning ones spit pools; extra.moves replaces the list outright
  const mv = MON_KIT[kit].moves.slice(); if (extra.heavy && !mv.includes('slam')) mv.push('slam'); if (extra.burn) mv.push('pool');
  CFG.enemies[id] = Object.assign({}, MON_KIT[kit], { name, kit, base, tint, scale, r: +(MON_KIT[kit].r * Math.sqrt(scale)).toFixed(2), moves: mv }, extra);
}
const enemyBase = (type) => (CFG.enemies[type] && CFG.enemies[type].base) || type;
for (const c in CFG.signatures) {
  const sg = CFG.signatures[c];
  CFG.attacks[sg.id] = Object.assign({ signature: c, name: sg.name, role: sg.role, desc: 'Signature attack of the ' + CFG.classes[c].name }, CFG.classes[c].weapon);
}
// ---- World bosses: two per biome, one rises at random every few minutes (see "world boss" in 33-world-sim).
// body = 'golem' (the sculpted golem) or a monster base drawn huge; tint/core = colours; scale = view size; r = hit radius.
// moves = boss patterns (BOSS_PATTERNS); rage = patterns added below half HP, when it also attacks faster.
// They are built to be near-unkillable alone at your own level: bring the other heroes, or come back far stronger.
const WORLD_BOSSES = {
  golem: { name: 'Ancient Golem', title: 'Heart of the Old Stones', biome: 0, body: 'golem', r: 2.4, speed: 2.2,
    moves: ['slam', 'spikeFan', 'rockRing', 'quake'], rage: ['vortex', 'leap'] },
  broodmother: { name: 'Vexa the Brood Mother', title: 'Queen of the Hollow Oak', biome: 0, body: 'spider', tint: 0x4a6a2a, core: 0xb6ff4f, scale: 3.2, r: 2.6, speed: 3.0, shot: 0xb6ff4f,
    moves: ['webVolley', 'leap', 'spikeFan', 'brood'], rage: ['spiral', 'pools'] },
  frostcolossus: { name: 'Frost Colossus', title: 'The Avalanche That Walks', biome: 1, body: 'yeti', tint: 0xcfe8ff, core: 0x7fe3ff, scale: 2.6, r: 2.6, speed: 2.0, shot: 0xbff4ff, slow: true,
    moves: ['coreQuake', 'meteor', 'breathSweep', 'spikeCross'], rage: ['webVolley', 'leap'] },
  stormroc: { name: 'Stormcrag Roc', title: 'Rider of the Thunderheads', biome: 1, body: 'imp', tint: 0xbfd0e0, core: 0xfff04a, scale: 3.0, r: 2.3, speed: 3.2, shot: 0xfff04a,
    moves: ['beams', 'vortex', 'zapStorm', 'rockRing'], rage: ['spiral', 'meteor'] },
  magmatitan: { name: 'Magma Titan', title: 'Forge-Heart of the Underworld', biome: 2, body: 'warden', tint: 0x6a3020, core: 0xff5a1f, scale: 2.5, r: 2.6, speed: 1.9, shot: 0xff6a1f, burn: true,
    moves: ['meteor', 'breathSweep', 'quake', 'pools'], rage: ['coreQuake', 'leap'] },
  cinderwyrm: { name: 'Cinder Wyrm', title: 'Ash on Black Wings', biome: 2, body: 'fireimp', tint: 0xff5a2a, core: 0xffb347, scale: 2.9, r: 2.4, speed: 2.8, shot: 0xff6a1f, burn: true,
    moves: ['breathSweep', 'meteor', 'spiral', 'pools'], rage: ['beams', 'novaRings'] },
  voidcolossus: { name: 'Void Colossus', title: 'Geometry of the End', biome: 3, body: 'sentinel', tint: 0x6a5aff, core: 0xc77dff, scale: 2.8, r: 2.5, speed: 2.0, shot: 0xc77dff,
    moves: ['novaRings', 'spiral', 'blink', 'vortex'], rage: ['beams', 'brood'] },
  riftweaver: { name: 'The Riftweaver', title: 'Thread-Cutter of the Ruins', biome: 3, body: 'wraith', tint: 0x8a5aff, core: 0x4fd8ff, scale: 2.8, r: 2.3, speed: 3.0, shot: 0x4fd8ff,
    moves: ['blink', 'zapStorm', 'beams', 'webVolley'], rage: ['spiral', 'meteor'] },
  leviathan: { name: 'Abyssal Leviathan', title: 'It Sleeps Beneath the Wrecks', biome: 4, body: 'crawler', tint: 0x1d5560, core: 0x2fffd0, scale: 2.8, r: 2.8, speed: 2.4, shot: 0x2fffd0,
    moves: ['burrowStalk', 'tidalWave', 'vortex', 'zapStorm'], rage: ['novaRings', 'brood'] },
  drownedking: { name: 'The Drowned King', title: 'Crown of Barnacles', biome: 4, body: 'drowned', tint: 0x2a8a9a, core: 0x7fd0ff, scale: 2.8, r: 2.4, speed: 2.6, shot: 0x7fd0ff,
    moves: ['tidalWave', 'webVolley', 'beams', 'vortex'], rage: ['spiral', 'blink'] },
  celestialcolossus: { name: 'Celestial Colossus', title: 'Keeper of the Dawn Gate', biome: 5, body: 'golem', r: 2.4, speed: 2.2,
    moves: ['beams', 'meteor', 'coreQuake', 'novaRings'], rage: ['blink', 'spikeCross'] },
  dawnseraph: { name: 'Seraph of Dawn', title: 'Six Wings, No Mercy', biome: 5, body: 'seraph', tint: 0xfff0c0, core: 0xfff07a, scale: 2.9, r: 2.3, speed: 3.0, shot: 0xfff07a,
    moves: ['beams', 'spiral', 'zapStorm', 'blink'], rage: ['meteor', 'novaRings'] },
};
