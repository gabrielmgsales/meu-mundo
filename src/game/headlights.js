import * as THREE from 'three';

// Local targets rotate and pitch with the vehicle, including on slopes.
export function createHeadlights(root,material){
 const lights=[-.72,.72].map(x=>{
  const light=new THREE.SpotLight('#fff4dd',0,65,.40,.55,2);
  light.name='Hilux headlight';light.position.set(x,1.34,2.62);
  light.target.position.set(x,.15,34);
  light.castShadow=true;light.shadow.mapSize.set(512,512);
  light.shadow.camera.near=.15;light.shadow.camera.far=65;
  light.shadow.bias=-.0003;light.shadow.normalBias=.035;
  root.add(light,light.target);return light;
 });
 return {lights,update(hour=12){
  const h=((hour%24)+24)%24;
  const strength=1-THREE.MathUtils.smoothstep(h,5.5,7)+THREE.MathUtils.smoothstep(h,17.5,19);
  for(const light of lights){light.intensity=1100*strength;light.visible=strength>.001;}
  if(material)material.emissiveIntensity=.05+strength*2.4;
 }};
}
