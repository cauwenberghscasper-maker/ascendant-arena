# Lanes gear gets painted pictures (28 Oct 2026, branch `claude/lanes-gear-art`)

Casper: everything needs high-end art; items must not look low quality.

- The 10 Ascendant Lanes gear pieces (Oakheart Seed, Mossy Wolf Fang, Greenwood Standard, Frostbound Sigil, Rimeglass
  Charm, Cinder Warbanner, Ember Crown Shard, Void Prism, Tidecaller Pearl, Starfall Banner) show a painted picture
  instead of a small glyph: in Forge › Craft (64 px), on the Lanes loadout slots and the equip buttons (36 px).
- Art: Hugging Face batch `hf-art-c1` (Z-Image Turbo; Oakheart Seed seed c41, the rest c23), sources in
  `assets/concepts/lanes_gear/`, cut out with a glow in each piece's colour by `tools/cutout_art.py` (general tool for
  generated item paintings on a plain background) into `assets/ui/lanes/gear/<id>.webp`. `lgArt` in `34c-lanes-gear.js`.

Tested: `npm run check`; Forge › Craft screenshot in ×100 test mode, no errors or missing files.
