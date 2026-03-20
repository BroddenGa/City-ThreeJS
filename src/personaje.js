import * as THREE from 'three';
import * as CANNON from 'cannon-es';
export class Personaje {
  constructor(camera, controls, scene, world = null) {
    this.camera = camera;
    this.controls = controls;
    this.scene = scene;
    this.world = world;
    this.velocidad = 15;
    this.fuerzaSalto = 5;
    this.factorVelocidadAire = 0.55;
    this.sensibilidadMouse = 0.005;
    this.radioCapsula = 0.15;
    this.cuerpoCapsula = 0.4;
    this.alturaPersonaje = this.cuerpoCapsula + this.radioCapsula * 2;
    this.alturaCamara = 1.2;
    this.distanciaCamara = 3.8;
    this.direccion = { adelante: false, atras: false, izquierda: false, derecha: false };
    this.anguloY = 0;
    this.pos = new THREE.Vector3(0, 0, 0);
    this.modo = false;
    this.mouseActivo = false;
    this.mouseUltimo = { x: 0 };
    this.visual = null;
    this.cuerpoFisico = null;
    this.enSuelo = false;
    this.normalContacto = new CANNON.Vec3();
    this._crearCuerpoFisico();
    this._crearVisual();
    this._initEventos();
  }

  _crearCuerpoFisico() {
    if (!this.world) return;

    this.cuerpoFisico = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(this.radioCapsula),
      position: new CANNON.Vec3(this.pos.x, this.radioCapsula, this.pos.z),
      fixedRotation: true,
      linearDamping: 0.35,
    });

    this.cuerpoFisico.updateMassProperties();
    this.world.addBody(this.cuerpoFisico);
  }

  _crearVisual() {
    if (!this.scene) return;
    const geometry = new THREE.CapsuleGeometry(this.radioCapsula, this.cuerpoCapsula, 8, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x5b8def });
    this.visual = new THREE.Mesh(geometry, material);
    this.scene.add(this.visual);
    this._actualizarVisual();
  }

  _actualizarVisual() {
    if (!this.visual) return;
    this.visual.position.set(this.pos.x, this.pos.y + this.alturaPersonaje * 0.5, this.pos.z);
    this.visual.rotation.y = this.anguloY;
  }

  activar() {
    this.modo = true;
    this.controls.enabled = false;
    this.mouseActivo = false;
    this.camera.position.copy(this.pos.clone().add(new THREE.Vector3(0, this.alturaCamara, this.distanciaCamara)));
    this.camera.lookAt(this.pos.clone().add(new THREE.Vector3(0, this.alturaPersonaje * 0.5, 0)));
  }

  desactivar() {
    this.modo = false;
    this.controls.enabled = true;
    this.mouseActivo = false;
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
        if (e.code === 'Space' && !e.repeat) this._intentarSaltar();
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

    window.addEventListener('mousemove', (e) => {
      if (!this.modo) return;

      if (!this.mouseActivo) {
        this.mouseActivo = true;
        this.mouseUltimo.x = e.clientX;
        return;
      }

      const deltaX = e.clientX - this.mouseUltimo.x;
      this.mouseUltimo.x = e.clientX;

      this.anguloY -= deltaX * this.sensibilidadMouse;
    });

    window.addEventListener('mouseleave', () => {
      this.mouseActivo = false;
    });
   

  }

  _actualizarEstadoSuelo() {
    if (!this.cuerpoFisico || !this.world) {
      this.enSuelo = this.pos.y <= 0.05;
      return;
    }

    this.enSuelo = false;

    for (const contacto of this.world.contacts) {
      if (contacto.bi !== this.cuerpoFisico && contacto.bj !== this.cuerpoFisico) continue;

      if (contacto.bi === this.cuerpoFisico) {
        contacto.ni.negate(this.normalContacto);
      } else {
        this.normalContacto.copy(contacto.ni);
      }

      if (this.normalContacto.y > 0.5) {
        this.enSuelo = true;
        break;
      }
    }
  }

  _intentarSaltar() {
    if (!this.cuerpoFisico || !this.enSuelo) return;
    this.cuerpoFisico.velocity.y = this.fuerzaSalto;
    this.enSuelo = false;
  }

  actualizar() {
    if (!this.modo) return;
    this._actualizarEstadoSuelo();

    let mov = new THREE.Vector3();
    if (this.direccion.adelante) mov.z -= 1;
    if (this.direccion.atras) mov.z += 1;
    if (this.direccion.izquierda) mov.x -= 1;
    if (this.direccion.derecha) mov.x += 1;
    if (mov.length() > 0) {
      mov.normalize();
      mov.applyAxisAngle(new THREE.Vector3(0,1,0), this.anguloY);

      if (this.cuerpoFisico) {
        const velocidadActual = this.enSuelo
          ? this.velocidad
          : this.velocidad * this.factorVelocidadAire;
        this.cuerpoFisico.velocity.x = mov.x * velocidadActual;
        this.cuerpoFisico.velocity.z = mov.z * velocidadActual;
      } else {
        this.pos.add(mov.multiplyScalar(this.velocidad));
      }
    } else if (this.cuerpoFisico) {
      this.cuerpoFisico.velocity.x = 0;
      this.cuerpoFisico.velocity.z = 0;
    }

    if (this.cuerpoFisico) {
      this.pos.set(
        this.cuerpoFisico.position.x,
        this.cuerpoFisico.position.y - this.radioCapsula,
        this.cuerpoFisico.position.z
      );

      if (this.pos.y < 0) {
        this.pos.y = 0;
      }
    }

    let camOffset = new THREE.Vector3(0, this.alturaCamara, this.distanciaCamara);
    camOffset.applyAxisAngle(new THREE.Vector3(0,1,0), this.anguloY);
    this.camera.position.copy(this.pos.clone().add(camOffset));
    this.camera.lookAt(this.pos.clone().add(new THREE.Vector3(0, this.alturaPersonaje * 0.5, 0)));
    this._actualizarVisual();
  }
}