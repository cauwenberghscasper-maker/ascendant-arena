// --- Ascendant Lanes view: the lane field, built on entry and disposed on exit. Everything standing is a generated
// world model (lanes_core, lanes_tower, lanes_brazier, the two minions lanes_minion_melee / lanes_minion_ranged, trees,
// rocks); code geometry is only the ground, the dirt lane decal and VFX (team rings under minions, tower reach rings).
// Red's buildings and minions are the same models tinted warm. Minions are instanced and moved every frame.
const lanesGroup = new THREE.Group(); scene.add(lanesGroup); lanesGroup.visible = false;
const lanesParts = { sets: [], structs: [], mins: null, rings: null, reach: [], t: 0 };
const LN_TINT = { blue: 0xffffff, red: 0xffa894 }, LN_COL = { blue: 0x3fa9ff, red: 0xff4d4d };
const LN_MIN_POOL = 24, LN_MODEL = { tower: ['lanes_tower', 8.5], core: ['lanes_core', 6.2], melee: ['lanes_minion_melee', 1.55], ranged: ['lanes_minion_ranged', 1.25] };
function lanesGround(HX, HZ) {
  const w = HX * 2 + 70, d = HZ * 2 + 70;
  let g = new THREE.PlaneGeometry(w, d, Math.round(w / 4), Math.round(d / 4)).rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), out = Math.max(Math.abs(x) - HX, Math.abs(z) - HZ); pos.setY(i, out > 2 ? Math.min(4, (out - 2) * 0.14) + (hashf(x * 0.7, z * 0.7) - 0.5) * 1.2 : -0.03); }
  g.computeVertexNormals(); g = g.toNonIndexed();
  const gp = g.attributes.position, n = gp.count, col = new Float32Array(n * 3), th = new Float32Array(n).fill(1), gl = new Float32Array(n * 3);
  const lo = new THREE.Color(0x3d6a2e), hi = new THREE.Color(0x6a9a3e), dirt = new THREE.Color(0x7a6a46);
  for (let i = 0; i < n; i++) { const x = gp.getX(i), z = gp.getZ(i), k = clamp(vnoise((x + LC.x) * 0.06, (z + LC.z) * 0.06) * 1.2 - 0.1, 0, 1); _col.copy(lo).lerp(hi, k); if (vnoise(x * 0.11 + 3, z * 0.11) > 0.8) _col.lerp(dirt, 0.3); col.set([_col.r, _col.g, _col.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aTh', new THREE.BufferAttribute(th, 1)); g.setAttribute('aGc', new THREE.BufferAttribute(gl, 3)); g.deleteAttribute('uv');
  const m = new THREE.Mesh(g, matGround); m.position.set(LC.x, 0, LC.z); m.receiveShadow = true; lanesGroup.add(m);
  // the lane: a dirt path from base to base, and a dirt clearing round each base
  const tex = new THREE.CanvasTexture(siegeDirtTex().image); tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace; tex.repeat.set(1, HZ * 2 / 6);
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(7, HZ * 2).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  lane.position.set(LC.x, 0.02, LC.z); lanesGroup.add(lane);
}
function buildLanesView() {
  const S = G.lanes, R = CFG.lanes, HX = lanesHalfX(), HZ = R.half.z, rng = mulberry32(4242);
  lanesGround(HX, HZ);
  const L = {}, add = (n, it) => (L[n] || (L[n] = [])).push(it);
  // woods round the field: two rows of oaks and a few rocks and bushes along the edge
  for (const [off, name, sc] of [[3, 'tree_oak', 5.4], [9, 'tree_oak_lod', 6.2]]) {
    for (let z = -HZ - 12; z <= HZ + 12; z += 4.2 + rng() * 2) for (const sx of [-1, 1]) add(name, { x: LC.x + sx * (HX + off + rng() * 3), z: LC.z + z, ry: rng() * 6.28, s: sc * (0.8 + rng() * 0.4) });
    for (let x = -HX - 12; x <= HX + 12; x += 4.2 + rng() * 2) for (const sz of [-1, 1]) add(name, { x: LC.x + x, z: LC.z + sz * (HZ + off + rng() * 3), ry: rng() * 6.28, s: sc * (0.8 + rng() * 0.4) });
  }
  for (let i = 0; i < 26; i++) { const sx = rng() < 0.5 ? -1 : 1, z = (rng() * 2 - 1) * (HZ - 8); add(rng() < 0.5 ? 'rock_a' : 'bush_a', { x: LC.x + sx * (HX - 1.5 - rng() * 3), z: LC.z + z, ry: rng() * 6.28, s: 1.3 + rng() * 1.2 }); }
  for (const z of [-30, -10, 10, 30]) for (const sx of [-1, 1]) add('lanes_brazier', { x: LC.x + sx * 5.2, z: LC.z + z, ry: sx > 0 ? -Math.PI / 2 : Math.PI / 2, s: 2.4 });
  for (const n in L) lanesParts.sets.push(WorldModels.place(lanesGroup, n, L[n], { far: 999 }));
  // buildings: one set per team so red can wear its tint
  for (const team of LN_TEAMS) for (const sk of ['tower', 'core']) {
    const list = S.structs.filter((s) => s.team === team && s.sk === sk), [name, sc] = LN_MODEL[sk];
    const items = list.map((s) => ({ x: s.x, z: s.z, ry: team === 'blue' ? 0 : Math.PI, s: sc }));
    const h = WorldModels.place(lanesGroup, name, items, { far: 999, tint: LN_TINT[team], glow: sk === 'core' ? LN_COL[team] : null, glowK: 0.18 });
    lanesParts.sets.push(h); list.forEach((s, i) => lanesParts.structs.push({ s, h, it: items[i] }));
  }
  // minion pools: hidden until a minion takes a slot (the set's bounds span the lane so it loads with the field)
  lanesParts.mins = {};
  for (const team of LN_TEAMS) for (const mk of ['melee', 'ranged']) {
    const [name, sc] = LN_MODEL[mk], items = Array.from({ length: LN_MIN_POOL }, (_, i) => ({ x: LC.x + (i % 2 ? 4 : -4), z: LC.z + (i / LN_MIN_POOL * 2 - 1) * HZ, s: sc, base: sc, hidden: true }));
    const h = WorldModels.place(lanesGroup, name, items, { far: 999, tint: LN_TINT[team], cell: 9999 }); lanesParts.sets.push(h); lanesParts.mins[team + mk] = { h, items };
  }
  // team rings under every minion (they also show the minion while its model is still loading)
  const rg = new THREE.RingGeometry(0.45, 0.68, 20).rotateX(-Math.PI / 2), rm = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, depthWrite: false });
  lanesParts.rings = new THREE.InstancedMesh(rg, rm, LN_MIN_POOL * 4); for (let i = 0; i < LN_MIN_POOL * 4; i++) lanesParts.rings.setColorAt(i, _col.set(0xffffff)); lanesParts.rings.count = 0; lanesParts.rings.frustumCulled = false; lanesGroup.add(lanesParts.rings);
  // enemy tower reach: a faint red ring that shows when you walk close
  for (const s of S.structs) if (s.sk === 'tower') { const m = new THREE.Mesh(new THREE.RingGeometry(R.tower.range - 0.25, R.tower.range, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: LN_COL[s.team], transparent: true, opacity: 0, depthWrite: false })); m.position.set(s.x, 0.05, s.z); lanesGroup.add(m); lanesParts.reach.push({ s, m }); }
}
function disposeLanesView() {
  for (const h of lanesParts.sets) WorldModels.dispose(h);
  const geos = new Set(), mats = new Set();
  lanesGroup.traverse((o) => { if (o.geometry) geos.add(o.geometry); if (o.material && o.material !== matGround) mats.add(o.material); });
  geos.forEach((g) => g.dispose()); mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
  lanesGroup.clear(); Object.assign(lanesParts, { sets: [], structs: [], mins: null, rings: null, reach: [], t: 0 });
}
function enterLanesView(on) {
  hubGroup.visible = !on; riftGroup.visible = false; lanesGroup.visible = on;
  if (on) { buildLanesView(); scene.fog.color.set(0x6f8a9a); scene.fog.near = 60; scene.fog.far = 150; paintSky(new THREE.Color(0x3a5a9a), new THREE.Color(0xd8c8a0)); }
  else { disposeLanesView(); scene.fog.near = 50; scene.fog.far = Q.lowTier ? 95 : 140; }
}
function updateLanesView(dt, t) {
  const S = G.lanes; if (!S || !lanesGroup.visible) { WorldModels.update(); return; }
  hubGroup.visible = false;
  lanesParts.t += dt;
  // buildings: a fallen one disappears in a cloud of rubble
  for (const q of lanesParts.structs) { const dead = !q.s.alive; if (dead !== !!q.it.hidden) { q.it.hidden = dead; q.h.dirty = true; if (dead) burst(q.s.x, 2, q.s.z, 50, 0x6a5a4a, 8, 1.3, 0.5, 4, 2.4); } }
  // minions: alive ones take the pool's slots in order, the rest hide
  const rings = lanesParts.rings; let rn = 0;
  for (const team of LN_TEAMS) for (const mk of ['melee', 'ranged']) {
    const P = lanesParts.mins[team + mk]; let i = 0;
    for (const m of S.minions) {
      if (!m.alive || m.team !== team || m.mk !== mk || i >= LN_MIN_POOL) continue;
      const it = P.items[i++], bob = mk === 'ranged' ? 0.55 + Math.sin(t * 3 + m.id) * 0.15 : Math.abs(Math.sin(t * 8 + m.id)) * 0.1 * (m.moveAmt || 0);
      it.x = m.x; it.z = m.z; it.y = bob; it.ry = m.facing; it.rx = (m.attackAnim || 0) * (mk === 'melee' ? 0.35 : -0.2); it.hidden = false;
      it.s = it.base * (m.flashT > 0 ? 1.08 : 1);
      if (rn < rings.instanceMatrix.count) { _m4.makeTranslation(m.x, 0.04, m.z); rings.setMatrixAt(rn, _m4); rings.setColorAt(rn, _col.set(LN_COL[team])); rn++; }
    }
    for (let k = i; k < LN_MIN_POOL; k++) P.items[k].hidden = true;
    P.h.dirty = true; if (P.h.multi) for (const x of P.h.multi) x.dirty = true;
  }
  rings.count = rn; if (rn) { rings.instanceMatrix.needsUpdate = true; if (rings.instanceColor) rings.instanceColor.needsUpdate = true; }
  const pl = G.player;
  for (const r of lanesParts.reach) { const d = Math.hypot(pl.x - r.s.x, pl.z - r.s.z), on = r.s.alive && r.s.team !== pl.team && d < CFG.lanes.tower.range + 6; r.m.material.opacity += ((on ? 0.45 + Math.sin(t * 5) * 0.12 : 0) - r.m.material.opacity) * Math.min(1, dt * 6); }
  WorldModels.update();
}
// labels and bars over the field (60-hud.js updateTags)
function lanesTags(put, near) {
  const S = G.lanes, my = G.player.team;
  for (const s of S.structs) if (s.alive && near(s, 60)) { const sh = lanesShielded(s); put(s.x, s.sk === 'core' ? 6.8 : 9, s.z, `${s.sk === 'core' ? 'Core' : 'Tower'}${sh ? ' · shielded' : ''}`, s.hp / s.maxHp, `obj${s.sk === 'core' ? ' main' : ''}${s.hurtT > 0 ? ' hurt' : ''}${s.team === my ? ' ally' : ' foe'}`); }
  for (const f of S.fighters) if (!f.isPlayer && f.alive && near(f, 40)) put(f.x, 2.5 * growthScale(f), f.z, `${f.nick || f.name}${f.lanesBot ? ' · bot' : ''}`, f.hp / f.maxHp, f.team === my ? 'peer' : 'foe arena');
  for (const e of lanesMpPeers()) if (e.alive && near(e, 40)) put(e.x, 2.5 * growthScale(e), e.z, `${e.nick} · ${e.level}`, e.hp, e.team === my ? 'peer' : 'foe arena');
  for (const m of S.minions) if (m.alive && m.hp < m.maxHp && near(m, 24)) put(m.x, m.mk === 'ranged' ? 2.4 : 2.1, m.z, '', m.hp / m.maxHp, m.team === my ? 'peer' : 'foe arena');
  for (const c of S.camps) if (c.alive && near(c, 30)) put(c.x, 3, c.z, `Lane Guardian · ${Math.round(CFG.lanes.camp.buff * 100)}% damage`, c.hp / c.maxHp, 'mob elite');
}
function lanesObjText() {
  const S = G.lanes, pl = G.player, m = Math.floor(Math.max(0, CFG.lanes.time - S.t) / 60), s = Math.floor(Math.max(0, CFG.lanes.time - S.t) % 60);
  if (S.phase === 'countdown') return `Ascendant Lanes · ${S.size}v${S.size} · get ready`;
  if (S.phase === 'over') return S.result ? (S.result.win ? 'Victory!' : 'Defeat') : 'Match over';
  const head = `Blue ${S.kills.blue} · ${m}:${String(s).padStart(2, '0')} · ${S.kills.red} Red`;
  return !pl.alive ? `${head} · back in ${Math.ceil(pl.respawnT || 0)}s` : S.buff[pl.team] > 0 ? `${head} · Guardian's might ${Math.ceil(S.buff[pl.team])}s` : head;
}
function drawLanesMinimap(g, W2, H2, dpr) {
  const S = G.lanes, R = CFG.lanes, HX = lanesHalfX(), HZ = R.half.z, s = Math.min(W2 / (HX * 2 + 6), H2 / (HZ * 2 + 6)), cx = W2 / 2, cy = H2 / 2;
  const ax = (x) => cx - (x - LC.x) * s, ay = (z) => cy - (z - LC.z) * s, my = G.player.team, col = (team) => (team === my ? '#3fa9ff' : '#ff4d4d');
  g.fillStyle = '#2f4a26'; g.fillRect(cx - HX * s, cy - HZ * s, HX * 2 * s, HZ * 2 * s);
  g.fillStyle = '#8a7650'; g.fillRect(cx - 3.5 * s, cy - HZ * s, 7 * s, HZ * 2 * s);
  for (const o of S.structs) { const w = (o.sk === 'core' ? 5 : 3.5) * dpr; g.fillStyle = o.alive ? col(o.team) : '#555'; g.fillRect(ax(o.x) - w / 2, ay(o.z) - w / 2, w, w); }
  for (const c of S.camps) if (c.alive) { g.fillStyle = '#ffd34a'; g.fillRect(ax(c.x) - 2 * dpr, ay(c.z) - 2 * dpr, 4 * dpr, 4 * dpr); }
  for (const m of S.minions) if (m.alive) { g.fillStyle = col(m.team); g.fillRect(ax(m.x) - dpr, ay(m.z) - dpr, 2 * dpr, 2 * dpr); }
  const dot = (x, z, c, r) => { g.fillStyle = c; g.beginPath(); g.arc(ax(x), ay(z), r * dpr, 0, Math.PI * 2); g.fill(); };
  for (const f of S.fighters) if (f.alive && !f.isPlayer) dot(f.x, f.z, col(f.team), 3);
  for (const e of lanesMpPeers()) if (e.alive) dot(e.x, e.z, col(e.team), 3);
  if (G.player.alive) { dot(G.player.x, G.player.z, '#ffd34a', 4); }
}
function lanesEvent(e) {
  switch (e.t) {
    case 'lanesStart': enterLanesView(true); Cam.yaw = 0; Cam.pos.set(e.x, 30, e.z - 14); Cam.look.set(e.x, 0, e.z + 1.5); Cam.fx = e.x; Cam.fz = e.z + 1.5;
      SpriteFX.play('pillar', 'frost', e.x, 0, e.z, 6); Sfx.play('super'); showBanner(`Ascendant Lanes · ${e.size}v${e.size}`, `Destroy the enemy Core${e.norm ? ` · heroes scaled to level ${e.L}` : ''}`, 'gold'); break;
    case 'lanesFight': Sfx.play('horn'); showBanner('Fight!', 'Push your lane with the minions', 'gold'); break;
    case 'lanesLeave': enterLanesView(false); Cam.yaw = 0; Cam.pos.set(e.x, 30, e.z - 14); Cam.look.set(e.x, 0, e.z + 1.5); Cam.fx = e.x; Cam.fz = e.z + 1.5; Feed.remove('lanes'); break;
    case 'lanesEnd': if (e.win) { Sfx.play('win'); showBanner('Victory!', e.why === 'time' ? 'More of your base still stands' : 'The enemy Core has fallen', 'gold'); } else { Sfx.play('lose'); showBanner('Defeat', e.why === 'time' ? 'Time is up' : 'Your Core has fallen', 'red'); } break;
    case 'lanesKill': Feed.add(`${gi('m_arena')} ${e.mine ? `<b>${escapeHTML(e.name)}</b> fell` : `<b>${escapeHTML(e.name)}</b> was defeated`} · Blue ${G.lanes.kills.blue} · ${G.lanes.kills.red} Red`, e.mine ? 'boss' : 'rift', null, 4); break;
    case 'lanesStructDown': Cam.shake = Math.max(Cam.shake, 0.6); Sfx.play(e.mine ? 'lose' : 'job'); SpriteFX.play('pillar', e.mine ? 'blood' : 'gold', e.x, 0, e.z, 7);
      showBanner(e.sk === 'core' ? (e.mine ? 'Your Core fell' : 'Enemy Core destroyed') : e.mine ? 'We lost a tower' : 'Enemy tower destroyed', '', e.mine ? 'red' : 'gold', 1.8); break;
    case 'lanesBuff': toast(e.mine ? `Guardian's might: +${Math.round(CFG.lanes.camp.buff * 100)}% damage for your team` : 'The enemy took the Lane Guardian', e.mine ? 'good' : 'bad'); break;
    case 'lanesRespawn': SpriteFX.play('pillar', 'frost', G.player.x, 0, G.player.z, 4); break;
    case 'lanesTowerShot': if (near(e, 30)) { burst(e.x, 8.4, e.z, 6, e.team === 'blue' ? 0x9fe8ff : 0xffa070, 3, 0.35, 0.22, 1, 0.5); Sfx.play('zap', { x: e.x, z: e.z, gap: 0.25 }); } break;
  }
}
