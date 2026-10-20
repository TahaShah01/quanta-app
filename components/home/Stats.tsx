"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView } from "framer-motion";
import { useReducedMotion } from "@/lib/experience/useReducedMotion";
import { Container } from "@/components/ui/Container";
import type { HomeContent } from "@/lib/home-types";

function parseValue(value: string): { n: number; suffix: string } | null {
  const match = value.match(/^(\d+)(.*)$/);
  return match ? { n: Number(match[1]), suffix: match[2] } : null;
}

function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduced = useReducedMotion();
  const parsed = parseValue(value);
  const target = parsed?.n;

  useEffect(() => {
    if (!inView || target === undefined || reduced) return;
    const el = ref.current;
    if (!el) return;
    const controls = animate(0, target, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, target, reduced]);

  // Years and other large literals read better static than counting up.
  if (!parsed || parsed.n >= 1000) return <>{value}</>;

  return (
    <>
      <span ref={ref}>{parsed.n}</span>
      {parsed.suffix}
    </>
  );
}

export function Stats({ items }: { items: HomeContent["stats"]["items"] }) {
  if (items.length === 0) return null;

  return (
    <div className="border-t border-[var(--border)] py-20 md:py-28">
      <Container>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-14 lg:grid-cols-4">
          {items.map((item, i) => (
            <div key={`${item.label}-${i}`} className="relative flex flex-col pt-6">
              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: 1.1, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-0 top-0 h-px w-full origin-left bg-[var(--foreground)]/40"
              />
              <dt className="mt-4 max-w-[18ch] text-sm text-[var(--secondary)]">
                {item.label}
              </dt>
              <dd className="order-first text-[clamp(2.75rem,5.4vw,6.5rem)] font-light leading-none tracking-tighter tabular-nums text-[var(--foreground)]">
                <CountUp value={item.value} />
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </div>
  );
}
