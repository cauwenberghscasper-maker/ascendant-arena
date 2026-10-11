// Orthographic front renders of a GLB for tools/v4_pose.py (headless Chromium + three.js).
// node tools/v4_front.mjs MODEL.glb OUT_PREFIX "x0,y0,size;x0,y0,size;..."  -> OUT_PREFIX<i>.png (768x768)
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const [, , model, prefix, boxes] = process.argv;
const here = path.dirname(new URL(import.meta.url).pathname);
const exe = ['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', '/opt/pw-browsers/chromium'].find(existsSync);
const b = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 768, height: 768 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.route('https://cdn.jsdelivr.net/npm/three@0.186.1/**', (r) => {
  const f = path.join(here, 'node_modules/three', r.request().url().split('three@0.186.1/')[1]);
  r.fulfill({ status: existsSync(f) ? 200 : 404, contentType: 'application/javascript', body: existsSync(f) ? readFileSync(f) : '' });
});
await p.route('http://v4.local/**', (r) => {
  const u = new URL(r.request().url());
  if (u.pathname === '/model.glb') return r.fulfill({ status: 200, contentType: 'model/gltf-binary', body: readFileSync(model) });
  r.fulfill({ status: 200, contentType: 'text/html', body: PAGE });
});
const PAGE = `<!doctype html><meta charset="utf-8"><body style="margin:0">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three'; import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const r=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); r.setSize(768,768); r.outputColorSpace=THREE.SRGBColorSpace; document.body.appendChild(r.domElement);
const sc=new THREE.Scene(); sc.background=new THREE.Color(0xc8c8c8);
sc.add(new THREE.HemisphereLight(0xffffff,0x666655,1.6)); const sun=new THREE.DirectionalLight(0xffffff,1.6); sun.position.set(1,3,5); sc.add(sun);
const g=await new GLTFLoader().loadAsync('/model.glb'); sc.add(g.scene);
g.scene.traverse(o=>{if(o.isMesh){o.material.side=THREE.DoubleSide;}});
window.shot=(x0,y0,s)=>{const c=new THREE.OrthographicCamera(x0,x0+s,y0+s,y0,0.01,20); c.position.set(0,0,5); c.lookAt(0,0,-1); c.position.set(0,0,5);
  r.render(sc,c); return r.domElement.toDataURL('image/png');};
window.__ready=true;
</script>`;
await p.goto('http://v4.local/index.html');
await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
const list = boxes.split(';').map((s) => s.split(',').map(Number));
const fs = await import('fs');
for (let i = 0; i < list.length; i++) {
  const url = await p.evaluate(([x0, y0, s]) => window.shot(x0, y0, s), list[i]);
  fs.writeFileSync(prefix + i + '.png', Buffer.from(url.split(',')[1], 'base64'));
}
if (errs.length) console.error(errs.join('\n'));
await b.close();
