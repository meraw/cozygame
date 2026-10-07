// The game clock: the day goes round morning, afternoon, evening and night, each lasting as long
// as settings.txt says. At the start of each part of the day the light changes gradually.

export const PHASES = ['morning', 'afternoon', 'evening', 'night'];
// Seconds the light takes to change when skipping ahead with the ?debug button
export const SKIP_FADE = 1.5;

// How each part of the day looks, as numbers the village blends between:
//   tint, tintAlpha: a colour laid over everything, and how strongly
//   haze: the golden glow of the low sun
//   mist, shadows (long ones), lights (windows and lampposts): how much of each
//   darkness: how dark the night shade is, with pools of light around the lights
// Everything but the tint colour goes from 0 to 1.
export const LOOKS = {
  // Soft mist and cool light
  morning: { tint: 0xc4daf2, tintAlpha: 0.3, haze: 0, mist: 1, shadows: 0.2, lights: 0, darkness: 0 },
  // Warm, with long shadows
  afternoon: { tint: 0xffd98c, tintAlpha: 0.12, haze: 0.6, mist: 0, shadows: 1, lights: 0, darkness: 0 },
  // Orange light; the lampposts and windows come on
  evening: { tint: 0xff8a3c, tintAlpha: 0.16, haze: 1, mist: 0, shadows: 0.35, lights: 1, darkness: 0.12 },
  // A dark blue tint, the lights glowing
  night: { tint: 0x1b2a5c, tintAlpha: 0, haze: 0, mist: 0.25, shadows: 0, lights: 1, darkness: 0.62 },
};

export class DayClock {
  // lengths: { morning, afternoon, evening, night, fade } in seconds, from settings.txt
  // saved: { phase, elapsed } to carry on from, or nothing for the start of the morning
  constructor(lengths, saved = {}) {
    this.lengths = lengths;
    const known = PHASES.includes(saved.phase) && Number.isFinite(saved.elapsed) && saved.elapsed >= 0;
    this.phaseIndex = known ? PHASES.indexOf(saved.phase) : 0;
    this.elapsed = known ? saved.elapsed : 0;
    // The light changes from this look to the current part of the day's, over `fade` seconds
    this.from = LOOKS[this.phase];
    this.fade = 0;
  }

  get phase() {
    return PHASES[this.phaseIndex];
  }

  // Time passes (in seconds), moving on to the next part of the day when this one is over.
  advance(seconds) {
    this.elapsed += seconds;
    while (this.elapsed >= this.lengths[this.phase]) {
      const length = this.lengths[this.phase];
      this.from = this.lookAt(length);
      this.elapsed -= length;
      this.moveOn(this.lengths.fade);
    }
  }

  // Straight on to the next part of the day.
  skip() {
    this.from = this.look();
    this.elapsed = 0;
    this.moveOn(SKIP_FADE);
  }

  moveOn(fade) {
    this.phaseIndex = (this.phaseIndex + 1) % PHASES.length;
    this.fade = fade;
  }

  // How the light looks right now.
  look() {
    return this.lookAt(this.elapsed);
  }

  // How the light looks `elapsed` seconds into the current part of the day.
  lookAt(elapsed) {
    const mix = this.fade > 0 ? Math.min(1, elapsed / this.fade) : 1;
    return blendLooks(this.from, LOOKS[this.phase], mix);
  }
}

// Partway (mix from 0 to 1) from one look to another.
export function blendLooks(from, to, mix) {
  if (mix >= 1) return { ...to };
  if (mix <= 0) return { ...from };
  const look = {};
  for (const key of Object.keys(to)) {
    look[key] = key === 'tint' ? blendColors(from.tint, to.tint, mix) : from[key] + (to[key] - from[key]) * mix;
  }
  return look;
}

function blendColors(from, to, mix) {
  const channel = (shift) => {
    const a = (from >> shift) & 0xff;
    const b = (to >> shift) & 0xff;
    return Math.round(a + (b - a) * mix);
  };
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}
