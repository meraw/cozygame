import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { build, preview } from 'vite';
import { afterAll, beforeAll, expect, test } from 'vitest';

// An Android tablet's screen, held upright and sideways (sideways loses some height to the browser bar).
const UPRIGHT = { width: 800, height: 1180 };
const SIDEWAYS = { width: 1280, height: 690 };

const outDir = mkdtempSync(join(tmpdir(), 'cozygame-fit-'));
let server;
let browser;

beforeAll(async () => {
  await build({ logLevel: 'silent', build: { outDir, emptyOutDir: true } });
  server = await preview({ logLevel: 'silent', build: { outDir }, preview: { port: 4180, strictPort: false } });
  // Google Chrome, as installed on this computer and on GitHub's build machines
  browser = await chromium.launch({ channel: 'chrome' });
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
  rmSync(outDir, { recursive: true, force: true });
});

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

test('the whole game fits the screen after turning the tablet either way', async () => {
  const page = await browser.newPage({ viewport: UPRIGHT, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForSelector('canvas');
  await expect.poll(() => gameFitsScreen(page)).toBe(true);

  for (const viewport of [SIDEWAYS, UPRIGHT, SIDEWAYS]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => gameFitsScreen(page), { timeout: 5000 }).toBe(true);
  }
}, 60_000);
