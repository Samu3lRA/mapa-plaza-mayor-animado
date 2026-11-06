/* Funciones complementarias del mapa: búsqueda, filtros, indicadores, galería y reportes. */
(() => {
'use strict';
const $=s=>document.querySelector(s);
const projects=Array.isArray(window.PROYECTOS)?window.PROYECTOS:[];
const colors=window.COLORES_PABELLON||{};
const search=$('#projectSearch'),status=$('#statusFilter'),pavilion=$('#pavilionFilter');
const pointLayer=$('#pointsLayer'),metricGrid=$('#metricGrid');
const safe=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const all=()=>projects;
function filter(){
 const q=(search?.value||'').trim().toLocaleLowerCase('es'),st=status?.value||'',pv=pavilion?.value||'';
 let count=0;
 document.querySelectorAll('.map-point,.project-list-item').forEach(el=>{
   const p=projects.find(x=>x.id===el.dataset.id);if(!p)return;
   const hay=[p.nombre,p.responsable,p.descripcion,p.notas,p.fecha,p.estado].join(' ').toLocaleLowerCase('es');
   const ok=(!q||hay.includes(q))&&(!st||p.estado===st)&&(!pv||(pv==='general'?p.tipo==='general':p.tipo==='especifico'&&(p.pabellon||'sin')===pv));
   if(el.classList.contains('map-point')){el.classList.toggle('is-filtered-out',!ok);el.disabled=!ok;}
   else el.hidden=!ok;
   if(el.classList.contains('map-point')&&ok)count++;
 });
 const label=$('#mapProjectCount');if(label)label.textContent='▥ '+count+' de '+projects.length+' proyectos';
}
function bars(node,rows,total){
 if(!node)return;
 node.innerHTML=rows.map(r=>'<div class="breakdown-row"><span>'+safe(r.label)+'</span><div class="mini-track"><i style="width:'+(total?100*r.count/total:0)+'%;--bar-color:'+r.color+'"></i></div><strong>'+r.count+'</strong></div>').join('');
}
function dashboard(){
 const n=projects.length,by=s=>projects.filter(p=>p.estado===s).length;
 const metrics=[['Proyectos registrados',n],['Contratados',by('Contratado')],['En estructuración',by('Estructuración')],['En ejecución',by('En ejecución')],['Finalizados',by('Finalizado')]];
 if(metricGrid)metricGrid.innerHTML=metrics.map(m=>'<article class="metric-card"><span>'+m[0]+'</span><strong>'+m[1]+'</strong></article>').join('');
 const keys=['amarillo','rojo','verde','azul','blanco','sin'];
 bars($('#pavilionBreakdown'),keys.map(k=>({label:colors[k]?.nombre||k,count:projects.filter(p=>p.tipo==='especifico'&&(p.pabellon||'sin')===k).length,color:colors[k]?.fondo||'#8B93A0'})).concat([{label:'General',count:projects.filter(p=>p.tipo==='general').length,color:colors.general?.fondo||'#7B3FC6'}]),n);
 bars($('#statusBreakdown'),['Contratado','Estructuración','En ejecución','Finalizado'].map((s,i)=>({label:s,count:by(s),color:['#2F9E50','#ff9700','#1D5FD6','#7B3FC6'][i]})),n);
}
function chronology(p){
 const root=$('#projectTimeline'),block=$('#timelineBlock');if(!root||!block)return;
 const steps=[['Estructuración',/estructur/i.test(p.estado||'')||/contratado|ejecución|finalizado/i.test(p.estado||'')],['Contratación',/contratado|ejecución|finalizado/i.test(p.estado||'')],['Ejecución',/ejecución|finalizado/i.test(p.estado||'')],['Finalización',/finalizado/i.test(p.estado||'')]];
 root.innerHTML=steps.map(([label,done])=>'<div class="timeline-step '+(done?'is-done':'')+'"><i></i><span>'+label+'</span></div>').join('')+'<p class="timeline-date">Fecha registrada: '+safe(p.fecha||'Por definir')+'</p>';
}
function gallery(p){
 const wrap=$('#panelPhotoWrap'),controls=$('#galleryControls'),counter=$('#galleryCounter');if(!wrap)return;
 const photos=p.fotos||[];let index=0;
 function show(){if(!photos.length){wrap.innerHTML='<div class="photo-pending">Fotografía pendiente de cargar</div>';if(controls)controls.hidden=true;return;}
 const item=photos[index],src=typeof item==='string'?item:item.url;
 wrap.innerHTML='<img class="panel-photo" src="'+safe(src||'')+'" alt="'+safe(p.nombre)+' · fotografía '+(index+1)+'" loading="lazy">';
 if(controls){controls.hidden=photos.length<2;counter.textContent=(index+1)+' / '+photos.length;}
 }
 show();
 const prev=$('#galleryPrev'),next=$('#galleryNext');
 if(prev)prev.onclick=()=>{if(!photos.length)return;index=(index-1+photos.length)%photos.length;show();};
 if(next)next.onclick=()=>{if(!photos.length)return;index=(index+1)%photos.length;show();};
}
function printProject(p){
 const w=window.open('','_blank');if(!w){alert('Permite las ventanas emergentes para generar la ficha.');return;}
 const location=p.tipo==='general'?'Todo el complejo':(colors[p.pabellon]?.nombre||'Sin asignar');
 w.document.write('<!doctype html><html lang="es"><meta charset="utf-8"><title>Ficha · '+safe(p.nombre)+'</title><style>body{font:15px Arial;padding:38px;color:#172b45;max-width:850px;margin:auto}h1{color:#003e99}h2{font-size:16px;color:#003e99;margin-top:28px}.meta{padding:14px;background:#eef3fa;border-radius:10px;line-height:1.8}.tag{display:inline-block;padding:7px 12px;background:#fff0d9;border-radius:20px}li{margin:7px 0}@media print{button{display:none}}</style><h1>'+safe(p.nombre)+'</h1><p class="tag">'+safe(p.estado)+'</p><div class="meta"><b>Valor:</b> '+safe(p.valor)+'<br><b>Fecha:</b> '+safe(p.fecha)+'<br><b>Ubicación:</b> '+safe(location)+'<br><b>Responsable:</b> '+safe(p.responsable||'Por definir')+'</div><h2>Descripción</h2><p>'+safe(p.descripcion||'Sin descripción registrada')+'</p><h2>Alcance</h2><ul>'+(p.alcance||[]).map(x=>'<li>'+safe(x)+'</li>').join('')+'</ul><h2>Notas</h2><p>'+safe(p.notas||'Sin notas registradas')+'</p><script>window.onload=()=>window.print()<\\/script></html>');
 w.document.close();
}
function bind(){
 [search,status,pavilion].forEach(el=>el?.addEventListener(el===search?'input':'change',filter));
 $('#clearFilters')?.addEventListener('click',()=>{search.value='';status.value='';pavilion.value='';filter();});
 $('#dashboardToggle')?.addEventListener('click',e=>{const content=$('#dashboardContent'),hide=!content.hidden;content.hidden=hide;e.currentTarget.textContent=hide?'Mostrar indicadores':'Ocultar indicadores';e.currentTarget.setAttribute('aria-expanded',String(!hide));});
 $('#focusMode')?.addEventListener('click',e=>{const active=document.body.classList.toggle('focus-mode');e.currentTarget.setAttribute('aria-pressed',String(active));e.currentTarget.setAttribute('aria-label',active?'Desactivar modo de enfoque':'Activar modo de enfoque');});
 pointLayer?.addEventListener('click',e=>{const point=e.target.closest('.map-point');if(!point)return;const p=projects.find(x=>x.id===point.dataset.id);if(!p)return;setTimeout(()=>{gallery(p);chronology(p);const btn=$('#printProject');if(btn)btn.onclick=()=>printProject(p);},30);});
 document.querySelectorAll('.project-list-item').forEach(el=>el.addEventListener('click',()=>{const p=projects.find(x=>x.id===el.dataset.id);if(p)setTimeout(()=>{gallery(p);chronology(p);const btn=$('#printProject');if(btn)btn.onclick=()=>printProject(p);},30);}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{dashboard();bind();filter();});else{dashboard();bind();filter();}
})();