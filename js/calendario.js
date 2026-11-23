/* Calendario por año: dentro del detalle de cada año de la línea de tiempo (2024, 2025, 2026, 2027)
   se dibuja el calendario de ese año con los 12 meses.
   Lee la fecha de cada proyecto (campo "fecha" de datos.js o del modo edición):
   - "15 enero 2027" o "15 de enero de 2027" -> se pinta ese día.
   - "enero 2027" (sin día)                   -> el mes muestra "N sin día" y el proyecto se lista abajo.
   Color: naranja = planeado / se piensa terminar, verde = terminado. */
(function(){
  const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const DIAS=['L','M','M','J','V','S','D'];
  const HECHO=/ejecutad|terminad|finalizad|entregad|cerrad/i;
  const sinTildes=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function parseFecha(txt){
    const t=sinTildes(txt);
    const iso=t.match(/^(20\d{2})-(\d{2})-(\d{2})$/);
    if(iso)return {y:+iso[1],m:+iso[2]-1,d:+iso[3]};
    const m=MESES.findIndex(x=>t.includes(x));
    const y=(t.match(/20\d{2}/)||[])[0];
    if(m<0||!y)return null;
    const dm=t.match(/(?:^|\D)(\d{1,2})(?=\s*(?:de\s+)?[a-z])/);
    const d=dm&&+dm[1]>=1&&+dm[1]<=31?+dm[1]:null;
    return {y:+y,m,d};
  }
  function delAnio(year){
    const list=(window.PlazaMayorData&&PlazaMayorData.getProjects())||[];
    return list.map(p=>{const f=parseFecha(p.fecha);return f&&f.y===year?{p,f,hecho:HECHO.test(p.estado||'')}:null}).filter(Boolean);
  }

  function mes(year,m,lst,hoy){
    const por={},sin=lst.filter(i=>i.f.m===m&&!i.f.d);
    lst.filter(i=>i.f.m===m&&i.f.d).forEach(i=>(por[i.f.d]=por[i.f.d]||[]).push(i));
    const offset=(new Date(year,m,1).getDay()+6)%7,total=new Date(year,m+1,0).getDate();
    let c='';
    for(let i=0;i<offset;i++)c+='<span class="cal-day is-empty" aria-hidden="true"></span>';
    for(let d=1;d<=total;d++){
      const l=por[d]||[],esHoy=hoy.getFullYear()===year&&hoy.getMonth()===m&&hoy.getDate()===d;
      if(l.length){
        const tip=l.map(i=>i.p.nombre).join(', ');
        c+=`<button type="button" class="cal-day ${l.every(i=>i.hecho)?'is-done':'is-plan'}${esHoy?' is-today':''}" data-cal-id="${esc(l[0].p.id)}" title="${esc(tip)}" aria-label="${d} de ${MESES[m]}: ${esc(tip)}">${d}${l.length>1?`<sup>${l.length}</sup>`:''}</button>`;
      }else c+=`<span class="cal-day${esHoy?' is-today':''}">${d}</span>`;
    }
    return `<div class="cal-month${sin.length?' has-sin':''}"><div class="cal-mhead"><strong>${MESES[m]}</strong>${sin.length?`<span class="cal-sin" title="${esc(sin.map(i=>i.p.nombre).join(', '))}">${sin.length} sin día</span>`:''}</div>
      <div class="cal-dow">${DIAS.map(x=>`<span>${x}</span>`).join('')}</div><div class="cal-days">${c}</div></div>`;
  }

  function render(year){
    const box=document.getElementById('timelineDetailCalendar');
    if(!box||!year)return;
    box.dataset.year=year;
    const lst=delAnio(year),hoy=new Date();
    const sin=lst.filter(i=>!i.f.d).sort((a,b)=>a.f.m-b.f.m);
    box.innerHTML=`<h3>Calendario ${year}</h3>
      <div class="cal-year">${MESES.map((_,m)=>mes(year,m,lst,hoy)).join('')}</div>
      <ul class="cal-legend"><li><i class="is-plan"></i>Planeado / se piensa terminar</li><li><i class="is-done"></i>Terminado</li><li><i class="is-today"></i>Hoy</li></ul>
      ${sin.length?`<p class="cal-sub">Mes definido, día sin definir</p><ul class="cal-list">${sin.map(i=>`<li><button type="button" class="cal-item ${i.hecho?'is-done':'is-plan'}" data-cal-id="${esc(i.p.id)}"><i></i><span><strong>${esc(i.p.nombre)}</strong><small>${esc(i.p.fecha)} · ${esc(i.p.estado||'')}</small></span></button></li>`).join('')}</ul>`:''}
      ${lst.length?'':'<p class="cal-hint">No hay proyectos con fecha en este año.</p>'}
      <p class="cal-hint">Para pintar un día exacto, escribe la fecha con día, por ejemplo <em>15 enero ${year}</em>.</p>`;
  }

  function abrir(id){
    document.getElementById('timelineDetailClose')?.click();
    setTimeout(()=>{
      const mk=document.querySelector('.map-point[data-id="'+CSS.escape(id)+'"]');
      if(mk){mk.click();document.getElementById('mapViewport')?.scrollIntoView({behavior:'smooth',block:'center'});}
    },60);
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('#timelineDetailCalendar [data-cal-id]');
    if(b)abrir(b.dataset.calId);
  });
  window.addEventListener('plaza:yearopen',e=>render(e.detail&&e.detail.year));
  window.addEventListener('plaza:datachange',()=>{
    const box=document.getElementById('timelineDetailCalendar');
    if(box&&box.dataset.year)render(+box.dataset.year);
  });

  /* Hoja de ruta: todos los proyectos ubicados en el mes de su fecha (debajo de la línea de tiempo). */
  const ESTRUCT=/estruct/i;
  function renderRuta(){
    const box=document.getElementById('tlRoad');if(!box)return;
    const list=((window.PlazaMayorData&&PlazaMayorData.getProjects())||[]).map(p=>{const f=parseFecha(p.fecha);return f?{p,f}:null}).filter(Boolean);
    if(!list.length){box.innerHTML='';return;}
    const idx=f=>f.y*12+f.m;
    list.sort((a,b)=>idx(a.f)-idx(b.f)||(a.f.d||16)-(b.f.d||16)||a.p.nombre.localeCompare(b.p.nombre,'es'));
    const min=Math.min(...list.map(i=>idx(i.f))),max=Math.max(...list.map(i=>idx(i.f))),n=max-min+1;
    const hoy=new Date(),pos=(f)=>{const dias=new Date(f.y,f.m+1,0).getDate();return ((idx(f)-min)+((f.d||Math.round(dias/2))-0.5)/dias)/n*100;};
    const hoyIdx=hoy.getFullYear()*12+hoy.getMonth(),hoyPct=hoyIdx>=min&&hoyIdx<=max?((hoyIdx-min)+(hoy.getDate()-0.5)/new Date(hoy.getFullYear(),hoy.getMonth()+1,0).getDate())/n*100:null;
    let cab='',y0=null;
    for(let k=0;k<n;k++){const t=min+k,y=Math.floor(t/12),m=t%12;cab+='<span class="road-m'+(y!==y0?' is-year':'')+'">'+MESES[m].slice(0,3)+(y!==y0?'<em>'+y+'</em>':'')+'</span>';y0=y;}
    const filas=list.map(({p,f})=>{
      const est=ESTRUCT.test(p.estado||'');
      return '<button type="button" class="road-row" data-cal-id="'+esc(p.id)+'" title="'+esc(p.nombre+' · '+p.fecha+' · '+(p.estado||''))+'">'
        +'<span class="road-name">'+esc(p.nombre)+'</span>'
        +'<span class="road-track"><i class="road-dot'+(est?' is-est':'')+(HECHO.test(p.estado||'')?' is-done':'')+'" style="left:'+pos(f).toFixed(2)+'%"></i><span class="road-when" style="left:'+pos(f).toFixed(2)+'%">'+esc(p.fecha)+'</span></span></button>';
    }).join('');
    box.innerHTML='<div class="road-head"><h3>Fechas previstas por proyecto</h3><ul class="road-legend"><li><i class="road-dot"></i>Contratado</li><li><i class="road-dot is-est"></i>En estructuración</li><li><i class="road-dot is-done"></i>Terminado</li></ul></div>'
      +'<p class="road-note"><span><b>Contratado:</b> el proyecto ya tiene contrato adjudicado.</span><span><b>En estructuración:</b> se preparan los estudios y el proceso para contratar.</span></p>'
      +'<div class="road-grid" style="--n:'+n+'"><div class="road-axis"><span class="road-name"></span><span class="road-months">'+cab+'</span></div>'
      +'<div class="road-rows">'+filas+(hoyPct!=null?'<span class="road-today" style="left:calc(var(--road-label) + (100% - var(--road-label)) * '+(hoyPct/100).toFixed(4)+')"><b>Hoy</b></span>':'')+'</div></div>';
  }
  document.addEventListener('click',e=>{const b=e.target.closest('#tlRoad [data-cal-id]');if(b)abrir(b.dataset.calId);});
  window.addEventListener('plaza:datachange',renderRuta);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderRuta);else renderRuta();
  window.PlazaMayorCalendar={render};
})();
