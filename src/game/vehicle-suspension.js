import * as THREE from 'three';
export function suspensionPose(truck,height,turn=0,acceleration=0){
 const sample=(x,z)=>height(truck.x+x*Math.cos(truck.heading)+z*Math.sin(truck.heading),truck.z-x*Math.sin(truck.heading)+z*Math.cos(truck.heading));
 const front=(sample(-.855,1.5425)+sample(.855,1.5425))/2;
 const back=(sample(-.855,-1.5425)+sample(.855,-1.5425))/2;
 const left=(sample(-.855,1.5425)+sample(-.855,-1.5425))/2;
 const right=(sample(.855,1.5425)+sample(.855,-1.5425))/2;
 const speed=Math.abs(truck.speed||0);
 const vibration=Math.sin(truck.x*3.7+truck.z*4.1)*Math.sin(truck.z*2.3)*Math.min(.024,speed*.002);
 return {y:(front+back)/2+vibration,pitch:-Math.atan2(front-back,3.085)+THREE.MathUtils.clamp(acceleration*.006,-.045,.045),roll:Math.atan2(right-left,1.71)-turn*Math.min(.055,speed*.004)};
}
export function applySuspension(root,wheels,truck,height,dt,turn=0,acceleration=0,vertical=null){
 const pose=suspensionPose(truck,height,turn,acceleration),blend=dt===undefined?1:1-Math.exp(-dt*12);
 root.position.x=truck.x;root.position.z=truck.z;root.position.y=vertical?vertical.y-vertical.compression:THREE.MathUtils.lerp(root.position.y,pose.y,blend);
 root.rotation.y=truck.heading;root.rotation.x=vertical?.airborne?THREE.MathUtils.clamp(root.rotation.x+(dt||0)*.10,-.7,.7):THREE.MathUtils.lerp(root.rotation.x,pose.pitch,blend);root.rotation.z=vertical?.airborne?root.rotation.z:THREE.MathUtils.lerp(root.rotation.z,pose.roll,blend);
 root.updateMatrixWorld(true);
 for(const wheel of wheels){
 const world=root.localToWorld(new THREE.Vector3(wheel.position.x,.405,wheel.position.z));
 world.y=height(world.x,world.z)+.405;
 const local=root.worldToLocal(world);
 wheel.position.y=vertical?.airborne?.20:THREE.MathUtils.clamp(local.y,.12,.70);
 }
}
