// --- Dungeon mode (party dungeons, "delves" in code): a main mode next to Showdown. Six dungeons, one per biome, each
// with its own boss and a five-piece set that drops nowhere else. Difficulties Normal → Hard → Heroic → Mythic →
// Ascendant 1, 2, … (endless); each asks a minimum TEAM POWER (the average Power of the party) and pays better loot.
// A run is a G.dungeon instance with D.delve set, so walls, doors, clamping, the hall view and the PvP block of the
// world dungeons all apply. Everything that has to match between party members comes from one seed the leader picks:
// room shapes, events, monster slots and spawn spots. Monsters are shared like the open world's (70-multiplayer.js:
// the nearest party member runs each one, the others send hits), so every game sees the same fight. Loot is rolled
// by each game for its own player. PvP never happens inside.
CFG.delve = {
  unlock: 12, maxParty: 4,
  // monster HP by party size (1-4 heroes), so a short-handed party still fits the fight
  hpParty: [1, 1.7, 2.3, 2.9],
  // Team power needed = pow × the reference hero's Power at the dungeon's level; each member needs at least `floor` of it
  // Team power needed = pow × powK × the reference hero's Power. Set very low for now (Casper, 18 Oct: joining was
  // blocked); raise powK toward 1 and floor toward 0.7 once parties are tested on real phones.
  powK: 0.05, floor: 0,
  dungeons: [
    { id: 'crypt', name: 'Rootbound Crypt', biome: 0, boss: 'The Hollow Warden', blurb: 'Roots have split the tombs of the first foresters. Something old keeps the keys.',
      set: { name: 'Rootwarden', b2: { hp: 0.08, armor: 0.05 }, b4: { lifesteal: 0.05, dmg: 0.08 } } },
    { id: 'frostvault', name: 'Frostvault', biome: 1, boss: 'Queen Rime', blurb: 'A vault cut into the glacier, where the mountain clans buried their winters.',
      set: { name: 'Rimebound', b2: { armor: 0.08, hp: 0.06 }, b4: { critDmg: 0.25, superGain: 0.08 } } },
    { id: 'cinder', name: 'Cinder Halls', biome: 2, boss: 'Forgemaw', blurb: 'The dwarf-forges under the volcano still burn, and so does whatever stokes them.',
      set: { name: 'Cinderborn', b2: { dmg: 0.08, atkSpeed: 0.05 }, b4: { crit: 0.06, critDmg: 0.3 } } },
    { id: 'archive', name: 'Sunken Archive', biome: 3, boss: 'The Last Librarian', blurb: 'A library that fell through the floor of the world. The books read you back.',
      set: { name: 'Archivist', b2: { cdr: 0.06, superGain: 0.08 }, b4: { dmg: 0.1, cdr: 0.06 } } },
    { id: 'grotto', name: 'Abyssal Grotto', biome: 4, boss: 'Mother of Tides', blurb: 'Below the reef the sea keeps a cathedral of its own, and a mother who guards it.',
      set: { name: 'Tidewrought', b2: { move: 0.06, hp: 0.06 }, b4: { lifesteal: 0.06, atkSpeed: 0.08 } } },
    { id: 'starfall', name: 'Starfall Sanctum', biome: 5, boss: 'The Fallen Seraph', blurb: 'Where a star came down, a temple grew around it. Its guardian never forgave the sky.',
      set: { name: 'Starsworn', b2: { crit: 0.05, dmg: 0.08 }, b4: { critDmg: 0.35, superGain: 0.1 } } },
  ],
  // named difficulties; past the last one Ascendant ranks go on forever (diffDef)
  diffs: [
    { name: 'Normal', lvl: 2, hp: 1, dmg: 1, pow: 0.8, rooms: [4, 5], events: 2, items: 2, floor: 'rare', unique: 0.05, col: '#7bd35a' },
    { name: 'Hard', lvl: 8, hp: 1.15, dmg: 1.1, pow: 1.0, rooms: [5, 6], events: 2, items: 3, floor: 'epic', unique: 0.08, col: '#58b4ff' },
    { name: 'Heroic', lvl: 16, hp: 1.3, dmg: 1.2, pow: 1.25, rooms: [5, 6], events: 3, items: 3, floor: 'epic', unique: 0.12, col: '#c77dff' },
    { name: 'Mythic', lvl: 28, hp: 1.5, dmg: 1.3, pow: 1.6, rooms: [6, 7], events: 3, items: 4, floor: 'legendary', unique: 0.16, col: '#ff9a3c' },
  ],
  // room shapes: half sizes (x, z) of a hall; the boss hall is always the big square
  shapes: [{ n: 'hall', hx: 9, hz: 9, w: 4 }, { n: 'gallery', hx: 13, hz: 6, w: 2 }, { n: 'longhall', hx: 6, hz: 12, w: 2 }, { n: 'chamber', hx: 11, hz: 11, w: 2 }, { n: 'cell', hx: 7, hz: 7, w: 2 }],
  bossH: 16, corridor: 8, corW: 5,
  // what a combat hall holds; events sit only in their own rooms
  fights: [{ k: 'guard', w: 4, n: [6, 8] }, { k: 'swarm', w: 2, n: [4, 5], waves: 3 }, { k: 'elites', w: 2, n: [2, 3] }],
  events: {
    vault: { name: 'Treasure Vault', d: 'A gold goblin! Catch it before it vanishes', time: 20 },
    altar: { name: 'Cursed Altar', d: 'Take the curse: less health for the rest of the run, better loot at the end', hpCap: 0.75, unique: 1.6, items: 1 },
    plates: { name: 'Pressure Plates', d: 'Stand on every plate at once to open the hidden cache', hold: 1.5 },
    traps: { name: 'Spike Hall', d: 'The floor bites: watch the red tiles', every: 2.4, warn: 0.9, hit: 0.22 },
    echo: { name: 'Shrine of Echoes', d: 'An echo of a fallen champion wakes', mods: 2 },
    mimic: { name: 'Lonely Chest', d: 'A chest in an empty room. Surely nothing is wrong', odds: 0.5 },
    fountain: { name: 'Moonwell', d: 'Drink once: full health and a moment of grace' },
  },
  mods: { dark: 0.25, pillars: 0.35 },
  chest: { xpFrac: 0.5, gold: [60, 10], gems: [8, 14], shards: [3, 6], ilvlAdd: 4, caseChance: 0.15 },
  bonus: { gold: 0.4, items: 1 },
  reviveT: 3, reviveR: 2.6, wipeT: 2,
};
const DV = CFG.delve, DV_RAR = ['rare', 'epic', 'legendary', 'mythic', 'ancient', 'divine'];
function diffDef(i) {
  i = Math.max(0, i | 0); if (i < DV.diffs.length) return Object.assign({ i }, DV.diffs[i]);
  const r = i - DV.diffs.length + 1; // Ascendant rank
  return { i, name: `Ascendant ${r}`, lvl: 40 + 10 * r, hp: 1.6 * Math.pow(1.08, r - 1), dmg: 1.35 * Math.pow(1.05, r - 1), pow: 2 * Math.pow(1.12, r - 1), rooms: [6, 7], events: 4,
    items: Math.min(6, 4 + Math.floor(r / 3)), floor: r >= 6 ? 'ancient' : 'mythic', unique: Math.min(0.35, 0.18 + 0.02 * r), col: '#ffe27a', asc: r };
}
const delveDef = (id) => DV.dungeons.find((d) => d.id === id) || DV.dungeons[0];
const biomeZones = (bi) => CFG.world.zones.map((z, i) => ({ z, i })).filter((o) => !o.z.safe && o.z.biome === bi);
// a dungeon opens once you reach its biome; its level is the biome's top level plus the difficulty's
function delveBase(def) { const zs = biomeZones(def.biome); return zs.length ? Math.max(...zs.map((o) => (o.z.lvl ? o.z.lvl[1] : o.z.minLevel || 1))) : 1; }
function delveMinLevel(def) { const zs = biomeZones(def.biome); return Math.max(DV.unlock, zs.length ? Math.min(...zs.map((o) => o.z.minLevel || 1)) : 1); }
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
    const boss = i === n, sh = boss ? { n: 'throne', hx: C.bossH, hz: C.bossH } : i === 0 ? C.shapes[0] : wpick(C.shapes);
    const mk = (x, z) => Object.assign(rect(x, z, sh.hx, sh.hz), { x, z, hx: sh.hx, hz: sh.hz, h: Math.min(sh.hx, sh.hz), i, boss, shape: sh.n });
    if (!i) { rooms.push(mk(DC.x, DC.z)); continue; }
    const a = rooms[i - 1], dirs = [[0, 1], [1, 0], [-1, 0]].sort(() => rng() - 0.5);
    let nr = null, dir = [0, 1];
    for (const d of dirs) {
      const x = a.x + d[0] * (a.hx + C.corridor + sh.hx), z = a.z + d[1] * (a.hz + C.corridor + sh.hz), r = rect(x, z, sh.hx, sh.hz);
      if (rooms.some((o) => r.x0 < o.x1 + 3 && r.x1 > o.x0 - 3 && r.z0 < o.z1 + 3 && r.z1 > o.z0 - 3)) continue;
      nr = mk(x, z); dir = d; break;
    }
    if (!nr) nr = mk(a.x, a.z + a.hz + C.corridor + sh.hz);
    rooms.push(nr);
    const w = C.corW / 2;
    cors.push(dir[1] ? { x0: a.x - w, x1: a.x + w, z0: a.z1, z1: nr.z0, ax: 'z' } : { x0: dir[0] > 0 ? a.x1 : nr.x1, x1: dir[0] > 0 ? nr.x0 : a.x0, z0: a.z - w, z1: a.z + w, ax: 'x' });
    doors.push(dir[1] ? { x: a.x, z: a.z1 + 0.6, ax: 'x', w, open: false, room: i - 1 } : { x: dir[0] > 0 ? a.x1 + 0.6 : a.x0 - 0.6, z: a.z, ax: 'z', w, open: false, room: i - 1 });
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
  for (const r of rooms) { edge(r.x0, r.z0, r.x1, r.z0); edge(r.x0, r.z1, r.x1, r.z1); edge(r.x0, r.z0, r.x0, r.z1); edge(r.x1, r.z0, r.x1, r.z1); }
  for (const c of cors) { if (c.ax === 'z') { seg(c.x0, c.z0, c.x0, c.z1); seg(c.x1, c.z0, c.x1, c.z1); } else { seg(c.x0, c.z0, c.x1, c.z0); seg(c.x0, c.z1, c.x1, c.z1); } }
  // events in the middle rooms (never the start hall or the boss hall), no type twice in a run
  const mids = rooms.slice(1, n).map((m) => m.i).sort(() => rng() - 0.5), evKeys = Object.keys(C.events).sort(() => rng() - 0.5);
  const nev = Math.min(D.events, mids.length - 1 > 0 ? mids.length - 1 : mids.length);
  for (let k = 0; k < nev; k++) rooms[mids[k]].event = evKeys[k];
  for (const m of rooms) {
    if (m.boss) { m.fight = 'boss'; continue; }
    if (!m.event) { const f = wpick(C.fights); m.fight = f.k; m.count = ri(f.n[0], f.n[1]); m.waves = f.waves || 1; }
    else m.fight = m.event === 'traps' ? 'guard' : 'none', m.count = m.event === 'traps' ? 3 : 0, m.waves = 1;
    m.dark = m.i > 0 && rng() < C.mods.dark;
    // pillars: cover in the big halls, kept clear of the doors' lanes
    if (!m.event && m.i > 0 && m.hx >= 9 && m.hz >= 9 && rng() < C.mods.pillars) { m.pillars = true; for (const sx of [-1, 1]) for (const sz of [-1, 1]) props.push({ x: m.x + sx * m.hx * 0.45, z: m.z + sz * m.hz * 0.45, r: 0.9, room: m.i }); }
    // fixed spawn spots: the run's slots (room × 100 + k) match in every party member's game
    m.spots = []; const tot = (m.count || 0) * (m.waves || 1) + 8;
    for (let k = 0; k < tot; k++) m.spots.push({ x: m.x + (rng() * 2 - 1) * (m.hx - 3), z: m.i ? m.z + (rng() * 2 - 1) * (m.hz - 3) : m.z + 1 + rng() * (m.hz - 4), e: rng() });
    if (m.event === 'plates') m.plates = [[-1, -1], [1, 1], [-1, 1], [1, -1]].map(([a, b]) => ({ x: m.x + a * m.hx * 0.5, z: m.z + b * m.hz * 0.5 }));
    if (m.event === 'mimic') m.mimic = rng() < C.events.mimic.odds;
  }
  const r0 = rooms[0], b = rooms[n];
  return { rooms, cors, walls, doors, props, start: { x: r0.x, z: r0.z0 + 4 }, exit: { x: r0.x - 4, z: r0.z0 + 2.2 }, chest: { x: b.x, z: b.z }, exit2: { x: b.x, z: b.z + 5 } };
}
// --- run
const delveOn = () => !!(G.dungeon && G.dungeon.delve);
function delveRoster(def) { const out = []; for (const { z } of biomeZones(def.biome)) for (const t of [z.enemy, z.alt]) if (t && CFG.enemies[t] && !out.includes(t)) out.push(t); return out.length ? out : ['thistlehare']; }
// one monster in a fixed slot; dungeonMob does the level, HP and damage scaling
function delveMob(D, room, k, o) {
  const X = D.delve, slot = room * 100 + k; if (X.slots.has(slot)) return X.slots.get(slot);
  const type = o.type || X.roster[Math.floor((o.pick != null ? o.pick : 0) * X.roster.length) % X.roster.length];
  const e = dungeonMob(D, type, o.lvl || D.lvl, room, o);
  e.delve = true; e.slot = slot; e.own = null;
  const m = X.diff, hp = DV.hpParty[clamp(X.n, 1, 4) - 1] * m.hp;
  e.maxHp = Math.round(e.maxHp * hp); e.hp = e.maxHp; e.atk *= m.dmg;
  if (o.goblin) { e.goblin = true; e.flee = true; e.atkCd = 1e9; e.maxHp = e.hp = Math.round(e.maxHp * 0.6); }
  if (o.name) e.champName = o.name;
  X.slots.set(slot, e); return e;
}
function spawnRoomWave(D, m, w) {
  const X = D.delve, el = m.fight === 'elites';
  for (let k = 0; k < m.count; k++) { const s = m.spots[w * m.count + k]; m.mobs.push(delveMob(D, m.i, w * m.count + k, { x: s.x, z: s.z, pick: s.e, elite: el || s.e < 0.12 + X.diff.i * 0.03, chase: w > 0 })); }
  m.wave = w;
}
// diff: difficulty index; n: party size at the start (sets monster HP); seed: the leader's run seed
function startDelve(id, di, seed, n) {
  const p = G.profile, pl = G.player, def = delveDef(id);
  if (inInstance() || G.mode !== 'hub' || !pl.alive || !delveOpen(def) || di > delveTop(def)) return false;
  if (G.boss && Math.hypot(G.boss.x - pl.x, G.boss.z - pl.z) < CFG.dungeon.bossBlock) return false;
  for (const e of G.enemies) if (e.own) e.own = null; // the open world's shared monsters go back to this game
  seed = (seed >>> 0) || ((Math.random() * 4294967295) >>> 0);
  const L = delveLayout(seed, def, di), diff = diffDef(di), zi = delveZone(def), lvl = delveLevel(def, di);
  const poi = { id: 'delve:' + def.id, kind: 'delve', zone: zi, lvl, name: def.name };
  const D = G.dungeon = Object.assign(L, { id: poi.id, poi, zone: zi, variant: { name: def.name, counts: [], par: 600, hp: 14, mods: diff.i >= 3 ? 4 : 3, trial: false }, key: null, lvl, t0: G.time, clearT: 0, newKey: null,
    room: 0, mobs: [], boss: null, bossDead: false, chestOpen: false, addsDone: false, enterPos: { x: pl.x, z: pl.z } });
  D.delve = { def, diff, di, seed, n: clamp(n | 0 || 1, 1, DV.maxParty), roster: delveRoster(def), slots: new Map(), cursed: false, bonus: {}, used: {}, downT: 0, wipeT: 0, revive: null, plates: {}, ev: {} };
  dungeonGrid(D); clearProjectiles();
  pl.x = D.start.x; pl.z = D.start.z; pl.facing = 0; pl.hp = pl.maxHp; pl.invulnT = 1.5; pl.ammo = pl.ammoMax;
  G.zoneIdx = zi;
  D.rooms.forEach((m) => { m.mobs = []; m.cleared = false; m.wave = -1; m.seen = false; if (!m.boss && m.count) spawnRoomWave(D, m, 0); });
  const b = D.rooms.at(-1);
  D.boss = delveMob(D, b.i, 0, { type: D.delve.roster[D.delve.roster.length - 1], boss: true, lvl: lvl + CFG.dungeon.boss.lvlAdd, x: b.x, z: b.z + 4, name: def.boss });
  D.boss.maxHp = D.boss.hp = Math.round(D.boss.maxHp * 1.4); b.mobs = [D.boss];
  ev({ t: 'dungeonStart', name: def.name, lvl, key: 0, x: pl.x, z: pl.z, delve: true, diff: diff.name, n: D.delve.n }); return true;
}
// who of the party is in this run with us (peers in the same run seed); always includes the local player
function delveParty() {
  const D = G.dungeon, X = D && D.delve; if (!X) return [];
  const peers = typeof MP !== 'undefined' ? MP.list.filter((e) => e.md === 'delve' && e.dr === X.seed) : [];
  return [G.player, ...peers];
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
  if (Math.hypot(pl.x - DC.x, pl.z - DC.z) > 260) { endDungeon('away'); return; }
  D.rooms.forEach((m, i) => { if (pl.alive && inRoom(m, pl.x, pl.z)) D.room = i; });
  // a fall: wait for a teammate; when everyone is down the run fails
  const party = delveParty(), up = party.filter((f) => f.alive !== false);
  if (!pl.alive) {
    G.respawnT = 1e9;
    if (!up.length) { if ((X.wipeT += dt) >= DV.wipeT) { endDungeon('down'); return; } } else X.wipeT = 0;
  } else X.wipeT = 0;
  if (X.cursed && pl.alive && pl.hp > pl.maxHp * E.altar.hpCap) pl.hp = pl.maxHp * E.altar.hpCap;
  stepDelveRevive(dt, party);
  for (const m of D.rooms) {
    if (m.boss) continue;
    const seen = m.seen || anyoneIn(m); if (seen && !m.seen) { m.seen = true; if (m.event) ev({ t: 'delveEvent', k: m.event, x: m.x, z: m.z }); }
    // swarm waves: the next wave comes when the last one is down
    if (m.waves > 1 && m.wave < m.waves - 1 && m.seen && m.mobs.length && !m.mobs.some((e) => e.alive)) { spawnRoomWave(D, m, m.wave + 1); ev({ t: 'delveWave', n: m.wave + 1, of: m.waves, x: m.x, z: m.z }); }
    if (m.event && m.seen) stepDelveEvent(D, m, dt);
  }
  // doors open in order: a room's door needs every door before it open (and its own room done)
  for (const d of D.doors) {
    const m = D.rooms[d.room]; if (d.open) continue;
    if (m.mobs.some((e) => e.alive) || (m.waves > 1 && m.wave < m.waves - 1) || !roomDoorFree(D, m)) break;
    d.open = m.cleared = true; dungeonGrid(D);
    ev({ t: 'dungeonRoom', i: d.room + 1, n: D.rooms.length - 1, boss: d.room + 1 === D.rooms.length - 1 });
  }
  const b = D.boss;
  if (b.alive && !D.addsDone && b.hp < b.maxHp * 0.5) {
    D.addsDone = true; const bm = D.rooms.at(-1);
    for (let k = 0; k < 2 + Math.min(2, X.n - 1); k++) { const a = (k / 4) * Math.PI * 2; bm.mobs.push(delveMob(D, bm.i, 10 + k, { x: b.x + Math.sin(a) * 3, z: b.z + Math.cos(a) * 3, pick: k / 4, chase: true, elite: X.diff.i >= 2 })); }
    ev({ t: 'dungeonAdds', x: b.x, z: b.z });
  }
  if (!b.alive && !D.bossDead) { D.bossDead = D.rooms.at(-1).cleared = true; D.clearT = G.time - D.t0; ev({ t: 'dungeonBoss', x: D.chest.x, z: D.chest.z, name: X.def.name, secs: Math.round(D.clearT), par: 0, key: 0, up: 0, delve: true }); }
}
// an event room lets you on once its own fight is done (the echo and a woken mimic must fall; the rest never block)
function roomDoorFree(D, m) { const s = D.delve.ev[m.i] || {}; return !(m.event === 'echo' && !s.done) && !(m.event === 'vault' && s.t != null && !s.done); }
function stepDelveEvent(D, m, dt) {
  const X = D.delve, E = DV.events, s = X.ev[m.i] || (X.ev[m.i] = {}), pl = G.player;
  switch (m.event) {
    case 'vault': {
      if (s.t == null) { s.t = 0; s.mob = delveMob(D, m.i, 0, { x: m.x, z: m.z, pick: 0, elite: true, goblin: true, name: 'Gold Goblin' }); m.mobs.push(s.mob); }
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
      if (s.mob == null) { s.mob = delveMob(D, m.i, 0, { x: m.x, z: m.z, pick: 0.5, boss: true, lvl: D.lvl + 1, name: 'Echo of a Fallen Champion' }); s.mob.maxHp = s.mob.hp = Math.round(s.mob.maxHp * 0.45); m.mobs.push(s.mob); }
      if (!s.done && !s.mob.alive) { s.done = 'won'; X.bonus[m.i] = 1; ev({ t: 'delveBonus', x: s.mob.x, z: s.mob.z, why: 'The echo fades and leaves its treasure' }); }
      break;
    }
    case 'mimic': {
      if (s.done) break;
      if (!s.woke && delveParty().some((f) => f.alive !== false && Math.hypot(f.x - m.x, f.z - m.z) < 2.6)) {
        s.woke = true;
        if (m.mimic) { s.mob = delveMob(D, m.i, 0, { x: m.x, z: m.z, pick: 0.9, boss: true, lvl: D.lvl, name: 'Mimic' }); s.mob.maxHp = s.mob.hp = Math.round(s.mob.maxHp * 0.35); s.mob.state = 'chase'; m.mobs.push(s.mob); ev({ t: 'delveMimic', x: m.x, z: m.z }); }
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
  if (X.revive.t >= DV.reviveT) { if (typeof partySend === 'function') partySend('drev', { to: down.key, by: G.profile.nick || 'A teammate' }); ev({ t: 'delveRevived', who: down.nick, x: down.x, z: down.z }); X.revive = null; }
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
  return null;
}
function delveUse(kind, room) {
  const D = G.dungeon; if (!delveOn()) return null; const X = D.delve, pl = G.player;
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
