// The mayor's office inside the town hall: the same room as the houses, furnished.

import { blockEllipse, blockRect } from '../world/grid.js';
import { buildRoomGrid, room } from './room.js';

// How far the player's body reaches around the point under their feet.
const PLAYER_RADIUS = 30;

// Where each piece of furniture stands, in the room's world units (y is its front edge on the floor).
export const office = {
  // The desk's back reaches the wall: behind it is the mayor's side
  desk: { x: 1180, y: 800, width: 520 },
  mayorChair: { x: 1180, y: 690 },
  visitorChairs: [
    { x: 1050, y: 1000 },
    { x: 1310, y: 1000 },
  ],
  cabinet: { x: 520, y: 590, width: 260 },
  banner: { x: 800, y: 760 },
  flags: [
    { x: 1580, y: 760, kind: 'italy' },
    { x: 1680, y: 760, kind: 'europe' },
  ],
};

// The room's floor, minus the furniture (grown by the player's radius, like everything solid).
export function buildOfficeGrid() {
  const grid = buildRoomGrid();
  const pad = PLAYER_RADIUS;
  const solidRect = (x, y, width, height) => blockRect(grid, x - pad, y - pad, width + 2 * pad, height + 2 * pad);
  const { desk, cabinet, banner, flags, visitorChairs } = office;
  const wallFoot = room.floor.y;
  solidRect(desk.x - desk.width / 2, wallFoot, desk.width, desk.y - wallFoot);
  solidRect(cabinet.x - cabinet.width / 2, wallFoot, cabinet.width, cabinet.y - wallFoot);
  for (const chair of visitorChairs) solidRect(chair.x - 40, chair.y - 50, 80, 50);
  for (const pole of [banner, ...flags]) blockEllipse(grid, pole.x, pole.y, 20 + pad, 14 + pad);
  return grid;
}
