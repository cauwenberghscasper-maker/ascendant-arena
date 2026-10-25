# Dungeons: safe first hall, skill grades, treasure chests, dungeon gear (25 Oct 2026, PR #55; #53 was merged with only its claim commit)

Asked by Bart: "make dungeons more skill based, first room no enemies, more rewarding rewards. Chest can have heroes,
ores or gear. Also add more custom findable and craftable gear."

What changed for the player:
- **Safe first hall** in every dungeon (party dungeons and the world's Caves, Warrens and Sanctums; not the one-arena
  Trials). You arrive in an empty hall and its gate opens by itself, without a "hall cleared" line. World dungeons keep
  all their guarded halls (the empty hall is added in front); a party dungeon's start hall is now the empty one.
  `CFG.delve.safeStart`, `CFG.dungeon.safeStart`, `dungeonSafe()` in `36-dungeon.js`.
- **Skill over stats in party dungeons:** monsters have less health and hit harder (`CFG.delve.tough` hp 1.3 → 1.05,
  dmg 1.1 → 1.3). Every attack already shows its red wind-up, so dodging is what keeps you alive.
  - **Perfect Dodge:** a monster's shot, area hit or melee passing through you during a dash's safe moment gives back
    20% super charge and a toast (`delveDodge`, hooked where invulnerability skips a hit: `31-combat.js` projectiles,
    `aoeDamage`, `dealDamage`; `stepPendingAoE` in `33-world-sim.js`; `f.dashAt` marks the dash).
  - **Flawless hall:** clear a hall you walked into without taking a hit → a little gold on the spot and a toast;
    the boss hall counts too (`delveFlawless`).
  - **Run grade S/A/B/C** on the end chest from hits taken per hall (a burst within 0.3 s counts once; two Perfect
    Dodges cancel a hit), one grade lower per fall, B at best if you walked into fewer than half the halls. S: +2 items,
    rarity floor one step up, +60% gold, double treasure luck; A: +1 item, +30% gold; B: +10% gold. `CFG.delve.skill`,
    `delveGrade`. Shown as a card at the top of the chest screen.
- **More rewarding chests:** party dungeon end chest XP 0.5 → 0.75 of a level, gold, gems and shards up, treasure chest
  chance 15 → 25%. World dungeon chests: 3 items (was 2), XP 0.35 → 0.5, more gold and gems, case 10 → 15%.
- **Treasure: every dungeon chest rolls gear, ore or a hero** (`CFG.delve.treasure`, `rollDungeonTreasure`):
  - Gear: 2 extra pieces a rarity up and a 30% shot (sure after 12 gear rolls without one) at a named dungeon treasure.
  - Ore: the biome's ore, monster parts and cores, plus the dungeon's own gem in party dungeons.
  - Hero: 2-3 oaths for the biome's hidden hero (Fenwick, Lysandra, Kallix, Vell, Ione, Aurvan); once that one is
    yours, the party dungeon boss chest gives a locked hero outright. Weights: boss chest 50/38/12, side treasure rooms
    55/40/5, event caches 60/40/0, world dungeon chests 55/39/6 (oaths only). The grade's luck multiplies the hero share.
- **24 new dungeon pieces** (`CFG.delve.gear`, fixed affixes a little above a normal roll, like relics):
  - Found: two per dungeon, only from its chests (e.g. Gravekeeper's Amulet, Queen Rime's Hood, Forgemaw's Fang,
    Unread Page Charm, Mother's Pearl Amulet, Seraph's Feather Helm). Rarity follows the difficulty, never below the
    pieces dropped beside it. Logged in `profile.delve.found`.
  - Forged: two per dungeon in Garo's Forge › Craft, under the biome's set (a "Dungeon forge" card): made from the
    dungeon's gem (its rare veins, which had no use yet), the biome's core and ore, and gold. Epic (Crypt) to Ancient
    (Starfall). `craftForged`, `forgedCost`.
- Save: `profile.delve` keeps `found`, `upity` and `s` (S-rank clears) through `sanitizeProfile`; old saves load as
  before (empty).

Tested: `npm run check` (dungeon and delve checks updated for the safe hall; new checks for grades, hits, Perfect
Dodges, Flawless halls, treasure kinds, the named-treasure pity and S vs C chests), screenshots of the three chest
kinds and the Dungeon forge at 390×844 and 320×568 with no page errors, crafting a forged piece in the page.
`npm run smoke` could not run in this sandbox (its Chromium build fails "hero walks" on untouched `main` too); CI runs it.

Still open:
- Judge on a real phone: are dungeon fights fair at hp 1.05 / dmg 1.3, and is the grade too strict or too soft
  (`CFG.delve.skill.grades[].hits`)? Is the boss chest's 12% hero share too generous once heroes unlock outright?
- The named treasures use the shared slot icons; they deserve their own painted icons.
- A grade line or hit counter on the dungeon HUD during the run, and S-rank clears (`profile.delve.s`) on the Dungeons page.
