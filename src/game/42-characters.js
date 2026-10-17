// --- characters: every hero, townsperson and monster is a generated 3D model (assets/), never primitives ---
// Gear look: rarity sets the metal, the item's style (its name) sets the shape.
const GEAR_TONES = {
  common: { main: 0x8b6f4e, trim: 0x5a4632, metal: 0x9aa1ad, glow: 0xd8d2c0 },
  uncommon: { main: 0x4f8f45, trim: 0xc6eba8, metal: 0x9fcf8f, glow: 0x9cff7a },
  legendary: { main: 0xd9741f, trim: 0xffe08a, metal: 0xffc46b, glow: 0xffb347 },
  rare: { main: 0x3f7fd0, trim: 0xcfe6ff, metal: 0x8fc2ff, glow: 0x7fd8ff },
  epic: { main: 0x7a3fd0, trim: 0xf2c14e, metal: 0xc9a6ff, glow: 0xff9bf2 },
  mythic: { main: 0xb3123a, trim: 0xffd0dc, metal: 0xff7a90, glow: 0xff4d6d },
  ancient: { main: 0x0f6f6a, trim: 0xbfffee, metal: 0x5fe3c9, glow: 0x2fffd0 },
  divine: { main: 0xf4efe2, trim: 0xffd34a, metal: 0xffffff, glow: 0xfff07a },
};
const gearGeoCache = new Map();
function gearSignature(gear) { if (!gear) return ''; return CFG.gear.slots.map((s) => gear[s] ? gear[s].rarity.slice(0, 2) + itemStyle(gear[s]) + (gear[s].up >= 5 ? '+' : '') + (itemElement(gear[s]) || '') : '-').join(''); }
const Thumbs = { r: null, scene: null, cam: null, cache: new Map(), size: 128 };
const PremiumPortraits = createPremiumPortraits(THREE, () => { thumbInit(); return Thumbs.r; });
function thumbKey(it) { return [it.slot, it.rarity, itemStyle(it), itemElement(it) || '', it.up >= 5 ? '+' : ''].join('|'); }
// 3D brawler portraits (head and shoulders) for menus, cached per brawler and badge tint
function thumbInit() {
  if (Thumbs.r) return;
  Thumbs.r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  Thumbs.r.setPixelRatio(1); Thumbs.r.setSize(Thumbs.size, Thumbs.size, false); Thumbs.r.outputColorSpace = THREE.SRGBColorSpace;
  Thumbs.scene = new THREE.Scene();
  Thumbs.scene.add(new THREE.HemisphereLight(0xffffff, 0x445066, 2.2));
  const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(2, 3, 4); Thumbs.scene.add(dl);
  Thumbs.cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
}
// pixel-art portraits: the painted portrait is redrawn at 40x40 with a limited palette, hard edges,
// cel-shaded tone steps and a 1px ink outline, then shown scaled up crisp. Until it's ready the
// original shows; once done every <img> using it swaps over.
const PixelPortraits = {
  N: 40, done: new Map(), busy: new Set(),
  url(src, size, cut) {
    if (this.done.has(src)) return this.done.get(src);
    if (!this.busy.has(src)) { this.busy.add(src); const im = new Image(); im.onload = () => { try { this.make(src, im, size, cut); } catch (e) { this.done.set(src, src); } }; im.onerror = () => this.done.set(src, src); im.src = src; }
    return src;
  },
  make(src, im, size, cut) {
    const N = size || this.N, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, N, N);
    const d = x.getImageData(0, 0, N, N), o = d.data;
    // posterize: 5 steps per channel after a small contrast boost, a touch less saturation
    for (let i = 0; i < o.length; i += 4) {
      let r = o[i], g = o[i + 1], b = o[i + 2]; const l = 0.3 * r + 0.59 * g + 0.11 * b;
      r = l + (r - l) * 0.9; g = l + (g - l) * 0.9; b = l + (b - l) * 0.9;
      const st = cut ? 32 : 51, q = (v) => Math.max(0, Math.min(255, Math.round(((v - 128) * 1.12 + 128) / st) * st)); // items keep more tones so gradients don't band
      o[i] = q(r); o[i + 1] = q(g); o[i + 2] = q(b);
    }
    // cut-out art (items): hard alpha, then an ink outline around the silhouette
    if (cut) {
      for (let i = 0; i < o.length; i += 4) o[i + 3] = o[i + 3] > 110 ? 255 : 0;
      const A = (i, j) => (i < 0 || j < 0 || i >= N || j >= N) ? 0 : o[(j * N + i) * 4 + 3];
      const edge = []; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (!A(i, j) && (A(i + 1, j) || A(i - 1, j) || A(i, j + 1) || A(i, j - 1))) edge.push((j * N + i) * 4);
      for (const k of edge) { o[k] = 14; o[k + 1] = 12; o[k + 2] = 20; o[k + 3] = 255; }
    }
    // ink outline where tone jumps hard (silhouette and big shapes)
    const L = new Float32Array(N * N); for (let i = 0; i < N * N; i++) L[i] = 0.3 * o[i * 4] + 0.59 * o[i * 4 + 1] + 0.11 * o[i * 4 + 2];
    const out = new Uint8ClampedArray(o);
    for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) {
      const k = j * N + i, here = L[k], mx = Math.max(L[k - 1], L[k + 1], L[k - N], L[k + N]);
      if (mx - here > 95 && here < 110) { out[k * 4] = 18; out[k * 4 + 1] = 14; out[k * 4 + 2] = 24; }
    }
    d.data.set(out); x.putImageData(d, 0, 0);
    const url = c.toDataURL('image/png'); this.done.set(src, url);
    document.querySelectorAll('img').forEach((el) => { if (el.getAttribute('src') === src) { el.src = url; el.classList.add('pxp'); } });
  },
};
// painted portrait (crop of the hero's concept art) when the brawler has a generated model, else a live 3D render
function brawlerThumb(id) {
  const def = ASSET_MANIFEST['hero.' + id];
  if (def && def.portrait) return def.portrait;
  return def ? PixelPortraits.url('assets/ui/portraits/' + id + '.webp') : '';
}
// --- item icons: hand-drawn vector art per item shape (slot + style), coloured by rarity ---------------------
// Chunky toy style: dark ink outline, two-tone gradients, glowing gems; epic+ sparkles, legendary+ glow, ancient+ halo.
const ItemArt = {
  ink: '#1b1730',
  shades(hex) { const c = new THREE.Color(hex), w = new THREE.Color(0xffffff), k = new THREE.Color(0x000000); return ['#' + c.clone().lerp(w, 0.45).getHexString(), '#' + c.getHexString(), '#' + c.clone().lerp(k, 0.38).getHexString()]; },
  // shape art on a 64x64 grid; m/t/x/g are the main, trim, metal and glow paints, W the wood/leather paint
  shapes: {
    weapon: [
      () => `<g transform="rotate(45 32 32)"><path d="M32 3L38 11V40H26V11Z" fill="url(#x)"/><path d="M32 10V37" stroke="#fff" stroke-opacity=".55" stroke-width="2"/><rect x="17" y="39" width="30" height="7" rx="3.5" fill="url(#t)"/><rect x="29" y="46" width="6" height="11" rx="2" fill="url(#W)"/><circle cx="32" cy="59" r="4.2" fill="url(#g)"/></g>`,
      () => `<g transform="rotate(35 32 32)"><rect x="29" y="7" width="6" height="54" rx="3" fill="url(#W)"/><path d="M34 11C52 8 60 21 57 36C51 31 43 31 34 33Z" fill="url(#x)"/><path d="M30 15L17 20L30 27Z" fill="url(#x)"/><rect x="26.5" y="28" width="11" height="6" rx="2" fill="url(#t)"/><circle cx="32" cy="20.5" r="3.4" fill="url(#g)"/></g>`,
      () => `<g transform="rotate(28 32 32)"><rect x="29.5" y="22" width="5" height="41" rx="2.5" fill="url(#W)"/><path d="M21 24C20 13 25 7 32 5C39 7 44 13 43 24L37 19L32 25L27 19Z" fill="url(#t)"/><circle cx="32" cy="15" r="7.5" fill="url(#g)"/><circle cx="29.5" cy="12.5" r="2.2" fill="#fff" stroke="none" opacity=".85"/></g>`,
    ],
    helmet: [
      () => `<path d="M10 41C10 23 20 12 32 12C44 12 54 23 54 41Z" fill="url(#m)"/><path d="M30 44C41 43 56 45 60 50C51 53 37 52 28 48Z" fill="url(#m)"/><rect x="9" y="36" width="46" height="8" rx="4" fill="url(#t)"/><path d="M43 17C50 6 60 7 61 8C59 17 52 23 46 25Z" fill="url(#t)"/><circle cx="32" cy="40" r="3.6" fill="url(#g)"/>`,
      () => `<path d="M33 12C29 3 41 0 49 6C42 6 38 9 36 13Z" fill="url(#m)"/><path d="M12 45C12 23 20 11 32 11C44 11 52 23 52 45V53H12Z" fill="url(#x)"/><path d="M17 31H47V38H17Z" fill="${'#1b1730'}"/><rect x="29.5" y="29" width="5" height="16" rx="2" fill="url(#x)"/><rect x="11" y="48" width="42" height="7" rx="3" fill="url(#t)"/><circle cx="32" cy="22" r="3.4" fill="url(#g)"/>`,
      () => `<path d="M32 3C45 12 55 26 55 44C55 55 46 61 32 61C18 61 9 55 9 44C9 26 19 12 32 3Z" fill="url(#m)"/><ellipse cx="32" cy="41" rx="13" ry="14" fill="${'#1b1730'}"/><ellipse cx="32" cy="41" rx="13" ry="14" fill="none" stroke="url(#t)" stroke-width="3"/><circle cx="27" cy="41" r="2.3" fill="url(#g)" stroke="none"/><circle cx="37" cy="41" r="2.3" fill="url(#g)" stroke="none"/><circle cx="32" cy="58" r="3.4" fill="url(#g)"/>`,
    ],
    chest: [
      () => `<path d="M18 13L26 9C28 15 36 15 38 9L46 13L51 22L46 26V55H18V26L13 22Z" fill="url(#m)"/><path d="M23 13L43 49" stroke="url(#t)" stroke-width="5"/><rect x="18" y="44" width="28" height="6" fill="url(#W)"/><rect x="28.5" y="42.5" width="7" height="9" rx="1.5" fill="url(#x)"/><rect x="19" y="47" width="7" height="8" rx="2" fill="url(#W)"/><circle cx="32" cy="47" r="1.8" fill="url(#g)" stroke="none"/>`,
      () => `<ellipse cx="14" cy="23" rx="11" ry="9" fill="url(#x)"/><ellipse cx="50" cy="23" rx="11" ry="9" fill="url(#x)"/><path d="M19 14H45L47 40C47 50 39 56 32 59C25 56 17 50 17 40Z" fill="url(#x)"/><path d="M32 18V55" stroke="url(#t)" stroke-width="3"/><path d="M25 14C27 20 37 20 39 14" fill="${'#1b1730'}"/><path d="M5 26C9 29 19 29 23 26M41 26C45 29 55 29 59 26" stroke="url(#t)" stroke-width="3" fill="none"/><circle cx="32" cy="33" r="5" fill="url(#g)"/>`,
      () => `<path d="M22 7H42L46 20L55 59H9L18 20Z" fill="url(#m)"/><path d="M30 22H34V59H30Z" fill="url(#t)"/><path d="M22 7L32 22L42 7Z" fill="url(#t)"/><rect x="16" y="30" width="32" height="6" rx="2" fill="url(#t)"/><circle cx="32" cy="33" r="3.6" fill="url(#g)"/>`,
    ],
    boots: [
      () => `<path d="M19 10H41V39L52 43C59 45 59 53 52 53H17V40Z" fill="url(#m)"/><rect x="17" y="8" width="26" height="9" rx="3.5" fill="url(#t)"/><rect x="15" y="51" width="42" height="6" rx="2.5" fill="url(#W)"/><rect x="25" y="27" width="12" height="7" rx="1.5" fill="url(#x)"/><circle cx="31" cy="30.5" r="1.8" fill="url(#g)" stroke="none"/>`,
      () => `<path d="M19 10H41V39L52 43C59 45 59 53 52 53H17V40Z" fill="url(#x)"/><path d="M22 14H38V36L30 40L22 36Z" fill="url(#m)"/><ellipse cx="50" cy="47" rx="8" ry="6" fill="url(#x)"/><rect x="17" y="8" width="26" height="8" rx="3" fill="url(#t)"/><rect x="15" y="51" width="42" height="6" rx="2.5" fill="url(#W)"/><circle cx="25" cy="44" r="1.8" fill="url(#t)"/><circle cx="35" cy="44" r="1.8" fill="url(#t)"/><circle cx="30" cy="26" r="2.6" fill="url(#g)"/>`,
      () => `<path d="M21 18C8 12 3 20 4 27C9 24 14 24 21 26Z" fill="url(#t)"/><path d="M21 29C10 26 6 32 7 37C11 35 15 35 21 36Z" fill="url(#t)"/><path d="M20 10H40V39L51 43C58 45 58 53 51 53H18V40Z" fill="url(#m)"/><rect x="18" y="31" width="24" height="5" rx="2" fill="url(#g)"/><rect x="18" y="8" width="24" height="8" rx="3" fill="url(#t)"/><rect x="16" y="51" width="40" height="5" rx="2" fill="url(#W)"/>`,
    ],
    accessory: [
      () => `<path d="M32 4V16" stroke="url(#t)" stroke-width="3"/><path d="M32 16L44 34L32 58L20 34Z" fill="url(#g)"/><path d="M32 16L44 34L32 58L20 34Z M20 34H44 M32 16V58" fill="none" stroke="url(#t)" stroke-width="2.5"/><path d="M26 25L31 20" stroke="#fff" stroke-width="2.5" stroke-opacity=".8"/>`,
      () => `<ellipse cx="32" cy="42" rx="19" ry="15" fill="none" stroke="${'#1b1730'}" stroke-width="12"/><ellipse cx="32" cy="42" rx="19" ry="15" fill="none" stroke="url(#t)" stroke-width="7"/><path d="M22 22L26 30H38L42 22Z" fill="url(#t)"/><path d="M32 6L43 17L32 30L21 17Z" fill="url(#g)"/><path d="M27 13L31 9" stroke="#fff" stroke-width="2.4" stroke-opacity=".8"/>`,
      () => `<path d="M11 6C13 29 25 35 32 37C39 35 51 29 53 6" fill="none" stroke="${'#1b1730'}" stroke-width="7"/><path d="M11 6C13 29 25 35 32 37C39 35 51 29 53 6" fill="none" stroke="url(#t)" stroke-width="3.5" stroke-dasharray="4 3"/><circle cx="32" cy="45" r="13" fill="url(#t)"/><circle cx="32" cy="45" r="8.5" fill="url(#g)"/><circle cx="29" cy="42" r="2.4" fill="#fff" stroke="none" opacity=".85"/>`,
    ],
  },
  sparkle(x, y, s, c) { return `<path d="M${x} ${y - s}L${x + s * 0.28} ${y - s * 0.28}L${x + s} ${y}L${x + s * 0.28} ${y + s * 0.28}L${x} ${y + s}L${x - s * 0.28} ${y + s * 0.28}L${x - s} ${y}L${x - s * 0.28} ${y - s * 0.28}Z" fill="${c}" stroke="none"/>`; },
  svg(it) {
    const T = Object.assign({}, GEAR_TONES[it.rarity] || GEAR_TONES.common), rar = rarIdx(it.rarity), el = itemElement(it);
    if (el) T.glow = CFG.elements[el].color;
    const lin = (id, hex) => { const [a, b, c] = this.shades(hex); return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`; };
    const [ga, gb, gc] = this.shades(T.glow);
    const defs = lin('m', T.main) + lin('t', T.trim) + lin('x', T.metal) + lin('W', 0x7a4f2a)
      + `<radialGradient id="g" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${ga}"/><stop offset="1" stop-color="${gc}"/></radialGradient>`
      + `<radialGradient id="halo"><stop offset="0" stop-color="${gb}" stop-opacity=".75"/><stop offset="1" stop-color="${gb}" stop-opacity="0"/></radialGradient>`;
    const art = (this.shapes[it.slot] || this.shapes.accessory)[itemStyle(it)] || this.shapes.accessory[0];
    let back = '', front = '';
    if (rar >= 4) back += `<circle cx="32" cy="33" r="31" fill="url(#halo)" stroke="none"/>`;
    if (rar >= 6) back += `<circle cx="32" cy="33" r="27" fill="none" stroke="${gb}" stroke-width="1.6" stroke-dasharray="3 4" opacity=".9"/>`;
    if (rar >= 3) front += this.sparkle(52, 10, 5 + rar * 0.4, '#fff') + this.sparkle(10, 52, 3.5 + rar * 0.3, ga);
    if (rar >= 5) front += this.sparkle(55, 50, 3.5, ga);
    if ((it.up || 0) >= 5) front += `<path d="M55 4l2 4.5 5 .6-3.7 3.4 1 5-4.3-2.5-4.3 2.5 1-5L47 9.1l5-.6Z" fill="#ffd34a" stroke="${this.ink}" stroke-width="1.4"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs>${defs}</defs>${back}<g transform="translate(32 33) scale(1.1) translate(-32 -33)" stroke="${this.ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">${art()}</g>${front}</svg>`;
  },
  url(it) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(this.svg(it)); },
};
// pixel item art (assets/ui/items/<slot>-<noun>-<rarity>.png); the list is rewritten by tools/pixelize_items.py
// <items-icons>
const ITEM_ICONS = [];
// </items-icons>
// Generated static menu paintings take precedence; procedural portraits cover future shapes.
// crafted set art: painted, or the pixelated version when the Pixel art setting is on
function setArtUrl(bi, slot) { return G.profile && G.profile.settings.pixel ? `assets/ui/sets/px/${bi}-${slot}.png` : `assets/ui/sets/${bi}-${slot}.webp`; }
function thumbFor(it) {
  if (!it) return '';
  if (it.set != null && it.set >= 0 && it.set < 6) return setArtUrl(it.set, it.slot);
  const collectible = collectionIcon(it);
  if (collectible) return collectible;
  const generated = equipmentIcon(it.slot, ITEM_NAMES[it.slot]?.[itemStyle(it)]);
  if (generated) return generated;
  // pixel-art painting per item shape and rarity (assets/ui/items/<slot>-<noun>-<rarity>.png, tools/pixelize_items.py)
  const paint = it.slot + '-' + (ITEM_NAMES[it.slot] ? ITEM_NAMES[it.slot][itemStyle(it)].toLowerCase() : '') + '-' + it.rarity;
  if (!thumbFor.set) thumbFor.set = new Set(ITEM_ICONS);
  if (thumbFor.set.has(paint)) return PremiumPortraits.item(it, 'assets/ui/items/' + paint + '.png');
  const key = thumbKey(it);
  if (!Thumbs.cache.has(key)) { try { Thumbs.cache.set(key, ItemArt.url(it)); } catch (e) { Thumbs.cache.set(key, ''); } }
  const src = Thumbs.cache.get(key);
  return PremiumPortraits.item(it, src || '');
}
function flashMaterial() { const m = matVC.clone(); m.emissive = new THREE.Color(0x000000); return m; }
// Ascended forms: level 100 aura, 150 wings, 200 crown (+ trail, see updateHubProps)
const ASC = { pillar: null, ring: null, wing: null, crown: null };
function ascGeos() {
  if (ASC.pillar) return ASC;
  ASC.pillar = new THREE.CylinderGeometry(0.7, 0.95, 2.8, 24, 1, true).translate(0, 1.4, 0);
  ASC.ring = new THREE.RingGeometry(0.55, 1.25, 40).rotateX(-Math.PI / 2);
  const sh = new THREE.Shape(); sh.moveTo(0, 0);
  sh.bezierCurveTo(0.3, 0.55, 0.85, 0.95, 1.5, 1.05); sh.bezierCurveTo(1.32, 0.8, 1.36, 0.62, 1.22, 0.48);
  sh.bezierCurveTo(1.12, 0.36, 1.08, 0.26, 0.95, 0.18); sh.bezierCurveTo(0.9, 0.02, 0.74, -0.05, 0.62, -0.08);
  sh.bezierCurveTo(0.5, -0.24, 0.32, -0.36, 0.14, -0.38); sh.lineTo(0, 0);
  ASC.wing = new THREE.ShapeGeometry(sh, 10);
  const cp = [part(GEO.cyl8, 0xffd34a, [0, 0, 0], null, [0.36, 0.12, 0.36])];
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; cp.push(part(GEO.cone4, 0xffd34a, [Math.sin(a) * 0.3, 0.2, Math.cos(a) * 0.3], null, [0.08, 0.3, 0.08])); cp.push(part(GEO.ico0, i % 2 ? 0x7fe3ff : 0xff5d8f, [Math.sin(a) * 0.36, 0.02, Math.cos(a) * 0.36], null, [0.06, 0.06, 0.06])); }
  ASC.crown = mergeParts(cp);
  return ASC;
}
function addAscended(root, pivot, tier) {
  const A = ascGeos(), mats = [], out = { tier, mats, attached: false, scale: 1 };
  const add = (m) => { mats.push(m); return m; };
  out.pillar = new THREE.Mesh(A.pillar, add(new THREE.MeshBasicMaterial({ color: tier >= 3 ? 0xffe6a0 : 0xffc94a, map: fadeTex(), transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })));
  root.add(out.pillar);
  out.ring = new THREE.Mesh(A.ring, add(new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })));
  out.ring.position.y = 0.06; root.add(out.ring);
  if (tier >= 2) {
    const wm = add(new THREE.MeshBasicMaterial({ color: 0xfff6dc, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false }));
    const wg = add(new THREE.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    out.wings = [];
    for (const sx of [1, -1]) {
      const g = new THREE.Group(); g.position.set(0.12 * sx, 1.3, -0.28); g.rotation.x = -0.75;
      const glowW = new THREE.Mesh(A.wing, wg); glowW.scale.set(sx * 1.45, 1.45, 1.45); glowW.position.z = -0.02; g.add(glowW);
      const w = new THREE.Mesh(A.wing, wm); w.scale.set(sx * 1.3, 1.3, 1.3); g.add(w);
      pivot.add(g); out.wings.push(g);
    }
  }
  if (tier >= 3) {
    out.crown = new THREE.Mesh(A.crown, add(new THREE.MeshBasicMaterial({ vertexColors: true })));
    out.crown.position.y = 2.42; pivot.add(out.crown);
  }
  out.bindHero = (hero, def) => {
    const back = hero.getObjectByName('heroBackSocket'), head = hero.getObjectByName('heroCrownSocket');
    if (!back || !head) return;
    out.attached = true; out.scale = 1 / def.size;
    if (out.wings) out.wings.forEach((wing, i) => {
      back.add(wing); wing.position.set((i ? -1 : 1) * .045, 0, 0);
      wing.scale.setScalar(out.scale); wing.rotation.x = -.35;
    });
    if (out.crown) {
      head.add(out.crown); out.crown.position.set(0, 0, 0); out.crown.rotation.set(0, 0, 0);
      const radius = def.rig ? def.rig.head.r : hero.getObjectByProperty('type', 'SkinnedMesh')?.parent.userData.equipmentFit?.headRadius || .15;
      out.crown.scale.setScalar(Math.min(.85, Math.max(.4, radius * 2.7)));
    }
  };
  out.update = (t, amt) => {
    out.pillar.rotation.y = t * 0.5; out.pillar.material.opacity = Showcase.on ? .04 : 0.14 + Math.sin(t * 2.4) * 0.05;
    out.ring.rotation.y = -t * 0.8; out.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
    if (out.wings) { const fl = 0.45 + Math.sin(t * (3 + amt * 5)) * (0.18 + amt * 0.2); out.wings[0].rotation.y = -fl; out.wings[1].rotation.y = fl; for (const wing of out.wings) wing.scale.setScalar(out.scale * (Showcase.on ? .5 : 1)); }
    if (out.crown && !out.attached) { out.crown.rotation.y = t * 1.1; out.crown.position.y = 2.42 + Math.sin(t * 2) * 0.05; }
  };
  return out;
}

// Characters are only ever their 3D model: while it loads you see the shadow and ring, never a code-built body.
// If a model can't load, the next stand-in model in the list is used (still a real model, never primitives).
const STANDIN_MODELS = ['hero.wave', 'hero.arrow', 'hero.orb'];
AssetSlots.register('character', (o) => {
  const root = new THREE.Group();
  const shadow = new THREE.Mesh(geoShadow, matShadow); shadow.scale.setScalar(0.62); shadow.position.y = 0.03; root.add(shadow);
  const pivot = new THREE.Group(); root.add(pivot);
  const tint = new THREE.Color(); // status glow (armour, slow, haste, hit flash), applied to the model's own materials
  const want = o.model || ('hero.' + o.cls);
  const queue = [want, ...STANDIN_MODELS].filter((id, i, a) => AssetLibrary.has(id) && a.indexOf(id) === i);
  let hero = null, heroLegs = null, heroMotion = null, clipMotion = null, gearDispose = null, aura = null, popT = 0;
  const asc = HERO_OVERLAYS && o.asc ? addAscended(root, pivot, o.asc) : null;
  const swapModels = () => {
    while (queue.length) {
      const id = queue[0], st = AssetLibrary.status(id);
      if (st === 'none') AssetLibrary.request(id);
      if (st === 'failed') { queue.shift(); continue; }
      if (st !== 'ready') return;
      queue.length = 0;
      hero = AssetLibrary.instance(id); pivot.add(hero); popT = 0.001;
      const L = hero.getObjectByName('legLPivot'), R = hero.getObjectByName('legRPivot'); if (L && R) heroLegs = [L, R];
      const def = ASSET_MANIFEST[id];
      const worn = HERO_OVERLAYS ? o.gear : o.gear && { weapon: o.gear.weapon }; // overlays off: no gear pieces (orb, rings, gem) on the body
      if (!def.npc) { if (def.original) gearDispose = equipOriginalAdventurer(hero, def, worn, THREE); else if (def.v4) gearDispose = equipV4Hero(hero, worn, THREE); }
      if (asc) asc.bindHero(hero, def);
      if (def.animated) clipMotion = createKayKitMotion(THREE, hero, hero.animations, def);
      heroMotion = def.armRig ? bindHeroMotion(hero) : null;
      const ar = gearAuraRarity(o.gear);
      if (HERO_OVERLAYS && ar && !o.peer) {
        aura = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: auraTexture(), color: RAR_HEX[ar], transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
        aura.position.y = 0.04; aura.userData.k = rarIdx(ar); root.add(aura);
      }
    }
  };
  swapModels();
  let ring = null;
  if (o.ring) {
    ring = pxRingMesh(0.82, 1.0, { color: o.ring, transparent: true, opacity: o.xray ? 0.5 : 0.85, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -40 });
    if (o.xray) { // facing marker in front of the ring
      const tri = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.22, 0, 1.08), new THREE.Vector3(0.22, 0, 1.08), new THREE.Vector3(0, 0, 1.42)]); tri.computeVertexNormals();
      const tm = new THREE.MeshBasicMaterial({ color: o.ring, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -40 });
      ring.add(new THREE.Mesh(tri, tm)); ring.userData.tm = tm;
    }
    ring.position.y = 0.3; ring.renderOrder = 0; root.add(ring); // sits above the bumpiest ground; the offset keeps it under the hero
  }
  let phase = Math.random() * 6, deadT = 0;
  return {
    root, ring,
    update(e, dt, t) {
      root.position.set(e.x, 0, e.z);
      root.rotation.y += angDiff(root.rotation.y, e.facing) * (1 - Math.exp(-dt * 18));
      const amt = e.moveAmt || 0;
      phase += dt * amt * 11;
      if (!hero) swapModels();
      pivot.position.y = 0;
      if (heroLegs) { heroLegs[0].rotation.x = Math.sin(phase) * 0.7 * amt; heroLegs[1].rotation.x = -Math.sin(phase) * 0.7 * amt; hero.rotation.x = amt * 0.06; }
      if (heroMotion) animateHeroMotion(heroMotion, phase, amt, e.attackAnim || 0, t, dt);
      if (clipMotion) clipMotion.update(e, dt);
      // the model arrives with a quick pop instead of appearing out of nowhere
      if (popT > 0 && popT < 1) { popT = Math.min(1, popT + dt * 5); const k = 1 - Math.pow(1 - popT, 3); pivot.scale.setScalar(0.6 + 0.4 * k + Math.sin(popT * Math.PI) * 0.08); } else pivot.scale.setScalar(1);
      if (aura) { const k = 0.5 + aura.userData.k * 0.06; aura.material.opacity = k * (0.8 + Math.sin(t * 3) * 0.2); aura.rotation.y = t * 0.4; }
      const f = e.flashT > 0 ? 0.9 : 0;
      if (e.armorT > 0) tint.setRGB(0.35 + f, 0.28 + f, 0.05 + f);
      else if (e.slowT > 0) tint.setRGB(f, 0.15 + f, 0.35 + f);
      else if (e.swiftT > 0) tint.setRGB(f, 0.25 + f, 0.1 + f);
      else if (o.xray && e.invulnT > 0 && e.dashT <= 0) { const k = 0.25 + Math.sin(t * 20) * 0.15; tint.setRGB(k + f, k + f, k * 0.8 + f); }
      else tint.setRGB(f, f, f);
      if (hero) AssetLibrary.flash(hero, tint.r * 0.6, tint.g * 0.6, tint.b * 0.6);
      if (e.alive === false) { deadT += dt; const s = Math.max(0, 1 - Math.max(0, deadT - (clipMotion ? .8 : 0)) * 2.5); root.scale.setScalar(s); root.visible = s > 0; }
      else { deadT = 0; root.scale.setScalar(1); root.visible = true; }
      if (ring) { if (o.xray) { ring.rotation.y = -root.rotation.y + e.facing; ring.material.opacity = 0.42 + Math.sin(t * 4) * 0.1; if (ring.userData.tm) ring.userData.tm.opacity = ring.material.opacity; } else ring.rotation.y += dt * 0.6; }
      if (asc) asc.update(t, amt);
    },
    dispose() { if (clipMotion) clipMotion.dispose(); AssetLibrary.disposeInstance(hero); if (gearDispose) gearDispose(); if (aura) { aura.geometry.dispose(); aura.material.dispose(); } if (ring) { ring.geometry.dispose(); ring.material.dispose(); if (ring.userData.tm) ring.userData.tm.dispose(); } if (asc) for (const m of asc.mats) m.dispose(); },
  };
});

