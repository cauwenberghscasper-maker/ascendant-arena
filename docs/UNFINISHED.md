# Chests: Open 5 per kind, resources in every chest, rarity by chest and level (18 Oct 2026, branch `claude/chest-rewards`)
Casper: Open 5 opened every kind of chest; chests should give resources and gear (and heroes); better chests more
special items, low-level chests lower rarity.
- **Open 5** (`openCasesFast`) only opens the selected kind; the button shows ×N of that kind, "Open N more" too.
- **Rewards** (`caseLoot`, replaces `caseBonus`): every chest gives its gear piece plus gold (~0.3 h of Bank income ×
  `res`), biome ore + monster part, Bastion wood/stone (iron from Treasure up) once level 20, gems (always from
  Treasure up, 30% below), a 4% six-hour gold jackpot and a hero chance per kind (`CFG.cases[k].hero`, 0.2-1%).
- **Rarity:** new weights per kind (Hunter/Geode low, Treasure mid, Colossus/regional high, Rift highest). Epic and up
  shrink below about level 60 (`caseLevelMul`). The Legendary guarantee only counts chests with at least 5% Legendary
  (`casePity`). Named item chance per kind (`named`: 30% Hunter → 65% Rift) on top of the normal named roll.
- **Open:** balance not playtested; check the resource amounts feel right next to Bastion wave pay.

# Bastion: Clash of Clans + Balloons TD (18 Oct 2026, branch `claude/bastion-coc`)
Casper: shop didn't scroll, drag should show the building on the board, limits per tower kind, camp resources, straight
wall lines, auto waves after the first start with time to upgrade, smaller models with looks per level and animations,
a CoC + Balloons TD mix. Agreed: only camp resources, ~20 s break with a pause, 7 looks, plus Balloons TD paths/monsters.
- **Builder (`75-siege-builder.js`):** the shop has tabs by kind (`BD_CATS`: Defences, Resources, Walls, Traps, each with
  built/allowed); its strip (`#bdList`) is scrolled by hand (the builder layer has `touch-action: none`, which
  killed native scrolling), with a glide. Drag an item up out of the strip: the preview stands just above the finger
  and is built on release where it fits (red stays to be dragged; Place). A press on the preview drags it. Walls/gates:
  drag a line, it locks to a row or column, shows count and price, builds on release (`builderLinePlan`). Tapping a
  mill/mine with something in it collects; tapping the Keep opens its panel. Fixed: the preview set was registered at
  the origin, so it never streamed in.
- **Resources (`CFG.siege.res`, `fortCost/fortPrice/fortPay`):** wood/stone/iron in `profile.fort`; no hero gold for
  building. Producers `mill` (new), `mine`, `iron` (new, Keep 4): `make/rate/cap`, `fortMade`. Iron from building level 6.
  Waves pay `CFG.siege.pay(n)`. Bubbles over full producers (HUD tags). Pixel icons `ICON.wood/stone/iron`.
- **Keep levels (`CFG.siege.keep`):** 10 levels, limits `towers[t].lim`, max building level `keep.lvl`, upgrade op
  `{ o: 'keep' }` (builder + time), sturdier Keep/wagons. Panel `openFortKeepPanel`.
- **Auto waves:** `F.go` once wave 1 was started, then 20 s breaks; `F.hold` pauses (op `{ o: 'hold' }`, builder buttons
  and the `#fortChip` HUD chip). Builder mode no longer freezes the fort; it stays open during waves.
- **Balloons TD:** paths at level 5 (`CFG.siege.paths`, `b.p`, `siegeStats`): Volley/Longbow, Mortar/Fire Cannon,
  Repeater/Sky Piercer, Frost/Storm, Shield Wall/Berserkers. Armoured monsters from wave 6 and flyers from wave 8
  (`siegeComposition`, `siegeDmgMul` hooked into `dealDamage`): light shots ×0.2 on armour; flyers skip walls,
  warriors and traps, only `air` towers hit them; mirrored to guests (flags 8/16 in 'fst').
- **Save:** `sanitizeFort` keeps everything; old forts get the lowest Keep level that holds what they built
  (`fortKeepFor`), a stock of wood, `go` if they held waves. Shared worlds carry keep/kd/go/hold and paths.
- **Looks and animations (`47c-siege-view.js`):** buildings at 0.75 size; 7 looks at levels 1/3/5/7/9/11/13
  (`siegeModelName`): uses `siege_<kind>_t2..t7` when that model exists, else the best lower one tinted toward the
  look. Idle life per kind (`animateSiegeIdle`): banners flutter, saw strokes + sawdust, mine dust / iron sparks, mage
  motes, huts hammer while a builder works, idle cannons/ballistas scan and smoke, scaffold dust while upgrading.
- **Open:** the 56 TRELLIS models in `tools/bastion_tiers.json` (6 looks × 9 kinds + base mill and iron mine) are not
  made yet: Casper's ZeroGPU quota was used up today. Until then mills use the hut model and iron mines the mine model
  (tinted), and the shop pictures `mill.webp`/`iron.webp` are tinted copies. Once made: pack, `v10_boxes.cjs`, rerun
  `tools/fort_icons.mjs`; nothing else changes. Balance (costs, rates, limits) is not playtested; try drag and pinch on
  a real phone.
# Dungeon makeover phase 2: lever and plate puzzles (18 Oct 2026, branch `claude/dungeon-puzzles`, PR to main)
Phase 1 (bigger halls) is merged. Phase 2 (`36b-delve.js` `delvePuzzleMake`/`stepDelvePuzzle`/`delvePzSet`, `CFG.delve.puzzle`;
looks in `47b-delve-view.js` `buildDelvePuzzles`):
- **Puzzle halls:** 1 per run on Normal/Hard, up to 2 from Heroic (always one plain fight hall left). 4 seals (5 from
  Heroic) round the hall, a mix of floor plates and lever stones (`rune_obelisk` model, solid). Each seal floats its own
  pixel rune; a floor mural between two standing stones by the entrance shows the runes in order with arrows. Normal and
  Hard sometimes number the seals with pips (1-5 dots) instead. Every dungeon names its puzzle (Root Seals, Frost Runes,
  Forge Valves, The Lost Index, Tide Shells, Star Sigils).
- **Play:** stand on or by a seal for 0.6 s to wake it (no extra button). The right one glows in the dungeon's colour and
  its rune rises; a wrong one resets the lot, flashes the hall red and bites back: a spike burst under the heroes, next
  time a pack of three crawls out (in turn). After a reset you must step off a seal before it counts again. The gate opens
  only when every seal is awake.
- **Bots:** they never wake a wrong seal; once a hero woke the first one right, the first bot walks to the next seal
  after 2 s each (`botWait`). Solo: you find the first, the bots finish it (~10 s in the browser test).
- **Party:** every game watches every hero on the seals; steps and fails also go out as 'dpz' (first game wins, never
  backwards), so the seals and punishments match on all phones.
- Checks: `tools/check_delve.cjs` (order, wrong seal resets with spikes then a pack, no repeat while standing, gate
  waits, 'dpz' sync). Browser: frost puzzle solved with bots, no errors.
- **Dungeons menu scroll fixed:** the panel redrew itself every second, which stopped a swipe on phones and threw the
  difficulty strip back to the start. Now it only redraws when something on it changed, never within 1.5 s of a touch or
  scroll, and keeps the strip's position (`openDelvePanel`, `partyUpdate` in `73-party.js`).
- **Open:** try on a phone (are the runes readable at phone size? the mural is ~1.7 m tiles); a dungeon-specific seal
  look (today one rune set tinted by biome); maybe make bots wait longer on harder difficulties. Next: phase 3 (enrage
  over time + smarter attack patterns).

# Dungeon makeover phase 1: bigger halls, longer runs (18 Oct 2026, branch `claude/dungeon-makeover`, PR to main)
Casper: the halls were too small for four heroes and runs too short (goal about 5 minutes). Plan agreed in chat, six
phases (1 sizes + run length, 2 lever/plate puzzles, 3 enrage + smart patterns, 4 three new monsters per dungeon,
5 hidden rooms + secret mini-boss, 6 dungeon ores + a quality-reel end chest). Phase 1 done (`36b-delve.js`, `CFG.delve`):
- **Halls:** mixed sizes: cell 20 m, hall 30 m, gallery/long hall 44×24 m, chamber 38 m, arena 56 m; start hall 26 m;
  boss hall 64 m; corridors 10 m long, 6 m wide. Runs have 6 (Normal) to 8 (Mythic, Ascendant) halls before the boss.
  Bigger halls get braziers along every wall and more pillars as cover. The run area (`D.span`) follows the layout.
- **Packs:** monsters stand in packs of 3-4 (elites 1-2) that wake together; one pack per 320 m² (`packArea`, 1-7 packs).
  Party-dungeon monsters no longer give up the chase and heal back (no leash; the halls keep them in).
- **Mini-boss** halfway (`m.mini`, name per dungeon in `CFG.delve.dungeons[].mini`, `CFG.delve.mini`) with two guard packs.
- **Boss in three phases** (`CFG.delve.boss`): HP ×2.4, adds at 66% and 33%, the last phase is faster and hits harder,
  with a "Phase n of 3" banner.
- **Bots** stay within 12 m of the leader in the big halls, and never aim at monsters behind a shut gate (they used to
  shoot the bars forever when a monster stood behind them; seen in the timing runs).
- **Lighter models** (all dungeons, the fort and the town): `dwall` 9272 → 2600 triangles, `brazier` 4859 → 1600, `pillar`
  6362 → 2980 (meshoptimizer, same vertices/UVs/textures). A big hall now draws ~0.9-1.1 M triangles (shadows and post
  included) where the old small halls drew ~1.7-1.9 M.
- **Pace:** a run now asks ~1.9× the monster health of the old one (the boss ~1.7×) over ~4× the floor, plus longer
  walks. Measured headless with a reference hero (level = dungeon level, Rare gear, no talents) and 3 bots: that party
  is far too weak for absolute times (on the live version too it needs >10 min and dies without help), so tune
  `packArea`, `boss.hp` and `mini.hp` after Casper times a real run on his phone.
- **Open:** time a run on a phone (goal ~5 min); a hero in plain Rare gear can't survive Normal (existing balance,
  `CFG.dungeon.dmgMul` and the 4-hero HP of `hpParty`); the camera shows ~25 m, so the 56-64 m halls need the minimap
  (it still shows the open world inside dungeons). Next: phase 2 (lever and plate puzzles).

# Dungeon gates open for everyone at once (18 Oct 2026, on `main`)
Casper: in a party the gates opened at different times per phone after a room was cleared. Each game decided by
itself from its own copy of the monsters, and a death only reaches you when the monster's owner sends it (and only
while you stand near). Now the first game that sees a room done opens the gate and sends 'ddoor' (`delveDoorOpen` in
`36b-delve.js`); the others open that gate (and any before it) right away, drop the monsters still standing there and
skip the leftover swarm waves (`delveDoorRecv`; event monsters keep syncing themselves). Check added in
`tools/check_delve.cjs`. Open: try it on two phones.

# Dungeons: play again needs a yes (18 Oct 2026, branch `claude/dungeon-again`, PR to main)
Casper: after a run the leader could pull the party straight back in. Now going into a run uses up a member's Ready
(`dgo`/`mmgo` set `PARTY.ready = false`). When someone hasn't said yes, the leader's button is "Ask the party to play"
(`partyAsk` → 'dask'); each member gets a "Play again?" popup once (`openPartyAsk`, shown after the chest or right away)
with Accept/Decline (`partyAnswer` → 'dans', Accept = Ready); a decline tells the leader. When everyone has accepted the
leader's game starts the run by itself (`PARTY.autoGo` in `partyUpdate`). Both messages are in the party filter in
`70-multiplayer.js`. Tested in the browser with simulated peers (member popup + accept, leader ask → auto start with
2 heroes + 2 bots). Open: try it on two phones.

# Dungeon bots (18 Oct 2026, branch `claude/dungeon-bots`, PR to main)
Casper: make the Dungeon mode playable without 4 friends. `36d-delve-bots.js`: a run with fewer than 4 heroes gets bots
up to 4 (`CFG.delve.bots`; the party size, and so monster HP and the plate count, is always 4 with bots on). The game that
starts the run (`startDelve(..., lead)`: you alone, the party leader, or whoever formed a random match) runs them; in a
party it sends them as 'dbot' and the others show them like players (`e.bot`, never shared-monster owners). Bots roam
the room the party is in and pick their own fights (each its own spot on a ring round its monster), shoot what they can
see (`rayLen`), take the plate after the humans' ones, revive anyone down (you, a bot, or a friend via 'drev'), and step
in beside the leader when stuck 3 times or 34 m away. Their level and stats follow the real heroes' average level
(`delveBotScale`, every 3 s). Fixed: friends never got the bots ('dbot' was missing from the party-message filter in
`70-multiplayer.js`). Monsters target the nearest
hero this game runs (`delveTarget` in `stepEnemy`), monster shots/slams hit bots (`forEachTarget`), bots' hits give you
kill credit. Bots have 90% of your HP and 75% of your damage, moved along the level curve to the party's average level (at least
their own level's stats), take no loot.
Tested in the browser solo (follow, fight, room cleared, revive in 2.9 s). Open: a real party with friends (the leader's
bots on the other phones); smarter paths through doors (today: catch-up teleport); bot supers are on, watch them.

# Bastion builder mode (18 Oct 2026, branch `claude/bastion-builder`, PR to main)
- **Crash fixed on `main` (2822acc):** leaving the fort threw in `WorldModels.dispose` (a variant set's handle has no
  meshes, only `multi`) and the fort minimap read a colour the traps had no entry for. Both fixed.
- **Builder mode** (`75-siege-builder.js`, the Build button in the fort): Clash of Clans style. The camera leaves the hero and
  shows the field from above with a grid overlay (`siegeGridOverlay`: checkered cells, a stronger line every 5); one
  finger pans, two pinch-zoom. The bottom strip is the shop (pictures, prices, counts). Pick → tap a cell → the
  see-through preview stands there (green/red) → tap again or Place. Walls/gates: drag to draw. With nothing picked, tap
  a building for its panel, which now has Move (free, any free cells; `{ o: 'move' }` in `fortCheck/fortApply`, also over
  the shared-world host). Your fort pauses while you build when nobody else is in it (`siegeAlone`); Start wave closes
  the mode. The old walk-to-place flow (Done button, draw-while-walking) is gone.
- Menu pictures and the see-through preview (from the previous branch, carried here): see below.
- **Open:** try it with real fingers on a phone (pinch and drag); a "place many" toggle for towers; snapping walls to straight lines.

# Painted ground tiles (18 Oct 2026, branch `claude/ground-tiles`, PR to main)
Casper: the ground felt cheap. Seven seamless hand-painted tiles (Z-Image Turbo, made seamless by
`tools/ground_tiles.py` offset blending; 512 px webp in `assets/world/_ground/`): grass, dirt, snow, basalt (lava
seams), flagstone, seabed, cobblestone. `loadGroundTiles` packs them into one texture array; the ground shader samples
the zone's tile at two scales and angles (no visible repeat), divides by the tile's mean colour and multiplies the zone's
own palette with it, so every area keeps its colours and gains painted detail. Animation: drifting cloud shadows
everywhere, a wind sheen through grass, twinkling frost, lava seams that breathe, light ripples on the seabed (`uTime`,
ticked in `Pixel.render`). Works in pixel-art mode and normal 3D (screenshots of both). Until the tiles load, the old
procedural ground shows. Open: judge on a phone; more tile kinds (a darker forest floor, sand, marble) per area.
# Bastion layout (18 Oct 2026, branch `claude/bastion-layout`, PR to main)
Casper (phone screenshot): the fort was an empty green plane and the buildings were hard to see. Now (`47c-siege-view.js`):
- **Land:** the town's painted meadow shader (`matGround`, grass style) over the whole land, rolling hills past the edge;
  flagstone courtyard round the Keep; dirt paths from each side's gate to the courtyard (decals); tufts, flowers and
  mushrooms near the Keep (hidden under buildings, `siegeDecorHide`); a forest ring (oak + far LOD, rocks, bushes) just
  outside the land, placed as one set per model so WorldModels' 64 m cells cull it.
- **Monster gates:** a gatehouse at the middle of each side; waves now come through that side's gate (`siegeSpawnPoint`)
  and the ground before it glows red for the coming wave's sides. Gate cells are kept clear of new buildings.
- **Buildings:** bigger (archer/mage 7.4-7.6 m, cannon 3 m, ballista 3.3 m...), brighter (`bright: 1.3`), and each stands on
  a stone tile with a rim in its colour (instanced decals). Landscape sets are created last so the Keep and buildings
  stream in first (WorldModels builds 2 sets per frame).
- **Traps** (`stepSiegeTraps`): spike plate (hits all on it, resets in 2.2 s, pops up), powder keg (blows a group once per
  wave, refilled when the wave is held), tar pit (half speed + a slow burn, bubbles). Walkable: no path cost, not solid,
  never targeted. Upgrade like walls. TRELLIS.2 models `siege_trap_spike/bomb/tar` (relay `bastion-traps`). Check added.
- **Fun:** pollen and fireflies drift around the camera (additive points).
- **Menu pictures and placing preview:** every building and trap has a pixel-art picture rendered from its model
  (`tools/fort_icons.mjs` renders the simplified glbs in `tools/.gen/bastion/`, `tools/fort_icons.py` outlines them →
  `assets/ui/fort/<type>.webp`), shown in Build and in each building's panel. While placing, a see-through copy of the
  building stands on the ghost square, tinted green where it fits and red where not (`siegePreview`, WorldModels `ghost` option).
  Rerun both tools when a model is regenerated.
- **Open:** Casper's phone showed 30 FPS with "screen 30 Hz" (likely Low Power Mode); check FPS in the fort on a phone
  with a large land; the barracks and builder hut models still need a better generation.

# Bastion update (18 Oct 2026, branch `claude/bastion-update`, PR to main)
Built from `docs/BASTION_PLAN.md` phases 1-3:
- **Wave memory:** `profile.fort.wave` = the wave a run starts on; a fallen Keep restarts that wave, never lower (old saves:
  best wave + 1).
- **Free building:** 2 m grid around the Keep (`siegeLayout`), anything anywhere that fits (no overlaps, not on the Keep,
  wagons, spawn or portal, inside the land). Build button opens the list; a green/red ghost in front of the hero; walls and
  gates are drawn by walking (`stepFortDraw`). New: mage tower, stone mine (stones per hour, tap to empty), builder huts
  (upgrades from level 2 take time and one builder each), walls/gates (wood, stone from 6, iron from 11). Tear down = half
  the stones back. Old pads move onto the grid at the same spots, plus a free hut (`sanitizeFort`).
- **Pathing:** one Dijkstra map from the objectives (`siegeFlow`, lazy); buildings cost their `path` value to cross, so
  monsters walk round open walls and break the cheapest piece of a closed ring. Fallen buildings come back after the wave.
- **Land and waves:** land half-size 30 m at level 20 → 250 m at level 200 (`CFG.siege.land`), spawns at the edge, a
  march speed-up far from the fort, camera zoom ×1.3, minimap shows 120 m around you and the coming sides. Sides 1-4 per
  wave (1 for waves 1-2), Siege Lord every 10th wave, a Siege Captain mini-boss sometimes.
- **Shared worlds:** your fort gets a code on first entry (`create_world`); others join with it in the Bastion house, also
  while you are offline. Supabase table `bastion_worlds` + RPCs (applied, file `supabase/bastion_worlds.sql`; the server
  only lets the wave rise, by 3 per save at most). Channel `fort-<code>`; the earliest player in runs the waves (`fst`,
  `fw`), guests send hits/builds/start-wave to the host; every player gets their own wave pay. Tested with two browsers on
  a fake lobby (the sandbox cannot reach Supabase): sync, guest building (paid by the guest), wave pay for both, host
  hand-over. Local previews and test mode keep worlds in localStorage.
- **Models:** TRELLIS.2 + Z-Image (HF MCP, relay batches `bastion-a`/`bastion-b` on `asset-drop`): `siege_archer`, `siege_cannon`,
  `siege_ballista`, `siege_mage`, `siege_barracks`, `siege_mine`, `siege_hut`, `siege_wall_wood/stone/iron`, `siege_gate`
  (1.2-4k tris, 512 textures). Barracks and builder hut came out with streaky textures and roof holes: regenerate them.
  Stone/iron walls are long models squeezed into 2 m cells (narrow crenels); a 2:1 wall piece would look better.
- **Firing animations** (`animateSiegeDefenders` in `47c-siege-view.js`, Clash of Clans style): each defender winds up before a
  shot (cannon leans back, ballista draws, the mage orb swells), kicks when it fires (recoil along the aim, squash and
  bounce; archer tower bounces with each volley), turns to its target, and shots leave from the model (`SIEGE_MUZZLE`:
  platform, muzzle, rail, orb) with a muzzle effect and sound (`fortShot`). Guests see the same (their towers fire ghost shots).
- **Open:** test on two real phones; the soldier still uses the Smith Garo model (needs a rigged soldier); anyone with a code can build in (or wreck) that fort; balance of costs
  and build times is not playtested; moving a building is not possible (tear down and rebuild).

# Bastion Siege (18 Oct 2026, branch `bastion-siege`, PR #23 to main)
- **Now:** a tower-defense instance like the Rift, entered from the Bastion house west of the town plaza (level 20,
  `CFG.siege` in `src/game/36c-siege.js`, looks in `47c-siege-view.js`). Endless waves come through three gates and attack
  The Keep (run ends when it falls) and two supply wagons, each with a big health bar. Eight stone pads take an archer tower,
  cannon, ballista or barracks (warriors), upgraded to level 15 with gold and Bastion Stones from waves; the fort is saved in
  `profile.fort` (sanitized) and returns every run. Every 5th wave a Siege Lord drops an item. Checks: `tools/check_siege.cjs`.
- **Open:** real models for the cannon and ballista (today the iron `kettle` stands in as a mortar and the purple
  `arena_tower` as the ballista turret); a 32x32 pixel icon for Bastion Stones (shown as text now); a "New" pulse for the
  Bastion house at level 20; balance over many waves is not playtested (`CFG.siege`: tower `dmg`/`cost`/`stones`,
  `lvlBase`/`lvlPer`, objective `mult`); warriors use the Smith Garo townsfolk model until a soldier model exists.
# Dungeon revive: fallen heroes stay visible (18 Oct 2026, on `main`)
A downed hero in a party dungeon used to shrink away (teammates couldn't find them) and the HUD showed "back in 1000000000"
(the run sets `G.respawnT = 1e9`). Now the body stays in its death pose (`downed` in `42-characters.js`), teammates see a
pulsing green revive ring that fills while they stand in it (`updateRings`) and a tag "<name> is down · stand close to
revive"; your own screen says "You are down · wait for a teammate to revive you" ("Your party has fallen…" if nobody is up).
Open: test with two real phones.

# The game is an app (18 Oct 2026, on `main`)
Casper: the game is meant as an app, not a browser game; README 1.2 now says so. iPhone 120 Hz in the app needs
`CADisableMinimumFrameDurationOnPhone` in Info.plist (README 6, step 3); there is no `ios/` project in the repo yet, so
it isn't set. Open: after `npx cap add ios`, add the key and check Show FPS reads "screen 120 Hz" on a ProMotion iPhone.
The 60 FPS hint now gives app advice (Low Power Mode, Limit Frame Rate) inside the app and Safari advice only in Safari.

# 120 Hz standard, Options › 60 FPS (18 Oct 2026, on `main`)
The 120 Hz switch is gone: the game always caps at 120, and Options › 60 FPS (`settings.fps60`) caps at 60 for battery.
Migration `hzVersion` 2: a player who had turned 120 Hz off after it became the default keeps 60; everyone else gets 120.
Fixed with it: new profiles start with `hzVersion` (brand-new saves skip `sanitizeProfile`, so the old marker never
saved and the switch reset on every reload). The Safari 60 Hz hint now sits under 60 FPS (`fps60Hint`).

# Audio (18 Oct 2026, branch `feat/audio`, PR #22 to main)
Done (phase 1 of `docs/AUDIO_PLAN.md`): sound engine. Buses music / ambience / effects / menu, each with a volume
slider in Settings › Sound (saved as `volMaster`, `volMusic`, `volSfx`, `volUi`, clamped in `sanitizeProfile`).
Sample files from `AUDIO_MANIFEST` (`49-audio-data.js`) load lazily as .webm (Opus) with .m4a fallback; until a file
exists the old synth sound of the same name plays. Distance falloff + stereo pan, voice caps (6 mobs, 24 total),
`Music.set(key)` crossfade (old track plays until the new one is decoded), `Music.stinger`, `Sfx.duck`. Audio starts
on the first tap anywhere. Fixed: no sound after unmuting if the app was backgrounded while muted.
Next: phase 2 menu sounds — needs sound files first. Kenney "Interface Sounds", "UI Audio", "RPG Audio",
"Impact Sounds" (CC0) are the best fit; kenney.nl is blocked from cloud sessions, so Casper downloads them and attaches
the zips. Then phase 3 music (needs tracks with a commercial licence). No sound files are in the repo yet.

# Safari 60 Hz hint (18 Oct 2026, on `main`)
iPhone Safari limits web pages to 60 Hz (feature flag "Prefer Page Rendering Updates near 60fps"); a page can't lift it.
Options › 120 Hz now says how to turn that flag off when 120 Hz is on but the browser refreshes the page at 60 (`hz120Hint`).

# 120 Hz by default, frame-rate work (18 Oct 2026, on `main`)
Done: 120 Hz is on by default (old saves switched on once via `hzVersion`, still a switch in Options). Shader error checks only
run on localhost (`renderer.debug.checkShaderErrors`): reading the compile log stalled the frame whenever a new model or effect
appeared. 120 Hz pacing tolerates 1 ms of timestamp jitter and keeps its grid. Show FPS now also prints "screen N Hz", the
refresh rate the browser actually gives the page. Measured load (town, 390x844): ~58 draw calls, ~380k triangles incl. the
1024 shadow map, game JS ~2-3 ms per frame, so a high-end phone is not GPU/CPU bound at 120.
Open: if "screen" reads 60 the browser caps the page (iPhone Safari limits web pages to 60; Android battery saver does too).
The store apps would need native settings for ProMotion (iOS `CADisableMinimumFrameDurationOnPhone`); not set up yet.

# Dungeon team power set very low (18 Oct 2026, on `main`)
Casper's party couldn't enter: `CFG.delve.powK` 1 → 0.05 and the per-hero floor 0.7 → 0 (`src/game/36b-delve.js`); a teammate whose Power hasn't arrived yet no longer counts as 0. Raise them again once parties work on real phones.

# Branch housekeeping (18 Oct 2026, on `main`)
`asset-pipeline`/`asset-drop` are tool branches (own history) and are never merged into `main`; both READMEs now say so.
`wip/enchant-forge` only holds d11b07a, a duplicate of 4815a7a already in `main`: safe to delete (left for Casper).

# Black screen flashes (18 Oct 2026, on `main`)
Done: the bloom pass (Cinematic effects) turned a single NaN/overflowed pixel into a black patch or a black screen.
`Post` now reads any such sample as black (`okc` in `46-camera-quality.js`). Three world models had zero-length normals
(rift_gate, upside_tower, sky_altar), which give NaN pixels on phone GPUs; `fixZeroNormals` in `41-assets.js` repairs
them on load for every model. Open: confirm on a real phone (software rendering here never makes the NaN pixels), and
re-export those three models with clean normals.

# Dungeon mode (18 Oct 2026, branch `claude/serene-franklin-blymcb`, PR #21 to main)
- **Now:** a main mode (menu tile "Dungeons", opens at level 12) next to Showdown. Six dungeons, one per biome (`CFG.delve.dungeons`), each with its own boss and a five-piece set (2- and 4-piece bonuses, `delveSetBonus` in `gearTotals`). Difficulties Normal → Hard → Heroic → Mythic → Ascendant 1, 2, … (endless); clearing one opens the next. Each asks a **team power** (average Power of the party, plus a per-hero floor of 70%), measured against a level-L hero in Rare level-L gear (`refPower`). Monster HP scales with party size (×1/1.7/2.3/2.9).
- **Rooms:** seeded per run (`delveLayout`): mixed hall shapes, pillars, dark halls, fight types (guard, 3-wave swarm, elites) and event rooms (gold goblin vault, cursed altar, pressure plates, spike hall, echo shrine, mimic chest, moonwell). Doors open strictly in order. Loot is each player's own roll; weekly first clear per difficulty gives a sure set piece.
- **Party / matchmaking:** `73-party.js`. A party is its own Realtime channel (`mpRoomKey` → `party-<code>`); the leader's `dgo` starts the same seeded run for every member. Random match waits in `dq-<dungeon>-<difficulty>`: 4 players, or 2+ after 40 s; "Go alone now" any time. Monsters are shared with the existing nearest-player ownership (slot = room × 100 + k). Revive a downed teammate by standing next to them for 3 s; a party wipe ends the run. PvP is off inside. While in a party the open world shows only your party.
- **Art:** dungeon banners (Z-Image Turbo) in `assets/ui/delve/`; TRELLIS.2 set pieces `delve_altar`, `delve_moonwell`, `delve_echo`, `delve_hoard`, `delve_throne` (relay batch `delve-setpieces`). Pressure plates are floor sigils (VFX); cache chests and pillars use the existing chest and pillar models.
- **Not done yet:** rejoining a run after a disconnect; party chat; per-dungeon unique boss models (bosses use the biome's monsters as champions); the Collection Log does not list set pieces yet (the panel shows found/5). Tested over a local Realtime stand-in with two browsers, not yet on two real phones.
- **Checks:** `tools/check_delve.cjs` (in `npm run check`).
- **Next steps:** test a party on two real phones against the live Supabase project (create + join by code, random match, revive); then rejoin-after-disconnect and set pieces in the Collection Log.

# 120 Hz option (18 Oct 2026, on `main`)
Done: Options › 120 Hz (`settings.hz120`, on by default since the entry at the top). The sim still steps at 60 Hz; at 120 Hz each frame draws heroes,
monsters, bosses and projectiles part way between their last two steps (`Interp` in `80-main-loop.js`); teleports, respawns
and new projectiles snap. Projectile trails and per-frame sparks scale with `fxK` so effects keep the same density.
Open: test on a real 120 Hz phone. On 144 Hz+ screens the 120 cap can't divide the refresh rate, so motion is better than
the 60 cap but not perfectly even.

# Unfinished work (state at 17 Oct 2026, 17:20) — branch `wip/menus-v3`

## Menus & UI update (17 Oct, on `wip/menus-v3`, PR to main)
Done: HUD clean-up (no XP feed, no super/tutorial text, combo half size); pixel panels, one Pixelify font, no emoji glyphs;
deep-neon buttons (gradient + glow), natural-tone thumb controls with icons for every super/skill/special; menu = 4 big
dark neon-edged tiles (Hero / Forge / Gear / Journal), every hub full page with a Menu back button + sub-tabs; Hero › Stats
is one card (portrait, worn gear, 8 stats); Forge = upgrade-card grid (Reforge shows result first, Masterwork cards with
icons in `assets/ui/forge/`, Craft, Forge, Enchant: reroll one affix for gold / boost toward cap for gems), Gem trade removed;
Equipment = compare worn vs picked + Wield/Protect/Salvage; level unlocks (`UNLOCK_AT` in 61-panels.js, white pulse until
tapped); chests: Open 5 on stacked reels + bonus drops (hero 0.2%, gold 4%, gems 3%, mats 25%); resource glow in the world;
world map (Map button) with 30 area images `assets/ui/areas/<i>.webp`, travel from anywhere; area colours from the art
(`tools/area_palette.py`); lair bosses per area with unique items (`src/game/39b-lair-bosses.js`).

## Still to do (next session)
- **Inventory:** done (Menu › Inventory: chests, resources & minerals, all gear; comparing/wearing stays on Hero › Stats). Still: ingredient art per mineral.
0. **Ingredient art:** every craft material (biome ore, monster part, dungeon core per biome, Titan Soul) gets its own high-detail icon instead of the coloured square in `matChip` (61-panels.js). Also art banners for the other hub pages (Hero, Gear, Journal tabs), like the Forge tabs have (`.pageArt`, `assets/ui/forge/banner-*.webp`).
1. **Unique item icons (29):** Casper finds the 48 px pixelize too low-res and not high end. Generate higher detail
   (e.g. 96–128 px, painted, less quantised) and hook `thumbFor` on `it.unique` → `assets/ui/uniques/<area>.png`.
   Prompts per area are the item names in `AREA_UNIQUE` (39b-lair-bosses.js). Z-Image's safety filter rejects some words
   (dark, shadow, ash, burnt, storm, black crags…): reword and retry.
2. **Lair boss 3D models + landmark 3D models per area** (landmark = the centre object of each area image) via TRELLIS.2.
   Today lair bosses are the area's monster scaled ×1.8.
3. **PvP — built on branch `wip/pvp` (PR), not yet tested with two real devices.** Settings › PvP in the open world. Logic in `src/game/72-pvp.js` (`CFG.pvp`). Still to add: a first-play name prompt. Original plan: per-player switch (default off), red glow on PvP players, `phit` message decided on the victim's
   client (range, level gap ≤10, per-hit/sec caps, not in town/menu), loser drops gold zero-sum to the killer, per-victim
   cooldown; name filter + first-play name prompt (name field already in Settings).
4. **Secret weapons:** one craft recipe per biome in Forge › Craft from chest ore + Titan Soul (Casper's choice).
5. Hero preview regeneration (3–5 trial heroes) — lower priority now the Hero tab uses the portrait.
6. Treads/Purse Masterwork icons + Forge tab icons (a scheduled reminder fires 22:50).

# Unfinished work: world art (state at 14 Oct 2026, 22:50)

## Done and pushed
- **Crafting.** Biome materials, Garo's Craft and Masterwork tabs, dungeon-only heroes (6 oaths each) and relics. See `src/game/39-crafting.js`.
- **Mining.** One quarry per combat area, with map labels.
- **Hand-made CC0 Quaternius models replace the AI scenery.**
  - Trees come in 3 shapes per biome, each with a far LOD. The biome recolours are made with `tools/v11_recolor.py`.
  - Also replaced: bushes, ferns, grass, flowers, rocks and mushrooms.
  - Town props: smithy, market stalls, barrels, crates, benches, dummies, a wagon and lantern posts.
  - Fences.
- **Landmarks** were re-cleaned at high detail (16k tris, 1024 textures).
- **Arena** is now a sand colosseum pit (`arena_floor`). **Rift**: obsidian platform, `black_spire` pylons and floating shards.
- **Streaming.** World models now download when the camera is within 230 m (`WorldModels.update`). Base names pick variants automatically (`tree_oak` → `tree_oak_1..3`, LODs `tree_oak_lod_1..3`).
- **Tools:**
  - `tools/v11_kit.cjs` converts a kit model.
  - `tools/v11_compose.cjs` builds one model from several parts.
  - `tools/v10_prop.cjs` has a new `FLAT=1` option that strips ground slabs.
  - `tools/v4_pack.py` now handles multiple base textures.

## Still to do
1. **Regenerate the broken landmarks with a stronger generator.** The concepts are fine; only the old TRELLIS meshing was bad.
   - Broken: chapel, colossus, crystal_arch, lava_forge, shrine, crashed_star, storm_rod, waterwheel, volcano, rift_pylon, rift_gate (it reads as a black block), arena_wall, dungeon_tile, sky_temple.
   - A comparison is queued on the `asset-pipeline` branch: `drop/test-3d-b`, official `microsoft/TRELLIS.2` at 1536 vs `tencent/Hunyuan3D-2.1`, run on chapel and lava_forge.
   - Pick the better one, then batch the rest. Concepts are at `raw.githubusercontent.com/.../asset-drop/drop/world-b/<name>_concept.webp`.
   - `gen.py` supports `noout` (stateful step), `pick` (which output file) and `probe` (dump endpoints).
2. **Hugging Face GPU time.** The $12 of credits is used up. Only the free Pro daily quota is left (about 25 min, resets around 22:45 local).
3. **Missing procedural fallbacks.** Without a model these still draw primitives: shrines (no `shrine` model), the dungeon floor shader, the lava pools, and the volcanic-biome horizon (a tinted `mountain` for now).
4. **Town houses.** The Medieval Village MegaKit is downloaded (`asset-drop:drop/cc0-quaternius`) and can build proper modular houses with `tools/v11_compose.cjs`. The current houses are still the older generated ones.
5. **Tall title art.** The outpaint failed (`battle_tall_a` has black bars and `battle_tall_b` errored), so the old tall image stays.
6. **Performance.** Check on a real phone: town about 1M tris, kit trees 3–10k tris near, ~500 tris far. Tune `treeSet` (52 m) and the tuft and flower thirds in `src/game/44-world-view.js` if it's slow.
7. **"Merge conflicts".** The user's report is still unexplained; none were found on GitHub.

## Performance pass (15 Oct 2026)
- **World textures.** `tools/v12_optimize_world.py` drops normal, metal/roughness and occlusion maps and caps texture sizes: 256 for LODs, grass and the horizon, 512 for most models, 1024 for bosses, the arena and the Rift floor. It also stores each texture once in `assets/world/_tex/`, and the game shares one GPU copy per texture (`AssetLibrary.shareTextures`). Run it again after packing new world models.
- **Unused vertices.** `tools/v12_compact_packed.py` removes vertices that simplified models no longer use (townsfolk 1.2 MB → 0.4 MB). Run it after any simplification.
- **Townsfolk and monsters.** `tools/v12_simplify_packed.cjs` simplifies packed models: townsfolk to about 9k triangles, the heaviest monsters to about 11k. Landmarks are at 10k triangles. Repeated props (ruins, logs, tents, standing stones, horizon) are at 2–4k.
- **Download queue.** `AssetLibrary` downloads 3 models at a time (2 on phones), monsters and heroes first, then the nearest world models. A world set downloads only once the camera is within view range plus 30 m (one-off landmarks at 110 m). At most 2 new sets are built per frame, and their textures upload as they are built.
- **Phones.** On touch devices the game caps the pixel ratio at 1.6 (1.25 on weak devices), uses a 1024 shadow map and 2× MSAA. Weak devices start with no bloom pass. When the frame rate drops, quality steps down in this order: bloom, shadow-map size, resolution, low tier.
- **Offline cache.** `sw.js` keeps models and textures on the phone between visits. It is registered only on github.io, never in the Claude artifact.
- **Measured locally (town, 30 s after Play).** Total world textures if all were loaded: 912 MB → about 180 MB. Town: 87 textures, about 150 MB of texture memory, 190 draw calls, about 615k triangles including the shadow pass. Download about 31 MB uncompressed (less with GitHub Pages compression), streamed nearest-first.
- **Next options if phones still struggle.** KTX2/Basis texture compression (needs the basis transcoder wasm, which the artifact rules out, but the Pages build could use it). Fewer near-tree triangles: crystal and coral trees are 9–10k each; lower `treeSet` 52 m. A lower `tuft` density.

## Multiplayer lobby (16 Oct 2026)
- **Now:** on the public site and the store apps every player joins one Supabase Realtime channel, `realtime:aa-lobby` (`src/game/70-multiplayer.js`, `RT`). Presence carries the player card (nick, hero, level, mode); broadcast `st` carries movement about 4 times a second while it changes, plus a beat every 3 s. Other players' shots stay cosmetic. Inside the Claude artifact the old live room + database transports are used instead. Local previews join `aa-dev-lobby` only with `?mp=1`; ×100 test mode never joins.
- **Shared monsters:** the hub world is built from a fixed seed, so every player has the same monster in the same slot (`e.slot`). Each monster is run by the nearest lobby player (`e.own`, 3 m margin, lower sid wins a double claim); the owner broadcasts `mob` snapshots of monsters near other players 4×/s, others send `hit` messages (share of max HP). Everyone who damaged a monster gets their own reward. Monsters only attack the player who runs them (the nearest). World boss: the leader (lowest sid in the open world) runs timer, spawn, movement and target choice for everyone and sends each attack (`batk`), state (`bst`) and the end (`bend`); others send `bhit`. Loot share = your damage over max HP. Not shared yet: elites' special moves on non-owners, shrines, berries, XP orbs, Rift and dungeons.
- **Partitioning later:** change `mpRoomKey()` only. Return a key per area band, World Tier or numbered shard (for example `a3-s2` once a room passes `MP_ROOM_CAP`, 60); `rtUpdate` already leaves the old channel and joins the new one on the same socket. Shard choice needs a room count: read it from presence of a small `aa-index` channel or a Supabase RPC.
- **Limits:** Supabase free Realtime quotas (concurrent connections and messages per second) cap how many can play at once; partitioning by area also cuts the fan-out.
- **Not verified against the real server from here:** tested with a local stand-in. Check on two devices that both show in Fellow Adventurers; if the Players panel shows a lobby join error, enable public Realtime channels in the Supabase project settings.
