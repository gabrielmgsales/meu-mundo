// Decisions are separate from movement: every destination still uses collision checks.
export function chooseRoutine({
  person,
  child,
  follow,
  hour,
  rain,
  distance,
  phase = 0
}) {
  if (person) {
    if (follow) return 'follow';
    if (rain > .35) return 'shelter';
    if (hour >= 21 || hour < 6) return 'home';
    if (hour >= 12 && hour < 14) return 'sit';
    return child ? 'play' : 'social';
  }
  if (rain > .45) return 'shelter';
  if (distance < 1.1) return 'avoid';
  if (hour >= 11 && hour < 15) return phase % 2 < 1 ? 'drink' : 'shade';
  return 'graze';
}
export function nearestDestination(origin, candidates, canEnter, radius = 24) {
  let best = null,
    distance = radius;
  for (const p of candidates) {
    const d = Math.hypot(p.x - origin.x, p.z - origin.z);
    if (d < distance && canEnter(p.x, p.z)) {
      distance = d;
      best = p;
    }
  }
  return best;
}
