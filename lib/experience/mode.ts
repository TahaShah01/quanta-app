"use client";

import { useSyncExternalStore } from "react";

// "pending"  -> server render / first client render (nothing decided yet)
// "webgl"    -> full 3D experience
// "fallback" -> reduced motion, data-saver or no WebGL: use the static graphic
export type ExperienceMode = "pending" | "webgl" | "fallback";

let cached: ExperienceMode | null = null;

export function detectMode(): ExperienceMode {
  if (cached) return cached;
  if (typeof window === "undefined") return "pending";

  try {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;

    if (reduced || connection?.saveData) {
      cached = "fallback";
      return cached;
    }

    const probe = document.createElement("canvas");
    const gl = (probe.getContext("webgl2") ||
      probe.getContext("webgl")) as WebGLRenderingContext | null;

    if (gl) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      cached = "webgl";
    } else {
      cached = "fallback";
    }
  } catch {
    cached = "fallback";
  }

  return cached;
}

const noopSubscribe = () => () => {};

export function useExperienceMode(): ExperienceMode {
  return useSyncExternalStore(
    noopSubscribe,
    detectMode,
    () => "pending" as ExperienceMode
  );
}

/** Particle budget based on screen size and device capability. */
export function pickParticleCount(): number {
  if (typeof window === "undefined") return 3000;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const small = window.innerWidth < 768;
  const lowEnd =
    (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4;
  if (small) return 2400;
  return lowEnd ? 3800 : 6500;
}
