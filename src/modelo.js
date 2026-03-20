import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Modelo {

  constructor(url, posicion = {x:0, y:0, z:0}, tamano = 1, scene, loader, world = null, rotacion = {x:0, y:0, z:0}) {
    this.url = url;
    this.posicion = posicion;
    this.tamano = tamano;
    this.rotacion = rotacion;
    this.objeto = null;
    this.scene = scene;
    this.loader = loader;
    this.world = world;
    this.cuerpoFisico = null;
    this.cargar();
  }

  cargar() {
    this.loader.load(
      this.url,
      (gltf) => {
        this.objeto = gltf.scene;
        this.objeto.position.set(this.posicion.x, this.posicion.y, this.posicion.z);
        this.objeto.rotation.set(this.rotacion.x, this.rotacion.y, this.rotacion.z);
        this.objeto.scale.set(this.tamano, this.tamano, this.tamano);
        this.scene.add(this.objeto);
        if (this.world) {
          this._crearColisionTrimesh();
        }
      },
      undefined,
      (error) => {
        console.error('Error cargando modelo:', this.url, error);
      }
    );
  }

  _crearColisionTrimesh() {
    this.objeto.updateWorldMatrix(true, true); //sirve para actualizar la matriz del objeto y sus hijos

    const body = new CANNON.Body({ mass: 0 }); // Cuerpo estático sin masa
    const tempPos = new THREE.Vector3(); // Vector temporal para almacenar la posición mundial de cada hijo
    const tempQuat = new THREE.Quaternion(); // Vector temporal para almacenar la rotación mundial de cada hijo
    const tempScale = new THREE.Vector3(); // Vector temporal para almacenar la escala mundial de cada hijo
    const worldMatrix = new THREE.Matrix4(); // Matriz temporal para componer la transformación mundial de cada hijo

    this.objeto.traverse((child) => { // Recorre el objeto y sus hijos
      if (!child.isMesh || !child.geometry || !child.geometry.attributes?.position) return;

      child.updateWorldMatrix(true, false); // Actualiza la matriz mundial del hijo
      child.matrixWorld.decompose(tempPos, tempQuat, tempScale); // Descompone la matriz mundial en posición, rotación y escala

      const geometry = child.geometry.clone(); // Clona la geometría para no modificar la original
      worldMatrix.compose(tempPos, tempQuat, tempScale); // Compone la matriz mundial con la posición, rotación y escala del hijo
      geometry.applyMatrix4(worldMatrix); // Aplica la transformación mundial a la geometría clonada

      const positionAttr = geometry.attributes.position; // Obtiene el atributo de posición de la geometría transformada
      const vertices = Array.from(positionAttr.array); // Convierte el atributo de posición a un array de vértices
      let indices = [];

      if (geometry.index) { // Si la geometría tiene índices, los utiliza para definir las caras del Trimesh
        indices = Array.from(geometry.index.array);
      } else {
        indices = [...Array(positionAttr.count).keys()];
      }

      if (vertices.length >= 9 && indices.length >= 3) { // Verifica que haya al menos 3 vértices para formar un triángulo
        const shape = new CANNON.Trimesh(vertices, indices);
        body.addShape(shape);
      }
    });

    if (body.shapes.length > 0) { // Si se agregaron formas al cuerpo, lo añade al mundo de física
      this.world.addBody(body);
      this.cuerpoFisico = body;
    }
  }
}