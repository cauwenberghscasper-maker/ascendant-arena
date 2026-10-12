// --- enemies ---------------------------------------------------------------------
const enemyGeo = {};
function buildEnemyGeos() {
  const P2 = PALETTE;
  enemyGeo.slime = mergeParts([
    part(GEO.ico1, 0x6fdc5a, [0, 0.62, 0], null, [0.75, 0.6, 0.75]),
    part(GEO.box, P2.eye, [0.2, 0.78, 0.6], null, [0.1, 0.16, 0.06]), part(GEO.box, P2.eye, [-0.2, 0.78, 0.6], null, [0.1, 0.16, 0.06]),
    part(GEO.ico0, 0xa6f08f, [0.25, 1.05, 0.15], null, [0.14, 0.1, 0.14]),
  ]);
  enemyGeo.wolf = mergeParts([
    part(GEO.box, 0x6d6a73, [0, 0.85, 0], null, [0.6, 0.55, 1.25]),
    part(GEO.box, 0x6d6a73, [0, 1.12, 0.78], null, [0.5, 0.45, 0.5]),
    part(GEO.box, 0x4a4850, [0, 1.0, 1.1], null, [0.28, 0.22, 0.3]),
    part(GEO.cone4, 0x4a4850, [0.16, 1.45, 0.72], null, [0.12, 0.26, 0.12]), part(GEO.cone4, 0x4a4850, [-0.16, 1.45, 0.72], null, [0.12, 0.26, 0.12]),
    part(GEO.box, 0xffd34a, [0.13, 1.18, 1.03], null, [0.07, 0.06, 0.03]), part(GEO.box, 0xffd34a, [-0.13, 1.18, 1.03], null, [0.07, 0.06, 0.03]),
    part(GEO.box, 0x4a4850, [0, 1.0, -0.75], [0.6, 0, 0], [0.16, 0.16, 0.6]),
    part(GEO.box, 0x55525b, [0.2, 0.32, 0.4], null, [0.14, 0.6, 0.14]), part(GEO.box, 0x55525b, [-0.2, 0.32, 0.4], null, [0.14, 0.6, 0.14]),
    part(GEO.box, 0x55525b, [0.2, 0.32, -0.4], null, [0.14, 0.6, 0.14]), part(GEO.box, 0x55525b, [-0.2, 0.32, -0.4], null, [0.14, 0.6, 0.14]),
  ]);
  enemyGeo.imp = mergeParts([
    part(GEO.ico0, 0x7fd3ff, [0, 1.3, 0], null, [0.5, 0.55, 0.5]),
    part(GEO.cone4, 0xdff6ff, [0.22, 1.85, 0], [0, 0, -0.4], [0.09, 0.32, 0.09]), part(GEO.cone4, 0xdff6ff, [-0.22, 1.85, 0], [0, 0, 0.4], [0.09, 0.32, 0.09]),
    part(GEO.box, 0x1a3550, [0.14, 1.4, 0.42], null, [0.1, 0.08, 0.04]), part(GEO.box, 0x1a3550, [-0.14, 1.4, 0.42], null, [0.1, 0.08, 0.04]),
    part(GEO.box, 0xb5e9ff, [0.55, 1.4, -0.15], [0, 0.4, 0.3], [0.5, 0.05, 0.3]), part(GEO.box, 0xb5e9ff, [-0.55, 1.4, -0.15], [0, -0.4, -0.3], [0.5, 0.05, 0.3]),
    part(GEO.cone4, 0x7fd3ff, [0, 0.8, 0], [Math.PI, 0, 0], [0.25, 0.4, 0.25]),
  ]);
  enemyGeo.beetle = mergeParts([
    part(GEO.dodec, 0x3a2622, [0, 0.7, 0], null, [0.85, 0.5, 1.05]),
    part(GEO.dodec, 0xff6a2b, [0, 0.98, -0.1], null, [0.55, 0.22, 0.75]),
    part(GEO.box, 0x24160f, [0, 0.62, 0.95], null, [0.5, 0.36, 0.36]),
    part(GEO.cone4, 0xffb347, [0.2, 0.7, 1.25], [Math.PI / 2, 0, -0.3], [0.08, 0.36, 0.08]), part(GEO.cone4, 0xffb347, [-0.2, 0.7, 1.25], [Math.PI / 2, 0, 0.3], [0.08, 0.36, 0.08]),
    part(GEO.box, 0xffd34a, [0.15, 0.75, 1.13], null, [0.08, 0.07, 0.03]), part(GEO.box, 0xffd34a, [-0.15, 0.75, 1.13], null, [0.08, 0.07, 0.03]),
    part(GEO.box, 0x2b1c17, [0.62, 0.3, 0.4], [0, 0, 0.5], [0.4, 0.08, 0.1]), part(GEO.box, 0x2b1c17, [-0.62, 0.3, 0.4], [0, 0, -0.5], [0.4, 0.08, 0.1]),
    part(GEO.box, 0x2b1c17, [0.66, 0.3, -0.2], [0, 0, 0.5], [0.4, 0.08, 0.1]), part(GEO.box, 0x2b1c17, [-0.66, 0.3, -0.2], [0, 0, -0.5], [0.4, 0.08, 0.1]),
    part(GEO.box, 0x2b1c17, [0.6, 0.3, -0.75], [0, 0, 0.5], [0.4, 0.08, 0.1]), part(GEO.box, 0x2b1c17, [-0.6, 0.3, -0.75], [0, 0, -0.5], [0.4, 0.08, 0.1]),
  ]);
  enemyGeo.wraith = mergeParts([
    part(GEO.cone7, 0x3b3566, [0, 0.95, 0], [Math.PI, 0, 0], [0.6, 1.5, 0.6]),
    part(GEO.dodec, 0x4b4385, [0, 1.75, 0], null, [0.46, 0.46, 0.46]),
    part(GEO.cone7, 0x2a2550, [0, 2.05, -0.06], null, [0.5, 0.6, 0.5]),
    part(GEO.box, 0xe9d4ff, [0.13, 1.76, 0.4], null, [0.09, 0.06, 0.03]), part(GEO.box, 0xe9d4ff, [-0.13, 1.76, 0.4], null, [0.09, 0.06, 0.03]),
    part(GEO.box, 0x4b4385, [0.55, 1.2, 0.1], [0.2, 0, -0.6], [0.16, 0.7, 0.16]), part(GEO.box, 0x4b4385, [-0.55, 1.2, 0.1], [0.2, 0, 0.6], [0.16, 0.7, 0.16]),
    part(GEO.ico0, 0xc77dff, [0, 1.25, 0.45], null, [0.16, 0.16, 0.16]),
  ]);
  enemyGeo.boar = mergeParts([
    part(GEO.dodec, 0x8a5a3c, [0, 0.75, 0], null, [0.65, 0.55, 0.95]),
    part(GEO.box, 0x6b4a2a, [0, 0.82, 0.85], null, [0.45, 0.4, 0.4]),
    part(GEO.box, 0xe6a5a0, [0, 0.72, 1.06], null, [0.24, 0.18, 0.06]),
    part(GEO.cone4, 0xf1ead6, [0.2, 0.62, 1.05], [-1.2, 0, 0.3], [0.06, 0.26, 0.06]), part(GEO.cone4, 0xf1ead6, [-0.2, 0.62, 1.05], [-1.2, 0, -0.3], [0.06, 0.26, 0.06]),
    part(GEO.box, 0x1d1d2b, [0.15, 0.95, 1.03], null, [0.06, 0.06, 0.03]), part(GEO.box, 0x1d1d2b, [-0.15, 0.95, 1.03], null, [0.06, 0.06, 0.03]),
    part(GEO.box, 0x4a3426, [0, 1.25, 0.1], null, [0.12, 0.2, 0.9]),
    part(GEO.box, 0x5a3a24, [0.25, 0.25, 0.45], null, [0.14, 0.5, 0.14]), part(GEO.box, 0x5a3a24, [-0.25, 0.25, 0.45], null, [0.14, 0.5, 0.14]),
    part(GEO.box, 0x5a3a24, [0.25, 0.25, -0.45], null, [0.14, 0.5, 0.14]), part(GEO.box, 0x5a3a24, [-0.25, 0.25, -0.45], null, [0.14, 0.5, 0.14]),
  ]);
  const legs = [];
  for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) { const z = 0.35 - i * 0.25; legs.push(part(GEO.box, 0x24301f, [sx * 0.6, 0.38, z], [0, 0, sx * 0.7], [0.07, 0.6, 0.07])); }
  enemyGeo.spider = mergeParts([
    part(GEO.dodec, 0x3f8a4c, [0, 0.55, -0.25], null, [0.55, 0.42, 0.6]), part(GEO.dodec, 0x2f6a3c, [0, 0.55, 0.3], null, [0.32, 0.28, 0.32]),
    part(GEO.box, 0xff5d6c, [0.1, 0.62, 0.58], null, [0.07, 0.07, 0.03]), part(GEO.box, 0xff5d6c, [-0.1, 0.62, 0.58], null, [0.07, 0.07, 0.03]),
    part(GEO.box, 0xff5d6c, [0.2, 0.58, 0.52], null, [0.05, 0.05, 0.03]), part(GEO.box, 0xff5d6c, [-0.2, 0.58, 0.52], null, [0.05, 0.05, 0.03]),
    part(GEO.cone4, 0xc8e6a0, [0, 0.85, -0.3], null, [0.12, 0.25, 0.12]),
  ].concat(legs));
  enemyGeo.yeti = mergeParts([
    part(GEO.dodec, 0xe8f0f8, [0, 1.25, 0], null, [0.85, 0.95, 0.7]),
    part(GEO.dodec, 0xf4f8fc, [0, 2.15, 0.1], null, [0.5, 0.45, 0.45]),
    part(GEO.box, 0x7fa8c9, [0, 2.05, 0.48], null, [0.42, 0.3, 0.1]),
    part(GEO.box, 0x1d1d2b, [0.12, 2.15, 0.55], null, [0.08, 0.06, 0.03]), part(GEO.box, 0x1d1d2b, [-0.12, 2.15, 0.55], null, [0.08, 0.06, 0.03]),
    part(GEO.dodec, 0xdfeaf4, [0.85, 1.15, 0.2], null, [0.3, 0.6, 0.3]), part(GEO.dodec, 0xdfeaf4, [-0.85, 1.15, 0.2], null, [0.3, 0.6, 0.3]),
    part(GEO.dodec, 0x9fb8cc, [0.88, 0.55, 0.3], null, [0.3, 0.25, 0.3]), part(GEO.dodec, 0x9fb8cc, [-0.88, 0.55, 0.3], null, [0.3, 0.25, 0.3]),
    part(GEO.box, 0xdfeaf4, [0.3, 0.3, 0], null, [0.32, 0.6, 0.36]), part(GEO.box, 0xdfeaf4, [-0.3, 0.3, 0], null, [0.32, 0.6, 0.36]),
  ]);
  enemyGeo.fireimp = mergeParts([
    part(GEO.ico0, 0xff7a2b, [0, 1.3, 0], null, [0.5, 0.55, 0.5]),
    part(GEO.cone4, 0xffd34a, [0.22, 1.85, 0], [0, 0, -0.4], [0.09, 0.32, 0.09]), part(GEO.cone4, 0xffd34a, [-0.22, 1.85, 0], [0, 0, 0.4], [0.09, 0.32, 0.09]),
    part(GEO.box, 0x370617, [0.14, 1.4, 0.42], null, [0.1, 0.08, 0.04]), part(GEO.box, 0x370617, [-0.14, 1.4, 0.42], null, [0.1, 0.08, 0.04]),
    part(GEO.box, 0xd9452a, [0.55, 1.4, -0.15], [0, 0.4, 0.3], [0.5, 0.05, 0.3]), part(GEO.box, 0xd9452a, [-0.55, 1.4, -0.15], [0, -0.4, -0.3], [0.5, 0.05, 0.3]),
    part(GEO.cone4, 0xffb347, [0, 0.8, 0], [Math.PI, 0, 0], [0.25, 0.4, 0.25]),
  ]);
  enemyGeo.sentinel = mergeParts([
    part(GEO.ico0, 0x5b5390, [0, 1.6, 0], null, [0.55, 0.85, 0.55]),
    part(GEO.ico0, 0x9fe8ff, [0, 1.6, 0.42], null, [0.16, 0.16, 0.1]),
    part(GEO.ico0, 0xc77dff, [0.85, 1.7, 0], null, [0.18, 0.4, 0.18]), part(GEO.ico0, 0xc77dff, [-0.85, 1.7, 0], null, [0.18, 0.4, 0.18]),
    part(GEO.ico0, 0xc77dff, [0, 1.7, -0.85], null, [0.18, 0.4, 0.18]),
    part(GEO.cone4, 0x3b3566, [0, 0.55, 0], [Math.PI, 0, 0], [0.3, 0.6, 0.3]),
  ]);
  // Abyssal Depths: a crab-like crawler and a drowned siren
  const cl = [];
  for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) cl.push(part(GEO.box, 0x0f3b40, [sx * 0.62, 0.3, 0.15 - i * 0.28], [0, 0, sx * 0.8], [0.08, 0.55, 0.08]));
  enemyGeo.crawler = mergeParts([
    part(GEO.dodec, 0x1d6f75, [0, 0.55, 0], null, [0.78, 0.4, 0.62]),
    part(GEO.dodec, 0x2fbfae, [0, 0.78, -0.05], null, [0.6, 0.2, 0.46]),
    part(GEO.ico0, 0x6ff7e0, [0.22, 0.92, -0.1], null, [0.1, 0.1, 0.1]), part(GEO.ico0, 0x6ff7e0, [-0.25, 0.9, 0.08], null, [0.08, 0.08, 0.08]),
    part(GEO.box, 0x1d6f75, [0.62, 0.62, 0.48], [0, -0.5, 0], [0.16, 0.16, 0.5]), part(GEO.box, 0x1d6f75, [-0.62, 0.62, 0.48], [0, 0.5, 0], [0.16, 0.16, 0.5]),
    part(GEO.dodec, 0xff7a59, [0.78, 0.66, 0.82], null, [0.3, 0.22, 0.34]), part(GEO.dodec, 0xff7a59, [-0.78, 0.66, 0.82], null, [0.3, 0.22, 0.34]),
    part(GEO.cone4, 0xffb199, [0.72, 0.7, 1.12], [Math.PI / 2, 0, 0], [0.09, 0.3, 0.09]), part(GEO.cone4, 0xffb199, [-0.72, 0.7, 1.12], [Math.PI / 2, 0, 0], [0.09, 0.3, 0.09]),
    part(GEO.cyl7, 0x0f3b40, [0.14, 0.9, 0.42], null, [0.04, 0.32, 0.04]), part(GEO.cyl7, 0x0f3b40, [-0.14, 0.9, 0.42], null, [0.04, 0.32, 0.04]),
    part(GEO.ico0, 0xbfffff, [0.14, 1.08, 0.42], null, [0.09, 0.09, 0.09]), part(GEO.ico0, 0xbfffff, [-0.14, 1.08, 0.42], null, [0.09, 0.09, 0.09]),
  ].concat(cl));
  enemyGeo.drowned = mergeParts([
    part(GEO.cone7, 0x1d5560, [0, 0.95, 0], [Math.PI, 0, 0], [0.55, 1.5, 0.55]),
    part(GEO.box, 0x2fbfae, [0, 0.25, -0.15], [0.6, 0, 0], [0.7, 0.05, 0.35]),
    part(GEO.dodec, 0x2a7d86, [0, 1.75, 0], null, [0.42, 0.46, 0.42]),
    part(GEO.cone7, 0x0f3b4f, [0, 1.65, -0.3], [-0.5, 0, 0], [0.42, 1.0, 0.3]),
    part(GEO.box, 0x2fffd0, [0.4, 1.8, 0], [0, 0.3, -0.4], [0.05, 0.28, 0.22]), part(GEO.box, 0x2fffd0, [-0.4, 1.8, 0], [0, -0.3, 0.4], [0.05, 0.28, 0.22]),
    part(GEO.box, 0xbfffff, [0.13, 1.78, 0.37], null, [0.09, 0.05, 0.03]), part(GEO.box, 0xbfffff, [-0.13, 1.78, 0.37], null, [0.09, 0.05, 0.03]),
    part(GEO.box, 0x2a7d86, [0.5, 1.2, 0.15], [0.3, 0, -0.5], [0.13, 0.7, 0.13]), part(GEO.box, 0x2a7d86, [-0.5, 1.2, 0.15], [0.3, 0, 0.5], [0.13, 0.7, 0.13]),
    part(GEO.ico0, 0x2fffd0, [0, 1.25, 0.42], null, [0.17, 0.17, 0.17]),
  ]);
  // Celestial Spire: a winged seraph and a gilded warden
  const halo = [];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; halo.push(part(GEO.box, 0xffd34a, [Math.sin(a) * 0.38, 2.12, Math.cos(a) * 0.38 - 0.05], [0, a, 0], [0.09, 0.06, 0.26])); }
  enemyGeo.seraph = mergeParts([
    part(GEO.ico0, 0xfff3c4, [0, 1.45, 0], null, [0.42, 0.55, 0.42]),
    part(GEO.ico0, 0xffffff, [0, 1.95, 0.02], null, [0.24, 0.24, 0.24]),
    part(GEO.box, 0xffb000, [0, 1.95, 0.24], null, [0.2, 0.06, 0.03]),
    part(GEO.box, 0xffffff, [0.55, 1.6, -0.2], [0, 0.5, 0.5], [0.6, 0.05, 0.32]), part(GEO.box, 0xffffff, [-0.55, 1.6, -0.2], [0, -0.5, -0.5], [0.6, 0.05, 0.32]),
    part(GEO.box, 0xf6e7b8, [0.7, 1.25, -0.25], [0, 0.6, 0.15], [0.55, 0.05, 0.26]), part(GEO.box, 0xf6e7b8, [-0.7, 1.25, -0.25], [0, -0.6, -0.15], [0.55, 0.05, 0.26]),
    part(GEO.cone4, 0xffd36b, [0, 0.8, 0], [Math.PI, 0, 0], [0.24, 0.5, 0.24]),
    part(GEO.ico0, 0xffd34a, [0, 1.4, 0.38], null, [0.12, 0.12, 0.08]),
  ].concat(halo));
  enemyGeo.warden = mergeParts([
    part(GEO.box, 0xe9dcb8, [0, 1.3, 0], null, [0.95, 1.0, 0.7]),
    part(GEO.box, 0xffc94a, [0, 1.3, 0.36], null, [0.3, 0.6, 0.04]),
    part(GEO.box, 0xd9c48a, [0, 2.12, 0.05], null, [0.56, 0.52, 0.56]),
    part(GEO.cone4, 0xffc94a, [0, 2.55, 0.05], [0, Math.PI / 4, 0], [0.3, 0.4, 0.3]),
    part(GEO.box, 0x2a1f0f, [0, 2.12, 0.34], null, [0.4, 0.08, 0.03]), part(GEO.box, 0xfff07a, [0, 2.12, 0.36], null, [0.3, 0.04, 0.02]),
    part(GEO.dodec, 0xffc94a, [0.6, 1.75, 0], null, [0.32, 0.22, 0.34]), part(GEO.dodec, 0xffc94a, [-0.6, 1.75, 0], null, [0.32, 0.22, 0.34]),
    part(GEO.box, 0xd9c48a, [0.62, 1.1, 0.05], null, [0.24, 0.8, 0.26]),
    part(GEO.box, 0xf4efe2, [-0.75, 1.2, 0.2], [0, 0.25, 0], [0.12, 1.1, 0.8]), part(GEO.box, 0xffc94a, [-0.82, 1.2, 0.22], [0, 0.25, 0], [0.04, 0.5, 0.3]),
    part(GEO.box, 0xb9a77a, [0.25, 0.4, 0], null, [0.3, 0.8, 0.34]), part(GEO.box, 0xb9a77a, [-0.25, 0.4, 0], null, [0.3, 0.8, 0.34]),
  ]);
  enemyGeo.crown = mergeParts([
    part(GEO.cyl8, 0xffc94a, [0, 0, 0], null, [0.32, 0.1, 0.32]),
    part(GEO.cone4, 0xffc94a, [0.22, 0.14, 0], null, [0.07, 0.2, 0.07]), part(GEO.cone4, 0xffc94a, [-0.22, 0.14, 0], null, [0.07, 0.2, 0.07]),
    part(GEO.cone4, 0xffc94a, [0, 0.16, 0.22], null, [0.07, 0.24, 0.07]), part(GEO.cone4, 0xffc94a, [0, 0.14, -0.22], null, [0.07, 0.2, 0.07]),
    part(GEO.ico0, 0xff5d6c, [0, 0.05, 0.31], null, [0.06, 0.06, 0.06]),
  ]);
  enemyGeo.golemBody = mergeParts([
    part(GEO.box, 0x8d8a83, [0, 1.6, 0], [0, 0, 0], [1.6, 1.4, 1.1]),
    part(GEO.box, 0x7a776f, [0, 2.65, 0.1], null, [0.9, 0.7, 0.8]),
    part(GEO.box, 0xff8a2a, [0.2, 2.72, 0.51], null, [0.18, 0.1, 0.04]), part(GEO.box, 0xff8a2a, [-0.2, 2.72, 0.51], null, [0.18, 0.1, 0.04]),
    part(GEO.dodec, 0x5e8c4a, [0.5, 2.35, -0.2], null, [0.35, 0.18, 0.35]),
    part(GEO.box, 0x6f6c65, [0.45, 0.45, 0], null, [0.5, 0.9, 0.6]), part(GEO.box, 0x6f6c65, [-0.45, 0.45, 0], null, [0.5, 0.9, 0.6]),
    part(GEO.box, 0xff8a2a, [0, 1.6, 0.56], [0, 0, 0.78], [0.3, 0.3, 0.04]),
  ]);
  enemyGeo.golemArm = mergeParts([part(GEO.box, 0x8d8a83, [0, -0.8, 0], null, [0.5, 1.6, 0.55]), part(GEO.dodec, 0x7a776f, [0, -1.7, 0.05], null, [0.42, 0.42, 0.42])]);
}
buildEnemyGeos();

// v9 monsters share sculpted bodies: recolour the texture toward the monster's own tint (keeps its shading)
function tintMonsterMaterial(m, tint, k) {
  const u = { uTint: { value: tint.clone() }, uTintK: { value: k } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uTint; uniform float uTintK;')
      .replace('#include <map_fragment>', '#include <map_fragment>\n  { float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)); diffuseColor.rgb = mix(diffuseColor.rgb, uTint * (0.3 + lum * 1.45), uTintK); }')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  float rimF = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.6);\n  totalEmissiveRadiance += vec3(1.0, 0.97, 0.9) * rimF * 0.40;');
  };
  m.customProgramCacheKey = () => 'rimtint';
  m.needsUpdate = true;
}
AssetSlots.register('enemy', (o) => {
  const root = new THREE.Group();
  const ED = CFG.enemies[o.type] || {}, bt = enemyBase(o.type), tint = ED.tint != null ? new THREE.Color(ED.tint) : null, esz = ED.scale || 1;
  const shadow = new THREE.Mesh(geoShadow, matShadow); shadow.scale.setScalar((bt === 'wolf' || bt === 'beetle' ? 0.9 : 0.75) * esz); shadow.position.y = 0.03; root.add(shadow);
  const pivot = new THREE.Group(); root.add(pivot);
  const mat = flashMaterial();
  // every monster is a little different: tint and size vary per spawn
  const vs = (0.9 + Math.random() * 0.2) * esz, tj = Math.random() * 0.16; mat.color.setRGB(1 - tj * 0.6, 1 - tj * 0.2, 1 - tj); if (tint) mat.color.lerp(tint, 0.6);
  const body = new THREE.Mesh(enemyGeo[bt] || enemyGeo.slime, mat); body.castShadow = true; pivot.add(body);
  const bodyOl = addOutline(pivot, enemyGeo[bt] || enemyGeo.slime, o.elite ? matOutlineElite : matOutline);
  // generated monster model, swapped in once loaded (same pivot, so every bob/lunge/squash still applies)
  const mId = AssetLibrary.has('enemy.' + bt) ? 'enemy.' + bt : null;
  let model = null, mDone = !mId;
  const swapModel = () => {
    const st = AssetLibrary.status(mId);
    if (st === 'ready') { model = AssetLibrary.instance(mId); pivot.add(model); body.visible = bodyOl.visible = false;
      if (tint) for (const m of model.userData.mats) tintMonsterMaterial(m, tint, ED.tintK || 0.72); }
    if (st === 'ready' || st === 'failed') mDone = true;
  };
  if (mId) { AssetLibrary.request(mId); swapModel(); }
  let crown = null, aura = null;
  if (o.elite) {
    crown = new THREE.Mesh(enemyGeo.crown, matVC); crown.position.y = esz * ({ wolf: 1.55, beetle: 1.2, wraith: 2.45, imp: 2.05, fireimp: 2.05, boar: 1.5, spider: 1.05, yeti: 2.65, sentinel: 2.7, crawler: 1.25, drowned: 2.45, seraph: 2.5, warden: 2.95 })[bt] || 1.3; pivot.add(crown);
    aura = pxRingMesh(0.88, 1.05, { color: 0xffc94a, transparent: true, opacity: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -40 }, 8, 0.62); aura.position.y = 0.25; root.add(aura);
  }
  let phase = Math.random() * 6, deadT = 0;
  return {
    root,
    update(e, dt, t) {
      root.position.set(e.x, 0, e.z);
      if (!mDone) swapModel();
      root.rotation.y += angDiff(root.rotation.y, e.facing) * (1 - Math.exp(-dt * 10));
      phase += dt * (2 + (e.moveAmt || 0) * 8);
      if (bt === 'slime') { const b = Math.abs(Math.sin(phase)); pivot.scale.set(1 + (1 - b) * 0.18, 0.8 + b * 0.3, 1 + (1 - b) * 0.18); pivot.position.y = b * 0.25 * (e.moveAmt || 0.2); }
      else if (bt === 'wolf') { pivot.position.y = Math.abs(Math.sin(phase)) * 0.12 * (e.moveAmt || 0); pivot.rotation.x = (e.attackAnim || 0) * -0.3; }
      else if (bt === 'beetle') { pivot.position.y = Math.abs(Math.sin(phase * 2)) * 0.05 * (e.moveAmt || 0); pivot.rotation.x = e.windT > 0 ? -0.25 + Math.sin(t * 40) * 0.05 : 0; pivot.rotation.z = Math.sin(phase * 2) * 0.04 * (e.moveAmt || 0); }
      else if (bt === 'wraith') { pivot.position.y = Math.sin(t * 2.2 + phase) * 0.25 + 0.35; pivot.rotation.x = 0.1 + (e.attackAnim || 0) * -0.3; }
      else if (bt === 'boar') { pivot.position.y = Math.abs(Math.sin(phase * 1.5)) * 0.1 * (e.moveAmt || 0); pivot.rotation.x = e.windT > 0 ? -0.2 + Math.sin(t * 40) * 0.04 : 0; }
      else if (bt === 'spider') { pivot.position.y = Math.abs(Math.sin(phase * 2.5)) * 0.05; pivot.rotation.z = Math.sin(phase * 2.5) * 0.06 * (e.moveAmt || 0); }
      else if (bt === 'yeti') { pivot.position.y = Math.abs(Math.sin(phase * 0.8)) * 0.15 * (e.moveAmt || 0); pivot.rotation.x = (e.attackAnim || 0) * -0.35; pivot.rotation.z = Math.sin(phase * 0.8) * 0.06 * (e.moveAmt || 0); }
      else if (bt === 'crawler') { pivot.position.y = Math.abs(Math.sin(phase * 3)) * 0.04; pivot.rotation.z = Math.sin(phase * 3) * 0.08 * (e.moveAmt || 0); pivot.rotation.x = (e.attackAnim || 0) * -0.25; }
      else if (bt === 'drowned') { pivot.position.y = Math.sin(t * 1.9 + phase) * 0.22 + 0.3; pivot.rotation.z = Math.sin(t * 1.3 + phase) * 0.1; pivot.rotation.x = 0.1 + (e.attackAnim || 0) * -0.3; }
      else if (bt === 'seraph') { pivot.position.y = Math.sin(t * 2.4 + phase) * 0.25 + 0.35; pivot.rotation.x = (e.attackAnim || 0) * -0.3; }
      else if (bt === 'warden') { pivot.position.y = Math.abs(Math.sin(phase * 0.8)) * 0.1 * (e.moveAmt || 0); pivot.rotation.x = e.windT > 0 ? -0.22 + Math.sin(t * 40) * 0.04 : (e.attackAnim || 0) * -0.3; }
      else if (bt === 'sentinel') { pivot.position.y = Math.sin(t * 1.6 + phase) * 0.2 + 0.25; pivot.rotation.y = t * 0.8; }
      else { pivot.position.y = Math.sin(t * 3 + phase) * 0.2 + 0.2; pivot.rotation.z = Math.sin(t * 2 + phase) * 0.08; }
      const f = e.flashT > 0 ? 0.9 : 0;
      if (e.windT > 0) { const w = 0.45 + Math.abs(Math.sin(t * 22)) * 0.5; mat.emissive.setRGB(w + f, 0.08 + f, f); }
      else if (e.invulnT > 0) mat.emissive.setRGB(0.15 + f, 0.55 + f, 0.85 + f);
      else if (e.slowT > 0) mat.emissive.setRGB(f, 0.15 + f, 0.4 + f); else if (e.burnT > 0) mat.emissive.setRGB(0.35 + f, 0.1 + f, f); else mat.emissive.setRGB(f, f, f);
      if (model) AssetLibrary.flash(model, mat.emissive.r * 0.7, mat.emissive.g * 0.7, mat.emissive.b * 0.7);
      const s = (0.9 + Math.min(0.25, (e.lvl - 1) * 0.004)) * (e.elite ? 1.35 : 1) * vs;
      if (crown) { crown.rotation.y = t * 1.2; aura.scale.setScalar(1.3 + Math.sin(t * 4) * 0.08); aura.material.opacity = 0.35 + Math.sin(t * 4) * 0.15; }
      if (!e.alive) { deadT += dt; const k = Math.max(0, 1 - deadT * 3); root.scale.setScalar(s * k); root.visible = k > 0; }
      else { deadT = 0; root.scale.setScalar(s); root.visible = !e.hidden; } // hidden: burrowed (a burrow move's marker shows where it is)
      if (e.hidden && Math.random() < 0.3) burst(e.x + (Math.random() - 0.5), 0.2, e.z + (Math.random() - 0.5), 1, 0x9a8a6a, 1.2, 0.4, 0.25, 6, 2);
    },
    dispose() { AssetLibrary.disposeInstance(model); mat.dispose(); if (aura) aura.material.dispose(); },
  };
});

// World boss: one golem body, tinted per zone, with a glowing core and a rune circle
const golemCache = new Map();
function golemGeos(zi) {
  const bkey = (CFG.world.zones[zi] || CFG.world.zones[0]).biome; if (golemCache.has(bkey)) return golemCache.get(bkey);
  const Z = CFG.world.zones[zi] || CFG.world.zones[0], tint = new THREE.Color(Z.bossTint), dark = tint.clone().multiplyScalar(0.75).getHex(), light = tint.clone().lerp(new THREE.Color(0xffffff), 0.18).getHex();
  const acc = Z.bossAcc || 0x6fae4f;
  const body = mergeParts([
    part(GEO.dodec, Z.bossTint, [0, 1.75, 0], null, [1.05, 0.95, 0.8]),
    part(GEO.box, dark, [0, 1.0, 0], null, [1.2, 0.5, 0.8]),
    part(GEO.dodec, light, [0, 2.85, 0.15], null, [0.55, 0.45, 0.5]),
    part(GEO.box, dark, [0, 2.55, 0.5], null, [0.7, 0.18, 0.2]),
    part(GEO.dodec, dark, [0.95, 2.45, -0.05], null, [0.55, 0.42, 0.55]), part(GEO.dodec, dark, [-0.95, 2.45, -0.05], null, [0.55, 0.42, 0.55]),
    part(GEO.dodec, acc, [0.95, 2.78, -0.05], null, [0.42, 0.18, 0.42]), part(GEO.dodec, acc, [-0.95, 2.78, -0.05], null, [0.42, 0.18, 0.42]),
    part(GEO.cone4, acc, [0.35, 3.3, 0], [0, 0, -0.3], [0.14, 0.4, 0.14]), part(GEO.cone4, acc, [-0.35, 3.3, 0], [0, 0, 0.3], [0.14, 0.4, 0.14]),
    part(GEO.box, dark, [0.45, 0.4, 0], null, [0.55, 0.85, 0.65]), part(GEO.box, dark, [-0.45, 0.4, 0], null, [0.55, 0.85, 0.65]),
    part(GEO.dodec, acc, [0.2, 1.4, -0.7], null, [0.3, 0.3, 0.2]), part(GEO.dodec, acc, [-0.4, 2.0, -0.62], null, [0.25, 0.22, 0.2]),
  ]);
  const arm = mergeParts([part(GEO.dodec, Z.bossTint, [0, -0.55, 0], null, [0.4, 0.75, 0.42]), part(GEO.dodec, dark, [0, -1.55, 0.08], null, [0.55, 0.5, 0.55]), part(GEO.dodec, acc, [0, -0.2, 0], null, [0.42, 0.16, 0.42])]);
  const glow = mergeParts([
    part(GEO.box, 0xffffff, [0.2, 2.86, 0.6], null, [0.18, 0.09, 0.05]), part(GEO.box, 0xffffff, [-0.2, 2.86, 0.6], null, [0.18, 0.09, 0.05]),
    part(GEO.ico0, 0xffffff, [0, 1.85, 0.78], null, [0.32, 0.36, 0.2]),
    part(GEO.box, 0xffffff, [0.55, 1.5, 0.62], [0, 0, 0.4], [0.05, 0.4, 0.03]), part(GEO.box, 0xffffff, [-0.6, 1.9, 0.6], [0, 0, -0.5], [0.05, 0.35, 0.03]),
  ]);
  const out = { body, arm, glow }; golemCache.set(bkey, out); return out;
}
AssetSlots.register('boss', (o) => {
  const zi = o.zone || 0, Z = CFG.world.zones[zi] || CFG.world.zones[0], G3 = golemGeos(zi);
  const root = new THREE.Group();
  const shadow = new THREE.Mesh(geoShadow, matShadow); shadow.scale.setScalar(3.1); shadow.position.y = 0.04; root.add(shadow);
  const runeMat = new THREE.MeshBasicMaterial({ color: Z.coreColor, transparent: true, opacity: 0.5, depthWrite: false });
  const rune = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.5, 6, 1).rotateX(-Math.PI / 2), runeMat); rune.position.y = 0.06; root.add(rune);
  const rune2 = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.55, 48).rotateX(-Math.PI / 2), runeMat); rune2.position.y = 0.06; root.add(rune2);
  const pivot = new THREE.Group(); pivot.scale.setScalar(2.05); root.add(pivot);
  const mat = flashMaterial();
  const bodyM = new THREE.Mesh(G3.body, mat); bodyM.castShadow = true; pivot.add(bodyM); addOutline(pivot, G3.body, matOutlineBoss);
  const glowMat = new THREE.MeshBasicMaterial({ color: Z.coreColor });
  pivot.add(new THREE.Mesh(G3.glow, glowMat));
  const arms = [];
  for (const sx of [-1.25, 1.25]) {
    const a = new THREE.Group(); a.position.set(sx, 2.35, 0); pivot.add(a);
    const m = new THREE.Mesh(G3.arm, mat); m.castShadow = true; a.add(m); addOutline(a, G3.arm, matOutlineBoss); arms.push(a);
  }
  let phase = 0, spawnT = 0;
  return {
    root,
    update(b, dt, t) {
      // Showcase hides existing world views. Restore live bosses when combat resumes.
      root.visible = b.alive !== false;
      // A boss may spawn while showcase suppresses its view. Use simulation age
      // so returning to combat cannot restart the rise underneath an attacking boss.
      spawnT = b.spawnT != null && Number.isFinite(G.time) ? clamp((G.time - b.spawnT) * 0.8, 0, 1) : Math.min(1, spawnT + dt * 0.8);
      root.position.set(b.x, -3.5 * (1 - spawnT) - (b.retreat != null ? 4.5 * (1 - Math.max(0, b.retreat) / 2.5) : 0), b.z);
      root.rotation.y += angDiff(root.rotation.y, b.facing) * (1 - Math.exp(-dt * 4));
      phase += dt * (1 + b.moveAmt * 4);
      const atk = b.attackAnim;
      arms[0].rotation.x = -atk * 2.2 + Math.sin(phase) * 0.3 * b.moveAmt; arms[1].rotation.x = -atk * 2.2 - Math.sin(phase) * 0.3 * b.moveAmt;
      arms[0].rotation.z = -0.12; arms[1].rotation.z = 0.12;
      pivot.position.y = Math.abs(Math.sin(phase)) * 0.12 * b.moveAmt + Math.sin(t * 1.5) * 0.04;
      const f = b.flashT > 0 ? 0.6 : 0; mat.emissive.setRGB(f, f * 0.8, f * 0.6);
      const pulse = 0.75 + Math.sin(t * 4) * 0.25; glowMat.color.setHex(Z.coreColor).multiplyScalar(0.7 + pulse * 0.5);
      rune.rotation.y = t * 0.4; rune2.rotation.y = -t * 0.25; runeMat.opacity = 0.3 + pulse * 0.25;
    },
    dispose() { mat.dispose(); glowMat.dispose(); runeMat.dispose(); rune.geometry.dispose(); rune2.geometry.dispose(); },
  };
});

AssetSlots.register('npc', (o) => {
  const v = AssetSlots.create('character', { cls: 'novice', body: o.body, accent: o.accent, hair: o.hair || 0x3b2a20 });
  const marker = new THREE.Group();
  const mm = new THREE.MeshBasicMaterial({ color: 0xffd34a });
  const bar = new THREE.Mesh(GEO.box, mm); bar.scale.set(0.16, 0.5, 0.16); bar.position.y = 0.36;
  const dot = new THREE.Mesh(GEO.box, mm); dot.scale.set(0.16, 0.16, 0.16);
  marker.add(bar, dot); marker.position.y = 2.75; v.root.add(marker);
  const baseUpdate = v.update;
  v.update = (n, dt, t) => {
    baseUpdate(n, dt, t);
    const st = npcMarkerState(n.def);
    marker.visible = st !== 'none';
    mm.color.setHex(st === 'turnin' ? 0x58e08a : st === 'arena' ? 0xff6b6b : st === 'smith' ? 0x9fd7ff : 0xffd34a);
    marker.position.y = 2.75 + Math.sin(t * 3) * 0.12; marker.rotation.y = t * 1.5;
  };
  const baseDispose = v.dispose; v.dispose = () => { baseDispose(); mm.dispose(); };
  return v;
});
function npcMarkerState(def) {
  const p = G.profile;
  if (def.role === 'arena') return 'arena';
  if (def.role === 'smith') return 'smith';
  if (p.job && p.job.npc === def.id && p.job.progress >= p.job.count) return 'turnin';
  if (!p.job && p.level >= def.minLevel && def.jobs.length) return 'job';
  return 'none';
}

