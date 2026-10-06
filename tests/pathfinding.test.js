import { describe, expect, test } from 'vitest';
import { blockRect, createGrid, isWalkable, toCell } from '../src/world/grid.js';
import { stepAlong } from '../src/world/movement.js';
import { findPath, nearestWalkable, planPath } from '../src/world/pathfinding.js';

// 10 x 10 cells, each 10 units wide
function openGrid() {
  return createGrid(100, 100, 10);
}

describe('findPath', () => {
  test('walks straight across an empty grid', () => {
    const path = findPath(openGrid(), { col: 0, row: 5 }, { col: 9, row: 5 });
    expect(path).toHaveLength(10);
    expect(path.every((cell) => cell.row === 5)).toBe(true);
  });

  test('goes around a wall instead of through it', () => {
    const grid = openGrid();
    blockRect(grid, 50, 0, 10, 80); // column 5, rows 0-7: the only way past is through the bottom
    const path = findPath(grid, { col: 0, row: 0 }, { col: 9, row: 0 });
    expect(path.every((cell) => isWalkable(grid, cell.col, cell.row))).toBe(true);
    expect(path.some((cell) => cell.row >= 8)).toBe(true);
  });

  test('gives up when the goal is walled off', () => {
    const grid = openGrid();
    blockRect(grid, 50, 0, 10, 100);
    expect(findPath(grid, { col: 0, row: 0 }, { col: 9, row: 0 })).toBeNull();
  });

  test('never cuts across the corner of an obstacle', () => {
    const grid = openGrid();
    blockRect(grid, 50, 50, 10, 10); // the single cell (5, 5)
    const path = findPath(grid, { col: 4, row: 4 }, { col: 6, row: 6 });
    for (let i = 1; i < path.length; i++) {
      const [a, b] = [path[i - 1], path[i]];
      if (a.col !== b.col && a.row !== b.row) {
        expect(isWalkable(grid, b.col, a.row) && isWalkable(grid, a.col, b.row)).toBe(true);
      }
    }
  });
});

describe('nearestWalkable', () => {
  test('finds the closest free cell next to an obstacle', () => {
    const grid = openGrid();
    blockRect(grid, 30, 30, 40, 40); // cells 3-6 in both directions
    expect(nearestWalkable(grid, { col: 3, row: 4 })).toEqual({ col: 2, row: 4 });
  });
});

describe('planPath', () => {
  test('walks in one straight line to the exact tapped spot when nothing is in the way', () => {
    expect(planPath(openGrid(), { x: 5, y: 5 }, { x: 87, y: 42 })).toEqual([{ x: 87, y: 42 }]);
  });

  test('a tap on an obstacle walks to the closest free spot instead', () => {
    const grid = openGrid();
    blockRect(grid, 30, 30, 40, 40);
    const end = planPath(grid, { x: 5, y: 45 }, { x: 35, y: 45 }).at(-1);
    expect(end).toEqual({ x: 25, y: 45 });
    const cell = toCell(grid, end);
    expect(isWalkable(grid, cell.col, cell.row)).toBe(true);
  });

  test('every step of a walk around an obstacle stays on free ground', () => {
    const grid = openGrid();
    blockRect(grid, 30, 0, 40, 70);
    const path = planPath(grid, { x: 5, y: 5 }, { x: 95, y: 5 });
    let from = { x: 5, y: 5 };
    for (const point of path) {
      for (let t = 0; t <= 1; t += 0.05) {
        const cell = toCell(grid, { x: from.x + (point.x - from.x) * t, y: from.y + (point.y - from.y) * t });
        expect(isWalkable(grid, cell.col, cell.row)).toBe(true);
      }
      from = point;
    }
    expect(path.at(-1)).toEqual({ x: 95, y: 5 });
  });
});

describe('stepAlong', () => {
  test('moves part of the way towards the next point', () => {
    expect(stepAlong({ x: 0, y: 0 }, [{ x: 10, y: 0 }], 4)).toEqual({ x: 4, y: 0, waypoints: [{ x: 10, y: 0 }] });
  });

  test('turns corners and stops at the last point', () => {
    const halfway = stepAlong({ x: 0, y: 0 }, [{ x: 10, y: 0 }, { x: 10, y: 10 }], 15);
    expect(halfway).toEqual({ x: 10, y: 5, waypoints: [{ x: 10, y: 10 }] });
    expect(stepAlong(halfway, halfway.waypoints, 100)).toEqual({ x: 10, y: 10, waypoints: [] });
  });
});
