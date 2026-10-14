// Prepare a hand-made CC0 kit model (Quaternius megakits) for the world: bake node transforms, base on y=0,
// centred on x/z, height 1, optional Y rotation, optional far-LOD simplification. Writes OUT.json (box in heights).
// node tools/v11_kit.cjs IN.gltf OUT.glb [ROT_DEG=0] [LOD_RATIO=0 (keep all)]
const path = require('node:path'), fs = require('node:fs');
const deps = require('./asset-deps.cjs');
const { NodeIO } = require(path.join(deps, '@gltf-transform/core'));
const { flatten, clearNodeTransform, prune, dedup, weld, simplify } = require(path.join(deps, '@gltf-transform/functions'));
const { MeshoptSimplifier } = require(path.join(deps, 'meshoptimizer'));

async function main() {
  const [src, out, rotArg, lodArg] = process.argv.slice(2);
  const rot = Number(rotArg || 0) * Math.PI / 180, lod = Number(lodArg || 0);
  await MeshoptSimplifier.ready;
  const io = new NodeIO(), doc = await io.read(src), root = doc.getRoot();
  await doc.transform(flatten());
  for (const n of root.listNodes()) if (n.getMesh()) clearNodeTransform(n);
  // drop the normal maps: the game's toon-ish lighting barely shows them and they double the download
  for (const m of root.listMaterials()) m.setNormalTexture(null);
  await doc.transform(prune(), dedup());
  const prims = root.listMeshes().flatMap((m) => m.listPrimitives());
  const c = Math.cos(rot), s = Math.sin(rot);
  const each = (fn) => { for (const p of prims) for (const name of ['POSITION', 'NORMAL']) { const a = p.getAttribute(name); if (a) for (let i = 0; i < a.getCount(); i++) a.setElement(i, fn(a.getElement(i, []), name)); } };
  if (rot) each((v) => [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]]);
  if (lod > 0 && lod < 1) {
    // far LOD: collapse across UV seams; the painted kits use tiling textures, so seams barely show at range
    await doc.transform(weld());
    for (const p of prims) {
      const pos = p.getAttribute('POSITION'), f = new Float32Array(pos.getCount() * 3); for (let i = 0; i < pos.getCount(); i++) f.set(pos.getElement(i, []), i * 3);
      const idx = new Uint32Array(p.getIndices().getArray()), target = Math.max(12, Math.floor(idx.length / 3 * lod)) * 3;
      const [ix] = MeshoptSimplifier.simplify(idx, f, 3, target, 0.2, ['Permissive']);
      p.getIndices().setArray(new Uint32Array(ix));
    }
    await doc.transform(prune());
  }
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of prims) { const a = p.getAttribute('POSITION'); for (let i = 0; i < a.getCount(); i++) { const v = a.getElement(i, []); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], v[k]); hi[k] = Math.max(hi[k], v[k]); } } }
  const H = hi[1] - lo[1], cx = (lo[0] + hi[0]) / 2, cz = (lo[2] + hi[2]) / 2;
  for (const p of prims) { const a = p.getAttribute('POSITION'); for (let i = 0; i < a.getCount(); i++) { const v = a.getElement(i, []); a.setElement(i, [(v[0] - cx) / H, (v[1] - lo[1]) / H, (v[2] - cz) / H]); } }
  await io.write(out, doc);
  const tris = prims.reduce((t, p) => t + p.getIndices().getCount() / 3, 0);
  const box = { w: +((hi[0] - lo[0]) / H).toFixed(3), d: +((hi[2] - lo[2]) / H).toFixed(3), h: 1, tris, src: path.basename(src), height: +H.toFixed(3) };
  fs.writeFileSync(out.replace(/\.glb$/, '.json'), JSON.stringify(box));
  console.log(path.basename(out), JSON.stringify(box));
}
main().catch((e) => { console.error(e); process.exit(1); });
