// Simplify a packed asset folder (model.json + .webp textures) in place-ready form:
// node tools/v12_simplify_packed.cjs DIR OUT.glb TRIANGLES   -> OUT.glb with embedded textures, for tools/v4_pack.py
// Skinned meshes keep their joints and weights (meshoptimizer collapses edges; attributes ride along).
const path = require('node:path'), fs = require('node:fs');
const deps = require('./asset-deps.cjs');
const { NodeIO } = require(path.join(deps, '@gltf-transform/core'));
const { ALL_EXTENSIONS } = require(path.join(deps, '@gltf-transform/extensions'));
const { weld, simplify, prune } = require(path.join(deps, '@gltf-transform/functions'));
const { MeshoptSimplifier } = require(path.join(deps, 'meshoptimizer'));
(async () => {
  const [dir, out, triArg] = process.argv.slice(2), budget = Number(triArg);
  await MeshoptSimplifier.ready;
  const pack = JSON.parse(fs.readFileSync(path.join(dir, 'model.json'), 'utf8')), tmp = path.join(dir, '.tmp-simplify.glb');
  fs.writeFileSync(tmp, Buffer.from(pack.glb, 'base64'));
  try {
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS), doc = await io.read(tmp), prims = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives());
    const count = () => prims.reduce((t, p) => t + p.getIndices().getCount() / 3, 0), before = count();
    if (before > budget) {
      await doc.transform(weld());
      // collapse across UV seams too (TRELLIS bakes many small charts, which otherwise block simplification)
      for (const p of prims) {
        const pos = p.getAttribute('POSITION'), n = pos.getCount(), f = new Float32Array(n * 3), v = [];
        for (let i = 0; i < n; i++) f.set(pos.getElement(i, v), i * 3);
        const idx = new Uint32Array(p.getIndices().getArray()), target = Math.floor(idx.length / 3 * budget / before) * 3;
        const [ix] = MeshoptSimplifier.simplify(idx, f, 3, target, 0.05, ['Permissive']);
        p.getIndices().setArray(n > 65535 ? new Uint32Array(ix) : new Uint16Array(ix));
      }
      await doc.transform(prune());
    }
    for (const e of doc.getRoot().listExtensionsUsed()) if (e.extensionName === 'EXT_texture_webp') e.dispose(); // plain sources: tools/v4_pack.py externalises them
    await io.write(out, doc);
    console.log(path.basename(dir), Math.round(before), '->', Math.round(count()));
  } finally { fs.unlinkSync(tmp); }
})().catch((e) => { console.error(e); process.exit(1); });
