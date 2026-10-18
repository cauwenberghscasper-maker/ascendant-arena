# Ascendant Arena

Mobile 3D brawler (Three.js, single page). Play: https://cauwenberghscasper-maker.github.io/ascendant-arena/

- **Working on the game? Read [AGENTS.md](AGENTS.md) first** (rules, style, how to work together), then [docs/VISION.md](docs/VISION.md) and [docs/3D-MODELS.md](docs/3D-MODELS.md).
- `src/`: the game's source. `index.html` is generated from it (see below), so never edit `index.html` directly.
- `assets/`: generated 3D models (TRELLIS.2, MIT) from Z-Image-Turbo concepts (Apache-2.0), UI art, fonts. `vendor/three`: the bundled three.js r186, so the game runs offline.
- Saves: on this site progress goes to the game's Supabase project (device id + secret, the server stores only a hash). Inside Claude the artifact's own database is used.
- Add to Home Screen on iOS/Android to play full screen, or build the store apps (below).

Local preview: run `node tools/build.cjs`, serve the repository with an HTTP server and open localhost. Localhost saves are isolated from production cloud saves and expose development tools. Production hostnames and the store apps hide those tools.

## Where to change what

The game is one shared script cut into files by system. `node tools/build.cjs` joins `src/game/*.js` in name order (the number prefix is the order) into the module script of `index.html`, and inlines `src/css/`. All files share one scope: a name declared in one file can be used in any later file, so don't declare the same top-level name twice, and keep setup code after whatever it uses.

| To change… | Edit |
|---|---|
| Balance: stats, timings, economy, quality tiers | `src/game/10-config.js` (`CFG`) |
| World map, areas, biomes, zone levels | `src/game/11-world-data.js`; how the world looks: `44-world-view.js` |
| Townsfolk models, buildings, caves, ore, dungeon pieces, world bosses (generated 3D, instanced) | `src/game/48-world-models.js` (`WORLD_MODEL_BOX`), `assets/npc/`, `assets/world/`; placement: `44-world-view.js`, `47-dungeon-view.js`; prep: `tools/v10_prop.cjs` + `tools/v4_pack.py --static` |
| Bloom, grading and soft shadows (High graphics + Cinematic effects) | `src/game/46-camera-quality.js` (`Post`) |
| Monsters (stats, drops, which body they use) | `src/game/12-monsters.js`; behavior: `33-world-sim.js`; looks: `43-enemies-view.js` |
| Brawlers (heroes), attacks, skill-tree data | `src/game/13-brawlers.js`; their 3D models: `41-assets.js` (`ASSET_MANIFEST`) and `assets/data/hero-models-v4.js` |
| Items, rarities, merge, salvage, forge | `src/game/21-items.js`; inventory and loot rolls: `32-progression.js` |
| Cases, Vault, Expeditions, Auto Hunt | `src/game/71-cases-idle.js`; named collection drops: `assets/data/loot-collection.js` |
| Pets, prestige | `assets/data/companions.js`, `assets/data/prestige.js`; pet models: `assets/art/pet-companions.js` |
| Save format and migrations | `src/game/22-profile.js` (`defaultProfile`, `sanitizeProfile`) |
| Cloud save (Supabase) | `src/game/81-cloud-save.js` |
| Combat, projectiles, damage | `src/game/31-combat.js` |
| Arena (Showdown), Rift | `src/game/34-arena.js`, `33-world-sim.js` |
| Multiplayer lobby (Supabase Realtime), future partitioning (`mpRoomKey`) | `src/game/70-multiplayer.js`; notes in `docs/UNFINISHED.md` |
| HUD | `src/game/60-hud.js` |
| Panels, settings, button actions (`data-act`) | `src/game/61-panels.js` (`handlePanelClick`) |
| Menus, skill-tree screen, credits | `src/game/63-menus.js` |
| Effects for hits, kills and events | `src/game/62-events-fx.js` (`processEvents`); particles and sprite FX: `45-fx.js` |
| Sound | `src/game/50-audio.js` |
| Touch and keyboard controls | `src/game/51-input.js` |
| Camera, adaptive quality, pixel-art pass | `src/game/46-camera-quality.js` |
| Game loop, startup | `src/game/80-main-loop.js`, `90-boot.js` |
| Page markup, head, styles | `src/index.html`, `src/css/main.css`, `src/css/panels.css`; the current menu look and the Menu size zoom: `src/css/ui-v2.css` (loaded last) |

After editing: `node tools/build.cjs`, then run the checks.

## Checks

`npm run check` runs `tools/check_release.cjs` (which also fails when `index.html` was not rebuilt), `check_test_mode`, `check_companions`, `check_gameplay` and `audit/checks.cjs`. Browser checks (`tools/check_game_browser.cjs` and the other `check_*_integration.cjs`) need a server on port 8766 and Playwright. Assessment: [audit/REPORT.md](audit/REPORT.md). Current implementation and release gates: [audit/PHASE1.md](audit/PHASE1.md). Map and pace of the 1-210 world: [audit/world-v9.md](audit/world-v9.md).

## Store apps (iOS and Android)

The apps are Capacitor shells around `www/`, which `node tools/build.cjs --app` fills with only what the game loads (about 72 MB; concept art, audit and tools stay out).

1. Once: `npm install`, then `npx cap add ios` (needs a Mac with Xcode) and `npx cap add android` (needs Android Studio).
2. Each release: `npm run app` (build `www/` and copy it into both native projects), then build and upload from Xcode / Android Studio.
3. Before the first upload: set your final `appId` in `capacitor.config.json` (it can't change after release), make a 1024×1024 app icon and a splash image and run `npx @capacitor/assets generate`, and add a privacy policy URL (the game sends a device id and the save to Supabase).
