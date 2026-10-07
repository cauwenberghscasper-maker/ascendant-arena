"""Package a measured, reviewed skin for the game's lazy GLB loader.

Preserves source textures/mesh and externalizes a <=1024px WebP texture.
Does not enable the hero on the public website.
"""
import argparse, base64, hashlib, json
from pathlib import Path
from pack_hero_mesh import externalize

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('source', type=Path)
p.add_argument('rig', type=Path)
p.add_argument('output', type=Path)
args = p.parse_args()
assert not args.output.is_absolute(), 'Use a repository-relative game asset path'
args.output.mkdir(parents=True, exist_ok=True)
blob = args.source.read_bytes()
packed, textures = externalize(blob, args.output)
document = json.loads(packed[20:20 + int.from_bytes(packed[12:16], 'little')])
assert len(document.get('skins', [])) == 1
assert len(document['skins'][0]['joints']) == 13
triangles = sum(document['accessors'][primitive['indices']]['count'] // 3
                for mesh in document['meshes'] for primitive in mesh['primitives'])
assert 1000 <= triangles <= 12000
for mesh in document['meshes']:
    for primitive in mesh['primitives']:
        assert {'JOINTS_0', 'WEIGHTS_0', 'TEXCOORD_0'} <= primitive['attributes'].keys()
(args.output / 'model.json').write_text(json.dumps({'format': 'glb-base64',
    'glb': base64.b64encode(packed).decode()}, separators=(',', ':')) + '\n', encoding='utf-8')
rig = json.loads(args.rig.read_text(encoding='utf-8'))
rig.update(dir=args.output.as_posix() + '/', tris=triangles,
           kb=round(sum(f.stat().st_size for f in args.output.iterdir()
                        if f.name == 'model.json' or f.suffix == '.webp') / 1024))
(args.output / 'manifest-entry.json').write_text(json.dumps(rig, indent=2) + '\n', encoding='utf-8')
evidence = {'source_sha256': hashlib.sha256(blob).hexdigest(), 'triangles': triangles,
            'joints': 13, 'textures': textures,
            'note': 'Measured procedural shoulder/elbow/wrist and hip/knee/ankle rig. Not authored motion capture.'}
(args.output / 'mesh-evidence.json').write_text(json.dumps(evidence, indent=2) + '\n', encoding='utf-8')
print(json.dumps(evidence))
