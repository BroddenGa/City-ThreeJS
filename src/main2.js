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
// ...existing code...

async function buildCity() {
  // Cargar modelos
  const [buildingModels, roadModels, treeModels, carModels, streetModels] = await Promise.all([
    Promise.all(assets.buildings.map(loadModel)),
    Promise.all(assets.roads.map(loadModel)),
    Promise.all(assets.trees.map(loadModel)),
    Promise.all(assets.cars.map(loadModel)),
    Promise.all(assets.street.map(loadModel)),
  ]);

  const streetWidth = 2.2;
  const buildingsPerBlock = 3;
  const buildingStep = 2.001;
  const parallelRoadOffsetZ = 2.4;

  const buildingsGroup = new THREE.Group();
  const buildingXs = [];
  const gapCenters = [];
  let d = 0;

  // Edificios en hilera con hueco cada 3
  for (let i = 0; i < buildingModels.length; i++) {
    if (i > 0 && i % buildingsPerBlock === 0) {
      d += streetWidth;
      gapCenters.push(d - streetWidth / 2);
    }

    const b = buildingModels[i].clone();
    b.position.set(d, 0, 0);
    buildingsGroup.add(b);
    buildingXs.push(d);
    d += buildingStep;
  }

  scene.add(buildingsGroup);

  // Calles horizontales (paralelas a edificios)
  const minX = Math.min(...buildingXs) - buildingStep;
  const maxX = Math.max(...buildingXs) + buildingStep;
  const roadTileStep = buildingStep;

  for (let x = minX; x <= maxX; x += roadTileStep) {
    for (const z of [parallelRoadOffsetZ, -parallelRoadOffsetZ]) {
      const r = roadModels[0].clone();
      r.position.set(x, 0.01, z);
      r.rotation.y = Math.PI / 2;
      r.scale.set(streetWidth / 2, 1, roadTileStep / 2);
      scene.add(r);
    }
  }

  // Calles verticales en huecos entre bloques
  for (const xGap of gapCenters) {
    for (let z = -parallelRoadOffsetZ; z <= parallelRoadOffsetZ; z += roadTileStep) {
      const r = roadModels[0].clone();
      r.position.set(xGap, 0.01, z);
      r.rotation.y = 0;
      r.scale.set(streetWidth / 2, 1, roadTileStep / 2);
      scene.add(r);
    }
  }
}

// ...existing code...
buildCity();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();