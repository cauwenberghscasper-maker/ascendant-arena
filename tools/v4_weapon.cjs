// Normalise a TRELLIS weapon for a hero's hand: grip at the origin, the weapon's long axis along +Y
// (blade, barrel or staff head pointing +Y), length 1, simplified for phones.
// node tools/v4_weapon.cjs IN.glb OUT.glb GRIP_END GRIP_AT [ROLL_DEG] [TRIANGLES]
//   GRIP_END: which end of the long axis holds the grip in the concept image: low|high|left|right
//   (append ':y' to the end, e.g. low:y, to force the long axis to the image's vertical)
//   GRIP_AT: grip position as a fraction of the length measured from that end (0.1 sword, 0.5 bow)
const path = require('node:path');
const deps = require('./asset-deps.cjs');
const { NodeIO } = require(path.join(deps, '@gltf-transform/core'));
const { weld, simplify, prune, dedup } = require(path.join(deps, '@gltf-transform/functions'));
const { MeshoptSimplifier } = require(path.join(deps, 'meshoptimizer'));

const sub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l); };

function principalAxis(P, c) { // power iteration on the covariance
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const p of P) { const d = sub(p, c); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i][j] += d[i] * d[j]; }
  let v = [0.3, 1, 0.2];
  for (let k = 0; k < 60; k++) v = norm([dot(C[0], v), dot(C[1], v), dot(C[2], v)]);
  return v;
}

(async () => {
  const [src, out, end, atArg, rollArg, budgetArg] = process.argv.slice(2);
  const at = Number(atArg), roll = Number(rollArg || 0) * Math.PI / 180, budget = Number(budgetArg || 5000);
  await MeshoptSimplifier.ready;
  const io = new NodeIO(), doc = await io.read(src);
  const prims = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives());
  const P = [];
  for (const p of prims) { const a = p.getAttribute('POSITION'); for (let i = 0; i < a.getCount(); i++) P.push(a.getElement(i, [])); }
  const c = P.reduce((s, p) => s.map((v, i) => v + p[i] / P.length), [0, 0, 0]);
  const [endName, force] = end.split(':');
  let ax = force === 'y' ? [0, 1, 0] : force === 'x' ? [1, 0, 0] : principalAxis(P, c);
  // orient the axis away from the grip end
  const want = { low: [0, 1, 0], high: [0, -1, 0], left: [1, 0, 0], right: [-1, 0, 0] }[endName];
  if (!want) throw Error('GRIP_END must be low|high|left|right');
  if (dot(ax, want) < 0) ax = ax.map((v) => -v);
  const t = P.map((p) => dot(sub(p, c), ax)), tmin = Math.min(...t), tmax = Math.max(...t), L = tmax - tmin;
  const grip = c.map((v, i) => v + ax[i] * (tmin + at * L));
  // basis: Y = axis, Z = the side that faced the concept camera (+Z), X completes it
  let z = sub([0, 0, 1], ax.map((v) => v * ax[2]));
  if (Math.hypot(...z) < 1e-3) z = sub([1, 0, 0], ax.map((v) => v * ax[0]));
  z = norm(z);
  let x = cross(ax, z);
  // optional roll about the long axis
  const cr = Math.cos(roll), sr = Math.sin(roll);
  [x, z] = [x.map((v, i) => v * cr - z[i] * sr), x.map((v, i) => v * sr + z[i] * cr)];
  const s = 1 / L;
  const toLocal = (p) => { const d = sub(p, grip); return [dot(d, x) * s, dot(d, ax) * s, dot(d, z) * s]; };
  const toLocalN = (n) => norm([dot(n, x), dot(n, ax), dot(n, z)]);
  for (const p of prims) {
    const a = p.getAttribute('POSITION'), arr = a.getArray();
    for (let i = 0; i < a.getCount(); i++) arr.set(toLocal(a.getElement(i, [])), i * 3);
    a.setArray(arr);
    const n = p.getAttribute('NORMAL');
    if (n) { const na = n.getArray(); for (let i = 0; i < n.getCount(); i++) na.set(toLocalN(n.getElement(i, [])), i * 3); n.setArray(na); }
  }
  for (const node of doc.getRoot().listNodes()) node.setTranslation([0, 0, 0]).setRotation([0, 0, 0, 1]).setScale([1, 1, 1]);
  await doc.transform(weld({}));
  // drop floating debris (string fragments, sparks): components under 3% of the triangles
  for (const p of doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives())) {
    const pos = p.getAttribute('POSITION'), ix = Array.from(p.getIndices().getArray()), n = pos.getCount();
    const key = new Map(), id = new Int32Array(n);
    for (let i = 0; i < n; i++) { const k = pos.getElement(i, []).map((v) => Math.round(v * 1e4)).join(','); if (!key.has(k)) key.set(k, key.size); id[i] = key.get(k); }
    const par = Int32Array.from({ length: key.size }, (_, i) => i), find = (a) => { while (par[a] !== a) a = par[a] = par[par[a]]; return a; };
    for (let t = 0; t < ix.length; t += 3) { const a = find(id[ix[t]]), b = find(id[ix[t + 1]]), c2 = find(id[ix[t + 2]]); par[b] = a; par[find(c2)] = a; }
    const size = new Map();
    for (let t = 0; t < ix.length; t += 3) { const r = find(id[ix[t]]); size.set(r, (size.get(r) || 0) + 1); }
    const total = ix.length / 3, keep = [];
    for (let t = 0; t < ix.length; t += 3) if (size.get(find(id[ix[t]])) >= total * 0.03) keep.push(ix[t], ix[t + 1], ix[t + 2]);
    p.getIndices().setArray(new (n > 65535 ? Uint32Array : Uint16Array)(keep));
  }
  const count = () => doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives()).reduce((n, p) => n + p.getIndices().getCount() / 3, 0);
  const before = count();
  if (before > budget) await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: budget / before, error: Number(process.env.W_ERR || 0.02) }));
  await doc.transform(prune(), dedup());
  await io.write(out, doc);
  console.log(JSON.stringify({ out, before, after: count(), axis: ax.map((v) => +v.toFixed(3)), length: +L.toFixed(3) }));
})().catch((e) => { console.error(e); process.exitCode = 1; });
