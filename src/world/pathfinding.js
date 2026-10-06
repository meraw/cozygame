import { cellCenter, isWalkable, toCell } from './grid.js';

const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

// Plans a walk between two world points and returns the points to walk through, in order.
// A tap on something solid (a house, the pond...) walks to the closest free spot instead.
// Returns null when there's no way to get there.
export function planPath(grid, from, to) {
  const tapped = toCell(grid, to);
  const start = nearestWalkable(grid, toCell(grid, from));
  const goal = nearestWalkable(grid, tapped);
  if (!start || !goal) return null;

  const cells = findPath(grid, start, goal);
  if (!cells) return null;

  const end = goal.col === tapped.col && goal.row === tapped.row ? { x: to.x, y: to.y } : cellCenter(grid, goal);
  const points = [{ x: from.x, y: from.y }, ...cells.slice(1, -1).map((cell) => cellCenter(grid, cell)), end];
  return smoothPath(grid, points).slice(1);
}

// A* search over the grid. Diagonal steps are only allowed when both side cells are free,
// so a path never cuts across the corner of an obstacle.
// Returns the cells from start to goal, or null when the goal can't be reached.
export function findPath(grid, start, goal) {
  if (!isWalkable(grid, start.col, start.row) || !isWalkable(grid, goal.col, goal.row)) return null;

  const { cols, rows } = grid;
  const startIndex = start.row * cols + start.col;
  const goalIndex = goal.row * cols + goal.col;
  const cost = new Float64Array(cols * rows).fill(Infinity);
  const cameFrom = new Int32Array(cols * rows).fill(-1);
  const done = new Uint8Array(cols * rows);
  const open = new MinHeap();
  cost[startIndex] = 0;
  open.push(startIndex, distanceEstimate(start.col, start.row, goal));

  while (open.size > 0) {
    const current = open.pop();
    if (current === goalIndex) return rebuildPath(cameFrom, current, cols);
    if (done[current]) continue;
    done[current] = 1;

    const col = current % cols;
    const row = (current - col) / cols;
    for (const [dc, dr] of NEIGHBORS) {
      const nextCol = col + dc;
      const nextRow = row + dr;
      if (!isWalkable(grid, nextCol, nextRow)) continue;
      const diagonal = dc !== 0 && dr !== 0;
      if (diagonal && !(isWalkable(grid, col + dc, row) && isWalkable(grid, col, row + dr))) continue;

      const next = nextRow * cols + nextCol;
      const nextCost = cost[current] + (diagonal ? Math.SQRT2 : 1);
      if (nextCost < cost[next]) {
        cost[next] = nextCost;
        cameFrom[next] = current;
        open.push(next, nextCost + distanceEstimate(nextCol, nextRow, goal));
      }
    }
  }
  return null;
}

// The walkable cell closest to the given one (the cell itself if it's walkable).
export function nearestWalkable(grid, cell) {
  if (isWalkable(grid, cell.col, cell.row)) return cell;
  let best = null;
  let bestDistance = Infinity;
  const maxRadius = Math.max(grid.cols, grid.rows);
  // Search outwards in square rings; a ring further out than the best find can't beat it.
  for (let radius = 1; radius <= maxRadius && radius <= bestDistance; radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== radius) continue;
        const distance = Math.hypot(dc, dr);
        if (distance < bestDistance && isWalkable(grid, cell.col + dc, cell.row + dr)) {
          best = { col: cell.col + dc, row: cell.row + dr };
          bestDistance = distance;
        }
      }
    }
  }
  return best;
}

// Whether a straight line between two world points only crosses walkable cells.
// Visits every cell the line touches; passing exactly through a corner needs both side cells free.
export function hasLineOfSight(grid, a, b) {
  const size = grid.cellSize;
  let col = Math.floor(a.x / size);
  let row = Math.floor(a.y / size);
  const endCol = Math.floor(b.x / size);
  const endRow = Math.floor(b.y / size);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const stepCol = Math.sign(dx);
  const stepRow = Math.sign(dy);
  const crossX = stepCol === 0 ? Infinity : size / Math.abs(dx);
  const crossY = stepRow === 0 ? Infinity : size / Math.abs(dy);
  let nextX = stepCol === 0 ? Infinity : ((stepCol > 0 ? col + 1 : col) * size - a.x) / dx;
  let nextY = stepRow === 0 ? Infinity : ((stepRow > 0 ? row + 1 : row) * size - a.y) / dy;

  if (!isWalkable(grid, col, row)) return false;
  let stepsLeft = Math.abs(endCol - col) + Math.abs(endRow - row);
  while ((col !== endCol || row !== endRow) && stepsLeft > 0) {
    if (nextX < nextY) {
      col += stepCol;
      nextX += crossX;
      stepsLeft -= 1;
    } else if (nextY < nextX) {
      row += stepRow;
      nextY += crossY;
      stepsLeft -= 1;
    } else {
      if (!isWalkable(grid, col + stepCol, row) || !isWalkable(grid, col, row + stepRow)) return false;
      col += stepCol;
      row += stepRow;
      nextX += crossX;
      nextY += crossY;
      stepsLeft -= 2;
    }
    if (!isWalkable(grid, col, row)) return false;
  }
  return true;
}

// Drops the zig-zag points of a grid path: from each point, walk straight to the
// furthest following point that can be reached in a straight line.
export function smoothPath(grid, points) {
  const result = [points[0]];
  let anchor = 0;
  while (anchor < points.length - 1) {
    let next = anchor + 1;
    while (next + 1 < points.length && hasLineOfSight(grid, points[anchor], points[next + 1])) next++;
    result.push(points[next]);
    anchor = next;
  }
  return result;
}

// Diagonal-aware distance on the grid, ignoring obstacles (never overestimates).
function distanceEstimate(col, row, goal) {
  const dx = Math.abs(goal.col - col);
  const dy = Math.abs(goal.row - row);
  return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
}

function rebuildPath(cameFrom, index, cols) {
  const cells = [];
  for (let i = index; i !== -1; i = cameFrom[i]) {
    cells.push({ col: i % cols, row: Math.floor(i / cols) });
  }
  return cells.reverse();
}

// A small priority queue: pop() always returns the item with the lowest priority.
class MinHeap {
  items = [];
  priorities = [];

  get size() {
    return this.items.length;
  }

  push(item, priority) {
    const { items, priorities } = this;
    let i = items.length;
    items.push(item);
    priorities.push(priority);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (priorities[parent] <= priority) break;
      items[i] = items[parent];
      priorities[i] = priorities[parent];
      i = parent;
    }
    items[i] = item;
    priorities[i] = priority;
  }

  pop() {
    const { items, priorities } = this;
    const top = items[0];
    const lastItem = items.pop();
    const lastPriority = priorities.pop();
    if (items.length > 0) {
      let i = 0;
      for (;;) {
        let child = 2 * i + 1;
        if (child >= items.length) break;
        if (child + 1 < items.length && priorities[child + 1] < priorities[child]) child++;
        if (priorities[child] >= lastPriority) break;
        items[i] = items[child];
        priorities[i] = priorities[child];
        i = child;
      }
      items[i] = lastItem;
      priorities[i] = lastPriority;
    }
    return top;
  }
}
