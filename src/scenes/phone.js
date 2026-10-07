import Phaser from 'phaser';
import { save } from '../save.js';
import { LIFE_ENERGY_PER_HARVEST, phoneTapOn } from '../world/harvest.js';

// Meredith's bright orange phone, from the Mayor (design.md). The button in the corner takes
// it out (and puts it away again); with it out, tapping a vampire close by harvests their life
// energy, which the counter at the top keeps (in the save). Sizes are in game units.

const FONT = 'ui-rounded, "Segoe UI", system-ui, sans-serif';
const COLORS = {
  paper: 0xfbf3e2,
  border: 0x5a3a22,
  text: '#3b2a20',
  phone: 0xe0782f,
  phoneEdge: 0xb5561c,
  screen: 0x2b2522,
  energy: 0xffd36b,
  energyCore: 0xfffbe8,
  shadow: 0x000000,
};
// Over the world and the sunset light; the dialogue box still goes over it
const DEPTH = 1.5e9;
// Just over everything in the world
const EFFECTS_DEPTH = 4e8;
const BUTTON = { x: 2200, y: 1420, radius: 92 };
const COUNTER = { right: 2320, top: 36, width: 300, height: 104 };
// Where Meredith holds the phone up, from the point under her feet (on her right; her left when
// she faces left)
const IN_HAND = { x: 42, y: -80 };
// How far to the side of a vampire Meredith goes to stand, when she has to walk up to them
const SIDE_BY_SIDE = 110;
const ORBS = 8;

export class Phone {
  // walker: Meredith. people: who's in this scene, each with
  //   isVampire, feet() (where they stand now), isTappedAt(point), flinch()
  constructor(scene, walker, people) {
    this.scene = scene;
    this.walker = walker;
    this.people = people;
    this.isOut = false;
    makeTextures(scene);

    this.ring = scene.add.circle(0, 0, BUTTON.radius + 14).setStrokeStyle(12, COLORS.phone).setVisible(false);
    scene.tweens.add({ targets: this.ring, scale: 1.1, alpha: 0.5, duration: 550, yoyo: true, repeat: -1 });
    const face = scene.add.graphics();
    face.fillStyle(COLORS.shadow, 0.25);
    face.fillCircle(6, 10, BUTTON.radius);
    face.fillStyle(COLORS.border);
    face.fillCircle(0, 0, BUTTON.radius);
    face.fillStyle(COLORS.paper);
    face.fillCircle(0, 0, BUTTON.radius - 10);
    this.icon = scene.add.image(0, 0, 'phone').setAngle(-10);
    this.button = scene.add
      .container(BUTTON.x, BUTTON.y, [this.ring, face, this.icon])
      .setScrollFactor(0, 0, true)
      .setDepth(DEPTH);

    const { right, top, width, height } = COUNTER;
    const left = right - width;
    const pill = scene.add.graphics();
    pill.fillStyle(COLORS.shadow, 0.25);
    pill.fillRoundedRect(left + 6, top + 8, width, height, height / 2);
    pill.fillStyle(COLORS.border);
    pill.fillRoundedRect(left, top, width, height, height / 2);
    pill.fillStyle(COLORS.paper);
    pill.fillRoundedRect(left + 8, top + 8, width - 16, height - 16, (height - 16) / 2);
    this.orb = scene.add.image(left + height / 2 + 6, top + height / 2, 'life-orb').setScale(1.15);
    this.counter = scene.add
      .text(left + height + 8, top + height / 2 + 2, String(save.lifeEnergy), {
        fontFamily: FONT,
        fontSize: '60px',
        fontStyle: 'bold',
        color: COLORS.text,
      })
      .setOrigin(0, 0.5);
    scene.add.container(0, 0, [pill, this.orb, this.counter]).setScrollFactor(0, 0, true).setDepth(DEPTH);

    // The phone in Meredith's hand while it's out
    this.inHand = scene.add.image(IN_HAND.x, IN_HAND.y, 'phone').setScale(0.42).setAngle(-15).setVisible(false);
    walker.player.add(this.inHand);

    const stopWatching = save.onChange(() => this.showEnergy());
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, stopWatching);
  }

  // Every tap comes here first: tapped is where in the world, pointer where on the screen.
  // Returns true if the phone used the tap up.
  tap(tapped, pointer) {
    if (Math.hypot(pointer.x - BUTTON.x, pointer.y - BUTTON.y) <= BUTTON.radius) {
      this.setOut(!this.isOut);
      return true;
    }
    if (!this.isOut) return false;
    const person = this.people.find((someone) => someone.isTappedAt(tapped));
    if (!person) return false;
    const feet = person.feet();
    const meredith = this.walker.player;
    const result = phoneTapOn({ isVampire: person.isVampire, x: feet.x, y: feet.y }, meredith);
    if (result === 'harvest') {
      this.harvest(person);
    } else if (result === 'walk') {
      // Up to the vampire's side, the side she's coming from
      const side = meredith.x < feet.x ? -1 : 1;
      this.walker.walkTo(feet.x + side * SIDE_BY_SIDE, feet.y);
    }
    // Someone who isn't a vampire: nothing happens at all
    return true;
  }

  setOut(out) {
    this.isOut = out;
    this.ring.setVisible(out);
    this.icon.setAngle(out ? 10 : -10);
    this.inHand.setX(this.walker.figure.flipX ? -IN_HAND.x : IN_HAND.x).setVisible(out);
  }

  // Life energy bursts out of the vampire and streams into Meredith's phone, and the counter goes up.
  harvest(person) {
    const { scene } = this;
    const from = person.feet();
    const meredith = this.walker.player;
    this.walker.stop();
    this.setOut(false);
    const facingLeft = from.x < meredith.x;
    this.walker.figure.setFlipX(facingLeft);
    this.inHand.setX(facingLeft ? -IN_HAND.x : IN_HAND.x).setVisible(true);
    const hand = { x: meredith.x + this.inHand.x, y: meredith.y + IN_HAND.y };
    save.addLifeEnergy(LIFE_ENERGY_PER_HARVEST);
    person.flinch();
    for (let i = 0; i < ORBS; i++) {
      const angle = (i / ORBS) * Math.PI * 2;
      const orb = scene.add.image(from.x, from.y - 110, 'life-orb').setScale(0.3).setDepth(EFFECTS_DEPTH);
      scene.tweens.chain({
        targets: orb,
        tweens: [
          {
            x: from.x + Math.cos(angle) * 80,
            y: from.y - 120 + Math.sin(angle) * 70,
            scale: 0.8,
            delay: i * 50,
            duration: 260,
            ease: 'Sine.easeOut',
          },
          { x: hand.x, y: hand.y, scale: 0.3, duration: 380, ease: 'Sine.easeIn' },
        ],
        onComplete: () => orb.destroy(),
      });
    }
    scene.time.delayedCall(ORBS * 50 + 700, () => {
      if (!this.isOut) this.inHand.setVisible(false);
    });
  }

  showEnergy() {
    const { tweens } = this.scene;
    this.counter.setText(String(save.lifeEnergy));
    tweens.killTweensOf([this.counter, this.orb]);
    this.counter.setScale(1);
    this.orb.setScale(1.15);
    tweens.add({ targets: this.counter, scale: 1.25, duration: 140, yoyo: true });
    tweens.add({ targets: this.orb, scale: 1.45, duration: 140, yoyo: true });
  }
}

// A burst of life energy at `point`, as something drained comes back to life: a ring of light
// spreading out, and glowing orbs flying off in every direction.
export function burstOfLife(scene, point) {
  makeTextures(scene);
  const ring = scene.add.circle(point.x, point.y, 60).setStrokeStyle(14, COLORS.energy, 0.9).setDepth(EFFECTS_DEPTH);
  scene.tweens.add({
    targets: ring,
    scale: 3.4,
    alpha: 0,
    duration: 750,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });
  const orbs = 18;
  for (let i = 0; i < orbs; i++) {
    const angle = (i / orbs) * Math.PI * 2;
    const orb = scene.add.image(point.x, point.y, 'life-orb').setScale(0.6).setDepth(EFFECTS_DEPTH);
    scene.tweens.add({
      targets: orb,
      x: point.x + Math.cos(angle) * 210,
      y: point.y + Math.sin(angle) * 150,
      scale: 1.1,
      duration: 950,
      ease: 'Cubic.easeOut',
      onComplete: () => orb.destroy(),
    });
    scene.tweens.add({ targets: orb, alpha: 0, delay: 500, duration: 450 });
  }
}

function makeTextures(scene) {
  if (!scene.textures.exists('life-orb')) {
    const g = scene.make.graphics({}, false);
    for (let radius = 32; radius > 12; radius -= 4) {
      g.fillStyle(COLORS.energy, 0.14);
      g.fillCircle(32, 32, radius);
    }
    g.fillStyle(COLORS.energy);
    g.fillCircle(32, 32, 13);
    g.fillStyle(COLORS.energyCore);
    g.fillCircle(29, 29, 6);
    g.generateTexture('life-orb', 64, 64);
    g.destroy();
  }
  if (!scene.textures.exists('phone')) {
    const g = scene.make.graphics({}, false);
    const w = 64;
    const h = 108;
    g.fillStyle(COLORS.phoneEdge);
    g.fillRoundedRect(0, 0, w, h, 14);
    g.fillStyle(COLORS.phone);
    g.fillRoundedRect(3, 2, w - 6, h - 7, 12);
    g.fillStyle(COLORS.screen);
    g.fillRoundedRect(9, 12, w - 18, h - 34, 6);
    // On the screen, a glowing orb of life energy
    g.fillStyle(COLORS.energy, 0.35);
    g.fillCircle(w / 2, 44, 17);
    g.fillStyle(COLORS.energy);
    g.fillCircle(w / 2, 44, 10);
    g.fillStyle(COLORS.phoneEdge);
    g.fillCircle(w / 2, h - 12, 5);
    g.generateTexture('phone', w, h);
    g.destroy();
  }
}
