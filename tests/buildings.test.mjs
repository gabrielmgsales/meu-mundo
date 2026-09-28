import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { catalog, createBuildingFactory } from '../src/game/buildings.js';
import { LAKE } from '../src/game/region.js';

test('building models retain placement, finite geometry and harvestable crops', () => {
  const scene = new THREE.Scene();
  const crops = [];
  const material = new THREE.MeshStandardMaterial();
  const M = new Proxy({}, { get: () => material });
  const mesh = (geometry, material, parent, x = 0, y = 0, z = 0) => {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  };
  const build = createBuildingFactory({
    scene, M, crops, height: () => 7, mat: () => material, mesh,
    box: (p, m, x, y, z, w, h, d) => mesh(new THREE.BoxGeometry(w, h, d), m, p, x, y, z),
    sphere: (p, m, x, y, z, r, detail = 1) => mesh(new THREE.IcosahedronGeometry(r, detail), m, p, x, y, z),
    cyl: (p, m, x, y, z, a, b, h, n = 8) => mesh(new THREE.CylinderGeometry(a, b, h, n), m, p, x, y, z),
  });
  for (const type of Object.keys(catalog).filter(type => type !== 'boat')) {
    const model = build(type, 2.5, -3.25);
    assert.equal(model.parent, scene);
    assert.deepEqual(model.position.toArray(), [2.5, type === 'waterfall' ? LAKE.level + 0.1 : 7, -3.25]);
    const bounds = new THREE.Box3().setFromObject(model);
    assert.ok(!bounds.isEmpty());
    assert.ok([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite));
  }
  assert.equal(crops.length, 1);
  assert.equal(crops[0].key, '2.5,-3.25');
  assert.equal(crops[0].plants.parent, crops[0].g);
  assert.equal(crops[0].readyAt, 0);
});
