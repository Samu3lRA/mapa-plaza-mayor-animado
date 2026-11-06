/* Lógica del mapa. Los datos editables viven en js/datos.js. */
(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const REDUCED=window.matchMedia('(prefers-reduced-motion: reduce)'), STORAGE_KEY='plaza-mayor-mapa-edicion-v1', PLACE_STORAGE_KEY='plaza-mayor-ubicaciones-v1', PRESENTATION_MS=6000;
const PRESENTATION_ORDER=Array.isArray(ORDEN_PRESENTACION)?ORDEN_PRESENTACION:PROYECTOS.map(p=>p.id);
const state={selectedId:null,previousFocus:null,panelOpen:false,editing:false,presentation:false,presentationPaused:false,presentationIndex:0,presentationTimer:null,touchStartY:null,data:cloneProjects(PROYECTOS)};
const els={appShell:$('#appShell'),mapViewport:$('#mapViewport'),mapStage:$('#mapStage'),pointsLayer:$('#pointsLayer'),generalList:$('#generalList'),specificList:$('#specificList'),legendItems:$('#legendItems'),themeToggle:$('#themeToggle'),editToggle:$('#editToggle'),presentToggle:$('#presentToggle'),infoPanel:$('#infoPanel'),panelScroll:$('#panelScroll'),panelClose:$('#panelClose'),panelPhotoWrap:$('#panelPhotoWrap'),panelStatus:$('#panelStatus'),panelTitle:$('#panelTitle'),panelValue:$('#panelValue'),panelDate:$('#panelDate'),panelLocation:$('#panelLocation'),panelDescription:$('#panelDescription'),panelScope:$('#panelScope'),panelProgressText:$('#panelProgressText'),panelProgressBar:$('#panelProgressBar'),panelResponsible:$('#panelResponsible'),panelNotes:$('#panelNotes'),descriptionBlock:$('#descriptionBlock'),scopeBlock:$('#scopeBlock'),progressBlock:$('#progressBlock'),responsibleBlock:$('#responsibleBlock'),notesBlock:$('#notesBlock'),editPanel:$('#editPanel'),editClose:$('#editClose'),pavilionSelect:$('#pavilionSelect'),copyData:$('#copyData'),downloadData:$('#downloadData'),resetData:$('#resetData'),dataOutput:$('#dataOutput'),presentationControls:$('#presentationControls'),presentationProgressBar:$('#presentationProgressBar'),presentationCounter:$('#presentationCounter'),toast:$('#toast'),recordingLegend:$('#recordingLegend')};
function cloneProjects(ps){return ps.map(p=>({...p,fotos:[...(p.fotos||[])],alcance:[...(p.alcance||[])]}));}
function projectById(id){return state.data.find(p=>p.id===id);}
function colorFor(p){return p.tipo==='general'?COLORES_PABELLON.general:(COLORES_PABELLON[p.pabellon]||COLORES_PABELLON.sin);}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function formatNumber(v){return new Intl.NumberFormat('es-CO').format(Math.max(0,Math.round(v)));}
function parseMoney(v){return Number(String(v).replace(/[^0-9]/g,''))||0;}
function showToast(m){els.toast.textContent=m;els.toast.classList.add('is-visible');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>els.toast.classList.remove('is-visible'),2200);}
function renderLegend(){els.legendItems.innerHTML='';['amarillo','azul','rojo','blanco','verde','convenciones','sin','general'].forEach(k=>{const c=COLORES_PABELLON[k],i=document.createElement('span');i.className='legend-item';i.innerHTML='<i style="--legend-bg:'+c.fondo+';--legend-text:'+c.texto+'"></i><span>'+escapeHtml(c.nombre)+'</span>';els.legendItems.appendChild(i);});}
function createPoint(p,index){const c=colorFor(p),b=document.createElement('button');b.type='button';b.className='map-point';b.dataset.id=p.id;b.style.left=p.x+'%';b.style.top=p.y+'%';b.style.setProperty('--point-bg',c.fondo);b.style.setProperty('--point-text',c.texto);b.style.setProperty('--entry-delay',(index*45)+'ms');b.setAttribute('aria-label',p.nombre);b.innerHTML='<span>'+(p.tipo==='general'?'TI':p.id.slice(1))+'</span><span class="point-tooltip" aria-hidden="true">'+escapeHtml(p.nombre)+'</span>';b.addEventListener('click',()=>selectProject(p.id,{open:true}));b.addEventListener('pointerdown',e=>{if(state.editing)beginDrag(e,b);});return b;}
function renderPoints(){els.pointsLayer.innerHTML='';state.data.forEach((p,i)=>els.pointsLayer.appendChild(createPoint(p,i)));}

const PLACE_MARKERS=[
 {id:'amarillo',name:'Pabellón Amarillo',x:18,y:18,color:'#F2C200'},
 {id:'rojo',name:'Pabellón Rojo',x:48,y:17,color:'#D93636'},
 {id:'verde',name:'Pabellón Verde',x:78,y:22,color:'#2F9E50'},
 {id:'azul',name:'Pabellón Azul',x:20,y:78,color:'#1D5FD6'},
 {id:'blanco',name:'Pabellón Blanco',x:53,y:82,color:'#F6F6F6'},
 {id:'convenciones',name:'Convenciones',x:82,y:75,color:'#8B5A2B'}
];
const placeState=PLACE_MARKERS.map(p=>({...p}));
function renderPlaceMarkers(){
 const layer=$('#placeMarkers');if(!layer)return;
 layer.innerHTML='';
 placeState.forEach(p=>{
  const marker=document.createElement('div');
  marker.className='place-marker';marker.dataset.placeId=p.id;
  marker.style.left=p.x+'%';marker.style.top=p.y+'%';marker.style.setProperty('--place-color',p.color);
  marker.title=p.name;marker.setAttribute('aria-label',p.name);
  marker.innerHTML='<span class="place-pin" aria-hidden="true">⌖</span><span class="place-label">'+escapeHtml(p.name)+'</span>';
  marker.addEventListener('pointerdown',e=>{if(state.editing)beginPlaceDrag(e,marker);});
  layer.appendChild(marker);
 });
}
function beginPlaceDrag(event,marker){
 event.preventDefault();event.stopPropagation();marker.setPointerCapture?.(event.pointerId);
 const move=e=>{
  const r=els.mapStage.getBoundingClientRect();
  const x=Math.max(0,Math.min(100,((e.clientX-r.left)/r.width)*100));
  const y=Math.max(0,Math.min(100,((e.clientY-r.top)/r.height)*100));
  const p=placeState.find(v=>v.id===marker.dataset.placeId);if(!p)return;
  p.x=Number(x.toFixed(1));p.y=Number(y.toFixed(1));
  marker.style.left=p.x+'%';marker.style.top=p.y+'%';persistPlaceEdits();
 };
 const end=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);};
 window.addEventListener('pointermove',move);window.addEventListener('pointerup',end,{once:true});
}
function persistPlaceEdits(){try{localStorage.setItem(PLACE_STORAGE_KEY,JSON.stringify(placeState));}catch(_){}}
function restorePlaceEdits(){
 try{const saved=JSON.parse(localStorage.getItem(PLACE_STORAGE_KEY)||'null');if(!Array.isArray(saved))return;
  placeState.forEach(p=>{const s=saved.find(v=>v.id===p.id);if(s&&Number.isFinite(s.x)&&Number.isFinite(s.y)){p.x=Math.max(0,Math.min(100,s.x));p.y=Math.max(0,Math.min(100,s.y));}});
 }catch(_){}
}
function applyProjectFilters(){
 const normalize=s=>String(s??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLocaleLowerCase('es');
  const q=normalize($('#projectSearch')?.value||'');
 const status=$('#statusFilter')?.value||'',pavilion=$('#pavilionFilter')?.value||'';
 const matches=p=>{
  const pavilionName=p.tipo==='general'?'Toda la infraestructura':(COLORES_PABELLON[p.pabellon]?.nombre||'Sin asignar');
  const haystack=normalize([p.nombre,p.responsable,p.estado,p.fecha,p.valor,p.descripcion,p.notas,pavilionName,p.tipo,p.pabellon].join(' '));
  const queryOk=!q||haystack.includes(q);
  const statusOk=!status||normalize(p.estado)===normalize(status);
  const pavilionOk=!pavilion||(pavilion==='general'?p.tipo==='general':pavilion==='sin'?p.tipo==='especifico'&&(!p.pabellon||p.pabellon==='sin'):p.tipo==='especifico'&&p.pabellon===pavilion);
  return queryOk&&statusOk&&pavilionOk;
 };
 const visible=new Set(state.data.filter(matches).map(p=>p.id));
 $$('.map-point').forEach(el=>{const show=visible.has(el.dataset.id);el.classList.toggle('is-filtered-out',!show);el.setAttribute('aria-hidden',String(!show));el.tabIndex=show?0:-1;});
 $$('.project-list-item').forEach(el=>{el.hidden=!visible.has(el.dataset.id);});
 const specific=state.data.filter(p=>p.tipo==='especifico'&&visible.has(p.id)).length;
 const general=state.data.filter(p=>p.tipo==='general'&&visible.has(p.id)).length;
 const sc=$('#specificCount'),gc=$('#generalCount');
 if(sc)sc.textContent='('+specific+')';if(gc)gc.textContent='('+general+')';
 const mc=$('#mapProjectCount');if(mc)mc.textContent='▥ '+visible.size+' proyectos';
 ['specific','general'].forEach(type=>{
  const list=type==='specific'?$('#specificList'):$('#generalList');
  if(!list)return;
  let empty=list.querySelector('.filter-empty');
  const count=type==='specific'?specific:general;
  if(!count&&!empty){empty=document.createElement('p');empty.className='filter-empty';empty.textContent='No se encontraron proyectos.';list.appendChild(empty);}
  if(count&&empty)empty.remove();
 });
}
function initProjectFilters(){
 ['projectSearch','statusFilter','pavilionFilter'].forEach(id=>{
  const el=$('#'+id);if(!el)return;
  el.addEventListener(el.tagName==='INPUT'?'input':'change',applyProjectFilters);
 });
 $('#clearFilters')?.addEventListener('click',()=>{
  $('#projectSearch').value='';$('#statusFilter').value='';$('#pavilionFilter').value='';
  applyProjectFilters();$('#projectSearch').focus();
 });
}

function createListItem(p){const c=colorFor(p),i=document.createElement('button');i.type='button';i.className='project-list-item';i.dataset.id=p.id;i.innerHTML='<span class="list-marker" style="--point-bg:'+c.fondo+';--point-text:'+c.texto+'">'+(p.tipo==='general'?'TI':p.id.slice(1))+'</span><span class="list-copy"><strong>'+escapeHtml(p.nombre)+'</strong><span>'+escapeHtml(p.valor)+' · '+escapeHtml(p.fecha)+'</span></span><span class="list-status">'+escapeHtml(p.tipo === "general" ? "Toda la infraestructura" : (p.pabellon === "sin" ? "Sin asignar" : (COLORES_PABELLON[p.pabellon]?.nombre || "Sin asignar")))+'</span>';i.addEventListener('click',()=>selectProject(p.id,{open:true}));return i;}
function renderLists(){els.generalList.innerHTML='';els.specificList.innerHTML='';state.data.filter(p=>p.tipo==='general').forEach(p=>els.generalList.appendChild(createListItem(p)));state.data.filter(p=>p.tipo==='especifico').forEach(p=>els.specificList.appendChild(createListItem(p)));}
function clearSelected(){$$('.is-selected').forEach(e=>e.classList.remove('is-selected'));}
function markSelected(id){clearSelected();$('[data-id="'+CSS.escape(id)+'"].map-point')?.classList.add('is-selected');$('[data-id="'+CSS.escape(id)+'"].project-list-item')?.classList.add('is-selected');}
function cameraForPoint(p,scale=1.6){if(REDUCED.matches||scale===1)return{scale:1,x:0,y:0};const vw=els.mapViewport.clientWidth,vh=els.mapViewport.clientHeight,sw=els.mapStage.clientWidth,sh=els.mapStage.clientHeight,tx=p.x/100*sw,ty=p.y/100*sh,maxX=Math.max(0,(sw*scale-vw)/2),maxY=Math.max(0,(sh*scale-vh)/2);return{scale,x:Math.max(-maxX,Math.min(maxX,vw/2-tx*scale)),y:Math.max(-maxY,Math.min(maxY,vh/2-ty*scale))};}
function applyCamera(c,instant=false){els.mapStage.style.setProperty('--camera-scale',c.scale);els.mapStage.style.setProperty('--camera-x',c.x+'px');els.mapStage.style.setProperty('--camera-y',c.y+'px');if(instant||REDUCED.matches)els.mapStage.classList.add('no-camera-transition');else els.mapStage.classList.remove('no-camera-transition');if(instant||REDUCED.matches)requestAnimationFrame(()=>els.mapStage.classList.remove('no-camera-transition'));}
function renderPhoto(p){if(!p.fotos?.length){els.panelPhotoWrap.innerHTML='<div class="photo-pending">Foto pendiente</div>';return;}els.panelPhotoWrap.innerHTML='<img class="panel-photo" src="'+escapeHtml(p.fotos[0])+'" alt="'+escapeHtml(p.nombre)+'" loading="lazy">';}
function optional(block,value){block.hidden=!value;}
function renderPanel(p){renderPhoto(p);els.panelStatus.textContent=p.estado;els.panelTitle.textContent=p.nombre;els.panelDate.textContent=p.fecha;els.panelLocation.textContent=p.tipo==='general'?'Toda la infraestructura':(p.pabellon==='sin'?'Pabellón por asignar':(p.pabellon==='convenciones'?'Convenciones':'Pabellón '+(COLORES_PABELLON[p.pabellon]?.nombre||'')));els.panelDescription.textContent=p.descripcion||'';els.panelScope.innerHTML=(p.alcance||[]).map(x=>'<li>'+escapeHtml(x)+'</li>').join('');els.panelResponsible.textContent=p.responsable||'';els.panelNotes.textContent=p.notas||'';optional(els.descriptionBlock,!!p.descripcion);optional(els.scopeBlock,!!p.alcance?.length);optional(els.progressBlock,Number.isFinite(p.avance));optional(els.responsibleBlock,!!p.responsable);optional(els.notesBlock,!!p.notas);els.panelProgressText.textContent=Number.isFinite(p.avance)?p.avance+'%':'';els.panelProgressBar.style.width='0%';animateValue(p);if(Number.isFinite(p.avance)&&!REDUCED.matches)requestAnimationFrame(()=>els.panelProgressBar.style.width=p.avance+'%');else els.panelProgressBar.style.width=Number.isFinite(p.avance)?p.avance+'%':'0%';if(p.tipo==='especifico')els.pavilionSelect.value=p.pabellon||'sin';else els.pavilionSelect.value='sin';els.pavilionSelect.disabled=p.tipo!=='especifico';}
function animateValue(p){const target=parseMoney(p.valor);if(REDUCED.matches){els.panelValue.textContent='$'+formatNumber(target);return;}const start=performance.now();function frame(now){const t=Math.min(1,(now-start)/900),eased=1-Math.pow(1-t,3);els.panelValue.textContent='$'+formatNumber(target*eased);if(t<1)requestAnimationFrame(frame);}requestAnimationFrame(frame);}
function openPanel(p,trigger){state.previousFocus=trigger||document.activeElement;state.panelOpen=true;els.infoPanel.setAttribute('aria-hidden','false');els.infoPanel.classList.add('is-open');renderPanel(p);markSelected(p.id);applyCamera(cameraForPoint(p));els.panelScroll.scrollTop=0;requestAnimationFrame(()=>els.panelClose.focus());}
function closePanel({returnFocus=true}={}){state.panelOpen=false;els.infoPanel.classList.remove('is-open');els.infoPanel.setAttribute('aria-hidden','true');applyCamera({scale:1,x:0,y:0});clearSelected();if(returnFocus&&state.previousFocus&&document.contains(state.previousFocus))state.previousFocus.focus();state.previousFocus=null;}
function selectProject(id,{open=true,fromPresentation=false}={}){const p=projectById(id);if(!p)return;if(state.panelOpen&&state.selectedId!==id){els.infoPanel.classList.add('is-crossfade');setTimeout(()=>els.infoPanel.classList.remove('is-crossfade'),REDUCED.matches?80:200);}state.selectedId=id;markSelected(id);if(open)openPanel(p,document.querySelector('.map-point[data-id="'+CSS.escape(id)+'"]'));else renderPanel(p);if(fromPresentation)updatePresentationProgress();}
function beginDrag(event,b){event.preventDefault();b.setPointerCapture?.(event.pointerId);const move=e=>{const r=els.mapStage.getBoundingClientRect(),x=Math.max(0,Math.min(100,((e.clientX-r.left)/r.width)*100)),y=Math.max(0,Math.min(100,((e.clientY-r.top)/r.height)*100)),p=projectById(b.dataset.id);p.x=Number(x.toFixed(1));p.y=Number(y.toFixed(1));b.style.left=p.x+'%';b.style.top=p.y+'%';updateDataOutput();persistEdits();notifyDataChanged();};const end=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);};window.addEventListener('pointermove',move);window.addEventListener('pointerup',end,{once:true});}
function updateDataOutput(){els.dataOutput.value=JSON.stringify({proyectos:state.data.map(p=>{const o={id:p.id,nombre:p.nombre,x:p.x,y:p.y};if(p.tipo==='especifico')o.pabellon=p.pabellon;return o;}),ubicaciones:placeState.map(p=>({id:p.id,nombre:p.name,x:p.x,y:p.y}))},null,2);}
function updateDataQualityReport(){
 const root=els.dataQualityReport;if(!root)return;
 const total=state.data.length;
 const checks=[
  ['Fotografías',p=>!Array.isArray(p.fotos)||p.fotos.length===0],
  ['Descripción',p=>!String(p.descripcion||'').trim()],
  ['Alcance',p=>!Array.isArray(p.alcance)||p.alcance.length===0],
  ['Avance',p=>!Number.isFinite(p.avance)],
  ['Responsable',p=>!String(p.responsable||'').trim()],
  ['Notas',p=>!String(p.notas||'').trim()],
  ['Pabellón sin asignar',p=>p.tipo==='especifico'&&(!p.pabellon||p.pabellon==='sin')]
 ];
 const rows=checks.map(([label,test])=>{
  const count=state.data.filter(test).length;
  return '<div class="quality-row"><span>'+label+'</span><strong>'+count+' / '+total+'</strong></div>';
 }).join('');
 root.innerHTML='<p class="quality-intro">Campos pendientes según la información cargada. No se han completado automáticamente para evitar inventar datos.</p>'+rows;
}

function persistEdits(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state.data));}catch(_){}}
function restoreEdits(){
 try{
  const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return;
  const saved=JSON.parse(raw);if(!Array.isArray(saved)||saved.length!==state.data.length)return;
  const validPavilions=new Set(Object.keys(COLORES_PABELLON).filter(k=>k!=='general'));
  state.data=state.data.map(p=>{
   const s=saved.find(x=>x.id===p.id);if(!s)return p;
   const x=Number(s.x),y=Number(s.y);
   const next={...p};
   if(Number.isFinite(x)&&x>=0&&x<=100)next.x=x;
   if(Number.isFinite(y)&&y>=0&&y<=100)next.y=y;
   if(p.tipo==='especifico'&&validPavilions.has(s.pabellon))next.pabellon=s.pabellon;
   return next;
  });
 }catch(_){}
}
function resetEdits(){try{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(PLACE_STORAGE_KEY);}catch(_){}state.data=cloneProjects(PROYECTOS);PLACE_MARKERS.forEach((p,i)=>Object.assign(placeState[i],p));renderAll();showToast('Proyectos y ubicaciones restablecidos.');}
function notifyDataChanged(){window.dispatchEvent(new CustomEvent('plaza:datachange',{detail:{projects:state.data}}));}
function renderAll(){renderPoints();renderLists();renderLegend();renderPlaceMarkers();updateDataOutput();updateDataQualityReport();applyProjectFilters();if(state.selectedId)markSelected(state.selectedId);notifyDataChanged();}
window.PlazaMayorData={getProjects:()=>state.data,refresh:()=>{renderAll();}};
function toggleEdit(force){state.editing=force??!state.editing;els.editToggle.setAttribute('aria-pressed',String(state.editing));els.editToggle.textContent=state.editing?'Cerrar edición':'Modo edición';els.editPanel.hidden=!state.editing;document.body.classList.toggle('editing',state.editing);if(state.editing)updateDataOutput();}
function downloadJSON(){
 const priority={};$('[data-priority]').forEach(input=>priority[input.dataset.priority]=Number(input.value)||0);
 const backup={format:'plaza-mayor-map-backup',version:1,exportedAt:new Date().toISOString(),projects:state.data.map(p=>({...p,fotos:[...(p.fotos||[])],alcance:[...(p.alcance||[])]})),locations:placeState.map(p=>({...p})),priority};
 const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='respaldo-mapa-plaza-mayor.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
 showToast('Respaldo completo descargado.');
}
function importBackup(file){
 if(!file)return;
 const reader=new FileReader();
 reader.onload=()=>{
  try{
   const backup=JSON.parse(String(reader.result||''));
   if(backup.format!=='plaza-mayor-map-backup'||backup.version!==1||!Array.isArray(backup.projects))throw new Error('El archivo no es un respaldo compatible.');
   const currentIds=state.data.map(p=>p.id).sort(),incomingIds=backup.projects.map(p=>p.id).sort();
   if(currentIds.length!==incomingIds.length||currentIds.some((id,i)=>id!==incomingIds[i]))throw new Error('El respaldo pertenece a otra versión del mapa.');
   const pavilionKeys=new Set(Object.keys(COLORES_PABELLON).filter(k=>k!=='general'));
   const nextProjects=state.data.map(p=>{
    const incoming=backup.projects.find(x=>x.id===p.id);
    const x=Number(incoming.x),y=Number(incoming.y);
    if(!Number.isFinite(x)||x<0||x>100||!Number.isFinite(y)||y<0||y>100)throw new Error('Hay coordenadas inválidas en el respaldo.');
    const next={...p,x,y};
    if(p.tipo==='especifico'){
     if(!pavilionKeys.has(incoming.pabellon))throw new Error('Hay un pabellón no válido en el respaldo.');
     next.pabellon=incoming.pabellon;
    }
    return next;
   });
   const nextLocations=placeState.map(p=>{
    const incoming=Array.isArray(backup.locations)?backup.locations.find(x=>x.id===p.id):null;
    if(!incoming)return {...p};
    const x=Number(incoming.x),y=Number(incoming.y);
    if(!Number.isFinite(x)||x<0||x>100||!Number.isFinite(y)||y<0||y>100)throw new Error('Hay ubicaciones inválidas en el respaldo.');
    return {...p,x,y};
   });
   const priorities=backup.priority&&typeof backup.priority==='object'?backup.priority:null;
   if(priorities){
    for(const key of ['experience','technology','safety']){
     if(priorities[key]!==undefined&&(!Number.isFinite(Number(priorities[key]))||Number(priorities[key])<0||Number(priorities[key])>100))throw new Error('Hay porcentajes inválidos en el respaldo.');
    }
   }
   state.data=nextProjects;
   nextLocations.forEach((p,i)=>Object.assign(placeState[i],p));
   persistEdits();persistPlaceEdits();
   if(priorities){
    $('[data-priority]').forEach(input=>{if(priorities[input.dataset.priority]!==undefined){input.value=Number(priorities[input.dataset.priority]);input.dispatchEvent(new Event('input',{bubbles:true}));}});
   }
   renderAll();showToast('Respaldo importado correctamente.');
  }catch(error){showToast(error.message||'No se pudo importar el respaldo.');}
  if(els.importFile)els.importFile.value='';
 };
 reader.onerror=()=>showToast('No se pudo leer el archivo seleccionado.');
 reader.readAsText(file);
}
async function copyData(){updateDataOutput();try{await navigator.clipboard.writeText(els.dataOutput.value);showToast('Datos copiados.');}catch(_){els.dataOutput.focus();els.dataOutput.select();showToast('Selecciona el texto y cópialo manualmente.');}}
function applyTheme(theme,{persist=true}={}){const root=document.documentElement;const next=theme==='light'?'light':'dark';root.dataset.theme=next;els.themeToggle.textContent=next==='dark'?'☼ Tema claro':'☾ Tema oscuro';els.themeToggle.setAttribute('aria-label',next==='dark'?'Cambiar a tema claro':'Cambiar a tema oscuro');els.themeToggle.setAttribute('aria-pressed',String(next==='light'));if(persist){try{localStorage.setItem('plaza-mayor-theme',next);}catch(_){}}}
function initTheme(){let saved=null;try{saved=localStorage.getItem('plaza-mayor-theme');}catch(_){}applyTheme(saved==='light'?'light':'dark',{persist:false});}
function toggleTheme(){applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');}
function presentationStart(){if(!PRESENTATION_ORDER.length)return;state.presentation=true;state.presentationPaused=false;state.presentationIndex=0;els.presentationControls.hidden=false;els.presentToggle.textContent='Salir de presentación';els.appShell.classList.add('is-presenting');showPresentationPoint();}
function presentationStop(){clearTimeout(state.presentationTimer);state.presentation=false;state.presentationPaused=false;els.presentationControls.hidden=true;els.presentToggle.textContent='Presentar';els.appShell.classList.remove('is-presenting');closePanel({returnFocus:false});applyCamera({scale:1,x:0,y:0});}
function showPresentationPoint(){const id=PRESENTATION_ORDER[state.presentationIndex];if(!id){presentationStop();return;}selectProject(id,{open:true,fromPresentation:true});updatePresentationProgress();clearTimeout(state.presentationTimer);if(!state.presentationPaused)state.presentationTimer=setTimeout(()=>{if(state.presentationIndex<PRESENTATION_ORDER.length-1){state.presentationIndex++;showPresentationPoint();}else presentationStop();},PRESENTATION_MS);}
function updatePresentationProgress(){const n=PRESENTATION_ORDER.length;els.presentationCounter.textContent=Math.min(state.presentationIndex+1,n)+' / '+n;els.presentationProgressBar.style.width=((state.presentationIndex+1)/n)*100+'%';}
function presentationKey(key){if(!state.presentation)return;if(key===' '){state.presentationPaused=!state.presentationPaused;if(state.presentationPaused)clearTimeout(state.presentationTimer);else showPresentationPoint();}else if(key==='ArrowRight'){state.presentationIndex=Math.min(PRESENTATION_ORDER.length-1,state.presentationIndex+1);showPresentationPoint();}else if(key==='ArrowLeft'){state.presentationIndex=Math.max(0,state.presentationIndex-1);showPresentationPoint();}else if(key==='Escape'){presentationStop();}}
function recordingMode(){const p=new URLSearchParams(location.search),recording=p.get('grabacion')==='1',legend=p.get('leyenda')!=='0';document.body.classList.toggle('recording-mode',recording);els.recordingLegend.hidden=!(recording&&legend);if(recording&&p.get('presentar')==='1')setTimeout(presentationStart,500);let hideTimer;const reset=()=>{document.body.classList.remove('cursor-hidden');clearTimeout(hideTimer);if(recording)hideTimer=setTimeout(()=>document.body.classList.add('cursor-hidden'),2000);};window.addEventListener('mousemove',reset,{passive:true});reset();}

const PRIORITY_STORAGE_KEY='plaza-mayor-lineas-inversion-v1';
function initPriorityChart(){
 const chart=$('#priorityDonut'),totalLabel=$('#priorityTotal'),inputs=$$('[data-priority]');
 if(!chart||!totalLabel||inputs.length!==3)return;
 const defaults={experience:45,technology:37,safety:15};
 const colors={experience:'#ff9700',technology:'#42a5f5',safety:'#43c69b'};
 let saved={};
 try{saved=JSON.parse(localStorage.getItem(PRIORITY_STORAGE_KEY)||'{}')||{};}catch(_){}
 inputs.forEach(input=>{
  const key=input.dataset.priority;
  const stored=Number(saved[key]);
  input.value=Object.prototype.hasOwnProperty.call(saved,key)&&Number.isFinite(stored)?Math.max(0,Math.min(100,stored)):defaults[key];
 });
 function update(){
  const values={};
  inputs.forEach(input=>{
   const raw=input.value.trim();
   let value=raw===''?0:Number(raw);
   if(!Number.isFinite(value))value=0;
   value=Math.max(0,Math.min(100,Math.round(value)));
   values[input.dataset.priority]=value;
  });
  const sum=values.experience+values.technology+values.safety;
  const scale=sum>100?100/sum:1;
  let cursor=0;
  const stops=[];
  ['experience','technology','safety'].forEach(key=>{
   const next=cursor+values[key]*scale;
   stops.push(colors[key]+' '+cursor+'% '+next+'%');
   cursor=next;
  });
  if(cursor<100)stops.push('rgba(255,255,255,.16) '+cursor+'% 100%');
  chart.style.backgroundImage='conic-gradient('+stops.join(',')+')';
  chart.style.setProperty('--priority-total',sum+'%');
  totalLabel.textContent=sum+'%';
  chart.setAttribute('data-total',sum+'%');
  chart.setAttribute('aria-label','Gráfica pastel: mejora de experiencias '+values.experience+'%, actualización tecnológica '+values.technology+'%, seguridad humana y mejora de operación '+values.safety+'%, total '+sum+'%');
  try{localStorage.setItem(PRIORITY_STORAGE_KEY,JSON.stringify(values));}catch(_){}
 }
 inputs.forEach(input=>{
  input.addEventListener('input',update);
  input.addEventListener('change',()=>{
   const n=Number(input.value);
   input.value=Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):0;
   update();
  });
  input.addEventListener('keyup',update);
 });
 update();
}

function initMiniCharts(){
  const statusChart=$('#statusMiniChart'),typeChart=$('#typeMiniChart');
  const statusLegend=$('#statusPieLegend'),typeLegend=$('#typePieLegend');
  if(!statusChart||!typeChart)return;
  const render=(chart,legend,items,total)=>{
    let cursor=0;
    const stops=items.map(item=>{
      const pct=total?(item.value/total)*100:0;
      const next=cursor+pct;
      const stop=item.color+' '+cursor+'% '+next+'%';
      cursor=next;
      return stop;
    });
    if(cursor<100)stops.push('rgba(255,255,255,.16) '+cursor+'% 100%');
    chart.style.backgroundImage='conic-gradient('+stops.join(',')+')';
    chart.setAttribute('data-total',total);
    legend.innerHTML=items.map(item=>'<div class="mini-pie-item"><i style="--pie-color:'+item.color+'"></i><span>'+escapeHtml(item.label)+'</span><strong>'+item.value+'</strong></div>').join('');
  };
  function update(){
    const projects=state.data,total=projects.length;
    const statusOrder=['Contratado','Estructuración','En ejecución','Finalizado'];
    const statusColors=['#ff9700','#42a5f5','#43c69b','#9aa8ba'];
    const statuses=statusOrder.map((label,i)=>({label:label==='En ejecución'?'En ejec.':label,value:projects.filter(p=>p.estado===label).length,color:statusColors[i]})).filter(x=>x.value>0);
    const specific=projects.filter(p=>p.tipo==='especifico').length;
    const general=projects.filter(p=>p.tipo==='general').length;
    render(statusChart,statusLegend,statuses,total);
    render(typeChart,typeLegend,[{label:'Específicos',value:specific,color:'#ff9700'},{label:'Generales',value:general,color:'#7B3FC6'}],total);
    const st=$('#statusChartTotal'),tt=$('#typeChartTotal');
    if(st)st.textContent=total;
    if(tt)tt.textContent=total;
  }
  update();
  window.addEventListener('plaza:datachange',update);
}


function initInteractiveTimeline(){
 const root=$('#globalTimeline');
 const overlay=$('#timelineDetailOverlay');
 const closeBtn=$('#timelineDetailClose');
 const photoBox=$('#timelineDetailPhoto');
 const title=$('#timelineDetailTitle');
 const eyebrow=$('#timelineDetailEyebrow');
 const summary=$('#timelineDetailSummary');
 const stats=$('#timelineDetailStats');
 const projectsBox=$('#timelineDetailProjects');
 if(!root||!overlay||!closeBtn||!photoBox||!title||!eyebrow||!summary||!stats||!projectsBox)return;
 const events=Array.isArray(LINEA_TIEMPO)?LINEA_TIEMPO:[];
 const getYear=p=>{
  const match=String(p.fecha||'').match(/20\d{2}/);
  return match?Number(match[0]):null;
 };
 const getPhoto=(event,projects)=>{
  if(event.foto)return event.foto;
  const related=projects.find(p=>getYear(p)===event.year&&Array.isArray(p.fotos)&&p.fotos.length);
  return related?related.fotos[0]:'';
 };
 function renderPhotos(){
  events.forEach(event=>{
   const node=root.querySelector('[data-timeline-year="'+event.year+'"] .timeline-year-photo');
   if(!node)return;
   const src=getPhoto(event,state.data);
   node.innerHTML=src?'<img src="'+escapeHtml(src)+'" alt="" loading="lazy">':'<span class="timeline-photo-placeholder" aria-hidden="true">⌂</span>';
  });
 }
 function openYear(year){
  const event=events.find(item=>item.year===year);
  if(!event)return;
  const projects=state.data.filter(p=>getYear(p)===year);
  const photo=getPhoto(event,projects);
  const amount=projects.reduce((sum,p)=>sum+parseMoney(p.valor),0);
  eyebrow.textContent='LÍNEA DE TIEMPO · '+year;
  title.textContent=event.title;
  summary.textContent=event.summary;
  photoBox.innerHTML=photo
   ?'<img src="'+escapeHtml(photo)+'" alt="'+escapeHtml(event.title)+'" loading="lazy">'
   :'<div class="timeline-detail-photo-placeholder"><span>⌂</span><strong>Foto pendiente</strong><small>La fotografía de esta etapa aún no está cargada.</small></div>';
  stats.innerHTML=
   '<div><span>Año</span><strong>'+year+'</strong></div>'+
   '<div><span>Proyectos asociados</span><strong>'+projects.length+'</strong></div>'+
   '<div><span>Valor registrado</span><strong>$'+formatNumber(amount)+'</strong></div>';
  const cards=projects.map(p=>{
   const image=p.fotos&&p.fotos.length
    ?'<img src="'+escapeHtml(p.fotos[0])+'" alt="">'
    :'<span class="timeline-project-thumb" aria-hidden="true">⌂</span>';
   return '<button type="button" class="timeline-project-card" data-timeline-project="'+escapeHtml(p.id)+'">'+image+
    '<span><strong>'+escapeHtml(p.nombre)+'</strong><small>'+escapeHtml(p.estado)+' · '+escapeHtml(p.fecha)+'</small></span><b aria-hidden="true">›</b></button>';
  }).join('');
  projectsBox.innerHTML=
   '<div class="timeline-detail-description"><h3>Sobre esta etapa</h3><p>'+escapeHtml(event.detalle||event.summary)+'</p></div>'+
   (projects.length
    ?'<div><h3>Proyectos relacionados</h3>'+cards+'</div>'
    :'<div class="timeline-no-projects">No hay proyectos con fecha registrada en '+year+'.</div>');
  overlay.hidden=false;
  overlay.setAttribute('aria-hidden','false');
  document.body.classList.add('timeline-modal-open');
  requestAnimationFrame(()=>overlay.classList.add('is-open'));
  closeBtn.focus();
 }
 function close(){
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden','true');
  window.setTimeout(()=>{
   overlay.hidden=true;
   document.body.classList.remove('timeline-modal-open');
  },220);
 }
 root.addEventListener('click',event=>{
  const button=event.target.closest('[data-timeline-year]');
  if(button)openYear(Number(button.dataset.timelineYear));
 });
 projectsBox.addEventListener('click',event=>{
  const button=event.target.closest('[data-timeline-project]');
  if(!button)return;
  const project=projectById(button.dataset.timelineProject);
  if(!project)return;
  close();
  window.setTimeout(()=>selectProject(project.id,{open:true}),230);
 });
 closeBtn.addEventListener('click',close);
 overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!overlay.hidden)close();});
 renderPhotos();
 window.addEventListener('plaza:datachange',renderPhotos);
}

function initUpdateDate(){
 const target=$('#updateDate');
 if(!target)return;
 const now=new Date();
 target.textContent=[now.getDate(),now.getMonth()+1,now.getFullYear()].map((n,i)=>i<2?String(n).padStart(2,'0'):String(n)).join('/');
}

function initSwipeClose(){els.infoPanel.addEventListener('touchstart',e=>{state.touchStartY=e.touches[0].clientY;},{passive:true});els.infoPanel.addEventListener('touchend',e=>{if(state.touchStartY==null)return;if(e.changedTouches[0].clientY-state.touchStartY>90)closePanel();state.touchStartY=null;},{passive:true});}
els.panelClose.addEventListener('click',()=>closePanel());els.themeToggle.addEventListener('click',toggleTheme);els.editToggle.addEventListener('click',()=>toggleEdit());els.editClose.addEventListener('click',()=>toggleEdit(false));
els.pavilionSelect.addEventListener('change',()=>{if(!state.selectedId)return;const p=projectById(state.selectedId);if(p?.tipo==='especifico'){p.pabellon=els.pavilionSelect.value;renderAll();persistEdits();}});
els.copyData.addEventListener('click',copyData);els.downloadData.addEventListener('click',downloadJSON);els.importData.addEventListener('click',()=>els.importFile.click());els.importFile.addEventListener('change',e=>importBackup(e.target.files?.[0]));els.resetData.addEventListener('click',resetEdits);els.presentToggle.addEventListener('click',()=>state.presentation?presentationStop():presentationStart());
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.presentation){presentationStop();return;}if(e.key==='Escape'&&state.panelOpen){closePanel();return;}if(state.presentation){presentationKey(e.key);return;}});
window.addEventListener('resize',()=>{if(state.panelOpen&&state.selectedId)applyCamera(cameraForPoint(projectById(state.selectedId)));});
initTheme();restoreEdits();restorePlaceEdits();renderAll();initProjectFilters();initSwipeClose();initPriorityChart();initMiniCharts();initInteractiveTimeline();initUpdateDate();recordingMode();
})()