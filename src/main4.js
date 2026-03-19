import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
//import three y cannon
import * as THREE from "three";
import * as CANNON from "cannon-es";

//Mundo de caramelo
const mundo = new CANNON.World();
mundo.gravity.set(0, -9.82, 0);

// Escena y Cámara, ya te la sabes
const scene = new THREE.Scene();

let fov = 75;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 5;
camera.position.y = 3;

// Crear el renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace; // Corrección de color
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Mapeo de tonos cinematográfico
document.body.appendChild(renderer.domElement);

// Crear el cielo
const skyGeometry = new THREE.SphereGeometry(50, 100, 100);
const skyTexture = new THREE.TextureLoader().load("./images/Foto cara.jpeg");
skyTexture.colorSpace = THREE.SRGBColorSpace;

const skyMaterial = new THREE.MeshStandardMaterial({
    map: skyTexture,
    side: THREE.DoubleSide,
    // color: 0x808080, //50% de brillo (00=negro, 80=50%, FF=100%)
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);


const skyGeometry2 = new THREE.SphereGeometry(10, 50, 50);
// skyTexture2.colorSpace = THREE.SRGBColorSpace;

const skyMaterial2 = new THREE.MeshStandardMaterial({
    // map: skyTexture2,
    side: THREE.DoubleSide,
    transparent: true,      // Habilitar transparencia
    opacity: 0
    // color: 0x808080, //50% de brillo (00=negro, 80=50%, FF=100%)
});
const sky2 = new THREE.Mesh(skyGeometry2/*, skyMaterial*/);
scene.add(sky2);

// Clonador de cajitas
function crearCaja(tamaño, posicion, color, mass = 1, restitution = 0.3) {
    const geometry = new THREE.BoxGeometry(tamaño.x, tamaño.y, tamaño.z);
    const material = new THREE.MeshStandardMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(posicion);
    scene.add(mesh);
   
    const shape = new CANNON.Box(new CANNON.Vec3(tamaño.x/2, tamaño.y/2, tamaño.z/2));
    const body = new CANNON.Body({
        mass: mass,
        shape: shape,
    });
    body.position.copy(posicion);
    body.material = new CANNON.Material({ restitution: restitution }); // Rebote
    mundo.addBody(body);
   
    return { mesh, body };
}

function crearCaja2(tamaño, posicion, color, mass = 1, restitution = 0.3) {
    const geometry = new THREE.BoxGeometry(tamaño.x, tamaño.y, tamaño.z);
    const material = new THREE.MeshStandardMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(posicion);
    scene.add(mesh);
   
    const shape = new CANNON.Box(new CANNON.Vec3(tamaño.x/2, tamaño.y/2, tamaño.z/2));
    const body = new CANNON.Body({
        mass: mass,
        shape: shape,
    });
    body.position.copy(posicion);
    body.material = new CANNON.Material({ restitution: restitution }); // Rebote
    mundo.addBody(body);
   
    return { mesh, body };
}

function crearSuelo(tamaño, posicion, color) {
    const geometry = new THREE.PlaneGeometry(tamaño.x, tamaño.z);
    const material = new THREE.MeshStandardMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(posicion);
    scene.add(mesh);
   
    const shape = new CANNON.Plane();
    const body = new CANNON.Body({ mass: 0, shape: shape });
    body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    body.position.copy(posicion);
    mundo.addBody(body);
   
    return { mesh, body };
}

const suelo = crearSuelo(
    { x: 10, z: 10 },        
    { x: 0, y: 0, z: 0 },    
    0x808080                  
);

const cajaRoja = crearCaja(
    { x: 1, y: 1, z: 1 },    
    { x: 0, y: 0.5, z: 0 },  
    0xff0000,                
    1,                        
    1                      
);

// const loader = new GLTFLoader();
// let modelo = null;

// loader.load(
//     './Therian/scene.gltf',
//     (gltf) => {
//         modelo = gltf.scene;
//         modelo.position.set(0, 0, 0);
//         scene.add(modelo);
//         console.log('Modelo cargado');
//     },
//     undefined,
//     (error) => {
//         infoDiv.innerHTML = `
//             <strong>Error al cargar modelo</strong>
//         `;
//         console.error('Error:', error);
//     }
// );

const cubo = crearCaja(
    { x: 1, y: 1, z: 1 },    
    { x: 0, y: 5, z: 0 },    
    0x00ff00,                
    10,                      
    1                      
);

// Hitbox del personaje
const playerSize = { x: 0.8, y: 1.8, z: 0.8 };
const playerShape = new CANNON.Box(
  new CANNON.Vec3(playerSize.x / 2, playerSize.y / 2, playerSize.z / 2)
);

const playerBody = new CANNON.Body({
  mass: 5,
  shape: playerShape,
  position: new CANNON.Vec3(0, 2, 0),
});
playerBody.fixedRotation = true; // evita que se tumbe
playerBody.updateMassProperties();
mundo.addBody(playerBody);

// Caja visual (debug)
const playerBox = new THREE.Mesh(
  new THREE.BoxGeometry(playerSize.x, playerSize.y, playerSize.z),
  new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, visible: false })
);
scene.add(playerBox);

// Modelo visual
loader.load('./Therian/scene.gltf', (gltf) => {
  modelo = gltf.scene;
  modelo.position.set(0, -playerSize.y / 2, 0); // offset para apoyar "pies"
  playerBox.add(modelo); // el modelo hereda transform de la caja
});
    

//Luz direccional
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(15, 15, 8);
scene.add(directionalLight);

const proyectiles = [];

document.addEventListener('keydown', (event) => {
  const step = 0.5;
  switch (event.key) {
    case 'a':
    //   camera.position.z -= step; // Atrás
    // camera.rotateOnWorldAxis (new THREE.Vector3(0, 1, 0), step); // Rotar a la izquierda
    //   camera.position.x -= step; // Derecha
    sky2.rotation.y -= step * 0.05; // Rotar el cielo a la izquierda
      break;
    case 'd':
    //   camera.position.z += step; // Adelante
    //   camera.position.x += step; // Izquierda
    sky2.rotation.y += step * 0.05; // Rotar el cielo a la derecha
      break;
    
    case 'f':
    //    if (contador % 2 == 0) {
    //      skyMaterial.map = new THREE.TextureLoader().load('./Foto cara.jpeg');
    //      skyMaterial.needsUpdate = true;
    //    } else {
    //      skyMaterial.map = new THREE.TextureLoader().load('./WhatsApp Image 2026-03-03 at 08.25.54.jpeg');
    //      skyMaterial.needsUpdate = true;
    //    }
    //    contador += 1;
        const cubo2 = crearCaja(
        { x: 1, y: 1, z: 1 },
        { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        0x00ffff,
        10,
        1
      );

      const fuerza = 60;
      const forward = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(camera.quaternion)
        .normalize();

      cubo2.body.velocity.set(
        forward.x * fuerza,
        forward.y * fuerza,
        forward.z * fuerza
      );

      proyectiles.push(cubo2);
      break;
  }
});

// Animación
function animar() {
    requestAnimationFrame(animar);
    mundo.step(1 / 60);

    //sky.rotation.y += 0.002;
   
    cubo.mesh.position.copy(cubo.body.position);
    cubo.mesh.quaternion.copy(cubo.body.quaternion);

    // cubo2.mesh.position.copy(cubo2.body.position);
    // cubo2.mesh.quaternion.copy(cubo2.body.quaternion);
   
    cajaRoja.mesh.position.copy(cajaRoja.body.position);
    cajaRoja.mesh.quaternion.copy(cajaRoja.body.quaternion);
    
    // camera.position.x = cubo.mesh.position.x + 5;
    // camera.position.y = cubo.mesh.position.y + 3;
    const distance = 5;
    camera.position.x = sky2.position.x + distance * Math.sin(sky2.rotation.y);
    camera.position.y = sky2.position.y + 3;
    camera.position.z = sky2.position.z + distance * Math.cos(sky2.rotation.y);
    camera.lookAt(sky2.position);

    for (const p of proyectiles) {
    p.mesh.position.copy(p.body.position);
    p.mesh.quaternion.copy(p.body.quaternion);
  }
    if (modelo) {
        modelo.rotation.y += 0.05;
    }

    playerBox.position.copy(playerBody.position);
playerBox.quaternion.copy(playerBody.quaternion);
    
    // Renderizar la escena
    renderer.render(scene, camera);
}
animar();

renderer.render(scene, camera);