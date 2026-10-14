// The 27 painted heroes of the Codex (v6): Z-Image Turbo concepts -> TRELLIS.2 meshes -> bone-heat rig on the
// 15-joint adventurer skeleton (tools/v4_* + tools/v6_*). Each hero is its own brawler with a themed basic attack,
// its own ammunition (assets/data/hero-fx-v6.js draws it) and a data-driven super (assets/data/hero-supers-v6.js).
// Numbers come from assets/heroes/combat_kits.json, tuned to the game's scale (BA = the hero's damage stat).
//
// attack: the game's weapon parameters (kind picks flight + sound; the look comes from ammo.shape).
// ammo:   shape (see AMMO in hero-fx-v6.js), body/glow colours and the trail it leaves.
// impact: sprite + palette for the hit, plus an optional themed decal.
// super:  { name, short, desc, aim, clip, ops: [...] } — every op runs at `at` seconds after the cast.

const C = (h) => h; // colours are plain hex numbers

export const HEROES_V6 = [
  // ------------------------------------------------------------------ champions
  {
    id: 'wrenna', name: 'Wrenna', full: 'Wrenna Vael', title: 'The Drowned Cartographer', tier: 'champion', role: 'artillery', unlock: { level: 6 },
    look: { body: C(0x5fa3a0), accent: C(0x2e6e6a), hair: C(0x2f3236) }, size: 1.9, clip: 'Throw',
    attack: { name: 'Street Vial', desc: 'Lobs a corked vial of drowned-city seawater: it bursts in a foam splash and Soaks (slows) everyone in it',
      kind: 'lob', count: 1, speed: 12, range: 10.5, radius: 0.36, mult: 1.2, ammo: 3, reload: 1.35, cd: 0.45, lob: true, aoe: 2.0, aoeMult: 0.85, slow: 1.4 },
    ammo: { shape: 'vial', a: C(0x2e6e6a), b: C(0xc9a13b), glow: C(0x5fa3a0), trail: 'drip', trailColor: C(0xd8f4f0) },
    impact: { sprite: 'poof', pal: 'frost', color: C(0xf2f4ee), ring: C(0x5fa3a0), decal: 'soundings' },
    super: { name: 'The Night Lirr Sank', short: 'TIDE', desc: 'Pours seven vials into a ghost map of Lirr that rises as a tidal wave: it carries enemies along and slams them down', clip: 'Spellcast_Raise',
      aim: { type: 'lane', len: 16, width: 8 },
      ops: [
        { at: 0, op: 'fx', fx: 'mapUnroll', where: 'lane', len: 16, width: 8, dur: 1.0 },
        { at: 0, op: 'self', lock: 0.7 },
        { at: 0.75, op: 'wave', len: 16, width: 8, speed: 13, dmg: 3.0, carry: true, stunEnd: 1.0, slow: 2.0, fx: 'tide', trailZone: { r: 2.2, dur: 4, slow: 1 } },
      ] },
  },
  {
    id: 'hob', name: 'Hob', full: 'Hob Tallagh', title: 'The Bell-Ringer of Saint Ennick', tier: 'champion', role: 'tank', unlock: { level: 9 },
    look: { body: C(0xe0a27f), accent: C(0x3e8c77), hair: C(0x1c1c1c) }, size: 2.1, clip: '1H_Melee_Attack_Slice_Horizontal',
    attack: { name: 'Clapper Jab', desc: 'A bracer-bell punch: a bronze sound-ring rolls out and rings through everything in front of him',
      kind: 'wave', count: 1, speed: 15, range: 3.6, radius: 0.75, mult: 1.15, ammo: 3, reload: 1.0, cd: 0.32, pierce: 99 },
    ammo: { shape: 'soundring', a: C(0xa8773a), b: C(0x3e8c77), glow: C(0xf2c14e), trail: 'notes', trailColor: C(0xf2c14e) },
    impact: { sprite: 'ring', pal: 'gold', color: C(0xf2c14e), ring: C(0x3e8c77) },
    super: { name: "Saint Ennick's Last Note", short: 'BELL', desc: 'The ghost of the great cracked bell drops over Hob and tolls once: everyone around falls asleep and the first hit on a sleeper lands harder', clip: 'Cheer',
      aim: { type: 'self', r: 9 },
      ops: [
        { at: 0, op: 'fx', fx: 'bell', where: 'self', dur: 1.8 },
        { at: 0, op: 'self', lock: 0.6 },
        { at: 0.6, op: 'blast', where: 'self', r: 9, dmg: 1.8, stun: 2.4, sleep: true, vuln: 0.5, vulnDur: 2.4, fx: 'soundRing' },
      ] },
  },
  {
    id: 'corrin', name: 'Corrin', full: 'Corrin Ashgraft', title: 'Keeper of the Hollin Orchard', tier: 'champion', role: 'tank', unlock: { level: 14 },
    look: { body: C(0x5b4330), accent: C(0x7da638), hair: C(0x6e7372) }, size: 2.05, clip: 'Throw',
    attack: { name: 'Windfall', desc: 'Lobs a glowing Hollin apple: it bursts on enemies and the juice heals allies in the splash',
      kind: 'lob', count: 1, speed: 12, range: 9.5, radius: 0.34, mult: 1.1, ammo: 3, reload: 1.3, cd: 0.45, lob: true, aoe: 1.6, aoeMult: 0.8, healSplash: 0.55 },
    ammo: { shape: 'apple', a: C(0xc8402f), b: C(0x7da638), glow: C(0x8be04a), trail: 'petals', trailColor: C(0xf28bb0) },
    impact: { sprite: 'poof', pal: 'venom', color: C(0x8be04a), ring: C(0xf28bb0) },
    super: { name: 'The Orchard of Hollin', short: 'GROVE', desc: 'Six spectral apple trees burst up around him: allies heal, enemies are tangled, and in its last moments no ally can fall', clip: 'Spellcast_Raise',
      aim: { type: 'self', r: 7 },
      ops: [
        { at: 0, op: 'fx', fx: 'orchard', where: 'self', r: 6.5, dur: 6.2 },
        { at: 0, op: 'self', lock: 0.8 },
        { at: 0.3, op: 'zone', where: 'self', r: 7, dur: 6, tick: 0.5, dmg: 0.35, slow: 0.8, heal: 0.6, guardAfter: 4.5, fx: 'orchardFloor', color: C(0x8be04a) },
      ] },
  },
  {
    id: 'mott', name: 'Mott', full: 'Brother Mott', title: 'The Candle-Keeper of the Valley', tier: 'champion', role: 'balanced', unlock: { level: 17 },
    look: { body: C(0xede3c2), accent: C(0xb3202a), hair: C(0x8b4a2b) }, size: 1.95, clip: 'Spellcast_Shoot',
    attack: { name: 'Drip', desc: 'Flicks three drops of hot wax that harden in the air into red promise seals',
      kind: 'pellet', count: 3, spread: 0.42, speed: 21, range: 8, radius: 0.3, mult: 0.48, ammo: 3, reload: 1.1, cd: 0.38, burnMult: 0.15 },
    ammo: { shape: 'seal', a: C(0xb3202a), b: C(0xffe08a), glow: C(0xffb347), trail: 'embers', trailColor: C(0xffb347) },
    impact: { sprite: 'impact', pal: 'fire', color: C(0xffb347), ring: C(0xb3202a) },
    super: { name: "The Valley's Light", short: 'VIGIL', desc: 'Eleven vigil candles rise and orbit the team: every ally gets a wax shield, and when a shield breaks its wisp strikes back', clip: 'Spellcast_Raise',
      aim: { type: 'self', r: 10 },
      ops: [
        { at: 0, op: 'fx', fx: 'candles', where: 'self', r: 3.2, n: 11, dur: 6 },
        { at: 0.25, op: 'buff', r: 10, allies: { shield: 2.6, dur: 6, retal: 1.6 }, enemies: { dmg: 0.6, slow: 1.2 }, fx: 'waxRing' },
      ] },
  },
  {
    id: 'nyssa', name: 'Nyssa', full: 'Nyssa Obel', title: 'The Ferry-Coin', tier: 'champion', role: 'skirmisher', unlock: { level: 21 },
    look: { body: C(0xbfc3c2), accent: C(0x4b3f72), hair: C(0x6b4226) }, size: 1.9, clip: '1H_Ranged_Shoot',
    attack: { name: 'Obol Flick', desc: 'Flicks a tarnished ferry coin that ricochets to a second enemy',
      kind: 'disc', count: 1, speed: 26, range: 11, radius: 0.3, mult: 0.95, ammo: 3, reload: 0.95, cd: 0.3, chain: 1 },
    ammo: { shape: 'coin', a: C(0xa57c3a), b: C(0x6e8c6a), glow: C(0xb9d3d6), trail: 'glint', trailColor: C(0xb9d3d6), spin: 'edge' },
    impact: { sprite: 'impact', pal: 'gold', color: C(0xb9d3d6), ring: C(0xa57c3a) },
    super: { name: 'Passage Paid', short: 'FERRY', desc: 'Summons a strip of the black river and rides it end to end: everyone crossed is slowed and cut, and the last coin executes the weak', clip: 'Dodge_Forward',
      aim: { type: 'lane', len: 18, width: 3.2 },
      ops: [
        { at: 0, op: 'fx', fx: 'river', where: 'lane', len: 18, width: 3.4, dur: 4 },
        { at: 0, op: 'zone', where: 'lane', len: 18, width: 3.2, dur: 4, tick: 0.5, slow: 0.8, color: C(0x4b3f72) },
        { at: 0.25, op: 'dash', len: 18, width: 3.2, speed: 30, dmg: 1.5, slow: 1.5, end: { r: 2.6, dmg: 2.6, execute: 0.2, refund: 0.3, fx: 'coinDrop' } },
      ] },
  },
  {
    id: 'pyrrhos', name: 'Pyrrhos', full: 'Pyrrhos', title: 'The Bronze Sentry', tier: 'champion', role: 'tank', unlock: { level: 25 },
    look: { body: C(0xb08a3e), accent: C(0x2d5b5b), hair: C(0xd43a2f) }, size: 2.2, clip: '1H_Melee_Attack_Slice_Horizontal',
    attack: { name: 'Patrol Swing', desc: 'A wide bronze swing that leaves three fading after-images of his arm',
      kind: 'wave', count: 1, speed: 14, range: 3.8, radius: 0.95, mult: 1.25, ammo: 3, reload: 1.15, cd: 0.36, pierce: 99, knock: 3 },
    ammo: { shape: 'crescent', a: C(0xb08a3e), b: C(0xffc870), glow: C(0xffc870), trail: 'sparks', trailColor: C(0xffc870) },
    impact: { sprite: 'slash', pal: 'gold', color: C(0xffc870), ring: C(0xd43a2f) },
    super: { name: 'Four Hundred Years of Patrol', short: 'PATROL', desc: 'Charges his ancient lane three times, flattening everything in it, then hurls the boundary stone; allies standing behind him take less damage', clip: '2H_Melee_Attack_Chop',
      aim: { type: 'lane', len: 14, width: 3 },
      ops: [
        { at: 0, op: 'buff', r: 12, allies: { armor: 0.25, dur: 5 } },
        { at: 0, op: 'dash', len: 14, width: 3, speed: 26, passes: 3, dmg: 1.2, knockSide: 3, end: { r: 3.5, dmg: 2.6, stun: 1.4, fx: 'boulder' } },
      ] },
  },
  {
    id: 'moss', name: 'Moss', full: 'Moss', title: 'The Thread-Follower', tier: 'champion', role: 'balanced', unlock: { level: 29 },
    look: { body: C(0xe8a584), accent: C(0x6fa332), hair: C(0x4e5450) }, size: 1.85, clip: 'Throw',
    attack: { name: 'Thread Ball', desc: 'Throws a ball of his red thread that unspools out and reels back through enemies twice',
      kind: 'chakram', count: 1, speed: 19, range: 12, radius: 0.36, mult: 0.75, ammo: 2, reload: 1.05, cd: 0.38, boomerang: true, pierce: 99 },
    ammo: { shape: 'threadball', a: C(0xc8231f), b: C(0x8a2a1a), glow: C(0xff5a4a), trail: 'thread', trailColor: C(0xc8231f) },
    impact: { sprite: 'impact', pal: 'blood', color: C(0xc8231f), ring: C(0x6fa332) },
    super: { name: 'The Labyrinth Followed', short: 'MAZE', desc: 'The labyrinth he walked out of rises around him: walls of old stone trap and grind enemies while allies run the thread through it', clip: 'Spellcast_Raise',
      aim: { type: 'self', r: 12 },
      ops: [
        { at: 0, op: 'fx', fx: 'labyrinth', where: 'self', r: 11, dur: 6.2 },
        { at: 0.3, op: 'zone', where: 'self', r: 12, dur: 6, tick: 0.5, dmg: 0.55, slow: 0.8, allySpeed: 0.25, color: C(0xc8231f) },
      ] },
  },
  {
    id: 'ione', name: 'Ione', full: 'Ione', title: 'The Siren Who Sang Back', tier: 'champion', role: 'mage', unlock: { level: 33 },
    look: { body: C(0x7a9187), accent: C(0x3fb6b0), hair: C(0x1f4e4a) }, size: 1.9, clip: 'Spellcast_Shoot',
    attack: { name: 'Plucked Note', desc: 'A homing music-box note: it hurts an enemy, and its echo heals and quickens the nearest hurt ally',
      kind: 'orb', count: 1, speed: 17, range: 12, radius: 0.36, mult: 0.95, ammo: 3, reload: 1.1, cd: 0.34, homing: 4.5, allyHeal: 0.45 },
    ammo: { shape: 'note', a: C(0xb8923a), b: C(0x3fb6b0), glow: C(0x7fe8e0), trail: 'fog', trailColor: C(0xeaf4f2) },
    impact: { sprite: 'impact', pal: 'frost', color: C(0x7fe8e0), ring: C(0xb8923a) },
    super: { name: 'The Song That Answered', short: 'SONG', desc: 'She sings: sea fog rolls out, allies are healed and hurried, and enemies are charmed in place', clip: 'Cheer',
      aim: { type: 'self', r: 14 },
      ops: [
        { at: 0, op: 'fx', fx: 'fog', where: 'self', r: 14, dur: 5.2 },
        { at: 0, op: 'self', lock: 0.9 },
        { at: 0.3, op: 'blast', where: 'self', r: 14, dmg: 0.7, stun: 1.5, fx: 'songRing' },
        { at: 0.3, op: 'zone', where: 'self', r: 14, dur: 5, tick: 0.5, heal: 0.4, slow: 0.6, allySpeed: 0.35, color: C(0x3fb6b0) },
      ] },
  },
  {
    id: 'fenwick', name: 'Fenwick', full: 'Fenwick Marl', title: 'The Moonless Wolf', tier: 'champion', role: 'skirmisher', unlock: { level: 36 },
    look: { body: C(0xa8a39a), accent: C(0x6a3f25), hair: C(0x6e6e6a) }, size: 2.0, clip: '1H_Melee_Attack_Slice_Horizontal',
    attack: { name: 'Lunge', desc: 'Lunges forward and rakes with three moon-silver claw ribbons',
      kind: 'wave', count: 3, spread: 0.26, speed: 22, range: 3.4, radius: 0.42, mult: 0.42, ammo: 3, reload: 0.95, cd: 0.34, pierce: 1, lunge: 2.4 },
    ammo: { shape: 'claw', a: C(0xdde6f2), b: C(0xa8a39a), glow: C(0xdde6f2), trail: 'fur', trailColor: C(0xa8a39a) },
    impact: { sprite: 'slash', pal: 'white', color: C(0xdde6f2), ring: C(0xf2c230) },
    super: { name: 'No Moon at All', short: 'HUNT', desc: 'The moon goes out: he leaps from enemy to enemy up to six times, untouchable in the air, and knocks the last one down', clip: '1H_Melee_Attack_Slice_Horizontal',
      aim: { type: 'self', r: 7 },
      ops: [
        { at: 0, op: 'fx', fx: 'eclipse', where: 'self', dur: 2.4 },
        { at: 0.15, op: 'leaps', n: 6, range: 7.5, dmg: 1.45, gap: 0.24, stunLast: 0.9 },
      ] },
  },
  {
    id: 'thimble', name: 'Thimble', full: 'Thimble', title: 'The Changeling in the Sweater', tier: 'champion', role: 'marksman', unlock: { level: 44 },
    look: { body: C(0xe6967a), accent: C(0x8db25a), hair: C(0x8a4b2e) }, size: 1.65, clip: '1H_Ranged_Shoot',
    attack: { name: 'Button Shot', desc: 'Pings a mismatched sweater button that trails a strand of mustard yarn',
      kind: 'arrow', count: 1, speed: 30, range: 12, radius: 0.28, mult: 1.05, ammo: 3, reload: 0.9, cd: 0.26 },
    ammo: { shape: 'button', a: C(0xc2404a), b: C(0xb8a23a), glow: C(0xc7f06b), trail: 'yarn', trailColor: C(0xb8a23a), spin: 'flat' },
    impact: { sprite: 'poof', pal: 'venom', color: C(0xc7f06b), ring: C(0xc2404a) },
    super: { name: 'Changeling', short: 'SWAP', desc: 'Trades places with an enemy and turns them into a toad: they cannot act and take extra damage', clip: 'Spellcast_Shoot',
      aim: { type: 'target', range: 10 },
      ops: [{ at: 0, op: 'swap', range: 10, delay: 0.55, stun: 2.4, vuln: 0.25, fx: 'toad' }] },
  },
  {
    id: 'unwritten', name: 'Unwritten', full: 'The Unwritten', title: 'The Clay That Waits for a Word', tier: 'champion', role: 'tank', unlock: { level: 48 },
    look: { body: C(0xb4533f), accent: C(0xf2efe6), hair: C(0x4a2219) }, size: 2.25, clip: '1H_Melee_Attack_Slice_Horizontal',
    attack: { name: 'Chalk Jab', desc: 'A clay fist that knocks a glowing chalk letter loose from the word written on him',
      kind: 'wave', count: 1, speed: 15, range: 3.4, radius: 0.8, mult: 1.2, ammo: 3, reload: 1.05, cd: 0.32, pierce: 99 },
    ammo: { shape: 'glyph', a: C(0xffd27a), b: C(0xf2efe6), glow: C(0xffd27a), trail: 'chalk', trailColor: C(0xf2efe6) },
    impact: { sprite: 'impact', pal: 'gold', color: C(0xffd27a), ring: C(0xb4533f) },
    super: { name: 'The True Word', short: 'WORD', desc: 'Writes a giant word across the ground and becomes it: ANGRY slams, STAND shelters allies, STILL freezes enemies, HUNGRY feeds on them', clip: '2H_Melee_Attack_Chop',
      aim: { type: 'circle', dist: 6, r: 5.5 },
      ops: [
        { at: 0, op: 'self', armor: 0.3, dur: 6 },
        { at: 0.1, op: 'random', choices: [
          { label: 'ANGRY', ops: [{ op: 'fx', fx: 'word', where: 'target', text: 'ANGRY', w: 10, dur: 6 }, { op: 'zone', where: 'target', r: 5.5, dur: 6, tick: 1, dmg: 1.6, pulse: true, color: C(0xd8452a) }] },
          { label: 'STAND', ops: [{ op: 'fx', fx: 'word', where: 'target', text: 'STAND', w: 10, dur: 6 }, { op: 'zone', where: 'target', r: 5.5, dur: 6, tick: 0.5, heal: 0.5, allyArmor: 0.35, color: C(0xffd27a) }] },
          { label: 'STILL', ops: [{ op: 'fx', fx: 'word', where: 'target', text: 'STILL', w: 10, dur: 6 }, { op: 'blast', where: 'target', r: 5.5, dmg: 1.2, stun: 1.6 }, { op: 'zone', where: 'target', r: 5.5, dur: 6, tick: 0.5, slow: 1, color: C(0x6f8fa6) }] },
          { label: 'HUNGRY', ops: [{ op: 'fx', fx: 'word', where: 'target', text: 'HUNGRY', w: 10, dur: 6 }, { op: 'zone', where: 'target', r: 5.5, dur: 6, tick: 0.5, dmg: 0.9, drain: 0.6, color: C(0x7e3528) }] },
        ] },
      ] },
  },

  // ------------------------------------------------------------------ legendaries
  {
    id: 'lysandra', name: 'Lysandra', full: 'Lysandra Kole', title: 'The Mason Who Carved the Gorgon', tier: 'legendary', role: 'tank', unlock: { level: 55 },
    look: { body: C(0xd9d6cf), accent: C(0x7a4a2a), hair: C(0x5e5b57) }, size: 2.0, clip: '1H_Melee_Attack_Slice_Horizontal',
    attack: { name: "Mason's Jab", desc: 'A marble fist that sprays white stone chips and leaves enemies stiff',
      kind: 'wave', count: 1, speed: 15, range: 3.4, radius: 0.75, mult: 1.15, ammo: 3, reload: 1.0, cd: 0.32, pierce: 99, slow: 0.6 },
    ammo: { shape: 'chips', a: C(0xd9d6cf), b: C(0x9c9a93), glow: C(0xcfc8ba), trail: 'dust', trailColor: C(0xcfc8ba) },
    impact: { sprite: 'shatter', pal: 'white', color: C(0xd9d6cf), ring: C(0x9c9a93) },
    super: { name: "The Gorgon's Garden", short: 'STONE', desc: 'Unveils the Gorgon she carved: everyone around turns to stone, and stone shatters under the team’s hits', clip: 'Spellcast_Raise',
      aim: { type: 'self', r: 7.5 },
      ops: [
        { at: 0, op: 'self', lock: 0.5, armor: 0.6, dur: 1.4 },
        { at: 0, op: 'fx', fx: 'petrify', where: 'self', r: 7.5, dur: 2.2 },
        { at: 0.45, op: 'blast', where: 'self', r: 7.5, dmg: 2.0, stun: 1.9, vuln: 0.4, vulnDur: 3.2, stone: true },
      ] },
  },
  {
    id: 'kallix', name: 'Kallix', full: 'Kallix', title: 'The Thief of the First Fire', tier: 'legendary', role: 'mage', unlock: { level: 58 },
    look: { body: C(0xc68b5e), accent: C(0xff7a1a), hair: C(0x151515) }, size: 1.95, clip: 'Spellcast_Shoot',
    attack: { name: 'Pilfered Spark', desc: 'A stolen ember that leaps to three more enemies and sets them alight',
      kind: 'spark', count: 1, speed: 26, range: 12, radius: 0.32, mult: 0.8, ammo: 3, reload: 1.1, cd: 0.34, chain: 3, burnMult: 0.25 },
    ammo: { shape: 'ember', a: C(0xffd36a), b: C(0xc2301e), glow: C(0xff7a1a), trail: 'embers', trailColor: C(0xff7a1a) },
    impact: { sprite: 'flame', pal: 'fire', color: C(0xff7a1a), ring: C(0xc2301e) },
    super: { name: 'Who Gets Fire Next', short: 'THEFT', desc: 'Steals the fire out of every enemy around him and hands it to his friends: enemies burn and weaken, allies hit harder', clip: 'Cheer',
      aim: { type: 'self', r: 12 },
      ops: [
        { at: 0, op: 'fx', fx: 'theft', where: 'self', r: 12, dur: 1.6 },
        { at: 0.4, op: 'buff', r: 12, enemies: { dmg: 1.5, drainCharge: 0.25, weak: 0.15, burn: 0.3, dur: 6 }, allies: { dmgBuff: 0.2, dur: 6 } },
      ] },
  },
  {
    id: 'oko', name: 'Oko', full: 'Oko', title: 'The Lighthouse That Walked', tier: 'legendary', role: 'marksman', unlock: { level: 62 },
    look: { body: C(0xe8c430), accent: C(0x2d7fc1), hair: C(0x3a3a38) }, size: 2.15, clip: '1H_Ranged_Shoot',
    attack: { name: 'Lens Flash', desc: 'A narrow beam of lighthouse light from his eye-lens that pierces the first enemy',
      kind: 'rail', count: 1, speed: 58, range: 15, radius: 0.3, mult: 1.25, ammo: 3, reload: 1.15, cd: 0.36, pierce: 1 },
    ammo: { shape: 'lightbeam', a: C(0xfff3c4), b: C(0xe8c430), glow: C(0xfff3c4), trail: 'light', trailColor: C(0xfff3c4) },
    impact: { sprite: 'impact', pal: 'white', color: C(0xfff3c4), ring: C(0x2d7fc1) },
    super: { name: 'The Light Stays On', short: 'BEACON', desc: 'His lamp turns: a sweeping beam circles the arena twice, blinding and burning enemies and guiding allies home', clip: 'Spellcast_Shoot',
      aim: { type: 'self', r: 20 },
      ops: [
        { at: 0, op: 'fx', fx: 'lighthouse', where: 'self', dur: 4.1, range: 20 },
        { at: 0, op: 'self', lock: 4 },
        { at: 0.1, op: 'beam', range: 20, turns: 2, dur: 4, width: 1.6, dmg: 1.3, slow: 2, allyHeal: 0.6 },
      ] },
  },
  {
    id: 'ysolt', name: 'Ysolt', full: 'Madame Ysolt Crane', title: 'The Debt-Collector of Hollow Row', tier: 'legendary', role: 'skirmisher', unlock: { level: 66 },
    look: { body: C(0xd8d6d6), accent: C(0xa3121e), hair: C(0x1b1a1f) }, size: 1.95, clip: '1H_Melee_Attack_Slice_Horizontal',
    attack: { name: 'Ledger Slap', desc: 'Swings her chained ledger in a wide arc of red ink and drinks back part of the damage',
      kind: 'wave', count: 1, speed: 15, range: 4.2, radius: 0.95, mult: 1.1, ammo: 3, reload: 1.0, cd: 0.34, pierce: 99, vamp: 0.18 },
    ammo: { shape: 'ink', a: C(0xa3121e), b: C(0x1b1a1f), glow: C(0xc3271f), trail: 'ink', trailColor: C(0xa3121e) },
    impact: { sprite: 'slash', pal: 'blood', color: C(0xc3271f), ring: C(0xc9a13b) },
    super: { name: 'Foreclosure', short: 'DEBT', desc: 'Iron chains fly from the ledger into every enemy near her and reel them in to pay: she heals for what she collects', clip: 'Spellcast_Shoot',
      aim: { type: 'self', r: 14 },
      ops: [
        { at: 0, op: 'fx', fx: 'ledger', where: 'self', dur: 1.4 },
        { at: 0.3, op: 'hook', range: 14, max: 6, pull: 4, dmg: 1.8, drain: 0.6, fx: 'chains' },
      ] },
  },
  {
    id: 'halven', name: 'Halven', full: 'Sir Halven', title: 'The Herald Who Carries His Own Head', tier: 'legendary', role: 'tank', unlock: { level: 70 },
    look: { body: C(0x8a8e93), accent: C(0x5b2a86), hair: C(0x6b3e22) }, size: 2.15, clip: '1H_Melee_Attack_Slice_Horizontal',
    attack: { name: "Herald's Swing", desc: 'A broad lantern swing that leaves a ribbon of purple and gold light',
      kind: 'wave', count: 1, speed: 14, range: 4.0, radius: 1.0, mult: 1.2, ammo: 3, reload: 1.15, cd: 0.36, pierce: 99 },
    ammo: { shape: 'lantern', a: C(0x5b2a86), b: C(0xc9a13b), glow: C(0xffc86b), trail: 'sparks', trailColor: C(0xffc86b) },
    impact: { sprite: 'slash', pal: 'gold', color: C(0xffc86b), ring: C(0x5b2a86) },
    super: { name: "The King's Last Message", short: 'DECREE', desc: 'Unrolls the dead king’s last decree: allies grow stronger and sturdier and are cleansed, enemies are forced to kneel', clip: 'Cheer',
      aim: { type: 'self', r: 14 },
      ops: [
        { at: 0, op: 'fx', fx: 'decree', where: 'self', dur: 6, r: 14 },
        { at: 0.5, op: 'blast', where: 'self', r: 14, dmg: 1.0, stun: 1.2 },
        { at: 0.5, op: 'buff', r: 14, allies: { dmgBuff: 0.25, armor: 0.25, cleanse: true, dur: 6 } },
      ] },
  },

  // ------------------------------------------------------------------ ascendants
  {
    id: 'sena', name: 'Sena', full: 'Sena', title: 'The Youngest Fate', tier: 'ascendant', role: 'marksman', unlock: { level: 74 },
    look: { body: C(0xc9c7c3), accent: C(0x9e2a2b), hair: C(0xedede8) }, size: 1.9, clip: '1H_Ranged_Shoot',
    attack: { name: 'Loose End', desc: 'Throws a red life-thread with a glowing knot: it ties on, slows and keeps bleeding the target',
      kind: 'spark', count: 1, speed: 28, range: 10, radius: 0.28, mult: 0.75, ammo: 3, reload: 1.0, cd: 0.3, slow: 1.0, burnMult: 0.35 },
    ammo: { shape: 'needle', a: C(0x9e2a2b), b: C(0xd4af37), glow: C(0xff5a5a), trail: 'thread', trailColor: C(0x9e2a2b) },
    impact: { sprite: 'impact', pal: 'blood', color: C(0xff5a5a), ring: C(0xd4af37) },
    super: { name: 'The Cut', short: 'CUT', desc: 'Lifts the target’s life-thread into the sky and closes the golden shears: a heavy cut, and if they are weak enough, the end', clip: 'Spellcast_Raise',
      aim: { type: 'target', range: 11 },
      ops: [{ at: 0, op: 'mark', range: 11, dur: 3.2, dps: 0.35, slow: 1, cut: 2.2, execute: 0.32, fx: 'shears' }] },
  },
  {
    id: 'jory', name: 'Jory', full: 'Jory Ashby', title: "Death's Night-Shift Porter", tier: 'ascendant', role: 'balanced', unlock: { level: 78 },
    look: { body: C(0xe3b79a), accent: C(0x1e1e22), hair: C(0xe6c27a) }, size: 1.9, clip: 'Throw',
    attack: { name: 'Keyring Toss', desc: "Spins Death's keyring out like a saw blade and catches it on the way back",
      kind: 'chakram', count: 1, speed: 20, range: 11, radius: 0.42, mult: 0.75, ammo: 2, reload: 1.05, cd: 0.38, boomerang: true, pierce: 99 },
    ammo: { shape: 'keyring', a: C(0x6e6e70), b: C(0xe8e0c8), glow: C(0x9fd3f0), trail: 'glint', trailColor: C(0xaee3f5) },
    impact: { sprite: 'impact', pal: 'frost', color: C(0xaee3f5), ring: C(0xc9a13b) },
    super: { name: 'Covering Shift', short: 'SHIFT', desc: 'Takes Death’s shift for a few seconds: inside his lamplight no ally can die, and enemies are slowed', clip: 'Cheer',
      aim: { type: 'self', r: 11 },
      ops: [
        { at: 0, op: 'fx', fx: 'shift', where: 'self', r: 11, dur: 7 },
        { at: 0.25, op: 'zone', where: 'self', r: 11, dur: 7, tick: 0.5, guard: true, heal: 0.15, slow: 0.6, color: C(0x9fd3f0) },
      ] },
  },
  {
    id: 'sleeper', name: 'Sleeper', full: 'The Sleeper', title: 'The Island That Woke', tier: 'ascendant', role: 'tank', unlock: { level: 82 },
    look: { body: C(0x33373b), accent: C(0x2fb7a3), hair: C(0x1f2124) }, size: 2.35, clip: '2H_Melee_Attack_Chop',
    attack: { name: 'Tide Palm', desc: 'Slams a basalt palm down: seawater wells up into a puddle that slows enemies',
      kind: 'lob', count: 1, speed: 14, range: 5, radius: 0.5, mult: 1.25, ammo: 3, reload: 1.2, cd: 0.42, lob: true, aoe: 2.4, aoeMult: 0.9, puddle: { r: 2.4, dur: 3, slow: 0.7 } },
    ammo: { shape: 'palm', a: C(0x33373b), b: C(0x3cd1bc), glow: C(0x2fb7a3), trail: 'drip', trailColor: C(0x3cd1bc) },
    impact: { sprite: 'poof', pal: 'frost', color: C(0x3cd1bc), ring: C(0x2fb7a3), decal: 'puddle' },
    super: { name: 'The Floor Goes Into the Sea', short: 'FLOOD', desc: 'The arena sinks: a sea rises over the floor, slowing every enemy, sheltering allies and opening whirlpools under the weakest foe', clip: 'Cheer',
      aim: { type: 'self', r: 18 },
      ops: [
        { at: 0, op: 'fx', fx: 'flood', where: 'self', r: 18, dur: 8 },
        { at: 0.3, op: 'zone', where: 'self', r: 18, dur: 8, tick: 0.5, slow: 0.6, allyArmor: 0.15, selfRegen: 0.02, whirl: { every: 2, r: 2.6, dmg: 1.0, pull: 2.2 }, color: C(0x2fb7a3), quiet: true },
      ] },
  },
  {
    id: 'camedown', name: 'Camedown', full: 'The One Who Came Down', title: 'The Stair-Builder', tier: 'ascendant', role: 'tank', unlock: { level: 86 },
    look: { body: C(0xe8e6e1), accent: C(0xd9a93a), hair: C(0x5e6266) }, size: 2.2, clip: 'Spellcast_Shoot',
    attack: { name: 'Step', desc: 'A marble stair-step with gold veins bursts up under the target and knocks it into the air',
      kind: 'lob', count: 1, speed: 16, range: 9, radius: 0.4, mult: 1.2, ammo: 3, reload: 1.25, cd: 0.42, lob: true, aoe: 1.5, aoeMult: 0.9, stun: 0.35 },
    ammo: { shape: 'step', a: C(0xe8e6e1), b: C(0xd9a93a), glow: C(0xf2c14e), trail: 'sparks', trailColor: C(0xf2c14e) },
    impact: { sprite: 'dust', pal: 'dust', color: C(0xf2c14e), ring: C(0xd9a93a), decal: 'stepUp' },
    super: { name: 'The Top of the Stair', short: 'STAIR', desc: 'A spiral stair carries him and nearby allies into the sky; they come down together on the target in a ring of erupting steps', clip: 'Cheer',
      aim: { type: 'circle', dist: 14, r: 5 },
      ops: [
        { at: 0, op: 'fx', fx: 'stairUp', where: 'self', dur: 1.7 },
        { at: 0, op: 'leap', dist: 14, air: 1.5, allies: { r: 10, max: 3 }, end: { r: 5, dmg: 2.8, stun: 1.0, shield: 2.0, shieldDur: 4, fx: 'stepRing' } },
      ] },
  },

  // ------------------------------------------------------------------ divines
  {
    id: 'vell', name: 'Vell', full: 'Vell', title: 'The Keeper of Lost Things', tier: 'divine', role: 'mage', unlock: { level: 88 },
    look: { body: C(0xe9dfc4), accent: C(0x4d5a6b), hair: C(0xb9a7d9) }, size: 2.0, clip: 'Throw',
    attack: { name: 'Something You Dropped', desc: 'Throws a random lost thing (a key, a glove, an umbrella, a pocket watch) that hunts its owner down',
      kind: 'missile', count: 1, speed: 15, range: 12, radius: 0.34, mult: 1.0, ammo: 3, reload: 1.1, cd: 0.36, homing: 5 },
    ammo: { shape: 'lost', a: C(0xc9a13b), b: C(0x7a5238), glow: C(0xb9a7d9), trail: 'motes', trailColor: C(0xb9a7d9) },
    impact: { sprite: 'poof', pal: 'arcane', color: C(0xb9a7d9), ring: C(0xf4d06f) },
    super: { name: 'Lost Without Trace', short: 'LOST', desc: 'Turns his coat inside out: a vortex of pockets swallows every enemy in the circle, and they come back hurt when he lets them go', clip: 'Spellcast_Raise',
      aim: { type: 'circle', dist: 7, r: 7.5 },
      ops: [
        { at: 0, op: 'fx', fx: 'pockets', where: 'target', r: 7.5, dur: 4.2 },
        { at: 0, op: 'self', lock: 1.0 },
        { at: 0.5, op: 'banish', where: 'target', r: 7.5, dur: 3, dmgReturn: 2.0 },
      ] },
  },
  {
    id: 'ophira', name: 'Ophira', full: 'Ophira', title: 'The Gorgon Who Looked Away', tier: 'divine', role: 'balanced', unlock: { level: 90 },
    look: { body: C(0x9fe3e0), accent: C(0x3f6e5a), hair: C(0x5be36b) }, size: 2.0, clip: '1H_Ranged_Shoot',
    attack: { name: 'Glass Shard', desc: 'A sliver of mirror glass that ricochets off walls and leaps to a second enemy',
      kind: 'disc', count: 1, speed: 24, range: 13, radius: 0.3, mult: 0.95, ammo: 3, reload: 1.0, cd: 0.3, bounce: 2, chain: 1 },
    ammo: { shape: 'shard', a: C(0xf4fbff), b: C(0x1c2422), glow: C(0x9fe3e0), trail: 'glint', trailColor: C(0xf4fbff), spin: 'tumble' },
    impact: { sprite: 'shatter', pal: 'frost', color: C(0xf4fbff), ring: C(0x5be36b) },
    super: { name: 'What You Are', short: 'MIRROR', desc: 'A hall of standing mirrors rises around her: her gaze freezes enemies, their reflections turn on them, and allies are shielded', clip: 'Spellcast_Raise',
      aim: { type: 'self', r: 10 },
      ops: [
        { at: 0, op: 'fx', fx: 'mirrors', where: 'self', r: 9.5, dur: 5.2 },
        { at: 0.35, op: 'blast', where: 'self', r: 10, dmg: 1.0, stun: 1.1, stone: true },
        { at: 0.35, op: 'buff', r: 10, allies: { shield: 1.5, dur: 5 } },
        { at: 0.35, op: 'zone', where: 'self', r: 10, dur: 5, tick: 0.5, dmg: 0.6, color: C(0x9fe3e0), quiet: true },
      ] },
  },
  {
    id: 'kerberon', name: 'Kerberon', full: 'Old Kerberon', title: 'The Gate-Hound Who Got Old', tier: 'divine', role: 'tank', unlock: { level: 92 },
    look: { body: C(0x3a3a40), accent: C(0xf29a1e), hair: C(0x1a1a1c) }, size: 2.25, clip: 'Throw',
    attack: { name: "Sic 'Em", desc: 'Sends a spectral hound running at the nearest enemy; its bite sets them smouldering',
      kind: 'missile', count: 1, speed: 14, range: 10, radius: 0.5, mult: 1.15, ammo: 3, reload: 1.2, cd: 0.4, homing: 3.2, burnMult: 0.2 },
    ammo: { shape: 'hound', a: C(0x1a1a1c), b: C(0xf29a1e), glow: C(0xf29a1e), trail: 'ghostfire', trailColor: C(0xf29a1e) },
    impact: { sprite: 'flame', pal: 'fire', color: C(0xf29a1e), ring: C(0xc2451e) },
    super: { name: 'All Three Awake', short: 'THREE', desc: 'Roars and wakes his two sleeping heads: one breathes ghost-fire, one bites and drags, and he shrugs off damage', clip: 'Cheer',
      aim: { type: 'self', r: 6 },
      ops: [
        { at: 0, op: 'fx', fx: 'heads', where: 'self', dur: 7 },
        { at: 0, op: 'blast', where: 'self', r: 6, dmg: 1.5, stun: 0.8, fx: 'roar' },
        { at: 0.2, op: 'stance', dur: 7, armor: 0.3, every: 0.5, cone: { count: 3, spread: 0.7, range: 6.5, speed: 13, dmg: 0.32, burn: 0.15 }, bite: { every: 1, range: 5.5, dmg: 1.0, pull: 2 } },
      ] },
  },
  {
    id: 'tychon', name: 'Tychon', full: 'Tychon', title: 'The God of the Last Roll', tier: 'divine', role: 'mage', unlock: { level: 94 },
    look: { body: C(0xe9e2cf), accent: C(0x6b3e9c), hair: C(0x1e1e22) }, size: 1.95, clip: 'Throw',
    attack: { name: 'Roll the Bones', desc: 'Throws a glowing ivory die: it explodes for 1 to 6 times its luck (a 6 hits like a truck, a 1 fizzles)',
      kind: 'lob', count: 1, speed: 13, range: 10, radius: 0.36, mult: 1.0, ammo: 3, reload: 1.25, cd: 0.42, lob: true, aoe: 1.9, aoeMult: 0.9, dice: true },
    ammo: { shape: 'die', a: C(0xe9e2cf), b: C(0x9b4dff), glow: C(0x9b4dff), trail: 'motes', trailColor: C(0x9b4dff), spin: 'tumble' },
    impact: { sprite: 'impact', pal: 'arcane', color: C(0x9b4dff), ring: C(0xd4af37) },
    super: { name: 'The Last Roll', short: 'ROLL', desc: 'Rolls a giant golden die across the field: six faces, six fates, from a backfire to a jackpot that flattens everything', clip: 'Throw',
      aim: { type: 'circle', dist: 12, r: 8 },
      ops: [
        { at: 0, op: 'fx', fx: 'bigDie', where: 'target', dur: 1.5 },
        { at: 1.35, op: 'random', show: 'die', choices: [
          { label: '1', ops: [{ op: 'blast', where: 'target', r: 10, dmg: 2.2, selfDmg: 0.15 }] },
          { label: '2', ops: [{ op: 'buff', where: 'target', r: 10, enemies: { weak: 0.3, slow: 3, dur: 6 } }] },
          { label: '3', ops: [{ op: 'buff', r: 9, allies: { heal: 2.5 } }] },
          { label: '4', ops: [{ op: 'buff', r: 12, allies: { dmgBuff: 0.3, reset: true, dur: 6 } }] },
          { label: '5', ops: [{ op: 'blast', where: 'target', r: 6, dmg: 1.5, stun: 2.5, fx: 'cards' }] },
          { label: '6', ops: [{ op: 'blast', where: 'target', r: 8, dmg: 5.5, stun: 1.5, knock: 8, allyCharge: 0.2 }, { op: 'rain', where: 'target', n: 6, area: 7, r: 2.2, dmg: 1.0, interval: 0.12 }] },
        ] },
      ] },
  },
  {
    id: 'aurvan', name: 'Aurvan', full: 'Aurvan', title: 'The First Moon’s Keeper', tier: 'divine', role: 'mage', unlock: { level: 96 },
    look: { body: C(0xc9cdd3), accent: C(0x2f5ba8), hair: C(0x151a33) }, size: 2.05, clip: 'Spellcast_Shoot',
    attack: { name: 'Moonfrost Breath', desc: 'A cone of silver moonlight frost: crescent flakes that chill and tug enemies inward',
      kind: 'pellet', count: 5, spread: 0.7, speed: 18, range: 7, radius: 0.3, mult: 0.3, ammo: 3, reload: 1.15, cd: 0.38, slow: 0.9 },
    ammo: { shape: 'crescent', a: C(0xeaf2ff), b: C(0x2f5ba8), glow: C(0xfff8d6), trail: 'stars', trailColor: C(0xeaf2ff), small: true },
    impact: { sprite: 'shatter', pal: 'frost', color: C(0xeaf2ff), ring: C(0x2f5ba8) },
    super: { name: 'Let the Moon Out', short: 'MOON', desc: 'Lets the first moon out of his chest: it hangs over the target and its tide drags every enemy in, then it comes down', clip: 'Spellcast_Raise',
      aim: { type: 'circle', dist: 10, r: 11 },
      ops: [
        { at: 0, op: 'fx', fx: 'moon', where: 'target', dur: 3.6, r: 11 },
        { at: 0, op: 'self', vuln: 0.3, dur: 3.3 },
        { at: 0.3, op: 'zone', where: 'target', r: 11, dur: 3, tick: 0.5, pull: 4.5, slow: 0.6, color: C(0xeaf2ff), quiet: true },
        { at: 3.3, op: 'blast', where: 'target', r: 6, dmg: 3.6, stun: 1.2, knock: 6 },
      ] },
  },
  {
    id: 'ourax', name: 'Ourax', full: 'Ourax', title: 'The Titan Who Holds a Corner of the Sky', tier: 'divine', role: 'tank', unlock: { level: 98 },
    look: { body: C(0x8e8a7e), accent: C(0x7dba3a), hair: C(0x5e5b52) }, size: 2.45, clip: '2H_Melee_Attack_Chop',
    attack: { name: 'Brush Aside', desc: 'A huge stone backhand that tears up a fan of turf and wildflowers',
      kind: 'wave', count: 1, speed: 13, range: 4.4, radius: 1.1, mult: 1.35, ammo: 3, reload: 1.3, cd: 0.42, pierce: 99, knock: 4 },
    ammo: { shape: 'clods', a: C(0x5e5b52), b: C(0x7dba3a), glow: C(0x9cd14a), trail: 'dust', trailColor: C(0x9cd14a) },
    impact: { sprite: 'dust', pal: 'dust', color: C(0x9cd14a), ring: C(0x7dba3a) },
    super: { name: 'Hold This for a Moment', short: 'SKY', desc: 'Lowers his corner of the sky onto an enemy and pins them under it, then rampages two-handed with his hands finally free', clip: '2H_Melee_Attack_Chop',
      aim: { type: 'target', range: 10 },
      ops: [
        { at: 0, op: 'pin', range: 10, dur: 3.5, dps: 0.8, fx: 'skySlab' },
        { at: 0, op: 'self', dmgBuff: 0.25, dur: 6 },
        { at: 0.6, op: 'stance', dur: 5.5, armor: 0.2, every: 1.2, slam: { r: 3.2, dmg: 1.8 } },
      ] },
  },
  {
    id: 'hespera', name: 'Hespera', full: 'Hespera', title: 'The Evening Star Who Buried the Sun', tier: 'divine', role: 'artillery', unlock: { level: 100 },
    look: { body: C(0xb5653f), accent: C(0xe0702a), hair: C(0x2e2c2b) }, size: 2.05, clip: 'Throw',
    attack: { name: 'Cinder Sling', desc: 'Slings a cracked cinder broken off the dead sun: it bursts and leaves enemies burning',
      kind: 'lob', count: 1, speed: 14, range: 11, radius: 0.4, mult: 1.25, ammo: 3, reload: 1.3, cd: 0.42, lob: true, aoe: 1.6, aoeMult: 0.8, burnMult: 0.3 },
    ammo: { shape: 'cinder', a: C(0x2e2c2b), b: C(0xe0702a), glow: C(0xffb347), trail: 'embers', trailColor: C(0xe0702a) },
    impact: { sprite: 'explosion', pal: 'fire', color: C(0xe0702a), ring: C(0xd9a63a) },
    super: { name: 'Setting Down the Sun', short: 'SUN', desc: 'Hauls the dead sun down out of the sky on its chain anywhere on the field: the centre is devastating and the crater burns', clip: 'Spellcast_Raise',
      aim: { type: 'circle', dist: 22, r: 9 },
      ops: [
        { at: 0, op: 'fx', fx: 'sunfall', where: 'target', dur: 2.3, r: 9 },
        { at: 0, op: 'self', lock: 1.6 },
        { at: 2.0, op: 'blast', where: 'target', r: 9, dmg: 3.0, knock: 8, inner: { r: 3, dmg: 3.0, stun: 1.0 } },
        { at: 2.0, op: 'zone', where: 'target', r: 6, dur: 5, tick: 0.5, dmg: 1.0, burn: 0.2, color: C(0xe0702a), fx: 'crater' },
      ] },
  },
];

export const HERO_V6_IDS = HEROES_V6.map((h) => h.id);
export const HERO_V6 = Object.fromEntries(HEROES_V6.map((h) => [h.id, h]));
const TIER_POW = { champion: 1.0, legendary: 1.08, ascendant: 1.15, divine: 1.25 };
export const heroTierPow = (id) => (HERO_V6[id] ? TIER_POW[HERO_V6[id].tier] || 1 : 1);

// The skill-tree specials each role tends to use (mirrors the original brawlers).
const SPECIALS = {
  balanced: ['dmgBig', 'burst', 'crit', 'pierce', 'ammo', 'superPow'],
  tank: ['count', 'aoe', 'hpArmor', 'lifesteal', 'range', 'superPow'],
  marksman: ['pierce', 'crit', 'range', 'split', 'ammo', 'superPow'],
  mage: ['aoe', 'slow', 'chain', 'crit', 'ammo', 'superPow'],
  skirmisher: ['burst', 'crit', 'lifesteal', 'speed', 'ammo', 'superPow'],
  artillery: ['aoe', 'count', 'burn', 'slow', 'ammo', 'superPow'],
};

// Register every hero as a brawler: attack (CFG.attacks[id]), brawler entry, its own super in CFG.supers.
// Runs before the game builds CFG.classes from CFG.brawlers.
export function installHeroesV6(CFG) {
  for (const h of HEROES_V6) {
    CFG.attacks[h.id] = Object.assign({ role: h.attack.name, hero: h.id, color: h.ammo.glow, unlock: h.unlock }, h.attack);
    CFG.brawlers[h.id] = { name: h.name, full: h.full, title: h.title, tier: h.tier, role: h.role, body: h.look.body, accent: h.look.accent, hair: h.look.hair, look: 'hood', specials: SPECIALS[h.role], heroV6: true };
    CFG.supers['h_' + h.id] = { name: h.super.name, short: h.super.short, desc: h.super.desc, hero: h.id, aim: h.super.aim };
    if (!CFG.brawlerOrder.includes(h.id)) CFG.brawlerOrder.push(h.id);
  }
}
// After CFG.classes is built: point each hero class at its own super.
export function finishHeroesV6(CFG) {
  for (const h of HEROES_V6) if (CFG.classes[h.id]) { CFG.classes[h.id].super = 'h_' + h.id; CFG.classes[h.id].heroV6 = h.id; }
}

// Painted splash art (FLUX.1 Kontext [dev] repaint of each Codex concept): a wide banner for the hero's details and a
// square crop for the roster card, in assets/ui/portraits/splash/. Heroes not listed keep their 3D-render portrait.
export const HERO_SPLASH = ['aurvan', 'camedown', 'corrin', 'fenwick', 'halven', 'hespera', 'hob', 'ione', 'jory', 'kallix', 'kerberon', 'lysandra', 'moss', 'mott', 'nyssa', 'oko', 'ophira', 'ourax', 'pyrrhos', 'sena', 'sleeper', 'thimble', 'tychon', 'unwritten', 'vell', 'wrenna', 'ysolt'];

// Model registry: assets/hero-v6/<id>/model.json (packed by tools/v4_pack.py), shared adventurer clips.
export function applyHeroV6Models(manifest, ready) {
  for (const h of HEROES_V6) {
    if (ready && !ready.includes(h.id)) continue;
    manifest['hero.' + h.id] = {
      dir: 'assets/hero-v6/' + h.id + '/', size: h.size, v4: true, v6: true, animated: true, measuredHand: true, character: h.id,
      handLen: 0.08, weapon: null, attack: h.clip || '1H_Ranged_Shoot', portrait: HERO_SPLASH.includes(h.id) ? 'assets/ui/portraits/splash/' + h.id + '-card.webp' : 'assets/ui/portraits/v6/' + h.id + '.webp',
      splash: HERO_SPLASH.includes(h.id) ? 'assets/ui/portraits/splash/' + h.id + '.webp' : null,
      source: 'TRELLIS.2 (MIT) from a Z-Image Turbo (Apache-2.0) concept painted for the Codex, rigged with tools/v4_* + tools/v6_*, Oct 2026',
    };
  }
}
