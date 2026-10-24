# Character animation correction

Casper reports that Gloom-Panther still appears to hop as a rigid body. Requested scope: every character has multiple dynamic animations synchronized with attacks, with expressive movement and visually reviewed rigs.

## Player-facing change

PR #49 replaces the two-body heuristic rig with baked skins for all 26 monster bodies and six biome titans.
Named species, lair bosses, dungeon bosses and siege enemies reuse those bodies. Each has 17 animation states:
idle, locomotion, six wind-ups, seven contact/recovery clips, hurt and death. Anatomy-specific channels animate
arms/elbows, legs/knees, wings, claws, tails, serpent necks and jelly tendrils. Floating bodies retain hover;
grounded bodies lose the old exaggerated whole-body hop. Slime retains its squash.

The Panther's flurry alternates right/left/right at its three existing .32-second contacts. Warning timers
drive anticipation, and attack impulses start contact/recovery. World/delve bosses carry visual-only cue fields
using their actual warning delays and repeated-hit intervals. No damage, cooldown, save or movement rules changed.
Hero/NPC authored KayKit animation behavior remains intact and is now checked across the full manifest.

## Assets and tools

`enemy-rigs.js` records anatomical anchors. Blender 5.2 bone heat solves a welded, voxel-remeshed proxy offline;
weights transfer to the unchanged original vertex order and are quantized to four U16 influences. All 422,350
vertices are weighted. The wolf's touching fists/feet need an explicit smooth foot constraint; golem floor
fragments are anchored. The original models, textures and licenses are unchanged. Approximate proxy transfer
is recorded as `mappingError`; these generated meshes still warrant further art review at extreme poses.

Run `node tools/export_enemy_rigs.mjs`, then `blender --background --python tools/build_enemy_skins.py`.
Optional ids after `--` bake a subset. JSON includes source SHA-256 and joint positions; CI rejects stale data.
Phones only load cached geometry and play clips; no weight solving. Instances share geometry and own skeletons.
The additional skins total roughly 9 MB uncompressed and are lazy-loaded alongside each body.

`tools/preview_enemy_animation.html` is an interactive body/action review page on any local server; drag to orbit.
JavaScript assets now use network-first service-worker fetching with offline fallback, avoiding old animators
under a newer game page. The new import also has a versioned URL for the first update from the old worker.

## Validation and remaining acceptance

- `npm run check`, `node tools/build.cjs --check`, and `git diff --check` pass.
- Headless Edge/SwiftShader at 390×844: full smoke passes. All 32 skins preserve bind pose, normalize weights,
  isolate instances and recover without accumulated offsets. Panther arms alternate on all three contacts;
  planted inner feet cannot follow the forearms. All 43 hero models (27 current + 16 legacy) and seven NPCs
  play locomotion, attack, hit and death, with required dodge/strafe clips present. All six world bosses recover.
- Rendered all-body wind-up sheet and Panther contact/recovery sequence inspected. Live-game trace also
  confirms changing independent shoulder/elbow transforms; a flash-heavy combat screenshot alone was inadequate.
- HF identity is available, but generation/jobs tools were unavailable in this session. Used local Blender;
  no new external models, paid jobs or model licenses introduced.
- Physical iOS/Android frame time, dense crowds, touch feel, native builds and store submission remain unverified.
  This is animation polish for review, not evidence of store readiness or a guaranteed two-week launch.
