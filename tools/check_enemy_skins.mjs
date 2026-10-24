// Verify baked data against the exact source models and current joint catalog.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { ENEMY_RIGS, enemyJoints } from '../assets/data/enemy-rigs.js';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root));
const manifest=read('src/game/41-assets.js').toString();
const enemies=[...manifest.matchAll(/'(enemy\.[^']+|world\.boss_[^']+)':/g)].map(m=>m[1]);
enemies.push(...[...read('src/game/48-world-models.js').toString().matchAll(/\b(boss_\w+): \[/g)].map(m=>'world.'+m[1]));
assert.deepEqual(enemies.sort(),Object.keys(ENEMY_RIGS).sort(),'Every body needs a rig');
let vertices=0;
for(const[id,spec]of Object.entries(ENEMY_RIGS)){
  const skin=JSON.parse(read('assets/animation/enemy-rigs/'+id.replace('.','-')+'.json'));
  const source=read('assets/'+id.replace('.','/')+'/model.json');
  assert.equal(skin.modelSha256,crypto.createHash('sha256').update(source).digest('hex'),id+': stale source');
  assert.deepEqual(skin.joints,enemyJoints(spec).map(j=>j.name),id+': stale joints');
  assert.deepEqual(skin.jointPositions,enemyJoints(spec).map(j=>j.p),id+': stale joint placement');
  const glb=Buffer.from(JSON.parse(source).glb,'base64'),doc=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)));
  assert.equal(skin.vertices,doc.accessors[doc.meshes[0].primitives[0].attributes.POSITION].count,id+': vertex order');
  const indices=Buffer.from(skin.indices,'base64'),weights=Buffer.from(skin.weights,'base64');
  assert.equal(indices.length,skin.vertices*8);assert.equal(weights.length,skin.vertices*8);
  for(let i=0;i<skin.vertices;i++){
    let sum=0;for(let k=0;k<4;k++){const at=i*8+k*2;assert(indices.readUInt16LE(at)<skin.joints.length,id+': joint index');sum+=weights.readUInt16LE(at);}
    assert(Math.abs(sum-65535)<=2,id+': normalized weights');
  }
  assert(skin.mappingError<=.3,id+': proxy transfer');vertices+=skin.vertices;
}
console.log(`PASS baked skins: ${enemies.length} bodies, ${vertices} vertices, source hashes, joints and weights`);
