// A small box of numbers about the screen and the game, for diagnosing display problems
// on other devices. Shown only when the link ends with ?debug
export function showDebugInfo(game) {
  const errors = [];
  window.addEventListener('error', (event) => errors.push(event.message));

  const box = document.createElement('pre');
  Object.assign(box.style, {
    position: 'fixed',
    left: '8px',
    top: '8px',
    margin: '0',
    padding: '8px 10px',
    maxWidth: '45vw',
    font: '13px/1.35 monospace',
    whiteSpace: 'pre-wrap',
    color: '#fff',
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '6px',
    pointerEvents: 'none',
    zIndex: '10',
  });
  document.body.appendChild(box);

  const size = (rect) => `${Math.round(rect.width)}x${Math.round(rect.height)}`;
  const update = () => {
    const visible = window.visualViewport;
    const canvas = game.canvas?.getBoundingClientRect();
    box.textContent = [
      `window ${window.innerWidth}x${window.innerHeight}  pixel ratio ${window.devicePixelRatio}`,
      `page ${document.documentElement.clientWidth}x${document.documentElement.clientHeight}`,
      visible
        ? `visible ${size(visible)}  zoom ${visible.scale.toFixed(2)}  offset ${Math.round(visible.offsetLeft)},${Math.round(visible.offsetTop)}`
        : 'visible (unknown)',
      `screen ${window.screen.width}x${window.screen.height} ${window.screen.orientation?.type ?? ''}`,
      `game box ${size(document.getElementById('game').getBoundingClientRect())}`,
      canvas ? `canvas ${size(canvas)} at ${Math.round(canvas.left)},${Math.round(canvas.top)}` : 'canvas (none)',
      `renderer ${game.renderer?.type === 2 ? 'WebGL' : 'Canvas'}  build ${__BUILD_ID__}`,
      navigator.userAgent,
      ...errors.slice(-3).map((message) => `error: ${message}`),
    ].join('\n');
  };
  update();
  setInterval(update, 500);
}
