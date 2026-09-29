import { terrainHeight } from './world-detail.js';
import * as THREE from 'three';
import { createGroundLife } from './ground-life.js';
const smooth = (a, b, v) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// World time, rather than wall-clock time, keeps weather continuous across saves.
export function weatherAt(day, hour) {
  const cycle = ((day * 24 + hour) % 43 + 43) % 43;
  const rain = smooth(15, 17, cycle) * (1 - smooth(20, 22, cycle));
  return {
    rain,
    mist: smooth(4, 5, hour) * (1 - smooth(7, 9, hour)),
    wet: Math.max(rain, smooth(17, 20, cycle) * (1 - smooth(22, 26, cycle)))
  };
}
export function sourcePan(source, listener, right) {
  const x = source.x - listener.x,
    z = source.z - listener.z;
  return Math.max(-1, Math.min(1, (x * right.x + z * right.z) / Math.max(1, Math.hypot(x, z))));
}
export function createEnvironment({
  scene,
  player,
  water,
  ground,
  M
}) {
  const groundLife = createGroundLife(scene);
  const heightData=new Float32Array(512*128);
  const bedMap=new THREE.DataTexture(heightData,512,128,THREE.RedFormat,THREE.FloatType);
  bedMap.minFilter=bedMap.magFilter=THREE.NearestFilter;
  let bedTimer=5;
  const updateBed=height=>{
    for(let z=0;z<128;z++)for(let x=0;x<512;x++)heightData[z*512+x]=height(-215+(x+.5)/512*344,-43+(z+.5)/128*86);
    bedMap.needsUpdate=true;
  };
  updateBed(terrainHeight);
  const reflection = {
    value: new THREE.Color('#a9cbd9')
  };
  const count = 500,
    positions = new Float32Array(count * 6);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const rain = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
    color: '#c6e0ea',
    transparent: true,
    opacity: 0,
    depthWrite: false
  }));
  rain.frustumCulled = false;
  rain.name = 'Chuva suave';
  scene.add(rain);
  const rings = Array.from({
    length: 32
  }, () => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(.88, 1, 24), new THREE.MeshBasicMaterial({
      color: '#d6f2ee',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide
    }));
    ring.name = 'Ondulação';
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    scene.add(ring);
    return {
      ring,
      age: 2
    };
  });
  let cursor = 0,
    rainClock = 0;
  const baseWater = water.material.color.clone(),
    wetColor = new THREE.Color('#64949e');
  const shimmer = {
    value: 0
  };
  // Moving highlights stay on every water surface, including player-created lakes.
  const previousCompile = water.material.onBeforeCompile;
  water.material.onBeforeCompile = shader => {
    previousCompile(shader);
    shader.uniforms.surfaceTime = shimmer;
    shader.uniforms.bedMap = {value:bedMap};
    shader.uniforms.reflectedSky = reflection;
    shader.vertexShader = 'varying vec3 surfacePosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nsurfacePosition=(modelMatrix*vec4(position,1.0)).xyz;');
    shader.fragmentShader = 'uniform sampler2D bedMap; uniform float surfaceTime; uniform vec3 reflectedSky; varying vec3 surfacePosition;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float wave=sin(surfacePosition.x*5.0+surfacePosition.z*2.0+surfaceTime*1.6)*sin(surfacePosition.z*3.0-surfaceTime);
      vec2 bedUV=(surfacePosition.xz-vec2(-215.,-43.))/vec2(344.,86.);
      float bed=texture2D(bedMap,clamp(bedUV,vec2(0.),vec2(1.))).r;
      if(bedUV.x<0. || bedUV.x>1. || bedUV.y<0. || bedUV.y>1.) bed=-2.45;
      float depth=max(0.,surfacePosition.y-bed);
      float deep=smoothstep(.15,3.5,depth);
      diffuseColor.rgb*=mix(vec3(1.12,1.08,.86),vec3(.42,.66,.78),deep);
      diffuseColor.a*=mix(.24,1.,smoothstep(.0,1.6,depth));
      diffuseColor.rgb+=vec3(.025,.035,.04)*pow(max(0.0,wave),12.0);`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
      normal=normalize(normal+vec3(cos(surfacePosition.x*2.0+surfaceTime)*.045,0.0,sin(surfacePosition.z*2.4-surfaceTime)*.045));
      float reflectionStrength=pow(1.0-abs(dot(normal,normalize(vViewPosition))),3.0);
      diffuseColor.rgb=mix(diffuseColor.rgb,reflectedSky,reflectionStrength*.65);`);
  };
  water.material.needsUpdate = true;
  function ripple(x, z, y = .25, strength = 1) {
    const r = rings[cursor++ % rings.length];
    r.age = 0;
    r.strength = strength;
    r.ring.position.set(x, y + .045, z);
    r.ring.visible = true;
  }
  return {
    ripple,
    tick(dt, time, state, context = {}) {
      if (dt <= 0) return;
      const climate = weatherAt(state.day, state.time);
      shimmer.value = time;
      bedTimer+=dt;
      if(bedTimer>=5){updateBed(context.landHeight || terrainHeight);bedTimer=0;}
      groundLife.tick(dt, time, player.position, climate, context, state.settings.quality);
      reflection.value.copy(scene.fog.color);
      rain.visible = climate.rain > .01 && !context.sheltered;
      rain.material.opacity = climate.rain * .32;
      const drops = state.settings.quality === 'low' ? 150 : count;
      geometry.setDrawRange(0, drops * 2);
      for (let i = 0; i < drops; i++) {
        const x = player.position.x + i * 7.139 % 28 - 14,
          z = player.position.z + i * 13.713 % 28 - 14;
        const y = player.position.y + 18 - (time * 13 + i * .71) % 19,
          p = i * 6;
        positions.set([x, y, z, x + .12, y - .65, z + .06], p);
      }
      geometry.attributes.position.needsUpdate = true;
      for (const r of rings) {
        r.age += dt;
        if (r.age > 1.5) {
          r.ring.visible = false;
          continue;
        }
        r.ring.scale.setScalar((.12 + r.age * .9) * r.strength);
        r.ring.material.opacity = (1 - r.age / 1.5) * .32;
      }
      rainClock += dt;
      if (climate.rain > .1 && rainClock > .08) {
        rainClock = 0;
        const x = player.position.x + Math.sin(time * 19) * 10,
          z = player.position.z + Math.cos(time * 13) * 10,
          y = context.waterAt?.(x, z);
        if (y != null) ripple(x, z, y, .45);
      }
      water.material.color.copy(baseWater).lerp(wetColor, climate.rain * .4);
      water.material.roughness = .23 - climate.wet * .1;
      if (ground) {
        ground.material.color.copy(ground.userData.biomeColor || new THREE.Color('#ffffff'));
        ground.material.color.multiply(new THREE.Color().setRGB(1 - climate.wet * .18, 1 - climate.wet * .15, 1 - climate.wet * .1));
      }
      const altitude = Math.max(0, Math.min(1, (player.position.y - 12) / 50));
      scene.fog.density = (.0045 + climate.mist * .009) * (1 - altitude) + .00038 * altitude + climate.rain * .006;
      scene.fog.color.lerp(new THREE.Color('#93a5b0'), climate.rain * .45);
      return climate;
    }
  };
}
