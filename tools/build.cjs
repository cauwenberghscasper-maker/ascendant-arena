// Builds the shipped index.html from src/: each `@@include <path>` line in src/index.html is replaced
// by that file, and `dir/*.ext` by every matching file in name order (the number prefixes set the order).
//   node tools/build.cjs          write index.html
//   node tools/build.cjs --check  fail if index.html is out of date with src/
//   node tools/build.cjs --app    also fill www/ (the Capacitor web folder) with only what the game loads
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), src = path.join(root, 'src'), out = path.join(root, 'index.html');

function include(rel) {
  const dir = path.join(src, path.dirname(rel)), name = path.basename(rel);
  if (!name.startsWith('*')) return fs.readFileSync(path.join(src, rel), 'utf8');
  return fs.readdirSync(dir).filter((f) => f.endsWith(name.slice(1))).sort()
    .map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('');
}
const html = fs.readFileSync(path.join(src, 'index.html'), 'utf8').replace(/^@@include (\S+)\n/gm, (_, rel) => include(rel));

if (process.argv.includes('--check')) {
  if (fs.readFileSync(out, 'utf8') !== html) { console.error('index.html is out of date: run node tools/build.cjs'); process.exit(1); }
  console.log('index.html matches src/');
} else {
  fs.writeFileSync(out, html);
  console.log(`index.html built from src/ (${(html.length / 1024).toFixed(0)} KB)`);
}

if (process.argv.includes('--app')) {
  // concept art and the retired v5 hero are pipeline inputs the game never requests
  const skip = new Set(['assets/concepts', 'assets/hero-v5'].map((p) => path.join(root, p)));
  const www = path.join(root, 'www');
  fs.rmSync(www, { recursive: true, force: true });
  for (const p of ['index.html', 'manifest.webmanifest', 'vendor', 'assets'])
    fs.cpSync(path.join(root, p), path.join(www, p), { recursive: true, filter: (f) => !skip.has(f) });
  let bytes = 0;
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(path.join(d, e.name)) : (bytes += fs.statSync(path.join(d, e.name)).size); };
  walk(www);
  console.log(`www/ ready for Capacitor (${(bytes / 1048576).toFixed(1)} MB)`);
}
