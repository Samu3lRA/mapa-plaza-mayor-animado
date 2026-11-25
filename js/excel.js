/* Actualizar datos desde un Excel (solo modo edición).
   - Lee ÚNICAMENTE la hoja "Proyectos" (o la primera) y solo las columnas ID, Proyecto, Valor, Fecha de entrega y Estado.
   - Solo puede cambiar nombre, valor, fecha y estado. Nunca toca posiciones, fotos, descripciones, pabellones ni notas.
   - Antes de aplicar muestra un resumen; si hay errores no aplica nada.
   - Los proyectos que no aparezcan en el Excel se conservan. Los nuevos entran centrados en el mapa para ubicarlos a mano. */
(function(){
  const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const norm=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const miles=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');

  function parseValor(v){
    if(typeof v==='number')return isFinite(v)&&v>=0?v:null;
    let s=String(v==null?'':v).replace(/[$\s]/g,'');
    if(!s)return null;
    if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))s=s.replace(/\./g,'').replace(',','.');
    else if(/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s))s=s.replace(/,/g,'');
    else s=s.replace(',','.');
    const n=Number(s);return isFinite(n)&&n>=0?n:null;
  }
  function parseFecha(v){
    if(v instanceof Date&&!isNaN(v))return MESES[v.getMonth()]+' '+v.getFullYear();
    const t=norm(v);if(!t)return null;
    let m=t.match(/^([a-z]+)\.?\s*(?:de\s+|del\s+|-|\/)?\s*(\d{4})$/);
    if(m){const tok=m[1],i=MESES.findIndex(x=>x===tok||(tok.length>=3&&x.startsWith(tok))||x.slice(0,3)===tok);if(i>=0)return MESES[i]+' '+m[2];}
    m=t.match(/^(\d{1,2})\s*[\/-]\s*(\d{4})$/);if(m&&+m[1]>=1&&+m[1]<=12)return MESES[+m[1]-1]+' '+m[2];
    m=t.match(/^(\d{4})\s*[\/-]\s*(\d{1,2})(?:[\/-]\d{1,2})?$/);if(m&&+m[2]>=1&&+m[2]<=12)return MESES[+m[2]-1]+' '+m[1];
    return null;
  }
  function parseEstado(v){
    const t=norm(v);if(!t)return null;
    if(/ejecutad|finaliz|terminad|entregad/.test(t))return 'Ejecutado';
    if(/ejecuc/.test(t))return 'En ejecución';
    if(/estruct/.test(t))return 'Estructuración';
    return null;
  }

  /* rows: matriz de celdas (como la entrega la hoja). proyectos: los actuales de la página.
     Devuelve {errores[], cambios[], nuevos[], ausentes[], sinCambios} sin modificar nada. */
  function analizar(rows,proyectos){
    const out={errores:[],cambios:[],nuevos:[],ausentes:[],sinCambios:0};
    let h=-1,col={};
    for(let i=0;i<Math.min(rows.length,15)&&h<0;i++){
      const r=(rows[i]||[]).map(norm);
      const nombre=r.findIndex(x=>x==='proyecto'||x==='nombre'||x==='nombre del proyecto');
      if(nombre>=0){h=i;col={nombre,id:r.findIndex(x=>x==='id'),valor:r.findIndex(x=>x==='valor'||x.startsWith('valor ')),fecha:r.findIndex(x=>x.startsWith('fecha')),estado:r.findIndex(x=>x==='estado')};}
    }
    if(h<0){out.errores.push('No encontré la fila de títulos. La hoja debe tener las columnas: ID, Proyecto, Valor, Fecha de entrega y Estado.');return out;}
    ['valor','fecha','estado'].forEach(k=>{if(col[k]<0)out.errores.push('Falta la columna "'+(k==='fecha'?'Fecha de entrega':k.charAt(0).toUpperCase()+k.slice(1))+'".');});
    if(out.errores.length)return out;
    const porId=new Map(proyectos.map(p=>[p.id,p])),porNombre=new Map(proyectos.map(p=>[norm(p.nombre),p]));
    const vistos=new Set(),nombresVistos=new Set(),tocados=new Set();
    for(let i=h+1;i<rows.length;i++){
      const r=rows[i]||[];const fila=i+1;
      const cel=k=>col[k]>=0?r[col[k]]:undefined;
      const vacio=[cel('nombre'),cel('valor'),cel('fecha'),cel('estado')].every(x=>x==null||String(x).trim()==='');
      if(vacio)continue;
      const nombre=String(cel('nombre')==null?'':cel('nombre')).trim();
      const id=col.id>=0&&cel('id')!=null?String(cel('id')).trim():'';
      const valorN=parseValor(cel('valor')),fecha=parseFecha(cel('fecha')),estado=parseEstado(cel('estado'));
      const prob=[];
      if(!nombre)prob.push('falta el nombre del proyecto');
      if(valorN==null)prob.push('el valor "'+(cel('valor')==null?'':cel('valor'))+'" no es un número');
      if(!fecha)prob.push('la fecha "'+(cel('fecha')==null?'':(cel('fecha') instanceof Date?'(fecha)':cel('fecha')))+'" debe ser mes y año, por ejemplo abril 2027');
      if(!estado)prob.push('el estado "'+(cel('estado')==null?'':cel('estado'))+'" no es válido (usa En ejecución, Estructuración o Ejecutado)');
      if(id&&vistos.has(id))prob.push('el ID '+id+' está repetido');
      if(nombre&&nombresVistos.has(norm(nombre)))prob.push('el proyecto "'+nombre+'" está repetido');
      if(prob.length){out.errores.push('Fila '+fila+': '+prob.join('; ')+'.');continue;}
      if(id)vistos.add(id);nombresVistos.add(norm(nombre));
      const actual=(id&&porId.get(id))||porNombre.get(norm(nombre));
      const despues={nombre,valor:'$'+miles(valorN),fecha,estado};
      if(!actual){out.nuevos.push(despues);continue;}
      if(tocados.has(actual.id)){out.errores.push('Fila '+fila+': el proyecto "'+actual.nombre+'" aparece más de una vez.');continue;}
      tocados.add(actual.id);
      const antes={nombre:actual.nombre,valor:actual.valor,fecha:actual.fecha,estado:actual.estado};
      const dif=['nombre','valor','fecha','estado'].filter(k=>String(antes[k]||'').trim()!==String(despues[k]||'').trim());
      if(dif.length)out.cambios.push({id:actual.id,antes,despues,campos:dif});else out.sinCambios++;
    }
    out.ausentes=proyectos.filter(p=>!tocados.has(p.id)).map(p=>({id:p.id,nombre:p.nombre}));
    if(!out.nuevos.length&&!out.cambios.length&&!out.sinCambios&&!out.errores.length)out.errores.push('La hoja no tiene proyectos debajo de los títulos.');
    return out;
  }

  const ETQ={nombre:'Nombre',valor:'Valor',fecha:'Fecha',estado:'Estado'};
  function resumenHtml(a){
    let h='';
    if(a.errores.length){
      h+='<div class="xl-bloque xl-error"><strong>No se aplicó nada. Corrige el Excel y vuelve a intentar:</strong><ul>'+a.errores.map(e=>'<li>'+esc(e)+'</li>').join('')+'</ul></div>';
      return h;
    }
    h+='<p class="xl-cifras"><b>'+a.cambios.length+'</b> con cambios · <b>'+a.nuevos.length+'</b> nuevos · <b>'+a.sinCambios+'</b> sin cambios · <b>'+a.ausentes.length+'</b> no aparecen en el Excel</p>';
    if(a.cambios.length)h+='<div class="xl-bloque"><strong>Se van a modificar</strong><ul>'+a.cambios.map(c=>'<li><b>'+esc(c.antes.nombre)+'</b>'+c.campos.map(k=>'<br><span>'+ETQ[k]+':</span> '+esc(c.antes[k])+' <i>→</i> <b>'+esc(c.despues[k])+'</b>').join('')+'</li>').join('')+'</ul></div>';
    if(a.nuevos.length)h+='<div class="xl-bloque"><strong>Proyectos nuevos</strong> <small>(entran al centro del mapa; ubícalos en el modo edición)</small><ul>'+a.nuevos.map(n=>'<li><b>'+esc(n.nombre)+'</b> · '+esc(n.valor)+' · '+esc(n.fecha)+' · '+esc(n.estado)+'</li>').join('')+'</ul></div>';
    if(a.ausentes.length)h+='<div class="xl-bloque"><strong>No aparecen en el Excel (se conservan sin cambios)</strong><ul>'+a.ausentes.map(n=>'<li>'+esc(n.nombre)+'</li>').join('')+'</ul></div>';
    if(!a.cambios.length&&!a.nuevos.length)h+='<p>El Excel coincide con lo que ya está en la página. No hay nada que actualizar.</p>';
    return h;
  }

  function cargarLibreria(){
    if(window.XLSX)return Promise.resolve();
    return new Promise((ok,fail)=>{const s=document.createElement('script');s.src='./js/vendor/xlsx.mini.min.js?v=0.18.5';s.onload=ok;s.onerror=()=>fail(new Error('No se pudo cargar el lector de Excel.'));document.head.appendChild(s);});
  }
  async function leerArchivo(file){
    await cargarLibreria();
    const buf=await file.arrayBuffer();
    const wb=window.XLSX.read(buf,{type:'array',cellDates:true});
    const name=wb.SheetNames.find(n=>norm(n)==='proyectos')||wb.SheetNames[0];
    return window.XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:true,defval:null,blankrows:false});
  }

  function modal(titulo,cuerpo,acciones){
    let m=document.getElementById('excelModal');if(m)m.remove();
    m=document.createElement('div');m.id='excelModal';m.className='xl-modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label',titulo);
    m.innerHTML='<div class="xl-card"><h3>'+esc(titulo)+'</h3><div class="xl-body">'+cuerpo+'</div><div class="xl-actions"></div></div>';
    const box=m.querySelector('.xl-actions');
    acciones.forEach(a=>{const b=document.createElement('button');b.type='button';b.className='button '+(a.primario?'button-primary':'button-secondary');b.textContent=a.texto;b.addEventListener('click',()=>{m.remove();a.fn&&a.fn();});box.appendChild(b);});
    document.body.appendChild(m);(box.querySelector('.button-primary')||box.querySelector('button'))?.focus();
    m.addEventListener('keydown',e=>{if(e.key==='Escape')m.remove();});
    return m;
  }

  async function procesar(file){
    try{
      const rows=await leerArchivo(file);
      const a=analizar(rows,window.PlazaMayorData.getProjects());
      const puede=!a.errores.length&&(a.cambios.length||a.nuevos.length);
      modal('Actualizar desde Excel · '+file.name,resumenHtml(a),puede?[{texto:'Cancelar'},{texto:'Aplicar cambios',primario:true,fn:()=>window.PlazaMayorData.aplicarExcel(a.cambios,a.nuevos)}]:[{texto:'Cerrar',primario:true}]);
    }catch(e){modal('No se pudo leer el archivo','<div class="xl-bloque xl-error">'+esc(e&&e.message||'Archivo no válido')+'. Usa un archivo .xlsx hecho con la plantilla.</div>',[{texto:'Cerrar',primario:true}]);}
  }

  function init(){
    const btn=document.getElementById('excelUpdate'),inp=document.getElementById('excelFile');
    if(!btn||!inp)return;
    btn.addEventListener('click',()=>inp.click());
    inp.addEventListener('change',()=>{const f=inp.files&&inp.files[0];inp.value='';if(f)procesar(f);});
  }
  window.PlazaMayorExcel={analizar,parseValor,parseFecha,parseEstado,resumenHtml};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
