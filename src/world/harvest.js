// Meredith's phone (the Mayor's bright orange smartphone, in design.md) harvests life energy
// from vampires, but only from close by.

// How close Meredith's feet have to be to someone's, in world units
export const HARVEST_REACH = 320;

// What tapping someone with the phone out does. Anyone further away: 'walk' up to them (vampire
// or not, so the phone gives nothing away from afar). Close by: 'harvest' a vampire, 'drained'
// for a vampire already harvested today, and a 'mistake' for anyone who isn't a vampire.
// character: { isVampire, drained, x, y } with x, y under their feet; player: Meredith's feet
export function phoneTapOn(character, player) {
  const distance = Math.hypot(character.x - player.x, character.y - player.y);
  if (distance > HARVEST_REACH) return 'walk';
  if (!character.isVampire) return 'mistake';
  return character.drained ? 'drained' : 'harvest';
}

// Whether a tap lands on someone standing with their feet at `feet`: anywhere on their body.
export function isOnCharacter(feet, point) {
  return Math.abs(point.x - feet.x) <= 70 && point.y >= feet.y - 230 && point.y <= feet.y + 20;
}
