// Recognises double taps: a second tap soon after the first, close to the same spot on screen.
// Positions are in the game's screen units (the screen is 2360 wide), times in milliseconds.
const MAX_DELAY = 400;
const MAX_DISTANCE = 120;

export function createDoubleTapDetector() {
  let lastTap = null;
  return (tap) => {
    const isDouble =
      lastTap !== null &&
      tap.time - lastTap.time <= MAX_DELAY &&
      Math.hypot(tap.x - lastTap.x, tap.y - lastTap.y) <= MAX_DISTANCE;
    // After a double tap, the next tap starts a new pair
    lastTap = isDouble ? null : tap;
    return isDouble;
  };
}
