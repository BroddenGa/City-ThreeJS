import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// Cámara
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 3);

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controles de órbita
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);

// Luces
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Suelo
const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0x4CAF50 })
);
suelo.rotation.x = -Math.PI / 2;
scene.add(suelo);

// Cargar el modelo
const loader = new GLTFLoader();
let modelo = null;

// Crear info en pantalla
const infoDiv = document.createElement('div');
infoDiv.style.position = 'absolute';
infoDiv.style.top = '10px';
infoDiv.style.left = '10px';
infoDiv.style.color = 'white';
infoDiv.style.fontFamily = 'Arial, sans-serif';
infoDiv.style.fontSize = '14px';
infoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
infoDiv.style.padding = '15px';
infoDiv.style.borderRadius = '8px';
infoDiv.style.minWidth = '200px';
infoDiv.innerHTML = `
    <strong>Controles:</strong><br>
    - Arrastrar: Rotar<br>
    - Scroll: Zoom
`;
document.body.appendChild(infoDiv);

loader.load(
    './Therian/scene.gltf',
    (gltf) => {
        modelo = gltf.scene;
        modelo.position.set(0, 0, 0);
        scene.add(modelo);
        console.log('Modelo cargado');
    },
    undefined,
    (error) => {
        infoDiv.innerHTML = `
            <strong>Error al cargar modelo</strong>
        `;
        console.error('Error:', error);
    }
);

// Animación
function animar() {
    requestAnimationFrame(animar);
    controls.update();
    
    // Rotar modelo lentamente en el eje Y
    if (modelo) {
        modelo.rotation.y += 0.003;
    }
    
    renderer.render(scene, camera);
}

animar();

// Responsive
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});