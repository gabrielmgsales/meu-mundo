import { fishDepth } from './fish-depth.js';
import { createCreativeCatalog } from './creative-catalog.js';
import * as THREE from 'three';
import { inWorld, inLake, onDock, mountainBlocked, LAKE, DOCK, FALL, OVERLOOK, onOverlook, overlookRailing } from './region.js';
import { animals, allItems, biomes, getFurnitureAction } from './catalogs.js';
import { createItem, animateCampfire } from './models.js';
import { terrainHeight, riverCenter } from './world-detail.js';
import { readCreative, addLakeBrush } from './creative-state.js';
import { chooseRoutine, nearestDestination } from './routines.js';
import { weatherAt } from './environment.js';
import { animalMotion, stepAnimal, animateAnimal, createDayBirds, daytimeStrength } from './wildlife.js';
const $ = id => document.getElementById(id);
export function createCreative({
  buildOptions = [],
  onBuild,
  visitOverlook,
  navigation,
  lakeRegion,
  scene,
  terrainSurfaces = () => [],
  camera,
  renderer,
  ground,
  water,
  grass,
  M,
  player,
  state,
  saved,
  editable,
  resources,
  crops,
  sheep,
  save,
  toast,
  experience,
  cancelBuild,
  isPaused
}) {
  const data = readCreative(saved),
    entries = new Map(),
    ray = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  const cursor = new THREE.Vector2(innerWidth / 2, innerHeight / 2);
  let selected = null,
    moving = null,
    rotation = 0,
    ghost = null,
    pitch = 0,
    lakeMap = new Map(),
    waterMesh = null;
  let cabinYaw=0;
  let fp = data.firstPerson;
  const dummy = new THREE.Object3D();
  const dayBirds = createDayBirds(scene),
    motions = new WeakMap();
  const playBall = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 8), new THREE.MeshStandardMaterial({
    color: '#efaa56',
    roughness: .7
  }));
  playBall.visible = false;
  scene.add(playBall);
  let fetchGame = null;
  function throwBall(entry) {
    if (navigation.occupied) return toast('Desembarque para brincar.');
    if (entry.g.position.distanceTo(player.position) > 12) return toast('Aproxime-se do cachorro para brincar.');
    for (let i = 0; i < 12; i++) {
      const a = player.rotation.y + i * Math.PI / 6,
        x = player.position.x + Math.sin(a) * 5,
        z = player.position.z + Math.cos(a) * 5;
      if (!inWorld(x, z, 3) || waterAt(x, z) !== null || mountainBlocked(x, z) || onOverlook(x, z) || [...entries.values()].some(e => e.g.visible && !['animal', 'family'].includes(e.kind) && Math.hypot(x - e.g.position.x, z - e.g.position.z) < (e.radius || 1) + .5)) continue;
      fetchGame = {
        id: entry.id,
        x,
        z,
        stage: 'out',
        age: 0,
        origin: player.position.clone()
      };
      playBall.visible = true;
      context.hidden = true;
      toast('Busque a bolinha!');
      return;
    }
    toast('Procure um espaço aberto para jogar a bolinha.');
  }
  function applyBase(entry, change) {
    if (!change) return;
    entry.g.position.set(change.x, terrainHeight(change.x, change.z), change.z);
    entry.g.visible = !change.deleted;
    if (entry.resource) {
      entry.resource.x = change.x;
      entry.resource.z = change.z;
      entry.resource.deleted = !!change.deleted;
    }
    if (entry.crop) entry.crop.deleted = !!change.deleted;
    if (entry.sheep) {
      entry.sheep.x = change.x;
      entry.sheep.z = change.z;
    }
  }
  function registerBase(entry) {
    entry.g.userData.editId = entry.id;
    entries.set(entry.id, entry);
    applyBase(entry, data.base[entry.id]);
  }
  editable.forEach(registerBase);
  sheep.forEach((s, i) => {
    s.g.removeFromParent();
    s.g.traverse(o => {
      if (o.isMesh) o.geometry.dispose();
    });
    s.g = createItem(animals.find(a => a.id === 'ovelha'));
    scene.add(s.g);
    s.g.position.set(s.x, terrainHeight(s.x, s.z), s.z);
    registerBase({
      id: `sheep:${i}`,
      g: s.g,
      label: 'Ovelha',
      kind: 'animal',
      sheep: s
    });
  });
  function registerItem(record) {
    const item = allItems.find(i => i.id === record.type && i.kind === record.kind);
    if (!item) return;
    const g = createItem({...item, visualSeed: record.id});
    g.position.set(record.x, surfaceY(record.x, record.z, item), record.z);
    g.rotation.y = record.rotation || 0;
    scene.add(g);
    const entry = {
      id: record.id,
      g,
      label: item.label,
      kind: item.kind,
      item,
      record
    };
    g.userData.editId = record.id;
    entries.set(record.id, entry);
    return entry;
  }
  function surfaceY(x, z, item) {
    const wet = waterAt(x, z);
    return item?.family === 'fish' && wet !== null ? wet - .25 : onOverlook(x, z) ? OVERLOOK.y : landHeight(x, z);
  }
  function waterAt(x, z) {
    const lake = lakeMap.get(`${Math.round(x)},${Math.round(z)}`);
    return inLake(x, z) ? LAKE.level : lake ? lake.level : Math.abs(x - riverCenter(z)) < 2.4 ? .25 : null;
  }
  function landHeight(x, z) {
    const lake = lakeMap.get(`${Math.round(x)},${Math.round(z)}`);
    return lake ? Math.min(terrainHeight(x, z), lake.level - .65) : terrainHeight(x, z);
  }
  const originalGrass = [];
  for (let i = 0; i < (grass.userData.originalCount ?? grass.count); i++) {
    const matrix = new THREE.Matrix4();
    grass.getMatrixAt(i, matrix);
    originalGrass.push(matrix);
  }
  function rebuildLakes() {
    lakeMap = new Map(data.lakes.map(p => [`${p.x},${p.z}`, p]));
    if (waterMesh) {
      scene.remove(waterMesh);
      waterMesh.geometry.dispose();
    }
    const positions = [],
      normals = [];
    for (const p of data.lakes) {
      const x = p.x,
        z = p.z,
        y = p.level;
      for (const [dx, dz] of [[-.5, -.5], [-.5, .5], [.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) {
        positions.push(x + dx, y, z + dz);
        normals.push(0, 1, 0);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    waterMesh = new THREE.Mesh(geometry, M.water);
    scene.add(waterMesh);
    const attr = ground.geometry.attributes.position;
    for (let i = 0; i < attr.count; i++) attr.setY(i, landHeight(attr.getX(i), attr.getZ(i)));
    attr.needsUpdate = true;
    ground.geometry.computeVertexNormals();
    ground.geometry.computeBoundingSphere();
    originalGrass.forEach((matrix, i) => {
      dummy.matrix.copy(matrix);
      const pos = new THREE.Vector3().setFromMatrixPosition(matrix);
      if (waterAt(pos.x, pos.z) !== null) dummy.matrix.scale(new THREE.Vector3(0, 0, 0));
      grass.setMatrixAt(i, dummy.matrix);
    });
    grass.instanceMatrix.needsUpdate = true;
    for (const e of entries.values()) if (e.record) e.g.position.y = surfaceY(e.record.x, e.record.z, e.item);
  }
  rebuildLakes();
  data.items.forEach(registerItem);
  function biome(id) {
    const b = biomes.find(b => b.id === id) || biomes[0];
    data.biome = b.id;
    ground.material.color.set(b.ground);
    ground.userData.biomeColor = new THREE.Color(b.ground);
    M.leaf.color.set(b.leaf);
    M.leaf2.color.set(b.leaf).offsetHSL(0, 0, .08);
    M.pine.color.set(b.leaf).multiplyScalar(.75);
    grass.material.color.set(b.grass);
  }
  biome(data.biome);
  const context = document.createElement('div');
  context.id = 'object-menu';
  context.hidden = true;
  context.setAttribute('role', 'menu');
  document.body.append(context);
  const pose = {
    active: false,
    entryId: null,
    type: null,
    x: 0,
    y: 0,
    z: 0,
    rotation: 0
  };
  const crosshair = document.createElement('div');
  crosshair.id = 'crosshair';
  crosshair.textContent = '+';
  crosshair.hidden = !fp;
  document.body.append(crosshair);
  const marker = new THREE.Mesh(new THREE.RingGeometry(.22, .3, 40), new THREE.MeshBasicMaterial({
    color: '#e4cd8e',
    side: THREE.DoubleSide,
    depthWrite: false
  }));
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  scene.add(marker);
  function clearGhost() {
    if (ghost) {
      scene.remove(ghost);
      ghost.traverse(o => {
        if (o.isMesh) {
          o.geometry.dispose();
          o.material.dispose();
        }
      });
      ghost = null;
    }
  }
  function cancel() {
    selected = null;
    moving = null;
    clearGhost();
    marker.visible = false;
    context.hidden = true;
    $('creative-help').textContent = 'Selecione um item e clique no mundo.';
    renderCatalog();
  }
  function select(item) {
    cancelBuild();
    clearGhost();
    moving = null;
    context.hidden = true;
    selected = item;
    rotation = 0;
    if (item.kind && item.kind !== 'tool') {
      ghost = createItem(item);
      ghost.traverse(o => {
        if (o.isLight) o.visible = false;
        if (o.isMesh) {
          o.material = o.material.clone();
          o.material.transparent = true;
          o.material.opacity = .4;
          o.material.depthWrite = false;
          o.castShadow = false;
        }
      });
      scene.add(ghost);
      ghost.visible = false;
    }
    $('creative-help').textContent = `${item.label}: clique para colocar. R gira · Esc cancela.`;
    renderCatalog();
  }
  let familyAdding = false,
    familyCancel = false;
  const renderCatalog = createCreativeCatalog({
    data,
    buildOptions,
    onBuild,
    visitOverlook,
    navigation,
    select,
    cancel,
    biome,
    save,
    spawnFamily,
    cancelFamily: () => {
      familyCancel = true;
    },
    current: () => ({
      selected,
      familyAdding
    })
  });
  async function spawnFamily(item, count = 1) {
    if (familyAdding) return;
    if (navigation.occupied) {
      toast('Desembarque antes de reunir sua família.');
      return;
    }
    if (!Number.isSafeInteger(count) || count < 1) {
      toast('Escolha uma quantidade inteira de crianças, a partir de 1.');
      return;
    }
    familyAdding = true;
    familyCancel = false;
    let made = 0;
    renderCatalog();
    const existing = data.items.filter(i => i.kind === 'family').length;
    for (let i = 0; i < count && !familyCancel && !isPaused(); i++) {
      let point = null;
      for (let attempt = 0; attempt < 32; attempt++) {
        const n = existing + i + attempt,
          a = n * 2.399,
          r = 2.4 + Math.sqrt(n) * .65,
          x = player.position.x + Math.sin(a) * r,
          z = player.position.z + Math.cos(a) * r;
        if (!placementError({
          x,
          z
        }, item) && ![...entries.values()].some(e => e.g.visible && Math.hypot(e.g.position.x - x, e.g.position.z - z) < (e.radius ?? .5) + .3)) {
          point = {
            x,
            z
          };
          break;
        }
      }
      if (!point || !add(item, point, false)) break;
      made++;
      if (made % 8 === 0) {
        $('creative-help').textContent = made + ' familiares adicionados…';
        await new Promise(requestAnimationFrame);
      }
    }
    familyAdding = false;
    save();
    renderCatalog();
    toast(made + ' familiar(es) adicionado(s). Clique neles para acompanhar, mover ou excluir.');
  }
  function cameraMode() {
    fp = !fp;
    data.firstPerson = fp;
    pitch = 0; cabinYaw=0;
    player.visible = !fp && !state.truck?.occupied;
    crosshair.hidden = !fp;
    $('camera-mode').textContent = fp ? 'Visão externa · V' : 'Primeira pessoa · V';
    save();
    toast(fp ? 'Primeira pessoa: arraste para olhar; clique para interagir.' : 'Visão externa ativada.');
  }
  $('camera-mode').onclick = cameraMode;
  $('camera-mode').textContent = fp ? 'Visão externa · V' : 'Primeira pessoa · V';
  player.visible = !fp;
  $('save-world').onclick = () => {
    if (save()) toast('Mundo salvo neste navegador.');
  };
  $('home-menu').onclick = () => {
    if (save()) location.reload();else toast('Não foi possível salvar. O mundo continua aberto para você tentar novamente.');
  };
  window.addEventListener('keydown', e => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) || isPaused()) return;
    if (e.code === 'KeyV' && !e.repeat) cameraMode();
    if (e.code === 'KeyR' && !e.repeat) {
      rotation += Math.PI / 4;
      if (ghost) ghost.rotation.y = rotation;
    }
    if (e.code === 'Escape') cancel();
  });
  renderer.domElement.addEventListener('pointermove', e => {
    cursor.set(e.clientX, e.clientY);
  });
  window.addEventListener('pointerdown', e => {
    if (!context.contains(e.target)) context.hidden = true;
  });
  function cast(e) {
    const x = e?.clientX ?? cursor.x,
      y = e?.clientY ?? cursor.y;
    pointer.set(x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1);
    ray.setFromCamera(pointer, camera);
  }
  function editableHit() {
    const hits = ray.intersectObjects([...entries.values()].filter(e => e.g.visible).map(e => e.g), true);
    const wallHit = ray.intersectObjects(lakeRegion.rocks, false)[0];
    if (!hits.length || wallHit && wallHit.distance < hits[0].distance) return null;
    let o = hits[0].object;
    while (o && !o.userData.editId) o = o.parent;
    return o ? entries.get(o.userData.editId) : null;
  }
  function positionHit() {
    const hits = ray.intersectObjects([ground, ...terrainSurfaces(), water, waterMesh, lakeRegion.lake, ...lakeRegion.rocks], false);
    return hits[0] || null;
  }
  function placementError(p, item) {
    if (!inWorld(p.x, p.z, 3)) return 'Choque com o limite do mapa: escolha um ponto mais próximo.';
    if (onDock(p.x, p.z, 1) || item?.kind !== 'family' && onOverlook(p.x, p.z, 1) || mountainBlocked(p.x, p.z)) return 'Mantenha o deck e a montanha livres.';
    if (item?.family === 'fish' && waterAt(p.x, p.z) === null) return 'Coloque os peixes no rio ou em um lago.';
    if (item?.family !== 'fish' && waterAt(p.x, p.z) !== null && item?.family !== 'crocodile') return 'Escolha um ponto em terra firme.';
    return '';
  }
  function disposeEntry(e) {
    e.g.removeFromParent();
    e.g.traverse(o => {
      if (o.isMesh) o.geometry.dispose();
    });
    entries.delete(e.id);
  }
  function remove(e) {
    if (pose.entryId === e.id) clearPose();
    if (e.record) {
      data.items = data.items.filter(i => i.id !== e.id);
      disposeEntry(e);
    } else {
      data.base[e.id] = {
        x: e.g.position.x,
        z: e.g.position.z,
        deleted: true
      };
      applyBase(e, data.base[e.id]);
    }
    context.hidden = true;
    save();
    toast(`${e.label} removido.`);
  }
  function clearPose() {
    if (pose.active) player.rotation.x = 0;
    pose.active = false;
    pose.entryId = null;
    pose.type = null;
    pose.x = 0;
    pose.y = 0;
    pose.z = 0;
    pose.rotation = 0;
    $('creative-help').textContent = 'Selecione um item e clique no mundo.';
    context.hidden = true;
  }
  function setPose(entry, action) {
    if (navigation.occupied) {
      toast('Desembarque antes de usar a mobília.');
      return;
    }
    if (player.position.distanceTo(entry.g.position) > 4) {
      toast('Aproxime-se da mobília para usá-la.');
      return;
    }
    const point = entry.g.getWorldPosition(new THREE.Vector3());
    const rotation = entry.g.rotation.y || 0;
    const direction = new THREE.Vector3(Math.sin(rotation), 0, Math.cos(rotation));
    const offset = action.type === 'lie' ? new THREE.Vector3(direction.x * .85, 0, direction.z * .85) : new THREE.Vector3();
    pose.active = true;
    pose.entryId = entry.id;
    pose.type = action.type;
    pose.rotation = rotation;
    pose.x = point.x + offset.x;
    pose.z = point.z + offset.z;
    pose.y = entry.g.position.y + (action.type === 'lie' ? .84 : -.08);
    player.position.set(pose.x, pose.y, pose.z);
    player.rotation.y = pose.rotation;
    context.hidden = true;
    toast(action.type === 'sit' ? 'Você sentou na mobília.' : 'Você deitou na cama.');
    $('creative-help').textContent = action.type === 'sit' ? 'Você está sentado. Clique novamente para levantar.' : 'Você está deitado. Clique novamente para levantar.';
  }
  function menu(e, buttons, label) {
    delete context.dataset.entryId;
    context.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = label;
    context.append(title);
    const actions = document.createElement('div');
    for (const [text, fn] of buttons) {
      const b = document.createElement('button');
      b.textContent = text;
      b.setAttribute('role', 'menuitem');
      b.onclick = fn;
      actions.append(b);
    }
    context.append(actions);
    context.hidden = false;
    context.style.left = `${Math.max(8, Math.min(e.clientX, innerWidth - context.offsetWidth - 8))}px`;
    context.style.top = `${Math.max(8, Math.min(e.clientY + 14, innerHeight - context.offsetHeight - 8))}px`;
  }
  function add(item, p, shouldSave = true) {
    if (item.id === 'esposa' && data.items.some(i => i.kind === 'family' && i.type === 'esposa')) {
      toast('Sua esposa já está neste mundo.');
      return false;
    }
    const error = placementError(p, item);
    if (error) {
      toast(error);
      return;
    }
    if (item.kind !== 'family' && data.items.filter(i => i.kind !== 'family').length >= 500) {
      toast('Limite de 500 itens criados neste mundo. Exclua um item para continuar.');
      return;
    }
    const record = {
      id: crypto.randomUUID(),
      kind: item.kind,
      type: item.id,
      x: p.x,
      z: p.z,
      rotation,
      follow: false,
      routine: item.kind === 'family'
    };
    data.items.push(record);
    registerItem(record);
    if (shouldSave) save();
    return true;
  }
  function click(e) {
    if(state.truck?.occupied)return toast('Saia da picape para editar o mundo.');
    if (isPaused()) return true;
    cast(e);
    const hit = positionHit();
    if (hit && lakeRegion.rocks.includes(hit.object)) {
      toast("Esta montanha faz parte da paisagem.");
      return true;
    }
    if (selected?.kind === 'tool') {
      if (selected.id === 'boat') {
        if (hit && navigation.place(hit.point.x, hit.point.z)) cancel();
        return true;
      }
      if (!hit) return true;
      const p = hit.point;
      if (!inWorld(p.x, p.z, 3)) return true;
      if (inLake(p.x, p.z) || onDock(p.x, p.z, 3) || onOverlook(p.x, p.z, 3) || mountainBlocked(p.x, p.z)) {
        toast('O lago natural, o deck e a montanha são preservados.');
        return true;
      }
      if (Math.hypot(p.x - player.position.x, p.z - player.position.z) < 3) {
        toast('Afaste-se antes de alterar o terreno sob seus pés.');
        return true;
      }
      if (selected.id === 'lake') data.lakes = addLakeBrush(data.lakes, p.x, p.z, 1.8, terrainHeight);else data.lakes = data.lakes.filter(c => Math.hypot(c.x - p.x, c.z - p.z) > 2);
      rebuildLakes();
      save();
      return true;
    }
    if (moving || selected) {
      if (!hit) {
        toast('Clique no chão para posicionar.');
        return true;
      }
      const p = hit.point;
      if (moving) {
        const error = placementError(p, moving.item);
        if (error) {
          toast(error);
          return true;
        }
        if (moving.record) {
          Object.assign(moving.record, {
            x: p.x,
            z: p.z,
            rotation
          });
          moving.g.position.set(p.x, surfaceY(p.x, p.z, moving.item), p.z);
          moving.g.rotation.y = rotation;
        } else {
          data.base[moving.id] = {
            x: p.x,
            z: p.z,
            deleted: false
          };
          applyBase(moving, data.base[moving.id]);
        }
        motions.delete(moving.g);
        moving = null;
        marker.visible = false;
        save();
        $('creative-help').textContent = 'Elemento reposicionado.';
      } else add(selected, p);
      return true;
    }
    const boatHit = navigation.model.visible ? ray.intersectObject(navigation.model, true)[0] : null;
    if (boatHit && (!hit || boatHit.distance < hit.distance)) {
      menu(e, [[navigation.occupied ? 'Desembarcar / atracar' : 'Entrar', () => {
        navigation.interact();
        context.hidden = true;
      }], ['Trazer ao deck', () => {
        navigation.recall();
        context.hidden = true;
      }]], 'Barco');
      return true;
    }
    const deckHit = ray.intersectObject(lakeRegion.deck, true)[0];
    if (deckHit && (!hit || deckHit.distance < hit.distance)) {
      menu(e, [['Trazer barco ao deck', () => {
        navigation.recall();
        context.hidden = true;
      }]], 'Deck');
      return true;
    }
    const entry = editableHit();
    if (entry) {
      const action = getFurnitureAction(entry.item || {
        id: entry.record && entry.record.type || entry.id,
        kind: 'furniture'
      });
      const buttons = [];
      if (entry.item?.id === 'cachorro') buttons.push(['Jogar bolinha', () => throwBall(entry)]);
      if (entry.kind === 'family') buttons.push([entry.record.follow ? 'Ficar aqui' : 'Acompanhar', () => {
        entry.record.follow = !entry.record.follow;
        entry.record.routine = false;
        entry.record.x = entry.g.position.x;
        entry.record.z = entry.g.position.z;
        motions.delete(entry.g);
        context.hidden = true;
        save();
      }]);
      if (entry.kind === 'family' && entry.record.routine) buttons.push(['Ficar aqui', () => {
        entry.record.follow = false;
        entry.record.routine = false;
        entry.record.x = entry.g.position.x;
        entry.record.z = entry.g.position.z;
        motions.delete(entry.g);
        context.hidden = true;
        save();
      }]);
      if (entry.kind === 'family') buttons.push(['Rotina livre', () => {
        entry.record.follow = false;
        entry.record.routine = true;
        context.hidden = true;
        save();
        toast('Agora este familiar passeia, descansa e procura abrigo por conta própria.');
      }], ['Conversar', () => {
        context.hidden = true;
        toast(entry.item.adult ? 'Que tal passearmos juntos pelo vale?' : 'Vamos brincar lá fora?');
      }]);
      if (action) {
        const toggle = () => {
          if (pose.active && pose.entryId === entry.id) {
            clearPose();
            return;
          }
          setPose(entry, action);
        };
        buttons.push([action.label, toggle]);
      }
      if (pose.active && pose.entryId === entry.id) {
        buttons.push(['Levantar', () => {
          clearPose();
          toast('Você se levantou da mobília.');
        }]);
      }
      buttons.push(['Mover', () => {
        cancelBuild();
        if (pose.entryId === entry.id) clearPose();
        moving = entry;
        rotation = entry.g.rotation.y;
        context.hidden = true;
        $('creative-help').textContent = `Mover ${entry.label}: clique na nova posição. Esc cancela.`;
      }], ['Excluir', () => remove(entry)]);
      menu(e, buttons, entry.label);
      context.dataset.entryId = entry.id;
      return true;
    }
    if (hit && (hit.object === water || hit.object === waterMesh || hit.object === lakeRegion.lake)) {
      const p = hit.point.clone();
      menu(e, [...(hit.object === lakeRegion.lake ? [['Colocar barco', () => {
        navigation.place(p.x, p.z);
        context.hidden = true;
      }]] : []), ['Colocar peixes', () => {
        add(animals.find(a => a.id === 'peixes'), p);
        context.hidden = true;
      }], ['Excluir peixes', () => {
        const fish = [...entries.values()].filter(en => en.item?.family === 'fish' && Math.hypot(en.g.position.x - p.x, en.g.position.z - p.z) < 5);
        fish.forEach(en => {
          data.items = data.items.filter(i => i.id !== en.id);
          disposeEntry(en);
        });
        save();
        context.hidden = true;
        toast(`${fish.length} peixe(s) removido(s) em até 5 m do clique.`);
      }]], 'Rio e lago · peixes próximos');
      return true;
    }
    context.hidden = true;
    return false;
  }
  renderCatalog(true);
  function updateAnimals(dt, time) {
    if (dt <= 0 || isPaused()) return;
    dayBirds.tick(dt, time, state.time);
    if (fetchGame) {
      fetchGame.age += dt;
      const dog = entries.get(fetchGame.id);
      if (!dog?.g.visible || fetchGame.age > 35) {
        fetchGame = null;
        playBall.visible = false;
      } else if (fetchGame.stage === 'out') {
        const t = Math.min(1, fetchGame.age / .8);
        playBall.position.set(THREE.MathUtils.lerp(fetchGame.origin.x, fetchGame.x, t), THREE.MathUtils.lerp(fetchGame.origin.y + 1, landHeight(fetchGame.x, fetchGame.z) + .14, t) + Math.sin(t * Math.PI) * 2, THREE.MathUtils.lerp(fetchGame.origin.z, fetchGame.z, t));
      }
    }
    const obstacles = [...entries.values()].filter(e => e.g.visible && !['animal', 'family'].includes(e.kind) && (e.radius ?? 1) > 0 && e.item?.id !== 'tapete');
    const daylight = daytimeStrength(state.time),
      rain = weatherAt(state.day, state.time).rain;
    const visible = [...entries.values()].filter(e => e.g.visible);
    const trees = visible.filter(e => e.kind === 'tree');
    const houses = visible.filter(e => e.kind === 'building' && ['Cabana', 'Celeiro'].includes(e.label));
    const seats = visible.filter(e => getFurnitureAction(e.item)?.type === 'sit' && pose.entryId !== e.id);
    const reserved = new Set();
    for (const e of entries.values()) {
      if (!e.g.visible || !['animal', 'family'].includes(e.kind) || e === moving || !context.hidden && context.dataset.entryId === e.id) continue;
      const x = e.record?.x ?? e.sheep?.x ?? e.g.position.x,
        z = e.record?.z ?? e.sheep?.z ?? e.g.position.z;
      let motion = motions.get(e.g);
      if (!motion || motion.homeX !== x || motion.homeZ !== z) {
        motion = animalMotion(e.id, x, z);
        motion.heading = e.g.rotation.y;
        motion.routineSeed = motion.random() * 2;
        motion.nextVoice = time + 5 + motion.random() * 20;
        motions.set(e.g, motion);
      }
      if ((motion.nextVoice ?? 0) < time) {
        motion.nextVoice = time + 12 + motion.random() * 24;
        if (e.item && ['cachorro', 'cow', 'bull', 'sheep', 'goat', 'bird'].includes(e.item.id === 'cachorro' ? 'cachorro' : e.item.family)) experience.creature?.(e.item.id === 'cachorro' ? 'cachorro' : e.item.family, e.g.position);
      }
      const person = e.kind === 'family',
        family = person ? 'human' : e.item?.family || 'sheep',
        fish = family === 'fish',
        amphibious = family === 'crocodile';
      const canEnter = (px, pz) => {
        if (!inWorld(px, pz, 3) || mountainBlocked(px, pz) || overlookRailing(px, pz)) return false;
        for (const [dx, dz] of [[0, 0], [.22, 0], [-.22, 0], [0, .22], [0, -.22]]) {
          const wet = waterAt(px + dx, pz + dz) !== null;
          if (fish && !wet || !fish && !amphibious && wet) return false;
        }
        return fish || !obstacles.some(o => {
          if (person && o === seat) return false;
          const radius = (o.radius ?? .55) + .22;
          const next = Math.hypot(px - o.g.position.x, pz - o.g.position.z);
          const current = Math.hypot(motion.x - o.g.position.x, motion.z - o.g.position.z);
          // An animal placed inside a scenery footprint may walk outward, never deeper in.
          return next < radius && (current >= radius || next <= current + 1e-6);
        });
      };
      const floor = (px, pz) => (fish || amphibious) && waterAt(px, pz) !== null ? waterAt(px, pz) - .32 : onOverlook(px, pz) ? OVERLOOK.y : landHeight(px, pz);
      const routine = chooseRoutine({
        person,
        child: person && !e.item.adult,
        follow: e.record?.follow,
        hour: state.time,
        rain,
        distance: Math.hypot(player.position.x - motion.x, player.position.z - motion.z),
        phase: motion.routineSeed
      });
      let goal = null,
        restBehavior = 'idle',
        seat = null;
      if (person && e.record.follow && !navigation.occupied) {
        if (Math.hypot(player.position.x - motion.x, player.position.z - motion.z) > 2.5) goal = {
          x: player.position.x + Math.sin(motion.phase * .1) * 1.6,
          z: player.position.z + Math.cos(motion.phase * .1) * 1.6
        };
      } else if (!fish && (!person || e.record.routine)) {
        if (person && routine === 'sit') {
          seat = seats.find(s => !reserved.has(s.id) && Math.hypot(s.g.position.x - motion.x, s.g.position.z - motion.z) < 12);
          if (seat) {
            reserved.add(seat.id);
            goal = {
              x: seat.g.position.x,
              z: seat.g.position.z
            };
            restBehavior = 'sit';
          }
        }
        if (!seat && (motion.planAt == null || time > motion.planAt || motion.routine !== routine)) {
          motion.planAt = time + 4;
          motion.routine = routine;
          let candidates = [];
          if (['shelter', 'home'].includes(routine)) for (const h of houses) candidates.push({
            x: h.g.position.x,
            z: h.g.position.z + (h.radius || 2) + .45
          });
          if (routine === 'shade' || routine === 'shelter') for (const t of trees) candidates.push({
            x: t.g.position.x + 1.1,
            z: t.g.position.z
          });
          if (routine === 'drink') for (let a = 0; a < 24; a++) {
            const angle = a * Math.PI / 12;
            for (let r = 1; r <= 9; r += 2) {
              const x = motion.x + Math.sin(angle) * r,
                z = motion.z + Math.cos(angle) * r;
              if (waterAt(x, z) !== null) candidates.push({
                x: x - Math.sin(angle) * 1.1,
                z: z - Math.cos(angle) * 1.1
              });
            }
          }
          if (routine === 'avoid') candidates = [{
            x: motion.x + (motion.x - player.position.x) * 2,
            z: motion.z + (motion.z - player.position.z) * 2
          }];
          if (routine === 'play') candidates = [{
            x: motion.homeX + Math.sin(time * .3 + motion.phase) * 3,
            z: motion.homeZ + Math.cos(time * .3 + motion.phase) * 3
          }];
          if (routine === 'social') for (const f of visible.filter(f => f.kind === 'family' && f !== e)) candidates.push({
            x: f.g.position.x + 1,
            z: f.g.position.z + 1
          });
          motion.goal = nearestDestination(motion, candidates, canEnter);
          motion.rest = ['drink', 'graze'].includes(routine) ? routine : 'idle';
        }
        if (!seat) {
          goal = motion.goal;
          restBehavior = motion.rest;
        }
      }
      if (fetchGame?.id === e.id) {
        goal = fetchGame.stage === 'out' ? {
          x: fetchGame.x,
          z: fetchGame.z
        } : {
          x: player.position.x + Math.sin(player.rotation.y) * 1.4,
          z: player.position.z + Math.cos(player.rotation.y) * 1.4
        };
        if (fetchGame.stage === 'out' && fetchGame.age > .8 && Math.hypot(motion.x - goal.x, motion.z - goal.z) < .4) fetchGame.stage = 'return';
        if (fetchGame.stage === 'return') {
          playBall.position.set(motion.x + Math.sin(motion.heading) * .45, floor(motion.x, motion.z) + .5, motion.z + Math.cos(motion.heading) * .45);
          if (Math.hypot(motion.x - player.position.x, motion.z - player.position.z) < 1.9) {
            fetchGame = null;
            playBall.visible = false;
            toast('Boa! O cachorro trouxe a bolinha.');
          }
        }
      }
      stepAnimal(motion, dt, {
        goal,
        restBehavior,
        moveSpeed: person ? e.record.follow ? 2.8 : routine === 'play' ? 1.8 : 1 : undefined,
        family,
        type: e.item?.id,
        player: player.position,
        canEnter,
        height: floor,
        daylight: person ? 1 : daylight
      });
      const sitting = seat && goal && Math.hypot(goal.x - motion.x, goal.z - motion.z) < .25;
      e.g.position.set(motion.x, sitting ? seat.g.position.y + (e.item.adult ? -.08 : .18) : floor(motion.x, motion.z) + (motion.walking && !fish ? Math.abs(Math.sin(motion.phase)) * (motion.playful ? .12 : .025) : 0), motion.z);
      if(fish && dt>0) {
        const level=waterAt(motion.x,motion.z);
        if(level!==null){
          const nextY=fishDepth({id:e.record?.id || e.id,time,dt,surface:level,bed:landHeight(motion.x,motion.z),size:e.item.size,current:e.g.userData.swimY});
          e.g.userData.swimY=nextY;e.g.position.y=nextY;
        }
      } else if(fish && Number.isFinite(e.g.userData.swimY))e.g.position.y=e.g.userData.swimY;
      animateAnimal(e.g, motion, dt);
      if (sitting) e.g.rotation.y = seat.g.rotation.y;
      if (person) {
        for (const joint of e.g.userData.rig || []) if (joint.userData.arm) joint.rotation.z = routine === 'social' && !motion.walking ? Math.sin(time * 3) * .12 : 0;
      }
      if (motion.walking && (fish || amphibious) && Math.floor(time * 2) !== Math.floor((time - dt) * 2)) {
        const level = waterAt(motion.x, motion.z);
        if (level !== null && (!fish || level-e.g.position.y<.65)) experience.ripple?.(motion.x, motion.z, level, fish ? .35 : .7);
      }
    }
  }
  return {
    get data() {
      return {
        ...data,
        items: data.items.map(i => {
          const e = entries.get(i.id);
          return i.kind === 'family' && e ? {
            ...i,
            x: e.g.position.x,
            z: e.g.position.z
          } : i;
        })
      };
    },
    get cabinLook(){return {yaw:cabinYaw,pitch};},
    get firstPerson() {
      return fp;
    },
    get active() {
      return !!(selected || moving);
    },
    get pose() {
      return pose;
    },
    cancel,
    click,
    clearPose,
    registerBase,
    terrainHeight: landHeight,
    waterAt,
    constructionError(x, z, radius) {
      for (const [dx, dz] of [[0, 0], [radius, 0], [-radius, 0], [0, radius], [0, -radius]]) {
        if (onDock(x + dx, z + dz, 1) || onOverlook(x + dx, z + dz, 1) || mountainBlocked(x + dx, z + dz)) return 'Mantenha a montanha e o deck livres.';
        if (waterAt(x + dx, z + dz) !== null) return 'Escolha terreno firme, fora da água.';
      }
      return '';
    },
    occludes(aimRay, distance) {
      const hit = aimRay.intersectObjects(lakeRegion.rocks, false)[0];
      return !!hit && hit.distance < distance;
    },
    look(dy,dx=0) {
      if(fp&&state.truck?.occupied)cabinYaw=THREE.MathUtils.clamp(cabinYaw-dx*.007,-1.8,1.8);
      if (fp) pitch = THREE.MathUtils.clamp(pitch - dy * .004, -1.2, 1.2);
    },
    blocked(x, z) {
      return !inWorld(x, z) || mountainBlocked(x, z) || !onDock(x, z) && waterAt(x, z) !== null && !(Math.abs(z) < 1.15 && Math.abs(x - riverCenter(z)) < 3.8);
    },
    objectBlocks(x, z) {
      return [...entries.values()].some(e => e.g.visible && !['animal', 'family'].includes(e.kind) && e.kind !== 'furniture' && Math.hypot(x - e.g.position.x, z - e.g.position.z) < (e.radius ?? .45));
    },
    camera(angle, desired, look, dt) {
      if (fp && !state.truck?.occupied) {
        camera.position.copy(player.position).add(new THREE.Vector3(0,player.userData.swimming ? .12 : 1.65,0));
        look.set(camera.position.x - Math.sin(angle) * Math.cos(pitch), camera.position.y + Math.sin(pitch), camera.position.z - Math.cos(angle) * Math.cos(pitch));
        camera.lookAt(look);
      } else {
        const target = player.position.clone().add(new THREE.Vector3(0, player.userData.swimming ? .15 : 1.3, 0)),
          direction = desired.clone().sub(target),
          length = direction.length();
        ray.set(target, direction.clone().normalize());
        const scenery = [...entries.values()].filter(e => e.g.visible && !['animal', 'family'].includes(e.kind) && e.kind !== 'furniture' && e.g.position.distanceToSquared(target) < length * length).map(e => e.g);
        const wallHit = ray.intersectObjects([...lakeRegion.rocks, ...scenery], true)[0];
        if (wallHit && wallHit.distance < length) camera.position.copy(target).addScaledVector(direction.normalize(), Math.max(.5, wallHit.distance - .25));
        camera.lookAt(look);
      }
    },
    tick(dt, time) {
      if (pose.active) {
        player.position.set(pose.x, pose.y, pose.z);
        player.rotation.y = pose.rotation;
      }
      const sheltered = [...entries.values()].some(e => e.g.visible && e.kind === 'building' && ['Cabana', 'Celeiro'].includes(e.label) && Math.hypot(player.position.x - e.g.position.x, player.position.z - e.g.position.z) < (e.radius || 2) + .7);
      const lakeFallDistance = Math.hypot(player.position.x - FALL.x, player.position.z - FALL.z);
      experience.ambience?.(Math.max(0, 1 - lakeFallDistance / 28), {
        sheltered,
        waterAt,
        landHeight,
        detailBlocked: (x, z) => [...entries.values()].some(e => e.g.visible && !['animal', 'family'].includes(e.kind) && Math.hypot(x - e.g.position.x, z - e.g.position.z) < (e.radius || .8) + .4),
        source: FALL,
        surface: onDock(player.position.x, player.position.z) || onOverlook(player.position.x, player.position.z) ? 'wood' : Math.abs(player.position.z) < 1.4 && Math.abs(player.position.x - riverCenter(player.position.z)) < 3.8 ? 'wood' : 'grass'
      });
      if (dt > 0 && !isPaused()) {
        for (const e of entries.values()) if (e.g.visible && e.kind === 'tree') e.g.rotation.z = Math.sin(time * 1.3 + e.g.position.x * .3) * (.009 + weatherAt(state.day, state.time).rain * .018);
      }
      updateAnimals(dt, time);
      if (dt > 0 && !isPaused()) for (const e of entries.values()) if (e.g.visible && e.g.userData.fire) animateCampfire(e.g, time);
      if (isPaused()) {
        marker.visible = false;
        if (ghost) ghost.visible = false;
        context.hidden = true;
        return;
      }
      if (selected || moving) {
        cast();
        const hit = positionHit();
        marker.visible = !!hit;
        if (marker.visible) {
          marker.position.copy(hit.point);
          marker.position.y += .08;
        }
        if (ghost) {
          ghost.visible = marker.visible;
          if (ghost.visible) {
            ghost.position.set(hit.point.x, surfaceY(hit.point.x, hit.point.z, selected), hit.point.z);
            ghost.rotation.y = rotation;
          }
        }
      }
    }
  };
}
