# Ascendant Lanes: a small MOBA with your own hero (25 Oct 2026, PR #56, branch `claude/lanes-mode`)

Casper (Dutch, translated): "Add a League of Legends-style game mode: 1v1, 2v2, 3v3, with your own character that you
build up in the farm map. It will need level matching, which we add later, but take it into account already. Make
everything new that is needed with Hugging Face models."

## What the player gets
- **Journal › Ascendant Lanes** (opens at level 10, `CFG.lanes.unlock`, with the usual "New" pulse). The page: three
  size cards (1v1, 2v2, 3v3, painted from the new concepts), the two teams with your slot and bot slots, your rank and
  your level bracket, and Play with bots / Party (code) / Join / Quick match.
- **The match** (its own instance at z −2600, `G.mode = 'lanes'`): one lane from the blue base (south) to the red base
  (north). Each base has a crystal **Core** and two **towers**; the inner tower and the Core are shielded until the
  one in front falls. **Minion waves** (3 stone golems + 2 lantern spirits per side) every 22 s march up the lane and
  fight whatever they meet. **Towers** shoot the nearest enemy, minions first, but a hero who hurts an allied hero under
  the tower becomes its target; towers take only 35% damage while none of your minions are near (no backdooring).
  2v2 and 3v3 add a **Lane Guardian** camp on each flank: killing it gives your team +15% damage for 60 s. 3v3 has a
  wider field. Destroy the enemy Core to win; at 10:00 the side with more building health left wins.
- **Your own hero, exactly as built:** gear, talents, masteries, relics, its attack and super. You fall → you respawn
  at your fountain after 6 s (+1 s per minute, max 18 s); the fountain heals fast and keeps enemies out. Auto Hunt never
  runs inside a match. Pets don't fight there (they never do outside the open world).
- **Bots** fill every empty place: heroes of the match level in level-matched Rare gear (fair, not your gear), random
  heroes from the roster. They push with their wave, prefer minions, punish low heroes, stay out of enemy towers
  without minion cover, dash out of shots, go home to heal at 30%, and the last bot of a team visits the camps.
- **Rewards (earned in play only):** rank points (+20 win / −8 loss, half against bots; ranks Bronze → Silver → Gold
  → Platinum → Diamond → Ascendant), gold scaled to level and match length, hero mastery, and a chest from the existing
  case system (Treasure Chest for a win, Hunter's Chest for a loss that lasted 2+ minutes), with the usual odds page.
- HUD: objective line with the score and clock (and your respawn countdown), a lane minimap, bars over towers/Cores
  ("shielded"), heroes, hurt minions and camps, a red reach ring round an enemy tower when you get close, team rings
  under minions, banners for towers and Cores falling, a result page (win/loss, RP, gold, takedowns, buildings, minions,
  chest) with Back to the world / Play again. Journal › Ascendant Lanes during a match offers Leave match (a loss).

## Online (Supabase Realtime, untested on two phones)
- Party code (5 letters) → channel `lanes-<code>` (`lanesRoomKey`, wired into `mpRoomKey`). The leader picks the size
  and **Together** (friends vs bots) or **Versus** (friends split into two teams, snake-balanced by Power). Members
  press Ready; the leader's Start sends `lgo`, every named player starts the same match.
- **Quick match** waits in `lq-<size>-<bracket>`: only players of the same level bracket meet. The earliest player
  forms the match when it is full (2×size) or after 30 s with 2+, sends `lmm`; bots fill the rest.
- In a match the **host** (first listed player still present; the next one takes over if it leaves) runs minions,
  towers, Cores, camps and bots and sends them 6×/s (`lst`). Every human runs their own hero. Hits on host bodies go to
  the host as HP shares (`lhit`, guests never kill them locally); hits on a human hero go to that hero's game, which
  applies them (`lph`, victim-authoritative like 72-pvp: sender must be in the match, enemy team or the host, capped at
  50% max HP per message). The host ends the match (`lend`); each game pays its own rewards.
- Presence card fields: `lc` code, `lj` join time, `lt` team, `lr` bracket, `lw` Power, `lm` rating, `ls` size, `lq`
  queue, `lrd` ready. Peers in a match get `md: 'lanes'` (mpApply) and their shots show as ghost shots.

## Level matching: what is there and what is left
- `lanesRating(profile, power)` = `{ lvl, pw, br, mmr }` (34b-lanes.js, "Lanes rating" section). Brackets by level:
  `CFG.lanes.brackets = [1, 20, 40, 70, 100, 150, 210]`. `mmr` = 1000 + rank points + 2 × level (capped at 210).
- Quick match already queues per bracket (channel name). To make a real queue later: widen the search over time
  (neighbour brackets after N seconds, or by `lm` distance), and form matches from the `lq-*` presence list by `lm`.
- **Stat normalisation:** `CFG.lanes.normalize` = `'auto'` (default: on when the humans' levels differ by more than
  `normalizeGap` = 15), `true` or `false`. `lanesNormalize(f, L, ownL)` rescales a hero's HP and damage so its Power
  equals the reference hero of the match level, keeping a softened share (`normalizeSoft` = 0.5) of how strong its build
  is for its own level. Minions, towers, camps and bots always scale to the match level L (the humans' average level).
- Not done: a server-side queue/matchmaker, rating decay, per-bracket leaderboards, anti-leave penalties, a bot
  replacing a human who disconnects mid-match.

## Models (Hugging Face, Casper's pipeline)
Concepts `asset-drop:drop/lanes-concepts-a` (Z-Image Turbo, 2 seeds each), meshes `drop/lanes-3d-a` (TRELLIS.2,
1024, seed 7). Cleaned with `v10_prop.cjs`, packed `v4_pack.py --static`, simplified `v12_simplify_packed.cjs`,
`v12_compact_packed.py`, `v12_optimize_world.py`, boxes `v10_boxes.cjs`:
- `lanes_core` (5972 tris, 1024 tex): pale blue crystal in a stone claw pedestal with bronze bands; red team tinted warm,
  both glow softly in their colour.
- `lanes_tower` (3492): slim grey stone watchtower with a bronze spiked crown and a small crystal.
- `lanes_minion_melee` (3000): stocky mossy stone golem with a bronze round shield (bobs while walking, leans in to hit).
- `lanes_minion_ranged` (2491): winged bronze lantern with a blue crystal, hovers and bobs.
- `lanes_brazier` (2471): stone brazier with coals and a war banner (lane dressing).
Size-card art in `assets/ui/lanes/` is cut from the concepts. Quota used: 10 concept + 5 3D jobs (~2.5 min GPU).

## Files
New: `src/game/34b-lanes.js` (sim, bots, rating), `47e-lanes-view.js` (field, models, tags, minimap, events),
`76-lanes-mp.js` (online, lobby page, results), `tools/check_lanes.cjs` (in `npm run check`), `assets/world/lanes_*`,
`assets/ui/lanes/`. Hooks: `31-combat.js` (targets, damage mod, kill, bounds, peer hits), `35-sim-step.js`,
`46-camera-quality.js` (views, ring colours, zoom), `60-hud.js` (tags, objective, countdown), `61-panels.js`
(`mLanes`, `ln*` actions), `62-events-fx.js` (events, minimap), `63-menus.js` (Journal tile), `70-multiplayer.js`
(room key, card, routing, ghost shots, wider x/z clamp: instances at −2600 were clamped to −2000), `71-cases-idle.js`
(no Auto Hunt), `80-main-loop.js` (step behind menus, results, view, interpolation), `22-profile.js`
(`profile.lanes` sanitised), `ui-v2.css`.

## Tested
`node tools/build.cjs`, `npm run check` (incl. 6 new lanes checks), smoke test, headless Chromium at 390×844 /
320×568 / 844×390 (lobby), a 2v2 and a 3v3 match with bots fast-forwarded through `__dbg.simStep` (waves, tower fire,
camps, deaths and respawns, buildings falling, result page, back to the world with team/position restored), no page
errors. Screenshots: see the PR.

## Still open
- Two real phones: party code, Together/Versus, quick match, host hand-over, hit sync, latency feel.
- Match length/balance on a real phone (target 6-10 min): `CFG.lanes` wave, tower/Core HP, push factor, pvp factor.
- Bots are decent but simple (no ability combos, no ganks from the jungle); in-match levels/items are not in (by design).
- A dedicated 32×32 pixel icon (today the crystal glyph in frost blue, `m_lanes`) and a Lanes sound set.
