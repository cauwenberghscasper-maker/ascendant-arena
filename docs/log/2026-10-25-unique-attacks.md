# 2026-10-25 · Unique basic attack patterns

**Asked (Casper):** most attack patterns look almost the same; give heroes more special and unique attacks.

**Changed for the player:** shots can now curve (alternating left/right), speed up in flight, or sway side to side (`curve`, `accel`, `weave`/`weaveHz` on an attack; `31-combat.js`). 21 of the 27 heroes got their own pattern from their story: Hob's bell tolls in a full circle, Mott drips three quick wax drops, Nyssa's coin arcs, Pyrrhos sweeps three after-images, Moss's thread wanders, Ione's note dances on a melody line, Thimble pings two buttons, the Unwritten's letter drifts then speeds up, Lysandra sprays a fan of chips, Kallix's ember flickers, Ysolt's ledger flies out and back, Halven's lantern swings in an arc, Sena's thread curls, Jory's keyring loops, the Sleeper rolls a slow wall of seawater, Camedown raises three stair-steps in a line, Vell's lost thing tumbles, Kerberon's hound trots then sprints, Ourax sweeps a huge slow wave, Wrenna's vial flings droplets, Hespera's cinder bursts into a ring of five. Damage per volley kept about the same.

**Tested:** `npm run check`; every hero fired through the real sim in a headless browser (no errors). Local `npm run smoke` is timing-flaky on the slow sandbox (walk/shoot asserts by wall clock); CI runs it.

**Open:** playtest feel and balance per hero; aim previews for curving shots still draw straight.
