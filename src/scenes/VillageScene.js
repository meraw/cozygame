import Phaser from 'phaser';
import { addSunsetLight, drawVillage } from '../village/drawVillage.js';
import { buildWalkGrid, village, villageDoors } from '../village/layout.js';
import { addBuildLabel } from './buildLabel.js';
import { fadeIn, listenForTaps } from './doorTaps.js';
import { Walker } from './walker.js';

const MARKER_COLOR = 0xfff0c8;

export class VillageScene extends Phaser.Scene {
  constructor() {
    super('Village');
  }

  // data.fromBuilding: the building (index of its door) the player just came out of, if any
  create(data) {
    const grid = buildWalkGrid(village);
    const doors = villageDoors(village);
    drawVillage(this, village);
    addSunsetLight(this);

    const start = Number.isInteger(data?.fromBuilding) ? doors[data.fromBuilding].step : village.start;
    this.walker = new Walker(this, grid, start, MARKER_COLOR);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, village.width, village.height);
    camera.startFollow(this.walker.player, true, 0.1, 0.1);
    fadeIn(this);

    addBuildLabel(this);
    listenForTaps(this, this.walker, doors, (building) =>
      this.scene.start('House', { building, interior: doors[building].interior }),
    );
  }

  update(time, delta) {
    this.walker.update(delta);
  }
}
