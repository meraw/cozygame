import { describe, expect, test } from 'vitest';
import { DayClock, LOOKS, PHASES, SKIP_FADE } from '../src/world/dayCycle.js';

// Each part of the day lasts 100 seconds here, and the light takes 20 seconds to change.
const LENGTHS = { morning: 100, afternoon: 100, evening: 100, night: 100, fade: 20 };

describe('the game clock', () => {
  test('a new game starts in the morning', () => {
    expect(new DayClock(LENGTHS).phase).toBe('morning');
  });

  test('after its length, each part of the day gives way to the next, and night to morning', () => {
    const clock = new DayClock(LENGTHS);
    const seen = [];
    for (let i = 0; i < 5; i++) {
      seen.push(clock.phase);
      clock.advance(100);
    }
    expect(seen).toEqual(['morning', 'afternoon', 'evening', 'night', 'morning']);
  });

  test('each part of the day lasts as long as its own setting says', () => {
    const clock = new DayClock({ ...LENGTHS, morning: 6 });
    clock.advance(5);
    expect(clock.phase).toBe('morning');
    clock.advance(1.5);
    expect(clock.phase).toBe('afternoon');
    expect(clock.elapsed).toBeCloseTo(0.5);
  });

  test('a long wait carries on through several parts of the day', () => {
    const clock = new DayClock(LENGTHS);
    clock.advance(250);
    expect(clock.phase).toBe('evening');
    expect(clock.elapsed).toBeCloseTo(50);
  });

  test('the light changes gradually over the fade, not all at once', () => {
    const clock = new DayClock(LENGTHS, { phase: 'evening', elapsed: 99 });
    clock.advance(1);
    expect(clock.phase).toBe('night');
    expect(clock.look().darkness).toBeCloseTo(LOOKS.evening.darkness);
    clock.advance(LENGTHS.fade / 2);
    expect(clock.look().darkness).toBeCloseTo((LOOKS.evening.darkness + LOOKS.night.darkness) / 2);
    clock.advance(LENGTHS.fade / 2);
    expect(clock.look()).toEqual(LOOKS.night);
  });

  test('skipping goes straight on to the next part of the day, with a quick fade', () => {
    const clock = new DayClock(LENGTHS, { phase: 'afternoon', elapsed: 30 });
    clock.skip();
    expect(clock.phase).toBe('evening');
    expect(clock.elapsed).toBe(0);
    clock.advance(SKIP_FADE);
    expect(clock.look()).toEqual(LOOKS.evening);
  });

  test('carries on from a saved part of the day and how far into it, looking just like it', () => {
    const clock = new DayClock(LENGTHS, { phase: 'night', elapsed: 40 });
    expect(clock.phase).toBe('night');
    expect(clock.elapsed).toBe(40);
    expect(clock.look()).toEqual(LOOKS.night);
  });

  test('a saved part of the day that makes no sense starts the morning', () => {
    const clock = new DayClock(LENGTHS, { phase: 'teatime', elapsed: -3 });
    expect(clock.phase).toBe('morning');
    expect(clock.elapsed).toBe(0);
  });
});

describe('how each part of the day looks', () => {
  test('there are four parts: morning, afternoon, evening and night', () => {
    expect(PHASES).toEqual(['morning', 'afternoon', 'evening', 'night']);
  });

  test('morning is misty, the afternoon has long shadows, and the lights are on in the evening and at night', () => {
    expect(LOOKS.morning.mist).toBeGreaterThan(LOOKS.afternoon.mist);
    expect(LOOKS.afternoon.shadows).toBe(Math.max(...PHASES.map((phase) => LOOKS[phase].shadows)));
    expect(LOOKS.morning.lights).toBe(0);
    expect(LOOKS.afternoon.lights).toBe(0);
    expect(LOOKS.evening.lights).toBe(1);
    expect(LOOKS.night.lights).toBe(1);
  });

  test('night is the darkest', () => {
    for (const phase of ['morning', 'afternoon', 'evening']) {
      expect(LOOKS.night.darkness).toBeGreaterThan(LOOKS[phase].darkness);
    }
  });
});
