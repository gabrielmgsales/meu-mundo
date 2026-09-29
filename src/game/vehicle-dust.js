import {onDock,onOverlook} from './region.js';
import {riverCenter} from './world-detail.js';
import * as THREE from 'three';
import {onForestRoad} from './forest-road.js';
import {crossingHeight} from './crossings.js';
export function createVehicleDust(scene){
 const count=96,positions=new Float32Array(count*3),ages=new Float32Array(count).fill(9),opacity=new Float32Array(count),velocity=new Float32Array(count*3);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('alpha',new THREE.BufferAttribute(opacity,1));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{size:{value:280}},vertexShader:'attribute float alpha; varying float fade; uniform float size; void main(){fade=alpha;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=min(80.,size/max(1.,-p.z));}',fragmentShader:'varying float fade; void main(){float r=length(gl_PointCoord-.5)*2.;float a=(1.-smoothstep(.1,1.,r))*fade;if(a<.005)discard;gl_FragColor=vec4(.47,.36,.23,a);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
 // Shader include directives must start on their own line.
 material.fragmentShader=material.fragmentShader.replace(';#include',';\n#include');
 const cloud=new THREE.Points(geometry,material);cloud.frustumCulled=false;scene.add(cloud);let cursor=0,budget=0;
 return {tick(dt,truck,wet,low=false){if(dt<=0)return;
 const speed=Math.abs(truck?.speed||0),skid=truck?.skid||0;
 const bridge=Math.abs(truck.z)<1.5&&Math.abs(truck.x-riverCenter(truck.z))<4;
 const emit=truck?.occupied&&!truck.airborne&&truck.dirt!==false&&speed>2&&!bridge&&!onDock(truck.x,truck.z)&&!onOverlook(truck.x,truck.z)&&crossingHeight(truck.x,truck.z)===null;
 const terrain=onForestRoad(truck.x,truck.z)?1:.5;
 material.uniforms.size.value=280+skid*170;
 budget+=emit?dt*speed*(low?1.5:4)*terrain*(1+skid*2)*(1-wet):0;
 while(budget>=1){budget--;const i=cursor++%count,side=i%2?1:-1;positions[i*3]=truck.x+Math.cos(truck.heading)*side*.85-Math.sin(truck.heading)*1.6;positions[i*3+1]=truck.y+.3;positions[i*3+2]=truck.z-Math.sin(truck.heading)*side*.85-Math.cos(truck.heading)*1.6;ages[i]=0;velocity[i*3]=Math.cos(truck.heading)*side*(.3+skid*.8)-Math.sin(truck.motionHeading??truck.heading)*speed*.06;velocity[i*3+1]=.35+(i%5)*.07;velocity[i*3+2]=-Math.sin(truck.heading)*side*(.3+skid*.8)-Math.cos(truck.motionHeading??truck.heading)*speed*.06;}
 for(let i=0;i<count;i++){ages[i]+=dt;opacity[i]=Math.max(0,1-ages[i]/1.8)*.22;for(let j=0;j<3;j++)positions[i*3+j]+=velocity[i*3+j]*dt;}
 geometry.attributes.position.needsUpdate=true;geometry.attributes.alpha.needsUpdate=true;
 }};
}
