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
