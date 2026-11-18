// OXEN — funciona sin internet y se actualiza solo
const C = 'oxen-1.16.0-75c54ad';
const BASE = ['./', 'index.html', 'estilos.css?v=1.16.0-75c54ad', 'texturas.js?v=1.16.0-75c54ad', 'simbolos.js?v=1.16.0-75c54ad', 'muros.js?v=1.16.0-75c54ad', 'exportar.js?v=1.16.0-75c54ad', 'app.js?v=1.16.0-75c54ad', 'oxen-auth.js?v=1.16.0-75c54ad', 'acceso.js?v=1.16.0-75c54ad', 'equipo.js?v=1.16.0-75c54ad', 'nube.js?v=1.16.0-75c54ad', 'raiki-invitar.js?v=1.16.0-75c54ad', 'manifest.json', 'icono.png', 'icono-192.png', 'flexio.svg'];
// se guardan aparte (sin frenar la instalación) para abrir PDF de fondo sin internet
const EXTRA = ['lib/pdf.min.js', 'lib/pdf.worker.min.js'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(BASE).then(() => c.addAll(EXTRA).catch(() => {}))).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('oxen-') && x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())));
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
