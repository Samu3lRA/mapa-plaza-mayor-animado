/* Versión de los datos. Súbela (1 -> 2 -> 3...) cada vez que publiques cambios en este archivo:
   así el modo edición avisa si el navegador conserva ediciones de una versión anterior. */
const DATOS_VERSION=6;
/* Fecha que se muestra en el encabezado como "Fecha de actualización". */
const FECHA_ACTUALIZACION='06/11/2026';

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
  {id:'e1',tipo:'especifico',nombre:'Zona de Comidas',valor:'$2.540',fecha:'enero 2027',estado:'En ejecución',pabellon:'sin',x:35.9,y:62.8,fotos:['assets/fotos/zona-comidas.jpg','assets/fotos/zona-comidas-2.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e2',tipo:'especifico',nombre:'Supervisión técnica Z. Comidas',valor:'$61',fecha:'enero 2027',estado:'En ejecución',pabellon:'sin',x:40.6,y:65.4,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e3',tipo:'especifico',nombre:'Remodelación de baños',valor:'$264',fecha:'octubre 2026',estado:'Ejecutado',pabellon:'sin',x:25.6,y:49.1,fotos:['assets/fotos/zona-parcial-banos.jpg','assets/fotos/banos.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e4',tipo:'especifico',nombre:'Equipos gimnasio',valor:'$26',fecha:'octubre 2026',estado:'En ejecución',pabellon:'sin',x:15.2,y:68.6,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e5',tipo:'especifico',nombre:'Cubierta Terraza',valor:'$1.000',fecha:'febrero 2027',estado:'Estructuración',pabellon:'sin',x:53.8,y:49.8,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e6',tipo:'especifico',nombre:'Zonas de descanso Occ.',valor:'$163',fecha:'enero 2027',estado:'Estructuración',pabellon:'sin',x:18.1,y:59.5,fotos:['assets/fotos/zona-descanso.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e7',tipo:'especifico',nombre:'Mtto Listones de Madera',valor:'$1.000',fecha:'enero 2027',estado:'Estructuración',pabellon:'sin',x:36.9,y:43.3,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e8',tipo:'especifico',nombre:'Renovación Policarbonato',valor:'$850',fecha:'abril 2027',estado:'Estructuración',pabellon:'sin',x:49.1,y:36.1,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'e9',tipo:'especifico',nombre:'Cambio telas paneles',valor:'$700',fecha:'enero 2027',estado:'Estructuración',pabellon:'sin',x:60.4,y:60.2,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g1',tipo:'general',nombre:'Renovación Tecnológica',valor:'$4.404',fecha:'abril 2027',estado:'En ejecución',x:45,y:38,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g2',tipo:'general',nombre:'Ingeniería detalle Climatización',valor:'$617',fecha:'abril 2027',estado:'En ejecución',x:27,y:56,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g3',tipo:'general',nombre:'Apoyo Técnico',valor:'$32',fecha:'enero 2027',estado:'En ejecución',x:62,y:52,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g4',tipo:'general',nombre:'Evaluación estructural',valor:'$27',fecha:'diciembre 2026',estado:'En ejecución',x:20,y:70,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g5',tipo:'general',nombre:'Diseño Arquitectónico',valor:'$15',fecha:'octubre 2026',estado:'En ejecución',x:42,y:56,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g6',tipo:'general',nombre:'Pantallas externas',valor:'$4.300',fecha:'junio 2027',estado:'Estructuración',x:70,y:66,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g7',tipo:'general',nombre:'Acondicionamiento Acústico',valor:'$2.117',fecha:'junio 2027',estado:'Estructuración',x:55,y:34,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g8',tipo:'general',nombre:'Señalética',valor:'$1.600',fecha:'abril 2027',estado:'Estructuración',x:80,y:48,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g9',tipo:'general',nombre:'Adecuaciones locativas',valor:'$700',fecha:'febrero 2027',estado:'Estructuración',x:30,y:28,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g10',tipo:'general',nombre:'Pantallas Internas',valor:'$600',fecha:'marzo 2027',estado:'Estructuración',x:66,y:38,fotos:['assets/fotos/pantallas-internas.jpg'],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g11',tipo:'general',nombre:'Mejoras locativas empleados PM',valor:'$183',fecha:'marzo 2027',estado:'Estructuración',x:46,y:80,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g12',tipo:'general',nombre:'Puntos Hidratación',valor:'$160',fecha:'enero 2027',estado:'Estructuración',x:76,y:56,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''},
  {id:'g13',tipo:'general',nombre:'Radios',valor:'$130',fecha:'diciembre 2026',estado:'Estructuración',x:18,y:34,fotos:[],descripcion:'',alcance:[],avance:null,responsable:'',notas:''}
];
/* Rutas anteriores de las fotos. Sirve para que respaldos y ediciones guardadas con las rutas viejas sigan mostrando la foto correcta. */
const FOTO_RUTAS_ANTERIORES={
  'Fotos espacios/Zona de Comidas.jpg':'assets/fotos/zona-comidas.jpg',
  'Fotos espacios/Zona parcial Baños.jpg':'assets/fotos/zona-parcial-banos.jpg',
  'Fotos espacios/Baños.jpg':'assets/fotos/banos.jpg',
  'Fotos espacios/Zona de descanso.HEIC':'assets/fotos/zona-descanso.jpg',
  'Fotos espacios/Pantallas internas.HEIC':'assets/fotos/pantallas-internas.jpg'
};
const ORDEN_PRESENTACION=['e1','e2','e3','e4','e5','e6','e7','e8','e9','g1','g2','g3','g4','g5','g6','g7','g8','g9','g10','g11','g12','g13'];
/* Cifras del resumen de ejecución (en las mismas unidades que el valor de cada proyecto). */
const RESUMEN_EJECUCION={contratado:16321,ejecutado:8334};
/* Datos de la línea de tiempo institucional. */
const LINEA_TIEMPO = [
 {year:2026,title:'Contratación y estructuración',summary:'Seguimiento de proyectos, contratación y preparación de intervenciones.',foto:'',detalle:'Año en el que se concentran proyectos contratados y proyectos en estructuración dentro del tablero.'},
 {year:2027,title:'Ejecución proyectada',summary:'Año con fechas previstas para contratación, ejecución y entrega de diferentes intervenciones.',foto:'',detalle:'Las fechas mostradas corresponden a la información registrada actualmente en cada proyecto y pueden actualizarse.'}
];
