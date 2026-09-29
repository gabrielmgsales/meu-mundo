import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {updateVehicleOrbit,dragOrbit,zoomOrbit,orbitPosition} from '../src/game/camera-orbit.js';
test('third person retains mouse orbit and zoom while driving and following turns',()=>{
 const view={angle:0,zoom:22},position=new THREE.Vector3(10,2,8),desired=new THREE.Vector3();
 updateVehicleOrbit(view,0);dragOrbit(view,80,30,false);const angle=view.angle;
 updateVehicleOrbit(view,0);assert.equal(view.angle,angle);
 updateVehicleOrbit(view,.3);assert.ok(Math.abs(view.angle-angle-.3)<1e-10);
 orbitPosition(desired,position,view);const before=desired.distanceTo(position);
 zoomOrbit(view,-300);orbitPosition(desired,position,view);assert.ok(desired.distanceTo(position)<before);
 assert.ok(view.elevation>Math.atan(.49));
 updateVehicleOrbit(view,null);const footAngle=view.angle;updateVehicleOrbit(view,null);assert.equal(view.angle,footAngle);
 zoomOrbit(view,-100000);assert.equal(view.zoom,5);zoomOrbit(view,100000);assert.equal(view.zoom,55);
 const elevation=view.elevation;dragOrbit(view,10,50,true);assert.equal(view.elevation,elevation);
});
