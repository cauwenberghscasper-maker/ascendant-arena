# Readable pixel text, calmer Auto Hunt (25 Oct 2026, on `main`)

Casper: "The pixelart style is sometimes unreadable, 5 s and 2 look the same" and "Auto fight is too strong and fast,
it looks a bit sped up".

Text:
- Pixelify Sans draws 5 like S, 2 like Z, B like 8 and C like O at every weight. The old digit fix (system Arial via
  `local()`) did not reach the phone. All game text now uses Tiny5 (OFL, `assets/fonts/tiny5-latin*.woff2`, 26 KB),
  still pixel art, under the existing family name 'Arena Numerals' so every font stack picks it up. Scaled to
  Pixelify's cap height and line metrics (`size-adjust`, `*-override`), so layouts keep their size.
- No browser-made bold (`font-synthesis: none`): it smeared Tiny5's 1-pixel gaps shut (6 read as E). The close × stays
  in Pixelify (Tiny5's × is a 3x3 checker). Canvas labels in the skill tree draw at weight 400.
- Credits screen, README (font rule, licences) and `assets/fonts/OFL-tiny5.txt` updated.

Auto Hunt (`CFG.autoHunt` in `10-config.js`):
- Its timers ran on a fixed 1/60 s per drawn frame; at 120 FPS that was double speed (retargeting, unsticking,
  detours, dash and mining waits). It now gets the real frame time.
- Walks at 75% speed, strafes at 35% (was 70%), waits 1.5x the weapon cooldown between shots and deals 70% damage
  while it drives (`f.autoHunting`). Touch the stick and you play at full strength again.

Tested: screenshots of HUD and Daily at 390x844, in-game check (auto walk 0.75, auto damage 0.70x), `npm run check`,
smoke test. Still open: judge Tiny5 and Auto Hunt pace on a real phone.
