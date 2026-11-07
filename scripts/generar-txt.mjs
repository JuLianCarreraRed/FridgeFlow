#!/usr/bin/env node
// ============================================================================
// Regenera data/recetas/*.txt a partir de DEFAULT_RECIPES (js/app.js).
// ----------------------------------------------------------------------------
// Por defecto NO escribe: solo enseña qué cambiaría.
//
//   npm run datos:generar                  → simulación (segura)
//   npm run datos:generar -- --solo receta-11
//   npm run datos:generar:escribir         → escribe los .txt
//
// Antes de escribir, revisa el diff. Los .txt actuales pueden contener
// ingredientes o pasos que solo existen ahí; si es el caso, primero hay que
// llevarlos a js/app.js y después regenerar.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';

import { crearApp, ROOT } from './lib/app.mjs';

const args = process.argv.slice(2);
const escribir = args.includes('--write');
const indiceSolo = args.indexOf('--solo');
const solo = indiceSolo >= 0 ? args[indiceSolo + 1] : null;

const { app } = crearApp();

const dirTxt = path.join(ROOT, 'data', 'recetas');
if (!fs.existsSync(dirTxt)) {
  console.error(`No existe ${dirTxt}`);
  process.exit(1);
}

const normalizar = (texto) => texto.replace(/\r\n/g, '\n').trimEnd();

function kcalDeTxt(texto) {
  const match = texto.match(/Calorías:\s*(\d+)\s*kcal por ración/);
  return match ? Number(match[1]) : null;
}

const recetas = solo ? app.recetas.filter((r) => r.id === solo) : app.recetas;
if (solo && !recetas.length) {
  console.error(`No hay ninguna receta con id "${solo}".`);
  process.exit(1);
}

const filas = [];

recetas.forEach((receta) => {
  const slug = app.slugReceta(receta);
  const destino = path.join(dirTxt, `${slug}.txt`);
  const contenido = app.recetaATxt(receta);
  const existe = fs.existsSync(destino);
  const actual = existe ? fs.readFileSync(destino, 'utf8') : null;

  const cambia = !actual || normalizar(actual) !== normalizar(contenido);
  const kcalApp = app.kcalPorRacion(receta);
  const kcalTxt = actual ? kcalDeTxt(actual) : null;

  filas.push({ receta, slug, destino, contenido, existe, cambia, kcalApp, kcalTxt });
});

const pendientes = filas.filter((f) => f.cambia);

console.log('FridgeFlow · sincronización de .txt');
console.log('='.repeat(60));
console.log(`Recetas: ${filas.length}`);
console.log(`Iguales: ${filas.length - pendientes.length}`);
console.log(`Cambiarían: ${pendientes.length}`);
if (!escribir) console.log('Modo simulación (no se escribe nada).');

if (pendientes.length) {
  console.log('\nRecetas que cambiarían');
  console.log('-'.repeat(60));
  pendientes.forEach(({ receta, slug, existe, kcalApp, kcalTxt }) => {
    const estado = existe ? (kcalTxt ? `kcal ${kcalTxt} → ${kcalApp}` : `kcal ${kcalApp}`) : 'nuevo';
    console.log(`  ${receta.id.padEnd(10)} ${slug.padEnd(34)} ${estado}`);
  });
}

if (!escribir) {
  console.log('\nPara escribirlos:  npm run datos:generar:escribir');
  console.log('Revisa antes el diff: los .txt pueden tener datos manuales que no están en js/app.js.');
  process.exit(0);
}

if (!pendientes.length) {
  console.log('\nNada que escribir: los .txt ya coinciden.');
  process.exit(0);
}

let escritos = 0;
pendientes.forEach(({ destino, contenido }) => {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, contenido, 'utf8');
  escritos += 1;
});

console.log(`\nEscritos ${escritos} archivo(s) en data/recetas/.`);
console.log('Ahora ejecuta `npm run datos` para comprobar que todo cuadra.');
