import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createHeadlights} from '../src/game/headlights.js';
test('headlights illuminate at night, fade at dawn and follow vehicle heading and grade',()=>{
 const root=new THREE.Group(),material=new THREE.MeshStandardMaterial(),system=createHeadlights(root,material);
 system.update(0);for(const light of system.lights){assert.equal(light.intensity,1100);assert.ok(light.visible&&light.castShadow);}
 system.update(6);assert.ok(system.lights[0].intensity>0&&system.lights[0].intensity<1100);
 system.update(12);assert.equal(system.lights[0].intensity,0);assert.equal(system.lights[0].visible,false);
 system.update(20);assert.equal(system.lights[0].intensity,1100);assert.ok(material.emissiveIntensity>2);
 root.position.set(100,3,70);root.rotation.set(-.2,1,0);root.updateMatrixWorld(true);
 const light=system.lights[0];const direction=light.target.getWorldPosition(new THREE.Vector3()).sub(light.getWorldPosition(new THREE.Vector3())).normalize();
 const expected=new THREE.Vector3(0,.15-1.34,34-2.62).normalize().applyQuaternion(root.quaternion);
 assert.ok(direction.dot(expected)>.99999);
});
