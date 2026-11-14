// Flexio — abrir archivos de SketchUp (.skp) y de AutoCAD (.dwg / .dxf).
// · SKP: lector OpenSKP (MIT) en WebAssembly → GLB → polígonos con sus colores (metros, Y arriba).
// · DWG/DXF: LibreDWG (GPL) en WebAssembly → entidades → líneas del plano (en el suelo, Z = 0).
// Los lectores se descargan solo la primera vez que se abre un archivo de ese tipo.
(function (G) {
  'use strict';
  const base = p => new URL(p, document.baseURI).href;

  // ======================= SKETCHUP =======================
  let skpMod = null;
  function moduloSKP() {
    if (!skpMod) skpMod = import(base('lib/skp/openskp.js')).then(m => m.default({ locateFile: f => base('lib/skp/' + f) }));
    skpMod.catch(() => { skpMod = null; });
    return skpMod;
  }
  async function leerSKP(buf) {
    const M = await moduloSKP();
    const r = M.parseSkpToGLB(new Uint8Array(buf));
    if (!r || r.error) throw new Error(r && r.error ? String(r.error) : 'no se pudo leer el .skp');
    const d = leerGLB(r.glbBytes);
    // El lector entrega cada cara dos veces (frente y reverso, con su color): se juntan en una sola cara de dos colores
    const k = p => p.map(q => q.map(x => x.toFixed(5)).join(',')).sort().join('|');
    const vistos = new Map(), polis = [];
    for (const t of d.polis) {
      const kk = k(t.p), o = vistos.get(kk);
      if (o) { if (o.cb === undefined) o.cb = t.c; continue; }
      vistos.set(kk, t); polis.push(t);
    }
    return { polis, unidad: 1, yArriba: true };
  }

  // GLB (glTF binario) → { polis:[{p:[[x,y,z]…], c}] }
  function leerGLB(bytes) {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('GLB no válido');
    let o = 12, json = null, bin = null;
    while (o + 8 <= u8.byteLength) {
      const len = dv.getUint32(o, true), tipo = dv.getUint32(o + 4, true);
      const datos = u8.subarray(o + 8, o + 8 + len);
      if (tipo === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(datos));
      else if (tipo === 0x004e4942) bin = datos;
      o += 8 + len;
    }
    if (!json) throw new Error('GLB sin datos');
    const hex = c => '#' + c.slice(0, 3).map(x => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0')).join('');
    const colores = (json.materials || []).map(mt => { const f = mt.pbrMetallicRoughness && mt.pbrMetallicRoughness.baseColorFactor; return f ? hex(f) : null; });
    const COMP = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }, N = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
    const cache = new Map();
    function acc(i) {
      if (cache.has(i)) return cache.get(i);
      const a = json.accessors[i], bv = json.bufferViews[a.bufferView], n = N[a.type], cs = COMP[a.componentType];
      const st = bv.byteStride || n * cs, ini = (bv.byteOffset || 0) + (a.byteOffset || 0);
      const d = new DataView(bin.buffer, bin.byteOffset + ini), out = new Array(a.count * n);
      const rd = a.componentType === 5126 ? k => d.getFloat32(k, true) : a.componentType === 5125 ? k => d.getUint32(k, true) : a.componentType === 5123 ? k => d.getUint16(k, true) : k => d.getUint8(k);
      for (let k = 0; k < a.count; k++) for (let j = 0; j < n; j++) out[k * n + j] = rd(k * st + j * cs);
      cache.set(i, out); return out;
    }
    // matrices columna-mayor (glTF)
    const mul = (a, b) => { const r = new Array(16); for (let c = 0; c < 4; c++) for (let f = 0; f < 4; f++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + f] * b[c * 4 + k]; r[c * 4 + f] = s; } return r; };
    const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    function local(n) {
      if (n.matrix) return n.matrix;
      const t = n.translation || [0, 0, 0], q = n.rotation || [0, 0, 0, 1], s = n.scale || [1, 1, 1];
      const [x, y, z, w] = q;
      const R = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0, 2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0, 2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0, 0, 0, 0, 1];
      for (let c = 0; c < 3; c++) for (let f = 0; f < 3; f++) R[c * 4 + f] *= s[c];
      R[12] = t[0]; R[13] = t[1]; R[14] = t[2]; return R;
    }
    const polis = []; let guard = 0;
    function nodo(i, M) {
      if (guard++ > 500000) return;
      const n = json.nodes[i]; M = mul(M, local(n));
      if (n.mesh != null) for (const pr of json.meshes[n.mesh].primitives) {
        if (pr.mode != null && pr.mode !== 4) continue;
        const P = acc(pr.attributes.POSITION), c = pr.material != null ? colores[pr.material] : null;
        const idx = pr.indices != null ? acc(pr.indices) : null, cnt = idx ? idx.length : P.length / 3;
        const pt = k => { const x = P[k * 3], y = P[k * 3 + 1], z = P[k * 3 + 2]; return [M[0] * x + M[4] * y + M[8] * z + M[12], M[1] * x + M[5] * y + M[9] * z + M[13], M[2] * x + M[6] * y + M[10] * z + M[14]]; };
        for (let k = 0; k + 2 < cnt; k += 3) { const a = idx ? idx[k] : k, b = idx ? idx[k + 1] : k + 1, d = idx ? idx[k + 2] : k + 2; polis.push({ p: [pt(a), pt(b), pt(d)], c }); }
      }
      for (const h of n.children || []) nodo(h, M);
    }
    const esc = json.scenes ? json.scenes[json.scene || 0] : null;
    for (const r of esc ? esc.nodes : json.nodes.map((_, i) => i)) nodo(r, I);
    return { polis };
  }

  // ======================= AUTOCAD =======================
  let dwgMod = null;
  function moduloDWG() {
    if (!dwgMod) dwgMod = import(base('lib/dwg/lib/index.js')).then(async L => ({ L, lib: await L.LibreDwg.create(base('lib/dwg/wasm')) }));
    dwgMod.catch(() => { dwgMod = null; });
    return dwgMod;
  }
  // metros por unidad según INSUNITS
  const UNIDADES = { 1: 0.0254, 2: 0.3048, 4: 0.001, 5: 0.01, 6: 1, 14: 0.1 };

  async function leerCAD(buf, ext) {
    if (ext === 'dxf') {
      const txt = new TextDecoder('utf-8').decode(new Uint8Array(buf));
      if (!/^AutoCAD Binary DXF/.test(txt.slice(0, 22))) return entidadesAPlano(leerDXF(txt));
    }
    const { L, lib } = await moduloDWG();
    const tipo = ext === 'dxf' ? L.Dwg_File_Type.DXF : L.Dwg_File_Type.DWG;
    const ptr = lib.dwg_read_data(buf, tipo);
    if (!ptr) throw new Error('no se pudo leer el plano');
    let db; try { db = lib.convert(ptr); } finally { try { lib.dwg_free(ptr); } catch (e) {} }
    return entidadesAPlano(db);
  }

  // DXF de texto → la misma estructura que entrega LibreDWG (ángulos en radianes)
  function leerDXF(txt) {
    const L = txt.split(/\r\n|\r|\n/), pares = [];
    for (let i = 0; i + 1 < L.length; i += 2) pares.push([parseInt(L[i], 10), L[i + 1].trim()]);
    const RAD = Math.PI / 180;
    const header = {}, capas = [], bloques = [], entidades = [];
    let i = 0;
    const leerEnt = () => { // pares[i] = [0, TIPO]
      const e = { type: pares[i][1], _c: [] }; i++;
      while (i < pares.length && pares[i][0] !== 0) { e._c.push(pares[i]); i++; }
      return e;
    };
    const num = (e, g, d) => { for (const [c, v] of e._c) if (c === g) return parseFloat(v); return d; };
    const str = (e, g, d) => { for (const [c, v] of e._c) if (c === g) return v; return d; };
    const pto = (e, b) => ({ x: num(e, 10 + b, 0), y: num(e, 20 + b, 0), z: num(e, 30 + b, 0) });
    function convertir(e, sub) {
      const r = { type: e.type, layer: str(e, 8, '0'), isVisible: num(e, 60, 0) !== 1 };
      const ex = { x: num(e, 210, 0), y: num(e, 220, 0), z: num(e, 230, 1) }; r.extrusionDirection = ex;
      switch (e.type) {
        case 'LINE': r.startPoint = pto(e, 0); r.endPoint = pto(e, 1); break;
        case 'ARC': r.center = pto(e, 0); r.radius = num(e, 40, 0); r.startAngle = num(e, 50, 0) * RAD; r.endAngle = num(e, 51, 360) * RAD; break;
        case 'CIRCLE': r.center = pto(e, 0); r.radius = num(e, 40, 0); break;
        case 'ELLIPSE': r.center = pto(e, 0); r.majorAxisEndPoint = pto(e, 1); r.axisRatio = num(e, 40, 1); r.startAngle = num(e, 41, 0); r.endAngle = num(e, 42, Math.PI * 2); break;
        case 'LWPOLYLINE': {
          r.flag = num(e, 70, 0); r.elevation = num(e, 38, 0); r.vertices = []; let v = null;
          for (const [c, val] of e._c) { if (c === 10) { v = { x: +val, y: 0, bulge: 0 }; r.vertices.push(v); } else if (v && c === 20) v.y = +val; else if (v && c === 42) v.bulge = +val; }
          break;
        }
        case 'SPLINE': {
          r.flag = num(e, 70, 0); r.controlPoints = []; r.fitPoints = []; let v = null;
          for (const [c, val] of e._c) {
            if (c === 10) { v = { x: +val, y: 0, z: 0 }; r.controlPoints.push(v); } else if (c === 11) { v = { x: +val, y: 0, z: 0 }; r.fitPoints.push(v); }
            else if (v && (c === 20 || c === 21)) v.y = +val; else if (v && (c === 30 || c === 31)) v.z = +val;
          }
          break;
        }
        case 'INSERT': r.name = str(e, 2, ''); r.insertionPoint = pto(e, 0); r.xScale = num(e, 41, 1); r.yScale = num(e, 42, 1); r.zScale = num(e, 43, 1); r.rotation = num(e, 50, 0) * RAD; r.columnCount = num(e, 70, 1); r.rowCount = num(e, 71, 1); r.columnSpacing = num(e, 44, 0); r.rowSpacing = num(e, 45, 0); break;
        case '3DFACE': case 'SOLID': case 'TRACE': r.corner1 = pto(e, 0); r.corner2 = pto(e, 1); r.corner3 = pto(e, 2); r.corner4 = pto(e, 3); break;
        case 'POLYLINE': {
          r.flag = num(e, 70, 0); r.elevation = pto(e, 0).z; r.type = r.flag & 8 ? 'POLYLINE3D' : (r.flag & 64 ? 'POLYFACE' : 'POLYLINE2D');
          r.vertices = (sub || []).map(v => Object.assign(pto(v, 0), { bulge: num(v, 42, 0), flag: num(v, 70, 0) }));
          break;
        }
      }
      return r;
    }
    function leerEntidades(fin, destino) {
      while (i < pares.length) {
        const [c, v] = pares[i];
        if (c !== 0) { i++; continue; }
        if (v === fin || v === 'ENDSEC' || v === 'EOF') return;
        const e = leerEnt();
        if (e.type === 'POLYLINE') { const sub = []; while (i < pares.length && pares[i][1] === 'VERTEX') sub.push(leerEnt()); if (i < pares.length && pares[i][1] === 'SEQEND') leerEnt(); destino.push(convertir(e, sub)); }
        else destino.push(convertir(e));
      }
    }
    while (i < pares.length) {
      if (pares[i][0] === 0 && pares[i][1] === 'SECTION' && pares[i + 1]) {
        const nombre = pares[i + 1][1]; i += 2;
        if (nombre === 'HEADER') {
          while (i < pares.length && !(pares[i][0] === 0 && pares[i][1] === 'ENDSEC')) { if (pares[i][0] === 9 && pares[i][1] === '$INSUNITS' && pares[i + 1]) header.INSUNITS = parseInt(pares[i + 1][1], 10); i++; }
        } else if (nombre === 'TABLES') {
          while (i < pares.length && !(pares[i][0] === 0 && pares[i][1] === 'ENDSEC')) {
            if (pares[i][0] === 0 && pares[i][1] === 'LAYER') { const e = leerEnt(); const fl = num(e, 70, 0), col = num(e, 62, 7); capas.push({ name: str(e, 2, ''), frozen: !!(fl & 1), off: col < 0 }); }
            else i++;
          }
        } else if (nombre === 'BLOCKS') {
          while (i < pares.length && !(pares[i][0] === 0 && pares[i][1] === 'ENDSEC')) {
            if (pares[i][0] === 0 && pares[i][1] === 'BLOCK') { const e = leerEnt(); const b = { name: str(e, 2, ''), basePoint: pto(e, 0), entities: [] }; leerEntidades('ENDBLK', b.entities); bloques.push(b); if (i < pares.length && pares[i][1] === 'ENDBLK') leerEnt(); }
            else i++;
          }
        } else if (nombre === 'ENTITIES') { leerEntidades('ENDSEC', entidades); }
      } else i++;
    }
    return { header, entities: entidades, tables: { LAYER: { entries: capas }, BLOCK_RECORD: { entries: bloques.filter(b => !/^\*model_space$/i.test(b.name)) } } };
  }

  function entidadesAPlano(db) {
    const segs = [];      // [[x,y,z],[x,y,z]] en unidades del dibujo
    const capasOff = new Set();
    for (const c of (db.tables && db.tables.LAYER && db.tables.LAYER.entries) || []) if (c.off || c.frozen) capasOff.add(c.name);
    const bloques = new Map(); let ms = null;
    for (const b of (db.tables && db.tables.BLOCK_RECORD && db.tables.BLOCK_RECORD.entries) || []) {
      bloques.set(b.name, b);
      if (/^\*model_space$/i.test(b.name)) ms = b;
    }
    let ents = db.entities || [];
    if (ms) { const enMs = ents.filter(e => e.ownerBlockRecordSoftId === ms.handle); if (enMs.length) ents = enMs; else if (ms.entities && ms.entities.length) ents = ms.entities; }

    // transformaciones afines 2D+z: [a,b,c,d,e,f, sz, tz] → x' = a x + c y + e ; y' = b x + d y + f ; z' = sz z + tz
    const I = [1, 0, 0, 1, 0, 0, 1, 0];
    const comp = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5], A[6] * B[6], A[6] * B[7] + A[7]];
    const ap = (T, p) => [T[0] * p[0] + T[2] * p[1] + T[4], T[1] * p[0] + T[3] * p[1] + T[5], T[6] * (p[2] || 0) + T[7]];
    const P3 = q => [q.x || 0, q.y || 0, q.z || 0];
    const ocs = e => { const ex = e.extrusionDirection; return ex && ex.z < 0 ? [-1, 0, 0, 1, 0, 0, 1, 0] : I; };
    const lin = (T, pts, cerrar) => {
      for (let i = 0; i + 1 < pts.length; i++) segs.push([ap(T, pts[i]), ap(T, pts[i + 1])]);
      if (cerrar && pts.length > 2) segs.push([ap(T, pts[pts.length - 1]), ap(T, pts[0])]);
    };
    const nArco = (r, ang) => Math.max(4, Math.min(96, Math.ceil(Math.abs(ang) / (Math.PI * 2) * 48)));
    const arco = (c, r, a0, a1, z) => {
      let d = a1 - a0; while (d <= 0) d += Math.PI * 2;
      const n = nArco(r, d), out = [];
      for (let i = 0; i <= n; i++) { const a = a0 + d * i / n; out.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), z]); }
      return out;
    };
    // tramo con "bulge" (polilíneas con arcos)
    const conBulge = (V, cerrado, z) => {
      const out = []; const n = V.length;
      for (let i = 0; i < n; i++) {
        const a = V[i], b = V[(i + 1) % n]; out.push([a.x, a.y, z]);
        if (!cerrado && i === n - 1) break;
        const bu = a.bulge || 0;
        if (Math.abs(bu) > 1e-9) {
          const th = 4 * Math.atan(bu), dx = b.x - a.x, dy = b.y - a.y, cuerda = Math.hypot(dx, dy); if (cuerda < 1e-12) continue;
          const r = cuerda / (2 * Math.sin(Math.abs(th) / 2));
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, h = cuerda / (2 * Math.tan(th / 2));
          const cx = mx - dy / cuerda * h, cy = my + dx / cuerda * h;
          const a0 = Math.atan2(a.y - cy, a.x - cx); const m = nArco(r, th);
          for (let k = 1; k < m; k++) { const t = a0 + th * k / m; out.push([cx + r * Math.cos(t), cy + r * Math.sin(t), z]); }
        }
      }
      return out;
    };
    let profundidad = 0, omitidas = 0;
    function dibujar(e, T) {
      if (!e || e.isVisible === false || capasOff.has(e.layer)) return;
      const t = e.type;
      if (t === 'LINE') segs.push([ap(T, P3(e.startPoint)), ap(T, P3(e.endPoint))]);
      else if (t === 'LWPOLYLINE') { const V = e.vertices || []; if (V.length > 1) lin(comp(T, ocs(e)), conBulge(V, e.flag & 1, e.elevation || 0), e.flag & 1); }
      else if (t === 'POLYLINE2D') { const V = (e.vertices || []).filter(v => !(v.flag & 16)); if (V.length > 1) lin(comp(T, ocs(e)), conBulge(V, e.flag & 1, e.elevation || 0), e.flag & 1); }
      else if (t === 'POLYLINE3D') { const V = (e.vertices || []).filter(v => !(v.flag & 16)).map(P3); if (V.length > 1) lin(T, V, e.flag & 1); }
      else if (t === 'ARC') { const c = P3(e.center); lin(comp(T, ocs(e)), arco(c, e.radius, e.startAngle, e.endAngle, c[2]), false); }
      else if (t === 'CIRCLE') { const c = P3(e.center); const pts = arco(c, e.radius, 0, Math.PI * 2, c[2]); pts.pop(); lin(comp(T, ocs(e)), pts, true); }
      else if (t === 'ELLIPSE') {
        const c = P3(e.center), mj = P3(e.majorAxisEndPoint), R = Math.hypot(mj[0], mj[1]), r = R * e.axisRatio, rot = Math.atan2(mj[1], mj[0]);
        let a0 = e.startAngle || 0, a1 = e.endAngle; if (a1 == null || Math.abs(a1 - a0) < 1e-9) a1 = a0 + Math.PI * 2;
        let d = a1 - a0; while (d <= 0) d += Math.PI * 2; const n = nArco(R, d), pts = [];
        for (let i = 0; i <= n; i++) { const a = a0 + d * i / n, x = R * Math.cos(a), y = r * Math.sin(a); pts.push([c[0] + x * Math.cos(rot) - y * Math.sin(rot), c[1] + x * Math.sin(rot) + y * Math.cos(rot), c[2]]); }
        lin(comp(T, ocs(e)), pts, false);
      }
      else if (t === 'SPLINE') { const pts = (e.fitPoints && e.fitPoints.length > 1 ? e.fitPoints : e.controlPoints || []).map(P3); if (pts.length > 1) lin(T, pts, e.flag & 1); }
      else if (t === '3DFACE') { const pts = [e.corner1, e.corner2, e.corner3, e.corner4].filter(Boolean).map(P3); lin(T, pts.filter((p, i) => i === 0 || p.some((v, k) => Math.abs(v - pts[i - 1][k]) > 1e-9)), true); }
      else if (t === 'SOLID' || t === 'TRACE') { const c = [e.corner1, e.corner2, e.corner4 || e.corner3, e.corner3].map(P3); lin(comp(T, ocs(e)), c, true); }
      else if (t === 'INSERT') {
        const b = bloques.get(e.name); if (!b || !b.entities || profundidad > 12) return;
        const bp = P3(b.basePoint || {}), ip = P3(e.insertionPoint), sx = e.xScale || 1, sy = e.yScale || 1, sz = e.zScale || 1;
        const ro = e.rotation || 0, cs = Math.cos(ro), sn = Math.sin(ro);
        const nc = Math.max(1, e.columnCount || 1), nr = Math.max(1, e.rowCount || 1);
        for (let fi = 0; fi < nr; fi++) for (let ci = 0; ci < nc; ci++) {
          const ox = ci * (e.columnSpacing || 0), oy = fi * (e.rowSpacing || 0);
          const tx = ip[0] + cs * ox - sn * oy, ty = ip[1] + sn * ox + cs * oy;
          // M = trasladar(ins) · rotar · escalar · trasladar(-base)
          const Mloc = [cs * sx, sn * sx, -sn * sy, cs * sy, 0, 0, sz, ip[2] - sz * bp[2]];
          Mloc[4] = tx - (Mloc[0] * bp[0] + Mloc[2] * bp[1]); Mloc[5] = ty - (Mloc[1] * bp[0] + Mloc[3] * bp[1]);
          const Tn = comp(comp(T, ocs(e)), Mloc);
          profundidad++; for (const h of b.entities) dibujar(h, Tn); profundidad--;
        }
      }
      else omitidas++; // textos, cotas, sombreados, imágenes…
    }
    for (const e of ents) dibujar(e, I);
    // quitar segmentos de largo cero
    const limpios = segs.filter(s => Math.abs(s[0][0] - s[1][0]) + Math.abs(s[0][1] - s[1][1]) + Math.abs(s[0][2] - s[1][2]) > 1e-9);
    const h = db.header || {};
    let unidad = UNIDADES[h.INSUNITS] || null;
    return { segs: limpios, unidad, omitidas };
  }

  // Unidad sugerida si el plano no la dice: por el tamaño del dibujo
  function sugerirUnidad(segs) {
    let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
    for (const s of segs) for (const p of s) { if (p[0] < mnx) mnx = p[0]; if (p[0] > mxx) mxx = p[0]; if (p[1] < mny) mny = p[1]; if (p[1] > mxy) mxy = p[1]; }
    const t = Math.max(mxx - mnx, mxy - mny);
    return t > 3000 ? 'mm' : t > 300 ? 'cm' : 'm';
  }

  // Coloca las líneas del plano en el modelo, como un grupo apoyado en el suelo y centrado en el origen.
  // conCaras: arma las caras de las áreas cerradas (para empujar/tirar los muros).
  function planoAModelo(m, datos, escala, nombre, conCaras) {
    const R3 = G.R3;
    let mnx = Infinity, mny = Infinity, mnz = Infinity, mxx = -Infinity, mxy = -Infinity;
    for (const s of datos.segs) for (const p of s) { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mny = Math.min(mny, p[1]); mxy = Math.max(mxy, p[1]); mnz = Math.min(mnz, p[2]); }
    const cx = (mnx + mxx) / 2, cy = (mny + mxy) / 2;
    const conv = p => [+((p[0] - cx) * escala).toFixed(5), +((p[1] - cy) * escala).toFixed(5), +((p[2] - mnz) * escala).toFixed(5)];
    const gid = m.id(); m.grupos.set(gid, { id: gid, nombre });
    const aristas = []; let n = 0;
    for (const s of datos.segs) {
      const a = m.vert(conv(s[0]), gid), b = m.vert(conv(s[1]), gid);
      if (a === b || m.aristaEntre(a, b)) continue;
      aristas.push(m.arista(a, b, gid)); n++;
    }
    let caras = 0;
    if (conCaras && aristas.length <= 6000) { try { caras = m.buscarCaras(aristas, gid, [0, 0, -1]).length; } catch (e) { console.warn(e); } }
    m.todoSucio = true; m.cambio++;
    return { gid, lineas: n, caras, ancho: (mxx - mnx) * escala, largo: (mxy - mny) * escala };
  }

  G.R3.CAD = { leerSKP, leerGLB, leerCAD, sugerirUnidad, planoAModelo };
})(window);
