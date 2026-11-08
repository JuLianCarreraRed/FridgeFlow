// ============================================================================
// Filtro de coincidencia del recetario: cobertura estirada + plus por protagonistas.
// ============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';

import { crearApp } from '../scripts/lib/app.mjs';

const { app } = crearApp({ semilla: 42 });
const receta = app.recetas.find((item) => item.id === 'receta-2');

test('sin ingredientes seleccionados la coincidencia es 0', () => {
  const info = app.calcularCoincidencia(receta, []);
  assert.equal(info.puntuacion, 0);
  assert.equal(info.coincidencias, 0);
  assert.equal(info.protagonistas, 0);
});

test('un ingrediente protagonista da una coincidencia alta y suma el plus', () => {
  const info = app.calcularCoincidencia(receta, ['Arroz']);
  assert.equal(info.coincidencias, 1);
  assert.equal(info.protagonistas, 1);
  assert.ok(info.puntuacion >= 0.5, `coincidencia ${info.puntuacion}`);
  assert.ok(info.puntuacion < 0.7, `la barra no debe llenarse de golpe: ${info.puntuacion}`);
  assert.ok(info.puntuacion <= 1);
});

test('un condimento no recibe el plus por protagonista', () => {
  const info = app.calcularCoincidencia(receta, ['Sal']);
  assert.equal(info.coincidencias, 1);
  assert.equal(info.protagonistas, 0);
  assert.ok(info.puntuacion < 0.2, `coincidencia ${info.puntuacion}`);
});

test('dos protagonistas puntúan más que uno', () => {
  const uno = app.calcularCoincidencia(receta, ['Arroz']);
  const dos = app.calcularCoincidencia(receta, ['Arroz', 'Huevos']);
  assert.equal(dos.protagonistas, 2);
  assert.ok(dos.puntuacion > uno.puntuacion);
});

test('seleccionar todos los ingredientes da el 100 %', () => {
  const nombres = receta.ingredientes.map((ing) => ing.nombre);
  const info = app.calcularCoincidencia(receta, nombres);
  assert.equal(info.coincidencias, receta.ingredientes.length);
  assert.equal(info.protagonistas, 2);
  assert.equal(info.puntuacion, 1);
});

test('un ingrediente que no está en la receta no puntúa', () => {
  const info = app.calcularCoincidencia(receta, ['Ingrediente que no existe']);
  assert.equal(info.puntuacion, 0);
  assert.equal(info.coincidencias, 0);
  assert.equal(info.protagonistas, 0);
});

test('la coincidencia nunca supera el 100 %', () => {
  app.recetas.forEach((item) => {
    const nombres = item.ingredientes.map((ing) => ing.nombre);
    const info = app.calcularCoincidencia(item, nombres);
    assert.ok(info.puntuacion <= 1, `${item.id}: ${info.puntuacion}`);
  });
});

test('la búsqueda encuentra por nombre, descripción e ingrediente', () => {
  assert.equal(app.coincideBusqueda(receta, 'salteado'), true);
  assert.equal(app.coincideBusqueda(receta, 'huevo'), true);
  assert.equal(app.coincideBusqueda(receta, 'tofu'), false);
  assert.equal(app.coincideBusqueda(receta, ''), true);
});

test('la búsqueda combina varias palabras y ignora acentos', () => {
  assert.equal(app.coincideBusqueda(receta, 'arroz HUEVO'), true);
  assert.equal(app.coincideBusqueda(receta, 'arroz tofu'), false);
  const crema = app.recetas.find((item) => item.id === 'receta-3');
  assert.equal(app.coincideBusqueda(crema, 'CALABAZA'), true);
});
