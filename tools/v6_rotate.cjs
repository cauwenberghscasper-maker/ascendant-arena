// Turn a cleaned hero GLB about the vertical axis (for TRELLIS meshes that come out facing sideways).
// node tools/v6_rotate.cjs IN.glb OUT.glb DEGREES   (positive = counter-clockwise seen from above)
const path = require('node:path');
const deps = require('./asset-deps.cjs');
const { NodeIO } = require(path.join(deps, '@gltf-transform/core'));
async function main() {
  const [src, out, degArg] = process.argv.slice(2), a = Number(degArg) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const io = new NodeIO(), doc = await io.read(src);
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) for (const name of ['POSITION', 'NORMAL']) {
    const at = p.getAttribute(name); if (!at) continue;
    for (let i = 0; i < at.getCount(); i++) { const v = at.getElement(i, []); at.setElement(i, [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]]); }
  }
  await io.write(out, doc);
}
main().catch((e) => { console.error(e); process.exit(1); });
