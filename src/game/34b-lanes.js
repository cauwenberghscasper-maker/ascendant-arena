// ---------------------------------------------------------------------
// Ascendant Lanes: a small MOBA for phones (Casper, 25 Oct 2026: "League of Legends-style, 1v1, 2v2, 3v3, with your
// own character from the farm map"). You bring your own hero exactly as you built it (gear, talents, masteries,
// relics); empty places are filled with computer heroes. One lane runs north-south between two bases: each base has
// a Core and two towers in front of it, and minion waves march down the lane every CFG.lanes.wave seconds. 2v2 and
// 3v3 add a jungle camp on each flank (a guardian whose fall gives the team a damage buff). Destroy the enemy Core to
// win; at the time limit the team with more structure health left wins.
// Rules of the lane: towers shoot the nearest enemy in range, minions first, but a hero who hurts an allied hero
// under the tower becomes its target. A tower only takes full damage while your minions are near it (no backdooring),
// and the inner tower and the Core stay shielded until the structure in front of them has fallen.
// The game that runs the match (you alone, or the earliest player in an online party: 76-lanes-mp.js) simulates the
// minions, towers, Cores, camps and bots; every human always runs their own hero (victim-authoritative, like 72-pvp).
// Level matching (to be finished later): every player has a Lanes rating card (`lanesRating`: level, Power, bracket);
// quick match queues per bracket, and CFG.lanes.normalize scales every hero to the match level so a level 20 and a
// level 150 can play fairly. See docs/log/2026-10-25-lanes-mode.md.
// ---------------------------------------------------------------------
const LC = { x: 0, z: -2600 }; // Lanes map centre (arena −1000, rift −1400, dungeon −1800, siege −2200)
CFG.lanes = {
  unlock: 10, sizes: [1, 2, 3], half: { x: 19, z: 64 }, wide3: 23, // field half-size (3v3 is a little wider)
  core: 54, towers: [38, 21], fountain: 60, fountainR: 6, campX: 15, campZ: 0,
  wave: 22, firstWave: 4, melee: 3, ranged: 2, maxMinions: 40, time: 600, countdown: 3,
  respawn: [6, 1, 18], // base seconds, +per minute, cap
  // stats in units of the match's reference hero (a level-L hero in level-L Rare gear): hp in hero shots, dmg in hero HP
  minion: { melee: { hp: 1.7, dmg: 0.055, cd: 1.1, range: 1.7, speed: 3.4, r: 0.6 }, ranged: { hp: 1.2, dmg: 0.05, cd: 1.5, range: 7, speed: 3.4, r: 0.5 } },
  tower: { hp: 34, dmg: 0.17, minionDmg: 0.42, cd: 1.15, range: 11, r: 1.6, aggro: 2.5 },
  coreHp: 50, coreR: 2.4, structDmg: 0.75, backdoor: 0.35, sight: 7.5, pvp: 0.8, push: 0.12, // push: each tower a team has lost makes the other side's minions 12% sturdier
  camp: { hp: 22, dmg: 0.09, cd: 1.3, range: 2.4, leash: 9, respawn: 75, buff: 0.15, buffT: 60, type: 'boar' },
  heal: 0.18, // fountain heal per second (share of max HP)
  zoom: 1.12,
  // rank points per win / loss (never below 0), the Lanes ranks, and play-earned chests (never sold, odds in Inventory)
  rp: { win: 20, loss: -8, bot: 0.5 }, ranks: [[0, 'Bronze'], [100, 'Silver'], [250, 'Gold'], [450, 'Platinum'], [700, 'Diamond'], [1000, 'Ascendant']],
  chest: { win: 'treasure', loss: 'hunter' },
  // level matching: brackets by player level (quick match only queues inside one), and stat normalisation
  brackets: [1, 20, 40, 70, 100, 150, 210], normalize: 'auto', normalizeGap: 15, normalizeSoft: 0.5,
};
const LN_TEAMS = ['blue', 'red'];
const lanesRec = () => { const p = G.profile; if (!p.lanes) p.lanes = { rp: 0, best: 0, w: 0, l: 0, n: 0 }; return p.lanes; };
const lanesRank = (rp) => { let r = CFG.lanes.ranks[0][1]; for (const [k, n] of CFG.lanes.ranks) if (rp >= k) r = n; return r; };
// --- Lanes rating: the card a player brings to matchmaking (sent in the lobby presence) ---
function lanesBracket(level) { const B = CFG.lanes.brackets; let i = 0; while (i < B.length - 1 && level >= B[i + 1]) i++; return i; }
function lanesBracketName(i) { const B = CFG.lanes.brackets; return i >= B.length - 1 ? `Lv ${B[B.length - 1]}+` : `Lv ${B[i]}-${B[i + 1] - 1}`; }
// mmr: rank points plus a little for level and Power, so a later queue can widen its search step by step
function lanesRating(p, power) { const L = (p && p.level) || 1, rp = ((p && p.lanes) || {}).rp || 0; return { lvl: L, pw: Math.round(power || 0), br: lanesBracket(L), mmr: Math.round(1000 + rp + 2 * Math.min(L, 210)) }; }
// should this match scale everyone to its level? 'auto': only when the humans' levels are far apart
function lanesShouldNormalize(levels) { const N = CFG.lanes.normalize; if (N === true || N === false) return N; return levels.length > 1 && Math.max(...levels) - Math.min(...levels) > CFG.lanes.normalizeGap; }
// --- end Lanes rating

// the reference hero of a match level: what minion, tower and bot numbers are measured in
function lanesRef(L) {
  const f = makeFighter({ name: 'ref', team: 'ref', cls: STARTER_HERO, x: 0, z: 0 }); applyLoadout(f, STARTER_HERO, []);
  applyStats(f, 'hub', { level: L, gear: refGear(L) }); G.ents.delete(f.id);
  return { hp: f.maxHp, dmg: f.dmg * (CFG.attacks[STARTER_HERO].mult || 1), power: powerOf(f) };
}
// scale a hero so its Power matches the match level, keeping a softened share of how good its build is for its own level
function lanesNormalize(f, L, ownL) {
  const R = CFG.lanes, mine = powerOf(f), refOwn = lanesRef(ownL).power, refL = lanesRef(L).power;
  const build = clamp(mine / Math.max(1, refOwn), 0.6, 1.6), target = refL * Math.pow(build, R.normalizeSoft), s = target / Math.max(1, mine);
  const k = f.maxHp > 0 ? f.hp / f.maxHp : 1; f.maxHp = Math.round(f.maxHp * s); f.dmg *= s; f.dmgAlt *= s; f.hp = f.maxHp * k;
}
const lanesSide = (team) => (team === 'blue' ? -1 : 1); // blue base in the south (−z), red in the north
const lanesEnemy = (team) => (team === 'blue' ? 'red' : 'blue');
const lanesHalfX = () => (G.lanes && G.lanes.size >= 3 ? CFG.lanes.wide3 : CFG.lanes.half.x);
function lanesSpawnPoint(team, i) { const s = lanesSide(team), R = CFG.lanes; return { x: LC.x + ((i || 0) - 1) * 2.4, z: LC.z + s * (R.fountain - 1) }; }
// opts: { size, team, seed, humans: [{ key, team, nick, cls, level }], host, code, normalize }
function startLanes(opts) {
  const p = G.profile, pl = G.player, R = CFG.lanes;
  if (G.mode !== 'hub' || G.rift || G.dungeon || G.siege || G.lanes || !pl.alive) return false;
  opts = opts || {};
  const size = clamp(opts.size | 0 || 1, 1, 3), myTeam = opts.team === 'red' ? 'red' : 'blue';
  const humans = (opts.humans || []).filter((h) => h && h.key !== MP.sid);
  const levels = [p.level, ...humans.map((h) => h.level || p.level)], L = Math.max(1, Math.round(levels.reduce((a, b) => a + b, 0) / levels.length));
  const norm = opts.normalize != null ? !!opts.normalize : lanesShouldNormalize(levels);
  clearProjectiles();
  const S = G.lanes = { size, t: 0, phase: 'countdown', cd: R.countdown, L, ref: lanesRef(L), norm, myTeam, code: opts.code || '', host: opts.host !== false, seed: opts.seed || 1,
    waveT: R.firstWave, waveN: 0, fighters: [], bots: [], minions: [], structs: [], camps: [], peers: humans, kills: { blue: 0, red: 0 }, buff: { blue: 0, red: 0 },
    result: null, overT: 0, back: { x: pl.x, z: pl.z, team: pl.team }, stats: { kills: 0, deaths: 0, structs: 0, minions: 0 }, mid: 0 };
  G.mode = 'lanes'; G.obstacles = S.grid = new Grid(6);
  // structures: two towers and a Core per base (kept in G.ents so their shots have an owner)
  for (const team of LN_TEAMS) {
    const s = lanesSide(team);
    R.towers.forEach((tz, i) => S.structs.push(lanesStruct(team, 'tower', LC.x, LC.z + s * tz, R.tower.hp, R.tower.r, i === 0 ? 'outer' : 'inner')));
    S.structs.push(lanesStruct(team, 'core', LC.x, LC.z + s * R.core, R.coreHp, R.coreR, 'core'));
  }
  if (size >= 2) for (const sx of [-1, 1]) S.camps.push(lanesCamp(LC.x + sx * (lanesHalfX() - 4), LC.z + R.campZ));
  // your hero, as you built it (stats normalised to the match level when asked)
  pl.team = myTeam; refreshPlayerStats(true); if (norm) lanesNormalize(pl, L, p.level);
  const sp = lanesSpawnPoint(myTeam, 1); pl.x = sp.x; pl.z = sp.z; pl.facing = myTeam === 'blue' ? 0 : Math.PI; pl.hp = pl.maxHp; pl.invulnT = 2; pl.ammo = pl.ammoMax; pl.superCharge = 0; pl.intent = newIntent();
  S.fighters.push(pl);
  // empty places: bots (only the game that runs the match makes them; 76-lanes-mp.js sends them to the others)
  if (S.host) lanesFillBots(S, humans);
  ev({ t: 'lanesStart', size, team: myTeam, x: pl.x, z: pl.z, norm, L });
  return true;
}
function lanesStruct(team, kind, x, z, hpK, r, tier) {
  const S = G.lanes, hp = Math.round(S.ref.dmg * hpK);
  const o = { id: nextId++, kind: 'structure', sk: kind, tier, team, x, z, hx: x, hz: z, r, hp, maxHp: hp, alive: true, flashT: 0, hurtT: 0, atkCd: 1, tgt: null, aggro: null, aggroT: 0, armor: 0, invulnT: 0, lastHurt: -99 };
  G.ents.set(o.id, o); return o;
}
function lanesCamp(x, z) {
  const S = G.lanes, C = CFG.lanes.camp, type = CFG.enemies[C.type] ? C.type : Object.keys(CFG.enemies).find((k) => CFG.enemies[k] && CFG.enemies[k].r) || 'boar';
  const e = { id: nextId++, kind: 'enemy', type, zone: 1, team: 'neutral', lanesCamp: true, x, z, hx: x, hz: z, r: (CFG.enemies[type].r || 0.8) * 1.6, elite: true, bossName: 'Lane Guardian',
    lvl: S.L, hp: 1, maxHp: 1, atk: 1, alive: true, state: 'idle', atkCd: 0, flashT: 0, slowT: 0, invulnT: 0, armorT: 0, respawnT: 0, facing: 0, moveAmt: 0, attackAnim: 0, lungeT: 0, windT: 0, lastHurt: -99, tgt: null };
  e.maxHp = e.hp = Math.round(S.ref.dmg * C.hp); e.atk = S.ref.hp * C.dmg; G.ents.set(e.id, e); return e;
}
// bots: heroes of the match level in Rare gear (lanes are fair: a bot is as strong as the reference hero)
function lanesBot(team, i, cls, name) {
  const S = G.lanes, sp = lanesSpawnPoint(team, i);
  const b = makeFighter({ name, team, isBot: true, cls, x: sp.x, z: sp.z, level: S.L, facing: team === 'blue' ? 0 : Math.PI,
    ai: { role: 'lane', t: 0, tgt: null, stuck: 0, lx: sp.x, lz: sp.z, side: Math.random() < 0.5 ? 1 : -1, sideT: 1, fireT: 0, back: false } });
  applyLoadout(b, cls, []); applyStats(b, 'hub', { level: S.L, gear: refGear(S.L) }); b.hp = b.maxHp;
  b.lanesBot = true; b.nick = name; b.slot = i; b.key = 'lbot:' + S.seed + ':' + team + i;
  return b;
}
function lanesFillBots(S, humans) {
  const names = seededShuffle(BOT_NAMES.slice(), Math.random), classes = seededShuffle(CFG.brawlerOrder.slice(), Math.random);
  let n = 0;
  for (const team of LN_TEAMS) {
    const have = (team === S.myTeam ? 1 : 0) + humans.filter((h) => h.team === team).length;
    for (let i = have; i < S.size; i++) {
      const b = lanesBot(team, i, classes[n % classes.length], names[n % names.length]); n++;
      if (S.size >= 2 && i === S.size - 1) b.ai.role = 'jungle'; // the last bot of a team takes the camps now and then
      S.bots.push(b); S.fighters.push(b);
    }
  }
}
// --- targets: everything alive on the field (forEachTarget in 31-combat.js) ---
function lanesTargets(fn) {
  const S = G.lanes; if (!S) return;
  for (const f of S.fighters) fn(f);
  for (const m of S.minions) if (m.alive) fn(m);
  for (const s of S.structs) if (s.alive) fn(s);
  for (const c of S.camps) if (c.alive) fn(c);
  if (typeof lanesMpPeers === 'function') for (const e of lanesMpPeers()) fn(e);
}
// structures are shielded until the one in front of them falls; towers take little damage with no enemy minions near
function lanesShielded(s) {
  const S = G.lanes; if (s.sk === 'tower' && s.tier === 'outer') return false;
  const front = S.structs.filter((o) => o.team === s.team && o.alive && (s.sk === 'core' ? o.sk === 'tower' : o.tier === 'outer'));
  return front.length > 0;
}
// every hit inside a match passes here first (dealDamage): shields, backdoor protection, softer hero-vs-hero hits,
// and tower aggro on a hero who hurts an allied hero under it
function lanesDmgMod(t, srcId, amount) {
  const S = G.lanes, R = CFG.lanes, src = G.ents.get(srcId);
  if (t.kind === 'structure') {
    if (!t.alive || lanesShielded(t)) return 0;
    if (src && src.kind === 'fighter') { const near = S.minions.some((m) => m.alive && m.team !== t.team && Math.hypot(m.x - t.x, m.z - t.z) < R.tower.range + 2); if (!near) amount *= R.backdoor; }
    t.hurtT = 1.2;
  }
  if (src && src.team && src.team !== 'neutral' && S.buff[src.team] > 0) amount *= 1 + R.camp.buff;
  if (t.kind === 'fighter' && src && src.kind === 'fighter') {
    amount *= R.pvp;
    for (const s of S.structs) if (s.alive && s.sk === 'tower' && s.team === t.team && Math.hypot(src.x - s.x, src.z - s.z) < R.tower.range) { s.aggro = src; s.aggroT = R.tower.aggro; }
  }
  if (t.lanesCamp && src) { t.tgt = src; t.state = 'chase'; }
  // an online guest: hits on the host's bodies show here at once and go to the host, which decides when they fall
  if (!S.host && S.code && (t.kind === 'minion' || t.kind === 'structure' || t.lanesCamp || t.lanesBot)) { amount = Math.min(amount, Math.max(0, t.hp - 1)); if (typeof lanesMpGuestHit === 'function') lanesMpGuestHit(t, amount, srcId); }
  return amount;
}
// a body fell (killEntity): count it, schedule hero respawns, pay structure kills, end the match on a Core
function lanesOnKill(t, src) {
  const S = G.lanes, R = CFG.lanes;
  ev({ t: 'die', x: t.x, z: t.z, kind: t.kind === 'enemy' ? t.type : t.kind === 'structure' ? 'boss' : t.kind, isPlayer: !!t.isPlayer });
  if (t.kind === 'fighter') {
    const min = S.t / 60; t.respawnT = Math.min(R.respawn[2], R.respawn[0] + R.respawn[1] * min);
    const by = lanesEnemy(t.team); S.kills[by]++;
    if (t.isPlayer) { S.stats.deaths++; toast(`You fell · back in ${Math.ceil(t.respawnT)}s`, 'bad'); }
    if (src && src.isPlayer) { S.stats.kills++; ev({ t: 'ko', name: t.nick || t.name }); }
    ev({ t: 'lanesKill', team: by, name: t.nick || t.name, mine: t.team === S.myTeam });
  } else if (t.kind === 'structure') {
    if (src && src.team === S.myTeam) S.stats.structs++;
    ev({ t: 'lanesStructDown', sk: t.sk, team: t.team, mine: t.team === S.myTeam, x: t.x, z: t.z });
    if (t.sk === 'core' && S.host) lanesEnd(lanesEnemy(t.team), 'core');
  } else if (t.kind === 'minion') { t.deadAt = G.time; if (src && src.isPlayer) S.stats.minions++; }
  else if (t.lanesCamp) { t.respawnT = R.camp.respawn; const team = src && src.team; if (team === 'blue' || team === 'red') { S.buff[team] = R.camp.buffT; ev({ t: 'lanesBuff', team, mine: team === S.myTeam }); } }
}
function lanesSpawnWave() {
  const S = G.lanes, R = CFG.lanes; S.waveN++;
  for (const team of LN_TEAMS) {
    const s = lanesSide(team), z0 = LC.z + s * (R.core - 3);
    const kinds = []; for (let i = 0; i < R.melee; i++) kinds.push('melee'); for (let i = 0; i < R.ranged; i++) kinds.push('ranged');
    kinds.forEach((k, i) => { if (S.minions.filter((m) => m.alive).length < R.maxMinions) S.minions.push(lanesMinion(team, k, LC.x + ((i % 3) - 1) * 1.6, z0 + s * Math.floor(i / 3) * 1.8)); });
  }
  S.minions = S.minions.filter((m) => m.alive || G.time - m.deadAt < 2);
}
function lanesMinion(team, mk, x, z) {
  const S = G.lanes, M = CFG.lanes.minion[mk], lost = S.structs.filter((o) => o.team !== team && !o.alive).length, grow = (1 + 0.04 * S.waveN) * (1 + CFG.lanes.push * lost); // each wave a little sturdier, and more so for the side that is ahead
  const m = { id: nextId++, kind: 'minion', mk, team, x, z, r: M.r, hp: Math.round(S.ref.dmg * M.hp * grow), maxHp: 0, dmg: S.ref.hp * M.dmg * grow, alive: true, facing: team === 'blue' ? 0 : Math.PI,
    atkCd: Math.random(), flashT: 0, slowT: 0, invulnT: 0, armorT: 0, moveAmt: 0, attackAnim: 0, tgt: null, tgtT: 0, lastHurt: -99, deadAt: 0 };
  m.maxHp = m.hp; G.ents.set(m.id, m); return m;
}
function stepLanes(dt) {
  const S = G.lanes, R = CFG.lanes, pl = G.player;
  if (S.phase === 'countdown') { S.cd -= dt; for (const f of S.fighters) clearOneShots(f.intent); if (S.cd <= 0) { S.phase = 'fight'; ev({ t: 'lanesFight' }); } return; }
  if (S.phase === 'over') { S.overT -= dt; for (const f of S.fighters) clearOneShots(f.intent); }
  else S.t += dt;
  const guest = typeof lanesMpStep === 'function' && lanesMpStep(dt); // an online guest mirrors the host's field
  // heroes (yours always; bots only on the game that runs the match)
  for (const f of S.fighters) {
    if (!f.alive) { if ((f.respawnT -= dt) <= 0 && S.phase !== 'over') lanesRespawn(f); continue; }
    if (f.lanesBot && !guest && S.phase === 'fight') lanesBotThink(f, dt);
    if (f.lanesBot && guest) { lanesMirrorBot(f, dt); continue; }
    stepFighter(f, dt, 'lanes');
    // the fountain heals fast and keeps enemies out
    const sp = lanesSpawnPoint(f.team, 1);
    if (Math.hypot(f.x - sp.x, f.z - sp.z) < R.fountainR) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * R.heal * dt);
    const esp = lanesSpawnPoint(lanesEnemy(f.team), 1), ed = Math.hypot(f.x - esp.x, f.z - esp.z);
    if (ed < R.fountainR + 1) { f.x = esp.x + (f.x - esp.x) / (ed || 1) * (R.fountainR + 1); f.z = esp.z + (f.z - esp.z) / (ed || 1) * (R.fountainR + 1); }
  }
  for (let i = 0; i < S.fighters.length; i++) for (let j = i + 1; j < S.fighters.length; j++) { const a = S.fighters[i], b = S.fighters[j]; if (a.alive && b.alive) separate(a, b); }
  for (const team of LN_TEAMS) S.buff[team] = Math.max(0, S.buff[team] - dt);
  for (const s of S.structs) { s.flashT -= dt; s.hurtT -= dt; s.x = s.hx; s.z = s.hz; } // knock-backs and supers never move a building
  // keep bodies out of the buildings (they are not obstacles, so shots still reach them)
  const push = (e) => { for (const s of S.structs) { if (!s.alive) continue; const dx = e.x - s.x, dz = e.z - s.z, d = Math.hypot(dx, dz), min = s.r + (e.r || 0.5); if (d < min && d > 1e-4) { e.x = s.x + dx / d * min; e.z = s.z + dz / d * min; } } };
  for (const f of S.fighters) if (f.alive) push(f);
  if (guest) { for (const m of S.minions) push(m); return; }
  if (S.phase === 'fight') { if ((S.waveT -= dt) <= 0) { S.waveT = R.wave; lanesSpawnWave(); } }
  for (const m of S.minions) if (m.alive) { lanesStepMinion(m, dt); push(m); }
  for (let i = 0; i < S.minions.length; i++) for (let j = i + 1; j < S.minions.length; j++) { const a = S.minions[i], b = S.minions[j]; if (a.alive && b.alive) lanesSeparate(a, b); }
  for (const s of S.structs) if (s.alive && s.sk === 'tower') lanesStepTower(s, dt);
  for (const c of S.camps) lanesStepCamp(c, dt);
  if (S.phase === 'fight' && S.t >= R.time) { const hp = (team) => S.structs.filter((s) => s.team === team).reduce((a, s) => a + Math.max(0, s.hp) / s.maxHp, 0); const b = hp('blue'), r = hp('red'); lanesEnd(b === r ? (S.kills.blue >= S.kills.red ? 'blue' : 'red') : b > r ? 'blue' : 'red', 'time'); }
}
const lanesSeparate = (a, b) => { const dx = a.x - b.x, dz = a.z - b.z, min = (a.r + b.r) * 0.9, d = Math.hypot(dx, dz); if (d >= min || d < 1e-4) return; const k = (min - d) / d * 0.5; a.x += dx * k; a.z += dz * k; b.x -= dx * k; b.z -= dz * k; };
function lanesRespawn(f) {
  const sp = lanesSpawnPoint(f.team, f.isPlayer ? 1 : (f.slot || 0));
  f.alive = true; f.x = sp.x; f.z = sp.z; f.hp = f.maxHp; f.invulnT = 2; f.ammo = f.ammoMax; f.burnT = 0; f.slowT = 0;
  if (f.ai) { f.ai.back = false; f.ai.tgt = null; }
  if (f.isPlayer) ev({ t: 'lanesRespawn' });
}
// nearest enemy body for a minion or tower: minions first, then heroes, then buildings
function lanesNearest(x, z, team, range, heroes) {
  const S = G.lanes; let best = null, bd = range;
  for (const m of S.minions) if (m.alive && m.team !== team) { const d = Math.hypot(m.x - x, m.z - z) - m.r; if (d < bd) { bd = d; best = m; } }
  if (best) return best;
  if (heroes !== false) { bd = range; lanesTargets((f) => { if (f.kind !== 'fighter' || !f.alive || f.team === team || f.team === 'neutral' || f.invulnT > 1.2) return; const d = Math.hypot(f.x - x, f.z - z) - (f.r || 0.5); if (d < bd) { bd = d; best = f; } }); }
  return best;
}
function lanesStepMinion(m, dt) {
  const S = G.lanes, R = CFG.lanes, M = R.minion[m.mk], s = lanesSide(m.team);
  m.flashT -= dt; m.atkCd -= dt; m.attackAnim = Math.max(0, m.attackAnim - dt * 3);
  if ((m.tgtT -= dt) <= 0 || !m.tgt || !m.tgt.alive) {
    m.tgtT = 0.4; m.tgt = lanesNearest(m.x, m.z, m.team, R.sight);
    if (!m.tgt) { let bd = R.sight + 4; for (const o of S.structs) if (o.alive && o.team !== m.team && !lanesShielded(o)) { const d = Math.hypot(o.x - m.x, o.z - m.z) - o.r; if (d < bd) { bd = d; m.tgt = o; } } }
  }
  const t = m.tgt, sp = M.speed * (m.slowT > 0 ? 0.55 : 1); m.slowT -= dt;
  let mx = 0, mz = -s; // march toward the enemy base
  if (t) {
    const dx = t.x - m.x, dz = t.z - m.z, d = Math.hypot(dx, dz), reach = M.range + (t.r || 0.5);
    m.facing = Math.atan2(dx, dz);
    if (d > reach) { mx = dx / d; mz = dz / d; }
    else { mx = mz = 0; if (m.atkCd <= 0) { m.atkCd = M.cd; m.attackAnim = 1; lanesMinionHit(m, t); } }
  } else { mx = (LC.x - m.x) * 0.15; m.facing = Math.atan2(mx, mz); } // drift back to the lane's middle
  const l = Math.hypot(mx, mz); if (l > 0.01) { m.x += mx / l * sp * dt; m.z += mz / l * sp * dt; }
  m.moveAmt = lerp(m.moveAmt, l > 0.01 ? 1 : 0, 1 - Math.exp(-dt * 8));
  lanesClamp(m);
}
function lanesMinionHit(m, t) {
  const R = CFG.lanes, dmg = t.kind === 'structure' ? G.lanes.ref.dmg * R.structDmg : m.dmg;
  if (m.mk === 'ranged') { const a = Math.atan2(t.x - m.x, t.z - m.z), sp = 16, d = Math.hypot(t.x - m.x, t.z - m.z); spawnProjectile({ x: m.x, z: m.z, vx: Math.sin(a) * sp, vz: Math.cos(a) * sp, life: (d + 1) / sp, r: 0.3, dmg, team: m.team, owner: m.id, kind: 'orb', color: m.team === 'blue' ? 0x7fd8ff : 0xff8a6a, y: 1.1 }); }
  else dealDamage(t, dmg, m.id, { knock: 0 });
}
function lanesStepTower(s, dt) {
  const R = CFG.lanes, T = R.tower;
  s.atkCd -= dt; s.aggroT -= dt;
  let t = s.aggro && s.aggro.alive && s.aggroT > 0 && Math.hypot(s.aggro.x - s.x, s.aggro.z - s.z) < T.range ? s.aggro : null;
  if (!t) { if (s.tgt && s.tgt.alive && Math.hypot(s.tgt.x - s.x, s.tgt.z - s.z) < T.range + (s.tgt.r || 0.5)) t = s.tgt; else t = lanesNearest(s.x, s.z, s.team, T.range); }
  s.tgt = t;
  if (!t || s.atkCd > 0) return;
  s.atkCd = T.cd;
  const a = Math.atan2(t.x - s.x, t.z - s.z), sp = 20, d = Math.hypot(t.x - s.x, t.z - s.z);
  const dmg = t.kind === 'minion' ? t.maxHp * T.minionDmg : G.lanes.ref.hp * T.dmg;
  spawnProjectile({ x: s.x + Math.sin(a) * 1.2, z: s.z + Math.cos(a) * 1.2, vx: Math.sin(a) * sp, vz: Math.cos(a) * sp, life: (d + 2) / sp, r: 0.45, dmg, team: s.team, owner: s.id, kind: 'orb', homing: 9, color: s.team === 'blue' ? 0x9fe8ff : 0xffa070, y: 3.4 });
  ev({ t: 'lanesTowerShot', x: s.x, z: s.z, team: s.team });
}
function lanesStepCamp(c, dt) {
  const C = CFG.lanes.camp;
  if (!c.alive) { if ((c.respawnT -= dt) <= 0) { c.alive = true; c.hp = c.maxHp; c.x = c.hx; c.z = c.hz; c.tgt = null; c.state = 'idle'; ev({ t: 'spawn', x: c.x, z: c.z, elite: true }); } return; }
  c.flashT -= dt; c.atkCd -= dt; c.attackAnim = Math.max(0, (c.attackAnim || 0) - dt * 2);
  const t = c.tgt && c.tgt.alive && Math.hypot(c.tgt.x - c.hx, c.tgt.z - c.hz) < C.leash + 4 ? c.tgt : null;
  if (!t) { c.tgt = null; const dx = c.hx - c.x, dz = c.hz - c.z, d = Math.hypot(dx, dz); if (d > 0.3) { c.x += dx / d * 5 * dt; c.z += dz / d * 5 * dt; c.facing = Math.atan2(dx, dz); c.moveAmt = 1; } else { c.moveAmt = 0; c.hp = Math.min(c.maxHp, c.hp + c.maxHp * 0.2 * dt); } return; }
  const dx = t.x - c.x, dz = t.z - c.z, d = Math.hypot(dx, dz); c.facing = Math.atan2(dx, dz);
  if (d > C.range + (t.r || 0.5)) { c.x += dx / d * 4.6 * dt; c.z += dz / d * 4.6 * dt; c.moveAmt = 1; }
  else { c.moveAmt = 0; if (c.atkCd <= 0) { c.atkCd = C.cd; c.attackAnim = 1; dealDamage(t, c.atk, c.id, { knock: 3, knockX: dx, knockZ: dz }); } }
}
function lanesClamp(f) {
  const hx = lanesHalfX() - (f.r || 0.5), hz = CFG.lanes.half.z - (f.r || 0.5);
  f.x = clamp(f.x, LC.x - hx, LC.x + hx); f.z = clamp(f.z, LC.z - hz, LC.z + hz);
}
// --- computer heroes: push with the wave, trade with heroes, stay out of enemy towers without minions, go home hurt
function lanesBotThink(b, dt) {
  const S = G.lanes, R = CFG.lanes, ai = b.ai, it = b.intent, s = lanesSide(b.team), w = weaponOf(b), range = (w.range || 10);
  it.mx = it.mz = 0; it.aiming = false;
  const home = lanesSpawnPoint(b.team, b.slot || 0);
  if (b.hp < b.maxHp * 0.3) ai.back = true;
  if (ai.back) { if (Math.hypot(b.x - home.x, b.z - home.z) < 2.5) { if (b.hp >= b.maxHp * 0.95) ai.back = false; } else { lanesMoveTo(b, home.x, home.z); } }
  // the front of our wave (or our outer tower when there is none)
  const ours = S.minions.filter((m) => m.alive && m.team === b.team);
  const front = ours.length ? ours.reduce((a, m) => (m.z * -s > a.z * -s ? m : a)) : null;
  const myTower = S.structs.filter((o) => o.alive && o.team === b.team && o.sk === 'tower').sort((a, c) => Math.abs(a.z - LC.z) - Math.abs(c.z - LC.z))[0];
  let goal = front ? { x: front.x + ai.side * 2, z: front.z + s * 2.5 } : myTower ? { x: myTower.x + ai.side * 3, z: myTower.z - s * 4 } : { x: home.x, z: home.z - s * 10 };
  // the jungler visits a camp that is up and not already being hit by the other team
  if (ai.role === 'jungle' && !ai.back) { const c = S.camps.filter((q) => q.alive).sort((a, q) => Math.hypot(a.x - b.x, a.z - b.z) - Math.hypot(q.x - b.x, q.z - b.z))[0]; if (c && S.t > 50 && b.hp > b.maxHp * 0.6) goal = { x: c.x, z: c.z, camp: c }; }
  // what to shoot: heroes in range when healthy, else minions, else a building our minions are at, else the camp
  let tgt = null, bd = range * 1.05;
  lanesTargets((t) => { if (!t.alive || t.team === b.team || t.team === 'neutral' || t.kind !== 'fighter') return; const d = Math.hypot(t.x - b.x, t.z - b.z); if (d < bd && ((b.hp > b.maxHp * 0.45 && d < range * 0.7) || t.hp < t.maxHp * 0.35 || d < range * 0.4)) { bd = d; tgt = t; } });
  if (!tgt) { bd = range; for (const m of S.minions) if (m.alive && m.team !== b.team) { const d = Math.hypot(m.x - b.x, m.z - b.z); if (d < bd) { bd = d; tgt = m; } } }
  if (!tgt) for (const o of S.structs) if (o.alive && o.team !== b.team && !lanesShielded(o) && Math.hypot(o.x - b.x, o.z - b.z) < range + o.r && ours.some((m) => Math.hypot(m.x - o.x, m.z - o.z) < R.tower.range)) { tgt = o; break; }
  if (!tgt && goal.camp && Math.hypot(goal.camp.x - b.x, goal.camp.z - b.z) < range) tgt = goal.camp;
  // never stand in an enemy tower's reach without our minions taking its shots
  const danger = S.structs.find((o) => o.alive && o.sk === 'tower' && o.team !== b.team && Math.hypot(o.x - b.x, o.z - b.z) < R.tower.range + 1.5 && !ours.some((m) => Math.hypot(m.x - o.x, m.z - o.z) < R.tower.range));
  if (!ai.back) {
    if (tgt) {
      const d = Math.hypot(tgt.x - b.x, tgt.z - b.z) || 1, keep = range * 0.75;
      if ((ai.sideT -= dt) <= 0) { ai.sideT = rand(0.8, 2); ai.side = -ai.side; }
      const ux = (tgt.x - b.x) / d, uz = (tgt.z - b.z) / d, rad = d > keep + 1 ? 1 : d < keep - 1.5 ? -1 : 0;
      it.mx = ux * rad - uz * ai.side * 0.6; it.mz = uz * rad + ux * ai.side * 0.6;
      if ((ai.fireT -= dt) <= 0 && d < range * 1.02) { const err = rand(-0.08, 0.08), a = Math.atan2(ux, uz) + err; it.ax = Math.sin(a); it.az = Math.cos(a); it.aiming = true; it.fire = true; it.aimDist = clamp(d / range, 0.2, 1); ai.fireT = rand(0.15, 0.45); }
      if (b.superCharge >= 1 && d < range * 0.8 && (tgt.kind === 'fighter' || tgt.kind === 'structure')) it.super = true;
    } else lanesMoveTo(b, goal.x, goal.z);
    if (danger) { const dx = b.x - danger.x, dz = b.z - danger.z, d = Math.hypot(dx, dz) || 1; it.mx = dx / d; it.mz = dz / d; }
  }
  // dodge: dash out of an enemy hero's shot coming straight at it
  if (b.dashCd <= 0 && Math.random() < dt * 4) for (let i = 0; i < PROJ_MAX; i++) { const p = projectiles[i]; if (!p.active || p.team === b.team || p.ghost) continue; const rx = b.x - p.x, rz = b.z - p.z, dd = Math.hypot(rx, rz); if (dd > 4) continue; const sp = Math.hypot(p.vx, p.vz) || 1; if ((rx * p.vx + rz * p.vz) / (dd * sp) > 0.92) { it.dash = true; it.mx = -p.vz / sp * ai.side; it.mz = p.vx / sp * ai.side; break; } }
  ai.stuck += dt; if (ai.stuck > 1) { if (Math.hypot(b.x - ai.lx, b.z - ai.lz) < 0.4) ai.side = -ai.side; ai.stuck = 0; ai.lx = b.x; ai.lz = b.z; }
}
function lanesMoveTo(b, x, z) { const dx = x - b.x, dz = z - b.z, d = Math.hypot(dx, dz); if (d > 1) { b.intent.mx = dx / d; b.intent.mz = dz / d; } }
// a guest draws the host's bots where it says they are (76-lanes-mp.js fills sx/sz)
function lanesMirrorBot(b, dt) {
  if (b.sx == null) return; const k = 1 - Math.exp(-dt * 10);
  b.x += (b.sx - b.x) * k; b.z += (b.sz - b.z) * k; if (b.sf != null) b.facing += angDiff(b.facing, b.sf) * k;
  b.attackAnim = Math.max(0, (b.attackAnim || 0) - dt * 3); trackVel(b, dt);
}
function lanesEnd(winner, why) {
  const S = G.lanes; if (!S || S.result) return;
  if (typeof lanesMpEnd === 'function') lanesMpEnd(winner, why);
  lanesFinish(winner, why);
}
// pay this player for the match (each game pays its own): rank points, gold, a chest earned in play, mastery
function lanesFinish(winner, why) {
  const S = G.lanes, R = CFG.lanes, p = G.profile; if (!S || S.result) return;
  const win = winner === S.myTeam, rec = lanesRec(), humansVs = S.peers.some((h) => h.team !== S.myTeam);
  const k = humansVs ? 1 : R.rp.bot, rp0 = rec.rp;
  rec.rp = Math.max(0, Math.round(rec.rp + (win ? R.rp.win : R.rp.loss) * k)); rec.best = Math.max(rec.best || 0, rec.rp); rec.n++; if (win) rec.w++; else rec.l++;
  const gold = Math.round((win ? 60 : 25) * (1 + S.t / 300) * Math.pow(CFG.enemies.goldGrowth, Math.min(S.L, p.level) - 1)); addGold(gold, true);
  const chest = win ? R.chest.win : S.t > 120 ? R.chest.loss : null; if (chest && typeof addCase === 'function') addCase(chest, { src: 'lanes' });
  addMastery('w:' + G.player.attackId, 20 + Math.round(S.t / 15));
  S.result = { win, why, rp: rec.rp - rp0, rank: lanesRank(rec.rp), rpTotal: rec.rp, gold, chest, t: S.t, kills: S.stats.kills, deaths: S.stats.deaths, structs: S.stats.structs, minions: S.stats.minions, score: { blue: S.kills.blue, red: S.kills.red }, size: S.size };
  S.phase = 'over'; S.overT = 2.6; checkAchievements(); G.dirty = true;
  ev({ t: 'lanesEnd', win, why });
}
function leaveLanes() {
  const S = G.lanes; if (!S) return;
  if (typeof lanesMpLeave === 'function') lanesMpLeave();
  for (const o of S.structs.concat(S.minions, S.camps, S.bots)) G.ents.delete(o.id);
  clearProjectiles();
  const pl = G.player; G.lanes = null; G.mode = 'hub'; G.obstacles = G.hubObstacles;
  pl.team = 'ally'; pl.x = S.back.x; pl.z = S.back.z; pl.alive = true; pl.intent = newIntent(); refreshPlayerStats(true); pl.invulnT = 1.5;
  G.lastCombat = -99;
  ev({ t: 'lanesLeave', x: pl.x, z: pl.z });
}
// --- end Lanes
