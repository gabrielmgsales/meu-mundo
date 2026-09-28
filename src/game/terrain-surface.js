import { LAKE } from './region.js';
// World-space patches remain aligned when the terrain is edited or the camera moves.
export function detailTerrain(material) {
  material.onBeforeCompile = shader => {
    shader.uniforms.shoreLake={value:[LAKE.x,LAKE.z,LAKE.rx,LAKE.rz]};
    shader.uniforms.shoreLevel={value:LAKE.level};
    shader.vertexShader = 'varying vec3 soilWorld;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nsoilWorld=(modelMatrix*vec4(position,1.)).xyz;');
    shader.fragmentShader = `uniform vec4 shoreLake; uniform float shoreLevel; varying vec3 soilWorld;
float soilHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float soilNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(soilHash(i),soilHash(i+vec2(1,0)),f.x),mix(soilHash(i+vec2(0,1)),soilHash(i+vec2(1,1)),f.x),f.y);}
` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
vec2 p=soilWorld.xz;
float soilPatch=soilNoise(p*.27)*.65+soilNoise(p*1.1)*.35;
float bare=smoothstep(.5,.76,soilPatch);
float grains=soilNoise(p*85.);
float riverDistance=abs(p.x-(9.+sin(p.y*.075)*3.));
float lakeDistance=length((p-shoreLake.xy)/shoreLake.zw);
float riverBank=(1.-smoothstep(3.1,4.6,riverDistance))*(1.-smoothstep(.3,1.4,soilWorld.y));
float lakeBank=(1.-smoothstep(1.,1.13,lakeDistance))*(1.-smoothstep(shoreLevel+.25,shoreLevel+1.5,soilWorld.y));
float bank=clamp(max(riverBank,lakeBank),0.,1.);
vec3 turf=diffuseColor.rgb*(.77+.46*soilNoise(p*3.));
vec3 dirt=diffuseColor.rgb*vec3(1.48,1.06,.69);
diffuseColor.rgb=mix(turf,dirt,bare)*(.88+grains*.24);
vec3 shoreColor=mix(vec3(.16,.12,.075),vec3(.34,.28,.18),smoothstep(.25,.9,soilNoise(p*3.)));
diffuseColor.rgb=mix(diffuseColor.rgb,shoreColor*(.85+grains*.3),bank*.8);
vec2 cell=floor(p*18.),q=fract(p*18.)-.5;
float stones=(1.-smoothstep(.12,.28,length(q)))*step(.95,soilHash(cell));
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.3,1.22,1.12),stones*.6);
float litter=step(.965,soilHash(floor(p*8.)))*(1.-smoothstep(.1,.3,length(fract(p*8.)-.5)));
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.82,.57,.31),litter*.65);
`);
  };
  material.customProgramCacheKey = () => 'terrain-soil-grass-v1';
}

