// Menu pictures of the Bastion buildings and traps: each model rendered from the game's three-quarter view on a
// transparent background, written as PNG; tools/fort_icons.py then gives them the pixel-art ink outline.
// node tools/fort_icons.mjs OUT_DIR name=model.glb ...
import { createRequire } from 'module';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const here = path.dirname(new URL(import.meta.url).pathname);
const [, , outDir, ...pairs] = process.argv;
const jobs = pairs.map((p) => p.split('='));
mkdirSync(outDir, { recursive: true });
const exe = ['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', '/opt/pw-browsers/chromium'].find(existsSync);
const b = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 256, height: 256 } });
p.on('pageerror', (e) => console.error(e.message));
await p.route('http://icons.local/**', (r) => {
  const u = new URL(r.request().url());
  if (u.pathname.startsWith('/three/')) { const f = path.join(here, 'node_modules/three', u.pathname.slice(7)); return r.fulfill({ status: existsSync(f) ? 200 : 404, contentType: 'application/javascript', body: existsSync(f) ? readFileSync(f) : '' }); }
  if (u.pathname.startsWith('/m/')) return r.fulfill({ status: 200, contentType: 'model/gltf-binary', body: readFileSync(jobs[+u.pathname.slice(3)][1]) });
  r.fulfill({ status: 200, contentType: 'text/html', body: `<!doctype html><body style="margin:0"><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three'; import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(256, 256); r.setClearColor(0, 0); r.outputColorSpace = THREE.SRGBColorSpace; document.body.appendChild(r.domElement);
window.shot = async (i) => {
  const g = await new GLTFLoader().loadAsync('/m/' + i), sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xfff4e0, 0x8a7a68, 3.6)); const sun = new THREE.DirectionalLight(0xffffff, 3.2); sun.position.set(-2, 5, 3); sc.add(sun); sc.add(g.scene);
  const box = new THREE.Box3().setFromObject(g.scene), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3()), d = Math.max(size.x, size.y, size.z) * 2.05;
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100); cam.position.set(c.x - d * 0.55, c.y + d * 0.62, c.z + d * 0.62); cam.lookAt(c);
  r.render(sc, cam); return r.domElement.toDataURL('image/png');
};
window.READY = true;
</script>` });
});
await p.goto('http://icons.local/');
await p.waitForFunction(() => window.READY, null, { timeout: 60000 });
for (let i = 0; i < jobs.length; i++) {
  const url = await p.evaluate((i) => window.shot(i), i);
  writeFileSync(path.join(outDir, jobs[i][0] + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log(jobs[i][0]);
}
await b.close();
