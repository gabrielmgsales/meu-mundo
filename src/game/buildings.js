import * as THREE from 'three';
import { decorateBuilding } from './cartoon.js';
import { LAKE } from './region.js';
export const catalog = {
  cabin: {
    label: 'Cabana',
    icon: '⌂',
    wood: 12,
    stone: 8,
    radius: 2.6
  },
  field: {
    label: 'Horta',
    icon: '♧',
    wood: 8,
    stone: 3,
    radius: 2
  },
  fence: {
    label: 'Cerca',
    icon: '☷',
    wood: 4,
    stone: 0,
    radius: 1.3
  },
  well: {
    label: 'Poço',
    icon: '♜',
    wood: 6,
    stone: 8,
    radius: 1.4
  },
  barn: {
    label: 'Celeiro',
    icon: '⌂',
    wood: 16,
    stone: 10,
    radius: 3
  },
  waterfall: {
    label: 'Cachoeira',
    icon: '⇩',
    wood: 0,
    stone: 0,
    radius: 2.2
  },
  mountain: {
    label: 'Montanha',
    icon: '⛰',
    wood: 0,
    stone: 0,
    radius: 4.5
  },
  deck: {
    label: 'Deck',
    icon: '◫',
    wood: 8,
    stone: 4,
    radius: 1.8
  },
  boat: {
    label: 'Barco',
    icon: '⛵',
    wood: 0,
    stone: 0,
    radius: 2.2
  }
};
// Geometry only: the caller owns registration, persistence and batching.
export function createBuildingFactory({
  scene,
  M,
  mat,
  mesh,
  box,
  sphere,
  cyl,
  height,
  crops
}) {
  const lake = {
    height: LAKE.level
  };
  function roof(g, w, d, h, y) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0);
    s.lineTo(0, h);
    s.lineTo(w / 2, 0);
    s.closePath();
    mesh(new THREE.ExtrudeGeometry(s, {
      depth: d,
      bevelEnabled: false
    }), M.roof, g, 0, y, -d / 2);
    for (let side of [-1, 1]) for (let i = 0; i < 6; i++) box(g, M.edge, side * i / 6 * w / 2, y + h * (1 - i / 6) + .025, 0, .045, .05, d + .06);
  }
  function building(type, x, z) {
    const g = new THREE.Group();
    g.position.set(x, height(x, z), z);
    scene.add(g);
    if (type === 'cabin' || type === 'barn') {
      const w = type === 'barn' ? 4.5 : 3.3,
        d = type === 'barn' ? 3.6 : 2.8;
      box(g, M.stone, 0, .18, 0, w + .35, .36, d + .35);
      box(g, type === 'barn' ? M.coat : M.plaster, 0, 1.5, 0, w, 2.6, d);
      for (let a of [-1, 1]) for (let b of [-1, 1]) box(g, M.wood, a * (w / 2 - .08), 1.55, b * (d / 2 + .02), .17, 2.7, .18);
      for (let i = 0; i < 7; i++) box(g, M.log, 0, .5 + i * .32, d / 2 + .02, w, .035, .055);
      roof(g, w + .7, d + .7, 1.05, 2.85);
      box(g, M.wood, 0, 1, d / 2 + .06, .8, 1.9, .12);
      sphere(g, M.gold, .25, 1, d / 2 + .14, .055);
      for (let a of [-1, 1]) {
        box(g, M.edge, a * w * .32, 1.65, d / 2 + .06, .75, .9, .12);
        box(g, M.glass, a * w * .32, 1.65, d / 2 + .13, .57, .7, .04);
        box(g, M.wood, a * w * .32, 1.65, d / 2 + .17, .045, .8, .045);
        box(g, M.wood, a * w * .32, 1.65, d / 2 + .17, .65, .045, .045);
      }
      box(g, M.stone, .8, 3.7, -.5, .55, 2, .55);
      box(g, M.stone, 0, .15, d / 2 + .55, 1.25, .25, .8);
      box(g, M.roof, 0, 2.5, d / 2 + .55, 1.5, .12, 1.1).rotation.x = .15;
      for (let a of [-1, 1]) box(g, M.wood, a * .65, 1.2, d / 2 + 1, .1, 2.4, .1);
    } else if (type === 'fence') {
      for (let i = -1; i <= 1; i++) box(g, M.log, i, .65, 0, .16, 1.3, .16);
      for (let y of [.45, .95]) box(g, M.wood, 0, y, 0, 2.4, .14, .1);
    } else if (type === 'well') {
      cyl(g, M.stone, 0, .5, 0, .9, .95, 1, 12);
      cyl(g, M.dark, 0, 1.01, 0, .67, .67, .02, 16);
      cyl(g, M.water, 0, 1.025, 0, .55, .55, .025, 16);
      for (let a of [-1, 1]) box(g, M.wood, a * .83, 1.5, 0, .13, 2.4, .13);
      roof(g, 2.3, 1.8, .65, 2.6);
      cyl(g, M.log, 0, 2, 0, .09, .09, 1.9).rotation.z = Math.PI / 2;
      box(g, M.gold, 0, 1.6, 0, .025, .9, .025);
    } else if (type === 'deck') {
      const deckY = .24;
      box(g, M.wood, 0, deckY, 0, 3.8, .18, 2.7);
      for (let i = -1; i <= 1; i += 2) {
        box(g, M.log, i * 1.55, .44, 0, .12, .42, 2.45);
        box(g, M.log, 0, .44, i * 1.15, 3.45, .42, .12);
      }
      for (let i = -1; i <= 1; i += 2) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(.11, .12, 1.4, 10), M.log);
        post.position.set(i * 1.65, 0.7, 0);
        g.add(post);
        const board = new THREE.Mesh(new THREE.BoxGeometry(.1, .85, .32), M.wood);
        board.position.set(i * 1.55, 0.85, 0);
        g.add(board);
      }
      box(g, M.water, 0, .14, 0, 4.2, .04, 3.1);
      const mooring = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 1.6, 12), M.log);
      mooring.rotation.z = Math.PI / 2;
      mooring.position.set(-1.45, .94, 0);
      g.add(mooring);
      const rope = new THREE.Mesh(new THREE.BoxGeometry(1.9, .03, .03), M.dark);
      rope.position.set(-.2, .95, 0);
      g.add(rope);
    } else if (type === 'waterfall') {
      g.position.set(x, lake.height + 0.1, z);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2.2, 7.2, 1.7), new THREE.MeshStandardMaterial({
        color: '#7fd6f9',
        transparent: true,
        opacity: .76,
        roughness: .22,
        emissive: '#6bc8f0',
        emissiveIntensity: .18
      }));
      wall.position.y = 3.3;
      g.add(wall);
      const fall = new THREE.Mesh(new THREE.BoxGeometry(1.8, 5.4, 1.2), new THREE.MeshStandardMaterial({
        color: '#dff9ff',
        transparent: true,
        opacity: .6,
        roughness: .1
      }));
      fall.position.y = 2.5;
      g.add(fall);
      const splash = new THREE.Mesh(new THREE.SphereGeometry(1.6, 18, 12), new THREE.MeshStandardMaterial({
        color: '#dff7ff',
        transparent: true,
        opacity: .5,
        roughness: .15
      }));
      splash.position.set(0, -0.9, 0);
      g.add(splash);
    } else if (type === 'mountain') {
      g.position.set(x, height(x, z), z);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 4.2, 3.2, 12), mat('#6d7a73'));
      base.position.y = 1.5;
      g.add(base);
      const peak = new THREE.Mesh(new THREE.ConeGeometry(5.2, 11, 18), mat('#7e8588'));
      peak.position.y = 9.5;
      g.add(peak);
      const snow = new THREE.Mesh(new THREE.ConeGeometry(2.2, 4.2, 12), new THREE.MeshStandardMaterial({
        color: '#edf3ff',
        roughness: .45,
        metalness: .05
      }));
      snow.position.y = 12.8;
      g.add(snow);
    } else {
      box(g, M.soil, 0, .08, 0, 2.7, .17, 2.7);
      for (let a of [-1, 1]) {
        box(g, M.log, a * 1.4, .18, 0, .13, .26, 2.95);
        box(g, M.log, 0, .18, a * 1.4, 2.95, .26, .13);
      }
      const plants = new THREE.Group();
      g.add(plants);
      for (let i = 0; i < 25; i++) {
        const x = i % 5 * .48 - .96,
          z = Math.floor(i / 5) * .48 - .96;
        cyl(plants, M.leaf, x, .45, z, .035, .04, .75, 5);
        sphere(plants, M.gold, x, .88, z, .12, 0).scale.y = 2;
      }
      crops.push({
        g,
        plants,
        key: `${x},${z}`,
        readyAt: 0
      });
    }
    decorateBuilding(g, type, M);
    return g;
  }
  return building;
}
