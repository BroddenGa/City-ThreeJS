import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfe8ff);

const camera = new THREE.PerspectiveCamera(
	60,
	window.innerWidth / window.innerHeight,
	0.1,
	500
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xffffff, 0x8fa88f, 0.8);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(16, 20, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.bias = -0.00015;
sun.shadow.normalBias = 0.025;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 70;
scene.add(sun);
scene.add(sun.target);

const sueloGeo = new THREE.PlaneGeometry(180, 180);
const sueloMat = new THREE.MeshStandardMaterial({ color: 0x3f9d52 });
const suelo = new THREE.Mesh(sueloGeo, sueloMat);
suelo.rotation.x = -Math.PI * 0.5;
suelo.position.y = -0.01;
suelo.receiveShadow = true;
scene.add(suelo);

const loader = new GLTFLoader();
const clock = new THREE.Clock();
const teclas = { w: false, a: false, s: false, d: false, espacio: false };

const velocidad = 3.6;
const gravedad = 13;
const fuerzaSalto = 5.2;
const offsetCamaraTP = new THREE.Vector3(0, 1.8, 3.4);
const tamanoSombra = 14;
const sueloY = 0;

let personaje = null;
let camaraYaw = 0;
let arrastrando = false;
let mouseXPrev = 0;
let mixer = null;
const acciones = { idle: null, walk: null, jump: null };
let accionActual = null;
let velocidadVertical = 0;
let enSuelo = true;

function reproducirAccion(nombre, fade = 0.2) {
	const siguiente = acciones[nombre] || acciones.idle;
	if (!siguiente || accionActual === siguiente) return;
	if (accionActual) accionActual.fadeOut(fade);
	siguiente.reset().fadeIn(fade).play();
	accionActual = siguiente;
}

function seleccionarClip(animations, opciones) {
	return (
		animations.find((clip) => {
			const nombre = clip.name.toLowerCase();
			return opciones.some((op) => nombre.includes(op));
		}) || null
	);
}

function cargarPersonaje() {
	loader.load(
		"/models/characters/gltf/Skeleton_Mage.glb",
		(gltf) => {
			const modelo = gltf.scene;

			const bbox = new THREE.Box3().setFromObject(modelo);
			const size = new THREE.Vector3();
			bbox.getSize(size);
			const alturaObjetivo = 1.5;
			const escalaAuto = size.y > 0 ? alturaObjetivo / size.y : 0.01;
			modelo.scale.setScalar(escalaAuto);
			modelo.position.set(0, 0, 0);

			const bboxEscalado = new THREE.Box3().setFromObject(modelo);
			modelo.position.y -= bboxEscalado.min.y;

			modelo.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});

			scene.add(modelo);
			personaje = modelo;
			camaraYaw = personaje.rotation.y;

			if (gltf.animations && gltf.animations.length > 0) {
				mixer = new THREE.AnimationMixer(personaje);
				const clipIdle =
					seleccionarClip(gltf.animations, ["idle", "stand", "wait", "breath"]) ||
					gltf.animations[0];
				const clipWalk =
					seleccionarClip(gltf.animations, ["walk", "run", "jog", "move"]) ||
					gltf.animations[1] ||
					clipIdle;
 				const clipJump = seleccionarClip(gltf.animations, ["jump", "leap", "hop", "air"]);

				acciones.idle = mixer.clipAction(clipIdle);
				acciones.walk = mixer.clipAction(clipWalk);
				if (clipJump) {
					acciones.jump = mixer.clipAction(clipJump);
					acciones.jump.setLoop(THREE.LoopOnce, 1);
					acciones.jump.clampWhenFinished = true;
				}
				reproducirAccion("idle", 0);
			} else {
				console.warn("El modelo no trae clips embebidos. Se mostrara sin animacion.");
			}

			actualizarCamara(1);
		},
		undefined,
		(error) => {
			console.error("No se pudo cargar el personaje", error);
		}
	);
}

function actualizarCamara(suavizado) {
	if (!personaje) return;

	const posicionDeseada = new THREE.Vector3(
		personaje.position.x + Math.sin(camaraYaw) * offsetCamaraTP.z,
		personaje.position.y + offsetCamaraTP.y,
		personaje.position.z + Math.cos(camaraYaw) * offsetCamaraTP.z
	);

	camera.position.lerp(posicionDeseada, suavizado);
	camera.lookAt(
		personaje.position.x,
		personaje.position.y + 0.9,
		personaje.position.z
	);
}

function actualizarSombraSol() {
	if (!personaje) return;

	sun.target.position.set(personaje.position.x, 0, personaje.position.z);

	sun.shadow.camera.left = -tamanoSombra;
	sun.shadow.camera.right = tamanoSombra;
	sun.shadow.camera.top = tamanoSombra;
	sun.shadow.camera.bottom = -tamanoSombra;
	sun.shadow.camera.position.x = personaje.position.x;
	sun.shadow.camera.position.z = personaje.position.z;
	sun.shadow.camera.updateProjectionMatrix();
}

document.addEventListener("keydown", (event) => {
	if (event.key === "w" || event.key === "W") teclas.w = true;
	if (event.key === "a" || event.key === "A") teclas.a = true;
	if (event.key === "s" || event.key === "S") teclas.s = true;
	if (event.key === "d" || event.key === "D") teclas.d = true;
	if (event.code === "Space") {
		event.preventDefault();
		teclas.espacio = true;
		if (!event.repeat && personaje && enSuelo) {
			velocidadVertical = fuerzaSalto;
			enSuelo = false;
			if (acciones.jump) reproducirAccion("jump", 0.08);
		}
	}
});

document.addEventListener("keyup", (event) => {
	if (event.key === "w" || event.key === "W") teclas.w = false;
	if (event.key === "a" || event.key === "A") teclas.a = false;
	if (event.key === "s" || event.key === "S") teclas.s = false;
	if (event.key === "d" || event.key === "D") teclas.d = false;
	if (event.code === "Space") teclas.espacio = false;
});

renderer.domElement.addEventListener("mousedown", (e) => {
	if (e.button === 0 || e.button === 2) {
		arrastrando = true;
		mouseXPrev = e.clientX;
	}
});

window.addEventListener("mouseup", () => {
	arrastrando = false;
});

window.addEventListener("mousemove", (e) => {
	if (!arrastrando) return;
	camaraYaw += (e.clientX - mouseXPrev) * 0.007;
	mouseXPrev = e.clientX;
});

renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());

window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

const direccion = new THREE.Vector3();
const frente = new THREE.Vector3();
const derecha = new THREE.Vector3();
function actualizarPersonaje(delta) {
	if (!personaje) return;

	frente.set(-Math.sin(camaraYaw), 0, -Math.cos(camaraYaw));
	derecha.set(Math.cos(camaraYaw), 0, -Math.sin(camaraYaw));

	direccion.set(0, 0, 0);
	if (teclas.w) direccion.add(frente);
	if (teclas.s) direccion.sub(frente);
	if (teclas.a) direccion.sub(derecha);
	if (teclas.d) direccion.add(derecha);

	let moviendose = false;
	if (direccion.lengthSq() > 0) {
		direccion.normalize().multiplyScalar(velocidad * delta);
		personaje.position.x += direccion.x;
		personaje.position.z += direccion.z;
		moviendose = true;

		const rotObjetivo = Math.atan2(direccion.x, direccion.z);
		personaje.rotation.y = THREE.MathUtils.lerp(
			personaje.rotation.y,
			rotObjetivo,
			Math.min(1, 12 * delta)
		);
	}

	velocidadVertical -= gravedad * delta;
	personaje.position.y += velocidadVertical * delta;
	if (personaje.position.y <= sueloY) {
		personaje.position.y = sueloY;
		velocidadVertical = 0;
		enSuelo = true;
	} else {
		enSuelo = false;
	}

	if (!enSuelo && acciones.jump) {
		reproducirAccion("jump", 0.08);
	} else {
		reproducirAccion(moviendose ? "walk" : "idle", 0.12);
	}
}

function animar() {
	requestAnimationFrame(animar);
	const delta = clock.getDelta();
	if (mixer) mixer.update(delta);

	actualizarPersonaje(delta);
	actualizarCamara(0.12);
	actualizarSombraSol();

	renderer.render(scene, camera);
}

cargarPersonaje();
animar();