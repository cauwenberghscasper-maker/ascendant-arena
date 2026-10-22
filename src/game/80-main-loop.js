// ---------------------------------------------------------------------
// 10. MAIN LOOP — fixed-timestep simulation, render separate
// ---------------------------------------------------------------------
const FRAME_MS = 1000 / 60, FRAME_MS_120 = 1000 / 120;
let lastFrame = performance.now(), nextFrameAt = lastFrame, simAcc = 0, saveT = 0, achT = 0, shadowAcc = 1;
function frame(now) {
  requestAnimationFrame(frame);
  // Cap at 120 Hz (60 Hz with the 60 FPS option) even on faster screens. Accumulate elapsed
  // time between processed frames so simulation stays at its existing fixed timestep.
  const hz120 = !(G.profile && G.profile.settings.fps60), ms = hz120 ? FRAME_MS_120 : FRAME_MS;
  Q.raf++;
  if (now < nextFrameAt - (hz120 ? 1 : 0.5)) return;
  nextFrameAt = now < nextFrameAt ? nextFrameAt + ms : now + ms - ((now - nextFrameAt) % ms); // an early frame keeps the grid
  let dt = (now - lastFrame) / 1000; lastFrame = now;
  if (dt > 0.1) dt = 0.1;
  fxK = hz120 ? Math.min(1, dt * 60) : 1;
  if (G.paused) return;
  buildPlayerIntent();
  // the open world keeps running behind menus (you are safe while one is open); Showdown pauses
  if (!G.modal || (G.mode === 'hub' && G.started)) {
    simAcc += G.slowT > 0 ? dt * 0.3 : dt; G.slowT -= dt; // a Radiant drop slows the world for a moment
    let n = 0;
    while (simAcc >= CFG.sim.step && n < CFG.sim.maxSteps) { if (hz120) Interp.snap(); simStep(CFG.sim.step); simAcc -= CFG.sim.step; n++; }
    if (n === CFG.sim.maxSteps) simAcc = 0;
  }
  processEvents();
  // modal queue: class choice, boss loot, arena results
  if (!G.modal) {
    if (G.mode === 'arena' && G.arena && G.arena.result && G.arena.phase === 'over' && G.arena.overT <= 0) openResults();
    else if (G.mode === 'hub' && G.pendingClassChoice && !G.profile.cls) openClassChoice();
    else if (G.mode === 'hub' && G.lootQueue.length) openLoot(G.lootQueue.shift());
    else if (G.mode === 'hub' && G.riftResult) { const rr = G.riftResult; G.riftResult = null; openRiftResult(rr); }
    else if (G.mode === 'hub' && G.siegeResult) { const sr = G.siegeResult; G.siegeResult = null; openSiegeResult(sr); }
  }
  const t = now / 1000;
  mpUpdate(dt);
  if (hz120) Interp.apply(simAcc / CFG.sim.step);
  syncViews(dt, t);
  updateGearAura(dt); updateProjectileMeshes(dt); HeroFX.update(dt, HeroSupers.marked); updateParticles(dt); updateRings(dt); updateAim(dt);
  if (G.mode === 'hub') { updateHubProps(t); updateRiftProps(t); } else updateArenaProps(t);
  updateCamera(dt);
  updateCompanion(dt,t);
  // the sun's shadow map at most 60 times a second: the world steps at 60 Hz, so at 120 Hz every other redraw was the same
  shadowAcc += dt; if (shadowAcc >= 0.0155) { shadowAcc = 0; renderer.shadowMap.needsUpdate = true; }
  Pixel.render();
  updateTags(); updateDmgNumbers(dt);
  Interp.restore();
  updateHUD(dt);
  updateDoll();
  qualityTick(dt);
  achT += dt; if (achT > 1) { achT = 0; if (G.started) checkAchievements(); }
  saveT += dt; if (saveT > 4 && G.dirty) { saveT = 0; G.dirty = false; saveNow(false); }
}


// --- 120 Hz: draw between simulation steps -------------------------------------------------------
// The simulation always steps at 60 Hz. Drawn at 120 Hz, every other frame would show the same positions
// while the camera keeps gliding, which reads as jitter. So each frame draws the movers part way from their
// previous step to their latest one, then puts the real positions back before anything else reads them.
const Interp = {
  steps: 0, saved: [],
  bodies(fn) {
    if (G.mode === 'arena' && G.arena) { for (const f of G.arena.fighters) fn(f); }
    else { for (const f of G.hubFighters) fn(f); for (const e of G.enemies) fn(e); if (G.boss) fn(G.boss); }
    for (let i = 0; i < PROJ_MAX; i++) { const p = projectiles[i]; if (p && p.active) fn(p); }
  },
  snap() { const s = ++this.steps; this.bodies((b) => { b.ix = b.x; b.iy = b.y; b.iz = b.z; b.iStep = s; }); },
  apply(k) {
    k = clamp(k, 0, 1); const s = this.steps, out = this.saved;
    this.bodies((b) => {
      // only bodies that existed before the latest step and moved a walkable distance (respawns and teleports snap)
      if (b.iStep !== s || Math.abs(b.x - b.ix) + Math.abs(b.z - b.iz) > 3) return;
      out.push(b, b.x, b.y, b.z);
      b.x = b.ix + (b.x - b.ix) * k; b.z = b.iz + (b.z - b.iz) * k;
      if (typeof b.y === 'number' && typeof b.iy === 'number') b.y = b.iy + (b.y - b.iy) * k;
    });
  },
  restore() { const o = this.saved; for (let i = 0; i < o.length; i += 4) { const b = o[i]; b.x = o[i + 1]; if (o[i + 2] !== undefined) b.y = o[i + 2]; b.z = o[i + 3]; } o.length = 0; },
};
