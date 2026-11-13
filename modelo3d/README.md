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

## Gestos
- **Con lápiz:** el lápiz usa la herramienta; 1 dedo gira; 2 dedos desplazan y hacen zoom.
- **Sin lápiz:** 1 dedo usa la herramienta; 2 dedos giran y hacen zoom; 3 dedos desplazan.
- Toque con 2 dedos = deshacer · con 3 dedos = rehacer.

## Archivos
- **Abre:** COLLADA `.dae` (con colores y unidades), `.obj`, `.stl` y `.r3d` (formato propio).
- **SketchUp (.skp):** es un formato cerrado; desde SketchUp usa *Archivo → Exportar → Modelo 3D → COLLADA (.dae)* y ábrelo aquí.
- **Exporta:** `.dae` (para volver a SketchUp, Blender, Revit…), `.obj`, `.stl`, `.r3d` e imagen `.png`.
- Los modelos se guardan solos en el equipo.

## Cuenta
Entra cualquier cuenta RAIKI con plan activo (OXEN PRO, Kivo o combo) o miembro de un equipo activo. La comprobación usa la función `acceso_raiki` de Supabase y **no ocupa** los cupos de dispositivos de OXEN PRO. Sin internet funciona 7 días desde la última comprobación.

## Sacar un APK nuevo
Cambia `"version"` en `modelo3d/movil/package.json` y sube el cambio con `[apk3d]` en el mensaje, o en **Actions → Construir Flexio → Run workflow**.
