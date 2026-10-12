// Motion review for a rigged v4/v6 hero: renders key poses from the shared adventurer clips and reports
// the worst triangle-edge stretch per pose (torn or fused limbs show up as large stretch values).
// node tools/v6_posecheck.mjs RIGGED.glb OUT.png [OUT.json]
import { createRequire } from 'module';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const [, , model, outPng, outJson] = process.argv;
const here = path.dirname(new URL(import.meta.url).pathname);
const clips = readFileSync(path.join(here, '../assets/animation/adventurer-clips.json'));
const exe = ['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', '/opt/pw-browsers/chromium'].find(existsSync);
const b = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const POSES = [['Idle', 0.3], ['Running_A', 0.15], ['Running_A', 0.55], ['1H_Melee_Attack_Slice_Horizontal', 0.45], ['2H_Melee_Attack_Chop', 0.9], ['Spellcast_Shoot', 0.45], ['Dodge_Forward', 0.2], ['Hit_A', 0.25], ['Death_A', 0.79]];
const W = 300, H = 380;
const p = await b.newPage({ viewport: { width: W * POSES.length, height: H * 2 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.route('https://cdn.jsdelivr.net/npm/three@0.186.1/**', (r) => {
  const f = path.join(here, 'node_modules/three', r.request().url().split('three@0.186.1/')[1]);
  r.fulfill({ status: existsSync(f) ? 200 : 404, contentType: 'application/javascript', body: existsSync(f) ? readFileSync(f) : '' });
});
await p.route('http://pc.local/**', (r) => {
  const u = new URL(r.request().url());
  if (u.pathname === '/model.glb') return r.fulfill({ status: 200, contentType: 'model/gltf-binary', body: readFileSync(model) });
  if (u.pathname === '/hero-arms.js') return r.fulfill({ status: 200, contentType: 'application/javascript', body: readFileSync(path.join(here, '../assets/data/hero-arms.js')) });
  if (u.pathname === '/clips.json') return r.fulfill({ status: 200, contentType: 'application/json', body: clips });
  r.fulfill({ status: 200, contentType: 'text/html', body: PAGE });
});
const PAGE = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#bbb">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three'; import {relaxArms, measureArmHang} from '/hero-arms.js'; import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const POSES=${JSON.stringify(POSES)}, W=${W}, H=${H};
const r=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); r.setSize(W*POSES.length,H*2); r.outputColorSpace=THREE.SRGBColorSpace; r.setScissorTest(true); document.body.appendChild(r.domElement);
const g=await new GLTFLoader().loadAsync('/model.glb'); const raw=await (await fetch('/clips.json')).json();
const sc=new THREE.Scene(); sc.background=new THREE.Color(0xc8c8c8); sc.add(new THREE.HemisphereLight(0xffffff,0x666655,1.7)); const sun=new THREE.DirectionalLight(0xffffff,1.5); sun.position.set(1,3,4); sc.add(sun);
const model=g.scene; sc.add(model); model.updateMatrixWorld(true);
const root=model.getObjectByName('heroRoot'); const rest=root?root.position.clone():new THREE.Vector3(0,.5,0), hipH=rest.y||.5;
let clips=raw.clips.map(c=>new THREE.AnimationClip(c.name,c.duration,c.tracks.map(t=>t.type==='vector'?new THREE.VectorKeyframeTrack(t.name,t.times,t.values.map((v,i)=>(i%3===0?rest.x:i%3===1?rest.y:rest.z)+v*hipH)):new THREE.QuaternionKeyframeTrack(t.name,t.times,t.values))));
const RELAX=${process.env.RELAX !== '0'}; window.HANG=measureArmHang(THREE,model); if(RELAX) clips=relaxArms(THREE,clips,model);
const mixer=new THREE.AnimationMixer(model); let mesh=null; model.traverse(o=>{if(o.isSkinnedMesh&&!mesh)mesh=o;});
const geo=mesh.geometry, P=geo.attributes.position, idx=geo.index.array, rp=[]; for(let i=0;i<P.count;i++)rp.push(new THREE.Vector3().fromBufferAttribute(P,i));
const cams=[[0,0.55,2.6],[1.9,0.75,1.9]], report=[];
POSES.forEach(([name,t],col)=>{
  mixer.stopAllAction(); const c=clips.find(x=>x.name===name); const a=mixer.clipAction(c); a.reset().play(); mixer.setTime(Math.min(t,c.duration-1e-3)); model.updateMatrixWorld(true);
  const v=rp.map((q,i)=>{const w=q.clone(); mesh.applyBoneTransform(i,w); return w;});
  let worst=0, bad=0, n=0; for(let k=0;k<idx.length;k+=3)for(const [x,y] of [[0,1],[1,2],[2,0]]){const u=idx[k+x],w=idx[k+y],d0=rp[u].distanceTo(rp[w]); if(d0<.006)continue; const s=v[u].distanceTo(v[w])/d0; n++; if(s>worst)worst=s; if(s>2.2)bad++;}
  report.push({pose:name,t,maxStretch:+worst.toFixed(2),badEdgePct:+(100*bad/n).toFixed(3)});
  cams.forEach((cp,row)=>{const cam=new THREE.PerspectiveCamera(30,W/H,.05,20); cam.position.set(...cp); cam.lookAt(0,.5,0); r.setViewport(col*W,(1-row)*H,W,H); r.setScissor(col*W,(1-row)*H,W,H); r.render(sc,cam);});
});
window.REPORT=report; window.DONE=true;
</script>`;
await p.goto('http://pc.local/');
await p.waitForFunction(() => window.DONE || false, null, { timeout: 120000 }).catch(() => {});
if (errs.length) console.error(errs.join('\n'));
await p.screenshot({ path: outPng });
const report = await p.evaluate(() => window.REPORT); const hang = await p.evaluate(() => window.HANG); if (hang) console.error('hang deg', Math.round(hang.l * 57.3), Math.round(hang.r * 57.3));
if (outJson) writeFileSync(outJson, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report));
await b.close();
