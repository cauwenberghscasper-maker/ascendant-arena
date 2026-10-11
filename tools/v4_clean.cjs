// Clean a TRELLIS.2 character GLB for rigging: drop the generated ground plate (keeping boot soles),
// normalise (feet on y=0, height 1, centred, facing +Z) and simplify for phones. Materials are untouched.
// node tools/v4_clean.cjs SOURCE.glb OUT.glb [triangles=15000]
const path = require('node:path');
const deps = require('./asset-deps.cjs');
const { NodeIO } = require(path.join(deps, '@gltf-transform/core'));
const { weld, simplify, prune, dedup } = require(path.join(deps, '@gltf-transform/functions'));
const { MeshoptSimplifier } = require(path.join(deps, 'meshoptimizer'));

async function main() {
  const [src, out, budgetArg] = process.argv.slice(2), budget = Number(budgetArg || 15000);
  if (!src || !out || path.resolve(src) === path.resolve(out)) throw Error('usage: SOURCE OUT [triangles]');
  await MeshoptSimplifier.ready;
  const io = new NodeIO(), doc = await io.read(src);
  const prims = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives());
  // world transforms are baked by reading node matrices; TRELLIS output is a single identity node
  let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of prims) { const a = p.getAttribute('POSITION'); for (let i = 0; i < a.getCount(); i++) { const v = a.getElement(i, []); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], v[k]); hi[k] = Math.max(hi[k], v[k]); } } }
  const H = hi[1] - lo[1];
  let removed = 0;
  for (const p of prims) {
    const pos = p.getAttribute('POSITION'), idx = p.getIndices();
    const n = pos.getCount(), Y = new Float32Array(n), X = new Float32Array(n), Z = new Float32Array(n);
    for (let i = 0; i < n; i++) { const v = pos.getElement(i, []); X[i] = v[0]; Y[i] = (v[1] - lo[1]) / H; Z[i] = v[2]; }
    // footprint of the boots well above any generated floor plate
    const cell = 0.012 * H, occ = new Set(), key = (x, z) => Math.floor(x / cell) + ':' + Math.floor(z / cell);
    for (let i = 0; i < n; i++) if (Y[i] > 0.035 && Y[i] < 0.07) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) occ.add(key(X[i] + dx * cell, Z[i] + dz * cell));
    // TRELLIS often adds a thin floor slab, sometimes a little above the soles: find it from the
    // low vertices that lie outside every boot
    const outside = [];
    for (let i = 0; i < n; i++) if (Y[i] < 0.1 && !occ.has(key(X[i], Z[i]))) outside.push(Y[i]);
    outside.sort((a, b) => a - b);
    let band = null;
    if (outside.length > 150) band = [outside[Math.floor(outside.length * 0.02)] - 0.004, outside[Math.floor(outside.length * 0.98)] + 0.004];
    const tri = idx ? Array.from(idx.getArray()) : Array.from({ length: n }, (_, i) => i), keep = [];
    const P = (i) => [X[i], Y[i] * H, Z[i]];
    for (let t = 0; t < tri.length; t += 3) {
      const a = tri[t], b = tri[t + 1], c = tri[t + 2];
      const flat = Y[a] < 0.007 && Y[b] < 0.007 && Y[c] < 0.007;
      if (flat) { removed++; continue; } // soles are never seen from the game camera; plate pieces would flap with the feet
      if (band && [a, b, c].every((i) => Y[i] >= band[0] && Y[i] <= band[1])) {
        const cx = (X[a] + X[b] + X[c]) / 3, cz = (Z[a] + Z[b] + Z[c]) / 3;
        const pa = P(a), pb = P(b), pc = P(c), u = pb.map((v, k) => v - pa[k]), w = pc.map((v, k) => v - pa[k]);
        const nr = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], ny = Math.abs(nr[1]) / (Math.hypot(...nr) || 1);
        if (!occ.has(key(cx, cz)) || ny > 0.7) { removed++; continue; }
      }
      keep.push(a, b, c);
    }
    globalThis.__band = band;
    const Arr = n > 65535 ? Uint32Array : Uint16Array;
    const acc = idx || doc.createAccessor().setType('SCALAR').setBuffer(pos.getBuffer());
    acc.setArray(new Arr(keep)); p.setIndices(acc);
  }
  // recompute bounds on the kept geometry and normalise
  lo = [Infinity, Infinity, Infinity]; hi = [-Infinity, -Infinity, -Infinity];
  const used = [];
  for (const p of prims) { const a = p.getAttribute('POSITION'), ix = p.getIndices().getArray(); const seen = new Uint8Array(a.getCount()); for (const i of ix) seen[i] = 1; used.push(seen);
    for (let i = 0; i < a.getCount(); i++) if (seen[i]) { const v = a.getElement(i, []); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], v[k]); hi[k] = Math.max(hi[k], v[k]); } } }
  const h = hi[1] - lo[1], s = 1 / h;
  let lx = [Infinity, -Infinity], tz = [Infinity, -Infinity];
  prims.forEach((p, pi) => { const a = p.getAttribute('POSITION'); for (let i = 0; i < a.getCount(); i++) if (used[pi][i]) { const v = a.getElement(i, []), yy = (v[1] - lo[1]) * s;
    if (yy < 0.3) { lx[0] = Math.min(lx[0], v[0]); lx[1] = Math.max(lx[1], v[0]); }
    if (yy > 0.45 && yy < 0.75 && Math.abs(v[0] - (lo[0] + hi[0]) / 2) * s < 0.1) { tz[0] = Math.min(tz[0], v[2]); tz[1] = Math.max(tz[1], v[2]); } } });
  const off = [-(lx[0] + lx[1]) / 2, -lo[1], -(tz[0] + tz[1]) / 2];
  for (const p of prims) { const a = p.getAttribute('POSITION'), arr = a.getArray(); for (let i = 0; i < a.getCount(); i++) for (let k = 0; k < 3; k++) arr[i * 3 + k] = (arr[i * 3 + k] + off[k]) * s; a.setArray(arr); }
  for (const node of doc.getRoot().listNodes()) { node.setTranslation([0, 0, 0]).setRotation([0, 0, 0, 1]).setScale([1, 1, 1]); }
  const count = () => prims.reduce((n, p) => n + p.getIndices().getCount() / 3, 0);
  const before = count();
  await doc.transform(weld({}));
  if (count() > budget) await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: budget / count(), error: 0.005 }));
  await doc.transform(prune(), dedup());
  const after = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives()).reduce((n, p) => n + p.getIndices().getCount() / 3, 0);
  await io.write(out, doc);
  console.log(JSON.stringify({ src, out, floorTrianglesRemoved: removed, plate: globalThis.__band, before, after, scale: s, offset: off }));
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
