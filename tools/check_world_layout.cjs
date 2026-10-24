// World v11 layout (open map of area squares round Base Camp): passes, walls, roads, dens, points of interest, secrets, minimap size and population, from the built index.html
// plus the pure POI builders in world-art.js (their colliders are what the hub grid receives).
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let passed = 0;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
const c = { Math, console, LOCAL_PREVIEW: false, TEST_MODE: false, nextId: 1, G: { profile: { level: 1, worldTier: 0 }, player: { alive: false, x: 0, z: -49 }, enemies: [], ents: new Map(), time: 0, obstacles: null }, ev() {} };
vm.createContext(c);
for (const f of ['test-mode', 'loot-collection', 'prestige', 'companions', 'heroes-v6']) vm.runInContext(fs.readFileSync(path.join(root, 'assets/data', f + '.js'), 'utf8').replace(/export /g, ''), c);
vm.runInContext(section('const CFG = {', '// 2. UTIL') + section('const clamp =', '// 3. DATA') + section('class Grid {', '// --- entities') +
  section('function patrolCountFor(', 'function rewardEnemyKill(') + '\nthis.config = CFG;', c);
const W = c.config.world, Z = W.zones;
(async () => {
  const art = await import('data:text/javascript,' + encodeURIComponent(fs.readFileSync(path.join(root, 'assets/art/world-art.js'), 'utf8')));
  check('two dens per combat area, on opposite flanks and more than 60 m apart', () => {
    for (let zi = 0; zi < Z.length; zi++) {
      const d = W.dens.filter((D) => D.zone === zi);
      if (Z[zi].safe) { assert.equal(d.length, 0); continue; }
      const zn = Z[zi]; assert.equal(d.length, 2, zn.name); assert(Math.hypot(d[0].x - d[1].x, d[0].z - d[1].z) > 60, zn.name + ' dens apart');
      assert((d[0].x - zn.cx) * (d[1].x - zn.cx) + (d[0].z - zn.cz) * (d[1].z - zn.cz) < 0, zn.name + ' dens on opposite sides');
      for (const D of d) assert(D.x - D.r > zn.x0 + 6 && D.x + D.r < zn.x1 - 6 && D.z - D.r > zn.z0 + 6 && D.z + D.r < zn.z1 - 6, D.name + ' inside its walls');
    }
  });
  const ids = W.pois.map((q) => q.id);
  check('POI ids are unique and stable (save keys)', () => {
    assert.equal(new Set(ids).size, ids.length); assert.equal(ids.length, 451); assert.equal(W.nodes.length, (Z.length - 1) * 4); assert.equal(W.runes.length, (Z.length - 1) * 4); assert(W.runes.every((q) => q.hidden && q.art === 'obelisk'));
    for (const id of ['a00:landmark:0', 'a01:secret:0', 'a03:dungeon:0', 'a09:secret:1', 'a29:secret:1', 'a29:dungeon:0', 'a01:dungeon:0', 'a01:dungeon:2', 'a29:dungeon:2']) assert(ids.includes(id), id);
    for (const id of ['a00:dungeon:0', 'a01:secret:1', 'a05:dungeon:3']) assert(!ids.includes(id), id);
    for (const q of W.pois) assert(new RegExp(`^a${String(q.zone).padStart(2, '0')}:${q.kind}:\\d$`).test(q.id), q.id);
    const dg = W.pois.filter((q) => q.kind === 'dungeon'); assert.equal(dg.length, (Z.length - 1) * 3, 'three caves per combat area');
    for (const q of dg) { assert.equal(q.lvl, Z[q.zone].lvl[1]); assert(q.face === 1 || q.face === -1); }
    assert.equal(W.secrets.length, 42); assert(W.secrets.every((q) => q.hidden));
  });
  check('each area has one hero landmark with its own art id and builder', () => {
    const majors = W.pois.filter((q) => q.major); assert.equal(majors.length, Z.length);
    assert.equal(new Set(majors.map((q) => q.art)).size, Z.length);
    for (const q of W.pois) assert(art.POI_ART_IDS.includes(q.art), q.art);
  });
  // structural colliders: POI builders, lair stone rings, gate pillars, waypoint obelisks (scatter props never enter POI clear zones)
  const solids = [];
  for (const q of W.pois) { const h = art.poiLayout(q, art.REGION_ART[Z[q.zone].theme], () => {}); q.hits = h; solids.push(...h); }
  for (const l of W.lairList) for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; solids.push({ x: l.x + Math.sin(a) * 9.5, z: l.z + Math.cos(a) * 9.5, r: 0.7 }); }
  solids.push(...W.wallSolids); // the cliffs and woods between areas
  for (const e of W.edges) if (e.warden) for (const k of [-1, 1]) solids.push(e.vert ? { x: e.x, z: e.z + k * (e.w / 2 + 2), r: 2.2 } : { x: e.x + k * (e.w / 2 + 2), z: e.z, r: 2.2 }); // gate towers
  for (const w of W.waypoints) solids.push({ x: w.x, z: w.z, r: 0.9 });
  check('every POI and secret has a clear spot: in bounds, off the road and gates, away from dens, lairs, shrines and each other', () => {
    for (const q of W.pois) {
      const zn = Z[q.zone];
      assert(q.x - q.r > zn.x0 + 6 && q.x + q.r < zn.x1 - 6 && q.z - q.r > zn.z0 + 6 && q.z + q.r < zn.z1 - 6, q.id + ' inside its walls');
      if (q.kind !== 'node') assert(W.roadDist(q.x, q.z) > q.r + 2, q.id + ' off the roads');
      for (const h of q.hits) assert(h.x - h.r > zn.x0 + 3 && h.x + h.r < zn.x1 - 3 && h.z - h.r > zn.z0 + 3 && h.z + h.r < zn.z1 - 3, q.id + ' collider in bounds');
      for (const o of W.pois) if (o !== q) assert(Math.hypot(o.x - q.x, o.z - q.z) > o.r + q.r, q.id + ' vs ' + o.id);
      for (const D of W.dens) assert(Math.hypot(D.x - q.x, D.z - q.z) > D.r + q.r + 3, q.id + ' vs den');
      for (const l of W.lairList) assert(Math.hypot(l.x - q.x, l.z - q.z) > 13 + q.r, q.id + ' vs lair');
      for (const w of W.waypoints) assert(Math.hypot(w.x - q.x, w.z - q.z) > 4 + q.r, q.id + ' vs waypoint');
      for (const s of c.config.shrines.list) assert(Math.hypot(s.x - q.x, s.z - q.z) > 8 + q.r, q.id + ' vs shrine');
      if (q.zone === 0) assert(Math.hypot(q.x - W.town.x, q.z - W.town.z) > W.town.r + 5 + q.r);
      assert(!c.enemySpawnClear({ zone: q.zone, r: 0.7 }, q.x, q.z, false), q.id + ' keeps monsters out');
    }
  });
  check('BFS over the collision grid reaches every POI and secret from its area gate; secrets close without their gap', () => {
    const step = 0.5, pad = 0.6;
    function reach(zi, extra) {
      const zn = Z[zi], z0 = zn.z0, z1 = zn.z1, x0 = zn.x0, nx = Math.floor((zn.x1 - zn.x0) / step) + 1, nz = Math.floor((z1 - z0) / step) + 1;
      const blocked = new Uint8Array(nx * nz), seen = new Uint8Array(nx * nz), qu = new Int32Array(nx * nz);
      for (const o of solids.concat(extra || [])) {
        if (o.z + o.r + pad < z0 || o.z - o.r - pad > z1) continue; const r = o.r + pad;
        for (let z = Math.max(0, Math.floor((o.z - r - z0) / step)); z <= Math.min(nz - 1, Math.ceil((o.z + r - z0) / step)); z++)
          for (let x = Math.max(0, Math.floor((o.x - r - x0) / step)); x <= Math.min(nx - 1, Math.ceil((o.x + r - x0) / step)); x++)
            if (Math.hypot(x0 + x * step - o.x, z0 + z * step - o.z) < r) blocked[z * nx + x] = 1;
      }
      const cell = (x, z) => Math.round((z - z0) / step) * nx + Math.round((x - x0) / step);
      const sp = zi === 0 ? W.spawn : W.passSide(W.edgesOf[zi][0], zi), start = cell(sp.x, sp.z); assert(!blocked[start], zn.name + ' pass mouth open');
      let b = 0, e = 0; qu[e++] = start; seen[start] = 1;
      while (b < e) { const i = qu[b++], x = i % nx, z = (i / nx) | 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, zz = z + dz, n = zz * nx + xx; if (xx < 0 || zz < 0 || xx >= nx || zz >= nz || seen[n] || blocked[n]) continue; seen[n] = 1; qu[e++] = n; } }
      return (x, z, r) => { for (let dz = -r; dz <= r; dz += step) for (let dx = -r; dx <= r; dx += step) { if (Math.hypot(dx, dz) > r) continue; const n = cell(x + dx, z + dz); if (n >= 0 && n < seen.length && seen[n]) return true; } return false; };
    }
    for (let zi = 0; zi < Z.length; zi++) {
      const ok = reach(zi);
      for (const q of W.pois.filter((p) => p.zone === zi)) assert(ok(q.x, q.z, q.kind === 'landmark' || q.kind === 'rune' || q.kind === 'node' ? q.r : 1), q.id + ' reachable');
      for (const D of W.dens.filter((d) => d.zone === zi)) assert(ok(D.x, D.z, 2), D.name + ' reachable');
      for (const s of W.secrets.filter((p) => p.zone === zi)) assert(!reach(zi, [{ x: s.x, z: s.z + s.gap * 7, r: 1.4 }])(s.x, s.z, 1), s.id + ' is sealed except for its gap');
      for (const e of W.edgesOf[zi]) { const m = W.passSide(e, zi); assert(ok(m.x, m.z, 1), Z[zi].name + ' reaches its pass ' + e.id); }
      if (zi) assert(ok(Z[zi].cx, Z[zi].cz, 3), Z[zi].name + ' heart (lair) reachable');
    }
  });
  check('open map: every area borders its main-path neighbour, every pass sits in a gap of its wall, all areas connect when gates are open', () => {
    for (let i = 1; i < Z.length; i++) assert(W.edges.some((e) => e.a === i - 1 && e.b === i && e.main), Z[i].name + ' on the main path');
    for (const e of W.edges) { assert.equal(e.warden, Z[e.a].biome !== Z[e.b].biome); for (const o of W.wallSolids) assert(Math.hypot(o.x - e.x, o.z - e.z) > e.w / 2 + 1, e.id + ' gap clear'); }
    const seen = new Set([0]), q = [0]; while (q.length) { const z = q.shift(); for (const e of W.edgesOf[z]) { const n = e.a === z ? e.b : e.a; if (!seen.has(n)) { seen.add(n); q.push(n); } } }
    assert.equal(seen.size, Z.length);
    // with every Warden Gate shut, Base Camp still reaches the rest of the Starting Woodlands
    const wood = new Set([0]), q2 = [0]; while (q2.length) { const z = q2.shift(); for (const e of W.edgesOf[z]) { if (e.warden) continue; const n = e.a === z ? e.b : e.a; if (!wood.has(n)) { wood.add(n); q2.push(n); } } }
    for (let i = 0; i < Z.length; i++) if (Z[i].biome === 0) assert(wood.has(i), Z[i].name + ' reachable without a warden');
    for (let i = 0; i < Z.length; i++) assert.equal(c.zoneAt(Z[i].cx, Z[i].cz), i);
  });
  check('minimap base canvas stays within 2048 px and the world population within 1,700 monsters', () => {
    const w = Math.ceil((W.maxX - W.minX) * W.mmScale), h = Math.ceil((W.maxZ - W.minZ) * W.mmScale);
    assert(w <= 2048 && h <= 2048, w + 'x' + h);
    const pop = Z.reduce((n, zn, i) => n + c.patrolCountFor(i) + (zn.safe ? 0 : W.elitesPerZone), 0) + W.dens.reduce((n, d) => n + d.n + 1, 0);
    assert(pop <= 1700, pop); console.log(JSON.stringify({ minimap: w + 'x' + h, population: pop, pois: ids.length, maxZ: W.maxZ, width: W.maxX - W.minX }));
  });
  check('Auto Hunt alternates between the two dens of an area instead of camping the nearest', () => {
    c.areaReachable = () => true; // the open world's routes live in 39d-open-world.js
    vm.runInContext('const AH = { lastDen: null };\n' + section('// the best open den', 'function autoHuntOn(') + '\nthis.AH = AH; this.autoHuntDen = autoHuntDen;', c);
    const [a, b] = W.dens.filter((D) => D.zone === 5), lvl = Z[5].lvl[1], f = { x: a.x, z: a.z };
    assert.equal(c.autoHuntDen(f, lvl), a, 'standing in a den picks it');
    c.AH.lastDen = a; assert.equal(c.autoHuntDen(f, lvl), b, 'after emptying it, the other den');
    c.AH.lastDen = b; assert.equal(c.autoHuntDen({ x: b.x, z: b.z }, lvl), a);
  });
  console.log(passed + ' world_layout checks passed.');
})().catch((e) => { console.error(e); process.exit(1); });
