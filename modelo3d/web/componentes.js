// Flexio — biblioteca arquitectónica: ventanas, puertas y vanos paramétricos (se adaptan al muro y lo cortan),
// y componentes propios o importados (inodoros, muebles…) que se guardan en el equipo y se colocan a medida.
(function (G) {
  'use strict';
  const R3 = G.R3, V = R3.V;

  const CATS = [
    { id: 'ventanas', nombre: 'Ventanas', ico: 'ventana', vano: true },
    { id: 'puertas', nombre: 'Puertas', ico: 'puerta', vano: true },
    { id: 'vanos', nombre: 'Vanos', ico: 'vano', vano: true },
    { id: 'bano', nombre: 'Baño', ico: 'bano' },
    { id: 'cocina', nombre: 'Cocina', ico: 'cocina' },
    { id: 'muebles', nombre: 'Muebles', ico: 'mueble' },
    { id: 'otros', nombre: 'Otros', ico: 'cubo' }
  ];
  // Paramétricos de fábrica. w = ancho, h = alto, alf = alféizar (altura desde el piso), en metros.
  const FABRICA = [
    { id: 'f-vcorr', cat: 'ventanas', nombre: 'Ventana corrediza', tipo: 'vcorr', w: 1.2, h: 1.2, alf: 0.9 },
    { id: 'f-vfija', cat: 'ventanas', nombre: 'Ventana fija', tipo: 'vfija', w: 1.0, h: 1.2, alf: 0.9 },
    { id: 'f-valta', cat: 'ventanas', nombre: 'Ventana alta (baño)', tipo: 'vfija', w: 0.6, h: 0.4, alf: 1.8 },
    { id: 'f-mamp', cat: 'ventanas', nombre: 'Mampara corrediza', tipo: 'vcorr', w: 2.0, h: 2.1, alf: 0 },
    { id: 'f-p90', cat: 'puertas', nombre: 'Puerta 0.90', tipo: 'puerta', w: 0.9, h: 2.1, alf: 0 },
    { id: 'f-p80', cat: 'puertas', nombre: 'Puerta 0.80', tipo: 'puerta', w: 0.8, h: 2.1, alf: 0 },
    { id: 'f-p70', cat: 'puertas', nombre: 'Puerta de baño 0.70', tipo: 'puerta', w: 0.7, h: 2.1, alf: 0 },
    { id: 'f-p100', cat: 'puertas', nombre: 'Puerta principal 1.00', tipo: 'puerta', w: 1.0, h: 2.1, alf: 0 },
    { id: 'f-pdob', cat: 'puertas', nombre: 'Puerta doble', tipo: 'puerta2', w: 1.6, h: 2.1, alf: 0 },
    { id: 'f-vano', cat: 'vanos', nombre: 'Vano de paso', tipo: 'vano', w: 0.9, h: 2.1, alf: 0 },
    { id: 'f-vanov', cat: 'vanos', nombre: 'Vano de ventana', tipo: 'vano', w: 1.2, h: 1.2, alf: 0.9 },
    { id: 'f-vanoa', cat: 'vanos', nombre: 'Vano ancho (sala–comedor)', tipo: 'vano', w: 2.4, h: 2.1, alf: 0 }
  ];
  for (const f of FABRICA) { f.fabrica = true; f.vano = true; }

  // ---------------- piezas de los paramétricos ----------------
  // Cajas en el sistema del vano: x a lo ancho (0..w), y hacia dentro del muro (0..T), z hacia arriba (0..h). [x, y, z, sx, sy, sz, material]
  function cajas(tipo, w, h, T) {
    const C = [], MARCO = 3, VIDRIO = 13, MADERA = 22;
    if (tipo === 'vcorr' || tipo === 'vfija') {
      const a = Math.min(0.04, w / 6, h / 6), D = T > 0 ? Math.min(T, 0.07) : 0.07, y0 = (T - D) / 2;
      C.push([0, y0, 0, w, D, a, MARCO], [0, y0, h - a, w, D, a, MARCO], [0, y0, a, a, D, h - 2 * a, MARCO], [w - a, y0, a, a, D, h - 2 * a, MARCO]);
      if (tipo === 'vcorr' && w > 0.5) C.push([w / 2 - a / 2, y0, a, a, D, h - 2 * a, MARCO]);
      C.push([a, T / 2 - 0.003, a, w - 2 * a, 0.006, h - 2 * a, VIDRIO]);
    } else if (tipo === 'puerta' || tipo === 'puerta2') {
      const j = Math.min(0.04, w / 8), D = T > 0 ? T : 0.1, e = 0.04;
      C.push([0, 0, 0, j, D, h, MARCO], [w - j, 0, 0, j, D, h, MARCO], [j, 0, h - j, w - 2 * j, D, j, MARCO]);
      const luz = w - 2 * j, alto = h - j - 0.005;
      if (tipo === 'puerta') {
        C.push([j, 0, 0.005, luz, e, alto, MADERA], [w - j - 0.1, -0.03, 0.98, 0.03, e + 0.06, 0.03, 4]);
      } else {
        const m = luz / 2 - 0.002;
        C.push([j, 0, 0.005, m, e, alto, MADERA], [w - j - m, 0, 0.005, m, e, alto, MADERA]);
        C.push([w / 2 - 0.09, -0.03, 0.98, 0.03, e + 0.06, 0.03, 4], [w / 2 + 0.06, -0.03, 0.98, 0.03, e + 0.06, 0.03, 4]);
      }
    }
    return C.filter(c => c[3] > 1e-4 && c[4] > 1e-4 && c[5] > 1e-4);
  }
  // marco: { O, x, y } — origen y ejes horizontales del componente en el mundo (z siempre hacia arriba)
  const aMundo = (mk, p) => [mk.O[0] + mk.x[0] * p[0] + mk.y[0] * p[1], mk.O[1] + mk.x[1] * p[0] + mk.y[1] * p[1], mk.O[2] + p[2]];
  function ponerCaja(m, g, mk, c) {
    const [x, y, z, sx, sy, sz, mat] = c;
    const q = (i, j, k) => m.vert(aMundo(mk, [x + i * sx, y + j * sy, z + k * sz]), g);
    const v = [q(0, 0, 0), q(1, 0, 0), q(1, 1, 0), q(0, 1, 0), q(0, 0, 1), q(1, 0, 1), q(1, 1, 1), q(0, 1, 1)];
    for (const L of [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [3, 7, 6, 2], [0, 4, 7, 3], [1, 2, 6, 5]]) {
      const loop = L.map(i => v[i]); if (new Set(loop).size < 4) continue;
      m.cara([loop], g, { mat, matB: mat });
    }
  }
  function construirFabrica(m, item, mk, w, h, T) {
    const C = cajas(item.tipo, w, h, T); if (!C.length) return 0;
    const g = m.id(); m.grupos.set(g, { id: g, nombre: item.nombre.replace(/\s*\d[\d.]*$/, '') + ' ' + w.toFixed(2) + '×' + h.toFixed(2) });
    for (const c of C) ponerCaja(m, g, mk, c);
    return g;
  }

  // ---------------- componentes guardados ----------------
  // datos: modelo serializado (un solo cuerpo, con la esquina mínima en el origen). esc: [sx, sy, sz]
  function insertar(m, comp, mk, esc, colorAMat) {
    const d = typeof comp.datos === 'string' ? JSON.parse(comp.datos) : comp.datos;
    const g = m.id(); m.grupos.set(g, { id: g, nombre: comp.nombre });
    const mats = new Map(); for (const x of d.mats || []) mats.set(x.id, x);
    const cache = new Map();
    const mat = id => { if (!id || id < 100) return id || 0; if (!cache.has(id)) { const x = mats.get(id); cache.set(id, x && x.color ? colorAMat(x.color) : 0); } return cache.get(id); };
    const vm = new Map();
    for (const v of d.v) vm.set(v[0], m.crearVert(aMundo(mk, [v[1] * esc[0], v[2] * esc[1], v[3] * esc[2]]), g));
    for (const f of d.f) {
      const loops = f[1].map(L => L.map(v => vm.get(v)));
      if (loops.some(L => L.length < 3 || L.some(v => !v))) continue;
      m.cara(loops, g, { mat: mat(f[3]), matB: mat(f[4]), sg: f[5] ? g : 0 });
    }
    for (const e of d.e) {
      const a = vm.get(e[1]), b = vm.get(e[2]); if (!a || !b) continue;
      const id = m.aristaEntre(a, b) || m.arista(a, b, g);
      const E = m.e.get(id); if (E) { E.s = e[4] || 0; E.c = e[5] ? e[5] + g * 1000 : 0; }
    }
    m.todoSucio = true; m.cambio++;
    return g;
  }
  // Deja el modelo listo para guardar como componente: todo en un cuerpo, apoyado en el origen.
  // Si corta el muro (puertas, ventanas), el lado más largo queda como ancho (eje x).
  function normalizar(mod, vano) {
    const bb = mod.caja(); if (!bb) return null;
    let dx = bb[1][0] - bb[0][0], dy = bb[1][1] - bb[0][1]; const dz = bb[1][2] - bb[0][2];
    const girar = vano && dy > dx * 1.05;
    const d = mod.serializar();
    for (const v of d.v) {
      const x = v[1] - bb[0][0], y = v[2] - bb[0][1];
      if (girar) { v[1] = y; v[2] = dx - x; } else { v[1] = x; v[2] = y; }
      v[3] = v[3] - bb[0][2]; v[4] = 0;
      v[1] = +v[1].toFixed(5); v[2] = +v[2].toFixed(5); v[3] = +v[3].toFixed(5);
    }
    for (const e of d.e) e[3] = 0;
    for (const f of d.f) f[2] = 0;
    d.grupos = []; d.cotas = [];
    if (girar) { const t = dx; dx = dy; dy = t; }
    return { datos: d, dim: [dx, dy, dz] };
  }
  // dibujo pequeño (isométrico, solo líneas) para la lista
  function miniatura(d) {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 132; const x = c.getContext('2d');
      const P = new Map(); let a = Infinity, b = Infinity, A = -Infinity, B = -Infinity;
      for (const v of d.v) { const p = [(v[1] - v[2]) * 0.866, -v[3] - (v[1] + v[2]) * 0.5]; P.set(v[0], p); a = Math.min(a, p[0]); A = Math.max(A, p[0]); b = Math.min(b, p[1]); B = Math.max(B, p[1]); }
      const k = 112 / Math.max(A - a, B - b, 1e-6), ox = (132 - (A - a) * k) / 2, oy = (132 - (B - b) * k) / 2;
      x.strokeStyle = '#2a2c30'; x.lineWidth = 1.1; x.lineJoin = 'round'; x.beginPath();
      const paso = Math.max(1, Math.ceil(d.e.length / 5000)); let n = 0;
      for (let i = 0; i < d.e.length; i += paso) { const e = d.e[i]; if (e[4]) continue; const p = P.get(e[1]), q = P.get(e[2]); if (!p || !q) continue; x.moveTo(ox + (p[0] - a) * k, oy + (p[1] - b) * k); x.lineTo(ox + (q[0] - a) * k, oy + (q[1] - b) * k); n++; }
      x.stroke();
      return n ? c.toDataURL('image/png') : '';
    } catch (e) { return ''; }
  }
  function categoriaPorNombre(n) {
    n = String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (/puerta|door|porta|porton/.test(n)) return 'puertas';
    if (/ventana|window|mampara|vitral|celosia/.test(n)) return 'ventanas';
    if (/inodoro|toilet|wc|retrete|lavatorio|lavamanos|lavabo|sink|ducha|shower|tina|bath|urinario|bidet|bano/.test(n)) return 'bano';
    if (/cocina|kitchen|refri|nevera|lavadero|horno|microondas|campana|estufa|reposter/.test(n)) return 'cocina';
    if (/silla|mesa|sofa|sillon|cama|bed|chair|table|closet|ropero|escritorio|desk|estante|mueble|velador|comoda|tv|banco/.test(n)) return 'muebles';
    return 'otros';
  }

  // ---------------- almacén (IndexedDB aparte: no toca los modelos) ----------------
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((ok, mal) => {
      const r = indexedDB.open('flexio-biblioteca', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('componentes', { keyPath: 'id' });
      r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error);
    });
    return dbp;
  }
  async function tx(modo, fn) { const d = await db(); return new Promise((ok, mal) => { const t = d.transaction('componentes', modo); const r = fn(t.objectStore('componentes')); t.oncomplete = () => ok(r && r.result); t.onerror = () => mal(t.error); }); }
  const Almacen = {
    todos: () => tx('readonly', s => s.getAll()),
    guardar: reg => tx('readwrite', s => s.put(reg)),
    borrar: id => tx('readwrite', s => s.delete(id))
  };
  const nuevoId = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  R3.Comp = { CATS, FABRICA, cajas, construirFabrica, insertar, normalizar, miniatura, categoriaPorNombre, Almacen, nuevoId, aMundo };
})(typeof window !== 'undefined' ? window : globalThis);
