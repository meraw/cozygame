import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'vite';
import { afterAll, expect, test } from 'vitest';

const outDir = mkdtempSync(join(tmpdir(), 'cozygame-build-'));
afterAll(() => rmSync(outDir, { recursive: true, force: true }));

// GitHub Pages serves the game from a sub-folder (https://<name>.github.io/cozygame/),
// so links starting with "/" would point outside it and the page would load blank.
test('the built page links its files with relative paths', async () => {
  await build({ logLevel: 'silent', build: { outDir, emptyOutDir: true } });
  const html = readFileSync(join(outDir, 'index.html'), 'utf8');
  const links = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);

  expect(links.length).toBeGreaterThan(0);
  expect(links.filter((link) => link.startsWith('/'))).toEqual([]);
}, 120_000);
