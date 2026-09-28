import { rockGeometry, addShoreDetail } from './src/game/landscape-detail.js';
import { detailTerrain } from './src/game/terrain-surface.js';
import { createRoadMaterial } from './src/game/road-material.js';
import { grassGeometry } from './src/game/foliage.js';
import { createGameUI } from './src/game/game-ui.js';
import { createCollection } from './src/game/collection.js';
import { bindControls } from './src/game/controls.js';
import { createPlayerMovement } from './src/game/player-movement.js';
import { createWestRegion } from './src/game/west-region.js';
import * as THREE from 'three';
import { terrainHeight, riverCenter, textureMaterials, makeTree, addTrail, addLandmarks, batchStatic, places } from './src/game/world-detail.js';
import { createExperience } from './src/game/experience.js';
import { readProgress, canAfford, placementReason, isUnlocked } from './src/game/rules.js';
import { activeWorld, saveWorld } from './src/game/worlds.js';
import { createCreative } from './src/game/creative.js';
import { cartoonMaterial } from './src/game/toon-material.js';
import { catalog, createBuildingFactory } from './src/game/buildings.js';
import { WORLD, LAKE, DOCK, OVERLOOK, onOverlook, overlookRailing, inWorld, inLake, onDock, mountainBlocked } from './src/game/region.js';
import { createLakeRegion } from './src/game/lake-region.js';
import { createBoating } from './src/game/boating.js';
let experience,
  editor,
  boating,
  worldBatched = false;
const editable = [];
const $ = id => document.getElementById(id);
const lake = {
  center: {
    x: LAKE.x,
    z: LAKE.z
  },
  radius: LAKE.rx,
  height: LAKE.level
};
const scene = new THREE.Scene();
scene.background = new THREE.Color('#bdc9af');
scene.fog = new THREE.FogExp2('#bdc9af', .012);
const renderer = new THREE.WebGLRenderer({
  canvas: $('game'),
  antialias: true
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, .1, 6500);
const hemi = new THREE.HemisphereLight('#d8e2eb', '#605b52', 2.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffe0a3', 3.3);
sun.position.set(-25, 35, 18);
sun.castShadow = true;
Object.assign(sun.shadow.camera, {
  left: -48,
  right: 48,
  top: 48,
  bottom: -48,
  near: 1,
  far: 120
});
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.normalBias = .04;
scene.add(sun);
const mat = (color, opts = {}) => opts.transparent ? new THREE.MeshStandardMaterial({
  color,
  roughness: .35,
  ...opts
}) : cartoonMaterial(color, opts);
const M = {
  wood: mat('#71604c'),
  log: mat('#92806a'),
  plaster: mat('#c8c3b5'),
  roof: mat('#665650'),
  edge: mat('#484b49'),
  leaf: mat('#69a859'),
  leaf2: mat('#aac969'),
  pine: mat('#48866a'),
  stone: mat('#8a8b86'),
  dark: mat('#273834'),
  gold: mat('#d9b46b'),
  soil: mat('#68513b'),
  skin: mat('#d9ac7d'),
  coat: mat('#777669'),
  pants: mat('#414c59'),
  cream: mat('#e7dfc1'),
  glass: mat('#f7cc75', {
    emissive: '#ffb84d',
    emissiveIntensity: .65
  }),
  water: mat('#497477', {
    roughness: .23,
    metalness: .05,
    transparent: true,
    opacity: .84
  })
};
const earthTexture = textureMaterials(M);
function mesh(geo, m, p, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  p.add(o);
  return o;
}
const box = (p, m, x, y, z, w, h, d) => mesh(new THREE.BoxGeometry(w, h, d), m, p, x, y, z);
const sphere = (p, m, x, y, z, r, detail = 1) => mesh(new THREE.IcosahedronGeometry(r, detail), m, p, x, y, z);
const cyl = (p, m, x, y, z, a, b, h, n = 8) => mesh(new THREE.CylinderGeometry(a, b, h, n), m, p, x, y, z);
let seed = 417;
function rand() {
  seed = seed * 1664525 + 1013904223 >>> 0;
  return seed / 4294967296;
}
const height = (x, z) => onOverlook(x, z) ? OVERLOOK.y : editor ? editor.terrainHeight(x, z) : terrainHeight(x, z),
  riverX = riverCenter;
let groundSeed = 417;
const groundRand = () => (groundSeed = Math.imul(groundSeed, 1664525) + 1013904223 >>> 0) / 4294967296;
const tg = new THREE.PlaneGeometry(480, 190, 356, 140);
tg.rotateX(-Math.PI / 2);
tg.translate(-45, 0, 0);
const tp = tg.attributes.position,
  colors = [];
for (let i = 0; i < tp.count; i++) {
  tp.setY(i, terrainHeight(tp.getX(i), tp.getZ(i)));
  const c = new THREE.Color().setHSL(.225 + groundRand() * .012, .24 + groundRand() * .05, .34 + groundRand() * .035);
  colors.push(c.r, c.g, c.b);
}
tg.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
tg.computeVertexNormals();
const ground = mesh(tg, cartoonMaterial('#ffffff', {
  vertexColors: true,
  map: earthTexture,
  bumpMap: earthTexture,
  bumpScale: .045,
  roughness: 1
}), scene);
ground.castShadow = false;
detailTerrain(ground.material);
// Preserve the old random stream so saved tree/rock identifiers never change.
for (let i = 0; i < 141 * 141 * 3; i++) rand();
const wg = new THREE.PlaneGeometry(4.8, 180, 10, 100);
wg.rotateX(-Math.PI / 2);
const wp = wg.attributes.position;
for (let i = 0; i < wp.count; i++) {
  wp.setX(i, wp.getX(i) + riverX(wp.getZ(i)));
  wp.setY(i, .25);
}
wg.computeVertexNormals();
const water = mesh(wg, M.water, scene);
water.castShadow = false;
const linePoints = [];
for (let i = 0; i < 230; i++) {
  const z = rand() * 150 - 75,
    x = riverX(z) + (rand() - .5) * 4;
  linePoints.push(x, .3, z, x + .15 + rand() * .65, .3, z);
}
const lg = new THREE.BufferGeometry();
lg.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
const ripples = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({
  color: '#d0e2c0',
  transparent: true,
  opacity: .3
}));
ripples.visible = false;
scene.add(ripples);
const pathMat = createRoadMaterial();
addTrail(scene, [[-4, -34], [-4, -15], [-3, -4], [-3, 4], [-1, 14], [-5, 35]], 1.15, pathMat);
addTrail(scene, [[-3, 1], [1, 0], [5.5, 0]], .8, pathMat);
addTrail(scene, [[12.8, 0], [17, -4], [21, -11], [24, -15]], .6, pathMat);
addTrail(scene, [[-4, -12], [-10, -14], [-16, -18], [-20, -18]], .55, pathMat);
addTrail(scene, [[14, 1], [19, 9], [22, 16], [23, 20]], .6, pathMat);
for (let i = 0; i < 15; i++) {
  const x = -65 + i * 10,
    z = -57 - rand() * 15;
  const width = 12 + rand() * 10,
    tall = 20 + rand() * 22;
  const hill = mesh(rockGeometry(i), mat(i % 2 ? '#73786d' : '#85867a'), scene, x, 5, z);
  hill.scale.set(width, tall * .55, width * .75);
  hill.rotation.y = rand() * 3;
}
addShoreDetail(scene);
const resources = [];
function tree(x, z, scale = 1, pine = false) {
  const g = makeTree(scene, M, x, z, scale, pine, rand),
    resource = {
      type: 'wood',
      x,
      z,
      cooldown: 0
    };
  resources.push(resource);
  editable.push({
    id: `tree:${x}:${z}`,
    g,
    resource,
    label: pine ? 'Pinheiro' : 'Árvore',
    kind: 'tree',
    radius: .45
  });
}
for (let i = 0; i < 115; i++) {
  const x = rand() * 94 - 47,
    z = rand() * 90 - 45;
  if (places.some(p => Math.hypot(x - p.x, z - p.z) < 5) || Math.abs(x - riverX(z)) < 4.5 || Math.hypot(x + 3, z) < 11 || Math.abs(x + 3 - Math.sin(z * .11) * 2) < 2) continue;
  tree(x, z, .7 + rand() * .65, i % 3 === 0);
}
tree(-7, 4, .85);
tree(-9, 1, 1);
tree(1, 7, .8);
function rock(x, z) {
  const g = new THREE.Group();
  g.position.set(x, height(x, z), z);
  scene.add(g);
  for (let i = 0; i < 3; i++) {
    const r = sphere(g, M.stone, i * .35, .3, rand() * .4, .5 + rand() * .4);
    r.scale.set(1, .7, 1);
    r.rotation.set(rand(), rand(), rand());
  }
  const resource = {
    type: 'stone',
    x,
    z,
    cooldown: 0
  };
  resources.push(resource);
  editable.push({
    id: `rock:${x}:${z}`,
    g,
    resource,
    label: 'Pedra',
    kind: 'rock',
    radius: .6
  });
}
for (let i = 0; i < 35; i++) {
  const x = rand() * 80 - 40,
    z = rand() * 80 - 40;
  if (!places.some(p => Math.hypot(x - p.x, z - p.z) < 5) && Math.abs(x - riverX(z)) > 4 && Math.hypot(x + 3, z) > 8) rock(x, z);
}
rock(2, 3);
// Dense meadow rendered with instancing rather than individual draw calls.
const dummy = new THREE.Object3D(),
  grass = new THREE.InstancedMesh(grassGeometry(), mat('#819054'), 5200);
let count = 0;
for (let i = 0; i < 6500 && count < 5200; i++) {
  const x = rand() * 100 - 50,
    z = rand() * 100 - 50;
  if (Math.abs(x - riverX(z)) < 3 || Math.abs(x + 3 - Math.sin(z * .11) * 2) < 1.5 || Math.hypot(x + 3, z) < 5) continue;
  dummy.position.set(x, height(x, z) + .19, z);
  dummy.rotation.set(0, rand() * 6, .12);
  dummy.scale.setScalar(.6 + rand() * .9);
  dummy.updateMatrix();
  grass.setMatrixAt(count++, dummy.matrix);
}
grass.count = count;
grass.userData.originalCount = count;
scene.add(grass);
const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.1, 0), M.gold, 350);
for (let i = 0; i < 350; i++) {
  const x = rand() * 65 - 32,
    z = rand() * 65 - 32;
  dummy.position.set(x, height(x, z) + .38, z);
  dummy.scale.setScalar(Math.abs(x - riverX(z)) < 3 ? 0 : 1);
  dummy.updateMatrix();
  flowers.setMatrixAt(i, dummy.matrix);
}
flowers.visible = false;
scene.add(flowers);
const crops = [];
const buildModel = createBuildingFactory({
  scene,
  M,
  mat,
  mesh,
  box,
  sphere,
  cyl,
  height,
  crops
});
function building(type, x, z, id = `building:${type}:${x}:${z}`) {
  const g = buildModel(type, x, z);
  const entry = {
    id,
    g,
    label: catalog[type].label,
    kind: 'building',
    radius: type === 'field' ? 0 : type === 'fence' ? .6 : type === 'deck' ? 1.6 : type === 'waterfall' ? 1.5 : type === 'mountain' ? 3.8 : catalog[type].radius * .75,
    crop: crops.find(c => c.g === g)
  };
  editable.push(entry);
  if (worldBatched) batchStatic(g, crops.map(c => c.plants));
  editor?.registerBase(entry);
  return g;
}
building('cabin', -5, -5);
building('field', 0, -5);
building('fence', -8, -2);
building('fence', -10, -2);
const bridge = new THREE.Group();
bridge.position.set(riverX(0), .5, 0);
scene.add(bridge);
for (let i = 0; i < 19; i++) box(bridge, M.log, -3.6 + i * .4, 0, 0, .37, .18, 2.7);
for (let a of [-1, 1]) {
  for (let i = 0; i < 5; i++) box(bridge, M.wood, -3.6 + i * 1.8, .55, a * 1.3, .13, 1.3, .13);
  box(bridge, M.wood, 0, 1, a * 1.3, 7.6, .12, .12);
}
const landmarks = addLandmarks(scene, M, {
  box,
  sphere,
  cyl
}, resources);
const initialHome = editable.find(e => e.id === 'building:cabin:-5:-5').g;
initialHome.add(landmarks.userData.home);
landmarks.userData.home.position.set(0, 0, 0);
for (const entry of editable) batchStatic(entry.g, crops.map(c => c.plants));
batchStatic(scene, [ground, water, grass, flowers, ripples, ...editable.map(e => e.g), ...crops.map(c => c.plants)]);
worldBatched = true;
const lakeRegion = createLakeRegion(scene, M),
  lakePlane = lakeRegion.lake;
const westRegion = createWestRegion(scene, M);
for (const entry of [...lakeRegion.entries, ...westRegion.entries]) {
  editable.push(entry);
  resources.push(entry.resource);
}
const player = new THREE.Group();
scene.add(player);
const body = box(player, M.coat, 0, 1.02, 0, .43, .62, .27);
mesh(new THREE.SphereGeometry(1, 20, 16), M.skin, player, 0, 1.65, 0).scale.set(.145,.205,.15);
mesh(new THREE.SphereGeometry(1, 16, 12), M.dark, player, 0, 1.78, -.015).scale.set(.15,.09,.145);


const legs = [],
  arms = [];
for (let a of [-1, 1]) {
  const leg = new THREE.Group();
  leg.position.set(a * .16, .7, 0);
  player.add(leg);
  mesh(new THREE.CapsuleGeometry(.085,.43,4,10), M.pants, leg, 0,-.25,0);
  box(leg, M.wood, 0, -.52, .06, .23, .16, .36);
  legs.push(leg);
  const arm = new THREE.Group();
  arm.position.set(a * .275, 1.28, 0);
  player.add(arm);
  mesh(new THREE.CapsuleGeometry(.065,.38,4,10), M.coat, arm, 0,-.23,0);
  sphere(arm, M.skin, 0, -.49, 0, .075);
  arms.push(arm);
}
player.position.set(-3, 0, 3);
const sheep = [];
for (let i = 0; i < 6; i++) {
  const g = new THREE.Group();
  scene.add(g);
  sphere(g, M.cream, 0, .7, 0, .6).scale.set(1.35, .85, .8);
  sphere(g, M.dark, 0, .85, .6, .24);
  for (let a of [-1, 1]) for (let b of [-1, 1]) box(g, M.dark, a * .34, .25, b * .28, .12, .5, .12);
  sheep.push({
    g,
    x: -13 + i * 2,
    z: 10 + i % 3 * 2,
    phase: i * 1.7
  });
}
const saved = activeWorld?.data;
const state = readProgress(saved, catalog);
for (const b of state.buildings) building(b.type, b.x, b.z, b.id);
for (const c of crops) c.readyAt = Math.max(0, ((state.cropTimers[c.key] || 0) - Date.now()) / 1000);
player.position.set(state.position.x, height(state.position.x, state.position.z), state.position.z);
function save() {
  state.position = {
    x: player.position.x,
    z: player.position.z
  };
  state.cropTimers = Object.fromEntries(crops.map(c => [c.key, Date.now() + Math.max(0, c.readyAt - elapsed) * 1000]));
  try {
    saveWorld({
      ...state,
      creative: editor?.data || saved?.creative,
      version: 3
    });
    $('save-status').textContent = 'Salvo agora · ' + (activeWorld?.name || 'Meu mundo');
    return true;
  } catch {
    $('save-status').textContent = 'Não foi possível salvar: verifique o armazenamento';
    return false;
  }
}
const {
  toast,
  updateUI,
  updateClock
} = createGameUI(state, () => experience?.refresh());
let selected = null,
  paused = false,
  elapsed = 0;
const view = {
  angle: .18,
  zoom: 22
};
const keys = {},
  ray = new THREE.Raycaster(),
  pointer = new THREE.Vector2(),
  point = new THREE.Vector3();
let hasPoint = false;
const preview = mesh(new THREE.RingGeometry(1.5, 1.57, 64), new THREE.MeshBasicMaterial({
  color: '#e6d59b',
  transparent: true,
  opacity: .85,
  side: THREE.DoubleSide,
  depthWrite: false
}), scene);
preview.rotation.x = -Math.PI / 2;
preview.visible = false;
preview.castShadow = false;
$('build-menu').innerHTML = Object.entries(catalog).filter(([k]) => !['waterfall', 'mountain', 'deck'].includes(k)).map(([k, v], i) => `<button data-build="${k}" aria-pressed="false"><em>${i + 1}</em><span class="icon">${v.icon}</span><strong>${v.label}</strong><small>${v.wood} madeira${v.stone ? ` · ${v.stone} pedra` : ''}</small></button>`).join('');
function select(type) {
  editor?.cancel();
  if (!isUnlocked(type, state)) {
    toast(type === 'well' ? 'Descubra o Santuário das águas para liberar o poço.' : 'Descubra a pedreira e faça uma colheita para liberar o celeiro.');
    return;
  }
  selected = selected === type ? null : type;
  document.querySelectorAll('[data-build]').forEach(b => {
    b.classList.toggle('active', b.dataset.build === selected);
    b.setAttribute('aria-pressed', String(b.dataset.build === selected));
  });
  $('build-help').textContent = selected ? type === 'waterfall' || type === 'mountain' || type === 'boat' || type === 'deck' ? 'Clique na água ou na terra · ESC cancela' : 'Clique no terreno · ESC cancela' : 'Escolha uma construção';
  if (selected) toast(`${catalog[selected].label}: escolha um espaço livre próximo.`);
}
document.querySelectorAll('[data-build]').forEach(b => b.onclick = () => select(b.dataset.build));
function setPaused(v) {
  paused = v;
  experience?.paused(v);
  Object.keys(keys).forEach(k => delete keys[k]);
  $('pause-screen').hidden = !v;
  if (v) save();
}
$('pause').onclick = () => setPaused(true);
$('resume').onclick = () => setPaused(false);
function aim(e) {
  pointer.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const groundHits = ray.intersectObject(ground);
  const lakeHits = ray.intersectObject(lakePlane);
  const hit = lakeHits.length ? groundHits.length ? lakeHits[0].distance < groundHits[0].distance ? lakeHits[0] : groundHits[0] : lakeHits[0] : groundHits[0] || null;
  hasPoint = !!hit && !editor?.occludes(ray, hit.distance);
  if (hasPoint) point.copy(hit.point);
}
function placementError(x, z) {
  if (!selected) return 'Selecione um item do menu';
  if (selected === 'boat') return boating.placementError(x, z);
  const reason = editor?.constructionError(x, z, catalog[selected].radius);
  if (reason) return reason;
  if (selected === 'waterfall') {
    if (Math.hypot(x - lake.center.x, z - lake.center.z) > lake.radius - 1.5) return 'A cachoeira precisa ficar sobre a água.';
    return null;
  }
  if (selected === 'mountain') {
    if (Math.hypot(x - lake.center.x, z - lake.center.z) < lake.radius + 1.5) return 'A montanha precisa ficar na terra, fora do lago.';
    return null;
  }
  if (selected === 'deck') {
    if (Math.hypot(x - lake.center.x, z - lake.center.z) > lake.radius - 1.4) return 'O deck precisa ficar dentro do lago.';
    return null;
  }
  return placementReason({
    x,
    z,
    radius: catalog[selected].radius,
    player: player.position,
    riverCenter: riverX,
    height,
    obstacles: [...editable.filter(e => e.g.visible).map(e => ({
      x: e.g.position.x,
      z: e.g.position.z,
      radius: e.radius || .7
    })), ...places.map(p => ({
      ...p,
      radius: 4
    }))]
  });
}
function placementValid(x, z) {
  return !placementError(x, z);
}
function place() {
  if (!hasPoint || !selected) return;
  const x = Math.round(point.x),
    z = Math.round(point.z),
    c = catalog[selected];
  if (selected === 'boat') {
    if (boating.place(x, z)) select('boat');
    return;
  }
  if (state.buildings.length >= 150) return toast('Seu vale atingiu o limite de 150 construções.');
  if (!isUnlocked(selected, state)) return;
  const error = placementError(x, z);
  if (error) return toast(error);
  if (!canAfford(state.inventory, c)) return toast('Recursos insuficientes. Explore a floresta e as rochas.');
  state.inventory.wood -= c.wood;
  state.inventory.stone -= c.stone;
  if (c.crystal) state.inventory.crystal -= c.crystal;
  const id = crypto.randomUUID();
  state.buildings.push({
    type: selected,
    x,
    z,
    id
  });
  building(selected, x, z, id);
  experience.burst('build', {
    x,
    z
  });
  toast(c.label + ' construída.');
  updateUI();
  save();
}
function blocked(x, z) {
  if (!inWorld(x, z) || mountainBlocked(x, z) || overlookRailing(x, z)) return true;
  if (onDock(x, z)) return editor?.objectBlocks(x, z) || false;
  if (editor) return editor.blocked(x, z) || editor.objectBlocks(x, z);
  if (inLake(x, z) || Math.abs(x - riverX(z)) < 2.8 && Math.abs(z) > 1.15) return true;
  return editable.some(e => e.g.visible && e.radius && Math.hypot(x - e.g.position.x, z - e.g.position.z) < e.radius);
}
let last = performance.now(),
  uiTick = 0,
  saveTick = 0;
const desired = new THREE.Vector3(),
  look = new THREE.Vector3();
if (!state.boat?.occupied && blocked(player.position.x, player.position.z)) player.position.set(-3, height(-3, 3), 3);
experience = createExperience({
  scene,
  M,
  player,
  arms,
  body,
  camera,
  renderer,
  sun,
  hemi,
  grass,
  water,
  ground,
  state,
  save,
  toast,
  refresh: updateUI,
  home: initialHome
});
boating = createBoating({
  scene,
  M,
  player,
  state,
  save,
  toast,
  onVisit: () => {
    view.angle = -.95;
    view.zoom = 35;
  },
  editor: () => editor,
  blocked,
  height: (x, z) => onDock(x, z) ? DOCK.y : height(x, z),
  ripple: (...args) => experience.ripple(...args)
});
const {
  collect,
  interaction
} = createCollection({
  state,
  player,
  resources,
  crops,
  editable,
  riverX,
  toast,
  updateUI,
  save,
  current: () => ({
    boating,
    editor,
    experience,
    elapsed,
    selected
  })
});
const stepPlayer = createPlayerMovement({
  player,
  body,
  legs,
  arms,
  height,
  riverX,
  blocked
});
bindControls({
  renderer,
  keys,
  view,
  current: () => ({
    editor,
    selected,
    paused
  }),
  select,
  setPaused,
  collect,
  aim,
  place
});
editor = createCreative({
  buildOptions: Object.entries(catalog).filter(([id]) => !['boat', 'deck', 'mountain', 'waterfall'].includes(id)).map(([id, c]) => ({
    id,
    label: c.label,
    keywords: id === 'cabin' ? 'casa lar' : id === 'field' ? 'plantação cultivo' : id === 'barn' ? 'fazenda' : ''
  })),
  onBuild: select,
  visitOverlook: hour => {
    if (boating.occupied) return toast('Desembarque antes de visitar o mirante.');
    if (Number.isFinite(hour)) state.time = hour;
    editor.clearPose();
    player.position.set(OVERLOOK.x, OVERLOOK.y, 0);
    view.angle = Math.PI / 2;
    view.zoom = 28;
    save();
    toast('Mirante do oeste. Arraste para contemplar o horizonte ou explore a ladeira.');
  },
  navigation: boating,
  lakeRegion,
  scene,
  camera,
  renderer,
  ground,
  water,
  grass,
  M,
  player,
  state,
  saved: saved?.creative,
  editable,
  resources,
  crops,
  sheep,
  save,
  toast,
  experience,
  cancelBuild: () => {
    selected = null;
    preview.visible = false;
    document.querySelectorAll('[data-build]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
  },
  isPaused: () => paused
});
if (!state.boat?.occupied && blocked(player.position.x, player.position.z)) player.position.set(-3, height(-3, 3), 3);
camera.position.set(player.position.x + 4, player.position.y + 12, player.position.z + 22);
updateUI();
toast('Bem-vindo ao Vale Verde. Sua história começa aqui.');
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - last) / 1000, .05);
  last = now;
  if (!paused) {
    elapsed += dt;
    state.time += dt / 40;
    if (state.time >= 24) {
      state.time -= 24;
      state.day++;
    }
    stepPlayer({
      dt,
      elapsed,
      keys,
      angle: view.angle,
      boating,
      pose: editor.pose,
      busy: experience.busy
    });
    for (const c of crops) c.plants.scale.y = c.readyAt > elapsed ? .15 + .85 * (1 - (c.readyAt - elapsed) / 45) : 1;
    ripples.position.z = Math.sin(elapsed * .5) * .15;
    uiTick += dt;
    saveTick += dt;
    if (uiTick > .2) {
      interaction();
      updateClock();
      uiTick = 0;
    }
    if (saveTick > 10) {
      save();
      saveTick = 0;
    }
  }
  boating.tick(paused ? 0 : dt, elapsed);
  lakeRegion.tick(paused ? 0 : dt, elapsed, experience.ripple);
  westRegion.tick(state.time);
  desired.set(player.position.x + Math.sin(view.angle) * view.zoom, player.position.y + view.zoom * .49, player.position.z + Math.cos(view.angle) * view.zoom);
  camera.position.lerp(desired, 1 - Math.exp(-dt * 5));
  camera.position.y = Math.max(camera.position.y, height(camera.position.x, camera.position.z) + 2);
  look.copy(player.position);
  look.y += .8;
  camera.lookAt(look);
  editor.camera(view.angle, desired, look, dt);
  editor.tick(paused ? 0 : dt, elapsed);
  preview.visible = !!selected && hasPoint && !paused;
  if (preview.visible) {
    const x = Math.round(point.x),
      z = Math.round(point.z);
    preview.position.set(x, (selected === 'boat' ? LAKE.level : height(x, z)) + .08, z);
    preview.scale.setScalar(catalog[selected].radius / 1.5);
    preview.material.color.set(placementValid(x, z) ? '#e6d59b' : '#ed8064');
  }
  experience.tick(paused ? 0 : dt, elapsed, !boating.occupied && !editor.pose.active && !!(keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD || keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight), paused);
  renderer.render(scene, camera);
  $('game').dataset.drawCalls = String(renderer.info.render.calls);
  $('game').dataset.triangles = String(renderer.info.render.triangles);
}
requestAnimationFrame(animate);
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
window.addEventListener('pagehide', save);
