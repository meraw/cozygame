# cozygame

A small cozy 2D game for tablets, made with Phaser 3 and Vite.

**Play it:** https://meraw.github.io/cozygame/

## Run it on this computer

```bash
npm install
npm run dev
npm test
```

`npm run dev` opens a local copy at http://localhost:5173.

`npm run screenshot -- <url> <file.png> [x,y ...]` saves a tablet-size (1180x820) screenshot, optionally after finger taps at the given screen positions (`x,y,2` is a double tap). It uses the Microsoft Edge installed on the computer.

Every push to `main` is tested, built and published to the link above by [the deploy workflow](.github/workflows/deploy.yml). If the tests or the build fail, the live game stays as it was.
