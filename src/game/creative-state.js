import { inWorld } from './region.js';
import { allItems, biomes } from './catalogs.js';
const finite = n => Number.isFinite(n);
export const cellKey = (x, y, z) => `${x},${y},${z}`;
export function readCreative(raw) {
  const s = {
    items: [],
    base: {},
    lakes: [],
    mined: [],
    biome: 'vale',
    firstPerson: false
  };
  if (!raw || typeof raw !== 'object') return s;
  const known = new Set(allItems.map(i => `${i.kind}:${i.id}`));
  const position = p => p && finite(p.x) && finite(p.z) && inWorld(p.x, p.z);
  const ids = new Set();
  let regularItems = 0;
  s.items = (Array.isArray(raw.items) ? raw.items : []).filter(i => position(i) && known.has(`${i.kind}:${i.type}`) && typeof i.id === 'string' && !ids.has(i.id) && ids.add(i.id)).filter(i => i.kind === 'family' || regularItems++ < 500).map(i => ({
    ...i,
    rotation: finite(i.rotation) ? i.rotation : 0
  }));
  if (raw.base && typeof raw.base === 'object') for (const [key, p] of Object.entries(raw.base).slice(0, 1000)) if (position(p)) s.base[key] = {
    x: p.x,
    z: p.z,
    deleted: p.deleted === true
  };
  s.lakes = (Array.isArray(raw.lakes) ? raw.lakes : []).filter(p => position(p) && Number.isInteger(p.x) && Number.isInteger(p.z) && finite(p.level) && p.level >= -1 && p.level <= 80).slice(0, 29600);
  s.mined = [...new Set((Array.isArray(raw.mined) ? raw.mined : []).filter(k => typeof k === 'string' && /^\d+,\d+,\d+$/.test(k) && k.split(',').every((n, i) => Number(n) < [16, 8, 12][i])))];
  if (biomes.some(b => b.id === raw.biome)) s.biome = raw.biome;
  s.firstPerson = raw.firstPerson === true;
  return s;
}

// Flood merge touching brush cells so every connected lake has one water level.
export function addLakeBrush(existing, x, z, radius = 1.8, height = () => .5) {
  const cells = new Map(existing.map(p => [`${p.x},${p.z}`, {
    ...p
  }]));
  const seeds = [];
  for (let dx = -Math.ceil(radius); dx <= Math.ceil(radius); dx++) for (let dz = -Math.ceil(radius); dz <= Math.ceil(radius); dz++) {
    const cx = Math.round(x) + dx,
      cz = Math.round(z) + dz;
    if (Math.hypot(cx - x, cz - z) > radius || !inWorld(cx, cz, 3)) continue;
    const key = `${cx},${cz}`;
    if (!cells.has(key)) cells.set(key, {
      x: cx,
      z: cz,
      level: height(x, z) + .04
    });
    seeds.push(key);
  }
  const queue = [...seeds],
    seen = new Set();
  let level = Infinity;
  for (let i = 0; i < queue.length; i++) {
    const key = queue[i];
    if (seen.has(key) || !cells.has(key)) continue;
    seen.add(key);
    const p = cells.get(key);
    level = Math.min(level, p.level);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) queue.push(`${p.x + dx},${p.z + dz}`);
  }
  for (const key of seen) cells.get(key).level = level;
  return [...cells.values()];
}
