// --- dynamic effects: projectiles, particles, rings, aim indicator ---------------------
const orbIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), PROJ_MAX);
const arrowIM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.16, 1.2), new THREE.MeshBasicMaterial({ color: 0xffffff }), 360);
const discIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 0.22, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), 120);
discIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); discIM.frustumCulled = false; discIM.count = 0; discIM.setColorAt(0, _col.set(0xffffff)); dynGroup.add(discIM);
for (const im of [orbIM, arrowIM]) { im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.count = 0; im.setColorAt(0, _col.set(0xffffff)); dynGroup.add(im); }
// soft additive halo behind every bullet (cheap fake bloom)
function radialTexture(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); stops.forEach(([k, a]) => gr.addColorStop(k, `rgba(255,255,255,${a})`));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glowTex = radialTexture([[0, 0.9], [0.25, 0.55], [0.6, 0.12], [1, 0]]);
const glowIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }), PROJ_MAX);
glowIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); glowIM.frustumCulled = false; glowIM.count = 0; glowIM.setColorAt(0, _col.set(0xffffff)); glowIM.renderOrder = 5; dynGroup.add(glowIM);

const PART_MAX = 600;
const partIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), PART_MAX);
partIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); partIM.frustumCulled = false; partIM.count = 0; partIM.setColorAt(0, _col.set(0xffffff)); dynGroup.add(partIM);
const PD = { x: new Float32Array(PART_MAX), y: new Float32Array(PART_MAX), z: new Float32Array(PART_MAX), vx: new Float32Array(PART_MAX), vy: new Float32Array(PART_MAX), vz: new Float32Array(PART_MAX),
  life: new Float32Array(PART_MAX), max: new Float32Array(PART_MAX), size: new Float32Array(PART_MAX), grav: new Float32Array(PART_MAX), col: new Uint32Array(PART_MAX) };
let partCursor = 0;
function burst(x, y, z, n, color, speed, life, size, grav, up) {
  for (let i = 0; i < n; i++) {
    const k = partCursor; partCursor = (partCursor + 1) % PART_MAX;
    const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
    PD.x[k] = x; PD.y[k] = y; PD.z[k] = z; PD.vx[k] = Math.cos(a) * s; PD.vz[k] = Math.sin(a) * s; PD.vy[k] = (up || 0.5) * speed * (0.5 + Math.random());
    PD.life[k] = PD.max[k] = life * (0.6 + Math.random() * 0.6); PD.size[k] = size * (0.6 + Math.random() * 0.8); PD.grav[k] = grav; PD.col[k] = color;
  }
}

// --- baked pixel effects (assets/fx): sprite sheets generated offline frame by frame, Pixel-FX-Designer style.
// explosion = fire core that rises into a smoke column (billboard, anchored at the ground), hit = flash + flying
// shards (billboard), ring = shockwave (flat on the ground). Each comes in five colour themes.
// more kinds (tools/bake_fx.py): impact, crit, flame, shatter, slash, poof, dust, zap, bolt, nova, pillar, bubble.
// pals = colour themes baked for that kind; base = 'bottom' anchors the sprite on the ground.
const FX_SHEETS = {
  explosion: { w: 64, h: 112, n: 22, fps: 26, base: 'bottom', pals: ['fire', 'frost', 'arcane', 'venom', 'blood'] },
  hit: { w: 48, h: 48, n: 10, fps: 30, pals: ['fire', 'frost', 'arcane', 'venom', 'blood'] },
  ring: { w: 64, h: 64, n: 12, fps: 26, flat: true, pals: ['fire', 'frost', 'arcane', 'venom', 'blood'] },
  impact: { w: 40, h: 40, n: 8, fps: 30, pals: ['fire', 'frost', 'arcane', 'venom', 'blood', 'gold', 'white', 'storm'] },
  crit: { w: 64, h: 64, n: 10, fps: 28, pals: ['gold', 'fire', 'arcane'] },
  flame: { w: 40, h: 56, n: 14, fps: 24, base: 'bottom', pals: ['fire', 'venom', 'arcane', 'frost'] },
  shatter: { w: 56, h: 56, n: 12, fps: 26, pals: ['frost', 'arcane', 'white'] },
  slash: { w: 64, h: 64, n: 8, fps: 30, pals: ['white', 'fire', 'frost', 'arcane', 'venom', 'blood', 'gold'] },
  poof: { w: 56, h: 72, n: 16, fps: 22, base: 'bottom', pals: ['fire', 'frost', 'arcane', 'venom', 'blood', 'gold', 'white'] },
  dust: { w: 64, h: 32, n: 12, fps: 24, base: 'bottom', pals: ['dust'] },
  zap: { w: 48, h: 48, n: 8, fps: 30, pals: ['storm', 'arcane'] },
  bolt: { w: 40, h: 128, n: 10, fps: 26, base: 'bottom', pals: ['storm', 'gold', 'arcane'] },
  nova: { w: 96, h: 96, n: 14, fps: 26, pals: ['gold', 'arcane', 'frost', 'fire', 'venom', 'blood'] },
  pillar: { w: 48, h: 144, n: 20, fps: 24, base: 'bottom', pals: ['gold', 'frost', 'arcane', 'blood', 'venom'] },
  bubble: { w: 48, h: 56, n: 14, fps: 20, base: 'bottom', pals: ['venom', 'arcane'] },
};
// nearest baked theme when a kind lacks the asked one (e.g. gold slash -> gold, storm hit -> frost)
const FX_PAL_NEAR = { storm: ['frost', 'white'], gold: ['fire', 'white'], white: ['frost', 'gold'], blood: ['fire'], venom: ['fire'], arcane: ['frost'], frost: ['white', 'storm'], fire: ['gold'], dust: ['white'] };
function fxPalFor(kind, pal) {
  const P = FX_SHEETS[kind].pals; if (P.includes(pal)) return pal;
  for (const q of FX_PAL_NEAR[pal] || []) if (P.includes(q)) return q;
  return P[0];
}
const SpriteFX = {
  tex: new Map(), items: [], loader: new THREE.TextureLoader(),
  sheet(kind, pal) {
    const k = kind + '_' + pal; let t = this.tex.get(k);
    if (!t) { t = this.loader.load('assets/fx/' + k + '.png'); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; this.tex.set(k, t); }
    return t;
  },
  item(flat) {
    let it = this.items.find((o) => !o.on && o.flat === flat);
    if (!it) {
      if (this.items.length > 140) return null;
      const mat = flat ? new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, alphaTest: 0.4, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -20 })
        : new THREE.SpriteMaterial({ transparent: true, depthWrite: false, alphaTest: 0.4, toneMapped: false });
      const obj = flat ? new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat) : new THREE.Sprite(mat);
      obj.frustumCulled = false; obj.renderOrder = 6; dynGroup.add(obj);
      it = { obj, mat, flat, on: false }; this.items.push(it);
    }
    return it;
  },
  play(kind, pal, x, y, z, size, opts) {
    const S = FX_SHEETS[kind]; if (!S) return; pal = fxPalFor(kind, pal);
    const it = this.item(!!S.flat); if (!it) return;
    const base = this.sheet(kind, pal);
    if (!it.map || it.map.source !== base.source) { if (it.map) it.map.dispose(); it.map = base.clone(); it.map.repeat.set(1 / S.n, 1); it.mat.map = it.map; it.mat.needsUpdate = true; }
    it.on = true; it.obj.visible = true; it.kind = kind; it.t = -(opts && opts.delay || 0); it.speed = (opts && opts.speed) || 1;
    const h = size, w = size * S.w / S.h;
    if (it.flat) { it.obj.position.set(x, 0.32, z); it.obj.scale.set(w, 1, h); it.obj.rotation.y = Math.random() * 6.28; }
    else { it.obj.position.set(x, y, z); it.obj.scale.set(w, h, 1); it.obj.center.set(0.5, S.base === 'bottom' ? 0.06 : 0.5); it.mat.rotation = opts && opts.rot != null ? opts.rot : 0; }
    it.map.offset.set(0, 0); it.obj.visible = it.t >= 0;
  },
  update(dt) {
    for (const it of this.items) {
      if (!it.on) continue;
      it.t += dt * it.speed; if (it.t < 0) continue;
      const S = FX_SHEETS[it.kind], f = Math.floor(it.t * S.fps);
      if (f >= S.n) { it.on = false; it.obj.visible = false; continue; }
      it.obj.visible = true; it.map.offset.set(f / S.n, 0);
    }
  },
};
// --- gear aura in the world: legendary+ gear makes the hero shed light (embers, flames, orbiting motes, sparkles) ---
// Strength grows with how many pieces are legendary or better; the look follows the best piece.
function mote(x, y, z, vx, vy, vz, life, size, grav, col) {
  const k = partCursor; partCursor = (partCursor + 1) % PART_MAX;
  PD.x[k] = x; PD.y[k] = y; PD.z[k] = z; PD.vx[k] = vx; PD.vy[k] = vy; PD.vz[k] = vz;
  PD.life[k] = PD.max[k] = life; PD.size[k] = size; PD.grav[k] = grav; PD.col[k] = col;
}
const GearAura = { sig: '', best: -1, n: 0, acc: 0, twT: 0 };
function updateGearAura(dt) {
  if (!HERO_OVERLAYS) return;
  const pl = G.player, p = G.profile; if (!pl || !p || !pl.alive || !G.started) return;
  const gear = p.gear || {}, sig = gearSignature(gear);
  if (sig !== GearAura.sig) {
    GearAura.sig = sig; GearAura.best = -1; GearAura.n = 0;
    for (const sl of CFG.gear.slots) { const it = gear[sl]; if (!it) continue; const r = rarIdx(it.rarity); if (r > GearAura.best) GearAura.best = r; if (r >= 4) GearAura.n++; }
  }
  const b = GearAura.best; if (b < 4) return;
  const rar = RARITIES[b], gs = growthScale(pl), y0 = (Showcase.on ? Showcase.podium : 0);
  const rate = (b === 4 ? 5 : b === 5 ? 9 : b === 6 ? 10 : 14) * (0.55 + 0.09 * GearAura.n);
  GearAura.acc += dt * rate;
  while (GearAura.acc >= 1) {
    GearAura.acc -= 1;
    const a = Math.random() * 6.283, r = (0.45 + Math.random() * 0.45) * gs, x = pl.x + Math.cos(a) * r, z = pl.z + Math.sin(a) * r;
    if (b === 4) mote(x, y0 + 0.2 + Math.random() * 1.2 * gs, z, 0, 0.6, 0, 0.9 + Math.random() * 0.5, 0.13, -0.9, Math.random() < 0.3 ? 0xfff0a8 : 0xffb347);
    else if (b === 5) { // mythic: crimson flame licks at the feet and embers that shoot up
      mote(x, y0 + 0.15, z, (Math.random() - 0.5) * 0.4, 1.4 + Math.random(), (Math.random() - 0.5) * 0.4, 0.55 + Math.random() * 0.3, 0.2, -1.5, Math.random() < 0.25 ? 0xffb3bf : Math.random() < 0.5 ? 0xff4d6d : 0xa3122e);
    } else if (b === 6) { // ancient: teal motes circling the hero
      const R = 1.05 * gs, h = y0 + (0.6 + Math.random() * 1.1) * gs, sp = 2.4;
      mote(pl.x + Math.cos(a) * R, h, pl.z + Math.sin(a) * R, -Math.sin(a) * sp, 0.15, Math.cos(a) * sp, 0.7 + Math.random() * 0.4, 0.14, 0, Math.random() < 0.3 ? 0xb5fff0 : 0x2fffd0);
    } else { // divine: white-gold sparkles rising all round
      mote(x, y0 + 0.2 + Math.random() * 1.6 * gs, z, 0, 0.9, 0, 1.1 + Math.random() * 0.5, Math.random() < 0.2 ? 0.2 : 0.12, -0.6, Math.random() < 0.5 ? 0xffffff : 0xfff3a0);
    }
  }
  // the best tiers also twinkle a baked star now and then
  if (b >= 5 && !Q.lowTier) {
    GearAura.twT -= dt;
    if (GearAura.twT <= 0) {
      GearAura.twT = b === 7 ? 0.55 : 0.9 + Math.random() * 0.5;
      const a = Math.random() * 6.283, r = 0.7 * gs;
      SpriteFX.play(b === 7 ? 'crit' : b === 6 ? 'zap' : 'impact', b === 7 ? 'gold' : b === 6 ? 'storm' : 'blood', pl.x + Math.cos(a) * r, y0 + (0.8 + Math.random()) * gs, pl.z + Math.sin(a) * r, b === 7 ? 1.4 : 1.0);
    }
  }
}
// colour theme for an effect from its gameplay colour
function fxPal(c) {
  const col = _col.set(c), hsl = {}; col.getHSL(hsl);
  if (hsl.s < 0.2) return hsl.l > 0.7 ? 'white' : 'frost';
  const h = hsl.h * 360;
  if (h < 15 || h >= 335) return hsl.l < 0.45 ? 'blood' : 'fire';
  if (h < 40) return 'fire'; if (h < 68) return 'gold'; if (h < 160) return 'venom'; if (h < 200) return 'storm'; if (h < 250) return 'frost'; return 'arcane';
}
function updateParticles(dt) {
  SpriteFX.update(dt);
  let n = 0;
  for (let k = 0; k < PART_MAX; k++) {
    if (PD.life[k] <= 0) continue;
    PD.life[k] -= dt;
    if (PD.life[k] <= 0) continue;
    PD.vy[k] -= PD.grav[k] * dt; PD.x[k] += PD.vx[k] * dt; PD.y[k] += PD.vy[k] * dt; PD.z[k] += PD.vz[k] * dt;
    if (PD.y[k] < 0.05) { PD.y[k] = 0.05; PD.vy[k] *= -0.3; PD.vx[k] *= 0.7; PD.vz[k] *= 0.7; }
    const s = PD.size[k] * (PD.life[k] / PD.max[k]);
    _e.set(PD.life[k] * 5, PD.life[k] * 3, 0); _q.setFromEuler(_e);
    _m4.compose(_v3.set(PD.x[k], PD.y[k], PD.z[k]), _q, _s3.set(s, s, s));
    partIM.setMatrixAt(n, _m4); partIM.setColorAt(n, _col.set(PD.col[k])); n++;
  }
  partIM.count = n; partIM.instanceMatrix.needsUpdate = true; if (partIM.instanceColor) partIM.instanceColor.needsUpdate = true;
}
// each bullet type gets its own silhouette and trail
// --- Codex heroes: super engine (sim) + their art (ammunition, impacts, super props, status marks) ---------------
const HeroFX = createHeroFX({ scene: dynGroup, camera, fxPal: (c) => fxPal(c), growth: (e) => growthScale(e), ent: (id) => G.ents.get(id),
  play: (k, pal, x, y, z, size, opts) => SpriteFX.play(k, pal, x, y, z, size, opts),
  particles: { burst, mote, play: (k, pal, x, y, z, size, opts) => SpriteFX.play(k, pal, x, y, z, size, opts), ring: (x, z, r, c, l) => ringFx(x, z, r, c, l), shake: (v) => { if (!G.profile || !G.profile.settings.calm) Cam.shake = Math.max(Cam.shake, v); } },
  toast: (t) => showToast(t), healNumber: (e) => { if (e.amt >= 1) dmgNumber(e.x, 2.2, e.z, '+' + fmtK(e.amt), 'heal'); } });
heroApi.fx = HeroFX; HeroFXRef = HeroFX;
const LONG_KINDS = { arrow: [1, 1, 1], ice: [1, 1, 1], tracer: [0.55, 0.55, 0.7], rail: [1.1, 1.1, 3.4], missile: [1.7, 1.7, 0.62], spark: [0.8, 0.8, 0.9] };
let trailTick = 0;
function updateProjectileMeshes() {
  let no = 0, na = 0, nd = 0, ng = 0;
  HeroFX.ammoBegin();
  trailTick = (trailTick + 1) % 2;
  const glowOn = hqOn();
  for (let i = 0; i < PROJ_MAX; i++) {
    const p = projectiles[i]; if (!p.active) continue;
    const yaw = Math.atan2(p.vx, p.vz);
    if (glowOn && ng < PROJ_MAX) {
      const gs = p.kind === 'flame' ? p.r * 4.5 : p.kind === 'rail' ? 2.2 : Math.max(0.9, p.r * 4);
      _m4.compose(_v3.set(p.x, p.y, p.z), camera.quaternion, _s3.set(gs, gs, gs));
      glowIM.setMatrixAt(ng, _m4); glowIM.setColorAt(ng, _col.set(p.color).multiplyScalar(p.team === 'mob' ? 0.8 : 0.65)); ng++;
    }
    if (p.hx && HeroFX.ammo(p, i, yaw)) continue; // Codex heroes fire their own ammunition (hero-fx-v6.js)
    if (p.kind === 'flame') {
      if (no >= PROJ_MAX) continue;
      const k = 1 - Math.max(0, p.life) / p.total, s2 = p.r * (0.5 + k * 1.3);
      _e.set(G.time * 9 + i, G.time * 7, 0); _q.setFromEuler(_e); _m4.compose(_v3.set(p.x, p.y, p.z), _q, _s3.set(s2, s2, s2));
      orbIM.setMatrixAt(no, _m4); orbIM.setColorAt(no, _col.set(k < 0.4 ? 0xffe08a : k < 0.75 ? 0xff7a2b : 0xd8452a)); no++;
      continue;
    }
    if (p.kind === 'wave' || LONG_KINDS[p.kind]) {
      if (na >= 360) continue;
      _e.set(0, yaw, 0); _q.setFromEuler(_e);
      if (p.kind === 'wave') _s3.set(2.4 * 2.2, 0.6, 0.35); else { const k = LONG_KINDS[p.kind]; _s3.set(k[0], k[1], k[2]); }
      _m4.compose(_v3.set(p.x, p.y, p.z), _q, _s3);
      arrowIM.setMatrixAt(na, _m4); arrowIM.setColorAt(na, _col.set(p.color)); na++;
      if (p.kind === 'rail' && trailTick === 0) burst(p.x, p.y, p.z, 1, 0xe8fbff, 0.4, 0.3, 0.22, 0, 0.1);
      if (p.kind === 'missile' && Math.random() < 0.7) burst(p.x - p.vx * 0.03, p.y, p.z - p.vz * 0.03, 1, Math.random() < 0.5 ? 0xbfbfbf : 0xffb347, 0.6, 0.45, 0.28, -1.5, 0.4);
    } else if (p.kind === 'disc' || p.kind === 'chakram') {
      if (nd >= 120) continue;
      _e.set(0, G.time * (p.kind === 'chakram' ? 22 : 14) + i, 0); _q.setFromEuler(_e);
      const sc = p.r * (p.kind === 'chakram' ? 1.25 : 1.1);
      _m4.compose(_v3.set(p.x, p.y, p.z), _q, _s3.set(sc, 1, sc));
      discIM.setMatrixAt(nd, _m4); discIM.setColorAt(nd, _col.set(p.color)); nd++;
    } else {
      const s = p.kind === 'rock' ? p.r * 1.1 : p.kind === 'fire' ? p.r * (1.1 + Math.sin(G.time * 30) * 0.12) : p.kind === 'shell' ? p.r * (1 + Math.sin(G.time * 20) * 0.08) : p.r * (p.kind === 'orb' || p.kind === 'lob' ? 1.0 : 0.85);
      _e.set(G.time * 6 + i, G.time * 4, 0); _q.setFromEuler(_e);
      _m4.compose(_v3.set(p.x, p.y, p.z), _q, _s3.set(s, s, s));
      orbIM.setMatrixAt(no, _m4); orbIM.setColorAt(no, _col.set(p.color)); no++;
      if ((p.kind === 'lob' || p.kind === 'shell') && trailTick === 0) burst(p.x, p.y, p.z, 1, p.color, 0.3, 0.35, 0.2, 0, 0.1);
    }
  }
  orbIM.count = no; arrowIM.count = na; discIM.count = nd; glowIM.count = ng; HeroFX.ammoEnd();
  glowIM.instanceMatrix.needsUpdate = true; if (glowIM.instanceColor) glowIM.instanceColor.needsUpdate = true;
  orbIM.instanceMatrix.needsUpdate = true; arrowIM.instanceMatrix.needsUpdate = true; discIM.instanceMatrix.needsUpdate = true;
  if (orbIM.instanceColor) orbIM.instanceColor.needsUpdate = true; if (arrowIM.instanceColor) arrowIM.instanceColor.needsUpdate = true; if (discIM.instanceColor) discIM.instanceColor.needsUpdate = true;
}

// rings: explosions + telegraphs
// telegraph colours: red is always a threat to the player, gold is the player's own
const TELE_MOB = 0xff3b3b, TELE_PLAYER = 0xffc94a;
// pendingAoE markers take up to AOE_SHOWN slots from the top (sim moves refuse to place more), clouds the next 8
const RING_MAX = AOE_SHOWN + 18, rings = [];
for (let i = 0; i < RING_MAX; i++) {
  const ring = pxRingMesh(0.9, 1, { color: 0xffffff, transparent: true, depthWrite: false });
  const disc = pxRingMesh(0, 1, { color: 0xffffff, transparent: true, depthWrite: false });
  ring.visible = disc.visible = false; dynGroup.add(ring, disc);
  rings.push({ ring, disc, life: 0, max: 0, r: 0, x: 0, z: 0, warn: false });
}
const effects = [];
// warn: a full-size ring whose disc fills up until it lands (same look as a pendingAoE marker)
function ringFx(x, z, r, color, life, warn) {
  const slot = rings.find((s) => s.life <= 0 && !s.tele) || rings[0];
  slot.life = slot.max = life; slot.r = r; slot.x = x; slot.z = z; slot.warn = !!warn;
  slot.ring.material.color.setHex(color); slot.disc.material.color.setHex(color);
}
function updateRings(dt) {
  // telegraphs from pending AoE (cones have their own meshes)
  let used = 0, cones = 0;
  for (const s of rings) { s.tele = false; s.disc.material.userData.px.uIn.value = 0; }
  for (const a of G.pendingAoE) {
    const k = 1 - a.t / a.max, col = a.col && (a.soak || a.spread) ? a.col : a.team === 'mob' ? TELE_MOB : TELE_PLAYER;
    if (a.cone) { if (cones < CONE_SHOWN) mobCone(cones++, a, k, col); continue; }
    const s = rings[RING_MAX - 1 - used]; if (!s || used >= AOE_SHOWN) continue; used++;
    s.tele = true;
    s.ring.visible = s.disc.visible = true;
    s.ring.position.set(a.x, 0.08, a.z); s.ring.scale.setScalar(a.r); s.ring.material.opacity = 0.9; s.ring.material.color.setHex(col);
    s.disc.position.set(a.x, 0.07, a.z); s.disc.material.color.setHex(col);
    // donut: the whole band shows from the start (the hole is the safe spot) and brightens as it lands
    if (a.inner) { s.disc.scale.setScalar(a.r); s.disc.material.userData.px.uIn.value = a.inner / a.r; s.disc.material.opacity = 0.18 + 0.3 * k; }
    else { s.disc.scale.setScalar(a.r * k); s.disc.material.opacity = 0.35; }
  }
  for (let i = cones; i < MobCones.length; i++) MobCones[i].edge.visible = MobCones[i].fill.visible = false;
  // ward plates: stand on every one together; they fill white-gold as the team holds them
  const W = G.boss && G.boss.ward;
  if (W) for (let i = 0; i < W.pl.length; i++) {
    const s = rings[RING_MAX - 1 - used]; if (!s) break; used++; s.tele = true;
    const on = W.held >= W.pl.length, pulse = 0.5 + 0.5 * Math.sin(G.time * (on ? 12 : 4)), prog = W.hold > 0 ? W.prog / W.hold : 0;
    s.ring.visible = s.disc.visible = true;
    s.ring.position.set(W.pl[i][0], 0.1, W.pl[i][1]); s.ring.scale.setScalar(W.r); s.ring.material.opacity = 0.9; s.ring.material.color.setHex(on ? 0xffffff : W.col);
    s.disc.position.set(W.pl[i][0], 0.09, W.pl[i][1]); s.disc.scale.setScalar(W.r * (0.35 + 0.65 * prog)); s.disc.material.opacity = 0.25 + 0.3 * pulse; s.disc.material.color.setHex(on ? 0xfff2b0 : W.col);
    if (Math.random() < 0.5) burst(W.pl[i][0] + (Math.random() - 0.5) * W.r, 0.2, W.pl[i][1] + (Math.random() - 0.5) * W.r, 1, W.col, 0.6, 0.8, 0.25, -1.2, 2.2);
  }
  for (const c of G.clouds) {
    const s = rings[RING_MAX - 1 - used]; if (!s || used >= AOE_SHOWN + 8) break; used++;
    s.tele = true; const fade = Math.min(1, c.t / 0.5), tint = c.color || 0x5fd84a;
    s.ring.visible = s.disc.visible = true;
    s.ring.position.set(c.x, 0.08, c.z); s.ring.scale.setScalar(c.r); s.ring.material.opacity = 0.7 * fade; s.ring.material.color.setHex(c.team === 'mob' ? TELE_MOB : 0x8dff6a);
    s.disc.position.set(c.x, 0.07, c.z); s.disc.scale.setScalar(c.r); s.disc.material.opacity = (0.28 + Math.sin(G.time * (c.pull ? 14 : 6)) * 0.05) * fade; s.disc.material.color.setHex(tint);
    // a vortex sheds sparks from its rim; other clouds bubble anywhere
    if (c.pull) { if (Math.random() < 0.7) { const a = Math.random() * 6.283; burst(c.x + Math.sin(a) * c.r * 0.9, 0.3, c.z + Math.cos(a) * c.r * 0.9, 1, tint, 0.5, 0.5, 0.25, -0.5, 0.6); } }
    else if (Math.random() < 0.5) burst(c.x + (Math.random() - 0.5) * c.r * 1.4, 0.3, c.z + (Math.random() - 0.5) * c.r * 1.4, 1, c.color || 0x9cff7a, 0.6, 0.8, 0.3, -0.8, 1.2);
  }
  for (let i = 0; i < RING_MAX - used; i++) {
    const s = rings[i];
    if (s.life <= 0) { s.ring.visible = s.disc.visible = false; continue; }
    s.life -= dt;
    const k = 1 - s.life / s.max;
    s.ring.visible = s.disc.visible = true;
    if (s.warn) { s.ring.position.set(s.x, 0.08, s.z); s.ring.scale.setScalar(s.r); s.ring.material.opacity = 0.9; s.disc.position.set(s.x, 0.07, s.z); s.disc.scale.setScalar(s.r * Math.max(0.01, k)); s.disc.material.opacity = 0.35; continue; }
    s.ring.position.set(s.x, 0.09, s.z); s.ring.scale.setScalar(s.r * (0.4 + 0.6 * Math.sqrt(k))); s.ring.material.opacity = (1 - k) * 0.95;
    s.disc.position.set(s.x, 0.08, s.z); s.disc.scale.setScalar(s.r * (0.3 + 0.7 * k)); s.disc.material.opacity = (1 - k) * 0.35;
  }
}

// --- aim indicators (Brawl Stars style): you see exactly where every attack will go -------------
const laneTex = (() => {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,0.2)'); gr.addColorStop(0.85, 'rgba(255,255,255,0.42)'); gr.addColorStop(1, 'rgba(255,255,255,0.6)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 128); g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(0, 0, 5, 128); g.fillRect(59, 0, 5, 128); g.fillRect(0, 0, 64, 5);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const fanTex = radialTexture([[0, 0.22], [0.85, 0.42], [0.96, 0.95], [1, 0.95]]);
function aimMatOf(tex) { return new THREE.MeshBasicMaterial({ map: tex || null, color: 0xffffff, transparent: true, opacity: 1, depthWrite: false, fog: false }); }
const AimFX = {
  lanes: [], fan: null, fanMat: aimMatOf(fanTex), fanKey: '', ring: null, disc: null, dots: null, target: null, burstRing: null, tick: 0,
  init() {
    const laneGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, 0.5);
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(laneGeo, aimMatOf(laneTex)); m.visible = false; m.renderOrder = 3; dynGroup.add(m); this.lanes.push(m); }
    this.fan = new THREE.Mesh(new THREE.BufferGeometry(), this.fanMat); this.fan.visible = false; this.fan.renderOrder = 3; dynGroup.add(this.fan);
    this.ring = pxRingMesh(0.9, 1, { color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false, fog: false }); this.ring.renderOrder = 3;
    this.disc = pxRingMesh(0, 1, { color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false, fog: false });
    this.burstRing = pxRingMesh(0.92, 1, { color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false, fog: false });
    this.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, fog: false }), 16);
    this.dots.frustumCulled = false; this.dots.count = 0;
    const tg = new THREE.Group();
    const tMat = new THREE.MeshBasicMaterial({ color: 0xffd34a, transparent: true, opacity: 0.9, depthWrite: false, fog: false });
    { const c = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5).rotateX(-Math.PI / 2), pxPatch(tMat, 0.82, 1.05, 4, 0.55)); c.rotation.y = 0.25; tg.add(c); }
    this.target = tg; this.tMat = tMat;
    for (const m of [this.ring, this.disc, this.burstRing, this.dots, this.target]) { m.visible = false; m.renderOrder = 3; dynGroup.add(m); }
  },
  hide() { for (const l of this.lanes) l.visible = false; this.fan.visible = this.ring.visible = this.disc.visible = this.burstRing.visible = this.dots.visible = false; },
  setFan(spread, color, opacity) {
    const key = spread.toFixed(3);
    if (key !== this.fanKey) { this.fan.geometry.dispose(); this.fan.geometry = new THREE.CircleGeometry(1, 28, -Math.PI / 2 - spread / 2, spread).rotateX(-Math.PI / 2); this.fanKey = key; }
    this.fanMat.color.setHex(color); this.fanMat.opacity = opacity; this.fan.visible = true;
  },
  lane(i, x, z, a, len, w, color, op) { const l = this.lanes[i]; l.visible = true; l.position.set(x, 0.09 + i * 0.002, z); l.rotation.y = a; l.scale.set(w, 1, Math.max(0.1, len)); l.material.color.setHex(color); l.material.opacity = op; },
  circle(x, z, r, color, fill) { this.ring.visible = true; this.ring.position.set(x, 0.1, z); this.ring.scale.setScalar(r); this.ring.material.color.setHex(color); if (fill) { this.disc.visible = true; this.disc.position.set(x, 0.095, z); this.disc.scale.setScalar(r); this.disc.material.color.setHex(color); } },
  arc(x0, z0, x1, z1, h, color) {
    const n = 12; this.dots.count = n; this.dots.visible = true; this.dots.material.color.setHex(color);
    for (let i = 0; i < n; i++) { const k = (i + 1) / (n + 1); _m4.makeTranslation(lerp(x0, x1, k), 0.6 + 4 * h * k * (1 - k), lerp(z0, z1, k)); this.dots.setMatrixAt(i, _m4); }
    this.dots.instanceMatrix.needsUpdate = true;
  },
};
AimFX.init();
// where a straight shot stops: the first wall or tree on its path
function rayLen(x, z, a, len) {
  const sx = Math.sin(a), sz = Math.cos(a);
  for (let d = 0.8; d < len; d += 0.5) {
    const px = x + sx * d, pz = z + sz * d;
    if (G.mode === 'arena') { const h = CFG.arena.half; if (Math.abs(px - AC.x) > h || Math.abs(pz - AC.z) > h) return { d, wall: Math.abs(px - AC.x) > h ? 'x' : 'z', ob: null }; }
    const ob = obstacleAt(px, pz, 0.1); if (ob) return { d, wall: null, ob };
  }
  return { d: len, wall: null, ob: null };
}
// bouncing discs: show the ricochet path
function bouncePath(x, z, a, len, bounces) {
  const segs = []; let rem = len;
  for (let i = 0; i <= bounces && rem > 0.5 && segs.length < 5; i++) {
    const r = rayLen(x, z, a, rem); segs.push({ x, z, a, d: r.d }); rem -= r.d;
    if (!r.wall && !r.ob) break;
    const ex = x + Math.sin(a) * r.d, ez = z + Math.cos(a) * r.d;
    let vx = Math.sin(a), vz = Math.cos(a);
    if (r.wall === 'x') vx = -vx; else if (r.wall === 'z') vz = -vz;
    else { let nx = ex - r.ob.x, nz = ez - r.ob.z; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl; const dot = vx * nx + vz * nz; vx -= 2 * dot * nx; vz -= 2 * dot * nz; }
    a = Math.atan2(vx, vz); x = ex + vx * 0.3; z = ez + vz * 0.3; rem = Math.max(rem, len * 0.45);
  }
  return segs;
}
function updateAim(dt) {
  const f = G.mode === 'arena' && G.arena ? G.arena.fighters[0] : G.player;
  AimFX.hide(); updateLaneFx(dt);
  const T = AimFX.target;
  if (!G.started || !f || !f.alive || G.modal || Showcase.on) { T.visible = false; return; }
  const sup = Input.sup && Input.sup.aiming ? Input.sup : null;
  const aimingMain = Input.atk.aiming && !sup;
  // auto-aim reticle: shows who a tap will shoot (and smoothly follows the lock)
  const w = weaponOf(f);
  AimFX.tick -= dt;
  if (AimFX.tick <= 0) { AimFX.tick = 0.1; AimFX.lock = aimingMain || sup ? null : autoTarget(f, w.range * 1.1); }
  const lk = AimFX.lock;
  if (lk && lk.alive) {
    T.visible = true; const r = (lk.r || 0.7) * (lk.kind === 'boss' ? 1.1 : 1.6);
    T.position.x = lerp(T.position.x, lk.x, T.userData.on ? 1 - Math.exp(-dt * 18) : 1); T.position.z = lerp(T.position.z, lk.z, T.userData.on ? 1 - Math.exp(-dt * 18) : 1); T.position.y = 0.12;
    T.scale.setScalar(r * (1 + Math.sin(G.time * 6) * 0.06)); T.rotation.y += dt * 1.5; T.userData.on = true;
    AimFX.tMat.opacity = f.ammo >= 1 ? 0.9 : 0.4;
  } else { T.visible = false; T.userData.on = false; }
  if (!aimingMain && !sup) return;
  const [ax, az] = stickToWorld((sup ? sup.dx : Input.atk.dx) / STICK_R, -(sup ? sup.dy : Input.atk.dy) / STICK_R);
  const a = Math.atan2(ax, az), mag = clamp(Math.hypot(sup ? sup.dx : Input.atk.dx, sup ? sup.dy : Input.atk.dy) / STICK_R, 0, 1);
  if (sup) { drawSuperAim(f, sup.kind, a, mag); return; }
  const col = f.ammo >= 1 ? 0xffffff : 0xff6b6b, op = f.ammo >= 1 ? 0.9 : 0.55;
  const A = f.arts || NO_ARTS, aoe = ((w.aoe || 0) * (1 + f.mods.aoe)) + (A.blast ? (w.aoe ? 0.5 : 1.5) : 0);
  if (w.lob) {
    const d = clamp(mag * w.range, 3, w.range), tx = f.x + Math.sin(a) * d, tz = f.z + Math.cos(a) * d;
    if (w.lobLine) { for (let i = 0; i < w.count; i++) { const dd = clamp(d + (i - (w.count - 1) / 2) * w.lobLine * 1.4, 2.5, w.range + 2); if (i === 1 || w.count === 1) AimFX.circle(f.x + Math.sin(a) * dd, f.z + Math.cos(a) * dd, aoe || 1.5, col, true); } AimFX.lane(0, f.x, f.z, a, d + w.lobLine * 1.4 + aoe, aoe * 2, col, 0.35); }
    else AimFX.circle(tx, tz, aoe || 1.5, col, true);
    AimFX.arc(f.x, f.z, tx, tz, 1.6 + d * 0.22, col);
    return;
  }
  const width = Math.max(0.5, w.radius * 2 * (A.bigshot ? 1.35 : 1));
  if (w.count > 1 || w.jitter > 0.1) {
    const spread = w.count > 1 ? w.spread + width / w.range : w.jitter * 2 + 0.05;
    AimFX.setFan(spread, col, op * 0.9); AimFX.fan.position.set(f.x, 0.09, f.z); AimFX.fan.rotation.y = a; AimFX.fan.scale.set(w.range, 1, w.range);
  } else if (w.bounce || A.rubber) {
    bouncePath(f.x, f.z, a, w.range, (w.bounce || 0) + (A.rubber ? 1 : 0)).forEach((sg, i) => AimFX.lane(i, sg.x, sg.z, sg.a, sg.d, width, col, op * (1 - i * 0.18)));
  } else {
    const pierceAll = (w.pierce || 0) >= 99 || w.boomerang;
    const len = pierceAll ? w.range : rayLen(f.x, f.z, a, w.range).d;
    AimFX.lane(0, f.x, f.z, a, len, width, col, op);
    if (w.boomerang) AimFX.lane(1, f.x + Math.cos(a) * width * 0.9, f.z - Math.sin(a) * width * 0.9, a, len, width * 0.35, col, op * 0.5);
  }
  const endD = w.count > 1 || w.jitter > 0.1 ? w.range : rayLen(f.x, f.z, a, w.range).d;
  const ex = f.x + Math.sin(a) * endD, ez = f.z + Math.cos(a) * endD;
  if (aoe) AimFX.circle(ex, ez, aoe, col, true);
  if (w.split) { AimFX.burstRing.visible = true; AimFX.burstRing.position.set(ex, 0.1, ez); AimFX.burstRing.scale.setScalar(w.split.range); AimFX.burstRing.material.color.setHex(col); }
}
// red charge lanes (beetles) — telegraphs fade out on their own
const LaneFX = [];
function laneFx(x, z, a, len, w, color, life) {
  let L = LaneFX.find((l) => l.life <= 0);
  if (!L) { if (LaneFX.length >= 16) L = LaneFX[0]; else { L = { mesh: new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, 0.5), aimMatOf(laneTex)), life: 0, max: 1 }; L.mesh.renderOrder = 3; dynGroup.add(L.mesh); LaneFX.push(L); } }
  L.life = L.max = life; L.mesh.visible = true; L.mesh.position.set(x, 0.1, z); L.mesh.rotation.y = a; L.mesh.scale.set(w, 1, len); L.mesh.material.color.setHex(color);
}
function updateLaneFx(dt) { for (const L of LaneFX) { if (L.life <= 0) { L.mesh.visible = false; continue; } L.life -= dt; L.mesh.material.opacity = 0.35 + 0.5 * Math.abs(Math.sin(L.life * 18)) * (L.life / L.max); } }
// red mob cones (breath): an outlined sector plus a fill that grows out from the mouth; geometry cached per half-angle
const MobCones = [], coneGeos = {};
const coneGeo = (half) => coneGeos[half] || (coneGeos[half] = new THREE.CircleGeometry(1, 24, -Math.PI / 2 - half, half * 2).rotateX(-Math.PI / 2));
for (let i = 0; i < CONE_SHOWN; i++) {
  const edge = new THREE.Mesh(coneGeo(0.52), aimMatOf(fanTex)), fill = new THREE.Mesh(coneGeo(0.52), aimMatOf(null));
  edge.visible = fill.visible = false; edge.renderOrder = fill.renderOrder = 3; dynGroup.add(edge, fill); MobCones.push({ edge, fill });
}
function conePut(m, y, a, g, col) { m.geometry = g; m.visible = true; m.position.set(a.x, y, a.z); m.rotation.y = a.cone.a; m.material.color.setHex(col); }
function mobCone(i, a, k, col) {
  const C = MobCones[i], g = coneGeo(a.cone.half);
  conePut(C.edge, 0.09, a, g, col); conePut(C.fill, 0.095, a, g, col); C.edge.scale.set(a.r, 1, a.r); C.edge.material.opacity = 0.85; C.fill.scale.set(a.r * Math.max(0.02, k), 1, a.r * Math.max(0.02, k)); C.fill.material.opacity = 0.3;
}
function drawSuperAim(f, kind, a, mag) {
  const gold = 0xffc94a;
  if (kind === 'super') {
    const s = CFG.classes[f.cls].super, S = CFG.supers[s];
    if (S && S.hero) { // Codex heroes: aim shape from their super (self circle, lane, landing circle or target)
      const A = S.aim || { type: 'self', r: 6 };
      if (A.type === 'self') AimFX.circle(f.x, f.z, A.r, gold, true);
      else if (A.type === 'lane') AimFX.lane(0, f.x, f.z, a, A.len, A.width, gold, 0.85);
      else if (A.type === 'circle') { const d = A.dist * clamp(mag, 0.25, 1); const tx = f.x + Math.sin(a) * d, tz = f.z + Math.cos(a) * d; AimFX.circle(tx, tz, A.r, gold, true); AimFX.arc(f.x, f.z, tx, tz, 3.5, gold); }
      else { AimFX.circle(f.x, f.z, A.range, gold, false); AimFX.lane(0, f.x, f.z, a, A.range, 0.6, gold, 0.6); }
      return;
    }
    if (s === 'nova') AimFX.circle(f.x, f.z, 12, gold, true);
    else if (s === 'slam') AimFX.circle(f.x, f.z, S.r, gold, true);
    else if (s === 'volley') { AimFX.setFan(S.spread + 0.05, gold, 0.85); AimFX.fan.position.set(f.x, 0.09, f.z); AimFX.fan.rotation.y = a; AimFX.fan.scale.set(20, 1, 20); }
    else if (s === 'meteor') { const d = S.dist * clamp(mag, 0.3, 1); const tx = f.x + Math.sin(a) * d, tz = f.z + Math.cos(a) * d; AimFX.circle(tx, tz, S.r, gold, true); AimFX.arc(f.x, f.z, tx, tz, 3.5, gold); }
    return;
  }
  const el = f.perks.special, E = CFG.elements[el]; if (!E) return;
  const c = E.color;
  if (el === 'fire') { const len = rayLen(f.x, f.z, a, E.range).d; AimFX.lane(0, f.x, f.z, a, len, 1.3, c, 0.85); AimFX.circle(f.x + Math.sin(a) * len, f.z + Math.cos(a) * len, E.r, c, true); }
  else if (el === 'ice') { AimFX.setFan(E.spread + 0.05, c, 0.85); AimFX.fan.position.set(f.x, 0.09, f.z); AimFX.fan.rotation.y = a; AimFX.fan.scale.set(E.range, 1, E.range); }
  else if (el === 'storm') AimFX.circle(f.x, f.z, E.range, c, true);
  else if (el === 'poison') { const d = E.dist * clamp(mag, 0.3, 1.3); const tx = f.x + Math.sin(a) * d, tz = f.z + Math.cos(a) * d; AimFX.circle(tx, tz, E.r, c, true); AimFX.arc(f.x, f.z, tx, tz, 2, c); }
}

