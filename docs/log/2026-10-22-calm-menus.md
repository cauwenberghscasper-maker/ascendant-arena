# Daily rewards stop popping up, tabs lose their walls of text (22 Oct 2026, on `main`)

Casper: the daily rewards opened in the player's face at startup (overwhelming); too much text in the Daily tab; never
put too much text in tabs.
- **No startup popup:** the calendar no longer opens itself (`80-main-loop.js`). While a reward waits, the HUD Menu
  button glows (`60-hud.js`) and the Journal tile says "Reward ready!".
- **Daily tab** (`openDaily`, `63-menus.js`): only the seven day cards, the weekly boss chest as an eighth card
  ("Weekly · Slay a world boss" / ✓) and the claim button. Gone: the intro paragraph, the Colossus sentence and the
  12-line "Coming up" list (the Journal keeps its 3-line one). Claimed days dim with a tick.
- **Every tab:** explanation notes (`p.fine`, `p.say`, about 50 across the menus) show one line and open on tap
  (`ui-v2.css`, `handlePanelClick`). README 1.3 has the rule.
- **Pages fit their content** (Casper: never that much empty space): a short page sits at the bottom like a sheet
  over the dimmed game (hub tiles, Daily, Journal), a long one still fills the screen and scrolls (Forge, Inventory).
  Its close button sits in its own corner when it fits (`fits` class from `measureSheet`).
Tested at 390×844 and 320×568: no popup after Play with a reward waiting (Menu glows), Daily and Pets & prestige tabs, no
sideways scrolling, checks and smoke test.
Open: rewrite the longest notes so their first line says the most (Pets & prestige, Bank, Expeditions, Chests).
