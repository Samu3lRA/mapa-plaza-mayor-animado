/* Versión de los datos. Súbela (1 -> 2 -> 3...) cada vez que publiques cambios en este archivo:
   así el modo edición avisa si el navegador conserva ediciones de una versión anterior. */
const DATOS_VERSION=32;
/* Fecha que se muestra en el encabezado como "Fecha de actualización". */
const FECHA_ACTUALIZACION='06/11/2026';

/* Valores en millones de pesos: se muestran con una M al lado. */
function valorM(v){const s=String(v==null?'':v).trim();return s&&!/M$/i.test(s)?s+' M':s;}

const COLORES_PABELLON = {
  amarillo:{nombre:'Amarillo',fondo:'#F2C200',texto:'#14171C'},
  rojo:{nombre:'Rojo',fondo:'#D93636',texto:'#FFFFFF'},
  verde:{nombre:'Verde',fondo:'#2F9E50',texto:'#FFFFFF'},
  azul:{nombre:'Azul',fondo:'#1D5FD6',texto:'#FFFFFF'},
  blanco:{nombre:'Blanco',fondo:'#F6F6F6',texto:'#14171C'},
  sin:{nombre:'Sin asignar',fondo:'#8B93A0',texto:'#14171C'},
  convenciones:{nombre:'Convenciones',fondo:'#8B5A2B',texto:'#FFFFFF'},
  general:{nombre:'Toda la infraestructura',fondo:'#7B3FC6',texto:'#FFFFFF'}
};

const PROYECTOS = [
  {id:'e1',tipo:'especifico',nombre:'Zona de Comidas',ubicacion:'Exposiciones',valor:'$2.699',fecha:'enero 2027',estado:'En ejecución',pabellon:'sin',x:27.6,y:47.7,fotos:['assets/fotos/zona-comidas-2.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e2',tipo:'especifico',nombre:'Supervisión técnica Z. Comidas',ubicacion:'Exposiciones',valor:'$64,5',fecha:'enero 2027',estado:'En ejecución',pabellon:'sin',x:22.6,y:48.8,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e3',tipo:'especifico',nombre:'Remodelación de baños',ubicacion:'Exposiciones y Convenciones',valor:'$2.982',fecha:'octubre 2026',estado:'Finalizado',pabellon:'sin',x:42.2,y:48.1,fotos:['assets/fotos/banos-2.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e4',tipo:'especifico',nombre:'Equipos gimnasio',ubicacion:'Exposiciones',valor:'$26',fecha:'octubre 2026',estado:'Finalizado',pabellon:'sin',x:93.7,y:48.7,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e5',tipo:'especifico',nombre:'Cubierta Terraza',valor:'$1.000',fecha:'febrero 2027',estado:'Estructuración',pabellon:'sin',x:85.1,y:39.2,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e6',tipo:'especifico',nombre:'Zonas de descanso Occ.',valor:'$163',fecha:'enero 2027',estado:'Estructuración',pabellon:'sin',x:69.4,y:38.4,fotos:['assets/fotos/zona-descanso.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e7',tipo:'especifico',nombre:'Mtto Listones de Madera',valor:'$1.000',fecha:'enero 2027',estado:'Estructuración',pabellon:'sin',x:88.0,y:42.3,fotos:['assets/fotos/mtto-listones-madera.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e8',tipo:'especifico',nombre:'Renovación Policarbonato',valor:'$850',fecha:'abril 2027',estado:'Estructuración',pabellon:'sin',x:30.5,y:54.8,fotos:['assets/fotos/renovacion-policarbonato.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e9',tipo:'especifico',nombre:'Cambio telas paneles',valor:'$700',fecha:'enero 2027',estado:'Estructuración',pabellon:'sin',x:74.8,y:39.9,fotos:['assets/fotos/cambio-telas-paneles.jpg'],fotoRatio:'4/5',fotoPos:'50% 20%',descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g1',tipo:'general',nombre:'Renovación Tecnológica',valor:'$4.404',fecha:'abril 2027',estado:'En ejecución',x:44.8,y:38.1,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g2',tipo:'general',nombre:'Ingeniería detalle Climatización',valor:'$617',fecha:'abril 2027',estado:'En ejecución',x:48.2,y:47.6,fotos:['assets/fotos/climatizacion.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g6',tipo:'general',nombre:'Pantallas externas',valor:'$4.300',fecha:'junio 2027',estado:'Estructuración',x:81.6,y:43.3,fotos:['assets/fotos/pantallas-externas.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g7',tipo:'general',nombre:'Acondicionamiento Acústico',valor:'$2.117',fecha:'junio 2027',estado:'Estructuración',x:81.6,y:51.1,fotos:['assets/fotos/acondicionamiento-acustico.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g8',tipo:'general',nombre:'Señalética',valor:'$1.600',fecha:'abril 2027',estado:'Estructuración',x:69.9,y:47.3,fotos:['assets/fotos/senaletica.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g9',tipo:'general',nombre:'Adecuaciones locativas',valor:'$700',fecha:'febrero 2027',estado:'Estructuración',x:76.7,y:46.7,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g10',tipo:'general',nombre:'Pantallas Internas',valor:'$600',fecha:'marzo 2027',estado:'Estructuración',x:80.7,y:36.0,fotos:['assets/fotos/pantallas-internas-2.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g11',tipo:'general',nombre:'Mejoras locativas empleados PM',valor:'$183',fecha:'marzo 2027',estado:'Estructuración',x:76.1,y:33.8,fotos:['assets/fotos/adecuaciones-locativas.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g12',tipo:'general',nombre:'Puntos Hidratación',valor:'$160',fecha:'enero 2027',estado:'Estructuración',x:72.7,y:53.4,fotos:['assets/fotos/puntos-hidratacion.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g13',tipo:'general',nombre:'Radios',valor:'$130',fecha:'diciembre 2026',estado:'Estructuración',x:59.4,y:51.3,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''}
];
/* Rutas anteriores de las fotos. Sirve para que respaldos y ediciones guardadas con las rutas viejas sigan mostrando la foto correcta. */
const FOTO_RUTAS_ANTERIORES={
  'Fotos espacios/Zona de Comidas.jpg':'assets/fotos/zona-comidas.jpg',
  'Fotos espacios/Zona parcial Baños.jpg':'assets/fotos/zona-parcial-banos.jpg',
  'Fotos espacios/Baños.jpg':'assets/fotos/banos.jpg',
  'Fotos espacios/Zona de descanso.HEIC':'assets/fotos/zona-descanso.jpg',
  'Fotos espacios/Pantallas internas.HEIC':'assets/fotos/pantallas-internas.jpg'
};
const ORDEN_PRESENTACION=['e1','e2','e3','e4','e5','e6','e7','e8','e9','g1','g2','g6','g7','g8','g9','g10','g11','g12','g13'];
/* Cifras del resumen de ejecución (en las mismas unidades que el valor de cada proyecto). */
const RESUMEN_EJECUCION={contratado:16321,ejecutado:8334};
/* Datos de la línea de tiempo institucional. */
const LINEA_TIEMPO = [
 {year:2026,title:'Contratación y estructuración',summary:'Seguimiento de proyectos, contratación y preparación de intervenciones.',foto:'assets/fotos/contratacion-2026.jpg',fotoEjecucion:'assets/fotos/ejecucion-2026.jpg',detalle:'Año en el que se concentran proyectos contratados y proyectos en estructuración dentro del tablero.'},
 {year:2027,title:'Ejecución proyectada',summary:'Año con fechas previstas para contratación, ejecución y entrega de diferentes intervenciones.',foto:'',detalle:'Las fechas mostradas corresponden a la información registrada actualmente en cada proyecto y pueden actualizarse.'}
];
