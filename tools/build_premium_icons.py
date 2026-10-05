"""Export generated transparent masters as small, lossless menu assets.

Usage: python tools/build_premium_icons.py <generated-image-directory>
Pillow is used only for resizing/encoding, without repainting or removing alpha.
The manifest retains each original generation prompt and filename.
"""
import json
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'assets/ui/premium-v2'

def main():
    source_dir = Path(sys.argv[1]).resolve()
    manifest_path = OUTPUT / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    total = 0
    for asset in manifest['assets']:
        assert Path(asset['generatedFile']).name == asset['generatedFile']
        assert Path(asset['file']).name == asset['file']
        with Image.open(source_dir / asset['generatedFile']) as image:
            image = image.convert('RGBA')
            low, high = image.getchannel('A').getextrema()
            assert low == 0 and high >= 250, asset['id']
            # Export at 256px: sufficient for the largest 108px menu portrait.
            image = image.resize((256, 256), Image.Resampling.BOX)
            image.save(OUTPUT / asset['file'], 'WEBP', lossless=True, method=6)
        with Image.open(OUTPUT / asset['file']) as check:
            check.load()
            assert check.size == (256, 256)
            low, high = check.getchannel('A').getextrema()
            assert low == 0 and high >= 250
        asset['bytes'] = (OUTPUT / asset['file']).stat().st_size
        total += asset['bytes']
        print(f"{asset['id']}: {asset['bytes']:,} bytes")
    manifest['totalBytes'] = total
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'{len(manifest["assets"])} icons: {total:,} bytes total')

if __name__ == '__main__':
    main()
