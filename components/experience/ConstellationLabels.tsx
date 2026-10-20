"use client";

import { useEffect, useRef } from "react";
import { sinks } from "@/lib/experience/store";

export interface ConstellationNode {
  id: string;
  num: string;
  label: string;
}

/**
 * Labels pinned to the 3D nodes. The scene projects each node to screen space
 * every frame and hands the coordinates over through `sinks.labels`; we write
 * them straight to the DOM so React never re-renders at 60fps.
 */
export function ConstellationLabels({ nodes }: { nodes: ConstellationNode[] }) {
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    sinks.labels = (buf, weight) => {
      const items = refs.current;
      for (let i = 0; i < items.length; i++) {
        const el = items[i];
        if (!el) continue;
        el.style.transform = `translate3d(${buf[i * 3]}px, ${buf[i * 3 + 1]}px, 0)`;
        el.style.opacity = String(weight * buf[i * 3 + 2]);
      }
    };
    return () => {
      sinks.labels = null;
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 hidden overflow-hidden lg:block"
    >
      {nodes.map((node, i) => (
        <div
          key={node.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="absolute left-0 top-0 opacity-0 will-change-transform"
        >
          <span className="absolute left-0 top-0 block h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--foreground)] bg-[var(--background)]" />
          <div className="ml-4 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--secondary)]">
            <span className="text-[var(--muted)]">{node.num}</span>
            <span>{node.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
