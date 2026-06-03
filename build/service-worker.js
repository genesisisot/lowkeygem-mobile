// KILL-SWITCH service worker.
// A previous version cached the app shell and kept serving stale builds, so the
// SW is now disabled. Browsers fetch the SW script bypassing the SW cache, so
// when this updated file is detected the new SW installs, deletes every cache,
// unregisters itself, and reloads open tabs — healing any stale client.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (_) { /* ignore */ }
    try {
      await self.registration.unregister();
    } catch (_) { /* ignore */ }
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate(c.url));
  })());
});

// Never intercept fetches — let everything hit the network directly.
