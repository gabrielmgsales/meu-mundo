import * as THREE from 'three';
export const windTime={value:0}, windStrength={value:.7};
export function windMaterial(material){
 if(material.userData.wind)return;material.userData.wind=true;
 const previous=material.onBeforeCompile;
 material.onBeforeCompile=shader=>{previous(shader);shader.uniforms.landWindTime=windTime;shader.uniforms.landWindStrength=windStrength;
 shader.vertexShader='uniform float landWindTime; uniform float landWindStrength;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvec3 windP=(modelMatrix*vec4(position,1.)).xyz;\nfloat sway=sin(windP.x*.31+windP.z*.19+landWindTime*1.5);\ntransformed.x+=sway*.035*landWindStrength; transformed.z+=sin(windP.z*.4+landWindTime)*.022*landWindStrength;');};
 material.customProgramCacheKey=()=> 'foliage-wind-v1';material.needsUpdate=true;
}
export function rockSurface(material){
 material.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 rockP;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrockP=(modelMatrix*vec4(position,1.)).xyz;');
 shader.fragmentShader='varying vec3 rockP;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat strata=sin(rockP.y*15.+sin(rockP.x*3.)+sin(rockP.z*4.));\nfloat crack=1.-smoothstep(.02,.10,abs(strata));\nfloat grain=fract(sin(dot(floor(rockP.xz*80.),vec2(127.1,311.7)))*43758.5453);\ndiffuseColor.rgb*= (.85+grain*.25)*(1.-crack*.25);\nfloat moss=(1.-smoothstep(.5,2.5,rockP.y)) * smoothstep(.25,.8,sin(rockP.x*2.)*sin(rockP.z*3.));\ndiffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.55,.75,.4),moss*.55);');
 };material.customProgramCacheKey=()=> 'weathered-rock-v1';
}
