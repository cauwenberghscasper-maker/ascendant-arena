// Remove a flat backdrop sheet that TRELLIS sometimes builds behind objects shown on a plain background
// (top-down concepts read as "object lying on a surface"). Drops welded islands that are large and flat,
// then, if the object is fused to the sheet, triangles lying in the sheet's plane.
// node tools/v10_unbackdrop.cjs IN.glb OUT.glb
const path = require('node:path');
const deps = require('./asset-deps.cjs');
const { NodeIO } = require(path.join(deps, '@gltf-transform/core'));
const { prune } = require(path.join(deps, '@gltf-transform/functions'));
(async () => {
  const [src, out] = process.argv.slice(2), io = new NodeIO(), doc = await io.read(src);
  for (const p of doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives())) {
    const pos = p.getAttribute('POSITION'), n = pos.getCount(), P = []; for (let i = 0; i < n; i++) P.push(pos.getElement(i, []));
    let ia = Array.from(p.getIndices().getArray());
    const lo = [0, 1, 2].map((k) => Math.min(...P.map((v) => v[k]))), hi = [0, 1, 2].map((k) => Math.max(...P.map((v) => v[k])));
    const span = Math.max(...hi.map((h, k) => h - lo[k]));
    // the sheet: the axis with the smallest... find a plane where many vertices share one coordinate near an extreme
    let best = null;
    for (const k of [0, 1, 2]) for (const side of [lo[k], hi[k]]) {
      const near = P.filter((v) => Math.abs(v[k] - side) < span * 0.02).length;
      if (!best || near > best.near) best = { k, side, near };
    }
    const onSheet = (i) => Math.abs(P[i][best.k] - best.side) < span * 0.035;
    const kept = []; let cut = 0;
    for (let t = 0; t < ia.length; t += 3) { if (onSheet(ia[t]) && onSheet(ia[t + 1]) && onSheet(ia[t + 2])) { cut++; continue; } kept.push(ia[t], ia[t + 1], ia[t + 2]); }
    // the sheet's curled edges: drop islands that are now tiny
    const q = (v) => v.map((x) => Math.round(x / (span * 1e-4))).join(','), rep = new Map(), id = new Int32Array(n);
    for (let i = 0; i < n; i++) { const k = q(P[i]); if (!rep.has(k)) rep.set(k, rep.size); id[i] = rep.get(k); }
    const par = new Int32Array(rep.size).map((_, i) => i), find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
    for (let t = 0; t < kept.length; t += 3) { const a = find(id[kept[t]]); par[find(id[kept[t + 1]])] = a; par[find(id[kept[t + 2]])] = a; }
    const cnt = new Map(); for (let t = 0; t < kept.length; t += 3) { const r = find(id[kept[t]]); cnt.set(r, (cnt.get(r) || 0) + 1); }
    const top = Math.max(...cnt.values()), fin = []; for (let t = 0; t < kept.length; t += 3) if (cnt.get(find(id[kept[t]])) >= top * 0.02) fin.push(kept[t], kept[t + 1], kept[t + 2]);
    p.getIndices().setArray(new Uint32Array(fin));
    console.log(JSON.stringify({ axis: 'xyz'[best.k], sheetVerts: best.near, cut, islandsCut: kept.length / 3 - fin.length / 3, left: fin.length / 3 }));
  }
  await doc.transform(prune()); await io.write(out, doc);
})().catch((e) => { console.error(e); process.exit(1); });
