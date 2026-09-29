import {inClearing,forestDensity,addRestStops,addFallenTree} from './forest-landmarks.js';
import {addForestRoad,onForestRoad} from './forest-road.js';
import {crossingHeight} from './crossings.js';
import {detailTerrain} from './terrain-surface.js';
import {addTrail} from './world-detail.js';
import {createRoadMaterial} from './road-material.js';
import * as THREE from 'three';
import {WORLD,inWorld} from './region.js';
import {terrainHeight,riverCenter,batchStatic} from './world-detail.js';
import {foliageGeometry} from './foliage.js';
import {rockGeometry} from './landscape-detail.js';
export function createExpandedWorld(scene,M){
 const tiles=new Map(),size=80;
 const soil=new THREE.MeshStandardMaterial({color:'#78845b',roughness:1});detailTerrain(soil);
 const road=createRoadMaterial();
 const original=(x,z)=>x>-220&&x<135&&z>-48&&z<48;
 const trunkGeo=new THREE.CylinderGeometry(.09,.32,5,7),crownGeo=foliageGeometry(1.7,false,.4),rockGeo=rockGeometry(4);
 function generate(tx,tz){
 const root=new THREE.Group(),obstacles=[];
 addForestRoad(root,tx,tz,road);
 addRestStops(root,tx,tz,M,road,obstacles);
 if(!(tx>=-4&&tx<4&&tz>=-2&&tz<2)){
 const geometry=new THREE.PlaneGeometry(size,size,40,40);geometry.rotateX(-Math.PI/2);geometry.translate(tx*size,0,(tz+.5)*size);
 const pos=geometry.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,terrainHeight(pos.getX(i),pos.getZ(i)));
 geometry.computeVertexNormals();const land=new THREE.Mesh(geometry,soil);land.receiveShadow=true;land.userData.outerTerrain=true;root.add(land);
 if(Math.abs(tz%4)===0 && Math.abs(tx*size)>25)addTrail(root,[[tx*size-40,tz*size+40],[tx*size,tz*size+40],[tx*size+40,tz*size+40]],2.2,road);
 }

 let seed=((tx*73856093)^(tz*19349663)^7823)>>>0;
 const random=()=> (seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296;
 for(let i=0;i<forestDensity(tx*size,tz*size);i++){
 const x=tx*size-40+random()*size,z=tz*size+random()*size;
 if(inClearing(x,z)||onForestRoad(x,z,5)||!inWorld(x,z,5)||original(x,z)||Math.abs(x-riverCenter(z))<6||Math.abs(z)<4||Math.abs(z-(Math.round((z-40)/320)*320+40))<5||crossingHeight(x,z)!==null||Math.abs(Math.abs(z)-120)<4)continue;
 const tree=new THREE.Group(),scale=1.5+random()*1.6;
 tree.position.set(x,terrainHeight(x,z),z);tree.scale.setScalar(scale);
 const trunk=new THREE.Mesh(trunkGeo.clone(),M.wood);trunk.position.y=2.5;tree.add(trunk);
 for(let j=0;j<3;j++){
 const leaves=new THREE.Mesh(crownGeo.clone(),j%2?M.leaf:M.leaf2);leaves.position.set(Math.cos(j*2.4)*.9,4.5+j*.6,Math.sin(j*2.4)*.9);tree.add(leaves);
 }
 if(i%13===5)addFallenTree(root,x+5,z,M,obstacles);
 root.add(tree);obstacles.push({x,z,radius:.4*scale});
 if(i%5===0&&!onForestRoad(x+3,z,2)){const rock=new THREE.Mesh(rockGeo.clone(),M.stone);rock.position.set(x+3,terrainHeight(x+3,z),z);rock.scale.set(1,.7,1.2);root.add(rock);obstacles.push({x:x+3,z,radius:1.2});}
 }
 batchStatic(root,root.children.filter(o=>o.userData.outerTerrain));root.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});scene.add(root);return {root,obstacles};
 }
 let previous='';
 return {
 surfaces(){return [...tiles.values()].flatMap(t=>t.root.children.filter(o=>o.userData.outerTerrain));},
 blocked(x,z){for(const tile of tiles.values())if(tile.obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.radius+.3))return true;return false;},
 tick(player,wet=0){
 road.userData.wet.value=wet;
 const cx=Math.floor((player.x+40)/size),cz=Math.floor(player.z/size),current=cx+':'+cz;
 if(previous===current)return;previous=current;
 const wanted=new Set();
 for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
 const x=cx+dx,z=cz+dz,key=x+':'+z;wanted.add(key);
 if((x+1)*size-40<WORLD.minX||x*size-40>WORLD.maxX||(z+1)*size<WORLD.minZ||z*size>WORLD.maxZ)continue;
 if(!tiles.has(key))tiles.set(key,generate(x,z));
 }
 for(const [key,tile]of tiles)if(!wanted.has(key)){scene.remove(tile.root);tile.root.traverse(o=>{if(o.isMesh)o.geometry.dispose();});tiles.delete(key);}
 }
 };
}
