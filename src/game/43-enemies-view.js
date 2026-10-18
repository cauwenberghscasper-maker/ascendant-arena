// --- enemies: generated 3D bodies only (assets/enemy/), recoloured per species ---

// v9 monsters share sculpted bodies: recolour the texture toward the monster's own tint (keeps its shading)
function tintMonsterMaterial(m, tint, k) {
  const u = { uTint: { value: tint.clone() }, uTintK: { value: k } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uTint; uniform float uTintK;')
      .replace('#include <map_fragment>', '#include <map_fragment>\n  { float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)); diffuseColor.rgb = mix(diffuseColor.rgb, uTint * (0.3 + lum * 1.45), uTintK); }')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  float rimF = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.6);\n  totalEmissiveRadiance += vec3(1.0, 0.97, 0.9) * rimF * 0.40;');
  };
  m.customProgramCacheKey = () => 'rimtint';
  m.needsUpdate = true;
}
// per move: [pitch, lift, twist, stretch] reached at the end of the wind-up
const POSE_REAR = [-0.45, 0.35, 0, 0.1], POSE_LEAN = [-0.4, 0.25, 0, 0.14], POSE_COIL = [0.25, -0.18, 0, -0.22];
const MOVE_POSE = { slam: POSE_REAR, quake: POSE_REAR, ripple: POSE_REAR, cross: [-0.35, 0.3, 0, 0.12], cleave: [-0.2, 0.1, 0.9, 0.05], flurry: [-0.15, 0.1, 1.1, 0.04], sweep: [-0.1, 0.05, -1.5, 0.03],
  pounce: POSE_COIL, ambush: [0.3, -0.25, 0, -0.35], burrow: [0.1, -0.8, 0, -0.3], beam: POSE_LEAN, snipe: POSE_LEAN, fan: POSE_LEAN, boomerang: [-0.3, 0.2, 0.7, 0.08], nova: [-0.1, 0.4, 0, 0.18], spiral: [-0.1, 0.35, 0.6, 0.12],
  rain: [-0.5, 0.45, 0, 0.12], mortar: POSE_LEAN, breath: [-0.5, 0.2, 0, 0.16], zap: POSE_LEAN, vortex: [-0.3, 0.4, 0, 0.1], trap: POSE_LEAN, pool: [0.15, 0, 0, -0.1] };
AssetSlots.register('enemy', (o) => {
  const root = new THREE.Group();
  const ED = CFG.enemies[o.type] || {}, bt = enemyBase(o.type), tint = ED.tint != null ? new THREE.Color(ED.tint) : null, esz = ED.scale || 1;
  const shadow = new THREE.Mesh(geoShadow, matShadow); shadow.scale.setScalar((bt === 'wolf' || bt === 'beetle' ? 0.9 : 0.75) * esz); shadow.position.y = 0.03; root.add(shadow);
  const pivot = new THREE.Group(); root.add(pivot);
  const mat = flashMaterial();
  // every monster is a little different: tint and size vary per spawn
  const vs = (0.9 + Math.random() * 0.2) * esz, tj = Math.random() * 0.16; mat.color.setRGB(1 - tj * 0.6, 1 - tj * 0.2, 1 - tj); if (tint) mat.color.lerp(tint, 0.6);
  // the species' sculpted body; a missing file falls back to another monster model, never to primitives
  const queue = ['enemy.' + bt, 'enemy.slime', 'enemy.wolf'].filter((id, i, a) => AssetLibrary.has(id) && a.indexOf(id) === i);
  let model = null, popT = 0;
  const swapModel = () => {
    while (queue.length) {
      const id = queue[0], st = AssetLibrary.status(id);
      if (st === 'none') AssetLibrary.request(id);
      if (st === 'failed') { queue.shift(); continue; }
      if (st !== 'ready') return;
      queue.length = 0; model = AssetLibrary.instance(id); pivot.add(model); popT = 0.001;
      if (tint) for (const m of model.userData.mats) tintMonsterMaterial(m, tint, ED.tintK || 0.72);
    }
  };
  swapModel();
  let aura = null;
  if (o.elite) {
    aura = pxRingMesh(0.88, 1.05, { color: 0xffc94a, transparent: true, opacity: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -40 }, 8, 0.62); aura.position.y = 0.25; root.add(aura);
  }
  let phase = Math.random() * 6, deadT = 0;
  return {
    root,
    update(e, dt, t) {
      root.position.set(e.x, 0, e.z);
      if (!model) swapModel();
      if (popT > 0 && popT < 1) popT = Math.min(1, popT + dt * 5);
      root.rotation.y += angDiff(root.rotation.y, e.facing) * (1 - Math.exp(-dt * 10));
      phase += dt * (2 + (e.moveAmt || 0) * 8);
      pivot.rotation.set(0, 0, 0); pivot.scale.set(1, 1, 1); // the move pose below adds to (and stretches) whatever the body animation sets, so both reset every frame
      if (bt === 'slime') { const b = Math.abs(Math.sin(phase)); pivot.scale.set(1 + (1 - b) * 0.18, 0.8 + b * 0.3, 1 + (1 - b) * 0.18); pivot.position.y = b * 0.25 * (e.moveAmt || 0.2); }
      else if (bt === 'wolf') { pivot.position.y = Math.abs(Math.sin(phase)) * 0.12 * (e.moveAmt || 0); pivot.rotation.x = (e.attackAnim || 0) * -0.3; }
      else if (bt === 'beetle') { pivot.position.y = Math.abs(Math.sin(phase * 2)) * 0.05 * (e.moveAmt || 0); pivot.rotation.x = e.windT > 0 ? -0.25 + Math.sin(t * 40) * 0.05 : 0; pivot.rotation.z = Math.sin(phase * 2) * 0.04 * (e.moveAmt || 0); }
      else if (bt === 'wraith') { pivot.position.y = Math.sin(t * 2.2 + phase) * 0.25 + 0.35; pivot.rotation.x = 0.1 + (e.attackAnim || 0) * -0.3; }
      else if (bt === 'boar') { pivot.position.y = Math.abs(Math.sin(phase * 1.5)) * 0.1 * (e.moveAmt || 0); pivot.rotation.x = e.windT > 0 ? -0.2 + Math.sin(t * 40) * 0.04 : 0; }
      else if (bt === 'spider') { pivot.position.y = Math.abs(Math.sin(phase * 2.5)) * 0.05; pivot.rotation.z = Math.sin(phase * 2.5) * 0.06 * (e.moveAmt || 0); }
      else if (bt === 'yeti') { pivot.position.y = Math.abs(Math.sin(phase * 0.8)) * 0.15 * (e.moveAmt || 0); pivot.rotation.x = (e.attackAnim || 0) * -0.35; pivot.rotation.z = Math.sin(phase * 0.8) * 0.06 * (e.moveAmt || 0); }
      else if (bt === 'crawler') { pivot.position.y = Math.abs(Math.sin(phase * 3)) * 0.04; pivot.rotation.z = Math.sin(phase * 3) * 0.08 * (e.moveAmt || 0); pivot.rotation.x = (e.attackAnim || 0) * -0.25; }
      else if (bt === 'drowned') { pivot.position.y = Math.sin(t * 1.9 + phase) * 0.22 + 0.3; pivot.rotation.z = Math.sin(t * 1.3 + phase) * 0.1; pivot.rotation.x = 0.1 + (e.attackAnim || 0) * -0.3; }
      else if (bt === 'seraph') { pivot.position.y = Math.sin(t * 2.4 + phase) * 0.25 + 0.35; pivot.rotation.x = (e.attackAnim || 0) * -0.3; }
      else if (bt === 'warden') { pivot.position.y = Math.abs(Math.sin(phase * 0.8)) * 0.1 * (e.moveAmt || 0); pivot.rotation.x = e.windT > 0 ? -0.22 + Math.sin(t * 40) * 0.04 : (e.attackAnim || 0) * -0.3; }
      else if (bt === 'sentinel') { pivot.position.y = Math.sin(t * 1.6 + phase) * 0.2 + 0.25; pivot.rotation.y = t * 0.8; }
      else { pivot.position.y = Math.sin(t * 3 + phase) * 0.2 + 0.2; pivot.rotation.z = Math.sin(t * 2 + phase) * 0.08; }
      // wind-up poses: each move has its own telegraph in the body (rear up, coil, lean back, wind the arms), eased in as the marker fills
      if (e.windK && e.windT > 0) {
        const wp = clamp(1 - e.windT / (e.windMax || 1), 0, 1), ez = wp * wp * (3 - 2 * wp), P = MOVE_POSE[e.windK] || MOVE_POSE.slam;
        pivot.rotation.x += P[0] * ez; pivot.position.y += P[1] * ez; pivot.rotation.y += P[2] * ez; pivot.scale.y *= 1 + P[3] * ez; pivot.scale.x *= 1 - P[3] * 0.5 * ez; pivot.scale.z *= 1 - P[3] * 0.5 * ez;
        if (Math.random() < 0.25 * wp * fxK) burst(e.x + (Math.random() - 0.5) * e.r * 2, 0.15, e.z + (Math.random() - 0.5) * e.r * 2, 1, BIOME_TINT[areaBiome(e.zone)] || 0xffffff, 1.2, 0.35, 0.2, -0.4, 1.4);
      }
      const f = e.flashT > 0 ? 0.9 : 0;
      if (e.windT > 0) { const w = 0.45 + Math.abs(Math.sin(t * 22)) * 0.5; mat.emissive.setRGB(w + f, 0.08 + f, f); }
      else if (e.invulnT > 0) mat.emissive.setRGB(0.15 + f, 0.55 + f, 0.85 + f);
      else if (e.slowT > 0) mat.emissive.setRGB(f, 0.15 + f, 0.4 + f); else if (e.burnT > 0) mat.emissive.setRGB(0.35 + f, 0.1 + f, f); else mat.emissive.setRGB(f, f, f);
      if (model) AssetLibrary.flash(model, mat.emissive.r * 0.7, mat.emissive.g * 0.7, mat.emissive.b * 0.7);
      const s = (0.9 + Math.min(0.25, (e.lvl - 1) * 0.004)) * (e.elite ? 1.35 : 1) * vs;
      if (aura) { aura.scale.setScalar(1.3 + Math.sin(t * 4) * 0.08); aura.material.opacity = 0.35 + Math.sin(t * 4) * 0.15; }
      const pop = popT > 0 && popT < 1 ? 0.6 + 0.4 * (1 - Math.pow(1 - popT, 3)) : 1;
      if (!e.alive) { deadT += dt; const k = Math.max(0, 1 - deadT * 3); root.scale.setScalar(s * k); root.visible = k > 0; }
      else { deadT = 0; root.scale.setScalar(s * pop); root.visible = !e.hidden; } // hidden: burrowed (a burrow move's marker shows where it is)
      if (e.hidden && Math.random() < 0.3 * fxK) burst(e.x + (Math.random() - 0.5), 0.2, e.z + (Math.random() - 0.5), 1, 0x9a8a6a, 1.2, 0.4, 0.25, 6, 2);
    },
    dispose() { AssetLibrary.disposeInstance(model); mat.dispose(); if (aura) aura.material.dispose(); },
  };
});

// World bosses: one generated titan per biome (golem, frost colossus, magma titan, void colossus, leviathan, celestial colossus)
AssetSlots.register('boss', (o) => {
  const BOSS_MODELS = ['boss_golem', 'boss_frost', 'boss_magma', 'boss_void', 'boss_abyss', 'boss_celestial'];
  const zi = o.zone || 0, Z = CFG.world.zones[zi] || CFG.world.zones[0];
  const root = new THREE.Group();
  const shadow = new THREE.Mesh(geoShadow, matShadow); shadow.scale.setScalar(3.1); shadow.position.y = 0.04; root.add(shadow);
  const runeMat = new THREE.MeshBasicMaterial({ color: Z.coreColor, transparent: true, opacity: 0.5, depthWrite: false });
  const rune = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.5, 6, 1).rotateX(-Math.PI / 2), runeMat); rune.position.y = 0.06; root.add(rune);
  const rune2 = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.55, 48).rotateX(-Math.PI / 2), runeMat); rune2.position.y = 0.06; root.add(rune2);
  const pivot = new THREE.Group(); root.add(pivot);
  const wardMat = new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0, depthWrite: false, wireframe: false, side: THREE.DoubleSide });
  const wardDome = new THREE.Mesh(new THREE.SphereGeometry(5.2, 24, 16), wardMat); wardDome.position.y = 4.2; wardDome.visible = false; root.add(wardDome);
  const queue = ['world.' + (BOSS_MODELS[Z.biome] || BOSS_MODELS[0]), 'world.boss_golem'].filter((id, i, a) => AssetLibrary.has(id) && a.indexOf(id) === i);
  let model = null; const tint = new THREE.Color();
  const swap = () => {
    while (queue.length) {
      const id = queue[0], st = AssetLibrary.status(id);
      if (st === 'none') AssetLibrary.request(id);
      if (st === 'failed') { queue.shift(); continue; }
      if (st !== 'ready') return;
      queue.length = 0; model = AssetLibrary.instance(id); model.scale.setScalar(7.2); pivot.add(model);
      for (const m of model.userData.mats) { addRimLight(m, 0.45); if (m.map && !m.emissiveMap) { m.emissiveMap = m.map; m.emissive.set(Z.coreColor); m.emissiveIntensity = 0.12; m.userData.baseEmissive = m.emissive.getHex(); m.userData.baseEmissiveI = 0.12; } m.needsUpdate = true; }
    }
  };
  swap();
  let phase = 0, spawnT = 0;
  return {
    root,
    update(b, dt, t) {
      // Showcase hides existing world views. Restore live bosses when combat resumes.
      root.visible = b.alive !== false;
      if (!model) swap();
      // A boss may spawn while showcase suppresses its view. Use simulation age
      // so returning to combat cannot restart the rise underneath an attacking boss.
      spawnT = b.spawnT != null && Number.isFinite(G.time) ? clamp((G.time - b.spawnT) * 0.8, 0, 1) : Math.min(1, spawnT + dt * 0.8);
      root.position.set(b.x, -3.5 * (1 - spawnT) - (b.retreat != null ? 4.5 * (1 - Math.max(0, b.retreat) / 2.5) : 0), b.z);
      root.rotation.y += angDiff(root.rotation.y, b.facing) * (1 - Math.exp(-dt * 4));
      phase += dt * (1 + b.moveAmt * 4);
      const atk = b.attackAnim || 0;
      // heavy stomp: sway while walking; every named cast has its own body pose (rear, lean, twist, arms up) over its 1.6 s
      const cu = b.castT > 0 ? 1 - b.castT / (b.castMax || 1.6) : -1, ck = b.castK;
      let pitch = atk > 0.5 ? -(1 - atk) * 0.5 : atk * 0.35, lift = 0, twist = 0, grow = 0;
      if (cu >= 0) {
        const up = Math.sin(Math.min(1, cu / 0.55) * Math.PI / 2), hit = cu > 0.55 ? Math.sin(Math.min(1, (cu - 0.55) / 0.2) * Math.PI) : 0;
        if (ck === 'plates' || ck === 'soak' || ck === 'spread' || ck === 'wardEnd') { pitch = -0.35 * up; lift = 0.9 * up; grow = 0.07 * up; twist = Math.sin(t * 30) * 0.03 * up; }
        else if (ck === 'sweep' || ck === 'beams') { pitch = -0.1 * up; twist = (cu < 0.55 ? -0.7 * up : -0.7 + 1.4 * Math.min(1, (cu - 0.55) / 0.35)); lift = 0.2 * up; }
        else if (ck === 'fan' || ck === 'wells') { pitch = -0.3 * up + 0.5 * hit; lift = 0.3 * up; grow = 0.04 * up; }
        else { pitch = -0.55 * up + 0.95 * hit; lift = 0.7 * up - 0.5 * hit; grow = -0.03 * hit; } // slam / lanes / ripple / rain / rocks: rear up, then crash down
      }
      const ph = b.phase || 1;
      pivot.position.y = Math.abs(Math.sin(phase)) * 0.18 * b.moveAmt + Math.sin(t * 1.5) * 0.05 + lift;
      pivot.rotation.z = Math.sin(phase) * 0.05 * b.moveAmt;
      pivot.rotation.x += (pitch - pivot.rotation.x) * (1 - Math.exp(-dt * 14)); pivot.rotation.y += (twist - pivot.rotation.y) * (1 - Math.exp(-dt * 12));
      const sc = 1 + (ph - 1) * 0.035 + grow; // it swells a little with every phase
      pivot.scale.set(sc * (1 + atk * 0.04), sc * (1 - atk * 0.05), sc * (1 + atk * 0.04));
      const f = b.flashT > 0 ? 0.6 : 0; tint.setRGB(f, f * 0.8, f * 0.6);
      if (b.vuln > 0) { const q = 0.25 + 0.2 * Math.sin(t * 14); tint.setRGB(tint.r + q, tint.g + q * 0.85, tint.b + q * 0.3); } // exposed after the wards break: glows gold
      if (model) AssetLibrary.flash(model, tint.r, tint.g, tint.b);
      // the core burns hotter each phase, and flickers red when enraged
      if (model) for (const m of model.userData.mats) if (m.userData.baseEmissiveI != null) { m.emissiveIntensity = m.userData.baseEmissiveI * (1 + (ph - 1) * 1.6) + (ph === 3 ? 0.25 + 0.15 * Math.sin(t * 9) : 0) + (cu >= 0 ? 0.5 * Math.sin(Math.min(1, cu * 1.4) * Math.PI) : 0); }
      // ward shield: a pale dome around the boss while its wards stand
      const warded = !!b.ward; wardMat.opacity += ((warded ? 0.28 + Math.sin(t * 6) * 0.07 : 0) - wardMat.opacity) * (1 - Math.exp(-dt * 8));
      wardDome.visible = wardMat.opacity > 0.01; if (b.ward) wardMat.color.setHex(b.ward.col); wardDome.rotation.y = t * 0.6; wardDome.scale.setScalar(1 + Math.sin(t * 3) * 0.02);
      const pulse = 0.75 + Math.sin(t * 4) * 0.25 + (ph - 1) * 0.15;
      rune.rotation.y = t * (0.4 + (ph - 1) * 0.35); rune2.rotation.y = -t * (0.25 + (ph - 1) * 0.3); runeMat.opacity = 0.3 + pulse * 0.25;
    },
    dispose() { AssetLibrary.disposeInstance(model); runeMat.dispose(); wardMat.dispose(); wardDome.geometry.dispose(); rune.geometry.dispose(); rune2.geometry.dispose(); },
  };
});

AssetSlots.register('npc', (o) => {
  const v = AssetSlots.create('character', { model: 'npc.' + o.id });
  const marker = new THREE.Group();
  const mm = new THREE.MeshBasicMaterial({ color: 0xffd34a });
  const bar = new THREE.Mesh(GEO.box, mm); bar.scale.set(0.16, 0.5, 0.16); bar.position.y = 0.36;
  const dot = new THREE.Mesh(GEO.box, mm); dot.scale.set(0.16, 0.16, 0.16);
  marker.add(bar, dot); marker.position.y = 2.75; v.root.add(marker);
  const baseUpdate = v.update;
  v.update = (n, dt, t) => {
    // townsfolk turn to face you when you come close, then drift back to the plaza
    const pl = G.player; if (pl && n.home == null) n.home = n.facing;
    if (pl) { const d = Math.hypot(pl.x - n.x, pl.z - n.z); n.facing = d < 7 ? Math.atan2(pl.x - n.x, pl.z - n.z) : n.home; }
    baseUpdate(n, dt, t);
    const st = npcMarkerState(n.def);
    marker.visible = st !== 'none';
    mm.color.setHex(st === 'turnin' ? 0x58e08a : st === 'arena' ? 0xff6b6b : st === 'smith' ? 0x9fd7ff : 0xffd34a);
    marker.position.y = 2.75 + Math.sin(t * 3) * 0.12; marker.rotation.y = t * 1.5;
  };
  const baseDispose = v.dispose; v.dispose = () => { baseDispose(); mm.dispose(); };
  return v;
});
function npcMarkerState(def) {
  const p = G.profile;
  if (def.role === 'arena') return 'arena';
  if (def.role === 'smith') return 'smith';
  if (p.job && p.job.npc === def.id && p.job.progress >= p.job.count) return 'turnin';
  if (!p.job && p.level >= def.minLevel && def.jobs.length) return 'job';
  return 'none';
}

