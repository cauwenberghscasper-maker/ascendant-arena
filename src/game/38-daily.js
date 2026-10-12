// --- Daily: a 7-day login calendar that never resets (miss a day and the next claim simply continues), a weekly
// Colossus bonus (the first world boss you slay each week drops a Legendary-or-better chest), and comingUp(): the
// timers that are ready or almost ready, shown in the Journal and the calendar so every session ends on an open loop.
CFG.daily = {
  days: ['Treasure Chest', 'Gems', '3 Geodes', 'Dungeon Key', '2 Treasure Chests', '150 Ore', 'Colossus Chest'],
  weeklyFloor: 'legendary',
};
// local calendar day / Monday-based week numbers (1970-01-01 was a Thursday)
const dayNum = (now) => { const d = new Date(now); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
const weekNum = (now) => Math.floor((dayNum(now) + 3) / 7);
const loginState = () => G.profile.login || (G.profile.login = { n: 0, last: -1 });
const loginReady = (now) => loginState().last !== dayNum(now);
// rewards grow a little with every full week you have claimed
function claimLogin(now) {
  const L = loginState(); if (!loginReady(now)) return null;
  const i = L.n % 7, cyc = Math.floor(L.n / 7), res = { i, cyc, name: CFG.daily.days[i] };
  if (i === 0) addCase('treasure', { src: 'daily' });
  else if (i === 1) { res.gems = 30 + 10 * Math.min(cyc, 20); addEssence(res.gems); }
  else if (i === 2) for (let k = 0; k < 3; k++) addCase('geode', { src: 'daily' });
  else if (i === 3) res.key = addKey(makeKey(3 + Math.min(cyc, 30)));
  else if (i === 4) { addCase('treasure', { src: 'daily' }); addCase('treasure', { src: 'daily' }); }
  else if (i === 5) mineState().ore += 150;
  else { addCase('boss', { src: 'daily', f: 'legendary' }); res.gems = 100; addEssence(res.gems); }
  L.n++; L.last = dayNum(now); G.dirty = true; ev(Object.assign({ t: 'daily' }, res)); return res;
}
// called on an eligible world boss kill: once per week a Colossus chest with a Legendary floor
function weeklyBossBonus(now) {
  const p = G.profile, wk = weekNum(now); if (!p.weekly || p.weekly.wk !== wk) p.weekly = { wk, done: false };
  if (p.weekly.done) return false;
  p.weekly.done = true; addCase('boss', { src: 'weekly', f: CFG.daily.weeklyFloor }); G.dirty = true; return true;
}
// [{ label, t }] with t = seconds until ready (0 = ready now); ready first, then soonest
function comingUp(now) {
  const p = G.profile, out = [], hm = (s) => s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor(s % 3600 / 60)}m` : `${Math.max(1, Math.ceil(s / 60))}m`;
  const add = (t, ready, wait) => out.push({ t: Math.max(0, t), label: t > 0 ? `${wait} in ${hm(t)}` : ready });
  const midnight = () => { const d = new Date(now); d.setHours(24, 0, 0, 0); return (d - now) / 1000; };
  add(loginReady(now) ? 0 : midnight(), 'Daily reward ready to claim', `Day ${loginState().n % 7 + 1} reward`);
  { const v = vaultState(now); add((v.cap - v.mins) * 60, 'Bank is full: collect it', 'Bank full'); }
  (p.exp || []).forEach((e) => add((e.s + e.d * 60000 - now) / 1000, `${CFG.brawlers[e.b].name} is back with loot`, `${CFG.brawlers[e.b].name} returns`));
  if (p.cases.length) add(0, `${p.cases.length} chest${p.cases.length > 1 ? 's' : ''} to open`, '');
  { const wk = weekNum(now), done = p.weekly && p.weekly.wk === wk && p.weekly.done; add(done ? ((wk + 1) * 7 - 3 - dayNum(now) - 1) * 86400 + midnight() : 0, 'Weekly Colossus bonus: slay a world boss', 'Weekly Colossus bonus'); }
  if ((p.keys || []).length) add(0, `Tier ${p.keys[0].t} Dungeon Key ready`, '');
  for (const [zi, S] of Object.entries(p.trials || {})) if (S.sig >= CFG.dungeon.trial.sigilCost * 0.8) add(0, S.sig >= CFG.dungeon.trial.sigilCost ? `${CFG.world.zones[zi].name} relic can be forged` : `${CFG.world.zones[zi].name} relic: ${S.sig}/${CFG.dungeon.trial.sigilCost} sigils`, '');
  { const m = mineState(), c = pickCost(m.pick); if (m.pick < CFG.mining.pickMax && m.ore >= c * 0.8) add(0, m.ore >= c ? 'Pickaxe upgrade affordable' : `Pickaxe: ${fmt(m.ore)}/${fmt(c)} ore`, ''); }
  return out.sort((a, b) => a.t - b.t);
}
// --- end daily
