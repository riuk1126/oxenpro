# OXEN PRO

**Bocetos para arquitectos.** Lápices con grano de papel, tintas, marcadores que se superponen como los reales, acuarela, texturas de materiales (ladrillo, concreto, madera, piedra, pasto, agua…), guías de perspectiva de 1, 2 y 3 puntos, isometría y cuadrícula.

## Descargar

| Sistema | Instalador |
|---|---|
| 🤖 Android (tableta y celular) | [OXEN-PRO.apk](https://github.com/riuk1126/oxenpro/releases/latest/download/OXEN-PRO.apk) |
| 🌐 Navegador (para probar) | [riuk1126.github.io/oxenpro](https://riuk1126.github.io/oxenpro/) |

La app de Android se actualiza sola: cada mejora que se sube aquí llega a la tableta al abrirla.

## RAIKI 3D (modelado 3D)
App aparte de modelado 3D con la misma cuenta RAIKI: ver [modelo3d/README.md](modelo3d/README.md) · [APK](https://github.com/riuk1126/oxenpro/releases/download/3d-v1.0.0/RAIKI-3D.apk) · [probar en el navegador](https://riuk1126.github.io/oxenpro/3d/).

## Cuentas y licencias
- Al abrir, OXEN PRO pide **correo y contraseña** y revisa que el plan esté vigente.
- En el **panel** registras al cliente y se genera su **contraseña temporal**; la primera vez que entra, la app le pide crear la suya.
- Sin internet sigue funcionando **7 días** desde la última comprobación.
- Cada cuenta se puede usar en un número limitado de equipos (por defecto 2).
- **Panel de clientes:** [riuk1126.github.io/oxenpro/panel.html](https://riuk1126.github.io/oxenpro/panel.html) (se puede instalar como programa) — crear clientes, renovar, bloquear, generar contraseñas, liberar equipos y ver pagos.
- **Equipos:** desde el panel defines cuántas personas puede tener cada cliente. En la app, *Mi cuenta → Mi equipo* agrega personas por correo (entran con el plan del dueño y reciben una contraseña temporal).
- **Bocetos compartidos:** menú ⋯ del boceto → *Compartir con…* y eliges a qué personas del equipo (o a todo el equipo). En la galería, debajo del boceto, aparece con quiénes lo compartes; desde el mismo menú puedes cambiar las personas. Cada vez que sales del boceto se sube la última versión; el equipo la ve en *Compartidos por mi equipo* (zoom, exportar o hacer una copia).
- Los datos viven en Supabase (proyecto *oxenpro*). El número de WhatsApp para comprar/renovar se pone en `web/acceso.js` (`WHATSAPP`).

## Levantamiento arquitectónico (nuevo tipo de hoja)
- **Muros editables**: arrastra para dibujar cada muro (pide largo y espesor: 0.10, 0.15, 0.25 u otro). El siguiente muro sigue desde el punto verde. Toca un muro para estirarlo desde sus extremos, moverlo, cambiar largo o espesor, o quitar su cota. Las esquinas y las "T" se unen solas.
- **Puertas y ventanas** se pegan al muro y lo cortan, con sus jambas.
- **Áreas**: toca dentro de un ambiente cerrado y ves su área libre y perímetro (transparente). Tócalo otra vez para ponerle nombre (Sala, Baño…) y dejar el área en el plano; se actualiza sola si mueves un muro. Al cerrar una figura, la app avisa su área.
- **Cuadro de vanos** (menú): tabla automática de puertas y ventanas con códigos P-1, V-1… En cada abertura, *Alturas…* para el alto y el alféizar.

## Calidad y fluidez
- **Alta resolución según el equipo**: las hojas nuevas se crean a 300 ppp en equipos potentes, 240 en medianos y 200 en sencillos (antes 150), sin pasar del tamaño que la tarjeta gráfica pinta rápido. Al crear la hoja puedes elegir Estándar, Alta o Máxima. Los pinceles y texturas mantienen su grosor real.
- **Lápiz en vivo**: mientras el lápiz está apoyado, el trazo se dibuja en una capa del tamaño de la pantalla (liviana y de baja latencia) y pasa a la capa real al levantarlo, solo en la zona que tocó. Así el navegador no tiene que volver a presentar una hoja de millones de píxeles en cada cuadro. El resultado es idéntico píxel a píxel.
- **Presión**: la app aprende hasta dónde llega la presión de tu lápiz (muchos en Android no pasan de 0.6) y la usa como presión completa; responde casi al instante. Con el dedo o un lápiz sin presión, el grosor varía con la velocidad.
- **Sin pausas**: el respaldo para deshacer se copia solo por donde pasa el lápiz; los trazos grandes guardan solo los cuadros que pintaron; las capas se comprimen en segundo plano al guardar; el límite de capas y la memoria del deshacer se ajustan a la RAM del equipo.

## Exportar e importar
- **PDF a escala**: con el tamaño real del papel (A4, A3…); impreso al 100 % la escala es exacta.
- **CAD (DXF)**: muros, cotas, puertas, ventanas, estructura, textos y ambientes, en metros y por capas. Los trazos a mano alzada no pasan (son dibujo, no líneas).
- **PDF de fondo**: abre un plano en PDF a tamaño real (calza con la escala de la hoja) o ajustado, para revisarlo o calcarlo.
- **Logo en el rótulo**: Notas → *Poner mi logo en el rótulo* (cada cuenta pone el suyo).

## Nube y comentarios
- **Nube** (icono ☁ en el inicio): cada boceto se respalda en tu cuenta al salir de él. La pantalla ☁ muestra todo lo que tienes en la nube y en este equipo: abrir o descargar, subir ahora, quitar de la nube o guardar en el dispositivo. En otro equipo, la galería también muestra *En la nube*.
- **Guardar en el dispositivo**: menú ⋯ del boceto → *Guardar en el dispositivo (.oxen)*: un archivo con el boceto completo que se vuelve a abrir desde ☁ → *Abrir archivo .oxen*.
- **Eliminar**: si el boceto está en la nube, eliges quitarlo solo de este equipo (se recupera desde ☁) o de todos lados.
- **Comentarios del equipo**: en un boceto compartido, el equipo toca *Comentarios → Comentar en un punto* y marca el lugar. El dueño ve los pines numerados al abrir el boceto, responde y los marca como resueltos.

## Panel
- **🎁 Prueba gratis 7 días** en un toque; los clientes en prueba salen en azul con *Activar plan* para cuando paguen.
- **💰 Pagos**: lo cobrado por mes y por método (Yape, Plin…), y descarga a Excel. Cada pago se registra al crear, renovar o activar a un cliente con su monto.

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
- **Líneas encadenadas** (levantamiento y planta): la siguiente línea arranca justo donde terminó la anterior (punto verde); las cotas automáticas quedan **siempre por fuera** de la figura, incluidas las diagonales. Toca una cota y aparecen **dos manijas** (una a cada lado): toca la del otro lado para pasarla, o arrástrala para alejarla. Tócala otra vez para cambiar la medida.
- **Terrenos no rectos** (barra de abajo en planta y levantamiento): líneas **Rectas/Libres** con largo y ángulo en vivo, **cota de ángulo** y **Terreno por medidas** (lado por lado: largo y ángulo interior, con cotas y ángulos automáticos).
- **Simetría** (en Guías), **bloquear transparencia** y **grupos** (en Capas), **imagen de referencia** para calcar (en Acciones).
- **Cortes**: nuevo tipo de hoja **Corte** (capas Cortado / Proyección / Color). Cota → **Nivel**: el primero es el ±0.00 y los demás se calculan solos (NPT, NFP, NTT, NFL, NFV, NTN, NFC). Mobiliario, baño y cocina, estructura (losa aligerada, viga, cimiento, escalera, terreno, vanos, baranda) y personas y vegetación **vistos en corte**.
- **Borrador**: al borrar una línea medida (o pasar por el número) también se borra su cota.
- **Acciones → Mover o centrar todo el dibujo**, **Agrandar la hoja**; y en Notas → Hoja, **escala personalizada** (puede conservar las medidas reales redibujando todo).
- **Notas con foto**: al crear o editar una nota puedes agregar una foto de referencia y mostrarla en el plano con un llamado.
- **Mantén el lápiz quieto** al empezar = tomar color · **3 dedos hacia abajo** = copiar y pegar · **toque con 4 dedos** = pantalla completa · **pellizco rápido** = encajar la hoja.

## Sacar un APK nuevo
Cambia `"version"` en `package.json` (por ejemplo `1.0.1`) y sube el cambio con `[apk]` en el mensaje, o en **Actions → Construir OXEN → Run workflow**.
