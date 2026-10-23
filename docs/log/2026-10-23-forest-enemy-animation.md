# Forest enemy animation polish — 23 October 2026

Casper requested a project review and brainstorm, then small visual finishing touches for an iOS/Android release
target in about two weeks. His first priority is mob movement and attack animation, especially forest mobs and bosses.
He chose expressive, exaggerated movement and confirmed that the target includes both testing builds and public
releases on iOS and Android. This change broadens the strides, anticipation and follow-through on the two clean rigs.

## Changed for the player

- The wolf body (Gloom-Panther and other species using it) swings its arms and legs while walking, brings its arms
  into lunges, and uses separate arm poses for wind-ups, swipes and recoil.
- Ancient Golem raises its arms for slams, swings through sweeps, and spreads its arms for ward casts. It has a
  broad walking stride and breathing motion. Existing body poses, markers and attack timing remain in place.
- Models, textures, triangle counts, combat rules, balance and saves are unchanged. No generation quota used.

`assets/data/enemy-motion.js` adds seven bones to the cached source asset once. Weighting uses measured shoulder
cuts and connected surface regions, with a shoulder blend over welded UV seams. Instances share the skinned vertex
buffers and have independent bones. Standard three.js skinning handles lighting and shadows; existing instance
disposal releases skeleton textures. A changed/incompatible mesh keeps its old whole-body animation.

## Scope and rejected prototypes

This is a first pass on two reviewed bodies, not an animation replacement for every monster. Mushroom and boar
prototypes stretched fused/overlapping surfaces and were removed. Insects, snakes, other common mobs and the other
five world-boss bodies retain their existing animation. Those need anatomy-specific rigs and visual review.

## Validation

- `node tools/build.cjs` and `npm run check`: pass.
- `npm run smoke`: pass with headless Edge/Chromium using software WebGL, viewport 390×844. Covers boot, movement,
  attacks, 24 monster bodies, all 58 species' FX, all six bosses, hero pose recovery and 22 menu pages.
- Added a smoke-test group using actual loaded meshes: normalized finite weights, unchanged bind pose, seven bones,
  moving arm/leg vertices, fixed torso anchors, shared geometry with independent skeletons, and no pose accumulation.
- Close-up resting and wind-up renders inspected. Physical-device frame time and dense combat remain unverified.

## Project review / next brainstorm

The architecture separates simulation and visual views, which makes small animation changes possible without
touching gameplay. Recent work already gives all 58 monster species their own effects. The current sample-audio
manifest is empty; PR #25 already covers menu audio, so review it before starting overlapping work. Distinct enemy
voices, footfalls and impact sounds are a promising next polish pass after animation.

The native iOS/Android directories are absent. Capacitor configuration and packaging scripts exist, but device
startup/resume, saves, safe areas, dense-combat performance and two-device multiplayer still need validation.
Icon/splash production, store accounts, final app identifier and privacy policy remain release tasks. Casper wants
both testing builds and public releases within about two weeks; store readiness and device acceptance are still
open, and no release-date guarantee is established by this visual pass.

Packaging estimate: this revision's tracked `assets/` and `vendor/`, excluding the two directories currently skipped
by `build.cjs --app`, total about 210 MiB, before native packaging. The README's older ~72 MB estimate should be
remeasured when preparing the release candidate; no app build or store submission was performed here.
