// Audio checks: every sound file in AUDIO_MANIFEST exists in both formats, every sound name the game plays exists
// (as a file or a synthesized fallback), and the shipped audio stays inside its size budget.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), game = path.join(root, 'src/game');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(game, '49-audio-data.js'), 'utf8') + '\nthis.M=AUDIO_MANIFEST;this.A=AUDIO_ALIAS;this.U=UI_ACT_SOUND;this.B=SYNTH_BUS;', ctx);
const { M, A, U } = ctx;
const audio = fs.readFileSync(path.join(game, '50-audio.js'), 'utf8');
const synth = new Set([...audio.slice(audio.indexOf('  synth(name, o) {')).matchAll(/case '([^']+)'/g)].map((m) => m[1]));
let passed = 0; const check = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };

check('every manifest file exists as .webm and .m4a', () => {
  for (const [k, m] of Object.entries(M)) {
    assert(m.file && !/\.(webm|m4a|ogg|mp3|wav)$/.test(m.file), `${k}: file is given without extension`);
    const files = m.n > 1 ? Array.from({ length: m.n }, (_, i) => `${m.file}-${i + 1}`) : [m.file];
    for (const f of files) for (const ext of ['webm', 'm4a']) assert(fs.existsSync(path.join(root, `${f}.${ext}`)), `${k}: missing ${f}.${ext}`);
    assert(!m.bus || ['music', 'amb', 'sfx', 'ui'].includes(m.bus), `${k}: unknown bus ${m.bus}`);
  }
});
check('every sound name played in the game has a file or a synth fallback', () => {
  const missing = [];
  for (const f of fs.readdirSync(game).filter((f) => f.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(game, f), 'utf8');
    for (const m of src.matchAll(/(?:Sfx\.play|Music\.stinger|Sfx\.load)\('([^']+)'/g)) {
      const k = A[m[1]] || m[1];
      if (!M[k] && !synth.has(k)) missing.push(`${f}: ${m[1]}`);
    }
  }
  assert.deepEqual(missing, [], 'unknown sound names');
});
check('every button sound in UI_ACT_SOUND exists, and every ui.* file has a synth fallback', () => {
  for (const k of new Set(Object.values(U))) if (k !== 'ui.none') assert(M[k] || synth.has(k), `UI_ACT_SOUND uses unknown ${k}`);
  for (const k of Object.keys(M)) if (k.startsWith('ui.')) assert(synth.has(k), `${k} has no synth fallback in 50-audio.js`);
  assert(synth.has('ui.tap') && synth.has('ui.deny'), 'default and disabled button sounds');
});
check('shipped audio stays within budget (music 14 MB, everything else 8 MB)', () => {
  let music = 0, other = 0; const dir = path.join(root, 'assets/audio');
  const walk = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.includes(`${path.sep}music${path.sep}`)) music += fs.statSync(p).size; else other += fs.statSync(p).size; } };
  walk(dir);
  assert(music <= 14 * 1048576, `music ${(music / 1048576).toFixed(1)} MB`); assert(other <= 8 * 1048576, `sfx/ui/ambience ${(other / 1048576).toFixed(1)} MB`);
});
check('every audio source is credited', () => {
  const lic = fs.readFileSync(path.join(root, 'assets/audio/LICENSES.md'), 'utf8');
  for (const m of Object.values(M)) assert(lic.includes(path.basename(m.file)), `${m.file} is not listed in assets/audio/LICENSES.md`);
});
console.log(`${passed} audio checks passed.`);
