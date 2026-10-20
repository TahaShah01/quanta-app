"use client";

import type { ComponentType, ReactNode } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";

/**
 * One small line drawing per discipline. Each draws itself as `p` runs 0 → 1
 * (the card's scroll-in progress), so the artwork arrives with the panel.
 * Everything is stroked with currentColor / theme variables, so it follows
 * light and dark mode automatically.
 */
export interface MotifProps {
  p: MotionValue<number>;
  /** Ambient loops (blinking lights, flowing data). Off for reduced motion. */
  animated: boolean;
}

function useRamp(p: MotionValue<number>, from: number, to: number) {
  return useTransform(p, [from, to], [0, 1]);
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/* ---------- Frontend: three browser windows stacking up ---------- */

function Win({
  p,
  i,
  x,
  y,
  w,
  h,
}: {
  p: MotionValue<number>;
  i: number;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  const draw = useRamp(p, i * 0.12, 0.55 + i * 0.12);
  const lift = useTransform(p, [0, 1], [26 - i * 7, 0]);
  return (
    <motion.g style={{ y: lift }}>
      <motion.rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill="var(--background)"
        style={{ pathLength: draw }}
      />
      <motion.line x1={x} y1={y + 14} x2={x + w} y2={y + 14} style={{ pathLength: draw }} />
      <circle cx={x + 9} cy={y + 7} r={1.6} fill="currentColor" stroke="none" />
      <circle cx={x + 17} cy={y + 7} r={1.6} fill="currentColor" stroke="none" />
    </motion.g>
  );
}

export function FrontendMotif({ p }: MotifProps) {
  return (
    <Svg>
      <Win p={p} i={0} x={20} y={30} w={112} h={82} />
      <Win p={p} i={1} x={46} y={58} w={112} h={82} />
      <Win p={p} i={2} x={72} y={88} w={108} h={82} />
    </Svg>
  );
}

/* ---------- Design: a bezier curve with its pen-tool handles ---------- */

export function DesignMotif({ p }: MotifProps) {
  const curve = useRamp(p, 0, 0.7);
  const anchors = useRamp(p, 0.3, 0.7);
  const handles = useRamp(p, 0.5, 0.9);
  return (
    <Svg>
      <motion.path
        d="M24 160 C 40 40, 120 30, 150 104 C 180 178, 170 90, 176 48"
        strokeWidth={2}
        style={{ pathLength: curve }}
      />
      <motion.g style={{ opacity: handles }} strokeOpacity={0.55}>
        <line x1={150} y1={104} x2={120} y2={30} />
        <line x1={150} y1={104} x2={180} y2={178} />
        <line x1={24} y1={160} x2={40} y2={40} />
        <line x1={176} y1={48} x2={170} y2={90} />
        <circle cx={120} cy={30} r={2.5} fill="var(--background)" />
        <circle cx={180} cy={178} r={2.5} fill="var(--background)" />
        <circle cx={40} cy={40} r={2.5} fill="var(--background)" />
        <circle cx={170} cy={90} r={2.5} fill="var(--background)" />
      </motion.g>
      <motion.g style={{ opacity: anchors }}>
        <rect x={21} y={157} width={6} height={6} fill="var(--background)" />
        <rect x={147} y={101} width={6} height={6} fill="var(--background)" />
        <rect x={173} y={45} width={6} height={6} fill="var(--background)" />
      </motion.g>
    </Svg>
  );
}

/* ---------- Backend: a server rack with live lights and data flow ---------- */

function Rack({
  p,
  i,
  y,
  animated,
}: {
  p: MotionValue<number>;
  i: number;
  y: number;
  animated: boolean;
}) {
  const draw = useRamp(p, i * 0.14, 0.5 + i * 0.14);
  return (
    <g>
      <motion.rect
        x={30}
        y={y}
        width={128}
        height={34}
        rx={5}
        fill="var(--background)"
        style={{ pathLength: draw }}
      />
      <motion.line x1={42} y1={y + 17} x2={100} y2={y + 17} style={{ pathLength: draw }} />
      <motion.g style={{ opacity: draw }}>
        {[134, 146].map((cx, k) => (
          <motion.circle
            key={cx}
            cx={cx}
            cy={y + 17}
            r={3}
            fill="currentColor"
            stroke="none"
            animate={animated ? { opacity: [1, 0.15, 1] } : undefined}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 + k * 0.7 }}
          />
        ))}
      </motion.g>
    </g>
  );
}

export function BackendMotif({ p, animated }: MotifProps) {
  const rail = useRamp(p, 0.5, 1);
  return (
    <Svg>
      <Rack p={p} i={0} y={38} animated={animated} />
      <Rack p={p} i={1} y={82} animated={animated} />
      <Rack p={p} i={2} y={126} animated={animated} />
      <motion.line x1={180} y1={30} x2={180} y2={172} strokeOpacity={0.4} style={{ pathLength: rail }} />
      {animated &&
        [0, 1].map((k) => (
          <motion.circle
            key={k}
            cx={180}
            r={2.2}
            fill="currentColor"
            stroke="none"
            initial={{ cy: 30 }}
            animate={{ cy: [30, 172] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "linear", delay: k * 1.3 }}
          />
        ))}
    </Svg>
  );
}

/* ---------- QA: a grid of checks passing one by one ---------- */

function Cell({ p, i }: { p: MotionValue<number>; i: number }) {
  const x = 28 + (i % 3) * 48;
  const y = 28 + Math.floor(i / 3) * 48;
  const draw = useRamp(p, i * 0.06, 0.4 + i * 0.06);
  const tick = useRamp(p, 0.35 + i * 0.06, 0.6 + i * 0.06);
  const solid = i === 4;
  return (
    <g>
      <motion.rect
        x={x}
        y={y}
        width={38}
        height={38}
        rx={6}
        fill={solid ? "currentColor" : "none"}
        style={{ pathLength: draw, fillOpacity: solid ? tick : 0 }}
      />
      <motion.path
        d={`M${x + 10} ${y + 20} l 7 7 l 12 -14`}
        stroke={solid ? "var(--background)" : "currentColor"}
        strokeWidth={solid ? 2 : 1.5}
        style={{ pathLength: tick }}
      />
    </g>
  );
}

export function QaMotif({ p }: MotifProps) {
  return (
    <Svg>
      {Array.from({ length: 9 }).map((_, i) => (
        <Cell key={i} p={p} i={i} />
      ))}
    </Svg>
  );
}

/* ---------- Deployment: a launch arc with a moving marker ---------- */

const quad = (t: number, a: number, b: number, c: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;

const STARS: Array<[number, number]> = [
  [150, 150],
  [120, 170],
  [172, 118],
  [92, 132],
  [62, 102],
  [132, 72],
  [40, 142],
];

export function DeployMotif({ p }: MotifProps) {
  const t = useRamp(p, 0, 0.85);
  const x = useTransform(t, (v) => quad(v, 25, 40, 175));
  const y = useTransform(t, (v) => quad(v, 175, 60, 25));
  const stars = useRamp(p, 0.4, 1);
  return (
    <Svg>
      <motion.g style={{ opacity: stars }}>
        {STARS.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.4} fill="currentColor" stroke="none" />
        ))}
      </motion.g>
      <path d="M25 175 Q 40 60 175 25" strokeOpacity={0.3} strokeDasharray="3 6" />
      <motion.path d="M25 175 Q 40 60 175 25" strokeWidth={2} style={{ pathLength: t }} />
      <motion.circle cx={x} cy={y} r={10} fill="var(--background)" />
      <motion.circle cx={x} cy={y} r={3.5} fill="currentColor" stroke="none" />
    </Svg>
  );
}

/* ---------- Fallback: concentric rings with a sweeping hand ---------- */

function Ring({ p, r, i }: { p: MotionValue<number>; r: number; i: number }) {
  const draw = useRamp(p, i * 0.12, 0.5 + i * 0.12);
  return <motion.circle cx={100} cy={100} r={r} style={{ pathLength: draw }} />;
}

export function DefaultMotif({ p }: MotifProps) {
  const angle = useTransform(p, [0, 1], [-Math.PI / 2, Math.PI * 0.9]);
  const x2 = useTransform(angle, (a) => 100 + 88 * Math.cos(a));
  const y2 = useTransform(angle, (a) => 100 + 88 * Math.sin(a));
  return (
    <Svg>
      {[22, 44, 66, 88].map((r, i) => (
        <Ring key={r} p={p} r={r} i={i} />
      ))}
      <motion.line x1={100} y1={100} x2={x2} y2={y2} strokeWidth={2} />
      <circle cx={100} cy={100} r={3} fill="currentColor" stroke="none" />
    </Svg>
  );
}

/* ---------- Picking a motif from the service's own `icon` field ---------- */

const BY_ICON: Record<string, ComponentType<MotifProps>> = {
  monitor: FrontendMotif,
  pen: DesignMotif,
  server: BackendMotif,
  checkcircle: QaMotif,
  rocket: DeployMotif,
};

const CYCLE: Array<ComponentType<MotifProps>> = [
  FrontendMotif,
  DesignMotif,
  BackendMotif,
  QaMotif,
  DeployMotif,
  DefaultMotif,
];

/** Line drawing for a service, chosen from its `icon` field. */
export function ServiceMotif({
  icon,
  index,
  ...props
}: MotifProps & { icon: string | undefined; index: number }) {
  const key = (icon ?? "").toLowerCase().replace(/[\s_-]/g, "");
  const Component = BY_ICON[key] ?? CYCLE[index % CYCLE.length];
  return <Component {...props} />;
}
