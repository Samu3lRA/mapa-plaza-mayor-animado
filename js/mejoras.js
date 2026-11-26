/* Funciones complementarias del mapa: búsqueda, filtros, indicadores, galería y reportes. */
(() => {
'use strict';
const $=s=>document.querySelector(s);
const fallbackProjects=typeof PROYECTOS!=='undefined'&&Array.isArray(PROYECTOS)?PROYECTOS:[];
const getProjects=()=>window.PlazaMayorData?.getProjects?.()||fallbackProjects;
const colors=typeof COLORES_PABELLON!=='undefined'?COLORES_PABELLON:{};

const safe=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
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
 function show(){const panel=$('#infoPanel');if(!photos.length){wrap.innerHTML='';wrap.hidden=true;if(panel)panel.classList.add('no-photo');if(controls)controls.hidden=true;return;}wrap.hidden=false;if(panel)panel.classList.remove('no-photo');
 const item=photos[index],src=typeof item==='string'?item:item.url;
 const pos=/^[0-9% .a-z-]{1,30}$/i.test(p.fotoPos||'')?' style="object-position:'+p.fotoPos+'"':'';
 wrap.innerHTML='<img class="panel-photo" src="'+safe(src||'')+'" alt="'+safe(p.nombre)+' · fotografía '+(index+1)+'"'+pos+' loading="lazy">';
 if(controls){controls.hidden=photos.length<2;counter.textContent=(index+1)+' / '+photos.length;}
 }
 show();
 const prev=$('#galleryPrev'),next=$('#galleryNext');
 if(prev)prev.onclick=()=>{if(!photos.length)return;index=(index-1+photos.length)%photos.length;show();};
 if(next)next.onclick=()=>{if(!photos.length)return;index=(index+1)%photos.length;show();};
}
function printReport(){
 const w=window.open('','_blank');if(!w){alert('Permite las ventanas emergentes para generar el informe.');return;}
 const rows=getProjects().map(p=>'<tr><td>'+safe(p.nombre)+'</td><td>'+safe(p.tipo==='general'?'Toda la infraestructura':(colors[p.pabellon]?.nombre||'Sin asignar'))+'</td><td>'+safe(p.estado)+'</td><td>'+safe(valorM(p.valor))+'</td><td>'+safe(p.fecha)+'</td></tr>').join('');
 w.document.write('<!doctype html><html lang="es"><meta charset="utf-8"><title>Informe de proyectos · Plaza Mayor</title><style>body{font:13px Arial;padding:30px;color:#172b45}h1{color:#003e99}table{width:100%;border-collapse:collapse;margin-top:22px}th,td{padding:10px;text-align:left;border-bottom:1px solid #dce4ee}th{background:#edf3fa;color:#003e99}@media print{body{padding:0}}</style><h1>Plaza Mayor · Informe de proyectos</h1><p>'+getProjects().length+' proyectos registrados</p><table><thead><tr><th>Proyecto</th><th>Ubicación</th><th>Estado</th><th>Valor</th><th>Fecha</th></tr></thead><tbody>'+rows+'</tbody></table><script>window.onload=()=>window.print()</script></html>');
 w.document.close();
}
function printProject(p){
 const w=window.open('','_blank');if(!w){alert('Permite las ventanas emergentes para generar la ficha.');return;}
 const location=p.tipo==='general'?'Toda la infraestructura':(p.pabellon==='convenciones'?'Convenciones':(colors[p.pabellon]?.nombre||'Sin asignar'));
 w.document.write('<!doctype html><html lang="es"><meta charset="utf-8"><title>Ficha · '+safe(p.nombre)+'</title><style>body{font:15px Arial;padding:38px;color:#172b45;max-width:850px;margin:auto}h1{color:#003e99}h2{font-size:16px;color:#003e99;margin-top:28px}.meta{padding:14px;background:#eef3fa;border-radius:10px;line-height:1.8}.tag{display:inline-block;padding:7px 12px;background:#fff0d9;border-radius:20px}li{margin:7px 0}@media print{button{display:none}}</style><h1>'+safe(p.nombre)+'</h1><p class="tag">'+safe(p.estado)+'</p><div class="meta"><b>Valor:</b> '+safe(valorM(p.valor))+'<br><b>Fecha:</b> '+safe(p.fecha)+'<br><b>Ubicación:</b> '+safe(location)+'<br><b>Responsable:</b> '+safe(p.responsable||'Por definir')+'</div><h2>Descripción</h2><p>'+safe(p.descripcion||'Sin descripción registrada')+'</p><h2>Alcance</h2><ul>'+(p.alcance||[]).map(x=>'<li>'+safe(x)+'</li>').join('')+'</ul><h2>Notas</h2><p>'+safe(p.notas||'Sin notas registradas')+'</p><script>window.onload=()=>window.print()</script></html>');
 w.document.close();
}
function bind(){
 $('#printReport')?.addEventListener('click',printReport);
 $('#focusMode')?.addEventListener('click',e=>{const active=document.body.classList.toggle('focus-mode');e.currentTarget.setAttribute('aria-pressed',String(active));e.currentTarget.setAttribute('aria-label',active?'Desactivar modo de enfoque':'Activar modo de enfoque');});
 window.addEventListener('plaza:panelrender',e=>{const p=e.detail&&e.detail.project;if(!p)return;gallery(p);comparison(p);chronology(p);history(p);const btn=$('#printProject');if(btn)btn.onclick=()=>printProject(p);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();