import { generateLevel, serializeLevel } from './generator.js';

self.addEventListener('message', (event) => {
  const { id, size, seed, minRoutes } = event.data;
  try {
    const level = generateLevel({ size, seed, minRoutes });
    self.postMessage({ id, ok: true, level: serializeLevel(level) });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

