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


//inicializar Cannon.js
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});

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

// Plano base
const planeGeometry = new THREE.PlaneGeometry(55, 60);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x727272 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0;
plane.position.x =-2.5;
scene.add(plane);

// Cuerpo físico del plano
// const groundBody = new CANNON.Body({
//   mass: 0,
//   shape: new CANNON.Plane(),
// });
// groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
// world.addBody(groundBody);

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

function modeledificio(x,y,z,f,r,n,giro180){
  for (let i = 0; i < f; i++) {
    new Modelo(assets.buildings[i], {x: i*5+x, y: y, z: z}, 2.5, scene, loader, world,r?{x: 0, y: giro180 ? Math.PI : Math.PI / (n?2:-2), z: 0}: undefined);
  }
}
function modeloCallePeatonal(x,y,z){
    new Modelo(assets.roads[4], {x: x, y: y, z:5+z}, 2.5, scene, loader, world);
}
function modeloCallex(x,y,z,f,a,r,n,giro180 ){
  for(let i = 0; i < f; i++){
    new Modelo(assets.roads[a], {x: i*5+x, y: y, z:5+z}, 2.5, scene, loader, world, r?{x: 0, y: giro180 ? Math.PI : Math.PI / (n?2:-2), z: 0}: undefined);
  }
}
function modeloCalley(x,y,z,f,a,r,n,giro180){
  for(let i = 0; i < f; i++){
    new Modelo(assets.roads[a], {x: x, y: y, z:i*5+5+z}, 2.5, scene, loader, world, r?{x: 0, y: giro180 ? Math.PI : Math.PI / (n?2:-2), z: 0}: undefined);
  }
}


modeledificio(-27.5,0.2,-27.5,3);
modeledificio(-7.49,0.2,-27.5,3);
modeledificio(12.51,0.2,-27.5,3);
modeledificio(-22.5,0.2,-17.49,2,true,true,true);
modeledificio(-7.5,0.2,-17.49,3,true,true,true);
modeledificio(12.5,0.2,-17.49,2,true,true,true);
modeledificio(-22.5,0.2,-12.49,2,false,false,false);
modeledificio(-7.5,0.2,-12.49,3,false,false,false);
modeledificio(12.5,0.2,-12.49,2,false,false,false);
modeledificio(-22.5,0.2,-2.49,2,true,true,true);
modeledificio(-7.5,0.2,-2.49,3,true,true,true);
modeledificio(12.5,0.2,-2.49,2,true,true,true);
modeledificio(-22.5,0.2,2.49,2,false,false,false);
modeledificio(-7.5,0.2,2.49,3,false,false,false);
modeledificio(12.5,0.2,2.49,2,false,false,false);
modeledificio(-22.5,0.2,12.49,2,true,true,true);
modeledificio(-7.5,0.2,12.49,3,true,true,true);
modeledificio(12.5,0.2,12.49,2,true,true,true);
modeledificio(-22.5,0.2,17.49,2,false,false,false);
modeledificio(-7.5,0.2,17.49,3,false,false,false);
modeledificio(12.5,0.2,17.49,2,false,false,false);
modeledificio(-27.5,0.2,27.49,3,true,true,true);
modeledificio(-12.48,0.2,27.49,3,true,true,true);
modeledificio(2.48,0.2,27.49,3,true,true,true);
modeledificio(12.48,0.2,27.49,3,true,true,true);

//calles con paso peatonal
modeloCallePeatonal(-12.49,0,-32.5);
modeloCallePeatonal(7.51,0,-32.5);
modeloCallePeatonal(7.51,0,-22.5);
modeloCallePeatonal(-12.49,0,-22.5);
modeloCallePeatonal(7.51,0,-7.5);
modeloCallePeatonal(-12.49,0,-7.5);
modeloCallePeatonal(7.51,0,7.5);
modeloCallePeatonal(-12.49,0,7.5);

//calles con giro
modeloCallex(-27.5,0,-27.49,1,1,false);
modeloCallex(22.5,0,-27.49,1,1,true,false);
modeloCallex(-27.5,0,17.49,1,1,true,true);
modeloCallex(22.5,0,17.5,1,1,true,true,true);
// modeloCallex(-12.5,0,-27.49,1,1,true,false);

//calles rectas
modeloCallex(-7.49,0,-27.49,3,0,true);
modeloCallex(-22.49,0,-27.49,2,0,true);
modeloCallex(12.49,0,-27.49,2,0,true);
modeloCalley(-27.5,0,-22.49,2,0,false,true);
modeloCallex(-22.49,0,-12.5,2,0,true,true);
modeloCallex(-7.49,0,-12.5,3,0,true,true);
modeloCallex(12.49,0,-12.5,2,0,true,true);
modeloCallex(-12.49,0,-17.5,1,0,false,true);
modeloCallex(7.49,0,-17.5,1,0,false,true);
modeloCalley(22.49,0,-22.5,2,0,false,true);
modeloCalley(-27.5,0,-7.49,2,0,false,true);
modeloCallex(-22.49,0,2.5,2,0,true,true);
modeloCallex(-7.49,0,2.5,3,0,true,true);
modeloCallex(12.49,0,2.5,2,0,true,true);
modeloCallex(-12.49,0,-2.5,1,0,false,true);
modeloCallex(7.49,0,-2.5,1,0,false,true);
modeloCalley(22.49,0,-7.5,2,0,false,true);
modeloCalley(-27.5,0,7.5,2,0,false,true);
modeloCallex(-22.49,0,17.5,2,0,true,true);
modeloCallex(-7.49,0,17.5,3,0,true,true);
modeloCallex(12.49,0,17.5,2,0,true,true);
modeloCallex(-12.49,0,12.5,1,0,false,true);
modeloCallex(7.49,0,12.5,1,0,false,true);
modeloCalley(22.49,0,7.5,2,0,false,true);

//tres direcciones
modeloCallex(-27.5,0,-12.5,1,3,false,true);
modeloCallex(22.5,0,-12.5,1,3,true,true,true);
modeloCallex(-27.5,0,2.5,1,3,false,true);
modeloCallex(22.5,0,2.5,1,3,true,true,true);
modeloCallex(-12.5,0,17.5,1,3,true,true);
modeloCallex(7.5,0,17.5,1,3,true,true);


//calle multidireccional
modeloCallex(-12.49,0,-27.49,1,2,true);
modeloCallex(7.49,0,-27.49,1,2,true);
modeloCallex(-12.49,0,-12.5,1,2,true,true);
modeloCallex(7.49,0,-12.5,1,2,true);
modeloCallex(-12.49,0,2.5,1,2,true,true);
modeloCallex(7.49,0,2.5,1,2,true);




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