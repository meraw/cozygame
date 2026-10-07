import { save } from '../save.js';

// The village's light through the day. apply(look) sets it from the game clock's look (see
// world/dayCycle.js): a tint over everything, the low sun's golden haze, morning mist, long
// afternoon shadows, windows and lampposts lit in the evening and at night, and the night's
// dark blue shade with pools of light around everything lit.

const TINT_DEPTH = 5e8 - 1;
// Over the tint and the haze, under the buttons and counters
const DARKNESS_DEPTH = 5e8 + 1;
// The night shade is drawn small and stretched over the village: it's all soft edges anyway
const DARKNESS_SCALE = 8;
const NIGHT = 0x0f1a40;
const POOL_SIZE = 128;

export class Daylight {
  // haze: the sunset light over the screen; mist and shadows: drawings over the village;
  // lights: lit windows and lampposts, each { image, glows: [{ x, y, radius }], restorable? }
  constructor(scene, village, { haze, mist, shadows, lights }) {
    this.haze = haze;
    this.mist = mist;
    this.shadows = shadows;
    this.lights = lights;
    const { width, height } = scene.scale;
    this.tint = scene.add.rectangle(0, 0, width, height, 0xffffff, 0).setOrigin(0).setScrollFactor(0).setDepth(TINT_DEPTH);

    makePoolTexture(scene);
    this.pool = scene.make.image({ key: 'light-pool' }, false);
    this.darkness = scene.add
      .renderTexture(0, 0, Math.ceil(village.width / DARKNESS_SCALE), Math.ceil(village.height / DARKNESS_SCALE))
      .setOrigin(0)
      .setScale(DARKNESS_SCALE)
      .setDepth(DARKNESS_DEPTH);
    this.drawDarkness();
    this.lightsOn = false;
  }

  apply(look) {
    this.tint.setFillStyle(look.tint, look.tintAlpha).setVisible(look.tintAlpha > 0);
    show(this.haze, look.haze);
    show(this.mist, look.mist);
    show(this.shadows, look.shadows);
    show(this.darkness, look.darkness);
    for (const light of this.lights) show(light.image, isOn(light) ? look.lights : 0);
    this.lightsOn = look.lights > 0.5;
  }

  // The night shade over the whole village, with a pool of light around each light that can come
  // on (a drained house's windows stay dark). Drawn again whenever something is restored.
  drawDarkness() {
    const { darkness, pool } = this;
    darkness.clear();
    darkness.fill(NIGHT, 1);
    for (const light of this.lights) {
      if (!isOn(light)) continue;
      for (const glow of light.glows) {
        pool.setPosition(glow.x / DARKNESS_SCALE, glow.y / DARKNESS_SCALE);
        pool.setScale((glow.radius * 2) / DARKNESS_SCALE / POOL_SIZE);
        darkness.erase(pool);
      }
    }
  }
}

// Something drained has no light until it's restored.
function isOn(light) {
  return !light.restorable || save.isRestored(light.restorable);
}

function show(thing, amount) {
  thing.setAlpha(amount).setVisible(amount > 0);
}

// A soft round brush, solid in the middle and fading to nothing at the edge: the pool of light
// cut out of the night shade.
function makePoolTexture(scene) {
  if (scene.textures.exists('light-pool')) return;
  const texture = scene.textures.createCanvas('light-pool', POOL_SIZE, POOL_SIZE);
  const ctx = texture.getContext();
  const middle = POOL_SIZE / 2;
  const gradient = ctx.createRadialGradient(middle, middle, 0, middle, middle, middle);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  gradient.addColorStop(0.45, 'rgba(255, 255, 255, 0.7)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, POOL_SIZE, POOL_SIZE);
  texture.refresh();
}
