// Generated menu paintings. Gameplay keeps its existing 3D models.
// The rarity frames and labels distinguish tiers; each shape has one cached file.
const shapes = {
  weapon: ['edge', 'fang', 'focus'], helmet: ['cap', 'helm', 'hood'],
  chest: ['vest', 'plate', 'robe'], boots: ['boots', 'treads', 'striders'],
  accessory: ['charm', 'ring', 'amulet'],
};
const cases = new Set(['milestone', 'rift', 'boss', 'treasure', 'hunter']);
const regionalCases = new Set(['frost', 'ember', 'celestial']);
const base = 'assets/ui/premium-v2/';

export function equipmentIcon(slot, noun) {
  const shape = String(noun || '').toLowerCase();
  return shapes[slot]?.includes(shape) ? `${base}${slot}-${shape}.webp` : '';
}
export function caseIcon(key) {
  if (regionalCases.has(key)) return `assets/ui/collection-v1/case-${key}.webp`;
  return cases.has(key) ? `${base}case-${key}.webp` : '';
}
