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
