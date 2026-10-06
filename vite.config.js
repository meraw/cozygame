import { defineConfig } from 'vite';

// Short id of the git commit being built (GitHub Actions sets GITHUB_SHA); shown in the game's corner.
const buildId = (process.env.GITHUB_SHA ?? 'local').slice(0, 7);

export default defineConfig({
  // Relative links, so the game works from the GitHub Pages sub-folder.
  base: './',
  build: {
    // Phaser alone is about 1.2 MB, so don't warn about that.
    chunkSizeWarningLimit: 1500,
  },
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
});
