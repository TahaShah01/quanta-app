"use client";

import Link from "next/link";
import Image from "@/components/ui/SafeImage";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { TeamMember } from "@/lib/types";

/**
 * Desktop: a row of cards where the hovered / focused one widens (pure CSS
 * flex-grow transition, so it is cheap). Mobile: a stacked list with
 * everything visible.
 */
export function TeamStrip({ team, href }: { team: TeamMember[]; href: string }) {
  return (
    <ul className="flex flex-col gap-3 lg:h-[460px] lg:flex-row">
      {team.map((member, i) => {
        const initials = member.initials || member.name.slice(0, 2).toUpperCase();

        return (
          <motion.li
            key={member.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="group min-w-0 transition-[flex-grow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:grow lg:basis-0 lg:focus-within:grow-[3] lg:hover:grow-[3]"
          >
            <Link
              href={href}
              data-scene-hover
              className="relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors duration-500 hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)] lg:p-6"
            >
              {member.image && (
                <Image
                  src={member.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover opacity-50 transition-opacity duration-700 group-hover:opacity-80"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/80 via-transparent to-transparent" />

              <div className="relative flex items-center justify-between font-mono text-xs text-[var(--muted)]">
                <span>{member.num || String(i + 1).padStart(2, "0")}</span>
                <ArrowUpRight
                  size={16}
                  className="opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                />
              </div>

              {!member.image && (
                <span className="relative my-4 select-none text-6xl font-light tracking-tighter text-[var(--muted)] transition-colors duration-500 group-hover:text-[var(--foreground)] lg:text-8xl">
                  {initials}
                </span>
              )}

              <div className="relative">
                <div className="text-base font-medium text-[var(--foreground)] lg:whitespace-nowrap">
                  {member.name}
                </div>
                <div className="mt-1 font-mono text-[11px] text-[var(--muted)] lg:whitespace-nowrap">
                  {member.role}
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5 transition-all duration-500 lg:max-h-0 lg:overflow-hidden lg:opacity-0 lg:group-focus-within:max-h-24 lg:group-focus-within:opacity-100 lg:group-hover:max-h-24 lg:group-hover:opacity-100">
                  {(member.expertise ?? []).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--secondary)] lg:whitespace-nowrap"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}
