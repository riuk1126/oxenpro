# Flexio

Modelado 3D para arquitectos en Android (tableta y celular), con el flujo de un modelador de superficies: dibujas líneas y figuras, las caras se forman solas y las conviertes en volumen con **Empujar / tirar**. Se entra con la **cuenta RAIKI** (el mismo correo y contraseña de OXEN PRO y Kivo).

## Descargar
- 🤖 Android: [Flexio.apk](https://github.com/riuk1126/oxenpro/releases/download/flexio-v1.0.0/Flexio.apk)
- 🌐 Navegador (para probar): [riuk1126.github.io/oxenpro/3d](https://riuk1126.github.io/oxenpro/flexio/)

La app de Android carga la versión publicada aquí, así que cada mejora le llega sola. Cuando hace falta un APK nuevo, la app lo avisa y se actualiza desde adentro.

## Herramientas
Seleccionar · Borrador · Pintar (colores y texturas: ladrillo, concreto, madera, parquet, porcelanato, piedra, pasto, agua, mármol, tejas, vidrio) · Línea · Arco · Rectángulo · Círculo · Polígono · Empujar/tirar · Mover (y copiar, «x3» repite, «/3» divide) · Rotar · Escala · Equidistancia · Cinta métrica · Cota · Órbita · Desplazar · Grupos (agrupar, editar por dentro, explotar) · Invertir caras · Rayos X · Vistas (iso, planta, frontal, laterales, perspectiva o paralela).

**Inferencias:** extremo (verde), punto medio (celeste), en arista (rojo), en cara (azul), ejes rojo/verde/azul, paralela a una arista (morado). Botones X/Y/Z para bloquear un eje.

**Medidas exactas:** mientras dibujas, toca la caja de abajo a la derecha y escribe: `2.5`, `250cm`, `3;4` (rectángulo), `36l` (lados del círculo), `x3` (repetir copias).

## Para empezar
- **Tutorial** de bienvenida la primera vez que entras (y en *Menú → Tutorial* o en la galería).
- **Modelos de ejemplo** en la galería: casa de un piso, comedor, escalera y un plano para levantar.
- Al tocar una herramienta aparece su nombre y cómo se usa; la activa se marca en morado con una línea al costado.

## Arquitectura: vanos, ventanas y puertas
- **Vano automático:** dibuja un rectángulo en un muro y empújalo con *Empujar / tirar* hasta el otro lado: al llegar se abre solo (también si escribes el espesor). Funciona con puertas que llegan al piso y vanos en el extremo del muro.
- **Barra derecha (biblioteca):** Ventanas, Puertas, Vanos, Baño, Cocina, Muebles y Otros. Eliges una pieza, escribes **ancho, alto y alféizar** y tocas el muro: lo corta de lado a lado y se adapta a su espesor. Mientras la ubicas ves la distancia a cada borde; después de colocarla puedes escribir la distancia exacta al borde izquierdo o cambiar las medidas en el panel y se vuelve a colocar.
- **Tus propios componentes:** selecciona algo que modelaste → *A la biblioteca* (nombre y categoría). Los de Puertas y Ventanas abren su vano y se estiran al ancho y alto que les des; los demás (inodoros, muebles…) se colocan en el piso o contra un muro con el ancho, fondo y alto que quieras.
- **Importar varios a la vez:** botón *Importar modelos* de la barra derecha: eliges muchos `.skp`, `.dae`, `.obj` o `.stl` y cada uno queda como componente (la categoría se adivina por el nombre del archivo). La biblioteca se guarda en el equipo.

## Gestos
- **Con lápiz:** el lápiz usa la herramienta; **2 dedos giran (órbita) y hacen zoom**; 1 dedo o 3 dedos desplazan. En *Ajustes* se puede invertir.
- **Sin lápiz:** 1 dedo usa la herramienta; 2 dedos giran y hacen zoom; 3 dedos desplazan.
- Toque con 2 dedos = deshacer · con 3 dedos = rehacer.

## Archivos
- **Abre:** SketchUp `.skp` (con sus colores), planos de AutoCAD `.dwg` y `.dxf`, COLLADA `.dae`, `.obj`, `.stl` y `.r3d` (formato propio).
- **Planos de AutoCAD:** las líneas, arcos, polilíneas y bloques llegan al suelo como un grupo (centrado y en metros), con la opción de formar las caras de las áreas cerradas para levantar los muros con *Empujar / tirar*. Los textos, cotas y achurados no se traen.
- Los lectores de `.skp` ([OpenSKP](https://github.com/iamahsanmehmood/openskp), MIT) y `.dwg` ([LibreDWG](https://github.com/mlightcad/libredwg-web), GPL) están en `web/lib/` y se descargan la primera vez que abres un archivo de ese tipo (hace falta internet esa vez).
- **Exporta:** `.dae` (para volver a SketchUp, Blender, Revit…), `.obj`, `.stl`, `.r3d` e imagen `.png`.
- Los modelos se guardan solos en el equipo.

## Compartir con el equipo
- En el menú ⋯ de un modelo (o *Menú → Compartir con mi equipo…* dentro del modelo) eliges a las personas de tu equipo RAIKI o escribes su correo.
- Ellas lo ven en **Compartidos conmigo** y pueden seguir modelándolo. Cada vez que alguien sale del modelo se sube la última versión y los demás la reciben al abrirlo («Nueva versión»).
- Si dos personas lo cambian a la vez, la app pregunta: traer la versión del otro, traerla y guardar la tuya como copia, o quedarte con la tuya.
- Solo el dueño elige con quién compartir o deja de compartir. Datos en Supabase: tabla `flexio_compartidos` y depósito `flexio`.

## Cuenta
Entra cualquier cuenta RAIKI con plan activo (OXEN PRO, Kivo o combo) o miembro de un equipo activo. La comprobación usa la función `acceso_raiki` de Supabase y **no ocupa** los cupos de dispositivos de OXEN PRO. Sin internet funciona 7 días desde la última comprobación.

## Sacar un APK nuevo
Cambia `"version"` en `modelo3d/movil/package.json` y sube el cambio con `[apk3d]` en el mensaje, o en **Actions → Construir Flexio → Run workflow**.
