import { grassGeometry } from './foliage.js';
import * as THREE from 'three';
import { inWorld, onDock, onOverlook, mountainBlocked } from './region.js';

// Reuse a small instanced patch around the observer instead of thousands of objects.
export function createGroundLife(scene) {
  const dummy = new THREE.Object3D(),
    capacity = 400;
  const grass = new THREE.InstancedMesh(grassGeometry(), new THREE.MeshStandardMaterial({
    color: '#6a7751',
    roughness: 1
  }), capacity);
  const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.09, 0), new THREE.MeshStandardMaterial({
    color: '#e7c38f',
    roughness: 1
  }), capacity);
  const stones = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.13, 0), new THREE.MeshStandardMaterial({
    color: '#99978c',
    roughness: 1
  }), capacity);
  const puddles = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 20), new THREE.MeshStandardMaterial({
    color: '#819fa4',
    transparent: true,
    opacity: 0,
    roughness: .12,
    metalness: .35,
    depthWrite: false
  }), 40);
  for (const mesh of [grass, flowers, stones, puddles]) {
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  let cell = '',
    patch = [];
  const hash = (x, z) => {
    const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  return {
    grass,
    flowers,
    stones,
    puddles,
    tick(dt, time, player, climate, context, quality) {
      if (dt <= 0 || !context.landHeight) return;
      const key = `${Math.floor(player.x / 10)},${Math.floor(player.z / 10)},${quality},${Math.floor(time / 2)}`;
      if (key !== cell) {
        cell = key;
        patch = [];
        const count = quality === 'low' ? 180 : capacity;
        const ox = Math.floor(player.x / 10) * 10,
          oz = Math.floor(player.z / 10) * 10;
        for (let i = 0; i < count; i++) {
          const cluster=Math.floor(i/8), gx=cluster%8-4, gz=Math.floor(cluster/8)-3;
          const cx=ox+gx*7+hash(gx+ox,gz+oz)*4, cz=oz+gz*7+hash(gz+oz,gx+ox)*4;
          const angle=hash(i+ox,cz)*Math.PI*2, radius=Math.sqrt(hash(cx,i+oz))*2.4;
          const x=cx+Math.cos(angle)*radius,z=cz+Math.sin(angle)*radius;
          if(hash(Math.floor(cx/9),Math.floor(cz/9))<.2)continue;
          // Keep the central village approach clear of the denser plant clusters.
          if(z>-35 && z<36 && Math.abs(x+3-Math.sin(z*.11)*2)<2.2)continue;
          if (!inWorld(x, z, 2) || onDock(x, z, 2) || onOverlook(x, z, 3) || mountainBlocked(x, z) || context.waterAt?.(x, z) != null || context.detailBlocked?.(x, z) || Math.abs(z) < 1.5) continue;
          const y = context.landHeight(x, z),
            slope = Math.abs(y - context.landHeight(x + .5, z)) + Math.abs(y - context.landHeight(x, z + .5));
          patch.push({
            x,
            y,
            z,
            slope,
            seed: hash(x, z)
          });
        }
      }
      let g = 0,
        f = 0,
        s = 0,
        p = 0;
      for (const v of patch) {
        dummy.position.set(v.x, v.y + .19, v.z);
        dummy.scale.setScalar(.6 + v.seed);
        dummy.rotation.set(0, v.seed * 6, Math.sin(time * 1.8 + v.x) * (.08 + climate.rain * .13));
        dummy.updateMatrix();
        grass.setMatrixAt(g++, dummy.matrix);
        if (v.seed > .94) {
          dummy.position.y = v.y + .43;
          dummy.scale.setScalar(.32 + v.seed * .2);
          dummy.updateMatrix();
          flowers.setMatrixAt(f++, dummy.matrix);
        }
        if (v.seed < .18) {
          dummy.position.y = v.y + .06;
          dummy.scale.set(1.4, .45, 1);
          dummy.updateMatrix();
          stones.setMatrixAt(s++, dummy.matrix);
        }
        if (v.seed > .88 && v.slope < .035 && p < 40) {
          dummy.position.set(v.x, v.y + .025, v.z);
          dummy.rotation.set(-Math.PI / 2, 0, v.seed * 6);
          dummy.scale.set((.3 + climate.wet) * .9, (.3 + climate.wet) * .5, 1);
          dummy.updateMatrix();
          puddles.setMatrixAt(p++, dummy.matrix);
        }
      }
      for (const [mesh, count] of [[grass, g], [flowers, f], [stones, s], [puddles, p]]) {
        mesh.count = count;
        mesh.instanceMatrix.needsUpdate = true;
      }
      puddles.visible = climate.wet > .08;
      puddles.material.opacity = climate.wet * .48;
    }
  };
}
