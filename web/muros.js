// OXEN PRO — Levantamiento arquitectónico: muros editables, áreas de ambientes y cuadro de vanos.
// Se carga antes que app.js; solo declara funciones (usa las de app.js cuando se llaman).
//
// · Muro = objeto { tipo:'muro', a, b (eje, en px de la hoja), e (espesor en m) }. Se dibuja con doble línea
//   y relleno; en las esquinas y en las "T" se une solo. Su largo se acota por fuera, en vivo.
// · Ambiente = { tipo:'ambiente', x, y (un punto adentro), nombre }: el área y el perímetro se calculan
//   en cada dibujo con la figura que encierra ese punto (si mueves un muro, el área se actualiza sola).
// · Cuadro de vanos = { tipo:'cuadroVanos', x, y }: tabla de puertas y ventanas con códigos P-1, V-1…

// =====================================================================
//  MUROS
// =====================================================================
const ESPESORES = [0.10, 0.15, 0.25];
let muroSel = null, previaMuro = null, ultMuro = null;
const esMuro = o => o && o.tipo === 'muro';
const murosDoc = () => doc ? doc.objetos.filter(esMuro) : [];
const espMuro = () => (aj && aj.muroEsp) || 0.15;
const ePx = o => pxDeMetros(o.e || 0.15);
const tolPt = () => Math.max(1.5 * doc.pxmm, 4 / escalaVista());

function segDist(p, a, b) {
  const ex = b.x - a.x, ey = b.y - a.y, l2 = ex * ex + ey * ey || 1, u = clamp(((p.x - a.x) * ex + (p.y - a.y) * ey) / l2, 0, 1);
  return { d: Math.hypot(a.x + ex * u - p.x, a.y + ey * u - p.y), u, x: a.x + ex * u, y: a.y + ey * u };
}
// cuánto se alarga cada extremo para unirse con otro muro (esquina en L o llegada en T)
function extMuro(o, muros, cual) {
  const p = o[cual], tol = tolPt(); let ext = 0;
  for (const x of muros) {
    if (x === o) continue;
    if (Math.hypot(x.a.x - p.x, x.a.y - p.y) < tol || Math.hypot(x.b.x - p.x, x.b.y - p.y) < tol) { ext = Math.max(ext, ePx(x) / 2); continue; }
    const s = segDist(p, x.a, x.b); if (s.d < tol && s.u > 0 && s.u < 1) ext = Math.max(ext, ePx(x) / 2);
  }
  return ext;
}
function ejeExtendido(o, muros) {
  const L = Math.hypot(o.b.x - o.a.x, o.b.y - o.a.y) || 1, ux = (o.b.x - o.a.x) / L, uy = (o.b.y - o.a.y) / L;
  const ea = extMuro(o, muros, 'a'), eb = extMuro(o, muros, 'b');
  return { a: { x: o.a.x - ux * ea, y: o.a.y - uy * ea }, b: { x: o.b.x + ux * eb, y: o.b.y + uy * eb }, ux, uy, L };
}
function mezclar(h1, h2, t) { // color opaco entre papel y tinta
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16), m = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}
// aberturas (puertas, ventanas, vanos) que están sobre un muro: dónde cortarlo
function muroDeAbertura(s, muros) {
  const sim = Simbolos.de(s.sid); if (!sim || sim.tipo !== 'abertura' || sim.estructura || s.sid === 'muro' || s.sid === 'muro25') return null;
  for (const m of muros) {
    const d = segDist(s, m.a, m.b), an = Math.atan2(m.b.y - m.a.y, m.b.x - m.a.x), da = Math.abs(Math.sin((s.ang || 0) - an));
    if (d.d < ePx(m) / 2 + 2 * doc.pxmm && da < 0.05) return m;
  }
  return null;
}
function dibujarMuros(c) {
  const muros = murosDoc(); if (previaMuro) muros.push(previaMuro);
  if (!muros.length) return;
  const mm = doc.pxmm, lw = Math.max(1, 0.3 * mm), papel = papelDe(doc.papel).color, tinta = '#1d1d1f';
  const rel = papel.startsWith('#') && papel.length === 7 ? mezclar(papel, tinta, 0.22) : 'rgba(29,29,31,.22)';
  const ejes = muros.map(o => ejeExtendido(o, muros));
  c.save(); c.lineCap = 'butt';
  // 1) contorno (un poco más ancho) · 2) relleno encima: las uniones quedan limpias
  c.strokeStyle = tinta; muros.forEach((o, i) => { c.lineWidth = ePx(o) + 2 * lw; c.beginPath(); c.moveTo(ejes[i].a.x, ejes[i].a.y); c.lineTo(ejes[i].b.x, ejes[i].b.y); c.stroke(); });
  c.strokeStyle = rel; muros.forEach((o, i) => { c.lineWidth = ePx(o); c.beginPath(); c.moveTo(ejes[i].a.x, ejes[i].a.y); c.lineTo(ejes[i].b.x, ejes[i].b.y); c.stroke(); });
  // 3) cortes de puertas y ventanas (con sus jambas)
  for (const s of doc.objetos) {
    if (s.tipo !== 'simbolo') continue; const m = muroDeAbertura(s, muros); if (!m) continue;
    const w = pxDeMetros(s.w || Simbolos.de(s.sid).def), h = ePx(m) / 2 + lw;
    c.save(); c.translate(s.x, s.y); c.rotate(s.ang || 0);
    c.fillStyle = papel; c.fillRect(0, -h - 0.5, w, 2 * h + 1);
    c.strokeStyle = tinta; c.lineWidth = lw; c.beginPath(); c.moveTo(0, -h); c.lineTo(0, h); c.moveTo(w, -h); c.lineTo(w, h); c.stroke();
    c.restore();
  }
  // 4) largo de cada muro, acotado por fuera
  if (doc.verCotasMuro !== false) for (const o of muros) if (!o.sinCota && o !== previaMuro) dibujarCota(c, { a: o.a, b: o.b, off: ladoCotaMuro(o, muros) * (ePx(o) / 2 + 5 * mm), color: o.color || tinta });
  if (previaMuro) { const L = Math.hypot(previaMuro.b.x - previaMuro.a.x, previaMuro.b.y - previaMuro.a.y); if (L > 2) dibujarCota(c, { a: previaMuro.a, b: previaMuro.b, off: -(ePx(previaMuro) / 2 + 5 * mm) }, true); }
  c.restore();
}
// lado "afuera" para la cota de un muro (+1/-1 según su normal), mirando la figura que forman los muros
function ladoCotaMuro(o, muros) {
  if (o.ladoCota) return o.ladoCota;
  const L = Math.hypot(o.b.x - o.a.x, o.b.y - o.a.y) || 1, nx = -(o.b.y - o.a.y) / L, ny = (o.b.x - o.a.x) / L, mx = (o.a.x + o.b.x) / 2, my = (o.a.y + o.b.y) / 2;
  const cortes = sg => { let n = 0; for (const x of muros) { if (x === o) continue; const ex = x.b.x - x.a.x, ey = x.b.y - x.a.y, dx = nx * sg, dy = ny * sg, den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue;
    const wx = x.a.x - mx, wy = x.a.y - my, t = (wx * ey - wy * ex) / den, u = (wx * dy - wy * dx) / den; if (t > 1e-6 && u >= 0 && u <= 1) n++; } return n % 2; };
  const cp = cortes(1), cm = cortes(-1); if (cp !== cm) return cp ? -1 : 1;
  let cx = 0, cy = 0, n = 0; for (const x of muros) { cx += x.a.x + x.b.x; cy += x.a.y + x.b.y; n += 2; }
  const d = (cx / n - mx) * nx + (cy / n - my) * ny; return Math.abs(d) < 1e-6 ? -1 : d > 0 ? -1 : 1;
}
function muroEn(d) {
  const tol = 14 / escalaVista(); let mejor = null, dm = 1e9;
  for (const o of murosDoc()) { const s = segDist(d, o.a, o.b); if (s.d < ePx(o) / 2 + tol && s.d < dm) { dm = s.d; mejor = o; } }
  return mejor;
}
// puntos donde se pega un muro nuevo o un extremo: extremos de muros, eje de otro muro, cotas, último muro
function imanMuro(d, salvo) {
  const s = escalaVista(), tol = 18 / s;
  if (ultMuro && Math.hypot(ultMuro.x - d.x, ultMuro.y - d.y) * s < 48) return { x: ultMuro.x, y: ultMuro.y };
  let mejor = null, dm = tol;
  for (const o of murosDoc()) if (o !== salvo) for (const p of [o.a, o.b]) { const dd = Math.hypot(p.x - d.x, p.y - d.y); if (dd < dm) { dm = dd; mejor = { x: p.x, y: p.y }; } }
  if (mejor) return mejor;
  const q = imanCota(d); if (q !== d) return q;
  for (const o of murosDoc()) if (o !== salvo) { const g = segDist(d, o.a, o.b); if (g.d < Math.max(tol, ePx(o) / 2) && g.u > 0 && g.u < 1) return { x: g.x, y: g.y }; }
  return d;
}

// ---- herramienta Muro ----
function iniciarMuro(e) {
  const d = aDoc(e.clientX, e.clientY), t = { id: e.pointerId, tipo: e.pointerType, t0: performance.now(), largo: 0, muro: true, sx: e.clientX, sy: e.clientY, movido: false, antes: snapObj() };
  // con un muro elegido: arrastrar un extremo o el muro entero
  if (muroSel && doc.objetos.includes(muroSel)) {
    const s = escalaVista();
    for (const k of ['a', 'b']) { const p = muroSel[k]; if (Math.hypot(p.x - d.x, p.y - d.y) * s < 26) { t.modo = 'extremo'; t.k = k; t.unidos = unidosA(muroSel[k], muroSel); trazo = t; return; } }
    if (muroEn(d) === muroSel) { t.modo = 'mover'; t.d0 = d; t.a0 = { ...muroSel.a }; t.b0 = { ...muroSel.b }; t.ua = unidosA(muroSel.a, muroSel); t.ub = unidosA(muroSel.b, muroSel); trazo = t; return; }
  }
  t.modo = 'nuevo'; t.a = imanMuro(d); t.b = t.a; t.tocado = muroEn(d);
  trazo = t;
}
function unidosA(p, salvo) { // extremos de otros muros pegados a este punto (se mueven juntos)
  const tol = tolPt(), r = [];
  for (const o of murosDoc()) if (o !== salvo) for (const k of ['a', 'b']) if (Math.hypot(o[k].x - p.x, o[k].y - p.y) < tol) r.push([o, k]);
  return r;
}
function moverMuro(e) {
  const t = trazo, d = aDoc(e.clientX, e.clientY);
  if (Math.hypot(e.clientX - t.sx, e.clientY - t.sy) > 8) t.movido = true;
  if (!t.movido) return;
  if (t.modo === 'nuevo') {
    let b = doc.guias.asist ? enderezarFin(t.a, d) : d; const q = imanMuro(b); if (q !== b) b = q;
    t.b = b; previaMuro = { tipo: 'muro', a: t.a, b, e: espMuro() };
    avisarSuave(lecturaLinea(t.a, b) + ' · muro ' + fmtM(espMuro())); renderObjetos(); return;
  }
  if (t.modo === 'extremo') {
    const o = muroSel, fijo = o[t.k === 'a' ? 'b' : 'a']; let p = doc.guias.asist ? enderezarFin(fijo, d) : d; const q = imanMuro(p, o); if (q !== p) p = q;
    o[t.k] = { x: p.x, y: p.y }; for (const [x, k] of t.unidos) x[k] = { x: p.x, y: p.y };
    avisarSuave(fmtM(metros(Math.hypot(o.b.x - o.a.x, o.b.y - o.a.y))) + ' m'); renderObjetos(); pedirSup(); return;
  }
  if (t.modo === 'mover') {
    const o = muroSel, dx = d.x - t.d0.x, dy = d.y - t.d0.y;
    o.a = { x: t.a0.x + dx, y: t.a0.y + dy }; o.b = { x: t.b0.x + dx, y: t.b0.y + dy };
    for (const [x, k] of t.ua) x[k] = { ...o.a }; for (const [x, k] of t.ub) x[k] = { ...o.b };
    renderObjetos(); pedirSup();
  }
}
function terminarMuro(t) {
  previaMuro = null;
  if (t.modo === 'extremo' || t.modo === 'mover') { if (t.movido) histObj(t.antes); renderObjetos(); pedirSup(); ponerBarraMuro(); avisarArea(muroSel); return; }
  if (!t.movido) { // un toque: elige el muro tocado, o suelta la selección
    if (t.tocado) elegirMuro(t.tocado); else { elegirMuro(null); if (!mostrarArea(aDoc(t.sx, t.sy))) ocultarArea(); }
    renderObjetos(); return;
  }
  const L = Math.hypot(t.b.x - t.a.x, t.b.y - t.a.y);
  if (L < 3 * doc.pxmm) { renderObjetos(); return; }
  const o = { tipo: 'muro', a: { ...t.a }, b: { ...t.b }, e: espMuro(), color: '#1d1d1f', id: Date.now() + Math.random() };
  doc.objetos.push(o); histObj(t.antes); ultMuro = { ...o.b }; pedirSup();
  if (doc.pedirMedida) dialogoMuro(o, true); else avisarArea(o);
}
function cancelarMuro(t) { previaMuro = null; if (t.movido && t.modo !== 'nuevo') { doc.objetos = JSON.parse(t.antes); muroSel = null; } renderObjetos(); pedirSup(); ponerBarraMuro(); }

function elegirMuro(o) { muroSel = o; if (o) ultMuro = null; pedirSup(); ponerBarraMuro(); }
function barraMuro() {
  let b = document.getElementById('muroBar');
  if (b) return b;
  b = document.createElement('div'); b.id = 'muroBar'; b.className = 'sel-bar oculto';
  b.innerHTML = '<button data-m="largo">Largo…</button><button data-m="esp">Espesor…</button><button data-m="cota">Cota</button><button data-m="lado">⇅</button><button data-m="borrar" class="peligro">Eliminar</button>';
  document.getElementById('editor').appendChild(b);
  b.onclick = ev => {
    const a = ev.target.closest('button')?.dataset.m, o = muroSel; if (!a || !o) return;
    if (a === 'largo' || a === 'esp') return dialogoMuro(o, false, a);
    const antes = snapObj();
    if (a === 'cota') o.sinCota = !o.sinCota;
    if (a === 'lado') o.ladoCota = -ladoCotaMuro(o, murosDoc());
    if (a === 'borrar') { doc.objetos.splice(doc.objetos.indexOf(o), 1); muroSel = null; }
    histObj(antes); renderObjetos(); pedirSup(); ponerBarraMuro();
  };
  return b;
}
function ponerBarraMuro() {
  const bar = barraMuro();
  if (!muroSel || !doc || !doc.objetos.includes(muroSel)) { bar.classList.add('oculto'); if (muroSel && doc && !doc.objetos.includes(muroSel)) muroSel = null; return; }
  const p = mApl(M, (muroSel.a.x + muroSel.b.x) / 2, (muroSel.a.y + muroSel.b.y) / 2);
  bar.querySelector('[data-m="cota"]').classList.toggle('activo', !muroSel.sinCota);
  bar.classList.remove('oculto');
  const w = bar.offsetWidth; bar.style.left = clamp(p.x - w / 2, 8, innerWidth - w - 8) + 'px'; bar.style.top = clamp(p.y + 34, 60, innerHeight - 60) + 'px';
}
// largo y espesor del muro (al crearlo, o desde la barra)
function dialogoMuro(o, nuevo, foco) {
  const L = metros(Math.hypot(o.b.x - o.a.x, o.b.y - o.a.y));
  modal(`<h3>${nuevo ? 'Muro nuevo' : 'Muro'}</h3>
    <div class="etq">Largo (m) · eje a eje</div><input type="text" id="muL" inputmode="decimal" value="${nuevo ? '' : fmtM(L)}" placeholder="${fmtM(L)}" autocomplete="off">
    <div class="etq" style="margin-top:8px">Espesor (m)</div>
    <div class="sec-pre" id="muE">${ESPESORES.map(v => `<button data-v="${v}" class="${Math.abs((o.e || 0.15) - v) < 1e-6 ? 'activo' : ''}">${fmtM(v)}</button>`).join('')}<input type="text" id="muEO" inputmode="decimal" placeholder="Otro" value="${ESPESORES.some(v => Math.abs((o.e || 0.15) - v) < 1e-6) ? '' : fmtM(o.e)}" style="width:80px"></div>
    <div class="modal-btns">${nuevo ? '' : '<button class="rojo" id="muBor">Eliminar</button>'}<span style="flex:1"></span><button id="mNo">${nuevo ? 'Dejar así' : 'Cancelar'}</button><button class="ok" id="mSi">Listo</button></div>`, cerrar => {
    let e = o.e || 0.15;
    const marcar = () => document.querySelectorAll('#muE button').forEach(b => b.classList.toggle('activo', Math.abs(+b.dataset.v - e) < 1e-6));
    document.querySelectorAll('#muE button').forEach(b => b.onclick = () => { e = +b.dataset.v; $('muEO').value = ''; marcar(); });
    $('muEO').oninput = () => { const n = numM($('muEO').value); if (n) { e = n; marcar(); } };
    const i = foco === 'esp' ? $('muEO') : $('muL'); setTimeout(() => { i.focus(); i.select(); }, 60);
    const fin = () => { if (!nuevo) elegirMuro(o); else pedirSup(); avisarArea(o); };
    $('mNo').onclick = () => { cerrar(); fin(); };
    if ($('muBor')) $('muBor').onclick = () => { cerrar(); const antes = snapObj(); doc.objetos.splice(doc.objetos.indexOf(o), 1); muroSel = null; histObj(antes); ponerBarraMuro(); };
    const ok = () => {
      const antes = snapObj(), v = numM($('muL').value);
      if (v) { // el extremo b se corre en la misma dirección; lo que estaba pegado a b lo sigue
        const u = unidosA(o.b, o), Lp = Math.hypot(o.b.x - o.a.x, o.b.y - o.a.y) || 1, k = pxDeMetros(v) / Lp;
        o.b = { x: o.a.x + (o.b.x - o.a.x) * k, y: o.a.y + (o.b.y - o.a.y) * k }; for (const [x, kk] of u) x[kk] = { ...o.b };
        if (nuevo) ultMuro = { ...o.b };
      }
      o.e = e; aj.muroEsp = e; guardarAjustes(); pintarChipLev();
      cerrar(); histObj(antes); renderObjetos(); fin();
    };
    $('mSi').onclick = ok; $('muL').onkeydown = k => { if (k.key === 'Enter') ok(); };
  }, () => { if (!nuevo) elegirMuro(o); });
}

// puertas y ventanas: se pegan al muro más cercano (se alinean con él y lo cortan)
function pegarAbertura(o) {
  const sim = Simbolos.de(o.sid); if (!sim || sim.tipo !== 'abertura' || sim.estructura) return false;
  const tol = 22 / escalaVista(); let mejor = null, dm = 1e9;
  for (const m of murosDoc()) { const s = segDist(o, m.a, m.b); if (s.d < ePx(m) / 2 + tol && s.d < dm) { dm = s.d; mejor = { m, s }; } }
  if (!mejor) return false;
  const { m, s } = mejor, an = Math.atan2(m.b.y - m.a.y, m.b.x - m.a.x);
  // conserva el sentido que tenía (puerta que abre hacia uno u otro lado)
  o.ang = Math.cos((o.ang || 0) - an) >= 0 ? an : an + Math.PI;
  const w = pxDeMetros(o.w || sim.def), L = Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y);
  let x = s.x, y = s.y; // que no se salga del muro
  const ini = (x - m.a.x) * Math.cos(an) + (y - m.a.y) * Math.sin(an), fin = ini + w * Math.cos(o.ang - an);
  const lo = Math.min(ini, fin), hi = Math.max(ini, fin); let corr = 0; if (lo < 0) corr = -lo; else if (hi > L) corr = L - hi;
  x += Math.cos(an) * corr; y += Math.sin(an) * corr;
  o.x = x; o.y = y; return true;
}

// =====================================================================
//  ÁREAS: la figura cerrada más chica que encierra un punto
// =====================================================================
// Lados que cuentan: muros, cotas de líneas dibujadas (no las cotas sueltas, p. ej. diagonales) y terrenos.
function ladosFiguras() {
  const r = [];
  for (const o of doc.objetos) {
    if (esMuro(o)) r.push({ a: o.a, b: o.b, d: ePx(o) / 2 });
    else if (o.tipo === 'cota' && (o.auto || o.lid != null || o.borde)) r.push({ a: o.a, b: o.b, d: 0 });
  }
  return r;
}
function caras() {
  const lados = ladosFiguras(); if (lados.length < 3) return [];
  const tol = tolPt(), V = [], idx = p => { for (let i = 0; i < V.length; i++) if (Math.hypot(V[i].x - p.x, V[i].y - p.y) < tol) return i; V.push({ x: p.x, y: p.y }); return V.length - 1; };
  // partir cada lado donde lo toca o lo cruza otro
  const piezas = [];
  for (const s of lados) {
    const us = [0, 1];
    for (const o of lados) { if (o === s) continue;
      for (const p of [o.a, o.b]) { const g = segDist(p, s.a, s.b); if (g.d < tol && g.u > 1e-3 && g.u < 1 - 1e-3) us.push(g.u); }
      const ex = s.b.x - s.a.x, ey = s.b.y - s.a.y, fx = o.b.x - o.a.x, fy = o.b.y - o.a.y, den = ex * fy - ey * fx; if (Math.abs(den) < 1e-9) continue;
      const wx = o.a.x - s.a.x, wy = o.a.y - s.a.y, t = (wx * fy - wy * fx) / den, u = (wx * ey - wy * ex) / den;
      if (t > 1e-3 && t < 1 - 1e-3 && u > 1e-3 && u < 1 - 1e-3) us.push(t);
    }
    us.sort((x, y) => x - y);
    for (let i = 1; i < us.length; i++) { if (us[i] - us[i - 1] < 1e-4) continue;
      const p = { x: s.a.x + (s.b.x - s.a.x) * us[i - 1], y: s.a.y + (s.b.y - s.a.y) * us[i - 1] }, q = { x: s.a.x + (s.b.x - s.a.x) * us[i], y: s.a.y + (s.b.y - s.a.y) * us[i] };
      const i0 = idx(p), i1 = idx(q); if (i0 !== i1) piezas.push([i0, i1, s.d]); }
  }
  // grafo: cada vértice con sus salidas ordenadas por ángulo
  const sal = V.map(() => []), clave = new Set();
  for (const [u, v, d] of piezas) { const k = u < v ? u + ',' + v : v + ',' + u; if (clave.has(k)) continue; clave.add(k);
    sal[u].push({ v, d, an: Math.atan2(V[v].y - V[u].y, V[v].x - V[u].x) }); sal[v].push({ v: u, d, an: Math.atan2(V[u].y - V[v].y, V[u].x - V[v].x) }); }
  sal.forEach(l => l.sort((x, y) => x.an - y.an));
  const usado = new Set(), res = [];
  for (let u = 0; u < V.length; u++) for (const e of sal[u]) {
    if (usado.has(u + '>' + e.v)) continue;
    const cic = [], ds = []; let a = u, b = e, n = 0;
    while (n++ < 400) {
      usado.add(a + '>' + b.v); cic.push(a); ds.push(b.d);
      const l = sal[b.v], back = Math.atan2(V[a].y - V[b.v].y, V[a].x - V[b.v].x);
      let k = l.findIndex(x => x.v === a && Math.abs(x.an - back) < 1e-9); if (k < 0) k = l.findIndex(x => x.v === a);
      const sig = l[(k - 1 + l.length) % l.length]; a = b.v; b = sig;
      if (a === u && b.v === e.v) break;
    }
    if (cic.length >= 3) res.push({ pts: cic.map(i => V[i]), d: ds });
  }
  return res;
}
function areaSigno(p) { let s = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; s += p[i].x * q.y - q.x * p[i].y; } return s / 2; }
function dentro(pt, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i].y > pt.y) !== (p[j].y > pt.y) && pt.x < (p[j].x - p[i].x) * (pt.y - p[i].y) / (p[j].y - p[i].y) + p[i].x) c = !c; return c; }
// polígono interior: cada lado de muro se corre media pared hacia adentro (área libre, como se mide en obra)
function interior(f) {
  const p = f.pts, n = p.length, lin = [];
  for (let i = 0; i < n; i++) {
    const a = p[i], b = p[(i + 1) % n], L = Math.hypot(b.x - a.x, b.y - a.y) || 1; let nx = -(b.y - a.y) / L, ny = (b.x - a.x) / L;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, k = Math.max(0.5, L * 0.001);
    if (!dentro({ x: mx + nx * k, y: my + ny * k }, p)) { nx = -nx; ny = -ny; }
    lin.push({ a: { x: a.x + nx * f.d[i], y: a.y + ny * f.d[i] }, b: { x: b.x + nx * f.d[i], y: b.y + ny * f.d[i] } });
  }
  return lin.map((l, i) => {
    const m = lin[(i - 1 + n) % n], ex = l.b.x - l.a.x, ey = l.b.y - l.a.y, fx = m.b.x - m.a.x, fy = m.b.y - m.a.y, den = fx * ey - fy * ex;
    if (Math.abs(den) < 1e-9) return { ...l.a };
    const t = ((l.a.x - m.a.x) * ey - (l.a.y - m.a.y) * ex) / den; return { x: m.a.x + fx * t, y: m.a.y + fy * t };
  });
}
function figuraEn(pt) {
  let mejor = null, am = Infinity;
  for (const f of caras()) { const A = Math.abs(areaSigno(f.pts)); if (A > 1 && A < am && dentro(pt, f.pts)) { am = A; mejor = f; } }
  if (!mejor) return null;
  const pi = interior(mejor), k = metros(1);
  let per = 0; for (let i = 0; i < pi.length; i++) { const q = pi[(i + 1) % pi.length]; per += Math.hypot(q.x - pi[i].x, q.y - pi[i].y); }
  return { pts: pi, area: Math.abs(areaSigno(pi)) * k * k, perim: per * k };
}
const fmtArea = a => (Math.round(a * 100) / 100).toFixed(2) + ' m²';

// ---- vista rápida del área (transparente) al tocar adentro ----
let areaVista = null, areaPrevia = null; // { pt, f } · areaPrevia: la que se veía antes de apoyar el lápiz
function mostrarArea(pt) {
  if (!aEscala()) return false;
  const f = figuraEn(pt); if (!f) return false;
  const ya = doc.objetos.find(o => o.tipo === 'ambiente' && dentro(o, f.pts)), prev = areaVista || areaPrevia; areaPrevia = null;
  if (prev && Math.abs(prev.f.area - f.area) < 1e-6) { ocultarArea(); dialogoAmbiente(ya || null, pt); return true; } // segundo toque: nombrarlo
  areaVista = { pt, f }; pedirSup(); return true;
}
function ocultarArea() { if (areaVista) { areaPrevia = areaVista; areaVista = null; pedirSup(); } else areaPrevia = null; }
function dibujarAreaVista(c) {
  if (!areaVista) return; const f = areaVista.f;
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  const q = f.pts.map(p => mApl(M, p.x, p.y));
  c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath();
  c.fillStyle = 'rgba(138,207,0,.16)'; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(138,207,0,.85)'; c.setLineDash([6, 5]); c.stroke(); c.setLineDash([]);
  let cx = 0, cy = 0; q.forEach(p => { cx += p.x; cy += p.y; }); cx /= q.length; cy /= q.length;
  if (!dentro(mApl(mInv(M), cx, cy), f.pts)) { const p = mApl(M, areaVista.pt.x, areaVista.pt.y); cx = p.x; cy = p.y; }
  const t1 = fmtArea(f.area), t2 = 'Perímetro ' + fmtM(f.perim) + ' m', t3 = 'Toca otra vez para nombrar';
  c.font = '700 20px -apple-system,Roboto,sans-serif'; const w1 = c.measureText(t1).width; c.font = '500 13px -apple-system,Roboto,sans-serif';
  const W = Math.max(w1, c.measureText(t2).width, c.measureText(t3).width) + 28, H = 76;
  c.fillStyle = 'rgba(14,14,15,.78)'; c.beginPath(); c.roundRect ? c.roundRect(cx - W / 2, cy - H / 2, W, H, 14) : c.rect(cx - W / 2, cy - H / 2, W, H); c.fill();
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = '#8ACF00'; c.font = '700 20px -apple-system,Roboto,sans-serif'; c.fillText(t1, cx, cy - 18);
  c.fillStyle = '#f2f2f3'; c.font = '500 13px -apple-system,Roboto,sans-serif'; c.fillText(t2, cx, cy + 6);
  c.fillStyle = 'rgba(242,242,243,.55)'; c.font = '500 11px -apple-system,Roboto,sans-serif'; c.fillText(t3, cx, cy + 25);
}
// al cerrar una figura (con muros o líneas) avisa el área
function avisarArea(o) {
  if (!o || !aEscala()) return;
  const L = Math.hypot(o.b.x - o.a.x, o.b.y - o.a.y) || 1, nx = -(o.b.y - o.a.y) / L, ny = (o.b.x - o.a.x) / L, mx = (o.a.x + o.b.x) / 2, my = (o.a.y + o.b.y) / 2, k = (esMuro(o) ? ePx(o) / 2 : 0) + 3 * doc.pxmm;
  for (const sg of [1, -1]) { const f = figuraEn({ x: mx + nx * sg * k, y: my + ny * sg * k }); if (f) { avisar('Figura cerrada: ' + fmtArea(f.area) + ' · toca adentro para ver o nombrar el ambiente'); return; } }
}

// ---- ambientes con nombre y área en el plano ----
const NOMBRES_AMB = ['Sala', 'Comedor', 'Cocina', 'Dormitorio', 'Baño', 'Estudio', 'Lavandería', 'Hall', 'Terraza', 'Depósito'];
function dialogoAmbiente(o, pt) {
  const f = figuraEn(o || pt);
  modal(`<h3>${o ? 'Ambiente' : 'Nombrar ambiente'}</h3>
    ${f ? `<p>Área libre <b>${fmtArea(f.area)}</b> · perímetro <b>${fmtM(f.perim)} m</b></p>` : ''}
    <div class="sec-pre" id="amPre">${NOMBRES_AMB.map(n => `<button>${n}</button>`).join('')}</div>
    <input type="text" id="amN" value="${escapar(o ? o.nombre || '' : '')}" placeholder="Nombre del ambiente">
    <label class="interruptor"><input type="checkbox" id="amArea" ${!o || o.verArea !== false ? 'checked' : ''}><span></span>Mostrar el área en el plano</label>
    <label class="interruptor"><input type="checkbox" id="amPer" ${o && o.verPer ? 'checked' : ''}><span></span>Mostrar también el perímetro</label>
    <div class="modal-btns">${o ? '<button class="rojo" id="amBor">Quitar</button>' : ''}<span style="flex:1"></span><button id="mNo">Cancelar</button><button class="ok" id="mSi">${o ? 'Guardar' : 'Poner en el plano'}</button></div>`, cerrar => {
    document.querySelectorAll('#amPre button').forEach(b => b.onclick = () => { $('amN').value = b.textContent; });
    $('mNo').onclick = cerrar;
    if ($('amBor')) $('amBor').onclick = () => { cerrar(); const antes = snapObj(); doc.objetos.splice(doc.objetos.indexOf(o), 1); histObj(antes); };
    $('mSi').onclick = () => {
      const antes = snapObj(), x = o || { tipo: 'ambiente', x: pt.x, y: pt.y, id: Date.now() + Math.random(), color: '#1d1d1f' };
      x.nombre = $('amN').value.trim(); x.verArea = $('amArea').checked; x.verPer = $('amPer').checked;
      if (!o) doc.objetos.push(x); cerrar(); histObj(antes);
    };
    setTimeout(() => $('amN').focus(), 60);
  });
}
function dibujarAmbiente(c, o) {
  const f = figuraEn(o), mm = doc.pxmm, l = [];
  if (o.nombre) l.push([o.nombre.toUpperCase(), 700, 3.2]);
  if (o.verArea !== false) l.push([f ? fmtArea(f.area) : '— m²', 600, 2.6]);
  if (o.verPer && f) l.push(['P ' + fmtM(f.perim) + ' m', 500, 2.2]);
  if (!l.length) return;
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = o.color || '#1d1d1f';
  const h = l.reduce((s, x) => s + x[2] * mm * 1.3, 0); let y = o.y - h / 2, w = 0;
  for (const [t, p, s] of l) { c.font = `${p} ${s * mm}px -apple-system,Roboto,"Segoe UI",sans-serif`; w = Math.max(w, c.measureText(t).width); y += s * mm * 0.65; c.lineWidth = s * mm * 0.3; c.lineJoin = 'round'; c.strokeStyle = papelDe(doc.papel).color; c.strokeText(t, o.x, y); c.fillText(t, o.x, y); y += s * mm * 0.65; }
  o._bb = [o.x - w / 2, o.y - h / 2, o.x + w / 2, o.y + h / 2];
  if (!f) { c.globalAlpha = 0.5; c.font = `500 ${1.8 * mm}px sans-serif`; c.fillText('(fuera de una figura cerrada)', o.x, o.y + h / 2 + 1.5 * mm); }
  c.restore();
}

// =====================================================================
//  CUADRO DE VANOS (puertas y ventanas)
// =====================================================================
const TIPO_VANO = { puerta: ['P', 'Puerta'], puerta2: ['P', 'Puerta doble'], corrediza: ['P', 'Puerta corrediza'], ventana: ['V', 'Ventana'], vano: ['VA', 'Vano libre'] };
const ALTO_DEF = { P: 2.10, V: 1.20, VA: 2.10 }, ALF_DEF = { V: 0.90 };
function vanosDoc() {
  const grupos = new Map();
  for (const o of doc.objetos) {
    if (o.tipo !== 'simbolo' || !TIPO_VANO[o.sid]) continue;
    const [pre, nom] = TIPO_VANO[o.sid], w = Math.round((o.w || Simbolos.de(o.sid).def) * 100) / 100, alto = o.alto || ALTO_DEF[pre], alf = pre === 'V' ? (o.alf != null ? o.alf : ALF_DEF.V) : null;
    const k = [pre, o.sid, w, alto, alf].join('|');
    if (!grupos.has(k)) grupos.set(k, { pre, nom, w, alto, alf, n: 0, objs: [] });
    const g = grupos.get(k); g.n++; g.objs.push(o);
  }
  const lista = [...grupos.values()].sort((a, b) => a.pre.localeCompare(b.pre) || b.w - a.w);
  const cont = {}; for (const g of lista) { cont[g.pre] = (cont[g.pre] || 0) + 1; g.cod = g.pre + '-' + cont[g.pre]; for (const o of g.objs) o._cod = g.cod; }
  return lista;
}
function dibujarCuadroVanos(c, o) {
  const mm = doc.pxmm, lista = vanosDoc(), cols = [['CÓD.', 12], ['TIPO', 30], ['ANCHO', 15], ['ALTO', 15], ['ALFÉIZAR', 18], ['CANT.', 12]], fh = 5 * mm, W = cols.reduce((s, x) => s + x[1], 0) * mm;
  const H = fh * (lista.length + 2);
  c.save(); c.strokeStyle = c.fillStyle = o.color || '#1d1d1f'; c.lineWidth = Math.max(1, 0.2 * mm); c.textBaseline = 'middle';
  c.fillStyle = papelDe(doc.papel).color; c.fillRect(o.x, o.y, W, H); c.fillStyle = o.color || '#1d1d1f';
  c.strokeRect(o.x, o.y, W, H);
  c.font = `700 ${2.8 * mm}px -apple-system,Roboto,sans-serif`; c.textAlign = 'center'; c.fillText('CUADRO DE VANOS', o.x + W / 2, o.y + fh / 2);
  c.beginPath(); for (let i = 1; i <= lista.length + 1; i++) { c.moveTo(o.x, o.y + fh * i); c.lineTo(o.x + W, o.y + fh * i); }
  let x = o.x; for (let i = 0; i < cols.length - 1; i++) { x += cols[i][1] * mm; c.moveTo(x, o.y + fh); c.lineTo(x, o.y + H); } c.stroke();
  const fila = (vals, y, peso) => { let xx = o.x; c.font = `${peso} ${2.2 * mm}px -apple-system,Roboto,sans-serif`; vals.forEach((v, i) => { c.fillText(String(v), xx + cols[i][1] * mm / 2, y); xx += cols[i][1] * mm; }); };
  fila(cols.map(x => x[0]), o.y + fh * 1.5, 700);
  lista.forEach((g, i) => fila([g.cod, g.nom, fmtM(g.w), fmtM(g.alto), g.alf != null ? fmtM(g.alf) : '—', g.n], o.y + fh * (i + 2.5), 500));
  if (!lista.length) { c.globalAlpha = 0.5; c.font = `500 ${2 * mm}px sans-serif`; c.fillText('Aún no hay puertas ni ventanas en el plano', o.x + W / 2, o.y + fh * 2.5); }
  o._bb = [o.x, o.y, o.x + W, o.y + H];
  c.restore();
}
// código (P-1, V-2…) junto a cada puerta y ventana cuando la hoja tiene cuadro de vanos
function dibujarCodigosVanos(c) {
  if (!doc.objetos.some(o => o.tipo === 'cuadroVanos')) return;
  vanosDoc(); const mm = doc.pxmm, r = 2.3 * mm;
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const o of doc.objetos) {
    if (!o._cod) continue;
    const w = pxDeMetros(o.w || Simbolos.de(o.sid).def), an = o.ang || 0, sg = o.flip ? -1 : 1;
    const D = sg * (r + 4 * mm), x = o.x + Math.cos(an) * w / 2 - Math.sin(an) * D, y = o.y + Math.sin(an) * w / 2 + Math.cos(an) * D;
    c.fillStyle = papelDe(doc.papel).color; c.strokeStyle = o.color || '#1d1d1f'; c.lineWidth = Math.max(1, 0.18 * mm);
    c.beginPath(); c.ellipse(x, y, r * 1.35, r, 0, 0, 6.2832); c.fill(); c.stroke();
    c.fillStyle = o.color || '#1d1d1f'; c.font = `700 ${1.9 * mm}px -apple-system,Roboto,sans-serif`; c.fillText(o._cod, x, y);
  }
  c.restore();
}
function insertarCuadroVanos() {
  if (!aEscala()) return avisar('Disponible en hojas a escala (levantamiento, planta)');
  if (doc.objetos.some(o => o.tipo === 'cuadroVanos')) return avisar('La hoja ya tiene su cuadro de vanos (arrástralo con la herramienta Texto)');
  const antes = snapObj(), mm = doc.pxmm, W = 102 * mm;
  doc.objetos.push({ tipo: 'cuadroVanos', x: doc.w - W - 8 * mm, y: 8 * mm, id: Date.now() + Math.random() });
  histObj(antes); avisar('Cuadro de vanos agregado arriba a la derecha · se actualiza solo · muévelo con la herramienta Texto');
}
// alto (y alféizar en ventanas) de una abertura
function dialogoAltoVano(o) {
  const t = TIPO_VANO[o.sid]; if (!t) return;
  const pre = t[0];
  modal(`<h3>${t[1]}: alturas</h3>
    <div class="sec-campos"><label><span>Alto (m)</span><input id="vaA" type="text" inputmode="decimal" value="${fmtM(o.alto || ALTO_DEF[pre])}"></label>
    ${pre === 'V' ? `<label><span>Alféizar (m)</span><input id="vaF" type="text" inputmode="decimal" value="${fmtM(o.alf != null ? o.alf : ALF_DEF.V)}"></label>` : ''}</div>
    <div class="modal-btns"><span style="flex:1"></span><button id="mNo">Cancelar</button><button class="ok" id="mSi">Listo</button></div>`, cerrar => {
    $('mNo').onclick = cerrar;
    $('mSi').onclick = () => { const a = numM($('vaA').value), f = $('vaF') ? parseFloat(String($('vaF').value).replace(',', '.')) : null; if (!a) return avisar('Escribe un alto válido');
      cerrar(); cambiarSel(x => { x.alto = a; if (pre === 'V' && f >= 0) x.alf = f; }); renderObjetos(); };
  });
}

// muro elegido: resaltado y sus dos extremos (arrástralos para estirar o girar el muro)
function dibujarPuntoMuro(c) { // dónde sigue el siguiente muro
  if (!ultMuro || herramienta !== 'muro' || muroSel) return;
  c.setTransform(DPR, 0, 0, DPR, 0, 0); const p = mApl(M, ultMuro.x, ultMuro.y);
  c.beginPath(); c.arc(p.x, p.y, 9, 0, 6.2832); c.fillStyle = 'rgba(138,207,0,.28)'; c.fill();
  c.beginPath(); c.arc(p.x, p.y, 4, 0, 6.2832); c.fillStyle = '#8ACF00'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#0b0b0c'; c.stroke();
}
function dibujarSelMuro(c) {
  const o = muroSel; if (!o || !doc.objetos.includes(o)) return;
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  const a = mApl(M, o.a.x, o.a.y), b = mApl(M, o.b.x, o.b.y), w = ePx(o) * escalaVista() + 8;
  c.lineCap = 'butt'; c.lineWidth = w; c.strokeStyle = 'rgba(138,207,0,.28)'; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  for (const p of [a, b]) { c.beginPath(); c.arc(p.x, p.y, 10, 0, 6.2832); c.fillStyle = '#8ACF00'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#0b0b0c'; c.stroke(); }
}
