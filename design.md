# FridgeFlow — sistema de diseño

> Contrato visual del proyecto. Sirve como referencia para agentes y para
> cualquier skill de diseño (Hallmark, impeccable, etc.). No es documentación
> de producto.

## Principios

- Cocina casera, papel y nevera. Cálido, no corporativo.
- Densidad media: una semana entera visible sin scroll horizontal.
- Un solo acento naranja. El verde significa únicamente "sobras de ayer".
- Nada de gradientes, glassmorphism ni bordes de neón.

## Tokens (`css/style.css` → `:root`)

| Token | Valor | Uso |
|---|---|---|
| `--fondo` | `#f7f3ec` | Fondo de página |
| `--blanco` | `#ffffff` | Tarjetas y paneles |
| `--texto` | `#3a3a3a` | Texto principal |
| `--texto-suave` | `#6b6b6b` | Metadatos y ayudas |
| `--acento` | `#e8833a` | Decoración, bordes, iconos. **Nunca texto blanco encima** |
| `--acento-oscuro` | `#c96a2e` | Enlaces y botones con texto |
| `--borde` | `#d8d0c1` | Bordes suaves |
| `--borde-oscuro` | `#bfb4a4` | Bordes en hover |
| `--verde-ayer` | `#7aa35e` | Solo "sobras de ayer" |
| `--radius` | `12px` | Radio base (16 px en modales) |

### Contraste medido

| Combinación | Ratio | Veredicto |
|---|---:|---|
| `#3a3a3a` sobre `#f7f3ec` | 10.28:1 | ✓ AA |
| `#6b6b6b` sobre `#f7f3ec` | 4.82:1 | ✓ AA |
| `#e8833a` sobre `#f7f3ec` | 2.45:1 | ✗ solo decorativo |
| `#ffffff` sobre `#e8833a` | 2.71:1 | ✗ no usar |
| `#ffffff` sobre `#c96a2e` | 3.76:1 | ✗ en texto normal; válido en texto grande (≥24 px o ≥18.66 px bold) |

Para un botón primario con texto blanco hace falta un naranja más oscuro
(por ejemplo `#a8541f`, ≈5.1:1). Si se cambia el token, volver a medir.

## Tipografía

- Títulos: `Georgia, "Times New Roman", serif`.
- Cuerpo: `"Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- Escala: `0.72 / 0.85 / 1 / 1.25 / 1.6 rem`.
- Sin fuentes externas ni `@import` de Google Fonts.

## Forma

- Radio 12 px; 16 px en tarjetas grandes y modales.
- Sombras suaves (`0 4px 12px rgba(0,0,0,.08)`), nunca duras.
- Iconos: emoji del sistema. No añadir librería de iconos.

## Reglas de interfaz

- El calendario LUN–DOM × COMIDA/CENA **no se reestructura**.
- Cada celda tiene estados: vacía, ocupada, hover, `:focus-visible`, arrastrando.
- Todo control interactivo define: default, hover, `:focus-visible`, `:active`, `disabled`.
- Respetar `prefers-reduced-motion`.
- No usar imágenes de stock: las fotos son las de `assets/images/recetas/`.
- El recetario mantiene la misma retícula de tarjetas; no convertirlo en landing.
