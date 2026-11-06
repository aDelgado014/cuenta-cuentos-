import { AmbienceSoundType } from '../types/story';

class AmbienceService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentType: AmbienceSoundType = 'none';
  private activeNodes: (AudioNode | number)[] = [];
  private volume = 0.3;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): AmbienceSoundType {
    return this.currentType;
  }

  public play(type: AmbienceSoundType) {
    this.stop();
    this.currentType = type;
    if (type === 'none') return;

    this.init();
    if (!this.ctx || !this.masterGain) return;

    switch (type) {
      case 'lluvia':
        this.createPinkNoiseRain();
        break;
      case 'noche':
        this.createLullabyChimes();
        break;
      case 'bosque':
        this.createForestAmbience();
        break;
      case 'oceano':
        this.createOceanWaves();
        break;
      case 'chimenea':
        this.createFireplaceCrackle();
        break;
    }
  }

  public stop() {
    this.activeNodes.forEach((item) => {
      if (typeof item === 'number') {
        window.clearInterval(item);
      } else if ('stop' in item && typeof (item as any).stop === 'function') {
        try {
          (item as any).stop();
        } catch (e) {}
      } else if ('disconnect' in item) {
        try {
          item.disconnect();
        } catch (e) {}
      }
    });
    this.activeNodes = [];
    this.currentType = 'none';
  }

  // Pink noise generator for gentle rain
  private createPinkNoiseRain() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.04; // scale
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.masterGain);
    whiteNoise.start();

    this.activeNodes.push(whiteNoise, filter);
  }

  // Soft pentatonic lullaby chimes for starry night
  private createLullabyChimes() {
    if (!this.ctx || !this.masterGain) return;
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C D E G A C
    
    const playChime = () => {
      if (!this.ctx || !this.masterGain || this.currentType !== 'noche') return;
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.0);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 3.2);
    };

    playChime();
    const timer = window.setInterval(playChime, 2500);
    this.activeNodes.push(timer);
  }

  // Forest night ambience (gentle breeze & soft crickets)
  private createForestAmbience() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(4500, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.005, this.ctx.currentTime);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();

    this.activeNodes.push(osc, gain);
  }

  // Rhythmic ocean waves
  private createOceanWaves() {
    this.createPinkNoiseRain(); // base noise
    if (!this.ctx || !this.masterGain) return;

    const waveOsc = this.ctx.createOscillator();
    const waveGain = this.ctx.createGain();

    waveOsc.frequency.setValueAtTime(0.1, this.ctx.currentTime); // 10s wave cycle
    waveGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

    waveOsc.connect(waveGain);
    waveGain.connect(this.masterGain);
    waveOsc.start();

    this.activeNodes.push(waveOsc, waveGain);
  }

  // Cozy fireplace crackle
  private createFireplaceCrackle() {
    if (!this.ctx || !this.masterGain) return;

    const playCrackle = () => {
      if (!this.ctx || !this.masterGain || this.currentType !== 'chimenea') return;
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
      }

      const src = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200 + Math.random() * 800;

      src.buffer = buffer;
      src.connect(filter);
      filter.connect(this.masterGain);

      src.start();
    };

    const timer = window.setInterval(playCrackle, 300);
    this.activeNodes.push(timer);
  }
}

export const ambienceService = new AmbienceService();
