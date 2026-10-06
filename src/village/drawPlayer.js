// The placeholder player character, made of simple shapes. The colors borrow from the
// description of Meredith in design.md (orange hair, glasses, lavender jumper, jeans).
// TODO(owner): replace with the real character art

const COLORS = {
  hair: 0xe0782f,
  skin: 0xf1d2b6,
  jumper: 0xb9a3d6,
  jeans: 0x4f6d99,
  shoes: 0x5a3d2e,
  glasses: 0x3b2a20,
  blush: 0xe89a8a,
};

const WIDTH = 130;
const HEIGHT = 210;
const FEET_Y = 200;

// Returns the container to move around (its position is the point under the feet)
// and the figure inside it, which hops and turns while walking.
export function createPlayer(scene, x, y) {
  if (!scene.textures.exists('player')) {
    const g = scene.make.graphics({}, false);
    g.translateCanvas(WIDTH / 2, FEET_Y);
    drawFigure(g);
    g.generateTexture('player', WIDTH, HEIGHT);
    g.destroy();
  }
  const shadow = scene.add.ellipse(0, 0, 80, 26, 0x000000, 0.2);
  const figure = scene.add.image(0, 0, 'player').setOrigin(0.5, FEET_Y / HEIGHT);
  const container = scene.add.container(x, y, [shadow, figure]).setDepth(y);
  return { container, figure };
}

function drawFigure(g) {
  g.fillStyle(COLORS.jeans);
  g.fillRoundedRect(-22, -50, 19, 48, 6);
  g.fillRoundedRect(3, -50, 19, 48, 6);
  g.fillStyle(COLORS.shoes);
  g.fillEllipse(-13, -3, 28, 12, 12);
  g.fillEllipse(13, -3, 28, 12, 12);

  g.fillStyle(COLORS.jumper);
  g.fillRoundedRect(-46, -98, 16, 48, 8);
  g.fillRoundedRect(30, -98, 16, 48, 8);
  g.fillRoundedRect(-34, -102, 68, 62, 18);
  g.fillStyle(COLORS.skin);
  g.fillCircle(-38, -48, 8);
  g.fillCircle(38, -48, 8);

  // Big hair behind the face, with the fringe swept to one side so you can tell which way she faces
  g.fillStyle(COLORS.hair);
  g.fillCircle(0, -134, 44);
  g.fillCircle(-34, -112, 24);
  g.fillCircle(34, -112, 24);
  g.fillStyle(COLORS.skin);
  g.fillCircle(0, -126, 30);
  g.fillStyle(COLORS.hair);
  g.fillEllipse(10, -151, 62, 24, 16);

  g.lineStyle(4, COLORS.glasses);
  g.strokeCircle(-12, -126, 9);
  g.strokeCircle(12, -126, 9);
  g.lineBetween(-3, -127, 3, -127);
  g.fillStyle(COLORS.blush, 0.6);
  g.fillCircle(-21, -112, 6);
  g.fillCircle(21, -112, 6);
}
