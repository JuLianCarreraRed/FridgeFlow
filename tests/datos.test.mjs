// ============================================================================
// Coherencia de datos: recetas, nutrición, catálogo, imágenes y .txt.
// ----------------------------------------------------------------------------
// La lógica pura (tipos, pesos, slugs, formato) se prueba en logica.test.mjs.
// Aquí solo se comprueba que las cuatro fuentes de datos encajan entre sí.
// ============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { crearApp, ROOT } from '../scripts/lib/app.mjs';

// Los objetos creados dentro del `vm` no son reference-equal con los de Node:
// deepEqual compara prototipos. Este round-trip los trae al realm actual.
const plano = (valor) => JSON.parse(JSON.stringify(valor));

const { app, nutricion, CATALOGO_INGREDIENTES, SLUGS_RECETAS_DEFECTO, IMAGENES_RECETAS } = crearApp();

const nutricionSet = new Set(Object.keys(nutricion.ingredientes || {}));
const catalogoSet = new Set(Object.values(CATALOGO_INGREDIENTES).flat());

const usados = new Set();
app.recetas.forEach((receta) => {
  (receta.ingredientes || []).forEach((ing) => usados.add(ing.nombre));
});

const dirImagenes = path.join(ROOT, 'assets', 'images', 'recetas');
const imagenesEnDisco = new Set(fs.readdirSync(dirImagenes));

const dirRecetas = path.join(ROOT, 'data', 'recetas');

test('hay 28 recetas por defecto', () => {
  assert.equal(app.recetas.length, 28);
});

test('los ids de receta son únicos', () => {
  const ids = app.recetas.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('los nombres de receta son únicos', () => {
  const nombres = app.recetas.map((r) => r.nombre);
  const duplicados = nombres.filter((n, i) => nombres.indexOf(n) !== i);
  assert.deepEqual(plano(duplicados), []);
});

test('todas las recetas por defecto tienen slug de .txt', () => {
  const sinSlug = app.recetas.filter((r) => !SLUGS_RECETAS_DEFECTO[r.id]).map((r) => r.id);
  assert.deepEqual(plano(sinSlug), []);
});

test('todos los ingredientes usados tienen datos nutricionales', () => {
  const faltan = [...usados].filter((n) => !nutricionSet.has(n));
  assert.deepEqual(plano(faltan), []);
});

test('todos los ingredientes usados están en el catálogo', () => {
  const faltan = [...usados].filter((n) => !catalogoSet.has(n));
  assert.deepEqual(plano(faltan), []);
});

test('catálogo y tabla nutricional están sincronizados', () => {
  assert.deepEqual(plano([...catalogoSet].filter((n) => !nutricionSet.has(n))), []);
  assert.deepEqual(plano([...nutricionSet].filter((n) => !catalogoSet.has(n))), []);
});

test('el tofu está unificado en un solo ingrediente', () => {
  assert.ok(usados.has('Tofu'), 'ninguna receta usa Tofu');
  ['Tofu firme', 'Tofu ahumado'].forEach((nombre) => {
    assert.ok(!usados.has(nombre), `${nombre} sigue en alguna receta`);
    assert.ok(!catalogoSet.has(nombre), `${nombre} sigue en el catálogo`);
    assert.ok(!nutricionSet.has(nombre), `${nombre} sigue en nutrición`);
  });
});

test('las imágenes de las recetas existen con el nombre exacto', () => {
  const faltan = app.recetas
    .filter((r) => r.imagen && !imagenesEnDisco.has(r.imagen))
    .map((r) => `${r.id} -> ${r.imagen}`);
  assert.deepEqual(plano(faltan), []);
});

test('IMAGENES_RECETAS solo lista archivos existentes', () => {
  const rotas = IMAGENES_RECETAS.filter((imagen) => !imagenesEnDisco.has(imagen));
  assert.deepEqual(plano(rotas), []);
});

test('los .txt existen para todas las recetas', () => {
  const faltan = app.recetas
    .map((r) => SLUGS_RECETAS_DEFECTO[r.id])
    .filter((slug) => slug && !fs.existsSync(path.join(dirRecetas, `${slug}.txt`)));
  assert.deepEqual(plano(faltan), []);
});

test('los .txt coinciden con las kcal calculadas por la app', () => {
  const discrepancias = [];
  app.recetas.forEach((receta) => {
    const slug = SLUGS_RECETAS_DEFECTO[receta.id];
    if (!slug) return;
    const archivo = path.join(dirRecetas, `${slug}.txt`);
    if (!fs.existsSync(archivo)) {
      discrepancias.push(`${slug}: falta`);
      return;
    }
    const texto = fs.readFileSync(archivo, 'utf8');
    const match = texto.match(/Calorías:\s*(\d+)\s*kcal por ración/);
    if (!match) {
      discrepancias.push(`${slug}: sin línea de calorías`);
      return;
    }
    const kcalTxt = Number(match[1]);
    const kcalApp = app.kcalPorRacion(receta);
    if (Math.abs(kcalTxt - kcalApp) / Math.max(1, kcalTxt) > 0.05) {
      discrepancias.push(`${slug}: ${kcalTxt} vs ${kcalApp}`);
    }
  });
  assert.deepEqual(plano(discrepancias), []);
});

test('todas las recetas tienen al menos 500 kcal por ración', () => {
  const flojas = app.recetas
    .filter((r) => app.kcalPorRacion(r) < 500)
    .map((r) => `${r.id}: ${app.kcalPorRacion(r)} kcal`);
  assert.deepEqual(plano(flojas), []);
});

test('el formato de los .txt es estable', () => {
  const archivos = fs.readdirSync(dirRecetas).filter((f) => f.endsWith('.txt'));
  assert.ok(archivos.length >= 20);
});

test('recetaATxt genera el formato esperado', () => {
  const slug = 'albondigas-tomate';
  const texto = fs.readFileSync(path.join(dirRecetas, `${slug}.txt`), 'utf8');
  assert.match(texto, /^=+\nRECETA: /);
  assert.match(texto, /Calorías: \d+ kcal por ración \(\d+ kcal totales\)/);
  assert.match(texto, /INGREDIENTES:/);
  assert.match(texto, /FIN DE RECETA/);
});
