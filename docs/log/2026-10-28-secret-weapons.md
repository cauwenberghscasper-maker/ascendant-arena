# Six secret weapons at Garo's Forge (28 Oct 2026, branch `claude/secret-weapons`)

Casper: add more items to the game, high-end art.

- **What the player sees:** Forge › Craft, under each biome's set, a "Secret weapon" card with a glowing painted
  picture, one line of story (tap to read it all), its stats and recipe: the biome's ore, its dungeon core, Titan Souls
  (1 in the first biomes up to 3 in Celestial) and gold. Crafted only, never dropped or sold.
  Thornheart Blade (Woodlands, mythic), Rimecleaver (Peaks, mythic), Magmaheart Maul (Volcanic, mythic), Voidwhisper
  Sceptre (Arcane, ancient), Leviathan's Trident (Ocean, ancient), Dawnbringer (Celestial, divine). Fixed affixes a
  little above the biome's relic. Opens when you reach the biome (like the sets).
- Code: `CFG.craft.secret`, `secretCost`, `craftSecret` in `39-crafting.js`; card `secretHTML` in `61-panels.js`;
  picture via `it.sw` in `thumbFor` (`42-characters.js`). Saved items keep `sw`; no save change.
- Art: Hugging Face batch `hf-art-c1` (Z-Image Turbo), seed c23, sources in `assets/concepts/items/`, cut out and given a
  glow in the biome colour by `tools/secret_art.py` into `assets/ui/secret/<biome>.webp` (160 px like the set art).
- Check: `tools/check_secret.cjs` (in `npm run check`): 6 weapons, valid rarity/affixes, pictures, recipe, crafting pays
  and refuses without the biome or the cost.

Tested: `npm run check`; in the game (×100 test mode, level 339) crafted the Magmaheart Maul from the Craft tab, no errors.
Open: give each weapon its own special effect (e.g. Dawnbringer's crits flare); a "secret" hint before the biome opens;
the 20 Lanes gear pictures from the same batch are not used yet.
