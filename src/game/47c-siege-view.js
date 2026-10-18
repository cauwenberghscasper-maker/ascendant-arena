// --- Bastion Siege view: the walled fort, built on entry and disposed on exit. Everything standing is a generated
// world model (walls, gatehouses, keep, wagons, defenders, plinths, flags); code geometry is only ground and VFX.
// The defenders on the eight pads are rebuilt whenever the fort changes; cannons and ballistas turn to their target.
const siegeParts = { sets: [], padSets: [], padGroup: null, aims: [], objItems: [], objSets: [], portal: null, flame: null, sig: '', t: 0 };
const SIEGE_PAD_COL = { archer: 0x58e08a, cannon: 0xff7a4a, ballista: 0x5dd6ff, warrior: 0xffc94a };
// a flat ground plane (terrain); vertex colours feed the flagstone shader
function siegeGround(w, d, color, mat, y) {
  const g = new THREE.PlaneGeometry(w, d, 1, 1).rotateX(-Math.PI / 2), n = g.attributes.position.count, col = new Float32Array(n * 3);
  _col.set(color); for (let i = 0; i < n; i++) col.set([_col.r, _col.g, _col.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, mat); m.position.set(SC.x, y, SC.z); m.receiveShadow = true; siegeGroup.add(m); return m;
}
function buildSiegeView() {
  disposeSiegeView();
  const C = CFG.siege, H = C.half, rng = mulberry32(0xba5710);
  const at = (q) => ({ x: SC.x + q.x, z: SC.z + q.z });
  // courtyard flagstones (the dungeon floor shader) inside the walls, meadow outside
  siegeGround(H * 2 + 2, H * 2 + 2, 0x857563, matDungeonFloor, 0);
  siegeGround(H * 2 + 90, H * 2 + 90, 0x3d5a2a, new THREE.MeshLambertMaterial({ vertexColors: true }), -0.05);
  // walls: stone sections along every side, open where a gatehouse stands
  const walls = [], S = 3.4, tile = 2.24 * S, gap = 4.6;
  const side = (x0, z0, x1, z1) => { const len = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / tile)), sx = len / (n * tile);
    for (let k = 0; k < n; k++) { const f = (k + 0.5) / n; walls.push({ x: SC.x + lerp(x0, x1, f), z: SC.z + lerp(z0, z1, f), ry: a + Math.PI / 2, s: S, sx, sz: 0.9 }); } };
  side(-H, -H, H, -H); // south: solid, the hero's own entrance is a portal
  side(-H, H, -gap, H); side(gap, H, H, H);
  side(H, -H, H, -gap); side(H, gap, H, H);
  side(-H, -H, -H, -gap); side(-H, gap, -H, H);
  siegeParts.sets.push(WorldModels.place(siegeGroup, 'dwall', walls, { bright: 1.2 }));
  siegeParts.sets.push(WorldModels.place(siegeGroup, 'gatehouse', C.gates.map((g) => ({ x: SC.x + Math.sign(g.x) * H, z: SC.z + Math.sign(g.z) * H, ry: g.a, s: 7.4 }))));
  siegeParts.sets.push(WorldModels.place(siegeGroup, 'tower', [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => ({ x: SC.x + a * H, z: SC.z + b * H, ry: rng() * 6.28, s: 9 }))));
  // objectives: the Keep and two supply wagons (hidden when destroyed)
  siegeParts.objItems = C.objs.map((d) => { const p = at(d); return d.main ? { x: p.x, z: p.z, ry: 0, s: 7.6 } : { x: p.x, z: p.z, ry: d.x < 0 ? 0.3 : -0.3, s: 1.5 }; });
  siegeParts.objSets = C.objs.map((d, i) => WorldModels.place(siegeGroup, d.main ? 'keep' : 'wagon', [siegeParts.objItems[i]], d.main ? { glow: 0xffc94a, glowK: 0.06 } : {}));
  siegeParts.sets.push(...siegeParts.objSets);
  // dressing: braziers at the gates, banners around the keep, supplies by the wagons
  const braz = [], banners = [], crates = [], barrels = [];
  for (const g of C.gates) { const ox = Math.cos(g.a) * 4.2, oz = -Math.sin(g.a) * 4.2; for (const k of [-1, 1]) braz.push({ x: SC.x + g.x * 0.86 + ox * k, z: SC.z + g.z * 0.86 + oz * k, ry: 0, s: 1.6 }); }
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, k = at(C.objs[0]); banners.push({ x: k.x + Math.sin(a) * 6, z: k.z + Math.cos(a) * 6, ry: a, s: 4.2 }); }
  for (const d of C.objs.slice(1)) { const p = at(d), sx = Math.sign(d.x); crates.push({ x: p.x + sx * 2.6, z: p.z - 1.4, ry: rng() * 6, s: 1.1 }, { x: p.x + sx * 2.9, z: p.z + 0.2, ry: rng() * 6, s: 0.9 }); barrels.push({ x: p.x - sx * 2.4, z: p.z - 1.8, ry: 0, s: 1.0 }); }
  siegeParts.sets.push(WorldModels.place(siegeGroup, 'brazier', braz), WorldModels.place(siegeGroup, 'banner_pole', banners), WorldModels.place(siegeGroup, 'crate_1', crates), WorldModels.place(siegeGroup, 'barrel_1', barrels));
  // brazier flames (VFX) share one additive mesh so the flicker is a single opacity change
  const fp = braz.map((b) => part(GEO.ico0, 0xffa040, [b.x, b.s * 0.98, b.z], null, [0.32, 0.5, 0.32]));
  siegeParts.flame = new THREE.Mesh(mergeParts(fp), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); siegeGroup.add(siegeParts.flame);
  // stone plinths for all eight pads: low, wide ruin blocks
  siegeParts.sets.push(WorldModels.place(siegeGroup, 'ruin_block', C.pads.map((q) => { const p = at(q); return { x: p.x, z: p.z, ry: rng() * 0.4 - 0.2, s: 2.4, sy: 0.16 }; })));
  // the way home: a portal by the south wall (VFX)
  { const e = at(C.exit), g = new THREE.Group(), ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.4, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: swirlTex(), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.position.y = 0.05; disc.position.y = 0.04; g.add(ring, disc); g.position.set(e.x, 0, e.z); siegeGroup.add(g); siegeParts.portal = g; }
  siegeParts.padGroup = new THREE.Group(); siegeGroup.add(siegeParts.padGroup); siegeParts.sig = '';
  buildSiegePads();
}
// defenders: archer = stone tower, cannon = iron mortar pot, ballista = the siege turret, warriors = tent and weapon
// rack; a banner in the defender's colour grows with the level, and an empty pad glows so you can see where to build
function buildSiegePads() {
  const g = siegeParts.padGroup, C = CFG.siege, F = fortState(), top = 0.38;
  for (const h of siegeParts.padSets) WorldModels.dispose(h);
  g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  g.clear(); siegeParts.padSets = []; siegeParts.aims = [];
  const L = { archer: [], cannon: [], ballista: [], war_tent: [], weapon_rack: [], banner_pole: [] }, aims = [];
  C.pads.forEach((q, i) => {
    const x = SC.x + q.x, z = SC.z + q.z, pad = F.pads[i];
    if (!pad) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.position.set(x, top + 0.14, z); m.userData.empty = true; g.add(m); return;
    }
    const k = 1 + (pad.l - 1) * 0.03, ry = Math.atan2(-q.x, -q.z);
    if (pad.t === 'archer') L.archer.push({ x, z, y: top, ry, s: 4.6 * k });
    else if (pad.t === 'warrior') { L.war_tent.push({ x: x - 0.3, z: z - 0.2, y: top, ry, s: 2.2 * k }); L.weapon_rack.push({ x: x + 0.9, z: z + 0.7, y: top, ry: ry + 0.6, s: 1.1 }); }
    else { const it = pad.t === 'cannon' ? { x, z, y: top, ry, s: 1.7 * k, color: 0x6a6a78 } : { x, z, y: top, ry, s: 3.0 * k }; L[pad.t].push(it); aims.push({ it, pad: i, t: pad.t }); }
    L.banner_pole.push({ x: x - 1.05, z: z - 1.05, y: top, ry: 0, s: 2.4 + Math.min(15, pad.l) * 0.14, color: SIEGE_PAD_COL[pad.t] });
  });
  const set = (name, list, o) => { const h = WorldModels.place(g, name, list, o); siegeParts.padSets.push(h); return h; };
  set('tower', L.archer); set('war_tent', L.war_tent); set('weapon_rack', L.weapon_rack); set('banner_pole', L.banner_pole);
  const hs = { cannon: set('kettle', L.cannon), ballista: set('arena_tower', L.ballista) };
  siegeParts.aims = aims.map((a) => Object.assign(a, { h: hs[a.t] }));
}
function disposeSiegeView() {
  for (const h of siegeParts.sets.concat(siegeParts.padSets)) WorldModels.dispose(h);
  const geos = new Set(), mats = new Set();
  siegeGroup.traverse((o) => { if (o.geometry) geos.add(o.geometry); if (o.material && o.material !== matVC && o.material !== matDungeonFloor) mats.add(o.material); });
  geos.forEach((g) => g.dispose()); mats.forEach((m) => m.dispose());
  siegeGroup.clear(); Object.assign(siegeParts, { sets: [], padSets: [], padGroup: null, aims: [], objItems: [], objSets: [], portal: null, flame: null, sig: '' });
}
function enterSiegeView(on) {
  hubGroup.visible = !on; riftGroup.visible = false; siegeGroup.visible = on;
  if (on) {
    buildSiegeView();
    scene.fog.color.set(0x8a6f58); scene.fog.near = 45; scene.fog.far = 120; paintSky(new THREE.Color(0x3a4a78), new THREE.Color(0xf0a868)); // late afternoon over the walls
  } else { disposeSiegeView(); scene.fog.near = 50; scene.fog.far = Q.lowTier ? 95 : 140; }
}
function updateSiegeView(dt) {
  const S = G.siege; if (!S || !siegeGroup.visible) return;
  hubGroup.visible = false; // the showcase restores the hub on close; the fort keeps it hidden
  const t = (siegeParts.t += dt), sig = JSON.stringify(fortState().pads);
  if (sig !== siegeParts.sig) { if (siegeParts.sig) buildSiegePads(); siegeParts.sig = sig; }
  // cannons and ballistas swing to their last target; empty pads pulse
  for (const a of siegeParts.aims) { const P = S.pads[a.pad]; if (!P || P.aim == null) continue; const d = angDiff(a.it.ry, P.aim); if (Math.abs(d) > 0.02) { a.it.ry += d * (1 - Math.exp(-dt * 10)); a.h.dirty = true; } }
  for (const m of siegeParts.padGroup.children) if (m.userData.empty) m.material.opacity = 0.35 + Math.sin(t * 3) * 0.25;
  // a fallen objective disappears in smoke
  S.objs.forEach((o, i) => { const it = siegeParts.objItems[i]; if (it && !o.alive && !it.hidden) { it.hidden = true; siegeParts.objSets[i].dirty = true; burst(o.x, 2, o.z, 40, 0x6a5a4a, 7, 1.2, 0.5, 3, 2); } });
  if (siegeParts.flame) siegeParts.flame.material.opacity = 0.75 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.08;
  if (siegeParts.portal) siegeParts.portal.rotation.y = t * 0.8;
  WorldModels.update();
}
