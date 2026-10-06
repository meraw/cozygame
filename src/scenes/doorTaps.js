import Phaser from 'phaser';
import { createDoubleTapDetector } from '../world/doubleTap.js';
import { doorAt, isNearDoor } from '../world/doors.js';

const FADE_MS = 250;

// Taps make the player walk. A double tap on a door she's standing at fades the screen
// to black, then calls goThrough with that door's index in the list.
// onTap gets each tap first (where in the world, and the pointer, for buttons fixed on screen)
// and returns true if it used the tap up, for example to talk to someone; then the player
// doesn't walk.
export function listenForTaps(scene, walker, doors, goThrough, onTap = () => false) {
  const isDoubleTap = createDoubleTapDetector();
  let leaving = false;
  scene.input.on('pointerdown', (pointer) => {
    if (leaving) return;
    const tapped = { x: pointer.worldX, y: pointer.worldY };
    if (onTap(tapped, pointer)) return;
    if (isDoubleTap({ time: pointer.downTime, x: pointer.x, y: pointer.y })) {
      const index = doorAt(doors, tapped);
      if (index >= 0 && isNearDoor(walker.player, doors[index])) {
        leaving = true;
        walker.stop();
        scene.cameras.main.fadeOut(FADE_MS, 0, 0, 0);
        scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => goThrough(index));
        return;
      }
    }
    walker.walkTo(tapped.x, tapped.y);
  });
}

export function fadeIn(scene) {
  scene.cameras.main.fadeIn(FADE_MS, 0, 0, 0);
}
