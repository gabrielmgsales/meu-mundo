import * as THREE from 'three';

// Continuous metre-scaled soil detail, shared by the village and western trail.
export function createRoadMaterial() {
  const material = new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1});
  material.userData.wet={value:0};
  material.onBeforeCompile = shader => {
    shader.uniforms.roadWet=material.userData.wet;
    shader.vertexShader = 'varying vec2 roadUV;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nroadUV = uv;');
    shader.fragmentShader = `uniform float roadWet; varying vec2 roadUV;
float roadHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float roadNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(roadHash(i),roadHash(i+vec2(1,0)),f.x),mix(roadHash(i+vec2(0,1)),roadHash(i+vec2(1,1)),f.x),f.y);}
` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
vec2 soilPoint=vec2(roadUV.x*2.4,roadUV.y);
float patches=roadNoise(soilPoint*1.8)*.65+roadNoise(soilPoint*7.0)*.35;
float grain=roadNoise(soilPoint*170.0);
float rut=exp(-pow((roadUV.x-.28)*19.0,2.0))+exp(-pow((roadUV.x-.72)*19.0,2.0));
vec3 soil=mix(vec3(.22,.135,.072),vec3(.46,.32,.185),patches);
soil*=.86+grain*.28;
soil*=1.0-rut*(.13+.09*roadNoise(soilPoint*18.0));
vec2 cell=floor(soilPoint*43.0), within=fract(soilPoint*43.0)-.5;
float pebble=(1.0-smoothstep(.12,.29,length(within)))*step(.78,roadHash(cell));
soil=mix(soil,vec3(.43,.39,.30)*(.8+roadHash(cell)*.4),pebble*.72);
float shoulder=smoothstep(.34,.5,abs(roadUV.x-.5));
soil=mix(soil,vec3(.18,.19,.105),shoulder*(.22+.32*roadNoise(soilPoint*22.0)));
float tread=pow(max(0.,sin(roadUV.y*24.+abs(roadUV.x-.5)*42.)),7.)*rut;
soil*=1.-tread*.16;
float puddle=smoothstep(.66,.80,roadNoise(vec2(roadUV.x*9.,roadUV.y*.37)))*(1.-shoulder)*roadWet;
soil=mix(soil,vec3(.12,.14,.13),puddle*.7);
soil*=1.-roadWet*.18;
diffuseColor.rgb*=soil;
`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.13,puddle);');
  };
  material.customProgramCacheKey = () => 'natural-dirt-road-v2';
  return material;
}
