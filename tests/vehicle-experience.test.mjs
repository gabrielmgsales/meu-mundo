import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {suspensionPose,applySuspension} from '../src/game/vehicle-suspension.js';
import {vehicleSoundParameters} from '../src/game/vehicle-audio.js';
import {createVehicleDust} from '../src/game/vehicle-dust.js';
import {REST_STOPS,inClearing,forestDensity} from '../src/game/forest-landmarks.js';
import {forestRoadZ} from '../src/game/forest-road.js';

test('suspension follows grades and rolls, with bounded wheel travel and stable pause',()=>{
 const truck={x:0,z:0,heading:0,speed:12},height=(x,z)=>x*.1+z*.2;
 const pose=suspensionPose(truck,height,1,5);assert.ok(pose.pitch<0);assert.ok(pose.roll>0);assert.ok(Number.isFinite(pose.y));
 const root=new THREE.Group();root.rotation.order='YXZ';const wheels=[];
 for(const x of [-.855,.855])for(const z of [-1.5425,1.5425]){const wheel=new THREE.Group();wheel.position.set(x,.405,z);root.add(wheel);wheels.push(wheel);}
 applySuspension(root,wheels,truck,height);const y=root.position.y;
 for(const wheel of wheels)assert.ok(wheel.position.y>=.12&&wheel.position.y<=.70);
 applySuspension(root,wheels,truck,()=>40,0);assert.equal(root.position.y,y);
 for(let i=0;i<120;i++)applySuspension(root,wheels,truck,()=>1,1/60);assert.ok(Math.abs(root.position.y-1)<.001);
});
test('vehicle audio responds to speed and throttle and quietens inside or after exit',()=>{
 const idle=vehicleSoundParameters({occupied:true,speed:0},0,false,false);
 const moving=vehicleSoundParameters({occupied:true,speed:9},1,false,false);
 assert.ok(moving.frequency>idle.frequency);assert.ok(moving.gravel>idle.gravel);
 const inside=vehicleSoundParameters({occupied:true,speed:9},1,false,true);assert.ok(inside.cutoff<moving.cutoff);assert.ok(inside.engine<moving.engine);
 const braking=vehicleSoundParameters({occupied:true,speed:9},0,true,false);assert.ok(braking.gravel>moving.gravel);
 const stopped=vehicleSoundParameters({occupied:false,speed:0},0,false,false);assert.equal(stopped.engine+stopped.gravel,0);
});
test('dust respects pause, wet roads and stopped vehicles',()=>{
 const scene=new THREE.Scene(),dust=createVehicleDust(scene),truck={x:450,z:forestRoadZ(450),y:1,heading:Math.PI/2,speed:15,occupied:true};
 const alpha=scene.children[0].geometry.attributes.alpha.array;
 dust.tick(.1,truck,1);assert.ok(alpha.every(x=>x===0));
 dust.tick(.1,truck,0);assert.ok(alpha.some(x=>x>0));const before=[...alpha];dust.tick(0,truck,0);assert.deepEqual([...alpha],before);
 for(let i=0;i<30;i++)dust.tick(.1,{...truck,speed:0},0);assert.ok(alpha.every(x=>x===0));
});
test('rest stops are in clearings off the road and forest density varies deterministically',()=>{
 for(const p of REST_STOPS){assert.ok(inClearing(p.x,p.z));assert.ok(Math.abs(p.z-forestRoadZ(p.x))>15);}
 assert.notEqual(forestDensity(0,0),forestDensity(120,50));assert.equal(forestDensity(120,50),forestDensity(120,50));
});

test('dust is emitted away from the main road and increases while skidding, but not airborne',()=>{
 const sample=(skid=0,airborne=false)=>{const scene=new THREE.Scene(),dust=createVehicleDust(scene);dust.tick(.15,{x:450,z:200,y:1,heading:0,speed:15,occupied:true,skid,airborne},0);return [...scene.children[0].geometry.attributes.alpha.array].filter(x=>x>0).length;};
 assert.ok(sample()>0);assert.ok(sample(1)>sample(0));assert.equal(sample(1,true),0);
});
