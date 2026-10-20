"use client";

import React, { createContext, useContext, useCallback, useSyncExternalStore } from "react";

type Theme = "dark" | "light";

export interface ThemeOrigin {
  x: number;
  y: number;
}

interface ThemeContextType {
  theme: Theme;
  /** Pass the click position to make the new theme expand from it. */
  toggleTheme: (origin?: ThemeOrigin) => void;
}

export const originFrom = (e: { clientX: number; clientY: number }): ThemeOrigin => ({
  x: e.clientX,
  y: e.clientY,
});

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
    window.removeEventListener("storage", listener);
  };
}

function getThemeSnapshot(): Theme {
  if (typeof window === "undefined") return "dark";
  const storedTheme = localStorage.getItem("quanta-theme") as Theme | null;
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(
    (origin?: ThemeOrigin) => {
      const nextTheme = theme === "dark" ? "light" : "dark";
      const root = document.documentElement;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const apply = () => {
        root.classList.toggle("light", nextTheme === "light");
        root.classList.toggle("dark", nextTheme === "dark");
        try {
          localStorage.setItem("quanta-theme", nextTheme);
        } catch {
          // storage can be blocked in private windows
        }
        emitChange();
      };

      const withTransition = (
        document as Document & {
          startViewTransition?: (cb: () => void) => { ready: Promise<void> };
        }
      ).startViewTransition;

      if (reducedMotion) {
        apply();
        return;
      }

      if (!withTransition) {
        root.classList.add("theme-transition");
        window.setTimeout(() => root.classList.remove("theme-transition"), 500);
        apply();
        return;
      }

      // Expand the new theme as a circle from where the user clicked.
      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? window.innerHeight / 2;
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );
      const transition = withTransition.call(document, apply);
      transition.ready
        .then(() =>
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            {
              duration: 800,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          )
        )
        .catch(() => {});
    },
    [theme]
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
