// ==========================================
// 💾 VMCTK Digital Library - Service Worker
// ==========================================

// 🔢 Change version number each time you update your site
const CACHE_NAME = 'vmctk-library-v3';

// ✅ Core files to cache for offline use
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

// ==========================================
// 🧱 INSTALL EVENT - Cache core files
// ==========================================
self.addEventListener('install', event => {
  console.log('📦 Installing new service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => {
        console.log('✅ Files cached successfully!');
        return self.skipWaiting();
      })
  );
});

// ==========================================
// 🚀 ACTIVATE EVENT - Clean old caches
// ==========================================
self.addEventListener('activate', event => {
  console.log('🚀 Activating new service worker...');
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

  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());

  // Notify all clients that a new version is active
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'UPDATE_AVAILABLE' });
    });
  });
});

// ==========================================
// 🌐 FETCH EVENT - Cache-first strategy
// ==========================================
self.addEventListener('fetch', event => {
  const request = event.request;

  // Ignore chrome-extension or devtools requests
  if (request.url.startsWith('chrome-extension')) return;

  // Use cache-first strategy for static content
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // ✅ Return from cache
      }

      // 🔄 Otherwise fetch from network
      return fetch(request)
        .then(response => {
          // Cache successful GET requests only
          if (response && response.status === 200 && request.method === 'GET') {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => caches.match('./index.html')); // Offline fallback
    })
  );
});

// ==========================================
// 🔄 MESSAGE EVENT - Handle skip waiting
// ==========================================
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏩ Skipping waiting and activating new service worker...');
    self.skipWaiting();
  }
});

// ==========================================
// 📨 CONTROLLERCHANGE - Notify clients for updates
// ==========================================
self.addEventListener('controllerchange', () => {
  console.log('📢 Controller changed! Notifying clients...');
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage({ type: 'UPDATE_AVAILABLE' }));
  });
});
