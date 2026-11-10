# OXEN PRO

**Bocetos para arquitectos.** Lápices con grano de papel, tintas, marcadores que se superponen como los reales, acuarela, texturas de materiales (ladrillo, concreto, madera, piedra, pasto, agua…), guías de perspectiva de 1, 2 y 3 puntos, isometría y cuadrícula.

## Descargar

| Sistema | Instalador |
|---|---|
| 🤖 Android (tableta y celular) | [OXEN-PRO.apk](https://github.com/riuk1126/oxenpro/releases/latest/download/OXEN-PRO.apk) |
| 🌐 Navegador (para probar) | [riuk1126.github.io/oxenpro](https://riuk1126.github.io/oxenpro/) |

La app de Android se actualiza sola: cada mejora que se sube aquí llega a la tableta al abrirla.

## Cuentas y licencias
- Al abrir, OXEN PRO pide **correo y contraseña** y revisa que el plan esté vigente.
- En el **panel** registras al cliente y se genera su **contraseña temporal**; la primera vez que entra, la app le pide crear la suya.
- Sin internet sigue funcionando **7 días** desde la última comprobación.
- Cada cuenta se puede usar en un número limitado de equipos (por defecto 2).
- **Panel de clientes:** [riuk1126.github.io/oxenpro/panel.html](https://riuk1126.github.io/oxenpro/panel.html) (se puede instalar como programa) — crear clientes, renovar, bloquear, generar contraseñas, liberar equipos y ver pagos.
- **Equipos:** desde el panel defines cuántas personas puede tener cada cliente. En la app, *Mi cuenta → Mi equipo* agrega personas por correo (entran con el plan del dueño y reciben una contraseña temporal).
- **Bocetos compartidos:** menú ⋯ del boceto → *Compartir con…* y eliges a qué personas del equipo (o a todo el equipo). En la galería, debajo del boceto, aparece con quiénes lo compartes; desde el mismo menú puedes cambiar las personas. Cada vez que sales del boceto se sube la última versión; el equipo la ve en *Compartidos por mi equipo* (zoom, exportar o hacer una copia).
- Los datos viven en Supabase (proyecto *oxenpro*). El número de WhatsApp para comprar/renovar se pone en `web/acceso.js` (`WHATSAPP`).

## Cómo se usa
- **Lápiz**: dibuja, con presión e inclinación (de lado sombrea como un lápiz real).
- **Dedo**: con un dedo mueves el lienzo; con dos lo acercas, alejas y giras.
- **Toque con 2 dedos** = deshacer · **toque con 3 dedos** = rehacer.
- **Mantén el lápiz quieto al final de un trazo** y se convierte en línea recta, círculo, elipse o rectángulo.
- **Guías** (ícono de perspectiva): elige 1, 2 o 3 puntos de fuga, arrastra los puntos verdes y activa la asistencia para que las líneas se alineen solas.
- **Relleno** (ícono de lazo): dibuja un contorno y se rellena con la textura o el color elegido.
- **Arrastra el círculo de color** (arriba a la derecha) a un ambiente cerrado y se rellena (como ColorDrop de Procreate).
- **Pinceles importados**: en Pinceles → Importados puedes traer pinceles de Procreate (.brush, .brushset), Photoshop (.abr) o una imagen PNG/JPG.
- **Texturas**: cada material (porcelanato, parquet, deck, OSB, sillar, granito…) es un pincel en Pinceles → Texturas.
- **Selección** (ícono de recuadro): encierra algo con el lazo y muévelo, escálalo, gíralo, voltéalo o duplícalo. Toca otra vez el ícono para copiar, pegar o seleccionar toda la capa.
- **Nota en el plano** (ícono de pin): arrástrala al punto exacto; queda numerada. Tócala (con el dedo o el lápiz) para leerla; todas aparecen en la ventana de notas de la izquierda.
- **Formas**: tras enderezar, sin soltar mueve el lápiz para agrandar o girar; un dedo la vuelve perfecta.
- **Estructura**: columnas, vigas (se pegan a las columnas), placas y zapatas; al ponerlas pide sus medidas. Columnas y zapatas salen **acotadas** en el plano y, al moverlas, una de sus esquinas se **pega** al punto o la línea más cercana.
- **Líneas encadenadas** (levantamiento y planta): la siguiente línea arranca justo donde terminó la anterior (punto verde); las cotas automáticas quedan **siempre por fuera** de la figura, incluidas las diagonales.
- **Terrenos no rectos** (barra de abajo en planta y levantamiento): líneas **Rectas/Libres** con largo y ángulo en vivo, **cota de ángulo** y **Terreno por medidas** (lado por lado: largo y ángulo interior, con cotas y ángulos automáticos).
- **Simetría** (en Guías), **bloquear transparencia** y **grupos** (en Capas), **imagen de referencia** para calcar (en Acciones).
- **Cortes**: nuevo tipo de hoja **Corte** (capas Cortado / Proyección / Color). Cota → **Nivel**: el primero es el ±0.00 y los demás se calculan solos (NPT, NFP, NTT, NFL, NFV, NTN, NFC). Mobiliario, baño y cocina, estructura (losa aligerada, viga, cimiento, escalera, terreno, vanos, baranda) y personas y vegetación **vistos en corte**.
- **Borrador**: al borrar una línea medida (o pasar por el número) también se borra su cota.
- **Acciones → Mover o centrar todo el dibujo**, **Agrandar la hoja**; y en Notas → Hoja, **escala personalizada** (puede conservar las medidas reales redibujando todo).
- **Notas con foto**: al crear o editar una nota puedes agregar una foto de referencia y mostrarla en el plano con un llamado.
- **Mantén el lápiz quieto** al empezar = tomar color · **3 dedos hacia abajo** = copiar y pegar · **toque con 4 dedos** = pantalla completa · **pellizco rápido** = encajar la hoja.

## Sacar un APK nuevo
Cambia `"version"` en `package.json` (por ejemplo `1.0.1`) y sube el cambio con `[apk]` en el mensaje, o en **Actions → Construir OXEN → Run workflow**.
