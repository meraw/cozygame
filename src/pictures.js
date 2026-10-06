// Things that stand up in a scene (houses, trees, furniture...) are drawn once into a texture,
// so the game doesn't redraw every shape on every frame, then placed as pictures.

// (anchorX, anchorY) is the point of the picture that sits on the ground.
export function makePicture(scene, key, width, height, anchorX, anchorY, draw) {
  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({}, false);
    g.translateCanvas(anchorX, anchorY);
    draw(g);
    g.generateTexture(key, width, height);
    g.destroy();
  }
  return { key, originX: anchorX / width, originY: anchorY / height };
}

// Layered by how far down the screen it stands, so things lower down are drawn in front.
export function place(scene, picture, x, y, scale = 1) {
  return scene.add.image(x, y, picture.key).setOrigin(picture.originX, picture.originY).setScale(scale).setDepth(y);
}
