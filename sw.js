/* Service worker del Analizador de maullidos.
   Sube la versión cada vez que cambies index.html para forzar la actualización. */
const CACHE = 'maullidos-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;

  // La página: primero la red (para recibir cambios), con la caché como respaldo sin conexión.
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req)
        .then(res=>{ const copy = res.clone(); caches.open(CACHE).then(c=>c.put('./index.html', copy)); return res; })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  // El resto: primero la caché.
  e.respondWith(
    caches.match(req).then(hit=>hit || fetch(req).then(res=>{
      if(res.ok && new URL(req.url).origin === location.origin){
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put(req, copy));
      }
      return res;
    }).catch(()=>caches.match(req)))
  );
});
