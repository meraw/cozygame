import Phaser from 'phaser';
import { drawOffice } from '../house/drawOffice.js';
import { drawRoom } from '../house/drawRoom.js';
import { buildOfficeGrid } from '../house/office.js';
import { buildRoomGrid, room, roomDoor } from '../house/room.js';
import { addBuildLabel } from './buildLabel.js';
import { fadeIn, listenForTaps } from './doorTaps.js';
import { Walker } from './walker.js';

// What can be inside a building: how to draw it, where you can walk, and the colour of the tap ring.
const INTERIORS = {
  room: { draw: drawRoom, buildGrid: buildRoomGrid, markerColor: 0xb8a48c },
  office: { draw: drawOffice, buildGrid: buildOfficeGrid, markerColor: 0xf6e7c8 },
};

// Inside a house (a plain room) or the town hall (the mayor's office).
// Its door leads back out to the building the player came from.
export class HouseScene extends Phaser.Scene {
  constructor() {
    super('House');
  }

  // data.building: which building (the index of its door in the village) the player went into
  // data.interior: what's inside it ('room' or 'office')
  create(data) {
    this.interior = data.interior ?? 'room';
    const inside = INTERIORS[this.interior];
    inside.draw(this);
    this.walker = new Walker(this, inside.buildGrid(), roomDoor.step, inside.markerColor);
    this.cameras.main.setBounds(0, 0, room.width, room.height);
    fadeIn(this);
    addBuildLabel(this);
    listenForTaps(this, this.walker, [roomDoor], () => this.scene.start('Village', { fromBuilding: data.building }));
  }

  update(time, delta) {
    this.walker.update(delta);
  }
}
