// ---------------------------------------------------------------------
// OPEN WORLD (World v11, Casper 25 Oct 2026): the areas sit around Base Camp like a Zelda map instead of one road
// north (layout in 11-world-data.js). This file holds what the open map needs on top of it:
// - Warden Gates: a pass between two biomes stays shut until you beat its warden once (saved in profile.gates).
// - Danger warning: walking into an area far above your level shows a red banner, and the passes that lead there
//   carry skull posts and a red label. You can still go: the monsters will just probably kill you.
// - Routes: the next point to walk to, through open passes (quest pointer, Auto Hunt, bots).
// - The Main Path: a chain of objectives through the areas in level order (profile.quest), with rewards per step
//   and a chest per chapter. It is the guide, not a lock: everything except the Warden Gates stays open.
// ---------------------------------------------------------------------
CFG.openWorld = {
  dangerGap: 6,                       // an area whose lowest level is this far above yours is "dangerous"
  warden: { hp: 9, atk: 1.45, size: 1.6, leash: 40, time: 120, lvlAdd: 2, near: 7 },
  quest: { kills: 12, denKills: 8, gold: [30, 7], xp: 0.12, tick: 0.5 },
};
const OW = { routeT: -1, routes: new Map(), warden: null, warnT: {}, askT: {}, qT: 0, dangerT: {} };
const gateOpen = (e) => !e.warden || !!(G.profile && G.profile.gates && G.profile.gates[e.id]);
const edgeById = (id) => CFG.world.edges.find((e) => e.id === id) || null;
const edgeBetween = (a, b) => CFG.world.edges.find((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a)) || null;
const edgeFar = (e, zi) => (e.a === zi ? e.b : e.a);
// the higher of the two areas a gate joins: its warden guards that land
const edgeHigh = (e) => { const Z = CFG.world.zones; return Z[e.a].minLevel >= Z[e.b].minLevel ? e.a : e.b; };
const areaDanger = (zi, level) => { const zn = CFG.world.zones[zi]; return !zn.safe && zn.lvl[0] >= level + CFG.openWorld.dangerGap; };

// --- closed gates block the pass (the walls beside them are colliders in the hub grid) ---
function gateClamp(f) {
  const W = CFG.world; if (!W.edgesOf) return;
  const zi = f._gz != null ? f._gz : zoneAt(f.x, f.z), zn = W.zones[zi], pad = f.r + 0.7;
  for (const e of W.edgesOf[zi]) {
    if (gateOpen(e)) continue;
    if (e.vert) { const side = Math.sign(zn.cx - e.x); if (Math.abs(f.z - e.z) < e.w / 2 + f.r && (f.x - e.x) * side < pad) f.x = e.x + side * pad; }
    else { const side = Math.sign(zn.cz - e.z); if (Math.abs(f.x - e.x) < e.w / 2 + f.r && (f.z - e.z) * side < pad) f.z = e.z + side * pad; }
  }
  f._gz = zoneAt(f.x, f.z);
}

// --- routes: breadth-first over the areas, through passes that are open ---
// returns the list of edges from area a to area b, or null when every way is shut (cached for a second)
function areaRoute(a, b, through) {
  if (a === b) return [];
  if (G.time - OW.routeT > 1) { OW.routes.clear(); OW.routeT = G.time; }
  const key = a + '>' + b + (through || ''); if (OW.routes.has(key)) return OW.routes.get(key);
  const W = CFG.world, prev = new Map([[a, null]]), q = [a];
  while (q.length) { const z = q.shift(); if (z === b) break;
    for (const e of W.edgesOf[z]) { const n = edgeFar(e, z); if (prev.has(n) || !(gateOpen(e) || e.id === through)) continue; prev.set(n, e); q.push(n); } }
  let out = null;
  if (prev.has(b)) { out = []; for (let z = b; z !== a;) { const e = prev.get(z); out.unshift(e); z = edgeFar(e, z); } }
  OW.routes.set(key, out); return out;
}
// the next point to walk to on the way from (fx, fz) to (tx, tz); null when no open way exists
function routeNext(fx, fz, tx, tz, through) {
  const a = zoneAt(fx, fz), b = zoneAt(tx, tz); if (a === b) return { x: tx, z: tz };
  const R = areaRoute(a, b, through); if (!R || !R.length) return null;
  const e = R[0], near = CFG.world.passSide(e, a), far = CFG.world.passSide(e, edgeFar(e, a));
  // walk to the mouth of the pass on this side first, then straight through it
  const along = e.vert ? Math.abs(fz - e.z) : Math.abs(fx - e.x), across = e.vert ? Math.abs(fx - e.x) : Math.abs(fz - e.z);
  return along < e.w / 2 - 1 && across < 12 ? far : near;
}
const areaReachable = (a, b) => !!areaRoute(a, b);

// --- Warden Gates ---
function wardenInteract(pl) {
  if (OW.warden) return null;
  const zi = zoneAt(pl.x, pl.z);
  for (const e of CFG.world.edgesOf[zi]) {
    if (gateOpen(e)) continue;
    if (Math.hypot(pl.x - e.x, pl.z - e.z) > e.w / 2 + CFG.openWorld.warden.near) continue;
    const hi = CFG.world.zones[edgeHigh(e)];
    return { kind: 'warden', edge: e, label: `Challenge Warden · Lv ${e.lvl + CFG.openWorld.warden.lvlAdd + tierAdd()}` };
  }
  return null;
}
function startWarden(e) {
  const p = G.profile, pl = G.player, Z = CFG.world.zones, C = CFG.openWorld.warden, L = e.lvl + C.lvlAdd + tierAdd();
  if (OW.warden || gateOpen(e) || !pl.alive) return false;
  // far above you: warn first, a second tap within a few seconds starts the fight anyway
  if (L >= p.level + CFG.openWorld.dangerGap && !(G.time - (OW.askT[e.id] ?? -99) < 5)) {
    OW.askT[e.id] = G.time; ev({ t: 'danger', gate: true, lvl: L, name: Z[edgeHigh(e)].name });
    toast(`The warden is level ${L}. You will probably die. Tap again to fight it anyway.`, 'bad'); return false;
  }
  const zi = zoneAt(pl.x, pl.z), hi = edgeHigh(e), side = CFG.world.passSide(e, zi);
  const b = makeEnemy(Z[hi].enemy, zi, { elite: true });
  b.temp = true; b.warden = e.id; b.bossName = `Warden of the ${Z[hi].name} Gate`; b.respawnT = 1e9;
  setEnemyLevel(b, L);
  b.x = b.hx = b.wx = side.x; b.z = b.hz = b.wz = side.z; b.r *= C.size;
  b.maxHp = b.hp = Math.round(b.maxHp * C.hp); b.atk *= C.atk; b.state = 'chase';
  eliteMods(b); G.enemies.push(b);
  OW.warden = { e: b, edge: e, t: 0, away: 0 };
  ev({ t: 'spawn', x: b.x, z: b.z, elite: true }); markCombat();
  showBanner('WARDEN', `${b.bossName} · Lv ${L}`, 'red', 2.4);
  return true;
}
function stepWarden(dt) {
  const w = OW.warden; if (!w) return;
  const pl = G.player, C = CFG.openWorld.warden, e = w.e;
  w.t += dt;
  const gone = () => { G.enemies = G.enemies.filter((x) => x !== e); G.ents.delete(e.id); OW.warden = null; };
  if (!e.alive) { gone(); return; }
  w.away = Math.hypot(pl.x - w.edge.x, pl.z - w.edge.z) > C.leash || !pl.alive ? w.away + dt : 0;
  if (w.away > 4 || w.t > C.time || inInstance()) { gone(); toast('The warden returns to its gate', 'bad'); }
}
function wardenKilled(e) {
  const W = OW.warden, edge = edgeById(e.warden); if (!edge) return;
  const p = G.profile, Z = CFG.world.zones, hi = Z[edgeHigh(edge)];
  p.gates[edge.id] = Date.now(); G.dirty = true; OW.routes.clear();
  addGold(Math.round((60 + edge.lvl * 12) * tierMul(curTier()).gold)); addEssence(5 + Math.floor(edge.lvl / 10));
  addCase('treasure', { l: Math.max(p.level, edge.lvl), src: 'warden' });
  ev({ t: 'gateOpen', id: edge.id, x: edge.x, z: edge.z, name: hi.name });
  showBanner('GATE OPEN', `The way to ${hi.name} is open · Lv ${hi.lvl[0]}–${hi.lvl[1]}`, 'gold', 3);
  if (W && W.e === e) OW.warden = null;
  questCheck();
}

// --- danger warning when you walk into an area far above you (once a minute per area) ---
function dangerCheck(zi) {
  const p = G.profile, zn = CFG.world.zones[zi];
  if (!areaDanger(zi, p.level) || G.time - (OW.dangerT[zi] ?? -99) < 60) return;
  OW.dangerT[zi] = G.time; ev({ t: 'danger', zone: zi, name: zn.name, lvl: zn.lvl[0], hi: zn.lvl[1] });
}

// --- the Main Path ---
// one chapter per area in level order: reach it, hunt there, clear a den (or beat the lair boss in the last area of a
// biome), then open the Warden Gate to the next area when it is in a new biome
function questSteps(i) {
  const W = CFG.world, Z = W.zones, zn = Z[i], Q = CFG.openWorld.quest; if (!zn || zn.safe) return [];
  const s = [{ k: 'reach', zone: i, text: `Travel to ${zn.name}` }, { k: 'kill', zone: i, n: Q.kills, text: `Defeat ${Q.kills} monsters in ${zn.name}` }];
  const next = Z[i + 1], lastOfBiome = !next || next.biome !== zn.biome;
  if (lastOfBiome && typeof AREA_UNIQUE !== 'undefined' && AREA_UNIQUE[i]) s.push({ k: 'lair', zone: i, text: `Defeat ${AREA_UNIQUE[i][0]} at ${zn.lairName}` });
  else { const di = W.dens.findIndex((d) => d.zone === i); s.push({ k: 'den', zone: i, den: di, n: Q.denKills, text: `Clear ${zn.denName}: defeat ${Q.denKills} den monsters` }); }
  if (next) { const e = edgeBetween(i, i + 1); if (e && e.warden) s.push({ k: 'gate', edge: e.id, zone: i, text: `Open the Warden Gate to ${next.name}` }); }
  return s;
}
const questDone = () => G.profile.quest.ch >= CFG.world.zones.length;
function questStep() { const q = G.profile.quest; return questDone() ? null : questSteps(q.ch)[q.step] || null; }
// where the current step wants you (the tracker, the gold beacon and the minimap star point here)
function questTarget() {
  const s = questStep(), W = CFG.world; if (!s) return null;
  if (s.k === 'gate') { const e = edgeById(s.edge); return { x: e.x, z: e.z, edge: e.id }; }
  if (s.k === 'den') { const d = W.dens[s.den]; return d ? { x: d.x, z: d.z } : null; }
  if (s.k === 'lair') { const l = W.lairs[s.zone]; return { x: l.x, z: l.z }; }
  const zn = W.zones[s.zone]; return { x: zn.cx, z: zn.cz };
}
function questAdvance() {
  const p = G.profile, q = p.quest, s = questStep(), Q = CFG.openWorld.quest; if (!s) return;
  addGold(Math.round((Q.gold[0] + Q.gold[1] * p.level) * tierMul(curTier()).gold));
  if (p.level < P.cap) addXp(xpToNext(p.level) * Q.xp, 'quest');
  q.step++; q.n = 0;
  const steps = questSteps(q.ch);
  if (q.step >= steps.length) {
    const zn = CFG.world.zones[q.ch];
    addCase('treasure', { l: Math.max(p.level, zn.lvl[1]), src: 'quest' });
    q.ch++; q.step = 0;
    ev({ t: 'questChapter', name: zn.name, done: questDone() });
  } else ev({ t: 'questStep', text: s.text });
  G.dirty = true;
}
// steps that finish by being somewhere or by a gate being open are checked here (kills are counted in questOnKill)
function questCheck() {
  const p = G.profile; if (!p || !p.quest) return;
  for (let guard = 0; guard < 8; guard++) {
    const s = questStep(); if (!s) return;
    if (s.k === 'reach' && p.visited.includes(s.zone)) { questAdvance(); continue; }
    if (s.k === 'gate' && gateOpen(edgeById(s.edge))) { questAdvance(); continue; }
    return;
  }
}
function questOnKill(e) {
  const p = G.profile, s = questStep(); if (!s || !p) return;
  if (s.k === 'lair' && e.lairBoss === s.zone) { questAdvance(); return; }
  if (e.zone !== s.zone || e.rift || e.dungeon) return;
  if (s.k === 'kill' || (s.k === 'den' && e.den != null)) { if (++p.quest.n >= s.n) questAdvance(); else G.dirty = true; }
}
function stepOpenWorld(dt) {
  if (G.mode !== 'hub' || !G.player) return;
  stepWarden(dt);
  if ((OW.qT -= dt) <= 0) { OW.qT = CFG.openWorld.quest.tick; if (!inInstance()) questCheck(); }
}
// called when you enter an area (33-world-sim stepHub)
function openWorldEnter(zi) {
  const p = G.profile; if (!p.visited.includes(zi)) { p.visited.push(zi); G.dirty = true; }
  dangerCheck(zi); questCheck();
}
// (the save migration for profile.gates / quest / visited is openWorldMigrate in 22-profile.js)
