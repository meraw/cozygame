// The placeholder village: where everything stands, in world units.
// The screen shows 2360 x 1640 units at a time and the camera follows the player.

import { blockEllipse, blockRect, createGrid } from '../world/grid.js';

export const CELL_SIZE = 40;
// How far the player's body reaches around the point under their feet.
const PLAYER_RADIUS = 30;

// Houses are drawn front-on: a wall with the door at the middle of its base, and a roof above.
export const EAVE = 30;
export const ROOF_HEIGHT = 150;
// The town hall is drawn like a big house, with a clock tower rising from the middle of its front.
export const TOWN_HALL = { roofHeight: 170, towerWidth: 150, towerHeight: 330, towerRoof: 70 };

const ROAD_Y = 1900;
const ROAD_HALF_WIDTH = 80;
const ROAD_TOP = ROAD_Y - ROAD_HALF_WIDTH;

// Things marked `restorable` have had their life drained by the vampires: the game starts with
// them decayed until the player restores them. The name is what the save remembers them by.

const houses = [
  // Along the road, doors facing it. The first is the student house Meredith shares with Nora.
  { x: 600, baseY: 1640, width: 300, wall: 200, restorable: 'student-house', interior: 'student' },
  { x: 1350, baseY: 1600, width: 320, wall: 210 },
  { x: 2100, baseY: 1640, width: 280, wall: 190 },
  { x: 3900, baseY: 1620, width: 300, wall: 200 },
  { x: 4650, baseY: 1600, width: 340, wall: 220 },
  { x: 5400, baseY: 1640, width: 300, wall: 200 },
  // Further up the slope
  { x: 1000, baseY: 1120, width: 300, wall: 200 },
  { x: 4280, baseY: 1120, width: 300, wall: 190 },
  // Below the square
  { x: 2700, baseY: 2800, width: 300, wall: 200 },
  { x: 3500, baseY: 2800, width: 320, wall: 200 },
];

// On the north side of the square, its door facing the fountain
const townHall = { x: 3000, baseY: 1440, width: 600, wall: 280 };

export const village = {
  width: 6000,
  height: 3360,
  start: { x: 300, y: ROAD_Y },
  // Misty hills fill the top edge; nobody walks there.
  hillsBottom: 560,
  road: { y: ROAD_Y, halfWidth: ROAD_HALF_WIDTH },
  square: { x: 3000, y: ROAD_Y, radius: 380 },
  fountain: { x: 3000, y: ROAD_Y, radius: 110 },
  pond: { x: 4800, y: 2700, radiusX: 520, radiusY: 230 },
  houses,
  townHall,
  // Dirt paths, just for looks
  lanes: [
    ...houses
      .filter((house) => house.baseY < ROAD_TOP)
      .map((house) => ({ x: house.x - 40, y: house.baseY - 10, width: 80, height: ROAD_TOP - house.baseY + 10 })),
    { x: townHall.x - 50, y: townHall.baseY - 10, width: 100, height: 100 }, // from the town hall to the square
    { x: 1110, y: 1960, width: 80, height: 250 }, // to the field gate
    { x: 2960, y: 2260, width: 80, height: 560 }, // from the square down to the lower houses
    { x: 2560, y: 2800, width: 1080, height: 80 }, // past the lower houses' doors
  ],
  fields: [
    { x: 400, y: 2260, width: 700, height: 440, restorable: 'west-field' },
    { x: 1250, y: 2260, width: 690, height: 440 },
  ],
  // Fences around the fields, with a gate gap at the top
  fences: [
    { x: 350, y: 2200, length: 700, direction: 'across' },
    { x: 1250, y: 2200, length: 750, direction: 'across' },
    { x: 350, y: 2760, length: 1650, direction: 'across' },
    { x: 350, y: 2200, length: 560, direction: 'down' },
    { x: 2000, y: 2200, length: 560, direction: 'down' },
  ],
  trees: [...edgeTrees(), ...villageTrees()],
  benches: [
    { x: 2720, y: 2130, restorable: 'square-bench' },
    { x: 4800, y: 2390 },
  ],
  lamps: [
    { x: 1720, y: 1770 },
    { x: 2480, y: 1770 },
    { x: 3520, y: 1770 },
    { x: 5020, y: 1770 },
  ],
  rocks: [
    { x: 2350, y: 1050, size: 40 },
    { x: 3460, y: 1330, size: 34 },
    { x: 5600, y: 2450, size: 44 },
    { x: 2300, y: 3080, size: 38 },
    { x: 700, y: 3000, size: 36 },
    { x: 5150, y: 1250, size: 30 },
  ],
};

// The names of everything in the village that has been drained of life.
export function restorableNames(v = village) {
  return [...v.houses, ...v.benches, ...v.fields].filter((thing) => thing.restorable).map((thing) => thing.restorable);
}

// The area a house covers on screen, from the bottom of its wall to the top of its roof.
export function houseBounds(house) {
  const width = house.width + 2 * EAVE;
  const height = house.wall + ROOF_HEIGHT;
  return { left: house.x - width / 2, top: house.baseY - height, width, height };
}

// The area the town hall covers on screen, from the bottom of its wall to the top of its tower.
export function townHallBounds(hall) {
  const width = hall.width + 2 * EAVE;
  const height = hall.wall + TOWN_HALL.towerHeight + TOWN_HALL.towerRoof;
  return { left: hall.x - width / 2, top: hall.baseY - height, width, height };
}

// Every door in the village: the houses' in order, then the town hall's.
// interior says what's inside: a plain room, Nora and Meredith's room, or the mayor's office.
export function villageDoors(v = village) {
  const hall = v.townHall;
  return [
    ...houseDoors(v.houses),
    {
      area: { left: hall.x - 80, right: hall.x + 80, top: hall.baseY - 190, bottom: hall.baseY + 30 },
      step: { x: hall.x, y: hall.baseY + 60 },
      interior: 'office',
    },
  ];
}

// Each house's front door: the area you can tap, and the step in front of it where you stand.
export function houseDoors(houses) {
  return houses.map((house) => ({
    area: { left: house.x - 60, right: house.x + 60, top: house.baseY - 150, bottom: house.baseY + 30 },
    step: { x: house.x, y: house.baseY + 60 },
    interior: house.interior ?? 'room',
  }));
}

// Which cells of the village can be walked on. Everything solid is grown by the player's
// radius, so the player's body never overlaps a house or a tree.
export function buildWalkGrid(v = village) {
  const grid = createGrid(v.width, v.height, CELL_SIZE);
  const pad = PLAYER_RADIUS;
  const solidRect = (x, y, width, height) => blockRect(grid, x - pad, y - pad, width + 2 * pad, height + 2 * pad);
  const solidEllipse = (x, y, radiusX, radiusY) => blockEllipse(grid, x, y, radiusX + pad, radiusY + pad);

  solidRect(0, 0, v.width, v.hillsBottom);
  for (const house of v.houses) {
    const { left, top, width, height } = houseBounds(house);
    solidRect(left, top, width, height);
  }
  const hall = townHallBounds(v.townHall);
  solidRect(hall.left, hall.top, hall.width, hall.height);
  for (const fence of v.fences) {
    if (fence.direction === 'across') solidRect(fence.x, fence.y - 10, fence.length, 20);
    else solidRect(fence.x - 10, fence.y, 20, fence.length);
  }
  for (const tree of v.trees) solidEllipse(tree.x, tree.y, 24, 14);
  for (const bench of v.benches) solidRect(bench.x - 80, bench.y - 40, 160, 40);
  for (const lamp of v.lamps) solidEllipse(lamp.x, lamp.y, 14, 10);
  for (const rock of v.rocks) solidEllipse(rock.x, rock.y, rock.size, rock.size * 0.6);
  solidEllipse(v.fountain.x, v.fountain.y, v.fountain.radius, v.fountain.radius);
  solidEllipse(v.pond.x, v.pond.y, v.pond.radiusX, v.pond.radiusY);
  return grid;
}

// Rows of trees along the edges, leaving the road open at both ends.
function edgeTrees() {
  const trees = [];
  for (let i = 0, x = 150; x <= 5850; i++, x += 260) trees.push({ x, y: 3260 + (i % 3) * 25, size: 1.1 });
  for (let i = 0, x = 200; x <= 5800; i++, x += 330) trees.push({ x, y: 680 + (i % 2) * 30, size: 1 });
  for (let y = 760; y <= 3100; y += 230) {
    if (y > ROAD_Y - 220 && y < ROAD_Y + 220) continue;
    trees.push({ x: 120, y, size: 1.05 }, { x: 5880, y, size: 1.05 });
  }
  return trees;
}

function villageTrees() {
  return [
    { x: 300, y: 1350, size: 1.1 },
    { x: 1750, y: 1300, size: 1.2 },
    { x: 2450, y: 1450, size: 1 },
    { x: 3560, y: 1450, size: 1 },
    { x: 2560, y: 1180, size: 1.25 },
    { x: 3480, y: 1080, size: 1.1 },
    { x: 5750, y: 1350, size: 1.1 },
    { x: 2450, y: 2380, size: 1 },
    { x: 3560, y: 2380, size: 1 },
    { x: 4950, y: 2300, size: 1.15 },
    { x: 3900, y: 2300, size: 1.2 },
    { x: 4100, y: 3000, size: 1.1 },
    { x: 5600, y: 2950, size: 1.2 },
    { x: 1600, y: 3050, size: 1.1 },
    { x: 260, y: 2600, size: 1 },
  ];
}
