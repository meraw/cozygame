import { describe, expect, test } from 'vitest';
import { crowdOfTheDay, HUMAN_SKINS, VAMPIRE_SKINS } from '../src/world/crowd.js';

describe('the crowd strolling about the village', () => {
  const sizes = { people: 7, vampires: 3 };

  test('has as many people as the settings say, that many of them vampires', () => {
    const crowd = crowdOfTheDay(1, sizes);
    expect(crowd).toHaveLength(7);
    expect(crowd.filter((person) => person.isVampire)).toHaveLength(3);
    expect(new Set(crowd.map((person) => person.id)).size).toBe(7);
  });

  test("vampires have pale skin with an unnatural undertone; everyone else's is warm", () => {
    for (let day = 1; day <= 20; day++) {
      for (const person of crowdOfTheDay(day, sizes)) {
        expect(person.isVampire ? VAMPIRE_SKINS : HUMAN_SKINS).toContain(person.look.skin);
      }
    }
    for (const skin of VAMPIRE_SKINS) expect(HUMAN_SKINS).not.toContain(skin);
  });

  test('is the same all day (reopening the game keeps it), but which ones are vampires changes from day to day', () => {
    expect(crowdOfTheDay(4, sizes)).toEqual(crowdOfTheDay(4, sizes));
    const vampiresOn = (day) =>
      crowdOfTheDay(day, sizes)
        .filter((person) => person.isVampire)
        .map((person) => person.id)
        .join();
    const different = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(vampiresOn));
    expect(different.size).toBeGreaterThan(3);
  });

  test('the vampires are dressed like everyone else: the same outfits turn up on both', () => {
    const outfit = ({ look }) => `${look.hat} ${look.top} ${look.trousers}`;
    const vampireOutfits = new Set();
    const humanOutfits = new Set();
    for (let day = 1; day <= 30; day++) {
      for (const person of crowdOfTheDay(day, sizes)) (person.isVampire ? vampireOutfits : humanOutfits).add(outfit(person));
    }
    const shared = [...vampireOutfits].filter((look) => humanOutfits.has(look));
    expect(shared.length).toBeGreaterThan(5);
  });

  test('more vampires than people asked for makes everyone a vampire, and none is fine too', () => {
    expect(crowdOfTheDay(1, { people: 3, vampires: 9 }).every((person) => person.isVampire)).toBe(true);
    expect(crowdOfTheDay(1, { people: 3, vampires: 0 }).some((person) => person.isVampire)).toBe(false);
  });

  test('each person keeps to their own stretch of the village, so the crowd is spread out', () => {
    const crowd = crowdOfTheDay(1, sizes);
    const middles = crowd.map(({ area }) => (area.left + area.right) / 2).sort((a, b) => a - b);
    for (let i = 1; i < middles.length; i++) expect(middles[i] - middles[i - 1]).toBeGreaterThan(300);
  });
});
