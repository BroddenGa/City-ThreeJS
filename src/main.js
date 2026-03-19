import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { assets } from './assets';

document.querySelector('#app').innerHTML = `
<div id="three-canvas-container" style="width: 100vw; height: 100vh;"></div>
`;


//inicializar Three.js
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


const loader = new GLTFLoader();

// Clase Modelo para cargar y mostrar modelos GLTF
class Modelo {
  /**
   * @param {string} url - Ruta del modelo GLTF
   * @param {object} posicion - {x, y, z} posición en el plano
   * @param {number} tamano - Escala uniforme del modelo
   */
  constructor(url, posicion = {x:0, y:0, z:0}, tamano = 1) {
    this.url = url;
    this.posicion = posicion;
    this.tamano = tamano;
    this.objeto = null;
    this.cargar();
  }

  cargar() {
    loader.load(
      this.url,
      (gltf) => {
        this.objeto = gltf.scene;
        this.objeto.position.set(this.posicion.x, this.posicion.y, this.posicion.z);
        this.objeto.scale.set(this.tamano, this.tamano, this.tamano);
        scene.add(this.objeto);
      },
      undefined,
      (error) => {
        console.error('Error cargando modelo:', this.url, error);
      }
    );
  }
}

// Utilidad para cargar un modelo y devolver una promesa
// function cargarModelo(url, posicion = {x:0, y:0, z:0}) {
//   return new Promise((resolve, reject) => {
//     loader.load(
//       url,
//       (gltf) => {
//         gltf.scene.position.set(posicion.x, posicion.y, posicion.z);
//         scene.add(gltf.scene);
//         resolve(gltf.scene);
//       },
//       undefined,
//       (error) => reject(error)
//     );
//   });
// }


// Ejemplo: cargar todos los modelos usando la clase Modelo
const edificio1 = new Modelo(assets.buildings[0], {x: 11, y: 0, z: -5}, 2.5);
const edificio2 = new Modelo(assets.buildings[1], {x: 16, y: 0, z: -5}, 2.5);
// Object.keys(assets).forEach((categoria, i) => {
//   assets[categoria].forEach((url, j) => {
//     // Distribuir en una cuadrícula simple
//     const x = (j - assets[categoria].length / 2) * separacion;
//     const z = (i - Object.keys(assets).length / 2) * separacion;
//     // Puedes ajustar el tamaño según la categoría si lo deseas
//     let tamano = 1;
//     if (categoria === 'buildings') tamano = 1.5;
//     if (categoria === 'cars') tamano = 1.2;
//     new Modelo(url, {x, y:0, z}, tamano);
//   });
// });

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();