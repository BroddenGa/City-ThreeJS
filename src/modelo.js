import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Modelo {
  /**
   * @param {string} url - Ruta del modelo GLTF
   * @param {object} posicion - {x, y, z} posición en el plano
   * @param {number} tamano - Escala uniforme del modelo
   * @param {THREE.Scene} scene - Escena de Three.js
   * @param {GLTFLoader} loader - Loader de GLTF
   */
  constructor(url, posicion = {x:0, y:0, z:0}, tamano = 1, scene, loader) {
    this.url = url;
    this.posicion = posicion;
    this.tamano = tamano;
    this.objeto = null;
    this.scene = scene;
    this.loader = loader;
    this.cargar();
  }

  cargar() {
    this.loader.load(
      this.url,
      (gltf) => {
        this.objeto = gltf.scene;
        this.objeto.position.set(this.posicion.x, this.posicion.y, this.posicion.z);
        this.objeto.scale.set(this.tamano, this.tamano, this.tamano);
        this.scene.add(this.objeto);
      },
      undefined,
      (error) => {
        console.error('Error cargando modelo:', this.url, error);
      }
    );
  }
}