/* Resumen ejecutivo en PDF: botón "Descargar resumen" del encabezado.
   Arma un documento A4 (portada, indicadores, gráficas, línea de tiempo, calendario y tabla de proyectos)
   con los datos que muestra el tablero y abre el diálogo de impresión del navegador (Guardar como PDF). */
(function(){
  const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const low=s=>String(s||'').toLocaleLowerCase('es');
  const sinTildes=s=>low(s).normalize('NFD').replace(/[̀-ͯ]/g,'');
  const dinero=v=>Number(String(v||'').replace(/[^\d]/g,''))||0;
  const fmt=n=>n.toLocaleString('es-CO');
  const proyectos=()=>(window.PlazaMayorData&&PlazaMayorData.getProjects())||[];
  const anio=p=>{const m=String(p.fecha||'').match(/20\d{2}/);return m?+m[0]:null;};
  const mesDe=p=>{const t=sinTildes(p.fecha);return MESES.findIndex(m=>t.includes(m));};
  const ubicacion=p=>p.tipo==='general'?'Toda la infraestructura':((typeof COLORES_PABELLON!=='undefined'&&COLORES_PABELLON[p.pabellon]||{}).nombre||'Sin asignar');
  const abs=u=>{try{return new URL(u,location.href).href;}catch(_){return u;}};

  function donut(items,total,size){
    const r=size/2-9,c=2*Math.PI*r,sum=items.reduce((a,i)=>a+i.v,0)||1;let off=0;
    const arcs=items.map(i=>{const len=c*i.v/sum,s='<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+i.c+'" stroke-width="18" stroke-dasharray="'+len+' '+(c-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 '+size/2+' '+size/2+')"/>';off+=len;return s}).join('');
    return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'"><circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="#e6edf6" stroke-width="18"/>'+arcs+'<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="22" font-weight="800" fill="#0b2a55">'+esc(total)+'</text></svg>';
  }
  function graficas(){
    const out=[];
    const colP=['#ff9700','#42a5f5','#43c69b'];
    const pil=[...document.querySelectorAll('.priority-value')].map((l,i)=>({n:l.querySelector('span').textContent.trim(),v:Number(l.querySelector('input').value)||0,c:colP[i]||'#8b93a0'}));
    if(pil.length)out.push({t:'Pilares de la inversión',k:'DISTRIBUCIÓN',items:pil,total:(document.getElementById('priorityTotal')||{}).textContent||pil.reduce((a,i)=>a+i.v,0)+'%'});
    [['statusPieLegend','Proyectos por tipo','ALCANCE','statusChartTotal'],['typePieLegend','Proyectos por estado','ESTADO','typeChartTotal']].forEach(([id,t,k,tot])=>{
      const box=document.getElementById(id);if(!box)return;
      const it=[...box.querySelectorAll('.mini-pie-item')].map(row=>({n:row.children[1].textContent.trim(),v:Number(row.querySelector('input').value)||0,c:getComputedStyle(row.querySelector('i')).backgroundColor}));
      if(it.length)out.push({t,k,items:it,total:(document.getElementById(tot)||{}).textContent||'100%'});
    });
    return out;
  }

  function construir(){
    const ps=proyectos(),hoy=new Date();
    const con=ps.filter(p=>low(p.estado).includes('ejecuc')).length,est=ps.filter(p=>low(p.estado).includes('estruct')).length;
    const valor=ps.reduce((a,p)=>a+dinero(p.valor),0);
    const corte=(typeof FECHA_ACTUALIZACION!=='undefined'&&FECHA_ACTUALIZACION)||hoy.toLocaleDateString('es-CO');
    const logo=abs('./IMAGEN_MAPA/LOGO.png');
    const disc=(document.querySelector('.investment-disclaimer p')||{}).textContent||'';
    const kpis=[[ps.length,'Proyectos del plan','#7fb3ff'],[con,'En ejecución','#43c69b'],[est,'En estructuración','#ffb44a'],['$'+fmt(valor),'Valor registrado','#c9d6e8']]
      .map(k=>'<div class="kpi" style="border-top-color:'+k[2]+'"><b>'+esc(k[0])+'</b><small>'+esc(k[1])+'</small></div>').join('');
    const graf=graficas().map(g=>'<div class="chart"><p class="eb">'+esc(g.k)+'</p><h3>'+esc(g.t)+'</h3><div class="chart-row">'+donut(g.items,g.total,120)+'<ul>'+g.items.map(i=>'<li><i style="background:'+i.c+'"></i><span>'+esc(i.n)+'</span><b>'+esc(i.v)+'%</b></li>').join('')+'</ul></div></div>').join('');
    const anios=[...new Set(ps.map(anio).filter(Boolean))].sort();
    const base=anios.length?anios:[];
    const linea=base.map(y=>{const l=ps.filter(p=>anio(p)===y),c=l.filter(p=>low(p.estado).includes('ejecuc')).length,e=l.filter(p=>low(p.estado).includes('estruct')).length;
      const tag=y<hoy.getFullYear()?'Etapa concluida':y===hoy.getFullYear()?'En curso':'Proyectada';
      return '<div class="year"><span class="tag">'+tag+'</span><strong>'+y+'</strong><span>'+l.length+' proyectos</span><span>'+c+' en ejecución · '+e+' en estructuración</span></div>';}).join('');
    const meses={};ps.forEach(p=>{const y=anio(p),m=mesDe(p);if(!y||m<0)return;const k=y*12+m;(meses[k]=meses[k]||{y,m,l:[]}).l.push(p);});
    const cal=Object.keys(meses).map(Number).sort((a,b)=>a-b).map(k=>{const x=meses[k];
      return '<tr><td class="mes">'+MESES[x.m]+' '+x.y+'</td><td class="n">'+x.l.length+'</td><td>'+x.l.map(p=>esc(p.nombre)).join(' · ')+'</td></tr>';}).join('');
    const filas=ps.map((p,i)=>'<tr><td class="n">'+(i+1)+'</td><td><b>'+esc(p.nombre)+'</b></td><td>'+esc(ubicacion(p))+'</td><td>'+esc(p.estado)+'</td><td class="r">'+esc(p.valor)+'</td><td>'+esc(p.fecha)+'</td></tr>').join('');
    const css='@page{size:A4;margin:12mm}*{box-sizing:border-box}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;font:12px/1.45 Arial,Helvetica,sans-serif;color:#172b45}'
     +'.band{background:linear-gradient(110deg,#002f75,#003f9f);color:#fff;padding:18px 22px;border-radius:10px;display:flex;align-items:center;gap:18px;border-bottom:4px solid #ff9700}.band img{height:54px}.band h1{margin:0;font-size:22px;letter-spacing:.01em}.band p{margin:3px 0 0;font-size:11px;color:#c9d9f2}.band .corte{margin-left:auto;text-align:right;font-size:10px;color:#c9d9f2}.band .corte b{display:block;font-size:14px;color:#fff}'
     +'h2{break-after:avoid}h2.pb{break-before:page}h2{margin:20px 0 8px;font-size:13px;color:#003f9f;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #d5e0ee;padding-bottom:4px}'
     +'.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}.kpi{border:1px solid #d5e0ee;border-top:4px solid;border-radius:8px;padding:10px 12px;background:#f6f9fd}.kpi b{display:block;font-size:22px;color:#0b2a55}.kpi small{color:#5b6f88}'
     +'.charts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.chart{border:1px solid #d5e0ee;border-radius:8px;padding:10px;break-inside:avoid}.chart .eb{margin:0;font-size:9px;letter-spacing:.12em;color:#c26a00;font-weight:700}.chart h3{margin:2px 0 6px;font-size:12px}.chart-row{display:flex;flex-direction:column;align-items:center;gap:6px}.chart ul{list-style:none;margin:0;padding:0;width:100%}.chart li{display:flex;align-items:center;gap:6px;font-size:10px;padding:2px 0}.chart li i{width:8px;height:8px;border-radius:50%;flex:none}.chart li span{flex:1}.chart li b{font-size:11px}'
     +'.years{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.year{border:1px solid #d5e0ee;border-radius:8px;padding:10px;display:grid;gap:2px;font-size:10.5px;color:#4a5f7a;break-inside:avoid}.year strong{font-size:20px;color:#0b2a55}.tag{font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#c26a00}'
     +'table{width:100%;border-collapse:collapse}th{background:#003f9f;color:#fff;text-align:left;padding:6px 8px;font-size:10px;letter-spacing:.04em}td{padding:6px 8px;border-bottom:1px solid #e1e9f3;vertical-align:top}tr{break-inside:avoid}tbody tr:nth-child(even){background:#f6f9fd}td.n{width:28px;color:#6b7e96;text-align:center}td.r{text-align:right;white-space:nowrap}td.mes{text-transform:capitalize;white-space:nowrap;width:110px;font-weight:700}'
     +'.nota{margin:0 0 6px;font-size:10px;color:#4a5f7a}.disc{margin-top:18px;padding:9px 12px;border-left:3px solid #ff9700;background:#f6f9fd;font-size:9.5px;color:#5b6f88}.pie{margin-top:10px;font-size:9px;color:#8a9ab0;text-align:right}';
    const body='<div class="band"><img src="'+esc(logo)+'" alt="Plaza Mayor Medellín"><div><h1>Plan de inversión · Resumen ejecutivo</h1><p>Tablero de seguimiento de proyectos</p></div><div class="corte">Fecha de actualización<b>'+esc(corte)+'</b></div></div>'
     +'<div class="kpis">'+kpis+'</div>'
     +'<h2>Indicadores de inversión</h2><div class="charts">'+graf+'</div>'
     +(linea?'<h2>Línea de tiempo</h2><div class="years">'+linea+'</div>':'')
     +(cal?'<h2>Calendario de fechas</h2><table><thead><tr><th>Mes</th><th>N.º</th><th>Proyectos</th></tr></thead><tbody>'+cal+'</tbody></table>':'')
     +'<p class="nota"><b>En ejecución:</b> el contrato ya fue adjudicado y el proyecto está en marcha. <b>En estructuración:</b> se preparan los estudios y el proceso para contratar.</p>'
     +'<h2 class="pb">Proyectos</h2><table><thead><tr><th>#</th><th>Proyecto</th><th>Ubicación</th><th>Estado</th><th>Valor</th><th>Fecha</th></tr></thead><tbody>'+filas+'</tbody></table>'
     +(disc?'<p class="disc">'+esc(disc.trim())+'</p>':'')+'<p class="pie">Generado el '+hoy.toLocaleDateString('es-CO')+' desde el tablero Plan de inversión · Plaza Mayor Medellín</p>';
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Plan de inversión · Resumen ejecutivo</title><style>'+css+'</style></head><body>'+body+'</body></html>';
  }

  function imprimir(){
    const f=document.createElement('iframe');
    f.setAttribute('aria-hidden','true');f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(f);
    const d=f.contentWindow.document;d.open();d.write(construir());d.close();
    const go=()=>{try{f.contentWindow.focus();f.contentWindow.print();}catch(_){}setTimeout(()=>f.remove(),1500);};
    const img=d.querySelector('img');
    if(img&&!img.complete){let done=false;const once=()=>{if(done)return;done=true;go();};img.onload=once;img.onerror=once;setTimeout(once,1500);}else setTimeout(go,150);
  }
  const btn=document.getElementById('reportToggle');
  if(btn)btn.addEventListener('click',imprimir);
  window.PlazaMayorInforme={html:construir,imprimir};
})();
