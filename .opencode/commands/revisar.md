---
description: Revisa cambios de FridgeFlow antes de darlos por buenos
---

Revisa $ARGUMENTS (o los archivos modificados más recientes si no indicas nada)
con este orden de prioridad:

1. **Rompe `file://`**: cualquier `import`/`export`, `<script type="module">`,
   `fetch` a archivos locales, rutas absolutas o dependencia de un servidor.
2. **Datos incoherentes**: ingredientes que no existen en `data/nutricion.js` ni en
   `CATALOGO_INGREDIENTES`, imágenes con nombre o extensión distintos, recetas sin
   slug, `.txt` desincronizados.
3. **Persistencia**: cambios en `localStorage`, migraciones de versión, el bug de
   `cargarDatos()` que borra la semana.
4. **Lógica**: `kcalReceta()` ignorando ingredientes sin datos, pesos fuera de 1–5,
   tipos de receta no reconocidos, división por cero.
5. **UI y accesibilidad**: contraste, `:focus-visible`, estados de botones,
   `prefers-reduced-motion`, y que no se reestructure el calendario LUN–DOM.

Para cada hallazgo indica: archivo y línea, qué falla, cómo reproducirlo y el arreglo
mínimo propuesto. No reescribas archivos enteros ni reformatees. Si no hay problemas,
dilo claramente y ejecuta `npm run check` para confirmar.
