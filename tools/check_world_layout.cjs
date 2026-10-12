// World v10 layout: dens, points of interest, secrets, minimap size and population, from the built index.html
// plus the pure POI builders in world-art.js (their colliders are what the hub grid receives).
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return html.slice(i, j); }
let passed = 0;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
const c = { Math, console, LOCAL_PREVIEW: false, TEST_MODE: false, nextId: 1, G: { profile: { level: 1, worldTier: 0 }, player: { alive: false, x: 0, z: -49 }, enemies: [], ents: new Map(), time: 0, obstacles: null }, ev() {} };
vm.createContext(c);
for (const f of ['test-mode', 'loot-collection', 'prestige', 'companions']) vm.runInContext(fs.readFileSync(path.join(root, 'assets/data', f + '.js'), 'utf8').replace(/export /g, ''), c);
vm.runInContext(section('const CFG = {', '// 2. UTIL') + section('const clamp =', '// 3. DATA') + section('class Grid {', '// --- entities') +
  section('function patrolCountFor(', 'function rewardEnemyKill(') + '\nthis.config = CFG;', c);
const W = c.config.world, Z = W.zones;
(async () => {
  const art = await import('data:text/javascript,' + encodeURIComponent(fs.readFileSync(path.join(root, 'assets/art/world-art.js'), 'utf8')));
  check('two dens per combat area, on opposite flanks and more than 60 m apart', () => {
    for (let zi = 0; zi < Z.length; zi++) {
      const d = W.dens.filter((D) => D.zone === zi);
      if (Z[zi].safe) { assert.equal(d.length, 0); continue; }
      assert.equal(d.length, 2, Z[zi].name); assert(Math.hypot(d[0].x - d[1].x, d[0].z - d[1].z) > 60); assert(Math.sign(d[0].x) === -Math.sign(d[1].x));
      for (const D of d) { assert(D.z - D.r > Z[zi].z0 + 3 && D.z + D.r < Z[zi].z1 - 3); assert(Math.abs(D.x) + D.r < W.maxX); }
    }
  });
  const ids = W.pois.map((q) => q.id);
  check('POI ids are unique and stable (save keys)', () => {
    assert.equal(new Set(ids).size, ids.length); assert.equal(ids.length, 159);
    for (const id of ['a00:landmark:0', 'a01:secret:0', 'a03:dungeon:0', 'a09:secret:1', 'a29:secret:1', 'a29:dungeon:0']) assert(ids.includes(id), id);
    for (const id of ['a00:dungeon:0', 'a02:dungeon:0', 'a01:secret:1']) assert(!ids.includes(id), id);
    for (const q of W.pois) assert(new RegExp(`^a${String(q.zone).padStart(2, '0')}:${q.kind}:\\d$`).test(q.id), q.id);
    const dg = W.pois.filter((q) => q.kind === 'dungeon'); assert.equal(dg.length, Z.length - 3);
    for (const q of dg) { assert.equal(q.lvl, Z[q.zone].lvl[1]); assert(Math.abs(Math.abs(q.x) - W.maxX * 0.8) < 2); }
    assert.equal(W.secrets.length, 42); assert(W.secrets.every((q) => q.hidden && Math.abs(q.x) > W.maxX * 0.85));
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
  for (let zi = 1; zi < Z.length; zi++) solids.push({ x: -3.2, z: Z[zi].z0, r: 0.6 }, { x: 3.2, z: Z[zi].z0, r: 0.6 });
  for (const w of W.waypoints) solids.push({ x: w.x, z: w.z, r: 0.9 });
  check('every POI and secret has a clear spot: in bounds, off the road and gates, away from dens, lairs, shrines and each other', () => {
    for (const q of W.pois) {
      const zn = Z[q.zone];
      assert(q.z - q.r > zn.z0 + 3 && q.z + q.r < zn.z1 - 3, q.id); assert(Math.abs(q.x) - q.r > 3, q.id);
      for (const h of q.hits) assert(Math.abs(h.x) + h.r <= W.maxX - 0.4 && h.z - h.r > zn.z0 && h.z + h.r < zn.z1, q.id + ' collider in bounds');
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
      const zn = Z[zi], z0 = Math.max(zn.z0, W.minZ), z1 = Math.min(zn.z1, W.maxZ), nx = Math.floor((W.maxX - W.minX) / step) + 1, nz = Math.floor((z1 - z0) / step) + 1;
      const blocked = new Uint8Array(nx * nz), seen = new Uint8Array(nx * nz), qu = new Int32Array(nx * nz);
      for (const o of solids.concat(extra || [])) {
        if (o.z + o.r + pad < z0 || o.z - o.r - pad > z1) continue; const r = o.r + pad;
        for (let z = Math.max(0, Math.floor((o.z - r - z0) / step)); z <= Math.min(nz - 1, Math.ceil((o.z + r - z0) / step)); z++)
          for (let x = Math.max(0, Math.floor((o.x - r - W.minX) / step)); x <= Math.min(nx - 1, Math.ceil((o.x + r - W.minX) / step)); x++)
            if (Math.hypot(W.minX + x * step - o.x, z0 + z * step - o.z) < r) blocked[z * nx + x] = 1;
      }
      const cell = (x, z) => Math.round((z - z0) / step) * nx + Math.round((x - W.minX) / step);
      const start = zi === 0 ? cell(W.spawn.x, W.spawn.z) : cell(0, zn.z0 + 2); assert(!blocked[start], 'gate start open');
      let b = 0, e = 0; qu[e++] = start; seen[start] = 1;
      while (b < e) { const i = qu[b++], x = i % nx, z = (i / nx) | 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, zz = z + dz, n = zz * nx + xx; if (xx < 0 || zz < 0 || xx >= nx || zz >= nz || seen[n] || blocked[n]) continue; seen[n] = 1; qu[e++] = n; } }
      return (x, z, r) => { for (let dz = -r; dz <= r; dz += step) for (let dx = -r; dx <= r; dx += step) { if (Math.hypot(dx, dz) > r) continue; const n = cell(x + dx, z + dz); if (n >= 0 && n < seen.length && seen[n]) return true; } return false; };
    }
    for (let zi = 0; zi < Z.length; zi++) {
      const ok = reach(zi);
      for (const q of W.pois.filter((p) => p.zone === zi)) assert(ok(q.x, q.z, q.kind === 'landmark' ? q.r : 1), q.id + ' reachable');
      for (const D of W.dens.filter((d) => d.zone === zi)) assert(ok(D.x, D.z, 2), D.name + ' reachable');
      for (const s of W.secrets.filter((p) => p.zone === zi)) assert(!reach(zi, [{ x: s.x, z: s.z + s.gap * 7, r: 1.4 }])(s.x, s.z, 1), s.id + ' is sealed except for its gap');
    }
  });
  check('minimap base canvas stays within 2048 px and the world population within 1,700 monsters', () => {
    const w = Math.ceil((W.maxX - W.minX) * W.mmScale), h = Math.ceil((W.maxZ - W.minZ) * W.mmScale);
    assert(w <= 2048 && h <= 2048, w + 'x' + h);
    const pop = Z.reduce((n, zn, i) => n + c.patrolCountFor(i) + (zn.safe ? 0 : W.elitesPerZone), 0) + W.dens.reduce((n, d) => n + d.n + 1, 0);
    assert(pop <= 1700, pop); console.log(JSON.stringify({ minimap: w + 'x' + h, population: pop, pois: ids.length, maxZ: W.maxZ, width: W.maxX - W.minX }));
  });
  check('Auto Hunt alternates between the two dens of an area instead of camping the nearest', () => {
    vm.runInContext('const AH = { lastDen: null };\n' + section('// the best open den', 'function autoHuntOn(') + '\nthis.AH = AH; this.autoHuntDen = autoHuntDen;', c);
    const [a, b] = W.dens.filter((D) => D.zone === 5), lvl = Z[5].lvl[1], f = { x: a.x, z: a.z };
    assert.equal(c.autoHuntDen(f, lvl), a, 'standing in a den picks it');
    c.AH.lastDen = a; assert.equal(c.autoHuntDen(f, lvl), b, 'after emptying it, the other den');
    c.AH.lastDen = b; assert.equal(c.autoHuntDen({ x: b.x, z: b.z }, lvl), a);
  });
  console.log(passed + ' world_layout checks passed.');
})().catch((e) => { console.error(e); process.exit(1); });
