// --- Bastion builder mode (Clash of Clans style): the Build button turns the fort into a field seen from above with
// its grid. One finger pans, two fingers zoom, the strip at the bottom is the shop: swipe it sideways to scroll, drag a
// building up out of it onto the field (its see-through preview follows the finger, green where it fits, red where not)
// and let go to place it. A tap on a shop item picks it instead: tap a cell, drag the preview around, then Place.
// Walls and gates are dragged in straight lines (the line locks to the row or column you pull along) and built when you
// let go. With nothing picked, tapping a building opens its panel (upgrade, path, collect, move, tear down); a full mill
// or mine is collected straight away. Waves run on while you build. The rules live in 36c-siege.js (fortGhosts, fortDo).
// the shop's tabs: [id, name, buildings]
const BD_CATS = [['def', 'Defences', ['archer', 'cannon', 'ballista', 'mage', 'warrior']], ['res', 'Resources', ['mill', 'mine', 'iron', 'hut']],
  ['wall', 'Walls', ['wall', 'gate']], ['trap', 'Traps', ['spike', 'bomb', 'tar']]];
const bdCatOf = (t) => (BD_CATS.find((c) => c[2].includes(t)) || BD_CATS[0])[0];
const BD = { ptrs: new Map(), down: null, pinch: null, line: null, ghost: false, shop: null, warned: 0 };
function openBuilder() {
  const S = G.siege; if (!S) return;
  const k = CFG.siege.objs[0];
  G.builder = G.builder || { cx: SC.x + k.x, cz: SC.z + k.z + 2, zoom: 1.7, sel: null, cell: null, move: null, line: null };
  $('builder').hidden = false; document.body.classList.add('builderOn');
  siegeGridOverlay(true); builderShop(); builderHud();
}
function closeBuilder() {
  G.builder = null; BD.allT = 0; BD.ptrs.clear(); BD.down = BD.pinch = BD.line = BD.shop = null; BD.ghost = false;
  $('builder').hidden = true; document.body.classList.remove('builderOn'); siegeGridOverlay(false);
}
function builderSelect(t) { const B = G.builder; if (!B) return; B.del = false; BD.allT = 0; B.move = null; B.line = null; B.sel = B.sel === t ? null : t; B.cell = null; builderShop(); builderHud(); }
// from a building's panel: pick it up and put it somewhere else (free)
function builderMove(b) { if (!G.builder) openBuilder(); const B = G.builder; if (!B) return; B.move = b; B.sel = b.t; B.cat = bdCatOf(b.t); B.cell = [b.x, b.z]; B.line = null; builderShop(); builderHud(); }
// the shop: what each costs, how many the Keep allows (3/5), and which Keep level unlocks one you cannot have yet
function builderShop() {
  const B = G.builder, F = fortState(), M = myFort(), sl = $('bdList').scrollLeft;
  if (!B.cat) B.cat = BD_CATS[0][0];
  // tabs by kind of building (Clash of Clans: Defences, Resources, Walls, Traps), each with how many you have of what the Keep allows
  $('bdTabs').innerHTML = BD_CATS.map(([id, name, ts]) => { const have = ts.reduce((n, t) => n + fortCount(t, F), 0), lim = ts.reduce((n, t) => n + fortLimit(t, F), 0);
    return `<button class="bdTab${B.cat === id ? ' on' : ''}" data-cat="${id}"><b>${name}</b><small>${have}/${lim}</small></button>`; }).join('');
  $('bdList').innerHTML = BD_CATS.find((c) => c[0] === B.cat)[2].map((t) => {
    const T = CFG.siege.towers[t], c = fortCost(t, 1), have = fortCount(t, F), lim = fortLimit(t, F), full = have >= lim, at = full ? fortLimitAt(t, have) : 0, poor = !fortHas(c, M);
    const tag = full ? (at && !lim ? `Keep ${at}` : `${have}/${lim}`) : `${have}/${lim}`;
    return `<button class="bdItem${B.sel === t && !B.move ? ' on' : ''}${full || poor ? ' off' : ''}" data-bd="${t}">${fortPic(t)}<b>${T.short}</b><small class="bdCnt">${tag}</small><small>${full ? '' : fortResHTML(c, M)}</small></button>`;
  }).join('');
  $('bdList').scrollLeft = sl;
}
function builderHud() {
  const B = G.builder, S = G.siege; if (!B || !S) return;
  const F = fortState(), M = myFort(), T = B.sel ? CFG.siege.towers[B.sel] : null, L = B.line;
  $('bdInfo').innerHTML = `Keep ${F.keep || 1} · ${fortJobs(F)}/${fortBuilders(F)} builders · ${fortHave(M)}`;
  $('bdDel').classList.toggle('on', !!B.del); $('bdAll').hidden = !B.del;
  if (B.del) { const n = F.b.length; $('bdAll').textContent = BD.allT > performance.now() ? `Tap again: tear down ${n}` : 'Remove all'; $('bdAll').classList.toggle('arm', BD.allT > performance.now()); }
  $('bdHint').innerHTML = B.del ? 'Tap or swipe buildings to tear them down (half back) · two fingers move'
    : L ? `${L.cells.length} ${T.short.toLowerCase()}${L.cells.length === 1 ? '' : 's'} · ${fortResHTML(L.cost, M)} · let go to build`
    : B.move ? `Moving the ${T.short}: tap or drag where it goes` : !T ? 'Drag something up from the shop, or tap a building'
    : T.wall ? `Drag a straight line of ${T.short.toLowerCase()}s` : `Drag the ${T.short} where it goes, then Place`;
  $('bdPlace').hidden = !!B.del || !(B.sel && B.cell && !(T && T.wall && !B.move));
  // waves: the first one waits for Start; after that they come by themselves unless paused
  $('bdWave').textContent = !F.go ? `Start wave ${S.wave}` : 'Start now'; $('bdWave').hidden = S.phase !== 'build';
  $('bdHold').hidden = !F.go; $('bdHold').textContent = F.hold ? 'Resume waves' : 'Pause waves'; $('bdHold').classList.toggle('on', !!F.hold);
  $('bdWaveInfo').textContent = S.phase === 'build' ? (!F.go ? `Wave ${S.wave} waits for you` : F.hold ? `Paused before wave ${S.wave}` : `Wave ${S.wave} in ${Math.ceil(S.t)}s`) : S.phase === 'fight' ? `Wave ${S.wave} · ${siegeLeft()} left` : `Wave ${S.wave} held!`;
}
// the screen point on the ground (y = 0), and the cell a building of type t would take there
const _bdRay = new THREE.Raycaster(), _bdV = new THREE.Vector2(), _bdPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), _bdHit = new THREE.Vector3();
function builderGround(x, y) {
  const r = renderer.domElement.getBoundingClientRect(); _bdV.set((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1);
  _bdRay.setFromCamera(_bdV, camera); return _bdRay.ray.intersectPlane(_bdPlane, _bdHit) ? { x: _bdHit.x, z: _bdHit.z } : null;
}
function builderCell(x, y, t) { const g = builderGround(x, y); if (!g) return null; const s = FORT_TYPES[t] || 1, cs = CFG.siege.cell; return [Math.round((g.x - SC.x) / cs - s / 2), Math.round((g.z - SC.z) / cs - s / 2)]; }
function builderConfirm() {
  const B = G.builder, g = fortGhosts(); if (!g || !g.length) return;
  const why = g[0].ok ? fortDo(g[0].op) : fortCheck(g[0].op) || fortShortWhy(g[0].op);
  if (why) { toast(why, 'bad'); return; }
  Sfx.play('unlock');
  if (B.move) { B.move = null; B.sel = null; } // a moved building is set down; a new one keeps the pick, for building several
  B.cell = null; builderShop(); builderHud();
}
const fortShortWhy = (op) => { const q = fortShort(fortPrice(op)); return q ? `Not enough ${CFG.siege.resName[q].toLowerCase()}` : ''; };
// a straight line of walls or gates from cell a toward cell b, locked to the row or column pulled along the most
function builderLine(a, b) {
  const di = b[0] - a[0], dj = b[1] - a[1], n = Math.min(60, Math.max(Math.abs(di), Math.abs(dj))), cells = [];
  for (let k = 0; k <= n; k++) cells.push(Math.abs(di) >= Math.abs(dj) ? [a[0] + Math.sign(di) * k, a[1]] : [a[0], a[1] + Math.sign(dj) * k]);
  return cells;
}
// the line as it would be built: pieces that do not fit are skipped; the Keep's limit and your resources cut it short
function builderLinePlan(t, cells) {
  const F = fortState(), M = myFort(), left = Math.max(0, fortLimit(t, F) - fortCount(t, F)), c1 = fortCost(t, 1), cost = { wood: 0, stones: 0, iron: 0 }, plan = [];
  let n = 0;
  for (const c of cells) {
    const op = { o: 'add', t, x: c[0], z: c[1] };
    let ok = n < left && !fortCheck(op, F);
    if (ok) { const nx = {}; for (const q of CFG.siege.res) nx[q] = cost[q] + (c1[q] || 0); if (!fortHas(nx, M)) ok = false; else Object.assign(cost, nx); n++; }
    plan.push({ t, x: c[0], z: c[1], ok, op });
  }
  return { cells, plan, cost };
}
function builderLineMove(x, y) {
  const B = G.builder, L = BD.line, c = builderCell(x, y, B.sel); if (!c || !L) return;
  const key = c.join(','); if (key === L.key) return; L.key = key;
  B.line = Object.assign(builderLinePlan(B.sel, builderLine(L.a, c)), { a: L.a }); builderHud();
}
function builderLineDone() {
  const B = G.builder, L = B && B.line; BD.line = null; if (!L) return;
  B.line = null;
  let n = 0, why = '';
  for (const q of L.plan) { if (!q.ok) continue; const r = fortDo(q.op); if (r) { why = r; break; } n++; }
  if (n) Sfx.play('unlock');
  const skipped = L.plan.length - n;
  if (!n) toast(why || fortLinePlanWhy(L) || 'Nothing fits there', 'bad');
  else if (skipped) toast(`Built ${n} ${CFG.siege.towers[B.sel].short.toLowerCase()}${n === 1 ? '' : 's'} · ${skipped} did not fit${why ? ` (${why})` : ''}`);
  builderShop(); builderHud();
}
function fortLinePlanWhy(L) { const q = L.plan.find((p) => !p.ok); return q ? fortCheck(q.op) || fortShortWhy(q.op) : ''; }
// tap on the field: pick a cell for the picked building, or open (or collect) the building under the finger
function builderTap(x, y) {
  const B = G.builder, S = G.siege;
  if (B.sel) {
    const c = builderCell(x, y, B.sel); if (!c) return;
    if (B.cell && B.cell[0] === c[0] && B.cell[1] === c[1]) builderConfirm(); else { B.cell = c; builderHud(); }
    return;
  }
  if (B.del) { builderRemoveAt(x, y); return; }
  const g = builderGround(x, y); if (!g) return;
  const k = CFG.siege.objs[0]; if (Math.hypot(g.x - SC.x - k.x, g.z - SC.z - k.z) < k.r) { openFortKeepPanel(); return; }
  const u = S.units.find((q) => Math.abs(q.x - g.x) < q.size + 0.2 && Math.abs(q.z - g.z) < q.size + 0.2); if (!u) return;
  const T = CFG.siege.towers[u.b.t];
  if (T.make && fortMade(u.b) >= 1) { fortCollectUnit(u); return; } // Clash of Clans: a tap on a mill or mine with something in it collects it
  openFortBPanel(S.units.indexOf(u));
}
// the shop strip (the open tab): a sideways swipe scrolls it, a drag up out of it carries the building onto the field
function builderShopDown(e) {
  const it = e.target.closest('[data-bd]'), el = $('bdList'); if (!it || !G.builder) return;
  e.preventDefault(); el.setPointerCapture(e.pointerId);
  BD.shop = { id: e.pointerId, t: it.dataset.bd, x0: e.clientX, y0: e.clientY, sl: el.scrollLeft, mode: null, vx: 0, lx: e.clientX, lt: performance.now() };
}
function builderShopMove(e) {
  const P = BD.shop, B = G.builder; if (!P || P.id !== e.pointerId || !B) return;
  const dx = e.clientX - P.x0, dy = e.clientY - P.y0, el = $('bdList');
  if (!P.mode) {
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) P.mode = 'scroll';
    else if (dy < -14 && -dy > Math.abs(dx)) { P.mode = 'drag'; B.del = false; B.move = null; B.line = null; B.sel = P.t; B.cell = null; builderShop(); }
  }
  if (P.mode === 'scroll') { const now = performance.now(); P.vx = (e.clientX - P.lx) / Math.max(1, now - P.lt); P.lx = e.clientX; P.lt = now; el.scrollLeft = P.sl - dx; }
  else if (P.mode === 'drag') {
    // the preview stands a little above the finger, so the finger never hides it
    const r = el.getBoundingClientRect(), y = e.clientY - 46;
    if (e.clientY < r.top) { const c = builderCell(e.clientX, y, B.sel); if (c && (!B.cell || c[0] !== B.cell[0] || c[1] !== B.cell[1])) { B.cell = c; builderHud(); } }
    else if (B.cell) { B.cell = null; builderHud(); }
  }
}
function builderShopUp(e) {
  const P = BD.shop, B = G.builder; if (!P || P.id !== e.pointerId) return;
  BD.shop = null; if (!B) return;
  if (!P.mode && e.type === 'pointerup') { Sfx.play('click'); builderSelect(P.t); return; }
  if (P.mode === 'scroll') { // a short glide after a quick swipe
    const el = $('bdList'); let v = P.vx * 16; const glide = () => { if (Math.abs(v) < 0.5 || BD.shop) return; el.scrollLeft -= v; v *= 0.92; requestAnimationFrame(glide); }; glide(); return;
  }
  if (P.mode === 'drag' && B.cell && e.type === 'pointerup') {
    const T = CFG.siege.towers[B.sel], g = fortGhosts();
    if (T.wall || (g && g.length && g[0].ok)) builderConfirm(); // dropped where it fits: built (a wall piece too; drag more lines on the field)
    else { const w = g && g.length ? fortCheck(g[0].op) || fortShortWhy(g[0].op) : ''; if (w) toast(w, 'bad'); builderHud(); } // the red preview stays to be moved
  }
}
// Remove mode: the building under the finger is torn down at once (half its cost back, like the panel's Tear down)
function builderUnitAt(x, y) { const g = builderGround(x, y); if (!g) return null; return G.siege.units.find((q) => Math.abs(q.x - g.x) < q.size + 0.2 && Math.abs(q.z - g.z) < q.size + 0.2) || null; }
function builderRemoveAt(x, y, quiet) {
  const u = builderUnitAt(x, y); if (!u) return false;
  const F = fortState(), k = F.b.indexOf(u.b); if (k < 0) return false;
  const why = fortDo({ o: 'del', k });
  if (why) { if (!quiet || why !== BD.lastWhy) toast(why, 'bad'); BD.lastWhy = why; return false; }
  Sfx.play('click'); burst(u.x, 1, u.z, 10, 0xcfc4ae, 4, 0.5, 0.25, 3, 1); builderHud(); return true;
}
// Remove all: a second tap within 4 s tears down every building the rules allow (your last builder stays)
function builderRemoveAll() {
  const B = G.builder; if (!B) return;
  if (!(BD.allT > performance.now())) { BD.allT = performance.now() + 4000; builderHud(); setTimeout(() => G.builder && builderHud(), 4100); return; }
  BD.allT = 0; const F = fortState(); let n = 0, why = '';
  for (let k = F.b.length - 1; k >= 0; k--) { const r = fortDo({ o: 'del', k }); if (r) why = r; else n++; } // from the end, so every index stays right
  if (n) { Sfx.play('unlock'); showToast(`Tore down ${n} building${n === 1 ? '' : 's'} · half the cost back`); } else if (why) toast(why, 'bad');
  builderShop(); builderHud();
}
function builderInit() {
  const el = $('builder'), ui = (e) => e.target.closest('#bdTop, #bdShop, #bdPlace');
  el.addEventListener('pointerdown', (e) => {
    if (!G.builder || G.modal || ui(e)) return;
    e.preventDefault(); el.setPointerCapture(e.pointerId); BD.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (BD.ptrs.size === 2) { const [a, b] = [...BD.ptrs.values()]; BD.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: G.builder.zoom, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; BD.down = null; BD.line = null; G.builder.line = null; BD.ghost = false; return; }
    BD.down = { x: e.clientX, y: e.clientY, moved: false };
    const B = G.builder, T = B.sel && CFG.siege.towers[B.sel];
    if (B.del) { BD.lastWhy = ''; return; }
    if (T && T.wall && !B.move) { const c = builderCell(e.clientX, e.clientY, B.sel); if (c) { BD.line = { a: c, key: '' }; builderLineMove(e.clientX, e.clientY); } return; }
    // a press on the preview (or anywhere near it) drags the preview instead of the camera
    BD.ghost = false;
    if (T && B.cell) { const c = builderCell(e.clientX, e.clientY, B.sel), s = FORT_TYPES[B.sel]; if (c && Math.abs(c[0] - B.cell[0]) <= s && Math.abs(c[1] - B.cell[1]) <= s) BD.ghost = true; }
  });
  el.addEventListener('pointermove', (e) => {
    const P = BD.ptrs.get(e.pointerId), B = G.builder; if (!P || !B) return;
    const px = P.x, py = P.y; P.x = e.clientX; P.y = e.clientY;
    if (BD.pinch && BD.ptrs.size === 2) {
      const [a, b] = [...BD.ptrs.values()], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; B.zoom = clamp(BD.pinch.z * BD.pinch.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)), 0.9, 3.4);
      const g0 = builderGround(BD.pinch.mx, BD.pinch.my), g1 = builderGround(mx, my); BD.pinch.mx = mx; BD.pinch.my = my; // two fingers also move the map
      if (g0 && g1) { const h = G.siege.half; B.cx = clamp(B.cx - (g1.x - g0.x), SC.x - h, SC.x + h); B.cz = clamp(B.cz - (g1.z - g0.z), SC.z - h, SC.z + h); }
      return;
    }
    if (!BD.down) return;
    if (BD.line) { builderLineMove(e.clientX, e.clientY); return; }
    if (!BD.down.moved && Math.hypot(e.clientX - BD.down.x, e.clientY - BD.down.y) < 9) return;
    BD.down.moved = true;
    if (B.del) { builderRemoveAt(e.clientX, e.clientY, true); return; } // remove mode: one finger sweeps buildings away
    if (BD.ghost) { const c = builderCell(e.clientX, e.clientY, B.sel); if (c && (c[0] !== B.cell[0] || c[1] !== B.cell[1])) { B.cell = c; builderHud(); } return; }
    const g0 = builderGround(px, py), g1 = builderGround(e.clientX, e.clientY); if (!g0 || !g1) return;
    const h = G.siege.half; B.cx = clamp(B.cx - (g1.x - g0.x), SC.x - h, SC.x + h); B.cz = clamp(B.cz - (g1.z - g0.z), SC.z - h, SC.z + h);
  });
  const up = (e) => {
    if (!BD.ptrs.has(e.pointerId)) return;
    BD.ptrs.delete(e.pointerId);
    if (BD.ptrs.size < 2) BD.pinch = null;
    if (BD.line && G.builder) { if (e.type === 'pointerup') builderLineDone(); else { BD.line = null; G.builder.line = null; builderHud(); } }
    else if (BD.down && !BD.down.moved && G.builder && e.type === 'pointerup') builderTap(e.clientX, e.clientY);
    if (!BD.ptrs.size) { BD.down = null; BD.ghost = false; }
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  const shop = $('bdList');
  $('bdTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'), B = G.builder; if (!b || !B) return; Sfx.play('click'); B.cat = b.dataset.cat; shop.scrollLeft = 0; builderShop(); });
  shop.addEventListener('pointerdown', builderShopDown); shop.addEventListener('pointermove', builderShopMove);
  shop.addEventListener('pointerup', builderShopUp); shop.addEventListener('pointercancel', builderShopUp);
  shop.addEventListener('wheel', (e) => { shop.scrollLeft += e.deltaY + e.deltaX; e.preventDefault(); }, { passive: false });
  $('bdDone').addEventListener('click', () => { Sfx.play('click'); closeBuilder(); });
  $('bdDel').addEventListener('click', () => { const B = G.builder; if (!B) return; Sfx.play('click'); B.del = !B.del; BD.allT = 0; B.sel = null; B.cell = null; B.move = null; B.line = null; builderShop(); builderHud(); });
  $('bdAll').addEventListener('pointerdown', (e) => { e.preventDefault(); Sfx.play('click'); builderRemoveAll(); }); // pointerdown: a quick second tap is not eaten as a double-tap
  $('fortBuildBtn').addEventListener('click', () => { if (G.siege && !G.modal && !G.builder) { Sfx.play('click'); openBuilder(); } });
  $('bdWave').addEventListener('click', () => { Sfx.play('click'); startSiegeWave(); builderHud(); });
  $('bdHold').addEventListener('click', () => { Sfx.play('click'); siegeToggleHold(); builderHud(); });
  $('fortChip').addEventListener('click', () => { if (G.siege && !G.modal) { Sfx.play('click'); siegeToggleHold(); } });
  $('bdOk').addEventListener('click', () => builderConfirm());
  $('bdCancel').addEventListener('click', () => { const B = G.builder; if (!B) return; B.cell = null; B.move = null; B.sel = null; B.line = null; builderShop(); builderHud(); });
}
// pause or resume the waves that come by themselves (in a shared world the host keeps the setting)
function siegeToggleHold() {
  const F = fortState(), why = fortDo({ o: 'hold', v: F.hold ? 0 : 1 }); if (why) { toast(why, 'bad'); return; }
  if (typeof siegeFollowing === 'function' && siegeFollowing()) showToast('Asked the host');
  else showToast(F.hold ? 'Waves paused: press Resume or Start when ready' : 'Waves resume');
}
// called every frame from the fort view: the wave timer and, when something changed, the shop's prices and counts
function builderTick() {
  const B = G.builder; if (!B) return;
  if ((BD.hudT = (BD.hudT || 0) - 1 / 60) <= 0) { BD.hudT = 0.25; if (!B.line) builderHud(); }
  const F = fortState(), M = myFort(), sig = [M.wood, M.stones, M.iron, F.b.length, F.keep, F.kd > fortNow()].join();
  if (sig !== BD.sig && !BD.shop) { BD.sig = sig; builderShop(); }
}
builderInit();
