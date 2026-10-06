import Phaser from 'phaser';
import { createPlayer } from '../village/drawPlayer.js';
import { addSunsetLight, drawVillage } from '../village/drawVillage.js';
import { buildWalkGrid, village } from '../village/layout.js';
import { stepAlong } from '../world/movement.js';
import { planPath } from '../world/pathfinding.js';

// World units per second (the screen is 2360 units wide).
const WALK_SPEED = 650;
const MARKER_COLOR = 0xfff0c8;
const FONT = 'ui-rounded, "Segoe UI", system-ui, sans-serif';

export class VillageScene extends Phaser.Scene {
  constructor() {
    super('Village');
  }

  create() {
    this.grid = buildWalkGrid(village);
    drawVillage(this, village);
    addSunsetLight(this);

    const { container, figure } = createPlayer(this, village.start.x, village.start.y);
    this.player = container;
    this.figure = figure;
    this.waypoints = [];
    this.walkClock = 0;

    const camera = this.cameras.main;
    camera.setBounds(0, 0, village.width, village.height);
    camera.startFollow(this.player, true, 0.1, 0.1);

    // Shows which version is live, so we can tell whether the tablet is showing an old copy.
    this.add
      .text(this.scale.width - 40, this.scale.height - 30, `build ${__BUILD_ID__}`, {
        fontFamily: FONT,
        fontSize: '32px',
        color: '#f8efe0',
      })
      .setOrigin(1, 1)
      .setAlpha(0.8)
      .setScrollFactor(0)
      .setDepth(1e9);

    this.input.on('pointerdown', (pointer) => this.walkTo(pointer.worldX, pointer.worldY));
  }

  walkTo(x, y) {
    const path = planPath(this.grid, this.player, { x, y });
    if (!path?.length) return;
    this.waypoints = path;
    const end = path[path.length - 1];
    this.showMarker(end.x, end.y);
  }

  // A ring on the ground where the player is heading.
  showMarker(x, y) {
    const marker = this.add.ellipse(x, y, 110, 44).setStrokeStyle(8, MARKER_COLOR, 0.9).setDepth(y - 1);
    this.tweens.add({
      targets: marker,
      scale: 1.6,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => marker.destroy(),
    });
  }

  update(time, delta) {
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
