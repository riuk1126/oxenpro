// Flexio — conexión con el servidor de cuentas RAIKI (Supabase), sin librerías.
// La misma cuenta RAIKI (correo + contraseña) sirve para OXEN PRO, Kivo y Flexio.
// La clave de abajo es la "publishable key": es pública por diseño y puede ir en la app.
// La seguridad la ponen las reglas de la base de datos, no esta clave.
(function () {
  const SB_URL = 'https://yaeqxcwvlsnzqcqldktu.supabase.co';
  const SB_KEY = 'sb_publishable_vaojAI6KzIL0SYFPBtJcCA_p0Hgzziz';
  const K_SES = 'raiki-sesion';   // antes 'oxen-sesion' (servidor viejo): se pide entrar una vez
  try { localStorage.removeItem('oxen-sesion'); } catch (e) {}
  const MIN_CLAVE = 8;

  function errRed() { const e = new Error('Sin conexión a internet'); e.red = true; return e; }

  async function llamar(ruta, { metodo = 'POST', cuerpo, token, extra } = {}) {
    let r;
    try {
      r = await fetch(SB_URL + ruta, {
        method: metodo,
        headers: Object.assign({ apikey: SB_KEY, 'Content-Type': 'application/json' },
          token ? { Authorization: 'Bearer ' + token } : {}, extra || {}),
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
      });
    } catch (e) { throw errRed(); }
    const txt = await r.text();
    let datos = null; try { datos = txt ? JSON.parse(txt) : null; } catch (e) { datos = txt; }
    if (!r.ok) {
      const msg = (datos && (datos.msg || datos.message || datos.error_description || datos.error)) || ('Error ' + r.status);
      const e = new Error(msg); e.status = r.status; e.codigo = datos && (datos.error_code || datos.code); throw e;
    }
    return datos;
  }

  function leerSesion() { try { return JSON.parse(localStorage.getItem(K_SES) || 'null'); } catch (e) { return null; } }
  function guardarSesion(d) {
    if (!d || !d.access_token) return null;
    const s = {
      access_token: d.access_token, refresh_token: d.refresh_token,
      expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600),
      email: ((d.user && d.user.email) || '').toLowerCase()
    };
    try { localStorage.setItem(K_SES, JSON.stringify(s)); } catch (e) {}
    return s;
  }
  function borrarSesion() { try { localStorage.removeItem(K_SES); } catch (e) {} }

  // Mensajes claros en español
  function traducir(e) {
    if (e.red) return 'No hay conexión a internet. Revisa tu wifi o datos e intenta otra vez.';
    const m = (e.message || '').toLowerCase(), c = (e.codigo || '') + '';
    if (c === 'invalid_credentials' || m.includes('invalid login')) return 'Correo o contraseña incorrectos. Revisa mayúsculas y que no haya espacios.';
    if (c === 'same_password' || m.includes('different from the old')) return 'La nueva contraseña tiene que ser distinta a la que te dieron.';
    if (c === 'weak_password' || m.includes('password should')) return 'La contraseña es muy débil. Usa al menos ' + MIN_CLAVE + ' caracteres, mezclando letras y números.';
    if (c === 'over_request_rate_limit' || m.includes('rate limit') || e.status === 429) return 'Demasiados intentos seguidos. Espera un minuto y vuelve a intentar.';
    if (c === 'user_banned') return 'Esta cuenta está suspendida.';
    if (e.sinSesion) return 'Tu sesión se cerró. Vuelve a entrar.';
    return 'Algo salió mal (' + e.message + '). Intenta otra vez.';
  }

  // Entrar con correo y contraseña (la temporal que da el administrador, o la propia)
  async function entrar(email, clave) {
    const d = await llamar('/auth/v1/token?grant_type=password', { cuerpo: { email: email.trim().toLowerCase(), password: clave } });
    return guardarSesion(d);
  }

  // Devuelve un token vigente (lo renueva si hace falta). null = hay que volver a entrar.
  let renovando = null;
  async function token() {
    const s = leerSesion(); if (!s) return null;
    if (s.expires_at - 90 > Date.now() / 1000) return s.access_token;
    if (!renovando) renovando = (async () => {
      try {
        const d = await llamar('/auth/v1/token?grant_type=refresh_token', { cuerpo: { refresh_token: s.refresh_token } });
        return guardarSesion(d).access_token;
      } catch (e) {
        if (e.red) throw e;
        borrarSesion(); return null;
      } finally { setTimeout(() => { renovando = null; }, 0); }
    })();
    return renovando;
  }
  async function tokenObligatorio() {
    const t = await token(); if (!t) { const e = new Error('Sesión cerrada'); e.sinSesion = true; throw e; }
    return t;
  }

  // Crear la contraseña propia (la primera vez) y avisar al servidor
  async function cambiarClave(nueva) {
    if ((nueva || '').length < MIN_CLAVE) { const e = new Error('Password should be longer'); e.codigo = 'weak_password'; throw e; }
    await llamar('/auth/v1/user', { metodo: 'PUT', cuerpo: { password: nueva }, token: await tokenObligatorio() });
    await rpc('contrasena_cambiada');
  }

  async function rpc(nombre, args) {
    return llamar('/rest/v1/rpc/' + nombre, { cuerpo: args || {}, token: await tokenObligatorio() });
  }
  // Para el panel: leer y cambiar tablas (las reglas de la base deciden qué se permite)
  async function tabla(ruta, metodo = 'GET', cuerpo, prefer) {
    return llamar('/rest/v1/' + ruta, { metodo, cuerpo, token: await tokenObligatorio(),
      extra: metodo === 'GET' ? {} : { Prefer: 'return=representation' + (prefer ? ',' + prefer : '') } });
  }
  // Para el panel: funciones del servidor (generar contraseña temporal)
  async function funcion(nombre, cuerpo) {
    return llamar('/functions/v1/' + nombre, { cuerpo: cuerpo || {}, token: await tokenObligatorio() });
  }
  // Archivos de bocetos compartidos (carpeta privada: correo-del-dueño/boceto/versión/archivo)
  const BUCKET = 'compartidos';
  const ruta = p => p.split('/').map(encodeURIComponent).join('/');
  async function crudo(metodo, url, cuerpo, tipo) {
    const t = await tokenObligatorio(); let r;
    try {
      r = await fetch(SB_URL + url, { method: metodo, body: cuerpo,
        headers: Object.assign({ apikey: SB_KEY, Authorization: 'Bearer ' + t }, tipo ? { 'Content-Type': tipo } : {}, metodo === 'POST' && tipo !== 'application/json' ? { 'x-upsert': 'true' } : {}) });
    } catch (e) { throw errRed(); }
    if (!r.ok) { let m = ''; try { m = (await r.json()).message || ''; } catch (e) {} const e = new Error(m || ('Error ' + r.status)); e.status = r.status; throw e; }
    return r;
  }
  // b = depósito ('compartidos' por defecto; 'respaldos' para la nube de cada cuenta)
  async function subirArchivo(p, blob, tipo, b) { await crudo('POST', '/storage/v1/object/' + (b || BUCKET) + '/' + ruta(p), blob, tipo || blob.type || 'application/octet-stream'); }
  async function bajarArchivo(p, b) { return (await crudo('GET', '/storage/v1/object/authenticated/' + (b || BUCKET) + '/' + ruta(p))).blob(); }
  async function borrarArchivos(ps, b) { if (ps.length) await crudo('DELETE', '/storage/v1/object/' + (b || BUCKET), JSON.stringify({ prefixes: ps }), 'application/json'); }

  async function salir() {
    const s = leerSesion();
    if (s) { try { await llamar('/auth/v1/logout', { token: s.access_token }); } catch (e) {} }
    borrarSesion();
  }

  window.RaikiAuth = { entrar, cambiarClave, token, rpc, tabla, funcion, salir, subirArchivo, bajarArchivo, borrarArchivos, sesion: leerSesion, traducir, MIN_CLAVE };
})();
