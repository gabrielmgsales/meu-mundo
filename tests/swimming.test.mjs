import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createPlayerMovement} from '../src/game/player-movement.js';
function setup(){
 const player=new THREE.Group(),body=new THREE.Group(),arms=[new THREE.Group(),new THREE.Group()],legs=[new THREE.Group(),new THREE.Group()];
 player.position.set(0,0,8);
 const step=createPlayerMovement({player,body,arms,legs,height:x=>x<2?-4:0,riverX:()=>100,waterAt:x=>x<2?1:null,blocked:()=>false});
 const tick=(keys={},extra={})=>step({dt:.1,elapsed:1,keys,angle:0,boating:{occupied:false},pose:null,busy:false,...extra});
 return {player,arms,legs,tick};
}
test('water entry, arrows and swimming limbs',()=>{
 const {player,arms,legs,tick}=setup();tick();assert.equal(player.userData.swimming,true);assert.equal(player.rotation.x,Math.PI/2);
 const arm=arms[0].rotation.x,leg=legs[0].rotation.x,z=player.position.z;
 tick({ArrowUp:true});assert.ok(player.position.z<z);assert.notEqual(arms[0].rotation.x,arm);assert.notEqual(legs[0].rotation.x,leg);
});
test('dive respects bed, ascend reaches surface, pause freezes movement',()=>{
 const {player,tick}=setup();tick();for(let i=0;i<60;i++)tick({KeyC:true});assert.ok(player.position.y>=-3.83);assert.equal(player.userData.diving,true);
 const y=player.position.y;tick({Space:true},{dt:0});assert.equal(player.position.y,y);
 for(let i=0;i<60;i++)tick({Space:true});assert.equal(player.userData.diving,false);assert.ok(Math.abs(player.position.y-.85)<.001);
});
test('land exit restores upright walking and boat prevents swimming',()=>{
 const {player,tick}=setup();tick();player.position.x=3;tick();assert.equal(player.userData.swimming,false);assert.equal(player.rotation.x,0);assert.equal(player.position.y,0);
 player.position.x=0;tick({}, {boating:{occupied:true,step(){}}});assert.equal(player.userData.swimming,false);
});
