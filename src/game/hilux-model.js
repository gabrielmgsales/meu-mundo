import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {batchStatic} from './world-detail.js';

// Original mesh inspired by the international 2026 SR5; no third-party mesh assets.
export function createHiluxModel(){
 const root=new THREE.Group();root.name='Toyota Hilux 2026 SR5 internacional';
 const paint=new THREE.MeshPhysicalMaterial({color:'#b9bdc0',metalness:.65,roughness:.28,clearcoat:.85,clearcoatRoughness:.22});
 const trim=new THREE.MeshStandardMaterial({color:'#202328',roughness:.7});
 const rubber=new THREE.MeshStandardMaterial({color:'#141719',roughness:.94});
 const alloy=new THREE.MeshStandardMaterial({color:'#343a40',metalness:.8,roughness:.3});
 const chrome=new THREE.MeshStandardMaterial({color:'#b8c0c5',metalness:.9,roughness:.23});
 const upholstery=new THREE.MeshStandardMaterial({color:'#25282c',roughness:.95});
 const glass=new THREE.MeshPhysicalMaterial({color:'#718994',transparent:true,opacity:.38,roughness:.1,metalness:.12,depthWrite:false,side:THREE.DoubleSide});
 const led=new THREE.MeshStandardMaterial({color:'#eef5ff',emissive:'#d4e5ff',emissiveIntensity:1.3});
 const headlightMaterial=led.clone();
 const red=new THREE.MeshStandardMaterial({color:'#9c161b',emissive:'#b41b1e',emissiveIntensity:.6});
 const screen=new THREE.MeshStandardMaterial({color:'#213c4a',emissive:'#386477',emissiveIntensity:.5});
 function mesh(geometry,material,x=0,y=0,z=0,parent=root){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function box(x,y,z,w,h,d,material=paint,parent=root,r=.018){return mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/4,h/4,d/4)),material,x,y,z,parent);}
 function line(points,r,material=trim,parent=root){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),Math.max(8,points.length*5),r,6,false),material,0,0,0,parent);}
 function pane(points,material){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();return mesh(g,material);}
 function badge(text,x,y,z,size,back=false){
 const glyph={T:['11111','00100','00100','00100','00100','00100','00100'],O:['01110','10001','10001','10001','10001','10001','01110'],Y:['10001','10001','01010','00100','00100','00100','00100'],A:['01110','10001','10001','11111','10001','10001','10001'],H:['10001','10001','10001','11111','10001','10001','10001'],I:['111','010','010','010','010','010','111'],L:['1000','1000','1000','1000','1000','1000','1111'],U:['10001','10001','10001','10001','10001','10001','01110'],X:['10001','01010','01010','00100','01010','01010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],R:['11110','10001','10001','11110','10100','10010','10001'],'5':['11111','10000','10000','11110','00001','00001','11110']};
 const width=[...text].reduce((n,c)=>n+(glyph[c]?.[0].length||3)+1,0)*size;
 let cursor=-width/2;
 for(const c of text){const rows=glyph[c];if(!rows){cursor+=4*size;continue;}rows.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')box(x+(back?-1:1)*(cursor+i*size),y+(3-j)*size,z,size*.85,size*.85,.012,chrome,root,.001);}));cursor+=(rows[0].length+1)*size;}
 }
 // Ladder chassis and raised double-cab body, with actual open wheel arches.
 box(0,.40,-.03,1.5,.15,4.65,trim);for(const x of [-.56,.56])box(x,.34,-.03,.10,.18,4.75,trim);
 box(0,.78,.0,1.70,.28,4.95);box(0,1.02,.08,1.76,.23,2.18);
 for(const side of [-1,1]){
  const shape=new THREE.Shape();shape.moveTo(-2.64,.70);shape.lineTo(-2.64,1.24);shape.lineTo(-.93,1.30);shape.lineTo(1.04,1.30);shape.lineTo(2.57,1.18);shape.lineTo(2.57,.70);shape.lineTo(2.08,.70);shape.absarc(1.5425,.43,.57,.49,Math.PI-.49,false);shape.lineTo(-.99,.70);shape.absarc(-1.5425,.43,.57,.49,Math.PI-.49,false);shape.lineTo(-2.64,.70);
  const g=new THREE.ExtrudeGeometry(shape,{depth:.07,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025});
  const o=mesh(g,paint,side*.91,0,0);o.rotation.y=-Math.PI/2;
  for(const axle of [-1.5425,1.5425]){
   const points=[];for(let j=0;j<=18;j++){const a=.05+j/18*(Math.PI-.1);points.push([side*.99,.43+Math.sin(a)*.58,axle+Math.cos(a)*.58]);}
   line(points,.055,trim);
  }
  box(side*.97,.50,-.02,.18,.08,2.2,trim);for(let j=0;j<8;j++)box(side*.97,.548,-.96+j*.27,.16,.012,.07,alloy);
 }
 // Sculpted bonnet, roof, pillars and individual glazing.
 const hood=box(0,1.25,1.77,1.78,.16,1.48);hood.rotation.x=.065;
 for(const side of [-1,1])line([[side*.51,1.35,1.04],[side*.57,1.37,1.55],[side*.64,1.29,2.44]],.018,paint);
 box(0,1.88,-.02,1.52,.10,1.45);
 pane([[-.80,1.31,1.06],[.80,1.31,1.06],[.70,1.83,.57],[-.70,1.83,.57]],glass);
 pane([[-.80,1.32,-.87],[-.72,1.83,-.71],[.72,1.83,-.71],[.80,1.32,-.87]],glass);
 for(const side of [-1,1]){
  const x=side*.83,top=side*.735;
  pane([[x,1.31,.99],[x,1.31,.02],[top,1.82,.02],[top,1.82,.54]],glass);
  pane([[x,1.31,-.05],[x,1.31,-.84],[top,1.82,-.69],[top,1.82,-.05]],glass);
  line([[x,1.29,1.03],[top,1.85,.57],[top,1.85,-.73],[x,1.29,-.89]],.045,paint);
  line([[x,1.29,0],[top,1.84,0]],.038,trim);
  line([[x,1.3,1.03],[x,1.3,-.89]],.022,trim);
  for(const z of [.04,-.87])line([[side*.895,1.29,z],[side*.9,.77,z]],.009,trim);
  for(const z of [.15,-.70])box(side*.931,1.16,z,.028,.045,.17,alloy);
  box(side*1.04,1.40,.85,.25,.15,.24,trim);box(side*1.048,1.425,.855,.24,.06,.24,paint);box(side*1.05,1.4,.983,.18,.024,.012,led);
  // Door cards, front seats, head rests and rear bench.
  box(side*.78,1.06,.04,.08,.40,1.63,upholstery);
  box(side*.42,.98,.28,.52,.18,.53,upholstery);box(side*.42,1.27,.04,.52,.55,.15,upholstery).rotation.x=-.10;
  box(side*.42,1.62,.045,.25,.20,.12,upholstery);
 }
 box(0,1.02,-.56,1.36,.20,.44,upholstery);box(0,1.26,-.75,1.36,.44,.14,upholstery);
 box(0,1.25,.83,1.5,.20,.35,trim);box(0,1.44,.72,.42,.23,.035,screen);
 box(-.44,1.40,.74,.36,.17,.03,screen);box(0,1.05,.28,.22,.22,.7,trim);
 const steering=new THREE.Group();steering.position.set(-.43,1.35,.53);steering.rotation.x=-.35;root.add(steering);
 mesh(new THREE.TorusGeometry(.16,.018,8,28),trim,0,0,0,steering);
 box(0,0,.005,.19,.035,.025,chrome,steering);
 box(0,-.06,0,.028,.13,.025,trim,steering);
 batchStatic(steering);
 for(const x of [-.38,.32])line([[x,1.34,1.025],[x+.28,1.36,.985]],.011,trim);
 // International SR5 nose: narrow lamps, body-coloured honeycomb and TOYOTA wordmark.
 box(0,1.05,2.535,1.39,.49,.065,trim);box(0,1.34,2.49,1.84,.13,.10);
 for(let row=0;row<4;row++)for(let col=0;col<12;col++){
 const ring=mesh(new THREE.TorusGeometry(.052,.011,4,6),paint,-.64+col*.114+(row%2)*.04,.87+row*.106,2.578);ring.rotation.z=Math.PI/6;
 }
 box(0,1.21,2.602,.78,.16,.018,trim);badge('TOYOTA',0,1.215,2.617,.017);
 for(const side of [-1,1]){
 box(side*.72,1.34,2.52,.40,.115,.07,trim);box(side*.72,1.36,2.562,.34,.026,.018,headlightMaterial);
 for(let i=0;i<3;i++)box(side*(.59+i*.095),1.32,2.567,.067,.026,.012,headlightMaterial);
 box(side*.80,.85,2.50,.24,.31,.08,trim);box(side*.8,.85,2.548,.10,.075,.02,headlightMaterial);
 box(side*.80,1.15,-2.666,.17,.37,.07,red);box(side*.80,1.12,-2.706,.13,.035,.015,led);
 }
 box(0,.70,2.48,1.84,.21,.18,trim);box(0,.63,2.57,.9,.08,.075,alloy);
 box(0,.79,2.61,.36,.10,.018,trim);badge('HILUX',0,.79,2.625,.009);
 // Recessed load bed with ribs, tie-downs, tailgate and sports bar.
 box(0,1.0,-1.83,1.62,.09,1.53,trim);
 for(let i=0;i<12;i++)box(-.74+i*.135,1.057,-1.82,.033,.019,1.48,alloy);
 for(const side of [-1,1]){box(side*.895,1.14,-1.83,.12,.36,1.59);box(side*.895,1.34,-1.83,.15,.04,1.62,trim);}
 box(0,1.12,-2.64,1.80,.43,.10);box(0,1.34,-2.65,.29,.045,.045,trim);badge('TOYOTA',0,1.15,-2.702,.022,true);badge('HILUX',.60,.96,-2.704,.007,true);
 box(0,.70,-2.66,1.87,.17,.17,trim);box(0,.55,-2.56,.20,.10,.33,alloy);
 line([[-.76,1.35,-1.15],[-.72,1.90,-1.02],[.72,1.90,-1.02],[.76,1.35,-1.15]],.055,alloy);
 for(const side of [-1,1])line([[side*.73,1.88,-1.05],[side*.76,1.36,-1.78]],.035,alloy);
 // Tyres, tread blocks, brake discs, six spokes and wheel fasteners.
 const wheels=[];
 for(const side of [-1,1])for(const axle of [-1.5425,1.5425]){
 const pivot=new THREE.Group();pivot.position.set(side*.855,.405,axle);pivot.rotation.order='YXZ';root.add(pivot);
 const tire=mesh(new THREE.TorusGeometry(.31,.103,12,40),rubber,0,0,0,pivot);tire.rotation.y=Math.PI/2;
 const disc=mesh(new THREE.CylinderGeometry(.235,.235,.15,32),alloy,0,0,0,pivot);disc.rotation.z=Math.PI/2;
 for(let i=0;i<36;i++){const a=i*Math.PI/18;const block=box(0,Math.sin(a)*.404,Math.cos(a)*.404,.19,.024,.050,rubber,pivot,.003);block.rotation.x=-a;}
 for(let i=0;i<6;i++){
 const a=i*Math.PI/3;
 const spoke=box(side*.10,Math.sin(a)*.13,Math.cos(a)*.13,.025,.055,.21,alloy,pivot,.006);spoke.rotation.x=-a;
 const lug=mesh(new THREE.CylinderGeometry(.014,.014,.02,6),chrome,side*.127,Math.sin(a)*.058,Math.cos(a)*.058,pivot);lug.rotation.z=Math.PI/2;
 }
 const cap=mesh(new THREE.CylinderGeometry(.047,.047,.23,18),chrome,0,0,0,pivot);cap.rotation.z=Math.PI/2;
 batchStatic(pivot);wheels.push(pivot);
 }
 batchStatic(root,[...wheels,steering]);
 root.userData.reference='International Hilux 2026 SR5';
 return {root,wheels,steering,headlightMaterial};
}
