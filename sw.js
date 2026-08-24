const CACHE_NAME = 'rajendra-showroom-cache-v13';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './offline.html',
  './css/style.css',
  './js/icons.js',
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

// Activate event - Clean up old caches immediately
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

// Fetch event - Network-first strategy for fresh code updates
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass cache for external APIs
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first strategy for HTML, CSS, and JS code
  const isCodeAsset = event.request.mode === 'navigate' || 
                      url.pathname.endsWith('.html') || 
                      url.pathname.endsWith('.css') || 
                      url.pathname.endsWith('.js') || 
                      url.pathname === '/';

  if (isCodeAsset) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) return cachedResponse;
              if (event.request.mode === 'navigate') return caches.match('./offline.html');
            });
        })
    );
    return;
  }

  // Cache-first for images / static media
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      });
    })
  );
});
