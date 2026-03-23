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
      alturaSuelo: 0,
      offsetVisualSuelo: 0.16,
      distanciaDeteccionSuelo: 0.08,
      tiempoGraciaSalto: 0.12,
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
      ultimoTiempoEnSuelo: 0,
      normalContacto: new CANNON.Vec3(),
      _rayDesde: new CANNON.Vec3(),
      _rayHasta: new CANNON.Vec3(),
      _rayResultado: new CANNON.RaycastResult(),
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
    this.visual.visible = false;
    this.scene.add(this.visual);
    this._actualizarVisual();
  }

  _actualizarVisual() {
    if (this.visual)
      this.visual.position.set(
        this.pos.x,
        this.pos.y + this.alturaPersonaje * 0.5 + this.offsetVisualSuelo,
        this.pos.z,
      );
  }

  activar() {
    this.modo = true;
    this.controls.enabled = false;
    this.mouseActivo = false;
    document.body.style.cursor = "none";
    if (document.pointerLockElement !== document.body) {
      document.body.requestPointerLock?.();
    }
    if (this.visual) this.visual.visible = true;
    if (this.cuerpoFisico) {
      this.cuerpoFisico.velocity.set(0, 0, 0);
      this.cuerpoFisico.angularVelocity.set(0, 0, 0);
      const yMin = this.alturaSuelo + this.radioCapsula;
      if (this.cuerpoFisico.position.y < yMin) {
        this.cuerpoFisico.position.y = yMin;
      }
    }
    this._actualizarCamara();
  }
  desactivar() {
    this.modo = false;
    this.controls.enabled = true;
    this.mouseActivo = false;
    document.body.style.cursor = "";
    if (document.pointerLockElement === document.body) {
      document.exitPointerLock?.();
    }
    if (this.visual) this.visual.visible = false;
    if (this.cuerpoFisico) {
      this.cuerpoFisico.velocity.set(0, 0, 0);
      this.cuerpoFisico.angularVelocity.set(0, 0, 0);
    }
  }

  _initEventos() {
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "v")
        return this.modo ? this.desactivar() : this.activar();
      if (!this.modo) return;
      const dir = TECLA_DIRECCION[e.key.toLowerCase()];
      if (dir) this.direccion[dir] = true;
      if (e.code === "Space" && !e.repeat && this.cuerpoFisico && this._puedeSaltar()) {
        this.cuerpoFisico.velocity.y = this.fuerzaSalto;
        this.enSuelo = false;
      }
    });
    window.addEventListener("keyup", (e) => {
      if (this.modo) {
        const dir = TECLA_DIRECCION[e.key.toLowerCase()];
        if (dir) this.direccion[dir] = false;
      }
    });
    window.addEventListener("mousemove", (e) => {
      if (!this.modo) return;
      if (document.pointerLockElement === document.body) {
        this.anguloY -= e.movementX * this.sensibilidadMouse;
        return;
      }
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
    window.addEventListener("click", () => {
      if (this.modo && document.pointerLockElement !== document.body) {
        document.body.requestPointerLock?.();
      }
    });
  }

  _actualizarEstadoSuelo() {
    if (!this.cuerpoFisico || !this.world) {
      this.enSuelo = this.pos.y <= 0.05;
      return;
    }

    this.enSuelo = false;

    this._rayDesde.copy(this.cuerpoFisico.position);
    this._rayHasta.set(
      this.cuerpoFisico.position.x,
      this.cuerpoFisico.position.y -
        (this.radioCapsula + this.distanciaDeteccionSuelo + 0.02),
      this.cuerpoFisico.position.z,
    );
    this._rayResultado.reset();

    const hit = this.world.raycastClosest(
      this._rayDesde,
      this._rayHasta,
      { skipBackfaces: true },
      this._rayResultado,
    );

    if (hit) {
      const distancia = this._rayDesde.distanceTo(this._rayResultado.hitPointWorld);
      const normalY = this._rayResultado.hitNormalWorld.y;
      this.enSuelo =
        normalY > 0.45 &&
        distancia <= this.radioCapsula + this.distanciaDeteccionSuelo;
    }

    if (this.enSuelo) {
      this.ultimoTiempoEnSuelo = performance.now() / 1000;
    }
  }

  _puedeSaltar() {
    if (this.enSuelo) return true;
    const ahora = performance.now() / 1000;
    return ahora - this.ultimoTiempoEnSuelo <= this.tiempoGraciaSalto;
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
        this.pos.y + this.alturaPersonaje * 0.5 + this.offsetVisualSuelo,
        this.pos.z,
      ),
    );
  }

  actualizar(delta = 1 / 60) {
    if (!this.modo) {
      if (this.cuerpoFisico) {
        this.pos.set(
          this.cuerpoFisico.position.x,
          Math.max(this.alturaSuelo, this.cuerpoFisico.position.y - this.radioCapsula),
          this.cuerpoFisico.position.z,
        );
      }
      this._limitarAlPlano();
      this._actualizarVisual();
      return;
    }
    this._actualizarEstadoSuelo();

    const mov = this._mov.set(0, 0, 0);
    if (this.direccion.adelante) mov.z -= 1;
    if (this.direccion.atras) mov.z += 1;
    if (this.direccion.izquierda) mov.x -= 1;
    if (this.direccion.derecha) mov.x += 1;

    if (mov.lengthSq() > 0) {
      mov.normalize().applyAxisAngle(EJE_Y, this.anguloY);
      if (this.cuerpoFisico) {
        const velObjetivo = this.enSuelo
          ? this.velocidad
          : this.velocidad * this.factorVelocidadAire;
        const dtSeguro = Math.max(1 / 240, delta);
        const velMaxSegura = (this.radioCapsula * 2.6) / dtSeguro;
        const vel = Math.min(velObjetivo, velMaxSegura);
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
      const yMin = this.alturaSuelo + this.radioCapsula;
      if (this.cuerpoFisico.position.y < yMin) {
        this.cuerpoFisico.position.y = yMin;
        if (this.cuerpoFisico.velocity.y < 0) this.cuerpoFisico.velocity.y = 0;
      }
      this.pos.set(
        this.cuerpoFisico.position.x,
        Math.max(this.alturaSuelo, this.cuerpoFisico.position.y - this.radioCapsula),
        this.cuerpoFisico.position.z,
      );
    }

    this._limitarAlPlano();
    this._actualizarCamara();
    this._actualizarVisual();
  }
}
