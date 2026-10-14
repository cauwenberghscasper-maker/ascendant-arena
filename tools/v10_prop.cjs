// Normalise a TRELLIS.2 prop or boss for the world: base on y=0, centred on x/z, height 1, front facing +Z,
// stray floaters dropped, simplified for phones. Writes the bounding box (in units of height) to OUT.json.
// node tools/v10_prop.cjs IN.glb OUT.glb [TRIANGLES=9000] [ROT_DEG=0]
const path = require('node:path'), fs = require('node:fs');
const deps = require('./asset-deps.cjs');
const { NodeIO } = require(path.join(deps, '@gltf-transform/core'));
const { weld, simplify, prune, dedup } = require(path.join(deps, '@gltf-transform/functions'));
const { MeshoptSimplifier } = require(path.join(deps, 'meshoptimizer'));

async function main() {
  const [src, out, triArg, rotArg] = process.argv.slice(2);
  if (!src || !out) throw Error('usage: IN.glb OUT.glb [triangles] [rotDeg]');
  const budget = Number(triArg || 9000), rot = Number(rotArg || 0) * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
  await MeshoptSimplifier.ready;
  const io = new NodeIO(), doc = await io.read(src);
  const prims = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives());
  // rotate about Y first (positive = counter-clockwise seen from above)
  if (rot) for (const p of prims) for (const name of ['POSITION', 'NORMAL']) {
    const a = p.getAttribute(name); if (!a) continue;
    for (let i = 0; i < a.getCount(); i++) { const v = a.getElement(i, []); a.setElement(i, [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]]); }
  }
  await doc.transform(weld());
  // bounds before cleaning
  const bounds = () => { const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const p of prims) { const a = p.getAttribute('POSITION'); for (let i = 0; i < a.getCount(); i++) { const v = a.getElement(i, []); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], v[k]); hi[k] = Math.max(hi[k], v[k]); } } }
    return [lo, hi]; };
  for (const p of prims) {
    const idx = p.getIndices(); if (!idx) continue;
    const pos = p.getAttribute('POSITION'), n = pos.getCount(), P = []; for (let i = 0; i < n; i++) P.push(pos.getElement(i, []));
    const [lo, hi] = bounds(), H = hi[1] - lo[1], span = Math.max(hi[0] - lo[0], hi[2] - lo[2]);
    let ia = Array.from(idx.getArray());
    // 1) generated floor plate: low triangles that sit outside the object's own footprint
    const cell = span * 0.015, key = (x, z) => Math.floor(x / cell) + ':' + Math.floor(z / cell), foot = new Set();
    for (const v of P) { const y = (v[1] - lo[1]) / H; if (y > Number(process.env.PLATE || 0.07) && y < Number(process.env.PLATE || 0.07) + 0.09) for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) foot.add(key(v[0] + dx * cell, v[2] + dz * cell)); }
    const PL = Number(process.env.PLATE || 0.07), low = (i) => (P[i][1] - lo[1]) / H < PL;
    // FLAT=1: also drop near-horizontal low triangles inside the footprint (the ground slab under grass, bushes and rocks)
    const flat = (a, b, c) => { const u = [0, 1, 2].map((k) => P[b][k] - P[a][k]), v = [0, 1, 2].map((k) => P[c][k] - P[a][k]);
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], l = Math.hypot(...n) || 1; return Math.abs(n[1] / l) > 0.85; };
    const kept = []; let plate = 0;
    for (let k = 0; k < ia.length; k += 3) {
      const [a1, b1, c1] = [ia[k], ia[k + 1], ia[k + 2]];
      if (low(a1) && low(b1) && low(c1) && (!foot.has(key((P[a1][0] + P[b1][0] + P[c1][0]) / 3, (P[a1][2] + P[b1][2] + P[c1][2]) / 3)) || (process.env.FLAT && flat(a1, b1, c1)))) { plate++; continue; }
      kept.push(a1, b1, c1);
    }
    ia = kept;
    // 2) floaters: islands found on position-welded connectivity (UV seams don't split them)
    const q = (v) => v.map((x) => Math.round(x / (span * 1e-4))).join(','), rep = new Map(), id = new Int32Array(n);
    for (let i = 0; i < n; i++) { const k = q(P[i]); if (!rep.has(k)) rep.set(k, rep.size); id[i] = rep.get(k); }
    const par = new Int32Array(rep.size).map((_, i) => i);
    const find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
    for (let k = 0; k < ia.length; k += 3) { const a1 = find(id[ia[k]]); par[find(id[ia[k + 1]])] = a1; par[find(id[ia[k + 2]])] = a1; }
    const count = new Map(); for (let k = 0; k < ia.length; k += 3) { const r = find(id[ia[k]]); count.set(r, (count.get(r) || 0) + 1); }
    const total = ia.length / 3, out = []; for (let k = 0; k < ia.length; k += 3) if (count.get(find(id[ia[k]])) / total >= 0.0006) out.push(ia[k], ia[k + 1], ia[k + 2]);
    console.error('plate triangles', plate, 'floater triangles', total - out.length / 3);
    idx.setArray(new Uint32Array(out));
  }
  await doc.transform(prune(), dedup(), simplify({ simplifier: MeshoptSimplifier, ratio: 1, error: 0.0008 }));
  let tris = prims.reduce((t, p) => t + p.getIndices().getCount() / 3, 0);
  if (tris > budget) await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: budget / tris, error: Number(process.env.SERR || 0.06), lockBorder: false }));
  // TRELLIS bakes the texture into many small UV charts, so seams block normal simplification; collapse across
  // them ('Permissive') when still over budget. UVs stay per vertex, so only seam edges smear slightly.
  for (const p of prims) {
    const t = p.getIndices().getCount() / 3, share = budget * t / Math.max(1, prims.reduce((a, q) => a + q.getIndices().getCount() / 3, 0));
    if (!process.env.PERM || t <= share * 1.05) continue;
    const pos = p.getAttribute('POSITION'), f = new Float32Array(pos.getCount() * 3); for (let i = 0; i < pos.getCount(); i++) f.set(pos.getElement(i, []), i * 3);
    const [ix] = MeshoptSimplifier.simplify(new Uint32Array(p.getIndices().getArray()), f, 3, Math.floor(share) * 3, 0.08, ['Permissive']);
    p.getIndices().setArray(new Uint32Array(ix));
  }
  await doc.transform(prune());
  tris = prims.reduce((t, p) => t + p.getIndices().getCount() / 3, 0);
  let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of prims) { const a = p.getAttribute('POSITION'); for (let i = 0; i < a.getCount(); i++) { const v = a.getElement(i, []); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], v[k]); hi[k] = Math.max(hi[k], v[k]); } } }
  const H = hi[1] - lo[1], cx = (lo[0] + hi[0]) / 2, cz = (lo[2] + hi[2]) / 2;
  for (const p of prims) { const a = p.getAttribute('POSITION'); for (let i = 0; i < a.getCount(); i++) { const v = a.getElement(i, []); a.setElement(i, [(v[0] - cx) / H, (v[1] - lo[1]) / H, (v[2] - cz) / H]); } }
  for (const node of doc.getRoot().listNodes()) { node.setTranslation([0, 0, 0]); node.setRotation([0, 0, 0, 1]); node.setScale([1, 1, 1]); }
  await io.write(out, doc);
  const box = { w: +((hi[0] - lo[0]) / H).toFixed(3), d: +((hi[2] - lo[2]) / H).toFixed(3), h: 1, tris };
  fs.writeFileSync(out.replace(/\.glb$/, '.json'), JSON.stringify(box));
  console.log(path.basename(out), JSON.stringify(box));
}
main().catch((e) => { console.error(e); process.exit(1); });
