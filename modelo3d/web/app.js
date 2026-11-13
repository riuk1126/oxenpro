// Flexio — aplicación: herramientas, inferencias, gestos (lápiz / dedos / ratón), interfaz y archivos.
(function () {
  'use strict';
  const { V, Modelo, Camara, Visor, MATERIALES, MAT, ejesPlano, texCanvas, Archivos } = R3;
  const $ = id => document.getElementById(id);
  const ES_APP = !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
  const COL = { x: '#d63c3c', y: '#2f9b48', z: '#3157d6', extremo: '#18a84a', medio: '#14a3b8', arista: '#d63c3c', cara: '#2f6bff', paralela: '#c03fd1', eje: '#666', centro: '#18a84a' };

  // ---------------- ajustes ----------------
  const K_AJ = 'r3d-ajustes';
  const AJ = Object.assign({ unidad: 'm', lapiz: 'auto', decimales: 2, ejes: true, aristasSuaves: false }, leerLS(K_AJ) || {});
  function leerLS(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function guardarAjustes() { try { localStorage.setItem(K_AJ, JSON.stringify(AJ)); } catch (e) {} }

  // ---------------- estado ----------------
  const m = new Modelo();
  const cam = new Camara();
  const cvGL = $('gl'), cvOV = $('ov'), ov = cvOV.getContext('2d');
  let vis = null;
  try { vis = new Visor(cvGL); } catch (e) { setTimeout(() => alert('Tu equipo no puede mostrar 3D (WebGL): ' + e.message), 300); }
  const est = { selCaras: new Set(), selAristas: new Set(), selGrupos: new Set(), selCotas: new Set(), contexto: 0, hoverCara: 0 };
  let doc = { id: null, nombre: 'Sin título' };
  let herr = null, nombreHerr = 'seleccionar';
  let construido = -1, estVer = 0, estVerHecho = -1, pedido = false;
  let ultimoInf = null, pantallaW = 1, pantallaH = 1;
  let matActual = 1;
  const pila = [], rehacer = [];
  let modoLapiz = AJ.lapiz === 'siempre';

  function registrarMatsModelo() { for (const mm of m.mats || []) MAT.set(mm.id, mm); }

  // ---------------- unidades ----------------
  function fmt(x) {
    const u = AJ.unidad, s = x < 0 ? '-' : ''; x = Math.abs(x);
    if (u === 'cm') return s + (x * 100).toFixed(1).replace(/\.0$/, '') + ' cm';
    if (u === 'mm') return s + Math.round(x * 1000) + ' mm';
    return s + x.toFixed(AJ.decimales) + ' m';
  }
  function leerMedida(t) {
    t = String(t).trim().toLowerCase().replace(/\s+/g, '');
    const mm = t.match(/^(-?[\d.]+)(mm|cm|m)?$/); if (!mm) return NaN;
    let v = parseFloat(mm[1]); if (isNaN(v)) return NaN;
    const u = mm[2] || AJ.unidad;
    return u === 'mm' ? v / 1000 : u === 'cm' ? v / 100 : v;
  }
  // "3;4"  "3x4"  "3*4"  "3 4"  o "3,4"
  function leerPar(t) {
    t = String(t).trim().replace(/,(?=\d)/g, (t.includes(';') || t.includes('x') || t.includes('*') || /\d\s+\d/.test(t)) ? '.' : ';');
    const p = t.split(/[;x*\s]+/).filter(Boolean);
    return p.map(leerMedida);
  }

  // ---------------- historial ----------------
  function guardarDeshacer(antes) { pila.push(antes); if (pila.length > 60) pila.shift(); rehacer.length = 0; cambio(); }
  function operacion(fn) { const antes = m.clonarDatos(); try { fn(); } catch (e) { console.error(e); m.cargar(JSON.parse(antes)); avisar('No se pudo: ' + e.message); return; } guardarDeshacer(antes); }
  function deshacer() { if (herr && herr.activa && herr.activa()) { herr.cancelar(); return; } if (!pila.length) return avisar('Nada que deshacer'); rehacer.push(m.clonarDatos()); m.cargar(JSON.parse(pila.pop())); registrarMatsModelo(); limpiarSel(); cambio(); avisar('Deshecho'); }
  function rehacerOp() { if (!rehacer.length) return; pila.push(m.clonarDatos()); m.cargar(JSON.parse(rehacer.pop())); registrarMatsModelo(); limpiarSel(); cambio(); avisar('Rehecho'); }
  let tGuardar = 0;
  function cambio() { pedir(); estVer++; clearTimeout(tGuardar); tGuardar = setTimeout(guardar, 1200); pintarBotones(); }

  // ---------------- dibujo ----------------
  function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(cuadro); } }
  function tamano() {
    const r = cvGL.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    pantallaW = r.width || innerWidth; pantallaH = r.height || innerHeight;
    cam.w = pantallaW; cam.h = pantallaH;
    if (vis) vis.tamano(pantallaW, pantallaH, dpr);
    const W = Math.round(pantallaW * dpr), H = Math.round(pantallaH * dpr);
    if (cvOV.width !== W || cvOV.height !== H) { cvOV.width = W; cvOV.height = H; }
    ov.setTransform(dpr, 0, 0, dpr, 0, 0);
    pedir();
  }
  addEventListener('resize', tamano);
  function cuadro() {
    pedido = false;
    if ($('editor').classList.contains('oculto')) return;
    const bb = m.caja(); cam.distRef = bb ? Math.max(5, V.dist(bb[0], bb[1]) + V.dist(cam.eye, V.mul(V.add(bb[0], bb[1]), 0.5))) : 30;
    if (vis) {
      if (construido !== m.cambio || estVerHecho !== estVer || m.todoSucio) {
        const hov = new Set(est.selCaras); if (est.hoverCara) hov.add(est.hoverCara);
        vis.verEjes = AJ.ejes;
        vis.construir(m, { selCaras: hov, selAristas: est.selAristas, selGrupos: est.selGrupos, contexto: est.contexto, verSuaves: AJ.aristasSuaves });
        construido = m.cambio; estVerHecho = estVer; m.todoSucio = false;
      }
      vis.dibujar(cam);
    } else cam.matrices();
    dibujarOverlay();
  }
  function dibujarOverlay() {
    ov.clearRect(0, 0, pantallaW, pantallaH);
    dibujarCotas();
    if (herr && herr.dibujar) herr.dibujar(ov);
    if (cajaSel) { const { x0, y0, x1, y1 } = cajaSel; ov.save(); ov.strokeStyle = '#2f6bff'; ov.fillStyle = '#2f6bff14'; ov.lineWidth = 1; if (x1 < x0) ov.setLineDash([5, 4]); ov.fillRect(x0, y0, x1 - x0, y1 - y0); ov.strokeRect(x0, y0, x1 - x0, y1 - y0); ov.restore(); }
    if (ultimoInf && ultimoInf.marca && herr && herr.muestraInf !== false) marcaInf(ultimoInf);
  }
  const pr = p => cam.proyectar(p);
  function lineaOV(a, b, color, ancho = 1.6, punteado) {
    const A = pr(a), B = pr(b); if (!A || !B) return;
    ov.save(); ov.strokeStyle = color; ov.lineWidth = ancho; if (punteado) ov.setLineDash(punteado); ov.beginPath(); ov.moveTo(A[0], A[1]); ov.lineTo(B[0], B[1]); ov.stroke(); ov.restore();
  }
  function poliOV(P, color, relleno, ancho = 1.6) {
    const S = P.map(pr); if (S.some(s => !s)) return;
    ov.save(); ov.beginPath(); S.forEach((s, i) => i ? ov.lineTo(s[0], s[1]) : ov.moveTo(s[0], s[1])); ov.closePath();
    if (relleno) { ov.fillStyle = relleno; ov.fill(); }
    ov.strokeStyle = color; ov.lineWidth = ancho; ov.stroke(); ov.restore();
  }
  function textoOV(p, t, sx, sy) {
    const S = sx != null ? [sx, sy] : pr(p); if (!S) return;
    ov.save(); ov.font = '600 12px -apple-system,Segoe UI,Roboto,sans-serif';
    const w = ov.measureText(t).width + 12;
    ov.fillStyle = '#18191bdd'; roundRect(S[0] + 12, S[1] + 12, w, 22, 6); ov.fill();
    ov.fillStyle = '#fff'; ov.fillText(t, S[0] + 18, S[1] + 27); ov.restore();
  }
  function roundRect(x, y, w, h, r) { ov.beginPath(); ov.moveTo(x + r, y); ov.arcTo(x + w, y, x + w, y + h, r); ov.arcTo(x + w, y + h, x, y + h, r); ov.arcTo(x, y + h, x, y, r); ov.arcTo(x, y, x + w, y, r); ov.closePath(); }
  function marcaInf(inf) {
    const S = pr(inf.p); if (!S) return;
    ov.save(); ov.lineWidth = 2;
    const c = inf.color || '#333';
    if (inf.tipo === 'extremo') { ov.fillStyle = c; ov.strokeStyle = '#fff'; ov.beginPath(); ov.arc(S[0], S[1], 6, 0, 7); ov.fill(); ov.stroke(); }
    else if (inf.tipo === 'medio') { ov.fillStyle = c; ov.strokeStyle = '#fff'; ov.beginPath(); ov.moveTo(S[0], S[1] - 7); ov.lineTo(S[0] + 6, S[1] + 5); ov.lineTo(S[0] - 6, S[1] + 5); ov.closePath(); ov.fill(); ov.stroke(); }
    else if (inf.tipo === 'arista') { ov.fillStyle = '#fff'; ov.strokeStyle = c; ov.beginPath(); ov.rect(S[0] - 5, S[1] - 5, 10, 10); ov.fill(); ov.stroke(); }
    else if (inf.tipo === 'cara') { ov.strokeStyle = c; ov.beginPath(); ov.moveTo(S[0] - 6, S[1] + 4); ov.lineTo(S[0], S[1] - 6); ov.lineTo(S[0] + 6, S[1] + 4); ov.closePath(); ov.stroke(); }
    else if (inf.tipo === 'centro') { ov.strokeStyle = c; ov.beginPath(); ov.arc(S[0], S[1], 6, 0, 7); ov.moveTo(S[0] - 9, S[1]); ov.lineTo(S[0] + 9, S[1]); ov.moveTo(S[0], S[1] - 9); ov.lineTo(S[0], S[1] + 9); ov.stroke(); }
    else { ov.fillStyle = c; ov.beginPath(); ov.arc(S[0], S[1], 3.5, 0, 7); ov.fill(); }
    ov.restore();
    if (inf.texto) textoOV(null, inf.texto, S[0], S[1]);
  }
  function dibujarCotas() {
    for (let i = 0; i < m.cotas.length; i++) {
      const c = m.cotas[i], sel = est.selCotas.has(i), col = sel ? '#2f6bff' : '#2a2c30';
      const a2 = V.add(c.a, c.o), b2 = V.add(c.b, c.o);
      lineaOV(c.a, V.add(c.a, V.mul(c.o, 1.08)), col, 1); lineaOV(c.b, V.add(c.b, V.mul(c.o, 1.08)), col, 1);
      lineaOV(a2, b2, col, 1.3);
      const A = pr(a2), B = pr(b2); if (!A || !B) continue;
      for (const [P, Q] of [[A, B], [B, A]]) { const d = Math.atan2(Q[1] - P[1], Q[0] - P[0]); ov.save(); ov.fillStyle = col; ov.beginPath(); ov.moveTo(P[0], P[1]); ov.lineTo(P[0] + Math.cos(d + .3) * 9, P[1] + Math.sin(d + .3) * 9); ov.lineTo(P[0] + Math.cos(d - .3) * 9, P[1] + Math.sin(d - .3) * 9); ov.fill(); ov.restore(); }
      const t = fmt(V.dist(c.a, c.b)), mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
      ov.save(); ov.font = '600 12.5px -apple-system,Segoe UI,Roboto,sans-serif'; const w = ov.measureText(t).width + 10;
      ov.fillStyle = '#fff'; ov.fillRect(mx - w / 2, my - 9, w, 18); ov.fillStyle = col; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.fillText(t, mx, my + 1); ov.restore();
      c._s = [mx, my];
    }
  }

  // ---------------- elegir e inferir ----------------
  const visible = g => !est.contexto || true;
  function cacheCara(f) {
    if (f._cv === m.cambio && f._bb) return f;
    let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (const v of f.loops[0]) { const p = m.P(v); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], p[k]); mx[k] = Math.max(mx[k], p[k]); } }
    f._bb = [mn, mx]; f._cv = m.cambio; return f;
  }
  function golpeCara(ray, excluir) {
    let best = null, bt = Infinity;
    for (const f of m.f.values()) {
      if (excluir && excluir.has(f.id)) continue;
      const den = V.dot(f.n, ray.d); if (Math.abs(den) < 1e-9) continue;
      const t = (f.d - V.dot(f.n, ray.o)) / den; if (t <= 1e-6 || t >= bt) continue;
      const p = V.add(ray.o, V.mul(ray.d, t)); cacheCara(f);
      const [mn, mx] = f._bb, e = 1e-4;
      if (p[0] < mn[0] - e || p[1] < mn[1] - e || p[2] < mn[2] - e || p[0] > mx[0] + e || p[1] > mx[1] + e || p[2] > mx[2] + e) continue;
      if (m.puntoEnCara(f, p)) { bt = t; best = { f, p, t, atras: den > 0 }; }
    }
    return best;
  }
  function tolerancia(tipo) { return tipo === 'pen' ? 11 : tipo === 'touch' ? 22 : 9; }
  // punto más cercano de una recta (o, d) a un rayo
  function cercanoRecta(o, d, ray) {
    const w0 = V.sub(o, ray.o), b = V.dot(d, ray.d), dd = V.dot(d, w0), e = V.dot(ray.d, w0), den = 1 - b * b;
    if (Math.abs(den) < 1e-9) return null;
    const s = (b * e - dd) / den; return V.add(o, V.mul(d, s));
  }
  function planoRayo(n, p0, ray) { const den = V.dot(n, ray.d); if (Math.abs(den) < 1e-9) return null; const t = V.dot(n, V.sub(p0, ray.o)) / den; if (t <= 0) return null; return V.add(ray.o, V.mul(ray.d, t)); }
  let aristaReciente = null, tAristaReciente = 0;
  // Inferencia: extremos, puntos medios, aristas, caras, ejes desde un punto, plano de trabajo
  function inferir(sx, sy, tipo, o = {}) {
    const ray = cam.rayo(sx, sy), tol = tolerancia(tipo);
    const golpe = golpeCara(ray, o.excluirCaras);
    const tFace = golpe ? golpe.t : Infinity;
    const vis_ = t => t <= tFace * 1.002 + 0.002;
    let mejor = null, bd = tol;
    const exV = o.excluirVerts;
    // extremos
    for (const v of m.v.values()) {
      if (exV && exV.has(v.id)) continue;
      const S = pr(v.p); if (!S) continue;
      const d = Math.hypot(S[0] - sx, S[1] - sy); if (d >= bd) continue;
      const t = V.dot(V.sub(v.p, ray.o), ray.d); if (!vis_(t)) continue;
      bd = d; mejor = { p: v.p.slice(), tipo: 'extremo', color: COL.extremo, texto: 'Extremo', vert: v.id };
    }
    // puntos medios y aristas
    let enArista = null, bdA = tol;
    if (!mejor || bd > tol * 0.5) for (const e of m.e.values()) {
      if (exV && (exV.has(e.a) || exV.has(e.b))) continue;
      const A = m.P(e.a), B = m.P(e.b);
      const SA = pr(A), SB = pr(B); if (!SA || !SB) continue;
      const mid = V.lerp(A, B, 0.5), SM = [(SA[0] + SB[0]) / 2, (SA[1] + SB[1]) / 2];
      const dm = Math.hypot(SM[0] - sx, SM[1] - sy);
      if (dm < bd && !e.s) { const t = V.dot(V.sub(mid, ray.o), ray.d); if (vis_(t)) { bd = dm; mejor = { p: mid, tipo: 'medio', color: COL.medio, texto: 'Punto medio', arista: e.id }; } }
      const dx = SB[0] - SA[0], dy = SB[1] - SA[1], L2 = dx * dx + dy * dy; if (L2 < 1) continue;
      let u = ((sx - SA[0]) * dx + (sy - SA[1]) * dy) / L2; u = Math.max(0, Math.min(1, u));
      const ds = Math.hypot(SA[0] + u * dx - sx, SA[1] + u * dy - sy); if (ds >= bdA) continue;
      const q = cercanoRecta(A, V.norm(V.sub(B, A)), ray); if (!q) continue;
      const tt = V.dot(V.sub(q, A), V.sub(B, A)) / V.dot(V.sub(B, A), V.sub(B, A)); if (tt < 0 || tt > 1) continue;
      const t = V.dot(V.sub(q, ray.o), ray.d); if (!vis_(t)) continue;
      bdA = ds; enArista = { p: q, tipo: 'arista', color: COL.arista, texto: e.s ? 'En superficie' : 'En arista', arista: e.id };
    }
    if (!mejor && enArista) mejor = enArista;
    if (enArista) { aristaReciente = enArista.arista; tAristaReciente = Date.now(); }
    const fuerte = mejor && (mejor.tipo === 'extremo' || mejor.tipo === 'medio');
    if (!mejor && golpe) mejor = { p: golpe.p, tipo: 'cara', color: COL.cara, texto: golpe.f.g && golpe.f.g !== est.contexto ? 'En grupo' : 'En cara', cara: golpe.f.id, atras: golpe.atras };
    if (mejor && mejor.tipo !== 'cara' && golpe) { mejor.caraDebajo = golpe.f.id; }
    if (golpe && !mejor.cara) mejor.cara0 = golpe.f.id;
    // plano de trabajo (rectángulo, círculo...)
    if (o.plano) {
      const { n, p0 } = o.plano;
      if (fuerte) { const p = V.sub(mejor.p, V.mul(n, V.dot(V.sub(mejor.p, p0), n))); mejor = Object.assign({}, mejor, { p, plano: true }); }
      else { const p = planoRayo(n, p0, ray); if (p) mejor = { p, tipo: mejor && mejor.tipo === 'arista' && Math.abs(V.dot(V.sub(mejor.p, p0), n)) < 1e-4 ? 'arista' : 'libre', color: '#333', texto: '' }; }
    }
    // bloqueo de eje
    if (o.desde && o.bloqueo) {
      const d = o.bloqueo.d;
      const p = fuerte ? V.add(o.desde, V.mul(d, V.dot(V.sub(mejor.p, o.desde), d))) : cercanoRecta(o.desde, d, ray);
      if (p) mejor = { p, tipo: 'eje', color: o.bloqueo.color, texto: (fuerte ? 'Desde ' + mejor.texto.toLowerCase() + ' · ' : '') + o.bloqueo.nombre, eje: o.bloqueo, bloqueado: true };
    } else if (o.desde && !fuerte) {
      // ejes y paralela/perpendicular a la última arista tocada
      const dirs = [[X, 'Eje rojo', COL.x], [Y, 'Eje verde', COL.y], [Z, 'Eje azul', COL.z]];
      if (o.planoEjes) for (let i = dirs.length - 1; i >= 0; i--) if (Math.abs(V.dot(dirs[i][0], o.planoEjes)) > 0.99) dirs.splice(i, 1);
      if (aristaReciente && Date.now() - tAristaReciente < 4000 && m.e.has(aristaReciente)) {
        const E = m.e.get(aristaReciente), d = V.norm(V.sub(m.P(E.b), m.P(E.a)));
        if (Math.max(Math.abs(d[0]), Math.abs(d[1]), Math.abs(d[2])) < 0.999) dirs.push([d, 'Paralela a arista', COL.paralela]);
      }
      let be = tol * 1.2, eje = null;
      for (const [d, nombre, color] of dirs) {
        const q = cercanoRecta(o.desde, d, ray); if (!q) continue;
        if (o.planoEjes && Math.abs(V.dot(V.sub(q, o.desde), o.planoEjes)) > 1e-4) continue;
        const S = pr(q); if (!S) continue;
        const ds = Math.hypot(S[0] - sx, S[1] - sy);
        if (ds < be && V.dist(q, o.desde) > 1e-4) { be = ds; eje = { p: q, tipo: 'eje', color, texto: nombre, eje: { d, color, nombre } }; }
      }
      if (eje && (!mejor || mejor.tipo === 'cara' || mejor.tipo === 'libre' || mejor.tipo === 'suelo' || mejor.tipo === 'arista')) {
        // si además toca una arista, intersección con el eje
        mejor = eje;
      }
    }
    if (!mejor) {
      const p0 = o.desde || [0, 0, 0];
      let p = planoRayo(Z, [0, 0, o.desde ? o.desde[2] : 0], ray);
      if (!p || V.dist(p, cam.eye) > cam.distRef * 6) p = V.add(ray.o, V.mul(ray.d, Math.max(1, V.dist(cam.eye, p0) * 0.9)));
      mejor = { p, tipo: 'suelo', color: '#555', texto: '' };
    }
    mejor.marca = mejor.tipo !== 'libre' && mejor.tipo !== 'suelo';
    mejor.golpe = golpe; mejor.sx = sx; mejor.sy = sy; mejor.tipoPuntero = tipo;
    if (fuerte && mejor.marca === undefined) mejor.marca = true;
    return mejor;
  }
  // entidad bajo el puntero para seleccionar / borrar / pintar
  function elegir(sx, sy, tipo, soloAristas) {
    const ray = cam.rayo(sx, sy), tol = tolerancia(tipo);
    const golpe = golpeCara(ray), tF = golpe ? golpe.t : Infinity;
    // cotas
    for (let i = 0; i < m.cotas.length; i++) { const s = m.cotas[i]._s; if (s && Math.hypot(s[0] - sx, s[1] - sy) < tol + 6) return { tipo: 'cota', id: i }; }
    let best = null, bd = tol;
    for (const e of m.e.values()) {
      if (e.s && !AJ.aristasSuaves) continue;
      const A = m.P(e.a), B = m.P(e.b), SA = pr(A), SB = pr(B); if (!SA || !SB) continue;
      const dx = SB[0] - SA[0], dy = SB[1] - SA[1], L2 = dx * dx + dy * dy || 1;
      let u = ((sx - SA[0]) * dx + (sy - SA[1]) * dy) / L2; u = Math.max(0, Math.min(1, u));
      const d = Math.hypot(SA[0] + u * dx - sx, SA[1] + u * dy - sy); if (d >= bd) continue;
      const q = V.lerp(A, B, u); const t = V.dot(V.sub(q, ray.o), ray.d); if (t > tF * 1.003 + 0.003) continue;
      bd = d; best = { tipo: 'arista', id: e.id, g: e.g };
    }
    if (!best && golpe && !soloAristas) best = { tipo: 'cara', id: golpe.f.id, g: golpe.f.g, atras: golpe.atras, p: golpe.p };
    if (best && best.g && best.g !== est.contexto) return { tipo: 'grupo', id: best.g, sub: best };
    if (best && est.contexto && best.g !== est.contexto) return null;
    return best;
  }

  // ---------------- selección ----------------
  function limpiarSel() { est.selCaras.clear(); est.selAristas.clear(); est.selGrupos.clear(); est.selCotas.clear(); estVer++; pintarSelBar(); pedir(); }
  function haySel() { return est.selCaras.size + est.selAristas.size + est.selGrupos.size + est.selCotas.size > 0; }
  function seleccionar(ent, modo) { // modo: 'nuevo' | 'agregar' | 'alternar'
    if (modo === 'nuevo') { est.selCaras.clear(); est.selAristas.clear(); est.selGrupos.clear(); est.selCotas.clear(); }
    if (!ent) { estVer++; pintarSelBar(); pedir(); return; }
    const set = ent.tipo === 'cara' ? est.selCaras : ent.tipo === 'arista' ? est.selAristas : ent.tipo === 'grupo' ? est.selGrupos : est.selCotas;
    if (modo === 'alternar' && set.has(ent.id)) set.delete(ent.id); else set.add(ent.id);
    estVer++; pintarSelBar(); pedir();
  }
  function seleccionarCaraYBordes(fid) { const f = m.f.get(fid); if (!f) return; est.selCaras.add(fid); for (const e of m.aristasCara(f)) est.selAristas.add(e); estVer++; pintarSelBar(); }
  function seleccionarConectado(ent) {
    const g = ent.tipo === 'cara' ? m.f.get(ent.id).g : m.e.get(ent.id).g;
    const pendV = []; const vistos = new Set();
    if (ent.tipo === 'cara') pendV.push(...m.vertsCara(m.f.get(ent.id))); else { const E = m.e.get(ent.id); pendV.push(E.a, E.b); }
    while (pendV.length) { const v = pendV.pop(); if (vistos.has(v)) continue; vistos.add(v); for (const e of m.ve.get(v)) { const E = m.e.get(e); if (E.g !== g) continue; est.selAristas.add(e); for (const f of m.ef.get(e)) est.selCaras.add(f); pendV.push(E.a === v ? E.b : E.a); } }
    estVer++; pintarSelBar();
  }
  // vértices afectados por la selección (o por una entidad)
  function vertsDe(sel) {
    const s = new Set();
    for (const f of sel.caras || []) { const F = m.f.get(f); if (F) for (const v of m.vertsCara(F)) s.add(v); }
    for (const e of sel.aristas || []) { const E = m.e.get(e); if (E) { s.add(E.a); s.add(E.b); } }
    for (const g of sel.grupos || []) for (const v of m.v.values()) if (v.g === g) s.add(v.id);
    for (const v of sel.verts || []) s.add(v);
    return s;
  }
  function selActual() { return { caras: [...est.selCaras], aristas: [...est.selAristas], grupos: [...est.selGrupos] }; }
  function selDeEntidad(ent, inf) {
    if (!ent) return null;
    if (ent.tipo === 'grupo') return { grupos: [ent.id] };
    if (inf && inf.vert && inf.tipo === 'extremo') return { verts: [inf.vert] };
    if (ent.tipo === 'cara') return { caras: [ent.id] };
    if (ent.tipo === 'arista') { const E = m.e.get(ent.id); if (E && E.c) return { aristas: [...m.e.values()].filter(x => x.c === E.c && x.g === E.g).map(x => x.id) }; return { aristas: [ent.id] }; }
    return null;
  }

  // ---------------- planos de dibujo ----------------
  function planoInicial(inf) {
    const fid = inf.cara || (inf.tipo !== 'cara' ? null : null);
    if (inf.cara && m.f.has(inf.cara)) { const f = m.f.get(inf.cara); return { n: f.n.slice(), p0: inf.p.slice(), cara: f.id }; }
    // vista casi horizontal: plano vertical que mira a la cámara
    const f = cam.adelante();
    if (Math.abs(f[2]) < 0.26) { const n = Math.abs(f[0]) > Math.abs(f[1]) ? [Math.sign(f[0]) || 1, 0, 0] : [0, Math.sign(f[1]) || 1, 0]; return { n, p0: inf.p.slice() }; }
    return { n: [0, 0, 1], p0: inf.p.slice() };
  }
  function ejesDe(n) { return ejesPlano(n); }
  const hacia = () => cam.adelante();

  // ---------------- herramientas ----------------
  // Cada herramienta maneja: abajo(inf, ev), mover(inf, ev, presionado), arriba(inf, ev, arrastre), vcb(texto), cancelar(), dibujar()
  // Patrón de dos puntos: tocar-tocar o arrastrar-soltar.
  function DosPuntos(conf) {
    return Object.assign({
      pts: [], cur: null, recien: false,
      activa() { return this.pts.length > 0; },
      cancelar() { this.pts = []; this.cur = null; this.alCancelar && this.alCancelar(); pista(); pedir(); },
      abajo(inf) { if (!this.pts.length) { if (this.puedeEmpezar && !this.puedeEmpezar(inf)) return; this.pts.push(inf.p.slice()); this.empezar && this.empezar(inf); this.recien = true; } else this.recien = false; this.cur = inf; pista(); },
      mover(inf) { this.cur = inf; this.actualizar && this.actualizar(inf); },
      arriba(inf, ev, arrastre) { if (!this.pts.length) return; if (this.recien && !arrastre) { this.recien = false; return; } this.recien = false; this.cur = inf; this.siguiente(inf); pista(); pedir(); },
      opt() { return {}; }
    }, conf);
  }
  const ejeBloq = { v: null };
  const EJES = { x: { d: X, color: COL.x, nombre: 'Bloqueado en rojo' }, y: { d: Y, color: COL.y, nombre: 'Bloqueado en verde' }, z: { d: Z, color: COL.z, nombre: 'Bloqueado en azul' } };

  const H = {};
  H.seleccionar = {
    pista: () => est.contexto ? 'Editando el grupo. Toca afuera o «Cerrar grupo» para salir.' : 'Toca para elegir · dos toques: cara y bordes · tres: todo lo unido · arrastra para un recuadro',
    agregar: false, ultimo: 0, cuenta: 0, ini: null, muestraInf: false,
    abajo(inf, ev) { this.ini = [inf.sx, inf.sy]; },
    mover(inf, ev, pres) { if (pres && this.ini && Math.hypot(inf.sx - this.ini[0], inf.sy - this.ini[1]) > 10) { cajaSel = { x0: this.ini[0], y0: this.ini[1], x1: inf.sx, y1: inf.sy }; pedir(); } },
    arriba(inf, ev, arrastre) {
      if (cajaSel) { seleccionCaja(cajaSel, this.agregar); cajaSel = null; this.ini = null; pedir(); return; }
      this.ini = null;
      const ent = elegir(inf.sx, inf.sy, inf.tipoPuntero);
      const t = Date.now(); this.cuenta = (t - this.ultimo < 380 && this.uEnt && ent && ent.id === this.uEnt.id) ? this.cuenta + 1 : 1; this.ultimo = t; this.uEnt = ent;
      if (!ent) { if (!this.agregar) { if (est.contexto && !haySel()) salirContexto(); limpiarSel(); } return; }
      if (this.cuenta === 2) {
        if (ent.tipo === 'grupo') return entrarContexto(ent.id);
        if (ent.tipo === 'cara') { seleccionarCaraYBordes(ent.id); return pedir(); }
        if (ent.tipo === 'arista') { const E = m.e.get(ent.id); for (const f of m.ef.get(ent.id)) est.selCaras.add(f); estVer++; pintarSelBar(); return pedir(); }
      }
      if (this.cuenta >= 3 && (ent.tipo === 'cara' || ent.tipo === 'arista')) { seleccionarConectado(ent); return pedir(); }
      if (ent.tipo === 'arista') { const E = m.e.get(ent.id); if (E.c) { if (!this.agregar) seleccionar(null, 'nuevo'); for (const x of m.e.values()) if (x.c === E.c && x.g === E.g) est.selAristas.add(x.id); estVer++; pintarSelBar(); return pedir(); } }
      seleccionar(ent, this.agregar ? 'alternar' : 'nuevo');
    },
    opciones() { return [{ t: 'Agregar a la selección', on: this.agregar, fn: () => { this.agregar = !this.agregar; pintarOpciones(); } }, { t: 'Todo', fn: seleccionarTodo }]; }
  };
  let cajaSel = null;
  function seleccionCaja(c, agregar) {
    if (!agregar) { est.selCaras.clear(); est.selAristas.clear(); est.selGrupos.clear(); est.selCotas.clear(); }
    const x0 = Math.min(c.x0, c.x1), x1 = Math.max(c.x0, c.x1), y0 = Math.min(c.y0, c.y1), y1 = Math.max(c.y0, c.y1);
    const ventana = c.x1 >= c.x0; // izquierda→derecha: todo adentro; derecha→izquierda: lo que cruce
    const dentro = p => { const s = pr(p); return s && s[0] >= x0 && s[0] <= x1 && s[1] >= y0 && s[1] <= y1; };
    const vIn = new Map(); for (const v of m.v.values()) vIn.set(v.id, dentro(v.p));
    const segCruza = (a, b) => { const A = pr(a), B = pr(b); if (!A || !B) return false; if (vIn.get) {} return lineaRect(A, B, x0, y0, x1, y1); };
    const gruposOk = new Map();
    for (const e of m.e.values()) {
      const ok = ventana ? (vIn.get(e.a) && vIn.get(e.b)) : (vIn.get(e.a) || vIn.get(e.b) || segCruza(m.P(e.a), m.P(e.b)));
      if (e.g && e.g !== est.contexto) { if (!gruposOk.has(e.g)) gruposOk.set(e.g, ventana); gruposOk.set(e.g, ventana ? gruposOk.get(e.g) && ok : gruposOk.get(e.g) || ok); continue; }
      if (est.contexto && e.g !== est.contexto) continue;
      if (ok) est.selAristas.add(e.id);
    }
    for (const f of m.f.values()) {
      if (f.g && f.g !== est.contexto) continue; if (est.contexto && f.g !== est.contexto) continue;
      const vs = m.vertsCara(f); const ok = ventana ? vs.every(v => vIn.get(v)) : vs.some(v => vIn.get(v));
      if (ok) est.selCaras.add(f.id);
    }
    if (!est.contexto) for (const [g, ok] of gruposOk) if (ok) est.selGrupos.add(g);
    estVer++; pintarSelBar();
  }
  function lineaRect(A, B, x0, y0, x1, y1) {
    const ins = p => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1; if (ins(A) || ins(B)) return true;
    const segs = [[[x0, y0], [x1, y0]], [[x1, y0], [x1, y1]], [[x1, y1], [x0, y1]], [[x0, y1], [x0, y0]]];
    const cr = (p, q, r, s) => { const d = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0]); if (!d) return false; const t = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / d, u = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / d; return t >= 0 && t <= 1 && u >= 0 && u <= 1; };
    return segs.some(([r, s]) => cr(A, B, r, s));
  }
  function seleccionarTodo() {
    limpiarSel();
    for (const f of m.f.values()) if (f.g === est.contexto) est.selCaras.add(f.id);
    for (const e of m.e.values()) if (e.g === est.contexto) est.selAristas.add(e.id);
    if (!est.contexto) for (const g of m.grupos.keys()) est.selGrupos.add(g);
    estVer++; pintarSelBar(); pedir();
  }
  function entrarContexto(g) { est.contexto = g; limpiarSel(); $('contexto').classList.remove('oculto'); $('ctxNombre').textContent = (m.grupos.get(g) || {}).nombre || 'Grupo'; estVer++; pista(); pedir(); }
  function salirContexto() { est.contexto = 0; $('contexto').classList.add('oculto'); estVer++; pista(); pedir(); }

  H.borrar = {
    pista: () => 'Toca una arista, cara o grupo para borrarlo · arrastra sobre varias aristas',
    lista: null, muestraInf: false,
    abajo(inf) { this.lista = new Map(); this._add(inf); },
    _add(inf) { const ent = elegir(inf.sx, inf.sy, inf.tipoPuntero); if (!ent) return; const k = ent.tipo + ent.id; if (this.lista.has(k)) return; if (this.lista.size && ent.tipo === 'cara') return; this.lista.set(k, ent); if (ent.tipo === 'arista') est.selAristas.add(ent.id); if (ent.tipo === 'grupo') est.selGrupos.add(ent.id); if (ent.tipo === 'cara') est.selCaras.add(ent.id); estVer++; pedir(); },
    mover(inf, ev, pres) { if (pres && this.lista) { const ent = elegir(inf.sx, inf.sy, inf.tipoPuntero, true); if (ent && (ent.tipo === 'arista' || ent.tipo === 'grupo')) this._add(inf); } },
    arriba() {
      if (!this.lista || !this.lista.size) { this.lista = null; return; }
      const L = [...this.lista.values()]; this.lista = null; limpiarSel();
      operacion(() => {
        const cotas = L.filter(x => x.tipo === 'cota').map(x => x.id).sort((a, b) => b - a); for (const i of cotas) m.cotas.splice(i, 1);
        for (const x of L) {
          if (x.tipo === 'arista') m.borrarArista(x.id);
          else if (x.tipo === 'cara' && L.length === 1) m.borrarCara(x.id);
          else if (x.tipo === 'grupo') borrarGrupo(x.id);
        }
      });
    },
    cancelar() { this.lista = null; limpiarSel(); },
    activa() { return !!this.lista; }
  };
  function borrarGrupo(g) { const E = m.entidadesGrupo(g); for (const f of E.caras) m.quitarCara(f); for (const e of E.aristas) if (m.e.has(e)) m.quitarArista(e); for (const v of E.verts) m.quitarVertSiSuelto(v); m.grupos.delete(g); }

  H.pintar = {
    pista: () => $('matGotero').checked ? 'Toca una cara para tomar su material' : 'Toca una cara para pintarla · en un grupo pinta todo el grupo · elige el material en el panel',
    muestraInf: false, gotero: false,
    abajo() {}, mover() {},
    arriba(inf) {
      const ent = elegir(inf.sx, inf.sy, inf.tipoPuntero);
      if ($('matGotero').checked) { let f = ent && ent.tipo === 'cara' ? m.f.get(ent.id) : ent && ent.tipo === 'grupo' && ent.sub && ent.sub.tipo === 'cara' ? m.f.get(ent.sub.id) : null; if (f) { matActual = (ent.atras || (ent.sub && ent.sub.atras)) ? f.matB : f.mat; $('matGotero').checked = false; pintarMateriales(); avisar('Material tomado'); pista(); } return; }
      if (!ent) return;
      operacion(() => {
        if (ent.tipo === 'cara') {
          const f = m.f.get(ent.id);
          if (est.selCaras.has(ent.id) && est.selCaras.size > 1) { for (const c of est.selCaras) { const F = m.f.get(c); if (ent.atras) F.matB = matActual; else F.mat = matActual; } }
          else if (ent.atras) f.matB = matActual; else f.mat = matActual;
        } else if (ent.tipo === 'grupo') { for (const f of m.f.values()) if (f.g === ent.id) { f.mat = matActual; } }
        m.todoSucio = true; m.cambio++;
      });
    }
  };

  H.linea = DosPuntos({
    pista() { return this.pts.length ? 'Toca el final · escribe un largo · flechas o X/Y/Z para bloquear un eje' : 'Toca el punto de inicio de la línea'; },
    opt() { return this.pts.length ? { desde: this.pts[this.pts.length - 1], bloqueo: ejeBloq.v } : {}; },
    etiqueta: 'Longitud',
    siguiente(inf) { this.hacer(inf.p); },
    hacer(p) {
      const a = this.pts[this.pts.length - 1]; if (V.dist(a, p) < 1e-5) return;
      let caras = [];
      operacion(() => { const es = m.linea(a, p, est.contexto); caras = m.buscarCaras(es, est.contexto, hacia()); });
      if (caras.length) { this.pts = []; avisar(caras.length > 1 ? caras.length + ' caras nuevas' : 'Cara nueva'); }
      else this.pts = [p.slice()];
      ejeBloq.v = null; pintarOpciones();
    },
    valor() { if (!this.pts.length || !this.cur) return ''; return fmt(V.dist(this.pts[this.pts.length - 1], this.cur.p)); },
    vcb(t) {
      if (!this.pts.length || !this.cur) return false; const L = leerMedida(t); if (!(L > 0)) return false;
      const a = this.pts[this.pts.length - 1], d = V.norm(V.sub(this.cur.p, a)); if (!V.len(V.sub(this.cur.p, a))) return false;
      this.hacer(V.add(a, V.mul(d, L))); return true;
    },
    dibujar() {
      if (!this.pts.length || !this.cur) return;
      const a = this.pts[this.pts.length - 1], b = this.cur.p;
      const c = this.cur.tipo === 'eje' ? this.cur.color : '#18191b';
      lineaOV(a, b, c, 2);
      if (this.cur.tipo !== 'eje' && !this.cur.marca) textoOV(b, fmt(V.dist(a, b)));
    }
  });

  H.rectangulo = DosPuntos({
    pista() { return this.pts.length ? 'Toca la esquina opuesta · escribe ancho;largo (por ejemplo 3;4)' : 'Toca la primera esquina (sobre una cara dibuja en esa cara)'; },
    etiqueta: 'Dimensiones',
    empezar(inf) { this.plano = planoInicial(inf); [this.u, this.v] = ejesDe(this.plano.n); },
    opt() { return this.pts.length ? { plano: this.plano } : {}; },
    esquinas(p) {
      const a = this.pts[0], d = V.sub(p, a), w = V.dot(d, this.u), h = V.dot(d, this.v);
      return [a, V.add(a, V.mul(this.u, w)), V.add(V.add(a, V.mul(this.u, w)), V.mul(this.v, h)), V.add(a, V.mul(this.v, h))];
    },
    medidas(p) { const d = V.sub(p, this.pts[0]); return [V.dot(d, this.u), V.dot(d, this.v)]; },
    siguiente(inf) { this.hacer(this.esquinas(inf.p)); },
    hacer(P) {
      const [w, h] = [V.dist(P[0], P[1]), V.dist(P[1], P[2])]; if (w < 1e-4 || h < 1e-4) return;
      operacion(() => { const es = []; for (let i = 0; i < 4; i++) es.push(...m.linea(P[i], P[(i + 1) % 4], est.contexto, { forzar: true })); m.buscarCaras(es, est.contexto, hacia()); });
      this.pts = [];
    },
    valor() { if (!this.pts.length || !this.cur) return ''; const [w, h] = this.medidas(this.cur.p); return fmt(Math.abs(w)) + ' ; ' + fmt(Math.abs(h)); },
    vcb(t) {
      if (!this.pts.length) return false; const [a, b] = leerPar(t); if (!(a > 0) || !(b > 0)) return false;
      const [w, h] = this.cur ? this.medidas(this.cur.p) : [1, 1];
      const p = V.add(V.add(this.pts[0], V.mul(this.u, a * (Math.sign(w) || 1))), V.mul(this.v, b * (Math.sign(h) || 1)));
      this.hacer(this.esquinas(p)); return true;
    },
    dibujar() {
      if (!this.pts.length || !this.cur) return;
      const P = this.esquinas(this.cur.p); const [w, h] = this.medidas(this.cur.p);
      const cuad = Math.abs(Math.abs(w) - Math.abs(h)) < 1e-3 && Math.abs(w) > 1e-3;
      poliOV(P, cuad ? COL.paralela : '#18191b', '#2f6bff14', 1.8);
      if (cuad) textoOV(P[2], 'Cuadrado');
    }
  });

  function circuloPts(c, n, r, u, v, lados) { const P = []; for (let i = 0; i < lados; i++) { const a = i / lados * Math.PI * 2; P.push(V.add(c, V.add(V.mul(u, Math.cos(a) * r), V.mul(v, Math.sin(a) * r)))); } return P; }
  function HCirculo(esPoligono) {
    return DosPuntos({
      lados: esPoligono ? 6 : 24,
      pista() { return this.pts.length ? 'Toca para el radio · escribe el radio, o «' + (esPoligono ? '8' : '36') + 'l» para cambiar los lados' : 'Toca el centro' + (esPoligono ? ' del polígono' : ' del círculo'); },
      etiqueta: 'Radio',
      empezar(inf) { this.plano = planoInicial(inf); },
      opt() { return this.pts.length ? { plano: this.plano } : {}; },
      ejes(p) { const n = this.plano.n; let d = V.sub(p, this.pts[0]); d = V.sub(d, V.mul(n, V.dot(d, n))); let u = V.len(d) > 1e-6 ? V.norm(d) : ejesDe(n)[0]; if (!esPoligono) u = ejesDe(n)[0]; return [u, V.cross(n, u)]; },
      siguiente(inf) { this.hacer(V.dist(this.pts[0], inf.p), inf.p); },
      hacer(r, p) {
        if (r < 1e-4) return; const [u, v] = this.ejes(p || V.add(this.pts[0], ejesDe(this.plano.n)[0]));
        const P = circuloPts(this.pts[0], 0, r, u, v, this.lados), c = m.id();
        operacion(() => { const es = []; for (let i = 0; i < P.length; i++) es.push(...m.linea(P[i], P[(i + 1) % P.length], est.contexto, { c, forzar: true })); m.buscarCaras(es, est.contexto, hacia()); });
        this.pts = [];
      },
      valor() { return this.pts.length && this.cur ? fmt(V.dist(this.pts[0], this.cur.p)) : this.lados + ' lados'; },
      vcb(t) {
        const l = String(t).trim().match(/^(\d+)\s*[ls]$/i); if (l) { this.lados = Math.max(3, Math.min(360, +l[1])); avisar(this.lados + ' lados'); pintarOpciones(); return true; }
        if (!this.pts.length) return false; const r = leerMedida(t); if (!(r > 0)) return false; this.hacer(r, this.cur && this.cur.p); return true;
      },
      opciones() { return (esPoligono ? [3, 5, 6, 8] : [12, 24, 48, 96]).map(n => ({ t: n + ' lados', on: this.lados === n, fn: () => { this.lados = n; pintarOpciones(); } })); },
      dibujar() {
        if (!this.pts.length || !this.cur) return; const r = V.dist(this.pts[0], this.cur.p); if (r < 1e-5) return;
        const [u, v] = this.ejes(this.cur.p); poliOV(circuloPts(this.pts[0], 0, r, u, v, this.lados), '#18191b', '#2f6bff14', 1.8);
        lineaOV(this.pts[0], this.cur.p, '#18191b88', 1, [4, 4]);
      }
    });
  }
  H.circulo = HCirculo(false); H.poligono = HCirculo(true);

  H.arco = DosPuntos({
    lados: 12,
    pista() { return this.pts.length === 0 ? 'Toca el inicio del arco' : this.pts.length === 1 ? 'Toca el final del arco' : 'Mueve para la flecha (curvatura) y toca · escribe la flecha'; },
    etiqueta: 'Flecha',
    empezar(inf) { this.plano = planoInicial(inf); },
    opt() { return this.pts.length === 1 ? { desde: this.pts[0], bloqueo: ejeBloq.v } : this.pts.length === 2 ? { plano: { n: this.plano.n, p0: this.pts[0] } } : {}; },
    siguiente(inf) {
      if (this.pts.length === 1) { if (V.dist(inf.p, this.pts[0]) < 1e-4) return; this.pts.push(inf.p.slice());
        const d = V.sub(this.pts[1], this.pts[0]); if (Math.abs(V.dot(V.norm(d), this.plano.n)) > 0.99) this.plano.n = Math.abs(d[2]) > 0.9 ? V.norm(V.cross(d, cam.derecha())) : [0, 0, 1];
        else this.plano.n = V.norm(V.sub(this.plano.n, V.mul(V.norm(d), V.dot(this.plano.n, V.norm(d)))));
        return; }
      this.hacer(this.flecha(inf.p));
    },
    flecha(p) { const a = this.pts[0], b = this.pts[1], mid = V.lerp(a, b, 0.5), perp = V.norm(V.cross(this.plano.n, V.sub(b, a))); return V.dot(V.sub(p, mid), perp); },
    puntos(h) {
      const a = this.pts[0], b = this.pts[1], c = V.dist(a, b) / 2, mid = V.lerp(a, b, 0.5), perp = V.norm(V.cross(this.plano.n, V.sub(b, a)));
      if (Math.abs(h) < 1e-5) return [a, b];
      const R = (c * c + h * h) / (2 * h), C = V.add(mid, V.mul(perp, h - R));
      const ua = V.sub(a, C), ub = V.sub(b, C), ang0 = 0, n = this.plano.n;
      const ux = V.norm(ua), uy = V.cross(n, ux);
      let tot = Math.atan2(V.dot(ub, uy), V.dot(ub, ux)); const apex = V.add(mid, V.mul(perp, h));
      const t = Math.atan2(V.dot(V.sub(apex, C), uy), V.dot(V.sub(apex, C), ux));
      // elegir el sentido que pasa por el vértice del arco
      const norm = x => (x % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      if (!(norm(t) < norm(tot))) tot = norm(tot) - 2 * Math.PI; else tot = norm(tot);
      const P = []; const r = Math.abs(R) || V.len(ua);
      for (let i = 0; i <= this.lados; i++) { const q = tot * i / this.lados; P.push(V.add(C, V.add(V.mul(ux, Math.cos(q) * V.len(ua)), V.mul(uy, Math.sin(q) * V.len(ua))))); }
      P[0] = a; P[P.length - 1] = b; return P;
    },
    hacer(h) {
      const P = this.puntos(h), c = m.id();
      operacion(() => { const es = []; for (let i = 0; i + 1 < P.length; i++) es.push(...m.linea(P[i], P[i + 1], est.contexto, { c, forzar: true })); m.buscarCaras(es, est.contexto, hacia()); });
      this.pts = [];
    },
    valor() { return this.pts.length === 2 && this.cur ? fmt(Math.abs(this.flecha(this.cur.p))) : this.pts.length === 1 && this.cur ? fmt(V.dist(this.pts[0], this.cur.p)) : ''; },
    vcb(t) { const l = String(t).trim().match(/^(\d+)\s*[ls]$/i); if (l) { this.lados = Math.max(2, +l[1]); return true; } if (this.pts.length !== 2) return false; const h = leerMedida(t); if (isNaN(h)) return false; const s = this.cur ? Math.sign(this.flecha(this.cur.p)) || 1 : 1; this.hacer(h * s); return true; },
    dibujar() {
      if (!this.cur) return;
      if (this.pts.length === 1) lineaOV(this.pts[0], this.cur.p, this.cur.tipo === 'eje' ? this.cur.color : '#18191b', 1.6, [5, 4]);
      if (this.pts.length === 2) { const P = this.puntos(this.flecha(this.cur.p)); for (let i = 0; i + 1 < P.length; i++) lineaOV(P[i], P[i + 1], '#18191b', 2); }
    }
  });

  // ---------- empujar / tirar ----------
  let ultimoEmpuje = 0;
  H.empujar = {
    pista() { return this.fid ? 'Mueve y toca para fijar la altura · escribe la distancia' : 'Toca una cara para empujarla o tirar de ella · dos toques repite la última distancia'; },
    etiqueta: 'Distancia',
    fid: 0, base: null, dist: 0, ultimoToque: 0, recien: false,
    activa() { return !!this.fid; },
    hover(inf) { const c = inf.golpe && inf.golpe.f; const id = c && (c.g === est.contexto) ? c.id : 0; if (id !== est.hoverCara) { est.hoverCara = id; estVer++; pedir(); } },
    abajo(inf) {
      if (this.fid) { this.recien = false; return; }
      const c = inf.golpe && inf.golpe.f; if (!c || c.g !== est.contexto) return;
      const t = Date.now();
      if (t - this.ultimoToque < 380 && this.uf === c.id && ultimoEmpuje) { this.uf = 0; return; }
      this.ultimoToque = t; this.uf = c.id;
      this.fid = c.id; this.n = c.n.slice(); this.p0 = inf.golpe.p.slice(); this.base = m.serializar(); this.baseTxt = JSON.stringify(this.base); this.dist = 0; this.recien = true;
      est.hoverCara = 0; estVer++; pista();
    },
    opt() { return this.fid ? { excluirCaras: new Set([this.fid]) } : {}; },
    mover(inf, ev, pres) {
      if (!this.fid) return this.hover(inf);
      let d;
      if (inf.tipo === 'extremo' || inf.tipo === 'medio' || (inf.tipo === 'cara' && Math.abs(V.dot(m.f.get(inf.cara) ? m.f.get(inf.cara).n : X, this.n)) > 0.999)) d = V.dot(V.sub(inf.p, this.p0), this.n);
      else { const ray = cam.rayo(inf.sx, inf.sy); const q = cercanoRecta(this.p0, this.n, ray); if (!q) return; d = V.dot(V.sub(q, this.p0), this.n); }
      this.aplicar(d);
    },
    aplicar(d) {
      this.dist = d; m.cargar(structuredClone(this.base));
      if (Math.abs(d) > 1e-5) { try { m.empujar(this.fid, d); } catch (e) { console.error(e); } }
      pedir();
    },
    arriba(inf, ev, arrastre) {
      if (!this.fid) {
        // doble toque: repetir
        const c = inf.golpe && inf.golpe.f;
        if (c && Date.now() - this.ultimoToque < 400 && ultimoEmpuje && !arrastre && this.uf === 0) { const id = c.id; operacion(() => m.empujar(id, ultimoEmpuje)); avisar('Repetido: ' + fmt(ultimoEmpuje)); }
        return;
      }
      if (this.recien && !arrastre) { this.recien = false; return; }
      this.fin();
    },
    fin() { if (Math.abs(this.dist) > 1e-5) { ultimoEmpuje = this.dist; this.ultimaBase = this.baseTxt; this.ultimaCara = this.fid; guardarDeshacer(this.baseTxt); } else m.cargar(structuredClone(this.base)); this.fid = 0; this.base = null; pista(); pedir(); },
    valor() { return this.fid ? fmt(this.dist) : ''; },
    vcb(t) {
      const d = leerMedida(t); if (isNaN(d)) return false;
      if (this.fid) { const s = Math.sign(this.dist) || 1; this.aplicar(d * s); this.fin(); return true; }
      if (this.ultimaBase && pila[pila.length - 1] === this.ultimaBase) { const s = Math.sign(ultimoEmpuje) || 1; m.cargar(JSON.parse(this.ultimaBase)); m.empujar(this.ultimaCara, d * s); ultimoEmpuje = d * s; cambio(); return true; }
      return false;
    },
    cancelar() { if (this.fid) { m.cargar(structuredClone(this.base)); this.fid = 0; this.base = null; pedir(); } est.hoverCara = 0; estVer++; },
    dibujar() { if (this.fid && Math.abs(this.dist) > 1e-5) textoOV(V.add(this.p0, V.mul(this.n, this.dist)), fmt(this.dist)); }
  };

  // ---------- mover / rotar / escalar (transforman vértices) ----------
  function Transformar(conf) {
    return Object.assign({
      copiar: false, pts: [], sel: null, orig: null, recien: false, copias: 1, ultimo: null,
      activa() { return !!this.sel; },
      tomar(inf) {
        let s = haySel() ? selActual() : selDeEntidad(elegir(inf.sx, inf.sy, inf.tipoPuntero), inf);
        if (!s) return false;
        if (s.caras && !s.aristas) { s.aristas = []; }
        this.sel = s; this.verts = vertsDe(s); this.orig = new Map([...this.verts].map(v => [v, m.P(v).slice()]));
        this.baseTxt = m.clonarDatos();
        if (!haySel()) { if (s.grupos) s.grupos.forEach(g => est.selGrupos.add(g)); if (s.caras) s.caras.forEach(c => est.selCaras.add(c)); if (s.aristas) s.aristas.forEach(e => est.selAristas.add(e)); this.temporal = true; estVer++; }
        return true;
      },
      restaurar() { for (const [v, p] of this.orig) if (m.v.has(v)) m.moverVert(v, p); for (const v of this.verts) for (const e of m.ve.get(v) || []) for (const c of m.ef.get(e)) m.calcNormal(m.f.get(c)); },
      aplicarFn(fn) {
        for (const [v, p] of this.orig) m.moverVert(v, fn(p));
        const cs = new Set(); for (const v of this.verts) for (const e of m.ve.get(v)) for (const c of m.ef.get(e)) cs.add(c);
        for (const c of cs) m.calcNormal(m.f.get(c));
        pedir();
      },
      opt() { return this.sel ? { excluirVerts: this.copiar ? null : this.verts, desde: this.pts[this.pts.length - 1], bloqueo: ejeBloq.v } : {}; },
      abajo(inf) {
        if (!this.sel) { if (!this.tomar(inf)) return avisar('Toca algo para ' + conf.verbo); this.pts = [inf.p.slice()]; this.recien = true; this.alEmpezar && this.alEmpezar(inf); pista(); return; }
        this.recien = false;
      },
      mover(inf) { this.cur = inf; if (this.sel) this.previa(inf); },
      arriba(inf, ev, arrastre) { if (!this.sel) return; if (this.recien && !arrastre) { this.recien = false; return; } this.recien = false; this.paso(inf); pista(); },
      terminar(fn) {
        // fn: transformación final de un punto
        this.restaurar();
        const sel = this.sel, base = this.baseTxt;
        let ok = true;
        try {
          if (this.copiar) {
            const n = this.copias || 1; this.ultimo = { sel, fn, base };
            for (let k = 1; k <= n; k++) this.copiarCon(sel, k === 1 ? fn : (this.fnK ? this.fnK(k) : fn));
          } else {
            m.transformar([...this.verts], fn);
            m.fusionarVertices([...this.verts].filter(v => m.v.has(v)));
            this.ultimo = { sel, fn, base };
          }
        } catch (e) { console.error(e); ok = false; m.cargar(JSON.parse(base)); }
        if (ok) guardarDeshacer(base);
        this.sel = null; this.pts = []; this.copias = 1;
        if (this.temporal) { limpiarSel(); this.temporal = false; }
        ejeBloq.v = null; pintarOpciones(); pedir();
      },
      copiarCon(sel, fn) {
        if (sel.grupos && sel.grupos.length) {
          for (const g of sel.grupos) { const E = m.entidadesGrupo(g); const ng = m.id(); m.grupos.set(ng, { id: ng, nombre: (m.grupos.get(g) || {}).nombre || 'Grupo' }); const d = m.duplicar(E.caras, E.aristas, ng); m.transformar(d.verts, fn); }
        }
        const caras = sel.caras || [], aristas = new Set(sel.aristas || []);
        for (const c of caras) { const F = m.f.get(c); if (F) for (const e of m.aristasCara(F)) aristas.add(e); }
        if (sel.verts && !caras.length && !aristas.size) return;
        if (caras.length || aristas.size) { const d = m.duplicar(caras, [...aristas], est.contexto); m.transformar(d.verts, fn); m.fusionarVertices(d.verts); }
      },
      cancelar() { if (this.sel) { this.restaurar(); this.sel = null; this.pts = []; if (this.temporal) { limpiarSel(); this.temporal = false; } pedir(); } },
      opciones() { return [{ t: 'Copiar', ico: 'copiar', on: this.copiar, fn: () => { this.copiar = !this.copiar; pintarOpciones(); pista(); } }].concat(conf.ejesOp ? ['x', 'y', 'z'].map(k => ({ t: k.toUpperCase(), cls: k, on: ejeBloq.v === EJES[k], fn: () => { ejeBloq.v = ejeBloq.v === EJES[k] ? null : EJES[k]; pintarOpciones(); } })) : []); }
    }, conf);
  }
  H.mover = Transformar({
    verbo: 'moverlo', ejesOp: true, etiqueta: 'Distancia',
    pista() { return this.sel ? 'Toca el destino · escribe la distancia · después de copiar: «x3» repite, «/3» divide' : (this.copiar ? 'Copiar: ' : '') + 'Toca lo que quieres mover (o la selección) en un punto de referencia'; },
    previa(inf) { const d = V.sub(inf.p, this.pts[0]); this.aplicarFn(p => V.add(p, d)); this.d = d; },
    paso(inf) { const d = V.sub(inf.p, this.pts[0]); if (V.len(d) < 1e-6) return; this.dUlt = d; this.fnK = k => p => V.add(p, V.mul(d, k)); this.terminar(p => V.add(p, d)); },
    valor() { return this.sel && this.d ? fmt(V.len(this.d)) : ''; },
    vcb(t) {
      const arr = String(t).trim().match(/^[x*](\d+)$/i), div = String(t).trim().match(/^\/(\d+)$/);
      if ((arr || div) && this.ultimo && this.dUlt && pila[pila.length - 1] === this.ultimo.base) {
        const n = +(arr || div)[1]; if (n < 1 || n > 500) return false; const d = div ? V.mul(this.dUlt, 1 / n) : this.dUlt;
        m.cargar(JSON.parse(this.ultimo.base)); pila.pop();
        const base = this.ultimo.base;
        for (let k = 1; k <= n; k++) this.copiarCon(this.ultimo.sel, p => V.add(p, V.mul(d, k)));
        guardarDeshacer(base); this.ultimo.base = base; avisar(n + ' copias'); return true;
      }
      if (!this.sel || !this.d) return false; const L = leerMedida(t); if (!(L > 0)) return false;
      const d = V.mul(V.norm(this.d), L); this.dUlt = d; this.terminar(p => V.add(p, d)); return true;
    },
    dibujar() { if (this.sel && this.cur) { lineaOV(this.pts[0], this.cur.p, this.cur.tipo === 'eje' ? this.cur.color : '#18191b99', 1.4, [5, 4]); } }
  });
  H.rotar = Transformar({
    verbo: 'girarlo', etiqueta: 'Ángulo',
    pista() { return !this.sel ? 'Toca el centro de giro (el plano se toma de la cara bajo el lápiz)' : this.pts.length === 1 ? 'Toca el punto de referencia (inicio del ángulo)' : 'Mueve para girar y toca · escribe el ángulo en grados'; },
    alEmpezar(inf) { this.n = ejeBloq.v ? ejeBloq.v.d.slice() : (inf.golpe && inf.golpe.f ? inf.golpe.f.n.slice() : [0, 0, 1]); this.ang = 0; },
    opt() { return this.sel ? { excluirVerts: this.copiar ? null : this.verts, plano: { n: this.n, p0: this.pts[0] } } : {}; },
    angulo(p) {
      const c = this.pts[0], n = this.n; const a = V.sub(this.pts[1], c), b = V.sub(p, c);
      let ang = Math.atan2(V.dot(V.cross(a, b), n), V.dot(a, b));
      const g = ang * 180 / Math.PI, s = Math.round(g / 15) * 15; if (Math.abs(g - s) < 2.5) ang = s * Math.PI / 180;
      return ang;
    },
    rot(ang) { const c = this.pts[0], n = this.n; return p => { const v = V.sub(p, c), co = Math.cos(ang), si = Math.sin(ang), d = V.dot(n, v), k = V.cross(n, v); return V.add(c, [v[0] * co + k[0] * si + n[0] * d * (1 - co), v[1] * co + k[1] * si + n[1] * d * (1 - co), v[2] * co + k[2] * si + n[2] * d * (1 - co)]); }; },
    previa(inf) { if (this.pts.length < 2) return; this.ang = this.angulo(inf.p); this.aplicarFn(this.rot(this.ang)); },
    paso(inf) {
      if (this.pts.length === 1) { if (V.dist(inf.p, this.pts[0]) < 1e-5) return; this.pts.push(inf.p.slice()); return; }
      const a = this.angulo(inf.p); this.aUlt = a; this.fnK = k => this.rot(a * k); this.terminar(this.rot(a));
    },
    valor() { return this.sel && this.pts.length === 2 ? (this.ang * 180 / Math.PI).toFixed(1) + '°' : ''; },
    vcb(t) {
      const arr = String(t).trim().match(/^[x*](\d+)$/i);
      if (arr && this.ultimo && this.aUlt != null && pila[pila.length - 1] === this.ultimo.base) { const n = +arr[1]; m.cargar(JSON.parse(this.ultimo.base)); pila.pop(); const base = this.ultimo.base, c0 = this.pts0, a = this.aUlt; for (let k = 1; k <= n; k++) this.copiarCon(this.ultimo.sel, this.rotC(this.cUlt, this.nUlt, a * k)); guardarDeshacer(base); this.ultimo.base = base; return true; }
      if (!this.sel || this.pts.length < 2) return false; const g = parseFloat(String(t).replace(',', '.')); if (isNaN(g)) return false;
      const a = g * Math.PI / 180; this.aUlt = a; this.terminar(this.rot(a)); return true;
    },
    rotC(c, n, ang) { const s = this.pts, nn = this.n; this.pts = [c]; this.n = n; const f = this.rot(ang); this.pts = s; this.n = nn; return f; },
    terminarBase: null,
    dibujar() {
      if (!this.sel) { if (this.cur) { const n = ejeBloq.v ? ejeBloq.v.d : (this.cur.golpe && this.cur.golpe.f ? this.cur.golpe.f.n : Z); const [u, v] = ejesDe(n); const r = 26 / cam.pxPorM(this.cur.p); poliOV(circuloPts(this.cur.p, 0, r, u, v, 36), '#3157d6', null, 1.4); } return; }
      this.cUlt = this.pts[0]; this.nUlt = this.n;
      const [u, v] = ejesDe(this.n); const r = 40 / cam.pxPorM(this.pts[0]);
      poliOV(circuloPts(this.pts[0], 0, r, u, v, 48), '#3157d6', '#3157d610', 1.4);
      if (this.pts.length === 2) { lineaOV(this.pts[0], this.pts[1], '#3157d6', 1.2, [5, 4]); if (this.cur) lineaOV(this.pts[0], this.cur.p, '#18191b', 1.4); }
    }
  });
  H.escalar = Transformar({
    verbo: 'escalarlo', ejesOp: true, etiqueta: 'Escala',
    pista() { return !this.sel ? 'Toca el punto fijo (ancla) de lo que vas a escalar' : this.pts.length === 1 ? 'Toca un punto de referencia' : 'Mueve para escalar y toca · escribe el factor (2 = doble, 0.5 = mitad)'; },
    alEmpezar() { this.k = 1; this.eje = ejeBloq.v; },
    opt() { return this.sel ? { excluirVerts: this.verts, desde: this.pts[this.pts.length === 2 ? 0 : 0] } : {}; },
    factor(p) { const a = this.pts[0], r = V.sub(this.pts[1], a), L = V.len(r); if (L < 1e-6) return 1; return V.dot(V.sub(p, a), r) / (L * L); },
    esc(k) { const a = this.pts[0], e = this.eje; return p => { const v = V.sub(p, a); if (!e) return V.add(a, V.mul(v, k)); const d = V.dot(v, e.d); return V.add(p, V.mul(e.d, d * (k - 1))); }; },
    previa(inf) { if (this.pts.length < 2) return; this.k = this.factor(inf.p); if (Math.abs(this.k) < 0.01) this.k = 0.01 * Math.sign(this.k || 1); this.aplicarFn(this.esc(this.k)); },
    paso(inf) { if (this.pts.length === 1) { if (V.dist(inf.p, this.pts[0]) < 1e-5) return; this.pts.push(inf.p.slice()); this.eje = ejeBloq.v; return; } this.terminar(this.esc(this.k)); },
    valor() { return this.sel && this.pts.length === 2 ? this.k.toFixed(3) : ''; },
    vcb(t) { if (!this.sel || this.pts.length < 2) return false; const k = parseFloat(String(t).replace(',', '.')); if (!(k > 0)) return false; this.terminar(this.esc(k)); return true; },
    dibujar() { if (this.sel && this.pts.length === 2 && this.cur) { lineaOV(this.pts[0], this.cur.p, '#18191b', 1.4, [5, 4]); } }
  });

  H.equidistancia = {
    pista() { return this.fid ? 'Mueve hacia adentro o afuera y toca · escribe la distancia' : 'Toca una cara para hacer su contorno equidistante'; },
    etiqueta: 'Distancia', fid: 0, d: 0,
    activa() { return !!this.fid; },
    abajo(inf) { if (this.fid) { this.recien = false; return; } const c = inf.golpe && inf.golpe.f; if (!c || c.g !== est.contexto) return; this.fid = c.id; this.p0 = inf.golpe.p; this.recien = true; this.d = 0; },
    mover(inf) {
      if (!this.fid) { const c = inf.golpe && inf.golpe.f; const id = c && c.g === est.contexto ? c.id : 0; if (id !== est.hoverCara) { est.hoverCara = id; estVer++; pedir(); } return; }
      const f = m.f.get(this.fid); const ray = cam.rayo(inf.sx, inf.sy); const p = planoRayo(f.n, this.p0, ray) || inf.p;
      const c = m.puntoInterior(f), dir = V.sub(c, this.p0), mov = V.sub(p, this.p0);
      this.d = V.len(mov) * Math.sign(V.dot(mov, dir) || 1); pedir();
    },
    arriba(inf, ev, arrastre) { if (!this.fid) return; if (this.recien && !arrastre) { this.recien = false; return; } this.hacer(this.d); },
    hacer(d) { const fid = this.fid; this.fid = 0; est.hoverCara = 0; estVer++; if (Math.abs(d) < 1e-4) return; operacion(() => m.equidistancia(fid, d, hacia())); this.ultimo = d; pista(); },
    valor() { return this.fid ? fmt(this.d) : ''; },
    vcb(t) { if (!this.fid) return false; const d = leerMedida(t); if (isNaN(d)) return false; this.hacer(d * (Math.sign(this.d) || 1)); return true; },
    cancelar() { this.fid = 0; est.hoverCara = 0; estVer++; pedir(); },
    dibujar() { if (!this.fid || Math.abs(this.d) < 1e-4) return; const P = m.puntosEquidistancia(this.fid, this.d); if (P) poliOV(P, '#2f6bff', null, 1.8); }
  };

  H.medir = DosPuntos({
    pista() { return this.pts.length ? 'Toca el segundo punto' : 'Toca el primer punto para medir'; },
    etiqueta: 'Distancia',
    opt() { return this.pts.length ? { desde: this.pts[0], bloqueo: ejeBloq.v } : {}; },
    siguiente(inf) { const d = V.dist(this.pts[0], inf.p); this.res = [this.pts[0], inf.p.slice()]; avisar('Distancia: ' + fmt(d)); this.pts = []; },
    valor() { if (this.pts.length && this.cur) return fmt(V.dist(this.pts[0], this.cur.p)); return this.res ? fmt(V.dist(this.res[0], this.res[1])) : ''; },
    dibujar() {
      if (this.pts.length && this.cur) { lineaOV(this.pts[0], this.cur.p, this.cur.tipo === 'eje' ? this.cur.color : '#18191b', 1.6, [6, 4]); textoOV(this.cur.p, fmt(V.dist(this.pts[0], this.cur.p))); }
      else if (this.res) { lineaOV(this.res[0], this.res[1], '#2f6bff', 1.6, [6, 4]); }
    }
  });
  H.cota = DosPuntos({
    pista() { return this.pts.length === 0 ? 'Toca el primer punto de la cota' : this.pts.length === 1 ? 'Toca el segundo punto' : 'Aleja la cota y toca para dejarla'; },
    etiqueta: 'Cota',
    opt() { return this.pts.length === 1 ? { desde: this.pts[0], bloqueo: ejeBloq.v } : {}; },
    siguiente(inf) {
      if (this.pts.length === 1) { if (V.dist(inf.p, this.pts[0]) < 1e-5) return; this.pts.push(inf.p.slice()); return; }
      const o = this.offset(inf); const a = this.pts[0], b = this.pts[1];
      operacion(() => m.cotas.push({ a, b, o })); this.pts = [];
    },
    offset(inf) {
      const a = this.pts[0], b = this.pts[1], d = V.norm(V.sub(b, a));
      const ray = cam.rayo(inf.sx, inf.sy);
      // plano que contiene la cota y mira a la cámara
      let n = V.cross(d, V.cross(cam.adelante(), d)); if (V.len(n) < 1e-6) n = Z; n = V.norm(n);
      const p = planoRayo(n, a, ray) || inf.p; let o = V.sub(p, a); o = V.sub(o, V.mul(d, V.dot(o, d))); return o;
    },
    valor() { return this.pts.length ? fmt(V.dist(this.pts[0], this.pts[1] || (this.cur ? this.cur.p : this.pts[0]))) : ''; },
    dibujar() {
      if (!this.cur || !this.pts.length) return;
      if (this.pts.length === 1) { lineaOV(this.pts[0], this.cur.p, '#18191b', 1.3, [5, 4]); return; }
      const o = this.offset(this.cur), a = this.pts[0], b = this.pts[1];
      lineaOV(a, V.add(a, o), '#18191b', 1); lineaOV(b, V.add(b, o), '#18191b', 1); lineaOV(V.add(a, o), V.add(b, o), '#18191b', 1.4);
      textoOV(V.lerp(V.add(a, o), V.add(b, o), 0.5), fmt(V.dist(a, b)));
    }
  });
  // navegación con herramienta (para ratón o dedo)
  H.orbitar = { pista: () => 'Arrastra para girar la vista', muestraInf: false, abajo(inf) { this.u = [inf.sx, inf.sy]; this.piv = pivoteEn(inf.sx, inf.sy); }, mover(inf, ev, pres) { if (pres && this.u) { cam.orbitar(this.piv, -(inf.sx - this.u[0]) * 0.008, -(inf.sy - this.u[1]) * 0.008); this.u = [inf.sx, inf.sy]; pedir(); } }, arriba() { this.u = null; } };
  H.desplazar = { pista: () => 'Arrastra para desplazar la vista', muestraInf: false, abajo(inf) { this.u = [inf.sx, inf.sy]; this.piv = pivoteEn(inf.sx, inf.sy); }, mover(inf, ev, pres) { if (pres && this.u) { cam.desplazar(inf.sx - this.u[0], inf.sy - this.u[1], this.piv); this.u = [inf.sx, inf.sy]; pedir(); } }, arriba() { this.u = null; } };

  const LISTA_H = [
    ['seleccionar', 'Seleccionar', 'Espacio'], ['borrar', 'Borrador', 'E'], ['pintar', 'Pintar', 'B'], '-',
    ['linea', 'Línea', 'L'], ['arco', 'Arco', 'A'], ['rectangulo', 'Rectángulo', 'R'], ['circulo', 'Círculo', 'C'], ['poligono', 'Polígono', 'G'], '-',
    ['empujar', 'Empujar / tirar', 'P'], ['mover', 'Mover', 'M'], ['rotar', 'Rotar', 'Q'], ['escalar', 'Escala', 'S'], ['equidistancia', 'Equidistancia', 'F'], '-',
    ['medir', 'Cinta métrica', 'T'], ['cota', 'Cota', 'D'], '-',
    ['orbitar', 'Órbita', 'O'], ['desplazar', 'Desplazar', 'H']
  ];
  function usar(n) {
    if (herr && herr.cancelar) herr.cancelar();
    nombreHerr = n; herr = H[n]; ejeBloq.v = null; est.hoverCara = 0; estVer++;
    document.querySelectorAll('#herramientas [data-h]').forEach(b => b.classList.toggle('on', b.dataset.h === n));
    if (n === 'pintar') $('pMat').classList.remove('oculto');
    cerrarVcb(); pintarOpciones(); pista(); pedir();
  }
  function pista() {
    const t = herr && herr.pista ? herr.pista() : '';
    $('pista').textContent = t;
    $('vcbEt').textContent = (herr && herr.etiqueta) || 'Medidas';
    pintarVcb();
  }
  function pintarVcb() { if (vcbEdit !== null) { $('vcbVal').textContent = vcbEdit + '▏'; return; } $('vcbVal').textContent = herr && herr.valor ? herr.valor() : ''; }
  function pintarOpciones() {
    const op = $('opciones'); let L = herr && herr.opciones ? herr.opciones() : [];
    if (herr && (nombreHerr === 'linea' || nombreHerr === 'medir' || nombreHerr === 'cota' || nombreHerr === 'arco') && herr.pts && herr.pts.length) L = L.concat(['x', 'y', 'z'].map(k => ({ t: k.toUpperCase(), cls: k, on: ejeBloq.v === EJES[k], fn: () => { ejeBloq.v = ejeBloq.v === EJES[k] ? null : EJES[k]; pintarOpciones(); } })));
    if (herr && herr.activa && herr.activa()) L = L.concat([{ t: 'Cancelar', fn: () => { herr.cancelar(); pintarOpciones(); } }]);
    op.classList.toggle('oculto', !L.length);
    op.innerHTML = L.map((o, i) => `<button class="chip ${o.cls || ''}${o.on ? ' on' : ''}" data-i="${i}">${o.ico ? icono(o.ico) : ''}${o.t}</button>`).join('');
    op.querySelectorAll('[data-i]').forEach(b => b.onclick = () => L[+b.dataset.i].fn());
  }

  // ---------------- teclado de medidas (VCB) ----------------
  let vcbEdit = null;
  function abrirVcb(ini) { vcbEdit = ini || ''; $('vcb').classList.add('edit'); if (!ini && ini !== '' || !hayTecladoFisico) $('teclado').classList.remove('oculto'); pintarTeclado(); pintarVcb(); }
  let hayTecladoFisico = false;
  function cerrarVcb() { vcbEdit = null; $('vcb').classList.remove('edit'); $('teclado').classList.add('oculto'); pintarVcb(); }
  function aceptarVcb() {
    const t = (vcbEdit || '').trim(); cerrarVcb(); if (!t) return;
    const ok = herr && herr.vcb ? herr.vcb(t) : false;
    if (!ok) avisar('Ahora no se puede usar «' + t + '»'); pintarOpciones(); pista(); pedir();
  }
  function pintarTeclado() {
    const T = $('teclado');
    const k = ['7', '8', '9', '⌫', '4', '5', '6', ';', '1', '2', '3', 'x', '0', '.', '-', 'cm'];
    T.innerHTML = `<div class="ent">${vcbEdit || ''}</div>` + k.map(x => `<button data-k="${x}">${x}</button>`).join('') + `<button data-k="m">m</button><button data-k="esc">Cerrar</button><button class="ok" data-k="ok" style="grid-column:span 2">Aceptar</button>`;
    T.querySelectorAll('[data-k]').forEach(b => b.onpointerdown = e => {
      e.preventDefault(); const x = b.dataset.k;
      if (x === 'ok') return aceptarVcb(); if (x === 'esc') return cerrarVcb();
      if (x === '⌫') vcbEdit = vcbEdit.slice(0, -1); else vcbEdit += x;
      pintarTeclado(); pintarVcb();
    });
  }
  $('vcb').onclick = () => vcbEdit === null ? abrirVcb('') : aceptarVcb();

  // ---------------- gestos ----------------
  const punteros = new Map();
  let toolPtr = null, gesto = null, tInicioToques = 0, movioToques = false, maxToques = 0;
  function pos(ev) { const r = cvGL.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; }
  function pivoteEn(sx, sy) {
    const ray = cam.rayo(sx, sy), g = golpeCara(ray); if (g) return g.p;
    const p = planoRayo(Z, [0, 0, 0], ray); if (p && V.dist(p, cam.eye) < cam.distRef * 3) return p;
    const bb = m.caja(); return bb ? V.mul(V.add(bb[0], bb[1]), 0.5) : V.add(cam.eye, V.mul(cam.adelante(), 10));
  }
  function infoDe(ev, x, y) { return inferir(x, y, ev.pointerType, herr && herr.opt ? herr.opt() : {}); }
  function esNav(ev) {
    if (ev.pointerType === 'mouse') return ev.button === 1 || ev.button === 2 ? (ev.shiftKey || ev.button === 1 && ev.shiftKey ? 'pan' : 'orbita') : null;
    if (ev.pointerType === 'touch') return modoLapiz || toolPtr === null && punteros.size > 0 || gesto ? 'toque' : null;
    return null;
  }
  cvGL.addEventListener('contextmenu', e => e.preventDefault());
  cvGL.addEventListener('pointerdown', ev => {
    try { cvGL.setPointerCapture(ev.pointerId); } catch (e) {}
    const [x, y] = pos(ev);
    if (ev.pointerType === 'pen' && AJ.lapiz !== 'nunca' && !modoLapiz) { modoLapiz = true; avisar('Lápiz detectado: el lápiz dibuja y los dedos mueven la vista'); }
    if (ev.pointerType === 'touch' && toolPtr && toolPtr.tipo === 'pen') return; // palma mientras dibuja
    const rec = { id: ev.pointerId, tipo: ev.pointerType, x, y, x0: x, y0: y, t0: Date.now() };
    punteros.set(ev.pointerId, rec);
    let nav = esNav(ev);
    if (ev.pointerType === 'touch' && !modoLapiz && toolPtr && toolPtr.tipo === 'touch' && toolPtr.id !== ev.pointerId) {
      // segundo dedo: era un gesto, no una herramienta
      const t = punteros.get(toolPtr.id); if (herr && herr.cancelarToque) herr.cancelarToque();
      if (herr && herr.recien && herr.cancelar) herr.cancelar();
      if (cajaSel) cajaSel = null;
      toolPtr = null; nav = 'toque';
    }
    if (nav) {
      rec.nav = nav; ultimoInf = null;
      if (nav === 'toque') { iniciarGestoToque(); }
      else gesto = { tipo: nav, u: [x, y], piv: pivoteEn(x, y) };
      return;
    }
    if (toolPtr) return;
    toolPtr = rec;
    const inf = infoDe(ev, x, y); ultimoInf = inf;
    if (herr && herr.abajo) herr.abajo(inf, ev);
    pintarOpciones(); pintarVcb(); pedir();
  });
  function iniciarGestoToque() {
    const T = [...punteros.values()].filter(p => p.tipo === 'touch');
    if (!gesto || gesto.tipo !== 'toque') { tInicioToques = Date.now(); movioToques = false; maxToques = 0; }
    maxToques = Math.max(maxToques, T.length);
    const c = centro(T);
    gesto = { tipo: 'toque', n: T.length, c, sep: separacion(T, c), piv: pivoteEn(c[0], c[1]) };
  }
  const centro = T => [T.reduce((s, p) => s + p.x, 0) / T.length, T.reduce((s, p) => s + p.y, 0) / T.length];
  const separacion = (T, c) => T.length < 2 ? 0 : T.reduce((s, p) => s + Math.hypot(p.x - c[0], p.y - c[1]), 0) / T.length;
  cvGL.addEventListener('pointermove', ev => {
    const [x, y] = pos(ev); const rec = punteros.get(ev.pointerId);
    if (!rec) { // lápiz flotando / ratón sin presionar
      if (ev.pointerType === 'touch') return;
      if (toolPtr) return;
      const inf = infoDe(ev, x, y); ultimoInf = inf;
      if (herr && herr.mover) herr.mover(inf, ev, false);
      pintarVcb(); pedir(); return;
    }
    rec.x = x; rec.y = y;
    if (Math.hypot(x - rec.x0, y - rec.y0) > 8) rec.movio = true;
    if (rec.nav === 'toque' && gesto && gesto.tipo === 'toque') return moverGestoToque();
    if (rec.nav && gesto) {
      const dx = x - gesto.u[0], dy = y - gesto.u[1]; gesto.u = [x, y];
      if (gesto.tipo === 'orbita') cam.orbitar(gesto.piv, -dx * 0.008, -dy * 0.008); else cam.desplazar(dx, dy, gesto.piv);
      return pedir();
    }
    if (toolPtr && toolPtr.id === ev.pointerId) {
      const evs = ev.getCoalescedEvents ? ev.getCoalescedEvents() : null; // solo usamos el último: la inferencia es la que manda
      const inf = infoDe(ev, x, y); ultimoInf = inf;
      if (herr && herr.mover) herr.mover(inf, ev, true);
      pintarVcb(); pedir();
    }
  });
  function moverGestoToque() {
    const T = [...punteros.values()].filter(p => p.tipo === 'touch'); if (!T.length) return;
    if (T.length !== gesto.n) return iniciarGestoToque();
    const c = centro(T), sep = separacion(T, c), dx = c[0] - gesto.c[0], dy = c[1] - gesto.c[1];
    if (Math.hypot(dx, dy) > 1 || Math.abs(sep - gesto.sep) > 1) movioToques = movioToques || T.some(p => p.movio);
    const unoOrbita = modoLapiz ? T.length === 1 : T.length === 2;
    const panea = modoLapiz ? T.length === 2 : T.length >= 3;
    if (unoOrbita) cam.orbitar(gesto.piv, -dx * 0.007, -dy * 0.007);
    if (panea || (!modoLapiz && T.length === 2 && false)) cam.desplazar(dx, dy, gesto.piv);
    if (T.length >= 2 && gesto.sep > 10 && sep > 10) { const f = gesto.sep / sep; if (Math.abs(f - 1) > 0.002) { const zp = pivoteEn(c[0], c[1]); cam.zoom(gesto.zoomP || (gesto.zoomP = zp), f); } }
    gesto.c = c; gesto.sep = sep; pedir();
  }
  function finPuntero(ev, cancelado) {
    const rec = punteros.get(ev.pointerId); punteros.delete(ev.pointerId);
    if (!rec) return;
    if (rec.nav === 'toque') {
      const quedan = [...punteros.values()].filter(p => p.tipo === 'touch').length;
      if (!quedan) {
        const rapido = Date.now() - tInicioToques < 280 && !movioToques;
        if (rapido && !cancelado) { if (maxToques === 2) deshacer(); else if (maxToques === 3) rehacerOp(); }
        gesto = null;
      } else iniciarGestoToque();
      return;
    }
    if (rec.nav) { gesto = null; return; }
    if (toolPtr && toolPtr.id === ev.pointerId) {
      toolPtr = null;
      if (cancelado) return;
      const [x, y] = pos(ev);
      const inf = infoDe(ev, x, y); ultimoInf = inf;
      if (herr && herr.arriba) herr.arriba(inf, ev, !!rec.movio);
      pintarOpciones(); pintarVcb(); pedir();
      if (ev.pointerType === 'touch') setTimeout(() => { if (!toolPtr && herr && !(herr.activa && herr.activa())) { ultimoInf = null; pedir(); } }, 600);
    }
  }
  cvGL.addEventListener('pointerup', ev => finPuntero(ev, false));
  cvGL.addEventListener('pointercancel', ev => finPuntero(ev, true));
  cvGL.addEventListener('pointerleave', ev => { if (ev.pointerType === 'pen' && !punteros.has(ev.pointerId)) { ultimoInf = null; pedir(); } });
  cvGL.addEventListener('wheel', ev => {
    ev.preventDefault(); const [x, y] = pos(ev);
    cam.zoom(pivoteEn(x, y), Math.exp(ev.deltaY * 0.0015)); pedir();
    if (herr && herr.mover && !toolPtr) { const inf = infoDe(ev, x, y); ultimoInf = inf; herr.mover(inf, ev, false); }
  }, { passive: false });

  // ---------------- teclado físico ----------------
  const ATAJOS = { ' ': 'seleccionar', e: 'borrar', b: 'pintar', l: 'linea', a: 'arco', r: 'rectangulo', c: 'circulo', g: 'poligono', p: 'empujar', m: 'mover', q: 'rotar', s: 'escalar', f: 'equidistancia', t: 'medir', d: 'cota', o: 'orbitar', h: 'desplazar' };
  addEventListener('keydown', ev => {
    if ($('editor').classList.contains('oculto') || !$('dialogo').classList.contains('oculto')) return;
    if (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
    hayTecladoFisico = true;
    const k = ev.key;
    if ((ev.ctrlKey || ev.metaKey) && k.toLowerCase() === 'z') { ev.preventDefault(); return ev.shiftKey ? rehacerOp() : deshacer(); }
    if ((ev.ctrlKey || ev.metaKey) && k.toLowerCase() === 'y') { ev.preventDefault(); return rehacerOp(); }
    if ((ev.ctrlKey || ev.metaKey) && k.toLowerCase() === 'a') { ev.preventDefault(); return seleccionarTodo(); }
    if (vcbEdit !== null) {
      if (k === 'Enter') { ev.preventDefault(); return aceptarVcb(); }
      if (k === 'Escape') return cerrarVcb();
      if (k === 'Backspace') { vcbEdit = vcbEdit.slice(0, -1); pintarTeclado(); return pintarVcb(); }
      if (k.length === 1) { vcbEdit += k; pintarTeclado(); return pintarVcb(); }
      return;
    }
    if (/^[0-9.\-*\/]$/.test(k) || (k === 'x' && herr && herr.ultimo)) { vcbEdit = k; $('vcb').classList.add('edit'); pintarVcb(); return; }
    if (k === 'Escape') { if (herr && herr.cancelar) herr.cancelar(); else limpiarSel(); pintarOpciones(); return; }
    if (k === 'Delete' || k === 'Backspace') { if (haySel()) borrarSeleccion(); return; }
    if (k === 'ArrowRight') { ejeBloq.v = ejeBloq.v === EJES.x ? null : EJES.x; return pintarOpciones(); }
    if (k === 'ArrowLeft') { ejeBloq.v = ejeBloq.v === EJES.y ? null : EJES.y; return pintarOpciones(); }
    if (k === 'ArrowUp' || k === 'ArrowDown') { ejeBloq.v = ejeBloq.v === EJES.z ? null : EJES.z; return pintarOpciones(); }
    if (k === 'Control' || k === 'Alt') { if (herr && 'copiar' in herr) { herr.copiar = !herr.copiar; pintarOpciones(); } return; }
    if (k === 'Shift' && herr && herr.cur && herr.cur.eje && !ejeBloq.v) { ejeBloq.v = herr.cur.eje; pintarOpciones(); return; }
    if (k.toLowerCase() === 'z' && ev.shiftKey) return verTodo();
    const n = ATAJOS[k.toLowerCase()]; if (n && !ev.ctrlKey && !ev.metaKey) { ev.preventDefault(); usar(n); }
  });
  addEventListener('keyup', ev => { if (ev.key === 'Shift' && ejeBloq.v && herr && herr.cur) { ejeBloq.v = null; pintarOpciones(); } });

  // ---------------- acciones de selección ----------------
  function borrarSeleccion() {
    const s = selActual(), cotas = [...est.selCotas].sort((a, b) => b - a); limpiarSel();
    operacion(() => { for (const i of cotas) m.cotas.splice(i, 1); for (const g of s.grupos) borrarGrupo(g); for (const f of s.caras) m.quitarCara(f); for (const e of s.aristas) if (m.e.has(e)) m.quitarArista(e); });
  }
  function pintarSelBar() {
    const b = $('selBar'); const n = est.selCaras.size, a = est.selAristas.size, g = est.selGrupos.size, c = est.selCotas.size;
    if (!(n + a + g + c) || (herr && herr.temporal)) { b.classList.add('oculto'); return; }
    const partes = []; if (g) partes.push(g + (g > 1 ? ' grupos' : ' grupo')); if (n) partes.push(n + (n > 1 ? ' caras' : ' cara')); if (a) partes.push(a + (a > 1 ? ' aristas' : ' arista')); if (c) partes.push(c + (c > 1 ? ' cotas' : ' cota'));
    let area = 0; for (const f of est.selCaras) { const F = m.f.get(f); if (F) area += m.areaCara(F); }
    let largo = 0; for (const e of est.selAristas) { const E = m.e.get(e); if (E) largo += V.dist(m.P(E.a), m.P(E.b)); }
    const extra = n ? ' · ' + area.toFixed(2) + ' m²' : a === 1 || (a && !n) ? ' · ' + fmt(largo) : '';
    const acc = [];
    if (n || a) acc.push(['grupo', 'Agrupar', hacerGrupoSel]);
    if (g === 1 && !n && !a) acc.push(['explotar', 'Explotar', explotarSel], ['grupo', 'Editar', () => entrarContexto([...est.selGrupos][0])]);
    if (n) acc.push(['invertir', 'Invertir caras', invertirSel]);
    acc.push(['papelera', 'Borrar', borrarSeleccion], ['cerrar', '', limpiarSel]);
    b.innerHTML = `<span class="cnt">${partes.join(', ')}${extra}</span>` + acc.map((x, i) => `<button class="chip" data-a="${i}" title="${x[1]}">${icono(x[0])}${x[1]}</button>`).join('');
    b.querySelectorAll('[data-a]').forEach(x => x.onclick = () => acc[+x.dataset.a][2]());
    b.classList.remove('oculto');
  }
  function hacerGrupoSel() { const s = selActual(); if (!s.caras.length && !s.aristas.length) return; let g; operacion(() => { g = m.hacerGrupo(s.caras, s.aristas); }); limpiarSel(); if (g) { est.selGrupos.add(g); estVer++; pintarSelBar(); } avisar('Grupo creado'); }
  function explotarSel() { const g = [...est.selGrupos][0]; limpiarSel(); operacion(() => m.explotar(g)); avisar('Grupo explotado'); }
  function invertirSel() { const s = [...est.selCaras]; operacion(() => s.forEach(f => m.invertirCara(f))); }

  // ---------------- vistas ----------------
  function verTodo(anim) {
    const bb = m.caja(); const c = bb ? V.mul(V.add(bb[0], bb[1]), 0.5) : [0, 0, 1];
    const r = bb ? Math.max(1.5, V.dist(bb[0], bb[1]) / 2) : 8;
    const f = cam.adelante(); const d = r / Math.sin(cam.fov / 2) * 1.05 * Math.max(1, cam.h / cam.w);
    cam.eye = V.sub(c, V.mul(f, d)); cam.altoOrto = r * 2.3; pedir();
  }
  function vista(nombre) {
    const D = { iso: [Math.PI / 4 + Math.PI, -0.6155], superior: [-Math.PI / 2, -1.5707], frontal: [Math.PI / 2, 0], posterior: [-Math.PI / 2, 0], derecha: [Math.PI, 0], izquierda: [0, 0], inferior: [-Math.PI / 2, 1.5707] }[nombre];
    if (!D) return; cam.yaw = D[0] + (nombre === 'iso' ? 0 : 0); cam.pitch = D[1]; if (nombre === 'superior') cam.yaw = Math.PI / 2;
    // ojo mirando hacia el centro
    cam.yaw = nombre === 'iso' ? Math.PI / 4 : nombre === 'frontal' ? Math.PI / 2 : nombre === 'posterior' ? -Math.PI / 2 : nombre === 'derecha' ? Math.PI : nombre === 'izquierda' ? 0 : Math.PI / 2;
    cam.pitch = nombre === 'iso' ? -0.55 : nombre === 'superior' ? -1.5706 : nombre === 'inferior' ? 1.5706 : 0;
    verTodo();
  }

  // ---------------- interfaz ----------------
  function pintarHerramientas() {
    $('herramientas').innerHTML = LISTA_H.map(h => h === '-' ? '<div class="sep"></div>' : `<button class="ib" data-h="${h[0]}" title="${h[1]} (${h[2]})">${icono(h[0])}</button>`).join('');
    $('herramientas').querySelectorAll('[data-h]').forEach(b => b.onclick = () => usar(b.dataset.h));
  }
  function pintarBotones() { $('bDeshacer').disabled = !pila.length; $('bRehacer').disabled = !rehacer.length; $('bRayos').classList.toggle('on', !!(vis && vis.rayos)); }
  function pintarMateriales() {
    const L = MATERIALES.concat((m.mats || []).filter(x => !MATERIALES.some(y => y.id === x.id)));
    $('matLista').innerHTML = L.map(x => `<button class="mat${x.id === matActual ? ' on' : ''}" data-m="${x.id}"><i style="${muestra(x)}"></i>${x.nombre}</button>`).join('');
    $('matLista').querySelectorAll('[data-m]').forEach(b => b.onclick = () => { matActual = +b.dataset.m; pintarMateriales(); if (nombreHerr !== 'pintar') usar('pintar'); });
  }
  const urlTex = new Map();
  function muestra(x) {
    if (x.tex) { if (!urlTex.has(x.tex)) { const c = texCanvas(x.tex), s = document.createElement('canvas'); s.width = s.height = 96; s.getContext('2d').drawImage(c, 0, 0, 96, 96); urlTex.set(x.tex, s.toDataURL()); } return `background-image:url(${urlTex.get(x.tex)})`; }
    if (x.id === 0) return `background:linear-gradient(135deg,${x.color} 50%,${x.reverso} 50%)`;
    return `background:${x.color}${x.alfa ? ';opacity:.6' : ''}`;
  }
  $('matColor').onchange = () => {
    const c = $('matColor').value; let x = (m.mats || []).find(y => y.color === c);
    if (!x) { const id = 100 + Math.max(0, ...(m.mats || []).map(y => y.id - 100)) + 1; x = { id, nombre: 'Color ' + c.slice(1), color: c }; m.mats.push(x); MAT.set(id, x); }
    matActual = x.id; pintarMateriales(); if (nombreHerr !== 'pintar') usar('pintar');
  };
  $('matGotero').onchange = pista;
  function colorAMat(hex) {
    let x = (m.mats || []).find(y => y.color === hex) || MATERIALES.find(y => y.color === hex && !y.tex); if (x) return x.id;
    const id = 100 + Math.max(0, ...(m.mats || []).map(y => y.id - 100)) + 1; x = { id, nombre: 'Importado ' + hex.slice(1), color: hex }; m.mats.push(x); MAT.set(id, x); return id;
  }

  function menu(id, items) {
    const el = $(id), abierto = !el.classList.contains('oculto');
    document.querySelectorAll('.menu').forEach(x => x.classList.add('oculto')); if (abierto) return;
    el.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : it.tit ? `<div class="tit">${it.tit}</div>` : `<button data-i="${i}" class="${it.on ? 'on' : ''}">${it.ico ? icono(it.ico) : ''}${it.t}</button>`).join('');
    el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { el.classList.add('oculto'); items[+b.dataset.i].fn(); });
    el.classList.remove('oculto');
  }
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.menu') && !e.target.closest('#bVistas,#bMenu')) document.querySelectorAll('.menu').forEach(x => x.classList.add('oculto')); }, true);
  $('bVistas').onclick = () => menu('menuVistas', [
    { tit: 'Vistas' }, { t: 'Isométrica', ico: 'cubo', fn: () => vista('iso') }, { t: 'Superior (planta)', fn: () => vista('superior') }, { t: 'Frontal', fn: () => vista('frontal') }, { t: 'Derecha', fn: () => vista('derecha') }, { t: 'Posterior', fn: () => vista('posterior') }, { t: 'Izquierda', fn: () => vista('izquierda') }, '-',
    { t: 'Perspectiva', on: !cam.orto, fn: () => { cam.orto = false; pedir(); } }, { t: 'Proyección paralela', on: cam.orto, fn: () => { cam.orto = true; const bb = m.caja(); cam.altoOrto = bb ? Math.max(2, V.dist(cam.eye, V.mul(V.add(bb[0], bb[1]), .5)) * 0.62) : 12; pedir(); } }, '-',
    { t: 'Mostrar ejes', on: AJ.ejes, fn: () => { AJ.ejes = !AJ.ejes; guardarAjustes(); estVer++; pedir(); } },
    { t: 'Mostrar aristas suaves', on: AJ.aristasSuaves, fn: () => { AJ.aristasSuaves = !AJ.aristasSuaves; guardarAjustes(); estVer++; pedir(); } }
  ]);
  $('bRayos').onclick = () => { if (vis) { vis.rayos = !vis.rayos; pintarBotones(); pedir(); } };
  $('bExt').onclick = () => verTodo();
  $('bMat').onclick = () => { $('pMat').classList.toggle('oculto'); pintarMateriales(); };
  document.querySelectorAll('[data-cerrar]').forEach(b => { b.innerHTML = icono('cerrar'); b.onclick = () => $(b.dataset.cerrar).classList.add('oculto'); });
  $('bDeshacer').onclick = deshacer; $('bRehacer').onclick = rehacerOp;
  $('ctxSalir').onclick = () => { limpiarSel(); salirContexto(); };
  $('bMenu').onclick = () => menu('menuPpal', [
    { tit: 'Modelo' },
    { t: 'Importar (.dae .obj .stl)', ico: 'importar', fn: () => elegirArchivo(false) },
    { t: 'Exportar…', ico: 'exportar', fn: dlgExportar },
    { t: 'Renombrar', ico: 'lapiz', fn: renombrar },
    { t: 'Seleccionar todo', ico: 'todo', fn: seleccionarTodo },
    { t: 'Información del modelo', ico: 'ayuda', fn: infoModelo }, '-',
    { tit: 'App' },
    { t: 'Ajustes', ico: 'ajustes', fn: dlgAjustes },
    { t: 'Gestos y atajos', ico: 'ayuda', fn: dlgAyuda },
    { t: 'Mi cuenta RAIKI', ico: 'cuenta', fn: () => window.RaikiAcceso && RaikiAcceso.verCuenta() },
    { t: 'Buscar actualizaciones', ico: 'importar', fn: () => buscarActualizacion(true) }
  ]);
  $('bAtras').onclick = async () => { if (herr && herr.cancelar) herr.cancelar(); await guardar(); irGaleria(); };
  $('bNombre').onclick = renombrar;

  function avisar(t) { const a = $('aviso'); a.textContent = t; a.classList.add('ver'); clearTimeout(avisar.t); avisar.t = setTimeout(() => a.classList.remove('ver'), 2200); }
  function dialogo(html, alPintar) { $('dlgCaja').innerHTML = html; $('dialogo').classList.remove('oculto'); if (alPintar) alPintar(); }
  function cerrarDlg() { $('dialogo').classList.add('oculto'); }
  $('dialogo').addEventListener('pointerdown', e => { if (e.target.id === 'dialogo') cerrarDlg(); });
  function renombrar() {
    dialogo(`<h3>Nombre del modelo</h3><input type="text" id="dNom" value="${esc(doc.nombre)}"><div class="fila"><button id="dNo">Cancelar</button><button class="pri" id="dSi">Guardar</button></div>`, () => {
      const i = $('dNom'); i.focus(); i.select();
      const ok = () => { doc.nombre = i.value.trim() || 'Sin título'; $('bNombre').textContent = doc.nombre; cerrarDlg(); guardar(); };
      $('dSi').onclick = ok; $('dNo').onclick = cerrarDlg; i.onkeydown = e => { if (e.key === 'Enter') ok(); };
    });
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function infoModelo() {
    const bb = m.caja(); let area = 0; for (const f of m.f.values()) area += m.areaCara(f);
    dialogo(`<h3>${esc(doc.nombre)}</h3><p>${m.f.size} caras · ${m.e.size} aristas · ${m.grupos.size} grupos · ${m.cotas.length} cotas</p>
      ${bb ? `<p>Tamaño: ${fmt(bb[1][0] - bb[0][0])} × ${fmt(bb[1][1] - bb[0][1])} × ${fmt(bb[1][2] - bb[0][2])} (alto)<br>Área de todas las caras: ${area.toFixed(2)} m²</p>` : ''}
      <div class="fila"><button class="pri" id="dOk">Listo</button></div>`, () => $('dOk').onclick = cerrarDlg);
  }
  function dlgAjustes() {
    dialogo(`<h3>Ajustes</h3>
      <label>Unidades</label><select id="aU"><option value="m">Metros</option><option value="cm">Centímetros</option><option value="mm">Milímetros</option></select>
      <label>Decimales (metros)</label><select id="aD"><option>2</option><option>3</option></select>
      <label>Lápiz</label><select id="aL"><option value="auto">Automático: si hay lápiz, el lápiz dibuja y los dedos mueven la vista</option><option value="siempre">Siempre en modo lápiz</option><option value="nunca">Sin lápiz: el dedo también dibuja</option></select>
      <div class="fila"><button class="pri" id="dOk">Listo</button></div>`, () => {
      $('aU').value = AJ.unidad; $('aD').value = String(AJ.decimales); $('aL').value = AJ.lapiz;
      $('dOk').onclick = () => { AJ.unidad = $('aU').value; AJ.decimales = +$('aD').value; AJ.lapiz = $('aL').value; modoLapiz = AJ.lapiz === 'siempre' || (AJ.lapiz === 'auto' && modoLapiz); if (AJ.lapiz === 'nunca') modoLapiz = false; guardarAjustes(); cerrarDlg(); pista(); pintarSelBar(); pedir(); };
    });
  }
  function dlgAyuda() {
    dialogo(`<h3>Gestos y atajos</h3><ul class="ayuda">
      <li><b>Con lápiz:</b> el lápiz usa la herramienta; 1 dedo gira la vista; 2 dedos desplazan y hacen zoom.</li>
      <li><b>Sin lápiz:</b> 1 dedo usa la herramienta; 2 dedos giran y hacen zoom; 3 dedos desplazan.</li>
      <li><b>Toque con 2 dedos</b> = deshacer · <b>con 3 dedos</b> = rehacer.</li>
      <li>Las herramientas funcionan <b>tocando dos veces</b> (inicio y fin) o <b>arrastrando</b>.</li>
      <li><b>Medidas:</b> mientras dibujas, toca la caja de abajo a la derecha y escribe el valor exacto (3;4 para un rectángulo, 36l para los lados de un círculo, x3 para repetir copias).</li>
      <li><b>Ejes:</b> la línea se pone roja, verde o azul cuando va paralela a un eje; usa los botones X Y Z para bloquearla.</li>
      <li><b>Grupos:</b> selecciona y toca «Agrupar». Dos toques sobre un grupo para editarlo por dentro.</li>
      <li>Teclado: L línea · R rectángulo · C círculo · A arco · G polígono · P empujar · M mover · Q rotar · S escala · F equidistancia · T cinta · D cota · E borrador · B pintar · Espacio seleccionar · Ctrl+Z deshacer · flechas bloquean ejes.</li>
    </ul><div class="fila"><button class="pri" id="dOk">Entendido</button></div>`, () => $('dOk').onclick = cerrarDlg);
  }
  function dlgExportar() {
    dialogo(`<h3>Exportar</h3><p>Para abrir en SketchUp u otro programa usa COLLADA (.dae).</p><div class="opc">
      <button data-f="dae">${icono('exportar')} COLLADA (.dae) — SketchUp, Blender, Revit</button>
      <button data-f="obj">${icono('exportar')} OBJ (.obj)</button>
      <button data-f="stl">${icono('exportar')} STL (.stl) — impresión 3D</button>
      <button data-f="r3d">${icono('exportar')} Flexio (.r3d) — copia completa</button>
      <button data-f="png">${icono('exportar')} Imagen (.png)</button></div>
      <div class="fila"><button id="dNo">Cerrar</button></div>`, () => {
      $('dNo').onclick = cerrarDlg;
      document.querySelectorAll('#dlgCaja [data-f]').forEach(b => b.onclick = async () => { cerrarDlg(); await exportar(b.dataset.f); });
    });
  }
  const nombreArchivo = ext => (doc.nombre || 'Modelo').replace(/[^\w\- áéíóúñÁÉÍÓÚÑ]/g, '').trim().replace(/\s+/g, '_') + '.' + ext;
  async function exportar(f) {
    let blob;
    if (f === 'dae') blob = Archivos.aDAE(m, doc.nombre);
    else if (f === 'obj') blob = Archivos.aOBJ(m, doc.nombre);
    else if (f === 'stl') blob = Archivos.aSTL(m);
    else if (f === 'r3d') blob = new Blob([JSON.stringify({ nombre: doc.nombre, modelo: m.serializar() })], { type: 'application/json' });
    else if (f === 'png') blob = await captura(2);
    await Archivos.entregar(blob, nombreArchivo(f), avisar);
  }
  function captura(escala, ancho) {
    return new Promise(ok => {
      cuadro();
      const c = document.createElement('canvas'); const w = ancho || cvGL.width, h = ancho ? Math.round(ancho * cvGL.height / cvGL.width) : cvGL.height;
      c.width = w; c.height = h; const x = c.getContext('2d');
      const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fbfcfd'); gr.addColorStop(.58, '#eef1f4'); gr.addColorStop(1, '#e4e7ea'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      x.drawImage(cvGL, 0, 0, w, h); x.drawImage(cvOV, 0, 0, w, h);
      c.toBlob(b => ok(b), 'image/png');
    });
  }
  async function miniatura() {
    if (!vis) return null;
    const ojo = cam.eye.slice(), y = cam.yaw, p = cam.pitch, o = cam.orto;
    cuadro();
    const c = document.createElement('canvas'); c.width = 360; c.height = 270; const x = c.getContext('2d');
    x.fillStyle = '#f2f4f6'; x.fillRect(0, 0, 360, 270);
    const s = Math.max(360 / cvGL.width, 270 / cvGL.height), w = cvGL.width * s, h = cvGL.height * s;
    x.drawImage(cvGL, (360 - w) / 2, (270 - h) / 2, w, h);
    return c.toDataURL('image/jpeg', 0.8);
  }

  // ---------------- archivos ----------------
  let importarEnNuevo = false;
  function elegirArchivo(nuevo) { importarEnNuevo = nuevo; const i = $('archivo'); i.value = ''; i.click(); }
  $('archivo').onchange = async () => {
    const f = $('archivo').files[0]; if (!f) return;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    try {
      if (ext === 'r3d' || ext === 'json') {
        const d = JSON.parse(await f.text()); const mod = d.modelo || d;
        if (importarEnNuevo || !doc.id) { await abrirNuevo(d.nombre || f.name.replace(/\.\w+$/, ''), mod); avisar('Modelo abierto'); }
        else { operacion(() => { const otro = new Modelo(); otro.cargar(mod); fusionarModelo(otro); }); avisar('Modelo insertado'); }
        return;
      }
      if (ext === 'skp') return dialogo(`<h3>Archivo de SketchUp (.skp)</h3><p>El formato .skp es cerrado y solo lo puede leer SketchUp. En SketchUp ve a <b>Archivo → Exportar → Modelo 3D</b> y elige <b>COLLADA (.dae)</b>; ese archivo sí se abre aquí con sus colores y medidas.</p><div class="fila"><button class="pri" id="dOk">Entendido</button></div>`, () => $('dOk').onclick = cerrarDlg);
      let datos;
      if (ext === 'stl') datos = Archivos.leerSTL(await f.arrayBuffer());
      else if (ext === 'obj') datos = Archivos.leerOBJ(await f.text());
      else if (ext === 'dae') datos = Archivos.leerDAE(await f.text());
      else return avisar('Formato no soportado: .' + ext);
      if (!datos.polis.length) return avisar('El archivo no tiene geometría');
      const nombre = f.name.replace(/\.\w+$/, '');
      const seguir = async (escala, yArriba) => {
        if (importarEnNuevo || !doc.id) await abrirNuevo(nombre, null);
        avisar('Importando ' + datos.polis.length + ' caras…');
        await new Promise(r => setTimeout(r, 30));
        let res; operacion(() => { res = Archivos.aModelo(m, datos, escala, yArriba, nombre, colorAMat); });
        registrarMatsModelo(); verTodo(); avisar('Importado: ' + nombre); guardar();
      };
      if (ext === 'dae') return seguir(datos.unidad || 1, datos.yArriba);
      // OBJ/STL: preguntar unidades
      let mx = 0; for (const p of datos.polis) for (const q of p.p) mx = Math.max(mx, Math.abs(q[0]), Math.abs(q[1]), Math.abs(q[2]));
      const sug = mx > 2000 ? 'mm' : mx > 300 ? 'cm' : mx > 120 ? 'in' : 'm';
      dialogo(`<h3>Importar ${esc(f.name)}</h3><p>¿En qué unidades está el archivo?</p><select id="iU"><option value="m">Metros</option><option value="cm">Centímetros</option><option value="mm">Milímetros</option><option value="in">Pulgadas</option></select>
        <label class="chk" style="margin-top:12px;color:inherit"><input type="checkbox" id="iY" ${datos.yArriba ? 'checked' : ''}> El archivo usa Y hacia arriba</label>
        <div class="fila"><button id="dNo">Cancelar</button><button class="pri" id="dSi">Importar</button></div>`, () => {
        $('iU').value = sug; $('dNo').onclick = cerrarDlg;
        $('dSi').onclick = () => { const u = { m: 1, cm: 0.01, mm: 0.001, in: 0.0254 }[$('iU').value]; const ya = $('iY').checked; cerrarDlg(); seguir(u, ya); };
      });
    } catch (e) { console.error(e); avisar('No se pudo abrir: ' + e.message); }
  };
  function fusionarModelo(otro) {
    const d = otro.serializar(), mapa = new Map(); const nid = x => { if (!mapa.has(x)) mapa.set(x, m.id()); return mapa.get(x); };
    for (const g of d.grupos) m.grupos.set(nid(g[0]), { id: nid(g[0]), nombre: g[1] });
    const gid = m.id(); m.grupos.set(gid, { id: gid, nombre: 'Insertado' });
    const gm = g => g ? nid(g) : gid;
    const vmap = new Map(); for (const v of d.v) vmap.set(v[0], m.crearVert([v[1], v[2], v[3]], gm(v[4])));
    for (const e of d.e) { const id = m.arista(vmap.get(e[1]), vmap.get(e[2]), gm(e[3]), { s: e[4], c: e[5] }); }
    for (const f of d.f) m.cara(f[1].map(L => L.map(v => vmap.get(v))), gm(f[2]), { mat: f[3], matB: f[4], sg: f[5] });
    for (const mm of d.mats || []) if (!m.mats.some(x => x.id === mm.id)) { m.mats.push(mm); MAT.set(mm.id, mm); }
  }

  // ---------------- guardar / abrir ----------------
  let guardando = false;
  async function guardar() {
    if (!doc.id || guardando) return; guardando = true;
    try {
      const reg = { id: doc.id, nombre: doc.nombre, fecha: Date.now(), datos: m.clonarDatos(), cam: { eye: cam.eye, yaw: cam.yaw, pitch: cam.pitch, orto: cam.orto, alto: cam.altoOrto } };
      reg.mini = await miniatura();
      await Archivos.Almacen.guardar(reg);
    } catch (e) { console.error(e); }
    guardando = false;
  }
  addEventListener('pagehide', () => guardar());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') guardar(); });
  async function abrirNuevo(nombre, datos) {
    doc = { id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nombre: nombre || 'Sin título' };
    m.limpiar(); if (datos) m.cargar(datos); registrarMatsModelo();
    pila.length = 0; rehacer.length = 0;
    cam.eye = [9, -12, 7]; cam.apuntar([0, 0, 1]); cam.orto = false;
    mostrarEditor(); if (datos) verTodo(); await guardar();
  }
  async function abrir(id) {
    const reg = await Archivos.Almacen.leer(id); if (!reg) return;
    doc = { id: reg.id, nombre: reg.nombre };
    m.cargar(JSON.parse(reg.datos)); registrarMatsModelo(); pila.length = 0; rehacer.length = 0;
    mostrarEditor();
    if (reg.cam) { cam.eye = reg.cam.eye; cam.yaw = reg.cam.yaw; cam.pitch = reg.cam.pitch; cam.orto = reg.cam.orto; cam.altoOrto = reg.cam.alto || 12; } else verTodo();
    pedir();
  }
  function mostrarEditor() {
    $('galeria').classList.add('oculto'); $('editor').classList.remove('oculto');
    $('bNombre').textContent = doc.nombre; limpiarSel(); salirContexto();
    tamano(); usar(nombreHerr === 'orbitar' || nombreHerr === 'desplazar' ? 'seleccionar' : (nombreHerr || 'seleccionar')); pintarBotones(); pintarMateriales();
    construido = -1; pedir();
  }
  async function irGaleria() {
    $('editor').classList.add('oculto'); $('galeria').classList.remove('oculto');
    let L = []; try { L = await Archivos.Almacen.todos(); } catch (e) {}
    L.sort((a, b) => b.fecha - a.fecha);
    const g = $('gLista');
    if (!L.length) { g.innerHTML = `<div class="gal-vacia">Todavía no tienes modelos.<br>Toca <b>Nuevo modelo</b> para empezar o <b>Importar</b> un .dae de SketchUp.</div>`; return; }
    g.innerHTML = L.map(r => `<div class="tarjeta"><button data-abrir="${r.id}" style="display:block;width:100%;text-align:left">${r.mini ? `<img class="mini" src="${r.mini}" alt="">` : '<span class="mini"></span>'}<div class="inf"><b>${esc(r.nombre)}</b><small>${new Date(r.fecha).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}</small></div></button><button class="mas" data-mas="${r.id}">⋯</button></div>`).join('');
    g.querySelectorAll('[data-abrir]').forEach(b => b.onclick = () => abrir(b.dataset.abrir));
    g.querySelectorAll('[data-mas]').forEach(b => b.onclick = () => opcionesModelo(L.find(r => r.id === b.dataset.mas)));
  }
  function opcionesModelo(r) {
    dialogo(`<h3>${esc(r.nombre)}</h3><div class="opc"><button id="oAbrir">${icono('cubo')} Abrir</button><button id="oDup">${icono('copiar')} Duplicar</button><button id="oExp">${icono('exportar')} Guardar copia (.r3d)</button><button id="oBorrar" style="color:#d64545">${icono('papelera')} Eliminar</button></div><div class="fila"><button id="dNo">Cerrar</button></div>`, () => {
      $('dNo').onclick = cerrarDlg; $('oAbrir').onclick = () => { cerrarDlg(); abrir(r.id); };
      $('oDup').onclick = async () => { cerrarDlg(); await Archivos.Almacen.guardar(Object.assign({}, r, { id: 'm' + Date.now().toString(36), nombre: r.nombre + ' (copia)', fecha: Date.now() })); irGaleria(); };
      $('oExp').onclick = async () => { cerrarDlg(); await Archivos.entregar(new Blob([JSON.stringify({ nombre: r.nombre, modelo: JSON.parse(r.datos) })], { type: 'application/json' }), r.nombre.replace(/\s+/g, '_') + '.r3d', avisar); };
      $('oBorrar').onclick = () => dialogo(`<h3>¿Eliminar “${esc(r.nombre)}”?</h3><p>No se puede deshacer.</p><div class="fila"><button id="dNo">Cancelar</button><button class="peligro" id="dSi">Eliminar</button></div>`, () => { $('dNo').onclick = cerrarDlg; $('dSi').onclick = async () => { await Archivos.Almacen.borrar(r.id); cerrarDlg(); irGaleria(); }; });
    });
  }
  $('gNuevo').innerHTML = icono('mas') + 'Nuevo modelo'; $('gImportar').innerHTML = icono('importar') + 'Importar';
  $('gCuenta').innerHTML = icono('cuenta'); $('gAjustes').innerHTML = icono('ajustes');
  $('gNuevo').onclick = () => abrirNuevo('Modelo ' + new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }), null);
  $('gImportar').onclick = () => elegirArchivo(true);
  $('gCuenta').onclick = () => window.RaikiAcceso && RaikiAcceso.verCuenta();
  $('gAjustes').onclick = dlgAjustes;
  for (const [id, ic] of [['bAtras', 'atras'], ['bDeshacer', 'deshacer'], ['bRehacer', 'rehacer'], ['bVistas', 'cubo'], ['bRayos', 'rayos'], ['bExt', 'extension'], ['bMat', 'materiales'], ['bMenu', 'menu']]) $(id).innerHTML = icono(ic);

  // ---------------- actualizaciones (app de Android) ----------------
  const N = () => ES_APP && Capacitor.Plugins && Capacitor.Plugins.RaikiNative;
  async function buscarActualizacion(visible) {
    try {
      const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) throw 0; const v = await r.json();
      const n = N();
      if (n) {
        const inf = await n.info(); const inst = inf.version || '';
        if (v.apk && cmpVer(v.apk, inst) > 0) {
          return dialogo(`<h3>Nueva versión ${esc(v.apk)}</h3><p>Se descarga dentro de la app y Android te pedirá confirmar «Actualizar». Tus modelos se conservan.</p><div class="fila"><button id="dNo">Luego</button><button class="pri" id="dSi">Actualizar</button></div>`, () => {
            $('dNo').onclick = cerrarDlg;
            $('dSi').onclick = async () => { cerrarDlg(); await guardar(); let h; try { h = await n.addListener('updProgress', d => avisar('Descargando… ' + d.p + '%')); } catch (e) {}
              try { const res = await n.installUpdate({ url: 'https://github.com/riuk1126/oxenpro/releases/download/flexio-v' + v.apk + '/Flexio.apk' }); if (res && res.status === 'permission') avisar('Permite instalar apps de Flexio y vuelve a tocar Actualizar'); } catch (e) { avisar('No se pudo descargar la actualización'); }
              if (h && h.remove) h.remove(); };
          });
        }
      }
      if (visible) avisar('Tienes la última versión (' + (v.version || '') + ')');
    } catch (e) { if (visible) avisar('No se pudo comprobar (¿sin internet?)'); }
  }
  const cmpVer = (a, b) => { const A = String(a).split('.').map(Number), B = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((A[i] || 0) !== (B[i] || 0)) return (A[i] || 0) - (B[i] || 0); } return 0; };

  // ---------------- inicio ----------------
  pintarHerramientas(); pintarMateriales();
  herr = H.seleccionar;
  irGaleria();
  document.addEventListener('raiki-listo', () => setTimeout(() => buscarActualizacion(false), 3000), { once: true });
  window.R3D = { m, cam, H, usar, inferir, abrirNuevo, verTodo, vista, est, operacion, pedir, guardar, exportar, avisar }; // para pruebas
})();
