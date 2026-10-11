# Mobile game improvements — 11 October 2026

Integrated with GitHub main at `a268471`, including its 29-area world, docked inventory, shared-to-per-hero skill migration and 16 v4 hero packs. The existing Upgrades/Adventure menu organization is preserved. Verification below covers the combined version; no production deployment is claimed.

## Changes

- Stats, gear, main-menu and relic/artifact sheets allow touch scrolling. Relic cards, equipped relic slots and upgrade rows reflow within narrow screens. Gear navigation labels wrap into additional rows rather than overlap.
- Large equipped slots sit left of the character and scroll independently on short screens. The character shifts right to leave them room. Inventory contains unequipped items only; equip, replace, unequip and reviewed merges update stats, visible equipment and saves. Empty slots persist and duplicated equipped IDs are removed from loaded bags.
- The latest v4 heroes and original fallback heroes retain their meshes, faces, textures and proportions. Wrist/forearm rotation is damped for their shorter limbs, and rapid fire no longer restarts the same recoil pose continuously. Fitted armor, boot trims, headbands and accessories follow body bones; weapon grips follow wrists. Wings follow the back and crowns follow the head. Measured body sockets and fitted equipment trims also apply to the latest v4 rigs. Crown-level characters receive extra camera space. Unequipped overlays and weapons disappear.
- Patrol coverage increases by 25% in each combat area (20→25 or 24→30), using distributed road/flank positions. Total population increases from 1,029 to 1,186. Base Camp stays empty of enemies. Placement checks obstacle/body clearance, map bounds and protected locations. Respawns stay at least 12 units from the player, are limited to five per second globally, and clear stale attack states. Den respawns take seven seconds; field respawns take eleven.
- Outside the beginner practice area, newly spawned enemies in unlocked zones trail the hero by at most four levels. Enemy damage growth increases modestly. Existing enemies do not gain stats during fights. Wolf/spider lunges and boar charges warn before moving and commit to their displayed direction.
- Newly earned chests save immediately. The old 60-chest limit no longer silently exchanges additional chests for gems. Opening still saves the consumed chest and exact reward together, and the newer main-branch behavior allowing chest rewards to overflow a full bag is preserved, so opening never discards the reward. Local-storage failure now produces a visible warning instead of silently claiming persistence. Previously lost rewards cannot be reconstructed from this fix.

## Verified

| Check | Result |
| --- | --- |
| `tools/check_release.cjs` | 27 groups passed, including 75 immediately saved chests, regional rewards, merge idempotence and full-bag reward preservation |
| `tools/check_test_mode.cjs` | 9 groups passed, including isolated test saves and simulated overlapping/delayed cloud operations |
| `tools/check_companions.cjs` | 11 groups passed |
| `audit/checks.cjs` | 14 boss lifecycle assertions and malformed-save checks passed |
| `tools/check_gameplay.cjs` | 8 deterministic groups passed, including seeded placement, safe respawning and sidestepping committed attacks |
| `tools/check_hero_v4.cjs` | 16 current packs, 14 unique weapon packs, 17 shared clips, complete skeletons, sampled normalized weights, shipped textures/portraits and download/triangle budgets passed |
| `tools/check_original_rigs.cjs` | 16 heroes × 15 authored clips: normalized skin weights, preserved rest geometry, independent skeletons, wrist grips, bounded sampled triangle stretching |
| `tools/check_character_integration.cjs` | 16 current v4 heroes × empty/rare/legendary loadouts × idle/run/attack/run+attack/dodge/hurt/death/respawn; finite transforms and correct bone parents |
| `tools/check_mobile_integration.cjs` | Real touch swipes at 320×568, 390×844 and 844×390; stat/gear/relic scrolling, no horizontal panel overflow, last relic reachable, left equipment slot scrolling, equip/replace/unequip/merge and save/reload; 75 chest awards survive reload |
| `tools/check_game_browser.cjs` | Reward save/reload/full-bag overflow, all 16 v4 hero loads, independent skeletons, rapid fire/dodge/respawn passed |
| `tools/check_world_integration.cjs` | All 1,186 spawn homes clear and reachable from town in the shipped map (4,342 obstacles); actual geared combat/death/respawn at levels 1, 5, 10, 25, 50, 100, 200 and level reward path |
| `git diff --check` | Passed |

The real simulation's stationary heroes wearing level-matched uncommon equipment died in approximately 10–24 seconds against the sampled same-area slime; this is a controlled vulnerability check, not a complete human difficulty study.

A controlled comparison using fresh equal-size browser contexts and seeded randomness measured **24.2 ms median in both versions**, with **30.4 ms GitHub main / 25.6 ms integrated p95**. Mean simulation time was **0.2600 ms previous / 0.2967 ms integrated**. Visible views increased from 20 to 24. These are short desktop headless measurements, not mobile-device benchmarks.

## Review images

- [Current v4 roster with integrated equipment](evidence/character-integration/current-roster.png)
- [All original fallback hero silhouettes, idle and moving attack](evidence/character-integration/roster.png)
- [Ascended hero with fitted equipment, crown and wings](evidence/character-integration/ascended-equipment.png)
- [Small-screen gear and left equipment slots](evidence/mobile-integration/gear-320x568.png)
- [Small-screen relic inventory, scrolled to the last row](evidence/mobile-integration/relics-equip-320x568.png)
- [Small-screen relic upgrades](evidence/mobile-integration/relics-upgrade-320x568.png)
- [Field encounter](evidence/world-integration/field.png)

Machine-readable evidence is stored under `audit/evidence/{character-integration,mobile-integration,world-integration}` and `audit/original-rig-checks.json`.

## Tools and remaining limits

Astra handled the initial rig investigation and head/back attachment changes; UI and gameplay agents implemented their assigned changes. All three encountered an account usage limit before completing their work, and the coordinating agent completed integration and verification. Blender was not on PATH or in the checked installation locations; no Blender connector was available. Work used the installed Three.js/GLTF tooling and bundled Playwright with Microsoft Edge. No new generated binary character assets or paid services were needed.

Physical iOS/Android touch, safe-area behavior, sustained device performance, exhaustive combinations of every item shape/perk, and production cloud persistence were not tested. Live cloud saves were isolated from the local fixtures. Current v4 heroes and original fallback heroes passed the sampled visual/rig review, so this change does not replace them; the changes address animation and equipment mounting rather than a wholesale model redesign.

## GitHub integration

Resolved eleven conflicts in `index.html` by combining the newer main-branch world, loot tiers, menu actions and skill/save migrations with this change’s scrolling, empty equipment slots, safe spawning and immediate chest saves. Fixed the docked `.pBody` touch exemption, added v4 equipment sockets and made the action buttons wrap on small screens. Updated browser fixtures to exercise the combined inventory and world. Unrelated local asset drafts and audit backups are excluded from the change.
