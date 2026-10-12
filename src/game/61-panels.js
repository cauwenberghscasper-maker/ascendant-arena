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
function openModal(html, closable, showcase) {
  G.modal = true; UI.closable = closable !== false;
  const panelKind = UI.current + (UI.current === 'hero' ? '|' + UI.heroTab + '|' + UI.gearSlot : UI.current === 'collection' ? '|' + UI.collectionSlot : '');
  const prevBody = $('panel').querySelector(':scope > .pBody'), same = UI.panelKind === panelKind;
  const scroll = same ? (prevBody ? prevBody.scrollTop : $('panel').scrollTop) : 0; UI.panelKind = panelKind;
  if (!same) UI.moreOpen = false;
  $('panel').className = 'panel scroll';
  setShowcase(!!showcase);
  $('modal').classList.toggle('room', !!showcase);
  $('panel').innerHTML = html + (UI.closable ? '<button class="x" data-act="close" aria-label="Close">×</button>' : '');
  $('modal').hidden = false;
  const body = $('panel').querySelector(':scope > .pBody');
  if (body) { $('panel').classList.remove('scroll'); $('panel').classList.add('dock'); body.scrollTop = scroll; syncMore(); }
  else $('panel').scrollTop = scroll;
  Input.move.id = null; Input.move.active = false; Input.move.sx = Input.move.sy = 0; $('stickBase').classList.remove('on');
  Input.atk.id = null; Input.atk.aiming = false; Input.atk.active = false; $('atkKnob').style.transform = 'translate(0px,0px)';
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
UI.close = function () { $('modal').hidden = true; G.modal = false; setShowcase(false); UI.gearSlot = null; UI.current = null; UI.panelKind = null; UI.mergePlan = null; UI.afterClose && UI.afterClose(); UI.afterClose = null; };
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
const TAB_NAME = { Mining: 'Mining & Museum', Gear: 'Equipment', Road: 'Level Road', Records: 'Hiscores', Feats: 'Achievements', Vault: 'Bank', Upgrade: 'Reforge', Gems: 'Gem trade', Equip: 'Socket', 'Auto Hunt': 'Auto-hunt' };
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
  openModal(dock(head, body, selBar('', btn, '', note)), true, true);
}
function mergeReturn(back) { UI.mergePlan = null; if (back === 'smith') openSmith('Upgrade'); else heroTab('Gear'); }
function itemRow(it, right, extra, opts) {
  opts = opts || {};
  const flag = opts.better ? '<span class="better">Better<i class="rdot in"></i></span>' : opts.upgrade ? '<span class="better up">Can upgrade<i class="rdot in"></i></span>' : '';
  return `<div class="item ${it.rarity}${opts.better || opts.upgrade ? ' alert' : ''}"><span class="thw ${it.rarity}"><img class="thumb ${it.rarity}" src="${thumbFor(it)}" alt=""></span><div class="meta">${flag}<div class="slot">${extra || it.slot}</div><div class="nm">${escapeHTML(it.name)} ${it.up ? `<em>+${it.up}${it.up >= 10 ? ' ' + '★'.repeat(Math.min(5, Math.floor(it.up / 10))) + (it.up >= 60 ? '+' : '') : ''}</em>` : ''} ${rarityChip(it.rarity)}</div><div class="st">${statLine(it)}</div>${it.aff && Object.keys(it.aff).length ? `<div class="st aff">${affixText(it)}</div>` : ''}${perkLine(it)}</div>${right || ''}</div>`;
}
function openNpc(def) {
  UI.current = 'npc:' + def.id;
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
function openSmith(tab) {
  tab = tab || UI.smithTab || 'Upgrade'; UI.smithTab = tab;
  UI.current = 'smith';
  const p = G.profile;
  let body;
  if (tab === 'Upgrade') {
    body = `<p class="say">“Bring me weaker gear of the same slot and I’ll melt it into the piece you wear. Each level adds 12% to its stats. Past +5 I need gems too; every 10 levels earns a star.”</p><div class="list">` + CFG.gear.slots.map((s) => {
      const it = p.gear[s];
      if (!it) return `<div class="item"><div class="meta"><div class="nm">${SLOT_LABEL[s]} · empty</div><div class="st">Equip a piece to merge upgrades.</div></div><button class="ghost" data-act="slot" data-slot="${s}">Choose gear</button></div>`;
      const cost = upgradeCost(it), ess = upgradeEssence(it), max = it.up >= CFG.gear.maxUp, can = maxUpgradePlan(it, 1).n > 0;
      const mp = maxUpgradePlan(it);
      return itemRow(it, `<div class="col"><button class="${can ? 'primary' : 'ghost'}" data-act="${mp.n > 1 ? 'upgradeMax2' : 'upgrade'}" data-slot="${s}" ${max ? 'disabled' : ''}>${max ? 'Max' : mp.n > 1 ? `Reforge… +${mp.n}` : `Reforge… ${costHTML(cost, ess)}`}</button>${mergeCostHTML(it)}</div>`, null, { upgrade: can });
    }).join('') + '</div>';
  } else if (tab === 'Gems') {
    const pr = gemPrice(p), row = (n) => { let c = 0; for (let i = 0; i < n; i++) c += Math.round(30 * Math.pow(CFG.enemies.goldGrowth, p.level - 1) * Math.pow(1.03, (p.gemBuys || 0) + i)); return `<button class="${p.gold >= c ? 'primary' : 'disabled'}" data-act="gems" data-n="${n}" ${p.gold >= c ? '' : 'aria-disabled="true"'}>${ICON.ess}${n} for ${ICON.coin}${fmtK(c)}</button>`; };
    body = `<p class="say">“Got more gold than you need? I’ll trade you gems. The price climbs a little with every gem and cools down over time.”</p>
      <div class="gemx"><div><span>Current price</span><b>${ICON.coin}${fmtK(pr)} <small>per gem</small></b></div><div class="row">${row(10)}${row(50)}${row(200)}</div></div>
      <p class="fine">Gems also drop from elites, dens, world bosses, shrines, milestone chests and salvaging Rare+ gear.</p>`;
  } else {
    body = `<p class="say">“Rare pieces carry a perk that gives you a new way to attack. Your old piece goes to your bag.”</p><div class="list">` + CFG.gear.slots.map((s) => {
      const o = forgeOffer(s), can = p.gold >= o.price;
      return itemRow(o.item, `<button class="${can ? 'primary' : 'disabled'}" data-act="forge" data-slot="${s}" ${can ? '' : 'aria-disabled="true"'}>${ICON.coin}${fmt(o.price)}</button>`, `${s} · item level ${o.item.ilvl}`);
    }).join('') + '</div><p class="fine">Prices are fixed. Epic pieces only drop from monsters, world bosses and their perks are stronger.</p>';
  }
  const upAlert = Object.values(slotAlerts()).some((a) => a.canUpgrade);
  const tabs = ['Upgrade', 'Gems', 'Forge'].map((t) => `<button class="tab ${tab === t ? 'on' : ''}" data-act="smithTab" data-tab="${t}">${tabName(t)}${t === 'Upgrade' && upAlert ? '<i class="rdot tabdot"></i>' : ''}</button>`).join('');
  openModal(dock(`<div class="npcHead"><span class="dotc" style="background:#8a5a3c"></span><h3>Garo’s Smithy</h3><span class="goldchip big">${ICON.coin}${fmtK(p.gold)}</span><span class="esschip big">${ICON.ess}${fmtK(p.essence)}</span></div>
    <div class="tabs">${tabs}</div>`, `<div class="tabBody">${body}</div>`, tab === 'Upgrade' ? selBar('', '', '', 'Each Reforge… shows every piece the smith will melt down before you confirm.') : ''), true, true);
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
    const g = gearTotals(p.gear);
    const st = (k, v, sub, earned) => {
      const colors = ['#aba4b8','#77ad91','#80cbd8','#c296df','#f2cf85'];
      const rank = earned && earned.rank;
      return `<div class="${earned ? 'statCard' : ''}" ${earned ? `style="--statColor:${colors[rank]}"` : ''}><span>${k}</span><b>${v}${sub ? ` <small>${sub}</small>` : ''}</b>${earned ? `<i class="statCorner" aria-hidden="true"></i><label class="statSteps" aria-hidden="true">${[1,2,3,4].map(n=>`<i class="${rank>=n?'earned':''}"></i>`).join('')}</label><small class="statRank">${earned.name} benchmark</small>` : ''}</div>`;
    };
    const mark = statMilestone;
    body = `<h4 class="sub first">Combat</h4><div class="statgrid">
      ${st('Damage', fmtK(pl.dmg),null,mark(pl.dmg,[75,250,1000,5000]))}${st('Max HP', fmtK(pl.maxHp),null,mark(pl.maxHp,[500,2000,10000,50000]))}
      ${st('Crit chance', pct(CFG.combat.critChance + pl.critBonus),null,mark(pl.critBonus,[.05,.15,.3,.5]))}${st('Crit damage', '×' + (CFG.combat.critMult + pl.critDmg).toFixed(2),null,mark(pl.critDmg,[.1,.3,.6,1]))}
      ${st('Attack speed', '+' + pct(pl.atkSpeed || 0),null,mark(pl.atkSpeed,[.1,.25,.5,1]))}${st('Lifesteal', pct(pl.lifesteal || 0),null,mark(pl.lifesteal,[.03,.08,.15,.3]))}
      ${st('Damage reduction', pct(Math.min(0.6, pl.armor || 0)),null,mark(Math.min(.6,pl.armor||0),[.05,.15,.3,.5]))}${st('Cooldowns', '-' + pct(pl.cdr || 0),null,mark(pl.cdr,[.05,.15,.3,.5]))}
      ${st('Move speed', pl.speed.toFixed(2))}${st('Weapon mastery', '+' + pct(pl.masteryDmg || 0), 'damage')}</div>
      <h4 class="sub">Progress</h4><div class="statgrid">
      ${st('Level', `${p.level}`)}${st('Prestige', `${prestigeCount(p)}`)}${st('Gear score', fmt(Math.round(g.score)))}
      ${st('Total mastery', fmt(totalMastery(p)))}${st('Gems', fmtK(p.essence))}
      ${st('Monsters', fmtK(p.stats.kills), `${fmt(p.stats.elites || 0)} elite`)}${st('Best streak', fmt(p.stats.bestStreak || 0))}
      ${st('Trophies', fmt(p.trophies), `best ${fmt(p.bestTrophies)}`)}${st('Arena power', '×' + playerArenaPower(p).toFixed(2))}</div>

      <p class="fine">Corner ribbons show earned stat benchmarks, from Base to Ascendant. They are not stat caps.</p><button class="ghost" data-act="mPrestige">Prestige ${prestigeCount(p)} · ${prestigeCount(p) ? `${petProgress(p).name} Lv ${petProgress(p).level}` : `Dragon unlocks at level ${PRESTIGE_LEVEL}`}</button>
      <h4 class="sub">Gear bonuses</h4><p class="fine">${(() => { const a = g.aff; const l = Object.keys(a).filter((k) => a[k] > 0).map((k) => `+${Math.round(a[k] * 100)}% ${CFG.affixes[k].name}`); return l.length ? l.join(' · ') : 'Uncommon and better items roll bonuses like attack speed, crit damage, lifesteal and damage reduction.'; })()}</p>
      <h4 class="sub">Attack perks and specials</h4>${(() => { const l = CFG.gear.slots.map((s) => perkText(p.gear[s])).filter(Boolean); return l.length ? `<div class="list">${l.map((t) => `<div class="perk solo">${t}</div>`).join('')}</div>` : '<p class="fine">Rare, Epic and Legendary pieces each add a new attack option, and accessories add a Fire, Ice, Storm or Toxic special.</p>'; })()}`;
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
    const pieces = p.bag.filter((b) => b.slot === sel && !equippedIds.has(b.id)).sort((x, y) => (isBetter(y, x) ? 1 : isBetter(x, y) ? -1 : 0));
    const pick = pieces.find((b) => b.id === UI.gearPick) || null; if (!pick) UI.gearPick = null;
    const mark = (it) => isBetter(it, cur) ? { cls: 'up', text: '▲', label: 'better than equipped' } : next.has(it.id) ? { cls: 'mat1', text: '+1', label: 'used by the next merge' } : all.has(it.id) ? { cls: 'mat', text: 'max', label: 'used by Merge max' } : null;
    const worse = p.bag.filter((b) => !b.locked && !isBetter(b, p.gear[b.slot]) && rarIdx(b.rarity) < 4).length;
    const L = p.luck, Pi = CFG.loot.pity;
    const reroll = cur && rarIdx(cur.rarity) >= 1 ? `<button class="ghost sm" data-act="reroll" data-slot="${sel}">Reroll bonuses ${ICON.coin}${fmtK(rerollCost(cur))}</button>` : '';
    body = `<div class="tiles">${tiles}</div>
      <div class="subRow"><h4 class="sub">${SLOT_LABEL[sel]}s in your bag · ${pieces.length}</h4><small>bag ${p.bag.length}/${CFG.gear.bagMax}</small>${worse ? `<button class="ghost sm" data-act="salvageAll" aria-label="High-alch ${worse} weaker pieces">Alch ${worse}</button>` : ''}</div>
      ${pieces.length ? `<div class="ilegend"><span><i class="up">▲</i>better</span><span><i class="m1">+1</i>next reforge</span><span><i class="mm">max</i>reforge max</span><span>${gi('m_lock')} kept</span></div>` : ''}
      ${itemGrid(pieces, { act: 'gpick', sel: UI.gearPick, mark, empty: `No other ${SLOT_LABEL[sel].toLowerCase()} pieces in your bag yet. Monsters, elites, dens, shrines and world bosses drop gear. Deeper areas roll rarer items.` })}
      <h4 class="sub">${SLOT_LABEL[sel]} · worn</h4><div class="list">${cur ? itemRow(cur, reroll, null, { upgrade: can }) : '<p class="fine">Nothing equipped. Choose a piece from your bag above.</p>'}</div>
      <h4 class="sub">Luck</h4><div class="luck">${['rare', 'epic', 'legendary'].concat(HIGH_RAR.filter((h) => highWeights(curTier(), 6)[h] > 0)).map((r) => `<div class="lk ${r}"><span>${CFG.gear.rarity[r].name} guaranteed in</span><b>${Math.max(1, Pi[r] - L[r])} drops</b><i style="--v:${Math.round(L[r] / Pi[r] * 100)}%"></i></div>`).join('')}</div>`;
    if (pick) {
      const better = isBetter(pick, cur), se = salvageEssence(pick);
      bar = selBar(itemSummary(pick, `${better ? '<span style="color:#58e08a">Better than equipped</span> · ' : ''}Alch: ${ICON.coin}${fmtK(salvageValue(pick))}${se ? ` ${ICON.ess}${se}` : ''}`) + `<button class="pMoreBtn" data-act="gpick" data-id="" aria-label="Deselect">✕</button>`,
        `<button class="ghost" data-act="protectGear" data-id="${escapeHTML(pick.id)}">${pick.locked ? 'Unprotect' : 'Protect'}</button>`
        + `<button class="ghost" data-act="salvage" data-id="${escapeHTML(pick.id)}" ${pick.locked ? 'disabled' : ''}>Alch</button><button class="primary" data-act="equip" data-id="${escapeHTML(pick.id)}">${wearWord(pick.slot)}</button>`,
        `<div class="list">${itemRow(pick, '', 'In your bag', { better })}${cur ? itemRow(cur, '', 'Worn now') : '<p class="fine">Empty slot</p>'}</div>`);
    } else if (!cur) {
      bar = selBar('', '', '', 'Choose a piece from your bag to equip it.');
    } else {
      const note = max ? 'This piece is at its maximum level.' : one.n ? '' : `${mergeCostHTML(cur)} · tap a piece to wear, protect or alch it`;
      bar = selBar('', `<button class="${can && !max ? 'primary' : 'ghost'}" data-act="upgradeHere" data-slot="${sel}" ${max ? 'disabled' : ''}>${max ? 'Max level' : `Reforge +1 ${costHTML(upgradeCost(cur), upgradeEssence(cur))}`}</button>`
        + `<button class="ghost" data-act="unequip" data-slot="${sel}">Unequip</button><button class="${mp.n > 1 ? 'primary gold' : 'disabled'}" data-act="upgradeMax" data-slot="${sel}" ${mp.n > 1 ? '' : 'disabled'}>Reforge max${mp.n > 1 ? ` +${mp.n}` : ''}</button>`, '', note);
    }
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
    const wpn = Object.keys(CFG.attacks).filter((id) => av.includes(id) || p.mastery['w:' + id]).sort((x, y) => (p.mastery['w:' + y] || 0) - (p.mastery['w:' + x] || 0)).map((id) => row('w:' + id, `+${((masteryLevel(p.mastery['w:' + id] || 0) - 1) * 0.4).toFixed(1)}% damage with ${CFG.attacks[id].name}`)).join('');
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
      for (const id in CFG.attacks) { const a = CFG.attacks[id]; if (a.unlock && a.unlock.level === L) r.push(`<span class="rw atk">${a.name}</span>`); }
      for (const id in CFG.artifacts) { const a = CFG.artifacts[id]; if (a.unlock && a.unlock.level === L) r.push(`<span class="rw art">${a.name}</span>`); }
      rows.push(`<div class="road ${L <= p.level ? 'done' : L === p.level + 1 ? 'next' : ''} ${ms ? 'ms' : ''}" ${L === p.level + 1 ? 'id="roadNext"' : ''}><span class="rl">${L}</span><div class="rr">${r.join('')}</div></div>`);
    }
    body = `<h4 class="sub first">Level Road · ${p.level}/${P.cap}</h4><p class="fine">Every level drops an item. Every 5th level is a milestone chest with a guaranteed rarity.</p><div class="roadlist">${rows.join('')}</div>
      <h4 class="sub">Feats</h4><div class="feats">${ACHIEVEMENTS.map((a) => `<div class="feat ${p.ach[a.id] ? 'got' : ''}"><b>${a.name}</b><small>${a.desc}</small></div>`).join('')}</div>`;
    setTimeout(() => { const n = document.getElementById('roadNext'); if (n) n.scrollIntoView({ block: 'center' }); }, 30);
  }
  openModal(dock(`<div class="heroHead"><span class="lv">${p.level}</span><div><h3>${c.name}</h3><small>${c.role} · ${ICON.coin}${fmtK(p.gold)} · ${ICON.ess}${fmtK(p.essence)} gems</small>${prestigeBadge(p)}</div><button class="ghost sm hm" data-act="openMenu">${gi('m_menu')} Journal</button></div><div class="tabs">${tabs}</div>`, `<div class="tabBody">${body}</div>`, bar), true, true);
}
function openWaypoints() {
  UI.current = 'waypoints';
  const p = G.profile, here = G.interact && G.interact.kind === 'waypoint' ? G.interact.i : -1;
  const ta = tierAdd();
  let lastBiome = -1;
  const rows = CFG.world.waypoints.map((w, i) => {
    const zn = CFG.world.zones[w.zone], have = p.waypoints.includes(i), lvl = p.level >= zn.minLevel;
    const head = zn.biome !== lastBiome ? `<h4 class="sub">${zn.biomeName}</h4>` : ''; lastBiome = zn.biome;
    const btn = i === here ? '<span class="tagged">You are here</span>' : have && lvl ? `<button class="primary" data-act="travel" data-i="${i}">Teleport</button>` : `<span class="tagged">${!lvl ? 'Level ' + zn.minLevel : 'Not attuned yet'}</span>`;
    return `${head}<div class="item wp"><div class="meta"><div class="slot">${zn.safe ? 'Safe camp · no monsters' : `${zn.name} · monsters Lv ${zn.lvl[0] + ta}–${zn.lvl[1] + ta}`}</div><div class="nm">${w.name}</div></div>${btn}</div>`;
  }).join('');
  openModal(`<div class="npcHead"><span class="dotc" style="background:#9fe8ff"></span><h3>Lodestone Network</h3></div>${tierPicker()}<p class="say">Touch a lodestone once to attune to it. Then teleport between them for free.</p><div class="list">${rows}</div>`);
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
function openDungeonChest() {
  const r = claimDungeonChest(); if (!r) return;
  UI.current = 'dungeonChest'; Sfx.play('win');
  const rows = r.items.map((it) => itemRow(it, '', `${CFG.gear.rarity[it.rarity].name} · item level ${it.ilvl}`)).join('');
  openModal(`<div class="center"><div class="eyebrow">${escapeHTML(r.name)} cleared${r.tier ? ` · Tier ${r.tier}` : ''}</div><h2>${r.full ? 'Dungeon chest' : 'Plain run'}</h2></div>
    <div class="stats3"><div><b>${r.xp ? '+' + fmtK(r.xp) : '—'}</b><span>XP</span></div><div><b>${ICON.coin}+${fmtK(r.gold)}</b><span>Gold</span></div><div><b>${ICON.ess}${r.gems}</b><span>Gems</span></div></div>
    ${r.radiant ? `<h2 class="center">✦ RADIANT ✦</h2><div class="list">${itemRow(r.radiant, '', `Radiant · 1 in ${fmt(r.odds)}`)}</div>` : ''}${r.sigils != null ? `<p class="say">Trial Sigil earned · ${r.sigils}/${CFG.dungeon.trial.sigilCost} toward the relic · Radiant chance was 1 in ${fmt(r.odds)}</p>` : ''}
    ${rows ? `<div class="list">${rows}</div>` : r.sigils != null ? '' : '<p class="fine">Use a Dungeon Key for gear, gems and shards.</p>'}${r.key ? `<p class="say">Key earned: <b>${escapeHTML(keyName(r.key))}</b></p>` : ''}${r.case ? '<p class="fine">A treasure chest was found too: open it in your Journal.</p>' : ''}
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
    ${tg('npcs', 'Town NPCs', 'Show Farmer Ida, Smith Garo, Arena Master Rho and the other townsfolk. Off: the Smith and Showdown are in the Menu, jobs finish by themselves')}
    ${tg('bots', 'Bot players', 'Fill the open world with computer heroes that help against world bosses. Off: only real players, and world bosses have less HP')}
    ${LOCAL_PREVIEW || TEST_MODE ? `${LOCAL_PREVIEW && !TEST_MODE ? tg('fastXp', 'Local fast XP', `×${P.fastXpMult} XP, ×${P.testGoldMult} gold, faster bosses and shrines`) : ''}
    <div class="tools"><span class="tl">Testing tools · ${TEST_MODE ? 'separate test hero' : 'local preview only'}</span>
      <button class="ghost sm" data-act="tLevel">+1 level</button><button class="ghost sm" data-act="t5">+5 levels</button>${TEST_MODE ? '<button class="ghost sm" data-act="t100">+100 levels</button>' : ''}<button class="ghost sm" data-act="tGold">+gold</button><button class="ghost sm" data-act="tEss">+50 gems</button><button class="ghost sm" data-act="tShards">+40 shards</button>
      <button class="ghost sm" data-act="tBoss">World boss now</button><button class="ghost sm" data-act="tUnlock">Unlock attacks</button>
      <button class="ghost sm" data-act="tLegend">Legendary item</button><button class="ghost sm" data-act="tFocus">Dragonsoul Focus (new 3D)</button></div>` : ''}
    ${tg('hq', 'High graphics', 'Shadows, outlines and glowing bullets. Turns off by itself if the frame rate drops')}
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
  if (b.getAttribute('aria-disabled') === 'true') { Sfx.play('click'); return; }
  const act = b.dataset.act; Sfx.play('click');
  if (!LOCAL_PREVIEW && !TEST_MODE && ['tLevel', 't5', 't100', 'tGold', 'tEss', 'tShards', 'tBoss', 'tUnlock', 'tLegend', 'tFocus'].includes(act)) return;
  switch (act) {
    case 'testMode': saveNow(true); location.assign(testModeUrl(location.href, !TEST_MODE)); break;
    case 'close': UI.close(); break;
    case 'tZoom': treeZoom(b.dataset.z); break;
    case 'mSmith': openSmith('Upgrade'); break;
    case 'mMenu': openMenu(); break;
    case 'menuSection': openMenu(b.dataset.section); $('panel').querySelector(`[data-section="${UI.menuSection}"]`).focus({preventScroll:true}); break;
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
    case 'queue': queueArena(); break;
    case 'hub': UI.close(); leaveArena(); break;
    case 'again': UI.close(); leaveArena(); queueArena(); break;
    case 'class': chooseClass(b.dataset.cls); UI.close(); break;
    case 'tab': heroTab(b.dataset.tab); break;
    case 'openMenu': openMenu(); break;
    case 'mHero': heroTab('Stats'); break;
    case 'mGear': heroTab('Gear'); break;
    case 'mBrawlers': openBrawlers(); break;
    case 'mSkills': openSkills(G.profile.cls); break;
    case 'mArtifacts': openArtifacts('Equip'); break;
    case 'mProgress': openProgress('Road'); break;
    case 'bSel': openBrawlers(b.dataset.id); break;
    case 'bPlay': if (setBrawler(b.dataset.id)) { Sfx.play('level'); openBrawlers(b.dataset.id); } break;
    case 'bTree': openSkills(b.dataset.id); break;
    case 'ownedOnly': UI.ownedOnly = !UI.ownedOnly; if (UI.current === 'artifacts') openArtifacts(UI.artTab); else openBrawlers(); return;
    case 'artTab': openArtifacts(b.dataset.tab); break;
    case 'progTab': openProgress(b.dataset.tab); break;
    case 'tWhich': openSkills(b.dataset.w); break;
    case 'tPreset': setPreset(G.profile, TreeView.which, +b.dataset.i); TreeView.keep = true; openSkills(TreeView.which); break;
    case 'tReset': if (resetTree(G.profile, TreeView.which)) { Sfx.play('coin'); TreeView.keep = true; openSkills(TreeView.which); } else toast(`Need ${fmtK(treeResetCost(G.profile))} gold, or the tree is already empty`, 'bad'); break;
    case 'tSpend': { const n = +b.dataset.n || 1, mx = nodeMax(treeOf(G.profile, TreeView.which).nodes[TreeView.sel]); if (spendNode(G.profile, TreeView.which, TreeView.sel, n >= 5 && mx !== Infinity ? 99 : n)) { Sfx.play('pickup'); TreeView.keep = true; openSkills(TreeView.which); } break; }
    case 'credits': creditsPanel(); break;
    case 'openSettings': openSettings(); break;
    case 'equip': equipItem(b.dataset.id); UI.gearPick = null; Showcase.spin = 0; heroTab('Gear'); break;
    case 'gpick': UI.gearPick = b.dataset.id && UI.gearPick !== b.dataset.id ? b.dataset.id : null; heroTab('Gear'); break;
    case 'pMore': UI.moreOpen = !UI.moreOpen; syncMore(); break;
    case 'unequip': if (unequipItem(b.dataset.slot)) { Showcase.spin = 0; heroTab('Gear'); } break;
    case 'slot': UI.gearSlot = b.dataset.slot; heroTab('Gear'); break;
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
  if (e.target.dataset.sel) { G.profile.settings[e.target.dataset.sel] = +e.target.value; G.dirty = true; return; }
  const k = e.target.dataset.set; if (!k) return;
  if (k === 'fastXp' && !LOCAL_PREVIEW) return;
  G.profile.settings[k] = e.target.checked; G.dirty = true;
  if (k === 'mute') Sfx.setMute(e.target.checked);
  if (k === 'bots') { if (e.target.checked) addHubBots(); else removeHubBots(); }
  if (k === 'npcs') Coach.render();
  if (k === 'pixel') resize();
  if (k === 'calm') { Q.locked = e.target.checked; Cam.shake = 0; $('vignette').dataset.o = '0'; }
}

