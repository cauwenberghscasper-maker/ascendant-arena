// Measured joints for the existing forest meshes, in body-height units (feet = 0).
// Rig the cached asset once; instances share vertex buffers and own their bones.
// No replacement meshes, new textures, shader overrides or simulation state.
export const ENEMY_RIGS = {
  'enemy.wolf': { shoulder: [.255, .60, .10], elbow: [.34, .37, .13], leg: [.15, .20, .14], cut: .4, legTop: .16, stride: .52, reach: .9 },
  'world.boss_golem': { shoulder: [.265, .67, -.015], elbow: [.36, .43, .005], leg: [.15, .285, 0], cut: .59, legTop: .22, stride: .32, reach: 1 },
};
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Separate arms below a reviewed shoulder cut, then blend over the welded surface.
// The quantized meshes duplicate UV seams; weld within 0.1% of body height.
function armFields(geometry, points, spec) {
  const weld = new Map(), verts = [], ids = [], links = [];
  points.forEach((p, i) => {
    const key = p.map(x => Math.round(x * 1000)).join(',');
    if (!weld.has(key)) { weld.set(key, verts.length); verts.push(p); links.push(new Set()); }
    ids[i] = weld.get(key);
  });
  const idx = geometry.index, count = idx ? idx.count : points.length, at = k => ids[idx ? idx.getX(k) : k];
  for (let i = 0; i < count; i += 3) for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) { const u = at(i + a), v = at(i + b); links[u].add(v); links[v].add(u); }
  const labels = new Int32Array(verts.length).fill(-1), components = [];
  verts.forEach((p, i) => {
    if (p[1] >= spec.cut || labels[i] >= 0) return;
    const list = [i], id = components.length; labels[i] = id;
    for (let k = 0; k < list.length; k++) for (const v of links[list[k]]) if (labels[v] < 0 && verts[v][1] < spec.cut) { labels[v] = id; list.push(v); }
    components.push(list);
  });
  const fields = [];
  for (const side of [-1, 1]) {
    const armLabels = new Set();
    components.forEach((list, id) => {
      if (list.length > 20 && list.every(i => verts[i][0] * side > .08 && verts[i][1] > .08)) armLabels.add(id);
    });
    if (!armLabels.size) return null;
    let f = Float32Array.from(labels, id => armLabels.has(id) ? 1 : 0), next = new Float32Array(verts.length);
    for (let pass = 0; pass < 64; pass++) {
      next.set(f);
      verts.forEach((p, i) => {
        if (p[1] < spec.cut || p[1] > spec.shoulder[1] + .06) return;
        let sum = 0; for (const j of links[i]) sum += f[j];
        if (links[i].size) next[i] = sum / links[i].size;
      });
      [f, next] = [next, f];
    }
    fields.push(ids.map(i => f[i]));
  }
  return fields;
}

export function rigEnemyModel(T, scene, id) {
  const spec = ENEMY_RIGS[id]; if (!spec) return;
  const meshes = []; scene.traverse(o => { if (o.isMesh && !o.isSkinnedMesh) meshes.push(o); });
  // These reviewed assets each contain one mesh. Do not guess for a changed asset.
  if (meshes.length !== 1) return;
  const mesh = meshes[0], source = mesh.geometry, pos = source.attributes.position;
  source.computeBoundingBox(); const box = source.boundingBox, h = box.max.y - box.min.y;
  if (!(h > 0)) return;
  const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
  const points = Array.from({ length: pos.count }, (_, i) => [(pos.getX(i) - cx) / h, (pos.getY(i) - box.min.y) / h, (pos.getZ(i) - cz) / h]);
  const fields = armFields(source, points, spec); if (!fields) return;
  const geometry = source.clone(), joints = new Uint16Array(pos.count * 4), weights = new Float32Array(pos.count * 4);
  const counts = [0, 0, 0, 0];
  points.forEach((p, i) => {
    const side = p[0] < 0 ? 0 : 1, arm = Math.min(1, fields[side][i]), elbow = 1 - smooth(spec.elbow[1] - .03, spec.elbow[1] + .055, p[1]);
    const leg = (1 - arm) * (1 - smooth(spec.legTop - .05, spec.legTop + .035, p[1]));
    const row = [[0, 1 - arm - leg], [1 + side * 2, arm * (1 - elbow)], [2 + side * 2, arm * elbow], [5 + side, leg]];
    row.forEach(([joint, weight], k) => { joints[i * 4 + k] = joint; weights[i * 4 + k] = weight; });
    if (arm > .5) counts[side]++; if (leg > .5) counts[2 + side]++;
  });
  if (counts.some(n => n < 20)) { geometry.dispose(); return; }
  geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  const body = new T.SkinnedMesh(geometry, mesh.material); body.name = mesh.name;
  body.position.copy(mesh.position); body.quaternion.copy(mesh.quaternion); body.scale.copy(mesh.scale);
  const root = new T.Bone(); root.name = 'enemyRoot'; body.add(root); const bones = [root];
  for (let side = 0; side < 2; side++) {
    const sign = side ? 1 : -1, upper = new T.Bone(), lower = new T.Bone();
    upper.name = 'enemyArm' + side; lower.name = 'enemyElbow' + side;
    upper.position.set(cx + sign * spec.shoulder[0] * h, box.min.y + spec.shoulder[1] * h, cz + spec.shoulder[2] * h);
    lower.position.set(sign * (spec.elbow[0] - spec.shoulder[0]) * h, (spec.elbow[1] - spec.shoulder[1]) * h, (spec.elbow[2] - spec.shoulder[2]) * h);
    root.add(upper); upper.add(lower); bones.push(upper, lower);
  }
  for (let side = 0; side < 2; side++) {
    const bone = new T.Bone(); bone.name = 'enemyLeg' + side;
    bone.position.set(cx + (side ? 1 : -1) * spec.leg[0] * h, box.min.y + spec.leg[1] * h, cz + spec.leg[2] * h);
    root.add(bone); bones.push(bone);
  }
  const parent = mesh.parent; parent.add(body); parent.remove(mesh);
  body.updateWorldMatrix(true, true); body.bind(new T.Skeleton(bones)); body.frustumCulled = false;
  body.userData.enemyRig = id; body.userData.limbVertices = counts;
}

export function createEnemyMotion(model) {
  let mesh; model.traverse(o => { if (o.isSkinnedMesh && o.userData.enemyRig) mesh = o; });
  if (!mesh) return null;
  const spec = ENEMY_RIGS[mesh.userData.enemyRig], bone = name => mesh.skeleton.bones.find(b => b.name === name);
  const arms = [bone('enemyArm0'), bone('enemyArm1')], elbows = [bone('enemyElbow0'), bone('enemyElbow1')], legs = [bone('enemyLeg0'), bone('enemyLeg1')];
  let walk = 0;
  return {
    update(e, dt, t, phase, kind, wind = 0, strike = 0) {
      // Broad, eased anticipation and a held follow-through; attack timing stays in the simulation.
      wind = wind * wind * (3 - 2 * wind); strike = Math.sin(strike * Math.PI / 2);
      const alive = e.alive !== false && !e.hidden, moving = alive && !(wind > 0) && !(strike > .1) ? Math.max(0, Math.min(1, e.moveAmt || 0)) : 0;
      walk += (moving - walk) * (1 - Math.exp(-Math.max(0, dt) * 14));
      const breathe = alive ? Math.sin(t * 1.8 + phase * .1) * .025 : 0;
      for (let i = 0; i < 2; i++) {
        const side = i ? 1 : -1, swing = Math.sin(phase) * side * walk * spec.stride;
        let lift = 0, bend = .08 + breathe, spread = .025 + breathe * .4;
        if (alive) {
          if (kind === 'slam') { lift = -1.85 * wind + .65 * strike; bend += .25 * wind + .15 * strike; }
          else if (kind === 'swing') { lift = (i ? -.9 : -.35) * wind + (i ? -1.25 : -.5) * strike; spread += side * (.35 * wind - .3 * strike); bend += .25 * wind; }
          else if (kind === 'recoil' || kind === 'breath') { lift = -.6 * wind - .8 * strike; bend += .4 * wind + .25 * strike; }
          else if (kind === 'pulse') { lift = -1.15 * wind - .8 * strike; spread += .45 * wind + .3 * strike; }
          else { lift = -.45 * wind - .95 * strike; bend += .2 * wind; }
        }
        arms[i].rotation.set(swing + lift * spec.reach, 0, side * spread);
        elbows[i].rotation.set(-bend, 0, 0);
        legs[i].rotation.set(-swing * .75, 0, 0);
      }
    },
  };
}
