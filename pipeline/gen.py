"""Run a list of Hugging Face Space calls with the account's token (credits pay for ZeroGPU beyond the quota).
gen.json: {"batch": "...", "jobs": [{"name": "x", "space": "owner/space", "api": "/fn", "args": {...},
           "files": ["argname"], "from": {"argname": "earlier_job_name"}, "ext": ".glb", "pre": ["/start_session"]}]}
Image/file arguments listed in "files" are URLs or earlier outputs; every output file with the job's ext is saved as
out/<name><ext>. A log with timings and errors goes to out/gen-log.json."""
import base64, json, os, shutil, sys, time, urllib.request
from gradio_client import Client, handle_file
from huggingface_hub import whoami

spec, out = json.load(open(sys.argv[1])), sys.argv[2]
os.makedirs(out, exist_ok=True)
tok = os.environ['HF_TOKEN']
me = whoami(token=tok); print('running as', me.get('name'), 'pro' if me.get('isPro') else '')
clients, done, log = {}, {}, []

def files_in(x):
    if isinstance(x, str): return [x] if os.path.isfile(x) else []
    if isinstance(x, dict): return sum((files_in(v) for k, v in x.items() if k in ('path', 'value', 'image', 'name') or isinstance(v, (dict, list, tuple))), [])
    if isinstance(x, (list, tuple)): return sum((files_in(v) for v in x), [])
    return []

for job in spec['jobs']:
    name, t0 = job['name'], time.time()
    try:
        if job['space'] not in clients:
            try: clients[job['space']] = Client(job['space'], token=tok, verbose=False)
            except TypeError: clients[job['space']] = Client(job['space'], hf_token=tok, verbose=False)
        c = clients[job['space']]
        if job.get('probe'):
            # just describe the Space's endpoints (names, parameters, defaults) for writing the real jobs
            info = c.view_api(print_info=False, return_format='dict') or {}
            json.dump(info, open(os.path.join(out, name + '.json'), 'w'), indent=1, default=str)
            log.append({'name': name, 'ok': True, 'file': name + '.json', 'sec': round(time.time() - t0, 1)}); print(json.dumps(log[-1])); continue
        for pre in job.get('pre', []): c.predict(api_name=pre)
        args = dict(job.get('args', {}))
        for k, src in job.get('from', {}).items():
            if src not in done: raise RuntimeError('input job failed: ' + src)
            args[k] = done[src]
        for k in job.get('files', []) + list(job.get('from', {})):
            args[k] = handle_file(args[k])
        # reference images sent as a JSON array of base64 strings (FLUX.2 Klein, Qwen Image Edit)
        for k, srcs in job.get('b64', {}).items():
            enc = []
            for u in srcs:
                if u.startswith('job:'): data = open(done[u[4:]], 'rb').read()
                else: data = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'gen'}), timeout=60).read()
                enc.append(base64.b64encode(data).decode())
            args[k] = json.dumps(enc)
        api = job['api']
        names = list((c.view_api(print_info=False, return_format='dict') or {}).get('named_endpoints', {}).keys())
        if api not in names:
            pick = [n for n in names if 'infer' in n.lower()] or [n for n in names if 'generate' in n.lower()] or names
            print('endpoints', names, '->', pick[:1]); api = pick[0]
        res = c.predict(api_name=api, **args)
        if job.get('noout'):
            # a stateful step (e.g. TRELLIS.2 image_to_3d before extract_glb): nothing to save
            done[name] = None; log.append({'name': name, 'ok': True, 'sec': round(time.time() - t0, 1), 'res': str(res)[:300]}); print(json.dumps(log[-1]))
            json.dump({'batch': spec.get('batch'), 'user': me.get('name'), 'jobs': log}, open(os.path.join(out, 'gen-log.json'), 'w'), indent=1); continue
        ext = job.get('ext', '.webp')
        # some Spaces return the picture inline as a base64 data URL
        def data_urls(x):
            if isinstance(x, str): return [x] if x.startswith('data:image') else []
            if isinstance(x, dict): return sum((data_urls(v) for v in x.values()), [])
            if isinstance(x, (list, tuple)): return sum((data_urls(v) for v in x), [])
            return []
        inline = data_urls(res)
        if inline:
            dst = os.path.join(out, name + '.png'); open(dst, 'wb').write(base64.b64decode(inline[0].split(',', 1)[1])); done[name] = dst
            log.append({'name': name, 'ok': True, 'file': os.path.basename(dst), 'sec': round(time.time() - t0, 1)})
            print(json.dumps(log[-1])); json.dump({'batch': spec.get('batch'), 'user': me.get('name'), 'jobs': log}, open(os.path.join(out, 'gen-log.json'), 'w'), indent=1)
            continue
        hits = [f for f in files_in(res) if f.lower().endswith(ext) or (ext == '.webp' and f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')))]
        if not hits: raise RuntimeError('no %s output in %r' % (ext, res)[:500])
        hit = hits[min(job.get('pick', 0), len(hits) - 1)]  # e.g. Hunyuan returns the white mesh first, the textured one second
        dst = os.path.join(out, name + os.path.splitext(hit)[1].lower())
        shutil.copy(hit, dst); done[name] = dst
        log.append({'name': name, 'ok': True, 'file': os.path.basename(dst), 'sec': round(time.time() - t0, 1)})
    except Exception as e:
        log.append({'name': name, 'ok': False, 'error': str(e)[:800], 'sec': round(time.time() - t0, 1)})
    print(json.dumps(log[-1]))
    json.dump({'batch': spec.get('batch'), 'user': me.get('name'), 'jobs': log}, open(os.path.join(out, 'gen-log.json'), 'w'), indent=1)
