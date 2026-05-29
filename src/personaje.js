import * as THREE from "three";
import * as CANNON from "cannon-es";

const TECLA_DIRECCION = {
  w: "adelante",
  s: "atras",
  a: "izquierda",
  d: "derecha",
};
const EJE_Y = new THREE.Vector3(0, 1, 0);
const VELOCIDAD_BASE = 10;
const DASH_TIEMPO_RECARGA = 2.0;
const DASH_VELOCIDAD = 28;

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Personaje {
  constructor(camera, controls, scene, world = null) {
    Object.assign(this, {
      camera,
      controls,
      scene,
      world,
      lockTarget: controls?.domElement ?? document.body,
      velocidad: VELOCIDAD_BASE,
      fuerzaSalto: 5,
      factorVelocidadAire: 0.85,
      sensibilidadMouse: 0.002,
      radioCapsula: 0.15,
      cuerpoCapsula: 0.4,
      alturaPersonaje: 0.7,
      alturaCamara: 1.2,
      distanciaCamara: 3.8,
      alturaSuelo: 0,
      offsetVisualSuelo: 0.16,
      distanciaDeteccionSuelo: 0.12,
      tiempoGraciaSalto: 0.12,
      direccion: {
        adelante: false,
        atras: false,
        izquierda: false,
        derecha: false,
      },
      anguloY: 0,
      anguloX: 0,
      pos: new THREE.Vector3(8, 2, 0),
      modo: false,
      entradaBloqueada: false,
      mouseActivo: false,
      mouseUltimoX: 0,
      mouseUltimoY: 0,
      visual: null,
      cuerpoFisico: null,
      enSuelo: false,
      ultimoTiempoEnSuelo: 0,
      normalContacto: new CANNON.Vec3(),
      _rayDesde: new CANNON.Vec3(),
      _rayHasta: new CANNON.Vec3(),
      _rayResultado: new CANNON.RaycastResult(),
      _sueloValido: false,
      _contactPoint: new CANNON.Vec3(),
      _mov: new THREE.Vector3(),
      _inputDir: new THREE.Vector3(),
      _camOffset: new THREE.Vector3(),
      _lookAt: new THREE.Vector3(),
      _camEuler: new THREE.Euler(0, 0, 0, "YXZ"),
      _enPared: false,
      _tocandoMuro: false,
      _normalPared: new THREE.Vector3(),
      _rayParedDesde: new CANNON.Vec3(),
      _rayParedHasta: new CANNON.Vec3(),
      _rayParedResultado: new CANNON.RaycastResult(),
      _saltosMax: 1,
      _saltosRestantes: 1,
      _dashCooldown: 0,
      _dashTiempoRecarga: DASH_TIEMPO_RECARGA,
      _dashVel: DASH_VELOCIDAD,
      _fovBase: 70,
      _fovDash: 0,
      _velocidadCaidaPared: -2,
      _aceleracion: 60,
      _aceleracionAire: 40,
      _pitchMax: 1.45,
      _recargaContacto: false,
      _recargaTimmer: 0,
      reglasRecargaSuelo: null,
    });

    this.limitesPlano = {
      minX: -2.5 - 55 / 2 + this.radioCapsula,
      maxX: -2.5 + 55 / 2 - this.radioCapsula,
      minZ: -60 / 2 + this.radioCapsula,
      maxZ: 60 / 2 - this.radioCapsula,
    };

    if (this.lockTarget?.tabIndex < 0) this.lockTarget.tabIndex = 0;
    this._crearCuerpoFisico();
    this._cargarModeloVisual();
    this._initEventos();
  }

  _crearCuerpoFisico() {
    if (!this.world) return;
    this.cuerpoFisico = new CANNON.Body({
      mass: 1,
      material: this.world.playerMaterial,
      shape: new CANNON.Sphere(this.radioCapsula),
      position: new CANNON.Vec3(
        this.pos.x,
        this.pos.y + this.radioCapsula,
        this.pos.z,
      ),
      fixedRotation: true,
      linearDamping: 0.15,
    });
    const groups = this.world.collisionGroups;
    if (groups) {
      this.cuerpoFisico.collisionFilterGroup = groups.player;
      this.cuerpoFisico.collisionFilterMask = groups.ground | groups.wall;
    }
    this.cuerpoFisico.ccdSpeedThreshold = 6;
    this.cuerpoFisico.ccdIterations = 10;
    this.cuerpoFisico.updateMassProperties();
    this.world.addBody(this.cuerpoFisico);
  }

  _cargarModeloVisual() {
    if (!this.scene) return;
    const loader = new GLTFLoader();
    loader.load(
      '/models/characters/gltf/Skeleton_Mage.glb',
      (gltf) => {
        this.visual = gltf.scene;
        this.visual.visible = false;
        // Ajusta la escala si es necesario
        this.visual.scale.set(0.2, 0.2, 0.2);
        this.scene.add(this.visual);
        this._actualizarVisual();
      },
      undefined,
      (error) => {
        console.error('Error cargando modelo GLB del personaje:', error);
      }
    );
  }

  _actualizarVisual() {
    if (this.visual) {
      this.visual.position.set(
        this.pos.x,
        this.pos.y + this.alturaPersonaje * 0.5 + this.offsetVisualSuelo - 0.2,
        this.pos.z,
      );

      // Calcular la dirección de movimiento real (WASD)
      let movX = 0, movZ = 0;
      if (this.direccion.adelante) movZ -= 1;
      if (this.direccion.atras) movZ += 1;
      if (this.direccion.izquierda) movX -= 1;
      if (this.direccion.derecha) movX += 1;
      if (movX !== 0 || movZ !== 0) {
        // Aplica la rotación de cámara al vector de movimiento
        const dir = new THREE.Vector3(movX, 0, movZ).normalize().applyAxisAngle(EJE_Y, this.anguloY);
        // El ángulo hacia donde se mueve
        const anguloMovimiento = Math.atan2(dir.x, dir.z);
        this.visual.rotation.y = anguloMovimiento;
      }
    }
  }

  _mouseEstaBloqueado() {
    return document.pointerLockElement === this.lockTarget;
  }

  _actualizarCursorMouse() {
    const cursor = this.modo && this._mouseEstaBloqueado() ? "none" : "";
    document.body.style.cursor = cursor;
    if (this.lockTarget?.style) this.lockTarget.style.cursor = cursor;
  }

  _solicitarBloqueoMouse() {
    if (this.entradaBloqueada || !this.modo || this._mouseEstaBloqueado()) return;
    if (!this.lockTarget?.requestPointerLock) return;
    this.lockTarget.focus?.({ preventScroll: true });
    try {
      const bloqueo = this.lockTarget.requestPointerLock();
      bloqueo?.catch?.(() => {
        this.mouseActivo = false;
        this._actualizarCursorMouse();
      });
    } catch {
      this.mouseActivo = false;
      this._actualizarCursorMouse();
    }
  }

  activar({ skipPointerLock = false } = {}) {
    if (this.entradaBloqueada) return;
    this.modo = true;
    this.controls.enabled = false;
    this.mouseActivo = false;
    this._resetDirecciones();
    this._actualizarCursorMouse();
    if (!skipPointerLock) this._solicitarBloqueoMouse();
    if (this.visual) this.visual.visible = this.distanciaCamara > 0.01;
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
    this._resetDirecciones();
    if (document.pointerLockElement === this.lockTarget) {
      document.exitPointerLock?.();
    }
    this._actualizarCursorMouse();
    if (this.visual) this.visual.visible = false;
    if (this.cuerpoFisico) {
      this.cuerpoFisico.velocity.set(0, 0, 0);
      this.cuerpoFisico.angularVelocity.set(0, 0, 0);
    }
  }

  _initEventos() {
    window.addEventListener("keydown", (e) => {
      if (this.entradaBloqueada) {
        this._resetDirecciones();
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "v")
        return this.modo ? this.desactivar() : this.activar();
      if (!this.modo) return;
      this._solicitarBloqueoMouse();
      const dir = TECLA_DIRECCION[key];
      if (dir) this.direccion[dir] = true;
      if (e.code === "Space" && !e.repeat && this.cuerpoFisico) {
        if (this._puedeSaltar()) {
          this.cuerpoFisico.velocity.y = this.fuerzaSalto;
          this.enSuelo = false;
        } else if (this._saltosRestantes > 0) {
          this.cuerpoFisico.velocity.y = this.fuerzaSalto;
          this._saltosRestantes--;
        } //lse if (this._enPared && !this.enSuelo) {
        //  this.cuerpoFisico.velocity.y = this.fuerzaSalto * 0.85;
        //  this.cuerpoFisico.velocity.x += this._normalPared.x * 6;
        //  this.cuerpoFisico.velocity.z += this._normalPared.z * 6;
        //  this._enPared = false;
        //}
      }
      if ((e.code === "ShiftLeft" || e.code === "ShiftRight") && !e.repeat && this.cuerpoFisico && this._dashCooldown <= 0) {
        const d = new THREE.Vector3(0, 0, 0);
        if (this.direccion.adelante) d.z -= 1;
        if (this.direccion.atras) d.z += 1;
        if (this.direccion.izquierda) d.x -= 1;
        if (this.direccion.derecha) d.x += 1;
        if (d.lengthSq() === 0) d.set(0, 0, -1);
        d.normalize().applyAxisAngle(EJE_Y, this.anguloY);
        this.cuerpoFisico.velocity.x = d.x * this._dashVel;
        this.cuerpoFisico.velocity.z = d.z * this._dashVel;
        this.cuerpoFisico.velocity.y = Math.max(this.cuerpoFisico.velocity.y, 1);
        this._dashCooldown = this._dashTiempoRecarga;
        this._fovDash = 0.2;
      }
    });
    window.addEventListener("keyup", (e) => {
      if (this.entradaBloqueada) {
        this._resetDirecciones();
        return;
      }
      const dir = TECLA_DIRECCION[e.key.toLowerCase()];
      if (dir) this.direccion[dir] = false;
    });
    window.addEventListener("mousemove", (e) => {
      if (this.entradaBloqueada) return;
      if (!this.modo) return;
      if (!this._mouseEstaBloqueado()) {
        this.mouseActivo = false;
        return;
      }
      this.mouseActivo = true;
      this.anguloY -= e.movementX * this.sensibilidadMouse;
      this.anguloX -= e.movementY * this.sensibilidadMouse;
      this._limitarPitch();
    });
    window.addEventListener("mouseleave", () => {
      this.mouseActivo = false;
    });
    window.addEventListener("click", () => {
      if (this.entradaBloqueada) return;
      if (this.modo) this._solicitarBloqueoMouse();
    });
    window.addEventListener("blur", () => {
      this.mouseActivo = false;
      this._resetDirecciones();
      this._actualizarCursorMouse();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.mouseActivo = false;
        this._resetDirecciones();
        this._actualizarCursorMouse();
      }
    });
    document.addEventListener("pointerlockchange", () => {
      const bloqueado = this._mouseEstaBloqueado();
      this.mouseActivo = bloqueado;
      this._actualizarCursorMouse();
      if (!bloqueado) {
        this.mouseActivo = false;
        this._resetDirecciones();
      }
    });
    document.addEventListener("pointerlockerror", () => {
      this.mouseActivo = false;
      this._actualizarCursorMouse();
    });
  }

  _resetDirecciones() {
    this.direccion.adelante = false;
    this.direccion.atras = false;
    this.direccion.izquierda = false;
    this.direccion.derecha = false;
  }

  _limitarPitch() {
    const max = this._pitchMax;
    if (this.anguloX > max) this.anguloX = max;
    if (this.anguloX < -max) this.anguloX = -max;
  }

  _actualizarEstadoSuelo() {
    if (!this.cuerpoFisico || !this.world) {
      this.enSuelo = this.pos.y <= 0.05;
      this._sueloValido = this.enSuelo;
      return;
    }

    let tocandoMuro = false;
    let sueloDetectado = false;

    const contactos = this.world.contacts;
    for (let i = 0; i < contactos.length; i++) {
      const c = contactos[i];
      let normalY = 0;
      let otro = null;

      if (c.bi === this.cuerpoFisico) {
        normalY = -c.ni.y;
        otro = c.bj;
      } else if (c.bj === this.cuerpoFisico) {
        normalY = c.ni.y;
        otro = c.bi;
      } else {
        continue;
      }

      const tipo = otro?.userData?.tipo;

      if (tipo === "muro") {
        tocandoMuro = true;
      }

      // Si la normal empuja hacia arriba (>= 0.5 asegura que sea una superficie estable)
      if (normalY >= 0.5) {
        // Comprobación estricta: tiene que ser piso explícito
        if (tipo === "suelo" || tipo === "plataforma") {
          sueloDetectado = true;
        }
      }
    }

    this.enSuelo = sueloDetectado;
    this._sueloValido = sueloDetectado;
    this._tocandoMuro = tocandoMuro || this._enPared;

    const velOk = Math.abs(this.cuerpoFisico.velocity.y) <= 0.1;
    const recargaLista = this._recargaTimmer <= 0;

    // Solo recarga si tocamos piso válido y no estamos cayendo
    if (this.enSuelo && velOk && recargaLista) {
      this.ultimoTiempoEnSuelo = performance.now() / 1000;
      this._saltosRestantes = this._saltosMax;
      this._recargaTimmer = 0.08;
    }
  }
  _puedeSaltar() {
    if (this.enSuelo) return true;
    const ahora = performance.now() / 1000;
    return ahora - this.ultimoTiempoEnSuelo <= this.tiempoGraciaSalto;
  }

  _actualizarEstadoPared() {
    this._enPared = false;
    if (!this.cuerpoFisico || !this.world) return;
    const orig = this.cuerpoFisico.position;
    const r = this.radioCapsula + 0.12;
    const dirs = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
    for (const d of dirs) {
      this._rayParedDesde.copy(orig);
      this._rayParedHasta.set(orig.x + d[0] * r, orig.y + d[1] * r, orig.z + d[2] * r);
      this._rayParedResultado.reset();
      const hit = this.world.raycastClosest(this._rayParedDesde, this._rayParedHasta, { skipBackfaces: true }, this._rayParedResultado);
      if (hit && this._rayParedResultado.body && this._rayParedResultado.body.mass === 0) {
        const n = this._rayParedResultado.hitNormalWorld;
        if (Math.abs(n.y) < 0.3) {
          this._enPared = true;
          this._normalPared.set(n.x, 0, n.z).normalize();
          break;
        }
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
    if (this.distanciaCamara <= 0.01) {
      this.camera.position.set(
        this.pos.x,
        this.pos.y + this.alturaCamara,
        this.pos.z,
      );
      this._camEuler.set(this.anguloX, this.anguloY, 0, "YXZ");
      this._lookAt.set(0, 0, -1).applyEuler(this._camEuler);
      this.camera.lookAt(
        this.pos.x + this._lookAt.x,
        this.pos.y + this.alturaCamara + this._lookAt.y,
        this.pos.z + this._lookAt.z,
      );
    } else {
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
  }

  actualizar(delta = 1 / 60) {
    if (!this.modo) {
      if (this.cuerpoFisico) {
        this.pos.set(
          this.cuerpoFisico.position.x,
          this.cuerpoFisico.position.y - this.radioCapsula,
          this.cuerpoFisico.position.z,
        );
      }
      this._limitarAlPlano();
      this._actualizarVisual();
      return;
    }
    this._actualizarEstadoSuelo();
    this._actualizarEstadoPared();
    if (this._dashCooldown > 0) this._dashCooldown -= delta;
    if (this._recargaTimmer > 0) this._recargaTimmer -= delta;

    const mov = this._mov.set(0, 0, 0);
    if (this.direccion.adelante) mov.z -= 1;
    if (this.direccion.atras) mov.z += 1;
    if (this.direccion.izquierda) mov.x -= 1;
    if (this.direccion.derecha) mov.x += 1;

    const tieneInput = mov.lengthSq() > 0;
    const dirInput = this._inputDir;
    if (tieneInput) {
      dirInput.copy(mov).normalize().applyAxisAngle(EJE_Y, this.anguloY);
    } else {
      dirInput.set(0, 0, 0);
    }

    let dotPared = 0;
    if (this._enPared && tieneInput) {
      dotPared = dirInput.dot(this._normalPared);
      if (dotPared < 0) {
        dirInput.addScaledVector(this._normalPared, -dotPared);
        if (dirInput.lengthSq() > 0) dirInput.normalize();
      }
    }

    if (this._enPared && !this.enSuelo && this.cuerpoFisico && this.cuerpoFisico.velocity.y < 0) {
      const empujaPared = tieneInput && dotPared < -0.2;
      if (empujaPared) {
        this.cuerpoFisico.velocity.y = Math.max(this.cuerpoFisico.velocity.y, this._velocidadCaidaPared);
      }
    }

    if (this.cuerpoFisico) {
      const velObj = this.enSuelo ? this.velocidad : this.velocidad * this.factorVelocidadAire;
      const acel = this.enSuelo ? this._aceleracion : this._aceleracionAire;
      const factor = 1 - Math.exp(-acel * delta);
      if (tieneInput) {
        const targetX = dirInput.x * velObj;
        const targetZ = dirInput.z * velObj;
        this.cuerpoFisico.velocity.x += (targetX - this.cuerpoFisico.velocity.x) * factor;
        this.cuerpoFisico.velocity.z += (targetZ - this.cuerpoFisico.velocity.z) * factor;
      } else {
        this.cuerpoFisico.velocity.x *= (1 - factor);
        this.cuerpoFisico.velocity.z *= (1 - factor);
      }
      const dtSeguro = Math.max(1 / 240, delta);
      const velMax = (this.radioCapsula * 2.6) / dtSeguro;
      const vx = this.cuerpoFisico.velocity.x;
      const vz = this.cuerpoFisico.velocity.z;
      const speed = Math.sqrt(vx * vx + vz * vz);
      if (speed > velMax) {
        const scale = velMax / speed;
        this.cuerpoFisico.velocity.x *= scale;
        this.cuerpoFisico.velocity.z *= scale;
      }
    } else {
      if (tieneInput) {
        this.pos.addScaledVector(dirInput, this.velocidad * delta);
      }
    }

    if (this.cuerpoFisico) {
      this.pos.set(
        this.cuerpoFisico.position.x,
        this.cuerpoFisico.position.y - this.radioCapsula,
        this.cuerpoFisico.position.z,
      );
    }

    this._limitarAlPlano();
    if (this._fovDash > 0) {
      this.camera.fov = this._fovBase + 15;
      this._fovDash -= delta;
      if (this._fovDash <= 0) this.camera.fov = this._fovBase;
      this.camera.updateProjectionMatrix();
    }
    this._actualizarCamara();
    this._actualizarVisual();
  }
}
