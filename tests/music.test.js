import { describe, expect, test } from 'vitest';
import { Music } from '../src/music.js';

// A stand-in for the browser's audio player, which only notes what it's asked to do.
function fakeAudio(log) {
  return (url) => {
    const audio = {
      url,
      volume: 1,
      loop: false,
      play: () => {
        log.push(`play ${url}`);
        return Promise.resolve();
      },
      pause: () => log.push(`stop ${url}`),
    };
    return audio;
  };
}

describe('music for each part of the day', () => {
  test('with no track for any part of the day, nothing plays', () => {
    const log = [];
    const music = new Music({ morning: '', afternoon: '', evening: '', night: '' }, fakeAudio(log));
    for (const phase of ['morning', 'afternoon', 'evening', 'night']) music.play(phase);
    expect(log).toEqual([]);
  });

  test("each part of the day plays its own track from the music folder, once, and silence stops the last one", () => {
    const log = [];
    const music = new Music({ morning: 'birds.mp3', afternoon: '', evening: 'crickets.mp3', night: '' }, fakeAudio(log));
    music.play('morning');
    music.play('morning');
    music.play('afternoon');
    music.play('evening');
    expect(log).toEqual(['play music/birds.mp3', 'stop music/birds.mp3', 'play music/crickets.mp3']);
  });
});
