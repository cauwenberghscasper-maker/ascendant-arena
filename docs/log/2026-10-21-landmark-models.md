# Nine new world models: the missing landmarks, challenge shrines, sky temples (21 Oct 2026, branch `claude/landmark-models`)

Casper: generate high-quality 3D assets that are still needed. Seven area landmarks had no model and still showed as
code-built blocks; the challenge shrines too.

**New models** (`assets/world/<name>/`, ~9k triangles, 1024 textures; sky temple ~4.8k):
Broken Colossus (`colossus`, Heinous Hilltop), Lava Forge (`lava_forge`, Slaggy Terraces), Burnt Chapel (`chapel`,
Charred Threshold), Crystal Arch (`crystal_arch`, Fractural Ley), Crashed Star (`crashed_star`, Starfall Ruins), Old
Waterwheel (`waterwheel`, Twilight Aquifers), Storm Rod (`storm_rod`, Zenith Supercell), the challenge shrine
(`shrine`, all 12 shrines) and the celestial horizon's floating temple (`sky_temple`). No code change: the world
already places these names (`POI_MODEL` in `assets/art/world-art.js`, the shrine and horizon blocks in
`44-world-view.js`) once `WORLD_MODEL_BOX` lists them.

**How:** new concepts in the README "OG fantasy" style (Z-Image Turbo, batches `landmarks-c`, `landmarks-c2`, two or
three seeds each, best picked) → TRELLIS.2 (1024, seed 7, decimation 100k; `landmarks-3d`, `landmarks-3d-b`; all on
`asset-drop`) → `v10_prop.cjs` → `v4_pack.py --static` → `v12_simplify_packed` → compact → optimize → `v10_boxes`.
About 8 minutes of the daily GPU quota in total. Lesson: glow, sparkles, smoke and floating magic rings in a concept
become flat panels in the mesh (the first crystal arch had a solid pink door, the star a backdrop sheet, the rod a
square plate); prompts now say "no glow effects, no smoke, no clouds, no sparkles" and the game adds glow itself.
The optimizer also re-touched three dungeon models (brazier, dwall, pillar); those changes were left out.

**Tested:** each landmark visited in the game (×100 test mode, 390×844): all load and stand at their place with their
name tag; shrine ring in town; no page errors; `npm run check`, smoke test.

**Open:** the `volcano` horizon (rejected: flat black walls); rift gate/pylon, arena wall, dungeon tile; judge sizes
on a phone (landmarks use the existing `POI_MODEL` heights).
