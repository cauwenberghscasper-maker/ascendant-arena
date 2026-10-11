// ---------------------------------------------------------------------
// 10. MAIN LOOP — fixed-timestep simulation, render separate
// ---------------------------------------------------------------------
const FRAME_MS = 1000 / 60;
let lastFrame = performance.now(), nextFrameAt = lastFrame, simAcc = 0, saveT = 0, achT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  // Keep a 60 Hz cadence even on 90/120/144 Hz screens. Accumulate elapsed time
  // between processed frames so simulation stays at its existing fixed timestep.
  if (now < nextFrameAt - 0.5) return;
  nextFrameAt = now + FRAME_MS - (Math.max(0, now - nextFrameAt) % FRAME_MS);
  let dt = (now - lastFrame) / 1000; lastFrame = now;
  if (dt > 0.1) dt = 0.1;
  if (G.paused) return;
  buildPlayerIntent();
  // the open world keeps running behind menus (you are safe while one is open); Showdown pauses
  if (!G.modal || (G.mode === 'hub' && G.started)) {
    simAcc += dt;
    let n = 0;
    while (simAcc >= CFG.sim.step && n < CFG.sim.maxSteps) { simStep(CFG.sim.step); simAcc -= CFG.sim.step; n++; }
    if (n === CFG.sim.maxSteps) simAcc = 0;
  }
  processEvents();
  // modal queue: class choice, boss loot, arena results
  if (!G.modal) {
    if (G.mode === 'arena' && G.arena && G.arena.result && G.arena.phase === 'over' && G.arena.overT <= 0) openResults();
    else if (G.mode === 'hub' && G.pendingClassChoice && !G.profile.cls) openClassChoice();
    else if (G.mode === 'hub' && G.lootQueue.length) openLoot(G.lootQueue.shift());
    else if (G.mode === 'hub' && G.riftResult) { const rr = G.riftResult; G.riftResult = null; openRiftResult(rr); }
  }
  const t = now / 1000;
  syncViews(dt, t);
  mpUpdate(dt);
  updateGearAura(dt); updateProjectileMeshes(); updateParticles(dt); updateRings(dt); updateAim(dt);
  if (G.mode === 'hub') { updateHubProps(t); updateRiftProps(t); } else updateArenaProps(t);
  updateCamera(dt);
  updateCompanion(dt,t);
  Pixel.render();
  updateTags(); updateDmgNumbers(dt); updateHUD(dt);
  updateDoll();
  qualityTick(dt);
  achT += dt; if (achT > 1) { achT = 0; if (G.started) checkAchievements(); }
  saveT += dt; if (saveT > 4 && G.dirty) { saveT = 0; G.dirty = false; saveNow(false); }
}

