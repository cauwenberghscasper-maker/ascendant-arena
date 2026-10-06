# Generated menu icon pass

20 individually generated paintings replace the equipment and case portraits in the local game. Generated with the OpenAI built-in image_gen tool on 2026-10-06. No Hugging Face jobs or credit were used. This pass changes menu artwork, not gameplay meshes.

## Art direction

Refined fantasy pixel art with sculpted volume, strong silhouettes, dark outlines, upper-left lighting, steel and aged gold, and restrained jewel accents. Transparent images contain no baked-in frames, labels, particles or backgrounds. Each of the five cases has a distinct palette and design. Each of the fifteen equipment shapes has its own painting; existing rarity borders, labels and tier effects remain responsible for tier information.

- Cases: Milestone (violet/gold wings), Rift (obsidian/crystals), Colossus (stone/bronze horns), Treasure (wood/gold/sapphire), Hunter (green leather/teal metal).
- Weapons: Edge sword, Fang axe, Focus staff.
- Headgear: leather Cap, plate Helm, arcane Hood.
- Armor: leather Vest, steel Plate, fabric Robe.
- Boots: leather Boots, armored Treads, arcane Striders.
- Accessories: diamond Charm, ruby Ring, circular sapphire Amulet.

The original individual prompts and generated source filenames are preserved in [manifest.json](../assets/ui/premium-v2/manifest.json). A shared style prompt is included there along with each full subject prompt. One generation call was used per asset; the review gallery is only a presentation of completed images.

## Integration and budget

- Final assets: `assets/ui/premium-v2/*.webp`, 256 × 256 with preserved alpha, lossless WebP.
- Complete image payload: 1,160,482 bytes (1.11 MiB); largest image 80,668 bytes.
- Images load when their menus are used, without a bulk preload. Repeated item tiers share one shape image, allowing browser caching rather than generating hundreds of portraits.
- All twenty decoded RGBA images would occupy about 5 MiB before browser overhead; actual browser allocations and caching vary.
- `assets/art/premium-icons.js` selects static art. Known shapes return before procedural thumbnail rendering. Existing procedural portraits remain as a fallback for future unmapped shapes.
- Updated equipment tile sizing keeps square art inside its tile at small widths.
- Existing 3D models and combat rendering are unchanged by this pass. No claim of physical iPhone/Android FPS validation is made.

## Review and validation

Open `http://127.0.0.1:8765/audit/premium-icons.html` while the local server is running to inspect all artwork at 108 px and 48 px. The local game at `http://127.0.0.1:8765/` uses the new icons. The public GitHub Pages game is unchanged until these changes are published.

`tools/build_premium_icons.py` verifies real transparency, exports lossless files, reopens every file to validate decoding and dimensions, and records byte counts. It only resizes/encodes generated artwork; it does not repaint, remove backgrounds or invent assets.

`node tools/check_release.cjs` checks all 15 shapes across all 8 rarities, verifies their shipped files and all case mappings, enforces a 1.5 MB image budget, and parses the source modules. The test context provides no procedural renderer, so entering the procedural thumbnail path fails the check.

Browser review passed: every image in the full gallery decoded at 256px (40 displayed images, including duplicate 48px samples); all five case images loaded in the game at 76px; the hero menu showed generated artwork in its tiles, equipped rows, inventory and hero callouts. At 320 × 568, all five gear images were square and stayed within their tile bounds. At 390 × 844 the chest grid and hero panel remained readable.

Saved evidence: `generated-icon-collection.png`, `generated-cases-mobile.png`, `generated-gear-mobile.png`, and `generated-gear-small.png` in this directory. All 14 release checks passed and `git diff --check` passed. Physical device FPS and native app packaging remain outside this image pass.
