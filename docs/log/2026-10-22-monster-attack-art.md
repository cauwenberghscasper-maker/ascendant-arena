# Every monster species fights in its own look (22 Oct 2026, branch `claude/monster-attack-fx`, PR #47)

Casper: some enemy attacks don't have models yet, and the special attacks use basic particles; give every mob its own
particles and attacks.

**Before:** every monster shot (plain shots, snipes, fans, novas, boomerangs, mortar shells, trap lobs, spirals) was a
plain coloured ball built from code; move impacts, wind-ups and pools used one shared set of sprites tinted by biome
plus box-shaped sparks; rain had no falling shells; and every one of the 58 species died in the same gold poof (the
death colours were keyed by the old body names).

**Now** (one table, `MOB_FX` in `src/game/45b-mob-fx.js`, read by both the game and the baker):
- **Projectiles:** the 25 species that shoot fly their own pixel sprite, tumbling in flight with a trail of their own
  particles (`assets/fx/mob/ammo_<id>.png`): thistle burr, spore pod, harpy quill, silk ball, banshee ghost, ice crystal,
  echo ring, toad spit, ember wisp, wyrm fireball, web egg sac, violet gem, teal orb, falling star, nebula bubble, water
  droplet, ink drop, phantom orb, steam puff, vulture talon, lightning ball, tornado, light feather, halo, golden
  javelin. Rain moves drop that shell from the sky onto each marker.
- **Particles:** a pixel-particle renderer (one draw call, max 900, `MobFX.bits`): 30 glyphs in `bits.png` (fluff,
  leaf, petal, feather, spore, pollen, thorn, clod, pebble, shard, snowflake, ember, spark, droplet, bubble, slime,
  ink, sand, web, bone, scale, coral, bolt, smoke, wisp, rune, mote, star, ash, sound arc), each with its own motion
  (flutter, float, debris that bounces, embers that rise and flicker...), painted in the species' colour by a gradient
  map in the shader, faded with a pixel dither. Every species has a main and a second glyph.
- **Where they show:** wind-ups (drawn into the monster), strikes (slams throw debris rings, lunges spray), every move
  impact shaped by its move (rings, eruptions, lanes, cones), pools/traps/vortexes (coloured, with the species'
  particles rising), its shots landing or fizzling, its hits on you (its own burst instead of red blood), your hits
  on it (it sheds a little of itself), and its death (its burst, a burst of its particles; elites a ring too).
- **Bursts:** one 16-frame pixel burst per species (`hit_<id>.png`, the hero hit styles of `bake_hero_hits.py` in a
  ramp from the species' colour).
- Bosses (world, dungeon) keep their own kits; lair bosses are species and get all of this.

**How:** `tools/bake_mob_fx.py` draws `bits.png` and the 58 bursts, and cuts the projectile pictures out of their flat
background (`--ammo DIR`, flood fill from the border, pixel-snapped to their own palette, ink outline, 4 quarter
turns). Pictures: Z-Image Turbo, batches `mob-ammo-a/b/c` on `asset-drop` (about 85 pictures, ~8 min of GPU). The
safety filter returned "maybe not safe" for about half of the first batch; shorter "game item sprite" prompts and new
seeds got them through ("void" never did; the Void-Ray's orb was reworded). Purple and pink shots were drawn on lime
so the magenta key could not eat them.

**Checks:** `tools/check_mob_fx.cjs` (in `npm run check`): every species has a row, real glyphs and burst style, its
burst sheet, and a projectile if it shoots. Smoke test: every species' particles in every mode, its burst and its
projectile, no NaN, and any missing file under `assets/fx/` fails the run.

**Tested:** fights of mixed species in ×100 test mode at 390×844 (volcanic, frost, swamp/ocean groups), no errors.

**Open:** the hero ammo baker (`bake_hero_fx.py`) has the same edge-wrap outline speck that was fixed here; monster
sounds per species; the world and dungeon bosses' own attack art.
