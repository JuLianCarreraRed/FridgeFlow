// ============================================================================
// Coherencia de datos: recetas, nutrición, catálogo, imágenes y .txt.
// ----------------------------------------------------------------------------
// Los tests marcados con `todo` documentan problemas conocidos: no hacen
// fallar la suite, pero deben desaparecer cuando se arregle la causa.
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

const usados = new Map();
app.recetas.forEach((receta) => {
  (receta.ingredientes || []).forEach((ing) => {
    if (!usados.has(ing.nombre)) usados.set(ing.nombre, []);
    usados.get(ing.nombre).push(receta.id);
  });
});

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

test(
  'todos los ingredientes usados tienen datos nutricionales',
  { todo: 'faltan 22 ingredientes de las recetas 21-28 en data/nutricion.js' },
  () => {
    const faltan = [...usados.keys()].filter((n) => !nutricionSet.has(n));
    assert.deepEqual(plano(faltan), []);
  }
);

test(
  'todos los ingredientes usados están en el catálogo',
  { todo: 'faltan 22 ingredientes de las recetas 21-28 en CATALOGO_INGREDIENTES' },
  () => {
    const faltan = [...usados.keys()].filter((n) => !catalogoSet.has(n));
    assert.deepEqual(plano(faltan), []);
  }
);

test('catálogo y tabla nutricional están sincronizados', {
  todo: 'faltan 22 ingredientes de las recetas 21-28 en CATALOGO_INGREDIENTES'
}, () => {
  assert.deepEqual(plano([...catalogoSet].filter((n) => !nutricionSet.has(n))), []);
  assert.deepEqual(plano([...nutricionSet].filter((n) => !catalogoSet.has(n))), []);
});

test(
  'las imágenes de las recetas existen con el nombre exacto',
  { todo: 'las recetas 21-28 apuntan a .jpg y en disco están como .JPG' },
  () => {
    const dir = path.join(ROOT, 'assets', 'images', 'recetas');
    const enDisco = new Set(fs.readdirSync(dir));
    const faltan = app.recetas
      .filter((r) => r.imagen && !enDisco.has(r.imagen))
      .map((r) => `${r.id} -> ${r.imagen}`);
    assert.deepEqual(plano(faltan), []);
  }
);

test('IMAGENES_RECETAS solo lista archivos existentes', () => {
  const dir = path.join(ROOT, 'assets', 'images', 'recetas');
  const enDisco = new Set(fs.readdirSync(dir));
  const rotas = IMAGENES_RECETAS.filter((imagen) => !enDisco.has(imagen));
  assert.deepEqual(plano(rotas), []);
});

test(
  'los .txt coinciden con las kcal calculadas por la app',
  { todo: '19 de 28 .txt están desactualizados respecto a js/app.js' },
  () => {
    const dir = path.join(ROOT, 'data', 'recetas');
    const discrepancias = [];
    app.recetas.forEach((receta) => {
      const slug = SLUGS_RECETAS_DEFECTO[receta.id];
      if (!slug) return;
      const archivo = path.join(dir, `${slug}.txt`);
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
  }
);
