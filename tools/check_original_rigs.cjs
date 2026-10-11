// Offline regression checks for every shipped hero. Textures are omitted only in this test.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const deps = require('./asset-deps.cjs');
const root = path.resolve(__dirname, '..');
const moduleAt = name => import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync(path.join(root, name), 'utf8')).toString('base64'));
global.ProgressEvent ||= class ProgressEvent { constructor(type, values) { this.type = type; Object.assign(this, values); } };
async function main() {
  const T = await import(pathToFileURL(path.join(deps, 'three/build/three.module.js')).href);
  const { GLTFLoader } = await import(pathToFileURL(path.join(deps, 'three/examples/jsm/loaders/GLTFLoader.js')).href);
  const { clone } = await import(pathToFileURL(path.join(deps, 'three/examples/jsm/utils/SkeletonUtils.js')).href);
  const { prepareOriginalAdventurer } = await moduleAt('assets/art/original-adventurers.js');
  const clips = JSON.parse(fs.readFileSync(path.join(root, 'assets/animation/original-hero-clips.json'))).map(c => T.AnimationClip.parse(c));
  const defs = JSON.parse(fs.readFileSync(path.join(root, 'audit/original-heroes.json')));
  const report = [];
  for (const [id, def] of Object.entries(defs)) {
    const bytes = Buffer.from(JSON.parse(fs.readFileSync(path.join(root, def.dir, 'model.json'))).glb, 'base64');
    const length = bytes.readUInt32LE(12), json = JSON.parse(bytes.subarray(20, 20 + length));
    json.buffers[0].uri = 'data:application/octet-stream;base64,' + bytes.subarray(28 + length).toString('base64');
    delete json.images; delete json.textures; delete json.samplers;
    json.materials = (json.materials || []).map(() => ({ pbrMetallicRoughness: { baseColorFactor: [.5,.5,.5,1] } }));
    const { scene } = await new GLTFLoader().parseAsync(JSON.stringify(json), '');
    def.character = id.slice(5); prepareOriginalAdventurer(scene, def, T);
    scene.updateMatrixWorld(true);
    const meshes = []; scene.traverse(o => { if (o.isSkinnedMesh) meshes.push(o); });
    let vertices = 0;
    for (const mesh of meshes) {
      const { position: p, skinWeight: w, skinIndex: j } = mesh.geometry.attributes;
      vertices += p.count;
      for (let i = 0; i < p.count; i++) {
        assert(Math.abs(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)-1) < 1e-5, id+' normalized weights');
        for (let k=0;k<4;k++) assert(j.array[i*4+k]<mesh.skeleton.bones.length);
        const rest = new T.Vector3().fromBufferAttribute(p,i), posed = rest.clone(); mesh.applyBoneTransform(i,posed);
        assert(posed.distanceTo(rest)<1e-5,id+' unchanged rest geometry');
      }
    }
    const isolated = clone(scene); assert.notEqual(isolated.getObjectByName('handr'),scene.getObjectByName('handr'));
    const mixer = new T.AnimationMixer(scene), grip = scene.getObjectByName('fantasyGrip');
    assert.equal(grip.parent,scene.getObjectByName('handr'));
    const modes = [];
    for (const clip of clips.slice().sort((a,b)=>(b.name==='Idle')-(a.name==='Idle'))) {
      mixer.stopAllAction(); const action=mixer.clipAction(clip).reset().play(); let worst=0, worstEdge;
      for (const fraction of [.2,.5,.8]) {
        mixer.setTime(clip.duration*fraction); scene.updateMatrixWorld(true);
        for (const mesh of meshes) {
          const p=mesh.geometry.attributes.position, ix=mesh.geometry.index;
          const posed=Array.from({length:p.count},(_,i)=>mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)));
          for(let i=0;i<(ix?.count||p.count);i+=3) for(const [a,b] of [[0,1],[1,2],[2,0]]) {
            const u=ix?ix.getX(i+a):i+a,v=ix?ix.getX(i+b):i+b;
            const rest=new T.Vector3().fromBufferAttribute(p,u).distanceTo(new T.Vector3().fromBufferAttribute(p,v));
            if(rest>.008) { const ratio=posed[u].distanceTo(posed[v])/rest; if(ratio>worst){worst=ratio;worstEdge=[u,v].map(i=>new T.Vector3().fromBufferAttribute(p,i).toArray());} }
          }
        }
        assert(grip.getWorldPosition(new T.Vector3()).distanceTo(grip.parent.getWorldPosition(new T.Vector3()))<1e-6);
      }
      assert(worst<2,id+' '+clip.name+' avoids severe skin stretching');
      modes.push({clip:clip.name,stretch:+worst.toFixed(2),worstEdge}); action.stop();
    }
    const result={id,vertices,masks:meshes.map(m=>m.userData.armMasks),modes}; report.push(result);
    console.log(id,JSON.stringify(result));
    mixer.uncacheRoot(scene);
  }
  fs.writeFileSync(path.join(root,'audit/original-rig-checks.json'),JSON.stringify(report,null,2)+'\n');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
