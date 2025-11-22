
const CACHE_NAME = 'locale-app-v1';

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
          if (cacheName !== CACHE_NAME) {
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
