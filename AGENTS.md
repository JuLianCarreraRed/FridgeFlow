# FridgeFlow — reglas del proyecto

Web 100 % estática (HTML + CSS + JS clásico). Se abre con doble clic en `index.html`:
no hay servidor, ni build, ni dependencias en tiempo de ejecución.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run datos` | Comprueba coherencia de datos (recetas, nutrición, catálogo, imágenes y `.txt`) |
| `npm run datos:estricto` | Igual, pero los avisos también hacen fallar |
| `npm run datos:generar` | Simula la regeneración de los `.txt` (no escribe nada) |
| `npm run datos:generar:escribir` | Regenera los `.txt` desde `js/app.js` |
| `npm test` | Tests de datos, lógica y persistencia |
| `npm run dev` | Servidor estático local en http://localhost:5173 |
| `npm run check` | `datos` + `test`. Úsalo antes de cada commit |

## Estructura

- `index.html` — planificador semanal (calendario LUN–DOM × COMIDA/CENA).
- `recetario.html` — recetario filtrable y gestión de la despensa.
- `auditoria.html` — página estática de auditoría.
- `css/style.css` — estilos y tokens en `:root`.
- `js/app.js` — toda la lógica (clase `App`).
- `data/nutricion.js` — nutrición, metadatos de receta, combinaciones y objetivos.
- `data/recetas/*.txt` — exportación descargable de cada receta.
- `assets/images/recetas/` — fotos de los platos.
- `scripts/` — herramientas de validación (Node, sin dependencias).
- `tests/` — tests con `node:test`.

## Fuente de verdad

- Recetas: `DEFAULT_RECIPES` en `js/app.js`.
- Nutrición y metadatos: `FRIDGEFLOW_NUTRICION` en `data/nutricion.js`.
- Catálogo y despensa: `CATALOGO_INGREDIENTES` y `despensaInicial()` en `js/app.js`.
- Los `.txt` de `data/recetas/` son una **exportación**. No se editan a mano:
  se regeneran con `npm run datos:generar:escribir` y se revisa el resultado.

## Reglas

1. No usar `import`/`export` ni `<script type="module">`: rompe `file://`.
2. No añadir frameworks ni dependencias de runtime. Los scripts de `scripts/` solo usan Node.
3. Todo ingrediente de una receta debe existir en `nutricion.js` **y** en
   `CATALOGO_INGREDIENTES`, con el nombre exacto (mayúsculas y acentos incluidos).
4. Las imágenes se referencian con el nombre exacto del archivo, en minúsculas
   y con la extensión real.
5. Añadir una receta = entrada en `DEFAULT_RECIPES` + metadatos en `nutricion.js`
   + ingredientes en el catálogo + imagen + slug en `SLUGS_RECETAS_DEFECTO`.
   Después: `npm run datos` y `npm run datos:generar`.
6. No cambiar el esquema de `localStorage` sin mantener compatibilidad: hay
   usuarios con la versión 2.4 guardada.
7. CSS: cualquier color nuevo va como token en `:root`. No valores sueltos.
8. Accesibilidad mínima: contraste 4.5:1 en texto normal, `:focus-visible` en
   todo lo interactivo, `aria-label` en botones con solo icono.

## Trampas conocidas

- `cargarDatos()` llama a `guardarDatos()` antes de leer `STORAGE_WEEK`, así que
  la migración borra el menú semanal. Hay un test marcado como `todo` en
  `tests/persistencia.test.mjs` que lo documenta.
- Añadir un ingrediente desde el formulario de receta lo mete también en la
  despensa (`agregarIngredienteNuevo`).
- `kcalReceta()` ignora los ingredientes sin datos nutricionales: una receta
  puede parecer "ligera" solo porque le faltan datos.
- `IMAGENES_RECETAS` es una lista manual; si añades una imagen, actualízala.
- Los `.txt` actuales no coinciden con la app en 19 de 28 recetas.

## Convenciones

- Copy y comentarios en español; identificadores en español como el resto del código.
- Commits en imperativo: `arregla migración de la semana`, `añade ingredientes del pad thai`.
- No reformatear archivos enteros: cambios mínimos y revisables.
