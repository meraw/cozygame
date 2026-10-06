import { makePicture, place } from '../pictures.js';
import { seededRandom } from '../seededRandom.js';
import { office } from './office.js';
import { room, roomDoor } from './room.js';

// Loosely after references/Ufficio Sindaco.jpg: an old town hall office with a terracotta tile
// floor, cream walls under a painted border, dark carved wood and an iron chandelier.
const COLORS = {
  outside: 0x3a2416,
  wall: 0xefe4cc,
  wallShade: 0xdccdb0,
  border: 0xd2bf98,
  borderLine: 0x6b5640,
  borderBlue: 0x7f93a3,
  borderOchre: 0xc49a4a,
  skirting: 0x5a3e2a,
  tile: 0xb4613a,
  tileDark: 0xa2532f,
  tileLight: 0xc26f47,
  grout: 0x8a4428,
  wood: 0x4a3020,
  woodLight: 0x6b4630,
  woodEdge: 0x2e1d12,
  leather: 0x9a6a3c,
  paper: 0xf6f1e4,
  folder: 0x7f93a3,
  ink: 0x2b2522,
  brass: 0xd4a84a,
  gold: 0xc9a24a,
  lampShade: 0x3f6b45,
  glow: 0xffd27a,
  frameDark: 0x3a2a1e,
  photo: 0x8d98a0,
  paintingSky: 0xdfe3d8,
  leaf: 0x5c7a3a,
  flowerRed: 0xc8323a,
  pot: 0xb5653a,
  banner: 0xe0782f,
  shield: 0xf3e6d0,
  italyGreen: 0x2f8a4a,
  italyWhite: 0xf5f2ea,
  italyRed: 0xc8323a,
  europe: 0x2f4b9a,
  star: 0xf2d24a,
  iron: 0x2b2522,
  candle: 0xf3ead8,
  rug: 0x8e2f2a,
  rugBorder: 0xc9a24a,
  door: 0x3e2818,
  doorFrame: 0x2a1a10,
  shadow: 0x2a1408,
};

const ROOM_DEPTH = -100000;
// The chandelier hangs from the ceiling, in front of everything else
const CEILING_DEPTH = 100000;

export function drawOffice(scene) {
  const g = scene.add.graphics().setDepth(ROOM_DEPTH);
  drawRoomShell(g);
  drawWallPictures(g);

  const { desk, mayorChair, visitorChairs, cabinet, banner, flags } = office;
  place(scene, makePicture(scene, 'office-mayor-chair', 160, 270, 80, 250, drawMayorChair), mayorChair.x, mayorChair.y);
  const deskPicture = makePicture(scene, 'office-desk', desk.width + 120, 300, desk.width / 2 + 60, 280, (gr) =>
    drawDesk(gr, desk.width),
  );
  place(scene, deskPicture, desk.x, desk.y);
  const visitorChair = makePicture(scene, 'office-visitor-chair', 120, 220, 60, 200, drawVisitorChair);
  for (const chair of visitorChairs) place(scene, visitorChair, chair.x, chair.y);
  const cabinetPicture = makePicture(scene, 'office-cabinet', cabinet.width + 80, 300, cabinet.width / 2 + 40, 280, (gr) =>
    drawCabinet(gr, cabinet.width),
  );
  place(scene, cabinetPicture, cabinet.x, cabinet.y);
  place(scene, makePicture(scene, 'office-banner', 200, 460, 100, 440, drawBanner), banner.x, banner.y);
  for (const flag of flags) {
    const flagPicture = makePicture(scene, `office-flag-${flag.kind}`, 120, 430, 40, 410, (gr) => drawFlag(gr, flag.kind));
    place(scene, flagPicture, flag.x, flag.y);
  }
  const chandelier = makePicture(scene, 'office-chandelier', 280, 200, 140, 10, drawChandelier);
  place(scene, chandelier, desk.x, room.floor.y - room.backWallHeight).setDepth(CEILING_DEPTH);
}

function drawRoomShell(g) {
  const { floor, backWallHeight, frontWallHeight, sideWallWidth: side } = room;
  const top = floor.y - backWallHeight;
  const bottom = floor.y + floor.height;

  g.fillStyle(COLORS.outside);
  g.fillRect(0, 0, room.width, room.height);

  // Cream plaster wall, with a painted border along the top and a dark skirting board
  g.fillStyle(COLORS.wall);
  g.fillRect(floor.x, top, floor.width, backWallHeight);
  g.fillStyle(COLORS.border);
  g.fillRect(floor.x, top, floor.width, 56);
  g.fillStyle(COLORS.borderLine);
  g.fillRect(floor.x, top + 4, floor.width, 4);
  g.fillRect(floor.x, top + 48, floor.width, 4);
  for (let x = floor.x + 30; x < floor.x + floor.width - 100; x += 120) {
    g.fillStyle(COLORS.borderBlue);
    g.fillRoundedRect(x, top + 16, 74, 24, 10);
    g.fillStyle(COLORS.borderOchre);
    g.fillCircle(x + 97, top + 28, 9);
  }
  g.fillStyle(COLORS.shadow, 0.1);
  g.fillRect(floor.x, top + 56, floor.width, 10);
  g.fillStyle(COLORS.skirting);
  g.fillRect(floor.x, floor.y - 16, floor.width, 16);

  // Terracotta tiles, a few a little lighter or darker
  const tile = 80;
  const random = seededRandom(3);
  g.fillStyle(COLORS.tile);
  g.fillRect(floor.x, floor.y, floor.width, floor.height);
  for (let y = floor.y; y < bottom; y += tile) {
    for (let x = floor.x; x < floor.x + floor.width; x += tile) {
      const shade = random();
      if (shade < 0.3 || shade > 0.75) {
        g.fillStyle(shade < 0.3 ? COLORS.tileDark : COLORS.tileLight);
        g.fillRect(x, y, Math.min(tile, floor.x + floor.width - x), Math.min(tile, bottom - y));
      }
    }
  }
  g.fillStyle(COLORS.grout);
  for (let x = floor.x; x <= floor.x + floor.width; x += tile) g.fillRect(x - 2, floor.y, 4, floor.height);
  for (let y = floor.y; y <= bottom; y += tile) g.fillRect(floor.x, y - 2, floor.width, 4);
  g.fillStyle(COLORS.shadow, 0.12);
  g.fillRect(floor.x, floor.y, floor.width, 24);

  // Side walls and front wall, seen from above (they also hide the tiles' ragged edges)
  g.fillStyle(COLORS.wallShade);
  g.fillRect(floor.x - side, top, side, bottom + frontWallHeight - top);
  g.fillRect(floor.x + floor.width, top, side, bottom + frontWallHeight - top);
  g.fillRect(floor.x - side, bottom, floor.width + 2 * side, frontWallHeight);

  // A red rug inside the tall dark wooden door
  const doorX = roomDoor.step.x;
  g.fillStyle(COLORS.rugBorder);
  g.fillRect(doorX - 100, bottom - 230, 200, 226);
  g.fillStyle(COLORS.rug);
  g.fillRect(doorX - 88, bottom - 218, 176, 202);
  g.fillStyle(COLORS.doorFrame);
  g.fillRect(doorX - 85, bottom - 6, 170, frontWallHeight + 6);
  g.fillStyle(COLORS.door);
  g.fillRect(doorX - 75, bottom, 150, frontWallHeight);
  g.fillStyle(COLORS.brass);
  g.fillCircle(doorX + 50, bottom + frontWallHeight / 2, 7);
}

// On the back wall: a painting of red flowers in a pot, framed photos and a certificate.
function drawWallPictures(g) {
  const wallTop = room.floor.y - room.backWallHeight;
  const middle = office.desk.x;

  const width = 200;
  const height = 124;
  const left = middle - width / 2;
  const top = wallTop + 70;
  g.fillStyle(COLORS.shadow, 0.15);
  g.fillRect(left + 6, top + 6, width, height);
  g.fillStyle(COLORS.gold);
  g.fillRect(left, top, width, height);
  g.fillStyle(COLORS.paintingSky);
  g.fillRect(left + 12, top + 12, width - 24, height - 24);
  g.fillStyle(COLORS.leaf);
  g.fillEllipse(left + 100, top + 62, 110, 54, 16);
  g.fillCircle(left + 162, top + 48, 18);
  g.fillStyle(COLORS.flowerRed);
  const flowers = [
    [70, 46],
    [86, 36],
    [104, 42],
    [122, 40],
    [136, 52],
    [94, 58],
    [116, 60],
    [78, 62],
  ];
  for (const [x, y] of flowers) g.fillCircle(left + x, top + y, 10);
  g.fillStyle(COLORS.pot);
  g.fillRect(left + 74, top + 74, 56, 8);
  g.fillRect(left + 80, top + 80, 44, 30);

  for (const [x, y] of [
    [middle - 250, wallTop + 82],
    [middle - 180, wallTop + 112],
    [middle - 255, wallTop + 150],
  ]) {
    drawFrame(g, x, y, 54, 42, COLORS.photo);
  }
  drawFrame(g, middle + 160, wallTop + 96, 66, 84, COLORS.paper);
  drawFrame(g, middle + 250, wallTop + 112, 50, 62, COLORS.photo);
}

function drawFrame(g, x, y, width, height, inside) {
  g.fillStyle(COLORS.frameDark);
  g.fillRect(x, y, width, height);
  g.fillStyle(inside);
  g.fillRect(x + 5, y + 5, width - 10, height - 10);
}

// The big carved desk: its front, its top with a sheet of glass, papers and a brass lamp.
function drawDesk(g, width) {
  const w = width;
  g.fillStyle(COLORS.shadow, 0.25);
  g.fillEllipse(0, 4, w + 60, 36, 24);
  g.fillStyle(COLORS.wood);
  g.fillRect(-w / 2, -88, w, 88);
  g.lineStyle(4, COLORS.woodEdge);
  const panel = (w - 80) / 3;
  for (let i = 0; i < 3; i++) g.strokeRect(-w / 2 + 20 + i * (panel + 20), -74, panel, 60);

  g.fillStyle(COLORS.woodLight);
  g.fillRect(-w / 2 - 14, -160, w + 28, 76);
  g.fillStyle(COLORS.woodEdge);
  g.fillRect(-w / 2 - 14, -88, w + 28, 8);
  g.fillStyle(0xffffff, 0.15);
  g.fillRect(-w / 2 + 6, -154, w - 12, 62);

  g.fillStyle(COLORS.paper);
  g.fillRect(-60, -146, 90, 52);
  g.fillRect(40, -140, 70, 46);
  g.fillRect(150, -150, 86, 30);
  g.fillStyle(COLORS.folder);
  g.fillRect(150, -116, 86, 22);
  g.lineStyle(2, COLORS.ink, 0.5);
  g.lineBetween(-50, -132, 20, -132);
  g.lineBetween(-50, -122, 10, -122);
  g.lineBetween(-50, -112, 16, -112);
  g.fillStyle(COLORS.brass);
  g.fillRect(-140, -150, 22, 30);
  g.fillStyle(COLORS.ink);
  g.fillRect(-136, -166, 4, 18);
  g.fillRect(-128, -170, 4, 22);

  const lampX = -w / 2 + 70;
  g.fillStyle(COLORS.glow, 0.25);
  g.fillCircle(lampX, -190, 70);
  g.fillStyle(COLORS.brass);
  g.fillEllipse(lampX, -112, 50, 14, 12);
  g.fillRect(lampX - 4, -200, 8, 90);
  g.fillStyle(COLORS.lampShade);
  g.fillPoints(
    [
      { x: lampX - 46, y: -190 },
      { x: lampX + 46, y: -190 },
      { x: lampX + 30, y: -232 },
      { x: lampX - 30, y: -232 },
    ],
    true,
  );
  g.fillStyle(COLORS.glow);
  g.fillRect(lampX - 40, -192, 80, 6);
}

// The mayor's tall carved chair, seen over the top of the desk.
function drawMayorChair(g) {
  g.fillStyle(COLORS.wood);
  g.fillRoundedRect(-62, -236, 124, 200, { tl: 18, tr: 18, bl: 4, br: 4 });
  g.fillStyle(COLORS.woodEdge);
  g.fillRect(-54, -230, 108, 10);
  g.fillStyle(COLORS.leather);
  g.fillRoundedRect(-46, -212, 92, 150, 8);
  g.fillStyle(COLORS.shadow, 0.15);
  g.fillRoundedRect(-46, -110, 92, 48, 8);
  g.fillStyle(COLORS.woodLight);
  g.fillCircle(-56, -240, 9);
  g.fillCircle(56, -240, 9);
}

// A wooden visitor's chair, seen from behind as it faces the desk.
function drawVisitorChair(g) {
  g.fillStyle(COLORS.shadow, 0.25);
  g.fillEllipse(0, 2, 100, 22, 16);
  g.fillStyle(COLORS.woodEdge);
  g.fillRect(-38, -60, 8, 60);
  g.fillRect(30, -60, 8, 60);
  g.fillStyle(COLORS.wood);
  g.fillRect(-42, -72, 84, 14);
  g.fillRect(-40, -180, 80, 112);
  g.fillStyle(COLORS.woodLight);
  g.fillRect(-40, -180, 80, 16);
  g.fillStyle(COLORS.woodEdge);
  g.fillRoundedRect(-14, -160, 28, 14, 6);
  g.fillStyle(COLORS.shadow, 0.15);
  g.fillRect(-40, -110, 80, 42);
}

// A dark wooden cupboard with books on top.
function drawCabinet(g, width) {
  const w = width;
  g.fillStyle(COLORS.shadow, 0.25);
  g.fillEllipse(0, 2, w + 40, 26, 16);
  g.fillStyle(COLORS.wood);
  g.fillRect(-w / 2, -200, w, 200);
  g.fillStyle(COLORS.woodLight);
  g.fillRect(-w / 2 - 10, -214, w + 20, 16);
  g.lineStyle(4, COLORS.woodEdge);
  g.strokeRect(-w / 2 + 16, -184, w / 2 - 24, 150);
  g.strokeRect(8, -184, w / 2 - 24, 150);
  g.fillStyle(COLORS.brass);
  g.fillCircle(-12, -110, 5);
  g.fillCircle(12, -110, 5);
  const books = [0x8e2f2a, 0x2f4b6a, 0x3f6b45, 0xc49a4a, 0x8e2f2a, 0x5e3d24];
  books.forEach((color, i) => {
    g.fillStyle(color);
    g.fillRect(-w / 2 + 20 + i * 22, -262 + (i % 2) * 8, 18, 48 - (i % 2) * 8);
  });
  g.fillStyle(COLORS.paper);
  g.fillRect(w / 2 - 90, -234, 64, 20);
}

// The town banner on its stand: orange, with a gold fringe and a plain shield.
function drawBanner(g) {
  g.fillStyle(COLORS.shadow, 0.25);
  g.fillEllipse(0, 2, 90, 22, 16);
  g.fillStyle(COLORS.iron);
  g.fillTriangle(-30, 0, 30, 0, 0, -26);
  g.fillStyle(COLORS.woodEdge);
  g.fillRect(-4, -420, 8, 420);
  g.fillStyle(COLORS.brass);
  g.fillCircle(0, -426, 10);
  g.fillRect(-70, -396, 140, 8);
  g.fillStyle(COLORS.banner);
  g.fillRect(-64, -388, 128, 180);
  g.fillStyle(COLORS.gold);
  for (let x = -64; x < 64; x += 16) g.fillTriangle(x, -208, x + 16, -208, x + 8, -192);
  g.fillRect(-72, -396, 6, 40);
  g.fillRect(66, -396, 6, 40);
  g.fillStyle(COLORS.shield);
  g.fillRoundedRect(-28, -340, 56, 70, { tl: 6, tr: 6, bl: 28, br: 28 });
}

// A flag hanging down beside its pole: Italy's, or the European one.
function drawFlag(g, kind) {
  g.fillStyle(COLORS.shadow, 0.25);
  g.fillEllipse(0, 2, 60, 18, 12);
  g.fillStyle(COLORS.iron);
  g.fillTriangle(-22, 0, 22, 0, 0, -20);
  g.fillStyle(COLORS.woodEdge);
  g.fillRect(-3, -390, 6, 390);
  g.fillStyle(COLORS.brass);
  g.fillTriangle(-8, -390, 8, -390, 0, -414);

  const top = -380;
  const height = 170;
  const width = 42;
  if (kind === 'italy') {
    [COLORS.italyGreen, COLORS.italyWhite, COLORS.italyRed].forEach((color, i) => {
      g.fillStyle(color);
      g.fillRect(4 + (i * width) / 3, top, width / 3, height);
    });
  } else {
    g.fillStyle(COLORS.europe);
    g.fillRect(4, top, width, height);
    g.fillStyle(COLORS.star);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      g.fillCircle(4 + width / 2 + Math.cos(angle) * 11, top + 60 + Math.sin(angle) * 22, 3);
    }
  }
}

// The wrought iron chandelier, hanging just below the ceiling with five candles,
// high enough to leave the painting under it in view.
function drawChandelier(g) {
  g.lineStyle(4, COLORS.iron);
  g.lineBetween(0, 0, 0, 24);
  for (const x of [-84, -38, 38, 84]) g.lineBetween(0, 24, x, 62);
  g.strokeEllipse(0, 64, 186, 28, 24);
  for (const x of [-84, -42, 0, 42, 84]) {
    g.fillStyle(COLORS.glow, 0.25);
    g.fillCircle(x, 30, 18);
    g.fillStyle(COLORS.candle);
    g.fillRect(x - 5, 36, 10, 24);
    g.fillStyle(COLORS.glow);
    g.fillEllipse(x, 28, 8, 12, 8);
  }
  g.fillStyle(COLORS.iron);
  g.fillCircle(0, 84, 7);
}
