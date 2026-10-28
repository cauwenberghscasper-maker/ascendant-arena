# Real models for the volcano horizon and three pets (28 Oct 2026, branch `claude/volcano-pets`)

Casper: everything needs high-end assets; use the Hugging Face quota.

- Hugging Face batch `hf-3d-c2` (28 Oct, TRELLIS.2 at 1024, seed 7, from the `hf-art-c1` concepts): 20 models, all on
  `asset-drop:drop/hf-3d-c2/`: the volcano, 15 lair bosses and 4 pets.
- **Volcano:** the Volcanic Underworld's horizon now shows a painted rock cone with lava streaks instead of a tinted
  mountain (`assets/world/volcano`, 8.8k tris, 1024 texture; the game already swapped it in once the model exists).
  Scaled to 0.62 of the mountain size (it is ~2.5x wider) and untinted (`44-world-view.js`).
- **Pets:** the Ember Bull, Crystal Dragon and Stone Sprout are real models now (`assets/pet/<id>`, ~5.9k tris, 512
  textures, `pet.<id>` in `ASSET_MANIFEST`); `updateCompanion` already hides the code-built prototype once one loads.
  The slime came back from TRELLIS as a flat card: rejected, it keeps its prototype.
- **Lair bosses:** not used. Casper chose to keep today's animated bosses until the new models can be rigged
  (they would only bob and sway). The 15 models wait on `asset-drop` for the enemy rig pipeline (README, Blender bone heat).

Tested: `npm run check`; in the game (×100 test mode) bull, dragon and sprout follow the hero, no errors or missing files.
Open: rig the 15 lair boss models; a new slime concept (rounder, front view) for TRELLIS; look at the volcano from a
volcanic edge area on a phone.
