import { describe, expect, test } from 'vitest';
import { room, roomDoor } from '../src/house/room.js';
import { buildStudentRoomGrid, studentRoom } from '../src/house/studentRoom.js';
import { isNearDoor } from '../src/world/doors.js';
import { isWalkable, toCell } from '../src/world/grid.js';
import { planPath } from '../src/world/pathfinding.js';

describe("Nora and Meredith's room", () => {
  const grid = buildStudentRoomGrid();
  const { desk, bunkBed, chairs } = studentRoom;
  const { floor } = room;
  const byTheWindow = { x: roomDoor.step.x, y: floor.y + 60 };

  test('you come in standing on free floor at the door', () => {
    const cell = toCell(grid, roomDoor.step);
    expect(isWalkable(grid, cell.col, cell.row)).toBe(true);
  });

  test('you can walk up to the desk and the bunk bed, but not through them', () => {
    for (const furniture of [desk, bunkBed]) {
      const end = planPath(grid, roomDoor.step, { x: furniture.x, y: furniture.y - 80 }).at(-1);
      expect(end.y).toBeGreaterThan(furniture.y);
      expect(end.y - furniture.y).toBeLessThan(100);
    }
  });

  test('the desk chairs are in the way too', () => {
    for (const chair of chairs) {
      const cell = toCell(grid, { x: chair.x, y: chair.y - 20 });
      expect(isWalkable(grid, cell.col, cell.row)).toBe(false);
    }
  });

  test('you can get all around the room, past the furniture', () => {
    const spots = [
      byTheWindow,
      { x: bunkBed.x, y: bunkBed.y + 60 },
      { x: (chairs[0].x + chairs[1].x) / 2, y: desk.y + 60 },
      { x: floor.x + 60, y: desk.y + 80 },
      { x: floor.x + floor.width - 60, y: floor.y + floor.height - 60 },
      { x: floor.x + 60, y: floor.y + floor.height - 60 },
    ];
    for (const spot of spots) {
      const cell = toCell(grid, spot);
      expect(isWalkable(grid, cell.col, cell.row)).toBe(true);
      expect(planPath(grid, roomDoor.step, spot)?.at(-1)).toEqual(spot);
    }
  });

  test('from the window, one tap on the door walks you back to it', () => {
    const end = planPath(grid, byTheWindow, { x: roomDoor.step.x, y: roomDoor.area.bottom - 20 }).at(-1);
    expect(isNearDoor(end, roomDoor)).toBe(true);
  });
});
