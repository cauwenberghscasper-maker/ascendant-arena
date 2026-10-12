// --- dungeon view: halls built on entry from the area's palette, every geometry/material disposed on exit
const dungeonParts = { doors: [], chest: null, lid: null, portals: [], flame: null, t: 0 };
function dungeonPalette(zn) {
  const g = Array.isArray(zn.ground) ? zn.ground : null, base = new THREE.Color(g ? g[0] : (zn.mm || '#6a6a6a'));
  const fog = new THREE.Color(zn.fog || 0x333333);
  return { a: base.clone().multiplyScalar(0.62), b: (g ? new THREE.Color(g[1]) : base.clone()).multiplyScalar(0.5), wall: fog.clone().lerp(new THREE.Color(0x2a2430), 0.55),
    trim: fog.clone().lerp(new THREE.Color(0x14101c), 0.75), fog: fog.clone().multiplyScalar(0.35) };
}
function buildDungeonView(D) {
  disposeDungeonView();
  const zn = CFG.world.zones[D.zone], pal = dungeonPalette(zn), rng = mulberry32(strSeed(D.id) ^ 0x9e37), parts = [], torches = [];
  // floor: checkered 3 m tiles over halls and corridors, a dark plinth underneath
  const floor = (x0, x1, z0, z1) => { for (let x = x0; x < x1 - 0.01; x += 3) for (let z = z0; z < z1 - 0.01; z += 3) { const w = Math.min(3, x1 - x), d = Math.min(3, z1 - z), c = (Math.floor((x - DC.x) / 3) + Math.floor((z - DC.z) / 3)) & 1 ? pal.a : pal.b;
    parts.push(part(GEO.box, c, [x + w / 2, -0.06 - rng() * 0.03, z + d / 2], null, [w * 0.98, 0.12, d * 0.98])); } };
  for (const m of D.rooms) { floor(m.x0, m.x1, m.z0, m.z1); parts.push(part(GEO.box, pal.trim, [m.x, -0.4, m.z], null, [m.x1 - m.x0 + 2, 0.6, m.z1 - m.z0 + 2])); }
  for (const c of D.cors) { floor(c.x0, c.x1, c.z0, c.z1); parts.push(part(GEO.box, pal.trim, [(c.x0 + c.x1) / 2, -0.4, (c.z0 + c.z1) / 2], null, [c.x1 - c.x0 + 2, 0.6, c.z1 - c.z0 + 2])); }
  // walls: one box per segment with a cap, torches every few metres on the long ones
  for (const w of D.walls) {
    const len = Math.hypot(w.x1 - w.x0, w.z1 - w.z0), a = Math.atan2(w.x1 - w.x0, w.z1 - w.z0), mx = (w.x0 + w.x1) / 2, mz = (w.z0 + w.z1) / 2;
    parts.push(part(GEO.box, pal.wall, [mx, 1.6, mz], [0, a, 0], [1, 3.2, len + 1]));
    parts.push(part(GEO.box, pal.trim, [mx, 3.3, mz], [0, a, 0], [1.25, 0.25, len + 1.2]));
    if (len > 7) for (let k = 1, n = Math.floor(len / 7); k <= n; k++) torches.push([lerp(w.x0, w.x1, k / (n + 1)), lerp(w.z0, w.z1, k / (n + 1))]);
  }
  // pillars in the boss hall
  const B = D.rooms[3]; for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(part(GEO.cyl8, pal.trim, [B.x + sx * (B.h - 3), 1.8, B.z + sz * (B.h - 3)], null, [0.9, 3.6, 0.9]));
  for (const [x, z] of torches) parts.push(part(GEO.box, 0x3a2a1e, [x, 2.1, z], null, [0.25, 0.6, 0.25]));
  const masonry = new THREE.Mesh(mergeParts(parts), matVC); masonry.receiveShadow = true; dungeonGroup.add(masonry);
  // torch flames share one additive mesh so the flicker is a single opacity change
  const fp = torches.map(([x, z]) => part(GEO.ico0, 0xffa040, [x, 2.6, z], null, [0.22, 0.34, 0.22]));
  if (fp.length) { dungeonParts.flame = new THREE.Mesh(mergeParts(fp), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); dungeonGroup.add(dungeonParts.flame); }
  // doors: iron portcullis per hall, lowered into the floor once the hall is cleared
  const doorGeo = mergeParts([part(GEO.box, 0x4a4652, [0, 0, 0], null, [1, 1, 1])]);
  dungeonParts.doors = D.doors.map((d) => {
    const m = new THREE.Mesh(doorGeo, matVC); m.position.set(d.x, 1.5, d.z); m.scale.set(d.ax === 'x' ? d.w * 2 + 0.4 : 0.5, 3, d.ax === 'x' ? 0.5 : d.w * 2 + 0.4);
    dungeonGroup.add(m); return m;
  });
  // the reward chest and two exit portals (the second opens beside the chest)
  const chest = new THREE.Group(), body = new THREE.Mesh(mergeParts([part(GEO.box, 0x7a4a24, [0, 0.45, 0], null, [1.6, 0.9, 1.05]), part(GEO.box, 0xffc94a, [0, 0.5, 0.54], null, [0.3, 0.35, 0.06])]), matVC);
  const lid = new THREE.Mesh(mergeParts([part(GEO.box, 0x8a5a2c, [0, 0.15, 0.52], null, [1.66, 0.3, 1.1]), part(GEO.box, 0xffc94a, [0, 0.16, 0.52], null, [1.7, 0.08, 0.2])]), matVC);
  lid.position.set(0, 0.9, -0.52); chest.add(body, lid); // lid pivots on its back edge
  chest.position.set(D.chest.x, 0, D.chest.z); chest.visible = false; dungeonGroup.add(chest);
  dungeonParts.chest = chest; dungeonParts.lid = lid;
  dungeonParts.portals = [D.exit, D.exit2].map((q, i) => {
    const g = new THREE.Group(), ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.4, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: swirlTex(), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.position.y = 0.05; disc.position.y = 0.04; g.add(ring, disc); g.position.set(q.x, 0, q.z); g.visible = i === 0; dungeonGroup.add(g); return g;
  });
}
function disposeDungeonView() {
  // matVC is shared with the hub, and swirlTex is cached: keep both
  const geos = new Set(), mats = new Set();
  dungeonGroup.traverse((o) => { if (o.geometry) geos.add(o.geometry); if (o.material && o.material !== matVC) mats.add(o.material); });
  geos.forEach((g) => g.dispose()); mats.forEach((m) => m.dispose());
  dungeonGroup.clear(); dungeonParts.doors = []; dungeonParts.portals = []; dungeonParts.chest = dungeonParts.lid = dungeonParts.flame = null;
}
function enterDungeonView(on) {
  hubGroup.visible = !on; riftGroup.visible = false; dungeonGroup.visible = on;
  if (on && G.dungeon) {
    buildDungeonView(G.dungeon);
    const pal = dungeonPalette(CFG.world.zones[G.dungeon.zone]);
    scene.fog.color.copy(pal.fog); scene.fog.near = 22; scene.fog.far = 75; paintSky(pal.fog.clone().multiplyScalar(0.4), pal.fog);
  } else { disposeDungeonView(); scene.fog.near = 50; scene.fog.far = Q.lowTier ? 95 : 140; }
}
function updateDungeonView(dt) {
  const D = G.dungeon; if (!D || !dungeonGroup.visible) return;
  hubGroup.visible = false; // the showcase restores the hub on close; the dungeon keeps it hidden
  const t = (dungeonParts.t += dt);
  if (dungeonParts.flame) dungeonParts.flame.material.opacity = 0.75 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.08;
  D.doors.forEach((d, i) => { const m = dungeonParts.doors[i]; if (m && d.open && m.position.y > -1.6) m.position.y = Math.max(-1.6, m.position.y - dt * 2.2); });
  if (dungeonParts.chest) { dungeonParts.chest.visible = D.bossDead; if (D.chestOpen) dungeonParts.lid.rotation.x = Math.max(-1.9, dungeonParts.lid.rotation.x - dt * 3); }
  dungeonParts.portals.forEach((g, i) => { g.visible = i === 0 || D.bossDead; g.rotation.y = t * (i ? -0.8 : 0.8); });
}
