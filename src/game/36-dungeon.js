// --- Dungeons: one sealed instance per dungeon POI (three per area: Caves, Warrens, Sanctum). Guarded halls,
// each door opens when its hall is cleared, then a mini-boss room with a reward chest. Like the Rift it stays in
// G.mode 'hub' (G.dungeon set). Dungeon Keys (tier + affixes) push the same dungeon higher forever.
const DC = { x: 0, z: -1800 }; // dungeon instance centre (arena −1000, rift −1400)
CFG.dungeon = {
  room: 18, corridor: 8, corW: 5, bossR: 16, wallR: 0.5,
  lvlAdd: 4, hpMul: 1.5, dmgMul: 1.25, boss: { dmg: 1.5, adds: 2, lvlAdd: 2 },
  // poi n picks the variant: hall sizes, elite share, boss affixes and HP, par time in seconds
  variants: [
    { name: 'Caves', counts: [6, 7, 8], elite: 0.25, mods: 2, hp: 12, par: 150, blurb: 'Three guarded halls and a mini-boss' },
    { name: 'Warrens', counts: [9, 9, 10, 10], elite: 0.1, mods: 2, hp: 10, par: 210, blurb: 'Four crowded halls of swarming monsters and a mini-boss' },
    { name: 'Sanctum', counts: [4, 5], elite: 0.6, mods: 3, hp: 16, par: 120, blurb: 'Two halls of elites and a three-affix guardian' },
    { name: 'Trial', counts: [], elite: 0, mods: 4, hp: 20, lvl: 6, par: 90, trial: true, blurb: 'One sealed arena and a four-affix champion' },
  ],
  // Legendary Trials: light an area's runestones to open a repeatable trial at its landmark. Every clear pays a sigil
  // (sigilCost buys that area's Mythic relic) and rolls 1 in `radiant` for a Radiant item; a kill chain of one
  // monster type multiplies that chance by 1 + chain/chainStep, up to chainMax.
  trial: { runes: 4, sigilCost: 50, radiant: 500, chainStep: 25, chainMax: 4 },
  interactR: 3.6, bossBlock: 30,
  chest: { items: 2, ilvlAdd: 4, epicFrom: 15, gems: [6, 10], shards: [3, 5], caseChance: 0.1, xpFrac: 0.35, gold: [40, 8] },
  // Dungeon Keys: +1 monster level per tier. Clear under par: the key comes back 1-3 tiers higher; fall or leave: one tier lower.
  keys: { max: 12, affixes: {
    bulwark: { name: 'Bulwark', d: 'Monsters +40% HP', bad: true }, brutal: { name: 'Brutal', d: 'Monsters +30% damage', bad: true }, swift: { name: 'Swift', d: 'Monsters +20% speed', bad: true },
    gilded: { name: 'Gilded', d: '+50% gold' }, bountiful: { name: 'Bountiful', d: '+1 gear item' }, lucky: { name: 'Lucky', d: '+25% treasure chest chance' } } },
};
const dungeonVariant = (id) => CFG.dungeon.variants[String(id).endsWith(':trial') ? 3 : +String(id).slice(-1)] || CFG.dungeon.variants[0];
const runesLit = (zi) => CFG.world.runes.filter((q) => q.zone === zi && (G.profile.runes || {})[q.id]).length;
const trialOpen = (zi) => runesLit(zi) >= CFG.dungeon.trial.runes;
function trialState(zi) { const p = G.profile, T = p.trials || (p.trials = {}); return T[zi] || (T[zi] = { n: 0, sig: 0, rad: 0 }); }
// the trial is a dungeon instance entered at the area's hero landmark (one stable object per area)
const TRIAL_POIS = {};
function trialPoi(zi) {
  if (TRIAL_POIS[zi]) return TRIAL_POIS[zi];
  const lm = CFG.world.pois.find((q) => q.zone === zi && q.major); if (!lm || CFG.world.zones[zi].safe) return null;
  return (TRIAL_POIS[zi] = { id: `a${String(zi).padStart(2, '0')}:trial`, kind: 'dungeon', trial: true, zone: zi, lvl: lm.lvl, x: lm.x, z: lm.z, r: lm.r, name: lm.name + ' Trial', landmark: lm.name });
}
function chainMult() { const T = CFG.dungeon.trial; return Math.min(T.chainMax, 1 + ((G.chain && G.chain.n) | 0) / T.chainStep); }
const radiantOdds = () => Math.max(1, Math.round(CFG.dungeon.trial.radiant / chainMult())); // "1 in N"
function forgeTrialRelic(zi) {
  const S = trialState(zi), cost = CFG.dungeon.trial.sigilCost, poi = trialPoi(zi); if (!poi || S.sig < cost) return null;
  S.sig -= cost; G.dirty = true;
  const it = makeItem(pick(CFG.gear.slots), 'mythic', Math.max(poi.lvl, G.profile.level) + CFG.dungeon.chest.ilvlAdd + 6); it.name = `${poi.landmark} ${it.name.split(' ').pop()}`;
  grantItem(it, 'shrine', { zone: zi }); return it;
}
function rollKeyAffixes(t) { const all = Object.keys(CFG.dungeon.keys.affixes), out = []; for (let n = Math.min(3, 1 + Math.floor(t / 8)); out.length < n;) { const a = pick(all); if (!out.includes(a)) out.push(a); } return out; }
function makeKey(t) { t = Math.max(1, t | 0); return { t, a: rollKeyAffixes(t) }; }
// keys stay sorted best-first; past the cap the lowest tier falls off
function addKey(k) { const p = G.profile, ks = p.keys || (p.keys = []); ks.push(k); ks.sort((a, b) => b.t - a.t); ks.length = Math.min(ks.length, CFG.dungeon.keys.max); p.records.bestKey = Math.max(p.records.bestKey || 0, k.t); G.dirty = true; return k; }
const keyName = (k) => `Tier ${k.t} Key` + (k.a.length ? ' · ' + k.a.map((a) => CFG.dungeon.keys.affixes[a].name).join(', ') : '');
const keyHas = (D, a) => !!(D.key && D.key.a.includes(a));
function dungeonPois() { return (CFG.world.pois || []).filter((p) => p.kind === 'dungeon'); }
function dungeonLevel(poi, key) { return poi.lvl + CFG.dungeon.lvlAdd + tierAdd() + (key ? key.t : 0) + (dungeonVariant(poi.id).lvl || 0); }
function dungeonReq(poi) { return (CFG.world.zones[poi.zone] || {}).minLevel || 1; }
function strSeed(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
// Deterministic per POI id: rooms walk north/east/west (never south, so the path cannot fold back onto itself).
function dungeonLayout(id) {
  const C = CFG.dungeon, rng = mulberry32(strSeed(id)), rooms = [], cors = [], walls = [], doors = [], last = dungeonVariant(id).counts.length;
  const rect = (x, z, hx, hz) => ({ x0: x - hx, x1: x + hx, z0: z - hz, z1: z + hz });
  for (let i = 0; i <= last; i++) {
    const h = i === last ? C.bossR : C.room / 2;
    if (!i) { rooms.push(Object.assign(rect(DC.x, DC.z, h, h), { x: DC.x, z: DC.z, h, i, boss: !last })); continue; }
    const a = rooms[i - 1], dirs = [[0, 1], [1, 0], [-1, 0]].sort(() => rng() - 0.5);
    let nr = null, dir = [0, 1];
    for (const d of dirs) {
      const s = a.h + C.corridor + h, x = a.x + d[0] * s, z = a.z + d[1] * s, r = rect(x, z, h, h);
      if (rooms.some((o) => r.x0 < o.x1 + 3 && r.x1 > o.x0 - 3 && r.z0 < o.z1 + 3 && r.z1 > o.z0 - 3)) continue;
      nr = Object.assign(r, { x, z, h, i, boss: i === last }); dir = d; break;
    }
    // north never overlaps (no room lies further north yet), so it is the safe fallback
    if (!nr) { const z = a.z + a.h + C.corridor + h; nr = Object.assign(rect(a.x, z, h, h), { x: a.x, z, h, i, boss: i === last }); }
    rooms.push(nr);
    // corridor from the edge of a to the edge of nr; w is its half width
    const w = C.corW / 2;
    cors.push(dir[1] ? { x0: a.x - w, x1: a.x + w, z0: a.z1, z1: nr.z0, ax: 'z' }
      : { x0: dir[0] > 0 ? a.x1 : nr.x1, x1: dir[0] > 0 ? nr.x0 : a.x0, z0: a.z - w, z1: a.z + w, ax: 'x' });
    // the door sits in the corridor mouth of the hall it guards
    doors.push(dir[1] ? { x: a.x, z: a.z1 + 0.6, ax: 'x', w, open: false, room: i - 1 } : { x: dir[0] > 0 ? a.x1 + 0.6 : a.x0 - 0.6, z: a.z, ax: 'z', w, open: false, room: i - 1 });
  }
  // walls: room edges with gaps where corridors attach, plus both long sides of every corridor
  const gap = (x, z) => cors.some((c) => c.ax === 'z' ? Math.abs(x - (c.x0 + c.x1) / 2) < C.corW / 2 - 0.01 && (Math.abs(z - c.z0) < 0.01 || Math.abs(z - c.z1) < 0.01)
    : Math.abs(z - (c.z0 + c.z1) / 2) < C.corW / 2 - 0.01 && (Math.abs(x - c.x0) < 0.01 || Math.abs(x - c.x1) < 0.01));
  const seg = (x0, z0, x1, z1) => { if (Math.hypot(x1 - x0, z1 - z0) > 0.05) walls.push({ x0, z0, x1, z1 }); };
  const edge = (x0, z0, x1, z1) => {
    // walk the edge in 0.5 m steps and split it where a corridor opens
    const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.5); let sx = null, sz = null;
    for (let k = 0; k <= n; k++) {
      const x = lerp(x0, x1, k / n), z = lerp(z0, z1, k / n), open = gap(x, z);
      if (!open && sx == null) { sx = x; sz = z; }
      if ((open || k === n) && sx != null) { seg(sx, sz, open ? lerp(x0, x1, (k - 1) / n) : x, open ? lerp(z0, z1, (k - 1) / n) : z); sx = sz = null; }
    }
  };
  for (const r of rooms) { edge(r.x0, r.z0, r.x1, r.z0); edge(r.x0, r.z1, r.x1, r.z1); edge(r.x0, r.z0, r.x0, r.z1); edge(r.x1, r.z0, r.x1, r.z1); }
  for (const c of cors) { if (c.ax === 'z') { seg(c.x0, c.z0, c.x0, c.z1); seg(c.x1, c.z0, c.x1, c.z1); } else { seg(c.x0, c.z0, c.x1, c.z0); seg(c.x0, c.z1, c.x1, c.z1); } }
  const r0 = rooms[0], b = rooms[last];
  return { rooms, cors, walls, doors, start: { x: r0.x, z: r0.z0 + 4 }, exit: { x: r0.x - 4, z: r0.z0 + 2.2 }, chest: { x: b.x, z: b.z }, exit2: { x: b.x, z: b.z + 5 } };
}
// walls and locked doors as obstacle circles (rebuilt when a door opens: the Grid has no remove)
function dungeonGrid(D) {
  const C = CFG.dungeon, g = new Grid(6), r = C.wallR;
  for (const w of D.walls) { const n = Math.max(1, Math.ceil(Math.hypot(w.x1 - w.x0, w.z1 - w.z0) / (r * 1.6))); for (let k = 0; k <= n; k++) g.add({ x: lerp(w.x0, w.x1, k / n), z: lerp(w.z0, w.z1, k / n), r }); }
  for (const q of D.props || []) g.add({ x: q.x, z: q.z, r: q.r }); // pillars in party-dungeon halls
  for (const d of [...D.doors, ...(D.secrets || [])]) if (!d.open) for (let k = -3; k <= 3; k++) { /* gates and party-dungeon cracked walls */ const o = (k / 3) * d.w; g.add(d.ax === 'x' ? { x: d.x + o, z: d.z, r: 0.6 } : { x: d.x, z: d.z + o, r: 0.6 }); }
  G.dungeonObstacles = g; if (G.dungeon === D) G.obstacles = g;
  return g;
}
// keep bodies inside the halls and corridors even if a dash slips between wall circles
function dungeonClamp(f, r) {
  const D = G.dungeon; if (!D) return;
  let best = null, bd = Infinity;
  const test = (x0, x1, z0, z1) => {
    if (x0 > x1) x0 = x1 = (x0 + x1) / 2; if (z0 > z1) z0 = z1 = (z0 + z1) / 2;
    const x = clamp(f.x, x0, x1), z = clamp(f.z, z0, z1), d = (x - f.x) ** 2 + (z - f.z) ** 2;
    if (d < bd) { bd = d; best = { x, z }; }
  };
  const p = CFG.dungeon.wallR;
  for (const m of D.side ? [...D.rooms, ...D.side] : D.rooms) { test(m.x0 + r + p, m.x1 - r - p, m.z0 + r + p, m.z1 - r - p); if (bd === 0) return; }
  // corridors shrink only across their width and reach into both rooms, so junctions have no dead strip
  for (const c of D.cors) { if (c.ax === 'z') test(c.x0 + r + p, c.x1 - r - p, c.z0 - 2, c.z1 + 2); else test(c.x0 - 2, c.x1 + 2, c.z0 + r + p, c.z1 - r - p); if (bd === 0) return; }
  if (best) { f.x = best.x; f.z = best.z; }
}
function inRoom(m, x, z) { return x >= m.x0 && x <= m.x1 && z >= m.z0 && z <= m.z1; }
function dungeonMob(D, type, lvl, room, o) {
  const C = CFG.dungeon, B = C.boss, V = D.variant, zi = D.zone;
  let e;
  if (o.boss) { e = makeChampion(type, zi, lvl, V.mods, false); delete e.rift; delete e.riftLvl; e.state = 'idle'; e.r *= 1.25; }
  else e = makeEnemy(type, zi, { elite: !!o.elite });
  e.dungeon = true; e.temp = true; e.room = room;
  setEnemyLevel(e, lvl);
  if (o.boss) { e.maxHp = Math.round(e.maxHp / (e.elite ? CFG.enemies.elite.hp : 1) * C.hpMul * V.hp); e.atk *= B.dmg; e.dungeonBoss = true; }
  else { e.maxHp = Math.round(e.maxHp * C.hpMul); e.atk *= C.dmgMul; }
  if (keyHas(D, 'bulwark')) e.maxHp = Math.round(e.maxHp * 1.4);
  if (keyHas(D, 'brutal')) e.atk *= 1.3;
  if (keyHas(D, 'swift')) e.spd = 1.2;
  e.hp = e.maxHp; // mobDmg scales from e.atk, so the ×dmgMul above reaches every hit
  e.x = e.hx = e.wx = o.x; e.z = e.hz = e.wz = o.z; if (o.chase) e.state = 'chase';
  G.enemies.push(e); D.mobs.push(e);
  return e;
}
// keyIdx: index into profile.keys (consumed on entry) or null for a plain run
function startDungeon(poi, keyIdx) {
  const p = G.profile, pl = G.player, key = keyIdx != null ? (p.keys || [])[keyIdx] : null;
  if (!poi || poi.kind !== 'dungeon' || inInstance() || G.mode !== 'hub' || !pl.alive || activeShrine() || p.level < dungeonReq(poi) || (keyIdx != null && !key) || (poi.trial && (key || !trialOpen(poi.zone)))) return false;
  if (G.boss && Math.hypot(G.boss.x - pl.x, G.boss.z - pl.z) < CFG.dungeon.bossBlock) return false;
  if (key) { p.keys.splice(keyIdx, 1); G.dirty = true; }
  const C = CFG.dungeon, V = dungeonVariant(poi.id), L = dungeonLayout(poi.id), lvl = dungeonLevel(poi, key), Z = CFG.world.zones[poi.zone];
  const D = G.dungeon = Object.assign(L, { id: poi.id, poi, zone: poi.zone, variant: V, key, lvl, t0: G.time, clearT: 0, newKey: null, room: 0, mobs: [], boss: null, bossDead: false, chestOpen: false, addsDone: false, enterPos: { x: pl.x, z: pl.z } });
  dungeonGrid(D); clearProjectiles();
  pl.x = D.start.x; pl.z = D.start.z; pl.facing = 0; pl.hp = pl.maxHp; pl.invulnT = 1.5; pl.ammo = pl.ammoMax;
  G.zoneIdx = poi.zone;
  const roster = () => (Z.alt && Math.random() < 0.4 ? Z.alt : Z.enemy);
  D.rooms.forEach((m, i) => {
    m.mobs = []; m.cleared = false;
    if (m.boss) return;
    for (let k = 0; k < V.counts[i]; k++) {
      // the first hall keeps its southern half free: you arrive there
      const x = rand(m.x0 + 3, m.x1 - 3), z = rand(i ? m.z0 + 3 : m.z + 1, m.z1 - 3), elite = Math.random() < V.elite;
      m.mobs.push(dungeonMob(D, roster(), lvl, i, { elite, x, z }));
    }
  });
  const n = D.rooms.length - 1, b = D.rooms[n]; D.boss = dungeonMob(D, V === C.variants[1] && Z.alt ? Z.alt : Z.enemy, lvl + C.boss.lvlAdd, n, { boss: true, x: b.x, z: b.z + 4 }); b.mobs = [D.boss];
  ev({ t: 'dungeonStart', name: poi.name, lvl, key: key ? key.t : 0, x: pl.x, z: pl.z }); return true;
}
function stepDungeon(dt) {
  const D = G.dungeon, pl = G.player, C = CFG.dungeon;
  if (D.delve) { stepDelve(dt); return; } // party dungeons (36b-delve.js)
  if (!pl.alive) { endDungeon('down'); return; }
  // carried out of the instance by anything else (waypoint travel): close it where you stand
  if (Math.hypot(pl.x - DC.x, pl.z - DC.z) > 260) { endDungeon('away'); return; }
  D.rooms.forEach((m, i) => { if (inRoom(m, pl.x, pl.z)) D.room = i; });
  for (const d of D.doors) {
    const m = D.rooms[d.room];
    if (d.open || m.mobs.some((e) => e.alive)) continue;
    d.open = m.cleared = true; dungeonGrid(D);
    ev({ t: 'dungeonRoom', i: d.room + 1, n: D.rooms.length - 1, boss: d.room + 1 === D.rooms.length - 1 });
  }
  const b = D.boss;
  if (b.alive && !D.addsDone && b.hp < b.maxHp * 0.5) {
    D.addsDone = true; const Z = CFG.world.zones[D.zone];
    for (let k = 0; k < C.boss.adds; k++) { const a = (k / C.boss.adds) * Math.PI * 2; D.rooms.at(-1).mobs.push(dungeonMob(D, Z.alt || Z.enemy, D.lvl, 3, { x: b.x + Math.sin(a) * 3, z: b.z + Math.cos(a) * 3, chase: true })); }
    ev({ t: 'dungeonAdds', x: b.x, z: b.z });
  }
  if (!b.alive && !D.bossDead) {
    D.bossDead = D.rooms.at(-1).cleared = true; D.clearT = G.time - D.t0;
    // every dungeon clear pays a key: a plain run a Tier 1 key, a keyed run its key back 0-3 tiers higher by clear time
    const par = D.variant.par, up = !D.key ? 0 : D.clearT <= par * 0.5 ? 3 : D.clearT <= par * 0.75 ? 2 : D.clearT <= par ? 1 : 0;
    if (!D.variant.trial) D.newKey = addKey(makeKey(D.key ? D.key.t + up : 1));
    ev({ t: 'dungeonBoss', x: D.chest.x, z: D.chest.z, name: D.poi.name, secs: Math.round(D.clearT), par, key: D.newKey ? D.newKey.t : 0, up });
  }
}
function dungeonInteract(pl) {
  const D = G.dungeon, R = CFG.dungeon.interactR, near = (q) => Math.hypot(pl.x - q.x, pl.z - q.z) < R;
  if (D.delve) return delveInteract(pl);
  if (D.bossDead && !D.chestOpen && near(D.chest)) return { kind: 'dungeonChest', label: 'Open Chest' };
  if (near(D.exit) || (D.bossDead && near(D.exit2))) return { kind: 'dungeonLeave', label: 'Leave Dungeon' };
  return null;
}
// the chest: always XP and gold; gear, gems, shards and a case chance on a keyed run or the first clear of a dungeon.
// Key tiers raise item count, item level, the rarity floor, gems and the chest chance.
function claimDungeonChest() {
  const D = G.dungeon; if (!D || !D.bossDead || D.chestOpen) return null;
  D.chestOpen = true;
  const p = G.profile, C = CFG.dungeon, K = C.chest, recs = p.dungeons || (p.dungeons = {});
  const rec = recs[D.id] || (recs[D.id] = { t: 0, clears: 0 }), full = !D.variant.trial && (!!D.key || !rec.clears), t = D.key ? D.key.t : 0;
  const L = Math.max(D.poi.lvl, p.level), res = { name: D.poi.name, full, xp: 0, gold: 0, items: [], gems: 0, shards: 0, case: false, key: D.newKey, tier: t };
  if (p.level < P.cap) { res.xp = Math.round(xpToNext(p.level) * K.xpFrac); addXp(res.xp, 'dungeon'); }
  res.gold = Math.round((K.gold[0] + K.gold[1] * L) * Math.pow(CFG.enemies.goldGrowth, L - 1) * tierMul(curTier()).gold * (keyHas(D, 'gilded') ? 1.5 : 1)); addGold(res.gold);
  if (full) {
    const floor = t >= 15 ? 'legendary' : t >= 5 || D.zone >= K.epicFrom ? 'epic' : 'rare';
    for (let i = 0, n = Math.min(6, K.items + Math.floor(t / 5)) + (keyHas(D, 'bountiful') ? 1 : 0); i < n; i++) {
      let r = rollLoot(D.zone, true); if (rarIdx(r) < rarIdx(floor)) r = floor;
      const it = makeItem(pick(CFG.gear.slots), r, L + K.ilvlAdd + t); res.items.push(it); grantItem(it, 'shrine', { zone: D.zone });
    }
    res.gems = Math.round((randInt(K.gems[0], K.gems[1]) + Math.floor(L / 10)) * tierMul(curTier()).gems * (1 + 0.1 * t)); addEssence(res.gems);
    res.shards = randInt(K.shards[0], K.shards[1]); dropShards(res.shards);
    if (Math.random() < Math.min(0.6, K.caseChance + 0.02 * t) + (keyHas(D, 'lucky') ? 0.25 : 0)) { res.case = true; addCase('treasure', { l: L + K.ilvlAdd + t, src: 'dungeon' }); }
    rec.t = Date.now();
  }
  if (D.variant.trial) {
    // trial: a sigil every clear, then the Radiant roll (no pity: the sigils are the sure path)
    const S = trialState(D.zone); S.n++; S.sig++; res.sigils = S.sig; res.odds = radiantOdds();
    if (Math.random() < 1 / res.odds) {
      const it = makeItem(pick(CFG.gear.slots), 'ancient', L + K.ilvlAdd + 6); it.name = 'Radiant ' + it.name; it.radiant = true;
      grantItem(it, 'shrine', { zone: D.zone }); S.rad++; res.radiant = it;
      ev({ t: 'radiant', name: it.name, n: S.n, odds: res.odds, x: D.chest.x, z: D.chest.z });
    }
  }
  if (typeof craftDungeonLoot === 'function') res.craft = craftDungeonLoot(D, !rec.clears && !D.variant.trial);
  rec.clears++; rec.best = Math.max(rec.best || 0, t); G.dirty = true;
  ev(Object.assign({ t: 'dungeonChest' }, res, { items: res.items.length }));
  return res;
}
function endDungeon(why) {
  const D = G.dungeon; if (!D) return;
  if (D.key && !D.bossDead) addKey(makeKey(D.key.t - 1)); // a failed keyed run hands the key back one tier lower
  const ids = new Set(D.mobs.map((e) => e.id));
  G.enemies = G.enemies.filter((e) => !ids.has(e.id)); for (const id of ids) G.ents.delete(id);
  if (D.delve) for (const b of D.delve.bots || []) G.ents.delete(b.id); // dungeon bots leave with the run
  clearProjectiles();
  G.dungeon = null; G.dungeonObstacles = null; G.obstacles = G.hubObstacles;
  const pl = G.player;
  if (why !== 'away') { pl.x = D.enterPos.x; pl.z = D.enterPos.z; }
  // a fall sends you back to the entrance after the normal respawn delay
  if (pl.alive) { pl.invulnT = 1; pl.hp = pl.maxHp; } else { G.respawnAt = { x: pl.x, z: pl.z }; if (D.delve) G.respawnT = CFG.player.respawn; }
  G.zoneIdx = zoneAt(pl.z);
  ev({ t: 'dungeonEnd', why, name: D.poi.name, cleared: D.bossDead, x: pl.x, z: pl.z, delve: !!D.delve });
}
// --- end dungeons
