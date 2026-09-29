import * as THREE from 'three';
import {WORLD} from './region.js';
import {terrainHeight} from './world-detail.js';
import {crossingHeight} from './crossings.js';
export const forestRoadZ=x=>360+26*Math.sin(x/180)*THREE.MathUtils.smoothstep(Math.abs(x-12),20,120);
export const onForestRoad=(x,z,margin=0)=>x>=WORLD.minX&&x<=WORLD.maxX&&Math.abs(z-forestRoadZ(x))<3.5+margin;
// Each streamed tile owns its road section; world-space UVs keep the soil continuous.
export function addForestRoad(root,tx,tz,material){
 const min=Math.max(WORLD.minX,tx*80-40),max=Math.min(WORLD.maxX,tx*80+40);
 if(max<=min)return;
 const positions=[],uvs=[],indices=[];
 const steps=Math.ceil((max-min)/.5),across=14;
 for(let i=0;i<=steps;i++){
 const x=min+(max-min)*i/steps,center=forestRoadZ(x);
 for(let j=0;j<=across;j++){
 const z=center+(j/across-.5)*7;
 positions.push(x,(crossingHeight(x,z)??terrainHeight(x,z))+.09,z);
 uvs.push(j/across,x-WORLD.minX);
 }
 }
 for(let i=0;i<steps;i++)for(let j=0;j<across;j++){
 const a=i*(across+1)+j,z=(positions[a*3+2]+positions[(a+across+2)*3+2])*.5;
 if(z<tz*80||z>=(tz+1)*80)continue;
 indices.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);
 }
 if(!indices.length)return;
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,material);mesh.name='Estrada da floresta';mesh.receiveShadow=true;root.add(mesh);
}
