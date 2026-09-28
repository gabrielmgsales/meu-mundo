import { rockGeometry } from './landscape-detail.js';
import * as THREE from 'three';
import { LAKE, DOCK, FALL, MOUNTAINS, onDock, mountainBlocked } from './region.js';
import { terrainHeight, makeTree, batchStatic, addTrail } from './world-detail.js';
export function createLakeRegion(scene, M) {
  const root = new THREE.Group();
  root.name = 'Lago da montanha';
  scene.add(root);
  const lakeGeometry = new THREE.CircleGeometry(1, 128);
  lakeGeometry.rotateX(-Math.PI / 2);
  lakeGeometry.scale(LAKE.rx, 1, LAKE.rz);
  lakeGeometry.translate(LAKE.x, LAKE.level, LAKE.z);
  const lake = new THREE.Mesh(lakeGeometry, M.water);
  lake.receiveShadow = true;
  root.add(lake);
  const scenery = new THREE.Group();
  root.add(scenery);
  function box(x, y, z, w, h, d, material = M.log) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    scenery.add(mesh);
    return mesh;
  }
  const deck = new THREE.Group();
  deck.name = 'Deck do lago';
  root.add(deck);
  for (let x = DOCK.minX; x <= DOCK.maxX; x += .38) {
    const plank = box(x, DOCK.y - .1, 10, .35, .2, 3, M.wood);
    deck.attach(plank);
  }
  for (const x of [54, 58, 62, 65.6]) for (const z of [8.6, 11.4]) {
    const post = box(x, DOCK.y - .65, z, .2, 2.8, .2);
    deck.attach(post);
  }
  for (const x of [62, 65.5]) {
    const bollard = box(x, DOCK.y + .18, 11.25, .18, .4, .18, M.dark);
    deck.attach(bollard);
  }
  // Broad rock faces meet the water, with the summit behind the falling stream.
  const rocks = [];
  for (const [x, z, sx, sy, sz] of MOUNTAINS) {
    const rock = new THREE.Mesh(rockGeometry(x + z), M.stone);
    rock.position.set(x, terrainHeight(x, z) + sy * .32, z);
    rock.scale.set(sx, sy * .68, sz);
    rock.castShadow = rock.receiveShadow = true;
    scenery.add(rock);
    rocks.push(rock);
  }
  const entries = [];
  let seed = 7153;
  const random = () => (seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296;
  for (let i = 0; i < 115; i++) {
    const x = 46 + random() * 78,
      z = -39 + random() * 78;
    if (Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz) < 1.16 || onDock(x, z, 4) || mountainBlocked(x, z) || Math.abs(z - 10) < 2.5) continue;
    const g = makeTree(scenery, M, x, z, .65 + random() * .65, i % 3 === 0, random);
    entries.push({
      id: `east-tree:${i}`,
      g,
      resource: {
        type: 'wood',
        x,
        z,
        cooldown: 0
      },
      label: 'Árvore',
      kind: 'tree',
      radius: .45
    });
  }
  addTrail(scenery, [[14, 0], [30, 5], [43, 10], [53, 10]], 1, new THREE.MeshStandardMaterial({
    color: '#b5a177',
    roughness: 1
  }));
  const waterfall = new THREE.Group();
  waterfall.position.set(FALL.x, FALL.bottom, FALL.z);
  root.add(waterfall);
  const material = new THREE.MeshStandardMaterial({
    color: '#c7f0eb',
    transparent: true,
    opacity: .7,
    roughness: .23,
    side: THREE.DoubleSide
  });
  const height = FALL.top - FALL.bottom;
  for (let i = 0; i < 11; i++) {
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(.16, .25, height, 8), material);
    stream.position.set((i - 5) * .24, height / 2, Math.sin(i) * .08);
    waterfall.add(stream);
  }
  const foam = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 10), material);
  foam.position.z = .5;
  foam.scale.set(2, .12, 1.4);
  waterfall.add(foam);
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(.07, 6, 4), material, 90);
  waterfall.add(drops);
  const dummy = new THREE.Object3D();
  for (const e of entries) batchStatic(e.g);
  batchStatic(scenery, [...entries.map(e => e.g), ...rocks]);
  batchStatic(deck);
  return {
    lake,
    deck,
    root,
    entries,
    rocks,
    tick(dt, time, ripple) {
      if (dt <= 0) return;
      for (let i = 0; i < 90; i++) {
        dummy.position.set(Math.sin(i * 2.4) * 1.4, height - (time * 9 + i * .43) % height, .25 + Math.cos(i) * .25);
        dummy.scale.set(.65, 1.8, .65);
        dummy.updateMatrix();
        drops.setMatrixAt(i, dummy.matrix);
      }
      drops.instanceMatrix.needsUpdate = true;
      foam.scale.y = .14 + Math.sin(time * 6) * .025;
      if (Math.floor(time * 5) !== Math.floor((time - dt) * 5)) ripple?.(FALL.x + Math.sin(time * 9), FALL.z + .6, LAKE.level, .8);
    }
  };
}
export function createBoatModel(M) {
  const g = new THREE.Group();
  g.name = 'Barco';
  const shape = new THREE.Shape();
  shape.moveTo(0, 1.55);
  shape.quadraticCurveTo(.85, .95, .72, -.9);
  shape.quadraticCurveTo(0, -1.5, -.72, -.9);
  shape.quadraticCurveTo(-.85, .95, 0, 1.55);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: .3,
    bevelEnabled: true,
    bevelSize: .12,
    bevelThickness: .12,
    bevelSegments: 2,
    steps: 1
  });
  geometry.rotateX(Math.PI / 2);
  const hull = new THREE.Mesh(geometry, M.wood);
  hull.position.y = .15;
  g.add(hull);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(1.15, .12, 2.05), M.log);
  inner.position.y = .23;
  g.add(inner);
  for (const z of [-.7, 0]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.35, .12, .3), M.cream);
    bench.position.set(0, .45, z);
    g.add(bench);
  }
  for (const side of [-1, 1]) {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(.12, .3, 2.2), M.wood);
    rim.position.set(side * .69, .35, -.1);
    g.add(rim);
  }
  const oars = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * .65, .5, 0);
    g.add(pivot);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1.6, 8), M.log);
    shaft.rotation.z = Math.PI / 2;
    shaft.position.x = side * .7;
    pivot.add(shaft);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(.5, .06, .22), M.wood);
    blade.position.x = side * 1.4;
    pivot.add(blade);
    oars.push(pivot);
  }
  g.traverse(o => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  g.userData.oars = oars;
  batchStatic(g, oars);
  return g;
}
