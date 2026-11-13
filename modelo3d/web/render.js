// RAIKI 3D — cámara y dibujo con WebGL (caras sombreadas, aristas nítidas de grosor real, ejes).
(function (G) {
  'use strict';
  const { V, ejesPlano } = G.R3;

  // ---------------- matrices 4x4 (columnas) ----------------
  const M4 = {
    mul(a, b) { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; },
    persp(fov, asp, n, f) { const t = 1 / Math.tan(fov / 2), o = new Float32Array(16); o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f); return o; },
    orto(w, h, n, f) { const o = new Float32Array(16); o[0] = 2 / w; o[5] = 2 / h; o[10] = -2 / (f - n); o[14] = -(f + n) / (f - n); o[15] = 1; return o; },
    mirar(eye, fwd, up) {
      const z = V.norm(V.neg(fwd)), x = V.norm(V.cross(up, z)), y = V.cross(z, x), o = new Float32Array(16);
      o[0] = x[0]; o[4] = x[1]; o[8] = x[2]; o[1] = y[0]; o[5] = y[1]; o[9] = y[2]; o[2] = z[0]; o[6] = z[1]; o[10] = z[2];
      o[12] = -V.dot(x, eye); o[13] = -V.dot(y, eye); o[14] = -V.dot(z, eye); o[15] = 1; return o;
    }
  };

  // ---------------- cámara (Z arriba) ----------------
  class Camara {
    constructor() { this.eye = [12, -16, 10]; this.yaw = 0; this.pitch = 0; this.fov = 35 * Math.PI / 180; this.orto = false; this.altoOrto = 12; this.w = 1; this.h = 1; this.apuntar([0, 0, 1]); }
    apuntar(p) { const d = V.sub(p, this.eye); this.yaw = Math.atan2(d[1], d[0]); this.pitch = Math.atan2(d[2], Math.hypot(d[0], d[1])); }
    adelante() { const c = Math.cos(this.pitch); return [Math.cos(this.yaw) * c, Math.sin(this.yaw) * c, Math.sin(this.pitch)]; }
    derecha() { return V.norm(V.cross(this.adelante(), [0, 0, 1])); }
    arriba() { return V.cross(this.derecha(), this.adelante()); }
    matrices() {
      const f = this.adelante();
      const up = Math.abs(f[2]) > 0.9999 ? [Math.cos(this.yaw), Math.sin(this.yaw), 0] : [0, 0, 1];
      const vista = M4.mirar(this.eye, f, up);
      const asp = this.w / this.h;
      const dist = this.distRef || 20;
      const near = Math.max(0.01, Math.min(0.5, dist * 0.004)), far = Math.max(2000, dist * 200);
      const proy = this.orto ? M4.orto(this.altoOrto * asp, this.altoOrto, -far, far) : M4.persp(this.fov, asp, near, far);
      this.vista = vista; this.proy = proy; this.vp = M4.mul(proy, vista);
      this._f = f; this._r = V.norm(V.cross(f, up)); this._u = V.cross(this._r, f);
      return this.vp;
    }
    // rayo desde un punto de pantalla (px CSS)
    rayo(x, y) {
      if (!this.vp) this.matrices();
      const nx = (x / this.w) * 2 - 1, ny = 1 - (y / this.h) * 2, asp = this.w / this.h;
      const f = this._f, r = this._r, u = this._u;
      if (this.orto) {
        const o = V.add(V.add(this.eye, V.mul(r, nx * this.altoOrto * asp / 2)), V.mul(u, ny * this.altoOrto / 2));
        return { o: V.sub(o, V.mul(f, 1000)), d: f };
      }
      const t = Math.tan(this.fov / 2);
      return { o: this.eye.slice(), d: V.norm(V.add(V.add(f, V.mul(r, nx * t * asp)), V.mul(u, ny * t))) };
    }
    // proyectar punto 3D a pantalla: [x, y, profundidad] (null si queda detrás)
    proyectar(p) {
      const m = this.vp; const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
      if (w <= 1e-6) return null;
      return [(x / w + 1) / 2 * this.w, (1 - y / w) / 2 * this.h, w];
    }
    profundidad(p) { return V.dot(V.sub(p, this.eye), this._f || this.adelante()); }
    // píxeles por metro a una distancia
    pxPorM(p) { if (this.orto) return this.h / this.altoOrto; const d = Math.max(0.01, this.profundidad(p)); return this.h / (2 * d * Math.tan(this.fov / 2)); }
    orbitar(pivote, dYaw, dPitch) {
      const np = Math.max(-1.55, Math.min(1.55, this.pitch + dPitch)); dPitch = np - this.pitch;
      let rel = V.sub(this.eye, pivote);
      // girar alrededor de Z
      const c = Math.cos(dYaw), s = Math.sin(dYaw);
      rel = [rel[0] * c - rel[1] * s, rel[0] * s + rel[1] * c, rel[2]];
      this.yaw += dYaw;
      // girar alrededor del eje derecho
      const r = this.derecha();
      rel = rotarEje(rel, r, dPitch);
      this.pitch = np;
      this.eye = V.add(pivote, rel);
    }
    desplazar(dx, dy, ref) {
      const k = 1 / this.pxPorM(ref);
      this.matrices();
      this.eye = V.add(this.eye, V.add(V.mul(this._r, -dx * k), V.mul(this._u, dy * k)));
    }
    // acercar hacia un punto (factor <1 acerca)
    zoom(p, factor) {
      if (this.orto) {
        const antes = this.altoOrto; this.altoOrto = Math.max(0.05, Math.min(5000, this.altoOrto * factor));
        const k = 1 - this.altoOrto / antes; this.matrices();
        // mantener el punto bajo el dedo
        const rel = V.sub(p, this.eye), pr = V.sub(rel, V.mul(this._f, V.dot(rel, this._f)));
        this.eye = V.add(this.eye, V.mul(pr, k));
        return;
      }
      const d = V.sub(this.eye, p);
      let nd = V.mul(d, factor);
      if (V.len(nd) < 0.05) nd = V.mul(V.norm(d), 0.05);
      this.eye = V.add(p, nd);
    }
  }
  function rotarEje(v, k, a) {
    const c = Math.cos(a), s = Math.sin(a), d = V.dot(k, v), kv = V.cross(k, v);
    return [v[0] * c + kv[0] * s + k[0] * d * (1 - c), v[1] * c + kv[1] * s + k[1] * d * (1 - c), v[2] * c + kv[2] * s + k[2] * d * (1 - c)];
  }

  // ---------------- materiales ----------------
  const MATERIALES = [
    { id: 0, nombre: 'Predeterminado', color: '#f4f4f1', reverso: '#a8b4c4' },
    { id: 1, nombre: 'Blanco', color: '#ffffff' },
    { id: 2, nombre: 'Gris claro', color: '#c9cbcd' },
    { id: 3, nombre: 'Gris oscuro', color: '#5b5f63' },
    { id: 4, nombre: 'Negro', color: '#222326' },
    { id: 5, nombre: 'Arena', color: '#e3d3b4' },
    { id: 6, nombre: 'Terracota', color: '#c7714a' },
    { id: 7, nombre: 'Verde oliva', color: '#7f8f5a' },
    { id: 8, nombre: 'Verde RAIKI', color: '#b6fd0e' },
    { id: 9, nombre: 'Azul', color: '#4d7fc4' },
    { id: 10, nombre: 'Celeste', color: '#a9d3ea' },
    { id: 11, nombre: 'Amarillo', color: '#f2c94c' },
    { id: 12, nombre: 'Rojo', color: '#c94a42' },
    { id: 13, nombre: 'Vidrio', color: '#9fd0e8', alfa: 0.35 },
    { id: 20, nombre: 'Ladrillo', color: '#ffffff', tex: 'ladrillo', tam: 0.6 },
    { id: 21, nombre: 'Concreto', color: '#ffffff', tex: 'concreto', tam: 1.5 },
    { id: 22, nombre: 'Madera', color: '#ffffff', tex: 'madera', tam: 1.2 },
    { id: 23, nombre: 'Parquet', color: '#ffffff', tex: 'parquet', tam: 1.2 },
    { id: 24, nombre: 'Porcelanato', color: '#ffffff', tex: 'porcelanato', tam: 1.2 },
    { id: 25, nombre: 'Piedra', color: '#ffffff', tex: 'piedra', tam: 1.5 },
    { id: 26, nombre: 'Pasto', color: '#ffffff', tex: 'pasto', tam: 2 },
    { id: 27, nombre: 'Agua', color: '#ffffff', tex: 'agua', tam: 3, alfa: 0.85 },
    { id: 28, nombre: 'Mármol', color: '#ffffff', tex: 'marmol', tam: 1.5 },
    { id: 29, nombre: 'Tejas', color: '#ffffff', tex: 'tejas', tam: 0.8 }
  ];
  const MAT = new Map(MATERIALES.map(m => [m.id, m]));
  function hexRGB(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }

  // Texturas dibujadas a mano (sin imágenes externas)
  function rnd(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  function texCanvas(tipo) {
    const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); const r = rnd(tipo.length * 7919);
    const ruido = (base, var_, n = 9000, tam = 2) => { x.fillStyle = base; x.fillRect(0, 0, S, S); for (let i = 0; i < n; i++) { const v = (r() - 0.5) * var_; x.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v)})`; x.fillRect(r() * S, r() * S, tam, tam); } };
    if (tipo === 'ladrillo') {
      x.fillStyle = '#d8d2c6'; x.fillRect(0, 0, S, S);
      const fh = S / 8, fw = S / 4;
      for (let f = 0; f < 8; f++) for (let k = -1; k < 5; k++) {
        const o = f % 2 ? fw / 2 : 0, h = 18 + r() * 14;
        x.fillStyle = `hsl(${h},${45 + r() * 15}%,${36 + r() * 10}%)`; x.fillRect(k * fw + o + 3, f * fh + 3, fw - 6, fh - 6);
      }
      for (let i = 0; i < 6000; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.12})`; x.fillRect(r() * S, r() * S, 2, 2); }
    } else if (tipo === 'concreto') { ruido('#a9a8a3', 0.18, 26000, 2); for (let i = 0; i < 60; i++) { x.fillStyle = 'rgba(60,60,60,.25)'; x.beginPath(); x.arc(r() * S, r() * S, 1 + r() * 2, 0, 7); x.fill(); } }
    else if (tipo === 'madera' || tipo === 'parquet') {
      x.fillStyle = '#b07d4f'; x.fillRect(0, 0, S, S);
      const tablas = tipo === 'parquet' ? 8 : 4, tw = S / tablas;
      for (let t = 0; t < tablas; t++) {
        x.fillStyle = `hsl(${26 + r() * 6},${42 + r() * 10}%,${40 + r() * 10}%)`; x.fillRect(t * tw, 0, tw, S);
        for (let l = 0; l < 26; l++) { x.strokeStyle = `rgba(70,40,20,${0.08 + r() * 0.14})`; x.lineWidth = 1 + r() * 2; x.beginPath(); const xx = t * tw + r() * tw; x.moveTo(xx, 0); x.bezierCurveTo(xx + (r() - .5) * 20, S / 3, xx + (r() - .5) * 20, 2 * S / 3, xx + (r() - .5) * 10, S); x.stroke(); }
        x.fillStyle = 'rgba(40,20,10,.5)'; x.fillRect(t * tw, 0, 2, S);
        if (tipo === 'parquet') { const y0 = r() * S; x.fillRect(t * tw, y0, tw, 2); }
      }
    } else if (tipo === 'porcelanato') {
      ruido('#e7e3dc', 0.05, 8000, 2); x.strokeStyle = '#b9b4ab'; x.lineWidth = 3;
      for (let i = 0; i <= 2; i++) { x.beginPath(); x.moveTo(i * S / 2, 0); x.lineTo(i * S / 2, S); x.stroke(); x.beginPath(); x.moveTo(0, i * S / 2); x.lineTo(S, i * S / 2); x.stroke(); }
    } else if (tipo === 'piedra') {
      x.fillStyle = '#8f8a82'; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 40; i++) { x.fillStyle = `hsl(${30 + r() * 20},${8 + r() * 10}%,${45 + r() * 20}%)`; x.beginPath(); const cx = r() * S, cy = r() * S, rr = 30 + r() * 45; for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283, q = rr * (0.7 + r() * 0.3); x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.closePath(); x.fill(); x.strokeStyle = 'rgba(40,40,40,.4)'; x.lineWidth = 3; x.stroke(); }
    } else if (tipo === 'pasto') { ruido('#5f8a3a', 0.25, 30000, 2); for (let i = 0; i < 5000; i++) { x.strokeStyle = `hsla(${85 + r() * 25},45%,${25 + r() * 25}%,.6)`; x.beginPath(); const a = r() * S, b = r() * S; x.moveTo(a, b); x.lineTo(a + (r() - .5) * 4, b - 4 - r() * 6); x.stroke(); } }
    else if (tipo === 'agua') { const gr = x.createLinearGradient(0, 0, S, S); gr.addColorStop(0, '#4f9fc9'); gr.addColorStop(1, '#2f7aa8'); x.fillStyle = gr; x.fillRect(0, 0, S, S); for (let i = 0; i < 200; i++) { x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 2; x.beginPath(); const a = r() * S, b = r() * S; x.moveTo(a, b); x.quadraticCurveTo(a + 20, b - 6, a + 40, b); x.stroke(); } }
    else if (tipo === 'marmol') { ruido('#efedea', 0.04, 6000, 2); for (let i = 0; i < 18; i++) { x.strokeStyle = `rgba(120,120,125,${0.1 + r() * 0.2})`; x.lineWidth = 1 + r() * 2.5; x.beginPath(); let a = r() * S, b = 0; x.moveTo(a, b); while (b < S) { a += (r() - .5) * 40; b += 20 + r() * 30; x.lineTo(a, b); } x.stroke(); } }
    else if (tipo === 'tejas') { x.fillStyle = '#9b4a2c'; x.fillRect(0, 0, S, S); const fh = S / 6; for (let f = 0; f < 6; f++) for (let k = -1; k < 7; k++) { const o = f % 2 ? S / 12 : 0; const gx = x.createLinearGradient(0, f * fh, 0, f * fh + fh); gx.addColorStop(0, `hsl(${15 + r() * 6},55%,${42 + r() * 6}%)`); gx.addColorStop(1, `hsl(${12 + r() * 6},55%,${28 + r() * 6}%)`); x.fillStyle = gx; x.beginPath(); x.ellipse(k * S / 6 + o + S / 12, f * fh + fh * 0.55, S / 13, fh * 0.6, 0, 0, Math.PI); x.fill(); } }
    return c;
  }

  // ---------------- dibujo ----------------
  const VS_CARA = `
    attribute vec3 aP; attribute vec3 aN; attribute vec2 aUV; attribute vec4 aT;
    uniform mat4 uVP; uniform float uFlip;
    varying vec3 vN; varying vec2 vUV; varying vec4 vT; varying vec3 vP;
    void main(){ vN = aN * uFlip; vUV = aUV; vT = aT; vP = aP; gl_Position = uVP * vec4(aP,1.0); }`;
  const FS_CARA = `
    precision mediump float;
    varying vec3 vN; varying vec2 vUV; varying vec4 vT; varying vec3 vP;
    uniform vec4 uC; uniform sampler2D uTex; uniform float uUsaTex; uniform vec3 uLuz; uniform float uRayos; uniform vec3 uOjo;
    void main(){
      vec4 b = uC;
      if (uUsaTex > 0.5) b *= texture2D(uTex, vUV);
      vec3 n = normalize(vN);
      float l = 0.62 + 0.30 * max(dot(n, uLuz), 0.0) + 0.08 * max(dot(n, normalize(vec3(-0.4,-0.2,0.6))), 0.0);
      vec3 c = b.rgb * l;
      c = mix(c, vT.rgb, vT.a);
      float a = b.a * (uRayos > 0.5 ? 0.45 : 1.0);
      gl_FragColor = vec4(c, a);
    }`;
  // líneas con grosor en píxeles: cada arista es un rectángulo que mira a la cámara
  const VS_LIN = `
    attribute vec3 aA; attribute vec3 aB; attribute vec2 aL; attribute vec4 aC;
    uniform mat4 uVP; uniform vec2 uRes; uniform float uAncho; uniform float uSesgo;
    varying vec4 vC;
    void main(){
      vec4 a = uVP * vec4(aA,1.0); vec4 b = uVP * vec4(aB,1.0);
      float e = 0.0001;
      if (a.w < e) { a = mix(a, b, (e - a.w) / (b.w - a.w)); }
      if (b.w < e) { b = mix(b, a, (e - b.w) / (a.w - b.w)); }
      vec4 p = aL.y < 0.5 ? a : b;
      vec2 sa = a.xy / a.w * uRes, sb = b.xy / b.w * uRes;
      vec2 d = sb - sa; float L = length(d); d = L > 0.0001 ? d / L : vec2(1.0, 0.0);
      vec2 nrm = vec2(-d.y, d.x);
      float w = uAncho * aC.a; // alfa del color guarda el grosor relativo
      p.xy += nrm * aL.x * w / uRes * p.w;
      p.z -= uSesgo * p.w;
      gl_Position = p; vC = vec4(aC.rgb, 1.0);
    }`;
  const FS_LIN = `precision mediump float; varying vec4 vC; uniform float uAlfa; void main(){ gl_FragColor = vec4(vC.rgb, uAlfa); }`;

  class Visor {
    constructor(canvas) {
      this.cv = canvas;
      const op = { antialias: true, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: false };
      const gl = canvas.getContext('webgl', op) || canvas.getContext('experimental-webgl', op);
      if (!gl) throw new Error('Este equipo no tiene WebGL');
      this.gl = gl;
      this.pC = this._prog(VS_CARA, FS_CARA); this.pL = this._prog(VS_LIN, FS_LIN);
      this.bufCaras = []; this.bufLin = null; this.bufEjes = null; this.texs = new Map();
      this.rayos = false; this.verEjes = true; this.dpr = 1;
      gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
      this._ejes();
    }
    _prog(vs, fs) {
      const gl = this.gl, mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
      const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const n = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES), m = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); p.a = {}; p.u = {};
      for (let i = 0; i < n; i++) { const a = gl.getActiveAttrib(p, i); p.a[a.name] = gl.getAttribLocation(p, a.name); }
      for (let i = 0; i < m; i++) { const u = gl.getActiveUniform(p, i); p.u[u.name] = gl.getUniformLocation(p, u.name); }
      return p;
    }
    tex(tipo) {
      if (this.texs.has(tipo)) return this.texs.get(tipo);
      const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texCanvas(tipo));
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      const ext = gl.getExtension('EXT_texture_filter_anisotropic'); if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
      this.texs.set(tipo, t); return t;
    }
    _buf(data) { const gl = this.gl, b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b; }
    _lineas(segs) { // segs: [ax,ay,az,bx,by,bz,r,g,b,grosor]...
      const n = segs.length / 10, d = new Float32Array(n * 6 * 12); let o = 0;
      const esq = [[-1, 0], [1, 0], [1, 1], [-1, 0], [1, 1], [-1, 1]];
      for (let i = 0; i < n; i++) {
        const s = i * 10;
        for (const [l, e] of esq) { d[o++] = segs[s]; d[o++] = segs[s + 1]; d[o++] = segs[s + 2]; d[o++] = segs[s + 3]; d[o++] = segs[s + 4]; d[o++] = segs[s + 5]; d[o++] = l; d[o++] = e; d[o++] = segs[s + 6]; d[o++] = segs[s + 7]; d[o++] = segs[s + 8]; d[o++] = segs[s + 9]; }
      }
      return { b: this._buf(d), n: n * 6 };
    }
    _ejes() {
      const L = 2000, s = [];
      const ej = [[1, 0, 0, [0.85, 0.2, 0.2]], [0, 1, 0, [0.2, 0.62, 0.25]], [0, 0, 1, [0.2, 0.35, 0.9]]];
      for (const [x, y, z, c] of ej) {
        s.push(0, 0, 0, x * L, y * L, z * L, c[0], c[1], c[2], 1);
        // parte negativa punteada
        for (let k = 0; k < 400; k++) { const a = -k * 0.5 - 0.1, b = a - 0.25; s.push(x * a, y * a, z * a, x * b, y * b, z * b, c[0], c[1], c[2], 0.8); }
      }
      if (this.bufEjes) this.gl.deleteBuffer(this.bufEjes.b);
      this.bufEjes = this._lineas(s);
    }
    // construye los búferes a partir del modelo. est: {selCaras:Set, selAristas:Set, contexto, ocultos}
    construir(m, est) {
      const gl = this.gl;
      for (const b of this.bufCaras) gl.deleteBuffer(b.b);
      if (this.bufLin) gl.deleteBuffer(this.bufLin.b);
      this.bufCaras = [];
      const lotes = new Map();
      const lote = (mat, lado) => { const k = mat + '|' + lado; let l = lotes.get(k); if (!l) lotes.set(k, l = { mat, lado, d: [] }); return l; };
      // normales suaves por grupo de suavizado
      const suave = new Map();
      for (const f of m.f.values()) if (f.sg) for (const L of f.loops) for (const v of L) { const k = v + '|' + f.sg; const s = suave.get(k) || [0, 0, 0]; suave.set(k, V.add(s, f.n)); }
      const sel = est.selCaras, ctx = est.contexto;
      for (const f of m.f.values()) {
        const tri = m.triangulos(f); if (!tri.length) continue;
        const enCtx = ctx ? f.g === ctx : true;
        const tint = sel.has(f.id) || (est.selGrupos && est.selGrupos.has(f.g)) ? [0.25, 0.45, 0.95, 0.38] : (!enCtx ? [1, 1, 1, 0.55] : [0, 0, 0, 0]);
        const [u, v] = ejesPlano(f.n);
        for (const [lado, matId] of [[1, f.mat], [-1, f.matB]]) {
          const mat = MAT.get(matId) || MAT.get(0);
          const L = lote(mat.id, lado), tam = mat.tam || 1;
          const d = L.d;
          for (let i = 0; i < tri.length; i++) {
            const p = m.P(tri[i]);
            let n = f.n; if (f.sg) { const s = suave.get(tri[i] + '|' + f.sg); if (s) n = V.norm(s); }
            d.push(p[0], p[1], p[2], n[0], n[1], n[2], V.dot(p, u) / tam, V.dot(p, v) / tam, tint[0], tint[1], tint[2], tint[3]);
          }
        }
      }
      for (const L of lotes.values()) this.bufCaras.push({ b: this._buf(new Float32Array(L.d)), n: L.d.length / 12, mat: MAT.get(L.mat) || MAT.get(0), lado: L.lado });
      // aristas
      const s = [];
      const selE = est.selAristas;
      for (const e of m.e.values()) {
        const enCtx = ctx ? e.g === ctx : true;
        const marcada = selE.has(e.id) || (est.selGrupos && est.selGrupos.has(e.g));
        if (e.s && !est.verSuaves) continue;
        const a = m.P(e.a), b = m.P(e.b);
        let c = [0.1, 0.1, 0.12], w = 1;
        if (marcada) { c = [0.15, 0.4, 1]; w = 2; }
        else if (!enCtx) { c = [0.55, 0.56, 0.6]; w = 0.85; }
        else if (e.s) { c = [0.55, 0.55, 0.6]; w = 0.7; }
        else if (!m.ef.get(e.id).size) { w = 1.15; }
        s.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], w);
      }
      this.bufLin = s.length ? this._lineas(s) : null;
    }
    tamano(w, h, dpr) {
      this.dpr = dpr; const W = Math.round(w * dpr), Hh = Math.round(h * dpr);
      if (this.cv.width !== W || this.cv.height !== Hh) { this.cv.width = W; this.cv.height = Hh; }
    }
    dibujar(cam) {
      const gl = this.gl, vp = cam.matrices();
      gl.viewport(0, 0, this.cv.width, this.cv.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // caras
      const p = this.pC; gl.useProgram(p);
      gl.uniformMatrix4fv(p.u.uVP, false, vp);
      gl.uniform3fv(p.u.uLuz, V.norm([0.35, -0.55, 0.75]));
      gl.uniform1f(p.u.uRayos, this.rayos ? 1 : 0);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1);
      gl.enable(gl.CULL_FACE);
      const stride = 48;
      const dib = (b) => {
        const mat = b.mat, lado = b.lado;
        gl.cullFace(lado > 0 ? gl.BACK : gl.FRONT);
        gl.uniform1f(p.u.uFlip, lado);
        const c = hexRGB(lado < 0 && mat.id === 0 ? mat.reverso : mat.color);
        gl.uniform4f(p.u.uC, c[0], c[1], c[2], mat.alfa || 1);
        if (mat.tex) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex(mat.tex)); gl.uniform1i(p.u.uTex, 0); gl.uniform1f(p.u.uUsaTex, 1); } else gl.uniform1f(p.u.uUsaTex, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, b.b);
        gl.enableVertexAttribArray(p.a.aP); gl.vertexAttribPointer(p.a.aP, 3, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(p.a.aN); gl.vertexAttribPointer(p.a.aN, 3, gl.FLOAT, false, stride, 12);
        gl.enableVertexAttribArray(p.a.aUV); gl.vertexAttribPointer(p.a.aUV, 2, gl.FLOAT, false, stride, 24);
        gl.enableVertexAttribArray(p.a.aT); gl.vertexAttribPointer(p.a.aT, 4, gl.FLOAT, false, stride, 32);
        gl.drawArrays(gl.TRIANGLES, 0, b.n);
      };
      const transp = b => this.rayos || (b.mat.alfa && b.mat.alfa < 1);
      gl.disable(gl.BLEND); gl.depthMask(true);
      for (const b of this.bufCaras) if (!transp(b)) dib(b);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      for (const b of this.bufCaras) if (transp(b)) dib(b);
      gl.depthMask(true); gl.disable(gl.POLYGON_OFFSET_FILL); gl.disable(gl.CULL_FACE);
      for (const k of ['aP', 'aN', 'aUV', 'aT']) gl.disableVertexAttribArray(p.a[k]);
      // líneas
      const q = this.pL; gl.useProgram(q);
      gl.uniformMatrix4fv(q.u.uVP, false, vp);
      gl.uniform2f(q.u.uRes, this.cv.width / 2, this.cv.height / 2);
      const linea = (b, ancho, sesgo, alfa) => {
        if (!b) return;
        gl.uniform1f(q.u.uAncho, ancho * this.dpr / 2); gl.uniform1f(q.u.uSesgo, sesgo); gl.uniform1f(q.u.uAlfa, alfa);
        gl.bindBuffer(gl.ARRAY_BUFFER, b.b); const st = 48;
        gl.enableVertexAttribArray(q.a.aA); gl.vertexAttribPointer(q.a.aA, 3, gl.FLOAT, false, st, 0);
        gl.enableVertexAttribArray(q.a.aB); gl.vertexAttribPointer(q.a.aB, 3, gl.FLOAT, false, st, 12);
        gl.enableVertexAttribArray(q.a.aL); gl.vertexAttribPointer(q.a.aL, 2, gl.FLOAT, false, st, 24);
        gl.enableVertexAttribArray(q.a.aC); gl.vertexAttribPointer(q.a.aC, 4, gl.FLOAT, false, st, 32);
        gl.drawArrays(gl.TRIANGLES, 0, b.n);
      };
      gl.enable(gl.BLEND);
      if (this.verEjes) linea(this.bufEjes, 1.4, 0.00002, 0.9);
      linea(this.bufLin, 1.5, 0.00004, 1);
      for (const k of ['aA', 'aB', 'aL', 'aC']) gl.disableVertexAttribArray(q.a[k]);
    }
  }

  Object.assign(G.R3, { Camara, Visor, MATERIALES, MAT, texCanvas, hexRGB, M4 });
})(window);
