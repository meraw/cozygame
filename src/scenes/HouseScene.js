import Phaser from 'phaser';
import { drawRoom } from '../house/drawRoom.js';
import { buildRoomGrid, room, roomDoor } from '../house/room.js';
import { addBuildLabel } from './buildLabel.js';
import { fadeIn, listenForTaps } from './doorTaps.js';
import { Walker } from './walker.js';

const MARKER_COLOR = 0xb8a48c;

// Inside a house or the town hall: a plain room. Its door leads back out to the building the player came from.
export class HouseScene extends Phaser.Scene {
  constructor() {
    super('House');
  }

  // data.building: which building (the index of its door in the village) the player went into
  create(data) {
    drawRoom(this);
    this.walker = new Walker(this, buildRoomGrid(), roomDoor.step, MARKER_COLOR);
    this.cameras.main.setBounds(0, 0, room.width, room.height);
    fadeIn(this);
    addBuildLabel(this);
    listenForTaps(this, this.walker, [roomDoor], () => this.scene.start('Village', { fromBuilding: data.building }));
  }

  update(time, delta) {
    this.walker.update(delta);
  }
}
