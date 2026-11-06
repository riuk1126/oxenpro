// OXEN PRO — símbolos de arquitectura (dibujados en metros reales, a escala)
// tipo 'abertura': el ancho sale del arrastre (de jamba a jamba)
// tipo 'fijo': tamaño real en metros; el arrastre solo lo gira
// tipo 'papel': tamaño fijo en el papel (mm), como los símbolos eléctricos
'use strict';

const Simbolos = (() => {
  const L = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); };
  const R = (c, x, y, w, h) => { c.strokeRect(x, y, w, h); };
  const C = (c, x, y, r, fill) => { c.beginPath(); c.arc(x, y, r, 0, 6.2832); fill ? c.fill() : c.stroke(); };
  const ACH = (c, x, y, w, h, paso = 0.08) => { // achurado a 45° (elemento cortado: concreto, muro)
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.beginPath();
    for (let d = -h; d < w; d += paso) { c.moveTo(x + d, y + h); c.lineTo(x + d + h, y); } c.stroke(); c.restore(); c.strokeRect(x, y, w, h);
  };
  const PASTO = (c, x0, x1, y = 0, alto = 0.12) => { c.beginPath(); for (let x = x0; x < x1; x += 0.06) { const h = alto * (0.6 + 0.4 * Math.abs(Math.sin(x * 37))); c.moveTo(x, y); c.lineTo(x - 0.02, y - h); c.moveTo(x + 0.02, y); c.lineTo(x + 0.04, y - h * 0.8); } c.stroke(); };
  const COPA = (c, cx, cy, rx, ry, ondas = 9, fase = 0) => { c.beginPath(); for (let k = 0; k <= 60; k++) { const a = k / 60 * 6.2832, rr = 0.88 + 0.12 * Math.sin(a * ondas + fase); c[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr); } c.stroke(); };
  const RR = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); c.stroke(); };

  const lista = [
    // ---------------- Aberturas (planta) ----------------
    { id: 'puerta', nombre: 'Puerta', cat: 'Aberturas', tipo: 'abertura', def: 0.9, draw(c, w) {
      L(c, [[0, 0], [0, -w]]); c.beginPath(); c.arc(0, 0, w, -Math.PI / 2, 0); c.stroke();
      L(c, [[0, 0.08], [0, -0.0]]); L(c, [[w, 0.08], [w, 0]]);
    } },
    { id: 'puerta2', nombre: 'Puerta doble', cat: 'Aberturas', tipo: 'abertura', def: 1.6, draw(c, w) {
      const h = w / 2; L(c, [[0, 0], [0, -h]]); L(c, [[w, 0], [w, -h]]);
      c.beginPath(); c.arc(0, 0, h, -Math.PI / 2, 0); c.stroke(); c.beginPath(); c.arc(w, 0, h, Math.PI, Math.PI * 1.5); c.stroke();
    } },
    { id: 'corrediza', nombre: 'Puerta corrediza', cat: 'Aberturas', tipo: 'abertura', def: 1.5, draw(c, w) {
      R(c, 0, -0.06, w * 0.55, 0.04); R(c, w * 0.45, 0.02, w * 0.55, 0.04);
      L(c, [[w * 0.2, -0.16], [w * 0.4, -0.16]]); L(c, [[w * 0.34, -0.2], [w * 0.4, -0.16], [w * 0.34, -0.12]]);
    } },
    { id: 'ventana', nombre: 'Ventana', cat: 'Aberturas', tipo: 'abertura', def: 1.2, draw(c, w) {
      L(c, [[0, -0.075], [w, -0.075]]); L(c, [[0, 0], [w, 0]]); L(c, [[0, 0.075], [w, 0.075]]);
      L(c, [[0, -0.075], [0, 0.075]]); L(c, [[w, -0.075], [w, 0.075]]);
    } },
    { id: 'vano', nombre: 'Vano libre', cat: 'Aberturas', tipo: 'abertura', def: 1.0, draw(c, w) {
      L(c, [[0, -0.12], [0, 0.12]]); L(c, [[w, -0.12], [w, 0.12]]); c.setLineDash([0.06, 0.05]); L(c, [[0, 0], [w, 0]]); c.setLineDash([]);
    } },
    { id: 'muro', nombre: 'Muro (15 cm)', cat: 'Aberturas', tipo: 'abertura', def: 3.0, draw(c, w) { R(c, 0, -0.075, w, 0.15); } },
    { id: 'muro25', nombre: 'Muro (25 cm)', cat: 'Aberturas', tipo: 'abertura', def: 3.0, draw(c, w) { R(c, 0, -0.125, w, 0.25); } },

    // ---------------- Estructura (planta) ----------------
    // e = el objeto: e.sw × e.sh = sección en metros (columna: lados; viga/placa: ancho × peralte)
    { id: 'columna', nombre: 'Columna', cat: 'Estructura', tipo: 'fijo', estructura: true, w: 0.25, h: 0.25, sw: 0.25, sh: 0.25, draw(c, w, h, t, k, e) {
      const a = e && e.sw || 0.25, b = e && e.sh || 0.25; c.fillRect(-a / 2, -b / 2, a, b); c.strokeRect(-a / 2, -b / 2, a, b);
      if (t) { c.save(); c.font = `600 ${(e && e.pxmm || 6) * 2.4 / k}px sans-serif`; c.textBaseline = 'bottom'; c.fillText(t, a / 2 + 0.05, -b / 2 - 0.03); c.restore(); }
    } },
    { id: 'columnaC', nombre: 'Columna circular', cat: 'Estructura', tipo: 'fijo', estructura: true, circular: true, w: 0.3, h: 0.3, sw: 0.3, sh: 0.3, draw(c, w, h, t, k, e) {
      const d = e && e.sw || 0.3; C(c, 0, 0, d / 2, true);
      if (t) { c.save(); c.font = `600 ${(e && e.pxmm || 6) * 2.4 / k}px sans-serif`; c.textBaseline = 'bottom'; c.fillText(t, d / 2 + 0.05, -d / 2); c.restore(); }
    } },
    { id: 'placa', nombre: 'Placa / muro de concreto', cat: 'Estructura', tipo: 'abertura', estructura: true, def: 1.5, sw: 0.25, sh: 0, draw(c, w, h, t, k, e) {
      const b = e && e.sw || 0.25; c.fillRect(0, -b / 2, w, b); c.strokeRect(0, -b / 2, w, b);
    } },
    { id: 'viga', nombre: 'Viga', cat: 'Estructura', tipo: 'abertura', estructura: true, def: 4.0, sw: 0.25, sh: 0.40, draw(c, w, h, t, k, e) {
      // en planta la viga va por encima del corte: dos líneas discontinuas y su rótulo
      const b = e && e.sw || 0.25, s = 1 / k; c.save(); c.setLineDash([7 * s, 4 * s]);
      L(c, [[0, -b / 2], [w, -b / 2]]); L(c, [[0, b / 2], [w, b / 2]]); c.restore();
      if (t) { c.save(); c.font = `600 ${(e && e.pxmm || 6) * 2.4 / k}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'bottom';
        const fl = Math.cos(Math.atan2(c.getTransform().b, c.getTransform().a)) < -0.01; // que el texto no quede de cabeza
        if (fl) { c.translate(w / 2, 0); c.rotate(Math.PI); c.translate(-w / 2, 0); }
        c.fillText(t, w / 2, -b / 2 - 3 * s); c.restore(); }
    } },
    { id: 'zapata', nombre: 'Zapata (cimiento)', cat: 'Estructura', tipo: 'fijo', estructura: true, w: 1.2, h: 1.2, sw: 1.2, sh: 1.2, draw(c, w, h, t, k, e) {
      const a = e && e.sw || 1.2, b = e && e.sh || 1.2, s = 1 / k; c.save(); c.setLineDash([6 * s, 4 * s]); c.strokeRect(-a / 2, -b / 2, a, b); c.restore();
      if (t) { c.save(); c.font = `600 ${(e && e.pxmm || 6) * 2.4 / k}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillText(t, 0, b / 2 + 3 * s); c.restore(); }
    } },
    // ---------------- Mobiliario (planta) ----------------
    { id: 'cama2', nombre: 'Cama 2 plazas', cat: 'Mobiliario', tipo: 'fijo', w: 1.5, h: 1.9, draw(c, w, h) {
      RR(c, -w / 2, -h / 2, w, h, 0.04); RR(c, -w / 2 + 0.08, -h / 2 + 0.08, w / 2 - 0.12, 0.38, 0.06); RR(c, 0.04, -h / 2 + 0.08, w / 2 - 0.12, 0.38, 0.06);
      L(c, [[-w / 2, -h / 2 + 0.6], [w / 2, -h / 2 + 0.6]]); L(c, [[-w / 2, -h / 2 + 0.6], [w / 2 - 0.3, -h / 2 + 0.9]]);
    } },
    { id: 'cama1', nombre: 'Cama 1½ plaza', cat: 'Mobiliario', tipo: 'fijo', w: 1.05, h: 1.9, draw(c, w, h) {
      RR(c, -w / 2, -h / 2, w, h, 0.04); RR(c, -w / 2 + 0.12, -h / 2 + 0.08, w - 0.24, 0.38, 0.06); L(c, [[-w / 2, -h / 2 + 0.6], [w / 2, -h / 2 + 0.6]]);
    } },
    { id: 'sofa', nombre: 'Sofá 3 cuerpos', cat: 'Mobiliario', tipo: 'fijo', w: 2.0, h: 0.85, draw(c, w, h) {
      RR(c, -w / 2, -h / 2, w, h, 0.08); R(c, -w / 2 + 0.18, -h / 2 + 0.2, w - 0.36, h - 0.2);
      for (let k = 1; k < 3; k++) L(c, [[-w / 2 + 0.18 + k * (w - 0.36) / 3, -h / 2 + 0.2], [-w / 2 + 0.18 + k * (w - 0.36) / 3, h / 2]]);
    } },
    { id: 'sillon', nombre: 'Sillón', cat: 'Mobiliario', tipo: 'fijo', w: 0.85, h: 0.85, draw(c, w, h) { RR(c, -w / 2, -h / 2, w, h, 0.08); R(c, -w / 2 + 0.16, -h / 2 + 0.2, w - 0.32, h - 0.2); } },
    { id: 'comedor', nombre: 'Comedor 4 sillas', cat: 'Mobiliario', tipo: 'fijo', w: 1.2, h: 0.8, draw(c, w, h) {
      R(c, -w / 2, -h / 2, w, h);
      for (const x of [-0.3, 0.3]) for (const s of [-1, 1]) RR(c, x - 0.21, s > 0 ? h / 2 + 0.06 : -h / 2 - 0.48, 0.42, 0.42, 0.05);
    } },
    { id: 'redonda', nombre: 'Mesa redonda', cat: 'Mobiliario', tipo: 'fijo', w: 1.0, h: 1.0, draw(c, w) {
      C(c, 0, 0, w / 2); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; c.save(); c.translate(Math.cos(a) * 0.72, Math.sin(a) * 0.72); c.rotate(a); RR(c, -0.2, -0.2, 0.4, 0.4, 0.05); c.restore(); }
    } },
    { id: 'escritorio', nombre: 'Escritorio', cat: 'Mobiliario', tipo: 'fijo', w: 1.2, h: 0.6, draw(c, w, h) { R(c, -w / 2, -h / 2, w, h); C(c, 0, h / 2 + 0.3, 0.24); } },
    { id: 'ropero', nombre: 'Ropero', cat: 'Mobiliario', tipo: 'fijo', w: 1.8, h: 0.6, draw(c, w, h) {
      R(c, -w / 2, -h / 2, w, h); L(c, [[-w / 2 + 0.05, 0], [w / 2 - 0.05, 0]]);
      for (let x = -w / 2 + 0.15; x < w / 2; x += 0.12) L(c, [[x, -0.08], [x + 0.04, 0.08]]);
    } },
    { id: 'inodoro', nombre: 'Inodoro', cat: 'Baño y cocina', tipo: 'fijo', w: 0.4, h: 0.7, draw(c, w, h) {
      RR(c, -0.22, -h / 2, 0.44, 0.2, 0.03); c.beginPath(); c.ellipse(0, 0.12, 0.19, 0.25, 0, 0, 6.2832); c.stroke(); c.beginPath(); c.ellipse(0, 0.14, 0.12, 0.17, 0, 0, 6.2832); c.stroke();
    } },
    { id: 'lavatorio', nombre: 'Lavatorio', cat: 'Baño y cocina', tipo: 'fijo', w: 0.55, h: 0.45, draw(c, w, h) {
      RR(c, -w / 2, -h / 2, w, h, 0.05); c.beginPath(); c.ellipse(0, 0.03, 0.18, 0.13, 0, 0, 6.2832); c.stroke(); C(c, 0, -h / 2 + 0.07, 0.02, true);
    } },
    { id: 'ducha', nombre: 'Ducha', cat: 'Baño y cocina', tipo: 'fijo', w: 0.9, h: 0.9, draw(c, w, h) { R(c, -w / 2, -h / 2, w, h); L(c, [[-w / 2, -h / 2], [w / 2, h / 2]]); L(c, [[w / 2, -h / 2], [-w / 2, h / 2]]); C(c, 0, 0, 0.04); } },
    { id: 'tina', nombre: 'Tina', cat: 'Baño y cocina', tipo: 'fijo', w: 1.7, h: 0.7, draw(c, w, h) { R(c, -w / 2, -h / 2, w, h); RR(c, -w / 2 + 0.08, -h / 2 + 0.08, w - 0.16, h - 0.16, 0.22); C(c, w / 2 - 0.25, 0, 0.03); } },
    { id: 'cocina', nombre: 'Cocina 4 hornillas', cat: 'Baño y cocina', tipo: 'fijo', w: 0.6, h: 0.6, draw(c, w, h) { R(c, -w / 2, -h / 2, w, h); for (const x of [-0.14, 0.14]) for (const y of [-0.14, 0.14]) C(c, x, y, 0.09); } },
    { id: 'lavadero', nombre: 'Lavadero', cat: 'Baño y cocina', tipo: 'fijo', w: 1.0, h: 0.55, draw(c, w, h) { R(c, -w / 2, -h / 2, w, h); RR(c, -w / 2 + 0.08, -h / 2 + 0.08, 0.45, h - 0.16, 0.04); C(c, -w / 2 + 0.3, -h / 2 + 0.06, 0.02, true); } },
    { id: 'refri', nombre: 'Refrigeradora', cat: 'Baño y cocina', tipo: 'fijo', w: 0.7, h: 0.7, draw(c, w, h) { R(c, -w / 2, -h / 2, w, h); L(c, [[-w / 2, -h / 2], [w / 2, h / 2]]); c.font = '0.18px sans-serif'; c.textAlign = 'center'; } },
    { id: 'escalera', nombre: 'Escalera (tramo)', cat: 'Circulación', tipo: 'fijo', w: 1.0, h: 3.0, draw(c, w, h) {
      R(c, -w / 2, -h / 2, w, h); for (let y = -h / 2 + 0.25; y < h / 2; y += 0.25) L(c, [[-w / 2, y], [w / 2, y]]);
      L(c, [[0, h / 2 - 0.15], [0, -h / 2 + 0.3]]); L(c, [[-0.12, -h / 2 + 0.48], [0, -h / 2 + 0.3], [0.12, -h / 2 + 0.48]]); C(c, 0, h / 2 - 0.15, 0.04);
    } },
    { id: 'auto', nombre: 'Auto (planta)', cat: 'Circulación', tipo: 'fijo', w: 1.8, h: 4.5, draw(c, w, h) {
      RR(c, -w / 2, -h / 2, w, h, 0.4); RR(c, -w / 2 + 0.18, -h / 2 + 1.1, w - 0.36, 1.0, 0.15); RR(c, -w / 2 + 0.2, h / 2 - 1.6, w - 0.4, 0.8, 0.15);
    } },
    { id: 'arbolp', nombre: 'Árbol (planta)', cat: 'Vegetación', tipo: 'fijo', w: 3.0, h: 3.0, draw(c, w) {
      const r = w / 2, n = 11; c.beginPath();
      for (let k = 0; k < n; k++) { const a0 = k / n * 6.2832, a1 = (k + 1) / n * 6.2832, am = (a0 + a1) / 2, rr = r * 0.86;
        const x0 = Math.cos(a0) * rr, y0 = Math.sin(a0) * rr, x1 = Math.cos(a1) * rr, y1 = Math.sin(a1) * rr, cx = Math.cos(am) * r * 1.12, cy = Math.sin(am) * r * 1.12;
        k ? 0 : c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); }
      c.closePath(); c.stroke(); C(c, 0, 0, 0.12); L(c, [[-0.3, 0], [0.3, 0]]); L(c, [[0, -0.3], [0, 0.3]]);
    } },
    { id: 'arbusto', nombre: 'Arbusto (planta)', cat: 'Vegetación', tipo: 'fijo', w: 1.0, h: 1.0, draw(c, w) {
      const r = w / 2; c.beginPath(); for (let k = 0; k <= 40; k++) { const a = k / 40 * 6.2832, rr = r * (0.85 + 0.15 * Math.sin(a * 7)); c[k ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); } c.stroke();
    } },
    // ---------------- Elevación ----------------
    { id: 'persona', nombre: 'Persona (1.70 m)', cat: 'Corte · Personas y vegetación', tipo: 'fijo', base: true, w: 0.5, h: 1.7, draw(c) {
      C(c, 0, -1.58, 0.11); L(c, [[0, -1.46], [0, -0.85]]); L(c, [[-0.22, -1.32], [0, -1.4], [0.22, -1.32]]);
      L(c, [[-0.22, -1.32], [-0.26, -0.86]]); L(c, [[0.22, -1.32], [0.26, -0.86]]); L(c, [[-0.13, 0], [-0.1, -0.85], [0.1, -0.85], [0.13, 0]]);
    } },
    { id: 'persona2', nombre: 'Persona caminando', cat: 'Corte · Personas y vegetación', tipo: 'fijo', base: true, w: 0.6, h: 1.7, draw(c) {
      C(c, 0.02, -1.58, 0.11); L(c, [[0, -1.46], [-0.02, -0.88]]); L(c, [[-0.02, -0.88], [-0.26, 0]]); L(c, [[-0.02, -0.88], [0.2, -0.45], [0.18, 0]]);
      L(c, [[0, -1.36], [-0.24, -1.0]]); L(c, [[0, -1.36], [0.2, -1.05], [0.28, -0.9]]);
    } },
    { id: 'arbole', nombre: 'Árbol (elevación)', cat: 'Corte · Personas y vegetación', tipo: 'fijo', base: true, w: 3.5, h: 5.0, draw(c, w, h) {
      L(c, [[-0.1, 0], [-0.07, -2.0]]); L(c, [[0.1, 0], [0.07, -2.0]]);
      c.beginPath(); const cx = 0, cy = -3.3, r = 1.7; for (let k = 0; k <= 48; k++) { const a = k / 48 * 6.2832, rr = r * (0.9 + 0.1 * Math.sin(a * 9)); c[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.95); } c.stroke();
    } },
    { id: 'arbustoe', nombre: 'Arbusto (elevación)', cat: 'Corte · Personas y vegetación', tipo: 'fijo', base: true, w: 1.2, h: 0.9, draw(c) {
      c.beginPath(); c.moveTo(-0.6, 0); for (let k = 0; k <= 30; k++) { const a = Math.PI + k / 30 * Math.PI, rr = 0.6 * (0.88 + 0.12 * Math.sin(k * 1.7)); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 1.4); } c.lineTo(0.6, 0); c.stroke();
    } },
    { id: 'autoe', nombre: 'Auto (elevación)', cat: 'Corte · Personas y vegetación', tipo: 'fijo', base: true, w: 4.4, h: 1.5, draw(c) {
      c.beginPath(); c.moveTo(-2.2, -0.3); c.lineTo(-2.2, -0.75); c.lineTo(-1.4, -0.85); c.lineTo(-0.8, -1.42); c.lineTo(0.9, -1.42); c.lineTo(1.5, -0.85); c.lineTo(2.2, -0.75); c.lineTo(2.2, -0.3); c.closePath(); c.stroke();
      C(c, -1.35, -0.3, 0.32); C(c, 1.35, -0.3, 0.32); L(c, [[0.05, -1.42], [0.05, -0.85]]);
    } },

    // ---------------- CORTE / ELEVACIÓN (vistos de costado; el punto de inserción es el piso) ----------------
    // Mobiliario
    { id: 'silla_c', nombre: 'Silla (de costado)', cat: 'Corte · Mobiliario', tipo: 'fijo', base: true, w: 0.45, h: 0.9, draw(c) {
      L(c, [[-0.2, 0], [-0.2, -0.45], [0.2, -0.45], [0.2, 0]]); L(c, [[-0.22, -0.45], [0.22, -0.45]]); L(c, [[-0.2, -0.45], [-0.24, -0.9]]); L(c, [[-0.24, -0.9], [-0.14, -0.9]]);
    } },
    { id: 'mesa_c', nombre: 'Mesa de comedor', cat: 'Corte · Mobiliario', tipo: 'fijo', base: true, w: 1.6, h: 0.75, draw(c, w) {
      R(c, -w / 2, -0.75, w, 0.04); L(c, [[-w / 2 + 0.08, -0.71], [-w / 2 + 0.08, 0]]); L(c, [[w / 2 - 0.08, -0.71], [w / 2 - 0.08, 0]]); L(c, [[-w / 2 + 0.08, -0.62], [w / 2 - 0.08, -0.62]]);
    } },
    { id: 'comedor_c', nombre: 'Comedor con sillas', cat: 'Corte · Mobiliario', tipo: 'fijo', base: true, w: 2.4, h: 0.9, draw(c) {
      R(c, -0.8, -0.75, 1.6, 0.04); L(c, [[-0.72, -0.71], [-0.72, 0]]); L(c, [[0.72, -0.71], [0.72, 0]]);
      for (const s of [-1, 1]) { const x = s * 1.0; L(c, [[x - 0.18, 0], [x - 0.18, -0.45], [x + 0.18, -0.45], [x + 0.18, 0]]); L(c, [[x + s * 0.2, -0.45], [x + s * 0.24, -0.9]]); }
    } },
    { id: 'escritorio_c', nombre: 'Escritorio', cat: 'Corte · Mobiliario', tipo: 'fijo', base: true, w: 1.2, h: 0.75, draw(c, w) {
      R(c, -w / 2, -0.75, w, 0.03); R(c, w / 2 - 0.45, -0.72, 0.43, 0.72); L(c, [[w / 2 - 0.45, -0.5], [w / 2 - 0.02, -0.5]]); L(c, [[w / 2 - 0.45, -0.26], [w / 2 - 0.02, -0.26]]); L(c, [[-w / 2 + 0.04, -0.72], [-w / 2 + 0.04, 0]]);
    } },
    { id: 'sofa_c', nombre: 'Sofá', cat: 'Corte · Mobiliario', tipo: 'fijo', base: true, w: 2.0, h: 0.85, draw(c, w) {
      RR(c, -w / 2, -0.62, 0.18, 0.5, 0.05); RR(c, w / 2 - 0.18, -0.62, 0.18, 0.5, 0.05); RR(c, -w / 2 + 0.18, -0.85, w - 0.36, 0.42, 0.06); R(c, -w / 2 + 0.18, -0.43, w - 0.36, 0.31);
      L(c, [[-w / 2 + 0.1, -0.12], [-w / 2 + 0.1, 0]]); L(c, [[w / 2 - 0.1, -0.12], [w / 2 - 0.1, 0]]);
    } },
    { id: 'cama_c', nombre: 'Cama (de costado)', cat: 'Corte · Mobiliario', tipo: 'fijo', base: true, w: 2.0, h: 1.05, draw(c, w) {
      R(c, -w / 2, -1.05, 0.06, 1.05); R(c, -w / 2 + 0.06, -0.5, w - 0.06, 0.22); RR(c, -w / 2 + 0.06, -0.62, w - 0.1, 0.12, 0.04); RR(c, -w / 2 + 0.1, -0.74, 0.5, 0.12, 0.05);
      L(c, [[-w / 2 + 0.1, -0.28], [-w / 2 + 0.1, 0]]); L(c, [[w / 2 - 0.06, -0.28], [w / 2 - 0.06, 0]]);
    } },
    { id: 'ropero_c', nombre: 'Ropero / clóset', cat: 'Corte · Mobiliario', tipo: 'fijo', base: true, w: 1.2, h: 2.1, draw(c, w, h) {
      R(c, -w / 2, -h, w, h); L(c, [[0, -h], [0, -0.1]]); L(c, [[-w / 2, -0.1], [w / 2, -0.1]]); L(c, [[-w / 2, -h + 0.4], [w / 2, -h + 0.4]]);
      L(c, [[-0.06, -1.15], [-0.06, -0.95]]); L(c, [[0.06, -1.15], [0.06, -0.95]]);
    } },
    { id: 'librero_c', nombre: 'Librero / estante', cat: 'Corte · Mobiliario', tipo: 'fijo', base: true, w: 0.9, h: 1.8, draw(c, w, h) {
      R(c, -w / 2, -h, w, h); for (let y = -0.4; y > -h; y -= 0.35) L(c, [[-w / 2, y], [w / 2, y]]);
      for (let y = -0.4; y > -h + 0.3; y -= 0.35) for (let x = -w / 2 + 0.06; x < w / 2 - 0.1; x += 0.07) L(c, [[x, y], [x, y - 0.24 - (Math.abs(Math.sin(x * 31 + y * 7)) * 0.06)]]);
    } },
    { id: 'tv_c', nombre: 'Mueble de TV', cat: 'Corte · Mobiliario', tipo: 'fijo', base: true, w: 1.6, h: 1.35, draw(c, w) {
      R(c, -w / 2, -0.5, w, 0.45); L(c, [[-w / 2 + 0.05, -0.05], [-w / 2 + 0.05, 0]]); L(c, [[w / 2 - 0.05, -0.05], [w / 2 - 0.05, 0]]); L(c, [[0, -0.5], [0, -0.05]]);
      RR(c, -0.62, -1.35, 1.24, 0.72, 0.02); L(c, [[0, -0.63], [0, -0.5]]);
    } },
    { id: 'velador_c', nombre: 'Velador con lámpara', cat: 'Corte · Mobiliario', tipo: 'fijo', base: true, w: 0.5, h: 1.0, draw(c) {
      R(c, -0.25, -0.55, 0.5, 0.5); L(c, [[-0.25, -0.3], [0.25, -0.3]]); L(c, [[0, -0.55], [0, -0.78]]); c.beginPath(); c.moveTo(-0.15, -0.78); c.lineTo(0.15, -0.78); c.lineTo(0.1, -1.0); c.lineTo(-0.1, -1.0); c.closePath(); c.stroke();
    } },
    // Baño y cocina
    { id: 'inodoro_c', nombre: 'Inodoro (de costado)', cat: 'Corte · Baño y cocina', tipo: 'fijo', base: true, w: 0.7, h: 0.8, draw(c) {
      R(c, -0.35, -0.8, 0.2, 0.42); c.beginPath(); c.moveTo(-0.15, -0.42); c.lineTo(0.33, -0.42); c.quadraticCurveTo(0.33, -0.2, 0.1, -0.18); c.lineTo(0.06, 0); c.lineTo(-0.15, 0); c.closePath(); c.stroke();
      L(c, [[-0.15, -0.45], [0.35, -0.45]]);
    } },
    { id: 'lavatorio_c', nombre: 'Lavatorio con espejo', cat: 'Corte · Baño y cocina', tipo: 'fijo', base: true, w: 0.6, h: 1.9, draw(c) {
      c.beginPath(); c.moveTo(-0.3, -0.85); c.lineTo(0.3, -0.85); c.quadraticCurveTo(0.28, -0.7, 0.05, -0.68); c.lineTo(-0.05, -0.68); c.quadraticCurveTo(-0.28, -0.7, -0.3, -0.85); c.stroke();
      L(c, [[0, -0.68], [0, 0]]); L(c, [[0, -0.85], [0, -0.98], [0.1, -0.98]]); R(c, -0.25, -1.9, 0.5, 0.75);
    } },
    { id: 'ducha_c', nombre: 'Ducha', cat: 'Corte · Baño y cocina', tipo: 'fijo', base: true, w: 0.9, h: 2.2, draw(c, w) {
      R(c, -w / 2, -0.06, w, 0.06); L(c, [[w / 2 - 0.05, -0.06], [w / 2 - 0.05, -2.0], [w / 2 - 0.3, -2.0]]); c.beginPath(); c.moveTo(w / 2 - 0.42, -1.98); c.lineTo(w / 2 - 0.18, -1.98); c.lineTo(w / 2 - 0.22, -1.9); c.lineTo(w / 2 - 0.38, -1.9); c.closePath(); c.stroke();
      c.save(); c.setLineDash([0.03, 0.06]); for (const x of [-0.08, 0, 0.08]) L(c, [[w / 2 - 0.3 + x, -1.88], [w / 2 - 0.3 + x * 3, -1.3]]); c.restore(); L(c, [[w / 2 - 0.05, -1.1], [w / 2 - 0.18, -1.1]]);
    } },
    { id: 'tina_c', nombre: 'Tina', cat: 'Corte · Baño y cocina', tipo: 'fijo', base: true, w: 1.7, h: 0.6, draw(c, w) {
      RR(c, -w / 2, -0.55, w, 0.55, 0.08); L(c, [[-w / 2 + 0.06, -0.5], [w / 2 - 0.06, -0.5]]);
    } },
    { id: 'cocina_c', nombre: 'Mueble de cocina (bajo y alto)', cat: 'Corte · Baño y cocina', tipo: 'fijo', base: true, w: 2.4, h: 2.2, draw(c, w) {
      R(c, -w / 2, -0.9, w, 0.04); R(c, -w / 2 + 0.02, -0.86, w - 0.04, 0.76); R(c, -w / 2 + 0.02, -0.1, w - 0.04, 0.1);
      for (let x = -w / 2 + 0.6; x < w / 2; x += 0.6) L(c, [[x, -0.86], [x, -0.1]]);
      R(c, -w / 2, -2.2, w, 0.7); for (let x = -w / 2 + 0.6; x < w / 2; x += 0.6) L(c, [[x, -2.2], [x, -1.5]]);
      c.beginPath(); c.moveTo(-0.3, -1.5); c.lineTo(-0.2, -1.62); c.lineTo(0.2, -1.62); c.lineTo(0.3, -1.5); c.stroke(); // campana
      L(c, [[-0.25, -0.93], [0.25, -0.93]]); C(c, -0.12, -0.94, 0.02); C(c, 0.12, -0.94, 0.02);
    } },
    { id: 'refri_c', nombre: 'Refrigeradora', cat: 'Corte · Baño y cocina', tipo: 'fijo', base: true, w: 0.7, h: 1.75, draw(c, w, h) {
      RR(c, -w / 2, -h, w, h - 0.03, 0.04); L(c, [[-w / 2, -1.15], [w / 2, -1.15]]); L(c, [[w / 2 - 0.08, -1.05], [w / 2 - 0.08, -0.7]]); L(c, [[w / 2 - 0.08, -1.55], [w / 2 - 0.08, -1.3]]);
    } },
    { id: 'lavadora_c', nombre: 'Lavadora', cat: 'Corte · Baño y cocina', tipo: 'fijo', base: true, w: 0.6, h: 0.85, draw(c, w, h) {
      RR(c, -w / 2, -h, w, h, 0.03); L(c, [[-w / 2, -0.7], [w / 2, -0.7]]); C(c, 0, -0.36, 0.2); C(c, 0, -0.36, 0.14);
    } },
    // Estructura y construcción en corte
    { id: 'losa_c', nombre: 'Losa aligerada (corte)', cat: 'Corte · Estructura', tipo: 'abertura', def: 4.0, draw(c, w) {
      // arrastra por la parte de arriba de la losa: 0.20 m con viguetas y ladrillo de techo
      c.strokeRect(0, 0, w, 0.2); L(c, [[0, 0.05], [w, 0.05]]);
      for (let x = 0.1; x < w; x += 0.4) { ACH(c, x, 0.05, 0.1, 0.15, 0.04); c.strokeRect(x + 0.13, 0.08, 0.24, 0.11); }
    } },
    { id: 'losamaciza_c', nombre: 'Losa maciza (corte)', cat: 'Corte · Estructura', tipo: 'abertura', def: 4.0, draw(c, w) { ACH(c, 0, 0, w, 0.15, 0.08); } },
    { id: 'viga_c', nombre: 'Viga cortada', cat: 'Corte · Estructura', tipo: 'fijo', w: 0.25, h: 0.5, draw(c, w, h) { ACH(c, -w / 2, -h / 2, w, h, 0.06); } },
    { id: 'muro_c', nombre: 'Muro / columna cortada', cat: 'Corte · Estructura', tipo: 'fijo', base: true, w: 0.25, h: 2.6, draw(c, w, h) { ACH(c, -w / 2, -h, w, h, 0.1); } },
    { id: 'cimiento_c', nombre: 'Cimiento y sobrecimiento', cat: 'Corte · Estructura', tipo: 'fijo', base: true, w: 0.7, h: 0.4, draw(c) {
      // el punto es el nivel de piso: sobrecimiento 0.15 × 0.50 y cimiento 0.60 × 0.80 (bajo tierra)
      ACH(c, -0.075, -0.1, 0.15, 0.5, 0.05); c.save(); c.beginPath(); c.rect(-0.3, 0.4, 0.6, 0.8); c.clip(); c.beginPath();
      for (let i = 0; i < 26; i++) { const x = -0.27 + ((i * 37) % 54) / 100, y = 0.45 + ((i * 53) % 70) / 100; c.moveTo(x + 0.03, y); c.arc(x, y, 0.03, 0, 6.2832); } c.stroke(); c.restore(); c.strokeRect(-0.3, 0.4, 0.6, 0.8);
    } },
    { id: 'escalera_c', nombre: 'Escalera en corte', cat: 'Corte · Estructura', tipo: 'abertura', def: 3.0, draw(c, w) {
      // arrastra de donde empieza la escalera hasta donde termina: pasos de 0.25 y contrapasos de 0.175
      const n = Math.max(1, Math.round(w / 0.25)), p = w / n, h = 0.175; c.beginPath(); c.moveTo(0, 0);
      for (let i = 0; i < n; i++) { c.lineTo(i * p, -(i + 1) * h); c.lineTo((i + 1) * p, -(i + 1) * h); } c.stroke();
      const g = 0.15 / Math.cos(Math.atan2(h, p)); L(c, [[0, g * 0.6], [w, -n * h + g]]); L(c, [[0, 0], [0, g * 0.6]]); L(c, [[w, -n * h], [w, -n * h + g]]);
    } },
    { id: 'terreno_c', nombre: 'Terreno natural', cat: 'Corte · Estructura', tipo: 'abertura', def: 5.0, draw(c, w) {
      L(c, [[0, 0], [w, 0]]); c.beginPath(); for (let x = 0.05; x < w; x += 0.18) { c.moveTo(x, 0); c.lineTo(x - 0.12, 0.12); c.moveTo(x + 0.06, 0); c.lineTo(x - 0.02, 0.08); } c.stroke();
    } },
    { id: 'vano_c', nombre: 'Ventana cortada (alféizar 0.90)', cat: 'Corte · Estructura', tipo: 'fijo', base: true, w: 0.15, h: 2.6, draw(c, w, h) {
      ACH(c, -w / 2, -0.9, w, 0.9, 0.06); ACH(c, -w / 2, -h, w, h - 2.1, 0.06); L(c, [[-0.02, -2.1], [-0.02, -0.9]]); L(c, [[0.02, -2.1], [0.02, -0.9]]);
    } },
    { id: 'puerta_e', nombre: 'Puerta (vista)', cat: 'Corte · Estructura', tipo: 'fijo', base: true, w: 0.9, h: 2.1, draw(c, w, h) {
      R(c, -w / 2, -h, w, h); R(c, -w / 2 + 0.05, -h + 0.05, w - 0.1, h - 0.05); L(c, [[w / 2 - 0.15, -1.05], [w / 2 - 0.08, -1.05]]);
    } },
    { id: 'ventana_e', nombre: 'Ventana (vista)', cat: 'Corte · Estructura', tipo: 'fijo', base: true, w: 1.2, h: 2.1, draw(c, w) {
      R(c, -w / 2, -2.1, w, 1.2); R(c, -w / 2 + 0.04, -2.06, w - 0.08, 1.12); L(c, [[0, -2.06], [0, -0.94]]); L(c, [[-w / 2 - 0.05, -0.9], [w / 2 + 0.05, -0.9]]);
      c.save(); c.globalAlpha *= 0.5; L(c, [[-w / 2 + 0.15, -1.3], [-w / 2 + 0.35, -1.6]]); L(c, [[0.15, -1.3], [0.35, -1.6]]); c.restore();
    } },
    { id: 'baranda_c', nombre: 'Baranda (0.90)', cat: 'Corte · Estructura', tipo: 'abertura', def: 2.0, draw(c, w) {
      L(c, [[0, -0.9], [w, -0.9]]); L(c, [[0, -0.85], [w, -0.85]]); for (let x = 0; x <= w + 1e-6; x += 0.12) L(c, [[x, 0], [x, -0.85]]);
    } },
    // Personas y vegetación
    { id: 'sentada_c', nombre: 'Persona sentada', cat: 'Corte · Personas y vegetación', tipo: 'fijo', base: true, w: 0.7, h: 1.3, draw(c) {
      C(c, -0.05, -1.18, 0.11); L(c, [[-0.06, -1.06], [-0.1, -0.5]]); L(c, [[-0.1, -0.5], [0.28, -0.5], [0.3, 0]]); L(c, [[-0.06, -0.95], [0.18, -0.7], [0.3, -0.72]]);
      L(c, [[-0.25, 0], [-0.25, -0.45], [0.15, -0.45]]); L(c, [[-0.25, -0.45], [-0.3, -0.9]]);
    } },
    { id: 'nino_c', nombre: 'Niño (1.10 m)', cat: 'Corte · Personas y vegetación', tipo: 'fijo', base: true, w: 0.4, h: 1.1, draw(c) {
      C(c, 0, -1.0, 0.1); L(c, [[0, -0.9], [0, -0.5]]); L(c, [[-0.16, -0.84], [0, -0.86], [0.16, -0.84]]); L(c, [[-0.16, -0.84], [-0.18, -0.55]]); L(c, [[0.16, -0.84], [0.18, -0.55]]); L(c, [[-0.09, 0], [-0.06, -0.5], [0.06, -0.5], [0.09, 0]]);
    } },
    { id: 'arbol2_c', nombre: 'Árbol frondoso', cat: 'Corte · Personas y vegetación', tipo: 'fijo', base: true, w: 4.5, h: 6.5, draw(c) {
      L(c, [[-0.14, 0], [-0.1, -2.6]]); L(c, [[0.14, 0], [0.1, -2.6]]); L(c, [[0, -2.4], [-0.7, -3.4]]); L(c, [[0, -2.6], [0.8, -3.6]]);
      COPA(c, -0.8, -4.0, 1.4, 1.3, 11); COPA(c, 0.9, -4.2, 1.3, 1.25, 10, 1); COPA(c, 0, -5.2, 1.4, 1.2, 12, 2);
    } },
    { id: 'palmera_c', nombre: 'Palmera', cat: 'Corte · Personas y vegetación', tipo: 'fijo', base: true, w: 3.5, h: 7.0, draw(c) {
      c.beginPath(); c.moveTo(-0.16, 0); c.quadraticCurveTo(-0.05, -3, 0.15, -6.0); c.moveTo(0.16, 0); c.quadraticCurveTo(0.25, -3, 0.35, -6.0); c.stroke();
      for (let y = -0.5; y > -5.8; y -= 0.45) L(c, [[-0.1 + (-y) * 0.04, y], [0.2 + (-y) * 0.03, y - 0.1]]);
      for (const [dx, dy] of [[-1.7, 0.6], [-1.3, -0.4], [-0.5, -1.0], [0.6, -1.0], [1.4, -0.4], [1.8, 0.7]]) { c.beginPath(); c.moveTo(0.25, -6.0); c.quadraticCurveTo(0.25 + dx * 0.5, -6.0 + dy - 0.6, 0.25 + dx, -6.0 + dy); c.stroke(); }
    } },
    { id: 'cipres_c', nombre: 'Ciprés', cat: 'Corte · Personas y vegetación', tipo: 'fijo', base: true, w: 1.4, h: 5.0, draw(c) {
      L(c, [[0, 0], [0, -0.5]]); c.beginPath(); for (let k = 0; k <= 40; k++) { const t = k / 40, y = -0.5 - t * 4.5, r = 0.7 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (0.9 + 0.1 * Math.sin(k * 2.3)); c.lineTo(r, y); } for (let k = 40; k >= 0; k--) { const t = k / 40, y = -0.5 - t * 4.5, r = 0.7 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (0.9 + 0.1 * Math.cos(k * 2.1)); c.lineTo(-r, y); } c.stroke();
    } },
    { id: 'seto_c', nombre: 'Seto / cerco vivo', cat: 'Corte · Personas y vegetación', tipo: 'abertura', def: 2.0, draw(c, w) {
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -0.9); for (let x = 0; x <= w; x += 0.05) c.lineTo(x, -1.0 - 0.06 * Math.abs(Math.sin(x * 23))); c.lineTo(w, 0); c.stroke();
    } },
    { id: 'maceta_c', nombre: 'Maceta con planta', cat: 'Corte · Personas y vegetación', tipo: 'fijo', base: true, w: 0.6, h: 1.2, draw(c) {
      c.beginPath(); c.moveTo(-0.2, -0.4); c.lineTo(0.2, -0.4); c.lineTo(0.15, 0); c.lineTo(-0.15, 0); c.closePath(); c.stroke();
      for (const [a, l] of [[-1.9, 0.75], [-1.5, 0.8], [-1.2, 0.7], [-2.3, 0.6], [-0.9, 0.55]]) { c.beginPath(); c.moveTo(0, -0.4); c.quadraticCurveTo(Math.cos(a) * l * 0.4, -0.4 + Math.sin(a) * l * 0.7, Math.cos(a) * l * 0.55, -0.4 + Math.sin(a) * l); c.stroke(); }
    } },
    { id: 'cesped_c', nombre: 'Césped (línea)', cat: 'Corte · Personas y vegetación', tipo: 'abertura', def: 3.0, draw(c, w) { L(c, [[0, 0], [w, 0]]); PASTO(c, 0.02, w); } },
    { id: 'bici_c', nombre: 'Bicicleta', cat: 'Corte · Personas y vegetación', tipo: 'fijo', base: true, w: 1.7, h: 1.0, draw(c) {
      C(c, -0.55, -0.34, 0.34); C(c, 0.55, -0.34, 0.34); L(c, [[-0.55, -0.34], [-0.1, -0.34], [0.25, -0.8], [-0.3, -0.8], [-0.55, -0.34]]); L(c, [[-0.1, -0.34], [-0.35, -0.9]]); L(c, [[0.25, -0.8], [0.55, -0.34]]); L(c, [[0.25, -0.8], [0.2, -0.95], [0.35, -0.95]]); L(c, [[-0.45, -0.92], [-0.25, -0.92]]);
    } },
    // ---------------- Instalaciones (tamaño fijo en el papel) ----------------
    { id: 'toma', nombre: 'Tomacorriente', cat: 'Instalaciones', tipo: 'papel', mm: 4, draw(c) { C(c, 0, 0, 0.5); L(c, [[-0.5, 0], [0.5, 0]]); L(c, [[-0.18, -0.5], [-0.18, -0.9]]); L(c, [[0.18, -0.5], [0.18, -0.9]]); } },
    { id: 'interruptor', nombre: 'Interruptor', cat: 'Instalaciones', tipo: 'papel', mm: 4, draw(c) { C(c, 0, 0, 0.35, true); L(c, [[0.25, -0.25], [0.9, -0.9]]); L(c, [[0.9, -0.9], [1.15, -0.65]]); } },
    { id: 'luz', nombre: 'Punto de luz', cat: 'Instalaciones', tipo: 'papel', mm: 5, draw(c) { C(c, 0, 0, 0.5); L(c, [[-0.35, -0.35], [0.35, 0.35]]); L(c, [[0.35, -0.35], [-0.35, 0.35]]); } },
    { id: 'braquete', nombre: 'Braquete', cat: 'Instalaciones', tipo: 'papel', mm: 5, draw(c) { c.beginPath(); c.arc(0, 0, 0.5, Math.PI, 0); c.closePath(); c.stroke(); L(c, [[-0.25, -0.25], [0.25, 0]]); } },
    { id: 'tablero', nombre: 'Tablero eléctrico', cat: 'Instalaciones', tipo: 'papel', mm: 6, draw(c) { R(c, -0.6, -0.3, 1.2, 0.6); c.beginPath(); c.moveTo(-0.6, -0.3); c.lineTo(0.6, 0.3); c.lineTo(-0.6, 0.3); c.closePath(); c.fill(); } },
    { id: 'agua', nombre: 'Punto de agua', cat: 'Instalaciones', tipo: 'papel', mm: 4, draw(c) { C(c, 0, 0, 0.5); C(c, 0, 0, 0.2, true); } },
    { id: 'desague', nombre: 'Desagüe / sumidero', cat: 'Instalaciones', tipo: 'papel', mm: 4, draw(c) { C(c, 0, 0, 0.5); L(c, [[-0.5, 0], [0.5, 0]]); L(c, [[0, -0.5], [0, 0.5]]); } },
    { id: 'registro', nombre: 'Registro roscado', cat: 'Instalaciones', tipo: 'papel', mm: 4, draw(c) { R(c, -0.45, -0.45, 0.9, 0.9); C(c, 0, 0, 0.25); } },
    // ---------------- Anotación ----------------
    { id: 'norte', nombre: 'Norte', cat: 'Anotación', tipo: 'papel', mm: 14, draw(c) {
      C(c, 0, 0, 0.42); c.beginPath(); c.moveTo(0, -0.5); c.lineTo(0.16, 0.3); c.lineTo(0, 0.18); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(0, -0.5); c.lineTo(-0.16, 0.3); c.lineTo(0, 0.18); c.closePath(); c.stroke();
      c.save(); c.font = 'bold 0.26px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText('N', 0, -0.52); c.restore();
    } },
    { id: 'nivel', nombre: 'Nivel (NPT)', cat: 'Anotación', tipo: 'papel', mm: 6, texto: 'NPT +0.00', draw(c, w, h, t) {
      c.beginPath(); c.moveTo(0, 0); c.lineTo(-0.35, -0.5); c.lineTo(0.35, -0.5); c.closePath(); c.stroke(); L(c, [[-0.35, -0.5], [3.2, -0.5]]);
      c.save(); c.font = '0.5px sans-serif'; c.textBaseline = 'bottom'; c.fillText(t || 'NPT +0.00', 0.5, -0.6); c.restore();
    } },
    { id: 'corte', nombre: 'Línea de corte', cat: 'Anotación', tipo: 'abertura', def: 6, draw(c, w, h, t, k) {
      const s = 1 / k; c.save(); c.lineWidth *= 2.4; c.setLineDash([14 * s, 4 * s, 3 * s, 4 * s]); L(c, [[0, 0], [w, 0]]); c.restore();
      for (const [x, d] of [[0, 1], [w, -1]]) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, -16 * s); c.lineTo(x + d * 9 * s, -16 * s); c.stroke(); c.beginPath(); c.moveTo(x + d * 9 * s, -19 * s); c.lineTo(x + d * 14 * s, -16 * s); c.lineTo(x + d * 9 * s, -13 * s); c.closePath(); c.fill(); }
      c.save(); c.font = `bold ${14 * s}px sans-serif`; c.textAlign = 'center'; c.fillText(t || 'A', 0, 16 * s); c.fillText(t || 'A', w, 16 * s); c.restore();
    } },
  ];
  const CATS = [...new Set(lista.map(s => s.cat))];
  const de = id => lista.find(s => s.id === id) || lista[0];

  // Dibuja el símbolo: origen en (x,y), girado 'ang'. k = píxeles por metro (o por unidad de papel).
  // w = ancho para aberturas. Devuelve la caja (para deshacer).
  function dibujar(ctx, sim, x, y, ang, k, w, color, lwPx, texto, flip, e) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(k, flip ? -k : k);
    ctx.strokeStyle = ctx.fillStyle = color; ctx.lineWidth = lwPx / k; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    sim.draw(ctx, w != null ? w : sim.w, sim.h, texto, k, e);
    ctx.restore();
  }
  return { lista, CATS, de, dibujar };
})();
