"""Package a rigged v4 hero (tools/v4_assemble.cjs output) for the game's lazy loader.

python tools/v4_pack.py RIGGED.glb OUT_DIR [--texture 1024]
Quantizes vertex data (KHR_mesh_quantization, no decoder needed), externalizes the textures as
WebP (base colour at --texture px, metal/roughness at half that) and writes model.json + evidence.
"""
import argparse, base64, hashlib, io, json, os, struct, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent


def externalize(blob, out, size):
    magic, version, length = struct.unpack_from('<III', blob)
    assert magic == 0x46546C67 and version == 2
    jlen, jtype = struct.unpack_from('<II', blob, 12)
    doc = json.loads(blob[20:20 + jlen])
    off = 20 + jlen
    blen, btype = struct.unpack_from('<II', blob, off)
    raw = blob[off + 8:off + 8 + blen]
    # which image is the base colour
    base = {t['source'] for m in doc.get('materials', []) for t in [doc['textures'][m.get('pbrMetallicRoughness', {}).get('baseColorTexture', {}).get('index', -1)]] if m.get('pbrMetallicRoughness', {}).get('baseColorTexture')}
    excluded, textures = set(), []
    for i, img in enumerate(doc.get('images', [])):
        view = img.pop('bufferView')
        bv = doc['bufferViews'][view]
        tex = Image.open(io.BytesIO(raw[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]))
        is_base = i in base
        px = size if is_base else size // 2
        if max(tex.size) > px:
            tex = tex.resize((px, px), Image.LANCZOS)
        name = 'basecolor.webp' if is_base else f'texture-{i}.webp'
        tex.convert('RGBA' if is_base and tex.mode == 'RGBA' else 'RGB').save(out / name, 'WEBP', quality=90 if is_base else 85, method=6)
        img.pop('mimeType', None)
        img['uri'] = name
        excluded.add(view)
        textures.append({'path': name, 'px': tex.size[0], 'bytes': (out / name).stat().st_size})
    remap, views, binary = {}, [], bytearray()
    for i, bv in enumerate(doc['bufferViews']):
        if i in excluded:
            continue
        binary.extend(b'\0' * ((-len(binary)) % 4))
        start = bv.get('byteOffset', 0)
        views.append(dict(bv, byteOffset=len(binary)))
        binary.extend(raw[start:start + bv['byteLength']])
        remap[i] = len(views) - 1
    for a in doc.get('accessors', []):
        if 'bufferView' in a:
            a['bufferView'] = remap[a['bufferView']]
    for s in doc.get('skins', []):
        pass  # inverse bind matrices are accessors, already remapped
    doc['bufferViews'] = views
    doc['buffers'] = [{'byteLength': len(binary)}]
    enc = json.dumps(doc, separators=(',', ':')).encode()
    enc += b' ' * ((-len(enc)) % 4)
    binary += b'\0' * ((-len(binary)) % 4)
    total = 12 + 8 + len(enc) + 8 + len(binary)
    packed = struct.pack('<III', magic, 2, total) + struct.pack('<II', len(enc), jtype) + enc + struct.pack('<II', len(binary), btype) + binary
    return packed, textures


def main():
    p = argparse.ArgumentParser()
    p.add_argument('source', type=Path)
    p.add_argument('out', type=Path)
    p.add_argument('--texture', type=int, default=1024)
    p.add_argument('--static', action='store_true', help='unskinned prop (weapons)')
    a = p.parse_args()
    a.out.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp()) / 'q.glb'
    subprocess.run(['node', str(HERE / 'v4_quantize.cjs'), str(a.source), str(tmp)], check=True)
    blob = tmp.read_bytes()
    packed, textures = externalize(blob, a.out, a.texture)
    (a.out / 'model.json').write_text(json.dumps({'format': 'glb-base64', 'glb': base64.b64encode(packed).decode()}, separators=(',', ':')) + '\n')
    jl = struct.unpack_from('<I', packed, 12)[0]
    doc = json.loads(packed[20:20 + jl])
    tris = sum(doc['accessors'][pr['indices']]['count'] // 3 for m in doc['meshes'] for pr in m['primitives'])
    joints = 0 if a.static else len(doc['skins'][0]['joints'])
    assert a.static or joints == 15, 'v4 heroes use the 15-joint adventurer skeleton'
    kb = round(sum(f.stat().st_size for f in a.out.iterdir() if f.name == 'model.json' or f.suffix == '.webp') / 1024)
    ev = {'source_sha256': hashlib.sha256(a.source.read_bytes()).hexdigest(), 'triangles': tris, 'joints': joints, 'textures': textures, 'kb': kb}
    (a.out / 'mesh-evidence.json').write_text(json.dumps(ev, indent=1) + '\n')
    print(json.dumps(ev))


if __name__ == '__main__':
    main()
