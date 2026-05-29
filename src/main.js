import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Personaje } from './player/personaje.js';
import { bindPlayerInput } from './player/input.js';
import {
  CELL,
  MAZE_SIZE,
  PLAYER_SPEED,
  RECHARGE_MARGIN,
} from './world/config.js';
import { createWorld } from './world/physics.js';
import { buildLevel } from './world/level.js';
import { hydrateLevel } from './world/generator.js';
import { createUI } from './ui/ui.js';

document.querySelector('#app').innerHTML = '<div id="three-canvas-container" style="width:100vw;height:100vh;"></div>';
const container = document.getElementById('three-canvas-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a4a6a);
scene.fog = new THREE.FogExp2(0x3a4a6a, 0.01);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(10, 15, 18);

const { world, wallMaterial, groundMaterial } = createWorld();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);
const clock = new THREE.Clock();

const hemi = new THREE.HemisphereLight(0xffffff, 0x263044, 0.45);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 1.65);
dir.position.set(15, 25, 10);
dir.castShadow = true;
dir.shadow.mapSize.set(1024, 1024);
dir.shadow.camera.near = 0.5;
dir.shadow.camera.far = 60;
dir.shadow.camera.left = -35;
dir.shadow.camera.right = 35;
dir.shadow.camera.top = 35;
dir.shadow.camera.bottom = -35;
scene.add(dir);
const amb = new THREE.AmbientLight(0xffffff, 0.18);
scene.add(amb);

let currentLevel = null;
let nextLevel = null;
let nextLevelPromise = null;
let levelRender = null;
let levelRequestId = 0;
let loadingLevel = true;

const levelWorker = new Worker(new URL('./world/generator.worker.js', import.meta.url), { type: 'module' });
const pendingLevelRequests = new Map();

levelWorker.addEventListener('message', (event) => {
  const { id, ok, level, error } = event.data;
  const request = pendingLevelRequests.get(id);
  if (!request) return;
  pendingLevelRequests.delete(id);
  if (!ok) request.reject(new Error(error || 'No se pudo generar el maze.'));
  else request.resolve(hydrateLevel(level));
});

function requestLevel({ seed = Date.now() } = {}) {
  const id = ++levelRequestId;
  const promise = new Promise((resolve, reject) => {
    pendingLevelRequests.set(id, { resolve, reject });
  });
  levelWorker.postMessage({ id, size: MAZE_SIZE, seed, minRoutes: 2 });
  return promise;
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.5, 0);

const personaje = new Personaje(camera, controls, scene, world);
personaje.entradaBloqueada = true;
personaje.distanciaCamara = 0;
personaje.alturaCamara = 1.5;
personaje.velocidad = PLAYER_SPEED;
personaje.fuerzaSalto = 8.0;

bindPlayerInput(personaje);

let flash = 0;
let t = 0;
let finished = false;

const ui = createUI({
  personaje,
  onPlay: () => {
    if (!currentLevel) return;
    ui.state.juegoPausado = false;
    respawn(false);
    precargarSiguienteLevel();
  },
  onPause: () => {
    if (!ui.state.juegoIniciado || finished) return;
    ui.state.juegoPausado = true;
    personaje.bloquearEntrada({ detenerMovimiento: true });
    personaje.desactivar();
    ui.onPauseInternal();
  },
  onResume: () => {
    if (!ui.state.juegoPausado) return;
    ui.state.juegoPausado = false;
    personaje.desbloquearEntrada();
    ui.onResumeInternal();
    personaje.activar();
  },
  getPaused: () => ui.state.juegoPausado,
  getFinished: () => finished,
});

function sincronizarPersonajeConLevel() {
  if (!currentLevel) return;
  personaje.reglasRecargaSuelo = {
    maze: currentLevel.maze,
    origin: currentLevel.origin,
    cell: CELL,
    pits: currentLevel.pits,
    margin: RECHARGE_MARGIN,
  };
  const mazeHalf = (currentLevel.size * CELL) / 2;
  personaje.limitesPlano = {
    minX: -mazeHalf + personaje.radioCapsula,
    maxX: mazeHalf - personaje.radioCapsula,
    minZ: -mazeHalf + personaje.radioCapsula,
    maxZ: mazeHalf - personaje.radioCapsula,
  };
}

window.__debugJump = {
  get saltosRestantes() {
    return personaje._saltosRestantes;
  },
  get enSuelo() {
    return personaje.enSuelo;
  },
  get sueloValido() {
    return personaje._sueloValido;
  },
  get tocandoMuro() {
    return personaje._tocandoMuro;
  },
  get enPared() {
    return personaje._enPared;
  },
  get mouseBloqueado() {
    return personaje.estaMouseBloqueado();
  },
  get sensibilidadMouse() {
    return personaje.sensibilidadMouse;
  },
  get perfilSensibilidadMouse() {
    return ui.getPerfilSensibilidad();
  },
  get pausado() {
    return ui.state.juegoPausado;
  },
  get levelSeed() {
    return currentLevel?.seed ?? null;
  },
  get maze() {
    return currentLevel?.maze ?? null;
  },
  get startCell() {
    return currentLevel?.startCell ?? null;
  },
  get endCell() {
    return currentLevel?.endCell ?? null;
  },
  get routeCount() {
    return currentLevel?.routeCount ?? 0;
  },
  get nextLevelReady() {
    return Boolean(nextLevel);
  },
  get isLoadingLevel() {
    return loadingLevel;
  },
  setSensibilidadMouse(value) {
    ui.aplicarSensibilidadMouse('personalizada', ui.limitarSensibilidadMouse(value), { guardar: true });
  },
  setSaltosRestantes(value) {
    personaje._saltosRestantes = value;
  },
  teleportToEnd() {
    if (!personaje.cuerpoFisico || !currentLevel) return;
    personaje.cuerpoFisico.position.set(currentLevel.end.x, 1, currentLevel.end.z);
    personaje.cuerpoFisico.velocity.set(0, 0, 0);
    personaje.pos.set(currentLevel.end.x, 0.5, currentLevel.end.z);
  },
  get pos() {
    return { x: personaje.pos.x, y: personaje.pos.y, z: personaje.pos.z };
  },
};

function respawn(mostrarFlash = true) {
  if (!personaje.cuerpoFisico || !currentLevel) return;
  personaje.cuerpoFisico.position.set(currentLevel.start.x, 1, currentLevel.start.z);
  personaje.cuerpoFisico.velocity.set(0, 0, 0);
  personaje.cuerpoFisico.angularVelocity.set(0, 0, 0);
  personaje.pos.set(currentLevel.start.x, 0.5, currentLevel.start.z);
  flash = mostrarFlash ? 1.0 : 0;
  if (!mostrarFlash) ui.mostrarFlashForzado(false);
}

function montarLevel(levelData) {
  levelRender?.dispose();
  currentLevel = levelData;
  levelRender = buildLevel({ scene, world, wallMaterial, groundMaterial, levelData: currentLevel });
  sincronizarPersonajeConLevel();
  respawn(false);
}

function precargarSiguienteLevel() {
  if (nextLevel || nextLevelPromise) return nextLevelPromise;
  nextLevelPromise = requestLevel({ seed: `next-${Date.now()}` })
    .then((level) => {
      nextLevel = level;
      return level;
    })
    .finally(() => {
      nextLevelPromise = null;
    });
  return nextLevelPromise;
}

async function regenerarLevel() {
  loadingLevel = true;
  ui.setLoading(true, 'Cargando siguiente maze');
  const levelData = nextLevel ?? await (nextLevelPromise || requestLevel({ seed: `fallback-${Date.now()}` }));
  nextLevel = null;
  montarLevel(levelData);
  ui.iniciarCronometro();
  loadingLevel = false;
  ui.setLoading(false);
  precargarSiguienteLevel();
}

async function cargarLevelInicial() {
  loadingLevel = true;
  ui.setMenuReady(false);
  ui.setLoading(true, 'Preparando rutas alternativas');
  const levelData = await requestLevel({ seed: `initial-${Date.now()}` });
  montarLevel(levelData);
  loadingLevel = false;
  ui.setLoading(false);
  ui.setMenuReady(true);
  ui.showMenu();
}

cargarLevelInicial().catch((error) => {
  console.error(error);
  ui.setLoading(true, 'No se pudo cargar el maze');
});

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (!ui.state.juegoPausado && currentLevel && levelRender) {
    t += delta;
    world.step(1 / 120, delta, 10);

    if (!personaje.modo) controls.update();
    personaje.actualizar(delta);

    const p = personaje.pos;
    if (p.y < -6) respawn();

    const d = Math.sqrt((p.x - currentLevel.end.x) ** 2 + (p.z - currentLevel.end.z) ** 2);
    if (d < 1.8 && !finished) {
      finished = true;
      const resultado = ui.registrarMeta();
      ui.setFinishedMessage(resultado);
      setTimeout(() => {
        ui.hideFinishedMessage();
        finished = false;
        regenerarLevel();
      }, 3000);
    }
  }

  if (flash > 0) {
    flash -= delta * 2;
    ui.mostrarFlash(Math.min(1, flash));
  } else {
    ui.mostrarFlash(0);
  }

  ui.actualizarHud();

  if (levelRender) {
    levelRender.fStar.position.y = 4.0 + Math.sin(t * 2) * 0.3;
    levelRender.fStar.rotation.y = t;
    levelRender.fLight.intensity = 1.2 + Math.sin(t * 3) * 0.35;
  }

  renderer.render(scene, camera);
}
animate();
