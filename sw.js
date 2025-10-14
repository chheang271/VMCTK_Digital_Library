const CACHE_NAME = "vmctk-library-v5";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./LOGO_192.png",
  "./LOGO_512.png",
  "./splash_1024x2048.png"
];

// ✅ Install phase — pre-cache essential assets
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing and caching static assets...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// ✅ Activate phase — clean old caches
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating new service worker...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) {
          console.log("[ServiceWorker] Removing old cache:", key);
          return caches.delete(key);
        }
      }))
    )
  );
  return self.clients.claim();
});

// ✅ Fetch phase — serve cached content when offline
self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Don’t cache requests to external domains (like Google Sheets CSV)
  if (!req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(req).then((cacheRes) => {
      return (
        cacheRes ||
        fetch(req)
          .then((fetchRes) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, fetchRes.clone());
              return fetchRes;
            });
          })
          .catch(() => cacheRes)
      );
    })
  );
});

// ✅ Listen for skip waiting command (from index.html)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[ServiceWorker] Skipping waiting...");
    self.skipWaiting();
  }
});

// ✅ Notify clients when a new version is available
self.addEventListener("install", () => {
  self.registration.addEventListener("updatefound", () => {
    const newWorker = self.registration.installing;
    newWorker.addEventListener("statechange", () => {
      if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
        console.log("[ServiceWorker] New version available.");
        self.clients.matchAll({ type: "window" }).then((clients) => {
          clients.forEach((client) =>
            client.postMessage({ type: "UPDATE_AVAILABLE" })
          );
        });
      }
    });
  });
});
