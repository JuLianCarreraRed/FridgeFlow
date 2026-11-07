// ============================================================================
// Planificador: construcción de la semana y análisis del equilibrio.
// Se usa una semilla fija para que Math.random sea reproducible.
// ============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';

import { crearApp } from '../scripts/lib/app.mjs';

const plano = (valor) => JSON.parse(JSON.stringify(valor));

const { app, nutricion } = crearApp({ semilla: 1234 });

const despensa = new Set(Object.values(app.ingredientes).flat());
const elegibles = app.recetasElegibles();

test('hay recetas elegibles con el menú vegetariano activo', () => {
  assert.ok(elegibles.length > 0);
  assert.ok(elegibles.every((r) => app.esVegetariana(r)));
});

test('construirSemana rellena los 14 huecos', () => {
  const semana = app.construirSemana(elegibles, despensa, nutricion);
  assert.equal(Object.keys(semana).length, 14);

  app.dias.forEach((dia) => {
    app.comidas.forEach((comida) => {
      const entrada = semana[`${dia}-${comida}`];
      assert.ok(entrada, `falta ${dia}-${comida}`);
      assert.ok(app.recetaPorId(entrada.recetaId), `${dia}-${comida} apunta a una receta inexistente`);
    });
  });
});

test('construirSemana no repite la misma receta en el mismo día', () => {
  const semana = app.construirSemana(elegibles, despensa, nutricion);
  app.dias.forEach((dia) => {
    const comida = semana[`${dia}-COMIDA`]?.recetaId;
    const cena = semana[`${dia}-CENA`]?.recetaId;
    assert.notEqual(comida, cena, `${dia} repite receta en comida y cena`);
  });
});

test('las sobras de ayer solo se aplican a legumbres o elaborados', () => {
  const semana = app.construirSemana(elegibles, despensa, nutricion);
  Object.entries(semana).forEach(([clave, entrada]) => {
    if (!entrada.deAyer) return;
    const receta = app.recetaPorId(entrada.recetaId);
    assert.ok(
      ['legumbre', 'elaborado'].includes(app.tipoReceta(receta)),
      `${clave}: ${receta.id} no es legumbre ni elaborado`
    );
  });
});

test('analizarSemana devuelve una puntuación entre 0 y 100', () => {
  const semana = app.construirSemana(elegibles, despensa, nutricion);
  const analisis = app.analizarSemana(semana);
  assert.ok(Number.isFinite(analisis.puntuacion));
  assert.ok(analisis.puntuacion >= 0 && analisis.puntuacion <= 100, `puntuación ${analisis.puntuacion}`);
  assert.ok(analisis.kcalComida > 0);
  assert.ok(analisis.kcalCena > 0);
  assert.ok(analisis.kcalDia > 0);
});

test('analizarSemana cuenta los 14 platos', () => {
  const semana = app.construirSemana(elegibles, despensa, nutricion);
  const analisis = app.analizarSemana(semana);
  assert.equal(analisis.comidas.length, 14);
});

test('una semana vacía no rompe el análisis', () => {
  const analisis = app.analizarSemana({});
  assert.equal(analisis.comidas.length, 0);
  assert.equal(analisis.kcalDia, 0);
});
