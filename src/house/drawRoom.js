import { room, roomDoor } from './room.js';

const COLORS = {
  outside: 0x3a2416,
  wall: 0xefece6,
  wallShade: 0xdcd7ce,
  floor: 0xfbf9f5,
  door: 0x8c5a3a,
  doorFrame: 0x5e3d24,
  knob: 0xe0b14a,
  mat: 0xd9cbb8,
};

// A plain white room, the same in every house for now.
// TODO(owner): what the inside of each house looks like
export function drawRoom(scene) {
  const g = scene.add.graphics().setDepth(-100000);
  const { floor, backWallHeight, frontWallHeight, sideWallWidth: side } = room;
  const top = floor.y - backWallHeight;
  const bottom = floor.y + floor.height;

  g.fillStyle(COLORS.outside);
  g.fillRect(0, 0, room.width, room.height);

  // Back wall, with a skirting board along the floor
  g.fillStyle(COLORS.wall);
  g.fillRect(floor.x, top, floor.width, backWallHeight);
  g.fillStyle(COLORS.wallShade);
  g.fillRect(floor.x, floor.y - 16, floor.width, 16);

  g.fillStyle(COLORS.floor);
  g.fillRect(floor.x, floor.y, floor.width, floor.height);

  // Side walls and front wall, seen from above
  g.fillStyle(COLORS.wallShade);
  g.fillRect(floor.x - side, top, side, bottom + frontWallHeight - top);
  g.fillRect(floor.x + floor.width, top, side, bottom + frontWallHeight - top);
  g.fillRect(floor.x - side, bottom, floor.width + 2 * side, frontWallHeight);

  // The door in the front wall, and a mat in front of it
  const doorX = roomDoor.step.x;
  g.fillStyle(COLORS.mat);
  g.fillRoundedRect(doorX - 90, bottom - 84, 180, 68, 12);
  g.fillStyle(COLORS.doorFrame);
  g.fillRect(doorX - 85, bottom - 6, 170, frontWallHeight + 6);
  g.fillStyle(COLORS.door);
  g.fillRect(doorX - 75, bottom, 150, frontWallHeight);
  g.fillStyle(COLORS.knob);
  g.fillCircle(doorX + 50, bottom + frontWallHeight / 2, 7);
}
