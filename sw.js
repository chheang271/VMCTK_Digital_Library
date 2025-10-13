const CACHE_NAME = 'vmctk-library-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './books.csv',
  './LOGO VMC.png',
  './LOGO_VMC_white.png'
];

// ✅ Install Service Worker and Cache Core Files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// ✅ Activate and Clean Old Caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ✅ Fetch Cached Files Offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => 
      response || fetch(event.request)
    )
  );
});
