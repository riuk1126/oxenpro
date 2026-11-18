// Flexio — tutorial de bienvenida: tarjetas paso a paso que resaltan cada parte de la pantalla.
(function (G) {
  'use strict';
  const CLAVE = 'flexio-tutorial-v1';
  let capa = null, pasos = [], i = 0, alTerminar = null;

  function crear() {
    capa = document.createElement('div'); capa.id = 'tuto';
    capa.innerHTML = '<div class="tuto-luz"></div><div class="tuto-tarjeta panel"><b class="tuto-tit"></b><div class="tuto-ilus"></div><p class="tuto-txt"></p><div class="tuto-pie"><div class="tuto-puntos"></div><div class="tuto-bts"><button class="tuto-saltar">Saltar</button><button class="tuto-atras">Atrás</button><button class="tuto-sig">Siguiente</button></div></div></div>';
    document.body.appendChild(capa);
    capa.querySelector('.tuto-saltar').onclick = () => cerrar(true);
    capa.querySelector('.tuto-atras').onclick = () => ir(i - 1);
    capa.querySelector('.tuto-sig').onclick = () => (i < pasos.length - 1 ? ir(i + 1) : cerrar(true));
    addEventListener('resize', () => { if (capa && !capa.classList.contains('oculto')) ir(i); });
  }

  function ir(n) {
    i = Math.max(0, Math.min(pasos.length - 1, n));
    const p = pasos[i], luz = capa.querySelector('.tuto-luz'), t = capa.querySelector('.tuto-tarjeta');
    if (p.antes) try { p.antes(); } catch (e) {}
    capa.querySelector('.tuto-tit').textContent = p.tit;
    capa.querySelector('.tuto-txt').innerHTML = p.txt;
    capa.querySelector('.tuto-ilus').innerHTML = p.ilus || '';
    capa.querySelector('.tuto-ilus').style.display = p.ilus ? '' : 'none';
    capa.querySelector('.tuto-puntos').innerHTML = pasos.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
    capa.querySelector('.tuto-atras').style.visibility = i ? 'visible' : 'hidden';
    capa.querySelector('.tuto-sig').textContent = i === pasos.length - 1 ? (p.fin || '¡Empezar!') : 'Siguiente';
    capa.querySelector('.tuto-saltar').style.visibility = i === pasos.length - 1 ? 'hidden' : 'visible';
    const el = p.sel ? document.querySelector(p.sel) : null;
    const W = innerWidth, H = innerHeight;
    t.style.left = t.style.top = ''; t.classList.remove('centro');
    if (el && el.offsetParent !== null) {
      const r = el.getBoundingClientRect(), m = 6;
      Object.assign(luz.style, { display: 'block', left: r.left - m + 'px', top: r.top - m + 'px', width: r.width + 2 * m + 'px', height: r.height + 2 * m + 'px' });
      // la tarjeta va donde haya más espacio
      const tw = Math.min(360, W - 24); t.style.width = tw + 'px';
      const th = t.offsetHeight || 220;
      let x, y;
      if (r.right + 16 + tw < W) { x = r.right + 16; y = r.top + r.height / 2 - th / 2; }
      else if (r.left - 16 - tw > 0) { x = r.left - 16 - tw; y = r.top + r.height / 2 - th / 2; }
      else if (r.bottom + 16 + th < H) { x = r.left + r.width / 2 - tw / 2; y = r.bottom + 16; }
      else { x = r.left + r.width / 2 - tw / 2; y = r.top - 16 - th; }
      t.style.left = Math.max(12, Math.min(W - tw - 12, x)) + 'px';
      t.style.top = Math.max(12, Math.min(H - th - 12, y)) + 'px';
    } else {
      luz.style.display = 'none'; t.classList.add('centro'); t.style.width = Math.min(400, W - 24) + 'px';
    }
  }

  function cerrar(visto) {
    if (capa) capa.classList.add('oculto');
    if (visto) try { localStorage.setItem(CLAVE, '1'); } catch (e) {}
    const f = alTerminar; alTerminar = null; if (f) f();
  }

  function iniciar(lista, fin) {
    if (!capa) crear();
    pasos = lista; alTerminar = fin || null; capa.classList.remove('oculto');
    ir(0); requestAnimationFrame(() => ir(0));
  }
  function visto() { try { return localStorage.getItem(CLAVE) === '1'; } catch (e) { return true; } }

  G.R3.Tutorial = { iniciar, visto, cerrar };
})(window);
