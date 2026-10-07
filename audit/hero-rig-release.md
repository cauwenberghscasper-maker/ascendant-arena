# Four-hero rig release — 8 October 2026

This release updates Pip, Brick, Ayla and Lumi. It does not finish the remaining twelve heroes or the requested mythology roster.

## Verified changes

- Actual textured, skinned 3D meshes replace the previous four bodies. Faces have small natural noses, matte painted surfaces and authored eye details. The faceted rendering and existing pixel-art UI remain.
- Thirteen joints per body: root plus paired shoulder, elbow, wrist, hip, knee and ankle joints. Arms counterbalance running; attacks blend into shoulder/elbow/wrist motion. Knees flex during recovery and ankles counterrotate. These are procedural animations, not authored animation clips or motion capture.
- SkeletonUtils gives each fighter its own skeleton. Instance disposal releases owned bone textures and materials while retaining cached geometry and textures.
- Menu portraits are studio renders of the actual replacement meshes. They use static WebP files, avoiding runtime portrait rendering for these four heroes.
- Showcase reduces existing ascension wings and pillar brightness so high-level effects obscure less of the character.

| Hero | Asset path | Total triangles including eyes | Texture | Worst measured strike edge stretch |
| --- | --- | ---: | --- | ---: |
| Pip / bolt | assets/hero-v4/pip/packed | 11,763 | 1024px WebP | 1.46× |
| Brick / wave | assets/hero-v4/brick/packed | 11,764 | 1024px WebP | 1.72× |
| Ayla / arrow | assets/hero-v4/ayla/packed | 11,764 | 1024px WebP | 1.56× |
| Lumi / orb | assets/hero-v5/lumi/packed | 9,262 | 1024px WebP | 1.86× |

## Failure found and correction

The first spatial arm weights incorrectly included coat and torso vertices in wrist movement. Attack poses stretched some surface edges by roughly 10×. The offline rig builder now finds connected arm surfaces, rejects limbs fused to the torso, and blends shoulder weights over the surface topology. All four accepted meshes remain below the 3× regression threshold on measured edges longer than 8mm.

The first Lumi result had an arm joined to the torso below the shoulder. It was rejected and preserved locally; a more separated reference produced the accepted replacement. Ayla and Lumi also required a baked 180-degree facing correction. Generated eye textures lost their detail, so small vertex-colored eye meshes with individually reviewed socket positions restore them.

## Validation

Run from the repository root:

```text
node tools/check_hero_animation.cjs pip
node tools/check_hero_animation.cjs brick
node tools/check_hero_animation.cjs ayla
node tools/check_hero_animation.cjs lumi
node tools/check_release.cjs
node tools/check_test_mode.cjs
node audit/checks.cjs
```

The skin checks cover rest-pose integrity, weight normalization, textures and UVs, independent fighter clones, attack blending, wrist hierarchy, knee recovery, ankle orientation, stance height and invalid inputs. Existing release, test-save isolation and boss lifecycle checks pass.

Local browser review checked the four meshes, portraits, running/strike poses, actual hero switching at first mastery 80 and a 390×844 hero menu. The desktop hub HUD reported approximately 59–60 FPS after loading. There was one Three.js texture-update warning during the test session, with no new hero asset-load failures or uncaught errors. This is not a sustained combat benchmark or physical mobile-device certification.

## Sources and generation

Original reference images and their prompts are in assets/concepts/rpg-heroes-v2. Models use microsoft/TRELLIS-image-large (MIT). Accepted four-body job: https://huggingface.co/jobs/Casper565/6ac6c094df2184ac91ac5208 . Accepted Lumi replacement: https://huggingface.co/jobs/Casper565/6ac6c808e7a0dae8a277f4d9 . Both jobs were stopped after their outputs were saved. The replacement job was capped at 18 minutes on L4 (estimated maximum $0.24 at the then-checked $0.80/hour rate). Actual account balance and final billed total were not available through the connector.

TRELLIS.2 remains unavailable until the owner decides whether to accept the gated DINOv3 dependency's access conditions. Original meshes, rejected drafts and PNG portrait renders are preserved in the local workspace. Only game-ready packages, rig definitions and WebP portraits ship; draft ZIPs and redundant intermediate GLBs are excluded. Each package records the rigged source SHA-256 in mesh-evidence.json.

## Limits and next acceptance gates

- Review gait at real combat movement speeds; the current procedural cycle is not a fully planted-foot locomotion controller.
- Validate sustained combat on physical iOS/Android devices, including loading stalls, thermal throttling, memory and battery use.
- Held weapon meshes remain disabled by the existing game setting; wrist attachment is prepared but visible weapon alignment is not certified.
- The remaining heroes still use their previous models and movement. Zeus, Aphrodite, Hermes and Hercules remain a separate requested batch after this release.
- New equipment meshes and balance changes are outside this release.

Rollback: restore the prior four ASSET_MANIFEST entries by removing the HERO_MODELS_V3 override; old assets and save formats remain available. Revert this release if hero loads fail, skeletons animate another fighter, or measured combat performance regresses on target devices.
