# First development phase: reliability, equipment and mobile presentation

Prepared 6 October 2026 against baseline `88a87d7`. These are local changes for review; the GitHub Pages deployment has not been updated. The full baseline assessment, commercial-readiness review, competitor research and priced Hugging Face pilot are in [REPORT.md](REPORT.md).

## Implemented behavior

- **Brawler progression:** changing brawlers requires mastery **80 of 99** with the first brawler. Existing Level Road/ownership requirements and expedition restrictions also apply. An owned brawler's Play button is disabled below the threshold, with an explanation above the cards. Existing saves retain their current brawler as the first brawler when no historical starter field exists; they are not forced back to Pip. New saves start with Pip. Switching back to the first brawler is always possible outside restricted modes.
- **Equipment leveling:** one or more strictly weaker, unequipped, unprotected pieces from the **same slot**, plus the existing gold/gem cost, are consumed per level. Selection uses the game's existing rarity-first comparison; lower rarity qualifies even when its item level is higher. Equal items and stronger items do not qualify. Materials are chosen deterministically from weakest first. The equipped target retains its rarity and perks.
- **Merge review:** +1 and Max open a confirmation listing the target's before/after stats, every material and the exact currency cost. Confirmation recalculates and compares the plan before changing inventory. A changed loadout, protected material, missing currency or repeated confirmation cannot partially spend resources. Closing the modal clears the pending plan. Max respects available materials/currency and the configured upgrade cap.
- **Protection:** bag items can be protected/unprotected. Protected gear is excluded from merging, manual/bulk salvage and full-bag eviction. Forging with a full bag is blocked so it cannot discard the previously equipped item. The default and one-time migration turn auto-salvage off so weak drops remain available for merging; players can explicitly enable it again.
- **Material count:** starts at one per level, rises to two at +10, three at +20 and four at +30. This is an initial tuning choice, not a measured economy optimum. Costs and thresholds should be reviewed in playtests before paid progression.

## Reliability fixes

| Area | Evidence and change | Verification / limit |
|---|---|---|
| Invisible golem | Showcase hides world views. Boss update now restores visibility for a live boss when ordinary synchronization resumes. Spawn rise uses simulation age so a view first created after leaving a long menu does not restart underground. | Source-driven tests exercise all seven variants, showcase hide/restore, deferred first view, rise animation, retreat and removal. Full physical-device combat still needs validation. |
| Cancelled touch | Basic attack no longer schedules a shot on `pointercancel`. | Isolated current-source cancellation checks pass; physical multi-touch interruptions remain to test. |
| Save loading | Null gear and null/unknown brawler entries no longer throw in the sanitizer. Starter/merge fields migrate old valid profiles. | Old-save and null-field checks pass. This is not a complete validation of arbitrary malformed saves; invalid JSON recovery, server conflict handling and purchase restoration remain outside this change. |
| Generated materials | Character/enemy disposal releases cloned instance materials and detached weapon-glow material while retaining shared asset geometry/textures. | Ownership test verifies materials are disposed once without disposing shared geometry. Full GPU memory plateau testing remains. |
| Production controls | Test grants, fast XP and debug exports are limited to localhost previews. Old production saves have fast XP disabled on load. | Source/syntax checks pass. This does not make client-controlled saves or purchases authoritative. |
| Preview isolation | Local preview disables cloud and multiplayer initialization; backup fixtures stay in the local origin's storage. | Settings visibly reports Local save. Production cloud/device credentials were not changed. |
| Arena copy | Queue and menu describe nine computer opponents. Obsolete Share/email multiplayer instructions removed. | Verified mobile menu copy. Actual online matchmaking was not added. |

## Presentation changes

The existing pixel-art UI and graded 3D world remain the art direction. Numeric readouts use a readable sans font with tabular figures; mixed pixel text uses a numeral-only local/system face. HUD health and damage figures are larger and clearer. A separate font-file download was blocked by automatic approval review because of a usage limit; no download ran. The implementation uses the game's existing Rubik font and system fallbacks.

`assets/art/premium-models.js` builds actual low-poly 3D equipment and treasure models and renders their menu portraits with consistent studio lighting, camera framing, palette steps, transparent backgrounds and a silhouette outline. Equipment adds details such as visor/cheek protection, guard and handle, shoulder plates, buckles and gems. Milestone, Rift, Colossus, Treasure and Hunter cases have different materials and distinguishing wings, crystal/spikes, horns/core, wooden planks or metal reinforcement.

Portraits render at 96×96, one queued icon per idle callback, on the existing thumbnail renderer. The temporary model's geometries/materials are disposed after rendering; at most 160 PNG portraits are cached. They do not add continuously rendered meshes to combat or another WebGL renderer.

This is a hand-built first art pass, not an AI-generation campaign or a replacement of the 41 existing hero/enemy/weapon GLBs. Equipped world armor/held weapons remain a separate production issue described in the baseline audit. New hero rigs, textures, animations and full model replacement need a reviewed asset pilot and profiling.

Mobile panels now stay within their viewport, equipment actions use full-width rows where needed, and changing screens starts at the top while same-screen redraws preserve scroll. Equipment actions, tabs, Close and portrait HUD buttons meet a 44-CSS-pixel minimum. Portrait HUD buttons use two rows to avoid overlapping health/currency. Cases use two columns on the narrowest screens and three on normal phones. Desktop-browser viewport checks cannot validate real notch insets or native point sizes.

## Performance work and evidence

- Rendering is capped at a 60 Hz cadence, including high-refresh screens. Elapsed simulation time still accumulates between rendered frames. Scheduler checks pass at simulated 60/90/120/144/165 Hz refresh rates.
- Adaptive resolution now changes the pixel-mode render target, rather than only changing a DPR value ignored by that mode. A high-DPR render-dimension check verifies that target area decreases.
- Renderer counters reset once per frame and count both the world and pixel post-processing passes. The local phone-sized preview displayed approximately **60 FPS and 63–75 draw calls** in the town. These are short desktop-browser observations, not representative device benchmarks or a worst-case combat budget.
- All 113 existing WebP files fully decoded in a local image check. The browser nevertheless logged a `GLTFLoader` base-color texture-load failure during preview startup; the specific asset/request cause was not established. Treat this as an open loading investigation. Do not claim the loading pipeline is fully cleared for release.

No FPS guarantee is made. Device GPU/CPU time, p95 frame times, cold startup, memory, thermal throttling, battery consumption, background/resume and dense combat still require named physical iOS/Android devices. Shared merged-geometry cache retirement and binary GLB transport remain audit recommendations; this phase does not rewrite those systems speculatively.

## Automated checks

From the repository directory:

```text
node tools/check_release.cjs
node audit/checks.cjs
node audit/checks.cjs --baseline
git diff --check
```

`check_release.cjs` runs 13 groups of current-source checks for merge selection, exact/idempotent spending, stale confirmations, insufficient currency/materials, the +10 material boundary, protection, full-bag forging, mastery 79/80, save migration, refresh cadence, material ownership, pixel scaling and JS parsing. Dependencies such as event/audio dispatch are isolated; this is not a full game simulation/GPU test.

The boss/input/save harness preserves original evidence in `evidence.json` and writes repaired-source results to `regression-evidence.json`. It uses render doubles, not a real GPU. Baseline source is read from its original Git commit.

## Browser verification and open release gates

Verified through the local UI: import disposable backup → Hero/Gear → review +9→+10 merge → confirm → see exact cost, +10 stats and remaining protected item; reopen/reload; inspect owned Brick's disabled mastery button; inspect all five case portraits. Portrait 320×568 and 390×844 and landscape 844×390 were used. Horizontal panel overflow was measured and corrected. Store submission and native packaging were not performed.

Before promoting this phase:

1. **Gameplay acceptance:** fight a golem, enter/leave showcase repeatedly, complete spawn/retreat/despawn in all zone types, interrupt aimed multi-touch without firing, complete merge/equip/save/relaunch without losing gear. Test scarce-material progression and time to mastery 80 with novice players.
2. **Device performance acceptance:** on an agreed midrange iPhone and Android phone, target sustained 60 FPS with p95 frame time at or below 20 ms in ordinary combat; choose and validate a stable 30 FPS fallback on the minimum device. Run at least 20 minutes of dense combat/case/menu transitions; require no crashes or sustained resource growth. These are proposed acceptance gates, not completed results.
3. **Store acceptance:** identify the app wrapper/build project, app-store accounts and distribution route. The current repository contains a web game and manifest, with no native iOS/Android project or service worker. Test installed/native startup, offline behavior, safe areas, lifecycle, saves, signing and store requirements. A four-day deadline alone cannot establish readiness.
4. **Art acceptance:** approve the silhouettes/palette and one hero-equipment-case journey on an actual phone. Then use the three-item HF pilot in `REPORT.md`, with a verified billing route and a proposed **$3 ceiling**, before broad replacement. The estimated **$12** balance remains unverified; **$0** generation credit was spent here.

The next concrete phase should be a device-tested release candidate: close the texture-loading investigation, profile dense combat on the chosen phones, validate save/lifecycle behavior in the chosen wrapper, and tune material supply/mastery pacing through observed playtests. Expand entities and paid offers only after those gates pass.
