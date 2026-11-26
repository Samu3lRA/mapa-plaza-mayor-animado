/* Lógica del mapa. Los datos editables viven en js/datos.js. */
(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const REDUCED=window.matchMedia('(prefers-reduced-motion: reduce)'), STORAGE_KEY='plaza-mayor-mapa-edicion-v1', PLACE_STORAGE_KEY='plaza-mayor-ubicaciones-v1', AUDIT_STORAGE_KEY='plaza-mayor-historial-v1', BACKUP_STATUS_KEY='plaza-mayor-respaldo-fecha-v1', PRESENTATION_MS=6000;
const VERSION_KEY='plaza-mayor-datos-version-v1', EDITOR_KEY='plaza-mayor-editor-v1';let EDIT_ALLOWED=new URLSearchParams(location.search).get('editar')==='1'||(()=>{try{return localStorage.getItem('plaza-mayor-editor-v1')==='1';}catch(_){return false;}})();
let staleEdits=false;
const PRESENTATION_ORDER=Array.isArray(ORDEN_PRESENTACION)?ORDEN_PRESENTACION:PROYECTOS.map(p=>p.id);
const cloneTimeline=()=>Array.isArray(LINEA_TIEMPO)?LINEA_TIEMPO.map(item=>({...item,color:item.color||'#ff9700',status:item.status||'auto'})):[];
let timelineConfig=cloneTimeline();
const TIMELINE_STORAGE_KEY='plaza-mayor-linea-tiempo-v1';
let auditEntries=[];
let storageWarningShown=false;
const state={selectedId:null,previousFocus:null,panelOpen:false,editing:false,presentation:false,presentationPaused:false,presentationIndex:0,presentationTimer:null,touchStartY:null,data:cloneProjects(PROYECTOS)};
const els={appShell:$('#appShell'),mapViewport:$('#mapViewport'),mapStage:$('#mapStage'),pointsLayer:$('#pointsLayer'),generalList:$('#generalList'),specificList:$('#specificList'),legendItems:$('#legendItems'),themeToggle:$('#themeToggle'),editToggle:$('#editToggle'),presentToggle:$('#presentToggle'),infoPanel:$('#infoPanel'),panelScroll:$('#panelScroll'),panelClose:$('#panelClose'),panelPhotoWrap:$('#panelPhotoWrap'),panelStatus:$('#panelStatus'),panelTitle:$('#panelTitle'),panelValue:$('#panelValue'),panelDate:$('#panelDate'),panelLocation:$('#panelLocation'),panelDescription:$('#panelDescription'),panelScope:$('#panelScope'),panelProgressText:$('#panelProgressText'),panelProgressBar:$('#panelProgressBar'),panelResponsible:$('#panelResponsible'),panelNotes:$('#panelNotes'),descriptionBlock:$('#descriptionBlock'),scopeBlock:$('#scopeBlock'),progressBlock:$('#progressBlock'),responsibleBlock:$('#responsibleBlock'),notesBlock:$('#notesBlock'),editPanel:$('#editPanel'),editClose:$('#editClose'),projectEditor:$('#projectEditor'),editProjectName:$('#editProjectName'),editProjectType:$('#editProjectType'),editProjectTitle:$('#editProjectTitle'),editProjectValue:$('#editProjectValue'),editProjectDate:$('#editProjectDate'),editProjectStatus:$('#editProjectStatus'),editProjectResponsible:$('#editProjectResponsible'),editProjectProgress:$('#editProjectProgress'),editProjectDescription:$('#editProjectDescription'),editProjectScope:$('#editProjectScope'),editProjectPhotos:$('#editProjectPhotos'),editProjectNotes:$('#editProjectNotes'),saveProjectEdits:$('#saveProjectEdits'),cancelProjectEdits:$('#cancelProjectEdits'),pavilionSelect:$('#pavilionSelect'),copyData:$('#copyData'),downloadData:$('#downloadData'),resetData:$('#resetData'),dataOutput:$('#dataOutput'),presentationControls:$('#presentationControls'),presentationProgressBar:$('#presentationProgressBar'),presentationCounter:$('#presentationCounter'),toast:$('#toast'),recordingLegend:$('#recordingLegend'),editHistoryList:$('#editHistoryList'),dataQualityReport:$('#dataQualityReport'),importData:$('#importData'),importFile:$('#importFile')};
function cloneProjects(ps){return ps.map(p=>({...p,fotos:[...(p.fotos||[])],alcance:[...(p.alcance||[])]}));}
function migrateFoto(v){return (typeof FOTO_RUTAS_ANTERIORES!=='undefined'&&FOTO_RUTAS_ANTERIORES[v])||v;}
function projectById(id){return state.data.find(p=>p.id===id);}
function numeroDe(p){return state.data.findIndex(x=>x.id===p.id)+1;}
const COLORES_ESTADO={ejecucion:{nombre:'En ejecución',fondo:'#39FF14',texto:'#062b0a'},estructuracion:{nombre:'En estructuración',fondo:'#FF9700',texto:'#1b1200'},ejecutado:{nombre:'Ejecutado',fondo:'#4DA3FF',texto:'#06223f'}};
function colorFor(p){return COLORES_PABELLON.sin;} /* todos los puntos van en gris; el estado se ve en la lista, el panel y la línea de tiempo */
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function formatNumber(v){return new Intl.NumberFormat('es-CO',{maximumFractionDigits:1}).format(Math.max(0,Math.round(v*10)/10));}
function parseMoney(v){/* es-CO: punto = miles, coma = decimal ($64,5) */return Number(String(v).replace(/[^0-9,]/g,'').replace(',','.'))||0;}
function showToast(m,ms=2200){if(!els.toast)return;els.toast.textContent=m;els.toast.classList.add('is-visible');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>els.toast.classList.remove('is-visible'),ms);}
function reportStorageFailure(){if(storageWarningShown)return;storageWarningShown=true;showToast('Aviso: el navegador no permitió guardar los cambios. Descarga un respaldo antes de salir.');}
function persistLocal(key,value){try{localStorage.setItem(key,value);return true;}catch(_){reportStorageFailure();return false;}}
function removeLocal(key){try{localStorage.removeItem(key);return true;}catch(_){reportStorageFailure();return false;}}
function renderLegend(){els.legendItems.innerHTML='';['amarillo','azul','rojo','blanco','verde','convenciones'].forEach(k=>{const c=COLORES_PABELLON[k],i=document.createElement('span');i.className='legend-item';i.innerHTML='<i style="--legend-bg:'+c.fondo+';--legend-text:'+c.texto+'"></i><span>'+escapeHtml(c.nombre)+'</span>';els.legendItems.appendChild(i);});}
function createPoint(p,index){const c=colorFor(p),b=document.createElement('button');b.type='button';b.className='map-point';b.dataset.id=p.id;b.style.left=p.x+'%';b.style.top=p.y+'%';b.style.setProperty('--point-bg',c.fondo);b.style.setProperty('--point-text',c.texto);b.style.setProperty('--entry-delay',(index*45)+'ms');b.setAttribute('aria-label',p.nombre);b.innerHTML='<span>'+numeroDe(p)+'</span><span class="point-tooltip" aria-hidden="true">'+escapeHtml(p.nombre)+'</span>';b.addEventListener('click',()=>selectProject(p.id,{open:true}));b.addEventListener('pointerdown',e=>{if(state.editing)beginDrag(e,b);});return b;}
function renderPoints(){els.pointsLayer.innerHTML='';state.data.forEach((p,i)=>els.pointsLayer.appendChild(createPoint(p,i)));}

const PLACE_MARKERS=[
 {id:'amarillo',name:'Pabellón Amarillo',x:44.6,y:60.8,color:'#F2C200'},
 {id:'rojo',name:'Pabellón Rojo',x:38.7,y:43.1,color:'#D93636'},
 {id:'verde',name:'Pabellón Verde',x:52.9,y:30.0,color:'#2F9E50'},
 {id:'azul',name:'Pabellón Azul',x:40.0,y:38.2,color:'#1D5FD6'},
 {id:'blanco',name:'Pabellón Blanco',x:59.1,y:44.4,color:'#F6F6F6'},
 {id:'convenciones',name:'Convenciones',x:89.8,y:34.0,color:'#8B5A2B'}
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
function persistPlaceEdits(){return persistLocal(PLACE_STORAGE_KEY,JSON.stringify(placeState));}
function restorePlaceEdits(){
 try{if(localStorage.getItem(VERSION_KEY)!==String(typeof DATOS_VERSION!=='undefined'?DATOS_VERSION:1))return;const saved=JSON.parse(localStorage.getItem(PLACE_STORAGE_KEY)||'null');if(!Array.isArray(saved))return;
  placeState.forEach(p=>{const s=saved.find(v=>v.id===p.id);if(s&&Number.isFinite(s.x)&&Number.isFinite(s.y)){p.x=Math.max(0,Math.min(100,s.x));p.y=Math.max(0,Math.min(100,s.y));}});
 }catch(_){}
}
const pabAsignado=p=>!!(p.pabellon&&p.pabellon!=='sin'&&COLORES_PABELLON[p.pabellon]);
function applyProjectFilters(){
 const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
  const q=normalize($('#projectSearch')?.value||'');
 const status=$('#statusFilter')?.value||'',pavilion=$('#pavilionFilter')?.value||'';
 const matches=p=>{
  const haystack=normalize([p.nombre,p.responsable,p.estado,p.fecha,p.valor,p.descripcion,p.notas,pabAsignado(p)?COLORES_PABELLON[p.pabellon].nombre:'',p.ubicacion||''].join(' '));
  const queryOk=!q||haystack.includes(q);
  const statusOk=!status||normalize(p.estado)===normalize(status);
  const pavilionOk=!pavilion||(pavilion==='general'?p.tipo==='general'&&!pabAsignado(p):pavilion==='sin'?p.tipo==='especifico'&&!pabAsignado(p):p.pabellon===pavilion);
  return queryOk&&statusOk&&pavilionOk;
 };
 const visible=new Set(state.data.filter(matches).map(p=>p.id));
 $$('.map-point').forEach(el=>{const show=visible.has(el.dataset.id);el.classList.toggle('is-filtered-out',!show);el.setAttribute('aria-hidden',String(!show));el.tabIndex=show?0:-1;});
 $$('.project-list-item').forEach(el=>{el.hidden=!visible.has(el.dataset.id);});
 const pc=$('#projectCount');if(pc)pc.textContent='('+visible.size+')';
 const mc=$('#mapProjectCount');if(mc)mc.textContent='▥ '+visible.size+' proyectos';
 const list=$('#specificList');
 if(list){let empty=list.querySelector('.filter-empty');
  if(!visible.size&&!empty){empty=document.createElement('p');empty.className='filter-empty';empty.textContent='No se encontraron proyectos.';list.appendChild(empty);}
  if(visible.size&&empty)empty.remove();}
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

function createListItem(p){const c=colorFor(p),i=document.createElement('button');i.type='button';i.className='project-list-item';i.dataset.id=p.id;i.innerHTML='<span class="list-marker" style="--point-bg:'+c.fondo+';--point-text:'+c.texto+'">'+numeroDe(p)+'</span><span class="list-copy"><strong>'+escapeHtml(p.nombre)+'</strong><span>'+escapeHtml(valorM(p.valor))+' · '+escapeHtml(p.fecha)+'</span></span><span class="list-status">'+escapeHtml(p.estado||'Sin estado')+'</span>';i.addEventListener('click',()=>selectProject(p.id,{open:true}));return i;}
function renderLists(){els.specificList.innerHTML='';state.data.forEach(p=>els.specificList.appendChild(createListItem(p)));}
function clearSelected(){$$('.is-selected').forEach(e=>e.classList.remove('is-selected'));}
function markSelected(id){clearSelected();$('[data-id="'+CSS.escape(id)+'"].map-point')?.classList.add('is-selected');$('[data-id="'+CSS.escape(id)+'"].project-list-item')?.classList.add('is-selected');}
function cameraForPoint(p,scale=1.6){if(REDUCED.matches||scale===1)return{scale:1,x:0,y:0};const vw=els.mapViewport.clientWidth,vh=els.mapViewport.clientHeight,sw=els.mapStage.clientWidth,sh=els.mapStage.clientHeight,tx=p.x/100*sw,ty=p.y/100*sh,maxX=Math.max(0,(sw*scale-vw)/2),maxY=Math.max(0,(sh*scale-vh)/2);return{scale,x:Math.max(-maxX,Math.min(maxX,vw/2-tx*scale)),y:Math.max(-maxY,Math.min(maxY,vh/2-ty*scale))};}
function applyCamera(c,instant=false){els.mapStage.style.setProperty('--camera-scale',c.scale);els.mapStage.style.setProperty('--camera-x',c.x+'px');els.mapStage.style.setProperty('--camera-y',c.y+'px');if(instant||REDUCED.matches)els.mapStage.classList.add('no-camera-transition');else els.mapStage.classList.remove('no-camera-transition');if(instant||REDUCED.matches)requestAnimationFrame(()=>els.mapStage.classList.remove('no-camera-transition'));}
function renderPhoto(p){els.panelPhotoWrap.style.aspectRatio=(p.fotos?.length&&/^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/.test(p.fotoRatio||''))?p.fotoRatio:'';if(!p.fotos?.length){els.panelPhotoWrap.innerHTML='';els.panelPhotoWrap.hidden=true;els.infoPanel?.classList.add('no-photo');return;}els.panelPhotoWrap.hidden=false;els.infoPanel?.classList.remove('no-photo');const pos=/^[0-9% .a-z-]{1,30}$/i.test(p.fotoPos||'')?' style="object-position:'+p.fotoPos+'"':'';els.panelPhotoWrap.innerHTML='<img class="panel-photo" src="'+escapeHtml(p.fotos[0])+'" alt="'+escapeHtml(p.nombre)+'"'+pos+' loading="lazy">';}
function optional(block,value){block.hidden=!value;}
function renderPanel(p){renderPhoto(p);els.panelStatus.textContent=p.estado;els.panelTitle.textContent=p.nombre;els.panelDate.textContent=p.fecha;els.panelLocation.textContent=p.ubicacion?p.ubicacion:pabAsignado(p)?(p.pabellon==='convenciones'?'Convenciones':'Pabellón '+COLORES_PABELLON[p.pabellon].nombre):(p.tipo==='general'?'Toda la infraestructura':'Pabellón por asignar');els.panelDescription.textContent=p.descripcion||'';els.panelScope.innerHTML=(p.alcance||[]).map(x=>'<li>'+escapeHtml(x)+'</li>').join('');els.panelResponsible.textContent=p.responsable||'';els.panelNotes.textContent=p.notas||'';optional(els.descriptionBlock,!!p.descripcion);optional(els.scopeBlock,!!p.alcance?.length);optional(els.progressBlock,Number.isFinite(p.avance));optional(els.responsibleBlock,!!p.responsable);optional(els.notesBlock,!!p.notas);els.panelProgressText.textContent=Number.isFinite(p.avance)?p.avance+'%':'';els.panelProgressBar.style.width='0%';animateValue(p);if(Number.isFinite(p.avance)&&!REDUCED.matches)requestAnimationFrame(()=>els.panelProgressBar.style.width=p.avance+'%');else els.panelProgressBar.style.width=Number.isFinite(p.avance)?p.avance+'%':'0%';els.pavilionSelect.value=pabAsignado(p)?p.pabellon:'sin';els.pavilionSelect.disabled=false;window.dispatchEvent(new CustomEvent('plaza:panelrender',{detail:{project:p}}));}
function animateValue(p){const target=parseMoney(p.valor);if(REDUCED.matches){els.panelValue.textContent='$'+formatNumber(target)+' M';return;}const start=performance.now();function frame(now){const t=Math.min(1,(now-start)/900),eased=1-Math.pow(1-t,3);els.panelValue.textContent='$'+(t<1?formatNumber(Math.round(target*eased)):formatNumber(target))+' M';if(t<1)requestAnimationFrame(frame);}requestAnimationFrame(frame);}
function openPanel(p,trigger){state.previousFocus=trigger||document.activeElement;state.panelOpen=true;els.infoPanel.setAttribute('aria-hidden','false');els.infoPanel.classList.add('is-open');renderPanel(p);markSelected(p.id);applyCamera(cameraForPoint(p));els.panelScroll.scrollTop=0;requestAnimationFrame(()=>els.panelClose.focus());}
function closePanel({returnFocus=true}={}){state.panelOpen=false;els.infoPanel.classList.remove('is-open');els.infoPanel.setAttribute('aria-hidden','true');applyCamera({scale:1,x:0,y:0});clearSelected();if(returnFocus&&state.previousFocus&&document.contains(state.previousFocus))state.previousFocus.focus();state.previousFocus=null;}
function selectProject(id,{open=true,fromPresentation=false}={}){const p=projectById(id);if(!p)return;if(state.panelOpen&&state.selectedId!==id){els.infoPanel.classList.add('is-crossfade');setTimeout(()=>els.infoPanel.classList.remove('is-crossfade'),REDUCED.matches?80:200);}state.selectedId=id;markSelected(id);if(state.editing)openProjectEditor(p);if(open)openPanel(p,document.querySelector('.map-point[data-id="'+CSS.escape(id)+'"]'));else renderPanel(p);if(fromPresentation)updatePresentationProgress();}
function beginDrag(event,b){event.preventDefault();b.setPointerCapture?.(event.pointerId);const p=projectById(b.dataset.id),before={x:p.x,y:p.y};const move=e=>{const r=els.mapStage.getBoundingClientRect(),x=Math.max(0,Math.min(100,((e.clientX-r.left)/r.width)*100)),y=Math.max(0,Math.min(100,((e.clientY-r.top)/r.height)*100));p.x=Number(x.toFixed(1));p.y=Number(y.toFixed(1));b.style.left=p.x+'%';b.style.top=p.y+'%';updateDataOutput();persistEdits();notifyDataChanged();};const end=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);if(p.x!==before.x||p.y!==before.y)recordChange('Marcador reubicado',p.nombre+': ('+before.x+', '+before.y+') → ('+p.x+', '+p.y+')');};window.addEventListener('pointermove',move);window.addEventListener('pointerup',end,{once:true});}
function renderEditHistory(){
 const root=els.editHistoryList;if(!root)return;
 if(!auditEntries.length){root.innerHTML='<p class="history-empty">Todavía no hay modificaciones registradas en este navegador.</p>';return;}
 root.innerHTML=auditEntries.slice(0,40).map(entry=>'<div class="edit-history-entry"><time>'+escapeHtml(entry.date)+'</time><strong>'+escapeHtml(entry.action)+'</strong><span>'+escapeHtml(entry.detail)+'</span></div>').join('');
}
function recordChange(action,detail){
 const entry={date:new Date().toLocaleString('es-CO',{dateStyle:'short',timeStyle:'short'}),action:String(action),detail:String(detail)};
 auditEntries.unshift(entry);auditEntries=auditEntries.slice(0,100);
 persistLocal(AUDIT_STORAGE_KEY,JSON.stringify(auditEntries));
 renderEditHistory();
}
function restoreEditHistory(){
 try{const saved=JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY)||'[]');if(Array.isArray(saved))auditEntries=saved.filter(x=>x&&typeof x.action==='string'&&typeof x.detail==='string').slice(0,100);}catch(_){auditEntries=[];}
 renderEditHistory();
}
function updateDataOutput(){els.dataOutput.value=JSON.stringify({proyectos:state.data.map(p=>({...p,fotos:[...(p.fotos||[])],alcance:[...(p.alcance||[])]})),ubicaciones:placeState.map(p=>({id:p.id,nombre:p.name,x:p.x,y:p.y}))},null,2);}
function openProjectEditor(p){
 if(!els.projectEditor)return;
 els.projectEditor.hidden=false;
 els.editProjectName.textContent=p.nombre||'Proyecto seleccionado';
 els.editProjectType.textContent=p.tipo==='general'?'Toda la infraestructura':'Proyecto específico';
 els.editProjectTitle.value=p.nombre||'';els.editProjectValue.value=p.valor||'';els.editProjectDate.value=p.fecha||'';
 els.editProjectStatus.value=p.estado||'Estructuración';els.editProjectResponsible.value=p.responsable||'';
 els.editProjectProgress.value=Number.isFinite(Number(p.avance))?p.avance:'';
 els.editProjectDescription.value=p.descripcion||'';els.editProjectScope.value=Array.isArray(p.alcance)?p.alcance.join('\n'):'';
 els.editProjectPhotos.value=Array.isArray(p.fotos)?p.fotos.join('\n'):'';els.editProjectNotes.value=p.notas||'';
 els.pavilionSelect.value=pabAsignado(p)?p.pabellon:'sin';els.pavilionSelect.disabled=false;
}
function closeProjectEditor(){if(els.projectEditor)els.projectEditor.hidden=true;}
function saveProjectEditor(){
 if(!state.selectedId)return;const p=projectById(state.selectedId);if(!p)return;
 const previous={...p,alcance:[...(p.alcance||[])],fotos:[...(p.fotos||[])]},rawProgress=els.editProjectProgress.value.trim(),progress=rawProgress===''?null:Number(rawProgress);
 if(progress!==null&&(!Number.isFinite(progress)||progress<0||progress>100)){showToast('El avance debe estar entre 0 y 100%.');return;}
 Object.assign(p,{nombre:els.editProjectTitle.value.trim()||p.nombre,valor:els.editProjectValue.value.trim()||p.valor,fecha:els.editProjectDate.value.trim()||p.fecha,estado:els.editProjectStatus.value,responsable:els.editProjectResponsible.value.trim(),avance:progress,descripcion:els.editProjectDescription.value.trim(),alcance:els.editProjectScope.value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean).slice(0,30),fotos:els.editProjectPhotos.value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean).slice(0,20),notas:els.editProjectNotes.value.trim()});
 const changes=[];[['nombre','Nombre'],['valor','Valor'],['fecha','Fecha'],['estado','Estado'],['responsable','Responsable'],['descripcion','Descripción'],['notas','Notas']].forEach(([k,l])=>{if(String(previous[k]??'')!==String(p[k]??''))changes.push(l);});
 if(JSON.stringify(previous.alcance)!==JSON.stringify(p.alcance))changes.push('Alcance');if(JSON.stringify(previous.fotos)!==JSON.stringify(p.fotos))changes.push('Fotos');if(Number(previous.avance??-1)!==Number(p.avance??-1))changes.push('Avance');
 persistEdits();renderAll();if(changes.length)recordChange('Proyecto actualizado',p.nombre+': '+changes.join(', '));openProjectEditor(p);renderPanel(p);showToast(changes.length?'Proyecto actualizado y guardado.':'No hubo cambios que guardar.');
}
function cancelProjectEditor(){if(state.selectedId){const p=projectById(state.selectedId);if(p)openProjectEditor(p);}else closeProjectEditor();}
function updateDataQualityReport(){
 const root=els.dataQualityReport;if(!root)return;
 const total=state.data.length;
 const ids=state.data.map(p=>p.id);
 const duplicateIds=ids.filter((id,index)=>ids.indexOf(id)!==index).length;
 const checks=[
  ['Fotografías pendientes',p=>!Array.isArray(p.fotos)||p.fotos.length===0],
  ['Descripción pendiente',p=>!String(p.descripcion||'').trim()],
  ['Alcance pendiente',p=>!Array.isArray(p.alcance)||p.alcance.length===0],
  ['Avance por revisar',p=>!Number.isFinite(Number(p.avance))||Number(p.avance)<0||Number(p.avance)>100],
  ['Responsable pendiente',p=>!String(p.responsable||'').trim()],
  ['Notas pendientes',p=>!String(p.notas||'').trim()],
  ['Pabellón sin asignar',p=>!pabAsignado(p)],
  ['Coordenadas por revisar',p=>!Number.isFinite(Number(p.x))||!Number.isFinite(Number(p.y))||Number(p.x)<0||Number(p.x)>100||Number(p.y)<0||Number(p.y)>100]
 ];
 const rows=checks.map(([label,test])=>{
  const count=state.data.filter(test).length;
  return '<div class="quality-row"><span>'+label+'</span><strong>'+count+' / '+total+'</strong></div>';
 }).join('');
 const integrity='<div class="quality-row"><span>Identificadores duplicados</span><strong>'+duplicateIds+'</strong></div>';
 root.innerHTML='<p class="quality-intro">Diagnóstico local de integridad y campos pendientes. Los datos no se modifican automáticamente.</p>'+rows+integrity;
}
function persistEdits(){const ok=persistLocal(STORAGE_KEY,JSON.stringify(state.data));if(ok)persistLocal(VERSION_KEY,String(typeof DATOS_VERSION!=='undefined'?DATOS_VERSION:1));return ok;}
function restoreEdits(){
 try{
  const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return;
  if(localStorage.getItem(VERSION_KEY)!==String(typeof DATOS_VERSION!=='undefined'?DATOS_VERSION:1))staleEdits=true;
  const saved=JSON.parse(raw);if(!Array.isArray(saved))return;
  const validPavilions=new Set(Object.keys(COLORES_PABELLON).filter(k=>k!=='general'));
  const textFields=['nombre','valor','fecha','estado','descripcion','responsable','notas'];
  state.data=state.data.map(p=>{
   const s=saved.find(x=>x.id===p.id);if(!s)return p;
   const x=Number(s.x),y=Number(s.y),next={...p};
   if(!staleEdits&&Number.isFinite(x)&&x>=0&&x<=100)next.x=x;
   if(!staleEdits&&Number.isFinite(y)&&y>=0&&y<=100)next.y=y;
   if(validPavilions.has(s.pabellon))next.pabellon=s.pabellon;
   (staleEdits?['descripcion','responsable','notas']:textFields).forEach(key=>{if(typeof s[key]==='string')next[key]=s[key];});
   if(Array.isArray(s.alcance))next.alcance=s.alcance.filter(v=>typeof v==='string').slice(0,30);
   if(Array.isArray(s.fotos)&&!staleEdits){const f=s.fotos.filter(v=>typeof v==='string'&&v.trim()).map(migrateFoto).slice(0,20);if(f.length)next.fotos=f;}
   if(s.avance===null||Number.isFinite(Number(s.avance)))next.avance=s.avance===null?null:Math.max(0,Math.min(100,Number(s.avance)));
   return next;
  });
  saved.filter(x=>x&&x.nuevo&&typeof x.id==='string'&&typeof x.nombre==='string'&&!state.data.some(p=>p.id===x.id)).forEach(x=>{
   state.data.push({id:x.id,tipo:'especifico',nombre:x.nombre,valor:String(x.valor||''),fecha:String(x.fecha||''),estado:String(x.estado||'Estructuración'),pabellon:'sin',
    x:Math.max(0,Math.min(100,Number(x.x)||50)),y:Math.max(0,Math.min(100,Number(x.y)||50)),fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:'',nuevo:true});
  });
 }catch(_){}
}
function resetEdits(){
 if(!window.confirm('¿Restablecer posiciones, pabellones, porcentajes y personalización de la línea de tiempo a sus valores iniciales? Esta acción no se puede deshacer en este navegador.'))return;
 removeLocal(STORAGE_KEY);removeLocal(VERSION_KEY);removeLocal(PLACE_STORAGE_KEY);removeLocal(PRIORITY_STORAGE_KEY);removeLocal('plaza-mayor-mini-charts-v1');window.PlazaMayorControles?.reset();removeLocal(TIMELINE_STORAGE_KEY);timelineConfig=cloneTimeline();window.PlazaMayorTimeline?.refresh();
 state.data=cloneProjects(PROYECTOS);PLACE_MARKERS.forEach((p,i)=>Object.assign(placeState[i],p));
 const priorityDefaults={experience:45,technology:37,safety:15};
 $$('[data-priority]').forEach(input=>{input.value=priorityDefaults[input.dataset.priority];input.dispatchEvent(new Event('input',{bubbles:true}));});
 const miniDefaults={statusA:58,statusB:42,typeA:45,typeB:27,typeC:28};
 $$('[data-mini-chart]').forEach(input=>{input.value=miniDefaults[input.dataset.miniChart];input.dispatchEvent(new Event('input',{bubbles:true}));});
 closeProjectEditor();recordChange('Restablecimiento','Se restauraron posiciones, pabellones y porcentajes iniciales.');renderAll();
 showToast(storageWarningShown?'Mapa restablecido en esta sesión, pero el navegador no confirmó el guardado local. Descarga un respaldo.':'Mapa restablecido a los valores iniciales.');
}
function updateBackupStatus(){const node=$('#backupStatus');if(!node)return;try{const saved=localStorage.getItem(BACKUP_STATUS_KEY);node.textContent=saved?'Último respaldo descargado en este navegador: '+new Date(saved).toLocaleString('es-CO'):'Aún no has descargado un respaldo en este navegador.';}catch(_){node.textContent='No se pudo consultar el estado del respaldo en este navegador.';}}
function notifyDataChanged(){window.dispatchEvent(new CustomEvent('plaza:datachange',{detail:{projects:state.data}}));}
function renderAll(){renderPoints();renderLists();renderLegend();renderPlaceMarkers();updateDataOutput();updateDataQualityReport();renderEditHistory();applyProjectFilters();if(state.selectedId)markSelected(state.selectedId);notifyDataChanged();}
window.PlazaMayorData={getProjects:()=>state.data,refresh:()=>{renderAll();},
 /* Aplica el resultado ya validado de js/excel.js: solo nombre, valor, fecha y estado; los proyectos nuevos entran sin foto y centrados en el mapa. */
 aplicarExcel(cambios,nuevos){
  const CAMPOS=['nombre','valor','fecha','estado'];
  cambios.forEach(c=>{const p=projectById(c.id);if(!p)return;CAMPOS.forEach(k=>{if(c.despues&&typeof c.despues[k]==='string')p[k]=c.despues[k];});});
  let n=state.data.reduce((m,p)=>{const r=/^n(\d+)$/.exec(p.id);return r?Math.max(m,+r[1]):m;},0);
  const creados=nuevos.map(x=>{n+=1;const p={id:'n'+n,tipo:'especifico',nombre:x.nombre,valor:x.valor,fecha:x.fecha,estado:x.estado,pabellon:'sin',x:50,y:50,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:'',nuevo:true};state.data.push(p);return p;});
  persistEdits();recordChange('Datos actualizados desde Excel',cambios.length+' proyecto(s) modificado(s), '+creados.length+' nuevo(s)');
  renderAll();notifyDataChanged();showToast('Datos actualizados desde Excel');
  return creados.map(p=>p.id);
 }};
function toggleEdit(force){const wanted=force??!state.editing;if(wanted&&!EDIT_ALLOWED)return;state.editing=wanted;els.editToggle.setAttribute('aria-pressed',String(state.editing));els.editToggle.textContent=state.editing?'Cerrar edición':'Modo edición';els.editPanel.hidden=!state.editing;document.body.classList.toggle('editing',state.editing);if(state.editing)updateDataOutput();}
function downloadJSON(){
 const priority={};$$('[data-priority]').forEach(input=>priority[input.dataset.priority]=Number(input.value)||0);
 const miniCharts={};$$('[data-mini-chart]').forEach(input=>miniCharts[input.dataset.miniChart]=Number(input.value)||0);
 const backup={format:'plaza-mayor-map-backup',version:1,exportedAt:new Date().toISOString(),timeline:timelineConfig.map(item=>({...item})),projects:state.data.map(p=>({...p,fotos:[...(p.fotos||[])],alcance:[...(p.alcance||[])]})),locations:placeState.map(p=>({...p})),priority,miniCharts};
 const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='respaldo-mapa-plaza-mayor.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
 const backupDate=new Date().toISOString();persistLocal(BACKUP_STATUS_KEY,backupDate);updateBackupStatus();
 showToast(storageWarningShown?'Archivo de respaldo descargado; no se pudo guardar la fecha local.':'Respaldo completo descargado.');
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
   let importedTimeline=null;
   if(Array.isArray(backup.timeline)){
    const years=new Set((Array.isArray(LINEA_TIEMPO)?LINEA_TIEMPO:[]).map(x=>x.year));
    if(backup.timeline.length!==years.size||backup.timeline.some(item=>!years.has(Number(item.year))||['title','summary','detalle','foto'].some(k=>typeof item[k]!=='string')||(item.color&&!/^#[0-9a-f]{6}$/i.test(item.color))))throw new Error('La personalización de la línea de tiempo no es válida.');
    importedTimeline=backup.timeline.map(item=>({...item,year:Number(item.year),color:item.color||'#ff9700',status:item.status||'auto'}));
   }
   const nextProjects=state.data.map(p=>{
    const incoming=backup.projects.find(x=>x.id===p.id);
    const x=Number(incoming.x),y=Number(incoming.y);
    if(!Number.isFinite(x)||x<0||x>100||!Number.isFinite(y)||y<0||y>100)throw new Error('Hay coordenadas inválidas en el respaldo.');
    const next={...p,x,y};
    ['nombre','valor','fecha','estado','descripcion','responsable','notas'].forEach(key=>{if(typeof incoming[key]==='string')next[key]=incoming[key];});
    if(Array.isArray(incoming.alcance))next.alcance=incoming.alcance.filter(v=>typeof v==='string').slice(0,30);
    if(Array.isArray(incoming.fotos))next.fotos=incoming.fotos.filter(v=>typeof v==='string'&&v.trim()).map(migrateFoto).slice(0,20);
    if(incoming.avance===null||Number.isFinite(Number(incoming.avance)))next.avance=incoming.avance===null?null:Math.max(0,Math.min(100,Number(incoming.avance)));
    if(pavilionKeys.has(incoming.pabellon))next.pabellon=incoming.pabellon;
    else if(p.tipo==='especifico')throw new Error('Hay un pabellón no válido en el respaldo.');
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
const miniCharts=backup.miniCharts&&typeof backup.miniCharts==='object'?backup.miniCharts:null;
   if(miniCharts){
    for(const key of ['statusA','statusB','typeA','typeB','typeC']){
     if(miniCharts[key]!==undefined&&(!Number.isFinite(Number(miniCharts[key]))||Number(miniCharts[key])<0||Number(miniCharts[key])>100))throw new Error('Hay porcentajes inválidos en las gráficas secundarias.');
    }
   }
   state.data=nextProjects;
   if(importedTimeline){timelineConfig=importedTimeline;persistLocal(TIMELINE_STORAGE_KEY,JSON.stringify(timelineConfig));window.PlazaMayorTimeline?.refresh();}
   nextLocations.forEach((p,i)=>Object.assign(placeState[i],p));
   persistEdits();persistPlaceEdits();
   if(priorities){
    $$('[data-priority]').forEach(input=>{if(priorities[input.dataset.priority]!==undefined){input.value=Number(priorities[input.dataset.priority]);input.dispatchEvent(new Event('input',{bubbles:true}));}});
   }
   if(miniCharts){
    $$('[data-mini-chart]').forEach(input=>{if(miniCharts[input.dataset.miniChart]!==undefined){input.value=Number(miniCharts[input.dataset.miniChart]);input.dispatchEvent(new Event('input',{bubbles:true}));}});
   }
   recordChange('Respaldo importado','Se importaron posiciones, pabellones y porcentajes desde un archivo de respaldo.');renderAll();showToast(storageWarningShown?'Respaldo cargado en esta sesión, pero no se pudo confirmar el guardado local. Descarga un respaldo.':'Respaldo importado correctamente.');
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
function presentationStart(){if(!PRESENTATION_ORDER.length)return;state.presentation=true;state.presentationPaused=false;state.presentationIndex=0;els.presentationControls.hidden=false;els.presentToggle.textContent='Salir de presentación';els.appShell.classList.add('is-presenting');document.body.classList.add('is-presenting-body');try{const r=document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();r&&r.catch&&r.catch(()=>{});}catch(_){}showPresentationPoint();}
function presentationStop(){clearTimeout(state.presentationTimer);state.presentation=false;state.presentationPaused=false;els.presentationControls.hidden=true;els.presentToggle.textContent='▶ Modo presentación';els.appShell.classList.remove('is-presenting');document.body.classList.remove('is-presenting-body');try{if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});}catch(_){}closePanel({returnFocus:false});applyCamera({scale:1,x:0,y:0});}
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
  persistLocal(PRIORITY_STORAGE_KEY,JSON.stringify(values));
 }
 inputs.forEach(input=>{
  input.dataset.lastCommitted=String(Number(input.value)||0);
  input.addEventListener('input',update);
  input.addEventListener('change',()=>{
   const previous=Number(input.dataset.lastCommitted??input.value);
   const n=Number(input.value);
   input.value=Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):0;
   update();
   const current=Number(input.value);
   if(current!==previous)recordChange('Prioridad actualizada',input.closest('label')?.querySelector('span')?.textContent+': '+previous+'% → '+current+'%');
   input.dataset.lastCommitted=String(current);
  });
  input.addEventListener('keyup',update);
 });
 update();
}

function initMiniCharts(){
  const statusChart=$('#statusMiniChart'),typeChart=$('#typeMiniChart');
  const statusLegend=$('#statusPieLegend'),typeLegend=$('#typePieLegend');
  const statusTotal=$('#statusChartTotal'),typeTotal=$('#typeChartTotal');
  if(!statusChart||!typeChart||!statusLegend||!typeLegend)return;

  const defaults={statusA:58,statusB:42,typeA:45,typeB:27,typeC:28};
  const colors={statusA:'#ff9700',statusB:'#003e99',typeA:'#f3c51b',typeB:'#6aad2d',typeC:'#5dff00'};
  const labels={statusA:'Puesta a Punto y Estabilización',statusB:'Mejora y Evolución',typeA:'Estructuración',typeB:'En ejecución',typeC:'Ejecutado'};
  const storageKey='plaza-mayor-mini-charts-v1';
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(storageKey)||'{}')||{};}catch(_){}

  const getValue=key=>{
    const input=$('[data-mini-chart="'+key+'"]');
    const n=Number(input?.value);
    return Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):0;
  };
  const getValues=()=>Object.fromEntries(Object.keys(defaults).map(key=>[key,getValue(key)]));

  const renderChart=(chart,keys,values)=>{
    let cursor=0;
    const sum=keys.reduce((total,key)=>total+values[key],0);
    const scale=sum>100?100/sum:1;
    const stops=[];
    keys.forEach(key=>{
      const next=cursor+values[key]*scale;
      stops.push(colors[key]+' '+cursor+'% '+next+'%');
      cursor=next;
    });
    if(cursor<100)stops.push('rgba(255,255,255,.16) '+cursor+'% 100%');
    chart.style.backgroundImage='conic-gradient('+stops.join(',')+')';
    chart.setAttribute('data-total',sum+'%');
    return sum;
  };

  const renderLegend=(legend,keys,values)=>{
    legend.innerHTML=keys.map(key=>'<label class="mini-pie-item"><i style="--pie-color:'+colors[key]+'"></i><span>'+escapeHtml(labels[key])+'</span><span class="mini-input-wrap"><input type="number" min="0" max="100" step="1" value="'+values[key]+'" data-mini-chart="'+key+'" aria-label="Porcentaje de '+escapeHtml(labels[key])+'">%</span></label>').join('');
  };

  const savedValues=Object.keys(defaults).reduce((out,key)=>{
    const n=Number(saved[key]);
    out[key]=Object.prototype.hasOwnProperty.call(saved,key)&&Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):defaults[key];
    return out;
  },{});

  renderLegend(statusLegend,['statusA','statusB'],savedValues);
  renderLegend(typeLegend,['typeA','typeB','typeC'],savedValues);

  function update(){
    const values=getValues();
    $$('[data-mini-chart]').forEach(input=>{input.value=values[input.dataset.miniChart];});
    persistLocal(storageKey,JSON.stringify(values));
    const sumStatus=renderChart(statusChart,['statusA','statusB'],values);
    const sumType=renderChart(typeChart,['typeA','typeB','typeC'],values);
    if(statusTotal)statusTotal.textContent=sumStatus+'%';
    if(typeTotal)typeTotal.textContent=sumType+'%';
    statusChart.setAttribute('aria-label','Puesta a Punto y Estabilización '+values.statusA+'%, Mejora y Evolución '+values.statusB+'%, total '+sumStatus+'%');
    typeChart.setAttribute('aria-label','Estructuración '+values.typeA+'%, En ejecución '+values.typeB+'%, Ejecutado '+values.typeC+'%, total '+sumType+'%');
  }

  $$('[data-mini-chart]').forEach(input=>{
    input.dataset.lastCommitted=String(Number(input.value)||0);
    input.addEventListener('input',update);
    input.addEventListener('change',()=>{
      const before=Number(input.dataset.lastCommitted??input.value);
      input.value=Math.max(0,Math.min(100,Math.round(Number(input.value)||0)));
      update();
      const current=Number(input.value);
      if(current!==before)recordChange('Gráfica actualizada',labels[input.dataset.miniChart]+': '+before+'% → '+current+'%');
      input.dataset.lastCommitted=String(current);
    });
  });
  update();
}

function initInteractiveTimeline(){
 const root=$('#globalTimeline'),overlay=$('#timelineDetailOverlay'),closeBtn=$('#timelineDetailClose'),photoBox=$('#timelineDetailPhoto'),title=$('#timelineDetailTitle'),eyebrow=$('#timelineDetailEyebrow'),summary=$('#timelineDetailSummary'),stats=$('#timelineDetailStats'),projectsBox=$('#timelineDetailProjects'),prevYearBtn=$('#timelinePrevYear'),nextYearBtn=$('#timelineNextYear'),navCounter=$('#timelineNavCounter'),navProgress=$('#timelineNavProgress');
 let activeYear=null,lastTimelineOpener=null;
 if(!root||!overlay||!closeBtn||!photoBox||!title||!eyebrow||!summary||!stats||!projectsBox)return;
 let events=timelineConfig;const monthNames=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],currentYear=new Date().getFullYear();
 const getYear=p=>{const m=String(p.fecha||'').match(/20\d{2}/);return m?Number(m[0]):null;};
 const getMonth=p=>monthNames.findIndex(m=>String(p.fecha||'').toLocaleLowerCase('es').includes(m));
 const getPhoto=(event,projects)=>{if(event.foto)return event.foto;const tiene=p=>Array.isArray(p.fotos)&&p.fotos.length;const related=projects.find(p=>getYear(p)===event.year&&tiene(p))||projects.find(tiene);return related?related.fotos[0]:'';};
 const renderYearCards=()=>events.forEach(event=>{const node=root.querySelector('[data-timeline-metrics="'+event.year+'"]');if(!node)return;const projects=state.data.filter(p=>getYear(p)===event.year),contracted=projects.filter(p=>String(p.estado).toLocaleLowerCase('es').includes('ejecuc')).length,structured=projects.filter(p=>String(p.estado).toLocaleLowerCase('es').includes('estruct')).length;node.innerHTML=projects.length?'<span class="tl-stat"><b>'+projects.length+'</b> proyectos</span><span class="tl-stat"><b>'+contracted+'</b> en ejecución</span><span class="tl-stat"><b>'+structured+'</b> en estructuración</span>':'<span class="tl-empty">Sin proyectos registrados</span>';;const button=root.querySelector('[data-timeline-year="'+event.year+'"]');if(button){const copy=button.querySelector('.tl-copy');if(copy){copy.querySelector('strong').textContent=event.title;copy.querySelector('span').textContent=event.summary;}button.setAttribute('aria-label','Ver información de '+event.year+': '+event.title);button.style.setProperty('--timeline-accent',event.color||'#ff9700');button.classList.remove('is-past','is-current','is-future');const visualStatus=event.status==='done'?'is-past':event.status==='current'?'is-current':event.status==='future'?'is-future':event.year<currentYear?'is-past':event.year===currentYear?'is-current':'is-future';button.classList.add(visualStatus);const stp=button.closest('.tl-step');if(stp)stp.dataset.state=visualStatus;const lab=button.querySelector('.tl-status');if(lab)lab.textContent=visualStatus==='is-past'?'Etapa concluida':visualStatus==='is-current'?'En curso':'Proyectada';}});
 const renderTimelineSummary=()=>{
  const all=state.data,low=v=>String(v||'').toLocaleLowerCase('es'),con=all.filter(p=>low(p.estado).includes('ejecuc')).length,est=all.filter(p=>low(p.estado).includes('estruct')).length;
  const k=document.getElementById('tlKpis');
  if(k)k.innerHTML='<span class="tl-kpi"><b>'+all.length+'</b><small>Proyectos del plan</small></span><span class="tl-kpi is-ok"><b>'+con+'</b><small>En ejecución</small></span><span class="tl-kpi is-warn"><b>'+est+'</b><small>En estructuración</small></span>';
  let idx=-1;root.querySelectorAll('.tl-step').forEach((st,i)=>{if(st.dataset.state!=='is-future')idx=i;});
  const n=Math.max(1,root.querySelectorAll('.tl-step').length-1);
  root.style.setProperty('--tl-progress',(Math.max(0,idx)/n*100)+'%');
 };
 const renderFaseCounts=()=>{
  const y=state.data,low=p=>String(p.estado||'').toLocaleLowerCase('es'),
   con=y.filter(p=>low(p).includes('contrat')).length,est=y.filter(p=>low(p).includes('estruct')).length,ej=y.filter(p=>low(p).includes('ejecuc')),
   pl=n=>n+' proyecto'+(n===1?'':'s');
  const a=root.querySelector('[data-fase-count="contratacion"]'),b=root.querySelector('[data-fase-count="ejecucion"]');
  if(a){const pend=y.filter(p=>low(p).includes('contrat')||low(p).includes('estruct')),tot=pend.reduce((t,p)=>t+parseMoney(p.valor),0);a.textContent=pl(est)+' en estructuración'+(con?' · '+con+' contratado'+(con===1?'':'s'):'')+' · $'+formatNumber(tot)+' M';}
  if(b)b.textContent=pl(ej.length);
  const SUM=root.querySelector('[data-fase-sum="ejecucion"]');
  if(SUM){const R=(typeof RESUMEN_EJECUCION!=='undefined'?RESUMEN_EJECUCION:{}),v=n=>Number.isFinite(n)?'$'+formatNumber(n)+' M':'—',e=ej.reduce((t,p)=>t+parseMoney(p.valor),0);
   SUM.innerHTML='<span class="tl-sum-row tl-sum-gold"><span>Contratado</span><b>'+v(R.contratado)+'</b></span><span class="tl-sum-row"><span>Ejecutado</span><b>'+v(R.ejecutado)+'</b></span><span class="tl-sum-row"><span>Ejecución</span><b>'+v(Number.isFinite(R.ejecucion)?R.ejecucion:e)+'</b></span>';}
  const key=p=>{const m=getMonth(p);return (getYear(p)||9999)*12+(m<0?11:m);};
  const rowsOf=arr=>arr.slice().sort((x,y)=>key(x)-key(y)||x.nombre.localeCompare(y.nombre,'es')).map(p=>'<span class="tl-phase-item"><span>'+escapeHtml(p.nombre)+'</span><em>'+escapeHtml(p.fecha||'Fecha por definir')+'</em></span>').join('');
  const LC=root.querySelector('[data-fase-list="contratacion"]');
  if(LC)LC.innerHTML=rowsOf(y.filter(p=>low(p).includes('contrat')||low(p).includes('estruct')));
  const L=root.querySelector('[data-fase-list="ejecucion"]');
  if(L){
   L.innerHTML=ej.slice().sort((x,y)=>key(x)-key(y)||x.nombre.localeCompare(y.nombre,'es')).map(p=>'<span class="tl-phase-item"><span>'+escapeHtml(p.nombre)+'</span><em>'+escapeHtml(p.fecha||'Fecha por definir')+'</em></span>').join('');}
 };
 const renderYearMetrics=()=>{renderYearCards();renderFaseCounts();renderTimelineSummary();};
 const renderPhotos=()=>events.forEach(event=>{const node=root.querySelector('[data-timeline-year="'+event.year+'"] .tl-photo');if(!node)return;const src=getPhoto(event,state.data);node.innerHTML=src?'<img src="'+escapeHtml(src)+'" alt="" loading="lazy">':'<span class="timeline-photo-placeholder" aria-hidden="true">⌂</span>';});
 const highlightYear=year=>{$$('.map-point').forEach(point=>point.classList.toggle('timeline-highlight',getYear(projectById(point.dataset.id)||{})===year));document.body.classList.add('timeline-year-focused');};
 const clearHighlight=()=>{$$('.map-point').forEach(point=>point.classList.remove('timeline-highlight'));document.body.classList.remove('timeline-year-focused');};
 const monthLabel=index=>index>=0?monthNames[index].replace(/^./,m=>m.toUpperCase()):'Fecha por definir';
 const FASES={contratacion:/contrat|estruct/i,ejecucion:/ejecuc/i};
 function openYear(year,fase){
  const event=events.find(item=>item.year===year);if(!event)return;
  const faseOk=p=>!fase||FASES[fase].test(String(p.estado||''));
  const projects=state.data.filter(p=>(fase||getYear(p)===year)&&faseOk(p)).sort((a,b)=>{const ma=getMonth(a),mb=getMonth(b);return (ma<0?99:ma)-(mb<0?99:mb)||a.nombre.localeCompare(b.nombre,'es');});
  const photo=(fase==='ejecucion'&&event.fotoEjecucion)||getPhoto(event,projects),amount=projects.reduce((sum,p)=>sum+parseMoney(p.valor),0),contracted=projects.filter(p=>String(p.estado).toLocaleLowerCase('es').includes('ejecuc')).length,structured=projects.filter(p=>String(p.estado).toLocaleLowerCase('es').includes('estruct')).length;
  const now=new Date(),currentMonth=now.getMonth();
  const nextProject=projects.find(p=>{const m=getMonth(p);return m>=0&&(year>currentYear||(year===currentYear&&m>=currentMonth));});
  activeYear=year;const yearIndex=events.findIndex(item=>item.year===year),yearCount=events.length;
  if(navCounter)navCounter.textContent='ETAPA '+(yearIndex+1)+' DE '+yearCount;
  if(navProgress)navProgress.style.width=((yearIndex+1)/yearCount*100)+'%';
  if(prevYearBtn)prevYearBtn.disabled=yearIndex<=0;
  if(nextYearBtn)nextYearBtn.disabled=yearIndex>=yearCount-1;
  eyebrow.textContent='LÍNEA DE TIEMPO · '+year+(fase==='ejecucion'?' · AVANCE PLAN DE INVERSIÓN':fase==='contratacion'?' · CONTRATACIÓN Y ESTRUCTURACIÓN':'');window.dispatchEvent(new CustomEvent('plaza:yearopen',{detail:{year,fase}}));title.textContent=fase==='ejecucion'?'Avance plan de inversión':event.title;summary.textContent=fase==='ejecucion'?'Todos los proyectos que ya están en ejecución, con su mes y año previsto de entrega.':event.summary;
  photoBox.hidden=!photo;photoBox.innerHTML=photo?'<img src="'+escapeHtml(photo)+'" alt="'+escapeHtml(event.title)+'" loading="lazy">':'';
  stats.innerHTML='<div><span>Proyectos</span><strong>'+projects.length+'</strong></div><div><span>En ejecución</span><strong>'+contracted+'</strong></div><div><span>Estructuración</span><strong>'+structured+'</strong></div><div><span>Valor registrado</span><strong>$'+formatNumber(amount)+' M</strong></div>';
  const grouped=[];projects.forEach(p=>{const key=getMonth(p);let g=grouped.find(x=>x.key===key);if(!g){g={key,items:[]};grouped.push(g);}g.items.push(p);});
  const sections=grouped.map(g=>'<section class="timeline-month-group"><div class="timeline-month-heading"><span>'+monthLabel(g.key)+'</span><small>'+g.items.length+' proyecto'+(g.items.length===1?'':'s')+'</small></div>'+g.items.map(p=>{const image='<span class="timeline-project-thumb" aria-hidden="true">⌂</span>';return '<button type="button" class="timeline-project-card" data-timeline-project="'+escapeHtml(p.id)+'">'+image+'<span><strong>'+escapeHtml(p.nombre)+'</strong><small>'+escapeHtml(p.estado)+' · '+escapeHtml(p.fecha)+'</small></span><b aria-hidden="true">›</b></button>';}).join('')+'</section>').join('');
  projectsBox.innerHTML='<div class="timeline-detail-description"><h3>Sobre esta etapa</h3><p>'+escapeHtml(fase==='ejecucion'?(projects.length?'Proyectos que ya iniciaron su ejecución. Se muestra el mes y año previsto de entrega.':'Aún no hay proyectos en ejecución.'):(event.detalle||event.summary))+'</p></div>'+(nextProject&&year>=currentYear?'<div class="timeline-next-hito"><span>PRÓXIMO HITO REGISTRADO</span><strong>'+escapeHtml(nextProject.nombre)+'</strong><small>'+escapeHtml(nextProject.fecha)+' · '+escapeHtml(nextProject.estado)+'</small></div>':'')+(projects.length?'<div><div class="timeline-projects-head"><h3>Proyectos relacionados</h3><button type="button" class="timeline-show-all" data-timeline-show-all>Ver todos en el mapa</button></div>'+sections+'</div>':'<div class="timeline-no-projects">No hay proyectos con fecha registrada en '+year+'.</div>');
  highlightYear(year);overlay.hidden=false;overlay.setAttribute('aria-hidden','false');document.body.classList.add('timeline-modal-open');requestAnimationFrame(()=>overlay.classList.add('is-open'));closeBtn.focus();
 }
 function moveYear(direction){const index=events.findIndex(item=>item.year===activeYear),target=events[index+direction];if(target)openYear(target.year);}
 function close(){overlay.classList.remove('is-open');overlay.setAttribute('aria-hidden','true');clearHighlight();window.setTimeout(()=>{overlay.hidden=true;document.body.classList.remove('timeline-modal-open');if(lastTimelineOpener?.isConnected)lastTimelineOpener.focus();},220);}
 prevYearBtn?.addEventListener('click',()=>moveYear(-1));nextYearBtn?.addEventListener('click',()=>moveYear(1));
 root.addEventListener('click',event=>{const button=event.target.closest('[data-timeline-year]');if(!button)return;const fb=event.target.closest('[data-fase]');if(button.dataset.fases&&!fb)return;lastTimelineOpener=fb||button;openYear(Number(button.dataset.timelineYear),fb?fb.dataset.fase:undefined);});
 projectsBox.addEventListener('click',event=>{if(event.target.closest('[data-timeline-show-all]')){close();return;}const button=event.target.closest('[data-timeline-project]');if(!button)return;const project=projectById(button.dataset.timelineProject);if(!project)return;close();window.setTimeout(()=>selectProject(project.id,{open:true}),230);});
 closeBtn.addEventListener('click',close);overlay.addEventListener('click',event=>{if(event.target===overlay)close();});document.addEventListener('keydown',event=>{if(overlay.hidden)return;if(event.key==='Escape')close();if(event.key==='ArrowLeft')moveYear(-1);if(event.key==='ArrowRight')moveYear(1);});
 const editor=$('#timelineEditor'),yearSelect=$('#timelineEditYear'),fields={title:$('#timelineEditTitle'),summary:$('#timelineEditSummary'),detalle:$('#timelineEditDetail'),foto:$('#timelineEditPhoto'),color:$('#timelineEditColor'),status:$('#timelineEditStatus')};
 const loadTimeline=()=>{try{const saved=JSON.parse(localStorage.getItem(TIMELINE_STORAGE_KEY)||'null');if(Array.isArray(saved)){const valid=new Set(events.map(x=>x.year));timelineConfig=events.map(base=>{const custom=saved.find(x=>Number(x.year)===base.year);return custom?{...base,...custom}:base;});events=timelineConfig;}}catch(_){events=timelineConfig;}};
 const fillEditor=()=>{const item=events.find(x=>x.year===Number(yearSelect?.value))||events[0];if(!item)return;Object.keys(fields).forEach(key=>{if(fields[key])fields[key].value=item[key]??(key==='color'?'#ff9700':key==='status'?'auto':'');});};
 const refresh=()=>{events=timelineConfig;renderPhotos();renderYearMetrics();if(yearSelect)fillEditor();};
 loadTimeline();events=timelineConfig;
 if(yearSelect){yearSelect.innerHTML=events.map(x=>'<option value="'+x.year+'">'+x.year+'</option>').join('');yearSelect.addEventListener('change',fillEditor);fillEditor();}
 $('#saveTimelineEdit')?.addEventListener('click',()=>{const item=events.find(x=>x.year===Number(yearSelect?.value));if(!item)return;item.title=fields.title.value.trim()||String(item.year);item.summary=fields.summary.value.trim();item.detalle=fields.detalle.value.trim();item.foto=fields.foto.value.trim();item.color=/^#[0-9a-f]{6}$/i.test(fields.color.value)?fields.color.value:'#ff9700';item.status=fields.status.value;timelineConfig=events.map(x=>({...x}));if(!persistLocal(TIMELINE_STORAGE_KEY,JSON.stringify(timelineConfig)))return;refresh();recordChange('Línea de tiempo personalizada','Se actualizaron los datos visuales de '+item.year+'.');showToast('Etapa '+item.year+' actualizada.');});
 $('#resetTimelineEdit')?.addEventListener('click',()=>{if(!window.confirm('¿Restaurar los textos, colores y fotografías originales de la línea de tiempo?'))return;removeLocal(TIMELINE_STORAGE_KEY);timelineConfig=cloneTimeline();events=timelineConfig;refresh();recordChange('Línea de tiempo restablecida','Se restauró la configuración original de las etapas.');showToast('Línea de tiempo restaurada.');});
 window.PlazaMayorTimeline={refresh};
 refresh();window.addEventListener('plaza:datachange',()=>{renderPhotos();renderYearMetrics();});
}

function initUpdateDate(){const target=$('#updateDate');if(!target)return;const fixed=typeof FECHA_ACTUALIZACION==='string'&&FECHA_ACTUALIZACION.trim(),current=target.textContent.trim();target.textContent=fixed||(current&&current!=='--/--/----'?current:'06/11/2026');}
function initSwipeClose(){els.infoPanel.addEventListener('touchstart',e=>{state.touchStartY=e.touches[0].clientY;},{passive:true});els.infoPanel.addEventListener('touchend',e=>{if(state.touchStartY==null)return;if(e.changedTouches[0].clientY-state.touchStartY>90)closePanel();state.touchStartY=null;},{passive:true});}
els.panelClose?.addEventListener('click',()=>closePanel());els.themeToggle?.addEventListener('click',toggleTheme);els.editToggle?.addEventListener('click',()=>toggleEdit());els.editClose?.addEventListener('click',()=>toggleEdit(false));
els.pavilionSelect?.addEventListener('change',()=>{if(!state.selectedId)return;const p=projectById(state.selectedId);if(p){const previous=p.pabellon||'sin',next=els.pavilionSelect.value;if(previous===next)return;p.pabellon=next;recordChange('Pabellón actualizado',p.nombre+': '+(COLORES_PABELLON[previous]?.nombre||previous)+' → '+(COLORES_PABELLON[next]?.nombre||next));renderAll();persistEdits();}});els.saveProjectEdits?.addEventListener('click',saveProjectEditor);els.cancelProjectEdits?.addEventListener('click',()=>{if(state.selectedId){const p=projectById(state.selectedId);if(p)openProjectEditor(p);}});
els.copyData?.addEventListener('click',copyData);els.downloadData?.addEventListener('click',downloadJSON);els.importData?.addEventListener('click',()=>els.importFile?.click());els.importFile?.addEventListener('change',e=>importBackup(e.target.files?.[0]));els.resetData?.addEventListener('click',resetEdits);els.presentToggle?.addEventListener('click',()=>state.presentation?presentationStop():presentationStart());document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&state.presentation)presentationStop();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.presentation){presentationStop();return;}if(e.key==='Escape'&&state.panelOpen){closePanel();return;}if(state.presentation){presentationKey(e.key);return;}});
window.addEventListener('resize',()=>{if(state.panelOpen&&state.selectedId)applyCamera(cameraForPoint(projectById(state.selectedId)));});
document.body.classList.toggle('edit-enabled',EDIT_ALLOWED);(function(){const b=document.getElementById('editorAccess');if(!b)return;const paint=()=>{b.textContent=EDIT_ALLOWED?'✕ Salir del editor':'✎ Editor';b.setAttribute('aria-pressed',String(EDIT_ALLOWED));};paint();b.addEventListener('click',()=>{if(EDIT_ALLOWED){if(state.editing)toggleEdit(false);EDIT_ALLOWED=false;try{localStorage.removeItem(EDITOR_KEY);}catch(_){}document.body.classList.remove('edit-enabled');}else{EDIT_ALLOWED=true;try{localStorage.setItem(EDITOR_KEY,'1');}catch(_){}document.body.classList.add('edit-enabled');toggleEdit(true);}paint();});})();initTheme();restoreEditHistory();restoreEdits();restorePlaceEdits();updateBackupStatus();renderAll();initProjectFilters();initSwipeClose();initPriorityChart();initMiniCharts();initInteractiveTimeline();initUpdateDate();recordingMode();if(staleEdits){if(EDIT_ALLOWED)showToast('Los datos se actualizaron: ya ves la versión publicada (se conservaron tus textos de descripción, responsable y notas). Este aviso no se repite.',7000);persistEdits();}
})()