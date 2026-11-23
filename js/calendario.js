/* Calendario del plan: muestra en qué día (o mes) termina, terminó o se planeó cada proyecto.
   Lee la fecha de cada proyecto (campo "fecha" de datos.js o del modo edición).
   - "15 enero 2027" o "15 de enero de 2027"  -> se pinta ese día.
   - "enero 2027" (sin día)                    -> se marca el mes y se lista abajo "sin día definido".
   Color: verde = terminado, naranja = planeado / se piensa terminar. */
(function(){
  const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const DIAS=['L','M','M','J','V','S','D'];
  const HECHO=/ejecutad|terminad|finalizad|entregad|cerrad/i;
  const quitaTildes=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function parseFecha(txt){
    const t=quitaTildes(txt);
    const mes=MESES.findIndex(m=>quitaTildes(m)&&t.includes(quitaTildes(m)));
    const y=(t.match(/20\d{2}/)||[])[0];
    if(mes<0||!y)return null;
    let d=null;
    const m=t.match(/(?:^|\D)(\d{1,2})(?=\s*(?:de\s+)?[a-z])/);
    if(m){const n=+m[1];if(n>=1&&n<=31)d=n;}
    const iso=t.match(/^(20\d{2})-(\d{2})-(\d{2})$/);
    if(iso)return {y:+iso[1],m:+iso[2]-1,d:+iso[3]};
    return {y:+y,m:mes,d};
  }
  const hoy=()=>{const n=new Date();return {y:n.getFullYear(),m:n.getMonth(),d:n.getDate()}};

  function items(){
    const list=(window.PlazaMayorData&&PlazaMayorData.getProjects())||[];
    return list.map(p=>{const f=parseFecha(p.fecha);return f?{p,f,hecho:HECHO.test(p.estado||'')}:null}).filter(Boolean);
  }

  let root=null,cur=null,filtro='todos';

  function build(){
    const anchor=document.getElementById('historiaInversion');
    if(!anchor||root)return;
    root=document.createElement('section');
    root.className='plan-calendar';root.id='planCalendar';
    root.setAttribute('aria-label','Calendario de fechas de los proyectos');
    anchor.insertAdjacentElement('afterend',root);
    root.addEventListener('click',e=>{
      const nav=e.target.closest('[data-cal-nav]');
      if(nav){move(+nav.dataset.calNav);return;}
      const mes=e.target.closest('[data-cal-mes]');
      if(mes){const [y,m]=mes.dataset.calMes.split('-').map(Number);cur={y,m};render();return;}
      const pr=e.target.closest('[data-cal-id]');
      if(pr){abrir(pr.dataset.calId);}
    });
    root.addEventListener('change',e=>{if(e.target.id==='calFiltro'){filtro=e.target.value;render();}});
  }
  function move(delta){const d=new Date(cur.y,cur.m+delta,1);cur={y:d.getFullYear(),m:d.getMonth()};render();}
  function abrir(id){
    const mk=document.querySelector('.map-point[data-id="'+CSS.escape(id)+'"]');
    if(mk){mk.click();document.getElementById('mapViewport')?.scrollIntoView({behavior:'smooth',block:'center'});}
  }

  function render(){
    if(!root)return;
    const todos=items();
    const vis=filtro==='todos'?todos:todos.filter(i=>i.p.id===filtro);
    if(!cur){
      const h=hoy(),fut=vis.filter(i=>i.f.y*12+i.f.m>=h.y*12+h.m).sort((a,b)=>(a.f.y*12+a.f.m)-(b.f.y*12+b.f.m))[0];
      const base=fut||vis[0];cur=base?{y:base.f.y,m:base.f.m}:{y:h.y,m:h.m};
    }
    const {y,m}=cur,h=hoy();
    const delMes=vis.filter(i=>i.f.y===y&&i.f.m===m);
    const porDia={};delMes.filter(i=>i.f.d).forEach(i=>(porDia[i.f.d]=porDia[i.f.d]||[]).push(i));
    const sinDia=delMes.filter(i=>!i.f.d);
    // meses con proyectos
    const cuenta={};vis.forEach(i=>{const k=i.f.y+'-'+i.f.m;cuenta[k]=(cuenta[k]||0)+1;});
    const claves=Object.keys(cuenta).sort((a,b)=>{const[ay,am]=a.split('-').map(Number),[by,bm]=b.split('-').map(Number);return ay*12+am-(by*12+bm)});
    const chips=claves.map(k=>{const[cy,cm]=k.split('-').map(Number);const on=cy===y&&cm===m;
      return `<button type="button" class="cal-chip${on?' is-on':''}" data-cal-mes="${cy}-${cm}" aria-pressed="${on}">${MESES[cm].slice(0,3)} ${String(cy).slice(2)}<b>${cuenta[k]}</b></button>`}).join('');
    // cuadrícula
    const primero=new Date(y,m,1),offset=(primero.getDay()+6)%7,total=new Date(y,m+1,0).getDate();
    let celdas='';
    for(let i=0;i<offset;i++)celdas+='<span class="cal-day is-empty" aria-hidden="true"></span>';
    for(let d=1;d<=total;d++){
      const lst=porDia[d]||[],esHoy=h.y===y&&h.m===m&&h.d===d;
      const cls=lst.length?(lst.every(i=>i.hecho)?' is-done':' is-plan'):'';
      const tip=lst.map(i=>i.p.nombre).join(', ');
      celdas+=lst.length
        ?`<button type="button" class="cal-day${cls}${esHoy?' is-today':''}" data-cal-id="${esc(lst[0].p.id)}" title="${esc(tip)}" aria-label="${d} de ${MESES[m]}: ${esc(tip)}">${d}${lst.length>1?`<sup>${lst.length}</sup>`:''}</button>`
        :`<span class="cal-day${esHoy?' is-today':''}">${d}</span>`;
    }
    const fila=i=>`<li><button type="button" class="cal-item ${i.hecho?'is-done':'is-plan'}" data-cal-id="${esc(i.p.id)}"><i></i><span><strong>${esc(i.p.nombre)}</strong><small>${esc(i.p.fecha)} · ${esc(i.p.estado||'')}</small></span></button></li>`;
    const conDia=Object.keys(porDia).map(Number).sort((a,b)=>a-b).flatMap(d=>porDia[d]);
    const opts='<option value="todos">Todos los proyectos</option>'+(((window.PlazaMayorData&&PlazaMayorData.getProjects())||[]).map(p=>`<option value="${esc(p.id)}"${p.id===filtro?' selected':''}>${esc(p.nombre)}</option>`).join(''));
    root.innerHTML=`
      <div class="cal-head"><div><p class="eyebrow">CALENDARIO DEL PLAN</p><h2>Fechas de los proyectos</h2></div>
        <label class="cal-filter"><span>Ver</span><select id="calFiltro" aria-label="Filtrar proyecto">${opts}</select></label></div>
      <div class="cal-chips" role="group" aria-label="Meses con proyectos">${chips||'<span class="cal-none">Sin fechas</span>'}</div>
      <div class="cal-body">
        <div class="cal-month">
          <div class="cal-bar"><button type="button" data-cal-nav="-1" aria-label="Mes anterior">←</button><strong>${MESES[m]} ${y}</strong><button type="button" data-cal-nav="1" aria-label="Mes siguiente">→</button></div>
          <div class="cal-grid" role="grid"><div class="cal-dow">${DIAS.map(x=>`<span>${x}</span>`).join('')}</div><div class="cal-days">${celdas}</div></div>
          <ul class="cal-legend"><li><i class="is-plan"></i>Planeado / se piensa terminar</li><li><i class="is-done"></i>Terminado</li><li><i class="is-today"></i>Hoy</li></ul>
        </div>
        <div class="cal-list">
          <h3>${delMes.length?`${delMes.length} proyecto${delMes.length>1?'s':''} en ${MESES[m]}`:`Sin proyectos en ${MESES[m]}`}</h3>
          ${conDia.length?`<ul>${conDia.map(fila).join('')}</ul>`:''}
          ${sinDia.length?`<p class="cal-sub">Mes definido, día sin definir</p><ul>${sinDia.map(fila).join('')}</ul>`:''}
          <p class="cal-hint">Para pintar un día exacto, escribe la fecha con día, por ejemplo <em>15 enero 2027</em>.</p>
        </div>
      </div>`;
  }

  function init(){build();render();}
  window.addEventListener('plaza:datachange',render);
  window.addEventListener('plaza:panelrender',()=>{});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
