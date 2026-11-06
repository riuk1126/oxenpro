// OXEN — bocetos para arquitectos
'use strict';
const $ = id => document.getElementById(id);
const VERSION = window.PD_VERSION && !window.PD_VERSION.startsWith('__') ? window.PD_VERSION : 'dev';
const DPR = Math.min(window.devicePixelRatio || 1, 3);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;

// =====================================================================
//  PINCELES
// =====================================================================
const CATS = ['Lápices', 'Tintas', 'Técnicas', 'Marcadores', 'Color', 'Vegetación', 'Texturas', 'Borradores', 'Importados'];
const PINCELES = [
  // --- Lápices ---
  { id: 'construccion', cat: 'Lápices', nombre: 'Lápiz de construcción', tip: 'grano', grano: 'fino', min: 1, max: 6, esp: 0.14, alfa: 0.14, pTam: 0.2, pAlfa: 0.7 },
  { id: '2h', cat: 'Lápices', nombre: 'Lápiz 2H', tip: 'grano', grano: 'fino', min: 1, max: 7, esp: 0.13, alfa: 0.22, pTam: 0.35, pAlfa: 1, incl: true },
  { id: 'hb', cat: 'Lápices', nombre: 'Lápiz HB', tip: 'grano', grano: 'fino', min: 1.5, max: 10, esp: 0.12, alfa: 0.34, pTam: 0.45, pAlfa: 1, incl: true },
  { id: '4b', cat: 'Lápices', nombre: 'Lápiz 4B', tip: 'grano', grano: 'fino', min: 2.5, max: 14, esp: 0.11, alfa: 0.45, pTam: 0.5, pAlfa: 1, incl: true },
  { id: '6b', cat: 'Lápices', nombre: 'Lápiz 6B', tip: 'grano', grano: 'fino', min: 3, max: 18, esp: 0.11, alfa: 0.55, pTam: 0.5, pAlfa: 1, incl: true },
  { id: 'porta', cat: 'Lápices', nombre: 'Portaminas 0.5', tip: 'grano', grano: 'fino', min: 1, max: 4.5, esp: 0.14, alfa: 0.8, pTam: 0.25, pAlfa: 0.75 },
  { id: 'esbozo', cat: 'Lápices', nombre: 'Lápiz de esbozo', tip: 'grano', grano: 'fino', min: 2, max: 12, esp: 0.12, alfa: 0.4, pTam: 0.6, pAlfa: 1, incl: true, jit: 0.08 },
  { id: 'barra', cat: 'Lápices', nombre: 'Grafito en barra', tip: 'grano', grano: 'grueso', min: 10, max: 80, esp: 0.08, alfa: 0.3, pTam: 0.3, pAlfa: 1, incl: true },
  { id: 'carbon', cat: 'Lápices', nombre: 'Carboncillo', tip: 'grano', grano: 'grueso', min: 6, max: 56, esp: 0.09, alfa: 0.45, pTam: 0.5, pAlfa: 1, incl: true },
  { id: 'conte', cat: 'Lápices', nombre: 'Conté / sanguina', tip: 'grano', grano: 'grueso', min: 4, max: 28, esp: 0.1, alfa: 0.62, pTam: 0.4, pAlfa: 1, incl: true },
  { id: 'lcolor', cat: 'Lápices', nombre: 'Lápiz de color', tip: 'grano', grano: 'fino', min: 3, max: 16, esp: 0.11, alfa: 0.3, pTam: 0.3, pAlfa: 1, incl: true },
  // --- Tintas ---
  { id: 'e01', cat: 'Tintas', nombre: 'Estilógrafo 0.1', tip: 'linea', mm: 0.1, pTam: 0 },
  { id: 'e02', cat: 'Tintas', nombre: 'Estilógrafo 0.2', tip: 'linea', mm: 0.2, pTam: 0 },
  { id: 'e03', cat: 'Tintas', nombre: 'Estilógrafo 0.3', tip: 'linea', mm: 0.3, pTam: 0 },
  { id: 'e05', cat: 'Tintas', nombre: 'Estilógrafo 0.5', tip: 'linea', mm: 0.5, pTam: 0 },
  { id: 'e08', cat: 'Tintas', nombre: 'Estilógrafo 0.8', tip: 'linea', mm: 0.8, pTam: 0 },
  { id: 'esti', cat: 'Tintas', nombre: 'Estilógrafo libre', tip: 'linea', min: 0.8, max: 7, pTam: 0.12 },
  { id: 'fino', cat: 'Tintas', nombre: 'Rotulador fino', tip: 'linea', min: 1.5, max: 10, pTam: 0.25 },
  { id: 'boli', cat: 'Tintas', nombre: 'Bolígrafo', tip: 'grano', grano: 'fino', min: 1, max: 4, esp: 0.15, alfa: 0.9, pTam: 0.3, pAlfa: 0.4 },
  { id: 'pluma', cat: 'Tintas', nombre: 'Plumilla', tip: 'linea', min: 0.6, max: 12, pTam: 1 },
  { id: 'ptinta', cat: 'Tintas', nombre: 'Pincel de tinta', tip: 'linea', min: 2, max: 46, pTam: 1 },
  { id: 'seca', cat: 'Tintas', nombre: 'Pincel seco', tip: 'grano', grano: 'grueso', min: 4, max: 40, esp: 0.08, alfa: 0.9, pTam: 0.6, pAlfa: 0.5 },
  // --- Técnicas (líneas normalizadas) ---
  { id: 'eje', cat: 'Técnicas', nombre: 'Línea de eje', tip: 'guion', mm: 0.2, patron: [12, 2, 1.5, 2], pTam: 0 },
  { id: 'oculta', cat: 'Técnicas', nombre: 'Línea oculta', tip: 'guion', mm: 0.25, patron: [4, 2.2], pTam: 0 },
  { id: 'punteada', cat: 'Técnicas', nombre: 'Línea punteada', tip: 'guion', mm: 0.35, patron: [0.01, 1.6], redondo: true, pTam: 0 },
  { id: 'lcorte', cat: 'Técnicas', nombre: 'Línea de corte', tip: 'guion', mm: 0.7, patron: [10, 2, 2, 2], pTam: 0 },
  { id: 'limite', cat: 'Técnicas', nombre: 'Límite de propiedad', tip: 'guion', mm: 0.4, patron: [12, 1.5, 1.5, 1.5, 1.5, 1.5], pTam: 0 },
  { id: 'contorno', cat: 'Técnicas', nombre: 'Contorno grueso 0.7', tip: 'linea', mm: 0.7, pTam: 0 },
  { id: 'muroP', cat: 'Técnicas', nombre: 'Muro cortado 1.0', tip: 'linea', mm: 1.0, pTam: 0 },
  // --- Marcadores ---
  { id: 'bisel', cat: 'Marcadores', nombre: 'Marcador biselado', tip: 'bisel', min: 6, max: 46, esp: 0.05, alfa: 1, pTam: 0.15, op: 0.55, mezcla: 'multiply', ang: -0.6, ratio: 0.32 },
  { id: 'mredondo', cat: 'Marcadores', nombre: 'Marcador redondo', tip: 'linea', min: 3, max: 28, pTam: 0.12, op: 0.5, mezcla: 'multiply' },
  { id: 'mpincel', cat: 'Marcadores', nombre: 'Marcador punta pincel', tip: 'linea', min: 1.5, max: 34, pTam: 1, op: 0.55, mezcla: 'multiply' },
  { id: 'mfino', cat: 'Marcadores', nombre: 'Marcador fino', tip: 'linea', min: 1.5, max: 7, pTam: 0.1, op: 0.65, mezcla: 'multiply' },
  { id: 'msombra', cat: 'Marcadores', nombre: 'Marcador de sombra', tip: 'bisel', min: 16, max: 90, esp: 0.05, alfa: 1, pTam: 0.1, op: 0.28, mezcla: 'multiply', ang: -0.6, ratio: 0.36 },
  { id: 'resaltador', cat: 'Marcadores', nombre: 'Resaltador', tip: 'bisel', min: 12, max: 50, esp: 0.05, alfa: 1, pTam: 0, op: 0.38, mezcla: 'multiply', ang: 0, ratio: 0.28 },
  // --- Color y render ---
  { id: 'acuarela', cat: 'Color', nombre: 'Acuarela', tip: 'suave', dureza: 0.35, min: 10, max: 110, esp: 0.07, alfa: 0.11, pTam: 0.45, pAlfa: 0.6, op: 0.8, mezcla: 'multiply', jit: 0.18 },
  { id: 'lavado', cat: 'Color', nombre: 'Lavado plano', tip: 'linea', min: 10, max: 140, pTam: 0.2, op: 0.32, mezcla: 'multiply' },
  { id: 'aero', cat: 'Color', nombre: 'Aerógrafo', tip: 'suave', dureza: 0, min: 12, max: 240, esp: 0.06, alfa: 0.05, pTam: 0, pAlfa: 1 },
  { id: 'gouache', cat: 'Color', nombre: 'Gouache', tip: 'linea', min: 4, max: 70, pTam: 0.5, op: 0.95 },
  { id: 'pastel', cat: 'Color', nombre: 'Pastel seco', tip: 'grano', grano: 'grueso', min: 8, max: 60, esp: 0.08, alfa: 0.4, pTam: 0.3, pAlfa: 1, incl: true },
  { id: 'tiza', cat: 'Color', nombre: 'Tiza (papel oscuro)', tip: 'grano', grano: 'grueso', min: 4, max: 36, esp: 0.09, alfa: 0.7, pTam: 0.3, pAlfa: 0.8 },
  { id: 'sombra', cat: 'Color', nombre: 'Sombra suave', tip: 'suave', dureza: 0.1, min: 20, max: 200, esp: 0.06, alfa: 0.06, pTam: 0.2, pAlfa: 1, mezcla: 'multiply' },
  { id: 'luz', cat: 'Color', nombre: 'Luz / brillo', tip: 'suave', dureza: 0.15, min: 10, max: 160, esp: 0.06, alfa: 0.08, pTam: 0.3, pAlfa: 1 },
  // --- Vegetación y entorno ---
  { id: 'follaje', cat: 'Vegetación', nombre: 'Follaje', tip: 'disperso', forma: 'hoja', n: 5, min: 14, max: 90, esp: 0.35, alfa: 0.75, pTam: 0.4, pAlfa: 0.5 },
  { id: 'feston', cat: 'Vegetación', nombre: 'Contorno de árbol', tip: 'feston', min: 6, max: 50, pTam: 0.2, grosor: 0.25 },
  { id: 'copa', cat: 'Vegetación', nombre: 'Copa de árbol', tip: 'disperso', forma: 'nube', n: 3, min: 16, max: 120, esp: 0.4, alfa: 0.9, pTam: 0.3, pAlfa: 0.3 },
  { id: 'pastoP', cat: 'Vegetación', nombre: 'Pasto', tip: 'disperso', forma: 'pasto', n: 7, min: 10, max: 60, esp: 0.3, alfa: 0.85, pTam: 0.3, pAlfa: 0.4 },
  { id: 'puntillado', cat: 'Vegetación', nombre: 'Puntillado', tip: 'disperso', forma: 'punto', n: 9, min: 10, max: 120, esp: 0.3, alfa: 0.9, pTam: 0.3, pAlfa: 0.6 },
  { id: 'gravaP', cat: 'Vegetación', nombre: 'Grava / piedras', tip: 'disperso', forma: 'grava', n: 4, min: 14, max: 90, esp: 0.4, alfa: 0.9, pTam: 0.3, pAlfa: 0.3 },
  { id: 'agua', cat: 'Vegetación', nombre: 'Ondas de agua', tip: 'disperso', forma: 'onda', n: 2, min: 16, max: 90, esp: 0.6, alfa: 0.85, pTam: 0.2, pAlfa: 0.3 },
  // --- Texturas ---
  { id: 'textura', cat: 'Texturas', nombre: 'Textura del relleno (la elegida en el lazo)', tip: 'textura', min: 10, max: 160, pTam: 0.2 },
  // --- Borradores ---
  { id: 'bduro', cat: 'Borradores', nombre: 'Borrador duro', tip: 'linea', min: 2, max: 90, pTam: 0.2 },
  { id: 'bfino', cat: 'Borradores', nombre: 'Borrador de precisión', tip: 'linea', min: 0.6, max: 10, pTam: 0.1 },
  { id: 'bsuave', cat: 'Borradores', nombre: 'Borrador suave', tip: 'suave', dureza: 0.2, min: 10, max: 200, esp: 0.06, alfa: 0.25, pTam: 0.2, pAlfa: 1 },
  { id: 'bgrano', cat: 'Borradores', nombre: 'Borrador de grano', tip: 'grano', grano: 'fino', min: 4, max: 60, esp: 0.1, alfa: 0.5, pTam: 0.3, pAlfa: 1 },
];
for (const tx of Texturas.lista) PINCELES.push({ id: 'tx_' + tx.id, cat: 'Texturas', nombre: tx.nombre, tip: 'textura', texId: tx.id, min: 16, max: 420, pTam: 0.15 });
const pincel = id => PINCELES.find(p => p.id === id) || PINCELES[2];
const PXMM = 1754 / 297; // píxeles por milímetro de papel (150 ppp: hojas livianas y fluidas)
const ESC_TEX = 1.8; // las texturas se dibujan más grandes para que se reconozca cada material

// ---------- punta suave coloreada ----------
const puntas = new Map();
const sellos = new Map();
function puntaSello(pin, color) { // la forma importada, teñida con el color
  const k = pin.id + color; if (sellos.has(k)) return sellos.get(k);
  const f = pin.forma, cv = document.createElement('canvas'); cv.width = f.width; cv.height = f.height;
  const c = cv.getContext('2d'); c.fillStyle = color; c.fillRect(0, 0, cv.width, cv.height); c.globalCompositeOperation = 'destination-in'; c.drawImage(f, 0, 0);
  if (sellos.size > 40) sellos.clear(); sellos.set(k, cv); return cv;
}
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
  const t = { ctx, pin, color, ult: null, falta: 0, bb: [1e9, 1e9, -1e9, -1e9], sucio: [1e9, 1e9, -1e9, -1e9], dIdx: 0, dResto: -1, anc: null };
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.lineCap = pin.tip === 'guion' && !pin.redondo ? 'butt' : 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (pin.tip === 'grano') t.estilo = Texturas.patronGrano(ctx, pin.grano, color);
  else if (pin.tip === 'textura') t.estilo = Texturas.patron(ctx, pin.texId || tex.id, color, (tex.escala || 1) * ESC_TEX);
  else if (pin.tip === 'suave') t.punta = puntaSuave(color, pin.dureza || 0);
  else if (pin.tip === 'sello') t.punta = puntaSello(pin, color);
  ctx.fillStyle = ctx.strokeStyle = t.estilo || color;
  return t;
}
function bbAmpliar(bb, x, y, r) {
  if (x - r < bb[0]) bb[0] = x - r; if (y - r < bb[1]) bb[1] = y - r;
  if (x + r > bb[2]) bb[2] = x + r; if (y + r > bb[3]) bb[3] = y + r;
}
function forma(c, f, x, y, s, a) { // figuras de los pinceles dispersos
  const r = Math.random;
  if (f === 'hoja') { c.globalAlpha = a * (0.5 + r() * 0.5); c.beginPath(); c.ellipse(x, y, s * (0.1 + r() * 0.07), s * (0.045 + r() * 0.03), r() * 6.28, 0, 6.2832); c.fill(); }
  else if (f === 'punto') { c.globalAlpha = a; c.beginPath(); c.arc(x, y, Math.max(0.5, s * (0.012 + r() * 0.02)), 0, 6.2832); c.fill(); }
  else if (f === 'pasto') { c.globalAlpha = a; const h = s * (0.25 + r() * 0.35), an = (r() - 0.5) * 0.9; c.lineWidth = Math.max(0.7, s * 0.02); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.sin(an) * h * 0.3, y - h * 0.6, x + Math.sin(an) * h, y - Math.cos(an) * h); c.stroke(); }
  else if (f === 'nube') { c.globalAlpha = a; c.lineWidth = Math.max(0.8, s * 0.025); const rr = s * (0.14 + r() * 0.12); c.beginPath(); c.arc(x, y, rr, r() * 3, r() * 3 + 3.6 + r() * 2); c.stroke(); }
  else if (f === 'grava') { c.globalAlpha = a; c.lineWidth = Math.max(0.8, s * 0.02); const rr = s * (0.05 + r() * 0.07), m = 5 + (r() * 3 | 0), a0 = r() * 6.28; c.beginPath(); for (let k = 0; k < m; k++) { const aa = a0 + k / m * 6.2832, q = rr * (0.7 + r() * 0.5); k ? c.lineTo(x + Math.cos(aa) * q, y + Math.sin(aa) * q * 0.8) : c.moveTo(x + Math.cos(aa) * q, y + Math.sin(aa) * q * 0.8); } c.closePath(); c.stroke(); }
  else if (f === 'onda') { c.globalAlpha = a; c.lineWidth = Math.max(0.8, s * 0.025); const w = s * (0.25 + r() * 0.2); c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w / 2, y - w * 0.35, x, y); c.quadraticCurveTo(x + w / 2, y + w * 0.35, x + w, y); c.stroke(); }
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
  } else if (pin.tip === 'sello') { // forma importada (Procreate, Photoshop o imagen)
    const im = t.punta, w = s, h = s * im.height / im.width;
    const an = pin.rot === 'azar' ? Math.random() * 6.2832 : pin.rot === 'trazo' ? (t.dirAng || 0) : 0;
    if (an) { const co = Math.cos(an), si = Math.sin(an); c.setTransform(co, si, -si, co, x, y); c.drawImage(im, -w / 2, -h / 2, w, h); c.setTransform(1, 0, 0, 1, 0, 0); }
    else c.drawImage(im, x - w / 2, y - h / 2, w, h);
  } else if (pin.tip === 'disperso') {
    for (let k = 0; k < pin.n; k++) { const an = Math.random() * 6.2832, d = Math.sqrt(Math.random()) * s / 2; forma(c, pin.forma, x + Math.cos(an) * d, y + Math.sin(an) * d, s, a); }
  }
}
function trazoPunto(t, p) {
  const pin = t.pin, q = t.ult, c = t.ctx;
  const m = p.s * (pin.jit || pin.tip === 'disperso' || pin.tip === 'feston' ? 1.1 : 0.6) + 3;
  bbAmpliar(t.bb, p.x, p.y, m); bbAmpliar(t.sucio, p.x, p.y, m);
  if (q) bbAmpliar(t.sucio, q.x, q.y, m);
  if (pin.tip === 'linea' || pin.tip === 'textura') {
    c.globalAlpha = 1;
    c.lineWidth = q ? (q.s + p.s) / 2 : p.s;
    c.beginPath(); c.moveTo(q ? q.x : p.x, q ? q.y : p.y); c.lineTo(p.x + (q ? 0 : 0.01), p.y); c.stroke();
  } else if (pin.tip === 'guion') {
    // líneas normalizadas (eje, oculta…): el patrón sigue el recorrido sin cortarse
    const u = Math.max(1, p.s) * 2.2, pat = pin.patron.map(v => v * u);
    if (t.dResto < 0) { t.dIdx = 0; t.dResto = pat[0]; }
    if (!q) { if (pin.redondo) { c.lineWidth = p.s; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + 0.01, p.y); c.stroke(); } t.ult = p; return; }
    const dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy); let pos = 0;
    c.lineWidth = p.s; c.globalAlpha = 1;
    while (pos < d) {
      const paso = Math.min(t.dResto, d - pos), on = t.dIdx % 2 === 0;
      if (on) { c.beginPath(); c.moveTo(q.x + dx * pos / d, q.y + dy * pos / d); c.lineTo(q.x + dx * (pos + paso) / d + (pin.redondo ? 0.01 : 0), q.y + dy * (pos + paso) / d); c.stroke(); }
      pos += paso; t.dResto -= paso;
      if (t.dResto <= 1e-6) { t.dIdx = (t.dIdx + 1) % pat.length; t.dResto = pat[t.dIdx]; }
    }
  } else if (pin.tip === 'feston') {
    // contorno festoneado (copas de árbol en planta)
    if (!t.anc) { t.anc = { x: p.x, y: p.y }; t.ult = p; return; }
    c.lineWidth = Math.max(1, p.s * pin.grosor * 0.4); c.globalAlpha = 1;
    let d = Math.hypot(p.x - t.anc.x, p.y - t.anc.y);
    while (d >= p.s) {
      const ux = (p.x - t.anc.x) / d, uy = (p.y - t.anc.y) / d, bx = t.anc.x + ux * p.s, by = t.anc.y + uy * p.s, an = Math.atan2(uy, ux);
      c.beginPath(); c.arc((t.anc.x + bx) / 2, (t.anc.y + by) / 2, p.s / 2, an + Math.PI, an); c.stroke();
      t.anc = { x: bx, y: by }; d = Math.hypot(p.x - bx, p.y - by);
    }
  } else if (!q) {
    dab(t, p.x, p.y, p.s, p.a);
    t.falta = Math.max(0.4, p.s * pin.esp);
  } else {
    const dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy);
    if (d > 0.01) t.dirAng = Math.atan2(dy, dx);
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
  pincel: 'hb', borrador: 'bduro', color: '#1d1d1f', recientes: [], porPincel: {}, estab: 0.12,
  textura: { id: 'ladrillo', escala: 1, modo: 'textura' }, presion: 1, soloLapiz: null, zurdo: false,
};
let aj = AJ_DEF;
try { aj = Object.assign({}, AJ_DEF, JSON.parse(localStorage.getItem('oxen-ajustes') || '{}')); } catch (e) {}
// la estabilización alta hace que la línea vaya "detrás" del lápiz: el valor viejo por defecto (35%) pasa a 12%
if (!aj.v142) { if (aj.estab === 0.35) aj.estab = 0.12; aj.v142 = true; try { localStorage.setItem('oxen-ajustes', JSON.stringify(aj)); } catch (e) {} }
function guardarAjustes() { try { localStorage.setItem('oxen-ajustes', JSON.stringify(aj)); } catch (e) {} }

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
  if (pinVisto) ubicarGloboPin();
  if (!trazo) limpiarCursor();
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
  while (deshacer.length > 60 || (bytesHist > 220e6 && deshacer.length > 1)) bytesHist -= deshacer.shift().bytes || 0;
  marcarCambio();
}
function bbEntero(bb) {
  const x = clamp(Math.floor(bb[0]), 0, doc.w), y = clamp(Math.floor(bb[1]), 0, doc.h);
  const x2 = clamp(Math.ceil(bb[2]), 0, doc.w), y2 = clamp(Math.ceil(bb[3]), 0, doc.h);
  return x2 > x && y2 > y ? [x, y, x2 - x, y2 - y] : null;
}
// copia de una zona como canvas (rápido, sin leer píxeles a la CPU)
function recorte(src, r) {
  const cv = document.createElement('canvas'); cv.width = r[2]; cv.height = r[3];
  cv.getContext('2d').drawImage(src, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return cv;
}
function pegar(ctx, cv, x, y) { ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(x, y, cv.width, cv.height); ctx.drawImage(cv, x, y); ctx.restore(); }
function histPx(capa, r, antes, yaSumado) {
  if (!yaSumado) invalidarLineas(capa, r); // lo pintado encima de una línea recordada ya no permite redibujarla
  const despues = recorte(capa.cv, r);
  pushHist({ t: 'px', capa, x: r[0], y: r[1], antes, despues, bytes: r[2] * r[3] * 8 });
  capa.sucia = true;
}
function aplicarHist(e, atras) {
  if (e.t === 'px') {
    pegar(e.capa.ctx, atras ? e.antes : e.despues, e.x, e.y); e.capa.sucia = true;
    if (e.lnk) { const f = atras ? e.lnk.antes : e.lnk.despues; if (f) Object.assign(e.lnk.L, f); else e.lnk.L.ok = false; }
    else invalidarLineas(e.capa, [e.x, e.y, e.antes.width, e.antes.height]);
  }
  else if (e.t === 'nueva') { if (atras) quitarCapa(e.capa); else insertarCapa(e.capa, e.idx); }
  else if (e.t === 'borrar') { if (atras) insertarCapa(e.capa, e.idx); else quitarCapa(e.capa); }
  else if (e.t === 'obj') { doc.objetos = JSON.parse(atras ? e.antes : e.despues); renderObjetos(); }
  else if (e.t === 'multi') { (atras ? e.items.slice().reverse() : e.items).forEach(x => aplicarHist(x, atras)); }
  else if (e.t === 'mover') { moverCapaA(atras ? e.a : e.de, atras ? e.de : e.a); }
  else if (e.t === 'combinar') {
    invalidarLineas(e.inf); invalidarLineas(e.sup);
    if (atras) { pegar(e.inf.ctx, e.antesInf, 0, 0); e.inf.sucia = true; insertarCapa(e.sup, e.idx); }
    else { quitarCapa(e.sup); pegar(e.inf.ctx, e.despuesInf, 0, 0); e.inf.sucia = true; }
  }
}
function hacerDeshacer() {
  if (trazo) return;
  if (flot) { cancelarFlot(); return avisar('Selección cancelada'); } const e = deshacer.pop(); if (!e) return avisar('Nada que deshacer');
  aplicarHist(e, true); rehacer.push(e); avisar('Deshacer'); marcarCambio(); refrescarCapasSiAbierto();
}
function hacerRehacer() {
  if (trazo) return;
  if (flot) aplicarFlot(); const e = rehacer.pop(); if (!e) return avisar('Nada que rehacer');
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
// el papel es un fondo (no un lienzo más): ahorra memoria y hace todo más fluido
let granoURL = null;
function dibujarPapel(c, w, h, k = 1) {
  const p = papelDe(doc.papel);
  c.fillStyle = p.color; c.fillRect(0, 0, w, h);
  if (doc.grano !== false) {
    c.save(); c.globalAlpha = p.id === 'negro' || p.id === 'gris' ? 0.07 : 0.035;
    const pt = c.createPattern(Texturas.granoBase('grueso'), 'repeat'); if (k !== 1 && pt.setTransform) pt.setTransform(new DOMMatrix().scale(k));
    c.fillStyle = pt; c.fillRect(0, 0, w, h); c.restore();
  }
}
function pintarPapel() {
  papelCv.width = papelCv.height = 1; papelCv.style.display = 'none';
  const p = papelDe(doc.papel);
  if (!granoURL) { const t = document.createElement('canvas'); t.width = t.height = 256; const c = t.getContext('2d'); c.globalAlpha = 0.035; c.drawImage(Texturas.granoBase('grueso'), 0, 0); granoURL = t.toDataURL(); }
  docEl.style.backgroundColor = p.color;
  docEl.style.backgroundImage = doc.grano !== false ? `url(${granoURL})` : 'none';
}

// =====================================================================
//  ENTRADA: lápiz, dedos y ratón
// =====================================================================
let trazo = null;          // trazo en curso
const toques = new Map();  // dedos sobre la pantalla
let gesto = null, lapizAbajo = false, lapizId = null, paneo = null, arrastreVP = null;
let espacio = false;

// Algunas tabletas Android entregan el lápiz como "touch" (dedo). Se reconoce igual: punta muy fina,
// inclinación o una presión que de verdad varía. Así la presión funciona en todos los tipos de hoja.
let presionVista = 0, estadoPresion = null; // última presión real leída (para el indicador de Ajustes)
function esLapiz(e) {
  if (e.pointerType === 'pen') return true;
  if (e.pointerType !== 'touch') return false;
  // inclinación = seguro es lápiz; punta finísima solo si además trae presión real (un dedo no la trae así)
  return !!(e.tiltX || e.tiltY) || (typeof e.altitudeAngle === 'number' && e.altitudeAngle < 1.5) || (e.width > 0 && e.width <= 3 && e.height <= 3 && e.pressure > 0 && e.pressure < 1 && e.pressure !== 0.5);
}
function presionDe(e) {
  if (esLapiz(e) && e.pressure > 0 && e.pressure !== 0.5 || e.pointerType === 'pen') {
    const p = e.pressure > 0 ? e.pressure : 0.5; presionVista = p; return Math.pow(p, aj.presion);
  }
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
  if (pinVisto && herramienta !== 'pin' && !(e.pointerType === 'touch' && soloLapiz())) ocultarPin();
  try { escenario.setPointerCapture(e.pointerId); } catch (_) {}
  // tocar el lienzo con un panel abierto: lo cierra (salvo mover puntos de fuga)
  if (panelAbierto('pGuias') && e.pointerType !== 'touch' || panelAbierto('pGuias') && toques.size === 0) {
    const vp = vpCercano(e.clientX, e.clientY);
    if (vp >= 0) { arrastreVP = { id: e.pointerId, i: vp }; return; }
  }
  if (document.querySelector('.panel:not(.oculto)')) { cerrarPaneles(); if (e.pointerType !== 'touch') return; toques.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, ignorar: true }); return; }

  if (e.pointerType === 'pen' || esLapiz(e) && !toques.size) {
    if (aj.soloLapiz === null) { aj.soloLapiz = true; guardarAjustes(); $('chkSoloLapiz').checked = true; avisar('Lápiz detectado: el dedo ahora mueve el lienzo'); }
    lapizAbajo = true; lapizId = e.pointerId;
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
  if (lapizAbajo) { if (trazo && trazo.forma) perfeccionarForma(trazo); return; } // palma apoyada mientras se dibuja con lápiz
  toques.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
  if (toques.size === 1) {
    gestoTap = { t: performance.now(), max: 1, movido: false };
    if (!soloLapiz() || herramienta === 'gotero' || herramienta === 'simbolo' && sobreSimbolo(e) || herramienta === 'seleccion' && flot && sobreFlot(e) || herramienta === 'pin' && pinEn(aDoc(e.clientX, e.clientY))) iniciarTrazo(e);
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
  if (!trazo && e.buttons === 0 && (e.pointerType === 'pen' || e.pointerType === 'mouse')) { hover = { x: e.clientX, y: e.clientY, pen: e.pointerType === 'pen' }; pedirCursor(); }
  if (toques.size === 3 && e.pointerType === 'touch' && !gestoTap.menu3) {
    const v = [...toques.values()], dy = v.reduce((m, q) => m + (q.y - q.y0), 0) / 3;
    if (dy > 70) { gestoTap.menu3 = true; gestoTap.movido = true; menuCopiarPegar(); }
  }
  if (gesto && toques.size >= 2) { actualizarGesto(); return; }
  if (paneo && paneo.id === e.pointerId) {
    M = mMul([1, 0, 0, 1, e.clientX - paneo.x, e.clientY - paneo.y], M); paneo.x = e.clientX; paneo.y = e.clientY; aplicarVista();
  }
}, { passive: false });

function finPuntero(e) {
  if (!doc) return;
  if (arrastreVP && arrastreVP.id === e.pointerId) { arrastreVP = null; marcarCambio(); return; }
  if (e.pointerType === 'pen' || e.pointerId === lapizId) { lapizAbajo = false; lapizId = null; }
  if (e.pointerType !== 'touch') { hover = e.pointerType === 'mouse' ? { x: e.clientX, y: e.clientY } : null; pedirCursor(); }
  if (trazo && trazo.id === e.pointerId) { if (e.type === 'pointercancel' && trazo.tipo === 'touch') cancelarTrazo(); else terminarTrazo(e); }
  if (paneo && paneo.id === e.pointerId) paneo = null;
  if (e.pointerType === 'touch' && toques.has(e.pointerId)) {
    toques.delete(e.pointerId);
    if (toques.size < 2 && gesto) terminarGesto(true);
    if (toques.size === 0) {
      const dt = performance.now() - gestoTap.t;
      if (gestoTap.max === 1 && !gestoTap.movido && dt < 350 && soloLapiz()) { const o = pinEn(aDoc(e.clientX, e.clientY)); if (o) verPin(o); else if (pinVisto) ocultarPin(); }
      if (gestoTap.max >= 2 && !gestoTap.movido && dt < 380) { gestoTap.max >= 4 ? alternarInterfaz() : gestoTap.max === 3 ? hacerRehacer() : hacerDeshacer(); }
      gestoTap.max = 0; gestoTap.menu3 = false;
    }
  }
}
escenario.addEventListener('pointerup', finPuntero);
// eventos crudos del lápiz: llegan antes que pointermove → menos retraso
const RAW = 'onpointerrawupdate' in window;
if (RAW) escenario.addEventListener('pointerrawupdate', e => { if (doc && trazo && trazo.id === e.pointerId && !trazo.gotero && !trazo.arq) moverTrazo(e); });
escenario.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') { hover = null; pedirCursor(); } });
escenario.addEventListener('pointercancel', finPuntero);
escenario.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('contextmenu', e => { if (!e.target.closest('input,textarea')) e.preventDefault(); });
document.addEventListener('dragstart', e => e.preventDefault());

escenario.addEventListener('wheel', e => {
  if (!doc) return; e.preventDefault();
  if (e.ctrlKey || !e.shiftKey && Math.abs(e.deltaX) < 1) {
    const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), x = e.clientX, y = e.clientY;
    M = limitarEscala(mMul([k, 0, 0, k, x - k * x, y - k * y], M));
  } else M = mMul([1, 0, 0, 1, -e.deltaX, -e.deltaY], M);
  aplicarVista();
}, { passive: false });

// ---- gestos de dos dedos ----
// toque con 4 dedos = pantalla completa (esconde las barras)
function alternarInterfaz() { const s = document.body.classList.toggle('sinUI'); $('salirSinUI').classList.toggle('oculto', !s); avisar(s ? 'Pantalla completa · toca con 4 dedos para volver' : 'Barras visibles'); }
$('salirSinUI').onclick = alternarInterfaz;
function iniciarGesto() {
  const [a, b] = [...toques.values()];
  gesto = { M0: M.slice(), a0: { x: a.x, y: a.y }, b0: { x: b.x, y: b.y }, t0: performance.now() };
}
function actualizarGesto() {
  const [a, b] = [...toques.values()];
  M = limitarEscala(mMul(similar(gesto.a0, gesto.b0, a, b), gesto.M0)); aplicarVista();
}
function terminarGesto(seguir) {
  const g = gesto; gesto = null;
  // pellizco rápido hacia adentro = encajar la hoja en la pantalla (como en Procreate)
  if (g && performance.now() - g.t0 < 320 && escalaVista() / Math.hypot(g.M0[0], g.M0[1]) < 0.8) { ajustarPantalla(); avisar('Hoja ajustada a la pantalla'); return; }
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
function tamPincel(pin, o, pxmm) { return pin.mm ? pin.mm * (pxmm || PXMM) * lerp(0.6, 1.8, o.tam) : lerp(pin.min, pin.max, o.tam * o.tam); }

function puntoDesde(e, t) {
  const d = aDoc(e.clientX, e.clientY), pin = t.pin, o = t.opc;
  let pr = presionDe(e);
  if (esLapiz(e)) { t.lapiz = true; const q = e.pressure; if (q > 0) { t.prMin = Math.min(t.prMin ?? 1, q); t.prMax = Math.max(t.prMax ?? 0, q); } }
  t.prS = t.prS == null ? pr : lerp(t.prS, pr, 0.55); pr = t.prS;
  let s = tamPincel(pin, o, doc.pxmm) * (1 - pin.pTam + pin.pTam * pr);
  let a = (pin.alfa || 1) * (1 - (pin.pAlfa || 0) + (pin.pAlfa || 0) * pr);
  if (pin.incl) { const ti = inclinacionDe(e); if (ti > 0.45) { const k = (ti - 0.45) / 0.55; s *= 1 + k * 2.6; a *= 1 - k * 0.45; } }
  return { x: d.x, y: d.y, s: Math.max(0.35, s), a, pr };
}

function copiarRespaldo(capa) {
  if (respaldo.width !== doc.w) respaldo.width = doc.w;
  if (respaldo.height !== doc.h) respaldo.height = doc.h;
  respCtx.globalCompositeOperation = 'copy'; respCtx.drawImage(capa.cv, 0, 0); respCtx.globalCompositeOperation = 'source-over';
}

function iniciarTrazo(e) {
  if (herramienta === 'gotero') { trazo = { id: e.pointerId, tipo: e.pointerType, gotero: true, t0: performance.now(), largo: 0 }; tomarColor(e); return; }
  if (herramienta === 'cota' || herramienta === 'texto' || herramienta === 'simbolo' || herramienta === 'pin') return iniciarArq(e);
  if (herramienta === 'seleccion' && flot) return iniciarTransf(e);
  const capa = capaActiva();
  if (!capa.visible) { avisar('La capa está oculta'); return; }
  ubicarTrazoCv();
  const borrar = herramienta === 'borrador';
  const t = { id: e.pointerId, tipo: e.pointerType, t0: performance.now(), largo: 0, capa, borrar, pts: [], raw: [], sx: e.clientX, sy: e.clientY };
  if (herramienta === 'relleno' || herramienta === 'seleccion') {
    t.lazo = true; t.sel = herramienta === 'seleccion'; t.modo = aj.textura.modo; t.opc = opcionesPincel('relleno');
    const d = aDoc(e.clientX, e.clientY); t.pts.push(d); t.bb = [d.x, d.y, d.x, d.y];
    trazoCv.style.display = t.sel ? 'none' : ''; trazoCv.style.opacity = t.modo === 'borrar' ? 0.35 : t.opc.op * capa.op;
    trazo = t; pedirSup(); return;
  }
  trazoCv.style.display = 'none';
  t.pin = pincelActual(); t.opc = opcionesPincel(claveAjuste());
  t.op = t.opc.op * (borrar ? 1 : (t.pin.op || 1));
  t.gco = borrar ? 'destination-out' : capa.bloq ? 'source-atop' : t.pin.mezcla === 'multiply' ? 'multiply' : 'source-over'; // capa bloqueada: solo pinta sobre lo ya dibujado
  t.motor = crearTrazo(trazoCtx, t.pin, borrar ? '#000000' : aj.color, aj.textura);
  t.esp = espejos(); t.motores = t.esp.map(() => crearTrazo(trazoCtx, t.pin, borrar ? '#000000' : aj.color, aj.textura));
  copiarRespaldo(capa);
  const p = puntoDesde(e, t);
  t.f = { x: p.x, y: p.y }; t.inicio = p;
  t.asist = herramienta === 'pincel' && doc.guias.asist && doc.guias.modo !== 'ninguna';
  t.raw.push(p);
  trazo = t;
  if (!t.asist) agregarPunto(t, p);
  pedirComp();
  armarQuickShape(t, e);
  // mantener el lápiz quieto al empezar = gotero (como en Procreate)
  t.gotT = setTimeout(() => {
    if (trazo !== t || t.forma || t.largo * escalaVista() > 6 || t.lejos) return;
    cancelarTrazo(); tomarColor({ clientX: t.sx, clientY: t.sy }); ponerColor(aj.color); avisar('Color tomado');
  }, 800);
}
// ---- simetría: cada punto se dibuja también reflejado ----
function espejos() {
  const m = doc && doc.guias.sim, W = doc && doc.w, H = doc && doc.h;
  if (!m || m === 'no') return [];
  const v = p => Object.assign({}, p, { x: W - p.x }), h = p => Object.assign({}, p, { y: H - p.y }), vh = p => Object.assign({}, p, { x: W - p.x, y: H - p.y });
  return m === 'v' ? [v] : m === 'h' ? [h] : [v, h, vh];
}
function puntoTodos(t, p) { trazoPunto(t.motor, p); if (t.motores) t.motores.forEach((m, i) => trazoPunto(m, t.esp[i](p))); }
function bbTrazo(t, campo = 'bb') { const b = t.motor[campo].slice(); if (t.motores) for (const m of t.motores) { bbAmpliar(b, m[campo][0], m[campo][1], 0); bbAmpliar(b, m[campo][2], m[campo][3], 0); } return b; }

function moverTrazo(e, soloPrediccion) {
  const t = trazo;
  if (!t.lejos && t.sx != null && Math.hypot(e.clientX - t.sx, e.clientY - t.sy) > 8) { t.lejos = true; clearTimeout(t.gotT); }
  if (t.transf) return moverTransf(e);
  if (t.arq) return moverArq(e);
  if (t.gotero) { tomarColor(e); return; }
  if (!soloPrediccion) {
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    // llegan por pointerrawupdate y por pointermove: se usan una sola vez (por su hora)
    const lista = (evs && evs.length ? evs : [e]).filter(ev => {
      const nuevo = ev.timeStamp > (t.ultTs || 0) || ev.timeStamp === t.ultTs && (ev.clientX !== t.ultX || ev.clientY !== t.ultY);
      if (nuevo) { t.ultTs = ev.timeStamp; t.ultX = ev.clientX; t.ultY = ev.clientY; }
      return nuevo;
    });
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
    if (t.forma && lista.length) { const p = t.raw[t.raw.length - 1]; editarForma(t, { x: p.x, y: p.y }); t.formaPend = true; }
    reiniciarQuickShape(t, e);
  }
  // tinta adelantada: dibuja hacia donde va el lápiz para que se sienta sin retraso
  if (!t.lazo && !t.forma && !t.dir && e.getPredictedEvents && ['linea', 'grano', 'bisel', 'guion', 'textura'].includes(t.pin.tip)) {
    const pe = e.getPredictedEvents(); t.pred = pe.length ? aDoc(pe[pe.length - 1].clientX, pe[pe.length - 1].clientY) : null;
  }
  pedirComp();
}

function agregarPunto(t, p) {
  let x = p.x, y = p.y;
  if (t.dir) { const o = t.inicio, k = (x - o.x) * t.dir[0] + (y - o.y) * t.dir[1]; x = o.x + t.dir[0] * k; y = o.y + t.dir[1] * k; }
  else if (t.pts.length) { const k = aj.estab; t.f.x = lerp(x, t.f.x, k); t.f.y = lerp(y, t.f.y, k); x = t.f.x; y = t.f.y; }
  const q = t.pts[t.pts.length - 1];
  if (q) t.largo += Math.hypot(x - q.x, y - q.y);
  const np = { x, y, s: p.s, a: p.a, pr: p.pr };
  t.pts.push(np);
  puntoTodos(t, np);
}

// ---- composición por cuadro: solo se repinta la zona que cambió ----
let rafComp = 0;
function pedirComp() { if (!rafComp) rafComp = requestAnimationFrame(() => { rafComp = 0; if (trazo && trazo.formaPend) { trazo.formaPend = false; dibujarFormaPrevia(trazo); } componerTrazo(trazo); dibujarCursor(); }); }
function componerTrazo(t) {
  if (!t || !t.motor) return;
  const r = bbEntero(bbTrazo(t, 'sucio')); t.motor.sucio = [1e9, 1e9, -1e9, -1e9]; if (t.motores) for (const m of t.motores) m.sucio = [1e9, 1e9, -1e9, -1e9];
  if (!r) return;
  const c = t.capa.ctx;
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.clearRect(r[0], r[1], r[2], r[3]); c.drawImage(respaldo, r[0], r[1], r[2], r[3], r[0], r[1], r[2], r[3]);
  c.globalAlpha = t.op; c.globalCompositeOperation = t.gco;
  if (t.pin && t.pin.granoImg) c.drawImage(conGrano(t.pin, r), r[0], r[1]);
  else c.drawImage(trazoCv, r[0], r[1], r[2], r[3], r[0], r[1], r[2], r[3]);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
const granoCv = document.createElement('canvas'), granoCtx = granoCv.getContext('2d');
function conGrano(pin, r) {
  if (granoCv.width < r[2]) granoCv.width = r[2]; if (granoCv.height < r[3]) granoCv.height = r[3];
  const g = granoCtx; g.globalCompositeOperation = 'copy'; g.drawImage(trazoCv, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
  g.globalCompositeOperation = 'destination-in'; if (!pin._pat) pin._pat = g.createPattern(pin.granoImg, 'repeat');
  g.save(); g.translate(-r[0], -r[1]); g.fillStyle = pin._pat; g.fillRect(r[0], r[1], r[2], r[3]); g.restore();
  g.globalCompositeOperation = 'source-over';
  const out = document.createElement('canvas'); out.width = r[2]; out.height = r[3]; out.getContext('2d').drawImage(granoCv, 0, 0, r[2], r[3], 0, 0, r[2], r[3]); return out;
}

function terminarTrazo(e) {
  const t = trazo; trazo = null; clearTimeout(qsTimer);
  if (!t) return;
  clearTimeout(t.gotT);
  if (t.transf) return terminarTransf(t);
  if (t.arq) return terminarArq(t, e);
  if (t.gotero) { ponerColor(aj.color); if (herrPrevia !== 'gotero') elegirHerramienta(herrPrevia); return; }
  if (t.lazo && t.sel) { trazoCtx.clearRect(0, 0, doc.w, doc.h); pedirSup(); if (t.pts.length > 3) levantarSeleccion(t.capa, t.pts); return; }
  if (t.lazo) { aplicarLazo(t); return; }
  if (t.lapiz) estadoPresion = (t.prMax - t.prMin > 0.04) ? 'ok' : 'plana';
  // toque corto sobre una puerta o mueble con el lápiz: se selecciona (no deja un punto)
  if (!t.borrar && performance.now() - t.t0 < 350 && t.largo * escalaVista() < 6 && Math.hypot(e.clientX - t.sx, e.clientY - t.sy) < 8) {
    const pn = pinEn(t.inicio); if (pn) { trazo = t; cancelarTrazo(); verPin(pn); return; }
    const o = simEn(t.inicio);
    if (o) { trazo = t; cancelarTrazo(); herrAntesSim = herramienta; elegirHerramienta('simbolo'); seleccionar(o); avisarSuave('Arrastra para mover · manija verde para girar · toca fuera para seguir dibujando'); return; }
  }
  // completar la estabilización: alcanzar el último punto real
  if (!t.forma && !t.dir && t.raw.length > 1 && aj.estab > 0.05) {
    const last = t.raw[t.raw.length - 1];
    for (let i = 1; i <= 6; i++) { const f = i / 6; puntoTodos(t, { x: lerp(t.f.x, last.x, f), y: lerp(t.f.y, last.y, f), s: last.s, a: last.a }); }
  }
  if (t.asist && !t.dir && !t.pts.length) agregarPunto(t, t.inicio);
  if (t.forma) dibujarForma(t); // la forma final, con el pincel de verdad
  cancelAnimationFrame(rafComp); rafComp = 0;
  componerTrazo(t); limpiarCursor();
  const r = bbEntero(bbTrazo(t)); if (!r) { trazoCtx.clearRect(0, 0, doc.w, doc.h); return; }
  const antes = recorte(respaldo, r);
  if (!t.borrar) sumarTrazoALineas(t, r); else invalidarLineas(t.capa, r);
  histPx(t.capa, r, antes, true);
  trazoCtx.clearRect(r[0] - 2, r[1] - 2, r[2] + 4, r[3] + 4);
  // líneas rectas: se recuerdan para poder llevarlas a una medida exacta con una cota
  if (!t.borrar && (t.forma && t.forma.tipo === 'linea' || t.dir) && t.pts.length > 1) {
    const a = t.forma ? t.forma.a : t.pts[0], b = t.forma ? t.forma.b : t.pts[t.pts.length - 1];
    if (Math.hypot(b.x - a.x, b.y - a.y) > 3 * doc.pxmm) {
      const L = registrarLinea(t, a, b, r, antes, deshacer[deshacer.length - 1]);
      // cota automática (levantamientos)
      if (doc.cotasAuto && Math.hypot(b.x - a.x, b.y - a.y) > 8 * doc.pxmm) agregarCota(a, b, -6 * doc.pxmm, true, doc.pedirMedida, L);
    }
  }
}

function cancelarTrazo() {
  const t = trazo; trazo = null; clearTimeout(qsTimer); if (!t) return;
  clearTimeout(t.gotT);
  if (t.transf) { cancelarTransf(t); return; }
  if (t.arq) { cancelarArq(t); return; }
  cancelAnimationFrame(rafComp); rafComp = 0;
  if (t.motor) {
    const r = bbEntero(bbTrazo(t));
    if (r) { const c = t.capa.ctx; c.clearRect(r[0], r[1], r[2], r[3]); c.drawImage(respaldo, r[0], r[1], r[2], r[3], r[0], r[1], r[2], r[3]); }
  }
  trazoCtx.clearRect(0, 0, doc.w, doc.h); trazoCv.style.display = 'none'; pedirSup(); limpiarCursor();
}

// ---- relleno con lazo ----
function estiloRelleno(ctx) {
  if (aj.textura.modo === 'textura') return Texturas.patron(ctx, aj.textura.id, aj.color, aj.textura.escala * ESC_TEX);
  if (aj.textura.modo === 'borrar') return '#ff4d4d';
  return aj.color;
}
function caminoLazo(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); }
function previaLazo(t) {
  if (t.sel) { pedirSup(); return; }
  const r = bbEntero([t.bb[0] - 4, t.bb[1] - 4, t.bb[2] + 4, t.bb[3] + 4]);
  if (r) trazoCtx.clearRect(r[0], r[1], r[2], r[3]);
  trazoCtx.globalAlpha = 1; trazoCtx.globalCompositeOperation = 'source-over';
  trazoCtx.fillStyle = estiloRelleno(trazoCtx); caminoLazo(trazoCtx, t.pts); trazoCtx.fill();
  pedirSup();
}
function aplicarLazo(t) {
  trazoCtx.clearRect(0, 0, doc.w, doc.h); trazoCv.style.display = 'none'; pedirSup();
  if (t.pts.length < 3) return;
  const r = bbEntero([t.bb[0] - 2, t.bb[1] - 2, t.bb[2] + 2, t.bb[3] + 2]); if (!r) return;
  const capa = t.capa, c = capa.ctx, antes = recorte(capa.cv, r);
  c.save();
  if (t.modo === 'borrar') { c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; }
  else { c.globalAlpha = t.opc.op; c.fillStyle = estiloRelleno(c); if (capa.bloq) c.globalCompositeOperation = 'source-atop'; }
  caminoLazo(c, t.pts); c.fill(); c.restore();
  histPx(capa, r, antes);
}


// =====================================================================
//  SELECCIÓN Y TRANSFORMAR (como en Procreate)
//  Se encierra una parte con el lazo; queda "flotando" sobre la capa y se puede mover, escalar,
//  girar, voltear, duplicar o borrar. Al tocar fuera o "Listo" se pega en la capa (un solo deshacer).
// =====================================================================
let flot = null; // { capa, cv, w, h, cx, cy, k, ang, fx, fy, corte:{x,y,cv} | null, bbPrev }
const portapapeles = { cv: null, cx: 0, cy: 0 };
function contenidoBB(cv) { // caja de lo dibujado en un canvas
  const w = cv.width, h = cv.height, d = cv.getContext('2d').getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y += 2) { const f = y * w * 4; for (let x = 0; x < w; x += 2) if (d[f + x * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  return x1 < 0 ? null : bbEntero([x0 - 3, y0 - 3, x1 + 4, y1 + 4]);
}
function tieneTinta(cv) { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; for (let i = 3; i < d.length; i += 16) if (d[i] > 8) return true; return false; }
function levantarSeleccion(capa, pts) {
  const bb = [1e9, 1e9, -1e9, -1e9]; for (const p of pts) bbAmpliar(bb, p.x, p.y, 2);
  const r = bbEntero(bb); if (!r || r[2] < 3 || r[3] < 3) return;
  const cv = document.createElement('canvas'); cv.width = r[2]; cv.height = r[3];
  const c = cv.getContext('2d'); c.save(); c.translate(-r[0], -r[1]); caminoLazo(c, pts); c.clip(); c.drawImage(capa.cv, 0, 0); c.restore();
  if (!tieneTinta(cv)) { avisar('No hay nada dibujado ahí en esta capa'); return; }
  const corte = { x: r[0], y: r[1], cv: recorte(capa.cv, r) };
  capa.ctx.save(); caminoLazo(capa.ctx, pts); capa.ctx.clip(); capa.ctx.clearRect(r[0], r[1], r[2], r[3]); capa.ctx.restore();
  invalidarLineas(capa, r);
  crearFlot(capa, cv, r[0] + r[2] / 2, r[1] + r[3] / 2, corte);
}
function seleccionarCapaEntera() {
  const capa = capaActiva(), r = contenidoBB(capa.cv); if (!r) return avisar('La capa está vacía');
  const cv = recorte(capa.cv, r), corte = { x: r[0], y: r[1], cv: recorte(capa.cv, r) };
  capa.ctx.clearRect(r[0], r[1], r[2], r[3]); invalidarLineas(capa, r);
  if (herramienta !== 'seleccion') elegirHerramienta('seleccion');
  crearFlot(capa, cv, r[0] + r[2] / 2, r[1] + r[3] / 2, corte);
}
function crearFlot(capa, cv, cx, cy, corte) {
  if (flot) aplicarFlot();
  doc.activa = doc.capas.indexOf(capa); ubicarTrazoCv();
  flot = { capa, cv, w: cv.width, h: cv.height, cx, cy, k: 1, ang: 0, fx: 1, fy: 1, corte, bbPrev: null, cx0: cx, cy0: cy };
  if (herramienta !== 'seleccion') { herramienta = 'seleccion'; marcarBotones(); }
  trazoCv.style.display = ''; trazoCv.style.opacity = capa.op;
  renderFlot(); ponerBarraTransf();
  avisarSuave('Arrastra para mover · esquinas: tamaño · manija: girar · toca fuera para soltar');
}
function esquinasFlot(f = flot, margen = 0) {
  const co = Math.cos(f.ang), si = Math.sin(f.ang), hw = f.w / 2 * f.k + margen, hh = f.h / 2 * f.k + margen;
  return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => ({ x: f.cx + x * co - y * si, y: f.cy + x * si + y * co }));
}
function dibujarFlotEn(c, f = flot) {
  c.save(); c.translate(f.cx, f.cy); c.rotate(f.ang); c.scale(f.k * f.fx, f.k * f.fy);
  c.imageSmoothingQuality = 'high'; c.drawImage(f.cv, -f.w / 2, -f.h / 2); c.restore();
}
function renderFlot() {
  if (!flot) return;
  trazoCtx.setTransform(1, 0, 0, 1, 0, 0); trazoCtx.globalAlpha = 1; trazoCtx.globalCompositeOperation = 'source-over';
  if (flot.bbPrev) trazoCtx.clearRect(flot.bbPrev[0], flot.bbPrev[1], flot.bbPrev[2], flot.bbPrev[3]);
  dibujarFlotEn(trazoCtx);
  const bb = [1e9, 1e9, -1e9, -1e9]; for (const p of esquinasFlot()) bbAmpliar(bb, p.x, p.y, 3);
  flot.bbPrev = bbEntero(bb) || [0, 0, 0, 0];
  pedirSup();
}
function aplicarFlot() {
  const f = flot; if (!f) return; flot = null;
  const capa = f.capa, sinCambio = f.k === 1 && f.ang === 0 && f.fx === 1 && f.fy === 1 && Math.abs(f.cx - f.cx0) < 0.5 && Math.abs(f.cy - f.cy0) < 0.5;
  trazoCtx.clearRect(0, 0, doc.w, doc.h); trazoCv.style.display = 'none';
  if (sinCambio && f.corte) { pegar(capa.ctx, f.corte.cv, f.corte.x, f.corte.y); capa.sucia = true; }
  else {
    const bb = [1e9, 1e9, -1e9, -1e9]; for (const p of esquinasFlot(f)) bbAmpliar(bb, p.x, p.y, 3);
    if (f.corte) { bbAmpliar(bb, f.corte.x, f.corte.y, 0); bbAmpliar(bb, f.corte.x + f.corte.cv.width, f.corte.y + f.corte.cv.height, 0); }
    const r = bbEntero(bb);
    if (r) {
      const antes = recorte(capa.cv, r); // cómo estaba ANTES de cortar (se repone lo cortado)
      if (f.corte) antes.getContext('2d').drawImage(f.corte.cv, f.corte.x - r[0], f.corte.y - r[1]);
      const c = capa.ctx; c.save(); if (capa.bloq) c.globalCompositeOperation = 'source-atop'; dibujarFlotEn(c, f); c.restore();
      invalidarLineas(capa, r);
      pushHist({ t: 'px', capa, x: r[0], y: r[1], antes, despues: recorte(capa.cv, r), bytes: r[2] * r[3] * 8 }); capa.sucia = true;
    }
  }
  if (capa.ref && doc.capas.length > 1 && doc.activa === 0) { doc.activa = 1; ubicarTrazoCv(); }
  ponerBarraTransf(); pedirSup(); refrescarCapasSiAbierto();
}
function cancelarFlot() {
  const f = flot; if (!f) return; flot = null;
  trazoCtx.clearRect(0, 0, doc.w, doc.h); trazoCv.style.display = 'none';
  if (f.corte) { pegar(f.capa.ctx, f.corte.cv, f.corte.x, f.corte.y); f.capa.sucia = true; }
  ponerBarraTransf(); pedirSup();
}
function borrarFlot() { // lo seleccionado se elimina (con deshacer)
  const f = flot; if (!f) return; flot = null;
  trazoCtx.clearRect(0, 0, doc.w, doc.h); trazoCv.style.display = 'none';
  if (f.corte) { const r = [f.corte.x, f.corte.y, f.corte.cv.width, f.corte.cv.height]; pushHist({ t: 'px', capa: f.capa, x: r[0], y: r[1], antes: f.corte.cv, despues: recorte(f.capa.cv, r), bytes: r[2] * r[3] * 8 }); f.capa.sucia = true; }
  ponerBarraTransf(); pedirSup(); avisar('Selección eliminada');
}
function flotComoImagen(f = flot) { // la selección tal como se ve (girada/escalada)
  const bb = [1e9, 1e9, -1e9, -1e9]; for (const p of esquinasFlot(f)) bbAmpliar(bb, p.x, p.y, 2);
  const w = Math.max(1, Math.ceil(bb[2] - bb[0])), h = Math.max(1, Math.ceil(bb[3] - bb[1]));
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); c.translate(-bb[0], -bb[1]); dibujarFlotEn(c, f);
  return { cv, cx: (bb[0] + bb[2]) / 2, cy: (bb[1] + bb[3]) / 2 };
}
function duplicarFlot() {
  if (!flot) return; const img = flotComoImagen(), capa = flot.capa, d = 24 / escalaVista();
  aplicarFlot(); crearFlot(capa, img.cv, img.cx + d, img.cy + d, null); avisar('Duplicado');
}
// ---- manijas y gestos de transformación ----
function manijasFlot() {
  const q = esquinasFlot().map(p => mApl(M, p.x, p.y)), cx = (q[0].x + q[1].x) / 2, cy = (q[0].y + q[1].y) / 2;
  const mx = (q[0].x + q[1].x + q[2].x + q[3].x) / 4, my = (q[0].y + q[1].y + q[2].y + q[3].y) / 4, dx = cx - mx, dy = cy - my, dl = Math.hypot(dx, dy) || 1;
  return { q, giro: { x: cx + dx / dl * 34, y: cy + dy / dl * 34 }, top: { x: cx, y: cy } };
}
function dentroFlot(x, y) { // punto de pantalla dentro de la caja
  const q = manijasFlot().q; let dentro = false;
  for (let i = 0, j = 3; i < 4; j = i++) { if ((q[i].y > y) !== (q[j].y > y) && x < (q[j].x - q[i].x) * (y - q[i].y) / (q[j].y - q[i].y) + q[i].x) dentro = !dentro; }
  return dentro;
}
function sobreFlot(e) { const m = manijasFlot(), x = e.clientX, y = e.clientY; return Math.hypot(m.giro.x - x, m.giro.y - y) < 26 || m.q.some(p => Math.hypot(p.x - x, p.y - y) < 26) || dentroFlot(x, y); }
function iniciarTransf(e) {
  const m = manijasFlot(), x = e.clientX, y = e.clientY, d = aDoc(x, y);
  const t = { id: e.pointerId, tipo: e.pointerType, t0: performance.now(), largo: 0, transf: true, sx: x, sy: y, d0: d, ini: { cx: flot.cx, cy: flot.cy, k: flot.k, ang: flot.ang } };
  if (Math.hypot(m.giro.x - x, m.giro.y - y) < 26) t.modo = 'girar';
  else if (m.q.some(p => Math.hypot(p.x - x, p.y - y) < 26)) t.modo = 'escalar';
  else if (dentroFlot(x, y)) t.modo = 'mover';
  else { aplicarFlot(); return; } // tocar fuera: se suelta la selección
  trazo = t;
}
function moverTransf(e) {
  const t = trazo, d = aDoc(e.clientX, e.clientY), f = flot; if (!f) return;
  if (t.modo === 'mover') { f.cx = t.ini.cx + d.x - t.d0.x; f.cy = t.ini.cy + d.y - t.d0.y; }
  else if (t.modo === 'escalar') {
    const r0 = Math.hypot(t.d0.x - t.ini.cx, t.d0.y - t.ini.cy) || 1; f.k = Math.max(0.03, t.ini.k * Math.hypot(d.x - f.cx, d.y - f.cy) / r0);
    if (Math.abs(f.k - 1) < 0.02) f.k = 1; avisarSuave(Math.round(f.k * 100) + ' %');
  } else if (t.modo === 'girar') {
    const a0 = Math.atan2(t.d0.y - f.cy, t.d0.x - f.cx); let an = t.ini.ang + Math.atan2(d.y - f.cy, d.x - f.cx) - a0;
    const p = Math.PI / 12, o = Math.round(an / p) * p; if (Math.abs(an - o) < 0.05) an = o; f.ang = an;
    avisarSuave(Math.round(((an * 180 / Math.PI) % 360 + 360) % 360) + '°');
  }
  renderFlot(); ponerBarraTransf();
}
function terminarTransf(t) { ponerBarraTransf(); }
function cancelarTransf(t) { if (flot) { Object.assign(flot, t.ini); renderFlot(); } }
function dibujarManijasFlot(c) {
  const m = manijasFlot(); c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.setLineDash([6, 5]); c.lineWidth = 1.5; c.strokeStyle = '#8ACF00'; c.beginPath(); m.q.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.stroke(); c.setLineDash([]);
  c.beginPath(); c.moveTo(m.top.x, m.top.y); c.lineTo(m.giro.x, m.giro.y); c.stroke();
  for (const p of m.q) { c.beginPath(); c.rect(p.x - 7, p.y - 7, 14, 14); c.fillStyle = '#f2f2f3'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#0b0b0c'; c.stroke(); }
  c.beginPath(); c.arc(m.giro.x, m.giro.y, 11, 0, 6.2832); c.fillStyle = '#8ACF00'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#0b0b0c'; c.stroke();
  c.beginPath(); c.arc(m.giro.x, m.giro.y, 5, -2.4, 1.6); c.stroke();
}
function ponerBarraTransf() { $('transfBar').classList.toggle('oculto', !flot); }
$('tfVoltH').onclick = () => { if (flot) { flot.fx *= -1; renderFlot(); } };
$('tfVoltV').onclick = () => { if (flot) { flot.fy *= -1; renderFlot(); } };
$('tfGirar').onclick = () => { if (flot) { flot.ang = (Math.round(flot.ang / (Math.PI / 2)) + 1) * Math.PI / 2; renderFlot(); } };
$('tfDup').onclick = duplicarFlot;
$('tfBorrar').onclick = borrarFlot;
$('tfCancelar').onclick = cancelarFlot;
$('tfListo').onclick = aplicarFlot;

// ---- copiar y pegar ----
function copiar(cortar) {
  if (flot) { const img = flotComoImagen(); Object.assign(portapapeles, img); if (cortar) borrarFlot(); avisar(cortar ? 'Cortado' : 'Copiado'); return; }
  const capa = capaActiva(), r = contenidoBB(capa.cv); if (!r) return avisar('La capa está vacía');
  portapapeles.cv = recorte(capa.cv, r); portapapeles.cx = r[0] + r[2] / 2; portapapeles.cy = r[1] + r[3] / 2;
  if (cortar) { const antes = recorte(capa.cv, r); capa.ctx.clearRect(r[0], r[1], r[2], r[3]); histPx(capa, r, antes); }
  avisar(cortar ? 'Capa cortada' : 'Capa copiada');
}
function copiarTodo() {
  const cv = document.createElement('canvas'); cv.width = doc.w; cv.height = doc.h; const c = cv.getContext('2d');
  for (const l of doc.capas) if (l.visible) { c.globalAlpha = l.op; c.globalCompositeOperation = l.mezcla === 'multiply' ? 'multiply' : 'source-over'; c.drawImage(l.cv, 0, 0); }
  const r = contenidoBB(cv); if (!r) return avisar('La hoja está vacía');
  portapapeles.cv = recorte(cv, r); portapapeles.cx = r[0] + r[2] / 2; portapapeles.cy = r[1] + r[3] / 2; avisar('Todo copiado');
}
function pegarPortapapeles() {
  if (!portapapeles.cv) return avisar('No hay nada copiado');
  const capa = capaActiva(); if (!capa.visible) return avisar('La capa está oculta');
  const d = 24 / escalaVista(); crearFlot(capa, recorte(portapapeles.cv, [0, 0, portapapeles.cv.width, portapapeles.cv.height]), portapapeles.cx + d, portapapeles.cy + d, null);
}
function menuCopiarPegar() {
  modal(`<h3>Copiar y pegar</h3><div class="lista-acc">
    <button id="cpCopiar">${flot ? 'Copiar selección' : 'Copiar capa'}</button><button id="cpCortar">${flot ? 'Cortar selección' : 'Cortar capa'}</button>
    <button id="cpTodo">Copiar todo (capas visibles)</button><button id="cpPegar" ${portapapeles.cv ? '' : 'disabled'}>Pegar</button>
    <button id="cpSelTodo">Seleccionar toda la capa</button></div>
    <div class="modal-btns"><span style="flex:1"></span><button id="mNo">Cerrar</button></div>`, cerrar => {
    $('cpCopiar').onclick = () => { cerrar(); copiar(false); }; $('cpCortar').onclick = () => { cerrar(); copiar(true); };
    $('cpTodo').onclick = () => { cerrar(); copiarTodo(); }; $('cpPegar').onclick = () => { cerrar(); pegarPortapapeles(); };
    $('cpSelTodo').onclick = () => { cerrar(); seleccionarCapaEntera(); }; $('mNo').onclick = cerrar;
  });
}

// ---- gotero ----
const muestraCv = document.createElement('canvas'); muestraCv.width = muestraCv.height = 1;
const muestraCtx = muestraCv.getContext('2d', { willReadFrequently: true });
function tomarColor(e) {
  const d = aDoc(e.clientX, e.clientY); if (d.x < 0 || d.y < 0 || d.x >= doc.w || d.y >= doc.h) return;
  const x = Math.floor(d.x), y = Math.floor(d.y);
  muestraCtx.globalAlpha = 1; muestraCtx.globalCompositeOperation = 'source-over';
  muestraCtx.fillStyle = papelDe(doc.papel).color; muestraCtx.fillRect(0, 0, 1, 1);
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
// Como en Procreate: al reconocer la forma, si se sigue presionando y se mueve el lápiz, la forma se
// agranda/achica y gira (la línea mueve su extremo). Tocar la pantalla con un dedo mientras tanto la
// vuelve perfecta: elipse → círculo, rectángulo → cuadrado, línea → ángulo exacto de 15°.
const NOMBRE_FORMA = { linea: 'Línea recta', elipse: 'Elipse', circulo: 'Círculo', rect: 'Rectángulo', poli: 'Polilínea', tri: 'Triángulo' };
function intentarForma(t) {
  if (trazo !== t || t.forma || t.dir || t.pts.length < 6 || t.largo * escalaVista() < 40) return;
  let f = detectarForma(t.pts); if (!f) return;
  if (f.tipo === 'rect') f = { tipo: 'rect', cx: (f.x0 + f.x1) / 2, cy: (f.y0 + f.y1) / 2, hw: (f.x1 - f.x0) / 2, hh: (f.y1 - f.y0) / 2, ang: 0 };
  else if (f.tipo === 'elipse' || f.tipo === 'circulo') f.ang = 0;
  t.forma = f; anclarForma(t); dibujarFormaPrevia(t); pedirComp();
  avisar(NOMBRE_FORMA[f.tipo] + (f.tipo === 'linea' ? '' : ' · sigue presionando y mueve para agrandar o girar'));
}
function anclarForma(t) { const p = t.raw[t.raw.length - 1]; t.forma0 = JSON.parse(JSON.stringify(t.forma)); t.ancla = { x: p.x, y: p.y }; }
function centroForma(f) {
  if (f.tipo === 'poli') { let x = 0, y = 0; for (const p of f.v) { x += p.x; y += p.y; } return { x: x / f.v.length, y: y / f.v.length }; }
  return { x: f.cx, y: f.cy };
}
const ajustarAng = an => { const p = Math.PI / 12, o = Math.round(an / p) * p; return Math.abs(an - o) < 0.05 ? o : an; };
function editarForma(t, p) { // la forma sigue al lápiz mientras se mantiene presionado
  const f0 = t.forma0;
  if (f0.tipo === 'linea') { t.forma.b = enderezarFin(t.forma.a, p); }
  else {
    const c = centroForma(f0), v0x = t.ancla.x - c.x, v0y = t.ancla.y - c.y, d0 = Math.hypot(v0x, v0y);
    if (d0 < 2) return;
    const k = Math.max(0.05, Math.hypot(p.x - c.x, p.y - c.y) / d0);
    let th = Math.atan2(p.y - c.y, p.x - c.x) - Math.atan2(v0y, v0x);
    const f = JSON.parse(JSON.stringify(f0));
    if (f.tipo === 'poli') {
      th = ajustarAng(th); const co = Math.cos(th) * k, si = Math.sin(th) * k;
      f.v = f0.v.map(q => ({ x: c.x + (q.x - c.x) * co - (q.y - c.y) * si, y: c.y + (q.x - c.x) * si + (q.y - c.y) * co }));
    } else if (f.tipo === 'circulo') { f.rx = f0.rx * k; f.ry = f0.ry * k; }
    else if (f.tipo === 'elipse') { f.rx = f0.rx * k; f.ry = f0.ry * k; f.ang = ajustarAng(f0.ang + th); }
    else if (f.tipo === 'rect') { f.hw = f0.hw * k; f.hh = f0.hh * k; f.ang = ajustarAng(f0.ang + th); }
    t.forma = f;
  }
}
function medidaForma(f) { // en hojas a escala se ve la medida real mientras se ajusta
  if (!doc || doc.tipo === 'boceto' || doc.tipo === 'perspectiva') return;
  if (f.tipo === 'linea') avisarSuave(fmtM(metros(Math.hypot(f.b.x - f.a.x, f.b.y - f.a.y))) + ' m');
  else if (f.tipo === 'circulo') avisarSuave('Ø ' + fmtM(metros(f.rx * 2)) + ' m');
  else if (f.tipo === 'rect') avisarSuave(fmtM(metros(f.hw * 2)) + ' × ' + fmtM(metros(f.hh * 2)) + ' m');
}
function perfeccionarForma(t) { // dedo sobre la pantalla mientras se mantiene la forma
  const f = t.forma; if (!f) return;
  if (f.tipo === 'elipse') { const r = (f.rx + f.ry) / 2; f.tipo = 'circulo'; f.rx = f.ry = r; f.ang = 0; }
  else if (f.tipo === 'rect') { const m = (f.hw + f.hh) / 2; f.hw = f.hh = m; }
  else if (f.tipo === 'linea') { const dx = f.b.x - f.a.x, dy = f.b.y - f.a.y, L = Math.hypot(dx, dy), p = Math.PI / 12, an = Math.round(Math.atan2(dy, dx) / p) * p; f.b = { x: f.a.x + Math.cos(an) * L, y: f.a.y + Math.sin(an) * L }; }
  else if (f.tipo === 'poli') { for (let i = 1; i < f.v.length; i++) f.v[i] = enderezarFin(f.v[i - 1], f.v[i], true); }
  anclarForma(t); dibujarFormaPrevia(t); pedirComp();
  avisar({ circulo: 'Círculo perfecto', rect: 'Cuadrado', linea: 'Ángulo exacto', poli: 'Ángulos exactos' }[f.tipo] || 'Forma perfecta');
}
// simplifica un recorrido a sus vértices (Ramer–Douglas–Peucker)
function simplificar(pts, eps) {
  if (pts.length < 3) return pts.slice();
  const a = pts[0], b = pts[pts.length - 1], L = Math.hypot(b.x - a.x, b.y - a.y);
  let dm = 0, im = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], d = L < 1e-6 ? Math.hypot(p.x - a.x, p.y - a.y) : Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / L;
    if (d > dm) { dm = d; im = i; }
  }
  if (dm <= eps) return [a, b];
  const izq = simplificar(pts.slice(0, im + 1), eps), der = simplificar(pts.slice(im), eps);
  return izq.slice(0, -1).concat(der);
}
function detectarPoli(pts, L) {
  const v = simplificar(pts, Math.max(3, 0.035 * L)); if (v.length < 3 || v.length > 9) return null;
  for (let i = 1; i < v.length; i++) { // cada tramo debe ser recto y no muy corto
    const a = v[i - 1], b = v[i], l = Math.hypot(b.x - a.x, b.y - a.y); if (l < 0.06 * L) return null;
    const i0 = pts.indexOf(a), i1 = pts.indexOf(b);
    for (let j = i0; j <= i1; j++) { const p = pts[j]; if (Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / l > 0.07 * l + 2) return null; }
  }
  for (let i = 1; i < v.length - 1; i++) { // esquinas marcadas (no una curva)
    const a = v[i - 1], b = v[i], c = v[i + 1], g = Math.abs(Math.atan2((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x), (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y)));
    if (g < 0.4) return null;
  }
  const out = v.map(p => ({ x: p.x, y: p.y })), ini = out[0], fin = out[out.length - 1];
  const cerrado = Math.hypot(fin.x - ini.x, fin.y - ini.y) < 0.12 * L;
  if (cerrado) { out.pop(); if (out.length < 3) return null; }
  for (let i = 1; i < out.length; i++) out[i] = enderezarFin(out[i - 1], out[i]);
  return { tipo: 'poli', v: out, cerrado };
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
  const pl = detectarPoli(pts, L); if (pl) return pl; // triángulos, muros en L, contornos de varios lados
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
function enderezarFin(a, b, exacto) { // ángulos de 0/45/90° cuando está cerca (exacto: siempre a 15°)
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), an = Math.atan2(dy, dx), paso = exacto ? Math.PI / 12 : Math.PI / 4, obj = Math.round(an / paso) * paso;
  if (exacto || Math.abs(an - obj) < 0.07) return { x: a.x + Math.cos(obj) * L, y: a.y + Math.sin(obj) * L };
  return { x: b.x, y: b.y };
}
// Mientras se mantiene presionado y se ajusta la forma, se muestra una VISTA PREVIA liviana (una sola línea
// vectorial por cuadro): así agrandar y girar va fluido. El pincel real se dibuja una sola vez al soltar.
function medidasTrazo(t) { let s = 0, a = 0; for (const p of t.pts) { s += p.s; a += p.a; } return { s: s / t.pts.length, a: a / t.pts.length }; }
function dibujarFormaPrevia(t) {
  const prev = t.bbPrev || bbTrazo(t), r = bbEntero([prev[0] - 4, prev[1] - 4, prev[2] + 4, prev[3] + 4]);
  if (r) trazoCtx.clearRect(r[0], r[1], r[2], r[3]);
  const { s, a } = medidasTrazo(t), pts = puntosForma(t), c = trazoCtx, pin = t.pin;
  const caminos = [pts].concat((t.esp || []).map(fn => pts.map(([x, y]) => { const q = fn({ x, y }); return [q.x, q.y]; })));
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over';
  c.globalAlpha = pin.tip === 'grano' ? Math.min(1, a * 2.2) : pin.tip === 'suave' ? 0.5 : Math.min(1, pin.alfa || 1);
  c.strokeStyle = t.borrar ? '#000000' : aj.color; c.lineWidth = Math.max(1, pin.tip === 'grano' ? s * 0.8 : s); c.lineCap = c.lineJoin = 'round';
  const bb = [1e9, 1e9, -1e9, -1e9];
  for (const cam of caminos) { c.beginPath(); cam.forEach(([x, y], i) => { i ? c.lineTo(x, y) : c.moveTo(x, y); bbAmpliar(bb, x, y, s + 4); }); c.stroke(); }
  c.restore();
  const u = prev.slice(); bbAmpliar(u, bb[0], bb[1], 0); bbAmpliar(u, bb[2], bb[3], 0);
  t.bbPrev = bb; t.motor.sucio = u; t.pred = null;
  medidaForma(t.forma);
}
function dibujarForma(t) {
  const f = t.forma, bb = bbTrazo(t);
  if (t.bbPrev) { bbAmpliar(bb, t.bbPrev[0], t.bbPrev[1], 0); bbAmpliar(bb, t.bbPrev[2], t.bbPrev[3], 0); t.bbPrev = null; }
  const r = bbEntero([bb[0] - 4, bb[1] - 4, bb[2] + 4, bb[3] + 4]);
  if (r) trazoCtx.clearRect(r[0], r[1], r[2], r[3]);
  const { s, a } = medidasTrazo(t);
  const viejo = bb;
  t.motor = crearTrazo(trazoCtx, t.pin, t.borrar ? '#000000' : aj.color, aj.textura);
  if (t.motores) t.motores = t.motores.map(() => crearTrazo(trazoCtx, t.pin, t.borrar ? '#000000' : aj.color, aj.textura));
  bbAmpliar(t.motor.bb, viejo[0], viejo[1], 0); bbAmpliar(t.motor.bb, viejo[2], viejo[3], 0); // para limpiar bien
  for (const [x, y] of puntosForma(t)) puntoTodos(t, { x, y, s, a });
  t.motor.sucio = bbTrazo(t); pedirComp();
}
function puntosForma(t) {
  const f = t.forma, pts = [];
  if (f.tipo === 'linea') { const L = Math.hypot(f.b.x - f.a.x, f.b.y - f.a.y), n = Math.max(2, Math.ceil(L / 2)); for (let i = 0; i <= n; i++) pts.push([lerp(f.a.x, f.b.x, i / n), lerp(f.a.y, f.b.y, i / n)]); }
  else if (f.tipo === 'rect' || f.tipo === 'poli') {
    let c;
    if (f.tipo === 'rect') { const co = Math.cos(f.ang || 0), si = Math.sin(f.ang || 0), P = (x, y) => [f.cx + x * co - y * si, f.cy + x * si + y * co]; c = [P(-f.hw, -f.hh), P(f.hw, -f.hh), P(f.hw, f.hh), P(-f.hw, f.hh)]; c.push(c[0]); }
    else { c = f.v.map(p => [p.x, p.y]); if (f.cerrado) c.push(c[0]); }
    for (let k = 0; k < c.length - 1; k++) { const [p, q] = [c[k], c[k + 1]], n = Math.max(2, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 2)); for (let i = 0; i < n; i++) pts.push([lerp(p[0], q[0], i / n), lerp(p[1], q[1], i / n)]); }
    pts.push(c[c.length - 1]);
  }
  else { const n = Math.max(24, Math.ceil(Math.PI * (f.rx + f.ry) / 2)), co = Math.cos(f.ang || 0), si = Math.sin(f.ang || 0), a0 = Math.atan2(t.pts[0].y - f.cy, t.pts[0].x - f.cx) - (f.ang || 0); for (let i = 0; i <= n; i++) { const an = a0 + i / n * 6.2832, x = Math.cos(an) * f.rx, y = Math.sin(an) * f.ry; pts.push([f.cx + x * co - y * si, f.cy + x * si + y * co]); } }
  return pts;
}

// =====================================================================
//  ARQUITECTURA: cotas, textos, símbolos, rótulo (objetos editables)
// =====================================================================
const anotCv = document.createElement('canvas'); anotCv.id = 'anotCv';
const anotCtx = anotCv.getContext('2d');
const ESCALAS = [1, 5, 10, 20, 25, 50, 75, 100, 125, 200, 250, 500, 1000];
const TAM_TEXTO = { p: 2.5, m: 3.5, g: 5, t: 7 };
const metros = px => px / doc.pxmm * doc.escala / 1000;
const pxDeMetros = m => m * 1000 / doc.escala * doc.pxmm;
const fmtM = m => (Math.round(m * 100) / 100).toFixed(2);
function snapObj() { return JSON.stringify(doc.objetos); }
function histObj(antes) { pushHist({ t: 'obj', antes, despues: snapObj() }); renderObjetos(); }
function papelOscuro() { return ['negro', 'gris', 'kraft'].includes(doc.papel); }

function geomCota(o) {
  const dx = o.b.x - o.a.x, dy = o.b.y - o.a.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, off = o.off || 0;
  return { L, ux, uy, nx, ny, a2: { x: o.a.x + nx * off, y: o.a.y + ny * off }, b2: { x: o.b.x + nx * off, y: o.b.y + ny * off } };
}
function dibujarCota(c, o, previa) {
  const g = geomCota(o), mm = doc.pxmm, lw = Math.max(1, 0.18 * mm), tick = 1.6 * mm;
  c.save(); c.strokeStyle = c.fillStyle = o.color || '#1d1d1f'; c.lineWidth = lw; c.lineCap = 'round';
  c.beginPath();
  if (o.off) { // líneas de extensión
    const s = Math.sign(o.off), e = 1.2 * mm;
    c.moveTo(o.a.x + g.nx * s * 0.8 * mm, o.a.y + g.ny * s * 0.8 * mm); c.lineTo(g.a2.x + g.nx * s * e, g.a2.y + g.ny * s * e);
    c.moveTo(o.b.x + g.nx * s * 0.8 * mm, o.b.y + g.ny * s * 0.8 * mm); c.lineTo(g.b2.x + g.nx * s * e, g.b2.y + g.ny * s * e);
  }
  c.moveTo(g.a2.x - g.ux * 1.5 * mm, g.a2.y - g.uy * 1.5 * mm); c.lineTo(g.b2.x + g.ux * 1.5 * mm, g.b2.y + g.uy * 1.5 * mm);
  for (const p of [g.a2, g.b2]) { // marcas a 45°
    const tx = (g.ux + g.nx) * 0.7071 * tick / 2, ty = (g.uy + g.ny) * 0.7071 * tick / 2;
    c.moveTo(p.x - tx, p.y - ty); c.lineTo(p.x + tx, p.y + ty);
  }
  c.stroke();
  const txt = o.texto != null && o.texto !== '' ? o.texto : fmtM(metros(g.L));
  let an = Math.atan2(g.uy, g.ux); if (an > Math.PI / 2 + 0.01 || an < -Math.PI / 2 + 0.01) an += Math.PI;
  const mx = (g.a2.x + g.b2.x) / 2, my = (g.a2.y + g.b2.y) / 2, fs = 2.6 * mm;
  c.translate(mx, my); c.rotate(an);
  c.font = `600 ${fs}px -apple-system,Roboto,"Segoe UI",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'bottom';
  c.lineWidth = fs * 0.28; c.strokeStyle = papelDe(doc.papel).color; c.lineJoin = 'round'; c.strokeText(txt, 0, -0.6 * mm);
  c.fillText(txt, 0, -0.6 * mm);
  if (o.texto && !previa) { c.fillStyle = 'rgba(138,207,0,.9)'; c.beginPath(); c.arc(c.measureText(txt).width / 2 + 1.2 * mm, -fs * 0.55, 0.6 * mm, 0, 6.2832); c.fill(); }
  c.restore();
}
function lineasTexto(o) { return String(o.texto || '').split('\n'); }
function dibujarTexto(c, o) {
  const fs = (TAM_TEXTO[o.tam] || 3.5) * doc.pxmm, lh = fs * 1.25, lin = lineasTexto(o);
  c.save(); c.font = `${o.tam === 't' ? 700 : 500} ${fs}px -apple-system,Roboto,"Segoe UI",sans-serif`; c.textBaseline = 'top'; c.fillStyle = o.color || '#1d1d1f';
  let w = 0; for (const l of lin) w = Math.max(w, c.measureText(l).width);
  const h = lh * lin.length, pad = fs * 0.35;
  o._bb = [o.x - pad, o.y - pad, o.x + w + pad, o.y + h + pad];
  if (o.caja) { c.strokeStyle = o.color || '#1d1d1f'; c.lineWidth = Math.max(1, 0.25 * doc.pxmm); c.strokeRect(o.x - pad, o.y - pad, w + pad * 2, h + pad * 2); }
  lin.forEach((l, i) => c.fillText(l, o.x, o.y + i * lh));
  c.restore();
}
function dibujarRotulo(c) {
  const mm = doc.pxmm, W = 92 * mm, H = 34 * mm, x = doc.w - W - 8 * mm, y = doc.h - H - 8 * mm, inf = doc.info || {};
  const col = papelOscuro() ? '#f2f2f3' : '#1d1d1f';
  c.save(); c.strokeStyle = c.fillStyle = col; c.lineWidth = Math.max(1, 0.35 * mm);
  c.fillStyle = papelDe(doc.papel).color; c.fillRect(x, y, W, H); c.fillStyle = col;
  c.strokeRect(x, y, W, H);
  const fil = [['PROYECTO', inf.proyecto], ['PLANO', inf.plano || ({ levantamiento: 'Levantamiento', planta: 'Planta', elevacion: 'Elevación / corte' }[doc.tipo] || '')], ['UBICACIÓN', inf.ubicacion], ['LEVANTÓ / DIBUJÓ', inf.autor]];
  const fh = H / 5;
  c.lineWidth = Math.max(1, 0.18 * mm); c.beginPath();
  for (let i = 1; i < 5; i++) { c.moveTo(x, y + fh * i); c.lineTo(x + W, y + fh * i); }
  c.moveTo(x + W * 0.5, y + fh * 4); c.lineTo(x + W * 0.5, y + H); c.stroke();
  const et = (t, xx, yy) => { c.font = `600 ${1.8 * mm}px -apple-system,Roboto,sans-serif`; c.globalAlpha = 0.6; c.fillText(t, xx + 1.4 * mm, yy + 1.2 * mm); c.globalAlpha = 1; };
  const va = (t, xx, yy, w) => { c.font = `600 ${2.9 * mm}px -apple-system,Roboto,sans-serif`; let s = String(t || ''); while (s && c.measureText(s).width > w - 3 * mm) s = s.slice(0, -1); c.fillText(s, xx + 1.4 * mm, yy + 3.6 * mm); };
  c.textBaseline = 'top';
  fil.forEach(([e, v], i) => { et(e, x, y + fh * i); va(v, x, y + fh * i, W); });
  et('ESCALA', x, y + fh * 4); va('1/' + doc.escala, x, y + fh * 4, W / 2);
  et('FECHA', x + W / 2, y + fh * 4); va(inf.fecha || new Date(doc.creado).toLocaleDateString('es-PE'), x + W / 2, y + fh * 4, W / 2);
  // escala gráfica
  const paso = [0.5, 1, 2, 5, 10, 20, 50].find(m => pxDeMetros(m) > 9 * mm) || 1, n = 4, sw = pxDeMetros(paso), sy = y - 7 * mm, bh = 1.6 * mm;
  for (let i = 0; i < n; i++) { c.lineWidth = Math.max(1, 0.18 * mm); c.strokeRect(x + i * sw, sy, sw, bh); if (i % 2 === 0) c.fillRect(x + i * sw, sy, sw, bh); }
  c.font = `500 ${2 * mm}px -apple-system,Roboto,sans-serif`; c.textBaseline = 'bottom'; c.textAlign = 'center';
  for (let i = 0; i <= n; i++) c.fillText(String(Math.round(paso * i * 100) / 100), x + i * sw, sy - 0.6 * mm);
  c.textAlign = 'left'; c.fillText('m', x + n * sw + 2 * mm, sy + bh + 0.4 * mm);
  c.restore();
}
function renderObjetos(previa, previaSim) {
  if (!doc) return;
  if (anotCv.width !== doc.w || anotCv.height !== doc.h) { anotCv.width = doc.w; anotCv.height = doc.h; anotCv.style.width = doc.w + 'px'; anotCv.style.height = doc.h + 'px'; }
  const c = anotCtx; c.clearRect(0, 0, doc.w, doc.h);
  if (doc.rotulo) dibujarRotulo(c);
  for (const o of doc.objetos) { if (o.tipo === 'cota') dibujarCota(c, o); else if (o.tipo === 'texto') dibujarTexto(c, o); else if (o.tipo === 'simbolo') dibujarSim(c, o); }
  for (const o of doc.objetos) if (o.tipo === 'pin') dibujarPin(c, o); // las notas siempre encima
  if (previa) dibujarCota(c, previa, true);
  if (previaSim) dibujarSim(c, previaSim);
  anotCv.style.display = doc.verAnot === false ? 'none' : '';
}
function objetoEn(d) {
  const tol = 16 / escalaVista();
  for (let i = doc.objetos.length - 1; i >= 0; i--) {
    const o = doc.objetos[i];
    if (o.tipo === 'texto' && o._bb && d.x >= o._bb[0] - tol / 2 && d.x <= o._bb[2] + tol / 2 && d.y >= o._bb[1] - tol / 2 && d.y <= o._bb[3] + tol / 2) return o;
    if (o.tipo === 'cota') {
      const g = geomCota(o), px = d.x - g.a2.x, py = d.y - g.a2.y, k = clamp((px * g.ux + py * g.uy) / g.L, 0, 1);
      if (Math.hypot(d.x - (g.a2.x + g.ux * g.L * k), d.y - (g.a2.y + g.uy * g.L * k)) < tol + 3 * doc.pxmm) return o;
    }
  }
  return null;
}
function imanCota(d) { // une cotas en cadena
  const tol = 18 / escalaVista();
  for (const o of doc.objetos) if (o.tipo === 'cota') for (const p of [o.a, o.b]) if (Math.hypot(p.x - d.x, p.y - d.y) < tol) return { x: p.x, y: p.y };
  for (const L of lineas.values()) if (lineaUsable(L)) for (const p of [L.p, L.q]) if (Math.hypot(p.x - d.x, p.y - d.y) < tol) return { x: p.x, y: p.y }; // extremos de líneas dibujadas
  return d;
}
const lineaDe = new WeakMap(); // cota recién creada → su paso de deshacer (para unir la edición en el mismo paso)

// ---- líneas rectas recordadas: se pueden llevar a una medida exacta (a escala) ----
// Cada línea recta (enderezada o con guía) guarda cómo era la hoja debajo de ella. Mientras nada se dibuje
// encima, una cota sobre esa línea puede redibujarla con la longitud que se escriba.
const lineas = new Map(); let idLinea = 1;
const cruzan = (r, s) => r[0] < s[0] + s[2] && s[0] < r[0] + r[2] && r[1] < s[1] + s[3] && s[1] < r[1] + r[3];
const fotoLinea = L => ({ p: L.p, q: L.q, r: L.r, debajo: L.debajo, ok: true });
function invalidarLineas(capa, r) { for (const L of lineas.values()) if (L.ok && L.capa === capa && (!r || cruzan(L.r, r))) L.ok = false; }
// un trazo nuevo que cruza una línea recordada se suma a lo que hay "debajo" de ella (así una esquina no la bloquea)
function sumarTrazoALineas(t, r, salvo) {
  for (const L of lineas.values()) if (L !== salvo && L.ok && L.capa === t.capa && cruzan(L.r, r)) {
    const cv = recorte(L.debajo, [0, 0, L.debajo.width, L.debajo.height]), c = cv.getContext('2d');
    c.globalAlpha = t.op; c.globalCompositeOperation = t.gco;
    c.drawImage(trazoCv, L.r[0], L.r[1], L.r[2], L.r[3], 0, 0, L.r[2], L.r[3]);
    L.debajo = cv;
  }
}
function registrarLinea(t, p, q, r, debajo, ent) {
  let s = 0, a = 0; for (const k of t.pts) { s += k.s; a += k.a; }
  const L = { id: idLinea++, capa: t.capa, pin: t.pin, s: s / t.pts.length, alfa: a / t.pts.length, op: t.op, gco: t.gco, color: aj.color, tex: Object.assign({}, aj.textura),
    p: { x: p.x, y: p.y }, q: { x: q.x, y: q.y }, r, debajo: recorte(debajo, [0, 0, debajo.width, debajo.height]), ok: true };
  lineas.set(L.id, L);
  if (lineas.size > 120) lineas.delete(lineas.keys().next().value);
  if (ent) ent.lnk = { L, antes: null, despues: fotoLinea(L) };
  return L;
}
function lineaUsable(L) { return L && L.ok && doc.capas.includes(L.capa) && L.capa.visible; }
// la línea dibujada que coincide con los extremos de una cota
function lineaDeCota(o) {
  const tol = Math.max(2.5 * doc.pxmm, 16 / escalaVista()), cerca = (u, v) => Math.hypot(u.x - v.x, u.y - v.y) < tol;
  const coincide = L => lineaUsable(L) && (cerca(L.p, o.a) && cerca(L.q, o.b) || cerca(L.q, o.a) && cerca(L.p, o.b));
  const L = lineas.get(o.lid); if (coincide(L)) return L;
  let mejor = null; for (const x of lineas.values()) if (coincide(x)) mejor = x; // la más reciente
  return mejor;
}
// redibuja la línea con la longitud nueva (el extremo que coincide con el inicio de la cota se queda fijo)
function redibujarLinea(L, o, largo) {
  const capa = L.capa, c = capa.ctx;
  const deP = Math.hypot(L.p.x - o.a.x, L.p.y - o.a.y) <= Math.hypot(L.q.x - o.a.x, L.q.y - o.a.y);
  const p0 = deP ? L.p : L.q, p1 = deP ? L.q : L.p, l0 = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
  const fin = { x: p0.x + (p1.x - p0.x) / l0 * largo, y: p0.y + (p1.y - p0.y) / l0 * largo };
  const m = crearTrazo(trazoCtx, L.pin, L.color, L.tex), n = Math.max(2, Math.ceil(largo / 2));
  for (let i = 0; i <= n; i++) trazoPunto(m, { x: lerp(p0.x, fin.x, i / n), y: lerp(p0.y, fin.y, i / n), s: L.s, a: L.alfa });
  const bb = m.bb.slice(); bbAmpliar(bb, L.r[0], L.r[1], 0); bbAmpliar(bb, L.r[0] + L.r[2], L.r[1] + L.r[3], 0);
  const r = bbEntero(bb); if (!r) { trazoCtx.clearRect(0, 0, doc.w, doc.h); return null; }
  const antes = recorte(capa.cv, r);
  pegar(c, L.debajo, L.r[0], L.r[1]);            // borra la línea vieja (vuelve la hoja como estaba)
  const debajo = recorte(capa.cv, r);
  sumarTrazoALineas({ capa, op: L.op, gco: L.gco }, r, L);
  c.save(); c.globalAlpha = L.op; c.globalCompositeOperation = L.gco; c.drawImage(trazoCv, r[0], r[1], r[2], r[3], r[0], r[1], r[2], r[3]); c.restore();
  trazoCtx.clearRect(r[0] - 2, r[1] - 2, r[2] + 4, r[3] + 4);
  capa.sucia = true;
  const previo = fotoLinea(L);
  Object.assign(L, { p: { x: p0.x, y: p0.y }, q: fin, r, debajo, ok: true });
  return { t: 'px', capa, x: r[0], y: r[1], antes, despues: recorte(capa.cv, r), bytes: r[2] * r[3] * 12, lnk: { L, antes: previo, despues: fotoLinea(L) } };
}

function agregarCota(a, b, off, auto, preguntar, linea) {
  const antes = snapObj();
  const o = { tipo: 'cota', a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y }, off: off || 0, color: aj.color, id: Date.now() + Math.random() };
  if (linea) o.lid = linea.id;
  doc.objetos.push(o);
  if (auto && deshacer.length && deshacer[deshacer.length - 1].t === 'px') { // un solo deshacer para línea + cota
    const px = deshacer.pop(); bytesHist -= px.bytes || 0;
    const ent = { t: 'multi', items: [px, { t: 'obj', antes, despues: snapObj() }], bytes: px.bytes };
    pushHist(ent); renderObjetos();
    lineaDe.set(o, { ent });
  } else { histObj(antes); lineaDe.set(o, { ent: deshacer[deshacer.length - 1] }); }
  if (preguntar) editarCota(o, true);
}
// quita una cota recién creada (sin medida): la línea dibujada se queda
function descartarCota(o) {
  const L = lineaDe.get(o), ult = deshacer[deshacer.length - 1];
  const i = doc.objetos.indexOf(o); if (i >= 0) doc.objetos.splice(i, 1);
  if (L && L.ent === ult) {
    if (ult.t === 'multi') deshacer[deshacer.length - 1] = ult.items[0]; else { deshacer.pop(); }
  }
  renderObjetos(); marcarCambio();
}


// ---- notas con punto (pines numerados en el plano) ----
const COLOR_PIN = '#ff7a2f';
const radioPin = () => 5 * doc.pxmm;
function dibujarPin(c, o) {
  const r = radioPin(), x = o.x, y = o.y;
  c.save(); c.fillStyle = o.color || COLOR_PIN; c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1, 0.35 * doc.pxmm);
  c.beginPath(); c.moveTo(x, y); c.lineTo(x - r * 0.62, y - r * 1.1); c.arc(x, y - r * 1.75, r, Math.PI * 0.78, Math.PI * 2.22); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#fff'; c.font = `700 ${r * 1.05}px -apple-system,Roboto,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(o.n), x, y - r * 1.72);
  c.restore();
}
function pinEn(d) {
  if (!doc) return null; const r = radioPin(), tol = 10 / escalaVista();
  for (let i = doc.objetos.length - 1; i >= 0; i--) { const o = doc.objetos[i]; if (o.tipo === 'pin' && Math.hypot(d.x - o.x, d.y - (o.y - r * 1.6)) < r * 1.4 + tol) return o; }
  return null;
}
function nuevoPin(d) {
  const antes = snapObj(), n = doc.objetos.filter(o => o.tipo === 'pin').reduce((m, o) => Math.max(m, o.n), 0) + 1;
  const o = { tipo: 'pin', x: d.x, y: d.y, n, texto: '', id: Date.now() + Math.random() };
  doc.objetos.push(o); renderObjetos(); editarPin(o, antes);
}
function editarPin(o, antesNuevo) {
  const nuevo = !!antesNuevo;
  modal(`<h3>Nota ${o.n}</h3>
    <textarea id="pTxt" rows="4" placeholder="Ej.: fisura en el muro · cambiar tomacorriente · humedad a 1.20 m">${escapar(o.texto || '')}</textarea>
    <div class="modal-btns">${nuevo ? '' : '<button class="rojo" id="pBor">Eliminar</button>'}<span style="flex:1"></span><button id="mNo">Cancelar</button><button class="ok" id="mSi">Guardar</button></div>`, cerrar => {
    const i = $('pTxt'); setTimeout(() => i.focus(), 60);
    const quitarNuevo = () => { const k = doc.objetos.indexOf(o); if (k >= 0) doc.objetos.splice(k, 1); renderObjetos(); };
    $('mNo').onclick = () => { cerrar(); if (nuevo) quitarNuevo(); };
    if (!nuevo) $('pBor').onclick = () => { const antes = snapObj(); doc.objetos.splice(doc.objetos.indexOf(o), 1); cerrar(); histObj(antes); refrescarPines(); };
    $('mSi').onclick = () => {
      const v = i.value.trim(); cerrar();
      if (!v && nuevo) return quitarNuevo();
      const antes = nuevo ? antesNuevo : snapObj(); o.texto = v; histObj(antes); if (nuevo) ventanaPines = true; refrescarPines();
    };
  }, () => { if (nuevo) { const k = doc.objetos.indexOf(o); if (k >= 0) doc.objetos.splice(k, 1); renderObjetos(); } });
}
function refrescarPines() { if (panelAbierto('pNotas')) pintarNotas(); pintarVentanaPines(); if (pinVisto && !doc.objetos.includes(pinVisto)) ocultarPin(); }
// ---- ver una nota: globo junto al punto (se abre con el dedo o el lápiz) ----
let pinVisto = null;
function verPin(o) {
  pinVisto = o; const g = $('pinGlobo');
  g.innerHTML = `<div class="pg-cab"><b>${o.n}</b><span>Nota ${o.n}</span><button class="pg-x" data-a="x">×</button></div>
    <div class="pg-txt">${o.texto ? escapar(o.texto).replace(/\n/g, '<br>') : '<i>Sin texto</i>'}</div>
    <div class="pg-btns"><button data-a="borrar" class="peligro">Eliminar</button><button data-a="editar" class="ok">Editar</button></div>`;
  g.onclick = ev => { const a = ev.target.closest('button')?.dataset.a; if (!a) return;
    if (a === 'x') ocultarPin(); else if (a === 'editar') { ocultarPin(); editarPin(o); }
    else if (a === 'borrar') { ocultarPin(); const antes = snapObj(); doc.objetos.splice(doc.objetos.indexOf(o), 1); histObj(antes); refrescarPines(); } };
  g.classList.remove('oculto'); ubicarGloboPin(); pintarVentanaPines();
}
function ocultarPin() { pinVisto = null; $('pinGlobo').classList.add('oculto'); pintarVentanaPines(); }
function ubicarGloboPin() {
  if (!pinVisto) return; const g = $('pinGlobo'), p = mApl(M, pinVisto.x, pinVisto.y - radioPin() * 3.1), w = g.offsetWidth, h = g.offsetHeight;
  g.style.left = clamp(p.x - w / 2, 70, innerWidth - w - 8) + 'px'; g.style.top = clamp(p.y - h - 6, 58, innerHeight - h - 8) + 'px';
}
// ---- ventana con todas las notas (a la izquierda) ----
let ventanaPines = false;
function pintarVentanaPines() {
  const v = $('pinesVentana'), mostrar = !!doc && (ventanaPines || herramienta === 'pin');
  v.classList.toggle('oculto', !mostrar); if (!mostrar) return;
  const pines = doc.objetos.filter(o => o.tipo === 'pin').sort((a, b) => a.n - b.n);
  v.innerHTML = `<div class="pv-cab"><b>Notas del plano</b><button data-x="1">×</button></div>` + (pines.length
    ? pines.map(o => `<button class="pv-item${o === pinVisto ? ' activo' : ''}" data-id="${o.id}"><b>${o.n}</b><span>${o.texto ? escapar(o.texto) : '<i>Sin texto</i>'}</span></button>`).join('')
    : '<p class="nota">Arrastra el ícono de nota hasta un punto del plano para agregar una.</p>');
  v.onclick = ev => { if (ev.target.closest('[data-x]')) { ventanaPines = false; if (herramienta === 'pin') elegirHerramienta('pincel'); else pintarVentanaPines(); return; }
    const b = ev.target.closest('.pv-item'); if (!b) return; const o = doc.objetos.find(x => String(x.id) === b.dataset.id); if (o) { irAPin(o); verPin(o); } };
}
function irAPin(o) { // centra la vista en la nota
  const p = mApl(M, o.x, o.y); M = mMul([1, 0, 0, 1, innerWidth / 2 - p.x, innerHeight / 2 - p.y], M); aplicarVista();
}

// ---- herramientas cota / texto / símbolo ----
let selSim = null; // símbolo seleccionado
let herrAntesSim = null; // herramienta a la que se vuelve tras mover un símbolo tocado con el lápiz
function sobreSimbolo(e) { // ¿el toque cae sobre un símbolo o sobre la manija de giro?
  if (!doc) return false; const d = aDoc(e.clientX, e.clientY), h = selSim && doc.objetos.includes(selSim) && manijaGiro(selSim);
  return !!(h && Math.hypot(h.x - d.x, h.y - d.y) * escalaVista() < 30 || simEn(d));
}
function kSim(sim) { return sim.tipo === 'papel' ? sim.mm * doc.pxmm : pxDeMetros(1); }
const f2 = v => v.toFixed(2).replace(/^0\./, '.');
function seccionSim(o) { const sim = Simbolos.de(o.sid); return { sw: o.sw || sim.sw, sh: o.sh != null ? o.sh : sim.sh }; }
function textoSim(o) {
  const sim = Simbolos.de(o.sid);
  if (sim.id === 'viga') { const q = seccionSim(o); return (o.texto || 'V') + ` (${f2(q.sw)}×${f2(q.sh)})`; }
  if (sim.estructura) return o.texto || null;
  return o.texto || (o.sid === 'nivel' ? 'NPT +0.00' : o.sid === 'corte' ? 'A' : null);
}
function dibujarSim(c, o) {
  const sim = Simbolos.de(o.sid);
  Simbolos.dibujar(c, sim, o.x, o.y, o.ang, kSim(sim), o.w, o.color || '#1d1d1f', Math.max(1, 0.25 * doc.pxmm), textoSim(o), o.flip, Object.assign(seccionSim(o), { pxmm: doc.pxmm }));
}
// las vigas se pegan al centro de las columnas
function imanColumna(d) {
  if (!doc) return d; let mejor = null, dm = 1e9;
  for (const o of doc.objetos) if (o.tipo === 'simbolo' && (o.sid === 'columna' || o.sid === 'columnaC')) {
    const q = seccionSim(o), tol = pxDeMetros(Math.max(q.sw, q.sh)) / 2 + 14 / escalaVista(), dd = Math.hypot(o.x - d.x, o.y - d.y);
    if (dd < tol && dd < dm) { dm = dd; mejor = { x: o.x, y: o.y }; }
  }
  return mejor || d;
}
function cajaSim(o) { // caja en unidades locales del símbolo
  const sim = Simbolos.de(o.sid), m = 0.15;
  if (sim.estructura) { const q = seccionSim(o), mm = 0.08;
    if (sim.tipo === 'abertura') return [-mm, -q.sw / 2 - mm - (sim.id === 'viga' ? 0.35 : 0), o.w + mm, q.sw / 2 + mm];
    return [-q.sw / 2 - mm, -(sim.circular ? q.sw : q.sh) / 2 - mm, q.sw / 2 + mm, (sim.circular ? q.sw : q.sh) / 2 + mm]; }
  if (sim.tipo === 'abertura') return [-m, -Math.max(o.w, 0.3) - m, o.w + m, 0.25];
  if (sim.tipo === 'papel') return sim.id === 'nivel' ? [-0.5, -1.2, 3.3, 0.2] : sim.id === 'norte' ? [-0.6, -0.9, 0.6, 0.6] : [-0.7, -1.1, 1.3, 0.7];
  if (sim.base) return [-sim.w / 2 - m, -sim.h - m, sim.w / 2 + m, m];
  return [-sim.w / 2 - m, -sim.h / 2 - m, sim.w / 2 + m, sim.h / 2 + m];
}
function localSim(o, d) { const k = kSim(Simbolos.de(o.sid)), dx = d.x - o.x, dy = d.y - o.y, c = Math.cos(-o.ang), s = Math.sin(-o.ang); const x = (dx * c - dy * s) / k, y = (dx * s + dy * c) / k; return { x, y: o.flip ? -y : y }; }
function simEn(d, filtro) {
  for (let i = doc.objetos.length - 1; i >= 0; i--) { const o = doc.objetos[i]; if (o.tipo !== 'simbolo' || filtro && !filtro(o)) continue;
    const l = localSim(o, d), b = cajaSim(o), tol = 12 / escalaVista() / kSim(Simbolos.de(o.sid));
    if (l.x > b[0] - tol && l.x < b[2] + tol && l.y > b[1] - tol && l.y < b[3] + tol) return o; }
  return null;
}
function manijaGiro(o) { // punto de la manija de giro, en el documento
  const b = cajaSim(o), k = kSim(Simbolos.de(o.sid)), lx = (b[0] + b[2]) / 2, ly = b[1] - 30 / escalaVista() / k;
  const yy = o.flip ? -ly : ly, c = Math.cos(o.ang), s = Math.sin(o.ang);
  return { x: o.x + (lx * c - yy * s) * k, y: o.y + (lx * s + yy * c) * k };
}
function seleccionar(o) { selSim = o; pedirSup(); ponerBarraSel(); }
function ponerBarraSel() {
  const bar = $('selBar');
  if (!selSim || !doc || herramienta !== 'simbolo' || !doc.objetos.includes(selSim)) { bar.classList.add('oculto'); if (selSim && !doc.objetos.includes(selSim)) selSim = null; return; }
  const sim = Simbolos.de(selSim.sid), b = cajaSim(selSim), k = kSim(sim);
  // la barra va debajo del símbolo, en pantalla
  let maxY = -1e9, cx = 0, n = 0;
  for (const [lx, ly] of [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]]) {
    const yy = selSim.flip ? -ly : ly, c = Math.cos(selSim.ang), s = Math.sin(selSim.ang);
    const p = mApl(M, selSim.x + (lx * c - yy * s) * k, selSim.y + (lx * s + yy * c) * k); maxY = Math.max(maxY, p.y); cx += p.x; n++;
  }
  bar.classList.remove('oculto');
  $('selAncho').classList.toggle('oculto', sim.tipo !== 'abertura');
  $('selTexto').classList.toggle('oculto', !(sim.id === 'nivel' || sim.id === 'corte' || sim.estructura));
  $('selTexto').textContent = sim.estructura ? 'Nombre…' : 'Texto…';
  $('selSeccion').classList.toggle('oculto', !sim.estructura);
  if (sim.estructura) { const q = seccionSim(selSim); $('selSeccion').textContent = 'Medidas ' + (sim.circular ? 'Ø' + fmtM(q.sw) : sim.id === 'placa' ? fmtM(q.sw) : fmtM(q.sw) + '×' + fmtM(q.sh)); }
  $('selAncho').textContent = sim.estructura ? 'Largo…' : 'Ancho…';
  const w = bar.offsetWidth; bar.style.left = clamp(cx / n - w / 2, 8, innerWidth - w - 8) + 'px'; bar.style.top = clamp(maxY + 14, 60, innerHeight - 60) + 'px';
}
function cambiarSel(fn) { if (!selSim) return; const antes = snapObj(); fn(selSim); histObj(antes); ponerBarraSel(); }
$('selGirar').onclick = () => cambiarSel(o => { o.ang = (Math.round(o.ang / (Math.PI / 2)) + 1) * (Math.PI / 2); });
$('selGirar15').onclick = () => cambiarSel(o => { o.ang += Math.PI / 12; });
$('selVoltear').onclick = () => cambiarSel(o => { o.flip = !o.flip; });
$('selDup').onclick = () => { if (!selSim) return; const antes = snapObj(), c = Object.assign({}, selSim, { x: selSim.x + 6 * doc.pxmm, y: selSim.y + 6 * doc.pxmm }); delete c._bb; doc.objetos.push(c); selSim = c; histObj(antes); ponerBarraSel(); };
$('selBorrar').onclick = () => { if (!selSim) return; const antes = snapObj(); doc.objetos.splice(doc.objetos.indexOf(selSim), 1); selSim = null; histObj(antes); ponerBarraSel(); pedirSup(); };
$('selAncho').onclick = () => { if (!selSim) return; const o = selSim; pedirTexto(Simbolos.de(o.sid).estructura ? 'Largo (m)' : 'Ancho del vano (m)', fmtM(o.w), v => { const n = parseFloat(String(v).replace(',', '.')); if (n > 0) cambiarSel(x => { x.w = n; }); }, 'decimal'); };
$('selTexto').onclick = () => { if (!selSim) return; const o = selSim, est = Simbolos.de(o.sid).estructura;
  pedirTexto(o.sid === 'nivel' ? 'Texto del nivel' : o.sid === 'corte' ? 'Letra del corte' : o.sid === 'viga' ? 'Nombre de la viga (ej. V-101)' : 'Nombre (ej. C-1)', est ? (o.texto || '') : textoSim(o), v => cambiarSel(x => { x.texto = v; })); };
// ---- medidas de columnas, vigas, placas y zapatas ----
// Se preguntan al ponerlas (con medidas típicas a un toque) y se cambian con "Sección…" al seleccionarlas.
const SECCIONES = {
  columna: { t: 'Columna', a: 'Lado X (m)', b: 'Lado Y (m)', pre: [[.25, .25], [.25, .40], [.25, .50], [.30, .30], [.30, .50], [.40, .40]] },
  columnaC: { t: 'Columna circular', a: 'Diámetro (m)', pre: [[.25], [.30], [.40], [.50]] },
  viga: { t: 'Viga', a: 'Ancho b (m)', b: 'Peralte h (m)', pre: [[.25, .40], [.25, .50], [.30, .60], [.25, .20], [.40, .20]] },
  placa: { t: 'Placa / muro', a: 'Espesor (m)', pre: [[.15], [.20], [.25], [.30]] },
  zapata: { t: 'Zapata', a: 'Lado X (m)', b: 'Lado Y (m)', pre: [[1, 1], [1.2, 1.2], [1.5, 1.5], [1.2, 1.8]] },
};
const numM = v => { const n = parseFloat(String(v).replace(',', '.')); return n > 0 && n < 50 ? n : null; };
function dialogoSeccion(o, nuevo) {
  const sim = Simbolos.de(o.sid), cfg = SECCIONES[o.sid]; if (!cfg) return;
  const q = seccionSim(o), dos = !!cfg.b, nom = o.sid === 'viga' ? 'V-101' : o.sid === 'zapata' ? 'Z-1' : o.sid === 'placa' ? 'PL-1' : 'C-1';
  const etiqueta = p => p.map(v => fmtM(v)).join(' × ');
  modal(`<h3>${cfg.t}: medidas</h3>
    <div class="sec-pre">${cfg.pre.map((p, i) => `<button data-i="${i}">${etiqueta(p)}</button>`).join('')}</div>
    <div class="sec-campos"><label><span>${cfg.a}</span><input id="secA" type="text" inputmode="decimal" value="${fmtM(q.sw)}"></label>
    ${dos ? `<label><span>${cfg.b}</span><input id="secB" type="text" inputmode="decimal" value="${fmtM(q.sh)}"></label>` : ''}
    ${o.sid === 'viga' && o.w ? `<label><span>Largo (m)</span><input id="secL" type="text" inputmode="decimal" value="${fmtM(o.w)}"></label>` : ''}
    <label><span>Nombre</span><input id="secN" type="text" value="${escapar(o.texto || '')}" placeholder="${nom}"></label></div>
    ${nuevo ? `<label class="interruptor"><input type="checkbox" id="secNoPreg"><span></span>Usar esta medida en las siguientes sin preguntar</label>` : ''}
    <div class="modal-btns"><span style="flex:1"></span><button id="mNo">${nuevo ? 'Dejar así' : 'Cancelar'}</button><button class="ok" id="mSi">Listo</button></div>`, cerrar => {
    document.querySelectorAll('.sec-pre button').forEach(b => b.onclick = () => { const p = cfg.pre[+b.dataset.i]; $('secA').value = fmtM(p[0]); if (dos) $('secB').value = fmtM(p[1]); });
    $('mNo').onclick = cerrar;
    $('mSi').onclick = () => {
      const a = numM($('secA').value), b = dos ? numM($('secB').value) : a, L = $('secL') ? numM($('secL').value) : null, n = $('secN').value.trim();
      if (!a || !b) return avisar('Escribe medidas válidas en metros (ej. 0.25)');
      const noPreg = nuevo && $('secNoPreg').checked; cerrar();
      const antes = snapObj(); o.sw = a; o.sh = o.sid === 'placa' ? 0 : b; o.texto = n || null; if (L) o.w = L; histObj(antes);
      aj.secciones = aj.secciones || {}; aj.secciones[o.sid] = { sw: a, sh: o.sid === 'placa' ? 0 : b };
      if (noPreg) { aj.secNoPreguntar = aj.secNoPreguntar || {}; aj.secNoPreguntar[o.sid] = true; }
      guardarAjustes(); if (selSim === o) ponerBarraSel();
    };
    setTimeout(() => { const i = $('secA'); i.focus(); i.select(); }, 60);
  });
}
$('selSeccion').onclick = () => { if (selSim) dialogoSeccion(selSim, false); };

function iniciarArq(e) {
  const d = aDoc(e.clientX, e.clientY);
  const t = { id: e.pointerId, tipo: e.pointerType, t0: performance.now(), largo: 0, arq: herramienta, sx: e.clientX, sy: e.clientY, a: d, b: d, movido: false };
  if (herramienta === 'cota') { t.a = imanCota(d); t.b = t.a; }
  if (herramienta === 'pin') { t.obj = pinEn(d); if (t.obj) { t.antes = snapObj(); t.ox = t.obj.x - d.x; t.oy = t.obj.y - d.y; } }
  if (herramienta === 'texto') { t.obj = objetoEn(d); if (t.obj && t.obj.tipo !== 'texto') t.obj = null; if (t.obj) { t.antes = snapObj(); t.ox = t.obj.x - d.x; t.oy = t.obj.y - d.y; } }
  if (herramienta === 'simbolo') {
    t.antes = snapObj();
    const h = selSim && manijaGiro(selSim);
    if (h && Math.hypot(h.x - d.x, h.y - d.y) * escalaVista() < 30) { t.modo = 'girar'; t.obj = selSim; }
    else { let o = simEn(d);
      // con la viga o la placa elegidas, arrastrar desde una columna traza la viga (para mover la columna: tócala primero)
      const col = (aj.simbolo === 'viga' || aj.simbolo === 'placa') && simEn(d, x => x.sid === 'columna' || x.sid === 'columnaC');
      if (col && col !== selSim && !(o && o === selSim)) { t.desdeCol = col; o = null; selSim = null; }
      if (o) { t.modo = 'mover'; t.obj = o; t.ox = o.x - d.x; t.oy = o.y - d.y; t.eraSel = o === selSim; seleccionar(o); }
      else if (!t.desdeCol && (selSim || herrAntesSim)) { t.modo = 'soltar'; seleccionar(null); } // primer toque fuera: solo suelta la selección
      else { t.modo = 'poner'; seleccionar(null); if (aj.simbolo === 'viga' || aj.simbolo === 'placa') { t.a = imanColumna(d); t.b = t.a; } } }
    $('selBar').classList.add('oculto');
  }
  trazo = t;
}
function moverArq(e) {
  const t = trazo; const d = aDoc(e.clientX, e.clientY);
  if (Math.hypot(e.clientX - t.sx, e.clientY - t.sy) > 8) t.movido = true;
  if (t.arq === 'cota') { t.b = imanCota(enderezarFin(t.a, d)); if (t.movido) renderObjetos({ tipo: 'cota', a: t.a, b: t.b, color: aj.color }); }
  else if (t.arq === 'pin' && t.obj && t.movido) { t.obj.x = d.x + t.ox; t.obj.y = d.y + t.oy; renderObjetos(); }
  else if (t.arq === 'texto' && t.obj && t.movido) { t.obj.x = d.x + t.ox; t.obj.y = d.y + t.oy; renderObjetos(); }
  else if (t.arq === 'simbolo') {
    t.b = d;
    if (t.modo === 'soltar' && t.movido && !herrAntesSim) t.modo = 'poner';
    if (t.modo === 'poner' && (aj.simbolo === 'viga' || aj.simbolo === 'placa')) t.b = imanColumna(d);
    if (t.modo === 'mover' && t.movido) { t.obj.x = d.x + t.ox; t.obj.y = d.y + t.oy; renderObjetos(); pedirSup(); }
    else if (t.modo === 'girar') { let an = Math.atan2(d.y - t.obj.y, d.x - t.obj.x) + (t.obj.flip ? -1 : 1) * Math.PI / 2; const p = Math.PI / 12, ob = Math.round(an / p) * p; if (Math.abs(an - ob) < 0.07) an = ob; t.obj.ang = an; renderObjetos(); pedirSup(); avisarSuave(Math.round(((an * 180 / Math.PI) % 360 + 360) % 360) + '°'); }
    else if (t.modo === 'poner') renderObjetos(null, nuevoSim(t));
  }
}
function nuevoSim(t) {
  const sim = Simbolos.de(aj.simbolo || 'puerta'), dx = t.b.x - t.a.x, dy = t.b.y - t.a.y, L = Math.hypot(dx, dy), arr = L * escalaVista() > 14;
  let ang = arr ? Math.atan2(dy, dx) : 0; const p = Math.PI / 12, ob = Math.round(ang / p) * p; if (Math.abs(ang - ob) < 0.06) ang = ob;
  let w = null;
  if (sim.tipo === 'abertura') {
    const exacto = sim.estructura && t.desdeCol && imanColumna(t.b) !== t.b; // de columna a columna: medida exacta
    w = arr ? (exacto ? metros(L) : Math.max(0.3, Math.round(metros(L) * 20) / 20)) : sim.def;
    if (arr) avisarSuave((sim.estructura ? 'Largo ' : 'Ancho ') + fmtM(w) + ' m');
  }
  const o = { tipo: 'simbolo', sid: sim.id, x: t.a.x, y: t.a.y, ang, w, flip: false, color: aj.color };
  if (sim.estructura) { const u = aj.secciones && aj.secciones[sim.id]; o.sw = u ? u.sw : sim.sw; o.sh = u ? u.sh : sim.sh; }
  return o;
}
function terminarArq(t) {
  if (t.arq === 'cota') {
    if (!t.movido) { renderObjetos(); const o = objetoEn(t.a); if (o) (o.tipo === 'cota' ? editarCota(o) : editarTexto(o)); return; }
    if (Math.hypot(t.b.x - t.a.x, t.b.y - t.a.y) < 2 * doc.pxmm) { renderObjetos(); return; }
    agregarCota(t.a, t.b, 0, false, doc.pedirMedida);
  } else if (t.arq === 'pin') {
    if (t.obj && t.movido) { histObj(t.antes); return; }
    if (t.obj) return verPin(t.obj);
    if (pinVisto) return ocultarPin(); // primer toque fuera: cierra el globo
    nuevoPin(t.a);
  } else if (t.arq === 'texto') {
    if (t.obj && t.movido) { histObj(t.antes); return; }
    if (t.obj) return editarTexto(t.obj);
    const o = objetoEn(t.a); if (o && o.tipo === 'cota') return editarCota(o);
    editarTexto(null, t.a);
  } else if (t.arq === 'simbolo') {
    if (t.modo === 'soltar') { seleccionar(null); if (herrAntesSim) { const h = herrAntesSim; herrAntesSim = null; elegirHerramienta(h); } }
    else if (t.modo === 'poner' && t.desdeCol && !t.movido) seleccionar(t.desdeCol); // solo un toque: selecciona la columna
    else if (t.modo === 'poner') { const o = nuevoSim(t); doc.objetos.push(o); histObj(t.antes); seleccionar(o);
      if (SECCIONES[o.sid] && !(aj.secNoPreguntar && aj.secNoPreguntar[o.sid])) dialogoSeccion(o, true); }
    else if (t.movido || t.modo === 'girar') histObj(t.antes);
    ponerBarraSel();
  }
}
function cancelarArq(t) { if ((t.arq === 'simbolo' || t.arq === 'pin') && t.antes) { doc.objetos = JSON.parse(t.antes); selSim = null; ponerBarraSel(); } renderObjetos(); pedirSup(); }
let avisoSuaveT = 0;
function avisarSuave(txt) { const a = $('aviso'); a.textContent = txt; a.classList.remove('oculto'); clearTimeout(avisoT); avisoT = setTimeout(() => a.classList.add('oculto'), 900); }

// ---- diálogos de edición ----
function editarCota(o, nueva) {
  const g = geomCota(o), med = metros(g.L), linea = lineaDeCota(o);
  modal(`<h3>${nueva ? 'Medida de la cota' : 'Editar cota'}</h3>
    <p>En el dibujo mide <b>${fmtM(med)} m</b> a escala 1/${doc.escala}.${nueva ? ' Si la dejas vacía, la cota se quita.' : ''}</p>
    <div class="etq">Medida real (m)</div>
    <input type="text" id="cVal" inputmode="decimal" value="${nueva ? '' : o.texto || fmtM(med)}" placeholder="${fmtM(med)}" autocomplete="off">
    <label class="interruptor"><input type="checkbox" id="cAjustar" checked><span></span>${linea ? 'Llevar la línea dibujada a esta medida (a escala)' : 'Llevar la cota a esta medida (a escala)'}</label>
    <div class="etq" style="margin-top:6px">Separación de la línea</div>
    <div class="seg" id="cOff"><button data-v="-8">← Afuera</button><button data-v="0">Sobre la línea</button><button data-v="8">Adentro →</button></div>
    <div class="modal-btns"><button class="rojo" id="cBor">Eliminar</button><span style="flex:1"></span><button id="mNo">Cerrar</button><button class="ok" id="mSi">Guardar</button></div>`, cerrar => {
    const i = $('cVal'); setTimeout(() => { i.focus(); i.select(); }, 60);
    let off = o.off || 0;
    const marcarOff = () => $('cOff').querySelectorAll('button').forEach(b => b.classList.toggle('activo', Math.sign(+b.dataset.v) === Math.sign(off)));
    marcarOff();
    $('cOff').querySelectorAll('button').forEach(b => b.onclick = () => { off = +b.dataset.v * doc.pxmm; marcarOff(); });
    $('mNo').onclick = () => { cerrar(); nueva ? descartarCota(o) : renderObjetos(); };
    $('cBor').onclick = () => { cerrar(); if (nueva) return descartarCota(o); const antes = snapObj(); doc.objetos.splice(doc.objetos.indexOf(o), 1); histObj(antes); };
    const guardarC = () => {
      const antes = snapObj(), v = parseFloat(String(i.value).replace(',', '.'));
      let pxAj = null;
      if (!isNaN(v) && v > 0) {
        if ($('cAjustar').checked) {
          const largo = pxDeMetros(v), ln = lineaDeCota(o);
          if (ln) { pxAj = redibujarLinea(ln, o, largo); if (pxAj) o.lid = ln.id; }
          o.b = { x: o.a.x + g.ux * largo, y: o.a.y + g.uy * largo }; o.texto = null;
        }
        else o.texto = Math.abs(v - med) < 0.005 ? null : fmtM(v);
      } else if (i.value.trim() && !nueva) o.texto = i.value.trim();
      else if (nueva) { cerrar(); descartarCota(o); return; } // sin medida: la cota se quita sola
      o.off = off;
      cerrar();
      const reg = lineaDe.get(o), ult = deshacer[deshacer.length - 1];
      if (nueva && reg && reg.ent === ult) { // la edición va en el mismo paso de deshacer que la línea
        let ent = ult;
        if (ent.t !== 'multi') { ent = { t: 'multi', items: [ult], bytes: ult.bytes || 0 }; deshacer[deshacer.length - 1] = ent; }
        const it = ent.items.find(x => x.t === 'obj'); if (it) it.despues = snapObj();
        if (pxAj) { ent.items.push(pxAj); ent.bytes += pxAj.bytes; bytesHist += pxAj.bytes; }
        renderObjetos(); marcarCambio();
      } else if (pxAj) { pushHist({ t: 'multi', items: [pxAj, { t: 'obj', antes, despues: snapObj() }], bytes: pxAj.bytes }); renderObjetos(); }
      else histObj(antes);
      lineaDe.delete(o);
      refrescarCapasSiAbierto();
    };
    $('mSi').onclick = guardarC; i.onkeydown = e => { if (e.key === 'Enter') guardarC(); };
  }, () => { nueva ? descartarCota(o) : renderObjetos(); });
}
function editarTexto(o, pos) {
  const nuevo = !o;
  o = o || { tipo: 'texto', x: pos.x, y: pos.y, texto: '', tam: 'm', caja: false, color: aj.color };
  modal(`<h3>${nuevo ? 'Nueva nota' : 'Editar nota'}</h3>
    <textarea id="tTxt" rows="3" placeholder="Ej.: Muro de adobe húmedo · Viga 25×40 · h = 2.60 m">${escapar(o.texto)}</textarea>
    <div class="etq" style="margin-top:12px">Tamaño</div>
    <div class="seg" id="tTam"><button data-v="p">Pequeño</button><button data-v="m">Normal</button><button data-v="g">Grande</button><button data-v="t">Título</button></div>
    <label class="interruptor"><input type="checkbox" id="tCaja" ${o.caja ? 'checked' : ''}><span></span>Con recuadro</label>
    <div class="modal-btns">${nuevo ? '' : '<button class="rojo" id="tBor">Eliminar</button>'}<span style="flex:1"></span><button id="mNo">Cancelar</button><button class="ok" id="mSi">Guardar</button></div>`, cerrar => {
    const i = $('tTxt'); setTimeout(() => i.focus(), 60);
    let tam = o.tam; const marcar = () => $('tTam').querySelectorAll('button').forEach(b => b.classList.toggle('activo', b.dataset.v === tam)); marcar();
    $('tTam').querySelectorAll('button').forEach(b => b.onclick = () => { tam = b.dataset.v; marcar(); });
    $('mNo').onclick = cerrar;
    if (!nuevo) $('tBor').onclick = () => { const antes = snapObj(); doc.objetos.splice(doc.objetos.indexOf(o), 1); cerrar(); histObj(antes); };
    $('mSi').onclick = () => {
      const v = i.value.replace(/\s+$/, ''); cerrar(); if (!v && nuevo) return;
      const antes = snapObj(); o.texto = v; o.tam = tam; o.caja = $('tCaja').checked;
      if (!v) doc.objetos.splice(doc.objetos.indexOf(o), 1); else if (nuevo) doc.objetos.push(o);
      histObj(antes);
    };
  });
}

// ---- panel de símbolos ----
let catSim = null;
function pintarSimbolos() {
  if (!catSim) catSim = Simbolos.de(aj.simbolo || 'puerta').cat;
  $('simCats').innerHTML = Simbolos.CATS.map(c => `<button data-c="${c}" class="${c === catSim ? 'activo' : ''}">${c}</button>`).join('');
  $('simCats').querySelectorAll('button').forEach(b => b.onclick = () => { catSim = b.dataset.c; pintarSimbolos(); });
  const g = $('simGrid'); g.innerHTML = '';
  for (const s of Simbolos.lista.filter(s => s.cat === catSim)) {
    const b = document.createElement('button'); b.className = 'tex-item' + (s.id === (aj.simbolo || 'puerta') ? ' activo' : '');
    b.innerHTML = `<canvas width="${100 * DPR}" height="${100 * DPR}"></canvas><span>${s.nombre}</span>`;
    const c = b.querySelector('canvas').getContext('2d'); c.fillStyle = '#fbfbf8'; c.fillRect(0, 0, 999, 999);
    const S = 100 * DPR;
    let k, x = S / 2, y = S / 2, w = null;
    if (s.tipo === 'abertura') { w = Math.min(s.def, 3); k = S * 0.7 / Math.max(w, 1.2); x = S / 2 - w * k / 2; y = S * 0.62; }
    else if (s.tipo === 'papel') { k = S * (s.id === 'nivel' ? 0.2 : s.id === 'norte' ? 0.62 : 0.4); if (s.id === 'nivel') { x = S * 0.2; y = S * 0.62; } }
    else { k = S * 0.78 / Math.max(s.w, s.h); if (s.base) y = S * 0.9; }
    Simbolos.dibujar(c, s, x, y, 0, k, w, '#2b2b2b', 1.4 * DPR, s.id === 'nivel' ? 'NPT +0.00' : null, false, { sw: s.sw, sh: s.sh, pxmm: 0 });
    b.onclick = () => { aj.simbolo = s.id; guardarAjustes(); g.querySelectorAll('.tex-item').forEach(x => x.classList.toggle('activo', x === b)); herrAntesSim = null; if (herramienta !== 'simbolo') elegirHerramienta('simbolo'); seleccionar(null); avisarSuave(s.nombre + ': toca la hoja para ponerlo'); };
    g.appendChild(b);
  }
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

// ---- cursor del pincel (lápiz flotando) y tinta adelantada ----
const cursorCv = $('cursorCv'), curCtx = cursorCv.getContext('2d');
let hover = null, rafCur = 0, curPrev = null;
function pedirCursor() { if (!rafCur) rafCur = requestAnimationFrame(() => { rafCur = 0; dibujarCursor(); }); }
// Ojo: el borrado se hace SIN escala. Antes se borraba con la escala de pantalla (×2 o ×3 en la
// tableta) aplicada, se limpiaba otra zona y quedaban "pelitos" de la tinta adelantada pegados en la
// pantalla (no en la hoja: por eso seguían ahí al mover el lienzo o al abrir otra hoja).
function limpiarCursor() { curCtx.setTransform(1, 0, 0, 1, 0, 0); curCtx.clearRect(0, 0, cursorCv.width, cursorCv.height); curPrev = null; }
function dibujarCursor() {
  const c = curCtx;
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (curPrev) { c.clearRect(curPrev[0], curPrev[1], curPrev[2], curPrev[3]); curPrev = null; }
  if (!doc) return;
  const t = trazo, s = escalaVista();
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (t && t.motor && t.pred && t.motor.ult && !t.borrar && !t.forma) {
    const a = mApl(M, t.motor.ult.x, t.motor.ult.y), b = mApl(M, t.pred.x, t.pred.y), w = Math.max(1, t.motor.ult.s * s);
    if (Math.hypot(b.x - a.x, b.y - a.y) < 80) {
      c.globalAlpha = Math.min(1, t.op * (t.pin.alfa || 1) * 1.2); c.strokeStyle = aj.color; c.lineWidth = w; c.lineCap = 'round';
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.globalAlpha = 1;
      curPrev = [(Math.min(a.x, b.x) - w - 2) * DPR, (Math.min(a.y, b.y) - w - 2) * DPR, (Math.abs(b.x - a.x) + 2 * w + 4) * DPR, (Math.abs(b.y - a.y) + 2 * w + 4) * DPR];
    }
    return;
  }
  if (t || !hover) return;
  let r;
  if (herramienta === 'pincel' || herramienta === 'borrador') { const pin = pincelActual(); r = Math.max(2, tamPincel(pin, opcionesPincel(claveAjuste()), doc.pxmm) * s / 2); }
  const x = hover.x, y = hover.y;
  c.lineWidth = 1;
  if (r) {
    c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.strokeStyle = 'rgba(0,0,0,.55)'; c.stroke();
    c.beginPath(); c.arc(x, y, r + 1, 0, 6.2832); c.strokeStyle = 'rgba(255,255,255,.8)'; c.stroke();
    if (r < 5) { c.fillStyle = herramienta === 'borrador' ? '#fff' : aj.color; c.beginPath(); c.arc(x, y, 1.5, 0, 6.2832); c.fill(); }
  } else {
    r = 9; c.strokeStyle = '#8ACF00'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); c.stroke();
  }
  curPrev = [(x - r - 4) * DPR, (y - r - 4) * DPR, (2 * r + 8) * DPR, (2 * r + 8) * DPR];
}

// ---- capa superpuesta en pantalla (guías, lazo, puntos de fuga) ----
let rafSup = 0;
function pedirSup() { if (!rafSup) rafSup = requestAnimationFrame(dibujarSup); }
function tamSup() { for (const cv of [sup, cursorCv]) { cv.width = innerWidth * DPR; cv.height = innerHeight * DPR; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; } curPrev = null; pedirSup(); }
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
  if (selSim && herramienta === 'simbolo' && doc.objetos.includes(selSim)) {
    const o = selSim, b = cajaSim(o), k = kSim(Simbolos.de(o.sid)), cs = Math.cos(o.ang), sn = Math.sin(o.ang);
    const P = (lx, ly) => { const yy = o.flip ? -ly : ly; return mApl(M, o.x + (lx * cs - yy * sn) * k, o.y + (lx * sn + yy * cs) * k); };
    const q = [P(b[0], b[1]), P(b[2], b[1]), P(b[2], b[3]), P(b[0], b[3])];
    c.setTransform(DPR, 0, 0, DPR, 0, 0); c.setLineDash([5, 4]); c.lineWidth = 1.5; c.strokeStyle = '#8ACF00';
    c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.stroke(); c.setLineDash([]);
    const mg = manijaGiro(o), h = mApl(M, mg.x, mg.y), top = P((b[0] + b[2]) / 2, b[1]);
    c.beginPath(); c.moveTo(top.x, top.y); c.lineTo(h.x, h.y); c.stroke();
    c.beginPath(); c.arc(h.x, h.y, 11, 0, 6.2832); c.fillStyle = '#8ACF00'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#0b0b0c'; c.stroke();
    c.beginPath(); c.arc(h.x, h.y, 5, -2.4, 1.6); c.stroke();
    ponerBarraSel();
  }
  if (g.sim && g.sim !== 'no') { // ejes de simetría
    c.setTransform(DPR * M[0], DPR * M[1], DPR * M[2], DPR * M[3], DPR * M[4], DPR * M[5]);
    c.save(); c.strokeStyle = 'rgba(80,140,255,.85)'; c.lineWidth = 1.6 / s; c.setLineDash([10 / s, 6 / s]); c.beginPath();
    if (g.sim === 'v' || g.sim === '4') { c.moveTo(doc.w / 2, 0); c.lineTo(doc.w / 2, doc.h); }
    if (g.sim === 'h' || g.sim === '4') { c.moveTo(0, doc.h / 2); c.lineTo(doc.w, doc.h / 2); }
    c.stroke(); c.restore();
  }
  if (flot) dibujarManijasFlot(c);
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
  if (h !== 'simbolo') herrAntesSim = null;
  if (flot && h !== 'seleccion') aplicarFlot();
  setTimeout(pintarVentanaPines, 0);
  herramienta = h; marcarBotones(); actualizarSliders(); ponerBarraSel(); pedirSup();
}
function marcarBotones() {
  document.querySelectorAll('.herr').forEach(b => b.classList.toggle('activo', b.dataset.h === herramienta));
  $('bGotero2').classList.toggle('activo', herramienta === 'gotero');
  $('bCapas').classList.toggle('activo', panelAbierto('pCapas'));
  $('bGuias').classList.toggle('activo', doc && (doc.guias.modo !== 'ninguna' || doc.guias.sim && doc.guias.sim !== 'no') || panelAbierto('pGuias'));
  $('bMenu').classList.toggle('activo', panelAbierto('pMenu'));
  $('bNotas').classList.toggle('activo', panelAbierto('pNotas'));
}
function abrirPanel(id, ancla) {
  if (flot && id === 'pCapas') aplicarFlot();
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
    else if (h === 'simbolo') { abrirPanel('pSimbolos', b); pintarSimbolos(); }
    else if (h === 'seleccion') menuCopiarPegar();
    else if (h === 'pin') { ventanaPines = !ventanaPines; pintarVentanaPines(); }
    else if (h === 'cota' || h === 'texto') { abrirPanel('pNotas', $('bNotas')); pintarNotas(); }
    else { abrirPanel('pPinceles', b); pintarPinceles(); }
  } else {
    cerrarPaneles(); elegirHerramienta(h);
    if (h === 'simbolo' && !aj.simbolo) { abrirPanel('pSimbolos', b); pintarSimbolos(); }
    if (h === 'cota') avisarSuave('Cota: arrastra de un punto a otro · escala 1/' + doc.escala);
    if (h === 'texto') avisarSuave('Toca donde quieras escribir una nota');
    if (h === 'pin') avisarSuave('Toca el punto del plano para poner una nota (o arrastra el ícono hasta ahí)');
    if (h === 'seleccion') avisarSuave('Encierra con el lazo lo que quieras mover · toca otra vez el ícono: copiar, pegar, seleccionar todo');
  }
}));
$('bGotero2').addEventListener('click', () => elegirHerramienta(herramienta === 'gotero' ? herrPrevia : 'gotero'));
$('bDeshacer').addEventListener('click', hacerDeshacer);
$('bRehacer').addEventListener('click', hacerRehacer);
$('bCapas').addEventListener('click', e => { abrirPanel('pCapas', e.currentTarget); pintarCapas(); });
$('bColor').addEventListener('click', e => { abrirPanel('pColor', e.currentTarget); pintarColorPanel(); });
$('bGuias').addEventListener('click', e => { abrirPanel('pGuias', e.currentTarget); pintarGuiasPanel(); });
$('bMenu').addEventListener('click', e => { abrirPanel('pMenu', e.currentTarget); pintarEstadoPresion(); requestAnimationFrame(pintarCurva); });
function pintarEstadoPresion() {
  const el = $('vPresionReal'); if (!el) return;
  el.textContent = estadoPresion === 'ok' ? '✓ Presión del lápiz detectada: aprieta más para un trazo más grueso u oscuro.'
    : estadoPresion === 'plana' ? 'El último trazo llegó sin cambios de presión. Prueba un lápiz o pincel con presión (Lápiz HB, Plumilla, Pincel de tinta).'
    : 'Dibuja un trazo con el lápiz para comprobar la presión.';
}
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
  const tp = pin ? tamPincel(pin, o, doc && doc.pxmm) : 0, d = pin ? tp * escalaVista() : 20;
  const pt = $('burbujaPunto'); const dd = clamp(d, 2, 200); pt.style.width = pt.style.height = dd + 'px';
  pt.style.background = herramienta === 'borrador' ? '#fff' : aj.color; pt.style.opacity = 1;
  $('burbujaTxt').textContent = pin ? (pin.mm ? (tp / (doc ? doc.pxmm : PXMM)).toFixed(2) + ' mm' : Math.round(tp * 10) / 10 + ' px') : '';
});
const pintarOp = slider($('sOpacidad'), () => opcionesPincel(claveAjuste()).op, v => { opcionesPincel(claveAjuste()).op = Math.max(0.02, v); }, () => {
  const o = opcionesPincel(claveAjuste()), pt = $('burbujaPunto');
  pt.style.width = pt.style.height = '60px'; pt.style.background = herramienta === 'borrador' ? '#fff' : aj.color; pt.style.opacity = o.op;
  $('burbujaTxt').textContent = Math.round(o.op * 100) + ' %';
});
function actualizarSliders() { pintarTam(); pintarOp(); }


// =====================================================================
//  PINCELES IMPORTADOS: Procreate (.brush / .brushset), Photoshop (.abr) o una imagen (PNG/JPG)
//  Se toma la FORMA de la punta y, si trae, el GRANO (textura). Quedan guardados en la tableta.
// =====================================================================
let dbPinP = null;
function dbPin() { return dbPinP || (dbPinP = new Promise((res, rej) => { const r = indexedDB.open('oxen-pinceles', 1); r.onupgradeneeded = () => r.result.createObjectStore('p', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); })); }
async function dbPinOp(modo, fn) { const d = await dbPin(); return new Promise((res, rej) => { const tx = d.transaction('p', modo), q = fn(tx.objectStore('p')); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); }); }

// --- ZIP (los pinceles de Procreate son archivos zip) ---
function leerZip(buf) {
  const dv = new DataView(buf); let fin = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { fin = i; break; }
  if (fin < 0) throw new Error('No es un archivo zip');
  const n = dv.getUint16(fin + 10, true); let q = dv.getUint32(fin + 16, true); const ent = [];
  for (let i = 0; i < n && dv.getUint32(q, true) === 0x02014b50; i++) {
    const nl = dv.getUint16(q + 28, true), xl = dv.getUint16(q + 30, true), cl = dv.getUint16(q + 32, true);
    ent.push({ nombre: new TextDecoder().decode(new Uint8Array(buf, q + 46, nl)), metodo: dv.getUint16(q + 10, true), csize: dv.getUint32(q + 20, true), loff: dv.getUint32(q + 42, true) });
    q += 46 + nl + xl + cl;
  }
  return { ent, async leer(e) {
    const ini = e.loff + 30 + dv.getUint16(e.loff + 26, true) + dv.getUint16(e.loff + 28, true), datos = new Uint8Array(buf, ini, e.csize);
    if (e.metodo === 0) return datos.slice();
    if (e.metodo !== 8 || !window.DecompressionStream) throw new Error('compresión no soportada');
    return new Uint8Array(await new Response(new Blob([datos]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
  } };
}
// --- plist binaria (para leer el nombre y el espaciado del pincel de Procreate) ---
function leerBplist(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), L = u8.length;
  if (new TextDecoder().decode(u8.subarray(0, 6)) !== 'bplist') return null;
  const oSz = u8[L - 26], rSz = u8[L - 25], num = Number(dv.getBigUint64(L - 24)), top = Number(dv.getBigUint64(L - 16)), tab = Number(dv.getBigUint64(L - 8));
  const ent = (p, n) => { let v = 0; for (let i = 0; i < n; i++) v = v * 256 + u8[p + i]; return v; };
  const off = i => ent(tab + i * oSz, oSz), memo = new Map();
  const obj = i => {
    if (memo.has(i)) return memo.get(i);
    let p = off(i); const m = u8[p], t = m >> 4; let n = m & 15, v = null; p++;
    const largo = () => { if (n !== 15) return; const k = 1 << (u8[p] & 15); n = ent(p + 1, k); p += 1 + k; };
    if (t === 0) v = n === 8 ? false : n === 9 ? true : null;
    else if (t === 1) { const k = 1 << n; v = k === 8 ? Number(dv.getBigInt64(p)) : ent(p, k); }
    else if (t === 2) v = n === 2 ? dv.getFloat32(p) : dv.getFloat64(p);
    else if (t === 5) { largo(); v = new TextDecoder('latin1').decode(u8.subarray(p, p + n)); }
    else if (t === 6) { largo(); let str = ''; for (let k = 0; k < n; k++) str += String.fromCharCode(dv.getUint16(p + k * 2)); v = str; }
    else if (t === 8) v = { uid: ent(p, n + 1) };
    else if (t === 10) { largo(); v = []; memo.set(i, v); for (let k = 0; k < n; k++) v.push(obj(ent(p + k * rSz, rSz))); }
    else if (t === 13) { largo(); v = {}; memo.set(i, v); for (let k = 0; k < n; k++) v[obj(ent(p + k * rSz, rSz))] = obj(ent(p + (n + k) * rSz, rSz)); }
    memo.set(i, v); return v;
  };
  return obj(top);
}
function datosProcreate(u8) {
  try {
    const a = leerBplist(u8); if (!a || !a.$objects) return {};
    const objs = a.$objects, root = objs[(a.$top.root || a.$top[Object.keys(a.$top)[0]]).uid], val = k => { const v = root[k]; return v && v.uid != null ? objs[v.uid] : v; };
    const nombre = val('name'), esp = val('plotSpacing'), rot = val('shapeRotation') ?? val('shapeAzimuth');
    return { nombre: typeof nombre === 'string' && nombre !== '$null' ? nombre : null, esp: typeof esp === 'number' ? esp : null, azar: !!val('shapeRandomise') };
  } catch (e) { return {}; }
}
// --- Photoshop .abr (puntas "muestreadas", versiones 1, 2, 6 y 10) ---
function leerAbr(buf) {
  const dv = new DataView(buf), out = []; let p = 0;
  const u16 = () => { const v = dv.getUint16(p); p += 2; return v; }, u32 = () => { const v = dv.getUint32(p); p += 4; return v; }, i32 = () => { const v = dv.getInt32(p); p += 4; return v; };
  const imagen = (w, h, prof, comp) => {
    if (w <= 0 || h <= 0 || w * h > 25e6) return null;
    const bpp = prof >> 3 || 1, px = new Uint8Array(w * h);
    if (!comp) { for (let i = 0; i < w * h; i++) px[i] = dv.getUint8(p + i * bpp); p += w * h * bpp; }
    else { const filas = []; for (let y = 0; y < h; y++) filas.push(u16()); let o = 0;
      for (let y = 0; y < h; y++) { const finFila = p + filas[y]; let x = 0;
        while (p < finFila) { let n = dv.getInt8(p++);
          if (n >= 0) { for (let k = 0; k <= n; k++) { if (x < w * bpp && x % bpp === 0) px[o + x / bpp] = dv.getUint8(p); x++; p++; } }
          else if (n !== -128) { const v = dv.getUint8(p++); for (let k = 0; k < 1 - n; k++) { if (x < w * bpp && x % bpp === 0) px[o + x / bpp] = v; x++; } } }
        p = finFila; o += w; } }
    return { w, h, px };
  };
  const ver = u16();
  if (ver === 1 || ver === 2) {
    const cant = u16();
    for (let b = 0; b < cant && p < buf.byteLength; b++) {
      const tipo = u16(), tam = u32(), sig = p + tam;
      if (tipo === 2) { u32(); u16(); let nombre = null;
        if (ver === 2) { const nl = u32(); let str = ''; for (let k = 0; k < nl; k++) { const ch = u16(); if (ch) str += String.fromCharCode(ch); } nombre = str; }
        p += 1; p += 8; const top = i32(), left = i32(), bot = i32(), right = i32(), prof = u16(), comp = dv.getUint8(p++);
        const im = imagen(right - left, bot - top, prof, comp); if (im) out.push(Object.assign(im, { nombre })); }
      p = sig;
    }
  } else if (ver === 6 || ver === 7 || ver === 10) {
    const sub = u16();
    while (p + 12 <= buf.byteLength) {
      if (u32() !== 0x3842494d) break; const clave = String.fromCharCode(...new Uint8Array(buf, p, 4)); p += 4; const tam = u32(), finSec = p + tam;
      if (clave === 'samp') {
        while (p + 4 < finSec) { let t = u32(); const sig = p + t + ((4 - t % 4) % 4);
          try { p += sub === 1 ? 47 : 301; const top = i32(), left = i32(), bot = i32(), right = i32(), prof = u16(), comp = dv.getUint8(p++); const im = imagen(right - left, bot - top, prof, comp); if (im) out.push(im); } catch (e) {}
          p = sig; }
      }
      p = finSec + (tam % 2);
    }
  } else throw new Error('Versión de .abr no reconocida (' + ver + ')');
  return out;
}
// --- máscara: lo que pinta (alfa) a partir de cualquier imagen ---
function aMascara(fuente, w, h, modo, maxLado = 256) {
  const k = Math.min(1, maxLado / Math.max(w, h)), W = Math.max(1, Math.round(w * k)), H = Math.max(1, Math.round(h * k));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d', { willReadFrequently: true });
  c.imageSmoothingQuality = 'high'; c.drawImage(fuente, 0, 0, W, H);
  const im = c.getImageData(0, 0, W, H), d = im.data, lum = i => (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11);
  if (modo === 'auto') { // con transparencia → el alfa; opaca → lo oscuro sobre fondo claro o lo claro sobre fondo oscuro
    let transp = 0, borde = 0, nb = 0; for (let i = 3; i < d.length; i += 4) if (d[i] < 240) transp++;
    for (let x = 0; x < W; x++) for (const y of [0, H - 1]) { borde += lum((y * W + x) * 4); nb++; }
    modo = transp > d.length / 4 * 0.05 ? 'alfa' : borde / nb > 128 ? 'oscuro' : 'claro';
  }
  for (let i = 0; i < d.length; i += 4) {
    const a = modo === 'alfa' ? d[i + 3] : modo === 'oscuro' ? 255 - lum(i) : lum(i);
    d[i] = d[i + 1] = d[i + 2] = 0; d[i + 3] = a;
  }
  c.putImageData(im, 0, 0); return cv;
}
const bitmapDe = async u8 => createImageBitmap(new Blob([u8]));
async function importarArchivo(f) {
  const buf = await f.arrayBuffer(), u8 = new Uint8Array(buf), base = f.name.replace(/\.[^.]+$/, ''), res = [];
  if (u8[0] === 0x50 && u8[1] === 0x4b) { // Procreate
    const z = leerZip(buf), formas = z.ent.filter(e => /(^|\/)shape\.png$/i.test(e.nombre));
    if (!formas.length) throw new Error('El archivo no tiene puntas (Shape.png)');
    for (const e of formas.slice(0, 120)) {
      const dir = e.nombre.slice(0, e.nombre.length - 'shape.png'.length), busca = n => z.ent.find(x => x.nombre.toLowerCase() === (dir + n).toLowerCase());
      const fb = await bitmapDe(await z.leer(e)), forma = aMascara(fb, fb.width, fb.height, 'claro');
      let grano = null; const ge = busca('Grain.png'); if (ge) { const gb = await bitmapDe(await z.leer(ge)); grano = aMascara(gb, gb.width, gb.height, 'claro', 384); }
      let info = {}; const ae = busca('Brush.archive'); if (ae) info = datosProcreate(await z.leer(ae));
      res.push({ nombre: info.nombre || (formas.length > 1 ? base + ' ' + (res.length + 1) : base), forma, grano, esp: info.esp != null ? clamp(info.esp * 0.6, 0.03, 1.5) : 0.1, rot: info.azar ? 'azar' : 'trazo', origen: 'Procreate' });
    }
  } else if (/\.abr$/i.test(f.name) || [1, 2, 6, 7, 10].includes(new DataView(buf).getUint16(0))) { // Photoshop
    const lista = leerAbr(buf); if (!lista.length) throw new Error('El .abr no trae puntas de imagen');
    lista.slice(0, 120).forEach((im, i) => {
      const cv = document.createElement('canvas'); cv.width = im.w; cv.height = im.h; const c = cv.getContext('2d'), d = c.createImageData(im.w, im.h);
      for (let k = 0; k < im.px.length; k++) d.data[k * 4 + 3] = im.px[k]; c.putImageData(d, 0, 0);
      res.push({ nombre: im.nombre || base + ' ' + (i + 1), forma: aMascara(cv, im.w, im.h, 'alfa'), grano: null, esp: 0.15, rot: 'no', origen: 'Photoshop' });
    });
  } else { // imagen suelta: la punta es lo dibujado
    const b = await createImageBitmap(f); res.push({ nombre: base, forma: aMascara(b, b.width, b.height, 'auto'), grano: null, esp: 0.15, rot: 'no', origen: 'Imagen' });
  }
  return res;
}
function pinDeRegistro(r, forma, grano) {
  return { id: r.id, cat: 'Importados', nombre: r.nombre, tip: 'sello', forma, granoImg: grano, esp: r.esp, rot: r.rot, min: 3, max: 200, alfa: 1, pTam: 0.55, pAlfa: 0.35, origen: r.origen };
}
const blobDe = cv => new Promise(res => cv.toBlob(res, 'image/png'));
async function guardarImportados(lista) {
  const nuevos = [];
  for (const b of lista) {
    const r = { id: 'imp_' + nuevoId(), nombre: b.nombre, esp: b.esp, rot: b.rot, origen: b.origen, forma: await blobDe(b.forma), grano: b.grano ? await blobDe(b.grano) : null };
    await dbPinOp('readwrite', s => s.put(r));
    const pin = pinDeRegistro(r, b.forma, b.grano); PINCELES.push(pin); nuevos.push(pin);
  }
  return nuevos;
}
async function cargarImportados() {
  try {
    const regs = await dbPinOp('readonly', s => s.getAll()) || [];
    for (const r of regs) {
      if (PINCELES.some(p => p.id === r.id)) continue;
      const fb = await createImageBitmap(r.forma), forma = document.createElement('canvas'); forma.width = fb.width; forma.height = fb.height; forma.getContext('2d').drawImage(fb, 0, 0);
      let grano = null; if (r.grano) { const gb = await createImageBitmap(r.grano); grano = document.createElement('canvas'); grano.width = gb.width; grano.height = gb.height; grano.getContext('2d').drawImage(gb, 0, 0); }
      PINCELES.push(pinDeRegistro(r, forma, grano));
    }
    rehacerListaImportados();
  } catch (e) { console.warn('pinceles importados', e); }
}
function rehacerListaImportados() { const d = listasPin.get('Importados'); if (d) { d.remove(); listasPin.delete('Importados'); } if (panelAbierto('pPinceles')) pintarPinceles(); }
async function borrarImportado(id) {
  await dbPinOp('readwrite', s => s.delete(id)); const i = PINCELES.findIndex(p => p.id === id); if (i >= 0) PINCELES.splice(i, 1);
  if (aj.pincel === id) aj.pincel = 'hb'; guardarAjustes(); rehacerListaImportados(); avisar('Pincel eliminado');
}
$('fPinceles').onchange = async e => {
  const fs = [...e.target.files]; e.target.value = ''; if (!fs.length) return;
  avisar('Importando pinceles…'); let total = [], errores = [];
  for (const f of fs) { try { total = total.concat(await importarArchivo(f)); } catch (err) { errores.push(f.name + ': ' + (err.message || err)); } }
  if (total.length) {
    const nuevos = await guardarImportados(total);
    catActual = 'Importados'; if (herramienta !== 'borrador') { aj.pincel = nuevos[0].id; guardarAjustes(); elegirHerramienta('pincel'); }
    rehacerListaImportados();
  }
  avisar(total.length ? `${total.length} pincel${total.length > 1 ? 'es' : ''} importado${total.length > 1 ? 's' : ''}` + (errores.length ? ' · algunos archivos no se pudieron leer' : '') : 'No se pudo importar: ' + (errores[0] || 'formato no reconocido'));
};

// ---------- panel de pinceles ----------
let catActual = null;
const cachePrev = new Map();
function previaPincel(pin) { // se dibuja una sola vez y se reutiliza
  const k = pin.id + (pin.tip === 'textura' ? aj.textura.id + aj.textura.escala : '');
  if (cachePrev.has(k)) return cachePrev.get(k);
  const w = 260, h = 46, cv = document.createElement('canvas'); cv.width = w * DPR; cv.height = h * DPR;
  const c = cv.getContext('2d'); c.fillStyle = '#fbfbf8'; c.fillRect(0, 0, cv.width, cv.height);
  if (pin.tip === 'textura') { // las texturas se muestran como muestra de material
    c.fillStyle = Texturas.patron(c, pin.texId || aj.textura.id, '#2b2b2b', 0.45 * DPR); c.fillRect(6 * DPR, 5 * DPR, (w - 12) * DPR, (h - 10) * DPR);
    cachePrev.set(k, cv); return cv;
  }
  const tmp = document.createElement('canvas'); tmp.width = w * DPR; tmp.height = h * DPR;
  const tc = tmp.getContext('2d'), t = crearTrazo(tc, pin, pin.cat === 'Borradores' ? '#9a9a9a' : '#1d1d1f', aj.textura);
  const tam = Math.min(pin.mm ? Math.max(1, pin.mm * 5) : lerp(pin.min, pin.max, 0.35), h * 0.45) * DPR;
  for (let i = 0; i <= 60; i++) {
    const f = i / 60, x = (14 + f * (w - 28)) * DPR, y = (h / 2 + Math.sin(f * 6.2832) * h * 0.22) * DPR, pr = Math.sin(f * Math.PI);
    trazoPunto(t, { x, y, s: Math.max(0.5, tam * (1 - pin.pTam + pin.pTam * pr)), a: (pin.alfa || 1) * (1 - (pin.pAlfa || 0) + (pin.pAlfa || 0) * pr) });
  }
  c.globalAlpha = pin.op || 1; c.globalCompositeOperation = pin.mezcla === 'multiply' ? 'multiply' : 'source-over'; c.drawImage(tmp, 0, 0);
  cachePrev.set(k, cv); return cv;
}
// Cada categoría se arma UNA sola vez y queda guardada: cambiar de pestaña (Lápices, Tintas…) solo
// muestra otra lista ya hecha, al instante. Las vistas previas se dibujan en los ratos libres.
const listasPin = new Map(); // categoría → <div> con sus botones
let previasTex = null;       // textura con la que se dibujó la vista previa del pincel de textura
function listaCategoria(cat) {
  let div = listasPin.get(cat); if (div) return div;
  div = document.createElement('div'); div.className = 'pin-grupo'; div.dataset.cat = cat;
  if (cat === 'Importados') {
    const imp = document.createElement('button'); imp.className = 'btn-importar'; imp.innerHTML = '<b>＋ Importar pinceles</b><small>Procreate (.brush, .brushset), Photoshop (.abr) o una imagen PNG/JPG</small>';
    imp.onclick = () => $('fPinceles').click(); div.appendChild(imp);
    if (!PINCELES.some(p => p.cat === cat)) { const n = document.createElement('p'); n.className = 'nota'; n.textContent = 'Aún no importaste pinceles. Pásalos a la tableta (Drive, WhatsApp, cable) y elígelos aquí.'; div.appendChild(n); }
  }
  for (const p of PINCELES.filter(p => p.cat === cat)) {
    const b = document.createElement('button'); b.className = 'pin-item'; b.dataset.id = p.id;
    b.innerHTML = `<span>${escapar(p.nombre)}${p.origen ? ` <small style="opacity:.55">· ${p.origen}</small>` : ''}</span>${p.origen ? '<i class="pin-borrar" title="Eliminar">×</i>' : ''}<canvas width="${260 * DPR}" height="${46 * DPR}"></canvas>`;
    b.onclick = ev => {
      if (ev.target.closest('.pin-borrar')) return confirmar('Eliminar pincel', '¿Quitar “' + p.nombre + '” de tus pinceles?', 'Eliminar', () => borrarImportado(p.id)); if (herramienta === 'borrador') aj.borrador = p.id; else aj.pincel = p.id; guardarAjustes(); actualizarSliders(); marcarPincelActivo(); };
    div.appendChild(b);
  }
  listasPin.set(cat, div); $('pinLista').appendChild(div);
  dibujarPrevias(div);
  return div;
}
function dibujarPrevias(div) { // de a una por cuadro, para que el toque nunca espere
  const bs = [...div.querySelectorAll('.pin-item:not([data-ok])')]; let i = 0;
  const paso = () => {
    const t0 = performance.now();
    while (i < bs.length && performance.now() - t0 < 8) { const b = bs[i++]; b.querySelector('canvas').getContext('2d').drawImage(previaPincel(pincel(b.dataset.id)), 0, 0); b.dataset.ok = '1'; }
    if (i < bs.length) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}
function pintarPinceles() {
  const actual = herramienta === 'borrador' ? aj.borrador : aj.pincel;
  if (!catActual) catActual = pincel(actual).cat;
  if (!$('pinCats').children.length) {
    $('pinCats').innerHTML = CATS.map(c => `<button data-c="${c}">${c}</button>`).join('');
    $('pinCats').querySelectorAll('button').forEach(b => b.onclick = () => { if (catActual === b.dataset.c) return; catActual = b.dataset.c; pintarPinceles(); $('pinLista').scrollTop = 0; });
  }
  $('pinCats').querySelectorAll('button').forEach(b => b.classList.toggle('activo', b.dataset.c === catActual));
  const tx = aj.textura.id + aj.textura.escala; // la vista previa del pincel de textura cambia con la textura elegida
  if (previasTex !== null && previasTex !== tx && listasPin.has('Texturas')) listasPin.get('Texturas').querySelectorAll('.pin-item').forEach(b => b.removeAttribute('data-ok'));
  previasTex = tx;
  const div = listaCategoria(catActual);
  for (const d of listasPin.values()) d.style.display = d === div ? '' : 'none';
  if (div.querySelector('.pin-item:not([data-ok])')) dibujarPrevias(div);
  marcarPincelActivo();
  $('rEstab').value = aj.estab; $('vEstab').textContent = Math.round(aj.estab * 100) + '%';
}
function marcarPincelActivo() { const actual = herramienta === 'borrador' ? aj.borrador : aj.pincel; $('pinLista').querySelectorAll('.pin-item').forEach(b => b.classList.toggle('activo', b.dataset.id === actual)); }
// en los ratos libres después de abrir una hoja, se preparan todas las vistas previas
function prepararPrevias() {
  const pend = PINCELES.slice(); const paso = dl => { while (pend.length && (!dl || dl.timeRemaining() > 4)) { previaPincel(pend.shift()); if (!dl) break; } if (pend.length) idle(paso); };
  const idle = f => window.requestIdleCallback ? requestIdleCallback(f, { timeout: 4000 }) : setTimeout(f, 60);
  idle(paso);
}
$('rEstab').addEventListener('input', e => { aj.estab = +e.target.value; $('vEstab').textContent = Math.round(aj.estab * 100) + '%'; guardarAjustes(); });

// ---------- panel de texturas ----------
let texEscalaPintada = null;
function pintarTexturas() {
  document.querySelectorAll('#segRelleno button').forEach(b => b.classList.toggle('activo', b.dataset.v === aj.textura.modo));
  const g = $('texGrid');
  if (texEscalaPintada !== aj.textura.escala) {
    texEscalaPintada = aj.textura.escala; g.innerHTML = '';
    for (const t of Texturas.lista) {
      const b = document.createElement('button'); b.className = 'tex-item'; b.dataset.id = t.id;
      b.innerHTML = `<canvas width="${110 * DPR}" height="${110 * DPR}"></canvas><span>${t.nombre}</span>`;
      b.onclick = () => { aj.textura.id = t.id; aj.textura.modo = 'textura'; guardarAjustes(); pintarTexturas(); };
      g.appendChild(b);
    }
    let i = 0; const lote = () => { const bs = g.children; for (let n = 0; n < 4 && i < bs.length; n++, i++) { const c = bs[i].querySelector('canvas').getContext('2d'); c.fillStyle = '#fbfbf8'; c.fillRect(0, 0, 999, 999); c.fillStyle = Texturas.patron(c, bs[i].dataset.id, '#2b2b2b', DPR * 0.6 * aj.textura.escala); c.fillRect(0, 0, 999, 999); } if (i < bs.length) requestAnimationFrame(lote); };
    lote();
  }
  g.querySelectorAll('.tex-item').forEach(b => b.classList.toggle('activo', b.dataset.id === aj.textura.id));
  $('rEscala').value = aj.textura.escala; $('vEscala').textContent = aj.textura.escala.toFixed(2) + '×';
}
document.querySelectorAll('#segRelleno button').forEach(b => b.onclick = () => { aj.textura.modo = b.dataset.v; guardarAjustes(); pintarTexturas(); });
$('rEscala').addEventListener('input', e => { aj.textura.escala = +e.target.value; $('vEscala').textContent = aj.textura.escala.toFixed(2) + '×'; });
$('rEscala').addEventListener('change', () => { guardarAjustes(); pintarTexturas(); });

// ---------- panel de capas ----------
function refrescarCapasSiAbierto() { if (panelAbierto('pCapas')) pintarCapas(); }
const gruposCerrados = new Set();
function pintarCapas() {
  const l = $('listaCapas'); l.innerHTML = '';
  let grupoPrevio = null;
  for (let i = doc.capas.length - 1; i >= 0; i--) {
    const c = doc.capas[i], d = document.createElement('div');
    if (c.grupo && c.grupo !== grupoPrevio) { // cabecera del grupo (capas seguidas con el mismo grupo)
      const miembros = []; for (let j = i; j >= 0 && doc.capas[j].grupo === c.grupo; j--) miembros.push(doc.capas[j]);
      const cerrado = gruposCerrados.has(c.grupo), vis = miembros.some(m => m.visible), h = document.createElement('div'); h.className = 'grupo-cab';
      h.innerHTML = `<button data-g="abrir">${cerrado ? '▸' : '▾'}</button><svg style="width:18px;height:18px"><use href="#i-carpeta"/></svg><span class="g-nom">${escapar(c.grupo)} <small style="opacity:.6">(${miembros.length})</small></span><button data-g="vis"><svg><use href="#i-${vis ? 'ojo' : 'ojo-no'}"/></svg></button>`;
      h.onclick = ev => { const g = ev.target.closest('button')?.dataset.g;
        if (g === 'vis') { miembros.forEach(m => { m.visible = !vis; estiloCapa(m); }); marcarCambio(); }
        else if (g === 'abrir') { cerrado ? gruposCerrados.delete(c.grupo) : gruposCerrados.add(c.grupo); }
        else pedirTexto('Nombre del grupo', c.grupo, v => { v = v.trim(); if (v) { miembros.forEach(m => { m.grupo = v; }); marcarCambio(); pintarCapas(); } });
        pintarCapas(); };
      l.appendChild(h);
    }
    grupoPrevio = c.grupo || null;
    if (c.grupo && gruposCerrados.has(c.grupo) && i !== doc.activa) continue;
    d.className = 'capa' + (i === doc.activa ? ' activo' : '') + (c.visible ? '' : ' escondida') + (c.grupo ? ' en-grupo' : '');
    d.innerHTML = `<canvas width="128" height="92"></canvas><div class="c-nom">${escapar(c.nombre)}<small>${Math.round(c.op * 100)}%${c.mezcla === 'multiply' ? ' · Multiplicar' : ''}${c.bloq ? ' · Bloqueada' : ''}${c.ref ? ' · Referencia' : ''}</small></div>
      <button class="c-bloq${c.bloq ? ' on' : ''}" data-a="bloq" title="Bloquear transparencia: pinta solo sobre lo ya dibujado"><svg><use href="#i-candado"/></svg></button>
      <div class="c-ord"><button data-a="sub" title="Subir"><svg><use href="#i-arriba"/></svg></button><button data-a="baj" title="Bajar"><svg><use href="#i-abajo"/></svg></button></div>
      <button class="c-vis" data-a="vis"><svg><use href="#i-${c.visible ? 'ojo' : 'ojo-no'}"/></svg></button>`;
    const m = d.querySelector('canvas').getContext('2d'), k = Math.min(128 / doc.w, 92 / doc.h);
    m.drawImage(c.cv, (128 - doc.w * k) / 2, (92 - doc.h * k) / 2, doc.w * k, doc.h * k);
    d.onclick = ev => {
      const a = ev.target.closest('button')?.dataset.a;
      if (a === 'vis') { c.visible = !c.visible; estiloCapa(c); marcarCambio(); }
      else if (a === 'bloq') { c.bloq = !c.bloq; marcarCambio(); avisar(c.bloq ? 'Transparencia bloqueada: solo pintas encima de lo dibujado' : 'Transparencia desbloqueada'); }
      else if (a === 'sub' && i < doc.capas.length - 1) { moverCapaA(i, i + 1); pushHist({ t: 'mover', de: i, a: i + 1 }); }
      else if (a === 'baj' && i > 0) { moverCapaA(i, i - 1); pushHist({ t: 'mover', de: i, a: i - 1 }); }
      else if (!a) { if (i === doc.activa) renombrarCapa(c); doc.activa = i; ubicarTrazoCv(); }
      pintarCapas();
    };
    l.appendChild(d);
  }
  const c = capaActiva();
  $('rCapaOp').value = c.op; $('vCapaOp').textContent = Math.round(c.op * 100) + '%';
  $('cAgrupar').lastChild.textContent = c.grupo ? 'Desagrupar' : 'Agrupar';
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
  const o = capaActiva(), c = crearCapa(o.nombre + ' copia', doc.w, doc.h); c.ctx.drawImage(o.cv, 0, 0); c.op = o.op; c.mezcla = o.mezcla; c.bloq = o.bloq; c.grupo = o.grupo; c.ref = o.ref;
  const idx = doc.activa + 1; insertarCapa(c, idx); pushHist({ t: 'nueva', capa: c, idx }); pintarCapas();
};
$('cBorrar').onclick = () => {
  if (doc.capas.length <= 1) return avisar('Debe quedar al menos una capa');
  const c = capaActiva(), idx = doc.activa; quitarCapa(c); pushHist({ t: 'borrar', capa: c, idx }); pintarCapas();
};
$('cAgrupar').onclick = () => {
  const i = doc.activa, c = doc.capas[i];
  if (c.grupo) { c.grupo = null; marcarCambio(); pintarCapas(); return avisar('Capa fuera del grupo'); }
  if (i === 0) return avisar('No hay capa debajo para agrupar');
  const abajo = doc.capas[i - 1];
  if (!abajo.grupo) { let n = 1; const usados = new Set(doc.capas.map(x => x.grupo)); while (usados.has('Grupo ' + n)) n++; abajo.grupo = 'Grupo ' + n; }
  c.grupo = abajo.grupo; marcarCambio(); pintarCapas(); avisar('Agrupada con la capa de abajo');
};
$('cLimpiar').onclick = () => {
  const c = capaActiva(), antes = recorte(c.cv, [0, 0, doc.w, doc.h]); c.ctx.clearRect(0, 0, doc.w, doc.h);
  histPx(c, [0, 0, doc.w, doc.h], antes); pintarCapas();
};
$('cCombinar').onclick = () => {
  const i = doc.activa; if (i === 0) return avisar('No hay capa debajo');
  const s = doc.capas[i], inf = doc.capas[i - 1], antesInf = recorte(inf.cv, [0, 0, doc.w, doc.h]);
  inf.ctx.save(); inf.ctx.globalAlpha = s.op; inf.ctx.globalCompositeOperation = s.mezcla === 'multiply' ? 'multiply' : 'source-over';
  if (s.visible) inf.ctx.drawImage(s.cv, 0, 0); inf.ctx.restore();
  const despuesInf = recorte(inf.cv, [0, 0, doc.w, doc.h]);
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
  document.querySelectorAll('#segSim button').forEach(b => b.classList.toggle('activo', b.dataset.v === (g.sim || 'no')));
  $('chkAsist').checked = g.asist; $('rGuiaOp').value = g.op; $('rGuiaTam').value = g.tam;
  $('guiaNota').innerHTML = g.modo[0] === 'p' ? 'Arrastra los <b>puntos verdes</b> para mover los puntos de fuga. Aleja el lienzo (pellizco) si quedan fuera de la hoja.'
    : g.modo === 'ninguna' ? 'Elige una guía para dibujar en cuadrícula, isometría o perspectiva.' : 'Con la asistencia activa, cada trazo se alinea a la guía más cercana.';
}
document.querySelectorAll('#segSim button').forEach(b => b.onclick = () => { doc.guias.sim = b.dataset.v; marcarCambio(); pintarGuiasPanel(); pedirSup(); marcarBotones(); if (b.dataset.v !== 'no') avisar('Simetría activa: lo que dibujas se refleja'); });
$('chkAsist').onchange = e => { doc.guias.asist = e.target.checked; marcarCambio(); };
$('rGuiaOp').oninput = e => { doc.guias.op = +e.target.value; pedirSup(); };
$('rGuiaTam').oninput = e => { doc.guias.tam = +e.target.value; pedirSup(); };
$('rGuiaOp').onchange = $('rGuiaTam').onchange = () => marcarCambio();

// ---------- menú ----------
$('rPresion').value = aj.presion; $('vPresion').textContent = aj.presion.toFixed(2);
$('rPresion').oninput = e => { aj.presion = +e.target.value; $('vPresion').textContent = aj.presion.toFixed(2); guardarAjustes(); pintarCurva(); };
// curva de presión + zona de prueba: pasa el lápiz por el recuadro y ves cuánto marca
let pruebaPr = null;
function pintarCurva() {
  const cv = $('cvPresion'); if (!cv) return; const w = cv.clientWidth || 300, h = 120;
  if (cv.width !== w * DPR) { cv.width = w * DPR; cv.height = h * DPR; }
  const c = cv.getContext('2d'); c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, w, h);
  const P = (x, y) => [10 + x * (w - 20), h - 10 - y * (h - 20)];
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; c.beginPath();
  for (let k = 0; k <= 4; k++) { const [x0, y0] = P(k / 4, 0), [x1, y1] = P(k / 4, 1); c.moveTo(x0, y0); c.lineTo(x1, y1); const [a, b] = P(0, k / 4), [a2, b2] = P(1, k / 4); c.moveTo(a, b); c.lineTo(a2, b2); }
  c.stroke(); c.strokeStyle = '#8ACF00'; c.lineWidth = 2.5; c.beginPath();
  for (let k = 0; k <= 50; k++) { const x = k / 50, [px, py] = P(x, Math.pow(x, aj.presion)); k ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.stroke();
  c.fillStyle = '#9b9ba1'; c.font = '11px -apple-system,Roboto,sans-serif'; c.fillText('suave', 12, h - 14); c.textAlign = 'right'; c.fillText('fuerte', w - 12, h - 14); c.textAlign = 'left';
  if (pruebaPr != null) { const y = Math.pow(pruebaPr, aj.presion), [px, py] = P(pruebaPr, y); c.fillStyle = '#fff'; c.beginPath(); c.arc(px, py, 6, 0, 6.2832); c.fill(); c.fillText('presión ' + Math.round(pruebaPr * 100) + '% → trazo ' + Math.round(y * 100) + '%', 14, 18); }
  else c.fillText('Pasa el lápiz por aquí apretando suave y fuerte', 14, 18);
}
(() => { const cv = $('cvPresion'); if (!cv) return;
  const leer = e => { e.preventDefault(); if (e.pressure > 0 && e.buttons) { pruebaPr = e.pressure; pintarCurva(); } };
  cv.addEventListener('pointerdown', leer); cv.addEventListener('pointermove', leer); cv.addEventListener('pointerup', () => { pruebaPr = null; pintarCurva(); });
})();
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
$('mCopiar').onclick = () => { cerrarPaneles(); menuCopiarPegar(); };
$('mSinUI').onclick = () => { cerrarPaneles(); alternarInterfaz(); };
$('mPapel').onclick = () => { cerrarPaneles(); dialogoPapel(); };
$('fImportar').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const img = await createImageBitmap(f);
    if (doc.capas.length >= MAX_CAPAS) return avisar('Máximo ' + MAX_CAPAS + ' capas');
    if (flot) aplicarFlot();
    // la referencia va ABAJO de todo, semitransparente y sin bloquear el relleno por color
    const c = crearCapa('Referencia', doc.w, doc.h), k = Math.min(doc.w / img.width, doc.h / img.height) * 0.9;
    c.op = 0.5; c.ref = true;
    insertarCapa(c, 0); pushHist({ t: 'nueva', capa: c, idx: 0 });
    const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(img.width * k)); cv.height = Math.max(1, Math.round(img.height * k));
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); img.close && img.close();
    crearFlot(c, cv, doc.w / 2, doc.h / 2, null); // queda lista para mover, escalar o girar
    avisar('Acomoda la imagen y toca Listo · luego dibuja encima en otra capa');
  } catch (err) { avisar('No se pudo abrir la imagen'); }
};

// ---------- teclado (para probar en PC) ----------
addEventListener('keydown', e => {
  if (!doc || $('editor').classList.contains('oculto') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || !$('modal').classList.contains('oculto')) return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? hacerRehacer() : hacerDeshacer(); }
  else if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); hacerRehacer(); }
  else if (k === ' ') espacio = true;
  else if (k === 'b') elegirHerramienta('pincel');
  else if (k === 'e') elegirHerramienta('borrador');
  else if (k === 'l') elegirHerramienta('relleno');
  else if (k === 'i') elegirHerramienta('gotero');
  else if (k === 'c') elegirHerramienta('cota');
  else if (k === 't') elegirHerramienta('texto');
  else if (k === 's') elegirHerramienta('simbolo');
  else if (k === '[' || k === ']') { const o = opcionesPincel(claveAjuste()); o.tam = clamp(o.tam + (k === ']' ? 0.05 : -0.05), 0.01, 1); actualizarSliders(); }
});
addEventListener('keyup', e => { if (e.key === ' ') espacio = false; });

// =====================================================================
//  DIÁLOGOS
// =====================================================================
function escapar(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function modal(html, alAbrir, alCancelar) {
  $('modalCaja').innerHTML = html; $('modal').classList.remove('oculto');
  const cerrar = () => $('modal').classList.add('oculto');
  $('modal').onclick = e => { if (e.target === $('modal')) { cerrar(); alCancelar && alCancelar(); } };
  alAbrir && alAbrir(cerrar);
}
function pedirTexto(titulo, valor, ok, teclado) {
  modal(`<h3>${titulo}</h3><input type="text" id="mTxt" ${teclado ? `inputmode="${teclado}"` : ''} value="${escapar(valor)}"><div class="modal-btns"><button id="mNo">Cancelar</button><button class="ok" id="mSi">Guardar</button></div>`, cerrar => {
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
    { id: 'a4h', n: 'A4 horizontal', w: 1754, h: 1240 }, { id: 'a4v', n: 'A4 vertical', w: 1240, h: 1754 },
    { id: 'a3h', n: 'A3 horizontal', w: 2480, h: 1754 }, { id: 'a3v', n: 'A3 vertical', w: 1754, h: 2480 },
    { id: 'cuad', n: 'Cuadrado', w: 1800, h: 1800 }, { id: 'pant', n: 'Pantalla', w: Math.min(2048, Math.max(sw, sh)), h: Math.min(1536, Math.min(sw, sh)) },
  ];
}
function opcionesHtml(lista, sel, extra) {
  return lista.map(o => `<button data-id="${o.id}" class="${o.id === sel ? 'activo' : ''}">${extra(o)}${o.n || o.nombre}</button>`).join('');
}
const TIPOS = [
  { id: 'boceto', n: 'Boceto libre', d: 'Dibujo a mano alzada' }, { id: 'levantamiento', n: 'Levantamiento', d: 'Cotas, notas y lista' },
  { id: 'planta', n: 'Planta', d: 'Distribución a escala' }, { id: 'elevacion', n: 'Elevación / corte', d: 'Fachadas y secciones' },
  { id: 'perspectiva', n: 'Perspectiva', d: 'Guía de 2 puntos' },
];
const LISTA_LEV = ['Largo y ancho de cada ambiente', 'Diagonales para verificar escuadra', 'Altura de piso a techo y de vigas', 'Espesor de muros y tipo (ladrillo, drywall, adobe)', 'Columnas y vigas: ubicación y sección (ancho × peralte)', 'Puertas y ventanas: ancho, alto y alféizar', 'Tomacorrientes, interruptores y puntos de luz', 'Puntos de agua y desagüe', 'Niveles de piso (NPT)', 'Ubicar el norte', 'Fotos de cada ambiente', 'Estado de acabados y humedad'];
function dialogoNuevo() {
  let fmt = 'a4h', pap = 'blanco', tipo = 'boceto', esc = 50;
  const F = formatos();
  modal(`<h3>Nueva hoja</h3>
    <div class="etq">Tipo de hoja</div><div class="opciones" id="oTipo">${TIPOS.map(t => `<button data-id="${t.id}" class="${t.id === tipo ? 'activo' : ''}">${t.n}<small>${t.d}</small></button>`).join('')}</div>
    <div id="oEscWrap" class="oculto"><div class="etq">Escala</div><div class="opciones" id="oEsc">${[20, 25, 50, 75, 100, 200].map(e => `<button data-id="${e}" class="${e === esc ? 'activo' : ''}">1/${e}</button>`).join('')}</div></div>
    <div class="etq">Tamaño</div><div class="opciones" id="oFmt">${opcionesHtml(F, fmt, o => { const k = 30 / Math.max(o.w, o.h); return `<span class="hoja" style="width:${o.w * k}px;height:${o.h * k}px"></span>`; })}</div>
    <div class="etq">Papel</div><div class="opciones" id="oPap">${opcionesHtml(PAPELES, pap, o => `<span class="hoja" style="width:26px;height:20px;background:${o.color}"></span>`)}</div>
    <div class="modal-btns"><button id="mNo">Cancelar</button><button class="ok" id="mSi">Crear</button></div>`, cerrar => {
    const sel = (id, fn) => $(id).querySelectorAll('button').forEach(b => b.onclick = () => { $(id).querySelectorAll('button').forEach(x => x.classList.toggle('activo', x === b)); fn(b.dataset.id); });
    sel('oFmt', v => fmt = v); sel('oPap', v => pap = v); sel('oEsc', v => esc = +v);
    sel('oTipo', v => { tipo = v; $('oEscWrap').classList.toggle('oculto', v === 'boceto' || v === 'perspectiva'); });
    $('mNo').onclick = cerrar;
    $('mSi').onclick = () => { cerrar(); const f = F.find(x => x.id === fmt); nuevoDibujo(f.w, f.h, pap, tipo, esc); };
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
    const r = indexedDB.open('oxen', 1);
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

// Guardar comprime cada capa (trabajo pesado): se hace cuando el usuario deja de tocar la pantalla,
// nunca en medio de un trazo o mientras abre paneles, para que la app no se trabe.
let tGuardar = 0, guardando = null, pendiente = false, ultToque = 0, esperaDesde = 0;
document.addEventListener('pointerdown', () => { ultToque = performance.now(); }, true);
document.addEventListener('pointermove', e => { if (e.buttons) ultToque = performance.now(); }, true);
function marcarCambio() { if (!doc) return; doc.cambio = true; clearTimeout(tGuardar); if (!esperaDesde) esperaDesde = performance.now(); tGuardar = setTimeout(guardarCuandoQuieto, 2500); }
function guardarCuandoQuieto() {
  const ahora = performance.now(), ocupado = trazo || lapizAbajo || toques.size || ahora - ultToque < 2000;
  if (flot || ocupado && ahora - esperaDesde < 45000) { tGuardar = setTimeout(guardarCuandoQuieto, 1200); return; }
  const ir = () => { esperaDesde = 0; guardar(); };
  window.requestIdleCallback ? requestIdleCallback(ir, { timeout: 1500 }) : ir();
}
const respiro = () => new Promise(r => setTimeout(r, 0));
async function guardar() {
  if (flot) aplicarFlot(); // una selección flotando se pega antes de guardar
  if (!doc || !doc.cambio) return;
  if (guardando) { pendiente = true; return guardando; }
  const d = doc; d.cambio = false;
  guardando = (async () => {
    for (const c of d.capas) if (c.sucia || !c.blob) { c.sucia = false; c.blob = await aBlob(c.cv); await respiro(); }
    const mini = componer(Math.min(1, 480 / Math.max(d.w, d.h)), d);
    const thumb = await aBlob(mini, 'image/jpeg', 0.85);
    await dbPut({
      id: d.id, nombre: d.nombre, w: d.w, h: d.h, papel: d.papel, grano: d.grano, creado: d.creado, fecha: Date.now(), activa: d.activa, guias: d.guias, thumb,
      tipo: d.tipo, escala: d.escala, pxmm: d.pxmm, objetos: d.objetos.map(o => { const { _bb, ...x } = o; return x; }), info: d.info, notas: d.notas, lista: d.lista,
      rotulo: d.rotulo, cotasAuto: d.cotasAuto, pedirMedida: d.pedirMedida, verAnot: d.verAnot,
      capas: d.capas.map(c => ({ nombre: c.nombre, op: c.op, mezcla: c.mezcla, visible: c.visible, blob: c.blob, bloq: !!c.bloq, grupo: c.grupo || null, ref: !!c.ref })),
    });
  })().catch(err => { console.error(err); avisar('No se pudo guardar'); d.cambio = true; }).finally(() => { guardando = null; if (pendiente) { pendiente = false; guardar(); } });
  return guardando;
}
function componer(k, d = doc) {
  const cv = document.createElement('canvas'); cv.width = Math.round(d.w * k); cv.height = Math.round(d.h * k);
  const c = cv.getContext('2d'); c.imageSmoothingQuality = 'high';
  dibujarPapel(c, cv.width, cv.height, k);
  for (const l of d.capas) if (l.visible) { c.globalAlpha = l.op; c.globalCompositeOperation = l.mezcla === 'multiply' ? 'multiply' : 'source-over'; c.drawImage(l.cv, 0, 0, cv.width, cv.height); }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  if (d === doc && d.verAnot !== false) c.drawImage(anotCv, 0, 0, cv.width, cv.height);
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
      try { await P.Filesystem.writeFile({ path: 'OXEN PRO/' + nombre, data, directory: 'DOCUMENTS', recursive: true }); guardado = true; } catch (e) {}
      const r = await P.Filesystem.writeFile({ path: nombre, data, directory: 'CACHE' });
      avisar(guardado ? 'Guardado en Documentos/OXEN PRO' : 'Imagen lista');
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
  lineas.clear(); selSim = null; herrAntesSim = null;
  trazoCv.width = doc.w; trazoCv.height = doc.h; trazoCv.style.width = doc.w + 'px'; trazoCv.style.height = doc.h + 'px'; trazoCv.style.display = 'none';
  respaldo.width = doc.w; respaldo.height = doc.h;
  docEl.style.width = doc.w + 'px'; docEl.style.height = doc.h + 'px';
  pintarPapel(); montarCapas(); ubicarTrazoCv();
  docEl.appendChild(anotCv); renderObjetos();
  $('galeria').classList.add('oculto'); $('editor').classList.remove('oculto');
  if (history.state?.pd !== 'editor') history.pushState({ pd: 'editor' }, '');
  ajustarPantalla(); marcarBotones(); actualizarSliders(); pedirSup();
  setTimeout(prepararPrevias, 1500);
  ventanaPines = false; pinVisto = null; $('pinGlobo').classList.add('oculto'); pintarVentanaPines();
}
function datosArq(d, r) { // valores de arquitectura (nuevos o guardados)
  r = r || {};
  d.tipo = r.tipo || 'boceto'; d.escala = r.escala || 50; d.pxmm = r.pxmm || (r.w ? (r.w >= 2480 ? 2480 / 297 : PXMM) : PXMM); d.objetos = r.objetos || [];
  d.info = r.info || {}; d.notas = r.notas || ''; d.lista = r.lista || []; d.rotulo = !!r.rotulo;
  d.cotasAuto = !!r.cotasAuto; d.pedirMedida = r.pedirMedida !== false; d.verAnot = r.verAnot !== false;
}
function nuevoDibujo(w, h, papel, tipo = 'boceto', esc = 50) {
  const n = new Date(), tn = TIPOS.find(t => t.id === tipo).n;
  doc = { id: nuevoId(), nombre: (tipo === 'boceto' ? 'Boceto' : tn) + ' ' + n.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }) + ' ' + n.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    w, h, papel, grano: true, creado: Date.now(), capas: [], activa: 0, guias: guiasPorDefecto(w, h) };
  datosArq(doc, { tipo, escala: esc });
  doc.info.fecha = n.toLocaleDateString('es-PE');
  const unM = pxDeMetros(1);
  if (tipo === 'levantamiento') {
    ['Muros', 'Detalles'].forEach(nm => doc.capas.push(crearCapa(nm, w, h))); doc.activa = 0;
    doc.rotulo = true; doc.cotasAuto = true; doc.lista = LISTA_LEV.map(t => ({ t, ok: false }));
    Object.assign(doc.guias, { modo: 'cuadricula', asist: true, tam: unM, op: 0.3 });
  } else if (tipo === 'planta' || tipo === 'elevacion') {
    ['Muros', 'Color'].forEach(nm => doc.capas.push(crearCapa(nm, w, h)));
    doc.rotulo = true; Object.assign(doc.guias, { modo: 'cuadricula', asist: true, tam: unM, op: 0.3 });
  } else if (tipo === 'perspectiva') {
    doc.capas.push(crearCapa('Trazo', w, h)); doc.capas.push(crearCapa('Color', w, h)); Object.assign(doc.guias, { modo: 'p2', asist: true });
  } else doc.capas.push(crearCapa('Boceto', w, h));
  prepararEditor(); doc.cambio = true; guardar();
  if (tipo === 'levantamiento') avisar('Levantamiento a 1/' + esc + ': usa la cota para medir');
}
async function abrirDibujo(id) {
  const r = await dbUno(id); if (!r) return;
  doc = { id: r.id, nombre: r.nombre, w: r.w, h: r.h, papel: r.papel, grano: r.grano, creado: r.creado, activa: r.activa || 0, guias: Object.assign(guiasPorDefecto(r.w, r.h), r.guias || {}), capas: [] };
  datosArq(doc, r);
  for (const l of r.capas) {
    const c = crearCapa(l.nombre, r.w, r.h); c.op = l.op; c.mezcla = l.mezcla; c.visible = l.visible; c.bloq = !!l.bloq; c.grupo = l.grupo || null; c.ref = !!l.ref;
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
//  NOTAS DE LA HOJA (datos, lista de levantamiento, notas libres)
// =====================================================================
let tabNotas = 'hoja';
function pintarNotas() {
  document.querySelectorAll('#segNotas button').forEach(b => b.classList.toggle('activo', b.dataset.v === tabNotas));
  $('nHoja').classList.toggle('oculto', tabNotas !== 'hoja'); $('nLista').classList.toggle('oculto', tabNotas !== 'lista'); $('nNotas').classList.toggle('oculto', tabNotas !== 'notas');
  $('nTipo').innerHTML = TIPOS.map(t => `<option value="${t.id}" ${t.id === doc.tipo ? 'selected' : ''}>${t.n}</option>`).join('');
  $('nEscala').innerHTML = ESCALAS.map(e => `<option value="${e}" ${e === doc.escala ? 'selected' : ''}>1/${e}</option>`).join('');
  document.querySelectorAll('#nHoja input[data-k]').forEach(i => { i.value = doc.info[i.dataset.k] || ''; });
  $('nRotulo').checked = doc.rotulo; $('nCotaAuto').checked = doc.cotasAuto; $('nPedir').checked = doc.pedirMedida; $('nVerAnot').checked = doc.verAnot !== false;
  if (document.activeElement !== $('nTexto')) $('nTexto').value = doc.notas || '';
  const pines = doc.objetos.filter(o => o.tipo === 'pin').sort((a, b) => a.n - b.n), pl = $('nPines');
  pl.innerHTML = pines.length ? '' : '<p class="nota">Sin notas en el plano. Arrastra el ícono de nota hasta el punto donde la quieras.</p>';
  for (const o of pines) { const b = document.createElement('button'); b.innerHTML = `<b>${o.n}</b><span>${escapar(o.texto || '(sin texto)')}</span>`; b.onclick = () => { cerrarPaneles(); irAPin(o); editarPin(o); }; pl.appendChild(b); }
  const it = $('nItems'); it.innerHTML = doc.lista.length ? '' : '<p class="nota">Sin pendientes. Agrega lo que debes medir o revisar en obra.</p>';
  doc.lista.forEach((x, i) => {
    const d = document.createElement('div'); d.className = 'n-item' + (x.ok ? ' ok' : '');
    d.innerHTML = `<input type="checkbox" ${x.ok ? 'checked' : ''}><span>${escapar(x.t)}</span><button title="Quitar">×</button>`;
    d.querySelector('input').onchange = e => { x.ok = e.target.checked; marcarCambio(); pintarNotas(); };
    d.querySelector('button').onclick = () => { doc.lista.splice(i, 1); marcarCambio(); pintarNotas(); };
    it.appendChild(d);
  });
}
document.querySelectorAll('#segNotas button').forEach(b => b.onclick = () => { tabNotas = b.dataset.v; pintarNotas(); });
$('bNotas').addEventListener('click', e => { abrirPanel('pNotas', e.currentTarget); if (panelAbierto('pNotas')) pintarNotas(); });
$('nTipo').onchange = e => { doc.tipo = e.target.value; marcarCambio(); renderObjetos(); };
$('nEscala').onchange = e => { doc.escala = +e.target.value; marcarCambio(); renderObjetos(); avisar('Escala 1/' + doc.escala + ': las cotas se recalculan'); };
document.querySelectorAll('#nHoja input[data-k]').forEach(i => i.addEventListener('input', () => { doc.info[i.dataset.k] = i.value; marcarCambio(); if (doc.rotulo) renderObjetos(); }));
$('nRotulo').onchange = e => { doc.rotulo = e.target.checked; marcarCambio(); renderObjetos(); };
$('nCotaAuto').onchange = e => { doc.cotasAuto = e.target.checked; marcarCambio(); };
$('nPedir').onchange = e => { doc.pedirMedida = e.target.checked; marcarCambio(); };
$('nVerAnot').onchange = e => { doc.verAnot = e.target.checked; marcarCambio(); renderObjetos(); };
$('nTexto').addEventListener('input', e => { doc.notas = e.target.value; marcarCambio(); });
const agregarItem = () => { const v = $('nNuevo').value.trim(); if (!v) return; doc.lista.push({ t: v, ok: false }); $('nNuevo').value = ''; marcarCambio(); pintarNotas(); };
$('nAgregar').onclick = agregarItem; $('nNuevo').onkeydown = e => { if (e.key === 'Enter') agregarItem(); };

// =====================================================================
//  TUTORIAL DE BIENVENIDA
// =====================================================================
const TUT = [
  { t: 'Bienvenido a OXEN PRO', p: 'Tu cuaderno de bocetos y levantamientos de arquitecto. Todo se guarda solo en la tableta y funciona sin internet.',
    svg: '<svg viewBox="0 0 400 170"><path d="M60 130 200 40l140 90" fill="none"/><path d="M90 110v40h220v-40" fill="none"/><path d="M170 150v-40h60v40" fill="none"/><path d="M20 150h360" stroke="#8ACF00" stroke-width="3"/></svg>' },
  { t: 'El lápiz dibuja, los dedos mueven', p: '<b>Lápiz</b>: dibuja con presión; inclínalo para sombrear. <b>1 dedo</b>: mueve la hoja. <b>2 dedos</b>: acerca, aleja y gira. <b>Toque con 2 dedos</b> = deshacer · <b>3 dedos</b> = rehacer.',
    svg: '<svg viewBox="0 0 400 170"><path d="M70 120c40-60 80-60 120-10s80 40 120-30" fill="none" stroke-width="3"/><circle cx="300" cy="60" r="10" fill="#8ACF00" stroke="none"/><path d="M300 60l40-40" stroke-width="6" stroke="#1d1d1f"/></svg>' },
  { t: 'Líneas perfectas', p: 'Al final de un trazo <b>mantén el lápiz quieto</b> y se vuelve recta, círculo, rectángulo, triángulo o polilínea. <b>Sin soltar</b>, mueve el lápiz para agrandarla o girarla, y toca con un dedo para hacerla perfecta. En <b>Guías</b> activa cuadrícula, isometría o perspectiva de 1, 2 y 3 puntos: las líneas se alinean solas.',
    svg: '<svg viewBox="0 0 400 170"><path d="M200 70 20 30M200 70 380 30M200 70 20 150M200 70 380 150M200 70v100" stroke="#8ACF00" stroke-width="1.2"/><path d="M200 70 110 52v80l90 38 90-38V52z" fill="none" stroke-width="2.5"/></svg>' },
  { t: 'Pinceles y texturas', p: 'Toca otra vez el <b>pincel</b> para abrir la biblioteca: lápices, estilógrafos por grosor, líneas de eje y ocultas, marcadores, acuarela y vegetación. Con el <b>lazo</b> rellenas zonas con ladrillo, concreto, madera, piedra y más.',
    svg: '<svg viewBox="0 0 400 170"><rect x="40" y="35" width="140" height="100" fill="none"/><path d="M40 60h140M40 85h140M40 110h140M75 35v25M145 35v25M110 60v25M75 85v25M145 85v25M110 110v25" stroke-width="1.5"/><path d="M220 120c30-50 60-80 140-70" fill="none" stroke="#8a959e" stroke-width="16" stroke-linecap="round" opacity=".5"/></svg>' },
  { t: 'Levantamientos con cotas', p: 'Crea una hoja de <b>Levantamiento</b> y elige la escala. Con la <b>cota</b> arrastra de un punto a otro: escribe la medida real y, si quieres, la línea se ajusta a escala. Pon <b>notas</b>, <b>puertas, ventanas, mobiliario e instalaciones</b> desde símbolos.',
    svg: '<svg viewBox="0 0 400 170"><rect x="80" y="50" width="240" height="90" fill="none" stroke-width="5"/><path d="M80 30h240M80 24v12M320 24v12M76 34l8-8M316 34l8-8" stroke-width="1.5"/><text x="200" y="24" font-size="15" text-anchor="middle" font-family="sans-serif" fill="#1d1d1f" stroke="none">4.85</text><path d="M200 140v-40a40 40 0 0 1 40 40" fill="none" stroke-width="1.5"/></svg>' },
  { t: 'Notas, lista y rótulo', p: 'En <b>Notas</b> completas los datos de la hoja (proyecto, ubicación, quién levantó), marcas la <b>lista de lo que falta medir</b> y escribes observaciones. El rótulo y la escala gráfica salen en la hoja y al exportar.',
    svg: '<svg viewBox="0 0 400 170"><rect x="210" y="70" width="170" height="80" fill="none" stroke-width="2"/><path d="M210 90h170M210 110h170M210 130h170M295 130v20" stroke-width="1"/><path d="M40 45h20M70 45h110M40 75h20M70 75h90M40 105h20M70 105h100" stroke-width="2"/><path d="M42 40l5 6 9-11M42 70l5 6 9-11" stroke="#8ACF00" stroke-width="3" fill="none"/></svg>' },
];
let tutI = 0;
function mostrarTutorial() {
  tutI = 0; $('tutorial').classList.remove('oculto'); pintarTut();
}
function pintarTut() {
  const p = TUT[tutI];
  $('tutPasos').innerHTML = `<div class="tut-paso"><div class="tut-ilus">${p.svg}</div><h2>${p.t}</h2><p>${p.p}</p></div>`;
  $('tutPuntos').innerHTML = TUT.map((_, i) => `<i class="${i === tutI ? 'on' : ''}"></i>`).join('');
  $('tutSig').textContent = tutI === TUT.length - 1 ? '¡Empezar!' : 'Siguiente';
  $('tutSaltar').style.visibility = tutI === TUT.length - 1 ? 'hidden' : '';
}
function cerrarTutorial() { $('tutorial').classList.add('oculto'); try { localStorage.setItem('oxen-tutorial', '1'); } catch (e) {} }
$('tutSig').onclick = () => { if (tutI < TUT.length - 1) { tutI++; pintarTut(); } else cerrarTutorial(); };
$('tutSaltar').onclick = cerrarTutorial;
$('btnAyuda').onclick = mostrarTutorial;
$('mTutorial').onclick = () => { cerrarPaneles(); mostrarTutorial(); };
(() => { // deslizar entre pasos
  let x0 = null; const el = $('tutorial');
  el.addEventListener('pointerdown', e => { x0 = e.clientX; });
  el.addEventListener('pointerup', e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 60) { if (dx < 0 && tutI < TUT.length - 1) tutI++; else if (dx > 0 && tutI > 0) tutI--; pintarTut(); } });
})();

// =====================================================================
//  TOQUE RÁPIDO EN BOTONES (lápiz y dedo)
// =====================================================================
// El botón responde al levantar el lápiz/dedo (sin esperar el clic del navegador). El clic que el
// navegador manda después se descarta SIEMPRE (aunque llegue tarde porque el equipo estaba ocupado);
// antes se descartaba solo si llegaba en menos de 0.7 s, y si llegaba tarde el botón se activaba dos
// veces: el panel se abría y se volvía a cerrar ("hay que presionar varias veces").
(() => {
  let d = null, hecho = null, hechoT = 0;
  document.addEventListener('pointerdown', e => {
    hecho = null;
    if (e.pointerType === 'mouse' || e.target.closest('#escenario')) { d = null; return; }
    const b = e.target.closest('button'); d = b ? { b, x: e.clientX, y: e.clientY, id: e.pointerId } : null;
  }, true);
  document.addEventListener('pointerup', e => {
    if (!d || e.pointerType === 'mouse' || e.pointerId !== d.id) return;
    const b = d.b, ok = Math.hypot(e.clientX - d.x, e.clientY - d.y) < 16 && (e.target.closest('button') === b || b.contains(document.elementFromPoint(e.clientX, e.clientY)));
    d = null;
    if (ok && !b.disabled && b.isConnected) { hecho = b; hechoT = performance.now(); b.click(); }
  }, true);
  document.addEventListener('pointercancel', () => { d = null; }, true);
  document.addEventListener('click', e => { // descarta el clic repetido del navegador
    if (!e.isTrusted || !hecho) return;
    if (performance.now() - hechoT < 3000) { e.stopPropagation(); e.preventDefault(); }
    hecho = null;
  }, true);
})();


// =====================================================================
//  ARRASTRAR DESDE LA BARRA: el color (rellena un ambiente, como ColorDrop de Procreate)
//  y la nota (se clava en el punto donde se suelta)
// =====================================================================
function arrastrable(btn, clase, html, alSoltar) {
  let st = null;
  // preventDefault: que la tableta no tome el "mantener presionado" del lápiz como su propio menú
  btn.addEventListener('pointerdown', e => { if (!doc || e.button > 0) return; e.preventDefault(); st = { id: e.pointerId, x: e.clientX, y: e.clientY, fant: null }; try { btn.setPointerCapture(e.pointerId); } catch (_) {} });
  btn.addEventListener('pointermove', e => {
    if (!st || st.id !== e.pointerId) return;
    if (!st.fant && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 7) { st.fant = document.createElement('div'); st.fant.className = clase; st.fant.innerHTML = html(); document.body.appendChild(st.fant); cerrarPaneles(); }
    if (st.fant) { st.fant.style.left = e.clientX + 'px'; st.fant.style.top = e.clientY + 'px'; }
  });
  const fin = e => {
    if (!st || st.id !== e.pointerId) return; const s0 = st; st = null; if (!s0.fant) return;
    s0.fant.remove(); btn._arr = performance.now();
    if (e.type !== 'pointerup') return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el.closest('#escenario') && !el.closest('#barra,#lateral,.panel,.sel-bar')) alSoltar(aDoc(e.clientX, e.clientY));
  };
  btn.addEventListener('pointerup', fin); btn.addEventListener('pointercancel', fin);
  btn.addEventListener('click', e => { if (btn._arr && performance.now() - btn._arr < 800) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
}
arrastrable($('bColor'), 'arrastre-color', () => `<div style="width:100%;height:100%;border-radius:50%;background:${aj.color}"></div>`, d => rellenarEn(d));
arrastrable($('bPin'), 'arrastre-pin', () => '<svg viewBox="0 0 24 24" style="width:100%;height:100%;fill:currentColor;stroke:#fff;stroke-width:1.2"><path d="M12 22s-7-6.6-7-11.5a7 7 0 0 1 14 0C19 15.4 12 22 12 22z"/></svg>', d => { if (flot) aplicarFlot(); nuevoPin(d); });

// ---- relleno por color (cubeta) ----
// El contorno sale de TODAS las capas visibles (muros en una capa, color en otra), como en un plano real.
function rellenarEn(d) {
  if (!doc) return; const capa = capaActiva();
  if (!capa.visible) return avisar('La capa está oculta');
  const W = doc.w, H = doc.h, x0 = Math.floor(d.x), y0 = Math.floor(d.y);
  if (x0 < 0 || y0 < 0 || x0 >= W || y0 >= H) return;
  if (flot) aplicarFlot();
  const comp = document.createElement('canvas'); comp.width = W; comp.height = H; const cc = comp.getContext('2d', { willReadFrequently: true });
  for (const l of doc.capas) if (l.visible && !l.ref) { cc.globalAlpha = Math.max(l.op, 0.6); cc.drawImage(l.cv, 0, 0); }
  const px = cc.getImageData(0, 0, W, H).data, i0 = (y0 * W + x0) * 4;
  const r0 = px[i0], g0 = px[i0 + 1], b0 = px[i0 + 2], a0 = px[i0 + 3], tol = 70; // ~27 %
  const igual = i => { const a = px[i + 3]; if (a0 < 20) return a < 60; return Math.abs(px[i] - r0) + Math.abs(px[i + 1] - g0) + Math.abs(px[i + 2] - b0) + Math.abs(a - a0) < tol * 2; };
  const mask = new Uint8Array(W * H), pila = [x0, y0]; let n = 0, bx0 = x0, bx1 = x0, by0 = y0, by1 = y0;
  while (pila.length) {
    const y = pila.pop(); let x = pila.pop(), f = y * W;
    while (x >= 0 && !mask[f + x] && igual((f + x) * 4)) x--;
    x++; let arriba = false, abajo = false;
    while (x < W && !mask[f + x] && igual((f + x) * 4)) {
      mask[f + x] = 1; n++; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y;
      if (y > 0) { const k = f - W + x; if (!mask[k] && igual(k * 4)) { if (!arriba) { pila.push(x, y - 1); arriba = true; } } else arriba = false; }
      if (y < H - 1) { const k = f + W + x; if (!mask[k] && igual(k * 4)) { if (!abajo) { pila.push(x, y + 1); abajo = true; } } else abajo = false; }
      x++;
    }
  }
  if (!n) return;
  // se amplía 1 px para cubrir el borde suave de las líneas
  const r = bbEntero([bx0 - 2, by0 - 2, bx1 + 3, by1 + 3]), rgb = hexRgb(aj.color).split(',').map(Number);
  const img = new ImageData(r[2], r[3]), o = img.data;
  for (let y = 0; y < r[3]; y++) for (let x = 0; x < r[2]; x++) {
    const gx = x + r[0], gy = y + r[1]; let dentro = mask[gy * W + gx];
    if (!dentro) for (let dy = -1; dy <= 1 && !dentro; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = gx + dx, yy = gy + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && mask[yy * W + xx]) { dentro = 1; break; } }
    if (dentro) { const k = (y * r[2] + x) * 4; o[k] = rgb[0]; o[k + 1] = rgb[1]; o[k + 2] = rgb[2]; o[k + 3] = 255; }
  }
  const tmp = document.createElement('canvas'); tmp.width = r[2]; tmp.height = r[3]; tmp.getContext('2d').putImageData(img, 0, 0);
  const antes = recorte(capa.cv, r), c = capa.ctx;
  c.save(); c.globalAlpha = opcionesPincel('relleno').op; if (capa.bloq) c.globalCompositeOperation = 'source-atop'; c.drawImage(tmp, r[0], r[1]); c.restore();
  histPx(capa, r, antes); refrescarCapasSiAbierto();
  avisar(n > W * H * 0.97 ? 'Se rellenó toda la hoja: el contorno tiene una abertura (deshaz con 2 dedos)' : 'Relleno');
}

// =====================================================================
//  RESALTADO AL PASAR EL LÁPIZ (como en Procreate): el botón se ilumina al pasar por encima y
//  recién se activa al tocarlo. En tabletas el navegador no aplica :hover, por eso se hace aquí.
// =====================================================================
(() => {
  let actual = null;
  const quitar = () => { if (actual) { actual.classList.remove('pasa'); actual = null; } };
  const SEL = 'button, .pin-item, .tex-item, .capa, .item, label.interruptor, .paleta button';
  document.addEventListener('pointerover', e => {
    if (e.pointerType === 'touch' || e.buttons) return;
    const el = e.target.closest(SEL); if (el === actual) return;
    quitar(); if (el && !el.disabled) { actual = el; el.classList.add('pasa'); }
  }, true);
  document.addEventListener('pointerout', e => { if (actual && !actual.contains(e.relatedTarget)) quitar(); }, true);
  document.addEventListener('pointerdown', quitar, true);
  document.addEventListener('pointerleave', quitar);
  addEventListener('blur', quitar);
})();

// =====================================================================
//  ETIQUETAS AL PASAR EL LÁPIZ (o el ratón) SOBRE LOS BOTONES
// =====================================================================
(() => {
  const tip = $('tip'); let tT = 0, actual = null;
  document.querySelectorAll('[title]').forEach(el => { el.dataset.tip = el.title; el.removeAttribute('title'); });
  document.addEventListener('pointerover', e => {
    if (e.pointerType === 'touch' || e.target.closest('.panel,.modal,.sel-bar')) return; // dentro de paneles no estorba
    const el = e.target.closest('[data-tip]'); if (!el || el === actual) return;
    actual = el; clearTimeout(tT);
    tT = setTimeout(() => {
      const r = el.getBoundingClientRect(); tip.textContent = el.dataset.tip; tip.classList.remove('oculto');
      const w = tip.offsetWidth, lat = el.closest('#lateral');
      if (lat) { tip.style.left = (document.body.classList.contains('zurdo') ? r.left - w - 8 : r.right + 8) + 'px'; tip.style.top = (r.top + r.height / 2 - 12) + 'px'; }
      else { tip.style.left = clamp(r.left + r.width / 2 - w / 2, 6, innerWidth - w - 6) + 'px'; tip.style.top = (r.bottom + 6) + 'px'; }
    }, 650);
  });
  document.addEventListener('pointerout', e => { const el = e.target.closest('[data-tip]'); if (el && !el.contains(e.relatedTarget)) { actual = null; clearTimeout(tT); tip.classList.add('oculto'); } });
  document.addEventListener('pointerdown', () => { clearTimeout(tT); tip.classList.add('oculto'); }, true);
})();

// =====================================================================
//  ACTUALIZACIONES (sin reinstalar)
//  • La app carga desde internet: las mejoras llegan solas al abrirla.
//  • Si OXEN ya está abierto, busca cambios cada 20 min y al volver a la app.
//  • Si alguna vez cambia la parte nativa (el APK), la descarga e instala desde la propia app.
// =====================================================================
const ES_APP = !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
const nativo = () => ES_APP && Capacitor.Plugins && Capacitor.Plugins.OxenNative;
const UPD = { web: null, apk: null, buscando: false };
function cmpVer(a, b) { const x = String(a).split('-')[0].split('.').map(Number), y = String(b).split('-')[0].split('.').map(Number); for (let i = 0; i < 3; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; }
async function buscarActualizacion(manual) {
  if (UPD.buscando) return; UPD.buscando = true;
  $('btnActualizar').classList.add('girando'); if (manual) $('actEstado').textContent = 'buscando…';
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const v = await r.json();
    UPD.web = v.version && VERSION !== 'dev' && v.version !== VERSION ? v.version : null;
    UPD.apk = null;
    const N = nativo();
    if (N && v.apk) { try { const i = await N.info(); if (i.version && cmpVer(i.version, v.apk) < 0) UPD.apk = v.apk; } catch (e) {} }
    mostrarEstadoAct(manual);
    // sin dibujo abierto: se aplica sola, sin preguntar
    let ya = ''; try { ya = sessionStorage.getItem('oxen-auto') || ''; } catch (e) {}
    if (UPD.web && !UPD.apk && !doc && ya !== UPD.web) { try { sessionStorage.setItem('oxen-auto', UPD.web); } catch (e) {} aplicarActualizacion(); }
  } catch (e) { if (manual) { avisar('Sin conexión: inténtalo luego'); $('actEstado').textContent = 'sin conexión'; } }
  finally { UPD.buscando = false; $('btnActualizar').classList.remove('girando'); }
}
function mostrarEstadoAct(manual) {
  const hay = UPD.web || UPD.apk;
  $('actEstado').textContent = hay ? 'nueva versión ' + (UPD.apk || UPD.web).split('-')[0] : 'al día';
  $('bAct').classList.toggle('oculto', !hay);
  $('mActualizar').lastChild.textContent = hay ? 'Actualizar ahora' : 'Buscar actualizaciones';
  $('galAct').classList.toggle('oculto', !hay);
  $('galActTxt').textContent = UPD.apk ? '✨ Hay una versión nueva de OXEN PRO (' + UPD.apk + ')' : '✨ Hay mejoras nuevas para OXEN PRO';
  if (manual && !hay) avisar('OXEN PRO está al día ✓');
}
async function aplicarActualizacion() {
  if (UPD.apk) return actualizarApk();
  avisar('Actualizando OXEN PRO…');
  try { if (doc) { if (trazo) cancelarTrazo(); await guardar(); } } catch (e) {}
  try { const reg = await navigator.serviceWorker?.getRegistration(); await reg?.update(); } catch (e) {}
  try { sessionStorage.setItem('oxen-reabrir', doc ? doc.id : ''); } catch (e) {}
  location.reload();
}
async function actualizarApk() {
  const N = nativo(); if (!N) return;
  try { if (doc) await guardar(); } catch (e) {}
  let h = null;
  try { h = await N.addListener('updProgress', d => avisar('Descargando actualización… ' + d.p + '%')); } catch (e) {}
  try {
    avisar('Descargando actualización…');
    const r = await N.installUpdate({ url: 'https://github.com/riuk1126/oxenpro/releases/latest/download/OXEN-PRO.apk' });
    if (r.status === 'permission') avisar('Permite «instalar apps» para OXEN PRO y vuelve a tocar Actualizar');
  } catch (e) { avisar('No se pudo descargar la actualización'); }
  finally { try { h && h.remove(); } catch (e) {} }
}
$('btnActualizar').onclick = () => buscarActualizacion(true);
$('mActualizar').onclick = () => { if (UPD.web || UPD.apk) { cerrarPaneles(); aplicarActualizacion(); } else buscarActualizacion(true); };
$('bAct').onclick = () => aplicarActualizacion();
$('galActBtn').onclick = () => aplicarActualizacion();
setInterval(() => buscarActualizacion(false), 20 * 60 * 1000);
addEventListener('visibilitychange', () => { if (!document.hidden) buscarActualizacion(false); });

// =====================================================================
//  INICIO
// =====================================================================
addEventListener('resize', () => { tamSup(); });
tamSup();
cargarImportados(); // pinceles importados guardados en la tableta
$('colorActual').style.background = aj.color;
history.replaceState({ pd: 'galeria' }, '');
mostrarGaleria().then(() => {
  // tras actualizar, vuelve a abrir el boceto en el que estabas
  let re = ''; try { re = sessionStorage.getItem('oxen-reabrir') || ''; sessionStorage.removeItem('oxen-reabrir'); } catch (e) {}
  if (re) { abrirDibujo(re).then(() => avisar('OXEN PRO actualizado ✓')); }
  setTimeout(() => buscarActualizacion(false), 2500);
  let visto = null; try { visto = localStorage.getItem('oxen-tutorial'); } catch (e) {}
  if (!visto && !re) mostrarTutorial();
});
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
