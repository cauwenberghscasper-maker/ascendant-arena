# Painted combat effects (24 Oct 2026, PR #50)

Asked (Casper, 22 Oct): the particle effects look weak, use HF generation for higher quality.

Changed for the player:
- Explosions, hits, impacts, crits, novas, rings, slashes, poofs, shatters, zaps and flames are now painted pictures
  (Z-Image Turbo, batches `fx-gen-a/b` on `asset-drop`) turned into 16-frame pixel flipbooks in the game's dithered
  pixel style, in every colour theme the game uses (55 sheets in `assets/fx/gen/`). Themes without their own picture
  are repainted from a donor picture through that theme's colour ramp.
- Every monster species' hit burst (58) is repainted from the painted effect that matches its burst style, in its own
  colour; monster particles (leaves, feathers, embers, bolts, bones…) are painted glyphs (`assets/concepts/mob_bits/`).
- Fix before ship: the faint haze painted round each effect showed as a dark filled disc; the haze is now dropped in
  both the repaint and the pixel pass.

How: `python3 tools/bake_fx_gen.py assets/concepts/fx_gen` (shared effects) and `--mobs assets/concepts/fx_gen`
(monster bursts); `python3 tools/bake_mob_fx.py --bits assets/concepts/mob_bits` (particles). `45-fx.js` loads
`assets/fx/gen/index.json` and plays a painted sheet when one exists, the old drawn sheet otherwise.

Tested: contact sheets of every baked sheet (no dark discs), `npm run check`, smoke test.
Still open: judge size and readability on a real phone; per-hero hit bursts still use the drawn style.
