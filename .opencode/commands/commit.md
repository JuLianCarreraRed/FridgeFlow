---
description: Prepara y crea un commit limpio del proyecto
---

Prepara un commit de FridgeFlow.

1. Comprueba que existe un repositorio Git (`git rev-parse --is-inside-work-tree`).
   Si no existe, dilo y detente: el usuario decidió posponer `git init`.
2. Ejecuta `npm run check` (datos + tests). Si falla, no hagas commit: resume el fallo.
3. Revisa `git status` y `git diff --stat`. Agrupa los cambios por intención y propone
   **un solo commit** salvo que haya cambios claramente independientes.
4. Redacta el mensaje en imperativo y en español, sin prefijos tipo `feat:` salvo que el
   usuario los pida. Ejemplos: `arregla la migración de la semana`,
   `añade ingredientes del pad thai`.
5. Enseña el mensaje propuesto y espera confirmación antes de ejecutar
   `git add` y `git commit`.

Nunca hagas `git push` sin que el usuario lo pida expresamente. No uses `git add -A`
si hay archivos que no deberían entrar (revisa antes `.gitignore`).

$ARGUMENTS
