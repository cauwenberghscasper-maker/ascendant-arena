# 3D models: real models only, and how to make them for free

**Rule:** everything the player sees as an object (heroes, monsters, bosses, pets, townsfolk, props, buildings,
landmarks, weapons, chests in menus) is a real 3D model: a mesh made in a 3D generator or a 3D program, with a
painted texture, stored as a file in `assets/`. Never build it out of three.js primitives (`BoxGeometry`,
`SphereGeometry`, `CylinderGeometry`, stacked `part()` calls, …).

Allowed in code: VFX (particles, trails, rings, beams, decals, the Showdown gas wall), invisible helpers (colliders,
picking), terrain/water shaders, and the short-lived fallback shape that shows while a model downloads.

## Still built from code (replace, don't copy)

These exist today and should be swapped for real models. Pick one up if you're looking for work:

| What | Where |
|---|---|
| Pets and prestige companions (bull, crystal dragon, …) | `assets/art/pet-companions.js`, `assets/art/crystal-dragon.js` |
| Menu thumbnails of gear, chests and daily rewards | `assets/art/premium-models.js` |
| Shrines, lava pools, dungeon floor, volcanic horizon (procedural fallbacks) | `src/game/44-world-view.js`, `47-dungeon-view.js` |
| Lair bosses (today: the area's monster scaled ×1.8) | `src/game/39b-lair-bosses.js` |
| Broken landmarks to regenerate: chapel, colossus, crystal_arch, lava_forge, shrine, crashed_star, storm_rod, waterwheel, volcano, rift_pylon, rift_gate, arena_wall, dungeon_tile, sky_temple | `assets/world/<name>/` |

## The look a model must have

- Hand-painted texture fantasy (World of Warcraft / RuneScape 3). Readable silhouette from the top-down game camera.
- Adult proportions for heroes and townsfolk. Front-facing T-pose or A-pose for anything that gets rigged.
- One mesh, no floor slab, no floating bits, no baked background. Texture painted, not photo-realistic.
- Colours fit the biome it lives in (`tools/area_palette.py`, `assets/ui/areas/`).
- Budgets: townsfolk ~9k triangles, heavy monsters ~11k, heroes ~15k before simplification, landmarks ~10k, repeated
  props 2-4k. Textures 512 (most), 1024 (bosses, arena, Rift), 256 (LODs).

## Free ways to get a model (no Hugging Face account needed)

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

### Concept images (the input picture for image-to-3D)

Draw it yourself, paint over a blockout, or use an Apache/MIT image model run locally or on a free tier (Z-Image
Turbo, Apache-2.0, is what we used). Existing concepts are in `assets/heroes/concepts/` and `assets/concepts/`; reuse
them first. The prompt should ask for: one object, front view, T-pose/A-pose for characters, plain grey background,
hand-painted fantasy game asset, no text. Z-Image's safety filter rejects some words (dark, shadow, ash, burnt,
storm…): reword.

## From model file to game

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

## Owner's Hugging Face pipeline

Casper's own batches run through GitHub Actions on the `asset-pipeline` branch (`pipeline/gen.json`, repo secret
`HF_TOKEN`, outputs on `asset-drop`). Only use it if Casper asks you to; it spends his daily GPU quota. Never copy the
token anywhere.

## Licences we ship (keep this list true)

TRELLIS.2 MIT · Z-Image Turbo Apache-2.0 · KayKit CC0 · Quaternius CC0 · game-icons.net CC BY 3.0 (named on the
Credits screen). Anything new gets added here, to `assets/world/CREDITS.md`, and to the Credits screen if its licence
needs attribution. Keep concepts, `tools/.gen/`, rejected meshes and zips out of the shipped `www/`.
