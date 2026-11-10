// OXEN PRO — Mi equipo y bocetos compartidos.
// · El dueño de un plan con equipo agrega personas por correo (entran con su plan).
// · El dueño marca bocetos para compartir; al salir del boceto se sube la última versión.
// · El equipo los ve en la galería ("Compartidos por mi equipo"): ver con zoom, exportar o copiar.
// Usa funciones de app.js (dbUno, dbPut, componer, aBlob, avisar, modal, confirmar, escapar,
// nuevoId, abrirDibujo, mostrarGaleria, entregarArchivo, doc) y de acceso.js (OxenAcceso).
(function () {
  const A = window.OxenAuth;
  const APK = 'https://github.com/riuk1126/oxenpro/releases/latest/download/OXEN-PRO.apk';
  const K_LISTA = 'oxen-compartidos', K_EQ = 'oxen-mi-equipo';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const leer = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const yo = () => ((A.sesion() || {}).email || '').toLowerCase();
  const hace = f => {
    const s = (Date.now() - new Date(f)) / 1000;
    if (s < 90) return 'hace un momento'; if (s < 3600) return 'hace ' + Math.round(s / 60) + ' min';
    if (s < 86400) return 'hace ' + Math.round(s / 3600) + ' h';
    return new Date(f).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  };

  let lista = leer(K_LISTA) || [];           // compartidos visibles para mí (míos y de mi equipo)
  let equipo = leer(K_EQ) || null;           // { max, miembros, dueno, dueno_nombre }
  const esMio = c => c.dueno === yo();
  const compartidoMio = id => lista.find(c => esMio(c) && c.dibujo_id === id);
  const puedoCompartir = () => !!(equipo && equipo.max > 0);

  async function refrescar() {
    if (!A.sesion()) return;
    try {
      const [l, e] = await Promise.all([A.tabla('compartidos?select=*&order=actualizado.desc'), A.rpc('mi_equipo')]);
      lista = l || []; equipo = e || null; escribir(K_LISTA, lista); escribir(K_EQ, equipo);
    } catch (e) { /* sin internet: se usa lo último que se vio */ }
  }

  // =================================================================
  //  SUBIR (dueño)
  // =================================================================
  const subiendo = new Set();
  // Toma la foto completa del boceto abierto (con cotas y anotaciones) y sube todo.
  async function subirAbierto(d, para) {
    if (!d || subiendo.has(d.id)) return;
    subiendo.add(d.id);
    try {
      const vista = await aBlob(componer(1, d), 'image/jpeg', 0.9);  // se compone ya, mientras el boceto sigue abierto
      await subir(d.id, vista, para);
    } finally { subiendo.delete(d.id); }
  }
  async function subir(id, vista, para) {
    const r = await dbUno(id); if (!r) return;
    const dueno = yo(), v = Date.now().toString(36), base = `${dueno}/${id}/${v}/`;
    const previo = compartidoMio(id);
    if (para === undefined) para = previo ? previo.para || null : null;
    const { capas, thumb, ...resto } = r;
    const datos = Object.assign({}, resto, { capas: capas.map(({ blob, ...c }) => c) });
    await A.subirArchivo(base + 'doc.json', new Blob([JSON.stringify(datos)], { type: 'application/json' }), 'application/json');
    for (let i = 0; i < capas.length; i++) if (capas[i].blob) await A.subirArchivo(base + 'capa-' + i + '.png', capas[i].blob, 'image/png');
    if (thumb) await A.subirArchivo(base + 'mini.jpg', thumb, 'image/jpeg');
    await A.subirArchivo(base + 'vista.jpg', vista, 'image/jpeg');
    const fila = await A.tabla('compartidos?on_conflict=dueno,dibujo_id', 'POST',
      { dueno, dibujo_id: id, nombre: r.nombre, tipo: r.tipo || null, w: r.w, h: r.h, capas: capas.length, version: v, actualizado: new Date().toISOString(), para },
      'resolution=merge-duplicates');
    // borra la versión anterior para no ocupar espacio
    if (previo && previo.version !== v) {
      const viejos = [`${dueno}/${id}/${previo.version}/doc.json`, `${dueno}/${id}/${previo.version}/mini.jpg`, `${dueno}/${id}/${previo.version}/vista.jpg`];
      for (let i = 0; i < (previo.capas || 0); i++) viejos.push(`${dueno}/${id}/${previo.version}/capa-${i}.png`);
      A.borrarArchivos(viejos).catch(() => {});
    }
    lista = lista.filter(c => !(esMio(c) && c.dibujo_id === id)).concat(fila && fila[0] ? fila[0] : []);
    escribir(K_LISTA, lista);
  }
  async function dejarDeCompartir(id) {
    const c = compartidoMio(id); if (!c) return;
    await A.tabla('compartidos?dueno=eq.' + encodeURIComponent(c.dueno) + '&dibujo_id=eq.' + encodeURIComponent(id), 'DELETE');
    const viejos = [`${c.dueno}/${id}/${c.version}/doc.json`, `${c.dueno}/${id}/${c.version}/mini.jpg`, `${c.dueno}/${id}/${c.version}/vista.jpg`];
    for (let i = 0; i < (c.capas || 0); i++) viejos.push(`${c.dueno}/${id}/${c.version}/capa-${i}.png`);
    A.borrarArchivos(viejos).catch(() => {});
    lista = lista.filter(x => x !== c); escribir(K_LISTA, lista);
  }

  // Ganchos que llama app.js
  const pendientes = new Map(); // id -> vista (si falló la subida, se reintenta al volver internet)
  function alCerrar(d) {
    if (!d || !compartidoMio(d.id)) return;
    const vista = aBlob(componer(1, d), 'image/jpeg', 0.9);  // foto ahora; la subida sigue por detrás
    vista.then(v => subir(d.id, v).then(() => { pendientes.delete(d.id); avisar('Tu equipo ya ve la última versión'); })
      .catch(e => { pendientes.set(d.id, v); if (!e.red) console.error(e); avisar(e.red ? 'Sin internet: se compartirá al reconectar' : 'No se pudo actualizar para tu equipo'); }));
  }
  addEventListener('online', () => { for (const [id, v] of pendientes) subir(id, v).then(() => pendientes.delete(id)).catch(() => {}); });
  function alBorrar(id) { if (compartidoMio(id)) dejarDeCompartir(id).catch(() => {}); }
  function alRenombrar(r) {
    const c = compartidoMio(r.id); if (!c) return;
    c.nombre = r.nombre; escribir(K_LISTA, lista);
    A.tabla('compartidos?dueno=eq.' + encodeURIComponent(c.dueno) + '&dibujo_id=eq.' + encodeURIComponent(r.id), 'PATCH', { nombre: r.nombre }).catch(() => {});
  }

  // Opción en el menu ⋯ de cada boceto
  // nombre corto de una persona (lo que va antes de la @)
  const corto = m => { const n = String(m || '').split('@')[0].replace(/[._-]+/g, ' ').trim(); return n ? n[0].toUpperCase() + n.slice(1) : m; };
  const textoPara = c => !c.para ? 'Todo el equipo' : c.para.length ? c.para.map(corto).join(', ') : 'Nadie';
  function itemMenu(r) {
    if (!puedoCompartir()) return '';
    const c = compartidoMio(r.id);
    return c
      ? `<button class="item" id="tEqSi">Compartir con…<small class="item-sub">Ahora: ${esc(textoPara(c))}</small></button><button class="item" id="tEqNo">Dejar de compartir</button>`
      : '<button class="item" id="tEqSi">Compartir con…</button>';
  }
  // elegir a qué personas del equipo se asigna el boceto
  function elegirPersonas(r) {
    const miembros = (equipo && equipo.miembros || []).map(m => m.email), c = compartidoMio(r.id);
    if (!miembros.length) return modal(`<h3>Compartir “${esc(r.nombre)}”</h3>
      <p>Aún no tienes personas en tu equipo. Agrega a los arquitectos o ayudantes que harán levantamientos y luego eliges con quién compartir cada boceto.</p>
      <div class="modal-btns"><span style="flex:1"></span><button id="mNo">Ahora no</button><button class="ok" id="mSi">Agregar personas</button></div>`, cerrar => {
      $('mNo').onclick = cerrar; $('mSi').onclick = () => { cerrar(); pantalla(); };
    });
    const marcados = new Set(c ? (c.para || miembros) : []);
    modal(`<h3>Compartir “${esc(r.nombre)}”</h3>
      <p>Elige quiénes del equipo lo verán. Cada vez que sales del boceto reciben la última versión.</p>
      <label class="interruptor eq-todos"><input type="checkbox" id="eqTodos"><span></span><b>Todo el equipo</b></label>
      <div class="eq-pers">${miembros.map(m => `<label class="interruptor"><input type="checkbox" data-m="${esc(m)}" ${marcados.has(m) ? 'checked' : ''}><span></span><div class="eq-pn"><b>${esc(corto(m))}</b><small>${esc(m)}</small></div></label>`).join('')}</div>
      <div class="modal-btns"><span style="flex:1"></span><button id="mNo">Cancelar</button><button class="ok" id="mSi">${c ? 'Guardar' : 'Compartir'}</button></div>`, cerrar => {
      const cajas = [...document.querySelectorAll('.eq-pers input')], todos = $('eqTodos');
      const sync = () => { todos.checked = cajas.every(x => x.checked); };
      sync(); todos.onchange = () => cajas.forEach(x => { x.checked = todos.checked; });
      cajas.forEach(x => x.onchange = sync);
      $('mNo').onclick = cerrar;
      $('mSi').onclick = async () => {
        const elegidos = cajas.filter(x => x.checked).map(x => x.dataset.m);
        if (!elegidos.length) return avisar(c ? 'Elige al menos una persona (o usa “Dejar de compartir”)' : 'Elige al menos una persona');
        // todos marcados = todo el equipo (incluye a quienes agregues después)
        const para = elegidos.length === miembros.length ? null : elegidos;
        cerrar();
        try {
          if (c) { // ya compartido: solo cambia a quiénes
            await A.tabla('compartidos?dueno=eq.' + encodeURIComponent(c.dueno) + '&dibujo_id=eq.' + encodeURIComponent(r.id), 'PATCH', { para });
            c.para = para; escribir(K_LISTA, lista); pintarGaleria();
            avisar('Ahora lo ven: ' + textoPara(c));
          } else {
            avisar('Abriendo y compartiendo…');
            await abrirDibujo(r.id);
            await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
            await subirAbierto(doc, para);
            avisar('Compartido con ' + textoPara({ para }) + '. Se actualiza cada vez que sales del boceto.');
          }
        } catch (e) { avisar(e.red ? 'Necesitas internet para compartir' : 'No se pudo compartir'); console.error(e); }
      };
    });
  }
  function enlazarMenu(r, cerrar) {
    const si = $('tEqSi'), no = $('tEqNo');
    if (si) si.onclick = () => { cerrar(); setTimeout(() => elegirPersonas(r), 30); };
    if (no) no.onclick = () => {
      cerrar();
      confirmar('Dejar de compartir', `Tu equipo ya no verá “${esc(r.nombre)}”. Tu boceto no se borra.`, 'Dejar de compartir', async () => {
        try { await dejarDeCompartir(r.id); avisar('Ya no se comparte'); pintarGaleria(); }
        catch (e) { avisar(e.red ? 'Necesitas internet' : 'No se pudo cambiar'); }
      });
    };
  }

  // =================================================================
  //  GALERÍA: insignia en mis bocetos y sección del equipo
  // =================================================================
  const minis = new Map(); // `${dueno}/${id}/${version}` -> objectURL
  async function urlMini(c) {
    const k = `${c.dueno}/${c.dibujo_id}/${c.version}`;
    if (!minis.has(k)) minis.set(k, A.bajarArchivo(k + '/mini.jpg').then(b => URL.createObjectURL(b)).catch(() => ''));
    return minis.get(k);
  }
  function pintarGaleria() {
    // insignia en los bocetos que comparto
    document.querySelectorAll('#galGrid .tarjeta').forEach(t => {
      const ya = t.querySelector('.t-eq'), mio = compartidoMio(t.dataset.id);
      if (mio && !ya) { const s = document.createElement('span'); s.className = 't-eq'; s.textContent = 'Compartido'; t.appendChild(s); }
      if (!mio && ya) ya.remove();
      let pp = t.querySelector('.t-para');
      if (mio) { if (!pp) { pp = document.createElement('div'); pp.className = 't-para'; t.querySelector('.t-fecha').insertAdjacentElement('afterend', pp); }
        pp.textContent = 'Con: ' + textoPara(mio); pp.title = mio.para ? mio.para.join(', ') : 'Todo el equipo'; }
      else if (pp) pp.remove();
    });
    // sección con lo que comparten los demás
    let sec = $('galEquipo');
    const ajenos = lista.filter(c => !esMio(c));
    if (!ajenos.length) { if (sec) sec.remove(); return; }
    if (!sec) {
      sec = document.createElement('div'); sec.id = 'galEquipo'; sec.className = 'gal-equipo';
      $('galVacia').insertAdjacentElement('afterend', sec);
    }
    const nombreDueno = d => d === (equipo && equipo.dueno) && equipo.dueno_nombre ? equipo.dueno_nombre : d;
    sec.innerHTML = `<h2 class="gal-sub">Compartidos por mi equipo</h2><div class="gal-grid"></div>`;
    const g = sec.querySelector('.gal-grid');
    for (const c of ajenos) {
      const t = document.createElement('div'); t.className = 'tarjeta';
      t.innerHTML = `<button class="mini"><span class="t-carga"></span></button><div class="t-nom">${esc(c.nombre || 'Boceto')}</div>
        <div class="t-fecha">${esc(nombreDueno(c.dueno))} · ${hace(c.actualizado)}</div>`;
      t.querySelector('.mini').onclick = () => verCompartido(c);
      g.appendChild(t);
      urlMini(c).then(u => { if (u) t.querySelector('.mini').innerHTML = `<img src="${u}" alt="">`; });
    }
  }
  async function alPintarGaleria() {
    pintarGaleria();
    if (!A.sesion()) return;
    const antes = JSON.stringify(lista);
    await refrescar();
    if (JSON.stringify(lista) !== antes && !$('galeria').classList.contains('oculto')) pintarGaleria();
  }

  // =================================================================
  //  VISOR (lo que ve el equipo): zoom, exportar, copiar
  // =================================================================
  let visor = null;
  function crearVisor() {
    visor = document.createElement('div'); visor.id = 'visorEq'; visor.className = 'visor-eq oculto';
    visor.innerHTML = `<header><button class="ib" id="veCerrar" title="Cerrar">✕</button><div class="ve-tit"><b id="veNom"></b><span id="veDe"></span></div>
      <button class="ve-btn" id="veCom">💬 Comentarios</button><button class="ve-btn" id="veExportar">Exportar</button><button class="btn-verde" id="veCopiar">Hacer una copia</button></header>
      <div class="ve-cuerpo"><div class="ve-area" id="veArea"><img id="veImg" alt=""><div class="ve-pines" id="vePines"></div><div class="ve-carga" id="veCarga"><span></span>Descargando…</div></div>
      <aside class="ve-lado oculto" id="veLado"></aside></div>`;
    document.body.appendChild(visor);
    const area = $('veArea'), img = $('veImg');
    let s = 1, x = 0, y = 0; const pts = new Map(); let ini = null;
    const aplicar = () => { img.style.transform = `translate(${x}px,${y}px) scale(${s})`; colocarPines(); };
    // pines de comentarios sobre la imagen (coordenadas de la hoja → pantalla)
    const colocarPines = () => { for (const el of $('vePines').children) { el.style.left = (x + +el.dataset.x * s) + 'px'; el.style.top = (y + +el.dataset.y * s) + 'px'; } };
    visor.colocarPines = colocarPines;
    visor.aImagen = (cx, cy) => { const r = area.getBoundingClientRect(); return { x: (cx - r.left - x) / s, y: (cy - r.top - y) / s }; };
    visor.centrar = (ix, iy) => { const W = area.clientWidth, H = area.clientHeight; if (s < 0.6) s = 0.6; x = W / 2 - ix * s; y = H / 2 - iy * s; aplicar(); };
    visor.ajustar = () => {
      const W = area.clientWidth, H = area.clientHeight, w = img.naturalWidth || 1, h = img.naturalHeight || 1;
      s = Math.min(W / w, H / h) * 0.96; x = (W - w * s) / 2; y = (H - h * s) / 2; aplicar();
    };
    const zoomEn = (cx, cy, ns) => { ns = Math.max(0.05, Math.min(8, ns)); x = cx - (cx - x) * ns / s; y = cy - (cy - y) * ns / s; s = ns; aplicar(); };
    let toque = null;
    area.addEventListener('pointerdown', e => { area.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); ini = null; toque = pts.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null; });
    area.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      const p = pts.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) { x += dx; y += dy; aplicar(); return; }
      const [a, b] = [...pts.values()], r = area.getBoundingClientRect();
      const dist = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2 - r.left, cy = (a.y + b.y) / 2 - r.top;
      if (ini) { x += cx - ini.cx; y += cy - ini.cy; zoomEn(cx, cy, s * dist / ini.dist); }
      ini = { dist, cx, cy };
    });
    const fin = e => {
      // un toque (sin arrastrar) en modo comentar: pone el punto del comentario
      if (e.type === 'pointerup' && toque && pts.size === 1 && Math.hypot(e.clientX - toque.x, e.clientY - toque.y) < 8 && performance.now() - toque.t < 500 && visor.comentando) {
        const p = visor.aImagen(e.clientX, e.clientY), w = img.naturalWidth, h = img.naturalHeight;
        if (p.x >= 0 && p.y >= 0 && p.x <= w && p.y <= h) visor.comentando(p);
      }
      pts.delete(e.pointerId); ini = null; toque = null;
    };
    area.addEventListener('pointerup', fin); area.addEventListener('pointercancel', fin);
    area.addEventListener('wheel', e => { e.preventDefault(); const r = area.getBoundingClientRect(); zoomEn(e.clientX - r.left, e.clientY - r.top, s * Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
    area.addEventListener('dblclick', e => { const r = area.getBoundingClientRect(); s > 1.2 ? visor.ajustar() : zoomEn(e.clientX - r.left, e.clientY - r.top, Math.max(2, s * 2.5)); });
    img.onload = () => { $('veCarga').classList.add('oculto'); visor.ajustar(); };
    addEventListener('resize', () => { if (!visor.classList.contains('oculto')) visor.ajustar(); });
    $('veCerrar').onclick = cerrarVisor;
  }
  function cerrarVisor() {
    visor.classList.add('oculto'); visor.comentando = null; $('vePines').innerHTML = ''; $('veLado').classList.add('oculto');
    const img = $('veImg'); if (img.src) URL.revokeObjectURL(img.src); img.removeAttribute('src');
  }
  async function verCompartido(c) {
    if (!visor) crearVisor();
    visor.classList.remove('oculto');
    $('veNom').textContent = c.nombre || 'Boceto';
    $('veDe').textContent = 'De ' + (c.dueno === (equipo && equipo.dueno) && equipo.dueno_nombre ? equipo.dueno_nombre : c.dueno) + ' · actualizado ' + hace(c.actualizado);
    $('veCarga').classList.remove('oculto'); $('veCarga').lastChild.textContent = 'Descargando…';
    const base = `${c.dueno}/${c.dibujo_id}/${c.version}/`;
    let vista = null;
    $('veCom').onclick = () => { const l = $('veLado'); l.classList.toggle('oculto'); if (!l.classList.contains('oculto')) panelVisor(c); };
    panelVisor(c, true);
    try { vista = await A.bajarArchivo(base + 'vista.jpg'); $('veImg').src = URL.createObjectURL(vista); }
    catch (e) { $('veCarga').lastChild.textContent = e.red ? 'Sin internet. Conéctate para ver este boceto.' : 'Este boceto se está actualizando. Vuelve a intentar en un momento.'; return; }
    const nombreArchivo = (c.nombre || 'Boceto').replace(/[^\w\- áéíóúñÁÉÍÓÚÑ]/g, '').trim().replace(/\s+/g, '_') + '.jpg';
    $('veExportar').onclick = () => entregarArchivo(vista, nombreArchivo);
    $('veCopiar').onclick = async () => {
      const b = $('veCopiar'); b.disabled = true; b.textContent = 'Copiando…';
      try {
        const datos = JSON.parse(await (await A.bajarArchivo(base + 'doc.json')).text());
        const capas = [];
        for (let i = 0; i < (datos.capas || []).length; i++) {
          let blob = null; try { blob = await A.bajarArchivo(base + 'capa-' + i + '.png'); } catch (e) {}
          capas.push(Object.assign({}, datos.capas[i], { blob }));
        }
        let thumb = null; try { thumb = await A.bajarArchivo(base + 'mini.jpg'); } catch (e) {}
        const id = nuevoId();
        await dbPut(Object.assign({}, datos, { id, nombre: (c.nombre || 'Boceto') + ' (copia)', creado: Date.now(), fecha: Date.now(), capas, thumb }));
        cerrarVisor(); avisar('Copia lista en tus bocetos'); await mostrarGaleria(); abrirDibujo(id);
      } catch (e) { avisar(e.red ? 'Necesitas internet para copiar' : 'No se pudo copiar'); console.error(e); }
      b.disabled = false; b.textContent = 'Hacer una copia';
    };
  }

  // =================================================================
  //  COMENTARIOS del equipo (con un punto en el plano o generales)
  // =================================================================
  const enc = encodeURIComponent;
  const leerComs = (dueno, id) => A.tabla(`comentarios?select=*&dueno=eq.${enc(dueno)}&dibujo_id=eq.${enc(id)}&order=creado.asc`).then(l => l || []);
  async function nuevoCom(dueno, id, texto, p) { const r = await A.tabla('comentarios', 'POST', { dueno, dibujo_id: id, autor: yo(), texto, x: p ? p.x : null, y: p ? p.y : null }); return r && r[0]; }
  const itemCom = (c, i, dueno) => `<div class="com${c.resuelto ? ' res' : ''}" data-id="${c.id}">
      <div class="com-cab">${c.x != null ? `<span class="com-n">${i + 1}</span>` : '<span class="com-n gen">·</span>'}<b>${esc(corto(c.autor))}</b><small>${hace(c.creado)}${c.resuelto ? ' · resuelto' : ''}</small></div>
      <p>${esc(c.texto)}</p>
      <div class="com-acc">${c.x != null ? '<button data-a="ver">Ver en el plano</button>' : ''}${dueno === yo() ? `<button data-a="res">${c.resuelto ? 'Reabrir' : '✓ Resuelto'}</button>` : ''}${c.autor === yo() || dueno === yo() ? '<button data-a="bor">Borrar</button>' : ''}</div></div>`;
  async function accionCom(lista, b, recargar, ver) {
    const c = lista.find(x => String(x.id) === b.closest('.com').dataset.id); if (!c) return;
    const a = b.dataset.a;
    try {
      if (a === 'ver') return ver(c);
      if (a === 'res') { await A.tabla('comentarios?id=eq.' + c.id, 'PATCH', { resuelto: !c.resuelto }); }
      if (a === 'bor') { if (!confirm('¿Borrar este comentario?')) return; await A.tabla('comentarios?id=eq.' + c.id, 'DELETE'); }
      recargar();
    } catch (e) { avisar(e.red ? 'Necesitas internet' : 'No se pudo cambiar'); }
  }
  // ---- en el visor (miembros del equipo, o el dueño viendo su compartido) ----
  async function panelVisor(c, soloPines) {
    const lado = $('veLado'); let lista = [];
    try { lista = await leerComs(c.dueno, c.dibujo_id); } catch (e) { if (!soloPines) lado.innerHTML = '<p class="com-vacio">Necesitas internet para ver los comentarios.</p>'; return; }
    const pend = lista.filter(x => !x.resuelto).length; $('veCom').textContent = '💬 ' + (pend ? pend : 'Comentarios');
    const conPunto = lista.filter(x => x.x != null);
    $('vePines').innerHTML = conPunto.map(x => `<span class="ve-pin${x.resuelto ? ' res' : ''}" data-x="${x.x}" data-y="${x.y}">${lista.indexOf(x) + 1}</span>`).join('');
    visor.colocarPines();
    if (soloPines) return;
    let punto = null;
    const pintar = () => {
      lado.innerHTML = `<div class="com-tit"><b>Comentarios</b><button class="ib" id="veLadoX">✕</button></div>
        <div class="com-lista">${lista.length ? lista.map((x, i) => itemCom(x, i, c.dueno)).join('') : '<p class="com-vacio">Aún no hay comentarios. Toca “Comentar en un punto” y luego el lugar del plano.</p>'}</div>
        <div class="com-nuevo"><button class="ve-btn${punto || visor.comentando ? ' activo' : ''}" id="vePunto">${punto ? '📍 Punto elegido' : visor.comentando ? 'Toca el plano…' : '📍 Comentar en un punto'}</button>
        <textarea id="veTxt" rows="3" placeholder="${punto ? 'Escribe el comentario para ese punto…' : 'Comentario general (o elige un punto)…'}"></textarea>
        <button class="btn-verde" id="veEnviar">Enviar</button></div>`;
      $('veLadoX').onclick = () => { lado.classList.add('oculto'); visor.comentando = null; };
      $('vePunto').onclick = () => { punto = null; visor.comentando = p => { punto = p; visor.comentando = null; const t = $('veTxt').value; pintar(); $('veTxt').value = t; $('veTxt').focus();
        $('vePines').insertAdjacentHTML('beforeend', `<span class="ve-pin nuevo" data-x="${p.x}" data-y="${p.y}">+</span>`); visor.colocarPines(); }; pintar(); };
      $('veEnviar').onclick = async () => {
        const t = $('veTxt').value.trim(); if (!t) return $('veTxt').focus();
        $('veEnviar').disabled = true;
        try { await nuevoCom(c.dueno, c.dibujo_id, t, punto); punto = null; panelVisor(c); }
        catch (e) { avisar(e.red ? 'Necesitas internet para comentar' : 'No se pudo enviar'); $('veEnviar').disabled = false; }
      };
      lado.querySelector('.com-lista').onclick = ev => { const b = ev.target.closest('button[data-a]'); if (b) accionCom(lista, b, () => panelVisor(c), x => visor.centrar(x.x, x.y)); };
    };
    pintar();
  }
  // ---- en el editor (el dueño, con su boceto compartido abierto) ----
  let comEd = null; // { dueno, id, lista }
  async function alAbrir(d) {
    comEd = null; const b = $('bComent'); if (b) b.classList.add('oculto');
    const c = d && compartidoMio(d.id); if (!c || !A.sesion()) return;
    try { comEd = { dueno: c.dueno, id: d.id, lista: await leerComs(c.dueno, d.id) }; } catch (e) { return; }
    if (!doc || doc.id !== d.id) return;
    pintarBotonCom(); if (comEd.lista.some(x => !x.resuelto)) { avisar('Tu equipo dejó ' + comEd.lista.filter(x => !x.resuelto).length + ' comentario(s) en este boceto'); }
    pedirSup();
  }
  function pintarBotonCom() {
    let b = $('bComent');
    if (!b) { b = document.createElement('button'); b.id = 'bComent'; b.className = 'act-pill'; $('bNotas').insertAdjacentElement('afterend', b); b.onclick = () => abrirPanelCom(); }
    const n = comEd ? comEd.lista.filter(x => !x.resuelto).length : 0;
    b.classList.toggle('oculto', !comEd); b.textContent = '💬 ' + (n || comEd && comEd.lista.length || '');
  }
  function abrirPanelCom() {
    let P = $('pComent');
    if (!P) { P = document.createElement('div'); P.id = 'pComent'; P.className = 'panel oculto'; $('editor').appendChild(P); }
    abrirPanel('pComent', $('bComent')); if (P.classList.contains('oculto')) return;
    const pintar = () => {
      const l = comEd.lista;
      P.innerHTML = `<div class="com-tit"><b>Comentarios del equipo</b></div><div class="com-lista">${l.length ? l.map((x, i) => itemCom(x, i, comEd.dueno)).join('') : '<p class="com-vacio">Sin comentarios.</p>'}</div>
        <div class="com-nuevo"><textarea id="pcTxt" rows="2" placeholder="Responder al equipo…"></textarea><button class="btn-verde" id="pcEnviar">Enviar</button></div>`;
      $('pcEnviar').onclick = async () => { const t = $('pcTxt').value.trim(); if (!t) return;
        try { await nuevoCom(comEd.dueno, comEd.id, t, null); await recargar(); } catch (e) { avisar(e.red ? 'Necesitas internet' : 'No se pudo enviar'); } };
      P.querySelector('.com-lista').onclick = ev => { const b = ev.target.closest('button[data-a]'); if (b) accionCom(l, b, recargar, x => { cerrarPaneles(); centrarEn(x.x, x.y); }); };
    };
    const recargar = async () => { try { comEd.lista = await leerComs(comEd.dueno, comEd.id); } catch (e) {} pintarBotonCom(); pedirSup(); if (!P.classList.contains('oculto')) pintar(); };
    pintar();
  }
  function centrarEn(x, y) { const s = Math.max(escalaVista(), 0.5); M = [s, 0, 0, s, innerWidth / 2 - x * s, innerHeight / 2 - y * s]; aplicarVista(); }
  // pines numerados en el plano (sobre la capa de pantalla)
  function dibujarComentarios(c) {
    if (!comEd || !doc || doc.id !== comEd.id) return;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    comEd.lista.forEach((x, i) => { if (x.x == null) return; const p = mApl(M, x.x, x.y);
      c.beginPath(); c.arc(p.x, p.y - 16, 12, 0, 6.2832); c.moveTo(p.x - 6, p.y - 7); c.lineTo(p.x, p.y); c.lineTo(p.x + 6, p.y - 7);
      c.fillStyle = x.resuelto ? 'rgba(120,120,125,.85)' : '#ff9f0a'; c.fill(); c.fillStyle = '#0b0b0c'; c.font = '700 12px -apple-system,Roboto,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), p.x, p.y - 16); });
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  }

  // =================================================================
  //  MI EQUIPO (dentro de "Mi cuenta")
  // =================================================================
  function msgMiembro(email, clave) {
    return `Te agregué a mi equipo en OXEN PRO.\n\n1) Descarga la app: ${APK}\n2) Entra con:\n   Correo: ${email}\n   Contraseña: ${clave}\n` +
      `3) La primera vez te pedirá crear tu propia contraseña.\n\nEn la galería verás los bocetos que comparto.`;
  }
  async function compartirTexto(txt) {
    const P = window.Capacitor && Capacitor.Plugins;
    try { if (P && P.Share) { await P.Share.share({ text: txt, dialogTitle: 'Enviar acceso' }); return; } } catch (e) { if (/cancel/i.test(e && e.message)) return; }
    try { if (navigator.share) { await navigator.share({ text: txt }); return; } } catch (e) { if (e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(txt); avisar('Mensaje copiado'); } catch (e) { avisar('Copia el mensaje manualmente'); }
  }

  async function pantalla(msg) {
    const { mostrar, verCuenta } = window.OxenAcceso;
    mostrar('<div class="acc-carga"><span></span><p class="acc-txt">Cargando tu equipo…</p></div>');
    await refrescar();
    const e = equipo || { max: 0, miembros: [] };
    let html = '<h2>Mi equipo</h2>';
    if (e.dueno) {
      html += `<p class="acc-txt">Eres parte del equipo de <b>${esc(e.dueno_nombre || e.dueno)}</b>. En tu galería verás los bocetos que comparte contigo.</p>`;
    }
    if (e.max > 0) {
      const n = e.miembros.length;
      html += `<p class="acc-txt">${e.dueno ? 'También tienes tu propio equipo. ' : ''}Agrega a las personas con las que trabajas: entran con tu plan y ven los bocetos que compartas (menú ⋯ del boceto → <b>Compartir con mi equipo</b>).</p>
        <div class="eq-lista">${n ? e.miembros.map(m => `<div class="eq-fila"><div><b>${esc(m.email)}</b><small>${m.propia ? 'Tiene su propia cuenta' : m.debe_cambiar ? 'Aún no entra' : 'Activo'}</small></div>
          ${m.propia ? '' : `<button class="eq-b" data-clave="${esc(m.email)}">Contraseña</button>`}<button class="eq-b eq-rojo" data-quitar="${esc(m.email)}">Quitar</button></div>`).join('')
          : '<div class="eq-fila"><small>Todavía no agregas a nadie.</small></div>'}</div>
        ${n < e.max ? `<label class="acc-lbl" for="eqMail">Agregar persona (${n} de ${e.max})</label>
          <div class="eq-agregar"><input id="eqMail" class="acc-input" type="email" inputmode="email" placeholder="correo@ejemplo.com"><button class="btn-verde" id="eqAgregar">Agregar</button></div>`
          : `<p class="acc-mini" style="text-align:left">Tu equipo está completo (${e.max} personas).</p>`}`;
    } else if (!e.dueno) {
      html += '<p class="acc-txt">Tu plan no incluye equipo. Pide un plan de equipo para trabajar con más personas y compartirles tus bocetos.</p>';
    }
    html += `<p id="accErr" class="acc-err">${esc(msg || '')}</p>
      ${e.dueno ? '<button class="acc-link acc-rojo" id="eqSalir">Salir del equipo</button>' : ''}
      <button class="acc-btn acc-sec" id="eqVolver">Volver</button>`;
    mostrar(html, () => {
      $('eqVolver').onclick = verCuenta;
      const err = t => { $('accErr').textContent = t; };
      if ($('eqAgregar')) {
        const ir = async () => {
          const mail = $('eqMail').value.trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return err('Revisa que el correo esté bien escrito.');
          $('eqAgregar').disabled = true; err('');
          try {
            const r = await A.rpc('equipo_agregar', { p_email: mail });
            if (r.propia) return pantalla(mail + ' ya tiene su propia cuenta: desde ahora ve lo que compartas.');
            const c = await A.funcion('admin-contrasena', { email: mail });
            mostrarClave(mail, c.clave);
          } catch (x) { err(x.red ? A.traducir(x) : (x.message || A.traducir(x))); $('eqAgregar').disabled = false; }
        };
        $('eqAgregar').onclick = ir; $('eqMail').onkeydown = k => { if (k.key === 'Enter') ir(); };
      }
      document.querySelectorAll('[data-clave]').forEach(b => b.onclick = async () => {
        if (!confirm('¿Darle una contraseña nueva a ' + b.dataset.clave + '? La anterior dejará de funcionar.')) return;
        try { const c = await A.funcion('admin-contrasena', { email: b.dataset.clave }); mostrarClave(b.dataset.clave, c.clave); }
        catch (x) { err(x.red ? A.traducir(x) : x.message); }
      });
      document.querySelectorAll('[data-quitar]').forEach(b => b.onclick = async () => {
        if (!confirm('¿Quitar a ' + b.dataset.quitar + ' de tu equipo? Ya no podrá ver tus bocetos' + ' ni usar la app con tu plan.')) return;
        try { await A.rpc('equipo_quitar', { p_email: b.dataset.quitar }); pantalla('Listo, ' + b.dataset.quitar + ' ya no está en tu equipo.'); }
        catch (x) { err(x.red ? A.traducir(x) : x.message); }
      });
      if ($('eqSalir')) $('eqSalir').onclick = async () => {
        if (!confirm('¿Salir del equipo? Dejarás de ver sus bocetos y, si no tienes plan propio, de usar la app.')) return;
        try { await A.rpc('equipo_salir'); lista = lista.filter(esMio); escribir(K_LISTA, lista); pantalla('Saliste del equipo.'); }
        catch (x) { err(x.red ? A.traducir(x) : x.message); }
      };
    });
  }
  function mostrarClave(email, clave) {
    const msg = msgMiembro(email, clave);
    window.OxenAcceso.mostrar(`<h2>Listo</h2>
      <p class="acc-txt"><b>${esc(email)}</b> ya está en tu equipo. Pásale estos datos:</p>
      <div class="acc-datos"><div><span>Contraseña temporal</span><b class="eq-clave">${esc(clave)}</b></div></div>
      <p class="acc-mini" style="text-align:left;margin:0 0 14px">Anótala ahora: no se vuelve a mostrar. La primera vez que entre, la app le pedirá crear la suya.</p>
      <button class="btn-verde acc-btn" id="eqEnviar">Enviar acceso</button>
      <button class="acc-btn acc-sec" id="eqListo">Volver a mi equipo</button>`, () => {
      $('eqEnviar').onclick = () => compartirTexto(msg);
      $('eqListo').onclick = () => pantalla();
    });
  }

  window.Equipo = { alCerrar, alBorrar, alRenombrar, alPintarGaleria, itemMenu, enlazarMenu, pantalla, refrescar, alAbrir, dibujarComentarios };
  if ($('galeria') && !$('galeria').classList.contains('oculto')) alPintarGaleria(); else refrescar();
})();
