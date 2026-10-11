// Bust portraits for the v4 heroes, rendered from the rigged models in their idle pose.
// node tools/v4_portraits.mjs OUT_DIR cls=path/to/hero_rigged.glb ...   -> OUT_DIR/<cls>.png (512px, transparent)
import { createRequire } from 'module';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const here = path.dirname(new URL(import.meta.url).pathname);
const [, , outDir, ...pairs] = process.argv;
mkdirSync(outDir, { recursive: true });
const exe = ['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', '/opt/pw-browsers/chromium'].find(existsSync);
const b = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 512, height: 512 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
let current = null;
await p.route('https://cdn.jsdelivr.net/npm/three@0.186.1/**', (r) => {
  const f = path.join(here, 'node_modules/three', r.request().url().split('three@0.186.1/')[1]);
  r.fulfill({ status: existsSync(f) ? 200 : 404, contentType: 'application/javascript', body: existsSync(f) ? readFileSync(f) : '' });
});
await p.route('http://v4.local/**', (r) => {
  const u = new URL(r.request().url());
  if (u.pathname === '/model.glb') return r.fulfill({ status: 200, contentType: 'model/gltf-binary', body: readFileSync(current) });
  if (u.pathname === '/clips.json') return r.fulfill({ status: 200, contentType: 'application/json', body: readFileSync(path.join(here, '../assets/animation/adventurer-clips.json')) });
  r.fulfill({ status: 200, contentType: 'text/html', body: PAGE });
});
const PAGE = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:transparent">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three'; import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'; import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true}); r.setSize(512,512); r.setClearColor(0,0); r.outputColorSpace=THREE.SRGBColorSpace; r.toneMapping=THREE.NeutralToneMapping; document.body.appendChild(r.domElement);
const sc=new THREE.Scene(); const pm=new THREE.PMREMGenerator(r); sc.environment=pm.fromScene(new RoomEnvironment(),0.04).texture;
sc.add(new THREE.HemisphereLight(0xfff4e0,0x3a3428,1.1)); const key=new THREE.DirectionalLight(0xffe6c0,2.4); key.position.set(-2,3,4); sc.add(key);
const rim=new THREE.DirectionalLight(0x9fc0ff,1.6); rim.position.set(3,2,-3); sc.add(rim);
const raw=await (await fetch('/clips.json')).json(); const g=await new GLTFLoader().loadAsync('/model.glb'); const m=g.scene; sc.add(m);
m.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false});
const root=m.getObjectByName('heroRoot'), rest=root.position.clone(), hipH=rest.y;
const clip=raw.clips.find(c=>c.name==='Idle'); const ac=new THREE.AnimationClip('Idle',clip.duration,clip.tracks.map(t=>t.type==='vector'?new THREE.VectorKeyframeTrack(t.name,t.times,t.values.map((v,i)=>(i%3===0?rest.x:i%3===1?rest.y:rest.z)+v*hipH)):new THREE.QuaternionKeyframeTrack(t.name,t.times,t.values)));
const mx=new THREE.AnimationMixer(m); mx.clipAction(ac).play(); mx.setTime(0.4); m.updateMatrixWorld(true);
const head=m.getObjectByName('head').getWorldPosition(new THREE.Vector3()), chest=m.getObjectByName('chest').getWorldPosition(new THREE.Vector3());
const top=1.0, focus=new THREE.Vector3(0,(head.y+top)/2,head.z), span=(top-chest.y)*1.12;
const cam=new THREE.PerspectiveCamera(24,1,0.01,20); const d=span/Math.tan(12*Math.PI/180)*0.55;
cam.position.set(focus.x+d*0.42,focus.y+0.04,focus.z+d*0.91); cam.lookAt(focus.x,focus.y-0.05,focus.z);
r.render(sc,cam); window.__png=r.domElement.toDataURL('image/png'); window.__ready=true;
</script>`;
for (const pair of pairs) {
  const [cls, file] = pair.split('=');
  current = file;
  await p.goto('http://v4.local/index.html?' + cls);
  await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const url = await p.evaluate(() => window.__png);
  writeFileSync(path.join(outDir, cls + '.png'), Buffer.from(url.split(',')[1], 'base64'));
}
if (errs.length) console.error(errs.join('\n'));
await b.close();
