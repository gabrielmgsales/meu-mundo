import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { terrainHeight } from './world-detail.js';
import { cellKey } from './creative-state.js';
export function createQuarry(material, removed = []) {
  const mined = new Set(removed),
    cells = [],
    cellIndex = new Map();
  const mesh = new THREE.InstancedMesh(new RoundedBoxGeometry(1.06, 1.06, 1.06, 1, .09), material, 16 * 8 * 12);
  mesh.name = 'Paredão escavável';
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D();
  function update(i) {
    const cell = cells[i];
    dummy.position.set(cell.x, cell.y, cell.z);
    dummy.scale.setScalar(mined.has(cell.key) ? 0 : 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.instanceMatrix.needsUpdate = true;
  }
  for (let x = 0; x < 16; x++) for (let y = 0; y < 8; y++) for (let z = 0; z < 12; z++) {
    const wx = 18 + x,
      wz = -28 + z,
      key = cellKey(x, y, z),
      id = cells.length;
    cells.push({
      key,
      x: wx,
      y: terrainHeight(wx, wz) + y + .5,
      z: wz,
      layer: y
    });
    cellIndex.set(key, id);
    update(id);
  }
  mesh.computeBoundingSphere();
  function solid(x, z) {
    const ix = Math.round(x) - 18,
      iz = Math.round(z) + 28;
    if (ix < 0 || ix >= 16 || iz < 0 || iz >= 12) return false;
    return [0, 1].some(y => !mined.has(cellKey(ix, y, iz)));
  }
  // Character radius keeps shoulders outside the remaining stone at tunnel edges.
  function blocked(x, z) {
    return [[0, 0], [.22, 0], [-.22, 0], [0, .22], [0, -.22]].some(([dx, dz]) => solid(x + dx, z + dz));
  }
  return {
    mesh,
    mined,
    cells,
    cellIndex,
    update,
    solid,
    blocked
  };
}
