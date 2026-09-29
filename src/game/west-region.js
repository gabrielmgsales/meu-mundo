import { createRoadMaterial } from './road-material.js';
import * as THREE from 'three';
import { OVERLOOK, onOverlook } from './region.js';
import { terrainHeight, makeTree, batchStatic, addTrail } from './world-detail.js';
export function createWestRegion(scene, M) {
  const root = new THREE.Group();
  root.name = 'Vale e mirante do oeste';
  scene.add(root);
  const deck = new THREE.Group();
  root.add(deck);
  const lights = [];
  function box(x, y, z, w, h, d, mat = M.log) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    deck.add(m);
    return m;
  }
  for (let x = OVERLOOK.minX; x < OVERLOOK.maxX; x += .42) box(x + .2, OVERLOOK.y - .12, 0, .39, .24, 12, M.wood);
  for (const z of [-6, 6]) {
    for (let x = -201; x <= -188; x += 2.6) box(x, OVERLOOK.y + .55, z, .15, 1.3, .15);
    box(-194.5, OVERLOOK.y + 1, z, 13, .1, .1);
  }
  for (const z of [-6, -3, 0, 3, 6]) box(-201, OVERLOOK.y + .55, z, .15, 1.3, .15);
  box(-201, OVERLOOK.y + 1, 0, .1, .1, 12);
  for (const z of [-5, 5]) {
    box(-190, OVERLOOK.y + .25, z, 2, .12, .55);
    for (const x of [-190.7, -189.3]) box(x, OVERLOOK.y + .1, z, .1, .3, .4);
    box(-200, OVERLOOK.y + 1.8, z, .12, 3.6, .12);
    const lamp = box(-200, OVERLOOK.y + 3.5, z, .45, .55, .45, M.glass);
    const light = new THREE.PointLight('#ffc98a', 8, 16, 2);
    light.position.copy(lamp.position);
    root.add(light);
    lights.push(light);
  }
  let seed = 85013;
  const random = () => (seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296;
  const entries = [];
  for (let i = 0; i < 180; i++) {
    const x = -48 - random() * 160,
      z = (random() - .5) * 78;
    if (Math.abs(z) < 5 || onOverlook(x, z, 8)) continue;
    const g = makeTree(root, M, x, z, .75 + random() * .8, i % 4 === 0, random);
    batchStatic(g);
    entries.push({
      id: `west-tree:${i}`,
      g,
      label: 'Árvore',
      kind: 'tree',
      radius: .45,
      resource: {
        type: 'wood',
        x,
        z,
        cooldown: 0
      }
    });
  }
  const trail = [];
  for (let x = -40; x >= -188; x -= 2) trail.push([x, 0]);
  addTrail(root, trail, 1.5, createRoadMaterial());
  // A low-detail, kilometre-scale backdrop gives the summit a real horizon.
  const geo = new THREE.PlaneGeometry(6000, 6000, 120, 120);
  geo.rotateX(-Math.PI / 2);
  geo.translate(-200, 0, 0);
  const pos = geo.attributes.position,
    colors = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      z = pos.getZ(i),
      distance = Math.hypot((x + 40) / 1.6, z);
    const fade = THREE.MathUtils.smoothstep(distance, 180, 600);
    const hills = (Math.sin(x * .003) * Math.cos(z * .004) * 90 + Math.sin(z * .009 + x * .005) * 24 + 70) * fade - 18;
    const outside=Math.max(Math.abs(z)-910, x-1730, -1820-x);
    const blend=THREE.MathUtils.smoothstep(outside,0,220);
    pos.setY(i, THREE.MathUtils.lerp(-30,hills,blend));
    const c = new THREE.Color().setHSL(.29 + Math.sin(x * .002) * .025, .24, .37 + fade * .1);
    colors.push(c.r, c.g, c.b);
  }
  // The backdrop stays below the playable valley and continues under its edges.
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const horizon = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1
  }));
  root.add(horizon);
  for(let layer=0;layer<3;layer++) {
    const ridgeGeo=new THREE.PlaneGeometry(5200,1,140,1),rp=ridgeGeo.attributes.position;
    for(let i=0;i<rp.count;i++){
      const x=rp.getX(i),top=rp.getY(i)>0;
      const peak=110+layer*45+Math.abs(Math.sin(x*.003+layer*2))*160+Math.sin(x*.013+layer)*35;
      rp.setXYZ(i,x,top?peak:-30,-1100-layer*450);
    }
    ridgeGeo.computeVertexNormals();
    const ridge=new THREE.Mesh(ridgeGeo,new THREE.MeshBasicMaterial({color:['#667780','#83939c','#a2afb8'][layer],side:THREE.DoubleSide}));
    ridge.name='Serra distante '+layer;root.add(ridge);
  }
  batchStatic(deck);
  return {
    root,
    deck,
    entries,
    tick(hour) {
      const night = hour < 6 || hour > 18;
      for (const light of lights) light.intensity = night ? 12 : 0;
    }
  };
}
