// Authored eye geometry repairs details lost during image-to-3D texture baking.
// One small vertex-colored mesh per eye; shared geometry, matte material.
let eyeGeometry;
function geometry(THREE) {
  if (eyeGeometry) return eyeGeometry;
  const lid = new THREE.BufferGeometry();
  lid.setAttribute('position', new THREE.Float32BufferAttribute([-.012,.0065,.0045, .012,.0065,.0045, .011,.0045,.0045, -.011,.0045,.0045],3));
  lid.setIndex([0,2,1,0,3,2]); lid.computeVertexNormals();
  const layers = [
    [new THREE.SphereGeometry(1, 10, 6), [.010, .006, .002], [0, 0, 0], 0xb7aa94],
    [new THREE.CircleGeometry(.0055, 12), [1, 1, 1], [0, 0, .0023], 0x4c3822],
    [new THREE.CircleGeometry(.0037, 10), [1, 1, 1], [0, 0, .0026], 0x10161b],
    [new THREE.CircleGeometry(.00055, 8), [1, 1, 1], [-.0011, .0016, .0029], 0xbfb49e],
    [lid, [1,1,1], [0,0,0], 0x765c49],
  ];
  const positions = [], normals = [], colors = [], color = new THREE.Color();
  for (const [shape, scale, at, tint] of layers) {
    shape.scale(...scale); shape.translate(...at); const part = shape.index ? shape.toNonIndexed() : shape;
    color.setHex(tint);
    for (let i = 0; i < part.attributes.position.count; i++) {
      positions.push(part.attributes.position.getX(i), part.attributes.position.getY(i), part.attributes.position.getZ(i));
      normals.push(part.attributes.normal.getX(i), part.attributes.normal.getY(i), part.attributes.normal.getZ(i));
      colors.push(color.r, color.g, color.b);
    }
    part.dispose(); if (part !== shape) shape.dispose();
  }
  eyeGeometry = new THREE.BufferGeometry();
  eyeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  eyeGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  eyeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return eyeGeometry;
}
export function addHeroEyes(scene, definition, THREE) {
  if (!definition.eyes || scene.getObjectByName('eyeL')) return;
  const body = []; scene.updateMatrixWorld(true); scene.traverse(o => { if (o.isMesh) body.push(o); });
  const ray = new THREE.Raycaster(), front = new THREE.Vector3(0, 0, 1);
  for (const side of ['L', 'R']) {
    const anchor = definition.eyes[side];
    ray.set(new THREE.Vector3(anchor[0], anchor[1], 1), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObjects(body, false)[0];
    if (!hit) throw Error('Eye anchor misses the reviewed face: ' + side);
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    // Keep pupils forward-facing while following gentle facial curvature.
    normal.lerp(front, .65).normalize();
    const eye = new THREE.Mesh(geometry(THREE), new THREE.MeshStandardMaterial({vertexColors:true, roughness:.95, metalness:0}));
    eye.name = 'eye' + side; eye.position.copy(hit.point).addScaledVector(normal, .0015);
    const fit = definition.eyes.scale || [1, 1, 1];
    eye.scale.fromArray(fit); eye.userData.openEyeY = fit[1];
    eye.quaternion.setFromUnitVectors(front, normal); scene.add(eye);
  }
}
