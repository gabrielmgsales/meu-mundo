import { inWorld, readBoat } from './region.js';
export const qualityPresets = {
  low: {
    label: 'Leve',
    pixelRatio: 1,
    shadowSize: 512,
    shadows: false,
    grass: .3
  },
  medium: {
    label: 'Equilibrado',
    pixelRatio: 1.25,
    shadowSize: 1024,
    shadows: true,
    grass: .65
  },
  high: {
    label: 'Alto',
    pixelRatio: 1.7,
    shadowSize: 2048,
    shadows: true,
    grass: 1
  }
};
export const resourceDefaults = {
  wood: 24,
  stone: 18,
  grain: 0,
  food: 12,
  water: 8,
  crystal: 0,
  herbs: 0
};
export function readProgress(saved, catalog) {
  const state = {
    inventory: {
      ...resourceDefaults
    },
    buildings: [],
    collected: 0,
    harvested: 0,
    time: 16,
    day: 1,
    discovered: [],
    cropTimers: {},
    position: {
      x: -3,
      z: 3
    },
    settings: {
      quality: 'medium',
      sound: true,
      volume: .3
    }
  };
  if (!saved || ![2, 3].includes(saved.version)) return state;
  for (const key of Object.keys(resourceDefaults)) if (Number.isFinite(saved.inventory?.[key]) && saved.inventory[key] >= 0) state.inventory[key] = Math.min(999999, Math.floor(saved.inventory[key]));
  state.buildings = (Array.isArray(saved.buildings) ? saved.buildings : []).filter(b => b && Object.hasOwn(catalog, b.type) && Number.isFinite(b.x) && Number.isFinite(b.z) && inWorld(b.x, b.z, 3)).slice(0, 150);
  for (const key of ['collected', 'harvested']) if (Number.isFinite(saved[key])) state[key] = Math.max(0, Math.floor(saved[key]));
  if (Number.isFinite(saved.time) && saved.time >= 0 && saved.time < 24) state.time = saved.time;
  if (Number.isFinite(saved.day)) state.day = Math.max(1, Math.floor(saved.day));
  state.discovered = (Array.isArray(saved.discovered) ? saved.discovered : []).filter(id => ['spring', 'quarry', 'orchard'].includes(id));
  if (saved.cropTimers && typeof saved.cropTimers === 'object') for (const [key, value] of Object.entries(saved.cropTimers)) if (Number.isFinite(value)) state.cropTimers[key] = Math.min(Date.now() + 45000, value);
  if (Number.isFinite(saved.position?.x) && Number.isFinite(saved.position?.z) && inWorld(saved.position.x, saved.position.z)) state.position = saved.position;
  if (qualityPresets[saved.settings?.quality]) state.settings.quality = saved.settings.quality;
  if (typeof saved.settings?.sound === 'boolean') state.settings.sound = saved.settings.sound;
  if (Number.isFinite(saved.settings?.volume)) state.settings.volume = Math.max(0, Math.min(1, saved.settings.volume));
  state.boat = readBoat(saved.boat);
  return state;
}
export function isUnlocked(type, state) {
  // Existing buildings survive progression changes when loading the previous version.
  if (state.buildings.some(b => b.type === type)) return true;
  if (type === 'well') return state.discovered.includes('spring');
  if (type === 'barn') return state.discovered.includes('quarry') && state.harvested > 0;
  return true;
}
export function canAfford(inventory, cost) {
  return ['wood', 'stone', 'crystal', 'herbs', 'water'].every(key => (inventory[key] || 0) >= (cost[key] || 0));
}
export function prepareTea(inventory) {
  if (inventory.herbs < 2 || inventory.water < 1) return false;
  inventory.herbs -= 2;
  inventory.water -= 1;
  inventory.food += 3;
  return true;
}
export function placementReason({
  x,
  z,
  radius,
  player,
  obstacles,
  riverCenter,
  height
}) {
  if (!inWorld(x, z, 3)) return 'Você chegou ao limite da área de construção.';
  if (Math.abs(x - riverCenter(z)) <= radius + 2.8) return 'Mantenha as margens do rio livres.';
  const distance = Math.hypot(x - player.x, z - player.z);
  if (distance >= 13) return 'Aproxime-se: construa a até 13 metros.';
  if (distance < radius + .5) return 'Afaste-se um pouco do local da construção.';
  if (obstacles.some(o => Math.hypot(x - o.x, z - o.z) < radius + o.radius)) return 'Este espaço está ocupado. Procure um terreno livre.';
  const heights = [height(x - radius, z), height(x + radius, z), height(x, z - radius), height(x, z + radius)];
  if (Math.max(...heights) - Math.min(...heights) > .85) return 'O terreno é muito inclinado para construir aqui.';
  return '';
}
