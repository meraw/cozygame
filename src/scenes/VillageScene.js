import Phaser from 'phaser';
import { save } from '../save.js';
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
    this.restorables = drawVillage(this, village);
    this.showLooks();
    // A drained thing changes look as soon as the save changes (for now, from the ?debug switches)
    const stopWatching = save.onChange(() => this.showLooks());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, stopWatching);
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

  // Shows each drained thing the way the save has it: restored, or still decayed.
  showLooks() {
    for (const [name, { image, looks }] of Object.entries(this.restorables)) {
      const look = save.isRestored(name) ? looks.restored : looks.decayed;
      image.setTexture(look.key).setOrigin(look.originX, look.originY);
    }
  }

  update(time, delta) {
    this.walker.update(delta);
  }
}
