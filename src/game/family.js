import * as THREE from 'three';
import { cartoonMaterial } from './toon-material.js';
export const familyCatalog = [{
  id: 'esposa',
  label: 'Esposa',
  kind: 'family',
  category: 'Família',
  keywords: 'mulher companheira formar familia',
  gender: 'female',
  adult: true
}, {
  id: 'filho',
  label: 'Filho (menino)',
  kind: 'family',
  category: 'Família',
  keywords: 'crianca criança masculino menino filhos',
  gender: 'male',
  adult: false
}, {
  id: 'filha',
  label: 'Filha (menina)',
  kind: 'family',
  category: 'Família',
  keywords: 'crianca criança feminino menina filhos',
  gender: 'female',
  adult: false
}];
export function createPerson(item) {
  const g = new THREE.Group();
  g.userData.rig = [];
  const skin = cartoonMaterial('#ddb18e'),
    hair = cartoonMaterial('#694c3c'),
    cloth = cartoonMaterial(item.adult ? '#cc867c' : item.gender === 'male' ? '#7bafaa' : '#b299d0'),
    pants = cartoonMaterial('#54697a'),
    shoe = cartoonMaterial('#564638'),
    white = cartoonMaterial('#fff5df'),
    dark = cartoonMaterial('#273c44');
  function mesh(geo, mat, parent, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  const ball = (parent, mat, x, y, z, sx, sy, sz) => {
    const m = mesh(new THREE.SphereGeometry(1, 12, 10), mat, parent, x, y, z);
    m.scale.set(sx, sy, sz);
    return m;
  };
  mesh(new THREE.CapsuleGeometry(.23, .38, 4, 10), cloth, g, 0, 1.02, 0);
  ball(g, skin, 0, 1.62, 0, .145, .205, .15);
  ball(g, hair, 0, 1.79, -.045, .15, .11, .145);
  if (item.gender === 'female') {
    ball(g, hair, 0, 1.58, -.17, .15, .21, .08);
    ball(g, hair, .14, 1.54, -.1, .085, .25, .1);
  }
  for (const side of [-1, 1]) {
    ball(g, white, side * .06, 1.66, .137, .021, .011, .008);
    ball(g, dark, side * .085, 1.66, .144, .009, .009, .006);
    ball(g, skin, side * .15, 1.62, 0, .023, .045, .023);
    for (const arm of [false, true]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (arm ? .32 : .13), arm ? 1.29 : .7, 0);
      g.add(pivot);
      pivot.userData = {
        motion: 'leg',
        arm,
        offset: side * Math.PI / 2 + (arm ? Math.PI : 0)
      };
      g.userData.rig.push(pivot);
      mesh(new THREE.CapsuleGeometry(arm ? .065 : .085, arm ? .27 : .3, 3, 8), arm ? cloth : pants, pivot, 0, -.23, 0);
      ball(pivot, arm ? skin : shoe, 0, -.46, arm ? 0 : .05, arm ? .075 : .105, .08, arm ? .08 : .16);
    }
  }
  ball(g, skin, 0, 1.60, .145, .023, .035, .035);
  const smile = mesh(new THREE.BoxGeometry(.045,.006,.005), dark, g, 0, 1.55, .14);
  smile.rotation.z = Math.PI;
  if (!item.adult) g.scale.setScalar(.62);
  return g;
}
