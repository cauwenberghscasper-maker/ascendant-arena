import { createCrystalDragon } from './crystal-dragon.js';
// Original low-poly prototypes; these are not generated Hugging Face meshes.
export function createCompanion(api,id,stage) {
  if(id==='crystal')return createCrystalDragon(api,stage);
  const {THREE,GEO,part,mergeParts}=api, root=new THREE.Group(), body=[], accent=[];
  const add=(list,geo,col,pos,scale,rot)=>list.push(part(geo,col,pos,rot||null,scale));
  const gold=0xd9ac65, ink=0x152332;
  if(id==='bull') {
    add(body,GEO.ico1,0x803b38,[0,.42,-.08],[.31,.3,.4]);
    add(body,GEO.ico1,0xc35a43,[0,.68,.22],[.36,.31,.3]);
    add(body,GEO.ico1,0xefb27a,[0,.55,.48],[.28,.15,.14]);
    for(const s of [-1,1]) {
      add(body,GEO.ico0,ink,[s*.16,.6,.59],[.05,.055,.012]);
      add(body,GEO.ico1,ink,[s*.18,.77,.46],[.072,.08,.025]);
      add(body,GEO.ico0,0xffdfa3,[s*.18,.78,.48],[.027,.033,.012]);
      add(body,GEO.ico0,0xa64039,[s*.4,.77,.19],[.14,.08,.11]);
      add(body,GEO.cone7,0xf2dfb5,[s*.32,1.01,.18],[.11,.35,.1],[0,0,-s*.35]);
      for(const z of [-.28,.12]) {
        add(body,GEO.ico0,0x783d36,[s*.2,.18,z],[.11,.22,.12]);
        add(body,GEO.ico0,ink,[s*.2,.06,z+.03],[.12,.07,.15]);
      }
    }
    add(accent,GEO.cyl7,0x963c34,[0,.32,-.54],[.04,.35,.04],[.7,0,0]);
    add(accent,GEO.ico0,gold,[0,.18,-.66],[.08,.08,.08]);
  } else if(id==='sprout') {
    for(const [x,y,z,s] of [[0,.37,0,.3],[-.25,.3,.1,.22],[.25,.31,.11,.24],[0,.54,-.1,.26],[-.18,.59,-.07,.19],[.19,.62,-.08,.2]])
      add(body,GEO.ico1,0xb9c9bd,[x,y,z],[s,s*.9,s]);
    for(const s of [-1,1]) {
      add(body,GEO.ico1,ink,[s*.14,.42,.3],[.065,.08,.027]);
      add(body,GEO.ico0,0xf4e6b1,[s*.15,.45,.322],[.019,.023,.011]);
      add(body,GEO.ico0,0x8ca387,[s*.2,.075,.03],[.13,.1,.19]);
      add(accent,GEO.ico0,0x6baf73,[s*.19,.96,-.03],[.23,.06,.12],[0,0,s*.33]);
    }
    add(accent,GEO.cyl7,0x548b55,[0,.84,-.03],[.035,.35,.035]);
    add(body,GEO.ico0,0x617f64,[0,.63,.19],[.18,.04,.16]);
  } else {
    add(body,GEO.ico1,0x409975,[0,.32,0],[.42,.32,.38]);
    add(body,GEO.ico1,0x80c7a3,[0,.51,.02],[.33,.26,.3]);
    for(const s of [-1,1]) {
      add(body,GEO.ico1,ink,[s*.14,.52,.285],[.053,.075,.024]);
      add(body,GEO.ico0,0xffe9ba,[s*.15,.55,.304],[.017,.025,.008]);
    }
    add(body,GEO.ico0,0x285b55,[0,.39,.36],[.075,.015,.012]);
    add(accent,GEO.ico0,0xb5e7c5,[-.19,.66,.11],[.065,.09,.02]);
  }
  if(stage>=2)add(body,GEO.ico0,gold,[0,.28,.36],[.10,.08,.035]);
  if(stage>=3)for(const s of [-1,1])add(body,GEO.cone4,0x73c8c9,[s*.23,.88,-.12],[.06,.17,.065],[0,0,-s*.3]);
  if(stage>=4)add(body,GEO.cone4,gold,[0,1.07,-.08],[.055,.16,.06]);
  if(stage>=5)add(body,GEO.ico0,0xe8f5b8,[0,1.17,-.08],[.065,.09,.065]);
  const material=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.68,metalness:.08}), geometries=[];
  for(const pieces of [body,accent])if(pieces.length){const geo=mergeParts(pieces);geometries.push(geo);const mesh=new THREE.Mesh(geo,material);mesh.castShadow=false;root.add(mesh);}
  root.name=id+'Companion';root.userData.triangles=geometries.reduce((n,g)=>n+(g.index?g.index.count:g.attributes.position.count)/3,0);
  return {root,animate(t,calm){const k=calm?0:Math.sin(t*(id==='slime'?3.5:2.2))*.035;root.children[0].scale.set(1-k,1+k,1-k);},
    dispose(){geometries.forEach(g=>g.dispose());material.dispose();root.clear();}};
}
