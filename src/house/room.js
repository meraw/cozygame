// The inside of a house: one plain room filling the screen, seen from above like the village.

import { blockRect, createGrid } from '../world/grid.js';

const CELL_SIZE = 40;
// How far the player's body reaches around the point under their feet.
const PLAYER_RADIUS = 30;

export const room = {
  width: 2360,
  height: 1640,
  // The floor you walk on: the back wall stands above it, the front wall with the door below it
  floor: { x: 330, y: 500, width: 1700, height: 840 },
  backWallHeight: 240,
  frontWallHeight: 70,
  sideWallWidth: 40,
};

const doorX = room.floor.x + room.floor.width / 2;
const floorBottom = room.floor.y + room.floor.height;

// The way out: a door in the middle of the front wall, with a mat in front of it.
export const roomDoor = {
  area: { left: doorX - 100, right: doorX + 100, top: floorBottom - 110, bottom: floorBottom + room.frontWallHeight + 20 },
  step: { x: doorX, y: floorBottom - 60 },
};

// Only the floor can be walked on, keeping the player's body off the side and front walls.
// Feet can go right up to the back wall, which the body then stands in front of.
export function buildRoomGrid() {
  const grid = createGrid(room.width, room.height, CELL_SIZE);
  const { floor } = room;
  blockRect(grid, 0, 0, room.width, floor.y + 10);
  blockRect(grid, 0, floorBottom - PLAYER_RADIUS, room.width, room.height);
  blockRect(grid, 0, 0, floor.x + PLAYER_RADIUS, room.height);
  blockRect(grid, floor.x + floor.width - PLAYER_RADIUS, 0, room.width, room.height);
  return grid;
}
