// RAIKI 3D — entrar con la cuenta RAIKI (el mismo correo y contraseña de OXEN PRO y Kivo).
// Sin internet sigue funcionando DIAS_SIN_INTERNET días desde la última comprobación.
(function () {
  const WHATSAPP = '51927907173';
  const DIAS_SIN_INTERNET = 7;
  const K_LIC = 'r3d-licencia', K_MAIL = 'oxen-correo';
  const A = window.RaikiAuth;
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const leer = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const fecha = f => new Date(f).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  const diasHasta = f => Math.ceil((new Date(f) - Date.now()) / 864e5);

  function guardadaValida() {
    const c = leer(K_LIC), s = A.sesion();
    if (!c || !s || c.email !== s.email || !c.vence || !c.ok) return false;
    const ahora = Date.now();
    if (ahora < c.ok - 36e5) return false;
    if (new Date(c.vence).getTime() < ahora) return false;
    return ahora - c.ok < DIAS_SIN_INTERNET * 864e5;
  }

  const capa = document.createElement('div');
  capa.id = 'acceso'; capa.className = 'oculto';
  capa.innerHTML = `<div class="acc-caja"><div class="acc-marca"><svg class="raiki-logo" viewBox="0 0 4359.77 1160.77" role="img" aria-label="RAIKI" xmlns="http://www.w3.org/2000/svg"><path fill="#B6FD0E" d="M961.53 1141.28c44.1,24.33 359.63,12.49 424.71,12.28 181.21,-0.59 164.28,-54.2 333.33,-328.36 96.23,-156.07 -204.59,-117.87 -321.55,-117.77 -182.56,0.15 -172.02,13.39 -364.78,291.72 -39.64,57.24 -81.83,91.57 -71.71,142.14z"/><path fill="#B6FD0E" d="M911.33 8.16c-100.67,20.32 -143.12,54.63 -199.9,133.18 -87.93,121.64 -707.1,955.31 -710.57,970.66 -15.38,68.13 178.48,41.71 295.51,42.81 235.47,2.2 411.44,43.28 543.41,-125.08 49.88,-63.63 95.57,-129.2 143.76,-192.14 166.23,-217.08 333.64,-453.32 497.74,-674.55 142.79,-192.5 -35.57,-160.34 -242.33,-160.26 -83.46,0.03 -256.31,-9.01 -327.64,5.38z"/><path fill="currentColor" d="M2217.36 620.51l0 -58.45 230.54 0c32.85,0 59.18,-8.4 79.02,-25.21 19.83,-16.68 29.99,-38.85 30.3,-66.13l0 0c0,-27.64 -9.99,-49.69 -29.83,-66.37 -19.83,-16.68 -46.33,-24.97 -79.49,-24.97l-230.54 0 0 -58.57 226.89 0c39.35,0 73.78,6.33 103.13,18.75 29.51,12.54 52.36,29.96 68.54,52.24 16.34,22.41 24.44,48.71 24.44,78.91l0 0c0,29.96 -8.25,56.14 -24.59,78.67 -16.5,22.41 -39.35,39.94 -68.54,52.36 -29.35,12.54 -63.62,18.75 -102.97,18.75l-226.89 0zm-41.41 219.45l0 -519.14 80.92 0 0 519.14 -80.92 0zm396.5 0l-154.7 -235.52 78.06 -16.32 172.94 251.84 -96.31 0zm135.81 0l249.26 -518.78 80.76 0 249.26 518.78 -88.37 0 -201.34 -441.69 -201.18 441.69 -88.37 0zm769.35 -518.78l0 518.78 -80.92 0 0 -518.78 80.92 0zm234.66 400.29l-6.98 -74.53 334.78 -325.76 101.23 0 -429.02 400.29zm-60.45 118.49l0 -518.78 80.92 0 0 518.78 -80.92 0zm419.82 0l-214.83 -276.8 56.8 -53.22 256.08 330.02 -98.05 0zm288.13 -518.78l0 518.78 -80.92 0 0 -518.78 80.92 0z"/></svg><small>Entrando a <b>RAIKI 3D</b></small></div><div id="accCuerpo"></div></div>`;
  document.body.appendChild(capa);
  function mostrar(html, fn) { capa.classList.remove('oculto'); $('accCuerpo').innerHTML = html; if (fn) fn(); }
  function ocultar() { capa.classList.add('oculto'); document.dispatchEvent(new Event('raiki-listo')); }
  const wa = t => WHATSAPP ? `<a class="acc-btn acc-sec" target="_blank" rel="noopener" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t)}">Escribir por WhatsApp</a>` : '';
  const ojo = id => `<button type="button" class="acc-ojo" data-ver="${id}">Ver</button>`;
  function ojos() { document.querySelectorAll('#acceso [data-ver]').forEach(b => b.onclick = () => { const i = $(b.dataset.ver); i.type = i.type === 'password' ? 'text' : 'password'; b.textContent = i.type === 'password' ? 'Ver' : 'Ocultar'; }); }
  function otro() { const b = $('accOtro'); if (b) b.onclick = async () => { await A.salir(); localStorage.removeItem(K_LIC); pasoCorreo(); }; }

  function pasoCorreo(msg) {
    const previo = leer(K_MAIL) || '';
    mostrar(`<h2>Entra con tu cuenta RAIKI</h2>
      <p class="acc-txt">El mismo correo y contraseña que usas en OXEN PRO y Kivo.</p>
      <label class="acc-lbl" for="accMail">Correo</label>
      <input id="accMail" class="acc-input" type="email" inputmode="email" autocomplete="username" placeholder="tucorreo@gmail.com" value="${esc(previo)}">
      <label class="acc-lbl" for="accClave">Contraseña</label>
      <div class="acc-clave"><input id="accClave" class="acc-input" type="password" autocomplete="current-password" placeholder="Tu contraseña">${ojo('accClave')}</div>
      <p id="accErr" class="acc-err">${esc(msg || '')}</p>
      <button id="accEntrar" class="acc-btn">Entrar</button>
      <p class="acc-mini">¿Olvidaste tu contraseña? <a target="_blank" rel="noopener" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola, olvidé mi contraseña de RAIKI')}">Pide una nueva</a></p>`, () => {
      ojos();
      const mail = $('accMail'), clave = $('accClave'), btn = $('accEntrar');
      const entrar = async () => {
        const email = mail.value.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('accErr').textContent = 'Revisa que el correo esté bien escrito.'; return; }
        if (!clave.value) { $('accErr').textContent = 'Escribe tu contraseña.'; return; }
        btn.disabled = true; btn.textContent = 'Entrando…'; $('accErr').textContent = '';
        try { await A.entrar(email, clave.value.trim()); escribir(K_MAIL, email); await comprobar(true); }
        catch (e) { $('accErr').textContent = A.traducir(e); btn.disabled = false; btn.textContent = 'Entrar'; }
      };
      btn.onclick = entrar; mail.onkeydown = e => { if (e.key === 'Enter') clave.focus(); }; clave.onkeydown = e => { if (e.key === 'Enter') entrar(); };
    });
  }
  function pasoClave(cambio) {
    mostrar(`<h2>${cambio ? 'Cambiar mi contraseña' : 'Crea tu contraseña'}</h2>
      <p class="acc-txt">${cambio ? 'Escribe tu nueva contraseña. Cambia también en OXEN PRO y Kivo, porque es la misma cuenta.' : 'Es tu primera vez: reemplaza la contraseña que te dimos por una tuya.'}</p>
      <label class="acc-lbl">Nueva contraseña (mínimo ${A.MIN_CLAVE} caracteres)</label>
      <div class="acc-clave"><input id="accN1" class="acc-input" type="password" autocomplete="new-password">${ojo('accN1')}</div>
      <label class="acc-lbl">Repítela</label>
      <div class="acc-clave"><input id="accN2" class="acc-input" type="password" autocomplete="new-password">${ojo('accN2')}</div>
      <p id="accErr" class="acc-err"></p>
      <button id="accGuardar" class="acc-btn">Guardar</button>
      ${cambio ? '<button class="acc-link" id="accVolver">Volver</button>' : '<button class="acc-link" id="accOtro">Usar otro correo</button>'}`, () => {
      ojos(); otro(); if ($('accVolver')) $('accVolver').onclick = verCuenta;
      $('accGuardar').onclick = async () => {
        const a = $('accN1').value, b = $('accN2').value;
        if (a.length < A.MIN_CLAVE) return $('accErr').textContent = 'Usa al menos ' + A.MIN_CLAVE + ' caracteres.';
        if (a !== b) return $('accErr').textContent = 'Las dos contraseñas no son iguales.';
        try { await A.cambiarClave(a); await comprobar(true); } catch (e) { $('accErr').textContent = A.traducir(e); }
      };
    });
  }
  function estado(r) {
    const email = r.email || (A.sesion() || {}).email || '';
    const T = {
      sin_licencia: ['Este correo no tiene un plan activo', `<b>${esc(email)}</b> no tiene un plan RAIKI activo (OXEN PRO, Kivo o el combo).`],
      vencido: ['Tu plan venció', `Tu acceso venció el <b>${r.vence ? fecha(r.vence) : ''}</b>. Tus modelos siguen guardados en este equipo.`],
      bloqueado: ['Tu cuenta está suspendida', 'Escríbenos para revisarla. Tus modelos siguen guardados en este equipo.'],
      equipo_vencido: ['El plan de tu equipo venció', 'Pide a quien te agregó que lo renueve.']
    }[r.estado] || ['No pudimos comprobar tu acceso', esc(r.mensaje || 'Intenta otra vez en un momento.')];
    mostrar(`<h2>${T[0]}</h2><p class="acc-txt">${T[1]}</p>${wa('Hola, quiero activar RAIKI 3D. Mi correo es ' + email)}
      <button class="acc-btn" id="accRe">Volver a comprobar</button><button class="acc-link" id="accOtro">Usar otro correo</button>`, () => { $('accRe').onclick = () => comprobar(true); otro(); });
  }
  async function comprobar(visible) {
    let r;
    try { r = await A.rpc('acceso_raiki', { p_app: '3d' }); }
    catch (e) {
      if (e.red) { if (guardadaValida()) return ocultar(); return mostrar(`<h2>Necesitas internet</h2><p class="acc-txt">Conéctate una vez para comprobar tu cuenta. Después RAIKI 3D funciona hasta ${DIAS_SIN_INTERNET} días sin conexión.</p><button class="acc-btn" id="accRe">Reintentar</button>`, () => $('accRe').onclick = () => comprobar(true)); }
      if (e.sinSesion || e.status === 401) { localStorage.removeItem(K_LIC); return pasoCorreo(visible ? 'Tu sesión se cerró. Vuelve a entrar.' : ''); }
      if (guardadaValida()) return ocultar();
      return estado({ estado: 'error', mensaje: A.traducir(e) });
    }
    if (r && r.estado === 'ok') {
      if (r.debe_cambiar) return pasoClave(false);
      const desfase = r.ahora ? Date.now() - new Date(r.ahora).getTime() : 0;
      escribir(K_LIC, { email: r.email, plan: r.plan, producto: r.producto, vence: new Date(new Date(r.vence).getTime() + desfase).toISOString(), ok: Date.now() });
      return ocultar();
    }
    localStorage.removeItem(K_LIC);
    if (r && r.estado === 'sin_sesion') return pasoCorreo();
    estado(r || {});
  }
  function verCuenta() {
    const c = leer(K_LIC) || {}, d = c.vence ? diasHasta(c.vence) : 0;
    const vence = !c.vence ? '—' : (d > 3650 ? 'Sin vencimiento' : fecha(c.vence) + ` (quedan ${d} días)`);
    mostrar(`<h2>Mi cuenta RAIKI</h2><div class="acc-datos">
      <div><span>Correo</span><b>${esc(c.email)}</b></div>${c.plan ? `<div><span>Plan</span><b>${esc(c.plan)}</b></div>` : ''}<div><span>Vence</span><b>${esc(vence)}</b></div></div>
      <button class="acc-btn" id="accVolver">Volver a modelar</button>
      <button class="acc-link" id="accCambiar">Cambiar mi contraseña</button>
      <button class="acc-link acc-rojo" id="accSalir">Cerrar sesión en este equipo</button>`, () => {
      $('accVolver').onclick = ocultar; $('accCambiar').onclick = () => pasoClave(true);
      $('accSalir').onclick = async () => { if (!confirm('¿Cerrar sesión? Tus modelos se quedan en este equipo.')) return; await A.salir(); localStorage.removeItem(K_LIC); pasoCorreo(); };
    });
  }
  window.RaikiAcceso = { verCuenta, licencia: () => leer(K_LIC) };
  if (!A.sesion()) pasoCorreo();
  else if (guardadaValida()) { ocultar(); comprobar(false); }
  else { mostrar('<div class="acc-carga"><span></span><p class="acc-txt">Comprobando tu cuenta…</p></div>'); comprobar(true); }
  let ultima = Date.now();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && A.sesion() && Date.now() - ultima > 6 * 36e5) { ultima = Date.now(); comprobar(false); } });
})();
