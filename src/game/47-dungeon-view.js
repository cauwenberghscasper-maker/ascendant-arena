// dungeon floor: worn flagstones drawn in world space over the area colours (cracks, grout, damp moss, scuffed tops)
const matDungeonFloor = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.02 });
matDungeonFloor.onBeforeCompile = (sh) => {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vDW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvDW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vDW;
float dh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 dh2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float dn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(dh(i), dh(i + vec2(1, 0)), f.x), mix(dh(i + vec2(0, 1)), dh(i + vec2(1, 1)), f.x), f.y); }
vec3 dvor(vec2 p) { vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0; vec2 id = vec2(0.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 o = g + dh2(i + g) * 0.8 - f; float d = dot(o, o); if (d < d1) { d2 = d1; d1 = d; id = i + g; } else if (d < d2) d2 = d; }
  return vec3(sqrt(d2) - sqrt(d1), dh(id), sqrt(d1)); }`).replace('#include <color_fragment>', `#include <color_fragment>
{ if (vDW.y > -0.2) {
  vec2 w = vDW.xz * 0.62; vec3 v = dvor(w);
  float grout = 1.0 - smoothstep(0.02, 0.07, v.x), top = smoothstep(0.06, 0.32, v.x);
  vec3 base = mix(vec3(dot(diffuseColor.rgb, vec3(.3, .55, .15))), diffuseColor.rgb, 0.4) * vec3(1.0, 0.97, 0.92); // weathered stone tinted by the area
  vec3 c = base * (0.74 + v.y * 0.34) * (0.9 + dn(vDW.xz * 2.3) * 0.2);
  c *= 0.92 + top * 0.12;                                                   // rounded stone tops catch the light
  float moss = smoothstep(0.62, 0.8, dn(vDW.xz * 0.35 + 3.0)) * grout;
  c = mix(c, c * 0.32, grout); c = mix(c, vec3(0.12, 0.2, 0.09), moss * 0.6);
  c *= 1.0 - smoothstep(0.86, 0.98, dn(vDW.xz * 1.7 + 9.0)) * 0.25 * (1.0 - grout); // scuffs and stains
  diffuseColor.rgb = c; } }`).replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.45, step(vDW.y, 0.05) * smoothstep(0.7, 0.9, dn(vDW.xz * 0.5 + 1.0)) * 0.6); // damp patches shine');
};
matDungeonFloor.customProgramCacheKey = () => 'dungeonFloor1';
// --- dungeon view: halls built on entry from the area's palette, every geometry/material disposed on exit
const dungeonParts = { portals: [], flame: null, t: 0, sets: [], lights: [], doorItems: [], doorSet: null, chestItems: [], chestSets: [] };
function dungeonPalette(zn) {
  const g = Array.isArray(zn.ground) ? zn.ground : null, base = new THREE.Color(g ? g[0] : (zn.mm || '#6a6a6a'));
  const fog = new THREE.Color(zn.fog || 0x333333);
  return { a: base.clone().multiplyScalar(0.62), b: (g ? new THREE.Color(g[1]) : base.clone()).multiplyScalar(0.5), wall: fog.clone().lerp(new THREE.Color(0x2a2430), 0.55),
    trim: fog.clone().lerp(new THREE.Color(0x14101c), 0.75), fog: fog.clone().multiplyScalar(0.35) };
}
// one dressing prop per biome: [world model, height in m]
const DUNGEON_THEME_PROP = [['delve_sarcophagus', 1.3], ['delve_icecoffin', 1.4], ['delve_slagcart', 1.6], ['delve_bookshelf', 3.0], ['delve_coralshrine', 3.0], ['delve_meteor', 1.8]];
function buildDungeonView(D) {
  disposeDungeonView();
  const zn = CFG.world.zones[D.zone], pal = dungeonPalette(zn), rng = mulberry32(strSeed(D.id) ^ 0x9e37), parts = [];
  // floor: checkered 3 m tiles over halls and corridors, a dark plinth underneath
  const floor = (x0, x1, z0, z1) => { for (let x = x0; x < x1 - 0.01; x += 3) for (let z = z0; z < z1 - 0.01; z += 3) { const w = Math.min(3, x1 - x), d = Math.min(3, z1 - z), c = (Math.floor((x - DC.x) / 3) + Math.floor((z - DC.z) / 3)) & 1 ? pal.a : pal.b;
    parts.push(part(GEO.box, c, [x + w / 2, -0.06 - rng() * 0.03, z + d / 2], null, [w * 0.98, 0.12, d * 0.98])); } };
  for (const m of D.rooms) { floor(m.x0, m.x1, m.z0, m.z1); parts.push(part(GEO.box, pal.trim, [m.x, -0.4, m.z], null, [m.x1 - m.x0 + 2, 0.6, m.z1 - m.z0 + 2])); }
  for (const c of D.cors) { floor(c.x0, c.x1, c.z0, c.z1); parts.push(part(GEO.box, pal.trim, [(c.x0 + c.x1) / 2, -0.4, (c.z0 + c.z1) / 2], null, [c.x1 - c.x0 + 2, 0.6, c.z1 - c.z0 + 2])); }
  const masonry = new THREE.Mesh(mergeParts(parts), matDungeonFloor); masonry.receiveShadow = true; dungeonGroup.add(masonry);
  // walls: generated stone wall sections (each with its own sconce torch), tiled along every wall segment
  const walls = [];
  for (const w of D.walls) {
    const len = Math.hypot(w.x1 - w.x0, w.z1 - w.z0) + 1, a = Math.atan2(w.x1 - w.x0, w.z1 - w.z0), S = 3.4, tile = 2.24 * S, n = Math.max(1, Math.round(len / tile)), sx = len / (n * tile);
    for (let k = 0; k < n; k++) { const f = (k + 0.5) / n - 0.5;
      walls.push({ x: (w.x0 + w.x1) / 2 + Math.sin(a) * f * len, z: (w.z0 + w.z1) / 2 + Math.cos(a) * f * len, ry: a + Math.PI / 2 + (rng() < 0.5 ? Math.PI : 0), s: S, sx, sz: 0.75 }); }
  }
  dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'dwall', walls, { bright: 1.25 }));
  // the boss hall: four chained pillars and braziers; every other hall gets braziers and some clutter by the walls
  const B = D.rooms.at(-1), braz = [], clutter = [], pillars = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) pillars.push({ x: B.x + sx * (B.h - 3), z: B.z + sz * (B.h - 3), ry: rng() * 6.28, s: 4.2 });
  D.rooms.forEach((m, i) => {
    const boss = i === D.rooms.length - 1, ins = 1.6;
    const corners = [[m.x0 + ins, m.z0 + ins], [m.x1 - ins, m.z1 - ins], [m.x0 + ins, m.z1 - ins], [m.x1 - ins, m.z0 + ins]];
    corners.slice(0, boss ? 4 : 2).forEach(([x, z]) => braz.push({ x, z, ry: rng() * 6.28, s: 1.7 }));
    if (!boss && i > 0) { const [x, z] = corners[2 + (i % 2)]; clutter.push({ x, z, ry: rng() * 6.28, s: 1.5 }); }
    // the big party-dungeon halls: braziers at the quarter points of every wall (doors sit at the middle, so they stay free)
    if (D.delve && (m.hx >= 15 || boss)) for (const f of [-0.5, 0.5]) braz.push({ x: m.x + f * m.hx, z: m.z1 - ins, ry: rng() * 6.28, s: 1.7 }, { x: m.x + f * m.hx, z: m.z0 + ins, ry: rng() * 6.28, s: 1.7 },
      { x: m.x0 + ins, z: m.z + f * m.hz, ry: rng() * 6.28, s: 1.7 }, { x: m.x1 - ins, z: m.z + f * m.hz, ry: rng() * 6.28, s: 1.7 });
  });
  dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'pillar', pillars), WorldModels.place(dungeonGroup, 'brazier', braz), WorldModels.place(dungeonGroup, 'clutter', clutter));
  // the biome's own dressing along the walls of every hall but the first and the boss's (TRELLIS.2 models):
  // root-split sarcophagi, glacier coffins, slag carts, toppled bookshelves, coral shrines, fallen stars
  const [themeId, themeS] = DUNGEON_THEME_PROP[areaBiome(D.zone)] || DUNGEON_THEME_PROP[0], theme = [];
  D.rooms.forEach((m, i) => {
    if (i === 0 || i === D.rooms.length - 1) return;
    const hx = m.hx || m.h, hz = m.hz || m.h, ins = 1.6 + themeS * 0.35, spots = [[m.x0 + ins, m.z + 0.78 * hz], [m.x1 - ins, m.z - 0.78 * hz]];
    if (D.delve && hx >= 15) spots.push([m.x - 0.78 * hx, m.z0 + ins], [m.x + 0.78 * hx, m.z1 - ins]);
    for (const [x, z] of spots) if (rng() < 0.85) theme.push({ x, z, ry: Math.atan2(m.x - x, m.z - z) + (rng() - 0.5) * 0.5, s: themeS * (0.9 + rng() * 0.2) });
  });
  if (theme.length) dungeonParts.sets.push(WorldModels.place(dungeonGroup, themeId, theme, { bright: 1.15 }));
  // brazier flames share one additive mesh so the flicker is a single opacity change
  const fp = braz.map((b) => part(GEO.ico0, 0xffa040, [b.x, b.s * 0.98, b.z], null, [0.32, 0.5, 0.32]));
  if (fp.length) { dungeonParts.flame = new THREE.Mesh(mergeParts(fp), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); dungeonGroup.add(dungeonParts.flame); }
  // brazier light: a few warm point lights in the biggest halls (high quality only)
  if (!Q.lowTier) for (const b of braz.filter((_, k) => k % 3 === 0).slice(0, 4)) { const L = new THREE.PointLight(0xffa050, 18, 14, 1.6); L.position.set(b.x, 2.4, b.z); dungeonGroup.add(L); dungeonParts.lights.push(L); }
  // doors: an iron portcullis in a stone frame per hall, lowered into the floor once the hall is cleared
  dungeonParts.doorItems = D.doors.map((d) => { const W2 = d.w * 2 + 0.4, S = 3.2; return { x: d.x, z: d.z, y: 0, ry: d.ax === 'x' ? 0 : Math.PI / 2, s: S, sx: W2 / (1.06 * S), sz: 1.4 }; });
  dungeonParts.doorSet = WorldModels.place(dungeonGroup, 'portcullis', dungeonParts.doorItems);
  dungeonParts.sets.push(dungeonParts.doorSet);
  // the reward chest: closed until you open it, then the open one full of gold
  const cr = Math.atan2(D.exit.x - D.chest.x, D.exit.z - D.chest.z);
  dungeonParts.chestItems = [{ x: D.chest.x, z: D.chest.z, ry: cr, s: 1.25, hidden: true }, { x: D.chest.x, z: D.chest.z, ry: cr, s: 1.7, hidden: true }];
  dungeonParts.chestSets = [WorldModels.place(dungeonGroup, 'chest', [dungeonParts.chestItems[0]]), WorldModels.place(dungeonGroup, 'chest_open', [dungeonParts.chestItems[1]], { glow: 0xffc94a, glowK: 0.25 })];
  dungeonParts.sets.push(...dungeonParts.chestSets);
  dungeonParts.portals = [D.exit, D.exit2].map((q, i) => {
    const g = new THREE.Group(), ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.4, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: swirlTex(), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.position.y = 0.05; disc.position.y = 0.04; g.add(ring, disc); g.position.set(q.x, 0, q.z); g.visible = i === 0; dungeonGroup.add(g); return g;
  });
  if (D.delve) buildDelveProps(D); // party-dungeon event rooms (47b-delve-view.js)
}
function disposeDungeonView() {
  // generated models first: their geometry and textures belong to the asset cache and must survive
  for (const h of dungeonParts.sets) WorldModels.dispose(h);
  // matVC is shared with the hub, and swirlTex is cached: keep both
  const geos = new Set(), mats = new Set();
  dungeonGroup.traverse((o) => { if (o.geometry) geos.add(o.geometry); if (o.material && o.material !== matVC) mats.add(o.material); });
  geos.forEach((g) => g.dispose()); mats.forEach((m) => m.dispose());
  dungeonGroup.clear(); dungeonParts.sets = []; dungeonParts.lights = []; dungeonParts.portals = []; dungeonParts.flame = null; dungeonParts.doorSet = null; dungeonParts.chestSets = []; dungeonParts.doorItems = []; dungeonParts.chestItems = [];
}
function enterDungeonView(on) {
  hubGroup.visible = !on; riftGroup.visible = false; dungeonGroup.visible = on;
  if (on && G.dungeon) {
    buildDungeonView(G.dungeon);
    const pal = dungeonPalette(CFG.world.zones[G.dungeon.zone]);
    scene.fog.color.copy(pal.fog); scene.fog.near = 70; scene.fog.far = 150; // starts past the camera (~35 m up): only far halls fade, the screen stays clear paintSky(pal.fog.clone().multiplyScalar(0.4), pal.fog);
  } else { disposeDungeonView(); scene.fog.near = 50; scene.fog.far = Q.lowTier ? 95 : 140; }
}
function updateDungeonView(dt) {
  const D = G.dungeon; if (!D || !dungeonGroup.visible) return;
  hubGroup.visible = false; // the showcase restores the hub on close; the dungeon keeps it hidden
  const t = (dungeonParts.t += dt);
  if (dungeonParts.flame) dungeonParts.flame.material.opacity = 0.75 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.08;
  // portcullises sink into the floor once their hall is cleared
  D.doors.forEach((d, i) => { const it = dungeonParts.doorItems[i]; if (it && d.open && it.y > -3.3) { it.y = Math.max(-3.3, it.y - dt * 2.6); if (dungeonParts.doorSet) dungeonParts.doorSet.dirty = true; } });
  // the chest appears with the boss's defeat; opening it swaps in the open chest full of gold
  const [cc, co] = dungeonParts.chestItems;
  if (cc) { const hc = !D.bossDead || !!D.chestOpen, ho = !D.chestOpen;
    if (cc.hidden !== hc || co.hidden !== ho) { cc.hidden = hc; co.hidden = ho; for (const h of dungeonParts.chestSets) h.dirty = true; if (D.chestOpen) burst(co.x, 1.2, co.z, 24, 0xffd34a, 4, 0.9, 0.5, 10, 3); } }
  if (D.delve) updateDelveView(dt, t);
  WorldModels.update();
  for (const L of dungeonParts.lights) L.intensity = 16 + Math.sin(t * 11 + L.position.x) * 2.5;
  dungeonParts.portals.forEach((g, i) => { g.visible = i === 0 || D.bossDead; g.rotation.y = t * (i ? -0.8 : 0.8); });
}
