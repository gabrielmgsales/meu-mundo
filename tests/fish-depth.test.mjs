import test from 'node:test';
import assert from 'node:assert/strict';
import {fishDepth} from '../src/game/fish-depth.js';
test('fish visit shallow and deep water without crossing surface or bed',()=>{
 let current=-1,min=0,max=-10;
 for(let i=0;i<2400;i++){
 current=fishDepth({id:'fish-a',time:i*.1,dt:.1,surface:0,bed:-10,size:.5,current});
 assert.ok(current>=-9.675&&current<=-.325);min=Math.min(min,current);max=Math.max(max,current);
 }
 assert.ok(min<-7);assert.ok(max>-3);
});
test('fish cycles differ, pause freezes and shallow beds constrain depth',()=>{
 const args={time:15,dt:.1,surface:1,bed:-9,size:.5};
 assert.notEqual(fishDepth({...args,id:'one'}),fishDepth({...args,id:'two'}));
 assert.equal(fishDepth({...args,id:'one',dt:0,current:-3}),-3);
 const y=fishDepth({...args,id:'one',bed:0,current:-8});assert.ok(y>=.325&&y<=.675);
});
