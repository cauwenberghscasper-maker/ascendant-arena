// Explicit playtest session: separate storage and no production/cloud participation.
export const TEST_PROFILE_TAG = 'xp100-v1';
export function isTestMode(search) { return new URLSearchParams(search).get('test') === '100'; }
export function isTestProfile(p) { return !!p && p.playtest === TEST_PROFILE_TAG; }
export function profileSaveKey(test) { return test ? 'ascendant-arena-playtest-xp100-v1' : 'ascendant-arena-v1'; }
export function prepareTestProfile(p, now = Date.now()) {
  const copy = JSON.parse(JSON.stringify(p));
  copy.playtest = TEST_PROFILE_TAG;
  copy.settings = { ...copy.settings, fastXp: false, autoHunt: false };
  copy.savedAt = now;
  if (copy.vault) copy.vault.t = now;
  return copy;
}
export function testModeUrl(href, test) {
  const url = new URL(href);
  if (test) url.searchParams.set('test', '100'); else url.searchParams.delete('test');
  return url.href;
}
