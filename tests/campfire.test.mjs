import test from 'node:test';
import assert from 'node:assert/strict';
import {createItem,animateCampfire} from '../src/game/models.js';
import {furniture} from '../src/game/catalogs.js';

test('campfire illuminates a broad area and retains animated flames after batching',()=>{
  const fire=createItem(furniture.find(i=>i.id==='fogueira'));
  const {flames,light}=fire.userData.fire;
  assert.equal(light.distance,22);assert.ok(light.intensity>=80);
  assert.equal(flames.children.length,5);assert.equal(flames.parent,fire);
  const original=flames.children[0].scale.y;
  animateCampfire(fire,.2);assert.notEqual(flames.children[0].scale.y,original);
  for(let t=0;t<20;t+=.1){animateCampfire(fire,t);assert.ok(light.intensity>75&&light.intensity<95);}
  const torch=createItem(furniture.find(i=>i.id==='tocha'));
  assert.equal(torch.children.find(o=>o.isPointLight).distance,7);
});
