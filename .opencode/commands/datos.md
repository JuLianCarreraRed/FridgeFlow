---
description: Valida los datos de FridgeFlow y corrige lo que se pueda
---

Ejecuta la comprobación de datos del proyecto:

1. Lanza `npm run datos` y lee el informe completo.
2. Agrupa los hallazgos por bloque (nutrición, catálogo, imágenes, .txt, unidades, despensa).
3. Distingue **errores** (rompen la app: ingredientes sin datos, imágenes que no existen,
   catálogo desincronizado) de **avisos** (kcal de los .txt, unidades caseras, archivos huérfanos).
4. Corrige primero los errores de código y de datos, respetando `AGENTS.md`:
   nombres exactos, español, sin dependencias, sin cambiar el esquema de `localStorage`.
5. Para los `.txt`, no los edites a mano: primero lleva los cambios a `js/app.js`
   y después ejecuta `npm run datos:generar` (simulación) y revisa antes de escribir.
6. Al terminar, vuelve a ejecutar `npm run datos` y `npm test`.

Si algo es ambiguo (por ejemplo, qué ingrediente falta o qué valor nutricional usar),
pregunta en lugar de inventar cifras. Resume al final: qué corregiste, qué dejaste
pendiente y por qué.

$ARGUMENTS
