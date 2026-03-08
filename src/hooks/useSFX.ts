import { useRef, useEffect } from 'react';

export interface SFX {
  playSwordHit: () => void;
  playArrowShot: () => void;
  playFireball: () => void;
  playChestOpen: () => void;
  playUnitSpawn: () => void;
  playDeath: () => void;
}

/** Procedural SFX engine using Web Audio API — zero audio files needed */
export function useSFX(sfxVolume: number): SFX {
  const ctxRef = useRef<AudioContext | null>(null);
  const volRef = useRef(sfxVolume);
  volRef.current = sfxVolume;

  // Lazily create AudioContext on first call
  function getCtx(): AudioContext | null {
    if (volRef.current <= 0) return null;
    if (!ctxRef.current) {
      try { ctxRef.current = new AudioContext(); } catch { return null; }
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }

  // Helper: create gain node with envelope
  function makeGain(ctx: AudioContext, volume: number, attack: number, decay: number): GainNode {
    const g = ctx.createGain();
    const t = ctx.currentTime;
    const v = volume * volRef.current * 0.3; // Global dampening for gentle sounds
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + attack);
    g.gain.linearRampToValueAtTime(0, t + attack + decay);
    g.connect(ctx.destination);
    return g;
  }

  // Short white noise burst, low-pass filtered — sword/melee hit
  function playSwordHit() {
    const ctx = getCtx(); if (!ctx) return;
    const dur = 0.06;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 2000;
    const g = makeGain(ctx, 0.4, 0.005, dur);
    src.connect(filt).connect(g);
    src.start(); src.stop(ctx.currentTime + dur);
  }

  // Quick sine sweep — arrow twang
  function playArrowShot() {
    const ctx = getCtx(); if (!ctx) return;
    const dur = 0.1;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + dur);
    const g = makeGain(ctx, 0.2, 0.005, dur);
    osc.connect(g);
    osc.start(); osc.stop(ctx.currentTime + dur);
  }

  // Whoosh — noise + bandpass sweep
  function playFireball() {
    const ctx = getCtx(); if (!ctx) return;
    const dur = 0.2;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(400, ctx.currentTime);
    filt.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + dur * 0.5);
    filt.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + dur);
    filt.Q.value = 2;
    const g = makeGain(ctx, 0.35, 0.02, dur - 0.02);
    src.connect(filt).connect(g);
    src.start(); src.stop(ctx.currentTime + dur);
  }

  // Coin clink — high sine ping for chests
  function playChestOpen() {
    const ctx = getCtx(); if (!ctx) return;
    const dur = 0.15;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.02);
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + dur);
    const g = makeGain(ctx, 0.2, 0.005, dur);
    osc.connect(g);
    osc.start(); osc.stop(ctx.currentTime + dur);
  }

  // Soft chime — ascending notes for unit spawn
  function playUnitSpawn() {
    const ctx = getCtx(); if (!ctx) return;
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const delay = i * 0.06;
      const dur = 0.12;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = makeGain(ctx, 0.15, 0.005, dur);
      // Shift envelope timing
      g.gain.cancelScheduledValues(ctx.currentTime);
      const v = 0.15 * volRef.current * 0.3;
      g.gain.setValueAtTime(0, ctx.currentTime + delay);
      g.gain.linearRampToValueAtTime(v, ctx.currentTime + delay + 0.005);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + dur);
      osc.connect(g);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur);
    });
  }

  // Low thud — enemy death
  function playDeath() {
    const ctx = getCtx(); if (!ctx) return;
    const dur = 0.12;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + dur);
    const g = makeGain(ctx, 0.25, 0.005, dur);
    osc.connect(g);
    osc.start(); osc.stop(ctx.currentTime + dur);
  }

  // Cleanup
  useEffect(() => {
    return () => { ctxRef.current?.close(); };
  }, []);

  return { playSwordHit, playArrowShot, playFireball, playChestOpen, playUnitSpawn, playDeath };
}
