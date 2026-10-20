// Coordinates the one-time preloader with the hero animations.
// Hero reveals call `isIntroHeld()` on mount and wait for `onIntroRelease`,
// which the preloader fires the moment its curtain starts to lift.
// Plain module state (no React) because the hero's effects run before any
// parent component can publish anything.

const KEY = "quanta-intro-seen";
/** Safety net: never keep the hero hidden longer than this. */
const MAX_HOLD_MS = 8000;

let consumed = false;
let released = false;
let safetyTimer: number | undefined;

const seenListeners = new Set<() => void>();
const releaseListeners = new Set<() => void>();

export function introPending(): boolean {
  if (typeof window === "undefined" || consumed) return false;
  try {
    if (window.location.pathname !== "/") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    const pending = window.sessionStorage.getItem(KEY) !== "1";
    if (pending && safetyTimer === undefined) {
      safetyTimer = window.setTimeout(releaseIntro, MAX_HOLD_MS);
    }
    return pending;
  } catch {
    return false;
  }
}

/** True while hero content should stay hidden behind the preloader. */
export function isIntroHeld(): boolean {
  return introPending() && !released;
}

export function onIntroRelease(listener: () => void): () => void {
  releaseListeners.add(listener);
  return () => {
    releaseListeners.delete(listener);
  };
}

export function releaseIntro() {
  if (released) return;
  released = true;
  window.clearTimeout(safetyTimer);
  releaseListeners.forEach((listener) => listener());
  releaseListeners.clear();
}

export function subscribeIntro(listener: () => void): () => void {
  seenListeners.add(listener);
  return () => {
    seenListeners.delete(listener);
  };
}

export function markIntroSeen() {
  consumed = true;
  releaseIntro();
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    // storage unavailable: the intro simply replays next visit
  }
  seenListeners.forEach((listener) => listener());
}
