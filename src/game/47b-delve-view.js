// --- party-dungeon view: event-room set pieces on top of the hall builder (47-dungeon-view.js). Generated models
// (delve_altar, delve_moonwell, delve_echo, delve_hoard, delve_throne) plus existing ones (chest, pillar); code geometry
// here is only VFX: rune rings, glows, the moonwell shimmer and the pressure-plate floor sigils. Dark halls pull the fog in.
const delveParts = { plates: [], caches: [], cacheSets: [], mimic: null, altar: null, well: null, glows: [] };
function buildDelveProps(D) {
  const X = D.delve, add = (o) => { dungeonGroup.add(o); return o; }, tint = BIOMES[X.def.biome].coreColor;
  const glow = (col, op) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
  Object.assign(delveParts, { plates: [], caches: [], cacheSets: [], mimic: null, altar: null, well: null, glows: [] });
  if (D.props.length) dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'pillar', D.props.map((q, k) => ({ x: q.x, z: q.z, ry: k * 1.3, s: 3.4 }))));
  const echo = [];
  for (const m of D.rooms) {
    if (!m.event) continue;
    // every event room has a cache chest at its centre, shown once the event pays out
    delveParts.caches.push({ room: m.i, items: [{ x: m.x, z: m.z + (m.event === 'altar' || m.event === 'fountain' ? 3 : 0), ry: Math.PI, s: 1.2, hidden: true }, { x: m.x, z: m.z + (m.event === 'altar' || m.event === 'fountain' ? 3 : 0), ry: Math.PI, s: 1.5, hidden: true }] });
    const ring = add(new THREE.Mesh(new THREE.RingGeometry(m.h * 0.55, m.h * 0.62, 48).rotateX(-Math.PI / 2), glow(tint, 0.18))); ring.position.set(m.x, 0.03, m.z); delveParts.glows.push(ring);
    if (m.event === 'altar') {
      const g = add(new THREE.Group()); g.position.set(m.x, 0, m.z);
      // the generated altar (delve_altar) plus a rune circle and a glow on its orb
      dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'delve_altar', [{ x: m.x, z: m.z, ry: 0.4, s: 2.6 }], { glow: 0x9b3dff, glowK: 0.18 }));
      const rune = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 6).rotateX(-Math.PI / 2), glow(0x9b3dff, 0.75)); rune.position.y = 0.04;
      const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), glow(0xc77dff, 0.35)); orb.scale.setScalar(0.55); orb.position.y = 2.2;
      g.add(rune, orb); delveParts.altar = { g, rune, orb };
    }
    if (m.event === 'fountain') {
      const g = add(new THREE.Group()); g.position.set(m.x, 0, m.z);
      // the generated moonwell (delve_moonwell, 2 m tall) with a shimmer on its water
      dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'delve_moonwell', [{ x: m.x, z: m.z, ry: 0, s: 2 }], { glow: 0x9fe8ff, glowK: 0.15 }));
      const water = new THREE.Mesh(new THREE.CircleGeometry(1.15, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: swirlTex(), color: 0x9fe8ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })); water.position.y = 0.95;
      g.add(water); delveParts.well = { g, water };
    }
    if (m.event === 'plates') for (const q of m.plates.slice(0, clamp(X.n, 1, 4))) {
      // a glowing floor sigil (a decal, not a prop): dim gold until someone stands on it
      const p = add(new THREE.Mesh(new THREE.CircleGeometry(1.25, 6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x8a6a2a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))); p.position.set(q.x, 0.03, q.z);
      const r = add(new THREE.Mesh(new THREE.RingGeometry(1.3, 1.55, 32).rotateX(-Math.PI / 2), glow(0xffcf1f, 0.5))); r.position.set(q.x, 0.05, q.z);
      delveParts.plates.push({ room: m.i, p, r });
    }
    if (m.event === 'mimic') delveParts.mimic = { room: m.i, set: WorldModels.place(dungeonGroup, 'chest', [{ x: m.x, z: m.z, ry: Math.PI, s: 1.25 }]) };
    if (m.event === 'echo') dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'delve_echo', [{ x: m.x, z: m.z + m.h * 0.55, ry: Math.PI, s: 3.4 }], { glow: 0x7fffd4, glowK: 0.3 }));
    if (m.event === 'vault') dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'delve_hoard', [{ x: m.x + m.hx * 0.5, z: m.z + m.hz * 0.5, ry: 2.4, s: 1.4 }, { x: m.x - m.hx * 0.5, z: m.z - m.hz * 0.4, ry: 0.7, s: 1.1 }], { glow: 0xffc94a, glowK: 0.12 }));
    if (m.event === 'echo') for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.785; echo.push({ x: m.x + Math.sin(a) * m.h * 0.6, z: m.z + Math.cos(a) * m.h * 0.6, ry: a, s: 2.6 }); }
  }
  if (echo.length) dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'pillar', echo));
  // the boss sits before its throne at the far end of the boss hall; a hoard waits beside the reward chest
  const B = D.rooms.at(-1);
  dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'delve_throne', [{ x: B.x, z: B.z1 - 3, ry: Math.PI, s: 5.5 }], { glow: 0xff3030, glowK: 0.08 }));
  dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'delve_hoard', [{ x: B.x + 3.2, z: B.z - 1.5, ry: 2, s: 1.3 }, { x: B.x - 3.4, z: B.z - 1, ry: 4, s: 1.1 }], { glow: 0xffc94a, glowK: 0.12 }));
  if (delveParts.mimic) dungeonParts.sets.push(delveParts.mimic.set);
  for (const c of delveParts.caches) { const s = [WorldModels.place(dungeonGroup, 'chest', [c.items[0]]), WorldModels.place(dungeonGroup, 'chest_open', [c.items[1]], { glow: 0xffc94a, glowK: 0.25 })]; c.sets = s; dungeonParts.sets.push(...s); }
}
function updateDelveView(dt, t) {
  const D = G.dungeon, X = D.delve;
  for (const c of delveParts.caches) {
    const b = X.bonus[c.room] | 0, [cc, co] = c.items, hc = b !== 1, ho = b !== 2;
    if (cc.hidden !== hc || co.hidden !== ho) { cc.hidden = hc; co.hidden = ho; for (const h of c.sets) h.dirty = true; if (b === 1) burst(cc.x, 1, cc.z, 20, 0xffd34a, 4, 0.8, 0.4, 6, 3); }
  }
  for (const q of delveParts.plates) { const on = (X.plates[q.room] || [])[delveParts.plates.filter((o) => o.room === q.room).indexOf(q)]; q.p.material.color.setHex(on ? 0x6cff8a : 0x8a6a2a); q.r.material.opacity = on ? 0.9 : 0.35 + Math.sin(t * 4) * 0.15; }
  if (delveParts.mimic) { const s = X.ev[delveParts.mimic.room] || {}, it = delveParts.mimic.set && delveParts.mimic.set.items ? delveParts.mimic.set.items[0] : null, hide = !!s.woke;
    if (it && it.hidden !== hide) { it.hidden = hide; delveParts.mimic.set.dirty = true; } }
  if (delveParts.altar) { const A = delveParts.altar; A.orb.position.y = 2.2 + Math.sin(t * 2) * 0.12; A.rune.rotation.y = t * 0.4; A.rune.material.opacity = X.used.altar ? 0.2 : 0.7; }
  if (delveParts.well) { delveParts.well.water.rotation.y = -t * 0.5; delveParts.well.water.material.opacity = X.used.fountain ? 0.25 : 0.8; }
  for (const r of delveParts.glows) r.material.opacity = 0.14 + Math.sin(t * 1.7 + r.position.x) * 0.05;
  // dark halls: the fog closes in while you are inside one
  const m = D.rooms[D.room], far = m && m.dark ? 34 : 75; scene.fog.far += (far - scene.fog.far) * Math.min(1, dt * 2); scene.fog.near = Math.min(22, scene.fog.far * 0.4);
}
