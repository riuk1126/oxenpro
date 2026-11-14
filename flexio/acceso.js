// Flexio — entrar con la cuenta RAIKI (el mismo correo y contraseña de OXEN PRO y Kivo).
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
  capa.innerHTML = `<div class="acc-caja"><div class="acc-marca"><svg class="acc-flexio" role="img" aria-label="Flexio" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1617.67 2317.83"><path fill="#6666FF" fill-rule="evenodd" d="M681.77 1620.62c38.31,0.45 580.69,-334.37 642.59,-371.7 49,-29.55 122.62,-65.78 151.86,-101.4 44.56,-54.28 62.1,-100.39 61.86,-192.44 -0.22,-86.46 9.83,-449.47 -11.35,-499.67 4.03,116.9 -37.59,191.8 -131.17,244.27 -72.63,40.72 -600.17,341.83 -634.44,367.89 -92.83,70.6 -80.09,187.84 -79.8,298.71 0.22,84.38 -1.56,170.17 0.44,254.35zm-370.92 -1337.41c13.88,5.96 67.37,9.66 94.34,19.46 120.32,43.75 554.34,350.18 680.66,365.22 109.44,13.03 222.95,-73.74 333.28,-131.93 37.11,-19.57 107.97,-78.28 80.48,-145.59 -21.15,-51.8 -77.59,-77.47 -125.69,-105.44l-364.96 -215.09c-79.93,-45.9 -150.6,-100.3 -259.4,-49.27 -26.44,13.97 -430.02,250.84 -438.71,262.630zm202.29 1190.86c2.89,-116.89 -20.17,-425.59 27.9,-512.86 60.24,-109.37 261.71,-174.32 317.42,-226.42 -22.78,-19.22 -352.93,-206.14 -409.64,-240.67 -80.45,-48.99 -235.71,-157.68 -335.26,-22.790 -24.95,33.8 -34.97,79.08 -34.72,131.3 0.52,107.61 0.42,215.46 0.19,323.08 -0.26,119.57 -15.35,195.99 51.69,275.57 27.23,32.32 145.52,111.44 187.4,139.44 32.4,21.66 176.27,127.15 195.01,133.36z"/><text x="-52.05" y="2310.84" font-family="Arial, Helvetica, sans-serif" font-size="634.8" fill="currentColor">Flexio</text></svg></div><div id="accCuerpo"></div></div>`;
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
    mostrar(`<h2>${T[0]}</h2><p class="acc-txt">${T[1]}</p>${wa('Hola, quiero activar Flexio. Mi correo es ' + email)}
      <button class="acc-btn" id="accRe">Volver a comprobar</button><button class="acc-link" id="accOtro">Usar otro correo</button>`, () => { $('accRe').onclick = () => comprobar(true); otro(); });
  }
  async function comprobar(visible) {
    let r;
    try { r = await A.rpc('acceso_raiki', { p_app: 'flexio' }); }
    catch (e) {
      if (e.red) { if (guardadaValida()) return ocultar(); return mostrar(`<h2>Necesitas internet</h2><p class="acc-txt">Conéctate una vez para comprobar tu cuenta. Después Flexio funciona hasta ${DIAS_SIN_INTERNET} días sin conexión.</p><button class="acc-btn" id="accRe">Reintentar</button>`, () => $('accRe').onclick = () => comprobar(true)); }
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
