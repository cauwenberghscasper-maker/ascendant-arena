// --- Dungeon mode (party dungeons, "delves" in code): a main mode next to Showdown. Six dungeons, one per biome, each
// with its own boss and a five-piece set that drops nowhere else. Difficulties Normal → Hard → Heroic → Mythic →
// Ascendant 1, 2, … (endless); each asks a minimum TEAM POWER (the average Power of the party) and pays better loot.
// A run is a G.dungeon instance with D.delve set, so walls, doors, clamping, the hall view and the PvP block of the
// world dungeons all apply. Everything that has to match between party members comes from one seed the leader picks:
// room shapes, events, monster slots and spawn spots. Monsters are shared like the open world's (70-multiplayer.js:
// the nearest party member runs each one, the others send hits), so every game sees the same fight. Loot is rolled
// by each game for its own player. PvP never happens inside.
CFG.delve = {
  // a mid to late game mode (Casper, 19 Oct): Dungeons open at level 60; each dungeon has its own level, from the
  // Crypt at 60 to Starfall at 170 (`lvl` below), and opens when you reach it
  unlock: 60, maxParty: 4,
  // monster HP by party size (1-4 heroes), so a short-handed party still fits the fight
  hpParty: [1, 1.7, 2.3, 2.9],
  // Team power needed = pow × the reference hero's Power at the dungeon's level; each member needs at least `floor` of it
  // Team power needed = pow × powK × the reference hero's Power. Set very low for now (Casper, 18 Oct: joining was
  // blocked); raise powK toward 1 and floor toward 0.7 once parties are tested on real phones.
  powK: 0.05, floor: 0,
  dungeons: [
    { id: 'crypt', lvl: 60, gem: { id: 'rootamber', name: 'Rootbound Amber', color: 0xe09a2a }, puzzle: 'Root Seals', mini: 'The Rootbound Gravekeeper', name: 'Rootbound Crypt', biome: 0, boss: 'The Hollow Warden', blurb: 'Roots have split the tombs of the first foresters. Something old keeps the keys.',
      set: { name: 'Rootwarden', b2: { hp: 0.08, armor: 0.05 }, b4: { lifesteal: 0.05, dmg: 0.08 } } },
    { id: 'frostvault', lvl: 72, gem: { id: 'rimeglass', name: 'Rimeglass', color: 0x9fe0ff }, puzzle: 'Frost Runes', mini: 'Rime Huntsman Ulfa', name: 'Frostvault', biome: 1, boss: 'Queen Rime', blurb: 'A vault cut into the glacier, where the mountain clans buried their winters.',
      set: { name: 'Rimebound', b2: { armor: 0.08, hp: 0.06 }, b4: { critDmg: 0.25, superGain: 0.08 } } },
    { id: 'cinder', lvl: 88, gem: { id: 'emberheart', name: 'Forgeheart Ember', color: 0xff6a2a }, puzzle: 'Forge Valves', mini: 'The Slag Overseer', name: 'Cinder Halls', biome: 2, boss: 'Forgemaw', blurb: 'The dwarf-forges under the volcano still burn, and so does whatever stokes them.',
      set: { name: 'Cinderborn', b2: { dmg: 0.08, atkSpeed: 0.05 }, b4: { crit: 0.06, critDmg: 0.3 } } },
    { id: 'archive', lvl: 108, gem: { id: 'inkpearl', name: 'Ink Pearl', color: 0x8a6ad8 }, puzzle: 'The Lost Index', mini: 'The Inkbound Scribe', name: 'Sunken Archive', biome: 3, boss: 'The Last Librarian', blurb: 'A library that fell through the floor of the world. The books read you back.',
      set: { name: 'Archivist', b2: { cdr: 0.06, superGain: 0.08 }, b4: { dmg: 0.1, cdr: 0.06 } } },
    { id: 'grotto', lvl: 135, gem: { id: 'tidestone', name: 'Tidestone', color: 0x2fb5a8 }, puzzle: 'Tide Shells', mini: 'The Brine Knight', name: 'Abyssal Grotto', biome: 4, boss: 'Mother of Tides', blurb: 'Below the reef the sea keeps a cathedral of its own, and a mother who guards it.',
      set: { name: 'Tidewrought', b2: { move: 0.06, hp: 0.06 }, b4: { lifesteal: 0.06, atkSpeed: 0.08 } } },
    { id: 'starfall', lvl: 170, gem: { id: 'starshard', name: 'Starshard', color: 0xffd84a }, puzzle: 'Star Sigils', mini: 'The Fallen Acolyte', name: 'Starfall Sanctum', biome: 5, boss: 'The Fallen Seraph', blurb: 'Where a star came down, a temple grew around it. Its guardian never forgave the sky.',
      set: { name: 'Starsworn', b2: { crit: 0.05, dmg: 0.08 }, b4: { critDmg: 0.35, superGain: 0.1 } } },
  ],
  // named difficulties; past the last one Ascendant ranks go on forever (diffDef)
  diffs: [
    { name: 'Normal', lvl: 2, hp: 1, dmg: 1, pow: 0.8, rooms: [7, 7], events: 2, puzzles: 2, items: 2, floor: 'rare', unique: 0.05, col: '#7bd35a' },
    { name: 'Hard', lvl: 8, hp: 1.15, dmg: 1.1, pow: 1.0, rooms: [8, 8], events: 2, puzzles: 2, items: 3, floor: 'epic', unique: 0.08, col: '#58b4ff' },
    { name: 'Heroic', lvl: 16, hp: 1.3, dmg: 1.2, pow: 1.25, rooms: [8, 9], events: 3, puzzles: 3, items: 3, floor: 'epic', unique: 0.12, col: '#c77dff' },
    { name: 'Mythic', lvl: 28, hp: 1.5, dmg: 1.3, pow: 1.6, rooms: [9, 9], events: 3, puzzles: 3, items: 4, floor: 'legendary', unique: 0.16, col: '#ff9a3c' },
  ],
  // room shapes: half sizes (x, z) of a hall, from tight cells (20 m) to huge arenas (56 m); the boss hall is always the
  // giant square (64 m). Big enough for a party of four to spread out (Casper, 18 Oct: the old halls were too small).
  shapes: [{ n: 'cell', hx: 10, hz: 10, w: 2 }, { n: 'hall', hx: 15, hz: 15, w: 3 }, { n: 'gallery', hx: 22, hz: 12, w: 2 }, { n: 'longhall', hx: 12, hz: 22, w: 2 },
    { n: 'chamber', hx: 19, hz: 19, w: 2 }, { n: 'arena', hx: 28, hz: 28, w: 1 }],
  start: { n: 'hall', hx: 13, hz: 13 }, bossH: 32, corridor: 10, corW: 6,
  // what a combat hall holds: few, tough monsters spread over the hall for tactics (Casper, 18 Oct: no more spam).
  // One per `spread.area` m² (`spread.n` min-max), at least `gap` m apart, none within `entry` m of the way in;
  // ranged ones stand at the back (behind pillars where there are some), melee ones in front. A monster wakes by
  // itself (close by or hit) and calls only its neighbours within `alert` m: pull them one or two at a time.
  // Swarm halls send waves; elite halls hold fewer, all elite; events sit only in their own rooms.
  fights: [{ k: 'guard', w: 4 }, { k: 'swarm', w: 2, waves: 3 }, { k: 'elites', w: 2 }],
  // rare veins: a run may hide one (sometimes two) glowing veins of the dungeon's own rare resource in its halls, from
  // the seed so every phone shows the same; each hero mines their own share. Now and then a vein is a motherlode.
  veins: { chance: 0.4, perDiff: 0.06, max: 0.85, second: 0.25, n: [1, 3], nDiff: 0.5, lode: 0.08, lodeN: [5, 8] },
  // side rooms for exploring (Casper, 19 Oct): small rooms off the main halls, out of the way of the gates. Some hide
  // behind a cracked wall you smash open. Each holds a treasure chest with guards, a champion's den, or a rare vein.
  side: { n: [[2, 3], [2, 3], [3, 4], [3, 4], [3, 5]], h: [8, 10], corridor: 7, secret: 0.45,
    kinds: [{ k: 'treasure', w: 3, guards: 3 }, { k: 'den', w: 2, guards: 2 }, { k: 'vein', w: 2, guards: 2 }],
    names: { treasure: 'Treasure Room', den: "Champion's Den", vein: 'Hidden Vein' }, denHp: 0.45 },
  spread: { area: 95, n: [6, 16], gap: 6, entry: 11, alert: 9, cover: 9, patrol: 0.2, roam: 12, captain: 8 },
  tough: { hp: 1.6, dmg: 1.2 },
  // halfway through, a hall holds the dungeon's mini-boss with guards; the boss fights in three phases (adds at 66% and
  // 33%, then it gets faster and hits harder)
  mini: { hp: 0.55, guards: 3 }, boss: { hp: 2.4, phases: [0.66, 0.33], rage: { spd: 1.25, atk: 1.2 } },
  events: {
    vault: { name: 'Treasure Vault', d: 'A gold goblin! Catch it before it vanishes', time: 20 },
    altar: { name: 'Cursed Altar', d: 'Take the curse: less health for the rest of the run, better loot at the end', hpCap: 0.75, unique: 1.6, items: 1 },
    plates: { name: 'Pressure Plates', d: 'Stand on every plate at once to open the hidden cache', hold: 1.5 },
    traps: { name: 'Spike Hall', d: 'The floor bites: watch the red tiles', every: 2.4, warn: 0.9, hit: 0.22 },
    echo: { name: 'Shrine of Echoes', d: 'An echo of a fallen champion wakes', mods: 2 },
    mimic: { name: 'Lonely Chest', d: 'A chest in an empty room. Surely nothing is wrong', odds: 0.5 },
    fountain: { name: 'Moonwell', d: 'Drink once: full health and a moment of grace' },
  },
  mods: { dark: 0.25, pillars: 0.6 },
  // puzzle halls: seals (floor plates and lever stones) to wake in the order a mural by the entrance shows. Stand on or
  // by a seal for `hold` s. A wrong seal resets the lot and bites back: a spike burst, then a monster pack, in turn.
  // Easy runs sometimes number the seals with pips instead of runes. Bots pitch in once the first seal is right.
  // Seals by difficulty (`switches`; the mural never shows more than 5), guards that must fall too (`guards` by
  // difficulty), a bigger pack on harder runs (+`packDiff` a difficulty). The packs crumble once the seals are solved.
  puzzle: { switches: [4, 4, 5, 5, 6], hold: 0.6, r: 1.7, failCd: 2.5, spike: 0.18, pack: 3, packDiff: 0.5, packMax: 6, guards: [0, 2, 2, 3, 4], botWait: 2,
    hint: 'Wake the seals in the order the mural shows', pipsHint: 'Wake the seals in the order of their marks',
    // four kinds, never the same twice in a run: the mural order, a light show to repeat, a race against the clock
    // (its time comes from the walk between the seals), and lights-out (a seal flips itself and both neighbours)
    kinds: { order: { name: 'The Mural' }, memory: { name: 'The Echo', hint: 'Watch the seals light up, then wake them in the same order', show: 1.1, lead: 1, gap: 2.5 },
      timed: { name: 'The Race', hint: 'Wake every seal before the light fades: the first one starts the clock', walk: 5, slack: 3 },
      toggle: { name: 'The Balance', hint: 'Each seal flips itself and both its neighbours: light them all' },
      pairs: { name: 'The Twins', hint: 'The runes hide in pairs: wake one seal, then its twin', peek: 1.1 },
      wisp: { name: 'The Wisp', hint: 'Catch the wisp: stand on the seal it lands on', hop: 1.8, faster: 0.88, hold: 0.35 },
      match: { name: 'The Riddle', hint: 'Wake the seal whose rune the mural shows, round after round' } } },
  chest: { xpFrac: 0.5, gold: [60, 10], gems: [8, 14], shards: [3, 6], ilvlAdd: 4, caseChance: 0.15 },
  bonus: { gold: 0.4, items: 1 },
  reviveT: 3, reviveR: 2.6, wipeT: 2,
};
const DV = CFG.delve, DV_RAR = ['rare', 'epic', 'legendary', 'mythic', 'ancient', 'divine'];
function diffDef(i) {
  i = Math.max(0, i | 0); if (i < DV.diffs.length) return Object.assign({ i }, DV.diffs[i]);
  const r = i - DV.diffs.length + 1; // Ascendant rank
  return { i, name: `Ascendant ${r}`, lvl: 40 + 10 * r, hp: 1.6 * Math.pow(1.08, r - 1), dmg: 1.35 * Math.pow(1.05, r - 1), pow: 2 * Math.pow(1.12, r - 1), rooms: [9, 10], events: 4, puzzles: 3,
    items: Math.min(6, 4 + Math.floor(r / 3)), floor: r >= 6 ? 'ancient' : 'mythic', unique: Math.min(0.35, 0.18 + 0.02 * r), col: '#ffe27a', asc: r };
}
// RULE: a party dungeon must come out the same on every phone in the run (README 1.1). Everything that shapes the map,
// its rooms, monsters, puzzles and veins comes from the leader's seed. Never Math.random there, and never
// Array.sort with a random comparator: Safari and Chrome sort it differently, so iPhones and Androids got other maps.
function seededShuffle(arr, rng) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
// code shared with the open world rolls Math.random (champion modifiers, facing, wander timers): run it on a seeded stream
function withSeed(seed, fn) { const R = Math.random; Math.random = mulberry32(seed >>> 0); try { return fn(); } finally { Math.random = R; } }
const delveDef = (id) => DV.dungeons.find((d) => d.id === id) || DV.dungeons[0];
const biomeZones = (bi) => CFG.world.zones.map((z, i) => ({ z, i })).filter((o) => !o.z.safe && o.z.biome === bi);
// a dungeon opens at its own level (never before the mode's unlock); its monsters are that level plus the difficulty's
function delveBase(def) { return Math.max(DV.unlock, def.lvl || 1); }
function delveMinLevel(def) { return delveBase(def); }
function delveLevel(def, di) { return delveBase(def) + diffDef(di).lvl + tierAdd(); }
function delveZone(def) { const zs = biomeZones(def.biome); return zs.length ? zs[Math.floor(zs.length / 2)].i : 1; }
// Power: the number shown on level-ups, √(damage × health). The reference is a level-L hero in level-L Rare gear
// (no talents, no affixes), so the requirement climbs exactly as fast as heroes do.
const playerPower = () => powerOf(G.player);
function refPower(L) {
  let hp = hpAt(L), atk = atkAt(L);
  for (const slot of CFG.gear.slots) { const st = itemStats({ slot, rarity: 'rare', ilvl: L, up: 0 }); hp += st.hp; atk += st.atk; }
  return Math.sqrt(hp * atk);
}
function delveReq(def, di) { return Math.round(DV.powK * diffDef(di).pow * refPower(delveLevel(def, di))); }
// team: average Power; every member also needs the floor share of the requirement
function delveGate(def, di, powers) {
  powers = powers.filter((p) => p > 0); // a teammate whose Power has not arrived yet does not drag the average to 0
  const req = delveReq(def, di), avg = powers.length ? powers.reduce((a, b) => a + b, 0) / powers.length : 0, min = Math.round(req * DV.floor);
  return { req, avg: Math.round(avg), min, ok: avg >= req && powers.every((p) => p >= min), weak: powers.filter((p) => p < min).length };
}
function delveRec() { const p = G.profile; return p.delve || (p.delve = { clears: {}, best: {}, wk: { w: 0, done: {} }, pieces: {} }); }
// highest difficulty open on a dungeon: one past the best you cleared there
const delveTop = (def) => ((delveRec().best[def.id] ?? -1) + 1);
const delveOpen = (def) => G.profile.level >= delveMinLevel(def);
function delveWeekly(def, di) { const R = delveRec(), w = weekNum(Date.now()); if (R.wk.w !== w) R.wk = { w, done: {} }; return !R.wk.done[def.id + ':' + di]; }
// --- layout: rooms walk north/east/west from the start hall like the world dungeons, but with mixed hall shapes,
// pillars, dark halls, event rooms and fight types, all from the run seed
function delveLayout(seed, def, di) {
  const rng = mulberry32(seed >>> 0), D = diffDef(di), C = DV, ri = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const wpick = (arr) => { let t = 0; for (const a of arr) t += a.w; let r = rng() * t; for (const a of arr) { r -= a.w; if (r <= 0) return a; } return arr[0]; };
  const n = ri(D.rooms[0], D.rooms[1]), rooms = [], cors = [], walls = [], doors = [], props = [];
  const rect = (x, z, hx, hz) => ({ x0: x - hx, x1: x + hx, z0: z - hz, z1: z + hz });
  for (let i = 0; i <= n; i++) {
    const boss = i === n, sh = boss ? { n: 'throne', hx: C.bossH, hz: C.bossH } : i === 0 ? C.start : wpick(C.shapes);
    const mk = (x, z) => Object.assign(rect(x, z, sh.hx, sh.hz), { x, z, hx: sh.hx, hz: sh.hz, h: Math.min(sh.hx, sh.hz), i, boss, shape: sh.n });
    if (!i) { rooms.push(mk(DC.x, DC.z)); continue; }
    const a = rooms[i - 1], dirs = seededShuffle([[0, 1], [1, 0], [-1, 0]], rng);
    // the next hall goes north, east or west; when none fits, the corridor grows until one does (never through a hall
    // or another corridor). North always frees up in the end: the layout only ever grows north.
    let nr = null, dir = [0, 1];
    const hit = (r, m, skip) => rooms.some((o) => o !== skip && r.x0 < o.x1 + m && r.x1 > o.x0 - m && r.z0 < o.z1 + m && r.z1 > o.z0 - m) || cors.some((c) => r.x0 < c.x1 + m && r.x1 > c.x0 - m && r.z0 < c.z1 + m && r.z1 > c.z0 - m);
    for (let extra = 0; !nr && extra <= 600; extra += 12) for (const d of extra > 72 ? [[0, 1]] : dirs) {
      const L = C.corridor + extra, x = a.x + d[0] * (a.hx + L + sh.hx), z = a.z + d[1] * (a.hz + L + sh.hz), r = rect(x, z, sh.hx, sh.hz), w = C.corW / 2;
      const c = d[1] ? { x0: a.x - w, x1: a.x + w, z0: a.z1, z1: r.z0 } : { x0: d[0] > 0 ? a.x1 : r.x1, x1: d[0] > 0 ? r.x0 : a.x0, z0: a.z - w, z1: a.z + w };
      if (hit(r, 3) || hit(c, 0.5, a)) continue;
      nr = mk(x, z); dir = d; break;
    }
    rooms.push(nr);
    const w = C.corW / 2;
    cors.push(dir[1] ? { x0: a.x - w, x1: a.x + w, z0: a.z1, z1: nr.z0, ax: 'z' } : { x0: dir[0] > 0 ? a.x1 : nr.x1, x1: dir[0] > 0 ? nr.x0 : a.x0, z0: a.z - w, z1: a.z + w, ax: 'x' });
    doors.push(dir[1] ? { x: a.x, z: a.z1 + 0.6, ax: 'x', w, open: false, room: i - 1 } : { x: dir[0] > 0 ? a.x1 + 0.6 : a.x0 - 0.6, z: a.z, ax: 'z', w, open: false, room: i - 1 });
  }
  // side rooms: off a middle hall's free wall (never into a hall or a corridor), a short corridor, sometimes sealed by
  // a cracked wall; ids from 100 up (their monsters use slots 100xx-)
  const side = [], secrets = [], SR = C.side, nSide = ri(...SR.n[Math.min(di, SR.n.length - 1)]);
  const sideHit = (r, m, skip) => [...rooms, ...side].some((o) => o !== skip && r.x0 < o.x1 + m && r.x1 > o.x0 - m && r.z0 < o.z1 + m && r.z1 > o.z0 - m) || cors.some((c) => r.x0 < c.x1 + m && r.x1 > c.x0 - m && r.z0 < c.z1 + m && r.z1 > c.z0 - m);
  for (const pi of seededShuffle(rooms.slice(1, n).map((m) => m.i), rng)) {
    if (side.length >= nSide) break;
    const a = rooms[pi], hx = ri(SR.h[0], SR.h[1]), hz = ri(SR.h[0], SR.h[1]), w = C.corW / 2;
    for (const d of seededShuffle([[0, 1], [0, -1], [1, 0], [-1, 0]], rng)) {
      const L = SR.corridor, x = a.x + d[0] * (a.hx + L + hx), z = a.z + d[1] * (a.hz + L + hz), r = rect(x, z, hx, hz);
      const c = d[1] ? { x0: a.x - w, x1: a.x + w, z0: d[1] > 0 ? a.z1 : r.z1, z1: d[1] > 0 ? r.z0 : a.z0, ax: 'z' } : { x0: d[0] > 0 ? a.x1 : r.x1, x1: d[0] > 0 ? r.x0 : a.x0, z0: a.z - w, z1: a.z + w, ax: 'x' };
      if (sideHit(r, 3) || sideHit(c, 0.5, a)) continue;
      const k = side.length, kind = wpick(SR.kinds);
      side.push(Object.assign(r, { x, z, hx, hz, h: Math.min(hx, hz), i: 100 + k, side: true, parent: pi, kind: kind.k, guards: kind.guards, shape: 'side' }));
      cors.push(Object.assign(c, { side: true }));
      if (rng() < SR.secret) secrets.push(d[1] ? { x: a.x, z: d[1] > 0 ? a.z1 + 0.6 : a.z0 - 0.6, ax: 'x', w, open: false, side: k } : { x: d[0] > 0 ? a.x1 + 0.6 : a.x0 - 0.6, z: a.z, ax: 'z', w, open: false, side: k });
      break;
    }
  }
  // walls with corridor gaps (same walk as dungeonLayout)
  const gap = (x, z) => cors.some((c) => c.ax === 'z' ? Math.abs(x - (c.x0 + c.x1) / 2) < C.corW / 2 - 0.01 && (Math.abs(z - c.z0) < 0.01 || Math.abs(z - c.z1) < 0.01)
    : Math.abs(z - (c.z0 + c.z1) / 2) < C.corW / 2 - 0.01 && (Math.abs(x - c.x0) < 0.01 || Math.abs(x - c.x1) < 0.01));
  const seg = (x0, z0, x1, z1) => { if (Math.hypot(x1 - x0, z1 - z0) > 0.05) walls.push({ x0, z0, x1, z1 }); };
  const edge = (x0, z0, x1, z1) => {
    const k = Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.5); let sx = null, sz = null;
    for (let s = 0; s <= k; s++) {
      const x = lerp(x0, x1, s / k), z = lerp(z0, z1, s / k), open = gap(x, z);
      if (!open && sx == null) { sx = x; sz = z; }
      if ((open || s === k) && sx != null) { seg(sx, sz, open ? lerp(x0, x1, (s - 1) / k) : x, open ? lerp(z0, z1, (s - 1) / k) : z); sx = sz = null; }
    }
  };
  for (const r of [...rooms, ...side]) { edge(r.x0, r.z0, r.x1, r.z0); edge(r.x0, r.z1, r.x1, r.z1); edge(r.x0, r.z0, r.x0, r.z1); edge(r.x1, r.z0, r.x1, r.z1); }
  // what each side room holds: guard spots round the middle, the chest or vein in the middle, the den's champion by it
  for (const m of side) { m.spots = []; for (let k = 0; k < m.guards; k++) { const a = (k + rng() * 0.5) / m.guards * Math.PI * 2; m.spots.push({ x: m.x + Math.sin(a) * m.hx * 0.55, z: m.z + Math.cos(a) * m.hz * 0.55, e: rng() }); } m.lode = rng() < 0.2; }
  for (const c of cors) { if (c.ax === 'z') { seg(c.x0, c.z0, c.x0, c.z1); seg(c.x1, c.z0, c.x1, c.z1); } else { seg(c.x0, c.z0, c.x1, c.z0); seg(c.x0, c.z1, c.x1, c.z1); } }
  // the mini-boss hall sits halfway; events go in the other middle rooms (never the start or boss hall), no type twice
  const mi = n >= 3 ? Math.floor(n / 2) : -1;
  const mids = seededShuffle(rooms.slice(1, n).map((m) => m.i).filter((i) => i !== mi), rng), evKeys = seededShuffle(Object.keys(C.events), rng);
  // puzzle halls first (two a run), then events, always leaving one plain fight hall
  const npz = clamp(Math.min(D.puzzles || 1, mids.length - 1), 0, 3), nev = Math.max(0, Math.min(D.events, mids.length - npz - 1));
  for (let k = 0; k < nev; k++) rooms[mids[k]].event = evKeys[k];
  for (let k = 0; k < npz; k++) rooms[mids[nev + k]].puzzle = true;
  const pzKinds = seededShuffle(Object.keys(C.puzzle.kinds), rng); let pzAt = 0;
  for (const m of rooms) {
    if (m.boss) { m.fight = 'boss'; continue; }
    const SP = C.spread, full = clamp(Math.round(4 * m.hx * m.hz / SP.area), SP.n[0], SP.n[1]);
    if (m.puzzle) { m.fight = 'puzzle'; m.count = C.puzzle.guards[Math.min(di, C.puzzle.guards.length - 1)]; m.waves = 1; }
    else if (m.i === mi) { m.fight = 'champion'; m.mini = true; m.count = C.mini.guards; m.waves = 1; }
    else if (!m.event) { const f = wpick(C.fights); m.fight = f.k; m.waves = f.waves || 1; m.count = f.k === 'guard' ? full : Math.max(2, Math.ceil(full / 2)); }
    else { m.fight = 'guard'; m.count = Math.max(3, Math.round(full * (m.event === 'traps' ? 0.5 : 0.6))); m.waves = 1; } // event halls are guarded too (no empty halls)
    m.dark = m.i > 0 && rng() < C.mods.dark;
    // pillars: cover in the big halls (more in the arenas), kept clear of the doors' lanes
    if (!m.event && m.i > 0 && m.hx >= 15 && m.hz >= 15 && rng() < C.mods.pillars) {
      m.pillars = true; const at = [[0.45, 0.45]]; if (m.hx >= 24) at.push([0.22, 0.65], [0.65, 0.22]);
      for (const [ax, az] of at) for (const sx of [-1, 1]) for (const sz of [-1, 1]) props.push({ x: m.x + sx * m.hx * ax, z: m.z + sz * m.hz * az, r: 0.9, room: m.i });
    }
    // fixed spawn spots, spread over the hall: the run's slots (room × 100 + k) match in every party member's game.
    // `d` is the distance from the way in (the start hall's way in is the south wall, where you arrive)
    const pv = m.i ? rooms[m.i - 1] : null, ex = pv ? Math.sign(Math.round(pv.x - m.x)) : 0, ez = pv ? Math.sign(Math.round(pv.z - m.z)) : -1;
    m.entry = { x: m.x + ex * m.hx, z: m.z + ez * m.hz }; m.spots = [];
    for (let w = 0; w < m.waves; w++) {
      const pts = [];
      for (const gap of [SP.gap, SP.gap * 0.85, SP.gap * 0.75]) for (let t = 0; t < 300 && pts.length < m.count; t++) { // never closer than ~4.5 m: a full hall takes fewer instead
        const x = m.x + (rng() * 2 - 1) * (m.hx - 3), z = m.z + (rng() * 2 - 1) * (m.hz - 3), d = Math.hypot(x - m.entry.x, z - m.entry.z);
        if (d < Math.min(SP.entry, Math.max(m.hx, m.hz)) || pts.some((q) => Math.hypot(q.x - x, q.z - z) < gap) || props.some((q) => q.room === m.i && Math.hypot(q.x - x, q.z - z) < 2)) continue;
        pts.push({ x, z, d, e: rng() });
      }
      while (pts.length < m.count) pts.push(pts.length ? Object.assign({}, pts[pts.length - 1], { dup: true }) : { x: m.x, z: m.z, d: 0, e: rng(), dup: true }); // keep the slot count (unused)
      m.spots.push(...pts);
    }
    if (m.event === 'plates') m.plates = [[-1, -1], [1, 1], [-1, 1], [1, -1]].map(([a, b]) => ({ x: m.x + a * m.hx * 0.5, z: m.z + b * m.hz * 0.5 }));
    if (m.event === 'mimic') m.mimic = rng() < C.events.mimic.odds;
    if (m.puzzle) { m.pz = delvePuzzleMake(rng, m, rooms[m.i - 1], di, pzKinds[pzAt++ % pzKinds.length]); for (const q of m.pz.sw) if (q.lever) props.push({ x: q.x, z: q.z, r: 0.55, room: m.i, kind: 'lever' }); }
  }
  // rare veins, tucked toward a hall's corner (clear of the walls, braziers, doors and pillars)
  const veins = [], V = C.veins, okRoom = rooms.filter((m) => m.i > 0 && !m.boss && !m.pz);
  for (const want of [Math.min(V.max, V.chance + V.perDiff * di), V.second]) {
    if (rng() >= want || !okRoom.length) break;
    const m = okRoom.splice(Math.floor(rng() * okRoom.length), 1)[0], sx = rng() < 0.5 ? -1 : 1, sz = rng() < 0.5 ? -1 : 1;
    veins.push({ room: m.i, x: m.x + sx * m.hx * 0.78, z: m.z + sz * m.hz * 0.78, lode: rng() < V.lode });
  }
  const r0 = rooms[0], b = rooms[n], span = Math.max(...[...rooms, ...side].map((m) => Math.hypot(Math.max(Math.abs(m.x0 - DC.x), Math.abs(m.x1 - DC.x)), Math.max(Math.abs(m.z0 - DC.z), Math.abs(m.z1 - DC.z))))) + 40;
  for (const m of side) if (m.kind === 'vein') veins.push({ room: m.i, side: true, x: m.x, z: m.z, lode: m.lode });
  return { rooms, side, secrets, cors, walls, doors, props, veins, span, start: { x: r0.x, z: r0.z0 + 4 }, exit: { x: r0.x - 4, z: r0.z0 + 2.2 }, chest: { x: b.x, z: b.z }, exit2: { x: b.x, z: b.z + 5 } };
}
// a puzzle hall's seals round the room (clear of the door lanes), their order, and the mural by the entrance
function delvePuzzleMake(rng, m, prev, di, kind) {
  const P = DV.puzzle, K = Math.min(kind === 'order' ? 5 : 6, P.switches[Math.min(di, P.switches.length - 1)]), rot = rng() * Math.PI * 2, glyphs = seededShuffle([0, 1, 2, 3, 4, 5, 6, 7], rng), sw = [];
  for (let k = 0; k < K; k++) { const a = rot + (k + 0.5) / K * Math.PI * 2 + (rng() - 0.5) * 0.4; sw.push({ x: m.x + Math.sin(a) * m.hx * 0.58, z: m.z + Math.cos(a) * m.hz * 0.58, lever: rng() < 0.5, g: glyphs[k] }); }
  const order = seededShuffle(sw.map((_, k) => k), rng), dx = Math.sign(Math.round(m.x - prev.x)), dz = Math.sign(Math.round(m.z - prev.z)), half = K * 0.85;
  // the mural: a strip of tiles (read left to right on screen) by the entry wall, beside the door lane
  const clue = dz ? { x: m.x - (4 + half), z: m.z - dz * (m.hz - 3) } : { x: m.x - dx * (m.hx - 2.5 - half), z: m.z + 6 };
  const pz = { kind, sw, order, clue, pips: kind === 'order' && di <= 1 && rng() < 0.5, all: (1 << K) - 1, need: K };
  if (kind === 'pairs') { // an even number of seals, the runes in twins (the last seal of an odd set sleeps)
    const P2 = K - (K % 2), g = seededShuffle(glyphs.slice(0, P2 / 2).flatMap((x) => [x, x]), rng);
    sw.length = P2; sw.forEach((q, j) => { q.g = g[j]; }); pz.all = (1 << P2) - 1; pz.need = P2; pz.order = order.filter((j) => j < P2);
  }
  if (kind === 'wisp') { // where the wisp lands, hop after hop (never twice on the same seal)
    pz.need = di >= 2 ? 4 : 3; pz.seq = []; let last = -1; for (let i = 0; i < 64; i++) { let j = Math.floor(rng() * K); if (j === last) j = (j + 1) % K; pz.seq.push(last = j); }
  }
  if (kind === 'match') pz.need = Math.min(K, di >= 3 ? 4 : 3); // rounds: the mural shows the rune of order[step]
  if (kind === 'timed') { // the clock: the walk round the seals plus a moment on each, a little slack
    let path = 0, gap = 0; for (let k = 0; k < K; k++) { const a = sw[k], b = sw[(k + 1) % K], d = Math.hypot(a.x - b.x, a.z - b.z); path += d; gap = Math.max(gap, d); }
    const T = DV.puzzle.kinds.timed; pz.clock = Math.round((path - gap) / T.walk + K * DV.puzzle.hold + T.slack);
  }
  if (kind === 'toggle') { // scrambled from all lit by two presses, so it can always be solved
    const a = Math.floor(rng() * K), b = (a + 1 + Math.floor(rng() * (K - 1))) % K; pz.start = pz.all ^ delvePzMask(K, a) ^ delvePzMask(K, b);
  }
  return pz;
}
const delvePzMask = (K, j) => (1 << j) | (1 << ((j + 1) % K)) | (1 << ((j + K - 1) % K));
// --- run
const delveOn = () => !!(G.dungeon && G.dungeon.delve);
function delveRoster(def) { const out = []; for (const { z } of biomeZones(def.biome)) for (const t of [z.enemy, z.alt]) if (t && CFG.enemies[t] && !out.includes(t)) out.push(t); return out.length ? out : ['thistlehare']; }
// one monster in a fixed slot; dungeonMob does the level, HP and damage scaling
function delveMob(D, room, k, o) {
  const X = D.delve, slot = (o.slotRoom != null ? o.slotRoom : room) * 100 + k; if (X.slots.has(slot)) return X.slots.get(slot);
  const type = o.type || X.roster[Math.floor((o.pick != null ? o.pick : 0) * X.roster.length) % X.roster.length];
  const e = withSeed(X.seed ^ Math.imul(slot + 1, 2654435761), () => dungeonMob(D, type, o.lvl || D.lvl, room, o));
  e.delve = true; e.slot = slot; e.own = null;
  const m = X.diff, hp = DV.hpParty[clamp(X.n, 1, 4) - 1] * m.hp;
  const T = o.boss ? { hp: 1, dmg: 1 } : DV.tough; // fewer monsters, each one tougher
  e.maxHp = Math.round(e.maxHp * hp * T.hp); e.hp = e.maxHp; e.atk *= m.dmg * T.dmg;
  if (o.goblin) { e.goblin = true; e.flee = true; e.atkCd = 1e9; e.maxHp = e.hp = Math.round(e.maxHp * 0.6); }
  if (o.name) e.champName = o.name;
  X.slots.set(slot, e); return e;
}
function spawnRoomWave(D, m, w) {
  const X = D.delve, el = m.fight === 'elites';
  // roles: ranged monsters take the spots furthest from the way in (tucked behind a pillar when one is near), melee ones
  // the nearer spots; all of it from the seed, so every game puts every monster in the same place
  const spots = m.spots.slice(w * m.count, (w + 1) * m.count), SP = DV.spread;
  const type = (s) => X.roster[Math.floor(s.e * X.roster.length) % X.roster.length], ranged = (s) => (CFG.enemies[type(s)] || {}).attack !== 'touch';
  const where = spots.filter((s) => !s.dup).sort((a, b) => b.d - a.d), used = new Set();
  const place = spots.map((s) => (s.dup ? null : ranged(s) ? where.shift() : where.pop()));
  // a captain (elite) holds the back of a full hall; a few others patrol the hall instead of standing still
  const capK = !w && spots.length >= SP.captain ? place.findIndex((q, k) => q && !ranged(spots[k])) : -1;
  for (let k = 0; k < spots.length; k++) {
    const s = spots[k]; if (!place[k]) continue; let { x, z } = place[k];
    // a ranged one takes cover behind the nearest free pillar (one per pillar: they never stack)
    if (ranged(s)) { const pil = D.props.find((q) => q.room === m.i && !q.kind && !used.has(q) && Math.hypot(q.x - x, q.z - z) < SP.cover);
      if (pil) { const dx = pil.x - m.entry.x, dz = pil.z - m.entry.z, dd = Math.hypot(dx, dz) || 1, cx = pil.x + dx / dd * 2.2, cz = pil.z + dz / dd * 2.2;
        if (!place.some((q, j) => j !== k && q && Math.hypot(q.x - cx, q.z - cz) < SP.gap * 0.75)) { used.add(pil); x = place[k].x = cx; z = place[k].z = cz; } } }
    const e = delveMob(D, m.i, w * m.count + k, { x, z, pick: s.e, elite: el || k === capK || s.e < 0.12 + X.diff.i * 0.03, chase: w > 0 }); m.mobs.push(e);
    if (k === capK) e.captain = true;
    else if (!w && !ranged(s) && (s.e * 7.3) % 1 < SP.patrol) e.wr = SP.roam; // a patroller wanders a wide loop round its post
  }
  // the mini-boss stands in the middle of its hall, its guards round it
  if (m.mini && !w) { const e = delveMob(D, m.i, 90, { boss: true, pick: 0.7, lvl: D.lvl + 1, x: m.x, z: m.z, name: X.def.mini }); e.maxHp = e.hp = Math.round(e.maxHp * DV.mini.hp); e.mini = true; e.delveBoss = true; m.mobs.push(e); }
  m.wave = w;
}
// diff: difficulty index; n: party size at the start (sets monster HP); seed: the leader's run seed
function startDelve(id, di, seed, n, lead = true) {
  const p = G.profile, pl = G.player, def = delveDef(id);
  if (inInstance() || G.mode !== 'hub' || !pl.alive || !delveOpen(def) || di > delveTop(def)) return false;
  if (G.boss && Math.hypot(G.boss.x - pl.x, G.boss.z - pl.z) < CFG.dungeon.bossBlock) return false;
  for (const e of G.enemies) if (e.own) e.own = null; // the open world's shared monsters go back to this game
  seed = (seed >>> 0) || ((Math.random() * 4294967295) >>> 0);
  const L = delveLayout(seed, def, di), diff = diffDef(di), zi = delveZone(def), lvl = delveLevel(def, di);
  const poi = { id: 'delve:' + def.id, kind: 'delve', zone: zi, lvl, name: def.name };
  const D = G.dungeon = Object.assign(L, { id: poi.id, poi, zone: zi, variant: { name: def.name, counts: [], par: 600, hp: 14, mods: diff.i >= 3 ? 4 : 3, trial: false }, key: null, lvl, t0: G.time, clearT: 0, newKey: null,
    room: 0, mobs: [], boss: null, bossDead: false, chestOpen: false, addsDone: false, enterPos: { x: pl.x, z: pl.z } });
  const humans = clamp(n | 0 || 1, 1, DV.maxParty);
  D.delve = { def, diff, di, seed, humans, n: DV.bots && DV.bots.on ? DV.maxParty : humans, bots: [], roster: delveRoster(def), slots: new Map(), cursed: false, bonus: {}, used: {}, downT: 0, wipeT: 0, revive: null, plates: {}, ev: {}, pz: {}, emit: [], mined: {}, claimed: {} };
  dungeonGrid(D); clearProjectiles();
  pl.x = D.start.x; pl.z = D.start.z; pl.facing = 0; pl.hp = pl.maxHp; pl.invulnT = 1.5; pl.ammo = pl.ammoMax;
  G.zoneIdx = zi;
  D.rooms.forEach((m) => { m.mobs = []; m.cleared = false; m.wave = -1; m.seen = false; if (!m.boss && m.count) spawnRoomWave(D, m, 0); });
  // side rooms: guards round the middle; a den also has its champion (an elite with modifiers). Their monsters count for
  // the hall they hang off (bots treat them like that hall's), slots from the side room's own id
  for (const m of D.side || []) {
    m.mobs = []; m.seen = false;
    m.spots.forEach((s, k) => m.mobs.push(delveMob(D, m.parent, k, { slotRoom: m.i, x: s.x, z: s.z, pick: s.e, elite: m.kind === 'den' })));
    if (m.kind === 'den') { const e = delveMob(D, m.parent, 9, { slotRoom: m.i, boss: true, pick: 0.4, lvl: D.lvl + 1, x: m.x, z: m.z + 2, name: 'Den Champion' }); e.maxHp = e.hp = Math.round(e.maxHp * DV.side.denHp); m.mobs.push(e); }
  }
  const b = D.rooms.at(-1);
  D.boss = delveMob(D, b.i, 0, { type: D.delve.roster[D.delve.roster.length - 1], boss: true, lvl: lvl + CFG.dungeon.boss.lvlAdd, x: b.x, z: b.z + 4, name: def.boss });
  D.boss.maxHp = D.boss.hp = Math.round(D.boss.maxHp * DV.boss.hp); D.boss.delveBoss = true; b.mobs = [D.boss]; D.phase = 0;
  if (lead && D.delve.n > humans) delveBotsMake(D, humans); // computer heroes fill the empty places, sized to this run's monsters (36d-delve-bots.js)
  ev({ t: 'dungeonStart', name: def.name, lvl, key: 0, x: pl.x, z: pl.z, delve: true, diff: diff.name, n: D.delve.n }); return true;
}
// who of the party is in this run with us (peers in the same run seed); always includes the local player
function delveParty() {
  const D = G.dungeon, X = D && D.delve; if (!X) return [];
  const peers = typeof MP !== 'undefined' ? MP.list.filter((e) => e.md === 'delve' && e.dr === X.seed) : [];
  return [G.player, ...peers, ...(X.bots || [])];
}
const anyoneIn = (m) => delveParty().some((f) => f.alive !== false && inRoom(m, f.x, f.z));
// the monster runs away from the nearest hero (gold goblin); called from stepEnemy
function fleeStep(e, dt) {
  let best = null, bd = 1e9; for (const f of delveParty()) { if (f.alive === false) continue; const d = Math.hypot(f.x - e.x, f.z - e.z); if (d < bd) { bd = d; best = f; } }
  e.atkCd = 1e9; e.flashT -= dt; e.slowT -= dt;
  if (best && bd < 14) { const dx = e.x - best.x, dz = e.z - best.z, d = Math.hypot(dx, dz) || 1, sp = 6.2 * (e.slowT > 0 ? 0.5 : 1); e.x += dx / d * sp * dt; e.z += dz / d * sp * dt; e.facing = Math.atan2(dx, dz); e.moveAmt = 1; }
  else e.moveAmt = Math.max(0, (e.moveAmt || 0) - dt * 3);
  trackVel(e, dt); collideObstacles(e); dungeonClamp(e, e.r);
  return true;
}
function stepDelve(dt) {
  const D = G.dungeon, X = D.delve, pl = G.player, E = DV.events;
  if (Math.hypot(pl.x - DC.x, pl.z - DC.z) > (D.span || 260)) { endDungeon('away'); return; }
  D.rooms.forEach((m, i) => { if (pl.alive && inRoom(m, pl.x, pl.z)) D.room = i; });
  // a fall: wait for a teammate; when everyone is down the run fails
  const party = delveParty(), up = party.filter((f) => f.alive !== false);
  if (!pl.alive) {
    G.respawnT = 1e9;
    if (!up.length) { if ((X.wipeT += dt) >= DV.wipeT) { endDungeon('down'); return; } } else X.wipeT = 0;
  } else X.wipeT = 0;
  if (X.cursed && pl.alive && pl.hp > pl.maxHp * E.altar.hpCap) pl.hp = pl.maxHp * E.altar.hpCap;
  stepDelveRevive(dt, party);
  stepDelveBots(dt);
  stepDelveEmit(dt);
  for (const m of D.rooms) {
    if (m.boss) continue;
    const seen = m.seen || anyoneIn(m); if (seen && !m.seen) { m.seen = true; if (m.event) ev({ t: 'delveEvent', k: m.event, x: m.x, z: m.z }); if (m.mini) ev({ t: 'delveMini', name: X.def.mini, x: m.x, z: m.z }); if (m.pz) ev({ t: 'delvePuzzle', name: X.def.puzzle, kind: m.pz.kind, pips: m.pz.pips, x: m.x, z: m.z }); }
    // a monster that wakes by itself calls its close neighbours; those don't call further (no chain through the hall)
    for (const e of m.mobs) if (e.alive && e.state === 'chase' && !e.alerted && !e.own) {
      e.alerted = true; for (const o of m.mobs) if (o !== e && o.alive && o.state === 'idle' && !o.own && Math.hypot(o.x - e.x, o.z - e.z) < DV.spread.alert) { o.state = 'chase'; o.alerted = true; }
    }
    // swarm waves: the next wave comes when the last one is down
    if (m.waves > 1 && m.wave < m.waves - 1 && m.seen && m.mobs.length && !m.mobs.some((e) => e.alive)) { spawnRoomWave(D, m, m.wave + 1); ev({ t: 'delveWave', n: m.wave + 1, of: m.waves, x: m.x, z: m.z }); }
    if (m.event && m.seen) stepDelveEvent(D, m, dt);
    if (m.pz && m.seen) stepDelvePuzzle(D, m, dt);
  }
  // side rooms: found when someone walks in; their guards call each other like a hall's
  for (const m of D.side || []) {
    if (!m.seen && anyoneIn(m)) { m.seen = true; ev({ t: 'delveSide', name: DV.side.names[m.kind], kind: m.kind, x: m.x, z: m.z }); }
    for (const e of m.mobs) if (e.alive && e.state === 'chase' && !e.alerted && !e.own) { e.alerted = true; for (const o of m.mobs) if (o !== e && o.alive && o.state === 'idle' && !o.own) { o.state = 'chase'; o.alerted = true; } }
  }
  // doors open in order: a room's door needs every door before it open (and its own room done)
  for (let k = 0; k < D.doors.length; k++) {
    const d = D.doors[k], m = D.rooms[d.room]; if (d.open) continue;
    if (m.mobs.some((e) => e.alive) || (m.waves > 1 && m.wave < m.waves - 1) || !roomDoorFree(D, m)) break;
    delveDoorOpen(D, k, true);
  }
  const b = D.boss;
  // boss phases: adds at each step down; the last phase also makes it faster and harder hitting
  const PH = DV.boss.phases;
  if (b.alive && (D.phase | 0) < PH.length && b.hp < b.maxHp * PH[D.phase | 0]) {
    const ph = D.phase = (D.phase | 0) + 1, bm = D.rooms.at(-1), last = ph === PH.length; D.addsDone = true;
    for (let k = 0; k < 2 + Math.min(2, X.n - 1); k++) { const a = (k / 4) * Math.PI * 2; bm.mobs.push(delveMob(D, bm.i, ph * 10 + k, { x: b.x + Math.sin(a) * 3, z: b.z + Math.cos(a) * 3, pick: k / 4, chase: true, elite: X.diff.i >= 2 || last })); }
    if (last) { b.spd = (b.spd || 1) * DV.boss.rage.spd; b.atk *= DV.boss.rage.atk; b.raged = true; }
    ev({ t: 'dungeonAdds', x: b.x, z: b.z }); ev({ t: 'delvePhase', n: ph + 1, of: PH.length + 1, rage: last, name: X.def.boss, adds: (CFG.delve.bossKit.unlock[ph] || []).map((k) => CFG.delve.bossKit.names[k]), x: b.x, z: b.z });
  }
  if (!b.alive && !D.bossDead) { D.bossDead = D.rooms.at(-1).cleared = true; D.clearT = G.time - D.t0; ev({ t: 'dungeonBoss', x: D.chest.x, z: D.chest.z, name: X.def.name, secs: Math.round(D.clearT), par: 0, key: 0, up: 0, delve: true }); }
}
// the first game that sees a room done opens its door and tells the party ('ddoor'), so the gate opens on every
// phone at the same moment instead of whenever each one hears the last monster fall
function delveDoorOpen(D, k, send) {
  const d = D.doors[k], m = D.rooms[d.room]; d.open = m.cleared = true; dungeonGrid(D);
  ev({ t: 'dungeonRoom', i: d.room + 1, n: D.rooms.length - 1, boss: d.room + 1 === D.rooms.length - 1 });
  if (send && typeof partySend === 'function') partySend('ddoor', { dr: D.delve.seed, i: k });
}
function delveDoorRecv(P) {
  if (!delveOn() || mpNum(P.dr, -1) >>> 0 !== G.dungeon.delve.seed) return;
  const D = G.dungeon, n = Math.min(mpNum(P.i, -1) | 0, D.doors.length - 1);
  for (let k = 0; k <= n; k++) {
    if (D.doors[k].open) continue;
    // what is still standing here is already down on the sender's game; event monsters keep syncing on their own
    const m = D.rooms[D.doors[k].room], s = D.delve.ev[m.i];
    for (const e of m.mobs) if (e.alive && !(s && e === s.mob)) { e.alive = false; e.hp = 0; e.respawnT = 1e9; ev({ t: 'die', x: e.x, z: e.z, kind: e.type, elite: !!e.elite }); }
    if (m.waves > 1) m.wave = m.waves - 1;
    delveDoorOpen(D, k, false);
  }
}
// side rooms: a chest or vein opens once its guards are down; a cracked wall opens for the whole party ('dsec')
function delveSideGuarded(D, at) { const m = (D.side || []).find((o) => inRoom(o, at.x, at.z)); return !!m && m.mobs.some((e) => e.alive); }
function delveSecretOpen(D, i) { const q = D.secrets[i]; if (!q || q.open) return; q.open = true; dungeonGrid(D); ev({ t: 'delveSecret', x: q.x, z: q.z }); }
function delveSecretRecv(P) { if (!delveOn() || mpNum(P.dr, -1) >>> 0 !== G.dungeon.delve.seed) return; delveSecretOpen(G.dungeon, clamp(mpNum(P.i, -1) | 0, -1, 99)); }
// --- puzzles: the state every game keeps per puzzle hall. `v` counts changes (the newest wins, ties go to the lower
// session id), `step` = seals awake in order (mural, echo), `bits` = which seals are lit (race, balance)
const delvePz = (D, m) => D.delve.pz[m.i] || (D.delve.pz[m.i] = { v: 0, step: 0, bits: m.pz.kind === 'toggle' ? m.pz.start : 0, fails: 0, hold: m.pz.sw.map(() => 0), cd: 0, done: false, flash: 0, t: 0, show: 0 });
const pzOrdered = (pz) => pz.kind === 'order' || pz.kind === 'memory' || pz.kind === 'match';
const pzCounted = (pz) => pzOrdered(pz) || pz.kind === 'wisp'; // progress is `step`; the others light `bits`
// the wisp's seal right now: it hops on a fixed seeded path, faster after every catch (its clock restarts on each catch)
function delvePzWisp(m, S) { const W = DV.puzzle.kinds.wisp, hop = W.hop * Math.pow(W.faster, S.step); return m.pz.seq[Math.floor(S.t / hop) % m.pz.seq.length]; }
// the echo's light show: after a short lead-in each seal of the order flashes in turn, then a pause, then again. It
// plays while no seal is awake, and the seals don't listen while it plays. Returns the flashing seal, -1 between
// flashes, or null when the show isn't playing.
function delvePzShow(m, S) {
  if (m.pz.kind !== 'memory' || !S || S.done || S.step || S.cd > 0) return null;
  const E = DV.puzzle.kinds.memory, K = m.pz.sw.length, ph = S.show % (E.lead + K * E.show + E.gap) - E.lead;
  if (ph >= K * E.show) return null; if (ph < 0) return -1; // the lead-in counts as playing: nothing lit yet
  return ph % E.show < E.show * 0.7 ? m.pz.order[Math.floor(ph / E.show)] : -1;
}
function delvePzLit(m, S, j) { return S.done || (pzOrdered(m.pz) ? m.pz.order.indexOf(j) < S.step : m.pz.kind === 'wisp' ? false : !!((S.bits >> j) & 1)); }
function stepDelvePuzzle(D, m, dt) {
  const P = DV.puzzle, S = delvePz(D, m), pz = m.pz; S.flash = Math.max(0, S.flash - dt);
  if (S.done) return; if (S.cd > 0) { S.cd -= dt; return; }
  // the show's clock only runs while it can play, so after a mistake it starts again from the first seal (it used to
  // run on through the red flash and restart halfway, showing a wrong order)
  if (pz.kind === 'memory' && !S.step) { S.show += dt; if (delvePzShow(m, S) != null) { S.hold = S.hold.map(() => 0); return; } }
  // the race: the clock runs out with seals still dark
  if (pz.kind === 'timed' && S.bits && (S.t -= dt) <= 0) { delvePzApply(D, m, { v: S.v + 1, s: 0, b: 0, f: S.fails + 1 }, true); return; }
  if (S.peek) { if ((S.peek.t -= dt) <= 0) S.peek = null; }
  const wisp = pz.kind === 'wisp' ? (S.t += dt, delvePzWisp(m, S)) : -1;
  const next = pz.order[S.step], party = delveParty().filter((f) => f.alive !== false);
  pz.sw.forEach((q, j) => {
    if (pz.kind !== 'toggle' && delvePzLit(m, S, j)) return; // already awake
    if (pz.kind === 'pairs' && S.step === j + 1) return; // the open twin
    if (pz.kind === 'wisp' && j !== wisp) { S.hold[j] = 0; return; } // only the wisp's seal counts
    // heroes count on any seal; a bot only where it can't be wrong (the next seal in order, any dark seal in a race, the wisp)
    const botOk = pzOrdered(pz) ? j === next : pz.kind === 'timed' || pz.kind === 'wisp';
    const on = party.some((f) => (!f.delveBot || botOk) && Math.hypot(f.x - q.x, f.z - q.z) < P.r);
    if (!on) { S.hold[j] = 0; return; } if (S.hold[j] < 0) return; // still standing there since the last change: step off first
    if ((S.hold[j] += dt) < (pz.kind === 'wisp' ? DV.puzzle.kinds.wisp.hold : P.hold)) return;
    S.hold[j] = pz.kind === 'toggle' || pz.kind === 'pairs' ? -1 : 0;
    const st = { v: S.v + 1, s: S.step, b: S.bits, f: S.fails };
    if (pzOrdered(pz)) { if (j === next) st.s++; else { st.s = 0; st.f++; } }
    else if (pz.kind === 'wisp') st.s++;
    else if (pz.kind === 'timed') st.b |= 1 << j;
    else if (pz.kind === 'pairs') { // first of a pair opens; the second matches or both hide again (no punishment)
      const o = S.step - 1;
      if (o < 0) st.s = j + 1; else if (pz.sw[o].g === q.g) { st.b |= (1 << j) | (1 << o); st.s = 0; } else { st.s = 0; st.f++; st.pa = o; st.pb = j; }
    } else st.b ^= delvePzMask(pz.sw.length, j);
    delvePzApply(D, m, st, true);
  });
}
// apply a puzzle state (ours, or a party member's 'dpz'): a new fail resets and punishes, woken seals light up
function delvePzApply(D, m, st, mine, sid) {
  const S = delvePz(D, m), P = DV.puzzle, pz = m.pz, K = pz.sw.length, X = D.delve;
  if (S.done || st.v < S.v || (st.v === S.v && (mine || !sid || !(sid < MP.sid)))) return;
  if (!mine && st.v === S.v && st.s === S.step && st.b === S.bits && st.f === S.fails) return;
  const lit0 = pzCounted(pz) ? S.step : popcount(S.bits);
  if (st.f > S.fails && pz.kind === 'pairs') { // a mismatch: both runes show a moment, then hide again
    S.peek = { a: st.pa | 0, b: st.pb | 0, t: DV.puzzle.kinds.pairs.peek }; S.flash = 0.5; ev({ t: 'delvePzMiss', x: m.x, z: m.z });
  } else if (st.f > S.fails) {
    S.cd = P.failCd; S.flash = 0.8; S.hold = S.hold.map(() => -1); S.show = 0;
    if (st.f % 2) { // spike burst under every hero this game runs in the hall
      for (const f of [G.player, ...(X.bots || [])]) if (f.alive !== false && inRoom(m, f.x, f.z)) G.pendingAoE.push({ x: f.x, z: f.z, r: 2.4, t: 0.9, max: 0.9, dmg: f.maxHp * P.spike * X.diff.dmg, team: 'mob', owner: 0, kind: 'slam', pal: areaFx(D.zone) });
    } else for (let k = 0, n = Math.min(P.packMax, P.pack + Math.floor(X.di * P.packDiff)); k < n; k++) { // a pack crawls out of the floor, the same slots in every game
      // slots 50-85 of this hall, reused once their monster is down (they used to run past 99 into the next hall's
      // slots: the hall then waited on a monster behind its own closed gate, which never opened)
      const slot = 50 + ((st.f >> 1) % 6) * 6 + k, old = X.slots.get(m.i * 100 + slot); if (old && !old.alive) X.slots.delete(m.i * 100 + slot);
      const a = k / n * Math.PI * 2, e = delveMob(D, m.i, slot, { x: m.x + Math.sin(a) * 2.5, z: m.z + Math.cos(a) * 2.5, pick: (st.f + k) / 7 % 1, chase: true });
      e.pzPack = true; if (!m.mobs.includes(e)) m.mobs.push(e);
    }
    ev({ t: 'delvePzFail', spikes: !!(st.f % 2), timed: pz.kind === 'timed', x: m.x, z: m.z });
  }
  if (pz.kind === 'timed' && !S.bits && st.b) { S.t = pz.clock; ev({ t: 'delvePzClock', secs: pz.clock, x: m.x, z: m.z }); }
  if (pz.kind === 'wisp' && st.s > S.step) S.t = 0; // the wisp starts its next round from the same spot on every phone
  S.v = st.v; S.step = st.s; S.bits = st.b; S.fails = st.f;
  const lit = pzCounted(pz) ? S.step : popcount(S.bits), need = pzCounted(pz) ? pz.need : popcount(pz.all);
  if ((lit > lit0 || pz.kind === 'toggle') && !(pz.kind === 'pairs' && lit === lit0)) ev({ t: 'delvePzStep', n: lit, of: need, kind: pz.kind, flip: pz.kind === 'toggle', x: m.x, z: m.z });
  if (pzCounted(pz) ? S.step >= pz.need : S.bits === pz.all) {
    // the wrong-seal packs crumble with the puzzle; the hall's guards still have to fall
    S.done = true; for (const e of m.mobs) if (e.alive && e.pzPack) { e.alive = false; e.hp = 0; e.respawnT = 1e9; ev({ t: 'die', x: e.x, z: e.z, kind: e.type, elite: !!e.elite }); }
    ev({ t: 'delvePzDone', name: X.def.puzzle, guards: m.mobs.some((e) => e.alive), x: m.x, z: m.z });
  }
  if (mine && typeof partySend === 'function') partySend('dpz', { dr: X.seed, r: m.i, v: S.v, s: S.step, b: S.bits, f: S.fails, pa: st.pa, pb: st.pb });
}
function popcount(b) { let n = 0; for (; b; b &= b - 1) n++; return n; }
function delvePzRecv(P) {
  if (!delveOn() || mpNum(P.dr, -1) >>> 0 !== G.dungeon.delve.seed) return;
  const D = G.dungeon, m = D.rooms[mpNum(P.r, -1) | 0]; if (!m || !m.pz) return; const K = m.pz.sw.length;
  delvePzApply(D, m, { v: clamp(mpNum(P.v, 0) | 0, 0, 1e6), s: clamp(mpNum(P.s, 0) | 0, 0, K), b: (mpNum(P.b, 0) | 0) & m.pz.all, f: clamp(mpNum(P.f, 0) | 0, 0, 999), pa: clamp(mpNum(P.pa, 0) | 0, 0, K - 1), pb: clamp(mpNum(P.pb, 0) | 0, 0, K - 1) }, false, typeof P.sid === 'string' ? P.sid : '');
}
// an event room lets you on once its own fight is done (the echo and a woken mimic must fall; the rest never block)
function roomDoorFree(D, m) { const s = D.delve.ev[m.i] || {}; if (m.pz && !delvePz(D, m).done) return false; return !(m.event === 'echo' && !s.done) && !(m.event === 'vault' && s.t != null && !s.done); }
function stepDelveEvent(D, m, dt) {
  const X = D.delve, E = DV.events, s = X.ev[m.i] || (X.ev[m.i] = {}), pl = G.player;
  switch (m.event) {
    case 'vault': {
      if (s.t == null) { s.t = 0; s.mob = delveMob(D, m.i, 95, { x: m.x, z: m.z, pick: 0, elite: true, goblin: true, name: 'Gold Goblin' }); m.mobs.push(s.mob); }
      if (s.done) break; s.t += dt;
      if (!s.mob.alive) { s.done = 'won'; X.bonus[m.i] = 1; ev({ t: 'delveBonus', x: s.mob.x, z: s.mob.z, why: 'The goblin dropped its hoard!' }); }
      else if (s.t >= E.vault.time) { s.done = 'lost'; s.mob.alive = false; s.mob.escaped = true; ev({ t: 'delveEscape', x: s.mob.x, z: s.mob.z }); }
      break;
    }
    case 'plates': {
      if (s.done) break; const need = clamp(X.n, 1, 4), party = delveParty().filter((f) => f.alive !== false), P = m.plates.slice(0, need);
      const on = P.map((q) => party.some((f) => Math.hypot(f.x - q.x, f.z - q.z) < 1.4)); X.plates[m.i] = on;
      s.hold = on.every(Boolean) ? (s.hold || 0) + dt : 0;
      if (s.hold >= E.plates.hold) { s.done = 'won'; X.bonus[m.i] = 1; ev({ t: 'delveBonus', x: m.x, z: m.z, why: 'The plates click. A hidden cache opens!' }); }
      break;
    }
    case 'traps': {
      // half the room's tiles (a checkerboard that flips every strike) warn, then bite; only a hero inside matters
      if (!inRoom(m, pl.x, pl.z) || !pl.alive) break;
      s.t = (s.t || 0) - dt; if (s.t > 0) break; s.t = E.traps.every; s.flip = !s.flip;
      const dmg = pl.maxHp * E.traps.hit * X.diff.dmg;
      for (let x = m.x0 + 1.5; x < m.x1; x += 3) for (let z = m.z0 + 1.5; z < m.z1; z += 3) {
        if (((Math.floor((x - m.x0) / 3) + Math.floor((z - m.z0) / 3)) & 1) !== (s.flip ? 1 : 0)) continue;
        if (Math.hypot(x - pl.x, z - pl.z) > 9) continue;
        G.pendingAoE.push({ x, z, r: 1.45, t: E.traps.warn, max: E.traps.warn, dmg, team: 'mob', owner: 0, kind: 'slam', pal: areaFx(D.zone) });
      }
      break;
    }
    case 'echo': {
      if (s.mob == null) { s.mob = delveMob(D, m.i, 96, { x: m.x, z: m.z, pick: 0.5, boss: true, lvl: D.lvl + 1, name: 'Echo of a Fallen Champion' }); s.mob.maxHp = s.mob.hp = Math.round(s.mob.maxHp * 0.45); m.mobs.push(s.mob); }
      if (!s.done && !s.mob.alive) { s.done = 'won'; X.bonus[m.i] = 1; ev({ t: 'delveBonus', x: s.mob.x, z: s.mob.z, why: 'The echo fades and leaves its treasure' }); }
      break;
    }
    case 'mimic': {
      if (s.done) break;
      if (!s.woke && delveParty().some((f) => f.alive !== false && Math.hypot(f.x - m.x, f.z - m.z) < 2.6)) {
        s.woke = true;
        if (m.mimic) { s.mob = delveMob(D, m.i, 97, { x: m.x, z: m.z, pick: 0.9, boss: true, lvl: D.lvl, name: 'Mimic' }); s.mob.maxHp = s.mob.hp = Math.round(s.mob.maxHp * 0.35); s.mob.state = 'chase'; m.mobs.push(s.mob); ev({ t: 'delveMimic', x: m.x, z: m.z }); }
        else { s.done = 'won'; X.bonus[m.i] = 1; ev({ t: 'delveBonus', x: m.x, z: m.z, why: 'Just a chest after all!' }); }
      }
      if (s.mob && !s.mob.alive) { s.done = 'won'; X.bonus[m.i] = 1; ev({ t: 'delveBonus', x: m.x, z: m.z, why: 'The mimic coughs up its loot' }); }
      break;
    }
  }
}
// revive: stand by a fallen teammate for a few seconds; the downed game gets 'drev' and stands up
function stepDelveRevive(dt, party) {
  const X = G.dungeon.delve, pl = G.player;
  if (!pl.alive) { X.revive = null; return; }
  const down = party.find((f) => f !== pl && f.alive === false && Math.hypot(f.x - pl.x, f.z - pl.z) < DV.reviveR);
  if (!down) { X.revive = null; return; }
  if (!X.revive || X.revive.key !== down.key) X.revive = { key: down.key, t: 0, nick: down.nick };
  X.revive.t += dt;
  if (X.revive.t >= DV.reviveT) { delveRevive(down, G.profile.nick || 'A teammate'); ev({ t: 'delveRevived', who: down.nick, x: down.x, z: down.z }); X.revive = null; }
}
function delveReviveMe(by) {
  const pl = G.player; if (!delveOn() || pl.alive) return;
  pl.alive = true; pl.hp = pl.maxHp * 0.5; pl.invulnT = 2; G.respawnT = 0; ev({ t: 'respawn' }); toast(`${by} pulled you back up!`, 'good');
}
function delveInteract(pl) {
  const D = G.dungeon, X = D.delve, R = CFG.dungeon.interactR, near = (q) => Math.hypot(pl.x - q.x, pl.z - q.z) < R;
  if (D.bossDead && !D.chestOpen && near(D.chest)) return { kind: 'dungeonChest', label: 'Open Chest' };
  if (near(D.exit) || (D.bossDead && near(D.exit2))) return { kind: 'dungeonLeave', label: 'Leave Dungeon' };
  for (const m of D.rooms) {
    if (!m.event || !inRoom(m, pl.x, pl.z)) continue;
    if (X.bonus[m.i] === 1 && Math.hypot(pl.x - m.x, pl.z - m.z) < R + 1.5) return { kind: 'delveBonus', room: m.i, label: 'Open Cache' };
    if (m.event === 'altar' && !X.used.altar && near(m)) return { kind: 'delveAltar', label: 'Take the Curse' };
    if (m.event === 'fountain' && !X.used.fountain && near(m)) return { kind: 'delveFountain', label: 'Drink' };
  }
  for (let i = 0; i < (D.veins || []).length; i++) { const v = D.veins[i]; if (!X.mined[i] && near(v) && !delveSideGuarded(D, v)) return { kind: 'delveVein', room: i, label: v.lode ? 'Mine the Motherlode' : 'Mine Rare Vein' }; }
  for (let i = 0; i < (D.secrets || []).length; i++) { const q = D.secrets[i]; if (!q.open && Math.hypot(pl.x - q.x, pl.z - q.z) < R + 1.2) return { kind: 'delveSecret', room: i, label: 'Smash the Cracked Wall' }; }
  for (const m of D.side || []) if (m.kind !== 'vein' && !X.claimed[m.i] && near(m) && !delveSideGuarded(D, m)) return { kind: 'delveTreasure', room: m.i, label: m.kind === 'den' ? "Open the Champion's Chest" : 'Open Treasure' };
  return null;
}
function delveUse(kind, room) {
  const D = G.dungeon; if (!delveOn()) return null; const X = D.delve, pl = G.player;
  if (kind === 'delveSecret') { const q = (D.secrets || [])[room | 0]; if (!q || q.open) return null; delveSecretOpen(D, room | 0); if (typeof partySend === 'function') partySend('dsec', { dr: X.seed, i: room | 0 }); return true; }
  if (kind === 'delveTreasure') { // your own chest in a side room (every hero opens their own)
    const m = (D.side || []).find((o) => o.i === (room | 0)); if (!m || X.claimed[m.i] || delveSideGuarded(D, m)) return null;
    X.claimed[m.i] = true; const r = claimDelveLoot(false); if (m.kind === 'den') { const g = randInt(10, 20) * (1 + X.diff.i); addEssence(g); r.gems = (r.gems || 0) + g; } return r;
  }
  if (kind === 'delveVein') { // your own share of a rare vein (each hero mines their own)
    const v = (D.veins || [])[room | 0], V = DV.veins, gem = X.def.gem; if (!v || X.mined[room | 0] || !gem) return null;
    X.mined[room | 0] = true; const n = v.lode ? randInt(V.lodeN[0], V.lodeN[1]) : randInt(V.n[0], V.n[1]) + Math.floor(X.diff.i * V.nDiff);
    addMats([[gem.id, n]], true); ev({ t: 'delveVein', name: gem.name, n, lode: v.lode, x: v.x, z: v.z }); return true;
  }
  if (kind === 'delveAltar' && !X.used.altar) { X.used.altar = X.cursed = true; pl.hp = Math.min(pl.hp, pl.maxHp * DV.events.altar.hpCap); ev({ t: 'delveCurse', x: pl.x, z: pl.z }); return true; }
  if (kind === 'delveFountain' && !X.used.fountain) { X.used.fountain = true; pl.hp = X.cursed ? pl.maxHp * DV.events.altar.hpCap : pl.maxHp; pl.invulnT = 3; pl.ammo = pl.ammoMax; ev({ t: 'delveHeal', x: pl.x, z: pl.z }); return true; }
  if (kind === 'delveBonus' && X.bonus[room] === 1) { X.bonus[room] = 2; return claimDelveLoot(false); }
  return null;
}
// --- loot: every game rolls its own. full = the boss chest, else an event cache (one item, some gold).
function setPieceRarity(diff) { return DV_RAR[clamp(DV_RAR.indexOf(diff.floor) + 1, 0, DV_RAR.length - 1)]; }
const SET_SLOTS = ['weapon', 'helmet', 'chest', 'boots', 'accessory'];
const SET_NOUN = { weapon: 'Edge', helmet: 'Crown', chest: 'Mail', boots: 'Treads', accessory: 'Sigil' };
function makeSetPiece(def, diff, L, slot) {
  slot = slot || pick(SET_SLOTS);
  const it = makeItem(slot, setPieceRarity(diff), L, `${def.set.name} ${SET_NOUN[slot]}`); it.dset = def.id;
  const R = delveRec(); (R.pieces[def.id] || (R.pieces[def.id] = {}))[slot] = 1; G.dirty = true;
  return it;
}
function claimDelveLoot(full) {
  const D = G.dungeon, X = D.delve, p = G.profile, K = DV.chest, diff = X.diff, def = X.def, R = delveRec();
  const L = Math.max(D.lvl, p.level), res = { name: def.name, diff: diff.name, full, xp: 0, gold: 0, items: [], set: [], gems: 0, shards: 0, case: false, weekly: false };
  const gold = Math.round((K.gold[0] + K.gold[1] * L) * Math.pow(CFG.enemies.goldGrowth, L - 1) * tierMul(curTier()).gold * (1 + 0.15 * diff.i) * (full ? 1 : DV.bonus.gold));
  res.gold = gold; addGold(gold);
  const curse = X.cursed ? DV.events.altar : null, n = full ? diff.items + (curse ? curse.items : 0) : DV.bonus.items;
  for (let i = 0; i < n; i++) {
    let r = rollLoot(D.zone, true); if (rarIdx(r) < rarIdx(diff.floor)) r = diff.floor;
    const it = makeItem(pick(CFG.gear.slots), r, L + K.ilvlAdd + diff.i * 2); res.items.push(it); grantItem(it, 'shrine', { zone: D.zone });
  }
  // the dungeon's own set: a chance per chest (better on harder runs, after the curse), sure on the weekly first clear
  let chance = diff.unique * (curse ? curse.unique : 1) * (full ? 1 : 0.5);
  if (full && delveWeekly(def, diff.i)) { res.weekly = true; chance = 1; R.wk.done[def.id + ':' + diff.i] = 1; }
  if (Math.random() < chance) { const it = makeSetPiece(def, diff, L + K.ilvlAdd + diff.i * 2); res.set.push(it); giveItem(it); ev({ t: 'delveSet', name: it.name, set: def.set.name }); }
  if (full) {
    if (p.level < P.cap) { res.xp = Math.round(xpToNext(p.level) * K.xpFrac); addXp(res.xp, 'dungeon'); }
    res.gems = Math.round((randInt(K.gems[0], K.gems[1]) + Math.floor(L / 8)) * tierMul(curTier()).gems * (1 + 0.2 * diff.i)); addEssence(res.gems);
    res.shards = randInt(K.shards[0], K.shards[1]) + diff.i; dropShards(res.shards);
    if (Math.random() < Math.min(0.7, K.caseChance + 0.05 * diff.i)) { res.case = true; addCase('treasure', { l: L + K.ilvlAdd, src: 'dungeon' }); }
    const C = R.clears[def.id] || (R.clears[def.id] = {}); C[diff.i] = (C[diff.i] | 0) + 1;
    R.best[def.id] = Math.max(R.best[def.id] ?? -1, diff.i);
    p.records.bestDelve = Math.max(p.records.bestDelve || 0, diff.i + 1);
  }
  G.dirty = true;
  ev(Object.assign({ t: 'delveLoot' }, res, { items: res.items.length, set: res.set.length }));
  return res;
}
function claimDelveChest() { const D = G.dungeon; if (!D || !D.bossDead || D.chestOpen) return null; D.chestOpen = true; return claimDelveLoot(true); }
// set bonuses: pieces of one dungeon's set worn together (2 and 4 pieces); read by gearTotals
function delveSetBonus(gear, aff) {
  const cnt = {}; for (const s of CFG.gear.slots) { const it = gear && gear[s]; if (it && it.dset) cnt[it.dset] = (cnt[it.dset] | 0) + 1; }
  for (const id in cnt) { const S = delveDef(id).set; for (const [need, b] of [[2, S.b2], [4, S.b4]]) if (cnt[id] >= need) for (const k in b) aff[k] = (aff[k] || 0) + b[k]; }
  return cnt;
}
function delveSetText(def) { const S = def.set, f = (b) => Object.entries(b).map(([k, v]) => `+${Math.round(v * 100)}% ${(CFG.affixes[k] || { name: k }).name || k}`).join(', '); return `2 pieces: ${f(S.b2)} · 4 pieces: ${f(S.b4)}`; }
// --- end dungeon mode
