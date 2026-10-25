// ---------------------------------------------------------------------
// Lanes gear: three loadout slots (Relic, Charm, Banner) that only work inside Ascendant Lanes matches (Casper, 25 Oct:
// "people need enough reasons to grind in-game, like special gear you can only wear in-game by crafting it"). Every
// piece is crafted at Garo's Forge › Craft from what you farm in the open world: the biome's ore, monster parts and
// dungeon cores, and Titan Souls for the high ranks of the later biomes. Crafting again ranks a piece up (1-5).
// They are sidegrades with their own effect, not raw power: each rank adds CFG.lanesGear.power to the match bonus,
// and the whole bonus stays under CFG.lanes.gearCap, so trophies and skill decide. Cosmetic layer: any crafted piece
// can colour your match trail and your respawn pillar (code VFX). Never sold, never bought (README rule 5).
// ---------------------------------------------------------------------
CFG.lanesGear = {
  slots: ['relic', 'charm', 'banner'], power: 0.004, maxRank: 5,
  // eff: what it does in a match; v: per rank. biome: where its materials come from (higher biome = stronger kinds)
  items: [
    { id: 'oakseed', slot: 'relic', biome: 0, name: 'Oakheart Seed', icon: 'n_regen', col: 0x7fd36a, eff: 'respawn', v: 0.6, d: (v) => `Respawn ${v.toFixed(1)} s faster` },
    { id: 'wolffang', slot: 'charm', biome: 0, name: 'Mossy Wolf Fang', icon: 'k_bloodthirst', col: 0x9fd77a, eff: 'superGain', v: 0.05, d: (v) => `SUPER charges ${Math.round(v * 100)}% faster` },
    { id: 'greenbanner', slot: 'banner', biome: 0, name: 'Greenwood Standard', icon: 'n_aoe', col: 0x58e08a, eff: 'minionAura', v: 0.04, d: (v) => `Minions near you hit ${Math.round(v * 100)}% harder` },
    { id: 'frostsigil', slot: 'relic', biome: 1, name: 'Frostbound Sigil', icon: 'k_phase', col: 0x9fe8ff, eff: 'dashSlow', v: 0.35, d: (v) => `DASH leaves a frost trail that slows for ${v.toFixed(1)} s` },
    { id: 'rimecharm', slot: 'charm', biome: 1, name: 'Rimeglass Charm', icon: 'n_xp', col: 0xbfefff, eff: 'xp', v: 0.04, d: (v) => `+${Math.round(v * 100)}% match XP` },
    { id: 'cinderbanner', slot: 'banner', biome: 2, name: 'Cinder Warbanner', icon: 'a_ember', col: 0xff7a3a, eff: 'tower', v: 0.04, d: (v) => `Towers and Cores take +${Math.round(v * 100)}% from you` },
    { id: 'embercrown', slot: 'relic', biome: 2, name: 'Ember Crown Shard', icon: 'u_crown', col: 0xffa040, eff: 'startLvl', v: 0, d: (v, r) => `Start at level ${r >= 4 ? 3 : 2}, but ${Math.max(4, 12 - 2 * r)}% less max HP` },
    { id: 'voidprism', slot: 'charm', biome: 3, name: 'Void Prism', icon: 'k_grasp', col: 0xb98cff, eff: 'healTake', v: 0.04, d: (v) => `Takedowns heal ${Math.round(v * 100)}% of your max HP` },
    { id: 'tidepearl', slot: 'relic', biome: 4, name: 'Tidecaller Pearl', icon: 'k_kraken', col: 0x5dd6ff, eff: 'shield', v: 0.05, d: (v) => `Respawn with a ${Math.round(v * 100)}% shield for 6 s` },
    { id: 'starbanner', slot: 'banner', biome: 5, name: 'Starfall Banner', icon: 'k_ascend', col: 0xfff0aa, eff: 'campBuff', v: 0.06, d: (v) => `Lane Guardian's might lasts ${Math.round(v * 100)}% longer, +${Math.round(v * 50)}% stronger` },
  ],
};
const LG_BY_ID = Object.fromEntries(CFG.lanesGear.items.map((it) => [it.id, it]));
const lanesGearRank = (p, id) => (((p || G.profile).lanes || {}).gear || {})[id] | 0;
// what a rank costs: the biome's ore, monster parts, dungeon cores from rank 2, Titan Souls from rank 4 in the later
// biomes, and gold at the biome's level (recipe table in docs/log/2026-10-25-lanes-mode.md)
function lanesGearCost(it, rank) {
  const b = CB[it.biome], bi = it.biome, mats = [[b.ore, Math.round(25 * rank * Math.pow(1.2, bi))], [b.part, Math.round(10 * rank * Math.pow(1.2, bi))]];
  if (rank >= 2) mats.push([b.core, 1 + Math.floor(rank / 2)]);
  if (rank >= 4 && bi >= 2) mats.push([CFG.craft.titan.id, rank - 3]);
  return { mats, gold: Math.round(CFG.forge.base * Math.pow(CFG.forge.growth, Math.max(1, biomeTop(bi) - 10)) * (1 + rank)) };
}
function lanesGearCraft(id) {
  const p = G.profile, it = LG_BY_ID[id]; if (!it) return false;
  const rec = lanesRec(), r = lanesGearRank(p, id); if (r >= CFG.lanesGear.maxRank || !biomeReached(it.biome, p)) return false;
  const cost = lanesGearCost(it, r + 1); if (!canPay(cost, p)) { toast('Not enough materials yet', 'bad'); return false; }
  pay(cost); rec.gear = rec.gear || {}; rec.gear[id] = r + 1; rec.eq = rec.eq || {}; if (!rec.eq[it.slot]) rec.eq[it.slot] = id;
  G.dirty = true; toast(`${it.name} ${r ? 'ranked up to ' + (r + 1) : 'crafted'} · works in Ascendant Lanes`, 'good'); return true;
}
function lanesGearEquip(id) { const it = LG_BY_ID[id], rec = lanesRec(); if (!it || !lanesGearRank(null, id)) return; rec.eq = rec.eq || {}; rec.eq[it.slot] = rec.eq[it.slot] === id ? undefined : id; if (!rec.eq[it.slot]) delete rec.eq[it.slot]; G.dirty = true; }
function lanesGearTrail(id) { const rec = lanesRec(); if (!lanesGearRank(null, id)) return; rec.fx = rec.fx === id ? '' : id; G.dirty = true; }
const lanesEquipped = (p) => { const eq = (((p || G.profile).lanes || {}).eq) || {}; return CFG.lanesGear.slots.map((s) => eq[s]).filter((id) => LG_BY_ID[id] && lanesGearRank(p, id)).map((id) => LG_BY_ID[id]); };
// the loadout's share of the capped match bonus
function lanesLoadoutBonus(p) { return lanesEquipped(p).reduce((a, it) => a + CFG.lanesGear.power * lanesGearRank(p, it.id), 0); }
// at match start: the effects your hero carries (G.player.lnGear), the start level, the trail colour
function lanesLoadoutStart(f) {
  const p = G.profile, g = f.lnGear = {};
  for (const it of lanesEquipped(p)) { const r = lanesGearRank(p, it.id); g[it.eff] = it.eff === 'startLvl' ? r : it.v * r; }
  if (g.superGain) f.gearSuper += g.superGain;
  if (g.startLvl) { f.lnBase.hp *= 1 - Math.max(4, 12 - 2 * g.startLvl) / 100; f.lnLvl = g.startLvl >= 4 ? 3 : 2; lanesApplyLevel(f, true); }
  const fx = LG_BY_ID[(p.lanes || {}).fx]; f.lnTrail = fx ? fx.col : null;
}
// --- the Forge › Craft section (61-panels.js craftTabHTML) and the lobby summary (76-lanes-mp.js) ---
function lanesCraftHTML(bi, p) {
  const list = CFG.lanesGear.items.filter((it) => it.biome === bi); if (!list.length) return '';
  const open = biomeReached(bi, p), eq = ((p.lanes || {}).eq) || {};
  const rows = list.map((it) => {
    const r = lanesGearRank(p, it.id), max = r >= CFG.lanesGear.maxRank, cost = max ? null : lanesGearCost(it, r + 1), can = open && !max && canPay(cost, p);
    const need = cost ? cost.mats.map(([id, n]) => `${fmtK(n)} ${escapeHTML((MATS[id] || {}).name || id)}`).join(' · ') + ` · ${fmtK(cost.gold)} gold` : 'Fully ranked';
    return `<div class="item craftRow lnGear" style="--mc:${hex6(it.col)}"><span class="lnGearIc">${gi(it.icon)}</span><div class="meta"><div class="slot">Lanes ${it.slot} · rank ${r}/${CFG.lanesGear.maxRank}${eq[it.slot] === it.id ? ' · equipped' : ''}</div>
      <div class="nm">${escapeHTML(it.name)}</div><div class="st">${escapeHTML(it.d(it.v * Math.max(1, r), Math.max(1, r)))}</div><div class="st fine">${need}</div></div>
      <button class="${can ? 'primary' : 'disabled'}" data-act="lnGCraft" data-id="${it.id}" ${can ? '' : 'aria-disabled="true"'}>${r ? 'Rank up' : 'Craft'}</button></div>`;
  }).join('');
  return `<div class="card craftSet" style="--mc:#7fd8ff"><h4>Lanes gear · only in Ascendant Lanes</h4><p class="fine">Sidegrades for your matches: an effect, not raw power (counts toward the +${Math.round(CFG.lanes.gearCap * 100)}% cap).</p></div><div class="list">${rows}</div>`;
}
function lanesLoadoutHtml() {
  const p = G.profile, eq = ((p.lanes || {}).eq) || {}, have = CFG.lanesGear.items.filter((it) => lanesGearRank(p, it.id)), fx = (p.lanes || {}).fx;
  const slot = (s) => { const it = LG_BY_ID[eq[s]]; return `<div class="lnSlot${it ? ' on' : ''}" style="--mc:${it ? hex6(it.col) : '#555'}">${it ? gi(it.icon) : gi('m_lock')}<small>${it ? escapeHTML(it.name) : s[0].toUpperCase() + s.slice(1)}</small>${it ? `<b>${lanesGearRank(p, it.id)}</b>` : ''}</div>`; };
  const picks = have.length ? `<div class="lnPicks">${have.map((it) => `<button class="ghost lnPick${eq[it.slot] === it.id ? ' on' : ''}" data-act="lnGEquip" data-id="${it.id}" style="--mc:${hex6(it.col)}">${gi(it.icon)}<span>${escapeHTML(it.name)}</span></button><button class="ghost lnTrailBtn${fx === it.id ? ' on' : ''}" data-act="lnGTrail" data-id="${it.id}" style="--mc:${hex6(it.col)}" aria-label="Trail colour">Trail</button>`).join('')}</div>` : `<p class="fine">Craft Lanes gear at Garo's Forge › Craft from what you farm in the world.</p>`;
  return `<div class="lnLoadout">${CFG.lanesGear.slots.map(slot).join('')}</div>${G.lanes ? '' : picks}`;
}
function lanesGearAction(act, b) {
  const id = b.dataset.id;
  if (act === 'lnGCraft') { if (lanesGearCraft(id)) Sfx.play('coin'); openSmith('Craft'); return; }
  if (act === 'lnGEquip') lanesGearEquip(id); else if (act === 'lnGTrail') lanesGearTrail(id);
  openLanesPanel();
}
// --- end Lanes gear
