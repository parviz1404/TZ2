/* Rasta Bazaar Service Worker (sw.js) */
const CACHE_NAME = 'rasta-bazaar-v1';
const BASE = self.registration.scope;
const PRECACHE_URLS = ['index.html','manifest.json','icon-192.png','icon-512.png','icon-180.png'].map(p => new URL(p, BASE).toString());
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(PRECACHE_URLS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async()=>{
    const keys=await caches.keys(); await Promise.all(keys.map(k=>k!==CACHE_NAME?caches.delete(k):null));
    await self.clients.claim();
  })());
});
async function networkFirst(req){ try{ const fresh=await fetch(req); const c=await caches.open(CACHE_NAME); c.put(req,fresh.clone()); return fresh; }catch(e){ const cached=await caches.match(req); if(cached) return cached; return caches.match(new URL('index.html', BASE).toString()); } }
async function cacheFirst(req){ const cached=await caches.match(req); if(cached) return cached; const fresh=await fetch(req); const c=await caches.open(CACHE_NAME); c.put(req,fresh.clone()); return fresh; }
self.addEventListener('fetch', (event) => {
  const req=event.request; const url=new URL(req.url);
  if(url.origin!==location.origin) return;
  if(req.mode==='navigate'||(req.headers.get('accept')||'').includes('text/html')){ event.respondWith(networkFirst(req)); return; }
  event.respondWith(cacheFirst(req));
});
