import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorlds,saveWorld,chooseWorld,createWorld,renameWorld,WORLDS_KEY,LEGACY_KEY } from '../src/game/worlds.js';
import { readProgress } from '../src/game/rules.js';
class MemoryStorage {
  values=new Map();getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,v);}
}

test('creating and renaming worlds preserves other saves and subsequent progress', () => {
  const storage = new MemoryStorage();
  const first = createWorld('  Primeiro  ', storage);
  const second = createWorld('Segundo', storage);
  chooseWorld(first);
  renameWorld(first.id, '  Casa  ', storage);
  saveWorld({ day: 8 }, storage);
  const worlds = loadWorlds(storage);
  assert.equal(worlds[0].name, 'Casa');
  assert.equal(worlds[0].data.day, 8);
  assert.deepEqual(worlds[1], second);
  assert.notEqual(first.id, second.id);
});

test('menu mutations preserve malformed saves and reject empty names', () => {
  const storage = new MemoryStorage();
  assert.throws(() => createWorld('  ', storage));
  assert.equal(storage.getItem(WORLDS_KEY), null);
  storage.setItem(WORLDS_KEY, 'broken');
  assert.throws(() => createWorld('Novo', storage));
  assert.throws(() => renameWorld('unknown', 'Novo', storage));
  assert.equal(storage.getItem(WORLDS_KEY), 'broken');
});
test('legacy save migrates without changing or removing the original',()=>{
  const storage=new MemoryStorage(),legacy={version:3,position:{x:2,z:4},inventory:{wood:50},day:9};storage.setItem(LEGACY_KEY,JSON.stringify(legacy));
  const worlds=loadWorlds(storage);assert.equal(worlds.length,1);assert.deepEqual(worlds[0].data,legacy);assert.equal(storage.getItem(LEGACY_KEY),JSON.stringify(legacy));assert.equal(loadWorlds(storage).length,1);
});
test('saving one world preserves another world, its name and its progress',()=>{
  const storage=new MemoryStorage(),a={id:'a',name:'Lago',updated:1,data:{day:3}},b={id:'b',name:'Floresta',updated:2,data:{day:7}};
  storage.setItem(WORLDS_KEY,JSON.stringify([a,b]));chooseWorld(a);saveWorld({version:3,day:12,creative:{biome:'outono'}},storage);
  const worlds=loadWorlds(storage);assert.deepEqual(worlds[1],b);assert.equal(worlds[0].data.day,12);assert.equal(worlds[0].name,'Lago');
});
test('malformed save does not silently overwrite stored worlds',()=>{
  const storage=new MemoryStorage();storage.setItem(WORLDS_KEY,'broken');assert.throws(()=>loadWorlds(storage));chooseWorld({id:'c',name:'Novo'});assert.throws(()=>saveWorld({},storage));assert.equal(storage.getItem(WORLDS_KEY),'broken');
});
test('existing construction identifiers and original progression survive loading',()=>{
  const saved={version:3,buildings:[{id:'unique-cabin',type:'cabin',x:2,z:3}],discovered:['quarry'],position:{x:8,z:0},settings:{sound:false,volume:.7}};
  const state=readProgress(saved,{cabin:{}});assert.equal(state.buildings[0].id,'unique-cabin');assert.deepEqual(state.position,saved.position);assert.equal(state.settings.sound,false);
});
