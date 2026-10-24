// ---------------------------------------------------------------------
// 8. INPUT — touch twin-stick + buttons (keyboard/mouse for desktop testing)
// ---------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const Input = {
  move: { id: null, ox: 0, oy: 0, sx: 0, sy: 0, active: false },
  atk: { id: null, ox: 0, oy: 0, dx: 0, dy: 0, active: false, aiming: false },
  keys: new Set(), oneShot: { fire: false, autoFire: false, melee: false, dash: false, super: false, skill: false, special: false, act: false }, fireDir: null, fireDist: 0, mouseFire: null,
  sup: null, supShot: null,
};
const STICK_R = 56;

// --- pixel UI frames: nine-slice PNGs drawn once, used as border-image on panels, buttons and HUD ---
const PixelFrames = {
  rgb(c) { return [(c >> 16) & 255, (c >> 8) & 255, c & 255]; },
  // square frame (8px border) with a stepped corner: ink rim, light bevel top-left, dark bevel bottom-right, inner shadow, filled centre
  square(edge, fill, round) {
    const N = round ? 30 : 24, B = round ? 10 : 8, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'), img = x.createImageData(N, N), o = img.data;
    const ink = [10, 9, 20], [hi, mid, lo, deep] = edge.map((v) => this.rgb(v)), F = fill == null ? null : this.rgb(fill);
    const cut = round ? [5, 3, 2, 1, 1] : [2, 1]; // stepped corner profile, row by row
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const di = Math.min(i, N - 1 - i), dj = Math.min(j, N - 1 - j);
      const k = (j * N + i) * 4; let col = null, a = 255;
      // distance in from the stepped outline
      let inset = Math.min(di, dj);
      if (dj < cut.length && di < cut[dj]) { o[k + 3] = 0; continue; }
      if (di < cut.length && dj < cut[di]) { o[k + 3] = 0; continue; }
      const onEdge = (dj < cut.length && di === cut[dj]) || (di < cut.length && dj === cut[di]) || di === 0 || dj === 0;
      if (onEdge) col = ink;
      else if (inset <= 2) col = (i < N / 2 && j < N / 2) || (j < N / 2 && dj <= di) || (i < N / 2 && di <= dj && j < N - 3) ? (inset === 1 ? hi : mid) : (inset === 1 ? lo : deep);
      else if (inset <= B - 4) col = inset === B - 4 ? deep : mid;
      else if (inset === B - 3) col = ink;
      else if (F) { col = F; if (inset === B - 2 && (j < N / 2 || i < N / 2) && (dj === B - 2 || di === B - 2) && (j < N / 2 ? dj === B - 2 : di === B - 2)) col = F.map((v) => Math.round(v * 0.6)); }
      else { o[k + 3] = 0; continue; }
      // a sparse rivet pattern on the mid band
      if (inset === 3 && B === 8 && ((i === 3 && j === 3) || (i === N - 4 && j === 3) || (i === 3 && j === N - 4) || (i === N - 4 && j === N - 4))) col = hi;
      o[k] = col[0]; o[k + 1] = col[1]; o[k + 2] = col[2]; o[k + 3] = a;
    }
    x.putImageData(img, 0, 0); return 'url(' + c.toDataURL('image/png') + ')';
  },
  apply() {
    const r = document.documentElement.style, sq = (e, f, rd) => this.square(e, f, rd);
    const stone = [0x6e6878, 0x46414f, 0x332f3b, 0x24212b], gold = [0xefe6cf, 0xb9ad92, 0x7a705e, 0x4a4438], green = [0xa9d39a, 0x5d8a52, 0x3d5c36, 0x263a22];
    const red = [0xe0a49a, 0xa8463c, 0x6e2622, 0x441614], ice = [0xbfe3ef, 0x5f9fb8, 0x35667c, 0x1f3f4e], arc = [0xd9c8ef, 0x8f72b0, 0x5c477a, 0x3a2c50];
    const panelFill = 0x15131b, btnFill = 0x25222d, goldFill = 0x2f2b38;
    const set = (k, v) => { r.setProperty(k, v); r.setProperty(k + '-src', v); };
    set('--pxf-panel', sq(stone, panelFill)); set('--pxf-btn', sq(stone, btnFill)); set('--pxf-gold', sq(gold, goldFill));
    set('--pxf-legendary', sq([0xffe9a3, 0xffb347, 0xc4741a, 0x6c3814], panelFill));
    set('--pxf-green', sq(green, 0x1c2a1a)); set('--pxf-red', sq(red, 0x3a1614));
    set('--pxf-round', sq(stone, null, true)); set('--pxf-round-gold', sq(gold, null, true)); set('--pxf-round-ice', sq(ice, null, true)); set('--pxf-round-arc', sq(arc, null, true));
  },
};
function setupInput() {
  try { PixelFrames.apply(); } catch (e) { console.warn('pixel frames', e); }
  try { for (const k of ['explosion', 'hit', 'ring']) for (const pl of ['fire', 'frost', 'venom', 'arcane', 'blood']) SpriteFX.sheet(k, pl); } catch (e) { /* effects load on first use */ }
  try { CFG.brawlerOrder.forEach((id) => brawlerThumb(id)); } catch (e) { /* portraits fall back to the painted art */ }
  const layer = $('input'), base = $('stickBase'), knob = $('stickKnob'), atk = $('atk'), atkKnob = $('atkKnob');
  layer.addEventListener('pointerdown', (e) => {
    if (!G.started || G.modal) return;
    e.preventDefault();
    if (e.pointerType === 'mouse') {
      if (e.button === 0 && e.clientX > window.innerWidth * 0.45) { Input.mouseFire = screenToGround(e.clientX, e.clientY); return; }
    }
    if (e.clientX < window.innerWidth * 0.55 && Input.move.id === null) {
      Input.move.id = e.pointerId; Input.move.ox = e.clientX; Input.move.oy = e.clientY; Input.move.sx = Input.move.sy = 0; Input.move.active = true;
      try { layer.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      base.style.transform = `translate(${e.clientX - 70}px, ${e.clientY - 70}px)`; base.classList.add('on'); knob.style.transform = 'translate(0px,0px)';
      Coach.note('moved');
    }
  });
  layer.addEventListener('pointermove', (e) => {
    if (e.pointerId !== Input.move.id) return;
    let dx = e.clientX - Input.move.ox, dy = e.clientY - Input.move.oy; const d = Math.hypot(dx, dy);
    if (d > STICK_R) { dx *= STICK_R / d; dy *= STICK_R / d; }
    Input.move.sx = dx / STICK_R; Input.move.sy = -dy / STICK_R;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  const endMove = (e) => { if (e.pointerId !== Input.move.id) return; Input.move.id = null; Input.move.active = false; Input.move.sx = Input.move.sy = 0; base.classList.remove('on'); };
  layer.addEventListener('pointerup', endMove); layer.addEventListener('pointercancel', endMove);

  atk.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation(); if (!G.started || G.modal) return;
    const r = atk.getBoundingClientRect();
    Input.atk.id = e.pointerId; Input.atk.ox = r.left + r.width / 2; Input.atk.oy = r.top + r.height / 2; Input.atk.dx = Input.atk.dy = 0; Input.atk.active = true; Input.atk.aiming = false; Input.atk.t0 = performance.now();
    try { atk.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  });
  atk.addEventListener('pointermove', (e) => {
    if (e.pointerId !== Input.atk.id) return;
    let dx = e.clientX - Input.atk.ox, dy = e.clientY - Input.atk.oy; const d = Math.hypot(dx, dy);
    if (d > STICK_R) { dx *= STICK_R / d; dy *= STICK_R / d; }
    Input.atk.dx = dx; Input.atk.dy = dy; Input.atk.aiming = d > 16;
    atkKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  const endAtk = (e) => {
    if (e.pointerId !== Input.atk.id) return;
    if (e.type !== 'pointercancel' && Input.atk.aiming) { Input.oneShot.fire = true; Input.fireDir = [Input.atk.dx / STICK_R, -Input.atk.dy / STICK_R]; Input.fireDist = clamp(Math.hypot(Input.atk.dx, Input.atk.dy) / STICK_R, 0, 1); Coach.note('aimed'); }
    else if (e.type !== 'pointercancel' && performance.now() - Input.atk.t0 < 300) Input.oneShot.autoFire = true;
    Input.atk.id = null; Input.atk.active = false; Input.atk.aiming = false; atkKnob.style.transform = 'translate(0px,0px)';
  };
  atk.addEventListener('pointerup', endAtk); atk.addEventListener('pointercancel', endAtk);

  const btn = (id, key, coach) => $(id).addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (!G.started || G.modal) return; Input.oneShot[key] = true; if (coach) Coach.note(coach); $(id).classList.add('press'); setTimeout(() => $(id).classList.remove('press'), 120); });
  btn('bDash', 'dash', 'dashed'); btn('bMelee', 'melee'); btn('bSkill', 'skill');
  // Super and Special work like Brawl Stars: tap = auto-aim, drag = aim it yourself (with a preview)
  const aimBtn = (id, kind) => {
    const el = $(id);
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation(); if (!G.started || G.modal) return;
      const r = el.getBoundingClientRect();
      Input.sup = { id: e.pointerId, kind, ox: r.left + r.width / 2, oy: r.top + r.height / 2, dx: 0, dy: 0, aiming: false };
      try { el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      el.classList.add('press');
    });
    el.addEventListener('pointermove', (e) => {
      const S = Input.sup; if (!S || e.pointerId !== S.id) return;
      let dx = e.clientX - S.ox, dy = e.clientY - S.oy; const d = Math.hypot(dx, dy);
      if (d > STICK_R) { dx *= STICK_R / d; dy *= STICK_R / d; }
      S.dx = dx; S.dy = dy; S.aiming = d > 18;
    });
    const end = (e) => {
      const S = Input.sup; if (!S || e.pointerId !== S.id) return;
      el.classList.remove('press');
      if (e.type !== 'pointercancel') { Input.oneShot[kind] = true; Input.supShot = S.aiming ? { kind, dir: [S.dx / STICK_R, -S.dy / STICK_R], mag: clamp(Math.hypot(S.dx, S.dy) / STICK_R, 0, 1) } : null; }
      Input.sup = null;
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  };
  aimBtn('bSuper', 'super'); aimBtn('bSpecial', 'special');
  $('bAct').addEventListener('click', (e) => { e.preventDefault(); if (!G.modal) interact(); });

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return; const k = e.key.toLowerCase(); Input.keys.add(k);
    if (!G.started || G.modal) { if (k === 'escape' && G.modal && UI.closable) UI.close(); return; }
    if (k === ' ') Input.oneShot.dash = true; if (k === 'e') Input.oneShot.melee = true; if (k === 'q') Input.oneShot.super = true;
    if (k === 'r') Input.oneShot.skill = true; if (k === 'g') Input.oneShot.special = true; if (k === 'f') interact(); if (k === 'j') Input.oneShot.autoFire = true;
  });
  window.addEventListener('keyup', (e) => Input.keys.delete(e.key.toLowerCase()));
  // block page gestures
  document.addEventListener('touchmove', (e) => { if (!e.target.closest('.scroll, .pBody, .pMore, #doll')) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());
}
const _ray = new THREE.Raycaster(), _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), _hit = new THREE.Vector3(), _ndc = new THREE.Vector2();
function screenToGround(x, y) {
  _ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  _ray.setFromCamera(_ndc, camera);
  return _ray.ray.intersectPlane(_plane, _hit) ? [_hit.x, _hit.z] : null;
}
function stickToWorld(sx, sy) {
  const fx = Math.sin(Cam.yaw), fz = Math.cos(Cam.yaw), rx = -Math.cos(Cam.yaw), rz = Math.sin(Cam.yaw);
  return [fx * sy + rx * sx, fz * sy + rz * sx];
}
function buildPlayerIntent(dt = 1 / 60) {
  const f = G.mode === 'arena' && G.arena ? G.arena.fighters[0] : G.player;
  if (!f) return;
  const it = f.intent; f.autoHunting = false; // set again below while Auto Hunt is driving
  let sx = Input.move.sx, sy = Input.move.sy;
  if (Input.keys.has('a')) sx -= 1; if (Input.keys.has('d')) sx += 1; if (Input.keys.has('w')) sy += 1; if (Input.keys.has('s')) sy -= 1;
  // Auto Hunt keeps fighting behind menus in the open world (the sim runs there and you are safe while one is open)
  const menuAuto = !!G.modal && f === G.player && autoHuntOn();
  const frozen = !G.started || (G.modal && !menuAuto) || (G.arena && G.arena.phase === 'countdown');
  if (frozen) { it.mx = it.mz = 0; it.aiming = false; it.fire = it.autoFire = false; return; }
  const [mx, mz] = stickToWorld(sx, sy);
  it.mx = mx; it.mz = mz;
  // real frame time: intents are built every drawn frame (up to 120 a second), so a fixed 1/60 ran its timers twice as fast
  if (autoHuntOn() && f === G.player) autoHuntIntent(f, it, Math.hypot(sx, sy) > 0.1 || Input.atk.active, dt);
  it.aiming = Input.atk.aiming;
  if (Input.atk.aiming) { const [ax, az] = stickToWorld(Input.atk.dx / STICK_R, -Input.atk.dy / STICK_R); it.ax = ax; it.az = az; it.aimDist = clamp(Math.hypot(Input.atk.dx, Input.atk.dy) / STICK_R, 0, 1); }
  const os = Input.oneShot;
  if (os.fire && Input.fireDir) { const [ax, az] = stickToWorld(Input.fireDir[0], Input.fireDir[1]); it.ax = ax; it.az = az; it.fire = true; it.aiming = true; it.aimDist = Input.fireDist; }
  // hold the attack button (without dragging) to keep auto-firing: smooth for grinding
  if (Input.atk.active && !Input.atk.aiming && performance.now() - Input.atk.t0 > 300) it.autoFire = true;
  if (Input.supShot && (os.super || os.special)) {
    const S = Input.supShot, [sx, sz] = stickToWorld(S.dir[0], S.dir[1]), l = Math.hypot(sx, sz) || 1;
    if (S.kind === 'super') { it.superDir = [sx / l, sz / l]; it.superDist = S.mag; } else { it.specialDir = [sx / l, sz / l]; it.specialDist = S.mag; }
    Input.supShot = null;
  }
  if (Input.mouseFire) { const dx = Input.mouseFire[0] - f.x, dz = Input.mouseFire[1] - f.z, d = Math.hypot(dx, dz) || 1; it.ax = dx / d; it.az = dz / d; it.fire = true; it.aiming = true; Input.mouseFire = null; }
  if (os.autoFire) it.autoFire = true;
  if (os.melee) it.melee = true; if (os.dash) it.dash = true; if (os.super) it.super = true; if (os.skill) it.skill = true; if (os.special) it.special = true;
  for (const k in os) os[k] = false; Input.fireDir = null;
}

