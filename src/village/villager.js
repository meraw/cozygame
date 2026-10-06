import { Walker } from '../scenes/walker.js';

// Someone from the village out for a walk: warm skin, so not a vampire, and the phone gets
// nothing from them. They stroll up and down the road between Meredith's house and the square,
// and stop to wait whenever Meredith comes close.
// TODO(owner): who this is, and the real character art

const COLORS = {
  hat: 0xe8c878,
  hatShade: 0xc9a352,
  hatBand: 0xa5452a,
  skin: 0xdba882,
  moustache: 0xb3aca3,
  face: 0x3b2a20,
  shirt: 0x6f8f4a,
  pocket: 0x5c7a3c,
  braces: 0x4a3222,
  trousers: 0x7a5534,
  boots: 0x3e2a1e,
  shadow: 0x4a2410,
};

const WIDTH = 130;
const HEIGHT = 210;
const FEET_Y = 200;
// Slower than Meredith: just strolling
const WALK_SPEED = 230;
// Where they walk about
const STROLL_AREA = { left: 400, right: 2500, top: 1790, bottom: 2110 };
// When Meredith comes this close (world units), they stop and wait for her
const WAIT_DISTANCE = 380;

export class Villager {
  constructor(scene, grid, start) {
    this.walker = new Walker(scene, grid, start, { createFigure: createVillagerFigure, speed: WALK_SPEED });
    this.pause = 1500;
  }

  // meredith: where Meredith stands right now
  update(delta, meredith) {
    const { walker } = this;
    const { player } = walker;
    if (Math.hypot(meredith.x - player.x, meredith.y - player.y) < WAIT_DISTANCE) {
      walker.stop();
      walker.figure.setFlipX(meredith.x < player.x);
      this.pause = 1200;
    } else if (walker.waypoints.length === 0) {
      this.pause -= delta;
      if (this.pause <= 0) {
        const { left, right, top, bottom } = STROLL_AREA;
        walker.walkTo(left + Math.random() * (right - left), top + Math.random() * (bottom - top));
        this.pause = 1500 + Math.random() * 2500;
      }
    }
    walker.update(delta);
  }
}

// Like Meredith's figure: a container standing at (x, y) holding a shadow and the figure.
function createVillagerFigure(scene, x, y) {
  if (!scene.textures.exists('villager')) {
    const g = scene.make.graphics({}, false);
    g.translateCanvas(WIDTH / 2, FEET_Y);
    drawVillager(g);
    g.generateTexture('villager', WIDTH, HEIGHT);
    g.destroy();
  }
  const shadow = scene.add.ellipse(-10, 0, 84, 26, COLORS.shadow, 0.25);
  const figure = scene.add.image(0, 0, 'villager').setOrigin(0.5, FEET_Y / HEIGHT);
  const container = scene.add.container(x, y, [shadow, figure]).setDepth(y);
  return { container, figure };
}

// A farmer in a straw hat, a green shirt with braces and brown trousers, with a grey moustache.
// The hat's brim sticks out to the right: the way they're facing.
function drawVillager(g) {
  g.fillStyle(COLORS.trousers);
  g.fillRoundedRect(-22, -52, 19, 50, 6);
  g.fillRoundedRect(3, -52, 19, 50, 6);
  g.fillStyle(COLORS.boots);
  g.fillEllipse(-12, -3, 28, 12, 12);
  g.fillEllipse(14, -3, 28, 12, 12);

  g.fillStyle(COLORS.shirt);
  g.fillRoundedRect(-46, -104, 16, 50, 8);
  g.fillRoundedRect(30, -104, 16, 50, 8);
  g.fillRoundedRect(-36, -108, 72, 62, 18);
  g.fillStyle(COLORS.pocket);
  g.fillRoundedRect(8, -92, 18, 16, 4);
  g.fillStyle(COLORS.braces);
  g.fillRect(-21, -106, 7, 58);
  g.fillRect(14, -106, 7, 58);
  g.fillStyle(COLORS.skin);
  g.fillCircle(-38, -52, 8);
  g.fillCircle(38, -52, 8);

  g.fillCircle(0, -132, 28);
  g.fillStyle(COLORS.face);
  g.fillCircle(-7, -136, 3.5);
  g.fillCircle(13, -136, 3.5);
  g.fillStyle(COLORS.moustache);
  g.fillEllipse(-3, -122, 18, 9, 8);
  g.fillEllipse(13, -122, 18, 9, 8);

  g.fillStyle(COLORS.hatShade);
  g.fillEllipse(8, -152, 108, 24, 20);
  g.fillStyle(COLORS.hat);
  g.fillRoundedRect(-24, -186, 56, 36, 12);
  g.fillStyle(COLORS.hatBand);
  g.fillRect(-24, -162, 56, 9);
  g.fillStyle(COLORS.hat);
  g.fillEllipse(8, -150, 102, 16, 20);
}
