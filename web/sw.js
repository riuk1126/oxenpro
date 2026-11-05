// OXEN — funciona sin internet y se actualiza solo
const C = 'oxen-__PD_VERSION__';
const BASE = ['./', 'index.html', 'estilos.css?v=__PD_VERSION__', 'texturas.js?v=__PD_VERSION__', 'simbolos.js?v=__PD_VERSION__', 'app.js?v=__PD_VERSION__', 'manifest.json', 'icono.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(BASE)).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  // primero internet (para recibir mejoras al instante); si no hay, la copia guardada
  e.respondWith(new Promise(res => {
    let listo = false;
    const desdeCache = () => caches.match(r, { ignoreSearch: r.mode === 'navigate' }).then(m => m || caches.match('index.html'));
    const t = setTimeout(() => desdeCache().then(m => { if (m && !listo) { listo = true; res(m); } }), 3500);
    const red = r.mode === 'navigate' ? fetch(r.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(r);
    red.then(resp => {
      clearTimeout(t);
      if (resp.ok) { const cp = resp.clone(); caches.open(C).then(c => c.put(r, cp)); }
      if (!listo) { listo = true; res(resp); }
    }).catch(() => { clearTimeout(t); desdeCache().then(m => { if (!listo) { listo = true; res(m || Response.error()); } }); });
  }));
});
