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
  // ---- menu / UI (phase 2). Sources: Kenney starter kits, see assets/audio/LICENSES.md
  'ui.tap':     { file: 'assets/audio/ui/tap', n: 2, bus: 'ui', vol: 0.5, rate: 0.03, preload: true },
  'ui.open':    { file: 'assets/audio/ui/open', n: 2, bus: 'ui', vol: 0.55, rate: 0.02, preload: true },
  'ui.back':    { file: 'assets/audio/ui/back', n: 2, bus: 'ui', vol: 0.45, preload: true },
  'ui.tab':     { file: 'assets/audio/ui/tab', bus: 'ui', vol: 0.35, rate: 0.04, preload: true },
  'ui.toggle':  { file: 'assets/audio/ui/toggle', bus: 'ui', vol: 0.35, preload: true },
  'ui.equip':   { file: 'assets/audio/ui/equip', bus: 'ui', vol: 0.8, preload: true },
  'ui.salvage': { file: 'assets/audio/ui/salvage', bus: 'ui', vol: 0.55, rate: 0.05, preload: true },
  'ui.buy':     { file: 'assets/audio/ui/coin', bus: 'ui', vol: 0.6, rate: 0.03, preload: true },
  'ui.reel':    { file: 'assets/audio/ui/tab', bus: 'ui', vol: 0.22, rate: 0.06, max: 4, preload: true }, // chest reel ticks
  // Phase 3 (music), 4 (mobs/bosses) and 5 (player/ambience) add their entries here. Example:
  // 'mus.menu':      { file: 'assets/audio/music/menu', bus: 'music', loop: true, preload: true },
  // 'wolf.attack':   { file: 'assets/audio/mob/wolf-attack', n: 2, group: 'mob', range: 24 },
};

// bus for the synthesized sounds (anything not listed is 'sfx'); every ui.* key has a synth fallback in 50-audio.js
// old names that now play a ui.* sound
const AUDIO_ALIAS = { click: 'ui.tap', tick: 'ui.reel' };
const SYNTH_BUS = { click: 'ui', tick: 'ui', unlock: 'ui', job: 'ui', level: 'ui', win: 'ui', lose: 'ui', equipped: 'ui' };

// which UI sound a panel button plays (data-act → key). Anything not listed plays 'ui.tap';
// a disabled button (aria-disabled) plays 'ui.deny'. Results (forged, crafted, level up…) keep their own event sounds.
const UI_ACT_SOUND = (() => {
  const m = {}, put = (key, acts) => acts.split(' ').forEach((a) => { m[a] = key; });
  put('ui.open', 'mSmith mMenu mJournal mCases cases mCollection mDaily mPrestige mIdle mArena mPlayers mHero mGear mBrawlers mSkills mArtifacts mProgress mDelve openMenu openSettings credits inspect hub prestigeReview');
  put('ui.back', 'close inspectClose mergeBack hsBack hsAllBack unequip abandon');
  put('ui.tab', 'smithTab invTab idleTab artTab progTab tab relicTier tWhich ownedOnly tZoom collectionSlot');
  put('ui.equip', 'equip equip2 gwear hsWear petEquip equipAtk toggleArt bSel');
  put('ui.salvage', 'salvage salvage2 salvageAll sellItem');
  put('ui.buy', 'buyUpg gems upgradeHere upgradeMax upgradeMax2 vaultUp artUp key spend tSpend');
  put('ui.forge', 'forge upgrade mergeConfirm reroll enchReroll enchUp craftPiece trialForge');
  put('ui.claim', 'dailyClaim vaultCollect expClaim pickUp accept turnin offline prestigeConfirm');
  put('ui.go', 'bPlay mpGo riftGo trialGo dungeonGo expGo travel again queue');
  put('ui.none', 'caseOpen caseFast reelSkip'); // the chest reel plays its own unlock, ticks and reveal
  return m;
})();

// loudness of the synthesized ui.* sounds, matched by measurement to the file-based ones (peaks around -16 dB at
// default volumes): the synth was tuned quieter, so without this the deny buzz and the chest reveal disappear
const SYNTH_GAIN = { 'ui.deny': 5.5, 'ui.go': 4.5, 'ui.claim': 2.8, 'ui.reveal': 3.2, 'ui.spin': 2.4, 'ui.forge': 1.3 };

// voice caps per group (samples only; the synth has its own per-key gap)
const AUDIO_GROUPS = { mob: 6, boss: 3, step: 2 };
const AUDIO_MAX_VOICES = 24;
