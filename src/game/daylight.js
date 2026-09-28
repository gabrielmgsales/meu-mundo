const smooth = t => {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
};

// Dawn 06–07, dusk 18–19. Shared by birds and the night soundscape.
export function daytimeStrength(hour) {
  hour = (hour % 24 + 24) % 24;
  return smooth(hour - 6) * (1 - smooth(hour - 18));
}
