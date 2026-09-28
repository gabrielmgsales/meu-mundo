import * as THREE from 'three';
import { daytimeStrength } from './daylight.js';
export function skyPalette(hour, rain = 0) {
  const day = daytimeStrength(hour),
    dusk = Math.max(0, 1 - Math.abs(hour - 18) / 2.2);
  const top = new THREE.Color('#101c36').lerp(new THREE.Color('#79a8ce'), day);
  const bottom = new THREE.Color('#344568').lerp(new THREE.Color('#ced9e2'), day).lerp(new THREE.Color('#ff936a'), dusk * .85);
  top.lerp(new THREE.Color(day > .1 ? '#535e6c' : '#192431'), rain);
  bottom.lerp(new THREE.Color(day > .1 ? '#939ba4' : '#394451'), rain);
  return {
    top,
    bottom,
    day,
    dusk
  };
}
export function createPanoramicSky(scene) {
  const uniforms = {
    top: {
      value: new THREE.Color()
    },
    bottom: {
      value: new THREE.Color()
    },
    rain: {
      value: 0
    },
    time: {
      value: 0
    }
  };
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms,
    vertexShader: 'varying vec3 skyDirection;void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `
    varying vec3 skyDirection;uniform vec3 top,bottom;uniform float rain,time;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    void main(){vec3 d=normalize(skyDirection);float h=smoothstep(-.06,.8,d.y);vec3 color=mix(bottom,top,h);
      vec2 p=d.xz/(abs(d.y)+.25)*3.+vec2(time*.006,0.);float n=noise(p)*.55+noise(p*2.1)*.3+noise(p*4.3)*.15;
      float cloud=smoothstep(.26,.72,n)*rain*smoothstep(-.02,.15,d.y);
      color=mix(color,mix(bottom*.75,top*.56,n),cloud*.9);gl_FragColor=vec4(color,1.);
    }`
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(4200, 32, 16), material);
  sky.name = 'Céu panorâmico';
  sky.renderOrder = -10;
  scene.add(sky);
  const celestial = new THREE.Group();
  scene.add(celestial);
  let seed = 431;
  const random = () => (seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296;
  const starsGeo = new THREE.BufferGeometry(),
    starsPos = [];
  for (let i = 0; i < 1100; i++) {
    const a = random() * Math.PI * 2,
      h = .06 + random() * .94,
      r = Math.sqrt(1 - h * h) * 2400;
    starsPos.push(Math.cos(a) * r, h * 2400, Math.sin(a) * r);
  }
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsPos, 3));
  const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({
    color: '#e0eaff',
    size: 2.2,
    transparent: true,
    opacity: 0,
    depthWrite: false
  }));
  stars.name = 'Estrelas';
  celestial.add(stars);
  const moon = new THREE.Group();
  moon.name = 'Lua';
  celestial.add(moon);
  moon.position.set(-1000, 540, -500);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(36, 32, 24), new THREE.MeshBasicMaterial({
    color: '#f0eddb',
    transparent: true
  }));
  moon.add(globe);
  for (let i = 0; i < 18; i++) {
    const x = (random() - .5) * 48,
      y = (random() - .5) * 48,
      r = Math.hypot(x, y);
    if (r > 29) continue;
    const crater = new THREE.Mesh(new THREE.CircleGeometry(2 + random() * 4, 16), new THREE.MeshBasicMaterial({
      color: '#b7c2c7',
      transparent: true,
      opacity: .3,
      depthWrite: false
    }));
    crater.position.set(x, y, Math.sqrt(36 * 36 - r * r) + .2);
    moon.add(crater);
  }
  const sun = new THREE.Mesh(new THREE.SphereGeometry(38, 24, 16), new THREE.MeshBasicMaterial({
    color: '#ffcf85',
    transparent: true,
    depthWrite: false
  }));
  celestial.add(sun);
  const meteorGeo = new THREE.BufferGeometry(),
    meteorPos = new Float32Array(32 * 3);
  meteorGeo.setAttribute('position', new THREE.BufferAttribute(meteorPos, 3));
  const meteor = new THREE.Line(meteorGeo, new THREE.LineBasicMaterial({
    color: '#d7eeff',
    transparent: true,
    opacity: 0,
    depthWrite: false
  }));
  meteor.name = 'Estrela cadente';
  meteor.frustumCulled = false;
  celestial.add(meteor);
  const head = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 6), new THREE.MeshBasicMaterial({
    color: '#ffffff'
  }));
  celestial.add(head);
  return (hour, rain = 0, time = 0, viewer = new THREE.Vector3()) => {
    const p = skyPalette(hour, rain);
    uniforms.top.value.copy(p.top);
    uniforms.bottom.value.copy(p.bottom);
    uniforms.rain.value = rain;
    uniforms.time.value = time;
    sky.position.copy(viewer);
    celestial.position.copy(viewer);
    scene.fog.color.copy(p.bottom);
    const night = (1 - p.day) * (1 - rain);
    stars.material.opacity = night * .85;
    moon.visible = night > .03;
    moon.lookAt(viewer);
    moon.traverse(o => {
      if (o.material) o.material.opacity = (o === globe ? 1 : .3) * night;
    });
    const phase = (hour - 6) / 12 * Math.PI;
    sun.position.set(Math.cos(phase) * 1400, Math.sin(phase) * 900, -180);
    sun.visible = hour > 5.7 && hour < 18.3;
    sun.material.opacity = (1 - rain) * .95;
    sun.material.color.set(p.dusk > .4 ? '#ffae69' : '#fff0bb');
    const age = (time + 5) % 38,
      active = night > .3 && age < 1.8;
    meteor.visible = head.visible = active;
    if (active) {
      for (let i = 0; i < 32; i++) {
        const t = age - i * .012;
        meteorPos[i * 3] = -800 + t * 260;
        meteorPos[i * 3 + 1] = 620 - t * 140;
        meteorPos[i * 3 + 2] = -380 + t * 55;
      }
      meteorGeo.attributes.position.needsUpdate = true;
      meteor.material.opacity = Math.sin(age / 1.8 * Math.PI) * night;
      head.position.fromArray(meteorPos);
    }
    return p.day;
  };
}
