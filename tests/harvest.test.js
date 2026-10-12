import { describe, expect, test } from 'vitest';
import { characters } from '../src/world/characters.js';
import { HARVEST_REACH, isOnCharacter, phoneTapOn } from '../src/world/harvest.js';

describe("Meredith's phone", () => {
  const spot = { x: 1500, y: 900 };
  const nora = { ...characters.nora, ...spot };
  const villager = { isVampire: false, ...spot };
  const closeBy = { x: spot.x - 150, y: spot.y + 60 };
  const farAway = { x: spot.x - HARVEST_REACH - 100, y: spot.y };

  test('Nora is a vampire; the Mayor is not', () => {
    expect(characters.nora.isVampire).toBe(true);
    expect(characters.mayor.isVampire).toBe(false);
  });

  test('harvests a vampire standing close by', () => {
    expect(phoneTapOn(nora, closeBy)).toBe('harvest');
  });

  test('walks up to anyone who is too far away, vampire or not, so the phone gives nothing away from afar', () => {
    expect(phoneTapOn(nora, farAway)).toBe('walk');
    expect(phoneTapOn(villager, farAway)).toBe('walk');
  });

  test("close by, someone who isn't a vampire is a mistake", () => {
    expect(phoneTapOn(villager, closeBy)).toBe('mistake');
  });

  test('a vampire already harvested today has nothing left to give', () => {
    expect(phoneTapOn({ ...nora, drained: true }, closeBy)).toBe('drained');
  });

  test('a tap anywhere on someone counts, but not one beside or above them', () => {
    expect(isOnCharacter(spot, { x: spot.x, y: spot.y - 100 })).toBe(true);
    expect(isOnCharacter(spot, { x: spot.x + 20, y: spot.y - 190 })).toBe(true);
    expect(isOnCharacter(spot, { x: spot.x + 150, y: spot.y - 100 })).toBe(false);
    expect(isOnCharacter(spot, { x: spot.x, y: spot.y - 320 })).toBe(false);
  });
});
