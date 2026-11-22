// OXEN — texturas de arquitectura (tiles que se repiten sin costuras)
// Cada textura se dibuja en negro sobre fondo transparente y luego se colorea.
'use strict';

const Texturas = (() => {
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // dibuja fn en las 9 posiciones para que el tile sea continuo
  function wrap(ctx, S, fn) {
    for (let dx = -S; dx <= S; dx += S)
      for (let dy = -S; dy <= S; dy += S) {
        ctx.save(); ctx.translate(dx, dy); fn(); ctx.restore();
      }
  }

  const lista = [
    { id: 'achurado', nombre: 'Achurado', S: 48, draw(c, S) {
      c.lineWidth = 2.2; c.beginPath();
      for (let k = -S; k <= 2 * S; k += 12) { c.moveTo(k, 0); c.lineTo(k - S, S); }
      c.stroke();
    } },
    { id: 'cruzado', nombre: 'Achurado cruzado', S: 48, draw(c, S) {
      c.lineWidth = 1.8; c.beginPath();
      for (let k = -S; k <= 2 * S; k += 12) { c.moveTo(k, 0); c.lineTo(k - S, S); c.moveTo(k - S, 0); c.lineTo(k, S); }
      c.stroke();
    } },
    { id: 'ladrillo', nombre: 'Ladrillo', S: 96, draw(c, S) {
      const h = 24, w = 48; c.lineWidth = 2.2; c.beginPath();
      for (let y = 0; y <= S; y += h) { c.moveTo(0, y); c.lineTo(S, y); }
      for (let r = 0; r < S / h; r++) {
        const off = r % 2 ? w / 2 : 0;
        for (let x = off; x <= S; x += w) { c.moveTo(x, r * h); c.lineTo(x, r * h + h); }
      }
      c.stroke();
    } },
    { id: 'concreto', nombre: 'Concreto', S: 160, draw(c, S) {
      const r = rng(7);
      const items = [];
      for (let i = 0; i < 26; i++) items.push([r() * S, r() * S, 3 + r() * 6, r() * 6.28]);
      for (let i = 0; i < 160; i++) items.push([r() * S, r() * S, 0, -1]);
      wrap(c, S, () => {
        c.lineWidth = 1.6;
        for (const [x, y, s, a] of items) {
          if (a < 0) { c.fillRect(x, y, 1.8, 1.8); continue; }
          c.beginPath();
          for (let k = 0; k < 3; k++) {
            const aa = a + k * 2.09 + (k ? 0.4 : 0);
            c[k ? 'lineTo' : 'moveTo'](x + Math.cos(aa) * s, y + Math.sin(aa) * s);
          }
          c.closePath(); c.stroke();
        }
      });
    } },
    { id: 'madera', nombre: 'Madera', S: 160, draw(c, S) {
      const r = rng(11); c.lineWidth = 1.6;
      for (let y = 0; y < S; y += 10) {
        const a = 2 + r() * 3, f = 1 + Math.floor(r() * 2), ph = r() * 6.28;
        c.beginPath();
        for (let x = 0; x <= S; x += 4) {
          const yy = y + Math.sin((x / S) * 6.283 * f + ph) * a;
          x ? c.lineTo(x, yy) : c.moveTo(x, yy);
        }
        c.stroke();
      }
      wrap(c, S, () => { c.beginPath(); c.ellipse(S * 0.62, S * 0.45, 14, 5, 0, 0, 6.283); c.stroke(); });
    } },
    { id: 'piedra', nombre: 'Piedra', S: 180, draw(c, S) {
      const r = rng(3), n = 4, cell = S / n, stones = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const cx = (i + 0.5) * cell + (r() - 0.5) * cell * 0.25, cy = (j + 0.5) * cell + (r() - 0.5) * cell * 0.25;
        const pts = [], m = 6 + Math.floor(r() * 3);
        for (let k = 0; k < m; k++) {
          const a = (k / m) * 6.283 + r() * 0.3, rad = cell * (0.36 + r() * 0.1);
          pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
        }
        stones.push(pts);
      }
      wrap(c, S, () => {
        c.lineWidth = 2; c.lineJoin = 'round';
        for (const p of stones) { c.beginPath(); p.forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.stroke(); }
      });
    } },
    { id: 'pasto', nombre: 'Pasto / vegetación', S: 140, draw(c, S) {
      const r = rng(5), tufts = [];
      for (let i = 0; i < 18; i++) tufts.push([r() * S, r() * S, 6 + r() * 6]);
      wrap(c, S, () => {
        c.lineWidth = 1.5; c.lineCap = 'round'; c.beginPath();
        for (const [x, y, h] of tufts) for (let k = -2; k <= 2; k++) { c.moveTo(x + k * 1.5, y); c.lineTo(x + k * 3.2, y - h * (1 - Math.abs(k) * 0.18)); }
        c.stroke();
      });
    } },
    { id: 'agua', nombre: 'Agua', S: 120, draw(c, S) {
      const r = rng(9), waves = [];
      for (let y = 10; y < S; y += 20) for (let x = (y / 20) % 2 ? 0 : 30; x < S; x += 60) waves.push([x + r() * 10, y]);
      wrap(c, S, () => {
        c.lineWidth = 1.6; c.lineCap = 'round';
        for (const [x, y] of waves) { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 6, y - 5, x + 12, y); c.quadraticCurveTo(x + 18, y + 5, x + 24, y); c.stroke(); }
      });
    } },
    { id: 'losetas', nombre: 'Cerámica / losetas', S: 96, draw(c, S) {
      c.lineWidth = 1.8; c.beginPath();
      for (let k = 0; k <= S; k += 32) { c.moveTo(k, 0); c.lineTo(k, S); c.moveTo(0, k); c.lineTo(S, k); }
      c.stroke();
    } },
    { id: 'tablones', nombre: 'Piso de madera', S: 192, draw(c, S) {
      const h = 24, r = rng(2); c.lineWidth = 1.8; c.beginPath();
      for (let y = 0; y <= S; y += h) { c.moveTo(0, y); c.lineTo(S, y); }
      for (let row = 0; row < S / h; row++) {
        const off = Math.floor(r() * 4) * 48;
        for (let x = off % 96; x < S; x += 96) { c.moveTo(x, row * h); c.lineTo(x, row * h + h); }
      }
      c.stroke();
    } },
    { id: 'tierra', nombre: 'Tierra / terreno', S: 140, draw(c, S) {
      const r = rng(13), d = [];
      for (let i = 0; i < 140; i++) d.push([r() * S, r() * S, 0.8 + r() * 1.6]);
      wrap(c, S, () => { for (const [x, y, s] of d) { c.beginPath(); c.arc(x, y, s, 0, 6.283); c.fill(); } });
    } },
    { id: 'arena', nombre: 'Arena', S: 128, draw(c, S) {
      const r = rng(21);
      for (let i = 0; i < 700; i++) c.fillRect(Math.floor(r() * S), Math.floor(r() * S), 1.4, 1.4);
    } },
    { id: 'puntos', nombre: 'Trama de puntos', S: 32, draw(c, S) {
      wrap(c, S, () => { c.beginPath(); c.arc(8, 8, 2.4, 0, 6.283); c.arc(24, 24, 2.4, 0, 6.283); c.fill(); });
    } },
    { id: 'teja', nombre: 'Teja', S: 96, draw(c, S) {
      c.lineWidth = 2;
      for (let row = 0; row <= S / 24; row++) {
        const y = row * 24, off = row % 2 ? 16 : 0;
        for (let x = -32 + off; x <= S + 32; x += 32) { c.beginPath(); c.arc(x + 16, y, 16, 0, Math.PI); c.stroke(); }
      }
    } },
    { id: 'aislante', nombre: 'Aislante', S: 64, draw(c, S) {
      c.lineWidth = 1.8; c.beginPath();
      for (let x = 0; x <= S; x += 16) {
        c.moveTo(x, 0); c.quadraticCurveTo(x + 16, S * 0.25, x, S * 0.5); c.quadraticCurveTo(x - 16, S * 0.75, x, S);
      }
      c.stroke();
    } },
    { id: 'marmol', nombre: 'Mármol', S: 220, draw(c, S) {
      const r = rng(31);
      wrap(c, S, () => {
        for (let k = 0; k < 7; k++) {
          let x = r() * S, y = r() * S, a = r() * 6.28; c.lineWidth = 0.6 + r() * 1.4; c.beginPath(); c.moveTo(x, y);
          for (let i = 0; i < 14; i++) { a += (r() - 0.5) * 0.9; x += Math.cos(a) * 9; y += Math.sin(a) * 9; c.lineTo(x, y); }
          c.stroke();
        }
      });
    } },
    { id: 'grava', nombre: 'Grava', S: 150, draw(c, S) {
      const r = rng(17), g = [];
      for (let i = 0; i < 60; i++) { const x = r() * S, y = r() * S, s = 3 + r() * 5, m = 5 + Math.floor(r() * 3), a0 = r() * 6.28, pts = [];
        for (let k = 0; k < m; k++) { const a = a0 + k / m * 6.28, rr = s * (0.7 + r() * 0.5); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8]); } g.push(pts); }
      wrap(c, S, () => { c.lineWidth = 1.4; c.lineJoin = 'round'; for (const p of g) { c.beginPath(); p.forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.stroke(); } });
    } },
    { id: 'adoquin', nombre: 'Adoquín', S: 96, draw(c, S) {
      c.lineWidth = 1.8; c.beginPath();
      for (let y = 0; y <= S; y += 24) { c.moveTo(0, y); c.lineTo(S, y); }
      for (let row = 0; row < 4; row++) { const off = row % 2 ? 0 : 24; for (let x = off; x <= S; x += 48) { c.moveTo(x, row * 24); c.lineTo(x, row * 24 + 24); } }
      c.stroke();
      c.lineWidth = 0.8; c.beginPath(); for (let y = 0; y < S; y += 24) for (let x = 0; x < S; x += 12) { c.moveTo(x + 4, y + 5); c.lineTo(x + 6, y + 6); } c.stroke();
    } },
    { id: 'cesped', nombre: 'Césped', S: 120, draw(c, S) {
      const r = rng(23), b = [];
      for (let i = 0; i < 90; i++) b.push([r() * S, r() * S, 4 + r() * 5, (r() - 0.5) * 0.8]);
      wrap(c, S, () => { c.lineWidth = 1.1; c.lineCap = 'round'; c.beginPath(); for (const [x, y, h, a] of b) { c.moveTo(x, y); c.lineTo(x + Math.sin(a) * h, y - Math.cos(a) * h); } c.stroke(); });
    } },
    { id: 'terrazo', nombre: 'Terrazo', S: 160, draw(c, S) {
      const r = rng(41), ch = [];
      for (let i = 0; i < 70; i++) { const x = r() * S, y = r() * S, s = 1.5 + r() * 4.5, m = 3 + Math.floor(r() * 3), a0 = r() * 6.28, pts = [];
        for (let k = 0; k < m; k++) { const a = a0 + k / m * 6.28 + r() * 0.5; pts.push([x + Math.cos(a) * s, y + Math.sin(a) * s]); } ch.push(pts); }
      wrap(c, S, () => { for (const p of ch) { c.beginPath(); p.forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); } });
    } },
    { id: 'terreno', nombre: 'Terreno natural', S: 96, draw(c, S) {
      c.lineWidth = 1.8; c.beginPath();
      for (let x = 0; x <= S; x += 24) { c.moveTo(x, 0); c.lineTo(x + 12, 12); c.moveTo(x + 4, 0); c.lineTo(x + 16, 12); c.moveTo(x + 8, 0); c.lineTo(x + 20, 12); }
      for (let x = -12; x <= S; x += 24) { c.moveTo(x, 48); c.lineTo(x + 12, 60); c.moveTo(x + 4, 48); c.lineTo(x + 16, 60); c.moveTo(x + 8, 48); c.lineTo(x + 20, 60); }
      c.stroke();
    } },
    { id: 'armado', nombre: 'Concreto armado', S: 160, draw(c, S) {
      const r = rng(51), it = [];
      for (let i = 0; i < 18; i++) it.push([r() * S, r() * S, 3 + r() * 5, r() * 6.28]);
      for (let i = 0; i < 80; i++) it.push([r() * S, r() * S, 0, -1]);
      c.lineWidth = 1.2; c.beginPath(); for (let k = -S; k <= 2 * S; k += 20) { c.moveTo(k, 0); c.lineTo(k - S, S); } c.stroke();
      wrap(c, S, () => { c.lineWidth = 1.4; for (const [x, y, s, a] of it) { if (a < 0) { c.fillRect(x, y, 1.8, 1.8); continue; } c.beginPath(); for (let k = 0; k < 3; k++) { const aa = a + k * 2.09; c[k ? 'lineTo' : 'moveTo'](x + Math.cos(aa) * s, y + Math.sin(aa) * s); } c.closePath(); c.stroke(); } });
    } },
    { id: 'metal', nombre: 'Metal / acero', S: 48, draw(c, S) {
      c.lineWidth = 1.6; c.beginPath();
      for (let k = -S; k <= 2 * S; k += 16) { c.moveTo(k, 0); c.lineTo(k - S, S); c.moveTo(k + 4, 0); c.lineTo(k + 4 - S, S); }
      c.stroke();
    } },
    { id: 'vidrio', nombre: 'Vidrio', S: 96, draw(c, S) {
      c.lineWidth = 1.4; c.beginPath();
      for (const [x, y] of [[14, 30], [20, 30], [62, 76], [68, 76]]) { c.moveTo(x, y); c.lineTo(x + 14, y - 14); }
      c.stroke();
    } },
    { id: 'hexagonal', nombre: 'Mosaico hexagonal', S: 0, draw(c) {
      const R = 14, h = R * Math.sqrt(3), W = 3 * R, H = h * 2; c.canvas.width = W * 2; c.canvas.height = H;
      c.strokeStyle = '#000'; c.lineWidth = 1.6;
      const hex = (cx, cy) => { c.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; c[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * R, cy + Math.sin(a) * R); } c.closePath(); c.stroke(); };
      for (let i = -1; i <= 3; i++) for (let j = -1; j <= 3; j++) hex(i * 1.5 * R, j * h + (i % 2 ? h / 2 : 0));
    } },
    { id: 'piedra_laja', nombre: 'Enchape de piedra', S: 192, draw(c, S) {
      const r = rng(61); c.lineWidth = 1.8; c.lineJoin = 'round';
      for (let y = 0; y < S; y += 32) {
        let x = (y / 32) % 2 ? -20 : 0;
        c.beginPath(); c.moveTo(0, y); c.lineTo(S, y); c.stroke();
        while (x < S) { const w = 30 + r() * 40; c.beginPath(); c.moveTo(x + w, y); c.lineTo(x + w + (r() - 0.5) * 6, y + 32); c.stroke(); x += w; }
      }
    } },
    { id: 'zigzag', nombre: 'Aislante rígido', S: 48, draw(c, S) {
      c.lineWidth = 1.6; c.beginPath();
      for (let y = 0; y < S; y += 12) { c.moveTo(0, y + 12); for (let x = 0; x <= S; x += 12) c.lineTo(x + 6, x % 24 ? y + 12 : y); }
      c.stroke();
    } },
    { id: 'rayas', nombre: 'Rayado horizontal', S: 24, draw(c, S) { c.lineWidth = 1.4; c.beginPath(); for (let y = 0; y <= S; y += 8) { c.moveTo(0, y); c.lineTo(S, y); } c.stroke(); } },
    { id: 'puntos_finos', nombre: 'Puntillado', S: 120, draw(c, S) {
      const r = rng(71);
      for (let i = 0; i < 420; i++) { const x = r() * S, y = r() * S; c.beginPath(); c.arc(x, y, 0.6 + r() * 0.9, 0, 6.283); c.fill(); }
    } },

    // ---------- v1.7: más acabados ----------
    { id: 'porcelanato', nombre: 'Porcelanato 60×60', S: 120, draw(c, S) {
      c.lineWidth = 1.3; c.beginPath(); for (let k = 0; k <= S; k += 60) { c.moveTo(k, 0); c.lineTo(k, S); c.moveTo(0, k); c.lineTo(S, k); } c.stroke();
      const r = rng(31); c.globalAlpha = 0.18; c.lineWidth = 0.8;
      for (let i = 0; i < 6; i++) { const x = r() * S, y = r() * S; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + 10, y + 6, x + 18, y - 4, x + 30, y + 3); c.stroke(); }
      c.globalAlpha = 1;
    } },
    { id: 'porcelanato_rect', nombre: 'Porcelanato 60×120', S: 180, draw(c, S) {
      const w = 90, h = 45; c.lineWidth = 1.3; c.beginPath();
      for (let y = 0; y <= S; y += h) { c.moveTo(0, y); c.lineTo(S, y); }
      for (let r = 0; r < S / h; r++) { const off = r % 2 ? w / 2 : 0; for (let x = off; x <= S; x += w) { c.moveTo(x, r * h); c.lineTo(x, r * h + h); } }
      c.stroke();
    } },
    { id: 'ceramico_peq', nombre: 'Cerámico pequeño / mosaico', S: 48, draw(c, S) {
      c.lineWidth = 1.1; c.beginPath(); for (let k = 0; k <= S; k += 12) { c.moveTo(k, 0); c.lineTo(k, S); c.moveTo(0, k); c.lineTo(S, k); } c.stroke();
    } },
    { id: 'damero', nombre: 'Parquet en damero', S: 96, draw(c, S) {
      c.lineWidth = 1.3; c.beginPath();
      for (let by = 0; by < S; by += 48) for (let bx = 0; bx < S; bx += 48) {
        c.rect(bx, by, 48, 48);
        const horiz = ((bx + by) / 48) % 2 === 0;
        for (let k = 12; k < 48; k += 12) { if (horiz) { c.moveTo(bx, by + k); c.lineTo(bx + 48, by + k); } else { c.moveTo(bx + k, by); c.lineTo(bx + k, by + 48); } }
      }
      c.stroke();
    } },
    { id: 'chevron', nombre: 'Parquet espiga (chevron)', S: 96, draw(c, S) {
      c.lineWidth = 1.3; c.beginPath();
      for (let x = 0; x <= S; x += 24) { c.moveTo(x, 0); c.lineTo(x, S); }
      for (let x = 0; x < S; x += 24) { const sube = (x / 24) % 2 === 0; for (let y = -24; y <= S + 24; y += 16) { c.moveTo(x, y + (sube ? 12 : 0)); c.lineTo(x + 24, y + (sube ? 0 : 12)); } }
      c.stroke();
    } },
    { id: 'deck', nombre: 'Deck de madera', S: 160, draw(c, S) {
      const r = rng(5); c.lineWidth = 1.3; c.beginPath();
      for (let y = 0; y < S; y += 20) { c.moveTo(0, y); c.lineTo(S, y); c.moveTo(0, y + 3); c.lineTo(S, y + 3); }
      c.stroke(); c.globalAlpha = 0.35; c.lineWidth = 0.8; c.beginPath();
      for (let y = 0; y < S; y += 20) for (let k = 0; k < 3; k++) { const yy = y + 7 + r() * 10, x = r() * S; c.moveTo(x, yy); c.lineTo(x + 30 + r() * 40, yy + (r() - 0.5) * 2); }
      c.stroke(); c.globalAlpha = 1;
      for (let y = 0; y < S; y += 20) for (const x of [20, 100]) { c.beginPath(); c.arc(x, y + 11.5, 1.3, 0, 6.283); c.fill(); }
    } },
    { id: 'osb', nombre: 'OSB / aglomerado', S: 160, draw(c, S) {
      const r = rng(9); c.lineWidth = 1; wrap(c, S, () => {
        for (let i = 0; i < 70; i++) { const x = r() * S, y = r() * S, a = r() * Math.PI, l = 10 + r() * 18, w = 3 + r() * 3;
          c.save(); c.translate(x, y); c.rotate(a); c.globalAlpha = 0.5 + r() * 0.5; c.strokeRect(-l / 2, -w / 2, l, w); c.restore(); }
      }); c.globalAlpha = 1;
    } },
    { id: 'tarrajeo', nombre: 'Tarrajeo / yeso', S: 128, draw(c, S) {
      const r = rng(13); for (let i = 0; i < 260; i++) { const x = r() * S, y = r() * S; c.globalAlpha = 0.25 + r() * 0.5; c.beginPath(); c.arc(x, y, 0.4 + r() * 0.8, 0, 6.283); c.fill(); }
      c.globalAlpha = 0.3; c.lineWidth = 0.8; for (let i = 0; i < 12; i++) { const x = r() * S, y = r() * S; c.beginPath(); c.arc(x, y, 3 + r() * 5, r() * 6, r() * 6 + 1.2); c.stroke(); }
      c.globalAlpha = 1;
    } },
    { id: 'calamina', nombre: 'Calamina / plancha ondulada', S: 48, draw(c, S) {
      c.beginPath(); for (let x = 0; x <= S; x += 12) { c.lineWidth = 1.6; c.moveTo(x, 0); c.lineTo(x, S); } c.stroke();
      c.globalAlpha = 0.45; c.lineWidth = 0.9; c.beginPath(); for (let x = 6; x <= S; x += 12) { c.moveTo(x, 0); c.lineTo(x, S); } c.stroke(); c.globalAlpha = 1;
    } },
    { id: 'bloque', nombre: 'Bloque de concreto', S: 160, draw(c, S) {
      const w = 80, h = 40; c.lineWidth = 2; c.beginPath();
      for (let y = 0; y <= S; y += h) { c.moveTo(0, y); c.lineTo(S, y); }
      for (let r = 0; r < S / h; r++) { const off = r % 2 ? w / 2 : 0; for (let x = off; x <= S; x += w) { c.moveTo(x, r * h); c.lineTo(x, r * h + h); } }
      c.stroke();
    } },
    { id: 'sillar', nombre: 'Sillar', S: 192, draw(c, S) {
      const w = 96, h = 48, r = rng(21); c.lineWidth = 1.6; c.beginPath();
      for (let y = 0; y <= S; y += h) { c.moveTo(0, y); c.lineTo(S, y); }
      for (let k = 0; k < S / h; k++) { const off = k % 2 ? w / 2 : 0; for (let x = off; x <= S; x += w) { c.moveTo(x, k * h); c.lineTo(x, k * h + h); } }
      c.stroke(); for (let i = 0; i < 90; i++) { c.globalAlpha = 0.25 + r() * 0.4; c.beginPath(); c.arc(r() * S, r() * S, 0.6 + r() * 1.6, 0, 6.283); c.fill(); } c.globalAlpha = 1;
    } },
    { id: 'grassblock', nombre: 'Grass block (concreto y pasto)', S: 96, draw(c, S) {
      c.lineWidth = 1.6; c.beginPath(); for (let k = 0; k <= S; k += 48) { c.moveTo(k, 0); c.lineTo(k, S); c.moveTo(0, k); c.lineTo(S, k); } c.stroke();
      const r = rng(4); c.lineWidth = 1; c.beginPath();
      for (let by = 0; by < S; by += 48) for (let bx = 0; bx < S; bx += 48) { c.rect(bx + 10, by + 10, 28, 28);
        for (let i = 0; i < 8; i++) { const x = bx + 13 + r() * 22, y = by + 34 - r() * 4; c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 4, y - 6 - r() * 8); } }
      c.stroke();
    } },
    { id: 'alfombra', nombre: 'Alfombra', S: 64, draw(c, S) {
      const r = rng(17); for (let i = 0; i < 520; i++) { c.globalAlpha = 0.2 + r() * 0.5; c.beginPath(); c.arc(r() * S, r() * S, 0.5 + r() * 0.7, 0, 6.283); c.fill(); } c.globalAlpha = 1;
    } },
    { id: 'drywall', nombre: 'Drywall / tablero', S: 240, draw(c, S) {
      c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, S); c.moveTo(120, 0); c.lineTo(120, S); c.stroke();
      for (const x of [0, 120]) for (let y = 15; y < S; y += 30) { c.beginPath(); c.arc(x + 6, y, 1.2, 0, 6.283); c.fill(); c.beginPath(); c.arc(x + 114, y, 1.2, 0, 6.283); c.fill(); }
    } },
    { id: 'estriada', nombre: 'Plancha estriada (acero)', S: 40, draw(c, S) {
      c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath();
      for (let y = 0; y <= S; y += 20) for (let x = 0; x <= S; x += 20) { const alt = ((x + y) / 20) % 2 === 0;
        if (alt) { c.moveTo(x - 4, y - 4); c.lineTo(x + 4, y + 4); } else { c.moveTo(x - 4, y + 4); c.lineTo(x + 4, y - 4); } }
      c.stroke();
    } },
    { id: 'malla', nombre: 'Malla / rejilla', S: 32, draw(c, S) {
      c.lineWidth = 1.1; c.beginPath(); for (let k = -S; k <= 2 * S; k += 16) { c.moveTo(k, 0); c.lineTo(k + S, S); c.moveTo(k, S); c.lineTo(k + S, 0); } c.stroke();
    } },
    { id: 'listones', nombre: 'Listones / celosía', S: 48, draw(c, S) {
      c.lineWidth = 1.4; c.beginPath(); for (let x = 0; x < S; x += 16) c.rect(x + 1, -2, 10, S + 4); c.stroke();
    } },
    { id: 'granito', nombre: 'Granito / cuarzo', S: 160, draw(c, S) {
      const r = rng(23); wrap(c, S, () => { for (let i = 0; i < 160; i++) { const x = r() * S, y = r() * S, k = 0.6 + r() * 2.6;
        c.globalAlpha = 0.25 + r() * 0.7; c.beginPath(); c.moveTo(x + k, y); for (let j = 1; j < 5; j++) { const a = j / 5 * 6.283; c.lineTo(x + Math.cos(a) * k * (0.6 + r() * 0.6), y + Math.sin(a) * k * (0.6 + r() * 0.6)); } c.closePath(); c.fill(); } });
      c.globalAlpha = 1;
    } },
    { id: 'corcho', nombre: 'Corcho', S: 120, draw(c, S) {
      const r = rng(29); for (let i = 0; i < 180; i++) { c.globalAlpha = 0.3 + r() * 0.5; c.beginPath(); c.ellipse(r() * S, r() * S, 0.8 + r() * 2.5, 0.6 + r() * 1.6, r() * 3, 0, 6.283); c.fill(); } c.globalAlpha = 1;
    } },
  ];

  const base = {};
  function tile(id) {
    if (base[id]) return base[id];
    const t = lista.find(x => x.id === id) || lista[0];
    const cv = document.createElement('canvas'); cv.width = cv.height = t.S || 64;
    const c = cv.getContext('2d'); c.fillStyle = c.strokeStyle = '#000';
    t.draw(c, t.S);
    return (base[id] = cv);
  }
  const coloreados = new Map();
  function coloreado(id, color) {
    const k = id + color;
    if (coloreados.has(k)) return coloreados.get(k);
    const b = tile(id), cv = document.createElement('canvas');
    cv.width = b.width; cv.height = b.height;
    const c = cv.getContext('2d');
    c.drawImage(b, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = color; c.fillRect(0, 0, cv.width, cv.height);
    if (coloreados.size > 60) coloreados.clear();
    coloreados.set(k, cv);
    return cv;
  }
  function patron(ctx, id, color, escala) {
    const p = ctx.createPattern(coloreado(id, color), 'repeat');
    if (escala && escala !== 1 && p.setTransform) p.setTransform(new DOMMatrix().scale(escala));
    return p;
  }

  // ---- grano de papel (para lápiz y carboncillo) ----
  function grano(S, radio, corte, seed) {
    const r = rng(seed), n = new Float32Array(S * S);
    for (let i = 0; i < n.length; i++) n[i] = r();
    // desenfoque con envoltura → continuo
    const tmp = new Float32Array(S * S);
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        let s = 0; for (let k = -radio; k <= radio; k++) s += n[y * S + ((x + k + S) % S)];
        tmp[y * S + x] = s / (2 * radio + 1);
      }
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        let s = 0; for (let k = -radio; k <= radio; k++) s += tmp[((y + k + S) % S) * S + x];
        n[y * S + x] = s / (2 * radio + 1);
      }
    }
    let mn = 1, mx = 0; for (const v of n) { if (v < mn) mn = v; if (v > mx) mx = v; }
    const cv = document.createElement('canvas'); cv.width = cv.height = S;
    const c = cv.getContext('2d'), im = c.createImageData(S, S);
    const fine = rng(seed + 1);
    for (let i = 0; i < n.length; i++) {
      let v = (n[i] - mn) / (mx - mn);
      v = v * 0.75 + fine() * 0.25;
      const a = Math.max(0, Math.min(1, (v - corte) / (1 - corte) * 1.6));
      im.data[i * 4 + 3] = a * 255;
    }
    c.putImageData(im, 0, 0);
    return cv;
  }
  const granos = {};
  function granoBase(id) {
    if (!granos[id]) granos[id] = id === 'grueso' ? grano(256, 2, 0.38, 77) : grano(256, 1, 0.3, 42);
    return granos[id];
  }
  const granosCol = new Map();
  function patronGrano(ctx, id, color) {
    const k = id + color;
    let cv = granosCol.get(k);
    if (!cv) {
      const b = granoBase(id); cv = document.createElement('canvas'); cv.width = b.width; cv.height = b.height;
      const c = cv.getContext('2d'); c.drawImage(b, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = color; c.fillRect(0, 0, cv.width, cv.height);
      if (granosCol.size > 40) granosCol.clear();
      granosCol.set(k, cv);
    }
    return ctx.createPattern(cv, 'repeat');
  }

  return { lista, tile, coloreado, patron, patronGrano, granoBase };
})();
