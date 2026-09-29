import * as THREE from 'three';
import {terrainHeight,riverCenter} from './world-detail.js';
export const CROSSINGS=[-600,-280,40,360,680];
export function crossingHeight(x,z){
 const center=CROSSINGS.find(c=>Math.abs(z-c)<=4);
 if(center===undefined)return null;
 const cx=riverCenter(center),d=Math.abs(x-cx);
 if(d>16)return null;
 const deck=4.5,blend=THREE.MathUtils.smoothstep(d,6,16);
 return THREE.MathUtils.lerp(deck,terrainHeight(x,z),blend)+.035;
}
export function createCrossings(scene){
 const material=new THREE.MeshStandardMaterial({color:'#827768',roughness:.95});
 for(const z of CROSSINGS){
 const cx=riverCenter(z),geometry=new THREE.PlaneGeometry(32,8,64,16);
 geometry.rotateX(-Math.PI/2);geometry.translate(cx,0,z);
 const p=geometry.attributes.position;
 for(let i=0;i<p.count;i++)p.setY(i,crossingHeight(p.getX(i),p.getZ(i))??terrainHeight(p.getX(i),p.getZ(i)));
 geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;scene.add(mesh);
 for(const dx of [-4,4])for(const dz of [-3.6,3.6]){
 const support=new THREE.Mesh(new THREE.BoxGeometry(.5,7,.5),material);support.position.set(cx+dx,1,z+dz);support.castShadow=true;scene.add(support);
 }
 }
}
