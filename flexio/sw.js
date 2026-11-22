// Flexio — funciona sin internet (en obra, en un levantamiento) y se actualiza solo al volver la señal.
const C = 'flexio-1.0.0-b109d65';
const V = '?v=1.0.0-b109d65';
const BASE = ['./', 'index.html', 'manifest.json', 'icono.png', 'icono-192.png', 'icono.svg', 'logo.svg', 'marca.svg', 'version.json']
  .concat(['estilos.css', 'iconos.js', 'geo.js', 'render.js', 'archivos.js', 'cad.js', 'componentes.js', 'ejemplos.js', 'tutorial.js', 'raiki-auth.js', 'raiki-invitar.js', 'app.js', 'acceso.js'].map(f => f + V));
// lectores de AutoCAD (.dwg) y SketchUp (.skp): se guardan aparte, sin frenar la instalación
const EXTRA = ["lib/dwg/lib/converter/converter.js", "lib/dwg/lib/converter/dwgColorToBackgroundFillColor.js", "lib/dwg/lib/converter/dwgColorToMLeaderRawColor.js", "lib/dwg/lib/converter/entityConverter.js", "lib/dwg/lib/converter/index.js", "lib/dwg/lib/converter/utils.js", "lib/dwg/lib/database/classes/class.js", "lib/dwg/lib/database/classes/index.js", "lib/dwg/lib/database/codepage.js", "lib/dwg/lib/database/common.js", "lib/dwg/lib/database/database.js", "lib/dwg/lib/database/entities/3dface.js", "lib/dwg/lib/database/entities/arc.js", "lib/dwg/lib/database/entities/arcAlignedText.js", "lib/dwg/lib/database/entities/attdef.js", "lib/dwg/lib/database/entities/attrib.js", "lib/dwg/lib/database/entities/circle.js", "lib/dwg/lib/database/entities/dimension.js", "lib/dwg/lib/database/entities/ellipse.js", "lib/dwg/lib/database/entities/entity.js", "lib/dwg/lib/database/entities/hatch.js", "lib/dwg/lib/database/entities/image.js", "lib/dwg/lib/database/entities/index.js", "lib/dwg/lib/database/entities/insert.js", "lib/dwg/lib/database/entities/leader.js", "lib/dwg/lib/database/entities/line.js", "lib/dwg/lib/database/entities/lwpolyline.js", "lib/dwg/lib/database/entities/mline.js", "lib/dwg/lib/database/entities/mtext.js", "lib/dwg/lib/database/entities/multileader.js", "lib/dwg/lib/database/entities/ole2frame.js", "lib/dwg/lib/database/entities/oleframe.js", "lib/dwg/lib/database/entities/point.js", "lib/dwg/lib/database/entities/polyline.js", "lib/dwg/lib/database/entities/proxy.js", "lib/dwg/lib/database/entities/ray.js", "lib/dwg/lib/database/entities/section.js", "lib/dwg/lib/database/entities/shape.js", "lib/dwg/lib/database/entities/solid.js", "lib/dwg/lib/database/entities/solid3d.js", "lib/dwg/lib/database/entities/spline.js", "lib/dwg/lib/database/entities/table.js", "lib/dwg/lib/database/entities/text.js", "lib/dwg/lib/database/entities/tolerance.js", "lib/dwg/lib/database/entities/trace.js", "lib/dwg/lib/database/entities/vertex.js", "lib/dwg/lib/database/entities/viewport.js", "lib/dwg/lib/database/entities/wipeout.js", "lib/dwg/lib/database/entities/xline.js", "lib/dwg/lib/database/header/header.js", "lib/dwg/lib/database/header/index.js", "lib/dwg/lib/database/header/variables.js", "lib/dwg/lib/database/index.js", "lib/dwg/lib/database/objects/common.js", "lib/dwg/lib/database/objects/dictionary.js", "lib/dwg/lib/database/objects/group.js", "lib/dwg/lib/database/objects/imageDef.js", "lib/dwg/lib/database/objects/index.js", "lib/dwg/lib/database/objects/layerFilter.js", "lib/dwg/lib/database/objects/layerIndex.js", "lib/dwg/lib/database/objects/layout.js", "lib/dwg/lib/database/objects/mleaderStyle.js", "lib/dwg/lib/database/objects/plotSetting.js", "lib/dwg/lib/database/objects/spatialFilter.js", "lib/dwg/lib/database/objects/xrecord.js", "lib/dwg/lib/database/shared/index.js", "lib/dwg/lib/database/shared/xdata.js", "lib/dwg/lib/database/tables/appId.js", "lib/dwg/lib/database/tables/blockRecord.js", "lib/dwg/lib/database/tables/dimStyle.js", "lib/dwg/lib/database/tables/index.js", "lib/dwg/lib/database/tables/layer.js", "lib/dwg/lib/database/tables/ltype.js", "lib/dwg/lib/database/tables/style.js", "lib/dwg/lib/database/tables/table.js", "lib/dwg/lib/database/tables/vport.js", "lib/dwg/lib/database/textEscapes.js", "lib/dwg/lib/database/version.js", "lib/dwg/lib/index.js", "lib/dwg/lib/libredwg.js", "lib/dwg/lib/svg/box2d.js", "lib/dwg/lib/svg/bspline.js", "lib/dwg/lib/svg/color.js", "lib/dwg/lib/svg/index.js", "lib/dwg/lib/svg/polyline.js", "lib/dwg/lib/svg/svgConverter.js", "lib/dwg/lib/svg/transformBoundingBoxAndElement.js", "lib/dwg/lib/svg/vector.js", "lib/dwg/lib/types/common.js", "lib/dwg/lib/types/enums.js", "lib/dwg/lib/types/index.js", "lib/dwg/wasm/libredwg-web.js", "lib/dwg/wasm/libredwg-web.wasm", "lib/skp/openskp.js", "lib/skp/openskp.wasm"];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => c.addAll(BASE).then(() => { c.addAll(EXTRA).catch(() => {}); })).catch(() => {}));
});
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(k => Promise.all(k.filter(x => x.startsWith('flexio-') && x !== C).map(x => caches.delete(x))))
  .then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  // primero internet (para recibir mejoras); si no hay o tarda, la copia guardada
  e.respondWith(new Promise(res => {
    let listo = false;
    const desdeCache = () => caches.match(r, { ignoreSearch: r.mode === 'navigate' })
      .then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : null));
    const t = setTimeout(() => desdeCache().then(m => { if (m && !listo) { listo = true; res(m); } }), 3500);
    const red = r.mode === 'navigate' ? fetch(r.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(r);
    red.then(resp => {
      clearTimeout(t);
      if (resp.ok) { const cp = resp.clone(); caches.open(C).then(c => c.put(r, cp)); }
      if (!listo) { listo = true; res(resp); }
    }).catch(() => { clearTimeout(t); desdeCache().then(m => { if (!listo) { listo = true; res(m || Response.error()); } }); });
  }));
});
