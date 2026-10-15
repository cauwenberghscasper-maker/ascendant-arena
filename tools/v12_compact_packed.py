"""Drop unreferenced vertices from packed models (model.json, glb-base64). Simplifying with meshoptimizer rewrites
only the index buffer, so a model cut from 20k to 9k triangles still carried every original vertex.

python3 tools/v12_compact_packed.py DIR [DIR ...]      (each DIR holds model.json; safe to run again)
Rewrites every accessor into its own tightly packed buffer view (no interleaving); images must be external (uri).
"""
import base64, json, struct, sys
from pathlib import Path

CSIZE = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
NCOMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT2': 4, 'MAT3': 9, 'MAT4': 16}
FMT = {5120: 'b', 5121: 'B', 5122: 'h', 5123: 'H', 5125: 'I', 5126: 'f'}

def read_glb(b):
    jl = struct.unpack_from('<I', b, 12)[0]; doc = json.loads(b[20:20 + jl]); off = 20 + jl
    bl = struct.unpack_from('<I', b, off)[0]; return doc, b[off + 8:off + 8 + bl]

def write_glb(doc, binary):
    enc = json.dumps(doc, separators=(',', ':')).encode(); enc += b' ' * ((-len(enc)) % 4)
    binary = bytes(binary) + b'\0' * ((-len(binary)) % 4)
    return struct.pack('<III', 0x46546C67, 2, 28 + len(enc) + len(binary)) + struct.pack('<II', len(enc), 0x4E4F534A) + enc + struct.pack('<II', len(binary), 0x004E4942) + binary

def elements(doc, binary, a):
    """accessor -> list of raw element byte strings"""
    es = CSIZE[a['componentType']] * NCOMP[a['type']]
    if 'bufferView' not in a: return [b'\0' * es] * a['count']
    bv = doc['bufferViews'][a['bufferView']]; stride = bv.get('byteStride') or es
    base = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    return [binary[base + i * stride: base + i * stride + es] for i in range(a['count'])]

def compact(path):
    pack = json.loads(path.read_text())
    doc, binary = read_glb(base64.b64decode(pack['glb']))
    if any('bufferView' in im for im in doc.get('images', [])): print('skip (embedded images)', path); return 0, 0
    acc = doc['accessors']; data = [elements(doc, binary, a) for a in acc]
    users = {}
    for m in doc.get('meshes', []):
        for p in m['primitives']:
            for i in list(p['attributes'].values()) + [p.get('indices')] + [v for t in p.get('targets', []) for v in t.values()]:
                if i is not None: users[i] = users.get(i, 0) + 1
    before = sum(len(d) for d in data)
    for m in doc.get('meshes', []):
        for p in m['primitives']:
            if p.get('indices') is None: continue
            attrs = list(p['attributes'].values()) + [v for t in p.get('targets', []) for v in t.values()]
            if any(users[i] > 1 for i in attrs + [p['indices']]): continue  # shared accessors: leave alone
            ia = acc[p['indices']]; fmt = '<' + FMT[ia['componentType']]
            idx = [struct.unpack(fmt, e)[0] for e in data[p['indices']]]
            used = sorted(set(idx)); n = acc[attrs[0]]['count']
            if len(used) == n: continue
            remap = {old: new for new, old in enumerate(used)}
            for i in attrs: data[i] = [data[i][o] for o in used]; acc[i]['count'] = len(used)
            ctype = 5123 if len(used) < 65536 else 5125
            data[p['indices']] = [struct.pack('<' + FMT[ctype], remap[x]) for x in idx]; ia['componentType'] = ctype
            for i in attrs:  # min/max stay exact (POSITION needs them)
                a = acc[i]
                if 'min' in a or 'max' in a:
                    nc, f = NCOMP[a['type']], '<' + FMT[a['componentType']] * NCOMP[a['type']]
                    vals = [struct.unpack(f, e) for e in data[i]]
                    a['min'] = [min(v[k] for v in vals) for k in range(nc)]; a['max'] = [max(v[k] for v in vals) for k in range(nc)]
    # rebuild: one buffer view per accessor; vertex attributes padded to 4-byte strides as glTF requires
    attr_set = {i for m in doc.get('meshes', []) for p in m['primitives'] for i in list(p['attributes'].values()) + [v for t in p.get('targets', []) for v in t.values()]}
    index_set = {p['indices'] for m in doc.get('meshes', []) for p in m['primitives'] if p.get('indices') is not None}
    out, views = bytearray(), []
    for i, a in enumerate(acc):
        if 'bufferView' not in a: continue
        out.extend(b'\0' * ((-len(out)) % 4))
        es = CSIZE[a['componentType']] * NCOMP[a['type']]
        stride = es + ((-es) % 4) if i in attr_set else es
        start = len(out)
        for e in data[i]: out.extend(e + b'\0' * (stride - es))
        bv = {'buffer': 0, 'byteOffset': start, 'byteLength': len(out) - start}
        if i in attr_set: bv['target'] = 34962; bv['byteStride'] = stride
        elif i in index_set: bv['target'] = 34963
        a['bufferView'] = len(views); a.pop('byteOffset', None); views.append(bv)
    doc['bufferViews'] = views; doc['buffers'] = [{'byteLength': len(out)}]
    after = sum(len(d) for d in data)
    pack['glb'] = base64.b64encode(write_glb(doc, out)).decode()
    path.write_text(json.dumps(pack, separators=(',', ':')) + '\n')
    return before, after

tb = ta = 0
for d in sys.argv[1:]:
    p = Path(d) / 'model.json'
    if not p.exists(): continue
    b, a = compact(p); tb += b; ta += a
print(f'elements {tb} -> {ta}')
