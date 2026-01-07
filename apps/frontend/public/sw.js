// Dev safety net:
// If a stale service worker is registered on localhost:5173 from some other project,
// it can break this app by trying to cache POST requests (Cache.put only supports GET).
//
// This service worker immediately clears caches and unregisters itself.
// It intentionally does NOT implement any caching.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        // ignore
      }

      try {
        await self.registration.unregister();
      } catch {
        // ignore
      }

      // Reload all controlled clients so the app runs without a SW.
      try {
        const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        await Promise.all(clientsList.map((c) => c.navigate(c.url)));
      } catch {
        // ignore
      }
    })(),
  );
});

// No fetch handler on purpose (no caching).


