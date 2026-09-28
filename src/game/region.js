// Double the 172 x 86 valley westwards, preserving every existing coordinate.
export const WORLD = {
  minX: -215,
  maxX: 129,
  minZ: -43,
  maxZ: 43
};
export const OVERLOOK = {
  x: -194,
  z: 0,
  y: 72.15,
  minX: -201,
  maxX: -188,
  minZ: -6,
  maxZ: 6
};
export const onOverlook = (x, z, margin = 0) => x >= OVERLOOK.minX - margin && x <= OVERLOOK.maxX + margin && z >= OVERLOOK.minZ - margin && z <= OVERLOOK.maxZ + margin;
export const overlookRailing = (x, z) => onOverlook(x, z, .12) && (x < -200.72 || Math.abs(z) > 5.72);
export function westTerrain(x, z, land) {
  if (x >= -43) return land;
  const t = Math.max(0, Math.min(1, (-x - 75) / 115)),
    rise = t * t * (3 - 2 * t);
  const valley = land + Math.min(1, (-x - 43) / 20) * (2 + Math.sin(x * .055) * Math.cos(z * .06) * 2);
  return valley + (72 - valley) * rise;
}
export const LAKE = {
  x: 83,
  z: 8,
  rx: 25,
  rz: 24,
  level: .8
};
export const DOCK = {
  minX: 53,
  maxX: 66,
  minZ: 8.5,
  maxZ: 11.5,
  y: 1.25,
  berth: {
    x: 64.5,
    z: 13.4
  },
  exit: {
    x: 64.5,
    z: 10.5
  }
};
export const FALL = {
  x: 96,
  z: -11.8,
  top: 24,
  bottom: LAKE.level
};
export const MOUNTAINS = [[98, -27, 14, 25, 12], [88, -28, 10, 17, 9], [109, -26, 10, 19, 11], [96, -18, 7, 22, 6]];
export function inWorld(x, z, margin = 0) {
  return Number.isFinite(x) && Number.isFinite(z) && x >= WORLD.minX + margin && x <= WORLD.maxX - margin && z >= WORLD.minZ + margin && z <= WORLD.maxZ - margin;
}
export const lakeRadius = (x, z) => Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz);
export const inLake = (x, z) => lakeRadius(x, z) < 1;
export const onDock = (x, z, margin = 0) => x >= DOCK.minX - margin && x <= DOCK.maxX + margin && z >= DOCK.minZ - margin && z <= DOCK.maxZ + margin;
export const mountainBlocked = (x, z) => MOUNTAINS.some(([mx, mz, rx,, rz]) => Math.hypot((x - mx) / rx, (z - mz) / rz) < 1);
export function lakeTerrain(x, z, land) {
  if (x >= 49 && x <= 58 && Math.abs(z - 10) < 3) {
    const blend = Math.min(1, (x - 49) / 3, (3 - Math.abs(z - 10)) / 1.5);
    land += (DOCK.y - .16 - land) * Math.max(0, blend);
  }
  const r = lakeRadius(x, z);
  if (r >= 1.16) return land;
  const t = Math.max(0, Math.min(1, r < 1 ? (r - .85) / .15 : (r - 1) / .16)),
    smooth = t * t * (3 - 2 * t);
  return r < 1 ? LAKE.level - 2.4 + 2.44 * smooth : LAKE.level + .04 + (land - LAKE.level - .04) * smooth;
}
export function canSail(x, z, heading = 0) {
  if (!inWorld(x, z, 2)) return false;
  // Check the hull, not just its center, against shore and pier.
  for (const a of [-.62, 0, .62]) for (const b of [-1.45, 0, 1.45]) {
    const px = x + a * Math.cos(heading) + b * Math.sin(heading),
      pz = z - a * Math.sin(heading) + b * Math.cos(heading);
    if (lakeRadius(px, pz) > .96 || onDock(px, pz, .12) || mountainBlocked(px, pz)) return false;
  }
  return true;
}
export function readBoat(raw) {
  if (!raw || !Number.isFinite(raw.heading) || !canSail(raw.x, raw.z, raw.heading)) return null;
  const docked = raw.docked === true && Math.hypot(raw.x - DOCK.berth.x, raw.z - DOCK.berth.z) < .2;
  return {
    x: raw.x,
    z: raw.z,
    heading: raw.heading,
    occupied: raw.occupied === true,
    docked
  };
}
export function moveBoat(boat, dx, dz, angle, dt, blocked = () => false) {
  if (!boat?.occupied || dt <= 0 || !dx && !dz) return false;
  const length = Math.hypot(dx, dz),
    vx = (dx * Math.cos(angle) + dz * Math.sin(angle)) / length,
    vz = (-dx * Math.sin(angle) + dz * Math.cos(angle)) / length;
  const heading = Math.atan2(vx, vz),
    distance = 6 * Math.min(dt, .1),
    steps = Math.ceil(distance / .08);
  let moved = false;
  for (let i = 0; i < steps; i++) {
    const x = boat.x + vx * distance / steps,
      z = boat.z + vz * distance / steps;
    if (!canSail(x, z, heading) || blocked(x, z)) break;
    boat.x = x;
    boat.z = z;
    boat.heading = heading;
    boat.docked = false;
    moved = true;
  }
  return moved;
}
