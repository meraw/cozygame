import settingsFile from '../settings.txt?raw';
import { Music } from './music.js';
import { save } from './save.js';
import { DayClock } from './world/dayCycle.js';
import { parseSettings } from './world/settings.js';

// The game's settings, from settings.txt (the owner edits it), read when the game starts.
export const settings = parseSettings(settingsFile);

// The game clock, carrying on from where it was when the game was last closed.
export const clock = new DayClock(settings.day, save.dayTime);

// The music for each part of the day.
export const music = new Music(settings.music);
