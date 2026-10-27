// Screenshots of every screen that shows item icons (bag, resources, Forge craft tab, item inspect, chest reel), for
// before/after reviews of the icon art. Serves the repo itself.
//   node tools/shots_item_icons.cjs OUT_DIR [prefix] [port] [WxH]
// Run it through the browser lock on the shared machine: flock /home/claude/.browser.lock timeout 300 node ...
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const [, , outDir = 'shots', prefix = 'shot', port0 = '0', size = '390x844'] = process.argv;
const [W, H] = size.split('x').map(Number);
function loadPlaywright() {
  for (const t of ['playwright', 'playwright-core', '/home/claude/node_modules/playwright', path.join(ROOT, 'node_modules/playwright')]) { try { return require(t); } catch {} }
  console.log('SKIP: Playwright is not installed'); process.exit(0);
}
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
const srv = http.createServer((req, res) => {
  let f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(data); });
});
(async () => {
  await new Promise((ok) => srv.listen(+port0, '127.0.0.1', ok));
  const port = srv.address().port, { chromium } = loadPlaywright();
  fs.mkdirSync(outDir, { recursive: true });
  const exe = [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'].find((f) => f && fs.existsSync(f));
  const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 }), errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|favicon|realtime|supabase/i.test(m.text())) errors.push('console: ' + m.text()); });
  const missing = new Set(); page.on('response', (r) => { if (r.status() >= 400 && /\/assets\/ui\//.test(r.url())) missing.add(r.url().replace(/^.*?\/assets\//, 'assets/')); });
  const shot = async (name) => { await page.waitForTimeout(900); await page.screenshot({ path: path.join(outDir, `${prefix}-${name}.png`) }); console.log('shot', name); };
  try {
    await page.goto(`http://127.0.0.1:${port}/?test=100`);
    await page.waitForFunction(() => window.__gameBooted, null, { timeout: 120000 });
    const wb = page.locator('#worldBtn'); if (await wb.isVisible()) await wb.click(); else await page.locator('#playBtn').click();
    await page.waitForFunction(() => window.__game && __game.started && __game.player, null, { timeout: 60000 });
    // a late-game bag: level 175 (every biome and dungeon open), every material, a few chests, set pieces, dungeon treasures
    await page.evaluate(() => {
      const p = __game.profile, S = __sim, D = __dbg;
      for (let i = 0; i < 200 && p.level < 175; i++) D.TestTools.levelUp();
      const c = D.craft.craftState(p); for (const id of Object.keys(S.CFG.craft.biomes.reduce((o, b) => (o[b.ore] = o[b.part] = o[b.core] = 1, o), {}))) c.mats[id] = 240;
      c.mats[S.CFG.craft.titan.id] = 7; c.mats[S.CFG.craft.rune.id] = 55; for (const d of S.CFG.delve.dungeons) c.mats[d.gem.id] = 30;
      p.bag.length = 0;
      const R = ['rare', 'epic', 'legendary', 'mythic', 'ancient', 'divine'];
      for (const d of S.CFG.delve.dungeons) for (const g of [...S.CFG.delve.gear[d.id].found, ...S.CFG.delve.gear[d.id].forged]) {
        const it = S.makeItem(g.slot, R[d.biome], p.level, g.name, { aff: Object.assign({}, g.aff) }); it.duq = g.id; it.dq = d.id; p.bag.push(it); }
      for (const s of S.CFG.gear.slots) p.bag.push(S.makeItem(s, 'epic', p.level));
      for (const k of ['hunter', 'treasure', 'boss', 'geode', 'frost']) if (S.CFG.cases[k]) S.addCase(k, { l: p.level, src: 'test' });
      __game.dirty = true;
    });
    await page.evaluate(() => __dbg.heroTab('Gear')); await shot('bag');
    await page.evaluate(() => { const el = document.getElementById('invSecRes'); if (el) el.scrollIntoView({ block: 'start' }); }); await shot('resources');
    await page.evaluate(() => { const el = document.querySelector('#invSecRes .rgrid:last-of-type') || document.getElementById('invSecRes'); const h = [...document.querySelectorAll('#invSecRes h4')]; (h[h.length - 3] || el).scrollIntoView({ block: 'start' }); }); await shot('resources2');
    await page.evaluate(() => { const it = __game.profile.bag.find((b) => b.duq === 'motherspearl') || __game.profile.bag[0]; __dbg.UI && 0; window.__inspectId = it.id; });
    await page.evaluate(() => { const b = document.querySelector(`[data-act="inspect"][data-id="${window.__inspectId}"]`); if (b) b.click(); }); await shot('inspect');
    await page.evaluate(() => { const b = document.querySelector('[data-act="inspectClose"]'); if (b) b.click(); });
    await page.evaluate(() => { __dbg.UI.craftBiome = 4; __dbg.openSmith('Craft'); }); await shot('craft');
    await page.evaluate(() => { const el = document.querySelector('.craftSet:nth-of-type(2)') || [...document.querySelectorAll('.craftSet')][1]; if (el) el.scrollIntoView({ block: 'start' }); }); await shot('craft-forge');
    await page.evaluate(() => __dbg.openCases('treasure')); await shot('chests');
    await page.evaluate(() => { const b = document.querySelector('[data-act="caseOpen"]'); if (b) b.click(); }); await page.waitForTimeout(6000); await shot('reel');
  } catch (e) { errors.push('script: ' + e.message); }
  if (missing.size) console.log('missing ui art:', [...missing].join(', '));
  if (errors.length) console.log(errors.join('\n'));
  await browser.close(); srv.close();
  process.exit(errors.length ? 1 : 0);
})();
