# Open world map: areas in every direction, Warden Gates, danger warnings, the Main Path (25 Oct 2026, PR #51)

**Casper asked** (after a team meeting): the main map is too linear (you always walk north to unlock the next level).
Make it like the Zelda map: areas in different directions; you may walk into a higher-level area but get a warning that
you will probably die; a main path of objectives and challenges leads you through the places. New things made with the
Hugging Face models. (The League-style 1v1/2v2/3v3 mode is a separate agent and PR.)

**What the player gets**
- **Open map (World v11).** The same 29 areas, monsters, dens, dungeons, mines and landmarks, now laid out as a 6 × 5
  grid of 190 m squares with Base Camp in the middle. The main path spirals outwards in level order: Woodlands round
  camp, Mountains west and south, Volcanic north-east, Arcane in the west column, Ocean along the south coast,
  Celestial up the east side. Cliffs and woods wall the areas off, every border has one pass, roads link each area's
  heart (its lair) to its passes. Monster level rises from the side the main path enters an area.
- **Warden Gates** on the 24 passes between biomes: walk up, "Challenge Warden · Lv X" (a big elite of the higher
  side's monster, 9× HP), beat it and the gate opens for good (gold, gems, a Treasure Chest). Far above you: the first
  tap warns ("you will probably die"), a second tap within 5 s fights anyway. Shut gates show a glowing seal.
- **Danger warning:** entering an area whose lowest level is 6+ above you shows a red DANGER banner (once a minute per
  area); pass labels and the area chip go red; skull posts stand at passes into much higher areas. Nothing blocks you.
- **Main Path:** per area: travel there → defeat 12 monsters there → clear a den (8 den monsters) or, in a biome's
  last area, its lair boss → open the Warden Gate into the next biome. Gold + 12% of a level per step, a Treasure Chest
  per chapter. Shown in the objective tracker (arrow follows the route through open passes, "Rec. Lv" when far above
  you), a gold beam and waystone at the target, a gold star and dotted route on the minimap.
- **World map** (Map › Travel) is now the grid itself: area art squares, red levels when dangerous, dim until visited,
  gate markers (red shut / green open), gold star on the Main Path area, tap "Go" squares to travel.
- Auto Hunt, bots and the job arrow route round the walls through open passes.

**Saves:** World v11 migration (`openWorldMigrate` in `22-profile.js`): same zone/waypoint/POI indices; gates whose
level you already had are open; the Main Path starts at your highest area; visited areas = everything up to your old
furthest zone. Area achievements now use visited areas. The multiplayer lobby key is `lobby-w11` (monster slots moved).

**Models (Hugging Face, Casper's pipeline):** concepts with Z-Image Turbo (`drop/openworld-c`), meshes with TRELLIS.2
(`drop/openworld-3d`): `warden_gate` (shut, 7k tris), `warden_gate_open` (7k), `cliff_ridge` (2.5k, between biomes),
`danger_sign` (1.5k), `quest_beacon` (2.5k). Packed into `assets/world/`, boxes in `WORLD_MODEL_BOX`. About 6 min of
ZeroGPU quota.

**Tested:** `npm run check` (new `tools/check_open_world.cjs`: gate blocks/opens, routes, warden reward, danger
warning, quest steps, migration; `check_world_layout` rewritten for squares: every POI/den/pass mouth/lair reachable
by BFS over the colliders, all areas connected, the Woodlands reachable without wardens), `npm run smoke` passes.
Headless screenshots of the gate, cliffs, danger banner, minimap and world map. Other checks moved their test spots
into an area square (they used x = 50..100 on the old road).

**Open / to check**
- Real phone: frame rate near the walls (≈4.6k wall trees + 1.9k boulders + 0.4k cliffs, culled by cell at 140 m).
- Pacing: kills per step, warden HP (`CFG.openWorld`), whether 6 levels is the right danger gap.
- Areas are 190 m squares now (were 420 × 110-135 m bands); dens/caves are closer together. Judge if it feels too
  dense; `AREA_CELL` in `11-world-data.js` scales everything.
- World bosses still spawn at lairs as before (now the area centres); multiplayer peers on old builds sit in the old lobby.
- The portrait camera is close: the gate is easy to miss until you are next to it; the label and minimap bar help.
