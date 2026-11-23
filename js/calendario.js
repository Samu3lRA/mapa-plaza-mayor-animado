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
  window.PlazaMayorCalendar={render};
})();
