// --- Bastion Siege view: the fort's land, built on entry and disposed on exit. Everything standing is a generated world
// model (keep, wagons, the siege_* buildings and walls, flags); code geometry is only ground, the land's edge, the
// placing ghost and VFX. Buildings are rebuilt whenever the fort changes; cannons, ballistas and mage towers turn to their target.
const siegeParts = { sets: [], bSets: [], bGroup: null, aims: [], objItems: [], objSets: [], portal: null, flame: null, ghost: null, sig: '', t: 0 };
// the land: the town's painted meadow shader (grass clumps, blades, dirt patches), flat where you build and rolling
// beyond the edge, so the fort sits in a clearing of the Starting Woodlands
function siegeMeadow(H) {
  const w = H * 2 + 140, seg = Math.min(140, Math.round(w / 5));
  let g = new THREE.PlaneGeometry(w, w, seg, seg).rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), out = Math.max(Math.abs(x), Math.abs(z)) - H; pos.setY(i, out > 2 ? Math.min(5, (out - 2) * 0.12) + (hashf(x * 0.7, z * 0.7) - 0.5) * 1.4 : -0.03); }
  g.computeVertexNormals(); g = g.toNonIndexed();
  const gp = g.attributes.position, n = gp.count, col = new Float32Array(n * 3), th = new Float32Array(n).fill(1), gl = new Float32Array(n * 3);
  const lo = new THREE.Color(0x3f6a2c), hi = new THREE.Color(0x6d9a3c), dirt = new THREE.Color(0x7a6a46);
  for (let i = 0; i < n; i++) {
    const x = gp.getX(i), z = gp.getZ(i), k = clamp(vnoise((x + SC.x) * 0.06, (z + SC.z) * 0.06) * 1.2 - 0.1, 0, 1);
    _col.copy(lo).lerp(hi, k); if (vnoise(x * 0.11 + 7, z * 0.11) > 0.78) _col.lerp(dirt, 0.35);
    col.set([_col.r, _col.g, _col.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aTh', new THREE.BufferAttribute(th, 1)); g.setAttribute('aGc', new THREE.BufferAttribute(gl, 3)); g.deleteAttribute('uv');
  const m = new THREE.Mesh(g, matGround); m.position.set(SC.x, 0, SC.z); m.receiveShadow = true; siegeGroup.add(m);
}
// a soft-edged dirt texture for the paths (a decal on the meadow)
let siegePathTex = null;
function siegeDirtTex() {
  if (siegePathTex) return siegePathTex;
  const cv = document.createElement('canvas'); cv.width = 32; cv.height = 64; const x = cv.getContext('2d'), r = mulberry32(77);
  for (let i = 0; i < 32; i++) for (let j = 0; j < 64; j++) { const e = Math.min(i, 31 - i) / 8, a = clamp(e - 0.25 + r() * 0.35, 0, 1), v = 96 + r() * 40; x.fillStyle = `rgba(${v + 30},${v + 10},${v - 25},${a.toFixed(2)})`; x.fillRect(i, j, 1, 1); }
  siegePathTex = new THREE.CanvasTexture(cv); siegePathTex.wrapT = THREE.RepeatWrapping; siegePathTex.magFilter = THREE.NearestFilter; siegePathTex.colorSpace = THREE.SRGBColorSpace;
  return siegePathTex;
}
// what is around the fort: a forest beyond the land's edge (in chunks, so only the part on screen is drawn), a monster
// gate on each side where the waves come in, dirt paths from the gates to the Keep, and flowers and tufts on the meadow
function siegeLandscape(H, rng) {
  const C = CFG.siege;
  // paths: one per side, from its gate to the courtyard
  for (const d of C.sides) {
    const L = H - 16, tex = new THREE.CanvasTexture(siegeDirtTex().image), mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace; tex.repeat.set(1, L / 6);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, L).rotateX(-Math.PI / 2), mat);
    m.rotation.y = Math.atan2(d.x, d.z); m.position.set(SC.x + d.x * (16 + L / 2), 0.02, SC.z + d.z * (16 + L / 2)); siegeGroup.add(m);
  }
  // monster gates: a gatehouse at each side's entry; the ground before it glows red when that side is coming
  siegeParts.gates = C.sides.map((d) => ({ x: SC.x + d.x * (H - 3), z: SC.z + d.z * (H - 3), ry: Math.atan2(d.x, d.z), d }));
  siegeParts.sets.push(WorldModels.place(siegeGroup, 'gatehouse', siegeParts.gates.map((q) => ({ x: q.x, z: q.z, ry: Math.atan2(-q.d.x, -q.d.z), s: 7.4 }))));
  siegeParts.gateGlow = siegeParts.gates.map((q) => { const m = new THREE.Mesh(new THREE.CircleGeometry(4.5, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); m.position.set(q.x, 0.05, q.z); siegeGroup.add(m); return m; });
  // the forest: three rows just past the edge (WorldModels cuts big sets into 64 m cells, so only what is on screen draws)
  const rows = [[4, 'tree_oak', 5.2], [10, 'tree_oak_lod', 6], [17, 'tree_oak_lod', 6.8]], L = {}, add = (n, it) => (L[n] || (L[n] = [])).push(it);
  for (const d of C.sides) {
    const px = d.z, pz = -d.x; // along the side
    for (const [off, name, s] of rows) for (let t = -H - 20; t < H + 20; t += 4.5 + rng() * 2) {
      const o = H + off + rng() * 4, x = SC.x + d.x * o + px * t, z = SC.z + d.z * o + pz * t;
      const r = rng(); add(r < 0.78 ? name : r < 0.88 ? 'rock_a' : r < 0.96 ? 'bush_a' : 'stump', { x, z, ry: rng() * 6.28, s: r < 0.78 ? s * (0.8 + rng() * 0.45) : 1.6 + rng() * 1.4 });
    }
  }
  for (const n in L) siegeParts.sets.push(WorldModels.place(siegeGroup, n, L[n]));
  // meadow dressing inside the land near the Keep (hidden under anything you build: siegeDecorHide)
  const R = Math.min(H - 4, 70), deco = { tuft: [], flower: [], mushrooms: [] };
  for (let i = 0; i < R * R / 18; i++) {
    const x = (rng() * 2 - 1) * R, z = (rng() * 2 - 1) * R; if (Math.abs(x) < 19 && Math.abs(z) < 21) continue;
    const r = rng(); (r < 0.7 ? deco.tuft : r < 0.93 ? deco.flower : deco.mushrooms).push({ x: SC.x + x, z: SC.z + z, ry: rng() * 6.28, s: r < 0.7 ? 1.2 + rng() : 0.9 + rng() * 0.6 });
  }
  // pollen and fireflies drifting around the camera (VFX): the meadow feels alive
  { const N = 150, pos = new Float32Array(N * 3), seed = []; for (let i = 0; i < N; i++) seed.push([rng() * 70, rng() * 70, 0.6 + rng() * 3.2, rng() * 6.28, 0.3 + rng() * 0.7]);
    const cv = document.createElement('canvas'); cv.width = cv.height = 16; const x = cv.getContext('2d'), gr = x.createRadialGradient(8, 8, 0, 8, 8, 8); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,240,170,0.7)'); gr.addColorStop(1, 'rgba(255,220,120,0)'); x.fillStyle = gr; x.fillRect(0, 0, 16, 16);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.32, map: new THREE.CanvasTexture(cv), color: 0xfff0b0, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    pts.frustumCulled = false; siegeGroup.add(pts); siegeParts.motes = { pts, seed }; }
  siegeParts.deco = Object.entries(deco).map(([n, items]) => { const h = WorldModels.place(siegeGroup, n, items); siegeParts.sets.push(h); return { h, items }; });
}
// flowers and tufts never poke through a building
function siegeDecorHide() {
  const S = G.siege; if (!siegeParts.deco || !S.occ) return;
  for (const d of siegeParts.deco) { let ch = false; for (const it of d.items) { const k = siegeIdx(cellAt(it.x - SC.x), cellAt(it.z - SC.z)), hide = k >= 0 && S.occ[k] > 0; if (!!it.hidden !== hide) { it.hidden = hide; ch = true; } } if (ch) for (const x of d.h.multi || [d.h]) x.dirty = true; }
}
const SIEGE_PAD_COL = { archer: 0x58e08a, cannon: 0xff7a4a, ballista: 0x5dd6ff, mage: 0xb98cff, warrior: 0xffc94a, mine: 0x9fe8ff, hut: 0xd8b07a, wall: 0xcfc6b8, gate: 0xcfc6b8, spike: 0xc8ccd4, bomb: 0xff9a3d, tar: 0x5a4a3a };
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
  siegeMeadow(H);
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
  siegeLandscape(H, rng); // after the Keep and the buildings, so those are built first
}
// buildings: TRELLIS.2 models made for the fort (siege_*), each on its cell; cannons, ballistas and mage towers turn to
// their target. A banner in the building's colour grows with its level. Walls: wood to level 5, stone to 10, iron
// after; each cell draws a half piece toward every wall or gate next to it, so lines, corners and crossings join up.
const SIEGE_MODEL = { archer: ['siege_archer', 7.4], cannon: ['siege_cannon', 3.0], ballista: ['siege_ballista', 3.3], mage: ['siege_mage', 7.6],
  warrior: ['siege_barracks', 3.3], mine: ['siege_mine', 3.9], hut: ['siege_hut', 3.6], gate: ['siege_gate', 2.1],
  spike: ['siege_trap_spike', 0.34], bomb: ['siege_trap_bomb', 1.3], tar: ['siege_trap_tar', 0.36] };
// every building stands on a stone tile with a rim in its colour (decals), Clash of Clans style, so it reads from far
let siegeTileTex = null;
function siegeTileTextures() {
  if (siegeTileTex) return siegeTileTex;
  const mk = (draw) => { const cv = document.createElement('canvas'); cv.width = cv.height = 32; draw(cv.getContext('2d'), mulberry32(31)); const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t; };
  siegeTileTex = {
    slab: mk((x, r) => { for (let i = 0; i < 32; i++) for (let j = 0; j < 32; j++) { const e = Math.min(i, j, 31 - i, 31 - j), v = (e < 2 ? 70 : 128) + r() * 26 - ((i % 11 === 0 || j % 11 === 0) && e > 2 ? 30 : 0); x.fillStyle = `rgb(${v},${v - 6},${v - 16})`; x.fillRect(i, j, 1, 1); } }),
    rim: mk((x) => { x.fillStyle = '#fff'; x.fillRect(0, 0, 32, 32); x.clearRect(3, 3, 26, 26); }),
  };
  return siegeTileTex;
}
const SIEGE_TURN = { cannon: 1, ballista: 1, mage: 1 };
// how a defender fires (Clash of Clans style): it winds up before the shot (cannon leans back, ballista draws, the mage
// orb swells) and kicks when it fires (recoil back along the aim, a squash and bounce); see animateSiegeDefenders
function buildSiegeBuildings() {
  const g = siegeParts.bGroup, S = G.siege, cs = CFG.siege.cell, now = fortNow();
  for (const h of siegeParts.bSets) WorldModels.dispose(h);
  g.traverse((o) => { if (o.isInstancedMesh && !o.userData.items) { o.geometry.dispose(); o.material.dispose(); } }); // the tiles (models are disposed above)
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
    if (CFG.siege.towers[b.t].trap) { // traps lie flat on their cell; a spent keg is gone until the next wave
      if (u.spent) continue;
      const it = { x, z, ry: 0, s: h }; add(name, it); if (b.t === 'spike') aims.push({ it, u, name, bx: x, bz: z }); continue; }
    const it = { x, z, ry, s: h * k }; add(name, it);
    if (SIEGE_SHOOTERS[b.t]) aims.push({ it, u, name, bx: x, bz: z });
    add('banner_pole', { x: x - u.size * cs / 2 + 0.3, z: z - u.size * cs / 2 + 0.3, ry: 0, s: 2.4 + Math.min(15, b.l) * 0.14, color: b.d > now ? 0xffe9a8 : SIEGE_PAD_COL[b.t] });
  }
  // the tiles under the buildings: one instanced slab and one instanced rim (tinted per building) for the whole fort
  const tiles = S.units.filter((u) => u.alive && !CFG.siege.towers[u.b.t].wall && !CFG.siege.towers[u.b.t].trap);
  if (tiles.length) {
    const T = siegeTileTextures(), geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), m4 = new THREE.Matrix4();
    const slab = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ map: T.slab, polygonOffset: true, polygonOffsetFactor: -3 }), tiles.length);
    const rim = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ map: T.rim, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 }), tiles.length);
    tiles.forEach((u, i) => { const w = u.size * cs - 0.1; m4.makeScale(w, 1, w).setPosition(u.x, 0.04, u.z); slab.setMatrixAt(i, m4); m4.setPosition(u.x, 0.06, u.z); rim.setMatrixAt(i, m4); rim.setColorAt(i, _col.set(u.b.d > now ? 0xffe9a8 : SIEGE_PAD_COL[u.b.t])); });
    slab.receiveShadow = true; g.add(slab, rim);
  }
  const hs = {};
  for (const name in L) { const h = WorldModels.place(g, name, L[name], Object.assign({ bright: 1.3 }, name === 'siege_mage' ? { glow: 0xb98cff, glowK: 0.12 } : {})); siegeParts.bSets.push(h); hs[name] = h; }
  siegeDecorHide();
  siegeParts.aims = aims.map((a) => Object.assign(a, { h: hs[a.name] }));
}
function animateSiegeDefenders(dt) {
  for (const a of siegeParts.aims) {
    const u = a.u, it = a.it, t = u.b.t, M = SIEGE_MUZZLE[t]; if (!a.h) continue;
    if (t === 'spike') { const since = G.time - (u.fireT ?? -9), k = since < 0.5 ? Math.sin(Math.min(1, since / 0.5) * Math.PI) : 0; if (k || a.moving) { a.moving = k > 0; it.sy = 1 + k * 1.8; a.h.dirty = true; } continue; } // the spikes shoot up
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
// builder mode: the field's grid over the land, Clash of Clans style (a checkered tint, thin lines, a stronger line every 5 cells)
function siegeGridOverlay(on) {
  const S = G.siege;
  if (siegeParts.grid) { siegeParts.grid.geometry.dispose(); siegeParts.grid.material.dispose(); siegeParts.grid.removeFromParent(); siegeParts.grid = null; }
  if (!on || !S || !siegeGroup.visible) return;
  const H = S.half, mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uC: { value: new THREE.Vector2(SC.x, SC.z) }, uCs: { value: CFG.siege.cell } },
    vertexShader: 'varying vec2 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `varying vec2 vW; uniform vec2 uC; uniform float uCs;
      void main() { vec2 c = (vW - uC) / uCs, f = fract(c), d = min(f, 1.0 - f); float line = 1.0 - smoothstep(0.0, 0.05, min(d.x, d.y));
        vec2 big = fract(c / 5.0), db = min(big, 1.0 - big); float major = 1.0 - smoothstep(0.0, 0.012, min(db.x, db.y));
        float chk = mod(floor(c.x) + floor(c.y), 2.0);
        gl_FragColor = vec4(mix(vec3(1.0, 1.0, 0.85), vec3(0.08, 0.16, 0.05), max(line, major)), chk * 0.07 + line * 0.22 + major * 0.3); }` });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(H * 2, H * 2).rotateX(-Math.PI / 2), mat); m.position.set(SC.x, 0.06, SC.z); m.renderOrder = 1;
  siegeGroup.add(m); siegeParts.grid = m;
}
function siegePreview(q) {
  const P = siegeParts.preview, cs = CFG.siege.cell;
  if (!q) { if (P) { WorldModels.dispose(P.h); siegeParts.preview = null; } return; }
  const wall = CFG.siege.towers[q.t].wall && q.t === 'wall', name = wall ? 'siege_wall_wood' : SIEGE_MODEL[q.t][0];
  const s = FORT_TYPES[q.t], x = SC.x + (q.x + s / 2) * cs, z = SC.z + (q.z + s / 2) * cs;
  let pv = P;
  if (!pv || pv.name !== name) { // placed where it stands (the streamer loads a set by its distance to the camera)
    if (P) WorldModels.dispose(P.h);
    const it = { x, z, ry: 0, s: 1 }; pv = siegeParts.preview = { name, it, h: WorldModels.place(siegeGroup, name, [it], { ghost: true, far: 999 }) };
  }
  const it = pv.it;
  it.x = x; it.z = z; it.ry = CFG.siege.towers[q.t].trap || q.t === 'gate' || wall ? 0 : Math.atan2(SC.x - x, SC.z - z);
  if (wall) { it.s = 1.8; it.sx = cs / ((WORLD_MODEL_BOX[name] || [2])[0] * 1.8); } else it.s = SIEGE_MODEL[q.t][1];
  pv.h.dirty = true;
  for (const m of pv.h.mats) { m.emissive.setHex(q.ok ? 0x58e08a : 0xff5d6c); m.opacity = 0.45 + Math.sin(siegeParts.t * 5) * 0.08; }
}
function disposeSiegeView() {
  for (const h of siegeParts.sets.concat(siegeParts.bSets)) WorldModels.dispose(h);
  if (siegeParts.preview) { WorldModels.dispose(siegeParts.preview.h); siegeParts.preview = null; }
  siegeParts.grid = null;
  const geos = new Set(), mats = new Set();
  siegeGroup.traverse((o) => { if (o.geometry) geos.add(o.geometry); if (o.material && o.material !== matVC && o.material !== matDungeonFloor) mats.add(o.material); });
  geos.forEach((g) => g.dispose()); mats.forEach((m) => m.dispose());
  siegeGroup.clear(); Object.assign(siegeParts, { sets: [], bSets: [], bGroup: null, aims: [], objItems: [], objSets: [], portal: null, flame: null, ghost: null, gates: null, gateGlow: null, deco: null, motes: null, sig: '' });
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
  const sig = S.units.map((u) => `${u.b.t}${u.b.x},${u.b.z},${u.b.l}${u.b.d > now ? 'u' : ''}${u.alive ? '' : 'x'}${u.spent ? 's' : ''}`).join('|');
  if (sig !== siegeParts.sig) { if (siegeParts.sig) buildSiegeBuildings(); siegeParts.sig = sig; }
  animateSiegeDefenders(dt);
  // the placing ghost: the footprint square plus a see-through copy of the building, green where it fits, red where not
  const gh = siegeParts.ghost, q = fortGhost();
  siegePreview(q);
  if (gh) { gh.visible = !!q; if (q) { const s = FORT_TYPES[q.t], cs = CFG.siege.cell; gh.scale.set(s * cs * 0.96, 1, s * cs * 0.96); gh.position.set(SC.x + (q.x + s / 2) * cs, 0.07, SC.z + (q.z + s / 2) * cs); gh.material.color.set(q.ok ? 0x58e08a : 0xff5d6c); gh.material.opacity = 0.35 + Math.sin(t * 6) * 0.12; } }
  // a fallen objective disappears in smoke
  S.objs.forEach((o, i) => { const it = siegeParts.objItems[i]; if (it && !o.alive && !it.hidden) { it.hidden = true; siegeParts.objSets[i].dirty = true; burst(o.x, 2, o.z, 40, 0x6a5a4a, 7, 1.2, 0.5, 3, 2); } });
  if (siegeParts.flame) siegeParts.flame.material.opacity = 0.75 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.08;
  if (siegeParts.portal) siegeParts.portal.rotation.y = t * 0.8;
  // the motes wander in a 70 m box that follows the camera (wrapped, so none ever pop in front of it)
  if (siegeParts.motes) { const M = siegeParts.motes, a = M.pts.geometry.attributes.position, cx = Cam.look.x, cz = Cam.look.z;
    M.seed.forEach((q, i) => { const x = ((q[0] + t * 0.6 * q[4] + Math.sin(t * 0.4 + q[3]) * 2 - cx) % 70 + 70) % 70 - 35 + cx, z = ((q[1] + t * 0.35 * q[4] - cz) % 70 + 70) % 70 - 35 + cz;
      a.setXYZ(i, x, q[2] + Math.sin(t * 1.3 * q[4] + q[3]) * 0.4, z); });
    a.needsUpdate = true; M.pts.material.opacity = 0.65 + Math.sin(t * 2.1) * 0.15; }
  // tar bubbles while monsters wade through it
  if ((siegeParts.bubT = (siegeParts.bubT || 0) - dt) <= 0) { siegeParts.bubT = 0.35; for (const u of S.units) if (u.b.t === 'tar' && G.time - (u.busy ?? -9) < 0.5) burst(u.x + rand(-0.6, 0.6), 0.3, u.z + rand(-0.6, 0.6), 3, 0x1a1612, 1.2, 0.5, 0.22, -1, 0.6); }
  if (siegeParts.gateGlow) siegeParts.gateGlow.forEach((m, i) => { m.material.opacity = S.sides.includes(i) ? (S.phase === 'fight' ? 0.45 : 0.25 + Math.sin(t * 4) * 0.15) : 0; });
  WorldModels.update();
}
