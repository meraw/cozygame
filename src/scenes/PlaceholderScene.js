import Phaser from 'phaser';

// Placeholder colors, loosely following the [PROPOSED] village palette in design.md.
const COLORS = {
  skyTop: 0xf6e7c8,
  skyHorizon: 0xf0c08f,
  sun: 0xfff4dc,
  farHills: [0xbcc5cc, 0x9eaab4, 0x83919c],
  mist: 0xf8efe0,
  nearHill: 0x7d7f3f,
  wall: 0xcfc4b4,
  roof: 0xc0623b,
  door: 0x8c4a2f,
  window: 0xf2b84b,
  ripple: 0xd9772b,
  text: '#4a3426',
  buildLabel: '#f8efe0',
};

const FONT = 'ui-rounded, "Segoe UI", system-ui, sans-serif';

export class PlaceholderScene extends Phaser.Scene {
  constructor() {
    super('Placeholder');
  }

  create() {
    const { width, height } = this.scale;
    const g = this.add.graphics();

    drawSky(g, width, height, height * 0.55);
    drawSun(g, width * 0.7, height * 0.47);
    COLORS.farHills.forEach((color, i) => {
      const surface = hillSurface(height * (0.52 + i * 0.07), 60 + i * 20, 380 + i * 90, i * 1.7);
      drawHill(g, color, width, height, surface);
      drawMist(g, width, height * (0.56 + i * 0.07));
    });
    const nearHill = hillSurface(height * 0.8, 50, 700, 4);
    drawHill(g, COLORS.nearHill, width, height, nearHill);
    const houseX = width * 0.3;
    drawHouse(g, houseX, nearHill(houseX) + 25);

    // TODO(owner): replace with the real title screen
    this.add
      .text(width / 2, height * 0.2, 'Placeholder screen', {
        fontFamily: FONT,
        fontSize: '120px',
        fontStyle: 'bold',
        color: COLORS.text,
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.2 + 120, 'Tap anywhere to test touch', {
        fontFamily: FONT,
        fontSize: '56px',
        color: COLORS.text,
      })
      .setOrigin(0.5);

    // Shows which version is live, so we can tell whether the tablet is showing an old copy.
    this.add
      .text(width - 40, height - 30, `build ${__BUILD_ID__}`, {
        fontFamily: FONT,
        fontSize: '32px',
        color: COLORS.buildLabel,
      })
      .setOrigin(1, 1)
      .setAlpha(0.8);

    this.input.on('pointerdown', (pointer) => this.ripple(pointer.x, pointer.y));
  }

  ripple(x, y) {
    const ring = this.add.circle(x, y, 40).setStrokeStyle(10, COLORS.ripple, 0.9);
    this.tweens.add({
      targets: ring,
      scale: 3,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }
}

function drawSky(g, width, height, horizonY) {
  const top = Phaser.Display.Color.ValueToColor(COLORS.skyTop);
  const horizon = Phaser.Display.Color.ValueToColor(COLORS.skyHorizon);
  const bands = 64;
  const bandHeight = horizonY / bands;
  for (let i = 0; i < bands; i++) {
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, horizon, bands - 1, i);
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
    g.fillRect(0, i * bandHeight, width, bandHeight + 1);
  }
  g.fillStyle(COLORS.skyHorizon);
  g.fillRect(0, horizonY, width, height - horizonY);
}

function drawSun(g, x, y) {
  for (let i = 4; i > 0; i--) {
    g.fillStyle(COLORS.sun, 0.12);
    g.fillCircle(x, y, 90 + i * 45);
  }
  g.fillStyle(COLORS.sun);
  g.fillCircle(x, y, 90);
}

// Returns the height of a gently rolling hill line at any x.
function hillSurface(baseY, amplitude, wavelength, phase) {
  return (x) =>
    baseY - amplitude * (Math.sin(x / wavelength + phase) + 0.5 * Math.sin(x / (wavelength * 0.4) + phase * 2.3));
}

function drawHill(g, color, width, height, surface) {
  const points = [{ x: 0, y: height }];
  for (let x = 0; x <= width; x += 20) {
    points.push({ x, y: surface(x) });
  }
  points.push({ x: width, y: height });
  g.fillStyle(color);
  g.fillPoints(points, true);
}

function drawMist(g, width, y) {
  g.fillStyle(COLORS.mist, 0.18);
  for (let i = 0; i < 4; i++) {
    g.fillEllipse(width * (0.15 + i * 0.25), y, width * 0.5, 70);
  }
}

function drawHouse(g, x, groundY) {
  const w = 280;
  const h = 200;
  g.fillStyle(COLORS.wall);
  g.fillRect(x - w / 2, groundY - h, w, h);
  g.fillStyle(COLORS.roof);
  g.fillTriangle(x - w / 2 - 40, groundY - h, x + w / 2 + 40, groundY - h, x, groundY - h - 150);
  g.fillStyle(COLORS.door);
  g.fillRect(x - 35, groundY - 110, 70, 110);
  g.fillStyle(COLORS.window);
  g.fillRect(x - 115, groundY - 150, 60, 60);
  g.fillRect(x + 55, groundY - 150, 60, 60);
}
