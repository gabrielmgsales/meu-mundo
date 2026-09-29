import * as THREE from 'three';
import {forestRoadZ,onForestRoad} from './forest-road.js';
import {terrainHeight,addTrail} from './world-detail.js';
export const REST_STOPS=[-1250,-650,450,1100].map(x=>({x,z:forestRoadZ(x)+19}));
export function inClearing(x,z){return REST_STOPS.some(p=>Math.hypot(p.x-x,p.z-z)<17)||Math.sin(x*.013)*Math.cos(z*.017)>.84;}
export function forestDensity(x,z){return 18+Math.round((Math.sin(x*.008+z*.006)+1)*14);}
export function addRestStops(root,tx,tz,M,road,obstacles){
 const box=(x,y,z,w,h,d,material)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);root.add(mesh);};
 for(const p of REST_STOPS){
 if(Math.floor((p.x+40)/80)!==tx||Math.floor(p.z/80)!==tz)continue;
 addTrail(root,[[p.x,forestRoadZ(p.x)],[p.x-3,p.z-8],[p.x,p.z]],3.2,road);
 // A broad cleared pull-off, with the bench well outside the driving lane.
 addTrail(root,[[p.x-9,p.z-3],[p.x,p.z-3],[p.x+9,p.z-3]],4,road);
 const y=terrainHeight(p.x,p.z+6);
 box(p.x,y+.5,p.z+6,3,.12,.65,M.wood);box(p.x,y+.91,p.z+6.28,3,.55,.09,M.wood);
 for(const dx of [-1.15,1.15])box(p.x+dx,y+.23,p.z+6,.16,.46,.5,M.stone);
 for(const dx of [-1,0,1])obstacles.push({x:p.x+dx,z:p.z+6,radius:.6});
 }
}
export function addFallenTree(root,x,z,M,obstacles){
 if(onForestRoad(x,z,7))return;
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.17,.31,4.6,9),M.wood);trunk.rotation.z=Math.PI/2;trunk.position.set(x,terrainHeight(x,z)+.29,z);root.add(trunk);
 for(const dx of [-1.7,-.6,.6,1.7])obstacles.push({x:x+dx,z,radius:.5});
 for(const dx of [-1.1,.8]){const limb=new THREE.Mesh(new THREE.CylinderGeometry(.04,.12,1.1,6),M.wood);limb.rotation.x=.9;limb.position.set(x+dx,terrainHeight(x,z)+.4,z+.4);root.add(limb);}
}
