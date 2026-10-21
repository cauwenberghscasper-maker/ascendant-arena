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
      await page.locator('#playBtn').click();
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
