import * as THREE from 'three';
import { onDock, DOCK } from './region.js';
export function createPlayerMovement({
  player,
  body,
  legs,
  arms,
  height,
  riverX,
  waterAt = () => null,
  blocked
}) {
  player.rotation.order='YXZ';
  let swimDepth=0, swimPhase=0;
  const waterLevel=()=>{
    const x=player.position.x,z=player.position.z;
    if(onDock(x,z)||Math.abs(z)<1.4&&Math.abs(x-riverX(z))<3.8)return null;
    return waterAt(x,z);
  };
  let gaitPhase = 0,
    gaitWeight = 0,
    seatWeight = 0;
  const lastWalkPosition = player.position.clone();
  return function stepPlayer({
    dt,
    elapsed,
    keys,
    angle,
    boating,
    pose,
    busy
  }) {
    if(dt<=0)return;
    const wasSwimming=!!player.userData.swimming;
    const seated = boating.occupied || pose && pose.active && pose.type === 'sit';
    const lying = pose && pose.active && pose.type === 'lie';
    const canMove = !pose || !pose.active;
    let dx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0),
      dz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
    if (busy || !canMove) {
      dx = 0;
      dz = 0;
    }
    const moving = canMove && (dx || dz);
    if (boating.occupied) {
      boating.step(dx, dz, angle, dt);
    } else if (canMove && moving) {
      const len = Math.hypot(dx, dz),
        s = (wasSwimming ? 2.6 : keys.ShiftLeft || keys.ShiftRight ? 6 : 3.6) * dt;
      dx /= len;
      dz /= len;
      const vx = (dx * Math.cos(angle) + dz * Math.sin(angle)) * s,
        vz = (-dx * Math.sin(angle) + dz * Math.cos(angle)) * s;
      if (!blocked(player.position.x + vx, player.position.z)) player.position.x += vx;
      if (!blocked(player.position.x, player.position.z + vz)) player.position.z += vz;
      const a = Math.atan2(vx, vz);
      player.rotation.y += Math.atan2(Math.sin(a - player.rotation.y), Math.cos(a - player.rotation.y)) * Math.min(1, dt * 12);
    }
    if (!canMove && pose) {
      player.position.set(pose.x, pose.y, pose.z);
      player.rotation.y = pose.rotation;
    }
    if (!boating.occupied && !pose?.active) {
      player.position.y = onDock(player.position.x, player.position.z) ? DOCK.y : Math.abs(player.position.x - riverX(player.position.z)) < 3.8 && Math.abs(player.position.z) < 1.4 ? .64 : height(player.position.x, player.position.z);
    }
    const level=waterLevel();
    const swimming=!boating.occupied&&!pose?.active&&level!==null&&height(player.position.x,player.position.z)<level+.05;
    player.userData.swimming=swimming;
    if(swimming){
      const vertical=busy?0:(keys.Space?1:0)-(keys.ControlLeft||keys.ControlRight||keys.KeyC?1:0);
      if(!wasSwimming)swimDepth=0;
      const maxDepth=Math.max(0,level-height(player.position.x,player.position.z)-.32);
      swimDepth=THREE.MathUtils.clamp(swimDepth-vertical*dt*1.4,0,maxDepth);
      player.position.y=Math.max(height(player.position.x,player.position.z)+.17,level-.15-swimDepth);
      player.rotation.x=Math.PI/2 + (vertical<0?.18:vertical>0?-.18:0);
      swimPhase+=dt*(moving||vertical?6:1.5);
      body.position.y=1.02;body.rotation.set(0,0,0);
      legs.forEach((leg,i)=>{leg.position.set((i?1:-1)*.16,.7,0);leg.rotation.set(Math.sin(swimPhase+i*Math.PI)*.24,0,0);});
      arms.forEach((arm,i)=>{arm.position.set((i?1:-1)*.275,1.28,0);arm.rotation.set(swimPhase+i*Math.PI,0,(i?1:-1)*.22);});
      player.userData.diving=swimDepth>.3;
      lastWalkPosition.copy(player.position);
      return;
    }
    swimDepth=0;player.userData.diving=false;
    player.rotation.x = lying ? -Math.PI / 2 : 0;
    const walkDistance = Math.hypot(player.position.x - lastWalkPosition.x, player.position.z - lastWalkPosition.z);
    lastWalkPosition.copy(player.position);
    const walking = !seated && !lying && walkDistance > .0001 && walkDistance < 1;
    gaitWeight += (Number(walking) - gaitWeight) * (1 - Math.exp(-dt * 10));
    seatWeight += (Number(seated) - seatWeight) * (1 - Math.exp(-dt * 12));
    gaitPhase += walking ? walkDistance * 2.6 : 0;
    body.position.y = 1.02 + Math.abs(Math.sin(gaitPhase)) * .035 * gaitWeight;
    body.rotation.x = 0;
    body.rotation.z = 0;
    legs.forEach((leg, i) => {
      const side = i === 0 ? -1 : 1;
      leg.position.set(side * .16, .7, 0);
      leg.rotation.set(-Math.PI / 2 * seatWeight + Math.sin(gaitPhase + i * Math.PI) * .65 * gaitWeight * (1 - seatWeight), 0, 0);
      if (!seated && !lying && !onDock(player.position.x, player.position.z) && !(Math.abs(player.position.z) < 1.4 && Math.abs(player.position.x - riverX(player.position.z)) < 3.8)) {
        const x = player.position.x + Math.cos(player.rotation.y) * side * .16,
          z = player.position.z - Math.sin(player.rotation.y) * side * .16;
        leg.position.y += THREE.MathUtils.clamp(height(x, z) - player.position.y, -.12, .12);
      }
    });
    arms.forEach((arm, i) => {
      arm.position.set((i === 0 ? -1 : 1) * .275, 1.28, 0);
      arm.rotation.set(-.6 * seatWeight - Math.sin(gaitPhase + i * Math.PI) * .3 * gaitWeight * (1 - seatWeight) + Math.sin(elapsed * 2) * .025 * (1 - gaitWeight), 0, 0);
    });
  };
}
