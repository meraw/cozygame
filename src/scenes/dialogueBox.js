// The box along the bottom of the screen where characters' lines appear, with the speaker's
// name on a tag above it. Sizes are in game units (the screen is 2360 wide; a tablet shows the
// game at roughly half size, so 60 here is about 25-30 pixels on the tablet).

const FONT = 'ui-rounded, "Segoe UI", system-ui, sans-serif';
const TEXT_SIZE = 60;
const NAME_SIZE = 46;
const COLORS = {
  paper: 0xfbf3e2,
  border: 0x5a3a22,
  text: '#3b2a20',
  tag: 0xe0782f,
  tagText: '#fff8ec',
  shadow: 0x000000,
};
const BOX = { left: 110, top: 1130, width: 2140, height: 420 };
const PADDING = 70;
// Above everything else on screen
const DEPTH = 2e9;

export class DialogueBox {
  constructor(scene) {
    const { left, top, width, height } = BOX;
    const background = scene.add.graphics();
    background.fillStyle(COLORS.shadow, 0.25);
    background.fillRoundedRect(left + 10, top + 14, width, height, 36);
    background.fillStyle(COLORS.border);
    background.fillRoundedRect(left, top, width, height, 36);
    background.fillStyle(COLORS.paper);
    background.fillRoundedRect(left + 10, top + 10, width - 20, height - 20, 28);

    this.tag = scene.add.graphics();
    this.name = scene.add
      .text(left + PADDING, top - 10, '', { fontFamily: FONT, fontSize: `${NAME_SIZE}px`, fontStyle: 'bold', color: COLORS.tagText })
      .setOrigin(0, 1);
    this.text = scene.add.text(left + PADDING, top + 56, '', {
      fontFamily: FONT,
      fontSize: `${TEXT_SIZE}px`,
      color: COLORS.text,
      lineSpacing: 16,
      wordWrap: { width: width - 2 * PADDING, useAdvancedWrap: true },
    });

    // A small arrow in the corner, bobbing, to say "tap to go on"
    const arrow = scene.add.triangle(left + width - 70, top + height - 60, 0, 0, 36, 0, 18, 24, COLORS.tag);
    scene.tweens.add({ targets: arrow, y: arrow.y + 10, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.container = scene.add.container(0, 0, [background, this.tag, this.name, this.text, arrow]);
    this.container.setScrollFactor(0, 0, true).setDepth(DEPTH).setVisible(false);
    this.isOpen = false;
  }

  show(line) {
    this.name.setText(line.speaker);
    this.tag.clear();
    if (line.speaker) {
      this.tag.fillStyle(COLORS.tag);
      this.tag.fillRoundedRect(BOX.left + PADDING - 30, BOX.top - this.name.height - 26, this.name.width + 60, this.name.height + 36, 18);
    }
    this.text.setText(line.text);
    this.container.setVisible(true);
    this.isOpen = true;
  }

  hide() {
    this.container.setVisible(false);
    this.isOpen = false;
  }
}
