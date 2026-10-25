// Smoke test: boots the real game in headless Chromium and checks the basics every change must keep working.
//   node tools/check_smoke.cjs            (serves the repo itself on a free port; needs Playwright + Chromium)
//   PW_CHROMIUM=/path/to/chrome            use a specific Chromium build
//   SMOKE_SHOTS=dir                        also save phone screenshots there
// What it checks (each one broke at least once before):
//  1. the page boots and Play starts a run, with no page errors
//  2. the hero walks, shoots and casts the super
//  3. every 3D view stands on its entity (no model left metres away from its body, name bar or hitbox)
//  4. every monster body, every world boss and the hero end every attack where they started
//     (21 Oct 2026: strike offsets added up each frame, so bosses drifted metres away from their body)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const ROOT = path.join(__dirname, '..');
function loadPlaywright() {
  const tries = ['playwright', 'playwright-core', path.join(ROOT, 'node_modules/playwright'), path.join(__dirname, 'node_modules/playwright-core')];
  for (const t of tries) { try { return require(t); } catch {} }
  try { const g = require('node:child_process').execSync('npm root -g').toString().trim(); return require(path.join(g, '@playwright/mcp/node_modules/playwright')); } catch {}
  console.log('SKIP smoke test: Playwright is not installed (npm i --no-save playwright && npx playwright install chromium)');
  process.exit(process.env.CI ? 1 : 0);
}
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
function serve() {
  const srv = http.createServer((req, res) => {
    let f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(data); });
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

(async () => {
  const { chromium } = loadPlaywright();
  const srv = await serve(), port = srv.address().port;
  const browser = await chromium.launch(Object.assign(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
    { headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] }));
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }), errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('response', (r) => { if (r.status() >= 400 && /\/assets\/fx\//.test(r.url())) errors.push(`missing effect art ${r.status()}: ${r.url().replace(/^.*?\/assets\//, 'assets/')}`); });
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|favicon|realtime|supabase/i.test(m.text())) errors.push('console: ' + m.text()); });
  // an aimed shot, like tapping the ground (deterministic: no target needed, unlike auto-fire)
  const volley = async (n = 4) => { for (let i = 0; i < n; i++) { await page.evaluate((i) => { const p = __game.player; __dbg.Input.mouseFire = [p.x + Math.sin(i) * 4, p.z + Math.cos(i) * 4]; }, i); await page.waitForTimeout(350); } };
  // every mesh in the scene, checked for broken (NaN) vertex coordinates (they flash black or vanish on phones)
  const nanScan = () => page.evaluate(() => { const out = []; __dbg.scene.traverse((o) => { const a = o.geometry && o.geometry.attributes && o.geometry.attributes.position;
    if (a && a.array && a.array.some && a.array.some(Number.isNaN)) { const chain = []; for (let q = o; q; q = q.parent) chain.push(q.name || q.type); out.push(o.geometry.type + ' in ' + chain.join(' < ')); } }); return out; });
  // fills the super, casts it, and scans for broken effects while it plays (in game time: software rendering is slow)
  const castSuper = async (gameSec = 2.2) => {
    const g0 = await page.evaluate(() => { const p = __game.player; p.superCharge = Math.max(p.superCharge || 0, 1e6); __dbg.Input.oneShot.super = true; return __game.time; });
    const bad = new Set(), t0 = Date.now(); let cast = false, g = g0;
    while (g - g0 < gameSec && Date.now() - t0 < 40000) { for (const b of await nanScan()) bad.add(b); const r = await page.evaluate(() => [(__game.player.superCharge || 0) < 1e5, __game.time]); cast = cast || r[0]; g = r[1]; await page.waitForTimeout(100); }
    assert(cast, 'the super did not go off'); assert.deepEqual([...bad], [], 'effects with broken coordinates');
  };
  const step = async (name, fn) => { const t0 = Date.now(); try { const r = await fn(); console.log(`PASS ${name}` + (r ? ' ' + JSON.stringify(r) : '') + ` (${((Date.now() - t0) / 1000).toFixed(1)}s)`); } catch (e) { console.error(`FAIL ${name}: ${e.message}`); throw e; } };
  const shots = process.env.SMOKE_SHOTS; if (shots) fs.mkdirSync(shots, { recursive: true });
  try {
    await step('boots and Play starts a run', async () => {
      await page.goto(`http://127.0.0.1:${port}/?test=100`);
      await page.waitForFunction(() => window.__gameBooted, null, { timeout: 120000 });
      // remember where the first geometry with broken (NaN) coordinates came from, to name it if it shows up
      await page.evaluate(() => { const B = __THREE.BufferGeometry.prototype, o = B.computeBoundingSphere, sa = B.setAttribute; B.setAttribute = function (n, a) { if (n === 'position' && a && a.array && a.array.some && a.array.some(Number.isNaN)) this.userData.made = 'made with NaN at ' + new Error().stack.split('\n').slice(2, 7).join(' < '); return sa.call(this, n, a); }; B.computeBoundingSphere = function () { o.call(this); if (this.boundingSphere && Number.isNaN(this.boundingSphere.radius) && !window.__nanAt) window.__nanAt = this.type + ' ' + (this.userData.made || new Error().stack.split('\n').slice(2, 7).join(' < ')); }; });
      // with Ascendant Lanes as the main mode, Play opens Lanes for players past the tutorial; the world has its own button
      const wb = page.locator('#worldBtn'); if (await wb.isVisible()) await wb.click(); else await page.locator('#playBtn').click();
      await page.waitForFunction(() => window.__game && __game.started && __game.player && __game.player.alive, null, { timeout: 60000 });
      await page.waitForTimeout(1500);
      assert.deepEqual(errors, []);
      if (shots) await page.screenshot({ path: path.join(shots, 'smoke-start.png') });
    });

    await step('hero walks', async () => {
      const a = await page.evaluate(() => ({ x: __game.player.x, z: __game.player.z }));
      await page.keyboard.down('w'); await page.waitForTimeout(2000); await page.keyboard.up('w'); await page.waitForTimeout(200);
      const b = await page.evaluate(() => ({ x: __game.player.x, z: __game.player.z }));
      const d = Math.hypot(b.x - a.x, b.z - a.z); assert(d > 0.4, 'hero moved only ' + d.toFixed(2) + ' m'); return { moved: +d.toFixed(1) };
    });

    await step('hero shoots and casts the super', async () => {
      const t0 = await page.evaluate(() => __game.player.lastAttack || -1);
      await volley(4);
      const t1 = await page.evaluate(() => __game.player.lastAttack || -1);
      assert(t1 > t0, 'no attack fired');
      await castSuper();
      assert.deepEqual(errors, []);
    });

    await step('every 3D view stands on its entity', async () => {
      const bad = await page.evaluate(() => {
        const out = [];
        for (const [e, v] of __dbg.views) {
          if (!e || e.alive === false || !v.root || !v.root.visible || e.x == null) continue;
          const d = Math.hypot(v.root.position.x - e.x, v.root.position.z - e.z);
          if (d > 1.5) out.push(`${e.kind}:${e.type || e.cls || ''} ${d.toFixed(2)} m`);
        }
        return { n: __dbg.views.size, out };
      });
      assert.deepEqual(bad.out, [], 'views away from their entity'); return { views: bad.n };
    });

    await step('monster bodies end every attack where they started', async () => {
      const r = await page.evaluate(async () => {
        const T = __THREE, { AssetSlots, enemyBase, CFG } = __dbg, box = new T.Box3(), c = new T.Vector3();
        const types = [...new Set(Object.keys(CFG.enemies).map(enemyBase))].filter((b) => __assets.has('enemy.' + b))
          .map((b) => Object.keys(CFG.enemies).find((t) => enemyBase(t) === b));
        const KINDS = ['slam', 'pounce', 'cleave', 'beam', 'breath', 'nova', 'burrow', null];
        const centre = (v) => { v.root.updateMatrixWorld(true); const pivot = v.root.children[1]; box.setFromObject(pivot); box.getCenter(c); return { x: c.x, z: c.z }; };
        const run = (v, e, frames, each) => { for (let i = 0; i < frames; i++) { e.t += 1 / 60; if (each) each(i); v.update(e, 1 / 60, e.t); } };
        const out = [], bad = [];
        for (const type of types) {
          const v = AssetSlots.create('enemy', { type, elite: true }), e = { kind: 'enemy', type, x: 0, z: 0, facing: 0, moveAmt: 0, alive: true, lvl: 50, zone: 3, r: 1, elite: true, attackAnim: 0, windT: 0, t: 0 };
          const t0 = performance.now();
          while (!v.root.children[1].children.length && performance.now() - t0 < 30000) { run(v, e, 1); await new Promise((ok) => setTimeout(ok, 50)); }
          if (!v.root.children[1].children.length) { bad.push(type + ': model did not load'); v.dispose(); continue; }
          run(v, e, 40); const a = centre(v); let worst = 0;
          for (const k of KINDS) {
            e.windK = k; e.windMax = 0.4; e.windT = k ? 0.4 : 0;
            run(v, e, 24, () => { e.windT = Math.max(0, e.windT - 1 / 60); });
            e.attackAnim = 1; run(v, e, 30, () => { e.attackAnim = Math.max(0, e.attackAnim - 3 / 60); const p = centre(v); worst = Math.max(worst, Math.hypot(p.x - a.x, p.z - a.z)); });
          }
          e.windK = null; run(v, e, 40); const b = centre(v), drift = Math.hypot(b.x - a.x, b.z - a.z);
          out.push(type + ' ' + drift.toFixed(2) + '/' + worst.toFixed(2));
          if (drift > 0.25) bad.push(`${type} ended ${drift.toFixed(2)} m away from where it started`);
          if (worst > 2.5) bad.push(`${type} moved ${worst.toFixed(2)} m during a strike`);
          v.dispose();
        }
        return { tested: out.length, bad };
      });
      assert(r.tested >= 10, 'only ' + r.tested + ' monster bodies tested'); assert.deepEqual(r.bad, []); return { bodies: r.tested };
    });

    await step('every enemy and boss has articulated animation states', async () => {
      const result = await page.evaluate(async () => {
        const { createEnemyMotion, ENEMY_RIGS } = await import('./assets/data/enemy-motion.js');
        const T = __THREE, bad = [], rows = [];
        for (const id of Object.keys(ENEMY_RIGS)) {
          __assets.request(id); const start = performance.now();
          while (__assets.status(id) !== 'ready' && performance.now() - start < 30000) await new Promise(ok => setTimeout(ok, 50));
          const a = __assets.instance(id), b = __assets.instance(id);
          if (!a || !b) { bad.push(id + ': did not load'); continue; }
          let mesh, other; a.traverse(o => { if (o.isSkinnedMesh) mesh = o; }); b.traverse(o => { if (o.isSkinnedMesh) other = o; });
          if (!mesh || !other) { bad.push(id + ': no limb rig'); __assets.disposeInstance(a); __assets.disposeInstance(b); continue; }
          if (mesh.geometry !== other.geometry || mesh.skeleton === other.skeleton || mesh.skeleton.bones[1] === other.skeleton.bones[1]) bad.push(id + ': instance ownership');
          const g = mesh.geometry, w = g.attributes.skinWeight, j = g.attributes.skinIndex, v = new T.Vector3(), rest = [];
          a.updateMatrixWorld(true); mesh.skeleton.update();
          for (let i = 0; i < w.count; i++) {
            const sum = w.getX(i) + w.getY(i) + w.getZ(i) + w.getW(i);
            if (!Number.isFinite(sum) || Math.abs(sum - 1) > 1e-5) { bad.push(id + ': invalid weights'); break; }
            mesh.getVertexPosition(i, v); rest.push(v.clone());
            const p = new T.Vector3().fromBufferAttribute(g.attributes.position, i);
            if (p.distanceTo(v) > .0001) { bad.push(id + ': bind pose changed'); break; }
          }
          const motion = createEnemyMotion(a), state = { alive: true, moveAmt: 1 };
          if (motion.clips.length < 17) bad.push(id + ': animation states missing');
          let moved = 0, legMoved = 0;
          for (const kind of ['slam', 'swing', 'recoil', 'pulse', 'lunge']) {
            motion.update(state, 1 / 60, 0, Math.PI / 2, kind, .9, 0);
            a.updateMatrixWorld(true); mesh.skeleton.update();
            for (let i = 0; i < rest.length; i++) {
              mesh.getVertexPosition(i, v); const d = v.distanceTo(rest[i]);
              if (![v.x, v.y, v.z].every(Number.isFinite)) { bad.push(id + ': invalid animated position'); break; }
              if (w.getX(i) === 1 && j.getX(i) === 0 && d > .0001) { bad.push(id + ': torso anchor moved'); break; }
              moved = Math.max(moved, d);
              if(id==='enemy.wolf'){
                const box=g.boundingBox,h=box.max.y-box.min.y,cx=(box.min.x+box.max.x)/2;
                if((rest[i].y-box.min.y)/h<.10&&Math.abs(rest[i].x-cx)/h<.19&&d/h>.03)bad.push(id+': forearm pulled a planted foot');
              }
            }
          }
          for (let i = 0; i < 30; i++) motion.update(state, 1 / 60, 0, Math.PI / 2, 'lunge', 0, 0);
          legMoved = Math.max(...mesh.skeleton.bones.filter(o => /arm|elbow|leg|wing|neck|tendril/.test(o.name)).map(o => Math.abs(o.rotation.x) + Math.abs(o.rotation.y) + Math.abs(o.rotation.z)),0);
          if (moved < .02 || legMoved < .01) bad.push(id + ': limbs did not move');
          if (other.skeleton.bones.some(o => o.rotation.x || o.rotation.y || o.rotation.z)) bad.push(id + ': changed another instance');
          state.moveAmt = 0;
          for (let i = 0; i < 120; i++) motion.update(state, 1 / 60, 0, 0, 'slam', 0, 0);
          const pose = mesh.skeleton.bones.map(o => o.quaternion.toArray());
          for (let i = 0; i < 50; i++) { motion.update(state, 1 / 60, 0, 0, 'slam', 1, 0); motion.update(state, 1 / 60, 0, 0, 'slam', 0, 1); motion.update(state, 1 / 60, 0, 0, 'slam', 0, 0); }
          for (let i = 0; i < 120; i++) motion.update(state, 1 / 60, 0, 0, 'slam', 0, 0);
          if (mesh.skeleton.bones.some((o, i) => o.quaternion.toArray().some((q, k) => Math.abs(q - pose[i][k]) > 1e-6))) bad.push(id + ': pose accumulated');
          rows.push({ id, bones: mesh.skeleton.bones.length, vertices: w.count, maxMotion: +moved.toFixed(2) });
          motion.dispose(); __assets.disposeInstance(a); __assets.disposeInstance(b);
        }
        return { rows, bad };
      });
      assert.deepEqual(result.bad, []); assert.equal(result.rows.length, 32); return { bodies: result.rows.length };
    });

    await step('Panther flurry alternates visible arms on all three contacts', async () => {
      const r = await page.evaluate(async () => {
        const { createEnemyMotion } = await import('./assets/data/enemy-motion.js');
        const a = __assets.instance('enemy.wolf'), m = createEnemyMotion(a), e = { alive:true, moveAmt:0, windT:.55 };
        const arm = a.getObjectByName('enemy_armL'), elbow = a.getObjectByName('enemy_elbowL'), poses = [], states = [];
        m.update(e, 1/60, 0, 0, 'swing', .95, 0, 'flurry', {n:3,step:.32});
        const wind = arm.quaternion.clone(); e.windT = 0;
        for(let i=0;i<60;i++) {
          m.update(e, .016, i*.016, 0, 'swing', 0, i===0?1:0, 'flurry', {n:3,step:.32});
          if(i===0||i===20||i===40){poses.push(arm.quaternion.toArray());states.push(m.state.name);}
        }
        let mesh; a.traverse(o=>{if(o.isSkinnedMesh)mesh=o;});
        const weights=mesh.geometry.attributes.skinWeight,indices=mesh.geometry.attributes.skinIndex;
        const armIds=mesh.skeleton.bones.map((b,i)=>/arm|elbow/.test(b.name)?i:-1),counts={L:0,R:0};
        for(let i=0;i<weights.count;i++)for(let k=0;k<4;k++){const j=indices.array[i*4+k];if(armIds.includes(j)&&weights.array[i*4+k]>.25)counts[mesh.skeleton.bones[j].name.endsWith('L')?'L':'R']++;}
        const difference=wind.angleTo(new __THREE.Quaternion().fromArray(poses[0]));
        m.dispose();__assets.disposeInstance(a);return{states,counts,difference,alternates:poses[0].some((x,k)=>Math.abs(x-poses[1][k])>.1),elbow:!!elbow};
      });
      assert.deepEqual(r.states,['strike_swing','strike_swing_alt','strike_swing']);
      assert(r.alternates&&r.elbow&&r.difference>.2&&r.counts.L>100&&r.counts.R>100);return r;
    });

    await step('all heroes and townsfolk play authored locomotion, attacks, hurt and death', async () => {
      const r = await page.evaluate(async () => {
        const { createKayKitMotion } = await import('./assets/data/kaykit-motion.js');
        const ids=Object.keys(__manifest).filter(id=>/^(hero|npc)\./.test(id)),bad=[];
        for(const id of ids){
          __assets.request(id);const t0=performance.now();while(__assets.status(id)!=='ready'&&performance.now()-t0<30000)await new Promise(ok=>setTimeout(ok,50));
          const entry=__assets.entries.get(id),a=__assets.instance(id);if(!a){bad.push(id+': load');continue;}
          const clips=entry.model.animations,def=__manifest[id];
          for(const name of ['Idle','Running_A','Walking_Backwards','Running_Strafe_Left','Running_Strafe_Right',def.attack,'Hit_A','Death_A','Dodge_Forward'])if(!clips.some(c=>c.name===name))bad.push(id+': missing '+name);
          const m=createKayKitMotion(__THREE,a,clips,def),bones=[];a.traverse(o=>{if(o.isBone)bones.push(o);});
          const snapshot=()=>bones.map(b=>b.quaternion.clone());
          const advance=e=>{for(let i=0;i<8;i++)m.update(e,1/60);return snapshot();};
          const idle=advance({alive:true,moveAmt:0,x:0,z:0,lastAttack:-1,lastHurt:-1}),run=advance({alive:true,moveAmt:1,x:1,z:0,lastAttack:-1,lastHurt:-1});
          const attack=advance({alive:true,moveAmt:0,x:1,z:0,lastAttack:1,lastHurt:-1});
          for(let i=0;i<70;i++)m.update({alive:true,moveAmt:0,x:1,z:0,lastAttack:1,lastHurt:-1},1/60);
          const hurt=advance({alive:true,moveAmt:0,x:1,z:0,lastAttack:1,lastHurt:2}),dead=advance({alive:false});
          for(const[name,pose]of [['run',run],['attack',attack],['hurt',hurt],['death',dead]])if(!pose.some((q,i)=>q.angleTo(idle[i])>.02))bad.push(id+': static '+name);
          m.dispose();__assets.disposeInstance(a);
        }
        return{heroes:ids.filter(id=>id.startsWith('hero.')).length,npcs:ids.filter(id=>id.startsWith('npc.')).length,bad};
      });
      assert.deepEqual(r.bad,[]);assert.equal(r.heroes,43);assert.equal(r.npcs,7);return r;
    });

    await step('every monster species fights in its own art', async () => {
      const r = await page.evaluate(async () => {
        const M = __dbg.MobFX, idx = M.index(), pl = __game.player, bad = [];
        const sp = Object.keys(__dbg.CFG.enemies).filter((t) => M.has(t));
        for (const t of sp) {
          for (const mode of ['burst', 'ring', 'rise', 'pull', 'trail', 'spray', 'line']) M.bits(t, pl.x + 3, 1, pl.z, 2, mode, { a: 1, r: 2, t: 0.5, len: 4 });
          if (!M.hit(t, pl.x + 3, 1, pl.z, 2)) bad.push(t + ': no burst');
        }
        for (const t of idx.ammo) if (!M.ammo({ mt: t, x: pl.x + 3, y: 1, z: pl.z, r: 0.4, owner: 1 }, true)) bad.push(t + ': no projectile');
        await new Promise((ok) => setTimeout(ok, 1500));
        return { species: sp.length, ammo: idx.ammo.length, bits: M.count(), bad };
      });
      assert.deepEqual(r.bad, []); assert(r.species >= 58, 'only ' + r.species + ' species'); assert(r.bits > 0, 'no particles alive');
      assert.deepEqual(await nanScan(), [], 'effects with broken coordinates'); assert.deepEqual(errors, []);
      return r;
    });

    await step('world bosses end every cast where they started', async () => {
      const r = await page.evaluate(async () => {
        const T = __THREE, { AssetSlots } = __dbg, box = new T.Box3(), c = new T.Vector3(), bad = [];
        let n = 0;
        const Z = __dbg.CFG.world.zones, zones = [...new Set(Z.map((z) => z.biome))].map((bi) => Z.findIndex((z) => z.biome === bi));
        for (const zone of zones) {
          const v = AssetSlots.create('boss', { zone }), b = { kind: 'boss', zone, x: 0, z: 0, facing: 0, moveAmt: 0, alive: true, spawnT: -100, phase: 1, attackAnim: 0, t: 0 };
          const run = (f, each) => { for (let i = 0; i < f; i++) { b.t += 1 / 60; if (each) each(); v.update(b, 1 / 60, b.t); } };
          const centre = () => { v.root.updateMatrixWorld(true); box.setFromObject(v.root.children[3]); box.getCenter(c); return { x: c.x, z: c.z }; };
          const t0 = performance.now();
          while (!v.root.children[3].children.length && performance.now() - t0 < 45000) { run(1); await new Promise((ok) => setTimeout(ok, 50)); }
          if (!v.root.children[3].children.length) { bad.push('zone ' + zone + ': boss model did not load'); v.dispose(); continue; }
          run(60); const a = centre();
          for (const k of ['plates', 'sweep', 'fan', 'slam']) { b.castK = k; b.castMax = 1.6; b.castT = 1.6; run(100, () => { b.castT = Math.max(0, b.castT - 1 / 60); b.attackAnim = Math.max(0, b.attackAnim - 0.02); }); b.attackAnim = 1; }
          b.castT = 0; b.attackAnim = 0; run(90); const e = centre(), d = Math.hypot(e.x - a.x, e.z - a.z);
          if (d > 0.4) bad.push(`zone ${zone} boss ended ${d.toFixed(2)} m away`); n++; v.dispose();
        }
        return { n, bad };
      });
      assert(r.n >= 1, 'no world boss tested'); assert.deepEqual(r.bad, []); return { bosses: r.n };
    });

    await step('the hero ends its attacks where it started', async () => {
      // fire a few volleys and a super, standing still, then compare the body's place in the hero's own frame
      const before = await page.evaluate(() => { const T = __THREE, v = __dbg.views.get(__game.player), box = new T.Box3(), c = new T.Vector3(); v.root.updateMatrixWorld(true); box.setFromObject(v.root); box.getCenter(c); v.root.worldToLocal(c); return { x: c.x, z: c.z }; });
      await volley(5);
      await castSuper(2.5);
      const after = await page.evaluate(() => { const T = __THREE, v = __dbg.views.get(__game.player), box = new T.Box3(), c = new T.Vector3(); v.root.updateMatrixWorld(true); box.setFromObject(v.root); box.getCenter(c); v.root.worldToLocal(c); return { x: c.x, z: c.z }; });
      const d = Math.hypot(after.x - before.x, after.z - before.z);
      assert(d < 0.4, `hero body ended ${d.toFixed(2)} m away from where it started`); assert.deepEqual(errors, []); return { drift: +d.toFixed(2) };
    });

    await step('every menu page and tab opens without errors or sideways scrolling', async () => {
      // a mid-game hero, so most pages are unlocked
      await page.evaluate(() => { for (let i = 0; i < 12 && __game.profile.level < 80; i++) __sim.addXp(1e9); __dbg.refresh(); });
      await page.waitForTimeout(500);
      const r = await page.evaluate(async () => {
        const wait = (ms) => new Promise((ok) => setTimeout(ok, ms)), bad = [], seen = [];
        const wide = (where) => { const P = document.getElementById('panel'), W = innerWidth;
          if (document.documentElement.scrollWidth > W + 1) bad.push(where + ': page scrolls sideways');
          if (P && P.offsetParent && P.getBoundingClientRect().right > W + 1) bad.push(where + ': panel wider than the screen'); };
        const close = () => { try { if (__dbg.UI.close) __dbg.UI.close(); } catch (e) { bad.push('close: ' + e.message); } };
        for (const act of ['mHero', 'mSmith', 'mGear', 'mJournal', 'mDelve']) {
          try { __dbg.openMenu(); await wait(150); const b = document.querySelector(`#panel [data-act="${act}"]`); if (!b) { bad.push(act + ': no hub tile'); continue; }
            b.click(); await wait(350); wide(act); seen.push(act);
            const tabs = [...document.querySelectorAll('#panel .tabs > *')].slice(0, 10).map((t) => t.textContent.trim());
            for (const name of tabs) { const t = [...document.querySelectorAll('#panel .tabs > *')].find((x) => x.textContent.trim() === name); if (!t) continue; t.click(); await wait(250); wide(act + ' › ' + name); seen.push(act + '›' + name); }
          } catch (e) { bad.push(act + ': ' + e.message); }
          close(); await wait(100);
        }
        for (const [name, fn] of [['settings', () => __dbg.openSettings()], ['map', () => __dbg.openWaypoints()]]) { try { fn(); await wait(300); wide(name); seen.push(name); } catch (e) { bad.push(name + ': ' + e.message); } close(); await wait(100); }
        return { pages: seen.length, bad, level: __game.profile.level };
      });
      assert.deepEqual(r.bad, []); assert(r.pages >= 8, 'only ' + r.pages + ' pages opened'); assert.deepEqual(errors, []); return { pages: r.pages, level: r.level };
    });

    await step('an Ascendant Lanes match with bots runs, levels the hero and returns to the world', async () => {
      const r = await page.evaluate(() => {
        const pl = __game.player, back = { x: pl.x, z: pl.z }; if (!__lanes.startLanes({ size: 2 })) return { started: false };
        const S = __game.lanes; for (let i = 0; i < 60 * 45; i++) { pl.intent.mz = S.myTeam === 'blue' ? 0.4 : -0.4; pl.intent.autoFire = true; __dbg.simStep(1 / 60); }
        const out = { started: true, fighters: S.fighters.length, minions: S.minions.filter((m) => m.alive).length, waves: S.waveN, lvl: pl.lnLvl, phase: S.phase, mode: __game.mode };
        __lanes.lanesEnd(S.myTeam, 'core'); for (let i = 0; i < 200; i++) __dbg.simStep(1 / 60); __lanes.leaveLanes();
        out.after = [__game.mode, pl.team, Math.round(pl.x - back.x), Math.round(pl.z - back.z), !!__game.lanes]; return out;
      });
      await page.waitForTimeout(1500);
      assert(r.started, 'the match did not start'); assert.equal(r.fighters, 4); assert(r.waves >= 2 && r.lvl >= 2, 'waves came and the hero levelled: ' + JSON.stringify(r));
      assert.deepEqual(r.after, ['hub', 'ally', 0, 0, false]); assert.deepEqual(errors, []);
      return { waves: r.waves, lvl: r.lvl };
    });

    if (shots) await page.screenshot({ path: path.join(shots, 'smoke-end.png') });
    assert.deepEqual(errors, []);
    console.log('PASS smoke test');
  } catch (e) {
    if (errors.length) console.error(errors.slice(0, 8).join('\n'));
    const nan = await page.evaluate(() => window.__nanAt).catch(() => null); if (nan) console.error('first NaN geometry: ' + nan);
    const who = await page.evaluate(() => { const out = []; __dbg.scene.traverse((o) => { const g = o.geometry, bs = g && g.boundingSphere; if (bs && Number.isNaN(bs.radius)) { const chain = []; for (let q = o; q; q = q.parent) chain.push(q.name || q.type); out.push(chain.join(' < ') + ' mat=' + (o.material && o.material.type) + ' color=' + (o.material && o.material.color && o.material.color.getHexString()) + ' map=' + !!(o.material && o.material.map) + ' n=' + g.attributes.position.count); } }); return out.slice(0, 5); }).catch(() => []);
    if (who.length) console.error('NaN meshes: ' + who.join(' || '));
    process.exitCode = 1;
  } finally { await browser.close(); srv.close(); }
})();
