// Assemble a skinned v4 hero GLB: weights from Blender's bone-heat proxy, bind pose mapped onto the
// KayKit T-pose so the shared adventurer clips drive every hero.
// node tools/v4_assemble.cjs CLEAN.glb JOINTS.json PROXY_WEIGHTS.json OUT.glb
const path = require('node:path'), fs = require('node:fs');
const deps = require('./asset-deps.cjs');
const { NodeIO } = require(path.join(deps, '@gltf-transform/core'));
const JOINTS = ['heroRoot', 'chest', 'head', 'upperarml', 'lowerarml', 'handl', 'upperarmr', 'lowerarmr', 'handr', 'upperlegl', 'lowerlegl', 'footl', 'upperlegr', 'lowerlegr', 'footr'];
const PARENT = { heroRoot: null, chest: 'heroRoot', head: 'chest' };
const CHILD = { heroRoot: 'chest', chest: 'head', head: 'head_top' };
for (const s of 'lr') {
  Object.assign(PARENT, { ['upperarm' + s]: 'chest', ['lowerarm' + s]: 'upperarm' + s, ['hand' + s]: 'lowerarm' + s, ['upperleg' + s]: 'heroRoot', ['lowerleg' + s]: 'upperleg' + s, ['foot' + s]: 'lowerleg' + s });
  Object.assign(CHILD, { ['upperarm' + s]: 'lowerarm' + s, ['lowerarm' + s]: 'hand' + s, ['hand' + s]: 'hand_tip' + s, ['upperleg' + s]: 'lowerleg' + s, ['lowerleg' + s]: 'foot' + s, ['foot' + s]: 'toe' + s });
}
// --- tiny vector/quaternion helpers -------------------------------------------------------
const sub = (a, b) => a.map((v, i) => v - b[i]), len = (a) => Math.hypot(...a), norm = (a) => { const l = len(a) || 1; return a.map((v) => v / l); };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function qFromUnit(a, b) { // shortest rotation taking a to b
  const d = dot(a, b);
  if (d < -0.999999) { let ax = cross([1, 0, 0], a); if (len(ax) < 1e-6) ax = cross([0, 1, 0], a); ax = norm(ax); return [ax[0], ax[1], ax[2], 0]; }
  const c = cross(a, b), q = [c[0], c[1], c[2], 1 + d], l = Math.hypot(...q); return q.map((v) => v / l);
}
const qMul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
const qInv = (q) => [-q[0], -q[1], -q[2], q[3]];
const qRot = (q, v) => { const p = qMul(qMul(q, [v[0], v[1], v[2], 0]), qInv(q)); return [p[0], p[1], p[2]]; };
function mat(q, t) { // column-major 4x4 from rotation + translation
  const [x, y, z, w] = q;
  return [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0, 2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0, 2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0, t[0], t[1], t[2], 1];
}
function invRigid(q, t) { const qi = qInv(q), ti = qRot(qi, t).map((v) => -v); return mat(qi, ti); }

async function main() {
  const [cleanPath, jointsPath, proxyPath, outPath] = process.argv.slice(2);
  const J = JSON.parse(fs.readFileSync(jointsPath, 'utf8')).joints;
  const rest = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/animation/adventurer-clips.json'), 'utf8')).rest;
  const proxy = JSON.parse(fs.readFileSync(proxyPath, 'utf8'));
  const io = new NodeIO(), doc = await io.read(cleanPath);
  const prims = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives());
  if (prims.length !== 1) throw Error('expected one primitive, got ' + prims.length);
  const prim = prims[0], pos = prim.getAttribute('POSITION'), n = pos.getCount();
  const P = Array.from({ length: n }, (_, i) => pos.getElement(i, []));
  // --- weights: inverse-distance from nearby weighted proxy vertices --------------------------
  const direct = Array.isArray(proxy.vertexWeights);
  if (direct && proxy.vertexWeights.length !== n) throw Error('weights/vertex count mismatch');
  const Q = direct ? [] : proxy.verts.filter((v) => v.length > 3), cell = 0.02, grid = new Map(), key = (x, y, z) => x + ',' + y + ',' + z;
  Q.forEach((q, i) => { const k = key(Math.floor(q[0] / cell), Math.floor(q[1] / cell), Math.floor(q[2] / cell)); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
  const jp = (name) => J[name], segs = JOINTS.map((b) => [jp(b === 'heroRoot' ? 'heroRoot' : b) || [0, J.upperlegl[1] - 0.05, J.chest[2]], jp(CHILD[b])]);
  segs[0][0] = [0, J.upperlegl[1] - 0.05, J.chest[2]];
  const W = new Float32Array(n * JOINTS.length);
  let fallback = 0;
  if (direct) proxy.vertexWeights.forEach((row, i) => { for (const [j, w] of row) W[i * JOINTS.length + j] = w; });
  for (let i = 0; i < n && !direct; i++) {
    const p = P[i], cx = Math.floor(p[0] / cell), cy = Math.floor(p[1] / cell), cz = Math.floor(p[2] / cell), cand = [];
    for (let r = 1; r <= 3 && cand.length < 6; r++) {
      cand.length = 0;
      for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) { const g = grid.get(key(cx + dx, cy + dy, cz + dz)); if (g) for (const j of g) cand.push(j); }
    }
    if (cand.length) {
      const near = cand.map((j) => [len(sub(Q[j], p)), j]).sort((a, b) => a[0] - b[0]).slice(0, 6);
      for (const [d, j] of near) { const w = 1 / (d * d + 1e-6); for (const [ji, jw] of Q[j].slice(3)) W[i * JOINTS.length + ji] += w * jw; }
    } else {
      fallback++;
      const ds = segs.map(([a, b]) => { const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1))); return len(sub(p, a.map((v, k) => v + ab[k] * t))); });
      ds.forEach((d, j) => { W[i * JOINTS.length + j] = 1 / Math.pow(d + 1e-3, 4); });
    }
  }
  // --- smoothing along the surface (welded by position) ------------------------------------------
  const wk = new Map(), weld = new Int32Array(n);
  P.forEach((p, i) => { const k = p.map((v) => Math.round(v * 1e5)).join(','); if (!wk.has(k)) wk.set(k, wk.size); weld[i] = wk.get(k); });
  const m = wk.size, nb = Array.from({ length: m }, () => new Set()), idx = prim.getIndices().getArray();
  for (let t = 0; t < idx.length; t += 3) for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) { const u = weld[idx[t + a]], v = weld[idx[t + b]]; if (u !== v) { nb[u].add(v); nb[v].add(u); } }
  let WW = new Float32Array(m * JOINTS.length), cnt = new Float32Array(m);
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < JOINTS.length; j++) s += W[i * JOINTS.length + j]; for (let j = 0; j < JOINTS.length; j++) WW[weld[i] * JOINTS.length + j] += W[i * JOINTS.length + j] / (s || 1); cnt[weld[i]]++; }
  for (let u = 0; u < m; u++) for (let j = 0; j < JOINTS.length; j++) WW[u * JOINTS.length + j] /= cnt[u] || 1;
  for (let it = 0; it < (direct ? 0 : 3); it++) {
    const N = new Float32Array(WW.length);
    for (let u = 0; u < m; u++) { const k = nb[u].size; for (let j = 0; j < JOINTS.length; j++) { let s = 0; for (const v of nb[u]) s += WW[v * JOINTS.length + j]; N[u * JOINTS.length + j] = k ? 0.5 * WW[u * JOINTS.length + j] + 0.5 * s / k : WW[u * JOINTS.length + j]; } }
    WW = N;
  }
  const joints = new Uint8Array(n * 4), weights = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const row = Array.from({ length: JOINTS.length }, (_, j) => [WW[weld[i] * JOINTS.length + j], j]).sort((a, b) => b[0] - a[0]).slice(0, 4).filter((a) => a[0] > 0.01);
    const s = row.reduce((t, a) => t + a[0], 0) || 1;
    row.forEach(([w, j], k) => { joints[i * 4 + k] = j; weights[i * 4 + k] = w / s; });
    if (!row.length) { joints[i * 4] = 0; weights[i * 4] = 1; }
  }
  // --- skeleton in the shared clip convention ---------------------------------------------------
  const worldPos = { heroRoot: [0, J.upperlegl[1], J.chest[2]] };
  for (const b of JOINTS) if (b !== 'heroRoot') worldPos[b] = J[b];
  const worldRot = {};
  for (const b of JOINTS) {
    const to = CHILD[b] === 'chest' ? J.chest : J[CHILD[b]];
    const ours = norm(sub(to, worldPos[b]));
    worldRot[b] = qFromUnit(norm(rest[b]), ours);
  }
  const buffer = doc.getRoot().listBuffers()[0], nodes = {};
  const rig = doc.createNode('rig');
  doc.getRoot().listScenes()[0].addChild(rig);
  for (const b of JOINTS) {
    const p = PARENT[b], pr = p ? worldRot[p] : [0, 0, 0, 1], pp = p ? worldPos[p] : [0, 0, 0];
    const node = doc.createNode(b).setRotation(qMul(qInv(pr), worldRot[b])).setTranslation(qRot(qInv(pr), sub(worldPos[b], pp)));
    (p ? nodes[p] : rig).addChild(node); nodes[b] = node;
  }
  const ibm = new Float32Array(JOINTS.length * 16);
  JOINTS.forEach((b, i) => ibm.set(invRigid(worldRot[b], worldPos[b]), i * 16));
  const skin = doc.createSkin('heroSkin').setSkeleton(nodes.heroRoot).setInverseBindMatrices(doc.createAccessor().setType('MAT4').setArray(ibm).setBuffer(buffer));
  for (const b of JOINTS) skin.addJoint(nodes[b]);
  prim.setAttribute('JOINTS_0', doc.createAccessor().setType('VEC4').setArray(joints).setBuffer(buffer));
  prim.setAttribute('WEIGHTS_0', doc.createAccessor().setType('VEC4').setArray(weights).setBuffer(buffer));
  const meshNode = doc.getRoot().listNodes().find((nd) => nd.getMesh());
  meshNode.setSkin(skin);
  await io.write(outPath, doc);
  const dom = {}; for (let i = 0; i < n; i++) dom[JOINTS[joints[i * 4]]] = (dom[JOINTS[joints[i * 4]]] || 0) + 1;
  console.log(JSON.stringify({ out: outPath, vertices: n, proxyVerts: Q.length, proxyZero: proxy.zero, fallback, dominant: dom }));
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
