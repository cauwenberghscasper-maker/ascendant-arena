# Kingdom: an idle game in the Bank (25 Oct 2026)

Asked by Bart: "instead of just accumulating gold AFK and claiming it, you can buy different kinds of factories and
adventurers to make money AFK, so it has an idle game feeling". He picked: replace the Bank, the workers are "the
villagers of the kingdom you build", and the buildings make gold and materials.

What changed for the player (Bank & Camp, now **Kingdom & Camp** › **Kingdom**, still level 8):
- The old Bank is the **Treasury**: same payout (gold, XP, gems, shards, chests), same level, storage hours and
  +12% per level, which now also lifts every building.
- **Buildings** you buy with gold, opening by level: Market Stall (8), Cottage (8), Mine (12), Tavern (18), Hunter's
  Lodge (25), Gem Cutter (35), Trade Guild (45), Rune Workshop (60), Royal Mint (80). Gold makers fill gold, the Mine
  and Lodge fill your newest biome's ore and monster parts (more in later biomes), the Gem Cutter gems, the Rune
  Workshop rune shards. Buy ×1, ×10 or Max.
- Every copy costs 40% more than the last; owning 25, 50 and 100 doubles that building's output (a banner says so).
- **Villagers:** Cottages house 2 each (you start with 2). Put them to work with + and −, or "Put to work"; each adds
  5% to its building (one per copy, ten per building at most).
- Everything fills the Treasury while you play and while you are away, inside its storage window (8 h + 1 h per
  Treasury level), and Collect pays the Treasury and every building at once. The stored gold ticks up every second
  while the tab is open.

How it stays balanced: a building's price and output are both measured in the Bank's own gold unit at your level, so
leveling up never strands a building and the Forge's prices keep their meaning. A reinvest-everything simulation
(`tools/check_kingdom.cjs`, and in the CFG comment) puts the kingdom at about 2× your play income after a day and under
12× after 150 hours. The first tuning (1.15 growth, doublings every hundred) ran past 100× within days.

Code: `src/game/71b-kingdom.js` (`CFG.kingdom`, settle/collect, buying, villagers, the tab, the 1-second ticker, nine
game-icons.net building icons: shop, beer-stein, warehouse, bank, gold-mine, wood-cabin, obelisk, house, village; by
Delapouite and Lorc, CC BY 3.0, credited through `GI_SRC`), `collectVault` and the tab in `71-cases-idle.js`, buttons in
`61-panels.js` (`kBuy`, `kAmt`, `kVil`, `kAuto`), banners/toasts in `62-events-fx.js`, save `profile.kingdom` through
`sanitizeProfile` (old saves start empty), styles in `ui-v2.css`.

Tested: `npm run check` (new `check_kingdom.cjs`: costs, ×10/Max, milestones, villager caps, storage window, rates
before a purchase, collect once, materials, the economy bound, icons), in the page: buying, villagers, collect after
3 h and after 100 h (capped), save round trip and an old save, screenshots at 390×844 at level 8 and level 70, no page
errors.

Still open:
- Judge the pace on a real phone; the knobs are all in `CFG.kingdom`.
- The cards use 32 px icons; painted building art (and later a little 3D kingdom to look at) would sell the fantasy
  far better than a list.
- In ×100 test mode the Treasury's XP payout can jump many levels at once (old Bank behaviour, not new).
