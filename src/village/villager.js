import { Walker } from '../scenes/walker.js';
import { cellCenter, isWalkable, toCell } from '../world/grid.js';

// Someone from the crowd (src/world/crowd.js) out for a stroll on their own stretch of the
// village. They stop to wait whenever Meredith comes close, vampires too, so they don't give
// themselves away. A harvested vampire hurries off home instead, and someone tapped with the
// phone by mistake is offended.
// TODO(owner): who these people are, and the real character art

const COLORS = {
  hat: 0xe8c878,
  hatShade: 0xc9a352,
  hatBand: 0xa5452a,
  cap: 0x5a4a3c,
  capShade: 0x46392e,
  headscarf: 0xc0563a,
  headscarfDots: 0xf3e3c3,
  eyes: 0x3b2a20,
  vampireEyes: 0xb0202e,
  braces: 0x4a3222,
  boots: 0x3e2a1e,
  shadow: 0x4a2410,
  bubble: 0xfbf3e2,
  bubbleEdge: 0x5a3a22,
  bubbleText: '#a5452a',
};

const WIDTH = 130;
const HEIGHT = 210;
const FEET_Y = 200;
// Slower than Meredith: just strolling
const WALK_SPEED = 230;
// A harvested vampire hurrying off home: faster, and gone after this long
const HURRY_SPEED = 520;
const HURRY_MS = 2600;
// When Meredith comes this close (world units), they stop and wait for her
const WAIT_DISTANCE = 380;
// Where the road leaves the village at either end, for a vampire heading home
const ROAD_ENDS = [
  { x: 60, y: 1900 },
  { x: 5940, y: 1900 },
];

export class Villager {
  // person: one of the crowd, from crowdOfTheDay()
  constructor(scene, grid, person) {
    this.scene = scene;
    this.person = person;
    const start = startingPoint(grid, person.area);
    this.walker = new Walker(scene, grid, start, {
      createFigure: (s, x, y) => createVillagerFigure(s, x, y, person),
      speed: WALK_SPEED,
    });
    this.pause = Math.random() * 2000;
    this.leaving = false;
  }

  // meredith: where Meredith stands right now
  update(delta, meredith) {
    const { walker } = this;
    const { player } = walker;
    if (this.leaving) {
      // Hurrying off: no stopping for anyone
    } else if (Math.hypot(meredith.x - player.x, meredith.y - player.y) < WAIT_DISTANCE) {
      walker.stop();
      walker.figure.setFlipX(meredith.x < player.x);
      this.pause = 1200;
    } else if (walker.waypoints.length === 0) {
      this.pause -= delta;
      if (this.pause <= 0) {
        const { left, right, top, bottom } = this.person.area;
        walker.walkTo(left + Math.random() * (right - left), top + Math.random() * (bottom - top));
        this.pause = 1500 + Math.random() * 2500;
      }
    }
    walker.update(delta);
  }

  // A shiver, as the phone pulls the life energy out of them.
  flinch() {
    const { figure } = this.walker;
    this.scene.tweens.add({ targets: figure, x: 7, duration: 45, yoyo: true, repeat: 5, onComplete: () => figure.setX(0) });
  }

  // A harvested vampire hurries off home along the road, the nearest way out, and fades away.
  // gone() is called once they have.
  hurryOff(gone) {
    const { scene, walker } = this;
    this.leaving = true;
    const { x } = walker.player;
    const end = ROAD_ENDS.reduce((best, here) => (Math.abs(here.x - x) < Math.abs(best.x - x) ? here : best));
    scene.time.delayedCall(700, () => {
      walker.speed = HURRY_SPEED;
      walker.walkTo(end.x, end.y);
    });
    scene.tweens.add({
      targets: walker.player,
      alpha: 0,
      delay: HURRY_MS - 600,
      duration: 600,
      onComplete: () => {
        walker.player.destroy();
        gone();
      },
    });
  }

  // Tapped with the phone by mistake: a startled "?!" pops up over their head.
  offended() {
    const { scene, walker } = this;
    const bubble = scene.add.container(30, -250);
    const back = scene.add.graphics();
    back.fillStyle(COLORS.bubbleEdge);
    back.fillRoundedRect(-44, -36, 88, 72, 30);
    back.fillTriangle(-24, 30, -4, 30, -34, 56);
    back.fillStyle(COLORS.bubble);
    back.fillRoundedRect(-38, -30, 76, 60, 24);
    back.fillTriangle(-22, 26, -8, 26, -30, 46);
    const text = scene.add
      .text(0, 2, '?!', { fontFamily: 'ui-rounded, "Segoe UI", sans-serif', fontSize: '52px', fontStyle: 'bold', color: COLORS.bubbleText })
      .setOrigin(0.5);
    bubble.add([back, text]).setScale(0.3);
    walker.player.add(bubble);
    scene.tweens.add({ targets: bubble, scale: 1, duration: 220, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: bubble, alpha: 0, delay: 1800, duration: 300, onComplete: () => bubble.destroy() });
    this.pause = 2500;
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.walker.player);
    this.walker.player.destroy();
  }
}

// The middle of someone's stretch of the village, or the nearest walkable spot along the road
// from there, if the middle is taken (by the roundabout, say).
function startingPoint(grid, area) {
  const middle = toCell(grid, { x: (area.left + area.right) / 2, y: (area.top + area.bottom) / 2 });
  for (let step = 0; step < grid.cols; step++) {
    for (const col of [middle.col - step, middle.col + step]) {
      if (isWalkable(grid, col, middle.row)) return cellCenter(grid, { col, row: middle.row });
    }
  }
  return cellCenter(grid, middle);
}

// Like Meredith's figure: a container standing at (x, y) holding a shadow and the figure.
function createVillagerFigure(scene, x, y, person) {
  const { look, isVampire } = person;
  const key = ['person', look.skin, look.hat, look.top, look.trousers, look.hair, look.moustache, isVampire].join('-');
  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({}, false);
    g.translateCanvas(WIDTH / 2, FEET_Y);
    drawVillager(g, look, isVampire);
    g.generateTexture(key, WIDTH, HEIGHT);
    g.destroy();
  }
  const shadow = scene.add.ellipse(-10, 0, 84, 26, COLORS.shadow, 0.25);
  const figure = scene.add.image(0, 0, key).setOrigin(0.5, FEET_Y / HEIGHT);
  const container = scene.add.container(x, y, [shadow, figure]).setDepth(y);
  return { container, figure };
}

// A villager in a work shirt with braces and trousers, maybe a moustache, and a straw hat, a
// flat cap, a headscarf or just their hair. Anything with a front sticks out to the right: the
// way they're facing. A vampire looks just the same, but with pale skin and red eyes.
function drawVillager(g, look, isVampire) {
  g.fillStyle(look.trousers);
  g.fillRoundedRect(-22, -52, 19, 50, 6);
  g.fillRoundedRect(3, -52, 19, 50, 6);
  g.fillStyle(COLORS.boots);
  g.fillEllipse(-12, -3, 28, 12, 12);
  g.fillEllipse(14, -3, 28, 12, 12);

  g.fillStyle(look.top);
  g.fillRoundedRect(-46, -104, 16, 50, 8);
  g.fillRoundedRect(30, -104, 16, 50, 8);
  g.fillRoundedRect(-36, -108, 72, 62, 18);
  g.fillStyle(0x000000, 0.15);
  g.fillRoundedRect(8, -92, 18, 16, 4);
  g.fillStyle(COLORS.braces);
  g.fillRect(-21, -106, 7, 58);
  g.fillRect(14, -106, 7, 58);
  g.fillStyle(look.skin);
  g.fillCircle(-38, -52, 8);
  g.fillCircle(38, -52, 8);

  // Head and hair
  g.fillCircle(0, -132, 28);
  g.fillStyle(look.hair);
  g.fillEllipse(-4, -150, 58, 30, 16);
  g.fillCircle(-24, -136, 10);
  g.fillStyle(isVampire ? COLORS.vampireEyes : COLORS.eyes);
  g.fillCircle(-7, -136, 3.5);
  g.fillCircle(13, -136, 3.5);
  if (look.moustache) {
    g.fillStyle(look.hair);
    g.fillEllipse(-3, -122, 18, 9, 8);
    g.fillEllipse(13, -122, 18, 9, 8);
  }

  if (look.hat === 'straw') {
    g.fillStyle(COLORS.hatShade);
    g.fillEllipse(8, -152, 108, 24, 20);
    g.fillStyle(COLORS.hat);
    g.fillRoundedRect(-24, -186, 56, 36, 12);
    g.fillStyle(COLORS.hatBand);
    g.fillRect(-24, -162, 56, 9);
    g.fillStyle(COLORS.hat);
    g.fillEllipse(8, -150, 102, 16, 20);
  } else if (look.hat === 'cap') {
    g.fillStyle(COLORS.cap);
    g.fillEllipse(0, -156, 64, 30, 16);
    g.fillStyle(COLORS.capShade);
    g.fillEllipse(26, -148, 34, 10, 10);
  } else if (look.hat === 'headscarf') {
    g.fillStyle(COLORS.headscarf);
    g.fillEllipse(-2, -152, 66, 36, 16);
    g.fillTriangle(-30, -150, -46, -118, -20, -132);
    g.fillStyle(COLORS.headscarfDots);
    for (const [dx, dy] of [
      [-14, -160],
      [6, -164],
      [18, -152],
      [-4, -148],
    ]) {
      g.fillCircle(dx, dy, 3);
    }
  }
}
