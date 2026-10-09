// Bake world-space rotation deltas from KayKit's relaxed idle reference.
// Original hero proportions/UVs remain untouched; translations stay on their own rig.
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{
 const deps=require('./asset-deps.cjs');
 const T=await import(pathToFileURL(path.join(deps,'three/build/three.module.js')));
 const {GLTFLoader}=await import(pathToFileURL(path.join(deps,'three/examples/jsm/loaders/GLTFLoader.js')));
 const {NodeIO}=require(path.join(deps,'@gltf-transform/core'));
 const doc=await new NodeIO().read(path.join(__dirname,'kaykit-source/Knight.glb'));
 const keep=new Set(['Idle','Running_A','Running_Strafe_Left','Running_Strafe_Right','Walking_Backwards','1H_Ranged_Shoot','2H_Ranged_Shoot','1H_Melee_Attack_Slice_Horizontal','2H_Melee_Attack_Chop','Spellcast_Shoot','Spellcast_Raise','Throw','Hit_A','Dodge_Forward','Death_A']);
 for(const a of doc.getRoot().listAnimations())if(!keep.has(a.getName()))a.dispose();
 for(const n of doc.getRoot().listNodes()){n.setMesh(null);n.setSkin(null);}
 for(const x of [...doc.getRoot().listMeshes(),...doc.getRoot().listSkins(),...doc.getRoot().listMaterials(),...doc.getRoot().listTextures()])x.dispose();
 const bytes=await new NodeIO().writeBinary(doc);
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const root=gltf.scene,mixer=new T.AnimationMixer(root);
 const parents={chest:null,head:'chest'};
 for(const s of ['l','r'])Object.assign(parents,{['upperarm'+s]:'chest',['lowerarm'+s]:'upperarm'+s,['hand'+s]:'lowerarm'+s,['upperleg'+s]:null,['lowerleg'+s]:'upperleg'+s,['foot'+s]:'lowerleg'+s});
 const names=Object.keys(parents),nodes=Object.fromEntries(names.map(n=>[n,root.getObjectByName(n)]));
 for(const n of names)if(!nodes[n])throw Error('Missing source joint '+n);
 const idle=mixer.clipAction(gltf.animations.find(c=>c.name==='Idle'));idle.play();mixer.setTime(.25);root.updateMatrixWorld(true);
 const refs=Object.fromEntries(names.map(n=>[n,nodes[n].getWorldQuaternion(new T.Quaternion()).invert()]));
 mixer.stopAllAction();const baked=[];
 for(const clip of gltf.animations){
  const a=mixer.clipAction(clip);a.reset().setLoop(T.LoopOnce,1);a.clampWhenFinished=true;a.play();
  const count=Math.ceil(clip.duration*30)+1,times=[],values=Object.fromEntries(names.map(n=>[n,[]]));
  for(let i=0;i<count;i++){
   const t=Math.min(clip.duration,i/30);mixer.setTime(t);root.updateMatrixWorld(true);times.push(t);
   const world={};for(const n of names){const q=nodes[n].getWorldQuaternion(new T.Quaternion()).multiply(refs[n]);
    // Preserve the original oversized heads and short legs without extreme swings.
    const strength=n==='head'?.5:n==='chest'?.65:/leg|foot/.test(n)?.72:.85;
    world[n]=new T.Quaternion().slerp(q,strength);
   }
   for(const n of names){const q=parents[n]?world[parents[n]].clone().invert().multiply(world[n]):world[n];values[n].push(...q.toArray());}
  }
  baked.push({name:clip.name,duration:clip.duration,tracks:names.map(n=>({name:n+'.quaternion',type:'quaternion',times,values:values[n]}))});a.stop();
 }
 fs.writeFileSync('assets/animation/original-hero-clips.json',JSON.stringify(baked));
 fs.copyFileSync(path.join(__dirname,'kaykit-source/LICENSE.txt'),'assets/animation/LICENSE.txt');
 console.log('Baked',baked.length,'clips for',names.length,'original hero joints');
})().catch(e=>{console.error(e);process.exitCode=1});
