# Reviewed hero asset pipeline

The game is static HTML and browser modules. These tools are offline development dependencies.

Install the exact Node dependencies with `npm install --prefix tools` (Node 22.12 or later). The existing local workspace may instead use its sibling `.asset-tools/node_modules` cache. Python packaging requires NumPy, trimesh and Pillow; use an isolated Python environment.

Preserve the original generated GLB. Measure joints on its normalized, forward-facing geometry and save a separate rig JSON. Use the authored reference, close-up, back view and full-body motion review before accepting it. Do not derive arm weights solely from X coordinate: coats can be mistaken for hands.

```text
node tools/simplify_hero_mesh.cjs INPUT.glb SIMPLIFIED.glb 11500
node tools/rig_hero_mesh.cjs SIMPLIFIED.glb ANIMATED.glb RIG.json
python tools/pack_rigged_hero.py ANIMATED.glb RIG.json assets/NEW-VERSION/HERO/packed
```

Use a sibling version directory, then point `tools/check_hero_animation.cjs` and the review page at the candidate. Both original and output paths must be distinct. The rig builder rejects fused arms. The packer externalizes the texture and preserves UV/accessor alignment; it does not enable an asset in the live manifest.

The current four candidates are reviewed in `audit/rpg-heroes.html?hero=pip` (also brick, ayla, lumi). The page uses the same animation and eye helpers as the game, loads the actual packaged GLB, and renders matching portrait PNGs. Converting these PNGs to WebP is a format conversion; portraits are not separate generated character art.

After visual and skin checks pass, update `assets/data/hero-models-v3.js`, add only the selected package and WebP portrait, and run the release checks documented in `audit/hero-rig-release.md`. Keep duplicate ZIPs and intermediate/rejected meshes out of deployment. Original local source meshes remain in each versioned hero directory for further editing.
