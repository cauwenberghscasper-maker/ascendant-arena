// Offline asset tool; install dependencies with npm install --prefix tools.
// Leaves the generated source untouched. No runtime dependency is added to the game.
const path=require('node:path');
const deps=require('./asset-deps.cjs');
const {NodeIO}=require(path.join(deps,'@gltf-transform/core'));
const {weld,simplify}=require(path.join(deps,'@gltf-transform/functions'));
const {MeshoptSimplifier}=require(path.join(deps,'meshoptimizer'));
async function main(){
 const [source,output,limitArg]=process.argv.slice(2),limit=Number(limitArg||11500);
 if(!source||!output||path.resolve(source)===path.resolve(output))throw Error('Use separate source and output GLB paths');
 if(!Number.isInteger(limit)||limit<1000||limit>12000)throw Error('Invalid mobile triangle budget');
 await MeshoptSimplifier.ready;const io=new NodeIO(),doc=await io.read(source);
 const count=()=>doc.getRoot().listMeshes().reduce((sum,m)=>sum+m.listPrimitives().reduce((n,p)=>n+(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3,0),0);
 const before=count();await doc.transform(weld({}));
 if(before>limit)await doc.transform(simplify({simplifier:MeshoptSimplifier,ratio:limit/before,error:.008}));
 const after=count();if(after>12000)throw Error(`Mesh retained ${after} triangles; review seams/error before publishing`);
 for(const a of doc.getRoot().listAccessors())if(a.getArray()&&!Array.from(a.getArray()).every(Number.isFinite))throw Error('Non-finite mesh attribute');
 await io.write(output,doc);console.log(JSON.stringify({source,output,before,after,errorLimit:.008}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
