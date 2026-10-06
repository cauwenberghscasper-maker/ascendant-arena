# Collection expansion · 6 October 2026

The game now has 24 named equipment drops and three additional earned boss cases, using individually generated transparent artwork in the approved premium pixel style. These menu illustrations retain the existing 3D equipment families and combat rules.

## Content and progression

| Existing rarity | Named equipment | Minimum item level |
| --- | --- | --- |
| Common | Scrapfang Edge | 1 |
| Uncommon | Thornbite Fang | 1 |
| Rare | Frostbite Edge, Frostwarden Helm, Glacierguard Plate, Frostmarch Treads, Winterheart Charm | 10 |
| Epic | Voidcleaver Fang, Veilmantle Hood, Riftweave Robe, Voidstep Striders, Voidseal Amulet | 22 |
| Legendary | Sunspike Focus, Dawnguard Helm, Sunward Plate, Solarmarch Boots, Sunheart Ring | 36 |
| Mythic | Bloodreaver Fang | 64 |
| Ancient | Tidecaller Focus | 84 |
| Divine | Starfall Edge, Seraphcrown Helm, Heavenshield Plate, Skystride Striders, Seraphseal Amulet | 100 |

Existing rarity odds determine which tier drops. Then each qualifying earned drop has a 25% chance to become a named item. Three misses in the same slot and rarity guarantee a named item on the fourth eligible drop. Drops below the item-level requirement do not advance that counter. Case conversion and decorative reel previews never advance collection luck. Forging and local testing rewards do not count.

Names retain canonical equipment nouns so existing 3D mesh selection remains valid. Rolled item level, upgrade level, affixes, rarity perks, and base stat formulas remain intact. Named accessories have fixed thematic elements. The themes do not grant extra set bonuses or introduce new combat mechanics.

Menu › Collection exposes slot filters, all eight rarity labels, minimum levels, hunt hints and current guarantee progress. Discovery counts are permanent after salvage or merging; cards say **Found**, rather than implying the item is still owned. Save migration backfills valid equipped and bag items, retains existing records and sanitizes luck counters.

| New case | Earned from | Required region level |
| --- | --- | --- |
| Frostbound Case | Frost Colossus in Frost Peaks | 22 |
| Cinderforge Case | Magma Titan in Ember Wastes | 36 |
| Seraphic Case | Celestial Colossus in Celestial Spire | 84 |

These regional chests replace the generic Colossus Case for those bosses, use the killed boss's actual zone, and keep the Colossus Case rarity table, tier scaling and existing case guarantees. Other regions still grant Colossus Cases. A regional chest can roll equipment of different themes; it is not an exclusive themed loot pool. All cases are earned in play.

## Assets and performance

27 separate image generations were exported to 256 × 256 lossless WebP with alpha. Source prompts and master filenames are recorded in `assets/ui/collection-v1/manifest.json`. Pillow only resizes and encodes the generated art. No Hugging Face credit was spent.

- New assets: **1,511,052 bytes** in total; largest file 81,478 bytes.
- Combined old and new premium icons: **2,671,534 bytes**, 47 distinct assets.
- All 27 new images decoded simultaneously would occupy 6.75 MiB of RGBA pixel data.
- Collection cards use native lazy image loading. Menus use static file URLs; no procedural thumbnails, additional combat meshes or per-frame image generation are introduced.
- New count and level labels use the readable numeric font.

## Verified

- `node tools/check_release.cjs`: **21 checks pass**. Covers unique named definitions, noun-to-mesh compatibility, all 24 eligible rolls, fourth-drop guarantee, independent counters, minimum levels, save migration, permanent discovery, regional boss routing, unchanged regional rarity tables, phantom-discovery prevention, actual case consumption/winner identity, prior merge/mastery/resource/frame checks, all 47 asset paths and source parsing.
- `node audit/checks.cjs`: **14 boss lifecycle checks pass** with rendering doubles; malformed-save checks pass.
- Exporter reopens every new WebP and verifies dimensions and preserved alpha.
- Browser gallery: all 54 large/small image samples decode correctly.
- Actual game at **390 × 844**: two-column collection cards, 44px filter targets, no horizontal panel overflow; all eight chest icons decode and fit the three-column grid.
- Disposable save imported through the normal backup UI; collection records survive reload. A Frostbound Case consumes once and awards a named Frostwarden Helm; salvaging that duplicate preserves its discovery count.
- Original local test hero restored after testing. Live player saves and production were not used for these checks.

Screenshots: `collection-icon-gallery.png`, `collection-cases-mobile.png`, `collection-case-reward-mobile.png`, `collection-helmet-small.png`. The mobile screenshots use a disposable test profile.

## Remaining validation before release

This pass verifies menu art and source behavior, not native iOS/Android packaging or sustained phone FPS. The browser viewport override did not resize the game tab to 320px in this session; the new collection was directly measured at 390px. Physical device checks remain necessary.

The collection provides a hunt ladder; retention and revenue improvement are hypotheses. Playtest normal XP progression to measure time to first named item, time to the next rarity, case-opening frequency, duplicate merge usage, collection progress across sessions, and abandonment around the mastery gate. Rebalance only after those observations. Do not sell these cases as part of this pass.

Review changes on the existing `codex/mobile-release-polish` branch. Rolling back this expansion requires accounting for saves containing new regional case keys and collection records; preserve exported saves and map those case keys back to `boss` rather than discarding rewards.

