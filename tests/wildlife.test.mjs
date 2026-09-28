import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { animalMotion,stepAnimal,createDayBirds,animateAnimal,birdFlight } from '../src/game/wildlife.js';
import { daytimeStrength } from '../src/game/daylight.js';
import { createItem } from '../src/game/models.js';
import { animals } from '../src/game/catalogs.js';
import { ValleyAudio,cricketSamples } from '../src/game/audio.js';

test('day birds and night ambience share gradual dawn and dusk transitions',()=>{
  for(const hour of [0,3,6,19,23,24])assert.equal(daytimeStrength(hour),0);
  for(const hour of [7,12,18])assert.equal(daytimeStrength(hour),1);
  assert.equal(daytimeStrength(6.5),.5);assert.equal(daytimeStrength(18.5),.5);
});

test('animals wander, pause, stay near their home and respect obstacles',()=>{
  const m=animalMotion('sheep',0,0);let steps=0,rests=0;
  for(let i=0;i<5000;i++){
    stepAnimal(m,1/30,{canEnter:(x,z)=>x<.4&&z>-.7});
    assert.ok(m.x<.4&&m.z>-.7);assert.ok(Math.hypot(m.x,m.z)<2.7);
    if(m.walking)steps++;else rests++;
  }
  assert.ok(steps>100);assert.ok(rests>100);
});

test('fish stay inside water and playful dogs run around the player without touching them',()=>{
  const fish=animalMotion('fish',0,0);
  for(let i=0;i<3000;i++){stepAnimal(fish,1/30,{family:'fish',daylight:0,canEnter:(x,z)=>Math.abs(x)<.5&&Math.abs(z)<2});assert.ok(Math.abs(fish.x)<.5&&Math.abs(fish.z)<2);}
  const dog=animalMotion('dog',0,0),player={x:5,z:0};
  let playfulSteps=0,rests=0,travel=0;
  for(let i=0;i<600;i++){
    const x=dog.x,z=dog.z;
    stepAnimal(dog,1/30,{family:'dog',type:'cachorro',player,canEnter:()=>true});
    assert.ok(Math.hypot(player.x-dog.x,player.z-dog.z)>1.9);
    travel+=Math.hypot(dog.x-x,dog.z-z);
    if(dog.walking&&dog.playful)playfulSteps++;if(!dog.walking)rests++;
  }
  assert.ok(playfulSteps>200);assert.ok(rests>30);assert.ok(travel>35);
});

test('pause freezes motion and daytime animals rest at night',()=>{
  const m=animalMotion('cow',0,0);m.targetX=2;m.wait=0;
  const before={...m};stepAnimal(m,0,{canEnter:()=>true});assert.deepEqual(m,before);
  stepAnimal(m,.05,{daylight:0,canEnter:()=>true});assert.equal(m.x,0);assert.equal(m.walking,false);
});

test('animated joints survive geometry batching and daytime flocks disappear at night',()=>{
  const dog=createItem(animals.find(a=>a.id==='cachorro'));
  assert.equal(dog.userData.rig.filter(p=>p.userData.motion==='leg').length,4);
  animateAnimal(dog,{walking:true,phase:1,heading:1},.05);
  assert.ok(dog.userData.rig.some(p=>p.userData.motion==='leg'&&Math.abs(p.rotation.x)>.1));
  const scene=new THREE.Scene(),birds=createDayBirds(scene);birds.tick(.05,5,12);
  assert.equal(birds.flock.children.length,9);assert.ok(birds.flock.children.slice(0,6).every(g=>g.position.y>6.5)&&birds.flock.children.every(g=>g.scale.x<.14));
  const wing=birds.flock.children[0].userData.rig.find(p=>p.userData.motion==='wing'),before=wing.rotation.z;
  birds.tick(.05,5.1,12);assert.notEqual(wing.rotation.z,before);
  const position=birds.flock.children[0].position.clone();birds.tick(0,10,12);assert.deepEqual(birds.flock.children[0].position,position);
  birds.tick(.05,10,22);assert.equal(birds.flock.visible,false);
});

test('birds move quickly through the world and occasionally gather into flocks',()=>{
  for(let i=0;i<9;i++)for(let t=0;t<90;t+=2){
    const a=birdFlight(t,i),b=birdFlight(t+.1,i);
    assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>.4,'Bird must travel, not hover');
  }
  const distance=t=>{const a=birdFlight(t,0),b=birdFlight(t,2);return Math.hypot(a.x-b.x,a.z-b.z);};
  assert.ok(distance(Math.PI/2/.14)<2);assert.ok(distance(Math.PI*1.5/.14)>8);
});

test('fast dogs do not jump across thin obstacles',()=>{
  const dog=animalMotion('fast-dog',0,0);dog.wait=0;dog.targetX=3;
  stepAnimal(dog,.1,{type:'cachorro',canEnter:x=>x<.14||x>.22});
  assert.ok(dog.x<.14);
});

test('dogs remain active at night',()=>{
  const dog=animalMotion('night-dog',0,0);let traveled=0;
  for(let i=0;i<300;i++){
    const x=dog.x,z=dog.z;
    stepAnimal(dog,1/30,{type:'cachorro',daylight:0,canEnter:()=>true,player:{x:5,z:0}});
    traveled+=Math.hypot(dog.x-x,dog.z-z);
  }
  assert.ok(traveled>10);
});

test('a dog following the player walks around an obstacle instead of retrying it forever',()=>{
  const dog=animalMotion('blocked-dog',0,0);let traveled=0;
  const canEnter=(x,z)=>!(x>.5&&x<1.5&&Math.abs(z)<.7);
  for(let i=0;i<600;i++){
    const x=dog.x,z=dog.z;
    stepAnimal(dog,1/30,{type:'cachorro',player:{x:5,z:0},canEnter});
    assert.ok(canEnter(dog.x,dog.z));traveled+=Math.hypot(dog.x-x,dog.z-z);
  }
  assert.ok(traveled>15);assert.ok(dog.x>1.5);
});

test('cricket loop is quiet, finite and fades at its boundaries',()=>{
  const samples=cricketSamples(24000);let peak=0,power=0;
  for(const s of samples){assert.ok(Number.isFinite(s));peak=Math.max(peak,Math.abs(s));power+=s*s;}
  assert.ok(peak>.1&&peak<.45);assert.ok(Math.sqrt(power/samples.length)*.055*.3<.003);
  assert.equal(samples[0],0);assert.ok(Math.abs(samples.at(-1))<.001);
});

test('crickets ramp down in daylight and obey mute and pause',()=>{
  const audio=new ValleyAudio(),levels=[];audio.context={currentTime:10};audio.stream={gain:{setTargetAtTime(){}}};audio.crickets={gain:{setTargetAtTime(...args){levels.push(args);}}};audio.tone=()=>{};
  audio.ambience(0,22);assert.equal(levels.at(-1)[0],.055);assert.ok(levels.at(-1)[2]>=1);
  audio.ambience(0,12);assert.equal(levels.at(-1)[0],0);
  audio.enabled=false;audio.ambience(0,22);assert.equal(levels.length,2);
  audio.enabled=true;audio.paused=true;audio.ambience(0,22);assert.equal(levels.length,2);
});
