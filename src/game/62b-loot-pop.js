// --- loot you can see: what a kill drops pops out of the monster as a real item (Quaternius CC0 coin pile and loot
// pouch, assets/world/loot_*), bounces once and flies into the hero. Gold is a coin pile, gear a pouch glowing in its
// rarity colour, materials a pouch glowing in the material's colour. Purely visual: the loot is already in the bag.
const LootPop = {
  list: [], last: { x: 0, z: 0, t: -9 }, coinT: 0,
  SIZE: { loot_coins: 0.75, loot_pouch: 0.6 }, // materials (mat_*) are 0.55 m
  kill(e) { if (e.kind !== 'fighter' && e.kind !== 'soldier') { this.last.x = e.x; this.last.z = e.z; this.last.t = G.time; } },
  // where a drop comes from: the monster that just died next to you, else the hero
  from() { const L = this.last, p = G.player; return G.time - L.t < 0.35 && Math.hypot(L.x - p.x, L.z - p.z) < 26 ? L : p; },
  spawn(name, glow) {
    const id = 'world.' + name, p = G.player;
    if (!p || !p.alive || this.list.length >= 14 || !AssetLibrary.has(id) || fxK <= 0) return;
    if (AssetLibrary.status(id) === 'none') AssetLibrary.request(id);
    const o = this.from(), a = Math.random() * Math.PI * 2, sp = 1.6 + Math.random() * 1.4;
    this.list.push({ id, name, glow, model: null, g: new THREE.Group(), t: 0, x: o.x, z: o.z, y: 0.6, vx: Math.sin(a) * sp, vz: Math.cos(a) * sp, vy: 5.2, spin: (Math.random() - 0.5) * 9, landed: 0 });
    scene.add(this.list.at(-1).g);
  },
  update(dt) {
    const p = G.player;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const L = this.list[i]; L.t += dt;
      if (!L.model && AssetLibrary.status(L.id) === 'ready') {
        L.model = AssetLibrary.instance(L.id); const B = WORLD_MODEL_BOX[L.name] || [1, 1];
        L.model.scale.setScalar((this.SIZE[L.name] || 0.55) / Math.max(1, B[0], B[1])); L.g.add(L.model);
        if (L.glow != null) AssetLibrary.flash(L.model, ((L.glow >> 16) & 255) / 640, ((L.glow >> 8) & 255) / 640, (L.glow & 255) / 640);
      }
      if (L.t < 0.75) { // pop out and bounce on the ground
        L.vy -= 16 * dt; L.x += L.vx * dt; L.z += L.vz * dt; L.y += L.vy * dt;
        if (L.y < 0.12) { L.y = 0.12; if (L.vy < -1.5) { L.vy *= -0.38; L.vx *= 0.6; L.vz *= 0.6; if (!L.landed++) burst(L.x, 0.15, L.z, 4, L.glow != null ? L.glow : 0xffd34a, 2, 0.35, 0.14, -2, 0.5); } else L.vy = 0; }
      } else { // then fly into the hero, shrinking
        const k = Math.min(1, (L.t - 0.75) / 0.42), e = k * k;
        L.x += ((p ? p.x : L.x) - L.x) * e; L.z += ((p ? p.z : L.z) - L.z) * e; L.y += (1.2 - L.y) * e;
        L.g.scale.setScalar(1 - 0.7 * e);
        if (k >= 1) { burst(L.x, 1.1, L.z, 6, L.glow != null ? L.glow : 0xffd34a, 2.5, 0.35, 0.15, 0, 1); this.drop(i); continue; }
      }
      L.g.position.set(L.x, L.y, L.z); L.g.rotation.y += L.spin * dt;
    }
  },
  drop(i) { const L = this.list[i]; scene.remove(L.g); if (L.model) AssetLibrary.disposeInstance(L.model); this.list.splice(i, 1); },
  clear() { while (this.list.length) this.drop(0); },
  // event hooks (processEvents in 62-events-fx.js)
  gold(e) { if (!(e.amt > 0) || G.time - this.coinT < 0.5 || G.time - this.last.t > 0.35) return; this.coinT = G.time; this.spawn('loot_coins', null); },
  item(e) { if (!e.item || !['monster', 'elite', 'boss'].includes(e.source) || G.time - this.last.t > 0.35) return; this.spawn('loot_pouch', typeof RAR_HEX !== 'undefined' ? RAR_HEX[e.item.rarity] : 0xffffff); },
  // a material pops out as itself (assets/world/mat_<id>: copper ore, frost fang, void core...), else a pouch in its colour
  mats(e) { if (G.time - this.last.t > 0.35) return; for (const [id] of (e.got || []).slice(0, 2)) { const m = typeof MATS !== 'undefined' && MATS[id]; if (!m) continue; if (AssetLibrary.has('world.mat_' + id)) this.spawn('mat_' + id, null); else this.spawn('loot_pouch', m.color); } },
};
