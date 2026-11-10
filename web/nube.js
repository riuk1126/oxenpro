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
  function encolar(id) { if (noSubir.delete(id)) guardarNoSubir(); enCola.add(id); correr(); }
  async function correr() {
    if (corriendo || !A.sesion() || !navigator.onLine) return; corriendo = true; pintarEstado();
    try { while (enCola.size) { const id = enCola.values().next().value;
      try { await subir(id); enCola.delete(id); } catch (e) { if (e.red) break; console.error(e); enCola.delete(id); } } }
    finally { corriendo = false; pintarEstado(); }
  }
  addEventListener('online', correr);

  // ---------- ganchos de app.js ----------
  function alCerrar(d) { if (d && A.sesion() && !(noSubir.has(d.id) && !fila(d.id))) encolar(d.id); }
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
    for (const r of locales) { const f = fila(r.id); if (noSubir.has(r.id) && !f) continue; if (!f || (r.fecha || 0) > Date.parse(f.actualizado) + 3000) enCola.add(r.id); }
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
  async function descargar(f, tarjeta, callado) {
    if (tarjeta) tarjeta.classList.add('cargando');
    avisar('Descargando de la nube…');
    try {
      const base = `${f.dueno}/${f.dibujo_id}/${f.version}/`;
      const datos = JSON.parse(await (await A.bajarArchivo(base + 'doc.json', B)).text()), capas = [];
      for (let i = 0; i < (datos.capas || []).length; i++) { let blob = null; try { blob = await A.bajarArchivo(base + 'capa-' + i + '.png', B); } catch (e) {} capas.push(Object.assign({}, datos.capas[i], { blob })); }
      let thumb = null; try { thumb = await A.bajarArchivo(base + 'mini.jpg', B); } catch (e) {}
      await dbPut(Object.assign({}, datos, { id: f.dibujo_id, capas, thumb, fecha: Date.parse(f.actualizado) }));
      if (!callado) { avisar('Listo: ya está en este equipo'); await mostrarGaleria(); }
      return true;
    } catch (e) { avisar(e.red ? 'Necesitas internet para descargarlo' : 'No se pudo descargar'); console.error(e); if (tarjeta) tarjeta.classList.remove('cargando'); return false; }
  }

  // ---------- estado en "Mi cuenta" ----------
  function resumen() {
    const mias = filas.filter(f => f.dueno === yo()), b = mias.reduce((s, f) => s + (+f.bytes || 0), 0);
    return corriendo || enCola.size ? `Respaldando… (${enCola.size} pendiente${enCola.size === 1 ? '' : 's'})` : `${mias.length} boceto${mias.length === 1 ? '' : 's'} respaldado${mias.length === 1 ? '' : 's'}${b ? ' · ' + tam(b) : ''}`;
  }
  function pintarEstado() {
    const e = $('accNube'); if (e) e.textContent = resumen();
    const b = $('btnNube'); if (b) { b.classList.toggle('sincro', corriendo || enCola.size > 0); b.title = 'Nube · ' + resumen(); }
    if ($('nbEstado')) $('nbEstado').textContent = A.sesion() ? resumen() : '';
  }
  async function respaldarTodo() {
    let locales = []; try { locales = await dbTodos(); } catch (e) {}
    for (const r of locales) { noSubir.delete(r.id); enCola.add(r.id); } guardarNoSubir(); pintarEstado(); await correr();
    avisar(enCola.size ? 'Sin internet: se terminará al reconectar' : 'Todos tus bocetos están en la nube');
  }

  // =================================================================
  //  PANTALLA "NUBE" (icono en el inicio): todos tus archivos en la nube y en este equipo
  // =================================================================
  async function pantalla() {
    let P = $('nubeVista');
    if (!P) { P = document.createElement('section'); P.id = 'nubeVista'; P.className = 'nube-vista visor-eq'; document.body.appendChild(P); }
    P.classList.remove('oculto');
    P.innerHTML = `<header><button class="ib" id="nbCerrar" title="Cerrar">✕</button>
      <div class="ve-tit"><b>☁ Nube</b><span id="nbEstado">${A.sesion() ? esc(resumen()) : ''}</span></div>
      <button class="ve-btn" id="nbAbrirArch">Abrir archivo .oxen</button>${A.sesion() ? '<button class="btn-verde" id="nbTodo">Respaldar todo</button>' : ''}</header>
      <div class="nb-cuerpo" id="nbCuerpo"><p class="com-vacio">Cargando…</p></div>`;
    $('nbCerrar').onclick = () => { P.classList.add('oculto'); mostrarGaleria(); };
    $('nbAbrirArch').onclick = () => elegirArchivoOxen();
    if ($('nbTodo')) $('nbTodo').onclick = async () => { await respaldarTodo(); pintarLista(); };
    pintarLista();
  }
  async function pintarLista() {
    const C = $('nbCuerpo'); if (!C) return;
    if (!A.sesion()) { C.innerHTML = '<p class="com-vacio">Entra con tu cuenta para respaldar tus bocetos en la nube. Mientras tanto se guardan en este equipo, y puedes guardar una copia como archivo .oxen.</p>'; return; }
    const ok = await refrescar(); let locales = []; try { locales = await dbTodos(); } catch (e) {}
    const loc = new Map(locales.map(r => [r.id, r])), mias = filas.filter(f => f.dueno === yo());
    const soloAqui = locales.filter(r => !fila(r.id));
    C.innerHTML = (!ok ? '<p class="com-vacio">Sin internet: se muestra lo último que se vio.</p>' : '')
      + `<h2 class="gal-sub">En la nube <small>${mias.length} · ${tam(mias.reduce((s, f) => s + (+f.bytes || 0), 0))}</small></h2>`
      + (mias.length ? `<div class="nb-lista">${mias.map(f => { const l = loc.get(f.dibujo_id), alDia = l && (l.fecha || 0) <= Date.parse(f.actualizado) + 3000;
          return `<div class="nb-fila" data-id="${esc(f.dibujo_id)}"><div class="nb-mini" data-mini="${esc(f.dibujo_id)}"></div>
            <div class="nb-info"><b>${esc(f.nombre || 'Boceto')}</b><small>☁ ${fechaH(f.actualizado)} · ${tam(f.bytes)}</small>
            <span class="nb-est ${l ? (alDia ? 'ok' : 'sube') : 'nube'}">${l ? (alDia ? 'En este equipo y en la nube' : 'Cambios por subir') : 'Solo en la nube'}</span></div>
            <div class="nb-acc"><button class="btn-verde" data-a="abrir">${l ? 'Abrir' : 'Descargar y abrir'}</button>
            <button class="ve-btn" data-a="archivo">Guardar en el dispositivo</button><button class="ve-btn rojo" data-a="quitar">Quitar de la nube</button></div></div>`; }).join('')}</div>`
        : '<p class="com-vacio">Aún no hay bocetos en la nube. Se suben solos cuando sales de un boceto.</p>')
      + (soloAqui.length ? `<h2 class="gal-sub">Solo en este equipo <small>${soloAqui.length} · se subirán en un momento</small></h2><div class="nb-lista">${soloAqui.map(r => `<div class="nb-fila" data-id="${esc(r.id)}"><div class="nb-mini" data-local="${esc(r.id)}"></div>
            <div class="nb-info"><b>${esc(r.nombre || 'Boceto')}</b><small>${fechaH(r.fecha)}</small><span class="nb-est sube">Por subir</span></div>
            <div class="nb-acc"><button class="btn-verde" data-a="subir">Subir ahora</button><button class="ve-btn" data-a="archivo">Guardar en el dispositivo</button></div></div>`).join('')}</div>` : '');
    pintarEstado();
    // miniaturas
    C.querySelectorAll('[data-local]').forEach(el => { const r = loc.get(el.dataset.local); if (r && r.thumb) el.innerHTML = `<img src="${URL.createObjectURL(r.thumb)}" alt="">`; });
    C.querySelectorAll('[data-mini]').forEach(el => { const r = loc.get(el.dataset.mini), f = fila(el.dataset.mini);
      if (r && r.thumb) { el.innerHTML = `<img src="${URL.createObjectURL(r.thumb)}" alt="">`; return; }
      const k = archivosDe(f)[1]; if (!minis.has(k)) minis.set(k, A.bajarArchivo(k, B).then(b => URL.createObjectURL(b)).catch(() => ''));
      minis.get(k).then(u => { if (u) el.innerHTML = `<img src="${u}" alt="">`; }); });
    C.onclick = async ev => {
      const b = ev.target.closest('button[data-a]'); if (!b) return;
      const id = b.closest('.nb-fila').dataset.id, f = fila(id), l = loc.get(id), a = b.dataset.a;
      if (a === 'abrir') { if (!l) { b.disabled = true; if (!await descargar(f, null, true)) { b.disabled = false; return; } } $('nubeVista').classList.add('oculto'); abrirDibujo(id); }
      if (a === 'archivo') { if (!l && !await descargar(f, null, true)) return; guardarArchivoOxen(id); }
      if (a === 'subir') { b.disabled = true; b.textContent = 'Subiendo…'; encolar(id); await esperarCola(); pintarLista(); }
      if (a === 'quitar') confirmar('Quitar de la nube', `“${esc(f.nombre)}” se borra de la nube.${l ? ' La copia de este equipo se queda.' : ' No está en este equipo: se perderá.'}`, 'Quitar', async () => { quitarDeNube(f); pintarLista(); });
    };
  }
  const fechaH = f => new Date(f).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const esperarCola = () => new Promise(r => { const t = setInterval(() => { if (!corriendo && !enCola.size) { clearInterval(t); r(); } }, 300); });
  function quitarDeNube(f) {
    A.tabla('respaldos?dueno=eq.' + encodeURIComponent(f.dueno) + '&dibujo_id=eq.' + encodeURIComponent(f.dibujo_id), 'DELETE').catch(() => {});
    A.borrarArchivos(archivosDe(f), B).catch(() => {});
    filas = filas.filter(x => x !== f); guardarLista(); noSubir.add(f.dibujo_id); guardarNoSubir();
  }
  // bocetos que el usuario quitó de la nube a propósito: no se vuelven a subir solos (hasta que los suba él)
  const noSubir = new Set((() => { try { return JSON.parse(localStorage.getItem(K + '-no') || '[]'); } catch (e) { return []; } })());
  const guardarNoSubir = () => { try { localStorage.setItem(K + '-no', JSON.stringify([...noSubir])); } catch (e) {} };

  // =================================================================
  //  ARCHIVO .oxen EN EL DISPOSITIVO (un zip con el boceto completo)
  // =================================================================
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u8 => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function zip(archivos) { // [{ nombre, datos: Uint8Array }] sin comprimir (los PNG ya vienen comprimidos)
    const enc = new TextEncoder(), partes = [], central = []; let off = 0;
    for (const a of archivos) {
      const n = enc.encode(a.nombre), c = crc32(a.datos), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(8, 0, true); h.setUint32(14, c, true); h.setUint32(18, a.datos.length, true); h.setUint32(22, a.datos.length, true); h.setUint16(26, n.length, true);
      partes.push(new Uint8Array(h.buffer), n, a.datos);
      const d = new DataView(new ArrayBuffer(46)); d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint32(16, c, true); d.setUint32(20, a.datos.length, true); d.setUint32(24, a.datos.length, true); d.setUint16(28, n.length, true); d.setUint32(42, off, true);
      central.push(new Uint8Array(d.buffer), n); off += 30 + n.length + a.datos.length;
    }
    const tc = central.reduce((s, x) => s + x.length, 0), f = new DataView(new ArrayBuffer(22));
    f.setUint32(0, 0x06054b50, true); f.setUint16(8, archivos.length, true); f.setUint16(10, archivos.length, true); f.setUint32(12, tc, true); f.setUint32(16, off, true);
    return new Blob([...partes, ...central, new Uint8Array(f.buffer)], { type: 'application/octet-stream' });
  }
  async function guardarArchivoOxen(id) {
    const r = await dbUno(id); if (!r) return;
    const { capas, thumb, ...resto } = r, u8 = async b => new Uint8Array(await b.arrayBuffer());
    const arch = [{ nombre: 'oxen.json', datos: new TextEncoder().encode(JSON.stringify(Object.assign({ formato: 'oxen', v: 1 }, resto, { capas: capas.map(({ blob, ...c }) => c) }))) }];
    for (let i = 0; i < capas.length; i++) if (capas[i].blob) arch.push({ nombre: 'capa-' + i + '.png', datos: await u8(capas[i].blob) });
    if (thumb) arch.push({ nombre: 'mini.jpg', datos: await u8(thumb) });
    const nombre = (r.nombre || 'Boceto').replace(/[^\w\- áéíóúñÁÉÍÓÚÑ]/g, '').trim().replace(/\s+/g, '_') + '.oxen';
    await entregarArchivo(zip(arch), nombre);
    avisar('Copia guardada como ' + nombre + ' · se abre desde ☁ Nube → Abrir archivo .oxen');
  }
  function elegirArchivoOxen() {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '.oxen,application/zip,application/octet-stream';
    i.onchange = () => { const f = i.files[0]; if (f) abrirArchivoOxen(f); }; i.click();
  }
  async function abrirArchivoOxen(f) {
    try {
      const z = leerZip(await f.arrayBuffer()), de = n => z.ent.find(e => e.nombre === n);
      if (!de('oxen.json')) throw new Error('no es oxen');
      const datos = JSON.parse(new TextDecoder().decode(await z.leer(de('oxen.json')))), capas = [];
      for (let i = 0; i < (datos.capas || []).length; i++) { const e = de('capa-' + i + '.png'); capas.push(Object.assign({}, datos.capas[i], { blob: e ? new Blob([await z.leer(e)], { type: 'image/png' }) : null })); }
      const m = de('mini.jpg'), thumb = m ? new Blob([await z.leer(m)], { type: 'image/jpeg' }) : null;
      const ya = await dbUno(datos.id), id = ya ? nuevoId() : datos.id; // si ya existe aquí, entra como copia
      delete datos.formato; delete datos.v;
      await dbPut(Object.assign(datos, { id, capas, thumb, fecha: Date.now(), nombre: ya ? (datos.nombre || 'Boceto') + ' (archivo)' : datos.nombre }));
      avisar('Boceto abierto desde el archivo'); if ($('nubeVista')) $('nubeVista').classList.add('oculto'); await mostrarGaleria(); abrirDibujo(id);
    } catch (e) { console.error(e); avisar('Ese archivo no es un boceto de OXEN PRO (.oxen)'); }
  }

  const estaEnNube = id => !!fila(id);
  window.Nube = { estaEnNube, alCerrar, alBorrar, alRenombrar, alPintarGaleria, respaldarTodo, resumen, refrescar, pintarEstado, pantalla, guardarArchivoOxen, abrirArchivoOxen };
})();
