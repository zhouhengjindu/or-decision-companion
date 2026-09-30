'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export type SoundScene = 'focus' | 'dream' | 'night';

interface AudioState {
  soundOn: boolean;
  scene: SoundScene;
  supported: boolean;
  pendingResume: boolean;
  toggle: () => void;
  setScene: (scene: SoundScene) => void;
}

const AudioContextValue = createContext<AudioState | null>(null);

const sceneConfig: Record<SoundScene, { tones: number[]; noise: number; filter: number }> = {
  focus: { tones: [110, 164.8], noise: 0.012, filter: 780 },
  dream: { tones: [130.8, 196], noise: 0.009, filter: 540 },
  night: { tones: [82.4, 123.5], noise: 0.018, filter: 330 },
};

export function AmbientAudioProvider({ children }: { children: ReactNode }) {
  const [soundOn, setSoundOn] = useState(false);
  const [scene, setSceneState] = useState<SoundScene>('dream');
  const [supported, setSupported] = useState(true);
  const [pendingResume, setPendingResume] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);

  const stopAudio = useCallback(() => {
    nodesRef.current.forEach((node) => {
      try { (node as AudioScheduledSourceNode).stop?.(); } catch { /* already stopped */ }
      try { node.disconnect(); } catch { /* disconnected */ }
    });
    nodesRef.current = [];
    if (audioRef.current) void audioRef.current.close();
    audioRef.current = null;
    setSoundOn(false);
  }, []);

  const startAudio = useCallback(async (nextScene: SoundScene) => {
    const BrowserAudioContext = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!BrowserAudioContext) {
      setSupported(false);
      setPendingResume(false);
      return;
    }
    stopAudio();
    try {
      const context = new BrowserAudioContext();
      audioRef.current = context;
      const master = context.createGain();
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = sceneConfig[nextScene].filter;
      master.gain.value = 0.045;
      filter.connect(master).connect(context.destination);

      sceneConfig[nextScene].tones.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = index === 0 ? 'sine' : 'triangle';
        oscillator.frequency.value = frequency;
        oscillator.detune.value = index * 4 - 2;
        gain.gain.value = index === 0 ? 0.34 : 0.12;
        oscillator.connect(gain).connect(filter);
        oscillator.start();
        nodesRef.current.push(oscillator, gain);
      });

      const length = context.sampleRate * 3;
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let index = 0; index < length; index += 1) channel[index] = Math.random() * 2 - 1;
      const noise = context.createBufferSource();
      const noiseGain = context.createGain();
      noise.buffer = buffer;
      noise.loop = true;
      noiseGain.gain.value = sceneConfig[nextScene].noise;
      noise.connect(noiseGain).connect(filter);
      noise.start();
      nodesRef.current.push(noise, noiseGain, filter, master);
      await context.resume();
      setSoundOn(true);
      setPendingResume(false);
      localStorage.setItem('or:sound:enabled', 'true');
    } catch {
      stopAudio();
      setPendingResume(true);
    }
  }, [stopAudio]);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const savedScene = localStorage.getItem('or:sound:scene') as SoundScene | null;
      if (savedScene && sceneConfig[savedScene]) setSceneState(savedScene);
      if (localStorage.getItem('or:sound:enabled') === 'true') setPendingResume(true);
    }, 0);
    return () => {
      window.clearTimeout(initialize);
      stopAudio();
    };
  }, [stopAudio]);

  const toggle = useCallback(() => {
    if (soundOn) {
      stopAudio();
      setPendingResume(false);
      localStorage.setItem('or:sound:enabled', 'false');
    } else {
      void startAudio(scene);
    }
  }, [scene, soundOn, startAudio, stopAudio]);

  const setScene = useCallback((nextScene: SoundScene) => {
    setSceneState(nextScene);
    localStorage.setItem('or:sound:scene', nextScene);
    if (soundOn) void startAudio(nextScene);
  }, [soundOn, startAudio]);

  return (
    <AudioContextValue.Provider value={{ soundOn, scene, supported, pendingResume, toggle, setScene }}>
      {children}
    </AudioContextValue.Provider>
  );
}

export function useAmbientAudio() {
  const value = useContext(AudioContextValue);
  if (!value) throw new Error('useAmbientAudio must be used inside AmbientAudioProvider.');
  return value;
}
