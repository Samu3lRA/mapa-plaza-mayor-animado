/* Interacciones de exploración: arrastre del plano y microanimaciones. */
(() => {
  'use strict';
  const viewport=document.getElementById('mapViewport');
  const stage=document.getElementById('mapStage');
  if(!viewport||!stage)return;
  let dragging=false,moved=false,startX=0,startY=0,originX=0,originY=0,pointerId=null;
  const read=(name)=>parseFloat(getComputedStyle(stage).getPropertyValue(name))||0;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function bounds(scale){
    const vw=viewport.clientWidth,vh=viewport.clientHeight;
    const sw=stage.clientWidth*scale,sh=stage.clientHeight*scale;
    return {x:Math.max(0,(sw-vw)/2),y:Math.max(0,(sh-vh)/2)};
  }
  viewport.addEventListener('pointerdown',e=>{
    if(e.button!==0||e.target.closest('button,a,input,select,.info-panel'))return;
    dragging=true;moved=false;pointerId=e.pointerId;
    startX=e.clientX;startY=e.clientY;originX=read('--camera-x');originY=read('--camera-y');
    viewport.classList.add('is-panning');
    viewport.setPointerCapture?.(pointerId);
  });
  viewport.addEventListener('pointermove',e=>{
    if(!dragging||e.pointerId!==pointerId)return;
    const dx=e.clientX-startX,dy=e.clientY-startY;
    if(Math.abs(dx)+Math.abs(dy)>4)moved=true;
    if(!moved)return;
    const scale=read('--camera-scale')||1,limit=bounds(scale);
    stage.style.setProperty('--camera-x',clamp(originX+dx,-limit.x,limit.x)+'px');
    stage.style.setProperty('--camera-y',clamp(originY+dy,-limit.y,limit.y)+'px');
  });
  const end=e=>{
    if(!dragging||e.pointerId!==pointerId)return;
    dragging=false;pointerId=null;viewport.classList.remove('is-panning');
  };
  viewport.addEventListener('pointerup',end);
  viewport.addEventListener('pointercancel',end);
  viewport.addEventListener('lostpointercapture',()=>{dragging=false;viewport.classList.remove('is-panning');});
  window.addEventListener('resize',()=>{
    const scale=read('--camera-scale')||1,limit=bounds(scale);
    stage.style.setProperty('--camera-x',clamp(read('--camera-x'),-limit.x,limit.x)+'px');
    stage.style.setProperty('--camera-y',clamp(read('--camera-y'),-limit.y,limit.y)+'px');
  });
  // Delegación: los puntos se regeneran al filtrar o actualizar datos.
  // Así el efecto hover también funciona en marcadores creados después del inicio.
  stage.addEventListener('pointerover',e=>{
    const point=e.target.closest('.map-point');
    if(!point||!stage.contains(point)||point.contains(e.relatedTarget))return;
    point.classList.add('is-hovered');
  });
  stage.addEventListener('pointerout',e=>{
    const point=e.target.closest('.map-point');
    if(!point||!stage.contains(point)||point.contains(e.relatedTarget))return;
    point.classList.remove('is-hovered');
  });
})();
