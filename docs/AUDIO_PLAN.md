# Audio plan — music, boss music, mob sounds, SFX, UI sounds

State today: `src/game/50-audio.js` (75 lines) is a pure Web Audio synth (`Sfx.play(name)`, ~40 beeps/noise bursts),
one master gain, one setting (`mute`). No music, no ambience, no mob voices, no volume control, no files.
Calls come from `62-events-fx.js` (combat events), `61-panels.js` / `63-menus.js` (clicks), `71-cases-idle.js`, `90-boot.js`.

## Core decision: hybrid, not a rewrite

- **Keep the synth** for high-frequency, tiny sounds (tracer, pellet, bounce, tick). Zero latency, zero bytes, already tuned.
- **Add sample playback** (decoded `AudioBuffer`s) for everything that needs character: music, ambience, mob voices,
  boss sounds, impacts, UI. Beeps can't sell a yeti roar or a boss theme.
- Same API: `Sfx.play('wolf.attack', { x, z })` — the name decides synth or sample, so call sites barely change.

## Phase 1 — engine (no new content yet)

`50-audio.js`
- Buses: `master → music | ambience | sfx | ui`, each its own GainNode. Music bus gets a compressor so boss tracks don't clip.
- Sample layer: `load(key)` fetch + `decodeAudioData`, cache, lazy per biome. `play(key, {x, z, vol, rate, variant})`:
  random variant (2–3 files per sound) + ±6 % pitch so repeats don't sound robotic.
- 3D-lite: volume by distance to camera focus + `StereoPanner` by screen x. No PannerNode (too costly on phones).
- Voice limits: max 24 voices total, max 6 mob voices, max 2 of the same key per 80 ms. Oldest/quietest stolen.
- Music player: two looping sources, 1.5 s crossfade, `Music.set(trackKey)`, stingers (one-shot over ducked music).
- Ducking: big events (boss roar, level up, radiant drop) dip music −6 dB for 0.6 s.
- Mobile: `visibilitychange` (already in `90-boot.js:74`) → `ctx.suspend()/resume()`; keep the existing unlock-on-first-tap.

New `src/game/49-audio-data.js` (before 50): `AUDIO_MANIFEST` — key → files, bus, volume, variants, max voices.

`22-profile.js`: settings `vol: { master: 0.8, music: 0.6, sfx: 0.8, ui: 0.7 }` + migration in `sanitizeProfile`.
`61-panels.js`: Settings › Sound — 4 sliders + mute; replace the "All sound is generated live" text (line 744).

## Phase 2 — UI / menu sounds (small, high payoff)

| Key | When |
|---|---|
| `ui.tap` | any button (central hook in `handlePanelClick`, replaces 20 scattered `click` calls) |
| `ui.back` / `ui.open` / `ui.tab` | Menu back, hub page open, sub-tab switch |
| `ui.toggle` / `ui.slider` | settings controls |
| `ui.deny` | can't afford / locked |
| `ui.buy`, `ui.equip`, `ui.salvage` | shop, gear, salvage |
| `ui.forge.hammer`, `ui.forge.success`, `ui.forge.fail` | Forge / Reforge / Enchant / Masterwork |
| `ui.chest.spin` (reel tick), `ui.chest.reveal.<rarity>` | Cases, Open 5 reels — rarity = escalating reveal |
| `ui.unlock` (white-pulse tab tapped), `ui.levelup`, `ui.toast`, `ui.banner.gold/red` | progression |

## Phase 3 — music

| Track | Plays in | Notes |
|---|---|---|
| `mus.menu` | title / menu hub | calm theme, the game's "identity" melody |
| `mus.town` | Base Camp / safe zones | light, loop 2–3 min |
| `mus.biome.0–5` | Woodlands, Peaks, Volcanic, Arcane, Ocean, Celestial | one per biome, all share the main motif |
| `mus.dungeon`, `mus.rift`, `mus.arena` | modes | rift = faster/tenser |
| `mus.boss.lair` | lair bosses (29) | one shared track, mid intensity |
| `mus.boss.biome` | Golem, Colossus, Titan, Leviathan… | epic, 1 track (optionally per-biome intro stinger) |
| `mus.boss.rift` | Rift Lord | |
| stingers | `boss.intro`, `victory`, `defeat`, `levelup` | 2–6 s one-shots |

**Music director** (in `80-main-loop.js`, view side, ~4×/s): picks the track from mode + current zone biome + "boss engaged"
(nearest `.boss` / `lairBoss` enemy in aggro within ~25 m and alive). Hysteresis: boss music stays 4 s after disengage,
biome switch waits for 3 s inside the new zone — prevents flapping at borders. No sim changes needed.
Boss down → `victory` stinger → crossfade back.

## Phase 4 — mob and boss sounds

14 monster bodies (`assets/enemy/`): beetle, boar, crawler, drowned, fireimp, imp, sentinel, seraph, slime, spider,
warden, wolf, wraith, yeti. Per body: `aggro`, `attack`, `hurt`, `die` (+ `idle` for 4–5 of them) → ~60 sounds, 2 variants.
Hook in `62-events-fx.js`: `hit` (hurt, only on player hits, throttled), `die`, `shoot`/`melee` from enemies, plus a new
`aggro` event from `33-world-sim.js` when a mob locks on (one-line `G.events.push`).

Bosses (`33b-boss-kits.js`, `39b-lair-bosses.js`, `36-dungeon.js`): `roar` on engage, `telegraph` on red warnings
(this is gameplay-critical: sound tells the player to dash), `slam`, `phase`, `death`. Pitch-shift biome roar ×0.7 for
lair bosses so 29 bosses don't need 29 sets.

## Phase 5 — player SFX upgrade + ambience

- Replace the weakest synth sounds with samples: `melee`, `hit` (+ `hit.crit`), `hurt`, `boom`, `dash`, `super`, `coin`,
  `pickup`, `die`, `mined` (pickaxe), heroes' signature supers (`assets/data/hero-supers-v6.js`).
- Footsteps: one soft set, player only, every ~0.35 s while moving (skip per-terrain — not worth it on phone speakers).
- Ambience loop per biome (birds/wind/lava/ocean/hum/choir) + town chatter, on the ambience bus, crossfaded with zones.

## Phase 6 — budget, build, checks

- Format: **Opus in .webm** (`.ogg` fails on older iOS) with **.m4a (AAC) fallback**; pick via `canPlayType` once.
- Music 64 kbps stereo, SFX 48 kbps mono, trim silence, normalise to −16 LUFS (music) / −14 (SFX).
- Budget: music ~12 MB (12 loops), SFX+UI+ambience ~6 MB. Only `mus.menu`, UI and current biome load at start;
  the rest streams per zone. App build (`tools/build.cjs --app`) includes `assets/audio/`.
- New check `tools/check_audio.cjs` (wired into `npm run check`): every manifest key has its files, every
  `Sfx.play('x')` key exists in synth or manifest, total size under budget.
- Test on a real phone: 30 mobs + boss fight, watch FPS and crackle; lower voice cap on `low` quality tier.

## Sourcing (the real bottleneck — code is the easy part)

- License must allow commercial store release without attribution headaches: CC0 first (Kenney audio packs for UI and
  impacts, OpenGameArt CC0), Sonniss GDC bundles (royalty-free) for creature/foley.
- Music: one composer-quality motif reused across all tracks beats 12 unrelated free loops. Options: commission,
  or an AI music tool whose terms grant commercial rights — check the terms before shipping to the stores.
- Keep a `assets/audio/LICENSES.md` with source + license per file, like the model folders.

## Order and size

1 engine (1 session) → 2 UI (½) → 3 music + director (1) → 4 mobs/bosses (1–2) → 5 player + ambience (1) → 6 checks/budget (½).
Phases 1–3 alone give ~80 % of the felt improvement.
