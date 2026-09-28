import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { weatherAt, sourcePan, createEnvironment } from '../src/game/environment.js';
import { animalMotion, stepAnimal, animateAnimal, createDayBirds } from '../src/game/wildlife.js';
import { createItem } from '../src/game/models.js';
import { animals } from '../src/game/catalogs.js';

test('weather is continuous at midnight, bounded, and leaves wet ground after rain',()=>{
  for(let day=1;day<5;day++)for(let h=0;h<24;h+=.1)for(const v of Object.values(weatherAt(day,h)))assert.ok(v>=0&&v<=1);
  assert.deepEqual(weatherAt(1,24),weatherAt(2,0));
  assert.ok(weatherAt(2,18).wet>weatherAt(2,18).rain);
  assert.ok(weatherAt(1,6).mist>weatherAt(1,12).mist);
});
test('waterfall stereo follows camera orientation and remains finite at the source',()=>{
  assert.equal(sourcePan({x:10,z:0},{x:0,z:0},{x:1,z:0}),1);
  assert.equal(sourcePan({x:10,z:0},{x:0,z:0},{x:-1,z:0}),-1);
  assert.equal(sourcePan({x:0,z:0},{x:0,z:0},{x:1,z:0}),0);
});
test('ripples expire, freeze when paused, and rain uses fewer particles on low quality',()=>{
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2();
  const player=new THREE.Object3D(),water=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshStandardMaterial());
  const env=createEnvironment({scene,player,water});
  const state={day:2,time:14,settings:{quality:'low'}};
  env.ripple(0,0);const ring=scene.getObjectByName('Ondulação');
  env.tick(.2,1,state);assert.ok(ring.visible);
  const scale=ring.scale.x;env.tick(0,100,state);assert.equal(ring.scale.x,scale);
  env.tick(2,3,state);assert.equal(ring.visible,false);
  assert.equal(scene.getObjectByName('Chuva suave').geometry.drawRange.count,300);
});
test('grazing uses an articulated head and dog rest ends without freezing movement',()=>{
  const cow=createItem(animals.find(a=>a.id==='vaca'));
  const m=animalMotion('grazer',0,0);m.wait=2;
  stepAnimal(m,.1,{family:'cow',canEnter:()=>true});assert.equal(m.behavior,'graze');
  animateAnimal(cow,m,.1);assert.ok(cow.userData.rig.find(j=>j.userData.motion==='head').rotation.x>0);
  const dog=animalMotion('resting-dog',0,0);dog.clock=10.5;
  stepAnimal(dog,.1,{type:'cachorro',player:{x:1,z:0},canEnter:()=>true});assert.equal(dog.behavior,'sit');
  let moved=false;for(let i=0;i<100;i++){stepAnimal(dog,.05,{type:'cachorro',player:{x:1,z:0},canEnter:()=>true});moved ||= dog.walking;}
  assert.ok(moved);
});

test('solo birds land and take off while the six flock birds remain in flight',()=>{
  const birds=createDayBirds(new THREE.Scene());
  const time=52-((6*2.399*7)%64);
  birds.tick(.1,time,12);const landed=birds.flock.children[6].position.y;
  assert.ok(birds.flock.children.slice(0,6).every(g=>g.position.y>6));
  birds.tick(.1,time+17,12);assert.ok(birds.flock.children[6].position.y>landed+4);
});
