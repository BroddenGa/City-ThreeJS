# Repository Guidelines

## Project Structure & Module Organization

This is a Vite-based Three.js parkour maze game. `index.html` is the browser entry point and loads `src/main.js`. Most scene setup lives in `src/main.js`: maze generation, physics, lighting, HUD, respawn logic, and the render loop. Player movement, camera control, jump, wall-jump, and dash behavior live in `src/personaje.js` as `Personaje`.

Static assets belong in `public/`, especially `public/models/` for GLB, FBX, OBJ, MTL, and texture files. Browser references should use root-relative paths such as `/models/characters/gltf/Skeleton_Mage.glb`. End-to-end tests live in `tests/*.spec.js`. `dist/` is generated and should not be edited manually.

## Build, Test, and Development Commands

- `npm install`: install project dependencies.
- `npm run dev`: start the Vite dev server for local play and debugging.
- `npm run build`: create a production build in `dist/`.
- `npm run preview`: serve the production build locally.
- `npm run test:e2e`: run Playwright tests; the config starts Vite on `http://localhost:5173`.

The repo includes both `package-lock.json` and `pnpm-lock.yaml`; prefer `npm` unless the team standardizes on another package manager.

## Coding Style & Naming Conventions

Use ES modules and keep imports at the top. Follow the surrounding JavaScript style: 2-space indentation, semicolons, descriptive helpers, and constants in `UPPER_SNAKE_CASE` for fixed game values such as `CELL`, `WALL_H`, and `MAZE`. Existing gameplay identifiers are mostly Spanish (`Personaje`, `celdaCentro`, `crearPared`), so keep new domain names consistent with nearby code.

Keep changes scoped. Avoid mixing gameplay tuning, visual polish, asset swaps, and test refactors in one patch unless they are required for the same behavior.

## Testing Guidelines

Use Playwright for browser behavior tests. Place specs in `tests/` with the `.spec.js` suffix, for example `tests/jump-recharge.spec.js`. Prefer page interactions (`page.click`, `page.keyboard.press`) and observable assertions. Existing debug hooks such as `window.__debugJump` may be used when physics state would otherwise be flaky.

Run `npm run test:e2e` before submitting gameplay or movement changes. Also run `npm run build` after changes that affect imports, assets, or deployment.

## Commit & Pull Request Guidelines

Recent commits are short and Spanish, sometimes using Conventional Commit prefixes, for example `fix: paredes menos pegajosas`. Keep commits concise and behavior-focused. Use prefixes such as `fix:`, `feat:`, or `test:` when helpful.

Pull requests should include a brief description, the change, commands run, and screenshots or short clips for visible 3D changes. Link related issues when available and call out asset additions under `public/models/`.
