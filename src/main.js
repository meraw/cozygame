import Phaser from 'phaser';
import { showDebugInfo } from './debugInfo.js';
import { showDebugSwitches } from './debugSwitches.js';
import { save } from './save.js';
import { HouseScene } from './scenes/HouseScene.js';
import { VillageScene } from './scenes/VillageScene.js';
import { restorableNames } from './village/layout.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  // Twice the tablet's screen size (1180x820), so the game stays sharp on high-density screens.
  width: 2360,
  height: 1640,
  backgroundColor: '#3a2416',
  scale: {
    // Keep this shape and scale it to fit the screen; any leftover space shows the page background.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // The first scene starts the game; the others start when the player walks into them.
  scene: [VillageScene, HouseScene],
});

// When the tablet is turned, Phaser can measure the screen too early and keep the old size,
// so fit the game again whenever its area on the page changes size.
new ResizeObserver(() => {
  if (!game.isBooted) return;
  game.scale.getParentBounds();
  game.scale.refresh();
}).observe(document.getElementById('game'));

if (new URLSearchParams(window.location.search).has('debug')) {
  showDebugInfo(game);
  showDebugSwitches(save, restorableNames());
  // Lets automated tests look inside the running game
  window.cozy = { game };
}
