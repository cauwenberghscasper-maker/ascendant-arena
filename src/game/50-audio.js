// ---------------------------------------------------------------------
// 7. AUDIO — synthesized with Web Audio, no files
// ---------------------------------------------------------------------
const Sfx = {
  ctx: null, master: null, noiseBuf: null, last: {},
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC2 = window.AudioContext || window.webkitAudioContext; if (!AC2) return;
      this.ctx = new AC2(); this.master = this.ctx.createGain(); this.master.gain.value = G.profile.settings.mute ? 0 : 0.5; this.master.connect(this.ctx.destination);
      const n = this.ctx.sampleRate * 0.5; this.noiseBuf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  setMute(m) { if (this.master) this.master.gain.value = m ? 0 : 0.5; },
  ok(key, gap) { if (!this.ctx || G.profile.settings.mute) return false; const now = this.ctx.currentTime; if (this.last[key] && now - this.last[key] < (gap || 0.04)) return false; this.last[key] = now; return true; },
  tone(f0, f1, dur, type, vol, delay) {
    const c = this.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol, freq, q, sweepTo) {
    const c = this.ctx, t = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = 'bandpass'; f.frequency.setValueAtTime(freq || 1200, t); if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur); f.Q.value = q || 1;
    g.gain.setValueAtTime(vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.02);
  },
  play(name, o) {
    if (!this.ok(name, o && o.gap)) return;
    switch (name) {
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

