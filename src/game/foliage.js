import * as THREE from 'three';
// Individual bent leaves, with gaps between branches instead of solid canopy spheres.
// Local deterministic stream must never consume the world's saved-object random stream.
export function foliageGeometry(radius = 1, pine = false, variation = 0) {
  let seed = 917;
  const rand = () => (seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296;
  const vertices = [], colors = [], uvs = [];
  const count = pine ? 240 : 260;
  for (let i=0;i<count;i++) {
    const angle=rand()*Math.PI*2, height=rand()*2-1;
    const spread=Math.sqrt(rand())*(pine ? (1-height)*.5 : Math.sqrt(1-height*height));
    const center=new THREE.Vector3(Math.cos(angle)*spread*radius,height*radius*.7,Math.sin(angle)*spread*radius);
    const length=(pine?.105:.085)*Math.min(radius,1.5)*(.7+rand()*.6), width=length*(pine?.22:.58);
    const rotation=new THREE.Euler(rand()*2,rand()*6.28,rand()*2);
    const points=[[-width,0,-length*.28],[0,length*.12,-length],[width,0,-length*.28],[width*.75,-length*.04,length*.55],[0,-length*.1,length],[-width*.75,-length*.04,length*.55]].map(p=>new THREE.Vector3(...p).applyEuler(rotation).add(center));
    for(const index of [0,1,2,0,2,3,0,3,5,3,4,5,2,1,0,3,2,0,5,3,0,5,4,3]) {const p=points[index];vertices.push(p.x,p.y,p.z);uvs.push(index%2,index<2?0:1); const shade=.83+(i%7)*.027; colors.push(shade*(.88+variation*.22),shade*(.96-variation*.09),shade*(.81-variation*.18));}
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  return geometry;
}

export function grassGeometry() {
 const vertices=[];
 for(let i=0;i<7;i++) {
  const a=i*2.4, x=Math.cos(a)*.11,z=Math.sin(a)*.11,h=.23+(i%3)*.07;
  const dx=Math.cos(a)*.017,dz=Math.sin(a)*.017;
  const p=[x-dx,-.19,z-dz,x+dx,-.19,z+dz,x+.065*Math.cos(a),h-.19,z+.065*Math.sin(a)];
  vertices.push(...p,...p.slice(6,9),...p.slice(3,6),...p.slice(0,3));
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(vertices.length/3*2).fill(0),2));g.computeVertexNormals();return g;
}
