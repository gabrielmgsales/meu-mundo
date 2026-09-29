export const VEHICLE_GRAVITY=9.81;
export function createVerticalMotion(ground){return {y:ground,vy:0,ground,airborne:false,compression:0,impact:0};}
// Ground can support a vehicle, but cannot pull it down over a crest.
export function stepVerticalMotion(body,ground,dt){
 if(dt<=0)return;
 const previousGround=body.ground;
 const predicted=body.y+body.vy*dt-.5*VEHICLE_GRAVITY*dt*dt;
 const fallVelocity=body.vy-VEHICLE_GRAVITY*dt;
 body.impact=0;body.compression*=Math.exp(-dt*9);
 if(predicted>ground+.035){body.y=predicted;body.vy=fallVelocity;body.airborne=true;}
 else{
 if(body.airborne){body.impact=Math.max(0,-fallVelocity);body.compression=Math.min(.12,body.impact*.012);body.vy=0;}
 else body.vy=Math.max(-20,Math.min(20,(ground-previousGround)/dt));
 body.y=ground;body.airborne=false;
 }
 body.ground=ground;
}
