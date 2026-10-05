"""Prompts for the pixel-art item icons: 15 item shapes x 8 rarities (Z-Image-Turbo, Apache-2.0).

python3 tools/item_prompts.py            -> prints  key<TAB>seed<TAB>prompt  for every icon
Key = <slot>-<noun>-<rarity> (lower case), e.g. helmet-helm-mythic. Each rarity has its own theme,
so every tier looks clearly richer than the one below it.
"""
SHAPES = {
    'weapon':    {'edge': 'a short sword held diagonally, blade up', 'fang': 'a one-handed battle axe held diagonally', 'focus': 'a magic staff topped with a large orb, held diagonally'},
    'helmet':    {'cap': 'a rounded cap-style helmet with a short brim and a small crest, empty, nobody wearing it',
                  'helm': 'a closed knight helmet with a visor slit, front three-quarter view, empty, nobody wearing it',
                  'hood': 'an empty hooded cowl with a dark shadowed opening, nobody wearing it'},
    'chest':     {'vest': 'a sleeveless armored vest with buckled straps, empty, nobody wearing it',
                  'plate': 'a breastplate chest armor with two big round shoulder pauldrons, empty, no arms, nobody wearing it',
                  'robe': 'a long mage robe tunic with a sash belt and a mantle collar, empty, nobody wearing it'},
    'boots':     {'boots': 'a single tall boot with a folded cuff, side view', 'treads': 'a single heavy armored boot with a shin guard, side view',
                  'striders': 'a single light boot with small wings at the ankle, side view'},
    'accessory': {'charm': 'a crystal charm pendant hanging from a short chain', 'ring': 'a chunky ring with one large gemstone',
                  'amulet': 'a round medallion amulet on a chain'},
}
RARITY = {
    'common':    'humble worn gear: rough brown leather, frayed grey cloth, dull rusty iron, rope bindings and stitched patches, plain and scrappy',
    'uncommon':  'sturdy woodland ranger gear: forest green leather, polished light wood, clean steel, a leaf-shaped clasp',
    'rare':      'royal knight gear: polished silver steel with royal blue enamel, thin gold trim, a small sapphire',
    'epic':      'enchanted astral gear: midnight violet metal, glowing purple star-shaped gems, glowing magenta runes, gold filigree',
    'legendary': 'legendary dragon gear: gleaming gold and orange dragon scales, curved horns, a big glowing amber gem, ornate and heroic',
    'mythic':    'mythic vampire lord gear: black steel with glowing crimson blood crystals, bat-wing spikes, molten red cracks, menacing and oversized',
    'ancient':   'ancient titan relic gear: weathered bronze and stone with a glowing teal energy core, teal crystal shards, carved glowing glyphs, otherworldly',
    'divine':    'divine celestial angel gear: radiant white and gold with small feathered wings, a glowing golden halo, brilliant starlight gems, holy light rays, the ultimate item',
}
STYLE = ('pixel art RPG inventory item icon, 16-bit SNES game sprite, clean hand-placed pixels, crisp hard pixel edges, limited color palette, '
         'bold dark 1-pixel outline, light from the top left, 3 to 4 shading tones, chunky readable silhouette, single object centered, '
         'filling most of the frame, isolated on a plain solid {bg} background, no text, no frame, no border, no drop shadow, no hands, no person')
BG = {'divine': 'dark navy blue', 'ancient': 'white', 'mythic': 'white'}


def prompts():
    out = []
    for r_i, (rar, theme) in enumerate(RARITY.items()):
        for s_i, (slot, nouns) in enumerate(SHAPES.items()):
            for n_i, (noun, shape) in enumerate(nouns.items()):
                key = f'{slot}-{noun}-{rar}'
                seed = 7000 + r_i * 100 + s_i * 10 + n_i
                out.append((key, seed, f'{shape}, {theme}. ' + STYLE.format(bg=BG.get(rar, 'white'))))
    return out


if __name__ == '__main__':
    for k, sd, p in prompts(): print(k, sd, p, sep='\t')
