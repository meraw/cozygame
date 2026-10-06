import { describe, expect, test } from 'vitest';
import { buildWalkGrid, restorableNames, village, villageDoors } from '../src/village/layout.js';
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

  test('every door, including the town hall, can be walked to', () => {
    for (const { step } of villageDoors(village)) {
      expect(planPath(grid, village.start, step)?.at(-1)).toEqual(step);
    }
  });

  test("Nora and Meredith's house, one bench, one field and the roundabout have been drained of life, each saved by its own name", () => {
    expect(restorableNames(village)).toEqual(['student-house', 'square-bench', 'west-field', 'roundabout']);
  });
});

describe('the roundabout', () => {
  const { roundabout, square } = village;

  test('stands in the middle of the square, instead of the fountain', () => {
    expect(roundabout).toMatchObject({ x: square.x, y: square.y });
    expect(roundabout.radius).toBeLessThan(square.radius - 100);
    expect(village.fountain).toBeUndefined();
  });

  test('can be walked all the way round, but not across', () => {
    const around = [0, 1, 2, 3].map((quarter) => {
      const angle = (quarter * Math.PI) / 2;
      const distance = roundabout.radius + 75;
      return { x: roundabout.x + Math.cos(angle) * distance, y: roundabout.y + Math.sin(angle) * distance };
    });
    for (const spot of around) {
      const cell = toCell(grid, spot);
      expect(isWalkable(grid, cell.col, cell.row)).toBe(true);
      expect(planPath(grid, village.start, spot)?.at(-1)).toEqual(spot);
    }
    const middle = toCell(grid, roundabout);
    expect(isWalkable(grid, middle.col, middle.row)).toBe(false);
  });

  test('says LEIRA, in letters that fit inside its kerb', () => {
    const { text, letterWidth, gap, baseline } = roundabout.sign;
    expect(text).toBe('LEIRA');
    const width = text.length * letterWidth + (text.length - 1) * gap;
    const roomAtBaseline = 2 * Math.sqrt(roundabout.radius ** 2 - baseline ** 2);
    expect(width).toBeLessThan(roomAtBaseline - 30);
  });
});
