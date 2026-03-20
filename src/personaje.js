import * as THREE from "three";
import * as CANNON from "cannon-es";

const TECLA_DIRECCION = {
  w: "adelante",
  s: "atras",
  a: "izquierda",
  d: "derecha",
};
const EJE_Y = new THREE.Vector3(0, 1, 0);

export class Personaje {
  constructor(camera, controls, scene, world = null) {
    Object.assign(this, {
      camera,
      controls,
      scene,
      world,
      velocidad: 15,
      fuerzaSalto: 5,
      factorVelocidadAire: 0.55,
      sensibilidadMouse: 0.005,
      radioCapsula: 0.15,
      cuerpoCapsula: 0.4,
      alturaPersonaje: 0.7,
      alturaCamara: 1.2,
      distanciaCamara: 3.8,
      direccion: {
        adelante: false,
        atras: false,
        izquierda: false,
        derecha: false,
      },
      anguloY: 0,
      pos: new THREE.Vector3(8, 2, 0),
      modo: false,
      mouseActivo: false,
      mouseUltimoX: 0,
      visual: null,
      cuerpoFisico: null,
      enSuelo: false,
      normalContacto: new CANNON.Vec3(),
      _mov: new THREE.Vector3(),
      _camOffset: new THREE.Vector3(),
      _lookAt: new THREE.Vector3(),
    });

    this.limitesPlano = {
      minX: -2.5 - 55 / 2 + this.radioCapsula,
      maxX: -2.5 + 55 / 2 - this.radioCapsula,
      minZ: -60 / 2 + this.radioCapsula,
      maxZ: 60 / 2 - this.radioCapsula,
    };

    this._crearCuerpoFisico();
    this._crearVisual();
    this._initEventos();
  }

  _crearCuerpoFisico() {
    if (!this.world) return;
    this.cuerpoFisico = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(this.radioCapsula),
      position: new CANNON.Vec3(
        this.pos.x,
        this.pos.y + this.radioCapsula,
        this.pos.z,
      ),
      fixedRotation: true,
      linearDamping: 0.35,
    });
    this.cuerpoFisico.updateMassProperties();
    this.world.addBody(this.cuerpoFisico);
  }

  _crearVisual() {
    if (!this.scene) return;
    this.visual = new THREE.Mesh(
      new THREE.CapsuleGeometry(this.radioCapsula, this.cuerpoCapsula, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x5b8def }),
    );
    this.scene.add(this.visual);
    this._actualizarVisual();
  }

  _actualizarVisual() {
    if (this.visual)
      this.visual.position.set(
        this.pos.x,
        this.pos.y + this.alturaPersonaje * 0.5,
        this.pos.z,
      );
  }

  activar() {
    this.modo = true;
    this.controls.enabled = false;
    this.mouseActivo = false;
    this._actualizarCamara();
  }
  desactivar() {
    this.modo = false;
    this.controls.enabled = true;
    this.mouseActivo = false;
  }

  _initEventos() {
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "v")
        return this.modo ? this.desactivar() : this.activar();
      if (!this.modo) return;
      const dir = TECLA_DIRECCION[e.key.toLowerCase()];
      if (dir) this.direccion[dir] = true;
      if (e.code === "Space" && !e.repeat && this.cuerpoFisico && this.enSuelo)
        this.cuerpoFisico.velocity.y = this.fuerzaSalto;
    });
    window.addEventListener("keyup", (e) => {
      if (this.modo) {
        const dir = TECLA_DIRECCION[e.key.toLowerCase()];
        if (dir) this.direccion[dir] = false;
      }
    });
    window.addEventListener("mousemove", (e) => {
      if (!this.modo) return;
      if (!this.mouseActivo) {
        this.mouseActivo = true;
        this.mouseUltimoX = e.clientX;
        return;
      }
      this.anguloY -= (e.clientX - this.mouseUltimoX) * this.sensibilidadMouse;
      this.mouseUltimoX = e.clientX;
    });
    window.addEventListener("mouseleave", () => {
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
      if (
        contacto.bi !== this.cuerpoFisico &&
        contacto.bj !== this.cuerpoFisico
      )
        continue;
      contacto.bi === this.cuerpoFisico
        ? contacto.ni.negate(this.normalContacto)
        : this.normalContacto.copy(contacto.ni);
      if (this.normalContacto.y > 0.5) {
        this.enSuelo = true;
        break;
      }
    }
  }

  _limitarAlPlano() {
    const { minX, maxX, minZ, maxZ } = this.limitesPlano;
    if (this.cuerpoFisico) {
      const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
      const x = clamp(this.cuerpoFisico.position.x, minX, maxX);
      const z = clamp(this.cuerpoFisico.position.z, minZ, maxZ);
      if (x !== this.cuerpoFisico.position.x) this.cuerpoFisico.velocity.x = 0;
      if (z !== this.cuerpoFisico.position.z) this.cuerpoFisico.velocity.z = 0;
      this.cuerpoFisico.position.x = x;
      this.cuerpoFisico.position.z = z;
      this.pos.x = x;
      this.pos.z = z;
    } else {
      this.pos.x = Math.min(maxX, Math.max(minX, this.pos.x));
      this.pos.z = Math.min(maxZ, Math.max(minZ, this.pos.z));
    }
  }

  _actualizarCamara() {
    this._camOffset
      .set(0, this.alturaCamara, this.distanciaCamara)
      .applyAxisAngle(EJE_Y, this.anguloY);
    this.camera.position.copy(this.pos).add(this._camOffset);
    this.camera.lookAt(
      this._lookAt.set(
        this.pos.x,
        this.pos.y + this.alturaPersonaje * 0.5,
        this.pos.z,
      ),
    );
  }

  actualizar() {
    if (!this.modo) return;
    this._actualizarEstadoSuelo();

    const mov = this._mov.set(0, 0, 0);
    if (this.direccion.adelante) mov.z -= 1;
    if (this.direccion.atras) mov.z += 1;
    if (this.direccion.izquierda) mov.x -= 1;
    if (this.direccion.derecha) mov.x += 1;

    if (mov.lengthSq() > 0) {
      mov.normalize().applyAxisAngle(EJE_Y, this.anguloY);
      if (this.cuerpoFisico) {
        const vel = this.enSuelo
          ? this.velocidad
          : this.velocidad * this.factorVelocidadAire;
        this.cuerpoFisico.velocity.x = mov.x * vel;
        this.cuerpoFisico.velocity.z = mov.z * vel;
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
        Math.max(0, this.cuerpoFisico.position.y - this.radioCapsula),
        this.cuerpoFisico.position.z,
      );
    }

    this._limitarAlPlano();
    this._actualizarCamara();
    this._actualizarVisual();
  }
}
