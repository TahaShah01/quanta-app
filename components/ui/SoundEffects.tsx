"use client";

import { useEffect } from "react";
import { isSoundEnabled, playClick, playHover } from "@/lib/sound";

const INTERACTIVE = "a[href], button, [role='button'], [data-sound]";

/** Plays soft ticks on hover and click when the visitor has switched sound on. */
export function SoundEffects() {
  useEffect(() => {
    let last: Element | null = null;

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch" || !isSoundEnabled()) return;
      const el = (e.target as Element | null)?.closest(INTERACTIVE) ?? null;
      if (el && el !== last) playHover();
      last = el;
    };
    const onClick = (e: MouseEvent) => {
      if (!isSoundEnabled()) return;
      if ((e.target as Element | null)?.closest(INTERACTIVE)) playClick();
    };

    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("click", onClick, { passive: true });
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
