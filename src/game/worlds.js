export const WORLDS_KEY = 'meu-mundo-worlds-v1';
export const LEGACY_KEY = 'meu-mundo-vale-v2';
export let activeWorld = null;

export function createWorld(name, storage = localStorage) {
  const worlds = loadWorlds(storage);
  const world = { id: crypto.randomUUID(), name: name.trim(), updated: Date.now(), data: null };
  if (!world.name) throw new Error('Nome do mundo vazio');
  worlds.push(world);
  storage.setItem(WORLDS_KEY, JSON.stringify(worlds));
  return world;
}

export function renameWorld(worldId, name, storage = localStorage) {
  const worlds = loadWorlds(storage);
  const world = worlds.find(w => w.id === worldId);
  if (!world || !name.trim()) throw new Error('Mundo ou nome inválido');
  world.name = name.trim();
  storage.setItem(WORLDS_KEY, JSON.stringify(worlds));
  if (activeWorld?.id === worldId) activeWorld = { ...activeWorld, name: world.name };
  return world;
}
export function loadWorlds(storage = localStorage) {
  const raw = storage.getItem(WORLDS_KEY);
  if (raw) {
    const worlds = JSON.parse(raw);
    if (!Array.isArray(worlds) || worlds.some(w => !w || typeof w.id !== 'string' || typeof w.name !== 'string' || !Number.isFinite(w.updated)) || new Set(worlds.map(w => w.id)).size !== worlds.length) throw new Error('Lista de mundos inválida');
    return worlds;
  }
  const legacy = storage.getItem(LEGACY_KEY);
  if (!legacy) return [];
  const data = JSON.parse(legacy);
  const worlds = [{
    id: 'legacy',
    name: 'Meu primeiro vale',
    updated: Date.now(),
    data
  }];
  storage.setItem(WORLDS_KEY, JSON.stringify(worlds));
  return worlds;
}
export function saveWorld(data, storage = localStorage) {
  if (!activeWorld) return;
  const worlds = loadWorlds(storage);
  const next = {
    ...activeWorld,
    data,
    updated: Date.now()
  };
  const index = worlds.findIndex(w => w.id === next.id);
  if (index < 0) worlds.push(next);else worlds[index] = next;
  storage.setItem(WORLDS_KEY, JSON.stringify(worlds));
  activeWorld = next;
}
export function deleteWorld(worldId, storage = localStorage) {
  const worlds = loadWorlds(storage).filter(w => w.id !== worldId);
  storage.setItem(WORLDS_KEY, JSON.stringify(worlds));
  if (activeWorld?.id === worldId) activeWorld = null;
  return worlds;
}
export function chooseWorld(world) {
  activeWorld = world;
}
