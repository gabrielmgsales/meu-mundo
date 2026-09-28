import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createQuarry } from '../src/game/quarry.js';
import { terrainHeight } from '../src/game/world-detail.js';

test('stone blocks the player until both foot and head space have been excavated',()=>{
  const q=createQuarry(new THREE.MeshBasicMaterial());assert.equal(q.blocked(24,-17),true);
  q.mined.add('6,0,11');q.update(q.cellIndex.get('6,0,11'));assert.equal(q.blocked(24,-17),true);
  q.mined.add('6,1,11');q.update(q.cellIndex.get('6,1,11'));assert.equal(q.blocked(24,-17),false);
  assert.equal(q.blocked(24,-18),true);assert.equal(q.blocked(24.4,-17),true);
});
test('a mouse ray hits the next stone after excavation and after reopening a cave',()=>{
  const material=new THREE.MeshBasicMaterial(),q=createQuarry(material);
  q.mesh.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(new THREE.Vector3(24,terrainHeight(24,-17)+.5,-14),new THREE.Vector3(0,0,-1));
  const first=ray.intersectObject(q.mesh)[0];assert.ok(first);const key=q.cells[first.instanceId].key;
  q.mined.add(key);q.update(first.instanceId);const next=ray.intersectObject(q.mesh)[0];assert.ok(next);assert.notEqual(next.instanceId,first.instanceId);assert.ok(next.distance>first.distance+.8);
  const restored=createQuarry(material,JSON.parse(JSON.stringify([...q.mined])));restored.mesh.updateMatrixWorld(true);
  assert.equal(ray.intersectObject(restored.mesh)[0].instanceId,next.instanceId);
});
