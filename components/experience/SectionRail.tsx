"use client";

import { useSyncExternalStore } from "react";
import {
  getActiveId,
  getSections,
  getServerActiveId,
  getServerSections,
  sinks,
  subscribe,
} from "@/lib/experience/store";

export function SectionRail({ label }: { label: string }) {
  const sections = useSyncExternalStore(subscribe, getSections, getServerSections);
  const activeId = useSyncExternalStore(subscribe, getActiveId, getServerActiveId);

  if (sections.length < 2) return null;

  return (
    <nav
      aria-label={label}
      className="pointer-events-none fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 xl:block"
    >
      <ul className="pointer-events-auto flex flex-col items-end gap-2">
        {sections.map((section) => {
          const on = section.id === activeId;
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => sinks.scrollTo?.(section.id)}
                aria-current={on ? "true" : undefined}
                className="group flex items-center gap-3 py-1.5"
              >
                <span
                  className={`rounded bg-[var(--background)]/80 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-all duration-300 ${
                    on
                      ? "hidden translate-x-0 text-[var(--foreground)] opacity-100 3xl:inline"
                      : "translate-x-2 text-[var(--muted)] opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                  }`}
                >
                  {section.label}
                </span>
                <span
                  className={`block h-px transition-all duration-300 ${
                    on
                      ? "w-8 bg-[var(--foreground)]"
                      : "w-4 bg-[var(--muted)] group-hover:w-6 group-hover:bg-[var(--foreground)]"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
