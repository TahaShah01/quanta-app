import { useSyncExternalStore } from "react";

const KEY = "quanta-sound";
const listeners = new Set<() => void>();
let ctx: AudioContext | null = null;
let lastTick = 0;

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}

export function isSoundEnabled() {
  return typeof window !== "undefined" && read();
}

/** Must be called from a user gesture the first time (browsers block audio otherwise). */
export function setSoundEnabled(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // ignore blocked storage
  }
  if (on) {
    ctx ??= new AudioContext();
    void ctx.resume();
    playTone(660, 0.08, 0.04);
  }
  listeners.forEach((l) => l());
}

export function playTone(freq: number, duration = 0.05, volume = 0.025) {
  if (!ctx || ctx.state !== "running") return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

/** Soft hover tick, rate limited so sweeping the cursor stays gentle. */
export function playHover() {
  const now = performance.now();
  if (now - lastTick < 70) return;
  lastTick = now;
  playTone(1200, 0.035, 0.012);
}

export function playClick() {
  playTone(520, 0.07, 0.03);
}
