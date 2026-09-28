import { foliageGeometry } from './foliage.js';
import { createPerson } from './family.js';
import * as THREE from 'three';
import { batchStatic } from './world-detail.js';
import { cartoonMaterial } from './toon-material.js';
const materials = new Map();
function mat(color) {
  if (!materials.has(color)) materials.set(color, cartoonMaterial(color));
  return materials.get(color);
}
const ballGeo = new THREE.SphereGeometry(1, 14, 10);
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
function part(g, color, x, y, z, sx, sy, sz, box = false) {
  const m = new THREE.Mesh(box ? boxGeo : ballGeo, mat(color));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}
// Shared smooth primitives keep the catalog independent of external asset downloads.
export function createAnimal(item) {
  const g = new THREE.Group(),
    c = item.color,
    f = item.family;
  g.userData.playfulDog = item.id === 'cachorro';
  g.userData.rig = [];
  const joint = (mesh, motion, side = 1, offset = 0) => {
    const pivot = new THREE.Group();
    pivot.position.copy(mesh.position);
    mesh.position.set(0, 0, 0);
    pivot.add(mesh);
    g.add(pivot);
    if (motion === 'leg') {
      pivot.position.y += mesh.scale.y;
      mesh.position.y -= mesh.scale.y;
    }
    pivot.userData = {
      motion,
      side,
      offset
    };
    g.userData.rig.push(pivot);
    return pivot;
  };
  const b = (x, y, z, sx, sy, sz, color = c) => part(g, color, x, y, z, sx, sy, sz);
  const eye = (x, y, z) => {
    
    b(x, y, z, .023, .021, .013, '#22231f');
    
  };
  const birds = ['hen', 'duck', 'goose', 'peacock', 'bird', 'toucan', 'owl', 'raptor', 'wader', 'ostrich', 'penguin'];
  if (f === 'fish') {
    b(0, .25, 0, .2, .28, .6);
    const tail = b(0, .25, -.65, .035, .33, .25);
    tail.rotation.x = .4;
    joint(tail, 'tail');
    b(0, .52, -.1, .025, .17, .2);
    eye(.16, .34, .32);
    eye(-.16, .34, .32);
  } else if (f === 'snake') {
    const points = Array.from({
      length: 16
    }, (_, i) => new THREE.Vector3(Math.sin(i * .65) * .24, .15, i * .13 - .9));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 40, .12, 8, false), mat(c)));
    b(0, .2, 1.13, .18, .13, .24);
    eye(.13, .25, 1.22);
    eye(-.13, .25, 1.22);
  } else if (birds.includes(f) || f === 'bat') {
    const long = ['wader', 'ostrich'].includes(f),
      tall = long ? .8 : .22;
    b(0, tall + .45, 0, .35, .42, .43);
    b(0, tall + .88, .22, .24, .25, .25);
    if (long || f === 'goose') b(0, tall + .78, .2, .11, .43, .12);
    for (const s of [-1, 1]) {
      const wing = joint(b(s * .32, tall + .48, -.06, .38, .075, .32, f === 'bat' ? '#493d37' : c), 'wing', s);
      wing.children[0].position.x = s * .25;
      joint(b(s * .13, tall / 2, 0, .035, tall / 2, .035, '#ac8450'), 'leg', s, s > 0 ? 0 : Math.PI);
      b(s * .13, .04, .09, .08, .045, .17, '#bd954f');
      eye(s * .15, tall + .95, .39);
    }
    b(0, tall + .86, .51, f === 'toucan' ? .15 : .09, .08, f === 'toucan' ? .38 : .16, '#ddb14e');
    if (f === 'hen') b(0, tall + 1.1, .24, .06, .12, .17, '#ba4f43');
    if (f === 'peacock') for (let i = 0; i < 9; i++) {
      const a = i / 8 * Math.PI;
      b(Math.cos(a) * .75, tall + .25 + Math.sin(a) * .8, -.4, .16, .4, .05, i % 2 ? '#527f54' : '#3b8490');
    }
    if (f === 'penguin') b(0, tall + .43, .29, .25, .34, .15, '#efe9d8');
  } else {
    const flat = ['crocodile', 'lizard', 'turtle', 'frog', 'armadillo'].includes(f),
      big = f === 'elephant';
    const y = flat ? .25 : .75,
      bodyZ = f === 'crocodile' ? 1 : .66;
    b(0, y, 0, big ? .64 : .4, flat ? .22 : .42, bodyZ);
    const longNeck = ['giraffe', 'horse', 'donkey', 'zebra', 'deer'].includes(f),
      headY = f === 'giraffe' ? 2.1 : longNeck ? 1.3 : y + .24;
    if (longNeck) b(0, (y + headY) / 2, .5, .2, (headY - y) / 2 + .2, .22);
    b(0, headY, .65, .26, .27, f === 'anteater' ? .55 : .35);
    b(0, headY - .08, .9, .21, .15, f === 'crocodile' ? .7 : .24);
    for (const s of [-1, 1]) {
      eye(s * .2, headY + .07, .87);
      if (!flat) b(s * .2, headY + .24, .6, big ? .32 : .12, ['rabbit', 'donkey'].includes(f) ? .37 : .18, big ? .15 : .09);
      for (const z of [-.4, .4]) joint(b(s * (big ? .42 : .28), flat ? .12 : .34, z, flat ? .14 : big ? .18 : .085, flat ? .12 : .34, .1), 'leg', s, s * z > 0 ? 0 : Math.PI);
    }
    const tail = b(0, y, -bodyZ - .25, .09, .09, flat ? .65 : .3);
    tail.rotation.x = flat ? 0 : -.5;
    joint(tail, 'tail');
    if (['cow', 'bull', 'goat', 'deer'].includes(f)) for (const s of [-1, 1]) {
      const horn = b(s * .25, headY + .33, .6, .05, .25, .05, '#d6cbb0');
      horn.rotation.z = -s * .5;
    }
    if (f === 'cow' || f === 'jaguar' || f === 'giraffe') for (let i = 0; i < 9; i++) b((i % 2 ? 1 : -1) * .36, y + .12, Math.sin(i * 2) * .43, .055, .13, .16, f === 'cow' ? '#514941' : '#85623d');
    if (f === 'zebra' || f === 'tiger') for (let i = 0; i < 7; i++) b(0, y + .03, -.5 + i * .16, .413, .425, .034, '#3e3b32');
    if (f === 'lion') b(0, headY, .53, .4, .43, .24, '#88613a');
    if (f === 'elephant') {
      const trunk = b(0, headY - .4, 1, .12, .5, .13);
      trunk.rotation.x = -.25;
    }
    if (f === 'turtle' || f === 'armadillo') b(0, y + .12, -.05, .44, .33, .6, f === 'turtle' ? '#596540' : '#776c5c');
    if (f === 'sheep') b(0, y + .03, -.08, .42, .38, .63, '#c6c2b5');
    if (f === 'rabbit') b(0, y - .15, -.68, .18, .18, .18, '#f1e9d7');
    const head = new THREE.Group();
    head.position.set(0, headY - .15, .4);
    g.add(head);
    for (const child of [...g.children]) if (child.isMesh && child.position.z > .35 && child.position.y > headY - .3) {
      child.position.sub(head.position);
      head.add(child);
    }
    head.userData.motion = 'head';
    g.userData.rig.push(head);
  }
  g.scale.setScalar(item.size);
  return g;
}
export function createTree(item) {
  const g = new THREE.Group();
  const c = item.color;
  let seed=0;for(const ch of String(item.visualSeed ?? item.id)) seed=(Math.imul(seed,31)+ch.charCodeAt(0))>>>0;
  const variation=(seed%997)/997, width=1.15+((seed>>>5)%101)/300;
  const leafMaterial=mat(c);leafMaterial.vertexColors=true;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.075,.19,3.8,9),mat('#655c4d'));
  trunk.position.y=1.9;g.add(trunk);
  for(let i=0;i<9;i++) {
    const a=i*2.4, pine=item.family==='pine', palm=item.family==='palm';
    const y=pine?1.6+i*.3:3.2+Math.sin(i)*.6;
    const reach=pine?.6:.95;
    const tip=new THREE.Vector3(Math.cos(a)*reach,y,Math.sin(a)*reach);
    const base=new THREE.Vector3(0,y-.7,0), delta=tip.clone().sub(base);
    const branch=new THREE.Mesh(new THREE.CylinderGeometry(.015,.06,delta.length(),6),mat('#655c4d'));
    branch.position.copy(base).lerp(tip,.5);branch.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());g.add(branch);
    const leaves=new THREE.Mesh(foliageGeometry(pine?1.1:1.5,pine,variation),leafMaterial);
    leaves.position.copy(tip);leaves.rotation.y=a;
    if(palm)leaves.scale.set(1.7,.2,.5);
    if(item.family==='willow')leaves.scale.y=1.6;
    g.add(leaves);
  }
  if (item.family === 'fruit') for (let i = 0; i < 12; i++) {
    const a = i * 2.4;
    part(g, item.id === 'laranjeira' ? '#d89d40' : '#c16f40', Math.cos(a) * 1.35, 2.6 + Math.sin(i) * .45, Math.sin(a) * 1.35, .12, .12, .12);
  }
  g.scale.set(item.size*width,item.size*(.85+variation*.6),item.size*width);
  return g;
}
export function createFurniture(item) {
  const g = new THREE.Group(),
    id = item.id,
    wood = '#977653',
    cloth = '#7f9980';
  const p = (x, y, z, w, h, d, c = wood) => part(g, c, x, y, z, w, h, d, true);
  const legs = (w, d, h = .65) => {
    for (const x of [-w, w]) for (const z of [-d, d]) p(x, h / 2, z, .09, h, .09);
  };
  if (['cadeira', 'poltrona', 'sofa', 'banco'].includes(id)) {
    const w = id === 'sofa' ? 2.2 : id === 'banco' ? 1.8 : .8;
    legs(w / 2 - .1, .3, .48);
    p(0, .52, 0, w, .15, .85);
    if (id !== 'banco') p(0, .95, -.38, w, .8, .13);
    if (['sofa', 'poltrona'].includes(id)) {
      p(0, .66, 0, w, .22, .8, cloth);
      for (const s of [-1, 1]) p(s * (w / 2), .83, 0, .18, .4, .9, cloth);
      p(0, 1, -.32, w, .65, .22, cloth);
    }
  } else if (['mesa', 'mesinha', 'escrivaninha'].includes(id)) {
    const h = id === 'mesinha' ? .5 : 1;
    legs(.7, .4, h);
    p(0, h, 0, 1.7, .13, 1.1);
  } else if (id.startsWith('cama')) {
    const w = id === 'cama-casal' ? 1.8 : 1;
    legs(w / 2 - .1, .85, .4);
    p(0, .4, 0, w, .22, 2);
    p(0, .62, 0, w, .25, 2, '#ded3b9');
    p(0, .78, -.65, w * .8, .14, .4, '#f0e4cc');
    p(0, .77, .3, w, .07, 1.3, cloth);
    p(0, .8, -1, w, 1, .12);
  } else if (['armario', 'comoda', 'bau', 'estante'].includes(id)) {
    const h = id === 'armario' ? 2.1 : id === 'estante' ? 1.8 : .85;
    p(0, h / 2, -.38, 1.3, h, .12);
    for (const s of [-1, 1]) p(s * .62, h / 2, 0, .1, h, .85);
    for (let i = 0; i < 4; i++) p(0, i * h / 3, 0, 1.3, .1, .85);
    if (id !== 'estante') p(0, h / 2, .4, 1.2, h, .08);else for (let i = 0; i < 12; i++) p(-.46 + i % 4 * .25, .22 + Math.floor(i / 4) * .6, .1, .16, .35, .35, ['#aa7458', '#637c7c', '#b5a477'][i % 3]);
  } else if (id === 'tapete') {
    const rug = part(g, '#b98262', 0, .025, 0, 1.2, .025, .8);
    rug.scale.x = 1.5;
  } else if (id === 'vaso') {
    part(g, '#b57f5e', 0, .28, 0, .25, .3, .25);
    for (let i = 0; i < 5; i++) {
      const a = i * 2.4;
      part(g, '#64844c', Math.sin(a) * .14, .6, Math.cos(a) * .14, .13, .35, .13);
      part(g, '#dfbe6b', Math.sin(a) * .2, .85, Math.cos(a) * .2, .13, .12, .13);
    }
  } else if (id === 'quadro') {
    legs(.35, .2, 1);
    p(0, 1.15, 0, 1, .8, .12);
    p(0, 1.15, .07, .83, .63, .02, '#88a69b');
  } else if (id === 'barril') {
    part(g, wood, 0, .5, 0, .45, .55, .45);
  } else if (id === 'fogueira') {
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5;
      part(g, '#797c71', Math.sin(a) * .67, .14, Math.cos(a) * .67, .19, .14, .17);
    }
    for (const angle of [-.7, .7]) {
      const log = p(0, .2, 0, 1.05, .19, .22, '#61402b');
      log.rotation.y = angle;
    }
    const flames = new THREE.Group();
    g.add(flames);
    for (let i = 0; i < 5; i++) {
      const a = i * 2.4,
        flame = part(flames, '#ffc266', Math.sin(a) * .19, .48, Math.cos(a) * .19, .16, .32 + i % 2 * .12, .16);
      flame.material = new THREE.MeshStandardMaterial({
        color: i % 2 ? '#ffb13f' : '#ffe1a0',
        emissive: '#ff8d28',
        emissiveIntensity: 3,
        transparent: true,
        opacity: .85,
        depthWrite: false
      });
      flame.userData.baseHeight = flame.scale.y;
    }
    const light = new THREE.PointLight('#ffbc70', 85, 22, 1.6);
    light.position.set(0, 1.1, 0);
    g.add(light);
    g.userData.fire = {
      flames,
      light
    };
  } else {
    p(0, .65, 0, .09, 1.3, .09);
    const flame = part(g, '#f3b650', 0, 1.35, 0, .12, .23, .12);
    flame.material = new THREE.MeshStandardMaterial({
      color: '#ffd88a',
      emissive: '#ffb345',
      emissiveIntensity: 2
    });
    if (id === 'luminaria') part(g, '#e8d6ab', 0, 1.45, 0, .35, .3, .35);
    const light = new THREE.PointLight('#ffcf80', 3, 7, 2);
    light.position.y = 1.5;
    g.add(light);
  }
  return g;
}
export function createItem(item) {
  const g = item.kind === 'family' ? createPerson(item) : item.kind === 'animal' ? createAnimal(item) : item.kind === 'tree' ? createTree(item) : createFurniture(item);
  // Clone shared geometries before merging: batchStatic disposes its inputs.
  g.traverse(o => {
    if (o.isMesh) o.geometry = o.geometry.clone();
  });
  batchStatic(g, [...(g.userData.rig || []), ...(g.userData.fire ? [g.userData.fire.flames] : [])]);
  return g;
}
export function animateCampfire(g, time) {
  const fire = g.userData.fire;
  if (!fire) return;
  fire.light.intensity = 85 * (1 + Math.sin(time * 7) * .055 + Math.sin(time * 11.7) * .025);
  fire.flames.children.forEach((flame, i) => {
    flame.scale.y = flame.userData.baseHeight * (1 + Math.sin(time * 8 + i * 2) * .18);
    flame.rotation.z = Math.sin(time * 5 + i) * .12;
  });
}
