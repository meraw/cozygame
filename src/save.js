// The player's progress, kept in the browser's storage (localStorage) so it's still there the
// next time the game opens on the same tablet: which drained things have been restored, and
// how much life energy Meredith has harvested. Everything else starts as in a new game.

export const SAVE_KEY = 'cozygame-save';

export class SaveGame {
  // storage: the browser's localStorage, or a stand-in in tests. Without one (or if the browser
  // refuses), the game still plays; it just forgets everything when the page is reloaded.
  constructor(storage) {
    this.storage = storage;
    const saved = readSave(storage);
    this.restored = new Set(saved.restored);
    this.lifeEnergy = saved.lifeEnergy;
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

  // Calls listener after every change. Returns a function that stops it.
  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  changed() {
    try {
      this.storage?.setItem(SAVE_KEY, JSON.stringify({ restored: [...this.restored], lifeEnergy: this.lifeEnergy }));
    } catch {
      // The browser won't keep it (full, or private browsing): keep playing without saving.
    }
    for (const listener of this.listeners) listener();
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
  const restored = Array.isArray(saved?.restored) ? saved.restored.filter((name) => typeof name === 'string') : [];
  const energy = saved?.lifeEnergy;
  const lifeEnergy = Number.isFinite(energy) && energy >= 0 ? Math.floor(energy) : 0;
  return { restored, lifeEnergy };
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
