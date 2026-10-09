// Authored KayKit clips. Upper-body attacks leave locomotion on the legs.
export function createKayKitMotion(THREE, model, clips, def) {
  const mixer = new THREE.AnimationMixer(model), source = new Map(clips.map(c => [c.name, c]));
  const upper = track => /^(chest|spine|head|upperarm|lowerarm|wrist|hand|elbow)/i.test(track.name);
  const actions = new Map();
  function action(name, mask = 'full') {
    const key = name + ':' + mask;
    if (actions.has(key)) return actions.get(key);
    const clip = source.get(name);
    if (!clip) return null;
    const tracks = clip.tracks.filter(t => mask === 'full' || (mask === 'upper' ? upper(t) : !upper(t)));
    const filtered = new THREE.AnimationClip(key, clip.duration, tracks);
    const a = mixer.clipAction(filtered); actions.set(key, a); return a;
  }
  const idle = action('Idle');
  const runs = ['Running_A','Walking_Backwards','Running_Strafe_Left','Running_Strafe_Right'].map(name=>({full:action(name),lower:action(name,'lower'),weight:0}));
  if (!idle || runs.some(r=>!r.full||!r.lower)) throw new Error('KayKit locomotion clips missing');
  idle.play(); for(const r of runs){r.full.play().setEffectiveWeight(0);r.lower.play().setEffectiveWeight(0)}
  let move = 0, lastAttack = -Infinity, lastHurt = -Infinity, previousAttack = 0;
  let overlay = null, overlayAge = 0, overlayDuration = 0, overlayWeight = 0;
  let dodge = null, dodgeAge = 0, dead = false, death = null;
  let previousX, previousZ;
  const lowerIdle = action('Idle', 'lower');
  lowerIdle.play(); lowerIdle.setEffectiveWeight(0);
  function trigger(name, duration) {
    const next = action(name, 'upper');
    if (!next) return;
    if (overlay && overlay !== next) overlay.stop();
    overlay = next; overlayAge = 0; overlayDuration = duration;
    overlay.reset().setLoop(THREE.LoopOnce, 1); overlay.clampWhenFinished = true;
    overlay.setEffectiveTimeScale(overlay.getClip().duration / duration).setEffectiveWeight(0).play();
  }
  return {
    mixer,
    update(e, delta) {
      const dt = Math.min(.05, Math.max(0, Number.isFinite(delta) ? delta : 0));
      if (e.alive === false && !dead) {
        dead = true; death = action('Death_A');
        if (death) { mixer.stopAllAction(); death.reset().setLoop(THREE.LoopOnce, 1).play(); death.clampWhenFinished = true; }
      }
      if (dead && e.alive !== false) { dead = false; mixer.stopAllAction(); idle.reset().play(); lowerIdle.reset().play(); for(const r of runs){r.full.reset().play();r.lower.reset().play()} overlay = dodge = null; }
      if (dead) { mixer.update(dt); return; }
      move += (Math.min(1, Math.max(0, e.moveAmt || 0)) - move) * (1 - Math.exp(-dt * 12));
      // Every shot has an event timestamp; remote peers use the attack impulse.
      const timestamp = Number.isFinite(e.lastAttack) ? e.lastAttack : -Infinity;
      if ((timestamp >= 0 && timestamp !== lastAttack) || (e.attackAnim > previousAttack + .25 && timestamp < 0)) {
        const clip = e.motionAction === 'spell' ? 'Spellcast_Raise' : e.motionAction === 'melee' ? '1H_Melee_Attack_Slice_Horizontal' : def.attack;
        const interval=timestamp-lastAttack;
        trigger(clip, /Melee|Raise/.test(clip) ? .48 : Math.min(.32,Math.max(.12,interval>0?interval:.32)));
      }
      lastAttack = timestamp; previousAttack = e.attackAnim || 0;
      if (e.lastHurt >= 0 && e.lastHurt !== lastHurt && !overlay) trigger('Hit_A', .24);
      lastHurt = e.lastHurt;
      if (e.dashT > 0 && !dodge) { dodge = action('Dodge_Forward'); dodgeAge = 0; if (dodge) { dodge.reset().setLoop(THREE.LoopOnce, 1); dodge.clampWhenFinished = true; dodge.setEffectiveTimeScale(dodge.getClip().duration / .3).play(); } }
      if (dodge) { dodgeAge += dt; if (dodgeAge >= .3) { dodge.stop(); dodge = null; } }
      overlayWeight = 0;
      if (overlay) {
        overlayAge += dt;
        overlayWeight = Math.min(1, overlayAge / .055, Math.max(0, (overlayDuration - overlayAge) / .10));
        overlay.setEffectiveWeight(overlayWeight);
        if (overlayAge >= overlayDuration) { overlay.stop(); overlay = null; }
      }
      const body = dodge ? 0 : 1;
      idle.setEffectiveWeight((1 - move) * (1 - overlayWeight) * body);
      lowerIdle.setEffectiveWeight((1 - move) * overlayWeight * body);
      if (overlay) overlay.setEffectiveWeight(overlayWeight * body);
      // Keep duplicate lower-body tracks phase locked through transitions.
      lowerIdle.time = idle.time;
      let speed = 1, direction=0;
      if (previousX !== undefined && dt > 0 && e.dashT <= 0) {
        const dx=e.x-previousX,dz=e.z-previousZ,distance = Math.hypot(dx,dz),facing=e.facing||0;
        speed = Math.min(1.65, Math.max(.65, distance / dt / 6));
        if(distance>.0001){const forward=dx*Math.sin(facing)+dz*Math.cos(facing),side=dx*Math.cos(facing)-dz*Math.sin(facing);direction=Math.abs(side)>Math.abs(forward)?(side>0?3:2):(forward<0?1:0)}
      }
      previousX = e.x; previousZ = e.z;
      for(let i=0;i<runs.length;i++){const r=runs[i];r.weight+=((i===direction?1:0)-r.weight)*(1-Math.exp(-dt*14));r.full.setEffectiveWeight(move*r.weight*(1-overlayWeight)*body).setEffectiveTimeScale(speed);r.lower.time=r.full.time;r.lower.setEffectiveWeight(move*r.weight*overlayWeight*body).setEffectiveTimeScale(speed)}
      mixer.update(dt);
    },
    dispose() { mixer.stopAllAction(); mixer.uncacheRoot(model); },
  };
}
