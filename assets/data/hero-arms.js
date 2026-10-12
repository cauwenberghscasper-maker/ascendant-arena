// Natural arm hang for the generated heroes. The shared KayKit clips were authored for wide, chunky bodies and
// hold the arms 40-50 degrees away from the torso; on slimmer painted heroes that reads as a stiff "scarecrow" pose.
// relaxArms() measures, per hero, how close to vertical the arm can hang before it would cut into the body
// (coat, belly, robe), then rewrites the upper-arm rotations of every clip so low arms swing toward that angle.
// Raised arms (attacks, casting, cheering) keep their height: the correction fades out above shoulder level.

const SIDES = ['l', 'r'];
const MAX_HANG = 0.56; // never hold an arm more than ~32 degrees out at rest
const LOCO = /^(Idle|Running|Walking|Hit_|Dodge|2H_Melee_Idle|Death)/;

// Smallest hang angle (radians from straight down, in the body's frontal plane) at which a straight arm of this
// hero clears its torso. Uses the bind (T) pose and the skin weights already in the mesh.
export function measureArmHang(THREE, model) {
  let mesh = null; model.traverse((o) => { if (o.isSkinnedMesh && !mesh) mesh = o; });
  if (!mesh) return null;
  model.updateMatrixWorld(true);
  const bones = mesh.skeleton.bones, idx = Object.fromEntries(bones.map((b, i) => [b.name, i]));
  const need = ['chest', 'upperarml', 'upperarmr', 'handl', 'handr', 'lowerarml', 'lowerarmr'];
  if (need.some((n) => idx[n] === undefined)) return null;
  const g = mesh.geometry, P = g.attributes.position, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight;
  const v = new THREE.Vector3(), torso = [], arm = { l: [], r: [] };
  const armBones = { l: [idx.upperarml, idx.lowerarml], r: [idx.upperarmr, idx.lowerarmr] }; // hands often hold props
  const anyArm = new Set([idx.upperarml, idx.lowerarml, idx.handl, idx.upperarmr, idx.lowerarmr, idx.handr]);
  for (let i = 0; i < P.count; i++) {
    let best = -1, bw = 0;
    for (let k = 0; k < 4; k++) { const w = SW.getComponent(i, k); if (w > bw) { bw = w; best = SI.getComponent(i, k); } }
    v.fromBufferAttribute(P, i); mesh.applyBoneTransform(i, v); v.applyMatrix4(mesh.matrixWorld); // bind pose, world space
    if (!anyArm.has(best)) torso.push(v.clone());
    else if (bw > 0.6) for (const s of SIDES) if (armBones[s].includes(best)) arm[s].push(v.clone());
  }
  const W = (n) => bones[idx[n]].getWorldPosition(new THREE.Vector3());
  const chest = W('chest'), out = {};
  for (const s of SIDES) {
    const S = W('upperarm' + s), E = W('lowerarm' + s), H = W('hand' + s);
    const L = S.distanceTo(E) + E.distanceTo(H);
    // arm thickness: how far the arm's own skin sits from its bone line
    const seg = new THREE.Line3(S, H), q = new THREE.Vector3(), ds = arm[s].map((p) => seg.closestPointToPoint(p, true, q).distanceTo(p)).sort((a, b) => a - b);
    const r = ds.length ? ds[Math.floor(ds.length * 0.5)] : L * 0.08;
    const side = Math.sign(S.x - chest.x) || (s === 'l' ? 1 : -1);
    // the body below the armpit: cloth hanging under the T-posed arm (sleeves, fringes) is not torso
    const body = torso.filter((p) => p.y < S.y - 0.2 * L), tol = Math.max(3, Math.round(body.length * 0.004));
    let hang = 1.2;
    for (let deg = 4; deg <= 70; deg += 1) {
      const a = deg * Math.PI / 180, dir = new THREE.Vector3(side * Math.sin(a), -Math.cos(a), 0);
      const A = S.clone().addScaledVector(dir, L * 0.2), B = S.clone().addScaledVector(dir, L), line = new THREE.Line3(A, B);
      let hit = 0;
      for (const p of body) { if (line.closestPointToPoint(p, true, q).distanceTo(p) < r * 0.85) { hit++; if (hit > tol) break; } }
      if (hit <= tol) { hang = a; break; }
    }
    out[s] = Math.min(hang, MAX_HANG);
  }
  // bodies are near-symmetric: a prop or strap on one side should not hold that whole arm out
  const l = Math.min(out.l, out.r + 0.21), r = Math.min(out.r, out.l + 0.21);
  return { l, r };
}

// Rewrite the upper-arm quaternion tracks of `clips` for this model. Returns new clips (the input is untouched).
// opts.extra: radians added to the measured hang (breathing room), opts.max: largest correction per frame.
export function relaxArms(THREE, clips, model, opts = {}) {
  const hang = opts.hang || measureArmHang(THREE, model);
  if (!hang) return clips;
  const extra = opts.extra ?? 0.07, maxDrop = opts.max ?? 0.95;
  model.updateMatrixWorld(true);
  const chest = model.getObjectByName('chest'); if (!chest) return clips;
  const cq = chest.getWorldQuaternion(new THREE.Quaternion()).invert();
  const down = new THREE.Vector3(0, -1, 0).applyQuaternion(cq).normalize();
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(cq).normalize();
  const child = {};
  for (const s of SIDES) { const lo = model.getObjectByName('lowerarm' + s); if (!lo) return clips; child[s] = lo.position.clone().normalize(); }
  const hchild = {}, side = {};
  for (const s of SIDES) {
    const hand = model.getObjectByName('hand' + s), ua = model.getObjectByName('upperarm' + s);
    if (!hand || !ua) return clips;
    hchild[s] = hand.position.clone().normalize();
    const p = ua.position.clone(); p.addScaledVector(down, -p.dot(down)).addScaledVector(fwd, -p.dot(fwd));
    side[s] = p.normalize();
  }
  const q = new THREE.Quaternion(), R = new THREE.Quaternion(), d = new THREE.Vector3(), axis = new THREE.Vector3();
  const qu = new THREE.Quaternion(), ql = new THREE.Quaternion(), qi = new THREE.Quaternion(), qh = new THREE.Quaternion(), qa = new THREE.Quaternion(), f =new THREE.Vector3(), g = new THREE.Vector3();
  return clips.map((clip) => {
    // locomotion and reactions get the full correction; attacks and casts only where the arm is low
    const loco = LOCO.test(clip.name), L0 = loco ? 1.8 : 1.35, L1 = loco ? 2.35 : 1.95, F0 = loco ? 0.8 : 0.55, F1 = loco ? 0.99 : 0.92;
    const tracks = clip.tracks.map((t) => {
      const m = /^upperarm([lr])\.quaternion$/.exec(t.name); if (!m) return t;
      const s = m[1], target = hang[s] + extra, copy = t.clone(), V = copy.values;
      for (let i = 0; i < V.length; i += 4) {
        q.fromArray(V, i); d.copy(child[s]).applyQuaternion(q);
        if (loco) {
          // walking, running, idling: keep the forward/back swing, remove only the outward spread
          // arms hang close beside the body: 6-14 degrees out (more only for a measured wide belly or coat)
          const o = d.dot(side[s]), lim = Math.sin(Math.min(LOCO_MAX, Math.max(LOCO_MIN, hang[s]))); if (o <= lim) continue;
          inward(f, d, side[s], o, lim, down);
          R.setFromUnitVectors(d, f); q.premultiply(R).normalize().toArray(V, i);
          continue;
        }
        const a = d.angleTo(down);                      // 0 = straight down, PI/2 = horizontal
        // only arms that hang low and to the side are pulled in; raised or reaching arms stay as authored
        const lift = 1 - smooth(L0, L1, a);
        const forward = Math.abs(d.dot(fwd));
        const lateral = 1 - smooth(F0, F1, forward);
        const theta = Math.min(maxDrop, Math.max(0, a - target)) * lift * lateral;
        if (theta < 1e-4) continue;
        axis.crossVectors(d, down); if (axis.lengthSq() < 1e-8) continue; axis.normalize();
        R.setFromAxisAngle(axis, theta); q.premultiply(R).normalize().toArray(V, i);
      }
      return copy;
    });
    // second pass (locomotion only): the KayKit run flings the forearms out sideways from bent elbows;
    // turn each forearm back toward the body's own plane so the arms pump beside the body
    if (loco) for (const s of SIDES) {
      const ui = tracks.findIndex((t) => t.name === 'upperarm' + s + '.quaternion'), li = tracks.findIndex((t) => t.name === 'lowerarm' + s + '.quaternion');
      if (ui < 0 || li < 0) continue;
      const up = tracks[ui].createInterpolant(), low = tracks[li].clone(), V = low.values, T = low.times;
      for (let k = 0; k < T.length; k++) {
        qu.fromArray(up.evaluate(T[k])); ql.fromArray(V, k * 4);
        f.copy(hchild[s]).applyQuaternion(ql).applyQuaternion(qu);   // forearm direction in chest space
        const o = f.dot(side[s]); if (o <= MAX_OUT) continue;
        inward(g, f, side[s], o, MAX_OUT, down);                       // same swing, less outward
        R.setFromUnitVectors(f, g);
        // R acts in chest space; express it in the upper arm's frame: ql' = qu^-1 R qu ql
        qi.copy(qu).invert(); ql.premultiply(qu).premultiply(R).premultiply(qi).normalize().toArray(V, k * 4);
      }
      tracks[li] = low;
      // and the hands: the run splays them outward at the wrist; keep them in line with the forearm
      const hi = tracks.findIndex((t) => t.name === 'hand' + s + '.quaternion');
      if (hi < 0) continue;
      const lowI = low.createInterpolant(), hand = tracks[hi].clone(), HV = hand.values, HT = hand.times;
      for (let k = 0; k < HT.length; k++) {
        qu.fromArray(up.evaluate(HT[k])); ql.fromArray(lowI.evaluate(HT[k])); qh.fromArray(HV, k * 4);
        qa.copy(qu).multiply(ql);                                     // chest <- forearm frame
        f.copy(hchild[s]).applyQuaternion(qh).applyQuaternion(qa);    // hand direction in chest space
        const o = f.dot(side[s]); if (o <= MAX_OUT + 0.06) continue;
        inward(g, f, side[s], o, MAX_OUT + 0.06, down);
        R.setFromUnitVectors(f, g);
        qi.copy(qa).invert(); qh.premultiply(qa).premultiply(R).premultiply(qi).normalize().toArray(HV, k * 4);
      }
      tracks[hi] = hand;
    }
    return new THREE.AnimationClip(clip.name, clip.duration, tracks);
  });
}
const MAX_OUT = 0.14, LOCO_MIN = 0.1, LOCO_MAX = 0.245;
// out = v with its sideways component limited to lim; a limb pointing straight out sideways falls toward down
function inward(out, v, side, o, lim, down) {
  out.copy(v).addScaledVector(side, -o);
  const rl = out.length(); if (rl < 0.5) out.addScaledVector(down, 0.5 - rl);
  out.normalize().multiplyScalar(Math.sqrt(1 - lim * lim)).addScaledVector(side, lim);
  return out.normalize();
}
function smooth(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

// Where each hand's fingers point at bind, in the hand bone's own frame (centroid of the hand's skin), so the
// showcase pose can hang the hands in line with the forearm.
function measureHands(THREE, model) {
  let mesh = null; model.traverse((o) => { if (o.isSkinnedMesh && !mesh) mesh = o; });
  if (!mesh) return null;
  model.updateMatrixWorld(true);
  const bones = mesh.skeleton.bones, idx = Object.fromEntries(bones.map((b, i) => [b.name, i])), out = {};
  const P = mesh.geometry.attributes.position, SI = mesh.geometry.attributes.skinIndex, SW = mesh.geometry.attributes.skinWeight, v = new THREE.Vector3();
  for (const s of SIDES) {
    const hb = idx['hand' + s]; if (hb === undefined) return null;
    const pts = [];
    for (let i = 0; i < P.count; i++) {
      let w = 0; for (let k = 0; k < 4; k++) if (SI.getComponent(i, k) === hb) w += SW.getComponent(i, k);
      if (w > 0.45) { v.fromBufferAttribute(P, i); mesh.applyBoneTransform(i, v); pts.push(v.applyMatrix4(mesh.matrixWorld).clone()); }
    }
    if (pts.length < 12) return null;
    const c = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / pts.length);
    // thinnest axis: power iteration on (tr*I - C)
    const bone = bones[hb], q = bone.getWorldQuaternion(new THREE.Quaternion()).invert(), at = bone.getWorldPosition(new THREE.Vector3());
    out[s] = { dir: c.sub(at).normalize().applyQuaternion(q) };
  }
  return out;
}

// A calm standing pose for the dressing room (gear tab), built from this hero's own bind skeleton: weight on the
// right leg with the left knee eased forward, arms hanging close (just clear of the measured body) with soft
// elbows, feet flat, and a slow breath through the chest and arms. Returns a looping clip named 'Showcase'.
export function showcaseClip(THREE, model, opts = {}) {
  const B = (n) => model.getObjectByName(n);
  const names = ['heroRoot', 'chest', 'head', 'upperarml', 'lowerarml', 'handl', 'upperarmr', 'lowerarmr', 'handr', 'upperlegl', 'lowerlegl', 'footl', 'upperlegr', 'lowerlegr', 'footr'];
  if (names.some((n) => !B(n))) return null;
  const hang = opts.hang || measureArmHang(THREE, model) || { l: 0.3, r: 0.3 };
  const saved = names.map((n) => [B(n).quaternion.clone(), B(n).position.clone()]);
  const restore = () => names.forEach((n, i) => { B(n).quaternion.copy(saved[i][0]); B(n).position.copy(saved[i][1]); });
  const hands = measureHands(THREE, model), X = new THREE.Vector3();
  const W = new THREE.Vector3(), V = new THREE.Vector3(), R = new THREE.Quaternion(), P = new THREE.Quaternion(), Q = new THREE.Quaternion();
  const wpos = (n, out = new THREE.Vector3()) => B(n).getWorldPosition(out);
  // turn bone n (whose child is c) so the n->c segment points along world direction dir
  const aim = (n, c, dir) => {
    model.updateMatrixWorld(true);
    W.copy(wpos(c)).sub(wpos(n)).normalize();
    R.setFromUnitVectors(W, V.copy(dir).normalize());
    const bone = B(n); bone.getWorldQuaternion(Q); Q.premultiply(R);
    bone.parent.getWorldQuaternion(P); bone.quaternion.copy(P.invert().multiply(Q));
  };
  const keepWorld = (n, q) => { model.updateMatrixWorld(true); const bone = B(n); bone.parent.getWorldQuaternion(P); bone.quaternion.copy(P.invert().multiply(q)); };
  model.updateMatrixWorld(true);
  const feetQ = { l: B('footl').getWorldQuaternion(new THREE.Quaternion()), r: B('footr').getWorldQuaternion(new THREE.Quaternion()) };
  const ground = Math.min(wpos('footl').y, wpos('footr').y);
  // facing +Z, the hero's left side is +X
  const pose = (breath) => {
    restore();
    aim('upperlegr', 'lowerlegr', new THREE.Vector3(-0.035, -1, 0.01)); aim('lowerlegr', 'footr', new THREE.Vector3(-0.02, -1, -0.015));
    aim('upperlegl', 'lowerlegl', new THREE.Vector3(0.09, -1, 0.15)); aim('lowerlegl', 'footl', new THREE.Vector3(0.05, -1, -0.07));
    keepWorld('footr', feetQ.r); keepWorld('footl', feetQ.l);
    B('chest').rotateX(-0.03 - breath * 0.025); B('head').rotateX(0.05 + breath * 0.015); B('head').rotateY(0.08);
    for (const s of ['l', 'r']) {
      const side = s === 'l' ? 1 : -1, a = Math.min(0.5, hang[s] + 0.1) + breath * 0.025;
      aim('upperarm' + s, 'lowerarm' + s, new THREE.Vector3(side * Math.sin(a), -Math.cos(a), 0.07 + breath * 0.02));
      aim('lowerarm' + s, 'hand' + s, new THREE.Vector3(side * Math.sin(a * 0.55), -Math.cos(a * 0.55), 0.3));
      if (!hands) continue;
      // hand: the fingers continue the forearm, curled a touch toward the thigh (no wrist flick)
      model.updateMatrixWorld(true);
      const u = wpos('hand' + s).sub(wpos('lowerarm' + s)).normalize(), hand = B('hand' + s);
      hand.getWorldQuaternion(Q); W.copy(hands[s].dir).applyQuaternion(Q);
      R.setFromUnitVectors(W, V.copy(u).addScaledVector(X.set(-side, 0, 0), 0.12).normalize()); Q.premultiply(R);
      hand.parent.getWorldQuaternion(P); hand.quaternion.copy(P.invert().multiply(Q));
    }
    // plant the standing foot where the bind pose stood
    model.updateMatrixWorld(true);
    const lift = ground - Math.min(wpos('footl').y, wpos('footr').y), sc = B('heroRoot').parent.getWorldScale(new THREE.Vector3()).y || 1;
    B('heroRoot').position.y += lift / sc;
    return names.map((n) => [B(n).quaternion.clone(), B(n).position.clone()]);
  };
  const times = [0, 2.1, 4.2], frames = [pose(0), pose(1), pose(0)];
  restore(); model.updateMatrixWorld(true);
  const tracks = names.map((n, i) => new THREE.QuaternionKeyframeTrack(n + '.quaternion', times, frames.flatMap((f) => f[i][0].toArray())));
  tracks.push(new THREE.VectorKeyframeTrack('heroRoot.position', times, frames.flatMap((f) => f[0][1].toArray())));
  return new THREE.AnimationClip('Showcase', times[2], tracks);
}
