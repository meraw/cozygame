import { seededRandom } from '../seededRandom.js';

// The roundabout in the middle of the square, after references/Rotonda Decorata.png: a granite
// kerb round a lawn, clipped box hedges (a long one round the back, a round one in the middle),
// and the village's name along the front in big steel letters filled with white pebbles.
// Restored, the letters stand proud. Destroyed (and drained, like everything the vampires got
// to), they've been knocked over and broken, their pebbles spilled everywhere, and the plants
// have gone grey and limp.
// Drawn around its middle (0, 0); y grows towards the front, down the screen.

const KERB = 16;
// Where the flower bed under the letters begins, in front of the middle
const BED_TOP = 70;
// How the letters lie once wrecked, in turn: moved by dx, dy, turned about their bottom left
// corner by angle (radians, clockwise), and squashed when lying down (1 is standing).
// `snapped` is where a broken-off piece (a letter's last part) ended up.
const STANDING = { dx: 0, dy: 0, angle: 0, squash: 1 };
const WRECKED = [
  { dx: -4, dy: 30, angle: -0.1, squash: 0.36 },
  { dx: 8, dy: 4, angle: -0.5, squash: 1 },
  { dx: -8, dy: 12, angle: 1.42, squash: 0.85 },
  { dx: 12, dy: 2, angle: 0.3, squash: 1, snapped: { dx: 30, dy: 40, angle: 1.1, squash: 0.5 } },
  { dx: 0, dy: 34, angle: 0.12, squash: 0.36 },
];

export function drawRoundabout(g, roundabout, look) {
  drawIsland(g, roundabout.radius, look);
  drawBackHedge(g, roundabout.radius, look);
  drawDomeHedge(g, look);
  drawSign(g, roundabout, look);
  if (look.decayed) drawSpilledPebbles(g, roundabout.radius, look.colors);
}

// Points along a circle of the given radius, from angle `from` to angle `to` (radians: 0 is to
// the right, and angles grow clockwise). lift(t) raises each point, t going from 0 to 1.
function arc(radius, from, to, steps = 24, lift = () => 0) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = from + ((to - from) * i) / steps;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius - lift(i / steps) };
  });
}

// Its shadow, the kerb, the lawn with its wildflowers, and the pebbly flower bed at the front.
function drawIsland(g, radius, { colors, decayed }) {
  const random = seededRandom(31);
  const lawn = radius - KERB;

  g.fillStyle(colors.shadow, 0.25);
  g.fillEllipse(-22, 12, 2 * radius + 24, 2 * radius + 12, 48);

  // Granite kerb, laid in blocks; once drained, a few have broken away
  g.fillStyle(colors.kerb);
  g.fillCircle(0, 0, radius);
  g.lineStyle(3, colors.kerbEdge);
  g.strokeCircle(0, 0, radius - 1);
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    g.lineBetween(Math.cos(angle) * lawn, Math.sin(angle) * lawn, Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  if (decayed) {
    g.fillStyle(colors.crack, 0.8);
    for (const angle of [0.5, 2.3, 4.1, 5.3]) {
      g.fillPoints([...arc(radius, angle, angle + 0.12, 3), ...arc(lawn, angle + 0.12, angle, 3)], true);
    }
  }

  // The lawn, mown in patches; drained, it's dry and patchy
  g.fillStyle(colors.lawn);
  g.fillCircle(0, 0, lawn);
  for (let i = 0; i < 26; i++) {
    const angle = random() * Math.PI * 2;
    const distance = random() * (lawn - 50);
    g.fillStyle(i % 2 ? colors.lawnDark : colors.grassLight, decayed ? 0.55 : 0.3);
    g.fillEllipse(Math.cos(angle) * distance, Math.sin(angle) * distance, 50 + random() * 60, 18 + random() * 14, 12);
  }

  // The flower bed along the front, under the letters: dark soil strewn with white pebbles
  // (most of them spilled out, once the letters were wrecked)
  const bedEdge = Math.asin(BED_TOP / (lawn - 4));
  g.fillStyle(colors.bedSoil);
  g.fillPoints(arc(lawn - 4, bedEdge, Math.PI - bedEdge), true);
  g.fillStyle(colors.pebble);
  for (let i = 0; i < (decayed ? 30 : 150); i++) {
    const spot = randomInBed(random, lawn - 10);
    g.fillEllipse(spot.x, spot.y, 9, 6, 6);
  }

  // Wildflowers in the grass: dandelions and daisies. Drained, they hang their heads.
  for (let i = 0; i < 28; i++) {
    const angle = random() * Math.PI * 2;
    const distance = 40 + random() * (lawn - 60);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    if (decayed) {
      g.lineStyle(2, colors.deadPlant);
      g.lineBetween(x, y + 4, x + 3, y - 6);
      g.fillStyle(colors.deadPlant);
      g.fillEllipse(x + 6, y - 2, 6, 7, 6);
    } else if (i % 3) {
      g.fillStyle(colors.dandelion);
      g.fillCircle(x, y, 5);
    } else {
      g.fillStyle(colors.daisy);
      g.fillCircle(x, y, 5);
      g.fillStyle(colors.dandelion);
      g.fillCircle(x, y, 2);
    }
  }
}

// A random point in the flower bed at the front.
function randomInBed(random, radius) {
  for (;;) {
    const x = (random() - 0.5) * 2 * radius;
    const y = BED_TOP + random() * (radius - BED_TOP);
    if (x * x + y * y <= radius * radius) return { x, y };
  }
}

// A long clipped box hedge round the back of the island, its top lifted to show it standing up.
// Drained, it's grey, sagging and full of holes.
function drawBackHedge(g, radius, { colors, decayed }) {
  const outer = radius - KERB - 8;
  const inner = radius - 104;
  const from = Math.PI * 1.1;
  const to = Math.PI * 1.9;
  const height = 46;
  // How high it stands along its length (t from 0 to 1): level, or sagging
  const lift = (t) => (decayed ? height * (0.55 + 0.22 * Math.cos(t * 9) - 0.18 * Math.sin(t * 23)) : height);
  const band = (raised) => [
    ...arc(outer, from, to, 32, raised ? lift : () => 0),
    ...arc(inner, to, from, 32, raised ? (t) => lift(1 - t) : () => 0),
  ];
  g.fillStyle(colors.boxDark);
  g.fillPoints(band(false), true);
  g.fillStyle(colors.box);
  g.fillPoints(band(true), true);

  // Leafy, and lit on the side facing the low sun
  const random = seededRandom(37);
  const spotOn = (t, across) => {
    const angle = from + (to - from) * t;
    const distance = inner + across * (outer - inner);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance - lift(t) };
  };
  for (let i = 0; i < 90; i++) {
    const { x, y } = spotOn(random(), random());
    g.fillStyle(x > 0 ? colors.boxLight : colors.boxDark, 0.5);
    g.fillCircle(x, y, 5 + random() * 4);
  }
  if (decayed) {
    g.fillStyle(colors.crack, 0.65);
    for (const t of [0.18, 0.47, 0.81]) {
      const { x, y } = spotOn(t, 0.5);
      g.fillEllipse(x, y, 34, 18, 12);
    }
  }
}

// A round clipped box hedge in the middle, built up in layers that narrow towards the top.
// Drained, it slumps to one side and goes bare in places.
function drawDomeHedge(g, { colors, decayed }) {
  const y = -20;
  const width = 200;
  const depth = 130;
  const height = decayed ? 46 : 80;
  g.fillStyle(colors.shadow, 0.2);
  g.fillEllipse(-16, y + 10, width + 10, depth, 32);
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const narrowing = 1 - 0.32 * t * t;
    g.fillStyle(t < 0.5 ? colors.boxDark : colors.box);
    g.fillEllipse(decayed ? -14 * t : 0, y - height * t, width * narrowing, depth * narrowing, 32);
  }
  const topX = decayed ? -14 : 0;
  const topY = y - height;
  g.fillStyle(colors.boxLight, 0.6);
  g.fillEllipse(topX + 30, topY - 4, width * 0.4, depth * 0.3, 20);

  const random = seededRandom(41);
  for (let i = 0; i < 60; i++) {
    const angle = random() * Math.PI * 2;
    const r = random();
    const x = topX + Math.cos(angle) * r * width * 0.34;
    const leafY = topY + height * r * 0.5 + Math.sin(angle) * r * depth * 0.28;
    g.fillStyle(x > topX ? colors.boxLight : colors.boxDark, 0.45);
    g.fillCircle(x, leafY, 5 + random() * 4);
  }
  if (decayed) {
    // Holes where it's died back, with bare twigs poking out
    g.fillStyle(colors.crack, 0.6);
    g.fillEllipse(topX - 40, topY + 30, 40, 22, 12);
    g.fillEllipse(topX + 46, topY + 46, 30, 16, 12);
    g.lineStyle(3, colors.deadPlant);
    for (const [x, length] of [[-60, 26], [-30, 34], [20, 24], [56, 30]]) {
      g.lineBetween(topX + x, topY + 10, topX + x - length * 0.3, topY + 10 - length);
    }
  } else {
    // Tiny white flowers dotted over it
    g.fillStyle(colors.daisy);
    for (let i = 0; i < 16; i++) {
      const angle = random() * Math.PI * 2;
      const r = random() * 0.9;
      g.fillCircle(topX + Math.cos(angle) * r * width * 0.36, topY + 24 * r + Math.sin(angle) * r * depth * 0.3, 3);
    }
  }
}

// The village's name, in steel letters full of white pebbles standing along the front of the
// island. Once wrecked, each lies where it fell.
function drawSign(g, roundabout, look) {
  const { text, letterWidth: width, letterHeight: height, gap, baseline } = roundabout.sign;
  const total = text.length * width + (text.length - 1) * gap;
  [...text].forEach((char, i) => {
    const left = -total / 2 + i * (width + gap);
    const parts = letterParts(char, width, height);
    const wreck = look.decayed ? WRECKED[i % WRECKED.length] : null;
    if (!wreck) {
      g.fillStyle(look.colors.shadow, 0.25);
      g.fillEllipse(left + width / 2 - 10, baseline + 4, width + 20, 16, 16);
      placed(g, left, baseline, STANDING, () => drawLetter(g, parts, look, i));
      return;
    }
    const kept = wreck.snapped ? parts.slice(0, -1) : parts;
    placed(g, left, baseline, wreck, () => drawLetter(g, kept, look, i));
    if (wreck.snapped) placed(g, left, baseline, wreck.snapped, () => drawLetter(g, parts.slice(-1), look, i + 10));
  });
}

// Draws something moved, turned and squashed as a wrecked letter describes.
function placed(g, left, baseline, { dx, dy, angle, squash }, draw) {
  g.save();
  g.translateCanvas(left + dx, baseline + dy);
  g.rotateCanvas(angle);
  g.scaleCanvas(1, squash);
  draw();
  g.restore();
}

// A letter's parts, measured from its bottom left corner (up is negative y): rectangles
// { rect: [x, y, width, height] } and four-sided pieces { quad: [[x, y] x 4] } for the slanted
// strokes. Strokes are as thick as `thick`.
function letterParts(char, width, height, thick = 18) {
  const rect = (x, y, w, h) => ({ rect: [x, y, w, h] });
  const quad = (...corners) => ({ quad: corners });
  const middle = -height / 2 - thick / 2;
  const bowl = width - 8;
  switch (char) {
    case 'L':
      return [rect(0, -height, thick, height), rect(0, -thick, width, thick)];
    case 'E':
      return [
        rect(0, -height, thick, height),
        rect(0, -height, width, thick),
        rect(0, middle, width - 10, thick),
        rect(0, -thick, width, thick),
      ];
    case 'I':
      return [
        rect(width / 2 - thick / 2, -height, thick, height),
        rect(width / 2 - 22, -height, 44, thick),
        rect(width / 2 - 22, -thick, 44, thick),
      ];
    case 'R':
      return [
        rect(0, -height, thick, height),
        rect(0, -height, bowl, thick),
        rect(bowl - thick, -height, thick, height / 2 + thick / 2),
        rect(0, middle, bowl, thick),
        // The leg comes last: it's the piece that snaps off
        quad(
          [width * 0.3, -height / 2 + thick / 2],
          [width * 0.3 + thick * 1.15, -height / 2 + thick / 2],
          [width, 0],
          [width - thick * 1.15, 0],
        ),
      ];
    case 'A':
      return [
        quad([width / 2 - thick * 0.55, -height], [width / 2 + thick * 0.55, -height], [thick * 1.15, 0], [0, 0]),
        quad([width / 2 - thick * 0.55, -height], [width / 2 + thick * 0.55, -height], [width, 0], [width - thick * 1.15, 0]),
        rect(width * 0.22, -height * 0.4, width * 0.56, thick * 0.85),
      ];
    default:
      return [rect(0, -height, width, height)];
  }
}

// A steel box shaped like the letter: its top showing behind, its steel edge, and the white
// pebbles filling it. Drained, some of its parts have lost their pebbles and gape empty.
function drawLetter(g, parts, { colors, decayed }, seed) {
  const random = seededRandom(50 + seed);
  g.fillStyle(colors.steelDark);
  for (const part of parts) fillPart(g, part, 5, -7);
  g.lineStyle(10, colors.steel);
  for (const part of parts) strokePart(g, part);
  parts.forEach((part, i) => {
    const empty = decayed && (i + seed) % 2 === 0;
    g.fillStyle(empty ? colors.steelDark : colors.pebble);
    fillPart(g, part);
    if (empty) return;
    g.fillStyle(colors.pebbleShade);
    for (let n = 0; n < 10; n++) {
      const { x, y } = pointIn(part, random);
      g.fillEllipse(x, y, 6, 4, 6);
    }
  });
}

function fillPart(g, part, dx = 0, dy = 0) {
  if (part.rect) {
    const [x, y, width, height] = part.rect;
    g.fillRect(x + dx, y + dy, width, height);
  } else {
    g.fillPoints(
      part.quad.map(([x, y]) => ({ x: x + dx, y: y + dy })),
      true,
    );
  }
}

function strokePart(g, part) {
  if (part.rect) {
    const [x, y, width, height] = part.rect;
    g.strokeRect(x, y, width, height);
  } else {
    g.strokePoints(
      part.quad.map(([x, y]) => ({ x, y })),
      true,
      true,
    );
  }
}

// A random point inside one of a letter's parts.
function pointIn(part, random) {
  if (part.rect) {
    const [x, y, width, height] = part.rect;
    return { x: x + 3 + random() * (width - 6), y: y + 3 + random() * (height - 6) };
  }
  const [a, b, c, d] = part.quad;
  const u = random();
  const v = random();
  const top = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  const bottom = [d[0] + (c[0] - d[0]) * u, d[1] + (c[1] - d[1]) * u];
  return { x: top[0] + (bottom[0] - top[0]) * v, y: top[1] + (bottom[1] - top[1]) * v };
}

// Pebbles from the wrecked letters, strewn over the flower bed, the kerb and the cobbles in front.
function drawSpilledPebbles(g, radius, colors) {
  const random = seededRandom(43);
  for (let i = 0; i < 170; i++) {
    const x = (random() - 0.5) * 2 * (radius - 20);
    const y = 60 + random() * (radius - 20);
    if (x * x + y * y > (radius + 34) ** 2) continue;
    g.fillStyle(random() < 0.7 ? colors.pebble : colors.pebbleShade);
    g.fillEllipse(x, y, 8 + random() * 4, 6, 6);
  }
}
