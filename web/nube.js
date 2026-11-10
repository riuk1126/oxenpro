// OXEN PRO — Nube: cada boceto se respalda en la cuenta (Supabase) y se puede recuperar en otro equipo.
// · Al salir de un boceto se sube su última versión (por detrás, sin esperar).
// · Al abrir la galería se suben los que falten o estén más nuevos en la tableta.
// · En la galería, "En la nube" muestra los que no están en este equipo: un toque los descarga.
// Carpeta privada en el depósito "respaldos": correo/boceto/versión/archivo (solo el dueño la ve).
(function () {
  const A = window.OxenAuth, B = 'respaldos', K = 'oxen-nube';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const yo = () => ((A.sesion() || {}).email || '').toLowerCase();
  let filas = (() => { try { return JSON.parse(localStorage.getItem(K) || '[]'); } catch (e) { return []; } })();
  const guardarLista = () => { try { localStorage.setItem(K, JSON.stringify(filas)); } catch (e) {} };
  const fila = id => filas.find(f => f.dibujo_id === id && f.dueno === yo());

  async function refrescar() {
    if (!A.sesion()) return false;
    try { filas = (await A.tabla('respaldos?select=*&order=actualizado.desc')) || []; guardarLista(); return true; } catch (e) { return false; }
  }

  // ---------- subir ----------
  const enCola = new Set(); let corriendo = false;
  async function subir(id) {
    const r = await dbUno(id); if (!r) return;
    const dueno = yo(), v = Date.now().toString(36), base = `${dueno}/${id}/${v}/`, previo = fila(id);
    const { capas, thumb, ...resto } = r; let bytes = 0;
    const datos = Object.assign({}, resto, { capas: capas.map(({ blob, ...c }) => c) }), json = new Blob([JSON.stringify(datos)], { type: 'application/json' });
    await A.subirArchivo(base + 'doc.json', json, 'application/json', B); bytes += json.size;
    for (let i = 0; i < capas.length; i++) if (capas[i].blob) { await A.subirArchivo(base + 'capa-' + i + '.png', capas[i].blob, 'image/png', B); bytes += capas[i].blob.size; }
    if (thumb) { await A.subirArchivo(base + 'mini.jpg', thumb, 'image/jpeg', B); bytes += thumb.size; }
    const nueva = await A.tabla('respaldos?on_conflict=dueno,dibujo_id', 'POST',
      { dueno, dibujo_id: id, nombre: r.nombre, tipo: r.tipo || null, w: r.w, h: r.h, capas: capas.length, version: v, bytes, actualizado: new Date(Math.max(Date.now(), r.fecha || 0)).toISOString() },
      'resolution=merge-duplicates');
    if (previo && previo.version !== v) A.borrarArchivos(archivosDe(previo), B).catch(() => {});
    filas = filas.filter(f => !(f.dibujo_id === id && f.dueno === dueno)).concat(nueva && nueva[0] ? nueva[0] : []); guardarLista();
  }
  function archivosDe(f) {
    const b = `${f.dueno}/${f.dibujo_id}/${f.version}/`, l = [b + 'doc.json', b + 'mini.jpg'];
    for (let i = 0; i < (f.capas || 0); i++) l.push(b + 'capa-' + i + '.png'); return l;
  }
  function encolar(id) { enCola.add(id); correr(); }
  async function correr() {
    if (corriendo || !A.sesion() || !navigator.onLine) return; corriendo = true; pintarEstado();
    try { while (enCola.size) { const id = enCola.values().next().value;
      try { await subir(id); enCola.delete(id); } catch (e) { if (e.red) break; console.error(e); enCola.delete(id); } } }
    finally { corriendo = false; pintarEstado(); }
  }
  addEventListener('online', correr);

  // ---------- ganchos de app.js ----------
  function alCerrar(d) { if (d && A.sesion()) encolar(d.id); }
  function alBorrar(id) {
    enCola.delete(id); const f = fila(id); if (!f || !A.sesion()) return;
    A.tabla('respaldos?dueno=eq.' + encodeURIComponent(f.dueno) + '&dibujo_id=eq.' + encodeURIComponent(id), 'DELETE').catch(() => {});
    A.borrarArchivos(archivosDe(f), B).catch(() => {});
    filas = filas.filter(x => x !== f); guardarLista();
  }
  function alRenombrar(r) { const f = fila(r.id); if (!f) return; f.nombre = r.nombre; guardarLista();
    A.tabla('respaldos?dueno=eq.' + encodeURIComponent(f.dueno) + '&dibujo_id=eq.' + encodeURIComponent(r.id), 'PATCH', { nombre: r.nombre }).catch(() => {}); }

  // ---------- galería ----------
  async function alPintarGaleria() {
    if (!A.sesion()) return;
    await refrescar();
    let locales = []; try { locales = await dbTodos(); } catch (e) {}
    // respaldar lo que falte o esté más nuevo aquí
    for (const r of locales) { const f = fila(r.id); if (!f || (r.fecha || 0) > Date.parse(f.actualizado) + 3000) enCola.add(r.id); }
    correr();
    pintarSeccion(new Set(locales.map(r => r.id)));
  }
  const minis = new Map();
  function pintarSeccion(locales) {
    let sec = $('galNube');
    const solo = filas.filter(f => f.dueno === yo() && !locales.has(f.dibujo_id));
    if (!solo.length) { if (sec) sec.remove(); return; }
    if ($('galeria').classList.contains('oculto')) return;
    if (!sec) { sec = document.createElement('div'); sec.id = 'galNube'; sec.className = 'gal-equipo'; $('galVacia').insertAdjacentElement('afterend', sec); }
    sec.innerHTML = `<h2 class="gal-sub">En la nube <small>(no están en este equipo · toca para descargar)</small></h2><div class="gal-grid"></div>`;
    const g = sec.querySelector('.gal-grid');
    for (const f of solo) {
      const t = document.createElement('div'); t.className = 'tarjeta';
      t.innerHTML = `<button class="mini"><span class="t-carga"></span></button><div class="t-nom">${esc(f.nombre || 'Boceto')}</div>
        <div class="t-fecha">☁ ${new Date(f.actualizado).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })} · ${tam(f.bytes)}</div>`;
      t.querySelector('.mini').onclick = () => descargar(f, t);
      g.appendChild(t);
      const k = archivosDe(f)[1];
      if (!minis.has(k)) minis.set(k, A.bajarArchivo(k, B).then(b => URL.createObjectURL(b)).catch(() => ''));
      minis.get(k).then(u => { if (u) t.querySelector('.mini').innerHTML = `<img src="${u}" alt="">`; });
    }
  }
  const tam = b => !b ? '' : b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  async function descargar(f, tarjeta) {
    if (tarjeta) tarjeta.classList.add('cargando');
    avisar('Descargando de la nube…');
    try {
      const base = `${f.dueno}/${f.dibujo_id}/${f.version}/`;
      const datos = JSON.parse(await (await A.bajarArchivo(base + 'doc.json', B)).text()), capas = [];
      for (let i = 0; i < (datos.capas || []).length; i++) { let blob = null; try { blob = await A.bajarArchivo(base + 'capa-' + i + '.png', B); } catch (e) {} capas.push(Object.assign({}, datos.capas[i], { blob })); }
      let thumb = null; try { thumb = await A.bajarArchivo(base + 'mini.jpg', B); } catch (e) {}
      await dbPut(Object.assign({}, datos, { id: f.dibujo_id, capas, thumb, fecha: Date.parse(f.actualizado) }));
      avisar('Listo: ya está en este equipo'); await mostrarGaleria();
    } catch (e) { avisar(e.red ? 'Necesitas internet para descargarlo' : 'No se pudo descargar'); console.error(e); if (tarjeta) tarjeta.classList.remove('cargando'); }
  }

  // ---------- estado en "Mi cuenta" ----------
  function resumen() {
    const mias = filas.filter(f => f.dueno === yo()), b = mias.reduce((s, f) => s + (+f.bytes || 0), 0);
    return corriendo || enCola.size ? `Respaldando… (${enCola.size} pendiente${enCola.size === 1 ? '' : 's'})` : `${mias.length} boceto${mias.length === 1 ? '' : 's'} respaldado${mias.length === 1 ? '' : 's'}${b ? ' · ' + tam(b) : ''}`;
  }
  function pintarEstado() { const e = $('accNube'); if (e) e.textContent = resumen(); }
  async function respaldarTodo() {
    let locales = []; try { locales = await dbTodos(); } catch (e) {}
    for (const r of locales) enCola.add(r.id); pintarEstado(); await correr();
    avisar(enCola.size ? 'Sin internet: se terminará al reconectar' : 'Todos tus bocetos están en la nube');
  }

  window.Nube = { alCerrar, alBorrar, alRenombrar, alPintarGaleria, respaldarTodo, resumen, refrescar, pintarEstado };
})();
