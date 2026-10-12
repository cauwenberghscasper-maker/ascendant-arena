// Art for the 27 Codex heroes: each hero's own ammunition (3D shapes in its palette), flight trails, impacts,
// the props of every super (bells, tidal waves, orchards, a dead sun on a chain...) and the on-body status marks
// (stun stars, sleep, stone, shields, guard). Everything is procedural three.js geometry and canvas textures,
// built lazily the first time a hero needs it. Driven by the sim (hero-supers-v6.js) and the game's event loop.
import * as THREE from 'three';
import { HERO_V6 } from './heroes-v6.js';

const TAU = Math.PI * 2;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
const smooth = (k) => { k = Math.min(1, Math.max(0, k)); return k * k * (3 - 2 * k); };
const easeOut = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
const rnd = (a, b) => a + Math.random() * (b - a);

// ------------------------------------------------------------------ geometry kit
// part(geo, colour, [x,y,z], [rx,ry,rz], [sx,sy,sz]) -> merged, vertex-coloured, with a little baked light
function part(geo, col, p, r, s) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (s) g.scale(s[0], s[1], s[2]);
  if (r) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(r[0], r[1], r[2])));
  if (p) g.translate(p[0], p[1], p[2]);
  g.computeVertexNormals();
  const n = g.attributes.position.count, cols = new Float32Array(n * 3), base = new THREE.Color(col), N = g.attributes.normal;
  for (let i = 0; i < n; i++) {
    const lit = 0.62 + 0.38 * Math.max(0, N.getY(i) * 0.7 + N.getZ(i) * 0.5 + N.getX(i) * 0.15);
    cols[i * 3] = base.r * lit; cols[i * 3 + 1] = base.g * lit; cols[i * 3 + 2] = base.b * lit;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
  return g;
}
function merge(parts) {
  let n = 0; for (const g of parts) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), Nn = new Float32Array(n * 3), C = new Float32Array(n * 3); let o = 0;
  for (const g of parts) { P.set(g.attributes.position.array, o * 3); Nn.set(g.attributes.normal.array, o * 3); C.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; g.dispose(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  g.computeBoundingSphere();
  return g;
}
const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d), Sph = (r, a = 10, b = 8) => new THREE.SphereGeometry(r, a, b), Cyl = (t, b, h, s = 12) => new THREE.CylinderGeometry(t, b, h, s);
const Tor = (r, t, a = TAU, s = 18) => new THREE.TorusGeometry(r, t, 6, s, a), Cone = (r, h, s = 10) => new THREE.ConeGeometry(r, h, s), Ico = (r, d = 0) => new THREE.IcosahedronGeometry(r, d), Oct = (r) => new THREE.OctahedronGeometry(r, 0);
function noisyCol(geo, a, b, amt = 0.5) { // per-face mottling between two colours (stone, cinder, moss)
  const C = geo.attributes.color, A = new THREE.Color(a), B = new THREE.Color(b);
  for (let i = 0; i < C.count; i += 3) { const k = Math.random() < amt ? 1 : 0, c = k ? B : A; for (let j = 0; j < 3; j++) C.setXYZ(i + j, c.r * (0.8 + Math.random() * 0.25), c.g * (0.8 + Math.random() * 0.25), c.b * (0.8 + Math.random() * 0.25)); }
  return geo;
}

// Ammunition: unit-sized, flying along +Z. a/b = the hero's two ammo colours, g = glow.
const AMMO = {
  vial: (a, b, g) => merge([part(Cyl(0.32, 0.36, 0.9, 10), a, [0, 0, 0], [Math.PI / 2, 0, 0]), part(Cyl(0.16, 0.2, 0.3, 8), a, [0, 0, 0.55], [Math.PI / 2, 0, 0]), part(Cyl(0.14, 0.14, 0.22, 8), 0x8a5a2b, [0, 0, 0.78], [Math.PI / 2, 0, 0]), part(Box(0.5, 0.42, 0.3), 0xd8ccaa, [0, 0.12, -0.05]), part(Sph(0.2, 8, 6), g, [0, -0.05, -0.1], null, [1.3, 1, 1.6])]),
  soundring: (a, b, g) => merge([part(Tor(0.7, 0.13, TAU * 0.9, 22), a, null, null), part(Tor(0.7, 0.05, TAU * 0.9, 22), g, [0, 0, 0.05]), part(Box(0.12, 0.12, 0.12), b, [0.5, 0.45, 0])]),
  apple: (a, b, g) => merge([part(Sph(0.5, 12, 10), a, null, null, [1, 0.9, 1]), part(Sph(0.32, 8, 6), 0xd9a63a, [0, 0.2, 0.18]), part(Cyl(0.04, 0.05, 0.3, 5), 0x5b4330, [0, 0.55, 0]), part(Sph(0.18, 6, 4), b, [0.16, 0.6, 0], [0, 0, 0.6], [1.6, 0.35, 0.8])]),
  seal: (a, b) => merge([part(Cyl(0.55, 0.6, 0.22, 14), a, null, [Math.PI / 2, 0, 0]), part(Box(0.6, 0.12, 0.1), b, [0, 0, 0.13]), part(Box(0.12, 0.6, 0.1), b, [0, 0, 0.13])]),
  coin: (a, b) => merge([part(Cyl(0.55, 0.55, 0.1, 16), a, null, [Math.PI / 2, 0, 0]), part(Tor(0.52, 0.06, TAU, 18), b, null, null), part(Box(0.4, 0.14, 0.04), 0x5a4524, [0, 0, 0.06])]),
  crescent: (a, b, g) => merge([part(Tor(0.9, 0.16, Math.PI * 1.1, 16), a, null, [Math.PI / 2, 0, Math.PI * 0.95], [1, 1, 0.35]), part(Tor(0.9, 0.07, Math.PI * 1.1, 16), g, [0, 0.03, 0.06], [Math.PI / 2, 0, Math.PI * 0.95], [1, 1, 0.35])]),
  threadball: (a, b) => noisyCol(merge([part(Ico(0.5, 1), a), part(Tor(0.42, 0.05, TAU, 14), b, null, [0.6, 0, 0]), part(Tor(0.42, 0.05, TAU, 14), b, null, [0, 0.8, 1.2])]), a, b, 0.35),
  note: (a, b, g) => merge([part(Sph(0.32, 10, 8), a, [0, -0.35, 0], [0, 0, 0.4], [1.3, 0.9, 0.7]), part(Box(0.08, 0.9, 0.08), a, [0.36, 0.1, 0]), part(Box(0.4, 0.1, 0.08), a, [0.52, 0.5, 0], [0, 0, -0.5]), part(Sph(0.2, 6, 5), g, [0, -0.35, 0])]),
  claw: (a, b, g) => merge([-0.32, 0, 0.32].map((x) => part(Tor(0.7, 0.07, Math.PI * 0.8, 10), a, [x, 0, 0], [0, Math.PI / 2, 0.4], [1, 1, 0.5]))),
  button: (a, b) => merge([part(Cyl(0.5, 0.5, 0.18, 16), a, null, [Math.PI / 2, 0, 0]), part(Tor(0.44, 0.06, TAU, 16), b, [0, 0, 0.08]), ...[[-0.13, 0.13], [0.13, 0.13], [-0.13, -0.13], [0.13, -0.13]].map(([x, y]) => part(Cyl(0.06, 0.06, 0.22, 6), 0x2a1a10, [x, y, 0], [Math.PI / 2, 0, 0]))]),
  glyph: (a, b, g) => merge([part(Box(0.16, 1.0, 0.12), a, [-0.25, 0, 0], [0, 0, -0.3]), part(Box(0.16, 1.0, 0.12), a, [0.25, 0, 0], [0, 0, 0.3]), part(Box(0.5, 0.14, 0.12), b, [0, -0.1, 0]), part(Sph(0.18, 6, 4), g, [0, 0.45, 0])]),
  chips: (a, b) => merge([[0, 0, 0, 0.35], [0.35, 0.2, -0.1, 0.22], [-0.3, -0.1, 0.15, 0.25], [0.1, -0.3, -0.2, 0.2], [-0.15, 0.3, 0.2, 0.18]].map(([x, y, z, r], i) => part(Oct(r), i % 2 ? b : a, [x, y, z], [i, i * 2, i * 0.5]))),
  ember: (a, b, g) => merge([part(Sph(0.42, 10, 8), b), part(Sph(0.28, 8, 6), a, [0, 0, 0.08]), part(Cone(0.4, 1.2, 10), b, [0, 0, -0.75], [-Math.PI / 2, 0, 0]), part(Cone(0.2, 0.7, 8), a, [0, 0, -0.5], [-Math.PI / 2, 0, 0])]),
  lightbeam: (a, b, g) => merge([part(Cyl(0.14, 0.14, 2.6, 8), a, null, [Math.PI / 2, 0, 0]), part(Cyl(0.3, 0.05, 1.4, 8), g, [0, 0, -0.6], [Math.PI / 2, 0, 0])]),
  ink: (a, b, g) => merge([part(Tor(1.0, 0.18, Math.PI * 1.15, 16), a, null, [Math.PI / 2, 0, Math.PI * 0.93], [1, 1, 0.3]), part(Box(0.5, 0.65, 0.18), b, [0, 0, 0.95]), part(Box(0.45, 0.6, 0.05), 0xefe6d2, [0, 0, 1.06])]),
  lantern: (a, b, g) => merge([part(Tor(1.0, 0.15, Math.PI * 1.15, 16), a, null, [Math.PI / 2, 0, Math.PI * 0.93], [1, 1, 0.35]), part(Box(0.42, 0.6, 0.42), b, [0, 0.1, 1.0]), part(Sph(0.2, 8, 6), g, [0, 0.1, 1.0]), part(Cone(0.3, 0.25, 4), b, [0, 0.52, 1.0])]),
  needle: (a, b, g) => merge([part(Cyl(0.05, 0.05, 1.8, 6), b, null, [Math.PI / 2, 0, 0]), part(Sph(0.22, 8, 6), a, [0, 0, 0.9]), part(Tor(0.12, 0.04, TAU, 10), b, [0, 0, -0.85], [0, Math.PI / 2, 0])]),
  keyring: (a, b) => merge([part(Tor(0.55, 0.08, TAU, 20), a, null, [Math.PI / 2, 0, 0]), ...[0, 1, 2, 3, 4].map((i) => { const ang = i / 5 * TAU; return part(Box(0.12, 0.08, 0.55), i % 2 ? b : 0xc9a13b, [Math.sin(ang) * 0.75, 0, Math.cos(ang) * 0.75], [0, ang, 0]); })]),
  palm: (a, b, g) => merge([part(Box(0.9, 0.3, 0.8), a), ...[-0.33, -0.11, 0.11, 0.33].map((x) => part(Box(0.18, 0.26, 0.55), a, [x, 0, 0.62])), part(Box(0.22, 0.24, 0.45), a, [-0.55, 0, 0.1], [0, 0.6, 0]), part(Box(0.7, 0.04, 0.06), g, [0, 0.16, 0.1]), part(Box(0.06, 0.04, 0.6), g, [0.1, 0.16, 0.1])]),
  step: (a, b, g) => merge([part(Box(1.2, 0.4, 0.6), a), part(Box(1.22, 0.05, 0.04), b, [0, 0.21, 0.05], [0, 0.2, 0]), part(Box(0.04, 0.05, 0.5), b, [0.3, 0.21, 0])]),
  lost0: (a, b) => merge([part(Tor(0.28, 0.08, TAU, 14), a, [0, 0, -0.55]), part(Box(0.12, 0.12, 1.0), a, [0, 0, 0.1]), part(Box(0.12, 0.28, 0.12), a, [0, -0.15, 0.45]), part(Box(0.12, 0.2, 0.12), a, [0, -0.1, 0.25])]),
  lost1: (a, b) => merge([part(Sph(0.42, 10, 8), 0x7a5238, null, null, [1, 0.55, 1.1]), ...[-0.3, -0.1, 0.1, 0.3].map((x) => part(Cyl(0.09, 0.09, 0.45, 6), 0x7a5238, [x, 0, 0.6], [Math.PI / 2, 0, 0])), part(Cyl(0.3, 0.32, 0.25, 10), 0x6e6a45, [0, 0, -0.5], [Math.PI / 2, 0, 0])]),
  lost2: (a, b) => merge([part(Cone(0.55, 0.9, 8), 0x2a2a30, [0, 0, 0.3], [Math.PI / 2, 0, 0]), part(Cyl(0.04, 0.04, 1.2, 6), 0x2a2a30, [0, 0, -0.3], [Math.PI / 2, 0, 0]), part(Tor(0.12, 0.04, Math.PI, 8), 0x7a5238, [0, -0.12, -0.9], [0, Math.PI / 2, 0])]),
  lost3: (a, b) => merge([part(Cyl(0.45, 0.45, 0.16, 16), a, null, [Math.PI / 2, 0, 0]), part(Cyl(0.38, 0.38, 0.17, 16), 0xf4f0e0, [0, 0, 0.01], [Math.PI / 2, 0, 0]), part(Box(0.04, 0.3, 0.04), 0x222222, [0, 0.12, 0.1]), part(Box(0.2, 0.04, 0.04), 0x222222, [0.08, 0, 0.1]), part(Tor(0.12, 0.04, TAU, 8), a, [0, 0.56, 0])]),
  cinder: (a, b, g) => noisyCol(merge([part(new THREE.DodecahedronGeometry(0.55, 0), a)]), a, b, 0.35),
  hound: (a, b, g) => merge([part(Sph(0.45, 10, 8), a, [0, 0, 0], null, [0.8, 0.75, 1.4]), part(Sph(0.32, 10, 8), a, [0, 0.25, 0.65], null, [0.9, 0.9, 1.1]), part(Box(0.22, 0.2, 0.35), a, [0, 0.16, 0.95]), part(Cone(0.1, 0.28, 5), a, [-0.15, 0.55, 0.6]), part(Cone(0.1, 0.28, 5), a, [0.15, 0.55, 0.6]), part(Sph(0.06, 6, 4), b, [-0.12, 0.33, 0.9]), part(Sph(0.06, 6, 4), b, [0.12, 0.33, 0.9]), part(Box(0.12, 0.04, 0.12), 0xd9707a, [0, 0.05, 1.08]), ...[[-0.25, 0.4], [0.25, 0.4], [-0.25, -0.35], [0.25, -0.35]].map(([x, z]) => part(Cyl(0.08, 0.06, 0.45, 5), a, [x, -0.35, z])), part(Cone(0.08, 0.6, 5), a, [0, 0.15, -0.75], [-1.1, 0, 0])]),
  shard: (a, b, g) => merge([part(Oct(0.6), a, [0, 0, 0], null, [0.55, 0.12, 1.3]), part(Oct(0.58), b, [0, -0.04, 0], null, [0.5, 0.06, 1.25])]),
  die: (a, b) => { const parts = [part(Box(0.9, 0.9, 0.9), a)]; const pip = (x, y, z) => parts.push(part(Sph(0.09, 6, 4), b, [x, y, z])); const o = 0.46, d = 0.22;
    pip(0, 0, o); [[d, d], [-d, -d]].forEach(([x, y]) => pip(x, y, -o)); [[0, 0], [d, d], [-d, -d]].forEach(([x, z]) => pip(o, x, z)); [[d, d], [-d, d], [d, -d], [-d, -d]].forEach(([x, z]) => pip(-o, x, z));
    [[0, 0], [d, d], [-d, d], [d, -d], [-d, -d]].forEach(([x, z]) => pip(x, o, z)); [[d, -d], [d, 0], [d, d], [-d, -d], [-d, 0], [-d, d]].forEach(([x, z]) => pip(x, -o, z)); return merge(parts); },
  clods: (a, b, g) => merge([[0, 0, 0, 0.4, a], [0.4, 0.1, -0.2, 0.28, a], [-0.35, -0.05, 0.1, 0.3, 0x6a4a2a], [0.1, 0.35, 0.2, 0.18, b], [-0.2, 0.3, -0.25, 0.14, 0xffe08a], [0.3, -0.25, 0.3, 0.16, b]].map(([x, y, z, r, c], i) => part(Ico(r, 0), c, [x, y, z], [i, i, 0]))),
  ghostfire: (a, b, g) => merge([part(Sph(0.5, 8, 6), b, null, null, [1, 1, 1.4]), part(Cone(0.45, 1.2, 8), b, [0, 0, -0.8], [-Math.PI / 2, 0, 0]), part(Sph(0.28, 6, 5), 0xfff0c0, [0, 0, 0.1])]),
};
const SHAPE_SCALE = { soundring: 1.0, crescent: 1.15, ink: 1.15, lantern: 1.1, claw: 1.1, lightbeam: 1.0, hound: 1.3, palm: 1.25, step: 1.6, clods: 1.2 };

// ------------------------------------------------------------------ canvas textures
const TEX = new Map();
function canvasTex(key, w, h, draw) {
  if (TEX.has(key)) return TEX.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; TEX.set(key, t); return t;
}
const glowTex = () => canvasTex('glow', 64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const softDiscTex = () => canvasTex('disc', 128, 128, (g) => { const r = g.createRadialGradient(64, 64, 10, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,.55)'); r.addColorStop(0.75, 'rgba(255,255,255,.35)'); r.addColorStop(0.93, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
const rippleTex = () => { const t = canvasTex('ripple', 128, 128, (g) => { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; for (let i = 0; i < 14; i++) { g.beginPath(); const y = rnd(0, 128), x = rnd(0, 128); g.ellipse(x, y, rnd(10, 30), rnd(3, 7), 0, 0, TAU); g.stroke(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
const textTex = (text, color = '#ffd27a', font = 'bold 120px Georgia, serif', w = 1024, h = 192) => canvasTex('t|' + text + color + font, w, h, (g) => {
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = color; g.shadowBlur = 24; g.fillStyle = color; g.fillText(text, w / 2, h / 2); g.shadowBlur = 0; g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.85)'; g.strokeText(text, w / 2, h / 2);
});
const mapTex = () => canvasTex('lirr', 256, 512, (g) => {
  g.fillStyle = 'rgba(120,200,210,0.16)'; g.fillRect(0, 0, 256, 512); g.strokeStyle = 'rgba(190,240,245,.85)'; g.lineWidth = 3;
  for (let i = 0; i < 9; i++) { g.beginPath(); let x = rnd(10, 246), y = 0; g.moveTo(x, y); while (y < 512) { y += rnd(30, 70); x += rnd(-40, 40); g.lineTo(Math.max(0, Math.min(256, x)), y); } g.stroke(); }
  g.lineWidth = 1.5; for (let i = 0; i < 18; i++) { g.beginPath(); const y = rnd(0, 512); g.moveTo(0, y); g.lineTo(256, y + rnd(-30, 30)); g.stroke(); }
  g.fillStyle = 'rgba(220,250,250,.9)'; g.font = '14px serif'; for (let i = 0; i < 14; i++) g.fillText(String(Math.floor(rnd(2, 40))), rnd(5, 240), rnd(10, 500));
  for (let i = 0; i < 26; i++) { g.strokeRect(rnd(0, 240), rnd(0, 500), rnd(8, 22), rnd(8, 22)); }
});
const cloudTex = () => canvasTex('cloud', 256, 256, (g) => { g.fillStyle = '#9cc9f0'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 40; i++) { const r = g.createRadialGradient(0, 0, 0, 0, 0, 1); g.save(); g.translate(rnd(0, 256), rnd(0, 256)); g.scale(rnd(20, 60), rnd(10, 25)); r.addColorStop(0, 'rgba(255,255,255,.8)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore(); } g.fillStyle = '#fff'; for (let i = 0; i < 30; i++) g.fillRect(rnd(0, 256), rnd(0, 256), 2, 2); });
const runeRingTex = (text, color) => canvasTex('rr|' + text + color, 512, 512, (g) => {
  g.translate(256, 256); g.strokeStyle = color; g.lineWidth = 6; g.shadowColor = color; g.shadowBlur = 14; g.beginPath(); g.arc(0, 0, 236, 0, TAU); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 200, 0, TAU); g.stroke();
  g.fillStyle = color; g.font = 'bold 30px Georgia, serif'; g.textAlign = 'center'; const s = (text + ' · ').repeat(3); for (let i = 0; i < s.length; i++) { g.save(); g.rotate(i / s.length * TAU); g.fillText(s[i], 0, -208); g.restore(); }
});

// ------------------------------------------------------------------ the FX system
export function createHeroFX(api) {
  const root = new THREE.Group(); root.name = 'heroFX'; api.scene.add(root);
  const ammoIM = new Map();          // hero|shape -> InstancedMesh
  const props = [];                  // timed super props
  const statusVis = new Map();       // entity -> overlay group
  const threads = [];                // pooled lines from owner to thread projectiles
  const matCache = new Map();
  let frame = 0, threadUsed = 0, time = 0;

  const solid = (col, o = {}) => { const k = 's' + col + JSON.stringify(o); if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial(Object.assign({ color: col, roughness: 0.75, metalness: 0.1, flatShading: true }, o))); return matCache.get(k); };
  const glowM = (col, op = 0.8, tex) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, map: tex || null, side: THREE.DoubleSide, fog: false });
  const fadeM = (col, op = 0.5, tex) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, map: tex || null, side: THREE.DoubleSide });
  const vcM = () => { if (!matCache.has('vc')) matCache.set('vc', new THREE.MeshBasicMaterial({ vertexColors: true })); return matCache.get('vc'); };
  const vcLit = () => { if (!matCache.has('vcl')) matCache.set('vcl', new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.15, flatShading: true })); return matCache.get('vcl'); };
  const shapeGeo = (H, shape) => { const k = H.id + '|' + shape; if (!matCache.has('g' + k)) { const g = (AMMO[shape] || AMMO.coin)(H.ammo.a, H.ammo.b, H.ammo.glow); g.userData.shared = true; matCache.set('g' + k, g); } return matCache.get('g' + k); };
  const sprite = (col, size, op = 0.9) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); s.scale.setScalar(size); return s; };
  const groundDisc = (r, col, op, tex) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), fadeM(col, op, tex || softDiscTex())); m.scale.setScalar(r); m.position.y = 0.07; m.renderOrder = 4; return m; };
  const groundRing = (r, col, op = 0.9, w = 0.06) => { const m = new THREE.Mesh(new THREE.RingGeometry(1 - w, 1, 64).rotateX(-Math.PI / 2), glowM(col, op)); m.scale.setScalar(r); m.position.y = 0.09; m.renderOrder = 5; return m; };
  const flat = (w, h, mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h).rotateX(-Math.PI / 2), mat); m.position.y = 0.08; m.renderOrder = 4; return m; };
  const P = api.particles; // { burst(x,y,z,n,col,speed,life,size,grav,up), mote(x,y,z,vx,vy,vz,life,size,grav,col), play(kind,pal,x,y,z,size,opts), ring(x,z,r,col,life), shake(v) }

  function addProp(group, dur, update, opt = {}) {
    root.add(group);
    const pr = { group, dur, t: 0, update, follow: opt.follow, onEnd: opt.onEnd };
    props.push(pr); return pr;
  }
  function disposeGroup(g) { g.traverse((o) => { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); if (o.material && !matCacheHas(o.material)) { if (o.material.map && !o.material.map.userData?.shared) { /* canvas textures are cached */ } o.material.dispose(); } }); root.remove(g); }
  const matCacheHas = (m) => { for (const v of matCache.values()) if (v === m) return true; return false; };
  const setOpacity = (g, k) => g.traverse((o) => { if (o.material && o.material.transparent) { if (o.userData.op0 === undefined) o.userData.op0 = o.material.opacity; o.material.opacity = o.userData.op0 * k; } });
  const fadeIO = (t, dur, a = 0.25, b = 0.4) => Math.min(1, t / a, Math.max(0, (dur - t) / b));
  const pal = (H) => api.fxPal ? api.fxPal(H.ammo.glow) : 'gold';
  const entY = (e) => (e.kind === 'boss' ? 5.2 : e.kind === 'fighter' ? 2.3 * (api.growth ? api.growth(e) : 1) : Math.max(1.4, (e.r || 0.6) * 3.2));

  // ---------------------------------------------------------------- ammunition
  function ammo(p, i, yaw) {
    const H = HERO_V6[p.hx]; if (!H) return false;
    let shape = p.shape || H.ammo.shape;
    if (shape === 'lost') shape = 'lost' + (p.hv || 0);
    const key = H.id + '|' + shape;
    let im = ammoIM.get(key);
    if (!im) { im = new THREE.InstancedMesh(shapeGeo(H, shape), vcM(), 96); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.count = 0; im.userData.n = 0; root.add(im); ammoIM.set(key, im); }
    const n = im.userData.n; if (n >= 96) return true;
    const age = p.total - p.life, sc = p.r * (SHAPE_SCALE[shape] || 1) * (H.ammo.small ? 0.8 : 1) * 1.15;
    let s = sc;
    const spin = H.ammo.spin;
    if (shape === 'soundring') { s = sc * (0.6 + Math.min(1.4, age * 3)); _e.set(0, yaw, 0); }
    else if (shape === 'crescent' || shape === 'ink' || shape === 'lantern' || shape === 'claw' || shape === 'clods') { s = sc * (0.8 + Math.min(0.6, age * 2.5)); _e.set(0, yaw, 0); }
    else if (spin === 'tumble' || shape === 'vial' || shape === 'cinder' || shape === 'apple' || shape === 'threadball' || shape.startsWith('lost') || shape === 'chips') _e.set(age * 11 + i, yaw, age * 5);
    else if (spin === 'edge' || shape === 'coin' || shape === 'keyring') _e.set(0, yaw + age * 24, Math.PI / 2 * (shape === 'coin' ? 1 : 0));
    else if (spin === 'flat' || shape === 'button' || shape === 'seal') _e.set(Math.PI / 2, yaw + age * 16, 0);
    else if (shape === 'hound') _e.set(Math.sin(age * 22) * 0.12, yaw, 0);
    else if (shape === 'die') _e.set(age * 9, yaw + age * 7, age * 4);
    else _e.set(0, yaw, Math.sin(age * 8) * 0.3);
    const y = shape === 'hound' ? 0.55 : p.y;
    _q.setFromEuler(_e); _m.compose(_v.set(p.x, y, p.z), _q, _s.set(s, s, s));
    im.setMatrixAt(n, _m); im.userData.n = n + 1;
    trail(H, p, age, y);
    return true;
  }
  function trail(H, p, age, y) {
    const T = H.ammo.trail, col = H.ammo.trailColor; if (!T) return;
    const back = 0.04, x = p.x - p.vx * back, z = p.z - p.vz * back;
    if (T === 'thread') { threadLine(p, col); if (frame % 3 === 0) P.mote(x, y, z, 0, 0, 0, 0.35, 0.08, 0, col); return; }
    if (frame % 2) return;
    switch (T) {
      case 'drip': P.mote(x, y - 0.1, z, rnd(-0.3, 0.3), -0.5, rnd(-0.3, 0.3), 0.5, 0.12, 9, col); break;
      case 'notes': P.mote(x, y + 0.2, z, 0, 1.2, 0, 0.6, 0.14, -0.5, col); break;
      case 'petals': P.mote(x, y, z, rnd(-1, 1), rnd(0, 1), rnd(-1, 1), 0.9, 0.12, 1.2, Math.random() < 0.5 ? col : 0xffffff); break;
      case 'embers': case 'ghostfire': P.mote(x, y, z, rnd(-0.5, 0.5), rnd(0.8, 1.8), rnd(-0.5, 0.5), 0.45, 0.13, -1, Math.random() < 0.35 ? 0xfff0c0 : col); break;
      case 'glint': if (frame % 4 === 0) api.play('impact', pal(H), x, y, z, 0.6); break;
      case 'sparks': P.mote(x, y, z, rnd(-2, 2), rnd(0.5, 2), rnd(-2, 2), 0.3, 0.09, 6, col); break;
      case 'fog': P.mote(x, y, z, rnd(-0.3, 0.3), 0.2, rnd(-0.3, 0.3), 0.9, 0.3, -0.2, col); break;
      case 'fur': P.mote(x, y, z, rnd(-1, 1), rnd(0, 0.8), rnd(-1, 1), 0.7, 0.1, 2, col); break;
      case 'yarn': P.mote(x, y, z, 0, 0, 0, 0.45, 0.07, 0, col); P.mote(p.x - p.vx * 0.02, y, p.z - p.vz * 0.02, 0, 0, 0, 0.45, 0.07, 0, col); break;
      case 'chalk': case 'dust': P.mote(x, y, z, rnd(-0.6, 0.6), rnd(0, 0.6), rnd(-0.6, 0.6), 0.6, 0.18, 0.5, col); break;
      case 'light': P.mote(x, y, z, 0, 0, 0, 0.18, 0.2, 0, col); break;
      case 'ink': P.mote(x, y, z, rnd(-1.5, 1.5), rnd(0, 1), rnd(-1.5, 1.5), 0.5, 0.12, 7, col); break;
      case 'motes': case 'stars': P.mote(x + rnd(-0.2, 0.2), y + rnd(-0.2, 0.2), z + rnd(-0.2, 0.2), 0, 0.3, 0, 0.5, 0.1, 0, col); break;
    }
  }
  function threadLine(p, col) {
    const o = api.ent(p.owner); if (!o) return;
    let L = threads[threadUsed];
    if (!L) { L = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 12), 3)), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.9 })); L.frustumCulled = false; root.add(L); threads.push(L); }
    threadUsed++; L.visible = true; L.material.color.setHex(col);
    const A = L.geometry.attributes.position, hx = o.x + Math.sin(o.facing || 0) * 0.4, hz = o.z + Math.cos(o.facing || 0) * 0.4;
    for (let k = 0; k < 12; k++) { const t = k / 11; A.setXYZ(k, hx + (p.x - hx) * t, 1.2 + (p.y - 1.2) * t - Math.sin(t * Math.PI) * 0.25, hz + (p.z - hz) * t); }
    A.needsUpdate = true;
  }
  function ammoBegin() { for (const im of ammoIM.values()) im.userData.n = 0; threadUsed = 0; frame++; }
  function ammoEnd() { for (const im of ammoIM.values()) { im.count = im.userData.n; im.instanceMatrix.needsUpdate = true; } for (let i = threadUsed; i < threads.length; i++) threads[i].visible = false; }

  // ---------------------------------------------------------------- impacts (basic attacks)
  function impact(e) {
    const H = HERO_V6[e.hid]; if (!H) return;
    const I = H.impact, x = e.x, z = e.z, big = Math.max(1, (e.r || 1));
    api.play(I.sprite, I.pal || pal(H), x, I.sprite === 'ring' || I.sprite === 'dust' || I.sprite === 'poof' || I.sprite === 'explosion' || I.sprite === 'flame' ? 0 : 1, z, 1.3 + big * 0.9);
    P.burst(x, 0.9, z, 8, I.color, 4.5, 0.4, 0.17, 6);
    if (I.ring) P.ring(x, z, Math.max(0.9, e.r || 1), I.ring, 0.35);
    if (H.ammo.shape === 'die' && e.hv) faceFloat(x, z, e.hv, H);
    if (I.decal === 'soundings') decal(x, z, e.r || 2, textTex('~ 12 · 7 · 3 ~', '#d8f4f0', 'italic 70px Georgia, serif'), 1.6, H.ammo.glow);
    if (I.decal === 'stepUp') stepPop(x, z, H);
    if (H.ammo.shape === 'vial') P.burst(x, 0.3, z, 14, 0xf2f4ee, 5, 0.6, 0.16, 9, 1.3);
    if (H.ammo.shape === 'apple') P.burst(x, 0.5, z, 10, 0xf28bb0, 3, 0.8, 0.12, 2, 1.2);
    if (H.ammo.shape === 'cinder') P.burst(x, 0.5, z, 12, 0xffb347, 5, 0.7, 0.14, 5, 1.6);
  }
  function decal(x, z, r, tex, dur, col) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const m = flat(r * 2.2, r * 0.6, fadeM(col || 0xffffff, 0.85, tex)); m.rotation.y = rnd(0, TAU); g.add(m);
    addProp(g, dur, (t, k) => setOpacity(g, 1 - k));
  }
  function faceFloat(x, z, face, H) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex(String(face), face === 6 ? '#ffd34a' : face === 1 ? '#9a9a9a' : '#c58cff', 'bold 150px Georgia, serif', 256, 192), transparent: true, depthWrite: false, fog: false }));
    s.scale.set(1.6, 1.2, 1); const g = new THREE.Group(); g.add(s); g.position.set(x, 1.6, z);
    addProp(g, 0.9, (t, k) => { g.position.y = 1.6 + k * 1.2; s.material.opacity = 1 - k * k; });
  }
  function stepPop(x, z, H) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rnd(0, TAU);
    const m = new THREE.Mesh(shapeGeo(H, 'step'), vcLit()); m.scale.setScalar(1.3); g.add(m);
    addProp(g, 1.6, (t) => { m.position.y = t < 0.15 ? -0.6 + t / 0.15 * 0.85 : t > 1.2 ? 0.25 - (t - 1.2) * 2 : 0.25; });
    P.burst(x, 0.2, z, 10, 0xe8e6e1, 4, 0.5, 0.18, 6, 1.2);
  }

  // ---------------------------------------------------------------- super props
  const S = {};
  // generic zone: soft disc + ring + rising motes (circle or lane)
  S.zone = (o) => {
    const g = new THREE.Group(), col = o.color || o.H.ammo.glow;
    if (o.lane) { const L = o.lane; g.position.set(L.x, 0, L.z); g.rotation.y = L.a; const m = flat(L.w, L.len, fadeM(col, 0.28)); m.position.z = L.len / 2; g.add(m); }
    else { g.position.set(o.x, 0, o.z); g.add(groundDisc(o.r, col, 0.32)); g.add(groundRing(o.r, col, 0.9, 0.035)); }
    addProp(g, o.dur + 0.3, (t, k) => {
      setOpacity(g, fadeIO(t, o.dur + 0.3, 0.3, 0.45) * (0.85 + Math.sin(t * 5) * 0.15));
      if (!o.lane && frame % 3 === 0) { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * o.r; P.mote(o.x + Math.sin(a) * r, 0.2, o.z + Math.cos(a) * r, 0, rnd(0.6, 1.4), 0, 1.1, 0.13, -0.2, col); }
    });
  };
  S.puddle = (o) => { const g = new THREE.Group(); g.position.set(o.x, 0, o.z); const d = groundDisc(o.r, o.color, 0.45, rippleTex()); g.add(d); addProp(g, o.dur, (t, k) => { d.material.map.offset.x = t * 0.05; d.scale.setScalar(o.r * Math.min(1, t * 5)); setOpacity(g, fadeIO(t, o.dur, 0.1, 0.6)); }); };
  S.orchardFloor = (o) => S.zone(Object.assign({}, o, { color: 0x8be04a }));
  S.crater = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z);
    const d = groundDisc(o.r, 0xff6a1a, 0.7); g.add(d); const c = groundDisc(o.r * 0.95, 0x1e1d1f, 0.55, rippleTex()); c.position.y = 0.075; g.add(c);
    addProp(g, o.dur, (t) => { setOpacity(g, fadeIO(t, o.dur, 0.2, 0.8) * (0.8 + Math.sin(t * 9) * 0.2)); if (frame % 2 === 0) { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * o.r; P.mote(o.x + Math.sin(a) * r, 0.2, o.z + Math.cos(a) * r, 0, rnd(1, 3), 0, 0.8, 0.14, -1, Math.random() < 0.3 ? 0xfff0c0 : 0xff7a1a); } });
  };
  S.mapUnroll = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z); g.rotation.y = o.a;
    const m = flat(o.width, o.len, glowM(0x8fe3e8, 0.9, mapTex())); m.position.z = o.len / 2; g.add(m);
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(o.width, 0.15).rotateX(-Math.PI / 2), glowM(0xffffff, 0.9)); edge.position.y = 0.1; g.add(edge);
    addProp(g, o.dur + 4.3, (t) => { const k = easeOut(t / o.dur); m.scale.z = Math.max(0.01, k); m.position.z = o.len * k / 2; edge.position.z = o.len * k; setOpacity(g, fadeIO(t, o.dur + 4.3, 0.1, 1.2)); });
  };
  S.tide = (o) => {
    const g = new THREE.Group(); g.rotation.y = o.a; const W = o.width, Hh = 3.2;
    const waveTex = canvasTex('wave', 64, 128, (c) => { const r = c.createLinearGradient(0, 0, 0, 128); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.18, 'rgba(200,245,240,.95)'); r.addColorStop(0.5, 'rgba(70,170,170,.85)'); r.addColorStop(1, 'rgba(30,90,95,.55)'); c.fillStyle = r; c.fillRect(0, 0, 64, 128); });
    const geo = new THREE.PlaneGeometry(W, Hh, 16, 6); const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / Hh + 0.5; pos.setZ(i, Math.pow(y, 2.2) * 1.4 - Math.abs(pos.getX(i) / W) * 0.8); }
    geo.computeVertexNormals();
    const wall = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: waveTex, transparent: true, side: THREE.DoubleSide, depthWrite: false })); wall.position.y = Hh / 2; g.add(wall);
    const boats = []; for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(merge([part(Box(0.6, 0.35, 1.7), 0x2e6e6a), part(Box(0.06, 1.3, 0.06), 0x2e6e6a, [0, 0.8, 0]), part(new THREE.PlaneGeometry(0.9, 0.9), 0xd8f4f0, [0, 0.9, 0.25], [0, Math.PI / 2, 0])]), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.45, depthWrite: false })); b.position.set((i - 1) * W * 0.3, 1.3, -0.3); b.rotation.y = Math.PI / 2; boats.push(b); g.add(b); }
    let ended = 0;
    addProp(g, 9, (t, k, pr) => {
      const z = o.follow; if (z.x !== undefined) g.position.set(z.x, 0, z.z);
      const rise = Math.min(1, t / 0.3); g.scale.set(1, rise, 1);
      boats.forEach((b, i) => { b.rotation.z = Math.sin(t * 3 + i) * 0.25; b.position.y = 1.3 + Math.sin(t * 2 + i * 2) * 0.3; });
      if (frame % 1 === 0) for (let i = 0; i < 2; i++) { const s = rnd(-W / 2, W / 2); const dx = Math.cos(o.a) * s, dz = -Math.sin(o.a) * s; P.mote(g.position.x + dx, Hh * rise, g.position.z + dz, Math.sin(o.a) * rnd(2, 5), rnd(1, 3), Math.cos(o.a) * rnd(2, 5), 0.6, 0.18, 7, Math.random() < 0.6 ? 0xffffff : 0x9fe3e0); }
      if (z.s >= o.len - 0.01 && !ended) { ended = t; P.burst(g.position.x, 1.5, g.position.z, 40, 0xffffff, 9, 0.9, 0.3, 7, 1.6); api.play('poof', 'frost', g.position.x, 0, g.position.z, 5); P.shake(0.6); }
      if (ended) { const f = Math.max(0, 1 - (t - ended) / 0.5); g.scale.y = rise * f; setOpacity(g, f); if (f <= 0) pr.t = pr.dur; }
    });
  };
  S.bell = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z);
    const prof = [[0, 3.3], [0.5, 3.3], [0.9, 3.1], [1.1, 2.6], [1.25, 1.6], [1.55, 0.55], [1.9, 0.12], [1.95, 0]].map(([x, y]) => new THREE.Vector2(x, y));
    const bell = new THREE.Mesh(new THREE.LatheGeometry(prof, 18), new THREE.MeshStandardMaterial({ color: 0xa8773a, roughness: 0.45, metalness: 0.75, transparent: true, opacity: 0.82, side: THREE.DoubleSide, emissive: 0x3e2a10 }));
    const crack = new THREE.Mesh(Box(0.08, 2.4, 0.08), new THREE.MeshBasicMaterial({ color: 0xf2c14e })); crack.position.set(0.6, 1.4, 1.2); crack.rotation.z = 0.3;
    const rim = new THREE.Mesh(Tor(1.95, 0.1, TAU, 32), glowM(0xf2c14e, 0)); rim.rotation.x = Math.PI / 2;
    const hold = new THREE.Group(); hold.add(bell, crack, rim); hold.scale.setScalar(1.8); g.add(hold);
    addProp(g, o.dur, (t) => {
      const drop = easeOut(t / 0.5); hold.position.y = 14 - drop * 9.5; hold.rotation.z = Math.sin(t * 7) * 0.12 * (1 - Math.min(1, t)); hold.rotation.y = t * 0.6;
      if (t > 0.55) rim.material.opacity = Math.max(0, 1 - (t - 0.55) * 1.4);
      setOpacity(g, fadeIO(t, o.dur, 0.15, 0.5)); bell.material.opacity = 0.82 * fadeIO(t, o.dur, 0.15, 0.5);
    });
    setTimeout(() => P.shake(0.7), 600);
  };
  S.orchard = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z); const trees = [];
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + 0.3, tr = new THREE.Group(); tr.position.set(Math.sin(a) * o.r, 0, Math.cos(a) * o.r);
      const trunk = new THREE.Mesh(merge([part(Cyl(0.18, 0.32, 2.2, 7), 0x5b4330, [0, 1.1, 0]), part(Cyl(0.08, 0.12, 1.0, 5), 0x5b4330, [0.35, 2.1, 0], [0, 0, -0.7])]), vcLit());
      const can = new THREE.Mesh(Ico(1.3, 1), new THREE.MeshStandardMaterial({ color: 0xf28bb0, emissive: 0x6a2240, roughness: 0.6, flatShading: true, transparent: true, opacity: 0.88 })); can.position.y = 2.9;
      const can2 = new THREE.Mesh(Ico(0.8, 0), new THREE.MeshStandardMaterial({ color: 0xa9c4a0, emissive: 0x203018, flatShading: true, transparent: true, opacity: 0.9 })); can2.position.set(0.6, 2.5, 0.3);
      for (let k = 0; k < 4; k++) { const ap = new THREE.Mesh(Sph(0.16, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffd36a })); ap.position.set(rnd(-0.9, 0.9), rnd(2.3, 3.3), rnd(-0.9, 0.9)); tr.add(ap); }
      tr.add(trunk, can, can2); tr.scale.setScalar(0.01); tr.userData.d = i * 0.07; trees.push(tr); g.add(tr);
    }
    addProp(g, o.dur, (t) => {
      trees.forEach((tr, i) => { const k = Math.max(0, t - tr.userData.d); const s = k < 0.45 ? easeOut(k / 0.45) * 1.15 : 1.15 - Math.min(0.15, (k - 0.45) * 0.6); tr.scale.setScalar(t > o.dur - 0.5 ? Math.max(0.01, s * (o.dur - t) / 0.5) : Math.max(0.01, s)); tr.rotation.z = Math.sin(t * 1.5 + i) * 0.04; });
      if (frame % 2 === 0) { const tr = trees[Math.floor(Math.random() * 6)]; P.mote(o.x + tr.position.x + rnd(-1, 1), 3, o.z + tr.position.z + rnd(-1, 1), rnd(-0.4, 0.4), -0.2, rnd(-0.4, 0.4), 1.6, 0.13, 0.8, Math.random() < 0.7 ? 0xf28bb0 : 0xffffff); }
    });
    P.burst(o.x, 0.4, o.z, 30, 0x8be04a, 7, 0.8, 0.25, 4, 1.2);
  };
  S.candles = (o) => {
    const g = new THREE.Group(); const cs = [];
    for (let i = 0; i < o.n; i++) { const c = new THREE.Group(); const body = new THREE.Mesh(merge([part(Cyl(0.14, 0.16, 0.6, 8), 0xede3c2), part(Cyl(0.2, 0.2, 0.06, 8), 0xb3202a, [0, -0.3, 0]), part(Cyl(0.02, 0.02, 0.12, 4), 0x222222, [0, 0.36, 0])]), vcLit()); const fl = sprite(0xffb347, 0.7); fl.position.y = 0.55; c.add(body, fl); cs.push(c); g.add(c); }
    addProp(g, o.dur, (t) => {
      const f = o.f; g.position.set(f.x, 0, f.z);
      cs.forEach((c, i) => { const a = i / o.n * TAU + t * 0.9, rise = easeOut(t / 0.6); c.position.set(Math.sin(a) * o.r, 0.5 + rise * (1.6 + Math.sin(t * 2 + i) * 0.25), Math.cos(a) * o.r); c.children[1].scale.setScalar(0.6 + Math.sin(t * 17 + i * 3) * 0.12); });
      setOpacity(g, fadeIO(t, o.dur, 0.2, 0.5));
    });
  };
  S.river = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z); g.rotation.y = o.a;
    const tex = rippleTex().clone(); tex.needsUpdate = true; tex.repeat.set(1, o.len / 3);
    const m = flat(o.width, o.len, new THREE.MeshBasicMaterial({ color: 0x4b3f72, map: tex, transparent: true, opacity: 0.8, depthWrite: false })); m.position.z = o.len / 2; g.add(m);
    const banks = [-1, 1].map((s) => { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.18, o.len).rotateX(-Math.PI / 2), glowM(0xb9d3d6, 0.8)); b.position.set(s * o.width / 2, 0.1, o.len / 2); g.add(b); return b; });
    addProp(g, o.dur, (t) => { tex.offset.y = -t * 0.8; setOpacity(g, fadeIO(t, o.dur, 0.25, 0.6)); if (frame % 3 === 0) { const s = rnd(0, o.len); P.mote(o.x + Math.sin(o.a) * s, 0.15, o.z + Math.cos(o.a) * s, 0, 0.5, 0, 0.8, 0.1, 0, 0xb9d3d6); } });
  };
  S.labyrinth = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z); const walls = [];
    const stone = new THREE.MeshStandardMaterial({ color: 0x8a8c7e, roughness: 0.9, flatShading: true });
    for (const [R, n, gap] of [[o.r, 18, 3], [o.r * 0.62, 11, 2]]) for (let i = 0; i < n; i++) {
      if (i % (n / gap | 0) === 0) continue;
      const a = i / n * TAU, w = TAU * R / n * 0.92;
      const wall = new THREE.Mesh(Box(w, 1.6, 0.5), stone); wall.position.set(Math.sin(a) * R, -1, Math.cos(a) * R); wall.rotation.y = a; wall.userData.d = rnd(0, 0.35);
      const thread = new THREE.Mesh(Box(w, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: 0xc8231f })); thread.position.y = 0.85; wall.add(thread);
      walls.push(wall); g.add(wall);
    }
    addProp(g, o.dur, (t) => { walls.forEach((w) => { const k = Math.max(0, t - w.userData.d); w.position.y = t > o.dur - 0.6 ? -1 + 1.8 * Math.max(0, (o.dur - t) / 0.6) : -1 + 1.8 * easeOut(k / 0.4); }); });
    P.shake(0.4);
  };
  S.fog = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z);
    const fog = groundDisc(1, 0xeaf4f2, 0.42); fog.position.y = 0.4; g.add(fog);
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), glowM(0x3fb6b0, 0.85, runeRingTex('♪ ♫ ♪ ♬', '#7fe8e0'))); ring.position.y = 0.12; g.add(ring);
    const lights = []; for (let i = 0; i < 10; i++) { const s = sprite(i % 2 ? 0xffd27a : 0x7fe8e0, 0.9); s.userData.a = rnd(0, TAU); s.userData.r = rnd(2, o.r); lights.push(s); g.add(s); }
    addProp(g, o.dur, (t) => {
      const k = easeOut(t / 0.8); fog.scale.setScalar(o.r * k); ring.scale.setScalar(o.r * k); ring.rotation.y = t * 0.3;
      lights.forEach((s, i) => { s.userData.a += 0.01; s.position.set(Math.sin(s.userData.a) * s.userData.r * k, 1.2 + Math.sin(t * 2 + i) * 0.4, Math.cos(s.userData.a) * s.userData.r * k); });
      setOpacity(g, fadeIO(t, o.dur, 0.3, 0.8));
    });
  };
  S.eclipse = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z);
    const dark = groundDisc(16, 0x05040a, 0.6); g.add(dark);
    const moon = sprite(0xdde6f2, 3.2, 0.9); moon.position.y = 8; const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32), new THREE.MeshBasicMaterial({ color: 0x0a0a12, transparent: true, depthWrite: false })); shadow.position.set(-2, 8, 0.1); g.add(moon, shadow);
    addProp(g, o.dur, (t) => { const f = o.f; g.position.set(f.x, 0, f.z); shadow.position.x = -2 + Math.min(1, t / 0.4) * 2; shadow.quaternion.copy(api.camera.quaternion); setOpacity(g, fadeIO(t, o.dur, 0.3, 0.6)); });
  };
  S.word = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z); g.rotation.y = rnd(-0.2, 0.2);
    const col = { ANGRY: '#ff6a3d', STAND: '#ffd27a', STILL: '#b6d6ff', HUNGRY: '#ff4d6d' }[o.text] || '#ffd27a';
    const m = flat(o.w, o.w * 0.19, glowM(0xffffff, 1, textTex(o.text, col, 'bold 150px Georgia, serif', 1024, 192))); g.add(m);
    const under = flat(o.w * 1.05, o.w * 0.28, fadeM(0x1a0d08, 0.35)); under.position.y = 0.075; g.add(under);
    addProp(g, o.dur, (t) => { const k = Math.min(1, t / 0.6); m.scale.set(Math.max(0.01, k), 1, 1); m.position.x = -o.w / 2 * (1 - k); setOpacity(g, fadeIO(t, o.dur, 0.05, 0.6) * (0.85 + Math.sin(t * 6) * 0.15)); if (frame % 2 === 0) P.mote(o.x + rnd(-o.w / 2, o.w / 2) * k, 0.2, o.z + rnd(-0.8, 0.8), 0, rnd(0.6, 1.5), 0, 0.8, 0.12, -0.2, 0xffd27a); });
    P.shake(0.35);
  };
  S.petrify = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z); const spikes = [];
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = o.r * rnd(0.55, 1), s = new THREE.Mesh(Cone(rnd(0.25, 0.45), rnd(1.2, 2.4), 5), solid(0xcfc8ba)); s.position.set(Math.sin(a) * r, -1.5, Math.cos(a) * r); s.rotation.set(rnd(-0.3, 0.3), 0, rnd(-0.3, 0.3)); s.userData.d = 0.35 + i * 0.015; spikes.push(s); g.add(s); }
    const eye = sprite(0x5be36b, 2.5); eye.position.y = 3.2; g.add(eye);
    addProp(g, o.dur, (t) => { spikes.forEach((s) => { const k = Math.max(0, t - s.userData.d); s.position.y = t > o.dur - 0.5 ? -1.5 + 2.1 * (o.dur - t) / 0.5 : -1.5 + 2.1 * easeOut(k / 0.2); }); eye.scale.setScalar(2.5 + Math.sin(t * 20) * 0.4); eye.material.opacity = Math.max(0, 1 - t / 0.8); });
    setTimeout(() => { P.burst(o.x, 0.5, o.z, 40, 0xcfc8ba, 8, 0.9, 0.3, 4, 1.2); P.shake(0.5); }, 450);
  };
  S.theft = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z); g.add(groundRing(o.r, 0xff7a1a, 0.9, 0.04));
    addProp(g, o.dur, (t) => {
      const f = o.f; g.position.set(f.x, 0, f.z); setOpacity(g, fadeIO(t, o.dur, 0.1, 0.5));
      if (t < 0.6) for (let i = 0; i < 3; i++) { const a = rnd(0, TAU), r = rnd(o.r * 0.5, o.r); const x = f.x + Math.sin(a) * r, z = f.z + Math.cos(a) * r; P.mote(x, 1, z, (f.x - x) * 1.6, 1, (f.z - z) * 1.6, 0.6, 0.16, 0, Math.random() < 0.3 ? 0xffd36a : 0xff7a1a); }
      else if (frame % 1 === 0) for (let i = 0; i < 2; i++) { const a = rnd(0, TAU); P.mote(f.x, 1.6, f.z, Math.sin(a) * 9, rnd(0, 2), Math.cos(a) * 9, 0.8, 0.16, 0, 0xff7a1a); }
    });
  };
  S.beamSweep = (o) => {
    const g = new THREE.Group();
    const cone = new THREE.Mesh(Cyl(o.width * 0.6, 0.12, o.range, 16, true).rotateX(Math.PI / 2).translate(0, 0, o.range / 2), new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const core = new THREE.Mesh(Cyl(0.15, 0.06, o.range, 8).rotateX(Math.PI / 2).translate(0, 0, o.range / 2), glowM(0xffffff, 0.85));
    const lamp = sprite(0xfff3c4, 2.6); const floorLight = flat(o.width * 1.6, o.range, glowM(0xffe9a0, 0.22, glowTex())); floorLight.position.z = o.range / 2;
    const head = new THREE.Group(); head.add(cone, core); head.position.y = 2.1; g.add(head, lamp, floorLight); lamp.position.y = 2.1;
    addProp(g, o.dur + 0.2, (t) => { const f = o.f; g.position.set(f.x, 0, f.z); g.rotation.y = o.c.beamA || 0; lamp.scale.setScalar(2.4 + Math.sin(t * 30) * 0.3); setOpacity(g, fadeIO(t, o.dur + 0.2, 0.15, 0.3)); });
  };
  S.lighthouse = (o) => { /* the sweep itself is drawn by beamSweep; the cast flare: */ api.play('pillar', 'gold', o.x, 0, o.z, 6); P.burst(o.x, 2, o.z, 20, 0xfff3c4, 6, 0.6, 0.25, 0, 1); };
  S.ledger = (o) => {
    const g = new THREE.Group();
    const book = new THREE.Group(); const L = new THREE.Mesh(merge([part(Box(0.9, 0.08, 1.2), 0x1b1a1f), part(Box(0.85, 0.05, 1.15), 0xefe6d2, [0, 0.06, 0])]), vcLit()); const R = L.clone(); L.position.x = -0.45; R.position.x = 0.45; const lh = new THREE.Group(), rh = new THREE.Group(); lh.add(L); rh.add(R); book.add(lh, rh); book.position.y = 3; book.scale.setScalar(1.5); g.add(book);
    addProp(g, o.dur, (t) => { const f = o.f; g.position.set(f.x, 0, f.z); const open = easeOut(t / 0.3) * 1.2; lh.rotation.z = open; rh.rotation.z = -open; book.rotation.y = t * 2; setOpacity(g, fadeIO(t, o.dur, 0.1, 0.4)); if (frame % 2 === 0) P.mote(f.x + rnd(-0.5, 0.5), 3.2, f.z + rnd(-0.5, 0.5), rnd(-2, 2), rnd(0, 2), rnd(-2, 2), 0.7, 0.1, 4, 0xa3121e); });
  };
  S.chains = (o) => {
    const g = new THREE.Group(); const lines = o.targets.map(() => { const links = []; for (let i = 0; i < 10; i++) { const l = new THREE.Mesh(Tor(0.14, 0.04, TAU, 8), solid(0x4a4a50, { metalness: 0.8, roughness: 0.4 })); links.push(l); g.add(l); } return links; });
    addProp(g, o.dur, (t) => {
      const f = o.f, k = t < 0.25 ? t / 0.25 : 1;
      o.targets.forEach((tg, j) => { lines[j].forEach((l, i) => { const u = i / 9 * k; l.position.set(f.x + (tg.x - f.x) * u, 1.3 + Math.sin(u * Math.PI) * 0.3, f.z + (tg.z - f.z) * u); l.rotation.set(i % 2 ? Math.PI / 2 : 0, Math.atan2(tg.x - f.x, tg.z - f.z), 0); }); });
      setOpacity(g, fadeIO(t, o.dur, 0.05, 0.25));
    });
  };
  S.decree = (o) => {
    const g = new THREE.Group();
    const scroll = new THREE.Group(); const sheet = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2), new THREE.MeshBasicMaterial({ map: textTex('BY ORDER OF THE KING', '#c9a13b', 'bold 64px Georgia, serif', 1024, 192), color: 0xf2e6c8, side: THREE.DoubleSide, transparent: true })); const rodT = new THREE.Mesh(Cyl(0.12, 0.12, 3.6, 8), solid(0xc9a13b, { metalness: 0.8 })); rodT.rotation.z = Math.PI / 2; rodT.position.y = 1; const rodB = rodT.clone(); rodB.position.y = -1;
    scroll.add(sheet, rodT, rodB); scroll.position.y = 4.6; g.add(scroll);
    const crown = new THREE.Group(); crown.add(groundRing(1, 0xffc86b, 1, 0.08)); for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(Cone(0.25, 0.9, 4), glowM(0xffc86b, 0.9)); const a = i / 10 * TAU; s.position.set(Math.sin(a), 0.45, Math.cos(a)); crown.add(s); } g.add(crown);
    addProp(g, o.dur, (t) => {
      const f = o.f; g.position.set(f.x, 0, f.z); scroll.quaternion.copy(api.camera.quaternion); const u = easeOut(t / 0.5); sheet.scale.y = Math.max(0.01, u); rodT.position.y = u; rodB.position.y = -u;
      const k = easeOut(Math.max(0, t - 0.45) / 0.6); crown.scale.set(0.5 + k * (o.r - 0.5), 1 - k * 0.8, 0.5 + k * (o.r - 0.5)); crown.children.forEach((c) => c.material && (c.material.opacity = Math.max(0, 1 - k) * 0.95));
      setOpacity(scroll, fadeIO(t, o.dur, 0.2, 0.6));
    });
  };
  S.shears = (o) => {
    const g = new THREE.Group(); const thread = new THREE.Mesh(Cyl(0.05, 0.05, 9, 6), glowM(0x9e2a2b, 1)); thread.position.y = 6.5; g.add(thread);
    const blade = () => { const b = new THREE.Mesh(merge([part(Box(0.25, 0.06, 2.2), 0xd4af37, [0, 0, 1.1]), part(Tor(0.35, 0.08, TAU, 10), 0xd4af37, [0, 0, -0.4], [Math.PI / 2, 0, 0])]), vcLit()); return b; };
    const A = blade(), B = blade(); const sh = new THREE.Group(); sh.add(A, B); sh.scale.setScalar(1.6); sh.position.y = 7; g.add(sh);
    addProp(g, o.dur, (t) => {
      const tg = o.target; g.position.set(tg.x, 0, tg.z); const left = Math.max(0, o.dur - 0.4 - t), close = left < 0.35 ? 1 - left / 0.35 : 0;
      A.rotation.y = 0.6 * (1 - close); B.rotation.y = -0.6 * (1 - close); sh.rotation.x = -Math.PI / 2; sh.rotation.z = t * 0.5;
      thread.material.opacity = t > o.dur - 0.4 ? 0 : 0.6 + Math.sin(t * 8) * 0.3; setOpacity(sh, fadeIO(t, o.dur, 0.3, 0.3));
    });
  };
  S.shift = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z);
    const rune = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), glowM(0x9fd3f0, 0.8, runeRingTex('NOT TONIGHT', '#aee3f5'))); rune.scale.setScalar(o.r); rune.position.y = 0.11; g.add(rune, groundDisc(o.r, 0x9fd3f0, 0.18));
    const lamps = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, L = new THREE.Group(); L.add(new THREE.Mesh(merge([part(Cyl(0.06, 0.08, 2.2, 6), 0x1e1e22, [0, 1.1, 0]), part(Box(0.4, 0.5, 0.4), 0x6e6e70, [0, 2.4, 0])]), vcLit())); const s = sprite(0xaee3f5, 1.4); s.position.y = 2.4; L.add(s); L.position.set(Math.sin(a) * o.r, 0, Math.cos(a) * o.r); lamps.push(L); g.add(L); }
    addProp(g, o.dur, (t) => { rune.rotation.y = t * 0.2; lamps.forEach((L, i) => { L.scale.y = easeOut(Math.max(0, t - i * 0.04) / 0.3) || 0.01; L.children[1].scale.setScalar(1.3 + Math.sin(t * 6 + i) * 0.2); }); setOpacity(g, fadeIO(t, o.dur, 0.2, 0.6)); });
  };
  S.flood = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z);
    const tex = rippleTex().clone(); tex.needsUpdate = true; tex.repeat.set(4, 4);
    const water = new THREE.Mesh(new THREE.CircleGeometry(o.r, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x2fb7a3, map: tex, transparent: true, opacity: 0.55, depthWrite: false })); water.renderOrder = 4; g.add(water);
    const city = new THREE.Group(); for (let i = 0; i < 14; i++) { const a = rnd(0, TAU), r = rnd(2, o.r * 0.9), h = rnd(0.3, 1); const b = new THREE.Mesh(merge([part(Box(1.4, h, 1.2), 0x1f2124), part(Cone(1.0, 0.7, 4), 0x33373b, [0, h / 2 + 0.35, 0], [0, Math.PI / 4, 0])]), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5 })); b.position.set(Math.sin(a) * r, -0.6, Math.cos(a) * r); b.rotation.y = rnd(0, TAU); city.add(b); } g.add(city);
    g.add(groundRing(o.r, 0x3cd1bc, 0.8, 0.02));
    addProp(g, o.dur, (t) => { const k = easeOut(t / 0.8); water.position.y = -0.3 + k * 0.42; tex.offset.set(t * 0.03, t * 0.02); setOpacity(g, fadeIO(t, o.dur, 0.2, 0.8)); if (frame % 2 === 0) { const a = rnd(0, TAU), r = rnd(0, o.r); P.mote(o.x + Math.sin(a) * r, 0.2, o.z + Math.cos(a) * r, 0, 0.4, 0, 0.5, 0.1, 0, 0xd8f4f0); } });
    P.shake(0.5);
  };
  S.stairUp = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z); const steps = [];
    const H = o.H; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(shapeGeo(H, 'step'), vcLit()); const a = i * 0.55; m.position.set(Math.sin(a) * 1.6, 0.4 + i * 0.55, Math.cos(a) * 1.6); m.rotation.y = a + Math.PI / 2; m.scale.setScalar(0.01); m.userData.d = i * 0.06; steps.push(m); g.add(m); }
    const col = sprite(0xf2c14e, 4); col.position.y = 4; col.scale.set(2.5, 9, 1); g.add(col);
    addProp(g, o.dur, (t) => { steps.forEach((s) => { const k = Math.max(0, t - s.userData.d); s.scale.setScalar(Math.max(0.01, easeOut(k / 0.2) * 1.2)); }); setOpacity(g, fadeIO(t, o.dur, 0.1, 0.4)); });
  };
  S.pockets = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z); const mouths = [], things = [];
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, r = o.r * rnd(0.3, 1); const m = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16).rotateX(-Math.PI / 2), fadeM(0xb9a7d9, 0.9)); m.scale.set(1, 1, 0.45); m.position.set(Math.sin(a) * r, 0.09, Math.cos(a) * r); m.rotation.y = a; mouths.push(m); g.add(m); const rim = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.62, 16).rotateX(-Math.PI / 2), glowM(0xf4d06f, 0.8)); rim.scale.set(1, 1, 0.45); rim.position.copy(m.position); rim.position.y = 0.1; rim.rotation.y = a; g.add(rim); }
    for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(shapeGeo(o.H, 'lost' + (i % 4)), vcLit()); m.userData = { a: rnd(0, TAU), r: rnd(1, o.r), h: rnd(0.5, 3), s: rnd(1.2, 2.4) }; m.scale.setScalar(0.45); things.push(m); g.add(m); }
    g.add(groundRing(o.r, 0xb9a7d9, 0.9, 0.03), groundDisc(o.r, 0x4d5a6b, 0.3));
    addProp(g, o.dur, (t) => { things.forEach((m, i) => { const u = m.userData; u.a += u.s * 0.02; m.position.set(Math.sin(u.a) * u.r, u.h + Math.sin(t * 2 + i) * 0.4, Math.cos(u.a) * u.r); m.rotation.set(t * 2 + i, t * 3, 0); }); setOpacity(g, fadeIO(t, o.dur, 0.2, 0.6)); });
  };
  S.heads = (o) => {
    const g = new THREE.Group(); const heads = [-1, 1].map((s) => { const m = new THREE.Mesh(shapeGeo(o.H, 'hound'), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 })); m.scale.setScalar(1.7); m.userData.s = s; const eye = sprite(0xf29a1e, 1.0); eye.position.set(0, 0.4, 0.9); m.add(eye); g.add(m); return m; });
    addProp(g, o.dur, (t) => {
      const f = o.f, fa = f.facing || 0; g.position.set(f.x, 0, f.z);
      heads.forEach((h, i) => { const s = h.userData.s; h.position.set(Math.cos(fa) * s * 1.1, 2.3 + Math.sin(t * 3 + i) * 0.15 + (api.growth ? (api.growth(f) - 1) * 2 : 0), -Math.sin(fa) * s * 1.1); h.rotation.set(-0.2 + Math.sin(t * 9 + i) * 0.1, fa + s * 0.35, 0); h.scale.setScalar(1.7 * easeOut(t / 0.3)); });
      setOpacity(g, fadeIO(t, o.dur, 0.2, 0.5));
      if (frame % 2 === 0) heads.forEach((h) => P.mote(f.x + h.position.x, h.position.y + 0.3, f.z + h.position.z, 0, 1.2, 0, 0.5, 0.15, -0.5, 0xf29a1e));
    });
    P.burst(o.x, 1.5, o.z, 30, 0xf29a1e, 7, 0.7, 0.25, 0, 1);
  };
  S.mirrors = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z); const panes = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, m = new THREE.Group(); const frame = new THREE.Mesh(Box(1.5, 2.8, 0.15), solid(0x9b6a3e, { metalness: 0.6 })); const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 2.5), new THREE.MeshStandardMaterial({ color: 0xc9ced1, metalness: 1, roughness: 0.05, envMapIntensity: 1.5, emissive: 0x2a4a48 })); glass.position.z = 0.09; m.add(frame, glass); m.position.set(Math.sin(a) * o.r, -3, Math.cos(a) * o.r); m.rotation.y = a + Math.PI; m.userData.d = i * 0.04; panes.push(m); g.add(m); }
    g.add(groundRing(o.r, 0x9fe3e0, 0.7, 0.025));
    addProp(g, o.dur, (t) => { panes.forEach((m) => { const k = Math.max(0, t - m.userData.d); m.position.y = t > o.dur - 0.3 ? -3 : -3 + 4.4 * easeOut(k / 0.35); }); },
      { onEnd: () => { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; P.burst(o.x + Math.sin(a) * o.r, 1.4, o.z + Math.cos(a) * o.r, 10, 0xf4fbff, 6, 0.6, 0.18, 8, 1); } } });
  };
  S.bigDie = (o) => {
    const g = new THREE.Group(); const m = new THREE.Mesh(shapeGeo(o.H, 'die'), vcLit()); m.scale.setScalar(2.6); g.add(m);
    const glow = sprite(0x9b4dff, 5, 0.6); g.add(glow);
    addProp(g, o.dur, (t) => { const k = Math.min(1, t / 1.3); g.position.set(o.f.x + (o.tx - o.f.x) * k, 1.4 + Math.abs(Math.sin(k * Math.PI * 3)) * 2.2 * (1 - k), o.f.z + (o.tz - o.f.z) * k); m.rotation.set(t * 9 * (1 - k * 0.8), t * 4, t * 6 * (1 - k)); setOpacity(g, fadeIO(t, o.dur, 0.05, 0.2)); });
  };
  S.moon = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z);
    const mg = Ico(2.2, 2); const moon = new THREE.Mesh(noisyCol(merge([part(mg, 0xf3edc8)]), 0xf3edc8, 0xc9c2a0, 0.25), new THREE.MeshBasicMaterial({ vertexColors: true }));
    const halo = sprite(0xfff8d6, 9, 0.6); const spin = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), glowM(0xeaf2ff, 0.6, runeRingTex('◐ ◑ ◒ ◓', '#eaf2ff'))); spin.scale.setScalar(o.r); spin.position.y = 0.12;
    g.add(moon, halo, spin);
    addProp(g, o.dur, (t) => {
      const f = o.f, rise = easeOut(t / 0.7), drop = t > o.dur - 0.35 ? (t - (o.dur - 0.35)) / 0.35 : 0;
      const sx = f.x + (o.x - f.x) * rise, sz = f.z + (o.z - f.z) * rise; moon.position.set(sx - o.x, 1.5 + rise * 5 - drop * 6.2, sz - o.z); halo.position.copy(moon.position); halo.scale.setScalar(8 + Math.sin(t * 2.4) * 0.8);
      moon.rotation.y = t * 0.4; spin.rotation.y = -t * 1.5; spin.scale.setScalar(o.r * (1 - t / o.dur * 0.6));
      if (frame % 2 === 0) { const a = rnd(0, TAU); P.mote(o.x + Math.sin(a) * o.r, 0.3, o.z + Math.cos(a) * o.r, -Math.sin(a) * 4, 0.2, -Math.cos(a) * 4, 1.2, 0.12, 0, 0xeaf2ff); }
    });
  };
  S.skySlab = (o) => {
    const g = new THREE.Group(); const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 12, 0, TAU, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: cloudTex(), transparent: true, opacity: 0.85, side: THREE.DoubleSide })); dome.scale.set(1, 0.45, 1); dome.rotation.x = Math.PI; g.add(dome);
    const underside = groundDisc(2.6, 0x9cc9f0, 0.4); g.add(underside);
    addProp(g, o.dur + 0.4, (t) => { const tg = o.target; g.position.set(tg.x, 0, tg.z); const k = easeOut(t / 0.45); dome.position.y = 9 - k * (9 - 2.4); dome.rotation.z = t * 0.2; if (dome.material.map) dome.material.map.offset.x = t * 0.02; setOpacity(g, fadeIO(t, o.dur + 0.4, 0.05, 0.4)); if (t > 0.42 && t < 0.5) { P.burst(tg.x, 0.3, tg.z, 30, 0xdfeeff, 6, 0.6, 0.25, 3, 0.6); P.shake(0.6); } });
  };
  S.sunfall = (o) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z);
    const sun = new THREE.Mesh(noisyCol(merge([part(Ico(1, 2), 0x1e1d1f)]), 0x1e1d1f, 0xff7a1a, 0.18), new THREE.MeshBasicMaterial({ vertexColors: true })); const cor = sprite(0xff8a2a, 10, 0.75);
    const chain = []; for (let i = 0; i < 22; i++) { const l = new THREE.Mesh(Tor(0.4, 0.12, TAU, 8), new THREE.MeshBasicMaterial({ color: 0xd9a63a, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })); l.rotation.y = i % 2 ? Math.PI / 2 : 0; chain.push(l); g.add(l); }
    const tele = groundRing(o.r, 0xff3b1a, 0.95, 0.03), fill = groundDisc(o.r, 0xff3b1a, 0.0); g.add(sun, cor, tele, fill);
    addProp(g, o.dur, (t) => {
      const k = Math.min(1, t / 2.0), y = 30 - easeOut(k) * 28.5 - (k > 0.85 ? (k - 0.85) / 0.15 * 1.5 : 0);
      sun.scale.setScalar(3.6); sun.position.y = Math.max(0, y); sun.rotation.y = t * 0.3; cor.position.y = sun.position.y; cor.scale.setScalar(13 + Math.sin(t * 13) * 1.2);
      chain.forEach((l, i) => l.position.y = sun.position.y + 3.4 + i * 0.85);
      fill.material.opacity = 0.35 * k; tele.scale.setScalar(o.r * (1 - 0.05 * Math.sin(t * 12)));
      if (t > 2.0) { setOpacity(g, Math.max(0, 1 - (t - 2.0) / 0.3)); }
    }, { onEnd: () => {} });
    setTimeout(() => { api.play('explosion', 'fire', o.x, 0, o.z, 9); api.play('nova', 'fire', o.x, 1.5, o.z, 12); P.burst(o.x, 1, o.z, 70, 0xff7a1a, 12, 1.1, 0.35, 5, 1.8); P.shake(1.2); }, 2000);
  };
  S.swapThread = (o) => {
    const g = new THREE.Group(); const line = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 16), 3)), new THREE.LineBasicMaterial({ color: 0xb8a23a })); line.frustumCulled = false; g.add(line);
    addProp(g, o.dur, (t) => { const A = line.geometry.attributes.position, f = o.f, tg = o.target; for (let k = 0; k < 16; k++) { const u = k / 15; A.setXYZ(k, f.x + (tg.x - f.x) * u + Math.sin(u * 30 + t * 20) * 0.08, 1.2 + Math.sin(u * Math.PI) * 1.2, f.z + (tg.z - f.z) * u); } A.needsUpdate = true; });
  };
  S.toad = (o) => {}; // the toad itself is a status mark (see statusMarks)

  // event-driven one-shot effects for blasts
  function blastFx(e) {
    const H = HERO_V6[e.hid]; if (!H) return;
    const col = H.ammo.glow, x = e.x, z = e.z, r = e.r || 2;
    switch (e.fx) {
      case 'soundRing': { for (let i = 0; i < 3; i++) setTimeout(() => expandRing(x, z, r, 0xf2c14e, 0.8, true), i * 140); P.shake(0.6); return; }
      case 'songRing': for (let i = 0; i < 2; i++) setTimeout(() => expandRing(x, z, r, 0x7fe8e0, 1.0), i * 200); return;
      case 'waxRing': expandRing(x, z, r, 0xffb347, 0.8); return;
      case 'boulder': { drop(x, z, noisyCol(merge([part(Ico(1.4, 1), 0x8a7a5a)]), 0x8a7a5a, 0x5e8c6a, 0.2), 0.35, () => { api.play('explosion', 'fire', x, 0, z, 5); P.burst(x, 0.5, z, 30, 0xb08a3e, 8, 0.8, 0.3, 6, 1.4); P.shake(0.9); }); expandRing(x, z, r, 0xffc870, 0.6); return; }
      case 'coinDrop': { drop(x, z, shapeGeo(H, 'coin'), 0.3, () => { expandRing(x, z, r, 0xb9d3d6, 0.6); api.play('impact', 'gold', x, 1, z, 3); }, 3, true); return; }
      case 'stepRing': { for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; stepPop(x + Math.sin(a) * r * 0.75, z + Math.cos(a) * r * 0.75, H); } expandRing(x, z, r, 0xf2c14e, 0.7); api.play('nova', 'gold', x, 1.2, z, 7); P.shake(1); return; }
      case 'cards': { cards(x, z, r); return; }
      case 'claw': api.play('slash', 'white', x, 1.1, z, 3, { rot: rnd(0, TAU) }); api.play('slash', 'white', x, 1.1, z, 2.6, { rot: rnd(0, TAU), delay: 0.05 }); P.burst(x, 1, z, 8, 0xdde6f2, 5, 0.3, 0.14, 5); return;
      case 'bite': api.play('flame', 'fire', x, 0, z, 2.4); P.burst(x, 1, z, 10, 0xf29a1e, 5, 0.4, 0.18, 3); return;
      case 'slam': expandRing(x, z, r, 0x9cd14a, 0.45); api.play('dust', 'dust', x, 0, z, r * 1.4); P.shake(0.45); return;
      case 'whirl': whirl(x, z, r); return;
      case 'rainHit': drop(x, z, shapeGeo(H, 'die'), 0.25, () => { api.play('impact', 'arcane', x, 0.8, z, 2.4); expandRing(x, z, r, 0x9b4dff, 0.4); }, 1.2); return;
      case 'pulse': expandRing(x, z, r, col, 0.5); return;
      case 'snip': api.play('slash', 'gold', x, 1.6, z, 4, { rot: Math.PI / 4 }); P.burst(x, 1.6, z, 24, 0x9e2a2b, 7, 0.6, 0.2, 3, 1.4); P.shake(0.5); return;
      case 'toad': api.play('poof', 'venom', x, 0, z, 3); P.burst(x, 1, z, 14, 0xc7f06b, 5, 0.6, 0.18, 4, 1.2); return;
      case 'poof': api.play('poof', 'white', x, 0, z, 2.4); return;
      case 'vanish': api.play('poof', 'arcane', x, 0, z, 2.6); P.burst(x, 1, z, 10, 0xb9a7d9, 4, 0.5, 0.16, -1, 1.5); return;
      case 'return': api.play('poof', 'arcane', x, 0, z, 2.6); api.play('impact', 'arcane', x, 1, z, 2.2); return;
      case 'waveBreak': return;
      case 'roar': expandRing(x, z, r, 0xf29a1e, 0.5); api.play('ring', 'fire', x, 0, z, r * 1.6); P.shake(0.6); return;
      default:
        expandRing(x, z, r, col, 0.55); api.play('ring', pal(H), x, 0, z, r * 1.7, { speed: 1.2 });
        P.burst(x, 0.8, z, Math.min(40, 10 + r * 3), col, 4 + r, 0.6, 0.22, 4, 1.2);
        if (e.big) { api.play('nova', pal(H), x, 1.2, z, r * 1.4); P.shake(0.8); }
    }
  }
  function expandRing(x, z, r, col, dur, gap) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const ring = new THREE.Mesh(Tor(1, 0.06, gap ? TAU * 0.88 : TAU, 48), glowM(col, 0.95)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.4; g.add(ring);
    const disc = groundDisc(1, col, 0.3); g.add(disc);
    addProp(g, dur, (t, k) => { const s = 0.3 + easeOut(k) * r; ring.scale.set(s, s, 1 + (1 - k) * 4); disc.scale.setScalar(s); setOpacity(g, 1 - k); });
  }
  function drop(x, z, geo, dur, land, scale = 1, flatSpin) {
    const g = new THREE.Group(); g.position.set(x, 0, z); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, flatShading: true, transparent: true })); m.scale.setScalar(scale); g.add(m); let landed = false;
    addProp(g, dur + 0.9, (t) => { const k = Math.min(1, t / dur); m.position.y = 10 * (1 - k * k) + 0.3 * scale; m.rotation.set(flatSpin ? Math.PI / 2 : t * 6, t * 8, 0); if (k >= 1 && !landed) { landed = true; land && land(); } if (t > dur + 0.4) setOpacity(g, 1 - (t - dur - 0.4) / 0.5); });
  }
  function cards(x, z, r) {
    const g = new THREE.Group(); g.position.set(x, 0, z); const cs = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, c = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.6), new THREE.MeshBasicMaterial({ map: textTex(i % 2 ? '♥' : '♠', i % 2 ? '#c8323a' : '#1e1e22', 'bold 150px Georgia', 192, 256), color: 0xffffff, side: THREE.DoubleSide, transparent: true })); c.position.set(Math.sin(a) * r, -1.5, Math.cos(a) * r); c.rotation.y = a; cs.push(c); g.add(c); }
    addProp(g, 2.6, (t) => { cs.forEach((c) => c.position.y = t > 2.2 ? 1.3 - (t - 2.2) * 6 : -1.5 + 2.8 * easeOut(t / 0.25)); });
  }
  function whirl(x, z, r) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), glowM(0x3cd1bc, 0.85, runeRingTex('~ ~ ~ ~', '#3cd1bc'))); sp.scale.setScalar(r); sp.position.y = 0.2; g.add(sp);
    addProp(g, 1.0, (t, k) => { sp.rotation.y = -t * 8; sp.scale.setScalar(r * (1 - k * 0.6)); setOpacity(g, 1 - k); });
    P.burst(x, 0.4, z, 16, 0x3cd1bc, 5, 0.6, 0.18, 4, 1.4);
  }

  // ---------------------------------------------------------------- status marks on bodies
  function statusMarks(ents, dt) {
    for (const [e, vis] of statusVis) if (!ents.has(e) || !e.alive) { disposeGroup(vis.g); statusVis.delete(e); }
    for (const e of ents) {
      if (!e.alive) continue;
      let vis = statusVis.get(e);
      if (!vis) { vis = { g: new THREE.Group(), parts: {} }; root.add(vis.g); statusVis.set(e, vis); }
      const g = vis.g, Pp = vis.parts, h = entY(e); g.position.set(e.x, e.heroAirY || 0, e.z);
      const want = (key, make) => { if (!Pp[key]) { Pp[key] = make(); g.add(Pp[key]); } Pp[key].visible = true; return Pp[key]; };
      for (const k in Pp) Pp[k].visible = false;
      if (e.stunT > 0 && !(e.lostT > 0)) {
        const kind = e.stunKind || 'stun';
        if (kind === 'sleep') { const z = want('sleep', () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex('z Z z', '#dfe8ff', 'bold 110px Georgia, serif', 512, 160), transparent: true, depthWrite: false, fog: false })); s.scale.set(1.8, 0.56, 1); return s; }); z.position.y = h + 0.5 + Math.sin(time * 2) * 0.15; }
        else if (kind === 'toad') { const t = want('toad', () => { const m = new THREE.Mesh(merge([part(Sph(0.5, 10, 8), 0x6f9a3a, null, null, [1.2, 0.75, 1]), part(Sph(0.16, 6, 5), 0xc7f06b, [-0.25, 0.32, 0.25]), part(Sph(0.16, 6, 5), 0xc7f06b, [0.25, 0.32, 0.25]), part(Sph(0.07, 6, 4), 0x111111, [-0.25, 0.38, 0.38]), part(Sph(0.07, 6, 4), 0x111111, [0.25, 0.38, 0.38]), part(Sph(0.12, 6, 4), 0xc2404a, [0, 0.05, 0.48])]), vcLit()); return m; }); t.position.y = h + 0.3 + Math.abs(Math.sin(time * 4)) * 0.3; t.rotation.y = time; }
        else if (kind === 'stone') { const s = want('stone', () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 1, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0xbdb7a9, roughness: 1, transparent: true, opacity: 0.55, flatShading: true })); return m; }); s.scale.set(1, h * 0.95, 1); s.position.y = h * 0.47; }
        else if (kind !== 'pinned' && kind !== 'lost') { const st = want('stars', () => { const gg = new THREE.Group(); for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(Oct(0.14), new THREE.MeshBasicMaterial({ color: 0xffe066 })); gg.add(m); } return gg; }); st.position.y = h + 0.25; st.children.forEach((m, i) => { const a = time * 5 + i / 4 * TAU; m.position.set(Math.sin(a) * 0.55, Math.sin(a * 2) * 0.06, Math.cos(a) * 0.55); m.rotation.y = a; }); }
      }
      if (e.shieldHp > 0 && e.shieldT > 0) { const s = want('shield', () => new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: e.shieldCol || 0xffffff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }))); s.material.color.setHex(e.shieldCol || 0xffffff); s.scale.set(h * 0.5, h * 0.62, h * 0.5); s.position.y = h * 0.5; s.material.opacity = 0.18 + Math.sin(time * 5) * 0.05; }
      if (e.guardT > 0) { const gr = want('guard', () => { const gg = new THREE.Group(); gg.add(groundRing(1.1, 0xaee3f5, 0.95, 0.12)); const p = sprite(0xaee3f5, 1); p.scale.set(1.4, 4, 1); p.position.y = 1.6; gg.add(p); return gg; }); gr.rotation.y = time; }
      if (e.dmgBuffT > 0 || e.heroArmorT > 0) { const b = want('buff', () => groundRing(0.95, 0xffffff, 0.85, 0.15)); b.material.color.setHex(e.buffCol || (e.dmgBuffT > 0 ? 0xff7a1a : 0xc9cdd3)); b.scale.setScalar(0.9 + Math.sin(time * 6) * 0.08); }
      if (e.vulnT > 0 || e.weakT > 0) { const v = want('vuln', () => { const m = new THREE.Mesh(Cone(0.18, 0.4, 4), new THREE.MeshBasicMaterial({ color: 0xff3b3b })); m.rotation.x = Math.PI; return m; }); v.position.y = h + 0.9 + Math.sin(time * 6) * 0.08; v.material.color.setHex(e.weakT > 0 ? 0xb07dff : 0xff3b3b); }
      if (e.markT > 0) { const m = want('mark', () => groundRing(0.9, 0x9e2a2b, 1, 0.2)); m.rotation.y = -time * 2; }
    }
  }

  // ---------------------------------------------------------------- public
  function spawn(name, o) { const fn = S[name]; if (fn) { try { fn(o); } catch (err) { console.warn('hero fx failed', name, err); } } }
  function superCast(H, f, c) {
    api.play('pillar', pal(H), f.x, 0, f.z, 5.5); api.play('ring', pal(H), f.x, 0, f.z, 5, { speed: 1.2 });
    P.burst(f.x, 1.2, f.z, 24, H.ammo.glow, 6, 0.6, 0.24, 2, 1.4); P.burst(f.x, 1.2, f.z, 12, H.ammo.a, 4, 0.5, 0.2, 2, 1.2);
    if (f.isPlayer && api.banner) api.banner(H.super.name, H.name + ' · super');
  }
  function event(e) {
    switch (e.t) {
      case 'heroImpact': impact(e); break;
      case 'heroBlast': blastFx(e); break;
      case 'heroBuff': { const H = HERO_V6[e.hid]; if (H) { expandRing(e.x, e.z, e.r, H.ammo.glow, 0.7); api.play('nova', pal(H), e.x, 1.2, e.z, 5); } break; }
      case 'heroHeal': P.burst(e.x, 1.2, e.z, 4, 0x8dff8d, 2, 0.6, 0.14, -1, 1.5); if (api.healNumber) api.healNumber(e); break;
      case 'heroExecute': api.play('crit', 'gold', e.x, 1.3, e.z, 3.4); api.play('pillar', 'blood', e.x, 0, e.z, 5); P.shake(0.7); break;
      case 'heroShieldBreak': api.play('shatter', 'white', e.x, 1.2, e.z, 2.6); break;
      case 'heroGuard': api.play('pillar', 'frost', e.x, 0, e.z, 4); break;
      case 'heroLink': { const n = 8; for (let k = 0; k <= n; k++) { const a = k / n; P.mote(e.x0 + (e.x1 - e.x0) * a, 1.3 + Math.sin(a * Math.PI) * 0.6, e.z0 + (e.z1 - e.z0) * a, 0, 0.3, 0, 0.5, 0.14, 0, e.col || (HERO_V6[e.hid] ? HERO_V6[e.hid].ammo.glow : 0xffffff)); } break; }
      case 'heroTrail': { const H = HERO_V6[e.hid]; if (H) { P.mote(e.x, 0.6, e.z, 0, 0.6, 0, 0.5, 0.3, 0, H.ammo.glow); if (frame % 3 === 0) api.play('dust', 'dust', e.x, 0, e.z, 1.4); } break; }
      case 'heroRoll': {
        const H = HERO_V6[e.hid]; if (!H) break;
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex(e.show === 'die' ? String(e.face) : e.label, '#ffd34a', 'bold 150px Georgia, serif', e.show === 'die' ? 256 : 1024, 192), transparent: true, depthWrite: false, fog: false }));
        s.scale.set(e.show === 'die' ? 3 : 8, e.show === 'die' ? 2.25 : 1.5, 1); const g = new THREE.Group(); g.add(s); g.position.set(e.x, 4, e.z);
        addProp(g, 1.8, (t, k) => { g.position.y = 4 + k * 1.5; s.material.opacity = Math.min(1, (1 - k) * 2); s.scale.multiplyScalar(t < 0.15 ? 1.04 : 1); });
        if (e.show === 'die') api.play('nova', e.face === 6 ? 'gold' : e.face === 1 ? 'blood' : 'arcane', e.x, 1.2, e.z, 7);
        if (e.isPlayer && api.toast) api.toast(e.show === 'die' ? `The die shows ${e.face}!` : `The word is ${e.label}`);
        break;
      }
      case 'heroHurtSelf': api.play('hit', 'blood', e.x, 1.2, e.z, 2); break;
    }
  }
  function update(dt, ents) {
    time += dt;
    for (let i = props.length - 1; i >= 0; i--) {
      const p = props[i]; p.t += dt;
      if (p.t >= p.dur) { p.onEnd && p.onEnd(); disposeGroup(p.group); props.splice(i, 1); continue; }
      try { p.update(p.t, p.t / p.dur, p); } catch (err) { console.warn('hero prop failed', err); disposeGroup(p.group); props.splice(i, 1); }
    }
    if (ents) statusMarks(ents, dt);
  }
  function clear() { for (const p of props) disposeGroup(p.group); props.length = 0; for (const [, v] of statusVis) disposeGroup(v.g); statusVis.clear(); }
  return { ammo, ammoBegin, ammoEnd, spawn, superCast, event, update, clear, impact, root, props };
}
