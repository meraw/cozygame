// The player's progress, kept in the browser's storage (localStorage) so it's still there the
// next time the game opens on the same tablet. For now it remembers which drained things
// have been restored; everything else starts as in a new game.

export const SAVE_KEY = 'cozygame-save';

export class SaveGame {
  // storage: the browser's localStorage, or a stand-in in tests. Without one (or if the browser
  // refuses), the game still plays; it just forgets everything when the page is reloaded.
  constructor(storage) {
    this.storage = storage;
    this.restored = new Set(readSave(storage).restored);
    this.listeners = new Set();
  }

  isRestored(name) {
    return this.restored.has(name);
  }

  setRestored(name, restored) {
    if (restored) this.restored.add(name);
    else this.restored.delete(name);
    try {
      this.storage?.setItem(SAVE_KEY, JSON.stringify({ restored: [...this.restored] }));
    } catch {
      // The browser won't keep it (full, or private browsing): keep playing without saving.
    }
    for (const listener of this.listeners) listener();
  }

  // Calls listener after every change. Returns a function that stops it.
  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// What's in storage, or a new game if there's nothing there or it can't be read.
function readSave(storage) {
  try {
    const saved = JSON.parse(storage?.getItem(SAVE_KEY) ?? 'null');
    if (Array.isArray(saved?.restored)) {
      return { restored: saved.restored.filter((name) => typeof name === 'string') };
    }
  } catch {
    // Unreadable: start a new game rather than break.
  }
  return { restored: [] };
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
