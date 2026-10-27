# 14 more heroes shoot their own pixel-art ammo (27 Oct 2026, branch `claude/hf-hero-ammo`)

Casper: everything high end, more effects; use the Hugging Face quota.

- Hugging Face batch `hf-art-c1` (27 Oct, Z-Image Turbo, 111 pictures on `asset-drop:drop/hf-art-c1/`: ammo, 30 lair
  boss concepts, 8 pets, 20 Lanes gear, 12 secret weapons, 3 volcano) gave pixel ammo for 14 heroes. Picked one seed
  each (four `c41` came back as the service's "maybe not safe" placeholder; Kallix c23 and Moss c23 had a pink
  background/shadow), baked with `tools/bake_hero_fx.py` into `assets/fx/hero/ammo_<hero>.png`:
  Aurvan's crescent moon, Fenwick's claws, Hespera's cinder, Hob's bronze ring, Jory's keyring, Kallix's stolen flame,
  Moss's thread ball, Mott's wax seal, Nyssa's obol, Ophira's glass shard, Pyrrhos's bronze crescent, Sena's needle,
  Thimble's button, and Vell's four lost things (key, glove, umbrella, pocket watch: `ammo_vell0..3`, by `p.hv`).
- Wrenna's vial, Corrin's apple, Tychon's die and Kerberon's hound keep their 3D shapes (Casper liked them); their
  sprites were generated too (`drop/hf-art-c1/ammo_{wrenna,corrin,tychon,kerberon}_*`) if he wants them later.
- `AMMO_PIXEL` in `assets/data/hero-fx-v6.js` now has 23 heroes; variant ids (vell0..3) are preloaded too.

Tested: `npm run check`, smoke test passes locally; in-game shots for Hob, Kallix, Ophira, Vell: no errors, no missing art.
Open: integrate the rest of `hf-art-c1` (lair bosses -> TRELLIS 3D at the next quota, pets, Lanes gear pictures,
secret weapons, volcano). The CI smoke step has failed on `main` since 25 Oct although it passes locally.
