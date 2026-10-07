// Validate exported skin, rest-pose integrity, motion, and skeleton isolation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const deps=require('./asset-deps.cjs');
const {NodeIO}=require(path.join(deps,'@gltf-transform/core'));
async function main(){
 const THREE=await import(pathToFileURL(path.join(deps,'three/build/three.module.js')).href);
 const {clone}=await import(pathToFileURL(path.join(deps,'three/examples/jsm/utils/SkeletonUtils.js')).href);
 const source=fs.readFileSync(path.join(__dirname,'../assets/data/hero-animation.js'),'utf8');
 const {bindHeroMotion,animateHeroMotion}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const name=process.argv[2]||'pip';assert(['pip','brick','ayla','lumi'].includes(name));const directory=path.join(__dirname,'../assets',name==='lumi'?'hero-v5':'hero-v4',name,'packed');
 const pack=JSON.parse(fs.readFileSync(path.join(directory,'model.json'),'utf8'));
 const bytes=Buffer.from(pack.glb,'base64'),jsonLength=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+jsonLength));
 const binStart=20+jsonLength+8,resources={'@glb.bin':bytes.subarray(binStart)};json.buffers[0].uri='@glb.bin';
 for(const img of json.images||[])resources[img.uri]=fs.readFileSync(path.join(directory,img.uri));
 const doc=await new NodeIO().readJSON({json,resources});
 const skin=doc.getRoot().listSkins()[0],prim=doc.getRoot().listMeshes()[0].listPrimitives()[0];
 assert.equal(skin.listJoints().length,13);assert(prim.getIndices().getCount()/3<=11736);
 assert(prim.getAttribute('TEXCOORD_0'));assert.equal(doc.getRoot().listTextures()[0].getURI(),'basecolor.webp');
 const wa=prim.getAttribute('WEIGHTS_0').getArray(),ja=prim.getAttribute('JOINTS_0').getArray();
 for(let i=0;i<wa.length;i+=4){assert(Math.abs(wa[i]+wa[i+1]+wa[i+2]+wa[i+3]-1)<1e-5);for(let k=0;k<4;k++)assert(ja[i+k]<13&&wa[i+k]>=0);}
 const group=new THREE.Group(),bones=new Map();
 for(const n of skin.listJoints()){const b=new THREE.Bone();b.name=n.getName();b.position.fromArray(n.getTranslation());bones.set(n,b);}
 for(const n of skin.listJoints()){const parent=n.getParentNode();if(bones.has(parent))bones.get(parent).add(bones.get(n));else group.add(bones.get(n));}
 const g=new THREE.BufferGeometry();for(const [from,to,size] of [['POSITION','position',3],['JOINTS_0','skinIndex',4],['WEIGHTS_0','skinWeight',4]])g.setAttribute(to,new THREE.BufferAttribute(prim.getAttribute(from).getArray(),size));
 g.setIndex(new THREE.BufferAttribute(prim.getIndices().getArray(),1));
 const inverse=skin.getInverseBindMatrices().getArray(),skeleton=new THREE.Skeleton(skin.listJoints().map(n=>bones.get(n)),skin.listJoints().map((n,i)=>new THREE.Matrix4().fromArray(inverse,i*16)));
 const mesh=new THREE.SkinnedMesh(g,new THREE.MeshBasicMaterial());group.add(mesh);group.updateMatrixWorld(true);mesh.bind(skeleton,new THREE.Matrix4());
 const eyeSource=fs.readFileSync(path.join(__dirname,'../assets/data/hero-eyes.js'),'utf8');const {addHeroEyes}=await import('data:text/javascript;base64,'+Buffer.from(eyeSource).toString('base64'));
 const definition=JSON.parse(fs.readFileSync(path.join(directory,'manifest-entry.json'),'utf8'));addHeroEyes(group,definition,THREE);
 assert(group.getObjectByName('eyeL')&&group.getObjectByName('eyeR'));let total=prim.getIndices().getCount()/3;for(const n of ['eyeL','eyeR'])total+=group.getObjectByName(n).geometry.attributes.position.count/3;assert(total<=12000,'Eye detail must fit the mobile triangle budget');
 const original=new THREE.Vector3(),deformed=new THREE.Vector3();
 for(let i=0;i<g.attributes.position.count;i++){original.fromBufferAttribute(g.attributes.position,i);deformed.copy(original);mesh.applyBoneTransform(i,deformed);assert(deformed.distanceTo(original)<1e-5,'Rest-pose vertex moved');}
 const a=clone(group),b=clone(group),parts=bindHeroMotion(a),other=bindHeroMotion(b);assert(parts&&other);assert.notEqual(parts.armR,other.armR);
 for(let i=0;i<60;i++)animateHeroMotion(parts,Math.PI/2,1,0,0);assert(parts.armR.rotation.x>.24);assert(parts.armL.rotation.x<-.24);assert(other.armR.rotation.x===0);
 for(let i=0;i<60;i++)animateHeroMotion(parts,0,0,1,0);assert(parts.armR.rotation.x<-.349);assert(parts.elbowR.rotation.x<-.34);assert(other.elbowR.rotation.x===0);
 const hand=parts.handR;assert.equal(hand.parent,parts.elbowR);
 a.updateMatrixWorld(true);const posed=a.getObjectByProperty('isSkinnedMesh',true),verts=[];for(let i=0;i<g.attributes.position.count;i++){const v=new THREE.Vector3().fromBufferAttribute(g.attributes.position,i);posed.applyBoneTransform(i,v);verts.push(v);}
 let worst=0,worstEdge=null;const index=g.index.array;for(let i=0;i<index.length;i+=3)for(const [k,l] of [[0,1],[1,2],[2,0]]){const u=index[i+k],v=index[i+l],rest=new THREE.Vector3().fromBufferAttribute(g.attributes.position,u).distanceTo(new THREE.Vector3().fromBufferAttribute(g.attributes.position,v));if(rest<.008)continue;const ratio=verts[u].distanceTo(verts[v])/rest;if(ratio>worst){worst=ratio;worstEdge=[u,v];}}
 console.log(JSON.stringify({strikeMaxEdgeStretch:worst}));
 assert(worst<3, 'Attack stretches the source mesh; review the limb masks before release');
 for(let i=0;i<60;i++)animateHeroMotion(parts,0,0,0,0);
 for(let i=0;i<60;i++)animateHeroMotion(parts,Math.PI*1.5,1,0,0);
 assert(parts.kneeL.rotation.x>parts.kneeR.rotation.x+.05,'Recovering knee should flex');
 for(const side of ['L','R'])assert(Math.abs(parts['leg'+side+'Bone'].rotation.x+parts['knee'+side].rotation.x+parts['ankle'+side].rotation.x)<1e-6,'Foot sole should counterrotate');
 a.updateMatrixWorld(true);const ankle=new THREE.Vector3();parts.ankleR.getWorldPosition(ankle);const restAnkle=definition.ankles.R[1];assert(Math.abs(ankle.y-restAnkle)<.025,'Stance foot should remain near its measured rest height');
 const instant=bindHeroMotion(clone(group));animateHeroMotion(instant,0,0,1,0);assert(Math.abs(instant.armR.rotation.x)<.25,'Attack must blend in rather than snap');
 animateHeroMotion(parts,NaN,Infinity,NaN,NaN);for(const p of Object.values(parts))if(p.rotation)assert([p.rotation.x,p.rotation.y,p.rotation.z].every(Number.isFinite));
 assert.equal(bindHeroMotion(new THREE.Group()),null);
 for(const t of doc.getRoot().listTextures())assert(fs.existsSync(path.join(directory,t.getURI())));
 console.log('PASS '+name+': 13-joint skin, '+total+' triangles including eyes, UV/texture, normalized weights, unchanged rest pose, independent clones, arm swing, attack blending, wrist hierarchy, knee recovery, sole counterrotation, stance height, invalid-input guard');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
