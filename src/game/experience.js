import * as THREE from 'three';
import { LAKE, DOCK, WORLD } from './region.js';
import { createEnvironment, sourcePan, weatherAt } from './environment.js';
import { ValleyAudio } from './audio.js';
import { places, createSky, terrainHeight, riverCenter } from './world-detail.js';
import { isUnlocked, qualityPresets, prepareTea } from './rules.js';
import { dressAdventurer, createCartoonAtmosphere } from './cartoon.js';
const $ = id => document.getElementById(id);
export function createExperience({
  scene,
  M,
  player,
  arms,
  body,
  camera,
  renderer,
  sun,
  hemi,
  grass,
  water,
  ground,
  state,
  save,
  toast,
  refresh,
  home
}) {
  const audio = new ValleyAudio();
  audio.enabled = state.settings.sound;
  audio.volume = state.settings.volume;
  const skyUpdate = createSky(scene);
  const atmosphere = createCartoonAtmosphere(scene, M);
  let action = 0,
    actionType = 'wood',
    step = 0,
    bird = 0,
    shadowTimer = 0,
    mapTimer = 0;
  let tracked = 'spring';
  const originalGrassCount = grass.count;
  const shaderTime = {
    value: 0
  };
  grass.material.onBeforeCompile = shader => {
    shader.uniforms.valleyTime = shaderTime;
    shader.vertexShader = 'uniform float valleyTime;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
      transformed.x += sin(valleyTime*1.5+instanceMatrix[3].x*.4+instanceMatrix[3].z*.3)*max(0.0,position.y)*.18;
      #endif`);
  };
  water.material.onBeforeCompile = shader => {
    shader.uniforms.valleyTime = shaderTime;
    shader.vertexShader = 'uniform float valleyTime;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      transformed.y += sin(position.z*2.0+position.x+valleyTime*1.7)*.035;`);
  };
  const environment = createEnvironment({
    scene,
    player,
    water,
    ground,
    M
  });
  let environmentContext = {},
    climate = {
      rain: 0
    },
    shelter = 0;
  const listenerRight = new THREE.Vector3(),
    previousPosition = player.position.clone();
  const part = (geometry, material, parent, x, y, z) => {
    const o = new THREE.Mesh(geometry, material);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;
  };
  const outfit = dressAdventurer(player, M);
  const tool = new THREE.Group();
  tool.position.set(0, -.42, .04);
  arms[1].add(tool);
  tool.visible = false;
  part(new THREE.CylinderGeometry(.034, .046, .66, 7), M.log, tool, 0, -.05, 0);
  const axe = part(new THREE.BoxGeometry(.26, .18, .055), M.stone, tool, .08, .22, 0);
  const pick = part(new THREE.BoxGeometry(.48, .055, .065), M.stone, tool, 0, .23, 0);
  pick.visible = false;
  const particles = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.055, 0), M.gold, 40);
  particles.count = 0;
  scene.add(particles);
  const bits = [],
    dummy = new THREE.Object3D();
  const smokePositions = new Float32Array(22 * 3),
    smokeGeometry = new THREE.BufferGeometry();
  smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
  const puff = document.createElement('canvas');
  puff.width = puff.height = 64;
  const ctx = puff.getContext('2d'),
    gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, '#ffffff66');
  gradient.addColorStop(1, '#ffffff00');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const smoke = new THREE.Points(smokeGeometry, new THREE.PointsMaterial({
    map: new THREE.CanvasTexture(puff),
    color: '#dfdbc9',
    size: 1.1,
    transparent: true,
    opacity: .26,
    depthWrite: false
  }));
  scene.add(smoke);
  const fireflyPositions = new Float32Array(90 * 3);
  for (let i = 0; i < 90; i++) {
    fireflyPositions[i * 3] = (Math.random() - .5) * 60;
    fireflyPositions[i * 3 + 1] = 1 + Math.random() * 3;
    fireflyPositions[i * 3 + 2] = (Math.random() - .5) * 60;
  }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
  const fireflies = new THREE.Points(fg, new THREE.PointsMaterial({
    color: '#efda8e',
    size: .075,
    transparent: true,
    depthWrite: false
  }));
  scene.add(fireflies);
  function setQuality(key) {
    const preset = qualityPresets[key] || qualityPresets.medium;
    state.settings.quality = qualityPresets[key] ? key : 'medium';
    renderer.setPixelRatio(Math.min(devicePixelRatio, preset.pixelRatio));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = preset.shadows;
    sun.castShadow = preset.shadows;
    sun.shadow.mapSize.set(preset.shadowSize, preset.shadowSize);
    if (sun.shadow.map) {
      sun.shadow.map.dispose();
      sun.shadow.map = null;
    }
    scene.traverse(o => {
      if (o.material) {
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.needsUpdate = true;
      }
    });
    grass.count = Math.round(originalGrassCount * preset.grass);
    renderer.shadowMap.needsUpdate = true;
    $('quality').value = state.settings.quality;
  }
  setQuality(state.settings.quality);
  renderer.shadowMap.autoUpdate = false;
  $('quality').onchange = e => {
    setQuality(e.target.value);
    save();
  };
  function soundLabel() {
    $('sound').textContent = audio.enabled ? 'Som ligado' : 'Som desligado';
    $('sound').setAttribute('aria-pressed', String(audio.enabled));
  }
  soundLabel();
  $('volume').value = Math.round(audio.volume * 100);
  $('sound').onclick = async () => {
    audio.enabled = !audio.enabled;
    state.settings.sound = audio.enabled;
    await audio.unlock();
    audio.apply();
    soundLabel();
    save();
  };
  $('volume').oninput = e => {
    audio.volume = Number(e.target.value) / 100;
    state.settings.volume = audio.volume;
    audio.apply();
  };
  $('volume').onchange = save;
  $('prepare-tea').onclick = () => {
    if (!prepareTea(state.inventory)) return toast('Receita: 2 ervas do pomar + 1 água. Rende 3 alimentos.');
    toast('Chá de ervas preparado: +3 alimentos.');
    audio.play('crop');
    refresh();
    save();
  };
  window.addEventListener('pointerdown', () => audio.unlock(), {
    once: true
  });
  window.addEventListener('keydown', () => audio.unlock(), {
    once: true
  });
  const map = $('minimap'),
    mapCtx = map.getContext('2d');
  $('map-toggle').onclick = () => $('map-panel').classList.toggle('expanded');
  window.addEventListener('keydown', e => {
    if (e.code === 'KeyM' && !e.repeat && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) $('map-toggle').click();
  });
  $('journey').innerHTML = '';
  const journeyPanel = document.getElementById('journey');
  if (journeyPanel) journeyPanel.hidden = true;
  function updateMap() {
    const c = mapCtx,
      s = map.width,
      scale = s / (WORLD.maxX - WORLD.minX + 12),
      toX = x => s / 2 + (x - (WORLD.minX + WORLD.maxX) / 2) * scale,
      toY = z => s / 2 + z * scale;
    c.fillStyle = '#203a32';
    c.fillRect(0, 0, s, s);
    c.strokeStyle = '#405648';
    c.lineWidth = 1;
    for (let i = 0; i <= s; i += s / 5) {
      c.beginPath();
      c.moveTo(i, 0);
      c.lineTo(i, s);
      c.moveTo(0, i);
      c.lineTo(s, i);
      c.stroke();
    }
    c.strokeStyle = '#638e88';
    c.lineWidth = 5 * scale;
    c.beginPath();
    for (let z = -50; z <= 50; z++) c.lineTo(toX(riverCenter(z)), toY(z));
    c.stroke();
    c.fillStyle = '#638e88';
    c.beginPath();
    c.ellipse(toX(LAKE.x), toY(LAKE.z), LAKE.rx * scale, LAKE.rz * scale, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#b49f71';
    c.fillRect(toX(DOCK.minX), toY(DOCK.minZ), (DOCK.maxX - DOCK.minX) * scale, 3 * scale);
    if (state.boat) {
      c.fillStyle = '#fff4d0';
      c.beginPath();
      c.arc(toX(state.boat.x), toY(state.boat.z), 2, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = '#b49f71';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(toX(5), toY(0));
    c.lineTo(toX(13), toY(0));
    c.stroke();
    c.fillStyle = '#cbb88a';
    for (const b of [{
      x: -5,
      z: -5
    }, ...state.buildings]) c.fillRect(toX(b.x) - 2, toY(b.z) - 2, 4, 4);
    for (const p of places) {
      c.fillStyle = state.discovered.includes(p.id) ? '#90b796' : '#dfba74';
      c.beginPath();
      c.arc(toX(p.x), toY(p.z), p.id === tracked ? 4 : 2.5, 0, Math.PI * 2);
      c.fill();
    }
    c.save();
    c.translate(toX(player.position.x), toY(player.position.z));
    c.rotate(-player.rotation.y);
    c.fillStyle = '#fff4d0';
    c.beginPath();
    c.moveTo(0, 6);
    c.lineTo(-3, -4);
    c.lineTo(3, -4);
    c.closePath();
    c.fill();
    c.restore();
    $('coordinates').textContent = `${Math.round(player.position.x)} / ${Math.round(player.position.z)}`;
  }
  function discover() {
    for (const p of places) if (!state.discovered.includes(p.id) && Math.hypot(player.position.x - p.x, player.position.z - p.z) < 4.5) {
      state.discovered.push(p.id);
      if (p.id === 'quarry') {
        state.inventory.stone += 8;
        state.inventory.crystal += 2;
      }
      if (p.id === 'orchard') {
        state.inventory.food += 6;
        state.inventory.herbs += 3;
      }
      toast(`Exploração: ${p.reward}`);
      audio.play('discover');
      const button = document.querySelector(`[data-place="${p.id}"] small`);
      if (button) button.textContent = 'DESCOBERTO';
      tracked = places.find(q => !state.discovered.includes(q.id))?.id || p.id;
      refresh();
      save();
    }
  }
  function burst(type, target) {
    action = .65;
    actionType = type;
    tool.visible = ['wood', 'stone', 'crystal'].includes(type);
    axe.visible = type === 'wood';
    pick.visible = type !== 'wood';
    if (target && Number.isFinite(target.x)) player.rotation.y = Math.atan2(target.x - player.position.x, target.z - player.position.z);
    particles.material = ['stone', 'crystal'].includes(type) ? M.stone : type === 'wood' ? M.log : M.gold;
    const x = target?.x ?? player.position.x,
      z = target?.z ?? player.position.z;
    bits.length = 0;
    for (let i = 0; i < 24; i++) bits.push({
      x,
      y: terrainHeight(x, z) + .65,
      z,
      vx: (Math.random() - .5) * 2.8,
      vy: 1.5 + Math.random() * 2,
      vz: (Math.random() - .5) * 2.8,
      life: .6 + Math.random() * .3
    });
    audio.play(type);
    renderer.shadowMap.needsUpdate = true;
  }
  return {
    ambience(strength, context = {}) {
      environmentContext = context;
      camera.updateMatrixWorld();
      listenerRight.setFromMatrixColumn(camera.matrixWorld, 0);
      audio.ambience(strength, state.time, {
        pan: sourcePan(context.source || player.position, player.position, listenerRight),
        rain: climate.rain,
        shelter,
        altitude: player.position.y
      });
    },
    creature(type, source) {
      const distance = source.distanceTo(player.position);
      if (distance < 20) audio.creature(type, sourcePan(source, player.position, listenerRight), .035 * (1 - distance / 20));
    },
    ripple: environment.ripple,
    get busy() {
      return action > 0;
    },
    locked(type) {
      return !isUnlocked(type, state);
    },
    burst,
    paused(value) {
      audio.paused = value;
      audio.apply();
    },
    refresh() {
      document.querySelectorAll('[data-build]').forEach(button => {
        const locked = !isUnlocked(button.dataset.build, state);
        button.classList.toggle('locked', locked);
        button.title = locked ? button.dataset.build === 'well' ? 'Descubra o Santuário das águas' : 'Descubra a pedreira e faça uma colheita' : 'Selecione para construir';
      });
      $('explored').textContent = `${state.discovered.length} / 3 lugares descobertos`;
    },
    tick(dt, time, moving, paused) {
      mapTimer += dt;
      if (mapTimer > .15) {
        updateMap();
        mapTimer = 0;
      }
      if (paused) return;
      shaderTime.value = time;
      climate = weatherAt(state.day, state.time);
      const daylight = skyUpdate(state.time, climate.rain, time, camera.position);
      atmosphere.tick(dt, time, state.time, state.settings.quality);
      atmosphere.clouds.traverse(o => {
        if (o.material) o.material.color.set('#fff2d1').lerp(new THREE.Color('#606976'), climate.rain);
      });
      climate = environment.tick(dt, time, state, environmentContext) || climate;
      shelter += (Number(!!environmentContext.sheltered) - shelter) * (1 - Math.exp(-dt * 3));
      const traveled = player.position.distanceTo(previousPosition);
      moving = moving && traveled > .000001;
      previousPosition.copy(player.position);
      outfit.scarf.rotation.x = Math.sin(time * (moving ? 9 : 2)) * (moving ? .18 : .04 + climate.rain * .08);
      sun.intensity = (.18 + daylight * 2.4) * (1 - climate.rain * .65);
      hemi.intensity = (.32 + daylight * .82) * (1 - shelter * .92);
      sun.color.set(daylight > .5 ? '#fff1df' : '#9eb9dd');
      sun.target.position.set(player.position.x, player.position.y, player.position.z);
      sun.target.updateMatrixWorld();
      sun.position.set(player.position.x + Math.cos((state.time - 6) / 12 * Math.PI) * 32, player.position.y + 12 + Math.max(0, Math.sin((state.time - 6) / 12 * Math.PI)) * 35, player.position.z + 18);
      fireflies.material.opacity = (1 - daylight) * .8;
      fireflies.rotation.y = Math.sin(time * .015) * .1;
      M.glass.emissiveIntensity = .35 + (1 - daylight) * 1.5;
      shadowTimer += dt;
      if (shadowTimer > .12) {
        renderer.shadowMap.needsUpdate = true;
        shadowTimer = 0;
      }
      smoke.visible = home?.visible !== false;
      const hx = home?.position.x ?? -5,
        hz = home?.position.z ?? -5;
      for (let i = 0; i < 22; i++) {
        const age = (time * .35 + i / 22) % 1;
        smokePositions[i * 3] = hx + .8 + age * 1.5 + Math.sin(i + time * .6) * .16;
        smokePositions[i * 3 + 1] = terrainHeight(hx, hz) + 4.7 + age * 3;
        smokePositions[i * 3 + 2] = hz - .5 + age * .5;
      }
      smokeGeometry.attributes.position.needsUpdate = true;
      if (action > 0) {
        action = Math.max(0, action - dt);
        const swing = Math.sin((1 - action / .65) * Math.PI);
        arms[1].rotation.x = -swing * 2.1;
        arms[0].rotation.x = -swing * .7;
        body.rotation.x = swing * .15;
        if (action === 0) {
          tool.visible = false;
          body.rotation.x = 0;
        }
      }
      let count = 0;
      for (const bit of bits) {
        bit.life -= dt;
        if (bit.life <= 0) continue;
        bit.vy -= dt * 7;
        bit.x += bit.vx * dt;
        bit.y += bit.vy * dt;
        bit.z += bit.vz * dt;
        dummy.position.set(bit.x, bit.y, bit.z);
        dummy.scale.setScalar(Math.min(1, bit.life * 3));
        dummy.rotation.set(time * 3, bit.x, time);
        dummy.updateMatrix();
        particles.setMatrixAt(count++, dummy.matrix);
      }
      particles.count = count;
      particles.instanceMatrix.needsUpdate = true;
      if (moving) {
        step += dt;
        if (step > (traveled / Math.max(dt, .001) > 4.5 ? .24 : .36)) {
          audio.play(environmentContext.surface === 'wood' ? 'step-wood' : environmentContext.sheltered ? 'step-stone' : climate.wet > .4 ? 'step-wet' : 'step');
          step = 0;
        }
      } else step = 0;
      bird += dt;
      if (bird > 8 && daylight > .6) {
        audio.play('bird');
        bird = 0;
      }
      discover();
    }
  };
}
