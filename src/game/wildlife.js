import * as THREE from 'three';
import { createItem } from './models.js';
import { animals } from './catalogs.js';
import { terrainHeight } from './world-detail.js';
import { daytimeStrength } from './daylight.js';
export { daytimeStrength } from './daylight.js';
function seedFrom(id) {
  let n = 2166136261;
  for (const c of id) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
}
export function animalMotion(id, x, z) {
  let seed = seedFrom(id);
  const random = () => (seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296;
  return {
    x,
    z,
    homeX: x,
    homeZ: z,
    targetX: x,
    targetZ: z,
    wait: .4 + random() * 2,
    phase: random() * Math.PI * 2,
    heading: 0,
    walking: false,
    random
  };
}

// Short, checked steps prevent crossing river banks, cave walls and scenery.
export function stepAnimal(m, dt, {
  family = 'sheep',
  type = '',
  player,
  canEnter,
  height = () => 0,
  daylight = 1,
  moveSpeed,
  goal,
  restBehavior
} = {}) {
  if (dt <= 0) return;
  dt = Math.min(dt, .1);
  m.walking = false;
  m.playful = false;
  m.behavior = 'idle';
  m.phase += dt * .7;
  m.clock = (m.clock || 0) + dt;
  m.detour = Math.max(0, (m.detour || 0) - dt);
  const swimming = family === 'fish',
    slow = ['turtle', 'ape', 'armadillo'].includes(family);
  const dog = type === 'cachorro';
  const speed = moveSpeed ?? (swimming ? .65 : slow ? .22 : dog ? 4.2 : .48);
  const nocturnal = family === 'owl' || family === 'bat';
  const active = dog || swimming || (nocturnal ? daylight < .5 : daylight > .15);
  if (!active) {
    m.wait = Math.max(m.wait, .8);
    return;
  }
  if (goal && m.detour === 0) {
    m.targetX = goal.x;
    m.targetZ = goal.z;
    m.wait = 0;
    if (Math.hypot(goal.x - m.x, goal.z - m.z) < .22) {
      m.behavior = restBehavior || 'idle';
      return;
    }
  }
  const following = !goal && dog && player && Math.hypot(player.x - m.x, player.z - m.z) < 12 && Math.hypot(player.x - m.homeX, player.z - m.homeZ) < 8;
  if (following && m.detour === 0) {
    const distance = Math.hypot(player.x - m.x, player.z - m.z);
    if (distance < 3.2 && m.clock % 12 > 8) {
      m.targetX = m.x;
      m.targetZ = m.z;
      m.wait = .15;
      m.behavior = m.clock % 12 > 10 ? 'sit' : 'sniff';
      return;
    }
    // Run small playful arcs around the player, leaving personal space.
    const a = Math.atan2(m.x - player.x, m.z - player.z) + (distance < 3.2 ? .65 : 0);
    m.targetX = player.x + Math.sin(a) * 2.5;
    m.targetZ = player.z + Math.cos(a) * 2.5;
    m.playful = distance < 3.2;
    m.wait = 0;
  }
  if (m.wait > 0) {
    m.wait -= dt;
    m.behavior = dog ? 'sniff' : ['cow', 'bull', 'sheep', 'horse', 'goat', 'deer'].includes(family) ? 'graze' : 'idle';
    return;
  }
  let dx = m.targetX - m.x,
    dz = m.targetZ - m.z,
    distance = Math.hypot(dx, dz);
  if (distance < .12) {
    const angle = m.random() * Math.PI * 2,
      radius = (swimming ? 3 : dog ? 4.5 : 2.6) * Math.sqrt(m.random());
    m.targetX = m.homeX + Math.sin(angle) * radius;
    m.targetZ = m.homeZ + Math.cos(angle) * radius;
    m.wait = swimming ? .15 : dog ? .2 + m.random() * .8 : 1.2 + m.random() * 3.5;
    return;
  }
  const step = Math.min(distance, speed * dt);
  let heading = Math.atan2(dx, dz),
    x = m.x + Math.sin(heading) * step,
    z = m.z + Math.cos(heading) * step;
  const clearPath = (tx, tz) => {
    const samples = Math.max(1, Math.ceil(Math.hypot(tx - m.x, tz - m.z) / .08));
    for (let i = 1; i <= samples; i++) {
      const px = m.x + (tx - m.x) * i / samples,
        pz = m.z + (tz - m.z) * i / samples;
      if (!canEnter(px, pz) || Math.abs(height(px, pz) - height(m.x + (tx - m.x) * (i - 1) / samples, m.z + (tz - m.z) * (i - 1) / samples)) > .18) return false;
    }
    return true;
  };
  if (!clearPath(x, z)) {
    let alternate = false;
    if (dog || family === 'human' || goal) for (const turn of [Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI * .75, -Math.PI * .75, Math.PI]) {
      const a = heading + turn,
        tx = m.x + Math.sin(a) * .8,
        tz = m.z + Math.cos(a) * .8;
      if (!clearPath(tx, tz)) continue;
      heading = a;
      x = m.x + Math.sin(a) * step;
      z = m.z + Math.cos(a) * step;
      m.targetX = tx;
      m.targetZ = tz;
      m.detour = .6;
      m.wait = 0;
      alternate = true;
      break;
    }
    if (!alternate) {
      m.targetX = m.x;
      m.targetZ = m.z;
      m.wait = .3 + m.random();
      return;
    }
  }
  m.x = x;
  m.z = z;
  m.heading = heading;
  m.walking = true;
  m.playful ||= dog;
  m.phase += dt * (swimming ? 5 : dog ? 17 : 7);
}
export function animateAnimal(g, m, dt, {
  flying = false
} = {}) {
  const rig = g.userData.rig || [];
  const target = m.heading - g.rotation.y;
  if (m.walking || flying) g.rotation.y += Math.atan2(Math.sin(target), Math.cos(target)) * Math.min(1, dt * 7);
  g.rotation.z = m.walking ? Math.sin(m.phase) * .015 : 0;
  for (const joint of rig) {
    const {
      motion,
      side = 1,
      offset = 0
    } = joint.userData;
    if (motion === 'leg') {
      const target = m.walking ? Math.sin(m.phase + offset) * .45 : m.behavior === 'sit' ? joint.userData.arm ? -.3 : -1.1 : 0;
      joint.rotation.x += (target - joint.rotation.x) * (1 - Math.exp(-dt * 12));
    }
    if (motion === 'head') {
      const dip = ['graze', 'drink'].includes(m.behavior) ? .85 : m.behavior === 'sniff' ? .55 : m.behavior === 'sit' ? -.12 : 0;
      joint.rotation.x += (dip + Math.sin(m.phase * 2) * .025 - joint.rotation.x) * Math.min(1, dt * 5);
    }
    if (motion === 'wing') joint.rotation.z = flying ? side * (.12 + Math.sin(m.phase) * .65) : -side * 1.1;
    if (motion === 'tail') joint.rotation.y = Math.sin(m.phase * (g.userData.playfulDog ? 1.6 : 1)) * (g.userData.playfulDog ? .65 : m.walking ? .3 : .08);
  }
}
export function createDayBirds(scene) {
  const flock = new THREE.Group();
  flock.name = 'Passarinhos do dia';
  scene.add(flock);
  const birds = Array.from({
    length: 9
  }, (_, i) => {
    const item = animals.find(a => a.id === ['passaro', 'canario', 'periquito'][i % 3]);
    const g = createItem(item);
    flock.add(g);
    return {
      g,
      size: item.size * .28,
      phase: i * 2.399
    };
  });
  return {
    flock,
    tick(dt, time, hour) {
      const daylight = daytimeStrength(hour);
      flock.visible = daylight > 0;
      if (!flock.visible || dt <= 0) return;
      birds.forEach(({
        g,
        size,
        phase
      }, i) => {
        const path = birdFlight(time, i),
          next = birdFlight(time + .02, i);
        // Independent birds occasionally settle in a clearing; flocks keep flying.
        const cycle = (time + phase * 7) % 64,
          start = time - cycle + 46;
        const landing = i >= 6 && cycle > 46;
        const perch = {
          x: -12 + (i - 6) * 2.3,
          z: 4 + (i - 6) * 1.4
        };
        let landingBlend = 0;
        if (landing) {
          const ease = t => {
            t = Math.max(0, Math.min(1, t));
            return t * t * (3 - 2 * t);
          };
          landingBlend = ease((cycle - 46) / 4) * (1 - ease((cycle - 58) / 6));
          const flight = birdFlight(cycle < 50 ? start : time, i);
          path.x = flight.x + (perch.x - flight.x) * landingBlend;
          path.z = flight.z + (perch.z - flight.z) * landingBlend;
        }
        g.position.set(path.x, terrainHeight(path.x, path.z) + (7 + path.lift) * (1 - landingBlend), path.z);
        g.scale.setScalar(size * daylight);
        animateAnimal(g, {
          walking: landingBlend < .999,
          heading: Math.atan2(next.x - path.x, next.z - path.z),
          phase: time * 23 + phase
        }, dt, {
          flying: landingBlend < .999
        });
        g.rotation.z = Math.sin(time * .5 + phase) * .13 * (1 - landingBlend);
      });
    }
  };
}

// Smoothly gather and disperse two small flocks; three birds keep independent routes.
export function birdFlight(time, index) {
  const group = Math.floor(index / 3),
    slot = index % 3;
  const gathering = group < 2 ? (1 + Math.sin(time * .14 + group * Math.PI)) * .5 : 0;
  const a = time * (group === 2 ? .52 + slot * .015 : .48) + group * 2.1 + (1 - gathering) * slot * .45;
  const rx = 18 + group * 2,
    rz = 13 + group * 2;
  return {
    x: Math.sin(a) * rx + (group - 1) * 9 + gathering * (slot - 1) * .65,
    z: Math.cos(a) * rz + (group - 1) * 5 - gathering * Math.abs(slot - 1) * .85,
    lift: 1.8 + Math.sin(a * 1.5) * .8 + slot * .18
  };
}
