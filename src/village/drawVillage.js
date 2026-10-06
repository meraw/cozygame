import Phaser from 'phaser';
import { EAVE, ROOF_HEIGHT, TOWN_HALL } from './layout.js';

// Colors measured from references/mood/Borgo d'autunno al tramonto.png: an autumn village
// at sunset, lit by a low sun on the right. Everything leans warm; shadows are brown, not grey.
const COLORS = {
  skyTop: 0xd8956a,
  skyHorizon: 0xfcd593,
  sun: 0xfff3cf,
  sunGlow: 0xffd98a,
  hills: [0xc4a59c, 0xa98d88, 0x9a7a5c],
  hillTown: 0x8c726c,
  mist: 0xf6d9b8,
  orchard: [0xb8692e, 0xc98a3a],
  hedge: 0x6b5a2a,
  grass: 0xa48c44,
  grassDark: 0x8a7536,
  grassLight: 0xc0a656,
  leaves: [0xd2742a, 0xb04a24, 0xe0a23a],
  dirt: 0xd9a86c,
  dirtEdge: 0xb8875a,
  cobble: 0xbf8f63,
  cobbleLight: 0xe8c08c,
  square: 0xd6a874,
  squareEdge: 0xa9805e,
  soil: 0x7a4a2c,
  furrow: 0x5f3a22,
  sprout: 0x9a8a35,
  water: 0x6f9a9c,
  waterEdge: 0x8a7258,
  flowers: [0xe0862f, 0xb8452a, 0xf2d27a, 0xf3e2c4],
  walls: [0xc4a684, 0xb89a78, 0xccb08a, 0xae9172],
  roofs: [0xb4532c, 0xa5482a, 0xbf5f33, 0x9c4426],
  chimney: 0x8f7660,
  smoke: 0xf3e6d6,
  door: 0x5a3018,
  windowLight: 0xf6b94f,
  frame: 0x5a3a22,
  shutter: 0x66704c,
  townHallWall: 0xd6a86a,
  townHallStone: 0xc9b08e,
  flag: 0xe0782f,
  clockFace: 0xf6efe0,
  bell: 0xd9a441,
  ivy: [0xb8452a, 0x9c3a22, 0xd2742a, 0xc95b2c],
  trunk: 0x5a3a22,
  foliage: { orange: 0xd2742a, gold: 0xe0a23a, rust: 0xb04a24, olive: 0x9a8a35 },
  cypress: 0x4a5128,
  wood: 0x8a5e3a,
  woodDark: 0x5e3d24,
  lampPost: 0x3e2c20,
  lampGlow: 0xffcf7a,
  stone: 0xc9ad8a,
  stoneDark: 0xa58a6e,
  rock: 0xa58f78,
  rockLight: 0xc9b190,
  sunlight: 0xffd27a,
  shadow: 0x4a2410,
};

const GROUND_DEPTH = -100000;
const LIGHT_DEPTH = 5e8;
const FENCE_STEP = 80;
// Which kind of tree stands at each spot, in turn: mostly autumn colours, now and then a cypress.
const TREE_KINDS = ['orange', 'gold', 'rust', 'orange', 'cypress', 'gold', 'orange', 'olive', 'rust'];

// Draws the whole village. The flat ground is one drawing under everything; anything that
// stands up (houses, trees...) is its own picture, layered by how far down the screen its
// base is, so the player walks behind things above them and in front of things below.
export function drawVillage(scene, village) {
  const ground = scene.add.graphics().setDepth(GROUND_DEPTH);
  drawBackdrop(ground, village);
  drawGround(ground, village);

  village.houses.forEach((house, i) => {
    const width = house.width + 2 * EAVE + 100;
    const height = house.wall + ROOF_HEIGHT + 224;
    const picture = makePicture(scene, `house-${i}`, width, height, width / 2, height - 24, (g) => drawHouse(g, house, i));
    place(scene, picture, house.x, house.baseY);
  });

  const hall = village.townHall;
  const hallWidth = hall.width + 2 * EAVE + 200;
  const hallHeight = hall.wall + TOWN_HALL.towerHeight + TOWN_HALL.towerRoof + 140;
  const hallPicture = makePicture(scene, 'town-hall', hallWidth, hallHeight, hallWidth / 2, hallHeight - 40, (g) =>
    drawTownHall(g, hall),
  );
  place(scene, hallPicture, hall.x, hall.baseY);

  const trees = { cypress: makePicture(scene, 'tree-cypress', 140, 380, 70, 360, drawCypress) };
  for (const [kind, color] of Object.entries(COLORS.foliage)) {
    trees[kind] = makePicture(scene, `tree-${kind}`, 270, 300, 135, 280, (g) => drawTree(g, color));
  }
  village.trees.forEach((tree, i) => place(scene, trees[TREE_KINDS[i % TREE_KINDS.length]], tree.x, tree.y, tree.size));

  const lamp = makePicture(scene, 'lamp', 150, 290, 75, 270, drawLamp);
  village.lamps.forEach((spot) => place(scene, lamp, spot.x, spot.y));

  const bench = makePicture(scene, 'bench', 230, 110, 125, 100, drawBench);
  village.benches.forEach((spot) => place(scene, bench, spot.x, spot.y));

  const rock = makePicture(scene, 'rock', 140, 80, 75, 70, (g) => drawRock(g, 40));
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
  const size = fountain.radius * 2 + 60;
  const fountainPicture = makePicture(scene, 'fountain', size, size + 120, size / 2, size / 2 + 120, (g) =>
    drawFountain(g, fountain.radius),
  );
  place(scene, fountainPicture, fountain.x, fountain.y);
}

// The golden haze of the low sun (top right) and slightly darker edges, laid over the whole screen.
export function addSunsetLight(scene) {
  const { width, height } = scene.scale;
  if (!scene.textures.exists('sunset-light')) {
    // Smooth gradients look the same drawn small and stretched, and use far less memory.
    const w = width / 5;
    const h = height / 5;
    const texture = scene.textures.createCanvas('sunset-light', w, h);
    const ctx = texture.getContext();
    const haze = ctx.createRadialGradient(w * 0.95, -h * 0.1, 0, w * 0.95, -h * 0.1, w * 0.95);
    haze.addColorStop(0, 'rgba(255, 196, 112, 0.26)');
    haze.addColorStop(1, 'rgba(255, 196, 112, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, w, h);
    const edges = ctx.createRadialGradient(w / 2, h / 2, h * 0.45, w / 2, h / 2, Math.hypot(w, h) / 2);
    edges.addColorStop(0, 'rgba(90, 40, 15, 0)');
    edges.addColorStop(1, 'rgba(90, 40, 15, 0.38)');
    ctx.fillStyle = edges;
    ctx.fillRect(0, 0, w, h);
    texture.refresh();
  }
  scene.add
    .image(0, 0, 'sunset-light')
    .setOrigin(0)
    .setDisplaySize(width, height)
    .setScrollFactor(0)
    .setDepth(LIGHT_DEPTH);
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
  const bottom = Phaser.Display.Color.ValueToColor(COLORS.skyHorizon);
  const bands = 24;
  const bandHeight = v.hillsBottom / bands;
  for (let i = 0; i < bands; i++) {
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, bands - 1, i);
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
    g.fillRect(0, i * bandHeight, v.width, bandHeight + 1);
  }

  // The low sun, over on the right
  const sunX = v.width * 0.8;
  const sunY = v.hillsBottom * 0.42;
  for (let i = 5; i > 0; i--) {
    g.fillStyle(COLORS.sunGlow, 0.12);
    g.fillCircle(sunX, sunY, 70 + i * 50);
  }
  g.fillStyle(COLORS.sun);
  g.fillCircle(sunX, sunY, 70);

  COLORS.hills.forEach((color, i) => {
    const baseY = v.hillsBottom * (0.5 + i * 0.15);
    const amplitude = 45 + i * 10;
    const wavelength = 380 + i * 90;
    const surface = (x) =>
      baseY - amplitude * (Math.sin(x / wavelength + i * 1.7) + 0.5 * Math.sin(x / (wavelength * 0.4) + i * 3.9));
    const points = [{ x: 0, y: v.hillsBottom }];
    for (let x = 0; x <= v.width; x += 40) points.push({ x, y: surface(x) });
    points.push({ x: v.width, y: v.hillsBottom });
    g.fillStyle(color);
    g.fillPoints(points, true);

    if (i === 1) {
      for (const x of [1400, 4300]) drawHillTown(g, x, surface(x) + 6);
    }
    if (i === 2) {
      // Rows of round orchard trees on the nearest slope
      let count = 0;
      for (let row = 0; row < 3; row++) {
        const y = v.hillsBottom - 22 - row * 26;
        for (let x = 20 + (row % 2) * 30; x < v.width; x += 60) {
          if (y < surface(x) + 14) continue;
          g.fillStyle(COLORS.shadow, 0.25);
          g.fillRect(x - 6, y + 2, 20, 6);
          g.fillStyle(COLORS.orchard[count++ % COLORS.orchard.length]);
          g.fillRect(x - 9, y - 12, 18, 14);
        }
      }
    }
    g.fillStyle(COLORS.mist, 0.28);
    for (let x = 0; x < v.width; x += 700) g.fillEllipse(x + 350, baseY + 40, 900, 50, 24);
  });
}

// A far-away hilltop village: a huddle of houses and a bell tower.
function drawHillTown(g, x, groundY) {
  g.fillStyle(COLORS.hillTown);
  const houses = [
    [-70, 26, 30],
    [-40, 34, 40],
    [-2, 30, 34],
    [34, 40, 28],
    [70, 28, 36],
  ];
  for (const [dx, width, height] of houses) g.fillRect(x + dx - width / 2, groundY - height, width, height);
  g.fillRect(x + 12, groundY - 96, 20, 96);
  g.fillTriangle(x + 10, groundY - 96, x + 34, groundY - 96, x + 22, groundY - 116);
}

function drawGround(g, v) {
  const random = seededRandom(7);
  const grassTop = v.hillsBottom + 80;
  const grassHeight = v.height - grassTop;

  g.fillStyle(COLORS.grass);
  g.fillRect(0, v.hillsBottom, v.width, v.height - v.hillsBottom);
  for (let i = 0; i < 90; i++) {
    g.fillStyle(i % 2 ? COLORS.grassDark : COLORS.grassLight, 0.4);
    g.fillEllipse(random() * v.width, grassTop + random() * grassHeight, 160 + random() * 240, 50 + random() * 60, 16);
  }
  // Fallen leaves
  for (let i = 0; i < 700; i++) {
    const x = random() * v.width;
    const y = grassTop + random() * grassHeight;
    g.fillStyle(COLORS.leaves[i % COLORS.leaves.length], 0.85);
    g.fillTriangle(x - 10, y, x + 10, y - 4, x + 1, y - 15);
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
  // Pebbles in the road
  for (let i = 0; i < 200; i++) {
    g.fillStyle(i % 2 ? COLORS.cobble : COLORS.cobbleLight, 0.7);
    g.fillRect(random() * v.width, road.y - road.halfWidth + 10 + random() * (road.halfWidth * 2 - 30), 14, 9);
  }

  // The cobbled square, laid in rings around the fountain
  const { square } = v;
  g.fillStyle(COLORS.squareEdge);
  g.fillCircle(square.x, square.y, square.radius + 14);
  g.fillStyle(COLORS.square);
  g.fillCircle(square.x, square.y, square.radius);
  for (const ring of [160, 225, 290, 350]) {
    const stones = Math.round((2 * Math.PI * ring) / 46);
    for (let i = 0; i < stones; i++) {
      const angle = (i / stones) * Math.PI * 2 + ring;
      g.fillStyle(i % 3 ? COLORS.cobble : COLORS.cobbleLight, 0.65);
      g.fillRect(square.x + Math.cos(angle) * ring - 14, square.y + Math.sin(angle) * ring - 9, 28, 18);
    }
  }

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

  // The pond, catching the sunset
  const { pond } = v;
  g.fillStyle(COLORS.waterEdge);
  g.fillEllipse(pond.x, pond.y, pond.radiusX * 2 + 28, pond.radiusY * 2 + 28, 48);
  g.fillStyle(COLORS.water);
  g.fillEllipse(pond.x, pond.y, pond.radiusX * 2, pond.radiusY * 2, 48);
  g.fillStyle(COLORS.sunlight, 0.55);
  g.fillEllipse(pond.x + pond.radiusX * 0.25, pond.y - pond.radiusY * 0.3, pond.radiusX * 0.9, pond.radiusY * 0.22, 24);
  g.fillStyle(COLORS.sunlight, 0.3);
  g.fillEllipse(pond.x + pond.radiusX * 0.1, pond.y + pond.radiusY * 0.15, pond.radiusX * 0.6, pond.radiusY * 0.14, 24);
  g.fillStyle(COLORS.sprout);
  g.fillEllipse(pond.x - 260, pond.y + 70, 56, 28, 12);
  g.fillEllipse(pond.x - 190, pond.y + 110, 44, 22, 12);

  // Flowers on both sides of every door
  for (const house of v.houses) {
    drawFlowers(g, house.x - 110, house.baseY + 40, random);
    drawFlowers(g, house.x + 110, house.baseY + 40, random);
  }
  drawFlowers(g, v.townHall.x - 150, v.townHall.baseY + 40, random);
  drawFlowers(g, v.townHall.x + 150, v.townHall.baseY + 40, random);
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
  const random = seededRandom(index + 11);

  // Shadow, cast away from the low sun on the right
  g.fillStyle(COLORS.shadow, 0.32);
  g.fillEllipse(-34, 6, w + 90, 40, 24);

  // Stone wall, lit on the right
  g.fillStyle(COLORS.walls[index % COLORS.walls.length]);
  g.fillRect(-w / 2, -h, w, h);
  for (let i = 0; i < 14; i++) {
    g.fillStyle(i % 2 ? COLORS.shadow : COLORS.sunlight, i % 2 ? 0.1 : 0.16);
    g.fillRect(-w / 2 + 8 + random() * (w - 60), -h + 10 + random() * (h - 40), 26 + random() * 24, 12 + random() * 8);
  }
  g.fillStyle(COLORS.sunlight, 0.18);
  g.fillRect(w / 2 - w * 0.22, -h, w * 0.22, h);
  g.fillStyle(COLORS.shadow, 0.14);
  g.fillRect(-w / 2, -26, w, 26);

  if (index % 2 === 0) {
    g.fillStyle(COLORS.chimney);
    g.fillRect(w / 4, roofTop - 30, 36, 80);
    // Smoke drifting up
    g.fillStyle(COLORS.smoke, 0.4);
    g.fillCircle(w / 4 + 12, roofTop - 62, 20);
    g.fillStyle(COLORS.smoke, 0.28);
    g.fillCircle(w / 4 - 4, roofTop - 104, 27);
    g.fillStyle(COLORS.smoke, 0.16);
    g.fillCircle(w / 4 - 28, roofTop - 146, 34);
  }

  // Terracotta roof, seen from above at an angle: a wide trapezoid with rows of tiles
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
  g.fillStyle(COLORS.shadow, 0.18);
  for (let y = roofTop + 34; y < -h; y += 34) g.fillRect(-w / 2 - 10, y, w + 20, 6);
  g.fillStyle(COLORS.sunlight, 0.2);
  g.fillPoints(
    [
      { x: w * 0.12, y: -h },
      { x: w / 2 + EAVE, y: -h },
      { x: w / 2 - 30, y: roofTop },
      { x: w * 0.1, y: roofTop },
    ],
    true,
  );
  g.fillStyle(COLORS.shadow, 0.28);
  g.fillRect(-w / 2 - EAVE, -h - 12, w + 2 * EAVE, 12);
  g.fillStyle(COLORS.sunlight, 0.35);
  g.fillRect(-w / 2 + 30, roofTop, w - 60, 10);

  g.fillStyle(COLORS.door);
  g.fillRoundedRect(-32, -112, 64, 112, { tl: 30, tr: 30, bl: 0, br: 0 });
  g.fillStyle(COLORS.windowLight);
  g.fillCircle(18, -54, 5);

  // Glowing windows with green shutters
  for (const x of [-w / 2 + 34, w / 2 - 84]) {
    const y = -h + 46;
    g.fillStyle(COLORS.windowLight, 0.25);
    g.fillEllipse(x + 25, y + 26, 104, 88, 20);
    g.fillStyle(COLORS.shutter);
    g.fillRect(x - 18, y - 2, 14, 56);
    g.fillRect(x + 54, y - 2, 14, 56);
    g.fillStyle(COLORS.windowLight);
    g.fillRect(x, y, 50, 52);
    g.lineStyle(6, COLORS.frame);
    g.strokeRect(x, y, 50, 52);
    g.lineBetween(x + 25, y, x + 25, y + 52);
  }

  // Autumn ivy climbing the wall
  if (index % 3 !== 1) drawIvy(g, -w / 2, random);
}

function drawIvy(g, wallLeft, random) {
  for (let i = 0; i < 46; i++) {
    const height = random();
    const x = wallLeft - 8 + random() * 70 * (1 - height * 0.4);
    const y = -10 - height * 150 - random() * 20;
    g.fillStyle(COLORS.ivy[i % COLORS.ivy.length]);
    g.fillEllipse(x, y, 16, 12, 8);
  }
}

// The town hall: a big plastered building with a clock tower in the middle of its front.
function drawTownHall(g, hall) {
  const w = hall.width;
  const h = hall.wall;
  const { roofHeight, towerWidth: tw, towerHeight, towerRoof } = TOWN_HALL;
  const roofTop = -h - roofHeight;
  const towerTop = -h - towerHeight;

  // Shadow, cast away from the low sun on the right
  g.fillStyle(COLORS.shadow, 0.32);
  g.fillEllipse(-50, 8, w + 150, 52, 24);

  // Plastered front wall, lit on the right, with stone corners and a stone base
  g.fillStyle(COLORS.townHallWall);
  g.fillRect(-w / 2, -h, w, h);
  g.fillStyle(COLORS.sunlight, 0.18);
  g.fillRect(w / 2 - w * 0.2, -h, w * 0.2, h);
  g.fillStyle(COLORS.townHallStone);
  for (let row = 0, y = -h; y < -34; row++, y += 38) {
    const size = row % 2 ? 20 : 30;
    g.fillRect(-w / 2, y, size, 34);
    g.fillRect(w / 2 - size, y, size, 34);
  }
  g.fillRect(-w / 2, -34, w, 34);

  // Terracotta roof; the clock tower stands in front of its middle
  g.fillStyle(COLORS.roofs[0]);
  g.fillPoints(
    [
      { x: -w / 2 - EAVE, y: -h },
      { x: w / 2 + EAVE, y: -h },
      { x: w / 2 - 40, y: roofTop },
      { x: -w / 2 + 40, y: roofTop },
    ],
    true,
  );
  g.fillStyle(COLORS.shadow, 0.18);
  for (let y = roofTop + 34; y < -h; y += 34) g.fillRect(-w / 2 - 10, y, w + 20, 6);
  g.fillStyle(COLORS.sunlight, 0.2);
  g.fillPoints(
    [
      { x: w * 0.12, y: -h },
      { x: w / 2 + EAVE, y: -h },
      { x: w / 2 - 40, y: roofTop },
      { x: w * 0.1, y: roofTop },
    ],
    true,
  );
  g.fillStyle(COLORS.shadow, 0.28);
  g.fillRect(-w / 2 - EAVE, -h - 12, w + 2 * EAVE, 12);

  // Clock tower, with its own little roof and an orange flag on top
  g.fillStyle(COLORS.townHallWall);
  g.fillRect(-tw / 2, towerTop, tw, towerHeight);
  g.fillStyle(COLORS.sunlight, 0.2);
  g.fillRect(tw / 2 - 34, towerTop, 34, towerHeight);
  g.fillStyle(COLORS.shadow, 0.12);
  g.fillRect(-tw / 2, towerTop, 14, towerHeight);
  g.fillStyle(COLORS.townHallStone);
  g.fillRect(-tw / 2 - 10, towerTop - 6, tw + 20, 16);
  g.fillStyle(COLORS.roofs[1]);
  g.fillTriangle(-tw / 2 - 16, towerTop - 6, tw / 2 + 16, towerTop - 6, 0, towerTop - towerRoof);
  const poleTop = towerTop - towerRoof - 80;
  g.fillStyle(COLORS.lampPost);
  g.fillRect(-3, poleTop, 6, 84);
  g.fillStyle(COLORS.flag);
  g.fillRect(3, poleTop + 2, 58, 34);

  // The bell, in an arched opening at the top of the tower
  g.fillStyle(COLORS.door);
  g.fillRoundedRect(-28, towerTop + 26, 56, 76, { tl: 28, tr: 28, bl: 0, br: 0 });
  g.fillStyle(COLORS.bell);
  g.fillCircle(0, towerTop + 62, 12);
  g.fillTriangle(-17, towerTop + 92, 17, towerTop + 92, 0, towerTop + 60);

  // The clock, showing 4:42 like the reference picture
  const clockY = towerTop + 170;
  g.fillStyle(COLORS.townHallStone);
  g.fillCircle(0, clockY, 50);
  g.fillStyle(COLORS.clockFace);
  g.fillCircle(0, clockY, 41);
  g.lineStyle(6, COLORS.frame);
  g.lineBetween(0, clockY, -29, clockY + 9);
  g.lineBetween(0, clockY, 13, clockY + 16);
  g.fillStyle(COLORS.frame);
  g.fillCircle(0, clockY, 6);

  // An orange banner under the clock, with a notched bottom
  const bannerTop = clockY + 70;
  g.fillStyle(COLORS.flag);
  g.fillRect(-24, bannerTop, 48, 80);
  g.fillStyle(COLORS.townHallWall);
  g.fillTriangle(-24, bannerTop + 81, 24, bannerTop + 81, 0, bannerTop + 62);

  // Tall arched double door in a stone frame, with a balcony above and steps below
  g.fillStyle(COLORS.townHallStone);
  g.fillRoundedRect(-64, -176, 128, 176, { tl: 64, tr: 64, bl: 0, br: 0 });
  g.fillStyle(COLORS.door);
  g.fillRoundedRect(-52, -164, 104, 164, { tl: 52, tr: 52, bl: 0, br: 0 });
  g.lineStyle(4, COLORS.frame);
  g.lineBetween(0, -150, 0, 0);
  g.fillStyle(COLORS.windowLight);
  g.fillCircle(-12, -72, 5);
  g.fillCircle(12, -72, 5);
  g.fillStyle(COLORS.townHallStone);
  g.fillRect(-84, -204, 168, 16);
  g.lineStyle(4, COLORS.lampPost);
  for (let x = -76; x <= 76; x += 19) g.lineBetween(x, -204, x, -236);
  g.lineBetween(-80, -236, 80, -236);
  g.fillStyle(COLORS.townHallStone);
  g.fillRect(-92, -6, 184, 14);
  g.fillStyle(COLORS.stoneDark);
  g.fillRect(-112, 8, 224, 14);

  // Tall arched windows with green shutters and flower boxes, two on each side of the door
  for (const x of [-226, -130, 130, 226]) {
    const top = -h + 60;
    const height = 130;
    g.fillStyle(COLORS.windowLight, 0.25);
    g.fillEllipse(x, top + height / 2, 110, 170, 20);
    g.fillStyle(COLORS.shutter);
    g.fillRect(x - 44, top, 16, height);
    g.fillRect(x + 28, top, 16, height);
    g.fillStyle(COLORS.windowLight);
    g.fillRoundedRect(x - 26, top, 52, height, { tl: 26, tr: 26, bl: 0, br: 0 });
    g.lineStyle(5, COLORS.frame);
    g.lineBetween(x, top + 10, x, top + height);
    g.lineBetween(x - 26, top + 60, x + 26, top + 60);
    g.fillStyle(COLORS.wood);
    g.fillRect(x - 32, top + height, 64, 14);
    for (let i = 0; i < 5; i++) {
      g.fillStyle(COLORS.flowers[i % COLORS.flowers.length]);
      g.fillEllipse(x - 24 + i * 12, top + height - 2, 12, 10, 8);
    }
  }
}

const LEAF_SPOTS = [
  [-70, -130],
  [-30, -200],
  [20, -150],
  [60, -105],
  [-10, -95],
  [75, -150],
  [-60, -170],
];

function drawTree(g, leaves) {
  g.fillStyle(COLORS.shadow, 0.3);
  g.fillEllipse(-28, 2, 150, 38, 20);
  g.fillStyle(COLORS.trunk);
  g.fillRect(-14, -80, 28, 80);
  g.fillStyle(leaves);
  g.fillCircle(-52, -120, 62);
  g.fillCircle(52, -120, 62);
  g.fillCircle(0, -165, 82);
  // Shade on the side away from the sun, light on the side facing it
  g.fillStyle(COLORS.shadow, 0.22);
  g.fillCircle(-60, -112, 48);
  g.fillStyle(COLORS.sunlight, 0.38);
  g.fillCircle(30, -190, 44);
  g.fillCircle(70, -132, 28);
  g.fillStyle(COLORS.sunlight, 0.5);
  for (const [x, y] of LEAF_SPOTS) g.fillCircle(x, y, 8);
}

function drawCypress(g) {
  g.fillStyle(COLORS.shadow, 0.22);
  g.fillEllipse(-22, 2, 90, 26, 16);
  g.fillStyle(COLORS.trunk);
  g.fillRect(-8, -30, 16, 30);
  g.fillStyle(COLORS.cypress);
  g.fillEllipse(0, -150, 84, 260, 24);
  g.fillTriangle(-30, -230, 30, -230, 0, -330);
  g.fillStyle(COLORS.sunlight, 0.2);
  g.fillEllipse(18, -170, 30, 200, 16);
}

function drawLamp(g) {
  g.fillStyle(COLORS.shadow, 0.22);
  g.fillEllipse(-14, 0, 60, 16, 12);
  g.fillStyle(COLORS.lampGlow, 0.18);
  g.fillCircle(0, -186, 64);
  g.fillStyle(COLORS.lampGlow, 0.3);
  g.fillCircle(0, -186, 38);
  g.fillStyle(COLORS.lampPost);
  g.fillRect(-6, -170, 12, 170);
  g.fillRect(-14, -12, 28, 12);
  g.fillStyle(COLORS.windowLight);
  g.fillRect(-12, -200, 24, 30);
  g.fillStyle(COLORS.lampPost);
  g.fillRect(-16, -206, 32, 8);
  g.fillRect(-14, -172, 28, 6);
}

function drawBench(g) {
  g.fillStyle(COLORS.shadow, 0.22);
  g.fillEllipse(-20, 0, 190, 24, 16);
  g.fillStyle(COLORS.woodDark);
  g.fillRect(-70, -40, 10, 40);
  g.fillRect(60, -40, 10, 40);
  g.fillRect(-74, -88, 8, 44);
  g.fillRect(66, -88, 8, 44);
  g.fillStyle(COLORS.wood);
  g.fillRect(-80, -48, 160, 14);
  g.fillRect(-80, -88, 160, 12);
  g.fillRect(-80, -70, 160, 10);
  g.fillStyle(COLORS.sunlight, 0.25);
  g.fillRect(-80, -48, 160, 4);
  g.fillRect(-80, -88, 160, 4);
}

function drawRock(g, size) {
  g.fillStyle(COLORS.shadow, 0.22);
  g.fillEllipse(-size * 0.4, 0, size * 2.4, size * 0.7, 16);
  g.fillStyle(COLORS.rock);
  g.fillEllipse(0, -size * 0.45, size * 2.1, size * 1.3, 20);
  g.fillStyle(COLORS.rockLight);
  g.fillEllipse(size * 0.3, -size * 0.7, size * 0.9, size * 0.5, 12);
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
  g.fillStyle(COLORS.shadow, 0.22);
  g.fillCircle(-14, 10, radius + 8);
  g.fillStyle(COLORS.stoneDark);
  g.fillCircle(0, 0, radius);
  g.fillStyle(COLORS.stone);
  g.fillCircle(0, 0, radius - 8);
  g.fillStyle(COLORS.water);
  g.fillCircle(0, 0, radius - 22);
  g.fillStyle(COLORS.sunlight, 0.5);
  g.fillEllipse(radius * 0.2, -radius * 0.3, radius * 0.8, radius * 0.22, 16);
  g.fillStyle(COLORS.stoneDark);
  g.fillRect(-14, -110, 28, 110);
  g.fillStyle(COLORS.stone);
  g.fillEllipse(0, -110, 76, 26, 16);
  g.fillStyle(COLORS.smoke, 0.9);
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
