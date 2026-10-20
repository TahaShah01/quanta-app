"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * A ring that trails the pointer. It grows over links and buttons, and shows
 * a label over anything marked `data-cursor="View"` (or "Drag", "Scroll"...).
 * The native cursor stays visible, so nothing is lost for anyone.
 */
export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!ring || !label) return;

    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    gsap.set(ring, { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    const moveX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3.out" });
    const moveY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3.out" });

    let state: "idle" | "link" | "label" = "idle";
    let shown = false;

    const setState = (next: typeof state, text = "") => {
      if (next === state && label.textContent === text) return;
      state = next;
      label.textContent = text;
      gsap.to(ring, {
        width: next === "label" ? 88 : next === "link" ? 44 : 22,
        height: next === "label" ? 88 : next === "link" ? 44 : 22,
        backgroundColor: next === "label" ? "var(--foreground)" : "transparent",
        borderColor: next === "label" ? "transparent" : "var(--foreground)",
        duration: 0.35,
        ease: "power3.out",
      });
      gsap.to(label, { opacity: next === "label" ? 1 : 0, duration: 0.2 });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (!shown) {
        shown = true;
        gsap.set(ring, { x: e.clientX, y: e.clientY });
        gsap.to(ring, { opacity: 1, duration: 0.3 });
      }
      moveX(e.clientX);
      moveY(e.clientY);

      const target = e.target as Element | null;
      const tagged = target?.closest<HTMLElement>("[data-cursor]");
      if (tagged) return setState("label", tagged.dataset.cursor);
      if (target?.closest("a[href], button, [role='button'], input, textarea, select")) {
        return setState("link");
      }
      setState("idle");
    };

    const onLeave = () => {
      shown = false;
      gsap.to(ring, { opacity: 0, duration: 0.2 });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ringRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[120] flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[var(--foreground)] opacity-0 mix-blend-normal"
    >
      <span
        ref={labelRef}
        className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--background)] opacity-0"
      />
    </div>
  );
}
