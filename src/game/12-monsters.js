// ---- v9 monsters: two per area (see the area guide). Each reuses a body ("base") from the 14 sculpted
// monsters with its own tint, size and fighting style until it gets bespoke art. ------------------------
const MON_KIT = {
  swarm: { hp: 44, atk: 9, speed: 6.0, r: 0.7, aggro: 12, leash: 26, attack: 'touch', cd: 0.75, gold: [3, 6], lunge: true },
  charger: { hp: 74, atk: 12, speed: 4.4, r: 0.85, aggro: 10, leash: 24, attack: 'touch', cd: 1.1, gold: [3, 7], charge: true },
  brute: { hp: 125, atk: 16, speed: 3.3, r: 1.0, aggro: 9, leash: 24, attack: 'touch', cd: 1.45, gold: [5, 9], heavy: true },
  ambusher: { hp: 92, atk: 15, speed: 4.2, r: 0.9, aggro: 6, leash: 22, attack: 'touch', cd: 1.2, gold: [4, 8], lunge: true, heavy: true },
  shooter: { hp: 56, atk: 9, speed: 4.0, r: 0.72, aggro: 13, leash: 26, attack: 'shoot', cd: 1.5, gold: [3, 7], shotSpeed: 12, keep: 8, shots: 1 },
  spray: { hp: 62, atk: 8, speed: 4.2, r: 0.75, aggro: 13, leash: 28, attack: 'shoot', cd: 1.8, gold: [4, 8], shotSpeed: 11, keep: 9, shots: 3, spread: 0.5 },
  turret: { hp: 90, atk: 9, speed: 1.8, r: 0.9, aggro: 15, leash: 20, attack: 'shoot', cd: 2.2, gold: [4, 9], shotSpeed: 10, keep: 11, shots: 5, spread: 0.9 },
};
// id: [name, kit, base body, tint, size, extra]
const MON_ROWS = {
  thistlehare: ['Thistle-Hare', 'spray', 'boar', 0xe8cf98, 0.72, { hp: 40, atk: 7, aggro: 8, keep: 7, cd: 2.0, shots: 2, shotSpeed: 12, shotColor: 0xe8e0a0, spread: 0.36 }],
  hornet: ['Sun-Drunk Hornet', 'swarm', 'imp', 0xffd23a, 0.78, { hp: 38, atk: 7, aggro: 7, speed: 6.2 }],
  truffleboar: ['Truffle-Grubbing Boar', 'charger', 'boar', 0xa07858, 1.05, { hp: 86 }],
  myconid: ['Myconid Spore-Tosser', 'shooter', 'slime', 0xd77cff, 1.2, { aggro: 9, burn: 0.25, shotColor: 0xd77cff, shots: 2, spread: 0.4 }],
  bramble: ['Bramble-Lasher', 'brute', 'spider', 0x6a7a3a, 1.25, { speed: 1.6, aggro: 6, cd: 1.1 }],
  barkviper: ['Bark-Scale Viper', 'ambusher', 'crawler', 0x8a6a48, 0.95, { speed: 5.2 }],
  thornbeetle: ['Thorn-Carapace Beetle', 'charger', 'beetle', 0x7f9a5a, 1.1, { hp: 110, heavy: true }],
  gloompanther: ['Gloom-Panther', 'swarm', 'wolf', 0x3a3456, 1.05, { hp: 58, atk: 12, speed: 6.6, aggro: 10 }],
  craggoat: ['Crag-Goat', 'charger', 'boar', 0xc8c0b0, 0.95, { heavy: true }],
  dustharpy: ['Dust-Harpy', 'shooter', 'fireimp', 0xd8b080, 1.0, { atk: 12, shotSpeed: 10, cd: 1.7, shotColor: 0xa08a70 }],
  bouldermimic: ['Boulder-Mimic', 'ambusher', 'crawler', 0x9a9a92, 1.25, { hp: 150, speed: 3.2, aggro: 5 }],
  galeweaver: ['Gale-Weaver', 'spray', 'spider', 0xdfe6ee, 1.0, { shotColor: 0xe6f2ff, shots: 2, spread: 0.6 }],
  miragestalker: ['Mirage-Stalker', 'swarm', 'wolf', 0xe8c890, 1.0, { hp: 52, atk: 11 }],
  pitfallwurm: ['Pitfall-Wurm', 'charger', 'crawler', 0xc89a7a, 1.15, { hp: 96 }],
  frostgargoyle: ['Frost-Gargoyle', 'ambusher', 'imp', 0x5a6a80, 1.2, {}],
  chillbanshee: ['Chill-Banshee', 'spray', 'wraith', 0xbfe6ff, 1.0, { shotColor: 0x9fe8ff }],
  glacialtroll: ['Glacial-Troll', 'brute', 'yeti', 0xd8f0ff, 1.08, { hp: 140 }],
  iceshard: ['Ice-Shard Elemental', 'turret', 'sentinel', 0x9fe8ff, 0.95, { shotColor: 0xbff4ff }],
  screecrawler: ['Scree-Crawler', 'swarm', 'crawler', 0x9a8a7a, 1.0, { hp: 54 }],
  echobat: ['Echo-Bat', 'spray', 'fireimp', 0x6a5a88, 0.85, { shotColor: 0xc8a8ff, shotSpeed: 14 }],
  sulfurslime: ['Sulfur-Slime', 'brute', 'slime', 0xe0d84a, 1.25, { speed: 3.0, burn: 0.35 }],
  fumetoad: ['Fume-Toad', 'spray', 'slime', 0x8a9a3a, 1.5, { burn: 0.3, shotColor: 0xb8d040, shotSpeed: 9 }],
  magmahound: ['Magma-Hound', 'swarm', 'wolf', 0xff7a3a, 1.05, { burn: 0.3 }],
  cinderelemental: ['Cinder-Elemental', 'brute', 'fireimp', 0xe8e0d8, 1.2, { burn: 0.35 }],
  ashstalker: ['Ash-Stalker', 'ambusher', 'wolf', 0x8a8480, 1.1, {}],
  emberwraith: ['Ember-Wraith', 'spray', 'wraith', 0xff8a3a, 1.0, { burn: 0.25, shotColor: 0xff8a3a }],
  scoriascorpion: ['Scoria-Scorpion', 'charger', 'beetle', 0xff9a6a, 1.35, { hp: 120, burn: 0.3, heavy: true }],
  flamewyrm: ['Flame-Wyrm', 'spray', 'fireimp', 0xff5a2a, 1.3, { burn: 0.3, shotColor: 0xff6a1f }],
  manaleech: ['Mana-Leech', 'swarm', 'crawler', 0x4a8aff, 0.85, { hp: 48 }],
  azuregolem: ['Azure-Golem', 'brute', 'warden', 0x6a9aff, 1.05, { charge: true, hp: 150 }],
  riftspider: ['Rift-Spider', 'swarm', 'spider', 0xa06aff, 1.1, { speed: 7.0 }],
  geodrone: ['Geometry-Drone', 'turret', 'sentinel', 0xb08aff, 1.0, { shotColor: 0xc77dff }],
  voidray: ['Void-Ray', 'spray', 'wraith', 0x2a5a7a, 1.15, { shotColor: 0x4fd8ff }],
  asteroidhermit: ['Asteroid-Hermit', 'brute', 'crawler', 0x7a7088, 1.4, { hp: 175, speed: 2.6 }],
  prismmimic: ['Prism-Mimic', 'ambusher', 'slime', 0xd0f4ff, 1.0, { speed: 5.6 }],
  glassminotaur: ['Glass-Minotaur', 'charger', 'yeti', 0xbfe8ff, 1.1, { hp: 140, heavy: true }],
  starsentry: ['Starlight-Sentry', 'brute', 'warden', 0xfff0c0, 1.0, { charge: true }],
  astronomer: ['Fallen-Astronomer', 'spray', 'wraith', 0x6a5fc9, 1.05, { shots: 2, spread: 0.36, shotColor: 0xc77dff }],
  nebulajelly: ['Nebula-Jellyfish', 'turret', 'sentinel', 0xff9bf2, 0.95, { speed: 2.4, shotColor: 0xff9bf2 }],
  kelpie: ['Ruins-Kelpie', 'charger', 'boar', 0x2fbfa0, 1.1, {}],
  rapidsiren: ['Rapids-Siren', 'spray', 'drowned', 0x7fd0ff, 1.0, { shotColor: 0x7fd0ff }],
  thrasher: ['Current-Thrasher', 'charger', 'crawler', 0x5a7a9a, 1.15, { speed: 5.0 }],
  sporeurchin: ['Spore-Urchin', 'brute', 'slime', 0x4fffb0, 1.1, { burn: 0.3, speed: 2.4 }],
  angler: ['Grotto-Angler', 'ambusher', 'beetle', 0x2a4a8a, 1.2, {}],
  trenchcrawler: ['Trench-Crawler', 'swarm', 'crawler', 0x2a3a4a, 1.0, { hp: 60, burn: 0.15 }],
  pressuresquid: ['Pressure-Squid', 'shooter', 'drowned', 0x7a3a9a, 1.05, { shotSpeed: 17, atk: 13, shotColor: 0x3a1a5a }],
  leviathan: ['Eldritch-Leviathan', 'charger', 'crawler', 0x1a3a40, 1.6, { hp: 160, heavy: true }],
  abyssphantom: ['Abyssal-Phantom', 'spray', 'wraith', 0x2fffd0, 1.0, { shotColor: 0x2fffd0 }],
  boilcrab: ['Boil-Crab', 'brute', 'crawler', 0xff6a4a, 1.3, { burn: 0.3 }],
  steamelemental: ['Steam-Elemental', 'spray', 'wraith', 0xf0f0f4, 1.1, { burn: 0.3, shotColor: 0xffffff }],
  shaftvulture: ['Shaft-Vulture', 'swarm', 'imp', 0x4a3a30, 1.1, { speed: 7.0 }],
  obsidiangargoyle: ['Obsidian-Gargoyle', 'charger', 'fireimp', 0x2a2236, 1.2, { heavy: true, hp: 120 }],
  lightningwyvern: ['Lightning-Wyvern', 'shooter', 'imp', 0xfff04a, 1.25, { shotSpeed: 18, shots: 2, spread: 0.3, shotColor: 0xfff04a }],
  cyclone: ['Cyclone-Elemental', 'turret', 'sentinel', 0xd8e0ea, 1.1, { speed: 3.2, shots: 6, spread: 1.4, shotColor: 0xe6f2ff }],
  aetherray: ['Aether-Ray', 'spray', 'seraph', 0xc8b8ff, 1.0, { shotColor: 0xc8b8ff }],
  halosentinel: ['Halo-Sentinel', 'turret', 'sentinel', 0xffd86a, 1.05, { shotColor: 0xffd86a }],
  archon: ['Spire-Archon', 'shooter', 'seraph', 0xffffff, 1.2, { shots: 3, spread: 0.3, atk: 11, shotColor: 0xfff07a }],
  cosmicweaver: ['Cosmic-Weaver', 'brute', 'warden', 0x9a7aff, 1.1, { charge: true, hp: 160 }],
};
for (const k in CFG.enemies) if (CFG.enemies[k] && CFG.enemies[k].hp) CFG.enemies[k].legacy = true; // the old monsters stay for saves, Rift themes and records
for (const id in MON_ROWS) {
  const [name, kit, base, tint, scale, extra] = MON_ROWS[id];
  CFG.enemies[id] = Object.assign({}, MON_KIT[kit], { name, kit, base, tint, scale, r: +(MON_KIT[kit].r * Math.sqrt(scale)).toFixed(2) }, extra);
}
const enemyBase = (type) => (CFG.enemies[type] && CFG.enemies[type].base) || type;
for (const c in CFG.signatures) {
  const sg = CFG.signatures[c];
  CFG.attacks[sg.id] = Object.assign({ signature: c, name: sg.name, role: sg.role, desc: 'Signature attack of the ' + CFG.classes[c].name }, CFG.classes[c].weapon);
}
