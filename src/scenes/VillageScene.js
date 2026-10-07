import Phaser from 'phaser';
import { clock } from '../clock.js';
import { save } from '../save.js';
import { Daylight } from '../village/daylight.js';
import { addSunsetLight, drawVillage } from '../village/drawVillage.js';
import { buildWalkGrid, restorableAt, village, villageDoors } from '../village/layout.js';
import { Villager } from '../village/villager.js';
import { characters } from '../world/characters.js';
import { isOnCharacter } from '../world/harvest.js';
import { addBuildLabel } from './buildLabel.js';
import { fadeIn, listenForTaps } from './doorTaps.js';
import { burstOfLife, Phone } from './phone.js';
import { Toast } from './toast.js';
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
    const { restorables, light } = drawVillage(this, village);
    this.restorables = restorables;
    this.daylight = new Daylight(this, village, { ...light, haze: addSunsetLight(this) });
    this.daylight.apply(clock.look());
    this.showLooks();
    // A drained thing changes look as soon as the save changes (restored by a tap, or by the
    // ?debug switches), and once restored, its lights can come on at night
    const stopWatching = save.onChange(() => {
      this.showLooks();
      this.daylight.drawDarkness();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, stopWatching);

    const start = Number.isInteger(data?.fromBuilding) ? doors[data.fromBuilding].step : village.start;
    this.walker = new Walker(this, grid, start, { markerColor: MARKER_COLOR });
    this.villager = new Villager(this, grid, village.villagerStart);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, village.width, village.height);
    camera.startFollow(this.walker.player, true, 0.1, 0.1);
    fadeIn(this);

    addBuildLabel(this);
    const villagerFeet = () => this.villager.walker.player;
    this.phone = new Phone(this, this.walker, [
      {
        isVampire: characters.villager.isVampire,
        feet: villagerFeet,
        isTappedAt: (point) => isOnCharacter(villagerFeet(), point),
        flinch() {},
      },
    ]);
    this.toast = new Toast(this);
    listenForTaps(
      this,
      this.walker,
      doors,
      (building) => this.scene.start('House', { building, interior: doors[building].interior }),
      (tapped, pointer) => this.phone.tap(tapped, pointer) || this.tapDrained(tapped),
    );
  }

  // A tap on something drained restores it, if Meredith has the life energy it takes; if not,
  // a short message says so. Returns true if the tap was on something drained.
  tapDrained(tapped) {
    const thing = restorableAt(village, tapped);
    if (!thing || save.isRestored(thing.name)) return false;
    if (save.restore(thing.name, thing.cost)) burstOfLife(this, thing.middle);
    else this.toast.show(`Not enough life energy: restoring this takes ${thing.cost}.`);
    return true;
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
    this.villager.update(delta, this.walker.player);
    // The light follows the game clock, which runs in every scene
    this.daylight.apply(clock.look());
  }
}
