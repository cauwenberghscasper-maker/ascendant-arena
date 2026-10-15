// --- hub world ---------------------------------------------------------------------
const hubParts = { barriers: [], gateLabels: [], denLabels: [], portalDisc: null, portalRing: null, berryIM: null, wpIM: null, lavaIM: null, zoneMeshes: [] };
function hashf(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
// smooth value noise in 0..1 (bilinear between hashed lattice points)
function vnoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hashf(ix, iz), b = hashf(ix + 1, iz), c = hashf(ix, iz + 1), d = hashf(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
// ground: the zone colours plus a world-space texture of pixel-sized speckles, darker patches and
// light grass tufts, so the floor reads like a painted pixel-art tileset instead of flat facets
const matGround = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96, metalness: 0 });
// Each zone gets its own floor pattern on top of the zone colours: grass clumps and dirt patches,
// snow drifts, glowing lava cracks, broken flagstones, wet pebbles, marble terraces, and cobblestones
// in the town plaza and along the road (all world-space, so it tiles forever without a texture file).
matGround.userData.u = { uTown: { value: new THREE.Vector3() }, uRoad: { value: new THREE.Vector2() } };
matGround.onBeforeCompile = (sh) => {
  Object.assign(sh.uniforms, matGround.userData.u);
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW; attribute float aTh; attribute vec3 aGc; varying float vTh; varying vec3 vGc;')
    .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvGW = (modelMatrix * vec4(transformed, 1.0)).xyz; vTh = aTh; vGc = aGc;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vGW;
uniform vec3 uTown; uniform vec2 uRoad; varying float vTh; varying vec3 vGc;
float gh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 gh2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float gn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gh(i), gh(i + vec2(1.0, 0.0)), f.x), mix(gh(i + vec2(0.0, 1.0)), gh(i + vec2(1.0, 1.0)), f.x), f.y); }
// voronoi: x = distance to the cell border (mortar / cracks), y = random id of the cell (stone tone)
vec2 vor(vec2 p) { vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0; vec2 id = vec2(0.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 o = g + gh2(i + g) * 0.85 - f; float d = dot(o, o);
    if (d < d1) { d2 = d1; d1 = d; id = i + g; } else if (d < d2) d2 = d; }
  return vec2(sqrt(d2) - sqrt(d1), gh(id)); }
float gGlow = 0.0; vec3 gGlowC = vec3(0.0);`)
    .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec2 w = vGW.xz; vec2 px = w;   // smooth world-space detail; the pixel pass adds the crisp edge
  float zone = floor(vTh + 0.5); vec3 zgc = vGc;   // floor style and glow of this area (per ground mesh)
  float fine = gh(floor(w * 4.0));
  float pat = gn(px * 0.35) * 0.6 + gn(px * 1.3) * 0.4;
  vec3 c = diffuseColor.rgb * (0.86 + pat * 0.22 + (fine - 0.5) * 0.03);
  float big = gn(px * 0.06);
  if (zone < 1.5) {                                   // meadow + forest: grass clumps, blades, dirt patches
    float clump = smoothstep(0.55, 0.75, gn(px * 0.5 + 7.0));
    c *= 1.0 - clump * 0.16;
    float blade = smoothstep(0.72, 0.93, gn(w * vec2(3.0, 6.0) + 3.0)) * smoothstep(0.35, 0.65, gn(px * 0.8));
    c = mix(c, c * vec3(1.3, 1.42, 1.12) + 0.015, blade * 0.32);
    float dirt = smoothstep(0.66, 0.72, big + gn(px * 0.4) * 0.12);
    c = mix(c, vec3(0.16, 0.11, 0.06) * (0.85 + fine * 0.3), dirt * 0.85);
    c = mix(c, c * 0.55, step(0.985, gh(floor(w * 3.0) + 41.0)) * (0.4 + dirt));
  } else if (zone < 2.5) {                            // frost: drifts with blue shade and sparkles
    float drift = gn(px * 0.25);
    c *= mix(vec3(0.78, 0.86, 1.0), vec3(1.08), smoothstep(0.3, 0.7, drift));
    c += step(0.993, gh(floor(w * 4.0) + 9.0)) * 0.35;
  } else if (zone < 3.5) {                            // ember: cracked basalt, some cracks glow
    vec2 v = vor(px * 0.45);
    c *= 0.8 + v.y * 0.35;
    float crack = 1.0 - smoothstep(0.03, 0.08, v.x);
    float hot = smoothstep(0.64, 0.78, gn(px * 0.12 + 3.0));
    c = mix(c, vec3(0.04, 0.025, 0.02), crack * 0.9);
    gGlow = crack * hot * 0.8; gGlowC = zgc;
  } else if (zone < 4.5 || zone > 5.5) {             // starfall + celestial: broken flagstone terraces
    float tile = zone > 5.5 ? 1.6 : 1.2;
    vec2 t = px / tile; t.x += step(1.0, mod(floor(t.y), 2.0)) * 0.5;
    vec2 f = fract(t), id = floor(t);
    float paved = smoothstep(0.42, 0.5, gn(px * 0.07 + 11.0)) * step(0.12, gh(id + 5.0));
    float mortar = 1.0 - step(0.05, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)) * tile);
    vec3 stone = c * (0.88 + gh(id) * 0.26) * (zone > 5.5 ? 1.08 : 1.0);
    c = mix(c, mix(stone, c * 0.45, mortar), paved);
    if (zone > 5.5) c = mix(c, vec3(0.95, 0.78, 0.38), paved * mortar * step(0.7, gh(id + 2.0)) * 0.7);
    else { gGlow = paved * mortar * step(0.94, gh(id + 3.0)) * 0.45; gGlowC = zgc; }
  } else {                                            // abyss: wet pebbles with faint teal glints
    vec2 v = vor(px * 1.1);
    c *= 0.82 + v.y * 0.3;
    c = mix(c, c * 0.5, 1.0 - smoothstep(0.04, 0.1, v.x));
    gGlow = step(0.992, gh(floor(w * 4.0) + 21.0)); gGlowC = zgc;
  }
  // town plaza and the road: cobblestones like an old dungeon floor
  float plaza = 1.0 - smoothstep(uTown.z - 3.0, uTown.z - 1.0, length(w - uTown.xy));
  float road = (1.0 - smoothstep(uRoad.x - 0.6, uRoad.x + 0.4, abs(w.x))) * step(uTown.y, w.y) * step(w.y, uRoad.y);
  float cob = max(plaza, road * (1.0 - smoothstep(0.62, 0.7, gn(px * 0.3 + 5.0)) * 0.6));
  if (cob > 0.01) {
    vec2 v = vor(px * 1.05);
    vec3 st = diffuseColor.rgb * (0.84 + v.y * 0.28) * (0.94 + gn(px * 3.0) * 0.12);
    st = mix(st, diffuseColor.rgb * 0.45, 1.0 - smoothstep(0.03, 0.08, v.x));
    st = mix(st, st * 1.12, smoothstep(0.12, 0.3, v.x) * 0.5); // rounded stone tops catch the light
    c = mix(c, st, cob);
  }
  diffuseColor.rgb = c;
}`)
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += gGlowC * gGlow * 1.4;');
};
matGround.customProgramCacheKey = () => 'ground4';
const worldArt = createWorldArt({THREE, GEO, part, mergeParts, hasModel: (n) => hasWorldModel(n) });
const hasWM = (n) => hasWorldModel(n); // a generated world model exists (src/game/48-world-models.js)
const zoneGround = (zi) => { const g = CFG.world.zones[zi].ground; return typeof g === 'string' ? PALETTE[g] : g; };
const zonePath = (zi) => PALETTE[CFG.world.zones[zi].path] || PALETTE.path;
function groundColorAt(x, z, r) {
  const W = CFG.world, T = W.town, P2 = PALETTE;
  const zi = zoneAt(z);
  if (x < W.minX - 1 || x > W.maxX + 1 || z < W.minZ - 1 || z > W.maxZ + 1) { const o = zoneGround(zi); return new THREE.Color(o[r < 0.5 ? 0 : 1]).multiplyScalar(0.72).getHex(); }
  const dt = Math.hypot(x - T.x, z - T.z);
  if (dt < T.r - 2) return P2.plaza[Math.floor(r * 3)];
  if (Math.abs(x + Math.sin(z * 0.03) * 0) < 2.8 && z > T.z && z < W.maxZ - 6) return zonePath(zi)[r < 0.5 ? 0 : 1];
  { const l = W.lairs[zi]; if (l && Math.hypot(x - l.x, z - l.z) < 8) return new THREE.Color(zoneGround(zi)[0]).multiplyScalar(0.8).getHex(); }
  for (const D of W.dens) { if (D.zone !== zi) continue; const d = Math.hypot(x - D.x, z - D.z); if (d < D.r + 1) return new THREE.Color(zoneGround(zi)[Math.floor(r * 4)]).multiplyScalar(d < D.r - 1 ? 0.7 : 0.82).getHex(); }
  const arr = zoneGround(zi);
  return arr[Math.floor(r * arr.length)];
}
const THEME_AMP = [0.45, 0.5, 0.7, 0.5, 0.45, 0.55, 0.3];
const zoneAmp = (zi) => { const zn = CFG.world.zones[zi]; return zn.amp != null ? zn.amp : THEME_AMP[zn.theme]; };
function buildHub() {
  const W = CFG.world, T = W.town, P2 = PALETTE, rng = mulberry32(1337);
  const grid = new Grid(6);
  // ground: one mesh per zone so the GPU can skip zones that are out of view
  { const u = matGround.userData.u; u.uTown.value.set(T.x, T.z, T.r); u.uRoad.value.set(2.8, W.maxZ - 6);
  }
  const TG = [[1, 0.33, 0.06], [1, 0.33, 0.06], [1, 0.33, 0.06], [1, 0.33, 0.06], [0.65, 0.4, 1.0], [0.2, 1.0, 0.85], [1, 0.85, 0.4]];
  W.zones.forEach((zn, zi) => {
    const z0 = zi === 0 ? W.minZ - 20 : zn.z0, z1 = zi === W.zones.length - 1 ? W.maxZ + 20 : zn.z1;
    const gw = W.maxX - W.minX + 60, gd = z1 - z0;
    let g = new THREE.PlaneGeometry(gw, gd, Math.round(gw / 5), Math.max(4, Math.round(gd / 5))).rotateX(-Math.PI / 2);
    g.translate((W.minX + W.maxX) / 2, 0, (z0 + z1) / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const flat = Math.hypot(x - T.x, z - T.z) < T.r + 2 || Math.abs(x) < 4 || Math.abs(z - zn.z0) < 1 || Math.abs(z - zn.z1) < 1;
      const edge = x < W.minX || x > W.maxX || z < W.minZ || z > W.maxZ;
      const amp = edge ? 2.6 : flat ? 0.02 : zoneAmp(zoneAt(z));
      pos.setY(i, (hashf(x * 0.7, z * 0.7) - 0.5) * amp - (flat ? 0 : 0.08) + (edge ? 1.4 + Math.min(4, (Math.max(W.minX - x, x - W.maxX, 0)) * 0.12) : 0));
    }
    g.computeVertexNormals(); g = g.toNonIndexed(); // smooth rolling ground, not faceted triangles
    const gp = g.attributes.position, gc = new Float32Array(gp.count * 3);
    for (let i = 0; i < gp.count; i++) {
      const cx = gp.getX(i), cz = gp.getZ(i);
      _col.set(groundColorAt(cx, cz, clamp(vnoise(cx * 0.07, cz * 0.07) * 1.15 - 0.07, 0, 0.999)));
      gc[i * 3] = _col.r; gc[i * 3 + 1] = _col.g; gc[i * 3 + 2] = _col.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(gc, 3)); g.deleteAttribute('uv');
    { const gl = zn.glow || TG[zn.theme], th = new Float32Array(gp.count).fill(zn.theme), gcl = new Float32Array(gp.count * 3);
      for (let i = 0; i < gp.count; i++) gcl.set(gl, i * 3);
      g.setAttribute('aTh', new THREE.BufferAttribute(th, 1)); g.setAttribute('aGc', new THREE.BufferAttribute(gcl, 3)); }
    const gm = new THREE.Mesh(g, matGround); gm.receiveShadow = true; hubGroup.add(gm); hubParts.zoneMeshes.push(gm);
  });

  // town: houses, fountain, stalls (one merged mesh)
  const tParts = [];
  const houseAngles = [-2.45, -1.8, -1.1, 1.1, 1.8, 2.45];
  // town houses: generated timber and stone cottages facing the plaza (one instanced draw per style)
  const houses = [[], []];
  houseAngles.forEach((a, i) => {
    const x = T.x + Math.sin(a) * 17.5, z = T.z + Math.cos(a) * 17.5;
    houses[i % 2].push({ x, z, ry: a + Math.PI, s: 6.2 + (i % 3) * 0.4 });
    grid.add({ x, z, r: 3 });
  });
  WorldModels.place(hubGroup, 'house_a', houses[0]); WorldModels.place(hubGroup, 'house_b', houses[1]);
  // the castle behind the arena portal, with two watchtowers flanking the town
  WorldModels.place(hubGroup, 'keep', [{ x: T.x, z: CFG.world.minZ - 6, ry: 0, s: 15 }]);
  WorldModels.place(hubGroup, 'tower', [{ x: T.x - 27, z: T.z - 14, ry: 0.5, s: 12 }, { x: T.x + 27, z: T.z - 14, ry: -0.5, s: 12 }]);
  grid.add({ x: T.x - 27, z: T.z - 14, r: 3.6 }); grid.add({ x: T.x + 27, z: T.z - 14, r: 3.6 });

  // the plaza fountain and two market stalls (generated models)
  WorldModels.place(hubGroup, 'fountain', [{ x: T.x, z: T.z, ry: 0, s: 4.6 }]);
  { const st = [-1, 1].map((sd) => { const a = Math.PI - sd * 0.75; return { x: T.x + Math.sin(a) * 13, z: T.z + Math.cos(a) * 13, ry: a + Math.PI, s: 3.4 }; });
    WorldModels.place(hubGroup, 'stall', st); for (const it of st) grid.add({ x: it.x, z: it.z, r: 1.9 }); }
  grid.add({ x: T.x, z: T.z, r: 3 });
  // lanterns around the plaza
  { const lamps = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2, x = T.x + Math.sin(a) * 11.5, z = T.z + Math.cos(a) * 11.5;
      if (hasWM('lantern_post')) { lamps.push({ x, z, ry: a + Math.PI, s: 3.4 }); grid.add({ x, z, r: 0.35 }); }
      else { tParts.push(part(GEO.box, 0x4b4f58, [x, 1.1, z], null, [0.14, 2.2, 0.14])); tParts.push(part(GEO.box, 0xffd98a, [x, 2.3, z], null, [0.34, 0.34, 0.34])); } }
    WorldModels.place(hubGroup, 'lantern_post', lamps, { glow: 0xffd99a, glowK: 0.12 }); }
  // smith anvil + stall
  const sm = NPC_DEFS.find((n) => n.id === 'garo');
  WorldModels.place(hubGroup, 'forge', [{ x: sm.x + 2.4, z: sm.z - 0.8, ry: -Math.PI / 2 - 0.4, s: 2.8 }]); grid.add({ x: sm.x + 2.4, z: sm.z - 0.8, r: 1.6 });
  // town dressing from the hand-made prop kit: a working smithy, market goods, plaza benches, training dummies, a wagon
  { const D = new Map(), put = (n, x, z, ry, s, r) => { if (!hasWM(n)) return; if (!D.has(n)) D.set(n, []); D.get(n).push({ x: T.x + x, z: T.z + z, ry, s }); if (r) grid.add({ x: T.x + x, z: T.z + z, r }); };
    const gx = sm.x - T.x, gz = sm.z - T.z;
    put('anvil', gx + 1.4, gz + 2.0, 0.3, 0.75, 0.6); put('weapon_rack', gx - 1.9, gz - 2.2, 0.6, 1.5, 0.7); put('workbench', gx + 3.8, gz + 1.8, -0.2, 1.0, 1.1);
    put('barrel', gx + 4.6, gz - 1.9, 0, 1.05, 0.5); put('barrel', gx + 4.9, gz - 0.9, 1, 1.0, 0.5); put('bucket', gx + 2.6, gz + 2.6, 0, 0.42); put('crate', gx - 3.2, gz - 0.6, 0.4, 0.95, 0.6);
    put('stall_kit_1', -14.5, -6, Math.PI / 2, 2.7, 1.4); put('farm_crate', -13.2, -3.6, 0.2, 0.42); put('farm_crate', -13.0, -8.4, -0.3, 0.42); put('barrel', -16.4, -3.4, 0, 1.0, 0.5);
    put('stall_kit_2', 15.6, -8, -Math.PI / 2, 2.7, 1.6); put('crate', 14.0, -10.6, 0.3, 0.9, 0.6); put('crate', 14.3, -11.5, 1.1, 0.75); put('barrel', 17.2, -5.6, 0.5, 1.0, 0.5);
    for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; put('bench', Math.sin(a) * 7.2, Math.cos(a) * 7.2, a, 0.78, 0.7); }
    houseAngles.forEach((a, i) => { put(i % 2 ? 'crate' : 'barrel', Math.sin(a + 0.2) * 14.6, Math.cos(a + 0.2) * 14.6, a * 3, 1.0, 0.55);
      if (i % 3 === 0) put('barrel', Math.sin(a + 0.27) * 14.4, Math.cos(a + 0.27) * 14.4, a, 0.95, 0.5); });
    put('dummy', -5, -12.6, 0, 1.9, 0.4); put('dummy', 5, -12.6, 0, 1.9, 0.4); put('wagon', 6, 15.5, 0.3, 1.6, 1.3);
    for (const [n, list] of D) WorldModels.place(hubGroup, n, list); }
  // portal arch (stone)
  // arena gate: generated purple-and-gold archway around the portal swirl
  WorldModels.place(hubGroup, 'arena_gate', [{ x: PORTAL.x, z: PORTAL.z - 0.3, ry: 0, s: 7.2 }]);
  grid.add({ x: PORTAL.x - 2.6, z: PORTAL.z, r: 0.6 }); grid.add({ x: PORTAL.x + 2.6, z: PORTAL.z, r: 0.6 });
  // rift gate: obsidian ring with a crimson-violet swirl (endless floors)
  { const RG = CFG.rift.gate;
    if (hasWM('rift_gate')) WorldModels.place(hubGroup, 'rift_gate', [{ x: RG.x, z: RG.z + 0.2, ry: 0, s: 5.6 }], { glow: 0xff3d8e, glowK: 0.12 });
    else for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, x = RG.x + Math.sin(a) * 2.6, z = RG.z + Math.cos(a) * 2.6; tParts.push(part(GEO.ico0, 0x2a1f3d, [x, 0.35, z], [0, a, 0], [0.55, 0.7 + (i % 3) * 0.25, 0.55])); }
    if (!hasWM('rift_gate')) { tParts.push(part(GEO.cyl8, 0x1f1830, [RG.x, 0.12, RG.z], null, [2.3, 0.24, 2.3]));
    tParts.push(part(GEO.box, 0x2a1f3d, [RG.x - 1.9, 1.7, RG.z], [0, 0, 0.12], [0.6, 3.4, 0.6])); tParts.push(part(GEO.box, 0x2a1f3d, [RG.x + 1.9, 1.7, RG.z], [0, 0, -0.12], [0.6, 3.4, 0.6]));
    tParts.push(part(GEO.cone4, 0xff3d6e, [RG.x - 1.95, 3.6, RG.z], null, [0.4, 0.7, 0.4])); tParts.push(part(GEO.cone4, 0xff3d6e, [RG.x + 1.95, 3.6, RG.z], null, [0.4, 0.7, 0.4])); }
    grid.add({ x: RG.x - 1.9, z: RG.z, r: 0.5 }); grid.add({ x: RG.x + 1.9, z: RG.z, r: 0.5 }); }
  // lair standing stones (one ring per zone)
  const lairStones = [];
  W.lairList.forEach((l) => {
    const stone = [P2.stone, 0x5f6b4f, 0xa9bcd0, 0x3b2f2b, 0x4a4378, 0x2f5d64, 0xeadfc0][W.zones[l.zone].theme] || P2.stone;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8, x = l.x + Math.sin(a) * 9.5, z = l.z + Math.cos(a) * 9.5;
      if (hasWM('standing_stone')) lairStones.push({ x, z, ry: a + Math.PI, s: 3.4 + (i % 3) * 0.35, color: W.zones[l.zone].theme >= 2 ? stone : 0xffffff });
      else { tParts.push(part(GEO.box, stone, [x, 1.3, z], [0, a, 0.05 * (i % 3)], [1.1, 2.6, 0.8]));
        if (i % 2 === 0) tParts.push(part(GEO.box, 0x6f747e, [x, 2.75, z], [0, a, 0], [1.3, 0.35, 1.0])); }
      grid.add({ x, z, r: 0.7 });
    }
  });
  WorldModels.place(hubGroup, 'standing_stone', lairStones, { glow: 0x9fe8ff, glowK: 0.08 });
  // gates: a castle gatehouse over the road + fence posts
  const gates = [], fences = [];
  for (let zi = 1; zi < W.zones.length; zi++) {
    const zn = W.zones[zi], gz = zn.z0;
    gates.push({ x: 0, z: gz, ry: Math.PI, s: 8.2 }); // castle gatehouse over the road (model below)
    grid.add({ x: -3.2, z: gz, r: 0.6 }); grid.add({ x: 3.2, z: gz, r: 0.6 });
    const fence = zi === 1 || zn.biome !== W.zones[zi - 1].biome;
    if (fence && hasWM('fence')) { const fw = WORLD_MODEL_BOX.fence[0]; for (let x = W.minX + 2; x <= W.maxX - 2; x += 4) { if (Math.abs(x) < 6) continue; fences.push({ x, z: gz, ry: 0, s: 4.05 / fw }); } }
    else if (fence) for (let x = W.minX; x <= W.maxX; x += 3) {
      if (Math.abs(x) < 4) continue;
      tParts.push(part(GEO.box, P2.fence, [x, 0.7, gz], [0, 0, 0], [0.24, 1.4, 0.24]));
    }
    if (fence && !hasWM('fence')) { tParts.push(part(GEO.box, P2.fence, [(W.minX - 4) / 2, 1.0, gz], null, [-W.minX - 4, 0.12, 0.12]));
    tParts.push(part(GEO.box, P2.fence, [(W.maxX + 4) / 2, 1.0, gz], null, [W.maxX - 4, 0.12, 0.12])); }
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(W.maxX - W.minX, 5), new THREE.MeshBasicMaterial({ color: P2.gateLocked, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
    bm.position.set(0, 2.5, gz); hubGroup.add(bm);
    hubParts.barriers.push({ mesh: bm, zone: zi });
    hubParts.gateLabels.push({ x: 0, z: gz, y: 5.6, zone: zi });
  }
  WorldModels.place(hubGroup, 'gatehouse', gates); WorldModels.place(hubGroup, 'fence', fences);
  // monster dens: a ring of bones, rocks and banners so the camp reads from far away
  const den = { tent: [], banner: [], bones: [], rock: [] };
  W.dens.forEach((D, di) => {
    const zc = [0x8a8f99, 0x5b4a3a, 0xbfd3e6, 0x3a2622, 0x3b3566, 0x2b6f6a, 0xd9c48a][W.zones[D.zone].theme];
    if (hasWM('war_tent')) for (let i = 0; i < 12; i++) {
      // a war camp ring: tents and banners at the quarters, bone piles and boulders between (no colliders: the den stays open)
      const a = (i / 12) * Math.PI * 2 + di, x = D.x + Math.sin(a) * (D.r + 2.2), z = D.z + Math.cos(a) * (D.r + 2.2), face = a + Math.PI;
      (i % 6 === 0 ? den.tent : i % 6 === 3 ? den.banner : i % 2 ? den.bones : den.rock).push({ x, z, ry: face + (hashf(x, z) - 0.5) * 0.6,
        s: i % 6 === 0 ? 3.6 : i % 6 === 3 ? 4.6 : i % 2 ? 1.5 : 1.7 + hashf(z, x), color: i % 2 || i % 3 ? 0xffffff : zc });
    }
    else for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + di, x = D.x + Math.sin(a) * (D.r + 1.2), z = D.z + Math.cos(a) * (D.r + 1.2);
      if (i % 4 === 0) { tParts.push(part(GEO.box, 0x5a4632, [x, 1.4, z], null, [0.18, 2.8, 0.18])); tParts.push(part(GEO.box, 0xc23b3b, [x + 0.45, 2.3, z], null, [0.8, 0.9, 0.05])); }
      else if (i % 2) tParts.push(part(GEO.dodec, zc, [x, 0.4, z], [0, a, 0], [0.8, 0.6, 0.7]));
      else tParts.push(part(GEO.box, 0xf1ead6, [x, 0.12, z], [0, a, 0.2], [0.9, 0.12, 0.14]));
    }
    if (!hasWM('war_tent')) tParts.push(part(GEO.cyl8, 0x4a3426, [D.x, 0.2, D.z], null, [1.2, 0.4, 1.2]));
    hubParts.denLabels.push({ x: D.x, z: D.z, y: 3.6, den: di });
  });
  WorldModels.place(hubGroup, 'war_tent', den.tent); WorldModels.place(hubGroup, 'banner_pole', den.banner);
  WorldModels.place(hubGroup, 'bone_pile', den.bones, { far: 90 }); WorldModels.place(hubGroup, 'rock_a', den.rock);
  // dungeon beacons: a tall soft pillar of light over every cave, seen from the road
  { const bg = new THREE.CylinderGeometry(0.7, 1.6, 46, 10, 1, true), bmat = new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const caves = W.pois.filter((q) => q.kind === 'dungeon'), bim = new THREE.InstancedMesh(bg, bmat, caves.length), m4 = new THREE.Matrix4();
    caves.forEach((q, i) => bim.setMatrixAt(i, m4.makeTranslation(q.x, 23, q.z))); bim.frustumCulled = false; hubGroup.add(bim); }
  // ore veins: a generated ore outcrop per vein (crystal cluster for the rare vein); greyed and sunk while regrowing
  { const rot = (q) => (q.x < 0 ? Math.PI / 2 : -Math.PI / 2) + (hashf(q.x, q.z) - 0.5) * 1.2;
    const items = { ore: [], crystal: [] }; hubParts.oreItems = [];
    W.nodes.forEach((q) => { const k = q.id.endsWith(':3') ? 'crystal' : 'ore', it = { x: q.x, z: q.z, ry: rot(q), s: k === 'ore' ? 2.2 : 2.6, base: k === 'ore' ? 2.2 : 2.6 }; items[k].push(it); hubParts.oreItems.push(it); });
    hubParts.oreSets = [WorldModels.place(hubGroup, 'ore', items.ore, { shadow: false }), WorldModels.place(hubGroup, 'crystal', items.crystal, { glow: 0x9fe8ff, glowK: 0.5, shadow: false })];
    G.nodesDirty = true; }
  // quarries: each area's veins sit in one Mine with a rock wall behind, a cart, an ore pile, a signpost and a lantern
  { const L = { wall: [], cart: [], pile: [], sign: [], lamp: [] }; hubParts.mineLabels = [];
    for (const m of W.mines) { const s = m.side, face = -s * Math.PI / 2, P = (dx, dz) => ({ x: m.x + s * dx, z: m.z + dz });
      L.wall.push(Object.assign(P(10, 0), { ry: face, s: 7 })); for (const dz of [-6, 0, 6]) grid.add(Object.assign(P(10.5, dz), { r: 2.6 }));
      L.cart.push(Object.assign(P(-1, -10), { ry: face + 0.4, s: 1.9 })); grid.add(Object.assign(P(-1, -10), { r: 1.2 }));
      L.pile.push(Object.assign(P(-1, 10), { ry: face - 0.6, s: 1.8 })); grid.add(Object.assign(P(-1, 10), { r: 1.1 }));
      L.sign.push(Object.assign(P(-9, -3), { ry: face, s: 2.6 })); grid.add(Object.assign(P(-9, -3), { r: 0.4 }));
      L.lamp.push(Object.assign(P(-9, 4), { ry: face, s: 3.2 })); grid.add(Object.assign(P(-9, 4), { r: 0.4 }));
      hubParts.mineLabels.push({ x: m.x, z: m.z, y: 4.2, name: m.name, zone: m.zone }); }
    WorldModels.place(hubGroup, 'quarry_wall', L.wall); WorldModels.place(hubGroup, 'mine_cart', L.cart); WorldModels.place(hubGroup, 'ore_pile', L.pile);
    WorldModels.place(hubGroup, 'signpost', L.sign); WorldModels.place(hubGroup, 'lantern_post', L.lamp, { glow: 0xffd99a, glowK: 0.12 }); }
  // cave mouths down to the dungeons (the rock colliders come from the area art)
  { const caves = W.pois.filter((q) => q.kind === 'dungeon').map((q) => { const r = q.x < 0 ? Math.PI / 2 : -Math.PI / 2; return { x: q.x - Math.sin(r) * 2.5, z: q.z - Math.cos(r) * 2.5, ry: r, s: 6.4 }; });
    WorldModels.place(hubGroup, 'cave', caves, { shadow: false, bright: 1.35 }); }
  // waypoint stones: obelisks with a floating crystal
  W.waypoints.forEach((w) => grid.add({ x: w.x, z: w.z, r: 1.1 }));
  WorldModels.place(hubGroup, 'lodestone', W.waypoints.map((w, i) => ({ x: w.x, z: w.z, ry: (i * 1.7) % 6.28, s: 3.6 })), { glow: 0x7fe8ff, glowK: 0.18 });
  if (!hasWM('house_a')) worldArt.town(tParts, T, houseAngles, P2);
  const townMesh = new THREE.Mesh(mergeParts(tParts), worldArt.material); townMesh.castShadow = true; townMesh.receiveShadow = true; hubGroup.add(townMesh);
  // per-area art: gate trims, lair ring, skyline and this area's points of interest (their colliders join the grid first)
  W.zones.forEach((zn, zi) => { for (const o of worldArt.zoneLandmarks(hubGroup, W, zi, REGION_ART[zn.theme])) grid.add(o); });
  // landmark, runestone and minor-POI models (sized to their clearing), and the walled secret pockets as boulders and trees
  { const PM = new Map(), add = (n, it, o) => { if (!PM.has(n)) PM.set(n, { items: [], o }); PM.get(n).items.push(it); };
    for (const q of W.pois) {
      if (q.art === 'cache') { if (!hasWM('rock_a') || !hasWM('tree_ash')) continue;
        poiLayout(q, null, () => {}).forEach((h2, i) => add(i % 3 === 1 ? 'tree_ash' : 'rock_a', { x: h2.x, z: h2.z, ry: hashf(h2.x, h2.z) * 6, s: i % 3 === 1 ? 7 : Math.max(1.6, h2.r * 1.7) }));
        if (hasWM('chest')) add('chest', { x: q.x, z: q.z, ry: q.gap > 0 ? 0 : Math.PI, s: 0.9 });
        continue; }
      const pm = POI_MODEL[q.art]; if (!pm || !hasWM(pm[0])) continue;
      const b = WORLD_MODEL_BOX[pm[0]], sc = Math.min(pm[1], 2 * q.r * 0.95 / Math.max(b[0], b[1]));
      add(pm[0], { x: q.x, z: q.z, ry: poiRotation(q), s: sc }, q.kind === 'rune' || /crystal|star|moon|brazier|altar|rod/.test(pm[0]) ? { glow: 0x9fdcff, glowK: 0.1 } : {});
    }
    for (const [n, v] of PM) WorldModels.place(hubGroup, n, v.items, v.o); }
  {
    const wim = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.45, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), W.waypoints.length);
    wim.instanceMatrix.setUsage(THREE.DynamicDrawUsage); wim.frustumCulled = false; wim.setColorAt(0, _col.set(0xffffff)); hubGroup.add(wim); hubParts.wpIM = wim;
  }

  // portal swirl
  const pd = new THREE.Mesh(new THREE.CircleGeometry(2.1, 24), new THREE.MeshBasicMaterial({ color: P2.portal, transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
  pd.position.set(PORTAL.x, 1.9, PORTAL.z); hubGroup.add(pd); hubParts.portalDisc = pd;
  const pr = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.16, 6, 24), new THREE.MeshBasicMaterial({ color: 0xe2ccff }));
  pr.position.copy(pd.position); hubGroup.add(pr); hubParts.portalRing = pr;

  { const RG = CFG.rift.gate;
    const rd = new THREE.Mesh(new THREE.CircleGeometry(1.55, 32), new THREE.MeshBasicMaterial({ map: swirlTex(), color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    rd.position.set(RG.x, 1.75, RG.z); hubGroup.add(rd); hubParts.riftDisc = rd;
    const rr = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.1, 6, 32), new THREE.MeshBasicMaterial({ color: 0xff5d8f })); rr.position.copy(rd.position); hubGroup.add(rr); hubParts.riftRing = rr; }
  // vegetation and props, built per zone
  function placeOk(x, z, pad) {
    if (Math.hypot(x - T.x, z - T.z) < T.r + 5) return false;
    if (Math.abs(x) < 5.5) return false;
    for (let zi = 1; zi < W.zones.length; zi++) if (Math.abs(z - W.zones[zi].z0) < 3) return false;
    for (const l of W.lairList) if (Math.hypot(x - l.x, z - l.z) < 13) return false;
    for (const D of W.dens) if (Math.hypot(x - D.x, z - D.z) < D.r + 3) return false;
    for (const w of W.waypoints) if (Math.hypot(x - w.x, z - w.z) < 4) return false;
    if (Math.hypot(x - CFG.rift.gate.x, z - CFG.rift.gate.z) < 5) return false;
    for (const sp of CFG.shrines.list) if (Math.hypot(x - sp.x, z - sp.z) < 8) return false;
    // POIs keep a ring of open ground; secret pockets get extra so nothing plugs the gap from outside
    for (const q of W.pois) { const r = q.r + (q.kind === 'secret' ? 5 : 2); if (Math.abs(z - q.z) < r && Math.hypot(x - q.x, z - q.z) < r) return false; }
    let hit = false; grid.query(x, z, (o) => { if (Math.hypot(x - o.x, z - o.z) < o.r + pad) hit = true; });
    return !hit;
  }
  const {trunkGeo, pineGeo, rockGeo, bushGeo, tuftGeo} = worldArt, roundGeo = worldArt.broadGeo;
  const deadGeo = mergeParts([part(GEO.cyl7, 0xffffff, [0, 1.3, 0], null, [0.2, 2.6, 0.2]), part(GEO.cyl7, 0xffffff, [0.45, 2.2, 0], [0, 0, -0.8], [0.09, 1.2, 0.09]), part(GEO.cyl7, 0xffffff, [-0.35, 1.8, 0.1], [0.2, 0, 0.9], [0.08, 1.0, 0.08]), part(GEO.cone7, 0xffffff, [0, 2.9, 0], null, [0.14, 0.6, 0.14])]);
  const crystalGeo = worldArt.crystalGeo;
  const spikeGeo = mergeParts([part(GEO.cone4, 0xffffff, [0, 0.9, 0], null, [0.45, 1.8, 0.45]), part(GEO.cone4, 0xffffff, [0.4, 0.5, 0.1], [0, 0, -0.3], [0.25, 1.0, 0.25])]);
  const flowerGeo = mergeParts([part(GEO.ico0, 0xffffff, [0, 0.3, 0], null, [0.13, 0.1, 0.13]), part(GEO.cyl7, 0x4f9a5a, [0, 0.13, 0], null, [0.025, 0.26, 0.025])]);
  const logGeo = mergeParts([part(GEO.cyl7, 0xffffff, [0, 0.28, 0], [0, 0, Math.PI / 2], [0.28, 2.4, 0.28]), part(GEO.cyl7, 0xd9b98a, [1.21, 0.28, 0], [0, 0, Math.PI / 2], [0.22, 0.03, 0.22]), part(GEO.cyl7, 0xd9b98a, [-1.21, 0.28, 0], [0, 0, Math.PI / 2], [0.22, 0.03, 0.22])]);
  const stumpGeo = mergeParts([part(GEO.cyl7, 0xffffff, [0, 0.3, 0], null, [0.42, 0.6, 0.42]), part(GEO.cyl7, 0xd9b98a, [0, 0.61, 0], null, [0.36, 0.02, 0.36])]);
  const stemGeo = mergeParts([part(GEO.cyl7, 0xffffff, [0, 0.12, 0], null, [0.05, 0.24, 0.05])]);
  const capGeo = mergeParts([part(GEO.cone7, 0xffffff, [0, 0.28, 0], null, [0.17, 0.12, 0.17])]);
  const pillarGeo = mergeParts([part(GEO.box, 0xffffff, [0, 0.5, 0], null, [0.75, 1, 0.75]), part(GEO.box, 0xffffff, [0, 0.06, 0], null, [0.95, 0.12, 0.95])]);
  const blockGeo = mergeParts([part(GEO.box, 0xffffff, [0, 0.25, 0], [0.1, 0, 0.15], [0.8, 0.5, 0.6])]);
  const flies = [], ponds = [];
  const tintMat = worldArt.foliageMaterial;
  const glowTint = worldArt.material;
  function inst(geo, list, useColor, opts) {
    if (!list.length) return null;
    opts = opts || {};
    // Spatial batches let the GPU skip distant groves instead of drawing a whole region.
    if (list.length > 120 && !opts.chunked) {
      const cells = new Map();
      for (const it of list) { const key = Math.floor(it.x / 64) + ':' + Math.floor(it.z / 64); if (!cells.has(key)) cells.set(key, []); cells.get(key).push(it); }
      for (const entries of cells.values()) inst(geo, entries, useColor, {...opts, chunked:true});
      return null;
    }
    const im = new THREE.InstancedMesh(geo, opts.mat || (useColor ? tintMat : worldArt.material), list.length);
    list.forEach((it, i) => {
      _e.set(0, it.ry != null ? it.ry : hashf(it.x, it.z) * 6, 0); _q.setFromEuler(_e);
      _m4.compose(_v3.set(it.x, it.y ? it.y - 1.2 : 0, it.z), _q, _s3.set(it.s, it.sy || it.s, it.s));
      im.setMatrixAt(i, _m4);
      if (useColor) im.setColorAt(i, _col.set(it.c));
    });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.computeBoundingSphere(); im.castShadow = opts.shadow !== false; im.receiveShadow = !!opts.receive;
    hubGroup.add(im); return im;
  }
  // every area's props share one list per geometry/material, so a 64 m cell costs one call even where areas meet
  const batches = new Map();
  function bat(geo, list, useColor, opts) {
    if (!list.length) return;
    const key = geo.uuid + (useColor ? 'c' : '') + (opts ? (opts.mat ? opts.mat.uuid : '') + opts.shadow + opts.receive : '');
    let b = batches.get(key); if (!b) batches.set(key, b = { geo, list: [], useColor, opts });
    for (const it of list) b.list.push(it);
  }
  // generated models replace the primitive props wherever one exists: name -> [items], placed once after all areas
  const MB = new Map(), MBO = {};
  const mput = (name, it, opts, key) => { const k = key || name; if (!MB.has(k)) { MB.set(k, []); MBO[k] = { name, opts: opts || {} }; } MB.get(k).push(it); };
  const _col2 = new THREE.Color(), soft = (c, k) => _col.set(0xffffff).lerp(_col2.set(c), k).getHex(); // a gentle per-instance tint over the painted texture
  const TREE_MODEL = { round: ['tree_oak', 7], pine: ['tree_ash', 8], snowPine: ['tree_snow', 7.5], dead: ['tree_ember', 7.5], crystal: ['tree_crystal', 8], coral: ['tree_coral', 8], blossom: ['tree_gold', 7] };
  const treeSet = (name) => hasWM(name + '_lod') ? [{ far: 52 }, { near: 52, shadow: false }] : [{}, null];
  // Props per area: the theme sets the defaults (counts per 160 m of road), each area's look overrides them.
  const THEME_DECO = [
    { tree: 'round', trees: 190, rocks: 50, tufts: 1500, tuftC: [0x6d9a4a, 0x82ad55], flowers: 260, flowerC: [0xff7aa8, 0xffd34a, 0xffffff, 0xb08cff], bushes: 220, logs: 16, fungi: 60, ruins: 2, flies: 70, ponds: 6 },
    { tree: 'pine', trees: 300, rocks: 50, tufts: 1500, tuftC: [0x3e6b3a, 0x4f7f45], flowers: 120, flowerC: [0xff9b3d, 0xe9e3cf], bushes: 300, logs: 30, fungi: 120, ruins: 3, flies: 140, ponds: 4 },
    { tree: 'snowPine', trees: 200, rocks: 80, spikes: 0.45, spikeC: 0xcfe6f7, tufts: 700, tuftC: [0xd7e6f2, 0xc5d8e8], flowers: 0, bushes: 120, logs: 10, fungi: 0, ruins: 2, flies: 0, ponds: 0 },
    { tree: 'dead', trees: 130, rocks: 90, rockC: [0x4a3a34], spikes: 0.45, spikeC: 0x2b1c17, tufts: 600, tuftC: [0x8a5a3c, 0x6b4a3d], flowers: 0, bushes: 60, logs: 18, fungi: 0, ruins: 3, flies: 50, ponds: 0, lava: 22 },
    { tree: 'crystal', trees: 110, rocks: 60, rockC: [0x5b5390], tufts: 800, tuftC: [0x7f74c9, 0x6a5fb5], flowers: 0, bushes: 90, logs: 0, fungi: 0, ruins: 6, flies: 90, ponds: 0 },
    { tree: 'coral', trees: 140, rocks: 70, rockC: [0x2f4f55], spikes: 0.45, spikeC: 0x14393f, tufts: 700, tuftC: [0x3fa39b, 0x2f8f88], flowers: 0, bushes: 140, logs: 0, fungi: 90, fungiC: [0x2fffd0, 0x7fe3ff], glowCaps: true, ruins: 4, flies: 80, ponds: 0 },
    { tree: 'blossom', trees: 150, rocks: 50, rockC: [0xf4efe2, 0xe3d8bd, 0xd8cfb8], tufts: 900, tuftC: [0xf7e7b5, 0xfff8e6], flowers: 200, flowerC: [0xffffff, 0xffd36b, 0xffb3c7], bushes: 160, logs: 8, fungi: 40, fungiC: [0xfff3c4], glowCaps: true, ruins: 5, flies: 70, ponds: 0 },
  ];
  const THEME_LEAF = [P2.roundLeaf, P2.pine, P2.snowPine, [0x3a2a24, 0x4a3328], [0x433d70, 0x534a86], [0x1f5a63, 0x2a7078], [0xd9c48f, 0xe8d3a3]];
  const THEME_RUIN = [0x7d786c, 0x7d786c, 0xaab8c4, 0x4a3a34, 0x5b5390, 0x2f5560, 0xe3d8bd];
  const TREE_TOP = { round: 'roundLeaf', pine: 'pine', snowPine: 'snowPine', dead: 'deadTree', crystal: 'crystal', coral: 'coral', blossom: 'blossom' };
  const lava = [], WK = (W.maxX - W.minX) / 260 * 0.8; // counts were tuned for a 260 m wide map; v10 is a bit more open per m²
  W.zones.forEach((zn, zi) => {
    const th = zn.theme, D = Object.assign({}, THEME_DECO[th], zn.deco || {}), k = zn.len / 160 * WK, cnt = (v) => Math.round((v || 0) * k);
    const trunks = [], tops = [], rocks = [], tufts = [], flowers = [], spikes = [];
    const z0 = Math.max(zn.z0, W.minZ), z1 = Math.min(zn.z1, W.maxZ);
    const rnd = () => ({ x: W.minX + 2 + rng() * (W.maxX - W.minX - 4), z: z0 + 2 + rng() * (z1 - z0 - 4) });
    let n = 0, tries = 0;
    // most trees grow in groves around a few centres, leaving open glades in between
    const groves = []; for (let g2 = 0; g2 < Math.max(4, Math.round(9 * k)); g2++) groves.push(rnd());
    const near = () => { const c = groves[Math.floor(rng() * groves.length)], a = rng() * 6.283, d = Math.sqrt(rng()) * 22; return { x: clamp(c.x + Math.sin(a) * d, W.minX + 2, W.maxX - 2), z: clamp(c.z + Math.cos(a) * d * 0.8, z0 + 2, z1 - 2) }; };
    const tree = D.tree, topC = D.treeC || P2[TREE_TOP[tree]] || P2.roundLeaf;
    while (tree !== 'none' && n < cnt(D.trees) && tries++ < 6000) {
      const { x, z } = rng() < 0.65 ? near() : rnd(); if (!placeOk(x, z, 1.9)) continue;
      const s = 0.8 + rng() * 0.7, c = topC[Math.floor(rng() * topC.length)];
      if (tree === 'crystal') tops.push({ x, z, s: s * 0.9, c });
      else if (tree === 'coral') tops.push({ x, z, s: s * 1.05, c });
      else if (tree === 'blossom') { trunks.push({ x, z, s }); tops.push({ x, z, s: s * 1.05, c }); }
      else if (tree === 'dead') tops.push({ x, z, s: s * 1.1, c });
      else { trunks.push({ x, z, s }); tops.push({ x, z, s, c }); }
      grid.add({ x, z, r: 0.55 * s }); n++;
    }
    const rockC = D.rockC || P2.rock;
    for (let i = 0, kk = 0; i < cnt(D.rocks) && kk < 3000; kk++) {
      const { x, z } = rnd(); if (!placeOk(x, z, 1.5)) continue;
      const s = 0.6 + rng() * 1.1;
      if (D.spikes && rng() < D.spikes) spikes.push({ x, z, s: s * 0.9, c: D.spikeC });
      else rocks.push({ x, z, s, c: rockC[Math.floor(rng() * rockC.length)], ry: rng() * 6 });
      grid.add({ x, z, r: 0.85 * s }); i++;
    }
    // grass tufts + flowers (no collision)
    const tuftC = D.tuftC;
    for (let i = 0; i < cnt(D.tufts); i++) { const { x, z } = rnd(); if (Math.hypot(x - T.x, z - T.z) < T.r + 2 || Math.abs(x) < 3.5) continue; tufts.push({ x, z, s: 0.8 + rng() * 0.9, c: tuftC[i % tuftC.length], ry: rng() * 6 }); }
    for (let i = 0; i < cnt(D.flowers); i++) { const { x, z } = rnd(); if (Math.hypot(x - T.x, z - T.z) < T.r || Math.abs(x) < 3.5) continue; flowers.push({ x, z, s: 0.8 + rng() * 0.6, c: D.flowerC[i % D.flowerC.length] }); }
    for (let i = 0; i < cnt(D.lava); i++) { const { x, z } = rnd(); if (!placeOk(x, z, 3)) continue; lava.push({ x, z, s: 2 + rng() * 3, c: D.lavaC || 0xff6a1f }); }
    // undergrowth and points of interest so the ground never reads as an empty plain
    const bushes = [], logs = [], stumps = [], stems = [], caps = [], pillars = [], blocks = [];
    const leafC = D.leafC || THEME_LEAF[th];
    for (let i = 0; i < cnt(D.bushes); i++) {
      const { x, z } = rng() < 0.6 ? near() : rnd(); if (Math.hypot(x - T.x, z - T.z) < T.r + 3 || Math.abs(x) < 4.5) continue;
      bushes.push({ x, z, s: 0.55 + rng() * 0.7, c: leafC[Math.floor(rng() * leafC.length)] });
    }
    for (let i = 0, kk = 0; i < cnt(D.logs) && kk < 400; kk++) {
      const { x, z } = near(); if (!placeOk(x, z, 1.6)) continue;
      if (rng() < 0.55) { logs.push({ x, z, s: 0.8 + rng() * 0.5, c: th === 3 ? 0x3a2a24 : th === 2 ? 0x6a5a4c : 0x5a3e2a, ry: rng() * 6 }); grid.add({ x, z, r: 0.9 }); }
      else { stumps.push({ x, z, s: 0.8 + rng() * 0.6, c: th === 3 ? 0x2e221d : 0x5a3e2a }); grid.add({ x, z, r: 0.5 }); }
      i++;
    }
    const fungiC = D.fungiC || [0xc23b3b, 0xd9a441, 0xe9e3cf], fs = D.fungiS || 1;
    for (let i = 0; i < cnt(D.fungi); i++) {
      const { x, z } = near(); if (Math.abs(x) < 4.5) continue;
      const s = (0.6 + rng() * 0.8) * (fs > 1 ? 1 + rng() * (fs - 1) : 1);
      stems.push({ x, z, s, c: 0xe9e3cf }); caps.push({ x, z, s, c: fungiC[i % fungiC.length] });
    }
    // ruins: a few broken colonnades per area (forest shrines, starfall halls, celestial terraces)
    for (let r = 0; r < Math.max(D.ruins ? 1 : 0, cnt(D.ruins)); r++) {
      const c = rnd(); if (!placeOk(c.x, c.z, 7)) continue;
      const stoneC = D.ruinC || THEME_RUIN[th];
      const cn = 5 + Math.floor(rng() * 4), rad = 4 + rng() * 3, a0 = rng() * 6.283;
      for (let q = 0; q < cn; q++) {
        const a = a0 + (q / cn) * 6.283, x = c.x + Math.sin(a) * rad, z = c.z + Math.cos(a) * rad;
        if (rng() < 0.7) { const h = 0.6 + rng() * 1.6; pillars.push({ x, z, s: 1, sy: h, c: stoneC, ry: rng() * 0.6 }); grid.add({ x, z, r: 0.6 }); }
        else blocks.push({ x: x + rng() - 0.5, z: z + rng() - 0.5, s: 0.7 + rng() * 0.4, c: stoneC, ry: rng() * 6 });
      }
      for (let q = 0; q < 4; q++) blocks.push({ x: c.x + (rng() - 0.5) * rad, z: c.z + (rng() - 0.5) * rad, s: 0.4 + rng() * 0.4, c: stoneC, ry: rng() * 6 });
    }
    const rot = (it) => (it.ry != null ? it.ry : hashf(it.x, it.z) * 6);
    if (hasWM('bush_a')) bushes.forEach((b, i) => mput(hasWM('bush_flower') && (th === 0 || th === 6) && i % 3 === 0 ? 'bush_flower' : 'bush_a', { x: b.x, z: b.z, ry: rot(b), s: 1.5 * b.s, color: soft(b.c, 0.35) }, { far: 100, shadow: false }));
    else bat(bushGeo, bushes, true, { receive: true });
    if (hasWM('log')) logs.forEach((l) => mput('log', { x: l.x, z: l.z, ry: l.ry, s: 0.75 * l.s, color: soft(l.c, 0.3) }, { far: 100, shadow: false })); else bat(logGeo, logs, true, { receive: true });
    if (hasWM('stump')) stumps.forEach((l) => mput('stump', { x: l.x, z: l.z, ry: rot(l), s: 0.75 * l.s }, { far: 100, shadow: false })); else bat(stumpGeo, stumps, true);
    if (hasWM('mushrooms')) caps.forEach((c, i) => { if (i % 2) return; mput('mushrooms', { x: c.x, z: c.z, ry: rot(c), s: 0.7 * c.s, color: soft(c.c, 0.4) }, D.glowCaps ? { far: 90, shadow: false, glow: 0x7fffe0, glowK: 0.3 } : { far: 90, shadow: false }, D.glowCaps ? 'mushrooms_glow' : 'mushrooms'); });
    else { bat(stemGeo, stems, true, { shadow: false }); bat(capGeo, caps, true, D.glowCaps ? { mat: glowTint, shadow: false } : { shadow: false }); }
    if (hasWM('ruin_pillar')) { pillars.forEach((q) => mput('ruin_pillar', { x: q.x, z: q.z, ry: q.ry, s: 1.5 * q.sy + 0.6, color: soft(q.c, 0.45) })); blocks.forEach((q) => mput(hasWM('ruin_block') ? 'ruin_block' : 'rock_a', { x: q.x, z: q.z, ry: q.ry, s: 0.75 * q.s, color: soft(q.c, 0.45) }, { far: 110 })); }
    else { bat(pillarGeo, pillars, true, { receive: true }); bat(blockGeo, blocks, true, { receive: true }); }
    if (D.glowCaps || th === 1) for (const st of caps) flies.push({ x: st.x, z: st.z });
    for (let i = 0; i < cnt(D.flies); i++) { const q2 = rng() < 0.7 ? near() : rnd(); flies.push(q2); }
    for (let i = 0, kk = 0; i < Math.round((D.ponds || 0) * Math.max(k, 0.6)) && kk < 300; kk++) { const c = rnd(); if (!placeOk(c.x, c.z, 5)) continue; ponds.push({ x: c.x, z: c.z, s: 2.5 + rng() * 2.5 }); grid.add({ x: c.x, z: c.z, r: 1.5 }); i++; }
    const TM = TREE_MODEL[tree];
    if (TM && hasWM(TM[0])) {
      // one tree model per theme; near cells draw the full mesh, far cells its light LOD (when generated)
      const [full, lod] = treeSet(TM[0]), glowT = tree === 'crystal' || tree === 'coral' ? { glow: tree === 'crystal' ? 0xb49cff : 0x5fffe0, glowK: 0.18 } : {};
      tops.forEach((t) => { const it = { x: t.x, z: t.z, ry: hashf(t.x, t.z) * 6, s: TM[1] * t.s, color: soft(t.c, 0.1) };
        mput(TM[0], it, Object.assign({}, glowT, full)); if (lod) mput(TM[0] + '_lod', it, Object.assign({}, glowT, lod)); });
    } else {
      if (tree === 'round' || tree === 'pine' || tree === 'snowPine' || tree === 'blossom') bat(trunkGeo, trunks, false);
      const topGeo = { round: roundGeo, blossom: roundGeo, pine: pineGeo, snowPine: pineGeo, dead: deadGeo, coral: worldArt.coralGeo, crystal: crystalGeo }[tree];
      if (topGeo) bat(topGeo, tops, true, tree === 'crystal' || tree === 'coral' ? { mat: glowTint } : null);
    }
    if (hasWM('rock_a')) { rocks.forEach((r) => mput('rock_a', { x: r.x, z: r.z, ry: r.ry, s: 1.25 * r.s, color: soft(r.c, 0.55) }, { far: 110, shadow: false }));
      spikes.forEach((r) => mput(hasWM('rock_b') ? 'rock_b' : 'rock_a', { x: r.x, z: r.z, ry: hashf(r.z, r.x) * 6, s: 1.3 * r.s, sy: hasWM('rock_b') ? 1 : 1.9, color: soft(r.c, 0.55) }, { far: 120 })); }
    else { bat(rockGeo, rocks, true, { receive: true }); bat(spikeGeo, spikes, true); }
    // grass and flowers: a third as many model clumps (each covers more ground), close range only
    if (hasWM('tuft')) { tufts.forEach((t, i) => { if (i % 3 === 0) mput('tuft', { x: t.x, z: t.z, ry: t.ry, s: 0.55 * t.s, color: soft(t.c, 0.5) }, { far: 60, shadow: false }); });
      flowers.forEach((f, i) => { if (i % 3 === 0) mput(hasWM('flower') ? 'flower' : 'tuft', { x: f.x, z: f.z, ry: hashf(f.x, f.z) * 6, s: 0.6 * f.s }, { far: 60, shadow: false }, 'flowers'); }); }
    else { bat(tuftGeo, tufts, true, { shadow: false }); bat(flowerGeo, flowers, true, { shadow: false }); }
  });
  for (const b of batches.values()) inst(b.geo, b.list, b.useColor, b.opts);
  for (const [k, items] of MB) WorldModels.place(hubGroup, MBO[k].name, items, MBO[k].opts);
  // glowing lava pools in the Ember Wastes (decor)
  if (lava.length) {
    const lim = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 10).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff }), lava.length);
    lava.forEach((l, i) => { _m4.compose(_v3.set(l.x, 0.05, l.z), _q.identity(), _s3.set(l.s, 1, l.s * 0.8)); lim.setMatrixAt(i, _m4); lim.setColorAt(i, _col.set(l.c)); });
    lim.computeBoundingSphere(); hubGroup.add(lim); hubParts.lavaIM = lim;
  }
  // ponds: dark water with a lighter rim and lily pads
  if (ponds.length && hasWM('pond')) { const pb = WORLD_MODEL_BOX.pond;
    WorldModels.place(hubGroup, 'pond', ponds.map((pd2) => ({ x: pd2.x, z: pd2.z, y: -0.24, ry: hashf(pd2.x, pd2.z) * 6, sx: 2.3 * pd2.s / pb[0], sz: 1.8 * pd2.s / pb[1], sy: 0.85, s: 1 })), { shadow: false }); }
  else if (ponds.length) {
    const rimIM = new THREE.InstancedMesh(new THREE.CircleGeometry(1.12, 14).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: 0x6a5f45, gradientMap: toonRamp }), ponds.length);
    const wIM = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 24).rotateX(-Math.PI / 2), worldArt.waterMaterial, ponds.length);
    ponds.forEach((pd2, i) => { _m4.compose(_v3.set(pd2.x, 0.06, pd2.z), _q.identity(), _s3.set(pd2.s, 1, pd2.s * 0.75)); rimIM.setMatrixAt(i, _m4); _m4.compose(_v3.set(pd2.x, 0.09, pd2.z), _q.identity(), _s3.set(pd2.s, 1, pd2.s * 0.75)); wIM.setMatrixAt(i, _m4); });
    rimIM.receiveShadow = true; rimIM.computeBoundingSphere(); wIM.computeBoundingSphere(); hubGroup.add(rimIM, wIM);
    const pads = []; ponds.forEach((pd2) => { for (let k = 0; k < 4; k++) { const a = rng() * 6.283, d = rng() * pd2.s * 0.6; pads.push({ x: pd2.x + Math.sin(a) * d, z: pd2.z + Math.cos(a) * d * 0.75, s: 0.25 + rng() * 0.2, c: 0x4f7f45, y: 1.31 }); } });
    inst(new THREE.CircleGeometry(1, 7).rotateX(-Math.PI / 2), pads, true, { shadow: false });
  }
  // fireflies: tiny glowing points that drift and blink (pixel-sized in pixel-art mode)
  if (flies.length) {
    const fp = new Float32Array(flies.length * 3), ph = new Float32Array(flies.length);
    flies.forEach((f, i) => { fp[i * 3] = f.x + (rng() - 0.5) * 3; fp[i * 3 + 1] = 0.6 + rng() * 2.2; fp[i * 3 + 2] = f.z + (rng() - 0.5) * 3; ph[i] = rng() * 100; });
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3)); fg.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
    const fm = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 }, px: { value: 2 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'uniform float t; uniform float px; attribute float phase; varying float vA; void main() { vec3 p = position; p.x += sin(t * 0.7 + phase) * 0.8; p.z += cos(t * 0.6 + phase * 1.3) * 0.8; p.y += sin(t * 1.1 + phase * 0.7) * 0.35; vA = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(t * 2.3 + phase * 3.0), 3.0); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = px; }',
      fragmentShader: 'varying float vA; void main() { gl_FragColor = vec4(vec3(1.0, 0.92, 0.45) * 1.6 * vA, vA); }' });
    const fl = new THREE.Points(fg, fm); fl.frustumCulled = false; hubGroup.add(fl); hubParts.flies = fm;
  }
  // a deep forest wall around the play area (several rows), so the world ends in woods, not a flat plain
  const bTrunks = [], bTops = [];
  for (let i = 0; i < Math.min(4500, Math.round(1400 * (W.maxZ - W.minZ) / 1150)); i++) {
    const side = i % 4; let x, z;
    if (side < 2) { x = side ? W.maxX + 3 + Math.pow(rng(), 0.7) * 34 : W.minX - 3 - Math.pow(rng(), 0.7) * 34; z = W.minZ - 20 + rng() * (W.maxZ - W.minZ + 40); }
    else { z = side === 2 ? W.minZ - 3 - rng() * 26 : W.maxZ + 3 + rng() * 26; x = W.minX - 30 + rng() * (W.maxX - W.minX + 60); }
    const zi = W.zones[zoneAt(z)].theme, s = 1 + rng() * 0.8;
    if (zi <= 2) { bTrunks.push({ x, z, s, y: 1.6 }); bTops.push({ x, z, s, y: 1.6, c: zi === 2 ? P2.snowPine[0] : P2.pine[Math.floor(rng() * 3)] }); }
    else bTops.push({ x, z, s: s * 1.2, y: 1.6, c: zi === 3 ? 0x2b1c17 : zi === 5 ? 0x1b4f58 : zi === 6 ? 0xe8d3a3 : 0x4a4378 });
  }
  if (hasWM('tree_ash')) {
    // the wall of woods uses each theme's tree (its light LOD when generated); no shadows this far out
    const bt = (th) => [, 'tree_ash', 'tree_ash', 'tree_snow', 'tree_ember', 'tree_crystal', 'tree_coral', 'tree_gold'][th + 1] || 'tree_ash';
    bTops.forEach((t) => { const th = W.zones[zoneAt(t.z)].theme, nm = hasWM(bt(th)) ? bt(th) : 'tree_ash', m = hasWM(nm + '_lod') ? nm + '_lod' : nm;
      mput(m, { x: t.x, z: t.z, ry: hashf(t.x, t.z) * 6, s: (th <= 2 ? 7.5 : 6) * t.s, color: soft(t.c, 0.25) }, { shadow: false }, 'border_' + m); });
    for (const k of [...MB.keys()].filter((k) => k.startsWith('border_'))) WorldModels.place(hubGroup, MBO[k].name, MB.get(k), MBO[k].opts);
  } else { inst(trunkGeo, bTrunks, false, { shadow: false }); inst(pineGeo, bTops, true, { shadow: false }); }
  // horizon: each theme's distant landmass beyond the woods (mountains, volcanoes, sea stacks, floating isles, sky temples)
  { const HZ = ['mountain', 'mountain', 'snow_mountain', hasWM('volcano') ? 'volcano' : 'mountain', 'floating_isle', 'sea_stack', hasWM('sky_temple') ? 'sky_temple' : 'floating_isle'], hz = new Map();
    W.zones.forEach((zn, zi) => { const nm = HZ[zn.theme]; if (!hasWM(nm)) return; if (!hz.has(nm)) hz.set(nm, []);
      for (const side of [-1, 1]) for (let j = 0; j < 2; j++) { const x = side * (W.maxX + 48 + ((zi + j) % 2) * 16), z = zn.z0 + (j + 0.5) * zn.len / 2 + (hashf(zi, j) - 0.5) * 20;
        hz.get(nm).push({ x, z, y: nm === 'floating_isle' || nm === 'sky_temple' ? 14 + hashf(z, x) * 10 : -1, ry: hashf(x, z) * 6, s: 34 + hashf(z, zi) * 14, color: zn.theme === 3 ? 0x8a5a4a : zn.theme === 6 ? 0xfff0d0 : 0xffffff }); } });
    for (const [nm, items] of hz) WorldModels.place(hubGroup, nm, items, { shadow: false, horizon: true, far: 230, glow: nm === 'volcano' ? 0xff6a2a : 0, glowK: 0.25 }); }

  // challenge shrines: stone rings (static) + floating crystals (state colour)
  {
    const sParts = [];
    if (hasWM('shrine')) WorldModels.place(hubGroup, 'shrine', CFG.shrines.list.map((sp) => ({ x: sp.x, z: sp.z, ry: sp.x < 0 ? Math.PI / 2 : -Math.PI / 2, s: 3.2 })), { glow: 0xc9b8ff, glowK: 0.1 });
    else for (const sp of CFG.shrines.list) {
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; sParts.push(part(GEO.box, 0x8f8aa8, [sp.x + Math.sin(a) * 3.6, 0.45, sp.z + Math.cos(a) * 3.6], [0, a, 0], [0.6, 0.9, 0.6])); }
      sParts.push(part(GEO.cyl8, 0x6f6a8a, [sp.x, 0.25, sp.z], null, [1.1, 0.5, 1.1]));
      sParts.push(part(GEO.cyl8, 0xb9b3d8, [sp.x, 0.52, sp.z], null, [0.8, 0.08, 0.8]));
    }
    if (sParts.length) { const sm2 = new THREE.Mesh(mergeParts(sParts), matVC); sm2.castShadow = true; hubGroup.add(sm2); }
    const crys = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), CFG.shrines.list.length);
    crys.instanceMatrix.setUsage(THREE.DynamicDrawUsage); crys.frustumCulled = false; crys.setColorAt(0, _col.set(0xffffff)); hubGroup.add(crys); hubParts.shrineIM = crys;
    const sring = new THREE.InstancedMesh(new THREE.RingGeometry(3.2, 3.5, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }), CFG.shrines.list.length);
    sring.frustumCulled = false; sring.setColorAt(0, _col.set(0xffffff)); hubGroup.add(sring); hubParts.shrineRingIM = sring;
    CFG.shrines.list.forEach((sp, i) => { _m4.makeTranslation(sp.x, 0.07, sp.z); sring.setMatrixAt(i, _m4); });
    sring.instanceMatrix.needsUpdate = true;
  }
  // XP orbs
  {
    const total = CFG.pellets.perZone.reduce((a, b) => a + b, 0);
    const pim = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.24, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), total);
    pim.instanceMatrix.setUsage(THREE.DynamicDrawUsage); pim.frustumCulled = false; pim.setColorAt(0, _col.set(0xffffff)); hubGroup.add(pim); hubParts.pelletIM = pim;
  }
  // berries
  const bim = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.32, 0), new THREE.MeshBasicMaterial({ color: 0xff5fa2 }), CFG.world.berryCount);
  bim.instanceMatrix.setUsage(THREE.DynamicDrawUsage); bim.frustumCulled = false; hubGroup.add(bim); hubParts.berryIM = bim;
  G.hubObstacles = grid;
}

// zone mood: fog + sky colours glide as you walk between zones
const _fogA = new THREE.Color(), _skyTop = new THREE.Color(), _skyHor = new THREE.Color();
const ZoneMood = { fog: new THREE.Color(PALETTE.fog), top: new THREE.Color(PALETTE.skyTop), hor: new THREE.Color(PALETTE.skyHorizon), t: 0 };
function updateZoneMood(dt) {
  if (G.dungeon) { updateDungeonView(dt); return; } // the dungeon owns fog and sky while inside
  if (G.mode !== 'hub' || !G.player || G.rift) return;
  const W = CFG.world, z = G.player.z, zi = zoneAt(z), zn = W.zones[zi];
  // blend toward the next zone near its border
  let k = 0, nz = zn;
  if (zi < W.zones.length - 1) { const nb = W.zones[zi + 1]; k = clamp(1 - (nb.z0 - z) / 20, 0, 1) * 0.5; nz = nb; }
  if (zi > 0 && z - zn.z0 < 20) { const pb = W.zones[zi - 1]; const kk = clamp(1 - (z - zn.z0) / 20, 0, 1) * 0.5; if (kk > k) { k = kk; nz = pb; } }
  const a = 1 - Math.exp(-dt * 2);
  ZoneMood.fog.lerp(_fogA.set(zn.fog).lerp(_skyTop.set(nz.fog), k), a);
  ZoneMood.top.lerp(_skyTop.set(zn.sky[0]).lerp(_skyHor.set(nz.sky[0]), k), a);
  ZoneMood.hor.lerp(_skyHor.set(zn.sky[1]).lerp(_fogA.set(nz.sky[1]), k), a);
  scene.fog.color.copy(ZoneMood.fog);
  ZoneMood.t += dt; if (ZoneMood.t > 0.15) { ZoneMood.t = 0; paintSky(ZoneMood.top, ZoneMood.hor); }
}
function paintSky(top, hor) {
  const sky = scene.userData.sky; if (!sky) return;
  const g = sky.geometry, pos = g.attributes.position, col = g.attributes.color;
  for (let i = 0; i < pos.count; i++) { const k = clamp(pos.getY(i) / 200, 0, 1); _col.copy(hor).lerp(top, Math.pow(k, 0.6)); col.setXYZ(i, _col.r, _col.g, _col.b); }
  col.needsUpdate = true;
}

// --- arena ------------------------------------------------------------------------------
// walkable top of the generated Rift and arena floors, as a fraction of the model's height
const RIFT_FLOOR_TOP = 0.934, ARENA_FLOOR_TOP = 0.05, ARENA_FLOOR_INNER = 0.9; // measured on the generated meshes
const arenaParts = { gas: null };
// Rift sanctum: an obsidian disc floating in the void, with rune rings and crystal pylons
const riftParts = {};
function buildRift() {
  const R = CFG.rift, grid = new Grid(6), rp = [], rng = mulberry32(777);
  // generated sanctum: an obsidian platform, six pylons and a ring of drifting shards (colliders stay the same)
  const PYLON = hasWM('rift_pylon') ? 'rift_pylon' : 'black_spire', riftModels = hasWM('rift_floor') && hasWM(PYLON);
  if (riftModels) { const fb = WORLD_MODEL_BOX.rift_floor, fs = 2 * (R.r + 2.5) / Math.max(fb[0], fb[1]);
    WorldModels.place(riftGroup, 'rift_floor', [{ x: RC.x, z: RC.z, y: -RIFT_FLOOR_TOP * fs, s: fs }], { shadow: false, glow: 0xff5d8f, glowK: 0.12, far: 400 });
    WorldModels.place(riftGroup, PYLON, [0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * Math.PI * 2 + 0.52; return { x: RC.x + Math.sin(a) * 13, z: RC.z + Math.cos(a) * 13, ry: a + Math.PI, s: 4.6 }; }), { glow: 0xb06bff, glowK: 0.18, far: 400 });
    if (hasWM('rift_shard')) WorldModels.place(riftGroup, 'rift_shard', Array.from({ length: 22 }, () => { const a = rng() * Math.PI * 2, r = R.r + 6 + rng() * 14; return { x: RC.x + Math.sin(a) * r, z: RC.z + Math.cos(a) * r, y: -3 + rng() * 7, ry: rng() * 6, rx: (rng() - 0.5) * 0.8, s: 2 + rng() * 3.5 }; }), { shadow: false, glow: 0xff5d8f, glowK: 0.3, far: 400 });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.52; grid.add({ x: RC.x + Math.sin(a) * 13, z: RC.z + Math.cos(a) * 13, r: 1.15 }); }
  }
  // floor: concentric tile rings
  if (!riftModels) for (let ring = 0; ring < 6; ring++) {
    const r0 = ring * 4, n = Math.max(6, ring * 10);
    for (let i = 0; i < n; i++) {
      const a = (i + 0.5) / n * Math.PI * 2, rr = r0 + 2, c = (i + ring) % 2 ? 0x2a2140 : 0x231b37;
      rp.push(part(GEO.box, c, [RC.x + Math.sin(a) * rr, -0.06 - rng() * 0.04, RC.z + Math.cos(a) * rr], [0, a, 0], [Math.max(2.2, rr * 6.28 / n * 1.04), 0.14, 3.9]));
    }
  }
  if (!riftModels) rp.push(part(GEO.cyl8, 0x15101f, [RC.x, -0.9, RC.z], null, [R.r + 2.5, 1.6, R.r + 2.5]));
  // jagged rim
  if (!riftModels) for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2, r = R.r + 1.2 + rng() * 0.8; rp.push(part(GEO.ico0, i % 3 ? 0x2a1f3d : 0x3b2a55, [RC.x + Math.sin(a) * r, 0.4 + rng() * 0.6, RC.z + Math.cos(a) * r], [rng(), a, rng()], [0.9 + rng() * 0.6, 1.2 + rng() * 1.6, 0.9])); }
  // pylons (obstacles)
  if (!riftModels) for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.52, x = RC.x + Math.sin(a) * 13, z = RC.z + Math.cos(a) * 13;
    rp.push(part(GEO.cyl8, 0x1f1830, [x, 0.3, z], null, [1.3, 0.6, 1.3]));
    rp.push(part(GEO.ico0, 0x3b2a55, [x, 1.7, z], [0, a, 0], [0.75, 2.4, 0.75]));
    grid.add({ x, z, r: 1.15 });
  }
  // floating shards around the edge
  if (!riftModels) for (let i = 0; i < 26; i++) { const a = rng() * Math.PI * 2, r = R.r + 5 + rng() * 14; rp.push(part(GEO.ico0, [0xff5d8f, 0xa36bff, 0x5b3aa0][i % 3], [RC.x + Math.sin(a) * r, -2 + rng() * 7, RC.z + Math.cos(a) * r], [rng() * 3, rng() * 3, 0], [0.6 + rng() * 1.4, 1.2 + rng() * 2.4, 0.6 + rng()])); }
  if (!riftModels) { worldArt.rift(rp, RC, R.r);
    const riftMasonry = new THREE.Mesh(mergeParts(rp), worldArt.material); riftMasonry.receiveShadow = true; riftGroup.add(riftMasonry); }
  // glowing rune rings + pylon crystals
  const glow = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
  riftParts.rings = [];
  [[4.5, 5.0, 0xff5d8f, 0.55], [11, 11.35, 0xa36bff, 0.4], [R.r - 0.6, R.r - 0.2, 0xff5d8f, 0.5]].forEach(([a, b, c, o]) => { const m = new THREE.Mesh(new THREE.RingGeometry(a, b, 72).rotateX(-Math.PI / 2), glow(c, o)); m.position.set(RC.x, 0.04, RC.z); riftGroup.add(m); riftParts.rings.push(m); });
  const rune = new THREE.Mesh(new THREE.CircleGeometry(4.4, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: swirlTex(), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  rune.position.set(RC.x, 0.03, RC.z); riftGroup.add(rune); riftParts.rune = rune;
  const cim = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.5, 0), new THREE.MeshBasicMaterial({ color: 0xff7ab8 }), 6);
  cim.instanceMatrix.setUsage(THREE.DynamicDrawUsage); cim.frustumCulled = false; riftGroup.add(cim); riftParts.cim = cim;
  G.riftObstacles = grid;
}
function updateRiftProps(t) {
  if (!riftGroup.visible) return;
  const r = G.rift, k = r && r.phase === 'fight' ? clamp(r.t / r.tMax, 0, 1) : 1;
  riftParts.rings.forEach((m, i) => { m.rotation.y = t * (i % 2 ? -0.3 : 0.25); m.material.opacity = (i === 2 ? 0.25 + (1 - k) * 0.5 : 0.4) + Math.sin(t * 3 + i) * 0.1; });
  riftParts.rune.rotation.y = t * 0.4;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.52; _e.set(0, t * 1.4 + i, 0); _q.setFromEuler(_e); _m4.compose(_v3.set(RC.x + Math.sin(a) * 13, 3.6 + Math.sin(t * 2 + i) * 0.25, RC.z + Math.cos(a) * 13), _q, _s3.set(1, 1.6, 1)); riftParts.cim.setMatrixAt(i, _m4); }
  riftParts.cim.instanceMatrix.needsUpdate = true;
}
function enterRiftView(on) {
  hubGroup.visible = !on; riftGroup.visible = on;
  if (on) { scene.fog.color.set(0x1a1030); scene.fog.near = 30; scene.fog.far = 90; paintSky(new THREE.Color(0x0d0718), new THREE.Color(0x3b1f5a)); }
  else { scene.fog.near = 50; scene.fog.far = Q.lowTier ? 95 : 140; }
}
function buildArena() {
  const A = CFG.arena, P2 = PALETTE, grid = new Grid(6), h = A.half;
  arenaGroup.position.set(0, 0, 0);
  // floor tiles
  const fParts = [];
  const tile = 3, arenaModels = hasWM('arena_floor');
  if (arenaModels) {
    // generated colosseum: a paved floor, wall sections along each side, towers at the corners, crates as cover
    const fb = WORLD_MODEL_BOX.arena_floor, fs = (2 * h + 2.4) / (Math.min(fb[0], fb[1]) * ARENA_FLOOR_INNER); // the walled pit: its inner sand fits the arena
    WorldModels.place(arenaGroup, 'arena_floor', [{ x: AC.x, z: AC.z, y: -ARENA_FLOOR_TOP * fs * 0.5, s: 1, sx: fs, sz: fs, sy: fs * 0.5 }], { shadow: false, far: 400 }); // walls at half height keep the edges in view
    const wb = WORLD_MODEL_BOX.arena_wall || [1, 1], segs = Math.max(2, Math.round((2 * h + 2.4) / 9)), seg = (2 * h + 2.4) / segs, ws = seg / wb[0], walls = [];
    for (const sd of [-1, 1]) for (let i = 0; i < segs; i++) { const u = -h - 1.2 + (i + 0.5) * seg;
      walls.push({ x: AC.x + u, z: AC.z + sd * (h + 0.6 + wb[1] * ws * 0.3), ry: sd > 0 ? Math.PI : 0, s: ws }, { x: AC.x + sd * (h + 0.6 + wb[1] * ws * 0.3), z: AC.z + u, ry: -sd * Math.PI / 2, s: ws }); }
    if (hasWM('arena_wall')) WorldModels.place(arenaGroup, 'arena_wall', walls, { far: 400 });
    if (hasWM('arena_tower')) WorldModels.place(arenaGroup, 'arena_tower', [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => ({ x: AC.x + sx * (h + 1.5), z: AC.z + sz * (h + 1.5), ry: Math.atan2(-sx, -sz), s: 8 })), { far: 400 });
  }
  if (!arenaModels) for (let x = -h; x < h; x += tile) for (let z = -h; z < h; z += tile) {
    const c = ((x + z) / tile) % 2 === 0 ? P2.arenaA : P2.arenaB;
    fParts.push(part(GEO.box, c, [AC.x + x + tile / 2, -0.05, AC.z + z + tile / 2], null, [tile, 0.1, tile]));
  }
  fParts.push(part(GEO.box, P2.arenaRim, [AC.x, -0.2, AC.z], null, [h * 2 + 30, 0.2, h * 2 + 30]));
  // walls
  if (!arenaModels) for (const s of [-1, 1]) {
    fParts.push(part(GEO.box, P2.arenaWall, [AC.x + s * (h + 0.6), 0.8, AC.z], null, [1.2, 1.6, h * 2 + 2.4]));
    fParts.push(part(GEO.box, P2.arenaWall, [AC.x, 0.8, AC.z + s * (h + 0.6)], null, [h * 2 + 2.4, 1.6, 1.2]));
  }
  // banners / pillars at corners
  if (!arenaModels) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    fParts.push(part(GEO.box, 0x584874, [AC.x + sx * (h + 0.6), 2.2, AC.z + sz * (h + 0.6)], null, [1.6, 4.4, 1.6]));
    fParts.push(part(GEO.cone4, 0xffc94a, [AC.x + sx * (h + 0.6), 5.0, AC.z + sz * (h + 0.6)], [0, Math.PI / 4, 0], [1.3, 1.2, 1.3]));
  }
  // crates: mirrored layout
  const quad = [[6, 6], [8, 6], [6, 8], [16, 4], [16, 6], [4, 16], [6, 16], [14, 14], [19, 10], [10, 19], [21, 2], [2, 21]];
  const crates = [];
  for (const [qx, qz] of quad) for (const sx of [-1, 1]) for (const sz of [-1, 1]) crates.push([AC.x + qx * sx, AC.z + qz * sz]);
  const CRATE = hasWM('arena_crate') ? 'arena_crate' : 'crate';
  if (hasWM(CRATE)) WorldModels.place(arenaGroup, CRATE, crates.map(([x, z]) => ({ x, z, ry: hashf(x, z) > 0.5 ? 0 : Math.PI / 2, s: 1.75 })), { far: 400 });
  for (const [x, z] of crates) {
    if (hasWM(CRATE)) { grid.add({ x, z, r: 1.15 }); continue; }
    fParts.push(part(GEO.box, P2.crate, [x, 0.8, z], null, [1.9, 1.6, 1.9]));
    fParts.push(part(GEO.box, P2.crateBand, [x, 0.8, z], null, [1.96, 0.25, 1.96]));
    fParts.push(part(GEO.box, P2.crateBand, [x, 1.62, z], null, [1.6, 0.06, 1.6]));
    grid.add({ x, z, r: 1.15 });
  }
  // grass tufts outside walls
  const rng = mulberry32(99), tuftsA = [];
  for (let i = 0; i < 40; i++) {
    const a = rng() * Math.PI * 2, d = h + 4 + rng() * 10;
    if (hasWM('bush_a')) { tuftsA.push({ x: AC.x + Math.sin(a) * d, z: AC.z + Math.cos(a) * d, ry: rng() * 6, s: 1.2 + rng() }); continue; }
    fParts.push(part(GEO.dodec, 0x6faa4f, [AC.x + Math.sin(a) * d, 0.3, AC.z + Math.cos(a) * d], null, [1 + rng(), 0.7 + rng(), 1 + rng()]));
  }
  WorldModels.place(arenaGroup, 'bush_a', tuftsA, { far: 400 });
  if (!arenaModels) worldArt.arena(fParts, AC, h);
  const arenaMasonry = new THREE.Mesh(mergeParts(fParts), worldArt.material); arenaMasonry.receiveShadow = true; arenaMasonry.castShadow = true; arenaGroup.add(arenaMasonry);
  const gas = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 7, 64, 1, true), new THREE.MeshBasicMaterial({ color: P2.gas, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }));
  gas.position.set(AC.x, 3.5, AC.z); arenaGroup.add(gas); arenaParts.gas = gas;
  const gasFloor = new THREE.Mesh(new THREE.RingGeometry(1, 3, 64, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: P2.gas, transparent: true, opacity: 0.28, depthWrite: false }));
  gasFloor.position.set(AC.x, 0.06, AC.z); arenaGroup.add(gasFloor); arenaParts.gasFloor = gasFloor;
  const cubeIM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshBasicMaterial({ color: 0x6cff8a }), 16);
  cubeIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); cubeIM.frustumCulled = false; arenaGroup.add(cubeIM); arenaParts.cubeIM = cubeIM;
  G.arenaObstacles = grid;
}

// sky dome
(function buildSky() {
  const g = new THREE.SphereGeometry(200, 16, 10);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  const top = new THREE.Color(PALETTE.skyTop), hor = new THREE.Color(PALETTE.skyHorizon);
  for (let i = 0; i < pos.count; i++) { const k = clamp(pos.getY(i) / 200, 0, 1); _col.copy(hor).lerp(top, Math.pow(k, 0.6)); col[i * 3] = _col.r; col[i * 3 + 1] = _col.g; col[i * 3 + 2] = _col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const sky = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -1; sky.name = 'sky'; scene.add(sky);
  scene.userData.sky = sky;
})();

