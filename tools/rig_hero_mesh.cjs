// Offline, measured-rig skinning. Source mesh/UVs are preserved; no runtime dependency.
const fs=require('node:fs'),path=require('node:path');
const {NodeIO}=require(path.resolve(__dirname,'../../.asset-tools/node_modules/@gltf-transform/core'));
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
async function main(){
 const [source,output,rigPath]=process.argv.slice(2);
 if(!rigPath||path.resolve(source)===path.resolve(output))throw Error('Supply source, separate output, measured rig JSON');
 const rig=JSON.parse(fs.readFileSync(rigPath,'utf8')),io=new NodeIO(),doc=await io.read(source),root=doc.getRoot(),scene=root.listScenes()[0];
 const nodes=root.listNodes().filter(n=>n.getMesh());if(nodes.length!==1)throw Error('Review single-mesh source before rigging');
 const meshNode=nodes[0],mesh=meshNode.getMesh(),prim=mesh.listPrimitives()[0],pa=prim.getAttribute('POSITION');
 if(mesh.listPrimitives().length!==1||meshNode.getSkin())throw Error('Expected one unrigged textured primitive');
 const positions=pa.getArray(),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<positions.length;i++) {const k=i%3;lo[k]=Math.min(lo[k],positions[i]);hi[k]=Math.max(hi[k],positions[i]);}
 const height=hi[1]-lo[1];for(let i=0;i<positions.length;i+=3){positions[i]=(positions[i]-(lo[0]+hi[0])/2)/height;positions[i+1]=(positions[i+1]-lo[1])/height;positions[i+2]=(positions[i+2]-(lo[2]+hi[2])/2)/height;}
 pa.setArray(positions);
 const angle=(rig.facingCorrection||0)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 for(let i=0;i<positions.length;i+=3){const x=positions[i],z=positions[i+2];positions[i]=x*c+z*s;positions[i+2]=-x*s+z*c;}
 const normals=prim.getAttribute('NORMAL')?.getArray();if(normals){for(let i=0;i<normals.length;i+=3){const x=normals[i],z=normals[i+2];normals[i]=x*c+z*s;normals[i+2]=-x*s+z*c;}prim.getAttribute('NORMAL').setArray(normals);}
 // Join only coincident positions for topology analysis. Preserve actual UV-split vertices.
 // Below the shoulder, separated limbs should form their own surface components.
 const lookup=new Map(),welded=[],groups=[],allGroups=[],vertexGroup=[];
 for(let i=0;i<pa.getCount();i++){
  const v=[positions[i*3],positions[i*3+1],positions[i*3+2]],key=v.map(x=>Math.round(x*10000)).join(',');
  let id=lookup.get(key);if(id===undefined){id=welded.length;lookup.set(key,id);welded.push(v);groups.push(new Set());allGroups.push(new Set());}vertexGroup.push(id);
 }
 const shoulderCut=rig.shoulderCut||Math.min(rig.arms.L.shoulder[1],rig.arms.R.shoulder[1])-.06,indices=prim.getIndices().getArray();
 for(let i=0;i<indices.length;i+=3)for(const [u,v] of [[0,1],[1,2],[2,0]]){const a=vertexGroup[indices[i+u]],b=vertexGroup[indices[i+v]];allGroups[a].add(b);allGroups[b].add(a);if(welded[a][1]<shoulderCut&&welded[b][1]<shoulderCut){groups[a].add(b);groups[b].add(a);}}
 const labels=new Int32Array(welded.length).fill(-1),components=[];
 for(let i=0;i<welded.length;i++)if(labels[i]<0&&welded[i][1]<shoulderCut){const id=components.length,list=[i];labels[i]=id;for(let n=0;n<list.length;n++)for(const j of groups[list[n]])if(labels[j]<0){labels[j]=id;list.push(j);}components.push(list);}
 const seedFor=side=>{let best=-1,dist=Infinity;const h=rig.arms[side].hand;for(let i=0;i<welded.length;i++){if(labels[i]<0)continue;const v=welded[i],d=v.reduce((s,x,k)=>s+(x-h[k])**2,0);if(d<dist){dist=d;best=labels[i];}}return best;};
 const armComponents={L:seedFor('L'),R:seedFor('R')};
 for(const side of ['L','R']){
  const verts=components[armComponents[side]]||[],opposite=side==='L'?1:-1;
  if(verts.length<50||verts.some(i=>welded[i][0]*opposite>.025))throw Error('Arm is fused with the torso below shoulder: '+side+'; regenerate a separated pose');
 }
 const fields={};
 for(const side of ['L','R']){
  let field=Float64Array.from(labels,id=>id===armComponents[side]?1:0),next=new Float64Array(field.length);
  const top=rig.arms[side].shoulder[1]+.05;
  // Harmonic blend across the shoulder surface. UV seams don't create weighting seams.
  for(let pass=0;pass<128;pass++){
   next.set(field);
   for(let i=0;i<field.length;i++){
    if(welded[i][1]<shoulderCut||welded[i][1]>top)continue;
    let sum=0,total=0;for(const j of allGroups[i]){const d=Math.hypot(...welded[i].map((v,k)=>v-welded[j][k])),weight=1/Math.max(.002,d);sum+=field[j]*weight;total+=weight;}if(total)next[i]=sum/total;
   }
   [field,next]=[next,field];
  }
  fields[side]=field;
 }
 const spec=[['heroRoot',null,[0,0,0]]];
 for(const side of ['L','R']){const a=rig.arms[side];spec.push(['arm'+side,'heroRoot',a.shoulder],['elbow'+side,'arm'+side,a.elbow],['hand'+side,'elbow'+side,a.hand]);}
 for(const side of ['L','R'])spec.push(['leg'+side+'Bone','heroRoot',rig.legPivots[side]],['knee'+side,'leg'+side+'Bone',rig.knees[side]],['ankle'+side,'knee'+side,rig.ankles[side]]);
 const bones=new Map(),abs=new Map(),skin=doc.createSkin('heroMotion'),inverse=[];
 for(const [name,parent,pos] of spec){const p=parent?abs.get(parent):[0,0,0];const n=doc.createNode(name).setTranslation(pos.map((x,i)=>x-p[i]));bones.set(name,n);abs.set(name,pos);if(parent)bones.get(parent).addChild(n);else scene.addChild(n);skin.addJoint(n);inverse.push(1,0,0,0,0,1,0,0,0,0,1,0,-pos[0],-pos[1],-pos[2],1);}
 const buffer=root.listBuffers()[0],joints=new Uint16Array(pa.getCount()*4),weights=new Float32Array(pa.getCount()*4),counts={L:0,R:0,legs:0};
 for(let i=0;i<pa.getCount();i++){
  const x=positions[i*3],y=positions[i*3+1],z=positions[i*3+2],side=x<0?'L':'R',a=rig.arms[side],base=side==='L'?1:4;
  // Topology separates the hands from nearby coat/hip vertices.
  const arm=fields[side][vertexGroup[i]];
  const leg=(1-smooth(rig.legFade[0],rig.legFade[1],y))*(1-arm);
  const elbow=1-smooth(a.elbow[1]-.025,a.elbow[1]+.055,y),hand=1-smooth(a.hand[1]+.005,a.hand[1]+.065,y);
  const legBase=side==='L'?7:10,knee=1-smooth(rig.knees[side][1]-.035,rig.knees[side][1]+.04,y),ankle=1-smooth(rig.ankles[side][1]+.005,rig.ankles[side][1]+.05,y);
  const influences=[[0,Math.max(0,1-arm-leg)],[base,arm*(1-elbow)],[base+1,arm*elbow*(1-hand)],[base+2,arm*elbow*hand],[legBase,leg*(1-knee)],[legBase+1,leg*knee*(1-ankle)],[legBase+2,leg*knee*ankle]].filter(v=>v[1]>1e-7).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const sum=influences.reduce((n,v)=>n+v[1],0);if(!Number.isFinite(sum)||sum<=0)throw Error('Invalid skin weight');
  influences.forEach(([j,w],k)=>{joints[i*4+k]=j;weights[i*4+k]=w/sum;});if(arm>.5)counts[side]++;if(leg>.5)counts.legs++;
 }
 if(counts.L<50||counts.R<50||counts.legs<100)throw Error('Review incomplete limb masks');
 prim.setAttribute('JOINTS_0',doc.createAccessor().setType('VEC4').setArray(joints).setBuffer(buffer));
 prim.setAttribute('WEIGHTS_0',doc.createAccessor().setType('VEC4').setArray(weights).setBuffer(buffer));
 skin.setSkeleton(bones.get('heroRoot')).setInverseBindMatrices(doc.createAccessor().setType('MAT4').setArray(new Float32Array(inverse)).setBuffer(buffer));meshNode.setSkin(skin);
 await io.write(output,doc);console.log(JSON.stringify({output,joints:spec.length,weightedVertices:counts,triangles:prim.getIndices().getCount()/3,note:'Measured spatial skin weights; preview required for each hero.'}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
