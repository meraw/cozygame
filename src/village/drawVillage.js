import Phaser from 'phaser';
import { makePicture, place } from '../pictures.js';
import { seededRandom } from '../seededRandom.js';
import { drawRoundabout } from './drawRoundabout.js';
import { EAVE, ROOF_HEIGHT, TOWN_HALL } from './layout.js';
import { COLORS, DECAYED, RESTORED } from './palette.js';

const GROUND_DEPTH = -100000;
// Fields lie flat: above the ground, but under everything that stands up
const FIELD_DEPTH = GROUND_DEPTH + 1;
// Long afternoon shadows fall on the ground and the fields
const SHADOWS_DEPTH = GROUND_DEPTH + 2;
// Morning mist floats over everything in the world
const MIST_DEPTH = 3e8;
// The town hall's tall windows: where each stands across its front, and its size from the top of the wall
const TOWN_HALL_WINDOWS = [-226, -130, 130, 226];
const TOWN_HALL_WINDOW = { top: 60, height: 130 };
const LIGHT_DEPTH = 5e8;
const FENCE_STEP = 80;
// How far a house's picture reaches in front of its wall: room for the flowers by its door
const HOUSE_FRONT = 70;
// How far the ridge of a decayed house's roof sags in the middle
const ROOF_SAG = 22;
// Which kind of tree stands at each spot, in turn: mostly autumn colours, now and then a cypress.
const TREE_KINDS = ['orange', 'gold', 'rust', 'orange', 'cypress', 'gold', 'orange', 'olive', 'rust'];

// Draws the whole village. The flat ground is one drawing under everything; anything that
// stands up (houses, trees...) is its own picture, layered by how far down the screen its
// base is, so the player walks behind things above them and in front of things below.
// Returns:
//   restorables: the drained things (marked restorable in the layout) by name: the picture
//     showing each one and both of its looks, so the scene can show the look the save calls for
//   light: what changes through the day: the lit windows and lampposts (each with the spots it
//     lights up at night, and the drained thing it belongs to, if any), the morning mist and
//     the long afternoon shadows
export function drawVillage(scene, village) {
  const ground = scene.add.graphics().setDepth(GROUND_DEPTH);
  drawBackdrop(ground, village);
  drawGround(ground, village);
  const lights = [];
  const shadows = scene.add.graphics().setDepth(SHADOWS_DEPTH);
  drawLongShadows(shadows, village);

  const restorables = {};
  // Places a thing drawn by picture(look). For a drained thing, both of its looks are drawn.
  const placeThing = (thing, picture, x, y) => {
    const image = place(scene, picture(RESTORED), x, y);
    if (thing.restorable) {
      restorables[thing.restorable] = { image, looks: { restored: picture(RESTORED), decayed: picture(DECAYED) } };
    }
    return image;
  };

  village.fields.forEach((field, i) => {
    const picture = (look) =>
      makePicture(scene, lookKey(`field-${i}`, look), field.width, field.height, 0, 0, (g) =>
        drawField(g, field.width, field.height, look),
      );
    placeThing(field, picture, field.x, field.y).setDepth(FIELD_DEPTH);
  });

  village.houses.forEach((house, i) => {
    const width = house.width + 2 * EAVE + 100;
    // Room above the roof for chimney smoke, and in front of the wall for the flowers
    const height = house.wall + ROOF_HEIGHT + 200 + HOUSE_FRONT;
    const picture = (look) =>
      makePicture(scene, lookKey(`house-${i}`, look), width, height, width / 2, height - HOUSE_FRONT, (g) =>
        drawHouse(g, house, i, look),
      );
    placeThing(house, picture, house.x, house.baseY);

    // Its windows lit, laid over the house when the lights come on
    const lit = makePicture(scene, `house-${i}-lights`, width, height, width / 2, height - HOUSE_FRONT, (g) =>
      drawHouseLights(g, house),
    );
    lights.push({
      image: place(scene, lit, house.x, house.baseY).setDepth(house.baseY + 0.5),
      restorable: house.restorable,
      glows: houseWindows(house).map(({ x, y }) => ({ x: house.x + x + 25, y: house.baseY + y + 26, radius: 120 })),
    });
  });

  const hall = village.townHall;
  const hallWidth = hall.width + 2 * EAVE + 200;
  const hallHeight = hall.wall + TOWN_HALL.towerHeight + TOWN_HALL.towerRoof + 140;
  const hallPicture = (draw, key) =>
    makePicture(scene, key, hallWidth, hallHeight, hallWidth / 2, hallHeight - 40, (g) => draw(g, hall));
  place(scene, hallPicture(drawTownHall, 'town-hall'), hall.x, hall.baseY);
  lights.push({
    image: place(scene, hallPicture(drawTownHallLights, 'town-hall-lights'), hall.x, hall.baseY).setDepth(hall.baseY + 0.5),
    glows: TOWN_HALL_WINDOWS.map((x) => ({ x: hall.x + x, y: hall.baseY - hall.wall + 125, radius: 130 })),
  });

  const trees = { cypress: makePicture(scene, 'tree-cypress', 140, 380, 70, 360, drawCypress) };
  for (const [kind, color] of Object.entries(COLORS.foliage)) {
    trees[kind] = makePicture(scene, `tree-${kind}`, 270, 300, 135, 280, (g) => drawTree(g, color));
  }
  village.trees.forEach((tree, i) => place(scene, trees[TREE_KINDS[i % TREE_KINDS.length]], tree.x, tree.y, tree.size));

  const lamp = makePicture(scene, 'lamp', 150, 290, 75, 270, drawLamp);
  const lampLit = makePicture(scene, 'lamp-light', 150, 290, 75, 270, drawLampLight);
  for (const spot of village.lamps) {
    place(scene, lamp, spot.x, spot.y);
    lights.push({
      image: place(scene, lampLit, spot.x, spot.y).setDepth(spot.y + 0.5),
      glows: [{ x: spot.x, y: spot.y - 186, radius: 190 }],
    });
  }

  const bench = (look) => makePicture(scene, lookKey('bench', look), 230, 110, 125, 100, (g) => drawBench(g, look));
  for (const spot of village.benches) placeThing(spot, bench, spot.x, spot.y);

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

  const { roundabout } = village;
  const roundaboutWidth = roundabout.radius * 2 + 80;
  // From its middle up to the tops of the hedges, and down to the pebbles spilled in front
  const above = roundabout.radius + 100;
  const below = roundabout.radius + 40;
  const roundaboutPicture = (look) =>
    makePicture(scene, lookKey('roundabout', look), roundaboutWidth, above + below, roundaboutWidth / 2, above, (g) =>
      drawRoundabout(g, roundabout, look),
    );
  placeThing(roundabout, roundaboutPicture, roundabout.x, roundabout.y);

  const mist = scene.add.graphics().setDepth(MIST_DEPTH);
  drawMist(mist, village);
  // Drifting slowly
  scene.tweens.add({ targets: mist, x: 90, duration: 14000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  return { restorables, light: { lights, mist, shadows } };
}

// Each look of a thing is a picture of its own.
function lookKey(key, look) {
  return look.decayed ? `${key}-decayed` : key;
}

// Long shadows on the ground, stretching left from everything that stands up, away from the
// low afternoon sun on the right.
function drawLongShadows(g, v) {
  g.fillStyle(COLORS.shadow, 0.28);
  for (const house of v.houses) {
    const width = house.width + 2 * EAVE;
    const length = (house.wall + ROOF_HEIGHT) * 1.6;
    g.fillEllipse(house.x - length / 2, house.baseY + 6, width + length, 70, 32);
  }
  const hall = v.townHall;
  const hallLength = (hall.wall + TOWN_HALL.towerHeight) * 1.4;
  g.fillEllipse(hall.x - hallLength / 2, hall.baseY + 8, hall.width + hallLength, 100, 32);
  for (const tree of v.trees) {
    const length = 300 * tree.size * 1.7;
    g.fillEllipse(tree.x - length / 2, tree.y + 4, length + 70, 44 * tree.size, 24);
  }
  for (const lamp of v.lamps) g.fillEllipse(lamp.x - 230, lamp.y + 2, 470, 16, 16);
  for (const bench of v.benches) g.fillEllipse(bench.x - 150, bench.y + 2, 360, 26, 16);
  const { roundabout: r } = v;
  g.fillEllipse(r.x - 180, r.y + 20, 2 * r.radius + 260, r.radius * 1.4, 32);
}

// Soft banks of mist lying over the village, thickest over the fields at the bottom.
function drawMist(g, v) {
  const random = seededRandom(61);
  for (let i = 0; i < 18; i++) {
    const x = random() * v.width;
    const y = v.hillsBottom + Math.sqrt(random()) * (v.height - v.hillsBottom);
    const width = 800 + random() * 900;
    const height = 150 + random() * 130;
    for (let layer = 0; layer < 5; layer++) {
      const size = 1 - layer * 0.16;
      g.fillStyle(COLORS.morningMist, 0.12);
      g.fillEllipse(x, y, width * size, height * size, 32);
    }
  }
}

// The golden haze of the low sun (top right) and slightly darker edges, laid over the whole
// screen. Returns it, so the time of day can turn it up or down.
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
  return scene.add
    .image(0, 0, 'sunset-light')
    .setOrigin(0)
    .setDisplaySize(width, height)
    .setScrollFactor(0)
    .setDepth(LIGHT_DEPTH);
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

  // The cobbled square, laid in rings around the roundabout
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

  // Flowers on both sides of the town hall's door (houses have theirs in their own pictures)
  drawFlowers(g, v.townHall.x - 150, v.townHall.baseY + 40, random);
  drawFlowers(g, v.townHall.x + 150, v.townHall.baseY + 40, random);
}

function drawFlowers(g, x, y, random, colors = COLORS) {
  for (let i = 0; i < 7; i++) {
    g.fillStyle(colors.flowers[Math.floor(random() * colors.flowers.length)]);
    g.fillEllipse(x + (random() - 0.5) * 80, y + (random() - 0.5) * 30, 16, 14, 8);
  }
}

// Drained flowers: grey, their heads hanging from bent stems. Same spots as drawFlowers.
function drawWiltedFlowers(g, x, y, random, colors) {
  for (let i = 0; i < 7; i++) {
    const color = colors.flowers[Math.floor(random() * colors.flowers.length)];
    const fx = x + (random() - 0.5) * 80;
    const fy = y + (random() - 0.5) * 30;
    const lean = i % 2 ? 1 : -1;
    g.lineStyle(3, colors.deadPlant);
    g.strokePoints([
      { x: fx, y: fy + 6 },
      { x: fx + lean * 2, y: fy - 10 },
      { x: fx + lean * 9, y: fy - 13 },
    ]);
    g.fillStyle(color);
    g.fillEllipse(fx + lean * 11, fy - 6, 10, 12, 8);
  }
}

// A field: rows of seedlings in dark soil. Drained, the earth dries out pale and cracks,
// and the seedlings wilt.
function drawField(g, width, height, { colors, decayed }) {
  g.fillStyle(decayed ? colors.dryEarth : colors.soil);
  g.fillRect(0, 0, width, height);
  if (decayed) drawCrackedEarth(g, width, height, colors);
  for (let row = 0, y = 40; y < height - 20; row++, y += 60) {
    g.fillStyle(colors.furrow, decayed ? 0.45 : 1);
    g.fillRect(16, y, width - 32, 12);
    for (let column = 0, x = 50; x < width - 30; column++, x += 70) {
      if (decayed) {
        drawWiltedSeedling(g, x, y, (row + column) % 3 ? 1 : -1, colors);
      } else {
        g.fillStyle(colors.sprout);
        g.fillTriangle(x - 12, y + 4, x + 12, y + 4, x, y - 24);
      }
    }
  }
}

// Dry earth, split into uneven plates like a dried-up puddle.
function drawCrackedEarth(g, width, height, colors) {
  const random = seededRandom(23);
  const columns = Math.round(width / 80);
  const rows = Math.round(height / 70);
  // Where the cracks meet: a grid, nudged about so the plates come out uneven
  const nudge = (n, count) => (n > 0 && n < count ? (random() - 0.5) * 44 : 0);
  const corners = Array.from({ length: rows + 1 }, (_, row) =>
    Array.from({ length: columns + 1 }, (_, column) => ({
      x: (column * width) / columns + nudge(column, columns),
      y: (row * height) / rows + nudge(row, rows),
    })),
  );
  g.lineStyle(3, colors.crack, 0.7);
  const crack = (from, to) => {
    // Not every plate has split from its neighbour yet
    if (random() < 0.15) return;
    const bend = (random() - 0.5) * 18;
    g.strokePoints([from, { x: (from.x + to.x) / 2 + bend, y: (from.y + to.y) / 2 - bend }, to]);
  };
  for (let row = 0; row <= rows; row++) {
    for (let column = 0; column <= columns; column++) {
      const corner = corners[row][column];
      if (column < columns && row > 0 && row < rows) crack(corner, corners[row][column + 1]);
      if (row < rows && column > 0 && column < columns) crack(corner, corners[row + 1][column]);
    }
  }
}

// A dead seedling: its stem bent over, its leaves hanging limp. lean is 1 to droop right, -1 left.
function drawWiltedSeedling(g, x, y, lean, colors) {
  const tip = { x: x + lean * 16, y: y - 12 };
  g.lineStyle(4, colors.deadPlant);
  g.strokePoints([{ x, y: y + 4 }, { x: x + lean * 2, y: y - 14 }, { x: x + lean * 9, y: y - 22 }, tip]);
  g.fillStyle(colors.deadPlant);
  g.fillTriangle(tip.x - 4, tip.y - 2, tip.x + 4, tip.y - 2, tip.x + lean * 2, tip.y + 13);
  g.fillTriangle(x - lean, y - 8, x - lean * 4, y - 12, x - lean * 13, y + 2);
}

function drawHouse(g, house, index, look) {
  const { colors, decayed } = look;
  const w = house.width;
  const h = house.wall;
  const roofTop = -h - ROOF_HEIGHT;
  const random = seededRandom(index + 11);

  // Shadow, cast away from the low sun on the right
  g.fillStyle(colors.shadow, 0.32);
  g.fillEllipse(-34, 6, w + 90, 40, 24);

  // Stone wall, lit on the right
  g.fillStyle(colors.walls[index % colors.walls.length]);
  g.fillRect(-w / 2, -h, w, h);
  for (let i = 0; i < 14; i++) {
    g.fillStyle(i % 2 ? colors.shadow : colors.sunlight, i % 2 ? 0.1 : 0.16);
    g.fillRect(-w / 2 + 8 + random() * (w - 60), -h + 10 + random() * (h - 40), 26 + random() * 24, 12 + random() * 8);
  }
  g.fillStyle(colors.sunlight, 0.18);
  g.fillRect(w / 2 - w * 0.22, -h, w * 0.22, h);
  g.fillStyle(colors.shadow, 0.14);
  g.fillRect(-w / 2, -26, w, 26);
  if (decayed) drawWallCracks(g, w, h, colors);

  if (index % 2 === 0) {
    const x = w / 4;
    const top = roofTop - 30;
    g.fillStyle(colors.chimney);
    if (decayed) {
      // Gone cold, and crumbling at the top
      g.fillPoints(
        [
          { x, y: top + 80 },
          { x, y: top + 6 },
          { x: x + 9, y: top },
          { x: x + 16, y: top + 12 },
          { x: x + 25, y: top + 4 },
          { x: x + 36, y: top + 18 },
          { x: x + 36, y: top + 80 },
        ],
        true,
      );
    } else {
      g.fillRect(x, top, 36, 80);
      // Smoke drifting up
      g.fillStyle(colors.smoke, 0.4);
      g.fillCircle(x + 12, roofTop - 62, 20);
      g.fillStyle(colors.smoke, 0.28);
      g.fillCircle(x - 4, roofTop - 104, 27);
      g.fillStyle(colors.smoke, 0.16);
      g.fillCircle(x - 28, roofTop - 146, 34);
    }
  }

  drawRoof(g, w, h, index, look);
  drawFrontDoor(g, look);
  drawWindows(g, w, h, look);

  // Autumn ivy climbing the wall; drained, it hangs dead from the eave
  if (index % 3 !== 1) {
    if (decayed) drawDeadIvy(g, -w / 2, -h, random, colors);
    else drawIvy(g, -w / 2, random);
  }

  // Flowers on both sides of the door
  const flowerRandom = seededRandom(index + 51);
  for (const x of [-110, 110]) {
    if (decayed) drawWiltedFlowers(g, x, 40, flowerRandom, colors);
    else drawFlowers(g, x, 40, flowerRandom, colors);
  }
}

// Cracks running through a drained house's plaster.
function drawWallCracks(g, w, h, colors) {
  const cracks = [
    // From the top left corner, down beside the window
    [[-w / 2 + 4, -h + 8], [-w / 2 + 22, -h + 30], [-w / 2 + 14, -h + 56], [-w / 2 + 30, -h + 84], [-w / 2 + 24, -h + 104]],
    // From under the eave down towards the door
    [[44, -h], [52, -h + 22], [42, -h + 44], [50, -h + 70], [40, -h + 92]],
    // Across the bottom right
    [[w / 2, -64], [w / 2 - 20, -54], [w / 2 - 34, -66], [w / 2 - 56, -48], [w / 2 - 70, -56]],
  ];
  g.lineStyle(4, colors.crack, 0.85);
  for (const crack of cracks) g.strokePoints(crack.map(([x, y]) => ({ x, y })));
}

// Terracotta roof, seen from above at an angle: a wide trapezoid with rows of tiles.
// Drained, its ridge sags in the middle and some tiles have slipped off.
function drawRoof(g, w, h, index, { colors, decayed }) {
  const roofTop = -h - ROOF_HEIGHT;
  const ridgeLeft = -w / 2 + 30;
  const ridgeRight = w / 2 - 30;
  const sag = decayed ? ROOF_SAG : 0;
  // Points along the ridge, from x = from to x = to
  const ridge = (from, to) =>
    Array.from({ length: 13 }, (_, i) => {
      const x = from + ((to - from) * i) / 12;
      return { x, y: roofTop + sag * Math.sin((Math.PI * (x - ridgeLeft)) / (ridgeRight - ridgeLeft)) };
    });

  g.fillStyle(colors.roofs[index % colors.roofs.length]);
  g.fillPoints([{ x: -w / 2 - EAVE, y: -h }, { x: w / 2 + EAVE, y: -h }, ...ridge(ridgeRight, ridgeLeft)], true);
  g.fillStyle(colors.shadow, 0.18);
  for (let y = roofTop + 34; y < -h; y += 34) g.fillRect(-w / 2 - 10, y, w + 20, 6);
  g.fillStyle(colors.sunlight, 0.2);
  g.fillPoints([{ x: w * 0.12, y: -h }, { x: w / 2 + EAVE, y: -h }, ...ridge(ridgeRight, w * 0.1)], true);
  g.fillStyle(colors.shadow, 0.28);
  g.fillRect(-w / 2 - EAVE, -h - 12, w + 2 * EAVE, 12);
  if (decayed) {
    // Gaps where tiles have slipped off
    g.fillStyle(colors.shadow, 0.6);
    for (const [x, y] of [[-0.24, 0.62], [0.08, 0.3], [-0.36, 0.22], [0.26, 0.7], [-0.04, 0.5]]) {
      g.fillRect(x * w, -h - y * ROOF_HEIGHT, 28, 14);
    }
  } else {
    g.fillStyle(colors.sunlight, 0.35);
    g.fillRect(-w / 2 + 30, roofTop, w - 60, 10);
  }
}

function drawFrontDoor(g, { colors, decayed }) {
  if (decayed) {
    // Weathered grey planks, split apart, and a knob that's lost its shine
    g.fillStyle(colors.wood);
    g.fillRoundedRect(-32, -112, 64, 112, { tl: 30, tr: 30, bl: 0, br: 0 });
    g.lineStyle(3, colors.crack);
    g.lineBetween(-11, -108, -11, 0);
    g.lineBetween(11, -108, 11, 0);
    g.strokePoints([
      { x: -26, y: -40 },
      { x: -18, y: -52 },
      { x: -22, y: -64 },
    ]);
    g.fillStyle(colors.crack);
  } else {
    g.fillStyle(colors.door);
    g.fillRoundedRect(-32, -112, 64, 112, { tl: 30, tr: 30, bl: 0, br: 0 });
    g.fillStyle(colors.windowLight);
  }
  g.fillCircle(18, -54, 5);
}

// Where a house's two windows are (the top left corner of each pane), from the middle of the
// bottom of its wall, given its width and wall height.
function windowSpots(w, h) {
  return [-w / 2 + 34, w / 2 - 84].map((x) => ({ x, y: -h + 46 }));
}

function houseWindows(house) {
  return windowSpots(house.width, house.wall);
}

// Two windows with green shutters. Restored, their glass catches the sky (they light up in the
// evening: see drawHouseLights); drained, they're dark, a pane is cracked, and a shutter on each
// hangs loose from one hinge.
function drawWindows(g, w, h, { colors, decayed }) {
  windowSpots(w, h).forEach(({ x, y }, i) => {
    g.fillStyle(colors.shutter);
    if (decayed && i === 0) fillSwung(g, x - 4, y - 2, -14, 56, 0.42);
    else g.fillRect(x - 18, y - 2, 14, 56);
    if (decayed && i === 1) fillSwung(g, x + 54, y - 2, 14, 56, -0.3);
    else g.fillRect(x + 54, y - 2, 14, 56);
    g.fillStyle(decayed ? colors.darkWindow : colors.glass);
    g.fillRect(x, y, 50, 52);
    if (!decayed) drawGlassShine(g, x, y, 50, 52, colors);
    if (decayed && i === 0) {
      g.lineStyle(2, colors.sunlight, 0.8);
      g.strokePoints([
        { x: x + 3, y: y + 6 },
        { x: x + 13, y: y + 18 },
        { x: x + 9, y: y + 29 },
        { x: x + 22, y: y + 44 },
      ]);
    }
    g.lineStyle(6, colors.frame);
    g.strokeRect(x, y, 50, 52);
    g.lineBetween(x + 25, y, x + 25, y + 52);
  });
}

// A slanting streak of reflected sky across a window pane.
function drawGlassShine(g, x, y, width, height, colors) {
  g.fillStyle(colors.glassShine, 0.55);
  g.fillPoints(
    [
      { x: x + width * 0.1, y: y + height },
      { x: x + width * 0.35, y: y + height },
      { x: x + width * 0.9, y },
      { x: x + width * 0.65, y },
    ],
    true,
  );
}

// A house's windows with the lights on inside, glowing: laid over the house in the evening.
function drawHouseLights(g, house) {
  for (const { x, y } of houseWindows(house)) {
    g.fillStyle(COLORS.windowLight, 0.25);
    g.fillEllipse(x + 25, y + 26, 104, 88, 20);
    g.fillStyle(COLORS.windowLight);
    g.fillRect(x, y, 50, 52);
    g.lineStyle(6, COLORS.frame);
    g.strokeRect(x, y, 50, 52);
    g.lineBetween(x + 25, y, x + 25, y + 52);
  }
}

// A board hanging from one corner (x, y): width and height reach out from that corner,
// and the board is swung round it by angle (in radians; more than 0 swings it clockwise).
function fillSwung(g, x, y, width, height, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const corner = (dx, dy) => ({ x: x + dx * cos - dy * sin, y: y + dx * sin + dy * cos });
  g.fillPoints([corner(0, 0), corner(width, 0), corner(width, height), corner(0, height)], true);
}

// Drained ivy: dead grey strands hanging limp from the eave, down the left of the wall.
function drawDeadIvy(g, wallLeft, wallTop, random, colors) {
  for (let i = 0; i < 6; i++) {
    const x = wallLeft + 2 + i * 9 + random() * 5;
    const length = 40 + random() * 110;
    g.lineStyle(3, colors.deadPlant);
    g.lineBetween(x, wallTop, x + 3, wallTop + length);
    g.fillStyle(colors.ivy[i % colors.ivy.length]);
    for (let y = wallTop + 14, side = i % 2 ? 1 : -1; y < wallTop + length; y += 18, side = -side) {
      const stemX = x + (3 * (y - wallTop)) / length;
      // A leaf hanging down from the strand
      g.fillTriangle(stemX, y - 4, stemX + side * 8, y, stemX + side * 3, y + 12);
    }
  }
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

  // Tall arched windows with green shutters and flower boxes, two on each side of the door; their
  // glass catches the sky (they light up in the evening: see drawTownHallLights)
  const top = -h + TOWN_HALL_WINDOW.top;
  const { height } = TOWN_HALL_WINDOW;
  for (const x of TOWN_HALL_WINDOWS) {
    g.fillStyle(COLORS.shutter);
    g.fillRect(x - 44, top, 16, height);
    g.fillRect(x + 28, top, 16, height);
    g.fillStyle(COLORS.glass);
    g.fillRoundedRect(x - 26, top, 52, height, { tl: 26, tr: 26, bl: 0, br: 0 });
    drawGlassShine(g, x - 20, top + 30, 40, height - 30, COLORS);
    drawTownHallWindowFrame(g, x, top, height);
    g.fillStyle(COLORS.wood);
    g.fillRect(x - 32, top + height, 64, 14);
    for (let i = 0; i < 5; i++) {
      g.fillStyle(COLORS.flowers[i % COLORS.flowers.length]);
      g.fillEllipse(x - 24 + i * 12, top + height - 2, 12, 10, 8);
    }
  }
}

function drawTownHallWindowFrame(g, x, top, height) {
  g.lineStyle(5, COLORS.frame);
  g.lineBetween(x, top + 10, x, top + height);
  g.lineBetween(x - 26, top + 60, x + 26, top + 60);
}

// The town hall's windows with the lights on inside, glowing: laid over it in the evening.
function drawTownHallLights(g, hall) {
  const top = -hall.wall + TOWN_HALL_WINDOW.top;
  const { height } = TOWN_HALL_WINDOW;
  for (const x of TOWN_HALL_WINDOWS) {
    g.fillStyle(COLORS.windowLight, 0.25);
    g.fillEllipse(x, top + height / 2, 110, 170, 20);
    g.fillStyle(COLORS.windowLight);
    g.fillRoundedRect(x - 26, top, 52, height - 2, { tl: 26, tr: 26, bl: 0, br: 0 });
    drawTownHallWindowFrame(g, x, top, height - 2);
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

// A lamppost, its lamp off (it comes on in the evening: see drawLampLight).
function drawLamp(g) {
  g.fillStyle(COLORS.shadow, 0.22);
  g.fillEllipse(-14, 0, 60, 16, 12);
  g.fillStyle(COLORS.lampPost);
  g.fillRect(-6, -170, 12, 170);
  g.fillRect(-14, -12, 28, 12);
  g.fillStyle(COLORS.glass);
  g.fillRect(-12, -200, 24, 30);
  drawLampCaps(g);
}

// The lamp lit and glowing: laid over the lamppost in the evening.
function drawLampLight(g) {
  g.fillStyle(COLORS.lampGlow, 0.18);
  g.fillCircle(0, -186, 64);
  g.fillStyle(COLORS.lampGlow, 0.3);
  g.fillCircle(0, -186, 38);
  g.fillStyle(COLORS.windowLight);
  g.fillRect(-12, -200, 24, 30);
  drawLampCaps(g);
}

function drawLampCaps(g) {
  g.fillStyle(COLORS.lampPost);
  g.fillRect(-16, -206, 32, 8);
  g.fillRect(-14, -172, 28, 6);
}

function drawBench(g, { colors, decayed }) {
  g.fillStyle(colors.shadow, 0.22);
  g.fillEllipse(-20, 0, 190, 24, 16);
  g.fillStyle(colors.woodDark);
  g.fillRect(-70, -40, 10, 40);
  g.fillRect(60, -40, 10, 40);
  g.fillRect(-74, -88, 8, 44);
  g.fillRect(66, -88, 8, 44);
  g.fillStyle(colors.wood);
  if (!decayed) {
    g.fillRect(-80, -48, 160, 14);
    g.fillRect(-80, -88, 160, 12);
    g.fillRect(-80, -70, 160, 10);
    g.fillStyle(colors.sunlight, 0.25);
    g.fillRect(-80, -48, 160, 4);
    g.fillRect(-80, -88, 160, 4);
    return;
  }
  // Drained: the seat sags in the middle, the top of the back has snapped
  // and hangs down from one end, and the grey wood is cracked
  g.fillPoints(saggingPlank(-80, 80, -48, 14, 10), true);
  g.fillRect(-80, -70, 160, 10);
  g.fillRect(-80, -88, 78, 12);
  fillSwung(g, 80, -88, -76, 12, -0.3);
  g.lineStyle(3, colors.crack);
  g.strokePoints([
    { x: -60, y: -42 },
    { x: -42, y: -38 },
    { x: -30, y: -41 },
    { x: -12, y: -35 },
  ]);
  g.strokePoints([
    { x: 20, y: -66 },
    { x: 36, y: -63 },
    { x: 50, y: -67 },
  ]);
}

// The outline of a plank from left to right whose middle sags down by sag.
function saggingPlank(left, right, top, thickness, sag) {
  const along = (i, y) => {
    const t = i / 8;
    return { x: left + (right - left) * t, y: y + sag * Math.sin(Math.PI * t) };
  };
  const topEdge = Array.from({ length: 9 }, (_, i) => along(i, top));
  const bottomEdge = Array.from({ length: 9 }, (_, i) => along(8 - i, top + thickness));
  return [...topEdge, ...bottomEdge];
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
