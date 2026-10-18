# Ascendant Arena: vision and what's in the game

## The vision

A **3D fantasy RPG brawler for phones**: Brawl Stars-style twin-stick combat inside a RuneScape/Diablo-style open
world with loot, masteries and endless progression. You start in Base Camp, walk the long road north through 29 areas,
fight, loot, upgrade and unlock heroes, and never run out of things to push (World Tiers, Torment tiers, masteries to 99).

What it should feel like:
- **Quick fights, deep progression.** Every fight is a few seconds of thumb action; every session moves a bar
  (level, mastery, gear, Level Road).
- **Heroes with a story.** 27 hand-designed heroes, each with its own lore, props, attack and super. Nothing generic.
- **A world that looks hand-made.** Painted 3D world, pixel-art interface on top.
- **Fair.** Everything is earned by playing. No paid chests, no paid heroes, odds always shown.
- **Gentle start.** Systems unlock one at a time as you level; nothing dumps every menu on a new player.
- **Shared world.** You see other players in the open world, fight world bosses together, and can opt in to PvP.
- **Goal:** release as a store app (iOS/Android via Capacitor) once the release gates in `audit/PHASE1.md` pass:
  60 FPS on mid-range phones, safe saves in the app wrapper, playtested pacing, store accounts, privacy policy,
  app icon and splash.

## Controls

Left joystick moves. Attack pad: drag to aim, tap to auto-aim, hold to auto-fire. SUPER charges on hits (tap
auto-aims, drag aims with a preview). DASH. Class SKILL and elemental SPECIAL unlock later. AUTO toggles Auto Hunt;
the Fight/Normal chip switches PvP.

## Heroes (27)

All heroes are Codex heroes (lore, secrets and kits: `assets/heroes/combat_kits.md`; concepts in
`assets/heroes/concepts/`; splash art in `assets/ui/portraits/splash/`). The original 16 adventurers (Pip, Rico,
Bruno, Brick…) are retired and only kept for old saves. Heroes unlock on the Level Road (number = level) unless they
are dungeon-only. Switching away from your first hero needs mastery 80 with it. Tier power: champion 1.0,
legendary 1.08, ascendant 1.15, divine 1.25.

| Tier | Hero (unlock) — role — basic attack / super |
|---|---|
| Champion | Wrenna, the Drowned Cartographer (starter) — artillery — Street Vial / TIDE · Hob, Bell-Ringer (9) — tank — Clapper Jab / BELL · Corrin, Keeper of the Orchard (14) — tank — Windfall / GROVE · Mott, Candle-Keeper (17) — balanced — Drip / VIGIL · Nyssa, the Ferry-Coin (21) — skirmisher — Obol Flick / FERRY · Pyrrhos, Bronze Sentry (25) — tank — Patrol Swing / PATROL · Moss, Thread-Follower (29) — balanced — Thread Ball / MAZE · Ione, the Siren (33) — mage — Plucked Note / SONG · Fenwick, Moonless Wolf (36) — skirmisher — Lunge / HUNT · Thimble, the Changeling (44) — marksman — Button Shot / SWAP · The Unwritten (48) — tank — Chalk Jab / WORD |
| Legendary | Lysandra, Mason (55) — tank — STONE · Kallix, Thief of the First Fire (58) — mage — Pilfered Spark / THEFT · Oko, Lighthouse That Walked (62) — marksman — Lens Flash / BEACON · Ysolt, Debt-Collector (66) — skirmisher — Ledger Slap / DEBT · Sir Halven, headless Herald (70) — tank — DECREE |
| Ascendant | Sena, Youngest Fate (74) — marksman — Loose End / CUT · Jory (78) — balanced — Keyring Toss / SHIFT · The Sleeper, Island That Woke (82) — tank — Tide Palm / FLOOD · Camedown, Stair-Builder (86) — tank — Step / STAIR |
| Divine | Vell, Keeper of Lost Things (88) — mage — LOST · Ophira, Gorgon Who Looked Away (90) — balanced — Glass Shard / MIRROR · Old Kerberon, three-headed Gate-Hound (92) — tank — THREE · Tychon, God of the Last Roll (94) — mage — Roll the Bones / ROLL · Aurvan, First Moon's Keeper (96) — mage — Moonfrost Breath / MOON · Ourax, Titan holding the sky (98) — tank — Brush Aside / SKY · Hespera, Evening Star (100) — artillery — Cinder Sling / SUN |

Props that make each hero who they are (keep them in models and effects): Ourax has a village on his shoulders,
Halven carries his head in a lantern at his hip, Kerberon's two side heads sleep, Sena has threads and golden shears,
Hob has bells on helmet and forearms, Kallix a furnace grate with a coal in his chest, Aurvan a moon in his chest,
Vell a jeweller's loupe and pockets of lost things, Wrenna map tattoos, a sextant monocle and seawater vials.

Roles (`CFG.roles`): balanced, tank, marksman, mage, skirmisher, artillery. Each sets HP and speed multipliers,
arena HP and a class skill.

## World

Base Camp plus 29 areas in 6 biomes, laid out as bands along the road north (levels 1-210, monster level rises the
deeper you go inside an area). Biomes and their world bosses:

| Biome | World boss |
|---|---|
| Starting Woodlands | Ancient Golem |
| Mountain Peaks | Frost Colossus |
| Volcanic Underworld | Magma Titan |
| Arcane Ruins | Void Colossus |
| Ocean Depths | Abyssal Leviathan |
| Celestial Ascension | Celestial Colossus |

Every area has: two monster kinds, monster dens (fast respawn, best XP), a lair with a lair boss and unique item,
a hero landmark, three dungeons (Caves, Warrens, Sanctum), four ore veins and a mine, runestones for a Legendary
Trial, and a lodestone to travel. Elites, timed world bosses (60 s warning, team kits), World Tiers. The world map
(Map button) shows a pixel-art scene per area.

## Systems already in the game

- **Levels:** player level (content to 210, cap 100000, ascensions at 100/150/200). **Level Road:** an item every
  level, a milestone chest every 5th, heroes on the road.
- **Skill trees:** a shared Hero tree from level points, opening ring by ring, plus per-hero masteries 1-99
  (RuneScape style; badges Bronze 10 → Legend 99, capes at 99), keystones, relic slots (3 at 30, 4 at 100, 5 at 150).
- **Gear:** weapon, helmet, chest, boots, accessory. Rarities common → uncommon → rare → epic → legendary → mythic →
  ancient → divine. Reforge/merge with weaker same-slot pieces plus gold/gems (review before spending), protect flag,
  enchant (reroll or boost an affix), sell, salvage, bag of 50. Epic+ loot arrives as a chest opened on a reel.
- **Forge (Garo):** Reforge, Masterwork ranks, Craft (biome ore + monster parts + dungeon cores + Titan Souls;
  5-piece sets with glowing set auras), Forge shop, Enchant.
- **Showdown arena:** 10 fighters vs bots, closing gas, power cubes, trophies. **The Rift.**
- **Dungeons** with Dungeon Keys (tier + affixes, par time) and **Legendary Trials** (sigils, Radiant 1/500 drops).
- **Mining:** ore, pickaxe, geodes for the Museum, a 1/10,000 pet.
- **Daily:** 7-day calendar that never resets, weekly Colossus chest.
- **Idle:** Vault (fills while away), Expeditions (benched heroes fetch loot), Auto Hunt (walks, fights and mines by
  itself), offline rewards.
- **Pets and prestige companions:** world bonuses only, never in the arena.
- **Multiplayer:** shared open world (one Supabase Realtime lobby), shared monsters and world bosses, opt-in PvP.
- **Saves:** local cache plus cloud save (Supabase). ×100 test mode (`?test=100`) for testing late content.
- **Menus:** 4 hub tiles (Hero / Forge / Gear / Journal), full pages, level unlocks with a white "New" pulse,
  Inventory (chests, resources, gear on one page), item inspect.

## Where we're going next

Check `docs/UNFINISHED.md` for the current list. The big directions:

1. **Replace every code-built object with a real 3D model** (pets, menu thumbnails, shrines, lava, dungeon floor,
   lair bosses, broken landmarks, modular town houses from the Quaternius Medieval Village kit). See
   `docs/3D-MODELS.md`.
2. **Higher-detail art:** unique item icons (96-128 px painted), an icon per craft material, art banners for the hub
   pages, a tall title image.
3. **Secret weapons:** one craft recipe per biome from chest ore + a Titan Soul.
4. **Heroes holding their weapon** (generated as one mesh), then weapons come back on heroes.
5. **Multiplayer growth:** test PvP on two real devices, a first-play name prompt and name filter, room partitioning
   (`mpRoomKey`) when the lobby gets full, sharing shrines, XP orbs, Rift and dungeons.
6. **Phone performance** on real devices (town triangle count, tree and grass density, KTX2 textures for the Pages
   build).
7. **Store release:** native projects, app icon/splash, privacy policy, store accounts, playtested pacing.
