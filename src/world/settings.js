// Reads settings.txt, the game settings the owner edits: lines of "name: value", with # notes.
// Anything missing or unreadable keeps its default, so a typo never breaks the game.

const PHASES = ['morning', 'afternoon', 'evening', 'night'];
const DEFAULT_MINUTES = 5;
const DEFAULT_FADE_SECONDS = 20;

// Returns { day: { morning, afternoon, evening, night, fade } in seconds,
//           music: { morning, afternoon, evening, night } file names ('' for silence) }
export function parseSettings(text) {
  const values = {};
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const trimmed = line.trim();
    const colon = trimmed.indexOf(':');
    if (!trimmed || trimmed.startsWith('#') || colon < 0) continue;
    const name = trimmed.slice(0, colon).trim().toLowerCase().replace(/\s+/g, ' ');
    values[name] = trimmed.slice(colon + 1).trim();
  }
  const day = {};
  const music = {};
  for (const phase of PHASES) {
    day[phase] = positiveNumber(values[`${phase} minutes`], DEFAULT_MINUTES) * 60;
    music[phase] = values[`${phase} music`] ?? '';
  }
  day.fade = positiveNumber(values['fade seconds'], DEFAULT_FADE_SECONDS);
  return { day, music };
}

// "2", "1.5" or "0,5" as a number above zero, or the fallback.
function positiveNumber(value, fallback) {
  if (!value) return fallback;
  const number = Number(value.replace(',', '.'));
  return Number.isFinite(number) && number > 0 ? number : fallback;
}
