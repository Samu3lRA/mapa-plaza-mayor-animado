# Mapa Plaza Mayor Animado

Tablero web interactivo de seguimiento de los proyectos de inversión de Plaza Mayor Medellín. Está construido con HTML, CSS y JavaScript puros, sin frameworks ni compilación.

## Qué incluye

- Mapa responsive con 19 proyectos numerados (1–19), leyenda de pabellones, tooltips, búsqueda y filtros por estado y pabellón.
- Búsqueda y filtros por estado y pabellón.
- Panel de información por proyecto: foto o galería, valor, fecha, ubicación, cronología, alcance, avance, responsable y notas.
- Línea de tiempo 2026 – 2027: Ejecución (9 proyectos con mes y año, y resumen Contratado / Ejecutado / Ejecución) y Contratación y estructuración.
- Botón **Resumen PDF** en el encabezado: genera un PDF A4 (indicadores, gráficas, línea de tiempo y tabla de proyectos) con los datos actuales.
- Las gráficas «Proyectos por tipo» y «Proyectos por estado» son editables; el centro muestra la suma real de los porcentajes.
- Gráficas de distribución de la inversión, de estado y de tipo (editables).
- Tema claro y oscuro.
- Modo presentación, modo grabación y modo enfoque.
- Impresión de ficha por proyecto y, desde el modo edición, informe de todos los proyectos (PDF desde el navegador).
- Modo edición con respaldo e importación.

> La imagen aérea y las fotografías de los proyectos son materiales del usuario. No se inventan ni se sustituyen.

## Estructura

```text
mapa-plaza-mayor-animado/
├── index.html
├── css/estilos.css
├── js/
│   ├── datos.js         datos de los proyectos, colores, línea de tiempo, versión y fecha
│   ├── app.js           mapa, marcadores, edición, filtros, respaldos y línea de tiempo
│   ├── animaciones.js   arrastre del plano y animaciones del mapa
│   ├── mejoras.js       galería, cronología del proyecto, informes e impresión
│   ├── interfaz.js      zoom, centrar, pantalla completa y botones movibles del mapa
│   ├── calendario.js    (sin uso: el calendario por año se retiró; se puede borrar)
│   └── informe.js       resumen ejecutivo en PDF
├── assets/fotos/        fotos de los espacios (JPG)
├── IMAGEN_MAPA/         plano aéreo, logotipos e ícono de la pestaña
├── GUIA_INTERNA_MANTENIMIENTO.md
└── .nojekyll
```

El plano usado por el mapa es `IMAGEN_MAPA/mapa-plaza-mayor.jpg` (2424 × 1115 px, recorte de la foto aérea DJI_0798). Una imagen de mayor resolución se vería más nítida al acercar con el zoom; si la reemplazas, conserva la misma proporción (2.17:1) para que los puntos no se desplacen.

## Ejecutar localmente

Desde la raíz:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`.

## Editar los 19 proyectos

Todo el contenido editable está en `js/datos.js`. Cada registro admite `nombre`, `valor`, `fecha`, `estado`, `pabellon`, `x`, `y`, `fotos`, `descripcion`, `alcance`, `avance`, `responsable` y `notas`.

Los proyectos sin pabellón comienzan con `pabellon: "sin"`. No se asignan automáticamente.

No se deben agregar unidades a los valores hasta confirmarlas.

Al final de cada cambio publicado en `datos.js`:

1. Sube el número de `DATOS_VERSION` (1 → 2 → 3…).
2. Actualiza `FECHA_ACTUALIZACION`, que es la fecha que se muestra en el encabezado.

## Fotos

Las fotos viven en `assets/fotos/` y se asignan en el campo `fotos` de cada proyecto en `js/datos.js`, por ejemplo `fotos:['assets/fotos/zona-comidas.jpg']`.

Para que carguen rápido y sin riesgo:

- Usa **JPG** (los HEIC de iPhone no se ven en Chrome, Edge ni Firefox).
- Reduce a unos **1600 px** de lado largo (cada foto debería pesar menos de 500 KB).
- Quita los metadatos **EXIF/GPS** antes de subirlas: el repositorio puede ser público y las fotos de celular traen la ubicación.
- Usa nombres sin espacios ni tildes, en minúsculas y con guiones.

## Modo edición

El botón **Modo edición** no aparece para los visitantes. Para verlo, agrega `?editar=1` a la dirección, por ejemplo `https://…/index.html?editar=1`.

1. Arrastra un punto con mouse o dedo.
2. Selecciona un proyecto para cambiar su pabellón o sus datos.
3. **Copiar posiciones** copia los datos al portapapeles.
4. **Descargar respaldo** guarda un archivo `respaldo-mapa-plaza-mayor.json`.
5. **Importar respaldo** restaura un archivo descargado antes.
6. **Restablecer** elimina los cambios locales y vuelve a `datos.js`.

Los cambios se guardan únicamente en el `localStorage` de ese navegador (clave `plaza-mayor-mapa-edicion-v1`). La fuente de verdad sigue siendo `js/datos.js`.

Para fijar los cambios para todos, traslada los valores aprobados a `js/datos.js` y sube `DATOS_VERSION`. Si el navegador conserva ediciones de una versión anterior, el modo edición lo avisa al abrirse: descarga un respaldo y usa **Restablecer** para ver los datos publicados.

Los botones del mapa (centrar/enfoque, leyenda y barra de zoom) se mueven en modo edición con su asa naranja ⠿; doble clic en el asa devuelve el control a su sitio. La posición se guarda solo en ese navegador (clave `plaza-mayor-controles-v1`).

Las cifras de las gráficas (distribución de la inversión, estado y tipo) se editan directo en sus casillas y también se guardan solo en ese navegador.

## Modo presentación

Pulsa **Modo presentación**: entra en pantalla completa y recorre los 19 proyectos en el orden de `ORDEN_PRESENTACION` en `js/datos.js`. Esc para salir.

Cada punto permanece 6 segundos por defecto (`PRESENTATION_MS` en `app.js`).

- `Espacio`: pausar/reanudar.
- `←`: punto anterior.
- `→`: punto siguiente.
- `Esc`: salir.

## Modo grabación

Para una escena limpia de 16:9:

```text
?grabacion=1
```

Para ocultar también la leyenda mínima:

```text
?grabacion=1&leyenda=0
```

Para iniciar automáticamente la presentación:

```text
?grabacion=1&presentar=1
```

La combinación recomendada para una grabación de 30–90 segundos es `?grabacion=1&presentar=1`. El modo grabación oculta título, listas, controles y edición; conserva el mapa y el panel. El cursor se oculta después de 2 segundos sin movimiento.

### Grabación para Canva

1. Abre el navegador a pantalla completa.
2. Usa una ventana de **1920 × 1080** o una captura equivalente 16:9.
3. Carga `?grabacion=1&presentar=1`.
4. Inicia la captura de pantalla.
5. Deja que el recorrido termine para volver a la vista completa.

## GitHub Pages

El repositorio está preparado para GitHub Pages desde `main` y la raíz del proyecto. `.nojekyll` ya está incluido.

En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main → Folder: / (root)**.

Los archivos CSS y JS se cargan con un parámetro de versión (`?v=…` en `index.html`). Cuando cambies uno de ellos, cambia también su versión para que los navegadores no usen una copia vieja.

## Accesibilidad y movimiento

- Los puntos son botones reales.
- El foco de teclado es visible.
- `Enter`/clic abre el panel.
- `Esc` cierra el panel o la presentación.
- El foco vuelve al punto que abrió el panel.
- En `prefers-reduced-motion: reduce` se desactivan zoom, Ken Burns, conteo y respiración.

## Datos pendientes

Quedan deliberadamente vacíos hasta que el usuario los proporcione:

- pabellón definitivo de los 9 específicos;
- posiciones definitivas de los 19 puntos;
- fotos de los proyectos que aún no la tienen (hoy hay fotos para varios de los 19);
- descripciones;
- alcances;
- avances;
- responsables;
- unidades de las cifras.

## Actualizar los datos desde un Excel

En el modo edición (botón **✎ Editor**) hay dos botones nuevos: **Descargar plantilla Excel** y **Actualizar desde Excel**.

- La plantilla (`assets/plantilla-plan-de-inversion.xlsx`) trae los proyectos actuales. Se edita solo la hoja `Proyectos`; la hoja `Instrucciones` no se lee.
- Columnas leídas: `ID`, `Proyecto`, `Valor`, `Fecha de entrega` (mes y año) y `Estado` (En ejecución, Estructuración o Ejecutado). Cualquier otra columna u hoja se ignora.
- Solo se pueden cambiar nombre, valor, fecha y estado. Nunca se tocan posiciones, fotos, descripciones, pabellones ni notas.
- Antes de aplicar se muestra un resumen. Si hay errores (valor que no es número, fecha sin mes y año, estado inválido, filas repetidas) no se aplica nada.
- Un proyecto sin ID es nuevo: entra centrado en el mapa para ubicarlo a mano. Un proyecto que no está en el Excel se conserva.
- Por ahora los cambios quedan en el navegador de quien los aplica; publicarlos para todos es la fase siguiente. El lector de Excel (`js/vendor/xlsx.mini.min.js`, SheetJS 0.18.5) se carga solo al usar el botón.
