// Hand-built low-poly equipment and treasure models. Portraits share the game's
// existing thumbnail renderer, render once during idle time and retain only PNGs.
export function createPremiumPortraits(THREE, getRenderer) {
  const cache = new Map(), pending = new Set(), queue = [];
  let scheduled = false;
  const palette = {
    common: [0x765543, 0xa99673, 0xb7c9d0, 0x66bad1],
    uncommon: [0x226452, 0xc3ae65, 0x94babb, 0x81e59b],
    rare: [0x244e91, 0xc8a85d, 0xc7e6ef, 0x48ccff],
    epic: [0x513279, 0xd7b86a, 0xc7b5e7, 0xc98aff],
    legendary: [0x9e4127, 0xf4cc76, 0xf5da9a, 0xffa34d],
    mythic: [0x4e223c, 0xb07d8b, 0x96738b, 0xff5579],
    ancient: [0x234c50, 0xbea472, 0x84c4c0, 0x54ffd6],
    divine: [0xe3e9ef, 0xe4bc66, 0xf2f7ff, 0xffec92],
  };
  function builder(tones) {
    const root = new THREE.Group();
    const mats = tones.map((color, i) => new THREE.MeshStandardMaterial({color, roughness: i === 2 ? .34 : .68, metalness: i === 1 || i === 2 ? .6 : .12, flatShading: true}));
    mats.push(new THREE.MeshStandardMaterial({color:0x1a2232, roughness:.8, flatShading:true}));
    const add = (geo, m, p=[0,0,0], s=[1,1,1], rot=[0,0,0]) => {const mesh=new THREE.Mesh(geo,mats[m]);mesh.position.fromArray(p);mesh.scale.fromArray(s);mesh.rotation.fromArray(rot);root.add(mesh);return mesh;};
    const box = (m,p,s,r) => add(new THREE.BoxGeometry(1,1,1),m,p,s,r);
    const sphere = (m,p,s,r) => add(new THREE.IcosahedronGeometry(1,1),m,p,s,r);
    const cyl = (m,p,s,r) => add(new THREE.CylinderGeometry(1,1,1,8),m,p,s,r);
    const gem = (p,s=[.18,.25,.12],m=3) => add(new THREE.OctahedronGeometry(1),m,p,s);
    const rivets = (xs,y,z) => xs.forEach(x=>sphere(1,[x,y,z],[.035,.035,.028]));
    return {root,add,box,sphere,cyl,gem,rivets};
  }
  function equipment(it) {
    const b=builder(palette[it.rarity] || palette.common), {root,add,box,sphere,cyl,gem,rivets}=b;
    const noun=(it.name || '').split(' ').pop().toLowerCase();
    if(it.slot==='weapon') {
      if(noun==='focus') {
        cyl(0,[0,0,0],[.085,1.9,.085]);
        for(const y of [-.65,-.2,.3])cyl(1,[0,y,0],[.105,.1,.105]);
        gem([0,1.12,0],[.3,.4,.3]);
        for(const x of [-1,1]){box(1,[x*.28,.89,0],[.12,.6,.14],[0,0,-x*.38]);gem([x*.38,1.15,0],[.07,.16,.08]);}
        sphere(1,[0,-1.02,0],[.13,.13,.13]);
      } else if(noun==='fang') {
        cyl(0,[0,-.22,0],[.09,1.65,.09]);
        add(new THREE.CylinderGeometry(.56,.56,.14,8,1,false,0,Math.PI),2,[.1,.6,0],[1,1,1],[Math.PI/2,0,-Math.PI/2]);
        box(1,[0,.6,0],[.19,.55,.25]);gem([0,.62,.16]);
        for(const y of [-.7,-.5,-.3])cyl(1,[0,y,0],[.11,.04,.11]);
      } else {
        const blade=new THREE.Shape();blade.moveTo(-.18,.1);blade.lineTo(-.18,1.17);blade.lineTo(0,1.58);blade.lineTo(.18,1.17);blade.lineTo(.18,.1);blade.closePath();
        add(new THREE.ExtrudeGeometry(blade,{depth:.11,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:1,steps:1}),2,[0,0,-.055]);
        box(1,[0,.1,0],[.92,.14,.2]);for(const x of [-1,1])box(1,[x*.43,.17,0],[.15,.22,.19],[0,0,x*.5]);
        cyl(0,[0,-.27,0],[.1,.58,.1]);for(const y of [-.45,-.3,-.15])cyl(1,[0,y,0],[.11,.035,.11]);gem([0,-.65,0],[.16,.18,.12]);
        box(1,[0,.7,.105],[.055,.85,.02]);
      }
      root.rotation.z=-.42;
    } else if(it.slot==='helmet') {
      sphere(2,[0,.15,0],[.66,.66,.53]);
      box(4,[0,.14,.48],[1.03,.19,.11]);
      box(1,[0,.31,.54],[1.15,.075,.1]);box(2,[0,-.13,.56],[.18,.46,.14]);
      for(const x of [-1,1]){box(0,[x*.51,-.16,.22],[.17,.57,.43],[0,0,-x*.17]);box(1,[x*.49,-.41,.45],[.16,.12,.18]);}
      cyl(1,[0,.77,0],[.14,.3,.13]);gem([0,1.02,0],[.22,.32,.12]);
      rivets([-.42,-.25,.25,.42],.31,.605);
      if(noun==='hood'){sphere(0,[0,.21,-.05],[.76,.8,.6]);box(4,[0,.06,.53],[.8,.65,.12]);gem([0,.65,.55],[.12,.15,.08]);}
      if(noun==='cap'){box(0,[0,.68,.1],[.83,.15,.78]);box(1,[0,.5,.55],[.91,.09,.21]);}
    } else if(it.slot==='chest') {
      sphere(noun==='robe'?0:2,[0,.15,0],[.64,.75,.31]);
      box(0,[0,-.57,0],[1.0,.15,.55]);box(1,[0,-.51,.32],[1.1,.11,.07]);
      for(const x of [-1,1]){sphere(2,[x*.72,.48,0],[.4,.32,.38]);box(1,[x*.73,.27,.3],[.48,.085,.08]);box(0,[x*.49,-.11,.23],[.12,1.0,.08],[0,0,x*.12]);}
      box(1,[0,.26,.33],[.08,.85,.07]);box(1,[0,.37,.35],[.72,.08,.07]);gem([0,.3,.43],[.16,.22,.09]);
      rivets([-.47,.47],-.46,.35);
      if(noun==='robe') {add(new THREE.CylinderGeometry(.46,.7,.8,8),0,[0,-.68,0]);box(1,[0,-.67,.63],[.08,.75,.06]);}
    } else if(it.slot==='boots') {
      for(const x of [-.35,.35]) {
        cyl(0,[x,.2,0],[.24,1.15,.24]);sphere(2,[x,.25,.16],[.23,.5,.14]);
        box(0,[x,-.48,.19],[.48,.38,.82]);box(4,[x,-.69,.19],[.52,.1,.87]);sphere(2,[x,-.48,.52],[.25,.16,.27]);
        for(const y of [.5,-.05]){box(1,[x,y,.24],[.5,.08,.09]);box(1,[x+.13,y,.3],[.1,.15,.05]);}
        gem([x,.28,.32],[.08,.12,.05]);
      }
      if(noun==='striders')for(const x of [-1,1])box(2,[x*.65,.3,0],[.35,.14,.13],[0,0,x*.35]);
    } else {
      if(noun==='ring') {
        add(new THREE.TorusGeometry(.5,.12,6,12),1,[0,0,0],[1,1,1],[.35,0,0]);gem([0,.54,.1],[.28,.3,.23]);
        for(const x of [-1,1])box(2,[x*.28,.48,.08],[.16,.15,.17],[0,0,-x*.45]);
      } else {
        add(new THREE.TorusGeometry(.55,.032,4,16,Math.PI*1.6),1,[0,.55,0],[1,1,1],[0,0,-.3]);
        sphere(1,[0,-.04,0],[.54,.61,.14]);sphere(0,[0,-.04,.15],[.41,.47,.05]);gem([0,-.03,.25],[.28,.36,.15]);
        for(const x of [-1,1])gem([x*.39,-.14,.15],[.08,.14,.065]);gem([0,-.58,.05],[.12,.2,.08]);
      }
    }
    return root;
  }
  function treasure(kind) {
    const colors={hunter:[0x224947,0xa8b8b8,0x98c0bc,0x6fe0b6],treasure:[0x71442a,0xeac06c,0xa99274,0x6edbe5],boss:[0x503a31,0xd99a55,0xa99882,0xff7a39],rift:[0x2b2446,0x9272c2,0x5b497e,0xf372c2],milestone:[0x493271,0xdeb867,0xa9a4d5,0xbf8fff]};
    const {root,add,box,sphere,cyl,gem,rivets}=builder(colors[kind] || colors.treasure);
    box(0,[0,-.15,0],[1.8,.95,1.15]);
    add(new THREE.CylinderGeometry(.58,.58,1.8,8,1,false,0,Math.PI),0,[0,.32,0],[1,1,1],[0,0,Math.PI/2]);
    box(4,[0,.17,.595],[1.83,.065,.04]);
    for(const x of [-.67,.67]){box(1,[x,-.17,.59],[.15,.88,.075]);box(1,[x,-.17,-.59],[.15,.88,.075]);box(1,[x,.44,0],[.16,.18,1.2]);}
    box(1,[0,-.6,0],[1.88,.12,1.2]);box(1,[0,-.04,.65],[.36,.44,.13]);gem([0,.015,.77],[.14,.17,.08]);
    rivets([-.75,-.55,.55,.75],-.48,.65);rivets([-.75,-.55,.55,.75],.3,.65);
    if(kind==='treasure') {
      for(const y of [-.4,-.18,.04])box(2,[0,y,.61],[1.55,.025,.03]);
      gem([0,.7,0],[.15,.2,.15]);
    } else if(kind==='hunter') {
      box(2,[0,.4,0],[1.86,.22,1.24]);
      for(const x of [-.3,0,.3])box(4,[x,-.27,.66],[.12,.34,.05],[0,0,.45]);
      for(const x of [-.45,.45]){cyl(1,[x,.58,0],[.075,.65,.075],[0,0,Math.PI/2]);gem([x,.61,.4],[.085,.13,.055]);}
    } else if(kind==='boss') {
      for(const x of [-1,1]){sphere(2,[x*.72,.43,0],[.38,.42,.7]);add(new THREE.ConeGeometry(.16,.55,4),1,[x*.98,.74,0],[1,1,1],[0,0,-x*.6]);}
      box(2,[0,.1,.69],[.84,.47,.15]);for(const x of [-.25,.25])gem([x,.2,.8],[.11,.09,.045]);
      box(4,[0,-.04,.79],[.62,.08,.035]);
    } else if(kind==='rift') {
      for(const x of [-.7,-.35,.35,.7]){add(new THREE.ConeGeometry(.13,.56,4),2,[x,.65,0],[1,1,1],[0,0,-x*.5]);}
      gem([0,.71,0],[.32,.43,.26]);for(const x of [-1,1])box(3,[x*.47,-.25,.63],[.09,.45,.035],[0,0,x*.4]);
    } else {
      for(const x of [-1,1])for(let i=0;i<3;i++)box(1,[x*(.9+i*.14),.21+i*.15,.06],[.18,.5-i*.08,.15],[0,0,-x*.4]);
      gem([0,.71,0],[.28,.36,.24]);box(1,[0,-.25,.75],[.58,.07,.04]);
    }
    return root;
  }
  const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xfff1da,0x24324b,2.1));
  const key=new THREE.DirectionalLight(0xffebce,3.5);key.position.set(-3,5,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0x8cbeff,2.2);rim.position.set(3,2,-3);scene.add(rim);
  const camera=new THREE.PerspectiveCamera(32,1,.01,50);
  const blank='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"></svg>');
  function dispose(root){const geos=new Set(),mats=new Set();root.traverse(o=>{if(o.isMesh){geos.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));}});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}
  function render(root) {
    const r=getRenderer(),oldSize=r.getSize(new THREE.Vector2()),oldTone=r.toneMapping,oldExposure=r.toneMappingExposure;
    const bounds=new THREE.Box3().setFromObject(root),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());root.position.sub(center);
    const scale=1.8/Math.max(size.x,size.y,size.z);root.scale.multiplyScalar(scale);root.position.multiplyScalar(scale);scene.add(root);
    camera.position.set(2.25,1.55,4);camera.lookAt(0,0,0);
    try {
      r.setSize(96,96,false);r.toneMapping=THREE.NeutralToneMapping;r.toneMappingExposure=1;r.render(scene,camera);
      const c=document.createElement('canvas');c.width=c.height=96;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(r.domElement,0,0);
      const d=ctx.getImageData(0,0,96,96),pixels=d.data,alpha=new Uint8Array(96*96);
      for(let i=0;i<alpha.length;i++){const p=i*4;alpha[i]=pixels[p+3]>140?255:0;pixels[p+3]=alpha[i];for(let j=0;j<3;j++)pixels[p+j]=Math.min(255,Math.round(pixels[p+j]/16)*16);}
      for(let y=1;y<95;y++)for(let x=1;x<95;x++){const i=y*96+x;if(!alpha[i]&&(alpha[i-1]||alpha[i+1]||alpha[i-96]||alpha[i+96])){const p=i*4;pixels[p]=14;pixels[p+1]=17;pixels[p+2]=27;pixels[p+3]=255;}}
      ctx.putImageData(d,0,0);return c.toDataURL('image/png');
    } finally {scene.remove(root);dispose(root);r.setSize(oldSize.x,oldSize.y,false);r.toneMapping=oldTone;r.toneMappingExposure=oldExposure;}
  }
  function pump(){scheduled=false;const task=queue.shift();if(!task)return;let url=task.fallback;try{url=render(task.make());}catch(e){console.warn('Equipment portrait fallback',e);}pending.delete(task.key);cache.set(task.key,url);if(cache.size>160)cache.delete(cache.keys().next().value);document.querySelectorAll('img').forEach(img=>{if(img.getAttribute('src')===task.token)img.src=url;});schedule();}
  function schedule(){if(!scheduled&&queue.length){scheduled=true;if(typeof requestIdleCallback==='function')requestIdleCallback(pump,{timeout:1000});else setTimeout(pump,32);}}
  function request(key,make,fallback=blank){fallback=fallback||blank;if(cache.has(key))return cache.get(key);const token=fallback+'#premium-'+encodeURIComponent(key);if(!pending.has(key)){pending.add(key);queue.push({key,make,fallback,token});schedule();}return token;}
  return {
    item(it,fallback){const key=['item',it.slot,it.rarity,(it.name||'').split(' ').pop(),it.elem||''].join('-');return request(key,()=>equipment(it),fallback);},
    case(kind){return request('case-'+kind,()=>treasure(kind));},
  };
}
