import {createVerticalMotion,stepVerticalMotion} from './vehicle-gravity.js';
import {createCabin} from './vehicle-cabin.js';
import {createVehicleDust} from './vehicle-dust.js';
import {weatherAt} from './environment.js';
import {applySuspension,suspensionPose} from './vehicle-suspension.js';
import {createHeadlights} from './headlights.js';
import { createHiluxModel } from './hilux-model.js';
import * as THREE from 'three';
import { inWorld } from './region.js';
export function readTruck(raw){
 if(!raw||!Number.isFinite(raw.x)||!Number.isFinite(raw.z)||!Number.isFinite(raw.heading)||!inWorld(raw.x,raw.z,3))return null;
 return {x:raw.x,z:raw.z,heading:raw.heading,occupied:raw.occupied===true};
}
export function advanceTruck(truck, keys, dt, canEnter){
 if(dt<=0)return;
 const throttle=Number(!!(keys.ArrowUp||keys.KeyW))-Number(!!(keys.ArrowDown||keys.KeyS));
 const turn=Number(!!(keys.ArrowLeft||keys.KeyA))-Number(!!(keys.ArrowRight||keys.KeyD));
 let speed=truck.speed||0;
 const braking=!truck.airborne&&(!!keys.Space||throttle*speed<0);
 const slipTarget=braking?THREE.MathUtils.smoothstep(Math.abs(speed),5,13):0;
 truck.skid=truck.airborne?0:THREE.MathUtils.lerp(truck.skid||0,slipTarget,1-Math.exp(-dt*8));
 if(!truck.airborne&&!keys.Space)speed+=throttle*7*dt;
 if(!truck.airborne&&(!throttle||keys.Space))speed*=Math.exp(-dt*(keys.Space?(Math.abs(speed)>5?1.6:9):1.1));
 speed=THREE.MathUtils.clamp(speed,-6,19);
 const heading=truck.heading+(truck.airborne?0:turn*speed*.065*dt*(1+truck.skid*.3));
 let motion=truck.motionHeading??truck.heading;
 if(!truck.airborne){const delta=Math.atan2(Math.sin(heading-motion),Math.cos(heading-motion));motion+=delta*(1-Math.exp(-dt*(truck.skid>.1?1.3:18)));}
 const distance=speed*dt,steps=Math.max(1,Math.ceil(Math.abs(distance)/.18));
 for(let i=0;i<steps;i++){
 const x=truck.x+Math.sin(motion)*distance/steps,z=truck.z+Math.cos(motion)*distance/steps;
 if(!canEnter(x,z,heading)){speed=0;truck.skid=0;motion=truck.heading;break;}
 truck.x=x;truck.z=z;truck.heading=heading;
 }
 truck.speed=speed;truck.motionHeading=motion;

}
export const createTruckModel = createHiluxModel;
export function createDriving({scene,player,state,height,blocked,waterAt,boating,editor,save,toast,home={x:-5,z:-5}}){
 const {root,wheels,steering,headlightMaterial}=createTruckModel();scene.add(root);
 const cabin=createCabin(root,steering),dust=createVehicleDust(scene);
 const headlights=createHeadlights(root,headlightMaterial);headlights.update(state.time);
 let vertical=null;
 const dry=(x,z)=>waterAt(x,z)===null;
 const canEnter=(x,z,heading)=>{
 if(!inWorld(x,z,3))return false;
 const h=height(x,z);
 for(const sx of [-1,0,1])for(const sz of [-2.75,0,2.75]){
 const px=x+sx*Math.cos(heading)+sz*Math.sin(heading),pz=z-sx*Math.sin(heading)+sz*Math.cos(heading);
 if(blocked(px,pz)||!dry(px,pz)||(vertical?height(px,pz)-vertical.y>2.8:Math.abs(height(px,pz)-h)>2.8))return false;
 }return true;
 };
 let parked=readTruck(state.truck);
 if(!parked || !canEnter(parked.x,parked.z,parked.heading)){
 parked={x:0,z:5,heading:0,occupied:false};
 let found=false;
 for(let radius=5;radius<25&&!found;radius+=2)for(let i=0;i<20;i++){
 const a=i*Math.PI/10,x=home.x+Math.cos(a)*radius,z=home.z+Math.sin(a)*radius;
 if(canEnter(x,z,0)){parked={x,z,heading:0,occupied:false};found=true;break;}
 }
 }
 if(boating.occupied)parked.occupied=false;
 state.truck=parked;
 root.rotation.order='YXZ';
 vertical=createVerticalMotion(suspensionPose(parked,height).y);
 const sync=(dt,turn=0,acceleration=0)=>{
 if(dt>0)stepVerticalMotion(vertical,suspensionPose(parked,height).y,dt);
 parked.airborne=vertical.airborne;
 applySuspension(root,wheels,parked,height,dt,turn,acceleration,vertical);
 cabin.update(parked.speed||0,state.time??12,parked.occupied);
 if(parked.occupied){player.position.copy(root.position).add(new THREE.Vector3(0,.8,0));player.rotation.set(0,parked.heading,0);player.visible=false;player.userData.swimming=false;player.userData.diving=false;}
 };
 sync();
 return {
 root,
 camera(camera,firstPerson,yaw=0,pitch=0){
 const inside=parked.occupied&&firstPerson;
 const fov=inside?72:43,near=inside?.025:.1;
 if(camera.fov!==fov||camera.near!==near){camera.fov=fov;camera.near=near;camera.updateProjectionMatrix();}
 camera.up.set(0,1,0);
 if(!inside)return false;
 root.updateMatrixWorld(true);
 camera.position.copy(root.localToWorld(new THREE.Vector3(-.43,1.67,.29)));
 const direction=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)).applyQuaternion(root.quaternion);
 camera.up.applyQuaternion(root.quaternion);
 camera.lookAt(camera.position.clone().add(direction));
 return true;
 },
 blocks(x,z){if(parked.occupied)return false;const dx=x-parked.x,dz=z-parked.z;return Math.abs(dx*Math.cos(parked.heading)-dz*Math.sin(parked.heading))<1.15&&Math.abs(dx*Math.sin(parked.heading)+dz*Math.cos(parked.heading))<2.9;},
 get occupied(){return parked.occupied;},
 get nearby(){return parked.occupied||!boating.occupied&&Math.hypot(player.position.x-parked.x,player.position.z-parked.z)<3.8;},
 get prompt(){return parked.occupied?Math.round(Math.abs(parked.speed||0)*3.6)+' km/h | [ E ] Sair da Hilux | Setas/WASD dirigir | Espaco frear | V camera':'[ E ] Entrar na Hilux';},
 interact(){
 if(parked.occupied){
 if(vertical.airborne){toast('Espere a Hilux pousar antes de sair.');return;}
 if(Math.abs(parked.speed||0)>.5){toast('Pare a picape antes de sair.');return;}
 let exit;
 for(const side of [-1,1])for(const offset of [0,-2,2]){
 const x=parked.x+Math.cos(parked.heading)*side*2+Math.sin(parked.heading)*offset,z=parked.z-Math.sin(parked.heading)*side*2+Math.cos(parked.heading)*offset;
 if(inWorld(x,z,1)&&!blocked(x,z)&&dry(x,z))exit={x,z};
 }
 if(!exit){toast('Estacione em um local com espa\u00e7o livre ao lado.');return;}
 parked.occupied=false;player.visible=!editor()?.firstPerson;player.position.set(exit.x,height(exit.x,exit.z),exit.z);
 }else{
 if(boating.occupied)return;
 editor()?.clearPose();editor()?.cancel();parked.occupied=true;parked.speed=0;sync();toast('Hilux: W/cima acelerar | S/baixo frear e r\u00e9 | A/D ou setas virar | Espa\u00e7o frear | E sair.');
 }save();
 },
 tick(dt,keys){
 headlights.update(state.time);
 if(dt<=0)return;
 const steps=Math.max(1,Math.ceil(dt/(1/120))),step=dt/steps;
 const steer=Number(!!(keys.ArrowLeft||keys.KeyA))-Number(!!(keys.ArrowRight||keys.KeyD));
 for(let i=0;i<steps;i++){
 const oldSpeed=parked.speed||0;
 if(parked.occupied){
 steering.rotation.z+=(steer*.8-steering.rotation.z)*(1-Math.exp(-step*10));
 advanceTruck(parked,keys,step,canEnter);
 for(const wheel of wheels){wheel.rotation.x+=(parked.speed||0)*step/.405;if(wheel.position.z>0)wheel.rotation.y=steer*.35;}
 }
 sync(step,parked.occupied?steer:0,((parked.speed||0)-oldSpeed)/step);
 }
 dust.tick(dt,{...parked,occupied:parked.occupied&&!vertical.airborne,y:root.position.y,dirt:dry(parked.x,parked.z)},weatherAt(state.day||1,state.time??12).wet,state.settings?.quality==='low');
 }
 };
}
