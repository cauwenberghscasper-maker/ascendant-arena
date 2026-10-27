// Inventory icons of the craft materials, rendered from their own 3D models (assets/world/mat_<id>) at the game's
// three-quarter view on a transparent background. tools/mat_icons.py then pixelizes them to 64 px with an ink outline.
// Needs the repo served on http://localhost:PORT (python3 -m http.server PORT).
// node tools/mat_icons.mjs PORT OUT_DIR [id ...]   (default: every assets/world/mat_* model)
import { createRequire } from 'module';
import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs';
const require = createRequire(import.meta.url);
const pw = ['/home/claude/node_modules/playwright', 'playwright', 'playwright-core'].map((m) => { try { return require(m); } catch { return null; } }).find(Boolean);
const [, , port = '8791', outDir = 'tools/.gen/mat-icons', ...only] = process.argv;
const ids = only.length ? only : readdirSync('assets/world').filter((d) => d.startsWith('mat_')).map((d) => d.slice(4));
mkdirSync(outDir, { recursive: true });
const exe = ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(existsSync);
const b = await pw.chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 320, height: 320 } });
p.on('pageerror', (e) => console.error(e.message));
const base = `http://localhost:${port}/`;
await p.route(base + '__mat_icons.html', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: `<!doctype html><body style="margin:0">
<script type="importmap">{"imports":{"three":"./vendor/three/build/three.module.js","three/addons/":"./vendor/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three'; import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(320, 320); r.setClearColor(0, 0);
r.outputColorSpace = THREE.SRGBColorSpace; document.body.appendChild(r.domElement);
window.shot = async (id, yaw, low) => {
  const j = await (await fetch('assets/world/mat_' + id + '/model.json')).json();
  const bin = Uint8Array.from(atob(j.glb), (c) => c.charCodeAt(0)).buffer;
  const g = await new GLTFLoader().parseAsync(bin, 'assets/world/mat_' + id + '/'), sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xfff1dc, 0x5a4a66, 2.6));
  const key = new THREE.DirectionalLight(0xfff0d8, 3.4); key.position.set(-3, 5, 4); sc.add(key);       // warm key from the top left
  const rim = new THREE.DirectionalLight(0xbcd4ff, 2.2); rim.position.set(4, 2, -4); sc.add(rim);        // cool rim so the silhouette reads
  g.scene.rotation.y = yaw; sc.add(g.scene);
  const box = new THREE.Box3().setFromObject(g.scene), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3()), d = Math.max(size.x, size.y, size.z) * 2.2;
  const cam = new THREE.PerspectiveCamera(28, 1, 0.01, 100); cam.position.set(c.x - d * 0.45, c.y + d * (low ? 0.12 : 0.55), c.z + d * (low ? 0.85 : 0.7)); cam.lookAt(c);
  r.render(sc, cam); return r.domElement.toDataURL('image/png');
};
window.ready = true;
</script>` }));
await p.goto(base + '__mat_icons.html');
await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
for (const id of ids) {
  for (let k = 0; k < 8; k++) { // four turns from above and four from the side; tools/mat_icons.py keeps the fullest silhouette
    const url = await p.evaluate(([i, y, l]) => window.shot(i, y, l), [id, (k % 4) * Math.PI / 2, k >= 4]);
    writeFileSync(`${outDir}/${id}@${k}.png`, Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(id);
}
await b.close();
