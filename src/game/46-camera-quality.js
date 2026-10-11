// --- view sync: entities -> meshes ---------------------------------------------------------
const views = new Map();
// everything that changes how your hero looks; the view is rebuilt when this changes
function playerViewSig(cls) {
  const p = G.profile;
  return gearSignature(p.gear) + Object.values(p.gear).map(it=>it?it.id+':'+it.up:'-').join('|') + (capeColor(p) || '') + badgeCount(p, cls) + '|a' + (G.mode === 'arena' ? 0 : ascTier(p.level));
}
function viewFor(e) {
  let v = views.get(e);
  if (v) return v;
  if (e.kind === 'fighter') {
    const c = CFG.classes[e.cls];
    const ring = G.mode === 'arena' ? (e.isPlayer ? 0x3fa9ff : 0xff4d4d) : (e.isPlayer ? 0xffc94a : e.isPeer ? 0x5dd6ff : null);
    const gear = e.isPlayer ? G.profile.gear : null;
    const cape = e.isPlayer ? capeColor(G.profile) : null;
    const BR = CFG.brawlers[e.cls] || {};
    const asc = G.mode === 'arena' ? 0 : ascTier(e.isPlayer ? G.profile.level : (e.level || 1));
    v = AssetSlots.create('character', { cls: e.cls, body: c.body, accent: e.isPlayer ? (badgeTint(G.profile, e.cls) || c.accent) : c.accent, hair: BR.hair, look: BR.look, ring, gear, xray: e.isPlayer, cape, asc, peer: !!e.isPeer });
    v.cls = e.cls; v.sig = e.isPlayer ? playerViewSig(e.cls) : '';
  } else if (e.kind === 'enemy') v = AssetSlots.create('enemy', { type: e.type, elite: e.elite });
  else if (e.kind === 'boss') v = AssetSlots.create('boss', { zone: e.zone });
  else if (e.kind === 'npc') v = AssetSlots.create('npc', { body: e.def.body, accent: e.def.accent });
  dynGroup.add(v.root); views.set(e, v);
  return v;
}
// a 99 in any mastery earns a cape (weapon = gold-red, slayer = dark red, smithing = steel, scavenging = green)
function capeColor(p) {
  let best = null, bx = -1;
  for (const k in p.mastery) { const x = p.mastery[k]; if (masteryLevel(x) >= 99 && x > bx) { bx = x; best = k; } }
  if (!best) return null;
  return best.startsWith('w:') ? 0xd94a3b : best.startsWith('s:') ? 0x6b1f2a : best === 'smith' ? 0x5c6b7a : 0x3f9b5a;
}
// Gold badge and up tints the brawler's accent with the badge metal
function badgeTint(p, id) { const n = badgeCount(p, id); return n >= 3 ? CFG.badges[n - 1].color : null; }
const seen = new Set();
function syncViews(dt, t) {
  seen.clear();
  const far = Q.cull;
  const cx = camera.position.x, cz = camera.position.z;
  const handle = (e) => {
    // rebuild a fighter view if its class changed
    const old = views.get(e);
    if (old && e.kind === 'fighter' && (old.cls !== e.cls || (e.isPlayer && old.sig !== playerViewSig(e.cls)))) { dynGroup.remove(old.root); old.dispose(); views.delete(e); }
    if (Showcase.on && e !== G.player) { const v = views.get(e); if (v) v.root.visible = false; seen.add(e); return; }
    const d = Math.hypot(e.x - cx, e.z - cz);
    if (d > far && !(e.kind === 'boss')) { const v = views.get(e); if (v) v.root.visible = false; if (!(e.kind === 'enemy' && d > far * 2.4)) seen.add(e); return; }
    const v = viewFor(e); v.update(e, dt, t); seen.add(e);
    if (e.kind === 'fighter' && e.alive) v.root.scale.setScalar(growthScale(e));
    if (Showcase.on && e === G.player) {
      Showcase.yaw += angDiff(Showcase.yaw, Showcase.baseYaw + Showcase.spin) * (1 - Math.exp(-dt * 10));
      v.root.rotation.y = Showcase.yaw; v.root.position.y = Showcase.podium;
      if (v.ring) v.ring.visible = false;
    } else if (v.ring) v.ring.visible = true;
  };
  if (G.mode === 'arena' && G.arena) { for (const f of G.arena.fighters) handle(f); }
  else {
    for (const f of G.hubFighters) handle(f);
    for (const e of G.enemies) handle(e);
    for (const e of mpVisible()) handle(e);
    for (const n of shownNpcs()) handle(n);
    if (G.boss) handle(G.boss);
  }
  for (const [e, v] of views) if (!seen.has(e)) { dynGroup.remove(v.root); v.dispose(); views.delete(e); }
}

// heroes grow a little with every level (agar.io style); arena keeps sizes close for fair hitboxes
function growthScale(e) {
  const Gr = CFG.growth;
  if (G.mode === 'arena') return e.isPlayer ? Math.min(Gr.arenaScaleCap, 1 + Gr.scalePerLevel * (G.profile.level - 1)) : 1;
  const L = e.isPlayer ? G.profile.level : (e.level || 1);
  return Math.min(Gr.scaleCap, 1.12 + Gr.scalePerLevel * (L - 1));
}
// --- camera: angled top-down while playing, side view in the dressing room ---------------------
const Cam = { yaw: 0, pos: new THREE.Vector3(0, 10, -70), look: new THREE.Vector3(), shake: 0, portrait: false, titleT: 0 };
const Showcase = { on: false, b: 0, spin: 0, yaw: 0, baseYaw: 0, podium: 0, x: 0, z: 0 };
const _cp = new THREE.Vector3(), _cl = new THREE.Vector3();
// the studio: a backdrop, floor and podium shown only in the dressing room
const studioGroup = new THREE.Group(); studioGroup.visible = false; scene.add(studioGroup);
const studioFill = new THREE.DirectionalLight(0xafd6ed,1.1); studioFill.visible=false; scene.add(studioFill,studioFill.target);
(function buildStudio() {
  const g = new THREE.CylinderGeometry(14, 14, 16, 40, 6, true);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  const top = new THREE.Color(0x101a2d), bot = new THREE.Color(0x30364b);
  for (let i = 0; i < pos.count; i++) { const k = clamp((pos.getY(i) + 8) / 16, 0, 1); _col.copy(bot).lerp(top, Math.pow(k, 0.7)); col[i * 3] = _col.r; col[i * 3 + 1] = _col.g; col[i * 3 + 2] = _col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const wall = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
  wall.position.y = 6; studioGroup.add(wall);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x182232, fog: false }));
  floor.position.y = -0.02; studioGroup.add(floor);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(3.2, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0.12, fog: false, depthWrite: false }));
  glow.position.y = 0.01; studioGroup.add(glow);
  const pod = mergeParts([part(GEO.cyl8, 0x25344b, [0, 0.12, 0], null, [1.25, 0.3, 1.25]), part(GEO.cyl8, 0xc69e5a, [0, 0.28, 0], null, [1.3, 0.04, 1.3]),part(GEO.cyl8,0x37485f,[0,.31,0],null,[1.19,.035,1.19])]);
  studioGroup.add(new THREE.Mesh(pod, matVC));
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1.7 + i * 0.5, 0.025, 4, 48), new THREE.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0.35 - i * 0.1, fog: false }));
    r.rotation.x = Math.PI / 2; r.position.y = 0.05; studioGroup.add(r);
  }
})();
function setShowcase(on) {
  if (on === Showcase.on) return;
  const pl = G.player;
  Showcase.on = on;
  studioFill.visible=on; Doll.alertAt=0;
  if (on) {
    Showcase.x = pl.x; Showcase.z = pl.z; Showcase.spin = 0; Showcase.podium = 0.3;
    Showcase.baseYaw = Math.atan2(1, 0.3) - 0.6; Showcase.yaw = pl.facing;
    studioGroup.position.set(pl.x, 0, pl.z); studioGroup.visible = true; hubGroup.visible = false; riftGroup.visible = false;
  } else {
    studioGroup.visible = false; hubGroup.visible = G.mode === 'hub' && !G.rift; riftGroup.visible = !!G.rift; Showcase.podium = 0;
  }
  document.getElementById('app').classList.toggle('showcase', on);
  resize(); // higher studio pixel resolution only while inspecting a character
}
function updateCamera(dt) {
  const pl = G.mode === 'arena' && G.arena ? G.arena.fighters[0] : G.player;
  Cam.yaw = 0;
  Showcase.b = clamp(Showcase.b + (Showcase.on ? dt / 0.45 : -dt / 0.45), 0, 1);
  const sb = Showcase.b * Showcase.b * (3 - 2 * Showcase.b);
  // angled top-down: camera south of the player, looking north
  let zoom = Math.min(CFG.growth.zoomCap, 1 + CFG.growth.zoomPerLevel * (G.profile.level - 1) * (G.mode === 'arena' ? 0.5 : 1));
  // frame the world boss with the hero when you fight it, so it is never hidden under the top bar
  let fx = pl.x, fz = pl.z + 1.5;
  const bb = G.mode === 'hub' ? G.boss : null;
  if (bb && pl.alive) { const d = Math.hypot(bb.x - pl.x, bb.z - pl.z); if (d < 28) { const k = clamp(1 - (d - 14) / 14, 0, 1); fx = lerp(fx, lerp(pl.x, bb.x, 0.6), k); fz = lerp(fz, lerp(pl.z, bb.z, 0.62) - 3.5, k); zoom *= 1 + 0.3 * k; } }
  Cam.zoom = lerp(Cam.zoom || zoom, zoom, 1 - Math.exp(-dt * 1.5));
  Cam.fx = lerp(Cam.fx == null ? fx : Cam.fx, fx, 1 - Math.exp(-dt * 4)); Cam.fz = lerp(Cam.fz == null ? fz : Cam.fz, fz, 1 - Math.exp(-dt * 4));
  // ~50 degree view (was ~62): shows the heroes' faces and bodies, and a bit more of the world around them
  const th = (Cam.portrait ? 21.5 : 16) * Cam.zoom, tb = (Cam.portrait ? 16.5 : 12.5) * Cam.zoom;
  _cp.set(Cam.fx, th, Cam.fz - 1.5 - tb);
  _cl.set(Cam.fx, 0, Cam.fz);
  if (sb > 0) {
    // side view: camera east of the hero at chest height
    const gs = growthScale(G.player);
    const dist = (Cam.portrait ? 8.4 : 5.4) * gs * (ascTier(G.profile.level) >= 3 ? 1.18 : 1);
    const dx = 1, dz = 0.3, dl = Math.hypot(dx, dz);
    const sx = Showcase.x, sz = Showcase.z;
    _cp.lerp(_v3.set(sx + dx / dl * dist, 1.55 * gs, sz + dz / dl * dist), sb);
    _cl.lerp(_s3.set(sx, 1.15 * gs, sz), sb);
  }
  if (!G.started) {
    Cam.titleT += dt * 0.08;
    const T = CFG.world.town;
    _cp.set(T.x + Math.sin(Cam.titleT) * 30, 16, T.z + Math.cos(Cam.titleT) * 30); _cl.set(T.x, 2, T.z);
  }
  const fovT = lerp(Cam.portrait ? 56 : 44, 40, sb);
  if (Math.abs(camera.fov - fovT) > 0.05) { camera.fov = fovT; camera.updateProjectionMatrix(); }
  // in the dressing room, shift the picture so the hero sits beside the menu
  if (sb > 0.001) {
    const w = window.innerWidth, h = window.innerHeight;
    camera.setViewOffset(w, h, Cam.portrait ? -w * .17 * sb : w * 0.22 * sb, Cam.portrait ? h * 0.27 * sb : 0, w, h);
  } else if (camera.view && camera.view.enabled) camera.clearViewOffset();
  const k = 1 - Math.exp(-dt * (G.started ? (Showcase.on || sb > 0 ? 7 : 9) : 3));
  Cam.pos.lerp(_cp, k); Cam.look.lerp(_cl, k);
  camera.position.copy(Cam.pos);
  if (Cam.shake > 0 && !Showcase.on && !G.profile.settings.calm) { Cam.shake = Math.max(0, Cam.shake - dt * 2.5); const s = Cam.shake * Cam.shake * 0.6; camera.position.x += (Math.random() - 0.5) * s; camera.position.y += (Math.random() - 0.5) * s; camera.position.z += (Math.random() - 0.5) * s; }
  camera.lookAt(Cam.look);
  scene.userData.sky.position.copy(camera.position);
  // sun + shadow box follow the hero; High graphics toggles shadows, outlines and glow
  sun.position.copy(Cam.look).add(SUN_OFF); sun.target.position.copy(Cam.look); sun.target.updateMatrixWorld();
  sun.intensity=Showcase.on?2.0:2.7;
  if(Showcase.on){studioFill.position.set(Showcase.x-4,4,Showcase.z+3);studioFill.target.position.set(Showcase.x,1.2,Showcase.z);studioFill.target.updateMatrixWorld();}
  const hq = hqOn();
  if (hq !== Cam.hq) { Cam.hq = hq; sun.castShadow = hq; matOutline.visible = matOutlineElite.visible = matOutlineBoss.visible = hq; }
  updateZoneMood(dt);
}

// One local companion mesh; combat logic above remains independent of rendering.
const Companion = { signature:'', view:null, model:null, x:null, z:null, requested:false };
function updateCompanion(dt,t) {
  const p=G.profile, progress=petProgress(p);
  const signature=(progress.id||'')+':'+progress.stage;
  if(signature !== Companion.signature) {
    if(Companion.view){scene.remove(Companion.view.root);AssetLibrary.disposeInstance(Companion.model);Companion.view.dispose();}
    Object.assign(Companion,{signature,view:null,model:null,x:null,z:null,requested:false});
    if(progress.id){Companion.view=createCompanion({THREE,GEO,part,mergeParts},progress.id,progress.stage);scene.add(Companion.view.root);}
  }
  const v=Companion.view;if(!v)return;
  // Generated GLB replaces the prototype only when present and successfully loaded.
  const asset='pet.'+progress.id;
  if(!Companion.requested && AssetLibrary.has(asset)){AssetLibrary.request(asset);Companion.requested=true;}
  if(Companion.requested && !Companion.model && AssetLibrary.status(asset)==='ready'){
    const model=AssetLibrary.instance(asset);
    for(const child of v.root.children)child.visible=false;
    v.root.add(model);Companion.model=model;
    model.traverse(o=>{if(o.isMesh)o.castShadow=false;});
  }
  const show=G.started && G.mode==='hub' && G.player.alive;
  v.root.visible=show;if(!show){Companion.x=Companion.z=null;return;}
  const pl=G.player, f=pl.facing, gs=Showcase.on?growthScale(pl):1;
  const origin=petOrigin();
  const tx=Showcase.on?pl.x+.95*gs:origin.x;
  const tz=Showcase.on?pl.z+.55*gs:origin.z;
  const snap=Companion.x===null || Math.hypot(tx-Companion.x,tz-Companion.z)>10 || Showcase.on;
  const k=1-Math.exp(-dt*5);
  Companion.x=snap?tx:lerp(Companion.x,tx,k);Companion.z=snap?tz:lerp(Companion.z,tz,k);
  const calm=p.settings.calm;
  v.root.position.set(Companion.x,(Showcase.on?Showcase.podium:.22)+(calm?0:Math.sin(t*2.2)*.045+Math.sin(PetCombat.pose/.24*Math.PI)*.08),Companion.z);
  const yaw=Showcase.on?Showcase.yaw:PetCombat.pose>0?PetCombat.facing:f;
  v.root.rotation.y+=angDiff(v.root.rotation.y,yaw)*(1-Math.exp(-dt*7));
  v.root.scale.setScalar(progress.size*(Showcase.on?1: .85));v.animate(t,calm);
}

// --- adaptive quality ----------------------------------------------------------------------------
// Render scale: pick once, then only ever step DOWN after sustained slowness.
// Every scale change reallocates the canvas, which shows as a flash on phones, so changes are rare.
const Q = { dpr: 1, frames: 0, acc: 0, fps: 60, slowWindows: 0, cull: CFG.quality.cullFar, lowTier: false, lastChange: 0, locked: false };
function setDpr(d) { Q.dpr = clamp(d, CFG.quality.minDpr, Math.min(window.devicePixelRatio || 1, CFG.quality.maxDpr)); renderer.setPixelRatio(Q.dpr); resize(); Q.lastChange = performance.now(); }
function qualityTick(dt) {
  Q.frames++; Q.acc += dt;
  if (Q.acc < CFG.quality.sampleSec) return;
  Q.fps = Q.frames / Q.acc; Q.frames = 0; Q.acc = 0;
  if (Q.locked || document.hidden || G.modal) { Q.slowWindows = 0; return; }
  if (Q.fps < CFG.quality.downFps) Q.slowWindows++; else Q.slowWindows = 0;
  if (Q.slowWindows >= 3 && performance.now() - Q.lastChange > 10000) {
    Q.slowWindows = 0;
    if (Q.dpr > CFG.quality.minDpr + 0.01) setDpr(Q.dpr - 0.25);
    else if (!Q.lowTier) { Q.lowTier = true; Q.cull = CFG.quality.cullNear; scene.fog.far = 95; }
  }
}
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  if (Pixel.enabled()) Pixel.resize(w, h);
  else { Pixel.off(); renderer.setPixelRatio(Q.dpr); renderer.setSize(w, h, false); }
  camera.aspect = w / h; Cam.portrait = w / h < 1;
  camera.fov = Cam.portrait ? 56 : 44; camera.updateProjectionMatrix();
}
// --- pixel-art presentation ------------------------------------------------------------------
// The world renders at a low resolution (about 220 art pixels on the short side) into an HDR target,
// then one post pass grades it (cool shadows, warm light, muted greens), adds a 1-pixel ink outline
// from the depth buffer, quantizes the colours and draws it to a small canvas that the browser
// scales up by a whole number of device pixels with hard edges. Cheaper than full-res rendering too.
const Pixel = {
  rt: null, mat: null, scene: null, cam: null, w: 2, h: 2, scale: 1, active: false,
  enabled() { return !(G.profile && G.profile.settings.pixel === false); },
  init() {
    if (this.mat) return;
    this.rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
    this.rt.depthTexture = new THREE.DepthTexture(2, 2); this.rt.depthTexture.type = THREE.UnsignedIntType;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { tColor: { value: this.rt.texture }, tDepth: { value: this.rt.depthTexture }, texel: { value: new THREE.Vector2() },
        near: { value: camera.near }, far: { value: camera.far }, levels: { value: 48 }, ink: { value: new THREE.Color(0x15122a) } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `
        uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 texel; uniform float near; uniform float far; uniform float levels; uniform vec3 ink;
        varying vec2 vUv;
        float lin(vec2 uv) { float z = texture2D(tDepth, uv).x * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }
        float bayer(vec2 p) { vec2 q = mod(floor(p), 4.0); int i = int(q.x + q.y * 4.0);
          float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
          for (int k = 0; k < 16; k++) if (k == i) return m[k] / 16.0 - 0.47; return 0.0; }
        void main() {
          vec4 c = texture2D(tColor, vUv);
          // ink outline: this pixel sits clearly behind a neighbour, so it is the silhouette edge of something in front
          float d = lin(vUv);
          float dn = min(min(lin(vUv + vec2(texel.x, 0.0)), lin(vUv - vec2(texel.x, 0.0))), min(lin(vUv + vec2(0.0, texel.y)), lin(vUv - vec2(0.0, texel.y))));
          float edge = smoothstep(0.06, 0.12, (d - dn) / max(dn, 0.001)) * step(dn, far * 0.9);
          vec3 col = c.rgb;
          // grade in linear light: a little less saturation, cool deep shadows, warm highlights
          float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
          col = mix(vec3(l), col, 0.82);
          col = mix(col * vec3(0.78, 0.86, 1.08) + vec3(0.004, 0.006, 0.016), col, smoothstep(0.02, 0.45, l));
          col *= mix(vec3(1.0), vec3(1.07, 1.0, 0.88), smoothstep(0.35, 1.2, l));
          col = mix(col, ink * 0.35, edge * 0.85);
          // soft vignette
          vec2 v = vUv - 0.5; col *= 1.0 - dot(v, v) * 0.45;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          // posterize with a 4x4 ordered dither so gradients become clean pixel-art bands
          gl_FragColor.rgb = floor(gl_FragColor.rgb * levels + 0.5 + bayer(gl_FragCoord.xy) * 0.35) / levels;
        }`,
      depthTest: false, depthWrite: false, toneMapped: true,
    });
    this.scene = new THREE.Scene();
    const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat); q.frustumCulled = false; this.scene.add(q);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  },
  resize(w, h) {
    this.init();
    const dpr = window.devicePixelRatio || 1, wd = Math.round(w * dpr), hd = Math.round(h * dpr);
    // whole-number scale in device pixels so every art pixel is the same size
    const target = (Showcase.on ? 540 : Math.min(wd, hd) < 700 ? 300 : 380) * Math.min(1, Q.dpr); // studio detail never raises combat resolution
    this.scale = Math.max(1, Math.round(Math.min(wd, hd) / target));
    this.w = Math.ceil(wd / this.scale); this.h = Math.ceil(hd / this.scale);
    renderer.setPixelRatio(1); renderer.setSize(this.w, this.h, false);
    const el = renderer.domElement; el.style.width = (this.w * this.scale / dpr) + 'px'; el.style.height = (this.h * this.scale / dpr) + 'px'; el.style.imageRendering = 'pixelated';
    this.rt.setSize(this.w, this.h); this.mat.uniforms.texel.value.set(1 / this.w, 1 / this.h);
    this.active = true;
  },
  off() {
    if (!this.active) return; this.active = false;
    const el = renderer.domElement; el.style.width = el.style.height = el.style.imageRendering = '';
  },
  render() {
    renderer.info.autoReset = false; renderer.info.reset(); // count both world and pixel post passes
    if (!this.active) { renderer.render(scene, camera); return; }
    this.mat.uniforms.near.value = camera.near; this.mat.uniforms.far.value = camera.far;
    renderer.setRenderTarget(this.rt); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(this.scene, this.cam);
  },
};


