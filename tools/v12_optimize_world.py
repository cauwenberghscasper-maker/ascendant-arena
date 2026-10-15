"""Shrink the world models for phones (run after packing; safe to run again).

python3 tools/v12_optimize_world.py [assets/world]

For every assets/world/<name>/model.json (glb-base64):
  * drops normal, occlusion and metal/roughness maps (the world's painted look uses flat roughness), keeps base
    colour and emissive maps, and removes the textures/images nothing references any more;
  * caps each texture at a size picked by the model's role (far LODs, grass and small props smaller, bosses larger);
  * moves every texture to assets/world/_tex/<hash>.webp, so identical textures (the kit trees' bark and leaves,
    shared by every variant) download once and the game can share one GPU texture (image name 'tx:<hash>').
Writes a size report to stdout.
"""
import base64, hashlib, io, json, os, re, struct, sys
from pathlib import Path
from PIL import Image

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else 'assets/world')
TEX = ROOT / '_tex'
TEX.mkdir(exist_ok=True)

def cap(name):
    if re.search(r'_lod_\d+$', name) or re.match(r'(tuft|flower|mushrooms|rock_a|bush_a|bush_flower)_', name): return 256
    if name in ('mountain', 'snow_mountain', 'sea_stack', 'floating_isle', 'volcano', 'sky_temple'): return 256
    if name.startswith('boss_') or name in ('arena_floor', 'rift_floor', 'keep', 'cave'): return 1024
    return 512

def read_glb(b):
    _, _, length = struct.unpack_from('<III', b)
    jl, _ = struct.unpack_from('<II', b, 12); doc = json.loads(b[20:20 + jl])
    off = 20 + jl; bl, _ = struct.unpack_from('<II', b, off)
    return doc, b[off + 8:off + 8 + bl]

def write_glb(doc, binary):
    enc = json.dumps(doc, separators=(',', ':')).encode(); enc += b' ' * ((-len(enc)) % 4)
    binary = bytes(binary) + b'\0' * ((-len(binary)) % 4)
    total = 12 + 8 + len(enc) + 8 + len(binary)
    return struct.pack('<III', 0x46546C67, 2, total) + struct.pack('<II', len(enc), 0x4E4F534A) + enc + struct.pack('<II', len(binary), 0x004E4942) + binary

before = after = 0
used_hashes = set()
for d in sorted(p for p in ROOT.iterdir() if p.is_dir() and p.name != '_tex'):
    mj = d / 'model.json'
    if not mj.exists(): continue
    pack = json.loads(mj.read_text())
    doc, binary = read_glb(base64.b64decode(pack['glb']))
    before += sum(f.stat().st_size for f in d.iterdir())
    # 1) materials keep only base colour and emissive maps
    for m in doc.get('materials', []):
        pbr = m.setdefault('pbrMetallicRoughness', {})
        if pbr.pop('metallicRoughnessTexture', None) is not None or 'roughnessFactor' not in pbr:
            pbr['metallicFactor'] = 0; pbr['roughnessFactor'] = 0.9
        m.pop('normalTexture', None); m.pop('occlusionTexture', None)
    used_tex = sorted({t['index'] for m in doc.get('materials', []) for t in [m.get('pbrMetallicRoughness', {}).get('baseColorTexture'), m.get('emissiveTexture')] if t})
    tmap = {old: new for new, old in enumerate(used_tex)}
    textures = [doc['textures'][i] for i in used_tex]
    used_img = sorted({t['source'] for t in textures})
    imap = {old: new for new, old in enumerate(used_img)}
    for t in textures: t['source'] = imap[t['source']]
    for m in doc.get('materials', []):
        for t in [m.get('pbrMetallicRoughness', {}).get('baseColorTexture'), m.get('emissiveTexture')]:
            if t: t['index'] = tmap[t['index']]
    images = [doc['images'][i] for i in used_img]
    doc['textures'] = textures; doc['images'] = images
    if not textures: doc.pop('textures'); doc.pop('images', None)
    # 2) + 3) resize and move every image into the shared folder
    px = cap(d.name)
    for im in images:
        uri = im['uri']
        src = (d / uri).resolve()
        img = Image.open(src); img.load()
        if uri.startswith('../_tex/') and max(img.size) <= px:  # already optimised: keep the bytes (no second lossy pass)
            used_hashes.add(src.stem); continue
        if max(img.size) > px: img = img.resize((px, px), Image.LANCZOS)
        buf = io.BytesIO(); img.save(buf, 'WEBP', quality=88, method=4); data = buf.getvalue()
        h = hashlib.sha1(data).hexdigest()[:16]
        out = TEX / (h + '.webp')
        if not out.exists(): out.write_bytes(data)
        used_hashes.add(h)
        im['uri'] = '../_tex/' + h + '.webp'; im['name'] = 'tx:' + h
    for f in d.iterdir():
        if f.suffix == '.webp': f.unlink()
    mj.write_text(json.dumps({'format': 'glb-base64', 'glb': base64.b64encode(write_glb(doc, binary)).decode()}, separators=(',', ':')) + '\n')
    after += sum(f.stat().st_size for f in d.iterdir())
for f in TEX.iterdir():
    if f.stem not in used_hashes: f.unlink()
shared = sum(f.stat().st_size for f in TEX.iterdir())
print(f'model folders {before / 1e6:.1f} MB -> {after / 1e6:.1f} MB + shared textures {shared / 1e6:.1f} MB ({len(used_hashes)} files)')
