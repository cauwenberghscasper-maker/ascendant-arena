# World v9: Espaahhh's map, levels 1-210 (11 Oct 2026)

Source: "Ascendant Arena — a critical opinion" (Espaahhh) and "Uitleg areas" (the area guide).

## Map
Base Camp is now its own safe area south of Sunny Meadow (Willowcross town sits inside it). North of it, 29 areas in 6 biomes, each a band of the road with its own floor style, colours, props, fog and sky. Full fences mark where a biome starts; inner areas are separated by a gate arch.

| Biome | Areas (levels) | World boss |
|---|---|---|
| Starting Woodlands | Sunny Meadow 1-10 · Funky Forest 10-20 · Gnarly Grove 20-25 · Shady Shrubland 25-30 | Ancient Golem |
| Mountain Peaks | Feisty Foothills 30-35 · Heinous Hilltop 35-40 · Pretending Plateau 40-45 · Malicious Mountain 45-50 · Frost Peaks 50-60 | Frost Colossus (Frostbound Case) |
| Volcanic Underworld | Grumbling Descent 60-65 · Brimstone Bogs 65-70 · Slaggy Terraces 70-75 · Charred Threshold 75-80 · Ember Wastes 80-85 | Magma Titan (Cinderforge Case) |
| Arcane Ruins | Sapphire Coals 85-90 · Fractural Ley 90-95 · Inverted Abyss 95-100 · Glassfall Labyrinth 100-105 · Starfall Ruins 105-110 | Void Colossus |
| Ocean Depths | Drowned Constellations 110-120 · Twilight Aquifers 120-130 · Luminous Grottos 130-140 · Midnight Shelf 140-150 · Abyssal Depths 150-160 | Abyssal Leviathan |
| Celestial Ascension | Abyssal Upwelling 160-170 · Obsidian Chimney 170-180 · Zenith Supercell 180-190 · Aetherial Threshold 190-200 · Celestial Spire 200-210 | Celestial Colossus (Seraphic Case) |

The PDF had two range typos (Frost Peaks 55-60 after Malicious Mountain 45-50; Inverted Abyss 90-95 twice). They are closed up as Frost Peaks 50-60, Inverted Abyss 95-100, Glassfall 100-105, Starfall 105-110.

Each area: one boss lair, one den (alternating sides), a waypoint at its gate, 20 (5-level areas) or 24 (10-level areas) monsters plus an elite. Two challenge shrines per biome. World length 2,830 m (was 1,150 m).

## World v10: wider map, two dens, points of interest (11 Oct 2026)
- Bounds x ±210 (was ±130); area lengths 70 / 110 / 135 m (was 70 / 90 / 110); same 30 areas, order, names and levels. World length 3,557 m (maxZ 3,467).
- Hero speed 8.0 (was 6.4), dash 7.5 m. `CFG.enemies.speedMult` exists (read in stepEnemy) but is held at 1.0: 1.15 drops check_hardcore pack time-to-death to 3.13 s at L75 / 3.15 s at L200 (floor 3.5 s).
- Two dens per area: A at ±0.5·maxX, z0+0.3·len; B on the other flank at z0+0.72·len; r 13, 10 / 12 monsters + an elite each.
- Patrol lanes [−.8, −.5, −.17, .17, .5, .8]·maxX, patrolDensity 1.5. Population 1,657 (was 1,186). Body separation scans only the monster's own area (`G.enemiesByZone`).
- Points of interest (`CFG.world.pois`, ids `a07:dungeon:0`): per area one hero landmark with its own builder (`POI_ART` in world-art.js: windmill, sunken bell, fairy ring, giant's ribcage, broken colossus, frozen waterfall, lava forge, dragon skull, crystal arch, crashed star, ghost ship, lighthouse, storm rod, moon gate, sky altar, …), two minor POIs (camp, ruined tower, statue, well, cart, graveyard, obelisk, shack), one secret (two in 135 m areas) and from area 3 a cave entrance at ±0.8·maxX (`kind: 'dungeon'`, lvl = area max). 159 POIs in all.
- Secrets: a ring of rocks and firs at |x| = maxX−9 with one narrow gap facing north or south. Hidden on the minimap until found; first visit gives an epic+ item (area max level +2), 15 + area gems, 2 shards, +0.5% XP for good, and the Secret Seeker feat. Saved in `profile.secrets[id]`.
- Minimap base canvas is stored at 1600 / world length px per metre (189×1600) and shows both dens, landmarks, caves and found secrets.
- Saves: `worldVersion: 10`; indices unchanged, migration only adds `secrets`, `pois`, `dungeons`.
- Draw calls (Chromium/SwiftShader, 430×932): town 100 → 112, Sunny Meadow road 133 → 125, Foothills flank 120 → 92. Props of all areas now share one instanced list per geometry, chunked in 64 m cells.
- Checks: `tools/check_world_layout.cjs` (dens, POI ids, clear spots, BFS reachability, sealed secrets, minimap size, population).

## Monsters
58 new monsters, two per area, named and behaving as in the area guide (quill-spraying Thistle-Hares, lethargic Sun-Drunk Hornets that swarm when close, charging Truffle Boars, ambushing Boulder-Mimics, burning Magma-Hounds, Geometry-Drone turrets, and so on). Until bespoke art exists, each reuses one of the 14 sculpted bodies, recoloured in a shader toward its own tint and scaled to its own size. The old 14 monsters stay defined for saves, records and Slayer mastery.

## Pace
Kills per level are about 1.6x v8: 32 + 5.1·L + 0.04·L² (v8: 20 + 3.2·L + 0.025·L²). Every XP source that is a fraction of a level (jobs, shrines, orbs, bosses, Vault, expeditions) follows automatically. Test mode keeps its x100.

## Saves
Profiles get `worldVersion: 9`. Older saves are migrated once: every area gate the hero's level already opens becomes an unlocked waypoint, the "furthest area" stat moves to the matching new area, and an active kill job switches to the equivalent new monster. Nothing else changes.

## Cases (chest) fix
A full bag no longer blocks opening a case. The case reward is always kept (the bag may go over its limit) and the reel shows a note to salvage weaker gear. The bag also grows from 30 to 50.

## Checks
- `node tools/check_release.cjs` (25 checks, including the new v8 → v9 save migration and full-bag case opening)
- `node audit/checks.cjs`, `node tools/check_test_mode.cjs`, `node tools/check_companions.cjs`
- Headless browser tour of all areas (portrait 430×932), monster line-up, full-bag case opening through the UI. Draw calls in town: 125 (v8: 122).

## One skill tree per hero (11 Oct 2026)
The shared Hero tree is gone. Each hero (brawler) has one tree with 9 branches around one core: its own Power, Rhythm and Utility (ending in its special shots), each flanked by two general branches (Might, Carnage, Swiftness, Tempest, Fortitude, Sorcery). Points per hero = level points (2 per level + 5 every 10) + that hero's mastery points (2 per mastery level). Older saves copy their spent Hero-tree nodes into every hero's tree (same node ids, so nothing is lost). Prestige refunds every hero's tree.

## Menus (11 Oct 2026)
- Reusable panel parts: `dock()` keeps the header and an action bar on screen while the middle scrolls (no screen needs a scroll to reach its confirm button); `selBar()` shows a short summary with a Details expander; `itemGrid()` shows every piece of one gear slot as tiles with badges.
- Equipment: every piece of the selected slot at once (▲ better, +1 next reforge, max reforge max, lock = protected). Tap a piece to wear/wield, protect or alch it.
- Reforge review shows all pieces of the slot with the ones that will be melted down marked ✓; the confirm button is pinned.
- Heroes: compact grid, details on demand, Skill tree / Play pinned. Treasure Chests, Smithy, Bank & Camp, Prestige: actions pinned.
- Checked at 375×667, 430×720 and 932×430: every confirm button visible without scrolling.

## Adventure-RPG wording and look (11 Oct 2026)
RuneScape-inspired names: Adventurer's Journal (menu), Equipment, Talents, Relics, Treasure Chests (cases), Heroes, Smithy, Adventure Log, Collection Log, Bank & Camp, Fellow Adventurers, Lodestone Network (waypoints, Teleport), Hiscores, Achievements, Options; Reforge (merge), Alch (salvage), Wear/Wield (equip), coins. Tab keys and save data are unchanged; only display text changed. New skin `assets/art/runescape-ui.css`: carved brown stone panels with a gold inner frame, Cinzel serif titles in RuneScape yellow, red-brown selected tabs, brass primary buttons.
