const FONT = 'ui-rounded, "Segoe UI", system-ui, sans-serif';

// Shows which version is live, so we can tell whether the tablet is showing an old copy.
export function addBuildLabel(scene) {
  return scene.add
    .text(scene.scale.width - 40, scene.scale.height - 30, `build ${__BUILD_ID__}`, {
      fontFamily: FONT,
      fontSize: '32px',
      color: '#f8efe0',
    })
    .setOrigin(1, 1)
    .setAlpha(0.8)
    .setScrollFactor(0)
    .setDepth(1e9);
}
