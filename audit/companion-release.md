# Companion combat and training

Pets unlock at prestiges 1–4: Crystal Dragon, Ember Bull, Stone Sprout and Jade Slime. One equipped pet assists world fights, including Rifts. Showdown has no pet attacks or bonuses. Town, menus, death and pause stop attacks and cancel pet projectiles.

Each pet stores its own level, XP and kill count. Levels run from 1 to 99, increasing damage and attack speed. Combat rewards train only the equipped pet. XP orbs, idle rewards and hero XP multipliers do not train pets. Prestige evolves appearances independently of training; pet XP and levels survive resets. See `assets/data/companions.js` for the balance values.

Level-200 prestige is an optional reviewed restart: hero XP, Hero tree, Level Road, waypoints, World Tier and job state restart. Gear, inventory, protected items, currencies, brawlers, mastery, Brawler trees, artifact slots/unlocks, pets, collections and records persist. The confirmation rechecks combat/town state and invalidates a stale reset plan. Existing profiles migrate to prestige zero without losing gear or their current brawler.

Attacks use the existing fixed simulation step and projectile pool. Targets are scanned at most once every 150 ms, restricted to engaged nearby enemies with a clear shot. Horn Slam hits at most three targets. Pet damage credits the hero for loot and boss contribution but does not trigger hero critical hits, lifesteal, on-hit/on-kill gear or artifacts. Rendering and model downloads do not control combat.

## Validation

- `node tools/check_release.cjs`: 21 checks for previous save, gear, collection, cadence and rendering behavior; studio resolution returns to the combat target on exit.
- `node tools/check_companions.cjs`: 11 migration, unlock, independent-XP, cap, reset, targeting, attack, kill-credit, safety, pool-reuse and damage-number checks executing current modules and combat functions.
- `node audit/checks.cjs`: 14 golem lifecycle checks plus save and touch regressions.
- `node tools/check_pet_models.cjs`: actual Three.js geometry for all 20 forms, finite attributes, bounds and resource disposal. Uses a separate audit dependency installed with `npm install --prefix ../.asset-tools --no-save --package-lock=false three@0.186.1`.

Highest evolution: dragon 2,124 triangles / 4 meshes; bull 820 / 2; sprout 872 / 2; slime 464 / 2. All use one material and no shadow pass. Geometry is rebuilt on a pet/evolution change, not on every training level.

Local browser checks: legacy profile loads; reviewed prestige resets to level 1 and unlocks the dragon while retaining gear, protected inventory and gold; four distinct training levels survive reload; equipment remains pointer-free. Mobile layout and pet selection checked at 390×844.

An actual Auto Hunt combat smoke test raised the equipped dragon from level 8 to 15 (XP 348, 146 recorded kills). The bull, sprout and slime retained their separate levels and XP. The local FPS display showed 60 during the encounter, around 104–113 draw calls. These observations come from the desktop in-app browser at a phone viewport. The original local profile was backed up and restored after the test.

## Art and release limits

The four pet models are original code-built prototypes. They are not Hugging Face-generated meshes. The dragon image is an AI-generated art reference, not a 3D asset. The TRELLIS.2 GPU pilot failed on its restricted DINOv3 dependency; an authenticated CPU check confirmed access is denied. Paid generation needs account approval for that dependency before retrying. No failed mesh has been installed.

Hero studio lighting/framing, stat benchmark ribbons and bounded animated combat numbers are included. Existing hero meshes remain unchanged. Physical iOS/Android FPS, native packaging, battery use and thermal behavior have not been tested. Browser frame-rate observations are not a device performance guarantee. Pet leveling costs and damage values need playtest tuning before store release.

Rollback: revert the companion release commit. Preserve a current backup code first if reverting after players have earned pet progression, since the older code does not understand the new pet fields.

## Player access

Open Menu > Prestige & pet to review pet ownership, attack details, XP and equipment. A new profile has no pet until the first optional level-200 prestige. The first four prestiges unlock the four companion types; later prestiges continue their visual evolution. Only the equipped companion receives combat training. Pet XP and levels remain when another companion is equipped.

The implementation and regression evidence were published in commit `22e1eee8f5ccd0fa27fdbc7b3abd3613497bc4db`. Before announcing the update as live, verify that GitHub Pages has deployed a commit containing it and that the served page loads `assets/data/companions.js`.
