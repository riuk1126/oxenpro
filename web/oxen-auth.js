// OXEN PRO — conexión con el servidor de cuentas (Supabase), sin librerías.
// La clave de abajo es la "publishable key": es pública por diseño y puede ir en la app.
// La seguridad la ponen las reglas de la base de datos, no esta clave.
(function () {
  const SB_URL = 'https://jwvownzuatsjsmcpzocr.supabase.co';
  const SB_KEY = 'sb_publishable_wDinCENDW2cIEa50TXGavw_PG2PYrwY';
  const K_SES = 'oxen-sesion';

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
    if (c === 'over_email_send_rate_limit' || m.includes('rate limit') || e.status === 429)
      return 'Se pidieron muchos códigos seguidos. Espera un minuto y vuelve a intentar.';
    if (m.includes('not authorized')) return 'Todavía no se pueden enviar códigos a este correo. Escríbenos para activarlo.';
    if (c === 'otp_expired' || m.includes('expired') || m.includes('invalid')) return 'El código no es correcto o ya venció. Revisa el último correo o pide uno nuevo.';
    if (m.includes('email')) return 'Revisa que el correo esté bien escrito.';
    return 'Algo salió mal (' + e.message + '). Intenta otra vez.';
  }

  async function pedirCodigo(email) {
    await llamar('/auth/v1/otp', { cuerpo: { email: email.trim().toLowerCase(), create_user: true } });
  }
  async function verificarCodigo(email, codigo) {
    const d = await llamar('/auth/v1/verify', { cuerpo: { type: 'email', email: email.trim().toLowerCase(), token: codigo.replace(/\D/g, '') } });
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

  async function rpc(nombre, args) {
    const t = await token(); if (!t) { const e = new Error('Sesión cerrada'); e.sinSesion = true; throw e; }
    return llamar('/rest/v1/rpc/' + nombre, { cuerpo: args || {}, token: t });
  }
  // Para el panel: leer y cambiar tablas (las reglas de la base deciden qué se permite)
  async function tabla(ruta, metodo = 'GET', cuerpo) {
    const t = await token(); if (!t) { const e = new Error('Sesión cerrada'); e.sinSesion = true; throw e; }
    return llamar('/rest/v1/' + ruta, { metodo, cuerpo, token: t, extra: metodo === 'GET' ? {} : { Prefer: 'return=representation' } });
  }
  async function salir() {
    const s = leerSesion();
    if (s) { try { await llamar('/auth/v1/logout', { token: s.access_token }); } catch (e) {} }
    borrarSesion();
  }

  window.OxenAuth = { pedirCodigo, verificarCodigo, token, rpc, tabla, salir, sesion: leerSesion, traducir };
})();
