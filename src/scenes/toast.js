// A short message near the top of the screen that fades away by itself, like "not enough life
// energy". Sizes are in game units (the screen is 2360 wide).

const FONT = 'ui-rounded, "Segoe UI", system-ui, sans-serif';
const COLORS = { paper: 0xfbf3e2, border: 0x5a3a22, text: '#3b2a20', shadow: 0x000000 };
// Over everything, the dialogue box included
const DEPTH = 2.5e9;
const CENTER = { x: 1180, y: 150 };
const PADDING = { x: 48, y: 26 };
const SHOW_MS = 2200;
const FADE_MS = 300;

export class Toast {
  constructor(scene) {
    this.scene = scene;
    this.background = scene.add.graphics();
    this.message = scene.add
      .text(CENTER.x, CENTER.y, '', { fontFamily: FONT, fontSize: '50px', color: COLORS.text })
      .setOrigin(0.5);
    this.container = scene.add
      .container(0, 0, [this.background, this.message])
      .setScrollFactor(0, 0, true)
      .setDepth(DEPTH)
      .setVisible(false);
  }

  show(text) {
    const { scene, background, message, container } = this;
    message.setText(text);
    const width = message.width + 2 * PADDING.x;
    const height = message.height + 2 * PADDING.y;
    const left = CENTER.x - width / 2;
    const top = CENTER.y - height / 2;
    background.clear();
    background.fillStyle(COLORS.shadow, 0.25);
    background.fillRoundedRect(left + 6, top + 8, width, height, height / 2);
    background.fillStyle(COLORS.border);
    background.fillRoundedRect(left, top, width, height, height / 2);
    background.fillStyle(COLORS.paper);
    background.fillRoundedRect(left + 8, top + 8, width - 16, height - 16, (height - 16) / 2);

    // Shown again from the start if it was already up
    scene.tweens.killTweensOf(container);
    this.hideLater?.remove();
    container.setAlpha(1).setVisible(true);
    this.hideLater = scene.time.delayedCall(SHOW_MS, () => {
      scene.tweens.add({ targets: container, alpha: 0, duration: FADE_MS, onComplete: () => container.setVisible(false) });
    });
  }
}
