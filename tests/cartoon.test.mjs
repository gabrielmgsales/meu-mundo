import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {decorateBuilding,createCartoonAtmosphere,dressAdventurer} from '../src/game/cartoon.js';
import {cartoonMaterial} from '../src/game/toon-material.js';
import {makeTree} from '../src/game/world-detail.js';

function materials(){return Object.fromEntries(['wood','log','roof','cream','glass','leaf','leaf2','pine','gold','dark'].map(k=>[k,cartoonMaterial('#88aa88')]));}
test('rounder trees preserve the world random sequence used by saved scenery identifiers',()=>{
  for(const [pine,expected] of [[true,1],[false,30]]){
    let calls=0;const g=makeTree(new THREE.Group(),materials(),1,2,1,pine,()=>{calls++;return .5;});
    assert.equal(calls,expected);assert.ok(!new THREE.Box3().setFromObject(g).isEmpty());
  }
});
test('house decoration and adventurer accessories remain attached to their parent',()=>{
  const g=new THREE.Group(),M=materials();decorateBuilding(g,'cabin',M);
  const window=g.getObjectByName('Ventila??o do s?t?o');assert.ok(window.position.z>1.4);
  const before=window.getWorldPosition(new THREE.Vector3());g.position.set(7,0,-4);g.updateMatrixWorld(true);
  const after=window.getWorldPosition(new THREE.Vector3());assert.ok(after.distanceTo(before.clone().add(g.position))<.0001);
  const player=new THREE.Group(),outfit=dressAdventurer(player,M);assert.equal(outfit.scarf.parent,player);
});
test('ambient detail respects pause, nighttime and the low quality setting',()=>{
  const scene=new THREE.Scene(),a=createCartoonAtmosphere(scene,materials());
  a.tick(.05,1,12,'low');assert.equal(a.butterflies.filter(b=>b.g.visible).length,4);
  const position=a.butterflies[0].g.position.clone(),angle=a.flags[0].rotation.x;
  a.tick(0,10,12);assert.deepEqual(a.butterflies[0].g.position,position);assert.equal(a.flags[0].rotation.x,angle);
  a.tick(.05,2,23);assert.equal(a.clouds.visible,false);assert.ok(a.butterflies.every(b=>!b.g.visible));
});
