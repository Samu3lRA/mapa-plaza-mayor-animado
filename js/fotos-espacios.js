/* Fotografías de espacios: capa independiente para no alterar la lógica principal del mapa. */
(() => {
  'use strict';
  const photos = {
    e1: ['Fotos espacios/Zona de Comidas.jpg'],
    e3: ['Fotos espacios/Zona parcial Baños.jpg', 'Fotos espacios/Baños.jpg'],
    e6: ['Fotos espacios/Zona de descanso.HEIC'],
    g10: ['Fotos espacios/Pantallas internas.HEIC']
  };

  function applyPhotos() {
    const projects = window.PlazaMayorData?.getProjects?.();
    if (!Array.isArray(projects)) return;

    let changed = false;
    projects.forEach(project => {
      const assigned = photos[project.id];
      if (!assigned) return;
      if (!Array.isArray(project.fotos) || project.fotos.length === 0) {
        project.fotos = [...assigned];
        changed = true;
      }
    });

    if (changed && window.PlazaMayorData?.refresh) {
      window.PlazaMayorData.refresh();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPhotos, { once: true });
  } else {
    applyPhotos();
  }
})();
