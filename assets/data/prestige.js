// Prestige companions grant bounded world-play bonuses, never arena bonuses.
export const PRESTIGE_LEVEL = 200;
export function prestigeCount(p) {
  return Number.isSafeInteger(p.prestige) ? Math.max(0, Math.min(9999, p.prestige)) : 0;
}
export function migratePrestige(p) { p.prestige = prestigeCount(p); }
export function prestigeBlock(p, context) {
  if (prestigeCount(p) >= 9999) return 'Prestige limit reached';
  if (p.level < PRESTIGE_LEVEL) return `Reach level ${PRESTIGE_LEVEL}`;
  if (context.mode !== 'hub' || context.rift || context.shrine) return 'Return to the open world';
  if (!context.alive || context.inCombat) return 'Finish combat first';
  if (!context.inTown) return 'Return to Willowcross Town';
  return '';
}
const treesOf = p => Object.keys(p.brawlers || {}).sort().map(k => [k, p.brawlers[k] && p.brawlers[k].tree]);
const resetState = p => JSON.stringify([p.level, p.xp, treesOf(p), p.road, p.waypoints, p.worldTier, p.job, p.jobCycle]);
export function prestigePlan(p) {
  return { prestige: prestigeCount(p), level: p.level, signature: resetState(p) };
}
export function applyPrestige(p, plan) {
  if (!plan || p.level < PRESTIGE_LEVEL || prestigeCount(p) >= 9999 ||
      plan.prestige !== prestigeCount(p) || plan.level !== p.level || plan.signature !== resetState(p)) return false;
  p.prestige = prestigeCount(p) + 1;
  p.level = 1; p.xp = 0; p.road = 0; p.worldTier = 0; p.waypoints = [0];
  // Every hero's tree is refunded: its level points restart at level 1, its mastery points stay to re-spend.
  for (const k in p.brawlers || {}) if (p.brawlers[k]) p.brawlers[k].tree = { active: 0, sets: [{}, {}, {}] };
  delete p.heroTree;
  p.job = null; p.jobCycle = {};
  return true;
}
// A benchmark ribbon, never a percentage-to-cap (these stats have no common cap).
export function statMilestone(value, thresholds) {
  const v = Number.isFinite(value) ? Math.max(0, value) : 0;
  const rank = thresholds.filter(x => v >= x).length;
  return { rank, name: ['Base', 'Trained', 'Enhanced', 'Elite', 'Ascendant'][rank] || 'Ascendant' };
}
