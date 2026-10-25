// --- Kingdom (Bart, 25 Oct 2026): the Bank grew into a kingdom you build. The Treasury is the old Bank (its level,
// storage hours and payout carry over); around it you buy buildings that fill the Treasury while you play and while
// you are away: gold makers (Market Stall, Tavern, Trade Guild, Royal Mint) and material makers (Mine, Hunter's
// Lodge, Gem Cutter, Rune Workshop). Every copy of a building costs more than the last; owning 25, 50, 100 … doubles
// its output. Cottages house villagers; a villager working in a building adds to its output (one per copy, ten at most).
// Everything is measured in the Bank's own gold unit at your level, so leveling up never makes a building worthless
// and gold never runs away from the Forge's prices. Collect pays the Treasury and every building together.
CFG.kingdom = {
  // tuned with a reinvest-everything simulation (25 Oct): with play earning ~12 units a minute the kingdom reaches about
  // 2× that after a day and ~7× after 150 hours, so it adds up without making Forge prices meaningless (the first
  // tuning, 1.15 growth and doublings every hundred, ran to 100×+ play income within days)
  grow: 1.4, // each copy costs this much more than the last (cottages: their own `grow`)
  milestones: [25, 50, 100], milestoneMult: 2, // owning this many doubles that building's output
  villager: 0.05, maxWorkers: 10, // each villager working in a building: +5% of its output; one per copy, ten at most
  founders: 2, // villagers you start with
  // kind gold: `out` = gold units per minute per copy (a unit = one minute of the Bank's base gold at your level);
  // ore/part: per hour per copy, of your newest biome's material (more in later biomes); gems, rune: per hour per copy;
  // home: villagers per cottage. `cost` = hours of gold units for the first copy. `at` = player level it opens.
  buildings: [
    { id: 'market', name: 'Market Stall', icon: 'e_market', at: 8, kind: 'gold', out: 0.2, cost: 0.1 },
    { id: 'cottage', name: 'Cottage', icon: 'e_cottage', at: 8, kind: 'home', out: 2, cost: 0.2, grow: 1.3 },
    { id: 'mine', name: 'Mine', icon: 'e_mine', at: 12, kind: 'ore', out: 4, cost: 0.6 },
    { id: 'tavern', name: 'Tavern', icon: 'e_tavern', at: 18, kind: 'gold', out: 0.8, cost: 3 },
    { id: 'lodge', name: "Hunter's Lodge", icon: 'e_lodge', at: 25, kind: 'part', out: 1.5, cost: 2.5 },
    { id: 'gems', name: 'Gem Cutter', icon: 'e_gems', at: 35, kind: 'gems', out: 0.8, cost: 5 },
    { id: 'guild', name: 'Trade Guild', icon: 'e_guild', at: 45, kind: 'gold', out: 3, cost: 40 },
    { id: 'runes', name: 'Rune Workshop', icon: 'e_runes', at: 60, kind: 'rune', out: 0.25, cost: 40 },
    { id: 'mint', name: 'Royal Mint', icon: 'e_mint', at: 80, kind: 'gold', out: 10, cost: 600 },
  ],
  matBiome: 1.25, // ore and parts per copy grow by this per biome reached
};
const KB = CFG.kingdom;
const kDef = (id) => KB.buildings.find((b) => b.id === id);
// the kingdom part of the save: b = copies owned, w = villagers working there, acc = made but not collected yet,
// at = when acc was last brought up to date
function kingdomState(p) {
  p = p || G.profile; const k = p.kingdom && typeof p.kingdom === 'object' ? p.kingdom : (p.kingdom = {});
  for (const f of ['b', 'w', 'acc']) if (!k[f] || typeof k[f] !== 'object' || Array.isArray(k[f])) k[f] = {};
  if (!k.acc.mats || typeof k.acc.mats !== 'object') k.acc.mats = {};
  if (!(k.at > 0)) k.at = (p.vault && p.vault.t) || Date.now();
  return k;
}
const kOwned = (id, p) => kingdomState(p).b[id] | 0;
const kCap = (id, p) => Math.min(kOwned(id, p), KB.maxWorkers);
const kWorkers = (id, p) => Math.min(kingdomState(p).w[id] | 0, kCap(id, p));
const kOpen = (d, p) => (p || G.profile).level >= d.at;
function kVillagers(p) { const total = KB.founders + kOwned('cottage', p) * kDef('cottage').out; let busy = 0; for (const d of KB.buildings) if (d.kind !== 'home') busy += kWorkers(d.id, p); return { total, busy, free: Math.max(0, total - busy) }; }
// one gold unit per minute: the Bank's base gold at your level (its Treasury bonus is applied on top, to everything)
const kUnit = (p) => vaultRates(p).gold / (1 + 0.12 * vaultLv(p));
function kMilestones(n) { let m = 0; for (const t of KB.milestones) if (n >= t) m++; return m; }
const kNextMilestone = (n) => KB.milestones.find((t) => t > n) || null;
// a building's output multiplier: copies × milestone doublings × its villagers
function kMult(id, p) { const n = kOwned(id, p); return n * Math.pow(KB.milestoneMult, kMilestones(n)) * (1 + KB.villager * kWorkers(id, p)); }
// what the whole kingdom makes per minute (gold, gems, rune shards and materials), Treasury bonus included
function kingdomRates(p) {
  p = p || G.profile; const tb = 1 + 0.12 * vaultLv(p), unit = kUnit(p) * tb, out = { gold: 0, gems: 0, rune: 0, mats: {} };
  const bi = typeof zoneBiome === 'function' ? zoneBiome(highestZone(p.level)) : 0, b = typeof CB !== 'undefined' ? CB[bi] : null, mb = Math.pow(KB.matBiome, bi), L = p.level;
  for (const d of KB.buildings) {
    if (d.kind === 'home') continue; const m = kMult(d.id, p); if (!m) continue;
    if (d.kind === 'gold') out.gold += d.out * m * unit;
    else if (d.kind === 'gems') out.gems += d.out * m * (1 + L / 100) * tb / 60;
    else if (d.kind === 'rune') out.rune += d.out * m * tb / 60;
    else if (b) { const id = d.kind === 'ore' ? b.ore : b.part; out.mats[id] = (out.mats[id] || 0) + d.out * m * mb * tb / 60; }
  }
  return out;
}
// bring the not-yet-collected pile up to now. It grows only inside the Treasury's storage window (since the last
// collect, up to its storage hours), the same window the old Bank fills in
function kingdomSettle(now, p) {
  p = p || G.profile; const k = kingdomState(p), t0 = (p.vault && p.vault.t) || now, end = Math.min(now, t0 + vaultCapH(p) * 3600000), from = Math.max(k.at, t0);
  const mins = Math.max(0, (end - from) / 60000);
  if (mins > 0) { const R = kingdomRates(p); k.acc.gold = (k.acc.gold || 0) + R.gold * mins; k.acc.gems = (k.acc.gems || 0) + R.gems * mins; k.acc.rune = (k.acc.rune || 0) + R.rune * mins;
    for (const id in R.mats) k.acc.mats[id] = (k.acc.mats[id] || 0) + R.mats[id] * mins; }
  k.at = Math.max(k.at, now); return k.acc;
}
// what Collect would pay from the buildings right now (without changing the save)
function kingdomPending(now, p) {
  p = p || G.profile; const k = kingdomState(p), acc = JSON.parse(JSON.stringify(k.acc)), keep = k.at; kingdomSettle(now, p);
  const out = { gold: Math.floor(k.acc.gold || 0), gems: Math.floor(k.acc.gems || 0), rune: Math.floor(k.acc.rune || 0), mats: Object.entries(k.acc.mats).map(([id, n]) => [id, Math.floor(n)]).filter(([, n]) => n > 0) };
  k.acc = acc; k.at = keep; return out;
}
// pay out the buildings' pile (called by collectVault); fractions stay for next time
function kingdomCollect(now) {
  const p = G.profile, k = kingdomState(p); kingdomSettle(now, p);
  const out = { gold: Math.floor(k.acc.gold || 0), gems: Math.floor(k.acc.gems || 0), rune: Math.floor(k.acc.rune || 0), mats: [] };
  if (out.gold) addGold(out.gold, true); if (out.gems) addEssence(out.gems);
  const mats = []; for (const id in k.acc.mats) { const n = Math.floor(k.acc.mats[id]); if (n > 0) { mats.push([id, n]); k.acc.mats[id] -= n; } }
  if (out.rune && typeof CFG.craft !== 'undefined') mats.push([CFG.craft.rune.id, out.rune]);
  if (mats.length && typeof addMats === 'function') out.mats = addMats(mats, true);
  k.acc.gold -= out.gold; k.acc.gems -= out.gems; k.acc.rune -= out.rune; k.at = now; G.dirty = true; return out;
}
// the price of the next `n` copies (a geometric run), in gold
function kCost(id, n, p) {
  p = p || G.profile; const d = kDef(id), g = d.grow || KB.grow, have = kOwned(id, p), first = kUnit(p) * 60 * d.cost * Math.pow(g, have);
  return Math.round(first * (Math.pow(g, n) - 1) / (g - 1));
}
// how many copies the gold you carry buys (capped at `cap`)
function kAffordable(id, p, cap = 1000) { p = p || G.profile; let n = 0; while (n < cap && kCost(id, n + 1, p) <= p.gold) n++; return n; }
function buyBuilding(id, n) {
  const p = G.profile, d = kDef(id); if (!d || !kOpen(d, p)) return 0;
  n = n === 'max' ? kAffordable(id, p) : Math.max(1, n | 0); if (!n) return 0;
  const c = kCost(id, n, p); if (p.gold < c) return 0;
  kingdomSettle(Date.now(), p); // what was made so far counts at the old rate
  const before = kOwned(id, p), k = kingdomState(p); p.gold -= c; k.b[id] = before + n; G.dirty = true;
  const ms = kMilestones(k.b[id]) > kMilestones(before);
  ev({ t: 'kingdomBuy', name: d.name, n, own: k.b[id], milestone: ms });
  return n;
}
// move villagers: +1 or -1 into a building (never past its copies or the free villagers)
function assignVillager(id, delta) {
  const p = G.profile, d = kDef(id), k = kingdomState(p); if (!d || d.kind === 'home') return false;
  const V = kVillagers(p), cur = kWorkers(id, p), want = cur + (delta > 0 ? 1 : -1);
  if (want < 0 || want > kCap(id, p) || (delta > 0 && !V.free)) return false;
  kingdomSettle(Date.now(), p); k.w[id] = want; G.dirty = true; return true;
}
// put every free villager to work, the building that gains the most gold-worth first
function autoAssign() {
  const p = G.profile, k = kingdomState(p); kingdomSettle(Date.now(), p); let moved = 0;
  for (let V = kVillagers(p); V.free > 0; V = kVillagers(p)) {
    let best = null, bv = 0;
    for (const d of KB.buildings) { if (d.kind === 'home' || kWorkers(d.id, p) >= kCap(d.id, p)) continue;
      const v = d.out * kOwned(d.id, p) * Math.pow(KB.milestoneMult, kMilestones(kOwned(d.id, p))) * (d.kind === 'gold' ? 1 : 0.6); if (v > bv) { bv = v; best = d; } }
    if (!best) break; k.w[best.id] = kWorkers(best.id, p) + 1; moved++;
  }
  if (moved) G.dirty = true; return moved;
}
// --- icons: game-icons.net (CC BY 3.0; authors go on the Credits screen through GI_SRC), drawn by PixelIcons
const K_ICONS = {
  e_market: ["shop","delapouite","gold","M256.18 21c-23.242 0-46.577 3.01-63.186 8.54c-8.304 2.763-14.868 6.196-18.808 9.558c-3.94 3.36-5.167 5.956-5.186 8.96L168.943 57H41v14h430V57H342.967l.033-9.033c.01-3.002-1.17-5.55-5.057-8.895s-10.407-6.773-18.677-9.535C302.724 24.014 279.42 21 256.18 21M38.277 89l-10.443 94h80.9l20.243-86.36L122.81 183h81.07l17.114-86.68l-3.096 86.68h75.75l-4.634-86.518L307.694 183h81.497l-6.167-86.36L403.266 183h80.9l-10.443-94zM25.834 201l-.51 4.588C39.822 226.445 52.968 235 64 235c11.32 0 24.852-8.89 39.8-30.96l.714-3.04zm95.687 0l-.32 4.498C135.753 226.495 148.935 235 160 235c11.293 0 24.788-8.85 39.693-30.803l.63-3.197zm95.736 0l-.156 4.352C231.69 226.455 244.908 235 256 235c11.08 0 24.28-8.525 38.85-29.576l-.237-4.424h-77.357zm94.324 0l.674 3.12c15 22.192 28.503 31.044 39.773 31.013c11.03-.03 24.212-8.62 38.772-29.637l-.32-4.496zm95.906 0l.713 3.04C423.147 226.11 436.68 235 448 235c11.032 0 24.178-8.555 38.676-29.412l-.51-4.588h-78.68zM112 223.31C97.313 242.11 81.492 253 64 253c-13.972 0-26.884-6.906-39-19.264V487h318V279h114v208h30V233.736C474.884 246.094 461.972 253 448 253c-17.49 0-33.31-10.888-47.996-29.684c-14.664 18.808-30.432 29.77-47.926 29.817c-17.508.048-33.352-10.87-48.092-29.807C289.303 242.116 273.486 253 256 253c-17.492 0-33.313-10.89-48-29.69c-14.687 18.8-30.508 29.69-48 29.69s-33.313-10.89-48-29.69M55 279h258v178H55zm18 18v142h222V297zm288 0v71.064l78 .573V297zM88 312h128c-108.235 8-116.31 24-128 113.11zm273 74.066v13.998l78 .573v-14.002zm0 32V487h78v-68.365z"],
  e_tavern: ["beer-stein","lorc","fire","M252.094 19.438c-18.092-.063-35.548 9.82-43.125 28.437v9.688l-11.376-2.5c-14.316-3.17-25.792-1.15-33.375 3.843c-7.585 4.994-12.174 12.898-12.345 25.438c-.13 9.54 1.93 15.82 4.813 20s6.673 6.672 11.906 8.062c10.465 2.78 26.67-.357 41.094-8.75l5.968-3.47l5.063 4.658c8.405 7.744 14.51 11.07 20.56 12.25c6.052 1.18 13.046.318 23.44-2.875l9.842-3.032l2.063 10.093c2.695 13.158 14.91 23.407 29.125 23.407c13.237 0 23.67-9.028 27.313-21.468l2.218-7.532l7.783.843c8.855.99 19.41-4.045 25-10.343l6-6.75l6.968 5.782c18.61 15.487 35.46 16.96 47.283 11.468c11.82-5.494 20.18-18.602 19.25-38.782c-.88-18.827-10.97-30.448-25.5-35.812c-14.532-5.364-33.76-3.61-51.282 8.218l-7.436 5.032l-5.344-7.25c-7.038-9.585-17.09-15.485-26.72-17c-9.628-1.516-18.487.928-25.374 8.406l-7.406 8.03l-6.78-8.56c-10.443-13.165-25.214-19.482-39.626-19.532zM65.22 119.968C37.8 203.65 25.784 289.07 28.812 376.19c39.55 17.23 81.422 18.105 123.437 18a957 957 0 0 0 6.594-34.22c-32.102 1.678-64.094 2.52-94.313-9.124c-2.33-66.88 6.917-121.622 28-187.03c27.318 6.5 55.01 8.61 83.25 7.467c-.07-11.715-.387-22.556-1.03-32.31c-37.168-1.726-73.593-8.642-109.53-19zm148 2.97c-6.57 3.29-13.37 5.82-20.19 7.406c3.092 33.456 1.947 78.392-2.186 127.094c-4.777 56.28-13.866 116.5-26.438 166.718H434.25c-9.932-52.565-18.812-111.61-23.594-166.72c-3.87-44.618-5.233-86.115-2.03-119.717c-10.777-1.282-22.047-5.642-32.938-13.22c-7.498 5.988-16.954 10.145-27.25 10.75c-7.46 16.247-23.42 28.125-42.688 28.125c-19.644 0-36.84-11.86-44.344-28.938c-8.26 1.885-15.993 2.507-23.72 1c-8.57-1.67-16.468-6.014-24.467-12.5zm-78.376 319.906L116.22 491.25h358.686l-21.72-48.406h-318.34z"],
  e_guild: ["warehouse","delapouite","steel","M41 41v62h30V41zm48 0v62h30V41zm48 0v62h30V41zm222 7v71H16v18h343v174H16v18h343v167h18v-39h62v39h18V329h39v-18h-39V137h39v-18h-39V48h-18v71h-62V48zM185 73v30h158V73zm192 64h62v46h-62zm-240 16v142h46V153zm-41 16c-12.81 0-23 10.19-23 23s10.19 23 23 23s23-10.19 23-23s-10.19-23-23-23m105 16v110h110V185zm176 16h62v46h-62zM41 233v62h78v-62zm336 32h62v46h-62zm0 64h62v46h-62zm-137 24c-8.39 0-15 6.61-15 15s6.61 15 15 15s15-6.61 15-15s-6.61-15-15-15m137 40h62v46h-62zm-352 8v94h254v-94zm228.977 14.23l4.046 17.54l-208 48l-4.046-17.54zM297 449v46h46v-46z"],
  e_mint: ["bank","delapouite","gold","M256 25.6L52 134.4h170v-56h68v55.094c2.53.258 5.04.567 7.54.906H460zm-16 70.8v57.38l-6.248 2.005c-14.24 4.573-26.103 11.94-36.07 22.322c-17.686 18.425-26.735 43.597-26.735 77.368c0 33.38 8.89 58.507 26.282 77.144c10.118 10.787 22.11 18.3 36.477 22.83l6.293 1.984V420.4h32v-59.85l8.373-.587c9.6-.67 18.958-2.145 28.092-4.45c11.206-2.827 22.043-6.956 32.588-12.26V252.11h-61.035v19.974h30.955v49.576l-5.403 2.356c-4.373 1.906-9.156 3.264-14.322 4.152l-.08.014l-.08.013c-5.003.768-10.33 1.133-15.988 1.133c-21.365 0-39.558-7.483-51.834-22.228c-11.08-13.308-17.89-27.01-17.89-51.625c0-24.844 7.066-38.687 18.532-51.912h.002c12.767-14.722 31.483-22.09 53.56-22.09c11.836 0 23.63 1.875 35.264 5.574c7.058 2.227 14.08 5.21 21.075 8.764v-32.35a139 139 0 0 0-26.992-9.155h-.006l-.008-.002c-8.43-1.94-17.185-3.16-26.287-3.65l-8.517-.458V96.4h-32zm-192 54v18h25v206H48v18h96v-18h-25v-206h25v-18zm320 0v18h25v206h-25v18h96v-18h-25v-206h25v-18zm-327 258v30h181v-30zm249 0v30h181v-30zm-265 48v30h462v-30z"],
  e_mine: ["gold-mine","delapouite","steel","m403.818 33.117l-369.554 15.4v46.012L426.97 79.425l-23.152-46.31zM385.334 99.04l-30.408 1.17l9.78 185.806l38.554-7.71zm-135.152 5.198l-18.39.71l-2.694 15.61l-26.578 18.75l.13.866l-.273-.047l-3.063 17.738l6.188 1.07l4.617 30.395l31.532 5.445l14.543-27.088l6.186 1.07l3.063-17.74l-.273-.046l.416-.773l-18.75-26.578zm-77.444 2.98l-22.82.878l-39.47 54.775l-1.692 33.138l63.982-88.79zm-77.625 2.985l-31.275 1.203l-28.72 272.832l45.66 6.733l14.335-280.767zM236.928 128.1l14.457 20.49l-34.947-6.035zm-20.516 32.718l28.87 4.985l-7.012 13.064l-19.63-3.39l-2.228-14.66zM437.12 289.89l-76.434 15.288l-44.99-14.998l-28.706 28.703h169.457zm-260.05 2.268l-9.42 20.725h-16.386v18h8.205l-7.275 16h-22.93v18h14.75l-8.183 18h-26.568v18h18.386l-13.636 30h-24.75v18h16.568l-8.762 19.275l16.387 7.45l12.147-26.725h143.423l-6.75-18H133.785l13.637-30h103.605l-6.75-18h-88.673l8.18-18h73.74l-6.75-18h-58.807l7.273-16h45.535l-4.498-12h41.258l6-6h-80.113l6.035-13.276l-16.387-7.45zm69.182 44.725l40.36 107.635c6.022-8.242 15.748-13.635 26.652-13.635c11.916 0 22.43 6.438 28.234 16h55.53c5.804-9.562 16.32-16 28.236-16c10.424 0 19.768 4.93 25.832 12.564l26.64-106.564zm67.012 112c-8.39 0-15 6.61-15 15s6.61 15 15 15s15-6.61 15-15s-6.61-15-15-15m112 0c-8.39 0-15 6.61-15 15s6.61 15 15 15s15-6.61 15-15s-6.61-15-15-15"],
  e_lodge: ["wood-cabin","delapouite","nature","m495.145 15.451l-178.215.205s7.918 25.215 15.652 35.63c13.155 17.712 67.295 2.752 59.79 35.714h55.4c6.995-6.98 14.212-15.862 15.064-23.44c1.035-9.207-15.175-16.126-12.29-24.931c5.22-15.92 44.599-23.178 44.599-23.178M256 28.311L30.455 238.82l32.666 21.777L256 83.79l192.879 176.807l32.666-21.778zM393 105v26.555l46 42.933V105zm-137 3.209L209.318 151h93.364zM189.682 169l-32.727 30H279v-30zM297 169v30h58.045l-32.727-30zm-159.682 48l-34.564 31.684l64.246-.288V217zM185 217v31.316l222.76-.994L374.682 217zm242.303 48.236L83.02 266.773l-18.141 16.63l-.932-.622A31.6 31.6 0 0 1 60.737 295h390.526a31.6 31.6 0 0 1-3.211-12.219l-.932.621zM32 267c-7.839 0-14 6.161-14 14s6.161 14 14 14s14-6.161 14-14s-6.161-14-14-14m448 0c-7.839 0-14 6.161-14 14s6.161 14 14 14s14-6.161 14-14s-6.161-14-14-14M59.656 313a31.66 31.66 0 0 1 1.08 30H103v-30zM121 313v78h46v-78zm64 0v78h46v-78zm64 0v30h30v-30zm48 0v174h94V313zm112 0v30h42.264a31.66 31.66 0 0 1 1.08-30zm-377 2c-7.839 0-14 6.161-14 14s6.161 14 14 14s14-6.161 14-14s-6.161-14-14-14m448 0c-7.839 0-14 6.161-14 14s6.161 14 14 14s14-6.161 14-14s-6.161-14-14-14M59.656 361a31.66 31.66 0 0 1 1.08 30H103v-30zM249 361v30h30v-30zm160 0v30h42.264a31.66 31.66 0 0 1 1.08-30zm-377 2c-7.839 0-14 6.161-14 14s6.161 14 14 14s14-6.161 14-14s-6.161-14-14-14m448 0c-7.839 0-14 6.161-14 14s6.161 14 14 14s14-6.161 14-14s-6.161-14-14-14m-128 28h22v18h-22zM59.656 409a31.66 31.66 0 0 1 1.08 30H279v-30zM409 409v30h42.264a31.66 31.66 0 0 1 1.08-30zm-377 2c-7.839 0-14 6.161-14 14s6.161 14 14 14s14-6.161 14-14s-6.161-14-14-14m448 0c-7.839 0-14 6.161-14 14s6.161 14 14 14s14-6.161 14-14s-6.161-14-14-14M32 457c-7.839 0-14 6.161-14 14s6.161 14 14 14s14-6.161 14-14s-6.161-14-14-14m28.736 0a31.66 31.66 0 0 1-1.08 30H87v-30zM105 457v30h174v-30zm304 0v30h43.344a31.66 31.66 0 0 1-1.08-30zm71 0c-7.839 0-14 6.161-14 14s6.161 14 14 14s14-6.161 14-14s-6.161-14-14-14"],
  e_runes: ["obelisk","delapouite","arcane","M256 22.127L238.562 57h34.875zM233 75v268h46V75zm-16 286v14h78v-14zm-17.193 32l-13.43 94h139.246l-13.428-94z"],
  e_cottage: ["house","delapouite","nature","M256 19.27L25.637 249.638L19.27 256L32 268.73l6.363-6.367L256 44.727l217.637 217.636L480 268.73L492.73 256l-6.367-6.363zM96 48v107.273l64-64.002V48zm160 20.727l-192 192V486h64V320h96v166h224V260.727zM288 320h96v80h-96z"],
  e_kingdom: ["village","delapouite","gold","m109.902 35.87l-71.14 59.284h142.28zm288 32l-71.14 59.284h142.28l-71.14-59.285zM228.73 84.403l-108.9 90.75h217.8zm-173.828 28.75v62h36.81l73.19-60.992v-1.008zm23 14h16v18h-16zm265 18v10.963l23 19.166v-16.13h16v18h-13.756l.104.087l19.098 15.914h-44.446v14h78v-39h18v39h14v-62zm-194.345 48v20.08l24.095-20.08zm28.158 0l105.1 87.582l27.087-22.574v-65.008zm74.683 14h35.735v34h-35.735zm-76.714 7.74L30.37 335.153H319l-144.314-120.26zm198.046 13.51l-76.857 64.047l32.043 26.704H481.63l-108.9-90.75zm-23.214 108.75l.103.086l19.095 15.914h-72.248v77.467h60.435v-63.466h50v63.467h46v-93.466H349.516zm-278.614 16V476.13h126v-76.976h50v76.977h31.565V353.155H70.902zm30 30h50v50h-50z"],
  e_gems: null, // the Gem Cutter reuses the cut-diamond gem icon (m_gem)
};
for (const k in K_ICONS) { const v = K_ICONS[k]; if (v) { GI[k] = v[3]; GI_SRC[k] = [v[0], v[1]]; PX_KEY_FAM[k] = v[2]; } else { GI[k] = GI.m_gem; GI_SRC[k] = GI_SRC.m_gem; PX_KEY_FAM[k] = 'arcane'; } }
// --- the Kingdom tab (Bank & Camp › Kingdom): the stored pile ticking up, villagers, then a card per building
const kHM = (m) => `${Math.floor(m / 60)}h ${String(Math.floor(m % 60)).padStart(2, '0')}m`;
function kStored(now, p) { p = p || G.profile; const v = vaultState(now), k = kingdomPending(now, p); return { v, k, gold: v.gold + k.gold, gems: v.gems + k.gems }; }
function kRateLine(d, p) {
  const m = kMult(d.id, p), one = m || 1, tb = 1 + 0.12 * vaultLv(p), L = p.level;
  const bi = zoneBiome(highestZone(L)), b = CB[bi], mb = Math.pow(KB.matBiome, bi);
  const per = d.kind === 'gold' ? `${ICON.coin}${fmtK(d.out * one * kUnit(p) * tb * 60)}` : d.kind === 'gems' ? `${ICON.ess}${fmt(Math.round(d.out * one * (1 + L / 100) * tb * 10) / 10)}`
    : d.kind === 'rune' ? `<img class="mi" src="${matIcon(CFG.craft.rune.id)}" alt="">${fmt(Math.round(d.out * one * tb * 10) / 10)}` : `<img class="mi" src="${matIcon(d.kind === 'ore' ? b.ore : b.part)}" alt="">${fmt(Math.round(d.out * one * mb * tb * 10) / 10)}`;
  return m ? `${per}/h` : `${per}/h each`;
}
function kingdomTabHTML(p, now) {
  const S = kStored(now, p), v = S.v, pct = Math.round(v.mins / v.cap * 100), R = kingdomRates(p), V = kVillagers(p), amt = UI.kAmt || 1;
  const goldH = (vaultRates(p).gold + R.gold) * 60, mats = S.k.mats.map(([id, n]) => matChip(id, null, p).replace(/<b>.*?<\/b>/, `<b>+${fmtK(n)}</b>`)).join('');
  const head = `<div class="vaultBox kHead"><div class="vbar"><i style="width:${pct}%"></i><span>${pct}% · ${kHM(v.mins)} of ${vaultCapH(p)}h${v.full ? ' · FULL' : ''}</span></div>
    <div class="stats3"><div><b id="kGold">${ICON.coin}${fmtK(S.gold)}</b><span>Stored gold</span></div><div><b>${fmtK(goldH)}/h</b><span>Gold rate</span></div><div><b id="kGems">${ICON.ess}${fmtK(S.gems)}</b><span>Gems</span></div></div>
    ${mats || v.cases || v.xp ? `<div class="cbonus mats">${v.xp ? `<span class="mat"><b>+${fmtK(v.xp)}</b> XP</span>` : ''}${v.cases ? `<span class="mat">${gi('m_case')}<b>+${v.cases}</b></span>` : ''}${mats}</div>` : ''}</div>`;
  const vil = `<div class="kVil">${gi('m_players')}<span>Villagers <b>${V.busy}/${V.total}</b> at work</span>${V.free && KB.buildings.some((d) => d.kind !== 'home' && kWorkers(d.id, p) < kCap(d.id, p)) ? '<button class="ghost sm" data-act="kAuto">Put to work</button>' : ''}</div>`;
  const amts = `<div class="kAmt">${[1, 10, 'max'].map((n) => `<button class="${amt === n ? 'on' : ''}" data-act="kAmt" data-n="${n}">${n === 'max' ? 'Max' : '×' + n}</button>`).join('')}</div>`;
  let lockedShown = 0;
  const cards = KB.buildings.map((d) => {
    if (!kOpen(d, p)) { if (lockedShown++) return ''; return `<div class="kCard lk">${gi(d.icon)}<div class="kMeta"><b>${d.name}</b><small>Opens at level ${d.at}</small></div></div>`; }
    const n = kOwned(d.id, p), want = amt === 'max' ? Math.max(1, kAffordable(d.id, p)) : amt, cost = kCost(d.id, want, p), can = p.gold >= cost, nx = kNextMilestone(n), prev = [0, ...KB.milestones].filter((t) => t <= n).pop();
    const w = kWorkers(d.id, p), home = d.kind === 'home';
    return `<div class="kCard">${gi(d.icon)}<div class="kMeta"><b>${d.name} <em>${n}</em></b>
      <small>${home ? `+${d.out} villagers each` : kRateLine(d, p)}${!home && kMilestones(n) ? ` · ×${Math.pow(KB.milestoneMult, kMilestones(n))}` : ''}</small>
      ${!home && nx ? `<i class="kMs"><b style="width:${Math.round((n - prev) / (nx - prev) * 100)}%"></b><small>×2 at ${nx}</small></i>` : ''}
      ${!home && n ? `<span class="kW"><button class="ghost xs" data-act="kVil" data-id="${d.id}" data-d="-1" ${w ? '' : 'disabled'}>−</button><small>${w}/${kCap(d.id, p)} villagers · +${Math.round(KB.villager * w * 100)}%</small><button class="ghost xs" data-act="kVil" data-id="${d.id}" data-d="1" ${V.free && w < kCap(d.id, p) ? '' : 'disabled'}>+</button></span>` : ''}</div>
      <button class="${can ? 'primary' : 'disabled'} kBuy" data-act="kBuy" data-id="${d.id}" ${can ? '' : 'aria-disabled="true"'}><span>Buy ${want > 1 ? '×' + want : ''}</span><small>${ICON.coin}${fmtK(cost)}</small></button></div>`;
  }).join('');
  const lv = vaultLv(p), tc = vaultUpCost(p), tOk = lv < VAULT_MAX_LV && p.gold >= tc;
  const treasury = `<div class="kCard">${gi('e_kingdom')}<div class="kMeta"><b>Treasury <em>${lv}/${VAULT_MAX_LV}</em></b><small>${lv ? `+${lv * 12}% to everything` : '+12% to everything per level'} · ${vaultCapH(p)}h storage</small></div>
    <button class="${tOk ? 'primary' : 'disabled'} kBuy" data-act="vaultUp" ${tOk ? '' : 'aria-disabled="true"'}><span>${lv >= VAULT_MAX_LV ? 'Max' : 'Upgrade'}</span>${lv >= VAULT_MAX_LV ? '' : `<small>${ICON.coin}${fmtK(tc)}</small>`}</button></div>`;
  return { body: `${head}${vil}${amts}<div class="kList">${treasury}${cards}</div>`, bar: selBar('', `<button class="${v.mins >= 1 || S.k.gold ? 'primary big' : 'disabled'}" data-act="vaultCollect" ${v.mins >= 1 || S.k.gold ? '' : 'aria-disabled="true"'}>Collect</button>`) };
}
// while the Kingdom tab is open its stored gold and gems tick up every second (the idle-game feel)
setInterval(() => {
  if (!G.profile || UI.current !== 'idle' || (UI.idleTab || 'Vault') !== 'Vault') return;
  const g = document.getElementById('kGold'), e = document.getElementById('kGems'); if (!g) return;
  const S = kStored(Date.now()); g.innerHTML = `${ICON.coin}${fmtK(S.gold)}`; if (e) e.innerHTML = `${ICON.ess}${fmtK(S.gems)}`;
}, 1000);
// --- end kingdom
