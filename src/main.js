import * as THREE from 'three';

// Crear la escena
const scene = new THREE.Scene();
//scene.background = new THREE.TextureLoader().load('./imagenes/cielo.jpg');
//Esfera cielo
const skyGeometry = new THREE.SphereGeometry(50, 32, 32);
const skyMaterial = new THREE.MeshBasicMaterial({
  map: new THREE.TextureLoader().load('./imagenes/cielo.jpg'),
  side: THREE.BackSide, // renderizar solo el interior de la esfera
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);


// Crear la cámara
let fov = 75;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect,
   near, far);
camera.position.z = 5;
camera.position.y = 3;

//mover la cámara con teclas
document.addEventListener('keydown', (event) => {
  const step = 0.5;
  switch (event.key) {
    case 'w':
      camera.position.z -= step; // Adelante
      break;
    case 's':
      camera.position.z += step; // Atrás
      break;
    case 'a':
      camera.position.x -= step; // Izquierda
      break;
    case 'd':
      camera.position.x += step; // Derecha
      break;
    case 'q':
      camera.position.y += step; // Arriba
      break;
    case 'e':
      camera.position.y -= step; // Abajo
      break;
  }
});

// Crear el renderizador
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//crear el cubo
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial
({ color: 0x00ff00, wireframe: false });
const cube = new THREE.Mesh(geometry, material);
cube.position.y = 1;

//agregar el cubo a la escena
scene.add(cube);

camera.lookAt(cube.position);

//suelo con plane
const planeGeometry = new THREE.PlaneGeometry(10, 10);

const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x11cc11, side: THREE.DoubleSide });
const planeTexture = new THREE.TextureLoader().load('./imagenes/pasto.jpg');
planeTexture.wrapS = THREE.RepeatWrapping;
planeTexture.wrapT = THREE.RepeatWrapping;
planeTexture.repeat.set(10, 10);
planeMaterial.map = planeTexture;


const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;

function animar() {
      requestAnimationFrame(animar);
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
}  
animar();

//luz ambiental
//const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//scene.add(ambientLight);

//luz direccional
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
//cambio de target
//directionalLight.target.position.set(10, 10, 0);
scene.add(directionalLight);
//scene.add(directionalLight.target);

scene.add(plane);

// Renderizar la escena
renderer.render(scene, camera);