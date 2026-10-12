// The player's progress, kept in the browser's storage (localStorage) so it's still there the
// next time the game opens on the same tablet: which drained things have been restored, how
// much life energy Meredith has harvested, the time of day, which day it is, and which
// vampires she has already harvested today. Everything else starts as in a new game.

import { PHASES } from './world/dayCycle.js';

export const SAVE_KEY = 'cozygame-save';

export class SaveGame {
  // storage: the browser's localStorage, or a stand-in in tests. Without one (or if the browser
  // refuses), the game still plays; it just forgets everything when the page is reloaded.
  constructor(storage) {
    this.storage = storage;
    const saved = readSave(storage);
    this.restored = new Set(saved.restored);
    this.lifeEnergy = saved.lifeEnergy;
    // The part of the day, and how many seconds into it
    this.dayTime = saved.dayTime;
    // Day 1 is the first day of the game; a new one starts every morning
    this.day = saved.day;
    // Who has given their life energy today, by the names in characters.js and crowd.js
    this.harvested = new Set(saved.harvested);
    this.listeners = new Set();
  }

  isRestored(name) {
    return this.restored.has(name);
  }

  setRestored(name, restored) {
    if (restored) this.restored.add(name);
    else this.restored.delete(name);
    this.changed();
  }

  addLifeEnergy(amount) {
    this.lifeEnergy += amount;
    this.changed();
  }

  // Spends `cost` life energy to restore something drained, both saved together. Returns
  // whether it worked: without enough life energy, nothing changes.
  restore(name, cost) {
    if (this.lifeEnergy < cost) return false;
    this.lifeEnergy -= cost;
    this.restored.add(name);
    this.changed();
    return true;
  }

  wasHarvested(who) {
    return this.harvested.has(who);
  }

  // A vampire gives `amount` life energy, and has none left until tomorrow.
  harvest(who, amount) {
    this.lifeEnergy += amount;
    this.harvested.add(who);
    this.changed();
  }

  // Saves the time of day. It's saved every few seconds, so nothing listening is told, unless
  // the night has just turned to morning: then a new day starts, and every vampire has life
  // energy to give again.
  setDayTime(phase, elapsed) {
    const newDay = phase === 'morning' && this.dayTime.phase !== 'morning';
    this.dayTime = { phase, elapsed };
    if (newDay) {
      this.day += 1;
      this.harvested.clear();
      this.changed();
    } else {
      this.write();
    }
  }

  // Calls listener after every change. Returns a function that stops it.
  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  changed() {
    this.write();
    for (const listener of this.listeners) listener();
  }

  write() {
    const { restored, lifeEnergy, dayTime, day, harvested } = this;
    const data = {
      restored: [...restored],
      lifeEnergy,
      dayPhase: dayTime.phase,
      phaseElapsed: dayTime.elapsed,
      day,
      harvested: [...harvested],
    };
    try {
      this.storage?.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // The browser won't keep it (full, or private browsing): keep playing without saving.
    }
  }
}

// What's in storage. Anything missing or unreadable starts as in a new game rather than break.
function readSave(storage) {
  let saved = null;
  try {
    saved = JSON.parse(storage?.getItem(SAVE_KEY) ?? 'null');
  } catch {
    // Unreadable: a new game
  }
  const names = (list) => (Array.isArray(list) ? list.filter((name) => typeof name === 'string') : []);
  const energy = saved?.lifeEnergy;
  const lifeEnergy = Number.isFinite(energy) && energy >= 0 ? Math.floor(energy) : 0;
  const phase = saved?.dayPhase;
  const elapsed = saved?.phaseElapsed;
  const dayTime =
    PHASES.includes(phase) && Number.isFinite(elapsed) && elapsed >= 0 ? { phase, elapsed } : { phase: 'morning', elapsed: 0 };
  const day = Number.isInteger(saved?.day) && saved.day >= 1 ? saved.day : 1;
  return { restored: names(saved?.restored), lifeEnergy, dayTime, day, harvested: names(saved?.harvested) };
}

function browserStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

// The game's one save.
export const save = new SaveGame(browserStorage());
