import {createVehicleSound} from './vehicle-audio.js';
import { daytimeStrength } from './daylight.js';

// A quiet, seamless bed of short cricket chirps, without external audio files.
export function cricketSamples(sampleRate, duration = 6) {
  const data = new Float32Array(Math.floor(sampleRate * duration));
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    for (let voice = 0; voice < 2; voice++) {
      const cycle = (t + voice * .73) % 1.5,
        pulse = cycle % .125;
      if (cycle > .48 || pulse > .07) continue;
      const envelope = Math.sin(Math.PI * pulse / .07) ** 2;
      data[i] += Math.sin(t * Math.PI * 2 * (voice ? 4350 : 3800)) * envelope * .22;
    }
    // Taper the loop boundary to prevent clicks even on devices with resampling.
    data[i] *= Math.min(1, t / .06, (duration - t) / .06);
  }
  return data;
}

// Small synthesized soundscape: no external downloads or autoplay dependency.
export class ValleyAudio {
  constructor() {
    this.enabled = true;
    this.volume = .3;
    this.context = null;
    this.paused = false;
  }
  async unlock() {
    if (!this.enabled) return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.connect(this.context.destination);
        const buffer = this.context.createBuffer(1, this.context.sampleRate * 4, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        let sample = 0;
        for (let i = 0; i < data.length; i++) {
          sample = (sample + (Math.random() * 2 - 1) * .02) / 1.02;
          data[i] = sample * 3;
        }
        const noise = this.context.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 420;
        this.wind = this.context.createGain();
        this.wind.gain.value = .22;
        noise.connect(filter).connect(this.wind).connect(this.master);
        noise.start();
        const stream = this.context.createBufferSource();
        stream.buffer = buffer;
        stream.loop = true;
        const streamFilter = this.context.createBiquadFilter();
        streamFilter.type = 'highpass';
        streamFilter.frequency.value = 550;
        this.stream = this.context.createGain();
        this.stream.gain.value = .1;
        this.streamPan = this.context.createStereoPanner();
        stream.connect(streamFilter).connect(this.stream).connect(this.streamPan).connect(this.master);
        stream.start();
        const rain = this.context.createBufferSource();
        rain.buffer = buffer;
        rain.loop = true;
        const rainFilter = this.context.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.value = 2200;
        this.rain = this.context.createGain();
        this.rain.gain.value = 0;
        rain.connect(rainFilter).connect(this.rain).connect(this.master);
        rain.start();
        this.echo = this.context.createDelay(.5);
        this.echo.delayTime.value = .16;
        this.echoGain = this.context.createGain();
        this.echoGain.gain.value = 0;
        this.echo.connect(this.echoGain).connect(this.master);
        const crickets = this.context.createBufferSource();
        const cricketBuffer = this.context.createBuffer(1, this.context.sampleRate * 6, this.context.sampleRate);
        cricketBuffer.getChannelData(0).set(cricketSamples(this.context.sampleRate));
        crickets.buffer = cricketBuffer;
        crickets.loop = true;
        this.crickets = this.context.createGain();
        this.crickets.gain.value = 0;
        crickets.connect(this.crickets).connect(this.master);
        crickets.start();
        this.apply();
      }
      if (this.context.state === 'suspended') await this.context.resume();
    } catch {
      this.enabled = false;
    }
  }
  vehicle(truck,throttle,brake,inside){
    if(!this.context)return;
    this.vehicleSound??=createVehicleSound(this.context,this.master);
    this.vehicleSound.update(truck,throttle,brake,inside);
  }
  apply() {
    if (this.context) this.master.gain.setTargetAtTime(this.enabled && !this.paused ? this.volume : 0, this.context.currentTime, .12);
  }
  ambience(waterfall = 0, hour = 12, {
    pan = 0,
    rain = 0,
    shelter = 0,
    altitude = 0
  } = {}) {
    if (!this.context || !this.enabled || this.paused) return;
    this.wind?.gain.setTargetAtTime((.16 + Math.min(1, Math.max(0, altitude) / 72) * .28 + rain * .12) * (1 - shelter * .75), this.context.currentTime, .8);
    this.stream.gain.setTargetAtTime(.1 + waterfall * 3, this.context.currentTime, .3);
    this.crickets.gain.setTargetAtTime((1 - daytimeStrength(hour)) * .055, this.context.currentTime, 1.8);
    this.streamPan?.pan.setTargetAtTime(pan, this.context.currentTime, .2);
    this.rain?.gain.setTargetAtTime(rain * .22 * (1 - shelter * .8), this.context.currentTime, .8);
    this.echoGain?.gain.setTargetAtTime(shelter * .2, this.context.currentTime, .4);
  }

  tone(frequency, duration, kind = 'sine', volume = .2, slide = frequency, pan = 0) {
    if (!this.context || !this.enabled || this.paused) return;
    const t = this.context.currentTime,
      osc = this.context.createOscillator(),
      gain = this.context.createGain();
    osc.type = kind;
    osc.frequency.setValueAtTime(frequency, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + duration);
    gain.gain.setValueAtTime(.001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + .012);
    gain.gain.exponentialRampToValueAtTime(.001, t + duration);
    const spatial = this.context.createStereoPanner();
    spatial.pan.value = Math.max(-1, Math.min(1, pan));
    osc.connect(gain).connect(spatial).connect(this.master);
    if (this.echo) gain.connect(this.echo);
    osc.start(t);
    osc.stop(t + duration + .02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
      spatial.disconnect();
    };
  }
  creature(type, pan, volume) {
    if (type === 'cachorro') {
      this.tone(180, .14, 'triangle', volume, 90, pan);
    } else if (['cow', 'bull', 'sheep', 'goat'].includes(type)) {
      this.tone(type === 'sheep' ? 340 : 130, .55, 'sine', volume, 95, pan);
    } else this.tone(1800, .18, 'sine', volume, 2800, pan);
  }
  play(type) {
    if (type === 'wood') this.tone(160, .14, 'triangle', .65, 55);else if (type === 'stone' || type === 'crystal') this.tone(1300, .23, 'sine', .28, 650);else if (type === 'build') {
      this.tone(110, .25, 'triangle', .55, 45);
      this.tone(440, .5, 'sine', .1, 660);
    } else if (type === 'discover') {
      this.tone(523, .6, 'sine', .2, 784);
      this.tone(659, .75, 'sine', .16, 988);
    } else if (type === 'step-wood') this.tone(180, .085, 'triangle', .1, 80);else if (type === 'step-stone') this.tone(420, .06, 'sine', .09, 180);else if (type === 'step-wet') {
      this.tone(150, .11, 'triangle', .07, 45);
      this.tone(650, .07, 'sine', .025, 190);
    } else if (type === 'step') this.tone(95, .065, 'triangle', .12, 45);else if (type === 'bird') this.tone(1800, .22, 'sine', .055, 3000);else this.tone(480, .22, 'sine', .13, 800);
  }
}
