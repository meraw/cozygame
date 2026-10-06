import Phaser from 'phaser';
import { drawOffice } from '../house/drawOffice.js';
import { drawRoom } from '../house/drawRoom.js';
import { drawStudentRoom } from '../house/drawStudentRoom.js';
import { createMayor, mayorLines } from '../house/mayor.js';
import { createNora } from '../house/nora.js';
import { buildOfficeGrid, isOnMayor, office } from '../house/office.js';
import { buildRoomGrid, room, roomDoor } from '../house/room.js';
import { buildStudentRoomGrid, studentRoom } from '../house/studentRoom.js';
import { characters } from '../world/characters.js';
import { Conversation } from '../world/conversation.js';
import { isOnCharacter } from '../world/harvest.js';
import { addBuildLabel } from './buildLabel.js';
import { DialogueBox } from './dialogueBox.js';
import { fadeIn, listenForTaps } from './doorTaps.js';
import { Phone } from './phone.js';
import { Walker } from './walker.js';

// What can be inside a building: how to draw it, where you can walk, and the colour of the tap ring.
const INTERIORS = {
  room: { draw: drawRoom, buildGrid: buildRoomGrid, markerColor: 0xb8a48c },
  office: { draw: drawOffice, buildGrid: buildOfficeGrid, markerColor: 0xf6e7c8 },
  student: { draw: drawStudentRoom, buildGrid: buildStudentRoomGrid, markerColor: 0xa8845e },
};

// Inside a house (a plain room, or Nora and Meredith's room, with Nora at home) or the town hall
// (the mayor's office, with the Mayor to talk to). Its door leads back out to the building the
// player came from.
export class HouseScene extends Phaser.Scene {
  constructor() {
    super('House');
  }

  // data.building: which building (the index of its door in the village) the player went into
  // data.interior: what's inside it ('room', 'student' or 'office')
  create(data) {
    this.interior = data.interior ?? 'room';
    const inside = INTERIORS[this.interior];
    inside.draw(this);
    this.walker = new Walker(this, inside.buildGrid(), roomDoor.step, { markerColor: inside.markerColor });
    this.cameras.main.setBounds(0, 0, room.width, room.height);
    fadeIn(this);
    addBuildLabel(this);

    // Who's in here, for the phone to be pointed at
    const people = [];
    this.dialogueBox = null;
    this.talk = null;
    if (this.interior === 'office') {
      this.mayor = createMayor(this, office.mayor.x, office.mayor.y);
      this.dialogueBox = new DialogueBox(this);
      people.push({ ...characters.mayor, feet: () => office.mayor, isTappedAt: isOnMayor, flinch() {} });
    }
    if (this.interior === 'student') {
      const nora = createNora(this, studentRoom.nora);
      people.push({
        ...characters.nora,
        feet: () => studentRoom.nora,
        isTappedAt: (point) => isOnCharacter(studentRoom.nora, point),
        flinch: () => nora.flinch(),
      });
    }
    this.phone = new Phone(this, this.walker, people);

    listenForTaps(
      this,
      this.walker,
      [roomDoor],
      () => this.scene.start('Village', { fromBuilding: data.building }),
      (tapped, pointer) => this.handleTap(tapped, pointer),
    );
  }

  // Every tap comes here first; returns true if it was used up (then the player doesn't walk).
  // While the Mayor is talking, every tap shows his next line, and the tap after his last line
  // closes the box. Otherwise the phone gets the tap, then tapping the Mayor starts a conversation.
  handleTap(tapped, pointer) {
    if (this.dialogueBox?.isOpen) {
      if (this.talk.next()) this.showLine();
      else this.dialogueBox.hide();
      return true;
    }
    if (this.phone.tap(tapped, pointer)) return true;
    if (this.interior === 'office' && isOnMayor(tapped) && mayorLines.length > 0) {
      this.walker.stop();
      this.talk = new Conversation(mayorLines);
      this.showLine();
      return true;
    }
    return false;
  }

  showLine() {
    this.dialogueBox.show(this.talk.line);
    this.mayor.say();
  }

  update(time, delta) {
    this.walker.update(delta);
  }
}
