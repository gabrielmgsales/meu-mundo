import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {animals,trees,furniture,allItems,getFurnitureAction} from '../src/game/catalogs.js';
import {createItem} from '../src/game/models.js';
import {readCreative,addLakeBrush} from '../src/game/creative-state.js';
test('catalog contains exactly the requested 58 animals including wolf',()=>{
  assert.equal(animals.length,58);assert.equal(new Set(animals.map(a=>a.id)).size,58);
  for(const id of ['peixes','galinha','porco','passaro','vaca','boi','cachorro','jacare','lobo'])assert.ok(animals.some(a=>a.id===id));assert.equal(trees.length,12);assert.equal(furniture.length,20);
});
test('all catalog models have finite geometry and nonempty world bounds',()=>{
  for(const item of allItems){const model=createItem(item);model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model);assert.ok(!bounds.isEmpty(),item.id);
    model.traverse(o=>{if(o.isMesh){assert.ok(o.geometry.attributes.position.count>0,item.id);for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value),item.id);}});
    assert.ok(bounds.max.y>bounds.min.y,item.id);
  }
});
test('placement models retain exact coordinates after raycasting merged parts',()=>{
  const g=createItem(animals.find(a=>a.id==='vaca'));g.position.set(3.27,1,-5.64);g.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(new THREE.Vector3(3.27,10,-5.64),new THREE.Vector3(0,-1,0));assert.ok(ray.intersectObject(g,true).length);assert.equal(g.position.x,3.27);assert.equal(g.position.z,-5.64);
});
test('seat and bed furniture expose the right interaction action',()=>{
  assert.deepEqual(getFurnitureAction({id:'poltrona',kind:'furniture'}),{type:'sit',label:'Sentar'});
  assert.deepEqual(getFurnitureAction({id:'sofa',kind:'furniture'}),{type:'sit',label:'Sentar'});
  assert.deepEqual(getFurnitureAction({id:'cama',kind:'furniture'}),{type:'lie',label:'Deitar'});
  assert.equal(getFurnitureAction({id:'mesa',kind:'furniture'}),null);
});
test('separate pools merge at a shared level without duplicating water cells',()=>{
  let lakes=addLakeBrush([],0,0,1.8,()=>2);lakes=addLakeBrush(lakes,5,0,1.8,()=>1);
  assert.equal(new Set(lakes.map(p=>p.level)).size,2);lakes=addLakeBrush(lakes,2.5,0,1.8,()=>3);
  assert.equal(new Set(lakes.map(p=>p.level)).size,1);assert.equal(lakes[0].level,1.04);assert.equal(new Set(lakes.map(p=>`${p.x},${p.z}`)).size,lakes.length);
});
test('creative edits, camera, excavation and water survive JSON round trip',()=>{
  const raw={items:[{id:'wolf-1',kind:'animal',type:'lobo',x:24,z:-18,rotation:1.2}],base:{'tree:0:0':{x:1,z:2,deleted:true}},mined:['0,0,0','0,1,0','15,7,11'],lakes:[{x:-10,z:5,level:.8}],biome:'outono',firstPerson:true};
  assert.deepEqual(readCreative(JSON.parse(JSON.stringify(raw))),raw);
});
test('invalid and duplicate records cannot enter scene state',()=>{
  const state=readCreative({items:[{id:'x',kind:'animal',type:'lobo',x:1,z:2},{id:'x',kind:'animal',type:'lobo',x:3,z:4},{id:'y',kind:'animal',type:'unknown',x:0,z:0}],mined:['15,7,11','16,0,0','0,8,0','0,0,12','x','-1,0,0'],lakes:[{x:Infinity,z:0,level:0}],biome:'invalid'});
  assert.equal(state.items.length,1);assert.deepEqual(state.mined,['15,7,11']);assert.deepEqual(state.lakes,[]);assert.equal(state.biome,'vale');
});
