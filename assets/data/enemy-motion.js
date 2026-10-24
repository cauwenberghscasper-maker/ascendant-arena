import { ENEMY_RIGS, enemyJoints } from './enemy-rigs.js';
import { createEnemyAnimator } from './enemy-clips.js';
export { ENEMY_RIGS } from './enemy-rigs.js';
export function enemySkinPath(id){return ENEMY_RIGS[id]?'assets/animation/enemy-rigs/'+id.replace('.','-')+'.json':null;}
export function rigEnemyModel(T,scene,id,skin){
  const spec=ENEMY_RIGS[id];if(!spec)return;const meshes=[];scene.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)meshes.push(o);});
  for(const mesh of meshes){
    const source=mesh.geometry,pos=source.attributes.position;source.computeBoundingBox();const box=source.boundingBox,h=box.max.y-box.min.y;if(!(h>0))continue;
    const cx=(box.min.x+box.max.x)/2,cz=(box.min.z+box.max.z)/2,joints=enemyJoints(spec),geometry=source.clone();
    if(!skin||skin.vertices!==pos.count||skin.joints.join('|')!==joints.map(j=>j.name).join('|')||skin.jointPositions?.length!==joints.length||joints.some((j,i)=>j.p.some((v,k)=>!Number.isFinite(skin.jointPositions[i][k])||Math.abs(v-skin.jointPositions[i][k])>1e-7)))throw Error('Baked skin weights missing or stale: '+id);
    const decode=s=>{const bin=atob(s),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return new Uint16Array(bytes.buffer);};
    const indices=decode(skin.indices),quantized=decode(skin.weights),weights=new Float32Array(quantized.length),counts=skin.counts;
    for(let i=0;i<pos.count;i++){let sum=0;for(let k=0;k<4;k++)sum+=quantized[i*4+k];if(!sum)throw Error('Unweighted skin vertex: '+id);for(let k=0;k<4;k++)weights[i*4+k]=quantized[i*4+k]/sum;}
    geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
    const body=new T.SkinnedMesh(geometry,mesh.material);body.name=mesh.name;body.position.copy(mesh.position);body.quaternion.copy(mesh.quaternion);body.scale.copy(mesh.scale);
    const bones=joints.map(j=>{const b=new T.Bone();b.name='enemy_'+j.name;return b;});
    joints.forEach((j,i)=>{const p=j.parent<0?[0,0,0]:joints[j.parent].p;bones[i].position.set((j.p[0]-p[0])*h,(j.p[1]-p[1])*h,(j.p[2]-p[2])*h);if(j.parent<0){bones[i].position.set(cx,box.min.y,cz);body.add(bones[i]);}else bones[j.parent].add(bones[i]);});
    mesh.parent.add(body);mesh.parent.remove(mesh);body.updateWorldMatrix(true,true);body.bind(new T.Skeleton(bones));body.frustumCulled=false;body.userData.enemyRig=id;body.userData.limbVertices=counts;
  }
}
export function createEnemyMotion(model){return createEnemyAnimator(model,ENEMY_RIGS);}
