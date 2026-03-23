# City-ThreeJS

este proyecto es una aplicacion web que utiliza Three.js para crear un renderizado 3d para una practica de videojuegos, el proyecto se encuentra en desarrollo y se espera que en un futuro se puedan agregar mas funcionalidades como la interaccion con el entorno y la posibilidad de agregar objetos al mundo 3d.en conjunto de tresjs se esta utilizando vite para el renderizado y gestion de dependencias mientras que para las fisicas se estan trabajando con cannon-es, el proyecto se encuentra en desarrollo y se espera que en un futuro se puedan agregar mas funcionalidades como la interaccion con el entorno y la posibilidad de agregar objetos al mundo 3d.

## Instalacion

tras clonar este repositorio, se debe de instalar las dependencias mediante el comando `npm install` o `yarn install` dependiendo del gestor de paquetes que se utilice, una vez instaladas las dependencias se puede iniciar el proyecto con el comando `npm run dev` o `yarn dev` y se podra acceder a la aplicacion web en el navegador.

## Tecnologias utilizadas

- Vite: herramienta de construcción y desarrollo para aplicaciones web modernas.
- Three.js: biblioteca de JavaScript para crear gráficos 3D en el navegador.
- Cannon-es: biblioteca de JavaScript para simular físicas en el navegador.

## Contribuidores

- github/BroddenGa
- github/vicentesilv

## Estructura del proyecto

```bash
├── public
│   └── KayKit_City_Builder_Bits_1.0_FREE
├── src
│   ├── assets.js
│   ├── cargamodels.js
│   ├── configs.js
│   ├── main.js
│   ├── modelo.js
│   ├── personaje.js
├── index.html
```

## Documentación de Archivos

### `index.html`

Archivo HTML principal que estructura la página web. Contiene:

- Metaetiquetas de configuración del viewport
- Un contenedor `div#app` donde se renderiza la escena de Three.js
- Importación del módulo principal `src/main.js`
- Estilos CSS básicos (reset de márgenes y padding)

### `src/assets.js`

Define todas las rutas de los modelos 3D (assets) que se utilizan en el proyecto. Exporta un objeto `assets` categorizado por tipo:

- **buildings**: 8 modelos de edificios (A-H) en formato GLTF
- **roads**: 5 tipos de caminos (rectos, esquinas, cruces, T-splits, cruces peatonales)
- **trees**: modelos de vegetación (arbustos)
- **cars**: 5 tipos de vehículos (hatchback, policía, sedán, station wagon, taxi)
- **street**: mobiliario urbano (farolas, bancos, contenedores, etc.)

Todas las rutas apuntan a los assets del pack KayKit City Builder.

### `src/main.js`

Archivo principal que inicializa y configura toda la escena 3D. Responsabilidades:

- **Inicialización de Three.js**: Crea la escena, cámara y renderizador
- **Inicialización de Cannon.js**: Configura el motor de física
- **Iluminación**: Establece luz hemisférica y luz direccional
- **Plano base**: Crea el terreno/suelo del mundo con colisiones físicas
- **Controles**: Implementa controles de órbita con mouse y teclado (flechas)
- **Personaje**: Instancia la clase Personaje para el jugador
- **Carga de modelos**: Configura y llama a funciones para cargar todos los edificios, calles y objetos del entorno según las configuraciones

### `src/configs.js`

Archivo de configuración que almacena todas las coordenadas y parámetros de posicionamiento de los objetos del mundo. Contiene:

- **edificiosConfig**: Array con posición (x, y, z), cantidad y parámetros de rotación para cada grupo de edificios
- **callesPeatonales**: Posiciones de cruces peatonales
- **callesConGiro**: Calles con rotación especial en esquinas
- **callesRectasX**: Calles horizontales en eje X
- **callesRectasY**: Calles horizontales en eje Y
- **callesTresDirecciones**: Cruces con tres direcciones
- **callesMultidireccional**: Cruces con múltiples direcciones (4 direcciones)

Permite gestionar fácilmente el diseño del mapa de la ciudad.

### `src/cargamodels.js`

Módulo que gestiona la carga y creación de modelos 3D en la escena. Funciones principales:

- **configurarCargaModelos()**: Inicializa el contexto con referencia a scene, loader y world
- **crearModelo()**: Crea una instancia de la clase Modelo
- **modeledificio()**: Crea una fila de edificios con parámetros de posición y rotación
- **modeloCallePeatonal()**: Crea un cruce peatonal en una posición específica
- **modeloCallex()**: Crea una fila de calles en el eje X con rotaciones opcionales
- **modeloCalley()**: Crea una fila de calles en el eje Y con rotaciones opcionales

Utiliza el patrón de fábrica para simplificar la creación de múltiples objetos.

### `src/modelo.js`

Clase `Modelo` que representa un modelo 3D individual. Características:

- **Constructor**: Recibe URL del modelo GLTF, posición, tamaño, rotación y referencias a scene/loader/world
- **cargar()**: Carga el modelo desde la URL usando GLTFLoader
- **_debeCrearColision()**: Determina si el modelo necesita colisiones (excluye caminos)
- **_crearColisionTrimesh()**: Crea colisiones de malla triangular (Trimesh) usando Cannon.js para física realista
  - Recorre todos los meshes del modelo y sus hijos
  - Aplica transformaciones mundiales
  - Convierte geometrías a malla triangular para colisiones precisas

Cada modelo instanciado se añade automáticamente a la escena con su cuerpo físico.

### `src/personaje.js`

Clase `Personaje` que maneja al jugador del juego. Características principales:

- **Constructor**: Inicializa el personaje con cámara, controles, escena y mundo físico
- **Atributos de movimiento**: velocidad, fuerza de salto, sensibilidad del mouse
- **Física**: Cuerpo esférico (cápsula) con colisiones
- **Cámara**: Posicionada a cierta altura y distancia del personaje
- **Detección de suelo**: Sistema de raycast para detectar si está en el suelo (permite saltos)

- **Control de entrada**:

  - Teclado (WASD para movimiento)
  - Mouse (movimiento de cámara)
  - Sistema de gracia de salto (pequeño tiempo de tolerancia)
- **Movimiento 3D**: Movimiento en eje X/Z con gravedad aplicada
- **Límites del plano**: Restricciones para evitar que salga del mapa

El personaje es controlado por el jugador y permite explorar la escena ciudad desde una perspectiva de primera persona.
