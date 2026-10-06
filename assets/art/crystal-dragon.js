// Bespoke, code-built 3D prototype. Not an AI-generated or rigged Hugging Face mesh.
// Four merged meshes: body, left wing, right wing and articulated tail. No textures.
export function createCrystalDragon({THREE, GEO, part, mergeParts}, level) {
  const stage = Math.min(5, Math.max(1, level)), root = new THREE.Group();
  root.name = 'CrystalDragon';
  const blue = 0x236c91, dark = 0x183e69, teal = 0x51b7bd, cream = 0xefe1b2, gold = 0xd9a34c, ink = 0x13213b;
  const body = [], tail = [], geometries = [];
  const p = (list, geo, color, pos, scale, rot) => list.push(part(geo, color, pos, rot || null, scale));
  p(body,GEO.ico1,blue,[0,.42,0],[.24,.28,.31]);
  p(body,GEO.ico1,cream,[0,.44,.23],[.17,.22,.065]);
  p(body,GEO.ico1,blue,[0,.74,.19],[.29,.25,.28]);
  p(body,GEO.ico1,teal,[0,.67,.39],[.22,.13,.18]);
  p(body,GEO.ico0,cream,[0,.61,.4],[.2,.055,.15]);
  for (const s of [-1,1]) {
    p(body,GEO.ico1,ink,[s*.21,.76,.39],[.085,.105,.06]);
    p(body,GEO.ico0,0xffc65a,[s*.216,.76,.434],[.047,.067,.024]);
    p(body,GEO.ico0,ink,[s*.216,.767,.454],[.017,.037,.009]);
    p(body,GEO.ico0,0xffffff,[s*.209,.791,.455],[.013,.014,.008]);
    p(body,GEO.cone7,cream,[s*.2,1.0,.04],[.052,.24+.025*stage,.052],[0,0,-s*.32]);
    p(body,GEO.cyl7,gold,[s*.16,.31,.1],[.075,.06,.085]);
    for (const z of [-.13,.18]) {
      p(body,GEO.ico1,blue,[s*.18,.2,z],[.105,.16,.105]);
      p(body,GEO.ico0,dark,[s*.19,.09,z+.065],[.13,.07,.14]);
      for (const x of [-.055,0,.055]) p(body,GEO.cone4,cream,[s*.19+x,.08,z+.17],[.023,.065,.023],[Math.PI/2,0,0]);
    }
    p(body,GEO.ico0,teal,[s*.29,.71,.17],[.095,.09,.1],[0,0,s*.4]);
  }
  p(body,GEO.cyl8,gold,[0,.52,.02],[.257,.06,.255]);
  p(body,GEO.ico0,gold,[0,.49,.285],[.11,.14,.04]);
  p(body,GEO.ico0,0xffd574,[0,.49,.324],[.065,.09,.015]);
  for (let i=0;i<2+stage;i++) {
    const y=.95-i*.09, z=.0-i*.045;
    p(body,GEO.cone4,teal,[0,y,z],[.065,.16+(stage*.014),.075],[0,0,.14]);
  }
  if (stage>=3) for(const s of [-1,1]) p(body,GEO.ico0,gold,[s*.22,.39,-.04],[.10,.12,.11]);
  if (stage>=4) for(const s of [-1,1]) p(body,GEO.cone4,gold,[s*.09,1.03,.18],[.045,.1,.045]);
  if (stage>=5) p(body,GEO.ico0,0xffe7a7,[0,1.1,.16],[.055,.11,.06]);
  for(let i=0;i<6;i++) {
    const x=Math.sin(i*.28)*.19, y=.36+i*.012, z=-.18-i*.1, sc=.095-i*.011;
    p(tail,GEO.ico1,blue,[x,y,z],[sc,sc,sc*1.6]);
    if(i%2===0)p(tail,GEO.cone4,teal,[x,y+sc,z],[.035,.08,.04]);
  }
  const material = new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.6,metalness:.16});
  function mesh(parts,name,parent=root) {
    const geo=mergeParts(parts); geometries.push(geo);
    const m=new THREE.Mesh(geo,material);m.name=name;m.castShadow=false;parent.add(m);return m;
  }
  mesh(body,'Body'); const tailMesh=mesh(tail,'Tail');
  const wings=[];
  for(const s of [-1,1]) {
    const hinge=new THREE.Group();hinge.position.set(s*.18,.6,-.05);root.add(hinge);wings.push(hinge);
    const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(.2,.4);sh.lineTo(.65,.55);sh.lineTo(.56,.14);sh.lineTo(.35,.18);sh.lineTo(.28,-.1);sh.lineTo(.12,-.05);sh.closePath();
    const wingGeo=new THREE.ExtrudeGeometry(sh,{depth:.022,bevelEnabled:false});
    const pieces=[part(wingGeo,stage>=5?0x96d8da:teal,[0,0,0],null,[s,1,1])];
    p(pieces,GEO.cyl7,dark,[s*.10,.20,.025],[.022,.45,.022],[0,0,-s*.48]);
    p(pieces,GEO.cyl7,blue,[s*.42,.47,.025],[.024,.51,.024],[0,0,-s*1.23]);
    p(pieces,GEO.cone4,gold,[s*.65,.55,.02],[.055,.11,.055],[0,0,-s*.45]);
    mesh(pieces,s===1?'WingR':'WingL',hinge);wingGeo.dispose();
  }
  root.userData.triangles=geometries.reduce((n,g)=>n+(g.index?g.index.count:g.attributes.position.count)/3,0);
  return {
    root,
    animate(t,calm=false) {
      const flap=calm?.2:Math.sin(t*4.8)*.22;
      wings[0].rotation.y=-.24-flap;wings[1].rotation.y=.24+flap;
      tailMesh.rotation.y=calm?0:Math.sin(t*2.5)*.09;
    },
    dispose() { for(const g of geometries)g.dispose();material.dispose();root.clear(); }
  };
}
