const CACHE_NAME = "vmctk-library-v7";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./LOGO VMC.png",
  "./LOGO_VMC_white.png",
  "./splash_1024x2048.png"
];

// ✅ Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) =>
        Promise.all(
          ASSETS_TO_CACHE.map((url) =>
            fetch(url).then((response) => {
              if (!response.ok) throw new Error(`Failed to fetch ${url}`);
              return cache.put(url, response);
            })
          )
        )
      )
      .then(() => self.skipWaiting())
      .catch((err) => console.warn("[ServiceWorker] Cache install skipped:", err))
  );
});

// ✅ Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// ✅ Fetch event (with graceful fallback)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.url.includes("googleusercontent") || request.url.includes("raw.githubusercontent"))
    return; // skip caching external files

  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request)
          .then((res) => {
            if (!res || res.status !== 200 || res.type !== "basic") return res;
            const resToCache = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, resToCache));
            return res;
          })
          .catch(() => cached)
      );
    })
  );
});

// ✅ Handle skip waiting (refresh update)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
