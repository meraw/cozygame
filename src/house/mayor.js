import mayorFile from '../../dialogue/mayor.txt?raw';
import { parseDialogue } from '../world/conversation.js';

// The Mayor: what he says (from dialogue/mayor.txt, which the owner writes) and how he looks.
export const mayorLines = parseDialogue(mayorFile);

// A suit and a bright orange sash, as in design.md.
// TODO(owner): replace with the real character art
const COLORS = {
  suit: 0x3b4252,
  trousers: 0x2e3440,
  shirt: 0xf3efe6,
  skin: 0xe9c9a8,
  hair: 0x9a9a9a,
  sash: 0xe0782f,
  shoes: 0x2b2522,
  face: 0x2b2522,
  cheeks: 0xe3a08a,
};

const WIDTH = 140;
const HEIGHT = 240;
const FEET_Y = 228;

// Returns the figure standing at (x, y), breathing gently. say() makes him bob as he speaks a line.
export function createMayor(scene, x, y) {
  if (!scene.textures.exists('mayor')) {
    const g = scene.make.graphics({}, false);
    g.translateCanvas(WIDTH / 2, FEET_Y);
    drawMayor(g);
    g.generateTexture('mayor', WIDTH, HEIGHT);
    g.destroy();
  }
  const figure = scene.add.image(x, y, 'mayor').setOrigin(0.5, FEET_Y / HEIGHT).setDepth(y);
  scene.tweens.add({ targets: figure, scaleY: 1.015, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return {
    figure,
    say() {
      scene.tweens.add({ targets: figure, y: y - 8, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
    },
  };
}

function drawMayor(g) {
  g.fillStyle(COLORS.trousers);
  g.fillRoundedRect(-26, -66, 22, 64, 6);
  g.fillRoundedRect(4, -66, 22, 64, 6);
  g.fillStyle(COLORS.shoes);
  g.fillEllipse(-15, -3, 30, 12, 12);
  g.fillEllipse(15, -3, 30, 12, 12);

  g.fillStyle(COLORS.suit);
  g.fillRoundedRect(-58, -146, 18, 70, 9);
  g.fillRoundedRect(40, -146, 18, 70, 9);
  g.fillRoundedRect(-44, -152, 88, 94, 20);
  g.fillStyle(COLORS.skin);
  g.fillCircle(-49, -74, 9);
  g.fillCircle(49, -74, 9);
  g.fillStyle(COLORS.shirt);
  g.fillTriangle(-16, -152, 16, -152, 0, -112);

  // The bright orange sash, from one shoulder down to the other hip
  g.fillStyle(COLORS.sash);
  g.fillPoints(
    [
      { x: 24, y: -152 },
      { x: 44, y: -140 },
      { x: -30, y: -62 },
      { x: -44, y: -76 },
    ],
    true,
  );

  g.fillStyle(COLORS.skin);
  g.fillCircle(0, -182, 30);
  g.fillStyle(COLORS.hair);
  g.fillEllipse(0, -206, 62, 22, 16);
  g.fillEllipse(-28, -188, 12, 28, 10);
  g.fillEllipse(28, -188, 12, 28, 10);
  g.fillStyle(COLORS.face);
  g.fillCircle(-10, -182, 3.5);
  g.fillCircle(10, -182, 3.5);
  g.lineStyle(3, COLORS.face);
  g.beginPath();
  g.arc(0, -174, 9, 0.25, Math.PI - 0.25);
  g.strokePath();
  g.fillStyle(COLORS.cheeks, 0.5);
  g.fillCircle(-18, -172, 5);
  g.fillCircle(18, -172, 5);
}
