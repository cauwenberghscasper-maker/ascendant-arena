#!/usr/bin/env python3
"""Pack source sounds into the game's audio format.

usage: python3 -I tools/audio_pack.py <source_dir> <map.json>

map.json: { "assets/audio/ui/tap": ["placement-a.ogg", "placement-b.ogg"], ... }
  key   = output path WITHOUT extension, as used in AUDIO_MANIFEST (49-audio-data.js) `file`
  value = one source file, or a list -> written as <key>-1, <key>-2, … (set `n` in the manifest)

Each file: peak-normalise to -3 dBFS, trim leading/trailing silence below -55 dB, mono, 48 kHz, 6 ms fade-out,
then written twice: <key>.webm (Opus 48 kbps) and <key>.m4a (AAC 64 kbps, for older iPhones).
Needs ffmpeg. Loudness between sounds is balanced with `vol` in AUDIO_MANIFEST, not here.
"""
import json, os, subprocess, sys

def run(args):
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode: sys.exit(f"ffmpeg failed: {' '.join(args)}\n{r.stderr[-800:]}")
    return r

def peak_db(path):
    out = run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'volumedetect', '-f', 'null', '-']).stderr
    for line in out.splitlines():
        if 'max_volume' in line: return float(line.split()[-2])
    return 0.0

def pack(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    tmp = dst + '.tmp.wav'
    trim = ('silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.002,'
            'areverse,silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.01,areverse')
    # level first, then trim, so a quiet source keeps its tail (the threshold is relative to a -3 dB peak)
    gain = -3.0 - peak_db(src)
    run(['ffmpeg', '-hide_banner', '-y', '-i', src, '-ac', '1', '-ar', '48000', '-af', f'volume={gain:.2f}dB,{trim}', tmp])
    dur = float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', tmp]).stdout.strip() or 0)
    gain = -3.0 - peak_db(tmp)  # mono fold-down can change the peak a little
    fade = max(0.0, dur - 0.006)
    af = f'volume={gain:.2f}dB,afade=t=out:st={fade:.3f}:d=0.006'
    run(['ffmpeg', '-hide_banner', '-y', '-i', tmp, '-af', af, '-c:a', 'libopus', '-b:a', '48k', '-vbr', 'on', dst + '.webm'])
    run(['ffmpeg', '-hide_banner', '-y', '-i', tmp, '-af', af, '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', dst + '.m4a'])
    os.remove(tmp)
    return dur

def main():
    if len(sys.argv) != 3: sys.exit(__doc__)
    src_dir, mapping = sys.argv[1], json.load(open(sys.argv[2]))
    for key, srcs in mapping.items():
        srcs = [srcs] if isinstance(srcs, str) else srcs
        for i, s in enumerate(srcs):
            dst = key if len(srcs) == 1 else f'{key}-{i + 1}'
            d = pack(os.path.join(src_dir, s), dst)
            print(f'{dst:40s} <- {s:24s} {d:.3f}s')

main()
