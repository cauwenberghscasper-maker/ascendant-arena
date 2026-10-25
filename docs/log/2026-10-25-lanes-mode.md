# Ascendant Lanes: the main mode, a small MOBA with your own hero (25 Oct 2026, PR #56, branch `claude/lanes-mode`)

Casper (Dutch, translated), in order:
1. "Add a League of Legends-style game mode: 1v1, 2v2, 3v3, with your own character that you build up in the farm
   map. It will need level matching later, but take it into account. Make everything new with Hugging Face models."
2. "Make this the main gamemode so you level your character in-game and can match on amount of trophies in a LoL game."
3. "Play starts Lanes"; the open world stays fully playable as the farm map behind a clear button. Gear/talents: a
   small capped bonus, shown in the lobby.
4. "In-game you can unlock special attacks during matches as characters level."
5. "People need enough reasons to grind in-game, like special gear you can only wear in-game by crafting it."

## What the player gets
- **Title screen:** PLAY starts Ascendant Lanes (the world loads as always, then the Lanes page opens); a second
  button, **Farm World · Level N**, goes to the open world. **New players** (below level 5, `CFG.lanes.mainFrom`) only
  see PLAY and it starts the world tutorial as before; from level 5 PLAY = Lanes. `CFG.lanes.mainMode = false` puts
  everything back to the old title (Lanes then lives only in the menus). The Menu also has a wide **Ascendant Lanes**
  tile (trophies) above Dungeons, and the Journal keeps its tile.
- **The Lanes page:** 1v1 / 2v2 / 3v3 cards (painted from the new concepts), both teams with your slot and bot slots
  (trophies and rank per player), your trophies and **Gear bonus +X% (max 12%)**, your Lanes loadout (3 slots) with
  Equip / Trail picks, then Play with bots / Party (code) / Join / Quick match, and Farm World.
- **The match** (its own instance at z −2600): one lane from blue (south) to red (north). Each base has a crystal
  **Core** and two **towers** (front tower first; the second tower and the Core are shielded until the one in front
  falls). **Minion waves** (3 stone golems + 2 lantern spirits) every 22 s march up the lane and step round buildings.
  **Towers** shoot the nearest enemy, minions first, but switch to a hero who hurts an allied hero under them; they
  take 35% damage while none of your minions are near. 2v2 and 3v3 add a **Lane Guardian** camp on each flank (+15%
  team damage for 60 s). Waves push harder for the side ahead (+15% per takedown lead and an extra golem per 2, +12%
  per enemy tower down), and from 4:00 **Overtime** makes every wave tougher and harder on buildings each minute, so
  matches end. Destroy the enemy Core to win; at 10:00 the side with more building health wins.
- **In-match levels (LoL style):** every hero starts each match at **level 1** and levels to **18** from XP: minions
  dying near you (60 golem / 45 lantern, shared), takedowns (220 + 30 per victim level), towers (180 to the team),
  the Guardian (240), and 4 XP/s passive. Each level adds 8.5% HP and 6.5% damage. Buttons open with the level
  (`CFG.lanes.unlocks`): attack + **DASH** at 1, class **SKILL** at 3, elemental **SPECIAL** at 5 (the element on your
  own gear, or one that suits the hero), the hero's own **SUPER** at 6 (its themed super from `hero-supers-v6.js`).
  Levels 9, 12 and 15 make them stronger (−8% cooldowns, +15% super power each). Locked buttons are greyed with a
  small "Lv N"; when one opens it flashes and "NEW: SUPER" floats over your hero (no popup). The level badge and XP bar
  show your match level and XP during the match. Bots follow the same ladder.
- **Fair by default:** everyone shares one reference build (a level-40 hero in Rare gear, `CFG.lanes.statLevel`); your
  hero choice is yours. Your farm build adds a small bonus: 35% of the cap from how far your gear/talents are ahead of a
  Rare-geared hero of your level, 35% from your level (to 210), plus your Lanes loadout; never more than 12%
  (`CFG.lanes.gearCap`).
- **Trophies** (replace the earlier level brackets): start at 0; win +30 / loss −15 against humans, +20 / −10 against
  bots only; never below 0. Ranks: Bronze 0, Silver 100, Gold 300, Platinum 600, Diamond 1000, Ascendant 1500. Bots
  play at the humans' average trophies (−8% at 0 up to +12% at 2000, `CFG.lanes.botBonus`).
- **Rewards (earned in play only):** trophies, gold at your farm level and match length, hero mastery, and a chest
  from the existing case system (Treasure Chest for a win, Hunter's Chest for a loss of 2+ minutes), with its odds.
- HUD: objective line (score, clock, respawn countdown, Guardian buff), lane minimap, bars over towers/Cores
  ("shielded"), heroes with their match level, hurt minions, camps, red reach ring near enemy towers, team rings under
  minions, banners for buildings falling and Overtime, result page (win/loss, trophies, gold, takedowns/falls, hero
  level, buildings, match time, chest). Journal › Lanes during a match offers Leave match (counts as a loss).

## Lanes gear (only works in Lanes; crafted from the farm world)
Garo's Forge › Craft, under each biome: a "Lanes gear" section. Three loadout slots: **Relic, Charm, Banner**. Craft a
piece once to own it (rank 1), craft again to rank it up to 5. Each rank adds 0.4% to the match bonus, inside the 12%
cap: they are sidegrades with an effect, not raw power. Any crafted piece can also colour your **match trail**
(cosmetic VFX). Save: `profile.lanes.gear` (id → rank), `.eq` (slot → id), `.fx` (trail), sanitised in `22-profile.js`.

| Piece | Slot | Biome | Effect per rank |
|---|---|---|---|
| Oakheart Seed | Relic | Starting Woodlands | respawn 0.6 s faster |
| Mossy Wolf Fang | Charm | Starting Woodlands | SUPER charges 5% faster |
| Greenwood Standard | Banner | Starting Woodlands | minions within 8 m of you hit 4% harder |
| Frostbound Sigil | Relic | Mountain Peaks | your DASH slows enemies it passes for 0.35 s |
| Rimeglass Charm | Charm | Mountain Peaks | +4% match XP |
| Cinder Warbanner | Banner | Volcanic Underworld | towers and Cores take +4% from you |
| Ember Crown Shard | Relic | Volcanic Underworld | start at level 2 (3 from rank 4), max HP −10% at rank 1 down to −4% at rank 5 |
| Void Prism | Charm | Arcane Ruins | takedowns heal 4% of your max HP |
| Tidecaller Pearl | Relic | Ocean Depths | respawn with a 5% max-HP shield for 6 s |
| Starfall Banner | Banner | Celestial Ascension | Guardian's might lasts 6% longer and is 3% stronger |

Cost of rank r (`lanesGearCost` in `34c-lanes-gear.js`; bi = biome index 0-5): the biome's ore 25·r·1.2^bi, its
monster part 10·r·1.2^bi, its dungeon core 1 + ⌊r/2⌋ from rank 2, Titan Souls (r − 3) at ranks 4-5 in biomes 2+,
and gold = Forge base × growth^(biome top level − 10) × (1 + r). Only biomes you can reach can be crafted.

## Online (Supabase Realtime, untested on two phones)
- Party code (5 letters) → channel `lanes-<code>` (wired into `mpRoomKey`). The leader picks the size and **Together**
  (friends vs bots) or **Versus** (friends split into two teams, snake-balanced by trophies); members press Ready; Start
  sends `lgo` and every named player starts the same match.
- **Quick match** waits in `lq-<size>`: the earliest player there takes the players closest to its trophies inside a
  range of ±80, widening by 12 per second of waiting (`CFG.lanes.mm`, `lanesPickByTrophies`), and forms the match
  when full or after 30 s with 2+ (`lmm`). Bots fill the rest at the humans' average trophies.
- In a match the **host** (first listed player still present; the next takes over if it leaves) runs minions, towers,
  Cores, camps and bots, sending them 6×/s (`lst`). Every human runs their own hero (its own level and XP). Hits on host
  bodies go to the host as HP shares (`lhit`); hits on a human hero go to that hero's own game (`lph`, victim-decides,
  capped at 50% max HP per message). The host ends the match (`lend`); each game pays its own rewards.
- Presence card: `lc` code, `lj` join time, `lt` team, `ltr` trophies, `lv` match level, `ls` size, `lq` queue,
  `lrd` ready. Peers in a match show with `md: 'lanes'` and ghost shots.

## Models (Hugging Face, Casper's pipeline)
Concepts `asset-drop:drop/lanes-concepts-a` (Z-Image Turbo, 2 seeds each), meshes `drop/lanes-3d-a` (TRELLIS.2,
1024, seed 7), through `v10_prop.cjs`, `v4_pack.py --static`, `v12_simplify_packed.cjs`, `v12_compact_packed.py`,
`v12_optimize_world.py`, `v10_boxes.cjs`:
- `lanes_core` (5972 tris, 1024 tex): pale blue crystal in a stone claw pedestal with bronze bands (red team warm tint,
  soft glow in the team colour).
- `lanes_tower` (3492): slim grey stone watchtower with a bronze spiked crown and a small crystal.
- `lanes_minion_melee` (3000): stocky mossy stone golem with a bronze round shield (bobs, leans in to hit).
- `lanes_minion_ranged` (2491): winged bronze lantern with a blue crystal, hovers.
- `lanes_brazier` (2471): stone brazier with coals and a war banner (lane dressing).
Size-card art in `assets/ui/lanes/` is cut from the concepts. GPU used: 10 concept + 5 3D jobs. Lanes gear uses the
game's pixel icon glyphs in each piece's colour (no new pictures yet).

## Files
New: `src/game/34b-lanes.js` (match, levels, unlocks, bots, trophies maths), `34c-lanes-gear.js` (Lanes gear),
`47e-lanes-view.js` (field, models, tags, minimap, HUD, events), `76-lanes-mp.js` (title, online, lobby, results),
`tools/check_lanes.cjs` (in `npm run check`), `assets/world/lanes_*`, `assets/ui/lanes/`. Hooks: `31-combat.js`,
`35-sim-step.js`, `46-camera-quality.js`, `60-hud.js`, `61-panels.js` (`mLanes`, `ln*` actions, Craft section),
`62-events-fx.js`, `63-menus.js` (Menu + Journal tiles), `70-multiplayer.js` (room key, card, routing, ghost shots,
x/z clamp widened to ±3000), `71-cases-idle.js` (no Auto Hunt in Lanes), `80-main-loop.js`, `22-profile.js`,
`src/index.html` (#worldBtn), `ui-v2.css`, `tools/check_smoke.cjs` (clicks Farm World when shown; new Lanes step).

## Tested
`node tools/build.cjs`, `npm run check` (6 lanes checks), `npm run smoke` (incl. the new Lanes step: a 2v2 with bots
for 45 s of game time, waves, hero levels, end, back to the world), headless Chromium at 390×844 / 320×568 / 844×390
(title, lobby), 1v1/2v2/3v3 matches with bots fast-forwarded through `__dbg.simStep` (waves, tower fire, camps, deaths,
respawns, levels and unlocks, result page, back to the world with team and position restored), no page errors.

## Still open
- Two real phones: party code, Together/Versus, quick match, host hand-over, hit sync, latency feel.
- Balance on a real phone (target 6-10 min): `CFG.lanes` (wave, tower/Core HP, push, overtime, XP, per-level growth).
- Bots are simple (no combos or ganks). A guest who lands a takedown on another human gets no takedown XP yet.
- One choice at level 9 between two upgrades (not built; the 9/12/15 steps are automatic).
- Own pixel icons and item pictures for the ten Lanes gear pieces (a small Z-Image batch), a Lanes sound set,
  a recall/banner effect beyond the trail.
