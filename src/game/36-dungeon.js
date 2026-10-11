// --- Dungeons: one sealed instance per dungeon POI. Three guarded halls, each door opens when its hall is
// cleared, then a mini-boss room with a reward chest. Like the Rift it stays in G.mode 'hub' (G.dungeon set).
const DC = { x: 0, z: -1800 }; // dungeon instance centre (arena −1000, rift −1400)
CFG.dungeon = {
  room: 18, corridor: 8, corW: 5, bossR: 16, wallR: 0.5, counts: [6, 7, 8], eliteChance: 0.25,
  lvlAdd: 4, hpMul: 1.5, dmgMul: 1.25, boss: { mods: 2, hp: 12, dmg: 1.5, adds: 2, lvlAdd: 2 },
  cooldown: 1200, interactR: 3.6, bossBlock: 30,
  chest: { items: 2, ilvlAdd: 4, epicFrom: 15, gems: [6, 10], shards: [3, 5], caseChance: 0.1, xpFrac: 0.35, gold: [40, 8] },
};
function dungeonPois() { return (CFG.world.pois || []).filter((p) => p.kind === 'dungeon'); }
function dungeonLevel(poi) { return Math.max(poi.lvl, G.profile.level) + CFG.dungeon.lvlAdd + tierAdd(); }
function dungeonReq(poi) { return (CFG.world.zones[poi.zone] || {}).minLevel || 1; }
function dungeonCdLeft(id, now) { const r = (G.profile.dungeons || {})[id]; return r ? Math.max(0, CFG.dungeon.cooldown - ((now || Date.now()) - r.t) / 1000) : 0; }
function strSeed(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
// Deterministic per POI id: rooms walk north/east/west (never south, so the path cannot fold back onto itself).
function dungeonLayout(id) {
  const C = CFG.dungeon, rng = mulberry32(strSeed(id)), rooms = [], cors = [], walls = [], doors = [];
  const rect = (x, z, hx, hz) => ({ x0: x - hx, x1: x + hx, z0: z - hz, z1: z + hz });
  for (let i = 0; i < 4; i++) {
    const h = i === 3 ? C.bossR : C.room / 2;
    if (!i) { rooms.push(Object.assign(rect(DC.x, DC.z, h, h), { x: DC.x, z: DC.z, h, i, boss: false })); continue; }
    const a = rooms[i - 1], dirs = [[0, 1], [1, 0], [-1, 0]].sort(() => rng() - 0.5);
    let nr = null, dir = [0, 1];
    for (const d of dirs) {
      const s = a.h + C.corridor + h, x = a.x + d[0] * s, z = a.z + d[1] * s, r = rect(x, z, h, h);
      if (rooms.some((o) => r.x0 < o.x1 + 3 && r.x1 > o.x0 - 3 && r.z0 < o.z1 + 3 && r.z1 > o.z0 - 3)) continue;
      nr = Object.assign(r, { x, z, h, i, boss: i === 3 }); dir = d; break;
    }
    // north never overlaps (no room lies further north yet), so it is the safe fallback
    if (!nr) { const z = a.z + a.h + C.corridor + h; nr = Object.assign(rect(a.x, z, h, h), { x: a.x, z, h, i, boss: i === 3 }); }
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
  const r0 = rooms[0], b = rooms[3];
  return { rooms, cors, walls, doors, start: { x: r0.x, z: r0.z0 + 4 }, exit: { x: r0.x - 4, z: r0.z0 + 2.2 }, chest: { x: b.x, z: b.z }, exit2: { x: b.x, z: b.z + 5 } };
}
// walls and locked doors as obstacle circles (rebuilt when a door opens: the Grid has no remove)
function dungeonGrid(D) {
  const C = CFG.dungeon, g = new Grid(6), r = C.wallR;
  for (const w of D.walls) { const n = Math.max(1, Math.ceil(Math.hypot(w.x1 - w.x0, w.z1 - w.z0) / (r * 1.6))); for (let k = 0; k <= n; k++) g.add({ x: lerp(w.x0, w.x1, k / n), z: lerp(w.z0, w.z1, k / n), r }); }
  for (const d of D.doors) if (!d.open) for (let k = -3; k <= 3; k++) { const o = (k / 3) * d.w; g.add(d.ax === 'x' ? { x: d.x + o, z: d.z, r: 0.6 } : { x: d.x, z: d.z + o, r: 0.6 }); }
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
  for (const m of D.rooms) { test(m.x0 + r + p, m.x1 - r - p, m.z0 + r + p, m.z1 - r - p); if (bd === 0) return; }
  // corridors shrink only across their width and reach into both rooms, so junctions have no dead strip
  for (const c of D.cors) { if (c.ax === 'z') test(c.x0 + r + p, c.x1 - r - p, c.z0 - 2, c.z1 + 2); else test(c.x0 - 2, c.x1 + 2, c.z0 + r + p, c.z1 - r - p); if (bd === 0) return; }
  if (best) { f.x = best.x; f.z = best.z; }
}
function inRoom(m, x, z) { return x >= m.x0 && x <= m.x1 && z >= m.z0 && z <= m.z1; }
function dungeonMob(D, type, lvl, room, o) {
  const C = CFG.dungeon, B = C.boss, zi = D.zone;
  let e;
  if (o.boss) { e = makeChampion(type, zi, lvl, B.mods, false); delete e.rift; delete e.riftLvl; e.state = 'idle'; e.r *= 1.25; }
  else e = makeEnemy(type, zi, { elite: !!o.elite });
  e.dungeon = true; e.temp = true; e.room = room;
  setEnemyLevel(e, lvl);
  if (o.boss) { e.maxHp = Math.round(e.maxHp / (e.elite ? CFG.enemies.elite.hp : 1) * C.hpMul * B.hp); e.atk *= B.dmg; e.dungeonBoss = true; }
  else { e.maxHp = Math.round(e.maxHp * C.hpMul); e.atk *= C.dmgMul; }
  e.hp = e.maxHp; // mobDmg scales from e.atk, so the ×dmgMul above reaches every hit
  e.x = e.hx = e.wx = o.x; e.z = e.hz = e.wz = o.z; if (o.chase) e.state = 'chase';
  G.enemies.push(e); D.mobs.push(e);
  return e;
}
function startDungeon(poi) {
  const p = G.profile, pl = G.player;
  if (!poi || poi.kind !== 'dungeon' || inInstance() || G.mode !== 'hub' || !pl.alive || activeShrine() || p.level < dungeonReq(poi)) return false;
  if (G.boss && Math.hypot(G.boss.x - pl.x, G.boss.z - pl.z) < CFG.dungeon.bossBlock) return false;
  const C = CFG.dungeon, L = dungeonLayout(poi.id), lvl = dungeonLevel(poi), Z = CFG.world.zones[poi.zone];
  const D = G.dungeon = Object.assign(L, { id: poi.id, poi, zone: poi.zone, lvl, room: 0, mobs: [], boss: null, bossDead: false, chestOpen: false, addsDone: false, enterPos: { x: pl.x, z: pl.z } });
  dungeonGrid(D); clearProjectiles();
  pl.x = D.start.x; pl.z = D.start.z; pl.facing = 0; pl.hp = pl.maxHp; pl.invulnT = 1.5; pl.ammo = pl.ammoMax;
  G.zoneIdx = poi.zone;
  const roster = () => (Z.alt && Math.random() < 0.4 ? Z.alt : Z.enemy);
  D.rooms.forEach((m, i) => {
    m.mobs = []; m.cleared = false;
    if (m.boss) return;
    for (let k = 0; k < C.counts[i]; k++) {
      // the first hall keeps its southern half free: you arrive there
      const x = rand(m.x0 + 3, m.x1 - 3), z = rand(i ? m.z0 + 3 : m.z + 1, m.z1 - 3), elite = Math.random() < C.eliteChance;
      m.mobs.push(dungeonMob(D, roster(), lvl, i, { elite, x, z }));
    }
  });
  const b = D.rooms[3]; D.boss = dungeonMob(D, Z.enemy, lvl + C.boss.lvlAdd, 3, { boss: true, x: b.x, z: b.z + 4 }); b.mobs = [D.boss];
  ev({ t: 'dungeonStart', name: poi.name, lvl, x: pl.x, z: pl.z }); return true;
}
function stepDungeon(dt) {
  const D = G.dungeon, pl = G.player, C = CFG.dungeon;
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
    for (let k = 0; k < C.boss.adds; k++) { const a = (k / C.boss.adds) * Math.PI * 2; D.rooms[3].mobs.push(dungeonMob(D, Z.alt || Z.enemy, D.lvl, 3, { x: b.x + Math.sin(a) * 3, z: b.z + Math.cos(a) * 3, chase: true })); }
    ev({ t: 'dungeonAdds', x: b.x, z: b.z });
  }
  if (!b.alive && !D.bossDead) { D.bossDead = D.rooms[3].cleared = true; ev({ t: 'dungeonBoss', x: D.chest.x, z: D.chest.z, name: D.poi.name }); }
}
function dungeonInteract(pl) {
  const D = G.dungeon, R = CFG.dungeon.interactR, near = (q) => Math.hypot(pl.x - q.x, pl.z - q.z) < R;
  if (D.bossDead && !D.chestOpen && near(D.chest)) return { kind: 'dungeonChest', label: 'Open Chest' };
  if (near(D.exit) || (D.bossDead && near(D.exit2))) return { kind: 'dungeonLeave', label: 'Leave Dungeon' };
  return null;
}
// the chest: always XP and gold; gear, gems, shards and a case chance once per cooldown per dungeon
function claimDungeonChest() {
  const D = G.dungeon; if (!D || !D.bossDead || D.chestOpen) return null;
  D.chestOpen = true;
  const p = G.profile, C = CFG.dungeon, K = C.chest, now = Date.now(), recs = p.dungeons || (p.dungeons = {});
  const rec = recs[D.id] || (recs[D.id] = { t: 0, clears: 0 }), full = dungeonCdLeft(D.id, now) <= 0 || !rec.clears;
  const L = Math.max(D.poi.lvl, p.level), res = { name: D.poi.name, full, xp: 0, gold: 0, items: [], gems: 0, shards: 0, case: false, cd: C.cooldown };
  if (p.level < P.cap) { res.xp = Math.round(xpToNext(p.level) * K.xpFrac); addXp(res.xp, 'dungeon'); }
  res.gold = Math.round((K.gold[0] + K.gold[1] * L) * Math.pow(CFG.enemies.goldGrowth, L - 1) * tierMul(curTier()).gold); addGold(res.gold);
  if (full) {
    const floor = D.zone >= K.epicFrom ? 'epic' : 'rare';
    for (let i = 0; i < K.items; i++) {
      let r = rollLoot(D.zone, true); if (rarIdx(r) < rarIdx(floor)) r = floor;
      const it = makeItem(pick(CFG.gear.slots), r, L + K.ilvlAdd); res.items.push(it); grantItem(it, 'shrine', { zone: D.zone });
    }
    res.gems = Math.round((randInt(K.gems[0], K.gems[1]) + Math.floor(L / 10)) * tierMul(curTier()).gems); addEssence(res.gems);
    res.shards = randInt(K.shards[0], K.shards[1]); dropShards(res.shards);
    if (Math.random() < K.caseChance) { res.case = true; addCase('treasure', { l: L + K.ilvlAdd, src: 'dungeon' }); }
    rec.t = now;
  }
  rec.clears++; G.dirty = true;
  ev(Object.assign({ t: 'dungeonChest' }, res, { items: res.items.length }));
  return res;
}
function endDungeon(why) {
  const D = G.dungeon; if (!D) return;
  const ids = new Set(D.mobs.map((e) => e.id));
  G.enemies = G.enemies.filter((e) => !ids.has(e.id)); for (const id of ids) G.ents.delete(id);
  clearProjectiles();
  G.dungeon = null; G.dungeonObstacles = null; G.obstacles = G.hubObstacles;
  const pl = G.player;
  if (why !== 'away') { pl.x = D.enterPos.x; pl.z = D.enterPos.z; }
  // a fall sends you back to the entrance after the normal respawn delay
  if (pl.alive) { pl.invulnT = 1; pl.hp = pl.maxHp; } else G.respawnAt = { x: pl.x, z: pl.z };
  G.zoneIdx = zoneAt(pl.z);
  ev({ t: 'dungeonEnd', why, name: D.poi.name, cleared: D.bossDead, x: pl.x, z: pl.z });
}
// --- end dungeons
