---
name: FridgeFlow · datos
description: Cómo funcionan los datos de FridgeFlow (recetas, nutrición, catálogo, imágenes y .txt) y cómo añadir o corregir recetas sin romper la coherencia.
---

# FridgeFlow · datos

Guía para tocar los datos del proyecto sin romper la app. La app debe seguir
funcionando abriendo `index.html` con `file://`.

## Fuentes de verdad

| Qué | Dónde |
|---|---|
| Recetas | `DEFAULT_RECIPES` en `js/app.js` |
| Nutrición + metadatos + combinaciones + objetivos | `FRIDGEFLOW_NUTRICION` en `data/nutricion.js` |
| Catálogo de ingredientes y despensa inicial | `CATALOGO_INGREDIENTES` y `despensaInicial()` en `js/app.js` |
| Slugs de los `.txt` | `SLUGS_RECETAS_DEFECTO` en `js/app.js` |
| Lista de imágenes | `IMAGENES_RECETAS` en `js/app.js` |
| Exportación `.txt` | `data/recetas/*.txt` — **generados**, no se editan a mano |

## Reglas de los ingredientes

- El nombre debe coincidir **exactamente** (mayúsculas y acentos incluidos) en tres sitios:
  `DEFAULT_RECIPES`, `data/nutricion.js` (`ingredientes`) y `CATALOGO_INGREDIENTES`.
- Cada ingrediente de `nutricion.js` necesita: `kcal`, `proteina`, `hidratos`, `grasa`,
  `fibra`, `grupo`.
- Si el ingrediente se usa con unidades caseras (`diente`, `rebanada`, `cucharada`,
  `puñado`…), o bien existe en `nutricion.unidades`, o bien el ingrediente define
  `gramosPorUnidad`.
- El peso (`peso`) va de 1 a 5: 1 condimento, 3 sofrito/especia, 5 protagonista.

## Añadir una receta (orden correcto)

1. Entrada en `DEFAULT_RECIPES` (`js/app.js`).
2. Metadatos en `nutricion.recetas`: `tipo`, `vegetariano`, `vegano`, `elaboracion`.
3. Ingredientes nuevos en `nutricion.ingredientes` **y** en `CATALOGO_INGREDIENTES`.
4. Imagen en `assets/images/recetas/` + entrada en `IMAGENES_RECETAS`.
5. Slug en `SLUGS_RECETAS_DEFECTO`.
6. `data/recetas/<slug>.txt` (se genera, no se escribe a mano).
7. Ejecutar `npm run datos` y `npm test`.

## Los `.txt`

- `npm run datos:generar` es una **simulación**: enseña qué cambiaría, no escribe.
- `npm run datos:generar:escribir` sí escribe. Antes de usarlo, revisa el diff:
  algunos `.txt` pueden tener datos manuales que no están en `js/app.js`.
- Los `.txt` son una exportación de `app.recetaATxt()`. Si un dato solo existe en el
  `.txt`, primero llévalo a `js/app.js` y luego regenera.

## Comprobación rápida

```sh
npm run datos            # informe de errores y avisos
npm run datos:estricto   # los avisos también fallan
npm test                 # tests con node:test
npm run check            # datos + tests
```

`scripts/check-datos.mjs` revisa: ingredientes sin nutrición o catálogo, catálogo y
tabla desincronizados, imágenes inexistentes o con otra extensión, slugs y `.txt`
faltantes, kcal divergentes (más del 5 %), tipo/vegetariano distintos, unidades sin
equivalencia y recetas sin nada en la despensa.

## Trampas conocidas

- Las recetas 21–28 usan 22 ingredientes que no están ni en `nutricion.js` ni en el
  catálogo. Las imágenes de esas recetas apuntan a `.jpg` pero en disco están como `.JPG`.
- `cargarDatos()` llama a `guardarDatos()` antes de leer `STORAGE_WEEK`: la migración
  borra la semana guardada. Está documentado con un test `todo`.
- `kcalReceta()` ignora ingredientes sin datos, así que una receta puede parecer ligera
  solo porque le faltan cifras.
- `IMAGENES_RECETAS` es una lista manual; si añades una imagen, actualízala.
- Unidades: `cucharada = 5 g` es demasiado bajo (una sopera son ~15 g); `puñado` no
  tiene equivalencia.

## Al corregir datos

- No inventes valores nutricionales: si no estás seguro, pregunta o usa una fuente y
  dilo.
- Cambia lo mínimo; no reformatees archivos enteros.
- Al terminar, vuelve a ejecutar `npm run datos` y `npm test` y resume el resultado.
