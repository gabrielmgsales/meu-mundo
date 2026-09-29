import test from 'node:test';
import assert from 'node:assert/strict';
import {CROSSINGS,crossingHeight} from '../src/game/crossings.js';
import {terrainHeight,riverCenter} from '../src/game/world-detail.js';
import {WORLD} from '../src/game/region.js';
test('expanded area is 200 times the original map',()=>{
 assert.equal((WORLD.maxX-WORLD.minX)*(WORLD.maxZ-WORLD.minZ),344*86*200);
});
test('every crossing supports the full truck across the river without a grade barrier',()=>{
 for(const z of CROSSINGS){
 const cx=riverCenter(z),height=(x,z)=>crossingHeight(x,z)??terrainHeight(x,z);
 for(let x=cx-20;x<=cx+20;x+=.25){
 const h=height(x,z);
 for(const dx of [-2.75,0,2.75])for(const dz of [-1,0,1]){
 const px=x+dx,pz=z+dz;
 assert.ok(Math.abs(height(px,pz)-h)<=2.8,`grade at ${px},${pz}`);
 assert.ok(Math.abs(px-riverCenter(pz))>=2.4||crossingHeight(px,pz)!==null,'river has a supported deck');
 }
 }
 assert.equal(crossingHeight(cx,z+5),null);
 }
});
