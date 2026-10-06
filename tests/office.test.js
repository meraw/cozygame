import { describe, expect, test } from 'vitest';
import { buildOfficeGrid, office } from '../src/house/office.js';
import { room, roomDoor } from '../src/house/room.js';
import { village, villageDoors } from '../src/village/layout.js';
import { isNearDoor } from '../src/world/doors.js';
import { isWalkable, toCell } from '../src/world/grid.js';
import { planPath } from '../src/world/pathfinding.js';

describe("the mayor's office", () => {
  const grid = buildOfficeGrid();
  const { desk } = office;
  const { floor } = room;
  const inFrontOfDesk = { x: desk.x, y: desk.y + 60 };

  test('the town hall leads into the office, and the houses into the plain room', () => {
    const doors = villageDoors(village);
    expect(doors.at(-1).interior).toBe('office');
    expect(doors.slice(0, -1).every((door) => door.interior === 'room')).toBe(true);
  });

  test('you come in standing on free floor at the door', () => {
    const cell = toCell(grid, roomDoor.step);
    expect(isWalkable(grid, cell.col, cell.row)).toBe(true);
  });

  test("you can walk up to the mayor's desk, but not through it", () => {
    const end = planPath(grid, roomDoor.step, { x: desk.x, y: desk.y - 60 }).at(-1);
    expect(end.y).toBeGreaterThan(desk.y);
    expect(end.y - desk.y).toBeLessThan(100);
  });

  test('you can get all around the room, past the furniture', () => {
    const spots = [
      inFrontOfDesk,
      { x: floor.x + 60, y: floor.y + floor.height / 2 },
      { x: floor.x + floor.width - 60, y: floor.y + 40 },
      { x: floor.x + floor.width - 60, y: floor.y + floor.height - 60 },
      { x: floor.x + 60, y: floor.y + floor.height - 60 },
    ];
    for (const spot of spots) {
      const cell = toCell(grid, spot);
      expect(isWalkable(grid, cell.col, cell.row)).toBe(true);
      expect(planPath(grid, roomDoor.step, spot)?.at(-1)).toEqual(spot);
    }
  });

  test('from the desk, one tap on the door walks you back to it', () => {
    const end = planPath(grid, inFrontOfDesk, { x: roomDoor.step.x, y: roomDoor.area.bottom - 20 }).at(-1);
    expect(isNearDoor(end, roomDoor)).toBe(true);
  });
});
