"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import type { FaqItem } from "@/lib/types";

interface FaqSectionProps {
  items: FaqItem[];
}

export function FaqSection({ items }: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  if (!items || items.length === 0) return null;

  return (
    <div id="faq" className="mt-28 pt-20 border-t border-[var(--border)]">
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest text-[var(--accent)] border border-[var(--accent)]/20 bg-[var(--accent)]/5 mb-4">
          <HelpCircle size={13} /> Common Questions
        </div>
        <h2 className="text-3xl md:text-4xl font-medium text-[var(--foreground)] tracking-tight mb-4">
          Frequently asked questions before starting.
        </h2>
        <p className="text-sm md:text-base text-[var(--secondary)] leading-relaxed">
          Everything you need to know about our collaboration model, sprint timelines, pricing, and handover.
        </p>
      </div>

      <div className="max-w-3xl flex flex-col gap-4">
        {items.map((item) => {
          const isOpen = openId === item.id;

          return (
            <div
              key={item.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggle(item.id)}
                className="w-full text-left p-6 flex items-center justify-between gap-4 text-base md:text-lg font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                aria-expanded={isOpen}
              >
                <span>{item.question}</span>
                <ChevronDown
                  size={18}
                  className={`text-[var(--muted)] transition-transform duration-300 shrink-0 ${
                    isOpen ? "rotate-180 text-[var(--accent)]" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-6 pb-6 text-sm text-[var(--secondary)] leading-relaxed border-t border-[var(--border)]/40 pt-4 animate-fade-in">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
