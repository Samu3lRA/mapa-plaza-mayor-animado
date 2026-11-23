/* Interfaz del mapa: pestañas de la lista, zoom, centrar y pantalla completa. */
(()=>{const tabs=[...document.querySelectorAll('[data-list-tab]')];tabs.forEach(t=>t.addEventListener('click',()=>{tabs.forEach(x=>{const active=x===t;x.classList.toggle('is-active',active);x.setAttribute('aria-selected',String(active));});document.querySelectorAll('.tab-list').forEach(x=>{x.hidden=x.id!==(t.dataset.listTab==='specific'?'specificList':'generalList');});}));

const stage=document.getElementById('mapStage'),view=document.getElementById('mapViewport');let z=1;const currentZoom=()=>Number(getComputedStyle(stage).getPropertyValue('--camera-scale'))||z;const apply=()=>{stage.style.setProperty('--camera-scale',z);stage.style.setProperty('--camera-x','0px');stage.style.setProperty('--camera-y','0px')};document.getElementById('zoomIn').onclick=()=>{z=Math.min(2.2,currentZoom()+.2);apply()};document.getElementById('zoomOut').onclick=()=>{z=Math.max(1,currentZoom()-.2);apply()};document.getElementById('centerMap').onclick=()=>{z=1;apply();view.scrollTo({left:0,behavior:'smooth'})};const infoPanel=document.getElementById('infoPanel'),infoHome=infoPanel.parentElement,infoNext=infoPanel.nextElementSibling;document.getElementById('fullscreenMap').onclick=()=>document.fullscreenElement?document.exitFullscreen():view.requestFullscreen?.();document.addEventListener('fullscreenchange',()=>{if(document.fullscreenElement===view){view.appendChild(infoPanel);infoPanel.style.position='fixed';infoPanel.style.zIndex='2147483000';infoPanel.style.right='24px';infoPanel.style.top='50%';}else{if(infoNext&&infoNext.parentElement===infoHome)infoHome.insertBefore(infoPanel,infoNext);else infoHome.appendChild(infoPanel);infoPanel.style.position='';infoPanel.style.zIndex='';infoPanel.style.right='';infoPanel.style.top='';}});
})();

(function(){
  /* Mantiene el panel de información por debajo de los botones del encabezado. */
  const root=document.documentElement;
  function medir(){
    let libre=24;
    if(!document.fullscreenElement){
      document.querySelectorAll('.topbar button, .topbar a, .topbar select, .topbar input').forEach(e=>{
        const r=e.getBoundingClientRect();
        if(r.width&&r.height&&r.bottom>libre)libre=Math.ceil(r.bottom)+12;
      });
    }
    root.style.setProperty('--panel-libre',libre+'px');
  }
  window.addEventListener('resize',medir);
  document.addEventListener('fullscreenchange',medir);
  window.addEventListener('plaza:panelrender',medir);
  window.addEventListener('load',medir);
  medir();
})();
(function(){
  /* Fuera del modo edición las cifras de las gráficas son solo lectura (también con teclado). */
  document.addEventListener('focusin',e=>{
    const t=e.target;
    if(t&&t.matches&&t.matches('.priority-input-wrap input, .mini-pie-item input')&&!document.body.classList.contains('editing'))t.blur();
  });
})();
