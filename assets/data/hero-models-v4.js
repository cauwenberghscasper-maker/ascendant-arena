// Hand-painted adventurer heroes (v4): Flux Krea concepts -> TRELLIS.2 meshes, measured with a pose
// network, bone-heat skinned onto the 15-joint adventurer skeleton and driven by the shared KayKit
// clips in assets/animation/adventurer-clips.json. Each hero carries a generated signature weapon.
// Built with tools/v4_*.{py,cjs}; see audit/hero-models-v4.md.

// brawler class -> hero folder, in-game height, hand length (normalised) and weapon
// weapon: { id: folder under assets/hero-v4/weapons/, length: world units, tint?: colour multiply, hold }
// hold: 'forward' blades and bows (KayKit default), 'up' staffs stand upright in idle and casting,
//       'aim' guns point down at rest and along the aim while shooting
export const HERO_V4 = {
  arrow:    { name: 'ayla',   size: 2.0,  hand: 0.0909, weapon: { id: 'ayla', length: 1.25, hold: 'forward' } },
  mortar:   { name: 'boomer', size: 1.75, hand: 0.111,  weapon: { id: 'boomer', length: 0.62, hold: 'aim' } },
  wave:     { name: 'brick',  size: 2.05, hand: 0.0588, weapon: { id: 'brick', length: 1.05, hold: 'forward' } },
  scatter:  { name: 'bruno',  size: 2.1,  hand: 0.0975, weapon: { id: 'bruno', length: 0.95, hold: 'forward' } },
  cluster:  { name: 'dax',    size: 2.0,  hand: 0.0962, weapon: { id: 'dax', length: 0.72, hold: 'aim' } },
  flamer:   { name: 'ember',  size: 2.05, hand: 0.0574, weapon: { id: 'ember', length: 1.45, hold: 'up' } },
  gatling:  { name: 'gus',    size: 2.15, hand: 0.086,  weapon: { id: 'gus', length: 1.0, hold: 'forward' } },
  disc:     { name: 'kiko',   size: 1.95, hand: 0.0981, weapon: { id: 'kiko', length: 0.62, hold: 'forward' } },
  orb:      { name: 'lumi',   size: 1.85, hand: 0.0784, weapon: { id: 'lumi', length: 1.3, hold: 'up' } },
  seeker:   { name: 'nova',   size: 1.95, hand: 0.0841, weapon: { id: 'nova', length: 0.85, hold: 'up' } },
  bolt:     { name: 'pip',    size: 1.7,  hand: 0.0773, weapon: { id: 'rico', length: 0.42, tint: 0xf0c27a, hold: 'aim' } },
  chakram:  { name: 'ren',    size: 2.0,  hand: 0.0944, weapon: { id: 'ren', length: 1.0, hold: 'forward' } },
  smg:      { name: 'rico',   size: 2.0,  hand: 0.1024, weapon: { id: 'rico', length: 0.52, hold: 'aim' } },
  starfall: { name: 'stella', size: 1.95, hand: 0.0697, weapon: { id: 'stella', length: 0.95, hold: 'up' } },
  rail:     { name: 'vex',    size: 2.0,  hand: 0.0704, weapon: { id: 'ayla', length: 1.3, tint: 0x9fc4ff, hold: 'forward' } },
  chain:    { name: 'volt',   size: 2.05, hand: 0.0715, weapon: { id: 'volt', length: 1.15, hold: 'up' } },
};

const MELEE = ['wave', 'scatter', 'gatling'], CASTERS = ['orb', 'seeker', 'flamer', 'starfall', 'chain'];

// Replace the hero.* manifest entries; the older heroes stay as the fallback when a pack fails to load.
export function applyHeroV4(manifest) {
  for (const [cls, h] of Object.entries(HERO_V4)) {
    const old = manifest['hero.' + cls];
    manifest['hero.' + cls] = {
      dir: 'assets/hero-v4/' + h.name + '/', size: h.size, v4: true, animated: true, measuredHand: true, character: cls,
      handLen: h.hand, weapon: Object.assign({ dir: 'assets/hero-v4/weapons/' + h.weapon.id + '/' }, h.weapon),
      attack: MELEE.includes(cls) ? '1H_Melee_Attack_Slice_Horizontal' : CASTERS.includes(cls) ? 'Spellcast_Shoot' : '1H_Ranged_Shoot',
      portrait: 'assets/ui/portraits/v4/' + cls + '.webp', fallback: old,
      source: 'TRELLIS.2 (MIT) from a FLUX.1 Krea [dev] concept, rigged with tools/v4_*, 11 Oct 2026',
    };
  }
}

// Per-hero clip set: the shared clips store hip motion relative to hip height, so scale it to this hero.
export function heroV4Clips(THREE, raw, model) {
  const root = model.getObjectByName('heroRoot');
  const rest = root ? root.position.clone() : new THREE.Vector3(0, 0.5, 0), hipH = rest.y || 0.5;
  return raw.clips.map((c) => new THREE.AnimationClip(c.name, c.duration, c.tracks.map((t) => t.type === 'vector'
    ? new THREE.VectorKeyframeTrack(t.name, t.times, t.values.map((v, i) => (i % 3 === 0 ? rest.x : i % 3 === 1 ? rest.y : rest.z) + v * hipH))
    : new THREE.QuaternionKeyframeTrack(t.name, t.times, t.values))));
}

// Put the weapon in the right hand. The KayKit hand slot sits along the fingers and toward the palm,
// rotated so the weapon's +Y (blade, barrel, staff head) points out of the fist.
export function gripV4Weapon(THREE, scene, def, weaponScene) {
  const hand = scene.getObjectByName('handr');
  if (!hand || !weaponScene) return null;
  const grip = new THREE.Group(); grip.name = 'v4Grip';
  grip.quaternion.set(0, Math.SQRT1_2, Math.SQRT1_2, 0);
  const hl = def.handLen || 0.08;
  grip.position.set(-0.5 * hl, -0.3 * hl, 0);
  weaponScene.scale.setScalar(def.weapon.length / def.size);
  weaponScene.rotation.z = def.weapon.hold === 'up' ? Math.PI / 2 : def.weapon.hold === 'aim' ? -Math.PI / 2 : 0;
  if (def.weapon.tint) weaponScene.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.multiply(new THREE.Color(def.weapon.tint)); } });
  grip.add(weaponScene); hand.add(grip);
  return grip;
}
