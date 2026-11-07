#!/usr/bin/env node
// ============================================================================
// Comprueba que los datos de FridgeFlow son coherentes.
// ----------------------------------------------------------------------------
//   npm run datos             → informe y falla si hay errores
//   npm run datos:estricto    → los avisos también fallan
//
// Comprueba:
//   1. Ingredientes de receta con datos nutricionales.
//   2. Ingredientes de receta dentro del catálogo.
//   3. Catálogo y tabla nutricional sincronizados.
//   4. Imágenes existentes, con nombre y extensión exactos.
//   5. Recetas con slug y .txt presentes.
//   6. El .txt coincide con lo que calcula la app (kcal, tipo, vegetariano).
//   7. Unidades caseras con equivalencia conocida.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';

import { crearApp, ROOT } from './lib/app.mjs';

const ARGS = new Set(process.argv.slice(2));
const MODO_ESTRICTO = ARGS.has('--strict');

const errores = [];
const avisos = [];

const error = (bloque, mensaje) => errores.push({ bloque, mensaje });
const aviso = (bloque, mensaje) => avisos.push({ bloque, mensaje });

function cabecera(titulo) {
  console.log(`\n${titulo}`);
  console.log('-'.repeat(Math.max(12, titulo.length)));
}

// ---------------------------------------------------------------- carga
const { app, nutricion, DEFAULT_RECIPES, CATALOGO_INGREDIENTES, SLUGS_RECETAS_DEFECTO, IMAGENES_RECETAS } =
  crearApp();

const recetas = app.recetas;
const catalogo = new Set(Object.values(CATALOGO_INGREDIENTES).flat());
const tablaNutricional = new Set(Object.keys(nutricion.ingredientes || {}));

// Ingrediente -> ids de receta que lo usan
const usados = new Map();
recetas.forEach((receta) => {
  (receta.ingredientes || []).forEach((ing) => {
    if (!usados.has(ing.nombre)) usados.set(ing.nombre, new Set());
    usados.get(ing.nombre).add(receta.id);
  });
});

const dirImagenes = path.join(ROOT, 'assets', 'images', 'recetas');
const archivosImagen = fs.existsSync(dirImagenes)
  ? fs.readdirSync(dirImagenes).filter((f) => /\.(jpe?g|png|webp|avif|gif|jfif)$/i.test(f))
  : [];
const imagenesEnDisco = new Set(archivosImagen);
const imagenesPorMinusculas = new Map(archivosImagen.map((f) => [f.toLowerCase(), f]));

const dirTxt = path.join(ROOT, 'data', 'recetas');
const archivosTxt = fs.existsSync(dirTxt)
  ? fs.readdirSync(dirTxt).filter((f) => f.toLowerCase().endsWith('.txt'))
  : [];
const slugsEnDisco = new Set(archivosTxt.map((f) => f.replace(/\.txt$/i, '')));

// ------------------------------------------------- 1. nutrición y catálogo
const sinNutricion = [...usados.keys()].filter((nombre) => !tablaNutricional.has(nombre));
if (sinNutricion.length) {
  sinNutricion.forEach((nombre) => {
    const ids = [...usados.get(nombre)].sort().join(', ');
    error('nutrición', `"${nombre}" no tiene datos nutricionales (lo usan: ${ids})`);
  });
}

const sinCatalogo = [...usados.keys()].filter((nombre) => !catalogo.has(nombre));
if (sinCatalogo.length) {
  sinCatalogo.forEach((nombre) => {
    const ids = [...usados.get(nombre)].sort().join(', ');
    error('catálogo', `"${nombre}" no está en CATALOGO_INGREDIENTES (lo usan: ${ids})`);
  });
}

const catalogoSinNutricion = [...catalogo].filter((nombre) => !tablaNutricional.has(nombre));
catalogoSinNutricion.forEach((nombre) =>
  error('catálogo', `"${nombre}" está en el catálogo pero no en nutricion.js`)
);

const nutricionSinCatalogo = [...tablaNutricional].filter((nombre) => !catalogo.has(nombre));
nutricionSinCatalogo.forEach((nombre) =>
  error('catálogo', `"${nombre}" está en nutricion.js pero no en el catálogo`)
);

// ------------------------------------------------------------- 2. recetas
const ids = new Set();
const nombres = new Set();
recetas.forEach((receta) => {
  if (ids.has(receta.id)) error('recetas', `id duplicado: ${receta.id}`);
  ids.add(receta.id);

  if (nombres.has(receta.nombre)) error('recetas', `nombre duplicado: "${receta.nombre}"`);
  nombres.add(receta.nombre);

  if (!receta.ingredientes.length) error('recetas', `${receta.id} no tiene ingredientes`);

  const kcal = app.kcalPorRacion(receta);
  if (!(kcal > 0)) error('recetas', `${receta.id} calcula 0 kcal/ración (¿faltan datos?)`);

  (receta.ingredientes || []).forEach((ing) => {
    if (!(Number(ing.cantidad) > 0)) {
      error('recetas', `${receta.id}: "${ing.nombre}" tiene cantidad inválida (${ing.cantidad})`);
    }
    if (!ing.categoria) error('recetas', `${receta.id}: "${ing.nombre}" no tiene categoría`);
  });
});

const idsSinMetadatos = DEFAULT_RECIPES.filter((r) => !(nutricion.recetas && nutricion.recetas[r.id])).map(
  (r) => r.id
);
if (idsSinMetadatos.length) {
  aviso('recetas', `sin metadatos en nutricion.js (tipo/vegetariano): ${idsSinMetadatos.join(', ')}`);
}

// ------------------------------------------------------------ 3. imágenes
recetas.forEach((receta) => {
  const imagen = receta.imagen || '';
  if (!imagen) {
    error('imágenes', `${receta.id} no tiene imagen`);
    return;
  }
  if (imagen !== imagen.toLowerCase()) {
    error('imágenes', `${receta.id} referencia "${imagen}" con mayúsculas; debe ir en minúsculas`);
  }
  if (!imagenesEnDisco.has(imagen)) {
    const alternativa = imagenesPorMinusculas.get(imagen.toLowerCase());
    if (alternativa) {
      error(
        'imágenes',
        `${receta.id}: falta "${imagen}", en disco existe "${alternativa}" (mayúsculas/extensión distintas)`
      );
    } else {
      error('imágenes', `${receta.id}: no existe assets/images/recetas/${imagen}`);
    }
  }
});

const listadas = new Set(IMAGENES_RECETAS);
[...listadas].forEach((imagen) => {
  if (!imagenesEnDisco.has(imagen)) {
    error('imágenes', `IMAGENES_RECETAS lista "${imagen}", que no existe en disco`);
  }
});
archivosImagen.forEach((imagen) => {
  if (!listadas.has(imagen)) {
    aviso('imágenes', `"${imagen}" existe en disco pero no está en IMAGENES_RECETAS`);
  }
});
recetas.forEach((receta) => {
  if (receta.imagen && !listadas.has(receta.imagen)) {
    aviso('imágenes', `${receta.id} usa "${receta.imagen}", que no está en IMAGENES_RECETAS`);
  }
});

// ---------------------------------------------------------------- 4. .txt
const slugsDeclarados = new Set(Object.values(SLUGS_RECETAS_DEFECTO));

recetas.forEach((receta) => {
  if (!SLUGS_RECETAS_DEFECTO[receta.id]) {
    // Las recetas creadas por el usuario no tienen slug fijo: se deriva del nombre.
    if (DEFAULT_RECIPES.some((r) => r.id === receta.id)) {
      error('.txt', `${receta.id} no tiene slug en SLUGS_RECETAS_DEFECTO`);
    }
    return;
  }

  const slug = SLUGS_RECETAS_DEFECTO[receta.id];
  const generado = app.slugReceta(receta);
  if (generado !== slug) {
    error('.txt', `${receta.id}: slugReceta() devuelve "${generado}" pero el mapa dice "${slug}"`);
  }

  if (!slugsEnDisco.has(slug)) {
    error('.txt', `${receta.id}: falta data/recetas/${slug}.txt`);
    return;
  }

  const contenido = fs.readFileSync(path.join(dirTxt, `${slug}.txt`), 'utf8');
  const kcalTxt = Number((contenido.match(/Calorías:\s*(\d+)\s*kcal por ración/) || [])[1]);
  const tipoTxt = (contenido.match(/Tipo:\s*(.+)/) || [])[1];
  const vegTxt = (contenido.match(/Vegetariano:\s*(sí|no)/i) || [])[1];
  const kcalApp = app.kcalPorRacion(receta);
  const tipoApp = app.tipoReceta(receta);
  const vegApp = app.esVegetariana(receta) ? 'sí' : 'no';

  if (kcalTxt && Math.abs(kcalApp - kcalTxt) / Math.max(1, kcalTxt) > 0.05) {
    const desviacion = Math.round(((kcalApp - kcalTxt) / kcalTxt) * 100);
    aviso('.txt', `${slug}: kcal app ${kcalApp} vs .txt ${kcalTxt} (${desviacion > 0 ? '+' : ''}${desviacion} %)`);
  }
  if (!kcalTxt) {
    aviso('.txt', `${slug}: no se pudo leer "Calorías" del .txt`);
  }
  if (tipoTxt && tipoTxt.trim() !== tipoApp) {
    aviso('.txt', `${slug}: tipo app "${tipoApp}" vs .txt "${tipoTxt.trim()}"`);
  }
  if (vegTxt && vegTxt.toLowerCase() !== vegApp) {
    aviso('.txt', `${slug}: vegetariano app "${vegApp}" vs .txt "${vegTxt}"`);
  }
});

[...slugsEnDisco].forEach((slug) => {
  if (!slugsDeclarados.has(slug)) {
    aviso('.txt', `data/recetas/${slug}.txt no corresponde a ninguna receta (¿archivo huérfano?)`);
  }
});

// Archivos que no son .txt pero viven en data/recetas
if (fs.existsSync(dirTxt)) {
  fs.readdirSync(dirTxt)
    .filter((f) => !f.toLowerCase().endsWith('.txt'))
    .forEach((f) => aviso('.txt', `archivo inesperado en data/recetas: ${f}`));
}

// ------------------------------------------------------------ 5. unidades
const unidadesSinEquivalencia = new Map();
recetas.forEach((receta) => {
  (receta.ingredientes || []).forEach((ing) => {
    const unidad = String(ing.unidad || '').toLowerCase().trim();
    if (/^(kg|g|gr|ml|cc|l)\b/.test(unidad)) return;
    const info = nutricion.ingredientes[ing.nombre];
    const tieneEquivalencia = Object.keys(nutricion.unidades || {}).some((clave) =>
      unidad.includes(clave)
    );
    if (!tieneEquivalencia && !(info && Number(info.gramosPorUnidad) > 0)) {
      unidadesSinEquivalencia.set(`${ing.nombre}|${unidad}`, `${ing.nombre} usa "${ing.unidad}"`);
    }
  });
});
unidadesSinEquivalencia.forEach((texto) =>
  aviso('unidades', `${texto} sin equivalencia conocida; se asumen 100 g por unidad`)
);

if (Number(nutricion.unidades?.cucharada) > 0 && Number(nutricion.unidades.cucharada) < 10) {
  aviso('unidades', `cucharada = ${nutricion.unidades.cucharada} g; una cucharada sopera son ~15 g`);
}

// ------------------------------------------------------------ 6. despensa
const enDespensa = new Set(Object.values(app.ingredientes).flat());
const recetasSinNadaEnCasa = recetas.filter(
  (r) => (r.ingredientes || []).filter((i) => enDespensa.has(i.nombre)).length === 0
);
recetasSinNadaEnCasa.forEach((r) =>
  aviso('despensa', `${r.id} no comparte ningún ingrediente con la despensa inicial`)
);

// ------------------------------------------------------------- informe
console.log('FridgeFlow · comprobación de datos');
console.log('='.repeat(52));
console.log(`Recetas:                  ${recetas.length}`);
console.log(`Ingredientes usados:      ${usados.size}`);
console.log(`Catálogo:                 ${catalogo.size}`);
console.log(`Datos nutricionales:      ${tablaNutricional.size}`);
console.log(`Imágenes en disco:        ${imagenesEnDisco.size}`);
console.log(`Archivos .txt:            ${slugsEnDisco.size}`);

function imprimir(lista, titulo, simbolo) {
  if (!lista.length) return;
  cabecera(`${simbolo} ${titulo} (${lista.length})`);
  const porBloque = new Map();
  lista.forEach(({ bloque, mensaje }) => {
    if (!porBloque.has(bloque)) porBloque.set(bloque, []);
    porBloque.get(bloque).push(mensaje);
  });
  porBloque.forEach((mensajes, bloque) => {
    console.log(`\n[${bloque}]`);
    mensajes.forEach((mensaje) => console.log(`  ${simbolo} ${mensaje}`));
  });
}

imprimir(errores, 'ERRORES', '✗');
imprimir(avisos, 'AVISOS', '⚠');

console.log('\n' + '='.repeat(52));
console.log(`Resultado: ${errores.length} error(es), ${avisos.length} aviso(s)`);

if (errores.length) {
  console.log('\nSiguiente paso: corrige los errores y vuelve a ejecutar `npm run datos`.');
} else if (avisos.length) {
  console.log('\nSin errores bloqueantes. Revisa los avisos antes de dar por buenos los datos.');
} else {
  console.log('\nTodo coherente.');
}

if (errores.length || (MODO_ESTRICTO && avisos.length)) {
  process.exitCode = 1;
}
