# 100× gameplay testing

Settings > Enter ×100 test mode opens `?test=100`. Hero, mastery and equipped-pet XP use 100× rewards. Gold and simulation/combat speed remain normal. A persistent HUD badge identifies the test session. Settings includes +1, +5 and +100 level shortcuts, currency/gear helpers and a world-boss shortcut. Level shortcuts run normal reward and achievement logic, so newly earned achievements can grant additional levels.

The first run copies the current device hero into a separate test profile. Later runs resume that profile. Settings > Return to normal play reloads the normal hero. Test progress stays under `ascendant-arena-playtest-xp100-v1`; normal progress stays under `ascendant-arena-v1`. Both can coexist on the same origin.

Test sessions never initialize cloud saves or multiplayer. Backup exports carry a test marker, and normal import, storage and cloud-write paths reject marked test profiles. Reset test hero erases only the separate test save. These safeguards prevent accidental mixing; client-side saves are not an anti-cheat security boundary.

Validation:

- `node tools/check_test_mode.cjs`: seven checks executing current persistence/progression functions: explicit URL mode, copy/resume/reset isolation, 100× hero/mastery/pet XP, unchanged gold, caps, cloud/multiplayer guards, backup separation and level shortcuts.
- Existing 21 release checks, 11 companion checks and 14 boss lifecycle assertions pass.
- Local browser: entered from a normal level-22 hero, used +100 levels (level 173 after achievement bonuses), returned to the normal level-22 hero.
- At 390×844, controls measure 44 px high and no horizontal document overflow is present. No browser console errors in the test journey.

Physical device performance and progression balance are not validated by accelerated testing. Use normal-speed playtests to assess pacing.
