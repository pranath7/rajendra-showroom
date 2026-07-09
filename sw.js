const CACHE_NAME = 'rajendra-showroom-cache-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './offline.html',
  './css/style.css',
  './js/app.js',
  './js/data.js',
  './js/db.js',
  './js/firebase-config.js',
  './manifest.json',
  './images/logo.png',
  './images/hero.jpg',
  './images/icon-192.png',
  './images/icon-512.png'
];

// Install event - Cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching all static assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Cache strategy
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass cache for external APIs (Firebase, Analytics, Facebook Pixel, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first strategy for HTML pages so changes to layout/products are fresh, falling back to cache
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone response and store in cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If offline, serve from cache, otherwise fallback to offline.html
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match('./offline.html');
            });
        })
    );
    return;
  }

  // Cache-first strategy for static assets (JS, CSS, Images)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then(response => {
          // Don't cache invalid responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Cache dynamically fetched local assets
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });

          return response;
        });
      })
  );
});
