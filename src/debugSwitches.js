// Buttons for trying out the drained things without playing up to them: each one switches
// a thing between decayed and restored, and the change is saved as it would be in play.
// Shown only when the link ends with ?debug
export function showDebugSwitches(save, names) {
  const panel = document.createElement('div');
  Object.assign(panel.style, {
    position: 'fixed',
    right: '8px',
    top: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: '10',
  });
  for (const name of names) {
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
    const showState = () => {
      button.textContent = `${name}: ${save.isRestored(name) ? 'restored' : 'decayed'}`;
    };
    button.addEventListener('click', () => save.setRestored(name, !save.isRestored(name)));
    save.onChange(showState);
    showState();
    panel.appendChild(button);
  }
  document.body.appendChild(panel);
}
