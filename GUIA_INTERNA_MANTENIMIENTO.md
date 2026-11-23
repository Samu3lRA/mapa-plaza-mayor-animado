# Guía interna de mantenimiento · Mapa Plaza Mayor

Documento operativo para mantener el tablero sin modificar su diseño ni perder información.

## 1. Dónde vive cada parte

- `index.html`: estructura de la página, controles y carga de archivos.
- `css/estilos.css`: apariencia, distribución y adaptación a pantallas.
- `js/datos.js`: datos base de los proyectos, orden de presentación, `DATOS_VERSION` y `FECHA_ACTUALIZACION`.
- `js/app.js`: mapa, marcadores, edición, filtros, almacenamiento local, respaldos y línea de tiempo.
- `js/animaciones.js`: animaciones y respuestas visuales del mapa.
- `js/mejoras.js`: galería, cronología de cada proyecto, informes e impresión de fichas.
- `js/interfaz.js`: pestañas de la lista, zoom, centrar mapa y pantalla completa.
- `IMAGEN_MAPA/`: plano, logotipos e ícono de la pestaña usados por el tablero.
- `assets/fotos/`: fotos de los espacios (JPG, unos 1600 px y sin metadatos de ubicación).

**Regla de mantenimiento:** hacer cambios pequeños, en un solo archivo por vez cuando sea posible. No reemplazar archivos completos con versiones antiguas ni cambiar nombres/rutas de imágenes sin actualizar sus referencias.

## 2. Cómo editar y guardar

1. Abrir el tablero en el navegador habitual, agregando `?editar=1` al final de la dirección (sin eso el botón **Modo edición** no aparece, para que los visitantes no lo vean).
2. Entrar en **Modo edición**.
3. Mover los marcadores o cambiar el pabellón del proyecto seleccionado.
4. Modificar los porcentajes directamente en sus campos.
5. Esperar a que aparezca el resultado visual y descargar un respaldo al terminar.

Las posiciones, pabellones, ubicaciones y porcentajes se guardan en el almacenamiento local del navegador. El historial también se conserva localmente. Esto significa que los cambios no se comparten automáticamente con otros computadores ni se publican en GitHub.

Si el navegador no permite guardar, el tablero mostrará un aviso. En ese caso, descargar un respaldo antes de cerrar o recargar la página.

## 3. Respaldar y recuperar

### Descargar
- Entrar en **Modo edición**.
- Pulsar **Descargar respaldo**.
- Guardar el archivo `respaldo-mapa-plaza-mayor.json` en una carpeta interna segura.
- Hacer un respaldo antes de cambios importantes y conservar versiones fechadas.

### Importar
- Abrir el mismo tablero o una versión compatible.
- Entrar en **Modo edición** y pulsar **Importar respaldo**.
- Seleccionar el archivo JSON.
- El sistema valida el formato, la versión, los identificadores de proyectos, las coordenadas, los pabellones y los porcentajes antes de aplicar los datos.

Un respaldo de otra estructura o versión del mapa puede ser rechazado. No editar manualmente el JSON salvo que se conozca su estructura.

### Restablecer
El botón **Restablecer** elimina las ediciones locales de posiciones, ubicaciones y porcentajes, y vuelve a los valores iniciales publicados en los archivos del proyecto. Es una acción destructiva para los cambios locales: descargar primero un respaldo.

## 4. Cambios permanentes para todos los equipos

Los cambios hechos desde el navegador son locales. Para que una actualización sea la base para todos:

1. Descargar un respaldo actualizado.
2. Revisar los datos con el responsable de la información.
3. Trasladar únicamente los valores aprobados a `js/datos.js` y/o al código correspondiente.
4. Subir el número de `DATOS_VERSION` y actualizar `FECHA_ACTUALIZACION` en `js/datos.js`. Si cambiaste un archivo CSS o JS, cambiar también su `?v=` en `index.html`.
5. Publicar los cambios en la rama `main`.
6. Abrir el sitio y verificarlo en una ventana nueva o con recarga forzada.
7. Confirmar que los marcadores, filtros, paneles y línea de tiempo funcionan.
8. Mantener el respaldo anterior hasta confirmar la nueva versión.

No asumir que una posición o porcentaje guardado en un computador ya quedó publicado en GitHub.

## 5. Lista breve de verificación después de publicar

- [ ] El plano y el logotipo cargan correctamente.
- [ ] Aparecen los marcadores de proyectos y de pabellones.
- [ ] Al seleccionar un punto se abre el panel correcto.
- [ ] La búsqueda encuentra proyectos por nombre y responsable.
- [ ] Los filtros por estado y pabellón funcionan.
- [ ] Las pestañas de proyectos específicos y generales cambian correctamente.
- [ ] El zoom, centrar mapa y pantalla completa responden.
- [ ] La línea de tiempo abre y cierra sus detalles.
- [ ] Sin `?editar=1` el botón Modo edición no aparece; con `?editar=1` sí.
- [ ] El modo edición permite mover puntos y cambiar pabellones.
- [ ] La descarga e importación de respaldo funcionan.
- [ ] Los gráficos y el tema claro/oscuro se actualizan.
- [ ] La vista móvil no presenta elementos superpuestos.

## 6. Criterios para evitar daños

- No borrar ni renombrar identificadores de proyectos sin actualizar las referencias relacionadas.
- No mover imágenes de `IMAGEN_MAPA/` sin actualizar sus rutas.
- No modificar simultáneamente la misma versión desde dos equipos y luego importar respaldos sin comparar.
- No usar **Restablecer** como método de solución sin haber descargado primero un respaldo.
- No publicar porcentajes, responsables, fechas o avances sin validación interna.
- Probar primero en una copia o con un respaldo reciente cuando el cambio afecte la estructura de datos.

## 7. Alcance de las comprobaciones

Las revisiones de código pueden detectar errores de sintaxis, referencias faltantes y problemas estructurales, pero no sustituyen una prueba funcional en el navegador real. Después de cambios importantes, ejecutar la lista de verificación de este documento.
