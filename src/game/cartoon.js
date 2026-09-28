import * as THREE from 'three';
import { batchStatic, terrainHeight, riverCenter } from './world-detail.js';
import { daytimeStrength } from './daylight.js';
import { cartoonMaterial } from './toon-material.js';
function shape(parent, geometry, material, x, y, z, sx = 1, sy = 1, sz = 1) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
const sphere = () => new THREE.SphereGeometry(1, 12, 8);
const box = () => new THREE.BoxGeometry(1, 1, 1);

// Decorations belong to their building, so moving/deleting the house moves them too.
export function decorateBuilding(g, type, M) {
  if (!['cabin','barn'].includes(type)) return;
  const w=type==='barn'?4.5:3.3, d=type==='barn'?3.6:2.8;
  // Rectangular attic vent, gutter, downpipe and foundation details.
  const vent=shape(g,box(),M.edge,0,3.37,d/2+.24,.62,.45,.08);
  vent.name='Ventila??o do s?t?o';
  for(let i=0;i<5;i++)shape(g,box(),M.dark,0,3.21+i*.075,d/2+.29,.49,.028,.015);
  for(const side of [-1,1]) {
    shape(g,box(),M.edge,side*(w/2+.27),2.85,0,.10,.10,d+.7);
    shape(g,new THREE.CylinderGeometry(.04,.04,2.5,8),M.edge,side*(w/2+.15),1.4,-d/2-.1);
    shape(g,box(),M.stone,side*w*.32,1.17,d/2+.2,.86,.09,.29);
  }
}
export function dressAdventurer(player, M) {
  for(const side of [-1,1]) {
    shape(player,sphere(),M.dark,side*.06,1.68,.132,.014,.008,.009);
    shape(player,box(),M.wood,side*.06,1.71,.126,.044,.009,.01);
  }
  shape(player,sphere(),M.skin,0,1.635,.15,.026,.04,.036);
  shape(player,box(),M.dark,0,1.575,.139,.055,.006,.005);
  // Invisible attachment retains the animation contract without fantasy accessories.
  const scarf=new THREE.Group();player.add(scarf);return {scarf};
}
export function createCartoonAtmosphere(scene, M) {
  const root = new THREE.Group();
  root.name = 'Detalhes cartunescos';
  scene.add(root);
  const cloudMaterial = new THREE.MeshBasicMaterial({
    color: '#fff6df',
    transparent: true,
    opacity: .76,
    depthWrite: false,
    fog: true
  });
  const clouds = new THREE.Group();
  root.add(clouds);
  for (let i = 0; i < 7; i++) {
    const cloud = new THREE.Group();
    cloud.position.set(-65 + i * 21, 29 + i % 3 * 4, -32 - i % 2 * 27);
    clouds.add(cloud);
    for (let j = 0; j < 4; j++) shape(cloud, sphere(), cloudMaterial, j * 2.3 - 3, Math.sin(j * 2) * .6, 0, 2.8, 1.25 + j % 2 * .65, 1.9).castShadow = false;
    batchStatic(cloud);
  }
  const flags = [];
  const flagMaterials = ['#ee9077', '#f8d46f', '#77c9c1'].map(c => cartoonMaterial(c, {
    side: THREE.DoubleSide
  }));
  const banner = new THREE.Group();
  banner.position.set(riverCenter(0), .65, 0);
  root.add(banner);
  for (const side of [-1, 1]) shape(banner, new THREE.CylinderGeometry(.055, .08, 3.3, 8), M.wood, side * 3.5, 1.65, -1.4);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-3.5, 3.25, -1.4), new THREE.Vector3(0, 2.85, -1.4), new THREE.Vector3(3.5, 3.25, -1.4)]);
  shape(banner, new THREE.TubeGeometry(curve, 24, .016, 4, false), M.wood, 0, 0, 0);
  for (let i = 0; i < 9; i++) {
    const p = curve.getPoint((i + 1) / 10),
      outline = new THREE.Shape();
    outline.moveTo(-.19, 0);
    outline.lineTo(.19, 0);
    outline.lineTo(0, -.42);
    outline.closePath();
    const flag = shape(banner, new THREE.ShapeGeometry(outline), flagMaterials[i % 3], p.x, p.y, p.z);
    flags.push(flag);
  }
  batchStatic(banner, flags);
  const butterflies = [];
  for (let i = 0; i < 12; i++) {
    const insect = new THREE.Group();
    root.add(insect);
    const wings = [];
    for (const s of [-1, 1]) {
      const wing = shape(insect, sphere(), flagMaterials[i % 3], s * .08, 0, 0, .1, .018, .13);
      wings.push(wing);
    }
    shape(insect, sphere(), M.dark, 0, 0, 0, .016, .02, .11);
    butterflies.push({
      g: insect,
      wings,
      x: -14 + i % 4 * 5,
      z: 6 + Math.floor(i / 4) * 5,
      phase: i * 2.4
    });
  }
  // Sparse river reeds are instanced to keep their rendering inexpensive.
  const reeds = new THREE.InstancedMesh(new THREE.CylinderGeometry(.014, .025, .6, 4), M.leaf, 100),
    dummy = new THREE.Object3D();
  for (let i = 0; i < 100; i++) {
    const z = -40 + i * .8,
      x = riverCenter(z) + (i % 2 ? 1 : -1) * (3.05 + Math.sin(i) * .1);
    dummy.position.set(x, terrainHeight(x, z) + .27, z);
    dummy.rotation.set(.12 * Math.sin(i), 0, .15 * Math.cos(i));
    dummy.updateMatrix();
    reeds.setMatrixAt(i, dummy.matrix);
  }
  root.add(reeds);
  return {
    root,
    clouds,
    flags,
    butterflies,
    tick(dt, time, hour, quality = 'medium') {
      if (dt <= 0) return;
      const day = daytimeStrength(hour);
      clouds.visible = day > .02;
      clouds.scale.set(1, .12, 1);
      clouds.position.y = 29;
      banner.visible = false;
      cloudMaterial.opacity = .5 + day * .28;
      clouds.children.forEach((c, i) => c.position.x = -65 + i * 21 + Math.sin(time * .017 + i) * 7);
      flags.forEach((flag, i) => flag.rotation.x = Math.sin(time * 2.4 + i * .65) * .22);
      butterflies.forEach((b, i) => {
        const x = b.x + Math.sin(time * .6 + b.phase) * 1.1,
          z = b.z + Math.cos(time * .48 + b.phase) * .85;
        b.g.visible = day > .3 && (quality !== 'low' || i < 4);
        b.g.position.set(x, terrainHeight(x, z) + .8 + Math.sin(time * 1.4 + b.phase) * .2, z);
        b.g.rotation.y = time * .3 + b.phase;
        b.wings.forEach((wing, j) => wing.rotation.z = (j ? 1 : -1) * Math.sin(time * 17 + b.phase) * .9);
      });
    }
  };
}
