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
(function(){
  /* Modo edición: mover los botones del mapa (centrar/enfoque, leyenda, barra de zoom).
     Cada uno tiene un asa ⠿ visible solo en modo edición. La posición se guarda como fracción
     del tamaño del mapa en este navegador. Doble clic en el asa devuelve ese control a su sitio. */
  const KEY='plaza-mayor-controles-v1';
  const section=document.querySelector('.map-section');
  if(!section)return;
  const T={leyenda:'#mainLegend',centrar:'#centerMap',enfoque:'#focusMode',zoomOut:'#zoomOut',zoomIn:'#zoomIn',pantalla:'#fullscreenMap'};
  const BOTON=id=>id!=='leyenda';
  let pos={};
  try{pos=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(_){pos={};}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(pos));}catch(_){}};
  const movil=()=>window.innerWidth<=760;
  function apply(id){
    const el=document.querySelector(T[id]);if(!el)return;
    const p=pos[id];
    if(!p||movil()){el.style.translate='';return;}
    const r=section.getBoundingClientRect();
    el.style.translate=(p.x*r.width)+'px '+(p.y*r.height)+'px';
  }
  const applyAll=()=>Object.keys(T).forEach(apply);
  Object.keys(T).forEach(id=>{
    const el=document.querySelector(T[id]);if(!el)return;
    let h=el;
    if(!BOTON(id)){
      h=document.createElement('span');
      h.className='mv-handle';h.textContent='⠿';h.title='Arrastra para mover · doble clic para restablecer';
      h.setAttribute('role','button');h.setAttribute('aria-label','Mover este control del mapa');
      el.appendChild(h);
    }else h.title=(h.title?h.title+' · ':'')+'En modo edición: arrastra para mover · doble clic para restablecer';
    el.classList.add('mv-target');
    let moved=false;
    let start=null;
    h.addEventListener('pointerdown',e=>{
      if(!document.body.classList.contains('editing')||movil())return;
      if(!BOTON(id))e.preventDefault();h.setPointerCapture(e.pointerId);
      const s=section.getBoundingClientRect(),r=el.getBoundingClientRect(),cur=pos[id]||{x:0,y:0};
      start={px:e.clientX,py:e.clientY,cx:cur.x*s.width,cy:cur.y*s.height,
        minX:s.left-r.left,maxX:s.right-r.right,minY:s.top-r.top,maxY:s.bottom-r.bottom,w:s.width,h:s.height};
      h.classList.add('is-drag');moved=false;
    });
    h.addEventListener('pointermove',e=>{
      if(!start)return;
      const dx=Math.min(start.maxX,Math.max(start.minX,e.clientX-start.px)),dy=Math.min(start.maxY,Math.max(start.minY,e.clientY-start.py));
      if(Math.abs(dx)+Math.abs(dy)>4)moved=true;
      const x=start.cx+dx,y=start.cy+dy;
      pos[id]={x:x/start.w,y:y/start.h};apply(id);
    });
    const end=()=>{if(!start)return;start=null;h.classList.remove('is-drag');save();};
    h.addEventListener('pointerup',end);h.addEventListener('pointercancel',end);
    if(BOTON(id))el.addEventListener('click',e=>{if(moved){e.stopImmediatePropagation();e.preventDefault();moved=false;}},true);
    h.addEventListener('dblclick',()=>{delete pos[id];apply(id);save();});
  });
  window.addEventListener('resize',applyAll);
  applyAll();
  window.PlazaMayorControles={reset(){pos={};try{localStorage.removeItem(KEY);}catch(_){}applyAll();}};
})();
