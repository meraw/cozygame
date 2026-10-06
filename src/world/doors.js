// Doors the player can go through: double-tap the door while standing close to it.
// A door is { area: { left, top, right, bottom }, step: { x, y } }: the area you can tap,
// and the spot in front of it where you stand, both in world units.

// How close to the door's step the player must be.
export const DOOR_REACH = 150;

// Which door (its index in the list) is at a world point, or -1 if there's none.
export function doorAt(doors, point) {
  return doors.findIndex(
    ({ area }) => point.x >= area.left && point.x <= area.right && point.y >= area.top && point.y <= area.bottom,
  );
}

export function isNearDoor(position, door) {
  return Math.hypot(position.x - door.step.x, position.y - door.step.y) <= DOOR_REACH;
}
