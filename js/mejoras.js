/* Funciones complementarias del mapa: búsqueda, filtros, indicadores, galería y reportes. */
(() => {
'use strict';
const $=s=>document.querySelector(s);
const projects=typeof PROYECTOS!=='undefined'&&Array.isArray(PROYECTOS)?PROYECTOS:[];
const colors=typeof COLORES_PABELLON!=='undefined'?COLORES_PABELLON:{};
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
function comparison(p){
 const block=$('#comparisonBlock'),root=$('#comparisonImages');if(!block||!root)return;
 const before=p.fotoAntes||p.antes,after=p.fotoDespues||p.despues;
 block.hidden=!(before||after);
 if(block.hidden)return;
 root.innerHTML='<div class="comparison-grid">'+[['Antes',before],['Después',after]].map(([label,src])=>'<figure><figcaption>'+label+'</figcaption>'+(src?'<img src="'+safe(src)+'" alt="'+label+' · '+safe(p.nombre)+'">':'<div class="comparison-empty">Imagen pendiente</div>')+'</figure>').join('')+'</div>';
}
function history(p){
 const root=$('#projectHistory');if(!root)return;
 const entries=Array.isArray(p.historial)?p.historial:[];
 root.innerHTML=entries.length?entries.slice().reverse().map(x=>'<div class="history-entry"><strong>'+safe(x.fecha||'Fecha no registrada')+'</strong><span>'+safe(x.descripcion||x.estado||'Actualización')+'</span></div>').join(''):'<p class="history-empty">Aún no hay actualizaciones registradas para este proyecto.</p>';
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
function printReport(){
 const w=window.open('','_blank');if(!w){alert('Permite las ventanas emergentes para generar el informe.');return;}
 const rows=projects.map(p=>'<tr><td>'+safe(p.nombre)+'</td><td>'+safe(p.tipo==='general'?'General':(colors[p.pabellon]?.nombre||'Sin asignar'))+'</td><td>'+safe(p.estado)+'</td><td>'+safe(p.valor)+'</td><td>'+safe(p.fecha)+'</td></tr>').join('');
 w.document.write('<!doctype html><html lang="es"><meta charset="utf-8"><title>Informe de proyectos · Plaza Mayor</title><style>body{font:13px Arial;padding:30px;color:#172b45}h1{color:#003e99}table{width:100%;border-collapse:collapse;margin-top:22px}th,td{padding:10px;text-align:left;border-bottom:1px solid #dce4ee}th{background:#edf3fa;color:#003e99}@media print{body{padding:0}}</style><h1>Plaza Mayor · Informe de proyectos</h1><p>'+projects.length+' proyectos registrados</p><table><thead><tr><th>Proyecto</th><th>Ubicación</th><th>Estado</th><th>Valor</th><th>Fecha</th></tr></thead><tbody>'+rows+'</tbody></table><script>window.onload=()=>window.print()<\\/script></html>');
 w.document.close();
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
 $('#printReport')?.addEventListener('click',printReport);\n $('#dashboardToggle')?.addEventListener('click',e=>{const content=$('#dashboardContent'),hide=!content.hidden;content.hidden=hide;e.currentTarget.textContent=hide?'Mostrar indicadores':'Ocultar indicadores';e.currentTarget.setAttribute('aria-expanded',String(!hide));});
 $('#focusMode')?.addEventListener('click',e=>{const active=document.body.classList.toggle('focus-mode');e.currentTarget.setAttribute('aria-pressed',String(active));e.currentTarget.setAttribute('aria-label',active?'Desactivar modo de enfoque':'Activar modo de enfoque');});
 pointLayer?.addEventListener('click',e=>{const point=e.target.closest('.map-point');if(!point)return;const p=projects.find(x=>x.id===point.dataset.id);if(!p)return;setTimeout(()=>{gallery(p);comparison(p);chronology(p);history(p);const btn=$('#printProject');if(btn)btn.onclick=()=>printProject(p);},30);});
 document.querySelectorAll('.project-list-item').forEach(el=>el.addEventListener('click',()=>{const p=projects.find(x=>x.id===el.dataset.id);if(p)setTimeout(()=>{gallery(p);chronology(p);const btn=$('#printProject');if(btn)btn.onclick=()=>printProject(p);},30);}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{dashboard();bind();filter();});else{dashboard();bind();filter();}
})();