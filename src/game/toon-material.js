import * as THREE from 'three';
// Shared name retained for scene modules; lighting is now continuous and physically based.
export function cartoonMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .88, metalness: 0, ...options });
}
