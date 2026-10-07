// Prefer dependencies installed in this checkout; allow the existing isolated workspace cache.
const fs = require('node:fs'), path = require('node:path');
const roots = [path.join(__dirname, 'node_modules'), path.resolve(__dirname, '../../.asset-tools/node_modules')];
const dependencies = roots.find(root => fs.existsSync(path.join(root, '@gltf-transform/core/package.json')));
if (!dependencies) throw Error('Install the offline asset dependencies with: npm install --prefix tools');
module.exports = dependencies;
