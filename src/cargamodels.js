import { Modelo } from './modelo.js';
import { assets } from './assets.js';

let sceneRef = null;
let loaderRef = null;
let worldRef = null;

function obtenerContexto() {
  if (!sceneRef || !loaderRef) {
    throw new Error('cargamodels: falta configurar scene/loader con configurarCargaModelos');
  }
  return { scene: sceneRef, loader: loaderRef, world: worldRef };
}

function crearModelo(url, posicion, tamano, rotacion) {
  const { scene, loader, world } = obtenerContexto();
  return new Modelo(url, posicion, tamano, scene, loader, world, rotacion);
}

export function configurarCargaModelos({ scene, loader, world = null }) {
  sceneRef = scene;
  loaderRef = loader;
  worldRef = world;
}

function modeledificio(x,y,z,f,r,n,giro180){
  for (let i = 0; i < f; i++) {
    crearModelo(
      assets.buildings[i],
      {x: i*5+x, y: y, z: z},
      2.5,
      r ? {x: 0, y: giro180 ? Math.PI : Math.PI / (n?2:-2), z: 0} : undefined,
    );
  }
}
function modeloCallePeatonal(x,y,z){
    crearModelo(assets.roads[4], {x: x, y: y, z:5+z}, 2.5);
}
function modeloCallex(x,y,z,f,a,r,n,giro180 ){
  for(let i = 0; i < f; i++){
    crearModelo(
      assets.roads[a],
      {x: i*5+x, y: y, z:5+z},
      2.5,
      r ? {x: 0, y: giro180 ? Math.PI : Math.PI / (n?2:-2), z: 0} : undefined,
    );
  }
}
function modeloCalley(x,y,z,f,a,r,n,giro180){
  for(let i = 0; i < f; i++){
    crearModelo(
      assets.roads[a],
      {x: x, y: y, z:i*5+5+z},
      2.5,
      r ? {x: 0, y: giro180 ? Math.PI : Math.PI / (n?2:-2), z: 0} : undefined,
    );
  }
}

export { modeledificio, modeloCallePeatonal, modeloCallex, modeloCalley };