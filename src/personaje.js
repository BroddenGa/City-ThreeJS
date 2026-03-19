import * as THREE from 'three';
export class Personaje {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.velocidad = 0.3;
    this.direccion = { adelante: false, atras: false, izquierda: false, derecha: false };
    this.anguloY = 0;
    this.anguloX = 0.2;
    this.pos = new THREE.Vector3(0, 0, 0);
    this.modo = false;
    this.mouseActivo = false;
    this.mouseUltimo = {x: 0, y: 0};
    this._initEventos();
  }

  activar() {
    this.modo = true;
    this.controls.enabled = false;
    this.camera.position.copy(this.pos.clone().add(new THREE.Vector3(0, 2, 5)));
    this.camera.lookAt(this.pos);
  }

  desactivar() {
    this.modo = false;
    this.controls.enabled = true;
  }

  _initEventos() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'v' || e.key === 'V') {
        if (!this.modo) {
          this.activar();
        } else {
          this.desactivar();
        }
      }
      if (this.modo) {
        if (e.key === 'w' || e.key === 'W') this.direccion.adelante = true;
        if (e.key === 's' || e.key === 'S') this.direccion.atras = true;
        if (e.key === 'a' || e.key === 'A') this.direccion.izquierda = true;
        if (e.key === 'd' || e.key === 'D') this.direccion.derecha = true;
        if (e.key === 'ArrowLeft') this.anguloY += 0.07;
        if (e.key === 'ArrowRight') this.anguloY -= 0.07;
      }
    });
    window.addEventListener('keyup', (e) => {
      if (this.modo) {
        if (e.key === 'w' || e.key === 'W') this.direccion.adelante = false;
        if (e.key === 's' || e.key === 'S') this.direccion.atras = false;
        if (e.key === 'a' || e.key === 'A') this.direccion.izquierda = false;
        if (e.key === 'd' || e.key === 'D') this.direccion.derecha = false;
      }
    });
    
  }

  actualizar() {
    if (!this.modo) return;
    let mov = new THREE.Vector3();
    if (this.direccion.adelante) mov.z -= 1;
    if (this.direccion.atras) mov.z += 1;
    if (this.direccion.izquierda) mov.x -= 1;
    if (this.direccion.derecha) mov.x += 1;
    if (mov.length() > 0) {
      mov.normalize();
      mov.applyAxisAngle(new THREE.Vector3(0,1,0), this.anguloY);
      this.pos.add(mov.multiplyScalar(this.velocidad));
    }
    // Offset de cámara en modo personaje (vista en tercera persona)
    let camOffset = new THREE.Vector3(0, 2, 5);
    camOffset.applyAxisAngle(new THREE.Vector3(1,0,0), this.anguloX);
    camOffset.applyAxisAngle(new THREE.Vector3(0,1,0), this.anguloY);
    this.camera.position.copy(this.pos.clone().add(camOffset));
    this.camera.lookAt(this.pos);
  }
}