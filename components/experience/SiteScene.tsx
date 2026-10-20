"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { frame } from "@/lib/experience/store";
import { useExperienceMode } from "@/lib/experience/mode";

// three.js and react-three-fiber are only fetched in the browser, and only
// when the device can actually run the scene.
const SceneLayer = dynamic(() => import("./SceneLayer"), { ssr: false });

interface SiteSceneProps {
  counts: { services: number; projects: number; team: number };
}

/** The 3D constellation behind every public page. */
export function SiteScene({ counts }: SiteSceneProps) {
  const mode = useExperienceMode();

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      frame.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      frame.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-scene-hover]");
      if (!el) {
        frame.pulse = 0;
        return;
      }
      const rect = el.getBoundingClientRect();
      frame.pullX = ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1;
      frame.pullY = -(((rect.top + rect.height / 2) / window.innerHeight) * 2 - 1);
      frame.pulse = 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
    };
  }, []);

  if (mode !== "webgl") return null;

  return (
    <SceneLayer
      services={counts.services}
      projects={counts.projects}
      team={counts.team}
    />
  );
}
