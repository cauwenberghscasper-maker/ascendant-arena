// Shared by the game and asset review. Bone rotations only: no frame allocations.
const clamp = (x, hi = 1) => Math.min(hi, Math.max(0, Number.isFinite(x) ? x : 0));
const acos = value => Math.acos(Math.min(1, Math.max(-1, value)));
export function bindHeroMotion(model) {
  const parts = {};
  for (const name of ['armL', 'armR', 'elbowL', 'elbowR', 'handL', 'handR', 'legLBone', 'legRBone', 'kneeL', 'kneeR', 'ankleL', 'ankleR']) {
    parts[name] = model.getObjectByName(name);
    if (!parts[name]) return null;
  }
  parts.motionState = { attack: 0, move: 0 };
  parts.eyes = [model.getObjectByName('eyeL'), model.getObjectByName('eyeR')].filter(Boolean);
  return parts;
}
function poseLeg(hip, knee, ankle, phase, move) {
  const upper = Math.hypot(knee.position.y, knee.position.z), lower = Math.hypot(ankle.position.y, ankle.position.z);
  const restY = knee.position.y + ankle.position.y, restZ = knee.position.z + ankle.position.z;
  // Foot travels backward during stance; lifts only while recovering forward.
  const y = restY + Math.max(0, -Math.sin(phase)) * .035 * move;
  const z = restZ + Math.cos(phase) * .065 * move;
  const distance = Math.min(upper + lower - .00001, Math.max(Math.abs(upper - lower) + .00001, Math.hypot(y, z)));
  const bend = Math.PI - acos((upper * upper + lower * lower - distance * distance) / (2 * upper * lower));
  const pitch = Math.atan2(-z, -y) - acos((upper * upper + distance * distance - lower * lower) / (2 * upper * distance));
  const restUpper = Math.atan2(-knee.position.z, -knee.position.y);
  const restLower = Math.atan2(-ankle.position.z, -ankle.position.y);
  const h = (pitch - restUpper) * move, k = (bend - restLower + restUpper) * move;
  hip.rotation.set(h, 0, 0); knee.rotation.set(k, 0, 0); ankle.rotation.set(-h - k, 0, 0);
}
export function animateHeroMotion(p, phase, move, attack, time, delta = 1 / 60) {
  if (!p) return;
  const dt = clamp(delta, .05), state = p.motionState;
  state.move += (clamp(move) - state.move) * (1 - Math.exp(-dt * 14));
  state.attack += (clamp(attack) - state.attack) * (1 - Math.exp(-dt * 24));
  const m = state.move, a = state.attack, t = Number.isFinite(time) ? time : 0;
  const ph = Number.isFinite(phase) ? phase : 0, stride = Math.sin(ph) * m;
  const breath = Math.sin(t * 2.1) * .018 * (1 - m);
  // +X hand aims/strikes, the other arm counterbalances. Hands inherit elbow motion.
  p.armL.rotation.set(-stride * .25 + a * .10 + breath, 0, .16 - m * .04 + breath);
  p.armR.rotation.set(stride * .25 - a * .60 + breath, -a * .08, -.16 + m * .04 - breath);
  p.elbowL.rotation.set(-.05 - m * .08 - a * .12, 0, 0);
  p.elbowR.rotation.set(-.05 - m * .08 - a * .30, 0, 0);
  p.handL.rotation.set(0, 0, 0); p.handR.rotation.set(-a * .08, 0, 0);
  poseLeg(p.legLBone, p.kneeL, p.ankleL, ph, m);
  poseLeg(p.legRBone, p.kneeR, p.ankleR, ph + Math.PI, m);
  const blinkPhase = (t + ph * .025) % 4.6;
  const open = blinkPhase < .12 ? 1 - Math.sin(blinkPhase / .12 * Math.PI) * .88 : 1;
  for (const eye of p.eyes) eye.scale.y = (eye.userData.openEyeY || 1) * open;
}
