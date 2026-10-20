"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useTheme } from "@/components/theme/ThemeProvider";
import { pickParticleCount } from "@/lib/experience/mode";
import { Particles } from "./Particles";

interface SceneLayerProps {
  services: number;
  projects: number;
  team: number;
}

/** Fixed, full-viewport WebGL layer that sits behind the page content. */
export default function SceneLayer({ services, projects, team }: SceneLayerProps) {
  // Theme is read here (DOM side) and passed in as a prop: React context does
  // not reliably cross into the R3F reconciler.
  const { theme } = useTheme();
  const [count] = useState(pickParticleCount);
  const [ready, setReady] = useState(false);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 transition-opacity duration-1000 ${
        ready ? "opacity-100" : "opacity-0"
      }`}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6.5], fov: 45, near: 0.1, far: 50 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
        onCreated={() => setReady(true)}
      >
        <Particles
          count={count}
          services={services}
          projects={projects}
          team={team}
          theme={theme}
        />
      </Canvas>
    </div>
  );
}
