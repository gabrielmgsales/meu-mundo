import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WORLD,OVERLOOK,onOverlook,overlookRailing } from '../src/game/region.js';
import { terrainHeight } from '../src/game/world-detail.js';
import { skyPalette,createPanoramicSky } from '../src/game/sky.js';
import { searchCatalog } from '../src/game/search.js';
import { allItems,familyCatalog } from '../src/game/catalogs.js';
import { readCreative,addLakeBrush } from '../src/game/creative-state.js';
import { createItem } from '../src/game/models.js';

test('western expansion doubles the previous playable area and has a continuous climb',()=>{
  assert.equal((WORLD.maxX-WORLD.minX)*(WORLD.maxZ-WORLD.minZ),200*344*86);
  let previous=terrainHeight(-75,0);
  for(let x=-75.1;x>=-194;x-=.1){const next=terrainHeight(x,0);assert.ok(Math.abs(next-previous)<.12);previous=next;}
  assert.ok(previous>70);assert.ok(Math.abs(OVERLOOK.y-previous)<.2);
  assert.ok(onOverlook(-194,0));assert.ok(overlookRailing(-201,0));assert.equal(overlookRailing(-188,0),false);
});
test('rain desaturates the daytime sky and hides celestial details',()=>{
  const saturation=c=>c.getHSL({}).s;
  assert.ok(saturation(skyPalette(12,1).top)<saturation(skyPalette(12,0).top));
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2();const tick=createPanoramicSky(scene);
  tick(21,0,33.6,new THREE.Vector3(-194,74,0));
  assert.ok(scene.getObjectByName('Lua').visible);assert.ok(scene.getObjectByName('Estrela cadente').visible);
  assert.ok(scene.getObjectByName('Estrelas').material.opacity>.5);
  tick(21,1,33.6,new THREE.Vector3(-194,74,0));assert.equal(scene.getObjectByName('Lua').visible,false);assert.equal(scene.getObjectByName('Estrela cadente').visible,false);
  tick(12,0,33.6);assert.equal(scene.getObjectByName('Lua').visible,false);
});
test('global search handles accents, categories, family gender and multiple words',()=>{
  assert.ok(searchCatalog(allItems,'ARVORE').length>=12);
  assert.ok(searchCatalog(allItems,'sofa').some(i=>i.id==='sofa'));
  assert.deepEqual(searchCatalog(allItems,'criança feminino').map(i=>i.id),['filha']);
  assert.ok(searchCatalog(allItems,'cama casal').some(i=>i.id==='cama-casal'));
  assert.equal(searchCatalog(allItems,'inexistente').length,0);
});
test('family records are not truncated by the 500 scenery item limit and retain gender',()=>{
  const items=Array.from({length:650},(_,i)=>({id:`child-${i}`,kind:'family',type:i%2?'filha':'filho',x:-190,z:1,follow:true}));
  const restored=readCreative(JSON.parse(JSON.stringify({items})));
  assert.equal(restored.items.length,650);assert.equal(restored.items[649].type,'filha');assert.ok(restored.items[649].follow);
  const lakes=addLakeBrush([],-175,22,1.8,terrainHeight);assert.ok(lakes[0].level>8);assert.equal(readCreative({lakes}).lakes.length,lakes.length);
});
test('family children remain smaller than adults and their joints survive batching',()=>{
  const models=familyCatalog.map(createItem),heights=models.map(g=>{g.updateMatrixWorld(true);return new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3()).y;});
  assert.ok(heights[1]<heights[0]*.7&&heights[2]<heights[0]*.7);
  for(const g of models){assert.equal(g.userData.rig.length,4);for(const joint of g.userData.rig)assert.ok(joint.parent===g&&joint.children.length>0);}
});
