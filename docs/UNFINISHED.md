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
- **Partitioning later:** change `mpRoomKey()` only. Return a key per area band, World Tier or numbered shard (for example `a3-s2` once a room passes `MP_ROOM_CAP`, 60); `rtUpdate` already leaves the old channel and joins the new one on the same socket. Shard choice needs a room count: read it from presence of a small `aa-index` channel or a Supabase RPC.
- **Limits:** Supabase free Realtime quotas (concurrent connections and messages per second) cap how many can play at once; partitioning by area also cuts the fan-out.
- **Not verified against the real server from here:** tested with a local stand-in. Check on two devices that both show in Fellow Adventurers; if the Players panel shows a lobby join error, enable public Realtime channels in the Supabase project settings.
