import { foliageGeometry } from './foliage.js';
import { createPanoramicSky } from './sky.js';
import * as THREE from 'three';
import { lakeTerrain, westTerrain } from './region.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export const riverCenter = z => 9 + Math.sin(z * .075) * 3;
export function terrainHeight(x, z) {
  const bank = Math.abs(x - riverCenter(z));
  const settlement = THREE.MathUtils.smoothstep(Math.hypot(x + 3, z), 10, 28);
  const hills = (Math.sin(x * .095) * Math.cos(z * .11) + 1) * 1.35 + .55 * Math.sin(z * .21 + x * .1);
  const land = .42 + settlement * hills + .12 * Math.sin(x * .24) * Math.cos(z * .18);
  // Cut an actual bed; blend the banks into the hills without hiding the water.
  return westTerrain(x, z, lakeTerrain(x, z, THREE.MathUtils.lerp(-.65, land, THREE.MathUtils.smoothstep(bank, 2.05, 4.6))));
}
function seeded(seed) {
  return () => (seed = seed * 1664525 + 1013904223 >>> 0) / 4294967296;
}
function texture(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const random = seeded(521);
  ctx.fillStyle = '#b7b3a5';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6500; i++) {
    const v = 100 + Math.floor(random() * 145);
    ctx.fillStyle = `rgba(${v},${v},${v},${kind === 'cloth' ? .2 : .16})`;
    const x = random() * 256,
      y = random() * 256;
    ctx.fillRect(x, y, kind === 'wood' ? 1 + random() * 2 : 2, kind === 'wood' ? 15 + random() * 70 : 2);
  }
  if (kind === 'stone') {
    ctx.strokeStyle = '#5d605644';
    ctx.lineWidth = 2;
    for (let row = 0; row < 5; row++) {
      const y = row * 64;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
      for (let col = -1; col < 4; col++) {
        const x = col * 96 + row % 2 * 48;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 3, y + 64);
        ctx.stroke();
      }
    }
  }
  if (kind === 'cloth') {
    ctx.strokeStyle = '#ffffff25';
    ctx.lineWidth = 1;
    for (let i = 0; i < 256; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 4;
  return map;
}
export function textureMaterials(materials) {
  const wood = texture('wood'),
    stone = texture('stone'),
    cloth = texture('cloth'),
    earth = texture('earth');
  for (const key of ['wood', 'log', 'edge']) {
    materials[key].map = wood;
    materials[key].bumpMap = wood;
    materials[key].bumpScale = .065;
  }
  for (const key of ['stone', 'plaster']) {
    materials[key].map = stone;
    materials[key].bumpMap = stone;
    materials[key].bumpScale = .08;
  }
  for (const key of ['coat', 'pants', 'cream']) materials[key].map = cloth;
  materials.soil.map = earth;
  return earth;
}

// Merge by material inside spatial cells: fewer draw calls, still frustum-cullable.
export function batchStatic(root, excluded = []) {
  const skip = new Set(excluded),
    buckets = new Map(),
    remove = [];
  root.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
  root.traverse(object => {
    if (!object.isMesh || object.isInstancedMesh || Array.isArray(object.material)) return;
    for (let parent = object; parent; parent = parent.parent) if (skip.has(parent)) return;
    const position = new THREE.Vector3().setFromMatrixPosition(object.matrixWorld);
    const key = `${object.material.uuid}:${Math.floor(position.x / 18)}:${Math.floor(position.z / 18)}`;
    if (!buckets.has(key)) buckets.set(key, {
      material: object.material,
      geometries: []
    });
    let geometry = object.geometry.clone();
    if (geometry.index) {
      const old = geometry;
      geometry = geometry.toNonIndexed();
      old.dispose();
    }
    // Shared foliage materials may also shade smaller decorations: default to white.
    if (!geometry.getAttribute('color')) {
      const colors=new Float32Array(geometry.getAttribute('position').count*3).fill(1);
      geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    }
    // All merged primitives share position/normal/uv/color attributes.
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
    buckets.get(key).geometries.push(geometry);
    remove.push(object);
  });
  for (const object of remove) {
    object.removeFromParent();
    object.geometry.dispose();
  }
  for (const {
    material,
    geometries
  } of buckets.values()) {
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach(g => g.dispose());
    if (!geometry) continue;
    const object = new THREE.Mesh(geometry, material);
    object.castShadow = !material.transparent;
    object.receiveShadow = true;
    root.add(object);
  }
}
export function makeTree(parent, M, x, z, scale, pine, random) {
  const group = new THREE.Group();
  group.position.set(x, terrainHeight(x, z), z);
  const hash = n => {const v=Math.sin(x*127.1+z*311.7+n*74.7)*43758.5453;return v-Math.floor(v);};
  const spread = 1.18 + hash(1) * .35;
  group.scale.set(scale*spread, scale*(.82+hash(2)*.64), scale*spread);
  const foliageTint=hash(3);
  for(const material of [M.leaf,M.leaf2,M.pine]) material.vertexColors=true;
  group.rotation.y = random() * Math.PI * 2;
  parent.add(group);
  const limb = (from, to, radius) => {
    const a = new THREE.Vector3(...from),
      b = new THREE.Vector3(...to);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * .48, radius, a.distanceTo(b), 7), M.wood);
    mesh.position.copy(a).lerp(b, .5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
    group.add(mesh);
  };
  limb([0, 0, 0], [.12, 4.1, .1], .24);
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4;
    limb([0, .12, 0], [Math.cos(a) * .65, .04, Math.sin(a) * .65], .13);
  }
  const leaf = (x, y, z, r, color) => {
    const geo = foliageGeometry(r * 1.3, false, foliageTint);
    const mesh = new THREE.Mesh(geo, color);
    mesh.position.set(x, y, z);
    mesh.scale.set(1, .65 + random() * .25, 1);
    group.add(mesh);
  };
  if (pine) {
    for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(foliageGeometry(1.2, true, foliageTint), i % 2 ? M.pine : M.leaf);
      mesh.scale.set(1.8 - i * .27, .85, 1.8 - i * .27);
      mesh.position.y = 2 + i * .72;
      mesh.rotation.y = i * .7;
      group.add(mesh);
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4,
        reach = .85 + random() * .6,
        y = 2.8 + random() * 1.7;
      const bx = Math.cos(a) * reach,
        bz = Math.sin(a) * reach;
      limb([0, 1.8 + i * .18, 0], [bx, y, bz], .12);
      for(let twig=0;twig<3;twig++) {
        const t=a+twig*2.1;
        limb([bx*.65,y-.3,bz*.65],[bx+Math.cos(t)*.55,y+.35,bz+Math.sin(t)*.55],.028);
      }
      leaf(bx, y + .3, bz, .9 + random() * .4, i % 3 ? M.leaf : M.leaf2);
    }
    leaf(.1, 4.7, .1, 1.05, M.leaf2);
  }
  return group;
}
export function addTrail(scene, points, width, material) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const vertices = [],
    uvs = [],
    indices = [];
  const segments = 180;
  let traveled = 0, previousPoint;
  for (let i = 0; i <= segments; i++) {
    const p = curve.getPoint(i / segments),
      tangent = curve.getTangent(i / segments);
    if(previousPoint) traveled+=p.distanceTo(previousPoint);
    previousPoint=p.clone();
    for (const side of [-1, 1]) {
      const edge=width*(1+.045*Math.sin(traveled*3.1+side)+.025*Math.sin(traveled*7.7));
      const x = p.x - tangent.z * edge * side,
        z = p.z + tangent.x * edge * side;
      vertices.push(x, terrainHeight(x, z) + .027, z);
      uvs.push(side === -1 ? 0 : 1, traveled);
    }
    if (i < segments) {
      const n = i * 2;
      indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const path = new THREE.Mesh(geo, material);
  path.receiveShadow = true;
  scene.add(path);
  return path;
}
export const places = [{
  id: 'spring',
  label: 'Santuário das águas',
  x: -20,
  z: -18,
  reward: 'Poço desbloqueado',
  description: 'As pedras antigas guardam uma nascente. Agora você pode construir poços.'
}, {
  id: 'quarry',
  label: 'Pedreira de âmbar',
  x: 24,
  z: -15,
  reward: '+8 pedras · +2 cristais',
  description: 'Cristais surgem entre as rochas. Com uma colheita, esta descoberta libera o celeiro.'
}, {
  id: 'orchard',
  label: 'Pomar esquecido',
  x: 23,
  z: 20,
  reward: '+6 alimentos · +3 ervas',
  description: 'Um antigo pomar ainda floresce. Suas plantas podem ser coletadas novamente.'
}];
export function addLandmarks(scene, M, {
  box,
  sphere,
  cyl
}, resources) {
  const group = new THREE.Group();
  scene.add(group);
  const gem = new THREE.MeshStandardMaterial({
    color: '#e9b866',
    emissive: '#b96c19',
    emissiveIntensity: .3,
    roughness: .3,
    metalness: .2
  });
  const moss = new THREE.MeshStandardMaterial({
    color: '#687347',
    roughness: 1
  });
  for (const place of places) {
    const g = new THREE.Group();
    g.position.set(place.x, terrainHeight(place.x, place.z), place.z);
    group.add(g);
    if (place.id === 'spring') {
      for (const s of [-1, 1]) {
        box(g, M.stone, s * 1.6, 1.6, 0, .75, 3.2, .8);
        box(g, moss, s * 1.6, 3.23, 0, .9, .13, .9);
      }
      box(g, M.stone, 0, 3.45, 0, 4.2, .65, 1);
      cyl(g, M.stone, 0, .3, 1, 1.1, 1.25, .6, 12);
      cyl(g, M.water, 0, .62, 1, .85, .85, .03, 20);
      for (let i = 0; i < 5; i++) box(g, M.stone, -2 + i, .1, 2.5, .8, .2, 1);
    } else if (place.id === 'quarry') {
      for (let i = 0; i < 7; i++) {
        const a = i * 1.3;
        sphere(g, M.stone, Math.cos(a) * 2, .7 + i % 2 * .5, Math.sin(a) * 2, 1.1 + i % 3 * .3).scale.y = 1.2;
      }
      for (let i = 0; i < 6; i++) {
        const crystal = meshLocal(new THREE.ConeGeometry(.24, .9 + i % 2 * .5, 5), gem, g);
        crystal.position.set(-1 + i * .42, .8, -.4);
        crystal.rotation.z = (i - 3) * .12;
      }
      resources.push({
        type: 'crystal',
        x: place.x,
        z: place.z + 1,
        cooldown: 0
      });
    } else {
      for (let i = 0; i < 5; i++) {
        const x = i % 3 * 1.6 - 1.6,
          z = Math.floor(i / 3) * 2;
        sphere(g, M.leaf, x, .6, z, .8).scale.y = .7;
        for (let j = 0; j < 4; j++) sphere(g, M.coat, x + Math.sin(j * 2) * .5, .9, z + Math.cos(j * 2) * .5, .12);
      }
      resources.push({
        type: 'herbs',
        x: place.x,
        z: place.z + 1,
        cooldown: 0
      });
    }
  }
  // Domestic details give the starting cabin a lived-in silhouette.
  const home = new THREE.Group();
  home.position.set(-5, terrainHeight(-5, -5), -5);
  group.add(home);
  for (let i = 0; i < 6; i++) {
    const log = cyl(home, M.log, -2.2, .18 + Math.floor(i / 3) * .26, -.6 + i % 3 * .26, .13, .13, 1.2);
    log.rotation.x = Math.PI / 2;
  }
  for (const x of [-1, 1]) {
    box(home, M.wood, x, .75, 1.56, .82, .28, .36);
    sphere(home, M.leaf, x, .99, 1.58, .32).scale.y = .55;
    for (let j = 0; j < 3; j++) sphere(home, M.gold, x - .2 + j * .2, 1.08, 1.64, .07);
  }
  box(home, M.log, -2.1, .55, 2.4, 1.7, .14, .55);
  for (const x of [-2.7, -1.5]) box(home, M.wood, x, .25, 2.4, .13, .5, .45);
  cyl(home, M.wood, 2.25, .4, 1.7, .4, .34, .8, 12);
  cyl(home, M.dark, 2.25, .79, 1.7, .32, .32, .03, 12);
  group.userData.home = home;
  return group;
}
function meshLocal(geometry, material, parent) {
  const mesh = new THREE.Mesh(geometry, material);
  parent.add(mesh);
  return mesh;
}
export function createSky(scene) {
  return createPanoramicSky(scene);
}
