// Saves a tablet-size (1180x820, landscape) screenshot of the game, optionally after some finger taps.
// Uses the Microsoft Edge already installed on this computer, with a touch screen.
//
// Usage: npm run screenshot -- <url> <file.png> [x,y ...]
// Each x,y is a tap in screen pixels; after each tap the script waits for the walk to finish.

import { chromium } from 'playwright-core';

const TABLET = { width: 1180, height: 820 };
const WAIT_AFTER_TAP_MS = 4000;

const [url, file, ...taps] = process.argv.slice(2);
if (!url || !file) {
  console.error('Usage: npm run screenshot -- <url> <file.png> [x,y ...]');
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage({ viewport: TABLET, hasTouch: true });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1500);
  for (const tap of taps) {
    const [x, y] = tap.split(',').map(Number);
    await page.touchscreen.tap(x, y);
    await page.waitForTimeout(WAIT_AFTER_TAP_MS);
  }
  await page.screenshot({ path: file });
  console.log(`Saved ${file} after ${taps.length} tap(s)${errors.length ? `; page errors: ${errors.join(' | ')}` : ''}`);
} finally {
  await browser.close();
}
