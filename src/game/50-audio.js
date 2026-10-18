// ---------------------------------------------------------------------
// 7. AUDIO — Web Audio engine: buses, samples (49-audio-data.js), music, synth fallback
// ---------------------------------------------------------------------
// Graph:  sources → [per-voice gain → pan] → bus gain ─┬─ music → duck → compressor ─┐
//                                                      ├─ amb ────────────────────────┤→ master → speakers
//                                                      ├─ sfx ────────────────────────┤
//                                                      └─ ui ─────────────────────────┘
// Sfx.play(name, { x, z, gap, vol }) plays the sample if AUDIO_MANIFEST has it and it is loaded,
// otherwise the synthesized sound of the same name. Music.set(key) crossfades background tracks.
const AUDIO_VOL_KEYS = { master: 'volMaster', music: 'volMusic', amb: 'volMusic', sfx: 'volSfx', ui: 'volUi' };
const Sfx = {
  ctx: null, master: null, bus: {}, duckGain: null, noiseBuf: null, last: {}, _out: null,
  buf: {}, loading: {}, missing: {}, voices: [], fmt: null, armed: false,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume(); return; }
    try {
      const AC2 = window.AudioContext || window.webkitAudioContext; if (!AC2) return;
      const c = this.ctx = new AC2();
      this.master = c.createGain(); this.master.connect(c.destination);
      // music: duck (dips under big moments) → soft compressor so boss tracks never clip
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.25;
      this.duckGain = c.createGain(); this.duckGain.connect(comp); comp.connect(this.master);
      for (const k of ['music', 'amb', 'sfx', 'ui']) { const g = c.createGain(); g.connect(k === 'music' ? this.duckGain : this.master); this.bus[k] = g; }
      this._out = this.bus.sfx;
      this.applyVolumes(true);
      const n = c.sampleRate * 0.5; this.noiseBuf = c.createBuffer(1, n, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.fmt = this.pickFormat();
      this.preload();
      if (Music.key) { const k = Music.key; Music.key = null; Music.set(k); } // a track was asked for before the first tap
    } catch (e) { this.ctx = null; }
  },
  // browsers only allow audio after a tap: start the context on the first touch anywhere (title screen included)
  arm() {
    if (this.armed) return; this.armed = true;
    const go = () => { this.init(); if (this.ctx && this.ctx.state === 'running') { ['pointerdown', 'keydown', 'touchend'].forEach((t) => document.removeEventListener(t, go, true)); } };
    ['pointerdown', 'keydown', 'touchend'].forEach((t) => document.addEventListener(t, go, true));
  },
  pickFormat() {
    try { const a = document.createElement('audio'); if (a.canPlayType('audio/webm; codecs="opus"')) return 'webm'; if (a.canPlayType('audio/mp4; codecs="mp4a.40.2"')) return 'm4a'; } catch (e) { /* fall through */ }
    return 'm4a';
  },
  // ---- volume -------------------------------------------------------
  vol(bus) { const s = (G.profile && G.profile.settings) || {}, v = s[AUDIO_VOL_KEYS[bus]]; return (v == null ? 80 : v) / 100; },
  applyVolumes(now) {
    if (!this.ctx) return;
    const s = (G.profile && G.profile.settings) || {}, t = this.ctx.currentTime, set = (p, v) => { if (now) p.value = v; else p.setTargetAtTime(v, t, 0.05); };
    set(this.master.gain, s.mute ? 0 : this.vol('master') * 0.7);
    for (const k in this.bus) set(this.bus[k].gain, this.vol(k) * (k === 'amb' ? 0.7 : 1));
  },
  setMute(m) { if (G.profile && G.profile.settings) G.profile.settings.mute = !!m; this.applyVolumes(); },
  // music dips by `db` for `secs`, then comes back (boss roar, level up, legendary drop)
  duck(db, secs) {
    if (!this.duckGain) return; const g = this.duckGain.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(Math.pow(10, -(db || 6) / 20), t + 0.08);
    g.setTargetAtTime(1, t + 0.08 + (secs || 0.6), 0.35);
  },
  pause() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  // ---- position: quieter with distance, panned by where it is on screen ----
  spatial(o, range) {
    if (!o || o.x == null) return null;
    const lx = Cam.look && Cam.look.x != null ? Cam.look.x : G.player.x, lz = Cam.look && Cam.look.z != null ? Cam.look.z : G.player.z;
    const dx = o.x - lx, dz = o.z - lz, d = Math.hypot(dx, dz), r = range || 28;
    if (d >= r) return { g: 0, pan: 0 };
    let sx = -dx; // camera faces +z at yaw 0, so world +x is screen left
    if (typeof camera !== 'undefined' && camera.matrixWorld) { const e = camera.matrixWorld.elements; sx = dx * e[0] + dz * e[2]; }
    const f = 1 - d / r;
    return { g: f * f, pan: Math.max(-0.8, Math.min(0.8, sx / 16)) };
  },
  // per-voice output node: gain (+ stereo pan when positioned) into a bus
  voiceOut(bus, vol, sp) {
    const c = this.ctx, g = c.createGain(); g.gain.value = vol * (sp ? sp.g : 1);
    if (sp && sp.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = sp.pan; g.connect(p); p.connect(this.bus[bus]); }
    else g.connect(this.bus[bus]);
    return g;
  },
  ok(key, gap) { if (!this.ctx || !G.profile || G.profile.settings.mute) return false; const now = this.ctx.currentTime; if (this.last[key] && now - this.last[key] < (gap || 0.04)) return false; this.last[key] = now; return true; },
  // ---- sample loading -----------------------------------------------
  load(key) {
    const m = AUDIO_MANIFEST[key]; if (!m || !this.ctx) return Promise.resolve(null);
    if (this.buf[key]) return Promise.resolve(this.buf[key]);
    if (this.missing[key]) return Promise.resolve(null);
    if (this.loading[key]) return this.loading[key];
    const files = m.n > 1 ? Array.from({ length: m.n }, (_, i) => `${m.file}-${i + 1}`) : [m.file];
    const one = (f, fmt) => fetch(`${f}.${fmt}`).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
      .then((ab) => new Promise((res, rej) => { const p = this.ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); }));
    // Opus decode is missing on some older iPhones even when canPlayType says yes: retry once as AAC
    const get = (f) => one(f, this.fmt).catch((e) => { if (this.fmt !== 'webm') throw e; return one(f, 'm4a').then((b) => { this.fmt = 'm4a'; return b; }); });
    return (this.loading[key] = Promise.all(files.map((f) => get(f).catch(() => null))).then((bs) => {
      delete this.loading[key]; bs = bs.filter(Boolean);
      if (!bs.length) { this.missing[key] = true; return null; }
      return (this.buf[key] = bs);
    }));
  },
  preload() { for (const k in AUDIO_MANIFEST) if (AUDIO_MANIFEST[k].preload) this.load(k); },
  // load everything whose key starts with one of the prefixes (e.g. a biome's mobs when entering it)
  prefetch(prefixes) { for (const k in AUDIO_MANIFEST) if (prefixes.some((p) => k.startsWith(p))) this.load(k); },
  // ---- voices ---------------------------------------------------------
  // makes room for a new voice: per-key cap, group cap, global cap; the oldest voice is stopped
  steal(key, m) {
    const V = this.voices, cut = (pred, cap) => { const hit = V.filter(pred); if (hit.length >= cap) this.stopVoice(hit[0], 0.04); };
    cut((v) => v.key === key, m.max || 3);
    if (m.group) cut((v) => v.group === m.group, AUDIO_GROUPS[m.group] || 6);
    cut((v) => !v.loop, AUDIO_MAX_VOICES);
  },
  stopVoice(v, fade) {
    const i = this.voices.indexOf(v); if (i >= 0) this.voices.splice(i, 1);
    try { const t = this.ctx.currentTime; v.out.gain.setTargetAtTime(0, t, (fade || 0.05) / 3); v.src.stop(t + (fade || 0.05) + 0.02); } catch (e) { /* already stopped */ }
  },
  playBuf(key, m, bufs, o) {
    o = o || {}; const bus = m.bus || 'sfx', sp = this.spatial(o, m.range);
    if (sp && sp.g < 0.02) return null;
    this.steal(key, m);
    const c = this.ctx, src = c.createBufferSource(); src.buffer = bufs[(Math.random() * bufs.length) | 0];
    const jit = m.rate != null ? m.rate : (bus === 'sfx' ? 0.06 : 0);
    src.playbackRate.value = (o.rate || 1) * (1 + (Math.random() * 2 - 1) * jit);
    if (m.loop) { src.loop = true; if (m.loopStart != null) src.loopStart = m.loopStart; if (m.loopEnd != null) src.loopEnd = m.loopEnd; }
    const out = this.voiceOut(bus, (m.vol != null ? m.vol : 1) * (o.vol != null ? o.vol : 1), sp);
    src.connect(out); src.start(c.currentTime + (o.delay || 0));
    const v = { key, group: m.group, loop: !!m.loop, src, out };
    this.voices.push(v); src.onended = () => { const i = this.voices.indexOf(v); if (i >= 0) this.voices.splice(i, 1); };
    return v;
  },
  // ---- synth (no files) ---------------------------------------------
  tone(f0, f1, dur, type, vol, delay) {
    const c = this.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this._out || this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol, freq, q, sweepTo) {
    const c = this.ctx, t = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = 'bandpass'; f.frequency.setValueAtTime(freq || 1200, t); if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur); f.Q.value = q || 1;
    g.gain.setValueAtTime(vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this._out || this.master); s.start(t); s.stop(t + dur + 0.02);
  },
  // ---- main entry -----------------------------------------------------
  play(name, o) {
    if (AUDIO_ALIAS[name]) name = AUDIO_ALIAS[name];
    if (!this.ok(name, o && o.gap)) return;
    const m = AUDIO_MANIFEST[name];
    if (m) { const b = this.buf[name]; if (b) { this.playBuf(name, m, b, o); return; } this.load(name); }
    // synth fallback, routed into the right bus (and positioned when x/z are given)
    const bus = (m && m.bus) || SYNTH_BUS[name] || (name.startsWith('ui.') ? 'ui' : 'sfx'), sp = this.spatial(o, m && m.range);
    if (sp && sp.g < 0.02) return;
    this._out = this.voiceOut(bus, (o && o.vol != null ? o.vol : 1) * (SYNTH_GAIN[name] || 1), sp);
    try { this.synth(name, o || {}); } finally { this._out = this.bus.sfx; }
  },
  // the sound a panel button makes, from its data-act (UI_ACT_SOUND in 49-audio-data.js)
  ui(act, disabled) {
    if (disabled) { this.play('ui.deny'); return; }
    const k = UI_ACT_SOUND[act] || 'ui.tap'; if (k !== 'ui.none') this.play(k);
  },
  synth(name, o) {
    switch (name) {
      // ---- menu / UI fallbacks (used until a file exists, or if it fails to load) ----
      case 'ui.tap': this.tone(700, 500, 0.05, 'square', 0.05); break;
      case 'ui.open': this.tone(520, 0, 0.05, 'triangle', 0.08); this.tone(780, 0, 0.07, 'triangle', 0.08, 0.045); break;
      case 'ui.back': this.tone(620, 0, 0.05, 'triangle', 0.07); this.tone(415, 0, 0.08, 'triangle', 0.07, 0.045); break;
      case 'ui.tab': this.tone(1500, 1100, 0.025, 'triangle', 0.06); break;
      case 'ui.toggle': this.tone(1200, 0, 0.02, 'square', 0.04); this.tone(1600, 0, 0.02, 'square', 0.03, 0.03); break;
      case 'ui.equip': this.noise(0.12, 0.12, 1800, 1.2, 4000); this.tone(330, 660, 0.12, 'triangle', 0.07, 0.04); break;
      case 'ui.salvage': this.noise(0.16, 0.2, 900, 0.8, 300); this.tone(140, 70, 0.12, 'square', 0.05); break;
      case 'ui.buy': this.tone(988, 0, 0.07, 'triangle', 0.08); this.tone(1319, 0, 0.12, 'triangle', 0.08, 0.06); break;
      case 'ui.reel': this.tone(1800, 1400, 0.02, 'triangle', 0.035); break;
      // can't do that: two low dull blips
      case 'ui.deny': this.tone(196, 185, 0.07, 'square', 0.05); this.tone(185, 174, 0.09, 'square', 0.05, 0.09); break;
      // anvil: inharmonic metal partials + a bright strike
      case 'ui.forge': [[1250, 0.5, 0.11], [1870, 0.35, 0.07], [2690, 0.22, 0.05], [3970, 0.12, 0.03]].forEach(([f, d, v]) => this.tone(f, f * 0.995, d, 'sine', v)); this.noise(0.05, 0.22, 3500, 0.7); this.tone(160, 90, 0.08, 'square', 0.05); break;
      case 'ui.claim': [659, 880, 1175].forEach((f, i) => this.tone(f, 0, 0.14, 'triangle', 0.1, i * 0.06)); break;
      case 'ui.go': this.tone(220, 660, 0.22, 'sawtooth', 0.04); this.noise(0.25, 0.1, 600, 1, 2400); break;
      // chest lid: latch clack, then a rising shimmer
      case 'ui.spin': this.noise(0.05, 0.25, 1200, 0.9); this.tone(150, 100, 0.08, 'square', 0.06); this.noise(0.6, 0.06, 2000, 2, 7000); this.tone(330, 990, 0.5, 'triangle', 0.04, 0.05); break;
      // chest reveal: longer, higher and brighter with rarity (o.r = 0 common … 7 divine)
      case 'ui.reveal': {
        const r = Math.max(0, Math.min(7, o.r | 0)), S = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760, 2093, 2349];
        const n = Math.min(2 + r, 7), at = Math.min(r, 4), step = r >= 4 ? 0.075 : 0.06;
        for (let i = 0; i < n; i++) { const f = S[at + i], last = i === n - 1; this.tone(f, 0, last ? 0.25 + r * 0.06 : 0.14, 'triangle', 0.11, i * step); if (r >= 3) this.tone(f * 2, 0, last ? 0.3 : 0.1, 'sine', 0.035, i * step + 0.01); }
        if (r >= 4) { this.noise(0.7 + r * 0.1, 0.05 + r * 0.01, 6000, 2, 11000); this.duck(8, 0.6 + r * 0.1); }
        if (r >= 6) [S[at + n - 1] / 2, S[at + n - 1] * 0.75].forEach((f) => this.tone(f, 0, 0.9, 'sine', 0.06, n * step));
        break;
      }
      case 'bolt': this.tone(620, 280, 0.09, 'square', 0.07); break;
      case 'arrow': this.tone(1100, 520, 0.08, 'triangle', 0.1); this.noise(0.05, 0.05, 3000); break;
      case 'orb': this.tone(340, 170, 0.18, 'sine', 0.16); break;
      case 'wave': this.tone(240, 110, 0.12, 'sawtooth', 0.07); this.noise(0.08, 0.06, 900); break;
      case 'enemyShot': this.tone(900, 600, 0.1, 'sine', 0.05); break;
      case 'hit': this.noise(0.07, 0.16, 2200, 0.8); break;
      case 'hurt': this.tone(180, 90, 0.16, 'square', 0.12); this.noise(0.1, 0.12, 600); break;
      case 'dash': this.noise(0.18, 0.18, 700, 1.2, 2600); break;
      case 'melee': this.noise(0.1, 0.18, 1600, 1.5, 500); break;
      case 'boom': this.noise(0.35, 0.3, 400, 0.7, 90); this.tone(120, 40, 0.3, 'sine', 0.2); break;
      case 'super': this.tone(300, 1200, 0.3, 'sawtooth', 0.08); this.noise(0.3, 0.12, 800, 1, 3000); break;
      case 'coin': this.tone(988, 0, 0.07, 'triangle', 0.08); this.tone(1319, 0, 0.12, 'triangle', 0.08, 0.06); break;
      case 'level': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0, 0.18, 'triangle', 0.14, i * 0.09)); break;
      case 'job': [659, 784, 988].forEach((f, i) => this.tone(f, 0, 0.14, 'square', 0.07, i * 0.08)); break;
      case 'horn': this.tone(110, 98, 1.1, 'sawtooth', 0.12); this.tone(165, 147, 1.1, 'sawtooth', 0.08); break;
      case 'radiant': [784, 988, 1175, 1568, 1976, 2349].forEach((f, i) => { this.tone(f, 0, 0.5, 'sine', 0.16, i * 0.07); this.tone(f * 1.5, 0, 0.35, 'triangle', 0.05, i * 0.07 + 0.03); }); this.noise(1.2, 0.08, 6000, 2, 12000); break;
      case 'win': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0, 0.22, 'triangle', 0.14, i * 0.1)); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0, 0.25, 'triangle', 0.12, i * 0.12)); break;
      case 'click': this.tone(700, 500, 0.05, 'square', 0.05); break;
      case 'tracer': this.tone(1300, 700, 0.04, 'square', 0.035); break;
      case 'pellet': this.noise(0.14, 0.26, 900, 0.6, 300); this.tone(160, 70, 0.1, 'square', 0.08); break;
      case 'rail': this.tone(2400, 300, 0.28, 'sawtooth', 0.09); this.noise(0.2, 0.2, 3000, 0.7, 600); break;
      case 'missile': this.noise(0.3, 0.14, 500, 1, 1500); this.tone(300, 520, 0.2, 'triangle', 0.05); break;
      case 'shell': this.tone(180, 90, 0.16, 'sine', 0.16); break;
      case 'lob': this.tone(260, 140, 0.18, 'triangle', 0.12); break;
      case 'disc': this.tone(500, 900, 0.12, 'triangle', 0.07); break;
      case 'chakram': this.noise(0.25, 0.1, 1800, 3, 800); this.tone(600, 400, 0.2, 'sine', 0.05); break;
      case 'bounce': this.tone(1400, 900, 0.05, 'sine', 0.05); break;
      case 'split': this.noise(0.12, 0.16, 2500, 1, 700); break;
      case 'unlock': [523, 784, 1047, 1568].forEach((f, i) => this.tone(f, 0, 0.2, 'triangle', 0.12, i * 0.07)); break;
      case 'die': this.tone(300, 60, 0.35, 'square', 0.1); break;
      case 'pickup': this.tone(1200, 1800, 0.1, 'sine', 0.1); break;
      case 'tick': this.tone(880, 0, 0.08, 'square', 0.06); break;
      case 'zap': this.tone(1600, 300, 0.12, 'sawtooth', 0.06); this.noise(0.08, 0.08, 4000); break;
      case 'equipped': burst(G.player.x, 1.2, G.player.z, 18, 0xffd34a, 4, 0.6, 0.22, 3, 1.2); Sfx.play('job'); UI.alertT = 0; break;
      case 'pellet': this.tone(880 + Math.random() * 500, 0, 0.05, 'sine', 0.045); break;
      case 'fire': this.noise(0.4, 0.22, 500, 0.8, 1800); this.tone(220, 110, 0.3, 'sawtooth', 0.06); break;
      case 'ice': this.tone(2200, 1400, 0.15, 'triangle', 0.08); this.noise(0.12, 0.08, 5000); break;
      case 'storm': this.noise(0.35, 0.3, 1800, 0.5, 300); this.tone(90, 50, 0.4, 'square', 0.1); break;
      case 'poison': this.noise(0.5, 0.12, 300, 2, 900); break;
    }
  },
};

// ---------------------------------------------------------------------
// MUSIC — one track at a time, crossfaded; stingers play over a ducked track
// ---------------------------------------------------------------------
const Music = {
  key: null, voice: null, fade: 1.5,
  set(key, fade) {
    if (key === this.key) return; this.key = key;
    const f = fade != null ? fade : this.fade, old = () => { if (this.voice) { Sfx.stopVoice(this.voice, f); this.voice = null; } };
    if (!key || !Sfx.ctx || !AUDIO_MANIFEST[key]) { old(); return; }
    // the old track keeps playing until the new one is decoded, so a switch never leaves silence
    Sfx.load(key).then((b) => {
      if (this.key !== key) return; // switched away while loading
      old(); if (!b) return;
      const m = AUDIO_MANIFEST[key], v = Sfx.playBuf(key, Object.assign({ bus: 'music' }, m, { loop: m.loop !== false }), b, { vol: 0.0001 });
      if (!v) return; this.voice = v;
      const g = v.out.gain, t = Sfx.ctx.currentTime, target = m.vol != null ? m.vol : 1;
      g.setValueAtTime(0.0001, t); g.linearRampToValueAtTime(target, t + f);
    });
  },
  stop(fade) { this.set(null, fade); },
  // short one-shot (boss intro, victory, defeat) over the current track, which dips meanwhile
  stinger(key, o) {
    if (!Sfx.ctx || G.profile.settings.mute) return;
    Sfx.load(key).then((b) => {
      if (!b) return; const m = AUDIO_MANIFEST[key];
      Sfx.duck((o && o.db) || 10, b[0].duration * 0.8);
      Sfx.playBuf(key, Object.assign({ bus: 'music' }, m, { loop: false }), b, o);
    });
  },
};
Sfx.arm();
