// ============================================================================
// Persistencia: migración de versión, datos corruptos y normalización.
// ----------------------------------------------------------------------------
// El test de migración está marcado como `todo` porque documenta un bug real:
// cargarDatos() llama a guardarDatos() antes de leer STORAGE_WEEK, así que la
// semana guardada se sobrescribe con {}.
// ============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';

import { crearApp } from '../scripts/lib/app.mjs';

const plano = (valor) => JSON.parse(JSON.stringify(valor));

const VERSION = 'fridgeflow_version';
const SEMANA = 'fridgeflow_semana';
const RECETAS = 'fridgeflow_recetas';
const INGREDIENTES = 'fridgeflow_ingredientes';

function almacenCon({ version = '2.5', semana, recetas = [], ingredientes = null } = {}) {
  const almacen = new Map();
  almacen.set(VERSION, version);
  if (semana !== undefined) almacen.set(SEMANA, JSON.stringify(semana));
  almacen.set(RECETAS, JSON.stringify(recetas));
  if (ingredientes !== null) almacen.set(INGREDIENTES, JSON.stringify(ingredientes));
  return almacen;
}

test('con la misma versión, la semana se conserva', () => {
  const semana = { 'LUN-COMIDA': { recetaId: 'receta-4', deAyer: false } };
  const { app } = crearApp({ almacen: almacenCon({ version: '2.5', semana }), cargar: false });
  app.cargarDatos();
  assert.equal(app.semana['LUN-COMIDA'].recetaId, 'receta-4');
});

test(
  'la migración conserva el menú semanal',
  { todo: 'bug conocido: guardarDatos() sobrescribe STORAGE_WEEK antes de leerlo' },
  () => {
    const semana = { 'LUN-COMIDA': { recetaId: 'receta-4', deAyer: false } };
    const { app } = crearApp({ almacen: almacenCon({ version: '2.4', semana }), cargar: false });
    app.cargarDatos();
    assert.equal(app.semana['LUN-COMIDA']?.recetaId, 'receta-4');
  }
);

test('un JSON corrupto no impide cargar la app', () => {
  const almacen = new Map([
    [VERSION, '2.5'],
    [RECETAS, '{esto no es json'],
    [SEMANA, 'tampoco']
  ]);

  const avisoOriginal = console.warn;
  console.warn = () => {};
  try {
    const { app } = crearApp({ almacen, cargar: false });
    assert.doesNotThrow(() => app.cargarDatos());
    assert.equal(app.recetas.length, 28);
    assert.deepEqual(plano(app.semana), {});
  } finally {
    console.warn = avisoOriginal;
  }
});

test('cargarDatos añade las recetas por defecto que falten', () => {
  const { app } = crearApp({
    almacen: almacenCon({ version: '2.5', recetas: [], semana: {} }),
    cargar: false
  });
  app.cargarDatos();
  assert.equal(app.recetas.length, 28);
});

test('fusionarIngredientes no duplica ni pierde categorías', () => {
  const { app } = crearApp({ cargar: false });
  const fusionado = app.fusionarIngredientes(
    { Verduras: ['Ajo', 'Cebolla'] },
    { Verduras: ['Ajo', 'Tomate'], Despensa: ['Arroz'] }
  );
  assert.deepEqual(plano(fusionado.Verduras), ['Ajo', 'Cebolla', 'Tomate']);
  assert.deepEqual(plano(fusionado.Despensa), ['Arroz']);
});

test('normalizarReceta rellena campos y limita el peso', () => {
  const { app } = crearApp({ cargar: false });
  const receta = app.normalizarReceta({
    id: 'receta-x',
    nombre: 'Prueba',
    ingredientes: [{ nombre: 'Arroz', cantidad: 0, unidad: '', peso: 99 }]
  });

  assert.equal(receta.nombre, 'Prueba');
  assert.equal(receta.porciones_base, 4);
  assert.equal(receta.tiempo, '30 min');
  assert.deepEqual(plano(receta.equipamiento), []);
  assert.deepEqual(plano(receta.pasos), []);
  assert.equal(receta.ingredientes[0].cantidad, 1);
  assert.equal(receta.ingredientes[0].unidad, 'ud');
  assert.equal(receta.ingredientes[0].peso, 5);
});

test('normalizarReceta descarta ingredientes sin nombre', () => {
  const { app } = crearApp({ cargar: false });
  const receta = app.normalizarReceta({
    id: 'receta-y',
    nombre: 'Prueba',
    ingredientes: [{ nombre: 'Arroz' }, { cantidad: 2 }, null]
  });
  assert.equal(receta.ingredientes.length, 1);
});
