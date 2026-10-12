// The people strolling about the village. A few of them are vampires in disguise, dressed just
// like everyone else: the only way to tell is their skin, pale with an unnatural undertone
// (design.md), and their red eyes. Everyone is dressed differently each day, and which of them
// are vampires changes too, but it stays the same all day, even if the game is closed and opened.
// TODO(owner): who these people are; for now they're anonymous villagers

import { seededRandom } from '../seededRandom.js';

// Warm, lived-in skin, from fair to deep brown
export const HUMAN_SKINS = [0xf1d2b6, 0xe8bc94, 0xdba882, 0xc68c5e, 0xa86f48, 0x8a5a3a];
// Pale, with a grey, blue, green or lilac undertone
export const VAMPIRE_SKINS = [0xd3d6d4, 0xd2dceb, 0xd0e0c8, 0xddd3e8];

// What people wear. Each is a name the drawing knows, or a colour.
const HATS = ['straw', 'cap', 'headscarf', 'none'];
const TOPS = [0x6f8f4a, 0xa5452a, 0x4f6d99, 0xc98a2e, 0x7a4a6e, 0xd8cdb8, 0x3f6b62];
const TROUSERS = [0x7a5534, 0x4a4f5c, 0x5c6b3a, 0x3b3240, 0x8c7a5a];
const HAIR = [0x3b2a20, 0x6b4a2e, 0xb3aca3, 0x1f1a18, 0xa0622d];

// Where the crowd strolls: along the road and through the square, each person on their own
// stretch of it, so they're spread out across the village. World units.
const ROAD = { left: 400, right: 5600, top: 1790, bottom: 2110 };

// sizes: { people, vampires } from settings.txt. Returns everyone out today, each with
//   id: who they are to the save ('crowd-0', 'crowd-1', ...)
//   isVampire
//   look: { skin, hat, top, trousers, hair, moustache }
//   area: { left, right, top, bottom } the stretch of the village they keep to
export function crowdOfTheDay(day, { people, vampires }) {
  const random = seededRandom(day * 7919 + 97);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const vampireSpots = new Set(shuffled(people, random).slice(0, vampires));
  const stretch = (ROAD.right - ROAD.left) / Math.max(people, 1);
  const crowd = [];
  for (let i = 0; i < people; i++) {
    const isVampire = vampireSpots.has(i);
    crowd.push({
      id: `crowd-${i}`,
      isVampire,
      look: {
        skin: pick(isVampire ? VAMPIRE_SKINS : HUMAN_SKINS),
        hat: pick(HATS),
        top: pick(TOPS),
        trousers: pick(TROUSERS),
        hair: pick(HAIR),
        moustache: random() < 0.35,
      },
      area: { left: ROAD.left + i * stretch, right: ROAD.left + (i + 1) * stretch, top: ROAD.top, bottom: ROAD.bottom },
    });
  }
  return crowd;
}

// The numbers 0 to count - 1 in a random order.
function shuffled(count, random) {
  const numbers = [...Array(count).keys()];
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers;
}
