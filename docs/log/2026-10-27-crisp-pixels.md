# Sharper world and tidy resource names (27 Oct 2026, branch `claude/crisp-pixels`, PR #62)

Casper: pixel text and items in the game must not look low quality.

Found: the UI text (VT323) is already crisp. What looked cheap was the 3D world: the pixel-art look is off by default,
so players see the smooth renderer, which phones drew at only 1.6x (about half of an iPhone's real pixels) and then
stretched, so heroes and props looked soft. Item names on the Resources page also wrapped into the next heading.

- **World sharper on phones:** phone render cap 1.6x -> 2x (`CFG.quality.maxDpr` in `46-camera-quality.js`). Weak
  phones stay at 1.25x; adaptive quality still steps down 0.25 at a time below 50 FPS.
- **Pixel-art look (Options) finer:** about 1.6x the art pixels everywhere, like the fort already had (~585 on a 3x
  phone instead of 390). An art pixel stays at least Q.dpr wide outside the fort, so 2x phones keep the pixel look.
- **Resources page:** room for two-line names (`.rgrid` gap/margin in `ui-v2.css`), no more overlap with headings.

Tested: `npm run check` passes; headless screenshots of the Resources page (`/home/claude/shots/crisp-pixels/`).
Open: check FPS and heat on a real mid-range phone at 2x (Options > Show FPS); the low-res item icons themselves are
PR #61 (item icons).
