import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Personaje } from './personaje.js';
import { callesConGiro, callesMultidireccional, callesPeatonales, callesRectasX, callesRectasY, callesTresDirecciones, edificiosConfig } from './configs.js';
import {
  configurarCargaModelos,
  modeledificio,
  modeloCallePeatonal,
  modeloCallex,
  modeloCalley,
} from './cargamodels.js';

document.querySelector('#app').innerHTML = `
<div id="three-canvas-container" style="width: 100vw; height: 100vh;"></div>
`;

//inicializar Three.js
const container = document.getElementById('three-canvas-container');
const scene = new THREE.Scene();
const newLocal = 0x80BDFF;
scene.background = new THREE.Color(newLocal);
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 30);


//inicializar Cannon.js
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});
world.solver.iterations = 20;
world.solver.tolerance = 0.001;

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);
const clock = new THREE.Clock();

// Luz
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Plano basenew THREE.MeshStandardMaterial({ color: 0x5b8def }),
const planeGeometry = new THREE.PlaneGeometry(55, 60);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x727272 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0;
plane.position.x =-2.5;
scene.add(plane);

// Cuerpo físico del plano (suelo sólido para evitar atravesarlo)
const groundHalfWidth = 55 / 2;
const groundHalfDepth = 60 / 2;
const groundHalfHeight = 0.75;
const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Box(
    new CANNON.Vec3(groundHalfWidth, groundHalfHeight, groundHalfDepth),
  ),
  position: new CANNON.Vec3(-2.5, -groundHalfHeight, 0),
});
world.addBody(groundBody);

//controles de mouse
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
//controles de flechas
window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'ArrowLeft':
      camera.position.x -= 1;
      break;
    case 'ArrowRight':
      camera.position.x += 1;
      break;
  }
});


// Loader para modelos GLTF
const loader = new GLTFLoader();

// Ruta del modelo GLB del personaje
const modeloPersonajeUrl = '/models/characters/gltf/Skeleton_Mage.glb';

// Creación del personaje con modelo GLB
const personaje = new Personaje(camera, controls, scene, world, loader, modeloPersonajeUrl);

configurarCargaModelos({ scene, loader, world });



edificiosConfig.forEach((config) => modeledificio(...config));
callesPeatonales.forEach(([x, y, z]) => modeloCallePeatonal(x, y, z));
callesConGiro.forEach((config) => modeloCallex(...config));
callesRectasX.forEach((config) => modeloCallex(...config));
callesRectasY.forEach((config) => modeloCalley(...config));
callesTresDirecciones.forEach((config) => modeloCallex(...config));
callesMultidireccional.forEach((config) => modeloCallex(...config));




function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  world.step(1 / 120, delta, 10);
  personaje.actualizar(delta);
  if (!personaje.modo) {
    controls.update();
  }
  renderer.render(scene, camera);
}
animate();