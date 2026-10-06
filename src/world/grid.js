// A grid laid over the world: each square cell is either walkable or blocked.

export function createGrid(worldWidth, worldHeight, cellSize) {
  const cols = Math.ceil(worldWidth / cellSize);
  const rows = Math.ceil(worldHeight / cellSize);
  return { cols, rows, cellSize, blocked: new Uint8Array(cols * rows) };
}

export function isWalkable(grid, col, row) {
  return col >= 0 && row >= 0 && col < grid.cols && row < grid.rows && grid.blocked[row * grid.cols + col] === 0;
}

// The cell under a world point (points outside the world snap to the nearest edge cell).
export function toCell(grid, point) {
  return {
    col: clamp(Math.floor(point.x / grid.cellSize), 0, grid.cols - 1),
    row: clamp(Math.floor(point.y / grid.cellSize), 0, grid.rows - 1),
  };
}

export function cellCenter(grid, cell) {
  return { x: (cell.col + 0.5) * grid.cellSize, y: (cell.row + 0.5) * grid.cellSize };
}

// Blocks every cell whose center lies inside the rectangle.
export function blockRect(grid, x, y, width, height) {
  forEachCenterIn(grid, x, y, x + width, y + height, (col, row) => block(grid, col, row));
}

// Blocks every cell whose center lies inside the ellipse.
export function blockEllipse(grid, centerX, centerY, radiusX, radiusY) {
  forEachCenterIn(grid, centerX - radiusX, centerY - radiusY, centerX + radiusX, centerY + radiusY, (col, row, x, y) => {
    if (((x - centerX) / radiusX) ** 2 + ((y - centerY) / radiusY) ** 2 <= 1) block(grid, col, row);
  });
}

function block(grid, col, row) {
  grid.blocked[row * grid.cols + col] = 1;
}

function forEachCenterIn(grid, left, top, right, bottom, visit) {
  const size = grid.cellSize;
  const firstCol = Math.max(0, Math.ceil(left / size - 0.5));
  const lastCol = Math.min(grid.cols - 1, Math.floor(right / size - 0.5));
  const firstRow = Math.max(0, Math.ceil(top / size - 0.5));
  const lastRow = Math.min(grid.rows - 1, Math.floor(bottom / size - 0.5));
  for (let row = firstRow; row <= lastRow; row++) {
    for (let col = firstCol; col <= lastCol; col++) {
      visit(col, row, (col + 0.5) * size, (row + 0.5) * size);
    }
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
