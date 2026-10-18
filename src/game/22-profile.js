// ---------------------------------------------------------------------
// 4. PROFILE (save data — convenience only, game works with empty save)
// ---------------------------------------------------------------------
const SAVE_KEY = profileSaveKey(TEST_MODE);
function defaultProfile() {
  const gear = {};
  for (const s of CFG.gear.slots) gear[s] = makeItem(s, 'common', 1, 'Worn ' + ITEM_NAMES[s][0]);
  const prof = {
    v: 2, level: 1, xp: 0, prestige: 0, gold: 0, trophies: 0, bestTrophies: 0, cls: STARTER_HERO, starterBrawler: STARTER_HERO, mergeVersion: 1, artVersion: 1, hzVersion: 2, gear, bag: [],
    treeVersion: 9, brawlers: { bolt: newBrawlerState() }, collection: {}, collectionLuck: {}, pets: {}, activePet: null,
    ach: {}, stats: { kills: 0, slimes: 0, jobs: 0, upgrades: 0, bosses: 0, matches: 0, wins: 0, zone: 0, shrines: 0, pellets: 0, elites: 0, bestStreak: 0 },
    artifacts: [], unlocked: { attacks: [], artifacts: [] }, newUnlocks: [],
    essence: 0, luck: { rare: 0, epic: 0, legendary: 0, mythic: 0, ancient: 0, divine: 0 }, cases: [], caseLuck: { legendary: 0, mythic: 0 }, vault: { t: Date.now(), lv: 0 }, exp: [], mastery: {}, waypoints: [0], worldVersion: 10, road: 0, artStars: {}, shards: {}, gemBuys: 0, records: {}, worldTier: 0, secrets: {}, pois: {}, dungeons: {}, keys: [], runes: {}, trials: {}, mine: { ore: 0, pick: 0, mined: 0, museum: {} }, petFinds: {}, login: { n: 0, last: -1 }, weekly: { wk: 0, done: false },
    job: null, jobCycle: {}, tut: 0, settings: { mute: false, fps: false, fastXp: false, testSeen: true, calm: false, map: true, autoSalvage: 0, hq: true, fx: true, pixel: false, bots: false, npcs: true, autoHunt: false, uiSize: 0, fps60: false, volMaster: 80, volMusic: 60, volSfx: 80, volUi: 70 },
  };
  prof.artifacts = prof.brawlers.bolt.artifacts;
  if (TEST_MODE) prof.playtest = TEST_PROFILE_TAG;
  return prof;
}
function newTreeState() { return { active: 0, sets: [{}, {}, {}] }; }
function newBrawlerState() { return { tree: newTreeState(), artifacts: [] }; }
function sanitizeProfile(p) {
  const d = defaultProfile();
  if (!p || typeof p !== 'object' || (p.v !== 1 && p.v !== 2)) return d;
  if (!TEST_MODE && isTestProfile(p)) return d;
  // v1 → v2 (v8 "Endless Ascension"): class becomes a brawler, skill points refunded into the new trees
  if (p.v === 1) {
    p = Object.assign({}, p);
    const map = { warrior: 'wave', ranger: 'arrow', mage: 'orb', novice: 'bolt' };
    p.cls = map[p.cls] || 'bolt';
    p.unlocked = p.unlocked || { attacks: [], artifacts: [] };
    if (p.cls !== 'bolt' && !(p.unlocked.attacks || []).includes(p.cls)) p.unlocked.attacks = (p.unlocked.attacks || []).concat([p.cls]);
    p.brawlers = {}; p.brawlers[p.cls] = { tree: newTreeState(), artifacts: Array.isArray(p.artifacts) ? p.artifacts.slice() : [] };
    p.heroTree = newTreeState(); delete p.tree; delete p.keys; delete p.attack;
    p.v = 2; p.migratedV8 = true;
  }
  const out = Object.assign({}, d, p);
  out.gear = Object.assign({}, d.gear, p.gear && typeof p.gear === 'object' ? p.gear : {});
  out.stats = Object.assign(defaultProfile().stats, p.stats || {});
  out.settings = Object.assign(defaultProfile().settings, p.settings || {});
  for (const k of ['volMaster', 'volMusic', 'volSfx', 'volUi']) { const v = +out.settings[k]; out.settings[k] = Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : defaultProfile().settings[k]; }
  if (!p.artVersion) { out.settings.pixel = false; out.artVersion = 1; }
  if (!(p.settings && p.settings.testSeen)) { out.settings.fastXp = false; out.settings.testSeen = true; } // new players start in normal mode; Test mode stays a switch in Settings
  if (!LOCAL_PREVIEW) out.settings.fastXp = false;
  out.level = clamp(out.level | 0, 1, CFG.progression.cap);
  // retired adventurers (bolt, smg, ... starfall) hand over to the starter hero, keeping the first hero's mastery so switching stays open
  const oldFirst = p.starterBrawler || 'bolt';
  if (!CFG.brawlerOrder.includes(out.cls)) out.cls = STARTER_HERO;
  out.starterBrawler = CFG.brawlerOrder.includes(p.starterBrawler) ? p.starterBrawler : out.cls;
  if (out.starterBrawler !== oldFirst && out.mastery && out.mastery['w:' + oldFirst]) out.mastery = Object.assign({}, out.mastery, { ['w:' + out.starterBrawler]: Math.max(out.mastery['w:' + out.starterBrawler] || 0, out.mastery['w:' + oldFirst]) });
  if (!p.npcVersion) { out.settings.npcs = true; out.npcVersion = 1; } // townsfolk are 3D models now: show them once for every save (still a switch in Options)
  // 120 Hz is the standard; the Options switch is now "60 FPS". A player who turned 120 Hz off after it became the default keeps 60
  if ((p.hzVersion | 0) < 2) { out.settings.fps60 = !!(p.hzVersion && p.settings && p.settings.hz120 === false); out.hzVersion = 2; }
  delete out.settings.hz120;
  if (!p.mergeVersion) { out.settings.autoSalvage = 0; out.mergeVersion = 1; }
  if (!out.brawlers || typeof out.brawlers !== 'object') out.brawlers = {};
  if (!out.brawlers[out.cls]) out.brawlers[out.cls] = newBrawlerState();
  for (const k in out.brawlers) { if (!CFG.brawlers[k] || !out.brawlers[k] || typeof out.brawlers[k] !== 'object') { delete out.brawlers[k]; continue; } const b = out.brawlers[k]; if (!b.tree || !Array.isArray(b.tree.sets)) b.tree = newTreeState(); if (!Array.isArray(b.artifacts)) b.artifacts = []; }
  if (!out.brawlers[out.cls]) out.brawlers[out.cls] = newBrawlerState();
  if ((p.treeVersion | 0) < 9) {
    // v9: the shared Hero tree is gone. Its spent nodes are copied into every hero's own tree (same node ids),
    // so each hero keeps the build it had; points now come from level + that hero's mastery.
    const H = out.heroTree && Array.isArray(out.heroTree.sets) ? out.heroTree : null;
    if (H) for (const k in out.brawlers) { const st = out.brawlers[k].tree; for (let i = 0; i < st.sets.length; i++) { const hs = H.sets[i] || {}, bs = st.sets[i] || (st.sets[i] = {}); for (const id in hs) if (hs[id] > 0) bs[id] = (bs[id] || 0) + hs[id]; } }
    out.treeVersion = 9;
  }
  delete out.heroTree;
  // Explicit null is an intentionally unequipped slot; missing legacy slots retain starter gear.
  for (const s of CFG.gear.slots) if (out.gear[s] === undefined) out.gear[s] = d.gear[s];
  if (!Array.isArray(out.bag)) out.bag = [];
  const ownedIds = new Set(Object.values(out.gear).filter(Boolean).map(it => it.id));
  out.bag = out.bag.filter(it => { if (!it || !it.id || ownedIds.has(it.id)) return false; ownedIds.add(it.id); return true; });
  migrateCollection(out);
  migratePrestige(out);
  migratePets(out);
  if (!out.unlocked || !Array.isArray(out.unlocked.attacks)) out.unlocked = { attacks: [], artifacts: [] };
  out.artifacts = out.brawlers[out.cls].artifacts; // the active brawler's loadout
  if (!Array.isArray(out.newUnlocks)) out.newUnlocks = [];
  out.luck = Object.assign({ rare: 0, epic: 0, legendary: 0, mythic: 0, ancient: 0, divine: 0 }, p.luck || {});
  if (!out.mastery || typeof out.mastery !== 'object') out.mastery = {};
  if (!Array.isArray(out.cases)) out.cases = [];
  if (!Array.isArray(out.exp)) out.exp = [];
  if (!out.vault || typeof out.vault !== 'object' || !out.vault.t) out.vault = { t: Date.now(), lv: (out.vault && out.vault.lv) || 0 };
  if (!out.caseLuck) out.caseLuck = { legendary: 0, mythic: 0 };

  if (!Array.isArray(out.waypoints)) out.waypoints = [0];
  if ((p.worldVersion | 0) < 9) {
    // v9 map: the old seven zones became 29 areas. Gates you can already enter are open as waypoints.
    const Z = (CFG.world && CFG.world.zones) || [], open = Z.map((zn, i) => i).filter((i) => i > 0 && out.level >= Z[i].minLevel);
    if (p.worldVersion == null && p.savedAt) { out.waypoints = [0].concat(open); out.stats.zone = open.length ? open[open.length - 1] : 0; }
    const JOB = { slime: 'thistlehare', boar: 'hornet', wolf: 'truffleboar', spider: 'myconid', imp: 'craggoat', yeti: 'dustharpy', beetle: 'sulfurslime', fireimp: 'magmahound', wraith: 'manaleech', sentinel: 'geodrone', crawler: 'leviathan', drowned: 'abyssphantom', seraph: 'archon', warden: 'cosmicweaver' };
    if (out.job && out.job.type === 'kill' && JOB[out.job.target]) out.job = Object.assign({}, out.job, { target: JOB[out.job.target] });
    out.worldVersion = 9;
  }
  if ((out.worldVersion | 0) < 10) {
    // v10: same 30 areas in the same order (waypoint/zone indices stay valid), just wider; adds secrets, POIs and dungeons
    out.worldVersion = 10;
  }
  for (const k of ['secrets', 'pois', 'dungeons', 'runes', 'trials', 'petFinds']) if (!out[k] || typeof out[k] !== 'object' || Array.isArray(out[k])) out[k] = {};
  // party dungeons: clears and best difficulty per dungeon, this week's first clears, set pieces found
  { const o = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {}), d = o(out.delve);
    out.delve = { clears: o(d.clears), best: o(d.best), wk: { w: +o(d.wk).w || 0, done: o(o(d.wk).done) }, pieces: o(d.pieces) }; }
  // Dungeon Keys (CFG.dungeon loads later; the cap of 12 matches CFG.dungeon.keys.max)
  out.keys = (Array.isArray(out.keys) ? out.keys : []).filter((k) => k && k.t >= 1 && Array.isArray(k.a)).slice(0, 12)
    .map((k) => ({ t: Math.min(9999, k.t | 0), a: k.a.filter((a) => !CFG.dungeon || CFG.dungeon.keys.affixes[a]).slice(0, 3) }));
  // the wave a fort restarts on: before it was saved, one past the best wave ever held
  { const had = out.fort && out.fort.wave; out.fort = sanitizeFort(out.fort, true); if (!had) out.fort.wave = Math.max(1, ((out.records && out.records.bestSiege) | 0) + 1); }
  if (CFG.world && CFG.world.waypoints) out.waypoints = out.waypoints.filter((i) => Number.isInteger(i) && i >= 0 && i < CFG.world.waypoints.length);
  { const m = out.mine && typeof out.mine === 'object' ? out.mine : {}; out.mine = { ore: Math.max(0, +m.ore || 0), pick: Math.max(0, Math.min(20, m.pick | 0)), mined: Math.max(0, m.mined | 0), museum: m.museum && typeof m.museum === 'object' && !Array.isArray(m.museum) ? m.museum : {} }; }
  { const c = out.craft && typeof out.craft === 'object' && !Array.isArray(out.craft) ? out.craft : {}, obj = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o : {}), num = (o) => { const r = {}; for (const k in obj(o)) { const v = +o[k]; if (v > 0 && isFinite(v)) r[k] = Math.floor(v); } return r; };
    out.craft = { mats: num(c.mats), upg: num(c.upg), sig: num(c.sig), pity: num(c.pity), relics: num(c.relics) }; }
  out.login = { n: Math.max(0, (out.login && out.login.n) | 0), last: out.login && Number.isInteger(out.login.last) ? out.login.last : -1 };
  out.weekly = { wk: (out.weekly && out.weekly.wk) | 0, done: !!(out.weekly && out.weekly.done) };
  out.essence = Math.max(0, out.essence | 0);
  if (!out.artStars || typeof out.artStars !== 'object') out.artStars = {};
  if (!out.shards || typeof out.shards !== 'object') out.shards = {};
  if (!out.records || typeof out.records !== 'object') out.records = {};
  out.gemBuys = +out.gemBuys || 0;
  if (TEST_MODE) { out.playtest = TEST_PROFILE_TAG; out.settings.fastXp = false; }
  return out;
}
// Bastion fort: { wave, land, b: buildings, keep, kd, go, hold }, plus what only this player owns (wood, stones, iron, code
// of their world, recent worlds). keep: the Keep's level (kd = when its upgrade finishes), go: the waves run by themselves,
// hold: paused, area: plots of land bought. A building is { t, x, z, l } on 2 m cells (x, z = its lowest corner around the Keep); d = when an upgrade
// finishes (ms), c = when a mill or mine was last emptied, p = the path a tower took at level 5 (1 or 2). Old saves had eight fixed pads: each defender moves to the cell under its pad.
// (CFG.siege loads later; the lists here match it.) Shared worlds from the server go through here too (mine = false).
const FORT_TYPES = { archer: 2, cannon: 2, ballista: 2, warrior: 2, mage: 2, mine: 2, hut: 2, wall: 1, gate: 1, spike: 1, bomb: 1, tar: 1, mill: 2, iron: 2 };
const FORT_OLD_PADS = [[-5, 13], [5, 13], [-13, 6], [13, 6], [-13, -5], [13, -5], [-5, -8], [5, -8]];
function sanitizeFort(f, mine) {
  f = f && typeof f === 'object' && !Array.isArray(f) ? f : {};
  const int = (v, a, b) => Math.max(a, Math.min(b, Math.floor(+v || 0)));
  let b = Array.isArray(f.b) ? f.b : [];
  if (!Array.isArray(f.b)) { // first load since the grid: pads become buildings, and every fort gets its first builder hut
    if (Array.isArray(f.pads)) f.pads.forEach((q, i) => { if (q && FORT_TYPES[q.t] && q.l >= 1 && FORT_OLD_PADS[i]) b.push({ t: q.t, x: Math.round(FORT_OLD_PADS[i][0] / 2) - 1, z: Math.round(FORT_OLD_PADS[i][1] / 2) - 1, l: q.l }); });
    b.push({ t: 'hut', x: 4, z: -1, l: 1 });
  }
  const used = new Set(), out = [];
  for (const q of b.slice(0, 3000)) {
    if (!q || !FORT_TYPES[q.t]) continue;
    const n = { t: q.t, x: int(q.x, -125, 124), z: int(q.z, -125, 124), l: int(q.l, 1, 15) }, s = FORT_TYPES[q.t], cells = [];
    for (let i = 0; i < s; i++) for (let j = 0; j < s; j++) cells.push((n.x + i) * 1000 + n.z + j);
    if (cells.some((c) => used.has(c))) continue; // two buildings on one cell: the first one stays
    cells.forEach((c) => used.add(c));
    if (+q.d > 0) n.d = Math.floor(+q.d); if (q.t === 'mine' || q.t === 'mill' || q.t === 'iron') n.c = Math.max(0, Math.floor(+q.c || 0));
    if (q.p === 1 || q.p === 2) n.p = q.p; // the path a tower took at level 5
    out.push(n);
  }
  const r = { wave: int(f.wave, 1, 1e6), land: int(f.land, 0, 250), b: out };
  // the Keep's level: forts from before Keep levels get the lowest one that fits what they already built (nothing is lost)
  r.keep = f.keep != null ? int(f.keep, 1, 10) : fortKeepFor(out);
  if (+f.kd > 0) r.kd = Math.floor(+f.kd);
  if (f.go || r.wave > 1) r.go = 1; if (f.hold) r.hold = 1;
  // plots of land bought (Land Deeds); forts from before plots get the smallest area that holds what they built
  r.area = f.area != null ? int(f.area, 0, 8) : fortAreaNeed(out); // go: waves come by themselves; hold: paused by the player
  if (mine) {
    r.stones = int(f.stones, 0, 1e12); r.deeds = int(f.deeds, 0, 1e9);
    // wood and iron came with the camp's own resources; older forts start with a stock of wood (building used to cost gold)
    r.wood = f.wood != null ? int(f.wood, 0, 1e12) : 60 + out.reduce((n, q) => n + q.l * 4, 0); r.iron = int(f.iron, 0, 1e12);
    if (typeof f.code === 'string' && /^[A-Z0-9-]{4,12}$/.test(f.code)) r.code = f.code;
    r.recent = (Array.isArray(f.recent) ? f.recent : []).filter((c) => typeof c === 'string' && /^[A-Z0-9-]{4,12}$/.test(c)).slice(0, 5);
  }
  return r;
}
// how many plots a fort needs so that every building stands inside its build area
function fortAreaNeed(b) {
  const A = typeof CFG !== 'undefined' && CFG.siege && CFG.siege.area; if (!A) return 0;
  let ext = 0; for (const q of b) { const s = FORT_TYPES[q.t]; ext = Math.max(ext, -q.x, -q.z, q.x + s, q.z + s); }
  return Math.max(0, Math.min(A.deeds.length, Math.ceil((ext - A.base) / A.step)));
}
// the lowest Keep level whose limits hold every building of a fort (old forts, before the Keep had levels)
function fortKeepFor(b) {
  const T = typeof CFG !== 'undefined' && CFG.siege && CFG.siege.towers; if (!T) return 1;
  const n = {}; let top = 1; for (const q of b) { n[q.t] = (n[q.t] || 0) + 1; if (q.t !== 'hut') top = Math.max(top, q.l); }
  for (let k = 1; k <= 10; k++) if (CFG.siege.keep.lvl[k - 1] >= top && Object.keys(n).every((t) => !T[t] || !T[t].lim || T[t].lim[k - 1] >= n[t])) return k;
  return 10;
}
// --- end Bastion fort save
const Store = {
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return sanitizeProfile(JSON.parse(raw));
      if (TEST_MODE) {
        const normal = localStorage.getItem(profileSaveKey(false));
        return prepareTestProfile(normal ? sanitizeProfile(JSON.parse(normal)) : defaultProfile());
      }
      return null;
    } catch (e) { return null; }
  },
  save(p) { if (!TEST_MODE && isTestProfile(p)) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); return true; } catch (e) { return false; } },
  clear() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } },
};
