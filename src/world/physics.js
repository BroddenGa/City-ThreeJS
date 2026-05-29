import * as CANNON from 'cannon-es';

export function createWorld() {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -14, 0) });
  world.solver.iterations = 20;
  world.defaultContactMaterial.friction = 0.0;
  world.defaultContactMaterial.restitution = 0.0;

  const GROUP_GROUND = 1;
  const GROUP_WALL = 2;
  const GROUP_PLAYER = 4;
  world.collisionGroups = { ground: GROUP_GROUND, wall: GROUP_WALL, player: GROUP_PLAYER };

  world.playerMaterial = new CANNON.Material('player');
  const wallMaterial = new CANNON.Material('wall');
  const groundMaterial = new CANNON.Material('ground');

  world.addContactMaterial(new CANNON.ContactMaterial(world.playerMaterial, wallMaterial, {
    friction: 0.0,
    restitution: 0.0,
    contactEquationStiffness: 1e8,
    contactEquationRelaxation: 3,
    frictionEquationStiffness: 1e6,
    frictionEquationRelaxation: 3,
  }));

  world.addContactMaterial(new CANNON.ContactMaterial(world.playerMaterial, groundMaterial, {
    friction: 0.01,
    restitution: 0.0,
    contactEquationStiffness: 1e8,
    contactEquationRelaxation: 3,
    frictionEquationStiffness: 1e6,
    frictionEquationRelaxation: 3,
  }));

  return { world, wallMaterial, groundMaterial };
}
