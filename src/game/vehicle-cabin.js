import * as THREE from 'three';
export function createCabin(root,steering){
 const panelMaterial=new THREE.MeshStandardMaterial({color:'#101519',emissive:'#86c6da',emissiveIntensity:.2,side:THREE.DoubleSide,roughness:.7});
 const canvas=typeof document!=='undefined'?document.createElement('canvas'):null;
 let ctx,texture,lastSpeed=-1;
 if(canvas){canvas.width=512;canvas.height=256;ctx=canvas.getContext('2d');texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;panelMaterial.map=panelMaterial.emissiveMap=texture;panelMaterial.color.set('#ffffff');}
 const panel=new THREE.Mesh(new THREE.PlaneGeometry(.36,.17),panelMaterial);panel.position.set(-.44,1.40,.718);panel.rotation.y=Math.PI;root.add(panel);
 const needle=new THREE.Mesh(new THREE.BoxGeometry(.003,.054,.002),new THREE.MeshBasicMaterial({color:'#e6694e'}));
 const dial=new THREE.Group();dial.position.set(-.37,1.40,.70);needle.position.y=.024;dial.add(needle);root.add(dial);
 const hands=new THREE.Group();steering.add(hands);
 const skin=new THREE.MeshStandardMaterial({color:'#bc896b',roughness:.85});
 for(const side of [-1,1]){
 const hand=new THREE.Mesh(new THREE.CapsuleGeometry(.022,.043,4,8),skin);hand.position.set(side*.145,.035,-.025);hand.rotation.z=side*.25;hands.add(hand);
 const forearm=new THREE.Mesh(new THREE.CapsuleGeometry(.025,.17,4,8),new THREE.MeshStandardMaterial({color:'#344953',roughness:.95}));forearm.position.set(side*.17,-.035,-.13);forearm.rotation.x=-.9;hands.add(forearm);
 }
 function draw(speed){if(!ctx||speed===lastSpeed)return;lastSpeed=speed;ctx.fillStyle='#0b1319';ctx.fillRect(0,0,512,256);ctx.strokeStyle='#77929c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(155,128,91,.2,Math.PI*1.94);ctx.stroke();ctx.fillStyle='#d5eceb';ctx.font='21px sans-serif';for(let n=0;n<=7;n++){const a=-Math.PI*.75+n*Math.PI*1.5/7;ctx.fillText(String(n*20),145+Math.sin(a)*78,135-Math.cos(a)*78);}ctx.font='bold 70px sans-serif';ctx.fillText(String(speed),310,145);ctx.font='22px sans-serif';ctx.fillText('km/h',319,183);texture.needsUpdate=true;}
 return {hands,panel,dial,update(speed,hour,occupied){hands.visible=occupied;dial.rotation.z=Math.PI*.75-Math.min(140,Math.abs(speed)*3.6)/140*Math.PI*1.5;panelMaterial.emissiveIntensity=hour<7||hour>18?.9:.15;draw(Math.round(Math.abs(speed)*3.6));}};
}
