// Offline cache for the game's models, textures, sounds and the bundled three.js (public site only).
// Cache-first with a background refresh: a returning player loads the world from the phone instead of the network,
// and an updated file is picked up on the visit after it changes. index.html is never cached here.
const CACHE = 'ascendant-assets-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || !/\/(assets|vendor)\//.test(url.pathname)) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req);
    const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; });
    if (hit) { e.waitUntil(net.catch(() => null)); return hit; }
    return net;
  }));
});
