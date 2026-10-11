// Static checks for the v4 hero packs: skeleton, skin weights, budgets, textures, weapons, portraits, clips.
// node tools/check_hero_v4.cjs
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const deps = require('./asset-deps.cjs');
const { NodeIO } = require(path.join(deps, '@gltf-transform/core'));
const { KHRONOS_EXTENSIONS } = require(path.join(deps, '@gltf-transform/extensions'));
const ROOT = path.join(__dirname, '..');
const JOINTS = ['heroRoot', 'chest', 'head', 'upperarml', 'lowerarml', 'handl', 'upperarmr', 'lowerarmr', 'handr', 'upperlegl', 'lowerlegl', 'footl', 'upperlegr', 'lowerlegr', 'footr'];

async function readPack(dir) {
  const pack = JSON.parse(fs.readFileSync(path.join(ROOT, dir, 'model.json'), 'utf8'));
  assert.equal(pack.format, 'glb-base64');
  const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
  // external texture URIs resolve against the pack folder; we only need the document
  const bytes = Buffer.from(pack.glb, 'base64');
  const jl = bytes.readUInt32LE(12), json = JSON.parse(bytes.subarray(20, 20 + jl));
  for (const img of json.images || []) assert(fs.existsSync(path.join(ROOT, dir, img.uri)), dir + ' missing ' + img.uri);
  return { json, doc: await io.readJSON({ json, resources: Object.fromEntries((json.images || []).map((i) => [i.uri, new Uint8Array(0)]).concat([['@glb.bin', new Uint8Array(bytes.subarray(20 + jl + 8))]])) }) };
}

(async () => {
  const { HERO_V4 } = await import(path.join(ROOT, 'assets/data/hero-models-v4.js'));
  const clips = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/animation/adventurer-clips.json'), 'utf8'));
  const needed = ['Idle', 'Running_A', 'Running_Strafe_Left', 'Running_Strafe_Right', 'Walking_Backwards', '1H_Ranged_Shoot', '1H_Melee_Attack_Slice_Horizontal', 'Spellcast_Shoot', 'Spellcast_Raise', 'Hit_A', 'Dodge_Forward', 'Death_A'];
  for (const n of needed) assert(clips.clips.some((c) => c.name === n), 'clip ' + n);
  for (const c of clips.clips) for (const t of c.tracks) { assert(JOINTS.includes(t.name.split('.')[0]), t.name); assert(t.values.every(Number.isFinite), c.name + ' ' + t.name); }
  console.log('PASS', clips.clips.length, 'shared adventurer clips on the 15-joint skeleton');
  assert.equal(Object.keys(HERO_V4).length, 16);
  const weapons = new Set();
  for (const [cls, h] of Object.entries(HERO_V4)) {
    const dir = 'assets/hero-v4/' + h.name;
    const { doc } = await readPack(dir);
    const skins = doc.getRoot().listSkins();
    assert.equal(skins.length, 1, cls + ' skin');
    assert.deepEqual(skins[0].listJoints().map((j) => j.getName()), JOINTS, cls + ' joint order');
    const prims = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives());
    let tris = 0;
    for (const p of prims) {
      tris += p.getIndices().getCount() / 3;
      const w = p.getAttribute('WEIGHTS_0'), j = p.getAttribute('JOINTS_0');
      assert(w && j, cls + ' skin attributes');
      for (let i = 0; i < w.getCount(); i += 7) { const v = w.getElement(i, []), s = v.reduce((a, b) => a + b, 0); assert(Math.abs(s - 1) < 0.02, cls + ' weights sum ' + s); }
      assert(p.getMaterial()?.getBaseColorTexture(), cls + ' base colour texture');
    }
    assert(tris <= 30000, cls + ' triangle budget ' + tris);
    const kb = fs.readdirSync(path.join(ROOT, dir)).filter((f) => f === 'model.json' || f.endsWith('.webp')).reduce((a, f) => a + fs.statSync(path.join(ROOT, dir, f)).size, 0) / 1024;
    assert(kb < 2600, cls + ' download ' + kb);
    assert(h.size >= 1.6 && h.size <= 2.3 && h.hand > 0.04 && h.hand < 0.13, cls + ' fit');
    assert(['forward', 'up', 'aim'].includes(h.weapon.hold), cls + ' hold');
    assert(fs.existsSync(path.join(ROOT, 'assets/ui/portraits/v4', cls + '.webp')), cls + ' portrait');
    weapons.add(h.weapon.id);
    console.log('PASS', cls, h.name, Math.round(tris), 'triangles', Math.round(kb), 'KB');
  }
  for (const id of weapons) {
    const { doc } = await readPack('assets/hero-v4/weapons/' + id);
    const tris = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives()).reduce((n, p) => n + p.getIndices().getCount() / 3, 0);
    assert(tris <= 25000, id + ' weapon budget');
    console.log('PASS weapon', id, Math.round(tris), 'triangles');
  }
  console.log('v4 hero checks passed.');
})().catch((e) => { console.error(e); process.exitCode = 1; });
