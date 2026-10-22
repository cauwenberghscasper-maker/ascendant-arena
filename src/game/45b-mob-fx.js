// --- Monster attack art: every species fights in its own look ------------------------------------------------------
// One row per species (MON_ROWS in 12-monsters.js): its colours, the pixel particle it sheds (bit, bit2), the burst its
// moves and death make (hit: a style from tools/bake_hero_hits.py), all baked by tools/bake_mob_fx.py into
// assets/fx/mob/ (bits.png atlas, hit_<id>.png, ammo_<id>.png for the 25 species that shoot). The block between the
// markers is plain JSON: the baker reads it, so the art and the game never disagree. tools/check_mob_fx.cjs guards it.
// glyphs: atlas cell, frames, and how the particle moves (flutter: drifts and sways down; float: rises; debris: falls,
// bounces once, spins; ember: rises and flickers; spark: fast and short; drop: falls and splats; flake: drifts down;
// bolt: flickers in place; arc: flies straight out). glow: lit from inside (bloom picks it up).
const MOB_FX = /* <mob-fx> */ {
  "glyphs": {
    "fluff": { "cell": 0, "n": 1, "move": "flutter" }, "leaf": { "cell": 1, "n": 1, "move": "flutter" },
    "petal": { "cell": 2, "n": 1, "move": "flutter" }, "feather": { "cell": 3, "n": 1, "move": "flutter" },
    "spore": { "cell": 4, "n": 1, "move": "float" }, "pollen": { "cell": 5, "n": 1, "move": "float", "glow": true },
    "needle": { "cell": 6, "n": 1, "move": "debris" }, "clod": { "cell": 7, "n": 1, "move": "debris" },
    "pebble": { "cell": 8, "n": 1, "move": "debris" }, "shard": { "cell": 9, "n": 1, "move": "debris" },
    "flake": { "cell": 10, "n": 1, "move": "flake" }, "ember": { "cell": 11, "n": 2, "move": "ember", "glow": true },
    "spark": { "cell": 13, "n": 2, "move": "spark", "glow": true }, "drop": { "cell": 15, "n": 1, "move": "drop" },
    "bubble": { "cell": 16, "n": 1, "move": "float" }, "glob": { "cell": 17, "n": 1, "move": "drop" },
    "ink": { "cell": 18, "n": 1, "move": "drop" }, "sand": { "cell": 19, "n": 1, "move": "debris" },
    "web": { "cell": 20, "n": 1, "move": "flutter" }, "bone": { "cell": 21, "n": 1, "move": "debris" },
    "scale": { "cell": 22, "n": 1, "move": "debris" }, "coral": { "cell": 23, "n": 1, "move": "debris" },
    "bolt": { "cell": 24, "n": 2, "move": "bolt", "glow": true }, "smoke": { "cell": 26, "n": 3, "move": "float" },
    "wisp": { "cell": 29, "n": 2, "move": "float", "glow": true }, "rune": { "cell": 31, "n": 1, "move": "float", "glow": true },
    "mote": { "cell": 32, "n": 1, "move": "float", "glow": true }, "star": { "cell": 33, "n": 2, "move": "float", "glow": true },
    "chip": { "cell": 35, "n": 1, "move": "flake" }, "arc": { "cell": 36, "n": 1, "move": "arc", "glow": true }
  },
  "species": {
    "thistlehare": { "c": "#e8d890", "bit": "fluff", "bit2": "needle", "hit": "petals" },
    "hornet": { "c": "#ffd23a", "bit": "pollen", "bit2": "needle", "hit": "glint" },
    "truffleboar": { "c": "#a07858", "bit": "clod", "bit2": "leaf", "hit": "chips" },
    "myconid": { "c": "#d77cff", "bit": "spore", "bit2": "pollen", "hit": "mist" },
    "bramble": { "c": "#7a8a3a", "bit": "leaf", "bit2": "needle", "hit": "fibres" },
    "barkviper": { "c": "#8a6a48", "bit": "scale", "bit2": "leaf", "hit": "jaws" },
    "thornbeetle": { "c": "#8faa5a", "bit": "needle", "bit2": "pebble", "hit": "chips" },
    "gloompanther": { "c": "#6a5aa6", "bit": "wisp", "bit2": "mote", "hit": "claw" },
    "craggoat": { "c": "#c8c0b0", "bit": "pebble", "bit2": "sand", "hit": "chips" },
    "dustharpy": { "c": "#d8b080", "bit": "feather", "bit2": "sand", "hit": "fibres" },
    "bouldermimic": { "c": "#a8a89e", "bit": "pebble", "bit2": "clod", "hit": "chips" },
    "galeweaver": { "c": "#dfe6ee", "bit": "web", "bit2": "mote", "hit": "fibres" },
    "miragestalker": { "c": "#e8c890", "bit": "sand", "bit2": "wisp", "hit": "claw" },
    "pitfallwurm": { "c": "#c89a7a", "bit": "sand", "bit2": "clod", "hit": "jaws" },
    "frostgargoyle": { "c": "#8a9ab0", "bit": "pebble", "bit2": "flake", "hit": "chips" },
    "chillbanshee": { "c": "#bfe6ff", "bit": "wisp", "bit2": "flake", "hit": "mist" },
    "glacialtroll": { "c": "#d8f0ff", "bit": "flake", "bit2": "shard", "hit": "ring" },
    "iceshard": { "c": "#9fe8ff", "bit": "shard", "bit2": "flake", "hit": "glint" },
    "screecrawler": { "c": "#9a8a7a", "bit": "pebble", "bit2": "sand", "hit": "chips" },
    "echobat": { "c": "#c8a8ff", "bit": "arc", "bit2": "mote", "hit": "ring" },
    "sulfurslime": { "c": "#e0d84a", "bit": "glob", "bit2": "bubble", "hit": "splash" },
    "fumetoad": { "c": "#b8d040", "bit": "bubble", "bit2": "glob", "hit": "spatter" },
    "magmahound": { "c": "#ff7a3a", "bit": "ember", "bit2": "smoke", "hit": "claw" },
    "cinderelemental": { "c": "#ffa060", "bit": "ember", "bit2": "chip", "hit": "sparks" },
    "ashstalker": { "c": "#a8a29e", "bit": "chip", "bit2": "ember", "hit": "claw" },
    "emberwraith": { "c": "#ff8a3a", "bit": "ember", "bit2": "wisp", "hit": "sparks" },
    "scoriascorpion": { "c": "#ff9a6a", "bit": "pebble", "bit2": "ember", "hit": "chips" },
    "flamewyrm": { "c": "#ff6a1f", "bit": "ember", "bit2": "smoke", "hit": "sparks" },
    "manaleech": { "c": "#4a8aff", "bit": "mote", "bit2": "rune", "hit": "spatter" },
    "azuregolem": { "c": "#6a9aff", "bit": "shard", "bit2": "rune", "hit": "chips" },
    "riftspider": { "c": "#a06aff", "bit": "web", "bit2": "rune", "hit": "fibres" },
    "geodrone": { "c": "#c77dff", "bit": "shard", "bit2": "spark", "hit": "glint" },
    "voidray": { "c": "#4fd8ff", "bit": "wisp", "bit2": "mote", "hit": "mist" },
    "asteroidhermit": { "c": "#9a90a8", "bit": "pebble", "bit2": "spark", "hit": "chips" },
    "prismmimic": { "c": "#d0f4ff", "bit": "shard", "bit2": "spark", "hit": "glint" },
    "glassminotaur": { "c": "#bfe8ff", "bit": "shard", "bit2": "pebble", "hit": "chips" },
    "starsentry": { "c": "#fff0c0", "bit": "star", "bit2": "spark", "hit": "glint" },
    "astronomer": { "c": "#b08aff", "bit": "star", "bit2": "rune", "hit": "glint" },
    "nebulajelly": { "c": "#ff9bf2", "bit": "bubble", "bit2": "star", "hit": "mist" },
    "kelpie": { "c": "#2fbfa0", "bit": "drop", "bit2": "leaf", "hit": "splash" },
    "rapidsiren": { "c": "#7fd0ff", "bit": "drop", "bit2": "bubble", "hit": "splash" },
    "thrasher": { "c": "#6a8aaa", "bit": "drop", "bit2": "scale", "hit": "jaws" },
    "sporeurchin": { "c": "#4fffb0", "bit": "needle", "bit2": "spore", "hit": "spatter" },
    "angler": { "c": "#4a6aaa", "bit": "bubble", "bit2": "mote", "hit": "jaws" },
    "trenchcrawler": { "c": "#4a5a6a", "bit": "bubble", "bit2": "pebble", "hit": "chips" },
    "pressuresquid": { "c": "#6a3a9a", "bit": "ink", "bit2": "bubble", "hit": "spatter" },
    "leviathan": { "c": "#2a7a80", "bit": "drop", "bit2": "scale", "hit": "splash" },
    "abyssphantom": { "c": "#2fffd0", "bit": "wisp", "bit2": "bubble", "hit": "mist" },
    "boilcrab": { "c": "#ff6a4a", "bit": "bubble", "bit2": "smoke", "hit": "chips" },
    "steamelemental": { "c": "#f0f0f4", "bit": "smoke", "bit2": "drop", "hit": "mist" },
    "shaftvulture": { "c": "#7a6450", "bit": "feather", "bit2": "bone", "hit": "claw" },
    "obsidiangargoyle": { "c": "#5a4a70", "bit": "shard", "bit2": "ember", "hit": "chips" },
    "lightningwyvern": { "c": "#fff04a", "bit": "bolt", "bit2": "spark", "hit": "sparks" },
    "cyclone": { "c": "#d8e0ea", "bit": "wisp", "bit2": "sand", "hit": "mist" },
    "aetherray": { "c": "#c8b8ff", "bit": "feather", "bit2": "star", "hit": "glint" },
    "halosentinel": { "c": "#ffd86a", "bit": "star", "bit2": "spark", "hit": "ring" },
    "archon": { "c": "#fff07a", "bit": "feather", "bit2": "star", "hit": "glint" },
    "cosmicweaver": { "c": "#9a7aff", "bit": "web", "bit2": "star", "hit": "fibres" }
  }
} /* </mob-fx> */;

// --- runtime: pixel particles (one draw call), impact bursts and projectile sprites per species -------------------
// MobFX.bits(species, x, y, z, n, mode, opts)   modes: burst (outward), ring (along the ground), rise (out of a patch),
//   pull (drawn in: a wind-up), trail (behind a shot), spray (a cone along opts.a), line (along a lane)
// MobFX.hit(species, x, y, z, size) the species' burst · MobFX.ammo(projectile, trailOn) its shot · MobFX.shell(...)
// a shell falling onto a marker · MobFX.has(species) · MobFX.color(species) (hex)
const MobFX = (() => {
  const GL = MOB_FX.glyphs, SP = MOB_FX.species, MAX = 900, COLS = 8, ROWS = 5;
  const lin = {}; for (const id in SP) lin[id] = new THREE.Color(SP[id].c);
  const hexOf = {}; for (const id in SP) hexOf[id] = parseInt(SP[id].c.slice(1), 16);
  let index = { ammo: [], hit: [] };
  fetch('assets/fx/mob/index.json').then((r) => (r.ok ? r.json() : {})).then((j) => { index = Object.assign({ ammo: [], hit: [] }, j); }).catch(() => {});
  const loader = new THREE.TextureLoader(), texs = new Map();
  const tex = (name, data) => {
    let t = texs.get(name);
    if (!t) { t = loader.load('assets/fx/mob/' + name + '.png'); t.colorSpace = data ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; texs.set(name, t); }
    return t;
  };
  // ---------------------------------------------------------------- particles
  const MOVE = { flutter: 0, float: 1, debris: 2, ember: 3, spark: 4, drop: 5, flake: 6, bolt: 7, arc: 8 };
  const pos = new Float32Array(MAX * 3), dat = new Float32Array(MAX * 4), col = new Float32Array(MAX * 4);
  const vx = new Float32Array(MAX), vy = new Float32Array(MAX), vz = new Float32Array(MAX), life = new Float32Array(MAX), max = new Float32Array(MAX);
  const mv = new Uint8Array(MAX), cell0 = new Float32Array(MAX), frames = new Uint8Array(MAX), spin = new Float32Array(MAX), size0 = new Float32Array(MAX), ph = new Float32Array(MAX), landed = new Uint8Array(MAX);
  let n = 0;
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); geo.setIndex([0, 1, 2, 0, 2, 3]);
  const aPos = new THREE.InstancedBufferAttribute(pos, 3), aDat = new THREE.InstancedBufferAttribute(dat, 4), aCol = new THREE.InstancedBufferAttribute(col, 4);
  for (const a of [aPos, aDat, aCol]) a.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aPos', aPos); geo.setAttribute('aData', aDat); geo.setAttribute('aCol', aCol); geo.instanceCount = 0;
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex('bits', true) }, uGrid: { value: new THREE.Vector2(COLS, ROWS) } },
    vertexShader: `attribute vec3 aPos; attribute vec4 aData; attribute vec4 aCol; uniform vec2 uGrid;
      varying vec2 vUv; varying vec4 vCol; varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(aPos, 1.0); float c = cos(aData.y), s = sin(aData.y);
        mv.xy += vec2(c * position.x - s * position.y, s * position.x + c * position.y) * aData.x;
        gl_Position = projectionMatrix * mv;
        vec2 g = vec2(mod(aData.z, uGrid.x), floor(aData.z / uGrid.x));
        vUv = vec2((g.x + uv.x) / uGrid.x, 1.0 - (g.y + 1.0 - uv.y) / uGrid.y); vCol = aCol; vA = aData.w;
      }`,
    fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying vec4 vCol; varying float vA;
      float b2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
      void main() {
        vec4 t = texture2D(map, vUv); if (t.a < 0.5) discard;
        if (vA < b2(0.5 * gl_FragCoord.xy) * 0.25 + b2(gl_FragCoord.xy) + 0.02) discard; // pixel-dithered fade, no blending
        float l = t.r; vec3 c = vCol.rgb, o;
        if (l < 0.1) o = vec3(0.03, 0.022, 0.016);
        else if (l < 0.7) o = mix(c * 0.32, c, clamp((l - 0.38) / 0.32, 0.0, 1.0));
        else o = mix(c, mix(c, vec3(1.0), 0.72), (l - 0.7) / 0.3);
        gl_FragColor = vec4(o * (1.0 + vCol.a * 0.7), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    fog: false,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 5; dynGroup.add(mesh);
  const R = Math.random;
  function spawn(g, c, x, y, z, ux, uy, uz, lf, sz) {
    if (n >= MAX) return -1; const i = n++, G0 = GL[g];
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vx[i] = ux; vy[i] = uy; vz[i] = uz; life[i] = max[i] = lf;
    mv[i] = MOVE[G0.move]; cell0[i] = G0.cell; frames[i] = G0.n; spin[i] = (R() - 0.5) * (G0.move === 'debris' ? 14 : 4); size0[i] = sz; ph[i] = R() * 6.283; landed[i] = 0;
    dat[i * 4 + 1] = R() * 6.283; col[i * 4] = c.r; col[i * 4 + 1] = c.g; col[i * 4 + 2] = c.b; col[i * 4 + 3] = G0.glow ? 1 : 0;
    return i;
  }
  // how fast and how long each kind of particle lives when thrown out (floaty ones drift, debris flies)
  const THROW = { 0: [2.2, 1.4], 1: [1.4, 1.2], 2: [5.5, 0.9], 3: [2.6, 0.8], 4: [7, 0.4], 5: [4.5, 0.8], 6: [2, 1.4], 7: [0.4, 0.28], 8: [6, 0.6] };
  function bits(id, x, y, z, num, mode, o) {
    const S = SP[id]; if (!S || num <= 0) return; o = o || {};
    num = Math.max(1, Math.round(num * (Q.lowTier ? 0.5 : 1)));
    const c = lin[id], sc = o.size || 1;
    for (let k = 0; k < num; k++) {
      const g = o.glyph || (k % 3 === 2 && S.bit2 ? S.bit2 : S.bit), m = MOVE[GL[g].move], T = THROW[m];
      const sp = T[0] * (o.speed || 1) * (0.55 + R() * 0.7), lf = T[1] * (0.7 + R() * 0.6) * (o.life || 1), sz = (0.42 + R() * 0.24) * sc;
      let px = x, py = y, pz = z, ux, uy, uz, a = R() * 6.283;
      if (mode === 'ring') { ux = Math.sin(a) * sp * 1.2; uz = Math.cos(a) * sp * 1.2; uy = sp * 0.35; py = 0.25; }
      else if (mode === 'rise') { const d = (o.r || 1) * Math.sqrt(R()); px += Math.sin(a) * d; pz += Math.cos(a) * d; py = 0.15; ux = (R() - 0.5) * 0.6; uz = (R() - 0.5) * 0.6; uy = 0.6 + R() * 1.2; }
      else if (mode === 'pull') { const d = (o.r || 2) * (0.8 + R() * 0.6), t = Math.max(0.3, o.t || 0.6); px += Math.sin(a) * d; pz += Math.cos(a) * d; py = 0.3 + R() * 1.6; ux = -Math.sin(a) * d / t; uz = -Math.cos(a) * d / t; uy = (y - py) / t; const i = spawn(g, c, px, py, pz, ux, uy, uz, t, sz); if (i >= 0) mv[i] = MOVE.arc; continue; }
      else if (mode === 'trail') { ux = (R() - 0.5) * 0.8; uy = (R() - 0.3) * 0.8; uz = (R() - 0.5) * 0.8; }
      else if (mode === 'spray' || mode === 'line') { const aa = (o.a || 0) + (R() - 0.5) * (o.spread || 0.6); if (mode === 'line') { const d = R() * (o.len || 6); px += Math.sin(o.a || 0) * d; pz += Math.cos(o.a || 0) * d; } ux = Math.sin(aa) * sp; uz = Math.cos(aa) * sp; uy = sp * 0.3 * R(); }
      else { const e = R() * 1.2 + 0.15; ux = Math.sin(a) * Math.cos(e) * sp; uz = Math.cos(a) * Math.cos(e) * sp; uy = Math.sin(e) * sp + (m === 2 || m === 5 ? 2.5 : 0.5); }
      spawn(g, c, px, py, pz, ux, uy, uz, lf, sz);
    }
  }
  function updateBits(dt, t) {
    let w = 0;
    for (let i = 0; i < n; i++) {
      life[i] -= dt; if (life[i] <= 0) continue;
      const m = mv[i]; let gy = 0, drag = 1, sway = 0;
      if (m === 0) { gy = -1.6; drag = 1.8; sway = 1.1; } else if (m === 1) { gy = 0.9; drag = 1.6; sway = 0.5; }
      else if (m === 2) { gy = -16; drag = 0.4; } else if (m === 3) { gy = 1.6; drag = 1.3; sway = 0.4; } else if (m === 4) { gy = -7; drag = 2.6; }
      else if (m === 5) { gy = -13; drag = 0.3; } else if (m === 6) { gy = -1.1; drag = 1.5; sway = 1.4; } else if (m === 7) { drag = 6; } else { drag = 0.6; }
      const k = Math.exp(-drag * dt); vx[i] *= k; vz[i] *= k; vy[i] = vy[i] * k + gy * dt;
      let x = pos[i * 3] + vx[i] * dt + (sway ? Math.sin(t * 5 + ph[i]) * sway * dt : 0), y = pos[i * 3 + 1] + vy[i] * dt, z = pos[i * 3 + 2] + vz[i] * dt;
      if (y < 0.06 && vy[i] < 0) {
        y = 0.06;
        if ((m === 2 || m === 8) && !landed[i]) { landed[i] = 1; vy[i] = -vy[i] * 0.32; vx[i] *= 0.5; vz[i] *= 0.5; spin[i] *= 0.3; }
        else { vy[i] = 0; vx[i] *= 0.6; vz[i] *= 0.6; spin[i] = 0; if (m === 5) life[i] = Math.min(life[i], 0.12); }
      }
      const age = max[i] - life[i], fade = Math.min(1, life[i] / (max[i] * 0.4));
      let s = size0[i], f = 0;
      if (frames[i] > 1) f = (m === 1 && frames[i] === 3) ? Math.min(2, Math.floor(age / max[i] * 3)) : Math.floor((t * 12 + ph[i]) % frames[i]);
      if (m === 4) s *= 0.5 + 0.5 * fade; else if (m === 1 && frames[i] === 3) s *= 1 + age * 0.8;
      // compact into slot w (swap-free: live particles move down)
      pos[w * 3] = x; pos[w * 3 + 1] = y; pos[w * 3 + 2] = z;
      dat[w * 4] = s; dat[w * 4 + 1] = dat[i * 4 + 1] + spin[i] * dt; dat[w * 4 + 2] = cell0[i] + f; dat[w * 4 + 3] = fade;
      if (w !== i) {
        col[w * 4] = col[i * 4]; col[w * 4 + 1] = col[i * 4 + 1]; col[w * 4 + 2] = col[i * 4 + 2]; col[w * 4 + 3] = col[i * 4 + 3];
        vx[w] = vx[i]; vy[w] = vy[i]; vz[w] = vz[i]; life[w] = life[i]; max[w] = max[i]; mv[w] = mv[i]; cell0[w] = cell0[i]; frames[w] = frames[i];
        spin[w] = spin[i]; size0[w] = size0[i]; ph[w] = ph[i]; landed[w] = landed[i];
      }
      w++;
    }
    n = w; geo.instanceCount = n;
    if (n) { aPos.needsUpdate = aDat.needsUpdate = aCol.needsUpdate = true; aPos.addUpdateRange(0, n * 3); aDat.addUpdateRange(0, n * 4); aCol.addUpdateRange(0, n * 4); }
  }
  // ---------------------------------------------------------------- sprite players: bursts (16 frames, 4x4) and shots (4 frames)
  const pool = [];
  function sprite() {
    let s = pool.find((o) => !o.on);
    if (!s) { if (pool.length >= 96) return null; const m = new THREE.SpriteMaterial({ transparent: true, alphaTest: 0.5, depthWrite: false, fog: false, toneMapped: false }); s = { spr: new THREE.Sprite(m), mat: m, on: false, map: null }; s.spr.frustumCulled = false; s.spr.renderOrder = 6; dynGroup.add(s.spr); pool.push(s); }
    return s;
  }
  function bind(s, name, rx, ry) {
    const base = tex(name);
    if (!s.map || s.map.source !== base.source) { if (s.map) s.map.dispose(); s.map = base.clone(); s.map.repeat.set(rx, ry); s.mat.map = s.map; s.mat.needsUpdate = true; }
  }
  const has = (kind, id) => index[kind] && index[kind].includes(id);
  function hit(id, x, y, z, size, speed) {
    if (!has('hit', id)) return false; const s = sprite(); if (!s) return false;
    bind(s, 'hit_' + id, 0.25, 0.25); s.on = true; s.kind = 'hit'; s.t = 0; s.speed = speed || 1.4;
    s.spr.position.set(x, y, z); s.spr.scale.set(size, size, 1); s.mat.rotation = (R() - 0.5) * 0.6; s.spr.visible = true; s.map.offset.set(0, 0.75);
    return true;
  }
  let ammoUsed = [];
  function ammoBegin() { for (const s of ammoUsed) { s.on = false; s.spr.visible = false; } ammoUsed = []; }
  function shot(id, x, y, z, size, t) {
    if (!has('ammo', id)) return false; const s = sprite(); if (!s) return true;
    bind(s, 'ammo_' + id, 0.25, 1); s.on = true; s.kind = 'ammo'; s.spr.visible = true; s.spr.position.set(x, y, z); s.spr.scale.set(size, size, 1); s.mat.rotation = 0;
    s.map.offset.set((Math.floor(t * 14) % 4) * 0.25, 0); ammoUsed.push(s); return true;
  }
  function ammo(p, trailOn) {
    const id = p.mt; if (!SP[id]) return false;
    if (trailOn && R() < 0.55 * fxK) bits(id, p.x, p.y, p.z, 1, 'trail', { size: 0.8 });
    return shot(id, p.x, p.y, p.z, Math.max(0.9, p.r * 2.7), G.time + (p.owner || 0) * 0.13);
  }
  // a shell on its way down to a rain marker (k: 0 just cast .. 1 landing)
  function shell(id, x, z, k) {
    const y = 0.5 + 11 * (1 - k) * (1 - k);
    if (!shot(id, x + (1 - k) * 2.5, y, z - (1 - k) * 1.5, 1.2, G.time)) { if (R() < 0.4 * fxK) bits(id, x, y, z, 1, 'trail'); }
    else if (R() < 0.35 * fxK) bits(id, x, y + 0.3, z, 1, 'trail', { size: 0.8 });
  }
  function update(dt) {
    updateBits(dt, G.time);
    for (const s of pool) {
      if (!s.on || s.kind !== 'hit') continue;
      s.t += dt * s.speed; const f = Math.floor(s.t * 30);
      if (f >= 16) { s.on = false; s.spr.visible = false; continue; }
      s.map.offset.set((f % 4) * 0.25, 0.75 - Math.floor(f / 4) * 0.25);
    }
  }
  function clear() { n = 0; geo.instanceCount = 0; for (const s of pool) { s.on = false; s.spr.visible = false; } ammoUsed = []; }
  return { bits, hit, ammo, ammoBegin, shell, update, clear, has: (id) => !!SP[id], color: (id) => hexOf[id], pal: (id) => fxPal(hexOf[id]), count: () => n, index: () => index };
})();
