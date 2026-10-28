# Open work (backlog)

The one list of what is still to do, gathered from the handovers in `docs/UNFINISHED.md` (history up to 21 Oct 2026)
and `docs/log/` (since). Pick an item, check `npm run team` that nobody has it, open a draft PR (docs/TEAMWORK.md),
and change only your own line here: tick it when it is merged, add what you found. Newest details: the linked log.

## Needs a real phone or two (Casper)
- [ ] FPS check on a mid-range phone (Options > Show FPS; phones now render at 2x, `docs/log/2026-10-27-crisp-pixels.md`): town, woods, the Bastion fort, a full dungeon hall
      (~1.5 M triangles with monster models). 30 FPS + "screen 30 Hz" earlier was likely Low Power Mode.
- [ ] Party dungeons, PvP and shared Bastion worlds on two real phones (Realtime lobby, codes, revive).
- [ ] Touch feel of the Bastion builder (pinch, drag, swipe the shop), dungeon minimap and puzzle runes at phone size.
- [ ] Pacing: dungeon run length (~5-7 min goal), chest resources vs Bastion wave pay, bot `hits`/`shots`.
- [ ] 120 Hz on a ProMotion iPhone once the iOS project exists (Info.plist key, README 6).

## 3D models (README 3: real models only)
- [x] The 7 area landmarks without a model, the challenge shrine and the celestial `sky_temple` horizon (21 Oct,
      `docs/log/2026-10-21-landmark-models.md`).
- [x] Horizon `volcano`: a painted rock cone (28 Oct, `docs/log/2026-10-28-volcano-pets.md`).
- [ ] Hero ammo/supers: the smoke test casts only the starter's super (TIDE); cast every hero's super in it too.
- [ ] Rift `rift_gate` reads as a black block; `rift_pylon`, `arena_wall`, `dungeon_tile`.
- [ ] Lair bosses: 29 named bosses use their area's monster ×1.8 (`39b-lair-bosses.js`); per-dungeon boss models.
      15 TRELLIS models are ready on `asset-drop:drop/hf-3d-c2/` (28 Oct); they need rigging first (Casper: keep animated ones meanwhile).
- [ ] Bastion: the 56 tier looks in `tools/bastion_tiers.json` (t2-t7 tint the base model today); Keep-matched remodels
      of ballista, mage tower, barracks, mines, huts; a lumber mill and iron mine model (they borrow hut/mine);
      a rigged soldier (uses Smith Garo).
- [ ] Procedural fallbacks still drawn from code: lava pools, dungeon floor shader, pets and prestige companions
      (`assets/art/pet-companions.js`), menu thumbnails (`assets/art/premium-models.js`).
- [ ] Modular town houses from the Quaternius Medieval Village kit (`asset-drop:drop/cc0-quaternius`, `v11_compose.cjs`).
- [ ] Heroes holding their weapon as one mesh (then weapons return on heroes).
- [ ] Monster LODs (a full dungeon hall is heavy); townsfolk and hero shadows from a light LOD.

## Art and effects
- [x] Readable pixel text (Tiny5, no more 5/S, 2/Z, B/8, C/O) and a calmer, weaker Auto Hunt (25 Oct, `docs/log/2026-10-25-readable-text-calmer-auto.md`).
- [ ] Judge Tiny5 and the Auto Hunt pace (`CFG.autoHunt`) on a real phone.
- [ ] Merge/review PR #49: baked limb rigs for all 32 enemy/boss bodies, 17 animation states, alternating Panther
      swipes, actual boss cue timing and full hero/NPC animation checks. Run phone FPS/visual acceptance before release.
      Details: `docs/log/2026-10-23-character-animation-fix.md`.
- [x] Monster attacks: every species' own projectiles, particles, bursts and death (22 Oct, `docs/log/2026-10-22-monster-attack-art.md`).
- [x] Painted combat effects and monster bursts from generated pictures (24 Oct, `docs/log/2026-10-24-painted-effects.md`).
- [ ] Wind sway on trees/grass and moving pet models (28 Oct, `docs/log/2026-10-28-animations.md`): judge the strength on a phone.
- [ ] Painted effects: look at them on a real phone (size, readability in big fights); per-hero hit pictures still use the drawn bursts.
- [ ] World and dungeon bosses' attack art in the same per-boss style; monster sounds per species.
- [x] Hero ammo as pixel sprites for 23 heroes (27 Oct, `docs/log/2026-10-27-hero-ammo-sprites.md`); Wrenna, Corrin, Tychon, Kerberon keep their liked 3D shapes.
- [ ] Crafting materials as inventory icons (render + pixelize the 3D models).
- [ ] Hero ammo still built from shapes for most heroes (vials, apples, coins…): pixel sprites like the nine in `AMMO_PIXEL`.
- [x] Crafting materials as inventory icons, rendered from their 3D models (27 Oct, `docs/log/2026-10-27-item-icons.md`); Frost Fang and the 6 dungeon gems still drawn.
- [ ] Unique item icons (96-128 px painted), hub page banners, a tall title image (outpaint failed before).
- [ ] More painted ground tiles per area (darker forest floor, sand, marble).

## Game
- [ ] Ascendant Lanes, the main mode (PR #56, `docs/log/2026-10-25-lanes-mode.md`): party/Versus/trophy quick match on
      two phones, match length and XP pace (`CFG.lanes`), level-9 upgrade choice. Lanes gear pictures done (28 Oct, `docs/log/2026-10-28-lanes-gear-art.md`).
- [ ] Open world map (PR #51, `docs/log/2026-10-25-open-world-map.md`): merge after review; check FPS near area walls on a phone, tune `CFG.openWorld` (warden HP, kills per step, danger gap) and maybe `AREA_CELL`.
- [x] Dungeon treasures have a recipe: the Dungeon forge crafts two pieces per dungeon from its gem (25 Oct, `docs/log/2026-10-25-dungeon-skill-loot.md`). Secret weapons: six at the Forge (28 Oct, `docs/log/2026-10-28-secret-weapons.md`).
- [ ] Dungeons: judge the skill tuning (monster hp 1.05 / dmg 1.3, grade thresholds) and the boss chest hero share on a real phone; painted icons for the 24 dungeon pieces; a hit counter on the dungeon HUD (PR #55).
- [ ] Party dungeons: rejoin after a disconnect, party chat, Collection Log for set pieces, full-screen dungeon map.
- [ ] Multiplayer: first-play name prompt + name filter, room partitioning (`mpRoomKey`) past ~60 players, sharing
      shrines/XP orbs/Rift/dungeons, elites' moves for non-owners.
- [ ] Bastion: "place many" toggle, wall snapping, who may build in a shared fort, cost balance.
- [ ] Menu sounds (PR #25 by nickcaels, waiting since 18 Oct: review or take over with a comment).

- [ ] Rewarding feel, a home farm, a non-linear world: research done (24 Oct,
      `docs/RESEARCH_REWARD_AND_WORLD.md`); Casper picks what to build first.

- [ ] Kingdom (idle buildings, 25 Oct, `docs/log/2026-10-25-idle-kingdom.md`): judge the pace on a real phone (`CFG.kingdom` grow, outputs), painted building art for the cards and a small 3D kingdom scene to look at instead of a list.

## Release (audit/PHASE1.md)
- [ ] Native iOS/Android projects, app icon and splash, privacy policy URL, store accounts, final `appId`.

## Repo
- [ ] ~50 old branches: most are merged; prune the merged ones (ask Casper first).
- [ ] Older browser checks (`check_game_browser.cjs`, `check_*_integration.cjs`) still expect the retired 16 heroes.
