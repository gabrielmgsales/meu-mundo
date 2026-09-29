import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readTruck,advanceTruck,createDriving,createTruckModel} from '../src/game/driving.js';
import {readProgress} from '../src/game/rules.js';
test('pickup accelerates, reverses, brakes and does not tunnel through obstacles',()=>{
 const truck={x:0,z:0,heading:0,speed:0};
 for(let i=0;i<20;i++)advanceTruck(truck,{ArrowUp:true},.05,()=>true);
 assert.ok(truck.z>0&&truck.speed>0);const heading=truck.heading;
 advanceTruck(truck,{ArrowLeft:true},.1,()=>true);assert.ok(truck.heading>heading);
 for(let i=0;i<20;i++)advanceTruck(truck,{Space:true},.05,()=>true);assert.ok(truck.speed<.1);
 truck.heading=0;truck.z=0;truck.speed=19;advanceTruck(truck,{ArrowUp:true},.5,(x,z)=>z<1);assert.ok(truck.z<1);assert.equal(truck.speed,0);
 for(let i=0;i<20;i++)advanceTruck(truck,{ArrowDown:true},.05,()=>true);assert.ok(truck.speed<0);
 const z=truck.z;advanceTruck(truck,{ArrowUp:true},0,()=>true);assert.equal(truck.z,z);
});
test('truck saves isolated state and rejects corrupt positions',()=>{
 const truck={x:400,z:120,heading:1,occupied:true};const state=readProgress({version:3,truck},{});assert.deepEqual(state.truck,truck);
 assert.equal(readTruck({...truck,x:NaN}),null);assert.equal(readTruck({...truck,x:1900}),null);
});
test('truck allows entering and safe exit but rejects exit while moving',()=>{
 const scene=new THREE.Scene(),player=new THREE.Group(),state={};let saves=0;
 const driving=createDriving({scene,player,state,height:()=>0,blocked:()=>false,waterAt:()=>null,boating:{occupied:false},editor:()=>({clearPose(){},cancel(){}}),save:()=>saves++,toast(){}});
 player.position.set(state.truck.x,0,state.truck.z);assert.ok(driving.nearby);driving.interact();assert.ok(driving.occupied);assert.equal(player.visible,false);
 driving.tick(.1,{ArrowUp:true});driving.interact();assert.ok(driving.occupied);
 for(let i=0;i<30;i++)driving.tick(.1,{Space:true});driving.interact();assert.equal(driving.occupied,false);assert.equal(player.visible,true);assert.equal(saves,2);
 const model=createTruckModel();assert.equal(model.wheels.length,4);assert.ok(!new THREE.Box3().setFromObject(model.root).isEmpty());
});

test('detailed international Hilux fits the vehicle envelope with finite geometry',()=>{
 const {root,wheels}=createTruckModel();const size=new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
 assert.ok(size.x<2.5&&size.y<2.3&&size.z<5.6);assert.ok(size.z>5.2);
 root.traverse(o=>{if(o.isMesh)for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));});
 assert.equal(wheels.length,4);assert.equal(root.userData.reference,'International Hilux 2026 SR5');
});

test('driver camera follows the cabin on slopes, looks around and restores external lens',()=>{
 const state={truck:{x:0,z:5,heading:.6,occupied:true}},player=new THREE.Group();
 const driving=createDriving({scene:new THREE.Scene(),player,state,height:(x,z)=>z*.15,blocked:()=>false,waterAt:()=>null,boating:{occupied:false},editor:()=>({}),save(){},toast(){}});
 const camera=new THREE.PerspectiveCamera(43,1,.1,6500);
 assert.equal(driving.camera(camera,true),true);
 const expected=driving.root.localToWorld(new THREE.Vector3(-.43,1.67,.29));
 assert.ok(camera.position.distanceTo(expected)<1e-8);
 const forward=new THREE.Vector3(0,0,1).applyQuaternion(driving.root.quaternion);
 assert.ok(camera.getWorldDirection(new THREE.Vector3()).dot(forward)>.999);
 driving.camera(camera,true,.7,.2);
 assert.ok(camera.getWorldDirection(new THREE.Vector3()).dot(forward)<.9);
 assert.equal(camera.fov,72);assert.equal(camera.near,.025);
 const position=camera.position.clone();assert.equal(driving.camera(camera,false),false);
 assert.equal(camera.fov,43);assert.equal(camera.near,.1);assert.ok(camera.position.equals(position));
 state.truck.occupied=false;assert.equal(driving.camera(camera,true),false);
});

test('hard braking at speed retains momentum and produces lateral slip while steering',()=>{
 const truck={x:0,z:0,heading:0,speed:19};
 for(let i=0;i<48;i++)advanceTruck(truck,{Space:true,ArrowLeft:true},1/120,()=>true);
 assert.ok(truck.skid>.4);assert.ok(truck.speed>5);assert.ok(truck.z>3);
 assert.ok(Math.abs(truck.heading-truck.motionHeading)>.08);
 for(let i=0;i<600;i++)advanceTruck(truck,{Space:true},1/120,()=>true);
 assert.ok(Math.abs(truck.speed)<.01);assert.ok(truck.skid<.01);
 const slow={x:0,z:0,heading:0,speed:3};advanceTruck(slow,{Space:true},.1,()=>true);assert.equal(slow.skid,0);
});
test('sliding vehicle still respects solid collision and clears residual slide',()=>{
 const truck={x:0,z:0,heading:0,speed:19,skid:1,motionHeading:0};
 advanceTruck(truck,{Space:true},.2,(x,z)=>z<1);
 assert.ok(truck.z<1);assert.equal(truck.speed,0);assert.equal(truck.skid,0);
});
