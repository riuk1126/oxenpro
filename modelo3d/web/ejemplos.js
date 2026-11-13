// Flexio — modelos de ejemplo (se construyen con las mismas operaciones que usa el usuario).
(function (G) {
  'use strict';
  const V = () => G.R3.V;

  // grupo nuevo
  function grupo(m, nombre) { const g = m.id(); m.grupos.set(g, { id: g, nombre }); return g; }
  // cara plana a partir de un contorno
  function cara(m, g, P) {
    const es = [];
    for (let i = 0; i < P.length; i++) es.push(...m.linea(P[i], P[(i + 1) % P.length], g, { forzar: true }));
    const cs = m.buscarCaras(es, g, [0, 0, -1]);
    return cs[0] || 0;
  }
  // prisma: contorno P (plano) extruido según el vector dir (perpendicular al contorno)
  function prisma(m, g, P, dir, mat) {
    const f = cara(m, g, P); if (!f) return;
    const F = m.f.get(f), d = V().len(dir), s = V().dot(F.n, dir) >= 0 ? 1 : -1;
    m.empujar(f, s * d);
    if (mat != null) pintar(m, g, mat);
  }
  function caja(m, nombre, x, y, z, sx, sy, sz, mat) {
    const g = grupo(m, nombre);
    prisma(m, g, [[x, y, z], [x + sx, y, z], [x + sx, y + sy, z], [x, y + sy, z]], [0, 0, sz], mat);
    return g;
  }
  function pintar(m, g, mat) { for (const f of m.f.values()) if (f.g === g) { f.mat = mat; f.matB = mat; m.tocar(f.id); } }

  // Materiales: 1 blanco · 2 gris claro · 3 gris oscuro · 5 arena · 13 vidrio · 21 concreto · 22 madera · 23 parquet · 24 porcelanato · 26 pasto · 29 tejas
  const lista = [
    {
      id: 'casa', nombre: 'Casa de un piso', desc: 'Muros, vanos, techo a dos aguas y jardín.',
      construir(m) {
        caja(m, 'Jardín', -4, -4, -0.02, 16, 14, 0.02, 26);
        caja(m, 'Piso', 0, 0, 0, 8, 6, 0.15, 21);
        const h = 2.6, e = 0.15, z = 0.15;
        // muros con vano de puerta (frente) y ventanas
        caja(m, 'Muro frente izq.', 0, 0, z, 3.4, e, h, 1);
        caja(m, 'Muro frente der.', 4.4, 0, z, 3.6, e, h, 1);
        caja(m, 'Dintel puerta', 3.4, 0, z + 2.1, 1, e, h - 2.1, 1);
        caja(m, 'Muro fondo', 0, 6 - e, z, 8, e, h, 1);
        caja(m, 'Muro izquierdo', 0, e, z, e, 6 - 2 * e, h, 1);
        caja(m, 'Muro derecho bajo', 8 - e, e, z, e, 6 - 2 * e, 0.9, 1);
        caja(m, 'Muro derecho alto', 8 - e, e, z + 2.1, e, 6 - 2 * e, h - 2.1, 1);
        caja(m, 'Ventana', 8 - e / 2 - 0.01, e, z + 0.9, 0.02, 6 - 2 * e, 1.2, 13);
        caja(m, 'Puerta', 3.45, 0.04, z, 0.9, 0.05, 2.08, 22);
        // techo a dos aguas: triángulo en el plano XZ extruido en Y
        const g = grupo(m, 'Techo');
        prisma(m, g, [[-0.4, -0.4, z + h], [8.4, -0.4, z + h], [4, -0.4, z + h + 1.6]], [0, 6.8, 0], 29);
        caja(m, 'Vereda', 2.9, -1.4, -0.02, 2, 1.4, 0.08, 2);
      }
    },
    {
      id: 'mesa', nombre: 'Comedor', desc: 'Mesa de madera con cuatro sillas.',
      construir(m) {
        caja(m, 'Alfombra', -1.4, -1.2, 0, 2.8, 2.4, 0.01, 5);
        caja(m, 'Tablero', -0.8, -0.45, 0.72, 1.6, 0.9, 0.04, 22);
        for (const [x, y] of [[-0.74, -0.39], [0.68, -0.39], [-0.74, 0.33], [0.68, 0.33]]) caja(m, 'Pata', x, y, 0, 0.06, 0.06, 0.72, 22);
        const silla = (cx, cy, rot) => {
          // rot: 0 respaldo hacia -y · 1 hacia +y
          const s = rot ? 1 : -1;
          caja(m, 'Asiento', cx - 0.22, cy - 0.22, 0.44, 0.44, 0.44, 0.04, 3);
          for (const [dx, dy] of [[-0.2, -0.2], [0.16, -0.2], [-0.2, 0.16], [0.16, 0.16]]) caja(m, 'Pata silla', cx + dx, cy + dy, 0, 0.04, 0.04, 0.44, 3);
          caja(m, 'Respaldo', cx - 0.22, cy + s * 0.22 - (s > 0 ? 0.04 : 0), 0.48, 0.44, 0.04, 0.42, 3);
        };
        silla(-0.4, -0.85, 0); silla(0.4, -0.85, 0); silla(-0.4, 0.85, 1); silla(0.4, 0.85, 1);
      }
    },
    {
      id: 'escalera', nombre: 'Escalera', desc: 'Escalera de 12 pasos con descanso.',
      construir(m) {
        const p = 0.28, c = 0.175, a = 1.0;
        for (let i = 0; i < 6; i++) caja(m, 'Paso ' + (i + 1), 0, i * p, 0, a, p, (i + 1) * c, 21);
        caja(m, 'Descanso', 0, 6 * p, 0, 2.1, 1.0, 7 * c, 21);
        for (let i = 0; i < 5; i++) caja(m, 'Paso ' + (i + 8), 1.1, 6 * p - (i + 1) * p, 0, a, p, (8 + i) * c, 21);
        caja(m, 'Llegada', 1.1, -0.6, 0, a, 0.6 + p, 13 * c, 21);
      }
    },
    {
      id: 'plano', nombre: 'Plano para levantar', desc: 'Muros en planta listos para subir con Empujar / tirar.',
      construir(m) {
        // muros como caras en el suelo: el usuario los levanta con Empujar / tirar
        const g = grupo(m, 'Plano');
        const e = 0.15, W = 7, L = 5;
        const muros = [
          [0, 0, W, e], [0, L - e, W, e], [0, e, e, L - 2 * e], [W - e, e, e, L - 2 * e],
          [3.2, e, e, 2.2], [3.2, 3.2, e, L - e - 3.2]
        ];
        for (const [x, y, sx, sy] of muros) cara(m, g, [[x, y, 0], [x + sx, y, 0], [x + sx, y + sy, 0], [x, y + sy, 0]]);
        pintar(m, g, 2);
        caja(m, 'Piso', 0, 0, -0.06, W, L, 0.05, 23);
      }
    }
  ];

  G.R3.Ejemplos = { lista };
})(window);
