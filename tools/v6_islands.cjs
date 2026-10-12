// Drop tiny disconnected mesh islands (TRELLIS floaters) from a cleaned hero GLB before rigging.
// Islands are found on position-welded connectivity; an island survives if it holds at least
// MIN_SHARE of the triangles OR touches the main body's bounding box closely (props, halos, lanterns).
// node tools/v6_islands.cjs CLEAN.glb OUT.glb [minShare=0.004]
const path = require('node:path');
const deps = require('./asset-deps.cjs');
const { NodeIO } = require(path.join(deps, '@gltf-transform/core'));

async function main() {
  const [src, out, shareArg] = process.argv.slice(2);
  const minShare = Number(shareArg || 0.004);
  const io = new NodeIO(), doc = await io.read(src);
  const prims = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives());
  const report = [];
  for (const p of prims) {
    const pos = p.getAttribute('POSITION'), idx = p.getIndices().getArray(), n = pos.getCount();
    const key = new Map(), weld = new Int32Array(n);
    for (let i = 0; i < n; i++) { const v = pos.getElement(i, []); const k = v.map((x) => Math.round(x * 2e4)).join(','); if (!key.has(k)) key.set(k, key.size); weld[i] = key.get(k); }
    const par = new Int32Array(key.size).map((_, i) => i);
    const find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
    for (let t = 0; t < idx.length; t += 3) { const a = find(weld[idx[t]]), b = find(weld[idx[t + 1]]), c = find(weld[idx[t + 2]]); par[b] = a; par[find(c)] = a; }
    const triComp = new Int32Array(idx.length / 3), count = new Map();
    for (let t = 0; t < idx.length; t += 3) { const c = find(weld[idx[t]]); triComp[t / 3] = c; count.set(c, (count.get(c) || 0) + 1); }
    const total = idx.length / 3, main = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0];
    // bounding box of the main body, slightly grown
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let t = 0; t < idx.length; t++) if (triComp[Math.floor(t / 3)] === main) { const v = pos.getElement(idx[t], []); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], v[k]); hi[k] = Math.max(hi[k], v[k]); } }
    const keepComp = new Set();
    for (const [c, k] of count) {
      if (c === main || k / total >= minShare) { keepComp.add(c); continue; }
      // small island: keep only if it sits inside the body's box (buttons, eyes, small props)
      let inside = true;
      for (let t = 0; t < idx.length && inside; t++) if (triComp[Math.floor(t / 3)] === c) { const v = pos.getElement(idx[t], []); for (let q = 0; q < 3; q++) if (v[q] < lo[q] - 0.01 || v[q] > hi[q] + 0.01) inside = false; }
      if (k >= 40 || (inside && k >= 12)) keepComp.add(c); else if (process.env.ISL_DEBUG) console.error("drop", k, inside);
    }
    const kept = [];
    for (let t = 0; t < idx.length; t += 3) if (keepComp.has(triComp[t / 3])) kept.push(idx[t], idx[t + 1], idx[t + 2]);
    const Arr = n > 65535 ? Uint32Array : Uint16Array;
    p.getIndices().setArray(new Arr(kept));
    report.push({ islands: count.size, kept: keepComp.size, trianglesRemoved: total - kept.length / 3 });
  }
  await io.write(out, doc);
  console.log(JSON.stringify(report));
}
main().catch((e) => { console.error(e); process.exit(1); });
