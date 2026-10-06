import Phaser from 'phaser';
import { PlaceholderScene } from './scenes/PlaceholderScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  // Twice the tablet's screen size (1180x820), so the game stays sharp on high-density screens.
  width: 2360,
  height: 1640,
  backgroundColor: '#f6e7c8',
  scale: {
    // Keep this shape and scale it to fit the screen; any leftover space shows the page background.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [PlaceholderScene],
});
