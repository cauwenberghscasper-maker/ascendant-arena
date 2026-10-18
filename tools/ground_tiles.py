"""Make Z-Image ground textures seamless (blend with a half-shifted copy, weighted away from the edges) and save 512 px webp."""
import sys, numpy as np
from PIL import Image
R = '/root/.claude/projects/-home-user-ascendant-arena/95cab2f6-98f9-5480-920a-5dd7322214ce/tool-results/mcp-Hugghingface2-blob-'
SRC = {'grass': '1792343413238-n7przh', 'dirt': '1792343423713-2efudu', 'snow': '1792343452687-wnkov5', 'basalt': '1792343466005-yxssuj',
       'flagstone': '1792343476172-hz1p02', 'seabed': '1792343488929-hx916g', 'cobble': '1792343499636-nwnbe7'}
for name, f in SRC.items():
    im = Image.open(R + f + '.webp').convert('RGB')
    if name == 'seabed': im = im.crop((0, 0, im.width // 2, im.height // 2))  # the image already repeats 2 x 2
    a = np.asarray(im.resize((1024, 1024), Image.LANCZOS)).astype(np.float32)
    n = a.shape[0]; t = np.linspace(0, 1, n); e = np.minimum(t, 1 - t) * 2           # 0 at the edges, 1 in the middle
    w = np.clip(np.minimum.outer(e, e) * 2.2, 0, 1)[..., None]
    out = a * w + np.roll(a, (n // 2, n // 2), (0, 1)) * (1 - w)
    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).resize((512, 512), Image.LANCZOS)
    img.save(f'assets/world/_ground/{name}.webp', quality=84, method=6)
    m = np.asarray(img).reshape(-1, 3).mean(0) / 255
    print(name, 'mean', ' '.join(f'{v:.3f}' for v in m))
