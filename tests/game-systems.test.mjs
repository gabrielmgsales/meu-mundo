import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createPlayerMovement } from '../src/game/player-movement.js';
import { createCollection } from '../src/game/collection.js';
import { bindControls } from '../src/game/controls.js';

function movement(blocked = () => false) {
  const player = new THREE.Group();
  const step = createPlayerMovement({player, body: new THREE.Group(), legs: [], arms: [], height: () => 2, riverX: () => 100, blocked});
  const frame = {dt: .05, elapsed: 1, keys: {}, angle: 0, boating: {occupied: false}, pose: {active: false}, busy: false};
  return {player, frame, step};
}

test('movement normalizes diagonals, follows camera and slides along obstacles', () => {
  const straight = movement(), diagonal = movement(), wall = movement(x => x > 0);
  straight.step({...straight.frame, keys: {KeyD: true}});
  diagonal.step({...diagonal.frame, keys: {KeyD: true, KeyW: true}});
  assert.ok(Math.abs(Math.hypot(diagonal.player.position.x, diagonal.player.position.z) - straight.player.position.x) < 1e-9);
  wall.step({...wall.frame, keys: {KeyD: true, KeyW: true}});
  assert.equal(wall.player.position.x, 0);
  assert.ok(wall.player.position.z < 0);
  const rotated = movement();
  rotated.step({...rotated.frame, keys: {KeyD: true}, angle: Math.PI / 2});
  assert.ok(rotated.player.position.z < 0);
  assert.equal(rotated.player.position.y, 2);
});

test('poses and busy state prevent walking, while occupied boats receive controls', () => {
  const {player, frame, step} = movement();
  step({...frame, keys: {KeyW: true}, busy: true});
  assert.equal(player.position.z, 0);
  step({...frame, keys: {KeyW: true}, pose: {active: true, type: 'lie', x: 3, y: 4, z: 5, rotation: 1}});
  assert.deepEqual(player.position.toArray(), [3, 4, 5]);
  assert.equal(player.rotation.x, -Math.PI / 2);
  let received;
  step({...frame, keys: {KeyD: true}, boating: {occupied: true, step: (...args) => {received = args;}}});
  assert.deepEqual(received, [1, 0, 0, .05]);
});

test('collection respects cooldown, deleted resources, crop regrowth and boat priority', t => {
  const prompt = {textContent: ''};
  t.mock.method(globalThis, 'setTimeout', () => 0);
  const oldDocument = globalThis.document;
  globalThis.document = {getElementById: () => prompt};
  t.after(() => {globalThis.document = oldDocument;});
  const player = new THREE.Group();
  const resource = {type: 'wood', x: 1, z: 0, cooldown: 0};
  const crop = {g: new THREE.Group(), readyAt: 0};
  crop.g.position.x = 2;
  const state = {inventory: {wood: 0, grain: 0, food: 0}, collected: 0, harvested: 0};
  let saves = 0, boarded = 0;
  const context = {elapsed: 0, selected: null, editor: {pose: {active: false}}, experience: {busy: false, burst() {}}, boating: {nearby: false, interact() {boarded++;}}};
  const collection = createCollection({state, player, resources: [resource], crops: [crop], editable: [], riverX: () => 100, toast() {}, updateUI() {}, save() {saves++;}, current: () => context});
  collection.interaction(); collection.collect(); collection.collect();
  assert.equal(state.inventory.wood, 2);
  assert.equal(resource.cooldown, 4);
  collection.interaction(); collection.collect();
  assert.equal(state.inventory.grain, 5);
  assert.equal(crop.readyAt, 45);
  context.elapsed = 5;
  collection.interaction(); resource.deleted = true; collection.collect();
  assert.equal(state.inventory.wood, 2);
  context.boating.nearby = true; collection.collect();
  assert.equal(boarded, 1);
  assert.equal(saves, 2);
});

test('Escape cancels selection before pausing and typing does not trigger gameplay', t => {
  const oldWindow = globalThis.window;
  const handlers = {};
  globalThis.window = {addEventListener: (name, fn) => {handlers[name] = fn;}};
  t.after(() => {globalThis.window = oldWindow;});
  const context = {paused: false, selected: null, editor: {active: true, cancel() {this.active = false;}}};
  const keys = {};
  let collected = 0;
  bindControls({renderer: {domElement: {addEventListener() {}}}, keys, view: {angle: 0, zoom: 22}, current: () => context, select() {}, setPaused: value => {context.paused = value;}, collect() {collected++;}, aim() {}, place() {}});
  const key = (code, tagName = 'BODY') => handlers.keydown({code, target: {tagName}, preventDefault() {}});
  key('Escape'); assert.equal(context.paused, false); assert.equal(context.editor.active, false);
  key('Escape'); assert.equal(context.paused, true);
  key('KeyE'); assert.equal(collected, 0);
  context.paused = false;
  key('KeyE', 'INPUT'); assert.equal(collected, 0);
  key('KeyE'); assert.equal(collected, 1);
  handlers.blur(); assert.equal(context.paused, true);
});
