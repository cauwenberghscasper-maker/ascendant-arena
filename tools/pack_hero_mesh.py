"""Package a reviewed, textured TRELLIS GLB for the game's existing lazy loader.

Requires numpy, trimesh, Pillow. Does not generate art or modify the live
manifest. Supply a measured rig JSON after reviewing the normalized mesh.
The source GLB is preserved. Output includes model.json, WebP texture(s), a
normalized review GLB and mesh-evidence.json.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import struct

import numpy as np
import trimesh
from PIL import Image


def externalize(blob, out):
    """Remove embedded image payloads and keep accessor buffer views aligned."""
    magic, version, length = struct.unpack_from('<III', blob)
    assert magic == 0x46546C67 and version == 2 and length == len(blob)
    jlen, jtype = struct.unpack_from('<II', blob, 12)
    assert jtype == 0x4E4F534A
    doc = json.loads(blob[20:20 + jlen])
    offset = 20 + jlen
    blen, btype = struct.unpack_from('<II', blob, offset)
    assert btype == 0x004E4942
    raw = blob[offset + 8:offset + 8 + blen]
    excluded = set()
    textures = []
    for i, img in enumerate(doc.get('images', [])):
        assert 'bufferView' in img, 'Expected embedded source textures'
        view_id = img.pop('bufferView')
        bv = doc['bufferViews'][view_id]
        from io import BytesIO
        texture = Image.open(BytesIO(raw[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]))
        assert max(texture.size) <= 1024, 'Review texture resolution before packing'
        name = 'basecolor.webp' if i == 0 else f'texture-{i}.webp'
        texture.save(out / name, 'WEBP', quality=92, method=6)
        img.pop('mimeType', None)
        img['uri'] = name
        excluded.add(view_id)
        textures.append({'path': name, 'width': texture.width, 'height': texture.height,
                         'bytes': (out / name).stat().st_size})
    remap, views, binary = {}, [], bytearray()
    for i, bv in enumerate(doc['bufferViews']):
        if i in excluded:
            continue
        assert bv.get('buffer', 0) == 0
        binary.extend(b'\0' * ((-len(binary)) % 4))
        start = bv.get('byteOffset', 0)
        copy = dict(bv, byteOffset=len(binary))
        binary.extend(raw[start:start + bv['byteLength']])
        remap[i] = len(views)
        views.append(copy)
    for accessor in doc.get('accessors', []):
        assert 'sparse' not in accessor, 'Sparse accessor requires explicit support'
        if 'bufferView' in accessor:
            accessor['bufferView'] = remap[accessor['bufferView']]
    doc['bufferViews'] = views
    doc['buffers'] = [{'byteLength': len(binary)}]
    encoded = json.dumps(doc, separators=(',', ':')).encode()
    encoded += b' ' * ((-len(encoded)) % 4)
    binary += b'\0' * ((-len(binary)) % 4)
    size = 12 + 8 + len(encoded) + 8 + len(binary)
    packed = struct.pack('<III', magic, 2, size) + struct.pack('<II', len(encoded), jtype) + encoded
    packed += struct.pack('<II', len(binary), btype) + binary
    return packed, textures


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('source', type=Path)
    p.add_argument('output', type=Path)
    p.add_argument('--rig', type=Path, required=True)
    p.add_argument('--max-triangles', type=int, default=12000)
    p.add_argument('--hip-y', type=float, default=.47)
    p.add_argument('--leg-cut-y', type=float, default=.40,
                   help='Cut below the hip so lowered hands stay on the body')
    p.add_argument('--turn', type=float, default=0, help='Facing correction in degrees')
    args = p.parse_args()
    assert args.source.resolve() != (args.output / 'review.glb').resolve()
    mesh = trimesh.load(args.source, force='mesh', process=False)
    assert isinstance(mesh, trimesh.Trimesh) and len(mesh.faces) > 0
    assert np.isfinite(mesh.vertices).all() and np.isfinite(mesh.visual.uv).all()
    assert len(mesh.faces) <= args.max_triangles, 'Source mesh exceeds the reviewed triangle budget'
    assert mesh.visual.kind == 'texture', 'Mesh must preserve UV texture coordinates'
    mesh.apply_transform(trimesh.transformations.rotation_matrix(np.deg2rad(args.turn), [0, 1, 0]))
    lo, hi = mesh.bounds
    h = hi[1] - lo[1]
    assert h > 0
    mesh.vertices -= [(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2]
    mesh.vertices /= h
    centers = mesh.triangles_center
    low = centers[:, 1] < args.leg_cut_y
    masks = {'body': ~low, 'legL': low & (centers[:, 0] < 0), 'legR': low & (centers[:, 0] >= 0)}
    scene = trimesh.Scene()
    legs = {}
    for name, mask in masks.items():
        assert np.count_nonzero(mask) > 50, f'Insufficient {name} geometry'
        piece = mesh.submesh([np.flatnonzero(mask)], append=True, repair=False)
        scene.add_geometry(piece, node_name=name, geom_name=name)
        if name.startswith('leg'):
            leg_center = np.median(piece.vertices, axis=0)
            legs[name] = [round(float(leg_center[0]), 5), args.hip_y,
                          round(float(leg_center[2]), 5)]
    args.output.mkdir(parents=True, exist_ok=True)
    blob = scene.export(file_type='glb')
    (args.output / 'review.glb').write_bytes(blob)
    packed, textures = externalize(blob, args.output)
    (args.output / 'model.json').write_text(json.dumps({'format': 'glb-base64',
        'glb': base64.b64encode(packed).decode()}, separators=(',', ':')) + '\n', encoding='utf-8')
    rig = json.loads(args.rig.read_text(encoding='utf-8'))
    assert 'rig' in rig and 'hand' in rig and 'size' in rig
    entry = dict(rig, dir=args.output.as_posix().rstrip('/') + '/', legs=legs,
                 tris=len(mesh.faces), kb=round(sum(x.stat().st_size for x in args.output.iterdir()
                 if x.name == 'model.json' or x.suffix == '.webp') / 1024))
    (args.output / 'manifest-entry.json').write_text(json.dumps(entry, indent=2) + '\n', encoding='utf-8')
    evidence = {'source_sha256': hashlib.sha256(args.source.read_bytes()).hexdigest(),
                'triangles': len(mesh.faces), 'bounds': mesh.bounds.tolist(),
                'parts': {k: int(np.count_nonzero(v)) for k, v in masks.items()},
                'textures': textures, 'leg_pivots': legs, 'facing_correction': args.turn,
                'note': 'Segmented leg swing matches existing game animation; not an authored skeleton.'}
    (args.output / 'mesh-evidence.json').write_text(json.dumps(evidence, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(evidence))


if __name__ == '__main__':
    main()
