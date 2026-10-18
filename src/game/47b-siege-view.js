// --- Bastion Siege view: the walled fort, built on entry and disposed on exit. The defenders on the eight pads are
// rebuilt whenever the fort changes (build, upgrade, swap); cannon and ballista tops are their own meshes so they can aim.
const siegeParts = { sets: [], padSets: [], padGroup: null, tops: [], objItems: [], objSets: [], portal: null, flame: null, sig: '', t: 0 };
const SIEGE_PAD_COL = { archer: 0x58e08a, cannon: 0xff7a4a, ballista: 0x5dd6ff, warrior: 0xffc94a };
function buildSiegeView() {
  disposeSiegeView();
  const C = CFG.siege, H = C.half, rng = mulberry32(0xba5710), parts = [];
  const at = (q) => ({ x: SC.x + q.x, z: SC.z + q.z });
  // courtyard: 3 m flagstones (the dungeon floor shader), meadow outside the walls
  for (let x = -H; x < H; x += 3) for (let z = -H; z < H; z += 3) {
    const c = (Math.floor(x / 3) + Math.floor(z / 3)) & 1 ? 0x8a7a66 : 0x7a6c5c;
    parts.push(part(GEO.box, c, [SC.x + x + 1.5, -0.06 - rng() * 0.03, SC.z + z + 1.5], null, [2.94, 0.12, 2.94]));
  }
  const yard = new THREE.Mesh(mergeParts(parts), matDungeonFloor); yard.receiveShadow = true; siegeGroup.add(yard);
  const out = [part(GEO.box, 0x3d5a2a, [SC.x, -0.3, SC.z], null, [H * 2 + 70, 0.4, H * 2 + 70]), part(GEO.box, 0x5b4d3e, [SC.x, -0.2, SC.z], null, [H * 2 + 3, 0.3, H * 2 + 3])];
  // dirt roads from the three gates out into the meadow
  for (const g of C.gates) { const ox = Math.sign(g.x) * (H + 12), oz = Math.sign(g.z) * (H + 12); out.push(part(GEO.box, 0x6b5a44, [SC.x + ox, -0.11, SC.z + oz], null, g.z ? [5, 0.06, 24] : [24, 0.06, 5])); }
  siegeGroup.add(new THREE.Mesh(mergeParts(out), matVC));
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
  const fp = braz.map((b) => part(GEO.ico0, 0xffa040, [b.x, b.s * 0.98, b.z], null, [0.32, 0.5, 0.32]));
  siegeParts.flame = new THREE.Mesh(mergeParts(fp), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); siegeGroup.add(siegeParts.flame);
  // stone plinths for all eight pads
  const pl = [];
  for (const q of C.pads) { const p = at(q); pl.push(part(GEO.cyl8, 0x6f6658, [p.x, 0.15, p.z], null, [1.35, 0.3, 1.35]), part(GEO.cyl8, 0x8d8372, [p.x, 0.33, p.z], null, [1.2, 0.08, 1.2])); }
  const plinths = new THREE.Mesh(mergeParts(pl), matVC); plinths.receiveShadow = true; siegeGroup.add(plinths);
  // the way home: a portal by the south wall
  { const e = at(C.exit), g = new THREE.Group(), ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.4, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: swirlTex(), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.position.y = 0.05; disc.position.y = 0.04; g.add(ring, disc); g.position.set(e.x, 0, e.z); siegeGroup.add(g); siegeParts.portal = g; }
  siegeParts.padGroup = new THREE.Group(); siegeGroup.add(siegeParts.padGroup); siegeParts.sig = '';
  buildSiegePads();
}
// defenders: archer = generated tower, warriors = a war tent, cannon and ballista from primitives; a flag in the
// pad's colour grows with the level, and an empty pad glows so you can see where to build
function buildSiegePads() {
  const g = siegeParts.padGroup, C = CFG.siege, F = fortState();
  for (const h of siegeParts.padSets) WorldModels.dispose(h);
  g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== matVC) o.material.dispose(); });
  g.clear(); siegeParts.padSets = []; siegeParts.tops = [];
  const towers = [], tents = [], racks = [], base = [];
  C.pads.forEach((q, i) => {
    const x = SC.x + q.x, z = SC.z + q.z, pad = F.pads[i];
    if (!pad) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.position.set(x, 0.42, z); m.userData.empty = true; g.add(m); return;
    }
    const k = 1 + (pad.l - 1) * 0.03, col = SIEGE_PAD_COL[pad.t], ry = Math.atan2(-q.x, -q.z);
    if (pad.t === 'archer') towers.push({ x, z, y: 0.35, ry, s: 4.6 * k });
    else if (pad.t === 'warrior') { tents.push({ x: x - 0.3, z: z - 0.2, y: 0.35, ry, s: 2.2 * k }); racks.push({ x: x + 0.9, z: z + 0.7, y: 0.35, ry: ry + 0.6, s: 1.1 }); }
    else {
      // a wooden carriage on the plinth, and a turning top: iron barrel or a crossbow arm with its bolt
      base.push(part(GEO.box, 0x6b4a2e, [x, 0.65, z], null, [1.5 * k, 0.5, 1.5 * k]), part(GEO.cyl8, 0x3b2c20, [x - 0.8 * k, 0.6, z], [0, 0, Math.PI / 2], [0.4, 0.15, 0.4]), part(GEO.cyl8, 0x3b2c20, [x + 0.8 * k, 0.6, z], [0, 0, Math.PI / 2], [0.4, 0.15, 0.4]));
      const tp = pad.t === 'cannon'
        ? [part(GEO.cyl8, 0x2f3038, [0, 0, 0.35], [Math.PI / 2 - 0.2, 0, 0], [0.42 * k, 1.9 * k, 0.42 * k]), part(GEO.cyl8, 0x1c1d22, [0, 0.18, 1.25 * k], [Math.PI / 2 - 0.2, 0, 0], [0.5 * k, 0.22, 0.5 * k]), part(GEO.box, 0x4a3524, [0, -0.25, -0.2], null, [0.9, 0.35, 1.1])]
        : [part(GEO.box, 0x7a5434, [0, 0, 0], null, [0.32, 0.3, 2.4 * k]), part(GEO.box, 0x5a3c24, [0, 0.05, 0.75 * k], [0, 0, 0], [2.6 * k, 0.18, 0.22]), part(GEO.box, 0xcfd6dc, [0, 0.22, 0.2], null, [0.1, 0.1, 2.3 * k]), part(GEO.cone4, 0xcfd6dc, [0, 0.22, 1.42 * k], [Math.PI / 2, 0, 0], [0.16, 0.36, 0.16])];
      const top = new THREE.Mesh(mergeParts(tp), matVC); top.position.set(x, 1.2, z); top.rotation.y = ry; top.castShadow = true; top.userData.pad = i; g.add(top); siegeParts.tops.push(top);
    }
    // level flag: a pole with a pennant in the defender's colour, longer at higher levels
    const fh = 2.2 + Math.min(15, pad.l) * 0.12;
    base.push(part(GEO.box, 0x4a3a2a, [x - 1.05, 0.35 + fh / 2, z - 1.05], null, [0.08, fh, 0.08]), part(GEO.box, col, [x - 1.05, 0.35 + fh - 0.25, z - 0.75], null, [0.04, 0.4, 0.6]));
  });
  if (base.length) { const m = new THREE.Mesh(mergeParts(base), matVC); m.castShadow = true; g.add(m); }
  siegeParts.padSets.push(WorldModels.place(g, 'tower', towers), WorldModels.place(g, 'war_tent', tents), WorldModels.place(g, 'weapon_rack', racks));
}
function disposeSiegeView() {
  for (const h of siegeParts.sets.concat(siegeParts.padSets)) WorldModels.dispose(h);
  const geos = new Set(), mats = new Set();
  siegeGroup.traverse((o) => { if (o.geometry) geos.add(o.geometry); if (o.material && o.material !== matVC && o.material !== matDungeonFloor) mats.add(o.material); });
  geos.forEach((g) => g.dispose()); mats.forEach((m) => m.dispose());
  siegeGroup.clear(); Object.assign(siegeParts, { sets: [], padSets: [], padGroup: null, tops: [], objItems: [], objSets: [], portal: null, flame: null, sig: '' });
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
  // turrets swing to their last target; empty pads pulse
  for (const top of siegeParts.tops) { const P = S.pads[top.userData.pad]; if (P && P.aim != null) top.rotation.y += angDiff(top.rotation.y, P.aim) * (1 - Math.exp(-dt * 10)); }
  for (const m of siegeParts.padGroup.children) if (m.userData.empty) m.material.opacity = 0.35 + Math.sin(t * 3) * 0.25;
  // a fallen objective disappears in smoke
  S.objs.forEach((o, i) => { const it = siegeParts.objItems[i]; if (it && !o.alive && !it.hidden) { it.hidden = true; siegeParts.objSets[i].dirty = true; burst(o.x, 2, o.z, 40, 0x6a5a4a, 7, 1.2, 0.5, 3, 2); } });
  if (siegeParts.flame) siegeParts.flame.material.opacity = 0.75 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.08;
  if (siegeParts.portal) siegeParts.portal.rotation.y = t * 0.8;
  WorldModels.update();
}
