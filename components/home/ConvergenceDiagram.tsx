"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

export interface DiagramNode {
  id: string;
  num: string;
  label: string;
}

const CENTER = 200;
const RADIUS = 125;

/** Final spot on the ring, plus a deterministic scattered starting spot. */
function place(index: number, count: number) {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / count;
  const side = index % 2 === 0 ? 1 : -1;
  const scatterAngle = angle + side * (0.8 + ((index * 37) % 60) / 100);
  const scatterRadius = RADIUS * (1.12 + ((index * 7) % 5) * 0.06);

  return {
    endX: CENTER + RADIUS * Math.cos(angle),
    endY: CENTER + RADIUS * Math.sin(angle),
    startX: CENTER + scatterRadius * Math.cos(scatterAngle),
    startY: CENTER + scatterRadius * Math.sin(scatterAngle),
    facingRight: Math.cos(angle) >= -0.05,
  };
}

function DiagramPoint({
  node,
  index,
  count,
  progress,
}: {
  node: DiagramNode;
  index: number;
  count: number;
  progress: MotionValue<number>;
}) {
  const { endX, endY, startX, startY, facingRight } = place(index, count);
  const begin = 0.06 + (index / Math.max(count, 1)) * 0.22;
  const finish = begin + 0.4;

  const x = useTransform(progress, [begin, finish], [startX, endX]);
  const y = useTransform(progress, [begin, finish], [startY, endY]);
  const spoke = useTransform(progress, [begin + 0.1, finish], [0, 0.5]);
  const label = useTransform(progress, [begin, begin + 0.15], [0, 1]);

  return (
    <g>
      <motion.line
        x1={CENTER}
        y1={CENTER}
        x2={x}
        y2={y}
        stroke="var(--foreground)"
        strokeWidth={1}
        style={{ opacity: spoke }}
      />
      <motion.circle
        cx={x}
        cy={y}
        r={9}
        fill="var(--background)"
        stroke="var(--foreground)"
        strokeWidth={1}
      />
      <motion.circle cx={x} cy={y} r={3} fill="var(--foreground)" />
      <motion.text
        x={x}
        y={y}
        dx={facingRight ? 16 : -16}
        dy={4}
        textAnchor={facingRight ? "start" : "end"}
        fontSize={11}
        fill="var(--secondary)"
        style={{ opacity: label }}
      >
        <tspan fill="var(--muted)">{node.num} </tspan>
        {node.label}
      </motion.text>
    </g>
  );
}

/**
 * Scroll-scrubbed diagram: the disciplines start scattered and lock into a
 * ring around a shared centre as `progress` runs from 0 to 1.
 */
export function ConvergenceDiagram({
  nodes,
  progress,
  center,
  caption,
}: {
  nodes: DiagramNode[];
  progress: MotionValue<number>;
  center: string;
  caption: string;
}) {
  const ring = useTransform(progress, [0.35, 0.85], [0, 1]);
  const coreRadius = useTransform(progress, [0.05, 0.3], [0, 7]);
  const centerText = useTransform(progress, [0.7, 0.9], [0, 1]);
  const captionOpacity = useTransform(progress, [0.75, 0.95], [0, 1]);
  const captionShift = useTransform(progress, [0.75, 0.95], [12, 0]);

  return (
    <figure className="relative">
      <svg
        viewBox="-80 0 560 400"
        className="w-full overflow-visible"
        role="img"
        aria-label={caption}
      >
        <motion.circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth={1}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          style={{ pathLength: ring, opacity: 0.4 }}
        />

        {nodes.map((node, i) => (
          <DiagramPoint
            key={node.id}
            node={node}
            index={i}
            count={nodes.length}
            progress={progress}
          />
        ))}

        <motion.circle cx={CENTER} cy={CENTER} r={coreRadius} fill="var(--foreground)" />
        <motion.text
          x={CENTER}
          y={CENTER + 30}
          textAnchor="middle"
          fontSize={12}
          fill="var(--foreground)"
          style={{ opacity: centerText }}
        >
          {center}
        </motion.text>
      </svg>

      <motion.figcaption
        style={{ opacity: captionOpacity, y: captionShift }}
        className="mt-2 text-center text-sm text-[var(--secondary)]"
      >
        {caption}
      </motion.figcaption>
    </figure>
  );
}
