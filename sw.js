




const CACHE_NAME = 'locale-app-v43';
const MAP_CACHE_NAME = 'locale-map-tiles-v5';

// Files to cache immediately
const PRECACHE_URLS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old app caches but keep the map cache to preserve offline tiles
          if (cacheName !== CACHE_NAME && cacheName !== MAP_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-http requests (e.g. chrome-extension)
  if (!url.protocol.startsWith('http')) return;

  // Map Tiles Strategy: Cache First
  // This specifically handles OpenStreetMap tiles to ensure they are cached separately
  // and persist longer/independently of app updates.
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(MAP_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            // Only cache valid responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            cache.put(event.request, responseToCache);
            return networkResponse;
          }).catch(() => {
             // If offline and not in cache, we can't do much for a specific tile.
             // Leaflet will handle the missing tile visual.
          });
        });
      })
    );
    return;
  }

  // Image Caching Strategy: Cache First, fall back to Network
  // Matches image destinations or common image extensions
  if (event.request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          // Only cache valid responses
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
            // Optional: Return a placeholder image if network fails and not in cache
            // return caches.match('/offline-placeholder.png');
        });
      })
    );
    return;
  }

  // API / Data Strategy: Network Only (Let the app handle offline data via IndexedDB)
  // We specifically avoid caching API calls to ensure data freshness, 
  // as the app uses local DB for persistence.
  // However, we DO want to cache the App Shell (JS/CSS/HTML).
  
  // App Shell Strategy: Stale While Revalidate (or Network First for dev safety)
  // For simplicity and safety in this setup: Network First
  if (event.request.mode === 'navigate' || event.request.destination === 'script' || event.request.destination === 'style') {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }
});

// --- Push Notification Listeners ---

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || 'You have a new update.',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: data.url || '/'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // If a window is already open, focus it.
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // Check if client url matches origin to handle various routes or query params
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window.
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data || '/');
      }
    })
  );
});
