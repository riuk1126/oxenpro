// OXEN PRO — acceso con correo y licencia por tiempo.
// Al abrir: si la licencia ya se verificó hace poco, la app abre al toque y se vuelve a comprobar por detrás.
// Sin internet, la app sigue funcionando hasta DIAS_SIN_INTERNET días desde la última comprobación.
(function () {
  // Número de WhatsApp para comprar o renovar (con código de país, solo números). Vacío = no muestra el botón.
  const WHATSAPP = '';
  const DIAS_SIN_INTERNET = 7;
  const AVISO_DIAS = 5;            // avisa cuando falten estos días o menos
  const K_LIC = 'oxen-licencia', K_DISP = 'oxen-dispositivo', K_MAIL = 'oxen-correo';

  const A = window.OxenAuth;
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const leer = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const fecha = f => new Date(f).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  const diasHasta = f => Math.ceil((new Date(f) - Date.now()) / 864e5);

  function dispositivo() {
    let id = leer(K_DISP);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));
      escribir(K_DISP, id);
    }
    return id;
  }
  function nombreDispositivo() {
    const ua = navigator.userAgent;
    const m = ua.match(/Android [\d.]+;\s*([^;)]+)/);
    if (m && m[1] && !/^(K|wv)$/.test(m[1].trim())) return 'Android · ' + m[1].replace(/Build.*/, '').trim();
    if (/Android/.test(ua)) return 'Android';
    if (/iPad|iPhone/.test(ua)) return 'iPad / iPhone';
    if (/Windows/.test(ua)) return 'Windows (navegador)';
    if (/Mac/.test(ua)) return 'Mac (navegador)';
    return 'Navegador';
  }

  // ¿La última comprobación sigue valiendo sin internet?
  function licenciaGuardadaValida() {
    const c = leer(K_LIC), s = A.sesion();
    if (!c || !s || c.email !== s.email || !c.vence || !c.ok) return false;
    const ahora = Date.now();
    if (ahora < c.ok - 36e5) return false;                      // reloj atrasado a propósito
    if (new Date(c.vence).getTime() < ahora) return false;
    return ahora - c.ok < DIAS_SIN_INTERNET * 864e5;
  }

  // ---------- Interfaz ----------
  const capa = document.createElement('div');
  capa.id = 'acceso';
  capa.className = 'oculto';
  capa.innerHTML = `
    <div class="acc-caja">
      <div class="acc-marca"><img src="icono.png" alt=""><span>OXEN<b class="pro">PRO</b></span></div>
      <div id="accCuerpo"></div>
    </div>`;
  document.body.appendChild(capa);

  function mostrar(html, alPintar) {
    capa.classList.remove('oculto');
    $('accCuerpo').innerHTML = html;
    if (alPintar) alPintar();
  }
  function ocultar() { capa.classList.add('oculto'); }
  const btnWhats = txt => WHATSAPP
    ? `<a class="btn-verde acc-btn" target="_blank" rel="noopener" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(txt)}">Escribir por WhatsApp</a>` : '';
  const pieCorreo = () => `<button class="acc-link" id="accOtro">Usar otro correo</button>`;
  function enlazarOtro() { const b = $('accOtro'); if (b) b.onclick = async () => { await A.salir(); try { localStorage.removeItem(K_LIC); } catch (e) {} pasoCorreo(); }; }

  const ojo = id => `<button type="button" class="acc-ojo" data-ver="${id}" aria-label="Mostrar contraseña">Ver</button>`;
  function enlazarOjos() {
    document.querySelectorAll('#acceso [data-ver]').forEach(b => b.onclick = () => {
      const i = $(b.dataset.ver); i.type = i.type === 'password' ? 'text' : 'password'; b.textContent = i.type === 'password' ? 'Ver' : 'Ocultar';
    });
  }

  function pasoCorreo(msg) {
    const previo = leer(K_MAIL) || '';
    mostrar(`
      <p class="acc-raiki">Cuenta <b>RAIKI</b></p>
      <h2>Entra a tu cuenta</h2>
      <p class="acc-txt">Usa tu cuenta RAIKI: el mismo correo y contraseña sirven para OXEN PRO y Kivo.</p>
      <label class="acc-lbl" for="accMail">Correo</label>
      <input id="accMail" class="acc-input" type="email" inputmode="email" autocomplete="username" placeholder="tucorreo@gmail.com" value="${esc(previo)}">
      <label class="acc-lbl" for="accClave">Contraseña</label>
      <div class="acc-clave"><input id="accClave" class="acc-input" type="password" autocomplete="current-password" placeholder="Tu contraseña">${ojo('accClave')}</div>
      <p id="accErr" class="acc-err">${esc(msg || '')}</p>
      <button id="accEntrar" class="btn-verde acc-btn">Entrar</button>
      <p class="acc-mini">¿Olvidaste tu contraseña?${WHATSAPP ? ' <a target="_blank" rel="noopener" href="https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hola, olvidé mi contraseña de OXEN PRO') + '">Pide una nueva</a>' : ' Pide una nueva a quien te vendió la app.'}</p>
      <p class="acc-mini" style="margin-top:6px">¿Aún no tienes OXEN PRO?${WHATSAPP ? ' <a target="_blank" rel="noopener" href="https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hola, quiero comprar OXEN PRO') + '">Cómpralo aquí</a>' : ''}</p>`,
      () => {
        enlazarOjos();
        const mail = $('accMail'), clave = $('accClave'), btn = $('accEntrar');
        const entrar = async () => {
          const email = mail.value.trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('accErr').textContent = 'Revisa que el correo esté bien escrito.'; return; }
          if (!clave.value) { $('accErr').textContent = 'Escribe tu contraseña.'; clave.focus(); return; }
          btn.disabled = true; btn.textContent = 'Entrando…'; $('accErr').textContent = '';
          try { await A.entrar(email, clave.value.trim()); escribir(K_MAIL, email); await comprobar(true); }
          catch (e) { $('accErr').textContent = A.traducir(e); btn.disabled = false; btn.textContent = 'Entrar'; }
        };
        btn.onclick = entrar;
        mail.onkeydown = e => { if (e.key === 'Enter') clave.focus(); };
        clave.onkeydown = e => { if (e.key === 'Enter') entrar(); };
        setTimeout(() => (previo ? clave : mail).focus(), 50);
      });
  }

  // Primera vez: el cliente reemplaza la contraseña temporal por una suya
  function pasoCrearClave(r, cambio) {
    mostrar(`
      <h2>${cambio ? 'Cambiar mi contraseña' : 'Crea tu contraseña'}</h2>
      <p class="acc-txt">${cambio ? 'Escribe tu nueva contraseña.' : 'Es tu primera vez. Cambia la contraseña que te dimos por una tuya; solo te la pediremos esta vez.'}</p>
      <label class="acc-lbl" for="accN1">Nueva contraseña (mínimo ${A.MIN_CLAVE} caracteres)</label>
      <div class="acc-clave"><input id="accN1" class="acc-input" type="password" autocomplete="new-password">${ojo('accN1')}</div>
      <label class="acc-lbl" for="accN2">Repítela</label>
      <div class="acc-clave"><input id="accN2" class="acc-input" type="password" autocomplete="new-password">${ojo('accN2')}</div>
      <p id="accErr" class="acc-err"></p>
      <button id="accGuardar" class="btn-verde acc-btn">Guardar y empezar a dibujar</button>
      ${cambio ? '<button class="acc-link" id="accVolver">Volver</button>' : pieCorreo()}`,
      () => {
        enlazarOjos(); enlazarOtro(); if ($('accVolver')) $('accVolver').onclick = verCuenta;
        const n1 = $('accN1'), n2 = $('accN2'), btn = $('accGuardar');
        const guardar = async () => {
          if (n1.value.length < A.MIN_CLAVE) { $('accErr').textContent = 'Usa al menos ' + A.MIN_CLAVE + ' caracteres.'; return; }
          if (n1.value !== n2.value) { $('accErr').textContent = 'Las dos contraseñas no son iguales.'; return; }
          btn.disabled = true; btn.textContent = 'Guardando…'; $('accErr').textContent = '';
          try { await A.cambiarClave(n1.value); await comprobar(true); }
          catch (e) { $('accErr').textContent = A.traducir(e); btn.disabled = false; btn.textContent = 'Guardar y empezar a dibujar'; }
        };
        btn.onclick = guardar;
        n1.onkeydown = e => { if (e.key === 'Enter') n2.focus(); };
        n2.onkeydown = e => { if (e.key === 'Enter') guardar(); };
        setTimeout(() => n1.focus(), 50);
      });
  }

  function pantallaEstado(r) {
    const email = r.email || (A.sesion() || {}).email || '';
    let titulo, txt, wa;
    if (r.estado === 'sin_licencia') {
      titulo = 'Este correo no tiene un plan activo';
      txt = `<b>${esc(email)}</b> todavía no tiene acceso a OXEN PRO. Si ya pagaste, puede que tu acceso esté a otro correo o que aún no se haya activado.`;
      wa = 'Hola, quiero activar OXEN PRO con el correo ' + email;
    } else if (r.estado === 'vencido') {
      titulo = 'Tu plan venció';
      txt = `Tu acceso venció el <b>${fecha(r.vence)}</b>. Renueva para seguir dibujando. Tus bocetos siguen guardados en este dispositivo.`;
      wa = 'Hola, quiero renovar OXEN PRO. Mi correo es ' + email;
    } else if (r.estado === 'bloqueado') {
      titulo = 'Tu cuenta está suspendida';
      txt = 'Escríbenos para revisar tu cuenta. Tus bocetos siguen guardados en este dispositivo.';
      wa = 'Hola, mi cuenta de OXEN PRO aparece suspendida. Mi correo es ' + email;
    } else if (r.estado === 'equipo_vencido') {
      titulo = 'El plan de tu equipo venció';
      txt = 'Entras a OXEN PRO como parte de un equipo y su plan ya no está activo. Pide a quien te agregó que lo renueve. Tus bocetos siguen guardados en este dispositivo.';
      wa = 'Hola, el plan de mi equipo de OXEN PRO venció. Mi correo es ' + email;
    } else if (r.estado === 'limite') {
      titulo = 'Llegaste al límite de dispositivos';
      txt = `Tu cuenta permite usar OXEN PRO en <b>${r.max}</b> dispositivo${r.max > 1 ? 's' : ''} y ya está activa en otro${r.max > 1 ? 's' : ''}. Pide que liberemos uno para usarlo aquí.`;
      wa = 'Hola, quiero cambiar el dispositivo donde uso OXEN PRO. Mi correo es ' + email;
    } else {
      titulo = 'No pudimos comprobar tu acceso';
      txt = esc(r.mensaje || 'Intenta otra vez en un momento.');
      wa = 'Hola, tengo un problema para entrar a OXEN PRO. Mi correo es ' + email;
    }
    mostrar(`<h2>${titulo}</h2><p class="acc-txt">${txt}</p>${btnWhats(wa)}
      <button class="acc-btn acc-sec" id="accReintentar">Ya está, volver a comprobar</button>${pieCorreo()}`, () => {
      $('accReintentar').onclick = () => { mostrarCargando(); comprobar(true); };
      enlazarOtro();
    });
  }
  function pantallaSinInternet() {
    mostrar(`<h2>Necesitas internet</h2><p class="acc-txt">Conéctate una vez para comprobar tu plan. Después OXEN PRO funciona hasta ${DIAS_SIN_INTERNET} días sin conexión.</p>
      <button class="btn-verde acc-btn" id="accReintentar">Reintentar</button>${pieCorreo()}`, () => {
      $('accReintentar').onclick = () => { mostrarCargando(); comprobar(true); };
      enlazarOtro();
    });
  }
  function mostrarCargando() { mostrar('<div class="acc-carga"><span></span><p class="acc-txt">Comprobando tu acceso…</p></div>'); }

  // ---------- Comprobación con el servidor ----------
  let ultimaComprobacion = 0;
  async function comprobar(visible) {
    ultimaComprobacion = Date.now();
    let r;
    try { r = await A.rpc('verificar_licencia', { p_device: dispositivo(), p_nombre: nombreDispositivo() }); }
    catch (e) {
      if (e.red) { if (licenciaGuardadaValida()) { ocultar(); pintarCuenta(); return; } return pantallaSinInternet(); }
      if (e.sinSesion || e.status === 401) { try { localStorage.removeItem(K_LIC); } catch (x) {} return pasoCorreo(visible ? 'Tu sesión se cerró. Vuelve a entrar.' : ''); }
      if (licenciaGuardadaValida()) { ocultar(); pintarCuenta(); return; }
      return pantallaEstado({ estado: 'error', mensaje: A.traducir(e) });
    }
    if (r && r.estado === 'ok') {
      // compensa si el reloj del equipo está desfasado respecto al servidor
      const desfase = r.ahora ? Date.now() - new Date(r.ahora).getTime() : 0;
      if (r.debe_cambiar) { try { localStorage.removeItem(K_LIC); } catch (e) {} return pasoCrearClave(r); }
      escribir(K_LIC, { email: r.email, nombre: r.nombre, plan: r.plan, dueno: r.dueno_equipo || null, vence: new Date(new Date(r.vence).getTime() + desfase).toISOString(), ok: Date.now() });
      ocultar(); pintarCuenta();
      return;
    }
    try { localStorage.removeItem(K_LIC); } catch (e) {}
    if (r && r.estado === 'sin_sesion') return pasoCorreo();
    pantallaEstado(r || {});
  }

  // ---------- Botón de cuenta en la galería y aviso de vencimiento ----------
  function pintarCuenta() {
    const c = leer(K_LIC); if (!c) return;
    const d = diasHasta(c.vence);
    const grupo = document.querySelector('#galeria .gal-cab .grupo');
    if (grupo && !$('btnCuenta')) {
      const b = document.createElement('button');
      b.id = 'btnCuenta'; b.className = 'ib'; b.title = 'Mi cuenta';
      b.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
      b.onclick = verCuenta;
      grupo.insertBefore(b, grupo.firstChild);
    }
    let aviso = $('accAviso');
    if (d <= AVISO_DIAS && d < 3650) {
      if (!aviso) {
        aviso = document.createElement('div'); aviso.id = 'accAviso'; aviso.className = 'act-banner';
        const gal = $('galeria'), cab = gal && gal.querySelector('.gal-cab');
        if (cab) cab.insertAdjacentElement('afterend', aviso);
      }
      aviso.innerHTML = `<span>${d <= 1 ? 'Tu plan vence hoy o mañana' : 'Tu plan vence en ' + d + ' días'} (${fecha(c.vence)}).</span>` +
        (WHATSAPP ? `<a class="btn-verde" target="_blank" rel="noopener" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola, quiero renovar OXEN PRO. Mi correo es ' + c.email)}">Renovar</a>` : '');
    } else if (aviso) aviso.remove();
  }

  function verCuenta() {
    const c = leer(K_LIC) || {}, d = c.vence ? diasHasta(c.vence) : 0;
    const vence = !c.vence ? '—' : (d > 3650 ? 'Sin vencimiento' : fecha(c.vence) + ` (quedan ${d} día${d === 1 ? '' : 's'})`);
    mostrar(`<h2>Mi cuenta</h2>
      <div class="acc-datos">
        <div><span>Correo</span><b>${esc(c.email)}</b></div>
        ${c.plan ? `<div><span>Plan</span><b>${esc(c.plan)}</b></div>` : ''}
        <div><span>Vence</span><b>${esc(vence)}</b></div>
        <div><span>Este dispositivo</span><b>${esc(nombreDispositivo())}</b></div>
        ${window.Nube ? `<div><span>Nube</span><b id="accNube">${esc(window.Nube.resumen())}</b></div>` : ''}
      </div>
      ${window.Nube ? '<button class="acc-link" id="accRespaldar">Respaldar todo en la nube ahora</button>' : ''}
      ${d <= 30 && d < 3650 ? btnWhats('Hola, quiero renovar OXEN PRO. Mi correo es ' + c.email) : ''}
      <button class="btn-verde acc-btn" id="accVolver">Volver a dibujar</button>
      ${window.Equipo ? '<button class="acc-btn acc-sec" id="accEquipo">Mi equipo</button>' : ''}
      <button class="acc-link" id="accCambiarClave">Cambiar mi contraseña</button>
      <button class="acc-link acc-rojo" id="accSalir">Cerrar sesión en este dispositivo</button>`, () => {
      $('accVolver').onclick = ocultar;
      $('accCambiarClave').onclick = () => pasoCrearClave(null, true);
      if ($('accEquipo')) $('accEquipo').onclick = () => window.Equipo.pantalla();
      if ($('accRespaldar')) $('accRespaldar').onclick = () => window.Nube.respaldarTodo();
      if (window.Nube) window.Nube.refrescar().then(() => window.Nube.pintarEstado());
      $('accSalir').onclick = async () => {
        if (!confirm('¿Cerrar sesión? Tus bocetos se quedan en este dispositivo, pero tendrás que volver a entrar con tu correo.')) return;
        await A.salir(); try { localStorage.removeItem(K_LIC); } catch (e) {} pasoCorreo();
      };
    });
  }

  window.OxenAcceso = { mostrar, ocultar, verCuenta, licencia: () => leer(K_LIC) };

  // ---------- Inicio ----------
  if (!A.sesion()) pasoCorreo();
  else if (licenciaGuardadaValida()) { pintarCuenta(); comprobar(false); }
  else { mostrarCargando(); comprobar(true); }

  // al volver a la app, comprobar de nuevo cada 6 horas
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && A.sesion() && Date.now() - ultimaComprobacion > 6 * 36e5) comprobar(false);
  });
})();
