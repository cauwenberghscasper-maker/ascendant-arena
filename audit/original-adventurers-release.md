# Original adventurers and case persistence — 9 October 2026

The 16 original character meshes, textures, faces and gameplay identities remain in use. Each receives a skeleton with shoulders, elbows, wrists, torso, head and legs, plus fitted fantasy equipment. Weapons follow the wrist. Continuous robes use blended hip weights to avoid a hard seam. Separate character instances own independent skeletons.

KayKit animations are adapted from a relaxed reference pose into rotation deltas for the original proportions. Locomotion blends forward, backward and lateral clips; attacks blend over moving legs. Rapid shots adjust the clip duration. Dodge, hit, defeat and respawn have explicit transitions. These are adapted animations on the original topology, not identical deformation to the KayKit source models; cloth has no separate physics simulation.

Source: [KayKit Adventurers 1.0](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0), `addons/kaykit_character_pack_adventures/Characters/gltf/Knight.glb`, by Kay Lousberg, CC0. Original source SHA-256: `60428e3abc09ba83e595d256e3af8c5c976b46cdae599f0802fc82b4a3445168`. The included license is `assets/animation/LICENSE.txt`.

To regenerate, place that source and its license in ignored `tools/kaykit-source/`, install the dependencies described in `tools/asset-deps.cjs`, then run `node tools/retarget_originals.cjs`. The shipped animation JSON needs neither the source model nor a runtime retargeting library. The review page is `audit/original-adventurers.html`.

Cases now check inventory capacity before consumption. A successful opening immediately writes the exact reward and case removal together to local storage; forced cloud saves are serialized, with the latest pending snapshot sent afterward. A late cloud load cannot overwrite a newer local reward. A full bag no longer lets ordinary drops evict owned items. Cases remain unopened until there is space. Existing saves retain character IDs, gear, currency and progression. Previously discarded items cannot be reconstructed because the old save format has no reward ledger.

The recovered environment art includes regional landmarks, foliage, town, arena and rift details. Smooth rendering becomes the default through a one-time presentation migration; players can subsequently enable pixel rendering in Settings. Menus and controls use softer framing and readable text.

Validation:
- `node tools/check_release.cjs`: 24 checks, including inventory capacity, immediate case reload, exact reward identity, merge protection and migrations.
- `node tools/check_test_mode.cjs`: 9 checks, including test-save isolation, concurrent cloud writes and delayed cloud loads.
- `node audit/checks.cjs`: 14 boss lifecycle assertions and malformed-save checks.
- `node tools/check_original_adventurers.cjs`: all 16 originals render; shoulder/wrist movement, skin weight normalization and weapon parenting verified. Generates portraits and local screenshots.
- `node tools/check_game_browser.cjs`: actual Edge/WebGL game boot, 16 hero loads, case open/reload, full bag, independent skeletons, rapid attacks, dodge, respawn and desktop/mobile rendering. No page errors or missing-asset/animation-binding warnings.

Browser checks use Playwright on `NODE_PATH` and a local HTTP server on port 8766. Automated desktop Edge tests do not establish frame rates on physical phones. Rollback for rendering or save regressions: revert the release commit while retaining users' profile data; the existing save schema remains compatible.
