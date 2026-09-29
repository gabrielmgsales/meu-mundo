// A continuous engine and gravel loop, routed through the game's existing volume/mute bus.
export function vehicleSoundParameters(truck,throttle,brake,inside){
 const moving=Math.min(1,Math.abs(truck?.speed||0)/19),running=!!truck?.occupied;
 const gear=Math.floor(moving*4),rev=(moving*4-gear);
 return {frequency:34+rev*31+gear*6+Math.abs(throttle)*11,engine:running?(inside?.085:.14):0,gravel:running&&!truck?.airborne?moving*(brake?.11:.055)*(1+(truck?.skid||0)*.5):0,cutoff:inside?480:1600};
}
export function createVehicleSound(context,master){
 const filter=context.createBiquadFilter();filter.type='lowpass';filter.connect(master);
 const engine=context.createGain();engine.gain.value=0;engine.connect(filter);
 const voices=[1,2,3].map((n)=>{const voice=context.createOscillator(),gain=context.createGain();voice.type='triangle';gain.gain.value=1/(n*n);voice.connect(gain).connect(engine);voice.start();return voice;});
 const buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate),data=buffer.getChannelData(0);
 let seed=917;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296*2-1)*.7;}
 const source=context.createBufferSource();source.buffer=buffer;source.loop=true;
 const gravel=context.createGain();gravel.gain.value=0;const band=context.createBiquadFilter();band.type='bandpass';band.frequency.value=850;band.Q.value=.5;
 source.connect(band).connect(gravel).connect(filter);source.start();
 return {update(truck,throttle,brake,inside){const p=vehicleSoundParameters(truck,throttle,brake,inside),time=context.currentTime;voices.forEach((v,i)=>v.frequency.setTargetAtTime(p.frequency*(i+1),time,.12));engine.gain.setTargetAtTime(p.engine,time,.12);gravel.gain.setTargetAtTime(p.gravel,time,.10);filter.frequency.setTargetAtTime(p.cutoff,time,.15);}};
}
