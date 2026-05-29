# re-maze

Juego de parkour en primera persona dentro de un laberinto 3D, construido con **Three.js** (renderizado) y **cannon-es** (física).

---

## Controles

| Tecla | Acción |
|---|---|
| `V` | Alternar entre vista orbital y primera persona |
| `W A S D` | Moverse (adelante, atrás, izquierda, derecha) |
| `Espacio` | Saltar (doble salto disponible) |
| `Espacio` (contra pared) | Wall jump |
| `Shift` | Dash en dirección del movimiento (cooldown 2s) |
| Mouse | Mirar alrededor (primera persona) |
| Clic | Activar pointer lock (primera persona) |

---

## Archivos del proyecto

### `index.html`
Entry point. Carga `src/main.js` como módulo. Contiene un contenedor `#app` y estilos base.

### `src/main.js`
Orquesta la escena: inicializa Three.js, físicas, nivel, UI, personaje y el bucle de juego.

| Sección | Descripción |
|---|---|
| **Laberinto procedural** | Se genera una matriz 29×29 por partida. La validación exige meta y mínimo 2 rutas distintas hacia ella. Cada celda mide `CELL = 3.5` unidades. |
| **Paredes** | Altura `WALL_H = 4.5`. Se genera una caja física por cada frontera entre celda libre y pared. La caja física se extiende 3u más abajo para evitar escapes. |
| **Suelo** | Plano en cada celda libre, con cuerpo físico estático de 0.5u de grosor centrado en y = -0.5. |
| **Pozos** | Se colocan proceduralmente en celdas que no rompen la validación del mapa. El personaje cae por gravedad y respawnea al llegar a `y < -6`. |
| **Plataformas parkour** | Se generan como atajos y pasos sobre algunos pozos; pueden contar como rutas válidas hacia la meta. |
| **Salida (META)** | Siempre existe, se coloca lejos del inicio y tiene pilar, estrella flotante y luz dorada. Al alcanzarla aparece un mensaje y se genera un nuevo maze tras 3s. |
| **HUD** | Indicador superior con controles. |
| **Iluminación** | Luz hemisferio + direccional con sombras + ambiental + point lights en pasillos + luces en salida y inicio. |
| **Respawn** | Si el jugador cae por debajo de y = -6, vuelve al inicio con un flash rojo. |

### `src/player/personaje.js`
Clase `Personaje` que maneja el movimiento, físicas, cámara y habilidades.

### `src/player/input.js`
Enlaza teclado/mouse/pointer lock con el `Personaje`.

### `src/world/`
Constantes (`config.js`), generación procedural validada (`generator.js`), físicas (`physics.js`) y construcción visual/física del escenario (`level.js`).

### `src/ui/ui.js`
HUD, menú, pausa y configuración (sensibilidad + cronómetro).

| Componente | Descripción |
|---|---|
| **Cuerpo físico** | Esfera de radio 0.15 en cannon-es, con `linearDamping: 0.15` y rotación fija. |
| **Visual** | Cápsula Three.js invisible en primera persona (visible solo en modo orbital). |
| **Movimiento suave** | Aceleración exponencial hacia la velocidad objetivo: `factor = 1 - e^(-acel * delta)`. En suelo: acel=60, en aire: acel=40. |
| **Límite de velocidad** | `velMax = (radioCapsula * 2.6) / dtSeguro` para evitar tunnelling. |
| **Salto** | `fuerzaSalto = 8.0`. Se reincia al tocar suelo. |
| **Doble salto** | `_saltosMax = 1`. Se gasta un salto extra en el aire. Se reinicia al pisar suelo. |
| **Wall jump** | Raycast en 4 direcciones. Si detecta pared vertical, salta con empuje perpendicular de 6 u. |
| **Wall slide** | Si está contra una pared y cayendo, la velocidad vertical se limita a -2 m/s (caída lenta). |
| **Dash** | Shift + dirección. Velocidad 30 en la dirección del movimiento (o hacia adelante si no hay input). Cooldown 2s. FOV burst a 85 durante 0.2s. |
| **Detección de suelo** | Raycast hacia abajo desde el centro del cuerpo, con `distanciaDeteccionSuelo = 0.12` y `tiempoGraciaSalto = 0.12s`. |
| **Cámara** | En primera persona (`distanciaCamara = 0`) sigue al personaje con altura 1.5. La rotación horizontal se controla con el mouse. |
| **Modo orbital** | `V` desactiva la primera persona y activa OrbitControls para debug. |

---

## Física

- **Gravedad**: `-14 m/s²`
- **Substeps**: `world.step(1/120, delta, 10)` — simulación a 120Hz con máximo 10 substeps por frame.
- **Solver**: 20 iteraciones.

---

## Dependencias

```
three ^0.183.2    → Renderizado 3D
cannon-es ^0.20.0 → Motor de física
vite ^7.3.1       → Dev server y build
```

---

## Desarrollo

```bash
npm install
npm run dev      # Servidor de desarrollo en localhost
npm run build    # Build de producción en dist/
```

---

## Estructura (post-limpieza)

```
City-ThreeJS/
├── index.html
├── package.json
├── public/
│   └── vite.svg
├── src/
│   ├── main.js
│   ├── player/
│   │   ├── input.js
│   │   └── personaje.js
│   ├── ui/
│   │   └── ui.js
│   └── world/
│       ├── config.js
│       ├── generator.js
│       ├── level.js
│       └── physics.js
└── dist/
```
