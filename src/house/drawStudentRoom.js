import { makePicture, place } from '../pictures.js';
import { seededRandom } from '../seededRandom.js';
import { room, roomDoor } from './room.js';
import { studentRoom } from './studentRoom.js';

// Loosely after references/Student Housing.jpg: a small, bright student room with bare concrete
// walls, pale floor tiles, light wood and black metal, cheered up by plants, cork boards full of
// notes, orange cushions and a patchwork rug. Out of the window: the village's autumn sunset.
const COLORS = {
  outside: 0x3a2416,
  concrete: 0xd3d1cc,
  concreteDark: 0xbcbab5,
  concreteLight: 0xe3e1dc,
  skirting: 0x8f8d89,
  tile: 0xe4e2dd,
  grout: 0xcdcac4,
  sunPatch: 0xffcf8a,
  birch: 0xe4d6b8,
  birchDark: 0xcbb994,
  metal: 0x232528,
  shelfInside: 0x34373b,
  deskTop: 0xeeece7,
  deskEdge: 0xcfccc5,
  cork: 0xc49b62,
  corkDark: 0x9e7a48,
  paper: 0xfaf8f2,
  note: 0xf2dc78,
  notePink: 0xf2b8ae,
  sign: 0x9ec6dc,
  photo: 0x9db6c2,
  photoHill: 0x6f8f5a,
  pin: 0xd9482f,
  ink: 0x3a3a3c,
  chairGreen: 0x557a45,
  chairGreenDark: 0x3f5e34,
  mesh: 0x2f3a2d,
  chrome: 0xc4c8cc,
  laptop: 0xc9ccd0,
  screen: 0x33404c,
  screenGlow: 0x7fa7c4,
  leaf: 0x5e9a40,
  leafDark: 0x467a34,
  cactus: 0x4f7f3c,
  driedPlant: 0xb4643a,
  pot: 0xf4f2ec,
  potGold: 0xd6a94a,
  vase: 0xbfe3df,
  mug: 0xe0782f,
  books: [0x8f9aa3, 0xf2efe8, 0xd8c7a8, 0x3a3a3c, 0x6f8f86, 0xc96b3c, 0x5a6f8f],
  box: 0xf4f2ec,
  boxTeal: 0x6f9f98,
  headphones: 0xf4f2ee,
  headphonesDark: 0x4a3a30,
  pillowOrange: 0xdb7440,
  pillowOrangeDark: 0xc4602f,
  blanket: 0x72cdb9,
  blanketDark: 0x4fb3a0,
  sheet: 0xeeaa8a,
  sheetShade: 0xd99474,
  bedding: 0xf4f1eb,
  beddingShade: 0xdedad2,
  pillowTeal: 0x5f8f86,
  windowFrame: 0xf7f7f4,
  blind: 0xf1f0ec,
  blindShade: 0xd9d8d3,
  cord: 0xb9b8b3,
  skyHigh: 0xeaa070,
  sky: 0xf8d090,
  hills: 0xc4a59c,
  trees: [0xd2742a, 0xe0a23a, 0xb04a24],
  vent: 0xf2f1ed,
  rug: {
    navy: 0x4a5878,
    slate: 0x6c7a96,
    teal: 0x6fa6a6,
    grey: 0x9aa0a8,
    peach: 0xe0a58c,
    pink: 0xd9a3a0,
    cream: 0xe9d3bf,
  },
  doorWood: 0xdcc9a4,
  doorFrame: 0xb39d78,
  mat: 0x8f8d89,
  white: 0xffffff,
  shadow: 0x2a2420,
};

const ROOM_DEPTH = -100000;
// This room's back wall is taller than in the other houses, to fit the shelves above the desk
const WALL_HEIGHT = 340;
const WALL_TOP = room.floor.y - WALL_HEIGHT;

// Patches of the rug, as fractions of it: left, top, right, bottom, and colour.
const RUG_PATCHES = [
  [0, 0, 1, 0.3, 'navy'],
  [0.45, 0.06, 1, 0.24, 'slate'],
  [0, 0.3, 0.62, 0.52, 'teal'],
  [0.62, 0.3, 1, 0.52, 'slate'],
  [0, 0.52, 1, 0.72, 'grey'],
  [0.15, 0.56, 0.72, 0.68, 'teal'],
  [0, 0.72, 1, 1, 'peach'],
  [0.5, 0.76, 1, 0.9, 'pink'],
  [0, 0.9, 0.5, 1, 'cream'],
];

export function drawStudentRoom(scene) {
  const g = scene.add.graphics().setDepth(ROOM_DEPTH);
  drawRoomShell(g);
  drawShelves(g);
  drawCorkBoards(g);
  drawWindow(g);

  const { desk, chairs, bunkBed } = studentRoom;
  const deskPicture = makePicture(scene, 'student-desk', desk.width + 80, 320, desk.width / 2 + 40, 300, (gr) =>
    drawDesk(gr, desk.width),
  );
  place(scene, deskPicture, desk.x, desk.y);
  const chair = makePicture(scene, 'student-chair', 140, 220, 70, 205, drawChair);
  for (const spot of chairs) place(scene, chair, spot.x, spot.y);
  const bedPicture = makePicture(scene, 'student-bunk-bed', bunkBed.width + 60, 420, bunkBed.width / 2 + 30, 400, (gr) =>
    drawBunkBed(gr, bunkBed.width),
  );
  place(scene, bedPicture, bunkBed.x, bunkBed.y);
}

function drawRoomShell(g) {
  const { floor, frontWallHeight, sideWallWidth: side } = room;
  const bottom = floor.y + floor.height;

  g.fillStyle(COLORS.outside);
  g.fillRect(0, 0, room.width, room.height);

  // Bare concrete wall, mottled, with a black cable running along the ceiling
  g.fillStyle(COLORS.concrete);
  g.fillRect(floor.x, WALL_TOP, floor.width, WALL_HEIGHT);
  const random = seededRandom(5);
  for (let i = 0; i < 70; i++) {
    const width = 60 + random() * 140;
    const height = 16 + random() * 30;
    const x = floor.x + width / 2 + random() * (floor.width - width);
    const y = WALL_TOP + height / 2 + random() * (WALL_HEIGHT - height);
    g.fillStyle(i % 2 ? COLORS.concreteDark : COLORS.concreteLight, 0.3);
    g.fillEllipse(x, y, width, height, 12);
  }
  g.fillStyle(COLORS.metal);
  g.fillRect(floor.x, WALL_TOP + 12, floor.width, 5);
  for (let x = floor.x + 100; x < floor.x + floor.width; x += 200) g.fillRect(x, WALL_TOP + 9, 8, 11);
  g.fillStyle(COLORS.skirting);
  g.fillRect(floor.x, floor.y - 12, floor.width, 12);

  // Big pale floor tiles
  const tile = 140;
  g.fillStyle(COLORS.tile);
  g.fillRect(floor.x, floor.y, floor.width, floor.height);
  g.fillStyle(COLORS.grout);
  for (let x = floor.x + tile; x < floor.x + floor.width; x += tile) g.fillRect(x - 1, floor.y, 3, floor.height);
  for (let y = floor.y + tile; y < bottom; y += tile) g.fillRect(floor.x, y - 1, floor.width, 3);
  g.fillStyle(COLORS.shadow, 0.08);
  g.fillRect(floor.x, floor.y, floor.width, 24);

  drawRug(g);

  // Low sunlight falling in through the window
  const { window: win } = studentRoom;
  g.fillStyle(COLORS.sunPatch, 0.22);
  g.fillPoints(
    [
      { x: win.x - win.width / 2, y: floor.y },
      { x: win.x + win.width / 2, y: floor.y },
      { x: win.x + win.width / 2 - 140, y: floor.y + 460 },
      { x: win.x - win.width / 2 - 140, y: floor.y + 460 },
    ],
    true,
  );

  // Side walls and front wall, seen from above
  g.fillStyle(COLORS.concreteDark);
  g.fillRect(floor.x - side, WALL_TOP, side, bottom + frontWallHeight - WALL_TOP);
  g.fillRect(floor.x + floor.width, WALL_TOP, side, bottom + frontWallHeight - WALL_TOP);
  g.fillRect(floor.x - side, bottom, floor.width + 2 * side, frontWallHeight);

  // A light wooden door in the front wall, and a mat in front of it
  const doorX = roomDoor.step.x;
  g.fillStyle(COLORS.mat);
  g.fillRoundedRect(doorX - 90, bottom - 84, 180, 68, 12);
  g.fillStyle(COLORS.doorFrame);
  g.fillRect(doorX - 85, bottom - 6, 170, frontWallHeight + 6);
  g.fillStyle(COLORS.doorWood);
  g.fillRect(doorX - 75, bottom, 150, frontWallHeight);
  g.fillStyle(COLORS.metal);
  g.fillRoundedRect(doorX + 34, bottom + frontWallHeight / 2 - 5, 30, 10, 4);
}

// A long patchwork runner in soft blues, teal and peach.
function drawRug(g) {
  const { rug } = studentRoom;
  const left = rug.x - rug.width / 2;
  g.fillStyle(COLORS.shadow, 0.08);
  g.fillRect(left + 6, rug.y + 6, rug.width, rug.height);
  for (const [x0, y0, x1, y1, color] of RUG_PATCHES) {
    g.fillStyle(COLORS.rug[color]);
    g.fillRect(left + x0 * rug.width, rug.y + y0 * rug.height, (x1 - x0) * rug.width, (y1 - y0) * rug.height);
  }
}

// Black open shelves on the wall above the desk, with books and odds and ends in them,
// headphones and a pair of black balls on top, and two plants at the end.
function drawShelves(g) {
  const shelves = [
    { left: 400, top: 235, width: 290, height: 90 },
    { left: 712, top: 252, width: 270, height: 73 },
  ];
  for (const { left, top, width, height } of shelves) {
    g.fillStyle(COLORS.shadow, 0.12);
    g.fillRect(left + 8, top + 8, width, height);
    g.fillStyle(COLORS.metal);
    g.fillRect(left, top, width, height);
    g.fillStyle(COLORS.shelfInside);
    const box = width / 3;
    for (let i = 0; i < 3; i++) g.fillRect(left + i * box + 7, top + 7, box - 14, height - 14);
  }

  // In the left shelves: a storage box, a row of books, a lying stack of books
  const floorOf = (shelf) => shelf.top + shelf.height - 7;
  const [high, low] = shelves;
  g.fillStyle(COLORS.box);
  g.fillRect(414, floorOf(high) - 34, 64, 34);
  g.fillStyle(COLORS.boxTeal);
  g.fillRect(414, floorOf(high) - 12, 64, 4);
  drawBookRow(g, 508, floorOf(high), [11, 9, 12, 10, 9, 12], 50, 68);
  drawBookStack(g, 612, floorOf(high), 3);
  // In the right shelves: books, a teal box, a small jar
  drawBookRow(g, 724, floorOf(low), [10, 12, 9, 11], 40, 52);
  g.fillStyle(COLORS.boxTeal);
  g.fillRect(812, floorOf(low) - 30, 56, 30);
  g.fillStyle(COLORS.potGold);
  g.fillRect(908, floorOf(low) - 26, 20, 26);
  g.fillStyle(COLORS.metal);
  g.fillRect(910, floorOf(low) - 32, 16, 6);

  // On top: headphones, and two black balls
  g.lineStyle(7, COLORS.headphonesDark);
  g.beginPath();
  g.arc(640, high.top - 14, 24, Math.PI, 0);
  g.strokePath();
  g.fillStyle(COLORS.headphonesDark);
  g.fillRoundedRect(608, high.top - 24, 16, 24, 6);
  g.fillRoundedRect(656, high.top - 24, 16, 24, 6);
  g.fillStyle(COLORS.metal);
  g.fillCircle(902, low.top - 14, 14);
  g.fillCircle(934, low.top - 12, 12);
  g.fillStyle(COLORS.white, 0.25);
  g.fillCircle(898, low.top - 19, 4);
  g.fillCircle(930, low.top - 16, 3);

  drawCactus(g, 450, high.top);
  drawDriedPlant(g, 410, high.top);
}

// How tall each book in a row is, in turn, between the shortest (0) and the tallest (1).
const BOOK_HEIGHTS = [0.6, 1, 0.3, 0.85, 0, 0.7];

// Books standing in a row on a shelf, left to right from x, each its own width.
function drawBookRow(g, x, shelfFloor, widths, shortest, tallest) {
  let left = x;
  widths.forEach((width, i) => {
    const height = shortest + (tallest - shortest) * BOOK_HEIGHTS[i % BOOK_HEIGHTS.length];
    g.fillStyle(COLORS.books[i % COLORS.books.length]);
    g.fillRect(left, shelfFloor - height, width, height);
    left += width + 2;
  });
}

// A few books lying flat, one on another.
function drawBookStack(g, x, shelfFloor, count) {
  for (let i = 0; i < count; i++) {
    g.fillStyle(COLORS.books[(i + 2) % COLORS.books.length]);
    g.fillRect(x + (i % 2) * 6, shelfFloor - 11 * (i + 1), 62 - i * 4, 10);
  }
}

// A small round cactus in a white pot, standing on a shelf whose top is at y.
function drawCactus(g, x, y) {
  g.fillStyle(COLORS.pot);
  g.fillRect(x - 18, y - 28, 36, 28);
  g.fillStyle(COLORS.cactus);
  g.fillEllipse(x, y - 46, 28, 40, 16);
  g.fillEllipse(x - 16, y - 50, 10, 18, 10);
  g.fillEllipse(x + 16, y - 56, 10, 18, 10);
  g.fillStyle(COLORS.white, 0.6);
  for (const [dx, dy] of [[-6, -56], [4, -44], [-3, -36], [7, -60]]) g.fillCircle(x + dx, y + dy, 1.5);
}

// A spray of dried leaves, rusty orange, in a little vase.
function drawDriedPlant(g, x, y) {
  g.lineStyle(3, COLORS.driedPlant);
  for (const [tipX, tipY] of [[-24, -66], [-6, -72], [12, -64], [-30, -40]]) {
    g.lineBetween(x, y - 20, x + tipX, y + tipY);
    g.fillStyle(COLORS.driedPlant);
    for (let t = 0.35; t <= 1; t += 0.2) {
      g.fillEllipse(x + tipX * t, y - 20 + (tipY + 20) * t, 12, 6, 8);
    }
  }
  g.fillStyle(COLORS.potGold);
  g.fillRect(x - 9, y - 22, 18, 22);
}

// Two cork boards over the desk, full of timetables, notes, photos and a little sign.
function drawCorkBoards(g) {
  const random = seededRandom(9);
  const top = 340;
  const height = 120;
  for (const left of [400, 700]) {
    const width = 285;
    g.fillStyle(COLORS.shadow, 0.12);
    g.fillRect(left + 6, top + 6, width, height);
    g.fillStyle(COLORS.birch);
    g.fillRect(left, top, width, height);
    g.fillStyle(COLORS.cork);
    g.fillRect(left + 8, top + 8, width - 16, height - 16);
    g.fillStyle(COLORS.corkDark, 0.5);
    for (let i = 0; i < 50; i++) g.fillRect(left + 10 + random() * (width - 24), top + 10 + random() * (height - 24), 4, 3);
  }

  // [x, y, width, height, what]
  const pinned = [
    [422, 354, 62, 84, 'paper'],
    [500, 352, 38, 38, 'note'],
    [502, 398, 38, 38, 'note'],
    [556, 360, 74, 52, 'paper'],
    [640, 352, 34, 34, 'notePink'],
    [642, 396, 30, 44, 'paper'],
    [716, 358, 74, 30, 'sign'],
    [804, 354, 40, 40, 'photo'],
    [852, 374, 36, 36, 'photo'],
    [902, 352, 38, 38, 'note'],
    [940, 382, 30, 58, 'paper'],
    [730, 404, 40, 40, 'notePink'],
    [790, 412, 56, 34, 'paper'],
  ];
  for (const [x, y, width, height, what] of pinned) {
    g.fillStyle(COLORS.shadow, 0.15);
    g.fillRect(x + 3, y + 3, width, height);
    g.fillStyle(what === 'photo' ? COLORS.paper : COLORS[what]);
    g.fillRect(x, y, width, height);
    if (what === 'paper') {
      g.lineStyle(2, COLORS.ink, 0.35);
      for (let line = y + 14; line < y + height - 6; line += 9) g.lineBetween(x + 7, line, x + width - 7, line);
    } else if (what === 'photo') {
      g.fillStyle(COLORS.photo);
      g.fillRect(x + 4, y + 4, width - 8, height - 12);
      g.fillStyle(COLORS.photoHill);
      g.fillEllipse(x + width / 2, y + height - 8, width - 8, 16, 12);
      g.fillStyle(COLORS.paper);
      g.fillRect(x + 4, y + height - 8, width - 8, 4);
    } else if (what === 'sign') {
      g.fillStyle(COLORS.white);
      fillStar(g, x + 16, y + 15, 9);
      fillStar(g, x + 58, y + 15, 9);
      g.fillRect(x + 28, y + 12, 18, 6);
    }
    g.fillStyle(COLORS.pin);
    g.fillCircle(x + width / 2, y + 5, 4);
  }
}

function fillStar(g, x, y, radius) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? radius * 0.45 : radius;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push({ x: x + Math.cos(angle) * r, y: y + Math.sin(angle) * r });
  }
  g.fillPoints(points, true);
}

// A tall window in a white frame, its roller blind pulled a little way down. Outside, the sun
// is setting over the hills and the autumn trees. A little plant sits on the sill.
function drawWindow(g) {
  const { window: win } = studentRoom;
  const width = win.width;
  const left = win.x - width / 2;
  const top = 200;
  const height = 270;

  g.fillStyle(COLORS.shadow, 0.12);
  g.fillRect(left - 6, top - 6, width + 24, height + 30);
  g.fillStyle(COLORS.windowFrame);
  g.fillRect(left - 12, top - 12, width + 24, height + 24);

  g.fillStyle(COLORS.skyHigh);
  g.fillRect(left, top, width, height);
  g.fillStyle(COLORS.sky);
  g.fillRect(left, top + 90, width, height - 90);
  g.fillStyle(COLORS.hills);
  g.fillEllipse(left + 60, top + 172, 110, 56, 20);
  g.fillEllipse(left + 140, top + 178, 90, 44, 20);
  g.fillRect(left, top + 172, width, height - 172);
  const trees = [
    [38, 200, 34, 0],
    [98, 178, 44, 1],
    [156, 206, 30, 2],
    [70, 240, 30, 1],
    [140, 244, 24, 0],
  ];
  for (const [x, y, radius, kind] of trees) {
    g.fillStyle(COLORS.trees[kind]);
    g.fillCircle(left + x, top + y, radius);
  }

  // The window opens in two, the top part smaller
  g.fillStyle(COLORS.windowFrame);
  g.fillRect(left, top + 104, width, 12);

  // The roller blind in its box, with its cord
  g.fillStyle(COLORS.blind);
  g.fillRect(left - 4, top, width + 8, 66);
  g.fillStyle(COLORS.blindShade);
  g.fillRect(left - 4, top + 60, width + 8, 6);
  g.fillStyle(COLORS.windowFrame);
  g.fillRect(left - 18, top - 24, width + 36, 28);
  g.lineStyle(2, COLORS.cord);
  g.lineBetween(left + width - 10, top + 66, left + width - 10, top + 140);

  // Sill, with a little plant in a gold pot
  g.fillStyle(COLORS.windowFrame);
  g.fillRect(left - 24, top + height + 8, width + 48, 14);
  const potX = left + width - 26;
  const potTop = top + height - 18;
  g.fillStyle(COLORS.leaf);
  g.fillEllipse(potX - 8, potTop - 12, 12, 26, 10);
  g.fillEllipse(potX + 8, potTop - 14, 12, 28, 10);
  g.fillStyle(COLORS.leafDark);
  g.fillEllipse(potX, potTop - 18, 10, 30, 10);
  g.fillStyle(COLORS.potGold);
  g.fillRect(potX - 13, potTop, 26, 26);

  // Air vents on the wall either side
  for (const x of [left - 86, left + width + 42]) {
    g.fillStyle(COLORS.vent);
    g.fillRect(x, top + 8, 44, 24);
    g.lineStyle(2, COLORS.concreteDark);
    g.lineBetween(x + 8, top + 17, x + 36, top + 17);
    g.lineBetween(x + 8, top + 24, x + 36, top + 24);
  }
}

// The long desk for two: a pale top on a black leg at one end and light wooden shelves at the
// other, with their things on it: headphones, books, a laptop, pencils, a phone, an open
// notebook, a mug and a bamboo plant.
function drawDesk(g, width) {
  const left = -width / 2;
  const right = width / 2;
  g.fillStyle(COLORS.shadow, 0.2);
  g.fillEllipse(0, 4, width + 40, 30, 24);
  g.fillStyle(COLORS.shadow, 0.1);
  g.fillRect(left, -80, width, 80);

  // Black leg at the left end
  g.fillStyle(COLORS.metal);
  g.fillRect(left + 4, -84, 14, 84);

  // Open shelves of light wood under the right end, with folders and boxes
  const unit = right - 150;
  g.fillStyle(COLORS.birchDark);
  g.fillRect(unit, -84, 150, 84);
  g.fillStyle(COLORS.birch);
  g.fillRect(unit + 8, -76, 62, 70);
  g.fillRect(unit + 80, -76, 62, 70);
  drawBookRow(g, unit + 12, -6, [10, 12, 9, 11], 40, 58);
  g.fillStyle(COLORS.box);
  g.fillRect(unit + 86, -40, 50, 34);

  // The top, seen from above, and its front edge
  g.fillStyle(COLORS.deskTop);
  g.fillRect(left - 6, -144, width + 12, 56);
  g.fillStyle(COLORS.deskEdge);
  g.fillRect(left - 6, -92, width + 12, 12);

  // Headphones lying on the desk
  g.lineStyle(6, COLORS.headphones);
  g.beginPath();
  g.arc(-282, -118, 20, Math.PI, 0);
  g.strokePath();
  g.fillStyle(COLORS.headphones);
  g.fillEllipse(-302, -112, 16, 22, 10);
  g.fillEllipse(-262, -112, 16, 22, 10);

  // Books lying flat
  g.fillStyle(COLORS.books[1]);
  g.fillRect(-248, -114, 64, 14);
  g.fillStyle(COLORS.books[0]);
  g.fillRect(-244, -126, 56, 12);

  // An open laptop
  g.fillStyle(COLORS.laptop);
  g.fillRect(-206, -196, 104, 76);
  g.fillStyle(COLORS.screen);
  g.fillRect(-200, -190, 92, 64);
  g.fillStyle(COLORS.screenGlow, 0.5);
  g.fillRect(-194, -184, 52, 26);
  g.fillRect(-194, -152, 80, 6);
  g.fillStyle(COLORS.laptop);
  g.fillRect(-214, -122, 120, 14);

  // White desk tidy full of pencils, and a phone on a little stand
  const pencils = [COLORS.mug, COLORS.leaf, COLORS.sign, COLORS.note, COLORS.pin];
  pencils.forEach((color, i) => {
    g.lineStyle(4, color);
    g.lineBetween(-72 + i * 7, -124, -76 + i * 9, -156 + (i % 2) * 8);
  });
  g.fillStyle(COLORS.box);
  g.fillRect(-86, -130, 56, 30);
  g.fillStyle(COLORS.ink, 0.5);
  g.fillRect(-78, -120, 26, 4);
  g.fillStyle(COLORS.metal);
  g.fillRect(-4, -136, 24, 38);
  g.fillStyle(COLORS.screenGlow, 0.6);
  g.fillRect(0, -132, 16, 28);
  g.fillStyle(COLORS.chrome);
  g.fillRect(-8, -100, 32, 6);

  // An open notebook and a pen
  g.fillStyle(COLORS.paper);
  g.fillRect(100, -130, 46, 32);
  g.fillRect(148, -130, 46, 32);
  g.lineStyle(2, COLORS.ink, 0.35);
  for (let y = -122; y < -100; y += 7) {
    g.lineBetween(106, y, 140, y);
    g.lineBetween(154, y, 188, y);
  }
  g.lineStyle(3, COLORS.ink);
  g.lineBetween(160, -96, 196, -110);

  // A mug of something warm
  g.fillStyle(COLORS.mug);
  g.fillRoundedRect(216, -132, 30, 34, 6);
  g.lineStyle(4, COLORS.mug);
  g.strokeCircle(250, -116, 8);
  g.fillStyle(COLORS.white, 0.5);
  g.fillEllipse(226, -144, 8, 14, 8);
  g.fillEllipse(236, -156, 8, 14, 8);

  // Bamboo stems in a glass vase
  g.fillStyle(COLORS.vase, 0.8);
  g.fillRoundedRect(268, -142, 40, 46, 8);
  g.fillStyle(COLORS.leafDark);
  for (const [x, top] of [[278, -236], [289, -262], [299, -222]]) {
    g.fillRect(x, top, 6, -110 - top);
    g.fillStyle(COLORS.leaf);
    g.fillEllipse(x - 8, top + 8, 22, 9, 10);
    g.fillEllipse(x + 13, top + 2, 22, 9, 10);
    g.fillStyle(COLORS.leafDark);
  }
}

// A desk chair on wheels, seen from behind as it faces the desk: black mesh back, green seat.
function drawChair(g) {
  g.fillStyle(COLORS.shadow, 0.2);
  g.fillEllipse(0, 2, 110, 24, 16);

  // Five legs on wheels, and the column
  const wheels = [
    [-48, -4],
    [48, -4],
    [-26, 4],
    [26, 4],
  ];
  g.lineStyle(6, COLORS.chrome);
  for (const [x, y] of wheels) g.lineBetween(0, -14, x, y);
  g.fillStyle(COLORS.metal);
  for (const [x, y] of wheels) g.fillCircle(x, y + 2, 6);
  g.fillStyle(COLORS.chrome);
  g.fillRect(-5, -66, 10, 54);

  // The green seat, showing either side of the back
  g.fillStyle(COLORS.chairGreenDark);
  g.fillRoundedRect(-54, -86, 108, 24, 10);
  g.fillStyle(COLORS.chairGreen);
  g.fillRoundedRect(-54, -94, 108, 18, 9);

  // Armrests
  g.fillStyle(COLORS.metal);
  g.fillRect(-58, -128, 8, 40);
  g.fillRect(50, -128, 8, 40);
  g.fillRoundedRect(-64, -134, 22, 10, 4);
  g.fillRoundedRect(42, -134, 22, 10, 4);

  // Mesh back on a black frame
  g.fillStyle(COLORS.metal);
  g.fillRoundedRect(-44, -198, 88, 106, 18);
  g.fillStyle(COLORS.mesh);
  g.fillRoundedRect(-36, -190, 72, 90, 14);
  g.lineStyle(1, COLORS.metal, 0.7);
  for (let y = -182; y < -104; y += 8) g.lineBetween(-32, y, 32, y);
}

// The bunk bed, its long side to the room: a black metal frame, the bottom bed made up in peach
// with orange cushions and a crumpled teal blanket, the top one in white, and a ladder at the foot.
function drawBunkBed(g, width) {
  const half = width / 2;
  g.fillStyle(COLORS.shadow, 0.2);
  g.fillEllipse(0, 4, width + 40, 30, 24);
  g.fillStyle(COLORS.shadow, 0.14);
  g.fillRect(-half, -52, width, 52);

  // Bottom bed
  g.fillStyle(COLORS.sheetShade);
  g.fillRect(-half + 10, -100, width - 20, 46);
  g.fillStyle(COLORS.sheet);
  g.fillRect(-half + 10, -128, width - 20, 30);
  g.fillStyle(COLORS.pillowOrangeDark);
  g.fillRoundedRect(-half + 20, -178, 92, 72, 18);
  g.fillStyle(COLORS.pillowOrange);
  g.fillRoundedRect(-half + 78, -170, 90, 64, 18);
  g.fillStyle(COLORS.bedding);
  g.fillRoundedRect(half - 196, -136, 110, 32, 12);
  g.fillStyle(COLORS.blanket);
  g.fillPoints(
    [
      { x: -96, y: -134 },
      { x: 30, y: -140 },
      { x: 104, y: -128 },
      { x: 128, y: -100 },
      { x: 118, y: -62 },
      { x: 70, y: -56 },
      { x: 24, y: -66 },
      { x: -28, y: -54 },
      { x: -78, y: -64 },
      { x: -112, y: -92 },
    ],
    true,
  );
  g.lineStyle(4, COLORS.blanketDark);
  g.lineBetween(-60, -124, -36, -76);
  g.lineBetween(10, -126, 30, -72);
  g.lineBetween(70, -122, 84, -76);

  // Top bed: white sheets and duvet, with a teal pillow
  g.fillStyle(COLORS.beddingShade);
  g.fillRect(-half + 10, -296, width - 20, 40);
  g.fillStyle(COLORS.bedding);
  g.fillRect(-half + 10, -322, width - 20, 28);
  g.fillStyle(COLORS.pillowTeal);
  g.fillRoundedRect(-half + 24, -342, 96, 38, 14);
  g.lineStyle(3, COLORS.beddingShade);
  g.lineBetween(-60, -318, -40, -298);
  g.lineBetween(60, -318, 84, -298);

  // Black metal frame: a post at each corner, a rail under each bed, a guard rail along the top
  g.fillStyle(COLORS.metal);
  g.fillRect(-half, -386, 16, 386);
  g.fillRect(half - 16, -386, 16, 386);
  g.fillRect(-half, -58, width, 12);
  g.fillRect(-half, -258, width, 12);
  g.fillRect(-half, -386, width - 130, 10);
  g.fillRect(-half, -356, width - 130, 8);
  g.fillRect(half - 140, -386, 10, 130);

  // The ladder up to the top bed, at the foot end
  const ladderLeft = half - 116;
  const ladderRight = half - 66;
  g.fillRect(ladderLeft, -386, 8, 386);
  g.fillRect(ladderRight, -386, 8, 386);
  for (let y = -320; y < -20; y += 56) g.fillRect(ladderLeft, y, ladderRight - ladderLeft + 8, 8);
}
