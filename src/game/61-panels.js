// --- interact / panels ---
function interact() {
  const n = G.interact; if (!n || G.mode !== 'hub') return;
  Sfx.play('click');
  if (n.kind === 'waypoint') return openWaypoints();
  if (n.kind === 'rift') return openRiftPanel();
  if (n.kind === 'riftLeave') return endRift('leave');
  if (n.kind === 'dungeon') return openDungeonPanel(n.poi);
  if (n.kind === 'trial') return openTrialPanel(n.zone);
  if (n.kind === 'mine') return mineNode(n.st);
  if (n.kind === 'dungeonLeave') return endDungeon('leave');
  if (n.kind === 'dungeonChest') return openDungeonChest();
  const d = n.def;
  if (d.role === 'smith') return openSmith();
  if (d.role === 'arena') return openArenaPanel();
  openNpc(d);
}
// Systems open slowly with level: a locked button shows its level; a newly opened one glows until you tap it
const UNLOCK_AT = { mArtifacts: 2, mDaily: 2, mSmith: 3, mCollection: 4, mSkills: 5, Forge: 6, mIdle: 8, mBrawlers: 9, Masterwork: 10, mArena: 10, Enchant: 12, Craft: 15 };
const UNLOCK_NAME = { mArtifacts: 'Relics', mDaily: 'Daily rewards', mSmith: 'Forge', mCollection: 'Collection Log', mSkills: 'Talents', Forge: 'Forge › Buy gear', mIdle: 'Bank & Camp',
  mBrawlers: 'Heroes', Masterwork: 'Forge › Masterwork', mArena: 'Showdown', Enchant: 'Forge › Enchant', Craft: 'Forge › Craft' };
const unlockOpen = (k) => !G.profile || G.profile.level >= (UNLOCK_AT[k] || 0);
const unlockNew = (k) => !!UNLOCK_AT[k] && unlockOpen(k) && !(G.profile.uiSeen || {})[k];
function unlockSeen(k) { if (!unlockNew(k)) return; (G.profile.uiSeen || (G.profile.uiSeen = {}))[k] = true; G.dirty = true; }
// attributes for a gated button: locked (disabled, shows "Lv N") or freshly opened (glows)
const gate = (k) => !unlockOpen(k) ? ' locked" aria-disabled="true' : unlockNew(k) ? ' newU' : '';
const lockLabel = (k, name) => unlockOpen(k) ? name : `${gi('m_lock')} Lv ${UNLOCK_AT[k]}`;
// Four hubs (Hero, Forge, Gear, Journal): one bar on top of every hub screen, plus the hub's own sub-tabs
const HUB_OF = { hero: 'hero', skills: 'hero', artifacts: 'hero', brawlers: 'hero', smith: 'forge', merge: 'forge',
  menu: 'journal', progress: 'journal', daily: 'journal', collection: 'journal', prestige: 'journal', idle: 'journal', cases: 'equip', players: 'journal' };
const HUB_SUB = { hero: [['hero', 'Stats', 'mHero'], ['skills', 'Talents', 'mSkills'], ['artifacts', 'Relics', 'mArtifacts'], ['brawlers', 'Heroes', 'mBrawlers']],
  journal: [['menu', 'World', 'mJournal'], ['progress', 'Log', 'mProgress'], ['daily', 'Daily', 'mDaily']] };
function hubNav() {
  let hub = HUB_OF[UI.current]; if (!hub) return '';
  if (UI.current === 'hero' && UI.heroTab === 'Gear') hub = 'equip';
  const sub = (HUB_SUB[hub] || []).map(([k, n, act]) => `<button class="tab ${k === UI.current ? 'on' : ''}${gate(act)}" data-act="${act}">${lockLabel(act, n)}</button>`).join('');
  return `<div class="hubTop"><button class="ghost hubBack" data-act="mMenu" aria-label="Back to the menu">Menu</button>${sub ? `<div class="tabs hubSub">${sub}</div>` : ''}</div>`;
}
function openModal(html, closable, showcase) {
  G.modal = true; UI.closable = closable !== false;
  const panelKind = UI.current + (UI.current === 'hero' ? '|' + UI.heroTab + '|' + (UI.gearAll && UI.heroTab === 'Gear' ? 'all' : UI.gearSlot) : UI.current === 'collection' ? '|' + UI.collectionSlot : UI.current === 'artifacts' ? '|' + UI.artTab + '|' + UI.relicTier : '');
  const prevBody = $('panel').querySelector(':scope > .pBody'), same = UI.panelKind === panelKind;
  const scroll = same ? (prevBody ? prevBody.scrollTop : $('panel').scrollTop) : 0; UI.panelKind = panelKind;
  if (!same) UI.moreOpen = false;
  $('panel').className = 'panel scroll';
  setShowcase(!!showcase);
  $('modal').classList.toggle('room', !!showcase);
  // every hub screen except the Hero (3D showcase) fills the whole page
  $('modal').classList.toggle('full', !showcase && (UI.current === 'hubs' || UI.current === 'reel' || UI.current === 'worldmap' || UI.current === 'waypoints' || !!HUB_OF[UI.current]));
  if (!showcase) UI.sheetFull = false;
  $('modal').classList.toggle('sheetFull', !!showcase && !!UI.sheetFull);
  const full = hubNav() + html + (UI.closable ? '<button class="x" data-act="close" aria-label="Close">×</button>' : '');
  if (same) { // redraw of the same screen: keep the already-decoded pictures so tiles don't blink on phones
    const old = new Map(); for (const im of $('panel').querySelectorAll('img')) { const k = im.getAttribute('src'); if (k) (old.get(k) || old.set(k, []).get(k)).push(im); }
    const tpl = document.createElement('template'); tpl.innerHTML = full;
    for (const im of tpl.content.querySelectorAll('img')) { const reuse = old.get(im.getAttribute('src')); const o = reuse && reuse.shift(); if (o) { o.className = im.className; o.alt = im.alt; o.style.cssText = im.style.cssText; im.replaceWith(o); } }
    $('panel').replaceChildren(tpl.content);
  } else $('panel').innerHTML = full;
  $('modal').hidden = false;
  const body = $('panel').querySelector(':scope > .pBody');
  if (body) { $('panel').classList.remove('scroll'); $('panel').classList.add('dock'); body.scrollTop = scroll; syncMore(); }
  else $('panel').scrollTop = scroll;
  // a tap that redraws the same screen keeps the tapped button under the finger (no jump when the bar below changes)
  const A = UI.tapAnchor; UI.tapAnchor = null;
  if (same && A) { const el = $('panel').querySelector(A.sel), sc = body || $('panel'); if (el) {
    const d = el.parentElement.getBoundingClientRect().top - A.top; if (Math.abs(d) > 0.5) sc.scrollTop += d;
    const r = el.getBoundingClientRect(), v = sc.getBoundingClientRect(); if (r.bottom > v.bottom) sc.scrollTop += r.bottom - v.bottom + 4; } }
  measureSheet();
  Input.move.id = null; Input.move.active = false; Input.move.sx = Input.move.sy = 0; $('stickBase').classList.remove('on');
  Input.atk.id = null; Input.atk.aiming = false; Input.atk.active = false; $('atkKnob').style.transform = 'translate(0px,0px)';
}
// where a tapped panel button sits, so openModal can put it back in the same place after a redraw
function panelAnchor(b) {
  if (!$('panel').contains(b)) return null;
  const d = b.dataset, esc = (v) => (window.CSS && CSS.escape ? CSS.escape(v) : v);
  let sel = `[data-act="${esc(d.act)}"]`;
  for (const k of ['id', 'slot', 'tab', 'k', 'v']) if (d[k] != null && d[k] !== '') sel += `[data-${k}="${esc(d[k])}"]`;
  if (b.closest('.pBar')) return null; // the action bar is pinned, nothing to keep in place
  return { sel, top: b.parentElement.getBoundingClientRect().top }; // the parent: a pressed button is nudged by its :active style
}
// --- Reusable panel parts ------------------------------------------------------------------------
// dock(): the header stays on top, the middle scrolls, and the action bar is always on screen.
function dock(head, body, bar) { return `${head || ''}<div class="pBody">${body}</div>${bar ? `<div class="pBar">${bar}</div>` : ''}`; }
// selBar(): a short summary of the selection; "Details" opens more information in place, above the buttons.
function selBar(summary, buttons, more, note) {
  return `${summary ? `<div class="pSel">${summary}${more ? '<button class="pMoreBtn" data-act="pMore" aria-expanded="false">Details</button>' : ''}</div>` : ''}${more ? `<div class="pMore">${more}</div>` : ''}${note ? `<p class="pNote">${note}</p>` : ''}${buttons ? `<div class="pBtns">${buttons}</div>` : ''}`;
}
function syncMore() {
  const bar = $('panel').querySelector('.pBar'), b = bar && bar.querySelector('[data-act="pMore"]'); if (!bar) return;
  bar.classList.toggle('open', !!UI.moreOpen); if (b) { b.textContent = UI.moreOpen ? 'Less' : 'Details'; b.setAttribute('aria-expanded', !!UI.moreOpen); }
}
const rarCol = (r) => '#' + RAR_HEX[r].toString(16).padStart(6, '0');
// itemGrid(): every piece of one gear slot at once, as small tiles. mark(it) adds a corner badge and a state.
function itemGrid(items, o) {
  o = o || {};
  if (!items.length) return `<p class="fine">${o.empty || 'Nothing here yet.'}</p>`;
  return `<div class="igrid">${items.map((it) => { const m = (o.mark && o.mark(it)) || {};
    const label = `${escapeHTML(it.name)}${it.up ? ' +' + it.up : ''}, ${CFG.gear.rarity[it.rarity].name}${it.locked ? ', protected' : ''}${m.label ? ', ' + m.label : ''}`;
    return `<button class="igt ${it.rarity} ${o.sel === it.id ? 'sel' : ''} ${m.cls || ''}" ${o.act ? `data-act="${o.act}" data-id="${escapeHTML(it.id)}"` : 'tabindex="-1"'} style="--rc:${rarCol(it.rarity)}" aria-label="${label}" title="${label}">`
      + `<img src="${thumbFor(it)}" alt="">${it.up ? `<span class="iu">+${it.up}</span>` : ''}${it.locked ? `<span class="ilk">${gi('m_lock')}</span>` : ''}${m.text ? `<span class="ib">${m.text}</span>` : ''}</button>`; }).join('')}</div>`;
}
// one-line item summary for an action bar
function itemSummary(it, extra) {
  return `<img src="${thumbFor(it)}" alt="" style="--rc:${rarCol(it.rarity)}"><div class="sx"><b>${escapeHTML(it.name)}${it.up ? ` +${it.up}` : ''}</b><small>${CFG.gear.rarity[it.rarity].name} · ${SLOT_LABEL[it.slot]} · item level ${it.ilvl}</small><small>${extra || statLine(it)}</small></div>`;
}
// Menu size (Options): menus and the HUD are drawn at this zoom. Compact (the default) fits about a third more on a phone.
const UI_SIZES = [{ name: 'Compact', z: 0.84 }, { name: 'Normal', z: 1 }, { name: 'Large', z: 1.15 }];
function applyUiSize() {
  const z = (UI_SIZES[(G.profile && G.profile.settings.uiSize) | 0] || UI_SIZES[0]).z;
  document.documentElement.style.setProperty('--uiz', z);
}
// --- build preview: the hero's numbers now, and with one bag piece swapped in -------------------------------------
// applyStats runs on a copy of the player, so nothing in the game changes while you compare.
function previewStats(it) {
  const p = G.profile, f = Object.assign({}, G.player);
  applyStats(f, 'hub', it ? Object.assign({}, p, { gear: Object.assign({}, p.gear, { [it.slot]: it }) }) : p);
  return f;
}
const pctS = (x) => `${Math.round(x * 100)}%`;
const BUILD_STATS = [
  ['Damage', (f) => f.dmg, (x) => fmtK(x)],
  ['Max HP', (f) => f.maxHp, (x) => fmtK(x)],
  ['Crit', (f) => CFG.combat.critChance + f.critBonus, pctS],
  ['Crit dmg', (f) => CFG.combat.critMult + f.critDmg, (x) => '×' + x.toFixed(2)],
  ['Atk spd', (f) => f.atkSpeed || 0, (x) => (x >= 0.005 ? '+' : '') + pctS(x)],
  ['Lifesteal', (f) => f.lifesteal || 0, pctS],
  ['Armor', (f) => Math.min(0.6, f.armor || 0), pctS],
  ['Cooldown', (f) => f.cdr || 0, (x) => (x >= 0.005 ? '-' : '') + pctS(x)],
];
// eight key stats in a 4×2 ledger; with a picked piece each one shows what it would gain or lose
function statStrip(pick) {
  const now = previewStats(null), then = pick ? previewStats(pick) : null;
  return `<div class="bstats" aria-label="${pick ? 'Your stats if you equip this piece' : 'Your stats'}">${BUILD_STATS.map(([k, get, f]) => {
    const a = get(now), b = then ? get(then) : a, d = b - a, big = Math.abs(d) > Math.max(1e-6, Math.abs(a) * 0.0005);
    const dt = !then || !big ? '' : `<em class="${d > 0 ? 'gain' : 'loss'}">${d > 0 ? '▲' : '▼'}${k === 'Damage' || k === 'Max HP' ? fmtK(Math.abs(d)) : f(Math.abs(d)).replace(/^[+-]/, '')}</em>`;
    return `<div><span>${k}</span><b>${f(then ? b : a)}</b>${dt}</div>`; }).join('')}</div>`;
}
// changes to your stats if you wear this piece instead of the worn one, as small green/red chips
function diffChips(it) {
  const now = previewStats(null), then = previewStats(it);
  const out = BUILD_STATS.map(([k, get, f]) => { const a = get(now), d = get(then) - a; if (Math.abs(d) <= Math.max(1e-6, Math.abs(a) * 0.0005)) return '';
    return `<i class="${d > 0 ? 'gain' : 'loss'}">${d > 0 ? '▲' : '▼'}${k === 'Damage' || k === 'Max HP' ? fmtK(Math.abs(d)) : f(Math.abs(d)).replace(/^[+-]/, '')} ${k}</i>`; }).join('');
  return out ? `<span class="dchips">${out}</span>` : '<span class="dchips"><i>Same stats</i></span>';
}
// --- hero sheet (portrait dressing room): a bottom sheet at 45% that the grip drags up to full height and back ---
// The sheet's rect is cached here (open, resize, drag) so the camera and paper doll never read layout per frame.
UI.sheet = { top: 0, left: 0, right: 0, bottom: 0 };
function measureSheet() {
  if ($('modal').hidden) return;
  const r = $('panel').getBoundingClientRect(), S = UI.sheet;
  S.top = r.top; S.left = r.left; S.right = r.right; S.bottom = r.bottom;
  // the spin hint sits just above the sheet, over the hero's side of the screen
  const hint = $('spinHint');
  if (Cam.portrait) { hint.style.top = `${Math.max(8, r.top - 30)}px`; hint.style.left = ''; hint.style.width = ''; }
  else { hint.style.top = ''; hint.style.left = '16px'; hint.style.width = `${Math.max(120, r.left - 32)}px`; }
}
function setSheetFull(full) {
  UI.sheetFull = full; $('modal').style.removeProperty('--sheet');
  $('modal').classList.toggle('sheetFull', full);
  $('sheetGrip').setAttribute('aria-expanded', String(full)); $('sheetGrip').setAttribute('aria-label', full ? 'Show the hero' : 'Expand the list');
  measureSheet();
}
function setupSheetGrip() {
  const grip = $('sheetGrip'), modal = $('modal'); let drag = null, dragged = false;
  grip.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); dragged = false; drag = { id: e.pointerId, y: e.clientY, h: $('panel').getBoundingClientRect().height, moved: false };
    try { grip.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  });
  grip.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = e.clientY - drag.y; if (Math.abs(dy) > 6) drag.moved = true; if (!drag.moved) return;
    modal.classList.add('dragging'); modal.style.setProperty('--sheet', `${Math.round(Math.max(200, drag.h - dy))}px`); measureSheet();
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null; modal.classList.remove('dragging');
    if (!d.moved) return; // a tap: the click below toggles (keyboards and screen readers click too)
    // snap to whichever stop the finger ended nearer, and swallow the click that follows the drag
    const h = $('panel').getBoundingClientRect().height, half = window.innerHeight * 0.6, full = window.innerHeight;
    dragged = true; setSheetFull(e.type !== 'pointercancel' && h > (half + full) / 2 - 60);
  };
  grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
  grip.addEventListener('click', (e) => { e.stopPropagation(); if (dragged) { dragged = false; return; } if (!Cam.portrait) return; Sfx.play('click'); setSheetFull(!UI.sheetFull); });
  for (const ev of ['transitionend', 'animationend']) modal.addEventListener(ev, (e) => { if (e.target.id === 'panel') measureSheet(); });
  // the full-height sheet only exists in portrait; turning the phone drops back to the side panel
  window.addEventListener('resize', () => requestAnimationFrame(() => { if (UI.sheetFull && !Cam.portrait) setSheetFull(false); else measureSheet(); }));
}
UI.close = function () { UI.sheetFull = false; $('modal').classList.remove('sheetFull'); $('modal').hidden = true; G.modal = false; setShowcase(false); UI.gearSlot = null; UI.current = null; UI.panelKind = null; UI.mergePlan = null; UI.afterClose && UI.afterClose(); UI.afterClose = null; };
const RAR_HEX = { common: 0xcfd6e0, uncommon: 0x8ee06a, rare: 0x58b4ff, epic: 0xc77dff, legendary: 0xffb347, mythic: 0xff4d6d, ancient: 0x2fffd0, divine: 0xfff3a0 };
const rarityChip = (r) => `<span class="rar ${r}">${CFG.gear.rarity[r].name}</span>`;
function statLine(it) {
  const s = itemStats(it), out = [];
  if (s.atk) out.push(`+${s.atk >= 100 ? fmtK(s.atk) : s.atk.toFixed(1)} ATK`); if (s.hp) out.push(`+${fmtK(s.hp)} HP`);
  if (s.speed) out.push(`+${Math.round(s.speed * 100)}% speed`); if (s.superGain) out.push(`+${Math.round(s.superGain * 100)}% super charge`);
  return out.join(' · ');
}
function perkLine(it) { const t = perkText(it); return t ? `<div class="perk">${t}</div>` : ''; }
// RuneScape-style display names for tabs whose keys stay the same in code
const TAB_NAME = { Mining: 'Mining & Museum', Gear: 'Inventory', Road: 'Level Road', Records: 'Hiscores', Feats: 'Achievements', Vault: 'Bank', Upgrade: 'Reforge', Gems: 'Gem trade', Equip: 'Socket', 'Auto Hunt': 'Auto-hunt' };
const tabName = (t) => TAB_NAME[t] || t;
const wearWord = (slot) => (slot === 'weapon' ? 'Wield' : 'Wear');
const SLOT_LABEL = { weapon: 'Weapon', helmet: 'Helmet', chest: 'Armor', boots: 'Boots', accessory: 'Accessory' };
const escapeHTML = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function openMerge(slot, bulk, back) {
  const p = G.profile, it = p.gear[slot]; if (!it) return;
  const plan = maxUpgradePlan(it, bulk ? 500 : 1), need = mergeRequired(it), available = mergeCandidates(it);
  UI.current = 'merge'; UI.mergePlan = Object.assign({ slot, bulk: !!bulk, back: back || 'hero' }, plan);
  const used = new Set(plan.materials), cand = new Set(available.map((m) => m.id));
  const pieces = p.bag.filter((m) => m.slot === slot).sort((x, y) => (used.has(y.id) - used.has(x.id)) || rarIdx(x.rarity) - rarIdx(y.rarity));
  const mark = (m) => used.has(m.id) ? { cls: 'use', text: '✓', label: 'will be consumed' } : m.locked ? { cls: 'kept', label: 'protected, kept' } : !cand.has(m.id) ? { cls: 'kept', text: '▲', label: 'better or equal, kept' } : { cls: 'kept', label: 'not needed, kept' };
  const after = Object.assign({}, it, { up: it.up + plan.n });
  const head = `<div class="npcHead"><h3>Reforge ${SLOT_LABEL[slot]}</h3></div>`;
  const body = `<div class="mergePreview"><img src="${thumbFor(it)}" alt=""><div><b>+${it.up} → +${after.up}</b><p class="fine">${statLine(it)}<br>→ ${statLine(after)}</p></div></div>
    <div class="subRow"><h4 class="sub">${SLOT_LABEL[slot]}s in your bag · ${pieces.length}</h4></div>
    <div class="ilegend"><span><i class="m1">✓</i>melted down (${plan.materials.length})</span><span><i class="up">▲</i>better or equal, kept</span><span>${gi('m_lock')} protected, kept</span><span>faded: kept</span></div>
    ${itemGrid(pieces, { mark, empty: `No other ${SLOT_LABEL[slot].toLowerCase()} pieces in your bag.` })}
    <p class="mergeNotice">The smith melts down only weaker pieces of the same slot, weakest first. Protected and worn gear is never touched. Your piece keeps its rarity and perks.</p>`;
  const note = plan.n ? `Melts <b>${plan.materials.length}</b> piece${plan.materials.length === 1 ? '' : 's'} (marked ✓) · ${costHTML(plan.gold, plan.ess)}`
    : `Next level needs ${need} weaker piece${need > 1 ? 's' : ''} (${available.length} available) · ${costHTML(upgradeCost(it), upgradeEssence(it))}`;
  const btn = `<button class="ghost" data-act="mergeBack">Back</button><button class="${plan.n ? 'primary' : 'disabled'}" data-act="mergeConfirm" ${plan.n ? '' : 'disabled'}>${plan.n ? `Reforge · +${plan.n} level${plan.n > 1 ? 's' : ''}` : it.up >= CFG.gear.maxUp ? 'Maximum level' : 'Need materials or currency'}</button>`;
  openModal(dock(head, body, selBar('', btn, '', note)), true, false);
}
function mergeReturn(back) { UI.mergePlan = null; if (back === 'smith') openSmith('Upgrade'); else heroTab('Gear'); }
function itemRow(it, right, extra, opts) {
  opts = opts || {};
  const flag = opts.better ? '<span class="better">Better<i class="rdot in"></i></span>' : opts.upgrade ? '<span class="better up">Can upgrade<i class="rdot in"></i></span>' : '';
  return `<div class="item ${it.rarity}${opts.better || opts.upgrade ? ' alert' : ''}"><span class="thw ${it.rarity}"><img class="thumb ${it.rarity}" src="${thumbFor(it)}" alt=""></span><div class="meta">${flag}<div class="slot">${extra || it.slot}</div><div class="nm">${escapeHTML(it.name)} ${it.up ? `<em>+${it.up}${it.up >= 10 ? ' ' + '★'.repeat(Math.min(5, Math.floor(it.up / 10))) + (it.up >= 60 ? '+' : '') : ''}</em>` : ''} ${rarityChip(it.rarity)}</div><div class="st">${statLine(it)}</div>${it.aff && Object.keys(it.aff).length ? `<div class="st aff">${affixText(it)}</div>` : ''}${perkLine(it)}</div>${right || ''}</div>`;
}
function openNpc(def) {
  UI.current = 'npc:' + def.id;
  { const n = (G.npcs || []).find((x) => x.def === def); if (n) { n.lastAttack = G.time; n.motionClip = 'Cheer'; } } // the townsperson waves when you talk
  const p = G.profile, j = p.job;
  let body = '', btns = '';
  if (j && j.npc === def.id) {
    if (j.progress >= j.count) {
      body = `<p class="say">“Wonderful work! Here’s what I promised.”</p><div class="card job"><h4>${j.title}</h4><p>Complete</p><div class="rew">${j.xp ? `<span class="xpchip">+${fmt(j.xp * progressionXpMultiplier(p))} XP</span>` : ''}<span class="goldchip">${ICON.coin}${fmt(j.gold)}</span></div></div>`;
      btns = `<button class="primary" data-act="turnin">Collect reward</button>`;
    } else {
      body = `<p class="say">“How’s it going? Come back when it’s done.”</p><div class="card job"><h4>${j.title}</h4><p>${j.progress} / ${j.count}</p></div>`;
      btns = `<button class="ghost" data-act="abandon">Abandon job</button><button class="primary" data-act="close">Keep going</button>`;
    }
  } else if (j) {
    const other = NPC_DEFS.find((n) => n.id === j.npc);
    body = `<p class="say">“You already have a job from ${other.name}. Finish that one first.”</p>`;
    btns = `<button class="primary" data-act="close">OK</button>`;
  } else if (p.level < def.minLevel) {
    body = `<p class="say">“You look a bit green. Come back at level ${def.minLevel} and I’ll have work for you.”</p>`;
    btns = `<button class="primary" data-act="close">OK</button>`;
  } else {
    const nj = jobFor(def.id), atCap = p.level >= P.cap;
    const xp = atCap ? 0 : Math.round(xpToNext(p.level) * CFG.jobs.xpFrac) * progressionXpMultiplier(p);
    const gold = Math.round((CFG.jobs.goldBase + CFG.jobs.goldPerLevel * p.level) * (atCap ? 2 : 1));
    body = `<p class="say">“${nj.text}”</p><div class="card job"><h4>${nj.title}</h4><p>${nj.type === 'kill' ? 'Defeat' : 'Collect'} ${nj.count} ${nj.target === 'berry' ? 'glowberries' : CFG.enemies[nj.target].name.toLowerCase() + (nj.count > 1 ? 's' : '')}</p><div class="rew">${xp ? `<span class="xpchip">+${fmt(xp)} XP</span>` : ''}<span class="goldchip">${ICON.coin}${fmt(gold)}</span></div></div>`;
    btns = `<button class="ghost" data-act="close">Not now</button><button class="primary" data-act="accept">Accept job</button>`;
  }
  openModal(`<div class="npcHead"><span class="dotc" style="background:#${def.body.toString(16).padStart(6, '0')}"></span><h3>${def.name}</h3></div>${body}<div class="row end">${btns}</div>`);
  UI.npc = def;
}
// one upgrade card: art, name, now → next, cost and the button (Forge tabs use the whole page as a grid of these)
function upCard(art, name, now, next, foot, btn, cls) {
  return `<div class="ucard ${cls || ''}"><div class="uart">${art}</div><b class="un">${name}</b><div class="uval">${now}${next ? `<i>→</i><em>${next}</em>` : ''}</div>${foot || ''}${btn}</div>`;
}
const MW_ART = { whetstone: 'weapon', plating: 'chest', bracers: 'accessory', treads: 'boots', satchel: 'm_case', purse: 'm_coin' };
const FORGE_ICONS = ['whetstone', 'plating', 'bracers', 'satchel']; // own pixel icons in assets/ui/forge/ (Z-Image-Turbo + tools/pixelize_items.py)
const mwArt = (id) => { if (FORGE_ICONS.includes(id)) return `<img src="assets/ui/forge/${id}.png" alt="">`; const a = MW_ART[id] || 'm_smith'; return a.startsWith('m_') ? gi(a) : `<img src="${thumbFor({ id: 'mw-' + id, slot: a, rarity: 'epic', up: 0, ilvl: 1, name: ITEM_NAMES[a][a === 'weapon' ? 0 : 1] })}" alt="">`; };
function hsRender(open, picked) {
  const g = $('panel').querySelector('.hswap .igrid'); if (g) UI.hsScroll = g.scrollLeft;
  UI.hsOpenAnim = open; UI.hsPickAnim = picked; heroTab('Stats'); UI.hsOpenAnim = UI.hsPickAnim = false;
  const n = $('panel').querySelector('.hswap .igrid'); if (n) n.scrollLeft = UI.hsScroll || 0;
}
function hsClose() {
  const w = $('panel').querySelector('.hswap'); if (!w) { UI.heroSlot = UI.heroPick = null; heroTab('Stats'); return; }
  UI.hsAll = false; w.classList.add('closing'); setTimeout(() => { UI.heroSlot = UI.heroPick = null; heroTab('Stats'); }, 220);
}
// what a bag piece sells for; worn gear is not for sale and protected gear must be unprotected first
function sellRow(it) {
  const p = G.profile, worn = Object.values(p.gear).some((x) => x && x.id === it.id);
  if (worn) return '';
  if (it.locked) return `<p class="sellLine fine">${gi('m_lock')} Protected. Unprotect it to sell.</p>`;
  const armed = UI.sellArm === it.id, ask = rarIdx(it.rarity) >= CFG.gear.sellConfirmFrom;
  return `<div class="sellLine"><button class="sellBtn${armed ? ' armed' : ''}" data-act="sellItem" data-id="${escapeHTML(it.id)}">${armed ? 'Tap again to sell' : 'Sell'}<span class="sp">${ICON.coin}<b>${fmtK(sellPrice(it))}</b></span></button>${ask && !armed ? '<small>Asks once more because it is rare.</small>' : ''}</div>`;
}
function openInspect(id) {
  const p = G.profile, it = p.bag.find((x) => x.id === id) || Object.values(p.gear).find((x) => x && x.id === id); if (!it) return;
  const back = UI.current, ri = rarIdx(it.rarity);
  UI.inspectBack = back;
  openModal(`<div class="insp ${it.rarity} ${ri >= 3 ? 'rays' : ''}" style="--rc:${rarCol(it.rarity)}"><div class="inspArt"><img src="${thumbFor(it)}" alt=""></div>
    <b class="inspName">${escapeHTML(it.name)}${it.up ? ` +${it.up}` : ''}</b>${rarityChip(it.rarity)}${it.unique != null ? '<span class="inspTag">Unique</span>' : ''}
    <p class="inspStat">${statLine(it)}</p>${it.aff && Object.keys(it.aff).length ? `<p class="inspAff">${affixText(it).split(' · ').join('<br>')}</p>` : ''}${perkLine(it)}
    ${sellRow(it)}<div class="row end"><button class="primary" data-act="inspectClose">Back</button></div></div>`);
  if (ri >= 4) Sfx.play('unlock');
}
function openSmith(tab) {
  if (!unlockOpen('mSmith')) { toast(`The Forge opens at level ${UNLOCK_AT.mSmith}`, 'bad'); return; }
  tab = tab || UI.smithTab || 'Upgrade'; if (!['Upgrade', 'Masterwork', 'Craft', 'Forge', 'Enchant'].includes(tab) || !unlockOpen(tab)) tab = 'Upgrade'; UI.smithTab = tab; unlockSeen(tab);
  UI.current = 'smith';
  const p = G.profile;
  let body;
  if (tab === 'Upgrade') {
    // show the result first (+level and stats after), the button then opens the list of pieces it melts
    body = '<div class="ugrid">' + CFG.gear.slots.map((s) => {
      const it = p.gear[s];
      if (!it) return upCard(gi('m_lock'), SLOT_LABEL[s], 'empty', '', '', `<button class="ghost" data-act="slot" data-slot="${s}">Equip</button>`, 'none');
      const max = it.up >= CFG.gear.maxUp, mp = maxUpgradePlan(it), can = maxUpgradePlan(it, 1).n > 0;
      const after = Object.assign({}, it, { up: it.up + Math.max(1, mp.n) });
      const btn = max ? '<button class="disabled" disabled>Max</button>'
        : `<button class="${can ? 'primary' : 'ghost'}" data-act="${mp.n > 1 ? 'upgradeMax2' : 'upgrade'}" data-slot="${s}">${can ? `Reforge +${Math.max(1, mp.n)}` : 'Pieces'}</button>`;
      return upCard(`<img class="thumb ${it.rarity}" src="${thumbFor(it)}" alt="">`, `${SLOT_LABEL[s]} <span class="rar ${it.rarity}">+${it.up}</span>`,
        `<span>${statLine(it)}</span>`, max ? '' : `<span>+${after.up} · ${statLine(after)}</span>`, max ? '' : mergeCostHTML(it), btn, `${it.rarity}${can ? ' alert' : ''}`);
    }).join('') + '</div>';
  } else if (tab === 'Craft') body = craftTabHTML(p);
  else if (tab === 'Masterwork') body = masterworkTabHTML(p);
  else if (tab === 'Enchant') body = enchantTabHTML(p);
  else {
    body = '<div class="ugrid">' + CFG.gear.slots.map((s) => {
      const o = forgeOffer(s), can = p.gold >= o.price;
      return upCard(`<img class="thumb ${o.item.rarity}" src="${thumbFor(o.item)}" alt="">`, `${SLOT_LABEL[s]} ${rarityChip(o.item.rarity)}`, `<span>${statLine(o.item)}</span>`, '', perkLine(o.item),
        `<button class="${can ? 'primary' : 'disabled'}" data-act="forge" data-slot="${s}" ${can ? '' : 'aria-disabled="true"'}>${ICON.coin}${fmtK(o.price)}</button>`, o.item.rarity);
    }).join('') + '</div>';
  }
  const upAlert = Object.values(slotAlerts()).some((a) => a.canUpgrade);
  const tabs = ['Upgrade', 'Masterwork', 'Craft', 'Forge', 'Enchant'].map((t) => `<button class="tab ${tab === t ? 'on' : ''}${gate(t)}" data-act="smithTab" data-tab="${t}">${unlockOpen(t) ? `<img class="ftab" src="assets/ui/forge/tab-${t.toLowerCase()}.png" alt="">` : ''}${lockLabel(t, tabName(t))}${t === 'Upgrade' && upAlert ? '<i class="rdot tabdot"></i>' : ''}</button>`).join('');
  openModal(dock(`<div class="npcHead"><h3>Forge</h3><span class="goldchip big">${ICON.coin}${fmtK(p.gold)}</span><span class="esschip big">${ICON.ess}${fmtK(p.essence)}</span></div>
    <div class="tabs">${tabs}</div>`, `<div class="tabBody"><div class="pageArt" style="--art:url(assets/ui/forge/banner-${tab.toLowerCase()}.webp)"></div>${body}</div>`, ''), true, false);
}
// Inventory has three tabs: Gear (the bag, tap a piece to inspect or sell it), Chests (tap to open) and Resources.
const INV_TABS = ['Chests', 'Gear', 'Resources'];
const invTabNow = () => INV_TABS.includes(UI.invTab) ? UI.invTab : 'Chests';
const INV_SEC = { Chests: 'invSecChests', Gear: 'invSecGear', Resources: 'invSecRes' };
function invTabsHTML(tab, p) {
  return `<div class="tabs invTabs">${INV_TABS.map((t) => `<button class="tab ${t === tab ? 'on' : ''}${t === 'Chests' && p.cases.length ? ' hasChests' : ''}" data-act="invTab" data-tab="${t}" aria-pressed="${t === tab}">${t}${t === 'Chests' && p.cases.length ? `<span class="tcount">${p.cases.length}</span>` : ''}</button>`).join('')}</div>`;
}
function invChestsHTML(p) {
  const n = {}; for (const c of p.cases) n[c.k] = (n[c.k] || 0) + 1;
  const kinds = CFG.caseOrder.filter((k) => n[k]);
  const grid = kinds.length ? `<div class="invChestGrid">${kinds.map((k) => `<button class="ctile" data-act="caseSel" data-k="${k}" style="--cc:${CFG.cases[k].col}">${caseArt(k)}<b>${CFG.cases[k].name}</b><small>×${n[k]}</small></button>`).join('')}</div>`
    : '<p class="fine">No chests yet. Monsters, bosses and the Rift drop them.</p>';
  return `<div class="subRow"><h4 class="sub">Chests · ${p.cases.length}</h4></div>${grid}
    <p class="fine">Tap a chest to open it. Chests are earned in play and cannot be sold. Every chest shows its odds before you open it.</p>`;
}
// where each kind of material comes from, shown on its card
const MAT_SRC = { ore: 'Mining', part: 'Monster kills', core: 'Dungeon chests', soul: 'World bosses', rune: 'Elites, bosses, dungeons' };
function invResourcesHTML(p) {
  const tile = (img, name, n, col, src) => `<div class="rtile${n ? '' : ' none'}" style="--rc:${col}" title="${name}${src ? ' · ' + src : ''}"><img src="${img}" alt=""><b class="rn">${fmtK(n)}</b><small>${name}</small></div>`;
  const mat = (id) => { const M = MATS[id]; return tile(matIcon(id), M.name, matCount(id, p), hex6(M.color), MAT_SRC[M.kind]); };
  const svgUrl = (svg) => 'data:image/svg+xml,' + encodeURIComponent(svg.includes('xmlns') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'));
  const money = `<div class="igrid rgrid">${tile(svgUrl(ICON.coin), 'Gold', p.gold, '#ffd23a')}${tile(svgUrl(ICON.ess), 'Gems', p.essence || 0, '#7fe3ff')}${mat(CFG.craft.titan.id)}${mat(CFG.craft.rune.id)}</div>`;
  const groups = CB.map((b, i) => biomeReached(i, p) ? `<h4 class="sub">${BIOMES[i].name}</h4><div class="igrid rgrid">${[b.ore, b.part, b.core].map(mat).join('')}</div>` : '').join('');
  return `<div class="subRow"><h4 class="sub">Resources</h4></div><h4 class="sub first">Gold, gems, Titan Souls &amp; Rune Shards</h4>${money}${groups}
    <p class="fine">Ore comes from Mining, parts from monsters, cores from dungeon chests, Titan Souls from world bosses, Rune Shards (for Enchanting) from elites, bosses, dungeon chests and now and then any monster. Spend them in the Forge. Biomes you have not reached stay hidden.</p>`;
}
// --- crafting tabs (src/game/39-crafting.js)
const hex6 = (c) => '#' + c.toString(16).padStart(6, '0');
function matChip(id, need, p) { const M = MATS[id], have = matCount(id, p), ok = need == null || have >= need;
  return `<span class="mat k-${M.kind}${ok ? '' : ' missing'}"><img class="mi" src="${matIcon(id)}" alt="">${M.name} <b>${need == null ? fmtK(have) : `${fmtK(have)}/${fmtK(need)}`}</b></span>`; }
function costChips(cost, p) { return cost.mats.map(([id, n]) => matChip(id, n, p)).join('') + `<span class="mat gold${p.gold >= cost.gold ? '' : ' missing'}">${ICON.coin}<b>${fmtK(cost.gold)}</b></span>`; }
function craftTabHTML(p) {
  const C = CFG.craft, bi = clamp(UI.craftBiome == null ? Math.max(0, CB.findIndex((b, i) => !biomeReached(i + 1, p))) : UI.craftBiome, 0, 5), b = CB[bi], open = biomeReached(bi, p);
  const minL = Math.min(...CFG.world.zones.filter((z) => z.biome === bi).map((z) => z.minLevel || 1));
  const picks = CB.map((x, i) => `<button class="bpick ${i === bi ? 'on' : ''}${biomeReached(i, p) ? '' : ' locked'}" data-act="craftBiome" data-b="${i}" style="--mc:${hex6(x.color)}"><i></i>${BIOMES[i].name.split(' ').pop()}</button>`).join('');
  const SB = C.setBonus, k = 1 + SB.perBiome * bi, worn = setBonuses(p.gear).sets[bi] || 0;
  const rows = CFG.gear.slots.map((s) => {
    const cost = setPieceCost(bi, s), can = open && canPay(cost, p), noun = ITEM_NAMES[s][s === 'weapon' ? 0 : 1];
    return `<div class="item ${C.setRarity[bi]} craftRow"><span class="setWrap" style="--sc:${hex6(b.color)}"><i class="rays"></i><i class="rays r2"></i><img class="setArt" src="${setArtUrl(bi, s)}" alt=""></span><div class="meta"><div class="slot">${SLOT_LABEL[s]} · item level ${Math.max(biomeTop(bi), p.level) + 2}</div><div class="nm">${b.set} ${noun} ${rarityChip(C.setRarity[bi])}</div><div class="st">Random affixes + one perfect bonus affix</div><div class="mats">${costChips(cost, p)}</div></div>
      <button class="${can ? 'primary' : 'disabled'}" data-act="craftPiece" data-b="${bi}" data-slot="${s}" ${can ? '' : 'aria-disabled="true"'}>Craft</button></div>`;
  }).join('');
  const hero = CFG.brawlers[b.hero], heroHave = p.unlocked.attacks.includes(b.hero), relicN = craftState(p).relics[bi] | 0;
  return `
    <div class="bpicks">${picks}</div>
    <div class="card craftSet" style="--mc:${hex6(b.color)}"><h4>${b.set} set · ${BIOMES[bi].name}</h4>
      <p>${open ? `Wear 3 pieces: +${pct(SB[3].dmg * k)} damage, +${pct(SB[3].hp * k)} HP · all 5: another +${pct(SB[5].dmg * k)} damage, +${pct(SB[5].hp * k)} HP <em>(wearing ${worn}/5)</em>` : `Opens at level ${minL}, when you can reach ${BIOMES[bi].name}.`}</p>
      <div class="mats">${matChip(b.ore, null, p)}${matChip(b.part, null, p)}${matChip(b.core, null, p)}${matChip(C.titan.id, null, p)}</div>
    </div>
    <div class="list">${rows}</div>
    <div class="card secret"><h4>Hidden in ${BIOMES[bi].name} dungeons</h4>
      <p>${hero ? (heroHave ? `<b>${hero.name}</b> fights for you.` : `<b>${hero.name}</b> cannot be recruited any other way. Their oaths drop from this biome’s dungeon chests (Sanctums and Trials more often, higher keys more): <b>${sigilHave(b.hero, p)}/${C.sigil.need}</b>.`) : ''}</p>
      <p>Relic: <b>${b.relic.name}</b> ${rarityChip(b.relic.rarity)} · a rare chest find here (twice as likely in the Sanctum, certain after ${C.relic.pity} chests without one) · found ${relicN}×</p></div>`;
}
// Enchant: every worn piece with its affixes; each affix can be rerolled (gold) or boosted toward its cap (gems)
function enchantTabHTML(p) {
  // worn pieces with affixes sit side by side as tiles; the tapped one opens its own enchant page below
  const slots = CFG.gear.slots.filter((s) => { const it = p.gear[s]; return it && it.aff && Object.keys(it.aff).length; });
  if (!slots.length) return '<p class="fine">Uncommon or better gear carries affixes.</p>';
  const s = slots.includes(UI.enchSlot) ? UI.enchSlot : slots[0]; UI.enchSlot = s;
  const tiles = `<div class="etiles">${slots.map((x) => { const it = p.gear[x];
    return `<button class="igt ${it.rarity} ${x === s ? 'sel' : ''}" data-act="enchPick" data-slot="${x}" style="--rc:${rarCol(it.rarity)}" aria-pressed="${x === s}" aria-label="${SLOT_LABEL[x]}: ${escapeHTML(it.name)}"><img src="${thumbFor(it)}" alt="">${it.up ? `<span class="iu">+${it.up}</span>` : ''}<small class="eslot">${SLOT_LABEL[x]}</small></button>`; }).join('')}</div>`;
  const it = p.gear[s], keys = Object.keys(it.aff), rc = enchantCost(it), eg = empowerGems(it), rn = enchantRunes(it), haveR = matCount(runeId(), p), okR = haveR >= rn, ri = `<img class="mi" src="${matIcon(runeId())}" alt="">`;
  const rows = keys.map((k) => { const v = it.aff[k], cap = affCap(k, it), full = v >= cap, f = Math.min(1, v / cap);
    const tier = full ? 'max' : f >= 0.75 ? 't3' : f >= 0.5 ? 't2' : 't1'; // the bar glows brighter the closer the affix is to its cap
    return `<div class="arow ${tier}"><span class="an">+${Math.round(v * 100)}% ${CFG.affixes[k].name}</span><span class="ap">${full ? 'MAX' : Math.round(f * 100) + '%'}</span>
      <i class="abar"><b style="width:${Math.round(100 * f)}%"></b></i>
      <button class="${p.gold >= rc && okR ? 'ghost' : 'disabled'}" data-act="enchReroll" data-slot="${s}" data-k="${k}"><span>Reroll</span><small>${ICON.coin}${fmtK(rc)} ${ri}${rn}</small></button>
      <button class="${full ? 'disabled' : p.essence >= eg && okR ? 'ghost boost' : 'disabled'}" data-act="enchUp" data-slot="${s}" data-k="${k}" ${full ? 'disabled' : ''}><span>${full ? 'Maxed' : 'Boost'}</span>${full ? '' : `<small>${ICON.ess}${eg} ${ri}${rn}</small>`}</button></div>`; }).join('');
  return `${tiles}<div class="enchNeed${okR ? '' : ' short'}">${ri}<span>Rune Shards <b>${fmtK(haveR)}</b> · each Reroll or Boost on this piece costs <b>${rn}</b></span></div><div class="elist"><div class="ecard ${it.rarity}" style="--rc:${rarCol(it.rarity)}"><div class="ehead"><img class="thumb ${it.rarity}" src="${thumbFor(it)}" alt=""><b>${escapeHTML(it.name)}</b>${rarityChip(it.rarity)}</div>${rows}</div></div>`;
}
function masterworkTabHTML(p) {
  const C = CFG.craft;
  return '<div class="ugrid">' + Object.keys(C.upgrades).map((id) => {
    const U = C.upgrades[id], r = upgRank(id, p), max = r >= U.max, cost = max ? null : upgCost(id, r), can = !max && canPay(cost, p);
    return upCard(mwArt(id), U.name, `<span>${r ? U.d(U.per * r) : '—'}</span>`, max ? '' : `<span>${U.d(U.per * (r + 1))}</span>`,
      `<div class="urank"><i style="width:${Math.round(100 * r / U.max)}%"></i><small>${r}/${U.max}</small></div>${max ? '' : `<div class="mats">${costChips(cost, p)}</div>`}`,
      `<button class="${can ? 'primary' : 'disabled'}" data-act="buyUpg" data-id="${id}" ${can ? '' : 'aria-disabled="true"'}>${max ? 'Max' : 'Upgrade'}</button>`, max ? 'legendary' : can ? 'alert' : '');
  }).join('') + '</div>';
}
function openArenaPanel() {
  UI.current = 'arena';
  const p = G.profile, d = arenaDifficulty(p.trophies);
  const tier = d < 0.35 ? 'Rookie' : d < 0.6 ? 'Skilled' : d < 0.85 ? 'Veteran' : 'Elite';
  openModal(`<div class="npcHead"><span class="dotc" style="background:#c0392b"></span><h3>Arena Master Rho</h3></div>
    <div class="arenaCard"><div class="mode">Solo Showdown</div><p>10 brawlers. Last one standing wins. Poison gas closes in after ${CFG.arena.gasDelay}s. Break open fallen fighters’ power cubes to grow stronger.</p>
    <div class="stats3"><div><b>${ICON.trophy}${fmt(p.trophies)}</b><span>Your trophies</span></div><div><b>${tier}</b><span>Opponent skill</span></div><div><b>+${CFG.arena.trophies[0]} / ${CFG.arena.trophies[9]}</b><span>Best / worst</span></div></div>
    <p class="fine">Trophies set your opponents’ skill. Your level and gear help a little, but aim, timing and dodging decide the match.</p></div>
    <div class="row end"><button class="ghost" data-act="close">Later</button><button class="primary big" data-act="queue">Play Showdown</button></div>`);
}
function queueArena() {
  openModal(`<div class="queue"><div class="spin"></div><h3>Preparing Showdown…</h3><p>You versus 9 computer opponents</p></div>`, false);
  Sfx.play('click');
  setTimeout(() => { UI.close(); Coach.note('arenaStart'); startArena(); }, 1600);
}
function openResults() {
  const r = G.arena.result, p = G.profile;
  UI.current = 'results';
  const place = r.place, title = place === 1 ? 'Victory!' : place <= 3 ? 'Great run!' : 'Knocked out';
  openModal(`<div class="results ${place === 1 ? 'win' : ''}"><div class="place">#${place}</div><h2>${title}</h2>
    <div class="stats3"><div><b class="${r.delta >= 0 ? 'up' : 'down'}">${r.delta >= 0 ? '+' : ''}${r.delta}</b><span>Trophies</span></div><div><b>${ICON.trophy}${fmt(r.trophies)}</b><span>Total</span></div><div><b>${ICON.coin}+${r.gold}</b><span>Gold</span></div></div>
    <p class="fine">Arena matches give trophies and gold, never XP. Level up through jobs, feats and world bosses.</p></div>
    <div class="row end"><button class="ghost" data-act="hub">Back to hub</button><button class="primary" data-act="again">Play again</button></div>`, false);
}
function openClassChoice() {
  UI.current = 'class';
  const card = (k) => {
    const c = CFG.classes[k], sk = CFG.skills[c.skill], su = CFG.supers[c.super];
    return `<button class="classCard" data-act="class" data-cls="${k}"><span class="crest" style="background:#${c.body.toString(16).padStart(6, '0')}"></span><b>${c.name}</b><em>${c.role}</em>
      <span class="ln">HP ×${c.hpMult} · DMG ×${c.atkMult}${c.speedMult !== 1 ? ` · Speed ×${c.speedMult}` : ''}</span><span class="ln">Super: ${su.name}</span><span class="ln">Skill: ${sk.name} · ${sk.desc}</span></button>`;
  };
  openModal(`<div class="center"><div class="eyebrow">Level ${CFG.progression.classAt} awakening</div><h2>Choose your path</h2><p class="fine">This choice is permanent for this hero. Each class has its own skill tree.</p></div>
    <div class="classes scroll">${card('warrior')}${card('ranger')}${card('mage')}</div>`, false);
}
function openLoot(loot) {
  UI.current = 'loot';
  const pct = (x) => Math.round(x * 100) + '%';
  let body;
  if (!loot.eligible) body = `<p class="say">You didn’t deal enough damage to share the loot (at least ${pct(CFG.boss.loot.minContrib)} of the total). Join the next fight!</p>`;
  else body = `<div class="stats3"><div><b>${pct(loot.contrib)}</b><span>Your damage share</span></div><div><b>${pct(loot.rareChance)}</b><span>Rare drop chance</span></div><div><b>${ICON.coin}+${fmt(loot.gold)}</b><span>Gold</span></div></div>
    <div class="list">${loot.item ? `<div class="item">${caseArt(loot.caseKind || 'boss')}<div class="meta"><div class="slot">Treasure chest</div><div class="nm">${CFG.cases[loot.caseKind || 'boss'].name}</div><div class="st">Rare or better inside. Open it in your Journal › Treasure Chests</div></div><button class="primary" data-act="cases">Open</button></div>` : '<p class="fine">No chest this time.</p>'}
    ${loot.weekly ? '<p class="say">Weekly Colossus bonus: a <b>Legendary-or-better Colossus Chest</b> is in your Journal.</p>' : ''}
    ${loot.tomeXp ? `<div class="item"><div class="meta"><div class="slot">Tome</div><div class="nm">Golem Tome</div><div class="st">+${fmt(loot.tomeXp * progressionXpMultiplier(G.profile))} XP</div></div></div>` : ''}
    ${loot.essence ? `<div class="item"><div class="meta"><div class="slot">Gems</div><div class="nm">+${loot.essence} gems · +${loot.shards || 0} artifact shards</div><div class="st">For gear upgrades and artifact stars</div></div></div>` : ''}</div>
    <p class="fine">Drop odds come only from your share of the damage. Nothing in this game is bought with money.</p>`;
  openModal(`<div class="center"><div class="eyebrow">World boss defeated</div><h2>${loot.name || CFG.boss.name}</h2></div>${body}<div class="row end"><button class="primary" data-act="close">Nice</button></div>`);
}
function heroTab(tab) {
  if (tab === 'Attacks' || tab === 'Mastery') return openBrawlers();
  if (tab === 'Skills' || tab === 'Build') return openSkills(G.profile.cls);
  if (tab === 'Road' || tab === 'Feats') return openProgress(tab === 'Feats' ? 'Feats' : 'Road');
  UI.current = 'hero'; UI.heroTab = tab;
  const p = G.profile, pl = G.player, c = CFG.classes[p.cls] || CFG.classes.bolt;
  const gearAlert = Object.values(slotAlerts()).some((a) => a.better || a.canUpgrade);
  const dots = { Gear: gearAlert };
  const tabs = ['Stats', 'Gear'].map((t) => `<button class="tab ${tab === t ? 'on' : ''}" data-act="tab" data-tab="${t}">${tabName(t)}${dots[t] ? '<i class="rdot tabdot"></i>' : ''}</button>`).join('');
  let body = '', bar = '';
  const pct = (x) => `${Math.round(x * 100)}%`;
  if (tab === 'Stats') {
    // one clear card: the hero's art, what they wear right now and the eight stats that matter
    // a big painted splash of the hero (high quality, not the 3D model) with the worn gear floating around it
    const def = ASSET_MANIFEST['hero.' + p.cls] || {}, art = def.splash || brawlerThumb(p.cls), g = gearTotals(p.gear);
    const sock = (s, side, i) => { const it = p.gear[s];
      return `<button class="hsock ${side} ${it ? it.rarity : 'empty'}${UI.heroSlot === s ? ' sel' : ''}" style="--i:${i};--rc:${it ? rarCol(it.rarity) : '#4a4f6e'}" data-act="hsSlot" data-slot="${s}" aria-label="${SLOT_LABEL[s]}">${it ? `<img src="${thumbFor(it)}" alt="">` : '<span class="emptySlot">+</span>'}${it && it.up ? `<em>+${it.up}</em>` : ''}</button>`; };
    const box = (k, v) => `<div><span>${k}</span><b>${v}</b></div>`;
    // tapping a floating piece opens a swap panel right here: worn vs picked, the bag for that slot, Wield; Back closes it
    const hs = UI.heroSlot, worn = hs && p.gear[hs], pick = hs ? p.bag.find((b) => b.id === UI.heroPick && b.slot === hs) || null : null;
    const card = (it, label) => it ? `<div class="cmpc ${it.rarity}"><small>${label}</small><button class="inspect" data-act="inspect" data-id="${escapeHTML(it.id)}"><img class="thumb ${it.rarity}" src="${thumbFor(it)}" alt=""></button><b>${escapeHTML(it.name)}${it.up ? ` +${it.up}` : ''}</b>${rarityChip(it.rarity)}<span class="st">${statLine(it)}</span>${it.aff && Object.keys(it.aff).length ? `<span class="st aff">${affixText(it).split(' · ').join('<br>')}</span>` : ''}</div>`
      : `<button class="cmpc none pickAll" data-act="hsAll"><small>${label}</small><span class="emptySlot">+</span><span class="st">All ${SLOT_LABEL[hs]}</span></button>`;
    const own = hs ? p.bag.filter((b) => b.slot === hs).sort((x, y) => (isBetter(y, x) ? 1 : isBetter(x, y) ? -1 : 0)) : [];
    // the "all options" sheet: the whole bag as rows, this slot first; each row shows what changes vs the piece worn in its slot
    const row = (it) => `<button class="hsRow ${it.rarity}${UI.heroPick === it.id ? ' sel' : ''}" data-act="hsPick" data-id="${escapeHTML(it.id)}" data-slot="${it.slot}" style="--rc:${rarCol(it.rarity)}">
        <img class="thumb ${it.rarity}" src="${thumbFor(it)}" alt=""><span><b>${escapeHTML(it.name)}${it.up ? ` +${it.up}` : ''}</b><small>${SLOT_LABEL[it.slot]} · ${statLine(it)}</small>${diffChips(it)}</span>${isBetter(it, p.gear[it.slot]) ? '<em class="up">▲</em>' : ''}</button>`;
    const rest = hs ? p.bag.filter((b) => b.slot !== hs && CFG.gear.slots.includes(b.slot)) : [];
    const sheet = `<div class="hsSheet">${own.map(row).join('') || `<p class="fine">No other ${SLOT_LABEL[hs]} in your bag yet.</p>`}
      ${rest.length ? `<small class="hsSub">Rest of your bag</small>${rest.map(row).join('')}` : ''}</div>`;
    const swap = !hs ? '' : `<div class="hswap${UI.hsOpenAnim ? ' opening' : ''}"><div class="hswapHead"><b>${SLOT_LABEL[hs]}</b><span class="row">${UI.hsAll ? '' : `<button class="ghost sm" data-act="hsAll">All ${own.length}</button>`}<button class="ghost sm" data-act="${UI.hsAll ? 'hsAllBack' : 'hsBack'}">Back</button></span></div>
      ${UI.hsAll ? sheet : `<div class="cmp${UI.hsPickAnim ? ' picked' : ''}">${card(worn, 'Worn')}<b class="cmpv">VS</b>${card(pick, 'Pick one')}</div>
      ${own.length ? itemGrid(own, { act: 'hsPick', sel: UI.heroPick, mark: (it) => (isBetter(it, worn) ? { cls: 'up', text: '▲', label: 'better than worn' } : null) }) : ''}
      ${pick ? `<div class="row"><button class="primary" data-act="hsWear" data-id="${escapeHTML(pick.id)}">${wearWord(hs)}</button></div>` : ''}`}</div>`;
    body = `<div class="heroStage" style="--art:url(${art})">${sock('helmet', 'l', 0)}${sock('chest', 'l', 1)}${sock('boots', 'l', 2)}${sock('weapon', 'r', 0)}${sock('accessory', 'r', 1)}</div>
      ${swap}${statStrip(pick)}<div class="bstats hsmall">${box('Level', fmt(p.level))}${box('Gear score', fmt(Math.round(g.score)))}${box('Move', pl.speed.toFixed(1))}${box('Trophies', fmt(p.trophies))}</div>`;
  } else if (tab === 'Gear') {
    p._bagSeen = true;
    const al = slotAlerts();
    const order = ['helmet', 'weapon', 'chest', 'accessory', 'boots'];
    const firstAlert = order.find((x) => al[x].better || al[x].canUpgrade);
    const sel = UI.gearSlot || firstAlert || 'weapon'; UI.gearSlot = sel;
    if (UI.gearPickSlot !== sel) { UI.gearPick = null; UI.gearPickSlot = sel; }
    const tiles = order.map((x) => { const it = p.gear[x], a = al[x];
      return `<button class="tile ${it ? it.rarity : 'empty'} ${x === sel ? 'sel' : ''}" data-act="slot" data-slot="${x}" aria-label="${SLOT_LABEL[x]} · ${it ? 'equipped' : 'empty'}" aria-pressed="${x === sel}">${it ? `<img src="${thumbFor(it)}" alt="">` : '<span class="emptySlot">+</span>'}<span class="ts">${SLOT_LABEL[x]}</span>${it && it.up ? `<span class="tu">+${it.up}</span>` : ''}${a.better || a.canUpgrade ? '<i class="rdot"></i>' : ''}</button>`; }).join('');
    const cur = p.gear[sel], a = al[sel], max = cur && cur.up >= CFG.gear.maxUp;
    const can = !!cur && a.canUpgrade && p.essence >= upgradeEssence(cur);
    const one = cur ? maxUpgradePlan(cur, 1) : {n:0,materials:[]}, mp = cur ? maxUpgradePlan(cur) : {n:0,materials:[]}, next = new Set(one.materials), all = new Set(mp.materials);
    const equippedIds = new Set(Object.values(p.gear).filter(Boolean).map(it => it.id));
    // "All gear" lists the whole bag by slot, so a build can be planned without hopping between slots
    const all0 = !!UI.gearAll, bagOf = (b) => !equippedIds.has(b.id) && (all0 || b.slot === sel);
    const pieces = p.bag.filter(bagOf).sort((x, y) => (all0 && x.slot !== y.slot ? order.indexOf(x.slot) - order.indexOf(y.slot) : isBetter(y, x) ? 1 : isBetter(x, y) ? -1 : 0));
    const pick = pieces.find((b) => b.id === UI.gearPick) || null; if (!pick) UI.gearPick = null;
    const mark = (it) => isBetter(it, p.gear[it.slot]) ? { cls: 'up', text: '▲', label: 'better than equipped' } : next.has(it.id) ? { cls: 'mat1', text: '+1', label: 'used by the next merge' } : all.has(it.id) ? { cls: 'mat', text: 'max', label: 'used by Merge max' } : null;
    const L = p.luck, Pi = CFG.loot.pity;
    const filt = `<div class="bagFilter" role="group" aria-label="Show"><button class="${all0 ? '' : 'on'}" data-act="gearAll" data-v="0" aria-pressed="${!all0}">${SLOT_LABEL[sel] === 'Accessory' ? 'Accessories' : SLOT_LABEL[sel] + 's'}</button><button class="${all0 ? 'on' : ''}" data-act="gearAll" data-v="1" aria-pressed="${all0}">All gear</button></div>`;
    // compare: what you wear next to the bag piece you tapped, then the eight key stats with ▲/▼
    const wornOf = pick ? p.gear[pick.slot] : cur;
    const cmpCard = (it, label) => it ? `<div class="cmpc ${it.rarity}"><small>${label}</small><button class="inspect" data-act="inspect" data-id="${escapeHTML(it.id)}" aria-label="Inspect"><img class="thumb ${it.rarity}" src="${thumbFor(it)}" alt=""></button><b>${escapeHTML(it.name)}${it.up ? ` +${it.up}` : ''}</b>${rarityChip(it.rarity)}<span class="st">${statLine(it)}</span>${it.aff && Object.keys(it.aff).length ? `<span class="st aff">${affixText(it).split(' · ').join('<br>')}</span>` : ''}</div>`
      : `<div class="cmpc none"><small>${label}</small><span class="emptySlot">${label === 'Worn' ? '+' : '?'}</span></div>`;
    // Inventory is only what you have collected: chests, resources, all gear. Comparing and wearing happens on the Hero screen.
    const bagAll = p.bag.filter((x) => !equippedIds.has(x.id)).sort((x, y) => order.indexOf(x.slot) - order.indexOf(y.slot) || rarIdx(y.rarity) - rarIdx(x.rarity));
    // one page: chests, gear and resources stacked; the buttons under the hero name jump to each part
    body = `<section id="invSecChests">${invChestsHTML(p)}</section>
      <section id="invSecGear"><div class="subRow"><h4 class="sub">Gear · ${bagAll.length}</h4><small>${p.bag.length}/${CFG.gear.bagMax}</small></div>
      ${itemGrid(bagAll, { act: 'inspect', empty: 'Monsters, elites, dens, shrines and world bosses drop gear.' })}${bagAll.length ? '<p class="fine">Tap a piece to inspect it. You can sell it there for gold.</p>' : ''}</section>
      <section id="invSecRes">${invResourcesHTML(p)}</section>`;
    bar = '';
  } else if (tab === 'Attacks') {
    const cur = resolvedAttack(p), av = availableAttacks(p), fresh = new Set(p.newUnlocks);
    const sig = CFG.signatures[p.cls || 'novice'].id, nSlots = artifactSlotsFor(p);
    const ids = ['bolt'].concat(sig !== 'bolt' ? [sig] : [], Object.keys(CFG.attacks).filter((k) => !CFG.attacks[k].signature));
    const bar = (label, v) => `<span class="sb"><em>${label}</em><i style="--v:${Math.round(clamp(v, 0.06, 1) * 100)}%"></i></span>`;
    const cards = ids.map((id) => {
      const a = CFG.attacks[id], locked = !av.includes(id), on = id === cur, ml = masteryLevel(p.mastery['w:' + id] || 0);
      const dmg = a.mult * a.count * (a.burst || 1) + (a.split ? a.split.n * a.split.mult * 0.6 : 0) + (a.aoe ? a.aoeMult * 0.5 : 0) + (a.chain ? a.chain * 0.4 : 0);
      return `<button class="atk ${on ? 'on' : ''} ${locked ? 'locked' : ''}" ${locked ? 'aria-disabled="true"' : `data-act="equipAtk" data-id="${id}"`}>
        ${fresh.has('a:' + id) ? '<i class="rdot"></i>' : ''}${attackGlyph(a)}
        <span class="an"><b>${a.name}</b><small>${a.role}${!locked ? ` · Mastery ${ml}` : ''}</small></span>
        <span class="ad">${locked ? 'Locked · ' + unlockText(a.unlock) : a.desc}</span>
        <span class="bars3">${bar('Damage', dmg / 2.6)}${bar('Range', a.range / 22)}${bar('Fire rate', (a.ammo / a.reload) / 3.3)}</span>
        ${on ? '<span class="eqd">Equipped</span>' : ''}</button>`;
    }).join('');
    const slots = Array.from({ length: nSlots }, (_, i) => { const id = p.artifacts[i];
      return id ? `<button class="aslot full" data-act="toggleArt" data-id="${id}"><b>${CFG.artifacts[id].name}</b><small>Tap to remove</small></button>` : `<div class="aslot"><small>Empty artifact slot</small></div>`; }).join('') + (nSlots < 3 ? '<div class="aslot lockd"><small>3rd slot at level 30</small></div>' : '');
    const arts = Object.keys(CFG.artifacts).map((id) => {
      const a = CFG.artifacts[id], have = p.unlocked.artifacts.includes(id), on = p.artifacts.includes(id);
      return `<button class="art ${on ? 'on' : ''} ${have ? '' : 'locked'}" ${have ? `data-act="toggleArt" data-id="${id}"` : 'aria-disabled="true"'}>${fresh.has('r:' + id) ? '<i class="rdot"></i>' : ''}<b>${a.name}</b><small>${have ? a.desc : 'Locked · ' + unlockText(a.unlock)}</small>${on ? '<span class="eqd">On</span>' : ''}</button>`;
    }).join('');
    body = `<h4 class="sub first">Main attack</h4><p class="fine">Pick how you shoot. Each attack levels its own mastery (1–99) as you use it: +0.4% damage per level.</p><div class="atkgrid">${cards}</div>
      <h4 class="sub">Artifacts · ${p.artifacts.length}/${nSlots}</h4><p class="fine">Artifacts add effects to your main attack. Mix them: Splitter Core on a Railshot, Seeker Chip on a Scattergun, Arc Coil on a Gatling.</p>
      <div class="aslots">${slots}</div><div class="arts">${arts}</div>`;
    setTimeout(() => { p.newUnlocks = []; G.dirty = true; }, 0);
  } else if (tab === 'Build') {
    let tree = '';
    if (!p.cls) tree = `<p class="fine">Your class skill tree unlocks at level ${P.classAt}.</p>`;
    else {
      const free = skillPointsFree(p), sk = CFG.skills[c.skill], su = CFG.supers[c.super];
      tree = `<div class="kit"><div><span>Super</span><b>${su.name}</b><small>Tap to auto-aim, drag to aim</small></div><div><span>Skill</span><b>${sk.name}</b><small>${sk.desc}</small></div></div>
        <p class="pts">${free} skill point${free === 1 ? '' : 's'} available</p>
        <div class="tree">${CFG.trees[p.cls].map((n) => { const r = p.tree[n.id] || 0; const can = free > 0 && r < n.max;
          return `<div class="node ${r ? 'has' : ''}"><div><b>${n.name}</b><small>${n.desc}</small><div class="pips">${'<i class="on"></i>'.repeat(r)}${'<i></i>'.repeat(n.max - r)}</div></div><button class="${can ? 'primary' : 'disabled'}" data-act="spend" data-node="${n.id}" ${can ? '' : 'aria-disabled="true"'}>+</button></div>`; }).join('')}</div>`;
    }
    const keys = CFG.keystones.map((row, i) => {
      const L = P.keystoneLevels[i], open = p.level >= L;
      return `<div class="krow ${open ? '' : 'locked'}"><div class="kl"><b>Lv ${L}</b>${open && !p.keys[i] ? '<i class="rdot in"></i>' : ''}</div><div class="kc">${row.map((k) => {
        const on = p.keys[i] === k.id;
        return `<button class="key ${on ? 'on' : ''}" ${open ? `data-act="key" data-tier="${i}" data-id="${k.id}"` : 'aria-disabled="true"'}><b>${k.name}</b><small>${k.desc}</small></button>`; }).join('')}</div></div>`;
    }).join('');
    body = `<h4 class="sub first">Keystones</h4><p class="fine">Every 10 levels, pick one of three. They shape your build like runes: speed, burst, sustain or tank. Free to change in town.</p><div class="keys">${keys}</div>
      <h4 class="sub">Class</h4>${tree}`;
  } else if (tab === 'Mastery') {
    const row = (key, desc) => {
      const xp = p.mastery[key] || 0, L = masteryLevel(xp), a = mxpFor(L), b = mxpFor(Math.min(99, L + 1)), f = L >= 99 ? 1 : (xp - a) / Math.max(1, b - a);
      return `<div class="mrow ${L >= 99 ? 'max' : ''}"><span class="ml">${L}</span><div class="mm"><b>${masteryName(key)}</b><small>${desc}</small><span class="mbar"><i style="--v:${(f * 100).toFixed(1)}%"></i></span><em>${L >= 99 ? fmtK(xp) + ' xp · Skillcape' : `${fmtK(xp)} / ${fmtK(b)} xp`}</em></div></div>`;
    };
    const av = availableAttacks(p);
    const wpn = CFG.brawlerOrder.filter((id) => av.includes(id) || p.mastery['w:' + id]).sort((x, y) => (p.mastery['w:' + y] || 0) - (p.mastery['w:' + x] || 0)).map((id) => row('w:' + id, `+${((masteryLevel(p.mastery['w:' + id] || 0) - 1) * 0.4).toFixed(1)}% damage with ${CFG.attacks[id].name}`)).join('');
    const slay = Object.keys(CFG.enemies).filter((k) => CFG.enemies[k].hp && (!CFG.enemies[k].legacy || (p.mastery['s:' + k] || 0) > 0)).map((k) => { const L = masteryLevel(p.mastery['s:' + k] || 0); return row('s:' + k, `+${((L - 1) * 0.3).toFixed(1)}% damage and +${((L - 1) * 0.5).toFixed(0)}% drop chance vs ${CFG.enemies[k].name}s`); }).join('');
    const skills = Object.keys(CFG.mastery.skills).map((k) => row(k, CFG.mastery.skills[k].desc)).join('');
    body = `<div class="mtotal"><b>${fmt(totalMastery(p))}</b><span>Total mastery level</span></div><p class="fine">Masteries level from 1 to 99 on the classic curve: level 92 is halfway to 99. Reach 99 in anything to earn a skillcape.</p>
      <h4 class="sub">Weapons</h4><div class="mlist">${wpn}</div><h4 class="sub">Slayer</h4><div class="mlist">${slay}</div><h4 class="sub">Skills</h4><div class="mlist">${skills}</div>`;
  } else {
    // Level Road: every reward from 1 to the cap, so there is always a next goal
    const rows = [];
    for (let L = 2; L <= Math.max(100, p.level + 30); L++) {
      const r = [];
      const ms = milestoneAt(L);
      r.push(ms ? `<span class="rw chest ${ms}">${CFG.gear.rarity[ms].name} chest + ${Math.ceil(L / 5) * 3} gems</span>` : '<span class="rw">Gear drop</span>');
      CFG.world.zones.forEach((zn) => { if (zn.minLevel === L && !zn.safe) r.push(`<span class="rw zone">${zn.name} opens</span>`); });
      const ki = P.keystoneLevels.indexOf(L); if (ki >= 0) r.push('<span class="rw key">Keystone choice</span>');
      if (P.artifactSlotAt[L]) r.push('<span class="rw art">3rd artifact slot</span>');
      if (L === P.classAt) r.push('<span class="rw key">Choose your class</span>');
      for (const id of CFG.brawlerOrder) { const a = CFG.attacks[id]; if (a.unlock && a.unlock.level === L) r.push(`<span class="rw atk">${CFG.brawlers[id].name}</span>`); }
      for (const id in CFG.artifacts) { const a = CFG.artifacts[id]; if (a.unlock && a.unlock.level === L) r.push(`<span class="rw art">${a.name}</span>`); }
      rows.push(`<div class="road ${L <= p.level ? 'done' : L === p.level + 1 ? 'next' : ''} ${ms ? 'ms' : ''}" ${L === p.level + 1 ? 'id="roadNext"' : ''}><span class="rl">${L}</span><div class="rr">${r.join('')}</div></div>`);
    }
    body = `<h4 class="sub first">Level Road · ${p.level}/${P.cap}</h4><p class="fine">Every level drops an item. Every 5th level is a milestone chest with a guaranteed rarity.</p><div class="roadlist">${rows.join('')}</div>
      <h4 class="sub">Feats</h4><div class="feats">${ACHIEVEMENTS.map((a) => `<div class="feat ${p.ach[a.id] ? 'got' : ''}"><b>${a.name}</b><small>${a.desc}</small></div>`).join('')}</div>`;
    setTimeout(() => { const n = document.getElementById('roadNext'); if (n) n.scrollIntoView({ block: 'center' }); }, 30);
  }
  openModal(dock(`<div class="heroHead"><span class="lv">${p.level}</span><div><h3>${c.name}</h3><small>${c.role} · ${ICON.coin}${fmtK(p.gold)} · ${ICON.ess}${fmtK(p.essence)} gems</small>${prestigeBadge(p)}</div></div>${tab === 'Gear' ? invTabsHTML(invTabNow(), p) : ''}`, `<div class="tabBody">${body}</div>`, bar), true, false);
}
// World map (the Map button): the whole road north, one row per area, top = furthest. Tap an attuned lodestone
// to travel there from anywhere in the open world; areas you have not reached yet stay hidden.
function openWorldMap() {
  UI.current = 'worldmap';
  const p = G.profile, here = zoneAt(G.player.z), far = Math.max(p.stats.zone || 0, here), hub = G.mode === 'hub' && !G.rift;
  const wpOf = {}; CFG.world.waypoints.forEach((w, i) => { wpOf[w.zone] = i; });
  const Z = CFG.world.zones, html = [];
  for (let zi = Z.length - 1; zi >= 0; zi--) { // north (furthest) at the top; each biome's name sits above its areas
    const zn = Z[zi], seen = zi <= far, i = wpOf[zi], have = i != null && p.waypoints.includes(i), lvlOk = p.level >= (zn.minLevel || 1), col = hex6(BIOMES[zn.biome].coreColor);
    if (zi === Z.length - 1 || Z[zi + 1].biome !== zn.biome) html.push(`<div class="mbiome" style="--bc:${col}">${zn.biomeName}</div>`);
    const right = zi === here ? '<span class="mtag here">You</span>' : !seen ? '' : have && lvlOk && hub ? `<button class="primary" data-act="travel" data-i="${i}">Go</button>`
      : `<span class="mtag">${!lvlOk ? 'Lv ' + zn.minLevel : i == null ? '' : 'Find stone'}</span>`;
    html.push(`<div class="marea ${seen ? '' : 'fog'} ${zi === here ? 'here' : ''}" style="--bc:${col};--art:url(assets/ui/areas/${zi}.webp)"><b>${zn.name}</b><small>${zn.safe ? 'Safe' : `Lv ${zn.lvl[0]}–${zn.lvl[1]}`}</small>${right}</div>`);
  }
  openModal(`<div class="npcHead"><h3>World map</h3><span class="cnt">${p.waypoints.length}/${CFG.world.waypoints.length} stones</span></div>${hub ? '' : '<p class="fine">Travel works in the open world.</p>'}<div class="wmap">${html.join('')}</div>`);
  setTimeout(() => { const h = $('panel').querySelector('.marea.here'); if (h) h.scrollIntoView({ block: 'center' }); }, 30);
}
function openWaypoints() {
  UI.current = 'waypoints';
  const p = G.profile, here = G.interact && G.interact.kind === 'waypoint' ? G.interact.i : -1;
  const ta = tierAdd();
  let lastBiome = -1;
  const rows = CFG.world.waypoints.map((w, i) => {
    const zn = CFG.world.zones[w.zone], have = p.waypoints.includes(i), lvl = p.level >= zn.minLevel;
    const col = hex6(BIOMES[zn.biome].coreColor), head = zn.biome !== lastBiome ? `<div class="mbiome" style="--bc:${col}">${zn.biomeName}</div>` : ''; lastBiome = zn.biome;
    const btn = i === here ? '<span class="tagged">You are here</span>' : have && lvl ? `<button class="primary" data-act="travel" data-i="${i}">Teleport</button>` : `<span class="tagged">${!lvl ? 'Level ' + zn.minLevel : 'Not attuned yet'}</span>`;
    return `${head}<div class="marea ${have && lvl ? '' : 'fog'} ${i === here ? 'here' : ''}" style="--bc:${col};--art:url(assets/ui/areas/${w.zone}.webp)"><div class="meta"><b>${w.name}</b><small>${zn.safe ? 'Safe camp' : `${zn.name} · Lv ${zn.lvl[0] + ta}–${zn.lvl[1] + ta}`}</small></div>${btn}</div>`;
  }).join('');
  openModal(`<div class="npcHead"><h3>Lodestone Network</h3></div>${tierPicker()}<div class="wmap">${rows}</div>`);
}
// World Tier picker: shown at every waypoint
function tierPicker() {
  const p = G.profile, cur = curTier(), mx = maxTier(p.level), show = Math.max(3, mx + 2), cells = [];
  for (let t = 0; t < show; t++) {
    const d = tierDef(t), M = tierMul(t), open = t <= mx;
    cells.push(`<button class="tierc ${t === cur ? 'on' : ''} ${open ? '' : 'lock'} t${Math.min(t, 3)}" ${open ? `data-act="tier" data-t="${t}"` : 'aria-disabled="true"'}>
      <b>${d.name}</b><small>${open ? `+${d.add} monster Lv` : `Level ${d.req}`}</small><small>${t ? `${fmtX(M.gold)} gold · ${fmtX(M.gems)} gems` : 'Base rewards'}</small></button>`);
  }
  return `<div class="tierHead">${gi('m_tier')}<div><b>World Tier · ${tierDef(cur).name}</b><small>Every monster on the map gets stronger. Drops, gold and gems get richer. Torment tiers never end.</small></div></div><div class="tierRow">${cells.join('')}</div>`;
}
const fmtX = (m) => '×' + (Math.round(m * 100) / 100);
// The Rift: endless floors. Pick a checkpoint, clear waves before the timer runs out.
function openRiftPanel() {
  UI.current = 'rift';
  const p = G.profile, R = CFG.rift, best = p.records.bestRift || 0, cp = riftCheckpoint(p);
  if (p.level < R.unlock) { openModal(`<div class="npcHead">${gi('m_rift', 'hd')}<h3>The Rift</h3></div><p class="say">The Rift opens for heroes of level ${R.unlock}. Come back stronger.</p>`); return; }
  const fl = (n) => `<div class="riftFl"><b>${n}</b><small>Lv ${riftWaveLevel(n)}</small></div>`;
  openModal(`<div class="npcHead">${gi('m_rift', 'hd')}<h3>The Rift</h3><span class="cnt">Best floor ${best}</span></div>
    <div class="riftCard"><div class="riftFloors">${fl(cp)}<span>→</span>${fl(cp + 4)}<span>→</span><div class="riftFl inf"><b>∞</b><small>no end</small></div></div>
    <p>Deeper floors bring fewer monsters but more <b>Champions</b>: they warn before every big attack (red circles, red lanes, a glowing wind-up), and the hits take a big part of your health. Move out or dash through. Every 5th floor a Rift Lord drops an Epic to Divine item.</p><p>Grades: <b class="grade gS">S</b> no hits taken (×2 gems and shards) · <b class="grade gA">A</b> fast with 2 hits or fewer (×1.5) · B cleared. Monsters never fall far below your level.</p>
    <p class="fine">Checkpoints every 5 floors. If you fall or the time runs out, the run ends and you keep everything you earned.</p></div>
    <div class="row end"><button class="ghost" data-act="riftGo" data-f="1">Start at floor 1</button>${cp > 1 ? `<button class="primary big" data-act="riftGo" data-f="${cp}">Start at floor ${cp}</button>` : '<button class="primary big" data-act="riftGo" data-f="1">Enter the Rift</button>'}</div>`);
}
// Dungeons: a sealed instance per POI. Pick a plain run or one of your Dungeon Keys (it is used up on entry).
function openDungeonPanel(poi) {
  UI.current = 'dungeon';
  const p = G.profile, req = dungeonReq(poi), V = dungeonVariant(poi.id), lvl = dungeonLevel(poi), rec = (p.dungeons || {})[poi.id], nm = escapeHTML(poi.name), id = escapeHTML(poi.id), keys = p.keys || [];
  if (p.level < req) { openModal(`<div class="npcHead">${gi('m_portal', 'hd')}<h3>${nm}</h3></div><p class="say">The seal holds against heroes below level ${req}. Come back stronger.</p>`); return; }
  const keyBtns = keys.map((k, i) => `<button class="ghost" data-act="dungeonGo" data-id="${id}" data-key="${i}" title="${k.a.map((a) => CFG.dungeon.keys.affixes[a].d).join(' · ')}">${escapeHTML(keyName(k))} (Lv ${dungeonLevel(poi, k)})</button>`).join('');
  openModal(`<div class="npcHead">${gi('m_portal', 'hd')}<h3>${nm}</h3><span class="cnt">Lv ${lvl}</span></div>
    <div class="riftCard"><p>${V.blurb}. Each door opens once its hall is cleared. Monsters here are <b>level ${lvl}</b>, tougher and harder-hitting than outside; the boss calls for help at half health.</p>
    <p>${rec && rec.clears ? 'A plain run pays XP, gold and a <b>Tier 1 Dungeon Key</b>.' : `First clear: guaranteed <b>${poi.zone >= CFG.dungeon.chest.epicFrom ? 'Epic' : 'Rare'} or better</b> gear, gems, shards and a Dungeon Key.`} <b>Keyed runs</b> always fill the chest, and every tier adds a monster level and better loot. Beat the par time (${Math.floor(V.par / 60)}:${String(V.par % 60).padStart(2, '0')}) and the key comes back up to 3 tiers higher.</p>
    <p class="fine">Cleared ${rec ? rec.clears : 0} times · best key tier here ${rec && rec.best || 0} · your best ever ${p.records.bestKey || 0}. Falling or leaving returns your key one tier lower. You enter fully healed.</p></div>
    ${keyBtns ? `<div class="row">${keyBtns}</div>` : ''}
    <div class="row end"><button class="ghost" data-act="close">Not now</button><button class="primary big" data-act="dungeonGo" data-id="${id}">Enter ${nm} (Lv ${lvl})</button></div>`);
}
// Legendary Trial: one arena, a four-affix champion; sigils toward the area's relic and a tiny Radiant chance
function openTrialPanel(zi) {
  UI.current = 'trial';
  const poi = trialPoi(zi), S = trialState(zi), T = CFG.dungeon.trial, lvl = dungeonLevel(poi), nm = escapeHTML(poi.name), odds = radiantOdds(), ch = G.chain;
  openModal(`<div class="npcHead">${gi('m_portal', 'hd')}<h3>${nm}</h3><span class="cnt">Lv ${lvl}</span></div>
    <div class="riftCard"><p>The runestones answered: ${escapeHTML(poi.landmark)} holds a sealed arena and a <b>four-affix champion</b> (level ${lvl}). You can take the trial as often as you like.</p>
    <p>Every clear pays a <b>Trial Sigil</b> (${S.sig}/${T.sigilCost}: forge this area's Mythic relic) and rolls for a <b>Radiant</b> item: <b>1 in ${fmt(odds)}</b> right now.</p>
    <p class="fine">Kill chain: ${ch.n ? `${ch.n} × ${escapeHTML(CFG.enemies[ch.type] ? CFG.enemies[ch.type].name : ch.type)}` : 'none'} · keep killing one kind of monster without falling to raise the Radiant chance (up to ×${T.chainMax} at ${(T.chainMax - 1) * T.chainStep}). Trials taken ${S.n} · Radiants found ${S.rad}.</p></div>
    <div class="row end"><button class="ghost" data-act="close">Not now</button>${S.sig >= T.sigilCost ? `<button class="ghost" data-act="trialForge" data-z="${zi}">Forge relic (${T.sigilCost} sigils)</button>` : ''}<button class="primary big" data-act="trialGo" data-z="${zi}">Begin the Trial (Lv ${lvl})</button></div>`);
}
function craftChestHTML(c) {
  if (!c || !c.mats) return ''; const p = G.profile;
  return `<div class="mats center">${c.mats.map(([id, n]) => `<span class="mat k-${MATS[id].kind}"><i style="--mc:${hex6(MATS[id].color)}"></i>+${n} ${MATS[id].name}</span>`).join('')}</div>`
    + (c.sigil ? `<p class="say">${CFG.brawlers[c.sigil.id].name}’s oath · <b>${Math.min(c.sigil.n, c.sigil.need)}/${c.sigil.need}</b>${c.sigil.n >= c.sigil.need ? ' · they join you!' : ''}</p>` : '')
    + (c.relic ? `<h2 class="center">Relic found</h2><div class="list">${itemRow(c.relic, '', `Relic · ${BIOMES[c.biome].name} dungeons only`)}</div>` : '');
}
function openDungeonChest() {
  const r = claimDungeonChest(); if (!r) return;
  UI.current = 'dungeonChest'; Sfx.play('win');
  const rows = r.items.map((it) => itemRow(it, '', `${CFG.gear.rarity[it.rarity].name} · item level ${it.ilvl}`)).join('');
  openModal(`<div class="center"><div class="eyebrow">${escapeHTML(r.name)} cleared${r.tier ? ` · Tier ${r.tier}` : ''}</div><h2>${r.full ? 'Dungeon chest' : 'Plain run'}</h2></div>
    <div class="stats3"><div><b>${r.xp ? '+' + fmtK(r.xp) : '—'}</b><span>XP</span></div><div><b>${ICON.coin}+${fmtK(r.gold)}</b><span>Gold</span></div><div><b>${ICON.ess}${r.gems}</b><span>Gems</span></div></div>
    ${r.radiant ? `<h2 class="center">RADIANT</h2><div class="list">${itemRow(r.radiant, '', `Radiant · 1 in ${fmt(r.odds)}`)}</div>` : ''}${r.sigils != null ? `<p class="say">Trial Sigil earned · ${r.sigils}/${CFG.dungeon.trial.sigilCost} toward the relic · Radiant chance was 1 in ${fmt(r.odds)}</p>` : ''}
    ${rows ? `<div class="list">${rows}</div>` : r.sigils != null ? '' : '<p class="fine">Use a Dungeon Key for gear, gems and shards.</p>'}${r.key ? `<p class="say">Key earned: <b>${escapeHTML(keyName(r.key))}</b></p>` : ''}${r.case ? '<p class="fine">A treasure chest was found too: open it in your Journal.</p>' : ''}${craftChestHTML(r.craft)}
    <div class="row end"><button class="primary big" data-act="close">Nice</button></div>`);
}
function openRiftResult(r) {
  UI.current = 'riftResult';
  const why = r.why === 'down' ? 'You fell' : r.why === 'time' ? 'Time ran out' : 'You left the Rift';
  openModal(`<div class="center"><div class="eyebrow">${why}</div><h2>Rift run · floor ${r.floor}</h2></div>
    <div class="stats3"><div><b>${r.cleared}</b><span>Floors cleared</span></div><div><b>${ICON.ess}${fmtK(r.gems)}</b><span>Gems</span></div><div><b>${ICON.coin}${fmtK(r.gold)}</b><span>Gold</span></div></div>
    <div class="stats3"><div><b class="grade gS">${r.grades.S}</b><span>S · flawless</span></div><div><b class="grade gA">${r.grades.A}</b><span>A floors</span></div><div><b>${r.grades.B}</b><span>B floors</span></div></div>
    <div class="stats3"><div><b>${r.items}</b><span>Guardian items</span></div><div><b>${r.best}</b><span>Best floor</span></div><div><b>${riftCheckpoint(G.profile)}</b><span>Next checkpoint</span></div></div>
    <div class="row end"><button class="primary big" data-act="close">Continue</button></div>`);
}
function openOffline(o) {
  UI.current = 'offline';
  const h = Math.floor(o.mins / 60), m = Math.round(o.mins % 60);
  openModal(`<div class="center"><div class="eyebrow">While you were away · ${h ? h + 'h ' : ''}${m}m</div><h2>Your hero kept training</h2></div>
    <div class="stats3"><div><b>${fmt(o.kills)}</b><span>Monsters</span></div><div><b>${o.xp ? '+' + fmtK(o.xp) : '—'}</b><span>XP</span></div><div><b>${ICON.coin}+${fmtK(o.gold)}</b><span>Gold</span></div></div>
    <div class="stats3"><div><b>${o.items}</b><span>Gear drops</span></div><div><b>${ICON.ess}${o.essence}</b><span>Gems</span></div><div><b>${CFG.world.zones[o.zone].name}</b><span>Hunting ground</span></div></div>
    <p class="fine">Idle rewards build up for up to ${P.offline.capHours} hours. XP is capped at 1.5 levels, so playing is always faster.</p>
    <div class="row end"><button class="primary big" data-act="offline">Collect</button></div>`, false);
}
// backup code: your whole save as text, for phones where the cloud save cannot be written
function saveCodeOf(p) { const j = JSON.stringify(p); return 'AA8:' + btoa(unescape(encodeURIComponent(j))); }
function parseSaveCode(t) {
  try { t = String(t).trim(); if (!t.startsWith('AA8:')) return null; const raw = JSON.parse(decodeURIComponent(escape(atob(t.slice(4))))); if (!TEST_MODE && isTestProfile(raw)) return null; const p = sanitizeProfile(raw); return p && p.level >= 1 ? p : null; } catch (e) { return null; }
}
function openSaveCode() {
  UI.current = 'saveCode';
  const code = saveCodeOf(G.profile);
  openModal(`<h3>${TEST_MODE ? 'Test hero backup' : 'Backup code'}</h3><p class="fine">This code is your whole hero: level ${G.profile.level}, gear, brawlers and records. ${TEST_MODE ? 'It can only be loaded in ×100 test mode; normal play rejects test saves.' : 'Keep it somewhere safe. Paste it on any device to continue there.'} Anyone with the code can load your hero, so do not share it.</p>
    <textarea id="codeOut" class="code" readonly rows="4">${code}</textarea><div class="row end"><button class="primary" data-act="copyCode">Copy code</button></div>
    <h4 class="sub">Load a code</h4><textarea id="codeIn" class="code" rows="3" placeholder="Paste a code that starts with AA8:"></textarea>
    <div class="row end"><button class="ghost" data-act="openSettings">Back</button><button class="warn" data-act="loadCode">Load and replace this hero</button></div>`);
}
function openSettings() {
  UI.current = 'settings';
  const s = G.profile.settings;
  const tg = (k, label, hint) => `<label class="tgl"><input type="checkbox" id="set-${k}" data-set="${k}" ${s[k] ? 'checked' : ''}><span class="sw"></span><span><b>${label}</b><small>${hint}</small></span></label>`;
  const cloud = Cloud.state === 'on' ? (Cloud.kind === 'supa' ? 'Saved to the cloud and this device. To move to a new phone, copy your Backup code and load it there.' : 'Saved to your Claude account and this device. Your level and items come back on any device where you open this game.')
    : Cloud.state === 'connecting' ? 'Connecting to your cloud save…' : Cloud.state === 'readonly' ? 'Cloud save is read-only here. Progress is kept on this device only.' : 'Cloud save is not available in this view. Progress is kept on this device when storage allows.';
  openModal(`<h3>Options</h3>
    <div class="savebox playtest"><b>${TEST_MODE ? '×100 gameplay test mode' : 'Gameplay testing'}</b><small>${TEST_MODE ? 'Hero, mastery and pet XP are ×100. This test hero saves separately on this device. Cloud save and multiplayer are off. Gold and combat speed stay normal. Return to normal play to recover your normal hero.' : 'Test the gameplay flow with ×100 hero, mastery and pet XP. Your normal hero stays saved separately. A first test run copies your current hero; later runs resume your test hero.'}</small><div class="row"><button class="${TEST_MODE ? 'ghost' : 'primary'}" data-act="testMode">${TEST_MODE ? 'Return to normal play' : 'Enter ×100 test mode'}</button></div></div>
    <div class="savebox ${Cloud.state}"><b>${Cloud.state === 'on' ? 'Cloud save on' : 'Local save'}</b><small>${cloud}</small><div class="row"><button class="ghost sm" data-act="saveNow">Save now</button><button class="ghost sm" data-act="saveCode">Backup code</button></div></div>
    <div class="mpbox"><b>Multiplayer</b><small>${MP.state === 'on' ? `Connected. ${mpCount() ? mpCount() + ' other player' + (mpCount() > 1 ? 's' : '') + ' in the world.' : 'No one else is here right now.'} Other players see your nickname, brawler and level.` : MP.state === 'connecting' ? 'Connecting to the world…' : 'Not available in this view. Online world play needs a supported connected session. Showdown uses computer opponents.'}</small>
      <label class="nick"><span>Nickname</span><input id="nickIn" maxlength="14" value="${escHtml(mpNick(G.profile))}" autocomplete="off" spellcheck="false"><button class="ghost sm" data-act="nickSave">Save</button></label></div>
    ${tg('pvp', 'PvP in the open world', 'Other PvP players can attack you outside town, and you them. You glow red. A PvP death drops 10% of your gold to the killer')}
    ${tg('npcs', 'Town NPCs', 'Show Farmer Ida, Smith Garo, Arena Master Rho and the other townsfolk. Off: the Smith and Showdown are in the Menu, jobs finish by themselves')}
    ${tg('bots', 'Bot players', 'Fill the open world with computer heroes that help against world bosses. Off: only real players, and world bosses have less HP')}
    ${LOCAL_PREVIEW || TEST_MODE ? `${LOCAL_PREVIEW && !TEST_MODE ? tg('fastXp', 'Local fast XP', `×${P.fastXpMult} XP, ×${P.testGoldMult} gold, faster bosses and shrines`) : ''}
    <div class="tools"><span class="tl">Testing tools · ${TEST_MODE ? 'separate test hero' : 'local preview only'}</span>
      <button class="ghost sm" data-act="tLevel">+1 level</button><button class="ghost sm" data-act="t5">+5 levels</button>${TEST_MODE ? '<button class="ghost sm" data-act="t100">+100 levels</button>' : ''}<button class="ghost sm" data-act="tGold">+gold</button><button class="ghost sm" data-act="tEss">+50 gems</button><button class="ghost sm" data-act="tShards">+40 shards</button>
      <button class="ghost sm" data-act="tBoss">World boss now</button><button class="ghost sm" data-act="tUnlock">Unlock attacks</button>
      <button class="ghost sm" data-act="tLegend">Legendary item</button><button class="ghost sm" data-act="tFocus">Dragonsoul Focus (new 3D)</button></div>` : ''}
    <label class="tgl sel"><span><b>Menu size</b><small>Compact fits more items and stats on screen. Large makes text and buttons bigger</small></span>
      <select data-sel="uiSize">${UI_SIZES.map((z, i) => `<option value="${i}" ${(s.uiSize | 0) === i ? 'selected' : ''}>${z.name}</option>`).join('')}</select></label>
    ${tg('hq', 'High graphics', 'Shadows, outlines and glowing bullets. Turns off by itself if the frame rate drops')}
    ${tg('fx', 'Cinematic effects', 'Bloom on crystals, lava, torches and magic, soft shadows and colour grading (with High graphics)')}
    ${tg('pixel', 'Pixel art', 'Draw the world as crisp pixel art. Turn off for smooth 3D')}
    <label class="tgl sel"><span><b>Auto-salvage</b><small>Turns drops that are not upgrades into gold and gems</small></span>
      <select data-sel="autoSalvage">${['Off', 'Common', 'Uncommon and below', 'Rare and below'].map((t, i) => `<option value="${i}" ${(s.autoSalvage | 0) === i ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    ${tg('calm', 'Reduce flashing', 'No red hit flash or screen shake, and a fixed render scale')}
    ${tg('mute', 'Mute sound', 'All sound is generated live, no downloads')}${tg('fps', 'Show FPS', 'Frame rate, draw calls and render scale')}
    <div class="row"><button class="ghost sm" data-act="credits">Credits and licenses</button></div>
    <div class="danger"><button class="ghost" data-act="reset1" id="reset1">${TEST_MODE ? 'Reset test hero' : 'Reset progress'}</button><span id="resetConfirm" hidden>${TEST_MODE ? 'Erase this test hero only?' : 'Erase this hero everywhere?'} <button class="warn" data-act="reset2">Yes, erase</button></span></div>`);
}

function handlePanelClick(e) {
  const b = e.target.closest('[data-act]'); if (!b) return;
  UI.tapAnchor = panelAnchor(b);
  if (b.getAttribute('aria-disabled') === 'true') { Sfx.play('click'); return; }
  const act = b.dataset.act; Sfx.play('click');
  unlockSeen(act);
  if (!LOCAL_PREVIEW && !TEST_MODE && ['tLevel', 't5', 't100', 'tGold', 'tEss', 'tShards', 'tBoss', 'tUnlock', 'tLegend', 'tFocus'].includes(act)) return;
  switch (act) {
    case 'testMode': saveNow(true); location.assign(testModeUrl(location.href, !TEST_MODE)); break;
    case 'close': UI.close(); break;
    case 'tZoom': treeZoom(b.dataset.z); break;
    case 'mSmith': openSmith('Upgrade'); break;
    case 'mMenu': openMenu(); break;
    case 'mJournal': openJournal(); break;
    case 'mCases': case 'cases': openCases(); break;
    case 'mCollection': openCollection(); break;
    case 'mDaily': openDaily(); break;
    case 'dailyClaim': { const r = claimLogin(Date.now()); if (r) { Sfx.play(r.i === 6 ? 'win' : 'unlock'); toast(`Day ${r.i + 1}: ${r.name}${r.key ? ` (Tier ${r.key.t})` : r.gems ? ` (+${r.gems})` : ''}`, 'good'); } openDaily(); break; }
    case 'mPrestige': openPrestige(); break;
    case 'petEquip': equipCompanion(b.dataset.pet); break;
    case 'prestigeReview': openPrestigeReview(); break;
    case 'prestigeConfirm': confirmPrestige(); break;
    case 'collectionSlot': openCollection(b.dataset.slot); break;
    case 'collectionItem': openCollectionItem(b.dataset.id); break;
    case 'mIdle': openIdle(); break;
    case 'caseSel': openCases(b.dataset.k); break;
    case 'caseOpen': spinCase(b.dataset.id); break;
    case 'caseFast': openCasesFast(b.dataset.k); break;
    case 'reelSkip': Reel.skip = true; break;
    case 'equip2': if (equipItem(b.dataset.id)) { Sfx.play('equipped'); b.remove(); } break;
    case 'salvage2': salvageItem(b.dataset.id); Sfx.play('coin'); b.parentNode.querySelectorAll('[data-act=equip2],[data-act=salvage2]').forEach((x) => x.remove()); break;
    case 'idleTab': openIdle(b.dataset.tab); break;
    case 'pickUp': if (upgradePick()) { Sfx.play('unlock'); openIdle('Mining'); } break;
    case 'vaultCollect': if (collectVault()) openIdle('Vault'); break;
    case 'vaultUp': if (upgradeVault()) openIdle('Vault'); break;
    case 'expGo': { const sel = $('expB'); if (sel && startExped(sel.value, +b.dataset.d)) openIdle('Expeditions'); break; }
    case 'expClaim': if (claimExped(+b.dataset.i)) openIdle('Expeditions'); break;
    case 'mArena': openArenaPanel(); break;
    case 'mPlayers': openPlayers(); break;
    case 'mpGo': mpGoTo(b.dataset.k); break;
    case 'nickSave': { const v = cleanNick(($('nickIn') || {}).value); if (v) { G.profile.nick = v; G.dirty = true; MP.last = ''; showToast(`Nickname: ${v}`, 'good'); } else showToast('Use letters or numbers', 'bad'); break; }
    case 'saveCode': openSaveCode(); break;
    case 'loadCode': { const v = ($('codeIn') || {}).value || ''; const p = parseSaveCode(v); if (!p) { showToast('That code does not work', 'bad'); break; } applyProfile(p, `Backup loaded · level ${p.level}`); G.dirty = true; saveNow(true); UI.close(); break; }
    case 'copyCode': { const t = $('codeOut'); if (t) { t.select(); try { navigator.clipboard.writeText(t.value).then(() => showToast('Code copied', 'good'), () => showToast('Select the code and copy it', 'bad')); } catch (_) { showToast('Select the code and copy it', 'bad'); } } break; }
    case 'accept': if (acceptJob(UI.npc.id)) { Coach.note('jobAccepted'); UI.close(); } break;
    case 'turnin': if (turnInJob()) { Coach.note('jobTurnedIn'); UI.close(); } break;
    case 'abandon': abandonJob(); UI.close(); break;
    case 'upgrade': openMerge(b.dataset.slot, false, 'smith'); break;
    case 'forge': if (buyForge(b.dataset.slot)) { Sfx.play('coin'); Showcase.spin = 0; openSmith('Forge'); } break;
    case 'smithTab': openSmith(b.dataset.tab); break;
    case 'inspect': openInspect(b.dataset.id); break;
    case 'inspectClose': UI.sellArm = null; heroTab(UI.heroSlot ? 'Stats' : 'Gear'); break;
    case 'sellItem': { const it = G.profile.bag.find((x) => x.id === b.dataset.id); if (!it) break;
      if (rarIdx(it.rarity) >= CFG.gear.sellConfirmFrom && UI.sellArm !== it.id) { UI.sellArm = it.id; openInspect(it.id); break; }
      UI.sellArm = null; const v = sellItem(it.id);
      if (v) { Sfx.play('coin'); toast(`Sold ${it.name} for ${fmtK(v)} gold`, 'good'); heroTab(UI.heroSlot ? 'Stats' : 'Gear'); } break; }
    case 'invTab': { UI.invTab = b.dataset.tab; const el = document.getElementById(INV_SEC[UI.invTab]); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('.invTabs .tab').forEach((t) => { const on = t.dataset.tab === UI.invTab; t.classList.toggle('on', on); t.setAttribute('aria-pressed', on); }); break; }
    case 'enchPick': UI.enchSlot = b.dataset.slot; openSmith('Enchant'); break;
    case 'enchReroll': if (rerollAffix(b.dataset.slot, b.dataset.k)) Sfx.play('job'); else toast(matCount(runeId()) < enchantRunes(G.profile.gear[b.dataset.slot] || { rarity: 'common' }) ? 'Not enough Rune Shards' : 'Not enough gold', 'bad'); openSmith('Enchant'); break;
    case 'enchUp': if (empowerAffix(b.dataset.slot, b.dataset.k)) Sfx.play('job'); else toast(matCount(runeId()) < enchantRunes(G.profile.gear[b.dataset.slot] || { rarity: 'common' }) ? 'Not enough Rune Shards' : 'Not enough gems', 'bad'); openSmith('Enchant'); break;
    case 'craftBiome': UI.craftBiome = +b.dataset.b; openSmith('Craft'); break;
    case 'craftPiece': if (craftSetPiece(+b.dataset.b, b.dataset.slot)) { Sfx.play('coin'); Showcase.spin = 0; } openSmith('Craft'); break;
    case 'buyUpg': if (buyUpgrade(b.dataset.id)) Sfx.play('unlock'); openSmith('Masterwork'); break;
    case 'queue': queueArena(); break;
    case 'hub': UI.close(); leaveArena(); break;
    case 'again': UI.close(); leaveArena(); queueArena(); break;
    case 'class': chooseClass(b.dataset.cls); UI.close(); break;
    case 'tab': heroTab(b.dataset.tab); break;
    case 'openMenu': openMenu(); break;
    case 'mHero': heroTab('Stats'); break;
    case 'mGear': UI.invTab = null; heroTab('Gear'); break;
    case 'mBrawlers': openBrawlers(); break;
    case 'mSkills': openSkills(G.profile.cls); break;
    case 'mArtifacts': openArtifacts('Equip'); break;
    case 'mProgress': openProgress('Road'); break;
    case 'bSel': openBrawlers(b.dataset.id); break;
    case 'bPlay': if (setBrawler(b.dataset.id)) { Sfx.play('level'); openBrawlers(b.dataset.id); } break;
    case 'bTree': openSkills(b.dataset.id); break;
    case 'ownedOnly': UI.ownedOnly = !UI.ownedOnly; if (UI.current === 'artifacts') openArtifacts(UI.artTab); else openBrawlers(); return;
    case 'artTab': openArtifacts(b.dataset.tab); break;
    case 'relicTier': UI.relicTier = +b.dataset.k; openArtifacts(UI.artTab); break;
    case 'progTab': openProgress(b.dataset.tab); break;
    case 'tWhich': openSkills(b.dataset.w); break;
    case 'tPreset': setPreset(G.profile, TreeView.which, +b.dataset.i); TreeView.keep = true; openSkills(TreeView.which); break;
    case 'tAuto': { const n = autoSpend(G.profile, TreeView.which); if (n) { Sfx.play('level'); toast(`Spent ${n} point${n === 1 ? '' : 's'}`); TreeView.keep = true; openSkills(TreeView.which); } else toast('No node to put points in', 'bad'); break; }
    case 'tReset': if (resetTree(G.profile, TreeView.which)) { Sfx.play('coin'); TreeView.keep = true; openSkills(TreeView.which); } else toast(`Need ${fmtK(treeResetCost(G.profile))} gold, or the tree is already empty`, 'bad'); break;
    case 'tSpend': { const n = +b.dataset.n || 1, mx = nodeMax(treeOf(G.profile, TreeView.which).nodes[TreeView.sel]); if (spendNode(G.profile, TreeView.which, TreeView.sel, n >= 5 && mx !== Infinity ? 99 : n)) { Sfx.play('pickup'); TreeView.keep = true; openSkills(TreeView.which); } break; }
    case 'credits': creditsPanel(); break;
    case 'openSettings': openSettings(); break;
    case 'equip': equipItem(b.dataset.id); UI.gearPick = null; Showcase.spin = 0; heroTab('Gear'); break;
    case 'gwear': { // one tap on a bag piece wears it; the old piece goes back into the bag
      const it = G.profile.bag.find((x) => x.id === b.dataset.id); if (!it) break;
      if (equipItem(it.id)) { Sfx.play('equipped'); UI.gearSlot = it.slot; UI.gearPickSlot = it.slot; UI.gearPick = null; Showcase.spin = 0; }
      heroTab('Gear'); break; }
    case 'gpick': { UI.gearPick = b.dataset.id && UI.gearPick !== b.dataset.id ? b.dataset.id : null;
      // in "All gear" a pick also selects its slot, so the compare and the buttons are about that slot
      const it = UI.gearPick && G.profile.bag.find((x) => x.id === UI.gearPick); if (it && it.slot !== UI.gearSlot) { UI.gearSlot = it.slot; UI.gearPickSlot = it.slot; }
      heroTab('Gear'); break; }
    case 'gearAll': UI.gearAll = b.dataset.v === '1'; UI.gearPick = null; heroTab('Gear'); break;
    case 'pMore': UI.moreOpen = !UI.moreOpen; syncMore(); break;
    case 'unequip': if (unequipItem(b.dataset.slot)) { Showcase.spin = 0; heroTab('Gear'); } break;
    case 'slot': UI.gearSlot = b.dataset.slot; heroTab('Gear'); break;
    case 'hsSlot': UI.hsAll = false; if (UI.heroSlot === b.dataset.slot) { hsClose(); break; } UI.heroSlot = b.dataset.slot; UI.heroPick = null; UI.hsScroll = 0; hsRender(true, false); break;
    case 'hsPick': if (b.dataset.slot) UI.heroSlot = b.dataset.slot; UI.heroPick = UI.hsAll ? b.dataset.id : UI.heroPick === b.dataset.id ? null : b.dataset.id; UI.hsAll = false; hsRender(false, true); break;
    case 'hsAll': UI.hsAll = true; hsRender(false, false); break;
    case 'hsAllBack': UI.hsAll = false; hsRender(false, false); break;
    case 'hsWear': if (equipItem(b.dataset.id)) Sfx.play('equipped'); UI.heroPick = null; hsRender(false, false); break;
    case 'hsBack': hsClose(); break;
    case 'equipAtk': equipAttack(b.dataset.id); openBrawlers(); break;
    case 'toggleArt': toggleArtifact(b.dataset.id); Sfx.play('job'); openArtifacts('Equip'); break;
    case 'upgradeHere': openMerge(b.dataset.slot, false, 'hero'); break;
    case 'upgradeMax': openMerge(b.dataset.slot, true, 'hero'); break;
    case 'upgradeMax2': openMerge(b.dataset.slot, true, 'smith'); break;
    case 'mergeConfirm': { const plan = UI.mergePlan; if (!plan) break; if (upgradeItemMax(plan.slot, plan)) { Sfx.play('win'); toast(`Reforged with ${plan.materials.length} piece${plan.materials.length > 1 ? 's' : ''} · +${plan.n} level${plan.n > 1 ? 's' : ''}`, 'good'); mergeReturn(plan.back); } else { toast('Inventory or cost changed. Review the refreshed merge.', 'bad'); openMerge(plan.slot, plan.bulk, plan.back); } break; }
    case 'mergeBack': mergeReturn(UI.mergePlan && UI.mergePlan.back); break;
    case 'protectGear': { const it = G.profile.bag.find(m => m.id === b.dataset.id); if (it) { it.locked = !it.locked; G.dirty = true; heroTab('Gear'); } break; }
    case 'salvage': salvageItem(b.dataset.id); UI.gearPick = null; heroTab('Gear'); break;
    case 'spend': if (spendSkillPoint(b.dataset.node)) heroTab('Build'); break;
    case 'saveNow': saveNow(true); toast(Cloud.state === 'on' || Cloud.state === 'connecting' ? 'Progress saved' : 'Saved on this device'); break;
    case 'tLevel': TestTools.levelUp(); break;
    case 'tGold': TestTools.gold(); toast('Gold added', 'good'); break;
    case 't5': TestTools.levels5(); break;
    case 't100': if (TEST_MODE) TestTools.levels100(); break;
    case 'tEss': TestTools.essence(); break;
    case 'tShards': dropShards(40); break;
    case 'artUp': if (upgradeArtifact(b.dataset.id)) { Sfx.play('level'); openArtifacts('Upgrade'); } break;
    case 'gems': if (buyGems(+b.dataset.n)) { Sfx.play('coin'); openSmith('Gems'); } else toast('Not enough gold', 'bad'); break;
    case 'reroll': if (rerollItem(b.dataset.slot)) { Sfx.play('job'); heroTab('Gear'); } else toast('Not enough gold', 'bad'); break;
    case 'key': if (chooseKeystone(+b.dataset.tier, b.dataset.id)) heroTab('Build'); break;
    case 'salvageAll': salvageAllWorse(); heroTab('Gear'); break;
    case 'travel': UI.close(); travelTo(+b.dataset.i); break;
    case 'tier': if (setWorldTier(+b.dataset.t)) openWaypoints(); break;
    case 'riftGo': UI.close(); startRift(+b.dataset.f); break;
    case 'trialGo': { UI.close(); if (!startDungeon(trialPoi(+b.dataset.z))) toast('Finish your challenge first', 'bad'); break; }
    case 'trialForge': { const it = forgeTrialRelic(+b.dataset.z); if (it) { toast(`Forged ${it.name}!`, 'good'); Sfx.play('win'); } openTrialPanel(+b.dataset.z); break; }
    case 'dungeonGo': { UI.close(); const po = dungeonPois().find((x) => x.id === b.dataset.id); if (!startDungeon(po, b.dataset.key != null ? +b.dataset.key : null)) toast('Finish your challenge first', 'bad'); break; }
    case 'offline': claimOffline(G.offline); UI.close(); break;
    case 'tBoss': TestTools.boss(); UI.close(); toast('World boss is on its way'); break;
    case 'tUnlock': TestTools.unlockAll(); break;
    case 'tLegend': TestTools.legendary(); UI.close(); break;
    case 'tFocus': TestTools.dragonsoulFocus(); UI.close(); break;
    case 'reset1': $('resetConfirm').hidden = false; $('reset1').hidden = true; break;
    case 'reset2': Store.clear(); G.profile = defaultProfile(); saveNow(true); G.player.cls = 'novice'; refreshPlayerStats(true); G.player.x = CFG.world.spawn.x; G.player.z = CFG.world.spawn.z; UI.close(); toast('Progress erased. A new hero begins.'); Coach.render(); break;
  }
}
function handleSettingChange(e) {
  if (e.target.dataset.sel2 === 'tBrawler') { openSkills(e.target.value); return; }
  if (e.target.dataset.sel) { G.profile.settings[e.target.dataset.sel] = +e.target.value; G.dirty = true; if (e.target.dataset.sel === 'uiSize') { applyUiSize(); measureSheet(); } return; }
  const k = e.target.dataset.set; if (!k) return;
  if (k === 'fastXp' && !LOCAL_PREVIEW) return;
  G.profile.settings[k] = e.target.checked; G.dirty = true;
  if (k === 'mute') Sfx.setMute(e.target.checked);
  if (k === 'bots') { if (e.target.checked) addHubBots(); else removeHubBots(); }
  if (k === 'npcs') Coach.render();
  if (k === 'pixel') resize();
  if (k === 'calm') { Q.locked = e.target.checked; Cam.shake = 0; $('vignette').dataset.o = '0'; }
}

