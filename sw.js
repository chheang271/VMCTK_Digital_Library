const CACHE_NAME="vmctk-library-v7";
const ASSETS_TO_CACHE=[
 "./",
 "./index.html",
 "./manifest.json",
 "./LOGO VMC.png",
 "./LOGO_VMC_white.png",
 "./splash_1024x2048.png"
];
self.addEventListener("install",e=>{
 e.waitUntil(
  caches.open(CACHE_NAME)
   .then(cache=>Promise.all(ASSETS_TO_CACHE.map(url=>
     fetch(url).then(res=>{
       if(!res.ok)throw new Error(`Fail ${url}`);
       return cache.put(url,res);
     })
   )))
   .then(()=>self.skipWaiting())
   .catch(err=>console.warn("[SW] Skip cache:",err))
 );
});
self.addEventListener("activate",e=>{
 e.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.map(k=>{
    if(k!==CACHE_NAME)return caches.delete(k);
  })))
 );
 self.clients.claim();
});
self.addEventListener("fetch",e=>{
 const req=e.request;
 if(req.url.includes("googleusercontent")||req.url.includes("raw.githubusercontent"))return;
 e.respondWith(
  caches.match(req).then(cached=>cached||fetch(req).then(r=>{
   if(!r||r.status!==200||r.type!=="basic")return r;
   const copy=r.clone();
   caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
   return r;
  }).catch(()=>cached))
 );
});
self.addEventListener("message",e=>{
 if(e.data&&e.data.type==="SKIP_WAITING")self.skipWaiting();
});
