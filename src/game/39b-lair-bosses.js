// ---------------------------------------------------------------------
// LAIR BOSSES — every combat area has its own boss at its lair, with one unique item only it drops.
// A mini-boss returns every 10 minutes (1 in 8 drops the unique); 1 spawn in 5 is Enraged at world-boss strength
// and always drops it. Lair bosses are local (temp) monsters: they are not shared with the multiplayer lobby.
// ---------------------------------------------------------------------
const AREA_UNIQUE = [null,
  ['Vespa, Hornet Queen', 'weapon', "Vespa's Stinger"], ['Old Morel, Mushroom King', 'helmet', 'Morel Crown'], ['Barkbone, the Hollow Oak', 'chest', 'Barkbone Mail'],
  ['Nightmaw', 'boots', 'Nightmaw Treads'], ['Ramhorn, Cairn Keeper', 'helmet', 'Ramhorn Helm'], ['Gravelgrin, Boulder King', 'chest', 'Gravelgrin Plate'],
  ['Sola, the False Sun', 'accessory', 'Mirage Prism'], ['Rimewing', 'weapon', 'Rimewing Talon'], ['Glacius, Troll King', 'chest', 'Glacius Hide'],
  ['Echo Mother', 'accessory', 'Echo Shell'], ['Bogmaw, Cauldron Toad', 'helmet', 'Bogmaw Cap'], ['Slagheart', 'weapon', 'Slagheart Hammer'],
  ['Cinder Warden', 'chest', 'Cinder Warden Plate'], ['Pyrewyrm', 'weapon', 'Pyrewyrm Fang'], ['Coldflame Colossus', 'accessory', 'Coldflame Ember'],
  ['Leyweaver', 'boots', 'Leyweaver Steps'], ['Undertow', 'accessory', 'Undertow Orb'], ['Facet, Prism Minotaur', 'helmet', 'Facet Horncrown'],
  ['The Last Astronomer', 'weapon', "Astronomer's Staff"], ['Nebula Queen', 'chest', 'Nebula Shroud'], ['Rapidsong', 'boots', 'Rapidsong Sandals'],
  ['Gleam, Lantern Angler', 'accessory', 'Gleam Lure'], ['Trenchjaw', 'helmet', 'Trenchjaw Helm'], ['Heartbeat, Leviathan Calf', 'chest', 'Heartbeat Scale'],
  ['Boilshell, Crab King', 'chest', 'Boilshell Carapace'], ['Shardwing', 'boots', 'Shardwing Greaves'], ['Zenith, Storm Wyvern', 'weapon', 'Zenith Spark'],
  ['Dawnwatch, Halo Sentinel', 'helmet', 'Dawnwatch Halo'], ['Archon of Dawn', 'accessory', 'Dawn Archon Sigil']];
CFG.lairBoss = { respawn: 600, near: 60, drop: 1 / 8, enragedChance: 0.2, hp: 6, atk: 1.6, enragedHp: 25, enragedAtk: 2.5, size: 1.8 };
const uniqueRarity = (zi) => RARITIES[Math.min(7, 2 + Math.floor(zi / 5))]; // rare in the first areas … divine at the top
const LairBoss = { next: {}, live: {} }; // per area: seconds until it may spawn, the boss entity
function stepLairBosses(dt) {
  if (inInstance() || !G.player.alive) return;
  const W = CFG.world, B = CFG.lairBoss, pl = G.player, p = G.profile;
  for (const l of W.lairList) {
    const zi = l.zone, U = AREA_UNIQUE[zi], e = LairBoss.live[zi]; if (!U) continue;
    if (e) { if (!e.alive) { G.enemies = G.enemies.filter((x) => x !== e); G.ents.delete(e.id); LairBoss.live[zi] = null; LairBoss.next[zi] = B.respawn; } continue; }
    if ((LairBoss.next[zi] = (LairBoss.next[zi] || 0) - dt) > 0) continue;
    if (Math.hypot(pl.x - l.x, pl.z - l.z) > B.near || p.level < W.zones[zi].minLevel) continue;
    const enraged = Math.random() < B.enragedChance, b = makeEnemy(W.zones[zi].enemy, zi, { elite: true });
    b.temp = true; b.lairBoss = zi; b.enraged = enraged; b.bossName = U[0]; b.respawnT = 1e9;
    b.x = b.hx = b.wx = l.x; b.z = b.hz = b.wz = l.z; b.r *= B.size * (enraged ? 1.25 : 1);
    b.maxHp = b.hp = Math.round(b.maxHp * (enraged ? B.enragedHp : B.hp)); b.atk *= enraged ? B.enragedAtk : B.atk;
    eliteMods(b); G.enemies.push(b); LairBoss.live[zi] = b;
    ev({ t: 'spawn', x: b.x, z: b.z, elite: true }); toast(`${enraged ? 'Enraged ' : ''}${U[0]} rises at ${l.name}`, enraged ? 'bad' : 'good');
  }
}
function lairBossKilled(e) {
  const U = AREA_UNIQUE[e.lairBoss]; if (!U) return;
  if (!e.enraged && Math.random() >= CFG.lairBoss.drop) return;
  const it = makeItem(U[1], uniqueRarity(e.lairBoss), e.lvl);
  it.name = U[2]; it.unique = e.lairBoss;
  const free = Object.keys(CFG.affixes).filter((k) => it.aff[k] == null), k = pick(free); // one extra affix, rolled at its cap
  if (k) it.aff[k] = Math.round(CFG.affixes[k].max * (1 + 0.1 * rarIdx(it.rarity)) * 100) / 100;
  grantItem(it, 'boss'); toast(`Unique: ${U[2]}`, 'good');
}
