import { createPlayer } from '../village/drawPlayer.js';
import { stepAlong } from '../world/movement.js';
import { planPath } from '../world/pathfinding.js';

// World units per second (the screen is 2360 units wide).
const WALK_SPEED = 650;

// The player character in a scene: walkTo() plans a walk around obstacles, update() moves her along it.
export class Walker {
  constructor(scene, grid, start, markerColor) {
    this.scene = scene;
    this.grid = grid;
    this.markerColor = markerColor;
    const { container, figure } = createPlayer(scene, start.x, start.y);
    this.player = container;
    this.figure = figure;
    this.waypoints = [];
    this.walkClock = 0;
  }

  walkTo(x, y) {
    const path = planPath(this.grid, this.player, { x, y });
    if (!path?.length) return;
    this.waypoints = path;
    const end = path[path.length - 1];
    this.showMarker(end.x, end.y);
  }

  stop() {
    this.waypoints = [];
  }

  // A ring on the ground where the player is heading.
  showMarker(x, y) {
    const marker = this.scene.add.ellipse(x, y, 110, 44).setStrokeStyle(8, this.markerColor, 0.9).setDepth(y - 1);
    this.scene.tweens.add({
      targets: marker,
      scale: 1.6,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => marker.destroy(),
    });
  }

  update(delta) {
    if (this.waypoints.length > 0) {
      const step = stepAlong(this.player, this.waypoints, (WALK_SPEED * delta) / 1000);
      if (Math.abs(step.x - this.player.x) > 0.5) this.figure.setFlipX(step.x < this.player.x);
      this.player.setPosition(step.x, step.y).setDepth(step.y);
      this.waypoints = step.waypoints;
      this.walkClock += delta;
    } else {
      this.walkClock = 0;
    }
    // A small hop with each step while walking
    this.figure.y = -Math.abs(Math.sin(this.walkClock / 90)) * 12;
  }
}
