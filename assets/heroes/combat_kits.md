# Ascendant Arena: Combat and VFX Kits

Attack kits for all 27 heroes in the codex, built for 2-4 player squads on mobile: a three-quarter top-down camera, a virtual joystick, a basic attack button, two skill buttons and a super button. The same data is in `combat_kits.json`, generated from the same source, so the two files always match.

## How to read this document

- **BA** means one basic-attack hit of that hero. Every damage, heal and shield number is a multiple of it. A hero's BA value comes from their tier (see the power curve below), so 2.0x BA on a Divine hero is worth more than 2.0x BA on a Champion.
- **Ranges and radii** are in metres. A hero is about 1.8 m tall. **Speeds** are in m/s. **Durations** and **cooldowns** are in seconds.
- **Clip names** refer to the Quaternius Universal Animation Library (UAL1 and UAL2, CC0). Names follow the pack's naming. Check exact spellings in the pack's animation viewer before import, because they differ slightly between versions.
- **mode** on each animation: `reuse as-is`, `retime` (speed, holds or trimming only), or `custom pose layer` (an additive or override layer on top of the base clip, such as a prop grip, a head tilt or a held pose).
- Every hero is a single mesh on the standard humanoid skeleton. Anything the skeleton can't do (heads, snakes, tails, wings, villages, shadows) comes from props attached to named bones, texture swaps, vertex shaders or VFX. Each case is called out in the hero's section.

## 1. Roster plan: team classes and attack styles

No two heroes share the same primary class and basic attack style. Every tier mixes several classes.

| # | Hero | Tier | Primary class | Secondary | Basic attack style | Team job |
|---|---|---|---|---|---|---|
| 1 | **Wrenna Vael** | Champion | Damage: artillery/mage | Control: zones | Lobbed arc | Long-range flood artillery. Anything your frontline stuns or roots in place, Wrenna drowns for double damage. |
| 2 | **Hob Tallagh** | Champion | Control: stuns | Frontline: bruiser | Melee chain | A stun clock everyone can wind: every hit from Hob or his squad tolls, and the seventh toll freezes the fight. |
| 3 | **Corrin Ashgraft** | Champion | Support: healer | Frontline: tank | Lobbed arc | A walking orchard: Corrin's missed shots become healing fruit on the ground, and he can root in place to anchor a fight. |
| 4 | **Brother Mott** | Champion | Support: shielder | Specialist: summoner (candles) | Cone spray | A candle-bearing shield battery: every candle Mott lights is a shield on the squad, and his seals can make an ally's promise to live come true for two seconds. |
| 5 | **Nyssa Obel** | Champion | Damage: assassin/diver | Specialist: mobility enabler | Bouncing / ricochet | Marks a target, harvests coins from it as the squad hits it, then spends the coins to ferry herself and her allies across the arena. |
| 6 | **Pyrrhos** | Champion | Frontline: tank | Control: displacement | Melee chain | A bronze wall that patrols: he lays guarded ground, throws cover boulders for the backline, and lets a teammate hammer his nail back in for a team shield. |
| 7 | **Moss** | Champion | Control: walls | Specialist: terrain-shaper | Boomerang / return | Builds the maze: enemies get boxed in, while Moss's allies follow his red thread straight through the walls. |
| 8 | **Ione** | Champion | Support: buffer | Support: cleanser | Ally-targeted buff / heal (dual-use homing notes) | Speed for the whole squad and a song that pulls a trapped ally home: Ione decides how fast her team moves and who gets out alive. |
| 9 | **Fenwick Marl** | Champion | Damage: skirmisher | Frontline: bruiser | Dash / leap strike | A late-game hunter: he tags a target for the whole squad, leaps onto it, and gets stronger the longer the match goes. |
| 10 | **Thimble** | Champion | Specialist: mobility enabler | Specialist: saboteur | Aimed skillshot line | Moves people: he swaps an ally out of danger, opens fairy-ring portals for the squad, and swaps the enemy carry into the middle of your team. |
| 11 | **The Unwritten** | Champion | Frontline: bruiser | Flex: the day's word (dive, tank, damage or sustain) | Transform / stance swap | A clay bruiser that becomes whatever the squad needs today: brave, patient, angry or hungry. It can lend its word to an ally, and its super writes that word onto the whole team. |
| 12 | **Lysandra Kole** | Legendary | Frontline: peeler | Control: stuns (petrify) | Charge-and-release | A bodyguard with stone hands: she blocks shots aimed at the carry, chisels allies free of crowd control, and turns a diving team into a garden of statues. |
| 13 | **Kallix** | Legendary | Specialist: saboteur | Damage: mage | Chain lightning-style jump | Steals the enemy's best ability for his team and sets fire to anything the squad has tied, sealed or grouped together. |
| 14 | **Oko** | Legendary | Damage: marksman | Control: blind and reveal | Hitscan beam / channel | The squad's lighthouse: long-range beam damage, a sweep that reveals and blinds, and a passive that shows allies enemy skillshots before they're thrown. |
| 15 | **Madame Ysolt Crane** | Legendary | Damage: skirmisher (drain duelist) | Specialist: saboteur/debuffer | Pull / hook | Puts a debt on the enemy everyone is hitting, then collects it as damage and healing for the squad. She also cuts enemy healing. |
| 16 | **Sir Halven** | Legendary | Support: buffer | Frontline: bruiser | Cleave arc | A bruising herald who throws his own head as a lookout: his squad gets early warnings, damage reduction, a rally horn and a royal decree. |
| 17 | **Sena** | Ascendant | Control: tethers and binds | Damage: executioner | Tether between units | Ties enemies to each other and to her fingers. She can hold an ally's thread so they can't die, and her super cuts one enemy's thread for good. |
| 18 | **Jory Ashby** | Ascendant | Support: cleanser and reviver | Damage: executioner | Boomerang / return | Death's stand-in on your side: he hands out second lives, rewinds allies out of a bad two seconds, and for a few seconds can stop anyone on his team from dying. |
| 19 | **The Sleeper** | Ascendant | Control: zones | Frontline: tank | Ground zone / puddle | Turns the floor into sea: every swing leaves slowing water, it drags enemies into the deep end, and its super floods the whole arena for your squad. |
| 20 | **The One Who Came Down** | Ascendant | Specialist: terrain-shaper | Frontline: tank | Wall or terrain | Builds marble stairs on the battlefield: high ground and safety for the squad, knock-ups for enemies, and a super that carries the whole team up the sky-stair and drops them wherever they choose. |
| 21 | **Vell** | Divine | Specialist: trapper | Control: displacement (banish) | Homing | Takes enemies out of the fight for a while: his traps put them in his coat, and he gives back the cooldowns and health your squad has lost. |
| 22 | **Hespera** | Divine | Damage: artillery/mage | Control: zones | Charge-and-release | The heaviest hitter on the field: she slings burning cinders, cages enemies in a ring of dusk, and can drop the dead sun anywhere on the map. Anything the squad holds still, she can hit. |
| 23 | **Old Kerberon** | Divine | Specialist: summoner/pets | Frontline: tank | Pet / summon | The gate-dog of the dead: he sets a pack of ghost hounds on whoever threatens the squad, guards a gate nobody gets through, and when all three heads wake, he becomes three fighters at once. |
| 24 | **Ophira** | Divine | Support: shielder | Control: stuns (gaze) | Bouncing / ricochet | Turns her allies into mirrors: enemy shots bounce back off them, her glass shards ricochet off them, and her gaze stops anyone who runs straight at the squad. |
| 25 | **Tychon** | Divine | Damage: mage (gambler) | Support: buffer (luck) | Trap / mine | A god of luck who lost his own: every one of his attacks is a dice roll, and his squad can push the odds by standing next to him and blowing on the dice. |
| 26 | **Aurvan** | Divine | Control: pulls | Damage: mage | Cone spray | Pulls the whole enemy team into one place with moon-tides, so every area move his squad owns hits everyone. His kit changes as the arena's moon waxes and wanes. |
| 27 | **Ourax** | Divine | Frontline: tank | Specialist: summoner (village militia) | Cleave arc | A walking hill with a village on it: he shelters the squad under his corner of the sky, his villagers shoot from his shoulders, and his super hands the sky to an enemy. |

### Class spread by tier

| Tier | Frontline | Damage | Support | Control | Specialist |
|---|---|---|---|---|---|
| Champions | Pyrrhos, The Unwritten | Wrenna, Nyssa, Fenwick | Corrin, Brother Mott, Ione | Hob, Moss | Thimble |
| Legendary | Lysandra | Oko, Madame Ysolt Crane | Sir Halven | - | Kallix |
| Ascendant | - | - | Jory | Sena, The Sleeper | The One Who Came Down |
| Divine | Ourax | Hespera, Tychon | Ophira | Aurvan | Vell, Old Kerberon |
| **Total** | 4 | 7 | 6 | 5 | 5 |

### Attack styles used

Basic attacks: Aimed skillshot line (1); Ally-targeted buff / heal (1); Boomerang / return (2); Bouncing / ricochet (2); Chain lightning-style jump (1); Charge-and-release (2); Cleave arc (2); Cone spray (2); Dash / leap strike (1); Ground zone / puddle (1); Hitscan beam / channel (1); Homing (1); Lobbed arc (2); Melee chain (2); Pet / summon (1); Pull / hook (1); Tether between units (1); Transform / stance swap (1); Trap / mine (1); Wall or terrain (1).

Skills and supers add pulls and hooks, tethers, walls, zones, traps, ally buffs, auras, dashes and transforms on top, so every hero mixes at least three styles across their kit.

### Power curve

| Tier | BA damage | HP | Typical super | Super charge time (target) |
|---|---|---|---|---|
| Champion | 100 | 1.0x | 2-4.5x BA, one team-fight effect | about 45 s of active play |
| Legendary | 108 | 1.1x | 2-4x BA plus a strong secondary effect | about 50 s |
| Ascendant | 116 | 1.2x | rule-bending effects (execute timers, no-death zones, arena flood, team lift) | about 60 s |
| Divine | 125 | 1.3x | arena-scale moments (banish, global sun drop, mirror hall, three heads, moon tide, sky pin) | about 70 s |

Ascendant and Divine supers are bigger, but every one has a readable warning of at least 0.5 s and a specific counter, listed in each hero's section.

## 2. Readability rules (apply to every effect below)

- **Ally versus enemy tint.** Anything that harms enemies is drawn, for the enemy players, with a red rim (`#E03A3A`, 3 px screen-space outline on decals, a red fresnel on meshes). Friendly effects use the caster's palette with a soft white outline. The same zone is rendered two ways depending on the viewer's team.
- **Telegraphs.** Every move that can hit for more than 1.5x BA, or that applies a stun, root, pull or knock-up, shows a red-rimmed ground shape for at least 0.2 s (basics) or 0.3 s (skills). Supers have 0.5-2.5 s warnings.
- **Own-squad dimming.** With 4 allies on screen, allied basic-attack VFX are drawn at 70% opacity and 60% particle count on other players' screens. Your own hero's effects are always full strength.
- **Status icons** sit in a fixed slot above the head (toll rings, debt numbers, name tags, coins on the eyes), so a crowded fight still reads at a glance.

## 3. Heroes

## Champions

### Wrenna Vael, the Drowned Cartographer

**Class:** Damage: artillery/mage / Control: zones  
**Basic style:** Lobbed arc  
**Team job:** Long-range flood artillery. Anything your frontline stuns or roots in place, Wrenna drowns for double damage.  
**Palette:** drowned teal skin `#5FA3A0`, sea-glass `#3F7F86`, parchment coat `#D8CCAA`, map ink `#2F3236`, sextant brass `#C9A13B`, salt foam `#F2F4EE`, vial seawater `#2E6E6A`

#### Basic attack chain

##### Hit 1: Street Vial (Lobbed arc)

- **Cast:** UAL OVERHAND_THROW retimed to an underhand lob: her left hand thumbs the cork off a vial on the bandolier at her hip, and her right hand lobs it from hip height with a flick of the wrist. Her head tilts so the sextant monocle lines up with the target.
- **Projectile / strike object:** A corked glass vial of green-black seawater with a tiny paper street label tied to the neck (Tanner's Row, Lamplight Steps, Kelp Market). The vial spins end over end and the water sloshes inside: a two-layer mesh with an animated inner liquid plane.
- **Flight:** High arc, 14 m/s, apex 2.5 m. Droplets fall from the open neck along the way, and a thin dotted ink line is drawn on the ground under the arc like a route on a chart (decal ribbon, fades in 0.6 s). Sound: glass clink, slosh, then a gull-like squeak of the cork.
- **Impact:** The glass bursts into a 2 m crown splash of seawater with salt-foam lace at the rim. It leaves a wet ground decal printed with faint depth soundings (small numbers and a compass tick) that dries out from the edges over 1.5 s.
- **Target reaction:** The target flinches back and turns its face away from the splash. It is now Soaked: a glossy darkened wet-sheen shader on the body, with water dripping from the elbows and chin (2 drip emitters on hand and head bones).
- **Numbers:** Range 9 m, splash radius 2 m, 1.0x BA, 1.1 attacks/s. Applies Soaked for 3 s.
- **Telegraph:** Enemies see a small red-rimmed landing circle 0.35 s before impact.
- **Team use:** Soaked marks targets for the whole team: Wrenna's Sounding deals +30% to Soaked targets, and Kallix's fire cannot ignite Soaked targets, so call it.

##### Hit 2: Brackish Pair (Lobbed arc)

- **Cast:** Mirror of hit 1 with the other hand: she uncorks two vials at once with her teeth-side hand and lobs them so they leave the hand 0.12 s apart. Base UAL OVERHAND_THROW mirrored, with a slight hop at the start.
- **Projectile / strike object:** Two smaller vials with their labels fluttering. One is clear seawater, the other cloudy with harbour silt (a brown-green tint), so the pair reads as two different streets.
- **Flight:** Two slightly offset arcs at 14 m/s that land 0.7 m apart, side by side. Twin dotted ink routes cross on the ground like a navigator's cross-bearing. Sound: a double clink, a beat apart.
- **Impact:** Two overlapping 1.6 m splashes. Where they overlap, the decal shows a crossed X like a fix on a chart.
- **Target reaction:** A stumble back half a step. A target already Soaked gets a second drip layer and slows 10% for 1 s.
- **Numbers:** Range 9 m, each splash radius 1.6 m, 0.65x BA per vial (1.3x if both hit).
- **Telegraph:** Two small red landing ticks.
- **Team use:** The cross-bearing X shows allied artillery (Hespera, Ourax's militia) where a slow, wet target will be standing.

##### Hit 3: Depth Charge (Lobbed arc)

- **Cast:** She pulls the heaviest vial from the strap across her chest, raises it to eye level and peers at the target through the sextant monocle for 0.2 s (additive head tilt and right-hand hold), then heaves it overhead. Base: UAL OVERHAND_THROW with a 0.2 s pose hold at the top.
- **Projectile / strike object:** A fat squat bottle wrapped in fishing twine with a lead sounding weight tied to its base, so it falls bottom-first.
- **Flight:** Tall arc, 12 m/s, apex 3.5 m. The bottle turns to drop bottom-first on the way down, trailing a knotted sounding line (ribbon with knot sprites every 0.5 m). Sound: a low whistle that drops in pitch as it falls.
- **Impact:** It lands, sits for 0.3 s while the fathom knots tick, then erupts as a 1.8 m tall geyser column of seawater (cylinder mesh with a scrolling water shader and a foam crown flipbook). It leaves a 2.5 m puddle decal for 2 s.
- **Target reaction:** The target is launched in a short knock-up (0.4 s), arms flung up, and lands on its back foot. It gets Soaked plus a ring of salt crust on its boots for 1 s (slowed 20%).
- **Numbers:** Range 10 m, radius 2.5 m, 1.6x BA, knock-up 0.4 s, slow 20% for 1 s.
- **Telegraph:** Red-rimmed circle with three fathom ticks that count down over 0.3 s.
- **Team use:** The knock-up is long enough for Hob's Founder's Hammer or Lysandra's charged Chisel Split to land cleanly on the airborne target.

#### Skills

##### Sounding (Ground zone (delayed))

- **Cast:** She swings a lead plumb-bob on a knotted line from her belt twice around her hand (UAL Spell_Simple_Enter with the right arm replaced by a sling loop) and casts it. Her map tattoos flare along her forearm as the line pays out.
- **Projectile / strike object:** A lead sounding weight on a knotted rope. Where it lands it plants a compass-rose decal on the ground: a brass-gold rose with depth numbers around the rim.
- **Flight:** A fast flat arc at 18 m/s. The rope ribbon follows it from her hand and snaps loose on landing. On the ground, the compass rose fills with water from the rim inward over 3 s while its numbers tick down 3, 2, 1 fathoms. Sound: the creak of a ship's timber, then a rising sea swell.
- **Impact:** After 3 s the sea comes back: a 4 m wide column of green water erupts and crashes outward in a ring wave (ring mesh with a vertex-offset wave and a foam flipbook rim). It leaves Flooded ground for 4 s: a dark teal decal with drowned cobblestones showing under the water, which slows enemies.
- **Target reaction:** Caught enemies are slammed down and back, away from the centre (0.35 s stagger) and Soaked. Flooded ground shows on them as water lapping up to the shins (a height-clamped wet mask on the legs).
- **Numbers:** Cast range 11 m, radius 4 m, 3.0x BA, delay 3 s, cooldown 9 s. Flooded ground lasts 4 s and slows 25%. Double damage on Stunned or Rooted enemies, +30% on Soaked.
- **Telegraph:** Enemies see the compass rose with a red rim and a visible countdown. Allies see it in teal with a soft white outline.
- **Team use:** The squad's job is to keep someone on the rose for 3 s. Hob's seventh toll, Corrin's roots, Moss's maze box, Sena's Knot and Aurvan's Tidal Pull all turn Sounding into a double-damage flood.

##### Rip Current (Ground zone (conveyor lane))

- **Cast:** She drags a black-tipped finger down her tattooed forearm, tracing the seabed route, then flings the hand out along the ground. Base: UAL Spell_Simple_Shoot with a low crouched lean, the casting arm swept horizontally.
- **Projectile / strike object:** A 10 m by 2.5 m current lane: a scrolling decal of map lines with arrowheads and running foam streaks.
- **Flight:** Appears instantly along the aimed line and scrolls in the cast direction at 6 m/s. Floating paper street labels and kelp ribbons ride the current. Sound: a rushing undertow.
- **Impact:** Enemies standing in the lane are dragged 4 m along it over 1 s, then dropped. The lane fades after 3 s, leaving a wet streak decal.
- **Target reaction:** Dragged enemies skid with their feet sliding, arms windmilling (UAL SLIDE clip on the victim, driven by the lane), and kelp wraps their ankles as a sprite overlay.
- **Numbers:** Length 10 m, width 2.5 m, lasts 3 s, displacement 4 m over 1 s, cooldown 12 s. Allies moving with the current get +35% move speed.
- **Telegraph:** Red-rimmed lane for enemies with arrows showing the drag direction. Allies see a teal lane with soft white arrows.
- **Team use:** Aim it at your own Sounding to wash enemies onto the rose, or behind your squad as an escape conveyor. Wrenna rides it too (+35% speed).

#### Passive: Tidemark

Her hits apply Soaked. Every 4th hit on a Soaked enemy takes 1 s off Sounding's cooldown. Below 30% HP her vials splash 25% wider, because the sea is pulling her closer.

*Visual tell:* The seabed map tattoos visibly crawl along her arms toward the nearest Soaked enemy. The brass sextant on her brow turns to show how close she is to death, and its lens slowly fills with seawater as her HP drops, so allies can read her health at a glance.

#### Super: The Night Lirr Sank

> The camera dips slightly as Wrenna fans out seven vials. A close shot of her face shows the sextant arm spinning wildly. She uncorks them all and pours, and the ground in front of her becomes Lirr: ghost-blue streets, harbour steps, a church roof. For one second the whole street map lies flat on the arena floor. Then the sea that took it stands up as a wall of green water full of the outlines of fishing boats and rolls forward. Where it meets stone it breaks white, and anyone carried into that stone is left lying in kelp and wet paper labels.

- **Style:** Ground zone into tidal wave (line push)
- **Cast:** She pulls every vial from the bandolier and both coat pockets, a fan of seven bottles between her fingers. She holds them overhead, uncorks them all with one sweep of the thumb, and pours them out in front of her.
- **Strike object:** Seven streams of seawater, one per street of Lirr, that pool into ghost-blue outlines of the drowned city's streets and rooftops on the ground (a decal atlas of the Lirr street map), then lift into a 14 m wide tidal wave carrying the half-transparent silhouettes of fishing boats.
- **Flight:** First the map unrolls forward along the ground over 0.8 s. Then the wave rises 3 m and travels 16 m in the aimed direction at 12 m/s, curling forward with foam spray and gulls (sprite flock). Sound: a harbour bell muffled underwater, then a roar.
- **Impact:** Everything it passes is left as Flooded ground for 5 s. Where the wave hits a wall, terrain or another hero's structure, it breaks in a huge white foam burst and stops there.
- **Target reaction:** Enemies are swept up and carried, tumbling, until the wave ends or hits a wall. A carry that ends against terrain stuns for 1.2 s, and the victims stay Soaked with kelp and paper labels stuck to them.
- **Numbers:** Width 14 m, travel 16 m, 4.5x BA to each enemy hit plus 1.5x if slammed into terrain, displacement up to 8 m, wall-stun 1.2 s, Flooded ground 5 s.
- **Telegraph:** The street map unrolling on the ground is a 1.2 s warning. Enemies see a red-rimmed horizon line across the wave's path.
- **Team use:** Allies inside the wave ride it (Riding the Tide): they are carried at the same speed with a 1.0x BA shield and can still act. Aim it at a Moss maze wall, Camedown's stair or Pyrrhos's boulder to turn the push into a team stun.
- **Charge:** Charge is measured in Fathoms: +1 for each Soaked enemy hit by a basic, +4 for each enemy caught in Sounding, +8 for a Sounding on a Stunned or Rooted enemy. 100 Fathoms fills the super. On her body, the tattoos fill with glowing teal ink from the fingertips up to the collarbone. On the HUD, the super button is a sextant whose arc fills.
- **Counterplay:** 1.2 s windup with the street map unrolling as a giant warning. The wave stops at terrain, so any wall, stair or boulder behind you is safe ground. Dash sideways out of the 14 m width. Wrenna is rooted for 2 s while she pours.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-1.2 s | UAL Spell_Simple_Enter into Spell_Simple_Idle_Loop | Both arms come up with a fan of vials in each hand, held 0.4 s longer, chest arched back. Additive head tilt so the sextant faces the camera. | Tattoos flare teal. The street map decal unrolls forward from her feet. | 7-vial fan prop on the right hand bone, 2 vials on the left. | Corks popping in sequence; a muffled underwater harbour bell. |
| Action | 1.2-2.0 s | UAL Spell_Simple_Shoot, mirrored and layered on both arms | Both arms sweep down and forward to pour, the torso pitched forward, one foot stepping in. | Seven water streams (ribbons) pour onto the map. The wave mesh rises behind the map. | Vial fan props emptied (inner liquid planes scaled to zero). | A deep inhale of sea wind, rising to a roar. |
| Impact | 2.0-3.4 s | Hold the last pose of Spell_Simple_Shoot | Hold the pose while the wave travels. Her hair and coat hem blow forward (vertex wind shader on the hem only). | Wave travels 16 m with a foam rim flipbook, boat silhouettes and a gull flock. Foam burst wherever it meets terrain. | None. | Crash; timbers groaning; gulls. |
| Recovery | 3.4-4.2 s | UAL Fixing_Kneeling retimed to 0.8 s | She drops to one knee and wrings out her sleeve, then rises. | Drips from her sleeves. The tattoo glow fades back to the passive state. | Empty vials vanish back to the bandolier. | Trickling water; a single distant bell. |

#### Body language

- **Locomotion:** Waterlogged walk: a slightly heavy heel strike with the coat hem swinging late (cloth weight faked by a vertex wind shader on the hem). Her run leans forward with her left hand clamped over the vial bandolier so it doesn't clink. Base: UAL Jog_Fwd_Loop with an additive left-arm hold.
- **Idle:** Checks the sextant by tapping it with one fingertip, traces a tattoo line moving on her forearm, and once in a while tilts her head to shake water out of one ear. Base: UAL Idle_Loop with additive arm and head layers.
- **Hit reaction:** A sharp flinch back with water spurting from her mouth and collar (a 6-frame flipbook) and the sextant lens fogging for 0.3 s. Base: UAL Hit_Chest.
- **Death:** She drops to her knees, then falls forward. Her body dissolves into a spreading puddle of seawater (dissolve shader into a puddle decal) with the map tattoos floating on its surface as ink lines. The brass sextant is left lying on the wet ground and clicks to zero. Base: UAL Death01 with a dissolve from 0.6 s.
- **Victory:** She unrolls a chart (prop scroll), marks an X on it with an inky fingertip, then looks out to sea through the sextant. Base: UAL Interact retimed into Idle_Loop.

#### Team combos

- **With Hob Tallagh:** Hob's seventh toll stuns everything around him. Wrenna's Sounding lands on the stunned group for double damage. Hob's lore is that he avoids her, so the combo is also a story beat.
- **With Sena:** Sena ties two enemies together with Knot. Sounding hits one of them and the thread drags the other onto the rose; both take the flood.
- **With Moss:** Moss boxes enemies in with Maze Walls. The Night Lirr Sank drives them into the walls for the terrain stun.
- **With Aurvan:** Aurvan's Tidal Pull clusters enemies. Sounding lands on the cluster, which can't walk off the rose in time.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `wrenna_idle` | UAL Idle_Loop | custom pose layer | Additive sextant tap, tattoo trace and ear-shake layers on a random 6-10 s timer. |
| `wrenna_walk` | UAL Walk_Loop | retime | Slowed 8% with a heavier heel strike. |
| `wrenna_run` | UAL Jog_Fwd_Loop | custom pose layer | Left arm clamped over the vial bandolier. |
| `wrenna_sprint` | UAL Sprint_Loop | reuse as-is | Coat hem handled by the vertex wind shader. |
| `wrenna_dodge` | UAL Roll | retime | Faster by 10%; ends in a crouch with one hand on the ground. |
| `wrenna_basic_1` | UAL OVERHAND_THROW | retime | Underhand lob from hip height with the release frame moved earlier; left hand thumbs the cork. |
| `wrenna_basic_2` | UAL OVERHAND_THROW | custom pose layer | Mirrored, with a small hop at the start and two release frames 0.12 s apart. |
| `wrenna_basic_3` | UAL OVERHAND_THROW | custom pose layer | A 0.2 s sextant-aim hold at eye level, then a two-hand overhead heave. |
| `wrenna_skill_sounding` | UAL Spell_Simple_Enter + Spell_Simple_Shoot | custom pose layer | Right arm replaced by a two-loop sling swing, then a cast release. |
| `wrenna_skill_rip_current` | UAL Spell_Simple_Shoot | custom pose layer | Crouched lean with the casting arm swept low and horizontal. |
| `wrenna_super_night_lirr_sank` | UAL Spell_Simple_Enter / Spell_Simple_Idle_Loop / Spell_Simple_Shoot / Fixing_Kneeling | custom pose layer | Four-beat chain described in the super beat sheet. |
| `wrenna_hit` | UAL Hit_Chest | reuse as-is | Water spurt flipbook added in VFX. |
| `wrenna_death` | UAL Death01 | reuse as-is | Dissolve shader from 0.6 s onward. |
| `wrenna_victory` | UAL Interact into Idle_Loop | custom pose layer | Scroll prop unrolled; the sextant-look pose is held. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `wrenna_vial_street` | projectile mesh | Small glass vial, about 300 tris, with an inner animated liquid plane in #2E6E6A and a cream paper tag; it tumbles end over end. |
| `wrenna_vial_depth` | projectile mesh | A squat twine-wrapped bottle with a lead weight; drops bottom-first. |
| `wrenna_ink_route` | ground ribbon decal | Dotted map-ink line (#2F3236) drawn under each arc; it fades in 0.6 s. |
| `wrenna_splash_crown` | impact flipbook | 8-frame crown splash, green-black water with a white foam lace rim. |
| `wrenna_soundings_decal` | decal | A wet patch printed with depth numbers and a compass tick; it dries from the edges over 1.5 s. |
| `wrenna_geyser` | spawned mesh + flipbook | 1.8 m cylinder with a scrolling water shader and a foam crown flipbook on top. |
| `wrenna_compass_rose` | decal | Brass-gold compass rose with a ring of fathom numbers. It fills with water over 3 s. Red rim to enemies, white outline to allies. |
| `wrenna_ring_wave` | spawned mesh | Ring mesh with a vertex-offset wave and a foam flipbook rim; it expands to 4 m in 0.4 s. |
| `wrenna_flooded_ground` | decal | Dark teal water with drowned cobblestones underneath; animated normal ripples. Lasts 4 s. |
| `wrenna_rip_lane` | decal | Scrolling map lines and arrowheads with foam streaks and floating paper labels. |
| `wrenna_soaked_overlay` | status overlay | Glossy darker wet shader on the victim, with drip emitters on the hand and head bones. |
| `wrenna_lirr_map` | decal atlas | Ghost-blue line art of the drowned city's streets, rooftops and harbour steps, 14 m wide. |
| `wrenna_tidal_wave` | spawned mesh | A 14 m curved sheet with a scrolling water shader, foam rim, transparent boat silhouettes and a gull sprite flock. Fallback: a flat scrolling-texture quad wall at 50% particle count. |
| `wrenna_tattoo_glow` | material mask | An emissive mask on the arm tattoos that fills from the fingertips to the collar as the super charges. |

---

### Hob Tallagh, the Bellwright

**Class:** Control: stuns / Frontline: bruiser  
**Basic style:** Melee chain  
**Team job:** A stun clock everyone can wind: every hit from Hob or his squad tolls, and the seventh toll freezes the fight.  
**Palette:** verdigris `#3E8C77`, bell bronze `#A8773A`, dark bronze `#5B4A2E`, apron leather `#5A3423`, skin `#E0A27F`, crack black `#1C1C1C`, toll gold `#F2C14E`

#### Basic attack chain

##### Hit 1: Clapper Jab (Melee chain)

- **Cast:** A short left jab driven from the shoulder. The bronze bracer's bell-mouth nozzle points at the target. Base: UAL Punch_Jab with the fist held 1 frame on contact.
- **Projectile / strike object:** A visible bronze sound-ring: a thin torus that pops out of the bracer's bell-mouth at the fist, flecked with verdigris chips.
- **Flight:** The ring expands from 0.3 m to 1.4 m over 0.2 s, travelling 2.2 m forward from the fist, with green dust shed from its rim. Sound: a short, bright toll (pitch C).
- **Impact:** A puff of bronze dust and a ring-shaped ripple pressed into the target's armour. There is no ground decal.
- **Target reaction:** The head snaps back 10 degrees and the body rocks back on its heels. A small bronze ring appears orbiting above the head as the first toll counter.
- **Numbers:** Range 2.2 m, 1.0x BA, 1.4 hits/s. +1 toll.
- **Telegraph:** None (fast melee).
- **Team use:** Every toll counter is shared, so allies hitting the same target keep the count climbing.

##### Hit 2: Clapper Cross (Melee chain)

- **Cast:** A right cross with a full hip turn; the cracked helmet dips with the punch. Base: UAL Punch_Cross.
- **Projectile / strike object:** A double sound-ring, two concentric bronze tori a beat apart, with verdigris flecks spinning off.
- **Flight:** Rings expand to 1.6 m over 0.25 s, 2.4 m forward. Sound: two tolls a third apart (C, E).
- **Impact:** A bronze dust burst. The second ring's ripple is visible on the ground for 0.4 s.
- **Target reaction:** A twist away from the punch (a rotational stagger). A second ring joins the orbit above the head.
- **Numbers:** Range 2.4 m, 1.1x BA. +1 toll.
- **Telegraph:** None.
- **Team use:** Fast toll building for the seventh-toll stun.

##### Hit 3: Founder's Hammer (Melee chain (ground slam))

- **Cast:** Both fists come up over the helmet, clasped, and slam into the ground. Hold the top of the windup 0.15 s. Base: UAL Sword_Attack overhead slash with empty clasped hands, blended with MELEE_JUMP_LAND for the impact crouch.
- **Projectile / strike object:** A bell-shaped shockwave: a translucent bronze dome (half-bell mesh) that rises 1 m from the impact point and then cracks along one seam.
- **Flight:** The dome rises and expands to 2.5 m over 0.3 s, then a jagged crack runs up its side and it shatters into bronze shards. Sound: a deep bell clang followed by a cracked buzz, the sound of a flawed bell.
- **Impact:** A radial crack decal with green verdigris staining in the seams, lasting 2 s.
- **Target reaction:** Enemies are knocked back 1.5 m and look dazed, hands to their ears. A third ring joins the toll orbit.
- **Numbers:** Radius 2.5 m, 1.5x BA, knock-back 1.5 m. +1 toll on everyone hit.
- **Telegraph:** A 0.25 s bronze glow at Hob's fists before the slam.
- **Team use:** AoE toll building: one slam on three enemies is three tolls of progress.

#### Skills

##### Casting Pour (Cone spray)

- **Cast:** Hob grabs a founder's ladle from the rope belt at his hip (prop, attached to the right hand bone) and sweeps it in a low arc, flinging molten bronze. Base: UAL HARVEST swing (a farming scythe sweep) retimed 20% faster.
- **Projectile / strike object:** Molten bronze droplets, glowing orange-gold, that cool to green-brown as they fly.
- **Flight:** A 70-degree cone, 6 m, at 15 m/s. Each blob trails smoke and a heat shimmer (refraction sprite), and the colour shifts from #F2C14E to #3E8C77 over the flight. Sound: a hiss, then hammer taps.
- **Impact:** Bronze splatters harden on the ground into a rough metal crust decal for 3 s.
- **Target reaction:** Enemies hit are Rooted: a bronze shell climbs up their feet to the ankles (a height-masked metallic shader) and their legs lock in place.
- **Numbers:** Cone 6 m by 70 degrees, 1.4x BA, Root 1.2 s, cooldown 10 s. +1 toll per enemy hit.
- **Telegraph:** A red-rimmed cone flashes 0.2 s before the throw.
- **Team use:** Rooted counts as hard CC for Wrenna's Sounding (double damage) and keeps targets inside Hespera's Dusk ring.

##### The Cracked Bell (Wall / terrain)

- **Cast:** Hob grips his helmet with both hands and bows his head toward the target area as if pointing the bell at it. Base: UAL Spell_Simple_Shoot with both hands held to the helmet.
- **Projectile / strike object:** A giant spectral bronze bell, 5 m across, with a jagged crack down one side, dropped from the sky.
- **Flight:** It drops straight down from 8 m in 0.35 s, swinging slightly. Sound: a whoosh, then a deafening low clang.
- **Impact:** The bell lands and stays for 2.5 s as a solid ring wall. Inside, a ring of verdigris stains the ground. Hits on the outside of the bell ring it.
- **Target reaction:** Enemies inside are Deafened for 1 s (silenced: musical notes crossed out above their heads, hands to ears), then trapped. Allies inside see a warm amber interior and are shielded from projectiles.
- **Numbers:** Range 7 m, radius 2.5 m, lasts 2.5 s, silence 1 s, cooldown 14 s. Every hit any ally lands on the bell's outside adds +1 toll to every enemy inside.
- **Telegraph:** A red-rimmed bell shadow grows on the ground for 0.35 s.
- **Team use:** Drop it on a diver to trap them while the squad beats on the bell to stack seven tolls, or drop it on your own carry as an emergency projectile shelter.

#### Passive: Seven Tolls

Every hit Hob lands adds a toll to the target. Allies' hits on a target that already has at least one toll also add a toll (once per 0.5 s per ally). On the seventh toll, the target and every enemy within 3 m are stunned for 1.5 s and the counter resets.

*Visual tell:* The crack in his helmet glows from dull to bright gold as tolls build on his current target, and verdigris on his skin brightens. Enemies wear a ring of small bronze rings orbiting the head, one per toll, which turn red at six.

#### Super: Saint Ennick's Last Note

> The light dims as a colossal cracked bell drifts down from the sky and settles over Hob like a cathedral. Camera tilts up for a breath to show its crack. Hob braces, roars and headbutts the rim. For once the note comes out pure, with no buzz and no crack in it. A shimmering ring of staff lines rolls across the arena, and enemies slump asleep mid-step, except in the one narrow slice where the crack still lets the sound leak away.

- **Style:** Aura (radial)
- **Cast:** Hob raises both arms and the great bell of Saint Ennick descends over him. He headbutts its rim with his bell helmet, the one true note he has spent thirty years trying to find.
- **Strike object:** The great bell, a ghostly bronze bell 9 m tall with a crack down one side, plus the note itself: a vast expanding sound-ring with a wedge-shaped gap where the crack splits it.
- **Flight:** The ring rolls out from Hob to 10 m over 0.6 s. It is a flat torus with musical staff lines etched into it and verdigris dust shed behind it. The 40-degree gap faces the direction the crack points (aimed by the player during the windup). Sound: a perfect, pure bell note with no buzz, the first time Hob's bell has ever rung true.
- **Impact:** Every surface in the ring vibrates (a camera shake of 0.15 s). It leaves a 10 m soft green ring decal of staff lines that fades over 3 s.
- **Target reaction:** Enemies fall Asleep: their eyes close and their heads drop forward, swaying (a sleep pose layer on the victim), with a slow bronze note glyph drifting up over them. Sleep is broken by damage after the first 1 s.
- **Numbers:** Radius 10 m with a 40-degree safe gap, 2.0x BA, Sleep 3 s (unbreakable for the first 1 s), cooldown none (charge). The first hit on a sleeping enemy deals +50% (Rude Awakening). The Sleeper is put to sleep for double duration.
- **Telegraph:** The giant bell shadow appears around Hob 1.0 s ahead, red-rimmed, with the crack gap clearly drawn as a clear wedge.
- **Team use:** Huge setup for the squad: call a focus target, then everyone opens on the same sleeper for the +50% Rude Awakening. Wrenna's Sounding counts Sleep as hard CC, so she gets double damage.
- **Charge:** Tolls rung: every toll Hob or his allies add counts toward 70 tolls; a seventh-toll stun counts as 5. On his body, the crack in his helmet fills with gold from top to bottom, and the forearm bracers grow brighter verdigris. HUD: a bell icon whose clapper swings faster as it fills.
- **Counterplay:** The crack gap is a safe lane: stand in the 40-degree wedge. Sleep breaks on damage after 1 s, so a scattered team only loses one target to the follow-up. Hob is rooted for the 1.0 s windup and can be interrupted by any stun, which drops the bell.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-1.0 s | UAL Spell_Simple_Enter | Both arms raised high, palms up, then pulled down as the bell settles. The player aims the crack direction by dragging. Hips sink into a wide stance. | Giant bell mesh descends; a red-rimmed bell shadow on the ground with the gap marked. | Spectral bell mesh (2 materials: bronze fresnel and crack emissive). | A deep grinding hum like a bell being lowered on ropes. |
| Action | 1.0-1.3 s | UAL Punch_Cross blended with a forward headbutt | Neck and head drive forward 40 degrees; both fists grip the air. Hold the contact pose 0.1 s for hit-stop. | Helmet flash; a white-gold flare on the rim. | None. | The pure note: a sine-like bell tone with a long tail. |
| Impact | 1.3-2.0 s | Hold the contact pose | Hold the pose, shaking slightly (additive noise). | Note ring expands to 10 m with staff lines, verdigris dust and the gap wedge. Sleep glyphs pop on victims. | Bell fades to 30% opacity. | The note's long tail; crowd gasps fade. |
| Recovery | 2.0-2.7 s | UAL Idle_Loop blended in from a hands-on-knees pose | Hob stands back up, wipes his brow under the helmet, and looks up as the bell dissolves. | Bell dissolves into green dust. | Ladle stays sheathed. | A soft after-ring. |

#### Body language

- **Locomotion:** Heavy, flat-footed founder's walk, arms swinging wide because the bracers are heavy. The run is a lumbering jog with the shoulders rolling. Base: UAL Jog_Fwd_Loop retimed 10% slower, with the arms abducted 10 degrees.
- **Idle:** Taps a bracer with a knuckle and listens with his head cocked, then frowns at the tone. Sometimes he scratches the green patch on his neck. Base: UAL Idle_Loop with additive arm and head layers.
- **Hit reaction:** His head rings: he staggers sideways with the helmet vibrating (a high-frequency jitter on the head bone) and a dull clank. Base: UAL Hit_Head.
- **Death:** He falls to his knees and pitches forward onto his helmet with a final cracked toll; verdigris dust blows off his body in a slow drift. Base: UAL Death02. VFX: a final toll ring that fails halfway and breaks apart.
- **Victory:** He takes off the helmet, cradles it, knocks it once and listens with his eyes closed, then smiles faintly. Base: UAL Idle_Talking_Loop with a held-helmet pose layer.

#### Team combos

- **With Wrenna Vael:** The seventh toll stuns a cluster. Sounding deals double damage on stunned targets.
- **With Ione:** Ione winds the box; the hasted squad hits faster, adding allied tolls quickly. Seven tolls arrive in about half the time.
- **With Sir Halven:** Halven's Lookout reveals a flanker. Hob drops the Cracked Bell on them and the squad rings it to seven.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `hob_idle` | UAL Idle_Loop | custom pose layer | Bracer tap and listen; neck scratch. |
| `hob_walk` | UAL Walk_Loop | retime | 10% slower and flat-footed. |
| `hob_run` | UAL Jog_Fwd_Loop | custom pose layer | Arms abducted 10 degrees, shoulders rolling. |
| `hob_dodge` | UAL Roll | retime | Slower roll ending in a crouch. |
| `hob_basic_1` | UAL Punch_Jab | retime | 1-frame hold at contact. |
| `hob_basic_2` | UAL Punch_Cross | reuse as-is | Helmet dip comes from the existing head motion. |
| `hob_basic_3` | UAL Sword_Attack + MELEE_JUMP_LAND | custom pose layer | Clasped-fist overhead slam, a 0.15 s hold at the top, landing crouch blended in. |
| `hob_skill_casting_pour` | UAL HARVEST | retime | Scythe sweep 20% faster with the ladle prop in the right hand. |
| `hob_skill_cracked_bell` | UAL Spell_Simple_Shoot | custom pose layer | Both hands gripping the helmet, a bow forward. |
| `hob_super_last_note` | UAL Spell_Simple_Enter + Punch_Cross | custom pose layer | Arms up, then a headbutt driven by neck and spine; see beats. |
| `hob_hit` | UAL Hit_Head | custom pose layer | High-frequency jitter on the head bone. |
| `hob_death` | UAL Death02 | reuse as-is | Final toll VFX. |
| `hob_victory` | UAL Idle_Talking_Loop | custom pose layer | Helmet held in both hands at chest height. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `hob_sound_ring` | spawned mesh | Thin bronze torus with a fresnel edge and verdigris speck texture; scales 0.3 to 1.6 m in 0.2 s. |
| `hob_bell_dome` | spawned mesh | Half-bell dome in translucent bronze that cracks along a seam, then shatters into a shard burst. |
| `hob_crack_decal` | decal | Radial cracks with green verdigris staining in the seams. Lasts 2 s. |
| `hob_toll_orbit` | status overlay | Up to 7 small bronze rings orbiting the victim's head; ring 6 turns red, ring 7 flashes white. |
| `hob_molten_bronze` | particles | Glowing blobs that cool from gold to verdigris in flight, with a smoke and heat-shimmer sprite. |
| `hob_bronze_root` | status overlay | Height-masked metallic shader climbing from the feet to the ankles. |
| `hob_cracked_bell` | spawned mesh | 5 m spectral bell with a crack emissive; the solid collider stays for 2.5 s. |
| `hob_great_bell` | spawned mesh | 9 m ghost bell for the super. Fallback: a 2D bell silhouette billboard. |
| `hob_note_ring` | spawned mesh | Flat 10 m torus with staff-line texture and a 40-degree alpha gap. |
| `hob_sleep_glyph` | status overlay | A slow-drifting bronze note sprite and a closed-eye head-droop layer on the victim. |
| `hob_helmet_crack` | material mask | Emissive mask in the helmet crack that fills gold with toll count and super charge. |

---

### Corrin Ashgraft, the Grafted Warden

**Class:** Support: healer / Frontline: tank  
**Basic style:** Lobbed arc  
**Team job:** A walking orchard: Corrin's missed shots become healing fruit on the ground, and he can root in place to anchor a fight.  
**Palette:** bark `#5B4330`, iron armour `#6E7372`, lichen sage `#A9C4A0`, moss `#7DA638`, eye green `#8BE04A`, blossom pink `#F28BB0`, blight grey `#8C8C88`

#### Basic attack chain

##### Hit 1: Windfall (Lobbed arc)

- **Cast:** His bark hand twists a golden-red apple off a budding twig at his wrist (it grows in 0.2 s as a scale-up prop), and he lobs it overhand. Base: UAL OVERHAND_THROW retimed 10% slower, with the wooden fingers splayed on release.
- **Projectile / strike object:** A Hollin apple: glossy red-gold with a single leaf, about 250 tris, faintly glowing at the core (a year of life inside).
- **Flight:** Soft arc, 13 m/s, apex 2 m, spinning slowly on its stem axis. A trail of 3-4 drifting leaves and pollen motes. Sound: a creak of branch, then a soft whoosh.
- **Impact:** On an enemy it bursts in a pulp-and-petal splash with grey blight spores puffing out. If it misses and lands on the ground, it stays as a glowing Windfall pickup for 4 s with a leaf-shadow decal under it.
- **Target reaction:** The target recoils with its head jerked back as if hit in the face, and grey spores cling to its shoulders for 1 s (heal received -15%).
- **Numbers:** Range 8 m, splash 1.2 m, 1.0x BA, 0.95 attacks/s. A missed apple heals the first ally to touch it for 0.8x BA.
- **Telegraph:** Small red-rimmed impact tick 0.3 s before landing.
- **Team use:** Throw behind your fighting allies and the misses become a trail of heals they can kite through.

##### Hit 2: Second Windfall (Lobbed arc)

- **Cast:** Mirror of hit 1 with the left hand, the one with the blossom on its wrist. The pink blossom sways with the throw (a separate prop on the left hand bone with simple sway in code).
- **Projectile / strike object:** A greener, unripe apple: harder, sour, with a darker leaf.
- **Flight:** Flatter arc, 15 m/s, apex 1.5 m. Pollen trail, plus a blossom petal that peels off and follows the apple.
- **Impact:** A harder thunk: no pulp, the apple bounces once 1 m and rolls to a stop as a pickup for 4 s.
- **Target reaction:** A shove back of half a step, with a stagger from the blunt hit.
- **Numbers:** Range 8 m, 1.1x BA, bounce 1 m. Pickup heals for 0.8x BA.
- **Telegraph:** Small red tick.
- **Team use:** The bounce lets the pickup land closer to the ally behind the target.

##### Hit 3: Rootfall (Lobbed arc)

- **Cast:** He swings both branch arms back like a tree in wind, then hurls a heavy seed-apple overhead. Hold the windup 0.2 s. Base: UAL OVERHAND_THROW with a two-handed pose layer and a forward step.
- **Projectile / strike object:** A large golden seed-apple with roots already curling out of its base.
- **Flight:** High arc, 11 m/s, apex 3 m. Roots wriggle from the base in flight (a 4-frame flipbook on a ribbon), dropping clods of soil.
- **Impact:** It slams into the ground, and the roots burrow and push up a sapling (a small spawned tree mesh, 1.2 m) that lives 3 s and pulses 3 times with green rings. Enemies near the impact are briefly snared by roots.
- **Target reaction:** Enemies in 1.5 m have their ankles tangled in roots (a vine overlay sprite on their feet) and are slowed 35% for 1 s. Allies within 2.5 m of the sapling see green leaves drift onto their shoulders as each pulse heals them.
- **Numbers:** Range 9 m, impact 1.5 m, 1.4x BA. Sapling pulses heal 0.4x BA per pulse to allies in 2.5 m (3 pulses). Slow 35% for 1 s.
- **Telegraph:** Red-rimmed impact circle 0.4 s ahead. Allies see a green outlined sapling circle.
- **Team use:** A thrown heal zone that also slows divers chasing your backline.

#### Skills

##### Take Root (Aura (channel))

- **Cast:** He plants both feet and drives his toes into the earth. His spine straightens and his arms lift like branches. Base: UAL Spell_Simple_Enter into Spell_Simple_Idle_Loop, with the arms raised as branches and the lower body locked.
- **Projectile / strike object:** A spreading root network: roots surface around him in a ring (decal plus a few spawned root-arch meshes) and a canopy of leaves flutters overhead.
- **Flight:** Roots spread from him to 6 m over 0.5 s (an animated decal mask). Leaves drift down within the ring. Sound: creaking wood and birdsong.
- **Impact:** A 6 m root-ring ground decal that persists while he is rooted. Each second a green pulse ripples outward.
- **Target reaction:** Allies in the ring see moss sprout on their shoulders as they heal, plus a green outline. Enemies in the ring see a red-rimmed edge and have grey blight spores on them (heal received -20%).
- **Numbers:** Radius 6 m, up to 5 s (cancel any time). Heals allies 0.5x BA/s and Corrin 0.8x BA/s. Corrin gets 30% damage reduction and +2 m reach on Windfall while rooted. Cannot move. Cooldown 16 s.
- **Telegraph:** Allies see a soft green ring with a white outline; enemies see a thin red rim.
- **Team use:** Defines where the squad fights. Combine with Mott's candles and Halven's warnings to make an unbreakable anchor.

##### Graft (Tether)

- **Cast:** He presses his wooden palm toward an ally, and a living branch grows from his wrist to them. Base: UAL Spell_Simple_Shoot with the palm held open and the fingers spread.
- **Projectile / strike object:** A bark vine with small leaves and a single pink bud, joining his wrist to the ally's.
- **Flight:** Grows to the ally at 25 m/s as a ribbon with a bark texture, swaying as both units move. Breaks beyond 10 m. Sound: a creak and a twig snap on attach.
- **Impact:** Bark plates grow over the ally's shoulders (a bark armour shader overlay) for the duration.
- **Target reaction:** The ally sees bark on their arms and a pink bud on their wrist. If they fall below 25% HP, the vine contracts and yanks them 4 m toward Corrin (pull to safety).
- **Numbers:** Range 8 m, tether breaks at 10 m, lasts 4 s. Redirects 35% of the ally's incoming damage to Corrin. One emergency pull of 4 m. Cooldown 14 s.
- **Telegraph:** Allies see the bark vine. Enemies see a thin vine with a grey rim, so they know focus is being split.
- **Team use:** Graft the diver, the carry or whoever is about to pull Pyrrhos's nail; Corrin's tankiness becomes theirs.

#### Passive: Last Blossom

When Corrin drops below 30% HP, the blossom on his wrist falls and he regenerates 6% max HP per second for 2 s. The blossom regrows over 60 s. While the blossom is in bloom, his heals are 10% stronger.

*Visual tell:* The single pink blossom on his left wrist glows when ready; when used, petals scatter and only a closed bud remains, growing back visibly over 60 s.

#### Super: The Orchard of Hollin

> Corrin slams his arms into the earth to the elbows and his green eyes flare. Camera pulls back and up. One after another, six apple trees burst out of the ground around the squad, branches spreading, pink blossoms opening all at once in a cloud of petals. Arrows and bullets thunk into the trunks. The air turns golden. Then the apples ripen and fall in a soft rain, and every ally caught under them gets one more year: the next blow that should kill them doesn't.

- **Style:** Wall / terrain plus aura
- **Cast:** He drives both branch arms into the ground to the elbow and lifts his head. Moss spreads up his armour. He is replanting Hollin for one moment.
- **Strike object:** Six spectral apple trees (low-poly spawned meshes, pink blossom canopies) that burst out of the ground in a 7 m circle around him, plus a falling orchard of apples.
- **Flight:** Trees rise in sequence over 0.8 s, spiralling outward, blossoms opening with a petal burst. Five seconds later, apples drop from the canopies in a soft rain. Sound: wind through branches, bees, a distant church bell of Hollin.
- **Impact:** A 7 m circle of blossom-covered grass decal with fallen petals. The trees are solid terrain that block enemy projectiles and movement.
- **Target reaction:** Allies under the canopy see pink petals settle on them and a golden apple icon over their heads: One More Year. Enemies are pushed to the outside edge by the rising trees (1.5 m push) and grey blight spores cling to them.
- **Numbers:** Radius 7 m, lasts 6 s. Trees have 2.0x BA HP each. Heals allies 0.6x BA/s. At 5 s, One More Year: for 6 s, an ally who would die is left at 1 HP and healed 2.0x BA instead (once each). Corrin is rooted for the whole cast.
- **Telegraph:** Enemies see a red-rimmed ring of tree trunks rising. Allies see a blossom-pink ring with a white outline.
- **Team use:** It's a team fort: carries fight from behind the trunks, and One More Year turns a losing fight. Mott's candle shields stack on top of it.
- **Charge:** Blossoms: healing done fills the super. Each 20% opens a new pink blossom along his arms and shoulders (spawned blossom sprites on the arm bones), five blossoms at full charge. HUD: a sapling icon that grows into a tree.
- **Counterplay:** Trees can be cut down (each has 2.0x BA HP), shrinking the fort. Corrin is rooted for the full 6 s and can be focused or knocked up to cancel the remaining time. Anti-heal effects reduce the healing but not One More Year. Fight outside the ring and wait 6 s.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.8 s | UAL PLANT_SEED retimed | Kneels on one knee and drives both arms down into the ground, holding the arms buried. Head lifts slowly. | Moss spreads up his armour (shader mask), the ground cracks in a ring, and roots surface. | None. | Wood creak, earth tearing. |
| Action | 0.8-1.6 s | Hold the PLANT_SEED end pose | Hold with the shoulders heaving (additive breathing). | Six trees rise in a spiral with a blossom-burst flipbook on each canopy. | 6 tree meshes (low-poly, 400 tris each). | Rising wind, birds scattering. |
| Impact | 1.6-6.0 s | Hold pose with additive sway | Gentle sway like a tree in wind. | Petal drift, healing pulses, apple rain at 5.0 s with a golden apple icon on allies. | Apple pickup meshes reused from Windfall. | Bees and soft bells; a chime at 5.0 s. |
| Recovery | 6.0-6.8 s | UAL PLANT_SEED reversed into Idle_Loop | He pulls his arms free and soil falls off them. | Trees dissolve into falling petals and leaves. | None. | Leaves rustling away. |

#### Body language

- **Locomotion:** Creaking, stiff-kneed stride, as if every step pulls a root up. The run is a long-legged lope with the branch arms held slightly away from the body. Base: UAL Walk_Loop retimed 12% slower; Jog_Fwd_Loop with reduced knee bend.
- **Idle:** He looks at the blossom on his wrist and shields it with his other hand. Sometimes a bird sprite lands on his shoulder and flies off, or he flexes his wooden fingers and they creak. Base: UAL Idle_Loop with additive hand layers.
- **Hit reaction:** A creak and splinter burst, bark chips flying, a half-step stagger. Base: UAL Hit_Chest.
- **Death:** He sinks to his knees and his arms lift into a frozen branch pose. Leaves fall from him all at once and grey blight creeps up from his feet (shader mask), then he dims into a dead stump silhouette as the last petal floats off his wrist. Base: UAL Death01, frozen at the knee frame, with the blight dissolve.
- **Victory:** He plants a seed in the ground, kneels, and a tiny sapling grows; he cups his hands around it. Base: UAL PLANT_SEED into Fixing_Kneeling.

#### Team combos

- **With Brother Mott:** Mott's Vigil Candles shield the squad inside Take Root. Shield plus heal-over-time makes the root ring nearly unbreakable. In the lore, Mott's graves caused the blight; here, they fight it.
- **With Pyrrhos:** Pyrrhos pulls his nail and burns his own HP for power. Corrin grafts him to soak 35% of the damage, and Windfall apples keep him running for the full 4 s.
- **With Vell:** Vell's Lost Property Office finds things for allies. If Corrin is in the radius, Vell returns his wife's name and Corrin's super charge is filled instantly.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `corrin_idle` | UAL Idle_Loop | custom pose layer | Blossom-shield gesture; finger creak. |
| `corrin_walk` | UAL Walk_Loop | retime | 12% slower, stiff knees. |
| `corrin_run` | UAL Jog_Fwd_Loop | custom pose layer | Reduced knee bend, arms held out. |
| `corrin_dodge` | UAL Roll | retime | Slower; ends with a hand planted. |
| `corrin_basic_1` | UAL OVERHAND_THROW | retime | 10% slower, splayed fingers on release. |
| `corrin_basic_2` | UAL OVERHAND_THROW | retime | Mirrored, flatter release. |
| `corrin_basic_3` | UAL OVERHAND_THROW | custom pose layer | Two-handed overhead, a 0.2 s hold at the top, forward step. |
| `corrin_skill_take_root` | UAL Spell_Simple_Enter + Spell_Simple_Idle_Loop | custom pose layer | Arms raised as branches, lower body locked. |
| `corrin_skill_graft` | UAL Spell_Simple_Shoot | custom pose layer | Open palm held toward the ally. |
| `corrin_super_orchard` | UAL PLANT_SEED | custom pose layer | Both arms buried; held for the duration with additive sway. |
| `corrin_hit` | UAL Hit_Chest | reuse as-is | Bark chip burst in VFX. |
| `corrin_death` | UAL Death01 | custom pose layer | Frozen at the knee frame with the arms up. |
| `corrin_victory` | UAL PLANT_SEED + Fixing_Kneeling | retime | Blended chain. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `corrin_apple` | projectile mesh | Glossy red-gold apple with a single leaf and a soft core glow; slow spin on the stem axis. |
| `corrin_apple_unripe` | projectile mesh | Green, harder variant with a darker leaf. |
| `corrin_seed_apple` | projectile mesh + flipbook | Large gold apple with a 4-frame root-wriggle flipbook at the base. |
| `corrin_pulp_burst` | impact flipbook | Pulp, pink petals and grey blight spores; 8 frames. |
| `corrin_windfall_pickup` | pickup mesh + decal | A glowing apple on the ground with a dappled leaf-shadow decal; it pulses every 0.5 s. |
| `corrin_sapling` | spawned mesh | 1.2 m sapling that pulses green rings 3 times, then fades. |
| `corrin_root_ring` | decal | Roots spreading through a 6 m mask with a green pulse every second. |
| `corrin_graft_vine` | tether ribbon | Bark-textured ribbon with small leaves and a pink bud mid-span. |
| `corrin_bark_armour` | status overlay | Bark shader patch on the ally's shoulders and forearms. |
| `corrin_orchard_tree` | spawned mesh | Low-poly apple tree with a pink blossom canopy and a petal-burst flipbook. Fallback: billboard trees. |
| `corrin_one_more_year` | status overlay | Small golden apple icon floating over the ally's head; it flashes when consumed. |
| `corrin_blossom_charge` | attached sprites | Pink blossom sprites on the arm and shoulder bones, one per 20% super charge. |

---

### Brother Mott, the Tallow Saint

**Class:** Support: shielder / Specialist: summoner (candles)  
**Basic style:** Cone spray  
**Team job:** A candle-bearing shield battery: every candle Mott lights is a shield on the squad, and his seals can make an ally's promise to live come true for two seconds.  
**Palette:** tallow cream `#EDE3C2`, wax ivory `#F5EBD0`, seal red `#B3202A`, leather mask `#8B4A2B`, flame gold `#FFB347`, flame core `#FFE08A`, rope `#8A6A43`, soot `#3B3633`

#### Basic attack chain

##### Hit 1: Drip (Cone spray)

- **Cast:** He tips his head forward so the wick on his crown flares, pinches the melted wax pooling at the brim with his right hand, and flicks it outward. Base: UAL Spell_Simple_Shoot retimed 25% faster, with a forward head bow.
- **Projectile / strike object:** Three hot wax droplets that harden in mid-air into little red wax seals stamped with a cross.
- **Flight:** A 25-degree cone, 7 m, at 16 m/s. Each droplet starts as a glowing gold blob and hardens to a matte red disc at 3 m (a material lerp) with a wisp of smoke. Sound: a hiss, then the soft tock of wax setting.
- **Impact:** Seals smack onto the target and stick for 1 s before falling off. A tiny wax spatter decal, 0.5 s.
- **Target reaction:** A small flinch. The stuck seals stay on the victim's chest and shoulders as decals for 1 s.
- **Numbers:** Cone 7 m by 25 degrees, 0.45x BA per seal (1.35x if all three hit), 1.0 attacks/s.
- **Telegraph:** None (short cone).
- **Team use:** Spreads chip damage around a cluster. Every target hit by 3 seals within 3 s is Sealed (see hit 3).

##### Hit 2: Drip (Cone spray)

- **Cast:** Mirror with the left hand, the flick coming from under the right arm in a backhand. Base: UAL Spell_Simple_Shoot mirrored.
- **Projectile / strike object:** Same three droplet-seals; one in three is black wax (a cosmetic variation).
- **Flight:** Same cone, angled slightly lower. Wax smoke trails.
- **Impact:** Same as hit 1.
- **Target reaction:** Same as hit 1.
- **Numbers:** Same as hit 1.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: The Seal (Cone spray (focused))

- **Cast:** He presses his palm flat against one of the red seals on his coat, pulls it free, and slaps it toward the target, tilting his head so the wick drips a long thread of wax. Base: UAL Punch_Jab with an open palm, held 0.1 s.
- **Projectile / strike object:** A big glowing wax seal the size of a hand, stamped with an ancient promise sigil, trailing a thread of molten wax back to Mott.
- **Flight:** Straight, 14 m/s, 7 m, narrow cone. The wax thread breaks off at 4 m. Sound: a quill scratch, then a thump.
- **Impact:** It slaps onto the target with a red splash ring, and wax runs down to their feet.
- **Target reaction:** Sealed: wax runs down the target's legs and hardens around the feet (height-masked wax shader). They are slowed 30% for 1 s, then the seal cracks for bonus damage.
- **Numbers:** Range 7 m, 0.8x BA on hit + 0.8x BA when the seal cracks after 1 s, slow 30% for 1 s.
- **Telegraph:** A short red line flash.
- **Team use:** Slow and pop. A Sealed target can't dash away from Wrenna's Sounding in time.

#### Skills

##### Vigil Candle (Pet / summon)

- **Cast:** He draws a tall candle from the bundle at his hip, touches it to the wick on his crown (head bowed forward), and tosses it. Base: UAL PickUp_Table reversed into OVERHAND_THROW.
- **Projectile / strike object:** A tall cream candle with a tiny red seal on its base and a steady gold flame.
- **Flight:** A lobbed arc, 12 m/s, spinning slowly. The flame stays upright (billboard flame always faces up), trailing wax droplets. Sound: a breathy whoomp as the flame catches.
- **Impact:** It plants upright in the ground. A pool of wax spreads 0.5 m around the base (decal), and a soft gold light circle with a 4 m radius appears.
- **Target reaction:** Allies in 4 m wear a thin waxy translucent shell (a wax shield overlay: creamy fresnel with drip streaks). Enemies see the candle with a red rim and can stomp it out.
- **Numbers:** Range 10 m, aura 4 m, lasts 8 s or 3 enemy hits. Gives allies in the aura a wax shield of 0.6x BA that refills every 2 s. Max 3 candles. Cooldown 7 s per charge, 2 charges.
- **Telegraph:** Allies see a gold light circle with a white outline; enemies see the candle with a red rim and an HP pip ring.
- **Team use:** Plant candles where the squad will fight. Each one also counts toward his passive.

##### Last Promise (Ally-targeted buff (or aimed seal))

- **Cast:** He tears a red seal off his coat, kisses it to his mask, and presses it into the air toward the target. Base: UAL Spell_Simple_Shoot with a 0.2 s hand-to-mask hold.
- **Projectile / strike object:** A large blazing red seal that flies to the target and stamps onto their chest.
- **Flight:** Homing, 20 m/s, trailing a ribbon of red wax and the smell-visual of smoke. Sound: a deep wax-stamp thud and a whisper.
- **Impact:** On an ally: a seal glows on their chest with a ring of candle flames circling their feet. On an enemy: wax splashes and floods their boots.
- **Target reaction:** An ally becomes Sworn: they cannot drop below 1 HP for 2 s and see a ring of small flames at their feet. An enemy becomes Bound: wax seals their boots and they cannot dash or blink for 2.5 s.
- **Numbers:** Range 9 m, Sworn 2 s, Bound 2.5 s, cooldown 22 s.
- **Telegraph:** Enemies see a red seal icon fly at them. Allies see a gold seal icon.
- **Team use:** Sworn on the carry about to be bursted, or Bound on the diver about to leap onto your healer.

#### Passive: Every Candle Counts

When an ally dies, a memorial candle lights where they fell and burns until they respawn. Every candle burning on the field (Vigil Candles plus memorial candles) gives all allies +3% max-HP shield regeneration per second, up to 5 candles.

*Visual tell:* The wick on his crown burns taller with each candle on the field, and the red seals on his coat glow one by one, one per candle.

#### Super: The Valley's Light

> Mott tilts his masked face up and the wick on his crown flares into a column of gold flame. One by one, the red seals tear free from his coat and become floating candles, eleven of them, rising in a slow spiral. They drift over to each ally and settle above their heads like halos, and a waxen glow hardens around each body. When an enemy breaks through one of those shields, the candle's flame peels away into a small, pale human figure, one of the valley's dead, and it flies straight back at the attacker.

- **Style:** Aura plus homing counter-strike
- **Cast:** Mott lifts his face to the sky. The wick on his crown flares into a pillar of fire and every seal on his coat pops loose and floats.
- **Strike object:** Eleven floating candles, one per year of his vigil, each carrying a promise seal. They orbit the squad, and each ally is wrapped in a translucent wax effigy shield.
- **Flight:** The candles rise from his coat and spiral outward to circle the allies within 10 m, then each one settles above an ally's head. When an ally's shield breaks, that candle's flame peels off and homes to the attacker at 18 m/s as a burning wisp shaped like a small human figure (the valley's dead). Sound: a choir of whispers and a single held chord.
- **Impact:** Ground decal: a soft gold ring of drips and wax circles where each ally stands. Wisp hits burst into a puff of gold ash.
- **Target reaction:** Allies see a waxen outline and a candle floating over their head. Attackers hit by a wisp are briefly Haunted: a pale figure clings to their back for 1 s (a slow 25%).
- **Numbers:** Radius 10 m. Shield on each ally: 3.0x BA for 6 s. When a shield breaks, the wisp deals 2.0x BA to the attacker and slows 25% for 1 s. If Wrenna is on the team, a 12th candle with her name rises and also refreshes her Sounding.
- **Telegraph:** Enemies see allies outlined in red-rimmed wax with a candle overhead, a clear warning that hitting them triggers a wisp.
- **Team use:** A full-team shield. The wisps punish divers, which gives Corrin and Jory time to work.
- **Charge:** Candles lit: every Vigil Candle placed, every memorial candle and every shield point absorbed charges it. On his body, wax drips further down his mask and the red seals on his coat light up one by one, so at full charge every seal is glowing. HUD: a candle icon that burns down to show charge.
- **Counterplay:** Spread damage instead of bursting shields one by one. AoE breaks several shields at once but takes several wisps. Wisps can be dodged by dashing (they home at 18 m/s). If Mott dies during the 6 s, every candle goes out and the shields vanish. The lore: the dead stay quiet only while the wick burns.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.7 s | UAL Spell_Simple_Enter | Head tilts back to look up; both arms open out from the sides, palms up. | Wick flares into a 1.5 m flame column. Seals on his coat pop off one by one. | 11 seal sprites detach from the coat. | Flame roar; a whispered prayer. |
| Action | 0.7-1.4 s | UAL Spell_Simple_Idle_Loop | Arms rise slowly; a slow turn of the body as the candles spiral out. | Candles rise in a spiral and travel to allies. | 11 candle meshes, instanced. | A choir chord swells. |
| Impact | 1.4-1.8 s | UAL Spell_Simple_Shoot | Hands brought together at the chest in a prayer pose. | Wax shields harden on allies with a creamy fresnel flash. | None. | Wax stamp thud, layered. |
| Recovery | 1.8-2.4 s | UAL Idle_Loop | Prayer pose released into idle; he bows his head. | His wick settles back to normal height. | None. | Soft bell. |

#### Body language

- **Locomotion:** A careful, slightly hunched gravedigger's walk, one hand often raised to shield the flame on his crown from the wind. The run is a hurried shuffle that keeps the head steady to protect the flame. Base: UAL Walk_Loop with a head-stabilising layer; Jog_Fwd_Loop retimed 8% slower.
- **Idle:** He cups a hand around the wick, adjusts a seal on his coat, counts the candles in his hip bundle with one finger. Base: UAL Idle_Loop with additive hand layers.
- **Hit reaction:** The flame on his crown gutters sideways (flame billboard bends), wax spatters off his shoulders, and he hunches. Base: UAL Hit_Chest.
- **Death:** He kneels, and his wick shrinks to a single blue point before going out with a thin curl of smoke. Pale wisps rise from the ground around him for a second and look around, confused. Base: UAL Death01 into a kneeling hold.
- **Victory:** He lights a new candle from his wick and sets it down, then stands with his hands folded. Base: UAL Interact into Idle_Loop.

#### Team combos

- **With Corrin Ashgraft:** Take Root makes a fixed healing circle. Mott's Vigil Candles stack shields on top; the circle becomes a fortress.
- **With Jory Ashby:** Jory's Spare Hourglass revives an ally. Mott's memorial candle for that ally stays lit for 5 s after they come back, giving the team bonus shield regen.
- **With Wrenna Vael:** Mott's super lights Wrenna's sealed candle. Her Sounding cooldown is refreshed for an instant second flood.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `mott_idle` | UAL Idle_Loop | custom pose layer | Flame-cup, seal adjust, candle count. |
| `mott_walk` | UAL Walk_Loop | custom pose layer | Hunch plus head-stabilising layer. |
| `mott_run` | UAL Jog_Fwd_Loop | retime | 8% slower shuffle, head stabilised. |
| `mott_dodge` | UAL Roll | custom pose layer | One hand held over the wick throughout. |
| `mott_basic_1` | UAL Spell_Simple_Shoot | retime | 25% faster with a forward head bow. |
| `mott_basic_2` | UAL Spell_Simple_Shoot | retime | Mirrored backhand. |
| `mott_basic_3` | UAL Punch_Jab | custom pose layer | Open palm, 0.1 s hold. |
| `mott_skill_vigil_candle` | UAL PickUp_Table + OVERHAND_THROW | custom pose layer | Draw a candle from the hip bundle and light it from the crown wick. |
| `mott_skill_last_promise` | UAL Spell_Simple_Shoot | custom pose layer | Hand-to-mask hold 0.2 s. |
| `mott_super_valleys_light` | UAL Spell_Simple_Enter / Idle_Loop / Shoot | custom pose layer | See beats. |
| `mott_hit` | UAL Hit_Chest | reuse as-is | Flame bend in VFX. |
| `mott_death` | UAL Death01 | retime | Held at the kneel. |
| `mott_victory` | UAL Interact | reuse as-is | Candle prop. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `mott_wax_seal_drop` | projectile mesh | Droplet that lerps from a glowing gold blob to a matte red stamped disc at 3 m. |
| `mott_wax_smoke` | trail particles | Thin grey smoke wisps behind each droplet. |
| `mott_big_seal` | projectile mesh + ribbon | Hand-sized glowing seal with a molten wax thread ribbon. |
| `mott_wax_feet` | status overlay | Height-masked creamy wax shader from the feet to the shins, hardening from glossy to matte. |
| `mott_vigil_candle` | spawned mesh | Cream candle with a red seal at its base and a billboard flame; gold light circle decal. |
| `mott_wax_shield` | status overlay | Translucent creamy fresnel with drip streaks scrolling downward. |
| `mott_memorial_candle` | spawned mesh | Short white candle with a small portrait-seal of the fallen ally. |
| `mott_sworn_ring` | status overlay | Ring of 6 tiny flames orbiting the ally's feet. |
| `mott_wick_pillar` | billboard flame | 1.5 m tall flame column with a hot white core. Fallback: one stretched sprite. |
| `mott_eleven_candles` | spawned mesh (instanced) | Floating candles with seal plaques that spiral out to allies. |
| `mott_dead_wisp` | homing projectile sprite | A small pale human-shaped flame (8-frame flipbook) with an ash trail. |

---

### Nyssa Obel, the Ferryman's Daughter

**Class:** Damage: assassin/diver / Specialist: mobility enabler  
**Basic style:** Bouncing / ricochet  
**Team job:** Marks a target, harvests coins from it as the squad hits it, then spends the coins to ferry herself and her allies across the arena.  
**Palette:** river skin `#6C7F8E`, coin bronze `#A57C3A`, coin silver `#BFC3C2`, verdigris coin `#6E8C6A`, river mist `#B9D3D6`, styx violet `#4B3F72`, leather `#6B4226`

#### Basic attack chain

##### Hit 1: Obol Flick (Bouncing / ricochet)

- **Cast:** She plucks a coin from her skirt of coin scales and flicks it with her thumb off a crooked forefinger, the way you'd toss a coin to call a bet. Base: UAL Pistol_Shoot with the pistol replaced by a thumb-flick hand pose, retimed 15% faster.
- **Projectile / strike object:** A spinning tarnished coin: bronze with verdigris at the rim, a ferry stamped on one face and an eye on the other.
- **Flight:** Flat and fast, 22 m/s, spinning on its edge so it flickers bronze and green. A faint river-mist trail curls behind it (soft particle ribbon). On a hit, it ricochets to the nearest other enemy within 4 m. Sound: a bright ping, and a ting on every bounce.
- **Impact:** A small burst of mist and a coin-glint star at the hit point. No ground decal.
- **Target reaction:** The target's head flicks sideways as if stung. If Marked, a coin pops off them and spins to the ground.
- **Numbers:** Range 9 m, 1.0x BA, then 0.6x BA on the ricochet (4 m bounce range), 1.25 attacks/s.
- **Telegraph:** None (fast projectile).
- **Team use:** Ricochets spread chip damage and pop coins off any Marked enemy nearby.

##### Hit 2: Obol Flick (Bouncing / ricochet)

- **Cast:** Mirror of hit 1 with the left hand, with a small skip step forward. Base: UAL Pistol_Shoot mirrored.
- **Projectile / strike object:** A silver coin this time, brighter and newer.
- **Flight:** Same path; it ricochets to a second target. Sound: a higher ping.
- **Impact:** Same.
- **Target reaction:** Same.
- **Numbers:** Same as hit 1.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Double Fare (Bouncing / ricochet)

- **Cast:** She flicks two coins at once from both thumbs, crossing her arms in front of her chest and snapping them outward. Base: UAL Punch_Cross into a two-arm flare, mirrored.
- **Projectile / strike object:** Two coins, one bronze and one silver, that rotate around each other in flight like a binary star.
- **Flight:** They corkscrew around each other at 20 m/s; each one can ricochet once independently. Sound: a two-tone chime.
- **Impact:** Twin glint stars. On a Marked target, both coins stick in the victim's armour for a moment, then pop loose as two dropped coins.
- **Target reaction:** The target rocks back. A ghostly coin flashes over each eye for 0.2 s as a reminder of the toll.
- **Numbers:** Range 9 m, 0.8x BA per coin (1.6x BA if both hit), each can ricochet once at 0.5x BA.
- **Telegraph:** None.
- **Team use:** The main coin harvester on Marked targets.

#### Skills

##### Toll (Aimed skillshot line)

- **Cast:** She holds a coin up between two fingers to her eye, sights the target through the hole in its centre, then throws it overhand. Base: UAL OVERHAND_THROW with a 0.15 s sight-hold at eye level.
- **Projectile / strike object:** A pierced funeral coin (a dark, worn obol with a square hole) trailing a thread of river mist.
- **Flight:** Straight line, 24 m/s, 11 m. It does not bounce. The mist trail lingers 1 s as a pale ribbon. Sound: a whispered count, then a ferryman's bell.
- **Impact:** It strikes and sinks into the target with a cold mist puff.
- **Target reaction:** Marked: two ghostly coins hover over the target's eyes for the duration, as on the eyes of the dead. Each time anyone on Nyssa's team hits the target (once per 0.5 s), a coin falls from them and rolls on the ground as a pickup.
- **Numbers:** Range 11 m, width 0.6 m, 1.2x BA, Mark lasts 6 s, cooldown 8 s. Coins on the ground last 6 s; Nyssa picks them up by walking over them (magnet radius 2 m).
- **Telegraph:** Enemies see a thin red line flash 0.15 s before the throw.
- **Team use:** Focus the Marked target as a team; every hit by anyone makes coins rain for Nyssa's ferry.

##### Call the Ferry (Dash / leap strike)

- **Cast:** She spends three coins: she tosses them into the air (they vanish in mist), raises a hand to call, and steps forward onto a ghostly boat that appears under her feet. Base: UAL SWORD_DASH with an upright stance and one arm raised.
- **Projectile / strike object:** A ghostly ferry: a low black skiff with a bow lantern (spawned low-poly mesh, half transparent) on a ribbon of river mist.
- **Flight:** She glides 9 m in 0.45 s standing at the prow, the boat sliding over a mist-river ribbon that lingers 1.5 s behind it. Sound: an oar splash and a creaking hull.
- **Impact:** Where the boat passes, a river-mist lane remains for 1.5 s. Enemies inside are chilled.
- **Target reaction:** Enemies crossed by the boat stumble and are slowed 30% for 1.5 s, with frost-pale hands clutching their ankles (a sprite overlay). Allies who step into the mist lane within 1.5 s are carried 9 m along it as well.
- **Numbers:** Dash 9 m, costs 3 coins (she holds up to 9), 0.6x BA to enemies crossed, slow 30% for 1.5 s. Ally ride window 1.5 s. Cooldown 10 s.
- **Telegraph:** Enemies see a red-rimmed mist lane. Allies see a soft violet lane with white oar-ripples.
- **Team use:** Squad mobility: dash forward to start a dive and your allies ride the same lane in behind you, or dash back and pull the squad out of a bad fight.

#### Passive: The Ferryman's Coat

Each coin Nyssa carries (max 9) gives her +2% move speed and +2% damage. On death she drops half her coins for allies to collect, which refunds their dash cooldowns by 1 s per coin.

*Visual tell:* Coin scales on her skirt light up one by one with a bronze glint as she carries more coins. The single coin braided into her hair glows when she has enough for a ferry.

#### Super: Passage Paid

> Nyssa raises her fist and lets a stream of coins pour from it. Each coin sinks into the floor, and the arena floor turns to black water. A river of the dead flows in a straight line across the field, mist curling off it, and the ferry glides up out of the fog with its lantern lit. Her allies step aboard and they sail, while pale hands rise from the water to clutch at every enemy on the banks. At the far end Nyssa vaults off the prow and flicks a single gold coin over her shoulder at the weakest enemy. Passage paid.

- **Style:** Dash / leap strike along a summoned ground lane
- **Cast:** She lifts a fistful of coins over her head and lets them fall through her fingers into the ground. Where they land, the river of the dead rises.
- **Strike object:** A ghost river, 18 m long and 3 m wide, with the ferry gliding along it carrying Nyssa and every ally who steps aboard. Pale hands of the dead rise from the water.
- **Flight:** The river unrolls along an aimed line over 0.6 s. Then the ferry travels its full length in 1.2 s. At the end, Nyssa leaps from the prow and flicks one last gold coin, the coin for the dead, at the lowest-HP enemy within 8 m (homing, 26 m/s). Sound: oars, a ferry bell tolling three times, and whispers of the dead.
- **Impact:** The river stays for 4 s as a slowing zone of violet mist water with floating coins (decal plus a low fog layer). The final coin explodes in a gold flash.
- **Target reaction:** Enemies in the river are grabbed by pale hands at the ankles (sprite flipbook) and slowed 50%. Marked enemies are dragged under: pulled to the river's centre line and rooted for 1.5 s, sinking to the knees. The final coin target freezes in a gold flash. If it kills, the victim fades into mist with coins on its eyes.
- **Numbers:** River 18 m by 3 m, lasts 4 s, slow 50%, Marked enemies rooted 1.5 s, 1.5x BA to each enemy crossed. Final coin 3.0x BA, and it executes enemies below 20% HP and refunds 30% charge.
- **Telegraph:** Enemies see the river line red-rimmed for 0.6 s before the ferry sails. Allies see a violet lane with a glowing boarding ring.
- **Team use:** A squad transport and a pick: up to 3 allies ride the ferry 18 m. If Kerberon is on the team, the river's endpoint snaps to him wherever he is within 30 m: the ferry brings the squad to the gate.
- **Charge:** Coins collected: every coin picked up over the match, 30 total. On her body, the coin scales on her armour light up row by row from hem to shoulder. HUD: a stack of coins on the super button.
- **Counterplay:** The river is announced 0.6 s early. Leave the 3 m strip and you are only slowed if you step back in. Stunning Nyssa during the 1.2 s sail sinks the ferry and drops everyone aboard where they are. The final coin only executes below 20% HP, so a shield or heal on the weakest ally saves them.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.6 s | UAL Spell_Simple_Enter | Fist raised overhead, fingers opening slowly; her head tilts down to watch the coins fall. | Coin stream falls; the river decal unrolls along the aim line. | Coin stream particles. | Coins chiming; a deep bell. |
| Action | 0.6-1.8 s | UAL Idle_Loop standing pose on a moving root | Standing at the prow, one hand raised as if holding a lantern pole; slight sway with the boat. | Ferry mesh glides; mist wake; the hands of the dead rise along the banks. | Ferry mesh (low-poly skiff, 600 tris, translucent). | Oars; bell tolls three times. |
| Impact | 1.8-2.3 s | UAL NINJUMP_SPIN into OVERHAND_THROW | Leaps from the prow with a spin, flicking the final coin mid-air. | Final gold coin homes in; gold flash on hit. | Gold coin mesh. | A sharp ting, then silence. |
| Recovery | 2.3-2.8 s | UAL Jump_Land | Lands in a crouch, one hand on the ground. | Ferry dissolves into mist. | None. | Water lapping. |

#### Body language

- **Locomotion:** Light, slightly pigeon-toed walk with coins clinking. The run is quick and low with her braid swinging. Base: UAL Jog_Fwd_Loop retimed 5% faster.
- **Idle:** Rolls a coin across her knuckles, bites one to test it, glances over her shoulder as if expecting someone in the fog. Base: UAL Idle_Loop with additive hand and head layers.
- **Hit reaction:** Coins jangle and a few scales spark. She snaps her head back with her eyes wide. Base: UAL Hit_Head.
- **Death:** She sinks to her knees, two coins appear on her eyes, and she fades into river mist, leaving a small pile of coins on the ground. Base: UAL Death02 with a mist dissolve.
- **Victory:** She flips a single coin high, catches it, and looks at it without smiling. Base: UAL Interact into Idle_Loop.

#### Team combos

- **With Old Kerberon:** Nyssa casts Passage Paid. The ferry's endpoint snaps to Kerberon, bringing the squad to him in time for All Three Awake.
- **With Madame Ysolt Crane:** Ysolt's Entry marks a debtor. Nyssa's Toll on the same target makes every hit pay twice: coins for Nyssa and interest for Ysolt.
- **With Sir Halven:** Halven's Lookout spots a lone enemy. Nyssa ferries the squad onto them.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `nyssa_idle` | UAL Idle_Loop | custom pose layer | Coin-knuckle roll; a glance back over the shoulder. |
| `nyssa_walk` | UAL Walk_Loop | reuse as-is | Coin clink in audio only. |
| `nyssa_run` | UAL Jog_Fwd_Loop | retime | 5% faster. |
| `nyssa_dodge` | UAL Roll | reuse as-is | Mist puff in VFX. |
| `nyssa_basic_1` | UAL Pistol_Shoot | custom pose layer | Thumb-flick hand pose, 15% faster. |
| `nyssa_basic_2` | UAL Pistol_Shoot | custom pose layer | Mirrored with a skip step. |
| `nyssa_basic_3` | UAL Punch_Cross | custom pose layer | Crossed arms flaring out with both thumbs flicking. |
| `nyssa_skill_toll` | UAL OVERHAND_THROW | custom pose layer | 0.15 s sight-through-the-coin hold. |
| `nyssa_skill_call_the_ferry` | UAL SWORD_DASH | custom pose layer | Upright stance, one arm raised, gliding. |
| `nyssa_super_passage_paid` | UAL Spell_Simple_Enter / Idle_Loop / NINJUMP_SPIN / OVERHAND_THROW / Jump_Land | custom pose layer | See beats. |
| `nyssa_hit` | UAL Hit_Head | reuse as-is | - |
| `nyssa_death` | UAL Death02 | reuse as-is | Mist dissolve. |
| `nyssa_victory` | UAL Interact | retime | Coin flip and catch. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `nyssa_obol` | projectile mesh | Thin bronze coin with a verdigris rim and a stamped ferry; spins on its edge. |
| `nyssa_mist_trail` | ribbon trail | Soft river-mist ribbon (#B9D3D6) that curls and fades in 0.5 s. |
| `nyssa_glint` | impact sprite | 4-point coin glint star. |
| `nyssa_toll_coin` | projectile mesh | Dark pierced obol with a square hole and a heavier mist ribbon. |
| `nyssa_eye_coins` | status overlay | Two ghost coins hovering over the victim's eyes; pale violet glow. |
| `nyssa_coin_pickup` | pickup mesh | Rolling coin that settles and glints; magnet pull toward Nyssa. |
| `nyssa_ferry` | spawned mesh | Low-poly black skiff with a bow lantern, half transparent with a violet fresnel. Fallback: a lantern sprite on the mist ribbon. |
| `nyssa_mist_lane` | decal + fog card | Violet mist river with floating coins; red rim for enemies. |
| `nyssa_dead_hands` | flipbook | Pale hands rising and clutching, 10 frames, at the victim's ankles. |
| `nyssa_coin_scales` | material mask | Emissive mask on the coin armour that lights from hem to shoulder as the super charges. |

---

### Pyrrhos, the Hollow Sentinel

**Class:** Frontline: tank / Control: displacement  
**Basic style:** Melee chain  
**Team job:** A bronze wall that patrols: he lays guarded ground, throws cover boulders for the backline, and lets a teammate hammer his nail back in for a team shield.  
**Palette:** bronze `#B08A3E`, verdigris `#5E8C6A`, dark bronze `#5C4520`, sash blue `#4F7A96`, ichor red `#D43A2F`, ichor glow `#FFC870`, seabed teal `#2D5B5B`

#### Basic attack chain

##### Hit 1: Patrol Swing (Melee chain)

- **Cast:** A heavy right backhand with his oversized bronze hand, the shoulder joint grinding. Base: UAL Punch_Cross retimed 15% slower with a 2-frame hold at full extension.
- **Projectile / strike object:** A bronze afterimage of his arm: three fading ghost copies of the arm mesh trailing the swing (a cheap mesh-trail of 3 copies at 60/40/20% alpha), with barnacle grit flicking off.
- **Flight:** Arc of about 110 degrees, 2.6 m reach, 0.25 s. Barnacle grit and dried salt specks spray along the arc. Sound: a grinding clank and a hollow boom from inside his chest.
- **Impact:** Bronze sparks and a small cloud of dry sea-salt.
- **Target reaction:** The target is shoved sideways 0.5 m, stumbling, with salt flecks stuck to it.
- **Numbers:** Range 2.6 m, arc 110 degrees, 1.0x BA, 0.9 hits/s.
- **Telegraph:** None.
- **Team use:** Wide swings let him tag several divers around a carry.

##### Hit 2: Sentry Hook (Melee chain)

- **Cast:** A left hook with the whole torso turning like a tower crane. Base: UAL Punch_Jab mirrored, with a full torso rotation.
- **Projectile / strike object:** Same ghost-arm trail, with a seawater drip ribbon from the elbow joint.
- **Flight:** Arc 90 degrees, 2.4 m reach. Sound: a bronze clang with a deep resonance.
- **Impact:** Sparks and a splash of trapped seawater from his joints.
- **Target reaction:** Head turned by the hook; a clear stagger.
- **Numbers:** Range 2.4 m, 1.1x BA.
- **Telegraph:** None.
- **Team use:** Builds to the stamp.

##### Hit 3: Seafloor Stamp (Melee chain (ground stamp))

- **Cast:** He lifts the nailed ankle high and stamps down. Base: UAL MELEE_JUMP_LAND (landing frames only) with a one-leg lift layered in front.
- **Projectile / strike object:** A shockwave ring of cracked stone with seawater squirting up through the cracks.
- **Flight:** Radial, expanding to 2.5 m in 0.2 s. Water jets pop through the cracks (3-4 small fountain sprites). Sound: an earthen thud and a wave slap.
- **Impact:** A cracked-ground decal with seawater in the seams and a few barnacle clusters, lasting 2 s.
- **Target reaction:** Enemies are rocked off balance (a hop stagger) and slowed 20% for 1.5 s, with wet salt on their boots.
- **Numbers:** Radius 2.5 m, 1.4x BA, slow 20% for 1.5 s.
- **Telegraph:** A 0.2 s bronze glow at the raised foot.
- **Team use:** A slow that helps his team stick to divers.

#### Skills

##### Boulder for Pirates (Lobbed arc)

- **Cast:** He tears a chunk out of the arena floor with both hands (UAL PickUp_Table retimed to 0.3 s), heaves it over his head and hurls it two-handed (UAL OVERHAND_THROW with a two-hand pose layer).
- **Projectile / strike object:** A barnacle-crusted sea boulder (spawned mesh) dripping kelp and seawater.
- **Flight:** Lobbed arc, 13 m/s, apex 4 m, tumbling slowly. Sand and seawater stream off it. Sound: a grinding rumble and a whistle.
- **Impact:** A heavy impact: a crater decal (3 s), a dust and spray ring. The boulder stays as solid terrain for 6 s.
- **Target reaction:** Enemies at the centre are stunned 1 s with a dazed bronze ring above them. Enemies within 3 m are knocked back 2.5 m away from the centre.
- **Numbers:** Range 12 m, impact radius 3 m, 2.0x BA, stun 1 s at the centre (1 m), knock-back 2.5 m, boulder lasts 6 s with 3.0x BA HP. Cooldown 11 s.
- **Telegraph:** Enemies see a red-rimmed landing circle for 0.6 s. Allies see the boulder's outline as cover.
- **Team use:** Instant cover for marksmen like Oko, and a wall for Wrenna's wave to slam enemies into.

##### Pull the Nail (Transform / stance swap)

- **Cast:** He crouches, grips the nail in his ankle, and yanks it out. Golden ichor sprays from the wound in an arc. Base: UAL Fixing_Kneeling retimed to 0.5 s, with a sharp pull-up at the end.
- **Projectile / strike object:** The ichor itself: a glowing gold-red stream that spills from his ankle, and the nail, which he holds in one fist.
- **Flight:** Ichor pours as a ribbon from the ankle and drips onto the ground behind him as he moves (a trail of glowing droplets). Sound: a hiss of steam and a heartbeat that speeds up.
- **Impact:** Every step leaves a glowing gold footprint decal that fades in 1 s.
- **Target reaction:** Pyrrhos glows: golden ichor runs up the vein on his leg and spreads across his chest (emissive mask). Allies see a nail icon over his head: Hammer it back.
- **Numbers:** Lasts 4 s: +50% damage, +25% attack speed, immune to crowd control, but he loses 4% max HP per second. Any ally can tap him (interact) to hammer the nail back in: Pyrrhos regains 15% max HP, and both he and that ally get a 1.5x BA shield for 3 s. Otherwise he hammers it back himself at the end. Cooldown 18 s.
- **Telegraph:** Enemies see him blazing gold with a red rim: hard to stop, but bleeding out.
- **Team use:** Teams have to talk: someone needs to hammer him back in at the right time. The lore: someone always puts the nail back.

#### Passive: Patrol

As he moves, Pyrrhos leaves bronze footprints that last 8 s. If he walks a loop (returns within 2 m of a footprint at least 5 s old), he completes a Lap: +1 armour plate (max 3, each +8% damage reduction), and the area inside the loop becomes Guarded Ground for 5 s, where allies get +15% damage reduction.

*Visual tell:* Bronze plates (ring-shaped spawned meshes) stack on his shoulders as laps complete. His footprints glow faintly, and the most recent loop's outline brightens as it closes.

#### Super: Four Hundred Years of Patrol

> Pyrrhos stops, clicks his bronze heels together, and salutes. A shallow ghost sea washes around his ankles. Camera drops to knee height. He marches: down the lane, turn with a splash, back, turn, and out again, smashing everything in his path aside. Bronze footprints glow behind him like a sentry route on a map. At the end of the third pass he rips a boulder out of the ground and hurls it the way he once threw them at pirate ships.

- **Style:** Dash / leap strike (repeated charge along a fixed lane)
- **Cast:** He snaps to attention, salutes, and marches. Three times a day for four hundred years he walked this route, and now he walks it three times in four seconds.
- **Strike object:** Pyrrhos himself, unstoppable, wrapped in the ghost of the seabed: a shallow translucent sea surrounds him as he marches (water plane disc under him), and he leaves a line of bronze footprints. On the third pass, a giant boulder.
- **Flight:** He marches along an aimed 14 m lane three times (out, back, out) at 10 m/s, body-checking enemies aside. On the third pass he tears up a boulder and hurls it from the end of the lane. Sound: a march drum, waves breaking at each turn, a foghorn on the throw.
- **Impact:** The lane becomes Guarded Ground for 5 s with a line of glowing footprints. The final boulder makes a crater and stays as cover for 8 s.
- **Target reaction:** Enemies on the lane are body-checked aside 3 m each pass and briefly stunned 0.4 s with salt spray on them. The final boulder stuns 1.5 s at its centre. Allies on the lane see bronze plates appear around them.
- **Numbers:** Lane 14 m by 3 m, 3 passes in 4 s, 1.5x BA per pass, displacement 3 m, final boulder 3.0x BA, radius 3.5 m, stun 1.5 s. Guarded Ground gives allies +25% damage reduction for 5 s. Pyrrhos is crowd-control immune during the march.
- **Telegraph:** The full lane is shown red-rimmed for 0.8 s before he steps off, with arrows on each pass.
- **Team use:** Clears a corridor for your squad and armours allies standing on it. If Oko is on the team, Oko's lighthouse beam lights the lane and Pyrrhos marches a fourth pass.
- **Charge:** Laps and damage absorbed: each Lap completed is worth 10%, damage taken fills the rest. On his body, the red ichor vein on his leg glows and climbs up toward his chest. HUD: a small route map with three waypoints.
- **Counterplay:** The lane is shown 0.8 s early and he can't turn off it. Step out of the 3 m strip. He is crowd-control immune but still takes damage. After the march he stands still for 1 s, exhausted, steam venting from his joints: punish him then.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.8 s | UAL Idle_Loop into a salute pose layer | Heels click together, right hand snaps to the brow, held 0.3 s. | Ghost sea disc fades in under him; the lane is drawn. | None. | A drum roll; the heel click. |
| Action | 0.8-3.6 s | UAL Walk_Formal_Loop retimed to 260% speed | Stiff military march at speed with arms swinging. A 0.1 s pivot pose at each turn. | Footprint decals, a wake splash at turns, body-check sparks. | None. | March drum; waves on each turn. |
| Impact | 3.6-4.2 s | UAL PickUp_Table + OVERHAND_THROW | Rip and throw, two-handed, retimed to 0.6 s total. | Boulder flies, crater and spray ring. | Boulder mesh. | Foghorn; a deep impact. |
| Recovery | 4.2-5.2 s | UAL Idle_Loop with a slumped pose layer | Shoulders slump, head drops, steam vents from the joints. | Steam puffs at elbows and knees. | None. | Pressure hiss. |

#### Body language

- **Locomotion:** A measured sentry walk, perfectly regular, as if counting steps. The run is a stiff clockwork trot. Base: UAL Walk_Formal_Loop; Jog_Fwd_Loop with reduced arm swing.
- **Idle:** Stands at attention, turns his head left and right as if scanning the horizon for ships, sometimes taps the nail in his ankle with his toe. Base: UAL Idle_Loop with a stiffened pose layer.
- **Hit reaction:** A hollow clang and a shiver through his whole frame; a puff of salt. Base: UAL Hit_Chest.
- **Death:** The nail slides out of his ankle on its own. Ichor drains, his eyes dim, and he slowly freezes mid-step before toppling like a statue, landing with a bell-like gong. Base: UAL Death01 slowed to half speed from the midpoint.
- **Victory:** He salutes, then looks back over his shoulder as though checking whether someone is coming to relieve him. Base: UAL Idle_Loop with salute and head-turn layers.

#### Team combos

- **With Oko:** Oko's beam lights Pyrrhos's patrol lane. Pyrrhos marches a fourth pass: the lighthouse guides the sentry home.
- **With Wrenna Vael:** Boulder for Pirates leaves terrain. The Night Lirr Sank slams enemies into the boulder for the wall-stun.
- **With Corrin Ashgraft:** Pyrrhos pulls the nail. Corrin grafts him to share the drain, then hammers the nail back with a branch fist for both shields.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `pyrrhos_idle` | UAL Idle_Loop | custom pose layer | At attention; horizon scan; nail tap. |
| `pyrrhos_walk` | UAL Walk_Formal_Loop | reuse as-is | - |
| `pyrrhos_run` | UAL Jog_Fwd_Loop | custom pose layer | Reduced arm swing, stiff torso. |
| `pyrrhos_dodge` | UAL Roll | retime | Slower, heavier landing. |
| `pyrrhos_basic_1` | UAL Punch_Cross | retime | 15% slower with a 2-frame hold. |
| `pyrrhos_basic_2` | UAL Punch_Jab | custom pose layer | Mirrored with full torso rotation. |
| `pyrrhos_basic_3` | UAL MELEE_JUMP_LAND | custom pose layer | One-leg lift in front, landing frames only. |
| `pyrrhos_skill_boulder` | UAL PickUp_Table + OVERHAND_THROW | custom pose layer | Two-handed, retimed. |
| `pyrrhos_skill_pull_the_nail` | UAL Fixing_Kneeling | retime | 0.5 s with a sharp yank. |
| `pyrrhos_skill_hammer_back` | UAL Fixing_Kneeling | retime | Played by Pyrrhos or by the ally who interacts. |
| `pyrrhos_super_patrol` | UAL Walk_Formal_Loop / PickUp_Table / OVERHAND_THROW | custom pose layer | See beats. |
| `pyrrhos_hit` | UAL Hit_Chest | reuse as-is | - |
| `pyrrhos_death` | UAL Death01 | retime | Half speed from the midpoint. |
| `pyrrhos_victory` | UAL Idle_Loop | custom pose layer | Salute and look back. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `pyrrhos_arm_ghost` | mesh trail | Three translucent bronze copies of the forearm mesh trailing each swing. |
| `pyrrhos_salt_grit` | particles | Barnacle grit and white salt flecks. |
| `pyrrhos_stamp_ring` | decal + sprites | Cracked stone ring with seawater seams and small fountain sprites. |
| `pyrrhos_boulder` | spawned mesh | Barnacle-crusted sea boulder, 500 tris, with kelp strands (alpha cards). |
| `pyrrhos_crater` | decal | Dust crater with a splash ring. |
| `pyrrhos_ichor_stream` | ribbon + particles | Glowing gold-red ichor ribbon from the ankle; dripping droplets. |
| `pyrrhos_ichor_vein` | material mask | Emissive vein that climbs from the ankle to the chest. |
| `pyrrhos_footprints` | decal | Bronze footprints that glow faintly; loop outline highlight when closed. |
| `pyrrhos_armour_plate` | attached mesh | Bronze ring plates stacking on the shoulder bones, up to 3. |
| `pyrrhos_ghost_sea` | spawned mesh | Shallow water disc with a scrolling caustic texture under him during the super. |
| `pyrrhos_hammer_icon` | UI world icon | Nail-and-hammer icon over his head for allies while the nail is out. |

---

### Moss, Child of the Labyrinth

**Class:** Control: walls / Specialist: terrain-shaper  
**Basic style:** Boomerang / return  
**Team job:** Builds the maze: enemies get boxed in, while Moss's allies follow his red thread straight through the walls.  
**Palette:** moss green `#6FA332`, maze stone `#8A8C7E`, carving shadow `#5F6155`, hero's thread red `#C8231F`, skin `#E8A584`, horn bone `#CFC6B0`, hoof slate `#4E5450`, nose ring brass `#C9A13B`

#### Basic attack chain

##### Hit 1: Thread Ball (Boomerang / return)

- **Cast:** He unhooks a ball of red thread from the coil around his neck and bowls it underhand, keeping the loose end wrapped around his fingers. Base: UAL OVERHAND_THROW retimed to an underhand bowl with a forward lean.
- **Projectile / strike object:** A fist-sized ball of the hero's red thread that unspools as it flies, a taut red line connecting it back to his hand.
- **Flight:** Out straight at 16 m/s to 9 m, then he tugs and it reels back to his hand at 20 m/s, rewinding. The thread is a thin taut ribbon that sags slightly on the return. Sound: a soft whir going out, a zipping rewind coming back.
- **Impact:** A puff of red fibres where the ball hits. No decal.
- **Target reaction:** A blunt bonk that turns the head; a few red fibres cling to the victim.
- **Numbers:** Range 9 m, 0.7x BA going out and 0.7x BA returning (1.4x BA if both connect), 1.0 attacks/s.
- **Telegraph:** None.
- **Team use:** Returning hits clip enemies chasing your backline.

##### Hit 2: Thread Ball (Boomerang / return)

- **Cast:** Mirror with the left hand: a sidearm toss. Base: UAL OVERHAND_THROW mirrored, lower release.
- **Projectile / strike object:** Same ball, slightly more frayed.
- **Flight:** Same, curving 10 degrees on the return.
- **Impact:** Same.
- **Target reaction:** Same.
- **Numbers:** Same as hit 1.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Tangle (Boomerang / return)

- **Cast:** He spins the ball overhead on its thread like a sling, twice, then lets it fly. Base: UAL Spell_Simple_Enter with a looping arm swing, into OVERHAND_THROW.
- **Projectile / strike object:** A bigger thread ball with a loose loop trailing behind it.
- **Flight:** Out at 15 m/s. On the first enemy hit, it wraps around them three times (the thread visibly coiling), then unwinds and returns. Sound: a whirr, then a snap of thread pulling tight.
- **Impact:** A coil of red thread spirals around the victim and fibres drift.
- **Target reaction:** Tangled: red thread loops around the victim's wrists and ankles (a coiled ribbon overlay on the hand and foot bones), slowing 30% for 1.5 s. Their arms are pinned to the body for the first 0.3 s.
- **Numbers:** Range 9 m, 1.2x BA, slow 30% for 1.5 s.
- **Telegraph:** None.
- **Team use:** Tangled enemies are slow enough to box in with Maze Walls.

#### Skills

##### Maze Walls (Wall / terrain)

- **Cast:** Moss stamps a hoof, and the maze pattern on his tunic glows green. Base: UAL MELEE_JUMP_LAND (stamp frames) with an arm sweep layered on to aim the opening.
- **Projectile / strike object:** Modular stone wall segments carved with maze patterns, moss growing on their tops (spawned meshes, 2 m tall).
- **Flight:** Walls burst up from the ground around the target area in 0.3 s, rising with stone dust and moss flicking off. Sound: grinding stone and the echo of a long corridor.
- **Impact:** Forms a 4 m by 4 m box with a single exit that faces the direction Moss chooses. Walls stay 3 s.
- **Target reaction:** Trapped enemies bump against the walls (a recoil reaction) and see the walls with a red rim. Allies see a glowing red thread passing through the wall and can walk straight through it.
- **Numbers:** Range 9 m, box 4 by 4 m, walls 2 m tall, lasts 3 s, each segment 1.5x BA HP. Cooldown 14 s. 0.8x BA to enemies caught under a rising wall, plus a small knock-up.
- **Telegraph:** Enemies see red-rimmed wall outlines 0.3 s before they rise.
- **Team use:** Box the target, then your squad walks in through the walls. Wrenna's Sounding loves a box.

##### Ariadne's Thread (Tether (with pull))

- **Cast:** He unwinds the red thread from his neck, ties one end around his own wrist, and tosses the other end to an ally. Base: UAL Interact into OVERHAND_THROW.
- **Projectile / strike object:** A long glowing red thread linking Moss's wrist to the ally's wrist.
- **Flight:** The end flies to the ally at 22 m/s and knots around their wrist. The tether sags and sways naturally (verlet rope, 8 segments). Sound: a soft knot tightening.
- **Impact:** A red thread bracelet appears on the ally's wrist.
- **Target reaction:** The ally sees a red bracelet and a glowing thread. Moss can tug once: pull the ally 6 m to his side (out of danger), or pull himself to the ally.
- **Numbers:** Range 10 m, tether lasts 8 s, breaks at 14 m. One tug: 6 m pull over 0.3 s. Cooldown 12 s.
- **Telegraph:** Allies see the thread in bright red with a soft outline; enemies see a thin grey-rimmed thread.
- **Team use:** A rescue line: tie it to the diver going in, then yank them back out.

#### Passive: The Labyrinth Follows

When Moss stands still for 2 s, a single maze wall segment (2 m wide) rises behind him as cover; max 2 segments, each lasts 6 s. Moss and allies within 3 m of him pass through any wall, his or anyone else's.

*Visual tell:* The carved maze lines on his tunic glow green as a wall is about to rise. The red thread around his neck stirs as if alive (vertex wiggle).

#### Super: The Labyrinth Followed

> Moss closes his eyes, and the ground around the whole fight shakes. Walls of carved, mossy stone surge up in a rolling wave until the arena is a labyrinth. Camera rises to a near-top-down view for a moment to show the maze. Enemies turn in place, lost, and the corridors echo with the distant bellow of a beast. Then the red thread unwinds from Moss's neck and splits, laying a glowing line through the maze from each of his allies straight to their prey. They walk right through the stone.

- **Style:** Wall / terrain (arena-scale)
- **Cast:** Moss shuts his eyes and lets out a long, tired breath. The labyrinth he spent his whole childhood inside comes up out of the ground around him.
- **Strike object:** A full maze: dozens of carved, moss-topped wall segments in a 14 m radius (one of three hand-authored maze prefabs, rotated to the cast direction), and the hero's red thread laid through it.
- **Flight:** Walls rise in a wave rolling outward from Moss over 0.8 s. Then a red thread unspools from his neck, splits into one strand per ally, and runs through the maze from each ally to the nearest enemy, a glowing path. Sound: deep stone grinding, a far-off bull's bellow echoing in corridors.
- **Impact:** Maze stays 6 s. The ground inside becomes a dim corridor decal with a faint maze pattern. Three exits glow faintly at the edge.
- **Target reaction:** Enemies inside are Lost: their minimap blanks out and their screen edge shows a stone vignette. Bumping a wall staggers them back. Allies see the red thread under their feet leading them, and pass through walls freely.
- **Numbers:** Radius 14 m, lasts 6 s, each wall segment 2.0x BA HP. Allies walking through walls get +20% move speed. Enemies hitting a wall take 0.5x BA and a 0.3 s stagger.
- **Telegraph:** Enemies see the red-rimmed wave of walls rising toward them for 0.8 s.
- **Team use:** Splits the enemy team apart so your squad can pick them off one corridor at a time. Moss always knows the way out.
- **Charge:** Wrong turns: every time an enemy bumps one of his walls or is hit by the thread ball, he gains charge. Walls standing count over time too. On his body, the red thread coil on his neck grows longer, wrapping one more loop around his shoulders per 20%. HUD: a tiny maze icon that fills from the outside in.
- **Counterplay:** The thread is visible to everyone, so enemies can follow it in reverse to find the allies hunting them. Wall segments can be broken by heavy hits. Leaps and blinks hop over walls. The three exits glow, so enemies who look can walk out.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.5 s | UAL Idle_Loop into a head-bowed pose layer | Eyes close, shoulders slump in a long exhale, hands drop to his sides. | Maze carvings on the tunic flare green; the ground trembles (camera shake). | None. | A long sigh; low rumble. |
| Action | 0.5-1.3 s | UAL MELEE_JUMP_LAND (stamp) mirrored twice | Two hoof stamps, left then right. | Walls rise in a rolling outward wave. | Maze wall prefab, about 40 segments, instanced. | Stone grinding; corridor echo. |
| Impact | 1.3-1.8 s | UAL Spell_Simple_Shoot | Arms swing out wide, letting the thread go. | Red thread splits into one strand per ally and runs through the maze. | Thread ribbons. | A distant bull's bellow. |
| Recovery | 1.8-2.3 s | UAL Idle_Loop | He looks around the maze, sad and tired. | Moss particles drift down. | None. | Dripping water in the corridors. |

#### Body language

- **Locomotion:** A gentle, slightly bow-legged walk on hooves, head ducked so the horns don't catch. The run is a loping trot that turns into a short charge with the head low when sprinting. Base: UAL Walk_Loop; Sprint_Loop with a head-lowered layer.
- **Idle:** He winds the red thread around his finger, yawns, rubs his eyes, and touches a wall that isn't there yet, as if checking for it. Base: UAL Idle_Loop with additive hand layers; a yawn layer.
- **Hit reaction:** He flinches and covers his head with his arms, horns down. Base: UAL Hit_Head.
- **Death:** He curls up on his side like he's going to sleep, and a ring of small stone walls rises around him, closing him in. Base: UAL Death02 blended into the LAYFACEUP end pose turned on its side.
- **Victory:** He lies down on open ground and stretches out, smiling, with no walls around him at all. Base: UAL LAYFACEUP.

#### Team combos

- **With Thimble:** Moss boxes an enemy in with Maze Walls. Thimble swaps the enemy carry into the box, or swaps a trapped ally out of it.
- **With Wrenna Vael:** Maze Walls hold enemies on the compass rose. Sounding floods a box nobody can walk out of.
- **With Oko:** Moss stands beside Oko while Oko channels his Sweeping Beam, so his passive raises cover walls next to them. Oko gets free cover against enemy skillshots while he sweeps, and he can step through the walls with Moss when divers arrive.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `moss_idle` | UAL Idle_Loop | custom pose layer | Thread winding; yawn; eye rub. |
| `moss_walk` | UAL Walk_Loop | custom pose layer | Head ducked slightly. |
| `moss_run` | UAL Jog_Fwd_Loop | reuse as-is | - |
| `moss_sprint` | UAL Sprint_Loop | custom pose layer | Head lowered for a charge. |
| `moss_dodge` | UAL Roll | reuse as-is | - |
| `moss_basic_1` | UAL OVERHAND_THROW | retime | Underhand bowl. |
| `moss_basic_2` | UAL OVERHAND_THROW | retime | Mirrored sidearm. |
| `moss_basic_3` | UAL Spell_Simple_Enter + OVERHAND_THROW | custom pose layer | Overhead sling loop twice. |
| `moss_skill_maze_walls` | UAL MELEE_JUMP_LAND | custom pose layer | Hoof stamp plus an arm sweep to aim the exit. |
| `moss_skill_ariadnes_thread` | UAL Interact + OVERHAND_THROW | custom pose layer | Tie the thread to his wrist, then toss. |
| `moss_super_labyrinth` | UAL Idle_Loop / MELEE_JUMP_LAND / Spell_Simple_Shoot | custom pose layer | See beats. |
| `moss_hit` | UAL Hit_Head | custom pose layer | Arms over the head. |
| `moss_death` | UAL Death02 + LAYFACEUP | custom pose layer | Curl up on his side. |
| `moss_victory` | UAL LAYFACEUP | reuse as-is | - |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `moss_thread_ball` | projectile mesh | Fist-sized red yarn ball with a scrolling thread texture so it looks like it unspools. |
| `moss_thread_line` | tether ribbon | Thin taut red ribbon from his hand to the ball; sags on the return. |
| `moss_tangle_coil` | status overlay | Red thread coils on the victim's wrist and ankle bones. |
| `moss_maze_wall` | spawned mesh | 2 m stone segment with carved maze relief and a moss cap; 120 tris per segment. |
| `moss_wall_rise` | particles | Stone dust burst and moss flicks. |
| `moss_thread_through_wall` | decal + ribbon | A glowing red thread line on the ground that passes through walls for allies. |
| `moss_ariadne_thread` | tether ribbon (verlet) | 8-segment rope ribbon in glowing red with a knot sprite at each end. |
| `moss_maze_prefabs` | spawned mesh set | Three 14 m maze layouts built from instanced wall segments. Fallback: half the segments plus decal outlines for the rest. |
| `moss_lost_vignette` | screen overlay (enemy only) | Stone-edge vignette on the enemy's own screen. |
| `moss_tunic_glow` | material mask | Green emissive on the tunic's maze carvings. |

---

### Ione, the Unsung

**Class:** Support: buffer / Support: cleanser  
**Basic style:** Ally-targeted buff / heal (dual-use homing notes)  
**Team job:** Speed for the whole squad and a song that pulls a trapped ally home: Ione decides how fast her team moves and who gets out alive.  
**Palette:** drowned skin `#7A9187`, scale teal `#3FB6B0`, hair deep teal `#1F4E4A`, music box brass `#B8923A`, sailcloth `#CDB98A`, shell ivory `#E6DCC6`, fog white `#EAF4F2`, fog grey `#A9B6B8`

#### Basic attack chain

##### Hit 1: Plucked Note (Ally-targeted buff / heal (homing))

- **Cast:** She gives the key on the side of the music box at her chest one click with her right hand, then opens that hand toward the target as the note sounds. Tap fires at the nearest enemy; drag the attack stick over an ally to send the note to them instead. Base: UAL Spell_Simple_Shoot with a short crank-turn layer on the right wrist.
- **Projectile / strike object:** A single music-box tine (a thin brass comb tooth) wrapped in a glowing note glyph, riding on a wisp of sea fog.
- **Flight:** Homing, 15 m/s, gentle S-curve, 10 m. Fog curls behind it (soft particle ribbon) and tiny brass sparkles fall off. Sound: one plucked music-box note; each hit in the chain plays the next note of her tune.
- **Impact:** On an enemy: a small burst of cold fog and a cracked note glyph. On an ally: a warm ripple of brass light at their chest.
- **Target reaction:** Enemy: a slight sway as if dizzy, with a crooked note glyph circling their head (Off-key: slowed 12% for 1.5 s). Ally: a brass note settles above their head and they see a soft teal ripple on their body: a small heal and haste.
- **Numbers:** Range 10 m, 0.9x BA damage to enemies, or 0.45x BA heal plus +10% move speed for 1.5 s to allies. 1.1 attacks/s.
- **Telegraph:** None (homing).
- **Team use:** Every ally note also counts toward her passive.

##### Hit 2: Second Note (Ally-targeted buff / heal (homing))

- **Cast:** Same, cranking with the left hand this time, so she twists to reach the key. Base: UAL Spell_Simple_Shoot mirrored.
- **Projectile / strike object:** Same tine, the next note higher.
- **Flight:** Same.
- **Impact:** Same.
- **Target reaction:** Same.
- **Numbers:** Same as hit 1.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Chord (Ally-targeted buff / heal (homing, split))

- **Cast:** She cranks the key a full turn with both hands and the box plays a three-note chord. Her head tilts back as though she is singing behind the cage. Base: UAL Spell_Simple_Enter into Spell_Simple_Shoot.
- **Projectile / strike object:** Three tines with glyphs, each a different colour of brass (pale, bright, dark).
- **Flight:** Three homing notes fan out, each picking a different target (enemies or allies, nearest first), at 14 m/s. Sound: a chord in a minor key.
- **Impact:** Each note bursts on its target as above.
- **Target reaction:** As hit 1, per note.
- **Numbers:** Range 10 m, 3 notes, each 0.6x BA damage or 0.35x BA heal plus haste.
- **Telegraph:** None.
- **Team use:** Spreads small heals and speed across the squad in one beat.

#### Skills

##### Wind the Box (Aura)

- **Cast:** She grips the key on her music box and cranks it three full turns, each turn a distinct shoulder roll. The tune begins to play. Base: UAL Fixing_Kneeling upper-body crank motion layered on Idle_Loop, three repetitions, then a release.
- **Projectile / strike object:** The tune itself: a ring of floating brass notes and musical staff lines circling Ione, carried on fog.
- **Flight:** The aura expands to 6 m in 0.3 s. Notes orbit at the edge, and as the tune runs down they slow and the ring shrinks. Sound: the full music-box tune, which audibly slows down toward the end.
- **Impact:** A faint fog ring decal under her that shrinks with the aura.
- **Target reaction:** Allies inside see brass notes orbiting their feet and a teal speed shimmer on their legs. The tune runs down, so the buff fades as the ring shrinks.
- **Numbers:** Radius 6 m, lasts 6 s (radius shrinks from 6 m to 3 m), allies get +25% move speed and +10% attack speed. Cooldown 16 s.
- **Telegraph:** Allies see a soft teal ring with white notes. Enemies see nothing harmful (no red rim).
- **Team use:** Engage speed for divers like Fenwick and Nyssa, or escape speed for everyone.

##### Sing Them Home (Pull / hook (ally))

- **Cast:** She grips the brass cage over her mouth and pulls its little door open (a hinged prop piece on the head bone, rotated in code). She leans toward the target ally and sings one long note. Base: UAL Spell_Simple_Shoot with a reaching hand and a forward-lean layer.
- **Projectile / strike object:** A guiding light: a lantern-gold beam of fog-light (like the lighthouse she used to sing boats past) that reaches out to the ally.
- **Flight:** A hitscan fog-light beam to the ally, then the ally is drawn along it toward Ione at 18 m/s. Sound: her real voice, a long clear note, the only time she sings outside her super.
- **Impact:** A trail of glowing fog along the pull path that lingers 1 s.
- **Target reaction:** The ally is lifted slightly and glides toward her. They see a warm lantern glow, and slows, roots and charms are washed off them in a ripple of seawater.
- **Numbers:** Range 12 m, pulls the ally to within 2 m of Ione, cleanses slows, roots and charms. Ione loses 8% max HP (her throat bleeds). Cooldown 18 s.
- **Telegraph:** Allies see a gold line; enemies see a grey-rimmed beam.
- **Team use:** The squad's pull to safety: grab the diver who went too deep, or the carry who got rooted.

#### Passive: The Only Tune

Each different ally Ione touches with a note or aura in 8 s gets a brass note above their head. When three different allies carry a note, her next Wind the Box is 50% stronger, and her next basic becomes a Chord.

*Visual tell:* The brass comb tines visible inside the music box on her chest light up one per noted ally. The crank key turns on its own a few degrees when she's ready.

#### Super: The Song That Answered

> Ione grips the brass cage over her mouth and wrenches it off. It falls and clinks on the stones. Camera tilts low on her face. She sings, and fog pours out of nowhere, rolling across the arena. Inside it her allies are lit by small warm lantern lights, as if boats were coming home. Her enemies stop, turn, and walk dreamily toward her voice. Underneath it all, from somewhere far below the arena floor, something sings back.

- **Style:** Aura (siren song: buff and charm)
- **Cast:** She tears the brass cage from her mouth (the cage prop detaches and falls) and, for the first time since Lirr sank, sings.
- **Strike object:** A rolling bank of sea fog spreading from Ione, filled with warm guiding lantern lights for allies and cold, beckoning lights for enemies, plus visible ripples of her voice.
- **Flight:** The fog rolls out to 16 m over 1 s (a ring of fog cards plus a ground fog decal). Voice ripples pulse from her every 0.5 s as rings of sheet-music staves. Sound: her full siren voice, unaccompanied, with a faint deep voice answering from under the ground.
- **Impact:** The fog stays for 5 s with soft lantern-glow spots. When it lifts it leaves a damp sheen on the ground.
- **Target reaction:** Allies are Sung Home: a warm lantern glow around them, +35% move speed, and they can't be targeted by enemies further than 8 m away (the fog hides them). Enemies are Charmed: they turn and walk slowly toward Ione for 1.5 s with blank faces and fog curling from their eyes, then are slowed 30% for the rest.
- **Numbers:** Radius 16 m, lasts 5 s. Allies: +35% speed, hidden beyond 8 m, heal 0.4x BA/s. Enemies: charm 1.5 s (breaks if they take damage after 0.5 s), then slow 30%. Ione is rooted while singing and loses 3% max HP per second.
- **Telegraph:** Enemies see the fog bank with a red rim at its edge and her cage falling. Allies see a soft teal edge.
- **Team use:** Turns a retreat into a clean escape or an engage into a slaughter. If The Sleeper is in the match, it answers: on Ione's team, it gets its super charged by 25%; on the enemy team, it is charmed for 3 s.
- **Charge:** Notes played: every heal, haste, aura tick and cleanse she gives an ally fills the super. On her body, the music box crank spins faster and the lid glows brighter brass. HUD: a music-box icon with a rotating comb.
- **Counterplay:** Charm breaks on damage after 0.5 s, so enemies who still get hit snap out early. Ione is rooted and bleeding for the whole 5 s. Any stun or silence ends the song immediately. Enemies within 8 m can still see and hit her allies.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.6 s | UAL Interact | Both hands grip the cage and wrench it forward off her face; the cage prop detaches. | Cage prop drops with a spark; fog begins to curl from her feet. | Mouth-cage prop released to physics, falling. | A metallic clank; a sharp breath. |
| Action | 0.6-1.6 s | UAL Spell_Simple_Enter into Spell_Simple_Idle_Loop | Arms open wide, chest lifted, head back. | Fog bank rolls out to 16 m; voice rings pulse. | None. | Her full voice rises; a deep answer from below. |
| Impact | 1.6-5.6 s | Spell_Simple_Idle_Loop with a slow sway | Swaying as she sings; hair floats (vertex wind on hair cards only). | Lantern-glow lights on allies, charm fog on enemies. | None. | Sustained song. |
| Recovery | 5.6-6.4 s | UAL COUGHING | She coughs, hand to throat, and picks the cage back up. | Fog thins out. | Cage prop re-attached. | Her cough; the music box clicks back on. |

#### Body language

- **Locomotion:** A drifting walk with bare feet barely lifting, as if wading. The run is a long-strided glide with the arms trailing back. Base: UAL Walk_Loop retimed 10% slower; Jog_Fwd_Loop with arms swept back.
- **Idle:** Turns the music-box key a little, listens to the single tune, then touches the cage over her mouth sadly. Base: UAL Idle_Loop with additive hand layers.
- **Hit reaction:** The music box skips a note with a sour twang; she clutches it protectively. Base: UAL Hit_Chest.
- **Death:** She sinks down as if underwater, hair floating upward. The music box plays its tune slower and slower until it stops on an unfinished note. Base: UAL Death01 slowed to 70% with an upward hair float.
- **Victory:** She winds the music box, closes her eyes, and sways to its tune. Base: UAL Dance_Loop retimed to 60%, upper body only.

#### Team combos

- **With The Sleeper:** Ione sings during the Sleeper's flood. On the same team, the Sleeper's super gets 25% charge, and charmed enemies in the flood fall asleep instead of walking.
- **With Fenwick Marl:** Wind the Box gives Fenwick +25% speed. His lunges and Name Tag leaps reach targets before they can react.
- **With Hob Tallagh:** Wind the Box speeds up the squad's attacks. Allied tolls stack to seven faster.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `ione_idle` | UAL Idle_Loop | custom pose layer | Key turn; touch the cage. |
| `ione_walk` | UAL Walk_Loop | retime | 10% slower, wading feel. |
| `ione_run` | UAL Jog_Fwd_Loop | custom pose layer | Arms swept back. |
| `ione_dodge` | UAL Roll | reuse as-is | Fog puff. |
| `ione_basic_1` | UAL Spell_Simple_Shoot | custom pose layer | Wrist crank click. |
| `ione_basic_2` | UAL Spell_Simple_Shoot | custom pose layer | Mirrored crank. |
| `ione_basic_3` | UAL Spell_Simple_Enter + Spell_Simple_Shoot | retime | Full crank turn. |
| `ione_skill_wind_the_box` | UAL Fixing_Kneeling (upper body) on Idle_Loop | custom pose layer | Three crank turns. |
| `ione_skill_sing_them_home` | UAL Spell_Simple_Shoot | custom pose layer | Reaching hand and forward lean; cage door opened in code. |
| `ione_super_song_answered` | UAL Interact / Spell_Simple_Enter / Idle_Loop / COUGHING | custom pose layer | See beats. |
| `ione_hit` | UAL Hit_Chest | custom pose layer | Clutch the box. |
| `ione_death` | UAL Death01 | retime | 70% speed. |
| `ione_victory` | UAL Dance_Loop | retime | 60% speed, upper body only. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `ione_tine_note` | projectile mesh + sprite | Thin brass tine with a glowing note glyph billboard; fog wisp ribbon. |
| `ione_fog_wisp` | ribbon trail | Soft fog-white ribbon with a teal tint. |
| `ione_offkey_glyph` | status overlay | A crooked, cracked note glyph circling an enemy's head. |
| `ione_note_buff` | status overlay | Small brass note above an ally's head. |
| `ione_tune_ring` | aura mesh + sprites | Staff-line ring with orbiting notes that slows and shrinks over 6 s. |
| `ione_guiding_beam` | hitscan beam | Lantern-gold fog-light beam with drifting motes. |
| `ione_cleanse_ripple` | impact flipbook | Ring of seawater washing off the ally. |
| `ione_fog_bank` | fog cards + ground decal | 16 m rolling fog ring with soft lantern spots. Fallback: ground fog decal and 6 cards. |
| `ione_charm_eyes` | status overlay | Fog curling from charmed enemies' eyes, blank expression tint. |
| `ione_voice_rings` | spawned mesh | Staff-line rings pulsing outward every 0.5 s. |
| `ione_cage_prop` | detachable prop | Brass mouth cage that can detach and fall during the super. |

---

### Fenwick Marl, the Inverse Wolf

**Class:** Damage: skirmisher / Frontline: bruiser  
**Basic style:** Dash / leap strike  
**Team job:** A late-game hunter: he tags a target for the whole squad, leaps onto it, and gets stronger the longer the match goes.  
**Palette:** wolf grey `#6E6E6A`, pale fur `#A8A39A`, yellow eye `#F2C230`, vest brown `#6A3F25`, linen `#D8D2C4`, tag brass `#C59A3A`, moon silver `#DDE6F2`, charcoal `#3E3C3A`

#### Basic attack chain

##### Hit 1: Lunge (Dash / leap strike)

- **Cast:** He drops his weight forward and springs 2.5 m at the target, swiping a clawed hand diagonally. Base: UAL SWORD_DASH with empty hands, retimed to 0.3 s, plus a claw-swipe arm layer.
- **Projectile / strike object:** Three pale moon-silver claw ribbons (one per finger), with grey fur tufts shed along the lunge.
- **Flight:** A short dash, 2.5 m in 0.2 s. Claw ribbons sweep diagonally and fade in 0.25 s, with a dust kick from his boots. Sound: a snarl and a cloth-rip swish.
- **Impact:** Three parallel scratch marks glow briefly on the target. A short claw-gouge decal on the ground, 1 s.
- **Target reaction:** Twisted aside by the swipe, with scratch marks glowing silver on the torso for 1 s.
- **Numbers:** Lunge 2.5 m, reach 1.8 m, 1.0x BA, 1.2 attacks/s.
- **Telegraph:** None.
- **Team use:** Constantly repositions him onto targets; he sticks to fleeing carries.

##### Hit 2: Lunge (Dash / leap strike)

- **Cast:** Mirror with the other claw, angled up. Base: SWORD_DASH mirrored.
- **Projectile / strike object:** Same ribbons, angled upward.
- **Flight:** Same.
- **Impact:** Same.
- **Target reaction:** Same, lifted slightly.
- **Numbers:** Same as hit 1, 1.05x BA.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Pounce (Dash / leap strike)

- **Cast:** He crouches low (a 0.15 s hold) and leaps 4 m, both claws raised over his head, landing on the target with all his weight. Base: UAL NINJUMP_JUMP into NINJUMP_LAND, with both arms up.
- **Projectile / strike object:** Paired double claw ribbons forming an X, plus a wolf-head silhouette afterimage (a faint wolf-shaped billboard sprite) at the apex.
- **Flight:** Short arc, 4 m, 0.35 s, apex 1.2 m. Fur and dust trail behind. Sound: a snarl that becomes a short bark.
- **Impact:** A dust and fur burst; an X-shaped claw-gouge decal, 2 s.
- **Target reaction:** Knocked flat for 0.3 s (knock-down) with an X scratch glowing on them.
- **Numbers:** Leap 4 m, radius 1.5 m, 1.5x BA, knock-down 0.3 s.
- **Telegraph:** A 0.15 s crouch with his eyes flaring yellow.
- **Team use:** The knock-down is long enough to land a skillshot like Oko's Fresnel Lance or Thimble's button.

#### Skills

##### Name Tag (Aimed skillshot line (with recast leap))

- **Cast:** He rips one of the thirty-one brass name tags off his collar with his teeth (head dip plus a hand pull) and flings it sidearm. Base: UAL OVERHAND_THROW sidearm, with a head-dip layer.
- **Projectile / strike object:** A small brass dog tag engraved with a name from one of the families (BISCUIT, PIP, CAPTAIN, MR. WOLF and so on, random each cast).
- **Flight:** Straight line, 24 m/s, 10 m, spinning flat with a glint. Sound: a jingle, and a family voice calling the name, faint.
- **Impact:** The tag sticks to the target with a little brass clink.
- **Target reaction:** Tagged: the brass tag dangles from the target's neck for 6 s with its name floating above it, so the whole squad can read it. Fenwick can recast to leap onto them from up to 10 m.
- **Numbers:** Range 10 m, 1.0x BA. Tagged 6 s: Fenwick and allies deal +15% damage to the target. Recast: leap to the target, 1.4x BA. Cooldown 10 s.
- **Telegraph:** Enemies see a thin red line before the throw. Allies see the tag's name in yellow over the target.
- **Team use:** A visible focus-fire call for the squad: everyone hits the dog with the name tag.

##### Howl at Nothing (Cone spray)

- **Cast:** He throws his head back and howls, even though he hates it, his hands half-raised as if embarrassed. Base: UAL Idle_Talking_Loop torso, with a head-back spine layer held 0.6 s.
- **Projectile / strike object:** Pale crescent-moon rings rolling out of his mouth like sound waves.
- **Flight:** A 60-degree cone, 6 m, rings expanding at 10 m/s, each ring a thin moon crescent. Sound: a long, lonely wolf howl that cracks at the end into a cough.
- **Impact:** Frost-silver crescent marks on the ground, fading in 1.5 s.
- **Target reaction:** Enemies are Feared for 1 s: they turn and run away from him with their arms flailing, a crescent glyph above their heads. Allies within 8 m hear the howl and get a pale moon shimmer: Pack.
- **Numbers:** Cone 6 m by 60 degrees, 0.6x BA, fear 1 s, cooldown 14 s. Allies within 8 m get +15% move speed for 3 s.
- **Telegraph:** Enemies see a red-rimmed cone flash 0.25 s before.
- **Team use:** Peel: scatter divers off your healer. Engage: the Pack speed buff lets the squad close in.

#### Passive: Waning Moon

Fenwick grows stronger the longer the match lasts: every 60 s, and every takedown he's part of, the moon over him wanes one phase (5 phases). Each phase gives +5% damage and +3% attack speed. At the last phase he sprints on all fours (+10% sprint speed).

*Visual tell:* His borrowed clothes visibly tear further each phase (a shader dissolve on the shirt and vest), the name tags rattle more, and a small moon crescent above his HUD bar thins. His tail is part of the mesh skinned to the hips bone with a vertex-shader sway, so it wags more in later phases.

#### Super: No Moon at All

> The light dims. Overhead, a full moon hangs above the arena, then visibly shrinks and goes dark. Fenwick drops to all fours, and his outline swells into a vast silver wolf. He howls, and many wolves howl with him. Then he vanishes from spot to spot across the fight in silver arcs, slashing, until the last enemy is on the ground. As the moon comes back, he's just a scruffy man in a torn vest again, and one name tag on his collar glows warmly.

- **Style:** Dash / leap strike (chain between targets)
- **Cast:** Fenwick drops to all fours and looks up. The full moon above the arena darkens and goes out, the one night a month he gets to stop being a man. He becomes, for a few seconds, entirely wolf.
- **Strike object:** A huge spectral wolf shape around him (a translucent wolf-shaped shell made from layered billboard cards around his body), silver at the edges, plus moon-claw slashes.
- **Flight:** He chain-leaps between up to 6 enemies within 6 m of each other, 0.3 s per leap, each leap a silver arc trail. Each target gets an X of moon-claws. Sound: a pack howl layered from many wolves, each leap a snarl.
- **Impact:** Every landing leaves a silver X decal (2 s). The arena's ambient light dims while it lasts.
- **Target reaction:** Each victim gets a silver X slash and a short stagger. The last target is knocked down for 0.8 s. A family name tag glints over each victim's head.
- **Numbers:** Up to 6 leaps, 6 m max between targets, 1.6x BA per leap (a single target can be hit twice at most). The final hit knocks down for 0.8 s. Fenwick is untargetable during each leap's air time (0.2 s). At the end, he gets a shield of 2.0x BA: one family's porch light.
- **Telegraph:** Enemies see a red marker over the next target 0.3 s before each leap.
- **Team use:** Cleans up a fight the squad started. The Tagged target from Name Tag is always leaped to first.
- **Charge:** Moon phases: charge fills from match time (slowly) and from hits and takedowns. On his body, his yellow eyes glow brighter and the brass tags on his collar shine one by one. HUD: a moon icon that wanes from full to new.
- **Counterplay:** Spread out more than 6 m apart and the chain stops. Each next target is marked 0.3 s before the leap. Any hard crowd control on Fenwick between leaps ends the chain. He shows up with a big shield at the end, so burst him just before it.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.6 s | UAL Crouch_Idle_Loop | Drops low on hands and feet, head lifts to the sky, held 0.3 s. | Moon sprite in the sky darkens; the wolf-shell cards fade in around him. | None. | Heartbeat; a low growl. |
| Action | 0.6-2.4 s | UAL NINJUMP_SLASH chained | A leap-slash per target, each 0.3 s with a 0.05 s hold on contact. | Silver arc trails, X slashes, enemy markers. | None. | Pack howl; snarl per leap. |
| Impact | 2.4-2.8 s | UAL NINJUMP_LAND | Lands in a crouch on the last target, claws down. | Silver burst, knock-down dust. | None. | A final bark. |
| Recovery | 2.8-3.4 s | UAL Idle_Loop from a crouch | Stands up awkwardly, tugs his vest straight, embarrassed. | Wolf shell fades; one name tag glows. | None. | Panting; the tags jingle. |

#### Body language

- **Locomotion:** Upright he walks awkwardly, as if his boots pinch, shoulders hunched. He runs leaning far forward. In late phases his sprint drops to all fours. Base: UAL Walk_Loop with a hunch; Sprint_Loop; Crouch_Fwd_Loop retimed fast for the four-legged sprint.
- **Idle:** Scratches behind an ear with a clawed hand, sniffs the air, tugs at his collar of tags in irritation. Base: UAL Idle_Loop with additive head and hand layers.
- **Hit reaction:** He yelps and flinches with his ears flattening (an ear-shape morph would need blend shapes, so instead he ducks his head sharply). Base: UAL Hit_Head.
- **Death:** He drops to all fours, then lies down on his side like a tired dog. The name tags spill off his collar onto the ground. Base: UAL Death02.
- **Victory:** He sits on the ground with his legs out, scratches behind an ear, then looks at one particular name tag and almost smiles. Base: UAL Sitting_Idle_Loop.

#### Team combos

- **With Aurvan:** Aurvan lets the moon out (an allied super). Fenwick's super charge jumps by 50%: the moon is the reason for his curse.
- **With Ione:** Wind the Box speeds the squad up. Fenwick's Lunges and Name Tag leap chain into targets twice as fast.
- **With Sir Halven:** Halven's Lookout reveals isolated enemies. Fenwick Name Tags and leaps onto the lone target.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `fenwick_idle` | UAL Idle_Loop | custom pose layer | Ear scratch; sniff; collar tug. |
| `fenwick_walk` | UAL Walk_Loop | custom pose layer | Hunched shoulders. |
| `fenwick_run` | UAL Jog_Fwd_Loop | custom pose layer | Forward lean. |
| `fenwick_sprint_wolf` | UAL Crouch_Fwd_Loop | retime | 200% speed, hands brushing the ground, for late phases. |
| `fenwick_dodge` | UAL Roll | reuse as-is | - |
| `fenwick_basic_1` | UAL SWORD_DASH | custom pose layer | Empty hands, claw swipe, 0.3 s. |
| `fenwick_basic_2` | UAL SWORD_DASH | custom pose layer | Mirrored, upward swipe. |
| `fenwick_basic_3` | UAL NINJUMP_JUMP + NINJUMP_LAND | custom pose layer | 0.15 s crouch hold, both arms raised. |
| `fenwick_skill_name_tag` | UAL OVERHAND_THROW | custom pose layer | Sidearm, with a teeth-pull head dip. |
| `fenwick_skill_howl` | UAL Idle_Talking_Loop | custom pose layer | Head back 0.6 s, hands half raised. |
| `fenwick_super_no_moon` | UAL Crouch_Idle_Loop / NINJUMP_SLASH / NINJUMP_LAND | custom pose layer | See beats. |
| `fenwick_hit` | UAL Hit_Head | reuse as-is | - |
| `fenwick_death` | UAL Death02 | reuse as-is | - |
| `fenwick_victory` | UAL Sitting_Idle_Loop | custom pose layer | Ear scratch layer. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `fenwick_claw_ribbon` | ribbon trail | Three moon-silver ribbons from the fingertip bones, fading in 0.25 s. |
| `fenwick_fur_tufts` | particles | Grey fur tufts on lunges. |
| `fenwick_claw_decal` | decal | Three-line claw gouge; an X variant for Pounce. |
| `fenwick_wolf_silhouette` | billboard sprite | A faint wolf head shape at the Pounce apex. |
| `fenwick_name_tag` | projectile mesh + text sprite | Small brass tag with a random engraved name; the name floats over the tagged target. |
| `fenwick_moon_rings` | spawned mesh | Thin crescent rings expanding in a cone. |
| `fenwick_fear_glyph` | status overlay | Small crescent moon glyph above feared enemies. |
| `fenwick_clothes_tear` | material mask | Dissolve mask on shirt and vest per moon phase. |
| `fenwick_wolf_shell` | billboard cards | Layered silver wolf-shaped cards around his body. Fallback: one wolf billboard. |
| `fenwick_moon_sky` | sky sprite | Arena moon sprite that darkens during the super. |

---

### Thimble, the Left-Behind

**Class:** Specialist: mobility enabler / Specialist: saboteur  
**Basic style:** Aimed skillshot line  
**Team job:** Moves people: he swaps an ally out of danger, opens fairy-ring portals for the squad, and swaps the enemy carry into the middle of your team.  
**Palette:** fae green skin `#8DB25A`, mustard sweater `#B8A23A`, patch red `#C2404A`, satchel leather `#8A4B2E`, thimble steel `#5C5A55`, ear pink `#E6967A`, fae glow `#C7F06B`, boot brown `#7A4A2C`

#### Basic attack chain

##### Hit 1: Button Shot (Aimed skillshot line)

- **Cast:** He pulls a little slingshot from his satchel (a forked hazel twig with a knitted sock for the band; prop on the right hand bone), loads a button from his sweater cuff, and fires. Base: UAL Pistol_Aim_Neutral into Pistol_Shoot, with the left hand drawing back the band.
- **Projectile / strike object:** A mismatched sweater button (wooden, horn or red plastic, chosen at random) trailing a single strand of mustard yarn pulled from his sweater.
- **Flight:** Straight line, 22 m/s, 10 m. The yarn strand trails out behind it for 1.5 m and snaps off. Sound: a twangy pop, a little whistle through the button holes.
- **Impact:** The button bounces off with a tiny pop of yarn fluff.
- **Target reaction:** A flinch with one eye squeezed shut, as if hit by a pea.
- **Numbers:** Range 10 m, width 0.4 m, 1.0x BA, 1.15 attacks/s.
- **Telegraph:** None.
- **Team use:** Poke damage that keeps him safe while his skills do the real work.

##### Hit 2: Button Shot (Aimed skillshot line)

- **Cast:** Same, quicker reload, with a hop. Base: Pistol_Shoot retimed 10% faster.
- **Projectile / strike object:** A different button.
- **Flight:** Same.
- **Impact:** Same.
- **Target reaction:** Same.
- **Numbers:** Same as hit 1.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Acorn Cap (Aimed skillshot line (lands as a small trap))

- **Cast:** He loads a fae acorn cap instead of a button, pulls the band all the way back with his tongue out, and fires. Base: Pistol_Aim_Neutral with a 0.2 s hold.
- **Projectile / strike object:** An acorn cap glowing faint fae green, with sparkles of pollen.
- **Flight:** Straight line, 18 m/s, 10 m. At the end of its range, or on hitting an enemy, it drops and sprouts. Sound: a soft pop, then a tinkle like tiny bells.
- **Impact:** A 2 m fairy ring of little red-capped toadstools springs up for 2 s (decal plus small instanced toadstool meshes).
- **Target reaction:** Enemies hit or stepping into the ring are Turned Around: they spin once in place (the victim plays a quick turn) and are slowed 30% for 1.5 s, with fae sparkles circling them.
- **Numbers:** Range 10 m, 1.2x BA, ring radius 2 m for 2 s, slow 30% for 1.5 s.
- **Telegraph:** Enemies see the toadstool ring with a red rim.
- **Team use:** A small zone that slows chasers.

#### Skills

##### Swap (Displacement (targeted))

- **Cast:** He points at the target, then at himself, squinting, and snaps his fingers. Base: UAL Spell_Simple_Shoot with a point-and-snap hand layer.
- **Projectile / strike object:** A twin flash of fae glamour: a swirl of green-gold sparkles and a crib-blanket shimmer around both units.
- **Flight:** Instant. Both units blink out (a 0.1 s shrink-and-sparkle) and swap positions, leaving a faint knitted-yarn line connecting the two spots for 0.5 s. Sound: a lullaby chime and a pop.
- **Impact:** A small toadstool ring appears at each spot for 1 s.
- **Target reaction:** Ally: lands with a little hop, sparkles on their shoulders and the speed buff. Enemy: lands dizzy, a halo of tiny stars around the head for 0.5 s.
- **Numbers:** Range 12 m, any ally or enemy. Recast within 2 s to swap back. Enemies are dizzied 0.5 s. Cooldown 12 s.
- **Telegraph:** Enemies see a green sparkle burst on themselves 0.15 s before they swap.
- **Team use:** Rescue an ally who is being dove, pull an enemy into your squad, or put yourself in the line of fire for a friend.

##### Fairy Ring (Trap / portal pair)

- **Cast:** He tips his thimble helmet off, shakes mushroom spores out of it onto the ground, then throws a second handful far ahead. Base: UAL PLANT_SEED (drop frames) into OVERHAND_THROW.
- **Projectile / strike object:** Two rings of red-capped toadstools: one where he stands, one up to 14 m away. The spores fly as a glowing green-gold puff.
- **Flight:** The far spores arc at 14 m/s and plant a ring where they land. A faint glowing yarn thread links the two rings. Sound: fairy bells.
- **Impact:** Two toadstool rings, 1.5 m radius, with a soft green light inside, lasting 6 s.
- **Target reaction:** Allies who step into a ring are whisked to the other ring with a sparkle (0.2 s). Enemies who step in are made to dance: a short jig on the spot (the victim plays a dance clip), rooted 0.8 s.
- **Numbers:** Ring distance up to 14 m, rings last 6 s, ally teleport 0.2 s with a 1 s per-ally cooldown, enemy root 0.8 s. Cooldown 18 s.
- **Telegraph:** Allies see green-gold rings with a soft white outline. Enemies see red-rimmed rings.
- **Team use:** A portal network: put one ring behind your squad and one at the objective. Retreat paths, flank paths, rescues.

#### Passive: Two Families

Allies swapped or teleported by Thimble get +20% move speed for 2 s (the Pellings cheering them on). Thimble takes 15% less damage while an ally is within 4 m.

*Visual tell:* The red patches knitted onto his sweater glow when an ally is near, and his thimble helmet glints.

#### Super: Changeling

> Thimble tugs his thimble helmet off and blows into it. A thin, sweet lullaby plays and pale moths swirl around one enemy. Camera nudges in. Then pop: Thimble is standing where the enemy was, and the enemy is standing in the middle of Thimble's team, half-size, wrapped in a mustard sweater with a thimble on their head, blinking. They have 2.5 seconds to regret it.

- **Style:** Displacement plus polymorph (targeted)
- **Cast:** He takes the thimble off his head, blows into it like a whistle, and a fae lullaby plays. He points at one enemy. The fae are calling their changeling home, and he swaps that enemy into his place.
- **Strike object:** A spiralling column of fae glamour (green-gold sparkles and pale moths) around the target, then the target themselves, transformed.
- **Flight:** A 0.6 s channel ring forms under the target. Then the target and Thimble swap positions in a flash. The enemy arrives in the middle of Thimble's team, shrunk to half size and wrapped in a knitted mustard sweater with a thimble on their head. Sound: a lullaby music box, a baby's giggle, and a pop.
- **Impact:** A toadstool ring at both swap points; a puff of moths.
- **Target reaction:** The enemy is Changelinged for 2.5 s: their model scales to 55% with a fae-green tint, a knitted sweater shader over their clothes and a thimble prop on their head bone. They can't attack or use skills and move 30% slower.
- **Numbers:** Range 9 m, channel 0.6 s, polymorph 2.5 s, enemy takes +20% damage while polymorphed. Thimble and the target trade places.
- **Telegraph:** The target sees a green-gold ring on the ground and lullaby notes for 0.6 s.
- **Team use:** A pick for the whole squad: the enemy carry arrives in your team as a helpless fae child for 2.5 s. Thimble lands in the enemy's spot, so pair it with Fairy Ring to get him back out.
- **Charge:** Lunches packed: every swap, teleport and ally rescue fills the super. On his body, the patches on his sweater fill in with new red knitting, one patch per 20%. HUD: a thimble icon filling with sparkles.
- **Counterplay:** The 0.6 s channel ring is a warning: dash out of it or break line of sight to cancel. A cleanse ends the polymorph. Thimble lands deep in the enemy's position and needs a ring or an ally to get out.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.6 s | UAL Interact | Lifts the thimble off his head and raises it to his lips; his other hand points at the target. | Lullaby notes and a moth swirl around the target; a green-gold ring forms under them. | Thimble helmet moves from the head bone to the right hand bone. | A music-box lullaby. |
| Action | 0.6-0.8 s | UAL Spell_Simple_Shoot | A blow into the thimble and a snap of the fingers. | Flash; both units swap; moths burst. | None. | A giggle and a pop. |
| Impact | 0.8-3.3 s | UAL Idle_Loop | Thimble lands crouched, then stands up grinning. | The polymorphed enemy wears the knit shader, shrinks, and gets a thimble prop. | Thimble prop spawned on the enemy's head bone. | Lullaby continues, slowed. |
| Recovery | 3.3-3.8 s | UAL Interact reversed | He puts his own thimble back on his head. | Toadstool rings fade. | Thimble helmet back on the head bone. | Soft chime. |

#### Body language

- **Locomotion:** A bouncy, slightly toddling walk with a big swing of the satchel. The run is a scampering sprint with elbows flapping. Base: UAL Walk_Loop retimed 10% faster with a bounce layer; Sprint_Loop.
- **Idle:** Checks his packed lunch in the satchel, adjusts the thimble on his head, waves at someone off-screen. Base: UAL Idle_Loop; WAVE.
- **Hit reaction:** He squeaks and pulls his thimble down over his eyes. Base: UAL Hit_Head.
- **Death:** He sits down hard, his thimble rolls away, and he dissolves into a ring of toadstools and drifting moths. Base: UAL Death01 truncated at the sit frame, then the dissolve.
- **Victory:** He pulls out a sandwich from his satchel and eats it happily, swinging his legs. Base: UAL Sitting_Idle_Loop.

#### Team combos

- **With Moss:** Moss boxes enemies with Maze Walls. Thimble swaps the enemy carry into the box, or swaps a trapped ally out.
- **With Madame Ysolt Crane:** Changeling drops the enemy carry into your team. Ysolt hooks and drains the helpless target, and the polymorph's +20% damage taken feeds her heal.
- **With Hespera:** Fairy Ring roots enemies in a dance. Hespera's charged Cinder Sling lands on the dancing target.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `thimble_idle` | UAL Idle_Loop + WAVE | custom pose layer | Lunch check; thimble adjust; wave. |
| `thimble_walk` | UAL Walk_Loop | retime | 10% faster with a bounce. |
| `thimble_run` | UAL Sprint_Loop | reuse as-is | - |
| `thimble_dodge` | UAL Roll | reuse as-is | - |
| `thimble_basic_1` | UAL Pistol_Aim_Neutral + Pistol_Shoot | custom pose layer | Slingshot prop; left hand draws the band. |
| `thimble_basic_2` | UAL Pistol_Shoot | retime | 10% faster with a hop. |
| `thimble_basic_3` | UAL Pistol_Aim_Neutral | custom pose layer | 0.2 s full draw hold. |
| `thimble_skill_swap` | UAL Spell_Simple_Shoot | custom pose layer | Point then snap. |
| `thimble_skill_fairy_ring` | UAL PLANT_SEED + OVERHAND_THROW | custom pose layer | Shake spores from the thimble, then throw. |
| `thimble_super_changeling` | UAL Interact / Spell_Simple_Shoot / Idle_Loop | custom pose layer | See beats. |
| `thimble_hit` | UAL Hit_Head | reuse as-is | - |
| `thimble_death` | UAL Death01 | retime | Truncated at the sit frame. |
| `thimble_victory` | UAL Sitting_Idle_Loop | custom pose layer | Sandwich eating. |
| `thimble_victim_dance` | UAL Dance_Loop | retime | Shared clip played on enemies caught in a Fairy Ring, 0.8 s. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `thimble_slingshot` | prop mesh | Forked hazel twig with a knitted sock band. |
| `thimble_button` | projectile mesh | Random button variants (wood, horn, red plastic); yarn strand ribbon. |
| `thimble_yarn_strand` | ribbon trail | Mustard yarn ribbon 1.5 m long that snaps off. |
| `thimble_acorn_cap` | projectile mesh | Glowing acorn cap with pollen sparkles. |
| `thimble_toadstool_ring` | instanced meshes + decal | Ring of 8-12 tiny red-capped toadstools with a green light decal. |
| `thimble_swap_flash` | flipbook | Green-gold sparkle swirl with a crib-blanket shimmer, 6 frames. |
| `thimble_ring_link` | ribbon | Faint glowing yarn thread linking paired rings. |
| `thimble_moths` | particles | Pale moth sprites, 4-frame flutter. |
| `thimble_knit_shader` | status overlay | Triplanar knitted-wool mustard texture over the polymorphed enemy, with fae green tint. |
| `thimble_victim_thimble` | attached prop | Thimble mesh spawned on the polymorphed enemy's head bone. |
| `thimble_patch_glow` | material mask | Emissive mask on the sweater patches. |

---

### The Unwritten, the Golem Without a Word

**Class:** Frontline: bruiser / Flex: the day's word (dive, tank, damage or sustain)  
**Basic style:** Transform / stance swap  
**Team job:** A clay bruiser that becomes whatever the squad needs today: brave, patient, angry or hungry. It can lend its word to an ally, and its super writes that word onto the whole team.  
**Palette:** terracotta `#B4533F`, dark clay `#7E3528`, chalk `#F2EFE6`, rope tan `#C9A46C`, burlap `#C8B48A`, crack shadow `#4A2219`, word gold `#FFD27A`, rain blue `#6F8FA6`

#### Basic attack chain

##### Hit 1: Chalk Jab (Transform / stance swap (melee in every word))

- **Cast:** A heavy clay jab. Before the match, the player picks two words from BRAVE, PATIENT, ANGRY and HUNGRY. Each word is a stance with its own pose layer: BRAVE leans forward, PATIENT stands square, ANGRY hunches, HUNGRY crouches. Base: UAL Punch_Jab with a per-word additive pose layer.
- **Projectile / strike object:** The clay fist itself, plus a chalk letter that flies off the knuckles on impact (one letter of the current word per hit, as a glowing chalk glyph sprite).
- **Flight:** A short 2.2 m punch. A puff of chalk dust trails the fist, and the chalk letter pops off and sticks to the target. Sound: a dull clay thud and a chalk-on-slate scratch.
- **Impact:** A chalk dust cloud and a crumb of clay. The letter is stamped onto the target.
- **Target reaction:** The victim's head rocks back, and a glowing chalk letter appears on their body. The letters spell the current word across successive hits (B-R-A-V-E, A-N-G-R-Y and so on).
- **Numbers:** Range 2.2 m, 1.0x BA, 1.0 hits/s. +1 letter.
- **Telegraph:** None.
- **Team use:** Each completed word on a target triggers a word effect (see passive), so the whole chain builds toward it.

##### Hit 2: Clay Hook (Transform / stance swap)

- **Cast:** A wide clay hook. BRAVE: a stepping hook. PATIENT: a short parry-hook that blocks the next hit for 0.4 s. ANGRY: a wild haymaker. HUNGRY: a grabbing hook that pulls the target in 0.5 m. Base: UAL Punch_Cross with the per-word layer.
- **Projectile / strike object:** The clay forearm with a smear of wet clay flicked off its arc (clay spatter particles), plus a second chalk letter.
- **Flight:** Arc of 100 degrees, 2.4 m reach. Clay spatter flies along the arc. Sound: a thick wet thwack.
- **Impact:** Clay smears onto the target; a chalk letter sticks.
- **Target reaction:** Turned by the hook, with a clay smear on the cheek and the next letter added.
- **Numbers:** Range 2.4 m, 1.1x BA. +1 letter. PATIENT: blocks the next hit for 0.4 s. HUNGRY: heals 15% of damage dealt.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Word Strike (Transform / stance swap (finisher changes per word))

- **Cast:** The finisher changes with the word. BRAVE: a 4 m shoulder charge (SWORD_DASH). PATIENT: a palm push that raises a clay slab wall (Spell_Simple_Shoot palm). ANGRY: a two-fisted ground slam (Sword_Attack overhead, empty hands). HUNGRY: a grab-and-squeeze (MELEE_HOOK).
- **Projectile / strike object:** BRAVE: a rush of chalk dust shaped like a shield ahead of it. PATIENT: a 2 m wide clay slab that rises from the ground. ANGRY: cracked clay shrapnel bursting from the fists. HUNGRY: clay tendrils pulling the target in.
- **Flight:** BRAVE: 4 m charge in 0.3 s. PATIENT: the slab pushes out 2 m. ANGRY: a 2.5 m radial burst. HUNGRY: a 2 m pull. Sound per word: battle cry, low hum, roar, stomach growl.
- **Impact:** BRAVE: a chalk skid line. PATIENT: the slab stays 2 s as cover. ANGRY: a shattered-clay crater decal. HUNGRY: a wet clay puddle.
- **Target reaction:** BRAVE: knocked back 2 m. PATIENT: pushed 2 m and slowed. ANGRY: knocked up 0.4 s. HUNGRY: dragged in and held 0.4 s. Each adds a chalk letter.
- **Numbers:** 1.5x BA. BRAVE: knock-back 2 m. PATIENT: slab wall 2 s, 2.0x BA HP. ANGRY: radius 2.5 m, knock-up 0.4 s. HUNGRY: heals 40% of damage dealt.
- **Telegraph:** A 0.2 s glow of the chalk word on its chest.
- **Team use:** Each word's finisher fills a different team need.

#### Skills

##### Rewrite (Transform / stance swap)

- **Cast:** It wipes the word off its chest with a flat palm, plucks the chalk stick from behind its ear, and scrawls the other word. Base: UAL Fixing_Kneeling (hand motion only) layered on Idle_Loop, with a wipe then a write.
- **Projectile / strike object:** The new word in chalk on its chest, glowing gold for a moment, and an arc of chalk dust.
- **Flight:** Chalk dust bursts outward in a 3 m ring. Sound: a squeak of chalk, a deep clay settle.
- **Impact:** A chalk scribble decal under its feet, 1 s.
- **Target reaction:** The Unwritten itself: its posture changes, and the word on its chest glows for 2 s.
- **Numbers:** Swap between the two chosen words. 1.0 s cast. The new word's passive is 30% stronger for 2 s. Cooldown 8 s.
- **Telegraph:** Everyone can read the word on its chest from the top-down camera (an oversized glowing chalk glyph on the chest).
- **Team use:** Read the fight: BRAVE to dive, PATIENT to hold a point, ANGRY to finish, HUNGRY to outlast.

##### Lend a Word (Ally-targeted buff)

- **Cast:** It walks its chalk to an ally and writes its current word on the ally's back. Base: UAL Interact with a reaching write motion. A quick-cast flings the chalk scrawl from 6 m (the letters fly as glyphs).
- **Projectile / strike object:** Chalk letters that fly from its hand to the ally, settling on their back as a glowing word.
- **Flight:** Glyphs fly at 18 m/s in a string, one after another. Sound: rapid chalk scratches.
- **Impact:** The ally's back shows the word for the duration.
- **Target reaction:** The ally sees the word glowing on their own back. BRAVE: +20% damage and crowd-control immune for 1.5 s. PATIENT: 25% damage reduction for 3 s. ANGRY: +25% attack speed for 3 s. HUNGRY: 20% lifesteal for 3 s.
- **Numbers:** Range 6 m, durations as listed, cooldown 14 s.
- **Telegraph:** Allies see the word in chalk-gold; enemies see it with a grey rim so they know what the target has.
- **Team use:** Gives a buff to whoever needs it: BRAVE on the diver, PATIENT on the carry.

#### Passive: Spelled Out

When all the letters of its current word are stamped on one enemy, the word triggers. BRAVE (5 letters): the Unwritten gains a 1.5x BA shield. PATIENT (7): the enemy is rooted 1 s in hardening clay. ANGRY (5): a clay burst deals 1.5x BA around the enemy. HUNGRY (6): the Unwritten heals 2.0x BA. In water (Wrenna's floods, the Sleeper's sea, Nyssa's river), the chalk runs: the word doesn't trigger, but its hits slow by 15% because it turns to mud.

*Visual tell:* The chalk word on its chest glows brighter with each letter landed on the current target; letters run and drip in water. The chalk stick behind its ear wears down over the match.

#### Super: The True Word

> The Unwritten looks down at its chest, at the word it wrote this morning, and snaps its chalk in two. It drops to its knees and drags both pieces across the arena floor in huge, careful letters. The strokes burn gold. When it finishes, the letters rise off the ground like they are being read aloud, and every ally standing on the word feels it written on their own back. The Unwritten's clay hardens and shines as if fired. Its maker gave it no word, so it has given one to everyone else.

- **Style:** Ground zone (word written on the arena)
- **Cast:** It snaps its chalk in half and, for the first time, writes a word that is not for itself. It drags both halves across the ground in huge letters, and the word becomes law for its squad.
- **Strike object:** A giant glowing word written across the ground in chalk-gold strokes, 10 m wide (its current word), and the Unwritten's body briefly fired hard and shining like glazed pottery.
- **Flight:** It scrawls the word in 1.2 s, the strokes appearing as an animated decal while it moves along them. The finished word lifts glowing letters (billboard glyphs) 1 m off the ground. Sound: an enormous chalk scratch, then a kiln roar.
- **Impact:** The word stays written on the ground for 6 s as a 10 m zone. Enemies can scuff letters by standing on them.
- **Target reaction:** Allies inside see the word on their own backs. BRAVE: crowd-control immune and +25% damage. PATIENT: 40% damage reduction. ANGRY: +35% attack speed, and a giant clay fist rises from the ground and slams the nearest enemy every 1.5 s. HUNGRY: 30% lifesteal. Enemies see the word red-rimmed.
- **Numbers:** Zone 10 m wide, lasts 6 s. Effects as listed (ANGRY fist 2.0x BA per slam). Each letter an enemy stands on for 1 s is erased and shortens the effect by 1 s. The Unwritten takes 30% less damage during the effect (fired clay).
- **Telegraph:** Enemies see the letters being written over 1.2 s with a red rim: get there and scuff them.
- **Team use:** A team-wide buff that matches the squad: write BRAVE to dive the backline, PATIENT to hold a choke, ANGRY to finish, HUNGRY to win a long brawl.
- **Charge:** Letters landed: +1 per chalk letter stamped, +5 for each completed word. On its body, the chalk stick behind its ear glows brighter, and the chest word fills with gold from the first letter to the last. HUD: a chalk tally that fills.
- **Counterplay:** Scuff the letters: every letter an enemy stands on for 1 s is erased and cuts 1 s off the effect. The 1.2 s writing is a long warning, and the Unwritten is slowed 50% while writing. Rain-themed water effects (enemy Wrenna or Sleeper floods) smear the letters twice as fast.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.4 s | UAL Interact | Looks down at its chest, takes the chalk from behind its ear, snaps it in two. | Chalk dust puff; chest word glows. | Chalk stick splits into two halves (two props on the hand bones). | A dry snap. |
| Action | 0.4-1.6 s | UAL Crouch_Fwd_Loop with the arms in a writing layer | Crouched, it moves along the letter strokes dragging both hands on the ground. | Animated chalk-gold stroke decal follows its hands. | Chalk halves on both hand bones. | Huge chalk scratch, rhythmic. |
| Impact | 1.6-2.0 s | UAL Spell_Simple_Shoot (both arms up) | Rises and lifts both arms; the letters rise. | Letters lift as glyph billboards; the body gets a glazed shader. | None. | Kiln roar; a choir hum. |
| Recovery | 2.0-2.5 s | UAL Idle_Loop | Looks at its glazed hands with wonder. | Glaze fades to normal clay over 6 s. | Chalk stick back behind its ear. | Soft ceramic ring. |

#### Body language

- **Locomotion:** A heavy, deliberate walk; the stance layer changes it per word (BRAVE strides forward, PATIENT steps evenly, ANGRY stomps, HUNGRY prowls). Base: UAL Walk_Loop and Jog_Fwd_Loop with per-word additive layers.
- **Idle:** Looks at the word on its chest, traces a letter, and sometimes looks up at the sky for rain. Base: UAL Idle_Loop with additive hand and head layers.
- **Hit reaction:** Clay crumbs fall off and a crack opens and glows gold briefly. Base: UAL Hit_Chest.
- **Death:** It slumps to sitting and the word on its chest runs as if rained on, until it's blank. Then it freezes still, an empty statue. Base: UAL Death01 ending in a seated hold, with the word-wash shader.
- **Victory:** It writes a new word on its chest, looks at it proudly, then shows it to the camera: the word is TODAY. Base: UAL Interact into Idle_Loop.

#### Team combos

- **With Pyrrhos:** Lend a Word (PATIENT) on Pyrrhos while he pulls the nail. 25% damage reduction offsets his HP drain and keeps him on the field.
- **With Fenwick Marl:** Lend a Word (BRAVE) on Fenwick before his super. Crowd-control immunity during the chain leaps.
- **With The Sleeper:** The Sleeper floods the arena. The Unwritten's word stops triggering, but its mud hits slow enemies that are already slowed by the flood. Pick ANGRY or BRAVE for raw stats in water.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `unwritten_idle` | UAL Idle_Loop | custom pose layer | Trace a letter; look for rain. |
| `unwritten_walk` | UAL Walk_Loop | custom pose layer | Per-word additive layer (4 variants). |
| `unwritten_run` | UAL Jog_Fwd_Loop | custom pose layer | Per-word additive layer. |
| `unwritten_dodge` | UAL Roll | retime | Slower; clay dust. |
| `unwritten_basic_1` | UAL Punch_Jab | custom pose layer | Per-word stance layer. |
| `unwritten_basic_2` | UAL Punch_Cross | custom pose layer | Per-word stance layer. |
| `unwritten_basic_3_brave` | UAL SWORD_DASH | custom pose layer | Shoulder-first, empty hands. |
| `unwritten_basic_3_patient` | UAL Spell_Simple_Shoot | custom pose layer | Open-palm push. |
| `unwritten_basic_3_angry` | UAL Sword_Attack | custom pose layer | Clasped-fist overhead slam. |
| `unwritten_basic_3_hungry` | UAL MELEE_HOOK | retime | Grab-and-squeeze timing. |
| `unwritten_skill_rewrite` | UAL Fixing_Kneeling (arms) on Idle_Loop | custom pose layer | Wipe, then write on the chest. |
| `unwritten_skill_lend_a_word` | UAL Interact | custom pose layer | Reach and write on an ally's back. |
| `unwritten_super_true_word` | UAL Interact / Crouch_Fwd_Loop / Spell_Simple_Shoot | custom pose layer | See beats. |
| `unwritten_hit` | UAL Hit_Chest | reuse as-is | - |
| `unwritten_death` | UAL Death01 | custom pose layer | Ends seated and still. |
| `unwritten_victory` | UAL Interact | reuse as-is | - |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `unwritten_chalk_letter` | billboard glyph | Hand-drawn chalk letters (A-Z atlas) that stick to targets; white with a gold glow. |
| `unwritten_chalk_dust` | particles | Soft white chalk puffs. |
| `unwritten_clay_spatter` | particles | Wet terracotta blobs. |
| `unwritten_clay_slab` | spawned mesh | 2 m wide rough clay wall with finger marks. |
| `unwritten_clay_crater` | decal | Shattered clay pieces and dust. |
| `unwritten_chest_word` | material + glyph decal | Oversized chalk word on the chest, readable from the top-down camera. |
| `unwritten_ally_word` | status overlay | Glowing chalk word decal on an ally's back. |
| `unwritten_true_word` | decal + billboard glyphs | 10 m chalk-gold word written stroke by stroke, letters lifting. Fallback: decal only. |
| `unwritten_clay_fist` | spawned mesh | ANGRY variant: a 2 m clay fist rising from the ground and slamming. |
| `unwritten_glaze` | material swap | Glossy fired-clay shader with gold crack fill. |
| `unwritten_word_wash` | material mask | Running-chalk drip effect in water and on death. |

---

## Legendary

### Lysandra Kole, the Stonemason's Widow

**Class:** Frontline: peeler / Control: stuns (petrify)  
**Basic style:** Charge-and-release  
**Team job:** A bodyguard with stone hands: she blocks shots aimed at the carry, chisels allies free of crowd control, and turns a diving team into a garden of statues.  
**Palette:** marble `#D9D6CF`, stone grey `#9C9A93`, crack shadow `#5E5B57`, vest leather `#7A4A2A`, goggle copper `#B0703B`, lens blue `#8FB3C9`, marble dust `#CFC8BA`, skin `#C9906E`

#### Basic attack chain

##### Hit 1: Mason's Jab (Charge-and-release (tap))

- **Cast:** A short, efficient jab with a heavy stone fist, as if knocking a flaw off a block. Base: UAL Punch_Jab with a heavier follow-through.
- **Projectile / strike object:** Her marble fist, with a spray of white stone chips and a puff of marble dust from the knuckles.
- **Flight:** A 2.2 m punch. Chips spray forward in a narrow cone and dust hangs for 0.4 s. Sound: a sharp stone crack, like a chisel tap.
- **Impact:** Chips scatter and a dust puff hangs in the air.
- **Target reaction:** The target's head is knocked back, with grey dust left on its clothes.
- **Numbers:** Range 2.2 m, 0.9x BA, 1.1 hits/s.
- **Telegraph:** None.
- **Team use:** Quick poke to stay on a diver.

##### Hit 2: Mason's Cross (Charge-and-release (tap))

- **Cast:** A right cross with a full step in. Base: UAL Punch_Cross.
- **Projectile / strike object:** Stone fist with a heavier chip spray.
- **Flight:** Same, 2.4 m.
- **Impact:** Chips and dust.
- **Target reaction:** A stagger back.
- **Numbers:** Range 2.4 m, 1.0x BA.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Chisel Split (Charge-and-release (hold 0.3-1.2 s))

- **Cast:** Hold: she draws the hammer and chisel from her hip holster (props to both hand bones), kneels slightly, sets the chisel against the ground and raises the hammer, her goggles lowering over her eyes. Release: one perfect hammer strike. Base: UAL Fixing_Kneeling hold, then a hammer strike from Sword_Attack on the right arm.
- **Projectile / strike object:** A straight crack that splits the ground along the aimed line, with flakes of stone peeling up from its edges.
- **Flight:** Instant line, 4-7 m depending on charge. The crack races out at 30 m/s with stone flakes flipping up along it. Sound: a ringing chisel strike, then the splitting crack of quarried stone.
- **Impact:** A deep straight crack decal with flake debris, 3 s.
- **Target reaction:** Enemies on the line are Flaked: stone flakes peel from their bodies (falling flake particles) and their armour is shredded 15% for 4 s. At full charge they are also stunned 0.8 s, stone creeping briefly over their feet.
- **Numbers:** Line 4-7 m by 1 m. Damage 1.4x BA (tap-release) to 2.4x BA (full 1.2 s). Armour shred 15% for 4 s. Full charge: stun 0.8 s.
- **Telegraph:** Enemies see a red line growing as she charges.
- **Team use:** Armour shred makes the whole squad's damage hit harder; the stun sets up Wrenna's flood or Hob's Founder's Hammer.

#### Skills

##### Stone Hands (Wall / terrain (personal block))

- **Cast:** She turns her hands fully to stone (marble creeps over them in 0.1 s) and slams them together in front of her as a wall. Base: UAL IDLE_SHIELD with both forearms raised, palms out.
- **Projectile / strike object:** A broad marble barrier made of her two giant hands, plus a ghostly stone wall extending 1 m to each side (a translucent marble quad).
- **Flight:** Instant. The barrier holds in front of her. Blocked projectiles hit it and crumble to dust. Sound: a grinding slam, and a crunch for each blocked hit.
- **Impact:** Blocked projectiles leave dust puffs and small rubble at her feet.
- **Target reaction:** Enemies that melee the barrier have their weapon arm jarred back (a recoil reaction) and are slowed 20% for 1 s. Allies behind her see a pale marble outline on the barrier.
- **Numbers:** Frontal 120 degrees, 3 m wide, blocks all damage for up to 2 s (+0.2 s per Flake stack). Cooldown 8 s.
- **Telegraph:** Enemies see a solid marble wall with a red rim on its front.
- **Team use:** Stand in front of your carry and catch Oko's lance, Nyssa's coins or Kallix's embers.

##### Chisel Free (Dash / leap strike (ally-targeted))

- **Cast:** She leaps to an ally, lands beside them and taps them sharply with her chisel. Base: UAL NINJUMP_JUMP into a chisel tap (Punch_Jab with the chisel prop).
- **Projectile / strike object:** A ring of stone flakes and marble dust bursting off the ally, as if a statue were being chiselled free.
- **Flight:** Leap 8 m in 0.35 s, then the tap. Flakes burst outward. Sound: a single precise chisel ping.
- **Impact:** A small ring of fallen stone flakes at the ally's feet.
- **Target reaction:** The ally sees their crowd control crack off their body like a stone shell breaking and falling, then a thin marble skin over them (shield). Enemies within 2 m are knocked back 1.5 m.
- **Numbers:** Leap range 8 m, cleanses stun, root and slow on the ally, gives a 1.5x BA shield for 3 s, knock-back 1.5 m around them. Cooldown 14 s.
- **Telegraph:** Allies see a white chisel icon over themselves when she's in range.
- **Team use:** The squad's anti-stun: free the carry from a root or stun and bodyguard them in one move.

#### Passive: Flake by Flake

Each Stone Hands use adds a Flake stack (max 5, lasting 20 s): +5% damage reduction per stack, but -3% move speed per stack. At 5 stacks she becomes Half-Statue: +10% more damage reduction and Chisel Split charges 30% faster.

*Visual tell:* Stone visibly climbs her body: marble creeps from her hands to her elbows, shoulders, collarbones and finally her jaw with each stack (a height mask on the marble shader). Her goggles fog with dust at 5 stacks.

#### Super: The Gorgon's Garden

> Lysandra's stone hands crack the ground as she drops to her knees. Camera tightens on her goggles as marble creeps up over her face, the stone she has fought to chisel off everyone else. Then she slams both fists down and the stone pours out of her across the floor, and every enemy in reach freezes mid-step, marble climbing to their necks and then over their faces, carved blank. For a moment the arena looks like the garden outside the gorgon's cave. Her allies get to work with hammers.

- **Style:** Aura (radial petrify)
- **Cast:** She drives both stone fists into the ground. Stone floods out of her into the earth, and everyone near her starts to become a statue, the same thing she spent thirty years carving faces onto.
- **Strike object:** A wave of marble spreading across the ground, then stone creeping up every enemy in it until they stand frozen as statues with blank carved faces.
- **Flight:** The marble wave radiates from her to 7 m in 0.4 s (an animated decal mask with crack lines). Then stone climbs each enemy from their feet upward over 0.6 s. Sound: grinding stone, then a deep echoing silence, then a single chisel tap.
- **Impact:** A marble floor decal with fine cracks, lasting 4 s.
- **Target reaction:** Petrified: a marble shader climbs the enemy from feet to head, their pose freezes mid-motion (animation paused), and their face goes blank and carved. They are stunned for 1.8 s. Hits on them chip off stone flakes.
- **Numbers:** Radius 7 m, 2.0x BA, petrify 1.8 s. Allies' hits on petrified enemies deal +40% (Shatter). If Ophira is on the team, her gaze shatters petrified enemies below 25% HP. Lysandra herself turns to stone for 1.0 s after the cast (invulnerable but unable to act).
- **Telegraph:** Lysandra's own body goes fully marble first over 1 s, from hands to head, an unmistakable warning; enemies see a red-rimmed 7 m circle.
- **Team use:** Locks down a group dive for a full squad burst. The +40% Shatter rewards everyone focusing the statues.
- **Charge:** Flakes chiselled: damage blocked by Stone Hands and armour shredded by Chisel Split fill the super. On her body, her goggles slowly fill with swirling marble dust and her hands glow with fine white cracks. HUD: a chisel icon that fills with stone.
- **Counterplay:** 1 s warning while she turns to stone first: leave the 7 m circle. A cleanse removes petrify. Lysandra is stuck as stone for 1 s after the cast, so she can't follow up and the super can't be chained with her own Chisel Free.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-1.0 s | UAL Fixing_Kneeling | Drops to one knee, both fists raised overhead, goggles lowering. | Marble climbs her body from the hands up to her head. | Goggles prop rotates down over her eyes. | Grinding stone, building. |
| Action | 1.0-1.2 s | UAL Sword_Attack (overhead slam, both empty fists) | Both fists slam into the ground. | Marble wave radiates 7 m. | None. | A crack like a quarry blast. |
| Impact | 1.2-2.0 s | Hold the slam pose | Frozen in stone (animation paused). | Stone climbs each enemy; blank-face decal; frozen poses. | None. | Silence, then one chisel tap. |
| Recovery | 2.0-2.6 s | UAL Idle_Loop from the kneel | Marble cracks off her in flakes as she stands. | Flake burst off her body. | None. | Pebbles trickling. |

#### Body language

- **Locomotion:** A solid working walk with heavy stone hands swinging low. The run is purposeful, with the hands pumping like weights. Base: UAL Walk_Loop with lowered arms; Jog_Fwd_Loop.
- **Idle:** Taps her hammer against a palm, lifts her goggles and squints at something far off, blows dust off her knuckles. Base: UAL Idle_Loop with hand layers.
- **Hit reaction:** A grinding crunch, stone dust puffs off her, she braces. Base: UAL Hit_Chest.
- **Death:** She kneels and covers her face with her stone hands. The stone climbs over the rest of her and she becomes a statue, kneeling. Then the statue cracks and crumbles into a pile of marble flakes. Base: UAL Death01 frozen at the kneel, then the shader.
- **Victory:** She chisels a tiny face onto a block of stone, then blows the dust off and looks at it fondly. Base: UAL Fixing_Kneeling.

#### Team combos

- **With Ophira:** The Gorgon's Garden petrifies a group. Ophira's gaze shatters petrified enemies below 25% HP. The two sisters together are a statue execution.
- **With Oko:** Chisel Split armour-shreds a line of enemies. Oko's Fresnel Lance pierces the same line and hits 15% harder.
- **With Hob Tallagh:** A full-charge Chisel Split stuns 0.8 s. Hob closes and slams three tolls into the stunned target.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `lysandra_idle` | UAL Idle_Loop | custom pose layer | Hammer tap; goggles lift; dust blow. |
| `lysandra_walk` | UAL Walk_Loop | custom pose layer | Lowered heavy arms. |
| `lysandra_run` | UAL Jog_Fwd_Loop | reuse as-is | - |
| `lysandra_dodge` | UAL Roll | retime | Heavier landing. |
| `lysandra_basic_1` | UAL Punch_Jab | retime | Heavier follow-through. |
| `lysandra_basic_2` | UAL Punch_Cross | reuse as-is | - |
| `lysandra_basic_3_charge` | UAL Fixing_Kneeling | custom pose layer | Looping hold with hammer and chisel set. |
| `lysandra_basic_3_release` | UAL Sword_Attack | custom pose layer | Right-arm hammer strike only. |
| `lysandra_skill_stone_hands` | UAL IDLE_SHIELD | custom pose layer | Both forearms raised, palms out. |
| `lysandra_skill_chisel_free` | UAL NINJUMP_JUMP + Punch_Jab | custom pose layer | Leap, then chisel tap. |
| `lysandra_super_gorgons_garden` | UAL Fixing_Kneeling / Sword_Attack | custom pose layer | See beats. |
| `lysandra_hit` | UAL Hit_Chest | reuse as-is | - |
| `lysandra_death` | UAL Death01 | custom pose layer | Frozen at the kneel; hands over face. |
| `lysandra_victory` | UAL Fixing_Kneeling | reuse as-is | Chisel props. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `lysandra_stone_chips` | particles | White marble chips and grey dust cones. |
| `lysandra_hammer_chisel` | prop meshes | Iron hammer and chisel, drawn from the hip holster. |
| `lysandra_split_crack` | decal + particles | Straight deep crack decal with flipping stone flakes along it. |
| `lysandra_flaked` | status overlay | Falling flake particles from the victim and grey dust tint. |
| `lysandra_hand_wall` | spawned quad | Translucent marble wall extending from her hands with a red front rim to enemies. |
| `lysandra_marble_creep` | material mask | Height-masked marble shader that climbs her body with Flake stacks. |
| `lysandra_cleanse_shell` | flipbook | A stone shell cracking and falling off an ally. |
| `lysandra_marble_wave` | decal | Animated marble floor with crack lines spreading 7 m. |
| `lysandra_petrify` | status overlay | Height-masked marble shader on victims, a blank-face decal on the head, and animation paused. Fallback: a grey tint and freeze. |
| `lysandra_goggle_dust` | material | Swirling dust in the goggle lenses as the super charges. |

---

### Kallix, the Second Thief

**Class:** Specialist: saboteur / Damage: mage  
**Basic style:** Chain lightning-style jump  
**Team job:** Steals the enemy's best ability for his team and sets fire to anything the squad has tied, sealed or grouped together.  
**Palette:** ember orange `#FF7A1A`, coal red `#C2301E`, grate iron `#2B2B2B`, vest leather `#6B3A22`, skin `#C68B5E`, hair black `#151515`, spark gold `#FFD36A`, ash grey `#8A8580`

#### Basic attack chain

##### Hit 1: Pilfered Spark (Chain lightning-style jump)

- **Cast:** He snaps the fingers of his right hand over the flaming bracer and flicks a spark off his thumb with a cocky grin. Base: UAL Spell_Simple_Shoot retimed 20% faster, with a finger-snap hand layer.
- **Projectile / strike object:** A single stolen ember: a sharp teardrop flame with a white-hot core and a black soot halo, flickering like it's trying to escape.
- **Flight:** Straight to the first target at 26 m/s, then it leaps to the next enemy within 4 m in a quick hopping arc (0.08 s per hop), up to 3 jumps. Each hop leaves a short ember-arc ribbon and falling ash. Sound: a match-strike scritch, then a tick per hop.
- **Impact:** A small ember burst with a soot puff at each target.
- **Target reaction:** Each victim jerks as if stung, and a small singe mark glows on them (an ember decal on the body) for 1 s.
- **Numbers:** Range 9 m, hop range 4 m, up to 3 hops. 0.8x BA to the first target, then -20% per hop. 1.15 attacks/s.
- **Telegraph:** None.
- **Team use:** Spreads damage across clusters that Aurvan or Moss have grouped up.

##### Hit 2: Pilfered Spark (Chain lightning-style jump)

- **Cast:** Mirror with the left hand. Base: Spell_Simple_Shoot mirrored.
- **Projectile / strike object:** Same ember.
- **Flight:** Same.
- **Impact:** Same.
- **Target reaction:** Same.
- **Numbers:** Same as hit 1.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Grate Breath (Chain lightning-style jump)

- **Cast:** He hooks a thumb into the iron grate over his chest and cracks it open (the grate door is a separate prop on the upper spine bone, swung open in code). A coal-spark leaps out. Base: UAL Spell_Simple_Enter with a chest-open hand layer.
- **Projectile / strike object:** A burning coal chip from the original stolen fire, orange-white and roaring.
- **Flight:** It leaps to 5 targets, 0.1 s per hop, trailing a thick ember ribbon. Sound: a furnace whoomph and a crackle per hop.
- **Impact:** A fire burst at each target with an ash ring decal, 1 s.
- **Target reaction:** Each victim catches fire: a Burning overlay (flame flipbook on the shoulders and back) for 2 s.
- **Numbers:** Range 9 m, up to 5 hops of 4 m, 1.2x BA to the first target (-15% per hop), Burning 0.3x BA/s for 2 s. Soaked enemies can't be ignited.
- **Telegraph:** His chest grate flares bright for 0.2 s.
- **Team use:** Ignites a group for his passive and for Bellows.

#### Skills

##### Second Theft (Pull / hook (grabs an ability))

- **Cast:** He thrusts out his right hand and a ghostly hand of fire lunges from it, snatching at the target. He yanks it back to his chest and the grate flares. Base: UAL MELEE_HOOK.
- **Projectile / strike object:** A burning spectral hand, made of ember ribbons in a hand shape (a flipbook of a grasping hand), that grabs a glowing icon of the enemy's last-used ability.
- **Flight:** Straight line, 30 m/s, 8 m. The hand returns along the same line carrying the ability glyph. Sound: a whoosh, a snatch, then a cackle.
- **Impact:** A flare at the target's chest as the ability is ripped out.
- **Target reaction:** The victim stumbles toward Kallix as if something was pulled out of their chest. A small flame-shaped hole flickers on their chest for 2 s, and their stolen ability shows a burning padlock on their skill bar (their own HUD).
- **Numbers:** Range 8 m, width 0.8 m. Steals the target's last-used ability for 8 s (Kallix can cast it once, recoloured in ember and ash). The victim's ability cooldown is extended by 2 s. Cooldown 20 s.
- **Telegraph:** Enemies see a red line flash 0.2 s before the grab.
- **Team use:** Steal a heal, a wall or a crowd-control tool to save an ally. Stealing Ione's Sing Them Home lets him pull his own ally to safety.

##### Bellows (Cone spray)

- **Cast:** He squeezes the leather bellows bulb on his belt (a prop; it compresses with a scale animation) with one hand and holds the other palm out to aim the gust. Base: UAL Spell_Simple_Shoot with a hip-squeeze layer.
- **Projectile / strike object:** A gust of wind that fans every ember it touches into roaring flame: an orange cone of fire with ash curls.
- **Flight:** A 50-degree cone, 6 m, flames rolling out at 12 m/s. Burning enemies in the cone flare up. Fire jumps along any tether, thread, wax or rope effect it touches. Sound: a bellows huff, then a roar.
- **Impact:** A scorched cone decal for 2 s.
- **Target reaction:** Enemies hit are set Burning (flame flipbook on the body) and pushed back 1 m. If they were already burning, they flare white-hot for a burst.
- **Numbers:** Cone 6 m by 50 degrees, 1.2x BA, Burning 0.3x BA/s for 3 s; burning targets take an extra 1.0x BA burst. Fire travels along allied tethers and threads (Sena's Knot, Moss's Thread, Ysolt's chains) to every enemy connected, and ignites Mott's wax seals on enemies. Cooldown 9 s.
- **Telegraph:** Enemies see a red cone flash 0.2 s before.
- **Team use:** Sena ties enemies together; Kallix lights the thread and the fire runs to all of them.

#### Passive: The Spark Is Going Out

His chest coal slowly dims over time (from bright to dim in 30 s without feeding). Every enemy he sets burning feeds it. When bright, he deals +20% damage; when dim, -20%. Takedowns refill it fully.

*Visual tell:* The glow behind his chest grate brightens and dims, and the flames on his bracers grow and shrink. When it's nearly out, he coughs a puff of ash.

#### Super: Who Gets Fire Next

> Kallix tears his chest grate open with both hands and the arena light fades. Camera pushes in on the open grate. Inside, a white-gold point of fire floats free, the spark he stole back from mortals. Around him, tiny flames lift out of every enemy's chest and stream into it, and the enemies go grey. Then he grins, throws his arms wide, and the spark bursts: a flame flies to each of his allies and settles over their heart. He decides who gets fire next.

- **Style:** Aura (steal and give)
- **Cast:** He grips the grate on his chest with both hands and tears it fully open. The original spark, the first fire ever stolen, floats out in front of him, and he decides who gets fire.
- **Strike object:** The original spark (a small white-gold star with a corona of red flame) above his hands, then dozens of small flames: some ripped out of enemies, some thrown to allies.
- **Flight:** For 1.5 s, a small flame is pulled out of the chest of every enemy within 12 m and streams into the spark (homing ember ribbons). Then the spark bursts and throws a flame to every ally within 12 m (homing at 20 m/s). Sound: a deep inhale like a furnace drawing air, then a roar.
- **Impact:** The arena light dims except around Kallix (a screen-tint pass). Ash drifts down for 4 s.
- **Target reaction:** Enemies hunch as their flame is pulled out of their chest, and for 6 s they are Unlit: no flame-heart, colours desaturated, and their super charge is drained by 25%. Allies receive Fire-Given: a small flame burns over their heart, their attacks leave embers and ignite.
- **Numbers:** Radius 12 m. Enemies: 1.5x BA, -25% super charge, -15% damage for 6 s. Allies: +20% damage and attacks ignite (0.3x BA/s for 2 s) for 6 s. Kallix's passive coal is refilled to full.
- **Telegraph:** Enemies see their own chest flame pulling toward Kallix during the 1.5 s channel, a clear sign to stun him.
- **Team use:** A team-wide damage buff and an enemy-wide debuff in one move, and it takes away a quarter of each enemy's super.
- **Charge:** Fire stolen: every ignite and stolen ability fills it. On his body, the flames on his bracers climb up his forearms toward the elbows, and the grate glows white at full charge. HUD: a flame icon behind a grate.
- **Counterplay:** The 1.5 s channel exposes the spark: Kallix takes double damage while channelling, and any stun or silence cancels it and refunds half the charge. Soaked enemies (Wrenna, Sleeper floods) are immune to the theft half.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.4 s | UAL Interact | Both hands grip the grate and pull it open. | Grate door swings fully open; a white-gold glow. | Grate prop door rotated open in code. | Iron screech. |
| Action | 0.4-1.9 s | UAL Spell_Simple_Idle_Loop | Arms spread, chest thrust out, head back. | Enemy flames stream into the spark (homing ribbons). The world light dims. | Original spark sprite floats at chest height. | A furnace inhale. |
| Impact | 1.9-2.3 s | UAL Spell_Simple_Shoot (both arms) | Arms fling outward. | Spark bursts; flames home onto allies' chests. | None. | A roar of fire. |
| Recovery | 2.3-2.8 s | UAL Idle_Loop | Slams the grate shut with one hand and grins. | Ash drift; his coal is bright. | Grate closes. | Clang, then crackle. |

#### Body language

- **Locomotion:** A loose, swaggering thief's walk with the shoulders rolling. The run is fast and low with the bracers trailing flames. Base: UAL Walk_Loop with a swagger layer; Sprint_Loop.
- **Idle:** Juggles a spark between his fingers, checks the coal through the grate with a worried frown, then grins again. Base: UAL Idle_Loop with hand layers.
- **Hit reaction:** His chest grate rattles, sparks spill, he hisses through his teeth. Base: UAL Hit_Chest.
- **Death:** He falls to his knees clutching his chest. The coal behind the grate dims from orange to grey, and a final wisp of smoke curls out. Base: UAL Death01.
- **Victory:** He holds a single flame in his palm and closes his fist on it, then opens his hand and the flame is still there. Base: UAL Interact into Idle_Loop.

#### Team combos

- **With Sena:** Sena's Knot ties enemies together. Bellows ignites the thread and the fire travels to every tied enemy.
- **With Aurvan:** Tidal Pull groups enemies. Pilfered Spark hops through the whole cluster, and Grate Breath ignites them all.
- **With Brother Mott:** Mott's Sealed enemies wear wax. Bellows sets the wax seals alight for a bonus flare.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `kallix_idle` | UAL Idle_Loop | custom pose layer | Spark juggle; worried coal check. |
| `kallix_walk` | UAL Walk_Loop | custom pose layer | Swagger. |
| `kallix_run` | UAL Sprint_Loop | reuse as-is | - |
| `kallix_dodge` | UAL Roll | reuse as-is | Ember trail. |
| `kallix_basic_1` | UAL Spell_Simple_Shoot | retime | 20% faster, finger snap. |
| `kallix_basic_2` | UAL Spell_Simple_Shoot | retime | Mirrored. |
| `kallix_basic_3` | UAL Spell_Simple_Enter | custom pose layer | Thumb hooks the grate open. |
| `kallix_skill_second_theft` | UAL MELEE_HOOK | reuse as-is | - |
| `kallix_skill_bellows` | UAL Spell_Simple_Shoot | custom pose layer | Hip squeeze layer. |
| `kallix_super_who_gets_fire` | UAL Interact / Spell_Simple_Idle_Loop / Spell_Simple_Shoot | custom pose layer | See beats. |
| `kallix_hit` | UAL Hit_Chest | reuse as-is | - |
| `kallix_death` | UAL Death01 | reuse as-is | Coal dim. |
| `kallix_victory` | UAL Interact | reuse as-is | - |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `kallix_ember` | projectile sprite | Sharp teardrop flame with a white core and soot halo; flickers. |
| `kallix_hop_arc` | ribbon trail | Short ember-arc ribbon per hop with falling ash. |
| `kallix_burning` | status overlay | Flame flipbook on the victim's shoulders and back. |
| `kallix_coal_chip` | projectile sprite | Orange-white coal chip with a thick ember ribbon. |
| `kallix_fire_hand` | flipbook ribbon | Grasping hand shape made of ember ribbons. |
| `kallix_stolen_glyph` | UI world icon | Stolen ability icon recoloured ember and ash, carried back by the hand. |
| `kallix_chest_hole` | status overlay | Flickering flame-shaped hole on the victim's chest. |
| `kallix_bellows_cone` | particles + decal | Rolling orange fire cone with ash curls; scorched decal. |
| `kallix_thread_fire` | ribbon shader | Fire running along any tether or thread ribbon (a scrolling flame texture swap). |
| `kallix_grate_glow` | material | Emissive coal behind the grate, brightness driven by the passive. |
| `kallix_original_spark` | sprite + light | White-gold star with a red corona. |
| `kallix_unlit` | status overlay | Desaturation on enemies for 6 s. |

---

### Oko, the Lighthouse Cyclops

**Class:** Damage: marksman / Control: blind and reveal  
**Basic style:** Hitscan beam / channel  
**Team job:** The squad's lighthouse: long-range beam damage, a sweep that reveals and blinds, and a passive that shows allies enemy skillshots before they're thrown.  
**Palette:** oilskin yellow `#E8C430`, mustard `#C7A21E`, lens brass `#B8923A`, lens white `#F4F7F8`, eye blue `#2D7FC1`, beard grey `#8E8A86`, skin `#E4A07A`, beam warm `#FFF3C4`, boot rubber `#3A3A38`

#### Basic attack chain

##### Hit 1: Lens Flash (Hitscan beam)

- **Cast:** He squares his shoulders, plants his rubber boots, and narrows his single great eye behind its brass lens ring. The lens ring clicks a quarter turn (a prop ring on the head bone, rotated in code). Base: UAL Pistol_Aim_Neutral with the arms down and a head-forward layer.
- **Projectile / strike object:** A narrow warm-white beam of lighthouse light from his eye lens.
- **Flight:** Hitscan, 12 m, held for 0.08 s, with dust motes lit up along it and a lens-flare star at the hit point. Sound: a click of brass and a short hum.
- **Impact:** A bright starburst on the target and a small heat shimmer.
- **Target reaction:** The victim squints and raises an arm against the glare (a flinch with a forearm-up layer).
- **Numbers:** Range 12 m, 1.0x BA, 0.95 attacks/s.
- **Telegraph:** Enemies see a thin yellow aim line from his eye while he's attacking them.
- **Team use:** Reliable long-range damage that never misses within range.

##### Hit 2: Lens Flash (Hitscan beam)

- **Cast:** Same, the ring clicking the other way.
- **Projectile / strike object:** Same beam.
- **Flight:** Same.
- **Impact:** Same.
- **Target reaction:** Same.
- **Numbers:** Same as hit 1, 1.05x BA.
- **Telegraph:** Same.
- **Team use:** Same as hit 1.

##### Hit 3: Fresnel Lance (Hitscan beam (piercing))

- **Cast:** He cups both huge hands around the sides of his lens like a man shading his eye against the sun, focusing the light. The lens ring spins up. Base: UAL Spell_Simple_Enter with hands framing the head, held 0.3 s.
- **Projectile / strike object:** A thick ringed beam: a concentric Fresnel-lens pattern visible inside the light (a scrolling ring texture) like the light from a real lighthouse lens.
- **Flight:** Hitscan, 14 m, pierces all enemies on the line, held 0.15 s. Rings scroll along it. Sound: a rising whine, then a deep thrum.
- **Impact:** Each target bursts with light; a scorched line decal, 1 s.
- **Target reaction:** Victims recoil and are Dazzled for 1 s: a white glare overlay on the face and a 10% slow.
- **Numbers:** Range 14 m, width 0.6 m, pierces, 1.6x BA, Dazzle 1 s.
- **Telegraph:** A 0.3 s yellow aim line that thickens before firing.
- **Team use:** Lines up through the enemies Lysandra just shredded or Aurvan just pulled together.

#### Skills

##### Sweeping Beam (Hitscan beam / channel (rotating))

- **Cast:** Oko turns his whole upper body slowly from one side to the other like the light in a lighthouse tower, his eye blazing. Base: UAL Idle_Loop with a slow 180-degree spine and neck rotation layer over 1.5 s.
- **Projectile / strike object:** A wide fan of lighthouse light, 10 m long, swinging across 180 degrees.
- **Flight:** The beam rotates 180 degrees over 1.5 s. Its leading edge is bright and its trailing edge fades. Dust motes and sea-spray particles drift in the light. Sound: a low foghorn and the turning creak of a lighthouse mechanism.
- **Impact:** Swept ground is briefly lit pale yellow and fades over 1 s.
- **Target reaction:** Enemies swept are Revealed (a yellow outline visible to his whole team through walls, 4 s) and Blinded for 2 s: their basic attacks miss 50% of the time, and their own screen gets a white glare vignette.
- **Numbers:** Radius 10 m, 180-degree sweep over 1.5 s, 0.8x BA per enemy, Reveal 4 s, Blind 2 s. Allies' skillshots deal +15% to Blinded targets. Cooldown 12 s.
- **Telegraph:** Enemies see the beam's path as a red-rimmed half-circle with the sweep direction marked.
- **Team use:** Reveals stealthed divers and flankers, and blind protects the backline for 2 s.

##### Keeper's Rope (Pull / hook)

- **Cast:** He shrugs the coil of rope off his shoulder and throws its weighted end in a long lasso throw. Base: UAL OVERHAND_THROW with a loop-swing windup layer.
- **Projectile / strike object:** The lighthouse keeper's rope with a heavy iron mooring ring on its end.
- **Flight:** Straight line, 22 m/s, 10 m. The rope pays out from his shoulder as a verlet ribbon. Sound: a rope whir and a clank.
- **Impact:** The ring clamps on, the rope snaps taut, and he hauls hand over hand.
- **Target reaction:** An enemy is dragged 4 m toward him and stumbles. An ally is pulled to his side and sees a yellow mooring ring on their waist.
- **Numbers:** Range 10 m. Enemy: pull 4 m, 0.8x BA, 0.3 s stun at the end. Ally: pull to Oko's side and +15% damage reduction for 2 s. Cooldown 14 s.
- **Telegraph:** Enemies see a red rope line flash. Allies see a gold line.
- **Team use:** Pull an ally out of a bad fight, or drag a diver into your squad's reach.

#### Passive: Seen It Before

Oko sees enemy skillshot telegraphs 0.3 s earlier than normal, and shares them: every enemy skillshot aimed within 10 m of Oko shows its line as a faint yellow lighthouse ray to his whole team before it's thrown.

*Visual tell:* His great eye darts toward the danger and the brass lens ring glints yellow a split second before an enemy casts.

#### Super: The Light Stays On

> Oko stops and plants his boots. Camera drops low as the brass lens over his eye starts to unfold, ring after ring of brass and glass blooming around his head until he is wearing a lighthouse. The arena goes dark. Then the light comes on: a vast beam swings slowly around the whole field, twice. Enemies caught in it throw their arms over their eyes. Allies caught in it are bathed in warm light and see the way home. He spent three hundred years making sure this light could never go out.

- **Style:** Hitscan beam / channel (360-degree)
- **Cast:** He plants his feet and lifts his head. The brass lens over his eye unfolds into a full lighthouse Fresnel lens, ring after ring of brass and glass opening around his head. The night falls, and the light stays on.
- **Strike object:** A colossal rotating lighthouse beam from the enormous lens around his head, sweeping the whole arena.
- **Flight:** The lens opens over 0.8 s. Then the beam sweeps a full 360 degrees twice over 4 s, 30 m long and 10 degrees wide. Night falls over the arena (a screen-space darkening pass), so the beam is the only light. Sound: a foghorn, and the slow clockwork tick of a lighthouse mechanism.
- **Impact:** The beam's path is lit like sunlight on water and fades over 1 s behind the sweep.
- **Target reaction:** Enemies hit are blinded (white glare overlay) and revealed, and they stagger with an arm thrown over their eyes. Allies hit are Guided Home: a warm glow, a yellow path line toward the nearest safe ally, and a heal.
- **Numbers:** Range 30 m, 2 full rotations over 4 s. Each pass: 1.5x BA to enemies (3.0x BA total), Blind 2 s, Reveal for the rest of the super. Allies: heal 1.0x BA per pass and +20% move speed for 3 s. Walls and terrain block the beam.
- **Telegraph:** The lens opening is a 0.8 s warning, and enemies see the beam's sweep direction with a red rim.
- **Team use:** A full-arena reveal and team heal. Your squad knows where every enemy is for 4 s.
- **Charge:** Nights kept: time spent channelling beams, enemies revealed, and allies pulled to safety fill it. On his body, the brass lens ring glows brighter and small rays leak from its edge. HUD: a lighthouse icon whose lamp brightens.
- **Counterplay:** Walls and terrain block the beam, so stand behind Moss's walls, Camedown's steps or Pyrrhos's boulder. Oko is rooted for the full 4.8 s. The sweep speed is fixed and visible, so time a dash through it. Stunning him shuts the lens.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.8 s | UAL Idle_Loop into a planted pose layer | Feet planted wide, head lifts, hands drop to his sides. | The lens unfolds ring by ring; the night pass starts. | Lighthouse lens prop (5 concentric ring pieces) on the head bone, scaling open. | Brass gears turning; a foghorn. |
| Action | 0.8-4.8 s | UAL Idle_Loop with a slow 720-degree hips rotation layer | The whole body rotates in place twice, steady, like a lighthouse turret. | 30 m beam sweeps twice; dust motes; ground light trail. | Lens prop rotates with the head. | Lighthouse clockwork tick; low hum. |
| Impact | within 0.8-4.8 s | Same | Same. | Glare bursts on enemies, warm glow and path line on allies. | None. | A soft ping on each hit. |
| Recovery | 4.8-5.6 s | UAL Idle_Loop | The lens folds back down; he rubs his eye with a huge knuckle. | Night pass fades out. | Lens prop folds back to the monocle ring. | Gears winding down. |

#### Body language

- **Locomotion:** A rolling sailor's walk, legs wide as if on a deck. The run is a heavy, determined trot with the rope coil bouncing on his shoulder. Base: UAL Walk_Loop with a wide-stance layer; Jog_Fwd_Loop retimed 10% slower.
- **Idle:** Gazes far off at a horizon nobody else can see, polishes his lens with a sleeve, tugs his beard braid. Base: UAL Idle_Loop with hand layers.
- **Hit reaction:** His lens rings clatter and he blinks hard, the eye watering. Base: UAL Hit_Head.
- **Death:** He sinks to sit on the ground and the light in his lens dims slowly to nothing, like a lamp running out of oil. Base: UAL Sitting_Enter into a slump.
- **Victory:** He shades his eye with a hand and looks out to sea, then nods slowly as if he finally sees a boat coming home. Base: UAL Idle_Loop with a salute-like shading layer.

#### Team combos

- **With The One Who Came Down:** Camedown raises Stair to Nowhere. Oko stands on the steps: high ground adds 15% range and lets his beams pass over walls.
- **With Pyrrhos:** Oko's beam lights Pyrrhos's patrol lane. Pyrrhos marches a fourth pass.
- **With Lysandra Kole:** Chisel Split shreds armour on a line of enemies. Fresnel Lance pierces the same line.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `oko_idle` | UAL Idle_Loop | custom pose layer | Horizon gaze; lens polish; beard tug. |
| `oko_walk` | UAL Walk_Loop | custom pose layer | Wide sailor stance. |
| `oko_run` | UAL Jog_Fwd_Loop | retime | 10% slower. |
| `oko_dodge` | UAL Roll | retime | Heavy. |
| `oko_basic_1` | UAL Pistol_Aim_Neutral | custom pose layer | Arms down, head forward. |
| `oko_basic_2` | UAL Pistol_Aim_Neutral | custom pose layer | Same. |
| `oko_basic_3` | UAL Spell_Simple_Enter | custom pose layer | Hands framing the head, 0.3 s hold. |
| `oko_skill_sweeping_beam` | UAL Idle_Loop | custom pose layer | 180-degree spine and neck rotation over 1.5 s. |
| `oko_skill_keepers_rope` | UAL OVERHAND_THROW | custom pose layer | Lasso loop windup. |
| `oko_super_light_stays_on` | UAL Idle_Loop | custom pose layer | Two full in-place rotations; see beats. |
| `oko_hit` | UAL Hit_Head | reuse as-is | - |
| `oko_death` | UAL Sitting_Enter | custom pose layer | Slump at the end. |
| `oko_victory` | UAL Idle_Loop | custom pose layer | Hand shading the eye. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `oko_lens_beam` | hitscan beam | Narrow warm-white beam (#FFF3C4) with lit dust motes; lens-flare star at the hit point. |
| `oko_fresnel_beam` | hitscan beam | Thick beam with a scrolling concentric ring texture. |
| `oko_dazzle` | status overlay | White glare on the victim's face area. |
| `oko_sweep_fan` | mesh fan + particles | 10 m light fan with bright leading edge, sea-spray motes. |
| `oko_reveal_outline` | status overlay | Yellow outline visible through walls to Oko's team. |
| `oko_blind_vignette` | screen overlay (enemy only) | White glare vignette on blinded players' screens. |
| `oko_rope` | tether ribbon (verlet) | Hemp rope with an iron mooring ring at the end. |
| `oko_skillshot_preview` | line decal | Faint yellow lighthouse ray over enemy skillshot lines, shared to allies. |
| `oko_lighthouse_lens` | prop mesh | Five concentric brass-and-glass rings that unfold around his head. |
| `oko_great_beam` | hitscan mesh | 30 m beam cone with volumetric-look cards. Fallback: one additive quad and a ground light decal. |
| `oko_night_pass` | screen pass | Arena-wide darkening, with the beam excluded. |

---

### Madame Ysolt Crane, the Blood Ledger

**Class:** Damage: skirmisher (drain duelist) / Specialist: saboteur/debuffer  
**Basic style:** Pull / hook  
**Team job:** Puts a debt on the enemy everyone is hitting, then collects it as damage and healing for the squad. She also cuts enemy healing.  
**Palette:** ink black `#1B1A1F`, pale skin `#D8D6D6`, blood red `#A3121E`, ledger leather `#7B3A1F`, scales gold `#C9A13B`, chain iron `#4A3A35`, quill red `#C3271F`, paper `#EFE6D2`

#### Basic attack chain

##### Hit 1: Ledger Slap (Pull / hook (chain-swung ledger))

- **Cast:** She lets the ledger chained to her right wrist drop to the end of its chain and swings it in a flat arc, prim and precise. Base: UAL Sword_Attack (horizontal slash) with the arm extended, the ledger prop on the chain swinging from the hand bone.
- **Projectile / strike object:** The heavy leather ledger on its iron chain, pages fluttering, flinging a spatter of red ink in an arc.
- **Flight:** Arc of 120 degrees, 3 m reach. The chain is a short verlet ribbon. Red ink droplets fly off the arc and pages flicker. Sound: a chain rattle and a heavy book thwack.
- **Impact:** A splatter of red ink on the target and on the ground (a decal, 1 s).
- **Target reaction:** Knocked sideways by the book, with red ink spattered across their chest.
- **Numbers:** Range 3 m, arc 120 degrees, 1.0x BA, 1.0 hits/s.
- **Telegraph:** None.
- **Team use:** Wide swings put red ink on several enemies near your frontline.

##### Hit 2: Balanced Backhand (Pull / hook)

- **Cast:** The ledger swings back the other way on its chain while she steps through. Base: Sword_Attack reversed.
- **Projectile / strike object:** Same ledger, swinging back.
- **Flight:** Same.
- **Impact:** Same.
- **Target reaction:** Same, the other direction.
- **Numbers:** Range 3 m, 1.05x BA.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Collection (Pull / hook)

- **Cast:** She hurls the ledger out on the full length of its chain. It flies open, snaps shut on the target like jaws, and she hauls them in with one tug. Base: UAL MELEE_HOOK.
- **Projectile / strike object:** The ledger flying open, pages fanned like teeth, on a chain that pays out to 7 m.
- **Flight:** Straight line, 24 m/s, 7 m. The chain pays out as a ribbon. On hit, the book snaps shut on the target and the chain yanks taut. Sound: a whoosh, a thump of a slammed book, then the chain rattling in.
- **Impact:** Red ink burst; a drag mark decal along the pull path for 1 s.
- **Target reaction:** The victim is pulled 3 m toward her, feet skidding (the victim plays UAL SLIDE), with the ledger's red ribbon bookmark wrapped around their wrist for a moment.
- **Numbers:** Range 7 m, 1.3x BA, pull 3 m.
- **Telegraph:** A thin red line flash 0.15 s before.
- **Team use:** Drags an enemy out of position into the squad.

#### Skills

##### Entry (Aimed skillshot line (applies a debt mark))

- **Cast:** She plucks the red quill from her hair bun, licks the tip, and flicks it like a dart. Base: UAL OVERHAND_THROW with a hand-to-hair pluck layer.
- **Projectile / strike object:** The red quill, its nib wet with blood-red ink, writing a thin line through the air as it flies.
- **Flight:** Straight line, 26 m/s, 10 m. It leaves a thin handwritten-looking red ink line in the air that fades in 0.6 s. Sound: a fast quill scratch.
- **Impact:** The quill sticks in the target for a moment, then flies back to her bun.
- **Target reaction:** Indebted: a floating red ledger line appears over the target's head with a number that counts up as anyone on Ysolt's team damages them (the amount owed).
- **Numbers:** Range 10 m, 0.8x BA, the debt mark lasts 6 s. Ysolt heals for 40% of the damage she deals to Indebted enemies. Recast to Collect early: deals 20% of all team damage dealt to the target during the mark as bonus damage, and heals Ysolt and allies within 6 m for that amount, split evenly. Cooldown 10 s.
- **Telegraph:** Enemies see a thin red line flash 0.15 s before.
- **Team use:** Everyone focuses the Indebted target; the bigger the debt, the bigger the payout to the squad when she collects.

##### Balance the Books (Ground zone)

- **Cast:** She unhooks the gold scales from her belt and sets them on the ground with a precise click. They tip toward her enemies. Base: UAL PickUp_Table reversed (placing an object down).
- **Projectile / strike object:** Her small gold balance scales, grown to 1 m tall as a spawned prop, with a ring of ledger columns drawn on the ground around them.
- **Flight:** Placed at her feet or thrown 6 m in a short arc. The ledger-column ring draws itself outward to 4 m. Sound: a coin clink and a ledger page turning.
- **Impact:** A 4 m ring decal of red-ruled ledger columns with numbers ticking in them. Lasts 5 s.
- **Target reaction:** Enemies inside see their heal numbers turn grey and get subtracted (a red minus glyph floats when they're healed). Allies inside see a faint red droplet stream from enemies into themselves.
- **Numbers:** Radius 4 m, lasts 5 s. Enemies inside: healing received -50%. Allies inside: 10% lifesteal. Cooldown 16 s.
- **Telegraph:** Enemies see a red-rimmed ledger ring.
- **Team use:** Anti-heal for the squad against Corrin, Mott or Jory comps.

#### Passive: Exactly What You Owe

Ysolt can't overheal. Any healing beyond her max HP becomes a Credit shield (max 20% of her HP) that lasts 6 s.

*Visual tell:* Her ledger's pages glow faintly red as Credit builds, and the gold scales on her belt tip toward her side.

#### Super: Foreclosure

> Ysolt snaps the ledger open with a flourish. Camera pushes in on the page: a long column of names in red ink, and at the very top, in her own handwriting, a debt to Death. She runs her finger down the page, and each name she touches pulls taut a chain that bursts out of the book. Chains fly across the arena and hook every enemy who owes her. With one sharp tug she hauls them all in, and their debts drain into the book as numbers.

- **Style:** Pull / hook (multi-target chains)
- **Cast:** She opens the ledger to its oldest page and reads out every debt. Iron chains burst out of the book toward every enemy who owes her.
- **Strike object:** Spectral iron chains, one per indebted enemy, that shoot from the open ledger and hook into each debtor's chest, then reel them in.
- **Flight:** Chains fire at 30 m/s to every enemy within 14 m who carries a debt (has been Indebted at least once this match and not paid off). They hook, then reel each debtor 3 m toward her. Sound: a heavy ledger slam, chain rattles, and a cash-register ring for each debt collected.
- **Impact:** Red ink spills from the ledger in a 4 m pool decal under her for 3 s.
- **Target reaction:** Each debtor jerks forward as the chain hooks their chest and stumbles toward her, with their debt number floating over them and draining into the book.
- **Numbers:** Range 14 m. Every enemy who has been Indebted this match: pulled 3 m, takes 2.0x BA plus 30% of the total team damage dealt to them during their past debt marks (capped at 4.0x BA). Ysolt heals for the total; allies within 8 m share it as shields.
- **Telegraph:** A 1.0 s windup with the ledger opening and glowing pages, and every debtor sees a red chain icon over their own head.
- **Team use:** The more the squad has focused Indebted targets, the bigger the collection. A long fight makes her super huge. If Jory is on her team, enemies below 15% HP are executed: Death collects too.
- **Charge:** Debt collected: every Collect and heal from Indebted targets fills it. On her body, red ink creeps up the chain from the ledger to her wrist, and the number on the ledger's cover counts up. HUD: a ledger icon with a red total.
- **Counterplay:** Only enemies who have been Indebted are hit: dodge her quill and you're immune. Chains need line of sight, so walls cut them. The 1.0 s windup lets debtors move behind cover. Pulling a debtor with a cleanse beforehand doesn't erase the debt, but staying outside 14 m does.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-1.0 s | UAL Idle_Talking_Loop | Ledger lifted in her left hand, opened, right finger running down the page. | Pages glow red; debt icons appear over debtors. | Ledger prop opened (two-piece book prop, hinged in code). | A page flip, a pen scratch, then reading in a dry voice. |
| Action | 1.0-1.4 s | UAL MELEE_HOOK | A sharp tug back with the chain hand. | Chains fire to every debtor and hook in. | Chain ribbons spawned from the book. | Chain rattle, multiple. |
| Impact | 1.4-2.0 s | Hold the end pose | Hold the tug pose as debtors are reeled in. | Debt numbers drain into the book; red ink pool. | None. | A cash-register ring per debt. |
| Recovery | 2.0-2.5 s | UAL Idle_Loop | Snaps the ledger shut and adjusts her glasses. | Chains dissolve into ink. | Ledger closes. | A book slam. |

#### Body language

- **Locomotion:** A prim, upright walk with small precise steps, the ledger chain swinging. The run is quick and stiff-backed with the ledger held against her chest. Base: UAL Walk_Formal_Loop; Jog_Fwd_Loop with an upright layer.
- **Idle:** Writes something in the ledger, checks it, sighs. Pushes her round glasses up. Base: UAL Idle_Talking_Loop with a writing layer.
- **Hit reaction:** Her glasses go crooked, she gasps in offence, and a page tears out of the ledger. Base: UAL Hit_Head.
- **Death:** She sinks down primly, folds her hands on the ledger, and its pages flutter open: the oldest entry glows, then she crumbles to ink that soaks into the pages. Base: UAL Death01 slowed.
- **Victory:** She writes a final entry, blots it, and closes the ledger with a satisfied little click. Base: UAL Idle_Talking_Loop with a writing layer.

#### Team combos

- **With Jory Ashby:** Jory on the same team. Foreclosure executes enemies below 15% HP.
- **With Nyssa Obel:** Both mark the same target (Toll and Entry). Every squad hit drops a coin for Nyssa and adds interest for Ysolt.
- **With Thimble:** Changeling swaps a polymorphed enemy into the squad. Ysolt Indebts and Collects on a helpless target taking +20% damage.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `ysolt_idle` | UAL Idle_Talking_Loop | custom pose layer | Writing in the ledger; glasses push. |
| `ysolt_walk` | UAL Walk_Formal_Loop | reuse as-is | - |
| `ysolt_run` | UAL Jog_Fwd_Loop | custom pose layer | Upright, ledger held to the chest. |
| `ysolt_dodge` | UAL Roll | reuse as-is | - |
| `ysolt_basic_1` | UAL Sword_Attack | custom pose layer | Chain-swung ledger from the right hand bone. |
| `ysolt_basic_2` | UAL Sword_Attack | retime | Reversed. |
| `ysolt_basic_3` | UAL MELEE_HOOK | reuse as-is | - |
| `ysolt_skill_entry` | UAL OVERHAND_THROW | custom pose layer | Pluck the quill from the hair bun first. |
| `ysolt_skill_balance_the_books` | UAL PickUp_Table | retime | Reversed (placing down). |
| `ysolt_super_foreclosure` | UAL Idle_Talking_Loop / MELEE_HOOK | custom pose layer | See beats. |
| `ysolt_hit` | UAL Hit_Head | reuse as-is | - |
| `ysolt_death` | UAL Death01 | retime | Slowed; folded hands. |
| `ysolt_victory` | UAL Idle_Talking_Loop | custom pose layer | Writing and closing. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `ysolt_ledger_chain` | prop + verlet ribbon | Leather ledger on an iron chain from the wrist bone. |
| `ysolt_ink_spatter` | particles + decal | Blood-red ink droplets and a splatter decal. |
| `ysolt_book_jaws` | prop animation | Ledger flying open and snapping shut on hit. |
| `ysolt_quill` | projectile mesh + ribbon | Red quill with a thin handwritten ink line trail. |
| `ysolt_debt_mark` | status overlay | A floating red ledger line and a counting number above the target. |
| `ysolt_scales` | spawned prop | 1 m gold balance scales that tip toward enemies. |
| `ysolt_ledger_ring` | decal | Red-ruled ledger columns with ticking numbers, 4 m. |
| `ysolt_heal_minus` | status overlay | Grey heal numbers with a red minus glyph on enemies. |
| `ysolt_spectral_chains` | ribbon | Spectral iron chain ribbons with a hook end. |
| `ysolt_ink_pool` | decal | Red ink pool spreading under her. |

---

### Sir Halven, the Divided Herald

**Class:** Support: buffer / Frontline: bruiser  
**Basic style:** Cleave arc  
**Team job:** A bruising herald who throws his own head as a lookout: his squad gets early warnings, damage reduction, a rally horn and a royal decree.  
**Palette:** royal purple `#5B2A86`, plate steel `#8A8E93`, dark iron `#3E4247`, horn brass `#C9A13B`, strap leather `#6A4628`, lantern iron `#2F2F2F`, lantern glow `#FFC86B`, beard brown `#6B3E22`

#### Basic attack chain

##### Hit 1: Herald's Swing (Cleave arc)

- **Cast:** The body unhooks the iron lantern cage from its belt and swings it on its chain in a flat arc, the head inside it yelling. Base: UAL Sword_Attack (horizontal) with the lantern prop swinging on a short verlet chain from the right hand bone.
- **Projectile / strike object:** The lantern cage with Halven's own bearded head inside (a separate prop; the face uses 4 expression textures: calm, alarmed, furious, smug). It leaves a warm lantern-light ribbon trail and pops a speech bubble with angry glyphs.
- **Flight:** Arc of 140 degrees, 2.8 m reach. The lantern ribbon is warm gold, and a comic speech-bubble sprite pops out: !! or a grumble glyph. Sound: a chain whoosh, a metal clang, and the head shouting Mind the face!
- **Impact:** An iron clang and a burst of lantern sparks.
- **Target reaction:** Knocked sideways with soot sparks on the cheek.
- **Numbers:** Range 2.8 m, arc 140 degrees, 1.0x BA, 0.95 hits/s.
- **Telegraph:** None.
- **Team use:** Wide swings tag several divers at once.

##### Hit 2: Backswing (Cleave arc)

- **Cast:** The swing back the other way, the body pivoting at the hips. Base: Sword_Attack reversed. The head's face swaps to the alarmed texture.
- **Projectile / strike object:** Same lantern, a bubble reading Careful!
- **Flight:** Same arc, reversed.
- **Impact:** Same.
- **Target reaction:** Same.
- **Numbers:** Range 2.8 m, 1.05x BA.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Proclamation (Cleave arc (overhead slam))

- **Cast:** The body whirls the lantern overhead once and slams it down; the head inside bellows a proclamation as it lands. Base: UAL Sword_Attack overhead with a full overhead whirl layer.
- **Projectile / strike object:** The lantern slamming down, plus the head's bellow: a ring of sound with a parchment-scroll pattern on it.
- **Flight:** The lantern arcs overhead and down. On impact, the sound ring expands to 3 m at 15 m/s. Sound: a clang, then the head shouting Hear ye!
- **Impact:** A ring of scroll-patterned dust and an iron crack decal, 1.5 s.
- **Target reaction:** Knocked back 1.5 m, hands to their ears.
- **Numbers:** Radius 3 m, 1.4x BA, knock-back 1.5 m.
- **Telegraph:** A 0.2 s lantern flare as it whirls overhead.
- **Team use:** Knock-back peels divers off the squad's backline.

#### Skills

##### Lookout (Lobbed arc (lands as a ward; recast to recall as a boomerang))

- **Cast:** The body unhooks the lantern and lobs it underhand toward a spot, a little too hard. The head screams the whole way. Base: UAL OVERHAND_THROW retimed to an underhand lob.
- **Projectile / strike object:** The lantern cage with the head, now a ward: it lands upright and the lantern light swells into a beacon. The head starts shouting warnings.
- **Flight:** Lobbed arc, 14 m/s, up to 12 m, spinning end over end with the head's face on the alarmed texture. On recast, the lantern flies straight back to the body on its chain like a boomerang at 18 m/s, hitting enemies on the way. Sound: a scream going out; on landing, a bell-like clank and the head shouting Enemy left!
- **Impact:** On landing, an 8 m lantern-light circle (warm gold decal, white outline for allies).
- **Target reaction:** Enemies in the circle are revealed with a gold outline. Allies in it are Warned: a small gold arrow appears at their feet pointing at the nearest threat, and the next hit they take within 4 s is reduced 40%.
- **Numbers:** Throw range 12 m, ward lasts 8 s, vision radius 8 m. Warned: 40% damage reduction on the next hit within 4 s (refreshes every 4 s). Recall: 1.0x BA to enemies along the path. While the head is away, the body attacks 15% faster with bare gauntlet punches. Cooldown 12 s.
- **Telegraph:** Enemies see the lantern with a red rim and hear it.
- **Team use:** Vision, warnings and damage reduction for the squad. Place it where the enemy will flank.

##### Herald's Horn (Cone spray (dual-team))

- **Cast:** The body pulls the brass horn off its back and holds the mouthpiece up to the lantern's cage. The head blows it, cheeks puffed. Base: UAL Spell_Simple_Shoot with both hands holding the horn at the lantern, the lantern raised to chest height.
- **Projectile / strike object:** A blast of brass sound: cone-shaped rings with royal purple pennant streamers flying in them and a puff of steam from the horn's bell.
- **Flight:** A 60-degree cone, 7 m, rings expanding at 14 m/s with streamers fluttering. Sound: a heraldic fanfare call.
- **Impact:** Purple pennant scraps drift down for 1 s.
- **Target reaction:** Enemies in the cone are knocked back 2 m and hold their ears. Allies in the cone see purple pennant streamers around them: Rallied.
- **Numbers:** Cone 7 m by 60 degrees. Enemies: 0.8x BA, knock-back 2 m. Allies: +20% move speed and cleanse slows, 3 s. Cooldown 14 s.
- **Telegraph:** Enemies see a red-rimmed cone flash 0.2 s before.
- **Team use:** Push enemies back and speed your squad up in the same direction: a charge order.

#### Passive: Two Minds

While the head is at his belt, every 3rd basic attack the head negotiates: the target is Persuaded and deals 15% less damage for 2 s. While the head is away (Lookout), the body attacks 15% faster.

*Visual tell:* The lantern's glow is warm gold while the head is in charge and turns red when the body is in charge. Small speech-bubble sprites pop above the lantern as the head talks.

#### Super: The King's Last Message

> The body raises the horn and blows a long fanfare, and the lantern's little door swings open by itself. Camera pushes toward the cage. Halven's head looks up and clears its throat. A golden scroll unrolls from the lantern into the air, glowing with letters, sealed with the king's seal. The head reads it aloud in a voice that fills the arena. Every enemy within earshot drops to one knee. Every ally stands taller, crowned in gold. For six seconds, the head and the body agree on something.

- **Style:** Aura (royal decree)
- **Cast:** The lantern's cage swings open. A rolled scroll unfurls from inside it, and the head, for the first time, reads aloud the last message the king ever sent.
- **Strike object:** A large golden scroll unrolling in mid-air above Halven (a spawned ribbon mesh with a parchment texture and glowing gold letters), a royal seal, and a crown-shaped ring of light spreading out.
- **Flight:** The scroll unrolls over 0.8 s and lifts 3 m above him. Golden letters scroll across it. A crown ring expands to 14 m. Sound: a long royal fanfare on the horn, then the head reading in a booming voice.
- **Impact:** A 14 m ring of purple and gold banner-light decal on the ground, lasting the 6 s.
- **Target reaction:** Allies see a gold crown glyph above their heads: By Royal Decree. Enemies are forced to Kneel: they drop to one knee for 1.2 s with a gold crown stamp above their heads.
- **Numbers:** Radius 14 m (line of sight to the lantern required). Allies: +25% damage, +25% damage reduction, and a cleanse, for 6 s. Enemies: Kneel (stun) 1.2 s, 1.0x BA. The body and head fight together for the 6 s: both his passive bonuses are active at once.
- **Telegraph:** A 1.2 s windup with the horn fanfare and the scroll unrolling; enemies see a red-rimmed crown ring.
- **Team use:** A team-wide fight-starter: kneel the enemies, buff the squad, go.
- **Charge:** Warnings shouted: hits prevented by Warned allies and enemies revealed by Lookout fill it. On his body, the brass horn on his back puffs more and more steam from its bell. HUD: a scroll icon unrolling.
- **Counterplay:** Line of sight to the lantern is required, so break line of sight behind walls during the 1.2 s fanfare. Stunning the body during the windup drops the scroll. A cleanse frees an ally of Kneel early.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-1.2 s | UAL Spell_Simple_Shoot (horn hold) | Body raises the horn to the lantern; the head blows a fanfare. | Steam from the horn; the lantern door swings open. | Horn prop moves from back bone to hands; lantern door hinged in code. | Royal fanfare. |
| Action | 1.2-2.0 s | UAL Spell_Simple_Enter | Body lifts the lantern high in its right hand like a torch. | Scroll unrolls from the lantern 3 m into the air. | Scroll ribbon mesh. | A head clearing its throat; a parchment unroll. |
| Impact | 2.0-2.4 s | UAL Spell_Simple_Shoot | Lantern thrust forward. | Crown ring expands 14 m; Kneel stamps on enemies. | None. | The head booming: By order of the King! |
| Recovery | 2.4-3.0 s | UAL Idle_Loop | Body re-hooks the lantern; the head looks smug. | Scroll dissolves to gold dust. | Horn back on the back bone. | A last horn note. |

#### Body language

- **Locomotion:** A stiff knightly march with plate clanking; the lantern bounces at the hip and the head complains about the jostling. The run is a heavy armoured jog. Base: UAL Walk_Formal_Loop; Jog_Fwd_Loop.
- **Idle:** The body stands at parade rest while the head looks around, argues with it (speech bubbles), and the body ignores it. Sometimes the body taps the lantern to shut the head up. Base: UAL Idle_Loop with a hand-tap layer; face texture swaps on the head prop.
- **Hit reaction:** The armour clangs; the head screams Ow! even though the body was hit. Base: UAL Hit_Chest.
- **Death:** The body falls to its knees and topples forward. The lantern rolls away a few metres and the head says, I told you so. Base: UAL Death01. The lantern detaches to physics.
- **Victory:** The body raises the lantern high and the head gives a dignified nod, then says something smug in a speech bubble. Base: UAL Idle_Loop with a raised-arm layer.

#### Team combos

- **With Fenwick Marl:** Lookout reveals an isolated enemy. Fenwick Name Tags it and leaps in from 10 m.
- **With Nyssa Obel:** Lookout lands on a flank. Nyssa's Call the Ferry carries the squad straight to the revealed target.
- **With Hespera:** The King's Last Message forces a group to kneel for 1.2 s. Hespera's charged Cinder Sling and Dusk ring land on enemies who can't move.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `halven_idle` | UAL Idle_Loop | custom pose layer | Parade rest; lantern tap. Head face swaps in code. |
| `halven_walk` | UAL Walk_Formal_Loop | reuse as-is | - |
| `halven_run` | UAL Jog_Fwd_Loop | reuse as-is | - |
| `halven_dodge` | UAL Roll | reuse as-is | Lantern held to the chest. |
| `halven_basic_1` | UAL Sword_Attack | custom pose layer | Lantern on a chain instead of a sword. |
| `halven_basic_2` | UAL Sword_Attack | retime | Reversed. |
| `halven_basic_3` | UAL Sword_Attack | custom pose layer | Overhead whirl, then slam. |
| `halven_basic_headless` | UAL Punch_Jab + Punch_Cross | reuse as-is | Bare-gauntlet punches while the head is away. |
| `halven_skill_lookout` | UAL OVERHAND_THROW | retime | Underhand lob. |
| `halven_skill_lookout_recall` | UAL MELEE_HOOK | reuse as-is | Yank the chain back. |
| `halven_skill_heralds_horn` | UAL Spell_Simple_Shoot | custom pose layer | Both hands hold the horn to the lantern. |
| `halven_super_kings_message` | UAL Spell_Simple_Shoot / Spell_Simple_Enter | custom pose layer | See beats. |
| `halven_hit` | UAL Hit_Chest | reuse as-is | - |
| `halven_death` | UAL Death01 | reuse as-is | Lantern detaches. |
| `halven_victory` | UAL Idle_Loop | custom pose layer | Lantern raised. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `halven_lantern_head` | prop mesh | Iron lantern cage with the bearded head inside; 4 face textures (calm, alarmed, furious, smug). |
| `halven_lantern_ribbon` | ribbon trail | Warm gold lantern-light ribbon on swings. |
| `halven_speech_bubble` | billboard sprite | Comic speech bubbles with glyphs (!!, grumble, Careful!). |
| `halven_proclaim_ring` | spawned mesh | Sound ring with a parchment scroll pattern. |
| `halven_lookout_circle` | decal | 8 m warm gold vision circle; red rim to enemies. |
| `halven_warned_arrow` | status overlay | Small gold arrow at an ally's feet pointing at the nearest threat. |
| `halven_horn_blast` | particles + mesh | Cone sound rings with purple pennant streamer ribbons; steam puff from the horn. |
| `halven_scroll` | spawned ribbon mesh | Parchment scroll with glowing gold letters and a red seal. |
| `halven_crown_ring` | spawned mesh + decal | 14 m crown-shaped light ring and purple-gold banner decal. |
| `halven_kneel_stamp` | status overlay | Gold crown stamp above kneeling enemies. |
| `halven_horn_steam` | particles | Steam wisps from the horn's bell, rate tied to super charge. |

---

## Ascendant

### Sena, the Fourth Fate

**Class:** Control: tethers and binds / Damage: executioner  
**Basic style:** Tether between units  
**Team job:** Ties enemies to each other and to her fingers. She can hold an ally's thread so they can't die, and her super cuts one enemy's thread for good.  
**Palette:** thread red `#9E2A2B`, ash dress `#5A5A5C`, pale skin `#C9C7C3`, white hair `#EDEDE8`, shears gold `#D4AF37`, bobbin brass `#B8923A`, fate glow `#FFF1C1`, shadow `#2E2E33`

#### Basic attack chain

##### Hit 1: Loose End (Tether between units)

- **Cast:** She flicks her right fingers like casting a fishing line, and a red thread whips off them. Base: UAL Spell_Simple_Shoot retimed into a wrist flick, the fingers spreading.
- **Projectile / strike object:** A fine red thread with a tiny glowing knot at its tip.
- **Flight:** Whips out in a slight curve at 30 m/s, latches onto the target, then stays as a tether from her finger to their wrist (verlet ribbon, 6 segments). Sound: a taut thrum like a plucked string, and a faint hum while the tether holds.
- **Impact:** A small red knot appears at the victim's wrist.
- **Target reaction:** The target's wrist is tied with red thread (a thread loop overlay on the wrist bone). Their arm jerks toward Sena when she tugs, a small stagger every tick.
- **Numbers:** Range 7 m, tether breaks at 9 m. 0.6x BA on attach, then 0.3x BA per second while tied. One tether per hand (2 total). Attacks at 1.0/s.
- **Telegraph:** None.
- **Team use:** Tethered enemies feed the rest of her kit; anything tied is also something Kallix can set on fire.

##### Hit 2: Loose End (Tether between units)

- **Cast:** Same with her left hand.
- **Projectile / strike object:** Same thread.
- **Flight:** Same.
- **Impact:** Same.
- **Target reaction:** Same.
- **Numbers:** Same as hit 1.
- **Telegraph:** None.
- **Team use:** Two tethers: two targets for Snip.

##### Hit 3: Snip (Tether (finisher))

- **Cast:** She draws the giant gold shears from her belt (prop on the right hand bone) and snips both threads at once with a heavy, satisfying cut. Base: UAL Sword_Attack with a two-handed scissor-close layer.
- **Projectile / strike object:** The gold shears closing on the threads, a flash of gold where the blades meet.
- **Flight:** Instant at her hands. The cut travels down each tethered thread as a gold spark running to the victim at 40 m/s. Sound: a loud, crisp metal snip, then strings twanging.
- **Impact:** A small gold flash on each victim; the thread ends curl up and fall.
- **Target reaction:** Each victim jolts as the thread snaps back; their tied wrist flails.
- **Numbers:** 1.4x BA to each tethered enemy (2 max). Ends both tethers.
- **Telegraph:** None.
- **Team use:** Burst on two enemies at once, wherever they are within tether range.

#### Skills

##### Knot (Tether between units (enemy to enemy))

- **Cast:** She plucks a thread from a nearby enemy and ties it to a second one with a quick knotting motion of both hands. Base: UAL Interact with a two-hand knot layer.
- **Projectile / strike object:** A thick double red thread connecting two enemies, with a big knot in the middle.
- **Flight:** Cast on the first enemy (thread whips to them), then the second (thread stretches to them). The knot slides to the midpoint. Sound: two string plucks and a tight knot creak.
- **Impact:** A knot sprite floats at the midpoint.
- **Target reaction:** Both enemies are Bound: a red thread loop at their waists. If they move more than 5 m apart, the thread yanks them back together and they stumble into each other, slowed 30% for 1 s.
- **Numbers:** Range 8 m per target, lasts 4 s. Yank pulls both together and slows 30% for 1 s. 30% of damage dealt to one is echoed to the other. Cooldown 12 s.
- **Telegraph:** Enemies see a red-rimmed thread.
- **Team use:** Kallix can ignite the thread so the fire travels to both. Wrenna's Sounding on one drags the other onto the rose.

##### Held Thread (Ally-targeted buff)

- **Cast:** She reaches toward an ally and, between finger and thumb, takes hold of an invisible thread above their head, and winds it round her finger. Base: UAL Spell_Simple_Shoot with a pinch-and-wind hand layer.
- **Projectile / strike object:** The ally's own life-thread made visible: a glowing white-gold thread from the top of the ally's head to Sena's finger.
- **Flight:** Appears instantly. The thread hums and shimmers. Sound: a long sustained harp note.
- **Impact:** A faint white-gold halo of loose threads around the ally.
- **Target reaction:** The ally sees a white-gold thread rising from their head and their colours go slightly washed out: they can't die, but they can't fully live either.
- **Numbers:** Range 9 m, lasts 2.5 s. The ally can't drop below 1 HP but can't receive healing and moves 15% slower. Cooldown 24 s.
- **Telegraph:** Allies see a gold thread; enemies see the same thread with a grey rim, so they know not to waste burst.
- **Team use:** A save tool against a burst combo. Pair with Corrin or Jory to heal them up the moment the thread is released.

#### Passive: Thousands of Threads

Every enemy Sena has tethered in the last 10 s keeps a faint thread running to her fingers (up to 6). Each held thread gives her tethers +5% damage, and her Snip +10%.

*Visual tell:* Faint threads multiply from her fingers, trailing off toward enemies. One thread on her left hand always glows gold: her own.

#### Super: The Cut

> Sena draws her shears and they grow huge, gleaming gold, almost as tall as she is. Camera tightens on her face: blank, patient. A single red thread rises from one enemy's head into the sky, and everyone in the arena can see it. She opens the shears around it and closes them. The snip echoes. The two loose ends start to fray, strand by strand, and the enemy has eight seconds to win something, or fall.

- **Style:** Tether into execute timer
- **Cast:** She draws the shears, and they grow to full size in her hands (scale up 1.8x). She finds one enemy's life-thread and cuts it.
- **Strike object:** A single glowing red life-thread rising from the target's head into the sky, and the colossal gold shears closing on it.
- **Flight:** She points the shears; a red thread rises from the target's head, visible to everyone. She snips it, and the cut thread starts fraying, unravelling upward as a countdown. Sound: an enormous metallic snip, then the ticking creak of a thread fraying.
- **Impact:** A fraying red thread floats over the target's head, unravelling strand by strand for 8 s.
- **Target reaction:** The target hears a heartbeat and sees the frayed thread over their own head. When it runs out, they fall, unless they win first.
- **Numbers:** Range 10 m, 2.0x BA on the cut. Timer 8 s; each hit from Sena's team on the target shortens it by 0.25 s (minimum 4 s). At 0, the target falls (execute). The target is spared if, before the timer ends, they get a takedown or deal damage equal to 40% of their max HP to Sena's team. If Sena dies first, the target is spared. Tychon as a target rolls a die: on a 6, the timer is reversed onto Sena.
- **Telegraph:** The target sees the shears open over their head and a red thread rise for 0.6 s before the snip.
- **Team use:** The squad's job is to keep the target from winning first: peel, kite and protect Sena. If Wrenna is on the team, she gets a free Held Thread when Sena casts The Cut.
- **Charge:** Threads held: seconds of tether time on enemies and allies fill it. On her body, the threads on her fingers multiply from three to ten strands, and the gold shears at her belt glow brighter. HUD: a spool that winds full.
- **Counterplay:** The target can save themselves by winning first: get a takedown or deal 40% of their max HP to Sena's team. Kill Sena and the cut is undone. The 0.6 s shears-open warning lets the target break line of sight before the snip lands.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.6 s | UAL Sword_Idle | Draws the shears; they scale up; she raises them, blades open, toward the target. | A red thread rises from the target's head into the sky. | Shears prop scales 1.0 to 1.8 on the right hand bone. | A slow metallic scrape. |
| Action | 0.6-0.9 s | UAL Sword_Attack | Two-handed scissor-close, a sharp snap of the arms inward. | Gold flash at the blades; the thread is cut. | Shears close. | An enormous snip. |
| Impact | 0.9-8.9 s | UAL Idle_Loop (her own) | She returns to idle; the timer runs. | Frayed thread unravels over the target. | Shears scale back to 1.0. | Thread fraying creak; the target's heartbeat. |
| Recovery | 0.9-1.4 s | UAL Idle_Loop | Lowers the shears and tucks them back into her belt. | None. | Shears back to the belt. | Faint harp note. |

#### Body language

- **Locomotion:** A light, drifting walk with her arms slightly out from her sides so the threads don't tangle. The run is quick with her hands held close. Base: UAL Walk_Loop with an arm-out layer; Jog_Fwd_Loop.
- **Idle:** Winds a thread around a finger, looks at it closely, untangles two threads with great care. Base: UAL Idle_Loop with finger layers.
- **Hit reaction:** Her threads tangle and snap in a little burst; she flinches but never lets go. Base: UAL Hit_Chest.
- **Death:** She lowers her hands and every thread on her fingers goes slack and drifts away, except one gold thread, which pulls taut toward the sky. She fades along it. Base: UAL Death02.
- **Victory:** She ties a neat bow on a single thread and lets it go; it floats up out of sight. Base: UAL Interact.

#### Team combos

- **With Kallix:** Knot ties two enemies. Bellows ignites the thread and the fire travels to both.
- **With Wrenna Vael:** Knot ties two enemies; Sounding lands on one. The thread drags the other onto the rose. Casting The Cut gives Wrenna a free Held Thread.
- **With Jory Ashby:** Held Thread keeps an ally alive at 1 HP for 2.5 s. Jory's Running Late then rewinds them to their HP from 2 s earlier.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `sena_idle` | UAL Idle_Loop | custom pose layer | Thread winding and untangling. |
| `sena_walk` | UAL Walk_Loop | custom pose layer | Arms slightly out. |
| `sena_run` | UAL Jog_Fwd_Loop | reuse as-is | - |
| `sena_dodge` | UAL Roll | reuse as-is | - |
| `sena_basic_1` | UAL Spell_Simple_Shoot | retime | Wrist flick with spread fingers. |
| `sena_basic_2` | UAL Spell_Simple_Shoot | retime | Mirrored. |
| `sena_basic_3` | UAL Sword_Attack | custom pose layer | Two-handed scissor close with the shears. |
| `sena_skill_knot` | UAL Interact | custom pose layer | Two-hand knot. |
| `sena_skill_held_thread` | UAL Spell_Simple_Shoot | custom pose layer | Pinch-and-wind. |
| `sena_super_the_cut` | UAL Sword_Idle / Sword_Attack | custom pose layer | See beats. |
| `sena_hit` | UAL Hit_Chest | reuse as-is | - |
| `sena_death` | UAL Death02 | reuse as-is | - |
| `sena_victory` | UAL Interact | reuse as-is | - |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `sena_thread` | tether ribbon (verlet) | Fine red thread, 6 segments, with a glowing knot tip. |
| `sena_wrist_loop` | status overlay | Red thread loop on the victim's wrist bone. |
| `sena_shears` | prop mesh | Giant gold shears; scales up 1.8x for the super. |
| `sena_snip_spark` | ribbon + sprite | Gold spark running down a cut thread; curl-and-fall thread ends. |
| `sena_knot` | tether ribbon + sprite | Thick double red thread with a big knot sprite at the midpoint. |
| `sena_life_thread` | tether ribbon | White-gold life-thread from an ally's head to her finger, humming shimmer. |
| `sena_finger_threads` | attached ribbons | Faint threads from her finger bones, up to 10 strands. |
| `sena_fate_thread` | spawned ribbon | Red thread rising from the target's head into the sky; unravels strand by strand as a timer. |

---

### Jory Ashby, Death's Understudy

**Class:** Support: cleanser and reviver / Damage: executioner  
**Basic style:** Boomerang / return  
**Team job:** Death's stand-in on your side: he hands out second lives, rewinds allies out of a bad two seconds, and for a few seconds can stop anyone on his team from dying.  
**Palette:** coat black `#1E1E22`, bone `#E8E0C8`, hourglass brass `#C9A13B`, sand gold `#E6C27A`, soul blue `#9FD3F0`, skin `#E3B79A`, key iron `#6E6E70`, eye ice `#AEE3F5`

#### Basic attack chain

##### Hit 1: Keyring Toss (Boomerang / return)

- **Cast:** He unhooks Death's great iron keyring from his belt and spins it on one finger, then flings it sidearm like a discus. Base: UAL OVERHAND_THROW sidearm, with a finger-spin layer for 0.15 s.
- **Projectile / strike object:** Death's keyring: a heavy iron ring with five bone-handled keys, spinning flat like a saw blade.
- **Flight:** Out straight to 8 m at 18 m/s, then curves back to his hand at 20 m/s. A ghostly soul-blue trail with faint key silhouettes follows it. Sound: keys jangling, then a cold whistle.
- **Impact:** A soul-blue spark burst on each hit and a jangle.
- **Target reaction:** A clip across the body, staggering the target; for a moment a ghostly key turns in a keyhole over their chest.
- **Numbers:** Range 8 m, 0.7x BA out and 0.7x BA back (1.4x BA if both hit), 0.95 attacks/s.
- **Telegraph:** None.
- **Team use:** Return hits catch divers chasing allies.

##### Hit 2: Keyring Toss (Boomerang / return)

- **Cast:** Same with the other hand, with a hop.
- **Projectile / strike object:** Same.
- **Flight:** Same.
- **Impact:** Same.
- **Target reaction:** Same.
- **Numbers:** Same as hit 1.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Late Notice (Boomerang / return (delayed))

- **Cast:** He throws the keyring hard and then checks a pocket watch-like hourglass on his chest, tapping it as if he's late. Base: OVERHAND_THROW into Idle_Loop with a chest-tap layer.
- **Projectile / strike object:** The keyring, glowing hourglass gold.
- **Flight:** It flies out to 9 m and hangs at the apex, spinning in place for 0.6 s while a little trickle of sand pours from it, then rockets back at 26 m/s. Sound: a ticking clock, then a whoosh.
- **Impact:** Sand bursts on each hit; a small hourglass-shaped decal, 1 s.
- **Target reaction:** Victims stagger. On a target below 30% HP, the hit lands Early: a soul-blue flash and a skull glyph over their head for 0.5 s.
- **Numbers:** Range 9 m, 0.8x BA out, hover 0.6 s (0.4x BA per 0.2 s to enemies under it), 1.0x BA return. Targets below 30% HP take 1.5x on the return.
- **Telegraph:** Enemies see a gold hourglass marker where the ring hangs.
- **Team use:** The hover zones a chokepoint; the return finishes stragglers.

#### Skills

##### Spare Hourglass (Ally-targeted buff (second life))

- **Cast:** He pops one of the two hourglasses off the bone toggles on his chest and tosses it underhand to an ally. Base: UAL OVERHAND_THROW retimed to a gentle underhand toss.
- **Projectile / strike object:** A small brass hourglass with gold sand, spinning gently in the air, trailing sand grains.
- **Flight:** A soft homing arc to the ally at 14 m/s. Sound: a soft chime and running sand.
- **Impact:** The hourglass settles above the ally's head and orbits it slowly.
- **Target reaction:** The ally sees a small hourglass orbiting their head. If they would die, it flips: they freeze for 1 s in a column of reversing sand (the sand flows up), then stand back up at 30% HP.
- **Numbers:** Range 10 m, lasts 12 s on the ally. Revives once at 30% HP after 1 s. Jory carries 2 hourglasses; each recharges in 30 s. One per ally at a time.
- **Telegraph:** Allies see a gold hourglass; enemies see it with a grey rim, so they know the target has a second life.
- **Team use:** A second life for the diver going in, or the carry who's about to be focused.

##### Running Late (Aura (time rewind and cleanse))

- **Cast:** He grabs both hourglasses on his chest and flips them upside down at once. Base: UAL Interact with a two-handed flip layer at the chest.
- **Projectile / strike object:** A sphere of reversing sand: gold grains flowing backward toward their source, and ghostly afterimages of each ally where they were 2 s ago.
- **Flight:** Instant around him, radius 5 m. Each ally in it is pulled back along a ghostly trail to their position from 2 s ago over 0.3 s. Sound: a reversed whoosh and a clock ticking backward.
- **Impact:** A gold sand ring decal under him, 1 s.
- **Target reaction:** Allies see their own afterimage and slide back into it, while debuffs fall off them like sand. Their HP snaps back to what it was 2 s ago if that was higher.
- **Numbers:** Radius 5 m. Allies return to their position and HP from 2 s ago (if HP was higher), and every debuff applied in the last 2 s is removed. Cooldown 18 s.
- **Telegraph:** Allies see a soft gold ring; enemies see nothing harmful.
- **Team use:** Undo a combo: if the enemy just landed a burst on the squad, rewind it.

#### Passive: Never On Time

Enemies below 20% HP within 10 m are Due: a ghostly appointment card hangs over them. Jory deals +25% damage to Due targets, and if one dies to Jory's team, one hourglass recharges 10 s faster.

*Visual tell:* The empty eye sockets of the skull on his head glow soul blue when someone nearby is Due.

#### Super: Covering Shift

> Jory reaches up and pulls the skull down from the top of his head over his own face. His coat starts to smoke at the hem. Camera pushes in on the empty eye sockets as they light up soul blue. A bell tolls once and time stops around him: sand hangs in the air, a clock face appears on the ground and its hands start to tick backward. Inside it, for seven seconds, nobody on his team can die. He's Death's understudy, and he's getting good at the job.

- **Style:** Ground zone (no-death zone)
- **Cast:** Jory pulls the skull down from the top of his head over his face like a mask. His coat smokes. For the next few seconds, he is Death, and nobody on his team dies on his shift.
- **Strike object:** A 12 m zone of stopped time: a dome of hanging sand grains frozen mid-air, soul-blue lanterns hanging in it, and clock-face rings on the ground.
- **Flight:** The zone rises from his feet over 0.5 s as a dome of drifting gold sand, then hangs for 7 s. Clock hands on the ground decal sweep backward. Sound: a single deep bell toll, then a slow ticking that never advances.
- **Impact:** A 12 m clock-face decal on the ground, ticking backward. Frozen sand grains hang in the air.
- **Target reaction:** Allies inside see a pale blue rim around their HP bar: they can't drop below 1 HP. Enemies who die inside fall into a puddle of sand: Late.
- **Numbers:** Radius 12 m (fixed where cast), lasts 7 s. Allies inside cannot die. Enemies who die inside take +5 s to respawn. Jory himself is NOT protected. If Jory dies, the zone ends.
- **Telegraph:** Enemies see a red-rimmed clock-face zone rising for 0.5 s.
- **Team use:** A full-team invulnerability window for an all-in. Combine with Hespera's sun or Wrenna's flood and fight with impunity.
- **Charge:** Appointments kept: revives, cleanses and takedowns on Due enemies fill it. On his body, the two hourglasses on his chest fill with glowing gold sand, and the skull's eye sockets glow brighter. HUD: an hourglass that fills from the bottom.
- **Counterplay:** Kill Jory: he isn't protected by his own zone, and the zone ends when he dies. Knock or pull allies out of the 12 m area. Or retreat and wait out 7 s. The zone is fixed where it's cast.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.5 s | UAL Interact | Reaches up with both hands and pulls the skull down over his face. | Coat hem smokes; sand starts to rise. | Skull prop moves from the top of the head bone to the face (local offset change). | A bone scrape; a single deep bell. |
| Action | 0.5-1.0 s | UAL Spell_Simple_Enter | Arms open at his sides, palms down. | Sand dome rises to 12 m; clock-face decal. | None. | Ticking slows, then stops. |
| Impact | 1.0-8.0 s | UAL Spell_Simple_Idle_Loop | Holds the pose (he can cancel to act). | Frozen sand; blue HP rims on allies; sand puddles on enemies who die. | None. | Backward ticking. |
| Recovery | 8.0-8.5 s | UAL Interact reversed | Pushes the skull back up onto his head and exhales. | Sand falls all at once. | Skull back to the top of the head. | A heavy sigh. |

#### Body language

- **Locomotion:** A slightly hurried apprentice's walk, always checking the hourglasses on his chest. The run is gangly with the coat flapping. Base: UAL Walk_Loop with a chest-check layer; Jog_Fwd_Loop.
- **Idle:** Checks the keys on his ring, mutters a list of names, looks up toward the stands as if someone is watching him. Base: UAL Idle_Talking_Loop.
- **Hit reaction:** His skull cap knocks askew and he straightens it, embarrassed. Base: UAL Hit_Head.
- **Death:** He falls, his keyring skids away, and his hourglasses crack, sand pouring out onto the ground. A pale hand from offscreen (Death, watching) waves him back. Base: UAL Death02.
- **Victory:** He tips the skull at the camera like a hat, then checks a name off on a long list. Base: UAL WAVE into Idle_Talking_Loop.

#### Team combos

- **With Brother Mott:** Spare Hourglass revives an ally. Mott's memorial candle for them stays lit 5 s after the revive for bonus shield regen.
- **With Madame Ysolt Crane:** Jory on Ysolt's team. Foreclosure executes enemies below 15% HP.
- **With Hespera:** Covering Shift makes the squad unkillable for 7 s. Hespera drops the sun at point-blank range on a fight her team can't lose.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `jory_idle` | UAL Idle_Talking_Loop | custom pose layer | Key check; muttered list; look to the stands. |
| `jory_walk` | UAL Walk_Loop | custom pose layer | Chest-check layer. |
| `jory_run` | UAL Jog_Fwd_Loop | reuse as-is | - |
| `jory_dodge` | UAL Roll | reuse as-is | Sand puff. |
| `jory_basic_1` | UAL OVERHAND_THROW | custom pose layer | Sidearm, finger-spin windup. |
| `jory_basic_2` | UAL OVERHAND_THROW | custom pose layer | Mirrored with a hop. |
| `jory_basic_3` | UAL OVERHAND_THROW + Idle_Loop | custom pose layer | Throw, then chest tap. |
| `jory_skill_spare_hourglass` | UAL OVERHAND_THROW | retime | Gentle underhand. |
| `jory_skill_running_late` | UAL Interact | custom pose layer | Two-handed hourglass flip at the chest. |
| `jory_super_covering_shift` | UAL Interact / Spell_Simple_Enter / Spell_Simple_Idle_Loop | custom pose layer | See beats. |
| `jory_hit` | UAL Hit_Head | reuse as-is | - |
| `jory_death` | UAL Death02 | reuse as-is | - |
| `jory_victory` | UAL WAVE + Idle_Talking_Loop | custom pose layer | Skull tip. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `jory_keyring` | projectile mesh | Iron ring with five bone-handled keys; spins flat. |
| `jory_soul_trail` | ribbon trail | Soul-blue ribbon with faint key silhouettes. |
| `jory_keyhole` | status overlay | Ghostly key turning in a keyhole over the victim's chest. |
| `jory_sand_trickle` | particles | Gold sand trickle from the hovering ring. |
| `jory_hourglass` | projectile + orbit mesh | Small brass hourglass with gold sand; orbits an ally's head. |
| `jory_reverse_sand` | particles | Sand flowing upward in a column on revive. |
| `jory_afterimage` | ghost mesh | Translucent copy of each ally at their 2-second-old position. |
| `jory_due_card` | status overlay | Ghostly appointment card over Due enemies. |
| `jory_clock_decal` | decal | 12 m clock face with hands ticking backward. |
| `jory_sand_dome` | particles | Frozen sand grains hanging in a 12 m dome. Fallback: decal plus a light particle ring. |
| `jory_skull_eyes` | material | Soul-blue emissive in the skull's eye sockets. |

---

### The Sleeper, Beneath Saint Ennick

**Class:** Control: zones / Frontline: tank  
**Basic style:** Ground zone / puddle  
**Team job:** Turns the floor into sea: every swing leaves slowing water, it drags enemies into the deep end, and its super floods the whole arena for your squad.  
**Palette:** basalt `#1F2124`, wet stone `#33373B`, abyss teal `#2FB7A3`, drip teal `#3CD1BC`, barnacle bone `#DCD3C0`, coral rust `#9E4A3A`, bell bronze `#B08D3A`, net rope `#8F7A50`

#### Basic attack chain

##### Hit 1: Tide Palm (Ground zone / puddle)

- **Cast:** A slow, heavy open-palm slap down to the ground in front of it, as if testing the depth of water. The bell at its chest sways. Base: UAL Sword_Attack overhead, empty hand, retimed 20% slower, with the palm open.
- **Projectile / strike object:** Its basalt palm, and the seawater that wells up where it lands.
- **Flight:** A 3 m reach downward slap. Teal water spurts from between its fingers on contact. Sound: a wet stone slap and a deep, slow wave.
- **Impact:** A 2.5 m puddle of dark teal seawater appears (a ripple decal with a reflective water shader) and lasts 3 s.
- **Target reaction:** The target is knocked down to one knee for an instant and splashed; enemies standing in its water have their feet sink slightly (a wet-legs mask).
- **Numbers:** Range 3 m, puddle radius 2.5 m, puddle lasts 3 s and slows enemies 20%. 1.0x BA, 0.8 hits/s.
- **Telegraph:** Enemies see puddle edges with a red rim.
- **Team use:** Every puddle is slowing ground for the whole squad to fight on.

##### Hit 2: Undertow (Ground zone / puddle)

- **Cast:** The other palm, sweeping slightly sideways. Base: Sword_Attack mirrored, slowed.
- **Projectile / strike object:** Same palm and a sideways spray of water.
- **Flight:** Same.
- **Impact:** A second puddle. Where puddles overlap they darken into Deep Water.
- **Target reaction:** Enemies in Deep Water wade up to their thighs (a higher wet mask) and slow more.
- **Numbers:** Same as hit 1. Deep Water slows 35%.
- **Telegraph:** Red-rimmed Deep Water edges.
- **Team use:** Two quick hits build Deep Water on a chokepoint.

##### Hit 3: Sinking (Ground zone / puddle)

- **Cast:** Both palms press flat to the ground and it leans its weight into them; the ground sinks. Base: UAL Push_Loop retimed to a single 0.6 s push, angled down.
- **Projectile / strike object:** A whirlpool in the water: a swirling teal vortex decal with a dark centre.
- **Flight:** The vortex spins up in the nearest puddle over 0.3 s. Sound: a draining gurgle and a low groan.
- **Impact:** The puddle sinks (the decal darkens toward its centre) and enemies in it are pulled toward the middle.
- **Target reaction:** Enemies stumble toward the centre (pulled 1.5 m), water up to their waists.
- **Numbers:** Affects every puddle within 4 m, 1.6x BA to enemies in them, pull 1.5 m toward each puddle's centre.
- **Telegraph:** Swirl arrows on red-rimmed puddles for 0.3 s.
- **Team use:** Pulls enemies together for Wrenna, Hespera or Kallix.

#### Skills

##### Undertow Grip (Pull / hook)

- **Cast:** It reaches one hand down into a puddle and pulls up and back, like hauling a net. Base: UAL MELEE_HOOK slowed 20%.
- **Projectile / strike object:** A huge hand of seawater and seabed stone (a spawned mesh with a water shader and barnacles) that rises from the target puddle and grabs.
- **Flight:** The hand erupts from any puddle of the Sleeper's (range 10 m from the Sleeper) at 20 m/s, closes on one enemy, and drags them through the water to the deepest puddle nearby. Sound: a giant wave suck and a stone grind.
- **Impact:** The drag leaves a wake decal for 1 s.
- **Target reaction:** The victim is grabbed around the waist, dragged 5 m, and dunked: knocked down for 0.5 s with seaweed on them.
- **Numbers:** Range 10 m (must start in or target an enemy in a puddle), drag 5 m, 1.5x BA, knock-down 0.5 s. Cooldown 11 s.
- **Telegraph:** Enemies standing in its puddles see a red-rimmed shadow of a hand under them 0.3 s before.
- **Team use:** Drags a carry out of their backline, or drags a diver off your healer.

##### Drowse (Aura)

- **Cast:** It tilts its huge square head back and yawns slowly, eyes drooping. The bronze bell on its chest gives one dull toll. Base: UAL Idle_Loop with a head-back yawn layer held 0.8 s.
- **Projectile / strike object:** A slow, heavy ring of sound and sleepy blue-teal mist rolling out from the bell.
- **Flight:** A ring expanding to 6 m over 0.8 s, mist rolling along the ground. Sound: a deep muffled bell, then a yawn.
- **Impact:** Sleepy mist hangs on the ground for 2 s.
- **Target reaction:** Enemies become Drowsy: eyes heavy, heads nodding (a slow nod layer on the victim), slowed 30%. Still Drowsy after 2 s, they fall Asleep for 1 s (heads drop, Zzz-shaped bubbles of seawater rise).
- **Numbers:** Radius 6 m, Drowsy 2 s (slow 30%), then Asleep 1 s. Damage wakes a sleeping target. Cooldown 14 s.
- **Telegraph:** Enemies see a red-rimmed mist ring.
- **Team use:** Peel and setup: the squad has 2 s to choose whether to hit (no sleep) or wait (sleep).

#### Passive: Calm and Curious

The Sleeper regenerates 1% max HP per second while standing in its own water. Allies standing in its water get +10% damage reduction: the sea holds them.

*Visual tell:* Teal water drips faster from its mouth while it's in water, and the barnacles on its body slowly open like listening ears.

#### Super: The Floor Goes Into the Sea

> The Sleeper kneels and drives both fists into the arena floor, gripping it like the edge of a table. Camera pulls up and back. It leans back and pulls, and the whole arena groans and drops. Seawater pours in from every edge, rising past ankles, past knees, and under the surface everyone can see the rooftops and streets of a drowned city. Enemies wade, heavy and slow. The Sleeper's allies float. Somewhere under it all, a bell rings, and the Sleeper tilts its head to listen.

- **Style:** Ground zone (arena-wide flood)
- **Cast:** It plunges both fists into the floor, grips it, and pulls the arena down, slowly, the way it pulled Lirr down to sleep beside it.
- **Strike object:** A global sea: a water plane rising 0.4 m over the entire arena, with the drowned rooftops and streets of Lirr visible beneath its surface, and whirlpools spinning up under the weakest enemies.
- **Flight:** The arena floor drops (a camera shake and a slight downward camera move) while the water plane rises over 1.5 s from the edges inward. Every 2 s, a whirlpool spawns under the lowest-HP enemy. Sound: a deep groan of stone, a rising ocean roar, and far below, a bell.
- **Impact:** The flood lasts 8 s over the whole arena. Raised terrain (walls, steps, boulders) stays dry.
- **Target reaction:** Enemies wade up to the waist (a wet mask to the hips), lean into the water, and move heavily. Their dashes and leaps are blocked. Allies of the Sleeper float lightly on the surface with a soft sea-shield shimmer.
- **Numbers:** Whole arena, 8 s. Enemies: slowed 30%, can't dash or leap. Allies: not slowed, +15% damage reduction. The Sleeper moves 30% faster and regenerates 2% max HP/s. Whirlpools every 2 s under the lowest-HP enemy: 1.0x BA and a 2 m pull toward the centre. Hob's Saint Ennick's Last Note (if Hob is an enemy) ends the flood immediately.
- **Telegraph:** 1.5 s windup with the floor shaking and water rising from the arena edges; whirlpools show a red-rimmed spiral 1 s before they open.
- **Team use:** The whole match tilts toward the Sleeper's team for 8 s: they keep their mobility, the enemies lose theirs. Ione singing during the flood puts charmed enemies to sleep.
- **Charge:** Fathoms sunk: time its water has spent on the field and enemies slowed by it fill the super. On its body, the bronze bell on its chest glows and swings harder (a pendulum prop driven in code), and teal water pours from its mouth more and more. HUD: a bell icon that sinks into waves.
- **Counterplay:** Get to high ground: anything raised (Moss's walls, Camedown's steps, Pyrrhos's boulder, Corrin's orchard roots) stays dry and unslowed. Hob's super ends the flood instantly. The Sleeper is rooted for the 1.5 s windup and can be stunned to cancel it.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-1.5 s | UAL Fixing_Kneeling | Kneels and plunges both fists into the floor, then leans back, gripping. | Floor cracks around its fists; water seeps from the arena edges. | Bell prop swings hard. | Deep stone groan. |
| Action | 1.5-2.0 s | UAL Push_Loop reversed (pulling) | One massive backward pull. | Floor drops (camera move); water plane rises fast. | None. | Ocean roar. |
| Impact | 2.0-10.0 s | UAL Idle_Loop with a listening head tilt | Stands and listens, head tilted. | Global water plane with drowned Lirr beneath; whirlpools. | None. | Underwater ambience; a distant bell. |
| Recovery | 10.0-10.6 s | UAL Idle_Loop | It watches the water drain away, curious. | Water drains back to the edges. | None. | Draining gurgle. |

#### Body language

- **Locomotion:** A slow, heavy, rolling walk, like moving through water even on dry land. The run is a lumbering, purposeful trot. Base: UAL ZOMBIE_WALK_FWD retimed and straightened (less lurch); Jog_Fwd_Loop retimed 20% slower.
- **Idle:** Stands still with its head tilted, listening. Once in a while it taps the bell on its chest with one finger and waits. Base: UAL Idle_Loop with a head-tilt layer.
- **Hit reaction:** A deep thud like a hammer on a cliff; barnacles crack off and a spurt of seawater sprays. Base: UAL Hit_Chest slowed.
- **Death:** It sits down slowly, lies back, and sinks into a spreading pool of seawater until only the bell is left on the surface, ringing once. Base: UAL Death01 slowed, plus the dissolve.
- **Victory:** It sits cross-legged, closes its eyes, and sways slowly as if listening to a song. Base: UAL Sitting_Idle_Loop.

#### Team combos

- **With Ione:** Ione sings during the flood. Charmed enemies in the flood fall asleep, and the Sleeper's super gets 25% charge when Ione's super starts.
- **With Wrenna Vael:** The Sleeper floods the arena. Wrenna's Sounding in flooded ground deals +30%, because everything is Soaked.
- **With Aurvan:** Aurvan's Tidal Pull drags enemies over the Sleeper's puddles. The moon pulls the tide: puddles inside the pull turn into Deep Water at once, and Sinking drags the group into the middle.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `sleeper_idle` | UAL Idle_Loop | custom pose layer | Listening head tilt; bell tap. |
| `sleeper_walk` | UAL ZOMBIE_WALK_FWD | custom pose layer | Straightened spine, wading feel. |
| `sleeper_run` | UAL Jog_Fwd_Loop | retime | 20% slower. |
| `sleeper_dodge` | UAL Roll | retime | Slow, heavy. |
| `sleeper_basic_1` | UAL Sword_Attack | custom pose layer | Empty open palm, 20% slower. |
| `sleeper_basic_2` | UAL Sword_Attack | custom pose layer | Mirrored, slowed. |
| `sleeper_basic_3` | UAL Push_Loop | retime | Single 0.6 s downward push. |
| `sleeper_skill_undertow_grip` | UAL MELEE_HOOK | retime | 20% slower. |
| `sleeper_skill_drowse` | UAL Idle_Loop | custom pose layer | Head-back yawn, 0.8 s hold. |
| `sleeper_super_floor_into_sea` | UAL Fixing_Kneeling / Push_Loop / Idle_Loop | custom pose layer | See beats. |
| `sleeper_hit` | UAL Hit_Chest | retime | Slowed. |
| `sleeper_death` | UAL Death01 | retime | Slowed. |
| `sleeper_victory` | UAL Sitting_Idle_Loop | custom pose layer | Sway. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `sleeper_puddle` | decal | Dark teal water with a reflective ripple shader; a Deep Water variant where puddles overlap. |
| `sleeper_palm_spurt` | particles | Teal water spurts between its fingers. |
| `sleeper_whirlpool` | decal | Swirling teal vortex with a dark centre. |
| `sleeper_wet_legs` | status overlay | Height-masked wet shader to shins, thighs or waist depending on depth. |
| `sleeper_water_hand` | spawned mesh | Huge hand of water shader with stone knuckles and barnacles. |
| `sleeper_drowse_mist` | particles + ring | Sleepy blue-teal mist and a slow sound ring from the bell. |
| `sleeper_sleep_bubbles` | status overlay | Seawater bubbles rising from sleeping enemies. |
| `sleeper_bell_swing` | prop animation | Bronze bell prop on the chest bone, swinging as a code-driven pendulum. |
| `sleeper_global_water` | water plane | Arena-wide water plane with a scrolling normal map. Fallback: decal-only flooding with a blue tint. |
| `sleeper_drowned_lirr` | decal atlas | Rooftops and streets of Lirr visible beneath the water. |
| `sleeper_mouth_drips` | particles | Teal drips from the mouth, rate tied to charge. |

---

### The One Who Came Down, First Ascendant

**Class:** Specialist: terrain-shaper / Frontline: tank  
**Basic style:** Wall or terrain  
**Team job:** Builds marble stairs on the battlefield: high ground and safety for the squad, knock-ups for enemies, and a super that carries the whole team up the sky-stair and drops them wherever they choose.  
**Palette:** marble `#E8E6E1`, kintsugi gold `#D9A93A`, eye gold `#F2C14E`, tunic slate `#5E6266`, sash red `#A8322E`, sandal leather `#6B5A4A`, sky-stair white-blue `#DCEBFF`, void black `#111216`

#### Basic attack chain

##### Hit 1: Step (Wall or terrain)

- **Cast:** They lift an open palm, upturned, the way you offer someone a hand up the stairs. Base: UAL Spell_Simple_Shoot with the palm turned up and a slow upward lift.
- **Projectile / strike object:** A single marble stair-step (1.2 m wide, 0.4 m tall, gold kintsugi veins) that bursts up out of the ground under the target.
- **Flight:** Appears under the target at range after a 0.2 s ground crack; it rises in 0.1 s. Marble chips fly and a gold vein flashes. Sound: a stone grind and a single clear chime.
- **Impact:** The step stays as terrain for 3 s, then sinks with gold dust. A crack-ring decal around it.
- **Target reaction:** The target is popped up into a short knock-up (0.3 s) and lands awkwardly beside the step, with marble dust on them.
- **Numbers:** Range 7 m, 1.0x BA, knock-up 0.3 s, step lasts 3 s with 1.0x BA HP. 0.85 attacks/s.
- **Telegraph:** Enemies see a red-rimmed step outline under them for 0.2 s.
- **Team use:** Every step is terrain an ally can stand on for their passive bonus.

##### Hit 2: Second Step (Wall or terrain)

- **Cast:** The same gesture with the other hand. Base: Spell_Simple_Shoot mirrored.
- **Projectile / strike object:** A second step, placed adjacent to the last one if it still exists, so stairs form.
- **Flight:** Same.
- **Impact:** Same, joined to the previous step as a little stair.
- **Target reaction:** Same.
- **Numbers:** Same as hit 1.
- **Telegraph:** Same.
- **Team use:** Builds stairs for allies to stand on.

##### Hit 3: Flight of Stairs (Wall or terrain (line))

- **Cast:** Both palms lift together, then sweep forward as if inviting someone up. Base: UAL Spell_Simple_Enter into Spell_Simple_Shoot with both hands.
- **Projectile / strike object:** A flight of three marble steps erupting one after another in a line toward the target.
- **Flight:** Three steps rise in sequence along a 6 m line, 0.08 s apart. Sound: three chimes rising in pitch.
- **Impact:** The flight stays 3 s as a short staircase.
- **Target reaction:** Every enemy on the line is popped up 0.4 s.
- **Numbers:** Line 6 m by 1.2 m, 1.5x BA, knock-up 0.4 s, 3 steps lasting 3 s.
- **Telegraph:** Red-rimmed line of step outlines for 0.25 s.
- **Team use:** A line knock-up that sets up Oko's Lance or Lysandra's Chisel Split on the same line.

#### Skills

##### Stair to Nowhere (Wall or terrain)

- **Cast:** They sweep both arms up in a rising gesture, as though showing someone the way to the sky. Base: UAL Spell_Simple_Enter with both arms sweeping high.
- **Projectile / strike object:** A rising staircase of five marble steps, each higher than the last, ending in mid-air at 2 m.
- **Flight:** The steps rise along an 8 m line in 0.4 s, each one with a chime. Gold dust drifts from the top step. Sound: a rising scale of chimes.
- **Impact:** The staircase stays 6 s as solid terrain: a wall for enemies, a ramp for allies.
- **Target reaction:** Enemies hit by the rising steps are pushed aside 1.5 m. Allies who climb it see a gold rim of light at their feet: High Ground.
- **Numbers:** Line 8 m, 5 steps up to 2 m tall, lasts 6 s, each step 1.5x BA HP. Allies on it get +15% range, shots that pass over walls, and the passive bonus. Cooldown 14 s.
- **Telegraph:** Enemies see the stair as a red-rimmed wall.
- **Team use:** High ground for Oko, Wrenna and Hespera; a wall that splits the enemy team.

##### Come Back Down (Dash / leap strike)

- **Cast:** They crouch and spring straight up, out of the top of the screen, then come down feet-first on a target spot. Base: UAL NINJUMP_JUMP (up), then MELEE_JUMP_LAND (down).
- **Projectile / strike object:** Camedown themselves, falling like a statue from the sky, with a step forming beneath their feet as they land.
- **Flight:** Up and out of view in 0.3 s, untargetable for 0.4 s, then down onto the target point in 0.2 s. A white-blue streak of sky trails them. Sound: a whoosh up, silence, then a falling whistle and a marble crash.
- **Impact:** A landing step and a ring of cracked marble with gold seams (decal 3 s).
- **Target reaction:** Enemies in the landing ring are stunned 0.6 s, with gold cracks flickering over them.
- **Numbers:** Range 10 m, radius 3 m, 1.6x BA, stun 0.6 s, untargetable for 0.4 s. Cooldown 12 s.
- **Telegraph:** Enemies see a red-rimmed landing circle 0.4 s before the drop.
- **Team use:** An engage, or a fast way to drop next to an ally and body-block.

#### Passive: The Arena Steps

While standing on any of their own steps, Camedown can't drop below 1 HP. Allies standing on their steps take 20% less damage. Steps are destructible and short-lived, so knock Camedown off them or break them.

*Visual tell:* When Camedown stands on a step, the gold kintsugi cracks across their marble skin glow bright and the broken stair-crown on their head shines. Allies on steps see a thin gold line of light at their feet.

#### Super: The Top of the Stair

> Camedown lifts both hands, and the sky answers: a spiral of floating marble steps unrolls upward out of sight. Their allies are swept up it in a streak of white light. For half a second at the top, the camera sees what Camedown saw: a vast empty throne, and behind it, something shapeless that isn't a god. Then the whole squad comes back down, crashing onto the battlefield in a ring of marble steps, and every enemy under them is thrown into the air.

- **Style:** Wall or terrain (team lift and drop)
- **Cast:** They raise both hands and the sky-stair comes down to meet them: a spiral of floating marble steps rising out of sight. Their squad climbs it with them, and then, as they once wished, they all come back down.
- **Strike object:** A spiral staircase of floating marble steps (spawned instanced steps) rising from Camedown into the sky, then a ring of marble steps erupting where the team lands.
- **Flight:** The stair spirals up over 0.6 s. Allies within 10 m are lifted up it in a white-blue streak and leave the battlefield for 2 s (untargetable). Camedown chooses a landing point within 16 m. The whole team drops back down there. Sound: an ascending choir, a moment of eerie silence at the top with a faint whisper, then a crash of marble.
- **Impact:** A ring of marble steps erupts at the landing point (radius 5 m), staying 5 s.
- **Target reaction:** Allies at the top get a brief view: a 0.5 s camera cut shows an empty throne and a shapeless dark figure behind it, then they land in a gold flash with an Ascended shield. Enemies at the landing are thrown into the air (knock-up 1 s) with gold cracks over them.
- **Numbers:** Lift radius 10 m, up to 3 allies plus Camedown. Untargetable for 2 s. Landing radius 5 m within 16 m, 3.0x BA, knock-up 1 s. Landing allies get a 2.0x BA shield for 4 s. The landing ring of steps counts for Camedown's passive and the allies' 20% damage reduction for 5 s.
- **Telegraph:** Enemies see a red-rimmed ring of step outlines at the landing point for 1.5 s while the team is in the sky.
- **Team use:** A team-wide dive or a team-wide escape. If Oko is on the enemy team and in the landing zone, he isn't knocked up: he saw it coming.
- **Charge:** Steps climbed: seconds allies spend standing on Camedown's steps and steps created fill it. On their body, the broken stair-crown grows a glowing gold step for every 20%. HUD: a stair icon that fills step by step.
- **Counterplay:** The landing zone is shown 1.5 s in advance: scatter. Camedown's passive is off during the 2 s lift. Breaking the landing steps afterwards removes the team's damage reduction. Stuns during the 0.6 s raise cancel it.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.6 s | UAL Spell_Simple_Enter | Both arms rise slowly, palms up, head tilted back. | The spiral stair rises from their feet into the sky. | Instanced step meshes spiralling upward. | Ascending choir. |
| Action | 0.6-2.6 s | UAL NINJUMP_JUMP (up, cut off-screen) | Leap up the stair; off-screen 2 s. | Allies streak up; white-blue sky trail; a 0.5 s camera cut to the empty throne. | Throne and dark-figure set piece (a 2D matte card). | Silence, then a whisper. |
| Impact | 2.6-3.0 s | UAL MELEE_JUMP_LAND | Lands in a crouch, palm on the ground. | Gold flash; the ring of steps erupts; enemies knocked up. | Landing step ring. | Marble crash; chimes. |
| Recovery | 3.0-3.6 s | UAL Idle_Loop | Stands up and looks up at the sky for a moment. | Stair dissolves upward into light. | None. | Wind. |

#### Body language

- **Locomotion:** A calm, unhurried walk, each step placed deliberately as if climbing stairs that aren't there. The run is light and even. Base: UAL Walk_Loop with a slightly raised knee layer; Jog_Fwd_Loop.
- **Idle:** Looks up at the sky with a still face, touches the broken crown, then looks at their own hands and the gold cracks in them. Base: UAL Idle_Loop with head and hand layers.
- **Hit reaction:** A sharp crack sound and a new hairline crack appears and fills with gold in 0.3 s. Base: UAL Hit_Chest.
- **Death:** They kneel and their marble body cracks apart along every gold seam, falling into a pile of marble pieces held together by gold threads, then the gold dims. Base: UAL Death01, with a fracture dissolve.
- **Victory:** They sit on a single marble step, looking down at the arena as if from far above. Base: UAL Sitting_Idle_Loop.

#### Team combos

- **With Oko:** Stair to Nowhere gives Oko high ground. +15% range and beams that pass over walls.
- **With Wrenna Vael:** Camedown's steps are terrain. The Night Lirr Sank slams enemies into a stair for the wall-stun.
- **With Hespera:** Hespera starts Setting Down the Sun from the top of the stair, while the team is untargetable in the sky. The sun and the squad land together, onto enemies knocked up for 1 s who can't dodge the impact.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `camedown_idle` | UAL Idle_Loop | custom pose layer | Sky gaze; crown touch; hand look. |
| `camedown_walk` | UAL Walk_Loop | custom pose layer | Raised-knee stair step. |
| `camedown_run` | UAL Jog_Fwd_Loop | reuse as-is | - |
| `camedown_dodge` | UAL Roll | reuse as-is | Marble dust. |
| `camedown_basic_1` | UAL Spell_Simple_Shoot | custom pose layer | Upturned palm lifting. |
| `camedown_basic_2` | UAL Spell_Simple_Shoot | custom pose layer | Mirrored. |
| `camedown_basic_3` | UAL Spell_Simple_Enter + Spell_Simple_Shoot | custom pose layer | Both palms lift then sweep. |
| `camedown_skill_stair_to_nowhere` | UAL Spell_Simple_Enter | custom pose layer | Both arms sweeping high. |
| `camedown_skill_come_back_down` | UAL NINJUMP_JUMP + MELEE_JUMP_LAND | retime | Jump cut off-screen; fast landing. |
| `camedown_super_top_of_the_stair` | UAL Spell_Simple_Enter / NINJUMP_JUMP / MELEE_JUMP_LAND | custom pose layer | See beats. |
| `camedown_hit` | UAL Hit_Chest | reuse as-is | - |
| `camedown_death` | UAL Death01 | reuse as-is | Fracture dissolve. |
| `camedown_victory` | UAL Sitting_Idle_Loop | reuse as-is | Seated on a step prop. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `camedown_step` | spawned mesh | 1.2 by 0.4 m marble step with gold kintsugi veins; rises in 0.1 s; sinks in gold dust. |
| `camedown_step_crack` | decal | Crack ring with gold seams. |
| `camedown_marble_chips` | particles | White marble chips with gold sparkle. |
| `camedown_stair` | spawned mesh set | Five ascending steps up to 2 m, solid collider. |
| `camedown_high_ground` | status overlay | Thin gold light line at allies' feet on steps. |
| `camedown_sky_streak` | ribbon trail | White-blue streak of sky behind leaps and lifts. |
| `camedown_landing_ring` | decal | Cracked marble ring with gold seams, 3 m or 5 m. |
| `camedown_spiral_stair` | instanced meshes | Spiral of floating steps rising out of view. Fallback: 8 steps plus a light column. |
| `camedown_throne_card` | matte card | 0.5 s cutaway image: empty throne with a shapeless dark figure. |
| `camedown_kintsugi_glow` | material | Emissive gold on the skin cracks; brightens on steps. |
| `camedown_crown_steps` | material mask | The stair-crown grows a lit step per 20% charge. |

---

## Divine

### Vell, God of Lost Things

**Class:** Specialist: trapper / Control: displacement (banish)  
**Basic style:** Homing  
**Team job:** Takes enemies out of the fight for a while: his traps put them in his coat, and he gives back the cooldowns and health your squad has lost.  
**Palette:** coat dust blue `#4D5A6B`, patch umber `#7A5238`, waistcoat moss `#6E6A45`, tag paper `#E9DFC4`, loupe brass `#C9A13B`, halo gold `#F4D06F`, lost-thing lilac `#B9A7D9`, beard white `#EDEBE6`

#### Basic attack chain

##### Hit 1: Something You Dropped (Homing)

- **Cast:** He pats his coat, digs a hand into one of the patch pockets at his hip (it goes in up to the elbow: the arm sinks behind a pocket-mouth decal), pulls out whatever comes, squints at it through the loupe, and tosses it underhand. Base: UAL PickUp_Table (reach-in frames) into OVERHAND_THROW retimed to a lazy underhand.
- **Projectile / strike object:** A random lost object, different every throw from a pool of 12 small meshes: a brass key, a single knitted glove, a closed black umbrella, a pocket watch, a child's shoe, a spoon, a love letter, a marble, a hairpin, one earring, a teacup, a tin soldier. Each has a cream luggage tag tied to it with string.
- **Flight:** Slow homing at 13 m/s with a lazy curving path, as if the object were finding its own way home. It tumbles end over end and its luggage tag flutters behind on a short ribbon. A faint lilac trail of dust motes follows it. Sound: the rustle of a coat pocket, then a soft chime like a shop doorbell on arrival.
- **Impact:** The object bonks off the target and drops to the ground, where it sits for 1 s with a lilac glint, then fades. A tiny lost-and-found tag decal is left for 1 s.
- **Target reaction:** The target flinches and looks puzzled, patting their own pockets (a short pat-down layer on the victim's arms). A small lilac question mark pops over their head.
- **Numbers:** Range 9 m, homing turn rate 180 degrees/s, 1.0x BA, 0.9 attacks/s. Each hit adds 1 Mislaid stack (max 3, lasts 5 s).
- **Telegraph:** None (homing).
- **Team use:** Mislaid stacks are what Vell's traps and super feed on. Focus one enemy and he can lose them.

##### Hit 2: Something Else You Dropped (Homing)

- **Cast:** Same reach-in with the other hand, into a different pocket (a pocket inside a pocket: the hand goes in twice). Base: mirrored.
- **Projectile / strike object:** Another random object from the pool.
- **Flight:** Same.
- **Impact:** Same.
- **Target reaction:** Same.
- **Numbers:** Same as hit 1.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Unclaimed Umbrella (Homing)

- **Cast:** He pulls out the black umbrella that always sticks out of his right pocket, snaps it open with a whump, and flings it spinning. Base: UAL OVERHAND_THROW with a 0.2 s open-umbrella hold layer.
- **Projectile / strike object:** The open black umbrella, spinning like a parasol-shaped top, with a dozen smaller lost things raining from under its canopy (buttons, coins, a thimble).
- **Flight:** Homing at 11 m/s, spinning; the small objects fall from under it in a 1 m ring along its path. Sound: an umbrella whump, and a little patter of trinkets landing.
- **Impact:** It lands on the target point and drops the rest of its trinkets in a 2 m circle; they lie on the ground 1.5 s as a cluttered decal.
- **Target reaction:** Enemies hit are struck by falling trinkets, stumble over them and are slowed 25% for 1.5 s. Each takes 1 Mislaid stack.
- **Numbers:** Range 9 m, radius 2 m, 1.4x BA, slow 25% for 1.5 s. +1 Mislaid to each enemy hit.
- **Telegraph:** Red-rimmed circle where it will land, 0.3 s.
- **Team use:** Spreads Mislaid across a group to set up the super.

#### Skills

##### Lost and Found (Trap / mine)

- **Cast:** He takes a brass Lost and Found tag off his lapel, licks his thumb, writes a mark on it, and drops it flat on the ground at his feet or flicks it up to 8 m away. Base: UAL PickUp_Table reversed (placing down) or OVERHAND_THROW for the flick.
- **Projectile / strike object:** A brass luggage tag lying flat on the ground (hard to spot: a 0.4 m decal with a faint lilac shimmer), connected by a thin dotted string to a second tag that Vell keeps pinned to his own coat.
- **Flight:** Flicked tags spin through the air in a short arc at 12 m/s. Once placed, the tag goes semi-transparent to enemies after 1 s (25% opacity). Sound: a tiny brass clink.
- **Impact:** When an enemy steps on it, a coat-pocket mouth (a dark lilac-lined ellipse decal) opens in the ground and swallows them.
- **Target reaction:** The victim is Misplaced: they drop into the pocket-mouth (a 0.25 s sink) and are gone from the arena for 1.5 s (untargetable, can't act). Then they are spat out at the spot where Vell is standing, landing in a heap (knocked down 0.4 s), patting their pockets. If they had 3 Mislaid stacks, they stay lost for 2.5 s instead.
- **Numbers:** Placement range 8 m, up to 3 tags, each lasts 20 s. Misplaced 1.5 s (2.5 s at 3 Mislaid), 1.0x BA on return, knock-down 0.4 s. Cooldown 10 s per tag, 3 charges.
- **Telegraph:** Enemies see a faint tag with a red rim only within 3 m. Allies always see tags in lilac with a white outline.
- **Team use:** Put tags on the enemy's flank route: the diver who steps on one is delivered right into your squad 1.5 s later, lying on the ground.

##### Lost Property Office (Ally-targeted buff (aura))

- **Cast:** He sets a small brass counter-bell down (prop), rings it with his palm, and opens his coat wide with both hands like a shopkeeper showing his stock. Base: UAL Interact into Spell_Simple_Enter with both hands holding the coat lapels open.
- **Projectile / strike object:** A burst of labelled lost things flying out of his coat to the allies who lost them: small glowing items with luggage tags, each one shaped like what was lost (an hourglass for cooldown, a heart-shaped locket for health, a boot for speed).
- **Flight:** Each item homes to an ally within 7 m at 16 m/s and pops into them with a lilac sparkle. Sound: a counter-bell ding, then a cascade of pocket rustles and little chimes.
- **Impact:** A ring of luggage tags on the ground around Vell for 1 s.
- **Target reaction:** Each ally sees a small tagged item pop into their chest. They get back what they lost: 40% of the HP they lost in the last 4 s, and 2 s off every active cooldown. If an ally is suffering a slow or silence, it is lost too (cleansed) and appears in Vell's coat as a tagged item.
- **Numbers:** Radius 7 m. Allies: restore 40% of HP lost in the last 4 s, -2 s on all cooldowns, cleanse one slow or silence. Cooldown 22 s. If Corrin is in range for the first time this match, Vell gives back his wife's name and Corrin's super is filled instantly.
- **Telegraph:** Allies see a lilac ring with white tags. Enemies see nothing harmful.
- **Team use:** A post-fight reset: after the burst lands, Vell gives the squad back its losses.

#### Passive: Pockets Within Pockets

Every enemy takedown and every Misplace hides a trinket in Vell's coat. Each trinket gives +2% damage reduction (max 10). Every 4 trinkets, his next basic throw pulls out something big and strange from the pool of rare objects (a lost church bell, an anchor, a city gate key) for 2.0x BA.

*Visual tell:* His coat visibly bulges more with every trinket (a blendshape-free swap: three coat mesh variants with fuller pockets, plus extra luggage tags spawning on the coat as props). The halo above his head tilts and wobbles when a rare object is ready.

#### Super: Lost Without Trace

> Vell grabs his lapels and, with a grunt, pulls his whole coat inside out. Camera dips toward the lining: hundreds of pockets, each one opening like a mouth. The storm begins: keys, gloves, umbrellas, love letters and teacups whirl around him, and the enemies nearest him drop through the floor into pockets and are gone. For a few seconds the arena is very quiet. Then Vell's allies point at the ground, and the lost come back out one by one, in a heap, patting their pockets, exactly where his squad wanted them.

- **Style:** Ground zone (mass banish) with a homing return
- **Cast:** Vell turns his coat inside out. Every pocket opens at once, and the whole fight around him falls into them.
- **Strike object:** A swirling vortex of pocket-mouths: dozens of lilac-lined coat pockets opening on the ground in a 9 m circle, and a storm of lost things (keys, gloves, umbrellas, letters, a small war in a bottle) whirling around him.
- **Flight:** The pockets open across the circle over 0.6 s. Every enemy inside with at least 1 Mislaid stack is pulled down into the nearest pocket. The rest are knocked back 3 m by the storm of objects. After the banish, lost enemies come back out one at a time, wherever Vell's allies tap on the ground (each ally gets one Return Here marker to place within 8 m of themselves). Sound: a huge rustle of fabric, a thousand tiny objects clattering, then a muffled silence like being inside a coat.
- **Impact:** The 9 m circle is covered in scattered lost objects for 3 s (a cluttered decal). Wherever a lost enemy is returned, a pocket-mouth opens and spits them out in a puff of lilac dust and lint.
- **Target reaction:** Lost enemies vanish for 3 to 5 s (3 s at 1 Mislaid, 4 s at 2, 5 s at 3), see a dark coat-lining vignette on their own screen with a lilac luggage tag reading their name, then return in a heap, knocked down for 0.6 s. Enemies without Mislaid are knocked back 3 m and slowed 30% for 2 s.
- **Numbers:** Radius 9 m. Banish duration 3-5 s by Mislaid stacks. Each lost enemy takes 2.0x BA when returned. Allies place up to 4 Return Here markers; any lost enemy not placed by an ally comes back at their original spot. Vell is rooted for 1.0 s while the coat is inside out, and takes 30% more damage during it.
- **Telegraph:** Enemies see a 0.6 s red-rimmed ring of pocket outlines opening; enemies with Mislaid stacks see a lilac tag icon above their own heads warning them.
- **Team use:** Turns a 4v4 into a 4v1 or 4v2 for up to 5 seconds, and lets the squad choose where each enemy reappears: in a Moss maze, on a Wrenna Sounding, in front of Oko's lance or under Hespera's sun.
- **Charge:** Things kept: every Mislaid stack applied and every Misplace fills it (100 points; Mislaid +3, Misplace +12, takedown +10). On his body, the coat bulges and luggage tags multiply on it; the halo above his head brightens from dull brass to bright gold. HUD: a coat icon whose pockets fill.
- **Counterplay:** Only enemies with Mislaid stacks are banished, so dodge his slow homing throws (they can be body-blocked by another enemy, or outrun by dashing). The 0.6 s pocket ring is a warning. Vell is rooted for 1.0 s and takes 30% more damage while the coat is inside out. Lost enemies return with a 1.0x BA shield (they had a long think), and if allies don't place markers they come back where they left.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.6 s | UAL Interact | Grabs both lapels and pulls the coat open and up over his shoulders. | Pocket outlines open in a 9 m circle; lilac light from inside the coat. | Coat swaps to an inside-out mesh variant at 0.4 s (lilac lining with many pocket decals). | A heavy fabric rustle; jangling. |
| Action | 0.6-1.6 s | UAL Spell_Simple_Idle_Loop | Arms held wide, coat billowing (vertex wind on the hem), slow turn on the spot. | Object storm whirling (instanced trinket meshes on a vortex); enemies sink into pockets. | 12 trinket meshes instanced along a vortex. | Clattering objects; muffled silence as each enemy vanishes. |
| Impact | 1.6-6.6 s | UAL Idle_Loop (he can act) | Pats his coat back into place, then gestures to allies. | Return Here markers appear for allies; pocket-mouths spit enemies out in lint puffs. | Coat back to normal mesh. | A shop doorbell chime for each return. |
| Recovery | 1.6-2.2 s | UAL Idle_Loop | Straightens the loupe and dusts off his sleeves. | Trinket clutter fades. | None. | A satisfied hum. |

#### Body language

- **Locomotion:** A shuffling old shopkeeper's walk, slightly bow-legged, hands in his pockets. The run is a hurried bustle with the coat flapping and trinkets jingling. Base: UAL Walk_Loop retimed 15% slower with a hands-in-pockets arm layer; Jog_Fwd_Loop.
- **Idle:** Pulls an object out of a pocket, inspects it through the loupe, reads its tag, nods, and puts it back in a different pocket. Base: UAL Idle_Loop with additive hand and head layers.
- **Hit reaction:** His halo clangs and wobbles, a few trinkets spill from his pockets, and he clutches his coat closed. Base: UAL Hit_Chest.
- **Death:** He sits down heavily and starts patting every pocket in a panic, then slowly fades from the feet up as if he has lost himself, leaving a single luggage tag on the ground with his name on it. Base: UAL Death01 truncated to the seated frame, then a dissolve.
- **Victory:** He takes the defeated enemy's lost thing (a glowing tag) and files it carefully in an inner pocket, then pats it. Base: UAL Interact.

#### Team combos

- **With Corrin Ashgraft:** Lost Property Office in range of Corrin. The first time each match, Vell gives back Corrin's wife's name and Corrin's Orchard super is filled at once.
- **With Moss:** Moss raises The Labyrinth Followed. Vell's allies place Return Here markers inside the maze's dead ends: the lost come back already trapped.
- **With The One Who Came Down:** Lost Without Trace removes the enemy frontline. Camedown's Top of the Stair drops the squad onto the enemy backline with nobody left to peel.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `vell_idle` | UAL Idle_Loop | custom pose layer | Pull out an object, inspect through the loupe, re-pocket. |
| `vell_walk` | UAL Walk_Loop | custom pose layer | 15% slower, hands in pockets. |
| `vell_run` | UAL Jog_Fwd_Loop | reuse as-is | Trinket jingle in audio. |
| `vell_dodge` | UAL Roll | retime | Slower; ends patting his pockets. |
| `vell_basic_1` | UAL PickUp_Table + OVERHAND_THROW | custom pose layer | Reach-in frames, loupe squint, underhand toss. |
| `vell_basic_2` | UAL PickUp_Table + OVERHAND_THROW | custom pose layer | Mirrored, double reach-in. |
| `vell_basic_3` | UAL OVERHAND_THROW | custom pose layer | 0.2 s open-umbrella hold. |
| `vell_skill_lost_and_found` | UAL PickUp_Table | retime | Reversed for placing; OVERHAND_THROW variant for the flick. |
| `vell_skill_lost_property_office` | UAL Interact + Spell_Simple_Enter | custom pose layer | Bell ring, then coat held open by the lapels. |
| `vell_super_lost_without_trace` | UAL Interact / Spell_Simple_Idle_Loop / Idle_Loop | custom pose layer | See beats. |
| `vell_hit` | UAL Hit_Chest | reuse as-is | - |
| `vell_death` | UAL Death01 | retime | Truncated at the seated frame; pocket-patting layer. |
| `vell_victory` | UAL Interact | reuse as-is | Tag filing. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `vell_trinket_pool` | projectile meshes | 12 small lost objects (key, glove, umbrella, watch, shoe, spoon, letter, marble, hairpin, earring, teacup, tin soldier), each 100-250 tris with a cream luggage tag. |
| `vell_tag_ribbon` | ribbon trail | Short fluttering string-and-tag ribbon plus faint lilac dust motes (#B9A7D9). |
| `vell_question_mark` | status overlay | Small lilac question mark over Mislaid enemies; 1-3 pips for stacks. |
| `vell_umbrella` | projectile mesh | Open black umbrella spinning flat, dropping trinkets in a ring. |
| `vell_clutter_decal` | decal | Scattered buttons, coins and keys on the ground; fades in 1.5 s. |
| `vell_tag_trap` | decal | Flat brass luggage tag with lilac shimmer; 25% opacity to enemies after 1 s, red rim within 3 m. |
| `vell_pocket_mouth` | decal + flipbook | Dark ellipse lined with lilac satin that opens and closes like a mouth, 6 frames. |
| `vell_lint_puff` | impact flipbook | Lilac dust and lint burst when someone is returned. |
| `vell_returned_items` | homing sprites | Glowing tagged items (hourglass, locket, boot) flying into allies. |
| `vell_coat_inside_out` | mesh variant | Lilac-lined coat with dozens of pocket decals. |
| `vell_object_storm` | instanced meshes | Trinkets whirling on a vortex path. Fallback: a sprite-sheet tornado of trinket silhouettes. |
| `vell_lost_vignette` | screen overlay (enemy only) | Dark coat-lining vignette with a luggage tag bearing the player's name. |
| `vell_halo` | attached prop | Thin gold ring on the head bone that wobbles; brightens with charge. |

---

### Hespera, Widow of the Sun

**Class:** Damage: artillery/mage / Control: zones  
**Basic style:** Charge-and-release  
**Team job:** The heaviest hitter on the field: she slings burning cinders, cages enemies in a ring of dusk, and can drop the dead sun anywhere on the map. Anything the squad holds still, she can hit.  
**Palette:** rust leather `#A3471E`, ember orange `#E0702A`, burnt skin `#B5653F`, chain iron `#2E2C2B`, sun gold `#D9A63A`, corona white `#FFF0C2`, dusk violet `#5B3A6E`, hood black `#1E1D1F`

#### Basic attack chain

##### Hit 1: Cinder Sling (Charge-and-release (tap))

- **Cast:** She unwinds a length of the iron chain from her waist with her right hand. A fist-sized cinder of the dead sun hangs from its end, and she whirls it once and lets go. Base: UAL OVERHAND_THROW with a one-loop sling windup layer.
- **Projectile / strike object:** A cinder broken off the dead sun: a black, cracked lump of rock glowing orange through its cracks, with a crust that flakes off as it flies.
- **Flight:** Low arc, 18 m/s, 9 m. It trails ash flakes and a thin ember ribbon. Sound: a chain whir, a release clink and a dull roar like a far-off fire.
- **Impact:** It cracks open on impact in a small orange burst, leaving a 1 m scorch decal for 1.5 s.
- **Target reaction:** The target recoils with an arm thrown up against the heat, and ash settles on their shoulders.
- **Numbers:** Range 9 m, splash 1 m, 1.0x BA, 0.9 attacks/s (tap).
- **Telegraph:** None (tap).
- **Team use:** Steady poke damage between charged throws.

##### Hit 2: Cinder Sling (Charge-and-release (tap))

- **Cast:** The same with the left hand, the chain looping behind her back. Base: mirrored.
- **Projectile / strike object:** Same cinder.
- **Flight:** Same.
- **Impact:** Same.
- **Target reaction:** Same.
- **Numbers:** Same as hit 1.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Charged Cinder Sling (Charge-and-release (hold 0.4-1.5 s))

- **Cast:** Hold: she plants her boots and swings the chain overhead in widening circles (the cinder grows from fist-size to head-size as it's fed), her braid whipping and her eyes glowing gold. Release: a full-body heave. Base: UAL Spell_Simple_Enter with an overhead circling arm layer (looped), then OVERHAND_THROW with a forward step.
- **Projectile / strike object:** A charged cinder that grows with the hold, its cracks widening until a molten core shows, ringed by a little solar corona.
- **Flight:** High arc, 14 m/s, range 9-14 m depending on charge, apex 3-5 m. It leaves a thick black smoke ribbon and drips burning slag along the path. Sound: the whir pitches up while charging, then a deep whoosh and a falling whistle.
- **Impact:** It shatters in a ring of molten slag and leaves a burning puddle decal (radius 1.5-3 m) for 2 s.
- **Target reaction:** Enemies are knocked down for 0.4 s at full charge, scorched (an ember crust overlay on the body) and Burning for 2 s.
- **Numbers:** Range 9-14 m, radius 1.5-3 m, damage 1.5x BA (0.4 s hold) to 3.0x BA (1.5 s), Burning 0.4x BA/s for 2 s, full charge knock-down 0.4 s.
- **Telegraph:** A red-rimmed landing circle that grows with the charge, visible to enemies from the start of the hold.
- **Team use:** Big damage that only lands on targets someone else is holding still: rooted, stunned, kneeling or dancing.

#### Skills

##### Dusk (Ground zone (ring wall))

- **Cast:** She lifts the sun-shaped pauldron on her left shoulder with her right hand and tips it toward the ground like shading a lamp. Base: UAL Spell_Simple_Shoot with the casting arm crossing her body to the left shoulder.
- **Projectile / strike object:** A ring of setting sunlight: a 1 m tall wall of violet-orange twilight flame forming a circle on the ground.
- **Flight:** The ring burns in from the outside edge over 0.4 s at the target point. Embers drift up from it and the inside dims to dusk. Sound: a long low sigh like evening wind, and a crackle.
- **Impact:** A scorched ring decal with a violet glow, lasting 4 s.
- **Target reaction:** Enemies who cross the ring take heavy burn damage and are slowed: violet-orange flames lick up their legs (flame flipbook on the feet). Enemies inside see the light dim around them (a violet tint on their own screen).
- **Numbers:** Range 10 m, radius 4 m, lasts 4 s. Crossing the ring: 1.5x BA and slow 40% for 1.5 s. Enemies inside take 15% more damage from Charged Cinder Sling. Cooldown 13 s.
- **Telegraph:** Enemies see the ring with a red rim as it burns in. Allies see it violet with a white outline.
- **Team use:** A cage, not a wall: enemies inside can leave but pay for it. Hob roots or Pyrrhos knock-backs keep them inside while Hespera throws.

##### Long Haul (Pull / hook)

- **Cast:** She flings the full length of her chain overhand and hauls it back hand over hand, the way she drags the sun across the sky. Base: UAL OVERHAND_THROW into MELEE_HOOK.
- **Projectile / strike object:** Her iron chain, with a heavy hook-ended shackle that glows sun-gold.
- **Flight:** Straight line at 26 m/s to 10 m, the chain paying out as a ribbon with heat shimmer. On hit it snaps taut. Sound: rattling chain, a clank, then a grunt and a drag.
- **Impact:** A drag mark of scorched ground along the path, 1 s.
- **Target reaction:** An enemy is hauled 5 m toward her, stumbling, with an ember shackle around the waist. An ally is hauled to her side and sees a gold shackle that breaks off as a 1.0x BA shield.
- **Numbers:** Range 10 m. Enemy: pull 5 m, 1.0x BA. Ally: pull to her side and a 1.0x BA shield for 3 s. Cooldown 12 s.
- **Telegraph:** Enemies see a red line flash 0.2 s before.
- **Team use:** Drag an enemy into the Dusk ring, or drag a squad mate out from under a dive.

#### Passive: Nobody Says Thank You

Hespera is Weary: her move speed is 5% lower than normal. When an ally uses the Thanks quick-chat on her, or when she saves an ally with Long Haul, she gets +10% damage for 8 s and 5% super charge (once per ally per 20 s). Every 60 s without thanks, her next Charged Cinder Sling charges 25% faster (she's angry).

*Visual tell:* Her eyes and the sun pauldron glow gold when she's been thanked, and the burns on her arms flare orange when she's angry. A tiny Thanks icon floats over her head when an ally thanks her.

#### Super: Setting Down the Sun

> Hespera unwinds the chain from her shoulder, wraps it twice around her fists and plants her boots. Camera cuts up the chain into the sky. Something enormous is hanging there: a dead sun, black and cracked, light leaking out of it. She hauls. It comes down slowly, its shadow spreading across the arena, and everyone underneath starts to run. Then it lands. A flash, a ring of fire, a second of silence. Hespera drops the chain and rolls her shoulders. For the first time in three hundred years, her hands are empty.

- **Style:** Lobbed arc (map-wide) into a ground zone
- **Cast:** She unwinds the whole chain from around her body, braces her boots and hauls, and something huge comes down out of the sky on the other end. She has carried it for three hundred years. Today she puts it down hard.
- **Strike object:** The dead sun: a 10 m sphere of black, cracked, cooling rock with molten light pouring out of its cracks and a weak, flickering corona. It falls on the end of a colossal ghostly chain that runs from Hespera's hands up into the sky.
- **Flight:** Hespera targets any point on the map. A sun-shaped shadow appears there and grows over 2.5 s while the sun descends slowly from the sky (a large mesh with a falling arc, its chain visible from Hespera). Sound: a deep grinding chain, wind rushing, then a muffled boom that drops all other sound for a second.
- **Impact:** It hits in a huge flash and shockwave. The ground at the impact is left as a molten crater (radius 7 m) that burns for 5 s and then cools to black rock, plus a 12 m scorch decal.
- **Target reaction:** Enemies at the centre are hurled up and outward (1.0 s knock-up), wreathed in ember crust and Burning. Enemies at the edge are pushed out 4 m and slowed. Allies inside the shadow see a gold outline: they take no damage from the impact itself and get a warm 1.5x BA shield from the sun's light.
- **Numbers:** Global range. Impact radius 10 m: 6.0x BA at the centre (inside 3 m), 3.0x BA at the edge. Knock-up 1.0 s at the centre, push 4 m at the edge. Molten crater 7 m for 5 s: 1.0x BA/s to enemies. Hespera is rooted during the 2.5 s haul and Unburdened for 6 s after: +30% move speed, but -30% damage.
- **Telegraph:** A 2.5 s growing red-rimmed sun shadow at the impact point, visible to everyone, and the chain itself is visible across the map, pointing back at Hespera.
- **Team use:** The squad's job is to keep enemies inside the shadow for 2.5 s: Hob's Cracked Bell, Moss's maze, Sena's Knot, Halven's Kneel, Thimble's Fairy Ring. If Aurvan casts his super within 5 s of hers, the sun and moon overlap into an Eclipse: the arena goes dark and the impact deals +30%.
- **Charge:** Hours carried: damage dealt with Charged Cinder Sling and Dusk fills it, and each ally's Thanks adds 5%. On her body, the sun pauldron on her shoulder brightens from tarnished gold to blazing white-gold, and the chain on her waist glows link by link. HUD: a sun icon that rises over a horizon.
- **Counterplay:** 2.5 s of warning with a huge shadow: leave the 10 m circle. Any stun on Hespera during the haul drops the sun early at 50% damage wherever it is in its fall. After it lands she is Unburdened (-30% damage) for 6 s, so punish her then. Allies can't use it from safety: Hespera must be alive and rooted the whole time.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.6 s | UAL Interact | Unwinds the chain from her body and wraps it around both fists, boots planted wide. | The chain glows; a ghostly chain rises from her hands into the sky. | Waist chain prop swaps to a hand-held chain prop. | Chain links clanking; a grim exhale. |
| Action | 0.6-3.1 s | UAL Push_Loop reversed (pulling) looped | Hand-over-hand hauling, leaning back hard, head down, with a heave every 0.6 s. | Sun mesh descends; shadow decal grows; ash falls. | Sun mesh (low-poly sphere with cracks emissive and a corona billboard). | Grinding chain, rushing wind. |
| Impact | 3.1-3.5 s | UAL Idle_Loop with a braced pose layer | Holds the brace as the impact lands far away. | Flash, shockwave ring, molten crater decal, knock-ups. | Ghost chain dissolves. | A muffled boom, then a second of silence. |
| Recovery | 3.5-4.3 s | UAL Idle_Loop | Drops the chain, rolls her shoulders and stretches her back. | Ember drift around her; pauldron dims. | Chain back to the waist. | A long, tired sigh. |

#### Body language

- **Locomotion:** A heavy, dragging stride, as if still pulling a load, one shoulder lower than the other. The run is a grim, powerful jog with the chain rattling. Base: UAL Walk_Loop retimed 10% slower with a leaning layer; Jog_Fwd_Loop.
- **Idle:** Rubs the chafed skin under the chain, rolls her neck, glares at the sky. Base: UAL Idle_Loop with hand and neck layers.
- **Hit reaction:** She grunts and barely moves; embers burst from her burns. Base: UAL Hit_Chest at 50% weight.
- **Death:** She drops to her knees, the chain slides off her and coils on the ground, and the sun pauldron dims to black. Then she lies down, almost gratefully. Base: UAL Death01 slowed.
- **Victory:** She sits on the ground with her back against nothing, closes her eyes and lets the sun pauldron cool. Then she says, flatly, You're welcome. Base: UAL Sitting_Idle_Loop.

#### Team combos

- **With Aurvan:** Both supers within 5 s of each other. Eclipse: the arena goes dark and the dead sun's impact deals +30%.
- **With Sir Halven:** The King's Last Message makes a group kneel for 1.2 s. A charged Charged Cinder Sling lands on enemies who can't move.
- **With Jory Ashby:** Covering Shift makes Hespera's squad unkillable for 7 s. She drops the sun at point-blank range on a fight her team can't lose.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `hespera_idle` | UAL Idle_Loop | custom pose layer | Chafe rub; neck roll; glare at the sky. |
| `hespera_walk` | UAL Walk_Loop | custom pose layer | 10% slower, dragging lean. |
| `hespera_run` | UAL Jog_Fwd_Loop | reuse as-is | - |
| `hespera_dodge` | UAL Roll | retime | Heavier landing. |
| `hespera_basic_1` | UAL OVERHAND_THROW | custom pose layer | One-loop sling windup. |
| `hespera_basic_2` | UAL OVERHAND_THROW | custom pose layer | Mirrored. |
| `hespera_basic_3_charge` | UAL Spell_Simple_Enter | custom pose layer | Looped overhead chain circling. |
| `hespera_basic_3_release` | UAL OVERHAND_THROW | retime | Full-body heave with a forward step. |
| `hespera_skill_dusk` | UAL Spell_Simple_Shoot | custom pose layer | Arm crosses to tip the pauldron. |
| `hespera_skill_long_haul` | UAL OVERHAND_THROW + MELEE_HOOK | custom pose layer | Throw then haul. |
| `hespera_super_setting_down_the_sun` | UAL Interact / Push_Loop / Idle_Loop | custom pose layer | See beats. |
| `hespera_hit` | UAL Hit_Chest | custom pose layer | 50% weight. |
| `hespera_death` | UAL Death01 | retime | Slowed. |
| `hespera_victory` | UAL Sitting_Idle_Loop | reuse as-is | - |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `hespera_cinder` | projectile mesh | Black cracked rock with an orange emissive crack mask; flaking crust particles. |
| `hespera_cinder_charged` | projectile mesh + billboard | Scales from 0.25 m to 0.6 m with the charge; molten core and a small corona billboard. |
| `hespera_ember_ribbon` | ribbon trail | Thin ember ribbon on taps; thick black smoke ribbon with slag drips on charged throws. |
| `hespera_slag_puddle` | decal | Molten slag puddle that cools from orange to black over 2 s. |
| `hespera_ember_crust` | status overlay | Ember crust shader on scorched victims. |
| `hespera_dusk_ring` | spawned mesh + decal | 1 m violet-orange flame ring (scrolling flame texture on a cylinder band); dims the interior. |
| `hespera_chain` | tether ribbon | Iron chain ribbon with heat shimmer and a glowing gold shackle end. |
| `hespera_dead_sun` | spawned mesh | 10 m cracked black sphere with emissive cracks and a flickering corona. Fallback: a large billboard sun and a shadow decal. |
| `hespera_sky_chain` | ribbon | Colossal ghost chain from her hands into the sky. |
| `hespera_sun_shadow` | decal | Growing circular shadow with a red rim, 2.5 s. |
| `hespera_impact` | flipbook + mesh ring | White flash, expanding shockwave ring, molten crater decal (7 m) cooling to black. |
| `hespera_pauldron_glow` | material | Emissive on the sun pauldron tied to super charge. |

---

### Old Kerberon, the Gate-Dog

**Class:** Specialist: summoner/pets / Frontline: tank  
**Basic style:** Pet / summon  
**Team job:** The gate-dog of the dead: he sets a pack of ghost hounds on whoever threatens the squad, guards a gate nobody gets through, and when all three heads wake, he becomes three fighters at once.  
**Palette:** fur black `#1A1A1C`, fur sheen `#3A3A40`, eye amber `#F29A1E`, tongue pink `#D9707A`, collar rust `#7A3B20`, key bronze `#9C6B35`, gate ash `#8C8780`, ghost-hound blue `#7FB8D9`, underworld ember `#C2451E`

#### Basic attack chain

##### Hit 1: Sic 'Em (Pet / summon)

- **Cast:** The awake middle head growls and he points a heavy paw at the target, then slaps his thigh like calling a dog. Base: UAL Spell_Simple_Shoot with a pointing paw, plus a thigh-slap hand layer on the other side.
- **Projectile / strike object:** A ghost hound: a wolf-sized spectral black dog (a separate low-poly spawned mesh, about 600 tris, with NO skeleton: its 6-frame run cycle is baked as a morph-target loop, and its smoky edges hide the frame steps) made of grey-blue smoke with amber ember eyes, born from the shadow at his feet.
- **Flight:** The hound springs from his shadow and bounds to the target at 14 m/s, leaving pawprints of grey ash that fade in 1 s and a ribbon of smoke from its tail. It bites once and dissolves. Sound: a deep growl, padding feet, a single bark on the bite.
- **Impact:** A snap of spectral jaws (a jaw-shaped flipbook closing) and a puff of grey ash. A small ash-pawprint decal under the target, 1 s.
- **Target reaction:** The target is shoved back half a step as the jaws close on its arm or leg, with grey ash teeth marks glowing on the limb for 1 s.
- **Numbers:** Range 8 m, 1.0x BA, 0.9 attacks/s. The hound can be body-blocked by any enemy in its path (it bites the first one).
- **Telegraph:** None (homing summon).
- **Team use:** Hounds target whoever Kerberon or a squad mate last pinged, so the squad can call the bite.

##### Hit 2: Sic 'Em (Pet / summon)

- **Cast:** The same with the other paw. Base: mirrored.
- **Projectile / strike object:** A second hound.
- **Flight:** Same.
- **Impact:** Same.
- **Target reaction:** Same.
- **Numbers:** Same as hit 1.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Gate-Dog's Lunge (Pet / summon (melee finisher))

- **Cast:** He drops onto all fours for a moment and lunges with the middle head leading, snapping (the whole head moves with the head and neck bones), while two ghost hounds lunge alongside him. Base: UAL SWORD_DASH retimed to 0.35 s with a low crouched body layer, empty paws.
- **Projectile / strike object:** Kerberon's own spectral jaws (a large jaw-shaped flipbook in front of his muzzle) and two ghost hounds flanking him.
- **Flight:** A 3 m lunge in 0.25 s; the hounds run at his sides and fan out 30 degrees. Grey ash sprays from his paws. Sound: a three-voice snarl (two voices are the ghost hounds), then a crunch.
- **Impact:** A burst of ash and a rust-coloured key-glint at each bite point.
- **Target reaction:** The main target is pinned for 0.4 s (the victim plays a short down-and-pinned hit reaction), with ghost jaws clamped on its shoulder.
- **Numbers:** Lunge 3 m, 1.5x BA to the main target, 0.6x BA per hound bite, pin 0.4 s.
- **Telegraph:** A 0.15 s crouch with his amber eyes flaring.
- **Team use:** The pin holds a target still for a skillshot.

#### Skills

##### Guard the Gate (Wall / terrain (gate))

- **Cast:** He takes one of the three great rusted keys from his collar and drives it into the ground in front of him, turning it like a lock. Base: UAL PickUp_Table reversed (setting down) blended with a two-handed key-turn wrist layer.
- **Projectile / strike object:** A ghostly iron gate of the underworld: two black iron gateposts with a pair of gates, 5 m wide, glowing blue at the hinges, rising out of the ground in a puff of ash.
- **Flight:** The gate rises in 0.3 s along a line perpendicular to his facing, 4 m in front of him. Sound: rusty hinges and a deep lock-clunk.
- **Impact:** The gate stands for 5 s. Its ground line shows an ash threshold decal.
- **Target reaction:** Enemies who try to cross the gate are stopped and knocked back 2 m (a shove reaction) and marked Turned Away: a ghostly hound head growls over them for 2 s (their damage to Kerberon's allies is reduced 20%). Allies pass through freely: they see the gates swing open for them.
- **Numbers:** Range 4 m in front, 5 m wide, lasts 5 s, 3.0x BA HP. Enemy crossing: knocked back 2 m, 0.8x BA. Turned Away: -20% damage dealt for 2 s. Cooldown 14 s.
- **Telegraph:** Enemies see the gate with a red rim. Allies see it with a soft blue outline and open gates.
- **Team use:** A one-way wall: the squad can retreat through it and attack through it, enemies can't follow.

##### Honey Cake (Ally-targeted buff (dash to ally))

- **Cast:** He sniffs the air, finds the ally who needs him, and bounds to them, landing on all fours in front of them, then rears up with his arms spread. Base: UAL NINJUMP_JUMP into MELEE_JUMP_LAND, then IDLE_SHIELD with arms spread.
- **Projectile / strike object:** Kerberon himself, with a trail of ghostly honey-gold light, and a single honey cake that he drops at the ally's feet (a small prop).
- **Flight:** Leap up to 10 m in 0.4 s toward an ally. Sound: a happy whuff, then a protective growl.
- **Impact:** A ring of ash pawprints around the ally; the honey cake sits on the ground for 6 s.
- **Target reaction:** Kerberon stands guard: he takes 50% of the damage aimed at that ally for 3 s (a blue tether from him to the ally). The ally sees a small honey cake icon; picking up the cake heals 1.0x BA. If the ally is Nyssa, the guard lasts 5 s and the cake heals 2.0x BA.
- **Numbers:** Leap 10 m to an ally, guard 3 s (5 s for Nyssa), redirect 50% of damage, cake heal 1.0x BA (2.0x BA for Nyssa). Cooldown 16 s.
- **Telegraph:** Allies see a golden honey-cake icon; enemies see a grey-rimmed tether.
- **Team use:** A bodyguard move for the squad's carry. The lore: he'd die for Nyssa, and he will.

#### Passive: One Head on Duty

Only the middle head is awake. Every time Kerberon or his hounds bite an enemy, or he blocks damage for an ally, one of the sleeping heads stirs (Stir meter, 0-100). At 50 the left head half-wakes: his hounds come in pairs (every basic sends 2 hounds at 60% damage each). At 100 the right head also stirs: Kerberon gets +20% damage reduction until he takes 3 hits. Then the meter drains.

*Visual tell:* The two side heads are part of the mesh and can't move on their own. Instead their eyes are a texture swap: shut, half-open (twitching via UV flicker) and open amber. Ash snores puff from their noses while asleep (a small particle emitter on each side muzzle). When stirring, their ears twitch via a vertex shader.

#### Super: All Three Awake

> Kerberon throws his head back and howls. Camera drops low, looking up at his shaggy shoulders. The two side heads, asleep all match, tongues lolling, twitch. Then their eyes open, amber and bright. Two huge ghostly dog heads rear up from them, and behind him the iron gate of the dead grinds open. For seven seconds, the old gate-dog has his brothers back. One breathes fire, one snaps and drags, the middle one leads the pack. Nobody gets past.

- **Style:** Transform / summon (three-head stance)
- **Cast:** He throws his middle head back and howls at the gate of the dead. One by one, the two side heads open their eyes for the first time in years, and the gate-dog is whole again for a little while.
- **Strike object:** Kerberon himself, wreathed in underworld ember, plus two huge spectral dog heads that rise from the sleeping side heads (large ghost-head meshes attached to the left and right shoulder bones, so they move with his torso, each the size of a person), and a great iron gate rising behind him.
- **Flight:** The side heads' eyes snap open (texture swap) and their spectral counterparts rear up from them, swelling to 3x size. For 7 s each head fights on its own: the left head breathes a cone of ghost-fire, the right head snaps at the nearest enemy with a lunging jaw flipbook every 1 s, and the middle head and body fight as normal. Sound: a three-voice howl in harmony, a heavy gate opening, then a running chorus of growls.
- **Impact:** A ring of ash and ember (radius 6 m) around him for the duration, and the gate of the dead behind him (a big spawned gate mesh) that stays 7 s.
- **Target reaction:** Enemies in the left head's cone are Burning with underworld fire (blue-orange flames on their body). Enemies snapped by the right head are dragged 2 m toward Kerberon. Enemies who die near him are dragged back to the gate (a short sink-into-ash effect) and respawn 5 s later.
- **Numbers:** Lasts 7 s. Left head: ghost-fire cone 5 m by 50 degrees, 0.8x BA/s and Burning. Right head: a bite every 1 s on the nearest enemy within 5 m, 1.2x BA and a 2 m pull. Body: +30% damage reduction and his hounds come 3 at a time. On cast he roars: 1.5x BA in 6 m and a 0.8 s fear. Enemies killed within 6 m respawn 5 s later.
- **Telegraph:** A 0.8 s howl windup, with a red-rimmed 6 m ring and his eyes and both side heads' eyes glowing.
- **Team use:** He becomes three fighters: a tank that pulls, burns and fears all at once. If Nyssa is on the team and casts Passage Paid, her ferry lands at his gate.
- **Charge:** Stirring: the Stir meter's overflow, bites and damage blocked for allies fill it. On his body, the side heads snore louder (bigger ash puffs), then their ears twitch, then their eyelids flicker. HUD: three small dog-head icons whose eyes open one by one.
- **Counterplay:** Kite him: his heads have short reach (5-6 m), and he's a slow mover during the 7 s. The left head's fire cone faces his left side, so circle to his right. Silence or a stun on cast cancels it before the side heads wake. Once it ends, the side heads fall asleep again and he's Groggy for 2 s (-20% move speed).

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.8 s | UAL Idle_Loop with a head-back howl pose layer | Head and neck thrown back, chest out, arms spread low. | Side heads' eye texture swaps to open; ember ring forms; red-rimmed 6 m ring. | Spectral head meshes spawn on the shoulder bones at 1x scale. | A three-voice howl. |
| Action | 0.8-1.2 s | UAL Punch_Cross into a roar pose | A forward roar, both paws raised. | Spectral heads swell to 3x; fear burst; the gate of the dead rises behind him. | Gate mesh spawned 2 m behind him. | Gate grinding; roar. |
| Impact | 1.2-8.2 s | UAL Jog_Fwd_Loop / Punch_Jab / Punch_Cross (normal kit) | His normal moves, with a hunched, heavier pose layer. | Ghost-fire cone from the left head, jaw flipbook from the right head every 1 s, hounds in threes. | Spectral heads follow the shoulder bones. | Chorus of growls. |
| Recovery | 8.2-9.0 s | UAL Idle_Loop with a slumped pose layer | Shoulders drop; he shakes like a wet dog. | Spectral heads shrink and fade; side heads' eyes close again; snore puffs return. | Spectral heads despawn; gate sinks. | A long yawn from two throats. |

#### Body language

- **Locomotion:** An upright, heavy, rolling walk like a big old dog walking on its hind legs, shoulders hunched. The run drops to all fours. Base: UAL Walk_Loop with a hunched layer and wider stance; for running, UAL Crouch_Fwd_Loop retimed fast with the arms reaching to the ground (four-legged lope).
- **Idle:** Scratches his collar, sniffs the air, turns his head toward a sound, and sometimes nudges a sleeping side head with his own cheek (a head-tilt layer). Base: UAL Idle_Loop with head and arm layers.
- **Hit reaction:** A grunt and a single bark; the side heads' snores catch. Base: UAL Hit_Chest.
- **Death:** He sinks onto his haunches, then lies down with his chin on his paws, and all three heads' eyes close. His keys slide off the collar and clink on the ground. Base: UAL Death02 into a lying pose.
- **Victory:** He sits like a good dog, tail thumping (tail is part of the mesh, swayed by a vertex shader), with a honey cake in his paw. Base: UAL Sitting_Idle_Loop.

#### Team combos

- **With Nyssa Obel:** Nyssa casts Passage Paid while All Three Awake is active (or any time he's within 30 m). The ferry lands at Kerberon's gate: the squad arrives in the middle of his three-headed rampage.
- **With Ourax:** Guard the Gate blocks the approach. Ourax's village militia rains arrows over the gate onto enemies who can't cross.
- **With Ophira:** Honey Cake: Kerberon guards a carry and soaks damage. Ophira's Polished Shield on Kerberon reflects the projectiles he absorbs back at their shooters.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `kerberon_idle` | UAL Idle_Loop | custom pose layer | Collar scratch; sniff; nudge a side head. |
| `kerberon_walk` | UAL Walk_Loop | custom pose layer | Hunched, wide stance. |
| `kerberon_run` | UAL Crouch_Fwd_Loop | retime | Fast, arms reaching to the ground for a four-legged lope. |
| `kerberon_dodge` | UAL Roll | retime | Heavy. |
| `kerberon_basic_1` | UAL Spell_Simple_Shoot | custom pose layer | Pointing paw plus thigh slap. |
| `kerberon_basic_2` | UAL Spell_Simple_Shoot | custom pose layer | Mirrored. |
| `kerberon_basic_3` | UAL SWORD_DASH | custom pose layer | 0.35 s, low crouch, head-first. |
| `kerberon_skill_guard_the_gate` | UAL PickUp_Table | custom pose layer | Reversed set-down plus a key-turn wrist layer. |
| `kerberon_skill_honey_cake` | UAL NINJUMP_JUMP + MELEE_JUMP_LAND + IDLE_SHIELD | custom pose layer | Bound to the ally, then rear up with arms spread. |
| `kerberon_super_all_three_awake` | UAL Idle_Loop / Punch_Cross | custom pose layer | Howl and roar; see beats. |
| `kerberon_hit` | UAL Hit_Chest | reuse as-is | - |
| `kerberon_death` | UAL Death02 | custom pose layer | Ends lying with chin on paws. |
| `kerberon_victory` | UAL Sitting_Idle_Loop | reuse as-is | - |
| `kerberon_hound_vfx_loop` | none (VFX pet, no rig) | custom pose layer | The ghost hound is a spawned VFX mesh with a baked 6-frame morph-target run loop and a bite flipbook, so no extra skeleton is needed. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `kerberon_ghost_hound` | spawned pet mesh | Wolf-sized smoky grey-blue dog with ember eyes and no rig, using a baked 6-frame morph-target run loop; 600 tris; dissolves in ash after one bite. Fallback: a running dog flipbook billboard. |
| `kerberon_ash_pawprints` | decal | Grey ash pawprints that fade in 1 s. |
| `kerberon_jaws` | flipbook | Spectral jaws closing, 6 frames, blue-grey with amber teeth glints. |
| `kerberon_teeth_marks` | status overlay | Glowing ash teeth marks on the victim's limb for 1 s. |
| `kerberon_gate` | spawned mesh | 5 m black iron gate pair with blue-glowing hinges; swings open for allies. |
| `kerberon_turned_away` | status overlay | Ghostly hound head growling above enemies for 2 s. |
| `kerberon_honey_cake` | pickup mesh | Small honey cake with a soft gold glow. |
| `kerberon_guard_tether` | tether ribbon | Blue tether from Kerberon to the guarded ally. |
| `kerberon_side_eyes` | texture swap | Three eye states for the side heads: shut, half-open flicker, open amber. |
| `kerberon_snore_puffs` | particles | Ash puffs from the side muzzles; size grows with charge. |
| `kerberon_spectral_heads` | attached meshes | Person-sized ghost dog heads on the shoulder bones for the super, with jaw flipbooks. |
| `kerberon_ghostfire` | particles | Blue-orange underworld fire cone from the left head. |

---

### Ophira, of the Glass

**Class:** Support: shielder / Control: stuns (gaze)  
**Basic style:** Bouncing / ricochet  
**Team job:** Turns her allies into mirrors: enemy shots bounce back off them, her glass shards ricochet off them, and her gaze stops anyone who runs straight at the squad.  
**Palette:** mirror silver `#C9CED1`, tarnished bronze `#9B6A3E`, verdigris glass `#3F6E5A`, snake green eye `#5BE36B`, deep green `#2E4A3C`, glass cyan `#9FE3E0`, crack black `#1C2422`, reflection white `#F4FBFF`

#### Basic attack chain

##### Hit 1: Glass Shard (Bouncing / ricochet)

- **Cast:** She flicks her right hand forward from the wrist, and a shard of silvered glass breaks off the cracked mirror-skin of her forearm (the crack mask on her forearm flashes where it left). Base: UAL Spell_Simple_Shoot retimed 15% faster, with a wrist-flick hand layer.
- **Projectile / strike object:** A thin, sharp sliver of mirror glass, silver on one side and black on the back, flashing reflections of the arena as it spins (a cheap environment-map reflection on a 2-quad mesh).
- **Flight:** Straight, 24 m/s, 9 m, spinning on its long axis so it strobes silver-black. On hitting an enemy, it ricochets off them to a second enemy within 4 m. On hitting one of Ophira's Polished allies or any wall or terrain, it bounces off at the mirror angle and keeps going with +25% damage (up to 2 bounces). A thin glass-cyan streak trails it. Sound: a high crystalline ting, and a chime on every bounce.
- **Impact:** The shard shatters into glitter on its final hit: a spray of tiny reflective flakes.
- **Target reaction:** The victim jerks aside, and fine glass glitter clings to them for 1 s, catching the light.
- **Numbers:** Range 9 m, 1.0x BA, ricochet 0.6x BA (4 m), +25% per mirror bounce off allies or walls (max 2). 1.1 attacks/s.
- **Telegraph:** None.
- **Team use:** Ophira aims through her own team: shots bounced off a Polished ally hit harder and come from an angle enemies don't expect.

##### Hit 2: Glass Shard (Bouncing / ricochet)

- **Cast:** The same from the left hand, with the bronze shield arm swinging aside. Base: mirrored.
- **Projectile / strike object:** Same shard.
- **Flight:** Same.
- **Impact:** Same.
- **Target reaction:** Same.
- **Numbers:** Same as hit 1.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Shield Glance (Bouncing / ricochet)

- **Cast:** She swings her round polished shield up from her left forearm (a prop on the left lower-arm bone) and tilts it so it catches the light, flashing a beam of reflected light that splinters into three shards. Base: UAL IDLE_SHIELD raised quickly, into a short tilt-and-flash wrist layer.
- **Projectile / strike object:** A flash of reflected light off the polished shield that splits into three glass shards in a narrow fan.
- **Flight:** Three shards fan out at 22 m/s in a 20-degree spread, each able to bounce once. Sound: a bright shield-gleam chime and three tings.
- **Impact:** Each shard shatters in glitter.
- **Target reaction:** As hit 1. A target hit by two or more shards is Dazzled for 0.5 s (a silver glare on the face).
- **Numbers:** Range 9 m, 3 shards at 0.6x BA each, each bounces once (+25%), Dazzle 0.5 s on 2+ hits.
- **Telegraph:** None.
- **Team use:** Short burst, best when bouncing off a frontliner standing next to the target.

#### Skills

##### Polished Shield (Ally-targeted buff (projectile reflection))

- **Cast:** She touches her shield with two fingers, then points at an ally, and a sheen of silver glass flows over them. Base: UAL Spell_Simple_Shoot with a two-finger touch on the shield first.
- **Projectile / strike object:** A thin skin of mirror glass flowing over the ally like quicksilver: a reflective fresnel shell with faint crack lines.
- **Flight:** A silver ribbon arcs from her shield to the ally at 30 m/s, then the glass spreads over them from head to feet in 0.2 s. Sound: a ripple like water on glass, then a clear ring.
- **Impact:** The ally becomes Polished.
- **Target reaction:** The ally sees their own hero turn mirror-bright, reflecting the arena. Enemy projectiles that hit them are reflected back at the shooter (the projectile visibly reverses with a silver flash), and they can be used as a bounce surface by Ophira's shards. Enemy melee hits crack the glass (crack lines spread).
- **Numbers:** Range 9 m, lasts 3 s or until it reflects 3 projectiles. Reflected projectiles deal their full damage to their owner. Melee hits are reduced 30%. Cooldown 12 s.
- **Telegraph:** Allies see a silver sheen with a soft white outline. Enemies see the same with a grey rim and a small mirror icon, so they know not to shoot.
- **Team use:** Put it on whoever is about to eat a big skillshot: Oko's lance, Nyssa's coins, Hespera's cinder, Wrenna's vials. Enemy marksmen and mages stop shooting.

##### Look at Me (Cone spray (gaze))

- **Cast:** She lifts her head and opens her eyes fully. The snakes in her hair rise and turn forward (the snakes are mesh, not bones: a vertex-shader lift drives them up and forward, and their eye-glow brightens). Base: UAL Idle_Loop with a head-up, chin-lifted pose layer, held 0.4 s.
- **Projectile / strike object:** Her gaze: a cone of green-silver light from her eyes with a mirror-surface shimmer, carrying the reflections of each enemy inside it.
- **Flight:** A 50-degree cone, 8 m, hitscan after the 0.4 s windup. Sound: snakes hissing in chorus, then a glassy ring.
- **Impact:** Each victim's reflection appears for a moment in front of them as a silver mirror-copy facing them (a ghost mesh of the victim, mirrored and tinted silver).
- **Target reaction:** Enemies in the cone who are FACING Ophira (their facing within 90 degrees of her) are Self-Seen: they freeze, staring at their own reflection with their arms at their sides, stunned for 1.2 s. Enemies facing away are only slowed 20% for 1 s. Petrified enemies (Lysandra's super) below 25% HP shatter into stone pieces.
- **Numbers:** Cone 8 m by 50 degrees, 1.0x BA, stun 1.2 s if facing her, slow 20% for 1 s if not. Shatters petrified enemies below 25% HP. Cooldown 14 s.
- **Telegraph:** Enemies see a red-rimmed cone and her snakes rising for 0.4 s: turn your back.
- **Team use:** Peel: any diver running straight at the squad is facing her and gets stopped. Turning away to dodge it means they've stopped diving.

#### Passive: Only a Reflection

Every 8 s, the first enemy projectile that hits Ophira is reflected back at its shooter. Ophira takes 20% less damage while standing in water or near a reflective surface (Wrenna and Sleeper water, Nyssa's river, Camedown's marble, Polished allies within 3 m).

*Visual tell:* Her mirror skin shimmers brighter when the reflect is ready, and the snakes in her hair turn their heads (vertex shader) toward the nearest enemy shooter. When it's on cooldown, a fine crack line glows across her cheek.

#### Super: What You Are

> Ophira lifts her polished shield over her head. Camera tilts up to it; for an instant the whole fight is reflected in it. Then it shatters. Shards fly outward and stand up as tall cracked mirrors in a ring around the fight. In each one, an enemy sees themselves, and their reflection steps out of the glass, silver, wearing their face, and starts using their own moves on them. Ophira steps into one mirror and out of another across the circle. Her gaze never turned anyone to stone. It shows you what you are.

- **Style:** Ground zone (mirror hall) with summoned reflections
- **Cast:** She raises her shield high, and it shatters. Every shard becomes a standing mirror, and in every mirror, every enemy sees exactly what they are.
- **Strike object:** A ring of tall standing mirrors (8 spawned mirror panels, 2.5 m tall, cracked silver glass in tarnished bronze frames) around a 10 m circle, and silver mirror-copies of every enemy inside, stepping out of the glass.
- **Flight:** The shield shatters into a burst of shards that fly out and plant upright as mirrors in a ring over 0.5 s. Each enemy inside then gets a mirror-copy of themselves (a silver tinted clone of their own mesh, playing their own attack clips) that steps out of the nearest mirror and fights them for 5 s. Ophira can move between the mirrors instantly (tap a mirror to step into it and out of another). Sound: a shatter, a ringing glass drone, then the enemies' own attack sounds played back pitched down.
- **Impact:** A mirror-floor decal in the circle that reflects the scene (a cheap planar reflection or a flipped-scene decal fallback), lasting 5 s.
- **Target reaction:** Each enemy faces their reflection: the copy repeats every ability they cast, back at them, 0.5 s later, and their basic attacks against it are mirrored back for half damage. Their outline turns silver. Allies inside are Polished for the whole duration.
- **Numbers:** Radius 10 m, lasts 5 s. Each enemy reflection copies its owner's abilities and basics on a 0.5 s delay at 60% damage, aimed at its owner. Reflections have 2.0x BA HP each and shatter when killed. Allies inside: Polished (reflect projectiles) for 5 s. Ophira blinks between mirrors freely. If allied Lysandra is inside, Ophira finally looks at her: all of Lysandra's Flake stacks are removed and she heals 30%.
- **Telegraph:** Enemies see the red-rimmed mirror ring planting over 0.5 s before the reflections step out.
- **Team use:** Enemies are forced to fight themselves for 5 s, and the squad's ranged allies are all Polished. The harder the enemy team hits, the harder they get hit back: stop casting, kill your reflection first, or walk out.
- **Charge:** Reflections: every projectile reflected (by her passive or by Polished allies) and every Self-Seen enemy fills it. On her body, the cracked mirror skin fills with light crack by crack, until at full charge she shines like a mirror in sunlight. HUD: a hand mirror icon whose glass clears.
- **Counterplay:** Stop casting: a reflection only copies what you do, so an enemy who stops attacking makes their copy harmless. Reflections can be killed (2.0x BA HP) and the ring of mirrors can be walked out of (they're glass panels with gaps). Ophira's shield is gone for 5 s after the super, so she has no Shield Glance and her passive reflect is off.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.5 s | UAL IDLE_SHIELD into Spell_Simple_Enter | Shield arm raised high overhead, her head tilted up at it. | The scene reflects in the shield; red-rimmed ring of mirror outlines. | Shield prop on the left lower-arm bone. | A rising glass ring. |
| Action | 0.5-1.0 s | UAL Spell_Simple_Shoot (both arms) | She brings the shield down and outward as it shatters. | Shard burst flies outward; mirrors plant upright in a ring. | Shield prop hidden; 8 mirror panel meshes spawned. | A loud shatter. |
| Impact | 1.0-6.0 s | UAL Idle_Loop (she can act) | Normal kit; tapping a mirror plays a 0.2 s step-into-glass dissolve and reappear. | Mirror-copies step out of the glass; mirror-floor decal; silver outlines on enemies. | Mirror panels. | Glass drone; enemy attack sounds played back pitched down. |
| Recovery | 6.0-6.6 s | UAL Interact | She catches a single shard as the mirrors crumble, and it grows back into her shield. | Mirrors crumble into glitter. | Shield prop restored at 6.6 s. | Tinkling glass. |

#### Body language

- **Locomotion:** A smooth, gliding walk with very little bob, as if she were moving behind glass. The run is quick and light, shield held close. Base: UAL Walk_Loop with a dampened vertical-bob layer; Jog_Fwd_Loop.
- **Idle:** Looks into her shield as if at a face that isn't hers, touches the crack on her cheek, and her hair snakes slowly turn to look around (vertex shader). Base: UAL Idle_Loop with head and hand layers.
- **Hit reaction:** A sharp glass crack sound; a new crack spreads across her chest and glows for 0.5 s. Base: UAL Hit_Chest.
- **Death:** Cracks spread over her whole body and she shatters into a pile of mirror shards. In each shard, for a moment, the gorgon's real face shows. Base: UAL Death01 to 0.4 s, then a shatter effect replaces the mesh.
- **Victory:** She holds up the shield like a hand mirror and, for once, smiles at the reflection. Base: UAL IDLE_SHIELD with a head-tilt layer.

#### Team combos

- **With Lysandra Kole:** The Gorgon's Garden petrifies a group. Look at Me shatters every petrified enemy below 25% HP; in What You Are, Ophira finally looks at her sister and clears all her stone.
- **With Old Kerberon:** Honey Cake: Kerberon soaks damage for a carry. Polished Shield on Kerberon reflects the shots he's absorbing back at the shooters.
- **With Wrenna Vael:** Wrenna's floods leave water on the ground. Ophira standing in water takes 20% less damage, and her shards bounce off Polished allies standing in the flood.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `ophira_idle` | UAL Idle_Loop | custom pose layer | Shield gaze; cheek touch. Snake hair motion is vertex shader only. |
| `ophira_walk` | UAL Walk_Loop | custom pose layer | Dampened vertical bob. |
| `ophira_run` | UAL Jog_Fwd_Loop | custom pose layer | Shield held close. |
| `ophira_dodge` | UAL Roll | reuse as-is | Glitter puff. |
| `ophira_basic_1` | UAL Spell_Simple_Shoot | retime | 15% faster wrist flick. |
| `ophira_basic_2` | UAL Spell_Simple_Shoot | retime | Mirrored. |
| `ophira_basic_3` | UAL IDLE_SHIELD | custom pose layer | Quick raise, tilt and flash. |
| `ophira_skill_polished_shield` | UAL Spell_Simple_Shoot | custom pose layer | Two-finger touch on the shield, then point. |
| `ophira_skill_look_at_me` | UAL Idle_Loop | custom pose layer | Head up, chin lifted, 0.4 s hold. |
| `ophira_super_what_you_are` | UAL IDLE_SHIELD / Spell_Simple_Enter / Spell_Simple_Shoot / Interact | custom pose layer | See beats. |
| `ophira_mirror_step` | UAL Idle_Loop | custom pose layer | 0.2 s step-into-glass pose plus dissolve. |
| `ophira_hit` | UAL Hit_Chest | reuse as-is | - |
| `ophira_death` | UAL Death01 | retime | Cut at 0.4 s into a shatter. |
| `ophira_victory` | UAL IDLE_SHIELD | custom pose layer | Head tilt and smile. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `ophira_glass_shard` | projectile mesh | Thin 2-quad mirror sliver, silver front and black back, with a cheap env-map reflection; strobes as it spins. |
| `ophira_shard_streak` | ribbon trail | Thin glass-cyan streak (#9FE3E0). |
| `ophira_glitter` | impact particles | Tiny reflective flakes that catch the light; 1 s cling on victims. |
| `ophira_shield_flash` | flipbook | Bright gleam off the shield face, 4 frames. |
| `ophira_polished` | status overlay | Quicksilver fresnel shell with faint crack lines; reflect flash on reversal. |
| `ophira_reflect_reverse` | flipbook | Silver flash where a projectile reverses direction. |
| `ophira_gaze_cone` | mesh cone + shimmer | Green-silver gaze cone with mirror shimmer. |
| `ophira_self_seen` | ghost mesh | Mirrored silver copy of the victim facing them during the stun. |
| `ophira_snake_hair` | vertex shader | Hair snakes lift, turn and glow via vertex offset and an eye emissive; no bones. |
| `ophira_mirror_panel` | spawned mesh | 2.5 m cracked mirror in a tarnished bronze frame; 8 per super. |
| `ophira_mirror_copy` | material on cloned mesh | Silver-tinted clone of an enemy hero playing their own clips. Fallback: a flat silver billboard of the enemy's silhouette firing their projectile VFX. |
| `ophira_mirror_floor` | decal | Reflective floor. Fallback: a flipped static reflection texture. |
| `ophira_crack_glow` | material mask | Crack lines on her skin filling with light as the super charges. |

---

### Tychon, God of the Last Roll

**Class:** Damage: mage (gambler) / Support: buffer (luck)  
**Basic style:** Trap / mine  
**Team job:** A god of luck who lost his own: every one of his attacks is a dice roll, and his squad can push the odds by standing next to him and blowing on the dice.  
**Palette:** coat ivory `#E9E2CF`, card red `#C8323A`, card black `#1E1E22`, royal purple `#6B3E9C`, pip violet `#9B4DFF`, clover green `#3FAE4A`, laurel gold `#D4AF37`, stocking green `#2F4A35`, horseshoe brass `#B8862F`

#### Basic attack chain

##### Hit 1: Roll the Bones (Trap / mine)

- **Cast:** He shakes a closed fist next to his ear with a big grin (dice rattle), blows on it, then rolls it out underhand like a craps throw. Base: UAL OVERHAND_THROW retimed to an underhand bowling release, with a 0.15 s shake-and-blow layer at the ear.
- **Projectile / strike object:** A single ivory die the size of a fist with violet pips, glowing at the edges.
- **Flight:** It bounces twice along the ground toward the aim point at 14 m/s (two small hops, tumbling), and comes to rest showing a random face. It then sits as a mine for 2.5 s, its top face glowing violet. It detonates when an enemy comes within 1.5 m, or at the end. Sound: a dice rattle, two clacks on the bounces, then a casino-chip clink when it settles.
- **Impact:** It bursts in a flash of violet pips (the number on its face drawn in the explosion as pip sprites). A small pip-pattern scorch decal stays 1 s.
- **Target reaction:** Victims are knocked back a step and see the rolled number floating over their head for 0.5 s. On a 6 they are knocked down for 0.4 s. On a 1, the die fizzles with a sad squeak and a puff of smoke, and the enemy gets a small speed boost instead (Tychon's bad luck).
- **Numbers:** Range 8 m, trigger radius 1.5 m, blast radius 1.8 m. Damage by face: 1 = fizzle (0.2x BA, and the enemy gains +10% speed for 1 s), 2-5 = 0.6x/0.8x/1.0x/1.2x BA, 6 = 2.0x BA and knock-down 0.4 s. 0.9 throws/s, max 3 dice on the ground.
- **Telegraph:** Enemies see each settled die with a red rim and its face number. Allies see it with a white outline.
- **Team use:** Lay dice on choke points and the enemy's escape lanes. Allies near him nudge the faces up (see passive).

##### Hit 2: Roll the Bones (Trap / mine)

- **Cast:** Same throw with the left hand, a little flourish of the coat tail. Base: mirrored.
- **Projectile / strike object:** Same die.
- **Flight:** Same.
- **Impact:** Same.
- **Target reaction:** Same.
- **Numbers:** Same as hit 1.
- **Telegraph:** Same.
- **Team use:** Same as hit 1.

##### Hit 3: Doubles (Trap / mine)

- **Cast:** He rattles two dice in both cupped hands overhead, kisses his fist, and throws both at once. Base: UAL OVERHAND_THROW with a two-hand shake-and-kiss layer.
- **Projectile / strike object:** A pair of dice that land side by side.
- **Flight:** Both bounce out at 14 m/s, landing 1 m apart, and show their faces. If they show doubles (a pair), they glow gold and link with a gold arc. Sound: a double rattle, then a slot-machine ding on doubles.
- **Impact:** Each detonates as hit 1. Doubles detonate together in a single big gold burst instead.
- **Target reaction:** As hit 1. On doubles, every enemy in the burst is stunned 0.6 s and gold pips orbit their head.
- **Numbers:** Range 8 m, each die as hit 1. Doubles (1 in 6 base): both faces' damage combined in a 3 m blast, plus a 0.6 s stun.
- **Telegraph:** Same as hit 1.
- **Team use:** A pair on the ground blocks a lane; a double is a free stun for the squad.

#### Skills

##### Lucky Horseshoe (Ground zone)

- **Cast:** He unhooks the brass horseshoe from his belt, spits on it for luck, and pitches it like a game of horseshoes. Base: UAL OVERHAND_THROW retimed to an underhand pitch.
- **Projectile / strike object:** The brass horseshoe, spinning flat, trailing four-leaf clovers.
- **Flight:** Lobbed arc at 13 m/s to 9 m; it lands with a clang and spins around a peg of light. Sound: a clang, then a crowd cheering faintly.
- **Impact:** A 4 m ring of green clover light on the ground (a horseshoe-shaped open ring decal, its opening pointing back at Tychon) for 5 s.
- **Target reaction:** Allies inside see little clovers drifting around them: every die they are involved in rolls twice and keeps the higher (Tychon's rolls and Tychon's buffs on them). Enemies inside get a black-cat glyph over their heads: Tychon's dice roll twice against them and keep the higher, and their own crits are disabled.
- **Numbers:** Range 9 m, radius 4 m, lasts 5 s. Allies: Lucky (Tychon's rolls involving them roll with advantage), +10% crit chance. Enemies: Unlucky (Tychon's dice against them roll with advantage, and they can't crit). Cooldown 14 s.
- **Telegraph:** Enemies see a red-rimmed horseshoe ring; allies see it green with a white outline.
- **Team use:** Stack your dice inside the horseshoe and the squad will roll sixes.

##### Deal Me In (Ally-targeted buff (random))

- **Cast:** He fans out a deck of cards from inside his coat, riffles it with a flourish, and flicks one card to each ally in range. Base: UAL Spell_Simple_Shoot with a card-fan and riffle hand layer.
- **Projectile / strike object:** Oversized playing cards, one per ally, spinning face down as they fly.
- **Flight:** Homing, 22 m/s, one card to each ally within 10 m (up to 3, plus himself). Each card flips face up as it reaches the ally. Sound: a riffle shuffle, then a snap per card.
- **Impact:** The card sticks to the ally's back, face out, and glows its suit colour.
- **Target reaction:** Each ally sees their card's suit on their own back. Hearts: heal 1.5x BA over 3 s. Spades: +20% damage for 4 s. Diamonds: +25% move speed for 4 s. Clubs: a 1.5x BA shield for 4 s. An Ace (1 in 13) gives that suit's effect doubled. Each ally can tap once to Twist: discard and draw a new random card.
- **Numbers:** Range 10 m, up to 4 cards, effects as listed, Twist once per card. Cooldown 15 s.
- **Telegraph:** Allies see their card face-up. Enemies see the cards with a grey rim and the suit, so they can read the threat.
- **Team use:** A random team buff that the squad can steer: anyone who doesn't like their card can twist.

#### Passive: The Unluckiest God

Every ability Tychon casts rolls a d6, shown over his head. 1 backfires (the effect is halved, and Tychon is slowed 20% for 1 s while a little raincloud rains on him). 2-5 are normal, scaling from 80% to 110%. 6 is devastating (+100% effect). Allies within 4 m of him can tap Blow on It once per 10 s: +1 to his next roll. After three 1s in a row, his next roll is a guaranteed 6 (he loaded the dice, but it never helped).

*Visual tell:* His pupils are dice pips that show his last roll (a 6-state eye texture swap) and blink to a new face every time he rolls. The four-leaf clover on his belt glows green when an ally has blown on his dice. On a 1, a tiny raincloud sprite appears over his head.

#### Super: The Last Roll

> Tychon fishes in his coat and pulls out a chipped golden die, the one he lost his luck with. He kisses it, shakes it next to his ear, grins, and hurls it. Camera follows it as it booms down in the middle of the fight and starts tumbling, every face flashing. His allies rush in and blow on it, and each puff nudges a face higher. It slows. It wobbles on an edge. The whole arena holds its breath. Then it falls, and whatever it says happens: a jackpot that blasts everyone into the air, a house of giant cards, or, of course, lightning on Tychon's head.

- **Style:** Lobbed arc into a random arena-scale effect
- **Cast:** He pulls out the die he lost his luck with, the one he rolled against the Fates, gold and chipped, and throws it as hard as he can. His whole team watches it tumble.
- **Strike object:** A 3 m tall golden die with violet pips and one chipped corner, tumbling across the field, then one of six outcomes.
- **Flight:** It flies in a high arc at 12 m/s to a target point up to 14 m away, lands with a booming bounce and tumbles across the ground for 1.5 s inside an 8 m circle, faces flashing. Allies within 6 m of the die during the tumble can tap Blow on It (each adds +1, max 6). It settles, shows its face for 0.5 s, then the effect fires. Sound: a giant dice rattle, booming clacks, a held breath from the crowd, then a different jingle for each face.
- **Impact:** 1 Snake Eyes: a lightning bolt strikes Tychon himself (he loses 20% HP), then the bolt jumps to every enemy within 10 m of the die. 2 Black Cat: a giant black cat silhouette crosses the circle and every enemy inside is Cursed for 6 s (their abilities fail 1 time in 3). 3 Spilt Purse: gold coins rain down; allies inside heal 2.5x BA. 4 Four-Leaf Clover: every ally within 12 m has all skill cooldowns reset. 5 Full House: five giant cards slam down around the circle as walls, trapping enemies for 2.5 s. 6 Jackpot: the die explodes in a gold blast. The settled die stays as a decal of its top face for 3 s.
- **Target reaction:** Snake Eyes: struck by chain lightning, shaking (electrified hit layer). Black Cat: a black cat glyph sits over their head, and failed casts puff out in smoke. Spilt Purse: allies glow gold as coins bounce off them. Clover: allies see their skill icons flash green. Full House: enemies stagger into the card walls. Jackpot: enemies are blasted into the air and land stunned, with gold pips orbiting their heads.
- **Numbers:** Range 14 m, tumble circle 8 m. 1: 2.0x BA to every enemy within 10 m, Tychon loses 20% HP. 2: Cursed 6 s (1 in 3 casts fail, refunding half the cooldown). 3: allies in 8 m heal 2.5x BA. 4: allies within 12 m reset all skill cooldowns. 5: card walls (2.0x BA HP each) trap the circle for 2.5 s, 1.5x BA. 6: 6.0x BA in 8 m, stun 1.5 s, and allies' supers gain 20% charge. If Sena is on the enemy team and within 10 m of the die, it always lands on 3 (the Fates won't let him win).
- **Telegraph:** Enemies see the red-rimmed 8 m tumble circle and the face as it lands, 0.5 s before the effect fires.
- **Team use:** Every ally wants to be next to the die to push the roll up, which pulls the squad together for a big moment. Even a 1 hits the enemies; it just hits Tychon too.
- **Charge:** Rolls rolled: every die, card and roll he makes fills it; 6s give double, 1s give triple (he's owed). On his body, his pupils spin through faces faster and faster, and the gold laurel in his hair blooms more leaves. HUD: a golden die whose pips fill in.
- **Counterplay:** The 8 m tumble circle is shown for 1.5 s, and the result is shown 0.5 s before it fires: leave the circle, or kill the allies blowing on it (blows only count from allies within 6 m). An enemy Sena within 10 m fixes the roll at 3 (just a heal). Snake Eyes costs Tychon 20% HP, so he's vulnerable right after.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.6 s | UAL Interact | Pulls the golden die from his coat, kisses it, shakes it by his ear. | Golden die glints; pupils spin. | Golden die prop on the right hand bone. | Dice rattle; a whispered come on, come on. |
| Action | 0.6-1.0 s | UAL OVERHAND_THROW | A big overhand hurl with a leg kick. | Die flies in a high arc; red-rimmed tumble circle appears. | Die prop released; 3 m die mesh spawned in flight. | Whoosh. |
| Impact | 1.0-3.0 s | UAL Idle_Loop with a fingers-crossed pose layer | Fingers crossed on both hands, leaning toward the die. | Die tumbles 1.5 s, Blow on It puffs from allies, the face shows, the effect fires. | Large die mesh tumbling (scripted rotation, snapping to the rolled face). | Booming clacks, held breath, result jingle. |
| Recovery | 3.0-3.6 s | UAL Dance_Loop (1 s, upper body) or Hit_Head | Celebrates on a 4-6, shrugs on a 2-3, gets struck by lightning on a 1. | Result VFX fade. | Die mesh crumbles to gold dust. | Cheer, shrug or zap. |

#### Body language

- **Locomotion:** A jaunty, loose-limbed swagger like a gambler on a winning streak, coat tails swinging. The run is a gangly scramble. Base: UAL Walk_Loop with a swagger and bounce layer; Sprint_Loop.
- **Idle:** Rolls a die across his knuckles, flips a coin and doesn't look at the result, fans a deck of cards and grins. Base: UAL Idle_Loop with hand layers.
- **Hit reaction:** A card falls out of his sleeve, he winces and checks his pockets for his luck. Base: UAL Hit_Head.
- **Death:** He falls flat on his back and a single die rolls out of his hand, wobbles, and lands on 1. He laughs weakly. Base: UAL Death02.
- **Victory:** He tosses his laurel in the air, catches it on his head, and fans out a royal flush at the camera. Base: UAL Dance_Loop retimed, upper body.

#### Team combos

- **With Sena:** Sena is on Tychon's team (the rematch never happened). Sena's Held Thread on Tychon makes his Snake Eyes lightning cost him nothing: he can't drop below 1 HP.
- **With Ione:** Wind the Box hastes the squad. Hasted allies reach the tumbling die faster to blow on it, and Ione's notes count as Blow on It for allies she touches.
- **With Moss:** Moss raises Maze Walls around a group. Tychon fills the box with dice; nobody can step around them.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `tychon_idle` | UAL Idle_Loop | custom pose layer | Knuckle die roll; coin flip; card fan. |
| `tychon_walk` | UAL Walk_Loop | custom pose layer | Swagger and bounce. |
| `tychon_run` | UAL Sprint_Loop | reuse as-is | - |
| `tychon_dodge` | UAL Roll | reuse as-is | Cards spill. |
| `tychon_basic_1` | UAL OVERHAND_THROW | custom pose layer | Underhand craps roll with a shake-and-blow layer. |
| `tychon_basic_2` | UAL OVERHAND_THROW | custom pose layer | Mirrored. |
| `tychon_basic_3` | UAL OVERHAND_THROW | custom pose layer | Two-hand shake and kiss. |
| `tychon_skill_lucky_horseshoe` | UAL OVERHAND_THROW | retime | Underhand horseshoe pitch. |
| `tychon_skill_deal_me_in` | UAL Spell_Simple_Shoot | custom pose layer | Card fan and riffle. |
| `tychon_super_last_roll` | UAL Interact / OVERHAND_THROW / Idle_Loop / Dance_Loop / Hit_Head | custom pose layer | See beats. |
| `tychon_blow_on_it_ally` | UAL Interact | retime | Shared 0.3 s clip any ally plays when they blow on his dice (hand cupped to mouth). |
| `tychon_hit` | UAL Hit_Head | reuse as-is | - |
| `tychon_death` | UAL Death02 | reuse as-is | - |
| `tychon_victory` | UAL Dance_Loop | retime | Upper body only. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `tychon_die` | projectile mesh | Fist-sized ivory die with violet emissive pips and glowing edges; scripted to settle on the rolled face. |
| `tychon_pip_burst` | flipbook | Violet pip sprites arranged as the rolled number in a flash. |
| `tychon_fizzle` | particles | Sad grey smoke puff for a 1. |
| `tychon_doubles_arc` | ribbon | Gold arc linking a pair of dice. |
| `tychon_horseshoe_ring` | decal | Open horseshoe-shaped clover-green ring with drifting clover sprites. |
| `tychon_black_cat` | status overlay | Small black cat glyph over Unlucky or Cursed enemies. |
| `tychon_cards` | projectile meshes | Oversized playing cards that flip face up mid-flight; four suits and an ace variant. |
| `tychon_card_back` | status overlay | Card stuck face out to an ally's back, glowing its suit colour. |
| `tychon_roll_display` | UI world sprite | d6 face over Tychon's head after each roll; raincloud sprite on a 1. |
| `tychon_pip_eyes` | texture swap | 6 pupil textures showing pips 1-6. |
| `tychon_golden_die` | spawned mesh | 3 m gold die with a chipped corner; scripted tumble. |
| `tychon_outcomes` | VFX set | Six outcome effects: chain lightning, giant black cat silhouette card, coin rain, clover burst, five 2 m card walls, gold explosion. Fallback: a shared gold flash plus the outcome's icon. |

---

### Aurvan, the Wyrm Who Ate the Moon

**Class:** Control: pulls / Damage: mage  
**Basic style:** Cone spray  
**Team job:** Pulls the whole enemy team into one place with moon-tides, so every area move his squad owns hits everyone. His kit changes as the arena's moon waxes and wanes.  
**Palette:** scale navy `#1E3566`, scale blue `#2F5BA8`, robe midnight `#151A33`, moon cream `#F3EDC8`, moon glow `#FFF8D6`, horn black `#1A1A1E`, beard silver `#C9CDD3`, bracer bronze `#8C6A3A`, star white `#EAF2FF`

#### Basic attack chain

##### Hit 1: Moonfrost Breath (Cone spray)

- **Cast:** He draws a breath that makes the moon in his chest flare, then exhales through his teeth with his head low and his clawed hands spread. The breath is VFX from the mouth (head bone socket); the jaw doesn't need to move. Base: UAL Spell_Simple_Shoot with both hands spread low and a head-forward exhale layer.
- **Projectile / strike object:** A short cone of silver moonlight frost: pale crystals, drifting star motes and a cold mist, flecked with tiny crescent shapes.
- **Flight:** A 40-degree cone, 6 m, rolling out at 12 m/s for 0.25 s. Crystals tumble and mist curls behind. Sound: a long cold exhale with a faint chime of ice.
- **Impact:** Hoarfrost crescents on the ground in the cone, fading over 1 s.
- **Target reaction:** Victims hunch against the cold, rime forming on their shoulders (a frost shader patch), and they are pushed 0.5 m toward the cone's centre line.
- **Numbers:** Cone 6 m by 40 degrees, 0.9x BA, pull 0.5 m toward the centre line, 0.9 attacks/s. Width and effect change with the moon phase (see passive).
- **Telegraph:** Enemies see a faint red-rimmed cone for 0.1 s.
- **Team use:** Each breath gathers spread-out enemies into a tighter line for the squad's area damage.

##### Hit 2: Moonfrost Breath (Cone spray)

- **Cast:** The same, turning his head across the other way as he breathes (a short head sweep).
- **Projectile / strike object:** Same.
- **Flight:** Same, sweeping 20 degrees across.
- **Impact:** Same.
- **Target reaction:** Same.
- **Numbers:** Same as hit 1.
- **Telegraph:** Same.
- **Team use:** Same as hit 1.

##### Hit 3: Wyrm's Exhale (Cone spray (heavy))

- **Cast:** He throws his head back, the moon in his chest blazing, and roars forward. Both clawed hands rake down as the breath comes out. Base: UAL Spell_Simple_Enter (head back) into Spell_Simple_Shoot with a claw-rake arm layer.
- **Projectile / strike object:** A dense cone of white-blue lunar fire, with a faint ghostly dragon jaw shape at its mouth (a jaw-silhouette billboard).
- **Flight:** A 60-degree cone, 7 m, for 0.4 s. Sound: a dragon's roar layered under an old man's voice.
- **Impact:** A frost-and-scorch cone decal, silver and dark blue, 2 s.
- **Target reaction:** Victims are Moonstruck: slowed 30% for 1.5 s with rime crawling up their legs, and pulled 1 m toward Aurvan.
- **Numbers:** Cone 7 m by 60 degrees, 1.5x BA, slow 30% for 1.5 s, pull 1 m.
- **Telegraph:** A 0.2 s chest-moon flare.
- **Team use:** Drags a whole group a step closer and slows them for the frontline to catch.

#### Skills

##### Tidal Pull (Pull / hook (area))

- **Cast:** He clenches a clawed fist toward a spot on the ground and pulls it back to his chest, as if hauling on the sea. The moon in his chest swells. Base: UAL MELEE_HOOK with an open-claw-to-fist hand layer.
- **Projectile / strike object:** A small reflection of the moon: a pale silver orb that appears 2 m above the target point, with spiralling tide rings rippling out on the ground beneath it.
- **Flight:** The orb appears instantly; tide rings spiral inward on the ground for 0.8 s. Everything inside slides toward the centre. Sound: a rising surf sound and a deep moon-hum.
- **Impact:** A spiral tide decal of silver water lines for 1 s; puddles of water already on the ground (Wrenna, Sleeper) swell and deepen.
- **Target reaction:** Enemies are dragged 4 m toward the centre over 0.8 s, feet skidding, arms reaching back (a drag reaction), with silver tide rings around their ankles.
- **Numbers:** Range 11 m, radius 5 m, pull up to 4 m toward the centre over 0.8 s, 1.2x BA. Cooldown 13 s.
- **Telegraph:** Enemies see a red-rimmed spiral and the orb for 0.3 s before the pull.
- **Team use:** The squad's cluster-maker: Wrenna's Sounding, Hespera's sun, Kallix's chain sparks and Hob's seventh toll all want a cluster.

##### Too Big a Shadow (Ground zone (moving))

- **Cast:** He spreads his arms wide as if they were wings, and his shadow stretches out ahead of him across the ground into the shape of a vast dragon. Base: UAL Spell_Simple_Enter with arms spread wide, held, then a forward sweep.
- **Projectile / strike object:** His shadow: a huge dragon-shaped shadow decal (wings spread, 12 m long) that glides across the ground in the aimed direction. No wings exist on the mesh; the dragon is only the shadow.
- **Flight:** The shadow glides 14 m forward at 10 m/s, wings beating (a 4-frame flipbook decal). Sound: huge wingbeats, though nothing is flying.
- **Impact:** Nothing is left behind except a faint chill (a frosty trail decal, 1 s).
- **Target reaction:** Enemies the shadow passes over are Dreading: they cringe and look up at an empty sky (a look-up layer), are slowed 30% and deal 15% less damage for 2 s. Allies under it see a deep blue cool tint and are hidden from enemies more than 6 m away for 2 s.
- **Numbers:** Shadow 12 m long and 6 m wide, travels 14 m. Enemies: slow 30% and -15% damage for 2 s. Allies: unseen beyond 6 m for 2 s. Cooldown 15 s.
- **Telegraph:** Enemies see the shadow with a red rim at its edges.
- **Team use:** Covers the squad's approach (allies hidden) while weakening the enemies it crosses.

#### Passive: Moon Phases

The arena's moon cycles through 4 phases every 60 s: New, Waxing, Full, Waning. New: his breath is a narrow 25-degree cone that blinds for 0.5 s. Waxing: Tidal Pull cooldown -3 s. Full: his breath widens to 60 degrees and every pull is 50% stronger. Waning: he heals 15% of damage he deals. Allied Fenwick grows stronger as the moon wanes, so their best fights fall in different phases.

*Visual tell:* The moon in his chest shows the phase (an animated emissive mask from dark to full) and his huge shadow is always visible on the ground under him: a dragon-shaped shadow decal three times his size that follows him.

#### Super: Let the Moon Out

> Aurvan sinks his claws into the scales over his heart and pulls them open. Light pours out. Camera pulls back as the first moon, the one he swallowed before the sky had a reflection, rises out of his chest and floats up over the battlefield. For a moment the whole arena is lit silver. The tides answer it: every enemy within reach is lifted gently off their feet and drawn toward the point beneath it, drifting like swimmers. The old wyrm watches it, hollow-chested, with something like tenderness. Then he closes his fist, and the moon comes home, straight down through everyone beneath it.

- **Style:** Pull / hook (arena-scale tide) into a slam
- **Cast:** He tears open the scales over his chest with both claws, and the first moon, the one he swallowed, rises out of him and up into the sky. It is alive, and it wants to see the world. For a few seconds he lets it.
- **Strike object:** The real first moon: a large glowing cream-white sphere with gentle craters and a slow pulse like breathing, rising from his chest and hanging over the target point 6 m up, with silver tide waves spiralling in toward the point below it.
- **Flight:** The moon rises along an arc from his chest to a target point up to 14 m away in 1.0 s. For 3 s it hangs there and everything within 12 m is pulled toward the point below it in strong tide waves, lifting enemies slightly off the ground so they float (a 0.5 m hover). Then Aurvan clenches his fist and calls it home: it drops onto the point and rolls back into his chest. Sound: a choir of a single high voice (the moon), rushing tides, then a deep thud.
- **Impact:** During the pull, the ground shows huge spiral tide lines of silver water. The final drop leaves a 6 m crater of silvery frost and moonlight for 3 s.
- **Target reaction:** Enemies float helplessly toward the centre, their limbs drifting as if underwater (a float layer), with silver light on their faces. On the drop they're slammed down and stunned for 1.2 s. Allies in range see a soft moon-glow and the tide doesn't affect them.
- **Numbers:** Range 14 m, pull radius 12 m for 3 s (enemies dragged up to 8 m to the centre, can't dash or leap while floating), drop radius 6 m: 4.0x BA, stun 1.2 s. The moon has 4.0x BA HP while out; breaking it ends the pull and drops nothing. While the moon is out, Aurvan is Hollow: his chest goes dark, he takes 40% more damage and moves 30% slower.
- **Telegraph:** The moon rising is a 1.0 s warning, and the pull area shows a 12 m red-rimmed spiral. The drop point glows brighter 0.5 s before it falls.
- **Team use:** Gathers the enemy team in one 6 m circle for 3 s and then stuns them: everything every ally has goes there. With Hespera, it's the Eclipse; with Fenwick, it fills half his super; with Wrenna, Sounding on the drop point is a guaranteed double-damage flood.
- **Charge:** Tides turned: metres of enemy movement caused by his pulls fill it (each metre an enemy is pulled adds charge). On his body, the moon in his chest grows brighter and its glow spreads through the scales on his arms like moonlight on water. HUD: a moon icon that waxes to full.
- **Counterplay:** Shoot the moon: it has 4.0x BA HP, and breaking it ends the pull with no slam. Aurvan is Hollow while it's out (+40% damage taken, -30% speed): dive him. Enemies at the edge of the 12 m area can walk out against the tide (it's a strong pull, not a stun), and the drop point glows 0.5 s before the slam.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-1.0 s | UAL Interact into Spell_Simple_Enter | Both claws grip his chest and pull outward; head thrown back. | Light pours from his chest; the moon rises from it in an arc. | Moon sphere spawned at the chest socket. | Scales tearing; a single high voice. |
| Action | 1.0-4.0 s | UAL Spell_Simple_Idle_Loop | Arms open, looking up at the moon. Chest dark (Hollow). | Moon hangs; spiral tide lines; enemies float toward the centre. | Moon sphere at 6 m height. | Rushing tides; choir. |
| Impact | 4.0-4.4 s | UAL MELEE_HOOK | Clenches a fist and yanks it back to his chest. | Moon drops; frost crater; stun stars; moon arcs back into his chest. | Moon returns to the chest socket. | A deep thud, then a heartbeat. |
| Recovery | 4.4-5.0 s | UAL Idle_Loop | Hand over his chest as the scales close; he breathes out. | Chest glow returns. | None. | A long, satisfied exhale. |

#### Body language

- **Locomotion:** A slow, heavy, deliberate stride with the tail-less body leaning forward like a beast standing up; his enormous dragon shadow walks with him. The run is a powerful loping stride with the claws held low. Base: UAL Walk_Loop retimed 10% slower with a forward-lean layer; Jog_Fwd_Loop.
- **Idle:** Strokes his beard with a claw, looks down at the moon in his chest and listens to it, glances at his own huge shadow. Base: UAL Idle_Loop with hand and head layers.
- **Hit reaction:** His shadow flinches more than he does (the shadow decal jolts), and the moon in his chest flickers. Base: UAL Hit_Chest at 60% weight.
- **Death:** He sinks to his knees and the moon in his chest dims, then rises out of him a little way, looks around, and sinks back in as he lies down. His shadow shrinks to normal size. Base: UAL Death01 slowed.
- **Victory:** He sits cross-legged and the moon floats out of his chest to hover in front of him; he talks to it quietly. Base: UAL Sitting_Idle_Loop with an Idle_Talking_Loop upper body.

#### Team combos

- **With Hespera:** Both supers within 5 s of each other. Eclipse: the moon covers the dead sun, the arena goes dark, and the sun's impact deals +30%. Lore: the sun's widow and the moon's thief.
- **With Fenwick Marl:** Aurvan lets the moon out. Fenwick's super charge jumps by 50%: the moon is the reason for his curse.
- **With Wrenna Vael:** Tidal Pull clusters enemies. Sounding lands on the cluster, which can't walk off the rose in time; at Full moon it's a 6 m pull.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `aurvan_idle` | UAL Idle_Loop | custom pose layer | Beard stroke; listen to the moon; glance at the shadow. |
| `aurvan_walk` | UAL Walk_Loop | custom pose layer | 10% slower, forward lean. |
| `aurvan_run` | UAL Jog_Fwd_Loop | custom pose layer | Claws held low. |
| `aurvan_dodge` | UAL Roll | retime | Heavy. |
| `aurvan_basic_1` | UAL Spell_Simple_Shoot | custom pose layer | Hands spread low, head-forward exhale; breath from the head bone socket. |
| `aurvan_basic_2` | UAL Spell_Simple_Shoot | custom pose layer | Head sweep across. |
| `aurvan_basic_3` | UAL Spell_Simple_Enter + Spell_Simple_Shoot | custom pose layer | Head back, then a roaring rake. |
| `aurvan_skill_tidal_pull` | UAL MELEE_HOOK | custom pose layer | Open claw closing to a fist. |
| `aurvan_skill_too_big_a_shadow` | UAL Spell_Simple_Enter | custom pose layer | Arms spread like wings, held, then a forward sweep. |
| `aurvan_super_let_the_moon_out` | UAL Interact / Spell_Simple_Enter / Spell_Simple_Idle_Loop / MELEE_HOOK | custom pose layer | See beats. |
| `aurvan_hit` | UAL Hit_Chest | custom pose layer | 60% weight. |
| `aurvan_death` | UAL Death01 | retime | Slowed. |
| `aurvan_victory` | UAL Sitting_Idle_Loop + Idle_Talking_Loop | custom pose layer | Upper-body talking blend. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `aurvan_frost_cone` | particles + cone mesh | Silver moonlight frost crystals, star motes and mist; crescent flecks. |
| `aurvan_lunar_fire` | particles + billboard | White-blue lunar fire cone with a ghostly dragon-jaw silhouette at the mouth. |
| `aurvan_rime` | status overlay | Frost shader creeping up the victim's legs and shoulders. |
| `aurvan_moon_orb` | spawned sprite + light | Small silver moon reflection over the Tidal Pull point. |
| `aurvan_tide_spiral` | decal | Spiralling silver water lines drawing inward. |
| `aurvan_dragon_shadow` | decal | Dragon-shaped shadow 3x his size that follows him; a 12 m wing-beating variant for the skill (4-frame flipbook). |
| `aurvan_dread` | status overlay | Cold blue tint and a look-up reaction layer on enemies. |
| `aurvan_chest_moon` | material mask | Emissive moon in the chest showing the current phase and charge. |
| `aurvan_first_moon` | spawned mesh + light | Large cream sphere with soft craters and a breathing pulse; 4.0x BA HP. Fallback: a billboard moon with a halo. |
| `aurvan_float` | status overlay | Silver light on floating enemies and a slow underwater-drift layer. |
| `aurvan_frost_crater` | decal | 6 m silvery frost and moonlight crater, 3 s. |
| `aurvan_hollow` | material swap | Dark, empty chest cavity glow while the moon is out. |

---

### Ourax, the Titan Who Carries the Sky

**Class:** Frontline: tank / Specialist: summoner (village militia)  
**Basic style:** Cleave arc  
**Team job:** A walking hill with a village on it: he shelters the squad under his corner of the sky, his villagers shoot from his shoulders, and his super hands the sky to an enemy.  
**Palette:** titan stone `#8E8A7E`, stone shadow `#5E5B52`, moss green `#7DBA3A`, grass bright `#9CD14A`, thatch gold `#D9B24A`, rope brown `#8A6A3F`, sky blue `#9CC9F0`, cloud white `#F4F7FA`, eye blue `#6FB6E8`

#### Basic attack chain

##### Hit 1: Brush Aside (Cleave arc)

- **Cast:** Ourax fights with one hand: his left arm is always raised overhead, palm up, holding a corner of the sky (an additive pose layer applied on top of every clip, with a sky-patch VFX resting on his palm). His right hand makes a slow, huge backhand sweep at knee height, the way you'd brush crumbs off a table. Base: UAL Sword_Attack (horizontal) with an empty fist, retimed 20% slower, plus the left-arm-raised layer.
- **Projectile / strike object:** His stone hand, and the turf it tears up: a fan of soil, grass clods and tiny wildflowers flung along the arc, with a pale dust swing-trail.
- **Flight:** Arc of 150 degrees, 3.2 m reach, 0.35 s. Clods of turf fly outward 2 m. Sound: a deep grinding whoosh, like a landslide starting, and birds taking off from his shoulders.
- **Impact:** A crescent of torn turf on the ground (decal, 2 s) with a few scattered clods.
- **Target reaction:** Enemies are knocked sideways 1 m and stumble, with grass and soil stuck to them.
- **Numbers:** Range 3.2 m, arc 150 degrees, 1.0x BA, 0.75 hits/s.
- **Telegraph:** None.
- **Team use:** Wide, slow sweeps push divers off whoever is standing behind him.

##### Hit 2: Brush Aside (Cleave arc)

- **Cast:** The forehand return sweep. Base: Sword_Attack reversed, same left-arm layer.
- **Projectile / strike object:** Same turf fan.
- **Flight:** Same, other direction.
- **Impact:** Same.
- **Target reaction:** Same, pushed the other way.
- **Numbers:** Same as hit 1.
- **Telegraph:** None.
- **Team use:** Same as hit 1.

##### Hit 3: Careful Stomp (Cleave arc (ground stomp))

- **Cast:** He lifts one enormous foot very slowly, checks under it (a head-down layer, as if making sure no villager is there), and stamps. Base: UAL MELEE_JUMP_LAND (impact frames) with a slow one-leg lift layered in front, a 0.3 s hold at the top.
- **Projectile / strike object:** A ring-shaped shockwave of rolling earth: the ground ripples outward like a rug being shaken, with grass flattening in a ring.
- **Flight:** The ripple rolls out to 3 m in 0.25 s. Sound: a deep thud, and a tiny chapel bell ringing on his shoulder.
- **Impact:** A footprint crater with a flattened-grass ring decal, 2 s.
- **Target reaction:** Enemies are knocked up 0.3 s and land slowed 25% for 1 s.
- **Numbers:** Radius 3 m, 1.4x BA, knock-up 0.3 s, slow 25% for 1 s.
- **Telegraph:** The raised foot and a red-rimmed 3 m ring for 0.3 s.
- **Team use:** A short knock-up for the squad to follow up on.

#### Skills

##### Village Militia (Pet / summon (shoulder artillery))

- **Cast:** He turns his head toward his right shoulder and murmurs something to the village. Tiny villagers pop up on the rooftops, the chapel bell clangs, and they all point at the target. Base: UAL Idle_Talking_Loop (head turned to the shoulder) into a pointing right arm from Spell_Simple_Shoot.
- **Projectile / strike object:** A volley from the village: tiny flaming arrows, pitchforks, and stones from a little catapult in the market square, all launched from his shoulders. The villagers themselves are small billboard sprites (8-frame flipbooks) spawned on the shoulder-top terrain of his mesh.
- **Flight:** For 4 s, a volley every 0.5 s arcs from his shoulders onto the target area: a scatter of 6 tiny projectiles per volley in high arcs (13 m/s), each with a little ember or dust trail. Sound: a tiny bell, little voices shouting Charge!, a creaky catapult.
- **Impact:** Each volley peppers the area with small impacts: arrows sticking out of the ground and pitchforks quivering (decals and small meshes, 2 s).
- **Target reaction:** Enemies in the area flinch repeatedly from small hits, with tiny arrows stuck in them (sprite decals) and slowed 15% while in it.
- **Numbers:** Range 12 m, area radius 3.5 m, lasts 4 s, 8 volleys of 0.3x BA each (2.4x BA total if a target stays in). Slow 15% inside. Cooldown 12 s. The militia can't fire while Ourax is knocked down or after his own Shrug.
- **Telegraph:** Enemies see a red-rimmed target circle with a tiny bell icon.
- **Team use:** Area denial that keeps firing while Ourax body-blocks. Wrenna's cross-bearing marks show the militia where a slow target will be.

##### Shrug (Aura (earthquake))

- **Cast:** He rolls both shoulders up and lets them drop, a titan's shrug, careful to keep the raised hand steady. The whole village on his shoulders jumps and tumbles. Base: UAL Idle_Loop with a big shoulder-roll layer (both clavicles up 0.3 s, then dropped hard) and a knee dip.
- **Projectile / strike object:** A circular earthquake: the ground cracks in a radial pattern and heaves up in rings around him, with dust and falling leaves.
- **Flight:** Rings of heaving ground spread out from his feet to 7 m over 0.5 s. Sound: a rumbling earthquake, crockery breaking, and tiny villagers yelping.
- **Impact:** A radial crack decal with lifted turf plates for 3 s.
- **Target reaction:** Every unit in range is knocked down for 1.0 s and rolls over, including Ourax's own allies (who get a short 0.4 s stumble instead) and his villagers (their sprites tumble and the militia stops for 3 s). Enemies are dazed with a ring of dust motes around their heads.
- **Numbers:** Radius 7 m. Enemies: 1.6x BA, knock-down 1.0 s. Allies: stumble 0.4 s, no damage. Village Militia is disabled for 3 s. Cooldown 16 s.
- **Telegraph:** A 0.4 s shoulder lift with red-rimmed ground rings for enemies and an amber warning ring for allies.
- **Team use:** A big group knock-down for the squad to follow up on, but it costs the militia and briefly trips your own team, so call it.

#### Passive: They Think I'm a God

Under the Sky: allies within 4 m of Ourax take 25% less damage from lobbed projectiles and from area attacks that fall from above (his hand holds the sky over them). Prayer: when Ourax drops below 40% HP, the chapel on his shoulder rings and the villagers pray, healing him 15% max HP over 3 s (once every 45 s).

*Visual tell:* A soft blue sky-patch glows above his raised left palm and the 4 m shelter circle shows as a pale cloud-shadow on the ground. When Prayer is ready, a tiny golden light glows in the chapel window on his shoulder; when it triggers, tiny kneeling villager sprites appear on his shoulders.

#### Super: Hold This for a Moment

> Ourax stops, looks at an enemy, and something like hope crosses his mossy face. He leans down very carefully and lowers his raised hand, and the corner of the sky comes down with it, a huge slab of blue with clouds drifting through, onto the enemy's shoulders. Their knees buckle. On Ourax's back the villagers look up at an empty space where the sky used to be and scream. Ourax looks at his two free hands, flexes them, and smiles for the first time in an age. Then he starts smashing.

- **Style:** Pull / hook into a two-handed rampage (transform)
- **Cast:** He has been looking for someone strong enough to take over his corner of the sky. He picks an enemy, leans down, and hands it to them. Then, for the first time in an age, he has two hands free.
- **Strike object:** His corner of the sky: a massive pale-blue slab of sky with clouds drifting through it and the faint shapes of stars (a large flattened dome mesh with a scrolling cloud shader), lowered from his palm onto the target enemy. Then Ourax with both fists free, each swing throwing up rock and turf.
- **Flight:** The sky slab slides from his left palm onto the target within 9 m over 0.6 s (a grab-and-place motion), pinning them. For 6 s Ourax uses two-handed attacks: a double-fisted hammer slam (3 m radius) every 1.2 s on the nearest enemy, his basic sweeps become full 360-degree spins. Meanwhile the villagers on his shoulders panic (tumbling sprites, little screams), because their sky is gone. Sound: a vast creak like the sky's hinges, a gasp from the villagers, then huge stone-on-stone slams.
- **Impact:** Under the slab: a cloud-shadow decal with cracks forming in the ground as the weight presses down. Each two-handed slam leaves a 3 m crater decal.
- **Target reaction:** The target is Holding the Sky: knees buckling, both arms forced up overhead (a held-sky pose on the victim), rooted and unable to attack, taking crushing damage every second. Allies of the target can stand next to them and help hold it: each helper within 2 m is slowed 50% but halves the crush damage and cuts the duration by 1 s.
- **Numbers:** Range 9 m. Target pinned for up to 5 s (each helping enemy cuts it by 1 s): 0.8x BA per second crushing. If the target survives the full duration, they heave the sky back at Ourax: he is stunned for 1.0 s. Ourax two-handed for 6 s: slams 2.0x BA in 3 m every 1.2 s, +25% damage, his passive shelter is off and Village Militia is disabled.
- **Telegraph:** A 0.6 s red-rimmed slab shadow on the target as he lowers it.
- **Team use:** Pins the enemy's best fighter (a tank or a diver), so the squad can collapse on the rest while Ourax smashes. Enemies who come to help their friend hold it are slowed and grouped together for Wrenna, Aurvan or Hespera.
- **Charge:** Weight carried: damage he absorbs while his allies are in his shelter, and allies protected by Under the Sky, fill it. On his body, the moss on his shoulders blooms with flowers and the sky patch above his palm grows from a small blue disc to a broad blue canopy. HUD: a raised-hand icon holding a cloud.
- **Counterplay:** Help your friend hold it: every enemy who stands within 2 m of the target halves the crush damage and cuts 1 s off the pin. If the target survives to the end, they throw the sky back and stun Ourax for 1 s. While two-handed, Ourax has no shelter passive and no militia, so ranged allies are exposed. The 0.6 s lowering can be dodged by dashing out of the shadow.

| Beat | Time | Base clip | Custom tweak | VFX | Prop | Sound |
|---|---|---|---|---|---|---|
| Windup | 0.0-0.6 s | UAL PickUp_Table reversed (setting down) | Left arm comes down slowly from overhead, palm up, lowering the sky toward the target; he leans forward. | Sky slab slides from his palm; red-rimmed slab shadow on the target. | Sky slab mesh detaches from the left hand bone. | Vast creak; villagers gasp. |
| Action | 0.6-1.0 s | UAL Idle_Loop with the left-arm-raised layer removed | He straightens up and flexes both hands in front of him, looking at them. | Slab pins the target; villager sprites tumble in panic. | Sky slab on the target's head bone, scaled to fit. | Tiny screams; a deep, happy hum. |
| Impact | 1.0-7.0 s | UAL Sword_Attack (overhead, two empty fists) and a 360-degree spin from Sword_Attack chained | Two-handed slams every 1.2 s; basics become full spins. | 3 m crater decals, rock and turf bursts, crush cracks under the slab. | None. | Stone slams; earthquake rumble. |
| Recovery | 7.0-7.8 s | UAL PickUp_Table | He reaches over and takes the sky back, raising his left arm overhead again. | Slab lifts back to his palm; villagers cheer (sprites). | Sky slab back on the left hand bone. | A sigh; tiny cheering. |

#### Body language

- **Locomotion:** A slow, enormous, very careful walk: short steps, knees soft so the village doesn't shake, left arm always overhead. The run is a lumbering jog, still careful, with the villagers holding onto their roofs. Base: UAL Walk_Loop retimed 25% slower with the left-arm-raised layer and a soft-knee layer; Jog_Fwd_Loop retimed 20% slower.
- **Idle:** Looks down at his shoulder, nudges a little falling cart back onto the road with a fingertip, and gently blows on the chapel to put out a chimney fire. Base: UAL Idle_Loop with the left-arm layer and right-hand fingertip layers.
- **Hit reaction:** He rocks back and every tree on his shoulders sways; a villager sprite shakes a tiny fist at the attacker. Base: UAL Hit_Chest at 40% weight.
- **Death:** He sinks to one knee, then the other, keeping the left hand raised to the very end. The sky patch above it flickers as he slowly kneels and freezes like a mountain. The villagers' houses light their windows and the bell tolls. Base: UAL Death01 truncated at the kneel and frozen.
- **Victory:** He sits down very slowly and carefully, then lets a tiny villager climb onto his finger and holds it up to the sky. Base: UAL Sitting_Enter into Sitting_Idle_Loop.

#### Team combos

- **With Old Kerberon:** Kerberon's Guard the Gate blocks the approach. Ourax's militia rains volleys over the gate onto enemies who can't cross.
- **With Wrenna Vael:** Wrenna's Brackish Pair leaves a cross-bearing X on a slowed target. The village militia volleys land on the X, and Under the Sky shelters Wrenna from return fire.
- **With Aurvan:** Hold This for a Moment pins the enemy tank, and their allies come to help hold it. Aurvan's Tidal Pull drags the helpers in, and the whole enemy team is in one place, slowed.

#### Animations to build

| Clip | Base | Mode | Notes |
|---|---|---|---|
| `ourax_left_arm_sky_layer` | custom pose (additive) | custom pose layer | Left arm raised overhead, palm up, applied over every clip except the super's two-handed section. |
| `ourax_idle` | UAL Idle_Loop | custom pose layer | Fingertip nudges; blow on the chapel. |
| `ourax_walk` | UAL Walk_Loop | retime | 25% slower, soft knees. |
| `ourax_run` | UAL Jog_Fwd_Loop | retime | 20% slower. |
| `ourax_dodge` | UAL Roll | custom pose layer | A short sidestep shuffle instead of a roll (he can't roll with a village on his back): Roll's first 40% with the root motion kept, then back to idle. |
| `ourax_basic_1` | UAL Sword_Attack | custom pose layer | Empty fist, 20% slower, low sweep. |
| `ourax_basic_2` | UAL Sword_Attack | retime | Reversed. |
| `ourax_basic_3` | UAL MELEE_JUMP_LAND | custom pose layer | Slow one-leg lift with a 0.3 s hold, then the stamp. |
| `ourax_skill_village_militia` | UAL Idle_Talking_Loop + Spell_Simple_Shoot | custom pose layer | Head turned to the shoulder, then a point. |
| `ourax_skill_shrug` | UAL Idle_Loop | custom pose layer | Big shoulder roll and drop with a knee dip. |
| `ourax_super_hold_this` | UAL PickUp_Table / Idle_Loop / Sword_Attack | custom pose layer | See beats. |
| `ourax_victim_hold_the_sky` | UAL Idle_Loop | custom pose layer | Shared pose played on the pinned enemy: both arms overhead, knees buckling. |
| `ourax_hit` | UAL Hit_Chest | custom pose layer | 40% weight. |
| `ourax_death` | UAL Death01 | custom pose layer | Frozen at the kneel with the left arm still raised. |
| `ourax_victory` | UAL Sitting_Enter + Sitting_Idle_Loop | custom pose layer | Villager on a fingertip. |

#### VFX assets

| Asset | Type | Art direction |
|---|---|---|
| `ourax_sky_patch` | attached billboard + light | Soft blue sky disc with drifting clouds resting on his raised left palm; grows with charge. |
| `ourax_shelter_shadow` | decal | Pale cloud-shadow circle (4 m) for the Under the Sky passive. |
| `ourax_turf_fan` | particles | Soil, grass clods and tiny wildflowers flung along each sweep; pale dust swing trail. |
| `ourax_turf_crescent` | decal | Crescent of torn turf, 2 s. |
| `ourax_ground_ripple` | spawned mesh ring | Rolling earth ripple with flattening grass. |
| `ourax_villagers` | billboard flipbooks | Tiny villager sprites (point, cheer, pray, tumble, scream; 8 frames each) placed on the shoulder terrain. |
| `ourax_militia_volley` | projectile particles | Tiny flaming arrows, pitchforks and catapult stones in high arcs with ember or dust trails. |
| `ourax_arrow_decals` | decal + small meshes | Arrows stuck in the ground and quivering pitchforks, 2 s. |
| `ourax_quake_rings` | decal + particles | Radial crack decal with lifted turf plates, dust and falling leaves. |
| `ourax_chapel_light` | material | Gold window glow in the shoulder chapel when Prayer is ready. |
| `ourax_sky_slab` | spawned mesh | Flattened dome of pale blue sky with a scrolling cloud shader and faint stars. Fallback: a textured blue disc billboard over the target. |
| `ourax_crush_cracks` | decal | Cracks spreading under the pinned target. |
| `ourax_two_hand_crater` | decal + particles | 3 m crater with rock and turf burst. |

---

## 4. Best team combos

### Ten duos

1. **Hob + Wrenna: The Bell and the Flood.** Hob's seventh toll stuns a cluster. Wrenna's Sounding lands on the stunned group for double damage. The squad's hits ring Hob's tolls, so everyone is building toward Wrenna's flood. It's also a story: Hob knows what sank Lirr and avoids Wrenna in the halls, but in the arena they need each other.
2. **Sena + Kallix: Tie and Light.** Sena's Knot ties two enemies together and her basics tether more. Kallix's Bellows sets the thread on fire and the flame runs down every thread to every enemy attached. It's a visible fuse, so everyone on screen sees it coming and it still lands.
3. **Lysandra + Ophira: The Sisters.** The Gorgon's Garden turns a group to stone. Ophira's Look at Me shatters every statue below 25% HP. In Ophira's super she finally looks at her sister and clears the stone from her hands. It's a setup-and-execute pair with the strongest lore payoff in the roster.
4. **Aurvan + Hespera: Eclipse.** If both supers land within 5 s, the moon passes over the dead sun, the arena goes dark and the sun's impact deals +30%. Aurvan's moon gathers the enemy team under the spot where the sun falls. It's the biggest moment two players can make together.
5. **Nyssa + Kerberon: Passage to the Gate.** Passage Paid always ends at Kerberon if he's within 30 m, so Nyssa ferries the whole squad into his three-headed rampage. His Honey Cake guards Nyssa for 5 s instead of 3. The gate-dog and the ferryman's daughter look after each other.
6. **Moss + Thimble: Wrong Turn.** Moss boxes an enemy group in with Maze Walls. Thimble swaps the enemy carry into the box, or swaps a trapped ally out. Two champions who both move people, so the fight's geography keeps changing.
7. **Vell + Camedown: Lost and Lifted.** Lost Without Trace removes the enemy frontline for up to 5 s. Camedown's Top of the Stair drops the squad onto an unprotected backline. The two heroes who know the gods are gone, working together.
8. **Pyrrhos + Oko: The Light Guides the Sentry.** Oko's beam lights Pyrrhos's patrol lane and Pyrrhos marches a fourth pass. Pyrrhos's boulders give Oko cover. The sentry who never stopped walking and the keeper who never let the light go out.
9. **Ione + The Sleeper: The Song That Answered.** Ione's song charges the Sleeper's super by 25%, and charmed enemies in the flood fall asleep instead of walking. Both supers together lock the enemy team in a slow, singing sea. Lore: the thing under the water was always listening for her.
10. **Ysolt + Jory: Death Collects.** With Jory on her team, Ysolt's Foreclosure executes every hooked debtor below 15% HP. Jory's Spare Hourglass keeps Ysolt alive while she draws everyone's debt. It's a long-fight duo that ends with the whole enemy team dragged in at once.

### Five trios

1. **Wrenna + Hob + The Sleeper: The Drowned City.** The Sleeper floods the arena, so everything is Soaked and enemies can't dash. Hob's tolls stack to seven while they wade, then the stun. Wrenna's Sounding hits Soaked, stunned targets for double damage plus 30%. It's slow, crushing control, and all three heroes are tied to the night Lirr sank.
2. **Aurvan + Sena + Kallix: Pull, Tie, Burn.** Aurvan's Tidal Pull clusters the enemy team. Sena's Knot ties the cluster together. Kallix's Bellows lights the thread and his chain sparks hop through the whole group. Every enemy is linked to every other enemy, which is very loud and very satisfying to watch.
3. **Corrin + Mott + Jory: The Last Vigil.** Corrin's orchard is a fort with One More Year, Mott wraps everyone in wax shields with wisps that punish attackers, and Jory's Covering Shift means nobody dies for 7 s. Three supports who make the squad close to unkillable, with a lore thread: the orchard, the grave-digger and Death's apprentice.
4. **Lysandra + Ophira + Oko: Statue Garden.** Lysandra petrifies a group, Oko's Fresnel Lance pierces the line of statues (armour already shredded by Chisel Split), and Ophira shatters what's left. Ophira's Polished Shield on Oko reflects anything aimed at the sniper. The frontline, the marksman and the support each have a clear job.
5. **Halven + Nyssa + Fenwick: The Hunt.** Halven throws his head as a Lookout to find an isolated enemy. Nyssa ferries the squad onto them. Fenwick Name Tags the target and chain-leaps through anyone who comes to help. It's a fast dive comp built on scouting, mobility and finishing, with the herald shouting the whole way.

## 5. Shared UAL base clips to import once

These are the base clips the kits above build on. Import each one once and share it across all heroes through retargeting; per-hero work is retiming and pose layers on top. The counts come from scanning every animation, beat sheet and body-language entry above.

| Base clip | Category | Heroes using it | Count |
|---|---|---|---|
| `Idle_Loop` | Idle | Wrenna Vael, Hob Tallagh, Corrin Ashgraft, Brother Mott, Nyssa Obel, Pyrrhos, Moss, Ione, Fenwick Marl, Thimble, The Unwritten, Lysandra Kole, Kallix, Oko, Madame Ysolt Crane, Sir Halven, Sena, Jory Ashby, The Sleeper, The One Who Came Down, Vell, Hespera, Old Kerberon, Ophira, Tychon, Aurvan, Ourax | 27 |
| `Roll` | Dodge | Wrenna Vael, Hob Tallagh, Corrin Ashgraft, Brother Mott, Nyssa Obel, Pyrrhos, Moss, Ione, Fenwick Marl, Thimble, The Unwritten, Lysandra Kole, Kallix, Oko, Madame Ysolt Crane, Sir Halven, Sena, Jory Ashby, The Sleeper, The One Who Came Down, Vell, Hespera, Old Kerberon, Ophira, Tychon, Aurvan, Ourax | 27 |
| `Jog_Fwd_Loop` | Locomotion | Wrenna Vael, Hob Tallagh, Corrin Ashgraft, Brother Mott, Nyssa Obel, Pyrrhos, Moss, Ione, Fenwick Marl, The Unwritten, Lysandra Kole, Oko, Madame Ysolt Crane, Sir Halven, Sena, Jory Ashby, The Sleeper, The One Who Came Down, Vell, Hespera, Old Kerberon, Ophira, Aurvan, Ourax | 24 |
| `Walk_Loop` | Locomotion | Wrenna Vael, Hob Tallagh, Corrin Ashgraft, Brother Mott, Nyssa Obel, Moss, Ione, Fenwick Marl, Thimble, The Unwritten, Lysandra Kole, Kallix, Oko, Sena, Jory Ashby, The One Who Came Down, Vell, Hespera, Old Kerberon, Ophira, Tychon, Aurvan, Ourax | 23 |
| `Death01` | Death | Wrenna Vael, Corrin Ashgraft, Brother Mott, Pyrrhos, Ione, Thimble, The Unwritten, Lysandra Kole, Kallix, Madame Ysolt Crane, Sir Halven, The Sleeper, The One Who Came Down, Vell, Hespera, Ophira, Aurvan, Ourax | 18 |
| `Hit_Chest` | Hit reaction | Wrenna Vael, Corrin Ashgraft, Brother Mott, Pyrrhos, Ione, The Unwritten, Lysandra Kole, Kallix, Sir Halven, Sena, The Sleeper, The One Who Came Down, Vell, Hespera, Old Kerberon, Ophira, Aurvan, Ourax | 18 |
| `Spell_Simple_Shoot` | Spellcasting | Wrenna Vael, Hob Tallagh, Corrin Ashgraft, Brother Mott, Moss, Ione, Thimble, The Unwritten, Kallix, Sir Halven, Sena, The One Who Came Down, Hespera, Old Kerberon, Ophira, Tychon, Aurvan, Ourax | 18 |
| `Spell_Simple_Enter` | Spellcasting | Wrenna Vael, Hob Tallagh, Corrin Ashgraft, Brother Mott, Nyssa Obel, Moss, Ione, Kallix, Oko, Sir Halven, Jory Ashby, The One Who Came Down, Vell, Hespera, Ophira, Aurvan | 16 |
| `Interact` | Tool / interaction | Wrenna Vael, Brother Mott, Nyssa Obel, Moss, Ione, Thimble, The Unwritten, Kallix, Sena, Jory Ashby, Vell, Hespera, Ophira, Tychon, Aurvan | 15 |
| `OVERHAND_THROW` | Throw | Wrenna Vael, Corrin Ashgraft, Brother Mott, Nyssa Obel, Pyrrhos, Moss, Fenwick Marl, Thimble, Oko, Madame Ysolt Crane, Sir Halven, Jory Ashby, Vell, Hespera, Tychon | 15 |
| `Hit_Head` | Hit reaction | Hob Tallagh, Nyssa Obel, Moss, Fenwick Marl, Thimble, Oko, Madame Ysolt Crane, Jory Ashby, Tychon | 9 |
| `Death02` | Death | Hob Tallagh, Nyssa Obel, Moss, Fenwick Marl, Sena, Jory Ashby, Old Kerberon, Tychon | 8 |
| `Sitting_Idle_Loop` | Sitting | Fenwick Marl, Thimble, The Sleeper, The One Who Came Down, Hespera, Old Kerberon, Aurvan, Ourax | 8 |
| `Spell_Simple_Idle_Loop` | Spellcasting | Wrenna Vael, Corrin Ashgraft, Brother Mott, Ione, Kallix, Jory Ashby, Vell, Aurvan | 8 |
| `Sword_Attack` | Melee | Hob Tallagh, The Unwritten, Lysandra Kole, Madame Ysolt Crane, Sir Halven, Sena, The Sleeper, Ourax | 8 |
| `Fixing_Kneeling` | Tool / interaction | Wrenna Vael, Corrin Ashgraft, Pyrrhos, Ione, The Unwritten, Lysandra Kole, The Sleeper | 7 |
| `MELEE_HOOK` | Melee | The Unwritten, Kallix, Madame Ysolt Crane, Sir Halven, The Sleeper, Hespera, Aurvan | 7 |
| `Punch_Cross` | Melee | Hob Tallagh, Nyssa Obel, Pyrrhos, The Unwritten, Lysandra Kole, Sir Halven, Old Kerberon | 7 |
| `Punch_Jab` | Melee | Hob Tallagh, Brother Mott, Pyrrhos, The Unwritten, Lysandra Kole, Sir Halven, Old Kerberon | 7 |
| `Idle_Talking_Loop` | Idle | Hob Tallagh, Fenwick Marl, Madame Ysolt Crane, Jory Ashby, Aurvan, Ourax | 6 |
| `MELEE_JUMP_LAND` | Melee | Hob Tallagh, Pyrrhos, Moss, The One Who Came Down, Old Kerberon, Ourax | 6 |
| `PickUp_Table` | Tool / interaction | Brother Mott, Pyrrhos, Madame Ysolt Crane, Vell, Old Kerberon, Ourax | 6 |
| `Sprint_Loop` | Locomotion | Wrenna Vael, Moss, Fenwick Marl, Thimble, Kallix, Tychon | 6 |
| `NINJUMP_JUMP` | Jump | Fenwick Marl, Lysandra Kole, The One Who Came Down, Old Kerberon | 4 |
| `SWORD_DASH` | Melee | Nyssa Obel, Fenwick Marl, The Unwritten, Old Kerberon | 4 |
| `Crouch_Fwd_Loop` | Locomotion | Fenwick Marl, The Unwritten, Old Kerberon | 3 |
| `Dance_Loop` | Emote | Ione, Thimble, Tychon | 3 |
| `IDLE_SHIELD` | Idle / combat stance | Lysandra Kole, Old Kerberon, Ophira | 3 |
| `Walk_Formal_Loop` | Locomotion | Pyrrhos, Madame Ysolt Crane, Sir Halven | 3 |
| `PLANT_SEED` | Farming | Corrin Ashgraft, Thimble | 2 |
| `Pistol_Aim_Neutral` | Ranged | Thimble, Oko | 2 |
| `Pistol_Shoot` | Ranged | Nyssa Obel, Thimble | 2 |
| `Push_Loop` | Tool / interaction | The Sleeper, Hespera | 2 |
| `Sitting_Enter` | Sitting | Oko, Ourax | 2 |
| `WAVE` | Emote | Thimble, Jory Ashby | 2 |
| `COUGHING` | Emote | Ione | 1 |
| `Crouch_Idle_Loop` | Locomotion | Fenwick Marl | 1 |
| `HARVEST` | Farming | Hob Tallagh | 1 |
| `Jump_Land` | Jump | Nyssa Obel | 1 |
| `LAYFACEUP` | Lying | Moss | 1 |
| `NINJUMP_LAND` | Jump | Fenwick Marl | 1 |
| `NINJUMP_SLASH` | Melee | Fenwick Marl | 1 |
| `NINJUMP_SPIN` | Melee | Nyssa Obel | 1 |
| `Sword_Idle` | Melee | Sena | 1 |
| `ZOMBIE_WALK_FWD` | Locomotion | The Sleeper | 1 |

Two non-hero motions are shared too: `victim_dance` (enemies caught in Thimble's Fairy Ring, from `Dance_Loop`) and `victim_hold_the_sky` (enemies pinned by Ourax, from `Idle_Loop` with both arms overhead). Victim reactions such as the Rip Current slide (`SLIDE`), Kneel and Self-Seen are played on the enemy hero's own rig, so they must exist for every hero.

## 6. Shared technical VFX building blocks

Every hero effect above is built from these systems. They are written once in the three.js client, and heroes only supply textures, meshes, colours and parameters.

- **Ally/enemy tint rule.** Each effect instance carries a `team` and an `owner`. A single shader uniform switches the rim: enemy-harmful effects render a red rim (`#E03A3A`) for viewers on the other team, and a soft white outline in the caster's palette for allies. Decals, zones, tethers and projectiles all read the same uniform, so the rule can't be forgotten per effect.
- **Ribbon trail system.** A pooled camera-facing strip mesh (16-32 segments) that follows a bone socket or projectile. It has width, colour and alpha curves over its lifetime and a scrolling texture slot (map ink, mist, embers, chain links, yarn, sound waves). It's used by almost every projectile and swing. Fallback: 8 segments and no texture scroll.
- **Mesh trail / afterimage.** Draws 2-3 fading copies of a skinned sub-mesh at previous poses (Pyrrhos's arms, Fenwick's leaps, Ophira's mirror copies). Fallback: one copy.
- **Ground decal system.** Projected quads on a flat-ish arena floor with a pooled atlas of decals: scorch, crack, puddle, rings, maps, clock faces, tags. Each decal has a fade-in, a hold and a fade-out, plus a dissolve mask for effects that dry or crumble out from the edges. Hard cap of 48 live decals, with the oldest friendly decals culled first.
- **Telegraph system.** The same decal system with a dedicated shader: a fill that grows over the windup time, a countdown ring, and the team-dependent rim. It is never culled and always draws above other decals.
- **Flipbook shader.** One unlit or additive shader that reads a sprite-sheet atlas (4x4 or 8x8) with frame rate, random start frame and soft-particle depth fade. It's used for impacts, splashes, jaws, hands, moths, villagers and smoke.
- **Particle system.** A GPU-instanced point or quad particle system with emitter shapes (cone, ring, sphere, mesh surface, bone socket), gravity, drag and colour-over-life. Budget: 1,500 live particles on mid-range phones, and each hero effect declares a low-quality count.
- **Status overlay shader.** A per-hero material layer with parameters: a height mask (stone, wax, bronze, frost, water climbing the legs), a fresnel shell (wax shield, polished mirror, bark), a tint or desaturation, and an emissive pulse. Up to 2 overlays at once per hero; extra statuses fall back to icons only.
- **Head-slot status icons.** A fixed billboard slot above every hero for status sprites: toll rings, debt numbers, name tags, eye coins, appointment cards, dice faces. It's sorted by priority, with a maximum of 3 visible.
- **Tether and rope system.** A verlet rope of 6-12 segments rendered as a ribbon between two sockets, with break distance, tension tint and a 'carry fire' texture swap (used by Kallix's Bellows). It's used for threads, chains, vines, ropes, guard links and guiding beams.
- **Hitscan beam.** A stretched quad or cylinder between two points with a scrolling texture, an impact flare sprite and a light. It's used by Oko, Ione's guiding light and Ophira's gaze. Fallback: a single additive quad.
- **Homing projectile controller.** A shared script with speed, turn rate, arc height, spin and bounce or ricochet rules (mirror-angle bounce off flagged surfaces). It also handles boomerang returns and hover-then-return (Jory).
- **Spawned terrain.** Pooled instanced meshes with colliders and HP: maze walls, marble steps, boulders, gates, mirrors, trees, card walls, bells. They register as terrain for wall-stuns, high ground and line of sight.
- **Prop socket system.** Named attachment points on the standard skeleton (hand_r, hand_l, lowerarm_l, spine_03, head, hips) that props can move between at runtime: Halven's lantern, Sena's shears, Ione's mouth cage, Jory's skull, Vell's halo, Ourax's sky patch. Includes 'detach to simple physics' for falling props.
- **Material charge masks.** An emissive mask channel on every hero texture, driven by a 0-1 super-charge value: Wrenna's tattoos, Hob's helmet crack, Nyssa's coin scales, Kallix's grate, Aurvan's moon. This is how the super charge shows on the body, with no extra meshes.
- **Texture-swap expressions.** Small per-hero eye or face texture sets swapped by script: Halven's four head faces, Kerberon's side-head eyes, Tychon's dice-pip pupils. It replaces facial bones.
- **Vertex-shader motion.** Wind and sway on cloth hems, hair cards, Ophira's snakes, Fenwick's and Kerberon's tails and Ourax's trees. It's driven by a per-vertex weight painted in the mesh's vertex colours, so no extra bones are needed.
- **Screen passes.** Arena-wide passes: night (Oko, Fenwick, the Eclipse), a fog tint (Ione), a violet dusk tint inside Hespera's ring, plus enemy-only screen overlays (Moss's Lost vignette, Oko's blind, Vell's coat lining). Each is a cheap fullscreen colour and vignette, never a blur.
- **Water plane.** A flat plane with scrolling normals, depth tint and a decal layer showing drowned Lirr under the surface. It's used by the Sleeper's flood, Wrenna's wave and Nyssa's river. Fallback: a tinted decal with animated normals only.
- **Fallback tiers.** Each effect lists a low-tier fallback. The client picks a tier by device benchmark and drops to it automatically when the frame time goes above 22 ms for 1 s during a fight.

## 7. Heroes that needed workarounds for the humanoid skeleton

- **Old Kerberon.** Three heads, one skeleton. The three heads are one rigid piece skinned to the neck and head bones, so they turn together. The sleeping side heads never move on their own; their state is shown with eye texture swaps (shut, twitching, open), ash snore particles and a vertex-shader ear twitch. In his super, two person-sized spectral dog heads (separate prop meshes on the shoulder bones) do the fighting. His ghost hounds are spawned VFX meshes with a baked morph-target run loop and no skeleton.
- **Ourax.** A village on his shoulders and one hand always holding the sky. The houses and trees are part of his mesh, with a vertex-shader sway on the trees. The villagers are billboard flipbook sprites placed on the shoulder terrain. The raised left arm is an additive pose layer applied on top of every clip, with a sky-patch billboard on the palm.
- **Sir Halven.** Headless, with his head in a lantern at his hip. The head is a prop with four face textures, moved by the prop socket system between the hip, the hand and a thrown ward. The empty neck bone drives nothing visible.
- **Aurvan.** A dragon in human shape. There are no wings or tail on the mesh. His dragon nature is a shadow decal three times his size that follows him, a 12 m wing-beating shadow skill, a dragon-jaw silhouette in his breath, and a chest-moon emissive.
- **Ophira.** Snake hair. The snakes are mesh hair cards with a vertex-shader lift-and-turn and an eye-glow emissive, never bones.
- **Fenwick.** A wolf's tail and ears. The tail is skinned to the hips bone with a vertex-shader sway, and his flinch uses a head duck instead of moving the ears. His all-fours sprint is the crouch-forward clip retimed fast.
