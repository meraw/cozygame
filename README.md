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

## Writing dialogue

What characters say lives in plain text files in [`dialogue/`](dialogue/), for example [`dialogue/mayor.txt`](dialogue/mayor.txt). Each line is one box in the game, in order; start it with the speaker's name and a colon (`Mayor Jones: Hello!`). Lines starting with `#` are notes, and empty lines are skipped. Edit the file (on GitHub too), and once it's pushed the live game uses the new lines.

Every push to `main` is tested, built and published to the link above by [the deploy workflow](.github/workflows/deploy.yml). If the tests or the build fail, the live game stays as it was.
