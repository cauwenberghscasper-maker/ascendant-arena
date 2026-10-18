// --- Bastion Siege view: the fort's land, built on entry and disposed on exit. Everything standing is a generated world
// model (keep, wagons, the siege_* buildings and walls, flags); code geometry is only ground, the land's edge, the
// placing ghost and VFX. Buildings are rebuilt whenever the fort changes; cannons, ballistas and mage towers turn to their target.
const siegeParts = { sets: [], bSets: [], bGroup: null, aims: [], objItems: [], objSets: [], portal: null, flame: null, ghost: null, sig: '', t: 0 };
const SIEGE_PAD_COL = { archer: 0x58e08a, cannon: 0xff7a4a, ballista: 0x5dd6ff, mage: 0xb98cff, warrior: 0xffc94a, mine: 0x9fe8ff, hut: 0xd8b07a };
// a flat ground plane (terrain); vertex colours feed the flagstone shader
function siegeGround(w, d, color, mat, y) {
  const g = new THREE.PlaneGeometry(w, d, 1, 1).rotateX(-Math.PI / 2), n = g.attributes.position.count, col = new Float32Array(n * 3);
  _col.set(color); for (let i = 0; i < n; i++) col.set([_col.r, _col.g, _col.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, mat); m.position.set(SC.x, y, SC.z); m.receiveShadow = true; siegeGroup.add(m); return m;
}
function buildSiegeView() {
  disposeSiegeView();
  const C = CFG.siege, H = G.siege.half, rng = mulberry32(0xba5710);
  const at = (q) => ({ x: SC.x + q.x, z: SC.z + q.z });
  // flagstones around the Keep, meadow over the whole land and beyond
  siegeGround(36, 40, 0x857563, matDungeonFloor, 0.01);
  siegeGround(H * 2 + 120, H * 2 + 120, 0x3d5a2a, new THREE.MeshLambertMaterial({ vertexColors: true }), -0.05);
  // the edge of your land: a faint gold line (VFX) and a banner on every corner
  { const mat = new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
    for (const [w, d, x, z] of [[H * 2, 0.3, 0, H], [H * 2, 0.3, 0, -H], [0.3, H * 2, H, 0], [0.3, H * 2, -H, 0]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), mat); m.position.set(SC.x + x, 0.04, SC.z + z); siegeGroup.add(m); } }
  siegeParts.sets.push(WorldModels.place(siegeGroup, 'banner_pole', [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => ({ x: SC.x + a * H, z: SC.z + b * H, ry: 0, s: 5, color: 0xffd36b }))));
  // objectives: the Keep and two supply wagons (hidden when destroyed)
  siegeParts.objItems = C.objs.map((d) => { const p = at(d); return d.main ? { x: p.x, z: p.z, ry: 0, s: 7.6 } : { x: p.x, z: p.z, ry: d.x < 0 ? 0.3 : -0.3, s: 1.5 }; });
  siegeParts.objSets = C.objs.map((d, i) => WorldModels.place(siegeGroup, d.main ? 'keep' : 'wagon', [siegeParts.objItems[i]], d.main ? { glow: 0xffc94a, glowK: 0.06 } : {}));
  siegeParts.sets.push(...siegeParts.objSets);
  // dressing: braziers by the Keep, banners around it, supplies by the wagons
  const braz = [], banners = [], crates = [], barrels = [];
  for (const k of [-1, 1]) braz.push({ x: SC.x + k * 5.6, z: SC.z - 3.2, ry: 0, s: 1.6 });
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, k = at(C.objs[0]); banners.push({ x: k.x + Math.sin(a) * 6, z: k.z + Math.cos(a) * 6, ry: a, s: 4.2 }); }
  for (const d of C.objs.slice(1)) { const p = at(d), sx = Math.sign(d.x); crates.push({ x: p.x + sx * 2.6, z: p.z - 1.4, ry: rng() * 6, s: 1.1 }, { x: p.x + sx * 2.9, z: p.z + 0.2, ry: rng() * 6, s: 0.9 }); barrels.push({ x: p.x - sx * 2.4, z: p.z - 1.8, ry: 0, s: 1.0 }); }
  siegeParts.sets.push(WorldModels.place(siegeGroup, 'brazier', braz), WorldModels.place(siegeGroup, 'banner_pole', banners), WorldModels.place(siegeGroup, 'crate_1', crates), WorldModels.place(siegeGroup, 'barrel_1', barrels));
  // brazier flames (VFX) share one additive mesh so the flicker is a single opacity change
  const fp = braz.map((b) => part(GEO.ico0, 0xffa040, [b.x, b.s * 0.98, b.z], null, [0.32, 0.5, 0.32]));
  siegeParts.flame = new THREE.Mesh(mergeParts(fp), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); siegeGroup.add(siegeParts.flame);
  // the way home: a portal south of the Keep (VFX)
  { const e = at(C.exit), g = new THREE.Group(), ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.4, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: swirlTex(), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.position.y = 0.05; disc.position.y = 0.04; g.add(ring, disc); g.position.set(e.x, 0, e.z); siegeGroup.add(g); siegeParts.portal = g; }
  // the placing ghost: a square on the ground, green where it fits and red where it does not
  siegeParts.ghost = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x58e08a, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
  siegeParts.ghost.visible = false; siegeGroup.add(siegeParts.ghost);
  siegeParts.bGroup = new THREE.Group(); siegeGroup.add(siegeParts.bGroup); siegeParts.sig = '';
  buildSiegeBuildings();
}
// buildings: TRELLIS.2 models made for the fort (siege_*), each on its cell; cannons, ballistas and mage towers turn to
// their target. A banner in the building's colour grows with its level. Walls: wood to level 5, stone to 10, iron
// after; each cell draws a half piece toward every wall or gate next to it, so lines, corners and crossings join up.
const SIEGE_MODEL = { archer: ['siege_archer', 6.2], cannon: ['siege_cannon', 2.3], ballista: ['siege_ballista', 2.4], mage: ['siege_mage', 6.6],
  warrior: ['siege_barracks', 2.6], mine: ['siege_mine', 3.2], hut: ['siege_hut', 3.1], gate: ['siege_gate', 2.1] };
const SIEGE_TURN = { cannon: 1, ballista: 1, mage: 1 };
// how a defender fires (Clash of Clans style): it winds up before the shot (cannon leans back, ballista draws, the mage
// orb swells) and kicks when it fires (recoil back along the aim, a squash and bounce); see animateSiegeDefenders
function buildSiegeBuildings() {
  const g = siegeParts.bGroup, S = G.siege, cs = CFG.siege.cell, now = fortNow();
  for (const h of siegeParts.bSets) WorldModels.dispose(h);
  g.clear(); siegeParts.bSets = []; siegeParts.aims = [];
  const L = {}, add = (name, it) => (L[name] || (L[name] = [])).push(it), aims = [];
  const wallAt = (i, j) => { const k = siegeIdx(i, j), o = k >= 0 ? S.occ[k] : 0, u = o > 0 ? S.units[o - 1] : null; return !!u && u.alive && CFG.siege.towers[u.b.t].wall; };
  for (const u of S.units) {
    if (!u.alive) continue;
    const b = u.b, x = u.x, z = u.z, k = (b.d > now ? 0.85 : 1) * (1 + (b.l - 1) * 0.02), ry = Math.atan2(SC.x - x, SC.z - z);
    if (b.t === 'wall') {
      const name = b.l > 10 ? 'siege_wall_iron' : b.l > 5 ? 'siege_wall_stone' : 'siege_wall_wood', h = name === 'siege_wall_wood' ? 1.8 : 1.4, len = (WORLD_MODEL_BOX[name] || [2])[0] * h;
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([di, dj]) => wallAt(b.x + di, b.z + dj));
      if (!dirs.length) add(name, { x, z, ry: 0, s: h, sx: cs / len });
      for (const [di, dj] of dirs) add(name, { x: x + di * cs / 4, z: z + dj * cs / 4, ry: di ? 0 : Math.PI / 2, s: h, sx: (cs / 2 + 0.15) / len });
      continue;
    }
    const [name, h] = SIEGE_MODEL[b.t];
    if (b.t === 'gate') { add(name, { x, z, ry: wallAt(b.x + 1, b.z) || wallAt(b.x - 1, b.z) ? 0 : Math.PI / 2, s: h }); continue; }
    const it = { x, z, ry, s: h * k }; add(name, it);
    if (SIEGE_SHOOTERS[b.t]) aims.push({ it, u, name, bx: x, bz: z });
    add('banner_pole', { x: x - 1.6, z: z - 1.6, ry: 0, s: 2.4 + Math.min(15, b.l) * 0.14, color: b.d > now ? 0xffe9a8 : SIEGE_PAD_COL[b.t] });
  }
  const hs = {};
  for (const name in L) { const h = WorldModels.place(g, name, L[name], name === 'siege_mage' ? { glow: 0xb98cff, glowK: 0.12 } : {}); siegeParts.bSets.push(h); hs[name] = h; }
  siegeParts.aims = aims.map((a) => Object.assign(a, { h: hs[a.name] }));
}
function animateSiegeDefenders(dt) {
  for (const a of siegeParts.aims) {
    const u = a.u, it = a.it, t = u.b.t, M = SIEGE_MUZZLE[t]; if (!a.h) continue;
    // cannons, ballistas and mage towers swing to their target
    if (SIEGE_TURN[t] && u.aim != null) { const d = angDiff(it.ry, u.aim); if (Math.abs(d) > 0.02) { it.ry += d * (1 - Math.exp(-dt * 10)); a.h.dirty = true; } }
    const since = G.time - (u.fireT ?? -9), kick = since < 0.32 ? Math.pow(1 - since / 0.32, 2) : 0;
    const busy = since < CFG.siege.towers[t].cd + 0.6, wind = busy && u.cd > 0 && u.cd < M.wind ? 1 - u.cd / M.wind : 0;
    if (!kick && !wind && !a.moving) continue;
    a.moving = kick > 0 || wind > 0;
    const ax = Math.sin(it.ry), az = Math.cos(it.ry);
    let back = 0, sy = 1, sw = 1;
    if (t === 'cannon') { back = kick * 0.6 + wind * 0.12; sy = 1 - kick * 0.14; sw = 1 + kick * 0.06; }
    else if (t === 'ballista') { back = kick * 0.4; sy = 1 + wind * 0.05 - kick * 0.08; sw = 1 - wind * 0.04 + kick * 0.05; }
    else if (t === 'mage') { sy = 1 + wind * 0.07 - kick * 0.06; sw = 1 + wind * 0.05 + kick * 0.03; }
    else { sy = 1 - kick * 0.07; sw = 1 + kick * 0.05; } // archer tower: a bounce as the volley goes
    it.x = a.bx - ax * back; it.z = a.bz - az * back; it.sy = sy; it.sx = it.sz = sw; a.h.dirty = true;
  }
}
function disposeSiegeView() {
  for (const h of siegeParts.sets.concat(siegeParts.bSets)) WorldModels.dispose(h);
  const geos = new Set(), mats = new Set();
  siegeGroup.traverse((o) => { if (o.geometry) geos.add(o.geometry); if (o.material && o.material !== matVC && o.material !== matDungeonFloor) mats.add(o.material); });
  geos.forEach((g) => g.dispose()); mats.forEach((m) => m.dispose());
  siegeGroup.clear(); Object.assign(siegeParts, { sets: [], bSets: [], bGroup: null, aims: [], objItems: [], objSets: [], portal: null, flame: null, ghost: null, sig: '' });
}
function enterSiegeView(on) {
  hubGroup.visible = !on; riftGroup.visible = false; siegeGroup.visible = on;
  if (on) {
    buildSiegeView();
    scene.fog.color.set(0x8a6f58); scene.fog.near = 55; scene.fog.far = 140; paintSky(new THREE.Color(0x3a4a78), new THREE.Color(0xf0a868)); // late afternoon over the fort
  } else { disposeSiegeView(); scene.fog.near = 50; scene.fog.far = Q.lowTier ? 95 : 140; }
}
function updateSiegeView(dt) {
  const S = G.siege; if (!S || !siegeGroup.visible) return;
  hubGroup.visible = false; // the showcase restores the hub on close; the fort keeps it hidden
  const t = (siegeParts.t += dt), now = fortNow();
  const sig = S.units.map((u) => `${u.b.t}${u.b.x},${u.b.z},${u.b.l}${u.b.d > now ? 'u' : ''}${u.alive ? '' : 'x'}`).join('|');
  if (sig !== siegeParts.sig) { if (siegeParts.sig) buildSiegeBuildings(); siegeParts.sig = sig; }
  animateSiegeDefenders(dt);
  // the placing ghost
  const gh = siegeParts.ghost, q = fortGhost();
  if (gh) { gh.visible = !!q; if (q) { const s = FORT_TYPES[q.t], cs = CFG.siege.cell; gh.scale.set(s * cs * 0.96, 1, s * cs * 0.96); gh.position.set(SC.x + (q.x + s / 2) * cs, 0.07, SC.z + (q.z + s / 2) * cs); gh.material.color.set(q.ok ? 0x58e08a : 0xff5d6c); gh.material.opacity = 0.35 + Math.sin(t * 6) * 0.12; } }
  // a fallen objective disappears in smoke
  S.objs.forEach((o, i) => { const it = siegeParts.objItems[i]; if (it && !o.alive && !it.hidden) { it.hidden = true; siegeParts.objSets[i].dirty = true; burst(o.x, 2, o.z, 40, 0x6a5a4a, 7, 1.2, 0.5, 3, 2); } });
  if (siegeParts.flame) siegeParts.flame.material.opacity = 0.75 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.08;
  if (siegeParts.portal) siegeParts.portal.rotation.y = t * 0.8;
  WorldModels.update();
}
