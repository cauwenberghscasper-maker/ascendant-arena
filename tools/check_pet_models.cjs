// Uses the game's exact Three.js version, installed separately for this audit.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),THREE=require(path.resolve(root,'../.asset-tools/node_modules/three'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function section(a,b){const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return html.slice(i,j);}
const c={THREE,Float32Array,Math};vm.createContext(c);
vm.runInContext(section('const _col =','const toonRamp')+section('const GEO =','// find the right fist')+
  fs.readFileSync(path.join(root,'assets/art/crystal-dragon.js'),'utf8').replace(/export /g,'')+
  fs.readFileSync(path.join(root,'assets/art/pet-companions.js'),'utf8').replace(/^import .*;\r?\n/m,'').replace(/export /g,'')+
  '\nthis.api={THREE,GEO,part,mergeParts};',c);
const output=[];
for(const id of ['crystal','bull','sprout','slime'])for(let stage=1;stage<=5;stage++){
  const view=c.createCompanion(c.api,id,stage),meshes=[],mats=new Set();let geometryDisposed=0,materialDisposed=0;
  view.root.traverse(o=>{if(o.isMesh){meshes.push(o);mats.add(o.material);o.geometry.addEventListener('dispose',()=>geometryDisposed++);assert.equal(o.castShadow,false);for(const attr of Object.values(o.geometry.attributes))assert(Array.from(attr.array).every(Number.isFinite));}});
  mats.forEach(m=>m.addEventListener('dispose',()=>materialDisposed++));
  assert(view.root.userData.triangles<=4000);assert(meshes.length<=4);assert.equal(mats.size,1);view.animate(1,false);view.animate(1,true);
  const box=new THREE.Box3().setFromObject(view.root);assert(box.min.y>=-.02);assert(box.max.y<1.7);assert(box.max.x-box.min.x<2);
  output.push({id,stage,triangles:view.root.userData.triangles,meshes:meshes.length,materials:mats.size});view.dispose();assert.equal(geometryDisposed,meshes.length);assert.equal(materialDisposed,1);assert.equal(view.root.children.length,0);
}
fs.writeFileSync(path.join(root,'audit/pet-model-evidence.json'),JSON.stringify(output,null,2)+'\n');
console.log('PASS 20 pet forms: finite geometry, <=4,000 triangles, <=4 meshes, one material, no shadows, resources disposed');
console.log(JSON.stringify(output.filter(x=>x.stage===5)));
