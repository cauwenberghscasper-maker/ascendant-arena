// Quantize a rigged v4 hero GLB (KHR_mesh_quantization: three.js reads it without a decoder).
// node tools/v4_quantize.cjs IN.glb OUT.glb
const path = require('node:path');
const deps = require('./asset-deps.cjs');
const { NodeIO } = require(path.join(deps, '@gltf-transform/core'));
const { KHRONOS_EXTENSIONS } = require(path.join(deps, '@gltf-transform/extensions'));
const { quantize, prune, dedup } = require(path.join(deps, '@gltf-transform/functions'));
(async () => {
  const [src, out] = process.argv.slice(2);
  const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS), doc = await io.read(src);
  await doc.transform(prune(), dedup(), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeWeight: 8 }));
  await io.write(out, doc);
})().catch((e) => { console.error(e); process.exitCode = 1; });
