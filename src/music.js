// One music track for each part of the day: a file in the public/music folder, named in
// settings.txt. A part of the day without one is silent (all of them, for now).

export class Music {
  // tracks: { morning, afternoon, evening, night } file names, '' for silence
  // createAudio: makes a player for a file (the browser's own, or a stand-in in tests)
  constructor(tracks, createAudio = (url) => new Audio(url)) {
    this.tracks = tracks;
    this.createAudio = createAudio;
    this.phase = null;
    this.playing = null;
  }

  // Plays the part of the day's track (if it isn't already playing), or stops for silence.
  play(phase) {
    if (phase === this.phase) return;
    this.phase = phase;
    this.playing?.pause();
    this.playing = null;
    const file = this.tracks[phase];
    if (!file) return;
    const audio = this.createAudio(`music/${file}`);
    audio.loop = true;
    this.playing = audio;
    // Browsers only play sound after the first tap: if it's too early, try again then
    audio.play().catch(() => {
      window.addEventListener('pointerdown', () => this.playing === audio && audio.play().catch(() => {}), { once: true });
    });
  }
}
