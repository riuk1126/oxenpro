// OXEN PRO — Exportar a PDF (a escala) y a CAD (DXF), PDF como fondo y logo del rótulo.
// Se carga antes que app.js; solo declara funciones (usa las de app.js y muros.js al llamarse).

// =====================================================================
//  PDF A ESCALA: la hoja con su tamaño real de papel (A4, A3…). Impreso al 100 %, la escala es exacta.
// =====================================================================
async function exportarPdf() {
  await guardar();
  const k = Math.min(1.5, 9000 / Math.max(doc.w, doc.h)), cv = componer(k);
  const jpg = new Uint8Array(await (await aBlob(cv, 'image/jpeg', 0.92)).arrayBuffer());
  const wMm = doc.w / doc.pxmm, hMm = doc.h / doc.pxmm, W = (wMm / 25.4 * 72).toFixed(2), H = (hMm / 25.4 * 72).toFixed(2);
  const enc = new TextEncoder(), partes = [], ofs = []; let n = 0;
  const poner = x => { const b = typeof x === 'string' ? enc.encode(x) : x; partes.push(b); n += b.length; };
  const obj = (i, cuerpo) => { ofs[i] = n; poner(`${i} 0 obj\n`); cuerpo(); poner('\nendobj\n'); };
  const cont = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
  const info = `(${(doc.nombre || 'OXEN PRO').replace(/[()\\]/g, '')})`;
  poner('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  obj(1, () => poner('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => poner('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
  obj(3, () => poner(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`));
  obj(4, () => { poner(`<< /Type /XObject /Subtype /Image /Width ${cv.width} /Height ${cv.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`); poner(jpg); poner('\nendstream'); });
  obj(5, () => poner(`<< /Length ${cont.length} >>\nstream\n${cont}\nendstream`));
  obj(6, () => poner(`<< /Title ${info} /Creator (OXEN PRO) /Producer (OXEN PRO) >>`));
  const x = n; poner(`xref\n0 7\n0000000000 65535 f \n${[1, 2, 3, 4, 5, 6].map(i => String(ofs[i]).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${x}\n%%EOF`);
  const blob = new Blob(partes, { type: 'application/pdf' });
  const papel = [[297, 210, 'A4'], [420, 297, 'A3'], [594, 420, 'A2'], [841, 594, 'A1']].find(p => Math.abs(Math.max(wMm, hMm) - p[0]) < 3 && Math.abs(Math.min(wMm, hMm) - p[1]) < 3);
  await entregarArchivo(blob, nombreArchivo('pdf'));
  if (aEscala()) avisar(`PDF ${papel ? papel[2] : Math.round(wMm) + '×' + Math.round(hMm) + ' mm'} a escala 1/${doc.escala} · imprímelo al 100 % (tamaño real)`);
}
function nombreArchivo(ext) { return (doc.nombre || 'Boceto').replace(/[^\w\- áéíóúñÁÉÍÓÚÑ]/g, '').trim().replace(/\s+/g, '_') + '.' + ext; }

// =====================================================================
//  CAD (DXF): muros, cotas, puertas, ventanas, estructura, textos y ambientes en metros reales,
//  cada cosa en su capa. Los trazos a mano alzada son pintura y no pasan al DXF.
// =====================================================================
// AutoCAD (DXF R12) no entiende tildes ni "²" tal cual: van como \U+00E1
const aDxf = t => String(t).replace(/\n/g, ' ').replace(/[^\x20-\x7e]/g, ch => '\\U+' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'));
function exportarDxf() {
  if (!aEscala()) return avisar('El DXF se exporta desde hojas a escala (levantamiento, planta, corte)');
  const X = px => +metros(px).toFixed(4), Y = py => +(-metros(py)).toFixed(4), out = [], cuenta = {};
  const capas = { MUROS: 7, EJES: 8, VANOS: 4, COTAS: 2, ESTRUCTURA: 1, TEXTO: 7, AMBIENTES: 3, LINEAS: 7 };
  const g = (...kv) => { for (let i = 0; i < kv.length; i += 2) out.push(String(kv[i]), String(kv[i + 1])); };
  const linea = (capa, a, b) => { if (Math.hypot(b.x - a.x, b.y - a.y) < 0.01) return; g(0, 'LINE', 8, capa, 10, X(a.x), 20, Y(a.y), 30, 0, 11, X(b.x), 21, Y(b.y), 31, 0); cuenta[capa] = (cuenta[capa] || 0) + 1; };
  const texto = (capa, p, txt, altoMm, ang) => { const h = +(altoMm * doc.escala / 1000).toFixed(4), x = X(p.x), y = Y(p.y);
    g(0, 'TEXT', 8, capa, 10, x, 20, y, 30, 0, 40, h, 1, aDxf(txt), 50, +(ang || 0).toFixed(3), 72, 1, 73, 2, 11, x, 21, y, 31, 0); cuenta[capa] = (cuenta[capa] || 0) + 1; };
  const arco = (capa, c, r, p1, p2) => { // de p1 a p2 por el camino corto (en coordenadas de la hoja)
    let a1 = Math.atan2(Y(p1.y) - Y(c.y), X(p1.x) - X(c.x)) * 180 / Math.PI, a2 = Math.atan2(Y(p2.y) - Y(c.y), X(p2.x) - X(c.x)) * 180 / Math.PI;
    if (((a2 - a1) % 360 + 360) % 360 > 180) [a1, a2] = [a2, a1];
    g(0, 'ARC', 8, capa, 10, X(c.x), 20, Y(c.y), 30, 0, 40, +metros(r).toFixed(4), 50, +a1.toFixed(3), 51, +a2.toFixed(3)); cuenta[capa] = (cuenta[capa] || 0) + 1; };
  const circulo = (capa, c, r) => { g(0, 'CIRCLE', 8, capa, 10, X(c.x), 20, Y(c.y), 30, 0, 40, +metros(r).toFixed(4)); cuenta[capa] = (cuenta[capa] || 0) + 1; };
  // un símbolo: de sus coordenadas locales (metros) a la hoja
  const T = (o, lx, ly) => { const k = kSim(Simbolos.de(o.sid)), c = Math.cos(o.ang || 0), s = Math.sin(o.ang || 0), yy = o.flip ? -ly : ly; return { x: o.x + (lx * c - yy * s) * k, y: o.y + (lx * s + yy * c) * k }; };
  const cota = (o, capa) => { // como en la hoja: línea, extensiones, marcas a 45° y el texto
    const gc = geomCota(o), mm = doc.pxmm, s = Math.sign(o.off || 0);
    if (o.off) { linea(capa, { x: o.a.x + gc.nx * s * 0.8 * mm, y: o.a.y + gc.ny * s * 0.8 * mm }, { x: gc.a2.x + gc.nx * s * 1.2 * mm, y: gc.a2.y + gc.ny * s * 1.2 * mm });
      linea(capa, { x: o.b.x + gc.nx * s * 0.8 * mm, y: o.b.y + gc.ny * s * 0.8 * mm }, { x: gc.b2.x + gc.nx * s * 1.2 * mm, y: gc.b2.y + gc.ny * s * 1.2 * mm }); }
    linea(capa, { x: gc.a2.x - gc.ux * 1.5 * mm, y: gc.a2.y - gc.uy * 1.5 * mm }, { x: gc.b2.x + gc.ux * 1.5 * mm, y: gc.b2.y + gc.uy * 1.5 * mm });
    for (const p of [gc.a2, gc.b2]) { const tx = (gc.ux + gc.nx) * 0.7071 * 0.8 * mm, ty = (gc.uy + gc.ny) * 0.7071 * 0.8 * mm; linea(capa, { x: p.x - tx, y: p.y - ty }, { x: p.x + tx, y: p.y + ty }); }
    let an = Math.atan2(gc.uy, gc.ux); if (an > Math.PI / 2 + 0.01 || an < -Math.PI / 2 + 0.01) an += Math.PI;
    const up = { x: Math.sin(an), y: -Math.cos(an) }, m = { x: (gc.a2.x + gc.b2.x) / 2 + up.x * 1.9 * mm, y: (gc.a2.y + gc.b2.y) / 2 + up.y * 1.9 * mm };
    texto(capa, m, o.texto != null && o.texto !== '' ? o.texto : fmtM(metros(gc.L)), 2.6, -an * 180 / Math.PI);
  };

  // ---- muros: caras (con los cortes de puertas y ventanas) y ejes ----
  const muros = murosDoc(), abert = doc.objetos.filter(s => s.tipo === 'simbolo' && muroDeAbertura(s, muros));
  for (const m of muros) {
    const e = ejeExtendido(m, muros), h = ePx(m) / 2, nx = -e.uy, ny = e.ux, L = Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y);
    const ea = Math.hypot(e.a.x - m.a.x, e.a.y - m.a.y), eb = Math.hypot(e.b.x - m.b.x, e.b.y - m.b.y);
    linea('EJES', m.a, m.b);
    // tramos llenos a lo largo del muro (sin los vanos)
    let huecos = [];
    for (const s of abert) if (muroDeAbertura(s, muros) === m) {
      const w = pxDeMetros(s.w || Simbolos.de(s.sid).def), t0 = (s.x - m.a.x) * e.ux + (s.y - m.a.y) * e.uy, t1 = t0 + w * Math.cos((s.ang || 0) - Math.atan2(e.uy, e.ux));
      huecos.push([Math.min(t0, t1), Math.max(t0, t1)]);
    }
    huecos.sort((a, b) => a[0] - b[0]);
    const tramos = []; let ini = -ea; for (const [h0, h1] of huecos) { if (h0 > ini) tramos.push([ini, h0]); ini = Math.max(ini, h1); } if (ini < L + eb) tramos.push([ini, L + eb]);
    const P = (t, sg) => ({ x: m.a.x + e.ux * t + nx * h * sg, y: m.a.y + e.uy * t + ny * h * sg });
    for (const [t0, t1] of tramos) for (const sg of [1, -1]) linea('MUROS', P(t0, sg), P(t1, sg));
    for (const [h0, h1] of huecos) { linea('MUROS', P(h0, 1), P(h0, -1)); linea('MUROS', P(h1, 1), P(h1, -1)); } // jambas
    if (ea < 0.5) linea('MUROS', P(-ea, 1), P(-ea, -1)); // extremo libre
    if (eb < 0.5) linea('MUROS', P(L + eb, 1), P(L + eb, -1));
    if (doc.verCotasMuro !== false && !m.sinCota) cota({ a: m.a, b: m.b, off: ladoCotaMuro(m, muros) * (ePx(m) / 2 + 5 * doc.pxmm) }, 'COTAS');
  }
  // ---- objetos ----
  for (const o of doc.objetos) {
    if (o.tipo === 'cota') { cota(o, 'COTAS'); if (o.auto || o.borde || o.lid != null) linea('LINEAS', o.a, o.b); }
    else if (o.tipo === 'texto') lineasTexto(o).forEach((l, i) => texto('TEXTO', { x: o.x, y: o.y + (i + 0.5) * (TAM_TEXTO[o.tam] || 3.5) * doc.pxmm * 1.25 }, l, TAM_TEXTO[o.tam] || 3.5, 0));
    else if (o.tipo === 'ambiente') { const f = figuraEn(o); let y = o.y; if (o.nombre) { texto('AMBIENTES', { x: o.x, y }, o.nombre.toUpperCase(), 3.2, 0); y += 4.2 * doc.pxmm; } if (f && o.verArea !== false) texto('AMBIENTES', { x: o.x, y }, fmtArea(f.area), 2.6, 0); }
    else if (o.tipo === 'simbolo') {
      const sim = Simbolos.de(o.sid), w = o.w || sim.def, q = seccionSim(o);
      if (o.sid === 'puerta') { linea('VANOS', T(o, 0, 0), T(o, 0, -w)); arco('VANOS', T(o, 0, 0), pxDeMetros(w), T(o, 0, -w), T(o, w, 0)); }
      else if (o.sid === 'puerta2') { const h = w / 2; linea('VANOS', T(o, 0, 0), T(o, 0, -h)); linea('VANOS', T(o, w, 0), T(o, w, -h)); arco('VANOS', T(o, 0, 0), pxDeMetros(h), T(o, 0, -h), T(o, h, 0)); arco('VANOS', T(o, w, 0), pxDeMetros(h), T(o, w, -h), T(o, h, 0)); }
      else if (o.sid === 'corrediza') { for (const [x0, y0, ww, hh] of [[0, -0.06, w * 0.55, 0.04], [w * 0.45, 0.02, w * 0.55, 0.04]]) { const c = [T(o, x0, y0), T(o, x0 + ww, y0), T(o, x0 + ww, y0 + hh), T(o, x0, y0 + hh)]; c.forEach((p, i) => linea('VANOS', p, c[(i + 1) % 4])); } }
      else if (o.sid === 'ventana') { for (const y of [-0.075, 0, 0.075]) linea('VANOS', T(o, 0, y), T(o, w, y)); }
      else if (o.sid === 'vano') { linea('VANOS', T(o, 0, 0), T(o, w, 0)); }
      else if (CON_COTAS.includes(o.sid)) { if (sim.circular) circulo('ESTRUCTURA', { x: o.x, y: o.y }, pxDeMetros(q.sw) / 2); else { const c = esquinasSim(o).slice(1); c.forEach((p, i) => linea('ESTRUCTURA', p, c[(i + 1) % 4])); } if (o.texto) texto('ESTRUCTURA', T(o, q.sw / 2 + 0.25, -q.sh / 2 - 0.1), o.texto, 2.4, 0); }
      else if (sim.estructura && sim.tipo === 'abertura') { const b = q.sw / 2, c = [T(o, 0, -b), T(o, w, -b), T(o, w, b), T(o, 0, b)]; c.forEach((p, i) => linea('ESTRUCTURA', p, c[(i + 1) % 4])); }
      if (o._cod) texto('VANOS', T(o, w / 2, 0.35), o._cod, 1.9, 0);
    }
  }
  for (const L of lineas.values()) if (lineaUsable(L) && !doc.objetos.some(o => o.tipo === 'cota' && o.lid === L.id)) linea('LINEAS', L.p, L.q);
  if (!out.length) return avisar('No hay muros, cotas ni símbolos para pasar a CAD (los trazos a mano alzada no se exportan)');
  const cab = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '9', '$INSUNITS', '70', '6', '9', '$DWGCODEPAGE', '3', 'ANSI_1252', '0', 'ENDSEC',
    '0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LAYER', '70', String(Object.keys(capas).length)];
  for (const [n, col] of Object.entries(capas)) cab.push('0', 'LAYER', '2', n, '70', '0', '62', String(col), '6', 'CONTINUOUS');
  cab.push('0', 'ENDTAB', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES');
  const txt = cab.concat(out, ['0', 'ENDSEC', '0', 'EOF']).join('\r\n');
  entregarArchivo(new Blob([txt], { type: 'application/dxf' }), nombreArchivo('dxf'));
  avisar('DXF en metros (1 unidad = 1 m) · capas: ' + Object.keys(cuenta).join(', '));
}

// =====================================================================
//  PDF COMO FONDO (para revisar o calcar un plano)
// =====================================================================
let pdfjsCarga = null;
function cargarPdfjs() {
  return pdfjsCarga || (pdfjsCarga = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = 'lib/pdf.min.js';
    s.onload = () => { try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js'; res(window.pdfjsLib); } catch (e) { rej(e); } };
    s.onerror = () => { pdfjsCarga = null; rej(new Error('pdfjs')); }; document.head.appendChild(s);
  }));
}
async function importarPdf(f) {
  avisar('Abriendo el PDF…');
  try {
    const lib = await cargarPdfjs(), pdf = await lib.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
    const pagina = pdf.numPages > 1 ? await new Promise(r => pedirTexto(`Página (1 a ${pdf.numPages})`, '1', v => r(clamp(parseInt(v) || 1, 1, pdf.numPages)), 'numeric')) : 1;
    const pg = await pdf.getPage(pagina), v1 = pg.getViewport({ scale: 1 });
    const modo = await new Promise(r => modal(`<h3>PDF de fondo</h3><p>La página mide ${Math.round(v1.width * 25.4 / 72)} × ${Math.round(v1.height * 25.4 / 72)} mm.</p>
      <button class="item" id="pdReal"><b>Tamaño real del papel</b><small class="item-sub">Si el plano está a la misma escala que esta hoja (1/${doc.escala || 50}), coincide medida con medida</small></button>
      <button class="item" id="pdAjustar"><b>Ajustar a la hoja</b><small class="item-sub">Solo para verlo y calcar</small></button>
      <div class="modal-btns"><span style="flex:1"></span><button id="mNo">Cancelar</button></div>`, cerrar => {
      $('pdReal').onclick = () => { cerrar(); r('real'); }; $('pdAjustar').onclick = () => { cerrar(); r('ajustar'); }; $('mNo').onclick = () => { cerrar(); r(null); };
    }, () => r(null)));
    if (!modo) return;
    let k = modo === 'real' ? 25.4 / 72 * doc.pxmm : Math.min(doc.w / v1.width, doc.h / v1.height) * 0.95;
    k = Math.min(k, 8000 / Math.max(v1.width, v1.height));
    const vp = pg.getViewport({ scale: k }), cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
    const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
    await pg.render({ canvasContext: cx, viewport: vp }).promise;
    if (doc.capas.length >= MAX_CAPAS) return avisar('Máximo ' + MAX_CAPAS + ' capas');
    if (flot) aplicarFlot();
    const c = crearCapa('PDF de fondo', doc.w, doc.h); c.op = 0.45; c.ref = true; c.mezcla = 'multiply';
    insertarCapa(c, 0); pushHist({ t: 'nueva', capa: c, idx: 0 });
    crearFlot(c, cv, doc.w / 2, doc.h / 2, null);
    avisar(modo === 'real' ? 'PDF a tamaño real · muévelo a su lugar (sin escalarlo) y toca Listo' : 'Acomoda el PDF y toca Listo · luego dibuja encima en otra capa');
  } catch (e) { console.error(e); avisar('No se pudo abrir el PDF'); }
}

// =====================================================================
//  LOGO DEL RÓTULO (de cada cuenta: cada cliente pone el suyo)
// =====================================================================
let logoImg = null;
function cargarLogo() {
  logoImg = null; if (!aj.logo) return;
  const im = new Image(); im.onload = () => { logoImg = im; if (doc) renderObjetos(); }; im.src = aj.logo;
}
async function elegirLogo(f) {
  try {
    const b = await createImageBitmap(f), k = Math.min(1, 600 / Math.max(b.width, b.height)), cv = document.createElement('canvas');
    cv.width = Math.round(b.width * k); cv.height = Math.round(b.height * k); cv.getContext('2d').drawImage(b, 0, 0, cv.width, cv.height); b.close && b.close();
    aj.logo = cv.toDataURL('image/png'); guardarAjustes(); cargarLogo(); pintarLogoNotas();
    avisar('Logo listo: sale en el rótulo de todas tus hojas');
  } catch (e) { avisar('No se pudo usar esa imagen'); }
}
function pintarLogoNotas() {
  const b = document.getElementById('nLogo'); if (!b) return;
  b.innerHTML = aj.logo ? `<img src="${aj.logo}" alt=""><span>Cambiar logo del rótulo…</span>` : '<span>Poner mi logo en el rótulo…</span>';
  document.getElementById('nLogoQuitar').classList.toggle('oculto', !aj.logo);
}
// dibuja el logo en una caja (x, y, lado) conservando su proporción
function dibujarLogo(c, x, y, w, h) {
  if (!logoImg) return; const k = Math.min(w / logoImg.width, h / logoImg.height) * 0.86, lw = logoImg.width * k, lh = logoImg.height * k;
  c.drawImage(logoImg, x + (w - lw) / 2, y + (h - lh) / 2, lw, lh);
}
