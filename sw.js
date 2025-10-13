// ===============================
// 💾 VMCTK Digital Library Service Worker
// ===============================

// Increment this version when you update your site:
const CACHE_NAME = 'vmctk-library-v2';

// ✅ Core files to always cache
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './books.csv',
  './LOGO VMC.png',
  './LOGO_VMC_white.png',
  './LOGO_192.png',
  './LOGO_512.png'
];

// ===============================
// INSTALL EVENT
// ===============================
self.addEventListener('install', event => {
  console.log('📦 Installing service worker…');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ===============================
// ACTIVATE EVENT
// ===============================
self.addEventListener('activate', event => {
  console.log('🚀 Activating new service worker…');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('🧹 Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ===============================
// FETCH EVENT
// ===============================
self.addEventListener('fetch', event => {
  const request = event.request;

  // Don’t cache Chrome extensions or dev tools
  if (request.url.startsWith('chrome-extension')) return;

  // Use cache-first for same-origin requests
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        // Return cached file
        return cachedResponse;
      }
      // Otherwise fetch from network and cache a copy
      return fetch(request)
        .then(response => {
          // Only cache GET requests & valid responses
          if (
            request.method === 'GET' &&
            response &&
            response.status === 200 &&
            response.type === 'basic'
          ) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback: offline message or cached homepage
          return caches.match('./index.html');
        });
    })
  );
});

// ===============================
// MESSAGE EVENT (manual update trigger)
// ===============================
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
