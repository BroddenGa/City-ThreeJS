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
    this.hitboxVisual = null;
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
    this.objeto.updateWorldMatrix(true, true);

    const body = new CANNON.Body({ mass: 0 });
    const hitboxGroup = new THREE.Group();
    const tempPos = new THREE.Vector3();
    const tempQuat = new THREE.Quaternion();
    const tempScale = new THREE.Vector3();
    const worldMatrix = new THREE.Matrix4();
    const hitboxMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
      depthTest: false,
    });

    this.objeto.traverse((child) => {
      if (!child.isMesh || !child.geometry || !child.geometry.attributes?.position) return;

      child.updateWorldMatrix(true, false);
      child.matrixWorld.decompose(tempPos, tempQuat, tempScale);

      const geometry = child.geometry.clone();
      worldMatrix.compose(tempPos, tempQuat, tempScale);
      geometry.applyMatrix4(worldMatrix);

      const positionAttr = geometry.attributes.position;
      const vertices = Array.from(positionAttr.array);
      let indices = [];

      if (geometry.index) {
        indices = Array.from(geometry.index.array);
      } else {
        indices = [...Array(positionAttr.count).keys()];
      }

      if (vertices.length >= 9 && indices.length >= 3) {
        const shape = new CANNON.Trimesh(vertices, indices);
        body.addShape(shape);

        const hitboxMesh = new THREE.Mesh(geometry, hitboxMaterial);
        hitboxMesh.renderOrder = 999;
        hitboxGroup.add(hitboxMesh);
      }
    });

    if (body.shapes.length > 0) {
      this.world.addBody(body);
      this.cuerpoFisico = body;

      this.hitboxVisual = hitboxGroup;
      this.scene.add(this.hitboxVisual);
    }
  }
}