// Flexio — núcleo geométrico: vértices, aristas y caras (con huecos), al estilo de un modelador de superficies.
// Las caras se forman solas cuando las aristas cierran una figura plana. Unidades: metros. Eje Z hacia arriba.
(function (G) {
  'use strict';
  const EPS = 5e-5;          // dos puntos a menos de esto son el mismo (0.05 mm)
  const EPS_PL = 2e-4;       // tolerancia de "está en el plano"
  const EPS_AR = 1e-9;       // área mínima

  // ---------------- vectores ----------------
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: a => Math.hypot(a[0], a[1], a[2]),
    dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]),
    norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
    neg: a => [-a[0], -a[1], -a[2]],
    copia: a => [a[0], a[1], a[2]]
  };

  // Ejes del plano de una cara (u, v) a partir de su normal: alineados con X/Y/Z cuando se puede
  function ejesPlano(n) {
    let u;
    if (Math.abs(n[2]) > 0.9) u = V.norm(V.sub([1, 0, 0], V.mul(n, n[0])));
    else u = V.norm(V.cross([0, 0, 1], n));
    const v = V.cross(n, u);
    return [u, v];
  }

  // Normal de Newell de un polígono (lista de puntos)
  function normalNewell(P) {
    let x = 0, y = 0, z = 0;
    for (let i = 0, n = P.length; i < n; i++) {
      const a = P[i], b = P[(i + 1) % n];
      x += (a[1] - b[1]) * (a[2] + b[2]);
      y += (a[2] - b[2]) * (a[0] + b[0]);
      z += (a[0] - b[0]) * (a[1] + b[1]);
    }
    return [x, y, z];
  }
  function area2D(P) { let s = 0; for (let i = 0, n = P.length; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  function dentro2D(p, P) {
    let c = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const a = P[i], b = P[j];
      if (((a[1] > p[1]) !== (b[1] > p[1])) && (p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0])) c = !c;
    }
    return c;
  }

  // ---------------- triangulación (orejas, con huecos unidos por puentes) ----------------
  // loops: [externo, hueco1, ...] cada uno lista de [x,y]. Devuelve índices sobre la lista concatenada.
  function triangular(loops) {
    const pts = []; const rings = [];
    for (const L of loops) { const idx = []; for (const p of L) { idx.push(pts.length); pts.push(p); } rings.push(idx); }
    if (!rings.length || rings[0].length < 3) return [];
    const ar = r => area2D(r.map(i => pts[i]));
    let outer = rings[0].slice(); if (ar(outer) < 0) outer.reverse();
    if (outer.length === 3 && rings.length === 1) return outer;
    // huecos: horario, ordenados por su x máxima (de derecha a izquierda)
    const holes = rings.slice(1).filter(h => h.length >= 3).map(h => { h = h.slice(); if (ar(h) > 0) h.reverse(); return h; });
    holes.sort((a, b) => Math.max(...b.map(i => pts[i][0])) - Math.max(...a.map(i => pts[i][0])));
    let poly = outer;
    for (const h of holes) poly = unirHueco(poly, h, pts);
    return cortarOrejas(poly, pts);
  }
  function unirHueco(poly, h, pts) {
    // vértice del hueco con x máxima
    let hi = 0; for (let i = 1; i < h.length; i++) if (pts[h[i]][0] > pts[h[hi]][0]) hi = i;
    const M = pts[h[hi]];
    // rayo hacia +x: arista del polígono más cercana
    let best = -1, bx = Infinity;
    for (let i = 0; i < poly.length; i++) {
      const a = pts[poly[i]], b = pts[poly[(i + 1) % poly.length]];
      if ((a[1] - M[1]) * (b[1] - M[1]) > 0) continue;
      if (a[1] === b[1]) { const x = Math.min(a[0], b[0]); if (x >= M[0] && x < bx) { bx = x; best = a[0] < b[0] ? i : (i + 1) % poly.length; } continue; }
      const t = (M[1] - a[1]) / (b[1] - a[1]); const x = a[0] + t * (b[0] - a[0]);
      if (x >= M[0] - 1e-12 && x < bx) { bx = x; best = a[0] > b[0] ? i : (i + 1) % poly.length; }
    }
    if (best < 0) { // sin rayo: el vértice visible más cercano
      let d = Infinity; for (let i = 0; i < poly.length; i++) { const p = pts[poly[i]]; const dd = (p[0] - M[0]) ** 2 + (p[1] - M[1]) ** 2; if (dd < d) { d = dd; best = i; } }
    } else {
      // de los vértices dentro del triángulo M, I, P elegir el de menor ángulo (visibilidad)
      const P = pts[poly[best]], I = [bx, M[1]];
      let mejor = best, ang = Infinity;
      for (let i = 0; i < poly.length; i++) {
        const q = pts[poly[i]];
        if (i === best) continue;
        if (q[0] >= M[0] && enTri(q, M, I, P)) {
          const a = Math.abs(Math.atan2(q[1] - M[1], q[0] - M[0]));
          if (a < ang) { ang = a; mejor = i; }
        }
      }
      best = mejor;
    }
    const hr = h.slice(hi).concat(h.slice(0, hi));
    return poly.slice(0, best + 1).concat(hr, [hr[0], poly[best]], poly.slice(best + 1));
  }
  function enTri(p, a, b, c) {
    const d1 = (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
    const d2 = (p[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (p[1] - c[1]);
    const d3 = (p[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (p[1] - a[1]);
    const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(neg && pos);
  }
  function cortarOrejas(poly, pts) {
    const out = []; let V2 = poly.slice();
    const cruz = (a, b, c) => (pts[b][0] - pts[a][0]) * (pts[c][1] - pts[a][1]) - (pts[b][1] - pts[a][1]) * (pts[c][0] - pts[a][0]);
    let guard = 0;
    while (V2.length > 3 && guard++ < 100000) {
      let corto = false;
      const n = V2.length;
      for (let i = 0; i < n; i++) {
        const a = V2[(i + n - 1) % n], b = V2[i], c = V2[(i + 1) % n];
        if (cruz(a, b, c) <= 1e-14) continue; // reflejo o degenerado
        let ok = true;
        for (let j = 0; j < n; j++) {
          const q = V2[j];
          if (q === a || q === b || q === c) continue;
          const P = pts[q];
          if ((P[0] === pts[a][0] && P[1] === pts[a][1]) || (P[0] === pts[b][0] && P[1] === pts[b][1]) || (P[0] === pts[c][0] && P[1] === pts[c][1])) continue;
          if (enTri(P, pts[a], pts[b], pts[c])) { ok = false; break; }
        }
        if (!ok) continue;
        out.push(a, b, c); V2.splice(i, 1); corto = true; break;
      }
      if (!corto) { // polígono raro: quitar un vértice degenerado o abanico
        let k = -1;
        for (let i = 0; i < V2.length; i++) { const nn = V2.length; if (Math.abs(cruz(V2[(i + nn - 1) % nn], V2[i], V2[(i + 1) % nn])) <= 1e-14) { k = i; break; } }
        if (k >= 0) { V2.splice(k, 1); continue; }
        for (let i = 1; i < V2.length - 1; i++) out.push(V2[0], V2[i], V2[i + 1]);
        return out;
      }
    }
    if (V2.length === 3 && cruz(V2[0], V2[1], V2[2]) > 1e-14) out.push(V2[0], V2[1], V2[2]);
    return out;
  }

  // ---------------- modelo ----------------
  const H = 1e-4;
  const claveH = (p, g) => Math.round(p[0] / H) + ',' + Math.round(p[1] / H) + ',' + Math.round(p[2] / H) + '|' + g;
  const claveE = (a, b) => a < b ? a + '-' + b : b + '-' + a;

  class Modelo {
    constructor() { this.limpiar(); }
    limpiar() {
      this.v = new Map(); this.e = new Map(); this.f = new Map();
      this.grupos = new Map(); this.cotas = []; this.mats = []; this.sig = 1;
      this.ek = new Map(); this.vh = new Map(); this.ve = new Map(); this.ef = new Map();
      this.cambio = 0; this.sucio = new Set(); this.todoSucio = true;
    }
    id() { return this.sig++; }
    tocar(fid) { this.cambio++; if (fid != null) this.sucio.add(fid); }

    // ----- vértices -----
    _hashAdd(v) { const k = claveH(v.p, v.g); let s = this.vh.get(k); if (!s) this.vh.set(k, s = []); s.push(v.id); v.k = k; }
    _hashDel(v) { const s = this.vh.get(v.k); if (!s) return; const i = s.indexOf(v.id); if (i >= 0) s.splice(i, 1); if (!s.length) this.vh.delete(v.k); }
    buscarVert(p, g) {
      const x = Math.round(p[0] / H), y = Math.round(p[1] / H), z = Math.round(p[2] / H);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        const s = this.vh.get((x + dx) + ',' + (y + dy) + ',' + (z + dz) + '|' + g);
        if (s) for (const id of s) if (V.dist(this.v.get(id).p, p) < EPS) return id;
      }
      return 0;
    }
    crearVert(p, g = 0) { const v = { id: this.id(), p: V.copia(p), g }; this.v.set(v.id, v); this.ve.set(v.id, new Set()); this._hashAdd(v); this.cambio++; return v.id; }
    vert(p, g = 0) { return this.buscarVert(p, g) || this.crearVert(p, g); }
    moverVert(id, p) {
      const v = this.v.get(id); this._hashDel(v); v.p = V.copia(p); this._hashAdd(v);
      for (const e of this.ve.get(id)) for (const f of this.ef.get(e)) this.tocar(f);
      this.cambio++;
    }
    P(id) { return this.v.get(id).p; }
    quitarVertSiSuelto(id) {
      const s = this.ve.get(id); if (!s || s.size) return;
      const v = this.v.get(id); if (!v) return; this._hashDel(v); this.v.delete(id); this.ve.delete(id); this.cambio++;
    }
    vecinos(id) { const r = []; for (const e of this.ve.get(id) || []) { const E = this.e.get(e); r.push(E.a === id ? E.b : E.a); } return r; }

    // ----- aristas -----
    aristaEntre(a, b) { return this.ek.get(claveE(a, b)) || 0; }
    arista(a, b, g = 0, o) {
      if (a === b) return 0;
      const k = claveE(a, b), ex = this.ek.get(k); if (ex) return ex;
      const e = { id: this.id(), a, b, g, s: o && o.s ? 1 : 0, c: (o && o.c) || 0 };
      this.e.set(e.id, e); this.ek.set(k, e.id); this.ve.get(a).add(e.id); this.ve.get(b).add(e.id); this.ef.set(e.id, new Set());
      this.cambio++; this.todoSucio = true;
      return e.id;
    }
    quitarArista(id, conVerts = true) {
      const e = this.e.get(id); if (!e) return;
      for (const f of [...this.ef.get(id)]) this.quitarCara(f);
      this.e.delete(id); this.ek.delete(claveE(e.a, e.b)); this.ve.get(e.a).delete(id); this.ve.get(e.b).delete(id); this.ef.delete(id);
      if (conVerts) { this.quitarVertSiSuelto(e.a); this.quitarVertSiSuelto(e.b); }
      this.cambio++; this.todoSucio = true;
    }
    caraDeArista(id) { return [...(this.ef.get(id) || [])]; }

    // ----- caras -----
    cara(loops, g = 0, o) {
      loops = loops.map(L => L.slice()).filter(L => L.length >= 3);
      if (!loops.length) return 0;
      const f = { id: this.id(), loops, g, mat: (o && o.mat) || 0, matB: (o && o.matB) || 0, sg: (o && o.sg) || 0 };
      this.f.set(f.id, f);
      for (const L of loops) for (let i = 0; i < L.length; i++) {
        const a = L[i], b = L[(i + 1) % L.length];
        let e = this.aristaEntre(a, b); if (!e) e = this.arista(a, b, g, o && o.softBordes ? { s: 1 } : null);
        this.ef.get(e).add(f.id);
      }
      this.calcNormal(f); this.tocar(f.id); this.todoSucio = true;
      return f.id;
    }
    quitarCara(id) {
      const f = this.f.get(id); if (!f) return;
      for (const L of f.loops) for (let i = 0; i < L.length; i++) { const e = this.aristaEntre(L[i], L[(i + 1) % L.length]); if (e) this.ef.get(e).delete(id); }
      this.f.delete(id); this.cambio++; this.todoSucio = true;
    }
    calcNormal(f) {
      const P = f.loops[0].map(i => this.P(i));
      const n = normalNewell(P); const l = V.len(n);
      f.n = l > 1e-14 ? V.mul(n, 1 / l) : [0, 0, 1]; f.d = V.dot(f.n, P[0]); f.tri = null;
      return f.n;
    }
    aristasCara(f) {
      const r = [];
      for (const L of f.loops) for (let i = 0; i < L.length; i++) { const e = this.aristaEntre(L[i], L[(i + 1) % L.length]); if (e) r.push(e); }
      return r;
    }
    vertsCara(f) { const s = new Set(); for (const L of f.loops) for (const v of L) s.add(v); return [...s]; }
    // 2D de una cara en sus ejes propios
    a2D(f, pts) { const [u, v] = ejesPlano(f.n); return pts.map(p => [V.dot(p, u), V.dot(p, v)]); }
    triangulos(f) {
      if (f.tri) return f.tri;
      const L0 = f.loops[0];
      if (f.loops.length === 1 && L0.length === 3) { f.tri = L0.slice(); return f.tri; }
      const flat = [].concat(...f.loops);
      const loops2 = f.loops.map(L => this.a2D(f, L.map(i => this.P(i))));
      const idx = triangular(loops2);
      f.tri = idx.map(i => flat[i]);
      return f.tri;
    }
    areaCara(f) {
      let s = 0;
      f.loops.forEach((L, k) => { const a = Math.abs(area2D(this.a2D(f, L.map(i => this.P(i))))); s += k ? -a : a; });
      return s;
    }
    puntoEnCara(f, p, conBorde) {
      if (Math.abs(V.dot(f.n, p) - f.d) > EPS_PL * 5) return false;
      const [u, v] = ejesPlano(f.n); const q = [V.dot(p, u), V.dot(p, v)];
      const L = f.loops.map(L => L.map(i => { const P = this.P(i); return [V.dot(P, u), V.dot(P, v)]; }));
      if (!dentro2D(q, L[0])) return false;
      for (let k = 1; k < L.length; k++) if (dentro2D(q, L[k])) return false;
      return true;
    }
    centroCara(f) { const vs = f.loops[0]; let c = [0, 0, 0]; for (const i of vs) c = V.add(c, this.P(i)); return V.mul(c, 1 / vs.length); }
    // un punto seguro dentro del polígono (centro de un triángulo)
    puntoInterior(f) {
      const t = this.triangulos(f); if (t.length < 3) return this.centroCara(f);
      let best = null, ba = -1;
      for (let i = 0; i < t.length; i += 3) {
        const a = this.P(t[i]), b = this.P(t[i + 1]), c = this.P(t[i + 2]);
        const ar = V.len(V.cross(V.sub(b, a), V.sub(c, a)));
        if (ar > ba) { ba = ar; best = V.mul(V.add(V.add(a, b), c), 1 / 3); }
      }
      return best;
    }
    coplanares(f1, f2, mismoSentido) {
      const d = V.dot(f1.n, f2.n);
      if (mismoSentido ? d < 1 - 1e-6 : Math.abs(d) < 1 - 1e-6) return false;
      const p = this.P(f2.loops[0][0]);
      return Math.abs(V.dot(f1.n, p) - f1.d) < EPS_PL;
    }
    invertirCara(id) { const f = this.f.get(id); f.loops = f.loops.map(L => L.slice().reverse()); const m = f.mat; f.mat = f.matB; f.matB = m; this.calcNormal(f); this.tocar(id); this.todoSucio = true; }

    // ----- dividir aristas e intersecciones -----
    dividirArista(eid, vid) {
      const e = this.e.get(eid); if (!e || e.a === vid || e.b === vid) return [eid];
      const caras = [...this.ef.get(eid)];
      const { a, b, g, s, c } = e;
      // insertar el vértice en los bucles de las caras
      for (const fid of caras) {
        const f = this.f.get(fid);
        for (const L of f.loops) for (let i = 0; i < L.length; i++) {
          const x = L[i], y = L[(i + 1) % L.length];
          if ((x === a && y === b) || (x === b && y === a)) { L.splice(i + 1, 0, vid); break; }
        }
        f.tri = null;
      }
      this.e.delete(eid); this.ek.delete(claveE(a, b)); this.ve.get(a).delete(eid); this.ve.get(b).delete(eid); this.ef.delete(eid);
      const e1 = this.arista(a, vid, g, { s, c }), e2 = this.arista(vid, b, g, { s, c });
      for (const fid of caras) { this.ef.get(e1).add(fid); this.ef.get(e2).add(fid); this.tocar(fid); }
      this.todoSucio = true;
      return [e1, e2];
    }
    // si p cae en el interior de una arista del grupo g, la divide y devuelve el vértice
    vertEnAristas(p, g) {
      let id = this.buscarVert(p, g); if (id) return id;
      for (const e of this.e.values()) {
        if (e.g !== g) continue;
        const A = this.P(e.a), B = this.P(e.b), d = V.sub(B, A), L2 = V.dot(d, d); if (L2 < 1e-14) continue;
        const t = V.dot(V.sub(p, A), d) / L2; if (t <= 1e-9 || t >= 1 - 1e-9) continue;
        if (V.dist(V.add(A, V.mul(d, t)), p) < EPS) { id = this.crearVert(V.add(A, V.mul(d, t)), g); this.dividirArista(e.id, id); return id; }
      }
      return this.crearVert(p, g);
    }
    // Agrega una línea de pa a pb cortando y dividiendo lo que cruza (mismo grupo). Devuelve aristas creadas.
    linea(pa, pb, g = 0, o) {
      if (V.dist(pa, pb) < EPS) return [];
      const a = this.vertEnAristas(pa, g), b = this.vertEnAristas(pb, g);
      if (a === b) return [];
      const A = this.P(a), B = this.P(b), d = V.sub(B, A), L2 = V.dot(d, d);
      const cortes = [[0, a], [1, b]];
      // vértices existentes sobre el segmento
      for (const v of this.v.values()) {
        if (v.g !== g || v.id === a || v.id === b) continue;
        const t = V.dot(V.sub(v.p, A), d) / L2; if (t <= 1e-9 || t >= 1 - 1e-9) continue;
        if (V.dist(V.add(A, V.mul(d, t)), v.p) < EPS) cortes.push([t, v.id]);
      }
      // aristas que cruzan
      const cruzar = [];
      for (const e of this.e.values()) {
        if (e.g !== g || e.a === a || e.a === b || e.b === a || e.b === b) continue;
        const C = this.P(e.a), D = this.P(e.b);
        const r = segSeg(A, B, C, D); if (!r) continue;
        const [t, u, dd] = r;
        if (dd < EPS && t > 1e-9 && t < 1 - 1e-9 && u > 1e-9 && u < 1 - 1e-9) cruzar.push([e.id, t]);
      }
      for (const [eid, t] of cruzar) {
        if (!this.e.has(eid)) continue;
        const p = V.add(A, V.mul(d, t));
        const nv = this.buscarVert(p, g) || this.crearVert(p, g);
        this.dividirArista(eid, nv); cortes.push([t, nv]);
      }
      cortes.sort((x, y) => x[0] - y[0]);
      const res = [];
      for (let i = 0; i + 1 < cortes.length; i++) {
        if (cortes[i][1] === cortes[i + 1][1]) continue;
        const ex = this.aristaEntre(cortes[i][1], cortes[i + 1][1]);
        const id = ex || this.arista(cortes[i][1], cortes[i + 1][1], g, o);
        if (!ex) res.push(id); else if (o && o.forzar) res.push(id);
      }
      return res;
    }

    // ----- encontrar caras nuevas -----
    // Recorre el plano girando siempre lo más a la izquierda posible: así se encierra la región más pequeña a la izquierda de la arista.
    _recorrer(a, b, n, g) {
      const pa = this.P(a);
      const loop = [a, b]; let u = a, v = b; const visto = new Set(loop);
      for (let paso = 0; paso < 5000; paso++) {
        const pu = this.P(u), pv = this.P(v), din = V.sub(pv, pu);
        let mejor = 0, mt = -Infinity;
        for (const eid of this.ve.get(v)) {
          const E = this.e.get(eid); if (E.g !== g) continue;
          const w = E.a === v ? E.b : E.a; if (w === u) continue;
          const pw = this.P(w);
          if (Math.abs(V.dot(V.sub(pw, pa), n)) > EPS_PL) continue;
          const dout = V.sub(pw, pv);
          const t = Math.atan2(V.dot(V.cross(din, dout), n), V.dot(din, dout));
          if (t > mt) { mt = t; mejor = w; }
        }
        if (!mejor) return null;
        if (mejor === a) {
          // cerrado: comprobar que la vuelta continúa por a→b (si no, no es la región de esta arista)
          const pts = loop.map(i => this.P(i));
          const [ux, vx] = ejesPlano(n);
          const ar = area2D(pts.map(p => [V.dot(p, ux), V.dot(p, vx)]));
          // ejesPlano(n) da u×v = n, así que área positiva = antihorario visto desde n
          if (ar <= EPS_AR) return null;
          return loop;
        }
        if (visto.has(mejor)) return null;
        loop.push(mejor); visto.add(mejor); u = v; v = mejor;
      }
      return null;
    }
    _planosDeArista(eid) {
      const E = this.e.get(eid), A = this.P(E.a), B = this.P(E.b), d = V.sub(B, A);
      const ns = [];
      for (const x of [E.a, E.b]) for (const w of this.vecinos(x)) {
        if (w === E.a || w === E.b) continue;
        if (this.v.get(w).g !== E.g) continue;
        const c = V.cross(d, V.sub(this.P(w), A)); const l = V.len(c);
        if (l < 1e-10 * Math.max(1, V.len(d))) continue;
        const n = V.mul(c, 1 / l);
        if (!ns.some(m => Math.abs(V.dot(m, n)) > 1 - 1e-7)) ns.push(n);
      }
      return ns;
    }
    caraConLoop(loop) {
      const s = new Set(loop);
      for (const fid of this.ef.get(this.aristaEntre(loop[0], loop[1])) || []) {
        const L = this.f.get(fid).loops[0]; if (L.length === loop.length && L.every(x => s.has(x))) return fid;
      }
      return 0;
    }
    // Tras crear aristas: busca y crea las caras que cierran. hacia = hacia dónde mira la cámara (para orientar).
    buscarCaras(aristas, g = 0, hacia) {
      const hechas = new Set(), nuevas = [];
      const borradas = []; // caras divididas: [fid, mat, matB, huecos(bucles), n]
      for (const eid of aristas) {
        if (!this.e.has(eid)) continue;
        const E = this.e.get(eid);
        for (const n of this._planosDeArista(eid)) {
          for (const [x, y] of [[E.a, E.b], [E.b, E.a]]) {
            const L = this._recorrer(x, y, n, g); if (!L) continue;
            const k = L.slice().sort((p, q) => p - q).join(',');
            if (hechas.has(k)) continue; hechas.add(k);
            if (this.caraConLoop(L)) continue;
            const id = this._crearCaraEncontrada(L, n, g, hacia, borradas);
            if (id) nuevas.push(id);
          }
        }
      }
      // repartir los huecos de las caras que se dividieron
      for (const b of borradas) for (const h of b.huecos) {
        const fake = { loops: [h], n: b.n }; fake.d = V.dot(b.n, this.P(h[0]));
        let p = null; try { p = this.puntoInterior(Object.assign(fake, { tri: null })); } catch (e) {}
        if (!p) continue;
        for (const fid of nuevas) {
          const f = this.f.get(fid); if (!f || !this.coplanares(f, b.cara, false)) continue;
          if (this.puntoEnCara(f, p)) { const hl = h.slice(); f.loops.push(hl); this._registrarLoop(f, hl); this.tocar(fid); break; }
        }
      }
      return nuevas;
    }
    _registrarLoop(f, L) {
      for (let i = 0; i < L.length; i++) {
        const a = L[i], b = L[(i + 1) % L.length];
        let e = this.aristaEntre(a, b); if (!e) e = this.arista(a, b, f.g);
        this.ef.get(e).add(f.id);
      }
      f.tri = null; this.todoSucio = true;
    }
    _crearCaraEncontrada(L, n, g, hacia, borradas) {
      // ¿Está dentro de una cara existente del mismo plano?
      const tmp = { loops: [L], n, tri: null }; tmp.d = V.dot(n, this.P(L[0]));
      const pi = this.puntoInterior(tmp);
      const sL = new Set(L);
      let madre = null;
      for (const f of this.f.values()) {
        if (f.g !== g || !this.coplanares(f, tmp, false)) continue;
        if (this.puntoEnCara(f, pi)) { madre = f; break; }
      }
      let mat = 0, matB = 0, sentido = null;
      if (!madre) for (const b of borradas) { // parte de una cara que ya se dividió: hereda su material y su sentido
        if (this.coplanares(b.cara, tmp, false) && this.puntoEnCara(b.cara, pi)) { mat = b.mat; matB = b.matB; sentido = b.n; break; }
      }
      if (madre) {
        const tocaBorde = madre.loops[0].some(v => sL.has(v)) || madre.loops.slice(1).some(h => h.some(v => sL.has(v)));
        mat = madre.mat; matB = madre.matB; sentido = madre.n;
        if (tocaBorde) {
          // la cara se divide: se borra y las partes se crean al recorrer
          borradas.push({ cara: { n: madre.n, d: madre.d, loops: madre.loops }, n: madre.n, mat: madre.mat, matB: madre.matB, huecos: madre.loops.slice(1).filter(h => !h.some(v => sL.has(v))).map(h => h.slice()) });
          this.quitarCara(madre.id);
        } else {
          // queda como hueco de la cara madre
          const h = L.slice(); madre.loops.push(h); this._registrarLoop(madre, h); this.tocar(madre.id);
        }
      }
      let loop = L.slice();
      const fid = this.cara([loop], g, { mat, matB });
      const f = this.f.get(fid);
      // ¿Contiene caras coplanares sueltas? quedan como huecos de esta (anillo)
      for (const o of [...this.f.values()]) {
        if (o.id === fid || o.g !== g || !this.coplanares(f, o, false)) continue;
        if (o.loops[0].some(v => sL.has(v))) continue;
        const q = this.puntoInterior(o);
        if (this.puntoEnCara(f, q)) {
          const yaHueco = [...this.f.values()].some(z => z.id !== fid && z.loops.slice(1).some(h => h.length === o.loops[0].length && h.every(v => o.loops[0].includes(v))) && this.puntoEnCara(f, this.centroCara(z)));
          if (!yaHueco) { const h = o.loops[0].slice(); f.loops.push(h); this._registrarLoop(f, h); }
        }
      }
      this.orientar(f, sentido, hacia);
      return fid;
    }
    // Orientación coherente con las caras vecinas
    orientar(f, sentido, hacia) {
      let invertir = null;
      if (sentido) invertir = V.dot(f.n, sentido) < 0;
      else {
        const L = f.loops[0];
        for (let i = 0; i < L.length && invertir === null; i++) {
          const a = L[i], b = L[(i + 1) % L.length], e = this.aristaEntre(a, b);
          for (const o of this.ef.get(e)) {
            if (o === f.id) continue;
            const O = this.f.get(o); if (this.coplanares(O, f, false)) continue;
            for (const M of O.loops) for (let j = 0; j < M.length; j++) {
              if (M[j] === a && M[(j + 1) % M.length] === b) { invertir = true; break; }
              if (M[j] === b && M[(j + 1) % M.length] === a) { invertir = false; break; }
            }
            if (invertir !== null) break;
          }
        }
        if (invertir === null) {
          if (Math.abs(f.n[2]) > 0.999) invertir = f.n[2] < 0;
          else if (hacia) invertir = V.dot(f.n, hacia) > 0;
          else invertir = false;
        }
      }
      if (invertir) { f.loops = f.loops.map(L => L.slice().reverse()); this.calcNormal(f); }
      this.tocar(f.id);
    }

    // ----- unir caras coplanares (borra la arista que las separa) -----
    unirPorArista(eid, forzar) {
      const caras = this.caraDeArista(eid); if (caras.length !== 2) return false;
      const f1 = this.f.get(caras[0]), f2 = this.f.get(caras[1]);
      if (f1.g !== f2.g || !this.coplanares(f1, f2, true)) return false;
      if (!forzar && (f1.mat !== f2.mat || f1.matB !== f2.matB)) return false;
      const E = this.e.get(eid), a = E.a, b = E.b;
      const pos = (L, x, y) => { for (let i = 0; i < L.length; i++) if (L[i] === x && L[(i + 1) % L.length] === y) return i; return -1; };
      // buscar la arista en los bucles exteriores
      let L1 = f1.loops[0], L2 = f2.loops[0];
      let i1 = pos(L1, a, b), x = a, y = b;
      if (i1 < 0) { i1 = pos(L1, b, a); x = b; y = a; }
      const i2 = pos(L2, y, x);
      if (i1 < 0 || i2 < 0) return false;
      // L1 rotado para empezar en y y terminar en x; L2 rotado para empezar en x y terminar en y
      const r1 = L1.slice(i1 + 1).concat(L1.slice(0, i1 + 1));   // y ... x
      const r2 = L2.slice(i2 + 1).concat(L2.slice(0, i2 + 1));   // x ... y
      let M = r1.concat(r2.slice(1, -1));
      M = this._quitarPicos(M);
      const partes = this._separarLoop(M, f1);
      const huecos = f1.loops.slice(1).concat(f2.loops.slice(1));
      const mat = f1.mat, matB = f1.matB, g = f1.g, sg = f1.sg;
      this.quitarCara(f1.id); this.quitarCara(f2.id);
      if (this.e.has(eid) && !this.ef.get(eid).size) this.quitarArista(eid, false);
      const nf = this.cara([partes[0]].concat(partes.slice(1), huecos), g, { mat, matB, sg });
      this._limpiarAristasLibresEnCara(nf);
      return nf;
    }
    _quitarPicos(M) {
      let cambio = true;
      while (cambio && M.length > 3) {
        cambio = false;
        for (let i = 0; i < M.length; i++) {
          const n = M.length, p = M[(i + n - 1) % n], q = M[(i + 1) % n];
          if (p === q) {
            const e = this.aristaEntre(p, M[i]);
            const quitar = [i, (i + 1) % n].sort((x, y) => y - x);
            for (const k of quitar) M.splice(k, 1);
            if (e && this.ef.get(e) && this.ef.get(e).size === 0) this._aristaHuerfana = (this._aristaHuerfana || []).concat(e);
            cambio = true; break;
          }
        }
      }
      return M;
    }
    // si el bucle pasa dos veces por el mismo vértice, lo separa en exterior + hueco
    _separarLoop(M, f) {
      for (let i = 0; i < M.length; i++) for (let j = i + 1; j < M.length; j++) if (M[i] === M[j]) {
        const A = M.slice(i, j), B = M.slice(j).concat(M.slice(0, i));
        const ar = L => Math.abs(area2D(this.a2D(f, L.map(k => this.P(k)))));
        const [ext, hue] = ar(A) >= ar(B) ? [A, B] : [B, A];
        return this._separarLoop(ext, f).concat([hue]);
      }
      return [M];
    }
    _limpiarAristasLibresEnCara() {
      const l = this._aristaHuerfana || []; this._aristaHuerfana = [];
      for (const e of l) if (this.e.has(e) && !this.ef.get(e).size) this.quitarArista(e);
    }
    // quita un vértice con dos aristas alineadas (sana la línea)
    sanarVert(vid) {
      const es = [...(this.ve.get(vid) || [])]; if (es.length !== 2) return false;
      const E1 = this.e.get(es[0]), E2 = this.e.get(es[1]);
      if (E1.g !== E2.g || E1.s !== E2.s) return false;
      const a = E1.a === vid ? E1.b : E1.a, b = E2.a === vid ? E2.b : E2.a;
      if (a === b || this.aristaEntre(a, b)) return false;
      const P = this.P(vid), A = this.P(a), B = this.P(b);
      const d1 = V.norm(V.sub(P, A)), d2 = V.norm(V.sub(B, P));
      if (V.dot(d1, d2) < 1 - 1e-9) return false;
      const c1 = this.ef.get(es[0]), c2 = this.ef.get(es[1]);
      if (c1.size !== c2.size || [...c1].some(x => !c2.has(x))) return false;
      const caras = [...c1];
      for (const fid of caras) { const f = this.f.get(fid); for (const L of f.loops) { const k = L.indexOf(vid); if (k >= 0) L.splice(k, 1); } f.tri = null; }
      for (const e of es) { const E = this.e.get(e); this.e.delete(e); this.ek.delete(claveE(E.a, E.b)); this.ve.get(E.a).delete(e); this.ve.get(E.b).delete(e); this.ef.delete(e); }
      const ne = this.arista(a, b, E1.g, { s: E1.s, c: E1.c });
      for (const fid of caras) { this.ef.get(ne).add(fid); this.tocar(fid); }
      this.quitarVertSiSuelto(vid);
      return true;
    }

    // ----- borrar (borrador) -----
    borrarArista(eid) {
      if (!this.e.has(eid)) return;
      const caras = this.caraDeArista(eid);
      const E0 = this.e.get(eid);
      if (caras.length === 2 && this.unirPorArista(eid, true)) {
        if (this.e.has(eid)) this.quitarArista(eid, false);
        for (const v of [E0.a, E0.b]) if (this.v.has(v)) { this.sanarVert(v); this.quitarVertSiSuelto(v); }
        return;
      }
      // si la arista es de un hueco, la cara madre pierde ese hueco
      for (const fid of caras) {
        const f = this.f.get(fid), E = this.e.get(eid);
        const kh = f.loops.findIndex((L, k) => k > 0 && L.includes(E.a) && L.includes(E.b));
        if (kh > 0) {
          const L = f.loops[kh];
          for (let i = 0; i < L.length; i++) { const x = this.aristaEntre(L[i], L[(i + 1) % L.length]); if (x) this.ef.get(x).delete(fid); }
          f.loops.splice(kh, 1); f.tri = null; this.tocar(fid); this.todoSucio = true;
        }
      }
      const E = this.e.get(eid); const a = E.a, b = E.b;
      this.quitarArista(eid);
      for (const v of [a, b]) if (this.v.has(v)) this.sanarVert(v);
    }
    borrarCara(fid) { this.quitarCara(fid); }

    // ----- empujar / tirar -----
    // devuelve info para saber qué hará
    tipoEmpuje(fid) {
      const f = this.f.get(fid); if (!f) return null;
      const aristas = this.aristasCara(f);
      let libre = true, perp = true;
      const vecinas = new Set();
      for (const e of aristas) {
        const otras = [...this.ef.get(e)].filter(x => x !== fid);
        if (otras.length) libre = false;
        if (otras.length !== 1) { perp = false; continue; }
        const O = this.f.get(otras[0]); vecinas.add(O.id);
        if (Math.abs(V.dot(O.n, f.n)) > 1e-4) perp = false;
      }
      if (libre) return 'libre';
      if (perp && f.loops.length === 1) {
        // los vértices no deben tocar otra cosa que la cara y sus vecinas
        for (const v of f.loops[0]) for (const e of this.ve.get(v)) {
          const cs = this.ef.get(e);
          if (!cs.size) return 'sacar';
          for (const c of cs) if (c !== fid && !vecinas.has(c)) return 'sacar';
        }
        return 'estirar';
      }
      return 'sacar';
    }
    // o.previa: extrusión rápida para arrastrar (sin unir ni sanar); deja en o lo necesario para moverPrevia()
    empujar(fid, dist, o) {
      const f = this.f.get(fid); if (!f || Math.abs(dist) < EPS) return fid;
      const tipo = this.tipoEmpuje(fid), n = f.n, desp = V.mul(n, dist), g = f.g;
      const previa = !!(o && o.previa);
      if (previa) { o.tipo = tipo; o.n = n.slice(); o.verts = []; }
      if (tipo === 'estirar') {
        if (previa) for (const v of f.loops[0]) o.verts.push([v, this.P(v).slice()]);
        for (const v of f.loops[0]) this.moverVert(v, V.add(this.P(v), desp));
        for (const v of f.loops[0]) for (const e of this.ve.get(v)) for (const c of this.ef.get(e)) this.calcNormal(this.f.get(c));
        return fid;
      }
      const conservarBase = tipo === 'libre';
      const loops = f.loops.map(L => L.slice());
      const mat = f.mat, matB = f.matB;
      const sg = new Map();
      if (!conservarBase) this.quitarCara(fid);
      else if (dist > 0) this.invertirCara(fid);
      // vértices nuevos
      const nuevo = new Map();
      for (const L of loops) for (const v of L) if (!nuevo.has(v)) { nuevo.set(v, this.crearVert(V.add(this.P(v), desp), g)); if (previa) o.verts.push([nuevo.get(v), this.P(v).slice()]); }
      const lados = [];
      const invertirLados = conservarBase && dist < 0;
      for (const L of loops) {
        for (let i = 0; i < L.length; i++) {
          const a = L[i], b = L[(i + 1) % L.length];
          const ea = this.e.get(this.aristaEntre(a, b));
          const curva = ea && ea.c;
          const quad = [a, b, nuevo.get(b), nuevo.get(a)];
          if (invertirLados) quad.reverse();
          const id = this.cara([quad], g, { mat: 0, sg: curva ? curva : 0 });
          lados.push(id);
          // aristas verticales suaves entre segmentos de una misma curva
          if (curva) sg.set(a, curva);
        }
      }
      // suavizar las aristas verticales que unen segmentos de curva
      for (const L of loops) for (let i = 0; i < L.length; i++) {
        const v = L[i], p = L[(i + L.length - 1) % L.length], q = L[(i + 1) % L.length];
        const e1 = this.e.get(this.aristaEntre(p, v)), e2 = this.e.get(this.aristaEntre(v, q));
        if (e1 && e2 && e1.c && e1.c === e2.c) { const ev = this.e.get(this.aristaEntre(v, nuevo.get(v))); if (ev) ev.s = 1; }
      }
      // tapa nueva
      const tapa = loops.map(L => L.map(v => nuevo.get(v)));
      // copiar curvas a la tapa
      for (const L of loops) for (let i = 0; i < L.length; i++) {
        const a = L[i], b = L[(i + 1) % L.length], ea = this.e.get(this.aristaEntre(a, b));
        if (ea && ea.c) { const t = this.arista(nuevo.get(a), nuevo.get(b), g, { c: ea.c }); this.e.get(t).c = ea.c; }
      }
      const tid = this.cara(tapa, g, { mat, matB });
      const T = this.f.get(tid);
      const debeN = conservarBase ? (dist > 0 ? 1 : -1) : 1;
      if (V.dot(T.n, n) * debeN < 0) { T.loops = T.loops.map(L => L.slice().reverse()); this.calcNormal(T); }
      if (previa) { this.todoSucio = true; return tid; }
      // unir lados coplanares con caras vecinas (escalones)
      for (const L of loops) for (let i = 0; i < L.length; i++) {
        const e = this.aristaEntre(L[i], L[(i + 1) % L.length]); if (e) this.unirPorArista(e);
      }
      for (const L of loops) for (const v of L) if (this.v.has(v)) this.sanarVert(v);
      this.todoSucio = true;
      return tid;
    }

    // mueve la extrusión de vista previa a otra distancia (solo vértices: muy rápido)
    moverPrevia(o, dist) {
      const caras = new Set();
      for (const [v, p0] of o.verts) { if (!this.v.has(v)) continue; this.moverVert(v, V.add(p0, V.mul(o.n, dist))); for (const e of this.ve.get(v)) for (const c of this.ef.get(e)) caras.add(c); }
      for (const c of caras) { const f = this.f.get(c); if (f) this.calcNormal(f); }
    }

    // ----- atravesar un sólido (vanos de puertas y ventanas) -----
    puntoEnCaraOBorde(f, p) {
      if (Math.abs(V.dot(f.n, p) - f.d) > EPS_PL * 5) return false;
      if (this.puntoEnCara(f, p)) return true;
      for (const L of f.loops) for (let i = 0; i < L.length; i++) if (distSeg(p, this.P(L[i]), this.P(L[(i + 1) % L.length])) < 2e-4) return true;
      return false;
    }
    // cara paralela que está detrás de fid (el otro lado del muro) y a qué distancia: { cara, dist } o null
    fondoDe(fid) {
      const f = this.f.get(fid); if (!f || f.loops.length !== 1) return null;
      const o = this.puntoInterior(f), d = V.neg(f.n);
      let best = null, bt = Infinity;
      for (const c of this.f.values()) {
        if (c.id === fid || c.g !== f.g) continue;
        const den = V.dot(c.n, d); if (Math.abs(den) < 1e-9) continue;
        const t = (c.d - V.dot(c.n, o)) / den; if (t <= 1e-4 || t >= bt) continue;
        if (this.puntoEnCara(c, V.add(o, V.mul(d, t)))) { bt = t; best = c; }
      }
      if (!best || Math.abs(V.dot(best.n, f.n)) < 1 - 1e-6) return null;
      for (const v of f.loops[0]) if (!this.puntoEnCaraOBorde(best, V.sub(this.P(v), V.mul(f.n, bt)))) return null;
      return { cara: best.id, dist: bt };
    }
    // vértices (del grupo g) sobre el segmento pa→pb, en orden, creando los extremos si faltan
    _cadena(pa, pb, g) {
      const a = this.vertEnAristas(pa, g), b = this.vertEnAristas(pb, g);
      const A = this.P(a), d = V.sub(this.P(b), A), L2 = V.dot(d, d), r = [[0, a], [1, b]];
      if (L2 > 1e-14) for (const v of this.v.values()) {
        if (v.g !== g || v.id === a || v.id === b) continue;
        const t = V.dot(V.sub(v.p, A), d) / L2; if (t <= 1e-9 || t >= 1 - 1e-9) continue;
        if (V.dist(V.add(A, V.mul(d, t)), v.p) < EPS && (this.ve.get(v.id) || { size: 0 }).size) r.push([t, v.id]);
      }
      return r.sort((x, y) => x[0] - y[0]).map(x => x[1]);
    }
    _caraEn(p, n, g) {
      for (const f of this.f.values()) {
        if (f.g !== g || Math.abs(V.dot(f.n, n)) < 1 - 1e-6) continue;
        if (this.puntoEnCara(f, p)) return f;
      }
      return null;
    }
    // ¿todos los vértices del contorno de la cara caen sobre el polígono Q (lista de puntos)?
    _sobreContorno(f, Q) {
      return f.loops[0].every(v => { const p = this.P(v); for (let i = 0; i < Q.length; i++) if (distSeg(p, Q[i], Q[(i + 1) % Q.length]) < 2e-4) return true; return false; });
    }
    // Abre un hueco pasante: lleva la cara hasta la cara del fondo y corta las dos (y lo que pise: piso del muro, extremos).
    perforar(fid, hacia) {
      const f = this.f.get(fid), fo = f && this.fondoDe(fid); if (!fo) return false;
      const g = f.g, n = f.n.slice(), T = fo.dist, mat = f.mat, matB = f.matB;
      const P = f.loops[0].map(v => this.P(v).slice()), Q = P.map(p => V.sub(p, V.mul(n, T)));
      const N = P.length, qi = V.sub(this.puntoInterior(f), V.mul(n, T));
      this.quitarCara(fid);
      // lados del hueco: ¿pisan una cara que ya existe (el piso del muro en una puerta, el extremo del muro)?
      const lados = [];
      for (let i = 0; i < N; i++) {
        const a = P[i], b = P[(i + 1) % N], a2 = Q[i], b2 = Q[(i + 1) % N];
        const c = V.mul(V.add(V.add(a, b), V.add(a2, b2)), 0.25), nq = V.norm(V.cross(V.sub(b, a), V.sub(a2, a)));
        lados.push({ quad: [a, b, b2, a2], c, nq, pisa: !!this._caraEn(c, nq, g) });
      }
      // primero se trazan todos los cortes y después se quitan las regiones (así no se vuelven a formar)
      let es = [];
      for (let i = 0; i < N; i++) es.push(...this.linea(Q[i], Q[(i + 1) % N], g, { forzar: true }));
      this.buscarCaras(es, g, hacia);
      for (const l of lados) if (l.pisa) {
        const [a, b, b2, a2] = l.quad;
        this.buscarCaras([...this.linea(a, a2, g, { forzar: true }), ...this.linea(b, b2, g, { forzar: true })], g, hacia);
      }
      const rf = this._caraEn(qi, n, g);
      if (rf && this._sobreContorno(rf, Q)) this.quitarCara(rf.id);
      for (const l of lados) {
        const [a, b, b2, a2] = l.quad;
        if (l.pisa) { const r = this._caraEn(l.c, l.nq, g); if (r && this._sobreContorno(r, l.quad)) this.quitarCara(r.id); continue; }
        const loop = [...this._cadena(a, b, g), ...this._cadena(b, b2, g).slice(1), ...this._cadena(b2, a2, g).slice(1), ...this._cadena(a2, a, g).slice(1, -1)];
        if (new Set(loop).size !== loop.length || loop.length < 3) continue;
        const ya = this._caraEn(l.c, l.nq, g);
        if (!ya) this.cara([loop], g, { mat, matB }); else { ya.mat = mat; ya.matB = matB; }
      }
      // aristas que quedaron sin caras (umbral de una puerta) y vértices alineados
      const vs = new Set();
      for (let i = 0; i < N; i++) for (const [x, y] of [[P[i], P[(i + 1) % N]], [Q[i], Q[(i + 1) % N]], [P[i], Q[i]]]) for (const v of this._cadena(x, y, g)) vs.add(v);
      for (const v of vs) for (const e of [...(this.ve.get(v) || [])]) { const E = this.e.get(e); if (E && vs.has(E.a) && vs.has(E.b) && !this.ef.get(e).size) this.quitarArista(e, false); }
      for (const v of vs) if (this.v.has(v)) { if (!this.sanarVert(v)) this.quitarVertSiSuelto(v); }
      this.todoSucio = true; this.cambio++;
      return true;
    }

    // ----- equidistancia (offset) del contorno de una cara -----
    equidistancia(fid, dist, hacia) {
      const f = this.f.get(fid); if (!f) return [];
      const P3 = this.puntosEquidistancia(fid, dist); if (!P3) return [];
      const nuevas = [];
      for (let i = 0; i < P3.length; i++) nuevas.push(...this.linea(P3[i], P3[(i + 1) % P3.length], f.g));
      return this.buscarCaras(nuevas, f.g, hacia);
    }
    puntosEquidistancia(fid, dist) {
      const f = this.f.get(fid); if (!f) return null;
      const L = f.loops[0], pts = L.map(i => this.P(i));
      const [u, v] = ejesPlano(f.n);
      const P2 = pts.map(p => [V.dot(p, u), V.dot(p, v)]);
      const ccw = area2D(P2) > 0;
      const n = P2.length, res = [];
      for (let i = 0; i < n; i++) {
        const a = P2[(i + n - 1) % n], b = P2[i], c = P2[(i + 1) % n];
        const d1 = nrm2([b[0] - a[0], b[1] - a[1]]), d2 = nrm2([c[0] - b[0], c[1] - b[1]]);
        // normal interior (izquierda si antihorario)
        const s = ccw ? 1 : -1;
        const n1 = [-d1[1] * s, d1[0] * s], n2 = [-d2[1] * s, d2[0] * s];
        const p1 = [a[0] + n1[0] * dist, a[1] + n1[1] * dist], p2 = [b[0] + n2[0] * dist, b[1] + n2[1] * dist];
        const x = interLineas(p1, d1, p2, d2) || [b[0] + n2[0] * dist, b[1] + n2[1] * dist];
        res.push(x);
      }
      const h = f.d;
      return res.map(q => V.add(V.add(V.mul(u, q[0]), V.mul(v, q[1])), V.mul(f.n, h)));
    }

    // ----- transformar vértices -----
    transformar(vids, fn) {
      const caras = new Set();
      for (const v of vids) { this.moverVert(v, fn(this.P(v))); for (const e of this.ve.get(v)) for (const c of this.ef.get(e)) caras.add(c); }
      for (const c of caras) { const f = this.f.get(c); if (f) this.calcNormal(f); }
      this.arreglarNoPlanas([...caras]);
    }
    arreglarNoPlanas(caras) {
      for (const c of caras) {
        const f = this.f.get(c); if (!f) continue;
        const malo = f.loops.some(L => L.some(v => Math.abs(V.dot(f.n, this.P(v)) - f.d) > EPS_PL * 5));
        if (!malo) continue;
        // se dobla en triángulos (como pliegues)
        const tri = this._triangular3D(f);
        const { g, mat, matB } = f;
        this.quitarCara(c);
        for (let i = 0; i < tri.length; i += 3) {
          const id = this.cara([[tri[i], tri[i + 1], tri[i + 2]]], g, { mat, matB });
          if (id) this.calcNormal(this.f.get(id));
        }
      }
    }
    _triangular3D(f) {
      f.tri = null;
      const flat = [].concat(...f.loops);
      const P = flat.map(i => this.P(i));
      let n = normalNewell(f.loops[0].map(i => this.P(i))); n = V.norm(n);
      const [u, v] = ejesPlano(n);
      let k = 0; const loops2 = f.loops.map(L => L.map(() => { const p = P[k++]; return [V.dot(p, u), V.dot(p, v)]; }));
      return triangular(loops2).map(i => flat[i]);
    }

    // ----- copiar entidades -----
    duplicar(caras, aristas, gNuevo) {
      const mapa = new Map();
      const nv = (v) => { if (!mapa.has(v)) { const V0 = this.v.get(v); mapa.set(v, this.crearVert(V0.p, gNuevo != null ? gNuevo : V0.g)); } return mapa.get(v); };
      const fs = [], es = [];
      for (const e of aristas) { const E = this.e.get(e); if (!E) continue; const id = this.arista(nv(E.a), nv(E.b), gNuevo != null ? gNuevo : E.g, { s: E.s, c: E.c }); es.push(id); }
      for (const c of caras) {
        const F = this.f.get(c); if (!F) continue;
        const loops = F.loops.map(L => L.map(nv));
        const id = this.cara(loops, gNuevo != null ? gNuevo : F.g, { mat: F.mat, matB: F.matB, sg: F.sg });
        fs.push(id);
      }
      // copiar suavizado de aristas de las caras
      for (const c of caras) {
        const F = this.f.get(c); if (!F) continue;
        for (const L of F.loops) for (let i = 0; i < L.length; i++) {
          const E = this.e.get(this.aristaEntre(L[i], L[(i + 1) % L.length]));
          const N = this.e.get(this.aristaEntre(mapa.get(L[i]), mapa.get(L[(i + 1) % L.length])));
          if (E && N) { N.s = E.s; N.c = E.c; }
        }
      }
      return { mapa, caras: fs, aristas: es, verts: [...mapa.values()] };
    }

    // ----- grupos -----
    hacerGrupo(caras, aristas, nombre) {
      const gid = this.id();
      this.grupos.set(gid, { id: gid, nombre: nombre || ('Grupo ' + (this.grupos.size + 1)) });
      const todas = new Set(aristas);
      for (const c of caras) { const F = this.f.get(c); if (F) for (const e of this.aristasCara(F)) todas.add(e); }
      const dup = this.duplicar(caras, [...todas], gid);
      // borrar los originales (sin dejar aristas sueltas de lo copiado)
      for (const c of caras) this.quitarCara(c);
      for (const e of todas) if (this.e.has(e) && !this.ef.get(e).size) this.quitarArista(e);
      return gid;
    }
    explotar(gid) {
      const ents = this.entidadesGrupo(gid);
      const caras = ents.caras.slice(), aristas = ents.aristas.slice();
      const dup = this.duplicar(caras, aristas, 0);
      for (const c of caras) this.quitarCara(c);
      for (const e of aristas) if (this.e.has(e)) this.quitarArista(e);
      this.grupos.delete(gid);
      // unir con lo que toque: fusionar vértices iguales
      this.fusionarVertices(dup.verts);
      return dup;
    }
    entidadesGrupo(gid) {
      const caras = [], aristas = [], verts = [];
      for (const f of this.f.values()) if (f.g === gid) caras.push(f.id);
      for (const e of this.e.values()) if (e.g === gid) aristas.push(e.id);
      for (const v of this.v.values()) if (v.g === gid) verts.push(v.id);
      return { caras, aristas, verts };
    }
    fusionarVertices(vids) {
      for (const v of vids) {
        if (!this.v.has(v)) continue;
        const V0 = this.v.get(v);
        const otros = (this.vh.get(V0.k) || []).filter(x => x !== v);
        for (const o of otros) { if (this.v.has(o) && V.dist(this.P(o), V0.p) < EPS) this._reemplazarVert(v, o); break; }
      }
    }
    _reemplazarVert(viejo, nuevo) {
      for (const e of [...this.ve.get(viejo)]) {
        const E = this.e.get(e); const otro = E.a === viejo ? E.b : E.a;
        const caras = [...this.ef.get(e)];
        this.e.delete(e); this.ek.delete(claveE(E.a, E.b)); this.ve.get(E.a).delete(e); this.ve.get(E.b).delete(e); this.ef.delete(e);
        if (otro === nuevo) continue;
        const ne = this.arista(nuevo, otro, E.g, { s: E.s, c: E.c });
        for (const c of caras) this.ef.get(ne).add(c);
      }
      for (const f of this.f.values()) for (const L of f.loops) for (let i = 0; i < L.length; i++) if (L[i] === viejo) { L[i] = nuevo; f.tri = null; this.tocar(f.id); }
      const v = this.v.get(viejo); this._hashDel(v); this.v.delete(viejo); this.ve.delete(viejo);
      this.todoSucio = true;
    }

    // ----- utilidades -----
    caja(filtro) {
      let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity], hay = false;
      for (const v of this.v.values()) {
        if (filtro && !filtro(v)) continue; hay = true;
        for (let k = 0; k < 3; k++) { if (v.p[k] < mn[k]) mn[k] = v.p[k]; if (v.p[k] > mx[k]) mx[k] = v.p[k]; }
      }
      return hay ? [mn, mx] : null;
    }
    serializar() {
      return {
        formato: 'flexio', version: 1, sig: this.sig,
        v: [...this.v.values()].map(v => [v.id, +v.p[0].toFixed(6), +v.p[1].toFixed(6), +v.p[2].toFixed(6), v.g]),
        e: [...this.e.values()].map(e => [e.id, e.a, e.b, e.g, e.s, e.c]),
        f: [...this.f.values()].map(f => [f.id, f.loops, f.g, f.mat, f.matB, f.sg]),
        grupos: [...this.grupos.values()].map(g => [g.id, g.nombre]),
        cotas: this.cotas, mats: this.mats
      };
    }
    cargar(d) {
      this.limpiar();
      for (const [id, x, y, z, g] of d.v) { const v = { id, p: [x, y, z], g: g || 0 }; this.v.set(id, v); this.ve.set(id, new Set()); this._hashAdd(v); }
      for (const [id, a, b, g, s, c] of d.e) {
        if (!this.v.has(a) || !this.v.has(b)) continue;
        const e = { id, a, b, g: g || 0, s: s || 0, c: c || 0 }; this.e.set(id, e); this.ek.set(claveE(a, b), id); this.ve.get(a).add(id); this.ve.get(b).add(id); this.ef.set(id, new Set());
      }
      for (const [id, loops, g, mat, matB, sg] of d.f) {
        const f = { id, loops, g: g || 0, mat: mat || 0, matB: matB || 0, sg: sg || 0 };
        if (loops.some(L => L.some(v => !this.v.has(v)))) continue;
        this.f.set(id, f);
        for (const L of loops) for (let i = 0; i < L.length; i++) {
          let e = this.aristaEntre(L[i], L[(i + 1) % L.length]); if (!e) e = this.arista(L[i], L[(i + 1) % L.length], f.g);
          this.ef.get(e).add(id);
        }
        this.calcNormal(f);
      }
      for (const [id, nombre] of d.grupos || []) this.grupos.set(id, { id, nombre });
      this.cotas = d.cotas || []; this.mats = d.mats || [];
      this.sig = Math.max(d.sig || 1, ...[0].concat([...this.v.keys()], [...this.e.keys()], [...this.f.keys()], [...this.grupos.keys()]).map(x => x + 1));
      this.cambio++; this.todoSucio = true;
    }
    clonarDatos() { return JSON.stringify(this.serializar()); }
  }

  // distancia más corta entre segmentos AB y CD: [t, u, distancia]
  function segSeg(A, B, C, D) {
    const d1 = V.sub(B, A), d2 = V.sub(D, C), r = V.sub(A, C);
    const a = V.dot(d1, d1), e = V.dot(d2, d2), f = V.dot(d2, r);
    if (a < 1e-14 || e < 1e-14) return null;
    const c = V.dot(d1, r), b = V.dot(d1, d2), den = a * e - b * b;
    if (Math.abs(den) < 1e-14 * a * e) return null; // paralelas
    let s = (b * f - c * e) / den; s = Math.max(0, Math.min(1, s));
    let t = (b * s + f) / e;
    if (t < 0) { t = 0; s = Math.max(0, Math.min(1, -c / a)); } else if (t > 1) { t = 1; s = Math.max(0, Math.min(1, (b - c) / a)); }
    const p = V.add(A, V.mul(d1, s)), q = V.add(C, V.mul(d2, t));
    return [s, t, V.dist(p, q)];
  }
  function distSeg(p, a, b) {
    const d = V.sub(b, a), L2 = V.dot(d, d); let t = L2 > 1e-18 ? V.dot(V.sub(p, a), d) / L2 : 0; t = Math.max(0, Math.min(1, t));
    return V.dist(p, V.add(a, V.mul(d, t)));
  }
  const nrm2 = a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
  function interLineas(p, d, q, e) {
    const den = d[0] * e[1] - d[1] * e[0]; if (Math.abs(den) < 1e-12) return null;
    const t = ((q[0] - p[0]) * e[1] - (q[1] - p[1]) * e[0]) / den;
    return [p[0] + d[0] * t, p[1] + d[1] * t];
  }

  G.R3 = G.R3 || {};
  Object.assign(G.R3, { V, Modelo, triangular, ejesPlano, normalNewell, area2D, dentro2D, segSeg, distSeg, EPS, EPS_PL });
})(typeof window !== 'undefined' ? window : globalThis);
