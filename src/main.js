import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Personaje } from './personaje.js';

const CELL = 3.5;
const WALL_H = 4.5;
const WALL_T = 0.25;
const WALL_COLLISION_EXTRA = 12;
const RECHARGE_MARGIN = CELL * 0.3;

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
personaje.velocidad = 22;
personaje.fuerzaSalto = 8.0;
const mazeHalf = (N * CELL) / 2;
personaje.limitesPlano = {
  minX: -mazeHalf + personaje.radioCapsula,
  maxX: mazeHalf - personaje.radioCapsula,
  minZ: -mazeHalf + personaje.radioCapsula,
  maxZ: mazeHalf - personaje.radioCapsula,
};

const hud = document.createElement('div');
hud.style.cssText = 'position:fixed;top:16px;width:100%;text-align:center;pointer-events:none;z-index:10;font-family:monospace;';
hud.innerHTML = `
<div style="display:inline-block;background:rgba(0,0,0,0.6);padding:6px 18px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);">
<span style="color:#4FC3F7;">S</span> <b style="color:#fff;">LABERINTO PARKOUR</b> <span style="color:#FFD700;">META</span><br>
<span style="font-size:12px;color:#aaa;">[V] 1ra persona &nbsp;[WASD] mover &nbsp;[SPACE] saltar x2 &nbsp;[SHIFT] dash</span>
</div>`;
document.body.appendChild(hud);

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

function respawn() {
  if (!personaje.cuerpoFisico) return;
  personaje.cuerpoFisico.position.set(START.x, 1, START.z);
  personaje.cuerpoFisico.velocity.set(0, 0, 0);
  personaje.pos.set(START.x, 0.5, START.z);
  flash = 1.0;
}

let t = 0;
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
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
    msg.style.opacity = '1';
    setTimeout(() => { msg.style.opacity = '0'; finished = false; respawn(); }, 3000);
  }

  if (flash > 0) { flash -= delta * 2; flashDiv.style.opacity = Math.min(1, flash); }
  else flashDiv.style.opacity = '0';

  fStar.position.y = 4.0 + Math.sin(t * 2) * 0.3;
  fStar.rotation.y = t;
  fLight.intensity = 1.5 + Math.sin(t * 3) * 0.5;

  renderer.render(scene, camera);
}
animate();
