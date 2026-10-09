// Authored environment kit. All geometry is cached and instanced by the game.
// Decorations sit on existing footprints or outside the playable boundary.
export const REGION_ART = [
  { name:'Sunny Meadow', stone:0x8a9280, trim:0xe4d4a5, accent:0xebb866, dark:0x384943 },
  { name:'Ashwood Forest', stone:0x526459, trim:0x99aa80, accent:0xbccf7b, dark:0x283f3c },
  { name:'Frost Peaks', stone:0x849bad, trim:0xe7f0ef, accent:0x84d9eb, dark:0x344e68 },
  { name:'Ember Wastes', stone:0x504443, trim:0x99705b, accent:0xff9b50, dark:0x2b2934 },
  { name:'Starfall Ruins', stone:0x635c85, trim:0xb7a4ce, accent:0x90bdf0, dark:0x302f4d },
  { name:'Abyssal Depths', stone:0x38656b, trim:0x79a09b, accent:0x60e2cf, dark:0x203946 },
  { name:'Celestial Spire', stone:0xc6bb9e, trim:0xf5e9cc, accent:0xd9ab52, dark:0x6d6481 },
];

export function createWorldArt({THREE, GEO, part, mergeParts}) {
  const box=GEO.box, cone=GEO.cone7, cyl=GEO.cyl7;
  const crown=new THREE.IcosahedronGeometry(1,1), crystal=new THREE.CylinderGeometry(.65,1,1,6);
  const ring=new THREE.TorusGeometry(1,.055,4,32), disk=new THREE.CylinderGeometry(1,1,1,16);
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94,metalness:0});
  const foliageMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
  const glowMaterial=new THREE.MeshBasicMaterial({vertexColors:true});
  const waterMaterial=new THREE.MeshStandardMaterial({color:0x3e8d99,roughness:.28,metalness:.12});
  const add=(a,g,c,p,s,r)=>a.push(part(g,c,p,r||null,s));
  const branch=(a,c,from,to,r0,r1)=>{
    const v=new THREE.Vector3(...to).sub(new THREE.Vector3(...from)), geo=new THREE.CylinderGeometry(r1,r0,v.length(),6);
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());
    const e=new THREE.Euler().setFromQuaternion(q);
    add(a,geo,c,from.map((n,i)=>(n+to[i])/2),[1,1,1],[e.x,e.y,e.z]);geo.dispose();
  };
  const shade=(g)=>{
    const p=g.attributes.position,n=g.attributes.normal,c=g.attributes.color;
    for(let i=0;i<p.count;i++){
      // Baked cavity tint keeps branches and overlapping leaves legible without SSAO.
      const k=.76+.19*Math.max(0,n.getY(i))+.05*Math.sin(p.getX(i)*6+p.getZ(i)*3);
      c.setXYZ(i,c.getX(i)*k,c.getY(i)*k,c.getZ(i)*k);
    }
    return g;
  };
  const mesh=a=>shade(mergeParts(a));
  const stem=[];
  branch(stem,0x765744,[0,0,0],[.08,2.2,-.06],.28,.12);
  for(let i=0;i<5;i++){const a=i*2.4;branch(stem,0x68503e,[0,.18,0],[Math.sin(a)*.7,.02,Math.cos(a)*.7],.12,.035);}
  branch(stem,0x836249,[0,1.2,0],[.8,2.4,.15],.12,.035);
  branch(stem,0x735441,[0,1.5,0],[-.7,2.6,-.3],.11,.035);
  const trunkGeo=mesh(stem), broad=[];
  [[0,2.65,0,1.05,.9],[.78,2.28,.12,.78,.66],[-.68,2.45,-.3,.88,.65],[.2,3.34,-.14,.74,.62],[-.4,2.7,.7,.72,.58],[.63,2.9,-.62,.66,.56]].forEach(([x,y,z,s,h],i)=>add(broad,crown,[0xf2f4d6,0xc6d3b7,0xe2e9c8,0xffffff,0xd5e0bd,0xe3edd0][i],[x,y,z],[s,h,s],[0,i*.7,.08*i]));
  const broadGeo=mesh(broad), pine=[];
  for(let i=0;i<5;i++){
    const y=1.3+i*.63,r=1.32-i*.23;
    add(pine,cone,i%2?0xe1e8d9:0xf8f9e4,[.04*Math.sin(i),y,0],[r,1.6-i*.12,r],[0,i*.63,.025*Math.sin(i)]);
    for(let j=0;j<3;j++){const a=j*2.094+i;add(pine,cone,0xc8d5be,[Math.sin(a)*r*.56,y-.23,Math.cos(a)*r*.56],[r*.45,.62,r*.5],[.12*Math.cos(a),a,.12*Math.sin(a)]);}
  }
  const pineGeo=mesh(pine), crystals=[];
  [[0,1.25,0,.45,2.5,0],[.52,.65,.16,.26,1.3,-.3],[-.4,.52,-.23,.23,1.05,.38]].forEach(([x,y,z,r,h,tilt])=>{
    add(crystals,crystal,0xc5d3e5,[x,y,z],[r,h,r],[0,.3,tilt]);
    add(crystals,cone,0xf1f9ff,[x+Math.sin(-tilt)*h*.47,y+h*.5,z],[r*.65,.6,r*.65],[0,.3,tilt]);
  });
  const crystalGeo=mesh(crystals), coral=[];
  for(let i=0;i<5;i++){
    const a=i*2.4, tip=[Math.sin(a)*.68,1.2+(i%3)*.36,Math.cos(a)*.65];
    branch(coral,0xcde9e2,[0,.04,0],tip,.18,.07);
    for(let j=-1;j<=1;j+=2){const end=[tip[0]+j*.35,tip[1]+.38,tip[2]+.2];branch(coral,0xedfff1,tip,end,.07,.025);add(coral,crown,0xffffff,end,[.12,.16,.12]);}
  }
  const coralGeo=mesh(coral), rocks=[];
  add(rocks,crown,0xe0e5e5,[0,.3,0],[.87,.68,.7],[.1,.5,.2]);
  add(rocks,crown,0xffffff,[.16,.55,-.13],[.63,.39,.58],[.13,.8,.06]);
  add(rocks,crown,0xb2bcb7,[-.55,.12,.22],[.4,.25,.4],[.2,.2,.4]);
  const rockGeo=mesh(rocks), bush=[];
  for(let i=0;i<5;i++){const a=i*2.4;add(bush,crown,i%2?0xd0dfbd:0xffffff,[Math.sin(a)*.42,.34+(i%2)*.2,Math.cos(a)*.38],[.49,.38,.45],[0,a,.12]);}
  const bushGeo=mesh(bush), tuft=[];
  // Bent tapered blades; opaque geometry avoids alpha-card sorting and overdraw.
  for(let i=0;i<5;i++){const a=i*2.4,h=.23+(i%3)*.11;add(tuft,cone,i%2?0xc9dba4:0xffffff,[Math.sin(a)*.13,h*.5,Math.cos(a)*.13],[.038,h,.095],[.22*Math.cos(a),a,.25*Math.sin(a)]);}
  const tuftGeo=mesh(tuft);

  function town(parts,T,houseAngles,palette){
    houseAngles.forEach((a,i)=>{
      const x=T.x+Math.sin(a)*17,z=T.z+Math.cos(a)*17,rot=a+Math.PI;
      const p=(lx,y,lz)=>[x+Math.cos(rot)*lx+Math.sin(rot)*lz,y,z-Math.sin(rot)*lx+Math.cos(rot)*lz];
      const beam=(lx,y,lz,s,c=0x614937)=>add(parts,box,c,p(lx,y,lz),s,[0,rot,0]);
      // Timber framing and a recessed stone threshold inside each existing house footprint.
      for(const side of [-1,1]){beam(side*1.95,1.4,1.83,[.16,2.8,.16]);beam(side*1.95,1.4,-1.83,[.16,2.8,.16]);}
      beam(0,.24,1.84,[4.15,.18,.17]);beam(0,2.65,1.84,[4.15,.17,.17]);
      beam(0,.06,1.95,[1.3,.12,.42],0x999388);
      beam(1.3,1.7,1.87,[.87,.88,.07]);beam(1.3,1.7,1.92,[.6,.6,.04],0xffd99a);
      beam(1.3,1.7,1.95,[.07,.64,.04]);beam(1.3,1.7,1.95,[.64,.07,.04]);
      beam(1.3,1.18,1.98,[1.03,.25,.3],0x77513c);
      for(let k=0;k<3;k++)add(parts,crown,[0x91a86e,0xb4bd7b,0xaeb76b][k],p(1+k*.29,1.38,1.99),[.22,.19,.2]);
      // Layered eave tiles, warm clay faces and cool undersides, not extra texture downloads.
      for(const side of [-1,1])for(let k=0;k<7;k++)beam(-1.92+k*.64,2.95,side*1.78,[.61,.15,.55],palette.roof[i%palette.roof.length]);
      beam(0,4.6,0,[.13,.15,3.3],0xd0b18a);
    });
    for(let i=0;i<12;i++){const a=i*Math.PI/6;add(parts,box,0xc3beb0,[T.x+Math.sin(a)*2.85,.51,T.z+Math.cos(a)*2.85],[.7,.18,.5],[0,a,0]);}
    add(parts,ring,0xd3cbbb,[T.x,.57,T.z],[2.85,2.85,2.85],[Math.PI/2,0,0]);
    add(parts,ring,0x9cd7d6,[T.x,2.39,T.z],[.85,.85,.85],[Math.PI/2,0,0]);
  }

  function zoneLandmarks(group,W,zi){
    const style=REGION_ART[zi], parts=[], zn=W.zones[zi], glow=[];
    // Existing lair is the focal landmark; its central combat disc remains unobstructed.
    const lair=W.lairs[zi];
    if(lair){
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4+Math.PI/8,x=lair.x+Math.sin(a)*9.5,z=lair.z+Math.cos(a)*9.5;
        add(parts,box,style.dark,[x,.16,z],[1.35,.32,1.12],[0,a,0]);
        add(parts,box,style.trim,[x,2.63,z],[1.23,.16,.96],[0,a,0]);
        add(parts,box,style.accent,[x+Math.sin(a)*.43,1.48,z+Math.cos(a)*.43],[.18,.8,.06],[0,a,0]);
        if(zi>=2)add(glow,crystal,style.accent,[x,3.05,z],[.22,.7,.22],[0,a,0]);
      }
      for(let i=0;i<32;i++){
        const a=i*Math.PI/16,r=7.7;add(parts,box,style.trim,[lair.x+Math.sin(a)*r,.055,lair.z+Math.cos(a)*r],[.18,.035,.55],[0,a,0]);
      }
    }
    // Region gates: stepped bases, engraved lintels, distinct stone and metal treatments.
    if(zi>0){for(const x of [-3.2,3.2]){
      add(parts,box,style.dark,[x,.18,zn.z0],[1.14,.36,1.16]);
      add(parts,box,style.trim,[x,3.87,zn.z0],[1.03,.17,1.04]);
      add(parts,box,style.accent,[x,2.7,zn.z0-.48],[.24,1.4,.06]);
    }
      add(parts,box,style.trim,[0,4.94,zn.z0],[7.45,.16,1.04]);
      for(let i=-2;i<=2;i++)add(parts,crystal,style.accent,[i*.85,4.53,zn.z0-.53],[.12,.28,.08],[0,0,.45]);
    }
    // Distant silhouettes live beyond collision bounds: biome-specific horizon architecture.
    for(const side of [-1,1])for(let j=0;j<4;j++){
      const x=side*(W.maxX+9+j%2*5),z=zn.z0+23+j*(zn.z1-zn.z0-42)/3;
      if(zi<=2||zi===3){
        add(parts,crown,style.dark,[x,3,z],[8,6+(j%3)*2,10],[.2,j,.1]);
        add(parts,crown,zi===2?style.trim:style.stone,[x-2*side,5,z+1],[6,4,7],[.1,j,.2]);
      }else{
        for(const s of [-1,1])add(parts,box,style.stone,[x+s*3.4,5.3,z],[1.8,10.6,2],[0,.08*s,.03*s]);
        add(parts,box,style.trim,[x,10.8,z],[9,.9,2.2],[0,0,.03]);
        add(parts,ring,style.accent,[x,8,z],[2.3,2.3,2.3]);
      }
    }
    const m=new THREE.Mesh(mesh(parts),material);m.name='World art / '+style.name;m.castShadow=true;m.receiveShadow=true;group.add(m);
    if(glow.length){const g=new THREE.Mesh(mergeParts(glow),glowMaterial);g.name='Lair crystals / '+style.name;group.add(g);}
    return m;
  }

  function arena(parts,center,half){
    // Tournament masonry, heraldic trim and exterior terraces. Cover footprints stay exact.
    for(let ringIndex=0;ringIndex<3;ringIndex++)for(const s of [-1,1]){
      const d=half+2+ringIndex*2,h=.4+ringIndex*.55;
      add(parts,box,ringIndex%2?0x586079:0x747b90,[center.x+s*d,h/2,center.z],[1.8,h,half*2+8]);
      add(parts,box,ringIndex%2?0x586079:0x747b90,[center.x,h/2,center.z+s*d],[half*2+8,h,1.8]);
    }
    for(const s of [-1,1])for(let k=-2;k<=2;k++){
      const x=center.x+k*8,z=center.z+s*(half+.65);
      add(parts,box,0xbdad88,[x,.25,z],[1.1,.5,1.4]);add(parts,box,0xa5a6ad,[x,1.25,z],[.6,2.5,.8]);
      add(parts,cone,0xdfb96d,[x,2.75,z],[.5,.65,.5]);
    }
    add(parts,ring,0xb6a16f,[center.x,.03,center.z],[4.5,4.5,4.5],[Math.PI/2,0,0]);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;add(parts,box,0xbaa574,[center.x+Math.sin(a)*3,.025,center.z+Math.cos(a)*3],[.12,.02,1.1],[0,a,0]);}
  }

  function rift(parts,center,radius){
    // Fractured platform skirt and buttresses make the sanctum read as architecture.
    for(let i=0;i<24;i++){
      const a=i*Math.PI/12,r=radius+1.5;
      add(parts,crystal,i%2?0x413952:0x302b44,[center.x+Math.sin(a)*r,-1.6,center.z+Math.cos(a)*r],[1.25,4+(i%3),1.25],[.1,a,.1]);
      add(parts,box,0x84719b,[center.x+Math.sin(a)*(radius-.3),.14,center.z+Math.cos(a)*(radius-.3)],[1.7,.28,.65],[0,a,0]);
    }
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3+.52,x=center.x+Math.sin(a)*13,z=center.z+Math.cos(a)*13;
      add(parts,disk,0x726384,[x,.56,z],[1.15,.15,1.15]);
      add(parts,ring,0xc594d8,[x,2.7,z],[.7,.7,.7],[Math.PI/2,.15,0]);
    }
  }
  // Source primitives have been copied into the cached meshes; retain only ones used at world build.
  return {material,foliageMaterial,glowMaterial,waterMaterial,trunkGeo,broadGeo,pineGeo,crystalGeo,coralGeo,rockGeo,bushGeo,tuftGeo,town,zoneLandmarks,arena,rift};
}
