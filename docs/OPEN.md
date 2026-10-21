# Open work (backlog)

The one list of what is still to do, gathered from the handovers in `docs/UNFINISHED.md` (history up to 21 Oct 2026)
and `docs/log/` (since). Pick an item, check `npm run team` that nobody has it, open a draft PR (docs/TEAMWORK.md),
and change only your own line here: tick it when it is merged, add what you found. Newest details: the linked log.

## Needs a real phone or two (Casper)
- [ ] FPS check on a mid-range phone (Options > Show FPS): town, woods, the Bastion fort, a full dungeon hall
      (~1.5 M triangles with monster models). 30 FPS + "screen 30 Hz" earlier was likely Low Power Mode.
- [ ] Party dungeons, PvP and shared Bastion worlds on two real phones (Realtime lobby, codes, revive).
- [ ] Touch feel of the Bastion builder (pinch, drag, swipe the shop), dungeon minimap and puzzle runes at phone size.
- [ ] Pacing: dungeon run length (~5-7 min goal), chest resources vs Bastion wave pay, bot `hits`/`shots`.
- [ ] 120 Hz on a ProMotion iPhone once the iOS project exists (Info.plist key, README 6).

## 3D models (README 3: real models only)
- [ ] The 7 area landmarks without a model (Broken Colossus, Lava Forge, Burnt Chapel, Crystal Arch, Crashed Star,
      Old Waterwheel, Storm Rod), the challenge shrine, and the horizon `volcano` and `sky_temple`: generated 21 Oct,
      in PR `claude/landmark-models` (Casper merges).
- [ ] Hero ammo/supers: the smoke test casts only the starter's super (TIDE); cast every hero's super in it too.
- [ ] Rift `rift_gate` reads as a black block; `rift_pylon`, `arena_wall`, `dungeon_tile`.
- [ ] Lair bosses: 29 named bosses use their area's monster ×1.8 (`39b-lair-bosses.js`); per-dungeon boss models.
- [ ] Bastion: the 56 tier looks in `tools/bastion_tiers.json` (t2-t7 tint the base model today); Keep-matched remodels
      of ballista, mage tower, barracks, mines, huts; a lumber mill and iron mine model (they borrow hut/mine);
      a rigged soldier (uses Smith Garo).
- [ ] Procedural fallbacks still drawn from code: lava pools, dungeon floor shader, pets and prestige companions
      (`assets/art/pet-companions.js`), menu thumbnails (`assets/art/premium-models.js`).
- [ ] Modular town houses from the Quaternius Medieval Village kit (`asset-drop:drop/cc0-quaternius`, `v11_compose.cjs`).
- [ ] Heroes holding their weapon as one mesh (then weapons return on heroes).
- [ ] Monster LODs (a full dungeon hall is heavy); townsfolk and hero shadows from a light LOD.

## Art and effects
- [ ] Hero ammo still built from shapes for most heroes (vials, apples, coins…): pixel sprites like the nine in `AMMO_PIXEL`.
- [ ] Crafting materials as inventory icons (render + pixelize the 3D models).
- [ ] Unique item icons (96-128 px painted), hub page banners, a tall title image (outpaint failed before).
- [ ] More painted ground tiles per area (darker forest floor, sand, marble).

## Game
- [ ] Dungeon treasures have no recipe yet (dungeon crafting / secret weapons: one recipe per biome).
- [ ] Party dungeons: rejoin after a disconnect, party chat, Collection Log for set pieces, full-screen dungeon map.
- [ ] Multiplayer: first-play name prompt + name filter, room partitioning (`mpRoomKey`) past ~60 players, sharing
      shrines/XP orbs/Rift/dungeons, elites' moves for non-owners.
- [ ] Bastion: "place many" toggle, wall snapping, who may build in a shared fort, cost balance.
- [ ] Menu sounds (PR #25 by nickcaels, waiting since 18 Oct: review or take over with a comment).

## Release (audit/PHASE1.md)
- [ ] Native iOS/Android projects, app icon and splash, privacy policy URL, store accounts, final `appId`.

## Repo
- [ ] ~50 old branches: most are merged; prune the merged ones (ask Casper first).
- [ ] Older browser checks (`check_game_browser.cjs`, `check_*_integration.cjs`) still expect the retired 16 heroes.
