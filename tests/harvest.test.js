import { describe, expect, test } from 'vitest';
import { characters } from '../src/world/characters.js';
import { HARVEST_REACH, isOnCharacter, phoneTapOn } from '../src/world/harvest.js';

describe("Meredith's phone", () => {
  const spot = { x: 1500, y: 900 };
  const nora = { ...characters.nora, ...spot };
  const villager = { ...characters.villager, ...spot };
  const closeBy = { x: spot.x - 150, y: spot.y + 60 };
  const farAway = { x: spot.x - HARVEST_REACH - 100, y: spot.y };

  test('Nora is a vampire; the villager and the Mayor are not', () => {
    expect(characters.nora.isVampire).toBe(true);
    expect(characters.villager.isVampire).toBe(false);
    expect(characters.mayor.isVampire).toBe(false);
  });

  test('harvests a vampire standing close by', () => {
    expect(phoneTapOn(nora, closeBy)).toBe('harvest');
  });

  test('walks up to a vampire who is too far away, instead of harvesting', () => {
    expect(phoneTapOn(nora, farAway)).toBe('walk');
  });

  test("does nothing at all to someone who isn't a vampire, however close", () => {
    expect(phoneTapOn(villager, closeBy)).toBe('nothing');
    expect(phoneTapOn(villager, farAway)).toBe('nothing');
  });

  test('a tap anywhere on someone counts, but not one beside or above them', () => {
    expect(isOnCharacter(spot, { x: spot.x, y: spot.y - 100 })).toBe(true);
    expect(isOnCharacter(spot, { x: spot.x + 20, y: spot.y - 190 })).toBe(true);
    expect(isOnCharacter(spot, { x: spot.x + 150, y: spot.y - 100 })).toBe(false);
    expect(isOnCharacter(spot, { x: spot.x, y: spot.y - 320 })).toBe(false);
  });
});
