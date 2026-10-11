// Builds the shipped index.html from src/: each `@@include <path>` line in src/index.html is replaced
// by that file, and `dir/*.ext` by every matching file in name order (the number prefixes set the order).
//   node tools/build.cjs          write index.html
//   node tools/build.cjs --check  fail if index.html is out of date with src/
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
