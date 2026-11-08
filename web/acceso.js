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

  function pasoCorreo(msg) {
    const previo = leer(K_MAIL) || '';
    mostrar(`
      <h2>Entra a tu cuenta</h2>
      <p class="acc-txt">Escribe el correo con el que compraste OXEN PRO. Te enviaremos un código para entrar, sin contraseñas.</p>
      <input id="accMail" class="acc-input" type="email" inputmode="email" autocomplete="email" placeholder="tucorreo@gmail.com" value="${esc(previo)}">
      <p id="accErr" class="acc-err">${esc(msg || '')}</p>
      <button id="accEnviar" class="btn-verde acc-btn">Enviarme el código</button>
      <p class="acc-mini">¿Aún no tienes OXEN PRO?${WHATSAPP ? ' <a target="_blank" rel="noopener" href="https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hola, quiero comprar OXEN PRO') + '">Cómpralo aquí</a>' : ' Pide tu acceso a quien te vendió la app.'}</p>`,
      () => {
        const inp = $('accMail'), btn = $('accEnviar');
        const enviar = async () => {
          const email = inp.value.trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('accErr').textContent = 'Revisa que el correo esté bien escrito.'; return; }
          btn.disabled = true; btn.textContent = 'Enviando…'; $('accErr').textContent = '';
          try { await A.pedirCodigo(email); escribir(K_MAIL, email); pasoCodigo(email); }
          catch (e) { $('accErr').textContent = A.traducir(e); btn.disabled = false; btn.textContent = 'Enviarme el código'; }
        };
        btn.onclick = enviar; inp.onkeydown = e => { if (e.key === 'Enter') enviar(); };
        setTimeout(() => inp.focus(), 50);
      });
  }

  function pasoCodigo(email) {
    mostrar(`
      <h2>Revisa tu correo</h2>
      <p class="acc-txt">Enviamos un código a <b>${esc(email)}</b>. Si no aparece, mira en Spam o Promociones.</p>
      <input id="accCod" class="acc-input acc-codigo" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="••••••">
      <p class="acc-mini" style="text-align:left;margin:8px 0 0">¿Te llegó un enlace en vez de un código? No lo abras: mantenlo presionado, elige <b>Copiar enlace</b> y pégalo aquí.</p>
      <p id="accErr" class="acc-err"></p>
      <button id="accEntrar" class="btn-verde acc-btn">Entrar</button>
      <div class="acc-fila"><button class="acc-link" id="accReenviar">Enviar otro código</button><button class="acc-link" id="accCambiar">Cambiar correo</button></div>`,
      () => {
        const inp = $('accCod'), btn = $('accEntrar');
        const entrar = async () => {
          const val = inp.value.trim();
          if (!A.pareceEnlace(val) && val.replace(/\D/g, '').length < 6) { $('accErr').textContent = 'El código tiene 6 números o más.'; return; }
          btn.disabled = true; btn.textContent = 'Entrando…'; $('accErr').textContent = '';
          try { await A.verificarCodigoOEnlace(email, val); await comprobar(true); }
          catch (e) { $('accErr').textContent = A.traducir(e); btn.disabled = false; btn.textContent = 'Entrar'; }
        };
        btn.onclick = entrar;
        inp.oninput = () => inp.classList.toggle('acc-enlace', A.pareceEnlace(inp.value));
        inp.onkeydown = e => { if (e.key === 'Enter') entrar(); };
        $('accCambiar').onclick = () => pasoCorreo();
        $('accReenviar').onclick = async () => {
          try { await A.pedirCodigo(email); $('accErr').textContent = 'Listo, te enviamos un código nuevo.'; }
          catch (e) { $('accErr').textContent = A.traducir(e); }
        };
        setTimeout(() => inp.focus(), 50);
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
      txt = `Tu acceso venció el <b>${fecha(r.vence)}</b>. Renueva para seguir dibujando. Tus bocetos siguen guardados en este equipo.`;
      wa = 'Hola, quiero renovar OXEN PRO. Mi correo es ' + email;
    } else if (r.estado === 'bloqueado') {
      titulo = 'Tu cuenta está suspendida';
      txt = 'Escríbenos para revisar tu cuenta. Tus bocetos siguen guardados en este equipo.';
      wa = 'Hola, mi cuenta de OXEN PRO aparece suspendida. Mi correo es ' + email;
    } else if (r.estado === 'limite') {
      titulo = 'Llegaste al límite de equipos';
      txt = `Tu plan permite usar OXEN PRO en <b>${r.max}</b> equipo${r.max > 1 ? 's' : ''} y ya está activo en otro${r.max > 1 ? 's' : ''}. Pide que liberemos uno para usarlo aquí.`;
      wa = 'Hola, quiero cambiar el equipo donde uso OXEN PRO. Mi correo es ' + email;
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
      escribir(K_LIC, { email: r.email, nombre: r.nombre, plan: r.plan, vence: new Date(new Date(r.vence).getTime() + desfase).toISOString(), ok: Date.now() });
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
        <div><span>Este equipo</span><b>${esc(nombreDispositivo())}</b></div>
      </div>
      ${d <= 30 && d < 3650 ? btnWhats('Hola, quiero renovar OXEN PRO. Mi correo es ' + c.email) : ''}
      <button class="btn-verde acc-btn" id="accVolver">Volver a dibujar</button>
      <button class="acc-link acc-rojo" id="accSalir">Cerrar sesión en este equipo</button>`, () => {
      $('accVolver').onclick = ocultar;
      $('accSalir').onclick = async () => {
        if (!confirm('¿Cerrar sesión? Tus bocetos se quedan en este equipo, pero tendrás que volver a entrar con tu correo.')) return;
        await A.salir(); try { localStorage.removeItem(K_LIC); } catch (e) {} pasoCorreo();
      };
    });
  }

  // ---------- Inicio ----------
  if (!A.sesion()) pasoCorreo();
  else if (licenciaGuardadaValida()) { pintarCuenta(); comprobar(false); }
  else { mostrarCargando(); comprobar(true); }

  // al volver a la app, comprobar de nuevo cada 6 horas
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && A.sesion() && Date.now() - ultimaComprobacion > 6 * 36e5) comprobar(false);
  });
})();
