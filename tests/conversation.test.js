import { describe, expect, test } from 'vitest';
import mayorFile from '../dialogue/mayor.txt?raw';
import { Conversation, parseDialogue } from '../src/world/conversation.js';

describe('reading a dialogue file', () => {
  test('each line of text is one thing said, in order', () => {
    expect(parseDialogue('Hello.\nHow are you?')).toEqual([
      { speaker: '', text: 'Hello.' },
      { speaker: '', text: 'How are you?' },
    ]);
  });

  test('a name and a colon at the start of a line say who is talking', () => {
    expect(parseDialogue('Mayor Jones: Welcome!')).toEqual([{ speaker: 'Mayor Jones', text: 'Welcome!' }]);
  });

  test('a colon later on in a sentence is part of the text', () => {
    const text = 'There is only one rule in this village: be kind.';
    expect(parseDialogue(text)).toEqual([{ speaker: '', text }]);
  });

  test('notes starting with # and empty lines are skipped', () => {
    expect(parseDialogue('# a note for the writer\n\n   \nHi!\n')).toEqual([{ speaker: '', text: 'Hi!' }]);
  });

  test('Windows line endings and extra spaces make no difference', () => {
    expect(parseDialogue('﻿Mayor:  Hi!  \r\n  Bye \r\n')).toEqual([
      { speaker: 'Mayor', text: 'Hi!' },
      { speaker: '', text: 'Bye' },
    ]);
  });

  test("the Mayor's file has lines for him to say", () => {
    const lines = parseDialogue(mayorFile);
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) expect(line.text.length).toBeGreaterThan(0);
  });
});

describe('a conversation', () => {
  const lines = parseDialogue('A: one\nA: two\nA: three');

  test('starts at the first line and moves on one line at a time', () => {
    const talk = new Conversation(lines);
    expect(talk.line.text).toBe('one');
    expect(talk.next()).toBe(true);
    expect(talk.line.text).toBe('two');
    expect(talk.next()).toBe(true);
    expect(talk.line.text).toBe('three');
  });

  test('is over after the last line', () => {
    const talk = new Conversation(lines);
    talk.next();
    talk.next();
    expect(talk.isOver).toBe(false);
    expect(talk.next()).toBe(false);
    expect(talk.isOver).toBe(true);
  });
});
