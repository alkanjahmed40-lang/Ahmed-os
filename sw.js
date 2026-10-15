/* AhmadOS v26 progressive web app offline shell (local data only). */
const CACHE = 'ahmados-shell-v26-1';
const RUNTIME = 'ahmados-cdn-v26-1';
const SHELL = ['./','./index.html','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png','./ui-icons.css'];
self.addEventListener('install',event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('ahmados-') && k !== CACHE && k !== RUNTIME).map(k => caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    if (request.mode === 'navigate') {
      event.respondWith(fetch(request).then(res => {
        if (res.ok) { const copy = res.clone(); event.waitUntil(caches.open(CACHE).then(c=>c.put('./index.html',copy))); }
        return res;
      }).catch(() => caches.match('./index.html')));
      return;
    }
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(res => {
      if (res.ok) { const copy=res.clone(); event.waitUntil(caches.open(CACHE).then(c=>c.put(request,copy))); }
      return res;
    })));
    return;
  }
  // Static icon/fonts from trusted CDNs remain available on repeat offline launches.
  if (['fonts.googleapis.com','fonts.gstatic.com','cdn.jsdelivr.net','unpkg.com'].includes(url.hostname)) {
    event.respondWith(caches.open(RUNTIME).then(async cache => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const res = await fetch(request);
      if (res.ok || res.type === 'opaque') cache.put(request,res.clone()).catch(()=>{});
      return res;
    }));
  }
});
