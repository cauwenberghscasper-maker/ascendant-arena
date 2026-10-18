# Bastion plan: shared worlds, free building, walls, a land that grows

Status 18 Oct 2026: phases 1-3 are built (branch `claude/bastion-update`, see `docs/UNFINISHED.md`); phase 4 (models) is open.

From the brainstorm with Casper (18 Oct 2026). Today Bastion Siege (`src/game/36c-siege.js`, view `47c-siege-view.js`)
is a solo instance: a 48×48 m fort with fixed walls and three gates, 8 fixed pads, the Keep + two wagons, and every run
starts at wave 1. The fort lives in `profile.fort = { pads[8], stones }`.

## What Casper chose

| Topic | Decision |
|---|---|
| Ownership | Every player owns one Bastion world. Others join with a code. Clans and clan bases: later, not now. |
| Offline | A world is always open: friends can play it while the owner is offline. So the world is saved on the server, not in a profile. |
| Guests | Guests build and upgrade with their own gold and stones; what they build belongs to the world. |
| Defeat | The world keeps its wave. After a defeat you restart at the wave you fell on, never lower. |
| Land | Starts small and grows with the player's level, up to 500×500 m at the end. |
| Placement | Anywhere on a grid (2 m cells). Nothing may overlap another building, an objective or a world model. |
| Walls | No walls at the start. Wall segments are placed cell by cell (corners and gates join up by themselves) and upgraded wood → stone → iron. |
| Pathing | Monsters walk around walls; if every way is closed they break through the weakest wall. |
| Builders | Builder huts = build slots. Each builder works on one build/upgrade at a time; more huts, more at once. |
| Waves | Each wave comes from 1, 2 or 3 random sides (of 4), shown during the build phase. Boss every 10 waves, sometimes a mini-boss. |
| Models | New: archer tower, cannon, ballista, barracks + soldier, mage tower, mine. Through the HF pipeline. |

Not doing now: clans, guest ranks/permissions, free (gridless) placement or rotation, PvP raids on other worlds.

## Phase 1: never below your wave (small, ships alone)

- `profile.fort.wave` = the wave to start on (the first one not yet cleared). `startSiege` starts `S.wave` there,
  `siegeWaveClear` sets it to `max(fort.wave, n + 1)`. Nothing lowers it.
- Migration in `sanitizeProfile` (`22-profile.js`): missing → `(records.bestSiege || 0) + 1`, clamped to an integer ≥ 1.
- Entry panel (`61-panels.js` siege panel) and the town label (`60-hud.js`) say "Wave N" instead of only "best wave".
- Check: `tools/check_siege.cjs` asserts a run that falls on wave 7 starts the next run on wave 7.

## Phase 2: grid, free building, walls, builders, growing land

All inside `36c-siege.js` / `47c-siege-view.js`; balance in `CFG.siege`.

**Save shape.** `fort = { wave, stones, b: [{ t, x, z, l, done? }] }`. `x, z` are cell coordinates (2 m) around the Keep;
`t` is a type (`archer`, `cannon`, `ballista`, `warrior`, `mage`, `mine`, `hut`, `wall`, `gate`); `done` is the
wall-clock time an upgrade finishes (absent = ready). Migration: the 8 old pads become 8 buildings at the same spots, same
type and level. Nobody loses a tower, and `pads` is dropped after the move.

**Occupancy.** One `Uint8Array` cell map rebuilt whenever something is built: objectives, buildings by their footprint
(1×1 walls, 2×2 towers, 3×3 Keep), and scenery (rocks, trees on the land) from their `WORLD_MODEL_BOX` radius.
A build is valid only on free cells inside the unlocked land. The ghost preview shows green/red. The same map
feeds `siegeGrid()` (collision circles) and pathing.

**Pathing: one flow field.** A Dijkstra pass from the Keep over the cell map, run only when something is built or
destroyed (≤ 62,500 cells at 500 m). Free cells cost 1, walls cost `wallHP / k`, other buildings are blocked.
Monsters step down the field. If a wall is on their cheapest path, they stop and hit it. This one pass covers both
"walk around" and "break the weakest wall when closed in". Replaces the straight-line chase in `stepSiegeEnemy`;
heroes, soldiers and objectives nearby still draw them off as today.

**Walls.** Cell-by-cell placing: tap Build › Wall, then drag your thumb to lay a line (one segment per cell crossed,
priced per segment). The view picks straight / corner / T / end from the 4 neighbours. Gates are wall cells that let
allies through and count as walls for monsters. Wall HP comes back between waves like objectives today (`heal`).

**Builders.** Start with 1 builder hut (placed for free next to the Keep at migration). Upgrades take time
(`CFG.siege.buildTime(l)`, seconds at low levels, hours at high). Number of jobs running at once = huts built. Finished jobs are
checked on entry and every second inside; buildings under construction don't fire. Level 1 of walls is instant.

**Land.** `CFG.siege.land`: half-size by player level, e.g. 30 m at level 20 → 250 m (500×500) at the top. Monsters spawn at
the edge of the unlocked land, so you see them walk in from far. The ground is one plane with fog at the land edge. The
camera gets a zoom-out step inside the fort. The fixed walls, gatehouses and pads in `buildSiegeView` go away; the
Keep and wagons stay.

**Waves.** Per wave pick 1-3 of the 4 sides (more sides as waves rise), announce them in the build phase (arrows at the
edge + a HUD line). `bossEvery` 5 → 10. Mini-boss: `makeChampion` tier 1 with a chance per wave (`CFG.siege.miniChance`).

**New buildings.** Mage tower (slow magic bolt that chains to 3 targets), mine (makes Bastion Stones per hour,
capped, collected by tapping it). Builder hut. Same `CFG.siege.towers` table as the others.

Performance: buildings go through `WorldModels.place` (instanced, as now); far towers use `_lod_` versions.
Budget for a full base: under ~150 draw calls and ~400k triangles. Test at 390×844.

## Phase 3: shared worlds

**Server (Supabase, needs Casper's OK before applying).** Table `bastion_world (code text primary key, owner uuid,
fort jsonb, wave int, updated_at)` and three RPCs, in the same style as `load_profile` / `save_profile`:
- `create_world(p_id, p_secret)`: the owner's device makes its world with a random 6-letter code.
- `load_world(p_code)`: anyone with the code reads it.
- `save_world(p_code, p_fort, p_wave)`: anyone with the code writes. The server clamps levels and counts, rejects
  oversized JSON, and stores `wave = greatest(wave, p_wave)`, so the wave can never go down.
  The code works like a password. Anyone who knows it can build in the world.

**Live play.** A world has its own Realtime channel `bastion-<code>` (the party pattern in `73-party.js`, through
`mpRoomKey()`). The **host** is the player who has been in the channel longest (same as the party leader). The host runs the waves
and monsters and saves the world. The others send `build` requests (type, cell, the gold/stones they paid) and see the
host's monsters through the shared-monster code (`mob` broadcasts in `70-multiplayer.js`). When the host leaves, the next in
line takes over from the last saved state (at worst the current wave restarts, never a lower one).

**Gold.** Guests pay from their own profile before the request is sent. If the host rejects it (cell taken), the
cost goes back.

**The owner's world.** On the first online entry `profile.fort` is uploaded as the new world, and the code is saved in
`profile.fort.code`. Offline, or with the cloud off, the game uses the local `profile.fort` exactly like Phase 2.

**UI.** The Bastion panel gets: My world (enter), Join (code field), Recent worlds, and a Copy code button.

## Models (Phase 4, run alongside Phase 2)

Through Casper's HF pipeline (`asset-pipeline` branch, `pipeline/gen.json`) only when he starts it. Each model: concept
(Z-Image) → TRELLIS.2 → `v10_prop.cjs` → `v4_pack.py --static` → the v12 steps → `v10_boxes.cjs`.
1. Archer tower, cannon, ballista (replace `tower`, `kettle`, `arena_tower`), ~4k tris.
2. Barracks and a soldier (rigged on the shared 15-joint skeleton, replaces Smith Garo).
3. Mage tower, mine, builder hut.
4. Walls: wood/stone/iron × straight, corner, gate (9 pieces, ~1.5k tris, one shared texture per material).
Each one gets a 32×32 icon. Also a Bastion Stone icon (still text today).

## Still open (ask Casper)

- Other new buildings besides mage tower and mine (healer shrine, gold farm)?
- Walls weren't picked in the model list; the plan includes them because the wall system needs them.
- Old fort: the plan moves the 8 towers onto the grid (nothing lost) instead of refunding them.
