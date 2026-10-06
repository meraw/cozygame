// Nora and Meredith's room in their student house: the same room as the other houses, furnished.
// Along the back wall, left to right: a long desk for two, the window, and a bunk bed.

import { blockRect } from '../world/grid.js';
import { buildRoomGrid, room } from './room.js';

// How far the player's body reaches around the point under their feet.
const PLAYER_RADIUS = 30;

// Where everything is, in the room's world units. For furniture, y is its front edge on the floor.
export const studentRoom = {
  // The desk's back reaches the wall; there's a chair for each of them in front of it
  desk: { x: 700, y: 620, width: 640 },
  chairs: [
    { x: 540, y: 720 },
    { x: 860, y: 720 },
  ],
  window: { x: 1180, width: 190 },
  // Long side against the wall, its head by the window
  bunkBed: { x: 1640, y: 700, width: 540 },
  // A long patchwork rug from the window towards the door
  rug: { x: 1180, y: 560, width: 230, height: 620 },
};

// The room's floor, minus the furniture (grown by the player's radius, like everything solid).
export function buildStudentRoomGrid() {
  const grid = buildRoomGrid();
  const pad = PLAYER_RADIUS;
  const solidRect = (x, y, width, height) => blockRect(grid, x - pad, y - pad, width + 2 * pad, height + 2 * pad);
  const { desk, chairs, bunkBed } = studentRoom;
  const wallFoot = room.floor.y;
  solidRect(desk.x - desk.width / 2, wallFoot, desk.width, desk.y - wallFoot);
  solidRect(bunkBed.x - bunkBed.width / 2, wallFoot, bunkBed.width, bunkBed.y - wallFoot);
  for (const chair of chairs) solidRect(chair.x - 45, chair.y - 50, 90, 50);
  return grid;
}
