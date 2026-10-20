"use client";

import type { ReactNode } from "react";
import { useExperienceMode } from "@/lib/experience/mode";

/**
 * Right-hand slot of the hero. With WebGL the constellation floats here (the
 * canvas is global), so we only reserve space. Without WebGL, reduced motion
 * or data-saver, the original static SVG graphic is shown instead.
 */
export function HeroStage({ fallback }: { fallback: ReactNode }) {
  const mode = useExperienceMode();

  if (mode === "fallback") return <>{fallback}</>;

  return (
    <div
      aria-hidden
      className="hidden aspect-square w-full max-w-[620px] lg:block"
    />
  );
}
