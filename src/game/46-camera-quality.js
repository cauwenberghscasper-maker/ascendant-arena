// --- view sync: entities -> meshes ---------------------------------------------------------
const views = new Map();
// everything that changes how your hero looks; the view is rebuilt when this changes
function playerViewSig(cls) {
  const p = G.profile;
  return gearSignature(p.gear) + Object.values(p.gear).map(it=>it?it.id+':'+it.up:'-').join('|') + (capeColor(p) || '') + badgeCount(p, cls) + '|a' + (G.mode === 'arena' ? 0 : ascTier(p.level)) + (!!G.profile.settings.pvp ? '|pvp' : '');
}
function viewFor(e) {
  let v = views.get(e);
  if (v) return v;
  if (e.kind === 'fighter') {
    const c = CFG.classes[e.cls];
    const ring = G.mode === 'arena' ? (e.isPlayer ? 0x3fa9ff : 0xff4d4d) : (e.isPlayer ? (!!(G.profile && G.profile.settings.pvp) ? 0xff3344 : 0xffc94a) : e.isPeer ? (e.pvp ? 0xff3344 : 0x5dd6ff) : null);
    const gear = e.isPlayer ? G.profile.gear : null;
    const cape = e.isPlayer ? capeColor(G.profile) : null;
    const BR = CFG.brawlers[e.cls] || {};
    const asc = G.mode === 'arena' ? 0 : ascTier(e.isPlayer ? G.profile.level : (e.level || 1));
    v = AssetSlots.create('character', { cls: e.cls, body: c.body, accent: e.isPlayer ? (badgeTint(G.profile, e.cls) || c.accent) : c.accent, hair: BR.hair, look: BR.look, ring, gear, xray: e.isPlayer, cape, asc, peer: !!e.isPeer });
    v.cls = e.cls; v.sig = e.isPlayer ? playerViewSig(e.cls) : 'pv' + (e.pvp ? 1 : 0);
  } else if (e.kind === 'enemy') v = AssetSlots.create('enemy', { type: e.type, elite: e.elite });
  else if (e.kind === 'boss') v = AssetSlots.create('boss', { zone: e.zone });
  else if (e.kind === 'npc') v = AssetSlots.create('npc', { id: e.def.id });
  else if (e.kind === 'soldier') v = AssetSlots.create('character', { model: 'npc.garo' }); // Bastion Siege warriors
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
    if (old && e.kind === 'fighter' && (old.cls !== e.cls || (e.isPlayer ? old.sig !== playerViewSig(e.cls) : e.isPeer && old.sig !== 'pv' + (e.pvp ? 1 : 0)))) { dynGroup.remove(old.root); old.dispose(); views.delete(e); }
    if (Showcase.on && e !== G.player) { const v = views.get(e); if (v) v.root.visible = false; seen.add(e); return; }
    const d = Math.hypot(e.x - cx, e.z - cz);
    if (d > far && !(e.kind === 'boss')) { const v = views.get(e); if (v) v.root.visible = false; if (!(e.kind === 'enemy' && d > far * 2.4)) seen.add(e); return; }
    const v = viewFor(e); v.update(e, dt, t); seen.add(e);
    if (e.heroAirY) v.root.position.y += e.heroAirY; // carried into the air by a hero super
    if (e.lostT > 0) { v.root.visible = false; v.lostHid = true; } else if (v.lostHid) { v.root.visible = true; v.lostHid = false; }
    if (e.kind === 'fighter' && (e.alive || v.downed)) v.root.scale.setScalar(growthScale(e));
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
    if (G.siege) for (const s of G.siege.soldiers) handle(s);
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
// studio key (warm, front) and rim (cool, behind) so the hero reads like a lit character render
const studioKey = new THREE.DirectionalLight(0xffe2b8, 1.5), studioRim = new THREE.DirectionalLight(0x9fd0ff, 2.2); studioKey.visible = studioRim.visible = false; scene.add(studioKey, studioKey.target, studioRim, studioRim.target);
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
  Showcase.on = on; if (pl) pl.showcase = on; // the hero stands in its relaxed gear-tab pose
  studioFill.visible=on; studioKey.visible = studioRim.visible = on; Doll.alertAt=0;
  if (on) {
    Showcase.x = pl.x; Showcase.z = pl.z; Showcase.spin = 0; Showcase.podium = 0.3;
    Showcase.baseYaw = Math.atan2(1, 0.3) - 0.25; // three-quarter front view Showcase.yaw = pl.facing;
    studioGroup.position.set(pl.x, 0, pl.z); studioGroup.visible = true; hubGroup.visible = false; riftGroup.visible = false;
  } else {
    studioGroup.visible = false; hubGroup.visible = G.mode === 'hub' && !G.rift; riftGroup.visible = !!G.rift; Showcase.podium = 0;
  }
  document.getElementById('app').classList.toggle('showcase', on);
  resize(); // higher studio pixel resolution only while inspecting a character
}
// Dressing-room framing: the hero (feet to crown) fills ~95% of the free screen height above the portrait sheet
// (or left of the landscape side panel), right of the paper-doll column. Uses the cached sheet rect; while the
// sheet is pulled to full height the last framing is kept, since the hero is covered anyway.
Cam.frame = { dist: 8, yc: 1.2, span: 2.4, offX: 0, offY: 0 };
function showcaseFrame() {
  const F = Cam.frame, S = UI.sheet; if (UI.sheetFull || !S.bottom) return F;
  const w = window.innerWidth, h = window.innerHeight, gs = growthScale(G.player);
  // the paper-doll sockets take a column on each side in portrait and one on the left in landscape
  const chipR = 10 + DOLL_SLOT + 8;
  const top = 8, bot = Cam.portrait ? S.top - 28 : h - 30;
  const left = chipR, right = Cam.portrait ? w - chipR : S.left - 8;
  // world span from the podium floor to the hat tip (measured 1.65 x growth); ascended heroes add a crown
  const lo = Showcase.podium - 0.05, hi = Showcase.podium + 2.0 * gs * (ascTier(G.profile.level) >= 3 ? 1.3 : 1);
  const px = Math.max(120, (bot - top) * 0.88); // head room so tall heroes never get cut off
  F.span = hi - lo; F.yc = (hi + lo) / 2;
  F.dist = F.span * h / (2 * Math.tan(THREE.MathUtils.degToRad(40) / 2) * px);
  // the hero's weapon arm reaches further right than its left side, so aim a little left of centre
  F.offX = w / 2 - ((left + right) / 2 - w * 0.05); F.offY = h / 2 - (top + bot) / 2;
  return F;
}
function updateCamera(dt) {
  const pl = G.mode === 'arena' && G.arena ? G.arena.fighters[0] : G.player;
  Cam.yaw = 0;
  Showcase.b = clamp(Showcase.b + (Showcase.on ? dt / 0.45 : -dt / 0.45), 0, 1);
  const sb = Showcase.b * Showcase.b * (3 - 2 * Showcase.b);
  // angled top-down: camera south of the player, looking north
  let zoom = Math.min(CFG.growth.zoomCap, 1 + CFG.growth.zoomPerLevel * (G.profile.level - 1) * (G.mode === 'arena' ? 0.5 : 1)) * (LOCAL_PREVIEW && window.__camZoom || 1); // __camZoom: local tours only
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
    // side view: camera east of the hero, framed to fill the free area beside the sheet
    const F = showcaseFrame();
    const dx = 1, dz = 0.3, dl = Math.hypot(dx, dz);
    const sx = Showcase.x, sz = Showcase.z;
    _cp.lerp(_v3.set(sx + dx / dl * F.dist, F.yc + F.span * 0.03, sz + dz / dl * F.dist), sb); // near eye level, not looking down
    _cl.lerp(_s3.set(sx, F.yc, sz), sb);
  }
  if (!G.started) {
    Cam.titleT += dt * 0.08;
    const T = CFG.world.town;
    _cp.set(T.x + Math.sin(Cam.titleT) * 30, 16, T.z + Math.cos(Cam.titleT) * 30); _cl.set(T.x, 2, T.z);
  }
  const fovT = lerp(Cam.portrait ? 56 : 44, 40, sb);
  if (Math.abs(camera.fov - fovT) > 0.05) { camera.fov = fovT; camera.updateProjectionMatrix(); }
  // in the dressing room, shift the picture so the hero sits in the free area beside the menu
  if (sb > 0.001) {
    const w = window.innerWidth, h = window.innerHeight, F = Cam.frame;
    camera.setViewOffset(w, h, F.offX * sb, F.offY * sb, w, h);
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
  if(Showcase.on){studioFill.position.set(Showcase.x-4,4,Showcase.z+3);studioFill.target.position.set(Showcase.x,1.2,Showcase.z);studioFill.target.updateMatrixWorld();
    studioKey.position.set(Showcase.x+5,3.5,Showcase.z+2.5); studioKey.target.position.set(Showcase.x,1.1,Showcase.z); studioKey.target.updateMatrixWorld();
    studioRim.position.set(Showcase.x-3,3,Showcase.z-5); studioRim.target.position.set(Showcase.x,1.3,Showcase.z); studioRim.target.updateMatrixWorld();}
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
const Q = { dpr: 1, frames: 0, acc: 0, fps: 60, slowWindows: 0, cull: CFG.quality.cullFar, lowTier: false, noPost: false, lastChange: 0, locked: false, raf: 0, hz: 60 };
// phones and small devices start lighter: a lower pixel-ratio cap, a smaller shadow map, fewer parallel downloads,
// and on weak ones no cinematic post pass at all (the adaptive steps below can still go further)
const DEVICE = (() => { const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches, mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
  return { touch, weak: touch && (mem <= 4 || cores <= 4) }; })();
if (DEVICE.touch) { CFG.quality.maxDpr = DEVICE.weak ? 1.25 : 1.6; sun.shadow.mapSize.set(1024, 1024); AssetLibrary.maxActive = 2; }
if (DEVICE.weak) Q.noPost = true;
function setDpr(d) { Q.dpr = clamp(d, CFG.quality.minDpr, Math.min(window.devicePixelRatio || 1, CFG.quality.maxDpr)); renderer.setPixelRatio(Q.dpr); resize(); Q.lastChange = performance.now(); }
function qualityTick(dt) {
  Q.frames++; Q.acc += dt;
  if (Q.acc < CFG.quality.sampleSec) return;
  Q.fps = Q.frames / Q.acc; Q.hz = Q.raf / Q.acc; Q.frames = 0; Q.raf = 0; Q.acc = 0;
  if (Q.locked || document.hidden || G.modal) { Q.slowWindows = 0; return; }
  if (Q.fps < CFG.quality.downFps) Q.slowWindows++; else Q.slowWindows = 0;
  if (Q.slowWindows >= 3 && performance.now() - Q.lastChange > 10000) {
    Q.slowWindows = 0;
    // cheapest visual losses first: the bloom/grade pass, then the shadow map size, then resolution, then the low tier
    if (!Q.noPost && Post.on()) { Q.noPost = true; Q.lastChange = performance.now(); }
    else if (sun.shadow.mapSize.x > 1024) { sun.shadow.mapSize.set(1024, 1024); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } Q.lastChange = performance.now(); }
    else if (Q.dpr > CFG.quality.minDpr + 0.01) setDpr(Q.dpr - 0.25);
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
    const target = Showcase.on ? 1e9 : (Math.min(wd, hd) < 700 ? 300 : 380) * Math.min(1, Q.dpr); // the hero studio renders at full resolution (high-detail model); combat keeps the pixel look
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
    if (!this.active) { if (Post.on()) Post.render(); else renderer.render(scene, camera); return; }
    this.mat.uniforms.near.value = camera.near; this.mat.uniforms.far.value = camera.far;
    renderer.setRenderTarget(this.rt); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(this.scene, this.cam);
  },
};
// --- cinematic post (High graphics, smooth renderer only) ------------------------------------------------------
// The world renders into an HDR multisampled target; bright parts are blurred at quarter and eighth size for a soft
// bloom (crystals, lava, portals, torches, gold), then one pass tone-maps, grades (warm light, cool shade, a touch of
// contrast and saturation) and vignettes. Six small passes in all; off on the low tier and in the pixel-art look.
const Post = {
  ready: false, w: 0, h: 0,
  on() { return hqOn() && !Q.noPost && !(G.profile && G.profile.settings.fx === false) && renderer.capabilities.isWebGL2; },
  init() {
    if (this.ready) return; this.ready = true;
    const rt = (w, h, o) => new THREE.WebGLRenderTarget(w, h, Object.assign({ type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false }, o || {}));
    this.main = rt(2, 2, { depthBuffer: true, samples: DEVICE.touch ? 2 : 4 });
    this.a = [rt(2, 2), rt(2, 2)]; this.b = [rt(2, 2), rt(2, 2)];
    const vs = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    // one NaN or overflowed pixel (a bad normal, a shader edge case on some phone GPUs) would be blurred into a black
    // patch over the screen, so any such sample is read as black before it reaches the blur or the final picture
    const ok = 'vec3 okc(vec3 c) { uvec3 e = floatBitsToUint(c) & 0x7f800000u; return any(equal(e, uvec3(0x7f800000u))) ? vec3(0.0) : c; }\n';
    const quad = (fs, u) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: vs, fragmentShader: ok + fs, depthTest: false, depthWrite: false });
    this.bright = quad(`uniform sampler2D t; uniform float thr; uniform vec2 tx; varying vec2 vUv;
      void main() { vec3 c = (okc(texture2D(t, vUv + tx * vec2(-1.,-1.)).rgb) + okc(texture2D(t, vUv + tx * vec2(1.,-1.)).rgb) + okc(texture2D(t, vUv + tx * vec2(-1.,1.)).rgb) + okc(texture2D(t, vUv + tx * vec2(1.,1.)).rgb)) * .25;
        float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(thr, thr + 0.6, l), 1.0); }`, { t: { value: null }, thr: { value: 0.78 }, tx: { value: new THREE.Vector2() } });
    this.blur = quad(`uniform sampler2D t; uniform vec2 dir; varying vec2 vUv;
      void main() { vec3 c = texture2D(t, vUv).rgb * .227027;
        c += (texture2D(t, vUv + dir * 1.3846).rgb + texture2D(t, vUv - dir * 1.3846).rgb) * .316216;
        c += (texture2D(t, vUv + dir * 3.2308).rgb + texture2D(t, vUv - dir * 3.2308).rgb) * .070270;
        gl_FragColor = vec4(c, 1.0); }`, { t: { value: null }, dir: { value: new THREE.Vector2() } });
    this.final = quad(`uniform sampler2D t; uniform sampler2D b1; uniform sampler2D b2; uniform float bloom; uniform float dark; varying vec2 vUv;
      void main() {
        vec3 c = okc(texture2D(t, vUv).rgb) + okc(texture2D(b1, vUv).rgb * .65 + texture2D(b2, vUv).rgb * .55) * bloom;
        float l = dot(c, vec3(.2126, .7152, .0722));
        c = mix(c * vec3(.94, .98, 1.06), c * vec3(1.05, 1.0, .93), smoothstep(.05, .7, l)); // cool shade, warm light
        c = mix(vec3(l), c, 1.08);                                                           // a touch more colour
        c = pow(max(c, 0.0), vec3(1.04));                                                    // a little contrast
        vec2 v = vUv - .5; c *= 1. - dot(v, v) * dark;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`, { t: { value: this.main.texture }, b1: { value: this.a[0].texture }, b2: { value: this.b[0].texture }, bloom: { value: 0.9 }, dark: { value: 0.55 } });
    this.final.toneMapped = true;
    this.scene = new THREE.Scene(); this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.final); this.quad.frustumCulled = false; this.scene.add(this.quad);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  },
  size() {
    const v = renderer.getDrawingBufferSize(_post2), w = Math.max(2, v.x | 0), h = Math.max(2, v.y | 0);
    if (w === this.w && h === this.h) return; this.w = w; this.h = h;
    this.main.setSize(w, h);
    const w4 = Math.max(2, w >> 2), h4 = Math.max(2, h >> 2), w8 = Math.max(2, w >> 3), h8 = Math.max(2, h >> 3);
    this.a.forEach((r) => r.setSize(w4, h4)); this.b.forEach((r) => r.setSize(w8, h8));
  },
  pass(mat, target) { this.quad.material = mat; renderer.setRenderTarget(target); renderer.render(this.scene, this.cam); },
  render() {
    this.init(); this.size();
    renderer.setRenderTarget(this.main); renderer.render(scene, camera);
    // in dungeons and at night the glow carries more of the mood
    this.final.uniforms.bloom.value = dungeonGroup.visible ? 1.15 : 0.85;
    this.bright.uniforms.t.value = this.main.texture; this.bright.uniforms.tx.value.set(1 / this.w, 1 / this.h); this.pass(this.bright, this.a[0]);
    const blur = (src, dst, x, y) => { this.blur.uniforms.t.value = src.texture; this.blur.uniforms.dir.value.set(x, y); this.pass(this.blur, dst); };
    blur(this.a[0], this.a[1], 1 / this.a[0].width, 0); blur(this.a[1], this.a[0], 0, 1 / this.a[0].height);
    blur(this.a[0], this.b[1], 2 / this.a[0].width, 0); blur(this.b[1], this.b[0], 0, 1 / this.b[0].height);
    this.pass(this.final, null);
  },
};
const _post2 = new THREE.Vector2();


