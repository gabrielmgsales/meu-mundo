import * as THREE from 'three';
// Follow changes in vehicle heading without erasing the user's orbit offset.
export function updateVehicleOrbit(view,heading){
 if(heading===null){view.truckHeading=null;return;}
 if(view.truckHeading==null)view.angle=heading+Math.PI;
 else view.angle+=Math.atan2(Math.sin(heading-view.truckHeading),Math.cos(heading-view.truckHeading));
 view.truckHeading=heading;
}
export function dragOrbit(view,dx,dy,firstPerson){
 view.angle-=dx*.007;
 if(!firstPerson)view.elevation=THREE.MathUtils.clamp((view.elevation??Math.atan(.49))+dy*.005,.06,1.35);
}
export function zoomOrbit(view,delta){view.zoom=THREE.MathUtils.clamp(view.zoom+delta*.015,5,55);}
export function orbitPosition(desired,position,view,scale=1){
 const elevation=view.elevation??Math.atan(.49),distance=view.zoom*scale;
 return desired.set(position.x+Math.sin(view.angle)*distance*Math.cos(elevation),position.y+.8+distance*Math.sin(elevation),position.z+Math.cos(view.angle)*distance*Math.cos(elevation));
}
