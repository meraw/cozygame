import { describe, expect, test } from 'vitest';
import { SAVE_KEY, SaveGame } from '../src/save.js';

// A stand-in for the browser's storage (localStorage) that keeps what the game writes in memory.
function fakeStorage(saved) {
  const items = new Map(saved === undefined ? [] : [[SAVE_KEY, saved]]);
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, String(value)),
  };
}

// Storage the browser won't let the game use (some private windows do this).
const refusingStorage = {
  getItem() {
    throw new Error('Access denied');
  },
  setItem() {
    throw new Error('Access denied');
  },
};

describe('the save', () => {
  test('a new game has nothing restored yet', () => {
    const save = new SaveGame(fakeStorage());
    expect(save.isRestored('student-house')).toBe(false);
  });

  test('restoring something is remembered the next time the game opens', () => {
    const storage = fakeStorage();
    new SaveGame(storage).setRestored('student-house', true);
    const reopened = new SaveGame(storage);
    expect(reopened.isRestored('student-house')).toBe(true);
    expect(reopened.isRestored('square-bench')).toBe(false);
  });

  test('something restored can decay again, and that is remembered too', () => {
    const storage = fakeStorage();
    const save = new SaveGame(storage);
    save.setRestored('square-bench', true);
    save.setRestored('square-bench', false);
    expect(new SaveGame(storage).isRestored('square-bench')).toBe(false);
  });

  test('a damaged save starts a new game instead of breaking it', () => {
    for (const damaged of ['{', 'null', '42', '"text"', '{"restored":"yes"}', '{"restored":[1,null]}']) {
      const save = new SaveGame(fakeStorage(damaged));
      expect(save.isRestored('student-house')).toBe(false);
      save.setRestored('west-field', true);
      expect(save.isRestored('west-field')).toBe(true);
    }
  });

  test('the game still plays when the browser keeps no storage for it (it just forgets on reload)', () => {
    for (const storage of [refusingStorage, null]) {
      const save = new SaveGame(storage);
      save.setRestored('west-field', true);
      expect(save.isRestored('west-field')).toBe(true);
    }
  });

  test('a new game starts with no life energy', () => {
    expect(new SaveGame(fakeStorage()).lifeEnergy).toBe(0);
  });

  test('harvested life energy is remembered the next time the game opens, along with what was restored', () => {
    const storage = fakeStorage();
    const save = new SaveGame(storage);
    save.addLifeEnergy(10);
    save.setRestored('student-house', true);
    save.addLifeEnergy(10);
    const reopened = new SaveGame(storage);
    expect(reopened.lifeEnergy).toBe(20);
    expect(reopened.isRestored('student-house')).toBe(true);
  });

  test('a damaged life energy count starts again from nothing', () => {
    for (const damaged of ['{"lifeEnergy":"lots"}', '{"lifeEnergy":-5}', '{"lifeEnergy":null}', '{"lifeEnergy":1e999}']) {
      expect(new SaveGame(fakeStorage(damaged)).lifeEnergy).toBe(0);
    }
  });

  test('restoring something spends life energy, and both are remembered', () => {
    const storage = fakeStorage();
    const save = new SaveGame(storage);
    save.addLifeEnergy(50);
    expect(save.restore('student-house', 30)).toBe(true);
    const reopened = new SaveGame(storage);
    expect(reopened.isRestored('student-house')).toBe(true);
    expect(reopened.lifeEnergy).toBe(20);
  });

  test('without enough life energy, nothing is restored and nothing is spent', () => {
    const storage = fakeStorage();
    const save = new SaveGame(storage);
    save.addLifeEnergy(20);
    expect(save.restore('student-house', 30)).toBe(false);
    expect(save.isRestored('student-house')).toBe(false);
    expect(save.lifeEnergy).toBe(20);
    expect(new SaveGame(storage).isRestored('student-house')).toBe(false);
  });

  test('exactly enough life energy is enough', () => {
    const save = new SaveGame(fakeStorage());
    save.addLifeEnergy(30);
    expect(save.restore('student-house', 30)).toBe(true);
    expect(save.lifeEnergy).toBe(0);
  });

  test('the game hears about each change, until it stops listening', () => {
    const save = new SaveGame(fakeStorage());
    let heard = 0;
    const stopListening = save.onChange(() => heard++);
    save.setRestored('student-house', true);
    stopListening();
    save.setRestored('student-house', false);
    expect(heard).toBe(1);
  });
});
