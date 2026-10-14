// Rewrite the WORLD_MODEL_BOX table in src/game/48-world-models.js from every assets/world/<name>/box.json.
// node tools/v10_boxes.cjs
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), dir = path.join(root, 'assets/world'), file = path.join(root, 'src/game/48-world-models.js');
const rows = fs.readdirSync(dir).filter((n) => fs.existsSync(path.join(dir, n, 'box.json')) && fs.existsSync(path.join(dir, n, 'model.json'))).sort()
  .map((n) => { const b = JSON.parse(fs.readFileSync(path.join(dir, n, 'box.json'))); return `${n}: [${+b.w.toFixed(2)}, ${+b.d.toFixed(2)}]`; });
const lines = []; for (let i = 0; i < rows.length; i += 6) lines.push('  ' + rows.slice(i, i + 6).join(', ') + ',');
const src = fs.readFileSync(file, 'utf8').replace(/(\/\/ <world-boxes>[^\n]*\n)[\s\S]*?(\/\/ <\/world-boxes>)/, `$1const WORLD_MODEL_BOX = {\n${lines.join('\n')}\n};\n$2`);
fs.writeFileSync(file, src); console.log(rows.length + ' world models');
