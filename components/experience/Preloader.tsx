"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import {
  introPending,
  markIntroSeen,
  releaseIntro,
  subscribeIntro,
} from "@/lib/experience/intro";
import { WordmarkCanvas, type WordmarkApi } from "@/components/experience/WordmarkCanvas";

const RING = 2 * Math.PI * 28;
/** Seconds of holding to enter, and how long before it opens by itself. */
const HOLD_SECONDS = 0.8;
const AUTO_ENTER_SECONDS = 3.4;
const COUNT_SECONDS = 1.7;

interface PreloaderProps {
  brand: string;
  caption: string;
}

function PreloaderOverlay({ brand, caption }: PreloaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const holdApi = useRef<{ start: () => void; stop: () => void; skip: () => void } | null>(null);
  const wordmarkRef = useRef<WordmarkApi | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    html.dataset.intro = "held";

    const counter = { value: 0 };
    let exited = false;
    let autoCall: gsap.core.Tween | null = null;
    let hold: gsap.core.Tween | null = null;

    const ctx = gsap.context(() => {
      const exit = () => {
        if (exited) return;
        exited = true;
        autoCall?.kill();
        delete html.dataset.intro;
        wordmarkRef.current?.burst();
        // Plain timer on purpose: tweens started from a gsap callback are adopted by
        // this context, and would be reverted (hero hidden again) when it unmounts.
        window.setTimeout(releaseIntro, 200);
        const out = gsap.timeline({
          onComplete: () => {
            html.style.overflow = previousOverflow;
            markIntroSeen();
          },
        });
        out
          .to(".pl-content", { opacity: 0, duration: 0.3, ease: "power1.out" })
          .to(".pl-top", { yPercent: -100, duration: 0.85, ease: "power4.inOut" }, 0.1)
          .to(".pl-bottom", { yPercent: 100, duration: 0.85, ease: "power4.inOut" }, 0.1);
      };

      hold = gsap.to(ringRef.current, {
        strokeDashoffset: 0,
        duration: HOLD_SECONDS,
        ease: "none",
        paused: true,
        onComplete: exit,
      });
      holdApi.current = {
        start: () => hold?.play(),
        stop: () => !exited && hold?.reverse(),
        skip: exit,
      };

      gsap
        .timeline()
        .fromTo(
          ".pl-rise",
          { yPercent: 110 },
          { yPercent: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 },
          0
        )
        .to(
          counter,
          {
            value: 100,
            duration: COUNT_SECONDS,
            ease: "power2.inOut",
            onUpdate: () => {
              if (countRef.current) {
                countRef.current.textContent = String(
                  Math.round(counter.value)
                ).padStart(3, "0");
              }
            },
          },
          0
        )
        .fromTo(
          barRef.current,
          { scaleX: 0 },
          { scaleX: 1, duration: COUNT_SECONDS, ease: "power2.inOut" },
          0
        )
        .fromTo(
          ".pl-enter",
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
          COUNT_SECONDS
        )
        .add(() => {
          autoCall = gsap.delayedCall(AUTO_ENTER_SECONDS - COUNT_SECONDS, exit);
        }, COUNT_SECONDS);
    }, root);

    return () => {
      ctx.revert();
      delete html.dataset.intro;
      html.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      ref={rootRef}
      role="status"
      aria-label={brand}
      className="fixed inset-0 z-[200] overflow-hidden"
    >
      <div className="pl-top absolute inset-x-0 top-0 h-1/2 bg-[var(--background)]" />
      <div className="pl-bottom absolute inset-x-0 bottom-0 h-1/2 bg-[var(--background)]" />

      <div className="pl-content relative flex h-full flex-col justify-between px-6 py-8 md:px-14 md:py-12">
        <WordmarkCanvas text={brand} apiRef={wordmarkRef} />
        <div className="flex items-start justify-between gap-6">
          <span className="block overflow-hidden">
            <span className="pl-rise block text-xl font-medium tracking-tight text-[var(--foreground)]">
              {brand}
            </span>
          </span>
          <span className="block overflow-hidden">
            <span className="pl-rise block text-sm text-[var(--secondary)]">
              {caption}
            </span>
          </span>
        </div>

        <div className="pl-enter absolute bottom-10 right-6 flex justify-center opacity-0 md:bottom-14 md:right-14">
          <button
            type="button"
            aria-label="Hold to enter the site"
            onPointerDown={() => holdApi.current?.start()}
            onPointerUp={() => holdApi.current?.stop()}
            onPointerLeave={() => holdApi.current?.stop()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                holdApi.current?.skip();
              }
            }}
            className="group relative flex h-20 w-20 touch-none items-center justify-center rounded-full text-[var(--foreground)]"
          >
            <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border-hover)" strokeWidth="1.5" />
              <circle
                ref={ringRef}
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="var(--foreground)"
                strokeWidth="1.5"
                strokeDasharray={RING}
                strokeDashoffset={RING}
              />
            </svg>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">Hold</span>
          </button>
        </div>

        <div>
          <span
            ref={countRef}
            className="block text-[clamp(5rem,20vw,17rem)] font-light leading-[0.85] tracking-tighter tabular-nums text-[var(--foreground)]"
          >
            000
          </span>
          <div className="mt-6 h-px w-full bg-[var(--border-hover)]">
            <div
              ref={barRef}
              className="h-px origin-left bg-[var(--foreground)]"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Plays once per browser session on the homepage; skipped for reduced motion. */
export function Preloader(props: PreloaderProps) {
  const pending = useSyncExternalStore(subscribeIntro, introPending, () => false);
  if (!pending) return null;
  // Portal to <body> so it sits above the cookie banner and every other overlay.
  return createPortal(<PreloaderOverlay {...props} />, document.body);
}
