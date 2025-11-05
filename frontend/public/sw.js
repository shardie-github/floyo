self.addEventListener('install',e=>{self.skipWaiting(); e.waitUntil(caches.open('v1').then(c=>c.addAll(['/','/offline'])));});
self.addEventListener('activate',e=>{clients.claim();});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith((async()=>{ const cache=await caches.open('v1'); const cached=await cache.match(e.request);
    try{ const net=await fetch(e.request); if(net.ok) cache.put(e.request,net.clone()); return net; }
    catch(_){ return cached || caches.match('/offline'); }
  })());
});
