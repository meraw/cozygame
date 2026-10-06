// Nora Nuremberg, Meredith's roommate, as design.md describes her: a vampire, with dark hair
// and very pale skin with a cold, bluish undertone (that's how you spot a vampire). Little fangs
// and a tall collar too. TODO(owner): replace with the real character art

const COLORS = {
  skin: 0xdfe7f0,
  skinShade: 0xbfcbdb,
  hair: 0x221c2a,
  hairShine: 0x3d3350,
  jumper: 0x5b2a40,
  collar: 0x34182a,
  skirt: 0x2b2633,
  tights: 0x2b2633,
  shoes: 0x141118,
  eyes: 0x9a1f30,
  tired: 0x8f86b0,
  mouth: 0x5a2030,
  fang: 0xffffff,
  shadow: 0x2a2420,
};

const WIDTH = 130;
const HEIGHT = 210;
const FEET_Y = 200;

// Draws Nora standing at `spot` (the point under her feet), breathing gently.
// flinch() makes her shiver, as the phone pulls life energy out of her.
export function createNora(scene, spot) {
  if (!scene.textures.exists('nora')) {
    const g = scene.make.graphics({}, false);
    g.translateCanvas(WIDTH / 2, FEET_Y);
    drawNora(g);
    g.generateTexture('nora', WIDTH, HEIGHT);
    g.destroy();
  }
  scene.add.ellipse(spot.x - 10, spot.y, 84, 26, COLORS.shadow, 0.2).setDepth(spot.y - 1);
  const figure = scene.add.image(spot.x, spot.y, 'nora').setOrigin(0.5, FEET_Y / HEIGHT).setDepth(spot.y);
  scene.tweens.add({ targets: figure, scaleY: 1.015, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return {
    figure,
    flinch() {
      scene.tweens.add({
        targets: figure,
        x: spot.x + 7,
        duration: 45,
        yoyo: true,
        repeat: 5,
        onComplete: () => figure.setX(spot.x),
      });
    },
  };
}

function drawNora(g) {
  // Long dark hair, falling behind her shoulders
  g.fillStyle(COLORS.hair);
  g.fillRoundedRect(-40, -160, 80, 102, 26);

  // Dark tights and shoes, a dark skirt, and a long plum jumper
  g.fillStyle(COLORS.tights);
  g.fillRoundedRect(-20, -50, 16, 48, 6);
  g.fillRoundedRect(4, -50, 16, 48, 6);
  g.fillStyle(COLORS.shoes);
  g.fillEllipse(-12, -4, 26, 12, 12);
  g.fillEllipse(12, -4, 26, 12, 12);
  g.fillStyle(COLORS.skirt);
  g.fillPoints(
    [
      { x: -30, y: -66 },
      { x: 30, y: -66 },
      { x: 38, y: -40 },
      { x: -38, y: -40 },
    ],
    true,
  );
  g.fillStyle(COLORS.jumper);
  g.fillRoundedRect(-45, -100, 16, 50, 8);
  g.fillRoundedRect(29, -100, 16, 50, 8);
  g.fillRoundedRect(-34, -104, 68, 50, 18);
  g.fillStyle(COLORS.skin);
  g.fillCircle(-37, -48, 8);
  g.fillCircle(37, -48, 8);

  // A tall pointed collar, the vampire kind
  g.fillStyle(COLORS.collar);
  g.fillTriangle(-44, -138, -38, -100, -12, -100);
  g.fillTriangle(44, -138, 38, -100, 12, -100);

  // Very pale face, shading to cold blue under the chin
  g.fillStyle(COLORS.skin);
  g.fillCircle(0, -130, 30);
  g.fillStyle(COLORS.skinShade, 0.7);
  g.fillEllipse(0, -106, 36, 10, 12);

  // A straight fringe
  g.fillStyle(COLORS.hair);
  g.fillEllipse(0, -152, 68, 32, 16);
  g.fillRect(-31, -156, 62, 13);
  g.fillStyle(COLORS.hairShine);
  g.fillEllipse(-12, -161, 24, 6, 8);

  // Red eyes with tired shadows under them, and a smile showing two little fangs
  g.fillStyle(COLORS.tired, 0.35);
  g.fillEllipse(-11, -124, 14, 5, 8);
  g.fillEllipse(11, -124, 14, 5, 8);
  g.fillStyle(COLORS.eyes);
  g.fillCircle(-11, -131, 4);
  g.fillCircle(11, -131, 4);
  g.lineStyle(3, COLORS.mouth);
  g.beginPath();
  g.arc(0, -121, 8, 0.3, Math.PI - 0.3);
  g.strokePath();
  g.fillStyle(COLORS.fang);
  g.fillTriangle(-6, -114, -2, -114, -4, -107);
  g.fillTriangle(2, -114, 6, -114, 4, -107);
}
