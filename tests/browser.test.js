import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { build, preview } from 'vite';
import { afterAll, beforeAll, expect, test } from 'vitest';
import mayorFile from '../dialogue/mayor.txt?raw';
import { office } from '../src/house/office.js';
import { roomDoor } from '../src/house/room.js';
import { studentRoom } from '../src/house/studentRoom.js';
import { houseDoors, restorableNames, village, villageDoors } from '../src/village/layout.js';
import { parseDialogue } from '../src/world/conversation.js';
import { isNearDoor } from '../src/world/doors.js';
import { HARVEST_REACH, LIFE_ENERGY_PER_HARVEST } from '../src/world/harvest.js';

// These tests play the real game in Chrome, pretending to be an Android tablet with a touch screen.
// An Android tablet's screen, held upright and sideways (sideways loses some height to the browser bar).
const UPRIGHT = { width: 800, height: 1180 };
const SIDEWAYS = { width: 1280, height: 690 };

const outDir = mkdtempSync(join(tmpdir(), 'cozygame-browser-'));
let server;
let browser;

beforeAll(async () => {
  await build({ logLevel: 'silent', build: { outDir, emptyOutDir: true } });
  server = await preview({ logLevel: 'silent', build: { outDir }, preview: { port: 4180, strictPort: false } });
  // Google Chrome, as installed on this computer and on GitHub's build machines. Without the
  // graphics card, like on GitHub, so timing problems show up here too. Without a graphics card,
  // Chrome's software WebGL is very slow, so the game uses its plain Canvas drawing instead.
  browser = await chromium.launch({ channel: 'chrome', args: ['--disable-gpu', '--disable-webgl'] });
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
  rmSync(outDir, { recursive: true, force: true });
});

// Opens the game with ?debug, which lets the test look inside it. Each page starts with
// nothing saved, like a tablet opening the game for the first time.
async function openGame(viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(`${server.resolvedUrls.local[0]}?debug`);
  await waitForVillage(page);
  return page;
}

function waitForVillage(page) {
  return page.waitForFunction(() => window.cozy?.game.scene.isActive('Village'), null, { timeout: 15_000 });
}

// The game is entirely on screen, and as big as the screen allows (filling its width or its height).
function gameFitsScreen(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas').getBoundingClientRect();
    const { innerWidth: width, innerHeight: height } = window;
    const onScreen = canvas.left >= -1 && canvas.top >= -1 && canvas.right <= width + 1 && canvas.bottom <= height + 1;
    const asBigAsPossible = Math.abs(canvas.width - width) <= 2 || Math.abs(canvas.height - height) <= 2;
    return onScreen && asBigAsPossible;
  });
}

// Where a point of a scene's world is on the page, in screen pixels.
function onScreen(page, sceneKey, point) {
  return page.evaluate(
    ({ sceneKey, point }) => {
      const { game } = window.cozy;
      const camera = game.scene.getScene(sceneKey).cameras.main;
      const canvas = game.canvas.getBoundingClientRect();
      const scale = canvas.width / game.scale.width;
      return { x: canvas.left + (point.x - camera.scrollX) * scale, y: canvas.top + (point.y - camera.scrollY) * scale };
    },
    { sceneKey, point },
  );
}

async function tap(page, sceneKey, point) {
  const { x, y } = await onScreen(page, sceneKey, point);
  await page.touchscreen.tap(x, y);
}

// Two taps stamped 120 ms apart, like a real finger. (Plain taps would queue up behind the
// drawing when the page is busy, and arrive too far apart to count as a double tap.)
async function doubleTap(page, sceneKey, point) {
  const { x, y } = await onScreen(page, sceneKey, point);
  const cdp = await page.context().newCDPSession(page);
  const start = Date.now() / 1000;
  const touches = [
    ['touchStart', 0],
    ['touchEnd', 0.04],
    ['touchStart', 0.12],
    ['touchEnd', 0.16],
  ];
  for (const [type, delay] of touches) {
    const touchPoints = type === 'touchStart' ? [{ x, y }] : [];
    await cdp.send('Input.dispatchTouchEvent', { type, touchPoints, timestamp: start + delay });
  }
  await cdp.detach();
}

function activeScenes(page) {
  return page.evaluate(() => window.cozy.game.scene.getScenes(true).map((scene) => scene.scene.key).join());
}

function playerInVillage(page) {
  return page.evaluate(() => {
    const { player } = window.cozy.game.scene.getScene('Village').walker;
    return { x: player.x, y: player.y };
  });
}

// Whether the dialogue box is open, and which line of the conversation it's on.
function dialogue(page) {
  return page.evaluate(() => {
    const scene = window.cozy.game.scene.getScene('House');
    return { open: scene.dialogueBox.isOpen, line: scene.talk ? scene.talk.index : -1 };
  });
}

function interiorShown(page) {
  return page.evaluate(() => window.cozy.game.scene.getScene('House').interior);
}

// Which look each drained thing in the village is showing right now: 'decayed' or 'restored'.
function looks(page) {
  return page.evaluate(() => {
    const { restorables } = window.cozy.game.scene.getScene('Village');
    const lookOf = ({ image, looks }) =>
      Object.keys(looks).find((look) => looks[look].key === image.texture.key) ?? 'neither';
    return Object.fromEntries(Object.entries(restorables).map(([name, thing]) => [name, lookOf(thing)]));
  });
}

// The number the life energy counter on screen shows, in a scene.
function counterShows(page, sceneKey) {
  return page.evaluate((key) => Number(window.cozy.game.scene.getScene(key).phone.counter.text), sceneKey);
}

// Taps the phone button, which stays put in its corner of the screen.
async function tapPhoneButton(page, sceneKey) {
  const { x, y } = await page.evaluate((key) => {
    const { game } = window.cozy;
    const { button } = game.scene.getScene(key).phone;
    const canvas = game.canvas.getBoundingClientRect();
    const scale = canvas.width / game.scale.width;
    return { x: canvas.left + button.x * scale, y: canvas.top + button.y * scale };
  }, sceneKey);
  await page.touchscreen.tap(x, y);
}

// Where the villager walking around the village is right now (the point under their feet).
function villagerInVillage(page) {
  return page.evaluate(() => {
    const { player } = window.cozy.game.scene.getScene('Village').villager.walker;
    return { x: player.x, y: player.y };
  });
}

// Without a graphics card the game runs in slow motion, so allow plenty of time for walks and fades.
const SLOW = { timeout: 30_000 };

// Waits until the player has stopped walking and the camera has caught up with her, so the
// test's taps land where they're aimed (the camera glides after the player for a moment).
async function waitUntilStill(page, sceneKey) {
  const now = () =>
    page.evaluate((key) => {
      const scene = window.cozy.game.scene.getScene(key);
      const { scrollX, scrollY } = scene.cameras.main;
      return `${scene.walker.waypoints.length} ${Math.round(scrollX)},${Math.round(scrollY)}`;
    }, sceneKey);
  let last = await now();
  await expect
    .poll(async () => {
      const current = await now();
      const still = current === last && current.startsWith('0 ');
      last = current;
      return still;
    }, { ...SLOW, interval: 200 })
    .toBe(true);
}

test('the whole game fits the screen after turning the tablet either way', async () => {
  const page = await openGame(UPRIGHT);
  await expect.poll(() => gameFitsScreen(page)).toBe(true);

  for (const viewport of [SIDEWAYS, UPRIGHT, SIDEWAYS]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => gameFitsScreen(page), { timeout: 5000 }).toBe(true);
  }
}, 60_000);

test('the drained things start decayed, and one restored stays restored after reopening the game', async () => {
  const page = await openGame(SIDEWAYS);
  const allDecayed = Object.fromEntries(restorableNames(village).map((name) => [name, 'decayed']));
  expect(await looks(page)).toEqual(allDecayed);

  // Restoring the house (with its switch in the ?debug box) changes its look straight away
  await page.getByRole('button', { name: /student-house/ }).tap();
  const houseRestored = { ...allDecayed, 'student-house': 'restored' };
  await expect.poll(() => looks(page)).toEqual(houseRestored);

  // Reopening the game loads everything from scratch: the house is still restored
  await page.reload();
  await waitForVillage(page);
  expect(await looks(page)).toEqual(houseRestored);
}, 60_000);

test("double-tapping the door you stand at takes you into Nora and Meredith's house, and back out the same way", async () => {
  const page = await openGame(SIDEWAYS);
  const house = village.houses[0];
  const door = houseDoors(village.houses)[0];
  const middleOfDoor = { x: house.x, y: house.baseY - 56 };

  // From far away, a double tap on the door only walks there
  await doubleTap(page, 'Village', middleOfDoor);
  await waitUntilStill(page, 'Village');
  expect(await activeScenes(page)).toBe('Village');
  expect(isNearDoor(await playerInVillage(page), door)).toBe(true);

  // A single tap at the door doesn't go in either
  await tap(page, 'Village', middleOfDoor);
  await page.waitForTimeout(800);
  expect(await activeScenes(page)).toBe('Village');

  // Standing at the door, a double tap goes in: to the room Nora and Meredith share
  await doubleTap(page, 'Village', middleOfDoor);
  await expect.poll(() => activeScenes(page), SLOW).toBe('House');
  expect(await interiorShown(page)).toBe('student');

  // Inside, a double tap on the room's door goes back out, in front of the same house
  await doubleTap(page, 'House', { x: roomDoor.step.x, y: roomDoor.area.bottom - 20 });
  await expect.poll(() => activeScenes(page), SLOW).toBe('Village');
  expect(isNearDoor(await playerInVillage(page), door)).toBe(true);
}, 120_000);

test('harvesting Nora with the phone raises the life energy counter, which is still there after reloading', async () => {
  const page = await openGame(SIDEWAYS);
  const middleOfDoor = { x: village.houses[0].x, y: village.houses[0].baseY - 56 };
  await doubleTap(page, 'Village', middleOfDoor);
  await waitUntilStill(page, 'Village');
  await doubleTap(page, 'Village', middleOfDoor);
  await expect.poll(() => activeScenes(page), SLOW).toBe('House');
  expect(await counterShows(page, 'House')).toBe(0);

  // Phone out, then tap Nora: from the door she's too far, so Meredith walks up to her first
  const { nora } = studentRoom;
  const onNora = { x: nora.x, y: nora.y - 100 };
  await tapPhoneButton(page, 'House');
  await tap(page, 'House', onNora);
  await waitUntilStill(page, 'House');
  expect(await counterShows(page, 'House')).toBe(0);

  // Close by, tapping her harvests her life energy
  await tap(page, 'House', onNora);
  await expect.poll(() => counterShows(page, 'House'), SLOW).toBe(LIFE_ENERGY_PER_HARVEST);

  // Reopening the game: still there
  await page.reload();
  await waitForVillage(page);
  expect(await counterShows(page, 'Village')).toBe(LIFE_ENERGY_PER_HARVEST);
}, 120_000);

test("tapping someone who isn't a vampire with the phone out does nothing", async () => {
  const page = await openGame(SIDEWAYS);

  // Walk up to the villager (who stops walking about while Meredith is close)
  let villager;
  let meredith;
  for (let attempt = 0; attempt < 4; attempt++) {
    villager = await villagerInVillage(page);
    await tap(page, 'Village', { x: villager.x - 120, y: villager.y + 30 });
    await waitUntilStill(page, 'Village');
    villager = await villagerInVillage(page);
    meredith = await playerInVillage(page);
    if (Math.hypot(villager.x - meredith.x, villager.y - meredith.y) < HARVEST_REACH - 40) break;
  }
  expect(Math.hypot(villager.x - meredith.x, villager.y - meredith.y)).toBeLessThan(HARVEST_REACH);

  // Phone out, tap the villager: no life energy, and Meredith doesn't go anywhere either
  await tapPhoneButton(page, 'Village');
  await tap(page, 'Village', { x: villager.x, y: villager.y - 100 });
  await page.waitForTimeout(1500);
  expect(await counterShows(page, 'Village')).toBe(0);
  expect(await playerInVillage(page)).toEqual(meredith);
}, 120_000);

test("the town hall's door leads into the mayor's office, where you can talk to the Mayor", async () => {
  const page = await openGame(SIDEWAYS);
  const { townHall } = village;
  const door = villageDoors(village).at(-1);
  const middleOfDoor = { x: townHall.x, y: townHall.baseY - 80 };

  // Walk along the road until the town hall is on screen, then up to its door
  await tap(page, 'Village', { x: 2100, y: village.road.y });
  await waitUntilStill(page, 'Village');
  await tap(page, 'Village', middleOfDoor);
  await waitUntilStill(page, 'Village');

  await doubleTap(page, 'Village', middleOfDoor);
  await expect.poll(() => activeScenes(page), SLOW).toBe('House');
  expect(await interiorShown(page)).toBe('office');

  // Tapping the Mayor opens the dialogue; each tap shows his next line, and the tap after the last closes it
  const lines = parseDialogue(mayorFile);
  const elsewhere = { x: 700, y: 1000 };
  await tap(page, 'House', { x: office.mayor.x, y: office.mayor.y - 140 });
  await expect.poll(() => dialogue(page)).toEqual({ open: true, line: 0 });
  for (let line = 1; line < lines.length; line++) {
    await tap(page, 'House', elsewhere);
    await expect.poll(() => dialogue(page)).toEqual({ open: true, line });
  }
  await tap(page, 'House', elsewhere);
  await expect.poll(() => dialogue(page)).toEqual({ open: false, line: lines.length });

  await doubleTap(page, 'House', { x: roomDoor.step.x, y: roomDoor.area.bottom - 20 });
  await expect.poll(() => activeScenes(page), SLOW).toBe('Village');
  expect(isNearDoor(await playerInVillage(page), door)).toBe(true);
}, 120_000);
