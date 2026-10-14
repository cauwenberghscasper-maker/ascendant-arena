// --- world models: generated 3D buildings, caves, ore, dungeon pieces and world bosses --------------------------
// Each model is a TRELLIS.2 mesh from a Z-Image Turbo concept (tools/v10_prop.cjs + tools/v4_pack.py --static),
// normalised to height 1 with its base on y=0 and its front facing +Z. box.json beside it holds width/depth.
// Placements become one InstancedMesh per model and group, so a whole town or dungeon costs a few draw calls.
const WORLD_MODEL_BOX = {
  boss_golem: [1.04, .55], boss_frost: [.99, .51], boss_magma: [1.01, .47], boss_void: [1, .5], boss_abyss: [.91, 1.16], boss_celestial: [.74, .39],
  cave: [1.5, 1.21], ore: [1.4, 1.19], crystal: [1.05, 1.05], chest: [1.46, 1.37], chest_open: [1.13, 1.07], pillar: [.62, .61], brazier: [.86, .84],
  portcullis: [1.06, .56], dwall: [2.24, .48], clutter: [2.44, 2.16], keep: [1.08, 1.07], tower: [.58, .6], gatehouse: [1.28, .63], house_a: [.94, .94], house_b: [.91, .9],
  fountain: [1.25, 1.26], stall: [1.01, 1.29], forge: [1.3, 1.25], arena_gate: [1.19, .61], lodestone: [.72, .72],
};
for (const k in WORLD_MODEL_BOX) ASSET_MANIFEST['world.' + k] = { dir: 'assets/world/' + k + '/', size: 1, world: true,
  source: 'TRELLIS.2 (MIT) from a Z-Image Turbo (Apache-2.0) concept, cleaned with tools/v10_prop.cjs, 13 Oct 2026' };
const WorldModels = {
  sets: [],
  // items: [{ x, y, z, ry, s (uniform) or sx/sy/sz, color }] -> a handle whose items can be moved or hidden later
  place(group, name, items, opts = {}) {
    const id = 'world.' + name, h = { id, group, items, meshes: [], mats: [], ready: false, opts, dirty: true };
    if (!items.length || !AssetLibrary.has(id)) return h;
    AssetLibrary.request(id); this.sets.push(h); this.tryBuild(h); return h;
  },
  tryBuild(h) {
    if (h.ready || h.dead) return;
    const st = AssetLibrary.status(h.id); if (st !== 'ready') return;
    const model = AssetLibrary.entries.get(h.id).model; model.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(model.matrixWorld).invert();
    // world-spanning sets are cut into 60 m bands along the road so the camera (and the shadow camera) skip far ones
    const bands = new Map(); for (const it of h.items) { const k = h.items.length > 6 ? Math.floor(it.z / 60) : 0; if (!bands.has(k)) bands.set(k, []); bands.get(k).push(it); }
    const parts = []; model.traverse((o) => { if (o.isMesh && !o.userData.outline) parts.push(o); });
    for (const o of parts) {
      const local = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), mat = o.material.clone();
      if (h.opts.glow) { mat.emissive = new THREE.Color(h.opts.glow); mat.emissiveIntensity = h.opts.glowK || 0.35; if (mat.map) mat.emissiveMap = mat.map; }
      if (h.opts.bright) mat.color.multiplyScalar(h.opts.bright);
      h.mats.push(mat);
      for (const items of bands.values()) {
        const im = new THREE.InstancedMesh(o.geometry, mat, items.length); im.userData.local = local; im.userData.items = items;
        im.castShadow = h.opts.shadow !== false; im.receiveShadow = true; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        im.name = 'World model / ' + h.id; h.group.add(im); h.meshes.push(im);
      }
    }
    h.ready = true; h.dirty = true; this.sync(h);
  },
  sync(h) {
    if (!h.ready || !h.dirty) return; h.dirty = false;
    for (const im of h.meshes) {
      im.userData.items.forEach((it, i) => {
        _e.set(it.rx || 0, it.ry || 0, it.rz || 0); _q.setFromEuler(_e);
        const s = it.hidden ? 0.0001 : it.s || 1;
        _m4.compose(_v3.set(it.x, it.y || 0, it.z), _q, _s3.set((it.sx || 1) * s, (it.sy || 1) * s, (it.sz || 1) * s));
        _wm.multiplyMatrices(_m4, im.userData.local); im.setMatrixAt(i, _wm); if (it.color != null) im.setColorAt(i, _col.set(it.color));
      });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.computeBoundingSphere();
    }
  },
  update() {
    for (const h of this.sets) { if (!h.ready) this.tryBuild(h); else if (h.dirty) this.sync(h); }
    // bands beyond the fog are skipped entirely (main and shadow pass)
    const cx = camera.position.x, cz = camera.position.z, far = (Q.lowTier ? 95 : 140) + 20;
    for (const h of this.sets) for (const im of h.meshes) { const b = im.boundingSphere; if (b) im.visible = Math.hypot(b.center.x - cx, b.center.z - cz) - b.radius < far; }
  },
  // free a handle's instance buffers and materials (the model's geometry and textures stay cached)
  dispose(h) {
    if (!h) return; h.dead = true;
    for (const im of h.meshes) { im.removeFromParent(); im.dispose(); }
    for (const m of h.mats) m.dispose();
    h.meshes = []; h.mats = []; this.sets = this.sets.filter((x) => x !== h);
  },
  // footprint half-size of a model at scale s
  half(name, s) { const b = WORLD_MODEL_BOX[name] || [1, 1]; return [b[0] * s / 2, b[1] * s / 2]; },
};
const _wm = new THREE.Matrix4();
