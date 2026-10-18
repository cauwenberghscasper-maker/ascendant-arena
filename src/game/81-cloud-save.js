// --- cloud save: a private copy of your progress in this artifact's database ---
// Lives under data/users/<your id>/save (only you can read it). Local storage stays as a fast cache.
const Cloud = { doc: null, state: 'connecting', lastPush: 0, pushing: false, pending: false, kind: '' };
// Outside Claude (own website / app) the save goes to the game's free Supabase project instead.
// Each device gets a random id + secret; the server keeps only a hash of the secret and refuses older saves.
const SUPA = { url: 'https://chugmnylenjierrrkmov.supabase.co', key: 'sb_publishable_otZgKbNkWvDerOd_gXE_1A_hXCzqkYe' };
function supaDevice() {
  let d = null; try { d = JSON.parse(localStorage.getItem('ascendant-arena-device') || 'null'); } catch (e) { d = null; }
  if (!d || !d.id || !d.secret) {
    const b = new Uint8Array(32); crypto.getRandomValues(b);
    d = { id: crypto.randomUUID(), secret: Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('') };
    try { localStorage.setItem('ascendant-arena-device', JSON.stringify(d)); } catch (e) { /* private mode: cloud still works this session */ }
  }
  return d;
}
async function supaRpc(fn, args) {
  const r = await fetch(`${SUPA.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: SUPA.key, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  if (!r.ok) throw { code: 'http_' + r.status };
  return r.json();
}
// same shape as the Claude db document the rest of the save code uses: get() -> {exists, data()}, set({profile, savedAt})
function supaDoc(dev) {
  return {
    async get() { const r = await supaRpc('load_profile', { p_id: dev.id, p_secret: dev.secret }); return { exists: !!r, data: () => (r ? { profile: JSON.stringify(r.profile), savedAt: r.saved_at } : null) }; },
    async set(d) { return supaRpc('save_profile', { p_id: dev.id, p_secret: dev.secret, p_profile: JSON.parse(d.profile), p_saved_at: d.savedAt }); },
  };
}
function saveNow(force) {
  const p = G.profile; p.savedAt = Date.now();
  const localSaved = Store.save(p);
  if (localSaved === false && !G.localSaveFailed) toast('Device save unavailable. Keep this session open and export a backup in Settings.', 'bad');
  G.localSaveFailed = localSaved === false;
  if (TEST_MODE || isTestProfile(p)) return;
  if (!Cloud.doc || Cloud.state === 'readonly') return;
  if (Cloud.pushing) { Cloud.pending = true; G.dirty = true; return; }
  if (!force && Date.now() - Cloud.lastPush < 8000) { G.dirty = true; return; }
  Cloud.pushing = true; Cloud.lastPush = Date.now();
  Cloud.doc.set({ profile: JSON.stringify(p), savedAt: p.savedAt, level: p.level })
    .then(() => { Cloud.state = 'on'; })
    .catch((e) => { if (e && (e.code === 'invalid_argument' || e.code === 'revoked' || e.code === 'not_granted')) Cloud.state = 'readonly'; else G.dirty = true; })
    .finally(() => { Cloud.pushing = false; if (Cloud.pending) { Cloud.pending = false; saveNow(true); } });
}
function applyProfile(prof, note) {
  if (!TEST_MODE && isTestProfile(prof)) return;
  G.profile = prof;
  refreshPlayerStats(true);
  Sfx.applyVolumes();
  applyUiSize();
  setMap(prof.settings.map !== false);
  G.zoneIdx = zoneAt(G.player.z);
  if (!G.started) $('playBtn').textContent = prof.level > 1 || prof.stats.jobs > 0 ? `Continue · Level ${prof.level}` : 'PLAY';
  if (note) toast(note, 'good');
}
async function cloudInit() {
  if (LOCAL_PREVIEW || TEST_MODE) { Cloud.state = 'off'; return; } // test profiles never reach production saves
  try {
    const c = window.claude;
    if (!c || typeof c.use !== 'function') {
      if (typeof fetch !== 'function' || !window.crypto || !crypto.randomUUID) { Cloud.state = 'off'; return; }
      Cloud.kind = 'supa'; Cloud.doc = supaDoc(supaDevice());
    } else {
      const [db, user] = await Promise.all([c.use('db'), c.use('user')]);
      if (!db || !user) { Cloud.state = 'off'; return; }
      const uid = await user.id();
      if (!uid) { Cloud.state = 'off'; return; }
      Cloud.kind = 'claude'; Cloud.doc = db.doc('data/users/' + uid + '/save');
    }
    let snap;
    try { snap = await Cloud.doc.get(); } catch (e) { await new Promise((r) => setTimeout(r, 600 + Math.random() * 600)); snap = await Cloud.doc.get(); }
    Cloud.state = 'on';
    const d = snap.exists ? snap.data() : null;
    if (d && typeof d.profile === 'string') {
      let remote = null; try { const raw = JSON.parse(d.profile); if (!isTestProfile(raw)) remote = sanitizeProfile(raw); } catch (e) { remote = null; }
      const local = G.profile, localFresh = local.level <= 1 && !local.stats.jobs && !local.stats.kills;
      if (remote && (remote.savedAt || 0) > (local.savedAt || 0)) {
        if (!G.started || (localFresh && !local.savedAt && !G.dirty)) applyProfile(remote, G.started ? `Cloud save loaded · level ${remote.level}` : null);
      }
    } else saveNow(true); // first visit: create your cloud save
  } catch (e) { Cloud.state = 'off'; }
}
