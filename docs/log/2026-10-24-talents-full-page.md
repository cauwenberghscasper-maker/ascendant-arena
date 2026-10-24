# The talent tree fills the whole screen again (24 Oct 2026, on `main`)

Casper: make the talents page take the whole page. Since 22 Oct short pages shrink to a sheet at the bottom
(`calm-menus`), which squeezed the talent tree into the lower half. Now `FULL_PAGES` (`61-panels.js`: the talent
tree, world map, travel and the chest reel) always fill the screen (`#modal.full.tall`, `ui-v2.css`); other pages
still fit their content. Tested at 390×844: tree panel 819 px tall (was 419), travel page full, checks and smoke.
