// Rig and dress the shipped original meshes. Geometry, UVs and faces are retained.
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
function armMasks(g,r){
 const p=g.attributes.position,ids=[],points=[],adj=[],keys=new Map(),cut=r.shoulder.y-.035;
 for(let i=0;i<p.count;i++){const v=[p.getX(i),p.getY(i),p.getZ(i)],key=v.map(n=>Math.round(n*10000)).join(',');let id=keys.get(key);if(id===undefined){id=points.length;keys.set(key,id);points.push(v);adj.push(new Set())}ids.push(id)}
 const ix=g.index;for(let i=0;i<(ix?.count||p.count);i+=3)for(const [a,b]of [[0,1],[1,2],[2,0]]){const u=ids[ix?ix.getX(i+a):i+a],v=ids[ix?ix.getX(i+b):i+b];adj[u].add(v);adj[v].add(u)}
 const labels=new Int32Array(points.length).fill(-1),components=[];
 for(let i=0;i<points.length;i++)if(labels[i]<0&&points[i][1]<cut){const label=components.length,list=[i];labels[i]=label;for(let j=0;j<list.length;j++)for(const k of adj[list[j]])if(labels[k]<0&&points[k][1]<cut){labels[k]=label;list.push(k)}components.push(list)}
 const masks={};
 for(const [s,h,sign] of [['l',r.hand,1],['r',r.hand2,-1]]){
  let nearest=-1,distance=Infinity;for(let i=0;i<points.length;i++)if(labels[i]>=0){const d=points[i].reduce((n,v,k)=>n+(v-h[k])**2,0);if(d<distance){distance=d;nearest=labels[i]}}
  const component=components[nearest];if(!component||component.length<20||component.some(i=>points[i][0]*sign<.035))continue;
  let field=Float32Array.from(labels,l=>l===nearest?1:0),next=new Float32Array(field.length);
  for(let pass=0;pass<32;pass++){next.set(field);for(let i=0;i<points.length;i++)if(points[i][1]>=cut&&points[i][1]<r.shoulder.y+.055){let sum=0;for(const n of adj[i])sum+=field[n];if(adj[i].size)next[i]=sum/adj[i].size}[field,next]=[next,field]}
  masks[s]=Float32Array.from(ids,i=>field[i]);
 }
 return masks;
}
export function prepareOriginalAdventurer(scene,def,THREE){
 const r=def.rig,bones=[],byName={},positions={},meshes=[];
 scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.isMesh)meshes.push(o)});
 function bone(name,parent,p){const b=new THREE.Bone();b.name=name;const at=parent?positions[parent]:[0,0,0];b.position.fromArray(p.map((v,i)=>v-at[i]));(parent?byName[parent]:scene).add(b);bones.push(b);byName[name]=b;positions[name]=p;return b}
 bone('heroRoot',null,[0,0,0]);bone('chest','heroRoot',[0,.32,r.torso.cz]);bone('head','chest',[r.head.cx,r.neckY,r.head.cz]);
 for(const [s,sign,h] of [['l',1,r.hand],['r',-1,r.hand2]]){
  const shoulder=[sign*(r.shoulder.x+.025),r.shoulder.y,r.torso.cz*.6+h[2]*.4],hand=h.slice(0,3),elbow=shoulder.map((v,i)=>v*.48+hand[i]*.52);
  bone('upperarm'+s,'chest',shoulder);bone('lowerarm'+s,'upperarm'+s,elbow);bone('hand'+s,'lowerarm'+s,hand);
  const lp=def.legs?.[sign>0?'legR':'legL']||[sign*r.foot.x,.23,r.foot.z];bone('upperleg'+s,'heroRoot',lp);bone('lowerleg'+s,'upperleg'+s,[lp[0],lp[1]*.48,lp[2]]);bone('foot'+s,'lowerleg'+s,[lp[0],.045,r.foot.z]);
 }
 scene.updateMatrixWorld(true);const skeleton=new THREE.Skeleton(bones);skeleton.calculateInverses();const idx=n=>bones.indexOf(byName[n]);
 for(const mesh of meshes){
  const g=mesh.geometry.clone();
  for(const key of ['position','normal']){const a=g.getAttribute(key);if(a){const values=new Float32Array(a.count*3);for(let i=0;i<a.count;i++)values.set([a.getX(i),a.getY(i),a.getZ(i)],i*3);g.setAttribute(key,new THREE.BufferAttribute(values,3));}}
  g.applyMatrix4(mesh.matrixWorld);const p=g.attributes.position,joints=new Uint16Array(p.count*4),weights=new Float32Array(p.count*4),masks=/^leg[LR]$/.test(mesh.name)?{}:armMasks(g,r);
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),s=x>0?'l':'r',h=positions['hand'+s],el=positions['lowerarm'+s];let influence;
   if(/^leg[LR]$/.test(mesh.name)){
    const knee=positions['lowerleg'+s][1],k=1-smooth(knee-.025,knee+.035,y),f=1-smooth(.045,.085,y);
    influence=[['upperleg'+s,1-k],['lowerleg'+s,k*(1-f)],['foot'+s,k*f]];
   }else{
    const arm=masks[s]?masks[s][i]:smooth(r.shoulder.x*.92,r.shoulder.x+.08,Math.abs(x))*(1-smooth(r.shoulder.y-.01,r.shoulder.y+.055,y));
    const elbow=1-smooth(el[1]-.025,el[1]+.035,y),hand=1-smooth(h[1]+.005,h[1]+.055,y);
    const head=smooth(r.neckY-.015,r.neckY+.035,y),chest=smooth(.24,.35,y);
    influence=[['heroRoot',(1-arm)*(1-head)*(1-chest)],['chest',(1-arm)*(1-head)*chest],['head',(1-arm)*head],['upperarm'+s,arm*(1-elbow)],['lowerarm'+s,arm*elbow*(1-hand)],['hand'+s,arm*elbow*hand]];
    if(!def.legs){
     // Robes are continuous surfaces: blend into both hips across the hem.
     const leg=(1-smooth(.08,.26,y))*(1-arm),left=smooth(-.08,.08,x);
     influence=influence.map(([n,w])=>[n,w*(1-leg)]);
     influence.push(['upperlegl',leg*left],['upperlegr',leg*(1-left)]);
    }
   }
   influence=influence.filter(a=>a[1]>1e-6).sort((a,b)=>b[1]-a[1]).slice(0,4);const sum=influence.reduce((n,a)=>n+a[1],0);
   influence.forEach(([name,w],k)=>{joints[i*4+k]=idx(name);weights[i*4+k]=w/sum});
  }
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(joints,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  const skin=new THREE.SkinnedMesh(g,mesh.material);skin.name=mesh.name;skin.userData.armMasks=Object.keys(masks);mesh.removeFromParent();mesh.geometry.dispose();scene.add(skin);skin.bind(skeleton);skin.frustumCulled=false;skin.castShadow=true;
 }
 dress(scene,byName,positions,r,def,THREE);scene.scale.setScalar(def.size);scene.userData.originalRig=true;
}
function dress(scene,bones,at,r,def,T){
 const knight=['wave','scatter','gatling'].includes(def.character),mage=['orb','seeker','flamer','starfall','chain'].includes(def.character);
 const color=knight?0x657d86:mage?0x485785:0x376658;
 const cloth=new T.MeshStandardMaterial({color,roughness:.95}),leather=new T.MeshStandardMaterial({color:0x634532,roughness:.9}),gold=new T.MeshStandardMaterial({color:0xc7a567,metalness:.55,roughness:.4}),steel=new T.MeshStandardMaterial({color:0x9db1b5,metalness:.6,roughness:.4});
 function add(g,m,b,p,scale){const o=new T.Mesh(g,m);const origin=at[b];o.position.fromArray(p.map((v,i)=>v-origin[i]));if(scale)o.scale.fromArray(scale);bones[b].add(o);o.castShadow=true;return o}
 const sphere=new T.SphereGeometry(1,16,10),torso=r.torso,front=r.chestFront+.012;
 // Fitted cuirass or cloth surcoat and brass brooch leave the original face visible.
 if(!knight){const w=torso.hw*.75,shape=new T.Shape();shape.moveTo(-w*.6,r.shoulder.y-.035);shape.lineTo(w*.6,r.shoulder.y-.035);shape.lineTo(w,.29);shape.lineTo(w*.65,.22);shape.lineTo(-w*.65,.22);shape.lineTo(-w,.29);shape.closePath();add(new T.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:2,steps:1}),cloth,'chest',[0,0,front]);}
 add(new T.CylinderGeometry(.022,.022,.014,12).rotateX(Math.PI/2),gold,'chest',[0,r.shoulder.y-.025,front+.035]);
 const belt=new T.TorusGeometry(1,.085,6,24);belt.rotateX(Math.PI/2);
 add(belt,leather,'heroRoot',[0,.285,torso.cz],[torso.hw*1.1,.16,torso.hd*1.12]);
 add(new T.BoxGeometry(.065,.037,.025),gold,'heroRoot',[0,.285,front+.013]);
 for(const s of ['l','r'])add(sphere,knight?steel:leather,'upperarm'+s,at['upperarm'+s],[.082,.045,.082]);
 if(!knight&&!mage){
  const feather=add(sphere,cloth,'head',[r.head.cx+r.head.r*.78,r.head.y+r.head.r*.58,r.head.cz],[.024,.12,.012]);feather.rotation.z=-.4;
  add(new T.OctahedronGeometry(.024),gold,'head',[r.head.cx+r.head.r*.80,r.head.y+r.head.r*.35,r.head.cz]);
 }
 // A tapered cape follows the torso instead of the old static body.
 const cape=new T.BufferGeometry(),w=torso.hw*.95,top=r.shoulder.y,back=torso.cz-torso.hd-.025;
 cape.setAttribute('position',new T.Float32BufferAttribute([-w,top,back,w,top,back,-w*1.25,.19,back-.055,w*1.25,.19,back-.055],3));cape.setIndex([0,2,1,1,2,3]);cape.computeVertexNormals();const cm=cloth.clone();cm.side=T.DoubleSide;
 add(cape,cm,'chest',[0,0,0]);
 const grip=new T.Group();grip.name='fantasyGrip';bones.handr.add(grip);
 const part=(g,m,p)=>{const o=new T.Mesh(g,m);o.position.fromArray(p);o.castShadow=true;grip.add(o);return o};
 if(knight){
  part(new T.CylinderGeometry(.014,.018,.16,8),leather,[0,0,0]);part(new T.BoxGeometry(.15,.025,.035),gold,[0,.07,0]);
  const blade=new T.ConeGeometry(.035,.32,4);part(blade,steel,[0,.23,0]);
 }else if(mage){
  part(new T.CylinderGeometry(.012,.018,.55,8),leather,[0,.12,0]);part(new T.TorusGeometry(.065,.011,6,16),gold,[0,.40,0]);
  part(new T.OctahedronGeometry(.045),new T.MeshStandardMaterial({color:0x8cdeeb,emissive:0x428eae,emissiveIntensity:.65}),[0,.40,0]);
 }else{
  // Compact wooden spellbow; its grip is fixed to the wrist.
  part(new T.BoxGeometry(.045,.045,.20),leather,[0,.035,.07]);part(new T.BoxGeometry(.24,.025,.03),gold,[0,.045,.10]);
  part(new T.ConeGeometry(.015,.12,4).rotateX(Math.PI/2),steel,[0,.05,.22]);
 }
}
