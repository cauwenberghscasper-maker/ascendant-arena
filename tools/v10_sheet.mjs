// Contact sheet of GLB models (3/4 view and front view) for visual review.
// node tools/v10_sheet.mjs OUT.png A.glb B.glb ...
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const here = path.dirname(new URL(import.meta.url).pathname);
const [, , outPng, ...models] = process.argv;
const exe = ['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', '/opt/pw-browsers/chromium'].find(existsSync);
const b = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const C = 4, S = 260, R = Math.ceil(models.length / C);
const p = await b.newPage({ viewport: { width: C * S * 2, height: R * S } });
p.on('pageerror', (e) => console.error(e.message));
await p.route('http://sheet.local/**', (r) => {
  const u = new URL(r.request().url());
  if (u.pathname.startsWith('/three/')) { const f = path.join(here, 'node_modules/three', u.pathname.slice(7)); return r.fulfill({ status: existsSync(f) ? 200 : 404, contentType: 'application/javascript', body: existsSync(f) ? readFileSync(f) : '' }); }
  if (u.pathname.startsWith('/m/')) return r.fulfill({ status: 200, contentType: 'model/gltf-binary', body: readFileSync(models[+u.pathname.slice(3)]) });
  r.fulfill({ status: 200, contentType: 'text/html', body: `<!doctype html><body style="margin:0;background:#999"><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three'; import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const N=${models.length},C=${C},S=${S},R=${R};
const r=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); r.setSize(C*S*2,R*S); r.outputColorSpace=THREE.SRGBColorSpace; r.setScissorTest(true); document.body.appendChild(r.domElement);
for(let i=0;i<N;i++){ const g=await new GLTFLoader().loadAsync('/m/'+i); const sc=new THREE.Scene(); sc.background=new THREE.Color(i%2?0xb8b8b8:0xc4c4c4);
  sc.add(new THREE.HemisphereLight(0xffffff,0x666655,2)); const sun=new THREE.DirectionalLight(0xffffff,2); sun.position.set(2,4,3); sc.add(sun); sc.add(g.scene);
  const box=new THREE.Box3().setFromObject(g.scene), size=box.getSize(new THREE.Vector3()), c=box.getCenter(new THREE.Vector3()), d=Math.max(size.x,size.y,size.z)*1.9;
  [[1,.7,1],[0,.15,1]].forEach((v,k)=>{const cam=new THREE.PerspectiveCamera(32,1,.01,100); cam.position.set(c.x+v[0]*d*.72,c.y+v[1]*d*.72,c.z+v[2]*d*.72); cam.lookAt(c);
    const x=((i%C)*2+k)*S, y=(R-1-Math.floor(i/C))*S; r.setViewport(x,y,S,S); r.setScissor(x,y,S,S); r.render(sc,cam);}); }
window.DONE=true;
</script>` });
});
await p.goto('http://sheet.local/');
await p.waitForFunction(() => window.DONE || false, null, { timeout: 180000 });
await p.screenshot({ path: outPng });
await b.close();
