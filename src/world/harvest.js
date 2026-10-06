// Meredith's phone (the Mayor's bright orange smartphone, in design.md) harvests life energy
// from vampires, but only from close by.

// How close Meredith's feet have to be to a vampire's, in world units
export const HARVEST_REACH = 320;
export const LIFE_ENERGY_PER_HARVEST = 10;

// What tapping someone with the phone out does: 'harvest' a vampire close enough, 'walk' up to a
// vampire further away, and 'nothing' at all to someone who isn't a vampire.
// character: { isVampire, x, y } with x, y under their feet; player: Meredith's feet
export function phoneTapOn(character, player) {
  if (!character.isVampire) return 'nothing';
  const distance = Math.hypot(character.x - player.x, character.y - player.y);
  return distance <= HARVEST_REACH ? 'harvest' : 'walk';
}

// Whether a tap lands on someone standing with their feet at `feet`: anywhere on their body.
export function isOnCharacter(feet, point) {
  return Math.abs(point.x - feet.x) <= 70 && point.y >= feet.y - 230 && point.y <= feet.y + 20;
}
