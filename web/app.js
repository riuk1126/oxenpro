// ProDraft — bocetos para arquitectos
'use strict';
const $ = id => document.getElementById(id);
const VERSION = window.PD_VERSION && !window.PD_VERSION.startsWith('__') ? window.PD_VERSION : 'dev';
const DPR = Math.min(window.devicePixelRatio || 1, 3);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;

// =====================================================================
//  PINCELES
// =====================================================================
const CATS = ['Lápices', 'Tintas', 'Marcadores', 'Color', 'Texturas', 'Borradores'];
const PINCELES = [
  { id: 'hb', cat: 'Lápices', nombre: 'Lápiz HB', tip: 'grano', grano: 'fino', min: 1.5, max: 10, esp: 0.12, alfa: 0.34, pTam: 0.45, pAlfa: 1, incl: true },
  { id: '6b', cat: 'Lápices', nombre: 'Lápiz 6B', tip: 'grano', grano: 'fino', min: 3, max: 18, esp: 0.11, alfa: 0.55, pTam: 0.5, pAlfa: 1, incl: true },
  { id: 'porta', cat: 'Lápices', nombre: 'Portaminas 0.5', tip: 'grano', grano: 'fino', min: 1, max: 4.5, esp: 0.14, alfa: 0.8, pTam: 0.25, pAlfa: 0.75 },
  { id: 'carbon', cat: 'Lápices', nombre: 'Carboncillo', tip: 'grano', grano: 'grueso', min: 6, max: 56, esp: 0.09, alfa: 0.45, pTam: 0.5, pAlfa: 1, incl: true },
  { id: 'lcolor', cat: 'Lápices', nombre: 'Lápiz de color', tip: 'grano', grano: 'fino', min: 3, max: 16, esp: 0.11, alfa: 0.3, pTam: 0.3, pAlfa: 1, incl: true },
  { id: 'esti', cat: 'Tintas', nombre: 'Estilógrafo', tip: 'linea', min: 0.8, max: 7, pTam: 0.12 },
  { id: 'fino', cat: 'Tintas', nombre: 'Rotulador fino', tip: 'linea', min: 1.5, max: 10, pTam: 0.25 },
  { id: 'pluma', cat: 'Tintas', nombre: 'Plumilla', tip: 'linea', min: 0.6, max: 12, pTam: 1 },
  { id: 'ptinta', cat: 'Tintas', nombre: 'Pincel de tinta', tip: 'linea', min: 2, max: 46, pTam: 1 },
  { id: 'bisel', cat: 'Marcadores', nombre: 'Marcador biselado', tip: 'bisel', min: 6, max: 46, esp: 0.05, alfa: 1, pTam: 0.15, op: 0.55, mezcla: 'multiply', ang: -0.6, ratio: 0.32 },
  { id: 'mredondo', cat: 'Marcadores', nombre: 'Marcador redondo', tip: 'linea', min: 3, max: 28, pTam: 0.12, op: 0.5, mezcla: 'multiply' },
  { id: 'msombra', cat: 'Marcadores', nombre: 'Marcador de sombra', tip: 'bisel', min: 16, max: 90, esp: 0.05, alfa: 1, pTam: 0.1, op: 0.28, mezcla: 'multiply', ang: -0.6, ratio: 0.36 },
  { id: 'acuarela', cat: 'Color', nombre: 'Acuarela', tip: 'suave', dureza: 0.35, min: 10, max: 110, esp: 0.07, alfa: 0.11, pTam: 0.45, pAlfa: 0.6, op: 0.8, mezcla: 'multiply', jit: 0.18 },
  { id: 'aero', cat: 'Color', nombre: 'Aerógrafo', tip: 'suave', dureza: 0, min: 12, max: 240, esp: 0.06, alfa: 0.05, pTam: 0, pAlfa: 1 },
  { id: 'gouache', cat: 'Color', nombre: 'Gouache', tip: 'linea', min: 4, max: 70, pTam: 0.5, op: 0.95 },
  { id: 'sombra', cat: 'Color', nombre: 'Sombra suave', tip: 'suave', dureza: 0.1, min: 20, max: 200, esp: 0.06, alfa: 0.06, pTam: 0.2, pAlfa: 1, mezcla: 'multiply' },
  { id: 'textura', cat: 'Texturas', nombre: 'Pincel de textura', tip: 'textura', min: 10, max: 160, pTam: 0.2 },
  { id: 'bduro', cat: 'Borradores', nombre: 'Borrador duro', tip: 'linea', min: 2, max: 90, pTam: 0.2 },
  { id: 'bsuave', cat: 'Borradores', nombre: 'Borrador suave', tip: 'suave', dureza: 0.2, min: 10, max: 200, esp: 0.06, alfa: 0.25, pTam: 0.2, pAlfa: 1 },
  { id: 'bgrano', cat: 'Borradores', nombre: 'Borrador de grano', tip: 'grano', grano: 'fino', min: 4, max: 60, esp: 0.1, alfa: 0.5, pTam: 0.3, pAlfa: 1 },
];
const pincel = id => PINCELES.find(p => p.id === id) || PINCELES[0];

// ---------- punta suave coloreada ----------
const puntas = new Map();
function puntaSuave(color, dureza) {
  const k = color + dureza;
  if (puntas.has(k)) return puntas.get(k);
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d'), g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  const rgb = hexRgb(color);
  g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(clamp(dureza, 0, 0.95), `rgba(${rgb},1)`);
  g.addColorStop(Math.min(1, dureza + (1 - dureza) * 0.5), `rgba(${rgb},.35)`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  if (puntas.size > 30) puntas.clear();
  puntas.set(k, cv); return cv;
}
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`; }

// ---------- motor de trazo (dibuja en cualquier contexto) ----------
function crearTrazo(ctx, pin, color, tex) {
  const t = { ctx, pin, color, ult: null, falta: 0, bb: [1e9, 1e9, -1e9, -1e9] };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (pin.tip === 'grano') t.estilo = Texturas.patronGrano(ctx, pin.grano, color);
  else if (pin.tip === 'textura') t.estilo = Texturas.patron(ctx, tex.id, color, tex.escala);
  else if (pin.tip === 'suave') t.punta = puntaSuave(color, pin.dureza || 0);
  ctx.fillStyle = ctx.strokeStyle = t.estilo || color;
  return t;
}
function bbAmpliar(bb, x, y, r) {
  if (x - r < bb[0]) bb[0] = x - r; if (y - r < bb[1]) bb[1] = y - r;
  if (x + r > bb[2]) bb[2] = x + r; if (y + r > bb[3]) bb[3] = y + r;
}
function dab(t, x, y, s, a) {
  const c = t.ctx, pin = t.pin;
  if (pin.jit) { const j = pin.jit; x += (Math.random() - 0.5) * s * j; y += (Math.random() - 0.5) * s * j; s *= 1 + (Math.random() - 0.5) * j; }
  c.globalAlpha = clamp(a, 0, 1);
  if (pin.tip === 'grano') { c.beginPath(); c.arc(x, y, Math.max(0.4, s / 2), 0, 6.2832); c.fill(); }
  else if (pin.tip === 'suave') c.drawImage(t.punta, x - s / 2, y - s / 2, s, s);
  else if (pin.tip === 'bisel') {
    const an = pin.ang, co = Math.cos(an), si = Math.sin(an), h = s * pin.ratio;
    c.setTransform(co, si, -si, co, x, y); c.fillRect(-s / 2, -h / 2, s, h); c.setTransform(1, 0, 0, 1, 0, 0);
  }
}
function trazoPunto(t, p) {
  const pin = t.pin;
  bbAmpliar(t.bb, p.x, p.y, p.s * (pin.jit ? 0.9 : 0.6) + 2);
  const q = t.ult;
  if (pin.tip === 'linea' || pin.tip === 'textura') {
    const c = t.ctx; c.globalAlpha = 1;
    c.lineWidth = q ? (q.s + p.s) / 2 : p.s;
    c.beginPath(); c.moveTo(q ? q.x : p.x, q ? q.y : p.y); c.lineTo(p.x + (q ? 0 : 0.01), p.y); c.stroke();
  } else if (!q) {
    dab(t, p.x, p.y, p.s, p.a);
    t.falta = Math.max(0.4, p.s * pin.esp);
  } else {
    const dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy);
    let u = t.falta;
    while (u <= d) {
      const f = u / d, s = lerp(q.s, p.s, f);
      dab(t, q.x + dx * f, q.y + dy * f, s, lerp(q.a, p.a, f));
      u += Math.max(0.4, s * pin.esp);
    }
    t.falta = u - d;
  }
  t.ult = p;
}

// =====================================================================
//  ESTADO
// =====================================================================
const AJ_DEF = {
  pincel: 'hb', borrador: 'bduro', color: '#1d1d1f', recientes: [], porPincel: {}, estab: 0.35,
  textura: { id: 'ladrillo', escala: 1, modo: 'textura' }, presion: 1, soloLapiz: null, zurdo: false,
};
let aj = AJ_DEF;
try { aj = Object.assign({}, AJ_DEF, JSON.parse(localStorage.getItem('pd-ajustes') || '{}')); } catch (e) {}
function guardarAjustes() { try { localStorage.setItem('pd-ajustes', JSON.stringify(aj)); } catch (e) {} }

let doc = null;          // dibujo abierto
let herramienta = 'pincel';
let herrPrevia = 'pincel';
let M = [1, 0, 0, 1, 0, 0]; // vista: matriz doc → pantalla
const deshacer = [], rehacer = [];
let bytesHist = 0;

const escenario = $('escenario'), docEl = $('doc'), capasDOM = $('capasDOM'), papelCv = $('papel'), sup = $('superpuesto');
const supCtx = sup.getContext('2d');
const trazoCv = document.createElement('canvas'); trazoCv.id = 'trazoCv';
const trazoCtx = trazoCv.getContext('2d');
const respaldo = document.createElement('canvas'); const respCtx = respaldo.getContext('2d');

// =====================================================================
//  MATRICES DE VISTA
// =====================================================================
const mMul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const mInv = A => { const d = A[0] * A[3] - A[1] * A[2]; return [A[3] / d, -A[1] / d, -A[2] / d, A[0] / d, (A[2] * A[5] - A[3] * A[4]) / d, (A[1] * A[4] - A[0] * A[5]) / d]; };
const mApl = (A, x, y) => ({ x: A[0] * x + A[2] * y + A[4], y: A[1] * x + A[3] * y + A[5] });
const escalaVista = () => Math.hypot(M[0], M[1]);
function aDoc(x, y) { return mApl(mInv(M), x, y); }
function aplicarVista() {
  docEl.style.transform = `matrix(${M.join(',')})`;
  pedirSup();
}
function ajustarPantalla() {
  const W = innerWidth, H = innerHeight, top = 50, s = Math.min((W - 120) / doc.w, (H - top - 40) / doc.h);
  M = [s, 0, 0, s, (W - doc.w * s) / 2, top + (H - top - doc.h * s) / 2];
  aplicarVista();
}
function similar(p0a, p0b, p1a, p1b) { // transformación de pantalla de un gesto con 2 dedos
  const v0x = p0b.x - p0a.x, v0y = p0b.y - p0a.y, v1x = p1b.x - p1a.x, v1y = p1b.y - p1a.y;
  const d0 = Math.hypot(v0x, v0y) || 1, d1 = Math.hypot(v1x, v1y) || 1;
  const k = d1 / d0, th = Math.atan2(v1y, v1x) - Math.atan2(v0y, v0x);
  const c = Math.cos(th) * k, s = Math.sin(th) * k;
  const m0x = (p0a.x + p0b.x) / 2, m0y = (p0a.y + p0b.y) / 2, m1x = (p1a.x + p1b.x) / 2, m1y = (p1a.y + p1b.y) / 2;
  return [c, s, -s, c, m1x - (c * m0x - s * m0y), m1y - (s * m0x + c * m0y)];
}
function limitarEscala(N) {
  const s = Math.hypot(N[0], N[1]);
  if (s > 40 || s < 0.04) { const k = clamp(s, 0.04, 40) / s, cx = innerWidth / 2, cy = innerHeight / 2; return mMul([k, 0, 0, k, cx - k * cx, cy - k * cy], N); }
  return N;
}

// =====================================================================
//  CAPAS
// =====================================================================
let idCapa = 1;
function crearCapa(nombre, w, h) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  return { id: idCapa++, nombre, cv, ctx: cv.getContext('2d'), visible: true, op: 1, mezcla: 'normal', sucia: true, blob: null };
}
const capaActiva = () => doc.capas[doc.activa];
function estiloCapa(c) {
  c.cv.style.opacity = c.op; c.cv.style.mixBlendMode = c.mezcla === 'multiply' ? 'multiply' : 'normal';
  c.cv.style.display = c.visible ? '' : 'none';
}
function montarCapas() {
  capasDOM.innerHTML = '';
  doc.capas.forEach(c => { estiloCapa(c); capasDOM.appendChild(c.cv); });
}
function ubicarTrazoCv() {
  const c = capaActiva();
  if (c.cv.nextSibling !== trazoCv) capasDOM.insertBefore(trazoCv, c.cv.nextSibling);
}

// =====================================================================
//  HISTORIAL
// =====================================================================
function pushHist(e) {
  deshacer.push(e); rehacer.length = 0;
  bytesHist += e.bytes || 0;
  while (deshacer.length > 80 || (bytesHist > 320e6 && deshacer.length > 1)) bytesHist -= deshacer.shift().bytes || 0;
  marcarCambio();
}
function bbEntero(bb) {
  const x = clamp(Math.floor(bb[0]), 0, doc.w), y = clamp(Math.floor(bb[1]), 0, doc.h);
  const x2 = clamp(Math.ceil(bb[2]), 0, doc.w), y2 = clamp(Math.ceil(bb[3]), 0, doc.h);
  return x2 > x && y2 > y ? [x, y, x2 - x, y2 - y] : null;
}
function histPx(capa, r, antes) {
  const despues = capa.ctx.getImageData(r[0], r[1], r[2], r[3]);
  pushHist({ t: 'px', capa, x: r[0], y: r[1], antes, despues, bytes: r[2] * r[3] * 8 });
  capa.sucia = true;
}
function aplicarHist(e, atras) {
  if (e.t === 'px') { e.capa.ctx.putImageData(atras ? e.antes : e.despues, e.x, e.y); e.capa.sucia = true; }
  else if (e.t === 'nueva') { if (atras) quitarCapa(e.capa); else insertarCapa(e.capa, e.idx); }
  else if (e.t === 'borrar') { if (atras) insertarCapa(e.capa, e.idx); else quitarCapa(e.capa); }
  else if (e.t === 'mover') { moverCapaA(atras ? e.a : e.de, atras ? e.de : e.a); }
  else if (e.t === 'combinar') {
    if (atras) { e.inf.ctx.putImageData(e.antesInf, 0, 0); e.inf.sucia = true; insertarCapa(e.sup, e.idx); }
    else { quitarCapa(e.sup); e.inf.ctx.putImageData(e.despuesInf, 0, 0); e.inf.sucia = true; }
  }
}
function hacerDeshacer() {
  if (trazo) return; const e = deshacer.pop(); if (!e) return avisar('Nada que deshacer');
  aplicarHist(e, true); rehacer.push(e); avisar('Deshacer'); marcarCambio(); refrescarCapasSiAbierto();
}
function hacerRehacer() {
  if (trazo) return; const e = rehacer.pop(); if (!e) return avisar('Nada que rehacer');
  aplicarHist(e, false); deshacer.push(e); avisar('Rehacer'); marcarCambio(); refrescarCapasSiAbierto();
}
function insertarCapa(c, idx) {
  doc.capas.splice(idx, 0, c); doc.activa = doc.capas.indexOf(c); montarCapas(); ubicarTrazoCv();
}
function quitarCapa(c) {
  const i = doc.capas.indexOf(c); if (i < 0) return;
  doc.capas.splice(i, 1); doc.activa = clamp(doc.activa >= i ? doc.activa - 1 : doc.activa, 0, doc.capas.length - 1);
  montarCapas(); ubicarTrazoCv();
}
function moverCapaA(de, a) {
  const [c] = doc.capas.splice(de, 1); doc.capas.splice(a, 0, c); doc.activa = a; montarCapas(); ubicarTrazoCv();
}

// =====================================================================
//  PAPEL
// =====================================================================
const PAPELES = [
  { id: 'blanco', nombre: 'Blanco', color: '#fbfbf8' }, { id: 'crema', nombre: 'Crema', color: '#f3ecdc' },
  { id: 'kraft', nombre: 'Kraft', color: '#c9a77c' }, { id: 'mantequilla', nombre: 'Mantequilla', color: '#ecece6' },
  { id: 'gris', nombre: 'Gris medio', color: '#8f9093' }, { id: 'negro', nombre: 'Negro', color: '#1c1c1e' },
];
const papelDe = id => PAPELES.find(p => p.id === id) || PAPELES[0];
function pintarPapel() {
  papelCv.width = doc.w; papelCv.height = doc.h; papelCv.style.width = doc.w + 'px'; papelCv.style.height = doc.h + 'px';
  const c = papelCv.getContext('2d'), p = papelDe(doc.papel);
  c.fillStyle = p.color; c.fillRect(0, 0, doc.w, doc.h);
  if (doc.grano !== false) {
    c.globalAlpha = p.id === 'negro' || p.id === 'gris' ? 0.07 : 0.035;
    c.fillStyle = c.createPattern(Texturas.granoBase('grueso'), 'repeat'); c.fillRect(0, 0, doc.w, doc.h);
    c.globalAlpha = 1;
  }
}

// =====================================================================
//  ENTRADA: lápiz, dedos y ratón
// =====================================================================
let trazo = null;          // trazo en curso
const toques = new Map();  // dedos sobre la pantalla
let gesto = null, lapizAbajo = false, paneo = null, arrastreVP = null;
let espacio = false;

function presionDe(e) {
  if (e.pointerType === 'pen') { const p = e.pressure > 0 ? e.pressure : 0.5; return Math.pow(p, aj.presion); }
  return e.pointerType === 'mouse' ? 0.65 : 0.6;
}
function inclinacionDe(e) {
  if (e.pointerType !== 'pen') return 0;
  if (typeof e.altitudeAngle === 'number' && e.altitudeAngle < 1.5) return clamp(1 - e.altitudeAngle / 1.5708, 0, 1);
  return clamp(Math.hypot(e.tiltX || 0, e.tiltY || 0) / 70, 0, 1);
}
const soloLapiz = () => aj.soloLapiz === true;
function cerrarPaneles() { let a = false; document.querySelectorAll('.panel:not(.oculto)').forEach(p => { p.classList.add('oculto'); a = true; }); marcarBotones(); pedirSup(); return a; }
const panelAbierto = id => !$(id).classList.contains('oculto');

escenario.addEventListener('pointerdown', e => {
  if (!doc) return;
  e.preventDefault();
  try { escenario.setPointerCapture(e.pointerId); } catch (_) {}
  // tocar el lienzo con un panel abierto: lo cierra (salvo mover puntos de fuga)
  if (panelAbierto('pGuias') && e.pointerType !== 'touch' || panelAbierto('pGuias') && toques.size === 0) {
    const vp = vpCercano(e.clientX, e.clientY);
    if (vp >= 0) { arrastreVP = { id: e.pointerId, i: vp }; return; }
  }
  if (document.querySelector('.panel:not(.oculto)')) { cerrarPaneles(); if (e.pointerType !== 'touch') return; toques.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, ignorar: true }); return; }

  if (e.pointerType === 'pen') {
    if (aj.soloLapiz === null) { aj.soloLapiz = true; guardarAjustes(); $('chkSoloLapiz').checked = true; avisar('Lápiz detectado: el dedo ahora mueve el lienzo'); }
    lapizAbajo = true;
    if (gesto) terminarGesto(false);
    paneo = null;
    iniciarTrazo(e);
    return;
  }
  if (e.pointerType === 'mouse') {
    if (e.button === 1 || e.button === 2 || espacio) { paneo = { id: e.pointerId, x: e.clientX, y: e.clientY }; return; }
    if (e.button === 0) iniciarTrazo(e);
    return;
  }
  // ---- dedo ----
  if (lapizAbajo) return; // palma apoyada mientras se dibuja con lápiz
  toques.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
  if (toques.size === 1) {
    gestoTap = { t: performance.now(), max: 1, movido: false };
    if (!soloLapiz() || herramienta === 'gotero') iniciarTrazo(e);
    else paneo = { id: e.pointerId, x: e.clientX, y: e.clientY };
  } else {
    gestoTap.max = Math.max(gestoTap.max, toques.size);
    if (trazo && trazo.tipo === 'touch') {
      if (performance.now() - trazo.t0 < 260 || trazo.largo < 30 / escalaVista()) cancelarTrazo();
      else return;
    }
    paneo = null;
    if (toques.size === 2) iniciarGesto();
  }
}, { passive: false });

let gestoTap = { t: 0, max: 0, movido: false };

escenario.addEventListener('pointermove', e => {
  if (!doc) return;
  if (arrastreVP && arrastreVP.id === e.pointerId) {
    const d = aDoc(e.clientX, e.clientY); doc.guias.vps[doc.guias.modo][arrastreVP.i] = [d.x, d.y]; pedirSup(); return;
  }
  if (e.pointerType === 'touch') {
    const t = toques.get(e.pointerId);
    if (t) { t.x = e.clientX; t.y = e.clientY; if (Math.hypot(t.x - t.x0, t.y - t.y0) > 14) gestoTap.movido = true; }
    if (t && t.ignorar) return;
  }
  if (trazo && trazo.id === e.pointerId) { moverTrazo(e); return; }
  if (gesto && toques.size >= 2) { actualizarGesto(); return; }
  if (paneo && paneo.id === e.pointerId) {
    M = mMul([1, 0, 0, 1, e.clientX - paneo.x, e.clientY - paneo.y], M); paneo.x = e.clientX; paneo.y = e.clientY; aplicarVista();
  }
}, { passive: false });

function finPuntero(e) {
  if (!doc) return;
  if (arrastreVP && arrastreVP.id === e.pointerId) { arrastreVP = null; marcarCambio(); return; }
  if (e.pointerType === 'pen') lapizAbajo = false;
  if (trazo && trazo.id === e.pointerId) { if (e.type === 'pointercancel' && trazo.tipo === 'touch') cancelarTrazo(); else terminarTrazo(e); }
  if (paneo && paneo.id === e.pointerId) paneo = null;
  if (e.pointerType === 'touch') {
    toques.delete(e.pointerId);
    if (toques.size < 2 && gesto) terminarGesto(true);
    if (toques.size === 0) {
      const dt = performance.now() - gestoTap.t;
      if (gestoTap.max >= 2 && !gestoTap.movido && dt < 380) { gestoTap.max >= 3 ? hacerRehacer() : hacerDeshacer(); }
      gestoTap.max = 0;
    }
  }
}
escenario.addEventListener('pointerup', finPuntero);
escenario.addEventListener('pointercancel', finPuntero);
escenario.addEventListener('contextmenu', e => e.preventDefault());

escenario.addEventListener('wheel', e => {
  if (!doc) return; e.preventDefault();
  if (e.ctrlKey || !e.shiftKey && Math.abs(e.deltaX) < 1) {
    const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), x = e.clientX, y = e.clientY;
    M = limitarEscala(mMul([k, 0, 0, k, x - k * x, y - k * y], M));
  } else M = mMul([1, 0, 0, 1, -e.deltaX, -e.deltaY], M);
  aplicarVista();
}, { passive: false });

// ---- gestos de dos dedos ----
function iniciarGesto() {
  const [a, b] = [...toques.values()];
  gesto = { M0: M.slice(), a0: { x: a.x, y: a.y }, b0: { x: b.x, y: b.y } };
}
function actualizarGesto() {
  const [a, b] = [...toques.values()];
  M = limitarEscala(mMul(similar(gesto.a0, gesto.b0, a, b), gesto.M0)); aplicarVista();
}
function terminarGesto(seguir) {
  gesto = null;
  // enderezar si quedó casi derecho
  const ang = Math.atan2(M[1], M[0]);
  let objetivo = Math.round(ang / (Math.PI / 2)) * (Math.PI / 2);
  if (Math.abs(ang - objetivo) < 0.07 && Math.abs(ang - objetivo) > 1e-4) {
    const d = objetivo - ang, c = Math.cos(d), s = Math.sin(d), cx = innerWidth / 2, cy = innerHeight / 2;
    M = mMul([c, s, -s, c, cx - (c * cx - s * cy), cy - (s * cx + c * cy)], M); aplicarVista();
  }
  if (seguir && toques.size === 1 && soloLapiz()) { const [id, t] = [...toques.entries()][0]; paneo = { id, x: t.x, y: t.y }; }
}

// =====================================================================
//  TRAZOS
// =====================================================================
function opcionesPincel(id) { return aj.porPincel[id] || (aj.porPincel[id] = { tam: 0.4, op: 1 }); }
function claveAjuste() { return herramienta === 'borrador' ? 'e:' + aj.borrador : herramienta === 'relleno' ? 'relleno' : aj.pincel; }
function pincelActual() { return pincel(herramienta === 'borrador' ? aj.borrador : aj.pincel); }

function puntoDesde(e, t) {
  const d = aDoc(e.clientX, e.clientY), pin = t.pin, o = t.opc;
  let pr = presionDe(e);
  t.prS = t.prS == null ? pr : lerp(t.prS, pr, 0.55); pr = t.prS;
  let s = lerp(pin.min, pin.max, o.tam * o.tam) * (1 - pin.pTam + pin.pTam * pr);
  let a = (pin.alfa || 1) * (1 - (pin.pAlfa || 0) + (pin.pAlfa || 0) * pr);
  if (pin.incl) { const ti = inclinacionDe(e); if (ti > 0.45) { const k = (ti - 0.45) / 0.55; s *= 1 + k * 2.6; a *= 1 - k * 0.45; } }
  return { x: d.x, y: d.y, s: Math.max(0.35, s), a, pr };
}

function iniciarTrazo(e) {
  if (herramienta === 'gotero') { trazo = { id: e.pointerId, tipo: e.pointerType, gotero: true, t0: performance.now(), largo: 0 }; tomarColor(e); return; }
  const capa = capaActiva();
  if (!capa.visible) { avisar('La capa está oculta'); return; }
  ubicarTrazoCv();
  const borrar = herramienta === 'borrador';
  const t = { id: e.pointerId, tipo: e.pointerType, t0: performance.now(), largo: 0, capa, borrar, pts: [], raw: [] };
  if (herramienta === 'relleno') {
    t.lazo = true; t.modo = aj.textura.modo; t.opc = opcionesPincel('relleno');
    const d = aDoc(e.clientX, e.clientY); t.pts.push(d); t.bb = [d.x, d.y, d.x, d.y];
    trazoCv.style.opacity = t.modo === 'borrar' ? 0.35 : t.opc.op; trazoCv.style.mixBlendMode = 'normal';
    trazo = t; pedirSup(); return;
  }
  t.pin = pincelActual(); t.opc = opcionesPincel(claveAjuste());
  t.op = t.opc.op * (borrar ? 1 : (t.pin.op || 1));
  t.motor = crearTrazo(trazoCtx, t.pin, borrar ? '#000000' : aj.color, aj.textura);
  if (borrar) {
    trazoCv.style.opacity = 0;
    respaldo.width !== doc.w && (respaldo.width = doc.w); respaldo.height !== doc.h && (respaldo.height = doc.h);
    respCtx.clearRect(0, 0, doc.w, doc.h); respCtx.drawImage(capa.cv, 0, 0);
  } else {
    trazoCv.style.opacity = t.op * capa.op; trazoCv.style.mixBlendMode = t.pin.mezcla === 'multiply' ? 'multiply' : 'normal';
  }
  const p = puntoDesde(e, t);
  t.f = { x: p.x, y: p.y }; t.inicio = p;
  t.asist = herramienta === 'pincel' && doc.guias.asist && doc.guias.modo !== 'ninguna';
  t.raw.push(p);
  trazo = t;
  if (!t.asist) agregarPunto(t, p);
  armarQuickShape(t, e);
}

function moverTrazo(e) {
  const t = trazo;
  if (t.gotero) { tomarColor(e); return; }
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
  const lista = evs && evs.length ? evs : [e];
  if (t.lazo) {
    for (const ev of lista) { const d = aDoc(ev.clientX, ev.clientY); const l = t.pts[t.pts.length - 1]; if (Math.hypot(d.x - l.x, d.y - l.y) > 1.5 / escalaVista()) { t.pts.push(d); bbAmpliar(t.bb, d.x, d.y, 0); } }
    previaLazo(t); return;
  }
  for (const ev of lista) {
    const p = puntoDesde(ev, t);
    t.raw.push(p);
    if (t.forma) continue;
    if (t.asist && !t.dir) {
      const dx = p.x - t.inicio.x, dy = p.y - t.inicio.y;
      if (Math.hypot(dx, dy) * escalaVista() < 12) continue;
      t.dir = direccionGuia(t.inicio, dx, dy);
      agregarPunto(t, t.inicio);
    }
    agregarPunto(t, p);
  }
  if (t.forma && t.forma.tipo === 'linea') { const p = t.raw[t.raw.length - 1]; t.forma.b = enderezarFin(t.forma.a, { x: p.x, y: p.y }); dibujarForma(t); }
  reiniciarQuickShape(t, e);
  if (t.borrar) pedirBorrador();
}

function agregarPunto(t, p) {
  let x = p.x, y = p.y;
  if (t.dir) { const o = t.inicio, k = (x - o.x) * t.dir[0] + (y - o.y) * t.dir[1]; x = o.x + t.dir[0] * k; y = o.y + t.dir[1] * k; }
  else if (t.pts.length) { const k = aj.estab; t.f.x = lerp(x, t.f.x, k); t.f.y = lerp(y, t.f.y, k); x = t.f.x; y = t.f.y; }
  const q = t.pts[t.pts.length - 1];
  if (q) t.largo += Math.hypot(x - q.x, y - q.y);
  const np = { x, y, s: p.s, a: p.a, pr: p.pr };
  t.pts.push(np);
  trazoPunto(t.motor, np);
}

function terminarTrazo(e) {
  const t = trazo; trazo = null; clearTimeout(qsTimer);
  if (!t) return;
  if (t.gotero) { ponerColor(aj.color); if (herrPrevia !== 'gotero') elegirHerramienta(herrPrevia); return; }
  if (t.lazo) { aplicarLazo(t); return; }
  // completar la estabilización: alcanzar el último punto real
  if (!t.forma && !t.dir && t.raw.length > 1 && aj.estab > 0.05) {
    const last = t.raw[t.raw.length - 1];
    for (let i = 1; i <= 6; i++) { const f = i / 6; trazoPunto(t.motor, { x: lerp(t.f.x, last.x, f), y: lerp(t.f.y, last.y, f), s: last.s, a: last.a }); }
  }
  if (t.asist && !t.dir && !t.pts.length) agregarPunto(t, t.inicio);
  const r = bbEntero(t.motor.bb); if (!r) { trazoCtx.clearRect(0, 0, doc.w, doc.h); return; }
  const capa = t.capa, c = capa.ctx;
  if (t.borrar) {
    cancelAnimationFrame(rafBorr); rafBorr = 0;
    const antes = respCtx.getImageData(r[0], r[1], r[2], r[3]);
    c.save(); c.clearRect(r[0], r[1], r[2], r[3]); c.drawImage(respaldo, r[0], r[1], r[2], r[3], r[0], r[1], r[2], r[3]);
    c.globalCompositeOperation = 'destination-out'; c.globalAlpha = t.op; c.drawImage(trazoCv, r[0], r[1], r[2], r[3], r[0], r[1], r[2], r[3]); c.restore();
    histPx(capa, r, antes);
  } else {
    const antes = c.getImageData(r[0], r[1], r[2], r[3]);
    c.save(); c.globalAlpha = t.op; c.globalCompositeOperation = t.pin.mezcla === 'multiply' ? 'multiply' : 'source-over';
    c.drawImage(trazoCv, r[0], r[1], r[2], r[3], r[0], r[1], r[2], r[3]); c.restore();
    histPx(capa, r, antes);
  }
  trazoCtx.clearRect(r[0] - 2, r[1] - 2, r[2] + 4, r[3] + 4);
  trazoCv.style.opacity = 0;
}

function cancelarTrazo() {
  const t = trazo; trazo = null; clearTimeout(qsTimer); if (!t) return;
  if (t.borrar) {
    cancelAnimationFrame(rafBorr); rafBorr = 0;
    const r = bbEntero(t.motor.bb);
    if (r) { const c = t.capa.ctx; c.clearRect(r[0], r[1], r[2], r[3]); c.drawImage(respaldo, r[0], r[1], r[2], r[3], r[0], r[1], r[2], r[3]); }
  }
  trazoCtx.clearRect(0, 0, doc.w, doc.h); pedirSup();
}

// ---- vista previa del borrador (sobre la capa misma) ----
let rafBorr = 0;
function pedirBorrador() { if (!rafBorr) rafBorr = requestAnimationFrame(vistaBorrador); }
function vistaBorrador() {
  rafBorr = 0; const t = trazo; if (!t || !t.borrar) return;
  const r = bbEntero(t.motor.bb); if (!r) return;
  const c = t.capa.ctx; c.save(); c.clearRect(r[0], r[1], r[2], r[3]); c.drawImage(respaldo, r[0], r[1], r[2], r[3], r[0], r[1], r[2], r[3]);
  c.globalCompositeOperation = 'destination-out'; c.globalAlpha = t.op; c.drawImage(trazoCv, r[0], r[1], r[2], r[3], r[0], r[1], r[2], r[3]); c.restore();
}

// ---- relleno con lazo ----
function estiloRelleno(ctx) {
  if (aj.textura.modo === 'textura') return Texturas.patron(ctx, aj.textura.id, aj.color, aj.textura.escala);
  if (aj.textura.modo === 'borrar') return '#ff4d4d';
  return aj.color;
}
function caminoLazo(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); }
function previaLazo(t) {
  const r = bbEntero([t.bb[0] - 4, t.bb[1] - 4, t.bb[2] + 4, t.bb[3] + 4]);
  if (r) trazoCtx.clearRect(r[0], r[1], r[2], r[3]);
  trazoCtx.globalAlpha = 1; trazoCtx.globalCompositeOperation = 'source-over';
  trazoCtx.fillStyle = estiloRelleno(trazoCtx); caminoLazo(trazoCtx, t.pts); trazoCtx.fill();
  pedirSup();
}
function aplicarLazo(t) {
  trazoCtx.clearRect(0, 0, doc.w, doc.h); trazoCv.style.opacity = 0; pedirSup();
  if (t.pts.length < 3) return;
  const r = bbEntero([t.bb[0] - 2, t.bb[1] - 2, t.bb[2] + 2, t.bb[3] + 2]); if (!r) return;
  const capa = t.capa, c = capa.ctx, antes = c.getImageData(r[0], r[1], r[2], r[3]);
  c.save();
  if (t.modo === 'borrar') { c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; }
  else { c.globalAlpha = t.opc.op; c.fillStyle = estiloRelleno(c); }
  caminoLazo(c, t.pts); c.fill(); c.restore();
  histPx(capa, r, antes);
}

// ---- gotero ----
const muestraCv = document.createElement('canvas'); muestraCv.width = muestraCv.height = 1;
const muestraCtx = muestraCv.getContext('2d', { willReadFrequently: true });
function tomarColor(e) {
  const d = aDoc(e.clientX, e.clientY); if (d.x < 0 || d.y < 0 || d.x >= doc.w || d.y >= doc.h) return;
  const x = Math.floor(d.x), y = Math.floor(d.y);
  muestraCtx.globalAlpha = 1; muestraCtx.globalCompositeOperation = 'source-over';
  muestraCtx.drawImage(papelCv, x, y, 1, 1, 0, 0, 1, 1);
  for (const c of doc.capas) if (c.visible) {
    muestraCtx.globalAlpha = c.op; muestraCtx.globalCompositeOperation = c.mezcla === 'multiply' ? 'multiply' : 'source-over';
    muestraCtx.drawImage(c.cv, x, y, 1, 1, 0, 0, 1, 1);
  }
  const p = muestraCtx.getImageData(0, 0, 1, 1).data;
  ponerColor('#' + [p[0], p[1], p[2]].map(v => v.toString(16).padStart(2, '0')).join(''), true);
}

// =====================================================================
//  QUICKSHAPE: mantener quieto al final para enderezar
// =====================================================================
let qsTimer = 0;
function armarQuickShape(t, e) { t.qsX = e.clientX; t.qsY = e.clientY; clearTimeout(qsTimer); qsTimer = setTimeout(() => intentarForma(t), 520); }
function reiniciarQuickShape(t, e) {
  if (t.forma) return;
  if (Math.hypot(e.clientX - t.qsX, e.clientY - t.qsY) > 5) armarQuickShape(t, e);
}
function intentarForma(t) {
  if (trazo !== t || t.forma || t.dir || t.pts.length < 6 || t.largo * escalaVista() < 40) return;
  const f = detectarForma(t.pts); if (!f) return;
  t.forma = f; dibujarForma(t);
  avisar({ linea: 'Línea recta', elipse: 'Elipse', circulo: 'Círculo', rect: 'Rectángulo' }[f.tipo]);
}
function detectarForma(pts) {
  const n = pts.length, a = pts[0], b = pts[n - 1];
  let L = 0, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < n; i++) { const p = pts[i]; if (i) L += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y); x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  const cuerda = Math.hypot(b.x - a.x, b.y - a.y);
  if (cuerda > 0.78 * L) {
    let dev = 0; const ux = (b.x - a.x) / cuerda, uy = (b.y - a.y) / cuerda;
    for (const p of pts) dev = Math.max(dev, Math.abs((p.x - a.x) * uy - (p.y - a.y) * ux));
    if (dev < 0.08 * cuerda + 3) return { tipo: 'linea', a: { x: a.x, y: a.y }, b: enderezarFin(a, b) };
  }
  const rx = (x1 - x0) / 2, ry = (y1 - y0) / 2;
  if (cuerda < 0.25 * L && rx > 6 && ry > 6) {
    const cx = x0 + rx, cy = y0 + ry, m = Math.min(rx, ry);
    let eE = 0, eR = 0;
    for (const p of pts) {
      eE += Math.abs(Math.hypot((p.x - cx) / rx, (p.y - cy) / ry) - 1);
      eR += Math.min(Math.abs(p.x - x0), Math.abs(p.x - x1), Math.abs(p.y - y0), Math.abs(p.y - y1)) / m;
    }
    eE /= n; eR /= n;
    if (Math.min(eE, eR) > 0.2) return null;
    if (eR < eE) return { tipo: 'rect', x0, y0, x1, y1 };
    if (Math.abs(rx - ry) / Math.max(rx, ry) < 0.13) { const r = (rx + ry) / 2; return { tipo: 'circulo', cx, cy, rx: r, ry: r }; }
    return { tipo: 'elipse', cx, cy, rx, ry };
  }
  return null;
}
function enderezarFin(a, b) { // ángulos de 0/45/90° cuando está cerca
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), an = Math.atan2(dy, dx), paso = Math.PI / 4, obj = Math.round(an / paso) * paso;
  if (Math.abs(an - obj) < 0.07) return { x: a.x + Math.cos(obj) * L, y: a.y + Math.sin(obj) * L };
  return { x: b.x, y: b.y };
}
function dibujarForma(t) {
  const f = t.forma, bb = t.motor.bb, r = bbEntero([bb[0] - 4, bb[1] - 4, bb[2] + 4, bb[3] + 4]);
  if (r) trazoCtx.clearRect(r[0], r[1], r[2], r[3]);
  let s = 0, a = 0; for (const p of t.pts) { s += p.s; a += p.a; } s /= t.pts.length; a /= t.pts.length;
  const viejo = t.motor.bb;
  t.motor = crearTrazo(trazoCtx, t.pin, t.borrar ? '#000000' : aj.color, aj.textura);
  bbAmpliar(t.motor.bb, viejo[0], viejo[1], 0); bbAmpliar(t.motor.bb, viejo[2], viejo[3], 0); // para limpiar bien
  const pts = [];
  if (f.tipo === 'linea') { const L = Math.hypot(f.b.x - f.a.x, f.b.y - f.a.y), n = Math.max(2, Math.ceil(L / 2)); for (let i = 0; i <= n; i++) pts.push([lerp(f.a.x, f.b.x, i / n), lerp(f.a.y, f.b.y, i / n)]); }
  else if (f.tipo === 'rect') { const c = [[f.x0, f.y0], [f.x1, f.y0], [f.x1, f.y1], [f.x0, f.y1], [f.x0, f.y0]]; for (let k = 0; k < 4; k++) { const [p, q] = [c[k], c[k + 1]], n = Math.max(2, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 2)); for (let i = 0; i < n; i++) pts.push([lerp(p[0], q[0], i / n), lerp(p[1], q[1], i / n)]); } pts.push(c[4]); }
  else { const n = Math.max(24, Math.ceil(Math.PI * (f.rx + f.ry) / 2)), a0 = Math.atan2(t.pts[0].y - f.cy, t.pts[0].x - f.cx); for (let i = 0; i <= n; i++) { const an = a0 + i / n * 6.2832; pts.push([f.cx + Math.cos(an) * f.rx, f.cy + Math.sin(an) * f.ry]); } }
  for (const [x, y] of pts) trazoPunto(t.motor, { x, y, s, a });
  if (t.borrar) pedirBorrador();
}

// =====================================================================
//  GUÍAS DE PERSPECTIVA
// =====================================================================
const MODOS_GUIA = [
  { id: 'ninguna', nombre: 'Ninguna' }, { id: 'cuadricula', nombre: 'Cuadrícula' }, { id: 'isometrica', nombre: 'Isométrica' },
  { id: 'p1', nombre: '1 punto' }, { id: 'p2', nombre: '2 puntos' }, { id: 'p3', nombre: '3 puntos' },
];
function guiasPorDefecto(w, h) {
  return { modo: 'ninguna', asist: true, op: 0.55, tam: 80, vps: {
    p1: [[w * 0.5, h * 0.42]], p2: [[-w * 0.15, h * 0.42], [w * 1.15, h * 0.42]], p3: [[-w * 0.15, h * 0.3], [w * 1.15, h * 0.3], [w * 0.5, h * 2.4]],
  } };
}
function direccionGuia(o, dx, dy) {
  const g = doc.guias, cands = [];
  const ang = a => [Math.cos(a), Math.sin(a)];
  if (g.modo === 'cuadricula') cands.push(ang(0), ang(Math.PI / 2));
  if (g.modo === 'isometrica') cands.push(ang(Math.PI / 6), ang(-Math.PI / 6), ang(Math.PI / 2));
  if (g.modo === 'p1' || g.modo === 'p2' || g.modo === 'p3') {
    for (const [vx, vy] of g.vps[g.modo]) { const L = Math.hypot(vx - o.x, vy - o.y); if (L > 1) cands.push([(vx - o.x) / L, (vy - o.y) / L]); }
    if (g.modo === 'p1') cands.push(ang(0), ang(Math.PI / 2));
    if (g.modo === 'p2') cands.push(ang(Math.PI / 2));
  }
  const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  let mejor = cands[0], m = -1;
  for (const c of cands) { const d = Math.abs(c[0] * ux + c[1] * uy); if (d > m) { m = d; mejor = c; } }
  return mejor;
}
function vpCercano(x, y) {
  const g = doc.guias, v = g.vps[g.modo]; if (!v) return -1;
  for (let i = 0; i < v.length; i++) { const p = mApl(M, v[i][0], v[i][1]); if (Math.hypot(p.x - x, p.y - y) < 30) return i; }
  return -1;
}

// ---- capa superpuesta en pantalla (guías, lazo, puntos de fuga) ----
let rafSup = 0;
function pedirSup() { if (!rafSup) rafSup = requestAnimationFrame(dibujarSup); }
function tamSup() { sup.width = innerWidth * DPR; sup.height = innerHeight * DPR; sup.style.width = innerWidth + 'px'; sup.style.height = innerHeight + 'px'; pedirSup(); }
function dibujarSup() {
  rafSup = 0; const c = supCtx;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, sup.width, sup.height);
  if (!doc) return;
  const g = doc.guias, s = escalaVista();
  if (g.modo !== 'ninguna') {
    c.setTransform(DPR * M[0], DPR * M[1], DPR * M[2], DPR * M[3], DPR * M[4], DPR * M[5]);
    c.save(); c.beginPath(); c.rect(0, 0, doc.w, doc.h); c.clip();
    const oscuro = ['negro', 'gris', 'kraft'].includes(doc.papel);
    c.strokeStyle = oscuro ? `rgba(160,230,40,${g.op})` : `rgba(70,140,0,${g.op})`;
    c.lineWidth = 1 / s; c.beginPath();
    const W = doc.w, H = doc.h, t = g.tam;
    if (g.modo === 'cuadricula') {
      for (let x = 0; x <= W; x += t) { c.moveTo(x, 0); c.lineTo(x, H); }
      for (let y = 0; y <= H; y += t) { c.moveTo(0, y); c.lineTo(W, y); }
    } else if (g.modo === 'isometrica') {
      const k = Math.tan(Math.PI / 6), dy = t / Math.cos(Math.PI / 6);
      for (let b = -W * k; b <= H + W * k; b += dy) { c.moveTo(0, b); c.lineTo(W, b + W * k); c.moveTo(0, b); c.lineTo(W, b - W * k); }
      for (let x = 0; x <= W; x += t) { c.moveTo(x, 0); c.lineTo(x, H); }
    } else {
      const vps = g.vps[g.modo], R = (W + H) * 4, n = Math.round(clamp(5400 / t, 24, 160));
      for (const [vx, vy] of vps) for (let i = 0; i < n; i++) { const a = i / n * 6.2832; c.moveTo(vx, vy); c.lineTo(vx + Math.cos(a) * R, vy + Math.sin(a) * R); }
      if (g.modo === 'p1') for (let x = 0; x <= W; x += t * 2) { c.moveTo(x, 0); c.lineTo(x, H); }
      if (g.modo === 'p2') for (let x = 0; x <= W; x += t * 2) { c.moveTo(x, 0); c.lineTo(x, H); }
    }
    c.stroke();
    if (g.modo[0] === 'p') { // horizonte
      const v = g.vps[g.modo]; c.lineWidth = 2 / s; c.strokeStyle = oscuro ? 'rgba(160,230,40,.9)' : 'rgba(70,140,0,.85)'; c.beginPath();
      if (g.modo === 'p1') { c.moveTo(-1e5, v[0][1]); c.lineTo(1e5, v[0][1]); }
      else { const [a, b] = v, dx = b[0] - a[0], dy = b[1] - a[1]; c.moveTo(a[0] - dx * 50, a[1] - dy * 50); c.lineTo(b[0] + dx * 50, b[1] + dy * 50); }
      c.stroke();
    }
    c.restore();
    if (g.modo[0] === 'p') { // puntos de fuga (manijas)
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
      const editable = panelAbierto('pGuias');
      for (const [vx, vy] of g.vps[g.modo]) {
        const p = mApl(M, vx, vy);
        c.beginPath(); c.arc(p.x, p.y, editable ? 13 : 6, 0, 6.2832);
        c.fillStyle = editable ? 'rgba(138,207,0,.95)' : 'rgba(138,207,0,.7)'; c.fill();
        c.lineWidth = 2; c.strokeStyle = '#0b0b0c'; c.stroke();
      }
    }
  }
  if (trazo && trazo.lazo && trazo.pts.length > 1) {
    c.setTransform(DPR, 0, 0, DPR, 0, 0); c.beginPath();
    trazo.pts.forEach((p, i) => { const q = mApl(M, p.x, p.y); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); });
    c.closePath(); c.setLineDash([6, 5]); c.lineWidth = 1.5; c.strokeStyle = '#8ACF00'; c.stroke(); c.setLineDash([]);
  }
}

// =====================================================================
//  INTERFAZ
// =====================================================================
let avisoT = 0;
function avisar(txt) {
  const a = $('aviso'); a.textContent = txt; a.classList.remove('oculto');
  clearTimeout(avisoT); avisoT = setTimeout(() => a.classList.add('oculto'), 1300);
}
function elegirHerramienta(h) {
  if (h !== 'gotero') herrPrevia = h;
  herramienta = h; marcarBotones(); actualizarSliders();
}
function marcarBotones() {
  document.querySelectorAll('.herr').forEach(b => b.classList.toggle('activo', b.dataset.h === herramienta));
  $('bGotero2').classList.toggle('activo', herramienta === 'gotero');
  $('bCapas').classList.toggle('activo', panelAbierto('pCapas'));
  $('bGuias').classList.toggle('activo', doc && doc.guias.modo !== 'ninguna' || panelAbierto('pGuias'));
  $('bMenu').classList.toggle('activo', panelAbierto('pMenu'));
}
function abrirPanel(id, ancla) {
  const p = $(id), abierto = !p.classList.contains('oculto');
  cerrarPaneles();
  if (abierto) return;
  p.classList.remove('oculto');
  const izq = ancla && ancla.getBoundingClientRect().left < innerWidth / 2;
  p.classList.toggle('izq', !!izq);
  marcarBotones(); pedirSup();
}
document.querySelectorAll('.herr').forEach(b => b.addEventListener('click', () => {
  const h = b.dataset.h;
  if (herramienta === h && h !== 'gotero') {
    if (h === 'relleno') { abrirPanel('pTexturas', b); pintarTexturas(); }
    else { abrirPanel('pPinceles', b); pintarPinceles(); }
  } else { cerrarPaneles(); elegirHerramienta(h); }
}));
$('bGotero2').addEventListener('click', () => elegirHerramienta(herramienta === 'gotero' ? herrPrevia : 'gotero'));
$('bDeshacer').addEventListener('click', hacerDeshacer);
$('bRehacer').addEventListener('click', hacerRehacer);
$('bCapas').addEventListener('click', e => { abrirPanel('pCapas', e.currentTarget); pintarCapas(); });
$('bColor').addEventListener('click', e => { abrirPanel('pColor', e.currentTarget); pintarColorPanel(); });
$('bGuias').addEventListener('click', e => { abrirPanel('pGuias', e.currentTarget); pintarGuiasPanel(); });
$('bMenu').addEventListener('click', e => abrirPanel('pMenu', e.currentTarget));
$('bGaleria').addEventListener('click', () => { history.back(); });

// ---------- deslizadores verticales ----------
function slider(el, obtener, poner, burbuja) {
  const relleno = el.querySelector('.vs-relleno'), mango = el.querySelector('.vs-mango');
  const pintar = () => { const v = obtener(); relleno.style.height = v * 100 + '%'; mango.style.bottom = v * 100 + '%'; };
  let act = false;
  const desde = e => { const r = el.getBoundingClientRect(); poner(clamp(1 - (e.clientY - r.top) / r.height, 0, 1)); pintar(); burbuja(); };
  el.addEventListener('pointerdown', e => { act = true; el.setPointerCapture(e.pointerId); desde(e); $('burbuja').classList.remove('oculto'); });
  el.addEventListener('pointermove', e => act && desde(e));
  const fin = () => { if (!act) return; act = false; $('burbuja').classList.add('oculto'); guardarAjustes(); };
  el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin);
  return pintar;
}
const pintarTam = slider($('sTamano'), () => opcionesPincel(claveAjuste()).tam, v => { opcionesPincel(claveAjuste()).tam = Math.max(0.01, v); }, () => {
  const pin = herramienta === 'relleno' ? null : pincelActual(), o = opcionesPincel(claveAjuste());
  const d = pin ? lerp(pin.min, pin.max, o.tam * o.tam) * escalaVista() : 20;
  const pt = $('burbujaPunto'); const dd = clamp(d, 2, 200); pt.style.width = pt.style.height = dd + 'px';
  pt.style.background = herramienta === 'borrador' ? '#fff' : aj.color; pt.style.opacity = 1;
  $('burbujaTxt').textContent = pin ? Math.round(lerp(pin.min, pin.max, o.tam * o.tam) * 10) / 10 + ' px' : '';
});
const pintarOp = slider($('sOpacidad'), () => opcionesPincel(claveAjuste()).op, v => { opcionesPincel(claveAjuste()).op = Math.max(0.02, v); }, () => {
  const o = opcionesPincel(claveAjuste()), pt = $('burbujaPunto');
  pt.style.width = pt.style.height = '60px'; pt.style.background = herramienta === 'borrador' ? '#fff' : aj.color; pt.style.opacity = o.op;
  $('burbujaTxt').textContent = Math.round(o.op * 100) + ' %';
});
function actualizarSliders() { pintarTam(); pintarOp(); }

// ---------- panel de pinceles ----------
let catActual = null;
function vistaPincel(cv, pin) {
  const w = cv.clientWidth || 240, h = 46; cv.width = w * DPR; cv.height = h * DPR;
  const c = cv.getContext('2d'); c.scale(DPR, DPR);
  const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
  const tc = tmp.getContext('2d'), t = crearTrazo(tc, pin, pin.cat === 'Borradores' ? '#9a9a9a' : '#1d1d1f', aj.textura);
  const tam = Math.min(lerp(pin.min, pin.max, 0.35), h * 0.45);
  for (let i = 0; i <= 80; i++) {
    const f = i / 80, x = 14 + f * (w - 28), y = h / 2 + Math.sin(f * 6.2832) * h * 0.22;
    const pr = Math.sin(f * Math.PI);
    trazoPunto(t, { x, y, s: Math.max(0.5, tam * (1 - pin.pTam + pin.pTam * pr)), a: (pin.alfa || 1) * (1 - (pin.pAlfa || 0) + (pin.pAlfa || 0) * pr) });
  }
  c.globalAlpha = pin.op || 1; c.globalCompositeOperation = pin.mezcla === 'multiply' ? 'multiply' : 'source-over'; c.drawImage(tmp, 0, 0);
}
function pintarPinceles() {
  const actual = herramienta === 'borrador' ? aj.borrador : aj.pincel;
  if (!catActual) catActual = pincel(actual).cat;
  $('pinCats').innerHTML = CATS.map(c => `<button data-c="${c}" class="${c === catActual ? 'activo' : ''}">${c}</button>`).join('');
  const lista = $('pinLista'); lista.innerHTML = '';
  for (const p of PINCELES.filter(p => p.cat === catActual)) {
    const b = document.createElement('button'); b.className = 'pin-item' + (p.id === actual ? ' activo' : '');
    b.innerHTML = `<span>${p.nombre}</span><canvas></canvas>`;
    b.onclick = () => {
      if (herramienta === 'borrador') aj.borrador = p.id; else aj.pincel = p.id;
      guardarAjustes(); actualizarSliders(); pintarPinceles();
    };
    lista.appendChild(b);
    requestAnimationFrame(() => vistaPincel(b.querySelector('canvas'), p));
  }
  $('pinCats').querySelectorAll('button').forEach(b => b.onclick = () => { catActual = b.dataset.c; pintarPinceles(); });
  $('rEstab').value = aj.estab; $('vEstab').textContent = Math.round(aj.estab * 100) + '%';
}
$('rEstab').addEventListener('input', e => { aj.estab = +e.target.value; $('vEstab').textContent = Math.round(aj.estab * 100) + '%'; guardarAjustes(); });

// ---------- panel de texturas ----------
function pintarTexturas() {
  document.querySelectorAll('#segRelleno button').forEach(b => b.classList.toggle('activo', b.dataset.v === aj.textura.modo));
  const g = $('texGrid'); g.innerHTML = '';
  for (const t of Texturas.lista) {
    const b = document.createElement('button'); b.className = 'tex-item' + (t.id === aj.textura.id ? ' activo' : '');
    b.innerHTML = `<canvas width="${120 * DPR}" height="${120 * DPR}"></canvas><span>${t.nombre}</span>`;
    const c = b.querySelector('canvas').getContext('2d'); c.fillStyle = '#fbfbf8'; c.fillRect(0, 0, 999, 999);
    c.fillStyle = Texturas.patron(c, t.id, '#2b2b2b', DPR * 0.6 * aj.textura.escala); c.fillRect(0, 0, 999, 999);
    b.onclick = () => { aj.textura.id = t.id; if (aj.textura.modo !== 'textura') aj.textura.modo = 'textura'; guardarAjustes(); pintarTexturas(); };
    g.appendChild(b);
  }
  $('rEscala').value = aj.textura.escala; $('vEscala').textContent = aj.textura.escala.toFixed(2) + '×';
}
document.querySelectorAll('#segRelleno button').forEach(b => b.onclick = () => { aj.textura.modo = b.dataset.v; guardarAjustes(); pintarTexturas(); });
$('rEscala').addEventListener('input', e => { aj.textura.escala = +e.target.value; $('vEscala').textContent = aj.textura.escala.toFixed(2) + '×'; });
$('rEscala').addEventListener('change', () => { guardarAjustes(); pintarTexturas(); });

// ---------- panel de capas ----------
function refrescarCapasSiAbierto() { if (panelAbierto('pCapas')) pintarCapas(); }
function pintarCapas() {
  const l = $('listaCapas'); l.innerHTML = '';
  for (let i = doc.capas.length - 1; i >= 0; i--) {
    const c = doc.capas[i], d = document.createElement('div');
    d.className = 'capa' + (i === doc.activa ? ' activo' : '') + (c.visible ? '' : ' escondida');
    d.innerHTML = `<canvas width="128" height="92"></canvas><div class="c-nom">${escapar(c.nombre)}<small>${Math.round(c.op * 100)}%${c.mezcla === 'multiply' ? ' · Multiplicar' : ''}</small></div>
      <div class="c-ord"><button data-a="sub" title="Subir"><svg><use href="#i-arriba"/></svg></button><button data-a="baj" title="Bajar"><svg><use href="#i-abajo"/></svg></button></div>
      <button class="c-vis" data-a="vis"><svg><use href="#i-${c.visible ? 'ojo' : 'ojo-no'}"/></svg></button>`;
    const m = d.querySelector('canvas').getContext('2d'), k = Math.min(128 / doc.w, 92 / doc.h);
    m.drawImage(c.cv, (128 - doc.w * k) / 2, (92 - doc.h * k) / 2, doc.w * k, doc.h * k);
    d.onclick = ev => {
      const a = ev.target.closest('button')?.dataset.a;
      if (a === 'vis') { c.visible = !c.visible; estiloCapa(c); marcarCambio(); }
      else if (a === 'sub' && i < doc.capas.length - 1) { moverCapaA(i, i + 1); pushHist({ t: 'mover', de: i, a: i + 1 }); }
      else if (a === 'baj' && i > 0) { moverCapaA(i, i - 1); pushHist({ t: 'mover', de: i, a: i - 1 }); }
      else if (!a) { if (i === doc.activa) renombrarCapa(c); doc.activa = i; ubicarTrazoCv(); }
      pintarCapas();
    };
    l.appendChild(d);
  }
  const c = capaActiva();
  $('rCapaOp').value = c.op; $('vCapaOp').textContent = Math.round(c.op * 100) + '%';
  document.querySelectorAll('#segMezcla button').forEach(b => b.classList.toggle('activo', b.dataset.v === c.mezcla));
}
const MAX_CAPAS = 16;
$('bCapaNueva').onclick = () => {
  if (doc.capas.length >= MAX_CAPAS) return avisar('Máximo ' + MAX_CAPAS + ' capas');
  const c = crearCapa('Capa ' + (doc.capas.length + 1), doc.w, doc.h), idx = doc.activa + 1;
  insertarCapa(c, idx); pushHist({ t: 'nueva', capa: c, idx }); pintarCapas();
};
$('cDuplicar').onclick = () => {
  if (doc.capas.length >= MAX_CAPAS) return avisar('Máximo ' + MAX_CAPAS + ' capas');
  const o = capaActiva(), c = crearCapa(o.nombre + ' copia', doc.w, doc.h); c.ctx.drawImage(o.cv, 0, 0); c.op = o.op; c.mezcla = o.mezcla;
  const idx = doc.activa + 1; insertarCapa(c, idx); pushHist({ t: 'nueva', capa: c, idx }); pintarCapas();
};
$('cBorrar').onclick = () => {
  if (doc.capas.length <= 1) return avisar('Debe quedar al menos una capa');
  const c = capaActiva(), idx = doc.activa; quitarCapa(c); pushHist({ t: 'borrar', capa: c, idx }); pintarCapas();
};
$('cLimpiar').onclick = () => {
  const c = capaActiva(), antes = c.ctx.getImageData(0, 0, doc.w, doc.h); c.ctx.clearRect(0, 0, doc.w, doc.h);
  histPx(c, [0, 0, doc.w, doc.h], antes); pintarCapas();
};
$('cCombinar').onclick = () => {
  const i = doc.activa; if (i === 0) return avisar('No hay capa debajo');
  const s = doc.capas[i], inf = doc.capas[i - 1], antesInf = inf.ctx.getImageData(0, 0, doc.w, doc.h);
  inf.ctx.save(); inf.ctx.globalAlpha = s.op; inf.ctx.globalCompositeOperation = s.mezcla === 'multiply' ? 'multiply' : 'source-over';
  if (s.visible) inf.ctx.drawImage(s.cv, 0, 0); inf.ctx.restore();
  const despuesInf = inf.ctx.getImageData(0, 0, doc.w, doc.h);
  quitarCapa(s); doc.activa = doc.capas.indexOf(inf); inf.sucia = true;
  pushHist({ t: 'combinar', sup: s, inf, idx: i, antesInf, despuesInf, bytes: doc.w * doc.h * 8 }); pintarCapas();
};
$('rCapaOp').addEventListener('input', e => { const c = capaActiva(); c.op = +e.target.value; estiloCapa(c); $('vCapaOp').textContent = Math.round(c.op * 100) + '%'; });
$('rCapaOp').addEventListener('change', () => { marcarCambio(); pintarCapas(); });
document.querySelectorAll('#segMezcla button').forEach(b => b.onclick = () => { const c = capaActiva(); c.mezcla = b.dataset.v; estiloCapa(c); marcarCambio(); pintarCapas(); });
function renombrarCapa(c) {
  pedirTexto('Nombre de la capa', c.nombre, v => { c.nombre = v || c.nombre; marcarCambio(); pintarCapas(); });
}

// ---------- color ----------
const PALETAS = [
  { n: 'Grafito', c: ['#111111', '#2b2b2b', '#444444', '#5e5e5e', '#7a7a7a', '#979797', '#b5b5b5', '#d4d4d4', '#ffffff'] },
  { n: 'Grises fríos (marcador)', c: ['#e3e7ea', '#cfd5da', '#b9c1c8', '#a1abb3', '#8a959e', '#737f89', '#5d6873', '#47525c', '#323b44'] },
  { n: 'Grises cálidos (marcador)', c: ['#ebe6df', '#d9d2c8', '#c6bdb1', '#b1a79a', '#9b9184', '#857b6f', '#6f665b', '#594f46', '#423a32'] },
  { n: 'Materiales', c: ['#b0562f', '#c8714a', '#a87444', '#d2a46c', '#a3a29d', '#8c857b', '#6f9a4e', '#3f6b3a', '#5c93b8'] },
  { n: 'Cielo y luz', c: ['#cfe3f1', '#a9cbe6', '#7fb0d8', '#f6d9a8', '#f2b880', '#e8875f', '#ffd35a', '#8acf00', '#1b2a3a'] },
];
let hsv = [0, 0, 0.1];
function rgbHsv(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx];
}
function hsvHex(h, s, v) {
  const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return '#' + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}
function ponerColor(hex, desdeGotero) {
  aj.color = hex.toLowerCase(); $('colorActual').style.background = aj.color;
  if (!desdeGotero) { const r = aj.recientes.filter(c => c !== aj.color); r.unshift(aj.color); aj.recientes = r.slice(0, 9); }
  guardarAjustes();
  if (panelAbierto('pColor')) pintarColorPanel(true);
}
function pintarColorPanel(soloDatos) {
  if (!soloDatos) hsv = rgbHsv(aj.color);
  const sv = $('cvSV'), c = sv.getContext('2d'), W = sv.width, H = sv.height;
  c.fillStyle = hsvHex(hsv[0], 1, 1); c.fillRect(0, 0, W, H);
  let g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, '#000'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.beginPath(); c.arc(hsv[1] * W, (1 - hsv[2]) * H, 8, 0, 6.2832); c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke(); c.lineWidth = 1; c.strokeStyle = '#000'; c.stroke();
  const hu = $('cvHue'), h = hu.getContext('2d'); g = h.createLinearGradient(0, 0, hu.width, 0);
  for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, hsvHex(i * 60, 1, 1));
  h.fillStyle = g; h.fillRect(0, 0, hu.width, hu.height);
  h.beginPath(); h.rect(hsv[0] / 360 * hu.width - 3, 1, 6, hu.height - 2); h.lineWidth = 2; h.strokeStyle = '#fff'; h.stroke();
  $('colorPrev').style.background = aj.color; if (document.activeElement !== $('colorHex')) $('colorHex').value = aj.color.toUpperCase();
  const pal = [{ n: 'Recientes', c: aj.recientes }, ...PALETAS].filter(p => p.c.length);
  $('paletas').innerHTML = pal.map(p => `<div class="paleta"><b>${p.n}</b><div>${p.c.map(c => `<button data-c="${c}" style="background:${c}" class="${c === aj.color ? 'activo' : ''}"></button>`).join('')}</div></div>`).join('');
  $('paletas').querySelectorAll('button').forEach(b => b.onclick = () => { ponerColor(b.dataset.c); hsv = rgbHsv(aj.color); pintarColorPanel(true); });
}
function arrastre(el, fn) {
  let act = false;
  el.addEventListener('pointerdown', e => { act = true; el.setPointerCapture(e.pointerId); fn(e); });
  el.addEventListener('pointermove', e => act && fn(e));
  el.addEventListener('pointerup', () => { if (act) { act = false; ponerColor(aj.color); } });
}
arrastre($('cvSV'), e => { const r = $('cvSV').getBoundingClientRect(); hsv[1] = clamp((e.clientX - r.left) / r.width, 0, 1); hsv[2] = clamp(1 - (e.clientY - r.top) / r.height, 0, 1); aj.color = hsvHex(...hsv); $('colorActual').style.background = aj.color; pintarColorPanel(true); });
arrastre($('cvHue'), e => { const r = $('cvHue').getBoundingClientRect(); hsv[0] = clamp((e.clientX - r.left) / r.width, 0, 0.999) * 360; aj.color = hsvHex(...hsv); $('colorActual').style.background = aj.color; pintarColorPanel(true); });
$('colorHex').addEventListener('change', e => { let v = e.target.value.trim(); if (!v.startsWith('#')) v = '#' + v; if (/^#[0-9a-f]{6}$/i.test(v)) { ponerColor(v); pintarColorPanel(); } });

// ---------- guías ----------
function pintarGuiasPanel() {
  const g = doc.guias, cont = $('guiaModos'); cont.innerHTML = '';
  for (const m of MODOS_GUIA) {
    const b = document.createElement('button'); b.className = g.modo === m.id ? 'activo' : '';
    b.innerHTML = `<canvas width="${54 * DPR}" height="${36 * DPR}"></canvas>${m.nombre}`;
    const c = b.querySelector('canvas').getContext('2d'); c.scale(DPR, DPR); c.strokeStyle = g.modo === m.id ? '#8ACF00' : '#9b9ba1'; c.lineWidth = 1.2; c.beginPath();
    if (m.id === 'ninguna') { c.rect(14, 6, 26, 24); }
    if (m.id === 'cuadricula') for (let i = 0; i <= 4; i++) { c.moveTo(7 + i * 10, 2); c.lineTo(7 + i * 10, 34); c.moveTo(7, 2 + i * 8); c.lineTo(47, 2 + i * 8); }
    if (m.id === 'isometrica') for (let i = -3; i <= 6; i++) { c.moveTo(0, i * 8); c.lineTo(54, i * 8 + 31); c.moveTo(0, i * 8 + 31); c.lineTo(54, i * 8); }
    if (m.id === 'p1') for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; c.moveTo(27, 16); c.lineTo(27 + Math.cos(a) * 40, 16 + Math.sin(a) * 40); }
    if (m.id === 'p2') for (const x of [3, 51]) for (let i = -4; i <= 4; i++) { c.moveTo(x, 14); c.lineTo(27, 14 + i * 6); }
    if (m.id === 'p3') { for (const x of [3, 51]) for (let i = -3; i <= 3; i++) { c.moveTo(x, 8); c.lineTo(27, 8 + i * 5); } for (let i = -3; i <= 3; i++) { c.moveTo(27, 35); c.lineTo(27 + i * 7, 8); } }
    c.stroke();
    b.onclick = () => { g.modo = m.id; marcarCambio(); pintarGuiasPanel(); pedirSup(); marcarBotones(); };
    cont.appendChild(b);
  }
  $('chkAsist').checked = g.asist; $('rGuiaOp').value = g.op; $('rGuiaTam').value = g.tam;
  $('guiaNota').innerHTML = g.modo[0] === 'p' ? 'Arrastra los <b>puntos verdes</b> para mover los puntos de fuga. Aleja el lienzo (pellizco) si quedan fuera de la hoja.'
    : g.modo === 'ninguna' ? 'Elige una guía para dibujar en cuadrícula, isometría o perspectiva.' : 'Con la asistencia activa, cada trazo se alinea a la guía más cercana.';
}
$('chkAsist').onchange = e => { doc.guias.asist = e.target.checked; marcarCambio(); };
$('rGuiaOp').oninput = e => { doc.guias.op = +e.target.value; pedirSup(); };
$('rGuiaTam').oninput = e => { doc.guias.tam = +e.target.value; pedirSup(); };
$('rGuiaOp').onchange = $('rGuiaTam').onchange = () => marcarCambio();

// ---------- menú ----------
$('rPresion').value = aj.presion; $('vPresion').textContent = aj.presion.toFixed(2);
$('rPresion').oninput = e => { aj.presion = +e.target.value; $('vPresion').textContent = aj.presion.toFixed(2); guardarAjustes(); };
$('chkSoloLapiz').checked = aj.soloLapiz === true;
$('chkSoloLapiz').onchange = e => { aj.soloLapiz = e.target.checked; guardarAjustes(); };
$('chkZurdo').checked = aj.zurdo; document.body.classList.toggle('zurdo', aj.zurdo);
$('chkZurdo').onchange = e => { aj.zurdo = e.target.checked; document.body.classList.toggle('zurdo', aj.zurdo); guardarAjustes(); };
$('verTxt').textContent = VERSION;
$('mAjustar').onclick = () => { cerrarPaneles(); ajustarPantalla(); };
$('mVoltear').onclick = () => { cerrarPaneles(); const cx = innerWidth / 2; M = mMul([-1, 0, 0, 1, 2 * cx, 0], M); aplicarVista(); avisar('Vista volteada'); };
$('mExportar').onclick = () => { cerrarPaneles(); exportar('png'); };
$('mExportarJpg').onclick = () => { cerrarPaneles(); exportar('jpg'); };
$('mImportar').onclick = () => { cerrarPaneles(); $('fImportar').click(); };
$('mPapel').onclick = () => { cerrarPaneles(); dialogoPapel(); };
$('fImportar').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const img = await createImageBitmap(f);
    if (doc.capas.length >= MAX_CAPAS) return avisar('Máximo ' + MAX_CAPAS + ' capas');
    const c = crearCapa('Referencia', doc.w, doc.h), k = Math.min(doc.w / img.width, doc.h / img.height);
    c.ctx.drawImage(img, (doc.w - img.width * k) / 2, (doc.h - img.height * k) / 2, img.width * k, img.height * k);
    c.op = 0.5;
    insertarCapa(c, doc.activa + 1); pushHist({ t: 'nueva', capa: c, idx: doc.activa });
    // la capa de referencia queda debajo para calcar encima
    const nueva = crearCapa('Calco', doc.w, doc.h); insertarCapa(nueva, doc.activa + 1); pushHist({ t: 'nueva', capa: nueva, idx: doc.activa });
    avisar('Imagen importada al 50%: dibuja encima');
  } catch (err) { avisar('No se pudo abrir la imagen'); }
};

// ---------- teclado (para probar en PC) ----------
addEventListener('keydown', e => {
  if (!doc || $('editor').classList.contains('oculto') || e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? hacerRehacer() : hacerDeshacer(); }
  else if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); hacerRehacer(); }
  else if (k === ' ') espacio = true;
  else if (k === 'b') elegirHerramienta('pincel');
  else if (k === 'e') elegirHerramienta('borrador');
  else if (k === 'l') elegirHerramienta('relleno');
  else if (k === 'i') elegirHerramienta('gotero');
  else if (k === '[' || k === ']') { const o = opcionesPincel(claveAjuste()); o.tam = clamp(o.tam + (k === ']' ? 0.05 : -0.05), 0.01, 1); actualizarSliders(); }
});
addEventListener('keyup', e => { if (e.key === ' ') espacio = false; });

// =====================================================================
//  DIÁLOGOS
// =====================================================================
function escapar(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function modal(html, alAbrir) {
  $('modalCaja').innerHTML = html; $('modal').classList.remove('oculto');
  const cerrar = () => $('modal').classList.add('oculto');
  $('modal').onclick = e => { if (e.target === $('modal')) cerrar(); };
  alAbrir && alAbrir(cerrar);
}
function pedirTexto(titulo, valor, ok) {
  modal(`<h3>${titulo}</h3><input type="text" id="mTxt" value="${escapar(valor)}"><div class="modal-btns"><button id="mNo">Cancelar</button><button class="ok" id="mSi">Guardar</button></div>`, cerrar => {
    const i = $('mTxt'); setTimeout(() => { i.focus(); i.select(); }, 50);
    $('mNo').onclick = cerrar; $('mSi').onclick = () => { cerrar(); ok(i.value.trim()); };
    i.onkeydown = e => { if (e.key === 'Enter') $('mSi').click(); };
  });
}
function confirmar(titulo, texto, boton, ok) {
  modal(`<h3>${titulo}</h3><p>${texto}</p><div class="modal-btns"><button id="mNo">Cancelar</button><button class="rojo" id="mSi">${boton}</button></div>`, cerrar => {
    $('mNo').onclick = cerrar; $('mSi').onclick = () => { cerrar(); ok(); };
  });
}
function formatos() {
  const sw = Math.round(Math.min(2560, screen.width * DPR)), sh = Math.round(Math.min(2560, screen.height * DPR));
  return [
    { id: 'a4h', n: 'A4 horizontal', w: 2480, h: 1754 }, { id: 'a4v', n: 'A4 vertical', w: 1754, h: 2480 },
    { id: 'a3h', n: 'A3 horizontal', w: 3508, h: 2480 }, { id: 'a3v', n: 'A3 vertical', w: 2480, h: 3508 },
    { id: 'cuad', n: 'Cuadrado', w: 2400, h: 2400 }, { id: 'pant', n: 'Pantalla', w: Math.max(sw, sh), h: Math.min(sw, sh) },
  ];
}
function opcionesHtml(lista, sel, extra) {
  return lista.map(o => `<button data-id="${o.id}" class="${o.id === sel ? 'activo' : ''}">${extra(o)}${o.n || o.nombre}</button>`).join('');
}
function dialogoNuevo() {
  let fmt = 'a4h', pap = 'blanco';
  const F = formatos();
  modal(`<h3>Nuevo boceto</h3>
    <div class="etq">Tamaño</div><div class="opciones" id="oFmt">${opcionesHtml(F, fmt, o => { const k = 30 / Math.max(o.w, o.h); return `<span class="hoja" style="width:${o.w * k}px;height:${o.h * k}px"></span>`; })}</div>
    <div class="etq">Papel</div><div class="opciones" id="oPap">${opcionesHtml(PAPELES, pap, o => `<span class="hoja" style="width:26px;height:20px;background:${o.color}"></span>`)}</div>
    <div class="modal-btns"><button id="mNo">Cancelar</button><button class="ok" id="mSi">Crear</button></div>`, cerrar => {
    const sel = (id, fn) => $(id).querySelectorAll('button').forEach(b => b.onclick = () => { $(id).querySelectorAll('button').forEach(x => x.classList.toggle('activo', x === b)); fn(b.dataset.id); });
    sel('oFmt', v => fmt = v); sel('oPap', v => pap = v);
    $('mNo').onclick = cerrar;
    $('mSi').onclick = () => { cerrar(); const f = F.find(x => x.id === fmt); nuevoDibujo(f.w, f.h, pap); };
  });
}
function dialogoPapel() {
  modal(`<h3>Papel</h3><div class="opciones" id="oPap">${opcionesHtml(PAPELES, doc.papel, o => `<span class="hoja" style="width:26px;height:20px;background:${o.color}"></span>`)}</div>
    <label class="interruptor"><input type="checkbox" id="chkGrano" ${doc.grano !== false ? 'checked' : ''}><span></span>Textura de papel</label>
    <div class="modal-btns"><button class="ok" id="mSi">Listo</button></div>`, cerrar => {
    $('oPap').querySelectorAll('button').forEach(b => b.onclick = () => { doc.papel = b.dataset.id; pintarPapel(); marcarCambio(); $('oPap').querySelectorAll('button').forEach(x => x.classList.toggle('activo', x === b)); pedirSup(); });
    $('chkGrano').onchange = e => { doc.grano = e.target.checked; pintarPapel(); marcarCambio(); };
    $('mSi').onclick = cerrar;
  });
}

// =====================================================================
//  ALMACENAMIENTO (IndexedDB, en el propio dispositivo)
// =====================================================================
let dbP = null;
function db() {
  return dbP || (dbP = new Promise((res, rej) => {
    const r = indexedDB.open('prodraft', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('dibujos', { keyPath: 'id' });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
}
async function dbOp(modo, fn) {
  const d = await db();
  return new Promise((res, rej) => { const tx = d.transaction('dibujos', modo), st = tx.objectStore('dibujos'); const r = fn(st); tx.oncomplete = () => res(r && r.result); tx.onerror = () => rej(tx.error); });
}
const dbTodos = () => dbOp('readonly', s => s.getAll());
const dbUno = id => dbOp('readonly', s => s.get(id));
const dbPut = rec => dbOp('readwrite', s => s.put(rec));
const dbBorrar = id => dbOp('readwrite', s => s.delete(id));
const aBlob = (cv, tipo = 'image/png', q) => new Promise(r => cv.toBlob(r, tipo, q));
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

let tGuardar = 0, guardando = null, pendiente = false;
function marcarCambio() { if (!doc) return; doc.cambio = true; clearTimeout(tGuardar); tGuardar = setTimeout(guardar, 1500); }
async function guardar() {
  if (!doc || !doc.cambio) return;
  if (guardando) { pendiente = true; return guardando; }
  const d = doc; d.cambio = false;
  guardando = (async () => {
    for (const c of d.capas) if (c.sucia || !c.blob) { c.sucia = false; c.blob = await aBlob(c.cv); }
    const mini = componer(Math.min(1, 480 / Math.max(d.w, d.h)), d);
    const thumb = await aBlob(mini, 'image/jpeg', 0.85);
    await dbPut({
      id: d.id, nombre: d.nombre, w: d.w, h: d.h, papel: d.papel, grano: d.grano, creado: d.creado, fecha: Date.now(), activa: d.activa, guias: d.guias, thumb,
      capas: d.capas.map(c => ({ nombre: c.nombre, op: c.op, mezcla: c.mezcla, visible: c.visible, blob: c.blob })),
    });
  })().catch(err => { console.error(err); avisar('No se pudo guardar'); d.cambio = true; }).finally(() => { guardando = null; if (pendiente) { pendiente = false; guardar(); } });
  return guardando;
}
function componer(k, d = doc) {
  const cv = document.createElement('canvas'); cv.width = Math.round(d.w * k); cv.height = Math.round(d.h * k);
  const c = cv.getContext('2d'); c.imageSmoothingQuality = 'high';
  c.drawImage(papelCv, 0, 0, cv.width, cv.height);
  for (const l of d.capas) if (l.visible) { c.globalAlpha = l.op; c.globalCompositeOperation = l.mezcla === 'multiply' ? 'multiply' : 'source-over'; c.drawImage(l.cv, 0, 0, cv.width, cv.height); }
  return cv;
}
addEventListener('visibilitychange', () => { if (document.hidden) guardar(); });
addEventListener('pagehide', () => guardar());

// ---------- exportar ----------
async function exportar(fmt) {
  await guardar();
  const cv = componer(1), jpg = fmt === 'jpg', blob = await aBlob(cv, jpg ? 'image/jpeg' : 'image/png', 0.95);
  const nombre = (doc.nombre || 'Boceto').replace(/[^\w\- áéíóúñÁÉÍÓÚÑ]/g, '').trim().replace(/\s+/g, '_') + '.' + (jpg ? 'jpg' : 'png');
  await entregarArchivo(blob, nombre);
}
function blobB64(b) { return new Promise(r => { const f = new FileReader(); f.onload = () => r(String(f.result).split(',')[1]); f.readAsDataURL(b); }); }
async function entregarArchivo(blob, nombre) {
  const C = window.Capacitor, P = C && C.Plugins;
  if (C && C.isNativePlatform && C.isNativePlatform() && P && P.Filesystem) {
    try {
      const data = await blobB64(blob);
      let guardado = false;
      try { await P.Filesystem.writeFile({ path: 'ProDraft/' + nombre, data, directory: 'DOCUMENTS', recursive: true }); guardado = true; } catch (e) {}
      const r = await P.Filesystem.writeFile({ path: nombre, data, directory: 'CACHE' });
      avisar(guardado ? 'Guardado en Documentos/ProDraft' : 'Imagen lista');
      if (P.Share) await P.Share.share({ title: nombre, files: [r.uri], dialogTitle: 'Compartir boceto' }).catch(() => {});
      return;
    } catch (e) { console.error(e); }
  }
  const f = new File([blob], nombre, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [f] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try { await navigator.share({ files: [f], title: nombre }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  avisar('Imagen descargada');
}

// =====================================================================
//  GALERÍA Y APERTURA DE DIBUJOS
// =====================================================================
let urlsMini = [];
async function mostrarGaleria() {
  $('editor').classList.add('oculto'); $('galeria').classList.remove('oculto');
  let lista = [];
  try { lista = await dbTodos(); } catch (e) { console.error(e); }
  lista.sort((a, b) => b.fecha - a.fecha);
  urlsMini.forEach(u => URL.revokeObjectURL(u)); urlsMini = [];
  const g = $('galGrid'); g.innerHTML = '';
  $('galVacia').classList.toggle('oculto', lista.length > 0);
  for (const r of lista) {
    const u = r.thumb ? URL.createObjectURL(r.thumb) : ''; if (u) urlsMini.push(u);
    const d = document.createElement('div'); d.className = 'tarjeta';
    d.innerHTML = `<button class="mini">${u ? `<img src="${u}" alt="">` : ''}</button><div class="t-nom">${escapar(r.nombre)}</div><div class="t-fecha">${new Date(r.fecha).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })} · ${r.w}×${r.h}</div><button class="t-mas">⋯</button>`;
    d.querySelector('.mini').onclick = () => abrirDibujo(r.id);
    d.querySelector('.t-mas').onclick = () => menuTarjeta(r);
    g.appendChild(d);
  }
}
function menuTarjeta(r) {
  modal(`<h3>${escapar(r.nombre)}</h3><button class="item" id="tRen">Renombrar</button><button class="item" id="tDup">Duplicar</button><button class="item" id="tBor" style="color:#ff6b5e">Eliminar</button><div class="modal-btns"><button id="mNo">Cerrar</button></div>`, cerrar => {
    $('mNo').onclick = cerrar;
    $('tRen').onclick = () => { cerrar(); pedirTexto('Nombre del boceto', r.nombre, async v => { if (!v) return; r.nombre = v; await dbPut(r); mostrarGaleria(); }); };
    $('tDup').onclick = async () => { cerrar(); await dbPut(Object.assign({}, r, { id: nuevoId(), nombre: r.nombre + ' copia', fecha: Date.now() })); mostrarGaleria(); };
    $('tBor').onclick = () => { cerrar(); confirmar('Eliminar boceto', `¿Eliminar “${escapar(r.nombre)}”? No se puede recuperar.`, 'Eliminar', async () => { await dbBorrar(r.id); mostrarGaleria(); }); };
  });
}
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function prepararEditor() {
  deshacer.length = 0; rehacer.length = 0; bytesHist = 0;
  trazoCv.width = doc.w; trazoCv.height = doc.h; trazoCv.style.width = doc.w + 'px'; trazoCv.style.height = doc.h + 'px'; trazoCv.style.opacity = 0;
  respaldo.width = doc.w; respaldo.height = doc.h;
  docEl.style.width = doc.w + 'px'; docEl.style.height = doc.h + 'px';
  pintarPapel(); montarCapas(); ubicarTrazoCv();
  $('galeria').classList.add('oculto'); $('editor').classList.remove('oculto');
  if (history.state?.pd !== 'editor') history.pushState({ pd: 'editor' }, '');
  ajustarPantalla(); marcarBotones(); actualizarSliders(); pedirSup();
}
function nuevoDibujo(w, h, papel) {
  const n = new Date();
  doc = { id: nuevoId(), nombre: 'Boceto ' + n.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }) + ' ' + n.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    w, h, papel, grano: true, creado: Date.now(), capas: [], activa: 0, guias: guiasPorDefecto(w, h) };
  doc.capas.push(crearCapa('Boceto', w, h));
  prepararEditor(); doc.cambio = true; guardar();
}
async function abrirDibujo(id) {
  const r = await dbUno(id); if (!r) return;
  doc = { id: r.id, nombre: r.nombre, w: r.w, h: r.h, papel: r.papel, grano: r.grano, creado: r.creado, activa: r.activa || 0, guias: Object.assign(guiasPorDefecto(r.w, r.h), r.guias || {}), capas: [] };
  for (const l of r.capas) {
    const c = crearCapa(l.nombre, r.w, r.h); c.op = l.op; c.mezcla = l.mezcla; c.visible = l.visible;
    if (l.blob) { try { const img = await createImageBitmap(l.blob); c.ctx.drawImage(img, 0, 0); img.close && img.close(); } catch (e) {} }
    c.blob = l.blob; c.sucia = false; doc.capas.push(c);
  }
  if (!doc.capas.length) doc.capas.push(crearCapa('Boceto', r.w, r.h));
  doc.activa = clamp(doc.activa, 0, doc.capas.length - 1);
  prepararEditor();
}
async function cerrarDibujo() {
  if (trazo) cancelarTrazo();
  cerrarPaneles(); clearTimeout(tGuardar);
  await guardar();
  doc = null; capasDOM.innerHTML = ''; pedirSup();
  mostrarGaleria();
}
addEventListener('popstate', () => { if (doc) cerrarDibujo(); });
$('btnNuevo').onclick = dialogoNuevo;

// =====================================================================
//  INICIO
// =====================================================================
addEventListener('resize', () => { tamSup(); });
tamSup();
$('colorActual').style.background = aj.color;
history.replaceState({ pd: 'galeria' }, '');
mostrarGaleria();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
