import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WORLD,LAKE,DOCK,FALL,inWorld,inLake,onDock,canSail,moveBoat,readBoat } from '../src/game/region.js';
import { terrainHeight } from '../src/game/world-detail.js';
import { readProgress } from '../src/game/rules.js';
import { readCreative,addLakeBrush } from '../src/game/creative-state.js';
import { createBoating } from '../src/game/boating.js';
import { createLakeRegion } from '../src/game/lake-region.js';

const materials=()=>Object.fromEntries(['wood','log','cream','leaf','leaf2','pine','stone','soil','dark','water'].map(k=>[k,new THREE.MeshStandardMaterial({color:'#91a697'})]));

test('playable area includes the doubled western valley; lake has a bed and connects to the waterfall',()=>{
  assert.equal((WORLD.maxX-WORLD.minX)*(WORLD.maxZ-WORLD.minZ),200*344*86);
  assert.ok(inWorld(120,30));assert.ok(inWorld(640,200));assert.ok(!inWorld(1678,0));assert.ok(!inWorld(-1764,0));
  assert.ok(inLake(FALL.x,FALL.z));assert.ok(terrainHeight(LAKE.x,LAKE.z)<LAKE.level-2);
  assert.ok(!inLake(-3,3));assert.ok(onDock(DOCK.exit.x,DOCK.exit.z));
  assert.ok(Math.abs(terrainHeight(52,10)-DOCK.y)<.4);
});
test('new-region buildings, animals, lake brushes and boat survive save validation',()=>{
  const boat={...DOCK.berth,heading:0,occupied:true,docked:false};
  const save={version:3,position:{x:boat.x,z:boat.z},buildings:[{type:'cabin',x:113,z:30}],boat};
  const restored=readProgress(JSON.parse(JSON.stringify(save)),{cabin:{}});
  assert.deepEqual(restored.boat,boat);assert.equal(restored.position.x,boat.x);assert.equal(restored.buildings.length,1);
  const data=readCreative({items:[{id:'dog',kind:'animal',type:'cachorro',x:115,z:25}],lakes:addLakeBrush([],115,25)});
  assert.equal(data.items.length,1);assert.ok(data.lakes.length>0);
  assert.equal(readBoat({...boat,x:0,z:0}),null);assert.equal(readBoat({...boat,heading:NaN}),null);
});
test('boat cannot cross shore or deck and can depart after docking without being snapped back',()=>{
  const boat={...DOCK.berth,heading:0,occupied:true,docked:true};
  assert.ok(canSail(boat.x,boat.z,boat.heading));
  for(let i=0;i<100;i++)moveBoat(boat,1,.3,0,.05);
  assert.ok(boat.x>DOCK.berth.x+10);assert.equal(boat.docked,false);
  for(let i=0;i<300;i++){moveBoat(boat,1,0,0,.05);assert.ok(canSail(boat.x,boat.z,boat.heading));}
  assert.equal(canSail(60,10),false);
  const before={...boat};moveBoat(boat,1,0,0,0);assert.deepEqual(boat,before);
});
test('boat interaction enforces proximity, safe disembarking, persistence and camera visibility',()=>{
  const scene=new THREE.Scene(),player=new THREE.Group(),state={};scene.add(player);let saves=0;
  const boating=createBoating({scene,M:materials(),player,state,save:()=>saves++,toast:()=>{},editor:()=>({clearPose(){},cancel(){},objectBlocks:()=>false}),blocked:(x,z)=>!inWorld(x,z)||inLake(x,z)&&!onDock(x,z),height:(x,z)=>onDock(x,z)?DOCK.y:terrainHeight(x,z),ripple:()=>{}});
  boating.recall();assert.ok(state.boat.docked);boating.interact();assert.equal(state.boat.occupied,false);
  player.position.set(DOCK.exit.x,DOCK.y,DOCK.exit.z);player.visible=false;
  // Berth is within arm's reach of the deck edge (not its center).
  player.position.z=11;boating.interact();assert.ok(boating.occupied);assert.equal(player.visible,false);
  state.boat.x=83;state.boat.z=8;boating.tick(.1,1);boating.interact();assert.ok(boating.occupied);
  Object.assign(state.boat,DOCK.berth);boating.interact();assert.equal(boating.occupied,false);assert.equal(state.boat.docked,true);assert.equal(player.position.y,DOCK.y);assert.equal(player.visible,false);
  assert.ok(boating.nearby,'disembark within reach so E can board again');
  assert.ok(saves>=3);assert.deepEqual(readBoat(JSON.parse(JSON.stringify(state.boat))),state.boat);
});
test('region meshes, deck raycasts and editable trees are finite after batching',()=>{
  const scene=new THREE.Scene(),region=createLakeRegion(scene,materials());scene.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(new THREE.Vector3(64,20,10),new THREE.Vector3(0,-1,0));
  assert.ok(ray.intersectObject(region.deck,true).length>0);assert.ok(region.entries.length>20);
  for(const entry of region.entries)assert.ok(entry.g.parent&&entry.resource&&entry.g.children.length);
  region.tick(.1,5,()=>{});
  scene.traverse(o=>{if(o.isMesh)for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));});
});
