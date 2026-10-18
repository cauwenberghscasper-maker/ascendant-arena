// ---------------------------------------------------------------------
// 7a. AUDIO DATA — which sounds exist as files, and which bus every sound uses
// ---------------------------------------------------------------------
// Buses (each has its own volume slider in Settings › Sound):
//   music — background tracks, boss themes, stingers (compressed, ducked under big moments)
//   amb   — ambience loops (wind, lava, ocean, town); follows the music slider at 70 %
//   sfx   — combat and world sounds
//   ui    — menu buttons, chests, unlocks, level ups
//
// AUDIO_MANIFEST entry (all fields optional except file):
//   file:  path WITHOUT extension, e.g. 'assets/audio/ui/tap'. The engine adds '.webm' (Opus) or '.m4a' (AAC).
//   n:     number of variants -> files are '<file>-1', '<file>-2', … ; one is picked at random each play
//   bus:   'music' | 'amb' | 'sfx' | 'ui'   (default 'sfx')
//   vol:   0..1 (default 1)          rate: pitch jitter, ±fraction (default 0.06 for sfx, 0 for music/ui)
//   max:   voices of this key at once (default 3)      group: shared voice cap, e.g. 'mob'
//   range: metres for distance falloff when played with {x, z} (default 28)
//   loop:  true for music / ambience;  loopStart / loopEnd in seconds (optional)
//   preload: true -> fetched as soon as audio starts (menu music, UI)
// A key that has no file yet (or fails to load) falls back to the synthesized sound of the same name in 50-audio.js,
// so new files can be dropped in one by one without breaking anything.
const AUDIO_MANIFEST = {
  // Phase 2 (UI), 3 (music), 4 (mobs/bosses) and 5 (player/ambience) add their entries here. Example:
  // 'ui.tap':        { file: 'assets/audio/ui/tap', n: 2, bus: 'ui', preload: true },
  // 'mus.menu':      { file: 'assets/audio/music/menu', bus: 'music', loop: true, preload: true },
  // 'wolf.attack':   { file: 'assets/audio/mob/wolf-attack', n: 2, group: 'mob', range: 24 },
};

// bus for the synthesized sounds (anything not listed is 'sfx')
const SYNTH_BUS = { click: 'ui', tick: 'ui', unlock: 'ui', job: 'ui', level: 'ui', win: 'ui', lose: 'ui', equipped: 'ui' };

// voice caps per group (samples only; the synth has its own per-key gap)
const AUDIO_GROUPS = { mob: 6, boss: 3, step: 2 };
const AUDIO_MAX_VOICES = 24;
