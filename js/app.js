// ============================================================================
// FRIDGEFLOW v2 — Lógica estática completa (sin servidor, sin backend)
// ----------------------------------------------------------------------------
// Una única clase App que se inicializa según la página abierta:
//   index.html      -> planificador semanal (calendario 7 días x 2 comidas)
//   recetario.html  -> recetario filtrable + gestión de ingredientes
//   auditoria.html  -> auditoría estática (no necesita datos)
// Persistencia: localStorage (recetas, ingredientes y menú semanal).
// ============================================================================

const STORAGE_RECIPES = 'fridgeflow_recetas';
const STORAGE_INGREDIENTS = 'fridgeflow_ingredientes';
const STORAGE_WEEK = 'fridgeflow_semana';
const STORAGE_VERSION = 'fridgeflow_version';
const STORAGE_PREFERENCES = 'fridgeflow_preferencias';
const DATA_VERSION = '2.5';

// Datos nutricionales y combinaciones saludables (se cargan desde
// data/nutricion.js antes que este archivo).
function datosNutricion() {
  return (typeof window !== 'undefined' && window.FRIDGEFLOW_NUTRICION) || null;
}

// Las imágenes viven junto al HTML (ambas páginas están en la raíz del proyecto)
const RUTA_IMAGENES = 'assets/images/recetas/';
// Coste medio estimado por cada ingrediente que hay que comprar
const COSTE_POR_INGREDIENTE = 1.8;

// ---------------------------------------------------------------------------
// PESO DE LOS INGREDIENTES (coincidencia del recetario)
// Escala 1-5: 1 = condimento (sal, pimienta), 2 = condimento con presencia
// (aceite, aliños), 3 = verdura de sofrito o especia clave, 4 = base o
// acompañamiento principal y 5 = ingrediente protagonista del plato.
// Así, en una ensalada de garbanzos, unos garbanzos pesan mucho más que la sal.
// ---------------------------------------------------------------------------
const PESO_MIN = 1;
const PESO_MAX = 5;
const PESO_PROTAGONISTA = 4;

// Migración de nombres de ingrediente: variantes que ahora se unifican.
const RENOMBRAR_INGREDIENTES = {
  'Tofu firme': 'Tofu',
  'Tofu ahumado': 'Tofu'
};

// Filtro del recetario: la coincidencia se estira para que un ingrediente
// protagonista no parezca poco relevante (un 12 % analítico se lee mal).
const FACTOR_COINCIDENCIA = 2;
const BONUS_PROTAGONISTA = 0.08;
const RECETAS_TOP_FILTRO = 8;

// Archivos de imagen disponibles en assets/images/recetas/ (para el selector
// del formulario de recetas).
const IMAGENES_RECETAS = [
  'plato-albondigas-tomate.jfif',
  'plato-alubias-blancas.jpg',
  'plato-arroz-salteado.webp',
  'plato-berenjena-parmesana.jpg',
  'plato-burritos-arroz-frijoles.jpg',
  'plato-crema-calabaza.webp',
  'plato-croquetas-setas.avif',
  'plato-curry-garbanzos.jpg',
  'plato-dal-lentejas-rojas.jpg',
  'plato-empanadillas-espinacas.jpg',
  'plato-ensalada-garbanzos-coliflor.jfif',
  'plato-ensaladilla-rusa.webp',
  'plato-fajitas-falafel.jfif',
  'plato-garbanzos-especiados.webp',
  'plato-heura-ajillo.jpg',
  'plato-lasana-lentejas.jfif',
  'plato-macarrones-tomate.jfif',
  'plato-pad-thai-vegetariano.jpg',
  'plato-paella-verduras-alcachofas.jpg',
  'plato-pesto-rupula.png',
  'plato-pisto-manchego-huevo.jpg',
  'plato-pizza-verduras-queso-cabra.jpg',
  'plato-pollo-pimenton.jfif',
  'plato-revuelto-setas.jfif',
  'plato-salteado-tofu.jfif',
  'plato-shakshuka.jpg',
  'plato-tortitas-calabacin.jfif',
  'tortilla-de-patatas.jpg'
];

// Nombre del archivo .txt de cada receta por defecto (los que ya existen en
// data/recetas/). Al editar una receta se sobrescribe ese mismo archivo.
const SLUGS_RECETAS_DEFECTO = {
  'receta-1': 'albondigas-tomate',
  'receta-2': 'arroz-salteado',
  'receta-3': 'crema-calabaza',
  'receta-4': 'curry-garbanzos',
  'receta-5': 'ensalada-garbanzos-coliflor',
  'receta-6': 'garbanzos-especiados',
  'receta-7': 'lasana-lentejas',
  'receta-8': 'pesto-rupula',
  'receta-9': 'pollo-pimenton',
  'receta-10': 'tortitas-calabacin',
  'receta-11': 'tortilla-patatas',
  'receta-12': 'salteado-tofu-verduras',
  'receta-13': 'heura-ajillo-patatas',
  'receta-14': 'alubias-blancas-estofadas',
  'receta-15': 'macarrones-tomate-huevo',
  'receta-16': 'ensaladilla-rusa',
  'receta-17': 'croquetas-setas-horno',
  'receta-18': 'revuelto-setas',
  'receta-19': 'fajitas-falafel',
  'receta-20': 'empanadillas-espinacas-queso',
  'receta-21': 'dal-lentejas-rojas',
  'receta-22': 'pad-thai-vegetariano',
  'receta-23': 'paella-verduras-alcachofas',
  'receta-24': 'burritos-arroz-frijoles',
  'receta-25': 'shakshuka',
  'receta-26': 'berenjena-parmesana',
  'receta-27': 'pizza-verduras-queso-cabra',
  'receta-28': 'pisto-manchego-huevo'
};

// Pesos curados de las 10 recetas por defecto. La clave es el id de la receta
// y el valor un mapa ingrediente -> peso.
const PESOS_INGREDIENTES_DEFECTO = {
  'receta-1': {
    'Albóndigas de ternera': 5, 'Patatas': 4, 'Tomate frito': 4, 'Cebolla': 3,
    'Ajo': 2, 'Leche': 2, 'Mantequilla': 2, 'Aceite de oliva virgen extra': 2,
    'Sal': 1, 'Pimienta negra': 1
  },
  'receta-2': {
    'Arroz': 5, 'Huevos': 4, 'Zanahoria': 3, 'Guisantes': 3, 'Cebolla': 2,
    'Aceite de oliva virgen extra': 2, 'Salsa de soja': 2, 'Sal': 1
  },
  'receta-3': {
    'Calabaza': 5, 'Caldo de verduras': 3, 'Cebolla': 3, 'Pan integral': 3,
    'Ajo': 2, 'Aceite de oliva virgen extra': 2, 'Cilantro seco': 2,
    'Sal': 1, 'Pimienta negra': 1
  },
  'receta-4': {
    'Garbanzos': 5, 'Leche de coco': 4, 'Cebolla': 3, 'Pimiento rojo': 3,
    'Tomate frito': 3, 'Arroz': 3, 'Curry en polvo': 3, 'Ajo': 2,
    'Comino molido': 2, 'Aceite de oliva virgen extra': 2, 'Sal': 1
  },
  'receta-5': {
    'Garbanzos': 5, 'Coliflor': 4, 'Rúcula': 3, 'Yogur griego natural': 2,
    'Aceite de oliva virgen extra': 2, 'Pimentón dulce': 2, 'Limón': 2,
    'Sal': 1, 'Pimienta negra': 1
  },
  'receta-6': {
    'Garbanzos': 5, 'Espinacas': 4, 'Cebolla': 3, 'Tomate frito': 3,
    'Pimentón dulce': 3, 'Ajo': 2, 'Aceite de oliva virgen extra': 2,
    'Caldo de verduras': 2, 'Sal': 1
  },
  'receta-7': {
    'Lentejas': 5, 'Láminas de lasaña': 5, 'Berenjena': 4, 'Tomate frito': 4,
    'Queso parmesano': 3, 'Cebolla': 3, 'Zanahoria': 2, 'Leche': 2,
    'Harina de trigo': 2, 'Mantequilla': 2, 'Aceite de oliva virgen extra': 2,
    'Orégano': 2, 'Sal': 1, 'Pimienta negra': 1
  },
  'receta-8': {
    'Pasta integral': 5, 'Rúcula': 5, 'Nueces': 4, 'Queso parmesano': 3,
    'Aceite de oliva virgen extra': 3, 'Ajo': 2, 'Limón': 2,
    'Sal': 1, 'Pimienta negra': 1
  },
  'receta-9': {
    'Pollo': 5, 'Patatas': 4, 'Tomate frito': 4, 'Huevos': 3, 'Cebolla': 3,
    'Pimiento rojo': 3, 'Pimentón dulce': 2, 'Aceite de oliva virgen extra': 2,
    'Caldo de verduras': 2, 'Sal': 1, 'Pimienta negra': 1
  },
  'receta-10': {
    'Calabacín': 5, 'Zanahoria': 4, 'Huevos': 3, 'Harina de trigo': 3,
    'Queso parmesano': 2, 'Yogur griego natural': 2,
    'Aceite de oliva virgen extra': 2, 'Orégano': 2, 'Sal': 1,
    'Pimienta negra': 1
  }
};

// Heurística para recetas antiguas o creadas antes de existir el peso.
const INGREDIENTES_PESO_1 = ['Sal', 'Pimienta negra'];
const INGREDIENTES_PESO_2 = ['Aceite de oliva virgen extra', 'Caldo de verduras',
  'Salsa de soja', 'Mantequilla', 'Harina de trigo', 'Leche', 'Leche de coco',
  'Yogur griego natural', 'Queso parmesano'];
const INGREDIENTES_PESO_3 = ['Cebolla', 'Ajo', 'Limón', 'Pan integral'];

function pesoInferido(ingrediente) {
  const nombre = String((ingrediente && ingrediente.nombre) || '').trim();
  const categoria = String((ingrediente && ingrediente.categoria) || '');
  if (INGREDIENTES_PESO_1.includes(nombre) || categoria === 'Especias') return 1;
  if (INGREDIENTES_PESO_2.includes(nombre)) return 2;
  if (INGREDIENTES_PESO_3.includes(nombre)) return 3;
  const cantidad = Number(ingrediente && ingrediente.cantidad) || 0;
  const unidad = String((ingrediente && ingrediente.unidad) || '').toLowerCase();
  if (/^(g|kg|ml|l)(\b|\s|\()/.test(unidad) && cantidad >= 300) return 5;
  return 4;
}

function pesoPorDefecto(recetaId, ingrediente) {
  const tabla = PESOS_INGREDIENTES_DEFECTO[recetaId];
  const nombre = String((ingrediente && ingrediente.nombre) || '');
  if (tabla && typeof tabla[nombre] === 'number') return tabla[nombre];
  return pesoInferido(ingrediente);
}

// CATÁLOGO: todos los ingredientes que pueden usarse en una receta
const CATALOGO_INGREDIENTES = {
  Verduras: ['Ajetes', 'Ajo', 'Berenjena', 'Calabacín', 'Calabaza', 'Cebolla', 'Coliflor', 'Espinacas', 'Guisantes', 'Lechuga', 'Limón', 'Patatas', 'Pimiento rojo', 'Pimiento verde', 'Rúcula', 'Setas', 'Tomate', 'Zanahoria', 'Alcachofas', 'Cebolleta', 'Jengibre', 'Judías verdes', 'Maíz', 'Brotes de soja'],
  Proteínas: ['Albóndigas de ternera', 'Alubias blancas', 'Falafel', 'Garbanzos', 'Heura', 'Huevos', 'Lentejas', 'Pollo', 'Tofu', 'Frijoles negros'],
  Lácteos: ['Leche', 'Mantequilla', 'Queso parmesano', 'Queso rallado', 'Yogur griego natural', 'Queso feta', 'Queso de cabra', 'Queso manchego', 'Mozzarella'],
  Despensa: ['Aceite de oliva virgen extra', 'Aceitunas', 'Arroz', 'Caldo de verduras', 'Fideos de arroz', 'Harina de trigo', 'Láminas de lasaña', 'Leche de coco', 'Macarrones', 'Masa de empanadilla', 'Mayonesa', 'Nueces', 'Pan integral', 'Pan rallado', 'Pasta integral', 'Pimienta negra', 'Sal', 'Salsa de soja', 'Tomate frito', 'Tortillas de trigo', 'Azúcar moreno', 'Cacahuetes', 'Levadura química'],
  Especias: ['Cilantro seco', 'Comino molido', 'Curry en polvo', 'Laurel', 'Nuez moscada', 'Orégano', 'Perejil', 'Pimentón dulce', 'Cúrcuma', 'Guindilla en copos', 'Albahaca', 'Azafrán', 'Pimentón ahumado']
};

// La despensa de ejemplo NO tiene todo el catálogo: así la lista de la compra,
// el coste estimado y los avisos de "falta" tienen sentido desde el primer uso.
const NO_EN_DESPENSA = ['Albóndigas de ternera', 'Pollo', 'Lentejas', 'Queso parmesano',
  'Leche de coco', 'Láminas de lasaña', 'Nueces', 'Pan integral',
  'Calabaza', 'Berenjena', 'Coliflor', 'Rúcula', 'Guisantes',
  'Heura', 'Tofu', 'Falafel', 'Alubias blancas', 'Setas',
  'Masa de empanadilla', 'Tortillas de trigo', 'Queso rallado', 'Ajetes'];

function despensaInicial() {
  const despensa = {};
  Object.entries(CATALOGO_INGREDIENTES).forEach(([categoria, lista]) => {
    despensa[categoria] = lista.filter(ingrediente => !NO_EN_DESPENSA.includes(ingrediente));
  });
  return despensa;
}

const DEFAULT_RECIPES = [
  {
    id: 'receta-1',
    nombre: 'Albóndigas en salsa de tomate con puré de patata',
    descripcion: 'Albóndigas caseras de ternera en salsa de tomate suave, acompañadas de un puré de patata cremoso.',
    tiempo: '45 min',
    porciones_base: 4,
    imagen: 'plato-albondigas-tomate.jfif',
    ingredientes: [
      { nombre: 'Albóndigas de ternera', cantidad: 450, unidad: 'g', categoria: 'Proteínas' },
      { nombre: 'Tomate frito', cantidad: 300, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Cebolla', cantidad: 1, unidad: 'ud', categoria: 'Verduras' },
      { nombre: 'Ajo', cantidad: 2, unidad: 'dientes', categoria: 'Verduras' },
      { nombre: 'Patatas', cantidad: 800, unidad: 'g', categoria: 'Verduras' },
      { nombre: 'Leche', cantidad: 100, unidad: 'ml', categoria: 'Lácteos' },
      { nombre: 'Mantequilla', cantidad: 20, unidad: 'g', categoria: 'Lácteos' },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 40, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' },
      { nombre: 'Pimienta negra', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' }
    ],
    equipamiento: ['Sartén', 'Cacerola'],
    pasos: [
      'Pica la cebolla y el ajo finamente y pochéalos en una sartén con aceite de oliva.',
      'Añade las albóndigas y dóralas por todos los lados.',
      'Incorpora el tomate frito, salpimienta y deja cocer a fuego medio durante 20 minutos.',
      'Mientras tanto, cuece las patatas y tritúralas con la mantequilla y la leche tibia hasta obtener un puré cremoso.',
      'Sirve las albóndigas con salsa de tomate sobre el puré de patata.'
    ]
  },
  {
    id: 'receta-2',
    nombre: 'Arroz salteado del día después con huevo y verduras',
    descripcion: 'Arroz salteado rápido con huevo revuelto, guisantes y zanahoria. Perfecto para rescatar arroz sobrante.',
    tiempo: '20 min',
    porciones_base: 4,
    imagen: 'plato-arroz-salteado.webp',
    ingredientes: [
      { nombre: 'Arroz', cantidad: 400, unidad: 'g (crudo)', categoria: 'Despensa' },
      { nombre: 'Huevos', cantidad: 8, unidad: 'ud', categoria: 'Proteínas' },
      { nombre: 'Zanahoria', cantidad: 2, unidad: 'ud', categoria: 'Verduras' },
      { nombre: 'Guisantes', cantidad: 200, unidad: 'g', categoria: 'Verduras' },
      { nombre: 'Cebolla', cantidad: 1, unidad: 'ud', categoria: 'Verduras' },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 40, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Salsa de soja', cantidad: 30, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' }
    ],
    equipamiento: ['Sartén', 'Cuchara de madera'],
    pasos: [
      'Cuece el arroz el día anterior (unos 1 kg ya cocido) para que no se apelmace al saltear.',
      'Pica la cebolla y la zanahoria en daditos pequeños.',
      'Calienta aceite en una sartén grande y saltea la cebolla y la zanahoria durante 5 minutos.',
      'Añade los guisantes y el arroz cocido, rompiendo los grumos con la cuchara.',
      'Haz un hueco en el centro, bate los huevos y revuélvelos directamente en la sartén.',
      'Incorpora la salsa de soja, mezcla bien y salpimienta al gusto. Sirve caliente.'
    ]
  },
  {
    id: 'receta-3',
    nombre: 'Crema de calabaza asada con cilantro y tostadas integrales',
    descripcion: 'Crema sedosa de calabaza asada al horno con un toque de cilantro, servida con tostadas integrales.',
    tiempo: '50 min',
    porciones_base: 4,
    imagen: 'plato-crema-calabaza.webp',
    ingredientes: [
      { nombre: 'Calabaza', cantidad: 2000, unidad: 'g', categoria: 'Verduras' },
      { nombre: 'Cebolla', cantidad: 2, unidad: 'ud', categoria: 'Verduras' },
      { nombre: 'Ajo', cantidad: 4, unidad: 'dientes', categoria: 'Verduras' },
      { nombre: 'Caldo de verduras', cantidad: 1200, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 100, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Cilantro seco', cantidad: 1, unidad: 'cucharadita', categoria: 'Especias' },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' },
      { nombre: 'Pimienta negra', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' },
      { nombre: 'Pan integral', cantidad: 10, unidad: 'rebanadas', categoria: 'Despensa' },
      { nombre: 'Nueces', cantidad: 40, unidad: 'g', categoria: 'Despensa' }
    ],
    equipamiento: ['Horno', 'Cacerola', 'Licuadora'],
    pasos: [
      'Precalienta el horno a 200 °C. Corta la calabaza en trozos y ásala con aceite, sal y pimienta durante 30 minutos.',
      'Pica la cebolla y el ajo y pochéalos en una cacerola con un poco de aceite.',
      'Añade la calabaza asada, el caldo de verduras y el cilantro seco. Cocina 15 minutos.',
      'Tritura todo con la licuadora hasta obtener una crema fina y sedosa.',
      'Tuesta las rebanadas de pan integral y las nueces, y sirve la crema caliente con ambas cosas a un lado.'
    ]
  },
  {
    id: 'receta-4',
    nombre: 'Curry de garbanzos especiados con leche de coco',
    descripcion: 'Curry aromático de garbanzos con leche de coco, curry y comino. Vegetariano, nutritivo y lleno de sabor.',
    tiempo: '35 min',
    porciones_base: 4,
    imagen: 'plato-curry-garbanzos.jpg',
    ingredientes: [
      { nombre: 'Garbanzos', cantidad: 400, unidad: 'g cocidos', categoria: 'Proteínas' },
      { nombre: 'Cebolla', cantidad: 1, unidad: 'ud', categoria: 'Verduras' },
      { nombre: 'Ajo', cantidad: 2, unidad: 'dientes', categoria: 'Verduras' },
      { nombre: 'Pimiento rojo', cantidad: 1, unidad: 'ud', categoria: 'Verduras' },
      { nombre: 'Leche de coco', cantidad: 400, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Tomate frito', cantidad: 200, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Arroz', cantidad: 200, unidad: 'g', categoria: 'Despensa' },
      { nombre: 'Curry en polvo', cantidad: 1, unidad: 'cucharadita', categoria: 'Especias' },
      { nombre: 'Comino molido', cantidad: 0.5, unidad: 'cucharadita', categoria: 'Especias' },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 20, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' }
    ],
    equipamiento: ['Sartén', 'Cuchara de madera'],
    pasos: [
      'Pica la cebolla, el ajo y el pimiento rojo en trozos pequeños.',
      'Calienta aceite en una sartén y sofríe la cebolla y el ajo hasta que estén transparentes.',
      'Añade el pimiento rojo y cocina 5 minutos más.',
      'Incorpora el curry en polvo y el comino, removiendo para que suelten su aroma.',
      'Añade los garbanzos, el tomate frito y la leche de coco. Mezcla bien.',
      'Cocina a fuego medio 15 minutos y salpimenta. Cuece el arroz aparte y sirve el curry sobre él.'
    ]
  },
  {
    id: 'receta-5',
    nombre: 'Ensalada templada de garbanzos y coliflor asada',
    descripcion: 'Ensalada templada con coliflor asada al pimentón, garbanzos, rúcula y aliño ligero de yogur.',
    tiempo: '40 min',
    porciones_base: 4,
    imagen: 'plato-ensalada-garbanzos-coliflor.jfif',
    ingredientes: [
      { nombre: 'Coliflor', cantidad: 2, unidad: 'ud mediana', categoria: 'Verduras' },
      { nombre: 'Garbanzos', cantidad: 600, unidad: 'g cocidos', categoria: 'Proteínas' },
      { nombre: 'Huevos', cantidad: 4, unidad: 'ud', categoria: 'Proteínas' },
      { nombre: 'Rúcula', cantidad: 100, unidad: 'g', categoria: 'Verduras' },
      { nombre: 'Yogur griego natural', cantidad: 300, unidad: 'g', categoria: 'Lácteos' },
      { nombre: 'Queso feta', cantidad: 80, unidad: 'g', categoria: 'Lácteos' },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 60, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Pimentón dulce', cantidad: 1, unidad: 'cucharadita', categoria: 'Especias' },
      { nombre: 'Limón', cantidad: 2, unidad: 'ud', categoria: 'Verduras' },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' },
      { nombre: 'Pimienta negra', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' }
    ],
    equipamiento: ['Horno', 'Bol', 'Cuchara'],
    pasos: [
      'Precalienta el horno a 200 °C. Corta la coliflor en floretes.',
      'Mezcla los floretes con aceite, pimentón, sal y pimienta. Asa durante 25 minutos.',
      'Mientras tanto, cuece los huevos 10 minutos, enfría y pélalos. Prepara el aliño mezclando yogur, jugo de limón, un poco de aceite, sal y pimienta.',
      'En un bol grande, combina la coliflor asada caliente, los garbanzos, la rúcula y los huevos cortados en cuartos.',
      'Vierte el aliño por encima, desmenuza el queso feta, mezcla suavemente y sirve templada.'
    ]
  },
  {
    id: 'receta-6',
    nombre: 'Garbanzos especiados al pimentón con espinacas',
    descripcion: 'Garbanzos guisados con pimentón dulce, ajo y espinacas frescas. Plato humilde, sabroso y nutritivo.',
    tiempo: '30 min',
    porciones_base: 4,
    imagen: 'plato-garbanzos-especiados.webp',
    ingredientes: [
      { nombre: 'Garbanzos', cantidad: 800, unidad: 'g cocidos', categoria: 'Proteínas' },
      { nombre: 'Espinacas', cantidad: 300, unidad: 'g', categoria: 'Verduras' },
      { nombre: 'Cebolla', cantidad: 2, unidad: 'ud', categoria: 'Verduras' },
      { nombre: 'Ajo', cantidad: 4, unidad: 'dientes', categoria: 'Verduras' },
      { nombre: 'Tomate frito', cantidad: 400, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Pimentón dulce', cantidad: 1, unidad: 'cucharadita', categoria: 'Especias' },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 60, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Caldo de verduras', cantidad: 200, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Pan integral', cantidad: 4, unidad: 'rebanadas', categoria: 'Despensa' },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' }
    ],
    equipamiento: ['Cacerola', 'Cuchara de madera'],
    pasos: [
      'Pica la cebolla y el ajo finamente.',
      'Calienta aceite en una cacerola y sofríe la cebolla hasta que esté dorada.',
      'Añade el ajo y el pimentón dulce, removiendo rápidamente para no quemar el pimentón.',
      'Incorpora los garbanzos, el tomate frito y el caldo de verduras.',
      'Cocina a fuego medio durante 15 minutos.',
      'Añade las espinacas y deja que se reduzcan. Salpimenta y sirve caliente con el pan integral tostado.'
    ]
  },
  {
    id: 'receta-7',
    nombre: 'Lasaña de lentejas y berenjena asada con bechamel ligera',
    descripcion: 'Lasaña vegetariana con ragú de lentejas, berenjena asada y bechamel ligera. Sustanciosa y llena de sabor.',
    tiempo: '60 min',
    porciones_base: 6,
    imagen: 'plato-lasana-lentejas.jfif',
    ingredientes: [
      { nombre: 'Lentejas', cantidad: 400, unidad: 'g cocidas', categoria: 'Proteínas' },
      { nombre: 'Berenjena', cantidad: 2, unidad: 'ud grande', categoria: 'Verduras' },
      { nombre: 'Láminas de lasaña', cantidad: 12, unidad: 'ud', categoria: 'Despensa' },
      { nombre: 'Queso parmesano', cantidad: 120, unidad: 'g', categoria: 'Lácteos' },
      { nombre: 'Mozzarella', cantidad: 150, unidad: 'g', categoria: 'Lácteos' },
      { nombre: 'Cebolla', cantidad: 2, unidad: 'ud', categoria: 'Verduras' },
      { nombre: 'Zanahoria', cantidad: 2, unidad: 'ud', categoria: 'Verduras' },
      { nombre: 'Tomate frito', cantidad: 800, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Leche', cantidad: 800, unidad: 'ml', categoria: 'Lácteos' },
      { nombre: 'Harina de trigo', cantidad: 60, unidad: 'g', categoria: 'Despensa' },
      { nombre: 'Mantequilla', cantidad: 60, unidad: 'g', categoria: 'Lácteos' },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 60, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Orégano', cantidad: 1, unidad: 'cucharadita', categoria: 'Especias' },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' },
      { nombre: 'Pimienta negra', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' }
    ],
    equipamiento: ['Horno', 'Cacerola', 'Fuente para horno'],
    pasos: [
      'Precalienta el horno a 180 °C. Corta la berenjena en rodajas y ásala con aceite, sal y pimienta durante 20 minutos.',
      'Pica la cebolla y la zanahoria y pochéalas en una cacerola con aceite.',
      'Añade las lentejas, el tomate frito y el orégano. Cocina 10 minutos.',
      'Prepara la bechamel: derrite la mantequilla, añade la harina, cocina 1 minuto y vierte la leche caliente poco a poco hasta espesar.',
      'En una fuente para horno, alterna capas de láminas de lasaña, ragú de lentejas, berenjena, mozzarella y bechamel.',
      'Termina con una capa de bechamel y espolvorea el queso parmesano.',
      'Hornea durante 25 minutos hasta que esté dorada y burbujeante.'
    ]
  },
  {
    id: 'receta-8',
    nombre: 'Pesto de rúcula y nueces con pasta integral',
    descripcion: 'Pesto fresco y vibrante de rúcula, nueces y queso parmesano, mezclado con pasta integral.',
    tiempo: '25 min',
    porciones_base: 4,
    imagen: 'plato-pesto-rupula.png',
    ingredientes: [
      { nombre: 'Pasta integral', cantidad: 380, unidad: 'g', categoria: 'Despensa' },
      { nombre: 'Rúcula', cantidad: 60, unidad: 'g', categoria: 'Verduras' },
      { nombre: 'Nueces', cantidad: 70, unidad: 'g', categoria: 'Despensa' },
      { nombre: 'Queso parmesano', cantidad: 60, unidad: 'g', categoria: 'Lácteos' },
      { nombre: 'Ajo', cantidad: 1, unidad: 'diente', categoria: 'Verduras' },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 60, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Limón', cantidad: 0.5, unidad: 'ud', categoria: 'Verduras' },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' },
      { nombre: 'Pimienta negra', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' }
    ],
    equipamiento: ['Cacerola', 'Licuadora', 'Bol'],
    pasos: [
      'Cuece la pasta integral en agua con sal según las indicaciones del paquete.',
      'Mientras tanto, lava y seca la rúcula.',
      'En una licuadora, combina la rúcula, las nueces, el ajo, el queso parmesano, el jugo de limón y el aceite de oliva.',
      'Tritura hasta obtener una textura cremosa pero con cuerpo. Salpimienta al gusto.',
      'Escurre la pasta y mézclala con el pesto en un bol grande.',
      'Sirve inmediatamente, con un poco más de queso parmesano rallado por encima si lo deseas.'
    ]
  },
  {
    id: 'receta-9',
    nombre: 'Pollo al pimentón con huevo cocido y patatas',
    descripcion: 'Pollo guisado al pimentón dulce con patatas y huevo cocido. Plato completo, tradicional y muy sabroso.',
    tiempo: '50 min',
    porciones_base: 4,
    imagen: 'plato-pollo-pimenton.jfif',
    ingredientes: [
      { nombre: 'Pollo', cantidad: 700, unidad: 'g troceado', categoria: 'Proteínas' },
      { nombre: 'Patatas', cantidad: 5, unidad: 'ud medianas', categoria: 'Verduras' },
      { nombre: 'Huevos', cantidad: 3, unidad: 'ud', categoria: 'Proteínas' },
      { nombre: 'Cebolla', cantidad: 1, unidad: 'ud', categoria: 'Verduras' },
      { nombre: 'Pimiento rojo', cantidad: 1, unidad: 'ud', categoria: 'Verduras' },
      { nombre: 'Pimentón dulce', cantidad: 1, unidad: 'cucharadita', categoria: 'Especias' },
      { nombre: 'Tomate frito', cantidad: 300, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 40, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Caldo de verduras', cantidad: 200, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' },
      { nombre: 'Pimienta negra', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' }
    ],
    equipamiento: ['Cacerola', 'Cuchara de madera'],
    pasos: [
      'Pica la cebolla y el pimiento rojo en trozos. Pela y corta las patatas en rodajas gruesas.',
      'Calienta aceite en una cacerola y dora los trozos de pollo por todos los lados.',
      'Añade la cebolla y el pimiento, y sofríe hasta que se ablanden.',
      'Incorpora el pimentón dulce, removiendo rápido, y luego el tomate frito y el caldo de verduras.',
      'Añade las patatas, tapa y cocina a fuego medio durante 25 minutos.',
      'Cuece los huevos aparte (10 minutos), córtalos en cuartos y añádelos los últimos 5 minutos.',
      'Salpimenta y sirve caliente.'
    ]
  },
  {
    id: 'receta-10',
    nombre: 'Tortitas de calabacín y zanahoria con salsa de yogur',
    descripcion: 'Tortitas crujientes de calabacín y zanahoria rallados, con queso y hierbas, acompañadas de salsa de yogur.',
    tiempo: '35 min',
    porciones_base: 4,
    imagen: 'plato-tortitas-calabacin.jfif',
    ingredientes: [
      { nombre: 'Calabacín', cantidad: 4, unidad: 'ud medianos', categoria: 'Verduras' },
      { nombre: 'Zanahoria', cantidad: 3, unidad: 'ud', categoria: 'Verduras' },
      { nombre: 'Huevos', cantidad: 6, unidad: 'ud', categoria: 'Proteínas' },
      { nombre: 'Queso parmesano', cantidad: 100, unidad: 'g', categoria: 'Lácteos' },
      { nombre: 'Harina de trigo', cantidad: 120, unidad: 'g', categoria: 'Despensa' },
      { nombre: 'Yogur griego natural', cantidad: 400, unidad: 'g', categoria: 'Lácteos' },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 70, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Orégano', cantidad: 0.5, unidad: 'cucharadita', categoria: 'Especias' },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' },
      { nombre: 'Pimienta negra', cantidad: 1, unidad: 'pizca', categoria: 'Despensa' }
    ],
    equipamiento: ['Sartén', 'Bol', 'Rallador'],
    pasos: [
      'Ralla el calabacín y la zanahoria. Escurre bien el exceso de agua del calabacín con un paño limpio.',
      'En un bol grande, mezcla las verduras ralladas con los huevos, el queso parmesano, la harina, el orégano, la sal y la pimienta.',
      'Calienta un poco de aceite en una sartén a fuego medio.',
      'Forma tortitas con la mezcla y cocínalas 3-4 minutos por cada lado, hasta que estén doradas.',
      'Mientras tanto, prepara la salsa mezclando el yogur con un poco de aceite, sal y pimienta.',
      'Sirve las tortitas calientes con la salsa de yogur a un lado.'
    ]
  },
  {
    id: 'receta-11',
    nombre: 'Tortilla de patatas con cebolla',
    descripcion: 'La tortilla de siempre: patata y cebolla pochadas lentamente y cuajadas con huevo. Sencilla, jugosa y perfecta para comer o cenar.',
    tiempo: '35 min',
    porciones_base: 4,
    imagen: 'tortilla-de-patatas.jpg',
    ingredientes: [
      { nombre: 'Patatas', cantidad: 1000, unidad: 'g', categoria: 'Verduras', peso: 5 },
      { nombre: 'Huevos', cantidad: 10, unidad: 'ud', categoria: 'Proteínas', peso: 5 },
      { nombre: 'Cebolla', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 100, unidad: 'ml', categoria: 'Despensa', peso: 3 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Sartén', 'Bol'],
    pasos: [
      'Pela y corta las patatas en láminas finas y la cebolla en juliana.',
      'Pocha las patatas y la cebolla en una sartén con aceite a fuego medio-bajo durante 20 minutos, removiendo de vez en cuando.',
      'Bate los huevos con una pizca de sal en un bol y mezcla con las patatas escurridas. Deja reposar 5 minutos.',
      'Vierte la mezcla en la sartén caliente y cuaja a fuego medio 4 minutos por cada lado, dándole la vuelta con un plato.',
      'Sirve la tortilla templada, cortada en porciones.'
    ]
  },
  {
    id: 'receta-12',
    nombre: 'Salteado de verduras con tofu y arroz',
    descripcion: 'Arroz salteado con tofu dorado y verduras crujientes. Un plato único vegetal, rápido y muy completo.',
    tiempo: '30 min',
    porciones_base: 4,
    imagen: 'plato-salteado-tofu.jfif',
    ingredientes: [
      { nombre: 'Tofu', cantidad: 450, unidad: 'g', categoria: 'Proteínas', peso: 5 },
      { nombre: 'Arroz', cantidad: 320, unidad: 'g (crudo)', categoria: 'Despensa', peso: 5 },
      { nombre: 'Calabacín', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Pimiento rojo', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Zanahoria', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 2 },
      { nombre: 'Cebolla', cantidad: 1, unidad: 'ud', categoria: 'Verduras', peso: 2 },
      { nombre: 'Ajo', cantidad: 2, unidad: 'dientes', categoria: 'Verduras', peso: 2 },
      { nombre: 'Salsa de soja', cantidad: 20, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 60, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Sartén', 'Cacerola'],
    pasos: [
      'Cuece el arroz en agua con sal según las indicaciones del paquete y escúrrelo.',
      'Corta el tofu en dados, sécalo con papel de cocina y dóralo en una sartén con la mitad del aceite. Reserva.',
      'En la misma sartén, saltea la cebolla y el ajo picados 2 minutos.',
      'Añade el calabacín, el pimiento y la zanahoria en tiras y saltea 6-7 minutos hasta que estén al dente.',
      'Incorpora el tofu y el arroz, aliña con la salsa de soja y el aceite restante y saltea todo 2 minutos más.',
      'Corrige de sal y sirve caliente.'
    ]
  },
  {
    id: 'receta-13',
    nombre: 'Heura al ajillo con patatas panadera',
    descripcion: 'Tiras de proteína vegetal salteadas con ajo y perejil, acompañadas de patatas panadera al horno. Plato único sabroso y sin carne.',
    tiempo: '40 min',
    porciones_base: 4,
    imagen: 'plato-heura-ajillo.jpg',
    ingredientes: [
      { nombre: 'Heura', cantidad: 550, unidad: 'g', categoria: 'Proteínas', peso: 5 },
      { nombre: 'Patatas', cantidad: 1000, unidad: 'g', categoria: 'Verduras', peso: 5 },
      { nombre: 'Ajo', cantidad: 6, unidad: 'dientes', categoria: 'Verduras', peso: 3 },
      { nombre: 'Perejil', cantidad: 1, unidad: 'cucharadita', categoria: 'Especias', peso: 2 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 90, unidad: 'ml', categoria: 'Despensa', peso: 3 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 },
      { nombre: 'Pimienta negra', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Sartén', 'Horno'],
    pasos: [
      'Precalienta el horno a 200 °C. Corta las patatas en rodajas y colócalas en una bandeja con la mitad del aceite, sal y pimienta.',
      'Hornea las patatas 25-30 minutos, dándoles la vuelta a mitad de cocción.',
      'Mientras tanto, lamina el ajo y sofríelo en una sartén con el resto del aceite a fuego suave.',
      'Añade la Heura y saltea 5-6 minutos hasta que se dore.',
      'Espolvorea el perejil picado, mezcla y sirve con las patatas panadera.'
    ]
  },
  {
    id: 'receta-14',
    nombre: 'Alubias blancas estofadas con verduras',
    descripcion: 'Guiso tradicional de alubias blancas con sofrito de verduras, pimentón y laurel. Cuchara de las de siempre, lista en 40 minutos.',
    tiempo: '40 min',
    porciones_base: 4,
    imagen: 'plato-alubias-blancas.jpg',
    ingredientes: [
      { nombre: 'Alubias blancas', cantidad: 900, unidad: 'g cocidas', categoria: 'Proteínas', peso: 5 },
      { nombre: 'Patatas', cantidad: 400, unidad: 'g', categoria: 'Verduras', peso: 3 },
      { nombre: 'Cebolla', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Pimiento verde', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Zanahoria', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 2 },
      { nombre: 'Ajo', cantidad: 4, unidad: 'dientes', categoria: 'Verduras', peso: 2 },
      { nombre: 'Tomate frito', cantidad: 400, unidad: 'ml', categoria: 'Despensa', peso: 3 },
      { nombre: 'Pimentón dulce', cantidad: 1, unidad: 'cucharadita', categoria: 'Especias', peso: 2 },
      { nombre: 'Laurel', cantidad: 1, unidad: 'hoja', categoria: 'Especias', peso: 1 },
      { nombre: 'Caldo de verduras', cantidad: 400, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 60, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Cacerola', 'Cuchara de madera'],
    pasos: [
      'Pica la cebolla, el pimiento verde, la zanahoria y el ajo.',
      'Sofríe las verduras en una cacerola con aceite a fuego medio durante 8 minutos.',
      'Añade el pimentón, remueve rápido y agrega el tomate frito. Cocina 3 minutos.',
      'Incorpora las alubias escurridas, la patata en dados, el laurel y el caldo. Salpimenta.',
      'Cocina a fuego medio 20 minutos hasta que la patata esté tierna y la salsa espese.',
      'Retira el laurel y sirve caliente.'
    ]
  },
  {
    id: 'receta-15',
    nombre: 'Macarrones con tomate y huevo duro',
    descripcion: 'Macarrones con un sofrito de tomate casero y huevo duro. Cocina de siempre, económica y lista en media hora.',
    tiempo: '30 min',
    porciones_base: 4,
    imagen: 'plato-macarrones-tomate.jfif',
    ingredientes: [
      { nombre: 'Macarrones', cantidad: 420, unidad: 'g', categoria: 'Despensa', peso: 5 },
      { nombre: 'Tomate frito', cantidad: 500, unidad: 'ml', categoria: 'Despensa', peso: 4 },
      { nombre: 'Huevos', cantidad: 4, unidad: 'ud', categoria: 'Proteínas', peso: 4 },
      { nombre: 'Cebolla', cantidad: 1, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Ajo', cantidad: 2, unidad: 'dientes', categoria: 'Verduras', peso: 2 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 40, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Orégano', cantidad: 1, unidad: 'cucharadita', categoria: 'Especias', peso: 2 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Cacerola', 'Sartén'],
    pasos: [
      'Cuece los macarrones en abundante agua con sal hasta que estén al dente. Escurre.',
      'Cuece los huevos 10 minutos, refresca y pela. Reserva.',
      'Pica la cebolla y el ajo y sofríelos en una sartén con aceite.',
      'Añade el tomate frito y el orégano y cocina 8 minutos a fuego suave.',
      'Mezcla la pasta con la salsa y sirve con el huevo duro cortado en cuartos.'
    ]
  },
  {
    id: 'receta-16',
    nombre: 'Ensaladilla rusa sin atún',
    descripcion: 'Ensaladilla rusa de toda la vida, sin atún: patata, zanahoria, guisantes y huevo con una mayonesa suave. Ideal para el táper.',
    tiempo: '45 min',
    porciones_base: 4,
    imagen: 'plato-ensaladilla-rusa.webp',
    ingredientes: [
      { nombre: 'Patatas', cantidad: 900, unidad: 'g', categoria: 'Verduras', peso: 5 },
      { nombre: 'Zanahoria', cantidad: 3, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Guisantes', cantidad: 200, unidad: 'g', categoria: 'Verduras', peso: 3 },
      { nombre: 'Huevos', cantidad: 6, unidad: 'ud', categoria: 'Proteínas', peso: 4 },
      { nombre: 'Mayonesa', cantidad: 160, unidad: 'g', categoria: 'Despensa', peso: 4 },
      { nombre: 'Aceitunas', cantidad: 80, unidad: 'g', categoria: 'Despensa', peso: 2 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Cacerola', 'Bol'],
    pasos: [
      'Cuece las patatas y las zanahorias peladas en agua con sal durante 20 minutos, hasta que estén tiernas.',
      'Cuece los guisantes los últimos 5 minutos y los huevos 10 minutos aparte.',
      'Escurre todo y deja enfriar. Corta la patata y la zanahoria en dados pequeños.',
      'Pela los huevos y pica dos de ellos; el tercero resérvalo para decorar.',
      'Mezcla en un bol las patatas, la zanahoria, los guisantes, el huevo picado y la mayonesa.',
      'Salpimenta, decora con el huevo restante y las aceitunas y deja reposar en frío 30 minutos.'
    ]
  },
  {
    id: 'receta-17',
    nombre: 'Croquetas de setas al horno con ensalada',
    descripcion: 'Croquetas caseras de setas y bechamel, horneadas en lugar de fritas, con una ensalada fresca de lechuga y tomate.',
    tiempo: '55 min',
    porciones_base: 4,
    imagen: 'plato-croquetas-setas.avif',
    ingredientes: [
      { nombre: 'Setas', cantidad: 600, unidad: 'g', categoria: 'Verduras', peso: 5 },
      { nombre: 'Cebolla', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Harina de trigo', cantidad: 120, unidad: 'g', categoria: 'Despensa', peso: 3 },
      { nombre: 'Leche', cantidad: 800, unidad: 'ml', categoria: 'Lácteos', peso: 3 },
      { nombre: 'Mantequilla', cantidad: 60, unidad: 'g', categoria: 'Lácteos', peso: 2 },
      { nombre: 'Pan rallado', cantidad: 140, unidad: 'g', categoria: 'Despensa', peso: 3 },
      { nombre: 'Huevos', cantidad: 3, unidad: 'ud', categoria: 'Proteínas', peso: 2 },
      { nombre: 'Lechuga', cantidad: 100, unidad: 'g', categoria: 'Verduras', peso: 2 },
      { nombre: 'Tomate', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 2 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 40, unidad: 'ml', categoria: 'Despensa', peso: 1 },
      { nombre: 'Nuez moscada', cantidad: 1, unidad: 'pizca', categoria: 'Especias', peso: 1 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 },
      { nombre: 'Pimienta negra', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Sartén', 'Horno', 'Bol'],
    pasos: [
      'Pica la cebolla y las setas y sofríelas en una sartén con la mantequilla durante 8 minutos.',
      'Añade la harina y cocina 1 minuto. Vierte la leche caliente poco a poco sin dejar de remover hasta espesar.',
      'Sazona con sal, pimienta y nuez moscada y deja enfriar la masa en la nevera al menos 30 minutos.',
      'Precalienta el horno a 200 °C. Forma las croquetas con dos cucharas, pásalas por huevo batido y pan rallado.',
      'Colócalas en una bandeja con papel de horno, pincélalas con aceite y hornéalas 15-20 minutos hasta que se doren.',
      'Sirve con la lechuga y el tomate aliñados con aceite y sal.'
    ]
  },
  {
    id: 'receta-18',
    nombre: 'Revuelto de setas y ajos tiernos con pan integral',
    descripcion: 'Revuelto jugoso de setas y ajos tiernos con un toque de queso, acompañado de pan integral tostado. Cena rápida y sabrosa.',
    tiempo: '25 min',
    porciones_base: 4,
    imagen: 'plato-revuelto-setas.jfif',
    ingredientes: [
      { nombre: 'Setas', cantidad: 600, unidad: 'g', categoria: 'Verduras', peso: 5 },
      { nombre: 'Huevos', cantidad: 10, unidad: 'ud', categoria: 'Proteínas', peso: 5 },
      { nombre: 'Ajetes', cantidad: 200, unidad: 'g', categoria: 'Verduras', peso: 3 },
      { nombre: 'Queso rallado', cantidad: 150, unidad: 'g', categoria: 'Lácteos', peso: 2 },
      { nombre: 'Pan integral', cantidad: 8, unidad: 'rebanadas', categoria: 'Despensa', peso: 2 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 50, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Perejil', cantidad: 1, unidad: 'cucharadita', categoria: 'Especias', peso: 1 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 },
      { nombre: 'Pimienta negra', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Sartén', 'Bol'],
    pasos: [
      'Limpia las setas y córtalas en trozos. Corta los ajos tiernos en rodajas.',
      'Saltea los ajos tiernos en una sartén con aceite 2 minutos y añade las setas. Cocina 6-8 minutos a fuego fuerte.',
      'Bate los huevos con sal y pimienta y viértelos sobre las setas. Remueve con suavidad hasta cuajar.',
      'Añade el queso rallado, mezcla y espolvorea el perejil.',
      'Tuesta el pan integral y sirve el revuelto caliente con las tostadas.'
    ]
  },
  {
    id: 'receta-19',
    nombre: 'Fajitas de falafel con verduras y salsa de yogur',
    descripcion: 'Tortillas de trigo rellenas de falafel crujiente, verduras salteadas y una salsa fresca de yogur y limón. Cena informal lista en 25 minutos.',
    tiempo: '25 min',
    porciones_base: 4,
    imagen: 'plato-fajitas-falafel.jfif',
    ingredientes: [
      { nombre: 'Tortillas de trigo', cantidad: 8, unidad: 'ud', categoria: 'Despensa', peso: 5 },
      { nombre: 'Falafel', cantidad: 16, unidad: 'ud', categoria: 'Proteínas', peso: 5 },
      { nombre: 'Pimiento rojo', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Cebolla', cantidad: 1, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Lechuga', cantidad: 150, unidad: 'g', categoria: 'Verduras', peso: 2 },
      { nombre: 'Yogur griego natural', cantidad: 200, unidad: 'g', categoria: 'Lácteos', peso: 2 },
      { nombre: 'Limón', cantidad: 1, unidad: 'ud', categoria: 'Verduras', peso: 2 },
      { nombre: 'Comino molido', cantidad: 0.5, unidad: 'cucharadita', categoria: 'Especias', peso: 2 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 40, unidad: 'ml', categoria: 'Despensa', peso: 1 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Sartén', 'Bol'],
    pasos: [
      'Mezcla el yogur con el zumo de limón, una pizca de comino y sal. Reserva la salsa en frío.',
      'Corta el pimiento y la cebolla en tiras y saltea 6 minutos con el aceite.',
      'Calienta el falafel en la sartén o en el horno según el envase hasta que esté crujiente.',
      'Calienta las tortillas un minuto por cada lado.',
      'Rellena cada tortilla con lechuga, verduras salteadas y falafel, y termina con la salsa de yogur.',
      'Enrolla y sirve inmediatamente.'
    ]
  },
  {
    id: 'receta-20',
    nombre: 'Empanadillas de espinacas y queso al horno',
    descripcion: 'Empanadillas caseras de espinacas, queso y nueces, horneadas hasta quedar doradas. Un clásico para compartir o para el táper.',
    tiempo: '45 min',
    porciones_base: 4,
    imagen: 'plato-empanadillas-espinacas.jpg',
    ingredientes: [
      { nombre: 'Masa de empanadilla', cantidad: 14, unidad: 'ud', categoria: 'Despensa', peso: 5 },
      { nombre: 'Espinacas', cantidad: 500, unidad: 'g', categoria: 'Verduras', peso: 5 },
      { nombre: 'Queso rallado', cantidad: 250, unidad: 'g', categoria: 'Lácteos', peso: 4 },
      { nombre: 'Cebolla', cantidad: 1, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Nueces', cantidad: 40, unidad: 'g', categoria: 'Despensa', peso: 2 },
      { nombre: 'Ajo', cantidad: 3, unidad: 'dientes', categoria: 'Verduras', peso: 2 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 40, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 },
      { nombre: 'Pimienta negra', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Horno', 'Sartén', 'Bol'],
    pasos: [
      'Precalienta el horno a 200 °C. Pica la cebolla y el ajo y sofríelos en una sartén con aceite.',
      'Añade las espinacas y cocina hasta que pierdan el agua. Escurre bien y salpimenta.',
      'Mezcla las espinacas con el queso rallado y las nueces picadas.',
      'Reparte el relleno en el centro de cada disco de masa, humedece el borde y ciérralo con un tenedor.',
      'Coloca las empanadillas en una bandeja con papel de horno y píntalas con un poco de aceite.',
      'Hornea 15-18 minutos hasta que estén doradas y sirve templadas.'
    ]
  },
  {
    id: 'receta-21',
    nombre: 'Dal de lentejas rojas con arroz basmati',
    descripcion: 'Guiso cremoso de lentejas rojas con especias, tomate y leche de coco, servido con arroz basmati y yogur griego.',
    tiempo: '35 min',
    porciones_base: 4,
    imagen: 'plato-dal-lentejas-rojas.jpg',
    ingredientes: [
      { nombre: 'Lentejas', cantidad: 400, unidad: 'g', categoria: 'Despensa', peso: 5 },
      { nombre: 'Arroz', cantidad: 240, unidad: 'g', categoria: 'Despensa', peso: 5 },
      { nombre: 'Yogur griego natural', cantidad: 500, unidad: 'g', categoria: 'Lácteos', peso: 4 },
      { nombre: 'Leche de coco', cantidad: 120, unidad: 'ml', categoria: 'Despensa', peso: 3 },
      { nombre: 'Tomate', cantidad: 200, unidad: 'g', categoria: 'Verduras', peso: 3 },
      { nombre: 'Espinacas', cantidad: 150, unidad: 'g', categoria: 'Verduras', peso: 3 },
      { nombre: 'Cebolla', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Ajo', cantidad: 3, unidad: 'dientes', categoria: 'Verduras', peso: 2 },
      { nombre: 'Jengibre', cantidad: 20, unidad: 'g', categoria: 'Verduras', peso: 2 },
      { nombre: 'Cúrcuma', cantidad: 1, unidad: 'cucharadita', categoria: 'Despensa', peso: 1 },
      { nombre: 'Comino molido', cantidad: 1, unidad: 'cucharadita', categoria: 'Despensa', peso: 1 },
      { nombre: 'Curry en polvo', cantidad: 2, unidad: 'cucharaditas', categoria: 'Despensa', peso: 1 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 40, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Olla', 'Sartén'],
    pasos: [
      'Pica la cebolla, el ajo y el jengibre y sofríelos en una olla con el aceite hasta que la cebolla esté transparente.',
      'Añade la cúrcuma, el comino y el curry y remueve 30 segundos para que suelten aroma.',
      'Incorpora el tomate triturado y las lentejas rojas lavadas, y cubre con unos 1,2 litros de agua. Cocina 18-20 minutos removiendo de vez en cuando.',
      'Añade la leche de coco y las espinacas y cocina 3 minutos más. Rectifica de sal.',
      'Cuece el arroz basmati según las indicaciones del paquete.',
      'Sirve el dal sobre el arroz y acompaña cada ración con 125 g de yogur griego.'
    ]
  },
  {
    id: 'receta-22',
    nombre: 'Pad thai vegetariano con huevo y cacahuetes',
    descripcion: 'Fideos de arroz salteados al wok con tofu, huevo, brotes de soja y cacahuetes, con salsa agridulce de limón y soja.',
    tiempo: '40 min',
    porciones_base: 4,
    imagen: 'plato-pad-thai-vegetariano.jpg',
    ingredientes: [
      { nombre: 'Fideos de arroz', cantidad: 380, unidad: 'g', categoria: 'Despensa', peso: 5 },
      { nombre: 'Tofu', cantidad: 480, unidad: 'g', categoria: 'Proteínas', peso: 5 },
      { nombre: 'Huevos', cantidad: 6, unidad: 'ud', categoria: 'Proteínas', peso: 4 },
      { nombre: 'Cacahuetes', cantidad: 80, unidad: 'g', categoria: 'Despensa', peso: 3 },
      { nombre: 'Brotes de soja', cantidad: 320, unidad: 'g', categoria: 'Verduras', peso: 3 },
      { nombre: 'Zanahoria', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 2 },
      { nombre: 'Cebolleta', cantidad: 4, unidad: 'ud', categoria: 'Verduras', peso: 2 },
      { nombre: 'Ajo', cantidad: 2, unidad: 'dientes', categoria: 'Verduras', peso: 2 },
      { nombre: 'Salsa de soja', cantidad: 60, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Limón', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 2 },
      { nombre: 'Azúcar moreno', cantidad: 40, unidad: 'g', categoria: 'Despensa', peso: 1 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 20, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Guindilla en copos', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Wok o sartén grande', 'Olla'],
    pasos: [
      'Pon los fideos en remojo en agua caliente 8-10 minutos hasta que estén blandos pero firmes. Escúrrelos.',
      'Mezcla la salsa de soja, el zumo de los limones, el azúcar y la guindilla.',
      'Corta el tofu en dados y dóralo en el wok con la mitad del aceite. Resérvalo.',
      'Saltea el ajo, la cebolleta picada y la zanahoria en tiras con el resto del aceite 3 minutos.',
      'Aparta las verduras hacia un lado, añade los huevos batidos y remueve hasta que cuajen.',
      'Incorpora los fideos, el tofu y la salsa, y saltea 3 minutos. Añade los brotes de soja al final.',
      'Sirve con los cacahuetes troceados por encima y un gajo de limón.'
    ]
  },
  {
    id: 'receta-23',
    nombre: 'Paella de verduras con alcachofas',
    descripcion: 'Paella de arroz con alcachofas, judías verdes, guisantes y pimiento, reforzada con garbanzos y tofu.',
    tiempo: '50 min',
    porciones_base: 4,
    imagen: 'plato-paella-verduras-alcachofas.jpg',
    ingredientes: [
      { nombre: 'Arroz', cantidad: 320, unidad: 'g', categoria: 'Despensa', peso: 5 },
      { nombre: 'Garbanzos', cantidad: 400, unidad: 'g', categoria: 'Despensa', peso: 4 },
      { nombre: 'Tofu', cantidad: 400, unidad: 'g', categoria: 'Proteínas', peso: 5 },
      { nombre: 'Alcachofas', cantidad: 400, unidad: 'g', categoria: 'Verduras', peso: 4 },
      { nombre: 'Guisantes', cantidad: 240, unidad: 'g', categoria: 'Verduras', peso: 3 },
      { nombre: 'Judías verdes', cantidad: 150, unidad: 'g', categoria: 'Verduras', peso: 3 },
      { nombre: 'Pimiento rojo', cantidad: 1, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Tomate', cantidad: 200, unidad: 'g', categoria: 'Verduras', peso: 3 },
      { nombre: 'Ajo', cantidad: 3, unidad: 'dientes', categoria: 'Verduras', peso: 2 },
      { nombre: 'Caldo de verduras', cantidad: 1000, unidad: 'ml', categoria: 'Despensa', peso: 3 },
      { nombre: 'Pimentón dulce', cantidad: 1, unidad: 'cucharadita', categoria: 'Despensa', peso: 1 },
      { nombre: 'Azafrán', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 60, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 },
      { nombre: 'Limón', cantidad: 1, unidad: 'ud', categoria: 'Verduras', peso: 1 }
    ],
    equipamiento: ['Paellera o sartén ancha'],
    pasos: [
      'Calienta el aceite en la paellera y dora el tofu en dados. Resérvalo.',
      'Sofríe el ajo laminado, el pimiento troceado y las judías verdes 5 minutos. Añade las alcachofas y rehoga 3 minutos.',
      'Incorpora el tomate rallado y cocina hasta que se reduzca. Añade el pimentón y remueve rápido.',
      'Agrega el arroz y rehógalo 1 minuto. Vierte el caldo caliente con el azafrán y reparte bien el arroz.',
      'Cocina a fuego medio 12 minutos sin remover. Añade los garbanzos cocidos, los guisantes y el tofu a mitad de cocción.',
      'Deja reposar 5 minutos tapada con un paño y sirve con limón.'
    ]
  },
  {
    id: 'receta-24',
    nombre: 'Burritos de arroz, frijoles y maíz',
    descripcion: 'Burritos rellenos de arroz, frijoles negros, maíz, pimiento y queso fundido.',
    tiempo: '35 min',
    porciones_base: 4,
    imagen: 'plato-burritos-arroz-frijoles.jpg',
    ingredientes: [
      { nombre: 'Tortillas de trigo', cantidad: 8, unidad: 'ud', categoria: 'Despensa', peso: 5 },
      { nombre: 'Frijoles negros', cantidad: 600, unidad: 'g', categoria: 'Despensa', peso: 5 },
      { nombre: 'Arroz', cantidad: 120, unidad: 'g', categoria: 'Despensa', peso: 4 },
      { nombre: 'Queso rallado', cantidad: 140, unidad: 'g', categoria: 'Lácteos', peso: 4 },
      { nombre: 'Maíz', cantidad: 160, unidad: 'g', categoria: 'Verduras', peso: 3 },
      { nombre: 'Pimiento rojo', cantidad: 1, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Cebolla', cantidad: 1, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Tomate', cantidad: 100, unidad: 'g', categoria: 'Verduras', peso: 2 },
      { nombre: 'Comino molido', cantidad: 1, unidad: 'cucharadita', categoria: 'Despensa', peso: 1 },
      { nombre: 'Pimentón ahumado', cantidad: 1, unidad: 'cucharadita', categoria: 'Despensa', peso: 1 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 20, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Limón', cantidad: 1, unidad: 'ud', categoria: 'Verduras', peso: 1 },
      { nombre: 'Cilantro seco', cantidad: 1, unidad: 'cucharadita', categoria: 'Despensa', peso: 1 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Sartén', 'Olla'],
    pasos: [
      'Cuece el arroz y escúrrelo.',
      'Sofríe la cebolla y el pimiento picados en el aceite 6 minutos.',
      'Añade los frijoles cocidos, el maíz, el tomate triturado, el comino y el pimentón. Cocina 5 minutos y aplasta algunos frijoles para ligar.',
      'Mezcla el relleno con el arroz, el zumo de limón y el cilantro seco. Rectifica de sal.',
      'Calienta las tortillas, reparte el relleno y el queso, y enrolla cerrando los laterales.',
      'Dora los burritos 2 minutos por lado en una sartén seca hasta que el queso se funda.'
    ]
  },
  {
    id: 'receta-25',
    nombre: 'Shakshuka con feta y pan integral',
    descripcion: 'Huevos pochados en una salsa de tomate, pimiento y especias, con queso feta por encima y pan integral para mojar.',
    tiempo: '30 min',
    porciones_base: 4,
    imagen: 'plato-shakshuka.jpg',
    ingredientes: [
      { nombre: 'Huevos', cantidad: 12, unidad: 'ud', categoria: 'Proteínas', peso: 5 },
      { nombre: 'Queso feta', cantidad: 200, unidad: 'g', categoria: 'Lácteos', peso: 4 },
      { nombre: 'Pan integral', cantidad: 320, unidad: 'g', categoria: 'Despensa', peso: 4 },
      { nombre: 'Tomate', cantidad: 800, unidad: 'g', categoria: 'Verduras', peso: 4 },
      { nombre: 'Pimiento rojo', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Cebolla', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Ajo', cantidad: 3, unidad: 'dientes', categoria: 'Verduras', peso: 2 },
      { nombre: 'Comino molido', cantidad: 1, unidad: 'cucharadita', categoria: 'Despensa', peso: 1 },
      { nombre: 'Pimentón dulce', cantidad: 1, unidad: 'cucharadita', categoria: 'Despensa', peso: 1 },
      { nombre: 'Guindilla en copos', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 40, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Perejil', cantidad: 1, unidad: 'puñado', categoria: 'Verduras', peso: 1 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Sartén grande con tapa'],
    pasos: [
      'Sofríe la cebolla y el pimiento picados en el aceite 8 minutos. Añade el ajo laminado.',
      'Incorpora el comino, el pimentón y la guindilla, y remueve 30 segundos.',
      'Vierte el tomate triturado, salpimenta y cocina 10 minutos hasta que espese.',
      'Haz 12 huecos en la salsa y casca un huevo en cada uno.',
      'Tapa y cocina 5-6 minutos a fuego bajo hasta que las claras cuajen.',
      'Desmenuza el feta por encima, añade perejil y sirve con el pan integral tostado.'
    ]
  },
  {
    id: 'receta-26',
    nombre: 'Berenjena a la parmesana',
    descripcion: 'Berenjenas rebozadas con huevo y pan rallado, horneadas en capas con salsa de tomate, mozzarella y parmesano.',
    tiempo: '55 min',
    porciones_base: 4,
    imagen: 'plato-berenjena-parmesana.jpg',
    ingredientes: [
      { nombre: 'Berenjena', cantidad: 1200, unidad: 'g', categoria: 'Verduras', peso: 5 },
      { nombre: 'Mozzarella', cantidad: 400, unidad: 'g', categoria: 'Lácteos', peso: 5 },
      { nombre: 'Queso parmesano', cantidad: 100, unidad: 'g', categoria: 'Lácteos', peso: 4 },
      { nombre: 'Huevos', cantidad: 4, unidad: 'ud', categoria: 'Proteínas', peso: 4 },
      { nombre: 'Pan rallado', cantidad: 120, unidad: 'g', categoria: 'Despensa', peso: 3 },
      { nombre: 'Tomate', cantidad: 800, unidad: 'g', categoria: 'Verduras', peso: 4 },
      { nombre: 'Cebolla', cantidad: 1, unidad: 'ud', categoria: 'Verduras', peso: 2 },
      { nombre: 'Ajo', cantidad: 2, unidad: 'dientes', categoria: 'Verduras', peso: 2 },
      { nombre: 'Albahaca', cantidad: 1, unidad: 'puñado', categoria: 'Verduras', peso: 1 },
      { nombre: 'Orégano', cantidad: 1, unidad: 'cucharadita', categoria: 'Despensa', peso: 1 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 40, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Horno', 'Sartén', 'Bandeja o fuente de horno'],
    pasos: [
      'Precalienta el horno a 200 °C. Corta las berenjenas en rodajas de 1 cm.',
      'Pasa las rodajas por huevo batido y pan rallado, colócalas en una bandeja con papel de horno y hornea 15 minutos dándoles la vuelta a mitad.',
      'Sofríe la cebolla y el ajo picados con un poco de aceite, añade el tomate triturado y cocina 10 minutos con orégano y sal.',
      'En una fuente, alterna capas de salsa, berenjena, mozzarella en lonchas y parmesano rallado.',
      'Hornea 20 minutos hasta que el queso gratine.',
      'Deja reposar 5 minutos y sirve con albahaca fresca.'
    ]
  },
  {
    id: 'receta-27',
    nombre: 'Pizza de verduras asadas y queso de cabra',
    descripcion: 'Dos pizzas finas con masa rápida de harina y yogur griego, cubiertas con verduras asadas, mozzarella y queso de cabra.',
    tiempo: '50 min',
    porciones_base: 4,
    imagen: 'plato-pizza-verduras-queso-cabra.jpg',
    ingredientes: [
      { nombre: 'Harina de trigo', cantidad: 320, unidad: 'g', categoria: 'Despensa', peso: 5 },
      { nombre: 'Yogur griego natural', cantidad: 240, unidad: 'g', categoria: 'Lácteos', peso: 4 },
      { nombre: 'Queso de cabra', cantidad: 200, unidad: 'g', categoria: 'Lácteos', peso: 4 },
      { nombre: 'Mozzarella', cantidad: 240, unidad: 'g', categoria: 'Lácteos', peso: 4 },
      { nombre: 'Calabacín', cantidad: 1, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Pimiento rojo', cantidad: 1, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Cebolla', cantidad: 1, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Tomate', cantidad: 320, unidad: 'g', categoria: 'Verduras', peso: 3 },
      { nombre: 'Levadura química', cantidad: 2, unidad: 'cucharaditas', categoria: 'Despensa', peso: 1 },
      { nombre: 'Orégano', cantidad: 1, unidad: 'cucharadita', categoria: 'Despensa', peso: 1 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 30, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Horno', 'Bandeja de horno'],
    pasos: [
      'Precalienta el horno a 220 °C. Corta el calabacín, el pimiento y la cebolla en tiras, mézclalos con la mitad del aceite y ásalos 15 minutos.',
      'Mezcla la harina, la levadura, una pizca de sal y el yogur hasta formar una masa. Amasa 2 minutos y divídela en 2 bolas.',
      'Estira cada bola muy fina sobre papel de horno y hornéala 5 minutos sola.',
      'Unta el tomate triturado con orégano y sal, reparte la mozzarella y las verduras asadas.',
      'Desmenuza el queso de cabra por encima y rocía con el aceite restante.',
      'Hornea 8-10 minutos hasta que los bordes estén dorados y el queso burbujee.'
    ]
  },
  {
    id: 'receta-28',
    nombre: 'Pisto manchego con huevo frito',
    descripcion: 'Pisto casero de calabacín, pimiento, tomate y cebolla con huevos fritos, queso manchego rallado y pan integral.',
    tiempo: '45 min',
    porciones_base: 4,
    imagen: 'plato-pisto-manchego-huevo.jpg',
    ingredientes: [
      { nombre: 'Huevos', cantidad: 12, unidad: 'ud', categoria: 'Proteínas', peso: 5 },
      { nombre: 'Pan integral', cantidad: 360, unidad: 'g', categoria: 'Despensa', peso: 4 },
      { nombre: 'Queso manchego', cantidad: 100, unidad: 'g', categoria: 'Lácteos', peso: 4 },
      { nombre: 'Calabacín', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 4 },
      { nombre: 'Pimiento rojo', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Pimiento verde', cantidad: 1, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Tomate', cantidad: 600, unidad: 'g', categoria: 'Verduras', peso: 4 },
      { nombre: 'Cebolla', cantidad: 2, unidad: 'ud', categoria: 'Verduras', peso: 3 },
      { nombre: 'Ajo', cantidad: 2, unidad: 'dientes', categoria: 'Verduras', peso: 2 },
      { nombre: 'Aceite de oliva virgen extra', cantidad: 40, unidad: 'ml', categoria: 'Despensa', peso: 2 },
      { nombre: 'Sal', cantidad: 1, unidad: 'pizca', categoria: 'Despensa', peso: 1 }
    ],
    equipamiento: ['Sartén grande', 'Sartén antiadherente'],
    pasos: [
      'Pica la cebolla, los pimientos y el calabacín en dados pequeños.',
      'Sofríe la cebolla y el pimiento con la mitad del aceite 10 minutos a fuego medio. Añade el ajo picado y el calabacín y cocina 8 minutos más.',
      'Incorpora el tomate rallado, sala y cocina a fuego bajo 15 minutos hasta que espese.',
      'Fríe los huevos en una sartén antiadherente con el aceite restante.',
      'Sirve el pisto con los huevos fritos encima, el manchego rallado y el pan integral tostado.'
    ]
  }
];

// Se materializa el peso en cada ingrediente de las recetas por defecto para
// que viaje con los datos (localStorage, .txt y coincidencia del recetario).
DEFAULT_RECIPES.forEach(receta => {
  receta.ingredientes.forEach(ingrediente => {
    if (typeof ingrediente.peso !== 'number') {
      ingrediente.peso = pesoPorDefecto(receta.id, ingrediente);
    }
  });
});

class App {
  constructor() {
    this.recetas = [];
    this.ingredientes = {};
    this.semana = {};
    this.dias = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
    this.diasLargos = { LUN: 'Lunes', MAR: 'Martes', MIÉ: 'Miércoles', JUE: 'Jueves', VIE: 'Viernes', SÁB: 'Sábado', DOM: 'Domingo' };
    this.comidas = ['COMIDA', 'CENA'];
    this.recetaDetalleActual = null;
    this.slotElegir = null;
    // Edición de recetas
    this.recetaEnEdicion = null;
    this.ingredientesForm = new Map();
    this.handlesTxt = {};
    this.preferencias = { vegetariano: true };
  }

  // ---------------------------------------------------------------- arranque
  init() {
    this.cargarDatos();
    this.bindGlobalEvents();
    // Se compara el nombre del archivo, no una subcadena de la ruta: así una
    // carpeta llamada "recetario" o "auditoria" no cambia de página.
    const pagina = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (pagina === 'recetario.html') {
      this.renderRecetario();
    } else if (pagina === 'auditoria.html') {
      this.renderAuditoria();
    } else {
      this.renderIndex();
    }
  }

  // ------------------------------------------------------------ persistencia
  leerJSON(clave, porDefecto) {
    try {
      const valor = localStorage.getItem(clave);
      return valor ? JSON.parse(valor) : porDefecto;
    } catch (error) {
      console.warn('No se pudo leer', clave, error);
      return porDefecto;
    }
  }

  leerVersion() {
    try {
      return localStorage.getItem(STORAGE_VERSION);
    } catch (error) {
      console.warn('No se pudo leer la versión de los datos.', error);
      return null;
    }
  }

  // La despensa guardada es del usuario: no se reinyectan ingredientes que
  // haya eliminado. Solo se sanea la estructura.
  normalizarDespensa(guardados) {
    if (!guardados || typeof guardados !== 'object' || Array.isArray(guardados)) return null;
    const limpia = {};
    Object.entries(guardados).forEach(([categoria, lista]) => {
      if (!Array.isArray(lista)) return;
      const nueva = [];
      lista.forEach(nombre => {
        if (typeof nombre !== 'string' || !nombre) return;
        const renombrado = RENOMBRAR_INGREDIENTES[nombre] || nombre;
        if (!nueva.includes(renombrado)) nueva.push(renombrado);
      });
      if (nueva.length) limpia[categoria] = nueva;
    });
    return Object.keys(limpia).length ? limpia : null;
  }

  cargarDatos() {
    const guardadas = this.leerJSON(STORAGE_RECIPES, []);
    const ingredientesGuardados = this.normalizarDespensa(this.leerJSON(STORAGE_INGREDIENTS, null));
    const version = this.leerVersion();
    const listaGuardada = Array.isArray(guardadas) ? guardadas : [];
    const esPorDefecto = (id) => DEFAULT_RECIPES.some(r => r.id === id);
    const creadasPorUsuario = listaGuardada.filter(r => r && !esPorDefecto(r.id));

    if (version !== DATA_VERSION) {
      // Migración: se conservan las recetas editadas y las creadas por el
      // usuario. La despensa guardada NO se vuelve a fusionar con la inicial:
      // si el usuario quitó un ingrediente, debe seguir fuera.
      const editadasPorUsuario = listaGuardada.filter(r => r && esPorDefecto(r.id) && r.editada);
      const porDefecto = DEFAULT_RECIPES.filter(def => !editadasPorUsuario.some(r => r.id === def.id));
      this.recetas = [...porDefecto, ...editadasPorUsuario, ...creadasPorUsuario];
      this.ingredientes = ingredientesGuardados || despensaInicial();
    } else {
      const faltan = DEFAULT_RECIPES.filter(def => !listaGuardada.some(r => r.id === def.id));
      this.recetas = [...listaGuardada, ...faltan];
      this.ingredientes = ingredientesGuardados || despensaInicial();
    }

    // Normalización: todas las recetas llevan cantidad, unidad, categoría y peso
    this.recetas = this.recetas.map(receta => this.normalizarReceta(receta));
    this.cargarPreferencias();

    // El menú semanal se lee ANTES de guardar nada: si se guardara primero,
    // guardarDatos() escribiría this.semana = {} y borraría el menú del usuario.
    const semanaGuardada = this.leerJSON(STORAGE_WEEK, {});
    this.semana = {};
    Object.entries(semanaGuardada || {}).forEach(([clave, valor]) => {
      const entrada = typeof valor === 'string' ? { recetaId: valor, deAyer: false } : valor;
      if (entrada && this.recetaPorId(entrada.recetaId)) {
        this.semana[clave] = { recetaId: entrada.recetaId, deAyer: !!entrada.deAyer };
      }
    });

    if (version !== DATA_VERSION) this.guardarDatos();
  }

  fusionarIngredientes(base, guardados) {
    const resultado = {};
    Object.entries(base).forEach(([categoria, lista]) => { resultado[categoria] = [...lista]; });
    if (guardados && typeof guardados === 'object') {
      Object.entries(guardados).forEach(([categoria, lista]) => {
        if (!Array.isArray(lista)) return;
        if (!resultado[categoria]) resultado[categoria] = [];
        lista.forEach(ing => { if (!resultado[categoria].includes(ing)) resultado[categoria].push(ing); });
      });
    }
    return resultado;
  }

  // Rellena los campos que falten (incluido el peso) y descarta datos corruptos.
  normalizarReceta(receta) {
    if (!receta || typeof receta !== 'object') return receta;
    const limpia = { ...receta };
    limpia.nombre = String(limpia.nombre || 'Receta sin nombre');
    limpia.descripcion = String(limpia.descripcion || '');
    limpia.tiempo = String(limpia.tiempo || '30 min');
    limpia.porciones_base = Math.max(1, parseInt(limpia.porciones_base, 10) || 4);
    limpia.imagen = typeof limpia.imagen === 'string' ? limpia.imagen : '';
    limpia.equipamiento = Array.isArray(limpia.equipamiento) ? [...limpia.equipamiento] : [];
    limpia.pasos = Array.isArray(limpia.pasos) ? [...limpia.pasos] : [];
    limpia.ingredientes = (Array.isArray(limpia.ingredientes) ? limpia.ingredientes : [])
      .filter(ing => ing && ing.nombre)
      .map(ing => this.normalizarIngrediente(limpia.id, ing));
    return limpia;
  }

  normalizarIngrediente(recetaId, ingrediente) {
    const nombreOriginal = String(ingrediente.nombre || '').trim();
    const nombre = RENOMBRAR_INGREDIENTES[nombreOriginal] || nombreOriginal;
    const cantidad = Number(ingrediente.cantidad);
    const unidad = String(ingrediente.unidad || 'ud').trim() || 'ud';
    const normalizado = {
      nombre,
      cantidad: Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1,
      unidad,
      categoria: ingrediente.categoria || this.categoriaDe(nombre)
    };
    const peso = Number(ingrediente.peso);
    normalizado.peso = Number.isFinite(peso)
      ? Math.min(PESO_MAX, Math.max(PESO_MIN, Math.round(peso)))
      : pesoPorDefecto(recetaId, normalizado);
    return normalizado;
  }

  categoriaDe(nombre) {
    for (const [categoria, lista] of Object.entries(this.catalogoIngredientes())) {
      if (lista.includes(nombre)) return categoria;
    }
    return 'Despensa';
  }

  // Peso (importancia) de un ingrediente dentro de su receta, entre 1 y 5.
  pesoDe(ingrediente) {
    const peso = Number(ingrediente && ingrediente.peso);
    if (Number.isFinite(peso) && peso >= PESO_MIN) return Math.min(PESO_MAX, Math.round(peso));
    return pesoInferido(ingrediente);
  }

  // Coincidencia del filtro: cobertura ponderada estirada + plus por
  // protagonistas. Así un ingrediente principal se reconoce de un vistazo.
  calcularCoincidencia(receta, seleccionados) {
    const conjunto = new Set(seleccionados || []);
    let pesoCoincide = 0;
    let pesoTotal = 0;
    let coincidencias = 0;
    let protagonistas = 0;
    (receta.ingredientes || []).forEach(ing => {
      const peso = this.pesoDe(ing);
      pesoTotal += peso;
      if (conjunto.has(ing.nombre)) {
        pesoCoincide += peso;
        coincidencias += 1;
        if (peso >= PESO_PROTAGONISTA) protagonistas += 1;
      }
    });
    const cobertura = pesoTotal ? pesoCoincide / pesoTotal : 0;
    const puntuacion = Math.min(1, cobertura * FACTOR_COINCIDENCIA + protagonistas * BONUS_PROTAGONISTA);
    return {
      puntuacion,
      cobertura,
      pesoCoincide,
      pesoTotal,
      coincidencias,
      protagonistas,
      total: (receta.ingredientes || []).length
    };
  }

  guardarDatos() {
    try {
      localStorage.setItem(STORAGE_RECIPES, JSON.stringify(this.recetas));
      localStorage.setItem(STORAGE_INGREDIENTS, JSON.stringify(this.ingredientes));
      localStorage.setItem(STORAGE_WEEK, JSON.stringify(this.semana));
      localStorage.setItem(STORAGE_VERSION, DATA_VERSION);
    } catch (error) {
      console.warn('No se pudieron guardar los datos en el navegador.', error);
      if (!this.avisoAlmacenMostrado) {
        this.avisoAlmacenMostrado = true;
        alert('No se pudieron guardar los datos: el almacenamiento del navegador está lleno o deshabilitado. La app seguirá funcionando, pero los cambios no se conservarán.');
      }
    }
  }

  // -------------------------------------------------------------- utilidades
  esc(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  recetaPorId(id) {
    return this.recetas.find(r => r.id === id) || null;
  }

  minutosDe(tiempo) {
    const minutos = parseInt(String(tiempo || ''), 10);
    return Number.isNaN(minutos) ? 0 : minutos;
  }

  formatearCantidad(valor) {
    const redondeado = Math.round(Number(valor) * 10) / 10;
    return Number.isInteger(redondeado) ? String(redondeado) : redondeado.toFixed(1).replace('.', ',');
  }

  // --------------------------------------------------------------- nutrición
  nutricionIngrediente(nombre) {
    const datos = datosNutricion();
    if (!datos || !datos.ingredientes) return null;
    return datos.ingredientes[nombre] || null;
  }

  // Convierte la cantidad de un ingrediente a gramos para poder calcular kcal.
  gramosIngrediente(ingrediente) {
    const info = this.nutricionIngrediente(ingrediente.nombre);
    const datos = datosNutricion();
    const unidades = (datos && datos.unidades) || {};
    const cantidad = Number(ingrediente.cantidad) || 0;
    const unidad = String(ingrediente.unidad || '').toLowerCase().trim();

    if (/^kg\b/.test(unidad)) return cantidad * 1000;
    if (/^(g|gr|ml|cc)\b/.test(unidad)) return cantidad;
    if (/^l\b/.test(unidad)) return cantidad * 1000;

    const claves = Object.keys(unidades).sort((a, b) => b.length - a.length);
    for (const clave of claves) {
      if (unidad.includes(clave)) return cantidad * unidades[clave];
    }
    const gramos = info && Number(info.gramosPorUnidad) > 0 ? Number(info.gramosPorUnidad) : 100;
    return cantidad * gramos;
  }

  redondear(valor) {
    return Math.round((Number(valor) || 0) * 10) / 10;
  }

  kcalReceta(receta) {
    if (!receta) return 0;
    const porciones = Math.max(1, receta.porciones_base || 1);
    if (Number(receta.kcalPorRacion) > 0) return Math.round(Number(receta.kcalPorRacion) * porciones);
    const total = (receta.ingredientes || []).reduce((suma, ing) => {
      const info = this.nutricionIngrediente(ing.nombre);
      if (!info) return suma;
      return suma + (this.gramosIngrediente(ing) * (Number(info.kcal) || 0)) / 100;
    }, 0);
    return Math.round(total);
  }

  kcalPorRacion(receta) {
    if (!receta) return 0;
    if (Number(receta.kcalPorRacion) > 0) return Math.round(Number(receta.kcalPorRacion));
    return Math.round(this.kcalReceta(receta) / Math.max(1, receta.porciones_base || 1));
  }

  macrosReceta(receta) {
    const total = { proteina: 0, hidratos: 0, grasa: 0, fibra: 0 };
    (receta && receta.ingredientes ? receta.ingredientes : []).forEach(ing => {
      const info = this.nutricionIngrediente(ing.nombre);
      if (!info) return;
      const gramos = this.gramosIngrediente(ing);
      total.proteina += (gramos * (Number(info.proteina) || 0)) / 100;
      total.hidratos += (gramos * (Number(info.hidratos) || 0)) / 100;
      total.grasa += (gramos * (Number(info.grasa) || 0)) / 100;
      total.fibra += (gramos * (Number(info.fibra) || 0)) / 100;
    });
    const porciones = Math.max(1, (receta && receta.porciones_base) || 1);
    return {
      total: {
        proteina: this.redondear(total.proteina),
        hidratos: this.redondear(total.hidratos),
        grasa: this.redondear(total.grasa),
        fibra: this.redondear(total.fibra)
      },
      porRacion: {
        proteina: this.redondear(total.proteina / porciones),
        hidratos: this.redondear(total.hidratos / porciones),
        grasa: this.redondear(total.grasa / porciones),
        fibra: this.redondear(total.fibra / porciones)
      }
    };
  }

  perfilKcal(kcal) {
    const datos = datosNutricion();
    const limites = (datos && datos.perfiles) || { ligera: 450, equilibrada: 650 };
    if (kcal <= limites.ligera) return { clave: 'ligera', etiqueta: 'Ligera', icono: '🟢' };
    if (kcal <= limites.equilibrada) return { clave: 'equilibrada', etiqueta: 'Equilibrada', icono: '🟡' };
    return { clave: 'contundente', etiqueta: 'Contundente', icono: '🔴' };
  }

  tipoReceta(receta) {
    if (!receta) return 'otro';
    if (receta.tipo) return receta.tipo;
    const datos = datosNutricion();
    const meta = datos && datos.recetas ? datos.recetas[receta.id] : null;
    if (meta && meta.tipo) return meta.tipo;
    const grupos = (receta.ingredientes || []).map(ing => {
      const info = this.nutricionIngrediente(ing.nombre);
      return info ? info.grupo : '';
    });
    if (grupos.includes('legumbre')) return 'legumbre';
    if (grupos.includes('cereal')) return 'cereal';
    if (grupos.includes('huevo')) return 'huevo';
    if (grupos.includes('proteina')) return 'proteina';
    if (grupos.includes('tuberculo')) return 'tuberculo';
    if (grupos.includes('verdura')) return 'verdura';
    return 'otro';
  }

  esVegetariana(receta) {
    if (!receta) return true;
    // Si lleva carne/pescado, no es vegetariana aunque la casilla diga que sí.
    if (this.ingredientesNoVegetarianos(receta.ingredientes).length) return false;
    if (typeof receta.vegetariano === 'boolean') return receta.vegetariano;
    const datos = datosNutricion();
    const meta = datos && datos.recetas ? datos.recetas[receta.id] : null;
    if (meta && typeof meta.vegetariano === 'boolean') return meta.vegetariano;
    return true;
  }

  // Devuelve los ingredientes que impiden que una receta sea vegetariana.
  ingredientesNoVegetarianos(ingredientes) {
    const datos = datosNutricion() || {};
    const lista = datos.noVegetarianos || ['Albóndigas de ternera', 'Pollo'];
    return (ingredientes || []).filter(ing => {
      if (lista.includes(ing.nombre)) return true;
      const info = this.nutricionIngrediente(ing.nombre);
      return info && ['carne', 'pescado', 'marisco'].includes(info.grupo);
    }).map(ing => ing.nombre);
  }

  esVegana(receta) {
    if (!receta) return false;
    if (typeof receta.vegano === 'boolean') return receta.vegano;
    const datos = datosNutricion();
    const meta = datos && datos.recetas ? datos.recetas[receta.id] : null;
    if (meta && typeof meta.vegano === 'boolean') return meta.vegano;
    const noVeganos = ['carne', 'huevo', 'lacteo'];
    return !(receta.ingredientes || []).some(ing => {
      const info = this.nutricionIngrediente(ing.nombre);
      return info && noVeganos.includes(info.grupo);
    });
  }

  verdurasReceta(receta) {
    return (receta && receta.ingredientes ? receta.ingredientes : []).filter(ing => {
      const info = this.nutricionIngrediente(ing.nombre);
      return info && info.grupo === 'verdura';
    }).length;
  }

  informacionNutricion(receta) {
    const kcal = this.kcalPorRacion(receta);
    const macros = this.macrosReceta(receta);
    return {
      kcalPorRacion: kcal,
      kcalTotal: this.kcalReceta(receta),
      perfil: this.perfilKcal(kcal),
      macrosTotal: macros.total,
      macrosPorRacion: macros.porRacion,
      tipo: this.tipoReceta(receta),
      vegetariana: this.esVegetariana(receta),
      vegana: this.esVegana(receta),
      verduras: this.verdurasReceta(receta)
    };
  }

  // ------------------------------------------------------------ preferencias
  cargarPreferencias() {
    const guardadas = this.leerJSON(STORAGE_PREFERENCES, null);
    this.preferencias = { vegetariano: true };
    if (guardadas && typeof guardadas === 'object' && !Array.isArray(guardadas)) {
      this.preferencias = { ...this.preferencias, ...guardadas };
    }
  }

  guardarPreferencias() {
    try {
      localStorage.setItem(STORAGE_PREFERENCES, JSON.stringify(this.preferencias));
    } catch (error) {
      console.warn('No se pudieron guardar las preferencias.', error);
    }
  }

  cambiarMenuVegetariano(activo) {
    this.preferencias = this.preferencias || { vegetariano: true };
    this.preferencias.vegetariano = !!activo;
    this.guardarPreferencias();
    if (document.getElementById('grid-semana')) this.renderIndex();
  }

  clavesSemana() {
    const claves = [];
    this.dias.forEach(dia => this.comidas.forEach(comida => claves.push(`${dia}-${comida}`)));
    return claves;
  }

  nombreDia(clave) {
    return this.diasLargos[clave] || clave;
  }

  despensaSet() {
    return new Set(Object.values(this.ingredientes).flat());
  }

  // Catálogo de ingredientes disponibles para las recetas. NO depende de la
  // despensa: quitar un ingrediente de casa no lo borra del formulario.
  // Se añaden los ingredientes de recetas y los del formulario abierto.
  catalogoIngredientes() {
    const catalogo = {};
    Object.entries(CATALOGO_INGREDIENTES).forEach(([categoria, lista]) => {
      catalogo[categoria] = [...lista];
    });
    const conocidos = new Set(Object.values(catalogo).flat());
    const agregar = (nombre, categoria) => {
      if (!nombre || conocidos.has(nombre)) return;
      const grupo = categoria || 'Despensa';
      if (!catalogo[grupo]) catalogo[grupo] = [];
      catalogo[grupo].push(nombre);
      conocidos.add(nombre);
    };
    (this.recetas || []).forEach(receta => {
      (receta.ingredientes || []).forEach(ing => agregar(ing.nombre, ing.categoria));
    });
    if (this.ingredientesForm) {
      this.ingredientesForm.forEach(ing => agregar(ing.nombre, ing.categoria));
    }
    return catalogo;
  }

  imagenHTML(rec, clase, alt) {
    if (!rec || !rec.imagen) return '';
    return `<img class="${clase}" src="${RUTA_IMAGENES}${this.esc(rec.imagen)}" alt="${this.esc(alt || rec.nombre)}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('sin-imagen');">`;
  }
  // ------------------------------------------------------------- eventos globales
  bindGlobalEvents() {
    const alPulsar = (id, manejador) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', manejador);
    };

    alPulsar('btn-tejer-semana', () => this.tejerSemana());
    alPulsar('btn-vaciar-semana', () => this.vaciarSemana());
    alPulsar('btn-anadir-receta', () => this.abrirModalAdd());
    alPulsar('btn-anadir-receta-2', () => this.abrirModalAdd());
    alPulsar('btn-guardar-receta', () => this.guardarReceta());
    alPulsar('btn-anadir-semana', () => this.anadirDetalleASemana());
    alPulsar('btn-editar-detalle', () => this.editarDesdeDetalle());
    alPulsar('btn-descargar-txt', () => this.descargarTxtRecetaFormulario());
    alPulsar('personas-menos', () => this.cambiarPersonas(-1));
    alPulsar('personas-mas', () => this.cambiarPersonas(1));

    const toggleVegetariano = document.getElementById('toggle-vegetariano');
    if (toggleVegetariano) {
      toggleVegetariano.checked = !this.preferencias || this.preferencias.vegetariano !== false;
      toggleVegetariano.addEventListener('change', () => this.cambiarMenuVegetariano(toggleVegetariano.checked));
    }
    alPulsar('btn-agregar-ingrediente', () => this.agregarIngredienteNuevo());
    alPulsar('btn-agregar-ingrediente-modal', () => this.agregarIngredienteNuevo());
    alPulsar('btn-elegir-cancelar', () => this.cerrarModalElegir());
    alPulsar('btn-mis-ingredientes', () => this.abrirModalIngredientes());
    alPulsar('cerrar-ingredientes-2', () => this.cerrarModalIngredientes());
    alPulsar('btn-empezar', () => {
      const grid = document.getElementById('grid-semana');
      if (grid) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.tejerSemana();
      } else {
        window.location.href = 'index.html';
      }
    });

    const buscar = document.getElementById('elegir-buscar');
    if (buscar) buscar.addEventListener('input', () => this.renderListaElegir());

    // Cierre genérico: cualquier botón .cerrar-modal cierra su propio modal
    document.querySelectorAll('.cerrar-modal').forEach(boton => {
      boton.addEventListener('click', (evento) => {
        evento.preventDefault();
        this.cerrarOverlay(boton.closest('.modal-overlay'));
      });
    });
    alPulsar('cerrar-add-2', () => this.cerrarModalAdd());
    alPulsar('cerrar-detalle-2', () => this.cerrarModalDetalle());

    // Clic en el fondo oscuro y tecla Escape
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (evento) => {
        if (evento.target === overlay) this.cerrarOverlay(overlay);
      });
    });
    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.abierto').forEach(overlay => this.cerrarOverlay(overlay));
      }
    });

    const form = document.getElementById('form-add-receta');
    if (form) {
      form.addEventListener('submit', (evento) => {
        evento.preventDefault();
        this.guardarReceta();
      });
    }
  }

  // ============================================================ PLANIFICADOR
  renderIndex() {
    const grid = document.getElementById('grid-semana');
    if (!grid) return;
    grid.innerHTML = '';

    const esquina = document.createElement('div');
    esquina.className = 'grid-esquina';
    esquina.textContent = 'Día';
    grid.appendChild(esquina);

    this.dias.forEach(dia => {
      const cabecera = document.createElement('div');
      cabecera.className = 'dia-header';
      cabecera.textContent = this.diasLargos[dia] || dia;
      grid.appendChild(cabecera);
    });

    this.comidas.forEach(comida => {
      const etiquetaFila = document.createElement('div');
      etiquetaFila.className = 'fila-label';
      etiquetaFila.textContent = comida === 'COMIDA' ? 'Comida' : 'Cena';
      grid.appendChild(etiquetaFila);
      this.dias.forEach(dia => grid.appendChild(this.crearCelda(dia, comida)));
    });

    this.actualizarContador();
    this.actualizarEstadisticas();
    this.renderListaCompra();
    this.renderPlatosSugeridos();
    this.renderBalanceSemana();
  }

  crearCelda(dia, comida) {
    const clave = `${dia}-${comida}`;
    const entrada = this.semana[clave];
    const rec = entrada ? this.recetaPorId(entrada.recetaId) : null;
    const celda = document.createElement('button');
    celda.type = 'button';
    celda.dataset.key = clave;
    celda.className = 'celda' + (rec ? ' ocupada' : ' vacia');
    const contexto = `${this.nombreDia(dia)} (${comida.toLowerCase()})`;

    if (rec) {
      const kcal = this.kcalPorRacion(rec);
      const perfil = this.perfilKcal(kcal);
      celda.title = `${rec.nombre} — ${rec.tiempo} · ≈${kcal} kcal/ración (${perfil.etiqueta})`;
      celda.setAttribute('aria-label', `${contexto}: ${rec.nombre}. Pulsa para ver la receta completa.`);
      celda.innerHTML = `
        ${this.imagenHTML(rec, 'celda-img')}
        <span class="celda-degradado"></span>
        <span class="celda-kcal" title="Calorías por ración">${kcal} kcal</span>
        <span class="celda-titulo">${this.esc(rec.nombre)}</span>
        ${entrada.deAyer ? '<span class="etiqueta-ayer">De ayer</span>' : ''}
        <span class="celda-quitar" role="button" title="Quitar este plato del menú" aria-label="Quitar del menú">&times;</span>`;
      celda.addEventListener('click', (evento) => {
        if (evento.target.classList.contains('celda-quitar')) {
          evento.stopPropagation();
          this.quitarDeCelda(clave);
          return;
        }
        this.abrirModalDetalle(rec.id);
      });
    } else {
      celda.setAttribute('aria-label', `${contexto}: vacío. Pulsa para elegir un plato.`);
      celda.innerHTML = '<span class="celda-mas">+</span>';
      celda.addEventListener('click', () => this.abrirModalElegir(clave));
    }
    return celda;
  }

  asignarReceta(clave, recetaId, deAyer = false) {
    if (!this.recetaPorId(recetaId)) return;
    this.semana[clave] = { recetaId, deAyer };
    this.guardarDatos();
    this.renderIndex();
  }

  quitarDeCelda(clave) {
    delete this.semana[clave];
    this.guardarDatos();
    this.renderIndex();
  }

  recetasElegibles() {
    const vegetariano = !this.preferencias || this.preferencias.vegetariano !== false;
    return this.recetas.filter(rec => !vegetariano || this.esVegetariana(rec));
  }

  objetivoKcal(comida) {
    const datos = datosNutricion();
    const objetivos = (datos && datos.objetivos) || {};
    const rango = comida === 'COMIDA' ? objetivos.kcalComida : objetivos.kcalCena;
    const valores = Array.isArray(rango) && rango.length === 2
      ? rango
      : (comida === 'COMIDA' ? [500, 800] : [350, 600]);
    return (valores[0] + valores[1]) / 2;
  }

  tejerSemana() {
    const elegibles = this.recetasElegibles();
    if (!elegibles.length) {
      alert('No hay recetas disponibles con el filtro actual. Desactiva «Menú vegetariano» o añade recetas.');
      return;
    }
    const datos = datosNutricion();
    const despensa = this.despensaSet();
    let mejor = null;
    for (let intento = 0; intento < 70; intento += 1) {
      const semana = this.construirSemana(elegibles, despensa, datos);
      const analisis = this.analizarSemana(semana);
      if (!mejor || analisis.puntuacion > mejor.analisis.puntuacion) {
        mejor = { semana, analisis };
      }
      if (mejor.analisis.puntuacion >= 100) break;
    }
    this.semana = mejor.semana;
    this.guardarDatos();
    this.renderIndex();
  }

  construirSemana(elegibles, despensa, datos) {
    const semana = {};
    const usadas = [];
    const plantilla = (datos && datos.semana) || {};
    const combinaciones = (datos && datos.combinaciones) || {};
    this.dias.forEach(dia => {
      const combo = combinaciones[plantilla[dia]] || null;
      const comida = this.elegirRecetaPara(elegibles, combo ? combo.comida : null, usadas, despensa, 'COMIDA');
      if (comida) {
        semana[`${dia}-COMIDA`] = { recetaId: comida.id, deAyer: false };
        usadas.push(comida.id);
      }
      const cena = this.elegirRecetaPara(elegibles, combo ? combo.cena : null, usadas, despensa, 'CENA');
      if (cena) {
        semana[`${dia}-CENA`] = { recetaId: cena.id, deAyer: false };
        usadas.push(cena.id);
      }
    });
    this.aplicarSobras(semana);
    return semana;
  }

  elegirRecetaPara(elegibles, tipos, usadas, despensa, comida) {
    const permitidos = Array.isArray(tipos) && tipos.length ? tipos : null;
    let candidatas = [...elegibles];
    if (permitidos) {
      // En la comida manda el tipo principal de la combinación (legumbre,
      // pasta, cereal...). En la cena se admite cualquiera de los tipos.
      const primario = permitidos[0];
      const delPrimario = elegibles.filter(rec => this.tipoReceta(rec) === primario);
      const deLaLista = elegibles.filter(rec => permitidos.includes(this.tipoReceta(rec)));
      candidatas = (comida === 'COMIDA' && delPrimario.length) ? delPrimario : deLaLista;
    }
    if (!candidatas.length) candidatas = [...elegibles];

    const anterior = usadas.length ? usadas[usadas.length - 1] : null;
    const sinRepetirDia = candidatas.filter(rec => rec.id !== anterior);
    if (sinRepetirDia.length) candidatas = sinRepetirDia;

    const objetivo = this.objetivoKcal(comida);
    const puntuadas = candidatas.map(rec => {
      let puntos = Math.random() * 8;
      const kcal = this.kcalPorRacion(rec);
      if (permitidos) {
        const indice = permitidos.indexOf(this.tipoReceta(rec));
        puntos += indice === 0 ? 45 : Math.max(10, 30 - indice * 6);
      }
      const distancia = Math.abs(kcal - objetivo);
      puntos += Math.max(-35, 24 - distancia / 22);
      const nombres = (rec.ingredientes || []).map(ing => ing.nombre);
      const disponibles = nombres.filter(nombre => despensa.has(nombre)).length;
      puntos += (disponibles / Math.max(1, nombres.length)) * 10;
      if (usadas.includes(rec.id)) puntos -= 70;
      if (usadas.slice(-3).includes(rec.id)) puntos -= 35;
      if (comida === 'CENA' && this.minutosDe(rec.tiempo) > 45) puntos -= 10;
      if (comida === 'CENA' && this.tipoReceta(rec) === 'elaborado') puntos -= 8;
      return { rec, puntos };
    }).sort((a, b) => b.puntos - a.puntos);

    const top = puntuadas.slice(0, Math.min(3, puntuadas.length));
    const elegida = top[Math.floor(Math.random() * top.length)];
    return elegida ? elegida.rec : null;
  }

  // Sobras "de ayer" solo para guisos y elaborados, máximo 3 y sin repetir.
  aplicarSobras(semana) {
    const candidatas = this.dias.slice(1).filter(dia => {
      const entrada = semana[`${dia}-COMIDA`];
      const rec = entrada ? this.recetaPorId(entrada.recetaId) : null;
      if (!rec) return false;
      return ['legumbre', 'elaborado'].includes(this.tipoReceta(rec)) && Math.random() < 0.45;
    }).slice(0, 3);

    const yaRepetidas = new Set();
    candidatas.forEach(dia => {
      const anterior = this.dias[this.dias.indexOf(dia) - 1];
      const previa = semana[`${anterior}-COMIDA`];
      const actual = semana[`${dia}-COMIDA`];
      if (!previa || !actual || yaRepetidas.has(previa.recetaId)) return;
      const rec = this.recetaPorId(previa.recetaId);
      const recActual = this.recetaPorId(actual.recetaId);
      if (!rec || !recActual) return;
      // Solo se reutiliza si no rompe el tipo de comida del día (legumbre,
      // elaborado...) para no desequilibrar la combinación.
      if (this.tipoReceta(rec) !== this.tipoReceta(recActual)) return;
      semana[`${dia}-COMIDA`] = { recetaId: previa.recetaId, deAyer: true };
      yaRepetidas.add(previa.recetaId);
    });
  }

  // Evalúa una semana completa contra los objetivos de data/nutricion.js.
  esElaborado(receta) {
    if (!receta) return false;
    if (this.tipoReceta(receta) === 'elaborado') return true;
    const datos = datosNutricion();
    const meta = datos && datos.recetas ? datos.recetas[receta.id] : null;
    return !!meta && ['frito', 'plancha', 'horno'].includes(meta.elaboracion);
  }

  exigeMenuVegetariano() {
    return !this.preferencias || this.preferencias.vegetariano !== false;
  }

  analizarSemana(semana) {
    const datos = datosNutricion() || {};
    const objetivos = datos.objetivos || {};
    const comidas = [];
    this.dias.forEach(dia => {
      this.comidas.forEach(comida => {
        const entrada = semana[`${dia}-${comida}`];
        const rec = entrada ? this.recetaPorId(entrada.recetaId) : null;
        if (rec) comidas.push({ dia, comida, entrada, rec });
      });
    });

    const media = valores => (valores.length
      ? Math.round(valores.reduce((total, valor) => total + valor, 0) / valores.length)
      : 0);
    const kcalComida = media(comidas.filter(c => c.comida === 'COMIDA').map(c => this.kcalPorRacion(c.rec)));
    const kcalCena = media(comidas.filter(c => c.comida === 'CENA').map(c => this.kcalPorRacion(c.rec)));
    const kcalDias = this.dias.map(dia => comidas
      .filter(c => c.dia === dia)
      .reduce((total, c) => total + this.kcalPorRacion(c.rec), 0));
    const kcalDia = media(kcalDias);
    const distintos = new Set(comidas.map(c => c.rec.id));
    const legumbres = comidas.filter(c => this.tipoReceta(c.rec) === 'legumbre').length;
    const verduras = comidas.filter(c => this.verdurasReceta(c.rec) >= 2).length;
    const proteinaVegetal = comidas.filter(c => {
      const grupos = (c.rec.ingredientes || []).map(i => (this.nutricionIngrediente(i.nombre) || {}).grupo);
      return grupos.includes('proteina') || grupos.includes('legumbre');
    }).length;
    const elaborados = comidas.filter(c => this.esElaborado(c.rec)).length;
    const huevos = comidas.filter(c => (c.rec.ingredientes || [])
      .some(i => (this.nutricionIngrediente(i.nombre) || {}).grupo === 'huevo')).length;
    const todosVegetarianos = comidas.every(c => this.esVegetariana(c.rec));

    const metas = {
      legumbres: objetivos.legumbres || 3,
      verduras: objetivos.verduras || 7,
      proteinaVegetal: objetivos.proteinaVegetal || 5,
      elaborados: objetivos.elaborados || 3,
      huevos: objetivos.huevos || 5,
      variedad: objetivos.variedad || 10
    };

    let puntuacion = 100;
    const restar = (faltan, peso) => { if (faltan > 0) puntuacion -= faltan * peso; };
    restar(metas.legumbres - legumbres, 7);
    restar(metas.verduras - verduras, 5);
    restar(metas.proteinaVegetal - proteinaVegetal, 4);
    restar(metas.variedad - distintos.size, 3);
    restar(elaborados - metas.elaborados, 5);
    restar(huevos - metas.huevos, 3);

    const rangoComida = objetivos.kcalComida || [500, 750];
    const rangoCena = objetivos.kcalCena || [400, 600];
    const rangoDia = objetivos.kcalDia || [900, 1350];
    const desviacion = (valor, rango) => {
      if (!Array.isArray(rango) || rango.length !== 2) return 0;
      if (valor < rango[0]) return rango[0] - valor;
      if (valor > rango[1]) return valor - rango[1];
      return 0;
    };

    // Se penaliza que la comida o la cena se alejen de su rango, no solo el
    // total diario. Antes bastaba con caer dentro de un rango diario muy ancho
    // para sacar 100 aunque cada comida estuviera muy por debajo del objetivo.
    if (comidas.length) {
      puntuacion -= Math.min(35, desviacion(kcalComida, rangoComida) / 4);
      puntuacion -= Math.min(35, desviacion(kcalCena, rangoCena) / 4);
    }
    kcalDias.forEach(valor => {
      puntuacion -= Math.min(15, desviacion(valor, rangoDia) / 20);
    });
    if (this.exigeMenuVegetariano() && !todosVegetarianos) puntuacion -= 20;

    return {
      puntuacion: Math.max(0, Math.min(100, Math.round(puntuacion))),
      comidas,
      kcalComida,
      kcalCena,
      kcalDia,
      kcalDias,
      legumbres,
      verduras,
      proteinaVegetal,
      elaborados,
      huevos,
      variedad: distintos.size,
      metas,
      todosVegetarianos
    };
  }

  renderBalanceSemana() {
    const cont = document.getElementById('balance-semana');
    if (!cont) return;
    const entradas = Object.values(this.semana || {}).filter(Boolean);
    if (!entradas.length) {
      cont.innerHTML = '<p class="vacio-texto">Pulsa «TEJER LA SEMANA POR MÍ» y aquí verás las calorías y el equilibrio del menú.</p>';
      return;
    }

    const analisis = this.analizarSemana(this.semana);
    const clase = analisis.puntuacion >= 85 ? 'muy-bueno' : (analisis.puntuacion >= 65 ? 'bueno' : 'mejorable');
    const etiqueta = clase === 'muy-bueno' ? 'Muy equilibrada' : (clase === 'bueno' ? 'Equilibrada' : 'Mejorable');
    const filas = [
      { texto: 'Legumbres', valor: analisis.legumbres, meta: analisis.metas.legumbres },
      { texto: 'Verduras', valor: analisis.verduras, meta: analisis.metas.verduras },
      { texto: 'Proteína vegetal', valor: analisis.proteinaVegetal, meta: analisis.metas.proteinaVegetal },
      { texto: 'Fritos/elaborados', valor: analisis.elaborados, meta: analisis.metas.elaborados, maximo: true },
      { texto: 'Huevos', valor: analisis.huevos, meta: analisis.metas.huevos, maximo: true },
      { texto: 'Recetas distintas', valor: analisis.variedad, meta: analisis.metas.variedad }
    ];

    cont.innerHTML = `
      <div class="balance-cabecera">
        <span class="balance-nota balance-${clase}">${analisis.puntuacion}<small>/100</small></span>
        <div class="balance-resumen">
          <strong>${etiqueta}</strong>
          <span>≈ ${analisis.kcalComida} kcal/comida · ≈ ${analisis.kcalDia} kcal/día (comida + cena)</span>
        </div>
      </div>
      <ul class="balance-lista">
        ${filas.map(fila => {
          const ok = fila.maximo ? fila.valor <= fila.meta : fila.valor >= fila.meta;
          return `<li class="${ok ? 'ok' : 'revisar'}">
            <span class="balance-icono" aria-hidden="true">${ok ? '✓' : '!'}</span>
            <span class="balance-texto">${fila.texto}</span>
            <strong>${fila.valor}/${fila.meta}</strong>
          </li>`;
        }).join('')}
      </ul>
      <p class="balance-leyenda">${this.preferencias && this.preferencias.vegetariano === false ? 'Menú con todas las recetas' : 'Menú vegetariano'} · ${analisis.comidas.length} comidas y cenas</p>`;
  }

  vaciarSemana() {
    if (Object.keys(this.semana).length && !confirm('¿Vaciar todo el menú semanal?')) return;
    this.semana = {};
    this.guardarDatos();
    this.renderIndex();
  }

  // ------------------------------------------------------------- estadísticas
  ingredientesDelMenu() {
    const conjunto = new Set();
    Object.values(this.semana).forEach(entrada => {
      const rec = this.recetaPorId(entrada.recetaId);
      if (rec) rec.ingredientes.forEach(ing => conjunto.add(ing.nombre));
    });
    return conjunto;
  }

  actualizarContador() {
    const el = document.getElementById('contador-alimentos');
    if (!el) return;
    const total = Object.values(this.ingredientes).flat().length;
    el.textContent = `${total} alimentos`;
  }

  actualizarEstadisticas() {
    const entradas = Object.values(this.semana).filter(Boolean);
    const platos = entradas.length;
    const ingredientesMenu = this.ingredientesDelMenu();
    const despensa = this.despensaSet();
    const disponibles = [...ingredientesMenu].filter(nombre => despensa.has(nombre));
    const faltantes = [...ingredientesMenu].filter(nombre => !despensa.has(nombre));
    const minutos = entradas.reduce((total, entrada) => {
      const rec = this.recetaPorId(entrada.recetaId);
      return total + (rec ? this.minutosDe(rec.tiempo) : 0);
    }, 0);

    const escribir = (id, valor) => {
      const el = document.getElementById(id);
      if (el) el.textContent = valor;
    };

    escribir('stat-platos', platos);
    escribir('stat-ingredientes', ingredientesMenu.size);
    escribir('stat-solapamiento', ingredientesMenu.size
      ? `${Math.round((disponibles.length / ingredientesMenu.size) * 100)}%`
      : '0%');
    escribir('stat-coste', `${(faltantes.length * COSTE_POR_INGREDIENTE).toFixed(2).replace('.', ',')} €`);
    escribir('stat-tiempo', `${minutos} min`);
    escribir('stat-rescatados', disponibles.length);

    const analisis = this.analizarSemana(this.semana);
    escribir('stat-kcal', analisis.comidas.length ? `${analisis.kcalComida} kcal` : '—');
    escribir('stat-variedad', analisis.variedad);
  }

  renderListaCompra() {
    const cont = document.getElementById('lista-compra');
    if (!cont) return;
    const delMenu = [...this.ingredientesDelMenu()].sort((a, b) => a.localeCompare(b));
    const despensa = this.despensaSet();
    const faltan = delMenu.filter(nombre => !despensa.has(nombre));
    const tengo = delMenu.filter(nombre => despensa.has(nombre));

    if (!delMenu.length) {
      cont.innerHTML = '<p class="vacio-texto">Genera un menú para ver tu lista de la compra.</p>';
      return;
    }
    if (!faltan.length) {
      cont.innerHTML = '<p class="compra-ok">✅ Tienes en casa todo lo necesario para este menú.</p>';
      return;
    }
    cont.innerHTML = `
      <p class="compra-resumen">Te faltan <strong>${faltan.length}</strong> de ${delMenu.length} ingredientes.</p>
      <ul class="lista-compra">${faltan.map(nombre => `<li>${this.esc(nombre)}</li>`).join('')}</ul>
      <p class="compra-pie">Ya tienes ${tengo.length} ingredientes en la despensa.</p>`;
  }

  renderPlatosSugeridos() {
    const cont = document.getElementById('platos-sugeridos');
    if (!cont) return;
    const despensa = this.despensaSet();
    const enMenu = Object.values(this.semana)
      .map(entrada => this.recetaPorId(entrada.recetaId))
      .filter(Boolean);
    const ingredientesMenu = new Set();
    enMenu.forEach(rec => rec.ingredientes.forEach(ing => ingredientesMenu.add(ing.nombre)));

    const ranking = this.recetasElegibles().map(rec => {
      const nombres = rec.ingredientes.map(ing => ing.nombre);
      return {
        rec,
        faltan: nombres.filter(nombre => !despensa.has(nombre)).length,
        reutiliza: nombres.filter(nombre => ingredientesMenu.has(nombre)).length
      };
    }).sort((a, b) => a.faltan - b.faltan || b.reutiliza - a.reutiliza || a.rec.nombre.localeCompare(b.rec.nombre)).slice(0, 6);

    cont.innerHTML = ranking.map(({ rec, faltan, reutiliza }) => `
      <button type="button" class="plato-sugerido" data-receta="${rec.id}" title="Ver la receta completa">
        <span class="sugerido-thumb">${this.imagenHTML(rec, 'sugerido-img')}</span>
        <span class="sugerido-texto">
          <span class="sugerido-nombre">${this.esc(rec.nombre)}</span>
          <span class="sugerido-meta">${this.esc(rec.tiempo || '—')} · ${this.kcalPorRacion(rec)} kcal · Falta ${faltan} · Reutiliza ${reutiliza}</span>
        </span>
      </button>`).join('');

    cont.querySelectorAll('.plato-sugerido').forEach(boton => {
      boton.addEventListener('click', () => this.abrirModalDetalle(boton.dataset.receta));
    });
  }

  // ------------------------------------------------- modal "elegir plato"
  abrirModalElegir(clave) {
    const overlay = document.getElementById('modal-elegir');
    if (!overlay) {
      // Sin modal (página de recetario): no hay nada que asignar
      return;
    }
    this.slotElegir = clave;
    const [dia, comida] = clave.split('-');
    const titulo = document.getElementById('elegir-titulo');
    if (titulo) titulo.textContent = `${this.nombreDia(dia)} · ${comida.toLowerCase()}`;
    const buscar = document.getElementById('elegir-buscar');
    if (buscar) buscar.value = '';
    this.renderListaElegir();
    overlay.classList.add('abierto');
    if (buscar) buscar.focus();
  }

  renderListaElegir() {
    const cont = document.getElementById('elegir-lista');
    if (!cont) return;
    const buscar = document.getElementById('elegir-buscar');
    const filtro = (buscar ? buscar.value : '').trim().toLowerCase();
    const recetas = this.recetasElegibles().filter(rec => !filtro || rec.nombre.toLowerCase().includes(filtro));

    if (!recetas.length) {
      cont.innerHTML = '<p class="vacio-texto">No hay recetas que coincidan con la búsqueda.</p>';
      return;
    }
    cont.innerHTML = recetas.map(rec => `
      <button type="button" class="elegir-item" data-receta="${rec.id}">
        <span class="elegir-thumb">${this.imagenHTML(rec, 'elegir-img')}</span>
        <span class="elegir-texto">
          <strong>${this.esc(rec.nombre)}</strong>
          <small>${this.esc(rec.tiempo || '—')} · ${rec.porciones_base} porciones · ${this.kcalPorRacion(rec)} kcal/ración${this.esVegetariana(rec) ? ' · 🌱' : ''}</small>
        </span>
      </button>`).join('');

    cont.querySelectorAll('.elegir-item').forEach(boton => {
      boton.addEventListener('click', () => {
        if (!this.slotElegir) return;
        this.asignarReceta(this.slotElegir, boton.dataset.receta);
        this.cerrarModalElegir();
      });
    });
  }

  cerrarModalElegir() {
    const overlay = document.getElementById('modal-elegir');
    if (overlay) overlay.classList.remove('abierto');
    this.slotElegir = null;
  }

  // ------------------------------------------- modal "mis ingredientes"
  cerrarOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove('abierto');
    if (overlay.id === 'modal-add') {
      this.recetaEnEdicion = null;
      this.ingredientesForm = new Map();
      this.seleccionModal = new Set();
      this.actualizarTituloModalReceta();
    }
    if (overlay.id === 'modal-ingredientes') {
      const boton = document.getElementById('btn-mis-ingredientes');
      if (boton) {
        boton.setAttribute('aria-expanded', 'false');
        boton.focus({ preventScroll: true });
      }
    }
  }

  abrirModalIngredientes() {
    const overlay = document.getElementById('modal-ingredientes');
    if (!overlay) return;
    this.renderCategoriasIngredientes();
    this.actualizarContadorDespensa();
    overlay.classList.add('abierto');
    const boton = document.getElementById('btn-mis-ingredientes');
    if (boton) boton.setAttribute('aria-expanded', 'true');
    const cuerpo = overlay.querySelector('.modal-body');
    if (cuerpo) cuerpo.scrollTop = 0;
    const input = document.getElementById('nuevo-ingrediente-nombre');
    if (input) input.focus({ preventScroll: true });
  }

  cerrarModalIngredientes() {
    this.cerrarOverlay(document.getElementById('modal-ingredientes'));
  }

  actualizarContadorDespensa() {
    const total = Object.values(this.ingredientes).flat().length;
    const contador = document.getElementById('contador-despensa');
    if (contador) contador.textContent = total;
    const boton = document.getElementById('btn-mis-ingredientes');
    if (boton) boton.setAttribute('aria-label', `Mis ingredientes (${total})`);
  }


  // --------------------------------------------------------- detalle receta
  abrirModalDetalle(id) {
    const rec = this.recetaPorId(id);
    if (!rec) return;
    const overlay = document.getElementById('modal-detalle');
    if (!overlay) return;
    this.recetaDetalleActual = rec;

    const titulo = document.getElementById('detalle-titulo');
    if (titulo) titulo.textContent = rec.nombre;

    const contenedorImagen = document.getElementById('detalle-imagen');
    if (contenedorImagen) {
      contenedorImagen.classList.remove('sin-imagen');
      contenedorImagen.innerHTML = this.imagenHTML(rec, 'detalle-img', rec.nombre)
        || '<span class="placeholder-icono">🍽️</span>';
      if (!rec.imagen) contenedorImagen.classList.add('sin-imagen');
    }

    const despensa = this.despensaSet();
    const faltantes = rec.ingredientes.filter(ing => !despensa.has(ing.nombre)).length;
    const meta = document.getElementById('detalle-meta');
    if (meta) {
      meta.innerHTML = `
        <span class="meta-pill"><span class="meta-icono" aria-hidden="true">⏱</span><strong>${this.esc(rec.tiempo || '—')}</strong>&nbsp;de preparación</span>
        <span class="meta-pill"><span class="meta-icono" aria-hidden="true">👥</span><strong>${rec.porciones_base}</strong>&nbsp;porciones base</span>
        <span class="meta-pill meta-pill-kcal"><span class="meta-icono" aria-hidden="true">🔥</span><strong>${this.kcalPorRacion(rec)}</strong>&nbsp;kcal/ración</span>
        <span class="meta-pill ${faltantes ? 'meta-pill-falta' : 'meta-pill-ok'}">
          <span class="meta-icono" aria-hidden="true">${faltantes ? '🛒' : '✅'}</span>
          ${faltantes ? `<strong>${faltantes}</strong>&nbsp;${faltantes === 1 ? 'ingrediente' : 'ingredientes'} por comprar` : 'Tienes todos los ingredientes'}
        </span>`;
    }

    const personas = document.getElementById('detalle-personas');
    if (personas) {
      // La receta puede ser de 4 raciones, pero el contador arranca en 1
      // comensal: es lo habitual para quien cocina para sí mismo.
      personas.value = 1;
      personas.min = 1;
      personas.max = 24;
    }

    const botonEditar = document.getElementById('btn-editar-detalle');
    if (botonEditar) botonEditar.dataset.receta = rec.id;
    const cuerpo = overlay.querySelector('.modal-body');
    if (cuerpo) cuerpo.scrollTop = 0;
    this.escalarIngredientes();

    const pasos = document.getElementById('detalle-pasos');
    if (pasos) pasos.innerHTML = rec.pasos.map(paso => `<li>${this.esc(paso)}</li>`).join('');

    const equipamiento = document.getElementById('detalle-equipamiento');
    if (equipamiento) {
      equipamiento.innerHTML = rec.equipamiento.map(eq => `<span class="equip-chip">${this.esc(eq)}</span>`).join('');
    }

    overlay.classList.add('abierto');
  }

  cerrarModalDetalle() {
    const overlay = document.getElementById('modal-detalle');
    if (overlay) overlay.classList.remove('abierto');
    this.recetaDetalleActual = null;
  }

  escalarIngredientes() {
    const rec = this.recetaDetalleActual;
    const lista = document.getElementById('detalle-ingredientes');
    if (!rec || !lista) return;
    const input = document.getElementById('detalle-personas');
    const personas = Math.max(1, parseInt(input ? input.value : rec.porciones_base, 10) || 1);
    const factor = personas / (rec.porciones_base || 1);
    const despensa = this.despensaSet();

    lista.innerHTML = rec.ingredientes.map(ing => {
      const cantidad = this.formatearCantidad(ing.cantidad * factor);
      const falta = !despensa.has(ing.nombre);
      const peso = this.pesoDe(ing);
      return `<li class="detalle-ingrediente${falta ? ' falta' : ''}" title="Importancia en la receta: ${peso} de ${PESO_MAX}">
        <span class="ing-nombre">${this.esc(ing.nombre)}</span>
        <span class="ing-cantidad">${cantidad} ${this.esc(ing.unidad)}</span>
        ${falta ? '<span class="ing-falta">falta</span>' : ''}
      </li>`;
    }).join('');

    this.renderNutricionDetalle();
  }

  renderNutricionDetalle() {
    const cont = document.getElementById('detalle-nutricion');
    const rec = this.recetaDetalleActual;
    if (!cont || !rec) return;
    const info = this.informacionNutricion(rec);
    const input = document.getElementById('detalle-personas');
    const personas = Math.max(1, parseInt(input ? input.value : rec.porciones_base, 10) || 1);
    const total = Math.round(info.kcalPorRacion * personas);
    const macros = info.macrosPorRacion;

    cont.innerHTML = `
      <div class="nutricion-cabecera">
        <span class="nutricion-kcal nutricion-${info.perfil.clave}">${info.perfil.icono} ${info.kcalPorRacion} kcal/ración</span>
        <span class="nutricion-total">${total} kcal para ${personas} ${personas === 1 ? 'persona' : 'personas'}</span>
        ${info.vegetariana ? `<span class="nutricion-veg">🌱 ${info.vegana ? 'Vegana' : 'Vegetariana'}</span>` : '<span class="nutricion-carne">Con carne</span>'}
      </div>
      <div class="nutricion-macros">
        <span class="macros-chip"><strong>${macros.proteina} g</strong> proteína</span>
        <span class="macros-chip"><strong>${macros.hidratos} g</strong> hidratos</span>
        <span class="macros-chip"><strong>${macros.grasa} g</strong> grasa</span>
        <span class="macros-chip"><strong>${macros.fibra} g</strong> fibra</span>
      </div>
      <p class="nutricion-nota">Valores orientativos calculados a partir de los ingredientes (${info.perfil.etiqueta.toLowerCase()} por ración).</p>`;
  }

  cambiarPersonas(delta) {
    const input = document.getElementById('detalle-personas');
    if (!input) return;
    const actual = Math.max(1, parseInt(input.value, 10) || 1);
    input.value = Math.min(24, Math.max(1, actual + delta));
    this.escalarIngredientes();
  }

  editarDesdeDetalle() {
    const rec = this.recetaDetalleActual;
    if (!rec) return;
    const id = rec.id;
    this.cerrarModalDetalle();
    this.abrirModalEditar(id);
  }

  anadirDetalleASemana() {
    const rec = this.recetaDetalleActual;
    if (!rec) return;
    const libre = this.clavesSemana().find(clave => !this.semana[clave]);
    if (!libre) {
      alert('Tu semana ya está completa. Quita un plato del calendario para añadir otro.');
      return;
    }
    const [dia, comida] = libre.split('-');
    this.asignarReceta(libre, rec.id);
    this.cerrarModalDetalle();
    alert(`"${rec.nombre}" añadido al ${this.nombreDia(dia).toLowerCase()} (${comida.toLowerCase()}).`);
  }

  // ------------------------------------------- modal receta (alta y edición)
  abrirModalAdd() {
    const overlay = document.getElementById('modal-add');
    if (!overlay) return;
    this.recetaEnEdicion = null;
    this.seleccionModal = new Set();
    this.ingredientesForm = new Map();
    const form = document.getElementById('form-add-receta');
    if (form) form.reset();
    const vegetariana = document.getElementById('receta-vegetariana');
    if (vegetariana) vegetariana.checked = true;
    this.escribirValor('receta-kcal', '');
    this.escribirValor('receta-tipo', '');
    this.rellenarImagenesDisponibles();
    this.actualizarTituloModalReceta();
    this.renderChipsAdd();
    this.actualizarSeleccionAdd();
    overlay.classList.add('abierto');
    const nombre = document.getElementById('receta-nombre');
    if (nombre) nombre.focus();
  }

  // Abre el mismo formulario pero precargado con una receta existente.
  abrirModalEditar(id) {
    const rec = this.recetaPorId(id);
    if (!rec) return;
    const overlay = document.getElementById('modal-add');
    if (!overlay) return;
    if (this.recetaDetalleActual && this.recetaDetalleActual.id === id) this.cerrarModalDetalle();

    const form = document.getElementById('form-add-receta');
    if (form) form.reset();

    this.recetaEnEdicion = rec;
    this.ingredientesForm = new Map();
    rec.ingredientes.forEach(ing => {
      this.ingredientesForm.set(ing.nombre, {
        nombre: ing.nombre,
        cantidad: ing.cantidad,
        unidad: ing.unidad,
        categoria: ing.categoria || this.categoriaDe(ing.nombre),
        peso: this.pesoDe(ing)
      });
    });
    this.seleccionModal = new Set(this.ingredientesForm.keys());

    this.escribirValor('receta-nombre', rec.nombre);
    this.escribirValor('receta-descripcion', rec.descripcion || '');
    this.escribirValor('receta-tiempo', rec.tiempo || '');
    this.escribirValor('receta-porciones', rec.porciones_base || 4);
    this.escribirValor('receta-imagen', rec.imagen || '');
    this.escribirValor('receta-kcal', Number(rec.kcalPorRacion) > 0 ? rec.kcalPorRacion : '');
    this.escribirValor('receta-tipo', this.tipoReceta(rec));
    this.escribirValor('receta-pasos', (rec.pasos || []).join('\n'));
    const vegetariana = document.getElementById('receta-vegetariana');
    if (vegetariana) vegetariana.checked = this.esVegetariana(rec);
    document.querySelectorAll('input[name="equipamiento"]').forEach(check => {
      check.checked = (rec.equipamiento || []).includes(check.value);
    });

    this.rellenarImagenesDisponibles();
    this.actualizarTituloModalReceta();
    this.renderChipsAdd();
    this.actualizarSeleccionAdd();
    overlay.classList.add('abierto');
    const nombre = document.getElementById('receta-nombre');
    if (nombre) nombre.focus();
  }

  escribirValor(id, valor) {
    const el = document.getElementById(id);
    if (el) el.value = valor;
  }

  actualizarTituloModalReceta() {
    const editando = !!this.recetaEnEdicion;
    const titulo = document.getElementById('titulo-modal-receta');
    const guardar = document.getElementById('btn-guardar-receta');
    const ayuda = document.getElementById('ayuda-txt');
    if (titulo) titulo.textContent = editando ? 'Editar receta' : 'Nueva receta';
    if (guardar) guardar.textContent = editando ? 'Guardar cambios' : 'Guardar receta';
    if (ayuda) {
      ayuda.textContent = editando
        ? 'Al guardar se actualiza también el archivo .txt de la receta en data/recetas/.'
        : 'La receta se guarda en tu recetario (localStorage). También puedes descargar su .txt.';
    }
  }

  rellenarImagenesDisponibles() {
    const lista = document.getElementById('lista-imagenes-recetas');
    if (!lista || lista.children.length) return;
    lista.innerHTML = IMAGENES_RECETAS
      .map(archivo => `<option value="${this.esc(archivo)}"></option>`)
      .join('');
  }

  renderChipsAdd() {
    const cont = document.getElementById('ingredientes-categorias');
    if (!cont) return;
    this.seleccionModal = this.seleccionModal || new Set();
    this.ingredientesForm = this.ingredientesForm || new Map();
    cont.innerHTML = '';
    Object.entries(this.catalogoIngredientes()).forEach(([categoria, lista]) => {
      const bloque = document.createElement('div');
      bloque.className = 'chips-categoria';
      const titulo = document.createElement('strong');
      titulo.className = 'chips-categoria-titulo';
      titulo.textContent = categoria;
      const chips = document.createElement('div');
      chips.className = 'chips-categoria-lista';
      lista.forEach(ingrediente => {
        const chip = document.createElement('span');
        chip.className = 'chip' + (this.seleccionModal.has(ingrediente) ? ' activo' : '');
        chip.textContent = ingrediente;
        chip.dataset.ingrediente = ingrediente;
        chip.addEventListener('click', () => this.alternarIngredienteFormulario(ingrediente));
        chips.appendChild(chip);
      });
      bloque.appendChild(titulo);
      bloque.appendChild(chips);
      cont.appendChild(bloque);
    });
  }

  // Añade o quita un ingrediente del formulario (chips y tabla van enlazados).
  alternarIngredienteFormulario(nombre) {
    this.seleccionModal = this.seleccionModal || new Set();
    this.ingredientesForm = this.ingredientesForm || new Map();
    if (this.ingredientesForm.has(nombre)) {
      this.ingredientesForm.delete(nombre);
      this.seleccionModal.delete(nombre);
    } else {
      const categoria = this.categoriaDe(nombre);
      const base = { nombre, cantidad: 1, unidad: 'ud', categoria };
      this.ingredientesForm.set(nombre, { ...base, peso: pesoInferido(base) });
      this.seleccionModal.add(nombre);
    }
    const activo = this.ingredientesForm.has(nombre);
    document.querySelectorAll('#ingredientes-categorias .chip').forEach(chip => {
      if (chip.dataset.ingrediente === nombre) chip.classList.toggle('activo', activo);
    });
    this.actualizarSeleccionAdd();
  }

  contenedorSeleccionAdd() {
    return document.getElementById('ingredientes-seleccionados')
      || document.getElementById('ingredientes-seleccionados-modal');
  }

  actualizarSeleccionAdd() {
    const cont = this.contenedorSeleccionAdd();
    if (!cont) return;
    const elegidos = [...(this.seleccionModal || [])];
    if (!elegidos.length) {
      cont.innerHTML = '<p class="vacio-texto">Ningún ingrediente seleccionado todavía. Pulsa los ingredientes de arriba para añadirlos.</p>';
      return;
    }

    const filas = elegidos.map(nombre => {
      const ing = this.ingredientesForm.get(nombre)
        || { nombre, cantidad: 1, unidad: 'ud', peso: pesoInferido({ nombre }) };
      return `
        <div class="fila-ingrediente" data-ingrediente="${this.esc(nombre)}">
          <span class="fila-nombre" title="${this.esc(nombre)}">${this.esc(nombre)}</span>
          <input type="number" class="fila-input fila-cantidad" value="${this.formatearCantidadParaInput(ing.cantidad)}" min="0.05" step="any" aria-label="Cantidad de ${this.esc(nombre)}">
          <input type="text" class="fila-input fila-unidad" value="${this.esc(ing.unidad)}" maxlength="20" aria-label="Unidad de ${this.esc(nombre)}">
          <select class="fila-input fila-peso" aria-label="Peso de ${this.esc(nombre)} en la receta">
            ${this.opcionesPeso(ing.peso)}
          </select>
          <button type="button" class="fila-quitar" aria-label="Quitar ${this.esc(nombre)}">&times;</button>
        </div>`;
    }).join('');

    cont.innerHTML = `
      <div class="tabla-ingredientes">
        <div class="tabla-cabecera" aria-hidden="true">
          <span>Ingrediente</span><span>Cant.</span><span>Unidad</span><span>Peso</span><span></span>
        </div>
        ${filas}
      </div>
      <p class="tabla-ayuda">El peso (1-5) indica la importancia del ingrediente en la receta y alimenta la coincidencia del recetario: 1 = condimento, 5 = protagonista.</p>`;

    cont.querySelectorAll('.fila-ingrediente').forEach(fila => {
      const nombre = fila.dataset.ingrediente;
      const cantidad = fila.querySelector('.fila-cantidad');
      const unidad = fila.querySelector('.fila-unidad');
      const peso = fila.querySelector('.fila-peso');
      const sincronizar = () => {
        const ing = this.ingredientesForm.get(nombre);
        if (!ing) return;
        const valorCantidad = Number(String(cantidad.value).replace(',', '.'));
        ing.cantidad = Number.isFinite(valorCantidad) && valorCantidad > 0 ? valorCantidad : 1;
        ing.unidad = unidad.value.trim() || 'ud';
        const valorPeso = parseInt(peso.value, 10);
        ing.peso = Math.min(PESO_MAX, Math.max(PESO_MIN, Number.isFinite(valorPeso) ? valorPeso : 3));
      };
      [cantidad, unidad].forEach(control => control.addEventListener('input', sincronizar));
      peso.addEventListener('change', sincronizar);
      fila.querySelector('.fila-quitar').addEventListener('click', () => this.alternarIngredienteFormulario(nombre));
    });
  }

  formatearCantidadParaInput(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) return '1';
    return String(Math.round(numero * 100) / 100);
  }

  opcionesPeso(seleccionado) {
    const numero = Number(seleccionado);
    const actual = Number.isFinite(numero)
      ? Math.min(PESO_MAX, Math.max(PESO_MIN, Math.round(numero)))
      : 3;
    return [1, 2, 3, 4, 5]
      .map(peso => `<option value="${peso}"${peso === actual ? ' selected' : ''}>${peso}</option>`)
      .join('');
  }

  cerrarModalAdd() {
    const overlay = document.getElementById('modal-add');
    if (overlay) overlay.classList.remove('abierto');
    this.recetaEnEdicion = null;
    this.ingredientesForm = new Map();
    this.seleccionModal = new Set();
    this.actualizarTituloModalReceta();
  }

  agregarIngredienteNuevo() {
    const input = document.getElementById('ingrediente-nuevo');
    const select = document.getElementById('ingrediente-categoria');
    if (!input || !select) return;
    const nombre = input.value.trim();
    if (!nombre) { input.focus(); return; }

    // El catálogo no es la despensa: añadir un ingrediente al formulario no
    // debe tocar los alimentos que el usuario tiene en casa.
    const catalogo = this.catalogoIngredientes();
    const todos = Object.values(catalogo).flat();
    const existente = todos.find(ing => ing.toLowerCase() === nombre.toLowerCase());
    const nombreFinal = existente || nombre;
    const categoria = existente ? this.categoriaDe(nombreFinal) : select.value;

    this.seleccionModal = this.seleccionModal || new Set();
    this.seleccionModal.add(nombreFinal);
    this.ingredientesForm = this.ingredientesForm || new Map();
    if (!this.ingredientesForm.has(nombreFinal)) {
      const base = { nombre: nombreFinal, cantidad: 1, unidad: 'ud', categoria };
      this.ingredientesForm.set(nombreFinal, { ...base, peso: pesoInferido(base) });
    }
    input.value = '';
    this.renderChipsAdd();
    this.actualizarSeleccionAdd();
  }

  // Datos del formulario tal y como están ahora mismo (sin guardar).
  recetaDelFormulario() {
    const valor = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : '';
    };
    return {
      id: this.recetaEnEdicion ? this.recetaEnEdicion.id : '',
      nombre: valor('receta-nombre').trim(),
      descripcion: valor('receta-descripcion').trim(),
      tiempo: valor('receta-tiempo').trim() || '30 min',
      porciones_base: parseInt(valor('receta-porciones'), 10) || 4,
      imagen: valor('receta-imagen').trim(),
      kcalPorRacion: Number(valor('receta-kcal')) > 0 ? Number(valor('receta-kcal')) : 0,
      tipo: valor('receta-tipo').trim(),
      vegetariano: (() => {
        const casilla = document.getElementById('receta-vegetariana');
        return casilla ? casilla.checked : true;
      })(),
      ingredientes: this.ingredientesDelFormulario(),
      equipamiento: [...document.querySelectorAll('input[name="equipamiento"]:checked')].map(c => c.value),
      pasos: valor('receta-pasos').split('\n').map(paso => paso.trim()).filter(Boolean)
    };
  }

  // Ingredientes del formulario validados (cantidad > 0 y peso entre 1 y 5).
  ingredientesDelFormulario() {
    const lista = [];
    [...(this.seleccionModal || [])].forEach(nombre => {
      const ing = this.ingredientesForm.get(nombre);
      if (!ing) return;
      const cantidad = Number(ing.cantidad);
      const peso = parseInt(ing.peso, 10);
      lista.push({
        nombre: ing.nombre,
        cantidad: Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1,
        unidad: String(ing.unidad || 'ud').trim() || 'ud',
        categoria: ing.categoria || this.categoriaDe(ing.nombre),
        peso: Math.min(PESO_MAX, Math.max(PESO_MIN, Number.isFinite(peso) ? peso : 3))
      });
    });
    return lista;
  }

  guardarReceta() {
    const datos = this.recetaDelFormulario();
    if (!datos.nombre) { alert('El nombre de la receta es obligatorio.'); return; }
    if (!datos.ingredientes.length) { alert('Selecciona al menos un ingrediente.'); return; }
    if (!datos.pasos.length) { alert('Escribe al menos un paso de elaboración.'); return; }

    const editando = this.recetaEnEdicion;
    let receta;
    if (editando) {
      Object.assign(editando, datos, { editada: true });
      receta = editando;
    } else {
      receta = {
        ...datos,
        id: 'receta-usuario-' + Date.now(),
        descripcion: datos.descripcion || 'Receta creada por el usuario.',
        editada: true
      };
      this.recetas.push(receta);
    }

    this.guardarDatos();
    this.cerrarModalAdd();
    this.renderIndex();
    this.renderRecetario();

    // El diálogo de guardado del .txt debe abrirse dentro del gesto del usuario,
    // por eso se lanza aquí (síncrono) y el aviso final espera al resultado.
    const slug = this.slugReceta(receta);
    const guardadoTxt = this.iniciarGuardadoTxt(receta);
    const accion = editando ? 'actualizada' : 'guardada';
    guardadoTxt.then(estado => {
      let detalle = '';
      if (estado === 'guardado') {
        detalle = ` El archivo data/recetas/${slug}.txt se ha actualizado.`;
      } else if (estado === 'descargado') {
        detalle = ` También se ha descargado ${slug}.txt: cópialo en data/recetas/ para mantener el archivo sincronizado.`;
      }
      alert(`Receta "${receta.nombre}" ${accion} correctamente.${detalle}`);
    });
  }

  // --------------------------------------------------- sincronización con .txt
  slugReceta(receta) {
    if (receta && SLUGS_RECETAS_DEFECTO[receta.id]) return SLUGS_RECETAS_DEFECTO[receta.id];
    const base = String((receta && receta.nombre) || 'receta')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
    return base || `receta-${Date.now()}`;
  }

  formatearCantidadTxt(cantidad) {
    const valor = Number(cantidad);
    if (!Number.isFinite(valor) || valor <= 0) return '1';
    const fracciones = { 0.25: '1/4', 0.33: '1/3', 0.5: '1/2', 0.66: '2/3', 0.75: '3/4' };
    const clave = Math.round(valor * 100) / 100;
    if (fracciones[clave]) return fracciones[clave];
    return this.formatearCantidad(valor);
  }

  // "g (crudo)" -> "g en crudo": evita paréntesis anidados en el .txt
  formatearUnidadTxt(unidad) {
    const limpia = String(unidad || '').trim();
    const dentroParentesis = limpia.match(/^([^\s(]+)\s*\(([^)]+)\)$/);
    if (dentroParentesis) return `${dentroParentesis[1]} en ${dentroParentesis[2]}`;
    return limpia;
  }

  ingredienteTxt(ingrediente) {
    const unidad = this.formatearUnidadTxt(ingrediente.unidad);
    const medida = Number(ingrediente.cantidad) === 1 && unidad.toLowerCase() === 'pizca'
      ? unidad
      : `${this.formatearCantidadTxt(ingrediente.cantidad)} ${unidad}`.trim();
    const categoria = ingrediente.categoria || this.categoriaDe(ingrediente.nombre);
    return `- ${ingrediente.nombre} (${medida}) — ${categoria} — peso ${this.pesoDe(ingrediente)}`;
  }

  // Genera el contenido con el mismo formato que los archivos de data/recetas/.
  recetaATxt(receta) {
    const linea = '='.repeat(80);
    const equipamiento = (receta.equipamiento || []).map(e => `- ${e}`).join('\n');
    const pasos = (receta.pasos || []).map((paso, indice) => `${indice + 1}. ${paso}`).join('\n');
    return [
      linea,
      `RECETA: ${receta.nombre || 'Receta sin título'}`,
      linea,
      `Imagen: ${receta.imagen || '(sin imagen)'}`,
      `Tiempo de preparación: ${receta.tiempo || '—'}`,
      `Porciones base: ${receta.porciones_base || 4}`,
      `Tipo: ${this.tipoReceta(receta)}`,
      `Vegetariano: ${this.esVegetariana(receta) ? 'sí' : 'no'}`,
      `Calorías: ${this.kcalPorRacion(receta)} kcal por ración (${this.kcalReceta(receta)} kcal totales)`,
      `Macros por ración: ${this.macrosReceta(receta).porRacion.proteina} g de proteína · ${this.macrosReceta(receta).porRacion.hidratos} g de hidratos · ${this.macrosReceta(receta).porRacion.grasa} g de grasa · ${this.macrosReceta(receta).porRacion.fibra} g de fibra`,
      '',
      'DESCRIPCIÓN:',
      receta.descripcion || '',
      '',
      'INGREDIENTES:',
      (receta.ingredientes || []).map(ing => this.ingredienteTxt(ing)).join('\n'),
      '',
      'EQUIPAMIENTO NECESARIO:',
      equipamiento || '- (sin equipamiento específico)',
      '',
      'PASOS DE ELABORACIÓN:',
      pasos,
      '',
      linea,
      'FIN DE RECETA',
      linea,
      ''
    ].join('\n');
  }

  // Intenta sobrescribir data/recetas/<slug>.txt con File System Access API y,
  // si el navegador no lo permite, descarga una copia del archivo.
  iniciarGuardadoTxt(receta) {
    const slug = this.slugReceta(receta);
    const contenido = this.recetaATxt(receta);
    let promesaHandle;
    const handlePrevio = this.handlesTxt[slug];

    if (handlePrevio) {
      promesaHandle = Promise.resolve(handlePrevio);
    } else if (typeof window.showSaveFilePicker === 'function') {
      try {
        promesaHandle = window.showSaveFilePicker({
          suggestedName: `${slug}.txt`,
          types: [{ description: 'Receta de FridgeFlow (.txt)', accept: { 'text/plain': ['.txt'] } }]
        }).then(handle => {
          this.handlesTxt[slug] = handle;
          return handle;
        }).catch(error => {
          if (error && error.name === 'AbortError') return 'cancelado';
          console.warn('No se pudo abrir el selector de archivos: se descarga el .txt.', error);
          return null;
        });
      } catch (error) {
        console.warn('File System Access API no disponible: se descarga el .txt.', error);
        promesaHandle = Promise.resolve(null);
      }
    } else {
      promesaHandle = Promise.resolve(null);
    }

    return promesaHandle.then(handle => {
      if (handle === 'cancelado') return 'cancelado';
      if (!handle) {
        this.descargarTxt(slug, contenido);
        return 'descargado';
      }
      return handle.createWritable()
        .then(escritura => escritura.write(contenido).then(() => escritura.close()))
        .then(() => 'guardado')
        .catch(error => {
          console.warn('No se pudo escribir el .txt: se descarga una copia.', error);
          delete this.handlesTxt[slug];
          this.descargarTxt(slug, contenido);
          return 'descargado';
        });
    });
  }

  descargarTxt(slug, contenido) {
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `${slug}.txt`;
    enlace.style.display = 'none';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Botón "Descargar .txt" del formulario: exporta lo que hay en pantalla.
  descargarTxtRecetaFormulario() {
    const receta = this.recetaDelFormulario();
    if (!receta.nombre) {
      alert('Escribe el nombre de la receta antes de descargar el .txt.');
      return;
    }
    if (!receta.ingredientes.length) {
      alert('Selecciona al menos un ingrediente antes de descargar el .txt.');
      return;
    }
    const slug = this.slugReceta(receta);
    this.descargarTxt(slug, this.recetaATxt(receta));
  }

  // ================================================================ RECETARIO
  renderRecetario() {
    this.renderChipsFiltro();
    this.renderCategoriasIngredientes();
    this.filtrarRecetas();
    this.bindRecetarioEvents();
    this.actualizarContador();
    this.actualizarContadorDespensa();
  }

  renderChipsFiltro() {
    const cont = document.getElementById('chips-filtro-ingredientes');
    if (!cont) return;
    const activos = new Set(this.obtenerIngredientesSeleccionados());
    cont.innerHTML = '';

    // Mapa ingrediente -> peso máximo en cualquier receta (1-5)
    const pesoMax = {};
    this.recetas.forEach(rec => {
      (rec.ingredientes || []).forEach(ing => {
        const peso = this.pesoDe(ing);
        const prev = pesoMax[ing.nombre] || 0;
        if (peso > prev) pesoMax[ing.nombre] = peso;
      });
    });

    // Ingredientes únicos de la despensa del usuario
    const todos = [...new Set(Object.values(this.ingredientes).flat())].sort((a, b) => a.localeCompare(b));

    // El buscador también filtra la lista de ingredientes disponibles.
    const buscador = document.getElementById('buscador-alimentos');
    const busqueda = buscador ? buscador.value : '';
    const terminos = this.normalizarBusqueda(busqueda);
    const todosFiltrados = terminos
      ? todos.filter(ing => this.normalizarBusqueda(ing).includes(terminos))
      : todos;

    const principales = todosFiltrados.filter(ing => (pesoMax[ing] || 0) >= PESO_PROTAGONISTA);
    const secundarios = todosFiltrados.filter(ing => (pesoMax[ing] || 0) < PESO_PROTAGONISTA);

    // Render principales (base del plato, visibles siempre)
    principales.forEach(ingrediente => {
      const chip = document.createElement('span');
      chip.className = 'chip' + (activos.has(ingrediente) ? ' activo' : '');
      chip.textContent = ingrediente;
      chip.addEventListener('click', () => {
        chip.classList.toggle('activo');
        this.filtrarRecetas();
      });
      cont.appendChild(chip);
    });

    // Botón desplegable + contenedor de secundarios
    if (secundarios.length) {
      const secundariosBox = document.createElement('div');
      secundariosBox.className = 'secundarios-desplegable';
      secundariosBox.hidden = true;
      secundarios.forEach(ingrediente => {
        const chip = document.createElement('span');
        chip.className = 'chip chip-secundario' + (activos.has(ingrediente) ? ' activo' : '');
        chip.textContent = ingrediente;
        chip.addEventListener('click', () => {
          chip.classList.toggle('activo');
          this.filtrarRecetas();
        });
        secundariosBox.appendChild(chip);
      });

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip btn-mas-ingredientes';
      btn.textContent = '+ ingredientes';
      btn.addEventListener('click', () => {
        const expandido = cont.dataset.secExpandido === '1';
        cont.dataset.secExpandido = expandido ? '0' : '1';
        secundariosBox.hidden = expandido;
        btn.textContent = expandido ? '+ ingredientes' : '▲ menos ingredientes';
      });
      cont.appendChild(btn);
      cont.appendChild(secundariosBox);
    }

    // Si el alimento buscado no está en la nevera, ofrecer añadirlo rápido.
    if (terminos && todosFiltrados.length === 0) {
      const catalogo = this.catalogoIngredientes();
      const todosCatalogo = Object.values(catalogo).flat();
      const existente = todosCatalogo.find(ing => this.normalizarBusqueda(ing) === terminos)
        || todosCatalogo.find(ing => this.normalizarBusqueda(ing).includes(terminos));
      const nombreFinal = existente || busqueda.trim();
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'chip btn-añadir-rapido';
      boton.textContent = `+ Añadir ${nombreFinal} a la nevera`;
      boton.addEventListener('click', () => {
        this.agregarAnevera(nombreFinal);
        this.renderChipsFiltro();
        this.filtrarRecetas();
      });
      cont.appendChild(boton);
    }
  }

  agregarAnevera(nombre) {
    const nombreFinal = String(nombre || '').trim();
    if (!nombreFinal) return;
    const catalogo = this.catalogoIngredientes();
    const todosCatalogo = Object.values(catalogo).flat();
    const existente = todosCatalogo.find(ing => ing.toLowerCase() === nombreFinal.toLowerCase());
    const nombreCanonico = existente || nombreFinal;
    const categoria = existente ? this.categoriaDe(nombreCanonico) : 'Despensa';
    const todos = Object.values(this.ingredientes).flat();
    if (todos.some(ing => ing.toLowerCase() === nombreCanonico.toLowerCase())) return;
    if (!this.ingredientes[categoria]) this.ingredientes[categoria] = [];
    this.ingredientes[categoria].push(nombreCanonico);
    this.guardarDatos();
    this.renderCategoriasIngredientes();
    this.actualizarContador();
    this.actualizarContadorDespensa();
  }

  obtenerIngredientesSeleccionados() {
    return [...document.querySelectorAll('#chips-filtro-ingredientes .chip.activo')].map(chip => chip.textContent);
  }

  filtrosNutricion() {
    const orden = document.getElementById('orden-recetas');
    const rango = document.querySelector('#chips-rango-kcal .chip.activo');
    const vegetariana = document.getElementById('filtro-vegetarianas');
    return {
      orden: orden ? orden.value : 'coincidencia',
      rango: rango ? rango.dataset.rango : 'todas',
      soloVegetarianas: !!(vegetariana && vegetariana.checked)
    };
  }

  etiquetaTipo(tipo) {
    const etiquetas = {
      legumbre: 'Legumbre', cereal: 'Cereal', pasta: 'Pasta', huevo: 'Huevo',
      verdura: 'Verdura', proteina: 'Proteína vegetal', tuberculo: 'Tubérculo',
      elaborado: 'Elaborado', carne: 'Carne', otro: 'Plato'
    };
    return etiquetas[tipo] || 'Plato';
  }

  // Búsqueda libre: sin acentos, sin mayúsculas y por palabras sueltas.
  normalizarBusqueda(texto) {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  coincideBusqueda(receta, busqueda) {
    const terminos = this.normalizarBusqueda(busqueda).split(/\s+/).filter(Boolean);
    if (!terminos.length) return true;
    const texto = this.normalizarBusqueda([
      receta.nombre,
      receta.descripcion,
      ...(receta.ingredientes || []).map(ing => ing.nombre)
    ].join(' '));
    return terminos.every(termino => texto.includes(termino));
  }

  filtrarRecetas() {
    const grid = document.getElementById('grid-recetas');
    if (!grid) return;
    const seleccionados = this.obtenerIngredientesSeleccionados();
    const despensa = this.despensaSet();
    const filtros = this.filtrosNutricion();
    const buscador = document.getElementById('buscador-alimentos');
    const busqueda = buscador ? buscador.value : '';

    let resultados = this.recetas.map(rec => ({
      rec,
      info: this.informacionNutricion(rec),
      ...this.calcularCoincidencia(rec, seleccionados)
    }));

    if (seleccionados.length) resultados = resultados.filter(item => item.coincidencias > 0);
    if (busqueda.trim()) resultados = resultados.filter(item => this.coincideBusqueda(item.rec, busqueda));
    if (filtros.soloVegetarianas) resultados = resultados.filter(item => item.info.vegetariana);
    if (filtros.rango !== 'todas') {
      resultados = resultados.filter(item => item.info.perfil.clave === filtros.rango);
    }

    const porNombre = (a, b) => a.rec.nombre.localeCompare(b.rec.nombre, 'es');
    const porCoincidencia = (a, b) =>
      (b.puntuacion - a.puntuacion)
      || (b.protagonistas - a.protagonistas)
      || (b.coincidencias - a.coincidencias)
      || porNombre(a, b);

    const haySeleccion = seleccionados.length > 0;
    const hayBusqueda = busqueda.trim().length > 0;
    const totalFiltradas = resultados.length;

    // Con ingredientes seleccionados, primero nos quedamos con las 8 recetas
    // con más coincidencias y después respetamos el orden que pida el usuario.
    if (haySeleccion) {
      resultados.sort(porCoincidencia);
      resultados = resultados.slice(0, RECETAS_TOP_FILTRO);
    }

    if (filtros.orden === 'kcal-asc') {
      resultados.sort((a, b) => (a.info.kcalPorRacion - b.info.kcalPorRacion) || porNombre(a, b));
    } else if (filtros.orden === 'kcal-desc') {
      resultados.sort((a, b) => (b.info.kcalPorRacion - a.info.kcalPorRacion) || porNombre(a, b));
    } else if (filtros.orden === 'nombre') {
      resultados.sort(porNombre);
    } else if (haySeleccion) {
      resultados.sort(porCoincidencia);
    }

    const contador = document.getElementById('contador-resultados');
    if (contador) {
      if (!resultados.length) {
        contador.textContent = hayBusqueda || !haySeleccion
          ? '0 recetas encontradas'
          : 'Ninguna receta con esos ingredientes';
      } else if (haySeleccion && totalFiltradas > resultados.length) {
        contador.textContent = `${resultados.length} de ${totalFiltradas} recetas · las más coincidentes`;
      } else {
        contador.textContent = `${resultados.length} receta${resultados.length === 1 ? '' : 's'} encontrada${resultados.length === 1 ? '' : 's'}`;
      }
    }

    grid.innerHTML = '';
    if (!resultados.length) {
      grid.innerHTML = hayBusqueda
        ? '<p class="vacio-texto">No hay recetas que coincidan con la búsqueda.</p>'
        : '<p class="vacio-texto">No hay recetas con esos ingredientes. Quita algún filtro para ver más.</p>';
      return;
    }

    resultados.forEach(item => {
      const rec = item.rec;
      const info = item.info;
      const faltan = rec.ingredientes.filter(ing => !despensa.has(ing.nombre)).length;
      const porcentaje = Math.round(item.puntuacion * 100);
      const claseColor = porcentaje >= 70 ? 'alta' : (porcentaje >= 45 ? 'media' : 'baja');
      const protagonistasTexto = item.protagonistas
        ? ` · ${item.protagonistas} protagonista${item.protagonistas === 1 ? '' : 's'}`
        : '';
      const puntuacion = seleccionados.length
        ? `<div class="tarjeta-puntuacion tarjeta-puntuacion--${claseColor}">
             <div class="tarjeta-puntuacion-cabecera">
               <span>Coincidencia</span>
               <strong>${porcentaje} %</strong>
             </div>
             <div class="tarjeta-barra" role="img" aria-label="Coincidencia del ${porcentaje} por ciento">
               <span style="width:${porcentaje}%"></span>
             </div>
             <span class="tarjeta-puntuacion-detalle">${item.coincidencias} de ${item.total} ingredientes${protagonistasTexto}</span>
           </div>`
        : '';

      const tarjeta = document.createElement('article');
      tarjeta.className = 'tarjeta-receta';
      tarjeta.tabIndex = 0;
      tarjeta.setAttribute('role', 'button');
      tarjeta.setAttribute('aria-label', `Ver receta: ${rec.nombre}`);
      tarjeta.innerHTML = `
        <div class="tarjeta-imagen">
          ${this.imagenHTML(rec, 'tarjeta-img', rec.nombre)}
          <span class="tarjeta-kcal tarjeta-kcal-${info.perfil.clave}" title="≈ ${info.kcalPorRacion} kcal por ración · proteína ${info.macrosPorRacion.proteina} g · fibra ${info.macrosPorRacion.fibra} g">${info.perfil.icono} ${info.kcalPorRacion} kcal</span>
          <button type="button" class="tarjeta-editar" data-receta="${this.esc(rec.id)}" title="Editar receta" aria-label="Editar receta: ${this.esc(rec.nombre)}"><span aria-hidden="true">✏️</span><span class="tarjeta-editar-texto">Editar</span></button>
        </div>
        <div class="tarjeta-contenido">
          <div class="tarjeta-titulo">${this.esc(rec.nombre)}</div>
          <div class="tarjeta-etiquetas">
            ${info.vegetariana
              ? `<span class="tarjeta-veg">🌱 ${info.vegana ? 'Vegana' : 'Vegetariana'}</span>`
              : '<span class="tarjeta-carne">Con carne</span>'}
            <span class="tarjeta-tipo">${this.etiquetaTipo(info.tipo)}</span>
            <span class="tarjeta-kcal-texto">${info.kcalPorRacion} kcal · ${info.perfil.etiqueta}</span>
          </div>
          <div class="tarjeta-tiempo">${this.esc(rec.tiempo || '—')} · ${rec.porciones_base} pp · ${faltan ? `Falta ${faltan} ing.` : 'tienes todo'}</div>
          ${puntuacion}
          <div class="tarjeta-ingredientes">
            ${rec.ingredientes.filter(ing => this.pesoDe(ing) >= 3).map(ing => {
              const peso = this.pesoDe(ing);
              const coincide = seleccionados.includes(ing.nombre);
              const clases = ['tarjeta-chip'];
              if (coincide) clases.push('coincide');
              if (peso >= PESO_PROTAGONISTA) clases.push('principal');
              return `<span class="${clases.join(' ')}" title="Importancia ${peso} de 5${coincide ? ' · lo tienes' : ''}">${this.esc(ing.nombre)}</span>`;
            }).join('')}
          </div>
        </div>`;
      const abrir = () => this.abrirModalDetalle(rec.id);
      const botonEditar = tarjeta.querySelector('.tarjeta-editar');
      if (botonEditar) {
        botonEditar.addEventListener('click', (evento) => {
          evento.stopPropagation();
          evento.preventDefault();
          this.abrirModalEditar(rec.id);
        });
      }
      tarjeta.addEventListener('click', abrir);
      tarjeta.addEventListener('keydown', (evento) => {
        if (evento.target !== tarjeta) return;
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault();
          abrir();
        }
      });
      grid.appendChild(tarjeta);
    });
  }

  filtrarPorTodas() {
    document.querySelectorAll('#chips-filtro-ingredientes .chip').forEach(chip => chip.classList.remove('activo'));
    const buscador = document.getElementById('buscador-alimentos');
    if (buscador) buscador.value = '';
    this.renderChipsFiltro();
    this.filtrarRecetas();
  }

  renderCategoriasIngredientes() {
    const cont = document.getElementById('categorias-ingredientes');
    if (!cont) return;
    cont.innerHTML = '';
    Object.entries(this.ingredientes).forEach(([categoria, lista]) => {
      const bloque = document.createElement('div');
      bloque.className = 'categoria';
      const titulo = document.createElement('h4');
      titulo.textContent = categoria;
      const chips = document.createElement('div');
      chips.className = 'lista-ingredientes-cat';
      lista.forEach(ingrediente => {
        const chip = document.createElement('span');
        chip.className = 'chip eliminable';
        chip.title = 'Pulsa la × para quitarlo de tu despensa';
        chip.innerHTML = `${this.esc(ingrediente)}<span class="chip-eliminar" title="Quitar">×</span>`;
        chip.querySelector('.chip-eliminar').addEventListener('click', (evento) => {
          evento.stopPropagation();
          this.eliminarIngrediente(categoria, ingrediente);
        });
        chips.appendChild(chip);
      });
      bloque.appendChild(titulo);
      bloque.appendChild(chips);
      cont.appendChild(bloque);
    });
  }

  eliminarIngrediente(categoria, nombre) {
    if (!Array.isArray(this.ingredientes[categoria])) return;
    this.ingredientes[categoria] = this.ingredientes[categoria].filter(ing => ing !== nombre);
    this.guardarDatos();
    this.renderCategoriasIngredientes();
    this.renderChipsFiltro();
    this.filtrarRecetas();
    this.actualizarContador();
    this.actualizarContadorDespensa();
  }

  bindRecetarioEvents() {
    const orden = document.getElementById('orden-recetas');
    if (orden && !orden.dataset.bound) {
      orden.dataset.bound = '1';
      orden.addEventListener('change', () => this.filtrarRecetas());
    }
    const buscador = document.getElementById('buscador-alimentos');
    if (buscador && !buscador.dataset.bound) {
      buscador.dataset.bound = '1';
      buscador.addEventListener('input', () => {
        this.renderChipsFiltro();
        this.filtrarRecetas();
      });
      buscador.addEventListener('keydown', (evento) => {
        if (evento.key !== 'Escape') return;
        buscador.value = '';
        this.renderChipsFiltro();
        this.filtrarRecetas();
      });
    }
    document.querySelectorAll('#chips-rango-kcal .chip').forEach(chip => {
      if (chip.dataset.bound) return;
      chip.dataset.bound = '1';
      chip.addEventListener('click', () => {
        document.querySelectorAll('#chips-rango-kcal .chip').forEach(otro => otro.classList.remove('activo'));
        chip.classList.add('activo');
        this.filtrarRecetas();
      });
    });
    const vegetariana = document.getElementById('filtro-vegetarianas');
    if (vegetariana && !vegetariana.dataset.bound) {
      vegetariana.dataset.bound = '1';
      vegetariana.addEventListener('change', () => {
        const etiqueta = document.getElementById('filtro-vegetarianas-etiqueta');
        if (etiqueta) etiqueta.classList.toggle('activo', vegetariana.checked);
        this.filtrarRecetas();
      });
    }

    const boton = document.getElementById('btn-guardar-ingrediente');
    if (!boton) return;
    boton.onclick = () => {
      const input = document.getElementById('nuevo-ingrediente-nombre');
      const select = document.getElementById('nuevo-ingrediente-categoria');
      const nombre = input ? input.value.trim() : '';
      if (!nombre || !select) return;
      const todos = Object.values(this.ingredientes).flat();
      if (todos.some(ing => ing.toLowerCase() === nombre.toLowerCase())) {
        alert('Ese ingrediente ya está en tu despensa.');
        return;
      }
      const categoria = select.value;
      if (!this.ingredientes[categoria]) this.ingredientes[categoria] = [];
      this.ingredientes[categoria].push(nombre);
      this.guardarDatos();
      input.value = '';
      this.renderCategoriasIngredientes();
      this.renderChipsFiltro();
      this.filtrarRecetas();
      this.actualizarContador();
      this.actualizarContadorDespensa();
    };
  }

  // ================================================================= AUDITORÍA
  renderAuditoria() {
    // Página estática: aquí solo se comprueba que los datos están cargados
    console.info(`FridgeFlow cargado: ${this.recetas.length} recetas y ${Object.values(this.ingredientes).flat().length} ingredientes.`);
  }
}

// ============================================================================
// Arranque de la aplicación
// ============================================================================
const app = new App();
window.app = app;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
