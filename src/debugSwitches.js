// Buttons for trying things out without playing up to them, shown only when the link ends with
// ?debug: one switches each drained thing between decayed and restored, and one skips the day
// on to its next part. Changes are saved as they would be in play.
export function showDebugSwitches(save, names, clock) {
  const panel = document.createElement('div');
  // Bottom left, clear of the life energy counter and the phone button
  Object.assign(panel.style, {
    position: 'fixed',
    left: '8px',
    bottom: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: '10',
  });
  const addButton = (onClick) => {
    const button = document.createElement('button');
    Object.assign(button.style, {
      font: '15px/1.2 monospace',
      padding: '10px 14px',
      color: '#fff',
      background: 'rgba(0, 0, 0, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      borderRadius: '6px',
      textAlign: 'left',
    });
    button.addEventListener('click', onClick);
    panel.appendChild(button);
    return button;
  };

  for (const name of names) {
    const button = addButton(() => save.setRestored(name, !save.isRestored(name)));
    const showState = () => {
      button.textContent = `${name}: ${save.isRestored(name) ? 'restored' : 'decayed'}`;
    };
    save.onChange(showState);
    showState();
  }

  const day = addButton(() => {
    clock.skip();
    save.setDayTime(clock.phase, clock.elapsed);
    showDay();
  });
  const showDay = () => {
    day.textContent = `day: ${clock.phase} (skip)`;
  };
  showDay();
  // The day also moves on by itself
  setInterval(showDay, 500);

  document.body.appendChild(panel);
}
