// --- party-dungeon view: event-room set pieces on top of the hall builder (47-dungeon-view.js). Generated models
// (delve_altar, delve_moonwell, delve_echo, delve_hoard, delve_throne) plus existing ones (chest, pillar); code geometry
// here is only VFX: rune rings, glows, the moonwell shimmer and the pressure-plate floor sigils.
const delveParts = { plates: [], caches: [], cacheSets: [], mimic: null, altar: null, well: null, glows: [], seals: [], tex: [], veins: [] };
// --- puzzle halls: pixel runes (7×7, bone white with an ink outline) floating over each seal; a floor mural shows the
// order. Pips (1-5 dots) stand in for runes on the easy runs that number their seals.
const PZ_GLYPHS = ['0011100,0100010,1000001,1111111,1000001,0100010,0011100', '1000001,0100010,0010100,0001000,0010100,0100010,1000001', '0001000,0011100,0101010,1001001,0001000,0001000,0011100',
  '1111111,1000000,1011110,1010010,1011110,1000000,1111111', '0001000,0010100,0100010,1000001,0100010,0010100,0001000', '1110111,1000001,1001001,0011100,1001001,1000001,1110111',
  '0100010,0100010,1111111,0100010,0100010,1111111,0100010', '0010000,0011000,0010100,0010010,0010100,0011000,0010000'];
const PZ_PIPS = [[[3, 3]], [[1, 1], [5, 5]], [[1, 1], [3, 3], [5, 5]], [[1, 1], [5, 1], [1, 5], [5, 5]], [[1, 1], [5, 1], [3, 3], [1, 5], [5, 5]]];
function pzCells(g, pip) { const out = []; if (pip != null) for (const [x, y] of PZ_PIPS[pip]) out.push([x, y]); else PZ_GLYPHS[g].split(',').forEach((row, y) => [...row].forEach((c, x) => { if (c === '1') out.push([x, y]); })); return out; }
// draws glyphs (or pips) side by side with arrows between: one tile per entry, each 9×9 pixels of 8 px
function pzTexture(items, arrows) {
  const T = 72, gap = arrows ? 36 : 0, cv = document.createElement('canvas'); cv.width = items.length * T + (items.length - 1) * gap; cv.height = T;
  const g = cv.getContext('2d'), px = 8;
  items.forEach((it, k) => {
    const ox = k * (T + gap), cells = pzCells(it.g, it.pip);
    g.fillStyle = '#16121c'; for (const [x, y] of cells) g.fillRect(ox + x * px, y * px, px * 3, px * 3); // ink outline round every stroke
    g.fillStyle = '#efe6d2'; for (const [x, y] of cells) g.fillRect(ox + (x + 1) * px, (y + 1) * px, px, px);
    if (arrows && k < items.length - 1) { g.fillStyle = '#efe6d2'; for (let i = 0; i < 3; i++) g.fillRect(ox + T + 8 + i * 6, T / 2 - 12 + i * 6, 6, 24 - i * 12); }
  });
  const tx = new THREE.CanvasTexture(cv); tx.magFilter = tx.minFilter = THREE.NearestFilter; tx.generateMipmaps = false; tx.colorSpace = THREE.SRGBColorSpace;
  delveParts.tex.push(tx); return tx;
}
function buildDelvePuzzles(D, tint) {
  for (const t of delveParts.tex) t.dispose(); delveParts.tex = []; delveParts.seals = [];
  const add = (o) => { dungeonGroup.add(o); return o; }, levers = [], stones = [];
  for (const m of D.rooms) {
    if (!m.pz) continue; const pz = m.pz, K = pz.sw.length;
    pz.sw.forEach((q, j) => {
      const at = pz.order.indexOf(j), lever = q.lever;
      if (lever) levers.push({ x: q.x, z: q.z, ry: j * 1.7, s: 2.6 });
      // the seal: a ring on the floor (a plate also gets a dim stone disc), its rune floating above
      const ring = add(new THREE.Mesh(new THREE.RingGeometry(1.35, 1.7, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }))); ring.position.set(q.x, 0.04, q.z);
      const disc = lever ? null : add(new THREE.Mesh(new THREE.CircleGeometry(1.3, 8).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x5a5060, transparent: true, opacity: 0.55, depthWrite: false })));
      if (disc) disc.position.set(q.x, 0.03, q.z);
      const sp = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: pzTexture([{ g: q.g, pip: pz.pips ? at : null }]), color: 0x8a8590, transparent: true, depthWrite: false })));
      sp.position.set(q.x, lever ? 3.6 : 2.2, q.z); sp.scale.setScalar(1.25);
      delveParts.seals.push({ room: m.i, j, ring, disc, sp, base: sp.position.y });
    });
    // the mural (only the ordered puzzle has one): the runes in their order (or the pips counting up), between two standing stones
    if (pz.kind !== 'order') continue;
    const seq = pz.order.map((j, k) => ({ g: pz.sw[j].g, pip: pz.pips ? k : null })), w = K * 1.7, tex = pzTexture(seq, true);
    const mural = add(new THREE.Mesh(new THREE.PlaneGeometry(w + (K - 1) * 0.85, 1.7).rotateX(-Math.PI / 2).rotateY(Math.PI), new THREE.MeshBasicMaterial({ map: tex, color: tint, transparent: true, depthWrite: false })));
    mural.position.set(pz.clue.x, 0.05, pz.clue.z); mural.material.color.lerp(new THREE.Color(0xffffff), 0.55);
    const slab = add(new THREE.Mesh(new THREE.PlaneGeometry(w + (K - 1) * 0.85 + 0.8, 2.3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x14101c, transparent: true, opacity: 0.6, depthWrite: false }))); slab.position.set(pz.clue.x, 0.04, pz.clue.z);
    const ex = (w + (K - 1) * 0.85) / 2 + 1.1; stones.push({ x: pz.clue.x - ex, z: pz.clue.z + 0.3, ry: 0.3, s: 2.2 }, { x: pz.clue.x + ex, z: pz.clue.z + 0.3, ry: 2.8, s: 2.2 });
  }
  if (levers.length) dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'rune_obelisk', levers, { glow: tint, glowK: 0.12 }));
  if (stones.length) dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'standing_stone', stones));
}
// awake seals glow in the dungeon's colour and their rune rises; a wrong seal flashes the whole hall red
function updateDelvePuzzles(D, t) {
  const tint = BIOMES[D.delve.def.biome].coreColor;
  for (const q of delveParts.seals) {
    const m = D.rooms[q.room], S = D.delve.pz[q.room], awake = !!S && delvePzLit(m, S, q.j), red = S && S.flash > 0 && Math.sin(t * 30) > 0;
    // the echo shows its order: one seal after the other flashes white while nothing is awake yet
    const showing = delvePzShow(m, S) === q.j;
    // the race: dark seals pulse faster while the clock runs
    const racing = m.pz.kind === 'timed' && S && S.bits && !S.done;
    const hold = S && S.hold[q.j] > 0 ? S.hold[q.j] / DV.puzzle.hold : 0;
    q.sp.material.color.setHex(red ? 0xff4040 : showing ? 0xffffff : awake ? tint : hold > 0 ? 0xffffff : 0x8a8590);
    q.ring.material.color.setHex(red ? 0xff3030 : showing ? 0xffffff : tint); q.ring.material.opacity = awake || showing ? 0.95 : 0.3 + hold * 0.5 + Math.sin(t * (racing ? 12 : 3) + q.j) * (racing ? 0.2 : 0.08);
    q.sp.position.y = q.base + (awake ? 0.5 : 0) + Math.sin(t * 2 + q.j) * 0.08;
    if (q.disc) q.disc.material.color.setHex(awake ? tint : 0x5a5060);
  }
}
function buildDelveProps(D) {
  const X = D.delve, add = (o) => { dungeonGroup.add(o); return o; }, tint = BIOMES[X.def.biome].coreColor;
  const glow = (col, op) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
  Object.assign(delveParts, { plates: [], caches: [], cacheSets: [], mimic: null, altar: null, well: null, glows: [] });
  const cover = D.props.filter((q) => !q.kind); // lever stones are placed with their puzzle below
  if (cover.length) dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'pillar', cover.map((q, k) => ({ x: q.x, z: q.z, ry: k * 1.3, s: 3.4 }))));
  buildDelvePuzzles(D, tint);
  // rare veins: the existing crystal model in the dungeon's treasure colour, a soft glow under it; gone once you mined it
  delveParts.veins = (D.veins || []).map((v, i) => {
    const col = X.def.gem ? X.def.gem.color : tint, item = { x: v.x, z: v.z, ry: i * 2.1, s: v.lode ? 3.6 : 2.8 };
    const set = WorldModels.place(dungeonGroup, 'crystal', [item], { glow: col, glowK: v.lode ? 0.75 : 0.6 }); dungeonParts.sets.push(set);
    const ring = add(new THREE.Mesh(new THREE.RingGeometry(1.6, 2.5, 32).rotateX(-Math.PI / 2), glow(col, 0.5))); ring.position.set(v.x, 0.04, v.z);
    return { i, item, set, ring };
  });
  const echo = [];
  for (const m of D.rooms) {
    if (!m.event) continue;
    // every event room has a cache chest at its centre, shown once the event pays out
    delveParts.caches.push({ room: m.i, items: [{ x: m.x, z: m.z + (m.event === 'altar' || m.event === 'fountain' ? 3 : 0), ry: Math.PI, s: 1.2, hidden: true }, { x: m.x, z: m.z + (m.event === 'altar' || m.event === 'fountain' ? 3 : 0), ry: Math.PI, s: 1.5, hidden: true }] });
    const ring = add(new THREE.Mesh(new THREE.RingGeometry(m.h * 0.55, m.h * 0.62, 48).rotateX(-Math.PI / 2), glow(tint, 0.18))); ring.position.set(m.x, 0.03, m.z); delveParts.glows.push(ring);
    if (m.event === 'altar') {
      const g = add(new THREE.Group()); g.position.set(m.x, 0, m.z);
      // the generated altar (delve_altar) plus a rune circle and a glow on its orb
      dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'delve_altar', [{ x: m.x, z: m.z, ry: 0.4, s: 2.6 }], { glow: 0x9b3dff, glowK: 0.18 }));
      const rune = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 6).rotateX(-Math.PI / 2), glow(0x9b3dff, 0.75)); rune.position.y = 0.04;
      const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), glow(0xc77dff, 0.35)); orb.scale.setScalar(0.55); orb.position.y = 2.2;
      g.add(rune, orb); delveParts.altar = { g, rune, orb };
    }
    if (m.event === 'fountain') {
      const g = add(new THREE.Group()); g.position.set(m.x, 0, m.z);
      // the generated moonwell (delve_moonwell, 2 m tall) with a shimmer on its water
      dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'delve_moonwell', [{ x: m.x, z: m.z, ry: 0, s: 2 }], { glow: 0x9fe8ff, glowK: 0.15 }));
      const water = new THREE.Mesh(new THREE.CircleGeometry(1.15, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: swirlTex(), color: 0x9fe8ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })); water.position.y = 0.95;
      g.add(water); delveParts.well = { g, water };
    }
    if (m.event === 'plates') for (const q of m.plates.slice(0, clamp(X.n, 1, 4))) {
      // a glowing floor sigil (a decal, not a prop): dim gold until someone stands on it
      const p = add(new THREE.Mesh(new THREE.CircleGeometry(1.25, 6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x8a6a2a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))); p.position.set(q.x, 0.03, q.z);
      const r = add(new THREE.Mesh(new THREE.RingGeometry(1.3, 1.55, 32).rotateX(-Math.PI / 2), glow(0xffcf1f, 0.5))); r.position.set(q.x, 0.05, q.z);
      delveParts.plates.push({ room: m.i, p, r });
    }
    if (m.event === 'mimic') delveParts.mimic = { room: m.i, set: WorldModels.place(dungeonGroup, 'chest', [{ x: m.x, z: m.z, ry: Math.PI, s: 1.25 }]) };
    if (m.event === 'echo') dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'delve_echo', [{ x: m.x, z: m.z + m.h * 0.55, ry: Math.PI, s: 3.4 }], { glow: 0x7fffd4, glowK: 0.3 }));
    if (m.event === 'vault') dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'delve_hoard', [{ x: m.x + m.hx * 0.5, z: m.z + m.hz * 0.5, ry: 2.4, s: 1.4 }, { x: m.x - m.hx * 0.5, z: m.z - m.hz * 0.4, ry: 0.7, s: 1.1 }], { glow: 0xffc94a, glowK: 0.12 }));
    if (m.event === 'echo') for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.785; echo.push({ x: m.x + Math.sin(a) * m.h * 0.6, z: m.z + Math.cos(a) * m.h * 0.6, ry: a, s: 2.6 }); }
  }
  if (echo.length) dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'pillar', echo));
  // the boss sits before its throne at the far end of the boss hall; a hoard waits beside the reward chest
  const B = D.rooms.at(-1);
  dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'delve_throne', [{ x: B.x, z: B.z1 - 3, ry: Math.PI, s: 5.5 }], { glow: 0xff3030, glowK: 0.08 }));
  dungeonParts.sets.push(WorldModels.place(dungeonGroup, 'delve_hoard', [{ x: B.x + 3.2, z: B.z - 1.5, ry: 2, s: 1.3 }, { x: B.x - 3.4, z: B.z - 1, ry: 4, s: 1.1 }], { glow: 0xffc94a, glowK: 0.12 }));
  if (delveParts.mimic) dungeonParts.sets.push(delveParts.mimic.set);
  for (const c of delveParts.caches) { const s = [WorldModels.place(dungeonGroup, 'chest', [c.items[0]]), WorldModels.place(dungeonGroup, 'chest_open', [c.items[1]], { glow: 0xffc94a, glowK: 0.25 })]; c.sets = s; dungeonParts.sets.push(...s); }
}
function updateDelveView(dt, t) {
  const D = G.dungeon, X = D.delve;
  updateDelvePuzzles(D, t);
  for (const v of delveParts.veins) { const gone = !!X.mined[v.i]; if (v.item.hidden !== gone) { v.item.hidden = gone; v.set.dirty = true; v.ring.visible = !gone; } v.ring.material.opacity = 0.25 + Math.sin(t * 2.5 + v.i) * 0.15; }
  for (const c of delveParts.caches) {
    const b = X.bonus[c.room] | 0, [cc, co] = c.items, hc = b !== 1, ho = b !== 2;
    if (cc.hidden !== hc || co.hidden !== ho) { cc.hidden = hc; co.hidden = ho; for (const h of c.sets) h.dirty = true; if (b === 1) burst(cc.x, 1, cc.z, 20, 0xffd34a, 4, 0.8, 0.4, 6, 3); }
  }
  for (const q of delveParts.plates) { const on = (X.plates[q.room] || [])[delveParts.plates.filter((o) => o.room === q.room).indexOf(q)]; q.p.material.color.setHex(on ? 0x6cff8a : 0x8a6a2a); q.r.material.opacity = on ? 0.9 : 0.35 + Math.sin(t * 4) * 0.15; }
  if (delveParts.mimic) { const s = X.ev[delveParts.mimic.room] || {}, it = delveParts.mimic.set && delveParts.mimic.set.items ? delveParts.mimic.set.items[0] : null, hide = !!s.woke;
    if (it && it.hidden !== hide) { it.hidden = hide; delveParts.mimic.set.dirty = true; } }
  if (delveParts.altar) { const A = delveParts.altar; A.orb.position.y = 2.2 + Math.sin(t * 2) * 0.12; A.rune.rotation.y = t * 0.4; A.rune.material.opacity = X.used.altar ? 0.2 : 0.7; }
  if (delveParts.well) { delveParts.well.water.rotation.y = -t * 0.5; delveParts.well.water.material.opacity = X.used.fountain ? 0.25 : 0.8; }
  for (const r of delveParts.glows) r.material.opacity = 0.14 + Math.sin(t * 1.7 + r.position.x) * 0.05;

}
