// ---------------------------------------------------------------------
// 6. RENDER — Three.js scene, procedural assets behind AssetSlots
// ---------------------------------------------------------------------
const PALETTE = {
  skyTop: 0x2a3d55, skyHorizon: 0x7d9a86, fog: 0x5b7a5e,
  sun: 0xffd9a8, hemiSky: 0xb4ccc8, hemiGround: 0x3a4a33,
  meadow: [0x5d8a43, 0x55803e, 0x66944a, 0x4f7a3a], forest: [0x355c36, 0x2f5231, 0x3c663c, 0x2b4a2e],
  frost: [0xc9d6df, 0xbac9d4, 0xd6e1e8, 0xb0c0cc], plaza: [0x8a8476, 0x7d786c, 0x958e7f],
  ember: [0x5a3a30, 0x4d332b, 0x664235, 0x46302a], starfall: [0x3a3560, 0x433d6c, 0x332f56, 0x4a4378],
  emberPath: [0x9a7458, 0x8c6a51], starPath: [0x9d95c9, 0x8f87bd], deadTree: [0x3a2a24, 0x2e221d], crystal: [0xc77dff, 0x7fe3ff, 0xff9bf2],
  path: [0x8a7350, 0x7c6747], snowPath: [0xbfcfdf, 0xb4c6d8], outside: [0x6a8d58, 0x5f8150],
  abyss: [0x1f5a63, 0x23666f, 0x1b4f58, 0x2a7078], celestial: [0xf3e3bf, 0xeedab0, 0xf7ecd2, 0xe8d3a3], abyssPath: [0x5aa3a0, 0x4f9592], celestialPath: [0xfffaf0, 0xf1e7cf],
  coral: [0x2fffd0, 0x4cc9f0, 0xff7ab8], blossom: [0xffe08a, 0xffd36b, 0xfff3c4],
  trunk: 0x5a3e2a, roundLeaf: [0x3f6b35, 0x4b7a3d, 0x56883f], pine: [0x24452e, 0x1f3d29, 0x2a4f34], snowPine: [0xe9f2fa, 0xd5e4f0],
  rock: [0x6f7478, 0x63686d, 0x7b8084], stone: 0x5f6570, roof: [0x8e3f33, 0x3d5a7a, 0xa8792e, 0x4f6e42], wall: 0xc2b08e, wood: 0x7a5233,
  fence: 0x6b5236, gateLocked: 0xff4d5a, gateOpen: 0x58e08a, portal: 0xa36bff,
  arenaA: 0xe7c48c, arenaB: 0xdcb67b, arenaRim: 0x9c7a4f, arenaWall: 0x6c5a8e, crate: 0xb47a46, crateBand: 0x7d4f2a, gas: 0x56e36b,
  skin: 0xf2c9a0, pants: 0x3a3f5c, hair: 0x5b3a29, eye: 0x1d1d2b, steel: 0xc9d1dc, gold: 0xf2c14e,
};

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', canvas: document.getElementById('cv') });
renderer.outputColorSpace = THREE.SRGBColorSpace;
// neutral tone mapping keeps the saturated toy colours but rolls off blown highlights (gold, white hair, sand)
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.debug.checkShaderErrors = LOCAL_PREVIEW; // reading the compile log waits for the GPU to finish compiling (a hitch whenever a new model or effect appears)
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = true;
renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); G.paused = true; }, false);
renderer.domElement.addEventListener('webglcontextrestored', () => { G.paused = false; }, false);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(PALETTE.fog, 50, 140);
const camera = new THREE.PerspectiveCamera(55, 1, 0.5, 260);
const hemi = new THREE.HemisphereLight(PALETTE.hemiSky, PALETTE.hemiGround, 1.25);
const sun = new THREE.DirectionalLight(PALETTE.sun, 2.7);
sun.position.set(30, 60, 18);
// one tight shadow map that follows the hero (High graphics only)
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.04; sun.shadow.radius = 2.5; // soft PCF edges
{ const c = sun.shadow.camera; c.left = -30; c.right = 30; c.top = 30; c.bottom = -30; c.near = 10; c.far = 140; c.updateProjectionMatrix(); }
const SUN_OFF = new THREE.Vector3(26, 58, 14);
scene.add(hemi, sun, sun.target);
function hqOn() { return !!(G.profile && G.profile.settings.hq) && !Q.lowTier; }

const hubGroup = new THREE.Group(), arenaGroup = new THREE.Group(), dynGroup = new THREE.Group(), riftGroup = new THREE.Group();
scene.add(hubGroup, arenaGroup, dynGroup, riftGroup);
arenaGroup.visible = false; riftGroup.visible = false;
const dungeonGroup = new THREE.Group(); scene.add(dungeonGroup); dungeonGroup.visible = false; // filled on dungeon entry (47)
const siegeGroup = new THREE.Group(); scene.add(siegeGroup); siegeGroup.visible = false; // the Bastion fort, built on entry (47b)
// soft procedural textures (swirl for portals, vertical fade for auras)
let _swirl = null, _fade = null;
function swirlTex() {
  if (_swirl) return _swirl;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const rg = g.createRadialGradient(64, 64, 4, 64, 64, 64); rg.addColorStop(0, '#fff2f8'); rg.addColorStop(0.35, '#ff4d8f'); rg.addColorStop(0.75, '#5b1f8f'); rg.addColorStop(1, 'rgba(30,10,50,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(255,220,240,.55)'; g.lineWidth = 3;
  for (let k = 0; k < 4; k++) { g.beginPath(); for (let i = 0; i < 60; i++) { const a = k * Math.PI / 2 + i * 0.09, r = i * 0.95; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.stroke(); }
  _swirl = new THREE.CanvasTexture(c); _swirl.colorSpace = THREE.SRGBColorSpace; return _swirl;
}
function fadeTex() {
  if (_fade) return _fade;
  const c = document.createElement('canvas'); c.width = 4; c.height = 64; const g = c.getContext('2d');
  const lg = g.createLinearGradient(0, 64, 0, 0); lg.addColorStop(0, 'rgba(255,255,255,1)'); lg.addColorStop(0.5, 'rgba(255,255,255,.35)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = lg; g.fillRect(0, 0, 4, 64); _fade = new THREE.CanvasTexture(c); return _fade;
}

// --- geometry helpers ------------------------------------------------------
const _col = new THREE.Color(), _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v3 = new THREE.Vector3(), _s3 = new THREE.Vector3();
function part(geo, color, p, r, s) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  _e.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0); _q.setFromEuler(_e);
  _m4.compose(_v3.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0), _q, _s3.set(s ? s[0] : 1, s ? s[1] : 1, s ? s[2] : 1));
  g.applyMatrix4(_m4);
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  _col.set(color);
  for (let i = 0; i < n; i++) { col[i * 3] = _col.r; col[i * 3 + 1] = _col.g; col[i * 3 + 2] = _col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (g.attributes.uv) g.deleteAttribute('uv');
  if (!g.attributes.normal) g.computeVertexNormals();
  return g;
}
function mergeParts(parts) {
  let total = 0; for (const g of parts) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
  let o = 0;
  for (const g of parts) {
    pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count; g.dispose();
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  m.setAttribute('color', new THREE.BufferAttribute(col, 3));
  m.computeBoundingSphere();
  return m;
}
// Stylized look: 3-step toon ramp, ink outlines on characters (inverted hull), soft shadows.
const toonRamp = (() => { const t = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]), 3, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
const matVC = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonRamp });
// smooth normals per position so the outline shell has no cracks on flat-shaded parts
function outlineNormals(g) {
  if (g.attributes.onormal) return g;
  const pos = g.attributes.position, n = pos.count, acc = new Map(), keys = new Array(n), out = new Float32Array(n * 3), fn = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < n; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    fn.subVectors(c, b).cross(a.clone().sub(b)).normalize();
    for (let k = 0; k < 3; k++) {
      const j = i + k, key = Math.round(pos.getX(j) * 200) + ',' + Math.round(pos.getY(j) * 200) + ',' + Math.round(pos.getZ(j) * 200);
      keys[j] = key; let v = acc.get(key); if (!v) { v = new THREE.Vector3(); acc.set(key, v); } v.add(fn);
    }
  }
  for (const v of acc.values()) v.normalize();
  for (let j = 0; j < n; j++) { const v = acc.get(keys[j]); out[j * 3] = v.x; out[j * 3 + 1] = v.y; out[j * 3 + 2] = v.z; }
  g.setAttribute('onormal', new THREE.BufferAttribute(out, 3));
  return g;
}
function makeOutlineMat(color, w) {
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = 'attribute vec3 onormal;\n' + sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + onormal * ${w.toFixed(3)};`);
  };
  m.customProgramCacheKey = () => 'ol' + w;
  return m;
}
const matOutline = makeOutlineMat(0x1b1730, 0.045), matOutlineElite = makeOutlineMat(0xffc94a, 0.075), matOutlineBoss = makeOutlineMat(0x120e1f, 0.06);
function addOutline(parent, geo, mat) { const o = new THREE.Mesh(outlineNormals(geo), mat || matOutline); o.userData.outline = true; parent.add(o); return o; }
const matShadow = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.26, depthWrite: false });
const geoShadow = new THREE.CircleGeometry(1, 16).rotateX(-Math.PI / 2);
// --- pixel rings: flat circles drawn on a world-space pixel grid (stepped edges, dark outer rim, lit inner rim) ---
const PX_CELL = 0.14;
function pxPatch(m, inner, outer, seg, duty) {
  m.userData.px = { uIn: { value: inner }, uOut: { value: outer }, uSeg: { value: seg || 0 }, uDuty: { value: duty || 0.5 }, uCell: { value: PX_CELL } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.px);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vPW; varying vec2 vPO; varying float vPS;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPW = (modelMatrix * vec4(transformed, 1.0)).xz; vPO = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xz; vPS = length(modelMatrix[0].xyz);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vPW; varying vec2 vPO; varying float vPS; uniform float uIn, uOut, uSeg, uDuty, uCell;')
      .replace('void main() {', `void main() {
  vec2 pc = (floor(vPW / uCell) + 0.5) * uCell; vec2 pd = (pc - vPO) / vPS; float pr = length(pd), ppx = uCell / vPS;
  float pin = uIn > 0.0 ? min(uIn, uOut - 2.2 * ppx) : 0.0;
  if (pr > uOut || pr < pin) discard;
  if (uSeg > 0.0 && fract((atan(pd.y, pd.x) / 6.2831853 + 0.5) * uSeg) > uDuty) discard;
  float pxShade = pr > uOut - ppx ? 0.5 : (pin > 0.0 && pr < pin + ppx) ? 1.3 : 1.0;`)
      .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb *= pxShade;');
  };
  m.customProgramCacheKey = () => 'pxring';
  return m;
}
function pxRingMesh(inner, outer, params, seg, duty) {
  const g = new THREE.PlaneGeometry(2 * outer + 0.4, 2 * outer + 0.4).rotateX(-Math.PI / 2);
  return new THREE.Mesh(g, pxPatch(new THREE.MeshBasicMaterial(params), inner, outer, seg, duty));
}

const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1), cyl7: new THREE.CylinderGeometry(1, 1, 1, 7), cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
  cone7: new THREE.ConeGeometry(1, 1, 7), cone4: new THREE.ConeGeometry(1, 1, 4), dodec: new THREE.DodecahedronGeometry(1, 0),
  ico0: new THREE.IcosahedronGeometry(1, 0), ico1: new THREE.IcosahedronGeometry(1, 1), torusHalf: new THREE.TorusGeometry(1, 0.07, 4, 10, Math.PI),
  // smooth pieces for heroes (high quality, still cheap: one merged mesh per hero)
  sph: new THREE.SphereGeometry(1, 16, 12), cyl14: new THREE.CylinderGeometry(1, 1, 1, 14), torso: new THREE.CylinderGeometry(0.9, 1, 1, 16, 2), cap: new THREE.CapsuleGeometry(1, 2, 4, 10),
};

// find the right fist of a generated hero: the lowest blob of the arm that hangs furthest out on +x
const _fv = new THREE.Vector3();
function findFist(scene) {
  const body = scene.getObjectByName('body'); if (!body || !body.geometry) return null;
  const pa = body.geometry.attributes.position, m = body.matrixWorld, pts = [];
  let maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (let i = 0; i < pa.count; i += 2) { _fv.fromBufferAttribute(pa, i).applyMatrix4(m); pts.push(_fv.x, _fv.y, _fv.z); if (_fv.x > maxX) maxX = _fv.x; if (_fv.y > maxY) maxY = _fv.y; if (_fv.y < minY) minY = _fv.y; }
  const H = maxY - minY;
  // the outer arm: vertices well out on +x in the lower 60% of the body
  let oMin = 1e9; for (let i = 0; i < pts.length; i += 3) if (pts[i] > maxX * 0.7 && pts[i + 1] < minY + H * 0.6 && pts[i + 1] < oMin) oMin = pts[i + 1];
  // the fist: the arm's lowest blob. x/z = the average of its bottom slice, y = one fist-radius above the lowest point
  let sx = 0, sz = 0, nS = 0, xs = [];
  for (let i = 0; i < pts.length; i += 3) if (pts[i] > maxX * 0.55 && pts[i + 1] < oMin + H * 0.09) { sx += pts[i]; sz += pts[i + 2]; nS++; xs.push(pts[i]); }
  if (!nS) return null;
  xs.sort((p, q) => p - q);
  const fistW = xs[Math.floor(xs.length * 0.95)] - xs[Math.floor(xs.length * 0.05)];
  return new THREE.Vector3(sx / nS, oMin + Math.max(H * 0.05, fistW * 0.42), sz / nS);
}

// --- held weapons: the hero holds the weapon item they have equipped ----------------------------
// Edge = sword, Fang = axe, Focus = staff, painted in the item's rarity colours (the same main / trim /
// metal / glow tones as its inventory icon). Modelled with the grip at the origin and the weapon
// along +y, so the hand closes around the handle. Glowing gems are a separate unlit mesh.
const weaponShapes = {
  rbox: new THREE.BoxGeometry(1, 1, 1, 1, 1, 1),
  // flat blade with a bevelled edge and a point, standing on its base along +y
  blade(L, w) {
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(-w / 2, L * 0.8); sh.lineTo(0, L); sh.lineTo(w / 2, L * 0.8); sh.lineTo(w / 2, 0); sh.lineTo(-w / 2, 0);
    return new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.022, bevelSegments: 1 });
  },
  // crescent axe head in the y/z plane, cutting edge forward (+z)
  axe(h) {
    const sh = new THREE.Shape(); sh.moveTo(0, -h * 0.35); sh.quadraticCurveTo(h * 0.55, -h * 0.4, h * 0.85, -h); sh.quadraticCurveTo(h * 1.15, 0, h * 0.85, h); sh.quadraticCurveTo(h * 0.55, h * 0.4, 0, h * 0.35); sh.lineTo(0, -h * 0.35);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.02, bevelSegments: 1 });
    g.translate(0, 0, -0.0175); g.rotateY(-Math.PI / 2); return g;
  },
};
const itemWeaponCache = new Map(), glowMatCache = new Map();
function glowMat(c) { if (!glowMatCache.has(c)) glowMatCache.set(c, new THREE.MeshBasicMaterial({ color: c })); return glowMatCache.get(c); }
function itemWeaponGeometry(it) {
  const style = itemStyle(it), T = GEAR_TONES[it.rarity] || GEAR_TONES.common, R = rarIdx(it.rarity), plus = (it.up || 0) >= 5;
  const key = it.rarity + '|' + style + (plus ? '+' : '');
  if (itemWeaponCache.has(key)) return itemWeaponCache.get(key);
  const P = [], Gl = [], wood = 0x6b4a2e, metal = T.metal, lightM = new THREE.Color(T.metal).lerp(new THREE.Color(0xffffff), 0.45).getHex();
  if (style === 0) { // Edge: a broad sword with a fullered blade, crossguard, wrapped grip and a gem pommel
    const L = 0.95 + R * 0.025, w = 0.13 + R * 0.006;
    P.push(part(weaponShapes.blade(L, w), metal, [0, 0.2, -0.03], null, [1, 1, 1]));
    P.push(part(GEO.box, lightM, [0, 0.2 + L * 0.42, 0], null, [0.035, L * 0.72, 0.075]));
    P.push(part(weaponShapes.rbox, T.trim, [0, 0.17, 0], null, [0.46 + R * 0.02, 0.075, 0.1]));
    for (const sx of [-1, 1]) P.push(part(GEO.sph, T.trim, [sx * (0.24 + R * 0.01), 0.17, 0], null, [0.055, 0.055, 0.055]));
    P.push(part(GEO.cyl8, wood, [0, 0.02, 0], null, [0.05, 0.28, 0.05]));
    for (let i = 0; i < 3; i++) P.push(part(GEO.cyl8, new THREE.Color(wood).multiplyScalar(0.7).getHex(), [0, -0.08 + i * 0.08, 0], [0.4, 0, 0], [0.055, 0.02, 0.055]));
    if (R >= 3) for (const sx of [-1, 1]) P.push(part(GEO.cone4, T.trim, [sx * 0.2, 0.25, 0], [0, 0, sx * -0.6], [0.04, 0.14, 0.04]));
    Gl.push(part(GEO.ico1, T.glow, [0, -0.17, 0], null, [0.065, 0.065, 0.065]));
    if (R >= 4) Gl.push(part(GEO.ico0, T.glow, [0, 0.17, 0.06], null, [0.05, 0.05, 0.03]));
  } else if (style === 1) { // Fang: a war axe with a crescent head, back spike and a gem in the socket
    P.push(part(GEO.cyl8, wood, [0, 0.3, 0], null, [0.045, 1.05, 0.045]));
    for (let i = 0; i < 2; i++) P.push(part(GEO.cyl8, T.trim, [0, -0.12 + i * 0.12, 0], null, [0.055, 0.03, 0.055]));
    P.push(part(weaponShapes.axe(0.28 + R * 0.012), metal, [0, 0.66, 0.02], null, [1, 1, 1]));
    P.push(part(GEO.cone4, metal, [0, 0.66, -0.12], [-Math.PI / 2, Math.PI / 4, 0], [0.055, 0.2, 0.035]));
    P.push(part(weaponShapes.rbox, T.trim, [0, 0.66, 0], null, [0.1, 0.18, 0.12]));
    P.push(part(GEO.cone4, metal, [0, 0.87, 0], [0, Math.PI / 4, 0], [0.04, 0.12, 0.04]));
    Gl.push(part(GEO.ico1, T.glow, [0, 0.66, 0.065], null, [0.05, 0.05, 0.04]));
    Gl.push(part(GEO.ico0, T.glow, [0, -0.2, 0], null, [0.045, 0.045, 0.045]));
  } else { // Focus: a staff with a glowing orb held in a crown of prongs
    P.push(part(GEO.cyl8, wood, [0, 0.42, 0], null, [0.042, 1.6, 0.042]));
    for (let i = 0; i < 3; i++) P.push(part(GEO.cyl8, new THREE.Color(wood).multiplyScalar(0.72).getHex(), [0, 0.2 + i * 0.32, 0], null, [0.05, 0.03, 0.05]));
    P.push(part(GEO.cyl8, T.trim, [0, 1.18, 0], null, [0.075, 0.09, 0.075]));
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; P.push(part(GEO.cone4, T.trim, [Math.sin(a) * 0.11, 1.34, Math.cos(a) * 0.11], [Math.cos(a) * 0.45, 0, -Math.sin(a) * 0.45], [0.035, 0.22, 0.035])); }
    P.push(part(GEO.cyl8, T.trim, [0, -0.36, 0], null, [0.055, 0.06, 0.055]));
    Gl.push(part(GEO.ico1, T.glow, [0, 1.36, 0], null, [0.13 + R * 0.006, 0.13 + R * 0.006, 0.13 + R * 0.006]));
  }
  if (plus) Gl.push(part(GEO.ico0, 0xffd34a, [0, style === 2 ? 0.95 : 0.22, 0.05], null, [0.03, 0.03, 0.03]));
  const out = { geo: mergeParts(P), glow: mergeParts(Gl), glowColor: T.glow, style };
  itemWeaponCache.set(key, out); return out;
}
// how a hand holds each kind: sword and axe point forward and up, the staff stands upright (tilted out from the body)
const HOLD_ROT = [[0.22, 0, -0.1], [0.2, 0, -0.1], [0.1, 0, -0.06]];
// where the hand closes on each weapon (measured from its origin): mid-handle for the sword, low on the haft for the axe, a third up the staff
const HELD_WEAPONS = false;
const GRIP_Y = [0.02, 0.05, 0.25];
const HERO_GRIP_OFF = { orb: [0, -0.13, 0.03] };
function weaponOffset(grip, style) { /* reserved for per-hero fine tuning (HERO_GRIP) */ }
// the weapon a hero holds: the equipped weapon item, else a plain one that suits the brawler's attack
function heldItemFor(o) {
  if (o.gear && o.gear.weapon) return o.gear.weapon;
  const k = CFG.attacks[o.cls] ? CFG.attacks[o.cls].kind : '';
  const noun = ['orb', 'spark', 'missile', 'star'].includes(k) || /orb|chain|starfall|seeker/.test(o.cls) ? 'Focus' : ['wave', 'flame', 'pellet'].includes(k) ? 'Fang' : 'Edge';
  return { slot: 'weapon', rarity: 'common', name: 'Worn ' + noun, up: 0 };
}

