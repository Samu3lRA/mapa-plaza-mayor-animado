# Mapa Plaza Mayor Animado

Tablero web interactivo de seguimiento de los proyectos de inversión de Plaza Mayor Medellín. Está construido con HTML, CSS y JavaScript puros, sin frameworks ni compilación.

## Qué incluye

- Mapa responsive con 22 proyectos (9 específicos y 13 generales), leyenda, tooltips y listas por pestañas.
- Búsqueda y filtros por estado y pabellón.
- Panel de información por proyecto: foto o galería, valor, fecha, ubicación, cronología, alcance, avance, responsable y notas.
- Línea de tiempo 2024 – 2027 con detalle por etapa y una hoja de ruta con los 22 proyectos ubicados en el mes de su fecha (con marca de «Hoy»).
- Botón **Resumen PDF** en el encabezado: genera un PDF A4 (indicadores, gráficas, línea de tiempo, calendario de fechas y tabla de proyectos) con los datos que muestra el tablero, listo para la junta. Se guarda con "Guardar como PDF" en el diálogo de impresión.
- Calendario por año: al abrir un año de la línea de tiempo (2024–2027) aparece su calendario de 12 meses. Naranja = planeado, verde = terminado. Para pintar un día exacto, escribe la fecha con día (`15 enero 2027`); con solo mes (`enero 2027`) el mes muestra "N sin día" y el proyecto queda en la lista de abajo.
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
│   ├── interfaz.js      pestañas, zoom, centrar y pantalla completa
│   ├── calendario.js    calendario de cada año en la línea de tiempo
│   └── informe.js       resumen ejecutivo en PDF
├── assets/fotos/        fotos de los espacios (JPG)
├── IMAGEN_MAPA/         plano aéreo, logotipos e ícono de la pestaña
├── GUIA_INTERNA_MANTENIMIENTO.md
└── .nojekyll
```

El plano usado por el mapa es `IMAGEN_MAPA/mapa-plaza-mayor.png` (1200 × 552 px). Una imagen de mayor resolución se vería más nítida al acercar con el zoom; si la reemplazas, conserva la misma proporción (2.17:1) para que los puntos no se desplacen.

## Ejecutar localmente

Desde la raíz:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`.

## Editar los 22 proyectos

Todo el contenido editable está en `js/datos.js`. Cada registro admite `nombre`, `valor`, `fecha`, `estado`, `pabellon`, `x`, `y`, `fotos`, `descripcion`, `alcance`, `avance`, `responsable` y `notas`.

Los 9 específicos comienzan con `pabellon: "sin"`. No se asignan automáticamente. Los generales siempre usan el color morado de General (G).

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

Pulsa **Modo presentación**. El recorrido usa el orden de `ORDEN_PRESENTACION` en `js/datos.js`: específicos 1–9 y después G1–G13.

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
- posiciones definitivas de los 22 puntos;
- fotos de los proyectos que aún no la tienen (hoy hay fotos para 4 de 22);
- descripciones;
- alcances;
- avances;
- responsables;
- unidades de las cifras.
