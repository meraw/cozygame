import Phaser from 'phaser';
import { addSunsetLight, drawVillage } from '../village/drawVillage.js';
import { buildWalkGrid, houseDoors, village } from '../village/layout.js';
import { addBuildLabel } from './buildLabel.js';
import { fadeIn, listenForTaps } from './doorTaps.js';
import { Walker } from './walker.js';

const MARKER_COLOR = 0xfff0c8;

export class VillageScene extends Phaser.Scene {
  constructor() {
    super('Village');
  }

  // data.fromHouse: the house the player just came out of, if any
  create(data) {
    const grid = buildWalkGrid(village);
    const doors = houseDoors(village.houses);
    drawVillage(this, village);
    addSunsetLight(this);

    const start = Number.isInteger(data?.fromHouse) ? doors[data.fromHouse].step : village.start;
    this.walker = new Walker(this, grid, start, MARKER_COLOR);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, village.width, village.height);
    camera.startFollow(this.walker.player, true, 0.1, 0.1);
    fadeIn(this);

    addBuildLabel(this);
    listenForTaps(this, this.walker, doors, (house) => this.scene.start('House', { house }));
  }

  update(time, delta) {
    this.walker.update(delta);
  }
}
