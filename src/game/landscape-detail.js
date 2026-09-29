import { windMaterial, rockSurface } from './natural-effects.js';
import * as THREE from 'three';
import { LAKE, onDock, mountainBlocked } from './region.js';
import { terrainHeight, riverCenter } from './world-detail.js';
import { grassGeometry } from './foliage.js';

export function rockGeometry(seed = 0) {
  const geometry = new THREE.SphereGeometry(1, 24, 18);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    const ridge=1+.13*Math.sin(x*8+z*5+seed)*Math.cos(y*9-seed)+.07*Math.sin(z*17+x*11+y*7);
    p.setXYZ(i,x*ridge,y*ridge,z*ridge);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function addShoreDetail(scene) {
  const count=600, dummy=new THREE.Object3D();
  const stones=new THREE.InstancedMesh(rockGeometry(7),new THREE.MeshStandardMaterial({color:'#8b8576',roughness:1}),count);
  const reeds=new THREE.InstancedMesh(grassGeometry(),new THREE.MeshStandardMaterial({color:'#657052',roughness:1}),count);
  rockSurface(stones.material);windMaterial(reeds.material);
  stones.name='Cascalho das margens'; reeds.name='Vegetação das margens';
  let seed=7841, stoneCount=0, reedCount=0;
  const random=()=> (seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296;
  for(let i=0;i<count;i++) {
    let x,z,water;
    if(i<300){z=-40+random()*80;x=riverCenter(z)+(i%2?1:-1)*(2.7+random()*1.3);water=.25;}
    else {const a=random()*Math.PI*2,offset=.98+random()*.12;x=LAKE.x+Math.cos(a)*LAKE.rx*offset;z=LAKE.z+Math.sin(a)*LAKE.rz*offset;water=LAKE.level;}
    const y=terrainHeight(x,z);
    if(onDock(x,z,2)||mountainBlocked(x,z)||Math.abs(z)<2||y<water-.3||y>water+1.25)continue;
    const size=.075+random()*.22;
    dummy.position.set(x,y+size*.12,z);dummy.scale.set(size*1.4,size*.6,size);dummy.rotation.set(random(),random()*6.28,random());dummy.updateMatrix();stones.setMatrixAt(stoneCount++,dummy.matrix);
    if(i%3===0&&y>water){dummy.position.y=y+.19;dummy.scale.set(.8,1.3+random(),.8);dummy.rotation.set(0,random()*6.28,0);dummy.updateMatrix();reeds.setMatrixAt(reedCount++,dummy.matrix);}
  }
  stones.count=stoneCount; reeds.count=reedCount;
  stones.receiveShadow=reeds.receiveShadow=true;
  scene.add(stones,reeds);
  return {stones,reeds};
}
