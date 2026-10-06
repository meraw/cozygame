import Phaser from 'phaser';
import { EAVE, ROOF_HEIGHT } from './layout.js';

// Placeholder colors, loosely following the [PROPOSED] village palette in design.md.
const COLORS = {
  skyTop: 0xf6e7c8,
  skyBottom: 0xf0c08f,
  hills: [0xbcc5cc, 0x9eaab4, 0x83919c],
  mist: 0xf8efe0,
  hedge: 0x6c7838,
  grass: 0x8f9b55,
  grassDark: 0x7f8b49,
  grassLight: 0xa0ab66,
  dirt: 0xd8b679,
  dirtEdge: 0xc4a062,
  stone: 0xcbc1b3,
  stoneEdge: 0xb3a99b,
  soil: 0x8a5a3b,
  furrow: 0x74492f,
  sprout: 0x6f8a3a,
  water: 0x7ea7b8,
  waterLight: 0xa8c8d2,
  waterEdge: 0x6c8f9d,
  flowers: [0xe8a33d, 0xd9772b, 0xf3e6d0, 0xb9a3d6],
  walls: [0xcfc4b4, 0xe6d8bf, 0xd9b77a, 0xc9b8a3],
  roofs: [0xc0623b, 0xb4552f, 0xc96f3a, 0xa94f32],
  chimney: 0x8f8579,
  door: 0x8c4a2f,
  window: 0xf2b84b,
  frame: 0x6b4a32,
  trunk: 0x6b4a32,
  canopies: [0x6f7d3a, 0x87903f, 0xb8692e],
  wood: 0x9a7650,
  woodDark: 0x6e5236,
  lampPost: 0x4a3f36,
  lampLight: 0xf6d58a,
  rock: 0xa59d92,
  rockLight: 0xbdb6ac,
  shadow: 0x000000,
};

const GROUND_DEPTH = -100000;
const FENCE_STEP = 80;

// Draws the whole village. The flat ground is one drawing under everything; anything that
// stands up (houses, trees...) is its own picture, layered by how far down the screen its
// base is, so the player walks behind things above them and in front of things below.
export function drawVillage(scene, village) {
  const ground = scene.add.graphics().setDepth(GROUND_DEPTH);
  drawBackdrop(ground, village);
  drawGround(ground, village);

  village.houses.forEach((house, i) => {
    const width = house.width + 2 * EAVE + 40;
    const height = house.wall + ROOF_HEIGHT + 64;
    const picture = makePicture(scene, `house-${i}`, width, height, width / 2, height - 24, (g) => drawHouse(g, house, i));
    place(scene, picture, house.x, house.baseY);
  });

  const trees = COLORS.canopies.map((canopy, i) => makePicture(scene, `tree-${i}`, 250, 280, 125, 260, (g) => drawTree(g, canopy)));
  village.trees.forEach((tree, i) => place(scene, trees[i % trees.length], tree.x, tree.y, tree.size));

  const lamp = makePicture(scene, 'lamp', 80, 230, 40, 220, drawLamp);
  village.lamps.forEach((spot) => place(scene, lamp, spot.x, spot.y));

  const bench = makePicture(scene, 'bench', 200, 110, 100, 100, drawBench);
  village.benches.forEach((spot) => place(scene, bench, spot.x, spot.y));

  const rock = makePicture(scene, 'rock', 120, 80, 60, 70, (g) => drawRock(g, 40));
  village.rocks.forEach((spot) => place(scene, rock, spot.x, spot.y, spot.size / 40));

  const fencePost = makePicture(scene, 'fence-post', 30, 70, 15, 62, drawFencePost);
  const fenceAcross = makePicture(scene, 'fence-across', 100, 70, 10, 62, drawFenceAcross);
  const fenceDown = makePicture(scene, 'fence-down', 30, 140, 15, 132, drawFenceDown);
  for (const fence of village.fences) {
    place(scene, fencePost, fence.x, fence.y);
    for (let step = FENCE_STEP; step <= fence.length; step += FENCE_STEP) {
      if (fence.direction === 'across') place(scene, fenceAcross, fence.x + step - FENCE_STEP, fence.y);
      else place(scene, fenceDown, fence.x, fence.y + step);
    }
    if (fence.direction === 'across') place(scene, fencePost, fence.x + fence.length, fence.y);
  }

  const { fountain } = village;
  const size = fountain.radius * 2 + 40;
  const fountainPicture = makePicture(scene, 'fountain', size, size + 120, size / 2, size / 2 + 120, (g) =>
    drawFountain(g, fountain.radius),
  );
  place(scene, fountainPicture, fountain.x, fountain.y);
}

// Draws once into a texture, so the game doesn't redraw every shape on every frame.
// (anchorX, anchorY) is the point of the picture that sits on the ground.
function makePicture(scene, key, width, height, anchorX, anchorY, draw) {
  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({}, false);
    g.translateCanvas(anchorX, anchorY);
    draw(g);
    g.generateTexture(key, width, height);
    g.destroy();
  }
  return { key, originX: anchorX / width, originY: anchorY / height };
}

function place(scene, picture, x, y, scale = 1) {
  return scene.add.image(x, y, picture.key).setOrigin(picture.originX, picture.originY).setScale(scale).setDepth(y);
}

function drawBackdrop(g, v) {
  const top = Phaser.Display.Color.ValueToColor(COLORS.skyTop);
  const bottom = Phaser.Display.Color.ValueToColor(COLORS.skyBottom);
  const bands = 24;
  const bandHeight = v.hillsBottom / bands;
  for (let i = 0; i < bands; i++) {
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, bands - 1, i);
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
    g.fillRect(0, i * bandHeight, v.width, bandHeight + 1);
  }
  COLORS.hills.forEach((color, i) => {
    const baseY = v.hillsBottom * (0.5 + i * 0.15);
    const amplitude = 45 + i * 10;
    const wavelength = 380 + i * 90;
    const points = [{ x: 0, y: v.hillsBottom }];
    for (let x = 0; x <= v.width; x += 40) {
      points.push({ x, y: baseY - amplitude * (Math.sin(x / wavelength + i * 1.7) + 0.5 * Math.sin(x / (wavelength * 0.4) + i * 3.9)) });
    }
    points.push({ x: v.width, y: v.hillsBottom });
    g.fillStyle(color);
    g.fillPoints(points, true);
    g.fillStyle(COLORS.mist, 0.18);
    for (let x = 0; x < v.width; x += 700) g.fillEllipse(x + 350, baseY + 40, 900, 50, 24);
  });
}

function drawGround(g, v) {
  const random = seededRandom(7);

  g.fillStyle(COLORS.grass);
  g.fillRect(0, v.hillsBottom, v.width, v.height - v.hillsBottom);
  for (let i = 0; i < 90; i++) {
    g.fillStyle(i % 2 ? COLORS.grassDark : COLORS.grassLight, 0.4);
    const x = random() * v.width;
    const y = v.hillsBottom + 80 + random() * (v.height - v.hillsBottom - 80);
    g.fillEllipse(x, y, 160 + random() * 240, 50 + random() * 60, 16);
  }
  g.fillStyle(COLORS.hedge);
  g.fillRect(0, v.hillsBottom - 6, v.width, 26);

  const { road } = v;
  g.fillStyle(COLORS.dirtEdge);
  g.fillRect(0, road.y - road.halfWidth - 8, v.width, road.halfWidth * 2 + 16);
  for (const lane of v.lanes) g.fillRect(lane.x - 6, lane.y, lane.width + 12, lane.height);
  g.fillStyle(COLORS.dirt);
  g.fillRect(0, road.y - road.halfWidth, v.width, road.halfWidth * 2);
  for (const lane of v.lanes) g.fillRect(lane.x, lane.y, lane.width, lane.height);

  const { square } = v;
  g.fillStyle(COLORS.stoneEdge);
  g.fillCircle(square.x, square.y, square.radius + 14);
  g.fillStyle(COLORS.stone);
  g.fillCircle(square.x, square.y, square.radius);
  g.lineStyle(6, COLORS.stoneEdge, 0.7);
  g.strokeCircle(square.x, square.y, square.radius * 0.66);

  for (const field of v.fields) {
    g.fillStyle(COLORS.soil);
    g.fillRect(field.x, field.y, field.width, field.height);
    for (let y = field.y + 40; y < field.y + field.height - 20; y += 60) {
      g.fillStyle(COLORS.furrow);
      g.fillRect(field.x + 16, y, field.width - 32, 12);
      g.fillStyle(COLORS.sprout);
      for (let x = field.x + 50; x < field.x + field.width - 30; x += 70) {
        g.fillTriangle(x - 12, y + 4, x + 12, y + 4, x, y - 24);
      }
    }
  }

  const { pond } = v;
  g.fillStyle(COLORS.waterEdge);
  g.fillEllipse(pond.x, pond.y, pond.radiusX * 2 + 28, pond.radiusY * 2 + 28, 48);
  g.fillStyle(COLORS.water);
  g.fillEllipse(pond.x, pond.y, pond.radiusX * 2, pond.radiusY * 2, 48);
  g.fillStyle(COLORS.waterLight, 0.6);
  g.fillEllipse(pond.x - pond.radiusX * 0.3, pond.y - pond.radiusY * 0.35, pond.radiusX * 0.8, pond.radiusY * 0.3, 24);
  g.fillStyle(COLORS.sprout);
  g.fillEllipse(pond.x + 220, pond.y + 70, 56, 28, 12);
  g.fillEllipse(pond.x + 290, pond.y + 20, 44, 22, 12);

  // Flowers on both sides of every door
  for (const house of v.houses) {
    drawFlowers(g, house.x - 110, house.baseY + 40, random);
    drawFlowers(g, house.x + 110, house.baseY + 40, random);
  }
}

function drawFlowers(g, x, y, random) {
  for (let i = 0; i < 7; i++) {
    g.fillStyle(COLORS.flowers[Math.floor(random() * COLORS.flowers.length)]);
    g.fillEllipse(x + (random() - 0.5) * 80, y + (random() - 0.5) * 30, 16, 14, 8);
  }
}

function drawHouse(g, house, index) {
  const w = house.width;
  const h = house.wall;
  const roofTop = -h - ROOF_HEIGHT;

  g.fillStyle(COLORS.shadow, 0.18);
  g.fillEllipse(0, 4, w + 70, 36, 24);

  g.fillStyle(COLORS.walls[index % COLORS.walls.length]);
  g.fillRect(-w / 2, -h, w, h);
  g.fillStyle(COLORS.shadow, 0.08);
  g.fillRect(-w / 2, -26, w, 26);

  if (index % 2 === 0) {
    g.fillStyle(COLORS.chimney);
    g.fillRect(w / 4, roofTop - 30, 36, 80);
  }

  // Seen from above at an angle, the roof is a wide trapezoid
  g.fillStyle(COLORS.roofs[index % COLORS.roofs.length]);
  g.fillPoints(
    [
      { x: -w / 2 - EAVE, y: -h },
      { x: w / 2 + EAVE, y: -h },
      { x: w / 2 - 30, y: roofTop },
      { x: -w / 2 + 30, y: roofTop },
    ],
    true,
  );
  g.fillStyle(COLORS.shadow, 0.12);
  for (let y = roofTop + 40; y < -h; y += 40) g.fillRect(-w / 2 - 10, y, w + 20, 5);
  g.fillStyle(COLORS.shadow, 0.2);
  g.fillRect(-w / 2 - EAVE, -h - 12, w + 2 * EAVE, 12);
  g.fillStyle(0xffffff, 0.15);
  g.fillRect(-w / 2 + 30, roofTop, w - 60, 14);

  g.fillStyle(COLORS.door);
  g.fillRoundedRect(-36, -116, 72, 116, { tl: 32, tr: 32, bl: 0, br: 0 });
  g.fillStyle(COLORS.window);
  g.fillCircle(20, -56, 5);

  for (const x of [-w / 2 + 34, w / 2 - 34 - 64]) {
    const y = -h + 44;
    g.fillStyle(COLORS.window);
    g.fillRect(x, y, 64, 56);
    g.lineStyle(6, COLORS.frame);
    g.strokeRect(x, y, 64, 56);
    g.lineBetween(x + 32, y, x + 32, y + 56);
  }
}

function drawTree(g, canopy) {
  g.fillStyle(COLORS.shadow, 0.16);
  g.fillEllipse(0, 0, 130, 36, 20);
  g.fillStyle(COLORS.trunk);
  g.fillRect(-14, -80, 28, 80);
  g.fillStyle(canopy);
  g.fillCircle(-52, -120, 62);
  g.fillCircle(52, -120, 62);
  g.fillCircle(0, -165, 82);
  g.fillStyle(0xffffff, 0.12);
  g.fillCircle(-22, -190, 38);
}

function drawLamp(g) {
  g.fillStyle(COLORS.shadow, 0.15);
  g.fillEllipse(0, 0, 50, 16, 12);
  g.fillStyle(COLORS.lampPost);
  g.fillRect(-6, -170, 12, 170);
  g.fillRect(-14, -12, 28, 12);
  g.fillStyle(COLORS.lampLight, 0.35);
  g.fillCircle(0, -186, 30);
  g.fillStyle(COLORS.lampLight);
  g.fillRect(-12, -200, 24, 30);
  g.fillStyle(COLORS.lampPost);
  g.fillRect(-16, -206, 32, 8);
}

function drawBench(g) {
  g.fillStyle(COLORS.shadow, 0.15);
  g.fillEllipse(0, 0, 180, 24, 16);
  g.fillStyle(COLORS.woodDark);
  g.fillRect(-70, -40, 10, 40);
  g.fillRect(60, -40, 10, 40);
  g.fillRect(-74, -88, 8, 44);
  g.fillRect(66, -88, 8, 44);
  g.fillStyle(COLORS.wood);
  g.fillRect(-80, -48, 160, 14);
  g.fillRect(-80, -88, 160, 12);
  g.fillRect(-80, -70, 160, 10);
}

function drawRock(g, size) {
  g.fillStyle(COLORS.shadow, 0.15);
  g.fillEllipse(0, 0, size * 2.4, size * 0.7, 16);
  g.fillStyle(COLORS.rock);
  g.fillEllipse(0, -size * 0.45, size * 2.1, size * 1.3, 20);
  g.fillStyle(COLORS.rockLight);
  g.fillEllipse(-size * 0.3, -size * 0.7, size * 0.9, size * 0.5, 12);
}

function drawFencePost(g) {
  g.fillStyle(COLORS.woodDark);
  g.fillRect(-6, -56, 12, 56);
}

// One stretch of fence going across the screen: rails out to the right, post on the left.
function drawFenceAcross(g) {
  g.fillStyle(COLORS.wood);
  g.fillRect(0, -46, FENCE_STEP, 8);
  g.fillRect(0, -26, FENCE_STEP, 8);
  drawFencePost(g);
}

// One stretch of fence going down the screen: rails up to the previous post, post at the bottom.
function drawFenceDown(g) {
  g.fillStyle(COLORS.wood);
  g.fillRect(-4, -FENCE_STEP - 46, 8, FENCE_STEP + 28);
  drawFencePost(g);
}

function drawFountain(g, radius) {
  g.fillStyle(COLORS.shadow, 0.15);
  g.fillCircle(6, 10, radius + 8);
  g.fillStyle(COLORS.stoneEdge);
  g.fillCircle(0, 0, radius);
  g.fillStyle(COLORS.water);
  g.fillCircle(0, 0, radius - 16);
  g.fillStyle(COLORS.waterLight, 0.6);
  g.fillEllipse(-radius * 0.3, -radius * 0.35, radius * 0.7, radius * 0.25, 16);
  g.fillStyle(COLORS.stoneEdge);
  g.fillRect(-14, -110, 28, 110);
  g.fillStyle(COLORS.stone);
  g.fillEllipse(0, -110, 76, 26, 16);
  g.fillStyle(COLORS.waterLight, 0.9);
  g.fillCircle(0, -130, 14);
  g.fillCircle(-26, -100, 8);
  g.fillCircle(26, -100, 8);
}

// The same "random" numbers every time, so the village always looks the same.
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
