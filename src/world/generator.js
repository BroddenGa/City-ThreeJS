import { CELL, MAZE_SIZE } from './config.js';

const DIRS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];
const DEFAULT_MIN_ROUTES = 2;
const MAX_GENERATION_ATTEMPTS = 80;

function normalizarSize(size) {
  const n = Math.max(15, Number(size) || MAZE_SIZE);
  return n % 2 === 0 ? n + 1 : n;
}

function hashSeed(seed) {
  const text = String(seed ?? Date.now());
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, rand) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function key(gx, gz) {
  return `${gx},${gz}`;
}

function fromKey(value) {
  return value.split(',').map(Number);
}

function isInside(maze, gx, gz) {
  return gz >= 0 && gz < maze.length && gx >= 0 && gx < maze.length;
}

function isWalkable(maze, gx, gz) {
  return isInside(maze, gx, gz) && maze[gz][gx] === 0;
}

function neighbors(maze, gx, gz, walkable) {
  const out = [];
  for (const [dx, dz] of DIRS) {
    const nx = gx + dx;
    const nz = gz + dz;
    if (walkable(nx, nz)) out.push([nx, nz]);
  }
  return out;
}

function crearMazeBase(size, rand) {
  const maze = Array.from({ length: size }, () => Array(size).fill(1));
  const start = [1, 1];
  maze[start[1]][start[0]] = 0;
  const stack = [start];

  while (stack.length) {
    const [gx, gz] = stack[stack.length - 1];
    const candidates = shuffle(DIRS, rand)
      .map(([dx, dz]) => [gx + dx * 2, gz + dz * 2, gx + dx, gz + dz])
      .filter(([nx, nz]) => nx > 0 && nz > 0 && nx < size - 1 && nz < size - 1 && maze[nz][nx] === 1);

    if (!candidates.length) {
      stack.pop();
      continue;
    }

    const [nx, nz, wx, wz] = candidates[0];
    maze[wz][wx] = 0;
    maze[nz][nx] = 0;
    stack.push([nx, nz]);
  }

  return maze;
}

function abrirBucles(maze, rand) {
  const candidates = [];
  for (let gz = 1; gz < maze.length - 1; gz++) {
    for (let gx = 1; gx < maze.length - 1; gx++) {
      if (maze[gz][gx] === 0) continue;
      const horizontal = maze[gz][gx - 1] === 0 && maze[gz][gx + 1] === 0;
      const vertical = maze[gz - 1][gx] === 0 && maze[gz + 1][gx] === 0;
      if (horizontal || vertical) candidates.push([gx, gz]);
    }
  }

  const target = Math.floor(maze.length * maze.length * 0.08);
  for (const [gx, gz] of shuffle(candidates, rand).slice(0, target)) {
    maze[gz][gx] = 0;
  }
}

function calcularDistancias(maze, start, walkable = (gx, gz) => isWalkable(maze, gx, gz)) {
  const startKey = key(start.gx, start.gz);
  const queue = [[start.gx, start.gz]];
  const dist = new Map([[startKey, 0]]);

  for (let i = 0; i < queue.length; i++) {
    const [gx, gz] = queue[i];
    const d = dist.get(key(gx, gz));
    for (const [nx, nz] of neighbors(maze, gx, gz, walkable)) {
      const nk = key(nx, nz);
      if (dist.has(nk)) continue;
      dist.set(nk, d + 1);
      queue.push([nx, nz]);
    }
  }

  return dist;
}

function elegirMeta(maze, start, rand) {
  const dist = calcularDistancias(maze, start);
  const minDistance = Math.floor(maze.length * 1.35);
  const candidates = [];

  for (const [cellKey, d] of dist.entries()) {
    const [gx, gz] = fromKey(cellKey);
    if (d < minDistance) continue;
    const bias = gx + gz;
    candidates.push({ gx, gz, d, bias });
  }

  candidates.sort((a, b) => (b.bias + b.d * 0.35) - (a.bias + a.d * 0.35));
  const top = candidates.slice(0, Math.max(1, Math.ceil(candidates.length * 0.2)));
  return top[Math.floor(rand() * top.length)] ?? { gx: maze.length - 2, gz: maze.length - 2 };
}

function shortestPath(maze, start, end, walkable) {
  const queue = [[start.gx, start.gz]];
  const cameFrom = new Map([[key(start.gx, start.gz), null]]);
  const endKey = key(end.gx, end.gz);

  for (let i = 0; i < queue.length; i++) {
    const [gx, gz] = queue[i];
    if (key(gx, gz) === endKey) break;
    for (const [nx, nz] of neighbors(maze, gx, gz, walkable)) {
      const nk = key(nx, nz);
      if (cameFrom.has(nk)) continue;
      cameFrom.set(nk, key(gx, gz));
      queue.push([nx, nz]);
    }
  }

  if (!cameFrom.has(endKey)) return [];
  const path = [];
  for (let cur = endKey; cur; cur = cameFrom.get(cur)) {
    const [gx, gz] = fromKey(cur);
    path.push({ gx, gz });
  }
  return path.reverse();
}

function countEdgeDisjointRoutes(maze, start, end, walkable, cap = 3) {
  const startKey = key(start.gx, start.gz);
  const endKey = key(end.gx, end.gz);
  const usedEdges = new Set();
  let count = 0;

  while (count < cap) {
    const queue = [[start.gx, start.gz]];
    const cameFrom = new Map([[startKey, null]]);

    for (let i = 0; i < queue.length; i++) {
      const [gx, gz] = queue[i];
      if (key(gx, gz) === endKey) break;
      for (const [nx, nz] of neighbors(maze, gx, gz, walkable)) {
        const edgeKey = `${key(gx, gz)}>${key(nx, nz)}`;
        const nk = key(nx, nz);
        if (usedEdges.has(edgeKey) || cameFrom.has(nk)) continue;
        cameFrom.set(nk, key(gx, gz));
        queue.push([nx, nz]);
      }
    }

    if (!cameFrom.has(endKey)) break;

    for (let cur = endKey; cameFrom.get(cur); cur = cameFrom.get(cur)) {
      const prev = cameFrom.get(cur);
      usedEdges.add(`${prev}>${cur}`);
      usedEdges.add(`${cur}>${prev}`);
    }
    count++;
  }

  return count;
}

function celdasTransitables(maze) {
  const cells = [];
  for (let gz = 1; gz < maze.length - 1; gz++) {
    for (let gx = 1; gx < maze.length - 1; gx++) {
      if (maze[gz][gx] === 0) cells.push({ gx, gz });
    }
  }
  return cells;
}

function generarPitsYPlataformas(maze, start, end, rand) {
  const safePath = shortestPath(maze, start, end, (gx, gz) => isWalkable(maze, gx, gz));
  const safe = new Set(safePath.map((cell) => key(cell.gx, cell.gz)));
  safe.add(key(start.gx, start.gz));
  safe.add(key(end.gx, end.gz));

  const pits = new Set();
  const platforms = [];
  const candidates = celdasTransitables(maze)
    .filter(({ gx, gz }) => !safe.has(key(gx, gz)))
    .filter(({ gx, gz }) => neighbors(maze, gx, gz, (nx, nz) => isWalkable(maze, nx, nz)).length >= 2);

  const target = Math.floor(maze.length * maze.length * 0.055);
  for (const cell of shuffle(candidates, rand).slice(0, target)) {
    pits.add(key(cell.gx, cell.gz));
    if (rand() < 0.45) {
      platforms.push({
        gx: cell.gx,
        gz: cell.gz,
        h: 0.55 + rand() * 0.8,
        w: CELL * (0.32 + rand() * 0.16),
        d: CELL * (0.32 + rand() * 0.16),
        color: rand() < 0.75 ? 0x4FC3F7 : 0xFFB74D,
        sobreHueco: true,
      });
    }
  }

  for (const cell of shuffle(celdasTransitables(maze), rand).slice(0, Math.floor(maze.length * 0.65))) {
    const cellKey = key(cell.gx, cell.gz);
    if (pits.has(cellKey) || safe.has(cellKey)) continue;
    platforms.push({
      gx: cell.gx,
      gz: cell.gz,
      h: 0.35 + rand() * 1.2,
      w: CELL * (0.34 + rand() * 0.22),
      d: CELL * (0.34 + rand() * 0.22),
      color: rand() < 0.5 ? 0x66BB6A : 0x8BC34A,
      sobreHueco: false,
    });
  }

  return { pits, platforms };
}

function generarObstaculos(maze, pits, start, end, rand) {
  const protectedCells = new Set([key(start.gx, start.gz), key(end.gx, end.gz)]);
  return shuffle(celdasTransitables(maze), rand)
    .filter(({ gx, gz }) => !pits.has(key(gx, gz)) && !protectedCells.has(key(gx, gz)))
    .slice(0, Math.floor(maze.length * 0.55))
    .map(({ gx, gz }) => ({
      gx,
      gz,
      w: CELL * (0.18 + rand() * 0.55),
      h: 0.65 + rand() * 0.9,
      d: CELL * (0.18 + rand() * 0.55),
      color: rand() < 0.55 ? 0x9E9E9E : 0x78909C,
      ox: (rand() - 0.5) * 0.42,
      oz: (rand() - 0.5) * 0.42,
    }));
}

function generarLuces(maze, start, end, rand) {
  return shuffle(celdasTransitables(maze), rand)
    .filter(({ gx, gz }) => key(gx, gz) !== key(start.gx, start.gz) && key(gx, gz) !== key(end.gx, end.gz))
    .slice(0, Math.max(8, Math.floor(maze.length * 0.45)));
}

function validarLevel(maze, start, end, pits, platforms, minRoutes) {
  const platformCells = new Set(platforms.filter((p) => p.sobreHueco).map((p) => key(p.gx, p.gz)));
  const walkable = (gx, gz) => isWalkable(maze, gx, gz) && (!pits.has(key(gx, gz)) || platformCells.has(key(gx, gz)));
  if (!walkable(start.gx, start.gz) || !walkable(end.gx, end.gz)) return { ok: false, routeCount: 0 };
  const routeCount = countEdgeDisjointRoutes(maze, start, end, walkable, Math.max(minRoutes, 3));
  return { ok: routeCount >= minRoutes, routeCount };
}

function crearLevel({ size, seed, minRoutes }) {
  const rand = mulberry32(hashSeed(seed));
  const maze = crearMazeBase(size, rand);
  abrirBucles(maze, rand);

  const startCell = { gx: 1, gz: 1 };
  const endCell = elegirMeta(maze, startCell, rand);
  maze[startCell.gz][startCell.gx] = 0;
  maze[endCell.gz][endCell.gx] = 0;

  const { pits, platforms } = generarPitsYPlataformas(maze, startCell, endCell, rand);
  const validation = validarLevel(maze, startCell, endCell, pits, platforms, minRoutes);
  if (!validation.ok) return null;

  const origin = -(size * CELL) / 2;
  const cellToWorld = (gx, gz) => ({
    x: origin + gx * CELL + CELL / 2,
    z: origin + gz * CELL + CELL / 2,
  });

  return {
    seed,
    size,
    maze,
    origin,
    startCell,
    endCell,
    start: cellToWorld(startCell.gx, startCell.gz),
    end: cellToWorld(endCell.gx, endCell.gz),
    pits,
    platforms,
    obstacles: generarObstaculos(maze, pits, startCell, endCell, rand),
    lights: generarLuces(maze, startCell, endCell, rand),
    routeCount: validation.routeCount,
    cellToWorld,
  };
}

export function generateLevel({ size = MAZE_SIZE, seed = Date.now(), minRoutes = DEFAULT_MIN_ROUTES } = {}) {
  const levelSize = normalizarSize(size);
  const baseSeed = String(seed);

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const attemptSeed = `${baseSeed}-${attempt}`;
    const level = crearLevel({ size: levelSize, seed: attemptSeed, minRoutes });
    if (level) return level;
  }

  throw new Error(`No se pudo generar un maze valido con ${minRoutes} rutas despues de ${MAX_GENERATION_ATTEMPTS} intentos.`);
}

export function serializeLevel(level) {
  return {
    ...level,
    pits: [...level.pits],
    cellToWorld: undefined,
  };
}

export function hydrateLevel(level) {
  const origin = level.origin;
  const cellToWorld = (gx, gz) => ({
    x: origin + gx * CELL + CELL / 2,
    z: origin + gz * CELL + CELL / 2,
  });

  return {
    ...level,
    pits: level.pits instanceof Set ? level.pits : new Set(level.pits),
    start: level.start ?? cellToWorld(level.startCell.gx, level.startCell.gz),
    end: level.end ?? cellToWorld(level.endCell.gx, level.endCell.gz),
    cellToWorld,
  };
}
