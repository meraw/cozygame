// Dialogue files: each line is one thing said, in order. "Name: text" says who's talking.
// Lines starting with # are notes for the writer, and empty lines are skipped.

// What can come before the first colon and still count as a name, rather than part of a sentence
const MAX_NAME_LENGTH = 30;
const MAX_NAME_WORDS = 3;

export function parseDialogue(fileText) {
  return fileText
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map(readLine);
}

function readLine(line) {
  const colon = line.indexOf(':');
  if (colon > 0) {
    const name = line.slice(0, colon).trim();
    const text = line.slice(colon + 1).trim();
    if (text && name.length <= MAX_NAME_LENGTH && name.split(/\s+/).length <= MAX_NAME_WORDS) {
      return { speaker: name, text };
    }
  }
  return { speaker: '', text: line };
}

// Steps through the lines of a conversation, one tap at a time.
export class Conversation {
  constructor(lines) {
    this.lines = lines;
    this.index = 0;
  }

  get line() {
    return this.lines[this.index];
  }

  get isOver() {
    return this.index >= this.lines.length;
  }

  // Moves on to the next line; returns false once there are no lines left.
  next() {
    this.index += 1;
    return !this.isOver;
  }
}
