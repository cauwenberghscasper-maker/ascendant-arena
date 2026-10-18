// --- Bastion builder mode (Clash of Clans style): the Build button turns the fort into a field seen from above with
// its grid. One finger pans, two fingers zoom, the strip at the bottom is the shop. Pick something, tap a cell (the
// see-through preview stands there, green or red) and tap it again or press Place. Walls and gates are drawn by dragging.
// With nothing picked, tapping a building opens its panel (upgrade, move, tear down). Your own fort holds still while
// you build (a shared one runs on); a starting wave closes the mode. The rules live in 36c-siege.js (fortGhost, fortDo).
const BD = { ptrs: new Map(), down: null, pinch: null, draw: false, last: '', warned: 0 };
function openBuilder() {
  const S = G.siege; if (!S) return;
  if (S.phase !== 'build') { toast('Build between waves', 'bad'); return; }
  const k = CFG.siege.objs[0];
  G.builder = G.builder || { cx: SC.x + k.x, cz: SC.z + k.z + 2, zoom: 1.7, sel: null, cell: null, move: null };
  $('builder').hidden = false; document.body.classList.add('builderOn');
  siegeGridOverlay(true); builderShop(); builderHud();
}
function closeBuilder() {
  G.builder = null; BD.ptrs.clear(); BD.down = BD.pinch = null; BD.draw = false;
  $('builder').hidden = true; document.body.classList.remove('builderOn'); siegeGridOverlay(false);
}
function builderSelect(t) { const B = G.builder; if (!B) return; B.move = null; B.sel = B.sel === t ? null : t; B.cell = null; builderShop(); builderHud(); }
// from a building's panel: pick it up and put it somewhere else (free)
function builderMove(b) { if (!G.builder) openBuilder(); const B = G.builder; if (!B) return; B.move = b; B.sel = b.t; B.cell = [b.x, b.z]; builderShop(); builderHud(); }
function builderShop() {
  const B = G.builder, F = fortState(), M = myFort(), p = G.profile;
  $('bdShop').innerHTML = SIEGE_TYPES.map((t) => {
    const T = CFG.siege.towers[t], c = fortCost(t, 1), have = F.b.filter((b) => b.t === t).length, full = T.max && have >= T.max, poor = p.gold < c.gold || M.stones < c.stones;
    return `<button class="bdItem${B.sel === t && !B.move ? ' on' : ''}${full || poor ? ' off' : ''}" data-bd="${t}">${fortPic(t)}<b>${T.short}</b><small>${full ? `${have}/${T.max}` : `${ICON.coin}${fmtK(c.gold)}${c.stones ? ` · ${fmt(c.stones)}` : ''}`}</small></button>`;
  }).join('');
}
function builderHud() {
  const B = G.builder, S = G.siege; if (!B || !S) return;
  const F = fortState(), T = B.sel ? CFG.siege.towers[B.sel] : null;
  $('bdInfo').innerHTML = `Wave ${S.wave} · ${fortJobs(F)}/${fortBuilders(F)} builders · <b class="stones">${fmt(myFort().stones)}</b> stones`;
  $('bdHint').textContent = B.move ? `Moving the ${T.short}: tap where it goes` : !T ? 'Pick something below, or tap a building' : T.wall ? `Drag your finger to draw ${T.short.toLowerCase()}s` : `Tap where the ${T.short} goes, then tap again or Place`;
  $('bdPlace').hidden = !(B.sel && B.cell && !(T && T.wall && !B.move));
  $('bdWave').textContent = `Start wave ${S.wave}`; $('bdWave').hidden = S.phase !== 'build';
}
// the screen point on the ground (y = 0), and the cell a building of type t would take there
const _bdRay = new THREE.Raycaster(), _bdV = new THREE.Vector2(), _bdPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), _bdHit = new THREE.Vector3();
function builderGround(x, y) {
  const r = renderer.domElement.getBoundingClientRect(); _bdV.set((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1);
  _bdRay.setFromCamera(_bdV, camera); return _bdRay.ray.intersectPlane(_bdPlane, _bdHit) ? { x: _bdHit.x, z: _bdHit.z } : null;
}
function builderCell(x, y, t) { const g = builderGround(x, y); if (!g) return null; const s = FORT_TYPES[t] || 1, cs = CFG.siege.cell; return [Math.round((g.x - SC.x) / cs - s / 2), Math.round((g.z - SC.z) / cs - s / 2)]; }
function builderConfirm() {
  const B = G.builder, g = fortGhost(); if (!g) return;
  const why = g.ok ? fortDo(g.op) : fortCheck(g.op);
  if (why) { toast(why, 'bad'); return; }
  Sfx.play('unlock');
  if (B.move) { B.move = null; B.sel = null; } // a moved building is set down; a new one keeps the pick, for building several
  B.cell = null; builderShop(); builderHud();
}
// drawing walls: a piece on every new cell under the finger (cells that are taken are skipped)
function builderDraw(x, y) {
  const B = G.builder, c = builderCell(x, y, B.sel); if (!c) return;
  const key = c.join(','); if (key === BD.last) return; BD.last = key;
  const op = { o: 'add', t: B.sel, x: c[0], z: c[1] }; B.cell = c;
  if (fortCheck(op)) return;
  const why = fortDo(op); if (why) { if (G.time - BD.warned > 2) { BD.warned = G.time; toast(why, 'bad'); } } else builderShop();
}
function builderTap(x, y) {
  const B = G.builder, S = G.siege;
  if (B.sel) {
    const c = builderCell(x, y, B.sel); if (!c) return;
    if (B.cell && B.cell[0] === c[0] && B.cell[1] === c[1]) builderConfirm(); else { B.cell = c; builderHud(); }
    return;
  }
  const g = builderGround(x, y); if (!g) return;
  const u = S.units.find((q) => Math.abs(q.x - g.x) < q.size + 0.2 && Math.abs(q.z - g.z) < q.size + 0.2);
  if (u) openFortBPanel(S.units.indexOf(u));
}
function builderInit() {
  const el = $('builder'), ui = (e) => e.target.closest('#bdTop, #bdShop, #bdPlace');
  el.addEventListener('pointerdown', (e) => {
    if (!G.builder || G.modal || ui(e)) return;
    e.preventDefault(); el.setPointerCapture(e.pointerId); BD.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (BD.ptrs.size === 2) { const [a, b] = [...BD.ptrs.values()]; BD.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: G.builder.zoom }; BD.down = null; BD.draw = false; return; }
    BD.down = { x: e.clientX, y: e.clientY, moved: false }; BD.last = '';
    const T = G.builder.sel && CFG.siege.towers[G.builder.sel];
    BD.draw = !!(T && T.wall && !G.builder.move); if (BD.draw) builderDraw(e.clientX, e.clientY);
  });
  el.addEventListener('pointermove', (e) => {
    const P = BD.ptrs.get(e.pointerId), B = G.builder; if (!P || !B) return;
    const px = P.x, py = P.y; P.x = e.clientX; P.y = e.clientY;
    if (BD.pinch && BD.ptrs.size === 2) { const [a, b] = [...BD.ptrs.values()]; B.zoom = clamp(BD.pinch.z * BD.pinch.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)), 0.9, 3.4); return; }
    if (!BD.down) return;
    if (BD.draw) { builderDraw(e.clientX, e.clientY); return; }
    if (!BD.down.moved && Math.hypot(e.clientX - BD.down.x, e.clientY - BD.down.y) < 9) return;
    BD.down.moved = true;
    const g0 = builderGround(px, py), g1 = builderGround(e.clientX, e.clientY); if (!g0 || !g1) return;
    const h = G.siege.half; B.cx = clamp(B.cx - (g1.x - g0.x), SC.x - h, SC.x + h); B.cz = clamp(B.cz - (g1.z - g0.z), SC.z - h, SC.z + h);
  });
  const up = (e) => {
    if (!BD.ptrs.has(e.pointerId)) return;
    BD.ptrs.delete(e.pointerId);
    if (BD.ptrs.size < 2) BD.pinch = null;
    if (BD.down && !BD.down.moved && !BD.draw && G.builder && e.type === 'pointerup') builderTap(e.clientX, e.clientY);
    if (!BD.ptrs.size) { BD.down = null; BD.draw = false; }
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  $('bdShop').addEventListener('click', (e) => { const b = e.target.closest('[data-bd]'); if (b) { Sfx.play('click'); builderSelect(b.dataset.bd); } });
  $('bdDone').addEventListener('click', () => { Sfx.play('click'); closeBuilder(); });
  $('bdWave').addEventListener('click', () => { Sfx.play('click'); closeBuilder(); startSiegeWave(); });
  $('bdOk').addEventListener('click', () => builderConfirm());
  $('bdCancel').addEventListener('click', () => { const B = G.builder; if (!B) return; B.cell = null; B.move = null; B.sel = null; builderShop(); builderHud(); });
}
builderInit();
