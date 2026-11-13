// RAIKI 3D — guardar en el equipo, importar (.dae .obj .stl .r3d) y exportar (.r3d .dae .obj .stl).
(function (G) {
  'use strict';
  const { V, MAT } = G.R3;

  // ---------------- almacenamiento local (IndexedDB) ----------------
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((ok, mal) => {
      const r = indexedDB.open('raiki3d', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('modelos', { keyPath: 'id' });
      r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error);
    });
    return dbp;
  }
  async function tx(modo, fn) { const d = await db(); return new Promise((ok, mal) => { const t = d.transaction('modelos', modo); const s = t.objectStore('modelos'); const r = fn(s); t.oncomplete = () => ok(r && r.result); t.onerror = () => mal(t.error); }); }
  const Almacen = {
    todos: () => tx('readonly', s => s.getAll()),
    leer: id => tx('readonly', s => s.get(id)),
    guardar: reg => tx('readwrite', s => s.put(reg)),
    borrar: id => tx('readwrite', s => s.delete(id))
  };

  // ---------------- importar ----------------
  // Todos los lectores devuelven { polis: [{ p:[[x,y,z]...], c:'#rrggbb'|null }], unidad: metros por unidad (o null), yArriba }
  function leerSTL(buf) {
    const dv = new DataView(buf), polis = [];
    const txt = new TextDecoder().decode(new Uint8Array(buf, 0, Math.min(buf.byteLength, 300)));
    const n = buf.byteLength >= 84 ? dv.getUint32(80, true) : 0;
    if (!(n && 84 + n * 50 === buf.byteLength) && /^\s*solid/i.test(txt)) {
      const s = new TextDecoder().decode(buf); const re = /vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g; let m, t = [];
      while ((m = re.exec(s))) { t.push([+m[1], +m[2], +m[3]]); if (t.length === 3) { polis.push({ p: t }); t = []; } }
      return { polis, unidad: null };
    }
    for (let i = 0; i < n; i++) {
      const o = 84 + i * 50, t = [];
      for (let k = 0; k < 3; k++) t.push([dv.getFloat32(o + 12 + k * 12, true), dv.getFloat32(o + 16 + k * 12, true), dv.getFloat32(o + 20 + k * 12, true)]);
      polis.push({ p: t });
    }
    return { polis, unidad: null };
  }
  function leerOBJ(txt) {
    const vs = [], polis = []; let color = null;
    const paleta = {}; let k = 0;
    for (const lin of txt.split(/\r?\n/)) {
      const t = lin.trim().split(/\s+/);
      if (t[0] === 'v') vs.push([+t[1], +t[2], +t[3]]);
      else if (t[0] === 'usemtl') { const nm = t.slice(1).join(' '); if (!paleta[nm]) paleta[nm] = colorDeNombre(nm, k++); color = paleta[nm]; }
      else if (t[0] === 'f') {
        const p = [];
        for (let i = 1; i < t.length; i++) { let ix = parseInt(t[i].split('/')[0], 10); if (ix < 0) ix = vs.length + ix + 1; if (vs[ix - 1]) p.push(vs[ix - 1]); }
        if (p.length >= 3) polis.push({ p, c: color });
      }
    }
    return { polis, unidad: null, yArriba: true };
  }
  function colorDeNombre(nm, k) {
    const m = nm.match(/([0-9a-f]{6})/i); if (m) return '#' + m[1];
    const pal = ['#d9d4c7', '#a9b8c9', '#c79a7a', '#8fa07a', '#b9b9b9', '#d1b98a', '#7f8fa6', '#c4c4a8'];
    return pal[k % pal.length];
  }
  function leerDAE(txt) {
    const doc = new DOMParser().parseFromString(txt, 'application/xml');
    const q = (el, s) => el.getElementsByTagName(s);
    const unidadEl = q(doc, 'unit')[0]; const unidad = unidadEl ? parseFloat(unidadEl.getAttribute('meter')) || 1 : 1;
    const upEl = q(doc, 'up_axis')[0]; const yArriba = upEl ? /Y_UP/i.test(upEl.textContent) : false;
    const porId = {}; for (const el of doc.getElementsByTagName('*')) { const id = el.getAttribute('id'); if (id) porId[id] = el; }
    const ref = s => porId[(s || '').replace(/^#/, '')];
    const nums = el => el.textContent.trim().split(/\s+/).map(Number);
    // colores de los materiales
    const colorMat = {};
    for (const m of q(doc, 'material')) {
      const ie = q(m, 'instance_effect')[0]; const ef = ie && ref(ie.getAttribute('url')); if (!ef) continue;
      const dif = q(ef, 'diffuse')[0]; let c = null;
      if (dif) { const col = q(dif, 'color')[0]; if (col) { const v = nums(col); c = '#' + v.slice(0, 3).map(x => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0')).join(''); } else c = '#cbbfae'; }
      colorMat[m.getAttribute('id')] = c;
    }
    const cacheGeo = {};
    function geometria(gid, ligas) {
      const g = porId[gid]; if (!g) return [];
      const mesh = q(g, 'mesh')[0]; if (!mesh) return [];
      const fuentes = {};
      const fuente = id => { if (fuentes[id]) return fuentes[id]; const s = ref(id); if (!s) return null; const fa = q(s, 'float_array')[0]; const acc = q(s, 'accessor')[0]; const st = acc ? +acc.getAttribute('stride') || 3 : 3; fuentes[id] = { d: nums(fa), st }; return fuentes[id]; };
      let posId = null; const vtx = q(mesh, 'vertices')[0];
      if (vtx) for (const inp of q(vtx, 'input')) if (inp.getAttribute('semantic') === 'POSITION') posId = inp.getAttribute('source');
      const res = [];
      for (const tag of ['triangles', 'polylist', 'polygons']) for (const prim of q(mesh, tag)) {
        const ins = [...q(prim, 'input')]; let off = 0, maxo = 0, src = posId;
        for (const inp of ins) { const o = +inp.getAttribute('offset'); maxo = Math.max(maxo, o); if (inp.getAttribute('semantic') === 'VERTEX') off = o; if (inp.getAttribute('semantic') === 'POSITION') { off = o; src = inp.getAttribute('source'); } }
        const st = maxo + 1, F = fuente(src); if (!F) continue;
        const sym = prim.getAttribute('material'); const color = colorMat[(ligas[sym] || '').replace(/^#/, '')] || null;
        const pt = i => [F.d[i * F.st], F.d[i * F.st + 1], F.d[i * F.st + 2]];
        if (tag === 'triangles') {
          const p = q(prim, 'p')[0]; if (!p) continue; const P = nums(p);
          for (let i = 0; i + 3 * st <= P.length; i += 3 * st) res.push({ p: [pt(P[i + off]), pt(P[i + st + off]), pt(P[i + 2 * st + off])], c: color });
        } else if (tag === 'polylist') {
          const vc = nums(q(prim, 'vcount')[0]); const P = nums(q(prim, 'p')[0]); let k = 0;
          for (const n of vc) { const pol = []; for (let j = 0; j < n; j++) pol.push(pt(P[(k + j) * st + off])); k += n; res.push({ p: pol, c: color }); }
        } else {
          for (const p of q(prim, 'p')) { const P = nums(p), pol = []; for (let j = 0; j < P.length; j += st) pol.push(pt(P[j + off])); res.push({ p: pol, c: color }); }
        }
      }
      return res;
    }
    const mulM = (a, b) => { const o = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) o[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j]; return o; }; // filas
    const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const aplicar = (M, p) => [M[0] * p[0] + M[1] * p[1] + M[2] * p[2] + M[3], M[4] * p[0] + M[5] * p[1] + M[6] * p[2] + M[7], M[8] * p[0] + M[9] * p[1] + M[10] * p[2] + M[11]];
    function matrizNodo(n) {
      let M = I;
      for (const c of n.children) {
        const t = c.tagName;
        if (t === 'matrix') M = mulM(M, nums(c));
        else if (t === 'translate') { const v = nums(c); M = mulM(M, [1, 0, 0, v[0], 0, 1, 0, v[1], 0, 0, 1, v[2], 0, 0, 0, 1]); }
        else if (t === 'scale') { const v = nums(c); M = mulM(M, [v[0], 0, 0, 0, 0, v[1], 0, 0, 0, 0, v[2], 0, 0, 0, 0, 1]); }
        else if (t === 'rotate') { const [x, y, z, a] = nums(c); const r = a * Math.PI / 180, cs = Math.cos(r), s = Math.sin(r), C = 1 - cs; M = mulM(M, [cs + x * x * C, x * y * C - z * s, x * z * C + y * s, 0, y * x * C + z * s, cs + y * y * C, y * z * C - x * s, 0, z * x * C - y * s, z * y * C + x * s, cs + z * z * C, 0, 0, 0, 0, 1]); }
      }
      return M;
    }
    const polis = []; let guard = 0;
    function nodo(n, M) {
      if (guard++ > 200000) return;
      M = mulM(M, matrizNodo(n));
      for (const c of n.children) {
        if (c.tagName === 'instance_geometry') {
          const ligas = {}; for (const im of q(c, 'instance_material')) ligas[im.getAttribute('symbol')] = im.getAttribute('target');
          const gid = c.getAttribute('url').replace(/^#/, '');
          const base = cacheGeo[gid + JSON.stringify(ligas)] || (cacheGeo[gid + JSON.stringify(ligas)] = geometria(gid, ligas));
          for (const pl of base) polis.push({ p: pl.p.map(p => aplicar(M, p)), c: pl.c });
        } else if (c.tagName === 'instance_node') { const r = ref(c.getAttribute('url')); if (r) nodo(r, M); }
        else if (c.tagName === 'node') nodo(c, M);
      }
    }
    const escena = q(doc, 'visual_scene')[0];
    if (escena) for (const c of escena.children) if (c.tagName === 'node') nodo(c, I);
    if (!polis.length) for (const g of q(doc, 'geometry')) polis.push(...geometria(g.getAttribute('id'), {}));
    return { polis, unidad, yArriba };
  }

  // Coloca los polígonos en el modelo como un grupo, uniendo triángulos coplanares en caras limpias
  function aModelo(m, datos, escala, yArriba, nombre, colorAMat) {
    const gid = m.id(); m.grupos.set(gid, { id: gid, nombre });
    const conv = yArriba ? p => [p[0] * escala, -p[2] * escala, p[1] * escala] : p => [p[0] * escala, p[1] * escala, p[2] * escala];
    let n = 0;
    for (const pl of datos.polis) {
      const L = []; for (const p of pl.p) { const id = m.vert(conv(p), gid); if (L[L.length - 1] !== id && L[0] !== id) L.push(id); else if (L[0] === id && L.length < 2) continue; }
      if (L.length < 3 || new Set(L).size !== L.length) continue;
      const P = L.map(i => m.P(i)); const nn = R3.normalNewell(P); if (V.len(nn) < 1e-12) continue;
      const mat = pl.c ? colorAMat(pl.c) : 0;
      m.cara([L], gid, { mat, matB: mat }); n++;
    }
    // unir coplanares
    let pasadas = 0, cambio = true;
    while (cambio && pasadas++ < 3) {
      cambio = false;
      for (const e of [...m.e.keys()]) { const E = m.e.get(e); if (!E || E.g !== gid) continue; if (m.unirPorArista(e)) cambio = true; }
    }
    for (const v of [...m.v.keys()]) { const vv = m.v.get(v); if (vv && vv.g === gid) m.sanarVert(v); }
    // aristas suaves entre caras casi tangentes (superficies curvas)
    let sg = gid;
    for (const E of m.e.values()) {
      if (E.g !== gid) continue; const cs = [...m.ef.get(E.id)]; if (cs.length !== 2) continue;
      const a = m.f.get(cs[0]), b = m.f.get(cs[1]);
      if (V.dot(a.n, b.n) > Math.cos(25 * Math.PI / 180)) { E.s = 1; a.sg = a.sg || sg; b.sg = b.sg || sg; }
    }
    m.todoSucio = true; m.cambio++;
    return { gid, caras: n };
  }

  // ---------------- exportar ----------------
  function triangulosModelo(m) {
    const out = []; // [p1,p2,p3,n,mat]
    for (const f of m.f.values()) { const t = m.triangulos(f); for (let i = 0; i < t.length; i += 3) out.push([m.P(t[i]), m.P(t[i + 1]), m.P(t[i + 2]), f.n, f.mat]); }
    return out;
  }
  function aSTL(m) {
    const T = triangulosModelo(m), buf = new ArrayBuffer(84 + T.length * 50), dv = new DataView(buf);
    const cab = 'RAIKI 3D - STL en metros'; for (let i = 0; i < cab.length; i++) dv.setUint8(i, cab.charCodeAt(i));
    dv.setUint32(80, T.length, true);
    T.forEach((t, i) => { const o = 84 + i * 50; const w = (k, v) => { dv.setFloat32(o + k * 12, v[0], true); dv.setFloat32(o + k * 12 + 4, v[1], true); dv.setFloat32(o + k * 12 + 8, v[2], true); }; w(0, t[3]); w(1, t[0]); w(2, t[1]); w(3, t[2]); });
    return new Blob([buf], { type: 'model/stl' });
  }
  function aOBJ(m, nombre) {
    const lines = ['# RAIKI 3D — ' + nombre, '# unidades: metros, Z arriba'], idx = new Map(); let k = 0;
    for (const v of m.v.values()) { idx.set(v.id, ++k); lines.push('v ' + v.p.map(x => +x.toFixed(6)).join(' ')); }
    let actual = null;
    for (const f of m.f.values()) {
      const mat = MAT.get(f.mat) || MAT.get(0);
      if (actual !== mat.id) { actual = mat.id; lines.push('usemtl ' + mat.nombre.replace(/\s+/g, '_') + '_' + mat.color.slice(1)); }
      if (f.loops.length === 1) lines.push('f ' + f.loops[0].map(i => idx.get(i)).join(' '));
      else { const t = m.triangulos(f); for (let i = 0; i < t.length; i += 3) lines.push('f ' + idx.get(t[i]) + ' ' + idx.get(t[i + 1]) + ' ' + idx.get(t[i + 2])); }
    }
    return new Blob([lines.join('\n')], { type: 'model/obj' });
  }
  function aDAE(m, nombre) {
    const porMat = new Map();
    for (const f of m.f.values()) { const t = m.triangulos(f); if (!porMat.has(f.mat)) porMat.set(f.mat, []); const L = porMat.get(f.mat); for (const i of t) L.push(m.P(i)); }
    const x = s => String(s).replace(/[<&"]/g, c => ({ '<': '&lt;', '&': '&amp;', '"': '&quot;' }[c]));
    let efectos = '', mats = '', geos = '', inst = '';
    let k = 0;
    for (const [mid, pts] of porMat) {
      const mat = MAT.get(mid) || MAT.get(0); const c = R3.hexRGB(mat.color); k++;
      efectos += `<effect id="ef${k}"><profile_COMMON><technique sid="c"><lambert><diffuse><color>${c.join(' ')} 1</color></diffuse>${mat.alfa ? `<transparency><float>${mat.alfa}</float></transparency>` : ''}</lambert></technique></profile_COMMON></effect>`;
      mats += `<material id="mat${k}" name="${x(mat.nombre)}"><instance_effect url="#ef${k}"/></material>`;
      const arr = pts.map(p => p.map(v => +v.toFixed(6)).join(' ')).join(' ');
      geos += `<geometry id="g${k}"><mesh><source id="g${k}p"><float_array id="g${k}a" count="${pts.length * 3}">${arr}</float_array><technique_common><accessor source="#g${k}a" count="${pts.length}" stride="3"><param name="X" type="float"/><param name="Y" type="float"/><param name="Z" type="float"/></accessor></technique_common></source><vertices id="g${k}v"><input semantic="POSITION" source="#g${k}p"/></vertices><triangles material="m${k}" count="${pts.length / 3}"><input semantic="VERTEX" source="#g${k}v" offset="0"/><p>${pts.map((_, i) => i).join(' ')}</p></triangles></mesh></geometry>`;
      inst += `<instance_geometry url="#g${k}"><bind_material><technique_common><instance_material symbol="m${k}" target="#mat${k}"/></technique_common></bind_material></instance_geometry>`;
    }
    const dae = `<?xml version="1.0" encoding="utf-8"?><COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1"><asset><contributor><authoring_tool>RAIKI 3D</authoring_tool></contributor><unit name="meter" meter="1"/><up_axis>Z_UP</up_axis></asset><library_effects>${efectos}</library_effects><library_materials>${mats}</library_materials><library_geometries>${geos}</library_geometries><library_visual_scenes><visual_scene id="escena"><node id="${x(nombre).replace(/\s+/g, '_')}">${inst}</node></visual_scene></library_visual_scenes><scene><instance_visual_scene url="#escena"/></scene></COLLADA>`;
    return new Blob([dae], { type: 'model/vnd.collada+xml' });
  }

  // ---------------- entregar un archivo (Android: Documentos + compartir) ----------------
  function blobB64(b) { return new Promise(r => { const f = new FileReader(); f.onload = () => r(String(f.result).split(',')[1]); f.readAsDataURL(b); }); }
  async function entregar(blob, nombre, avisar) {
    const C = window.Capacitor, P = C && C.Plugins;
    if (C && C.isNativePlatform && C.isNativePlatform() && P && P.Filesystem) {
      try {
        const data = await blobB64(blob); let guardado = false;
        try { await P.Filesystem.writeFile({ path: 'RAIKI 3D/' + nombre, data, directory: 'DOCUMENTS', recursive: true }); guardado = true; } catch (e) {}
        const r = await P.Filesystem.writeFile({ path: nombre, data, directory: 'CACHE' });
        avisar(guardado ? 'Guardado en Documentos/RAIKI 3D' : 'Archivo listo');
        if (P.Share) await P.Share.share({ title: nombre, files: [r.uri], dialogTitle: 'Compartir' }).catch(() => {});
        return;
      } catch (e) { console.error(e); }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    avisar('Archivo descargado');
  }

  G.R3.Archivos = { Almacen, leerSTL, leerOBJ, leerDAE, aModelo, aSTL, aOBJ, aDAE, entregar };
})(window);
