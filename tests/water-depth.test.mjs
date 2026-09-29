import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainHeight,riverCenter} from '../src/game/world-detail.js';
import {LAKE,lakeTerrain} from '../src/game/region.js';
test('river is 2.7 metres deep at its center, triple its former depth',()=>{
 for(const z of [-25,0,25])assert.ok(Math.abs(.25-terrainHeight(riverCenter(z),z)-2.7)<1e-8);
});
test('lake is 10 metres deep and the shore keeps its old elevation',()=>{
 assert.ok(Math.abs(LAKE.level-lakeTerrain(LAKE.x,LAKE.z,0)-10)<1e-8);
 assert.ok(Math.abs(lakeTerrain(LAKE.x+LAKE.rx,LAKE.z,0)-(LAKE.level+.04))<1e-8);
});

test('lake slopes gradually from shallow shore to deep center',()=>{
 const bed=r=>lakeTerrain(LAKE.x+LAKE.rx*r,LAKE.z,0);
 assert.ok(LAKE.level-bed(.95)<.1);
 assert.ok(LAKE.level-bed(.85)<.7);
 assert.ok(LAKE.level-bed(.5)>4.9 && LAKE.level-bed(.5)<5.1);
 let previous=bed(1);
 for(let i=99;i>=0;i--){const current=bed(i/100);assert.ok(current<=previous+1e-8);assert.ok(previous-current<.16);previous=current;}
});
