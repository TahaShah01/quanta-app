"use client";

import { useSyncExternalStore } from "react";
import { getActiveShape, subscribe, type ShapeId } from "@/lib/experience/store";

// One quiet hue per scene shape. The wash is very low opacity: it should be
// felt more than seen.
const HUES: Record<ShapeId, number> = {
  nexus: 215,
  drift: 255,
  stack: 190,
  lattice: 150,
  orbit: 28,
  crew: 330,
  singularity: 275,
};

/** A faint colour wash behind the page that shifts as sections change. */
export function SectionTint() {
  const shape = useSyncExternalStore(subscribe, getActiveShape, () => "nexus" as ShapeId);

  return (
    <div
      aria-hidden
      className="section-tint pointer-events-none fixed inset-0 z-[1]"
      style={{ "--tint-hue": HUES[shape] } as React.CSSProperties}
    />
  );
}
