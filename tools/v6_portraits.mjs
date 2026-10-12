// Render 256px hero portraits (head and shoulders, idle pose, transparent) from packed hero folders.
// node tools/v6_portraits.mjs OUT_DIR id1 id2 ...   (reads assets/hero-v6/<id>/model.json)
import { createRequire } from 'module';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const here = path.dirname(new URL(import.meta.url).pathname), root = path.join(here, '..');
const [, , outDir, ...ids] = process.argv;
mkdirSync(outDir, { recursive: true });
const exe = ['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', '/opt/pw-browsers/chromium'].find(existsSync);
const b = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 256, height: 256 } });
p.on('pageerror', (e) => console.error('page:', e.message));
await p.route('https://cdn.jsdelivr.net/npm/three@0.186.1/**', (r) => {
  const f = path.join(here, 'node_modules/three', r.request().url().split('three@0.186.1/')[1]);
  r.fulfill({ status: existsSync(f) ? 200 : 404, contentType: 'application/javascript', body: existsSync(f) ? readFileSync(f) : '' });
});
await p.route('http://pc.local/**', (r) => {
  const u = new URL(r.request().url());
  if (u.pathname === '/') return r.fulfill({ status: 200, contentType: 'text/html', body: PAGE });
  const f = path.join(root, decodeURIComponent(u.pathname));
  r.fulfill({ status: existsSync(f) ? 200 : 404, body: existsSync(f) ? readFileSync(f) : '' });
});
const PAGE = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:transparent">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three'; import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'; import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true}); r.setSize(256,256); r.outputColorSpace=THREE.SRGBColorSpace; r.setClearColor(0,0); document.body.appendChild(r.domElement);
const pm=new THREE.PMREMGenerator(r), env=pm.fromScene(new RoomEnvironment(),0.04).texture;
const clipsRaw=await (await fetch('/assets/animation/adventurer-clips.json')).json();
window.shot=async(id)=>{
  const pack=await (await fetch('/assets/hero-v6/'+id+'/model.json')).json(); const bin=atob(pack.glb), bytes=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  const g=await new GLTFLoader().parseAsync(bytes.buffer,'/assets/hero-v6/'+id+'/');
  const sc=new THREE.Scene(); sc.environment=env; sc.add(new THREE.HemisphereLight(0xfff4e6,0x445544,1.6)); const k=new THREE.DirectionalLight(0xfff0dd,2.4); k.position.set(1.2,2,3); sc.add(k); const rim=new THREE.DirectionalLight(0xbfd8ff,1.6); rim.position.set(-2,1.5,-2); sc.add(rim);
  const m=g.scene; sc.add(m);
  m.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.material.envMapIntensity=1.1;o.material.roughness=Math.max(.6,o.material.roughness);}});
  const root=m.getObjectByName('heroRoot'), rest=root.position.clone(), hipH=rest.y||.5;
  const c=clipsRaw.clips.find(c=>c.name==='Idle'); const clip=new THREE.AnimationClip(c.name,c.duration,c.tracks.map(t=>t.type==='vector'?new THREE.VectorKeyframeTrack(t.name,t.times,t.values.map((v,i)=>(i%3===0?rest.x:i%3===1?rest.y:rest.z)+v*hipH)):new THREE.QuaternionKeyframeTrack(t.name,t.times,t.values)));
  const mix=new THREE.AnimationMixer(m); mix.clipAction(clip).play(); mix.setTime(0.3); m.updateMatrixWorld(true);
  const head=m.getObjectByName('head').getWorldPosition(new THREE.Vector3()), chest=m.getObjectByName('chest').getWorldPosition(new THREE.Vector3());
  const box=new THREE.Box3().setFromObject(m), top=box.max.y;
  const look=new THREE.Vector3(head.x, (top*0.5+chest.y*0.5)-0.01, head.z);
  const span=Math.max(0.36,(top-chest.y)*1.4);
  const cam=new THREE.PerspectiveCamera(26,1,.01,20); const d=span/ (2*Math.tan(13*Math.PI/180));
  cam.position.set(look.x+d*0.32,look.y+d*0.06,look.z+d*0.95); cam.lookAt(look);
  r.render(sc,cam); return r.domElement.toDataURL('image/png');
};
window.READY=true;
</script>`;
await p.goto('http://pc.local/');
await p.waitForFunction(() => window.READY, null, { timeout: 60000 });
for (const id of ids) {
  const url = await p.evaluate((id) => window.shot(id), id);
  writeFileSync(path.join(outDir, id + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log(id);
}
await b.close();
