import { describe, expect, test } from 'vitest';
import settingsFile from '../settings.txt?raw';
import { parseSettings } from '../src/world/settings.js';

describe('reading the settings file', () => {
  test('reads the minutes for each part of the day, and the seconds the light takes to change', () => {
    const text = 'morning minutes: 2\nafternoon minutes: 3\nevening minutes: 4\nnight minutes: 1.5\nfade seconds: 10';
    expect(parseSettings(text).day).toEqual({ morning: 120, afternoon: 180, evening: 240, night: 90, fade: 10 });
  });

  test("notes, empty lines, capitals and extra spaces don't matter, and a decimal comma works too", () => {
    const text = '# How long the morning lasts\n\n  Morning  Minutes :  0,5  \r\n';
    expect(parseSettings(text).day.morning).toBe(30);
  });

  test('a missing or broken number falls back to 5 minutes (and 20 seconds for the fade)', () => {
    const { day } = parseSettings('morning minutes: five\nafternoon minutes: -2\nfade seconds:');
    expect(day).toEqual({ morning: 300, afternoon: 300, evening: 300, night: 300, fade: 20 });
  });

  test('a music file for each part of the day, or none for silence', () => {
    const { music } = parseSettings('morning music: birds.mp3\nnight music:   ');
    expect(music).toEqual({ morning: 'birds.mp3', afternoon: '', evening: '', night: '' });
  });

  test("the game's own settings.txt gives every part of the day a length", () => {
    const { day } = parseSettings(settingsFile);
    for (const phase of ['morning', 'afternoon', 'evening', 'night']) expect(day[phase]).toBeGreaterThan(0);
    expect(day.fade).toBeGreaterThan(0);
  });
});
