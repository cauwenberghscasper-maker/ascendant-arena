# Rules for everyone working on Ascendant Arena

This file is for every developer and every AI coding tool (Claude Code on the web, desktop or phone, Codex, Cursor,
Copilot, Gemini, Jules…). Read it before you change anything. `CLAUDE.md`, `GEMINI.md` and
`.github/copilot-instructions.md` all point here, so there is one set of rules.

Read next, in this order:
1. [`docs/VISION.md`](docs/VISION.md): what the game is, what is already in it, and where it is going.
2. [`docs/3D-MODELS.md`](docs/3D-MODELS.md): how 3D models are made (real models only, free routes without Hugging Face).
3. [`docs/UNFINISHED.md`](docs/UNFINISHED.md): open work, newest at the top.
4. [`README.md`](README.md): which file to edit for what.

The owner is Casper. `main` is the live game: https://cauwenberghscasper-maker.github.io/ascendant-arena/ (GitHub Pages
rebuilds from `main` within minutes). When the repo and this file disagree, check `git log` and fix this file.

---

## 1. Hard rules (breaking one of these has cost us work before)

1. **Never edit `index.html`.** It is generated. Edit `src/game/*.js`, `src/css/*.css` or `src/index.html`, then run
   `node tools/build.cjs`. A past session lost all 27 heroes because work went into `index.html` and a rebuild
   overwrote it.
2. **`src/game/*.js` is one shared scope.** The build joins the files in number order. Never declare the same top-level
   name twice; setup code must come after what it uses. New file? Pick a number that puts it after its dependencies.
3. **No 3D objects built from code.** Characters, monsters, bosses, pets, props, buildings, landmarks and weapons are
   real 3D model files (glTF) in `assets/`. No `BoxGeometry`/`CylinderGeometry` sculptures, no "procedural hero",
   no primitives stacked into a house. Code geometry is only allowed for: VFX (particles, trails, rings, decals, the
   gas wall), invisible helpers (colliders, picking), and the existing temporary fallbacks that show until a model
   loads. Remaining primitive fallbacks (shrines, lava pools, dungeon floor, volcanic horizon) are debt to replace
   with models, not a pattern to copy. See [`docs/3D-MODELS.md`](docs/3D-MODELS.md).
4. **Saves never break.** Players must never lose gear or progress. Any change to the save format goes through
   `sanitizeProfile` in `src/game/22-profile.js` with a migration for old saves.
5. **No pay-to-win, no paid loot boxes.** Chests/cases are only earned in play, never sold for money or any currency,
   and always show their odds. Heroes unlock through play (Level Road, bosses, shrines, feats, dungeons), never money.
   The premium currency hook stays at zero.
6. **Only art we may ship.** Our own concepts, CC0 (Quaternius, KayKit, Kenney, Poly Haven), MIT/Apache generators,
   or CC BY with the credit added. Never ship other artists' work (reference images, ArtStation, Pinterest, game rips)
   without their name and written permission. Every new third-party source is credited in `assets/world/CREDITS.md`
   (or the matching credits file) and, if the licence asks for it, on the in-game Credits screen
   (`creditsPanel` in `src/game/63-menus.js`).
7. **Don't bring back what was removed on purpose** (unless Casper asks): the HIT/melee button
   (`#bMelee { display: none }`), held weapons on heroes, worn gear pieces and gear sparkle on heroes, painted menu
   emblems, hero overlays (ascended crown, wings, aura, trail), emoji glyphs in the UI, the XP feed and tutorial text on
   the HUD.
8. **Never commit secrets.** No tokens, API keys or passwords in code, docs or commit messages. The Supabase anon key
   in the client is public by design; nothing else is.

## 2. Phone first

The game is played on phones. Every change must work there.

- Twin-stick touch: left thumb moves, right thumb aims. Moving and pressing any button must work at the same time
  (multi-touch, one pointer id per control). Don't add controls that need two hands on one side.
- Buttons are at least 44 CSS px. Respect the safe-area insets (`--sat`, `--sar`, …).
- Check portrait 390×844 and 320×568 and landscape 844×390. No horizontal scrolling, nothing cut off.
- Performance budgets (town): about 600k triangles including shadows, ~190 draw calls. Townsfolk ~9k tris, heavy
  monsters ~11k, landmarks ~10k, repeated props 2-4k. Textures 256 (LODs) / 512 (most) / 1024 (bosses, arena, Rift).
  Target 60 FPS on a mid-range phone. Anything heavier needs an LOD or a reason.

## 3. One style

### UI (menus, HUD, icons)
- **Pixel-art UI over a graded 3D world.** One font: Pixelify Sans (`var(--body)`, `var(--og-font)`). No other fonts,
  no emoji.
- Dark stone pixel panels with bevels, stepped corners and a 2-3 px ink outline (`--og-ink`); bone-white highlights.
  No gold gradients, medallions or Greek borders.
- Buttons: the "deep neon" look in `src/css/ui-v2.css` (light-to-dark gradient over the button colour, soft glow in
  its own colour). Thumb controls use natural tones (steel-teal dash, moss skill, element-tinted special, bronze super).
- Rarity colours come only from the tokens in `ui-v2.css` (`--r-common` … `--div`). Don't hard-code new hex values for
  rarities.
- Icons: 32×32 pixel icons, element-coloured, with an ink outline. Every new resource, tab or button gets its own icon
  in that style.
- Menus are full pages with a Menu/back button and sub-tabs. New screens follow the existing hub layout
  (Hero / Forge / Gear / Journal).
- `src/css/ui-v2.css` is loaded last and holds the current look. Add new UI styling there (or next to its feature),
  reusing the existing tokens and classes. Don't restyle the whole game in a side file.

### 3D world and characters
- Painted, hand-painted-texture fantasy (World of Warcraft / RuneScape 3 feel). Adult proportions. Not chibi, not
  realistic PBR, not low-poly flat colours unless it's a recoloured CC0 kit piece that already fits.
- Heroes share one 15-joint humanoid skeleton and the KayKit clips. Extra heads, tails, wings, a village on the
  shoulders: props on bones or VFX, not new skeletons.
- Heroes carry no held weapons until a hero is generated holding its weapon as one mesh.
- Each biome has its own palette (`tools/area_palette.py`, the area art in `assets/ui/areas/`). New props are
  recoloured to the biome they live in.

### Combat effects
- **"High end" means themed per hero.** Every bullet, its flight, trail, impact, hit reaction and super belongs to that
  one hero's story, props and palette. No generic fireballs, orbs, slashes or recoloured shared effects. The kits are
  written down in `assets/heroes/combat_kits.md`; follow them.

### Game design
- **Don't overwhelm the player.** Systems unlock gradually (`UNLOCK_AT` in `src/game/61-panels.js`, the skill tree
  opens ring by ring via `TREE_GATE` in `23-skill-tree.js`). New systems get an unlock level and a "New" pulse, not a
  wall of buttons on day one.
- Progression is long and endless (RuneScape/Diablo). Balance numbers live in `CFG` (`src/game/10-config.js`), not
  scattered in code.
- Pets and prestige companions give world bonuses only, never arena power.

## 4. Working together across sessions and tools

Several people and AI sessions work on this repo at the same time. To avoid overwriting each other:

1. **Start fresh:** `git fetch origin && git checkout main && git pull`. Then read `docs/UNFINISHED.md` and
   `git log --oneline -15` to see what others just did.
2. **One topic per branch:** `wip/<topic>` or `claude/<topic>`. Small, requested fixes may go straight to `main` once the
   checks pass. Big or risky work (new systems, roster or save changes, mass asset swaps) goes in a pull request, and
   Casper approves the merge.
3. **Keep diffs focused.** Don't reformat, rename or "tidy" files you aren't changing. Big shared files
   (`61-panels.js`, `63-menus.js`, `ui-v2.css`, `44-world-view.js`) are where conflicts happen: edit only the part you
   need.
4. **Merge conflicts in `index.html`:** never resolve them by hand. Resolve the conflicts in `src/`, then run
   `node tools/build.cjs` and commit the regenerated `index.html`.
5. **Hand over.** Before you stop, add what you finished and what is still open to the top of `docs/UNFINISHED.md`
   (date, branch, next steps), commit and push. Never leave work only local; cloud sessions are thrown away.
6. **Commit messages describe what the player sees** ("Skill tree opens ring by ring: …"), not code internals.

## 5. Check before you say it works

1. `node tools/build.cjs` after any `src/` edit (`node tools/build.cjs --check` fails if `index.html` is stale).
2. `npm run check` must exit 0. If it rewrites `audit/regression-evidence.json` and that wasn't intended, restore it
   with `git checkout -- audit/regression-evidence.json`.
3. **Look at it.** Serve the repo (`python3 -m http.server 8766`), open it in a browser (headless Chromium with
   Playwright is fine: `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`), wait for
   `window.__gameBooted`, click `#playBtn`, screenshot at 390×844. No `pageerror` or console errors.
4. Use **×100 test mode** (`?test=100`) to reach late content fast: separate save, never touches cloud or
   multiplayer. Judge pacing at normal speed.
5. Debug hooks in the page: `window.__game`, `__sim`, `__dbg`, `__assets`, `__manifest`, `__heroLab`, `__THREE`.
6. The older browser checks (`tools/check_game_browser.cjs`, `check_*_integration.cjs`) may still expect the retired
   16-hero roster. Fix them or skip them; don't trust their failure blindly.
7. Localhost is a local preview: cloud saves and multiplayer are off there, dev tools are on. Don't point local builds
   at the production cloud save.

## 6. Talking to Casper

He writes short, informal messages (Dutch or English, often with typos). Answer briefly and plainly in English,
describing what he will see in the game. If a request is ambiguous ("make the button smaller"), make the most likely
change and say which one you picked. Send a screenshot of visual changes.
