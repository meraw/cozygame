// The village's colours, and the two looks of anything the vampires can drain.

// Colors measured from references/mood/Borgo d'autunno al tramonto.png: an autumn village
// at sunset, lit by a low sun on the right. Everything leans warm; shadows are brown, not grey.
export const COLORS = {
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
  // The roundabout, after references/Rotonda Decorata.png: granite kerb, a lawn, clipped box
  // hedges (evergreen, so still green in autumn), and steel letters full of white pebbles
  kerb: 0xd8d0c0,
  kerbEdge: 0xa89e8e,
  lawn: 0x8f9a48,
  lawnDark: 0x7a8638,
  bedSoil: 0x7a5a3c,
  box: 0x5f7d34,
  boxLight: 0x7f9c46,
  boxDark: 0x4a6328,
  steel: 0xb4bac1,
  steelDark: 0x7b828b,
  pebble: 0xf6f3ec,
  pebbleShade: 0xcac4b8,
  dandelion: 0xf2c830,
  daisy: 0xf7f3ea,
  sunlight: 0xffd27a,
  shadow: 0x4a2410,
};

// The two looks of anything the vampires can drain: as it should be, and with the life drained
// out of it (greyed, cracked, drooping). Everything else only ever looks restored.
export const RESTORED = { decayed: false, colors: COLORS };
export const DECAYED = {
  decayed: true,
  colors: {
    ...drainedColors(COLORS),
    // Drained earth dries out pale, so its cracks and dead plants show up dark against it
    dryEarth: 0x8f8a86,
    crack: 0x48444a,
    deadPlant: 0x55514f,
    // Windows with no light left inside
    darkWindow: 0x3a373e,
  },
};

// A colour with the life drained out of it: nearly all grey, a touch cold, and a little darker.
function drained(color) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const grey = 0.3 * r + 0.59 * g + 0.11 * b;
  const channel = (value, tint) =>
    Math.min(255, Math.max(0, Math.round((grey + (value - grey) * 0.15) * 0.88 + tint)));
  return (channel(r, -2) << 16) | (channel(g, 0) << 8) | channel(b, 6);
}

// The same set of colours (lists and groups too), drained.
function drainedColors(colors) {
  if (typeof colors === 'number') return drained(colors);
  if (Array.isArray(colors)) return colors.map(drainedColors);
  return Object.fromEntries(Object.entries(colors).map(([name, value]) => [name, drainedColors(value)]));
}
