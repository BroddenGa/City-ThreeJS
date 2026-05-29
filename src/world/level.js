import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CELL, WALL_H, WALL_T, WALL_COLLISION_EXTRA } from './config.js';

const WALL_COLORS = [0x2E86DE, 0x00B894, 0xE17055, 0xA29BFE, 0xFDCB6E, 0xE84393];

function colorGz(gz) {
  return WALL_COLORS[gz % WALL_COLORS.length];
}

function disposeMaterial(material) {
  if (Array.isArray(material)) {
    for (const item of material) item.dispose?.();
  } else {
    material?.dispose?.();
  }
}

export function buildLevel({ scene, world, wallMaterial, groundMaterial, levelData }) {
  const meshes = [];
  const bodies = [];
  const materials = new Set();

  function addMesh(mesh) {
    meshes.push(mesh);
    scene.add(mesh);
    return mesh;
  }

  function addBody(body) {
    bodies.push(body);
    world.addBody(body);
    return body;
  }

function makeMaterial(params) {
    const material = new THREE.MeshStandardMaterial(params);
    materials.add(material);
    return material;
  }

  function makeBasicMaterial(params) {
    const material = new THREE.MeshBasicMaterial(params);
    materials.add(material);
    return material;
  }

  const maze = levelData.maze;
  const pits = levelData.pits;
  const size = levelData.size;
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();

  const floorCells = [];
  for (let gz = 0; gz < size; gz++) {
    for (let gx = 0; gx < size; gx++) {
      if (maze[gz][gx] !== 0 || pits.has(`${gx},${gz}`)) continue;
      floorCells.push(levelData.cellToWorld(gx, gz));
    }
  }

  const floorGeometry = new THREE.PlaneGeometry(CELL, CELL);
  const floorMat = makeMaterial({ color: 0x8FAE8E, roughness: 0.82 });
  const floorMesh = new THREE.InstancedMesh(floorGeometry, floorMat, floorCells.length);
  floorMesh.receiveShadow = true;
  floorCells.forEach((cell, index) => {
    matrix.makeRotationX(-Math.PI / 2);
    matrix.setPosition(cell.x, -0.01, cell.z);
    floorMesh.setMatrixAt(index, matrix);
  });
  floorMesh.instanceMatrix.needsUpdate = true;
  addMesh(floorMesh);

  const floorBody = new CANNON.Body({ mass: 0, material: groundMaterial });
  floorBody.userData = { tipo: 'suelo' };
  floorBody.collisionFilterGroup = world.collisionGroups.ground;
  floorBody.collisionFilterMask = world.collisionGroups.player;
  const floorShape = new CANNON.Box(new CANNON.Vec3(CELL / 2, 0.5, CELL / 2));
  for (const cell of floorCells) {
    floorBody.addShape(floorShape, new CANNON.Vec3(cell.x, -0.5, cell.z));
  }
  addBody(floorBody);

  const wallSegments = [];

  for (let x = 1; x < size; x++) {
    let start = null;
    let lastColor = null;
    for (let gz = 0; gz < size; gz++) {
      const leftWall = maze[gz][x - 1] === 1;
      const rightWall = maze[gz][x] === 1;
      const boundary = leftWall !== rightWall;
      const segmentColor = colorGz(gz);
      if (boundary && start === null) {
        start = gz;
        lastColor = segmentColor;
      } else if ((!boundary || segmentColor !== lastColor) && start !== null) {
        wallSegments.push({ x, z0: start, z1: gz - 1, vertical: true, color: lastColor });
        start = boundary ? gz : null;
        lastColor = boundary ? segmentColor : null;
      }
    }
    if (start !== null) wallSegments.push({ x, z0: start, z1: size - 1, vertical: true, color: lastColor });
  }

  for (let z = 1; z < size; z++) {
    let start = null;
    let lastColor = null;
    for (let gx = 0; gx < size; gx++) {
      const topWall = maze[z - 1][gx] === 1;
      const bottomWall = maze[z][gx] === 1;
      const boundary = topWall !== bottomWall;
      const segmentColor = colorGz(z - 1);
      if (boundary && start === null) {
        start = gx;
        lastColor = segmentColor;
      } else if ((!boundary || segmentColor !== lastColor) && start !== null) {
        wallSegments.push({ z, x0: start, x1: gx - 1, vertical: false, color: lastColor });
        start = boundary ? gx : null;
        lastColor = boundary ? segmentColor : null;
      }
    }
    if (start !== null) wallSegments.push({ z, x0: start, x1: size - 1, vertical: false, color: lastColor });
  }

  const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
  const wallMat = makeBasicMaterial({ color: 0xffffff });
  const wallMesh = new THREE.InstancedMesh(wallGeometry, wallMat, wallSegments.length);
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  const wallBody = new CANNON.Body({ mass: 0, material: wallMaterial });
  wallBody.userData = { tipo: 'muro' };
  wallBody.collisionFilterGroup = world.collisionGroups.wall;
  wallBody.collisionFilterMask = world.collisionGroups.player;
  const wallH = WALL_H + WALL_COLLISION_EXTRA;

  wallSegments.forEach((segment, index) => {
    if (segment.vertical) {
      const length = segment.z1 - segment.z0 + 1;
      const first = levelData.cellToWorld(0, segment.z0);
      const last = levelData.cellToWorld(0, segment.z1);
      const x = levelData.origin + segment.x * CELL;
      const z = (first.z + last.z) / 2;
      matrix.compose(
        new THREE.Vector3(x, WALL_H / 2, z),
        new THREE.Quaternion(),
        new THREE.Vector3(WALL_T, WALL_H, CELL * length)
      );
      wallMesh.setMatrixAt(index, matrix);
      wallBody.addShape(
        new CANNON.Box(new CANNON.Vec3(WALL_T / 2, wallH / 2, (CELL * length) / 2)),
        new CANNON.Vec3(x, wallH / 2 - 1.5, z)
      );
    } else {
      const length = segment.x1 - segment.x0 + 1;
      const first = levelData.cellToWorld(segment.x0, 0);
      const last = levelData.cellToWorld(segment.x1, 0);
      const x = (first.x + last.x) / 2;
      const z = levelData.origin + segment.z * CELL;
      matrix.compose(
        new THREE.Vector3(x, WALL_H / 2, z),
        new THREE.Quaternion(),
        new THREE.Vector3(CELL * length, WALL_H, WALL_T)
      );
      wallMesh.setMatrixAt(index, matrix);
      wallBody.addShape(
        new CANNON.Box(new CANNON.Vec3((CELL * length) / 2, wallH / 2, WALL_T / 2)),
        new CANNON.Vec3(x, wallH / 2 - 1.5, z)
      );
    }
    wallMesh.setColorAt(index, color.setHex(segment.color));
  });
  wallMesh.instanceMatrix.needsUpdate = true;
  if (wallMesh.instanceColor) wallMesh.instanceColor.needsUpdate = true;
  addMesh(wallMesh);
  addBody(wallBody);

  function crearSuelo(cx, cy, cz, ancho, prof, materialColor) {
    const h = 0.2;
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(ancho, h, prof),
      makeMaterial({ color: materialColor, roughness: 0.6 })
    );
    m.position.set(cx, cy + h / 2, cz);
    m.receiveShadow = true;
    addMesh(m);

    const b = new CANNON.Body({ mass: 0, material: groundMaterial });
    b.userData = { tipo: 'plataforma' };
    b.collisionFilterGroup = world.collisionGroups.ground;
    b.collisionFilterMask = world.collisionGroups.player;
    b.addShape(new CANNON.Box(new CANNON.Vec3(ancho / 2, h / 2, prof / 2)));
    b.position.set(cx, cy + h / 2, cz);
    addBody(b);
  }

  function crearObstaculo(cx, cz, ancho, alto, prof, materialColor) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(ancho, alto, prof),
      makeMaterial({ color: materialColor, roughness: 0.72 })
    );
    m.position.set(cx, alto / 2, cz);
    m.receiveShadow = true;
    addMesh(m);

    const b = new CANNON.Body({ mass: 0, material: wallMaterial });
    b.userData = { tipo: 'obstaculo' };
    b.collisionFilterGroup = world.collisionGroups.wall;
    b.collisionFilterMask = world.collisionGroups.player;
    b.addShape(new CANNON.Box(new CANNON.Vec3(ancho / 2, alto / 2, prof / 2)));
    b.position.set(cx, alto / 2, cz);
    addBody(b);
  }

  for (const platform of levelData.platforms) {
    if (pits.has(`${platform.gx},${platform.gz}`) && !platform.sobreHueco) continue;
    const c = levelData.cellToWorld(platform.gx, platform.gz);
    crearSuelo(c.x, platform.h, c.z, platform.w, platform.d, platform.color);
  }

  for (const obstacle of levelData.obstacles) {
    if (pits.has(`${obstacle.gx},${obstacle.gz}`)) continue;
    const c = levelData.cellToWorld(obstacle.gx, obstacle.gz);
    crearObstaculo(
      c.x + obstacle.ox * CELL,
      c.z + obstacle.oz * CELL,
      obstacle.w,
      obstacle.h,
      obstacle.d,
      obstacle.color,
    );
  }

  const sc = 0x4FC3F7;
  const startMaterial = makeMaterial({ color: sc, emissive: sc, emissiveIntensity: 0.3 });
  const sMesh = new THREE.Mesh(new THREE.BoxGeometry(CELL * 0.8, 0.15, CELL * 0.8), startMaterial);
  sMesh.position.set(levelData.start.x, 0.075, levelData.start.z);
  addMesh(sMesh);

  const fc = 0xFFD700;
  const finishMaterial = makeMaterial({ color: fc, emissive: fc, emissiveIntensity: 0.3 });
  const fMesh = new THREE.Mesh(new THREE.BoxGeometry(CELL * 0.9, 0.15, CELL * 0.9), finishMaterial);
  fMesh.position.set(levelData.end.x, 0.075, levelData.end.z);
  addMesh(fMesh);
  const fLight = new THREE.PointLight(fc, 1.1, 6);
  fLight.castShadow = false;
  fLight.position.set(levelData.end.x, 15, levelData.end.z);
  addMesh(fLight);
  const fPillar = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 15, 0.65),
    makeMaterial({ color: fc, emissive: fc, emissiveIntensity: 0.15 })
  );
  fPillar.position.set(levelData.end.x, 7.5, levelData.end.z);
  addMesh(fPillar);
  const fStar = new THREE.Mesh(
    new THREE.OctahedronGeometry(1),
    makeMaterial({ color: fc, emissive: fc, emissiveIntensity: 0.5 })
  );
  fStar.position.set(levelData.end.x, 1, levelData.end.z);
  addMesh(fStar);

  for (const { gx, gz } of levelData.lights.slice(0, 5)) {
    const c = levelData.cellToWorld(gx, gz);
    if (maze[gz] && maze[gz][gx] === 0) {
      const l = new THREE.PointLight(0xffffff, 0.65, 7);
      l.castShadow = false;
      l.position.set(c.x, WALL_H - 0.2, c.z);
      addMesh(l);
    }
  }

  return {
    fLight,
    fStar,
    stats: {
      meshes: meshes.length,
      bodies: bodies.length,
      wallSegments: wallSegments.length,
      floors: floorCells.length,
    },
    dispose() {
      for (const body of bodies) world.removeBody(body);
      for (const mesh of meshes) {
        scene.remove(mesh);
        mesh.geometry?.dispose?.();
      }
      for (const material of materials) disposeMaterial(material);
    },
  };
}
