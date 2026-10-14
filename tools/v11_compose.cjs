// Compose one model from several kit glTFs (e.g. a lantern post from a beam and a wall lantern, or a modular house).
// node tools/v11_compose.cjs SPEC.json OUT.glb   SPEC: [{ "src": "a.gltf", "t": [x,y,z], "s": 1 | [sx,sy,sz], "ry": deg }]
// Positions are in the source files' own units (metres for the Quaternius kits). Run tools/v11_kit.cjs on the result.
const path = require('node:path');
const deps = require('./asset-deps.cjs');
const { NodeIO } = require(path.join(deps, '@gltf-transform/core'));
const { mergeDocuments, prune, dedup } = require(path.join(deps, '@gltf-transform/functions'));
(async () => {
  const [specFile, out] = process.argv.slice(2), spec = require(path.resolve(specFile)), io = new NodeIO();
  const doc = await io.read(spec[0].src), scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
  const wrap = (nodes, p) => {
    const g = doc.createNode('part'), s = p.s == null ? 1 : p.s, ry = (p.ry || 0) * Math.PI / 360;
    g.setTranslation(p.t || [0, 0, 0]).setScale(Array.isArray(s) ? s : [s, s, s]).setRotation([0, Math.sin(ry), 0, Math.cos(ry)]);
    for (const n of nodes) { scene.removeChild(n); g.addChild(n); }
    scene.addChild(g);
  };
  wrap(scene.listChildren(), spec[0]);
  for (const p of spec.slice(1)) {
    const other = await io.read(p.src), before = new Set(scene.listChildren());
    const map = mergeDocuments(doc, other);
    const oscene = other.getRoot().getDefaultScene() || other.getRoot().listScenes()[0];
    const roots = oscene.listChildren().map((n) => map.get(n));
    for (const s of doc.getRoot().listScenes()) if (s !== scene) s.dispose();
    for (const n of roots) if (!before.has(n)) scene.addChild(n);
    wrap(roots, p);
  }
  doc.getRoot().setDefaultScene(scene);
  for (const b of doc.getRoot().listBuffers().slice(1)) { for (const a of doc.getRoot().listAccessors()) if (a.getBuffer() === b) a.setBuffer(doc.getRoot().listBuffers()[0]); b.dispose(); }
  await doc.transform(prune(), dedup());
  await io.write(out, doc);
  console.log('composed', out);
})().catch((e) => { console.error(e); process.exit(1); });
