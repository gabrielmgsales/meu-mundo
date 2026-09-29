import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createVerticalMotion,stepVerticalMotion,VEHICLE_GRAVITY} from '../src/game/vehicle-gravity.js';
import {advanceTruck,createDriving} from '../src/game/driving.js';
test('gravity produces ballistic fall independent of frame rate and freezes on pause',()=>{
 const run=rate=>{const body=createVerticalMotion(10);for(let i=0;i<rate/2;i++)stepVerticalMotion(body,0,1/rate);return body;};
 const a=run(60),b=run(120);assert.ok(Math.abs(a.y-(10-.5*VEHICLE_GRAVITY*.25))<1e-8);assert.ok(Math.abs(a.y-b.y)<1e-8);assert.ok(a.airborne);
 const before={...a};stepVerticalMotion(a,0,0);assert.deepEqual(a,before);
});
test('landing clamps to ground and compresses suspension, which then settles',()=>{
 const body=createVerticalMotion(3);let impact=0;
 for(let i=0;i<200;i++){stepVerticalMotion(body,0,1/120);impact=Math.max(impact,body.impact);assert.ok(body.y>=0);assert.ok(body.compression<=.12);}
 assert.ok(impact>5);assert.equal(body.airborne,false);assert.equal(body.vy,0);assert.ok(body.compression<.001);
});
test('airborne vehicle preserves horizontal momentum without throttle, brake or steering traction',()=>{
 const truck={x:0,z:0,heading:0,speed:10,airborne:true};advanceTruck(truck,{ArrowUp:true,ArrowLeft:true,Space:true},.1,()=>true);
 assert.equal(truck.speed,10);assert.equal(truck.heading,0);assert.ok(Math.abs(truck.z-1)<1e-8);
});
test('driving off a dry ledge becomes airborne and lands without teleporting to the lower terrain',()=>{
 const state={truck:{x:0,z:-8,heading:0,occupied:true}},player=new THREE.Group();
 const driving=createDriving({scene:new THREE.Scene(),player,state,height:(x,z)=>z<0?3:0,blocked:()=>false,waterAt:()=>null,boating:{occupied:false},editor:()=>({}),save(){},toast(){}});
 state.truck.speed=12;let airborne=false,landed=false;
 for(let i=0;i<240;i++){
 driving.tick(1/120,{ArrowUp:true});
 if(state.truck.airborne){airborne=true;assert.ok(driving.root.position.y>0);}
 else if(airborne&&state.truck.z>3)landed=true;
 }
 assert.ok(airborne);assert.ok(landed);assert.ok(driving.root.position.y>=-.121);
});
