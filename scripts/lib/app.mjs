// ============================================================================
// Carga js/app.js y data/nutricion.js en un contexto aislado de Node.
// ----------------------------------------------------------------------------
// La app no es un módulo (a propósito: tiene que funcionar con file://), así
// que no se puede importar. Se ejecuta en un `vm` con un DOM y un localStorage
// mínimos y se devuelve la clase App ya instanciada.
//
// Uso:
//   import { crearApp } from '../scripts/lib/app.mjs';
//   const { app, nutricion } = crearApp();
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

/** Raíz del proyecto (este archivo vive en scripts/lib/). */
export const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

const RUTA_APP = path.join(ROOT, 'js', 'app.js');
const RUTA_NUTRICION = path.join(ROOT, 'data', 'nutricion.js');

// La app arranca sola al final del archivo. Cortamos justo ahí y la iniciamos
// nosotros, para poder inyectar un localStorage controlado.
const MARCA_ARRANQUE = 'const app = new App();';

function crearAlmacen(mapa) {
  return {
    getItem(clave) {
      return mapa.has(clave) ? mapa.get(clave) : null;
    },
    setItem(clave, valor) {
      mapa.set(clave, String(valor));
    },
    removeItem(clave) {
      mapa.delete(clave);
    },
    clear() {
      mapa.clear();
    },
    key(indice) {
      return [...mapa.keys()][indice] ?? null;
    },
    get length() {
      return mapa.size;
    }
  };
}

function crearNodo() {
  return {
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    style: {},
    dataset: {},
    children: [],
    appendChild() {},
    removeChild() {},
    setAttribute() {},
    removeAttribute() {},
    addEventListener() {},
    removeEventListener() {},
    focus() {},
    click() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    textContent: '',
    innerHTML: '',
    value: '',
    checked: false,
    disabled: false
  };
}

function crearDocumento() {
  return {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: crearNodo,
    addEventListener() {},
    removeEventListener() {},
    body: crearNodo(),
    documentElement: crearNodo(),
    readyState: 'complete'
  };
}

/**
 * Crea una instancia de App con la lógica real del proyecto.
 *
 * @param {object} [opciones]
 * @param {Map<string,string>} [opciones.almacen] Estado inicial de localStorage.
 * @param {boolean} [opciones.cargar=true] Llamar a cargarDatos() al crear.
 * @param {number|null} [opciones.semilla=null] Semilla para Math.random.
 * @returns {object} { app, almacen, nutricion, App, DEFAULT_RECIPES, ... }
 */
export function crearApp(opciones = {}) {
  const { almacen = new Map(), cargar = true, semilla = null } = opciones;

  const codigoApp = fs.readFileSync(RUTA_APP, 'utf8');
  const codigoNutricion = fs.readFileSync(RUTA_NUTRICION, 'utf8');

  const corte = codigoApp.indexOf(MARCA_ARRANQUE);
  if (corte === -1) {
    throw new Error(`No se encontró "${MARCA_ARRANQUE}" en js/app.js. ¿Se ha cambiado el arranque?`);
  }

  const sandbox = {
    console,
    document: crearDocumento(),
    localStorage: crearAlmacen(almacen),
    alert() {},
    confirm: () => true,
    prompt: () => null,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
  };
  // `window` es el propio contexto: nutricion.js hace window.FRIDGEFLOW_NUTRICION = ...
  sandbox.window = sandbox;

  const contexto = vm.createContext(sandbox);

  if (semilla !== null) {
    let estado = semilla >>> 0;
    sandbox.__random = () => {
      estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
      return estado / 4294967296;
    };
    vm.runInContext('Math.random = __random;', contexto);
  }

  vm.runInContext(codigoNutricion, contexto, { filename: 'data/nutricion.js' });
  vm.runInContext(
    codigoApp.slice(0, corte) +
      '\nthis.__fridgeflow = { App, DEFAULT_RECIPES, CATALOGO_INGREDIENTES, ' +
      'SLUGS_RECETAS_DEFECTO, IMAGENES_RECETAS, despensaInicial, pesoInferido, pesoPorDefecto, datosNutricion };',
    contexto,
    { filename: 'js/app.js' }
  );

  const api = sandbox.__fridgeflow;
  if (!api || typeof api.App !== 'function') {
    throw new Error('No se pudo cargar la clase App desde js/app.js');
  }

  const app = new api.App();
  if (cargar) app.cargarDatos();

  return {
    app,
    almacen,
    nutricion: sandbox.FRIDGEFLOW_NUTRICION,
    ...api
  };
}

export { RUTA_APP, RUTA_NUTRICION };
