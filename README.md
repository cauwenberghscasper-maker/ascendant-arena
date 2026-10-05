# Ascendant Arena

Mobile 3D brawler (Three.js, single page). Play: https://cauwenberghscasper-maker.github.io/ascendant-arena/

- `index.html`: the whole game. `assets/`: generated 3D models (TRELLIS.2, MIT) from Z-Image-Turbo concepts (Apache-2.0), UI art.
- Saves: on this site progress goes to the game's Supabase project (device id + secret, the server stores only a hash). Inside Claude the artifact's own database is used.
- Add to Home Screen on iOS/Android to play full screen.

Local preview: serve the repository with an HTTP server and open localhost. Localhost saves are isolated from production cloud saves and expose development tools. Production hostnames hide those tools.

Checks: `node tools/check_release.cjs` and `node audit/checks.cjs`. Assessment: [audit/REPORT.md](audit/REPORT.md). Current implementation and release gates: [audit/PHASE1.md](audit/PHASE1.md).
