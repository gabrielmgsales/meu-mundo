from pathlib import Path
p=Path('game.js')
s=p.read_text(encoding='utf-8-sig')
def replace(old,new):
 global s
 if old not in s: raise Exception('Missing replacement: '+old[:90])
 s=s.replace(old,new,1)
replace("import * as THREE from 'three';", """import * as THREE from 'three';
import { terrainHeight, riverCenter, textureMaterials, makeTree, addTrail, addLandmarks, batchStatic, places } from './src/game/world-detail.js';
import { createExperience } from './src/game/experience.js';
import { readProgress, canAfford, placementReason, isUnlocked } from './src/game/rules.js';
let experience, worldBatched=false;""")
replace('renderer.toneMappingExposure=1.15','renderer.toneMappingExposure=1.08')
replace("function mesh(geo,m,p", "const earthTexture=textureMaterials(M);\nfunction mesh(geo,m,p")
replace("const height=(x,z)=>.22*Math.sin(x*.17)*Math.cos(z*.16)+.1*Math.sin(z*.37),riverX=z=>9+Math.sin(z*.075)*3;", "const height=terrainHeight,riverX=riverCenter;")
replace('new THREE.PlaneGeometry(190,190,100,100)','new THREE.PlaneGeometry(190,190,140,140)')
replace(".205+rand()*.025,.23+rand()*.1,.3+rand()*.08", ".205+rand()*.012,.28+rand()*.05,.32+rand()*.035")
replace('new THREE.MeshStandardMaterial({vertexColors:true,roughness:1})','new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,map:earthTexture})')
a=s.index('const pathMat=');b=s.index('for(let i=0;i<15;i++)',a)
s=s[:a]+"""const pathMat=mat('#b9ac86',{map:earthTexture});
addTrail(scene,[[-4,-34],[-4,-15],[-3,-4],[-3,4],[-1,14],[-5,35]],1.15,pathMat);
addTrail(scene,[[-3,1],[1,0],[5.5,0]],.8,pathMat);
addTrail(scene,[[12.8,0],[17,-4],[21,-11],[24,-15]],.6,pathMat);
addTrail(scene,[[-4,-12],[-10,-14],[-16,-18],[-20,-18]],.55,pathMat);
addTrail(scene,[[14,1],[19,9],[22,16],[23,20]],.6,pathMat);
"""+s[b:]
a=s.index('function tree(');b=s.index('for(let i=0;i<115;i++)',a)
s=s[:a]+"""function tree(x,z,scale=1,pine=false){makeTree(scene,M,x,z,scale,pine,rand);resources.push({type:'wood',x,z,cooldown:0});}
"""+s[b:]
replace('if(Math.abs(x-riverX(z))<4.5||',"if(places.some(p=>Math.hypot(x-p.x,z-p.z)<5)||Math.abs(x-riverX(z))<4.5||")
replace('if(Math.abs(x-riverX(z))>4&&Math.hypot(x+3,z)>8)', 'if(!places.some(p=>Math.hypot(x-p.x,z-p.z)<5)&&Math.abs(x-riverX(z))>4&&Math.hypot(x+3,z)>8)')
replace("crops.push({g,plants,readyAt:0});}return g;}","crops.push({g,plants,key:`${x},${z}`,readyAt:0});}if(worldBatched)batchStatic(g,crops.map(c=>c.plants));return g;}")
replace('const player=new THREE.Group();',"""addLandmarks(scene,M,{box,sphere,cyl},resources);
batchStatic(scene,[ground,water,grass,flowers,ripples,...crops.map(c=>c.plants)]);worldBatched=true;
const player=new THREE.Group();""")
a=s.index('const valid=saved');b=s.index('let toastTimer;',a)
s=s[:a]+"""const state=readProgress(saved,catalog);
for(const b of state.buildings)building(b.type,b.x,b.z);
for(const c of crops)c.readyAt=Math.max(0,((state.cropTimers[c.key]||0)-Date.now())/1000);
player.position.set(state.position.x,height(state.position.x,state.position.z),state.position.z);
function save(){
  state.position={x:player.position.x,z:player.position.z};
  state.cropTimers=Object.fromEntries(crops.map(c=>[c.key,Date.now()+Math.max(0,c.readyAt-elapsed)*1000]));
  try{localStorage.setItem(storageKey,JSON.stringify({...state,version:3}));$('save-status').textContent='Progresso salvo neste navegador';}
  catch{$('save-status').textContent='Salvamento indisponível';}
}
"""+s[b:]
replace("water:['♢','Água']", "water:['♢','Água'],crystal:['✧','Cristais'],herbs:['❧','Ervas']")
replace("$('progress').style.width=`${goals.filter(g=>g[0]).length/3*100}%`;}","$('progress').style.width=`${goals.filter(g=>g[0]).length/3*100}%`;experience?.refresh();}")
replace('angle=.12,zoom=24','angle=.18,zoom=22')
replace('function select(type){selected=',"function select(type){if(!isUnlocked(type,state)){toast(type==='well'?'Descubra o Santuário das águas para liberar o poço.':'Descubra a pedreira e faça uma colheita para liberar o celeiro.');return;}selected=")
replace("function setPaused(v){paused=v;", "function setPaused(v){paused=v;experience?.paused(v);")
replace("keys[e.code]=true;if(e.repeat)return;", "if(['SELECT','INPUT'].includes(e.target.tagName))return;keys[e.code]=true;if(e.repeat)return;")
a=s.index('function placementValid(');b=s.index('function place()',a)
s=s[:a]+"""function placementError(x,z){return placementReason({x,z,radius:catalog[selected].radius,player:player.position,riverCenter:riverX,height,
obstacles:[...fixed,...state.buildings.map(b=>({...b,radius:catalog[b.type].radius})),...resources.map(r=>({...r,radius:.7})),...places.map(p=>({...p,radius:4}))]});}
function placementValid(x,z){return !placementError(x,z);}
"""+s[b:]
replace("if(!placementValid(x,z))return toast('Escolha um terreno livre a até 13 metros, longe do rio e de obstáculos.');if(state.inventory.wood<c.wood||state.inventory.stone<c.stone)","if(!isUnlocked(selected,state))return;if(!placementValid(x,z))return toast(placementError(x,z));if(!canAfford(state.inventory,c))")
replace("building(selected,x,z);toast(","building(selected,x,z);experience.burst('build',{x,z});toast(")
replace("function collect(){if(!nearest)","function collect(){if(experience.busy)return;if(!nearest)")
replace("if(nearest.type==='crop'){", "const collectedType=nearest.type,target=nearest.resource||nearest.crop?.g.position; if(nearest.type==='crop'){")
replace("nearest.resource.cooldown=elapsed+4", "nearest.resource.cooldown=elapsed+(['herbs','crystal'].includes(nearest.type)?25:4)")
replace("nearest=null;updateUI();save();}","experience.burst(collectedType,target);nearest=null;updateUI();save();}")
replace("crop:'Colher a horta'}", "crop:'Colher a horta',crystal:'Extrair cristais',herbs:'Colher ervas'}")
replace("return [{x:-5,z:-5,radius:2.1},", "if([...fixed.filter(b=>b.radius===1.3),...state.buildings.filter(b=>b.type==='fence')].some(b=>Math.abs(x-b.x)<1.35&&Math.abs(z-b.z)<.3))return true;return [{x:-5,z:-5,radius:2.1},")
replace("camera.position.set(-1,19,27);updateUI();", """if(blocked(player.position.x,player.position.z))player.position.set(-3,height(-3,3),3);
experience=createExperience({scene,M,player,arms,body,camera,renderer,sun,hemi,grass,water,state,save,toast,refresh:updateUI});
camera.position.set(player.position.x+4,player.position.y+12,player.position.z+22);updateUI();""")
replace("state.time+=dt/60", "state.time+=dt/40")
replace("const moving=dx||dz;if(moving)", "if(experience.busy){dx=0;dz=0;}const moving=dx||dz;if(moving)")
replace("Math.abs(player.position.z)<1.4?.64:height", "Math.abs(player.position.z)<1.4?.64:height")
a=s.index('for(let i=0;i<wp.count;i++)wp.setY(i,.25+Math.sin');b=s.index('uiTick+=dt;',a)
s=s[:a]+"ripples.position.z=Math.sin(elapsed*.5)*.15;"+s[b:]
replace('player.position.y+zoom*.73','player.position.y+zoom*.49')
replace('renderer.render(scene,camera);}',"experience.tick(paused?0:dt,elapsed,!!(keys.KeyW||keys.KeyA||keys.KeyS||keys.KeyD||keys.ArrowUp||keys.ArrowDown||keys.ArrowLeft||keys.ArrowRight),paused);renderer.render(scene,camera);}")
p.write_text(s,encoding='utf-8')
