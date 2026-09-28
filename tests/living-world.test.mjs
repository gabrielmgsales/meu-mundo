import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { chooseRoutine,nearestDestination } from '../src/game/routines.js';
import { animalMotion,stepAnimal } from '../src/game/wildlife.js';
import { createGroundLife } from '../src/game/ground-life.js';
import { readCreative } from '../src/game/creative-state.js';

test('free routines respond to weather and time while explicit following takes priority',()=>{
  const person={person:true,child:true,hour:10,rain:0,distance:4};
  assert.equal(chooseRoutine(person),'play');
  assert.equal(chooseRoutine({...person,hour:22}),'home');
  assert.equal(chooseRoutine({...person,rain:1}),'shelter');
  assert.equal(chooseRoutine({...person,rain:1,follow:true}),'follow');
  assert.equal(chooseRoutine({...person,hour:13}),'sit');
  assert.equal(nearestDestination({x:0,z:0},[{x:1,z:0},{x:3,z:0}],x=>x>2).x,3);
});

test('family reaches a destination around an obstacle and climbs without crossing a wall',()=>{
  const m=animalMotion('family-route',0,0),canEnter=(x,z)=>!(x>1&&x<2&&Math.abs(z)<.5);
  for(let i=0;i<500;i++){
    stepAnimal(m,.05,{family:'human',moveSpeed:2.8,goal:{x:4,z:0},canEnter,height:(x)=>x*.55});
    assert.ok(canEnter(m.x,m.z));
  }
  assert.ok(Math.hypot(m.x-4,m.z)<.3);
  const old={x:m.x,z:m.z};stepAnimal(m,0,{goal:{x:10,z:0},canEnter});assert.equal(m.x,old.x);
});

test('a dog reaches a thrown-ball destination instead of circling the player',()=>{
  const m=animalMotion('fetch',0,0);
  for(let i=0;i<100;i++)stepAnimal(m,.05,{type:'cachorro',player:{x:0,z:0},goal:{x:5,z:0},canEnter:()=>true});
  assert.ok(Math.hypot(m.x-5,m.z)<.25);
  for(let i=0;i<100;i++)stepAnimal(m,.05,{type:'cachorro',player:{x:0,z:0},goal:{x:1.4,z:0},canEnter:()=>true});
  assert.ok(Math.hypot(m.x-1.4,m.z)<.25);
});

test('local scenery is bounded, respects water, dries after rain and freezes when paused',()=>{
  const scene=new THREE.Scene(),life=createGroundLife(scene),player=new THREE.Vector3(-80,0,15);
  const context={landHeight:()=>0,waterAt:()=>null};
  life.tick(.1,1,player,{rain:1,wet:1},context,'high');
  const high=life.grass.count;assert.ok(high>0&&high<=400);assert.ok(life.puddles.visible);
  const opacity=life.puddles.material.opacity;life.tick(0,2,player,{rain:0,wet:0},context,'low');assert.equal(life.puddles.material.opacity,opacity);
  life.tick(.1,3,player,{rain:0,wet:0},context,'low');assert.ok(life.grass.count<high);assert.equal(life.puddles.visible,false);
  life.tick(.1,6,player,{rain:0,wet:0},{...context,waterAt:()=>1},'high');assert.equal(life.grass.count,0);
});

test('family routine and following preferences survive saving independently',()=>{
  const items=[{id:'a',kind:'family',type:'filho',x:0,z:5,follow:false,routine:true},{id:'b',kind:'family',type:'esposa',x:0,z:6,follow:true,routine:false}];
  assert.deepEqual(readCreative(JSON.parse(JSON.stringify({items}))).items.map(i=>[i.follow,i.routine]),[[false,true],[true,false]]);
});
