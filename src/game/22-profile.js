// ---------------------------------------------------------------------
// 4. PROFILE (save data — convenience only, game works with empty save)
// ---------------------------------------------------------------------
const SAVE_KEY = profileSaveKey(TEST_MODE);
function defaultProfile() {
  const gear = {};
  for (const s of CFG.gear.slots) gear[s] = makeItem(s, 'common', 1, 'Worn ' + ITEM_NAMES[s][0]);
  const prof = {
    v: 2, level: 1, xp: 0, prestige: 0, gold: 0, trophies: 0, bestTrophies: 0, cls: 'bolt', starterBrawler: 'bolt', mergeVersion: 1, artVersion: 1, gear, bag: [],
    treeVersion: 9, brawlers: { bolt: newBrawlerState() }, collection: {}, collectionLuck: {}, pets: {}, activePet: null,
    ach: {}, stats: { kills: 0, slimes: 0, jobs: 0, upgrades: 0, bosses: 0, matches: 0, wins: 0, zone: 0, shrines: 0, pellets: 0, elites: 0, bestStreak: 0 },
    artifacts: [], unlocked: { attacks: [], artifacts: [] }, newUnlocks: [],
    essence: 0, luck: { rare: 0, epic: 0, legendary: 0, mythic: 0, ancient: 0, divine: 0 }, cases: [], caseLuck: { legendary: 0, mythic: 0 }, vault: { t: Date.now(), lv: 0 }, exp: [], mastery: {}, waypoints: [0], worldVersion: 9, road: 0, artStars: {}, shards: {}, gemBuys: 0, records: {}, worldTier: 0,
    job: null, jobCycle: {}, tut: 0, settings: { mute: false, fps: false, fastXp: false, testSeen: true, calm: false, map: true, autoSalvage: 0, hq: true, pixel: false, bots: false, npcs: false, autoHunt: false },
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
  if (!p.artVersion) { out.settings.pixel = false; out.artVersion = 1; }
  if (!(p.settings && p.settings.testSeen)) { out.settings.fastXp = false; out.settings.testSeen = true; } // new players start in normal mode; Test mode stays a switch in Settings
  if (!LOCAL_PREVIEW) out.settings.fastXp = false;
  out.level = clamp(out.level | 0, 1, CFG.progression.cap);
  if (!CFG.brawlers[out.cls]) out.cls = 'bolt';
  out.starterBrawler = CFG.brawlers[p.starterBrawler] ? p.starterBrawler : out.cls;
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
  if (CFG.world && CFG.world.waypoints) out.waypoints = out.waypoints.filter((i) => Number.isInteger(i) && i >= 0 && i < CFG.world.waypoints.length);
  out.essence = Math.max(0, out.essence | 0);
  if (!out.artStars || typeof out.artStars !== 'object') out.artStars = {};
  if (!out.shards || typeof out.shards !== 'object') out.shards = {};
  if (!out.records || typeof out.records !== 'object') out.records = {};
  out.gemBuys = +out.gemBuys || 0;
  if (TEST_MODE) { out.playtest = TEST_PROFILE_TAG; out.settings.fastXp = false; }
  return out;
}
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
