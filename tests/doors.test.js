import { describe, expect, test } from 'vitest';
import { buildRoomGrid, room, roomDoor } from '../src/house/room.js';
import { buildWalkGrid, houseDoors, village } from '../src/village/layout.js';
import { createDoubleTapDetector } from '../src/world/doubleTap.js';
import { doorAt, isNearDoor } from '../src/world/doors.js';
import { isWalkable, toCell } from '../src/world/grid.js';
import { planPath } from '../src/world/pathfinding.js';

describe('double taps', () => {
  test('two quick taps on the same spot make a double tap', () => {
    const isDoubleTap = createDoubleTapDetector();
    expect(isDoubleTap({ time: 1000, x: 500, y: 500 })).toBe(false);
    expect(isDoubleTap({ time: 1200, x: 520, y: 490 })).toBe(true);
  });

  test('taps too slow or too far apart are single taps', () => {
    const isDoubleTap = createDoubleTapDetector();
    isDoubleTap({ time: 1000, x: 500, y: 500 });
    expect(isDoubleTap({ time: 1600, x: 500, y: 500 })).toBe(false);
    expect(isDoubleTap({ time: 1700, x: 900, y: 500 })).toBe(false);
  });

  test('a third quick tap starts a new pair', () => {
    const isDoubleTap = createDoubleTapDetector();
    isDoubleTap({ time: 1000, x: 500, y: 500 });
    expect(isDoubleTap({ time: 1150, x: 500, y: 500 })).toBe(true);
    expect(isDoubleTap({ time: 1300, x: 500, y: 500 })).toBe(false);
  });
});

describe('house doors', () => {
  const grid = buildWalkGrid(village);
  const doors = houseDoors(village.houses);

  test('a tap on the middle of a door finds that house', () => {
    village.houses.forEach((house, i) => {
      expect(doorAt(doors, { x: house.x, y: house.baseY - 56 })).toBe(i);
    });
  });

  test('a tap on a roof or on the grass is not a door', () => {
    const house = village.houses[0];
    expect(doorAt(doors, { x: house.x, y: house.baseY - house.wall - 60 })).toBe(-1);
    expect(doorAt(doors, village.start)).toBe(-1);
  });

  test('one tap on a door walks the player close enough to go in', () => {
    village.houses.forEach((house, i) => {
      const end = planPath(grid, village.start, { x: house.x, y: house.baseY - 56 }).at(-1);
      expect(isNearDoor(end, doors[i])).toBe(true);
    });
  });

  test('from the start of the village every door is out of reach', () => {
    for (const door of doors) expect(isNearDoor(village.start, door)).toBe(false);
  });

  test('coming back out, the player stands on free ground in front of the door', () => {
    for (const door of doors) {
      const cell = toCell(grid, door.step);
      expect(isWalkable(grid, cell.col, cell.row)).toBe(true);
      expect(isNearDoor(door.step, door)).toBe(true);
    }
  });
});

describe('the room inside a house', () => {
  const grid = buildRoomGrid();

  test('you come in standing on free floor, right at the door', () => {
    const cell = toCell(grid, roomDoor.step);
    expect(isWalkable(grid, cell.col, cell.row)).toBe(true);
    expect(isNearDoor(roomDoor.step, roomDoor)).toBe(true);
  });

  test('the walls keep you inside the room', () => {
    const end = planPath(grid, roomDoor.step, { x: 50, y: 50 }).at(-1);
    expect(end.x).toBeGreaterThan(room.floor.x);
    expect(end.y).toBeGreaterThan(room.floor.y);
  });

  test('from the far corner, one tap on the door walks you back to it', () => {
    const corner = { x: room.floor.x + 60, y: room.floor.y + 40 };
    expect(isNearDoor(corner, roomDoor)).toBe(false);
    const end = planPath(grid, corner, { x: roomDoor.step.x, y: roomDoor.area.bottom - 20 }).at(-1);
    expect(isNearDoor(end, roomDoor)).toBe(true);
  });
});
