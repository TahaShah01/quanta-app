"use client";

import type { ReactNode } from "react";
import { useExperienceMode } from "@/lib/experience/mode";
import { SectionRail } from "./SectionRail";
import { Preloader } from "./Preloader";
import {
  ConstellationLabels,
  type ConstellationNode,
} from "./ConstellationLabels";

interface HomeExperienceProps {
  nodes: ConstellationNode[];
  railLabel: string;
  preloader: { brand: string; caption: string };
  children: ReactNode;
}

/** Homepage-only layers: intro curtain, service labels and the section rail. */
export function HomeExperience({
  nodes,
  railLabel,
  preloader,
  children,
}: HomeExperienceProps) {
  const mode = useExperienceMode();

  return (
    <>
      <Preloader brand={preloader.brand} caption={preloader.caption} />
      {mode === "webgl" && <ConstellationLabels nodes={nodes} />}
      <SectionRail label={railLabel} />
      <div className="flex w-full flex-col">{children}</div>
    </>
  );
}
