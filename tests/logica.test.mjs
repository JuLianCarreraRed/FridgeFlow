// ============================================================================
// Lógica pura: nutrición, tipos, pesos, slugs y formato de los .txt.
// ============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';

import { crearApp } from '../scripts/lib/app.mjs';

const plano = (valor) => JSON.parse(JSON.stringify(valor));

const { app, nutricion } = crearApp({ semilla: 42 });

const TIPOS_VALIDOS = new Set([
  'carne',
  'legumbre',
  'cereal',
  'pasta',
  'huevo',
  'verdura',
  'proteina',
  'tuberculo',
  'elaborado',
  'otro'
]);

test('todas las recetas calculan kcal por ración mayor que 0', () => {
  app.recetas.forEach((receta) => {
    assert.ok(app.kcalPorRacion(receta) > 0, `${receta.id} (${receta.nombre}) da 0 kcal`);
  });
});

test('kcalReceta = kcalPorRacion × porciones', () => {
  app.recetas.forEach((receta) => {
    const esperado = app.kcalPorRacion(receta) * Math.max(1, receta.porciones_base);
    // Ambas funciones redondean, así que se admite un margen pequeño.
    assert.ok(
      Math.abs(app.kcalReceta(receta) - esperado) <= 5,
      `${receta.id}: ${app.kcalReceta(receta)} vs ${esperado}`
    );
  });
});

test('los macros por ración son números no negativos', () => {
  app.recetas.forEach((receta) => {
    const { porRacion } = app.macrosReceta(receta);
    Object.entries(porRacion).forEach(([macro, valor]) => {
      assert.ok(Number.isFinite(valor) && valor >= 0, `${receta.id}: ${macro} = ${valor}`);
    });
  });
});

test('tipoReceta devuelve siempre un tipo conocido', () => {
  app.recetas.forEach((receta) => {
    const tipo = app.tipoReceta(receta);
    assert.ok(TIPOS_VALIDOS.has(tipo), `${receta.id}: tipo "${tipo}" no reconocido`);
  });
});

test('todos los pesos de ingrediente están entre 1 y 5', () => {
  app.recetas.forEach((receta) => {
    receta.ingredientes.forEach((ing) => {
      assert.ok(
        Number.isInteger(ing.peso) && ing.peso >= 1 && ing.peso <= 5,
        `${receta.id}: ${ing.nombre} tiene peso ${ing.peso}`
      );
    });
  });
});

test('gramosIngrediente convierte g, ml y kg', () => {
  assert.equal(app.gramosIngrediente({ nombre: 'Arroz', cantidad: 200, unidad: 'g' }), 200);
  assert.equal(app.gramosIngrediente({ nombre: 'Leche', cantidad: 100, unidad: 'ml' }), 100);
  assert.equal(app.gramosIngrediente({ nombre: 'Arroz', cantidad: 1, unidad: 'kg' }), 1000);
});

test('gramosIngrediente usa las equivalencias caseras', () => {
  assert.equal(app.gramosIngrediente({ nombre: 'Ajo', cantidad: 2, unidad: 'dientes' }), 8);
  assert.equal(app.gramosIngrediente({ nombre: 'Pan integral', cantidad: 1, unidad: 'rebanada' }), 30);
});

test('slugReceta respeta el mapa de slugs y normaliza acentos', () => {
  app.recetas.forEach((receta) => {
    const slug = app.slugReceta(receta);
    assert.ok(/^[a-z0-9-]+$/.test(slug), `slug inválido: ${slug}`);
  });
  const inventada = { id: 'receta-x', nombre: 'Calabacín Relleno de Quinoa' };
  assert.equal(app.slugReceta(inventada), 'calabacin-relleno-de-quinoa');
});

test('el formato de los .txt es estable', () => {
  assert.equal(app.formatearCantidadTxt(0.5), '1/2');
  assert.equal(app.formatearCantidadTxt(0.25), '1/4');
  assert.equal(app.formatearCantidadTxt(2), '2');
  assert.equal(app.formatearUnidadTxt('g (crudo)'), 'g en crudo');
  assert.equal(app.formatearUnidadTxt('ud'), 'ud');
});

test('recetaATxt genera el formato esperado', () => {
  const receta = app.recetas[0];
  const texto = app.recetaATxt(receta);
  assert.match(texto, /^=+\nRECETA: /);
  assert.match(texto, /Calorías: \d+ kcal por ración \(\d+ kcal totales\)/);
  assert.match(texto, /INGREDIENTES:/);
  assert.match(texto, /FIN DE RECETA/);
});

test('los objetivos de nutricion.js son coherentes', () => {
  const { objetivos } = nutricion;
  assert.ok(objetivos.kcalComida[0] < objetivos.kcalComida[1]);
  assert.ok(objetivos.kcalCena[0] < objetivos.kcalCena[1]);
  assert.ok(objetivos.kcalDia[0] < objetivos.kcalDia[1]);
});
