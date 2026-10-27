# Craft materials get detailed icons rendered from their 3D models (27 Oct 2026, branch `claude/item-icons`, PR #61)

Casper: items in the game must not look low quality.

- The 18 craft materials with a usable 3D model (`assets/world/mat_<id>`) now show a 64 px pixel-art icon rendered
  from that model (4x the detail of the old hand-drawn 16 px icons): ores, monster parts, dungeon cores and the Titan
  Soul. Everywhere `matIcon` is used: Resources page, Forge recipes, Kingdom, chest ore.
- Made by `tools/mat_icons.mjs` (renders each model from eight angles, warm key + cool rim light) and
  `tools/mat_icons.py` (keeps the fullest view, lifts dark stones, 24-level colour bands, ink outline, soft drop) into
  `assets/ui/mats/` (76 KB total). List in `MAT_RENDERED` (`39c-mat-art.js`). Small recipe chips shrink them smoothly.
- Frost Fang keeps its drawn icon: its model is a thin curved sliver that reads as a teal tube from every angle.

Tested: `npm run check` passes; screenshots in `/home/claude/shots/item-icons/` (contact sheet + Resources page).
Open: a better Frost Fang model; the 6 dungeon gems (rootamber…starshard) have no models; gear, chest and dungeon set
piece icons still use their old pictures (`assets/art/premium-models.js` is code-built and should become rendered
models too).
