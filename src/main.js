import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { assets } from './assets';
import { Modelo } from './modelo';
import { Personaje } from './personaje';

document.querySelector('#app').innerHTML = `
<div id="three-canvas-container" style="width: 100vw; height: 100vh;"></div>
`;

//inicializar Three.js
const container = document.getElementById('three-canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0a0);
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 30);

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});


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


// Plano base
const planeGeometry = new THREE.PlaneGeometry(55, 60);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x727272 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0;
plane.position.x =-2.5;
scene.add(plane);

const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
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

//creacion de los modelos y personaje
const personaje = new Personaje(camera, controls, scene, world);
const loader = new GLTFLoader();

function modeledificio(x,y,z){
  for (let i = 0; i < 3; i++) {
    new Modelo(assets.buildings[i], {x: i*5+x, y: 0, z: z}, 2.5, scene, loader, world);
  }
}
function modeloCallePeatonal(x,y,z){
    new Modelo(assets.roads[4], {x: x, y: y, z:5+z}, 2.5, scene, loader, world);
  
}
function modeloCalle(x,y,z){}

modeledificio(-27.5,0,-27.5);
modeloCallePeatonal(-12.49,0,-32.5);
modeledificio(-7.49,0,-27.5);
modeloCallePeatonal(7.51,0,-32.5);
modeledificio(12.51,0,-27.5);



function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  world.step(1 / 60, delta, 3);
  personaje.actualizar();
  if (!personaje.modo) {
    controls.update();
  }
  renderer.render(scene, camera);
}
animate();