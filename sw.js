// This service worker is designed to unregister itself and clear caches
// to fix issues with "stuck" service workers.

self.addEventListener('install', () => {
  // Skip waiting and immediately become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Unregister all service workers.
      const registrations = await self.registration.navigationPreload.enable();
      if (registrations) {
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // Delete all caches.
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));

      // Force-reload all open clients.
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => {
        if (client.url && 'navigate' in client) {
          client.navigate(client.url);
        }
      });
    })()
  );
});