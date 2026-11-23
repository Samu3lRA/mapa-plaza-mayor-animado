# Mapa Plaza Mayor Animado

Mapa web interactivo de los proyectos de inversión de Plaza Mayor Medellín. Está construido con HTML, CSS y JavaScript puros, sin frameworks ni compilación.

## Estado

Implementa las cuatro fases del encargo:

- **Fase 1:** mapa responsive, 22 puntos, leyenda, tooltips y listas.
- **Fase 2:** panel lateral, selección, zoom de cámara, onda, conteo de valor, avance, Ken Burns y `prefers-reduced-motion`.
- **Fase 3:** modo edición, arrastre con puntero, asignación de pabellón, copia/descarga de puntos y persistencia versionada.
- **Fase 4:** modo presentación, modo grabación, controles de teclado y documentación.

> La imagen aérea original y las fotografías de proyectos son materiales del usuario. No se inventan ni se sustituyen.

## Estructura

```text
mapa-plaza-mayor-animado/
├── index.html
├── css/estilos.css
├── js/app.js
├── js/datos.js
├── assets/
│   ├── plaza-mayor.png
│   ├── plaza-mayor.webp
│   └── fotos/
└── .nojekyll
```

La imagen aérea entregada por el usuario es de 2048 × 943 px (proporción 2.17:1). El proyecto está preparado para `assets/plaza-mayor.png` y `assets/plaza-mayor.webp`, optimizada para carga web. La zona coloreada de la imagen corresponde a todo Plaza Mayor. Las fotos individuales se agregan en `assets/fotos/` y se referencian desde `fotos` en `js/datos.js`.

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

## Modo edición

Pulsa **Modo edición**.

1. Arrastra un punto con mouse o dedo.
2. Selecciona un específico y cambia su pabellón.
3. **Copiar datos** genera una línea JSON por punto.
4. **Descargar puntos.json** guarda los datos de posición/pabellón.
5. **Restablecer** elimina los cambios locales y vuelve a `datos.js`.

Los cambios se guardan únicamente en `localStorage` con la clave versionada `plaza-mayor-mapa-edicion-v1`. La fuente de verdad sigue siendo `js/datos.js`.

Para fijar los cambios para todos, copia los valores de `puntos.json` o del área de texto y actualiza los campos correspondientes en `js/datos.js`. Después de publicar una nueva versión de `datos.js`, si el navegador conserva una edición vieja, usa **Restablecer** o limpia la clave `plaza-mayor-mapa-edicion-v1` desde las herramientas de desarrollo.

## Modo presentación

Pulsa **Presentar**. El recorrido usa el orden de `ORDEN_PRESENTACION` en `js/datos.js`: específicos 1–9 y después G1–G13.

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
- fotos;
- descripciones;
- alcances;
- avances;
- responsables;
- unidades de las cifras.