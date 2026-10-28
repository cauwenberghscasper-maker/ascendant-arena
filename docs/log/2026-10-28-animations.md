# Wind in the trees, pets that move, and the red smoke check fixed (28 Oct 2026, branch `claude/animations`)

Casper: focus only on adding animations and make sure everything works as intended.

What the player sees:
- **Wind:** tree crowns, grass tufts and flowers lean and bob gently, more towards the top, each in its own rhythm
  and on the same clock as the ground's grass wind. Coral sways a little more (the current); crystal and dead trees
  stand still. `swayMaterial` in `48-world-models.js` (vertex shader only: no extra triangles or draw calls; the
  shadow stays still), `sway` option on the tree, LOD, tuft and flower sets in `44-world-view.js`.
- **Pets:** generated pet models (`assets/pet/`, PR #67) had no motion of their own: the old wobble only moved the
  hidden code-built shape. Now a model breathes when idle, hops and leans forward while following, rears back and
  lunges when it attacks, and squashes on landing (`animateCompanionModel` in `46-camera-quality.js`). Works as soon
  as #67 is merged; the code-built pets are unchanged.

Fixed (works as intended):
- **The red "checks" on GitHub since 25 Oct:** the smoke test starts, plays, ends and leaves a Lanes match at once;
  on the next frame the queued "match started" event tried to build the battlefield of a match that no longer
  existed ("Cannot read properties of null (reading 'structs')"). Because the event queue was only emptied after
  every handler ran, the throw replayed the same events every frame (no more effects or sounds until reload). Now
  the Lanes view skips an ended match (`47e-lanes-view.js`), and `processEvents` always empties the queue
  (`try/finally` in `62-events-fx.js`). A player could hit this when a match ended as it started. The kill feed
  read the gone match's score too (only when someone died, so the check failed now and then): it shows the score only
  while the match exists, and the smoke test now always queues a kill and a tower event after leaving.
- Smoke test failures are also written as GitHub annotations (`tools/check_smoke.cjs`), so a red check says which
  step failed without opening the log. `Companion` is on the local-preview `__dbg` hooks for tests.

Tested: `npm run check`; `npm run smoke` locally; in the browser: 712 swaying tree/grass cells built, frames differ
as the trees move, no shader or page errors; with the #67 pet models the bull breathes at rest and hops when the
hero walks.
Open: look at the sway strength on a phone (trees `0.03`, coral `0.05`, grass `0.14` of their height).
