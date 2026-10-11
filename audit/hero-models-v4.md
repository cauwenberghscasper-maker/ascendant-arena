# Hero models v4: hand-painted, fully animated adventurers

Date: 11 Oct 2026. Replaces the rounded "original adventurer" roster in play; those stay in the
manifest as the automatic fallback when a v4 pack fails to load.

## Look

The target is the painted-texture fantasy style of World of Warcraft and RuneScape 3: adult
proportions, readable silhouettes (hats, horns, capes, big shoulder pads), hand-painted albedo and a
signature weapon in hand. Movement uses the KayKit Adventurers clip set (CC0) at full strength, so
heroes run, strafe, backpedal, dodge-roll, slash, cast, shoot, flinch and die with authored motion.

## Pipeline (all scripts in `tools/`)

| Step | Tool | Notes |
|---|---|---|
| Concept | FLUX.1 Krea [dev] via the Hugging Face connector | A-pose, front view, plain grey background, 768x1024 |
| Mesh | TRELLIS.2 (MIT) image-to-3D | resolution 1024, 60k faces, 2048 texture, seed 7 |
| Relay | `asset-pipeline` branch, Actions workflow | downloads Space outputs to `asset-drop` (the sandbox cannot reach hf.space) |
| Clean | `v4_clean.cjs` | strips the generated floor slab (even when it sits above the soles), normalises to height 1, ~15k triangles |
| Skeleton | `v4_pose.py` + `v4_front.mjs` | shaded orthographic renders, MediaPipe BlazePose GHUM heavy (Apache-2.0) picks the joints; the most confident of 8 framings wins; depth from the mesh cross-section |
| Weights | `v4_heat.py` | bone heat (Baran & Popovic) with voxel visibility, cotangent Laplacian; per-slice hole filling handles leaky TRELLIS shells |
| Skin | `v4_assemble.cjs` | 15-joint skeleton, bind pose mapped onto the KayKit T-pose so one clip set fits every hero |
| Clips | `v4_bake_clips.cjs` | `assets/animation/adventurer-clips.json`, 17 clips baked from KayKit Knight.glb |
| Pack | `v4_quantize.cjs` + `v4_pack.py` | KHR_mesh_quantization (no decoder), WebP textures (1024 base colour, 512 metal/rough) |
| Weapons | `v4_weapon.cjs` | grip at origin, long axis +Y, debris removed; packed with `v4_pack.py --static` |
| Portraits | `v4_portraits.mjs` | idle-pose busts, `assets/ui/portraits/v4/<class>.webp` |

`tools/v4_run.sh NAME BATCH` runs clean, skeleton, weights and skin for one hero.

## Runtime

`assets/data/hero-models-v4.js` maps each brawler class to its hero folder, height, hand length and
weapon. `AssetLibrary` loads the hero, its weapon and the shared clips together, rescales the hip
motion to the hero's own hip height, and grips the weapon under `handr` using the KayKit hand-slot
frame:

- `forward`: blades, and bows (bows are vertical while shooting)
- `up`: staffs and scepters, upright in idle and while casting
- `aim`: guns, pointing down at rest and along the aim while shooting

Attacks are unchanged. The only gameplay change in this update is the boomerang (chakram): speed 18→21
and range 11→18.

## Roster

| Class | Hero | Weapon |
|---|---|---|
| arrow | Ayla, hooded elf ranger | elven longbow |
| mortar | Boomer, dwarf | bronze hand cannon |
| wave | Brick, crusader knight | knight longsword |
| scatter | Bruno, barbarian | crescent battle axe |
| cluster | Dax, tinkerer | bell-mouth blunderbuss |
| flamer | Ember, horned warlock | horned ember staff |
| gatling | Gus, iron juggernaut | dwarven war hammer |
| disc | Kiko, monk | bladed war fan |
| orb | Lumi, young wizard | crystal-orb staff |
| seeker | Nova, alchemist | potion scepter |
| bolt | Pip, gnome | small brass flintlock (stand-in) |
| chakram | Ren, ronin | katana |
| smg | Rico, pirate gunslinger | flintlock pistol |
| starfall | Stella, star cleric | golden star scepter |
| rail | Vex, elf sharpshooter | silver-blue longbow (stand-in) |
| chain | Volt, storm shaman | eagle totem staff |

Pip's and Vex's own crossbows came out of TRELLIS twisted. Clean upright concepts are ready (see
the session log), but the day's ZeroGPU quota ran out before they could be meshed. The stand-ins
are tinted copies of the flintlock and the longbow.

## Checks

- `node tools/check_hero_v4.cjs`: skeleton order, weight sums, triangle and download budgets,
  textures, weapons, portraits, clip validity.
- `PW_CHROMIUM=... LOCAL_THREE=1 node tools/check_game_browser.cjs`: all 16 heroes load in the
  game with 17 clips and a gripped weapon; independent skeletons; rapid fire, dodge and respawn.
- `node tools/check_release.cjs`: 26 release checks.

## Licences

TRELLIS.2 is MIT. The KayKit Adventurers animations are CC0. The MediaPipe pose model is
Apache-2.0 and is used only by the tooling, not shipped. The concepts come from FLUX.1 Krea [dev]:
check its output terms before any commercial release.
