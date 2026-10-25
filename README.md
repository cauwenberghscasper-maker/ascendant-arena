# Ascendant Arena

Mobile 3D fantasy RPG brawler (three.js r186, one static page, played on phones).
Play: https://cauwenberghscasper-maker.github.io/ascendant-arena/ · Repo: https://github.com/cauwenberghscasper-maker/ascendant-arena

**This README is the one document every developer and every AI tool reads first** (Claude projects, Claude Code,
Codex, Cursor, Copilot, Gemini…). It holds the rules, the style, what is in the game, the vision and how 3D models
are made. `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` and `.github/copilot-instructions.md` only point here.
Open work: [`docs/OPEN.md`](docs/OPEN.md); handovers: [`docs/log/`](docs/log/) (history before 21 Oct 2026: [`docs/UNFINISHED.md`](docs/UNFINISHED.md)).

The owner is Casper. `main` is the live game (GitHub Pages rebuilds from `main` within minutes). When this file and
the code disagree, check `git log` and fix this file in the same commit.

## Before you start (every session)

1. Get the latest code: `git clone https://github.com/cauwenberghscasper-maker/ascendant-arena` (about 365 MB; use
   `GIT_LFS_SKIP_SMUDGE=1` and `--depth 1` for speed) or `git pull` on `main`.
2. Read this whole README, then `docs/OPEN.md`, the newest files in `docs/log/`, `git log --oneline -15` and `npm run team`
   to see what others just did and are doing now ([`docs/TEAMWORK.md`](docs/TEAMWORK.md)).
3. For the area you touch, read the matching `audit/*.md` and `assets/heroes/combat_kits.md` for hero work.
4. No repo access (for example a Claude project chat)? Read this file at
   https://raw.githubusercontent.com/cauwenberghscasper-maker/ascendant-arena/main/README.md and follow the same rules
   in whatever you hand back.

## Contents
1. [Rules](#1-rules) — hard rules, phone first, one style, working together, checks, talking to Casper
2. [The game: vision and what's in it](#2-the-game-vision-and-whats-in-it)
3. [3D models: real models only, free ways to make them](#3-3d-models-real-models-only-free-ways-to-make-them)
4. [Where to change what](#4-where-to-change-what)
5. [Checks](#5-checks) and [store apps](#6-store-apps-ios-and-android)

## 1. Rules

### 1.1 Hard rules (breaking one of these has cost us work before)

1. **Never edit `index.html`.** It is generated. Edit `src/game/*.js`, `src/css/*.css` or `src/index.html`, then run
   `node tools/build.cjs`. A past session lost all 27 heroes because work went into `index.html` and a rebuild
   overwrote it.
2. **`src/game/*.js` is one shared scope.** The build joins the files in number order. Never declare the same top-level
   name twice; setup code must come after what it uses. New file? Pick a number that puts it after its dependencies.
3. **No 3D objects built from code.** Characters, monsters, bosses, pets, props, buildings, landmarks and weapons are
   real 3D model files (glTF) in `assets/`. No `BoxGeometry`/`CylinderGeometry` sculptures, no "procedural hero",
   no primitives stacked into a house. Code geometry is only allowed for: VFX (particles, trails, rings, decals, the
   gas wall), invisible helpers (colliders, picking), and the existing temporary fallbacks that show until a model
   loads. Remaining primitive fallbacks (lava pools, dungeon floor, volcanic horizon) are debt to replace
   with models, not a pattern to copy. See section 3.
4. **Saves never break.** Players must never lose gear or progress. Any change to the save format goes through
   `sanitizeProfile` in `src/game/22-profile.js` with a migration for old saves.
5. **No pay-to-win, no paid loot boxes.** Chests/cases are only earned in play, never sold for money or any currency,
   and always show their odds. Heroes unlock through play (Level Road, bosses, shrines, feats, dungeons), never money.
   The premium currency hook stays at zero.
6. **Only art we may ship.** Our own concepts, CC0 (Quaternius, KayKit, Kenney, Poly Haven), MIT/Apache generators,
   or CC BY with the credit added. Never ship other artists' work (reference images, ArtStation, Pinterest, game rips)
   without their name and written permission. Every new third-party source is credited in `assets/world/CREDITS.md`
   (or the matching credits file) and, if the licence asks for it, on the in-game Credits screen
   (`creditsPanel` in `src/game/63-menus.js`).
7. **Don't bring back what was removed on purpose** (unless Casper asks): the HIT/melee button
   (`#bMelee { display: none }`), held weapons on heroes, worn gear pieces and gear sparkle on heroes, painted menu
   emblems, hero overlays (ascended crown, wings, aura, trail), emoji glyphs in the UI, the XP feed and tutorial text on
   the HUD.
8. **Party dungeons are the same on every phone.** Everything that shapes a run (halls, corridors, events, puzzles,
   monsters, their stats and modifiers, bosses, veins) comes from the leader's seed in `src/game/36b-delve.js`: use the
   seeded `rng`, `seededShuffle` and `withSeed`, never `Math.random`, and never `Array.sort` with a random comparator
   (Safari and Chrome order it differently, so iPhones and Androids got different maps). Anything that changes during
   the run (gates, puzzle steps, boss attacks, kills) is sent to the party. `tools/check_delve.cjs` guards this.
9. **Never commit secrets.** No tokens, API keys or passwords in code, docs or commit messages. The Supabase anon key
   in the client is public by design; nothing else is.

### 1.2 Phone first

The game is played on phones. Every change must work there.

- **It is an app, not a browser game.** The product is the iOS/Android store app (Capacitor, section 6); the web page
  on GitHub Pages is for testing and sharing builds. Make design, performance and settings decisions for the app (a
  native web view, full screen, no browser bar), and don't add advice or UI that only makes sense in a browser.

- Twin-stick touch: left thumb moves, right thumb aims. Moving and pressing any button must work at the same time
  (multi-touch, one pointer id per control). Don't add controls that need two hands on one side.
- Buttons are at least 44 CSS px. Respect the safe-area insets (`--sat`, `--sar`, …).
- Check portrait 390×844 and 320×568 and landscape 844×390. No horizontal scrolling, nothing cut off.
- Performance budgets (town): about 600k triangles including shadows, ~190 draw calls. Townsfolk ~9k tris, heavy
  monsters ~11k, landmarks ~10k, repeated props 2-4k. Textures 256 (LODs) / 512 (most) / 1024 (bosses, arena, Rift).
  Target 60 FPS on a mid-range phone. Anything heavier needs an LOD or a reason.
  Sets of many props are cut into cells (`cell` in `WorldModels.place`, 64 m default, 32 m trees, 24 m dungeon
  pieces) so far ones are skipped; trees cast their shadow from their LOD (`shadowOnly`).

### 1.3 One style

#### UI (menus, HUD, icons)
- **Pixel-art UI over a graded 3D world.** One font: Tiny5 (`var(--body)`, `var(--og-font)`; served as the family
  'Arena Numerals' in `src/css/main.css`, never faked bold). Pixelify Sans is only its fallback: it drew 5 like S, 2 like
  Z, B like 8 and C like O (Casper, 25 Oct). No other fonts, no emoji.
- Dark stone pixel panels with bevels, stepped corners and a 2-3 px ink outline (`--og-ink`); bone-white highlights.
  No gold gradients, medallions or Greek borders.
- Buttons: the "deep neon" look in `src/css/ui-v2.css` (light-to-dark gradient over the button colour, soft glow in
  its own colour). Thumb controls use natural tones (steel-teal dash, moss skill, element-tinted special, bronze super).
- Rarity colours come only from the tokens in `ui-v2.css` (`--r-common` … `--div`). Don't hard-code new hex values for
  rarities.
- Icons: 32×32 pixel icons, element-coloured, with an ink outline. Every new resource, tab or button gets its own icon
  in that style.
- **No walls of text in tabs** (Casper, 22 Oct). A tab shows pictures, numbers and a word or two per card; never an
  explanation paragraph or a long list. Any `p.fine` / `p.say` note shows one line and opens on tap (`ui-v2.css`),
  so keep its first words meaningful. Nothing opens by itself in the player's face (no auto popups at startup):
  waiting rewards light a dot or a glow on the button instead. Pages are only as tall as their content: a short page
  sits at the bottom over the dimmed game, never a full screen with empty space below. Exception: the talent tree,
  world map, travel and chest reel always fill the screen (`FULL_PAGES` in `61-panels.js`).
- Menus are pages with a Menu/back button and sub-tabs. New screens follow the existing hub layout
  (Hero / Forge / Gear / Journal).
- `src/css/ui-v2.css` is loaded last and holds the current look. Add new UI styling there (or next to its feature),
  reusing the existing tokens and classes. Don't restyle the whole game in a side file.

#### 3D world and characters
- Painted, hand-painted-texture fantasy (World of Warcraft / RuneScape 3 feel). Adult proportions. Not chibi, not
  realistic PBR, not low-poly flat colours unless it's a recoloured CC0 kit piece that already fits.
- Heroes share one 15-joint humanoid skeleton and the KayKit clips. Extra heads, tails, wings, a village on the
  shoulders: props on bones or VFX, not new skeletons.
- Heroes carry no held weapons until a hero is generated holding its weapon as one mesh.
- Each biome has its own palette (`tools/area_palette.py`, the area art in `assets/ui/areas/`). New props are
  recoloured to the biome they live in.

#### Combat effects
- **"High end" means themed per hero.** Every bullet, its flight, trail, impact, hit reaction and super belongs to that
  one hero's story, props and palette. No generic fireballs, orbs, slashes or recoloured shared effects. The kits are
  written down in `assets/heroes/combat_kits.md`; follow them.

#### Game design
- **Don't overwhelm the player.** Systems unlock gradually (`UNLOCK_AT` in `src/game/61-panels.js`, the skill tree
  opens ring by ring via `TREE_GATE` in `23-skill-tree.js`). New systems get an unlock level and a "New" pulse, not a
  wall of buttons on day one.
- Progression is long and endless (RuneScape/Diablo). Balance numbers live in `CFG` (`src/game/10-config.js`), not
  scattered in code.
- Pets and prestige companions give world bonuses only, never arena power.

### 1.4 Working together across sessions and tools

Several people and AI sessions work on this repo at the same time. The full routine is in
[`docs/TEAMWORK.md`](docs/TEAMWORK.md); in short:

1. **Look first:** `git fetch origin && git checkout -B claude/<topic> origin/main`, then `npm run team` (open PRs =
   work in progress, the files each changes, clashes with yours), [`docs/OPEN.md`](docs/OPEN.md) (the backlog) and
   the newest files in [`docs/log/`](docs/log/).
2. **Claim it:** your first push opens a **draft PR** naming what you'll change. One topic per branch (`claude/<topic>`,
   `wip/<topic>`). Small, requested fixes may go straight to `main` once the checks pass; big or risky work (new
   systems, roster or save changes, mass asset swaps) stays in a PR and Casper approves the merge.
3. **Keep diffs focused.** Don't reformat, rename or "tidy" files you aren't changing. Big shared files
   (`61-panels.js`, `63-menus.js`, `ui-v2.css`, `44-world-view.js`, this README) are where conflicts happen: edit only
   the part you need.
4. **Sync with `npm run sync`:** it rebases on `main` and rebuilds `index.html` (never resolve `index.html` by hand).
5. **Hand over in your own file:** `docs/log/YYYY-MM-DD-<topic>.md` (asked, changed for the player, tested, still open),
   tick/add your lines in `docs/OPEN.md`, commit and push. Never leave work only local; cloud sessions are thrown away.
   Added a hero, system, rule or file? Update the matching part of this README in the same commit.
6. **Commit messages describe what the player sees** ("Skill tree opens ring by ring: …"), not code internals.

### 1.5 Check before you say it works

1. `node tools/build.cjs` after any `src/` edit (`node tools/build.cjs --check` fails if `index.html` is stale).
2. `npm run check` must exit 0. If it rewrites `audit/regression-evidence.json` and that wasn't intended, restore it
   with `git checkout -- audit/regression-evidence.json`.
   `npm run smoke` plays the real game headless (boot, Play, walk, shoot, super, every monster body and world boss
   through every attack, no page errors); it needs Playwright (`npm i --no-save playwright && npx playwright install
   chromium`, or `PW_CHROMIUM=/path/to/chrome`). GitHub Actions runs both on every push and PR
   (`.github/workflows/checks.yml`). Fixed a bug a check could have caught? Add that check too.
3. **Look at it.** Serve the repo (`python3 -m http.server 8766`), open it in a browser (headless Chromium with
   Playwright is fine: `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`), wait for
   `window.__gameBooted`, click `#playBtn`, screenshot at 390×844. No `pageerror` or console errors.
4. Use **×100 test mode** (`?test=100`) to reach late content fast: separate save, never touches cloud or
   multiplayer. Judge pacing at normal speed.
5. Debug hooks in the page: `window.__game`, `__sim`, `__dbg`, `__assets`, `__manifest`, `__heroLab`, `__THREE`.
6. The older browser checks (`tools/check_game_browser.cjs`, `check_*_integration.cjs`) may still expect the retired
   16-hero roster. Fix them or skip them; don't trust their failure blindly.
7. Localhost is a local preview: cloud saves and multiplayer are off there, dev tools are on. Don't point local builds
   at the production cloud save.

### 1.6 Talking to Casper

He writes short, informal messages (Dutch or English, often with typos). Answer briefly and plainly in English,
describing what he will see in the game. If a request is ambiguous ("make the button smaller"), make the most likely
change and say which one you picked. Send a screenshot of visual changes.

## 2. The game: vision and what's in it

### The vision

A **3D fantasy RPG brawler for phones**: Brawl Stars-style twin-stick combat inside a RuneScape/Diablo-style open
world with loot, masteries and endless progression. You start in Base Camp in the middle of an open map of 29 areas
(Zelda-style: every direction leads somewhere, the further out the higher the level), follow the Main Path or roam,
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

### Controls

Left joystick moves. Attack pad: drag to aim, tap to auto-aim, hold to auto-fire. SUPER charges on hits (tap
auto-aims, drag aims with a preview). DASH. Class SKILL and elemental SPECIAL unlock later. AUTO toggles Auto Hunt;
the Fight/Normal chip switches PvP.

### Heroes (27)

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

### World

Base Camp plus 29 areas in 6 biomes (levels 1-210) on an **open map** (World v11, Casper 25 Oct 2026: "like the Zelda
map"): a 6 × 5 grid of 190 m area squares with Base Camp in the middle (`AREA_CELLS` in `11-world-data.js`). The main
path spirals outwards in level order, so most areas border one far above them. Cliffs and woods wall the areas off;
every shared border has one pass (roads run from each area's heart to its passes). A pass between two biomes is a
**Warden Gate**: challenge its warden (a big elite at the level of the higher side) and it stays open for good
(`profile.gates`). Walking into an area far above your level is allowed but shows a red **DANGER** banner, skull posts
stand at passes into much higher areas, and pass labels turn red. The **Main Path** (`profile.quest`) leads through
the areas in level order: travel there, hunt, clear a den (or beat the lair boss in a biome's last area), open the
Warden Gate into the next biome; gold and XP per step, a Treasure Chest per chapter. It shows in the objective tracker,
as a gold beacon in the world and a gold star on the minimap and the world map (a 2D grid of the areas). Monster level
rises the deeper you go into an area from the side the main path enters it. Code: `39d-open-world.js`. Biomes and their
world bosses:

| Biome | World boss |
|---|---|
| Starting Woodlands | Ancient Golem |
| Mountain Peaks | Frost Colossus |
| Volcanic Underworld | Magma Titan |
| Arcane Ruins | Void Colossus |
| Ocean Depths | Abyssal Leviathan |
| Celestial Ascension | Celestial Colossus |

Every area has: two monster kinds (24 generated bodies in `assets/enemy/`, shared and tinted per species; each
monster shows its wind-up in its body and then strikes: slams drop, pounces lunge, sweeps swing through, shooters kick back; every species fires its own pixel projectile and sheds its own pixel particles), monster dens (fast respawn, best XP), a lair with a lair boss and unique item,
a hero landmark, three dungeons (Caves, Warrens, Sanctum), four ore veins and a mine, runestones for a Legendary
Trial, and a lodestone to travel. Elites, timed world bosses (60 s warning, team kits), World Tiers. The world map
(Map button) shows a pixel-art scene per area.

All 26 monster bodies and six world bosses use articulated skeletons with anatomy-specific arms, elbows, legs,
wings, tails or tendrils. The same bodies cover named variants, lair and dungeon bosses. Baked Blender bone-heat
weights live in `assets/animation/enemy-rigs/`; `enemy-motion.js` attaches them once to cached geometry, and
instances share buffers while owning their bones. `enemy-clips.js` supplies 17 animation states: idle, stride,
six attack wind-ups, seven contact/recovery clips (including alternating swipes), hit and death. Warning timers
and attack impulses drive the clips; repeated hits use their real intervals. Existing heroes/townsfolk retain
their authored KayKit clips. Review any body at `tools/preview_enemy_animation.html` on a local server.

To rebake weights: `node tools/export_enemy_rigs.mjs`, then Blender 5.2
`--background --python tools/build_enemy_skins.py` (optional ids after `--`). No rig solving runs on phones.
`tools/check_enemy_skins.mjs` verifies source hashes, joint placement and normalized weights; the browser smoke
checks all 32 bodies, the Panther's three contacts, and all 43 hero models (27 active + 16 legacy) and seven NPCs.

### Systems already in the game

- **Levels:** player level (content to 210, cap 100000, ascensions at 100/150/200). **Level Road:** an item every
  level, a milestone chest every 5th, heroes on the road.
- **Skill trees:** a shared Hero tree from level points, opening ring by ring, plus per-hero masteries 1-99
  (RuneScape style; badges Bronze 10 → Legend 99, capes at 99), keystones, relic slots (3 at 30, 4 at 100, 5 at 150).
- **Gear:** weapon, helmet, chest, boots, accessory. Rarities common → uncommon → rare → epic → legendary → mythic →
  ancient → divine. Reforge/merge with weaker same-slot pieces plus gold/gems (review before spending), protect flag,
  enchant (reroll or boost an affix), sell, salvage, bag of 50. Epic+ loot arrives as a chest opened on a reel.
  Every chest also holds gold, biome materials, Bastion wood/stone(/iron) once the fort is open, gems from the bigger
  chests and a tiny hero chance; better chests roll higher rarities and more named items, low-level chests roll lower
  (`CFG.cases` in `71-cases-idle.js`). Open 5 opens five of the selected kind only.
- **Forge (Garo):** Reforge, Masterwork ranks, Craft (biome ore + monster parts + dungeon cores + Titan Souls;
  5-piece sets with glowing set auras), Forge shop, Enchant.
- **Showdown arena:** 10 fighters vs bots, closing gas, power cubes, trophies. **The Rift.**
- **Bastion Siege** (level 20, the Bastion house west of the plaza): endless waves from 1-4 random sides attack The
  Keep and two wagons, Clash of Clans meets Balloons TD. Build in builder mode (the Build button: the field from above
  with its grid, pan and pinch-zoom, a shop with tabs (Defences, Resources, Walls, Traps) whose strip you swipe sideways; drag a building up out of it and its see-through
  preview follows your finger, drag walls and gates in straight lines, move buildings, a Remove mode to tap or swipe buildings away and Remove all; a Build button sits under the HUD chips in the fort): walls and gates (wood, stone,
  iron; they stop monsters, heroes walk over them), archers, cannons, ballistas, mage towers, barracks, builder huts (one upgrade at a time per hut), traps (spike
  plates, powder kegs, tar pits) and the camp's producers. **The camp pays for itself:** wood (lumber mill), stone
  (stone mine) and iron (iron mine, needed from building level 6) fill up even while you are away; tap one to collect.
  Waves pay hero gold and items plus some of each. **The Keep has 10 levels:** each allows more of every building and
  higher building levels (`CFG.siege.keep`, `towers[t].lim`). After the first start, waves come by themselves with a
  20 s break (Pause/Resume in the builder and on the HUD chip). From level 5 a tower picks one of two paths
  (`CFG.siege.paths`); later waves bring armoured monsters (light shots barely scratch them) and flyers that cross
  walls (only towers with air hit them). Buildings stand on soft earth patches that fade into the ground, get a new look every two levels (7 looks, `SIEGE_TIERS`) and
  their own idle animations. Monsters walk around walls and break the cheapest piece when closed in. The land grows
  with your level to 500×500 m. A fallen Keep restarts the wave it fell on, never lower. Your fort is a shared world:
  friends join with its code, even while you are offline (saved on the server; the player in it longest runs the waves).
- **Dungeon mode** (party dungeons, a mid to late game mode from level 60, 1-4 heroes, bots fill the empty places):
  six dungeons, one per biome, each at its own level (Crypt 60, Frostvault 72, Cinder Halls 88, Sunken Archive 108,
  Abyssal Grotto 135, Starfall Sanctum 170) with its own boss, mini-boss, 5-piece set and rare treasure. A run is 7-10
  halls of mixed sizes (20 m cells to 56 m arenas, a 64 m boss hall). Every hall is guarded: one monster per ~95 m²,
  never closer than ~4.5 m, ranged ones at the back (one behind each pillar), a captain in full halls and patrollers
  that roam; a wake calls only close neighbours, so you can pull them. Event rooms, a mini-boss halfway and a
  three-phase boss whose kit grows each phase (Volley and Ground Slam, then Nova Ring and Charge, then Death Spiral
  and Falling Stones, plus adds and an enrage). 2-3 puzzle halls per run from seven kinds, never the same twice: the
  mural order, the echo (repeat a light show), the race (beat the clock), the balance (lights-out), the twins (find
  rune pairs), the wisp (catch it where it lands) and the riddle (the mural's rune, round after round). Side rooms off
  the main halls (some behind a cracked wall you smash open): a guarded treasure room, a champion's den or a hidden
  rare vein. Every phone in a party sees the same run (rule 8). The first hall is safe (no monsters). Skill pays:
  monsters hit hard but are not sponges, a dash through an attack is a Perfect Dodge (super charge back), a hall cleared
  without a hit is Flawless, and the end chest's grade (S/A/B/C from hits per hall and falls) adds items, rarity and
  gold (`CFG.delve.skill`). Every dungeon chest (here and in the world dungeons) rolls a treasure: gear (with a shot at
  one of the dungeon's two named treasures), ore (biome materials and the dungeon's gem) or a hero (oaths for the
  biome's hidden hero, or a locked hero from a boss chest) (`CFG.delve.treasure`). Garo's Craft tab has a Dungeon forge
  per biome: two named pieces from the dungeon's gem (`CFG.delve.gear`).
- **Dungeons** (a safe first hall, then guarded halls) with Dungeon Keys (tier + affixes, par time) and **Legendary Trials** (sigils, Radiant 1/500 drops).
- **Mining:** ore, pickaxe, geodes for the Museum, a 1/10,000 pet.
- **Daily:** 7-day calendar that never resets, weekly Colossus chest (Journal › Daily; it never opens by itself, the Menu
  button glows while a reward waits).
- **Idle:** Vault (fills while away), Expeditions (benched heroes fetch loot), Auto Hunt (walks, fights and mines by
  itself, calmer and weaker than playing yourself: `CFG.autoHunt`), offline rewards.
- **Pets and prestige companions:** world bonuses only, never in the arena.
- **Multiplayer:** shared open world (one Supabase Realtime lobby), shared monsters and world bosses, opt-in PvP.
- **Saves:** local cache plus cloud save (Supabase). ×100 test mode (`?test=100`) for testing late content.
- **Menus:** 4 hub tiles (Hero / Forge / Gear / Journal), full pages, level unlocks with a white "New" pulse,
  Inventory (chests, resources, gear on one page), item inspect.

### Where we're going next

Current list: `docs/OPEN.md`. The big directions:

1. **Replace every code-built object with a real 3D model** (pets, menu thumbnails, shrines, lava, dungeon floor,
   lair bosses, broken landmarks, modular town houses from the Quaternius Medieval Village kit). See
   section 3 of this README.
2. **Higher-detail art:** unique item icons (96-128 px painted), an icon per craft material, art banners for the hub
   pages, a tall title image.
3. **Secret weapons:** one craft recipe per biome from chest ore + a Titan Soul.
4. **Heroes holding their weapon** (generated as one mesh), then weapons come back on heroes.
5. **Multiplayer growth:** test PvP on two real devices, a first-play name prompt and name filter, room partitioning
   (`mpRoomKey`) when the lobby gets full, sharing shrines, XP orbs, Rift and dungeons.
6. **Phone performance** on real devices (town triangle count, tree and grass density, KTX2 textures for the Pages
   build).
7. **Store release:** native projects, app icon/splash, privacy policy, store accounts, playtested pacing.

## 3. 3D models: real models only, free ways to make them

**Rule:** everything the player sees as an object (heroes, monsters, bosses, pets, townsfolk, props, buildings,
landmarks, weapons, chests in menus) is a real 3D model: a mesh made in a 3D generator or a 3D program, with a
painted texture, stored as a file in `assets/`. Never build it out of three.js primitives (`BoxGeometry`,
`SphereGeometry`, `CylinderGeometry`, stacked `part()` calls, …).

Allowed in code: VFX (particles, trails, rings, beams, decals, the Showdown gas wall), invisible helpers (colliders,
picking), terrain/water shaders, and the short-lived fallback shape that shows while a model downloads.

### Still built from code (replace, don't copy)

These exist today and should be swapped for real models. Pick one up if you're looking for work:

| What | Where |
|---|---|
| Pets and prestige companions (bull, crystal dragon, …) | `assets/art/pet-companions.js`, `assets/art/crystal-dragon.js` |
| Menu thumbnails of gear, chests and daily rewards | `assets/art/premium-models.js` |
| Lava pools, dungeon floor, volcanic horizon (procedural fallbacks) | `src/game/44-world-view.js`, `47-dungeon-view.js` |
| Lair bosses (today: the area's monster scaled ×1.8) | `src/game/39b-lair-bosses.js` |
| Landmarks still to (re)make: volcano (horizon; TRELLIS meshed its lava glow as flat walls, 21 Oct), rift_pylon, rift_gate, arena_wall, dungeon_tile | `assets/world/<name>/` |

### The look a model must have

- Hand-painted texture fantasy (World of Warcraft / RuneScape 3). Readable silhouette from the top-down game camera.
- Adult proportions for heroes and townsfolk. Front-facing T-pose or A-pose for anything that gets rigged.
- One mesh, no floor slab, no floating bits, no baked background. Texture painted, not photo-realistic.
- Colours fit the biome it lives in (`tools/area_palette.py`, `assets/ui/areas/`).
- Budgets: townsfolk ~9k triangles, heavy monsters ~11k, heroes ~15k before simplification, landmarks ~10k, repeated
  props 2-4k. Textures 512 (most), 1024 (bosses, arena, Rift), 256 (LODs).

### Free ways to get a model (no Hugging Face account needed)

Use them in this order: the first ones need no attribution and have no limits.

1. **CC0 kits (free, no credit required, best quality per triangle).** Quaternius (quaternius.com: Stylized Nature,
   Fantasy Props, Medieval Village MegaKits, monsters, animals), KayKit (kaylousberg.itch.io: dungeon, adventurers,
   skeletons), Kenney (kenney.nl), Poly Haven (polyhaven.com, CC0 models and textures). Already used for trees, rocks,
   town props and fences. Convert with `tools/v11_kit.cjs`, combine parts with `tools/v11_compose.cjs`, recolour per
   biome with `tools/v11_recolor.py`. Still credit them in `assets/world/CREDITS.md` (we do it anyway).
2. **Make it in Blender (free).** Model, UV-unwrap and hand-paint the texture, export glTF 2.0 (`.glb`). Fully ours.
3. **TRELLIS.2 (MIT licence) on your own machine or a free cloud GPU.** The same generator our pipeline uses:
   github.com/microsoft/TRELLIS.2. Needs a large NVIDIA GPU (check the README for the current VRAM requirement; a free
   Colab/Kaggle GPU may be too small). Settings that worked: resolution 1024, seed 7, input = front view on a plain
   grey background. Output is MIT: we own it, credit TRELLIS.2.
4. **Free Hugging Face Space without logging in.** The TRELLIS.2 Space on huggingface.co works anonymously, but the
   free GPU time is only a couple of minutes a day (a free account gets a bit more). Fine for one or two models.
5. **Free tiers of web generators (Meshy, Tripo3D).** Usable, but read the terms first: on free plans the models are
   public and licensed CC BY 4.0, so we must credit the service in `assets/world/CREDITS.md` and on the in-game Credits
   screen. If the terms say non-commercial or don't allow download, don't use it.

**Don't use:** Hunyuan3D (its Tencent licence excludes the EU, UK and South Korea, and we're in Belgium), any
generator or kit with a non-commercial (NC) licence, models ripped from other games, Sketchfab models that aren't
CC0/CC BY, and any concept image made from another artist's work.

#### Keep it "OG fantasy", not AI-looking

Casper wants the classic hand-painted MMORPG feel (World of Warcraft 2004, RuneScape), never the glossy, over-detailed
AI look. Every prompt starts from the same style words and every result is judged against them:
- Prompt: *"hand-painted fantasy game asset (or: spell effect) for a classic MMORPG like World of Warcraft 2004, bold
  painterly brush strokes, stylized, …, plain flat grey background (effects: pure black background), no text"*. One
  subject, the game's three-quarter view, the biome's or hero's palette (`combat_kits.json` `palette`).
- Reject and regenerate: photo-real fur, glass or skin, plastic shine, noisy micro-detail, modern objects, symbols that
  read as real-world signs (a red ring with a slash), lettering where none belongs, extra limbs, floors or backdrops.
- Effects are pixel art like the rest of the game's effects, not smooth cartoon art and not built from shapes. Hero
  effects live in `assets/fx/hero/` (listed in its `index.json`, played by `hero-fx-v6.js`): `super_<hero>` is a
  generated picture (`assets/concepts/hero_fx/`) baked by `tools/bake_hero_fx.py` into 16 pixelated frames (coarse grid,
  the hero's own palette, 4x4 ordered dither); `hit_<hero>` is the basic attack's pixel burst from
  `tools/bake_hero_hits.py` (one burst style and colour per hero), or from a picture when one exists; `ammo_<hero>` is
  the projectile sprite (picture on magenta, cut out, ink outline, 4 tumble frames).
  Shared combat effects (explosions, hits, impacts, crits, novas, rings, slashes, poofs, shatters, zaps, flames) and
  every monster's burst are painted too: pictures in `assets/concepts/fx_gen/` baked by `tools/bake_fx_gen.py` into
  `assets/fx/gen/` (missing colour themes and the monster bursts are repainted from a donor picture through a colour
  ramp); monster particles come from `assets/concepts/mob_bits/` (`tools/bake_mob_fx.py --bits`).


Draw it yourself, paint over a blockout, or use an Apache/MIT image model run locally or on a free tier (Z-Image
Turbo, Apache-2.0, is what we used). Existing concepts are in `assets/heroes/concepts/` and `assets/concepts/`; reuse
them first. The prompt should ask for: one object, front view, T-pose/A-pose for characters, plain grey background,
hand-painted fantasy game asset, no text. Z-Image's safety filter rejects some words (dark, shadow, ash, burnt,
storm…): reword.

### From model file to game

All tools live in `tools/` and work on a normal `.glb`, wherever it came from.

**World props, buildings, landmarks (static):**
1. `FLAT=1 node tools/v10_prop.cjs in.glb …` (clean, drop ground slab, normalise) or `node tools/v11_kit.cjs` for kit
   models.
2. `python3 tools/v4_pack.py --static …` → `assets/world/<name>/model.json` + `.webp` textures.
3. Always after packing: `node tools/v12_simplify_packed.cjs`, `python3 tools/v12_compact_packed.py`,
   `python3 tools/v12_optimize_world.py` (shared textures in `assets/world/_tex/`, size caps), then
   `node tools/v10_boxes.cjs` to refresh `WORLD_MODEL_BOX` in `src/game/48-world-models.js`.
4. Review with `node tools/v10_sheet.mjs` (contact sheet) and in the game.

Naming: `tree_oak_1..3` are variants of `tree_oak`, `_lod_` marks the far version; base names pick variants
automatically.

**Heroes (rigged):** concept → mesh → `tools/v6_rig_all.sh <id>` runs clean (`v4_clean.cjs`), floater removal
(`v6_islands.cjs`), pose detection (`v4_pose.py`), weights (`v4_heat.py`), the shared 15-joint skeleton
(`v4_assemble.cjs`), pose check (`v6_posecheck.mjs`, look at the contact sheet yourself), quantise + pack →
`assets/hero-v6/<id>/`, then portraits (`v6_portraits.mjs`). Register it in `assets/data/heroes-v6.js`.
Intermediates go in `tools/.gen/` (not shipped).

**Monsters / pets:** same as heroes when they fit the humanoid skeleton; otherwise pack them static and animate with
the existing bob/sway code until a rigged version exists. Look at how `assets/enemy/` is laid out.

### Owner's Hugging Face pipeline

Casper's own batches run through GitHub Actions on the `asset-pipeline` branch (`pipeline/gen.json`, repo secret
`HF_TOKEN`, outputs on `asset-drop`). Only use it if Casper asks you to; it spends his daily GPU quota. Never copy the
token anywhere. `asset-pipeline` and `asset-drop` are tool branches with their own history: never merge them into `main`
and ignore GitHub's "Compare & pull request" banner for them.

### Licences we ship (keep this list true)

TRELLIS.2 MIT · Z-Image Turbo Apache-2.0 · KayKit CC0 · Quaternius CC0 · game-icons.net CC BY 3.0 (named on the
Credits screen) · fonts Tiny5, Pixelify Sans, Rubik OFL 1.1 (`assets/fonts/OFL-*.txt`). Anything new gets added here, to `assets/world/CREDITS.md`, and to the Credits screen if its licence
needs attribution. Keep concepts, `tools/.gen/`, rejected meshes and zips out of the shipped `www/`.

## 4. Where to change what

The game is one shared script cut into files by system. `node tools/build.cjs` joins `src/game/*.js` in name order (the number prefix is the order) into the module script of `index.html`, and inlines `src/css/`. All files share one scope: a name declared in one file can be used in any later file, so don't declare the same top-level name twice, and keep setup code after whatever it uses.

| To change… | Edit |
|---|---|
| Balance: stats, timings, economy, quality tiers | `src/game/10-config.js` (`CFG`) |
| World map, areas, biomes, zone levels | `src/game/11-world-data.js`; how the world looks: `44-world-view.js` (the ground shader `matGround`: zone floor styles, painted tiles from `assets/world/_ground/` loaded by `loadGroundTiles`, cloud shadows, grass wind, frost twinkle, lava pulse, seabed light) |
| Townsfolk models, buildings, caves, ore, dungeon pieces, world bosses (generated 3D, instanced) | `src/game/48-world-models.js` (`WORLD_MODEL_BOX`), `assets/npc/`, `assets/world/`; placement: `44-world-view.js`, `47-dungeon-view.js`; prep: `tools/v10_prop.cjs` + `tools/v4_pack.py --static` |
| Bloom, grading and soft shadows (High graphics + Cinematic effects) | `src/game/46-camera-quality.js` (`Post`) |
| Monsters (stats, drops, which body they use) | `src/game/12-monsters.js`; behavior: `33-world-sim.js`; looks: `43-enemies-view.js` |
| Heroes, attacks, supers | roster `assets/data/heroes-v6.js` (`HEROES_V6`), ammo/impact art `assets/data/hero-fx-v6.js`, supers `assets/data/hero-supers-v6.js`; roles, badges, tree node kinds `src/game/13-brawlers.js`; models `41-assets.js` (`ASSET_MANIFEST`), `assets/hero-v6/` |
| Skill trees | `src/game/23-skill-tree.js`; screen in `63-menus.js` |
| Dungeons, keys, Legendary Trials / Mining, Museum / Daily, Colossus / Crafting / Lair bosses / PvP | `36-dungeon.js` / `37-mining.js` / `38-daily.js` / `39-crafting.js` / `39b-lair-bosses.js` / `72-pvp.js` |
| Open world: Warden Gates, danger warning, routes through passes, the Main Path quest (`CFG.openWorld`) | `src/game/39d-open-world.js`; layout (area squares, passes, roads, walls, POI placement) in `11-world-data.js`; walls, gates, skull posts and the quest beacon in `44-world-view.js`; check `tools/check_open_world.cjs` |
| Items, rarities, merge, salvage, forge | `src/game/21-items.js`; inventory and loot rolls: `32-progression.js` |
| Cases, Vault, Expeditions, Auto Hunt | `src/game/71-cases-idle.js`; named collection drops: `assets/data/loot-collection.js` |
| Pets, prestige | `assets/data/companions.js`, `assets/data/prestige.js`; pet models: `assets/art/pet-companions.js` |
| Save format and migrations | `src/game/22-profile.js` (`defaultProfile`, `sanitizeProfile`) |
| Cloud save (Supabase) | `src/game/81-cloud-save.js` |
| Combat, projectiles, damage | `src/game/31-combat.js` |
| Arena (Showdown), Rift | `src/game/34-arena.js`, `33-world-sim.js` |
| Dungeon mode (party dungeons): dungeons, difficulties, power gate, rooms, events, loot, set bonuses | `src/game/36b-delve.js` (`CFG.delve`); event-room props: `47b-delve-view.js`; parties, random match, the Dungeons panel and HUD: `73-party.js`; bots that fill a party up to four: `36d-delve-bots.js` (`CFG.delve.bots`); boss attack kits per phase: `36e-delve-boss.js` (`CFG.delve.bossKit`); banners `assets/ui/delve/`, set pieces `assets/world/delve_*` |
| Bastion Siege (tower defense from the Bastion house in town): the grid, building, walls and pathing, waves and sides, objectives, builders, the permanent fort save | `src/game/36c-siege.js` (`CFG.siege`); looks: `47c-siege-view.js`; builder mode: `75-siege-builder.js`; menu pictures: `tools/fort_icons.mjs` + `.py` → `assets/ui/fort/`; save: `profile.fort` via `sanitizeFort` in `22-profile.js`; shared worlds (codes, host, sync): `74-siege-mp.js` + `supabase/bastion_worlds.sql`; checks: `tools/check_siege.cjs` |
| Multiplayer lobby (Supabase Realtime), future partitioning (`mpRoomKey`) | `src/game/70-multiplayer.js`; notes in `docs/UNFINISHED.md` |
| HUD | `src/game/60-hud.js`; minimap: `drawMinimap` in `62-events-fx.js` (world, arena, Bastion, Rift, and the dungeon map `drawDungeonMinimap`) |
| Panels, settings, button actions (`data-act`) | `src/game/61-panels.js` (`handlePanelClick`) |
| Menus, skill-tree screen, credits | `src/game/63-menus.js` |
| Effects for hits, kills and events | `src/game/62-events-fx.js` (`processEvents`); particles and sprite FX: `45-fx.js` (painted sheets from `assets/fx/gen/`, `tools/bake_fx_gen.py`); each monster species' own projectiles, pixel particles, bursts and death: `45b-mob-fx.js` (`MOB_FX`, art baked by `tools/bake_mob_fx.py` into `assets/fx/mob/`) |
| Sound: engine, buses, music crossfade, synth fallback | `src/game/50-audio.js` (`Sfx`, `Music`); which sound files exist and their bus/volume/voice caps: `49-audio-data.js` (`AUDIO_MANIFEST`), files in `assets/audio/` |
| Touch and keyboard controls | `src/game/51-input.js` |
| Camera, adaptive quality, pixel-art pass | `src/game/46-camera-quality.js` |
| Game loop, startup, 120 Hz frame cap (standard; Options › 60 FPS caps at 60). Frames between the 60 Hz sim steps are interpolated: `Interp` | `src/game/80-main-loop.js`, `90-boot.js` |
| Page markup, head, styles | `src/index.html`, `src/css/main.css`, `src/css/panels.css`; the current menu look and the Menu size zoom: `src/css/ui-v2.css` (loaded last) |

After editing: `node tools/build.cjs`, then run the checks.

## 5. Checks

`npm run check` runs `tools/check_release.cjs` (which also fails when `index.html` was not rebuilt), `check_test_mode`, `check_companions`, `check_gameplay`, `audit/checks.cjs` and the system checks (dungeons, Bastion, delve, mining, daily…). `npm run smoke` (`tools/check_smoke.cjs`) is the browser smoke test; CI runs all of them on every push and pull request. Browser checks (`tools/check_game_browser.cjs` and the other `check_*_integration.cjs`) need a server on port 8766 and Playwright. Assessment: [audit/REPORT.md](audit/REPORT.md). Current implementation and release gates: [audit/PHASE1.md](audit/PHASE1.md). Map and pace of the 1-210 world: [audit/world-v9.md](audit/world-v9.md).

## 6. Store apps (iOS and Android)

The apps are Capacitor shells around `www/`, filled by `node tools/build.cjs --app`. The current copy rules exclude
`assets/concepts`, `assets/hero-v5`, audit and tools; the remaining tracked assets and vendor files total about
210 MiB before the page and native packaging (23 Oct 2026). Remeasure the actual release build and review unused
assets before submission; the earlier ~72 MB estimate is outdated.

1. Once: `npm install`, then `npx cap add ios` (needs a Mac with Xcode) and `npx cap add android` (needs Android Studio).
2. Each release: `npm run app` (build `www/` and copy it into both native projects), then build and upload from Xcode / Android Studio.
3. 120 Hz on iPhone: iOS holds apps at 60 Hz unless `ios/App/App/Info.plist` has
   `<key>CADisableMinimumFrameDurationOnPhone</key><true/>` (add it once after `npx cap add ios`). Whether the web view
   then gives the game 120 must be checked on a ProMotion iPhone with Options › Show FPS ("screen 120 Hz"). Android
   follows the phone's display setting.
4. Before the first upload: set your final `appId` in `capacitor.config.json` (it can't change after release), make a 1024×1024 app icon and a splash image and run `npx @capacitor/assets generate`, and add a privacy policy URL (the game sends a device id and the save to Supabase).
