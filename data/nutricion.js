// ============================================================================
// FRIDGEFLOW — DATOS NUTRICIONALES Y COMBINACIONES SALUDABLES (v1.0)
// ----------------------------------------------------------------------------
// Este archivo es la única fuente de calorías y de combinaciones saludables.
// Se carga con <script> ANTES de js/app.js (una web abierta con file:// no
// puede hacer fetch de un JSON, así que los datos viven en un .js editable).
//
// CÓMO EDITARLO
// - ingredientes: valores por 100 g (o 100 ml) del alimento tal y como se usa
//   en la receta (cocido si la receta usa "g cocidos", crudo si usa "g (crudo)").
//   "gramosPorUnidad" es lo que pesa 1 ud/diente/rebanada para poder convertir.
// - recetas: tipo de plato y si es vegetariana/vegana. Si falta, la app lo
//   deduce de los ingredientes.
// - combinaciones + semana: qué tipo de plato toca en cada comida/cena.
// - objetivos: metas semanales que usa el planificador y el panel de balance.
// ============================================================================
window.FRIDGEFLOW_NUTRICION = {
  version: '1.0',

  ingredientes: {
    // ------------------------------------------------------------- verduras
    'Ajo': { kcal: 149, proteina: 6.4, hidratos: 33, grasa: 0.5, fibra: 2.1, grupo: 'verdura', gramosPorUnidad: 4 },
    'Ajetes': { kcal: 30, proteina: 1.8, hidratos: 6, grasa: 0.1, fibra: 1.8, grupo: 'verdura', gramosPorUnidad: 10 },
    'Berenjena': { kcal: 25, proteina: 1, hidratos: 6, grasa: 0.2, fibra: 3, grupo: 'verdura', gramosPorUnidad: 250 },
    'Calabacín': { kcal: 17, proteina: 1.2, hidratos: 3.1, grasa: 0.3, fibra: 1, grupo: 'verdura', gramosPorUnidad: 200 },
    'Calabaza': { kcal: 26, proteina: 1, hidratos: 6.5, grasa: 0.1, fibra: 0.5, grupo: 'verdura', gramosPorUnidad: 1000 },
    'Cebolla': { kcal: 40, proteina: 1.1, hidratos: 9.3, grasa: 0.1, fibra: 1.7, grupo: 'verdura', gramosPorUnidad: 120 },
    'Coliflor': { kcal: 25, proteina: 1.9, hidratos: 5, grasa: 0.3, fibra: 2, grupo: 'verdura', gramosPorUnidad: 600 },
    'Espinacas': { kcal: 23, proteina: 2.9, hidratos: 3.6, grasa: 0.4, fibra: 2.2, grupo: 'verdura', gramosPorUnidad: 100 },
    'Guisantes': { kcal: 81, proteina: 5.4, hidratos: 14.5, grasa: 0.4, fibra: 5.7, grupo: 'verdura', gramosPorUnidad: 100 },
    'Lechuga': { kcal: 15, proteina: 1.4, hidratos: 2.9, grasa: 0.2, fibra: 1.3, grupo: 'verdura', gramosPorUnidad: 300 },
    'Limón': { kcal: 29, proteina: 1.1, hidratos: 9.3, grasa: 0.3, fibra: 2.8, grupo: 'verdura', gramosPorUnidad: 100 },
    'Patatas': { kcal: 77, proteina: 2, hidratos: 17, grasa: 0.1, fibra: 2.2, grupo: 'tuberculo', gramosPorUnidad: 150 },
    'Pimiento rojo': { kcal: 31, proteina: 1, hidratos: 6, grasa: 0.3, fibra: 2.1, grupo: 'verdura', gramosPorUnidad: 150 },
    'Pimiento verde': { kcal: 20, proteina: 0.9, hidratos: 4.6, grasa: 0.2, fibra: 1.7, grupo: 'verdura', gramosPorUnidad: 150 },
    'Rúcula': { kcal: 25, proteina: 2.6, hidratos: 3.7, grasa: 0.7, fibra: 1.6, grupo: 'verdura', gramosPorUnidad: 50 },
    'Setas': { kcal: 22, proteina: 3.1, hidratos: 3.3, grasa: 0.3, fibra: 1, grupo: 'verdura', gramosPorUnidad: 15 },
    'Tomate': { kcal: 18, proteina: 0.9, hidratos: 3.9, grasa: 0.2, fibra: 1.2, grupo: 'verdura', gramosPorUnidad: 150 },
    'Zanahoria': { kcal: 41, proteina: 0.9, hidratos: 9.6, grasa: 0.2, fibra: 2.8, grupo: 'verdura', gramosPorUnidad: 80 },
    'Alcachofas': { kcal: 47, proteina: 3.3, hidratos: 10.5, grasa: 0.1, fibra: 5.4, grupo: 'verdura', gramosPorUnidad: 150 },
    'Brotes de soja': { kcal: 30, proteina: 3, hidratos: 4, grasa: 0.5, fibra: 1.8, grupo: 'verdura' },
    'Cebolleta': { kcal: 32, proteina: 1.8, hidratos: 7.3, grasa: 0.2, fibra: 2.6, grupo: 'verdura', gramosPorUnidad: 15 },
    'Jengibre': { kcal: 80, proteina: 1.8, hidratos: 18, grasa: 0.8, fibra: 2, grupo: 'verdura', gramosPorUnidad: 15 },
    'Judías verdes': { kcal: 31, proteina: 1.8, hidratos: 7, grasa: 0.2, fibra: 3.4, grupo: 'verdura' },
    'Maíz': { kcal: 86, proteina: 3.2, hidratos: 19, grasa: 1.2, fibra: 2.7, grupo: 'verdura' },

    // ------------------------------------------------------------ proteínas
    'Albóndigas de ternera': { kcal: 250, proteina: 17, hidratos: 5, grasa: 18, fibra: 0, grupo: 'carne' },
    'Alubias blancas': { kcal: 139, proteina: 9.7, hidratos: 25, grasa: 0.5, fibra: 6.3, grupo: 'legumbre' },
    'Falafel': { kcal: 300, proteina: 13, hidratos: 32, grasa: 12, fibra: 5, grupo: 'legumbre', gramosPorUnidad: 20 },
    'Garbanzos': { kcal: 164, proteina: 8.9, hidratos: 27.4, grasa: 2.6, fibra: 7.6, grupo: 'legumbre' },
    'Heura': { kcal: 190, proteina: 19, hidratos: 3.5, grasa: 11, fibra: 4, grupo: 'proteina' },
    'Huevos': { kcal: 143, proteina: 12.6, hidratos: 0.7, grasa: 9.5, fibra: 0, grupo: 'huevo', gramosPorUnidad: 55 },
    'Lentejas': { kcal: 116, proteina: 9, hidratos: 20, grasa: 0.4, fibra: 7.9, grupo: 'legumbre' },
    'Pollo': { kcal: 165, proteina: 31, hidratos: 0, grasa: 3.6, fibra: 0, grupo: 'carne' },
    'Tofu firme': { kcal: 144, proteina: 15.8, hidratos: 2.8, grasa: 8.7, fibra: 2.3, grupo: 'proteina' },
    'Tofu ahumado': { kcal: 150, proteina: 16, hidratos: 2, grasa: 9, fibra: 1, grupo: 'proteina' },

    // -------------------------------------------------------------- lácteos
    'Leche': { kcal: 61, proteina: 3.2, hidratos: 4.8, grasa: 3.3, fibra: 0, grupo: 'lacteo' },
    'Mantequilla': { kcal: 717, proteina: 0.9, hidratos: 0.1, grasa: 81, fibra: 0, grupo: 'grasa' },
    'Queso parmesano': { kcal: 431, proteina: 38, hidratos: 4.1, grasa: 29, fibra: 0, grupo: 'lacteo' },
    'Queso rallado': { kcal: 380, proteina: 25, hidratos: 1.5, grasa: 30, fibra: 0, grupo: 'lacteo' },
    'Yogur griego natural': { kcal: 97, proteina: 4, hidratos: 4, grasa: 8, fibra: 0, grupo: 'lacteo' },
    'Queso feta': { kcal: 264, proteina: 14, hidratos: 4.1, grasa: 21, fibra: 0, grupo: 'lacteo' },
    'Mozzarella': { kcal: 280, proteina: 18, hidratos: 3.1, grasa: 22, fibra: 0, grupo: 'lacteo' },
    'Queso de cabra': { kcal: 364, proteina: 21, hidratos: 0.1, grasa: 30, fibra: 0, grupo: 'lacteo' },
    'Queso manchego': { kcal: 392, proteina: 26, hidratos: 1.5, grasa: 32, fibra: 0, grupo: 'lacteo' },

    // ------------------------------------------------------------- despensa
    'Aceite de oliva virgen extra': { kcal: 884, proteina: 0, hidratos: 0, grasa: 100, fibra: 0, grupo: 'grasa' },
    'Aceitunas': { kcal: 145, proteina: 1, hidratos: 4, grasa: 15, fibra: 3, grupo: 'grasa', gramosPorUnidad: 4 },
    'Arroz': { kcal: 350, proteina: 7, hidratos: 78, grasa: 0.9, fibra: 1.3, grupo: 'cereal' },
    'Caldo de verduras': { kcal: 4, proteina: 0.2, hidratos: 0.8, grasa: 0.1, fibra: 0, grupo: 'caldo' },
    'Harina de trigo': { kcal: 364, proteina: 10, hidratos: 76, grasa: 1, fibra: 2.7, grupo: 'cereal' },
    'Láminas de lasaña': { kcal: 350, proteina: 12, hidratos: 70, grasa: 1.5, fibra: 3, grupo: 'cereal', gramosPorUnidad: 15 },
    'Leche de coco': { kcal: 197, proteina: 2, hidratos: 2.8, grasa: 21, fibra: 0, grupo: 'grasa' },
    'Macarrones': { kcal: 350, proteina: 12, hidratos: 70, grasa: 1.5, fibra: 3, grupo: 'cereal' },
    'Masa de empanadilla': { kcal: 280, proteina: 7, hidratos: 49, grasa: 6, fibra: 2, grupo: 'cereal', gramosPorUnidad: 25 },
    'Mayonesa': { kcal: 680, proteina: 1, hidratos: 3, grasa: 75, fibra: 0, grupo: 'grasa' },
    'Nueces': { kcal: 654, proteina: 15, hidratos: 14, grasa: 65, fibra: 6.7, grupo: 'frutos' },
    'Pan integral': { kcal: 250, proteina: 9, hidratos: 48, grasa: 3.3, fibra: 6, grupo: 'cereal', gramosPorUnidad: 30 },
    'Pan rallado': { kcal: 395, proteina: 13, hidratos: 72, grasa: 5, fibra: 4, grupo: 'cereal' },
    'Pasta integral': { kcal: 348, proteina: 13, hidratos: 71, grasa: 2.5, fibra: 8, grupo: 'cereal' },
    'Pimienta negra': { kcal: 251, proteina: 10, hidratos: 64, grasa: 3.3, fibra: 25, grupo: 'condimento' },
    'Sal': { kcal: 0, proteina: 0, hidratos: 0, grasa: 0, fibra: 0, grupo: 'condimento' },
    'Salsa de soja': { kcal: 53, proteina: 8, hidratos: 4.9, grasa: 0.6, fibra: 0.8, grupo: 'condimento' },
    'Tomate frito': { kcal: 80, proteina: 1.5, hidratos: 12, grasa: 3, fibra: 1.5, grupo: 'verdura' },
    'Tortillas de trigo': { kcal: 300, proteina: 8, hidratos: 50, grasa: 7, fibra: 3, grupo: 'cereal', gramosPorUnidad: 40 },
    'Fideos de arroz': { kcal: 360, proteina: 6, hidratos: 80, grasa: 0.9, fibra: 1.5, grupo: 'cereal' },
    'Cacahuetes': { kcal: 567, proteina: 26, hidratos: 16, grasa: 49, fibra: 8.5, grupo: 'frutos' },
    'Azúcar moreno': { kcal: 380, proteina: 0, hidratos: 98, grasa: 0, fibra: 0, grupo: 'despensa' },
    'Guindilla en copos': { kcal: 318, proteina: 12, hidratos: 57, grasa: 17, fibra: 27, grupo: 'condimento' },
    'Azafrán': { kcal: 310, proteina: 11, hidratos: 65, grasa: 6, fibra: 4, grupo: 'condimento' },
    'Frijoles negros': { kcal: 132, proteina: 8.9, hidratos: 24, grasa: 0.5, fibra: 8.7, grupo: 'legumbre' },
    'Pimentón ahumado': { kcal: 282, proteina: 14, hidratos: 54, grasa: 13, fibra: 35, grupo: 'condimento' },
    'Levadura química': { kcal: 97, proteina: 0.1, hidratos: 0, grasa: 0, fibra: 0, grupo: 'despensa' },

    // ------------------------------------------------------------- especias
    'Cilantro seco': { kcal: 298, proteina: 12, hidratos: 55, grasa: 4, fibra: 10, grupo: 'condimento' },
    'Comino molido': { kcal: 375, proteina: 18, hidratos: 44, grasa: 22, fibra: 10, grupo: 'condimento' },
    'Curry en polvo': { kcal: 325, proteina: 14, hidratos: 56, grasa: 14, fibra: 33, grupo: 'condimento' },
    'Laurel': { kcal: 313, proteina: 8, hidratos: 75, grasa: 8, fibra: 26, grupo: 'condimento', gramosPorUnidad: 0.2 },
    'Nuez moscada': { kcal: 525, proteina: 6, hidratos: 49, grasa: 36, fibra: 20, grupo: 'condimento' },
    'Orégano': { kcal: 265, proteina: 9, hidratos: 69, grasa: 4, fibra: 42, grupo: 'condimento' },
    'Perejil': { kcal: 36, proteina: 3, hidratos: 6, grasa: 0.8, fibra: 3.3, grupo: 'condimento' },
    'Pimentón dulce': { kcal: 282, proteina: 14, hidratos: 54, grasa: 13, fibra: 35, grupo: 'condimento' },
    'Cúrcuma': { kcal: 312, proteina: 9.7, hidratos: 67, grasa: 3.3, fibra: 22, grupo: 'condimento' },
    'Albahaca': { kcal: 23, proteina: 3.2, hidratos: 2.6, grasa: 0.6, fibra: 1.6, grupo: 'condimento' }
  },

  // Metadatos que no se deducen de los ingredientes.
  // tipo: carne | legumbre | cereal | pasta | huevo | verdura | proteina | tuberculo | elaborado
  recetas: {
    'receta-1': { tipo: 'carne', vegetariano: false, vegano: false, elaboracion: 'plancha' },
    'receta-2': { tipo: 'cereal', vegetariano: true, vegano: false, elaboracion: 'salteado' },
    'receta-3': { tipo: 'verdura', vegetariano: true, vegano: true, elaboracion: 'crema' },
    'receta-4': { tipo: 'legumbre', vegetariano: true, vegano: true, elaboracion: 'guiso' },
    'receta-5': { tipo: 'legumbre', vegetariano: true, vegano: false, elaboracion: 'frio' },
    'receta-6': { tipo: 'legumbre', vegetariano: true, vegano: true, elaboracion: 'guiso' },
    'receta-7': { tipo: 'legumbre', vegetariano: true, vegano: false, elaboracion: 'horno' },
    'receta-8': { tipo: 'pasta', vegetariano: true, vegano: false, elaboracion: 'cocido' },
    'receta-9': { tipo: 'carne', vegetariano: false, vegano: false, elaboracion: 'guiso' },
    'receta-10': { tipo: 'huevo', vegetariano: true, vegano: false, elaboracion: 'plancha' },
    'receta-11': { tipo: 'huevo', vegetariano: true, vegano: false, elaboracion: 'plancha' },
    'receta-12': { tipo: 'cereal', vegetariano: true, vegano: true, elaboracion: 'salteado' },
    'receta-13': { tipo: 'proteina', vegetariano: true, vegano: true, elaboracion: 'plancha' },
    'receta-14': { tipo: 'legumbre', vegetariano: true, vegano: true, elaboracion: 'guiso' },
    'receta-15': { tipo: 'pasta', vegetariano: true, vegano: false, elaboracion: 'cocido' },
    'receta-16': { tipo: 'tuberculo', vegetariano: true, vegano: false, elaboracion: 'frio' },
    'receta-17': { tipo: 'elaborado', vegetariano: true, vegano: false, elaboracion: 'horno' },
    'receta-18': { tipo: 'huevo', vegetariano: true, vegano: false, elaboracion: 'plancha' },
    'receta-19': { tipo: 'legumbre', vegetariano: true, vegano: false, elaboracion: 'plancha' },
    'receta-20': { tipo: 'elaborado', vegetariano: true, vegano: false, elaboracion: 'horno' },
    'receta-21': { tipo: 'legumbre', vegetariano: true, vegano: true, elaboracion: 'guiso' },
    'receta-22': { tipo: 'elaborado', vegetariano: true, vegano: false, elaboracion: 'salteado' },
    'receta-23': { tipo: 'cereal', vegetariano: true, vegano: true, elaboracion: 'cocido' },
    'receta-24': { tipo: 'elaborado', vegetariano: true, vegano: false, elaboracion: 'rapido' },
    'receta-25': { tipo: 'huevo', vegetariano: true, vegano: false, elaboracion: 'rapido' },
    'receta-26': { tipo: 'elaborado', vegetariano: true, vegano: false, elaboracion: 'horno' },
    'receta-27': { tipo: 'elaborado', vegetariano: true, vegano: false, elaboracion: 'horno' },
    'receta-28': { tipo: 'elaborado', vegetariano: true, vegano: false, elaboracion: 'elaborado' }
  },

  // Combinaciones saludables de día completo. El planificador reparte una
  // combinación por día y busca recetas compatibles para comida y cena.
  combinaciones: {
    'legumbre-verdura': {
      nombre: 'Legumbre + verdura',
      comida: ['legumbre'],
      cena: ['huevo', 'verdura', 'elaborado'],
      nota: 'Legumbre en la comida y una cena ligera con verdura o huevo.'
    },
    'pasta-verdura': {
      nombre: 'Pasta o cereal + verdura',
      comida: ['pasta', 'cereal'],
      cena: ['huevo', 'verdura', 'legumbre'],
      nota: 'Hidratos en la comida y cena ligera para compensar.'
    },
    'cereal-proteina': {
      nombre: 'Cereal + proteína vegetal',
      comida: ['cereal', 'proteina'],
      cena: ['verdura', 'huevo'],
      nota: 'Arroz o pasta con tofu/Heura y cena de verdura.'
    },
    'legumbre-proteina': {
      nombre: 'Legumbre + proteína vegetal',
      comida: ['legumbre'],
      cena: ['proteina', 'verdura'],
      nota: 'Doble aporte de proteína vegetal y fibra.'
    },
    'tradicional-ligera': {
      nombre: 'Guiso tradicional + cena ligera',
      comida: ['legumbre', 'tuberculo', 'elaborado'],
      cena: ['verdura', 'huevo'],
      nota: 'Cuchara tradicional y cena suave.'
    },
    'pasta-proteina': {
      nombre: 'Pasta + proteína vegetal',
      comida: ['pasta', 'cereal'],
      cena: ['proteina', 'verdura'],
      nota: 'Pasta en la comida y proteína vegetal en la cena.'
    },
    'domingo-tradicional': {
      nombre: 'Domingo de cuchara',
      comida: ['legumbre', 'elaborado', 'tuberculo'],
      cena: ['verdura', 'huevo', 'elaborado'],
      nota: 'Plato tradicional y cena sencilla.'
    }
  },

  // Plantilla semanal: cada día usa una combinación de las anteriores.
  semana: {
    LUN: 'legumbre-verdura',
    MAR: 'pasta-verdura',
    MIÉ: 'cereal-proteina',
    JUE: 'legumbre-proteina',
    VIE: 'tradicional-ligera',
    SÁB: 'pasta-proteina',
    DOM: 'domingo-tradicional'
  },

  // Metas semanales que usa el planificador y el panel de balance.
  objetivos: {
    legumbres: 3,
    verduras: 7,
    proteinaVegetal: 5,
    elaborados: 3,
    huevos: 5,
    variedad: 10,
    kcalComida: [500, 750],
    kcalCena: [400, 600],
    kcalDia: [900, 1350]
  },

  // Ingredientes que hacen que una receta no sea vegetariana.
  noVegetarianos: ['Albóndigas de ternera', 'Pollo'],

  // Equivalencias para convertir unidades caseras a gramos.
  unidades: {
    cucharadita: 5,
    cucharada: 15,
    cucharadas: 15,
    pizca: 0.5,
    puñado: 10,
    diente: 4,
    dientes: 4,
    rebanada: 30,
    rebanadas: 30,
    hoja: 0.2,
    hojas: 0.2
  },

  // Umbrales del semáforo de kcal por ración.
  perfiles: { ligera: 450, equilibrada: 650 }
};
