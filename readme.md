# FridgeFlow — Planificador de menús semanales

Herramienta web estática para crear recetas y menús semanales con los alimentos que ya tienes en casa, reduciendo el desperdicio alimentario y ahorrando tiempo y dinero.

**Versión 2.5** — 20 recetas (10 de ellas vegetarianas nuevas), kcal por ración, combinaciones saludables en el planificador, menú vegetariano opcional, edición de recetas y sincronización con los `.txt`. 100 % estático: abre `index.html` y ya está.

## Archivos del proyecto

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Planificador semanal (calendario LUN–DOM × COMIDA/CENA) |
| `recetario.html` | Recetario con filtro por ingredientes y gestión de "Mis ingredientes" |
| `auditoria.html` | Auditoría integrada 3-en-1 (Diseño UX, Funcionalidad, Copywriting) |
| `css/style.css` | Estética beige/crema, calendario con fotos, tarjetas, modales y responsive |
| `js/app.js` | Lógica completa: datos por defecto, localStorage, calendario, filtros, nutrición y modales |
| `data/nutricion.js` | **Datos nutricionales y combinaciones saludables** (kcal/macros por ingrediente, tipos de plato, objetivos semanales) |
| `assets/images/recetas/` | 11 fotografías reales + 9 marcadores SVG para las recetas nuevas (`plato-*.jfif`, `.webp`, `.jpg`, `.png`, `.svg`) |
| `data/recetas/*.txt` | Contenido editorial de las 20 recetas, con peso, kcal, tipo de plato y macros |
| `INFORME_FUNCIONALIDAD.txt` | Informe de objetivos y funcionalidad del proyecto |

## Cómo usar

1. Abre `index.html` directamente en cualquier navegador moderno (doble clic).
2. Pulsa **TEJER LA SEMANA POR MÍ** para generar el menú completo, o pulsa cualquier celda vacía del calendario para elegir un plato concreto.
3. Revisa la **lista de la compra**: solo muestra lo que te falta.
4. Abre `recetario.html` para filtrar recetas por lo que tienes y añadir las tuyas.

No requiere servidor, instalación ni conexión a internet.

## Funcionalidades principales

- **Calendario semanal**: 7 días × COMIDA/CENA. Cada celda es una tarjeta con la foto del plato y su nombre sobre la imagen; incluye la etiqueta verde **DE AYER** cuando son sobras del día anterior y una **×** para quitar el plato.
- **Elegir plato**: al pulsar una celda vacía se abre un buscador con todas las recetas y su miniatura.
- **TEJER LA SEMANA POR MÍ**: genera un menú con **combinaciones saludables** (legumbre + verdura, pasta + verdura, cereal + proteína vegetal…), respetando kcal por comida, sin repetir el mismo plato en comida y cena y reutilizando sobras.
- **Menú vegetariano**: interruptor activado por defecto; evita las 2 recetas con carne (albóndigas y pollo). Se puede desactivar y se recuerda en `localStorage`.
- **Balance de la semana**: nota de equilibrio, kcal media por comida y día (comida + cena), legumbres, verduras, proteína vegetal, fritos/elaborados, huevos y variedad.
- **VACIAR LA SEMANA**: limpia el calendario y reinicia las estadísticas (pide confirmación).
- **+ AÑADIR RECETA**: nombre, descripción, tiempo, porciones, foto, ingredientes con cantidad/unidad/peso, kcal por ración opcional, tipo de plato, casilla vegetariana, equipamiento y pasos.
- **Estadísticas**: platos colocados, ingredientes distintos, solapamiento con la despensa, coste estimado (1,80 € por ingrediente que falta), tiempo total en cocina, alimentos rescatados, **kcal media por comida** y **recetas distintas**.
- **Platos sugeridos**: miniatura + `TIEMPO · KCAL · FALTA n · REUTILIZA n`.
- **Lista de la compra**: ingredientes del menú que no están en tu despensa.
- **Recetario**: filtro ponderado por ingredientes, **kcal por ración** en cada tarjeta (semáforo ligera/equilibrada/contundente), etiquetas vegetariana/vegana/tipo de plato, orden por kcal y filtros por rango de calorías y solo vegetarianas.
- **Detalle de receta**: foto grande, kcal por ración y total, macros (proteína, hidratos, grasa y fibra), selector de comensales con −/+, ingredientes con “falta”, equipamiento y “Añadir a mi semana”.
- **Editar receta**: botón ✏️ en cada tarjeta y “Editar receta” en el detalle. Se pueden cambiar todos los campos, incluido kcal, tipo y vegetarianismo.
- **Sincronización con `.txt`**: al guardar una receta se regenera su archivo con el formato de `data/recetas/` (incluye tipo, vegetariano, kcal y macros). En Chrome/Edge se puede sobrescribir el archivo real; si no, se descarga. También hay un botón explícito “Descargar .txt”.

## Catálogo y despensa

- **Catálogo**: 59 ingredientes utilizables en recetas (incluye tofu, Heura, falafel, alubias blancas, setas, masa de empanadilla…).
- **Despensa inicial**: 37 ingredientes, un subconjunto realista para que la lista de la compra y los avisos de "falta" tengan sentido desde el primer uso.
- Puedes añadir o quitar ingredientes de tu despensa desde el botón flotante **🥕** del recetario (abajo a la derecha), que muestra el total y abre la ventana “Mis ingredientes”.

## Peso de los ingredientes y filtro ponderado

Cada ingrediente de cada receta lleva un **peso de 1 a 5** que indica su importancia en el plato:

| Peso | Significado | Ejemplos |
|------|-------------|----------|
| 5 | Protagonista del plato | Garbanzos, pollo, calabaza, pasta |
| 4 | Base o acompañamiento principal | Patatas, tomate frito, coliflor, huevos |
| 3 | Verdura de sofrito o especia clave | Cebolla, pimiento, pimentón, arroz |
| 2 | Condimento con presencia | Aceite, ajo, limón, yogur, caldo |
| 1 | Condimento mínimo | Sal, pimienta |

El filtro del recetario calcula una **cobertura ponderada**: `Σ pesos de los ingredientes que tienes ÷ Σ pesos de todos los ingredientes de la receta`. Las recetas se ordenan por esa puntuación (y, a igualdad, por número de coincidencias). Así, en una ensalada de garbanzos, seleccionar “Garbanzos” y “Sal” da `(5+1)/22 = 27 %`, mientras que la sal sola apenas puntúa un 5 %.

Los pesos se pueden ajustar receta a receta desde el formulario de edición (columna **Peso**).

## Calorías, combinaciones saludables y menú vegetariano

Los datos viven en **`data/nutricion.js`** (archivo aparte, editable y cargado con `<script>` antes de `app.js`):

- `ingredientes`: kcal, proteína, hidratos, grasa y fibra por 100 g/ml, grupo de alimento y gramos por unidad para convertir `ud`, `diente`, `cucharadita`, `pizca`…
- `recetas`: tipo de plato, vegetariano/vegano y elaboración.
- `combinaciones`: plantillas de día completo (comida + cena) con los tipos de plato recomendados.
- `semana` y `objetivos`: combinación de cada día y metas semanales (legumbres ≥3, verduras 7 comidas, proteína vegetal ≥5, fritos/elaborados ≤3, huevos ≤5, variedad ≥10, kcal/comida 400-700, kcal/cena 300-600, kcal/día 650-1500).

Cada receta muestra **kcal por ración** y un semáforo (🟢 ligera ≤450, 🟡 equilibrada 450-650, 🔴 contundente >650), calculado con las cantidades reales. El detalle añade macros por ración y el total para los comensales elegidos. Al crear o editar una receta se puede fijar una **kcal manual** (si se deja vacía se calcula), el tipo de plato y la casilla vegetariana.

El planificador prueba hasta 70 semanas, las puntúa contra los objetivos y se queda con la mejor: fuerza la legumbre en la comida cuando la combinación lo pide, no repite plato en el mismo día y solo reutiliza sobras del mismo tipo. Con el interruptor **Menú vegetariano** activo (por defecto) las recetas con carne nunca entran en el menú automático, aunque siguen disponibles en el recetario y para asignarlas a mano.

> Los valores son orientativos y se calculan a partir de las cantidades de la receta. El balance diario suma **comida + cena**, sin desayuno ni tentempiés.

## Edición de recetas y archivos `.txt`

- Botón **✏️ Editar** en cada tarjeta del recetario y **“Editar receta”** en el pie del detalle.
- El formulario permite cambiar todos los campos y la tabla de ingredientes (cantidad, unidad y peso) e incluso la fotografía.
- Al guardar, la app regenera el archivo `.txt` con el mismo formato que `data/recetas/*.txt`:
  - En Chrome/Edge se abre el selector de archivos con el nombre `data/recetas/<slug>.txt` propuesto: al confirmar se **sobrescribe el archivo real**.
  - Si el navegador no soporta File System Access API (o se cancela), el `.txt` se **descarga** para que lo copies en `data/recetas/`.
  - El botón **“Descargar .txt”** exporta en cualquier momento lo que haya en el formulario.
- El `.txt` es la copia editorial: la aplicación siempre lee las recetas de `localStorage`, por lo que el cambio se ve al instante aunque no se guarde el archivo.

## Persistencia de datos

Todo se guarda en `localStorage`:

| Clave | Contenido |
|-------|-----------|
| `fridgeflow_recetas` | Recetas (20 por defecto + las creadas por el usuario) |
| `fridgeflow_ingredientes` | Tu despensa por categorías |
| `fridgeflow_semana` | Menú semanal y marcas "de ayer" |
| `fridgeflow_version` | Versión del esquema de datos (2.5) |
| `fridgeflow_preferencias` | Preferencias del planificador (menú vegetariano) |

Al cargar la página se recupera lo guardado; si cambia la versión de los datos se migran las recetas e ingredientes por defecto sin perder las recetas propias. Para empezar de cero, borra esas claves desde las herramientas de desarrollo del navegador (Application → Local Storage).

## Estética

- Fondo beige/crema (`#f7f3ec`), acento naranja (`#e8833a`), texto gris oscuro (`#3a3a3a`) y verde (`#7aa35e`) para "DE AYER".
- Tipografía Georgia (títulos) y Segoe UI/Roboto (cuerpo).
- Responsive: el tablero pasa a scroll horizontal en pantallas pequeñas, la columna de ajustes se convierte en una fila de botones y las tres tarjetas inferiores (platos sugeridos · estadísticas · lista de la compra) se apilan.

## Requisitos no negociables

- Web 100 % estática: funciona abriendo `index.html` directamente.
- No se requiere servidor, instalación ni conexión a internet.
- Sin textos tipo "lorem ipsum": todo el copy es realista y profesional.
- Tres auditorías integradas en `auditoria.html`.
- Simulación de generación de menú sin IA real ni servicios externos.

## Notas

- Las fotografías están en `assets/images/recetas/`; las recetas nuevas sin foto usan un marcador SVG con su inicial y su nombre, y las creadas por el usuario muestran un marcador con icono hasta que se les asigne imagen.
- Las 10 recetas nuevas son vegetarianas: tortilla de patatas, salteado de tofu con arroz, Heura al ajillo, alubias blancas estofadas, macarrones con tomate y huevo, ensaladilla rusa sin atún, croquetas de setas al horno, revuelto de setas, fajitas de falafel y empanadillas de espinacas y queso.
- `assets/images/sugeridos/` y `assets/videos/` quedan reservadas para futuras iteraciones (miniaturas propias y spot publicitario).
