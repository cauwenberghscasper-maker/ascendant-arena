# Audio sources and licences

Every file in `assets/audio/` is listed here with where it came from. New files: add a line, and if the licence
asks for credit, add it to the in-game Credits screen (`creditsPanel` in `src/game/63-menus.js`).
Files are packed with `tools/audio_pack.py` (mono, 48 kHz, -3 dB peak, .webm Opus + .m4a AAC).

## Menu / UI (`assets/audio/ui/`)

| File | Source | Licence |
|---|---|---|
| tap-1, tap-2 (placement-a, placement-b) | Kenney, Starter Kit City Builder (github.com/KenneyNL/Starter-Kit-City-Builder, `sounds/`) | MIT, © 2026 Kenney |
| open-1, open-2 (placement-c, placement-d) | Kenney, Starter Kit City Builder | MIT, © 2026 Kenney |
| back-1, back-2 (removal-a, removal-b) | Kenney, Starter Kit City Builder | MIT, © 2026 Kenney |
| tab (rotate), also used for the chest reel ticks | Kenney, Starter Kit City Builder | MIT, © 2026 Kenney |
| toggle (toggle) | Kenney, Starter Kit City Builder | MIT, © 2026 Kenney |
| equip (weapon_change) | Kenney, Starter Kit FPS (github.com/KenneyNL/Starter-Kit-FPS, `sounds/`) | MIT, © 2026 Kenney |
| salvage (break) | Kenney, Starter Kit 3D Platformer (github.com/KenneyNL/Starter-Kit-3D-Platformer) | CC0 (the kit marks its sound effects CC0) |
| coin (coin) | Kenney, Starter Kit 3D Platformer | CC0 |

The City Builder and FPS kits mark only their sprites and models as CC0, so their sounds are used under the kits'
MIT licence (credit line on the Credits screen). These are placeholders: Kenney's "Interface Sounds", "UI Audio" and
"RPG Audio" packs (CC0) fit the game better and can replace them file for file with `tools/audio_pack.py`.

Sounds not listed here (deny, forge anvil, claim, go, chest unlock and the rarity reveal, and all combat sounds so far)
are synthesized live in `src/game/50-audio.js`: made for this game, no licence needed.

## MIT licence text (Kenney starter kits)

Copyright (c) 2026 Kenney

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
