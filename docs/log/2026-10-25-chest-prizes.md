# 2026-10-25 · Chest prizes, better geodes, reel particles

**Asked (Casper):** chests should give resources, characters, gold and gear (not only gear); rarer chests like the geode way better; fancy, gambling feel with many unique particles.

**Changed for the player:**
- The reel now lands on one of four prizes: gear, a gold hoard, a resource haul (gems, biome ore and parts, Bastion wood/stone/iron) or a hero. The rolled rarity sets how big a hoard/haul is (`PRIZE_SIZE`). Odds of all four show on the chest page (`CFG.cases[k].prize`). The small gold/material bundle every chest gives stays on top.
- Geodes are now a rare, great chest: rare 20 / epic 42 / legendary 30 / mythic 8 (mythic from level 80), 4× resources, 6% hero.
- `src/game/71c-chest-fx.js` (`ChestFX`): a pixel particle layer over the reel. Each chest kind has its own particles (`fx`: sparks, coins, embers, void motes, stars, snow, crystal shards) that thicken as the reel slows; ticks throw sparks off the marker; the win bursts in its rarity's colours; gold prizes rain coins, legendary+ flashes and shakes, heroes and mythic+ add rainbow rays.

**Tested:** `npm run check` (new check: all prize kinds appear, geodes roll well above hunter chests); opened geode, treasure and frost chests in a headless browser, no errors.

**Open:** sound per prize kind; balance of hoard sizes after playtesting.
