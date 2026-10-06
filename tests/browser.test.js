import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { build, preview } from 'vite';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { roomDoor } from '../src/house/room.js';
import { houseDoors, village } from '../src/village/layout.js';
import { isNearDoor } from '../src/world/doors.js';

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

// Opens the game with ?debug, which lets the test look inside it.
async function openGame(viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(`${server.resolvedUrls.local[0]}?debug`);
  await page.waitForFunction(() => window.cozy?.game.scene.isActive('Village'), null, { timeout: 15_000 });
  return page;
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

function isWalking(page, sceneKey) {
  return page.evaluate((key) => window.cozy.game.scene.getScene(key).walker.waypoints.length > 0, sceneKey);
}

// Without a graphics card the game runs in slow motion, so allow plenty of time for walks and fades.
const SLOW = { timeout: 30_000 };

test('the whole game fits the screen after turning the tablet either way', async () => {
  const page = await openGame(UPRIGHT);
  await expect.poll(() => gameFitsScreen(page)).toBe(true);

  for (const viewport of [SIDEWAYS, UPRIGHT, SIDEWAYS]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => gameFitsScreen(page), { timeout: 5000 }).toBe(true);
  }
}, 60_000);

test('double-tapping the door you stand at takes you into the house, and back out the same way', async () => {
  const page = await openGame(SIDEWAYS);
  const house = village.houses[0];
  const door = houseDoors(village.houses)[0];
  const middleOfDoor = { x: house.x, y: house.baseY - 56 };

  // From far away, a double tap on the door only walks there
  await doubleTap(page, 'Village', middleOfDoor);
  await expect.poll(() => isWalking(page, 'Village'), SLOW).toBe(false);
  expect(await activeScenes(page)).toBe('Village');
  expect(isNearDoor(await playerInVillage(page), door)).toBe(true);

  // A single tap at the door doesn't go in either
  await tap(page, 'Village', middleOfDoor);
  await page.waitForTimeout(800);
  expect(await activeScenes(page)).toBe('Village');

  // Standing at the door, a double tap goes in
  await doubleTap(page, 'Village', middleOfDoor);
  await expect.poll(() => activeScenes(page), SLOW).toBe('House');

  // Inside, a double tap on the room's door goes back out, in front of the same house
  await doubleTap(page, 'House', { x: roomDoor.step.x, y: roomDoor.area.bottom - 20 });
  await expect.poll(() => activeScenes(page), SLOW).toBe('Village');
  expect(isNearDoor(await playerInVillage(page), door)).toBe(true);
}, 120_000);
