// Moves a point along a list of waypoints by a given distance.
// Returns the new position and the waypoints still ahead (empty once the walk is over).
export function stepAlong(position, waypoints, distance) {
  let { x, y } = position;
  let remaining = distance;
  for (let i = 0; i < waypoints.length; i++) {
    const target = waypoints[i];
    const gap = Math.hypot(target.x - x, target.y - y);
    if (gap > remaining) {
      x += ((target.x - x) / gap) * remaining;
      y += ((target.y - y) / gap) * remaining;
      return { x, y, waypoints: waypoints.slice(i) };
    }
    x = target.x;
    y = target.y;
    remaining -= gap;
  }
  return { x, y, waypoints: [] };
}
