import { describe, expect, test } from 'vitest';
import { buildWalkGrid, village } from '../src/village/layout.js';
import { isWalkable, toCell } from '../src/world/grid.js';
import { planPath } from '../src/world/pathfinding.js';

// How much of the village the screen shows at once, in world units (the game's size).
const SCREEN = { width: 2360, height: 1640 };
const grid = buildWalkGrid(village);

// Where the camera's left edge is when it's centred on the player (it stops at the village edges).
function cameraLeft(playerX) {
  return Math.min(Math.max(playerX - SCREEN.width / 2, 0), village.width - SCREEN.width);
}

// Plays like a person crossing the village: each tap lands on the main road,
// 90% of the way towards the screen edge they're heading for.
function tapsToCross(fromX, toX) {
  const direction = Math.sign(toX - fromX);
  let position = { x: fromX, y: village.road.y };
  for (let taps = 1; taps <= 50; taps++) {
    const left = cameraLeft(position.x);
    const tap = { x: left + SCREEN.width * (direction > 0 ? 0.9 : 0.1), y: village.road.y };
    const path = planPath(grid, position, tap);
    if (path?.length) position = path.at(-1);
    if ((toX - position.x) * direction <= 0) return taps;
  }
  return Infinity;
}

describe('the village', () => {
  test('is wider than the screen, so crossing it takes walking', () => {
    expect(village.width).toBeGreaterThan(SCREEN.width * 2);
  });

  test('the player starts on free ground', () => {
    const cell = toCell(grid, village.start);
    expect(isWalkable(grid, cell.col, cell.row)).toBe(true);
  });

  test('can be crossed from left to right in under 20 taps', () => {
    expect(tapsToCross(village.start.x, village.width - 300)).toBeLessThan(20);
  });

  test('can be crossed from right to left in under 20 taps', () => {
    expect(tapsToCross(village.width - 300, 300)).toBeLessThan(20);
  });

  test('every house door can be walked to', () => {
    for (const house of village.houses) {
      const doorstep = { x: house.x, y: house.baseY + 60 };
      expect(planPath(grid, village.start, doorstep)?.at(-1)).toEqual(doorstep);
    }
  });
});
