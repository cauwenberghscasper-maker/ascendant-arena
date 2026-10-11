# Mobile game improvements — 11 October 2026

Implemented locally in `ascendant-arena`; not deployed. Existing Upgrades/Adventure menu organization and all 16 original hero designs are preserved.

## Changes

- Stats, gear, main-menu and relic/artifact sheets allow touch scrolling. Relic cards, equipped relic slots and upgrade rows reflow within narrow screens. Gear navigation labels wrap into additional rows rather than overlap.
- Large equipped slots sit left of the character and scroll independently on short screens. The character shifts right to leave them room. Inventory contains unequipped items only; equip, replace, unequip and reviewed merges update stats, visible equipment and saves. Empty slots persist and duplicated equipped IDs are removed from loaded bags.
- Original heroes retain their meshes, faces, textures and proportions. Wrist/forearm rotation is damped for their shorter limbs, and rapid fire no longer restarts the same recoil pose continuously. Fitted armor, boot trims, headbands and accessories follow body bones; weapon grips follow wrists. Wings follow the back and crowns follow the head. Crown-level characters receive extra camera space. Unequipped overlays and weapons disappear.
- Patrol coverage increases from 242 to 336 roamers, with 48 distributed patrol positions per zone. Total population increases from 481 to 575. Placement checks obstacle/body clearance, map bounds and protected locations. Respawns stay at least 12 units from the player, are limited to five per second globally, and clear stale attack states. Den respawns take seven seconds; field respawns take eleven.
- Outside the beginner practice area, newly spawned enemies in unlocked zones trail the hero by at most four levels. Enemy damage growth increases modestly. Existing enemies do not gain stats during fights. Wolf/spider lunges and boar charges warn before moving and commit to their displayed direction.
- Newly earned chests save immediately. The old 60-chest limit no longer silently exchanges additional chests for gems. Opening still saves the consumed chest and exact reward together, and a full gear bag leaves the chest unopened. Local-storage failure now produces a visible warning instead of silently claiming persistence. Previously lost rewards cannot be reconstructed from this fix.

## Verified

| Check | Result |
| --- | --- |
| `tools/check_release.cjs` | 25 groups passed, including 75 immediately saved chests, regional rewards, merge idempotence and full-bag protection |
| `tools/check_test_mode.cjs` | 9 groups passed, including isolated test saves and simulated overlapping/delayed cloud operations |
| `tools/check_companions.cjs` | 11 groups passed |
| `audit/checks.cjs` | 14 boss lifecycle assertions and malformed-save checks passed |
| `tools/check_gameplay.cjs` | 8 deterministic groups passed, including seeded placement, safe respawning and sidestepping committed attacks |
| `tools/check_original_rigs.cjs` | 16 heroes × 15 authored clips: normalized skin weights, preserved rest geometry, independent skeletons, wrist grips, bounded sampled triangle stretching |
| `tools/check_character_integration.cjs` | 16 heroes × empty/rare/legendary loadouts × idle/run/attack/run+attack/dodge/hurt/death/respawn; finite transforms and correct bone parents |
| `tools/check_mobile_integration.cjs` | Real touch swipes at 320×568, 390×844 and 844×390; stat/gear/relic scrolling, no horizontal panel overflow, last relic reachable, left equipment slot scrolling, equip/replace/unequip/merge and save/reload; 75 chest awards survive reload |
| `tools/check_game_browser.cjs` | Existing reward save/reload/full-bag, all hero loads, independent skeletons, rapid fire/dodge/respawn passed |
| `tools/check_world_integration.cjs` | All 575 spawn homes clear and reachable from town in the shipped map (1,920 obstacles); actual geared combat/death/respawn at levels 1, 5, 10, 25, 50, 100, 200 and level reward path |
| `git diff --check` | Passed |

The real simulation's stationary heroes wearing level-matched uncommon equipment died in approximately 10–24 seconds against the sampled same-area slime; this is a controlled vulnerability check, not a complete human difficulty study.

The initial headless performance sample was noisy (36.3 ms median / 48.4 ms p95). A controlled comparison using fresh equal-size browser contexts and seeded randomness measured **18.3 ms median in both versions**, with **24.5 ms previous / 24.4 ms updated p95**. Mean simulation time was **0.1175 ms previous / 0.165 ms updated**. Visible views increased from 32 to 44. These are short desktop headless measurements, not mobile-device benchmarks.

## Review images

- [All original hero silhouettes, idle and moving attack](evidence/character-integration/roster.png)
- [Ascended hero with fitted equipment, crown and wings](evidence/character-integration/ascended-equipment.png)
- [Small-screen gear and left equipment slots](evidence/mobile-integration/gear-320x568.png)
- [Small-screen relic inventory, scrolled to the last row](evidence/mobile-integration/relics-equip-320x568.png)
- [Small-screen relic upgrades](evidence/mobile-integration/relics-upgrade-320x568.png)
- [Field encounter](evidence/world-integration/field.png)

Machine-readable evidence is stored under `audit/evidence/{character-integration,mobile-integration,world-integration}` and `audit/original-rig-checks.json`.

## Tools and remaining limits

Astra handled the initial rig investigation and head/back attachment changes; UI and gameplay agents implemented their assigned changes. All three encountered an account usage limit before completing their work, and the coordinating agent completed integration and verification. Blender was not on PATH or in the checked installation locations; no Blender connector was available. Work used the installed Three.js/GLTF tooling and bundled Playwright with Microsoft Edge. No new generated binary character assets or paid services were needed.

Physical iOS/Android touch, safe-area behavior, sustained device performance, exhaustive combinations of every item shape/perk, and production cloud persistence were not tested. Live cloud saves were isolated from the local fixtures. All shipped original heroes passed the sampled visual/rig review, so none were replaced; the changes address animation and equipment mounting rather than a wholesale model redesign.
