// Bake KayKit Adventurers clips for the v4 (adult-proportion) heroes at full strength.
// Output assets/animation/adventurer-clips.json: { rest: {joint: idle bone direction}, clips: [...] }.
// Each v4 hero's bind pose maps these idle directions onto its own A-pose bones, so one clip set fits all.
// Needs tools/kaykit-source/Knight.glb (CC0, see audit/original-adventurers-release.md for the checksum).
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
(async () => {
  const deps = require('./asset-deps.cjs');
  const T = await import(pathToFileURL(path.join(deps, 'three/build/three.module.js')));
  const { GLTFLoader } = await import(pathToFileURL(path.join(deps, 'three/examples/jsm/loaders/GLTFLoader.js')));
  const { NodeIO } = require(path.join(deps, '@gltf-transform/core'));
  const doc = await new NodeIO().read(path.join(__dirname, 'kaykit-source/Knight.glb'));
  const keep = new Set(['Idle', 'Running_A', 'Running_Strafe_Left', 'Running_Strafe_Right', 'Walking_Backwards', '1H_Ranged_Shoot', '2H_Ranged_Shoot',
    '1H_Melee_Attack_Slice_Horizontal', '2H_Melee_Attack_Chop', 'Spellcast_Shoot', 'Spellcast_Raise', 'Throw', 'Hit_A', 'Dodge_Forward', 'Death_A', 'Cheer', '2H_Melee_Idle', 'T-Pose']);
  for (const a of doc.getRoot().listAnimations()) if (!keep.has(a.getName())) a.dispose();
  for (const n of doc.getRoot().listNodes()) { n.setMesh(null); n.setSkin(null); }
  for (const x of [...doc.getRoot().listMeshes(), ...doc.getRoot().listSkins(), ...doc.getRoot().listMaterials(), ...doc.getRoot().listTextures()]) x.dispose();
  const bytes = await new NodeIO().writeBinary(doc);
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const root = gltf.scene, mixer = new T.AnimationMixer(root);
  // our joint -> KayKit bone; parents follow the game skeleton
  const map = { heroRoot: 'hips', chest: 'chest', head: 'head' };
  const parents = { heroRoot: null, chest: 'heroRoot', head: 'chest' };
  for (const s of ['l', 'r']) {
    Object.assign(map, { ['upperarm' + s]: 'upperarm' + s, ['lowerarm' + s]: 'lowerarm' + s, ['hand' + s]: 'hand' + s, ['upperleg' + s]: 'upperleg' + s, ['lowerleg' + s]: 'lowerleg' + s, ['foot' + s]: 'foot' + s });
    Object.assign(parents, { ['upperarm' + s]: 'chest', ['lowerarm' + s]: 'upperarm' + s, ['hand' + s]: 'lowerarm' + s, ['upperleg' + s]: 'heroRoot', ['lowerleg' + s]: 'upperleg' + s, ['foot' + s]: 'lowerleg' + s });
  }
  const names = Object.keys(map), nodes = Object.fromEntries(names.map((n) => [n, root.getObjectByName(map[n])]));
  for (const n of names) if (!nodes[n]) throw Error('Missing KayKit bone ' + map[n]);
  const idle = mixer.clipAction(gltf.animations.find((c) => c.name === 'T-Pose')); idle.play(); mixer.setTime(0); root.updateMatrixWorld(true);
  const refs = {}, rest = {}, hipIdle = nodes.heroRoot.getWorldPosition(new T.Vector3()), hipH = hipIdle.y;
  for (const n of names) {
    const q = nodes[n].getWorldQuaternion(new T.Quaternion());
    refs[n] = q.clone().invert();
    rest[n] = new T.Vector3(0, 1, 0).applyQuaternion(q).toArray().map((v) => +v.toFixed(5));
  }
  mixer.stopAllAction();
  const baked = [];
  for (const clip of gltf.animations.filter((c) => c.name !== 'T-Pose')) {
    const a = mixer.clipAction(clip); a.reset().setLoop(T.LoopOnce, 1); a.clampWhenFinished = true; a.play();
    const count = Math.ceil(clip.duration * 30) + 1, times = [], values = Object.fromEntries(names.map((n) => [n, []])), pos = [];
    for (let i = 0; i < count; i++) {
      const t = Math.min(clip.duration, i / 30); mixer.setTime(t); root.updateMatrixWorld(true); times.push(+t.toFixed(4));
      const world = {};
      for (const n of names) world[n] = nodes[n].getWorldQuaternion(new T.Quaternion()).multiply(refs[n]);
      for (const n of names) { const q = parents[n] ? world[parents[n]].clone().invert().multiply(world[n]) : world[n]; values[n].push(...q.toArray().map((v) => +v.toFixed(5))); }
      // hip bob/sway as a fraction of hip height (the game scales it by each hero's own hip height)
      const hp = nodes.heroRoot.getWorldPosition(new T.Vector3()).sub(hipIdle).divideScalar(hipH);
      pos.push(+hp.x.toFixed(5), +hp.y.toFixed(5), +hp.z.toFixed(5));
    }
    const tracks = names.map((n) => ({ name: n + '.quaternion', type: 'quaternion', times, values: values[n] }));
    tracks.push({ name: 'heroRoot.position', type: 'vector', times, values: pos, hipRelative: true });
    baked.push({ name: clip.name, duration: clip.duration, tracks }); a.stop();
  }
  const out = path.join(__dirname, '../assets/animation/adventurer-clips.json');
  fs.writeFileSync(out, JSON.stringify({ source: 'KayKit Adventurers 1.0 Knight.glb (CC0), full-strength world deltas from the T-Pose', rest, parents, clips: baked }));
  console.log('Baked', baked.length, 'clips,', names.length, 'joints ->', out, Math.round(fs.statSync(out).size / 1024) + ' KB');
})().catch((e) => { console.error(e); process.exitCode = 1; });
