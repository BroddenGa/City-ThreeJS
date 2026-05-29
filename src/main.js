import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Personaje } from './personaje.js';

const CELL = 3.5;
const WALL_H = 4.5;
const WALL_T = 0.25;
const WALL_COLLISION_EXTRA = 12;
const RECHARGE_MARGIN = CELL * 0.3;
const PLAYER_SPEED = 12;
const MOUSE_SENSIBILIDAD_DEFAULT = 0.0022;
const MOUSE_SENSIBILIDAD_FIREFOX = 0.0034;
const MOUSE_SENSIBILIDAD_BRAVE = 0.0012;
const MOUSE_SENSIBILIDAD_KEY = 're-maze-mouse-sensitivity';
const MOUSE_SENSIBILIDAD_MIN = 0.0006;
const MOUSE_SENSIBILIDAD_MAX = 0.0200;
const MOUSE_SENSIBILIDAD_UI_STEP = 0.1;

const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const N = MAZE.length;
const ORIGEN = -(N * CELL) / 2;

function celdaCentro(gx, gz) {
  return { x: ORIGEN + gx * CELL + CELL / 2, z: ORIGEN + gz * CELL + CELL / 2 };
}

const START = celdaCentro(1, 1);
const END = celdaCentro(13, 13);

document.querySelector('#app').innerHTML = `<div id="three-canvas-container" style="width:100vw;height:100vh;"></div>`;
const container = document.getElementById('three-canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a4a6a);
scene.fog = new THREE.FogExp2(0x3a4a6a, 0.01);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(10, 15, 18);

const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -14, 0) });
world.solver.iterations = 20;
world.defaultContactMaterial.friction = 0.0;
world.defaultContactMaterial.restitution = 0.0;
const GROUP_GROUND = 1;
const GROUP_WALL = 2;
const GROUP_PLAYER = 4;
world.collisionGroups = { ground: GROUP_GROUND, wall: GROUP_WALL, player: GROUP_PLAYER };
world.playerMaterial = new CANNON.Material("player");
const wallMaterial = new CANNON.Material("wall");
const groundMaterial = new CANNON.Material("ground");
world.addContactMaterial(new CANNON.ContactMaterial(world.playerMaterial, wallMaterial, {
  friction: 0.0,
  restitution: 0.0,
  contactEquationStiffness: 1e8,
  contactEquationRelaxation: 3,
  frictionEquationStiffness: 1e6,
  frictionEquationRelaxation: 3,
}));
world.addContactMaterial(new CANNON.ContactMaterial(world.playerMaterial, groundMaterial, {
  friction: 0.01,
  restitution: 0.0,
  contactEquationStiffness: 1e8,
  contactEquationRelaxation: 3,
  frictionEquationStiffness: 1e6,
  frictionEquationRelaxation: 3,
}));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);
const clock = new THREE.Clock();

const hemi = new THREE.HemisphereLight(0xaaccff, 0x445566, 1.0);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffeedd, 1.2);
dir.position.set(15, 25, 10);
dir.castShadow = true;
dir.shadow.mapSize.set(2048, 2048);
dir.shadow.camera.near = 0.5;
dir.shadow.camera.far = 60;
dir.shadow.camera.left = -35;
dir.shadow.camera.right = 35;
dir.shadow.camera.top = 35;
dir.shadow.camera.bottom = -35;
scene.add(dir);
const amb = new THREE.AmbientLight(0xccccff, 0.6);
scene.add(amb);

const PITS = new Set([
  '4,1', '9,1',
  '6,3', '11,3',
  '3,5', '8,5',
  '5,7', '11,7',
  '4,9', '9,9',
  '6,11', '12,11',
  '3,13', '10,13',
]);
const cellMat = new THREE.MeshStandardMaterial({ color: 0x4a5a4a, roughness: 0.9 });
for (let gz = 0; gz < N; gz++) {
  for (let gx = 0; gx < N; gx++) {
    if (MAZE[gz][gx] !== 0) continue;
    if (PITS.has(`${gx},${gz}`)) continue;
    const c = celdaCentro(gx, gz);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(CELL, CELL), cellMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(c.x, -0.01, c.z);
    m.receiveShadow = true;
    scene.add(m);
    const b = new CANNON.Body({ mass: 0, material: groundMaterial });
    b.userData = { tipo: "suelo" };
    b.collisionFilterGroup = GROUP_GROUND;
    b.collisionFilterMask = GROUP_PLAYER;
    b.addShape(new CANNON.Box(new CANNON.Vec3(CELL/2, 0.5, CELL/2)));
    b.position.set(c.x, -0.5, c.z);
    world.addBody(b);
  }
}

const colors = [0x8a7a5a, 0x6a7a8a, 0x5a7a5a, 0x7a5a7a, 0x7a7a5a];

function colorGz(gz) { return colors[gz % colors.length]; }

function crearPared(cx, cz, ancho, prof, color) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(ancho, WALL_H, prof),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
  );
  m.position.set(cx, WALL_H / 2, cz);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  const b = new CANNON.Body({ mass: 0, material: wallMaterial });
  b.userData = { tipo: "muro" };
  b.collisionFilterGroup = GROUP_WALL;
  b.collisionFilterMask = GROUP_PLAYER;
  const wallH = WALL_H + WALL_COLLISION_EXTRA;
  b.addShape(new CANNON.Box(new CANNON.Vec3(ancho / 2, wallH / 2, prof / 2)));
  b.position.set(cx, wallH / 2 - 1.5, cz);
  world.addBody(b);
}

for (let gz = 0; gz < N; gz++) {
  for (let gx = 0; gx < N; gx++) {
    const c = celdaCentro(gx, gz);
    const cur = MAZE[gz][gx] === 1;
    const col = colorGz(gz);
    if (gx + 1 < N) {
      const nxt = MAZE[gz][gx + 1] === 1;
      if (cur !== nxt) crearPared(c.x + CELL / 2, c.z, WALL_T, CELL, col);
    } else if (cur) crearPared(c.x + CELL / 2, c.z, WALL_T, CELL, col);
    else crearPared(c.x + CELL / 2, c.z, WALL_T, CELL, 0x5a6a7a);
    if (gz + 1 < N) {
      const nxt = MAZE[gz + 1][gx] === 1;
      if (cur !== nxt) crearPared(c.x, c.z + CELL / 2, CELL, WALL_T, col);
    } else if (cur) crearPared(c.x, c.z + CELL / 2, CELL, WALL_T, col);
    else crearPared(c.x, c.z + CELL / 2, CELL, WALL_T, 0x5a6a7a);
  }
}

// ---- Parkour Platforms ----
function crearSuelo(cx, cy, cz, ancho, prof, color) {
  const h = 0.2;
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(ancho, h, prof),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
  );
  m.position.set(cx, cy + h / 2, cz);
  m.receiveShadow = true;
  scene.add(m);
  const b = new CANNON.Body({ mass: 0, material: groundMaterial });
  b.userData = { tipo: "plataforma" };
  b.collisionFilterGroup = GROUP_GROUND;
  b.collisionFilterMask = GROUP_PLAYER;
  b.addShape(new CANNON.Box(new CANNON.Vec3(ancho / 2, h / 2, prof / 2)));
  b.position.set(cx, cy + h / 2, cz);
  world.addBody(b);
}

function p(gx, gz, h, w, d, col) {
  if (PITS.has(`${gx},${gz}`)) return;
  const c = celdaCentro(gx, gz);
  if (MAZE[gz] && MAZE[gz][gx] === 0) crearSuelo(c.x, h, c.z, w, d, col);
}

const C = CELL;

p(3,1, 0.4, C*0.25, C*0.25, 0x66BB6A);
p(8,1, 0.4, C*0.25, C*0.25, 0x81C784);
p(5,5, 0.4, C*0.25, C*0.25, 0x4CAF50);
p(9,9, 0.4, C*0.25, C*0.25, 0x66BB6A);

p(7,1, 0.6, C*0.5, C*0.5, 0x8BC34A);
p(2,5, 0.6, C*0.5, C*0.5, 0xFF9800);
p(13,7, 0.6, C*0.5, C*0.5, 0x8BC34A);

p(5,9, 0.8, C*0.9, C*0.9, 0x4CAF50);
p(3,11, 0.8, C*0.9, C*0.9, 0x4CAF50);
p(9,13, 0.8, C*0.9, C*0.9, 0x4CAF50);

p(12,3, 2.2, C*0.4, C*0.4, 0xFF5722);
p(7,7, 2.5, C*0.4, C*0.4, 0xFF5722);
p(2,11, 2.0, C*0.4, C*0.4, 0xFF5722);

// ---- Torches ----
// (none)

const sc = 0x4FC3F7;
const sMesh = new THREE.Mesh(
  new THREE.BoxGeometry(CELL * 0.8, 0.15, CELL * 0.8),
  new THREE.MeshStandardMaterial({ color: sc, emissive: sc, emissiveIntensity: 0.3 })
);
sMesh.position.set(START.x, 0.075, START.z);
scene.add(sMesh);
const sLight = new THREE.PointLight(sc, 1, 5);
sLight.position.set(START.x, 3, START.z);
scene.add(sLight);

const fc = 0xFFD700;
const fMesh = new THREE.Mesh(
  new THREE.BoxGeometry(CELL * 0.9, 0.15, CELL * 0.9),
  new THREE.MeshStandardMaterial({ color: fc, emissive: fc, emissiveIntensity: 0.3 })
);
fMesh.position.set(END.x, 0.075, END.z);
scene.add(fMesh);
const fLight = new THREE.PointLight(fc, 1.5, 6);
fLight.position.set(END.x, 3.5, END.z);
scene.add(fLight);
const fPillar = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 3.5, 0.2),
  new THREE.MeshStandardMaterial({ color: fc, emissive: fc, emissiveIntensity: 0.15 })
);
fPillar.position.set(END.x, 1.75, END.z);
scene.add(fPillar);
const fStar = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.5),
  new THREE.MeshStandardMaterial({ color: fc, emissive: fc, emissiveIntensity: 0.5 })
);
fStar.position.set(END.x, 4.0, END.z);
scene.add(fStar);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.5, 0);

const personaje = new Personaje(camera, controls, scene, world);
personaje.reglasRecargaSuelo = {
  maze: MAZE,
  origin: ORIGEN,
  cell: CELL,
  pits: PITS,
  margin: RECHARGE_MARGIN,
};
personaje.entradaBloqueada = true;
let perfilSensibilidadMouse = 'default';
let perfilSensibilidadBase = 'default';
let sensibilidadMouseBase = MOUSE_SENSIBILIDAD_DEFAULT;

function limitarSensibilidadMouse(value) {
  const sensibilidad = Number(value);
  if (!Number.isFinite(sensibilidad)) return MOUSE_SENSIBILIDAD_DEFAULT;
  return Math.min(MOUSE_SENSIBILIDAD_MAX, Math.max(MOUSE_SENSIBILIDAD_MIN, sensibilidad));
}

function sensibilidadDesdeControl(value) {
  return limitarSensibilidadMouse(Number(value) / 1000);
}

function sensibilidadParaControl(value) {
  return (limitarSensibilidadMouse(value) * 1000).toFixed(1);
}

function leerSensibilidadGuardada() {
  const sensibilidad = Number(localStorage.getItem(MOUSE_SENSIBILIDAD_KEY));
  return Number.isFinite(sensibilidad) ? limitarSensibilidadMouse(sensibilidad) : null;
}

function actualizarControlSensibilidad() {
  const input = document.getElementById('config-sensibilidad');
  const value = document.getElementById('config-sensibilidad-value');
  const profile = document.getElementById('config-sensibilidad-profile');
  if (!input || !value || !profile) return;
  input.value = sensibilidadParaControl(personaje.sensibilidadMouse);
  value.textContent = sensibilidadParaControl(personaje.sensibilidadMouse);
  profile.textContent = perfilSensibilidadMouse === 'personalizada'
    ? 'Personalizada'
    : `Auto: ${perfilSensibilidadMouse}`;
}

function aplicarSensibilidadMouse(perfil, sensibilidad, { guardar = false } = {}) {
  perfilSensibilidadMouse = perfil;
  personaje.sensibilidadMouse = limitarSensibilidadMouse(sensibilidad);
  if (guardar) localStorage.setItem(MOUSE_SENSIBILIDAD_KEY, String(personaje.sensibilidadMouse));
  actualizarControlSensibilidad();
}

function restablecerSensibilidadMouse() {
  localStorage.removeItem(MOUSE_SENSIBILIDAD_KEY);
  aplicarSensibilidadMouse(perfilSensibilidadBase, sensibilidadMouseBase);
}

async function configurarSensibilidadMouse() {
  const userAgent = navigator.userAgent;
  let perfil = 'default';
  let sensibilidad = MOUSE_SENSIBILIDAD_DEFAULT;

  if (/Firefox\//.test(userAgent)) {
    perfil = 'firefox';
    sensibilidad = MOUSE_SENSIBILIDAD_FIREFOX;
  }

  try {
    const esBrave = await navigator.brave?.isBrave?.();
    if (esBrave) {
      perfil = 'brave';
      sensibilidad = MOUSE_SENSIBILIDAD_BRAVE;
    }
  } catch {
    // Mantiene el perfil ya detectado si Brave no expone su API.
  }

  perfilSensibilidadBase = perfil;
  sensibilidadMouseBase = sensibilidad;

  const sensibilidadGuardada = leerSensibilidadGuardada();
  if (sensibilidadGuardada !== null) {
    aplicarSensibilidadMouse('personalizada', sensibilidadGuardada);
    return;
  }

  aplicarSensibilidadMouse(perfil, sensibilidad);
}

configurarSensibilidadMouse();
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
    return perfilSensibilidadMouse;
  },
  get pausado() {
    return juegoPausado;
  },
  setSensibilidadMouse(value) {
    aplicarSensibilidadMouse('personalizada', limitarSensibilidadMouse(value), { guardar: true });
  },
  setSaltosRestantes(value) {
    personaje._saltosRestantes = value;
  },
  get pos() {
    return { x: personaje.pos.x, y: personaje.pos.y, z: personaje.pos.z };
  },
};
personaje.pos.set(START.x, 0.5, START.z);
if (personaje.cuerpoFisico) {
  personaje.cuerpoFisico.position.set(START.x, 0.5 + personaje.radioCapsula, START.z);
  personaje.cuerpoFisico.velocity.set(0, 0, 0);
}
personaje.distanciaCamara = 0;
personaje.alturaCamara = 1.5;
personaje.velocidad = PLAYER_SPEED;
personaje.fuerzaSalto = 8.0;
const mazeHalf = (N * CELL) / 2;
personaje.limitesPlano = {
  minX: -mazeHalf + personaje.radioCapsula,
  maxX: mazeHalf - personaje.radioCapsula,
  minZ: -mazeHalf + personaje.radioCapsula,
  maxZ: mazeHalf - personaje.radioCapsula,
};

const BEST_TIME_KEY = 're-maze-best-time';

function leerMejorTiempo() {
  const value = Number(localStorage.getItem(BEST_TIME_KEY));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function guardarMejorTiempo(value) {
  localStorage.setItem(BEST_TIME_KEY, String(value));
}

function formatearTiempo(segundos) {
  const totalCent = Math.max(0, Math.floor(segundos * 100));
  const min = Math.floor(totalCent / 6000);
  const sec = Math.floor((totalCent % 6000) / 100);
  const cent = totalCent % 100;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cent).padStart(2, '0')}`;
}

let tiempoInicio = 0;
let tiempoActual = 0;
let cronometroActivo = false;
let mejorTiempo = leerMejorTiempo();

function tiempoPartidaActual() {
  if (!cronometroActivo) return tiempoActual;
  return performance.now() / 1000 - tiempoInicio;
}

function iniciarCronometro() {
  tiempoInicio = performance.now() / 1000;
  tiempoActual = 0;
  cronometroActivo = true;
  actualizarHud();
}

function detenerCronometro() {
  tiempoActual = tiempoPartidaActual();
  cronometroActivo = false;
  return tiempoActual;
}

function pausarCronometro() {
  tiempoActual = tiempoPartidaActual();
  cronometroActivo = false;
  actualizarHud();
}

function reanudarCronometro() {
  tiempoInicio = performance.now() / 1000 - tiempoActual;
  cronometroActivo = true;
  actualizarHud();
}

function registrarMeta() {
  const tiempoFinal = detenerCronometro();
  const nuevoRecord = mejorTiempo === null || tiempoFinal < mejorTiempo;
  if (nuevoRecord) {
    mejorTiempo = tiempoFinal;
    guardarMejorTiempo(tiempoFinal);
  }
  return { tiempoFinal, nuevoRecord };
}

const hud = document.createElement('div');
hud.style.cssText = 'position:fixed;top:14px;left:0;width:100%;display:flex;justify-content:center;pointer-events:none;z-index:10;font-family:monospace;color:#fff;';
hud.style.display = 'none';
hud.innerHTML = `
<div style="width:min(760px,calc(100vw - 24px));background:rgba(5,9,16,0.72);border:1px solid rgba(255,255,255,0.16);border-radius:8px;padding:10px 12px;box-shadow:0 10px 30px rgba(0,0,0,0.28);backdrop-filter:blur(8px);">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;">
    <div style="font-weight:bold;font-size:15px;letter-spacing:0;color:#fff;"><span style="color:#4FC3F7;">S</span> RE-MAZE <span style="color:#FFD700;">META</span></div>
    <div id="hud-estado" style="display:flex;align-items:center;gap:6px;color:#c8d3e3;font-size:12px;"><span id="hud-estado-dot" style="width:8px;height:8px;border-radius:50%;background:#8BC34A;box-shadow:0 0 10px rgba(139,195,74,0.8);"></span><span id="hud-estado-texto">SUELO</span></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,minmax(90px,1fr));gap:8px;">
    <div style="background:rgba(255,255,255,0.07);border-radius:6px;padding:8px 10px;min-height:52px;">
      <div style="font-size:10px;color:#93a6bd;margin-bottom:4px;">TIEMPO</div>
      <div id="hud-tiempo" style="font-size:21px;font-weight:bold;color:#fff;line-height:1;">00:00.00</div>
    </div>
    <div style="background:rgba(255,255,255,0.07);border-radius:6px;padding:8px 10px;min-height:52px;">
      <div style="font-size:10px;color:#93a6bd;margin-bottom:4px;">MEJOR</div>
      <div id="hud-mejor" style="font-size:18px;font-weight:bold;color:#FFD700;line-height:1.1;">--:--.--</div>
    </div>
    <div style="background:rgba(255,255,255,0.07);border-radius:6px;padding:8px 10px;min-height:52px;">
      <div style="font-size:10px;color:#93a6bd;margin-bottom:4px;">SALTOS</div>
      <div id="hud-saltos" style="font-size:18px;font-weight:bold;color:#8BC34A;line-height:1.1;">1/1</div>
    </div>
    <div style="background:rgba(255,255,255,0.07);border-radius:6px;padding:8px 10px;min-height:52px;">
      <div style="font-size:10px;color:#93a6bd;margin-bottom:4px;">DASH</div>
      <div id="hud-dash" style="font-size:18px;font-weight:bold;color:#8BC34A;line-height:1.1;">LISTO</div>
      <div style="height:3px;background:rgba(255,255,255,0.12);border-radius:999px;margin-top:7px;overflow:hidden;">
        <div id="hud-dash-bar" style="height:100%;width:100%;background:#4FC3F7;transform-origin:left center;transform:scaleX(1);"></div>
      </div>
    </div>
  </div>
  <div style="margin-top:8px;font-size:11px;color:#9fb0c4;text-align:center;">WASD mover &nbsp; SPACE saltar &nbsp; SHIFT dash &nbsp; V camara</div>
</div>`;
document.body.appendChild(hud);

const lockNotice = document.createElement('div');
lockNotice.id = 'mouse-lock-notice';
lockNotice.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:18;display:none;pointer-events:none;font-family:monospace;color:#fff;background:rgba(5,9,16,0.76);border:1px solid rgba(255,255,255,0.18);border-radius:6px;padding:10px 14px;box-shadow:0 10px 30px rgba(0,0,0,0.28);';
lockNotice.textContent = 'Click en la pantalla para capturar el mouse';
document.body.appendChild(lockNotice);

const pauseOverlay = document.createElement('div');
pauseOverlay.id = 'pause-overlay';
pauseOverlay.style.cssText = 'position:fixed;inset:0;z-index:35;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(6,10,18,0.62);font-family:monospace;color:#fff;';
pauseOverlay.innerHTML = `
<section aria-labelledby="pause-title" style="width:min(360px,calc(100vw - 32px));background:rgba(12,18,30,0.9);border:1px solid rgba(255,255,255,0.18);border-radius:8px;padding:24px;box-shadow:0 18px 60px rgba(0,0,0,0.45);text-align:center;">
  <h2 id="pause-title" style="font-size:30px;line-height:1;margin:0 0 18px;color:#fff;letter-spacing:0;">Pausa</h2>
  <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
    <button id="pause-resume" type="button" style="min-width:140px;border:0;border-radius:6px;background:#4FC3F7;color:#07101a;font-weight:bold;font-size:16px;padding:12px 18px;cursor:pointer;">Continuar</button>
    <button id="pause-config" type="button" style="min-width:140px;border:1px solid rgba(255,255,255,0.28);border-radius:6px;background:rgba(255,255,255,0.08);color:#fff;font-weight:bold;font-size:16px;padding:12px 18px;cursor:pointer;">Configuracion</button>
  </div>
</section>`;
document.body.appendChild(pauseOverlay);

const configOverlay = document.createElement('div');
configOverlay.id = 'config-overlay';
configOverlay.style.cssText = 'position:fixed;inset:0;z-index:50;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(6,10,18,0.7);font-family:monospace;color:#fff;';
configOverlay.innerHTML = `
<section aria-labelledby="config-title" style="width:min(460px,calc(100vw - 32px));background:rgba(12,18,30,0.94);border:1px solid rgba(255,255,255,0.18);border-radius:8px;padding:24px;box-shadow:0 18px 60px rgba(0,0,0,0.45);">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;">
    <h2 id="config-title" style="font-size:28px;line-height:1;margin:0;color:#fff;letter-spacing:0;">Configuracion</h2>
    <button id="config-close" type="button" aria-label="Cerrar configuracion" style="width:38px;height:38px;border:1px solid rgba(255,255,255,0.28);border-radius:6px;background:rgba(255,255,255,0.08);color:#fff;font-size:20px;line-height:1;cursor:pointer;">x</button>
  </div>
  <div style="display:grid;gap:10px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <label for="config-sensibilidad" style="font-size:13px;color:#c8d3e3;">Sensibilidad del mouse</label>
      <div id="config-sensibilidad-value" style="min-width:42px;text-align:right;font-size:18px;font-weight:bold;color:#4FC3F7;">2.2</div>
    </div>
    <input id="config-sensibilidad" type="range" min="${MOUSE_SENSIBILIDAD_MIN * 1000}" max="${MOUSE_SENSIBILIDAD_MAX * 1000}" step="${MOUSE_SENSIBILIDAD_UI_STEP}" value="${MOUSE_SENSIBILIDAD_DEFAULT * 1000}" style="width:100%;accent-color:#4FC3F7;">
    <div id="config-sensibilidad-profile" style="font-size:12px;color:#93a6bd;">Auto: default</div>
  </div>
  <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:22px;">
    <button id="config-reset" type="button" style="min-width:130px;border:1px solid rgba(255,255,255,0.28);border-radius:6px;background:rgba(255,255,255,0.08);color:#fff;font-weight:bold;font-size:15px;padding:10px 14px;cursor:pointer;">Restablecer</button>
    <button id="config-done" type="button" style="min-width:130px;border:0;border-radius:6px;background:#4FC3F7;color:#07101a;font-weight:bold;font-size:15px;padding:10px 14px;cursor:pointer;">Listo</button>
  </div>
</section>`;
document.body.appendChild(configOverlay);

const hudTiempo = document.getElementById('hud-tiempo');
const hudMejor = document.getElementById('hud-mejor');
const hudSaltos = document.getElementById('hud-saltos');
const hudDash = document.getElementById('hud-dash');
const hudDashBar = document.getElementById('hud-dash-bar');
const hudEstadoDot = document.getElementById('hud-estado-dot');
const hudEstadoTexto = document.getElementById('hud-estado-texto');
const pauseResumeBtn = document.getElementById('pause-resume');
const pauseConfigBtn = document.getElementById('pause-config');
const configCloseBtn = document.getElementById('config-close');
const configDoneBtn = document.getElementById('config-done');
const configResetBtn = document.getElementById('config-reset');
const configSensibilidad = document.getElementById('config-sensibilidad');

function actualizarHud() {
  hudTiempo.textContent = formatearTiempo(tiempoPartidaActual());
  hudMejor.textContent = mejorTiempo === null ? '--:--.--' : formatearTiempo(mejorTiempo);
  hudSaltos.textContent = `${personaje._saltosRestantes}/${personaje._saltosMax}`;

  const dashRestante = Math.max(0, personaje._dashCooldown);
  const dashTotal = personaje._dashTiempoRecarga || 1;
  const dashListo = dashRestante <= 0;
  hudDash.textContent = dashListo ? 'LISTO' : `${dashRestante.toFixed(1)}s`;
  hudDash.style.color = dashListo ? '#8BC34A' : '#FFD166';
  hudDashBar.style.transform = `scaleX(${dashListo ? 1 : 1 - Math.min(1, dashRestante / dashTotal)})`;

  let estadoTexto = 'AIRE';
  let estadoColor = '#90CAF9';
  if (personaje.enSuelo) {
    estadoTexto = 'SUELO';
    estadoColor = '#8BC34A';
  } else if (personaje._enPared) {
    estadoTexto = 'PARED';
    estadoColor = '#FFB74D';
  }
  hudEstadoTexto.textContent = estadoTexto;
  hudEstadoDot.style.background = estadoColor;
  hudEstadoDot.style.boxShadow = `0 0 10px ${estadoColor}`;

  const necesitaMouse = juegoIniciado && !juegoPausado && personaje.modo && !personaje.estaMouseBloqueado();
  lockNotice.style.display = necesitaMouse ? 'block' : 'none';
}

let juegoIniciado = false;
let juegoPausado = false;
let configuracionAbierta = false;
let mouseBloqueadoDuranteJuego = false;

function abrirConfiguracion() {
  configuracionAbierta = true;
  actualizarControlSensibilidad();
  configOverlay.style.display = 'flex';
}

function cerrarConfiguracion() {
  configuracionAbierta = false;
  configOverlay.style.display = 'none';
}

function pausarJuego() {
  if (!juegoIniciado || juegoPausado || finished) return;
  juegoPausado = true;
  pausarCronometro();
  personaje.bloquearEntrada({ detenerMovimiento: true });
  personaje.desactivar();
  pauseOverlay.style.display = 'flex';
  lockNotice.style.display = 'none';
}

function reanudarJuego() {
  if (!juegoPausado) return;
  juegoPausado = false;
  personaje.desbloquearEntrada();
  pauseOverlay.style.display = 'none';
  reanudarCronometro();
  personaje.activar();
}

const menuPrincipal = document.createElement('div');
menuPrincipal.id = 'menu-principal';
menuPrincipal.style.cssText = 'position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(6,10,18,0.78);font-family:monospace;color:#fff;transition:opacity 0.28s ease;';
menuPrincipal.innerHTML = `
<section aria-labelledby="menu-title" style="width:min(520px,calc(100vw - 32px));background:rgba(12,18,30,0.88);border:1px solid rgba(255,255,255,0.18);border-radius:8px;padding:28px;box-shadow:0 18px 60px rgba(0,0,0,0.45);">
  <div style="font-size:13px;color:#4FC3F7;letter-spacing:0;text-transform:uppercase;margin-bottom:8px;">Parkour 3D</div>
  <h1 id="menu-title" style="font-size:38px;line-height:1.05;margin:0 0 12px;color:#fff;letter-spacing:0;">re-maze</h1>
  <p style="margin:0 0 22px;color:#c8d3e3;font-size:15px;line-height:1.5;">Llega a la meta usando saltos, dash y plataformas.</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
    <button id="menu-jugar" type="button" style="min-width:140px;border:0;border-radius:6px;background:#4FC3F7;color:#07101a;font-weight:bold;font-size:16px;padding:12px 18px;cursor:pointer;">Jugar</button>
    <button id="menu-config" type="button" style="min-width:140px;border:1px solid rgba(255,255,255,0.28);border-radius:6px;background:rgba(255,255,255,0.08);color:#fff;font-weight:bold;font-size:16px;padding:12px 18px;cursor:pointer;">Configuracion</button>
    <button id="menu-controles" type="button" aria-expanded="false" aria-controls="menu-controles-panel" style="min-width:140px;border:1px solid rgba(255,255,255,0.28);border-radius:6px;background:rgba(255,255,255,0.08);color:#fff;font-weight:bold;font-size:16px;padding:12px 18px;cursor:pointer;">Controles</button>
  </div>
  <div id="menu-controles-panel" hidden style="border-top:1px solid rgba(255,255,255,0.14);padding-top:16px;color:#dce7f5;font-size:14px;line-height:1.7;">
    <div><b>WASD</b> - Moverse</div>
    <div><b>Mouse</b> - Mirar alrededor</div>
    <div><b>Space</b> - Saltar y doble salto</div>
    <div><b>Shift</b> - Dash</div>
    <div><b>V</b> - Alternar camara</div>
  </div>
</section>`;
document.body.appendChild(menuPrincipal);

const jugarBtn = document.getElementById('menu-jugar');
const menuConfigBtn = document.getElementById('menu-config');
const controlesBtn = document.getElementById('menu-controles');
const controlesPanel = document.getElementById('menu-controles-panel');

controlesBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const visible = !controlesPanel.hidden;
  controlesPanel.hidden = visible;
  controlesBtn.setAttribute('aria-expanded', String(!visible));
});

menuConfigBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  abrirConfiguracion();
});

pauseResumeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  reanudarJuego();
});

pauseConfigBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  abrirConfiguracion();
});

configSensibilidad.addEventListener('input', () => {
  aplicarSensibilidadMouse('personalizada', sensibilidadDesdeControl(configSensibilidad.value), { guardar: true });
});

configResetBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  restablecerSensibilidadMouse();
});

configCloseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  cerrarConfiguracion();
});

configDoneBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  cerrarConfiguracion();
});

configOverlay.addEventListener('pointerdown', (e) => {
  if (e.target === configOverlay) cerrarConfiguracion();
});

window.addEventListener('keydown', (e) => {
  if (e.code !== 'Escape') return;
  if (configuracionAbierta) {
    e.preventDefault();
    e.stopPropagation();
    cerrarConfiguracion();
    return;
  }
  if (!juegoIniciado) return;
  e.preventDefault();
  e.stopPropagation();
  if (juegoPausado) reanudarJuego();
  else pausarJuego();
}, true);

document.addEventListener('pointerlockchange', () => {
  if (!juegoIniciado || juegoPausado || !personaje.modo) return;
  if (personaje.estaMouseBloqueado()) {
    mouseBloqueadoDuranteJuego = true;
    return;
  }
  if (mouseBloqueadoDuranteJuego) {
    pausarJuego();
  }
});

jugarBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (juegoIniciado) return;
  juegoIniciado = true;
  juegoPausado = false;
  mouseBloqueadoDuranteJuego = false;
  personaje.entradaBloqueada = false;
  pauseOverlay.style.display = 'none';
  hud.style.display = 'flex';
  respawn(false);
  iniciarCronometro();
  personaje.activar();
  menuPrincipal.style.opacity = '0';
  menuPrincipal.style.pointerEvents = 'none';
  setTimeout(() => menuPrincipal.remove(), 320);
});

[
  [3,1], [7,3], [11,5], [7,7], [3,9], [11,11], [7,13],
].forEach(([gx,gz]) => {
  const c = celdaCentro(gx, gz);
  if (MAZE[gz] && MAZE[gz][gx] === 0) {
    const l = new THREE.PointLight(0xffffff, 1.0, 8);
    l.position.set(c.x, WALL_H - 0.2, c.z);
    scene.add(l);
  }
});

const msg = document.createElement('div');
msg.style.cssText = 'position:fixed;top:45%;width:100%;text-align:center;color:#FFD700;font-family:monospace;font-size:28px;font-weight:bold;pointer-events:none;text-shadow:0 0 30px rgba(255,215,0,0.5);opacity:0;transition:opacity 0.6s;z-index:20;';
msg.textContent = 'LLEGASTE A LA META!';
document.body.appendChild(msg);

let finished = false;
let finTimer = 0;

const flashDiv = document.createElement('div');
flashDiv.style.cssText = 'position:fixed;inset:0;background:rgba(255,0,0,0.15);pointer-events:none;opacity:0;transition:opacity 0.3s;z-index:15;';
document.body.appendChild(flashDiv);
let flash = 0;

function respawn(mostrarFlash = true) {
  if (!personaje.cuerpoFisico) return;
  personaje.cuerpoFisico.position.set(START.x, 1, START.z);
  personaje.cuerpoFisico.velocity.set(0, 0, 0);
  personaje.pos.set(START.x, 0.5, START.z);
  flash = mostrarFlash ? 1.0 : 0;
  if (!mostrarFlash) flashDiv.style.opacity = '0';
}

let t = 0;
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (!juegoPausado) {
    t += delta;
    world.step(1 / 120, delta, 10);

    if (!personaje.modo) controls.update();
    personaje.actualizar(delta);

    const p = personaje.pos;

    if (p.y < -6) respawn();

    const d = Math.sqrt((p.x - END.x) ** 2 + (p.z - END.z) ** 2);
    if (d < 1.8 && !finished) {
      finished = true;
      finTimer = 1;
      const resultado = registrarMeta();
      msg.innerHTML = `LLEGASTE A LA META!<br><span style="font-size:18px;color:#fff;">Tiempo ${formatearTiempo(resultado.tiempoFinal)}${resultado.nuevoRecord ? ' - NUEVO RECORD' : ''}</span>`;
      msg.style.opacity = '1';
      setTimeout(() => {
        msg.style.opacity = '0';
        finished = false;
        respawn(false);
        iniciarCronometro();
      }, 3000);
    }
  }

  if (flash > 0) { flash -= delta * 2; flashDiv.style.opacity = Math.min(1, flash); }
  else flashDiv.style.opacity = '0';

  actualizarHud();

  fStar.position.y = 4.0 + Math.sin(t * 2) * 0.3;
  fStar.rotation.y = t;
  fLight.intensity = 1.5 + Math.sin(t * 3) * 0.5;

  renderer.render(scene, camera);
}
animate();
