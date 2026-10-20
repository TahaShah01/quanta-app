"use client";

import { ReactNode, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  frame,
  registerSection,
  setActive,
  type ShapeId,
} from "@/lib/experience/store";

gsap.registerPlugin(ScrollTrigger);

interface ExperienceSectionProps {
  id: string;
  /** Label shown in the side rail */
  label: string;
  /** Which 3D shape the scene morphs into while this section is on screen */
  shape: ShapeId;
  /** Horizontal framing override for the scene while this section is active */
  offsetX?: number;
  className?: string;
  children: ReactNode;
}

export function ExperienceSection({
  id,
  label,
  shape,
  offsetX,
  className = "",
  children,
}: ExperienceSectionProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const unregister = registerSection({ id, label, shape, offsetX }, el);

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => {
        if (self.isActive) setActive(id);
      },
      onUpdate: (self) => {
        frame.sectionProgress[id] = self.progress;
      },
    });

    return () => {
      trigger.kill();
      unregister();
    };
  }, [id, label, shape, offsetX]);

  return (
    <section ref={ref} id={id} data-section={id} className={className}>
      {children}
    </section>
  );
}
