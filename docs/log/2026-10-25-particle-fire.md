# 2026-10-25 · Particle fire effects

**Asked (Casper):** some fire animations don't fit the game and are too thick; make them like particles, with many more frames, high-end feel.

**Changed for the player:** the nine shared fire effects (explosion, hit, impact, crit, nova, ring, flame, poof, slash) are no longer one painted blob that grows and erodes. Each frame is simulated from hundreds of embers, sparks and flame wisps (`tools/bake_fx_particles.py` → `assets/fx/pfx/`), 32 frames instead of 16, drawn additively so overlaps glow hotter. Still pixel art (64 px grid, fire palette, 4x4 dither). Other colours (frost, arcane, …) keep the painted sheets.

**Tested:** `npm run check`; headless game with the effects played next to the hero (no page errors).

**Open:** the same treatment for the other colours and for hero-specific supers (`assets/fx/hero/`) if Casper likes it.
