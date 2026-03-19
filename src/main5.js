//import './style.css';
// import { setupCounter } from './counter.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

document.querySelector('#app').innerHTML = `

<div id="three-canvas-container" style="width: 100vw; height: 100vh;"></div>
`;

// Inicializar Three.js
const container = document.getElementById('three-canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0a0);
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Luz
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Plano base
const planeGeometry = new THREE.PlaneGeometry(60, 60);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x008080 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0;
scene.add(plane);

// Controles mouse
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);


// --- Cargar modelos para la ciudad ---
const loader = new GLTFLoader();
const assets = {
  buildings: [
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/building_A.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/building_B.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/building_C.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/building_D.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/building_E.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/building_F.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/building_G.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/building_H.gltf',
  ],
  roads: [
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/road_straight.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/road_corner.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/road_junction.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/road_tsplit.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/road_straight_crossing.gltf',
  ],
  trees: [
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/bush.gltf',
  ],
  cars: [
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/car_hatchback.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/car_police.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/car_sedan.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/car_stationwagon.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/car_taxi.gltf',
  ],
  street: [
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/streetlight.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/bench.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/trash_A.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/trash_B.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/firehydrant.gltf',
    '/public/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/dumpster.gltf',
  ]
};

// Utilidad para cargar un modelo y devolver una promesa
function loadModel(path) {
  return new Promise((resolve, reject) => {
    loader.load(path, (gltf) => {
      resolve(gltf.scene);
    }, undefined, reject);
  });
}

// Cargar todos los modelos necesarios
async function buildCity() {
  // Cargar modelos
  const [buildingModels, roadModels, treeModels, carModels, streetModels] = await Promise.all([
    Promise.all(assets.buildings.map(loadModel)),
    Promise.all(assets.roads.map(loadModel)),
    Promise.all(assets.trees.map(loadModel)),
    Promise.all(assets.cars.map(loadModel)),
    Promise.all(assets.street.map(loadModel)),
  ]);

  // Ciudad compacta: edificios juntos, calles entre filas/columnas
  const blocks = 5; // número de bloques de edificios por lado
  const buildingSpacing = 4; // espacio entre edificios (más pequeño)
  const streetWidth = 2.2; // ancho de la calle
  const offset = ((blocks - 1) * buildingSpacing + blocks * streetWidth) / 2;
  const buildingsGroup = new THREE.Group();
  let d = 0;

  // Colocar edificios
  for (let i = 0; i < buildingModels.length; i++) {
    const b = buildingModels[i].clone();
    if (buildingsGroup.children.length % 3 == 0/*i > 0 && i % 3 === 0*/) { // cada 3 edificios, espacio para una calle
        d += streetWidth;
    }
    b.position.set(d, 0, 0); // Todos en la misma hilera, con espacio justo entre ellos
    
    buildingsGroup.add(b);
    d += 2.001;
  }

  // Calles horizontales
  for (let z = 0; z < blocks; z++) {
    for (let x = 0; x <= blocks; x++) {
      const worldX = x * (buildingSpacing + streetWidth) - offset - streetWidth / 2;
      const worldZ = z * (buildingSpacing + streetWidth) - offset;
      const r = roadModels[0].clone();
      r.position.set(worldX, 0.01, worldZ);
      r.rotation.y = Math.PI / 2;
      r.scale.set(streetWidth / 2, 1, buildingSpacing / 2);
      scene.add(r);
      // Coches en la calle
      if (Math.random() > 0.85) {
        const c = carModels[Math.floor(Math.random() * carModels.length)].clone();
        c.position.set(worldX, 0.15, worldZ + (Math.random() - 0.5) * (buildingSpacing - 1));
        c.rotation.y = Math.PI / 2;
        scene.add(c);
      }
    }
  }
  
  // Calles verticales
  for (let x = 0; x < blocks; x++) {
    for (let z = 0; z <= blocks; z++) {
      const worldX = x * (buildingSpacing + streetWidth) - offset;
      const worldZ = z * (buildingSpacing + streetWidth) - offset - streetWidth / 2;
      const r = roadModels[0].clone(); // usar road_straight
      r.position.set(worldX, 0.01, worldZ);
      r.scale.set(streetWidth / 2, 1, buildingSpacing / 2);
      scene.add(r);
      // Coches en la calle
      if (Math.random() > 0.85) {
        const c = carModels[Math.floor(Math.random() * carModels.length)].clone();
        c.position.set(worldX + (Math.random() - 0.5) * (buildingSpacing - 1), 0.15, worldZ);
        c.rotation.y = 0;
        scene.add(c);
      }
    }
  }
  scene.add(buildingsGroup); // Añade todo el grupo de una vez
}

buildCity();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();